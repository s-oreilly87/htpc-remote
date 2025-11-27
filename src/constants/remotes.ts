export enum RemoteType {
  DENON = "DENON",
  ROKU = "ROKU",
  PC = "PC",
}

export const REMOTE_INDEX: Record<RemoteType, number> = {
  [RemoteType.DENON]: 0,
  [RemoteType.ROKU]: 1,
  [RemoteType.PC]: 2,
};

export enum ClickType {
  LEFT = "left",
  RIGHT = "right",
  DOUBLE = "double",
}

export const SYSTEM_KEYS: string[] = ["Control", "Shift", "Alt", "CapsLock"];

export enum PcKeystroke {
  ENTER = "KEYSTROKE_ENTER",
  BACKSPACE = "KEYSTROKE_BACKSPACE",
  WIN_KEY = "KEYSTROKE_WIN_KEY",
  ALT_TAB = "KEYSTROKE_ALT_TAB",
  ESCAPE = "KEYSTROKE_ESCAPE",
  TAB = "KEYSTROKE_TAB",
  UP = "KEYSTROKE_UP",
  DOWN = "KEYSTROKE_DOWN",
  LEFT = "KEYSTROKE_LEFT",
  RIGHT = "KEYSTROKE_RIGHT",
  VOL_UP = "KEYSTROKE_VOL_UP",
  VOL_DOWN = "KEYSTROKE_VOL_DOWN",
  MUTE = "KEYSTROKE_MUTE",
  PREV = "KEYSTROKE_PREV",
  REWIND = "KEYSTROKE_LEFT",
  PLAY = "KEYSTROKE_PLAY",
  FFWD = "KEYSTROKE_RIGHT",
  NEXT = "KEYSTROKE_NEXT",
  OK = "KEYSTROKE_ENTER",
}

export enum RokuKeystroke {
  POWER = "Power",
  HOME = "Home",
  BACK = "Back",
  OPTION = "Info",
  UP = "Up",
  DOWN = "Down",
  LEFT = "Left",
  RIGHT = "Right",
  OK = "Select",
  VOL_UP = "VolumeUp",
  VOL_DOWN = "VolumeDown",
  MUTE = "VolumeMute",
  REWIND = "Rev",
  PLAY = "Play",
  FFWD = "Fwd",
  ENTER = "Enter",
  BACKSPACE = "Backspace",
}

export enum DenonKeystroke {
  POWER = "POWER",
  BACK = "MNRTN",
  MENU_TOGGLE = "MNMEN",
  MENU_ON = "MNMEN ON",
  MENU_OFF = "MNMEN OFF",
  OPTION = "MNOPT",
  INFO = "MNINF",
  UP = "MNCUP",
  DOWN = "MNCDN",
  LEFT = "MNCLT",
  RIGHT = "MNCRT",
  VOL_UP = "MVUP",
  VOL_DOWN = "MVDOWN",
  MUTE = "MUTE",
  ENTER = "MNENT",
  OK = "MNENT",
}

export enum KeyCode {
  BACKSPACE = "BACKSPACE",
  WIN_KEY = "WIN_KEY",
  ENTER = "ENTER",
}

export enum KeyCombo {
  MOVE_WINDOW = "KEYSTROKE_MOVE_WINDOW",
}

export const KEYSTROKE = {
  PC: PcKeystroke,
  ROKU: RokuKeystroke,
  DENON: DenonKeystroke,
  KEYS: KeyCode,
  KEY_COMBOS: KeyCombo,
} as const;

export type PcKeystrokeKey = keyof typeof PcKeystroke;
export type RokuKeystrokeKey = keyof typeof RokuKeystroke;
export type DenonKeystrokeKey = keyof typeof DenonKeystroke;
