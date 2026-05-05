export enum LinuxKeyAction {
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

export enum LinuxLaunchAppCommand {
  Kodi = "kodi",
  Plexamp = "plexamp",
  Moonlight = "moonlight",
  Qobuz = 'qobuz',
}

export enum LinuxListenCommand {
  Plexamp = "plexamp",
  Qobuz = "qobuz",
}

export enum LinuxDisplayModeCommand {
  Res4k60HDR = "4k60",
  Res4k60SDR = "4k60SDR",
  Res1440p120HDR = "1440p120",
  Res1440p120SDR = "1440p120SDR",
}

export enum LinuxAudioModeCommand {
  AnalogStereo = "analog-stereo",
  HdmiStereo = "hdmi-stereo",
  Surround51 = "surround51-hdmi",
  Surround71 = "surround71-hdmi ",
}

export const VALID_KEY_ACTIONS: readonly LinuxKeyAction[] = Object.values(LinuxKeyAction);
export const VALID_LAUNCH_APPS: readonly LinuxLaunchAppCommand[] = Object.values(LinuxLaunchAppCommand);
export const VALID_LISTEN_COMMANDS: readonly LinuxListenCommand[] = Object.values(LinuxListenCommand);
export const VALID_DISPLAY_MODES: readonly LinuxDisplayModeCommand[] = Object.values(LinuxDisplayModeCommand);
export const VALID_AUDIO_MODES: readonly LinuxAudioModeCommand[] = Object.values(LinuxAudioModeCommand);
