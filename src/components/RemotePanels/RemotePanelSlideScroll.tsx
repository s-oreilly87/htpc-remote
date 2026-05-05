import { RemoteType, REMOTE_INDEX } from "@/constants/remotes";
import { KeepAlive } from "react-fiber-keep-alive";
import PCRemotePanel from "@/components/RemotePanels/PC/PCRemotePanel";
import RokuRemotePanel from "@/components/RemotePanels/Roku/RokuRemotePanel";
import DenonRemotePanel from "@/components/RemotePanels/Denon/DenonRemotePanel";
import SlideScrollTransition from "@/components/UI/SlideScrollTransition";
import { DenonProvider } from "@/context/denon";
import { RokuProvider } from "@/context/roku";

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
    <DenonProvider>
      <RokuProvider>
        <div className={className}>
          <SlideScrollTransition
            show={selectedRemote === RemoteType.PC}
            selectedComponentIndex={REMOTE_INDEX[selectedRemote]}
            prevComponentIndex={REMOTE_INDEX[prevRemote]}
          >
            <KeepAlive name={RemoteType.PC}>
              <PCRemotePanel />
            </KeepAlive>
          </SlideScrollTransition>

          <SlideScrollTransition
            show={selectedRemote === RemoteType.ROKU}
            selectedComponentIndex={REMOTE_INDEX[selectedRemote]}
            prevComponentIndex={REMOTE_INDEX[prevRemote]}
          >
            <KeepAlive name={RemoteType.ROKU}>
              <RokuRemotePanel setSelectedRemote={setSelectedRemote} />
            </KeepAlive>
          </SlideScrollTransition>

          <SlideScrollTransition
            show={selectedRemote === RemoteType.DENON}
            selectedComponentIndex={REMOTE_INDEX[selectedRemote]}
            prevComponentIndex={REMOTE_INDEX[prevRemote]}
          >
            <KeepAlive name={RemoteType.DENON}>
              <DenonRemotePanel />
            </KeepAlive>
          </SlideScrollTransition>
        </div>
      </RokuProvider>
    </DenonProvider>
  );
}

export default RemotePanel;
