import { RemoteType, KEYSTROKE } from "@/constants/remotes";
import KeypressButton from "@/components/UI/KeypressButton";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faPowerOff} from "@fortawesome/free-solid-svg-icons";
import {sendDenonCommand} from "@/utilities/http";
import {useDenonContext} from "@/context/denon";

const remote = RemoteType.DENON;

function DenonBottomLeftButtons({}) {
  const { denonState, updateDenonState } = useDenonContext();

  const handleClickPowerButton = async (event) => {
    updateDenonState({
      powerOn: !denonState.powerOn,
    });

    // Unless power state could be unknown, awaiting response is unnecessary and could be dropped for responsiveness
    // For now it will change it back, if response is unexpected
    const response = await sendDenonCommand(event.currentTarget);
    if (response.error) {
      return console.error(response.error);
    }

    let powerOn = response.data;

    updateDenonState({
      powerOn: !!powerOn ?? !denonState.powerOn,
    });
  };
  return (
    <div className="flex flex-col w-full pb-4">
      <KeypressButton
        remote={remote}
        className="size-12 p-3 bg-red-600 rounded-full flex items-center justify-center text-white shadow-inner shadow-red-400/70 select-none self-start"
        value={KEYSTROKE.DENON.POWER}
        onClick={handleClickPowerButton}
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
