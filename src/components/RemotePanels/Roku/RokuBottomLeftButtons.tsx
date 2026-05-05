import { RemoteType } from "@/constants/remotes";
import KeyboardGroup from "../Shared/KeyboardGroup";
import { faPowerOff } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { sendRokuKeypress } from "@/utilities/http";
import { useRokuContext } from "@/context/roku";

function RokuBottomLeftButtons() {
  const { rokuState, updateRokuState, invalidateRokuState } = useRokuContext();

  const handleClickPower = () => {
    updateRokuState({ powerOn: !rokuState.powerOn });
    sendRokuKeypress({ value: "Power" });
    // Confirm actual power state after the TV has had time to respond
    setTimeout(invalidateRokuState, 1000);
  };

  return (
    <div className="relative z-50">
      <button
        className="size-12 p-3 bg-red-600 text-white rounded-full flex justify-center items-center shadow-inner shadow-red-400/70 select-none"
        value="powerButton"
        onClick={handleClickPower}
      >
        <FontAwesomeIcon icon={faPowerOff} />
      </button>
      {rokuState.powerOn && <KeyboardGroup remote={RemoteType.ROKU} />}
    </div>
  );
}

export default RokuBottomLeftButtons;
