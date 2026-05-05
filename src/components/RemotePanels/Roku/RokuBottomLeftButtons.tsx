import { RemoteType } from "@/constants/remotes";
import KeyboardGroup from "../Shared/KeyboardGroup";
import {faPowerOff} from "@fortawesome/free-solid-svg-icons";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {fetchRokuDeviceInfo, sendRokuKeypress} from "@/utilities/http";

function RokuBottomLeftButtons({ rokuPowerOn, setRokuPowerOn }) {
  const handleClickPower = () => {
    setRokuPowerOn(!rokuPowerOn);
    sendRokuKeypress({ value: "Power" });

    // Confirm power state after a sec and update state if needed
    setTimeout(async () => {
      const response = await fetchRokuDeviceInfo();
      if (response.data["powerMode"] === "PowerOn") {
        setRokuPowerOn(true);
      } else {
        setRokuPowerOn(false);
      }
    }, 1000);
  };

  return (
    <div className="relative z-50">
      <button
        className="w-12 h-12 p-3 bg-red-600 text-white rounded-full aspect-square flex justify-center items-center z-50 shadow-inner shadow-red-500"
        value="powerButton"
        onClick={handleClickPower}
      >
        <FontAwesomeIcon icon={faPowerOff} />
      </button>
      {rokuPowerOn && <KeyboardGroup remote={RemoteType.ROKU} />}
    </div>
  );
}

export default RokuBottomLeftButtons;
