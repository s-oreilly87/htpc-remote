import { RemoteType } from "@/constants/remotes";
import ChannelButtons from "./ChannelButtons";
import HDMIInputButtons from "./HDMIInputButtons";
import MediaButtons from "../Shared/MediaButtons";
import BackHomeOption from "./BackHomeOption";
import BottomSection from "../Shared/BottomSection";
import Overlay from "@/components/UI/Overlay";
import { useRokuContext } from "@/context/roku";

const remote = RemoteType.ROKU;

interface RokuRemotePanelProps {
  setSelectedRemote: (remote: RemoteType) => void;
}

function RokuRemotePanel({ setSelectedRemote }: RokuRemotePanelProps) {
  const { rokuState } = useRokuContext();

  return (
    <>
      <Overlay show={!rokuState.powerOn} />
      <div
        id="roku-remote"
        className="absolute panel-height w-full p-3 flex flex-col justify-between"
      >
        <div className="flex flex-col flex-grow pb-[10%] gap-4 justify-between">
          <div className="flex flex-col gap-3">
            <ChannelButtons />
            <HDMIInputButtons setSelectedRemote={setSelectedRemote} />
          </div>
          <div className="flex flex-col flex-grow gap-3 justify-center">
            <MediaButtons remote={remote} />
            <BackHomeOption />
          </div>
        </div>
        <div className="shrink-0">
          <BottomSection remote={remote} />
        </div>
      </div>
    </>
  );
}

export default RokuRemotePanel;
