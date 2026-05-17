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

import { LinuxAudioModeCommand, LinuxDisplayModeCommand, LinuxLaunchAppCommand } from "@/constants/htpcControls";
import type { ApiResponse } from "@/types/api";
import type { ValueButton } from "@/utilities/http";
import type { HtpcSimState } from "@/demo/types";

// ── EG event → state inference tables ────────────────────────────────────────
// In demo mode the app runs as a non-Linux platform so HTPCPresets fires
// sendEventToHTPCEventGhost rather than the typed Linux functions. These
// tables decode the EventGhost event names back into typed state so the
// virtual HTPC box can display current app / display / audio mode.

/** EG event names that imply a display-mode change. */
const EG_DISPLAY_MODES: Partial<Record<string, LinuxDisplayModeCommand>> = {
  presetGamestream4K60:      LinuxDisplayModeCommand.Res4k60HDR,
  presetGamestream1440p120:  LinuxDisplayModeCommand.Res1440p120HDR,
  presetWatchPlex:           LinuxDisplayModeCommand.Res4k60HDR,
  displayModeHTPC4K60:       LinuxDisplayModeCommand.Res4k60HDR,
  displayModeHTPC1440p120:   LinuxDisplayModeCommand.Res1440p120HDR,
};

/** EG event names that imply an audio-mode change.
 *  Preset names are NOT included here — HTPCPresets always sends a separate
 *  dedicated audio-mode EG event (e.g. "audioMode5.1") right after the preset
 *  event, so mapping preset names here would overwrite the correct value. */
const EG_AUDIO_MODES: Partial<Record<string, LinuxAudioModeCommand>> = {
  audioModeStereo:         LinuxAudioModeCommand.HdmiStereo,
  audioModeStereoAtmosSub: LinuxAudioModeCommand.Surround51,
  audioModeStereoSurround: LinuxAudioModeCommand.HdmiStereo,
  "audioMode5.1":          LinuxAudioModeCommand.Surround51,
  audioModeAtmos:          LinuxAudioModeCommand.Surround71,
  audioModeDtsX:           LinuxAudioModeCommand.Surround71,
};

/** EG event names that imply an active app change. */
const EG_APPS: Partial<Record<string, LinuxLaunchAppCommand>> = {
  presetGamestream4K60:     LinuxLaunchAppCommand.Moonlight,
  presetGamestream1440p120: LinuxLaunchAppCommand.Moonlight,
  presetWatchPlex:          LinuxLaunchAppCommand.Kodi,
  presetPlexampStereo:      LinuxLaunchAppCommand.Plexamp,
  presetPlexampUpmix:       LinuxLaunchAppCommand.Plexamp,
  presetQobuzUpmix:         LinuxLaunchAppCommand.Qobuz,
  launchMoonlight:          LinuxLaunchAppCommand.Moonlight,
  launchKodi:               LinuxLaunchAppCommand.Kodi,
  launchPlexamp:            LinuxLaunchAppCommand.Plexamp,
  launchQobuz:              LinuxLaunchAppCommand.Qobuz,
};

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
    this.onMutate(`launchApp:${app}`, "Launched via Linux app runner (systemd / script)");
    return { ok: true };
  }

  killApp(app: LinuxLaunchAppCommand): ApiResponse {
    if (this.state.activeApp === app) {
      this.state = { ...this.state, activeApp: null };
    }
    this.onMutate(`killApp:${app}`, "Terminated via Linux app runner before launch");
    return { ok: true };
  }

  // ── Mode setters ──────────────────────────────────────────────────────────

  setDisplayMode(mode: LinuxDisplayModeCommand): ApiResponse {
    this.state = { ...this.state, displayMode: mode };
    this.onMutate(`displayMode:${mode}`, "Applied via kscreen-doctor (KWin Wayland)");
    return { ok: true };
  }

  setAudioMode(mode: LinuxAudioModeCommand): ApiResponse {
    this.state = { ...this.state, audioMode: mode };
    this.onMutate(`audioMode:${mode}`, "Switched PipeWire sink profile on HTPC");
    return { ok: true };
  }

  // ── Fire-and-forget commands (no state change) ────────────────────────────

  sendEventGhost(button: ValueButton, payload?: string): void {
    const event = button.value;

    // Infer typed state from the EG event name so the virtual HTPC box reflects
    // what would have happened on a real Windows HTPC.
    const newDisplay = EG_DISPLAY_MODES[event];
    const newAudio   = EG_AUDIO_MODES[event];
    const newApp     = EG_APPS[event];

    if (newDisplay !== undefined) this.state = { ...this.state, displayMode: newDisplay };
    if (newAudio   !== undefined) this.state = { ...this.state, audioMode:   newAudio };
    if (newApp     !== undefined) this.state = { ...this.state, activeApp:   newApp };

    this.onMutate(`eventghost:${event}`, payload ?? "HTTP event → EventGhost on HTPC");
  }

  sendGameStreamEventGhost(button: ValueButton, payload?: string): void {
    this.onMutate(`gamestream:${button.value}`, payload ?? "Forwarding EG event to GameStream PC");
  }

  sendKeystroke(key: string): void {
    this.onMutate(`keystroke:${key}`, "ydotool keypress injected on HTPC (Wayland)");
  }

  sendClick(type: string): void {
    this.onMutate(`click:${type}`, "ydotool mouse click injected on HTPC");
  }

  disable(): void {
    this.onMutate("robot:disable", "Input injection disabled until next page load");
  }
}
