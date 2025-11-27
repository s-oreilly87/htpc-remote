import { parseString } from "xml2js";

import { DENON_INPUTS } from "@/components/RemotePanels/Denon/denonConstants";
import { DenonKeystroke } from "@/constants/remotes";
import { convertKebabToCamel } from "@/utilities/utils";

const ROKU_POST_OPTIONS: RequestInit = {
  method: "POST",
  headers: { "Content-Length": "0" },
};

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

// ########   Roku Control   ########
export async function sendRokuQuery(query: string): Promise<Response> {
  return fetch(`api/roku/query/${query}`);
}

export async function fetchRokuChannels(): Promise<FetchResult<{
  id: string;
  label: string;
}[]>> {
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
  fetch(`api/roku/keypress/${button.value}`, ROKU_POST_OPTIONS);
}

export function sendRokuKeydown(button: ValueButton): void {
  fetch(`api/roku/keydown/${button.value}`, ROKU_POST_OPTIONS);
}

export function sendRokuKeyup(button: ValueButton): void {
  fetch(`api/roku/keyup/${button.value}`, ROKU_POST_OPTIONS);
}

export function sendRokuLaunchCommand(button: ValueButton): void {
  fetch(`api/roku/launch/${button.value}`, ROKU_POST_OPTIONS);
}

export function sendRokuSearchQuery(query: string): void {
  fetch(`api/roku/search/browse?${query}`, ROKU_POST_OPTIONS);
}

// ########   PC Control   ########
export async function sendEventToHTPCEventGhost(
  button: ValueButton,
  payload = "",
): Promise<void> {
  await fetch(`api/eventghost/htpc/${button.value}${payload ? `&${payload}` : ""}`);
}

export async function sendEventToGameStreamEventGhost(
  button: ValueButton,
  payload = "",
): Promise<void> {
  await fetch(`api/eventghost/gamestream/${button.value}${payload ? `&${payload}` : ""}`);
}

export function sendClickToNutJS(type: string): void {
  fetch(`api/nutjs/click/${type}`, { mode: "no-cors" });
}

export function sendKeystrokeToNutJS(key: string): void {
  fetch(`api/nutjs/keystroke/${key}`, { mode: "no-cors" });
}

export function sendDisableCommandToNutJS(): void {
  fetch(`api/nutjs/disable`, { mode: "no-cors" });
}

// ########   Denon Control   ########
export async function sendDenonCommand(
  button: ValueButton,
  path: "command" | "query" = "command",
): Promise<FetchResult<string[]>> {
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
