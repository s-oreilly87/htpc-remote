import Constants from "@/utilities/constants.js";
import KeypressButton from "@/components/UI/KeypressButton";
import KeyboardGroup from "../Shared/KeyboardGroup";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faArrowRight, faDesktop, faPowerOff, faWindowRestore} from '@fortawesome/free-solid-svg-icons';

const REMOTE = Constants.REMOTE
const KEYSTROKE = Constants.KEYSTROKE

function PCBottomLeftButtons(props) {
    return (
            <div className="flex flex-col gap-2 w-full relative">
                <div className="flex flex-col -translate-y-9">
                    <FontAwesomeIcon className="text-slate-600 w-12 pb-1" icon={ faDesktop } />
                    <KeypressButton remote={ REMOTE.PC }
                                    className="w-10 h-10 bg-red-600 text-white rounded-full justify-center items-center translate-x-1"
                                    value="powerButton">
                        <FontAwesomeIcon icon={faPowerOff} />
                    </KeypressButton>
                </div>
                <div className="flex flex-col gap-2 -translate-y-9">
                    <KeypressButton remote={ REMOTE.PC } className="btn-secondary w-2/3 text-center" value={ KEYSTROKE.PC.ESCAPE } >Esc</KeypressButton>
                    <KeypressButton remote={ REMOTE.PC } className="btn-secondary w-full" value={ KEYSTROKE.PC.TAB }>Tab</KeypressButton>
                </div>
                {/*<KeypressButton remote={ REMOTE.PC } className="btn-secondary -translate-y-9" value={ KEYSTROKE.KEY_COMBOS.MOVE_WINDOW }>*/}
                {/*    <FontAwesomeIcon icon={ faWindowMaximize } />*/}
                {/*    &nbsp;*/}
                {/*    <FontAwesomeIcon icon={ faArrowRight } />*/}
                {/*</KeypressButton>*/}
                <KeypressButton remote={ REMOTE.PC } className="btn-secondary -translate-y-9" value="moveAllWindowsToPrimary">
                    <FontAwesomeIcon icon={ faWindowRestore } />
                    &nbsp;
                    <FontAwesomeIcon icon={ faArrowRight } />
                </KeypressButton>
                <KeyboardGroup remote={ Constants.REMOTE.PC }/>
            </div>
    );
}

export default PCBottomLeftButtons;