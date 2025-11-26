import {useState} from "react";
import {REMOTE} from "@/utilities/constants.js";
import {sendDenonCommand, sendEventToHTPCEventGhost, sendKeystrokeToNutJS, sendRokuKeypress,} from "@/utilities/http";
import {buttonPress, openPlexampAndroidApp} from "@/utilities/utils";

const RemoteButton = ({ remote, children, ...props }) => {
  const [buttonPressTimer, setButtonPressTimer] = useState();

  const handleClick = (event) => {
    if (remote === REMOTE.ROKU) {
      sendRokuKeypress(event.currentTarget);
    } else if (remote === REMOTE.PC) {
      if (event.currentTarget.value.startsWith("KEYSTROKE")) {
        sendKeystrokeToNutJS(event.currentTarget.value);
      } else {
        sendEventToHTPCEventGhost(event.currentTarget);
        if (event.currentTarget.value === 'launchPlexamp') {
          openPlexampAndroidApp()
        }
      }
    } else if (remote === REMOTE.DENON) {
      sendDenonCommand(event.currentTarget);
    }
    buttonPress(event.currentTarget, buttonPressTimer, setButtonPressTimer);
  };

  return (
    <button
      onClick={handleClick}
      {...props} // order matters - overwrite click handler with prop,  but add className btn to prop
      className={`btn ${props.className}`}
    >
      {children}
    </button>
  );
};

export default RemoteButton;
