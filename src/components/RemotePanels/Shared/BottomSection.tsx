import { RemoteType } from "@/constants/remotes";
import RokuBottomLeftButtons from "../Roku/RokuBottomLeftButtons";
import DenonBottomLeftButtons from "../Denon/DenonBottomLeftButtons";
import Dpad from "./Dpad";
import VolumeControls from "./VolumeControls";
import PlexBottomLeftButtons from "@/components/RemotePanels/PC/PlexBottomLeftButtons";

function BottomSection({ remote, rokuState, setRokuPowerOn }: { remote: RemoteType, rokuState?: any, setRokuPowerOn?: any}) {
  return (
    <div id="bottom-section" className="w-full h-full flex">
      <div className="flex w-1/6">
        {remote === RemoteType.PC && <PlexBottomLeftButtons />}
        {remote === RemoteType.ROKU && (
          <RokuBottomLeftButtons
            rokuPowerOn={rokuState.powerOn}
            setRokuPowerOn={setRokuPowerOn}
          />
        )}
        {remote === RemoteType.DENON && <DenonBottomLeftButtons />}
      </div>
      <div className="flex p-6 pt-0 pb-12 w-2/3">
        <Dpad remote={remote} />
      </div>
      <div className="flex flex-col p-0 h-auto w-1/6">
        <VolumeControls remote={remote} />
      </div>
    </div>
  );
}

export default BottomSection;
