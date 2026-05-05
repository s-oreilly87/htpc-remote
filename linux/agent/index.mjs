/**
 * HTPC Agent (Linux)
 *
 * Runs permanently on the Linux HTPC. Exposes two interfaces:
 *
 *   HTTP  POST /run       { command, args }  — shell script dispatch
 *   HTTP  POST /click     { type }           — mouse click via ydotool
 *   HTTP  POST /disable   {}                 — reset airmouse state
 *   WS    socket.io                          — AirMouse orientation stream
 *
 * Allows the Next.js server to run on a separate machine (e.g. a Mac for
 * development) and still control the HTPC. When Next.js runs ON the HTPC,
 * this agent is not needed — commands execute directly via child_process
 * and the socket.io server is embedded in Next.js.
 *
 * Environment variables:
 *   LINUX_HTPC_AGENT_PORT  Port to listen on (default: 3001)
 *   SHELL_SCRIPT_PREFIX    Path prefix for shell scripts, e.g. /home/user/bin
 *   HTPC_SCREEN_WIDTH      Display width in px  (default: 3840) — used for mouse clamping
 *   HTPC_SCREEN_HEIGHT     Display height in px (default: 2160)
 */

import { execFile } from "child_process";
import http from "http";
import path from "path";
import { Server } from "socket.io";

const PORT = parseInt(process.env.LINUX_HTPC_AGENT_PORT ?? "3001", 10);
const SCRIPT_PREFIX = process.env.SHELL_SCRIPT_PREFIX ?? "";
const SCREEN_WIDTH = parseInt(process.env.HTPC_SCREEN_WIDTH ?? "3840", 10);
const SCREEN_HEIGHT = parseInt(process.env.HTPC_SCREEN_HEIGHT ?? "2160", 10);

// ─── Shell command dispatch ───────────────────────────────────────────────────

const ALLOWED_COMMANDS = new Set([
  "htpc-res",
  "htpc-audio",
  "htpc-launch",
  "htpc-kill",
  "htpc-key",
  "htpc-listen",
]);

function getExecutable(command) {
  return SCRIPT_PREFIX ? path.join(SCRIPT_PREFIX, command) : command;
}

function runCommand(command, args = []) {
  return new Promise((resolve, reject) => {
    const executable = getExecutable(command);
    execFile(executable, args, (error, stdout, stderr) => {
      if (error) {
        const details = [
          `Command failed: ${executable} ${args.join(" ")}`.trim(),
          typeof error.code === "number" ? `exit code ${error.code}` : undefined,
          stderr?.toString().trim() || error.message,
        ]
          .filter(Boolean)
          .join(" - ");
        reject(new Error(details));
      } else {
        resolve(stdout);
      }
    });
  });
}

// ─── AirMouse / ydotool mouse control ────────────────────────────────────────

/** Maps click type string → ydotool button code */
const CLICK_TYPE_MAP = { left: "0x40", right: "0x80", double: "0x40" };

function ydotoolMove(x, y) {
  return new Promise((resolve, reject) => {
    execFile(
      "ydotool",
      ["mousemove", "--absolute", "-x", String(Math.round(x)), "-y", String(Math.round(y))],
      (error) => (error ? reject(error) : resolve()),
    );
  });
}

function ydotoolClick(buttonCode) {
  return new Promise((resolve, reject) => {
    execFile("ydotool", ["click", buttonCode], (error) =>
      error ? reject(error) : resolve(),
    );
  });
}

// AirMouse state — mirrors initializeSocket.ts on the Next.js server
const airmouseState = {
  isInitialized: false,
  awaitingInitialization: false,
  defaultRawOrientation: { x: 0, y: 0 },
  centeredPosition: { x: SCREEN_WIDTH / 2, y: SCREEN_HEIGHT / 2 },
  scaleFactor: { x: 12000, y: 7000 },
  calibrationRange: { xMin: null, xMax: null, yMin: null, yMax: null },
};

function resetAirmouseState() {
  airmouseState.isInitialized = false;
  airmouseState.awaitingInitialization = false;
  airmouseState.defaultRawOrientation = { x: 0, y: 0 };
  airmouseState.centeredPosition = { x: SCREEN_WIDTH / 2, y: SCREEN_HEIGHT / 2 };
  airmouseState.scaleFactor = { x: 12000, y: 7000 };
  airmouseState.calibrationRange = { xMin: null, xMax: null, yMin: null, yMax: null };
}

async function initializeAirmouse(x, y) {
  airmouseState.awaitingInitialization = true;
  airmouseState.defaultRawOrientation = { x, y };
  airmouseState.centeredPosition = { x: SCREEN_WIDTH / 2, y: SCREEN_HEIGHT / 2 };
  await ydotoolMove(airmouseState.centeredPosition.x, airmouseState.centeredPosition.y);
  airmouseState.isInitialized = true;
  airmouseState.awaitingInitialization = false;
  console.log(`AirMouse initialized — screen ${SCREEN_WIDTH}x${SCREEN_HEIGHT}`);
}

function computeMousePosition(x, y) {
  const dx = x - airmouseState.defaultRawOrientation.x;
  const dy = y - airmouseState.defaultRawOrientation.y;

  let lerpedX = -((dx / (Math.PI / 3)) * 0.75);
  let lerpedY = -(dy / (Math.PI / 4));
  lerpedX = Math.max(-1, Math.min(1, lerpedX));
  lerpedY = Math.max(-1, Math.min(1, lerpedY));

  const newX = airmouseState.centeredPosition.x + lerpedX * airmouseState.scaleFactor.x;
  const newY = airmouseState.centeredPosition.y + lerpedY * airmouseState.scaleFactor.y;

  return {
    x: Math.max(0, Math.min(SCREEN_WIDTH - 1, newX)),
    y: Math.max(0, Math.min(SCREEN_HEIGHT - 1, newY)),
  };
}

let busy = false;
async function handleOrientation({ x: rawX, y: rawY }) {
  if (busy) return;
  busy = true;
  try {
    const x = Number(rawX);
    const y = Number(rawY);
    if (Number.isNaN(x) || Number.isNaN(y)) return;

    if (!airmouseState.isInitialized) {
      if (!airmouseState.awaitingInitialization) await initializeAirmouse(x, y);
      return;
    }

    const pos = computeMousePosition(x, y);
    await ydotoolMove(pos.x, pos.y);
  } catch (err) {
    console.error("orientation error:", err.message);
  } finally {
    busy = false;
  }
}

// ─── HTTP server ──────────────────────────────────────────────────────────────

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });
    req.on("error", reject);
  });
}

function send(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(payload),
  });
  res.end(payload);
}

const httpServer = http.createServer(async (req, res) => {
  if (req.method !== "POST") {
    send(res, 405, { ok: false, error: "Method Not Allowed" });
    return;
  }

  let body;
  try {
    body = await parseBody(req);
  } catch {
    send(res, 400, { ok: false, error: "Invalid JSON" });
    return;
  }

  // POST /run — shell script dispatch
  if (req.url === "/run") {
    const { command, args = [] } = body;
    if (!command || !ALLOWED_COMMANDS.has(command)) {
      send(res, 400, { ok: false, error: `Command not allowed: ${command}` });
      return;
    }
    if (!Array.isArray(args) || args.some((a) => typeof a !== "string")) {
      send(res, 400, { ok: false, error: "args must be an array of strings" });
      return;
    }
    try {
      await runCommand(command, args);
      send(res, 200, { ok: true });
    } catch (error) {
      console.error(error.message);
      send(res, 500, { ok: false, error: error.message });
    }
    return;
  }

  // POST /click — ydotool mouse click
  if (req.url === "/click") {
    const { type } = body;
    const buttonCode = CLICK_TYPE_MAP[type];
    if (!buttonCode) {
      send(res, 400, { ok: false, error: `Unknown click type: ${type}` });
      return;
    }
    try {
      if (type === "double") {
        await ydotoolClick(buttonCode);
        await ydotoolClick(buttonCode);
      } else {
        await ydotoolClick(buttonCode);
      }
      send(res, 200, { ok: true });
    } catch (error) {
      send(res, 500, { ok: false, error: error.message });
    }
    return;
  }

  // POST /disable — reset airmouse state
  if (req.url === "/disable") {
    resetAirmouseState();
    send(res, 200, { ok: true });
    return;
  }

  send(res, 404, { ok: false, error: "Not found" });
});

// ─── Socket.io — AirMouse orientation stream ─────────────────────────────────

const io = new Server(httpServer, {
  cors: { origin: "*" },
});

io.on("connection", (socket) => {
  console.log("AirMouse socket connected");
  socket.on("orientation", (payload) => void handleOrientation(payload));
  socket.on("disconnect", () => console.log("AirMouse socket disconnected"));
});

httpServer.listen(PORT, () => {
  console.log(`htpc-agent listening on port ${PORT}`);
});
