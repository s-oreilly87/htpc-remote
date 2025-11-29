import { RemoteType } from "@/constants/remotes";
import { URL_ENCODED_SYMBOLS } from "@/constants/encoding";
import { ROKU_APPS } from "@/components/RemotePanels/Roku/rokuConstants";
import {LinuxAudioModeCommand, LinuxDisplayModeCommand} from "@/constants/htpcControls";
import {DENON_AUDIO_MODES} from "@/utilities/constants";

export interface SelectOption {
  key: string;
  value: string;
  label: string;
  disabled?: boolean;
  denonCmd?: string;
  rokuChannel?: { id: string; label: string };
}

export const AUDIO_MODES_FOR_SELECT_EG: Record<string, SelectOption> = {
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
  },
  STEREO: {
    key: "STEREO",
    label: "Stereo (Atmos w/ sub)",
    value: "audioModeStereoAtmosSub",
  },
  DOLBY_UPMIX: {
    key: "DOLBY_UPMIX",
    label: "Stereo (Dolby Surround Upmix)",
    value: "audioModeStereoSurround",
  },
  SURROUND51: {
    key: "SURROUND51",
    label: "5.1 Surround",
    value: "audioMode5.1",
  },
  ATMOS: {
    key: "ATMOS",
    label: "Dolby Atmos",
    value: "audioModeAtmos",
  },
  DTS_X: {
    key: "DTS_X",
    label: "DTS:X",
    value: "audioModeDtsX",
  },
};

export const AUDIO_MODES_FOR_SELECT_LINUX: Record<string, SelectOption> = {
    PLACEHOLDER: {
        key: "PLACEHOLDER",
        label: "Select Audio Mode",
        value: "",
        disabled: true,
    },
    PURE: {
        key: "PURE",
        label: "Pure Stereo 24/192 (no sub)",
        value: LinuxAudioModeCommand.HdmiStereo,
        denonCmd: "MSQUICK1",
    },
    STEREO: {
        key: "STEREO",
        label: "Stereo (Atmos w/ sub)",
        value: LinuxAudioModeCommand.Surround51,
        denonCmd: 'MSQUICK2'
    },
    DOLBY_UPMIX: {
        key: "DOLBY_UPMIX",
        label: "Stereo (Dolby Surround Upmix)",
        value: LinuxAudioModeCommand.HdmiStereo,
        denonCmd: 'MSQUICK2'
    },
    SURROUND51: {
        key: "SURROUND51",
        label: "5.1 Surround",
        value: LinuxAudioModeCommand.Surround51,
        denonCmd: 'MSQUICK3'
    }
};

export const DISPLAY_MODES_FOR_SELECT_EG: Record<string, SelectOption> = {
  PLACEHOLDER: {
    key: "PLACEHOLDER",
    value: "",
    label: "Select Display Mode",
    disabled: true,
  },
  HTPC_4K60: {
    key: "HTPC_4K60",
    value: "displayModeHTPC4K60",
    label: "HTPC (4K60)",
    rokuChannel: ROKU_APPS.HDMI.HDMI4,
  },
  HTPC_1440p120: {
    key: "HTPC_1440p120",
    value: "displayModeHTPC1440p120",
    label: "HTPC (1440p120)",
    rokuChannel: ROKU_APPS.HDMI.HDMI4,
  },
  HTPC_1080p120: {
    key: "HTPC_1080p120",
    value: "displayModeHTPC1080p120",
    label: "HTPC (1080p120)",
    rokuChannel: ROKU_APPS.HDMI.HDMI4,
  },
};

export const DISPLAY_MODES_FOR_SELECT_LINUX: Record<string, SelectOption> = {
    PLACEHOLDER: {
        key: "PLACEHOLDER",
        value: "",
        label: "Select Display Mode",
        disabled: true,
    },
    HTPC_4K60_HDR: {
        key: "HTPC_4K60_HDR",
        value: LinuxDisplayModeCommand.Res4k60HDR,
        label: "HTPC (4K60 HDR)",
        rokuChannel: ROKU_APPS.HDMI.HDMI4,
    },
    HTPC_1440p120_HDR: {
        key: "HTPC_1440p120_HDR",
        value: LinuxDisplayModeCommand.Res1440p120HDR,
        label: "HTPC (1440p120 HDR)",
        rokuChannel: ROKU_APPS.HDMI.HDMI4,
    },
    HTPC_4K60_SDR: {
        key: "HTPC_4K60_SDR",
        value: LinuxDisplayModeCommand.Res4k60SDR,
        label: "HTPC (4K60 SDR)",
        rokuChannel: ROKU_APPS.HDMI.HDMI4,
    },
    HTPC_1440p120_SDR: {
        key: "HTPC_1440p120_SDR",
        value: LinuxDisplayModeCommand.Res1440p120SDR,
        label: "HTPC (1440p120 SDR)",
        rokuChannel: ROKU_APPS.HDMI.HDMI4,
    },
};

export const PC_REMOTE_META = {
  type: RemoteType.PC,
  clickTypes: { ...URL_ENCODED_SYMBOLS },
};
