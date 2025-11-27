import { DenonKeystroke, RemoteType } from "@/constants/remotes";

export const DENON_IP = process.env.NEXT_PUBLIC_DENON_IP ?? "";
export const DENON_HTTP_COMMAND_URL =
  process.env.DENON_HTTP_COMMAND_URL ?? "goform/formiPhoneAppDirect.xml";
export const DENON_HTTP_QUERY_URL =
  process.env.DENON_HTTP_QUERY_URL ?? "goform/formMainZone_MainZoneXml.xml";

export interface DenonInput {
  label: string;
  value: string;
  inputFuncSelect: string[];
}

export interface AudioModeOption {
  key: string;
  label: string;
  value: string;
  disabled?: boolean;
  denonCmd?: string;
}

export interface DenonState {
  powerOn: boolean;
  muteOn: boolean;
  input: DenonInput | null;
  soundMode: (typeof DENON_SOUND_MODES)[keyof typeof DENON_SOUND_MODES];
  loading: boolean;
  dynComp: string;
  psDilOn: boolean;
  psDynEqOn: boolean;
  MV: number | undefined;
  PSDIL: number;
  PSREFLEV: string | undefined;
  PSDYNVOL: string | undefined;
}

export const DENON_INPUTS: Record<string, DenonInput> = {
  PC: {
    label: "HTPC",
    value: "SIGAME",
    inputFuncSelect: ["HTPC"],
  },
  PHONO: {
    label: "Turntable",
    value: "SIDVD",
    inputFuncSelect: ["PHONO"],
  },
  STUDIO: {
    label: "Studio",
    value: "SICD",
    inputFuncSelect: ["STUDIO"],
  },
  TV: {
    label: "TV",
    value: "SITV",
    inputFuncSelect: ["TV_AUDIO"],
  },
  BLUETOOTH: {
    label: "Bluetooth",
    value: "SIBT",
    inputFuncSelect: ["BLUETOOTH"],
  },
  FRONT_HDMI: {
    label: "Front HDMI",
    value: "SIAUX1",
    inputFuncSelect: ["FRONT_HDMI"],
  },
};

export const AUDIO_MODES_FOR_SELECT: Record<string, AudioModeOption> = {
  PLACEHOLDER: {
    key: "PLACEHOLDER",
    label: "Select Audio Mode",
    value: "",
    disabled: true,
  },
  PURE: {
    key: "PURE",
    label: "Pure Stereo 24/192 (no sub)",
    value: "audioModeStereo",
    denonCmd: "MSQUICK1",
  },
  STEREO: {
    key: "STEREO",
    label: "Stereo (Atmos w/ sub)",
    value: "audioModeStereoAtmosSub",
    denonCmd: "MSQUICK2",
  },
  DOLBY_UPMIX: {
    key: "DOLBY_UPMIX",
    label: "Stereo (Dolby Surround Upmix)",
    value: "audioModeStereoSurround",
    denonCmd: "MSQUICK2",
  },
  SURROUND51: {
    key: "SURROUND51",
    label: "5.1 Surround",
    value: "audioMode5.1",
    denonCmd: "MSQUICK3",
  },
  ATMOS: {
    key: "ATMOS",
    label: "Dolby Atmos",
    value: "audioModeAtmos",
    denonCmd: "MSQUICK4",
  },
  DTS_X: {
    key: "DTS_X",
    label: "DTS:X",
    value: "audioModeDtsX",
    denonCmd: "MSQUICK4",
  },
};

export const DOLBY_MODES = [
  "DOLBY_SURROUND",
  "DOLBY_DIGITAL",
  "DOLBY_ATMOS",
  "DOLBY_D_+_+DOLBY_SURROUND",
  "DOLBY_HD_+_DOLBY_SURROUND",
];

export const DTS_MODES = [
  "DTS_NEURAL:X",
  "DOLBY_DIGITAL_+_NEURAL:X",
  "NEURAL:X",
  "DOLBY_DIGITAL_+_+_NEURAL:X",
  "DTS:X_MSTR",
  "DTS-HD_MSTR",
];

export const DENON_SOUND_MODES = {
  NONE: {
    label: "Select Sound Mode",
    value: "placeholder",
    selectSurround: [],
  },
  STEREO: { label: "Stereo", value: "MSSTEREO", selectSurround: ["STEREO"] },
  DOLBY: {
    label: "Dolby Surround",
    value: "MSDOLBY DIGITAL_+_DOLBY_SURROUND",
    selectSurround: DOLBY_MODES,
  },
  DTS: {
    label: "DTS Neural:X",
    value: "MSDTS SURROUND",
    selectSurround: DTS_MODES,
  },
  MULTI: {
    label: "Multi-Ch Stereo",
    value: "MSMCH STEREO",
    selectSurround: ["MULTI_CH_STEREO"],
  },
  MULTI_CH_IN: {
    label: "Multi-Ch In (5.1)",
    value: "MSSTANDARD",
    selectSurround: ["MULTI_CH_IN", "MULTI_IN_+_DOLBY_SURROUND"],
  },
  ROCK_ARENA: {
    label: "Rock Arena",
    value: "MSROCK ARENA",
    selectSurround: ["ROCK_ARENA"],
  },
  JAZZ_CLUB: {
    label: "Jazz Club",
    value: "MSJAZZ CLUB",
    selectSurround: ["JAZZ_CLUB"],
  },
  MATRIX: { label: "Matrix", value: "MSMATRIX", selectSurround: ["MATRIX"] },
  VIDEO_GAME: {
    label: "Video Game",
    value: "MSVIDEO GAME",
    selectSurround: ["VIDEO_GAME"],
  },
  VIRTUAL: {
    label: "Virtual",
    value: "MSVIRTUAL",
    selectSurround: ["VIRTUAL"],
  },
  DIRECT: { label: "Direct", value: "MSDIRECT", selectSurround: ["DIRECT"] },
  PURE_DIRECT: {
    label: "Pure Direct",
    value: "MSPURE DIRECT",
    selectSurround: ["PURE_DIRECT"],
  },
  MONO_MOVIE: {
    label: "Mono Movie",
    value: "MSMONO MOVIE",
    selectSurround: ["MONO_MOVIE"],
  },
};

export const DENON_REMOTE_META = {
  type: RemoteType.DENON,
  ip: DENON_IP,
  httpCommandUrl: DENON_HTTP_COMMAND_URL,
  httpQueryUrl: DENON_HTTP_QUERY_URL,
  keystrokes: DenonKeystroke,
};
