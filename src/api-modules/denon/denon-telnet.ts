import net from "net";
import { TelnetSocket } from "telnet-stream";
import createDenonEventBus, { type DenonEventBus } from "./denon-telnet-wrapper";
import { DENON_IP } from "@/components/RemotePanels/Denon/denonConstants";

// ─── Parameters ────────────────────────────────────────────────────────────────

const DENON_PORT = 23;

/** After the last data chunk, wait this long before treating a response as complete. */
const RESPONSE_COLLECTION_MS = 100;

/**
 * If no data arrives at all within this window, give up and call the callback
 * with an error. This covers the case where the AVR simply doesn't respond.
 */
const RESPONSE_TIMEOUT_MS = 3000;

/**
 * Minimum gap between commands. The Denon/Marantz AVR can't handle back-to-back
 * commands with no breathing room.
 *
 * NOTE: this is shorter than RESPONSE_COLLECTION_MS (100ms), which means the next
 * command can be written before the previous response is fully collected. In practice
 * this is fine because the AVR responds very quickly, but it is a latent race if
 * responses are slow. A correct fix would be to send the next command only after the
 * previous callback fires, not on a fixed timer.
 */
const COMMAND_INTERVAL_MS = 50;

/** TCP inactivity timeout. Socket is destroyed and will reconnect on next command. */
const SOCKET_INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

// ─── Types ───────────────────────────────────────────────────────────────────

type NodeCallback<T> = (error: string | null, data?: T) => void;

interface CmdQueueItem {
  cmd: string;
  callback: NodeCallback<string[]>;
}

// ─── Class ───────────────────────────────────────────────────────────────────

class DenonTelnet {
  private readonly host: string;
  private connection: DenonEventBus | null = null;
  private busy = false;
  private readonly cmdQueue: CmdQueueItem[] = [];

  // Shared state for the active response handler. Only one command is in-flight
  // at a time, so a single shared buffer is safe as long as commands aren't
  // dispatched before the previous response is collected (see COMMAND_INTERVAL_MS note).
  private receivedLines: string[] = [];
  private responseTimer: ReturnType<typeof setTimeout> | null = null;
  private activeHandler: ((data: Buffer) => void) | null = null;

  constructor(host: string) {
    this.host = host;
  }

  // ─── Connection ──────────────────────────────────────────────────────────

  private resetConnectionState(): void {
    this.connection = null;
    // Clear any in-flight response handler so it doesn't leak
    if (this.responseTimer) {
      clearTimeout(this.responseTimer);
      this.responseTimer = null;
    }
    this.activeHandler = null;
    this.receivedLines = [];
    // Reset busy so the next enqueue() call kicks off a fresh connect attempt
    this.busy = false;
  }

  connect(): void {
    try {
      const socket = net.createConnection({ port: DENON_PORT, host: this.host }, () => {
        console.log("Denon: telnet connected");
        this.processQueue();
      });

      // Set TCP-level inactivity timeout. If no bytes flow for this long, destroy
      // the socket. The next command sent to the queue will trigger a reconnect.
      socket.setTimeout(SOCKET_INACTIVITY_TIMEOUT_MS);
      socket.on("timeout", () => {
        console.log("Denon: socket idle timeout — closing");
        socket.destroy();
      });

      const telnetSocket = new TelnetSocket(socket);

      // Forward raw data from the transport layer into our wrapper's registry.
      // See denon-telnet-wrapper.ts for why this indirection is necessary.
      telnetSocket.on("data", (data: Buffer) => {
        this.connection?.emit("data", data);
      });

      telnetSocket.on("close", () => {
        console.log("Denon: telnet connection closed");
        this.resetConnectionState();
      });

      telnetSocket.on("error", (error: Error) => {
        console.error("Denon: telnet error:", error.message);
        // Do NOT auto-reconnect here — if the AVR is off or unreachable this
        // becomes a tight infinite loop. Instead, reset state so the next
        // queued command triggers a fresh connect attempt.
        this.resetConnectionState();
      });

      this.connection = createDenonEventBus(telnetSocket);
    } catch (err) {
      console.error("Denon: failed to open telnet connection:", err);
    }
  }

  // ─── Queue Processing ────────────────────────────────────────────────────

  private processQueue(): void {
    if (this.cmdQueue.length === 0) {
      this.busy = false;
      return;
    }

    if (!this.connection) {
      this.connect();
      return;
    }

    const item = this.cmdQueue.shift()!;
    this.registerResponseHandler(item.callback);
    this.connection.write(item.cmd + "\r");

    // No-response guard — cleared by the data handler when data arrives
    this.responseTimer = setTimeout(() => {
      if (this.activeHandler) {
        this.connection?.removeListener("data", this.activeHandler);
        this.activeHandler = null;
      }
      this.receivedLines = [];
      item.callback(`Denon: no response to "${item.cmd}"`);
    }, RESPONSE_TIMEOUT_MS);

    setTimeout(() => this.processQueue(), COMMAND_INTERVAL_MS);
  }

  private registerResponseHandler(callback: NodeCallback<string[]>): void {
    const handler = (data: Buffer): void => {
      // First chunk of data — cancel the no-response timer
      if (this.responseTimer) {
        clearTimeout(this.responseTimer);
      }

      const lines = data.toString().trim().split("\r").filter(Boolean);
      this.receivedLines.push(...lines);

      // After a gap with no more data, the response is complete
      this.responseTimer = setTimeout(() => {
        this.connection?.removeListener("data", handler);
        this.activeHandler = null;

        const collected = this.receivedLines;
        this.receivedLines = [];
        callback(null, collected);
      }, RESPONSE_COLLECTION_MS);
    };

    this.activeHandler = handler;
    this.connection?.on("data", handler);
  }

  private enqueue(cmd: string, callback: NodeCallback<string[]>): void {
    this.cmdQueue.push({ cmd, callback });
    if (!this.busy) {
      this.busy = true;
      this.processQueue();
    }
  }

  // ─── Public API ──────────────────────────────────────────────────────────

  /**
   * Send a raw Denon telnet command and receive the response lines.
   * This is the lowest-level method; use it for anything not covered by the
   * typed helpers below.
   */
  cmd(cmd: string, callback: NodeCallback<string[]>): void {
    this.enqueue(cmd, callback);
  }

  // ─── Typed Helpers ───────────────────────────────────────────────────────

  /**
   * Scan each response line for the first match of `regexp` and return capture
   * group 1, or null if no line matches.
   */
  private parseFirstMatch(lines: string[], regexp: RegExp): string | null {
    for (const line of lines) {
      const match = regexp.exec(line);
      if (match) return match[1];
    }
    return null;
  }

  getMuteState(zone: string | null, callback: NodeCallback<boolean>): void {
    // Main zone uses bare "MU"; other zones prefix (e.g. "Z2MU")
    const prefix = !zone || zone === "ZM" ? "" : zone;
    const regexp = RegExp(`(?:^|[\r])${prefix}MU(ON|OFF)`);

    this.enqueue(`${prefix}MU?`, (error, data) => {
      if (error || !data) return callback(error ?? "Denon: no data for mute query");
      const state = this.parseFirstMatch(data, regexp);
      if (state) {
        callback(null, state === "ON");
      } else {
        callback("Denon: mute state not found in response");
      }
    });
  }

  setMuteState(muted: boolean, zone: string | null, callback: NodeCallback<boolean>): void {
    const prefix = !zone || zone === "ZM" ? "" : zone;
    this.enqueue(`${prefix}MU${muted ? "ON" : "OFF"}`, (error) => {
      if (error) return callback(error);
      callback(null, muted);
    });
  }

  getZonePowerState(zone: string | null, callback: NodeCallback<boolean>): void {
    // Main zone power uses "ZM"; other zones use their own prefix (Z2, Z3…)
    const prefix = !zone || zone === "ZM" ? "ZM" : zone;
    const regexp = RegExp(`(?:^|[\r])${prefix}(ON|OFF)`);

    this.enqueue(`${prefix}?`, (error, data) => {
      if (error || !data) return callback(error ?? "Denon: no data for power query");
      const state = this.parseFirstMatch(data, regexp);
      if (state) {
        callback(null, state === "ON");
      } else {
        callback("Denon: power state not found in response");
      }
    });
  }

  setZonePowerState(on: boolean, zone: string | null, callback: NodeCallback<boolean>): void {
    const prefix = !zone || zone === "ZM" ? "ZM" : zone;
    this.enqueue(`${prefix}${on ? "ON" : "OFF"}`, (error) => {
      if (error) return callback(error);
      callback(null, on);
    });
  }

  /**
   * Get the master volume as a decimal number (e.g. 50.5 for –49.5 dB on a Denon).
   *
   * Denon encodes volume as 2 or 3 digits: "80" = 80.0, "805" = 80.5.
   * The regexp captures those digits; we normalise to a float via the slice trick:
   *   "80"  → "80"  + "0" → slice(0,3) → "800" → 800 * 0.1 → 80.0
   *   "805" → "805" + "0" → slice(0,3) → "805" → 805 * 0.1 → 80.5
   */
  getVolume(zone: string | null, callback: NodeCallback<number>): void {
    const prefix = !zone || zone === "ZM" ? "MV" : zone;
    const regexp = RegExp(`(?:^|[\r])${prefix}(\\d+)`);

    this.enqueue(`${prefix}?`, (error, data) => {
      if (error || !data) return callback(error ?? "Denon: no data for volume query");
      const raw = this.parseFirstMatch(data, regexp);
      if (raw) {
        callback(null, parseInt((raw + "0").slice(0, 3), 10) * 0.1);
      } else {
        callback("Denon: volume not found in response");
      }
    });
  }

  /**
   * Set the master volume. Accepts a decimal (e.g. 50.5).
   *
   * Encoding: multiply by 10, zero-pad to at least 3 digits.
   *   80.0 → "800" → MV800 ✓   (Denon accepts 3-digit form for whole steps)
   *   80.5 → "805" → MV805 ✓
   *    5.0 →  "50" → "050" → MV050 ✓
   */
  setVolume(volume: number, zone: string | null, callback: NodeCallback<number>): void {
    const prefix = !zone || zone === "ZM" ? "MV" : zone;
    const encoded = String(Math.round(volume * 10)).padStart(3, "0");

    this.enqueue(`${prefix}${encoded}`, (error) => {
      if (error) return callback(error);
      callback(null, volume);
    });
  }
}

// ─── Singleton ───────────────────────────────────────────────────────────────
//
// Next.js API routes are re-imported on every request in dev, but the Node.js
// module cache is shared across hot reloads. Stashing the instance on `global`
// ensures we reuse a single telnet connection rather than opening a new one per
// request.

declare global {
  // eslint-disable-next-line no-var
  var _denonTelnet: DenonTelnet | undefined;
}

if (!global._denonTelnet) {
  global._denonTelnet = new DenonTelnet(DENON_IP);
}

export default global._denonTelnet;
