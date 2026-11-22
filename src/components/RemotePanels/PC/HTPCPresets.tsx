import { useMemo, useState } from "react";
import type { MouseEvent } from "react";
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGamepad, faMusic, faTv } from "@fortawesome/free-solid-svg-icons";

import KeypressButton, { getLaunchAppFromValue } from "@/components/UI/KeypressButton";
import CustomModesCollapse from "./CustomModesCollapse";
import { AUDIO_MODES, DISPLAY_MODES, audioModeValue, displayModeValue } from "@/constants/pc";
import { ROKU_APPS } from "@/constants/roku";
import { RemoteType } from "@/constants/remotes";
import {
  killLinuxApp,
  launchLinuxApp,
  sendDenonCommand,
  sendEventToGameStreamEventGhost,
  sendEventToHTPCEventGhost,
  sendRokuLaunchCommand,
  setLinuxAudioMode,
  setLinuxDisplayMode,
  setTplinkBrightness,
  toggleTplinkSwitch,
} from "@/utilities/http";
import { usePlatform } from "@/hooks/usePlatform";
import { useRokuCec } from "@/hooks/useRokuCec";
import { openPlexampAndroidApp, openQobuzAndroidApp } from "@/utilities/utils";
import type { AudioMode, DisplayMode, RokuChannel } from "@/types/remote";
import type { LinuxAudioModeCommand, LinuxDisplayModeCommand } from "@/constants/htpcControls";
import { BASEMENT_LIGHT } from "@/constants/smartHome";

const remote = RemoteType.PC;

interface PresetEffects {
  /** null = skip audio change for this preset */
  audioMode?: AudioMode | null;
  displayModeHTPC?: DisplayMode;
  displayModeGamestreamEventGhost?: string;
  rokuApp?: RokuChannel;
  launchApp?: string;
  killApp?: string;
  androidApp?: string;
  /** EventGhost event used to launch this app after applying its selected audio mode. */
  eventGhostLaunchCommand?: string;
  lightMode?: {
    deviceId: string;
    brightness?: number;
  };
}

let presetInProgress = false;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function AudioVideoPresets() {
  const { isLinux } = usePlatform();
  const { wakeRoku } = useRokuCec();

  const [selectedAudioMode, setSelectedAudioMode] = useState<AudioMode>(
    AUDIO_MODES.PLACEHOLDER,
  );
  const [selectedDisplayMode, setSelectedDisplayMode] = useState<DisplayMode>(
    DISPLAY_MODES.PLACEHOLDER,
  );

  const presetToEffectsMap = useMemo<Record<string, PresetEffects>>(
    () => ({
      presetGamestream4K60: {
        audioMode: AUDIO_MODES.SURROUND51,
        displayModeHTPC: DISPLAY_MODES.HTPC_4K60_HDR,
        displayModeGamestreamEventGhost: "displayDummy4K60",
        rokuApp: ROKU_APPS.HDMI.HDMI4,
        launchApp: "launchMoonlight",
        lightMode: basementLightMode(),
      },
      presetGamestream1440p120: {
        audioMode: AUDIO_MODES.SURROUND51,
        displayModeHTPC: DISPLAY_MODES.HTPC_1440P120_HDR,
        displayModeGamestreamEventGhost: "displayDummy1440p120",
        rokuApp: ROKU_APPS.HDMI.HDMI4,
        launchApp: "launchMoonlight",
        lightMode: basementLightMode(),
      },
      presetWatchPlex: {
        // Linux: Kodi is set up to bitstream — don't change audio mode
        audioMode: isLinux ? null : AUDIO_MODES.ATMOS,
        displayModeHTPC: DISPLAY_MODES.HTPC_4K24_HDR,
        rokuApp: ROKU_APPS.HDMI.HDMI4,
        launchApp: isLinux ? "launchKodi" : "launchPlex",
        killApp: isLinux ? "launchPlexamp" : undefined,
        lightMode: basementLightMode(),
      },
      presetPlexamp: {
        launchApp: "launchPlexamp",
        eventGhostLaunchCommand: "launchPlexamp",
        killApp: "launchKodi",
        androidApp: "plexamp",
      },
      presetQobuz: {
        launchApp: "launchQobuz",
        eventGhostLaunchCommand: "launchQobuz",
        killApp: "launchKodi",
        androidApp: "qobuz",
      },
    }),
    [isLinux],
  );

  const runPreset = async (preset: PresetEffects, htpcEventGhostCommand: string) => {
    if (presetInProgress) {
      console.log("Preset already running, ignoring click");
      return;
    }

    presetInProgress = true;
    try {
      if (preset.killApp) {
        const appToKill = getLaunchAppFromValue(preset.killApp);
        if (appToKill) {
          await killLinuxApp(appToKill);
          await sleep(500);
        }
      }

      // 1. Android app
      if (preset.androidApp === "plexamp") {
        openPlexampAndroidApp();
      } else if (preset.androidApp === "qobuz") {
        openQobuzAndroidApp();
      } else if (preset.androidApp) {
        console.error(`Android app "${preset.androidApp}" is not registered in HTPCPresets`);
      }

      // 2. Roku input / app first: wake TV + select HDMI
      if (preset.rokuApp) {
        sendRokuLaunchCommand({ value: preset.rokuApp.id });
        wakeRoku();
        // give TV time to power on / lock HDMI
        await sleep(2000);
      }

      // 3. Smart lights
      if (preset.lightMode) {
        await toggleTplinkSwitch(preset.lightMode.deviceId, true);
        if (preset.lightMode.brightness !== undefined) {
          await setTplinkBrightness(preset.lightMode.deviceId, preset.lightMode.brightness);
        }
      }

      // 4. HTPC display mode (Linux → kscreen-doctor, else → EventGhost)
      if (preset.displayModeHTPC) {
        setSelectedDisplayMode(preset.displayModeHTPC);
        const value = displayModeValue(preset.displayModeHTPC, isLinux);

        if (isLinux) {
          await setLinuxDisplayMode(value as LinuxDisplayModeCommand);
        } else {
          await sendEventToHTPCEventGhost({ value: preset.eventGhostLaunchCommand ?? htpcEventGhostCommand });
        }

        // critical: let KWin settle after mode + scale change
        await sleep(3000);
      }

      // 5. Audio mode — apply the selected mode before launching the app
      if (preset.audioMode) {
        setSelectedAudioMode(preset.audioMode);
        const value = audioModeValue(preset.audioMode, isLinux);

        if (isLinux) {
          await setLinuxAudioMode(value as LinuxAudioModeCommand);
        } else {
          await sendEventToHTPCEventGhost({ value });
        }

        if (preset.audioMode.denonCmd) {
          await sendDenonCommand({ value: preset.audioMode.denonCmd });
          await sleep(500);
        }
      }

      // 6. Launch app on HTPC
      await maybeLaunchApp(preset, htpcEventGhostCommand);

      // 7. GameStream display mode on Windows (does not affect KWin)
      if (preset.displayModeGamestreamEventGhost) {
        await sendEventToGameStreamEventGhost({
          value: preset.displayModeGamestreamEventGhost,
        });
      }
    } finally {
      presetInProgress = false;
    }
  };

  const handleClick = async (event: MouseEvent<HTMLButtonElement>) => {
    const htpcEventGhostCommand = event.currentTarget.value;
    const preset = presetToEffectsMap[htpcEventGhostCommand];

    if (!preset) {
      console.warn(`No preset configured for ${htpcEventGhostCommand}`);
      return;
    }

    await runPreset(preset, htpcEventGhostCommand);
  };

  const handleAudioAppMode = async (app: "plexamp" | "qobuz", audioMode: AudioMode) => {
    const presetCommand = app === "plexamp" ? "presetPlexamp" : "presetQobuz";
    const preset = presetToEffectsMap[presetCommand];

    if (!preset) {
      console.warn(`No preset configured for ${presetCommand}`);
      return;
    }

    await runPreset({ ...preset, audioMode }, presetCommand);
  };

  async function maybeLaunchApp(preset: PresetEffects, htpcEventGhostCommand: string) {
    if (!preset.launchApp) return;

    const launchAppTarget = getLaunchAppFromValue(preset.launchApp);
    if (isLinux && launchAppTarget) {
      await launchLinuxApp(launchAppTarget);
      return;
    }

    await sendEventToHTPCEventGhost({ value: htpcEventGhostCommand });
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-around gap-2">
        <KeypressButton
          remote={remote}
          id="preset-gamestream-4K60"
          className="btn btn-primary-pc w-1/4 flex flex-col justify-center items-center gap-0.5"
          value="presetGamestream4K60"
          onClick={handleClick}
        >
          <FontAwesomeIcon icon={faGamepad} className="h-6 w-6" />
          <span className="leading-tight text-center">Game<br/>4K60</span>
        </KeypressButton>
        <KeypressButton
          remote={remote}
          id="preset-gamestream-1440p120"
          className="btn btn-primary-pc w-1/4 flex flex-col justify-center items-center gap-0.5"
          value="presetGamestream1440p120"
          onClick={handleClick}
        >
          <FontAwesomeIcon icon={faGamepad} className="h-6 w-6" />
          <span className="leading-tight text-center text-xs">Game<br/>1440p120</span>
        </KeypressButton>
        <KeypressButton
          remote={remote}
          id="preset-watch-plex"
          className="btn btn-primary-pc w-1/4 flex flex-col justify-center items-center gap-0.5"
          value="presetWatchPlex"
          onClick={handleClick}
        >
          <FontAwesomeIcon icon={faTv} className="h-6 w-6" />
          <span className="leading-tight text-center">Watch<br/>Kodi</span>
        </KeypressButton>
        <AudioAppPresetButton
          label="Plexamp"
          onSelect={(mode) => handleAudioAppMode("plexamp", mode)}
        />
        <AudioAppPresetButton
          label="Qobuz"
          onSelect={(mode) => handleAudioAppMode("qobuz", mode)}
        />
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

function basementLightMode(): PresetEffects["lightMode"] {
  if (!BASEMENT_LIGHT) return undefined;

  return {
    deviceId: BASEMENT_LIGHT.id,
    ...(BASEMENT_LIGHT.kind === "dimmer" ? { brightness: 40 } : {}),
  };
}


const MUSIC_AUDIO_MODES = [
  { mode: AUDIO_MODES.PURE, label: "Stereo" },
  { mode: AUDIO_MODES.STEREO, label: "Stereo with sub" },
  { mode: AUDIO_MODES.DOLBY_UPMIX, label: "Dolby Upmix" },
  { mode: AUDIO_MODES.SURROUND51, label: "5.1 Surround" },
] as const;

interface AudioAppPresetButtonProps {
  label: string;
  onSelect: (mode: AudioMode) => Promise<void>;
}

function AudioAppPresetButton({ label, onSelect }: AudioAppPresetButtonProps) {
  return (
    <Popover className="relative w-1/4">
      {({ close }) => (
        <>
          <PopoverButton
            className="btn btn-primary-pc w-full flex flex-col justify-center items-center gap-0.5"
          >
            <FontAwesomeIcon icon={faMusic} className="h-6 w-6" />
            <span className="leading-tight text-center text-xs">{label}</span>
          </PopoverButton>
          <PopoverPanel className="absolute left-1/2 top-full z-50 mt-2 w-64 -translate-x-1/2 rounded-lg bg-gray-700 p-2 shadow-xl ring-1 ring-black/10">
            <div className="flex flex-col gap-1">
              {MUSIC_AUDIO_MODES.map(({ mode, label: modeLabel }) => (
                <button
                  key={mode.key}
                  type="button"
                  className="w-full rounded-md px-3 py-2 text-left text-sm text-white hover:bg-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  onClick={() => {
                    close();
                    void onSelect(mode);
                  }}
                >
                  {modeLabel}
                </button>
              ))}
            </div>
          </PopoverPanel>
        </>
      )}
    </Popover>
  );
}
