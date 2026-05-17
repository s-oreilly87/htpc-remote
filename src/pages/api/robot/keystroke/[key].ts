import * as robot from "@jitsi/robotjs";
import type { NextApiRequest, NextApiResponse } from "next";

import { KEYSTROKE } from "@/constants/remotes";
import { getPlatformInfo } from "@/hooks/usePlatform";
import { libnutTypeString } from "../libnut-macos";

const { platform: PLATFORM, isMac, isLinux, isWindows } = getPlatformInfo();

// On macOS and Windows the "super" modifier is 'command'; on Linux it's 'super'.
const superMod = (isMac || isWindows) ? "command" : "super";

type RobotKey = { key: string; modifiers?: string[] };

// Maps KEYSTROKE constants to robotjs key names + optional modifier list.
// REWIND/FFWD/OK share values with LEFT/RIGHT/ENTER so no separate entries needed.
const keyMap: Record<string, RobotKey> = {
  [KEYSTROKE.PC.ENTER]:               { key: "enter" },
  [KEYSTROKE.PC.BACKSPACE]:           { key: "backspace" },
  [KEYSTROKE.PC.WIN_KEY]:             isLinux
    ? { key: "space", modifiers: ["alt"] }
    : isMac
      ? { key: "space", modifiers: [superMod] }
      : { key: superMod },
  [KEYSTROKE.PC.ALT_TAB]:             { key: "tab",   modifiers: ["alt"] },  // sticky-alt — see handler
  [KEYSTROKE.PC.ESCAPE]:              { key: "escape" },
  [KEYSTROKE.PC.TAB]:                 { key: "tab" },
  [KEYSTROKE.PC.UP]:                  { key: "up" },
  [KEYSTROKE.PC.DOWN]:                { key: "down" },
  [KEYSTROKE.PC.LEFT]:                { key: "left" },
  [KEYSTROKE.PC.RIGHT]:               { key: "right" },
  [KEYSTROKE.PC.VOL_UP]:              { key: "audio_vol_up" },
  [KEYSTROKE.PC.VOL_DOWN]:            { key: "audio_vol_down" },
  [KEYSTROKE.PC.MUTE]:                { key: "audio_mute" },
  [KEYSTROKE.PC.PREV]:                { key: "audio_prev" },
  [KEYSTROKE.PC.PLAY]:                { key: "audio_play" },
  [KEYSTROKE.PC.NEXT]:                { key: "audio_next" },
  [KEYSTROKE.KEY_COMBOS.MOVE_WINDOW]: { key: "left", modifiers: [superMod, "shift"] },
};

robot.setKeyboardDelay(50);

// Tracks a pending alt-release for the sticky Alt+Tab behaviour.
let altReleaseTimeout: NodeJS.Timeout | null = null;

export default function handleKeystroke(
  req: NextApiRequest,
  res: NextApiResponse<string>,
) {
  const queryKey = req.query.key;
  const keyParam = Array.isArray(queryKey) ? (queryKey[0] ?? "") : (queryKey ?? "");

  // Single printable character — type it directly.
  if (keyParam.length === 1) {
    // On macOS, use libnut which posts via kCGHIDEventTap so it reaches Spotlight
    // and other Secure Input Mode-protected fields.  robotjs uses kCGSessionEventTap
    // which SIM filters out.
    if (isMac) {
      libnutTypeString(keyParam);
    } else {
      robot.typeString(keyParam);
    }
    res.send(`typed '${keyParam}'`);
    return;
  }

  const mapped = keyMap[keyParam];
  if (!mapped) {
    // Unknown multi-char token — best-effort type it as a string.
    if (isMac) {
      libnutTypeString(keyParam);
    } else {
      robot.typeString(keyParam);
    }
    res.send(`typed '${keyParam}'`);
    return;
  }

  // Alt+Tab: hold Alt across repeated taps, release after 1.5 s of inactivity.
  if (keyParam === KEYSTROKE.PC.ALT_TAB) {
    if (altReleaseTimeout) {
      clearTimeout(altReleaseTimeout);
    } else {
      robot.keyToggle("alt", "down");
    }
    robot.keyTap("tab");
    altReleaseTimeout = setTimeout(() => {
      robot.keyToggle("alt", "up");
      altReleaseTimeout = null;
    }, 1500);
    res.send("alt+tab");
    return;
  }

  // Never pass undefined as the second arg — the native addon sees it as 2 args and throws
  // "Invalid key flag specified". Only pass modifiers when actually present.
  if (mapped.modifiers && mapped.modifiers.length > 0) {
    robot.keyTap(mapped.key, mapped.modifiers);
  } else {
    robot.keyTap(mapped.key);
  }
  res.send(`key '${keyParam}' pressed`);
}
