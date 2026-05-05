import { RemoteType } from "@/constants/remotes";
import InputButtons from "./InputButtons";
import AdvancedVolumeControl from "./AdvancedVolumeControl";
import BottomSection from "../Shared/BottomSection";
import Overlay from "@/components/UI/Overlay";
import { useDenonContext } from "@/context/denon";
import SoundModes from "@/components/RemotePanels/Denon/SoundModes";

const remote = RemoteType.DENON;

function DenonRemote() {
  const { denonState } = useDenonContext();

  return (
    <>
      <Overlay show={!denonState.powerOn} />
      <div
        id="denon-remote"
        className="absolute panel-height w-full p-3 flex flex-col justify-between"
      >
        <div className="flex flex-col justify-between flex-grow pb-[15%]">
          <InputButtons />
          <SoundModes />
          <AdvancedVolumeControl />
        </div>
        <div className="shrink-0">
          <BottomSection remote={remote} />
        </div>
      </div>
    </>
  );
}

export default DenonRemote;
