import {REMOTE} from "@/utilities/constants.js";
import RokuBottomLeftButtons from "../Roku/RokuBottomLeftButtons.js";
import PCBottomLeftButtons from "../PC/PCBottomLeftButtons.js";
import DenonBottomLeftButtons from "../Denon/DenonBottomLeftButtons.js";
import Dpad from "./Dpad";
import VolumeControls from "./VolumeControls";

function BottomSection({ remote, denonState, setDenonState, rokuState, setRokuPowerOn }) {
    return (
        <div id="bottom-section" className="w-full h-full flex">
            <div className="flex w-1/6">
                {remote === REMOTE.PC &&
                    <PCBottomLeftButtons />
                }
                {remote === REMOTE.ROKU &&
                    <RokuBottomLeftButtons rokuPowerOn={rokuState.powerOn} setRokuPowerOn={setRokuPowerOn}/>
                }
                {remote === REMOTE.DENON &&
                    <DenonBottomLeftButtons denonState={denonState} setDenonState={setDenonState} />
                }
            </div>
            <div className="flex p-6 pt-0 pb-12 w-2/3">
                <Dpad remote={ remote } />
            </div>
            <div className="flex flex-col p-0 h-auto w-1/6">
                <VolumeControls remote={ remote } denonState={ denonState } />
            </div>
        </div>
    );
}

export default BottomSection;