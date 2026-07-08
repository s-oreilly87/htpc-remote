import { URL_ENCODED_SYMBOLS } from "@/constants/encoding";
import { RemoteType, RokuKeystroke } from "@/constants/remotes";
import type { RokuApps } from "@/types/remote";

const ROKU_IP = process.env.NEXT_PUBLIC_ROKU_IP ?? "";
const ROKU_PORT = 8060;
const ROKU_URL = ROKU_IP ? `http://${ROKU_IP}:${ROKU_PORT}` : "";

export const ROKU_APPS: RokuApps = {
  CHANNELS: {
    PLEX:      { id: "13535",  label: "Plex - Free Movies & TV" },
    NETFLIX:   { id: "12",     label: "Netflix" },
    PEACOCK:   { id: "593099", label: "Peacock TV" },
    FOX_SPORTS:{ id: "95307",  label: "FOX Sports" },
    HBO:       { id: "61322",  label: "HBOMax" },
    PRIME:     { id: "13",     label: "Prime" },
    APPLE_TV:  { id: "551012", label: "AppleTV" },
  },
  HDMI: {
    HDMI1: { id: `tvinput${URL_ENCODED_SYMBOLS["."]}hdmi1`, label: "HDMI1" },
    HDMI2: { id: `tvinput${URL_ENCODED_SYMBOLS["."]}hdmi2`, label: "HDMI2" },
    HDMI3: { id: `tvinput${URL_ENCODED_SYMBOLS["."]}hdmi3`, label: "HDMI3" },
    HDMI4: { id: `tvinput${URL_ENCODED_SYMBOLS["."]}hdmi4`, label: "HDMI4: HTPC" },
  },
};

/**
 * Static channel art bundled for demo mode, keyed by Roku channel id.
 * Demo mode never talks to a real Roku (see IS_DEMO gating in
 * src/utilities/http.ts), so these local assets stand in for the live
 * `/icon/{id}` ECP fetch — see useRokuChannelIcon.
 */
export const DEMO_CHANNEL_ICONS: Record<string, string> = {
  [ROKU_APPS.CHANNELS.PLEX.id]: "/roku-icons/plex.svg",
  [ROKU_APPS.CHANNELS.NETFLIX.id]: "/roku-icons/netflix.svg",
  [ROKU_APPS.CHANNELS.PEACOCK.id]: "/roku-icons/peacock.svg",
  [ROKU_APPS.CHANNELS.FOX_SPORTS.id]: "/roku-icons/fox-sports.svg",
  [ROKU_APPS.CHANNELS.HBO.id]: "/roku-icons/hbo-max.svg",
  [ROKU_APPS.CHANNELS.PRIME.id]: "/roku-icons/prime.svg",
  [ROKU_APPS.CHANNELS.APPLE_TV.id]: "/roku-icons/apple-tv.svg",
};

export const ROKU_STATE_DEFAULTS = {
  powerOn: false,
} as const;

export const ROKU_REMOTE_META = {
  type: RemoteType.ROKU,
  url: ROKU_URL,
  keystrokes: RokuKeystroke,
} as const;
