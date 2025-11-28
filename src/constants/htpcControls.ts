export enum KeyAction {
  Type = "type",
  Up = "up",
  Down = "down",
  Left = "left",
  Right = "right",
  Enter = "enter",
  Ok = "ok",
  Back = "back",
  Esc = "esc",
  Tab = "tab",
  AltDown = "alt-down",
  AltUp = "alt-up",
  AltTab = "alt-tab",
  VolUp = "vol-up",
  VolDown = "vol-down",
  Mute = "mute",
  PlayPause = "play-pause",
  Next = "next",
  Prev = "prev",
  CloseWindow = "close-window"
}

export enum LaunchApp {
  Kodi = "kodi",
  Plexamp = "plexamp",
  Moonlight = "moonlight",
}

export enum DisplayModeForLinux {
  Res4k60HDR = "4k60",
  Res4k60SDR = "4k60SDR",
  Res1440p120HDR = "1440p120",
  Res1440p120SDR = "1440p120SDR",
}

export enum AudioMode {
  AnalogStereo = "analog-stereo",
  HdmiStereo = "hdmi-stereo",
  Surround51 = "surround51-hdmi2",
  Surround71 = "surround71-hdmi2",
}

export interface ApiResponse {
  ok: boolean;
  error?: string;
}

export const VALID_KEY_ACTIONS: readonly KeyAction[] = Object.values(KeyAction);
export const VALID_LAUNCH_APPS: readonly LaunchApp[] = Object.values(LaunchApp);
export const VALID_DISPLAY_MODES: readonly DisplayModeForLinux[] = Object.values(DisplayModeForLinux);
export const VALID_AUDIO_MODES: readonly AudioMode[] = Object.values(AudioMode);
