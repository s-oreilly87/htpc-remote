import { createContext, useContext, useState, ReactNode } from "react";
import {
  DENON_INPUTS,
  DENON_SOUND_MODES,
  DENON_STATE_DEFAULTS,
  AudioModeOption,
  DenonState,
} from "@/components/RemotePanels/Denon/denonConstants";
import { fetchMainZoneData, sendDenonQuery } from "@/utilities/http";

export interface DenonRefreshers {
  all: () => Promise<void>;
  masterVol: () => Promise<void>;
  level: (query: string) => Promise<void>;
  onState: (query: string) => Promise<void>;
  dialogueAdjust: () => Promise<void>;
}

export type DenonContextValue = [
  DenonState,
  (props: Partial<DenonState>) => void,
  DenonRefreshers,
  React.Dispatch<React.SetStateAction<DenonState>>,
];

const Context = createContext<DenonContextValue | undefined>(undefined);

export function DenonProvider({ children }: { children: ReactNode }) {
  const [denonState, setDenonState] = useState<DenonState>(DENON_STATE_DEFAULTS);

  const updateDenonState = (props: Partial<DenonState>) => {
    setDenonState((prevState) => ({ ...prevState, ...props }));
  };

  const refreshAll = async () => {
    updateDenonState({ loading: true });
    await updateDenonStateFromMainZoneQuery();
    await updateDenonStateFromFetchLevels();
    updateDenonState({ loading: false });
  };

  const updateDenonStateFromMainZoneQuery = async () => {
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

    let soundMode: typeof DENON_SOUND_MODES[keyof typeof DENON_SOUND_MODES] =
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
  };

  const updateDenonStateFromFetchLevels = async () => {
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
  };

  const fetchLevel = async (query: string) => {
    const response = await sendDenonQuery(query);
    if (response.error) {
      console.error(response.error);
    } else {
      return response.data?.[0]?.split(" ")[1];
    }
    return undefined;
  };

  const refreshLevel = async (query: string) => {
    updateDenonState({
      [query]: await fetchLevel(query),
    });
  };

  const fetchOnState = async (query: string) => {
    const response = await sendDenonQuery(query);
    if (response.error) {
      console.error(response.error);
    } else {
      return response.data?.[0]?.split(" ")[1] === "ON";
    }
    return undefined;
  };

  const refreshOnState = async (query: string) => {
    updateDenonState({
      [query]: await fetchOnState(query),
    });
  };

  const fetchMasterVolume = async () => {
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
  };

  const refreshMasterVolume = async () => {
    const volume = await fetchMasterVolume();
    if (volume !== undefined) {
      updateDenonState({ MV: volume });
    }
  };

  const fetchDialogueAdjust = async (): Promise<[boolean, number] | undefined> => {
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
  };

  const refreshDialogueAdjust = async () => {
    const dialogueAdjust = await fetchDialogueAdjust();
    if (dialogueAdjust) {
      updateDenonState({
        psDilOn: dialogueAdjust[0],
        PSDIL: dialogueAdjust[1],
      });
    }
  };

  const parseDialogueAdjustLevel = (responseValue: string) => {
    if (responseValue.length === 3) {
      responseValue = (parseFloat(responseValue) / 10).toString();
    } else {
      responseValue = parseFloat(responseValue).toString();
    }

    return parseFloat(responseValue) - 50;
  };

  const refreshDenonState: DenonRefreshers = {
    all: refreshAll,
    masterVol: refreshMasterVolume,
    level: refreshLevel,
    onState: refreshOnState,
    dialogueAdjust: refreshDialogueAdjust,
  };
  return (
    <Context.Provider
      value={[denonState, updateDenonState, refreshDenonState, setDenonState]}
    >
      {children}
    </Context.Provider>
  );
}

export function useDenonContext(): DenonContextValue {
  const ctx = useContext(Context);
  if (!ctx) {
    throw new Error("useDenonContext must be used within a DenonProvider");
  }
  return ctx;
}
