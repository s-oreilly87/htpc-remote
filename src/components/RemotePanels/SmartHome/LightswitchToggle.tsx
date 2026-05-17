import { useTplinkContext } from "@/context/tplink";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExclamationCircle } from "@fortawesome/free-solid-svg-icons";

interface Props {
  lightSwitch: { id: string; label: string };
  handleToggle: React.MouseEventHandler<HTMLButtonElement>;
}

export default function LightswitchToggle({ lightSwitch, handleToggle }: Props) {
  const [tplinkState] = useTplinkContext();

  return (
    <div className="flex flex-col w-[160px] min-w-[100px]">
      <div className="flex gap-2 justify-center items-center">
        <span className="text-amber-400 text-center text-xl">
          {lightSwitch.label}
        </span>
        {tplinkState[lightSwitch.id].error && (
          <FontAwesomeIcon
            icon={faExclamationCircle}
            className="h-6 w-6 text-red-800"
          />
        )}
      </div>
      <div
        className={`flex w-full justify-center gap-0.5 mb-5 ${
          tplinkState[lightSwitch.id].error ? "opacity-10" : ""
        }`}
      >
        <button
          className={`btn ${
            !tplinkState[lightSwitch.id].powerState
              ? "bg-red-800 text-red-950 shadow-inner shadow-red-700"
              : "btn-secondary text-gray-800"
          } rounded-r-none rounded-l-2xl w-1/2`}
          value={`${lightSwitch.id}/off`}
          onClick={handleToggle}
        >
          OFF
        </button>
        <button
          className={`btn ${
            tplinkState[lightSwitch.id].powerState
              ? "bg-green-600 text-yellow-200 shadow-inner shadow-green-500"
              : "btn-secondary text-gray-800"
          } rounded-l-none rounded-r-2xl w-1/2`}
          value={`${lightSwitch.id}/on`}
          onClick={handleToggle}
        >
          ON
        </button>
      </div>
      {tplinkState[lightSwitch.id].error && (
        <span className="text-red-600 text-center">
          Could not connect to device
        </span>
      )}
    </div>
  );
}
