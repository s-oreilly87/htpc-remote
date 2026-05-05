import { execFile } from "child_process";
import path from "path";
import { ClickType } from "@/constants/remotes";

// NutJS is NOT imported at the top level — it requires X11 and will crash on
// Linux Wayland if loaded eagerly. Dynamic imports below keep it lazy.

const hostIp = process.env.NEXT_PUBLIC_HOST_IP ?? "";
const htpcIp = process.env.NEXT_PUBLIC_HTPC_IP ?? "";
const agentPort = process.env.NEXT_PUBLIC_LINUX_HTPC_AGENT_PORT ?? "3001";

// Remote when HTPC_IP is set, not a loopback address, and differs from HOST_IP.
// Same IP = same machine = run commands locally regardless of OS.
const LOCAL_ADDRESSES = new Set(["", "localhost", "127.0.0.1"]);
export const isRemoteHtpc =
  !LOCAL_ADDRESSES.has(htpcIp) && htpcIp !== hostIp;

/**
 * Run a shell script either locally (when Next.js runs on the HTPC)
 * or via the htpc-agent HTTP server (when Next.js runs on a separate host).
 *
 * Controlled by NEXT_PUBLIC_HTPC_IP:
 *   - empty / localhost / 127.0.0.1 → execFile locally
 *   - any other IP → POST to http://{HTPC_IP}:{HTPC_AGENT_PORT}/run
 */
export async function runCommand(command: string, args: string[] = []): Promise<void> {
  if (isRemoteHtpc) {
    return runRemoteCommand(command, args);
  }
  return runLocalCommand(command, args);
}

async function runRemoteCommand(command: string, args: string[]): Promise<void> {
  const url = `http://${htpcIp}:${agentPort}/run`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ command, args }),
    });
  } catch (error) {
    throw new Error(
      `htpc-agent unreachable at ${url}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(`htpc-agent error: ${body.error ?? res.statusText}`);
  }
}

async function runLocalCommand(command: string, args: string[]): Promise<void> {
  const executable = getExecutable(command);

  await new Promise<void>((resolve, reject) => {
    execFile(executable, args, (error, _stdout, stderr) => {
      if (error) {
        const stderrMessage = stderr?.toString().trim();
        const details = [
          `Command failed: ${executable} ${args.join(" ")}`.trim(),
          typeof error.code === "number" ? `exit code ${error.code}` : undefined,
          stderrMessage || error.message,
        ]
          .filter(Boolean)
          .join(" - ");

        console.error(details);
        reject(new Error(details));
      } else {
        resolve();
      }
    });
  });
}

function getExecutable(command: string): string {
  const prefix = process.env.SHELL_SCRIPT_PREFIX;
  return prefix ? path.join(prefix, command) : command;
}

// ─── Agent helpers ────────────────────────────────────────────────────────────

async function postToAgent(endpoint: string, body: Record<string, unknown> = {}): Promise<void> {
  const url = `http://${htpcIp}:${agentPort}${endpoint}`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (error) {
    throw new Error(
      `htpc-agent unreachable at ${url}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  if (!res.ok) {
    const json = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(`htpc-agent error: ${json.error ?? res.statusText}`);
  }
}

// ─── Mouse click ──────────────────────────────────────────────────────────────

/**
 * Perform a mouse click either via NutJS locally or via the htpc-agent remotely.
 */
export async function runClick(type: ClickType): Promise<void> {
  if (isRemoteHtpc) {
    return postToAgent("/click", { type });
  }

  const { mouse } = await import("@nut-tree/nut-js");
  switch (type) {
    case ClickType.LEFT:
      await mouse.click(0);
      break;
    case ClickType.RIGHT:
      await mouse.click(2);
      break;
    case ClickType.DOUBLE:
      await mouse.doubleClick(0);
      break;
  }
}

// ─── AirMouse disable / reset ─────────────────────────────────────────────────

/**
 * Reset AirMouse state either locally (NutJS nut-state) or via the htpc-agent remotely.
 */
export async function runDisable(): Promise<void> {
  if (isRemoteHtpc) {
    return postToAgent("/disable");
  }

  const { initializeState } = await import("@/api-modules/nutjs/nut-state");
  initializeState();
}
