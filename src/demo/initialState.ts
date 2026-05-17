import { DENON_INPUTS, DENON_SOUND_MODES } from "@/constants/denon";
import type { VirtualState } from "@/demo/types";

export const INITIAL_STATE: VirtualState = {
  denon: {
    powerOn: false,
    muteOn: false,
    input: DENON_INPUTS.TV,
    soundMode: DENON_SOUND_MODES.STEREO,
    dynComp: "",
    psDilOn: false,
    psDynEqOn: true,
    MV: 50,
    PSDIL: 0,
    PSREFLEV: "0",
    PSDYNVOL: "OFF",
  },
  roku: {
    powerOn: false,
    currentApp: null,
    navigationFocus: "home",
  },
  htpc: {
    activeApp: null,
    displayMode: null,
    audioMode: null,
  },
  tplink: {
    devices: {
      "yard-fence": { powerState: false },
      "yard-dining": { powerState: false },
      "bedroom":    { powerState: false },
      "stairway":   { powerState: false },
      "basement":   { powerState: false, brightness: 50 },
    },
  },
};
