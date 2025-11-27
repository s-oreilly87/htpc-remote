import { URL_ENCODED_SYMBOLS } from "@/constants/encoding";
import {
  ClickType,
  DenonKeystroke,
  KEYSTROKE,
  PcKeystroke,
  RemoteType,
  REMOTE_INDEX,
  RokuKeystroke,
  SYSTEM_KEYS,
} from "@/constants/remotes";
import {
  AUDIO_MODES_FOR_SELECT as PC_AUDIO_MODES,
  DISPLAY_MODES_FOR_SELECT,
} from "@/components/RemotePanels/PC/pcConstants";
import {
  AUDIO_MODES_FOR_SELECT as DENON_AUDIO_MODES,
  DOLBY_MODES,
  DTS_MODES,
  DENON_INPUTS,
  DENON_REMOTE_META,
  DENON_SOUND_MODES,
} from "@/components/RemotePanels/Denon/denonConstants";
import {
  ROKU_APPS,
  ROKU_REMOTE_META,
  ROKU_STATE_DEFAULTS,
} from "@/components/RemotePanels/Roku/rokuConstants";
import { LIGHTSWITCHES, PLUGS } from "@/components/RemotePanels/SmartHome/smartHomeConstants";

export const REMOTE = RemoteType;
export { REMOTE_INDEX, URL_ENCODED_SYMBOLS, KEYSTROKE, SYSTEM_KEYS };
export const CLICK_TYPE = ClickType;
export const ROKU_REMOTE = RokuKeystroke;
export const PC_REMOTE = PcKeystroke;
export const DENON_REMOTE = DenonKeystroke;
export const AUDIO_MODES_FOR_SELECT = PC_AUDIO_MODES;

export {
  ROKU_APPS,
  ROKU_STATE_DEFAULTS,
  DENON_INPUTS,
  DOLBY_MODES,
  DTS_MODES,
  DENON_SOUND_MODES,
  PC_AUDIO_MODES,
  DISPLAY_MODES_FOR_SELECT,
  DENON_AUDIO_MODES,
  PLUGS,
  LIGHTSWITCHES,
  DENON_REMOTE_META,
  ROKU_REMOTE_META,
};

const Constants = {
  REMOTE,
  REMOTE_INDEX,
  URL_ENCODED_SYMBOLS,
  ROKU_APPS,
  AUDIO_MODES: PC_AUDIO_MODES,
  DISPLAY_MODES: DISPLAY_MODES_FOR_SELECT,
  KEYSTROKE,
  SYSTEM_KEYS,
};

export default Constants;
