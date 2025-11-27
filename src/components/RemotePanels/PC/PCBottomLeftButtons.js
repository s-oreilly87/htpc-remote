import Constants from "@/utilities/constants";
import KeypressButton from "@/components/UI/KeypressButton";
import KeyboardGroup from "../Shared/KeyboardGroup";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faDesktop, faPowerOff, faWindowRestore,} from "@fortawesome/free-solid-svg-icons";

const REMOTE = Constants.REMOTE;
const KEYSTROKE = Constants.KEYSTROKE;

function PCBottomLeftButtons(props) {
  return (
    <div className="flex flex-col gap-2 w-full relative">
      <div className="flex flex-col -translate-y-9">
        <KeypressButton
          remote={REMOTE.PC}
          className="w-10 h-10 bg-red-600 shadow-inner shadow-red-500 text-white rounded-full justify-center items-center translate-x-1"
          value="powerButton"
        >
          <FontAwesomeIcon
            className="transform -translate-y-2"
            width={24}
            icon={faDesktop}
          />
          <FontAwesomeIcon
            className="transform -translate-y-4"
            width={14}
            icon={faPowerOff}
          />
          {/*<Image className="[filter: invert(100%)]" src={'/icons/monitor-power.png'} width={36} height={36} alt="monitor-power" />*/}
        </KeypressButton>
      </div>
      <div className="flex flex-col gap-2 -translate-y-9">
        <KeypressButton
          remote={REMOTE.PC}
          className="btn-secondary w-2/3 text-center"
          value={KEYSTROKE.PC.ESCAPE}
        >
          Esc
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
            <FontAwesomeIcon icon={faWindowRestore} />
        </KeypressButton>
      {/*<KeypressButton*/}
      {/*  remote={REMOTE.PC}*/}
      {/*  className="btn-secondary -translate-y-9"*/}
      {/*  value="moveAllWindowsToPrimary"*/}
      {/*>*/}
      {/*  <FontAwesomeIcon icon={faWindowRestore} />*/}
      {/*  &nbsp;*/}
      {/*  <FontAwesomeIcon icon={faArrowRight} />*/}
      {/*</KeypressButton>*/}
      <KeyboardGroup remote={Constants.REMOTE.PC} />
    </div>
  );
}



export default PCBottomLeftButtons;
