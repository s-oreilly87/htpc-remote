import { useTplinkContext } from "@/context/tplink";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExclamationCircle } from "@fortawesome/free-solid-svg-icons";
import type { SmartHomeDeviceConfig } from "@/types/remote";

interface Props {
  lightSwitch: SmartHomeDeviceConfig;
  handleToggle: React.MouseEventHandler<HTMLButtonElement>;
}

export default function LightswitchToggle({ lightSwitch, handleToggle }: Props) {
  const [tplinkState] = useTplinkContext();
  const deviceState = tplinkState.devices[lightSwitch.id] ?? { powerState: false };

  return (
    <div className="flex flex-col w-full min-w-0 items-center">
      <div className="flex min-h-10 w-full items-end justify-center gap-1 px-1">
        <span className="text-center text-base font-semibold leading-tight text-amber-300">
          {lightSwitch.label}
        </span>
        {deviceState.error && (
          <FontAwesomeIcon
            icon={faExclamationCircle}
            className="mb-0.5 h-4 w-4 shrink-0 text-red-700"
          />
        )}
      </div>
      <div
        className={`mt-2 flex h-11 w-full max-w-36 justify-center gap-px ${
          deviceState.error ? "opacity-10" : ""
        }`}
      >
        <button
          className={`btn h-full w-1/2 rounded-l-xl rounded-r-none px-1 py-0 text-sm font-semibold ${
            !deviceState.powerState
              ? "bg-red-700 text-red-950 shadow-inner shadow-red-500/60"
              : "btn-secondary text-slate-300"
          }`}
          value={`${lightSwitch.id}/off`}
          onClick={handleToggle}
        >
          OFF
        </button>
        <button
          className={`btn h-full w-1/2 rounded-l-none rounded-r-xl px-1 py-0 text-sm font-semibold ${
            deviceState.powerState
              ? "bg-green-600 text-green-50 shadow-inner shadow-green-400/60"
              : "btn-secondary text-slate-300"
          }`}
          value={`${lightSwitch.id}/on`}
          onClick={handleToggle}
        >
          ON
        </button>
      </div>
      {deviceState.error && (
        <span className="mt-2 text-center text-xs text-red-500">
          Could not connect to device
        </span>
      )}
    </div>
  );
}
