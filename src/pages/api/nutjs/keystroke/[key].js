import {Key, keyboard} from "@nut-tree/nut-js";
import {KEYSTROKE, PLATFORM} from "@/utilities/constants";

const nutKeyMap = {
  [KEYSTROKE.PC.ENTER]: Key.Enter,
  [KEYSTROKE.PC.BACKSPACE]: Key.Backspace,
  [KEYSTROKE.PC.WIN_KEY]: Key.LeftWin,
  [KEYSTROKE.PC.ALT_TAB]: [Key.LeftAlt, Key.Tab],
  [KEYSTROKE.PC.ESCAPE]: Key.Escape,
  [KEYSTROKE.PC.TAB]: Key.Tab,
  [KEYSTROKE.PC.UP]: Key.Up,
  [KEYSTROKE.PC.DOWN]: Key.Down,
  [KEYSTROKE.PC.LEFT]: Key.Left,
  [KEYSTROKE.PC.RIGHT]: Key.Right,
  [KEYSTROKE.PC.VOL_UP]: Key.AudioVolUp,
  [KEYSTROKE.PC.VOL_DOWN]: Key.AudioVolDown,
  [KEYSTROKE.PC.MUTE]: Key.AudioMute,
  [KEYSTROKE.PC.PREV]: Key.AudioPrev,
  [KEYSTROKE.PC.REWIND]: Key.Left,
  [KEYSTROKE.PC.PLAY]: Key.AudioPlay,
  [KEYSTROKE.PC.FFWD]: Key.Right,
  [KEYSTROKE.PC.NEXT]: Key.AudioNext,
  [KEYSTROKE.KEY_COMBOS.MOVE_WINDOW]: [Key.LeftWin, Key.LeftShift, Key.Left],
};
if (PLATFORM === "MACOS" || PLATFORM === "LINUX") {
  nutKeyMap[KEYSTROKE.PC.WIN_KEY] = [Key.LeftSuper, Key.Space];
}

let keyTimeouts = {};

keyboard.config.autoDelayMs = 50;

export default async function handleKeystroke(req, res) {
  let { key } = req.query;

  if (key.length > 1) {
    if (nutKeyMap.hasOwnProperty(key)) {
      key = nutKeyMap[key];
    } else {
      key = key + " ";
    }
  }

  if (Array.isArray(key)) {
    // nutJS pressKey(key[]) isnt working so doing it manually
    for (const each of key) {
      if (each === Key.LeftAlt && keyTimeouts[each]) {
        continue;
      }

      await keyboard.pressKey(each);
    }
    for (const each of key) {
      if (key === nutKeyMap[KEYSTROKE.PC.ALT_TAB] && each === Key.LeftAlt) {
        if (keyTimeouts[each]) {
          clearTimeout(keyTimeouts[each]);
        }

        keyTimeouts[each] = setTimeout(async function(){
          await keyboard.releaseKey(each);
          delete keyTimeouts[each]
        }, 1500);
      } else {
        await keyboard.releaseKey(each);
      }
    }
  } else {

    await keyboard.type(key);
  }

  res.send("key '" + key + "' pressed");
}
