/**
 * Denon AVR sub-simulator.
 *
 * Returns shapes that exactly match what the real http.ts functions return
 * so the rest of the app (denon-query.ts, etc.) is unaware it's talking to
 * a simulator.
 *
 * fetchMainZoneData  → FetchResult<Record<string, string>>
 * handleCommand      → FetchResult<string[]>  (command mutation)
 * handleQuery        → FetchResult<string[]>  (telnet-style read)
 */

import { DENON_INPUTS, DENON_SOUND_MODES } from "@/constants/denon";
import { DenonKeystroke } from "@/constants/remotes";
import type { FetchResult } from "@/utilities/http";
import type { DenonSimState } from "@/demo/types";

// ── Encoding helpers ─────────────────────────────────────────────────────────

/**
 * Encodes a master-volume float to the Denon telnet format.
 * 50   → "50"
 * 50.5 → "505"
 * 5    → "05"
 * 5.5  → "055"
 */
function encodeMV(mv: number): string {
  const tenths = Math.round(mv * 10);
  if (tenths % 10 === 0) {
    const vol = tenths / 10;
    return vol < 10 ? `0${vol}` : `${vol}`;
  }
  return `00${tenths}`.slice(-3);
}

/**
 * Encodes a PSDIL float (e.g. 0, 3.5, -3.5) to the Denon telnet format.
 * parseDialogueAdjustLevel reverses this: (raw / 10) - 50 → final value.
 * 0   → "500"
 * 3.5 → "535"
 */
function encodePSDIL(psdil: number): string {
  return String(Math.round((psdil + 50) * 10));
}

// ── Denon device simulator ───────────────────────────────────────────────────

export class DenonSimulator {
  private state: DenonSimState;
  private readonly onMutate: (command: string, detail?: string) => void;

  constructor(initial: DenonSimState, onMutate: (command: string, detail?: string) => void) {
    this.state = { ...initial };
    this.onMutate = onMutate;
  }

  getState(): DenonSimState {
    return this.state;
  }

  reset(initial: DenonSimState): void {
    this.state = { ...initial };
  }

  // ── Shape: fetchMainZoneData ─────────────────────────────────────────────

  fetchMainZoneData(): FetchResult<Record<string, string>> {
    const { powerOn, muteOn, input, soundMode } = this.state;
    return {
      data: {
        zonePower: powerOn ? "ON" : "OFF",
        mute: muteOn ? "ON" : "OFF",
        inputFuncSelect: input?.inputFuncSelect[0] ?? "TV_AUDIO",
        selectSurround: soundMode?.selectSurround[0] ?? "STEREO",
      },
    };
  }

  // ── Shape: sendDenonQuery (telnet reads) ──────────────────────────────────

  handleQuery(query: string): FetchResult<string[]> {
    const { MV, PSDYNVOL, psDynEqOn, PSREFLEV, psDilOn, PSDIL } = this.state;

    switch (query) {
      case "MV": {
        const mvStr = MV !== undefined ? encodeMV(MV) : "50";
        return { data: [`MV${mvStr}`, "MVMAX980"] };
      }
      case "PSDYNVOL":
        return { data: [`PSDYNVOL ${PSDYNVOL ?? "OFF"}`] };
      case "PSDYNEQ":
        return { data: [`PSDYNEQ ${psDynEqOn ? "ON" : "OFF"}`] };
      case "PSREFLEV":
        return { data: [`PSREFLEV ${PSREFLEV ?? "0"}`] };
      case "PSDIL": {
        const levelStr = encodePSDIL(PSDIL ?? 0);
        return {
          data: [`PSDIL ${psDilOn ? "ON" : "OFF"}`, `PSDIL ${levelStr}`],
        };
      }
      default:
        return { error: `Unknown Denon query: ${query}` };
    }
  }

  // ── Shape: sendDenonCommand (command mutations) ───────────────────────────

  handleCommand(command: string): FetchResult<string[]> {
    // Input switch — value matches a DENON_INPUTS entry
    const inputEntry = Object.values(DENON_INPUTS).find((i) => i.value === command);
    if (inputEntry) {
      this.state = { ...this.state, input: inputEntry };
      this.onMutate(command, `Input → ${inputEntry.label}`);
      return { msg: `Input set to ${inputEntry.label}` };
    }

    // Sound-mode select — value starts with "MS"
    if (command.startsWith("MS")) {
      const modeEntry = Object.values(DENON_SOUND_MODES).find(
        (m) => m.value === command,
      );
      if (modeEntry) {
        this.state = { ...this.state, soundMode: modeEntry };
        this.onMutate(command, `Sound → ${modeEntry.label}`);
        return { msg: `Sound mode set to ${modeEntry.label}` };
      }
    }

    // PSDYNVOL setter — e.g. "PSDYNVOL OFF", "PSDYNVOL LIT"
    if (command.startsWith("PSDYNVOL ")) {
      const val = command.slice(9);
      this.state = { ...this.state, PSDYNVOL: val };
      this.onMutate(command);
      return { msg: `PSDYNVOL → ${val}` };
    }

    // PSREFLEV setter — e.g. "PSREFLEV 0"
    if (command.startsWith("PSREFLEV ")) {
      const val = command.slice(9);
      this.state = { ...this.state, PSREFLEV: val };
      this.onMutate(command);
      return { msg: `PSREFLEV → ${val}` };
    }

    // PSDIL setter — e.g. "PSDIL ON", "PSDIL 535"
    if (command.startsWith("PSDIL ")) {
      const val = command.slice(6);
      if (val === "ON" || val === "OFF") {
        this.state = { ...this.state, psDilOn: val === "ON" };
      } else {
        // Numeric value — decode back to float
        const level = parseFloat(val);
        if (!Number.isNaN(level)) {
          const decoded = val.length >= 3 ? level / 10 - 50 : level - 50;
          this.state = { ...this.state, PSDIL: decoded };
        }
      }
      this.onMutate(command);
      return { msg: `PSDIL → ${val}` };
    }

    // DenonKeystroke commands
    switch (command) {
      case DenonKeystroke.POWER: {
        const powerOn = !this.state.powerOn;
        this.state = { ...this.state, powerOn };
        this.onMutate(command, `Power ${powerOn ? "ON" : "OFF"}`);
        return { msg: `Power ${powerOn ? "ON" : "OFF"}` };
      }

      case DenonKeystroke.MUTE: {
        const muteOn = !this.state.muteOn;
        this.state = { ...this.state, muteOn };
        this.onMutate(command, `Mute ${muteOn ? "ON" : "OFF"}`);
        return { msg: `Mute ${muteOn ? "ON" : "OFF"}` };
      }

      case DenonKeystroke.VOL_UP: {
        const MV = Math.min(98, (this.state.MV ?? 50) + 0.5);
        this.state = { ...this.state, MV };
        this.onMutate(command, `Vol ${MV}`);
        return { msg: `VOL_UP → ${MV}` };
      }

      case DenonKeystroke.VOL_DOWN: {
        const MV = Math.max(0, (this.state.MV ?? 50) - 0.5);
        this.state = { ...this.state, MV };
        this.onMutate(command, `Vol ${MV}`);
        return { msg: `VOL_DOWN → ${MV}` };
      }

      // Navigation / menu — no state change, just acknowledge
      case DenonKeystroke.MENU_ON:
      case DenonKeystroke.MENU_OFF:
      case DenonKeystroke.MENU_TOGGLE:
      case DenonKeystroke.UP:
      case DenonKeystroke.DOWN:
      case DenonKeystroke.LEFT:
      case DenonKeystroke.RIGHT:
      case DenonKeystroke.OK:
      case DenonKeystroke.ENTER:
      case DenonKeystroke.BACK:
      case DenonKeystroke.OPTION:
      case DenonKeystroke.INFO:
        this.onMutate(command);
        return { msg: `${command} sent` };

      default:
        this.onMutate(command);
        return { msg: `${command} sent` };
    }
  }
}
