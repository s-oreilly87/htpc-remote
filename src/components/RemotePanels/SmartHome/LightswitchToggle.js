import {useTplinkContext} from "@/context/tplink.js";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faExclamationCircle} from "@fortawesome/free-solid-svg-icons";


export default function LightswitchToggle({ lightSwitch, handleToggle }) {
    const [tplinkState] = useTplinkContext()

    return (
        <>
            <div className="flex gap-2 justify-center items-center">
                <span className="text-amber-400 text-center text-2xl">{lightSwitch.label}</span>
                {tplinkState[lightSwitch.id].error && <FontAwesomeIcon icon={ faExclamationCircle } className="h-6 w-6 text-red-800" />}
            </div>
            {tplinkState[lightSwitch.id].error && <span className="text-red-600 text-center">Could not connect to switch on {lightSwitch.ip}</span>}
            <div className={`flex justify-center gap-0.5 mb-5 ${tplinkState[lightSwitch.id].error ? "opacity-10" : ""}`} >
                <button
                    className={`btn ${! tplinkState[lightSwitch.id].powerState ? 'bg-red-900 text-red-500' : 'btn-secondary text-gray-800'} rounded-r-none rounded-l-2xl w-1/6`}
                    value={`${lightSwitch.id}/off`}
                    onClick={handleToggle}
                >
                    Off
                </button>
                <button
                    className={`btn ${tplinkState[lightSwitch.id].powerState ? 'bg-green-700 text-yellow-200' : 'btn-secondary text-gray-800'} rounded-l-none rounded-r-2xl w-1/6`}
                    value={`${lightSwitch.id}/on`}
                    onClick={handleToggle}
                >
                    On
                </button>
            </div>
        </>
    )
}