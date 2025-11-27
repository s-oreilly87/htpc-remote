import {AUDIO_MODES_FOR_SELECT, DISPLAY_MODES_FOR_SELECT, REMOTE, ROKU_APPS,} from "@/utilities/constants";
import KeypressButton from "@/components/UI/KeypressButton";
import CustomModesCollapse from "./CustomModesCollapse";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faGamepad, faMusic, faTv} from "@fortawesome/free-solid-svg-icons";
import {
    sendDenonCommand,
    sendEventToGameStreamEventGhost,
    sendEventToHTPCEventGhost,
    sendRokuLaunchCommand,
} from "@/utilities/http";
import {useState} from "react";
import {openPlexampAndroidApp} from "@/utilities/utils";

const remote = REMOTE.PC;

const presetToEffectsMap = {
  // presetPCStereo: {
  //   audioMode: AUDIO_MODES_FOR_SELECT.STEREO,
  //   displayMode: DISPLAY_MODES_FOR_SELECT.PC,
  // },
  // presetPCSurround: {
  //   audioMode: AUDIO_MODES_FOR_SELECT.DOLBY_UPMIX,
  //   displayMode: DISPLAY_MODES_FOR_SELECT.PC,
  // },
  // presetTV4K: {
  //   audioMode: AUDIO_MODES_FOR_SELECT.ATMOS,
  //   displayMode: DISPLAY_MODES_FOR_SELECT.TV4K,
  //   rokuApp: ROKU_APPS.HDMI.HDMI2,
  // },
  // presetTV1440: {
  //   audioMode: AUDIO_MODES_FOR_SELECT.ATMOS,
  //   displayMode: DISPLAY_MODES_FOR_SELECT.TV1440,
  //   rokuApp: ROKU_APPS.HDMI.HDMI2,
  // },
  presetGamestream4K60: {
    audioMode: AUDIO_MODES_FOR_SELECT.ATMOS,
    displayModeHTPC: DISPLAY_MODES_FOR_SELECT.HTPC_4K60,
    displayModeGamestreamEventGhost: 'displayDummy4K60',
    rokuApp: ROKU_APPS.HDMI.HDMI4,
    // launchApp: 'launchMoonlight'
  },
  presetGamestream1440p120: {
    audioMode: AUDIO_MODES_FOR_SELECT.ATMOS,
    displayModeHTPC: DISPLAY_MODES_FOR_SELECT.HTPC_1440p120,
    displayModeGamestreamEventGhost: 'displayDummy1440p120',
    rokuApp: ROKU_APPS.HDMI.HDMI4,
    // launchApp: 'launchMoonlight'
  },
  presetWatchPlex: {
    audioMode: AUDIO_MODES_FOR_SELECT.ATMOS,
    displayModeHTPC: DISPLAY_MODES_FOR_SELECT.HTPC_4K60,
    rokuApp: ROKU_APPS.HDMI.HDMI4,
    launchApp: 'launchPlex'
  },
  presetPlexampStereo: {
    audioMode: AUDIO_MODES_FOR_SELECT.STEREO,
    launchApp: 'launchPlexamp',
    androidApp: 'plexamp'
  },
  presetPlexampUpmix: {
    audioMode: AUDIO_MODES_FOR_SELECT.DOLBY_UPMIX,
    launchApp: 'launchPlexamp',
    androidApp: 'plexamp'
  },
};

function AudioVideoPresets() {
  const [selectedAudioMode, setSelectedAudioMode] = useState(
    AUDIO_MODES_FOR_SELECT.PLACEHOLDER,
  );
  const [selectedDisplayMode, setSelectedDisplayMode] = useState(
    DISPLAY_MODES_FOR_SELECT.PLACEHOLDER,
  );

  const handleClick = async (event) => {
    const htpcEventGhostCommand = event.currentTarget.value;
    const preset = presetToEffectsMap[htpcEventGhostCommand];

    if (preset.rokuApp) {
      sendRokuLaunchCommand({ value: preset.rokuApp.id });
    }

    if (preset.displayModeGamestreamEventGhost) {
      await sendEventToGameStreamEventGhost({ value: preset.displayModeGamestreamEventGhost });
    }

    if (preset.displayModeHTPC) {
      setSelectedDisplayMode(preset.displayModeHTPC);
    }
    sendEventToHTPCEventGhost({ value: htpcEventGhostCommand }).then(() => {
      setTimeout(() => {
        sendDenonCommand({ value: preset.audioMode.denonCmd });
      }, 2000);
    });

    setSelectedAudioMode(preset.audioMode);

    if (preset.launchApp) {
      await sendEventToHTPCEventGhost({ value: preset.launchApp });
    }

    if (preset.androidApp) {
      try {
        openPlexampAndroidApp();
      } catch (e) {
        console.log(e)
      }
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-around gap-2">
        <KeypressButton
          remote={remote}
          id="preset-gamestream-4K60"
          className="btn btn-primary-pc w-1/4 flex flex-col justify-center items-center"
          value="presetGamestream4K60"
          onClick={handleClick}
        >
          <FontAwesomeIcon icon={faGamepad} className="h-6 w-6" />
          Game
          <br />
          4K60
        </KeypressButton>
        <KeypressButton
          remote={remote}
          id="preset-gamestream-1440p120"
          className="btn btn-primary-pc w-1/4 flex flex-col justify-center items-center"
          value="presetGamestream1440p120"
          onClick={handleClick}
        >
          <FontAwesomeIcon icon={faGamepad} className="h-6 w-6" />
          Game
          <br />
          1440p120
        </KeypressButton>
        <KeypressButton
          remote={remote}
          id="preset-watch-plex"
          className="btn btn-primary-pc w-1/4 flex flex-col justify-center items-center"
          value="presetWatchPlex"
          onClick={handleClick}
        >
          <FontAwesomeIcon icon={faTv} className="h-8 w-8" />
          Watch
          <br />
          Plex
        </KeypressButton>
        <KeypressButton
          remote={remote}
          id="preset-plexamp-stereo"
          className="btn btn-primary-pc w-1/4 flex flex-col justify-center items-center"
          value="presetPlexampStereo"
          onClick={handleClick}
        >
          <FontAwesomeIcon icon={faMusic} className="h-8 w-8" />
          Plexamp
          <br />
          (Stereo)
        </KeypressButton>
        <KeypressButton
            remote={remote}
            id="preset-plexamp-upmix"
            className="btn btn-primary-pc w-1/4 flex flex-col justify-center items-center"
            value="presetPlexampUpmix"
            onClick={handleClick}
        >
          <FontAwesomeIcon icon={faMusic} className="h-8 w-8" />
          Plexamp
          <br />
          (Upmix)
        </KeypressButton>
      </div>
      <CustomModesCollapse
        selectedAudioMode={selectedAudioMode}
        setSelectedAudioMode={setSelectedAudioMode}
        selectedDisplayMode={selectedDisplayMode}
        setSelectedDisplayMode={setSelectedDisplayMode}
      />
    </div>
  );
}

export default AudioVideoPresets;
