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
  const { isLinuxWayland, isMac, isLinuxX11, hasFullHtpcControl, isRemoteHtpc } = usePlatform();

  // AirMouse uses NutJS — works on-host for Mac and LINUX_X11, not on Wayland
  const showAirMouse = !isLinuxWayland;

  // Mac requires Next.js to run on the HTPC itself — no remote control path exists.
  if (isMac && isRemoteHtpc) {
    return <HtpcUnavailablePanel message="Remote control of a Mac HTPC is not supported. The Next.js server must run on the Mac itself." />;
  }

  return (
    <div
      id="htpc-remote"
      className="absolute w-full panel-height p-3 flex flex-col justify-between"
    >
      <div className="flex flex-col gap-4 justify-between">
        {hasFullHtpcControl
          ? <HTPCPresets />
          // LINUX_X11 remote: only ydotool keystrokes work — no shell scripts
          : isLinuxX11 && isRemoteHtpc && <LimitedControlBanner />
        }
        <MediaButtons remote={remote} />
        {hasFullHtpcControl && <AppButtons />}
        {showAirMouse && <AirMouse />}
      </div>
      <div className="shrink-0">
        {hasFullHtpcControl && <KodiButtons />}
        <BottomSection remote={remote} />
      </div>
    </div>
  );
}

function HtpcUnavailablePanel({ message }: { message: string }) {
  return (
    <div className="absolute w-full panel-height p-3 flex flex-col items-center justify-center gap-4">
      <div className="bg-red-900/60 border border-red-500/50 rounded-lg p-6 max-w-sm text-center">
        <p className="text-red-300 font-medium mb-1">HTPC Unavailable</p>
        <p className="text-red-400/80 text-sm">{message}</p>
      </div>
    </div>
  );
}

function LimitedControlBanner() {
  return (
    <div className="bg-amber-900/40 border border-amber-500/40 rounded-lg p-3 text-center">
      <p className="text-amber-300 text-sm font-medium">Limited control mode</p>
      <p className="text-amber-400/70 text-xs mt-0.5">
        Remote LINUX_X11 HTPC — keystroke control only via ydotool.
        Audio/video presets and app launching require the server to run on the HTPC.
      </p>
    </div>
  );
}

export default PCRemote;

function KodiButtons() {
    return (
        <div className="flex flex-col gap-3 justify-between items-center mb-6 border border-gray-600/50 rounded-lg mx-auto p-3 w-fit">
            <span className="text-white text-sm">Kodi</span>
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