import {AUDIO_MODES_FOR_SELECT, DISPLAY_MODES_FOR_SELECT_EG, REMOTE, ROKU_APPS,} from "@/utilities/constants";
import KeypressButton, {getLaunchAppFromValue} from "@/components/UI/KeypressButton";
import CustomModesCollapse from "./CustomModesCollapse";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faGamepad, faMusic, faTv} from "@fortawesome/free-solid-svg-icons";
import type { MouseEvent } from "react";
import {
  killLinuxApp,
  launchLinuxApp,
  sendDenonCommand,
  sendEventToGameStreamEventGhost,
  sendEventToHTPCEventGhost,
  sendRokuLaunchCommand,
  setLinuxAudioMode,
  setLinuxDisplayMode,
} from "@/utilities/http";
import { useMemo, useState } from "react";
import { openPlexampAndroidApp } from "@/utilities/utils";
import {
  AUDIO_MODES_FOR_SELECT_LINUX,
  DISPLAY_MODES_FOR_SELECT_LINUX,
  SelectOption,
} from "@/components/RemotePanels/PC/pcConstants";
import { usePlatform } from "@/hooks/usePlatform";
import {LinuxAudioModeCommand, LinuxDisplayModeCommand} from "@/constants/htpcControls";

const remote = REMOTE.PC;

interface PresetEffects {
  audioMode?: SelectOption | null;
  displayModeHTPC?: SelectOption;
  displayModeGamestreamEventGhost?: string;
  rokuApp?: { id: string; label: string };
  launchApp?: string;
  killApp?: string;
  androidApp?: string;
}

let presetInProgress = false;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function AudioVideoPresets() {
  const { isLinux } = usePlatform();
  const [selectedAudioMode, setSelectedAudioMode] = useState(
    AUDIO_MODES_FOR_SELECT.PLACEHOLDER,
  );
  const [selectedDisplayMode, setSelectedDisplayMode] = useState(
    DISPLAY_MODES_FOR_SELECT_EG.PLACEHOLDER,
  );

  const presetToEffectsMap = useMemo<Record<string, PresetEffects>>(
    () => ({
      presetGamestream4K60: {
        audioMode: isLinux
          ? AUDIO_MODES_FOR_SELECT_LINUX.SURROUND51
          : AUDIO_MODES_FOR_SELECT.ATMOS,
        displayModeHTPC: isLinux
          ? DISPLAY_MODES_FOR_SELECT_LINUX.HTPC_4K60_HDR
          : DISPLAY_MODES_FOR_SELECT_EG.HTPC_4K60,
        displayModeGamestreamEventGhost: "displayDummy4K60",
        rokuApp: ROKU_APPS.HDMI.HDMI4,
        launchApp: "launchMoonlight",
      },
      presetGamestream1440p120: {
        audioMode: isLinux
          ? AUDIO_MODES_FOR_SELECT_LINUX.SURROUND51
          : AUDIO_MODES_FOR_SELECT.ATMOS,
        displayModeHTPC: isLinux
          ? DISPLAY_MODES_FOR_SELECT_LINUX.HTPC_1440P120_HDR
          : DISPLAY_MODES_FOR_SELECT_EG.HTPC_1440p120,
        displayModeGamestreamEventGhost: "displayDummy1440p120",
        rokuApp: ROKU_APPS.HDMI.HDMI4,
        launchApp: "launchMoonlight",
      },
      presetWatchPlex: {
        audioMode: isLinux
          ? null
          : AUDIO_MODES_FOR_SELECT.ATMOS,
        // Linux: Kodi is set up to bitstream, dont change audio mode
        displayModeHTPC: isLinux
          ? DISPLAY_MODES_FOR_SELECT_LINUX.HTPC_4K60_HDR
          : DISPLAY_MODES_FOR_SELECT_EG.HTPC_4K60,
        rokuApp: ROKU_APPS.HDMI.HDMI4,
        launchApp: isLinux ? "launchKodi" : "launchPlex",
        killApp: isLinux ? "launchPlexamp" : undefined,
      },
      presetPlexampStereo: {
        audioMode: isLinux
          ? AUDIO_MODES_FOR_SELECT_LINUX.STEREO
          : AUDIO_MODES_FOR_SELECT.STEREO,
        launchApp: "launchPlexamp",
        killApp: "launchKodi",
        androidApp: "plexamp",
      },
      presetPlexampUpmix: {
        audioMode: isLinux
          ? AUDIO_MODES_FOR_SELECT_LINUX.DOLBY_UPMIX
          : AUDIO_MODES_FOR_SELECT.DOLBY_UPMIX,
        launchApp: "launchPlexamp",
        killApp: "launchKodi",
        androidApp: "plexamp",
      },
    }),
    [isLinux],
  );

  const handleClick = async (event: MouseEvent<HTMLButtonElement>) => {
    if (presetInProgress) {
      console.log("Preset already running, ignoring click");
      return;
    }

    presetInProgress = true;
    try {
      const htpcEventGhostCommand = event.currentTarget.value;
      const preset = presetToEffectsMap[htpcEventGhostCommand];

      if (!preset) {
        console.warn(`No preset configured for ${htpcEventGhostCommand}`);
        return;
      }

      // TODO: this is ugly
      if (preset.killApp) {
        const appToKill = getLaunchAppFromValue(preset.killApp);
        if (appToKill) {
          await killLinuxApp(appToKill);
          await sleep(500);
        }
      }

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
          await setLinuxDisplayMode(preset.displayModeHTPC.value as LinuxDisplayModeCommand);
        } else {
          await sendEventToHTPCEventGhost({ value: htpcEventGhostCommand });
        }

        // critical: let KWin settle after mode + scale change
        await sleep(3000); // tune: 2500–4000ms depending on how flaky it is
      }

      // 4. Audio mode
      if (preset.audioMode) {
        setSelectedAudioMode(preset.audioMode);
        if (isLinux) {
          await setLinuxAudioMode(preset.audioMode.value as LinuxAudioModeCommand);
        } else {
          await sendEventToHTPCEventGhost({ value: preset.audioMode.value });
        }

        if (preset.audioMode.denonCmd) {
          await sendDenonCommand({ value: preset.audioMode.denonCmd });
          await sleep(500); // small pause before launching app
        }
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

  async function maybeLaunchApp(preset: PresetEffects) {
    if (!preset.launchApp) {
      return;
    }

    const launchAppTarget = getLaunchAppFromValue(preset.launchApp);

    if (isLinux && launchAppTarget) {
      await launchLinuxApp(launchAppTarget);
      return;
    }

    await sendEventToHTPCEventGhost({ value: preset.launchApp });
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
