import Constants, { DENON_SOUND_MODES } from "@/utilities/constants.js";
import KeypressButton from "@/components/UI/KeypressButton";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMinus, faPlus } from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";
import { sendDenonCommand } from "@/utilities/http";
import { buttonPress } from "@/utilities/utils.js";
import Toggle from "@/components/UI/Toggle.js";
import { dot_matrix } from "@/styles/fonts.js";
import { useDenonContext } from "@/context/denon.js";

const remote = Constants.REMOTE.DENON;

const DIALOGUE_ADJUST_DISABLED_MODES = [
  DENON_SOUND_MODES.STEREO,
  DENON_SOUND_MODES.DIRECT,
  DENON_SOUND_MODES.PURE_DIRECT,
];
const AdvancedVolumeControl = ({}) => {
  const [denonState, updateDenonState, refreshDenonState] = useDenonContext();

  const [buttonPressTimer, setButtonPressTimer] = useState();

  const parseAndSetDialogueAdjustLevel = (responseValue) => {
    // 0.5 steps come in without the decimal
    if (responseValue.length === 3) {
      responseValue = parseFloat(responseValue) / 10;
    } else {
      responseValue = parseFloat(responseValue);
    }

    // 50 is the new 0
    responseValue -= 50;
    updateDenonState({ PSDIL: responseValue });
  };

  const handleClick = async (event) => {
    const button = event.currentTarget;
    buttonPress(button, buttonPressTimer, setButtonPressTimer);

    const response = await sendDenonCommand(button, "command");
    if (response.error) {
      return console.log(response.error);
    }

    // Update denonState based on the response
    // PSDIL comes in as an array of [PSDIL ON/OFF, PSDIL LEVEL]
    for (const line of response.data) {
      const splitData = line.split(" ");

      if (splitData[0] === "PSDIL" && ["ON", "OFF"].includes(splitData[1])) {
        updateDenonState({ psDilOn: splitData[1] === "ON" });
      } else if (splitData[0] === "PSDIL") {
        // PSDIL LEVEL needs to be parsed
        parseAndSetDialogueAdjustLevel(splitData[1]);
      } else if (denonState.hasOwnProperty(splitData[0])) {
        updateDenonState({ [splitData[0]]: splitData[1] });
      }
    }
  };

  const handleDynEqToggle = (enabled) => {
    updateDenonState({ psDynEqOn: enabled });
    handleClick({
      currentTarget: { value: `PSDYNEQ ${enabled ? "ON" : "OFF"}` },
    });
  };

  const handlePsDilToggle = (enabled) => {
    updateDenonState({ psDilOn: enabled });
    handleClick({
      currentTarget: { value: `PSDIL ${enabled ? "ON" : "OFF"}` },
    });
  };

  return (
    <div className="flex gap-4 w-full max-h-18">
      <div className="flex flex-col w-1/3 items-center justify-center">
        <Toggle
          label={"Dialogue Adjust"}
          labelColor={"teal-500"}
          labelPos={"above"}
          color={denonState.loading ? "teal-600" : "teal-500"}
          enabled={
            denonState.psDilOn &&
            !DIALOGUE_ADJUST_DISABLED_MODES.includes(denonState.soundMode)
          }
          onToggle={handlePsDilToggle}
          disabled={DIALOGUE_ADJUST_DISABLED_MODES.includes(
            denonState.soundMode,
          )}
        />

        <div
          id="dialog-level"
          className={`flex w-full p-2 space-x-1 ${
            denonState.psDilOn &&
            !DIALOGUE_ADJUST_DISABLED_MODES.includes(denonState.soundMode)
              ? "opacity:100"
              : "opacity-0"
          } transition-all-500`}
          role="group"
        >
          <KeypressButton
            remote={Constants.REMOTE.DENON}
            className="btn-secondary w-1/3 items-center justify-center"
            value="PSDIL DOWN"
            onClick={handleClick}
            disabled={denonState.loading}
          >
            <FontAwesomeIcon icon={faMinus} />
          </KeypressButton>
          <div className={"flex w-1/3 justify-center items-center"}>
            <span
              className={`text-teal-500 ${dot_matrix.className} ${
                denonState.loading ? "opacity-50 animate-pulse" : ""
              }`}
            >
              {denonState.PSDIL > 0
                ? "+" + denonState.PSDIL.toFixed(1)
                : denonState.PSDIL.toFixed(1)}
            </span>
          </div>

          <KeypressButton
            remote={Constants.REMOTE.DENON}
            className="btn-secondary w-1/3 items-center justify-center"
            value="PSDIL UP"
            onClick={handleClick}
            disabled={denonState.loading}
          >
            <FontAwesomeIcon icon={faPlus} />
          </KeypressButton>
        </div>
      </div>

      <div className="flex flex-col gap-3 w-2/3 justify-end">
        <div className="flex flex-col gap-2 justify-center items-center ">
          <label
            htmlFor="dynamic-volume"
            className="text-center"
            style={{ color: "#00be9f" }}
          >
            Dynamic Volume
          </label>

          <div id="dynamic-volume" className="flex" role="group">
            <KeypressButton
              remote={remote}
              className={`${
                denonState.PSDYNVOL === "OFF"
                  ? "btn-primary-denon"
                  : "btn-secondary"
              } \
                                            w-1/4 items-center justify-center`}
              value="PSDYNVOL OFF"
              onClick={handleClick}
              disabled={denonState.loading}
            >
              Off
            </KeypressButton>
            <KeypressButton
              remote={remote}
              className={`${
                denonState.PSDYNVOL === "LIT"
                  ? "btn-primary-denon"
                  : "btn-secondary"
              } \
                                            w-1/4 items-center justify-center`}
              value="PSDYNVOL LIT"
              onClick={handleClick}
              disabled={denonState.loading}
            >
              Low
            </KeypressButton>
            <KeypressButton
              remote={remote}
              className={`${
                denonState.PSDYNVOL === "MED"
                  ? "btn-primary-denon"
                  : "btn-secondary"
              } \
                                            w-1/4 items-center justify-center`}
              value="PSDYNVOL MED"
              onClick={handleClick}
              disabled={denonState.loading}
            >
              Med
            </KeypressButton>
            <KeypressButton
              remote={remote}
              className={`${
                denonState.PSDYNVOL === "HEV"
                  ? "btn-primary-denon"
                  : "btn-secondary"
              } \
                                            w-1/4 items-center justify-center`}
              value="PSDYNVOL HEV"
              onClick={handleClick}
              disabled={denonState.loading}
            >
              High
            </KeypressButton>
          </div>
        </div>

        <div className="flex flex-col gap-2 justify-center items-center ">
          <Toggle
            label={"Dynamic EQ"}
            labelColor={"teal-500"}
            color={denonState.loading ? "teal-600" : "teal-500"}
            enabled={denonState.psDynEqOn}
            onToggle={handleDynEqToggle}
          />
          <div
            id="dynamic-eq"
            className={`flex ${
              denonState.psDynEqOn ? "opacity-100" : "opacity-0"
            } transition-all-500`}
            role="group"
          >
            <KeypressButton
              remote={remote}
              className={`w-1/4 ${
                denonState.PSREFLEV === "0"
                  ? "btn-primary-denon"
                  : "btn-secondary"
              }`}
              value="PSREFLEV 0"
              onClick={handleClick}
              disabled={denonState.loading}
            >
              0db
            </KeypressButton>
            <KeypressButton
              remote={remote}
              className={`w-1/4 ${
                denonState.PSREFLEV === "5"
                  ? "btn-primary-denon"
                  : "btn-secondary"
              }`}
              value="PSREFLEV 5"
              onClick={handleClick}
              disabled={denonState.loading}
            >
              5db
            </KeypressButton>
            <KeypressButton
              remote={remote}
              className={`w-1/4 ${
                denonState.PSREFLEV === "10"
                  ? "btn-primary-denon"
                  : "btn-secondary"
              }`}
              value="PSREFLEV 10"
              onClick={handleClick}
              disabled={denonState.loading}
            >
              10db
            </KeypressButton>
            <KeypressButton
              remote={remote}
              className={`w-1/4 ${
                denonState.PSREFLEV === "15"
                  ? "btn-primary-denon"
                  : "btn-secondary"
              }`}
              value="PSREFLEV 15"
              onClick={handleClick}
              disabled={denonState.loading}
            >
              15db
            </KeypressButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedVolumeControl;
