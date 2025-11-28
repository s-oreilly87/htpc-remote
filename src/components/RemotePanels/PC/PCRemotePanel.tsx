import Constants from "@/utilities/constants";
import HTPCPresets from "./HTPCPresets";
import AppButtons from "./AppButtons";
import MediaButtons from "../Shared/MediaButtons";
import BottomSection from "../Shared/BottomSection";
import AirMouse from "@/components/RemotePanels/PC/AirMouse";

const remote = Constants.REMOTE.PC;
const PLATFORM = process.env.NEXT_PUBLIC_PLATFORM ?? "";
const SHOW_AIR_MOUSE = PLATFORM !== "LINUX_WAYLAND";

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
        <BottomSection remote={remote} />
      </div>
    </div>
  );
}

export default PCRemote;
