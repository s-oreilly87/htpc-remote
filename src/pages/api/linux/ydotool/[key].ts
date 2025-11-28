import type { NextApiRequest, NextApiResponse } from "next";

import { ApiResponse, KeyAction } from "@/constants/htpcControls";
import { KEYSTROKE } from "@/utilities/constants";

import { runCommand } from "../../lib/command";

const KEYSTROKE_TO_ACTION: Partial<Record<string, KeyAction>> = {
    [KEYSTROKE.PC.ENTER]: KeyAction.Enter,
    [KEYSTROKE.PC.ALT_TAB]: KeyAction.AltTab,
    [KEYSTROKE.PC.ESCAPE]: KeyAction.Esc,
    [KEYSTROKE.PC.TAB]: KeyAction.Tab,
    [KEYSTROKE.PC.UP]: KeyAction.Up,
    [KEYSTROKE.PC.DOWN]: KeyAction.Down,
    [KEYSTROKE.PC.LEFT]: KeyAction.Left,
    [KEYSTROKE.PC.RIGHT]: KeyAction.Right,
    [KEYSTROKE.PC.VOL_UP]: KeyAction.VolUp,
    [KEYSTROKE.PC.VOL_DOWN]: KeyAction.VolDown,
    [KEYSTROKE.PC.MUTE]: KeyAction.Mute,
    [KEYSTROKE.PC.PREV]: KeyAction.Prev,
    [KEYSTROKE.PC.REWIND]: KeyAction.Left,
    [KEYSTROKE.PC.PLAY]: KeyAction.PlayPause,
    [KEYSTROKE.PC.FFWD]: KeyAction.Right,
    [KEYSTROKE.PC.NEXT]: KeyAction.Next,
    [KEYSTROKE.PC.BACKSPACE]: KeyAction.Back,
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

function mapKeyToAction(key: string): { action: KeyAction; text?: string } | null {
  if (key.length === 1) {
    return { action: KeyAction.Type, text: key };
  }

  const mappedAction = KEYSTROKE_TO_ACTION[key];
  if (!mappedAction) {
      if (key.startsWith("KEYSTROKE_")) {
          return { action: KeyAction.Type, text: key.slice(10) };
      }
    return null;
  }

  if (mappedAction === KeyAction.Type) {
    return { action: mappedAction, text: key };
  }

  return { action: mappedAction };
}

async function performAction(payload: { action: KeyAction; text?: string }): Promise<void> {
  switch (payload.action) {
    case KeyAction.AltTab:
      await handleAltTab();
      break;
    case KeyAction.AltDown:
      await holdAlt();
      break;
    case KeyAction.AltUp:
      await releaseAlt();
      break;
    case KeyAction.Type:
      await runCommand("htpc-key", [payload.action, payload.text ?? ""]);
      break;
    default:
      await runCommand("htpc-key", [payload.action]);
      break;
  }
}

async function handleAltTab(): Promise<void> {
  await holdAlt();
  await runCommand("htpc-key", [KeyAction.Tab]);

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

  await runCommand("htpc-key", [KeyAction.AltDown]);
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

  await runCommand("htpc-key", [KeyAction.AltUp]);
  isAltHeld = false;
}
