import React, { useState } from "react";

import { REMOTE } from "@/utilities/constants";
import {
  sendDenonCommand,
  sendEventToHTPCEventGhost,
  sendKeystrokeToNutJS,
  sendRokuKeypress,
} from "@/utilities/http";
import { buttonPress, openPlexampAndroidApp } from "@/utilities/utils";

interface RemoteButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  remote: (typeof REMOTE)[keyof typeof REMOTE];
}

const RemoteButton: React.FC<RemoteButtonProps> = ({ remote, children, ...props }) => {
  const [buttonPressTimerId, setButtonPressTimerId] = useState<number | undefined>();

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (remote === REMOTE.ROKU) {
      sendRokuKeypress(event.currentTarget);
    } else if (remote === REMOTE.PC) {
      if (event.currentTarget.value.startsWith("KEYSTROKE")) {
        sendKeystrokeToNutJS(event.currentTarget.value);
      } else {
        sendEventToHTPCEventGhost(event.currentTarget);
        if (event.currentTarget.value === "launchPlexamp") {
          openPlexampAndroidApp();
        }
      }
    } else if (remote === REMOTE.DENON) {
      sendDenonCommand(event.currentTarget);
    }
    buttonPress(event.currentTarget, buttonPressTimerId ?? null, (timerId) =>
      setButtonPressTimerId(timerId),
    );
  };

  return (
    <button
      onClick={handleClick}
      {...props} // order matters - overwrite click handler with prop,  but add className btn to prop
      className={`btn ${props.className ?? ""}`}
    >
      {children}
    </button>
  );
};

export default RemoteButton;
