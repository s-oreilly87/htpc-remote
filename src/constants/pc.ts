import { LinuxAudioModeCommand, LinuxDisplayModeCommand } from "@/constants/htpcControls";
import { RemoteType } from "@/constants/remotes";
import { URL_ENCODED_SYMBOLS } from "@/constants/encoding";
import { ROKU_APPS } from "@/constants/roku";
import type { AudioMode, DisplayMode, SelectOption } from "@/types/remote";

// ── Audio modes ───────────────────────────────────────────────────────────────
// Single source of truth for all HTPC audio modes.
// egValue   → EventGhost event name on Windows
// linuxValue → htpc-audio script argument on Linux
// denonCmd  → Denon quick-select command sent alongside the HTPC change

export const AUDIO_MODES: Record<string, AudioMode> = {
  PLACEHOLDER: {
    key: "PLACEHOLDER",
    label: "Select Audio Mode",
    disabled: true,
    egValue: "",
  },
  PURE: {
    key: "PURE",
    label: "Pure Stereo 24/192 (no sub)",
    egValue: "audioModeStereo",
    linuxValue: LinuxAudioModeCommand.HdmiStereo,
    denonCmd: "MSQUICK1",
  },
  STEREO: {
    key: "STEREO",
    label: "Stereo (Atmos w/ sub)",
    egValue: "audioModeStereoAtmosSub",
    linuxValue: LinuxAudioModeCommand.Surround51,
    denonCmd: "MSQUICK2",
  },
  DOLBY_UPMIX: {
    key: "DOLBY_UPMIX",
    label: "Stereo (Dolby Surround Upmix)",
    egValue: "audioModeStereoSurround",
    linuxValue: LinuxAudioModeCommand.HdmiStereo,
    denonCmd: "MSQUICK2",
  },
  SURROUND51: {
    key: "SURROUND51",
    label: "5.1 Surround",
    egValue: "audioMode5.1",
    linuxValue: LinuxAudioModeCommand.Surround51,
    denonCmd: "MSQUICK3",
  },
  ATMOS: {
    key: "ATMOS",
    label: "Dolby Atmos",
    egValue: "audioModeAtmos",
    denonCmd: "MSQUICK4",
  },
  DTS_X: {
    key: "DTS_X",
    label: "DTS:X",
    egValue: "audioModeDtsX",
    denonCmd: "MSQUICK4",
  },
};

// ── Display modes ─────────────────────────────────────────────────────────────
// egValue   → EventGhost event name on Windows
// linuxValue → htpc-res script argument on Linux
// Modes with no egValue are Linux-only; modes with no linuxValue are EG-only.

export const DISPLAY_MODES: Record<string, DisplayMode> = {
  PLACEHOLDER: {
    key: "PLACEHOLDER",
    label: "Select Display Mode",
    disabled: true,
    egValue: "",
  },
  HTPC_4K60_HDR: {
    key: "HTPC_4K60_HDR",
    label: "HTPC (4K60 HDR)",
    egValue: "displayModeHTPC4K60",
    linuxValue: LinuxDisplayModeCommand.Res4k60HDR,
    rokuChannel: ROKU_APPS.HDMI.HDMI4,
  },
  HTPC_4K60_SDR: {
    key: "HTPC_4K60_SDR",
    label: "HTPC (4K60 SDR)",
    egValue: "",
    linuxValue: LinuxDisplayModeCommand.Res4k60SDR,
    rokuChannel: ROKU_APPS.HDMI.HDMI4,
  },
  HTPC_1440P120_HDR: {
    key: "HTPC_1440P120_HDR",
    label: "HTPC (1440p120 HDR)",
    egValue: "displayModeHTPC1440p120",
    linuxValue: LinuxDisplayModeCommand.Res1440p120HDR,
    rokuChannel: ROKU_APPS.HDMI.HDMI4,
  },
  HTPC_1440P120_SDR: {
    key: "HTPC_1440P120_SDR",
    label: "HTPC (1440p120 SDR)",
    egValue: "",
    linuxValue: LinuxDisplayModeCommand.Res1440p120SDR,
    rokuChannel: ROKU_APPS.HDMI.HDMI4,
  },
  HTPC_1080P120: {
    key: "HTPC_1080P120",
    label: "HTPC (1080p120)",
    egValue: "displayModeHTPC1080p120",
    rokuChannel: ROKU_APPS.HDMI.HDMI4,
  },
};

// ── Platform-aware helpers ────────────────────────────────────────────────────

export function audioModeValue(mode: AudioMode, isLinux: boolean): string {
  return isLinux ? (mode.linuxValue ?? "") : mode.egValue;
}

export function displayModeValue(mode: DisplayMode, isLinux: boolean): string {
  return isLinux ? (mode.linuxValue ?? "") : mode.egValue;
}

/** Project an AudioMode to a SelectOption for a given platform. */
export function toAudioSelectOption(mode: AudioMode, isLinux: boolean): SelectOption {
  return {
    key: mode.key,
    label: mode.label,
    disabled: mode.disabled,
    denonCmd: mode.denonCmd,
    value: audioModeValue(mode, isLinux),
  };
}

/** Project a DisplayMode to a SelectOption for a given platform. */
export function toDisplaySelectOption(mode: DisplayMode, isLinux: boolean): SelectOption {
  return {
    key: mode.key,
    label: mode.label,
    disabled: mode.disabled,
    rokuChannel: mode.rokuChannel,
    value: displayModeValue(mode, isLinux),
  };
}

/**
 * Returns all audio modes valid for the given platform, as SelectOptions.
 * Modes with no value for the current platform are omitted (except placeholder).
 */
export function getAudioModesForPlatform(isLinux: boolean): SelectOption[] {
  return Object.values(AUDIO_MODES)
    .filter((m) => m.disabled || audioModeValue(m, isLinux) !== "")
    .map((m) => toAudioSelectOption(m, isLinux));
}

/**
 * Returns all display modes valid for the given platform, as SelectOptions.
 * Modes with no value for the current platform are omitted (except placeholder).
 */
export function getDisplayModesForPlatform(isLinux: boolean): SelectOption[] {
  return Object.values(DISPLAY_MODES)
    .filter((m) => m.disabled || displayModeValue(m, isLinux) !== "")
    .map((m) => toDisplaySelectOption(m, isLinux));
}

export const PC_REMOTE_META = {
  type: RemoteType.PC,
  clickTypes: { ...URL_ENCODED_SYMBOLS },
} as const;
