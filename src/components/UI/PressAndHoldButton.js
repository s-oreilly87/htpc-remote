import {REMOTE} from "@/utilities/constants";
import {useState} from "react";
import {
    sendDenonCommand,
    sendDenonQuery,
    sendEventToHTPCEventGhost,
    sendKeystrokeToNutJS,
    sendRokuKeydown,
    sendRokuKeypress,
    sendRokuKeyup,
} from "@/utilities/http";
import {buttonPress} from "@/utilities/utils";
import {useDenonContext} from "@/context/denon";

const PressAndHoldButton = ({
  remote,
  volumeButton = false,
  children,
  ...props
}) => {
  const [isHeld, setIsHeld] = useState(false);
  const [touchTimer, setTouchTimer] = useState(null);
  const [vibrateInterval, setVibrateInterval] = useState(null);
  const [sendKeyInterval, setSendKeyInterval] = useState(null);
  const [buttonPressTimer, setButtonPressTimer] = useState(null);

  const [denonState, updateDenonState, refreshDenonState, setDenonState] =
    useDenonContext();

  const pressAndHoldVibration = () => {
    setVibrateInterval(setInterval(() => navigator.vibrate(1), 75));
  };

  // ########  FOR PC  ########

  // SIMULATE keydown by sending keypress repeatedly instead of keydown event
  const pcSimulatePressAndHoldStart = (button) => {
    if (button.value.startsWith("KEYSTROKE")) {
      sendKeystrokeToNutJS(button.value);
    } else {
      sendEventToHTPCEventGhost(REMOTE.PC, button);
    }

    buttonPress(button, buttonPressTimer, setButtonPressTimer);
    setTouchTimer(
      setTimeout(() => {
        pressAndHoldVibration();
        setSendKeyInterval(
          setInterval(() => sendKeystrokeToNutJS(button.value), 150),
        );
      }, 500),
    );
  };

  const pcSimulatePressAndHoldEnd = (button) => {
    clearTimeout(touchTimer);
    clearInterval(sendKeyInterval);
    clearInterval(vibrateInterval);
  };

  //  Send keydown payload to EG to trigger actual keydown/keyup events - NOT USING
  function pcPressAndHoldStart(button) {
    sendEventToHTPCEventGhost(button, "-keydown");
    setTouchTimer(
      setTimeout(() => {
        setIsHeld(true);
        pressAndHoldVibration();
      }, 500),
    );
  }

  function pcPressAndHoldEnd(button) {
    clearTimeout(touchTimer);
    if (isHeld) {
      sendEventToHTPCEventGhost(button, "-keyup");
      clearInterval(vibrateInterval);
      setIsHeld(false);
    }
  }

  // ########   FOR ROKU  ########
  function rokuPressAndHoldStart(button) {
    sendRokuKeypress(button);
    buttonPress(button, buttonPressTimer, setButtonPressTimer);
    setTouchTimer(
      setTimeout(() => {
        setIsHeld(true);
        sendRokuKeydown(button);
        pressAndHoldVibration();
      }, 500),
    );
  }

  function rokuPressAndHoldEnd(button) {
    clearTimeout(touchTimer);
    if (isHeld) {
      sendRokuKeyup(button);
      clearInterval(vibrateInterval);
      setIsHeld(false);
    }
  }

  // #######  FOR DENON  #######

  // SIMULATE keydown by sending keypress repeatedly instead of keydown event
  const denonSimulatePressAndHoldStart = async (button) => {
    setTouchTimer(
      setTimeout(() => {
        pressAndHoldVibration();
        setSendKeyInterval(
          setInterval(async () => {
            sendDenonCommand(button);
            maybeChangeVolDisplay(button);
          }, 150),
        );
      }, 500),
    );

    sendDenonCommand(button);
    maybeChangeVolDisplay(button);
    buttonPress(button, buttonPressTimer, setButtonPressTimer);
  };

  const maybeChangeVolDisplay = (button) => {
    // Have to use setDenonState directly here to make sure I have access to the latest state when incrementing/decrementing
    if (button.value === "MVUP") {
      setDenonState((prevState) => ({
        ...prevState,
        MV: (parseFloat(prevState.MV) + 0.5).toFixed(1),
      }));
    } else if (button.value === "MVDOWN") {
      setDenonState((prevState) => ({
        ...prevState,
        MV: (parseFloat(prevState.MV) - 0.5).toFixed(1),
      }));
    }
  };

  const updateVolDisplayFromResponse = (response) => {
    if (response.data) {
      let value;
      for (const val of response.data) {
        if (val.startsWith("MV") && !val.startsWith("MVMAX")) {
          value = val.split("V")[1];
          break;
        }
      }
      if (!value) {
        return console.error(
          "Did not receive MasterVolume data in Denon response.",
        );
      }

      if (value.length === 3) {
        value = parseFloat(value) / 10;
      } else if (value[0] === "0") {
        value = parseFloat(value[1]).toFixed(1);
      } else {
        value = parseFloat(value).toFixed(1);
      }

      updateDenonState({ MV: value });
    }
  };

  const denonSimulatePressAndHoldEnd = async (button) => {
    clearTimeout(touchTimer);
    clearInterval(sendKeyInterval);
    clearInterval(vibrateInterval);
    if (button.value.startsWith("MV")) {
      const response = await sendDenonQuery("MV");
      updateVolDisplayFromResponse(response);
    }
  };

  const handleStartPressAndHold = (event) => {
    switch (remote) {
      case REMOTE.ROKU: {
        return rokuPressAndHoldStart(event.currentTarget);
      }
      case REMOTE.PC: {
        return pcSimulatePressAndHoldStart(event.currentTarget);
      }
      case REMOTE.DENON: {
        return denonSimulatePressAndHoldStart(event.currentTarget);
      }
    }
  };

  const handleEndPressAndHold = (event) => {
    event.preventDefault(); // prevents request being send twice
    switch (remote) {
      case REMOTE.ROKU: {
        return rokuPressAndHoldEnd(event.currentTarget);
      }
      case REMOTE.PC: {
        return pcSimulatePressAndHoldEnd(event.currentTarget);
      }
      case REMOTE.DENON: {
        return denonSimulatePressAndHoldEnd(event.currentTarget);
      }
    }
    event.currentTarget.blur();
  };

  return (
    <button
      {...props}
      className={`btn touch-none ${props.className}`}
      onMouseDown={handleStartPressAndHold}
      onTouchStart={handleStartPressAndHold}
      onMouseUp={handleEndPressAndHold}
      onTouchEnd={handleEndPressAndHold}
    >
      {children}
    </button>
  );
};

export default PressAndHoldButton;
