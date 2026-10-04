import React from "react";
import { RemoteType, KEYSTROKE } from "@/constants/remotes";
import KeypressButton from "@/components/UI/KeypressButton";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPowerOff } from "@fortawesome/free-solid-svg-icons";
import { useDenonContext } from "@/context/denon";

const remote = RemoteType.DENON;

function DenonBottomLeftButtons() {
  const { togglePower, isPowerPending } = useDenonContext();
  return (
    <div className="flex flex-col w-full pb-4">
      <KeypressButton
        remote={remote}
        className="relative z-50 size-12 p-3 bg-red-600 rounded-full flex items-center justify-center text-white shadow-inner shadow-red-400/70 select-none self-start"
        value={KEYSTROKE.DENON.POWER}
        onClick={togglePower}
        disabled={isPowerPending}
        aria-busy={isPowerPending}
      >
        <FontAwesomeIcon icon={faPowerOff} />
      </KeypressButton>
      <div className="flex flex-col flex-1 justify-center">
        <div className="flex flex-col gap-2">
          <KeypressButton
            remote={remote}
            className="btn-secondary w-full"
            value={KEYSTROKE.DENON.MENU_TOGGLE}
          >
            Menu
          </KeypressButton>
          <KeypressButton
            remote={remote}
            className="btn-secondary w-full"
            value={KEYSTROKE.DENON.OPTION}
          >
            Opt
          </KeypressButton>
          <KeypressButton
            remote={remote}
            className="btn-secondary w-full"
            value={KEYSTROKE.DENON.INFO}
          >
            Info
          </KeypressButton>
          <KeypressButton
            remote={remote}
            className="btn-secondary w-full"
            value={KEYSTROKE.DENON.BACK}
          >
            Back
          </KeypressButton>
        </div>
      </div>
    </div>
  );
}

export default DenonBottomLeftButtons;
