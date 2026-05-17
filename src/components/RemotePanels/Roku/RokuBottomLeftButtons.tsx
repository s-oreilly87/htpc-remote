import { RemoteType } from "@/constants/remotes";
import KeyboardGroup from "../Shared/KeyboardGroup";
import { faPowerOff } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { sendRokuKeypress } from "@/utilities/http";
import { useRokuContext } from "@/context/roku";
import { useRokuCec } from "@/hooks/useRokuCec";

function RokuBottomLeftButtons() {
  const { invalidateRokuState } = useRokuContext();
  const { toggleRokuPower } = useRokuCec();

  const handleClickPower = () => {
    toggleRokuPower();
    sendRokuKeypress({ value: "Power" });
    // Confirm actual power state after the TV has had time to respond
    setTimeout(invalidateRokuState, 1000);
  };

  return (
    <div className="relative">
      <button
        className="relative z-50 size-12 p-3 bg-red-600 text-white rounded-full flex justify-center items-center shadow-inner shadow-red-400/70 select-none"
        value="powerButton"
        onClick={handleClickPower}
      >
        <FontAwesomeIcon icon={faPowerOff} />
      </button>
      <KeyboardGroup remote={RemoteType.ROKU} />
    </div>
  );
}

export default RokuBottomLeftButtons;
