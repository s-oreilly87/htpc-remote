/**
 * TP-Link smart-home sub-simulator.
 *
 * Seeded with yard-fence, yard-dining, and basement devices to match TplinkState.
 *
 * Returns shapes matching what the Phase 2 http.ts helpers will return:
 * fetchInfo    → FetchResult<TplinkDeviceState>
 * toggle       → ApiResponse
 * setBrightness → ApiResponse
 */

import type { ApiResponse } from "@/types/api";
import type { TplinkDeviceState } from "@/context/tplink";
import type { FetchResult } from "@/utilities/http";
import type { TplinkSimState, TplinkDeviceSimState } from "@/demo/types";

export class TplinkSimulator {
  private state: TplinkSimState;
  private readonly onMutate: (command: string, detail?: string) => void;

  constructor(initial: TplinkSimState, onMutate: (command: string, detail?: string) => void) {
    this.state = {
      devices: { ...initial.devices },
    };
    this.onMutate = onMutate;
  }

  getState(): TplinkSimState {
    return this.state;
  }

  reset(initial: TplinkSimState): void {
    this.state = { devices: { ...initial.devices } };
  }

  // ── Shape: fetchTplinkInfo ────────────────────────────────────────────────

  fetchInfo(deviceId: string): FetchResult<TplinkDeviceState> {
    const device = this.state.devices[deviceId];
    if (!device) {
      return { error: `Unknown device: ${deviceId}` };
    }
    return { data: this.toTplinkDeviceState(device) };
  }

  // ── Shape: toggleTplinkSwitch ─────────────────────────────────────────────

  toggle(deviceId: string, on: boolean): ApiResponse {
    const device = this.state.devices[deviceId];
    if (!device) {
      return { ok: false, error: `Unknown device: ${deviceId}` };
    }
    this.state = {
      ...this.state,
      devices: {
        ...this.state.devices,
        [deviceId]: { ...device, powerState: on },
      },
    };
    this.onMutate(`toggle:${deviceId}`, on ? "ON" : "OFF");
    return { ok: true };
  }

  // ── Shape: setTplinkBrightness ────────────────────────────────────────────

  setBrightness(deviceId: string, brightness: number): ApiResponse {
    const device = this.state.devices[deviceId];
    if (!device) {
      return { ok: false, error: `Unknown device: ${deviceId}` };
    }
    this.state = {
      ...this.state,
      devices: {
        ...this.state.devices,
        [deviceId]: { ...device, brightness },
      },
    };
    this.onMutate(`brightness:${deviceId}`, `${brightness}%`);
    return { ok: true };
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private toTplinkDeviceState(device: TplinkDeviceSimState): TplinkDeviceState {
    return {
      powerState: device.powerState,
      brightness: device.brightness,
      error: device.error,
    };
  }
}
