import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  useMemo,
} from "react";
import { DENON_INPUTS, DENON_SOUND_MODES } from "@/constants/denon";
import type { DenonSoundMode, DenonState } from "@/types/remote";
import { fetchMainZoneData, sendDenonQuery } from "@/utilities/http";

export interface DenonRefreshers {
  all: () => Promise<void>;
  masterVol: () => Promise<void>;
  level: (query: string) => Promise<void>;
  onState: (query: string) => Promise<void>;
  dialogueAdjust: () => Promise<[boolean, number] | undefined>;
}

export type DenonContextValue = [
  DenonState,
  (props: Partial<DenonState>) => void,
  DenonRefreshers,
  React.Dispatch<React.SetStateAction<DenonState>>,
];

const Context = createContext<DenonContextValue | undefined>(undefined);

export const DENON_STATE_DEFAULTS: DenonState = {
  powerOn: false,
  muteOn: false,
  input: null,
  soundMode: DENON_SOUND_MODES.NONE,
  loading: false,
  dynComp: "",
  psDilOn: false,
  psDynEqOn: false,
  MV: 50.0,
  PSDIL: 0,
  PSREFLEV: "0",
  PSDYNVOL: "OFF",
};

export function DenonProvider({ children }: { children: ReactNode }) {
  const [denonState, setDenonState] = useState<DenonState>(DENON_STATE_DEFAULTS);

  const updateDenonState = useCallback((props: Partial<DenonState>) => {
    setDenonState((prevState) => ({ ...prevState, ...props }));
  }, []);

  const fetchLevel = useCallback(async (query: string) => {
    const response = await sendDenonQuery(query);
    if (response.error) {
      console.error(response.error);
    } else {
      return response.data?.[0]?.split(" ")[1];
    }
    return undefined;
  }, []);

  const refreshLevel = useCallback(
    async (query: string) => {
      updateDenonState({
        [query]: await fetchLevel(query),
      });
    },
    [fetchLevel, updateDenonState],
  );

  const fetchOnState = useCallback(async (query: string) => {
    const response = await sendDenonQuery(query);
    if (response.error) {
      console.error(response.error);
    } else {
      return response.data?.[0]?.split(" ")[1] === "ON";
    }
    return undefined;
  }, []);

  const refreshOnState = useCallback(
    async (query: string) => {
      updateDenonState({
        [query]: await fetchOnState(query),
      });
    },
    [fetchOnState, updateDenonState],
  );

  const fetchMasterVolume = useCallback(async () => {
    const masterVolResponse = await sendDenonQuery("MV");
    if (masterVolResponse.error) {
      console.error(masterVolResponse.error);
    } else if (masterVolResponse.data) {
      let value: string | number | undefined;
      for (const val of masterVolResponse.data) {
        if (val.startsWith("MV") && !val.startsWith("MVMAX")) {
          value = val.split("V")[1];
          break;
        }
      }

      if (value) {
        if (value.toString().length === 3) {
          return parseFloat(value.toString()) / 10;
        }
        if (value.toString()[0] === "0") {
          return Number(parseFloat(value.toString()[1]).toFixed(1));
        }
        return Number(parseFloat(value.toString()).toFixed(1));
      }
    }
    return undefined;
  }, []);

  const refreshMasterVolume = useCallback(async () => {
    const volume = await fetchMasterVolume();
    if (volume !== undefined) {
      updateDenonState({ MV: volume });
    }
  }, [fetchMasterVolume, updateDenonState]);

  const fetchDialogueAdjust = useCallback(async (): Promise<[boolean, number] | undefined> => {
    const dialogueAdjustResponse = await sendDenonQuery("PSDIL");
    if (dialogueAdjustResponse.error) {
      console.error(dialogueAdjustResponse.error);
    } else if (dialogueAdjustResponse.data) {
      const psDilOn = dialogueAdjustResponse.data[0].split(" ")[1] === "ON";
      let PSDIL = 0;

      let levelIndex = 1;
      while (
        dialogueAdjustResponse.data[levelIndex] === dialogueAdjustResponse.data[0] &&
        levelIndex < 8
      ) {
        levelIndex++;
      }

      if (dialogueAdjustResponse.data[levelIndex]) {
        PSDIL = parseDialogueAdjustLevel(
          dialogueAdjustResponse.data[levelIndex].split(" ")[1],
        );
      } else {
        console.error("for some reason didnt get 2 part PSDIL data. Heres what we got:");
        console.error(dialogueAdjustResponse.data);
      }
      return [psDilOn, PSDIL];
    }
    return undefined;
  }, []);

  const updateDenonStateFromMainZoneQuery = useCallback(async () => {
    const response = await fetchMainZoneData();

    if (response.error) {
      console.error(response.error);
      return;
    }

    const data = response.data ?? {};

    const input = Object.values(DENON_INPUTS).find((denonInput) =>
      denonInput.inputFuncSelect.includes(data.inputFuncSelect as string),
    );
    if (!input) {
      console.info(`Unknown Input: ${data.inputFuncSelect}`);
    }

    let soundMode: DenonSoundMode | undefined =
      Object.values(DENON_SOUND_MODES).find((mode) =>
        mode.selectSurround.includes(data.selectSurround as string),
      );
    if (!soundMode) {
      console.info(`Unknown selectSurround: ${data.selectSurround}`);
      if (typeof data.selectSurround === "string" && data.selectSurround.includes("DOLBY_SURROUND")) {
        console.info("Mapped to DOLBY_DIGITAL");
        soundMode = DENON_SOUND_MODES.DOLBY;
      } else {
        soundMode = DENON_SOUND_MODES.NONE;
      }
    }

    updateDenonState({
      input: input ?? null,
      powerOn: data.zonePower === "ON",
      muteOn: data.mute === "ON",
      soundMode: soundMode ?? DENON_SOUND_MODES.NONE,
    });
  }, [updateDenonState]);

  const updateDenonStateFromFetchLevels = useCallback(async () => {
    const toUpdate: Partial<DenonState> = {};
    toUpdate.MV = await fetchMasterVolume();
    toUpdate.PSDYNVOL = await fetchLevel("PSDYNVOL");
    toUpdate.psDynEqOn = await fetchOnState("PSDYNEQ");
    toUpdate.PSREFLEV = await fetchLevel("PSREFLEV");
    const dialogueAdjust = await fetchDialogueAdjust();
    if (dialogueAdjust) {
      toUpdate.psDilOn = dialogueAdjust[0];
      toUpdate.PSDIL = dialogueAdjust[1];
    }

    updateDenonState(toUpdate);
  }, [
    fetchDialogueAdjust,
    fetchLevel,
    fetchMasterVolume,
    fetchOnState,
    updateDenonState,
  ]);

  const refreshAll = useCallback(async () => {
    updateDenonState({ loading: true });
    await updateDenonStateFromMainZoneQuery();
    await updateDenonStateFromFetchLevels();
    updateDenonState({ loading: false });
  }, [
    updateDenonState,
    updateDenonStateFromFetchLevels,
    updateDenonStateFromMainZoneQuery,
  ]);

  const refreshers = useMemo(
    () => ({
      all: refreshAll,
      masterVol: refreshMasterVolume,
      level: refreshLevel,
      onState: refreshOnState,
      dialogueAdjust: fetchDialogueAdjust,
    }),
    [
      fetchDialogueAdjust,
      refreshAll,
      refreshLevel,
      refreshMasterVolume,
      refreshOnState,
    ],
  );

  const contextValue = useMemo<DenonContextValue>(
    () => [denonState, updateDenonState, refreshers, setDenonState],
    [denonState, refreshers, updateDenonState],
  );

  return (
    <Context.Provider value={contextValue}>{children}</Context.Provider>
  );
}

export function useDenonContext(): DenonContextValue {
  const ctx = useContext(Context);
  if (!ctx) {
    throw new Error("useDenonContext must be used within a DenonProvider");
  }
  return ctx;
}

export const parseDialogueAdjustLevel = (levelString: string) => {
  const parsedLevel = parseFloat(levelString);

  if (Number.isNaN(parsedLevel)) {
    return 0;
  }

  // PSDIL values arrive as integers with an implicit decimal place and a 50 offset
  // Example: "535" should be interpreted as 3.5 (53.5 - 50)
  let level = parsedLevel;

  if (!levelString.includes(".") && levelString.length >= 3) {
    level /= 10;
  }

  return level - 50;
};
