import {
  RemoteType,
  REMOTE_INDEX,
  REMOTE_ORDER,
  REMOTE_LABEL,
} from "@/constants/remotes";
import PCRemotePanel from "@/components/RemotePanels/PC/PCRemotePanel";
import RokuRemotePanel from "@/components/RemotePanels/Roku/RokuRemotePanel";
import DenonRemotePanel from "@/components/RemotePanels/Denon/DenonRemotePanel";
import SlideScrollTransition from "@/components/UI/SlideScrollTransition";

interface Props {
  isDesktop: boolean;
  selectedRemote: RemoteType;
  setSelectedRemote: (remote: RemoteType) => void;
  prevRemote?: RemoteType;
}

function RemotePanelSlideScroll({
  isDesktop,
  selectedRemote,
  setSelectedRemote,
  prevRemote,
}: Props) {
  return (
    <div className="remote-panels" aria-label="Remote controls">
      {REMOTE_ORDER.map((remote) => (
        <SlideScrollTransition
          key={remote}
          show={isDesktop || selectedRemote === remote}
          enabled={!isDesktop}
          className="remote-shell"
          selectedComponentIndex={REMOTE_INDEX[selectedRemote]}
          prevComponentIndex={prevRemote ? REMOTE_INDEX[prevRemote] : null}
        >
          <section
            className="remote-shell-inner"
            data-remote={remote}
            aria-label={`${REMOTE_LABEL[remote]} remote`}
          >
            {isDesktop && (
              <h1 className="remote-heading">{REMOTE_LABEL[remote]}</h1>
            )}
            <div className="remote-content">
              <div className="remote-controls">
                {remote === RemoteType.DENON && <DenonRemotePanel />}
                {remote === RemoteType.ROKU && (
                  <RokuRemotePanel setSelectedRemote={setSelectedRemote} />
                )}
                {remote === RemoteType.PC && <PCRemotePanel />}
              </div>
            </div>
          </section>
        </SlideScrollTransition>
      ))}
    </div>
  );
}

export default RemotePanelSlideScroll;
