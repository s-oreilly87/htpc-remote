/**
 * Demo HTTP bridge.
 *
 * One function per export in src/utilities/http.ts. Each function dispatches
 * to the singleton simulator instead of hitting the network.
 *
 * Called exclusively from http.ts when IS_DEMO is true. All return types
 * must exactly match the corresponding http.ts signatures.
 */

import { simulator } from "@/demo/simulator";
import type { FetchResult, ValueButton } from "@/utilities/http";
import type { ApiResponse } from "@/types/api";
import type { TplinkDeviceState } from "@/context/tplink";
import type {
  LinuxAudioModeCommand,
  LinuxDisplayModeCommand,
  LinuxLaunchAppCommand,
} from "@/constants/htpcControls";

// ── HTPC (Linux) ──────────────────────────────────────────────────────────────

export function launchLinuxApp(app: LinuxLaunchAppCommand): Promise<ApiResponse> {
  return Promise.resolve(simulator.htpc.launchApp(app));
}

export function killLinuxApp(app: LinuxLaunchAppCommand): Promise<ApiResponse> {
  return Promise.resolve(simulator.htpc.killApp(app));
}

export function setLinuxDisplayMode(mode: LinuxDisplayModeCommand): Promise<ApiResponse> {
  return Promise.resolve(simulator.htpc.setDisplayMode(mode));
}

export function setLinuxAudioMode(mode: LinuxAudioModeCommand): Promise<ApiResponse> {
  return Promise.resolve(simulator.htpc.setAudioMode(mode));
}

// ── Roku ──────────────────────────────────────────────────────────────────────

export function fetchRokuChannels(): Promise<FetchResult<{ id: string; label: string }[]>> {
  return Promise.resolve(simulator.roku.fetchChannels());
}

export function fetchRokuDeviceInfo(): Promise<FetchResult<Record<string, string>>> {
  return Promise.resolve(simulator.roku.fetchDeviceInfo());
}

export function sendRokuKeypress(button: ValueButton): void {
  const wasOn = simulator.roku.getState().powerOn;
  simulator.roku.handleKeypress(button);
  simulator.applyCec(wasOn);
}

export function sendRokuKeydown(button: ValueButton): void {
  simulator.roku.handleKeydown(button);
}

export function sendRokuKeyup(button: ValueButton): void {
  simulator.roku.handleKeyup(button);
}

export function sendRokuLaunchCommand(button: ValueButton): void {
  const wasOn = simulator.roku.getState().powerOn;
  simulator.roku.handleLaunch(button);
  simulator.applyCec(wasOn);
}

export function sendRokuSearchQuery(query: string): void {
  simulator.roku.handleSearch(query);
}

// ── PC Control ────────────────────────────────────────────────────────────────

export async function sendEventToHTPCEventGhost(
  button: ValueButton,
  payload = "",
): Promise<void> {
  simulator.htpc.sendEventGhost(button, payload || undefined);
}

export async function sendEventToGameStreamEventGhost(
  button: ValueButton,
  payload = "",
): Promise<void> {
  simulator.htpc.sendGameStreamEventGhost(button, payload || undefined);
}

export function sendClickToRobot(type: string): void {
  simulator.htpc.sendClick(type);
}

export async function sendKeystrokeToHtpc(key: string): Promise<void> {
  simulator.htpc.sendKeystroke(key);
}

export function sendDisableCommandToRobot(): void {
  simulator.htpc.disable();
}

// ── Denon ─────────────────────────────────────────────────────────────────────

export function sendDenonCommand(
  button: ValueButton,
  path: "command" | "query" = "command",
): Promise<FetchResult<string[]>> {
  const result =
    path === "query"
      ? simulator.denon.handleQuery(button.value)
      : simulator.denon.handleCommand(button.value);
  return Promise.resolve(result);
}

export function fetchMainZoneData(): Promise<FetchResult<Record<string, string>>> {
  return Promise.resolve(simulator.denon.fetchMainZoneData());
}

// ── TP-Link ───────────────────────────────────────────────────────────────────

export function fetchTplinkInfo(deviceId: string): Promise<FetchResult<TplinkDeviceState>> {
  return Promise.resolve(simulator.tplink.fetchInfo(deviceId));
}

export function toggleTplinkSwitch(deviceId: string, on: boolean): Promise<ApiResponse> {
  return Promise.resolve(simulator.tplink.toggle(deviceId, on));
}

export function setTplinkBrightness(
  deviceId: string,
  brightness: number,
): Promise<ApiResponse> {
  return Promise.resolve(simulator.tplink.setBrightness(deviceId, brightness));
}
