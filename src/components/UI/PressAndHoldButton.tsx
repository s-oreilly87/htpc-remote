import React, { useState } from "react";

import { REMOTE } from "@/utilities/constants";
import {
  sendDenonCommand,
  sendDenonQuery,
  sendEventToHTPCEventGhost,
  sendKeystrokeToNutJS,
  sendRokuKeydown,
  sendRokuKeypress,
  sendRokuKeyup,
  ValueButton,
} from "@/utilities/http";
import { buttonPress } from "@/utilities/utils";
import { useDenonContext } from "@/context/denon";

interface PressAndHoldButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  remote: (typeof REMOTE)[keyof typeof REMOTE];
  volumeButton?: boolean;
}

const PressAndHoldButton: React.FC<PressAndHoldButtonProps> = ({
  remote,
  volumeButton = false,
  children,
  ...props
}) => {
  const [isHeld, setIsHeld] = useState(false);
  const [touchTimer, setTouchTimer] = useState<NodeJS.Timeout | null>(null);
  const [vibrateInterval, setVibrateInterval] = useState<NodeJS.Timeout | null>(null);
  const [sendKeyInterval, setSendKeyInterval] = useState<NodeJS.Timeout | null>(null);
  const [buttonPressTimerId, setButtonPressTimerId] = useState<number | null>(null);

  const [_denonState, updateDenonState, _refreshDenonState, setDenonState] = useDenonContext();

  const pressAndHoldVibration = () => {
    setVibrateInterval(setInterval(() => navigator.vibrate(1), 75));
  };

  const pcSimulatePressAndHoldStart = (button: ValueButton & HTMLButtonElement) => {
    if (button.value.startsWith("KEYSTROKE")) {
      sendKeystrokeToNutJS(button.value);
    } else {
      sendEventToHTPCEventGhost(button);
    }

    buttonPress(button, buttonPressTimerId, (timerId) => setButtonPressTimerId(timerId));
    setTouchTimer(
      setTimeout(() => {
        pressAndHoldVibration();
        setSendKeyInterval(setInterval(() => sendKeystrokeToNutJS(button.value), 150));
      }, 500),
    );
  };

  const pcSimulatePressAndHoldEnd = () => {
    if (touchTimer) clearTimeout(touchTimer);
    if (sendKeyInterval) clearInterval(sendKeyInterval);
    if (vibrateInterval) clearInterval(vibrateInterval);
  };

  function pcPressAndHoldStart(button: ValueButton) {
    sendEventToHTPCEventGhost(button, "-keydown");
    setTouchTimer(
      setTimeout(() => {
        setIsHeld(true);
        pressAndHoldVibration();
      }, 500),
    );
  }

  function pcPressAndHoldEnd(button: ValueButton) {
    if (touchTimer) clearTimeout(touchTimer);
    if (isHeld) {
      sendEventToHTPCEventGhost(button, "-keyup");
      if (vibrateInterval) clearInterval(vibrateInterval);
      setIsHeld(false);
    }
  }

  function rokuPressAndHoldStart(button: ValueButton & HTMLButtonElement) {
    sendRokuKeypress(button);
    buttonPress(button, buttonPressTimerId, (timerId) => setButtonPressTimerId(timerId));
    setTouchTimer(
      setTimeout(() => {
        setIsHeld(true);
        sendRokuKeydown(button);
        pressAndHoldVibration();
      }, 500),
    );
  }

  function rokuPressAndHoldEnd(button: ValueButton) {
    if (touchTimer) clearTimeout(touchTimer);
    if (isHeld) {
      sendRokuKeyup(button);
      if (vibrateInterval) clearInterval(vibrateInterval);
      setIsHeld(false);
    }
  }

  const denonSimulatePressAndHoldStart = async (button: ValueButton & HTMLButtonElement) => {
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
    buttonPress(button, buttonPressTimerId, (timerId) => setButtonPressTimerId(timerId));
  };

  const maybeChangeVolDisplay = (button: ValueButton) => {
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

  const updateVolDisplayFromResponse = (response: { data?: string[] }) => {
    if (response.data) {
      let value: string | number | undefined;
      for (const val of response.data) {
        if (val.startsWith("MV") && !val.startsWith("MVMAX")) {
          value = val.split("V")[1];
          break;
        }
      }
      if (!value) {
        return console.error("Did not receive MasterVolume data in Denon response.");
      }

      if (typeof value === "string") {
        if (value.length === 3) {
          value = parseFloat(value) / 10;
        } else if (value[0] === "0") {
          value = parseFloat(value[1]).toFixed(1);
        } else {
          value = parseFloat(value).toFixed(1);
        }
      }

      updateDenonState({ MV: value as string });
    }
  };

  const denonSimulatePressAndHoldEnd = async (button: ValueButton) => {
    if (touchTimer) clearTimeout(touchTimer);
    if (sendKeyInterval) clearInterval(sendKeyInterval);
    if (vibrateInterval) clearInterval(vibrateInterval);
    if (button.value.startsWith("MV")) {
      const response = await sendDenonQuery("MV");
      updateVolDisplayFromResponse(response);
    }
  };

  const handleStartPressAndHold = (event: React.MouseEvent<HTMLButtonElement> | React.TouchEvent<HTMLButtonElement>) => {
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

  const handleEndPressAndHold = (event: React.MouseEvent<HTMLButtonElement> | React.TouchEvent<HTMLButtonElement>) => {
    event.preventDefault();
    switch (remote) {
      case REMOTE.ROKU: {
        return rokuPressAndHoldEnd(event.currentTarget);
      }
      case REMOTE.PC: {
        return pcSimulatePressAndHoldEnd();
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
      className={`btn touch-none ${props.className ?? ""}`}
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
