import type { NextApiRequest, NextApiResponse } from "next";

import { ApiResponse, LinuxKeyAction } from "@/constants/htpcControls";
import { KEYSTROKE } from "@/utilities/constants";

import { runCommand } from "../../lib/command";

const KEYSTROKE_TO_ACTION: Partial<Record<string, LinuxKeyAction>> = {
    [KEYSTROKE.PC.ENTER]: LinuxKeyAction.Enter,
    [KEYSTROKE.PC.ALT_TAB]: LinuxKeyAction.AltTab,
    [KEYSTROKE.PC.ESCAPE]: LinuxKeyAction.Esc,
    [KEYSTROKE.PC.TAB]: LinuxKeyAction.Tab,
    [KEYSTROKE.PC.UP]: LinuxKeyAction.Up,
    [KEYSTROKE.PC.DOWN]: LinuxKeyAction.Down,
    [KEYSTROKE.PC.LEFT]: LinuxKeyAction.Left,
    [KEYSTROKE.PC.RIGHT]: LinuxKeyAction.Right,
    [KEYSTROKE.PC.VOL_UP]: LinuxKeyAction.VolUp,
    [KEYSTROKE.PC.VOL_DOWN]: LinuxKeyAction.VolDown,
    [KEYSTROKE.PC.MUTE]: LinuxKeyAction.Mute,
    [KEYSTROKE.PC.PREV]: LinuxKeyAction.Prev,
    [KEYSTROKE.PC.REWIND]: LinuxKeyAction.Left,
    [KEYSTROKE.PC.PLAY]: LinuxKeyAction.PlayPause,
    [KEYSTROKE.PC.FFWD]: LinuxKeyAction.Right,
    [KEYSTROKE.PC.NEXT]: LinuxKeyAction.Next,
    [KEYSTROKE.PC.BACKSPACE]: LinuxKeyAction.Back,
    [KEYSTROKE.PC.CLOSE_WINDOW]: LinuxKeyAction.CloseWindow,
};

const ALT_HOLD_DURATION_MS = 1500;
let altHoldTimeout: ReturnType<typeof setTimeout> | null = null;
let isAltHeld = false;

export default async function handleYdotoolKeystroke(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
): Promise<void> {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    res.status(405).json({ ok: false, error: "Method Not Allowed" });
    return;
  }

  const queryKey = req.query.key;

  const key = Array.isArray(queryKey) ? queryKey[0] ?? "" : queryKey ?? "";

  if (!key) {
    res.status(400).json({ ok: false, error: "Missing key" });
    return;
  }

  const payload = mapKeyToAction(key);
  if (!payload) {
    res.status(400).json({ ok: false, error: "Unsupported key" });
    return;
  }

  try {
    await performAction(payload);
    res.status(200).json({ ok: true });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ ok: false, error: message });
  }
}

function mapKeyToAction(key: string): { action: LinuxKeyAction; text?: string } | null {
  if (key.length === 1) {
    return { action: LinuxKeyAction.Type, text: key };
  }

  const mappedAction = KEYSTROKE_TO_ACTION[key];
  if (!mappedAction) {
      if (key.startsWith("KEYSTROKE_")) {
          return { action: LinuxKeyAction.Type, text: key.slice(10) };
      }
    return null;
  }

  if (mappedAction === LinuxKeyAction.Type) {
    return { action: mappedAction, text: key };
  }

  return { action: mappedAction };
}

async function performAction(payload: { action: LinuxKeyAction; text?: string }): Promise<void> {
  switch (payload.action) {
    case LinuxKeyAction.AltTab:
      await handleAltTab();
      break;
    case LinuxKeyAction.AltDown:
      await holdAlt();
      break;
    case LinuxKeyAction.AltUp:
      await releaseAlt();
      break;
    case LinuxKeyAction.Type:
      await runCommand("htpc-key", [payload.action, payload.text ?? ""]);
      break;
    default:
      await runCommand("htpc-key", [payload.action]);
      break;
  }
}

async function handleAltTab(): Promise<void> {
  await holdAlt();
  await runCommand("htpc-key", [LinuxKeyAction.Tab]);

  if (altHoldTimeout) {
    clearTimeout(altHoldTimeout);
  }

  altHoldTimeout = setTimeout(() => {
    releaseAlt().catch((error) => console.error("alt-up failed", error));
  }, ALT_HOLD_DURATION_MS);
}

async function holdAlt(): Promise<void> {
  if (isAltHeld) {
    return;
  }

  await runCommand("htpc-key", [LinuxKeyAction.AltDown]);
  isAltHeld = true;
}

async function releaseAlt(): Promise<void> {
  if (altHoldTimeout) {
    clearTimeout(altHoldTimeout);
    altHoldTimeout = null;
  }

  if (!isAltHeld) {
    return;
  }

  await runCommand("htpc-key", [LinuxKeyAction.AltUp]);
  isAltHeld = false;
}
