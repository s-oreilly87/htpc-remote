import { RemoteType, REMOTE_INDEX } from "@/constants/remotes";
import PCRemotePanel from "@/components/RemotePanels/PC/PCRemotePanel";
import RokuRemotePanel from "@/components/RemotePanels/Roku/RokuRemotePanel";
import DenonRemotePanel from "@/components/RemotePanels/Denon/DenonRemotePanel";
import SlideScrollTransition from "@/components/UI/SlideScrollTransition";

interface RemotePanelSlideScrollProps {
  className: string;
  selectedRemote: RemoteType;
  setSelectedRemote: (remote: RemoteType) => void;
  prevRemote: RemoteType;
}

function RemotePanel({
  className,
  selectedRemote,
  setSelectedRemote,
  prevRemote,
}: RemotePanelSlideScrollProps) {
  return (
    <div className={`${className} relative panel-height overflow-hidden`}>
      <SlideScrollTransition
        show={selectedRemote === RemoteType.PC}
        selectedComponentIndex={REMOTE_INDEX[selectedRemote]}
        prevComponentIndex={REMOTE_INDEX[prevRemote]}
      >
        <PCRemotePanel />
      </SlideScrollTransition>

      <SlideScrollTransition
        show={selectedRemote === RemoteType.ROKU}
        selectedComponentIndex={REMOTE_INDEX[selectedRemote]}
        prevComponentIndex={REMOTE_INDEX[prevRemote]}
      >
        <RokuRemotePanel setSelectedRemote={setSelectedRemote} />
      </SlideScrollTransition>

      <SlideScrollTransition
        show={selectedRemote === RemoteType.DENON}
        selectedComponentIndex={REMOTE_INDEX[selectedRemote]}
        prevComponentIndex={REMOTE_INDEX[prevRemote]}
      >
        <DenonRemotePanel />
      </SlideScrollTransition>
    </div>
  );
}

export default RemotePanel;
