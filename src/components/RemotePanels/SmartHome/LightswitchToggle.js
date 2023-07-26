import {useTplinkContext} from "@/context/tplink.js";


export default function LightswitchToggle({ lightSwitch, handleToggle }) {
    const [tplinkState] = useTplinkContext()

    return (
        <>
            <span className="text-amber-400 text-center text-2xl">{lightSwitch.label}</span>
            <div className="flex justify-center gap-0.5 mb-5">
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