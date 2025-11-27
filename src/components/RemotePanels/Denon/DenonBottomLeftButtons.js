import Constants from "@/utilities/constants";
import KeypressButton from "@/components/UI/KeypressButton";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faPowerOff} from "@fortawesome/free-solid-svg-icons";
import {sendDenonCommand} from "@/utilities/http";
import {useDenonContext} from "@/context/denon";

const remote = Constants.REMOTE.DENON;
const KEYSTROKE = Constants.KEYSTROKE;

function DenonBottomLeftButtons({}) {
  const [denonState, updateDenonState, refreshDenonState] = useDenonContext();

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
      powerOn: powerOn ?? !denonState.powerOn,
    });
  };
  return (
    <div className="flex flex-col menu-buttons justify-between w-5/6">
      <KeypressButton
        remote={remote}
        className="btn bg-red-600 rounded-full aspect-square z-50 shadow-inner shadow-red-500"
        value={KEYSTROKE.DENON.POWER}
        onClick={handleClickPowerButton}
      >
        <FontAwesomeIcon icon={faPowerOff} />
      </KeypressButton>
      <KeypressButton
        remote={remote}
        className="btn-secondary"
        value={KEYSTROKE.DENON.MENU_TOGGLE}
      >
        Menu
      </KeypressButton>
      <KeypressButton
        remote={remote}
        className="btn-secondary"
        value={KEYSTROKE.DENON.OPTION}
      >
        Opt
      </KeypressButton>
      <KeypressButton
        remote={remote}
        className="btn-secondary"
        value={KEYSTROKE.DENON.INFO}
      >
        Info
      </KeypressButton>
      <KeypressButton
        remote={remote}
        className="btn-secondary"
        value={KEYSTROKE.DENON.BACK}
      >
        Back
      </KeypressButton>
    </div>
  );
}

export default DenonBottomLeftButtons;
