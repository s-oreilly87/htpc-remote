import net from "net";
import { TelnetSocket } from "telnet-stream";
import { DENON_IP } from "@/constants/denon";

type NodeCallback<T> = (error: string | null, data?: T) => void;
interface CmdQueueItem {
  cmd: string;
  callback: NodeCallback<string[]>;
  queueDeadline?: ReturnType<typeof setTimeout>;
}
interface Options {
  port?: number;
  responseTimeoutMs?: number;
  collectionMs?: number;
  connectTimeoutMs?: number;
}

/** One command owns the stream until its matching response completes. */
export class DenonTelnet {
  private socket: net.Socket | null = null;
  private transport: TelnetSocket | null = null;
  private connected = false;
  private readonly cmdQueue: CmdQueueItem[] = [];
  private active: CmdQueueItem | null = null;
  private lines: string[] = [];
  private fragment = "";
  private deadline: ReturnType<typeof setTimeout> | null = null;
  private collection: ReturnType<typeof setTimeout> | null = null;
  private connectionDeadline: ReturnType<typeof setTimeout> | null = null;
  private nextCommand: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly host: string,
    private readonly options: Options = {},
  ) {}

  private clearResponseTimers(): void {
    if (this.deadline) clearTimeout(this.deadline);
    if (this.collection) clearTimeout(this.collection);
    this.deadline = this.collection = null;
  }

  /** Disconnect fails the whole pending batch once; a later request may reconnect. */
  private failConnection(socket: net.Socket, error: string): void {
    if (this.socket !== socket) return; // Ignore events from an old connection.
    this.clearResponseTimers();
    if (this.connectionDeadline) clearTimeout(this.connectionDeadline);
    if (this.nextCommand) clearTimeout(this.nextCommand);
    this.connectionDeadline = this.nextCommand = null;
    this.socket = null;
    this.transport = null;
    this.connected = false;
    this.fragment = "";
    this.lines = [];
    const pending = [
      ...(this.active ? [this.active] : []),
      ...this.cmdQueue.splice(0),
    ];
    this.active = null;
    socket.destroy();
    for (const item of pending) {
      if (item.queueDeadline) clearTimeout(item.queueDeadline);
      item.callback(error);
    }
  }

  connect(): void {
    if (this.socket) return;
    const socket = net.createConnection({
      port: this.options.port ?? 23,
      host: this.host,
    });
    this.socket = socket;
    const fail = (message: string) => this.failConnection(socket, message);
    // net.Socket emits errors independently of the Telnet transform.
    socket.on("error", (error) => fail(`Denon: ${error.message}`));
    socket.on("close", () => fail("Denon: connection closed"));
    socket.setTimeout(5 * 60 * 1000, () => fail("Denon: socket idle timeout"));
    this.connectionDeadline = setTimeout(
      () => fail("Denon: connection timed out"),
      this.options.connectTimeoutMs ?? 3000,
    );
    const transport = new TelnetSocket(socket);
    this.transport = transport;
    transport.on("error", (error: Error) => fail(`Denon: ${error.message}`));
    transport.on("data", (data: Buffer) => {
      if (this.socket === socket) this.receive(data);
    });
    socket.on("connect", () => {
      if (this.socket !== socket) return;
      if (this.connectionDeadline) clearTimeout(this.connectionDeadline);
      this.connectionDeadline = null;
      this.connected = true;
      this.processQueue();
    });
  }

  private matchesResponse(line: string, command: string): boolean {
    const prefix = command.replace(/\s*\?.*$/, "").trim();
    if (prefix === "ZM") return /^ZM(ON|OFF)$/.test(line);
    if (prefix === "MU") return /^MU(ON|OFF)$/.test(line);
    if (prefix === "MV") return /^MV\d+$/.test(line); // MVMAX is unsolicited metadata.
    if (!command.includes("?")) {
      const zonePower = /^(Z[2-3]|ZM)(ON|OFF)$/.exec(command);
      if (zonePower || /^(MU(ON|OFF)|MV\d+)$/.test(command))
        return line === command;
      return line.startsWith(command.split(" ")[0].slice(0, 2));
    }
    return line.startsWith(prefix);
  }

  private receive(data: Buffer): void {
    this.fragment += data.toString();
    const complete = this.fragment.split("\r");
    this.fragment = complete.pop() ?? "";
    for (const raw of complete) {
      const line = raw.trim();
      if (!this.active || !this.matchesResponse(line, this.active.cmd))
        continue;
      this.lines.push(line);
      if (this.collection) clearTimeout(this.collection);
      this.collection = setTimeout(
        () => this.finish(),
        this.options.collectionMs ?? 100,
      );
    }
  }

  private finish(): void {
    const item = this.active;
    if (!item) return;
    this.clearResponseTimers();
    this.active = null;
    const lines = this.lines;
    this.lines = [];
    // Enqueues during the callback must also respect the inter-command gap.
    this.nextCommand = setTimeout(() => {
      this.nextCommand = null;
      this.processQueue();
    }, 50);
    item.callback(null, lines);
  }

  private processQueue(): void {
    if (this.active || this.nextCommand || !this.cmdQueue.length) return;
    if (!this.socket) return this.connect();
    if (!this.connected) return;
    const item = this.cmdQueue.shift()!;
    if (item.queueDeadline) clearTimeout(item.queueDeadline);
    this.active = item;
    this.lines = [];
    this.fragment = "";
    this.deadline = setTimeout(() => {
      if (this.socket)
        this.failConnection(this.socket, `Denon: no response to "${item.cmd}"`);
    }, this.options.responseTimeoutMs ?? 3000);
    try {
      this.transport!.write(item.cmd + "\r");
    } catch (error) {
      this.failConnection(this.socket, `Denon: ${String(error)}`);
    }
  }

  private enqueue(cmd: string, callback: NodeCallback<string[]>): void {
    const item: CmdQueueItem = { cmd, callback };
    item.queueDeadline = setTimeout(() => {
      const index = this.cmdQueue.indexOf(item);
      if (index < 0) return;
      this.cmdQueue.splice(index, 1);
      callback(`Denon: queue timed out for "${cmd}"`);
    }, 8000);
    this.cmdQueue.push(item);
    this.processQueue();
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
      if (error || !data)
        return callback(error ?? "Denon: no data for mute query");
      const state = this.parseFirstMatch(data, regexp);
      if (state) {
        callback(null, state === "ON");
      } else {
        callback("Denon: mute state not found in response");
      }
    });
  }

  setMuteState(
    muted: boolean,
    zone: string | null,
    callback: NodeCallback<boolean>,
  ): void {
    const prefix = !zone || zone === "ZM" ? "" : zone;
    this.enqueue(`${prefix}MU${muted ? "ON" : "OFF"}`, (error) => {
      if (error) return callback(error);
      callback(null, muted);
    });
  }

  getZonePowerState(
    zone: string | null,
    callback: NodeCallback<boolean>,
  ): void {
    // Main zone power uses "ZM"; other zones use their own prefix (Z2, Z3…)
    const prefix = !zone || zone === "ZM" ? "ZM" : zone;
    const regexp = RegExp(`(?:^|[\r])${prefix}(ON|OFF)`);

    this.enqueue(`${prefix}?`, (error, data) => {
      if (error || !data)
        return callback(error ?? "Denon: no data for power query");
      const state = this.parseFirstMatch(data, regexp);
      if (state) {
        callback(null, state === "ON");
      } else {
        callback("Denon: power state not found in response");
      }
    });
  }

  setZonePowerState(
    on: boolean,
    zone: string | null,
    callback: NodeCallback<boolean>,
  ): void {
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
      if (error || !data)
        return callback(error ?? "Denon: no data for volume query");
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
  setVolume(
    volume: number,
    zone: string | null,
    callback: NodeCallback<number>,
  ): void {
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
  var _denonTelnet: DenonTelnet | undefined;
}

if (!global._denonTelnet) {
  global._denonTelnet = new DenonTelnet(DENON_IP);
}

export default global._denonTelnet;
