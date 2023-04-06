import Constants from "@/utilities/constants.js";
import RemoteButton from "@/components/UI/RemoteButton";
import KeyboardGroup from "../../Shared/ButtonGroups/KeyboardGroup";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faPowerOff} from '@fortawesome/free-solid-svg-icons';

const REMOTE = Constants.REMOTE
const KEYSTROKE = Constants.KEYSTROKE

function PCBottomLeftButtons(props) {
    return (
            <div className="flex flex-col gap-2 w-full relative">
                <div className="flex flex-col -translate-y-8">
                    <span className="text-white">Monitor</span>
                    <RemoteButton remote={ REMOTE.PC }
                                  className="w-10 h-10 bg-red-600 text-white rounded-full justify-center items-center translate-x-1"
                                  value="powerButton">
                        <FontAwesomeIcon icon={faPowerOff} />
                    </RemoteButton>
                </div>
                <RemoteButton className="btn-secondary w-2/3 text-center" value={ KEYSTROKE.PC.ESCAPE } >Esc</RemoteButton>
                <RemoteButton className="btn-secondary w-full" value={ KEYSTROKE.PC.TAB }>Tab</RemoteButton>
                <KeyboardGroup remote={ Constants.REMOTE.PC }/>
            </div>
    );
}

export default PCBottomLeftButtons;