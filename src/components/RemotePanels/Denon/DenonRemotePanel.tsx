import { REMOTE } from "@/utilities/constants";
import InputButtons from "./InputButtons";
import AdvancedVolumeControl from "./AdvancedVolumeControl";
import BottomSection from "../Shared/BottomSection";
import { useEffect } from "react";
import Overlay from "@/components/UI/Overlay";
import { useDenonContext } from "@/context/denon";
import SoundModes from "@/components/RemotePanels/Denon/SoundModes";

const remote = REMOTE.DENON;

function DenonRemote() {
  const [denonState, updateDenonState, refreshDenonState] = useDenonContext();

  // On render, query the amp for its current state (some data from MainZone HTTP request, levels data over telnet)
  useEffect(() => {
    refreshDenonState.all();
  }, [refreshDenonState.all]);

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
        <div className="h-50 items-end">
          <BottomSection remote={remote} />
        </div>
      </div>
    </>
  );
}

export default DenonRemote;
