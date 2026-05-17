import { parseString } from "xml2js";

import { DENON_INPUTS } from "@/constants/denon";
import { LinuxAudioModeCommand, LinuxDisplayModeCommand, LinuxLaunchAppCommand } from "@/constants/htpcControls";
import { DenonKeystroke } from "@/constants/remotes";
import type { ApiResponse } from "@/types/api";
import type { TplinkDeviceState } from "@/context/tplink";
import { convertKebabToCamel } from "@/utilities/utils";
import { getPlatformInfo } from "@/hooks/usePlatform";
import type * as DemoBridge from "@/demo/http-bridge";

const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
let demoBridgePromise: Promise<typeof DemoBridge> | null = null;

function getDemoBridge(): Promise<typeof DemoBridge> {
  demoBridgePromise ??= import("@/demo/http-bridge");
  return demoBridgePromise;
}

const ROKU_POST_OPTIONS: RequestInit = {
  method: "POST",
  headers: { "Content-Length": "0" },
};

const { isLinuxWayland } = getPlatformInfo();
const USE_YDOTOOL = isLinuxWayland;

export const DENON_HTTP_COMMANDS = [
  DenonKeystroke.MENU_ON,
  DenonKeystroke.MENU_OFF,
  DenonKeystroke.UP,
  DenonKeystroke.DOWN,
  DenonKeystroke.LEFT,
  DenonKeystroke.RIGHT,
  DenonKeystroke.OK,
  DenonKeystroke.BACK,
  DenonKeystroke.INFO,
  DenonKeystroke.OPTION,
  DenonKeystroke.VOL_UP,
  DenonKeystroke.VOL_DOWN,
  ...Object.values(DENON_INPUTS).map((input) => input.value),
];

export interface ValueButton {
  value: string;
}

export interface FetchResult<T> {
  data?: T;
  error?: unknown;
  msg?: string;
}

async function postJson(path: string, body: unknown): Promise<ApiResponse> {
  try {
    const response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body ?? {}),
    });

    const data = (await response.json().catch(() => null)) as ApiResponse | null;
    if (!response.ok) {
      return { ok: false, error: data?.error ?? response.statusText };
    }

    return data ?? { ok: true };
  } catch (error) {
    console.error(error);
    return { ok: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

// ########   HTPC Control (Linux)   ########

export async function launchLinuxApp(app: LinuxLaunchAppCommand): Promise<ApiResponse> {
  if (IS_DEMO) return (await getDemoBridge()).launchLinuxApp(app);
  return postJson(`/api/linux/launch`, { app });
}

export async function killLinuxApp(app: LinuxLaunchAppCommand): Promise<ApiResponse> {
  if (IS_DEMO) return (await getDemoBridge()).killLinuxApp(app);
  return postJson(`/api/linux/kill`, { app });
}

export async function setLinuxDisplayMode(mode: LinuxDisplayModeCommand): Promise<ApiResponse> {
  if (IS_DEMO) return (await getDemoBridge()).setLinuxDisplayMode(mode);
  return postJson(`/api/linux/display`, { mode });
}

export async function setLinuxAudioMode(mode: LinuxAudioModeCommand): Promise<ApiResponse> {
  if (IS_DEMO) return (await getDemoBridge()).setLinuxAudioMode(mode);
  return postJson(`/api/linux/audio`, { mode });
}

// ########   Roku Control   ########

export async function sendRokuQuery(query: string): Promise<Response> {
  return fetch(`api/roku/query/${query}`);
}

export async function fetchRokuChannels(): Promise<FetchResult<{
  id: string;
  label: string;
}[]>> {
  if (IS_DEMO) return (await getDemoBridge()).fetchRokuChannels();

  const response = await fetch("api/roku/query/apps");

  if (response.status !== 200) {
    return { error: response.statusText };
  }
  const xmlText = await response.text();
  let channels: { id: string; label: string }[] | undefined;
  parseString(
    xmlText,
    {
      explicitArray: false,
      parseBooleans: true,
      normalize: true,
    },
    (error, results) => {
      if (error) {
        console.error("Error parsing xml response from Roku");
      }
      const apps = [...results.apps.app];

      channels = Object.values(apps).map((app) => {
        return { id: app.$.id, label: app._ };
      });
    },
  );
  return channels ? { data: channels } : { error: "Parse error" };
}

export async function fetchRokuDeviceInfo(): Promise<FetchResult<Record<string, string>>> {
  if (IS_DEMO) return (await getDemoBridge()).fetchRokuDeviceInfo();

  let data: Record<string, string> | undefined;
  const response = await fetch(`api/roku/query/device-info`);
  if (response.status !== 200) {
    return { error: response.statusText };
  }
  const xmlText = await response.text();
  parseString(
    xmlText,
    {
      explicitArray: false,
      parseBooleans: true,
      normalize: true,
    },
    (error, results) => {
      if (error) {
        console.error("Error parsing xml response from Roku");
      }
      data = {};
      Object.keys(results["device-info"]).forEach((key) => {
        const newKey = convertKebabToCamel(key);
        data![newKey] = results["device-info"][key] || null;
      });
    },
  );
  return data ? { data } : { error: "Parse error" };
}

export function sendRokuKeypress(button: ValueButton): void {
  if (IS_DEMO) { void getDemoBridge().then((demoBridge) => demoBridge.sendRokuKeypress(button)); return; }
  fetch(`api/roku/keypress/${button.value}`, ROKU_POST_OPTIONS);
}

export function sendRokuKeydown(button: ValueButton): void {
  if (IS_DEMO) { void getDemoBridge().then((demoBridge) => demoBridge.sendRokuKeydown(button)); return; }
  fetch(`api/roku/keydown/${button.value}`, ROKU_POST_OPTIONS);
}

export function sendRokuKeyup(button: ValueButton): void {
  if (IS_DEMO) { void getDemoBridge().then((demoBridge) => demoBridge.sendRokuKeyup(button)); return; }
  fetch(`api/roku/keyup/${button.value}`, ROKU_POST_OPTIONS);
}

export function sendRokuLaunchCommand(button: ValueButton): void {
  if (IS_DEMO) { void getDemoBridge().then((demoBridge) => demoBridge.sendRokuLaunchCommand(button)); return; }
  fetch(`api/roku/launch/${button.value}`, ROKU_POST_OPTIONS);
}

export function sendRokuSearchQuery(query: string): void {
  if (IS_DEMO) { void getDemoBridge().then((demoBridge) => demoBridge.sendRokuSearchQuery(query)); return; }
  fetch(`api/roku/search/browse?${query}`, ROKU_POST_OPTIONS);
}

// ########   PC Control   ########

export async function sendEventToHTPCEventGhost(
  button: ValueButton,
  payload = "",
): Promise<void> {
  if (IS_DEMO) return (await getDemoBridge()).sendEventToHTPCEventGhost(button, payload);
  await fetch(`api/eventghost/htpc/${button.value}${payload ? `&${payload}` : ""}`);
}

export async function sendEventToGameStreamEventGhost(
  button: ValueButton,
  payload = "",
): Promise<void> {
  if (IS_DEMO) return (await getDemoBridge()).sendEventToGameStreamEventGhost(button, payload);
  await fetch(`api/eventghost/gamestream/${button.value}${payload ? `&${payload}` : ""}`);
}

export function sendClickToRobot(type: string): void {
  if (IS_DEMO) { void getDemoBridge().then((demoBridge) => demoBridge.sendClickToRobot(type)); return; }
  fetch(`api/robot/click/${type}`, { mode: "no-cors" });
}

export async function sendKeystrokeToHtpc(key: string): Promise<void> {
  if (IS_DEMO) return (await getDemoBridge()).sendKeystrokeToHtpc(key);

  if (USE_YDOTOOL) {
    await fetch(`/api/linux/ydotool/${key}`, { mode: "no-cors" });
    return;
  }

  fetch(`api/robot/keystroke/${key}`, { mode: "no-cors" });
}

export function sendDisableCommandToRobot(): void {
  if (IS_DEMO) { void getDemoBridge().then((demoBridge) => demoBridge.sendDisableCommandToRobot()); return; }
  fetch(`api/robot/disable`, { mode: "no-cors" });
}

// ########   Denon Control   ########

export async function sendDenonCommand(
  button: ValueButton,
  path: "command" | "query" = "command",
): Promise<FetchResult<string[]>> {
  if (IS_DEMO) return (await getDemoBridge()).sendDenonCommand(button, path);

  const command = button.value;

  if (DENON_HTTP_COMMANDS.includes(command)) {
    fetch(`api/denon-http/command/${command}`);
    return { msg: `${command} sent with HTTP request!` };
  }

  const response = await fetch(`api/denon/${path}/${command}`);
  const body = await response.json();

  if (response.status === 200) {
    return { data: body.data };
  }
  return { error: body.error };
}

export async function sendDenonQuery(query: string): Promise<FetchResult<string[]>> {
  return sendDenonCommand({ value: query }, "query");
}

export async function fetchMainZoneData(): Promise<FetchResult<Record<string, string>>> {
  if (IS_DEMO) return (await getDemoBridge()).fetchMainZoneData();

  let data: Record<string, string> | undefined;
  const response = await fetch(`api/denon-http/queryMainZone`);
  if (response.status !== 200) {
    return { error: response.statusText };
  }
  const xmlText = await response.text();

  parseString(
    xmlText,
    {
      explicitArray: false,
      normalize: true,
      mergeAttrs: true,
    },
    (error, results) => {
      if (error) {
        console.error("Error parsing xml response from Denon");
        return;
      }
      data = {};
      Object.keys(results.item).forEach((key) => {
        const newKey = key.charAt(0).toLowerCase() + key.slice(1);
        if (results.item[key].value instanceof Array) {
          data![newKey] = results.item[key].value || null;
        } else {
          data![newKey] =
            results.item[key].value.toUpperCase().replaceAll(" ", "_") || null;
        }
      });
    },
  );
  return data ? { data } : { error: "Parse error" };
}

// ########   TP-Link Control   ########

export async function fetchTplinkInfo(
  deviceId: string,
): Promise<FetchResult<TplinkDeviceState>> {
  if (IS_DEMO) return (await getDemoBridge()).fetchTplinkInfo(deviceId);
  try {
    const response = await fetch(`api/tp-link/info/${deviceId}`);
    if (response.status !== 200) return { error: response.statusText };
    const map = (await response.json()) as Record<string, TplinkDeviceState>;
    const device = map[deviceId];
    return device ? { data: device } : { error: `Device not found: ${deviceId}` };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function toggleTplinkSwitch(
  deviceId: string,
  on: boolean,
): Promise<ApiResponse> {
  if (IS_DEMO) return (await getDemoBridge()).toggleTplinkSwitch(deviceId, on);
  try {
    await fetch(`api/tp-link/toggle/${deviceId}/${on ? "on" : "off"}`);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function setTplinkBrightness(
  deviceId: string,
  brightness: number,
): Promise<ApiResponse> {
  if (IS_DEMO) return (await getDemoBridge()).setTplinkBrightness(deviceId, brightness);
  try {
    await fetch(`api/tp-link/brightness/${deviceId}/${brightness}`);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}
