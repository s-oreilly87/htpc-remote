import Constants from "@/utilities/constants";
import KeypressButton from "@/components/UI/KeypressButton";
import KeyboardGroup from "../Shared/KeyboardGroup";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faArrowLeft, faWindowRestore, faX, faExpandAlt} from "@fortawesome/free-solid-svg-icons";

const REMOTE = Constants.REMOTE;
const KEYSTROKE = Constants.KEYSTROKE;

function PCBottomLeftButtons(props) {

    const platform = process.env.NEXT_PUBLIC_PLATFORM ?? "";
    const isLinux = platform === "LINUX" || platform === "LINUX_WAYLAND";

    return (
      <div className="flex flex-col gap-2 w-full relative justify-evenly">
          <div className="flex flex-col -translate-y-9">
              <KeypressButton
                  remote={REMOTE.PC}
                  className="w-8 h-8 bg-red-600 shadow-inner shadow-red-500 text-white rounded-md flex justify-center items-center translate-x-2"
                  value={isLinux ? KEYSTROKE.PC.CLOSE_WINDOW : "closeWindow"}
              >
                  <FontAwesomeIcon
                      width={16}
                      height={16}
                      icon={faX}
                  />
              </KeypressButton>
          </div>
          {/*<div className="flex flex-col -translate-y-9">*/}
          {/*    <KeypressButton*/}
          {/*        remote={REMOTE.PC}*/}
          {/*        className="w-10 h-10 bg-yellow-500 shadow-inner shadow-yellow-600 text-white rounded-full justify-center items-center translate-x-1"*/}
          {/*        value="focusPlex"*/}
          {/*    >*/}
          {/*        <FontAwesomeIcon*/}
          {/*            width={24}*/}
          {/*            icon={faMagnifyingGlass}*/}
          {/*        />*/}
          {/*    </KeypressButton>*/}
          {/*</div>*/}
          <div className="flex flex-col gap-2 -translate-y-9">
              <KeypressButton
                  remote={REMOTE.PC}
                  className="btn-secondary w-full flex justify-center items-center"
                  value={isLinux ? KEYSTROKE.PC.BACKSPACE : KEYSTROKE.PC.ESCAPE}
              >
                  <FontAwesomeIcon icon={faArrowLeft} className="w-6 h-6"/>
              </KeypressButton>
              <KeypressButton
                  remote={REMOTE.PC}
                  className="btn-secondary w-full"
                  value={KEYSTROKE.PC.TAB}
              >
                Tab
              </KeypressButton>
          </div>
          {/*<KeypressButton remote={ REMOTE.PC } className="btn-secondary -translate-y-9" value={ KEYSTROKE.KEY_COMBOS.MOVE_WINDOW }>*/}
          {/*    <FontAwesomeIcon icon={ faWindowMaximize } />*/}
          {/*    &nbsp;*/}
          {/*    <FontAwesomeIcon icon={ faArrowRight } />*/}
          {/*</KeypressButton>*/}
          <KeypressButton
              remote={REMOTE.PC}
              className="btn-secondary -translate-y-9"
              value={KEYSTROKE.PC.ALT_TAB}
          >
              <FontAwesomeIcon icon={faWindowRestore}/>
          </KeypressButton>
          <KeyboardGroup remote={Constants.REMOTE.PC}/>
      </div>
  );
}


export default PCBottomLeftButtons;
