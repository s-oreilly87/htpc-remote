/**
 * HTPC sub-simulator.
 *
 * State: { activeApp, displayMode, audioMode }
 *
 * Keystrokes / clicks / robot-disable don't change state — they just emit log
 * entries. App launch/kill, display mode, and audio mode setters do mutate state.
 *
 * All methods that correspond to http.ts async functions return ApiResponse
 * ({ ok: true }) on success.
 */

import type { LinuxAudioModeCommand, LinuxDisplayModeCommand, LinuxLaunchAppCommand } from "@/constants/htpcControls";
import type { ApiResponse } from "@/types/api";
import type { ValueButton } from "@/utilities/http";
import type { HtpcSimState } from "@/demo/types";

export class HtpcSimulator {
  private state: HtpcSimState;
  private readonly onMutate: (command: string, detail?: string) => void;

  constructor(initial: HtpcSimState, onMutate: (command: string, detail?: string) => void) {
    this.state = { ...initial };
    this.onMutate = onMutate;
  }

  getState(): HtpcSimState {
    return this.state;
  }

  reset(initial: HtpcSimState): void {
    this.state = { ...initial };
  }

  // ── App lifecycle ─────────────────────────────────────────────────────────

  launchApp(app: LinuxLaunchAppCommand): ApiResponse {
    this.state = { ...this.state, activeApp: app };
    this.onMutate(`launchApp:${app}`);
    return { ok: true };
  }

  killApp(app: LinuxLaunchAppCommand): ApiResponse {
    if (this.state.activeApp === app) {
      this.state = { ...this.state, activeApp: null };
    }
    this.onMutate(`killApp:${app}`);
    return { ok: true };
  }

  // ── Mode setters ──────────────────────────────────────────────────────────

  setDisplayMode(mode: LinuxDisplayModeCommand): ApiResponse {
    this.state = { ...this.state, displayMode: mode };
    this.onMutate(`displayMode:${mode}`);
    return { ok: true };
  }

  setAudioMode(mode: LinuxAudioModeCommand): ApiResponse {
    this.state = { ...this.state, audioMode: mode };
    this.onMutate(`audioMode:${mode}`);
    return { ok: true };
  }

  // ── Fire-and-forget commands (no state change) ────────────────────────────

  sendEventGhost(button: ValueButton, payload?: string): void {
    this.onMutate(`eventghost:${button.value}`, payload);
  }

  sendGameStreamEventGhost(button: ValueButton, payload?: string): void {
    this.onMutate(`gamestream:${button.value}`, payload);
  }

  sendKeystroke(key: string): void {
    this.onMutate(`keystroke:${key}`);
  }

  sendClick(type: string): void {
    this.onMutate(`click:${type}`);
  }

  disable(): void {
    this.onMutate("robot:disable");
  }
}
