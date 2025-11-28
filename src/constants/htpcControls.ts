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
  AltTab = "alt-tab",
  VolUp = "vol-up",
  VolDown = "vol-down",
  Mute = "mute",
  PlayPause = "play-pause",
  Next = "next",
  Prev = "prev",
}

export enum LaunchApp {
  Kodi = "kodi",
  Plexamp = "plexamp",
  Moonlight = "moonlight",
}

export enum DisplayMode {
  Res4k60 = "4k60",
  Res1440p120 = "1440p120",
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
export const VALID_DISPLAY_MODES: readonly DisplayMode[] = Object.values(DisplayMode);
export const VALID_AUDIO_MODES: readonly AudioMode[] = Object.values(AudioMode);
