import Constants from "@/utilities/constants.js";
import RokuChannels from "./ButtonGroups/RokuChannels";
import HDMIInputs from "./ButtonGroups/HDMIInputs";
import MediaButtons from "../Shared/ButtonGroups/MediaButtons";
import BackHomeOption from "./ButtonGroups/BackHomeOption";
import BottomSection from "../Shared/BottomSection";
import {useEffect} from "react";
import {fetchRokuDeviceInfo} from "@/utilities/http.js";
import Overlay from "@/components/UI/Overlay.js";
import findRokuDevices from "@/utilities/roku-ssdp.js";


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

    const searchForRoku = async () => {
        const ipAddresses = await fetch('api/cors-proxy?url=http://192.168.1.102:8060/query/device-info')
        console.log(ipAddresses)
    }

    return (
        <>
            <Overlay show={!rokuState.powerOn} />
            <div id="roku-remote" className="absolute panel-height w-full p-3 flex flex-col justify-between">
                <div className="flex flex-col gap-4 justify-between">
                    <RokuChannels setPowerOn={setRokuPowerOn}/>
                    <HDMIInputs setPowerOn={setRokuPowerOn}/>
                    <MediaButtons remote={remote} />
                    {/*<button className="btn" onClick={searchForRoku}>Search For Roku</button>*/}
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
