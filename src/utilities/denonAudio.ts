import type { AudioMode } from "@/types/remote";
import { sendDenonCommand } from "@/utilities/http";

const MUSIC_AUDIO_MODE_KEYS = new Set([
  "PURE",
  "STEREO",
  "DOLBY_UPMIX",
  "SURROUND51",
]);

const AUDYSSEY_DEFAULTS = [
  "PSDYNEQ ON",
  "PSREFLEV 5",
  "PSDYNVOL LIT",
];

/**
 * Select a Denon audio mode and restore the preferred music-listening
 * Audyssey settings after any Quick Select recall has finished.
 */
export async function applyDenonMusicAudioMode(mode: AudioMode): Promise<void> {
  if (!mode.denonCmd) return;

  const modeResponse = await sendDenonCommand({ value: mode.denonCmd });
  if (modeResponse.error) {
    console.error("Denon audio mode selection failed:", modeResponse.error);
    return;
  }

  // Quick Select recalls its stored state asynchronously on the AVR.
  await new Promise((resolve) => setTimeout(resolve, 500));

  if (!MUSIC_AUDIO_MODE_KEYS.has(mode.key)) return;

  for (const value of AUDYSSEY_DEFAULTS) {
    const response = await sendDenonCommand({ value });
    if (response.error) {
      console.error(`Denon setting "${value}" failed:`, response.error);
    }
  }
}
