import Constants from "@/utilities/constants.js";
import KeypressButton from "@/components/UI/KeypressButton";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClapperboard,
  faGamepad,
  faMusic,
} from "@fortawesome/free-solid-svg-icons";

const AppButtons = (props) => {
  return (
    <div className="flex mx-auto w-full">
      <div className="w-full flex gap-2 justify-center">
        <KeypressButton
          remote={Constants.REMOTE.PC}
          className="btn btn-primary-pc w-1/4 flex flex-col items-center justify-center gap-1"
          value="launchPlaynite"
        >
          <FontAwesomeIcon icon={faGamepad} className="w-1/3 mx-auto" />
          Playnite
        </KeypressButton>
        <KeypressButton
          remote={Constants.REMOTE.PC}
          className="btn btn-primary-pc w-1/4 flex flex-col items-center justify-center gap-1"
          value="launchKodi"
        >
          <FontAwesomeIcon icon={faClapperboard} className="w-1/3 mx-auto" />
          Kodi
        </KeypressButton>
        <KeypressButton
          remote={Constants.REMOTE.PC}
          className="btn btn-primary-pc w-1/4 flex flex-col items-center justify-center gap-1"
          value="launchQobuz"
        >
          <FontAwesomeIcon icon={faMusic} className="w-1/3 mx-auto" />
          Qobuz
        </KeypressButton>
      </div>
    </div>
  );
};

export default AppButtons;
