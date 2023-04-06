import {REMOTE, REMOTE_INDEX} from "@/utilities/constants.js";
import {KeepAlive} from "react-fiber-keep-alive";
import PCRemote from "@/components/RemotePanels/PC/PCRemote";
import RokuRemote from "@/components/RemotePanels/Roku/RokuRemote";
import DenonRemote from "@/components/RemotePanels/Denon/DenonRemote";
import SlideScrollTransition from "@/components/UI/SlideScrollTransition";

function RemotePanel({
                         className,
                         selectedRemote,
                         prevRemote,
                         denonState,
                         setDenonState,
                         rokuState,
                         setRokuState,
                         pcState,
                         setPcState}) {
    return (
        <div className={className}>
            <SlideScrollTransition
                show={ selectedRemote === REMOTE.PC }
                selectedComponentIndex={ REMOTE_INDEX[selectedRemote] }
                prevComponentIndex={ REMOTE_INDEX[prevRemote] }>
                <KeepAlive name={ REMOTE.PC }>
                    <PCRemote pcState={pcState}
                              setPcState={setPcState}
                    />
                </KeepAlive>
            </SlideScrollTransition>

            <SlideScrollTransition
                show={ selectedRemote === REMOTE.ROKU }
                selectedComponentIndex={ REMOTE_INDEX[selectedRemote] }
                prevComponentIndex={ REMOTE_INDEX[prevRemote] }>
                <KeepAlive name={ REMOTE.ROKU }>
                    <RokuRemote rokuState={rokuState}
                                setRokuState={setRokuState}
                    />
                </KeepAlive>
            </SlideScrollTransition>

            <SlideScrollTransition
                show={ selectedRemote === REMOTE.DENON }
                selectedComponentIndex={ REMOTE_INDEX[selectedRemote] }
                prevComponentIndex={ REMOTE_INDEX[prevRemote] }>
                <KeepAlive name={ REMOTE.DENON }>
                    <DenonRemote denonState={denonState}
                                 setDenonState={setDenonState}
                    />
                </KeepAlive>
            </SlideScrollTransition>
        </div>
    );
}

export default RemotePanel;