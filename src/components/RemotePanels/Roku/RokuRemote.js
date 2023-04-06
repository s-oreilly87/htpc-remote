import Constants from "@/utilities/constants.js";
import RokuChannels from "./ButtonGroups/RokuChannels";
import HDMIInputs from "./ButtonGroups/HDMIInputs";
import MediaButtons from "../Shared/ButtonGroups/MediaButtons";
import BackHomeOption from "./ButtonGroups/BackHomeOption";
import BottomSection from "../Shared/BottomSection";
import {Transition} from "@headlessui/react";
import {Fragment, useEffect} from "react";
import {fetchRokuDeviceInfo} from "@/utilities/http.js";


const remote = Constants.REMOTE.ROKU
function RokuRemote({ rokuState, setRokuState }) {

    useEffect(() => {
        async function fetchPowerState() {
            const response = await fetchRokuDeviceInfo()

            if (response.error) {
                return
            }
            setRokuPowerOn( response.data['powerMode'] === "PowerOn")
        }
        fetchPowerState()
    }, [])

    const setRokuPowerOn = (powerOn) => {
        setRokuState(prevState => ({
            ...prevState,
            powerOn: powerOn
        }))
    }

    return (
        <>
            <Transition
                appear
                show={!rokuState.powerOn}
                as={Fragment}
            >
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-[1000ms]"
                    enterFrom="opacity-0"
                    enterTo="opacity-90"
                    leave="ease-in duration-[1000ms]"
                    leaveFrom="opacity-90"
                    leaveTo="opacity-0"
                >
                    <div className="absolute top-0 left-0 z-40 w-screen h-screen bg-slate-900" />
                </Transition.Child>
            </Transition>
            <div id="roku-remote" className="absolute panel-height w-full p-3 flex flex-col justify-between">
                <div className="flex flex-col gap-4 justify-between">
                    <RokuChannels setPowerOn={setRokuPowerOn}/>
                    <HDMIInputs setPowerOn={setRokuPowerOn}/>
                    <MediaButtons remote={remote} />
                    <BackHomeOption
                    />
                </div>
                <div className="h-50 items-end">
                    <BottomSection remote={remote} rokuState={rokuState} setRokuPowerOn={setRokuPowerOn} />
                </div>
            </div>
        </>
    );
}

export default RokuRemote;
