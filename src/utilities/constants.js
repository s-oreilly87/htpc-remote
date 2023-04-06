export const SERVER_IP = '192.168.1.227'
export const DENON_IP = '192.168.1.101'
export const ROKU_URL = 'http://192.168.1.102:8060'
export const PROXY_URL = `https://${SERVER_IP}:4001`
export const DENON_SERVER_URL = `https://${SERVER_IP}:4003`
export const NUTJS_URL = `https://${SERVER_IP}:4004`
export const EVENTGHOST_URL = `https://${SERVER_IP}:4005`
export const DENON_HTTP_URL = `http://${DENON_IP}/goform/formiPhoneAppDirect.xml`

export const ROKU_POST_OPTIONS = {
    method: 'POST',
    headers: {'Content-Length': '0'}
}

export const REMOTE = {
    DENON: "DENON",
    ROKU: "ROKU",
    PC: "PC"
}

export const REMOTE_INDEX = {
    [REMOTE.DENON]: 0,
    [REMOTE.ROKU]: 1,
    [REMOTE.PC]: 2
}

export const URL_ENCODED_SYMBOLS = {
    " ": "%20",
    "#": "%23",
    "$": "%24",
    "%": "%25",
    "&": "%26",
    "+": "%2B",
    ",": "%2C",
    ".": "%2E",
    "/": "%2F",
    ":": "%3A",
    ";": "%3B",
    "<": "%3C",
    "=": "%3D",
    ">": "%3E",
    "?": "%3F",
    "@": "%40",
    "\\": "%5C",
}

export const KEYSTROKE = {
    PC: {
        ENTER: "KEYSTROKE_ENTER",
        BACKSPACE: "KEYSTROKE_BACKSPACE",
        WIN_KEY: "KEYSTROKE_WIN_KEY",
        ESCAPE: "KEYSTROKE_ESCAPE",
        TAB: "KEYSTROKE_TAB",
        UP: "KEYSTROKE_UP",
        DOWN: "KEYSTROKE_DOWN",
        LEFT: "KEYSTROKE_LEFT",
        RIGHT: "KEYSTROKE_RIGHT",
        VOL_UP: "KEYSTROKE_VOL_UP",
        VOL_DOWN: "KEYSTROKE_VOL_DOWN",
        MUTE: "KEYSTROKE_MUTE",
        PREV: "KEYSTROKE_PREV",
        REWIND: "KEYSTROKE_LEFT",
        PLAY: "KEYSTROKE_PLAY",
        FFWD: "KEYSTROKE_RIGHT",
        NEXT: "KEYSTROKE_NEXT",
        OK: "KEYSTROKE_ENTER"
    },
    ROKU: {
        POWER: "Power",
        HOME: "Home",
        BACK: "Back",
        OPTION: "Info",
        UP: "Up",
        DOWN: "Down",
        LEFT: "Left",
        RIGHT: "Right",
        OK: "Select",
        VOL_UP: "VolumeUp",
        VOL_DOWN: "VolumeDown",
        MUTE: "VolumeMute",
        REWIND: "Rev",
        PLAY: "Play",
        FFWD: "Fwd",
        ENTER: "Enter"
    },
    DENON: {
        POWER: "POWER",
        BACK: "MNRTN",
        MENU_TOGGLE: "MNMEN",
        MENU_ON: "MNMEN ON",
        MENU_OFF: "MNMEN OFF",
        OPTION: "MNOPT",
        INFO: "MNINF",
        UP: "MNCUP",
        DOWN: "MNCDN",
        LEFT: "MNCLT",
        RIGHT: "MNCRT",
        VOL_UP: "MVUP",
        VOL_DOWN: "MVDOWN",
        MUTE: "MUTE",
        ENTER: "MNENT",
        OK: "MNENT"
    },
    KEYS: {
        BACKSPACE: "BACKSPACE",
        WIN_KEY: "WIN_KEY",
        ENTER: "ENTER",
    }
}

export const SYSTEM_KEYS = ["Control", "Shift", "Alt", "CapsLock"] // Keys we dont want to send

export const ROKU_APPS = {
    CHANNELS: {
        NETFLIX: {
            id: "12",
            label: "Netflix"
        },
        DISNEY: {
            id: "291097",
            label: "Disney+"
        },
        HBO: {
            id: "61322",
            label: "HBOMax"
        },
        PRIME: {
            id: "13",
            label: "Prime"
        },
        APPLE_TV: {
            id: "551012",
            label: "AppleTV"
        },
        HULU: {
            id: "2285",
            label: "Hulu"
        },
        ROKU: {
            id: "151908",
            label: "Roku"
        },
        YOUTUBE: {
            id: "837",
            label: "Youtube"
        },
    },
    HDMI: {
        HDMI1: {
            id: `tvinput${URL_ENCODED_SYMBOLS['.']}hdmi1`,
            label: "HDMI1: PC"
        },
        HDMI2: {
            id: `tvinput${URL_ENCODED_SYMBOLS['.']}hdmi2`,
            label: "HDMI2"
        },
        HDMI3: {
            id: `tvinput${URL_ENCODED_SYMBOLS['.']}hdmi3`,
            label: "HDMI3"
        },
        HDMI4: {
            id: `tvinput${URL_ENCODED_SYMBOLS['.']}hdmi4`,
            label: "HDMI4: AVR"
        },
    }
}

export const AUDIO_MODES_FOR_SELECT = {
    PLACEHOLDER: {
        key: "PLACEHOLDER",
        label: 'Select Audio Mode',
        value: "",
        disabled: true
    },
    STEREO: {
        key: "STEREO",
        label: 'Stereo',
        value: "audioModeStereo",
        denonCmd: "MSQUICK1"
    },
    DOLBY_UPMIX: {
        key: "DOLBY_UPMIX",
        label: 'Stereo (Dolby Surround Upmix)',
        value: "audioModeStereoSurround",
        denonCmd: "MSQUICK2"
    },
    SURROUND51: {
        key: "SURROUND51",
        label: '5.1 Surround',
        value: "audioMode5.1",
        denonCmd: "MSQUICK3"
    },
    ATMOS: {
        key: "ATMOS",
        label: 'Dolby Atmos',
        value: "audioModeAtmos",
        denonCmd: "MSQUICK4"
    },
}

export const DISPLAY_MODES_FOR_SELECT = {
    PLACEHOLDER: {
        key: "PLACEHOLDER",
        value: "",
        label: "Select Display Mode",
        disabled: true
    },
    PC: {
        key: "PC",
        value: "displayModePC",
        label: "PC Monitor"
    },
    TV4K: {
        key: "TV4K",
        value: "displayModeTV4K60",
        label: "TV (4K60)",
        rokuChannel: ROKU_APPS.HDMI.HDMI1
    },
    TV1440: {
        key: "TV1440",
        value: "displayModeTV2K120",
        label: "TV (1440p120)",
        rokuChannel: ROKU_APPS.HDMI.HDMI1
    }
}

export const DENON_INPUTS = {
    PC: {
        label: "PC",
        value: "SIGAME",
        inputFuncSelect: ["PCIN"]
    },
    PHONO: {
        label: "TurnTable",
        value: "SIDVD",
        inputFuncSelect: ["PHONO"]
    },
    STUDIO: {
        label: "Studio",
        value: "SICD",
        inputFuncSelect: ["STUDIO"]
    },
    TV: {
        label: "TV",
        value: "SITV",
        inputFuncSelect: ["TV_AUDIO"]
    },
    BLUETOOTH: {
        label: "Bluetooth",
        value: "SIBT",
        inputFuncSelect: ["BLUETOOTH"]
    },
    FRONT_HDMI: {
        label: "Front HDMI",
        value: "SIAUX1",
        inputFuncSelect: ["FRONT_HDMI"]
    }
}

export const DENON_STATE_DEFAULTS = {
    powerOn: false,
    muteOn: false,
    input: "",
    soundMode: "",
    dynComp: "",
    psDilOn: false,
    PSDIL: 0,  //needs to be int so it can be incremented
    PSDYNEQ: "OFF",
    PSREFLEV: "0",
    PSDYNVOL: "OFF"
}

export const ROKU_STATE_DEFAULTS = {
    powerOn: false
}

export const DOLBY_MODES = [
    "DOLBY_SURROUND",
    "DOLBY_DIGITAL",
    "DOLBY_ATMOS",
]

export const DENON_SOUND_MODES = {
    NONE       : {label: "Select Sound Mode",   value: "placeholder", selectSurround: []},
    STEREO     : {label: "Stereo",              value: "MSSTEREO", selectSurround: ["STEREO"]},
    DOLBY      : {label: "Dolby Surround",      value: "MSDOLBY DIGITAL", selectSurround: DOLBY_MODES},
    DTS        : {label: "DTS Neural:X",        value: "MSDTS SURROUND", selectSurround: ["DTS NEURAL:X"]},
    MULTI      : {label: "Multi-Channel Stereo", value: "MSMCH STEREO", selectSurround: ["MULTI_CH_STEREO"]},
    ROCK_ARENA : {label: "Rock Arena",          value: "MSROCK ARENA", selectSurround: ["ROCK_ARENA"]},
    JAZZ_CLUB  : {label: "Jazz Club",           value: "MSJAZZ CLUB", selectSurround: ["JAZZ_CLUB"]},
    MATRIX     : {label: "Matrix",              value: "MSMATRIX", selectSurround: ["MATRIX"]},
    VIDEO_GAME : {label: "Video Game",          value: "MSVIDEO GAME", selectSurround: ["VIDEO_GAME"]},
    VIRTUAL    : {label: "Virtual",             value: "MSVIRTUAL", selectSurround: ["VIRTUAL"]},
    DIRECT     : {label: "Direct",              value: "MSDIRECT", selectSurround: ["DIRECT"]},
    PURE_DIRECT: {label: "Pure Direct",         value: "MSPURE DIRECT", selectSurround: ["PURE_DIRECT"]},
    MONO_MOVIE : {label: "Mono Movie",          value: "MSMONO MOVIE", selectSurround: ["MONO_MOVIE"]}
}

export const DENON_HTTP_COMMANDS = [
    KEYSTROKE.DENON.MENU_ON,
    KEYSTROKE.DENON.MENU_OFF,
    KEYSTROKE.DENON.UP,
    KEYSTROKE.DENON.DOWN,
    KEYSTROKE.DENON.LEFT,
    KEYSTROKE.DENON.RIGHT,
    KEYSTROKE.DENON.OK,
    KEYSTROKE.DENON.BACK,
    KEYSTROKE.DENON.INFO,
    KEYSTROKE.DENON.OPTION,
    KEYSTROKE.DENON.VOL_UP,
    KEYSTROKE.DENON.VOL_DOWN
]

const Constants = {
    EVENTGHOST_URL,
    ROKU_URL,
    PROXY_URL,
    NUTJS_URL,
    DENON_IP,
    DENON_SERVER_URL,
    DENON_HTTP_URL,
    ROKU_POST_OPTIONS,
    REMOTE,
    REMOTE_INDEX,
    URL_ENCODED_SYMBOLS,
    ROKU_APPS: ROKU_APPS,
    AUDIO_MODES: AUDIO_MODES_FOR_SELECT,
    DISPLAY_MODES: DISPLAY_MODES_FOR_SELECT,
    KEYSTROKE,
    SYSTEM_KEYS,
    DENON_HTTP_COMMANDS
}

export default Constants