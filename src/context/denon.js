import {createContext, useContext, useState} from "react";
import {DENON_INPUTS, DENON_SOUND_MODES, DENON_STATE_DEFAULTS} from "@/utilities/constants.js";
import {fetchMainZoneData, sendDenonQuery} from "@/utilities/http.js";

const Context = createContext();

export function DenonProvider({ children }) {
    const [denonState, setDenonState] = useState(DENON_STATE_DEFAULTS);

    const updateDenonState = (props) => {
        setDenonState((prevState) => ({ ...prevState, ...props }));
    }

    const refreshDenonState = async () => {
        updateDenonState({loading: true})
        await updateDenonStateFromMainZoneQuery()
        await updateDenonStateFromFetchLevels()
        updateDenonState({loading: false})
    }
    const updateDenonStateFromMainZoneQuery = async () => {
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

        updateDenonState({
            input: input,
            powerOn: data.zonePower === "ON",
            muteOn: data.mute === "ON",
            soundMode: soundMode
        })
    }

    const updateDenonStateFromFetchLevels = async () => {
        const refLevResponse = await sendDenonQuery("PSREFLEV")
        if (refLevResponse.error) {
            console.error(refLevResponse.error)
        } else {
            updateDenonState({ PSREFLEV: refLevResponse.data[0].split(" ")[1] })
        }

        const dynVolResponse = await sendDenonQuery("PSDYNVOL")
        if (dynVolResponse.error) {
            console.error(dynVolResponse.error)
        } else {
            updateDenonState({ PSDYNVOL: dynVolResponse.data[0].split(" ")[1] })
        }

        const dialogueAdjustResponse = await sendDenonQuery("PSDIL")
        // dialogueAdjustResponse[0] = ON/OFF, [1] = LEVEL
        if (dialogueAdjustResponse.error) {
            console.error(dialogueAdjustResponse.error)
        } else {
            updateDenonState({ psDilOn: dialogueAdjustResponse.data[0].split(" ")[1] === "ON" })

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
            updateDenonState({ psDynEqOn: dynEqResponse.data[0].split(" ")[1] === "ON" })
        }
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
        updateDenonState({ PSDIL: responseValue })
    }


    return (
        <Context.Provider value={[denonState, updateDenonState, refreshDenonState]}>
            {children}
        </Context.Provider>
    );
}

export function useDenonContext() {
    return useContext(Context);
}