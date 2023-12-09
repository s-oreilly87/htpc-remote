import { REMOTE, REMOTE_INDEX } from "@/utilities/constants.js";
import { KeepAlive } from "react-fiber-keep-alive";
import PCRemotePanel from "@/components/RemotePanels/PC/PCRemotePanel";
import RokuRemotePanel from "@/components/RemotePanels/Roku/RokuRemotePanel";
import DenonRemotePanel from "@/components/RemotePanels/Denon/DenonRemotePanel";
import SlideScrollTransition from "@/components/UI/SlideScrollTransition";
import { DenonProvider } from "@/context/denon.js";

function RemotePanel({
  className,
  selectedRemote,
  prevRemote,
  rokuState,
  setRokuState,
  pcState,
  setPcState,
}) {
  return (
    <DenonProvider>
      <div className={className}>
        <SlideScrollTransition
          show={selectedRemote === REMOTE.PC}
          selectedComponentIndex={REMOTE_INDEX[selectedRemote]}
          prevComponentIndex={REMOTE_INDEX[prevRemote]}
        >
          <KeepAlive name={REMOTE.PC}>
            <PCRemotePanel pcState={pcState} setPcState={setPcState} />
          </KeepAlive>
        </SlideScrollTransition>

        <SlideScrollTransition
          show={selectedRemote === REMOTE.ROKU}
          selectedComponentIndex={REMOTE_INDEX[selectedRemote]}
          prevComponentIndex={REMOTE_INDEX[prevRemote]}
        >
          <KeepAlive name={REMOTE.ROKU}>
            <RokuRemotePanel
              rokuState={rokuState}
              setRokuState={setRokuState}
            />
          </KeepAlive>
        </SlideScrollTransition>

        <SlideScrollTransition
          show={selectedRemote === REMOTE.DENON}
          selectedComponentIndex={REMOTE_INDEX[selectedRemote]}
          prevComponentIndex={REMOTE_INDEX[prevRemote]}
        >
          <DenonRemotePanel />
        </SlideScrollTransition>
      </div>
    </DenonProvider>
  );
}

export default RemotePanel;
