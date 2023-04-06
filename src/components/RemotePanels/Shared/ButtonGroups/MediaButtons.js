import RemoteButton from "@/components/UI/RemoteButton";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faBackward, faBackwardStep, faForward, faForwardStep, faPause, faPlay} from '@fortawesome/free-solid-svg-icons';
import {KEYSTROKE, REMOTE} from "@/utilities/constants.js";
import PressAndHoldButton from "@/components/UI/PressAndHoldButton";

function MediaButtons({ remote }) {

    return (
        <div id="media-buttons" className="w-full flex gap-2 h-12 max-h-12">
            <div className="flex w-full h-full place-content-center gap-2">
                { remote === REMOTE.PC &&
                    <RemoteButton remote={ remote }
                                  className="btn-secondary flex w-1/6 h-full items-center place-content-center"
                                  value={ KEYSTROKE[remote].PREV }
                    >
                        <FontAwesomeIcon icon={faBackwardStep} className="h-1/2"/>
                    </RemoteButton>
                }
                { remote === REMOTE.PC &&
                    <PressAndHoldButton remote={ remote }
                                        className="btn-secondary flex w-1/6 h-full items-center place-content-center"
                                        value={ KEYSTROKE[remote].REWIND }
                    >
                        <FontAwesomeIcon icon={faBackward} className="h-1/2"/>
                    </PressAndHoldButton>
                }
                { remote === REMOTE.ROKU &&
                    <RemoteButton remote={ remote }
                                  className="btn-secondary flex w-1/6 h-full items-center place-content-center"
                                  value={ KEYSTROKE[remote].REWIND }
                    >
                        <FontAwesomeIcon icon={faBackward} className="h-1/2"/>
                    </RemoteButton>
                }

                <RemoteButton remote={ remote }
                              className="btn-secondary w-1/6 h-full flex"
                              value={ KEYSTROKE[remote].PLAY }
                >
                    <div className="flex mx-auto my-auto gap-0 h-1/2 w-1/2 place-content-center items-center">
                        <FontAwesomeIcon icon={faPlay} />
                        <FontAwesomeIcon icon={faPause} />
                    </div>
                </RemoteButton>

                { remote === REMOTE.PC &&
                    <PressAndHoldButton remote={ remote }
                                        className="btn-secondary items-center place-content-center flex w-1/6 h-full"
                                        value={ KEYSTROKE[remote].FFWD }
                    >
                        <FontAwesomeIcon icon={faForward} className="h-1/2 w-1/2" />
                    </PressAndHoldButton>
                }

                { remote === REMOTE.ROKU &&
                    <RemoteButton remote={ remote }
                                  className="btn-secondary items-center place-content-center flex w-1/6 h-full"
                                  value={ KEYSTROKE[remote].FFWD }
                    >
                        <FontAwesomeIcon icon={faForward} className="h-1/2 w-1/2" />
                    </RemoteButton>
                }

                { remote === REMOTE.PC &&
                    <RemoteButton remote={ remote }
                                  className="btn-secondary flex w-1/6 h-full items-center place-content-center"
                                  value={ KEYSTROKE[remote].NEXT }
                    >
                        <FontAwesomeIcon icon={faForwardStep} className="h-1/2"/>
                    </RemoteButton>
                }
            </div>
        </div>
    );
}

export default MediaButtons