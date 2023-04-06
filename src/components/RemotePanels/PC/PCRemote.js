import Constants from "@/utilities/constants.js";
import AudioVideoPresets from "./ButtonGroups/AudioVideoPresets";
import AppButtons from "./ButtonGroups/AppButtons";
import MediaButtons from "../Shared/ButtonGroups/MediaButtons";
import BottomSection from "../Shared/BottomSection";
import AirMouse from "@/components/RemotePanels/PC/AirMouse";

const remote = Constants.REMOTE.PC

function PCRemote() {
    return (
        <div id="htpc-remote" className="absolute w-full panel-height p-3 flex flex-col justify-between">
            <div className="flex flex-col gap-4 justify-between">
                <AudioVideoPresets />
                <MediaButtons remote={remote}/>
                <AppButtons />
                <AirMouse />
            </div>
            <div className="h-50 items-end">
                <BottomSection remote={remote} />
            </div>
        </div>
    );
}

export default PCRemote;
