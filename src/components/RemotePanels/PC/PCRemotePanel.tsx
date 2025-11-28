import Constants from "@/utilities/constants";
import HTPCPresets from "./HTPCPresets";
import AppButtons from "./AppButtons";
import MediaButtons from "../Shared/MediaButtons";
import BottomSection from "../Shared/BottomSection";
import AirMouse from "@/components/RemotePanels/PC/AirMouse";
import KeypressButton from "@/components/UI/KeypressButton";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faStar, faCircleInfo, faBars} from "@fortawesome/free-solid-svg-icons";

const remote = Constants.REMOTE.PC;
const PLATFORM = process.env.NEXT_PUBLIC_PLATFORM ?? "";
const SHOW_AIR_MOUSE = PLATFORM !== "LINUX_WAYLAND";
const SHOW_KODI_BUTTONS = ["LINUX", "LINUX_WAYLAND"].includes(PLATFORM);

function PCRemote() {
  return (
    <div
      id="htpc-remote"
      className="absolute w-full panel-height p-3 flex flex-col justify-between"
    >
      <div className="flex flex-col gap-4 justify-between">
        <HTPCPresets />
        <MediaButtons remote={remote} />
        <AppButtons />

        {SHOW_AIR_MOUSE && <AirMouse />}
      </div>
      <div className="h-50 items-end">
        {SHOW_KODI_BUTTONS && <KodiButtons />}
        <BottomSection remote={remote} />
      </div>
    </div>
  );
}

export default PCRemote;

function KodiButtons() {
    return (
        <div className="flex flex-col gap-4 justify-between items-center mb-10 border border-gray-600 rounded-lg mx-auto p-3 w-fit">
            <span className="text-white text-md">Kodi</span>
            <div className="flex gap-2 justify-center">
                <KeypressButton
                    remote={Constants.REMOTE.PC}
                    className="btn btn-secondary w-20 flex flex-col items-center justify-center gap-1"
                    value="KEYSTROKE_i"
                >
                    <FontAwesomeIcon icon={faCircleInfo} className="w-1/3 mx-auto" />
                </KeypressButton>
                <KeypressButton
                    remote={Constants.REMOTE.PC}
                    className="btn btn-secondary w-20 flex flex-col items-center justify-center gap-1"
                    value="KEYSTROKE_c"
                >
                    <FontAwesomeIcon icon={faBars} className="w-1/3 mx-auto" />
                </KeypressButton>
                <KeypressButton
                    remote={Constants.REMOTE.PC}
                    className="btn btn-secondary w-20 flex flex-col items-center justify-center gap-1"
                    value="KEYSTROKE_o"
                >
                    <FontAwesomeIcon icon={faStar} className="w-1/3 mx-auto" />
                </KeypressButton>
            </div>
        </div>

    );
}