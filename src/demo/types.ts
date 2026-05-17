import type { DenonState } from "@/types/remote";
import type { LinuxAudioModeCommand, LinuxDisplayModeCommand, LinuxLaunchAppCommand } from "@/constants/htpcControls";

// ── Device target enum ───────────────────────────────────────────────────────

export enum DeviceTarget {
  DENON = "DENON",
  ROKU = "ROKU",
  HTPC = "HTPC",
  GAMESTREAM_PC = "GAMESTREAM_PC",
  TPLINK = "TPLINK",
}

// ── Event log ────────────────────────────────────────────────────────────────

export interface EventLogEntry {
  id: number;
  timestamp: Date;
  target: DeviceTarget;
  command: string;
  detail?: string;
}

// ── Per-device virtual state ─────────────────────────────────────────────────

/** Mirrors DenonState from src/types/remote.ts exactly. */
export type DenonSimState = DenonState;

export interface RokuSimState {
  powerOn: boolean;
  currentApp: { id: string; label: string } | null;
  navigationFocus: string;
}

export interface HtpcSimState {
  activeApp: LinuxLaunchAppCommand | null;
  displayMode: LinuxDisplayModeCommand | null;
  audioMode: LinuxAudioModeCommand | null;
}

export interface GameStreamPcSimState {
  /** Last display-mode EventGhost command received (e.g. "displayDummy4K60"). */
  displayMode: string | null;
}

export interface TplinkDeviceSimState {
  powerState: boolean;
  brightness?: number;
  error?: string;
}

export interface TplinkSimState {
  devices: Record<string, TplinkDeviceSimState>;
}

// ── Top-level virtual state ──────────────────────────────────────────────────

export interface VirtualState {
  denon: DenonSimState;
  roku: RokuSimState;
  htpc: HtpcSimState;
  gamestreamPc: GameStreamPcSimState;
  tplink: TplinkSimState;
}
