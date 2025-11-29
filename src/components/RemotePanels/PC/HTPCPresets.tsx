import {AUDIO_MODES_FOR_SELECT, DISPLAY_MODES_FOR_SELECT_EG, REMOTE, ROKU_APPS,} from "@/utilities/constants";
import KeypressButton, {getLaunchAppFromValue} from "@/components/UI/KeypressButton";
import CustomModesCollapse from "./CustomModesCollapse";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faGamepad, faMusic, faTv} from "@fortawesome/free-solid-svg-icons";
import {
    launchLinuxApp,
    sendDenonCommand,
    sendEventToGameStreamEventGhost,
    sendEventToHTPCEventGhost,
    sendRokuLaunchCommand, setLinuxDisplayMode,
} from "@/utilities/http";
import {useState} from "react";
import {openPlexampAndroidApp} from "@/utilities/utils";
import {DISPLAY_MODES_FOR_SELECT_LINUX} from "@/components/RemotePanels/PC/pcConstants";

const remote = REMOTE.PC;

const platform = process.env.NEXT_PUBLIC_PLATFORM ?? '';
const isLinux = platform === "LINUX" || platform === "LINUX_WAYLAND";

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
    displayModeHTPC: isLinux ? DISPLAY_MODES_FOR_SELECT_LINUX.HTPC_4K60_HDR : DISPLAY_MODES_FOR_SELECT_EG.HTPC_4K60,
    displayModeGamestreamEventGhost: 'displayDummy4K60',
    rokuApp: ROKU_APPS.HDMI.HDMI4,
    launchApp: 'launchMoonlight'
  },
  presetGamestream1440p120: {
    audioMode: AUDIO_MODES_FOR_SELECT.ATMOS,
    displayModeHTPC: isLinux ? DISPLAY_MODES_FOR_SELECT_LINUX.HTPC_1440P120_HDR : DISPLAY_MODES_FOR_SELECT_EG.HTPC_1440p120,
    displayModeGamestreamEventGhost: 'displayDummy1440p120',
    rokuApp: ROKU_APPS.HDMI.HDMI4,
    launchApp: 'launchMoonlight'
  },
  presetWatchPlex: {
    audioMode: AUDIO_MODES_FOR_SELECT.ATMOS,
    displayModeHTPC: isLinux ? DISPLAY_MODES_FOR_SELECT_LINUX.HTPC_4K60_HDR : DISPLAY_MODES_FOR_SELECT_EG.HTPC_4K60,
    rokuApp: ROKU_APPS.HDMI.HDMI4,
    launchApp: isLinux ? 'launchKodi' : 'launchPlex'
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

let presetInProgress = false;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function AudioVideoPresets() {
  const [selectedAudioMode, setSelectedAudioMode] = useState(
    AUDIO_MODES_FOR_SELECT.PLACEHOLDER,
  );
  const [selectedDisplayMode, setSelectedDisplayMode] = useState(
    DISPLAY_MODES_FOR_SELECT_EG.PLACEHOLDER,
  );


    const handleClick = async (event) => {
        if (presetInProgress) {
            console.log("Preset already running, ignoring click");
            return;
        }

        presetInProgress = true;
        try {
            const htpcEventGhostCommand = event.currentTarget.value;
            const preset = presetToEffectsMap[htpcEventGhostCommand];

            // 1. Android app
            if (preset.androidApp) {
                try {
                    openPlexampAndroidApp();
                } catch (e) {
                    console.log(e);
                }
            }

            // 2. Roku input / app first: wake TV + select HDMI
            if (preset.rokuApp) {
                sendRokuLaunchCommand({ value: preset.rokuApp.id });
                // give TV time to power on / lock HDMI
                await sleep(2000);
            }

            // 3. HTPC display mode (Linux → kscreen-doctor, else → EventGhost)
            if (preset.displayModeHTPC) {
                setSelectedDisplayMode(preset.displayModeHTPC);

                if (isLinux) {
                    await setLinuxDisplayMode(preset.displayModeHTPC.value);
                } else {
                    await sendEventToHTPCEventGhost({ value: htpcEventGhostCommand });
                }

                // critical: let KWin settle after mode + scale change
                await sleep(3000); // tune: 2500–4000ms depending on how flaky it is
            }

            // 4. Audio mode
            if (preset.audioMode) {
                setSelectedAudioMode(preset.audioMode);
                if (preset.audioMode.denonCmd) {
                    await sendDenonCommand({ value: preset.audioMode.denonCmd });
                    await sleep(500); // small pause before launching app
                }
                // TODO: set HTPC audio mode here if you add that path
            }

            // 5. Launch app on HTPC
            await maybeLaunchApp(preset);

            // 6. GameStream display mode on Windows (does not affect KWin)
            if (preset.displayModeGamestreamEventGhost) {
                await sendEventToGameStreamEventGhost({
                    value: preset.displayModeGamestreamEventGhost,
                });
            }
        } finally {
            presetInProgress = false;
        }
    };

  async function maybeLaunchApp(preset) {
      if (preset.launchApp) {
          console.log('have preset launchAPp: ' + preset.launchApp);
          console.log(getLaunchAppFromValue(preset.launchApp));

          isLinux
              ? await launchLinuxApp(getLaunchAppFromValue(preset.launchApp))
              : await sendEventToHTPCEventGhost({ value: preset.launchApp });
      }
  }

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
