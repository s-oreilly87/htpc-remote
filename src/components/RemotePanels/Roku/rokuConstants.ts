import { URL_ENCODED_SYMBOLS } from "@/constants/encoding";
import { RemoteType, RokuKeystroke } from "@/constants/remotes";

const ROKU_IP = process.env.NEXT_PUBLIC_ROKU_IP ?? "";
const ROKU_PORT = 8060;
const ROKU_URL = ROKU_IP ? `http://${ROKU_IP}:${ROKU_PORT}` : "";

export interface RokuChannel {
  id: string;
  label: string;
}

export interface RokuApps {
  CHANNELS: Record<string, RokuChannel>;
  HDMI: Record<string, RokuChannel>;
}

export const ROKU_APPS: RokuApps = {
  CHANNELS: {
    PLEX: { id: "13535", label: "Plex - Free Movies & TV" },
    NETFLIX: { id: "12", label: "Netflix" },
    PEACOCK: { id: "593099", label: "Peacock TV" },
    FOX_SPORTS: { id: "95307", label: "FOX Sports" },
    HBO: { id: "61322", label: "HBOMax" },
    PRIME: { id: "13", label: "Prime" },
    APPLE_TV: { id: "551012", label: "AppleTV" },
  },
  HDMI: {
    HDMI1: {
      id: `tvinput${URL_ENCODED_SYMBOLS["."]}hdmi1`,
      label: "HDMI1",
    },
    HDMI2: {
      id: `tvinput${URL_ENCODED_SYMBOLS["."]}hdmi2`,
      label: "HDMI2",
    },
    HDMI3: {
      id: `tvinput${URL_ENCODED_SYMBOLS["."]}hdmi3`,
      label: "HDMI3",
    },
    HDMI4: {
      id: `tvinput${URL_ENCODED_SYMBOLS["."]}hdmi4`,
      label: "HDMI4: HTPC",
    },
  },
};

export const ROKU_STATE_DEFAULTS = {
  powerOn: false,
};

export const ROKU_REMOTE_META = {
  type: RemoteType.ROKU,
  url: ROKU_URL,
  keystrokes: RokuKeystroke,
} as const;
