import { RemoteType } from "@/constants/remotes";
import HTPCPresets from "./HTPCPresets";
import AppButtons from "./AppButtons";
import MediaButtons from "../Shared/MediaButtons";
import BottomSection from "../Shared/BottomSection";
import AirMouse from "@/components/RemotePanels/PC/AirMouse";
import KeypressButton from "@/components/UI/KeypressButton";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faStar, faCircleInfo, faBars} from "@fortawesome/free-solid-svg-icons";
import { usePlatform } from "@/hooks/usePlatform";

const remote = RemoteType.PC;

function PCRemote() {
  const { isLinux, isLinuxWayland } = usePlatform();

  const showAirMouse = !isLinuxWayland;
  const showKodiButtons = isLinux;

  return (
    <div
      id="htpc-remote"
      className="absolute w-full panel-height p-3 flex flex-col justify-between"
    >
      <div className="flex flex-col gap-4 justify-between">
        <HTPCPresets />
        <MediaButtons remote={remote} />
        <AppButtons />

        {showAirMouse && <AirMouse />}
      </div>
      <div className="h-50 items-end">
        {showKodiButtons && <KodiButtons />}
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
                    remote={RemoteType.PC}
                    className="btn btn-secondary w-20 flex flex-col items-center justify-center gap-1"
                    value="KEYSTROKE_i"
                >
                    <FontAwesomeIcon icon={faCircleInfo} className="w-1/3 mx-auto" />
                </KeypressButton>
                <KeypressButton
                    remote={RemoteType.PC}
                    className="btn btn-secondary w-20 flex flex-col items-center justify-center gap-1"
                    value="KEYSTROKE_c"
                >
                    <FontAwesomeIcon icon={faBars} className="w-1/3 mx-auto" />
                </KeypressButton>
                <KeypressButton
                    remote={RemoteType.PC}
                    className="btn btn-secondary w-20 flex flex-col items-center justify-center gap-1"
                    value="KEYSTROKE_o"
                >
                    <FontAwesomeIcon icon={faStar} className="w-1/3 mx-auto" />
                </KeypressButton>
            </div>
        </div>

    );
}