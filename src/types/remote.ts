import type { LinuxAudioModeCommand, LinuxDisplayModeCommand } from "@/constants/htpcControls";

// ── Shared select UI primitive ──────────────────────────────────────────────

export interface SelectOption {
  key: string;
  value: string;
  label: string;
  disabled?: boolean;
  denonCmd?: string;
  rokuChannel?: RokuChannel;
}

// ── Unified platform-aware mode types ───────────────────────────────────────
// Each mode carries values for every supported HTPC backend.
// Add a `macValue` field here when Mac support lands.

export interface AudioMode {
  key: string;
  label: string;
  disabled?: boolean;
  /** Denon quick-select command sent alongside the HTPC audio change. */
  denonCmd?: string;
  /** Value sent to EventGhost on Windows HTPC. */
  egValue: string;
  /** Value sent to the htpc-audio script on Linux. */
  linuxValue?: LinuxAudioModeCommand;
}

export interface DisplayMode {
  key: string;
  label: string;
  disabled?: boolean;
  /** Roku channel to switch to when this display mode is selected. */
  rokuChannel?: RokuChannel;
  /** Value sent to EventGhost on Windows HTPC. */
  egValue: string;
  /** Value sent to the htpc-res script on Linux. */
  linuxValue?: LinuxDisplayModeCommand;
}

// ── Denon ────────────────────────────────────────────────────────────────────

export interface DenonInput {
  label: string;
  value: string;
  inputFuncSelect: string[];
}

export interface DenonSoundMode {
  label: string;
  value: string;
  selectSurround: string[];
}

export interface DenonState {
  powerOn: boolean;
  muteOn: boolean;
  input: DenonInput | null;
  soundMode: DenonSoundMode;
  dynComp: string;
  psDilOn: boolean;
  psDynEqOn: boolean;
  MV: number | undefined;
  PSDIL: number;
  PSREFLEV: string | undefined;
  PSDYNVOL: string | undefined;
}

// ── Roku ─────────────────────────────────────────────────────────────────────

export interface RokuState {
  powerOn: boolean;
}

export interface RokuChannel {
  id: string;
  label: string;
}

export interface RokuApps {
  CHANNELS: Record<string, RokuChannel>;
  HDMI: Record<string, RokuChannel>;
}

// ── Smart home ───────────────────────────────────────────────────────────────

export type SmartHomeDeviceKind = "plug" | "switch" | "dimmer";

export interface SmartHomeDeviceConfig {
  id: string;
  ip: string;
  label: string;
  kind: SmartHomeDeviceKind;
  childId?: string;
}

export type PlugConfig = SmartHomeDeviceConfig & {
  kind: "plug";
  childId?: string;
};

export type LightSwitchConfig = SmartHomeDeviceConfig & {
  kind: "switch" | "dimmer";
};
