import {AUDIO_MODES_FOR_SELECT, DISPLAY_MODES_FOR_SELECT, REMOTE, ROKU_APPS} from "@/utilities/constants.js";
import KeypressButton from "@/components/UI/KeypressButton";
import CustomModesCollapse from "./CustomModesCollapse";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faDesktop, faTv} from "@fortawesome/free-solid-svg-icons";
import {sendDenonCommand, sendEventToEventGhost, sendRokuLaunchCommand} from "@/utilities/http";
import {useState} from "react";

const remote = REMOTE.PC

const presetToEffectsMap = {
    presetPCStereo: {
        audioMode: AUDIO_MODES_FOR_SELECT.STEREO,
        displayMode: DISPLAY_MODES_FOR_SELECT.PC
    },
    presetPCSurround: {
        audioMode: AUDIO_MODES_FOR_SELECT.DOLBY_UPMIX,
        displayMode: DISPLAY_MODES_FOR_SELECT.PC
    },
    presetTV4K: {
        audioMode: AUDIO_MODES_FOR_SELECT.ATMOS,
        displayMode: DISPLAY_MODES_FOR_SELECT.TV4K,
        rokuApp: ROKU_APPS.HDMI.HDMI2
    },
    presetTV1440: {
        audioMode: AUDIO_MODES_FOR_SELECT.ATMOS,
        displayMode: DISPLAY_MODES_FOR_SELECT.TV1440,
        rokuApp: ROKU_APPS.HDMI.HDMI2
    }
}

function AudioVideoPresets() {

    const [selectedAudioMode, setSelectedAudioMode] = useState(AUDIO_MODES_FOR_SELECT.PLACEHOLDER)
    const [selectedDisplayMode, setSelectedDisplayMode] = useState(DISPLAY_MODES_FOR_SELECT.PLACEHOLDER)

    const handleClick = async (event) => {
        const preset = presetToEffectsMap[event.currentTarget.value]

        if (preset.rokuApp) {
            sendRokuLaunchCommand({value: preset.rokuApp.id})
        }

        setSelectedAudioMode(preset.audioMode)
        setSelectedDisplayMode(preset.displayMode)
        sendEventToEventGhost(event.currentTarget).then(() => {
            setTimeout(() => {
                sendDenonCommand({ value: preset.audioMode.denonCmd })
            }, 3000)
        })
    }

    return (
        <div className="flex flex-col gap-2">
            <div className="flex justify-around gap-2">
                <KeypressButton remote={ remote }
                                id="preset-pc-stereo"
                                className="btn btn-primary-pc w-1/4 flex flex-col justify-center items-center"
                                value="presetPCStereo"
                                onClick={ handleClick }>
                    <FontAwesomeIcon icon={ faDesktop } className="h-6 w-6" />
                    PC<br/>Stereo
                </KeypressButton>
                <KeypressButton remote={ remote }
                                id="preset-pc-surround"
                                className="btn btn-primary-pc w-1/4 flex flex-col justify-center items-center"
                                value="presetPCSurround"
                                onClick={ handleClick }>
                    <FontAwesomeIcon icon={ faDesktop } className="h-6 w-6" />
                    PC<br/>Dolby
                </KeypressButton>
                <KeypressButton remote={ remote }
                                id="preset-tv-4k"
                                className="btn btn-primary-pc w-1/4 flex flex-col justify-center items-center"
                                value="presetTV4K"
                                onClick={ handleClick }>
                    <FontAwesomeIcon icon={ faTv } className="h-8 w-8" />
                    4K60<br/>Atmos
                </KeypressButton>
                <KeypressButton remote={ remote }
                                id="preset-tv-1440"
                                className="btn btn-primary-pc w-1/4 flex flex-col justify-center items-center"
                                value="presetTV1440"
                                onClick={ handleClick }>
                    <FontAwesomeIcon icon={ faTv } className="h-8 w-8" />
                    1440p120<br/>Atmos
                </KeypressButton>
            </div>
            <CustomModesCollapse selectedAudioMode={ selectedAudioMode }
                                 setSelectedAudioMode={ setSelectedAudioMode }
                                 selectedDisplayMode={ selectedDisplayMode }
                                 setSelectedDisplayMode={ setSelectedDisplayMode }/>
        </div>
    );
}

export default AudioVideoPresets