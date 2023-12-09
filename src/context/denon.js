import { createContext, useContext, useState } from "react";
import {
  DENON_INPUTS,
  DENON_SOUND_MODES,
  DENON_STATE_DEFAULTS,
} from "@/utilities/constants.js";
import { fetchMainZoneData, sendDenonQuery } from "@/utilities/http.js";

const Context = createContext();

export function DenonProvider({ children }) {
  const [denonState, setDenonState] = useState(DENON_STATE_DEFAULTS);

  const updateDenonState = (props) => {
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
      return console.error(response.error);
    }

    const data = response.data;

    let input = Object.values(DENON_INPUTS).find((input) =>
      input.inputFuncSelect.includes(data.inputFuncSelect),
    );
    if (!input) {
      console.info(`Unknown Input: ${data.inputFuncSelect}`);
    }

    let soundMode = Object.values(DENON_SOUND_MODES).find((mode) =>
      mode.selectSurround.includes(data.selectSurround),
    );
    if (!soundMode) {
      console.info(`Unknown selectSurround: ${data.selectSurround}`);
      if (data.selectSurround.includes("DOLBY_SURROUND")) {
        console.info("Mapped to DOLBY_DIGITAL");
        soundMode = "DOLBY_DIGITAL";
      } else {
        soundMode = DENON_SOUND_MODES.NONE;
      }
    }

    updateDenonState({
      input: input,
      powerOn: data.zonePower === "ON",
      muteOn: data.mute === "ON",
      soundMode: soundMode,
    });
  };

  const updateDenonStateFromFetchLevels = async () => {
    const toUpdate = {};
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

  const fetchLevel = async (query) => {
    const response = await sendDenonQuery(query);
    if (response.error) {
      console.error(response.error);
    } else {
      return response.data[0].split(" ")[1];
    }
  };

  const refreshLevel = async (query) => {
    updateDenonState({
      [query]: await fetchLevel(query),
    });
  };

  const fetchOnState = async (query) => {
    const response = await sendDenonQuery(query);
    if (response.error) {
      console.error(response.error);
    } else {
      return response.data[0].split(" ")[1] === "ON";
    }
  };

  const refreshOnState = async (query) => {
    updateDenonState({
      [query]: await fetchOnState(query),
    });
  };

  const fetchMasterVolume = async () => {
    const masterVolResponse = await sendDenonQuery("MV");
    if (masterVolResponse.error) {
      console.error(masterVolResponse.error);
    } else {
      // "MV415" -> 41.5
      let value;
      for (const val of masterVolResponse.data) {
        if (val.startsWith("MV") && !val.startsWith("MVMAX")) {
          value = val.split("V")[1];
          break;
        }
      }

      if (value.length === 3) {
        value = parseFloat(value) / 10;
      } else if (value[0] === "0") {
        value = parseFloat(value[1]).toFixed(1);
      } else {
        value = parseFloat(value).toFixed(1);
      }
      return value;
    }
  };

  const refreshMasterVolume = async () => {
    updateDenonState({ MV: await fetchMasterVolume() });
  };

  const fetchDialogueAdjust = async () => {
    const dialogueAdjustResponse = await sendDenonQuery("PSDIL");
    // dialogueAdjustResponse[0] = ON/OFF, [1] = LEVEL
    if (dialogueAdjustResponse.error) {
      console.error(dialogueAdjustResponse.error);
    } else {
      const psDilOn = dialogueAdjustResponse.data[0].split(" ")[1] === "ON";
      let PSDIL = 0;
      if (dialogueAdjustResponse.data[1]) {
        PSDIL = parseDialogueAdjustLevel(
          dialogueAdjustResponse.data[1].split(" ")[1],
        );
      } else {
        console.error(
          "for some reason didnt get 2 part PSDIL data. Heres what we got:",
        );
        console.error(dialogueAdjustResponse.data);
      }
      return [psDilOn, PSDIL];
    }
  };

  const refreshDialogueAdjust = async () => {
    const dialogueAdjust = await fetchDialogueAdjust();
    updateDenonState({
      psDilOn: dialogueAdjust[0],
      PSDIL: dialogueAdjust[1],
    });
  };

  const parseDialogueAdjustLevel = (responseValue) => {
    // 0.5 steps come in without the decimal
    if (responseValue.length === 3) {
      responseValue = parseFloat(responseValue) / 10;
    } else {
      responseValue = parseFloat(responseValue);
    }

    // 50 is the new 0
    responseValue -= 50;
    return responseValue;
  };

  const refreshDenonState = {
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

export function useDenonContext() {
  return useContext(Context);
}
