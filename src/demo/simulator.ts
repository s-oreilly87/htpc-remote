/**
 * VirtualHomeTheater — singleton simulator for demo mode.
 *
 * Usage:
 *   import { simulator } from "@/demo/simulator";
 *   simulator.subscribe(() => { ... });
 *   simulator.getState();
 *   simulator.getEvents();
 *   simulator.denon.handleCommand("POWER");
 *   simulator.reset();
 *
 * Architecture
 * ─────────────
 * Each device sub-simulator holds its own state slice and calls back to the
 * parent whenever it mutates state. The parent then:
 *   1. Rebuilds the immutable top-level VirtualState snapshot (new object
 *      reference so useSyncExternalStore sees the change)
 *   2. Appends an EventLogEntry to the ring buffer (max 100)
 *   3. Notifies all subscribers
 *
 * This file is pure TS — no React, no fetch.
 */

import { INITIAL_STATE } from "@/demo/initialState";
import type { EventLogEntry, VirtualState } from "@/demo/types";
import { DeviceTarget } from "@/demo/types";
import { DenonSimulator } from "@/demo/devices/denon";
import { RokuSimulator } from "@/demo/devices/roku";
import { HtpcSimulator } from "@/demo/devices/htpc";
import { GameStreamPcSimulator } from "@/demo/devices/gamestream-pc";
import { TplinkSimulator } from "@/demo/devices/tplink";

const EVENT_LOG_MAX = 100;

class VirtualHomeTheater {
  private _state: VirtualState;
  private _events: EventLogEntry[];
  private _subscribers: Set<() => void>;
  private _nextEventId: number;

  readonly denon: DenonSimulator;
  readonly roku: RokuSimulator;
  readonly htpc: HtpcSimulator;
  readonly gamestreamPc: GameStreamPcSimulator;
  readonly tplink: TplinkSimulator;

  constructor() {
    this._state = INITIAL_STATE;
    this._events = [];
    this._subscribers = new Set();
    this._nextEventId = 0;

    const makeNotify =
      (target: DeviceTarget) =>
      (command: string, detail?: string): void => {
        this._pushEvent(target, command, detail);
        this._rebuildState();
        this._notifySubscribers();
      };

    this.denon = new DenonSimulator(INITIAL_STATE.denon, makeNotify(DeviceTarget.DENON));
    this.htpc = new HtpcSimulator(INITIAL_STATE.htpc, makeNotify(DeviceTarget.HTPC));
    this.gamestreamPc = new GameStreamPcSimulator(
      INITIAL_STATE.gamestreamPc,
      makeNotify(DeviceTarget.GAMESTREAM_PC),
    );
    this.tplink = new TplinkSimulator(INITIAL_STATE.tplink, makeNotify(DeviceTarget.TPLINK));

    this.roku = new RokuSimulator(INITIAL_STATE.roku, makeNotify(DeviceTarget.ROKU));
  }

  // ── Public API ────────────────────────────────────────────────────────────

  subscribe(fn: () => void): () => void {
    this._subscribers.add(fn);
    return () => {
      this._subscribers.delete(fn);
    };
  }

  /** Returns the current immutable VirtualState snapshot. */
  getState(): VirtualState {
    return this._state;
  }

  /** Returns the event log (newest first). */
  getEvents(): EventLogEntry[] {
    return this._events;
  }

  /**
   * HDMI CEC side-effect: if Roku just powered on and the Denon is still off,
   * wake the AVR. Called explicitly by the bridge after a Roku keypress so
   * the transition (off→on) is unambiguous — the bridge captures the power
   * state before and after the command.
   *
   * @param rokuWasOn - Roku power state BEFORE the keypress
   */
  applyCec(rokuWasOn: boolean): void {
    const rokuNowOn = this.roku.getState().powerOn;
    const denonPowerMatches = this.denon.getState().powerOn === rokuNowOn;

    if (rokuWasOn !== rokuNowOn && !denonPowerMatches) {
      this.denon.patchState({ powerOn: rokuNowOn });
      this._pushEvent(
        DeviceTarget.DENON,
        `CEC: power ${rokuNowOn ? "on" : "off"}`,
        `Mirrored Roku TV power ${rokuNowOn ? "on" : "off"} via HDMI CEC — the app never sends this command`,
      );
      this._rebuildState();
      this._notifySubscribers();
    }
  }

  /**
   * HDMI CEC side-effect for volume keypresses from Roku.
   * The Roku TV forwards VolumeUp / VolumeDown / VolumeMute to the Denon AVR
   * over CEC — the app never sends these commands directly to the AVR.
   */
  applyCecVolumeKey(rokuKey: string): void {
    const state = this.denon.getState();

    if (rokuKey === "VolumeUp") {
      const MV = Math.min(98, (state.MV ?? 50) + 0.5);
      this.denon.patchState({ MV });
      this._pushEvent(
        DeviceTarget.DENON,
        "CEC: VolumeUp",
        `Vol ${MV} — forwarded by Roku TV via HDMI CEC`,
      );
      this._rebuildState();
      this._notifySubscribers();
    } else if (rokuKey === "VolumeDown") {
      const MV = Math.max(0, (state.MV ?? 50) - 0.5);
      this.denon.patchState({ MV });
      this._pushEvent(
        DeviceTarget.DENON,
        "CEC: VolumeDown",
        `Vol ${MV} — forwarded by Roku TV via HDMI CEC`,
      );
      this._rebuildState();
      this._notifySubscribers();
    } else if (rokuKey === "VolumeMute") {
      const muteOn = !state.muteOn;
      this.denon.patchState({ muteOn });
      this._pushEvent(
        DeviceTarget.DENON,
        "CEC: VolumeMute",
        `Mute ${muteOn ? "ON" : "OFF"} — forwarded by Roku TV via HDMI CEC`,
      );
      this._rebuildState();
      this._notifySubscribers();
    }
  }

  /** Resets all device states to their initial values and clears the event log. */
  reset(): void {
    this.denon.reset(INITIAL_STATE.denon);
    this.roku.reset(INITIAL_STATE.roku);
    this.htpc.reset(INITIAL_STATE.htpc);
    this.gamestreamPc.reset(INITIAL_STATE.gamestreamPc);
    this.tplink.reset(INITIAL_STATE.tplink);
    this._events = [];
    this._rebuildState();
    this._notifySubscribers();
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private _pushEvent(target: DeviceTarget, command: string, detail?: string): void {
    const entry: EventLogEntry = {
      id: this._nextEventId++,
      timestamp: new Date(),
      target,
      command,
      detail,
    };
    this._events = [entry, ...this._events].slice(0, EVENT_LOG_MAX);
  }

  private _rebuildState(): void {
    this._state = {
      denon: this.denon.getState(),
      roku: this.roku.getState(),
      htpc: this.htpc.getState(),
      gamestreamPc: this.gamestreamPc.getState(),
      tplink: this.tplink.getState(),
    };
  }

  private _notifySubscribers(): void {
    this._subscribers.forEach((fn) => fn());
  }
}

export const simulator = new VirtualHomeTheater();
