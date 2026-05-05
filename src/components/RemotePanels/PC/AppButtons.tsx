import { RemoteType } from "@/constants/remotes";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faClapperboard, faGamepad, faMusic} from "@fortawesome/free-solid-svg-icons";

import KeypressButton from "@/components/UI/KeypressButton";
import {JSX} from "react";
import { usePlatform } from "@/hooks/usePlatform";

function AppButtons(): JSX.Element {
  const { isLinux } = usePlatform();
  const videoApp = isLinux
    ? { value: "launchKodi", label: "Kodi" }
    : { value: "launchPlex", label: "Plex" };

  return (
    <div className="w-full flex gap-2 justify-center">
      <KeypressButton
        remote={RemoteType.PC}
        className="btn btn-primary-pc w-1/4 flex flex-col items-center justify-center gap-1"
        value={videoApp.value}
      >
        <FontAwesomeIcon icon={faClapperboard} className="w-1/3 mx-auto" />
        {videoApp.label}
      </KeypressButton>
      <KeypressButton
        remote={RemoteType.PC}
        className="btn btn-primary-pc w-1/4 flex flex-col items-center justify-center gap-1"
        value="launchMoonlight"
      >
        <FontAwesomeIcon icon={faGamepad} className="w-1/3 mx-auto" />
        Moonlight
      </KeypressButton>
      <KeypressButton
        remote={RemoteType.PC}
        className="btn btn-primary-pc w-1/4 flex flex-col items-center justify-center gap-1"
        value="launchPlexamp"
      >
        <FontAwesomeIcon icon={faMusic} className="w-1/3 mx-auto" />
        Plexamp
      </KeypressButton>
      <KeypressButton
        remote={RemoteType.PC}
        className="btn btn-primary-pc w-1/4 flex flex-col items-center justify-center gap-1"
        value="launchQobuz"
      >
        <FontAwesomeIcon icon={faMusic} className="w-1/3 mx-auto" />
        Qobuz
      </KeypressButton>
    </div>
  );
}

export default AppButtons;
