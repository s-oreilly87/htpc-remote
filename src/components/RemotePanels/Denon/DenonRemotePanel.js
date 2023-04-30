import {DENON_INPUTS, DENON_SOUND_MODES, REMOTE} from "@/utilities/constants.js";
import InputButtons from "./InputButtons";
import CycleSoundModeButtons from "./CycleSoundModeButtons";
import SoundModeSelect from "./SoundModeSelect";
import AdvancedVolumeControl from "./AdvancedVolumeControl";
import BottomSection from "../Shared/BottomSection";
import {fetchMainZoneData, sendDenonQuery} from "@/utilities/http"
import {useEffect} from "react";
import Overlay from "@/components/UI/Overlay.js";

const remote = REMOTE.DENON

function DenonRemote({ denonState, setDenonState }) {

    // On render, query the amp for its current state (some data from MainZone HTTP request, levels data over telnet)
    useEffect( () => {
        updateDenonState()
    }, [])

    const updateDenonState = async () => {
        console.log('update denon state - setting laoding true')
        setLoading(true)
        await updateDenonStateFromMainZoneQuery()
        await updateDenonStateFromFetchLevels()
        setLoading(false)
    }
    const updateDenonStateFromMainZoneQuery = async () => {
        setLoading(true)
        const response = await fetchMainZoneData()

        if (response.error) {
            return console.error(response.error)
        }

        const data = response.data

        let input = Object.values(DENON_INPUTS).find(
            input => input.inputFuncSelect.includes(data.inputFuncSelect)
        )
        if (!input) {
            console.info(`Unknown Input: ${data.inputFuncSelect}`)
        }

        let soundMode = Object.values(DENON_SOUND_MODES).find(
            mode => mode.selectSurround.includes(data.selectSurround)
        )
        if (!soundMode) {
            console.info(`Unknown selectSurround: ${data.selectSurround}`)
            if (data.selectSurround.includes("DOLBY_SURROUND")) {
                console.info("Mapped to DOLBY_DIGITAL")
                soundMode = "DOLBY_DIGITAL"
            } else {
                soundMode = DENON_SOUND_MODES.NONE
            }
        }

        setDenonState(prevState =>
            ({
                ...prevState,
                input: input,
                powerOn: data.zonePower === "ON",
                muteOn: data.mute === "ON",
                soundMode: soundMode
            }))
        setLoading(false)
    }

    const updateDenonStateFromFetchLevels = async () => {
        setLoading(true)
        const refLevResponse = await sendDenonQuery("PSREFLEV")
        if (refLevResponse.error) {
            console.error(refLevResponse.error)
        } else {
            setDenonState(prevState => ({
                ...prevState,
                PSREFLEV: refLevResponse.data[0].split(" ")[1]
            }))
        }

        const dynVolResponse = await sendDenonQuery("PSDYNVOL")
        if (dynVolResponse.error) {
            console.error(dynVolResponse.error)
        } else {
            setDenonState(prevState => ({
                ...prevState,
                PSDYNVOL: dynVolResponse.data[0].split(" ")[1]
            }))
        }

        const dialogueAdjustResponse = await sendDenonQuery("PSDIL")
        // dialogueAdjustResponse[0] = ON/OFF, [1] = LEVEL
        if (dialogueAdjustResponse.error) {
            console.error(dialogueAdjustResponse.error)
        } else {
            setDenonState(prevState => ({
                ...prevState,
                psDilOn: dialogueAdjustResponse.data[0].split(" ")[1] === "ON"
            }))

            if (dialogueAdjustResponse.data[1]) {
                parseAndSetDialogueAdjustLevel(dialogueAdjustResponse.data[1].split(" ")[1])
            } else {
                console.error('for some reason didnt get 2 part PSDIL data. Heres what we got:')
                console.error(dialogueAdjustResponse.data)
            }
        }

        const dynEqResponse = await sendDenonQuery("PSDYNEQ")
        if (dynEqResponse.error) {
            console.log(dynEqResponse.error)
        } else {
            setDenonState(prevState => ({
                ...prevState,
                psDynEqOn: dynEqResponse.data[0].split(" ")[1] === "ON"
            }))
        }

        setLoading(false)
    }

    const parseAndSetDialogueAdjustLevel = (responseValue) => {
        // 0.5 steps come in without the decimal
        if (responseValue.length === 3) {
            responseValue = parseFloat(responseValue) / 10
        } else {
            responseValue = parseFloat(responseValue)
        }

        // 50 is the new 0
        responseValue -= 50
        setDenonState(prevState => ({
            ...prevState,
            PSDIL: responseValue
        }))
    }

    const setLoading = (bool) => {
        setDenonState(prevState => ({
                ...prevState,
                loading: bool
            })
        )
    }

    const setSoundMode = (soundMode) => {
        setDenonState(prevState => ({
            ...prevState,
            soundMode: soundMode,
        }))
    }

    return (
        <>
            <Overlay show={!denonState.powerOn} />
            <div id="denon-remote" className="absolute panel-height w-full p-3 flex flex-col justify-between">
                <div className="flex flex-col justify-between flex-grow pb-[15%]">
                    <InputButtons denonState={ denonState }
                                  setDenonState={ setDenonState }
                                  updateDenonState={ updateDenonState }
                    />
                    <div className="flex flex-col gap-3">
                        <SoundModeSelect
                            denonState={ denonState }
                            setDenonState={ setDenonState }
                            updateDenonState = { updateDenonState }
                        />
                        <CycleSoundModeButtons
                            denonState={ denonState }
                            setDenonState={ setDenonState }
                        />
                    </div>

                    <AdvancedVolumeControl
                        denonState={ denonState }
                        setDenonState={ setDenonState }
                        parseAndSetDialogueAdjustLevel={ parseAndSetDialogueAdjustLevel }
                    />
                </div>
                <div className="h-50 items-end">
                    <BottomSection remote={remote}
                                   denonState={denonState}
                                   setDenonState={setDenonState}
                    />
                </div>
            </div>
        </>
    );
}

export default DenonRemote;
