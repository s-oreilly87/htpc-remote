import { DENON_INPUTS, DENON_SOUND_MODES } from "@/constants/denon";
import type { DenonSoundMode, DenonState } from "@/types/remote";
import { fetchMainZoneData, sendDenonQuery } from "@/utilities/http";

export const DENON_QUERY_KEY = ["denon-state"] as const;

// ── Low-level telnet fetch helpers ───────────────────────────────────────────

async function fetchLevel(
  query: string,
  signal?: AbortSignal,
): Promise<string | undefined> {
  const response = await sendDenonQuery(query, signal);
  if (response.error) {
    console.error(response.error);
    return undefined;
  }
  return response.data?.[0]?.split(" ")[1];
}

async function fetchOnState(
  query: string,
  signal?: AbortSignal,
): Promise<boolean | undefined> {
  const response = await sendDenonQuery(query, signal);
  if (response.error) {
    console.error(response.error);
    return undefined;
  }
  const value = response.data?.[0]?.split(" ")[1];
  return value === "ON" ? true : value === "OFF" ? false : undefined;
}

async function fetchMasterVolume(
  signal?: AbortSignal,
): Promise<number | undefined> {
  const masterVolResponse = await sendDenonQuery("MV", signal);
  if (masterVolResponse.error) {
    console.error(masterVolResponse.error);
    return undefined;
  }
  if (!masterVolResponse.data) return undefined;

  let value: string | undefined;
  for (const val of masterVolResponse.data) {
    if (val.startsWith("MV") && !val.startsWith("MVMAX")) {
      value = val.split("V")[1];
      break;
    }
  }
  if (!value) return undefined;

  if (value.toString().length === 3) return parseFloat(value) / 10;
  if (value[0] === "0") return Number(parseFloat(value[1]).toFixed(1));
  return Number(parseFloat(value).toFixed(1));
}

export async function fetchDialogueAdjust(
  signal?: AbortSignal,
): Promise<[boolean, number] | undefined> {
  const response = await sendDenonQuery("PSDIL", signal);
  if (response.error) {
    console.error(response.error);
    return undefined;
  }
  const values = response.data?.map((line) => line.split(" ")[1]) ?? [];
  const onState = values.find((value) => value === "ON" || value === "OFF");
  const level = values.find((value) => /^\d+(?:\.\d+)?$/.test(value));
  if (onState === undefined || level === undefined) return undefined;
  return [onState === "ON", parseDialogueAdjustLevel(level)];
}

// PSDIL values arrive as integers with an implicit decimal place and a 50 offset.
// Example: "535" → 3.5 (53.5 - 50)
export const parseDialogueAdjustLevel = (levelString: string): number => {
  const parsedLevel = parseFloat(levelString);
  if (Number.isNaN(parsedLevel)) return 0;

  let level = parsedLevel;
  if (!levelString.includes(".") && levelString.length >= 3) {
    level /= 10;
  }
  return level - 50;
};

// Basic HTTP state has its own poll and does not wait for optional telnet fields.
export async function fetchDenonState(
  previous: DenonState,
  signal?: AbortSignal,
): Promise<DenonState> {
  const mainZoneResponse = await fetchMainZoneData(signal);
  if (mainZoneResponse.error || !mainZoneResponse.data) {
    throw new Error("Denon: main-zone state unavailable");
  }
  if (!["ON", "OFF"].includes(mainZoneResponse.data.zonePower)) {
    throw new Error("Denon: invalid main-zone power state");
  }
  let input = null;
  let powerOn = false;
  let muteOn = false;
  let soundMode: DenonSoundMode = DENON_SOUND_MODES.NONE;

  {
    const data = mainZoneResponse.data;

    input =
      Object.values(DENON_INPUTS).find((i) =>
        i.inputFuncSelect.includes(data.inputFuncSelect as string),
      ) ?? null;
    if (!input) console.info(`Unknown Input: ${data.inputFuncSelect}`);

    soundMode =
      Object.values(DENON_SOUND_MODES).find((mode) =>
        mode.selectSurround.includes(data.selectSurround as string),
      ) ?? DENON_SOUND_MODES.NONE;

    if (soundMode === DENON_SOUND_MODES.NONE) {
      if (
        typeof data.selectSurround === "string" &&
        data.selectSurround.includes("DOLBY_SURROUND")
      ) {
        console.info("Mapped to DOLBY_DIGITAL");
        soundMode = DENON_SOUND_MODES.DOLBY;
      } else {
        console.info(`Unknown selectSurround: ${data.selectSurround}`);
      }
    }

    powerOn = data.zonePower === "ON";
    muteOn = data.mute === "ON";
  }

  return { ...previous, powerOn, muteOn, input, soundMode };
}

/** Failed optional fields are omitted, preserving their last known values. */
export async function fetchDenonAdvancedState(
  signal?: AbortSignal,
): Promise<Partial<DenonState>> {
  const MV = await fetchMasterVolume(signal);
  if (signal?.aborted || MV === undefined) return {};
  const PSDYNVOL = await fetchLevel("PSDYNVOL", signal);
  const psDynEqOn = await fetchOnState("PSDYNEQ", signal);
  const PSREFLEV = await fetchLevel("PSREFLEV", signal);
  const dialogueAdjust = await fetchDialogueAdjust(signal);
  return {
    MV,
    ...(PSDYNVOL === undefined ? {} : { PSDYNVOL }),
    ...(psDynEqOn === undefined ? {} : { psDynEqOn }),
    ...(PSREFLEV === undefined ? {} : { PSREFLEV }),
    ...(dialogueAdjust === undefined
      ? {}
      : { psDilOn: dialogueAdjust[0], PSDIL: dialogueAdjust[1] }),
  };
}
