import type { Dispatch, MouseEvent, SetStateAction } from "react";
import type { ValueButton } from "@/utilities/http";
import { RemoteType } from "@/constants/remotes";
import { DENON_SOUND_MODES, DOLBY_MODES, DTS_MODES } from "@/constants/denon";
import KeypressButton from "@/components/UI/KeypressButton";
import { sendDenonCommand, sendDenonQuery } from "@/utilities/http";
import { useDenonContext } from "@/context/denon";

const CYCLE_TIMEOUT = 5000;
const remote = RemoteType.DENON;

interface Props {
  cycleTimeout: ReturnType<typeof setTimeout> | null;
  setCycleTimeout: Dispatch<
    SetStateAction<ReturnType<typeof setTimeout> | null>
  >;
}

function CycleSoundModes({ cycleTimeout, setCycleTimeout }: Props) {
  const { updateDenonState } = useDenonContext();

  const handleCycleClick = async (event: MouseEvent<HTMLButtonElement>) => {
    const button = { value: event.currentTarget.value };
    // The first click of a cycle button brings up current sound mode on display - no response from denon
    // Must click again within 5 seconds to change Sound Mode and receive a response

    // Check if this is the first click
    if (!cycleTimeout) {
      void sendDenonCommand(button); // no response on first click
      setNewCycleTimeout();
      // when (cycleTimeout !== null && !loading), the SoundModeSelect display will animate
      return;
    }

    // if there is an active timeout - we want to reset it on the new click then send the command and listen for the response as usual
    resetCycleTimeout();
    await sendAndUpdate(button);
  };

  const handleClick = (event: MouseEvent<HTMLButtonElement>) =>
    sendAndUpdate({ value: event.currentTarget.value });

  const sendAndUpdate = async (button: ValueButton) => {
    const response = await sendDenonCommand(button);

    if (response.error) {
      return console.error(response.error);
    }

    const soundMode = await parseSoundModeFromResponseData(
      Array.isArray(response.data) ? response.data : [],
    );
    if (soundMode) {
      updateDenonState({ soundMode });
    }
  };

  const setNewCycleTimeout = () => {
    const newCycleTimeout = setTimeout(() => {
      setCycleTimeout(null);
    }, CYCLE_TIMEOUT);

    setCycleTimeout(newCycleTimeout);
  };

  const resetCycleTimeout = () => {
    if (cycleTimeout) clearTimeout(cycleTimeout);
    setNewCycleTimeout();
  };

  const parseSoundModeFromResponseData = async (denonResponse: string[]) => {
    let soundMode;
    let foundSoundMode: string | undefined;
    for (const line of denonResponse) {
      if (line.substring(0, 2) === "MS") {
        foundSoundMode = line;
        soundMode = Object.values(DENON_SOUND_MODES).find(
          (mode) => mode.value === line,
        );
        break;
      }
    }

    if (!foundSoundMode) {
      console.error(
        'Did not receive sound mode (MS) response. Trying "MS?" query',
      );
      const followupResponse = await sendDenonQuery("MS");
      if (followupResponse.error) {
        return console.error(
          '"MS?" query failed. Unable to update SoundModeSelect',
        );
      }
      for (const line of followupResponse.data ?? []) {
        if (line.substring(0, 2) === "MS") {
          foundSoundMode = line;
          soundMode = Object.values(DENON_SOUND_MODES).find(
            (mode) => mode.value === line,
          );
          break;
        }
      }
    }

    if (!foundSoundMode) return undefined;

    if (!soundMode) {
      if (
        DOLBY_MODES.includes(foundSoundMode.substring(2).replaceAll(" ", "_"))
      ) {
        soundMode = DENON_SOUND_MODES.DOLBY;
        console.info("Mapped " + foundSoundMode + " to DOLBY DIGITAL");
      } else if (DTS_MODES.includes(foundSoundMode.substring(2))) {
        soundMode = DENON_SOUND_MODES.DTS;
        console.info("Mapped " + foundSoundMode + " to DTS NEURAL:X");
      } else {
        console.info(`Unknown Sound Mode: ${foundSoundMode}`);
      }
    }

    return soundMode;
  };

  return (
    <div className="w-full mx-auto flex flex-col">
      <div className="flex gap-2 w-4/5 mx-auto justify-center">
        <KeypressButton
          remote={remote}
          className="btn h-10 w-1/4 bg-green-700 hover:bg-green-600 shadow-inner shadow-green-500/60"
          value="MSMOVIE"
          onClick={handleCycleClick}
        >
          Movie
        </KeypressButton>
        <KeypressButton
          remote={remote}
          className="btn h-10 w-1/4 bg-red-700 hover:bg-red-600 shadow-inner shadow-red-500/60"
          value="MSMUSIC"
          onClick={handleCycleClick}
        >
          Music
        </KeypressButton>
        <KeypressButton
          remote={remote}
          className="btn h-10 w-1/4 bg-blue-600 hover:bg-blue-500 shadow-inner shadow-indigo-500/60"
          value="MSGAME"
          onClick={handleCycleClick}
        >
          Game
        </KeypressButton>
        <KeypressButton
          remote={remote}
          className="btn h-10 w-1/4 bg-amber-400 hover:bg-amber-300 shadow-inner shadow-amber-400/60"
          value="MSDIRECT"
          onClick={handleClick}
        >
          Pure
        </KeypressButton>
      </div>
    </div>
  );
}

export default CycleSoundModes;
