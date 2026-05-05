import { DENON_INPUTS, DENON_SOUND_MODES } from "@/constants/denon";
import type { DenonSoundMode, DenonState } from "@/types/remote";
import { fetchMainZoneData, sendDenonQuery } from "@/utilities/http";

export const DENON_QUERY_KEY = ["denon-state"] as const;

// ── Low-level telnet fetch helpers ───────────────────────────────────────────

async function fetchLevel(query: string): Promise<string | undefined> {
  const response = await sendDenonQuery(query);
  if (response.error) {
    console.error(response.error);
    return undefined;
  }
  return response.data?.[0]?.split(" ")[1];
}

async function fetchOnState(query: string): Promise<boolean | undefined> {
  const response = await sendDenonQuery(query);
  if (response.error) {
    console.error(response.error);
    return undefined;
  }
  return response.data?.[0]?.split(" ")[1] === "ON";
}

async function fetchMasterVolume(): Promise<number | undefined> {
  const masterVolResponse = await sendDenonQuery("MV");
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

export async function fetchDialogueAdjust(): Promise<[boolean, number] | undefined> {
  const response = await sendDenonQuery("PSDIL");
  if (response.error) {
    console.error(response.error);
    return undefined;
  }
  if (!response.data) return undefined;

  const psDilOn = response.data[0].split(" ")[1] === "ON";
  let PSDIL = 0;

  let levelIndex = 1;
  while (response.data[levelIndex] === response.data[0] && levelIndex < 8) {
    levelIndex++;
  }

  if (response.data[levelIndex]) {
    PSDIL = parseDialogueAdjustLevel(response.data[levelIndex].split(" ")[1]);
  } else {
    console.error("Didn't get 2-part PSDIL data:", response.data);
  }

  return [psDilOn, PSDIL];
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

// ── Main query function ──────────────────────────────────────────────────────
//
// The HTTP zone request runs concurrently with the telnet chain, but the
// telnet queries are kept SEQUENTIAL. The telnet client is a single-connection
// queue with a 50ms inter-command gap — firing multiple requests in parallel
// causes commands to overlap, responses to mix, and cascading timeouts.
//
// If any telnet field returns undefined (timeout / AVR unresponsive) we throw
// so TanStack keeps the previous cached state intact rather than writing
// partial/undefined values into the cache.

export async function fetchDenonState(): Promise<DenonState> {
  // Run HTTP and telnet chain concurrently — they use completely separate
  // connections so there's no contention between them.
  const [mainZoneResponse, telnetResults] = await Promise.all([
    fetchMainZoneData(),
    (async () => {
      const MV = await fetchMasterVolume();
      const PSDYNVOL = await fetchLevel("PSDYNVOL");
      const psDynEqOn = await fetchOnState("PSDYNEQ");
      const PSREFLEV = await fetchLevel("PSREFLEV");
      const dialogueAdjust = await fetchDialogueAdjust();
      return { MV, PSDYNVOL, psDynEqOn, PSREFLEV, dialogueAdjust };
    })(),
  ]);

  const { MV, PSDYNVOL, psDynEqOn, PSREFLEV, dialogueAdjust } = telnetResults;

  if (
    MV === undefined ||
    PSDYNVOL === undefined ||
    psDynEqOn === undefined ||
    PSREFLEV === undefined ||
    dialogueAdjust === undefined
  ) {
    throw new Error("Denon: one or more telnet queries failed — keeping previous state");
  }

  let input = null;
  let powerOn = false;
  let muteOn = false;
  let soundMode: DenonSoundMode = DENON_SOUND_MODES.NONE;

  if (!mainZoneResponse.error && mainZoneResponse.data) {
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

  return {
    powerOn,
    muteOn,
    input,
    soundMode,
    dynComp: "",
    psDilOn: dialogueAdjust?.[0] ?? false,
    psDynEqOn: psDynEqOn ?? false,
    MV,
    PSDIL: dialogueAdjust?.[1] ?? 0,
    PSREFLEV,
    PSDYNVOL,
  };
}
