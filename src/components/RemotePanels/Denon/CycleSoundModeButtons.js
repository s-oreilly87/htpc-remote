import {DENON_SOUND_MODES, DOLBY_MODES, DTS_MODES, REMOTE} from "@/utilities/constants.js";
import KeypressButton from "@/components/UI/KeypressButton";
import {sendDenonCommand, sendDenonQuery} from "@/utilities/http";
import {useDenonContext} from "@/context/denon.js";

const CYCLE_TIMEOUT = 5000
const RESPONSE_TIMEOUT = 2000
const remote = REMOTE.DENON

function CycleSoundModes({ cycleTimeout, setCycleTimeout }) {
    const [denonState, setDenonState, refreshDenonState] = useDenonContext();

    const handleCycleClick = async (event) => {
        // The first click of a cycle button brings up current sound mode on display - no response from denon
        // Must click again within 5 seconds to change Sound Mode and receive a response

        // Check if this is the first click
        if (!cycleTimeout) {
            sendDenonCommand(event.currentTarget) // no response on first click
            setNewCycleTimeout()
            // when (cycleTimeout !== null && !loading), the SoundModeSelect display will animate
            return
        }

        // if there is an active timeout - we want to reset it on the new click then send the command and listen for the response as usual
        resetCycleTimeout()
        handleClick(event)
    }

    const handleClick = async (event) => {
        setDenonState({loading: true})

        let responseTimeout = setResponseTimeout()
        const response = await sendDenonCommand(event.currentTarget)
        clearTimeout(responseTimeout)

        if (response.error) {
            return console.error(response.error)
        }

        let soundMode = await parseSoundModeFromResponseData(response.data)
        if (soundMode) { setDenonState({ soundMode: soundMode }) }

        setDenonState({loading: false})

        // refreshDenonState()
    }

    const setNewCycleTimeout = () => {
        let newCycleTimeout = setTimeout(() => {
            setCycleTimeout(null)
        }, CYCLE_TIMEOUT)

        setCycleTimeout(newCycleTimeout)
    }

    const resetCycleTimeout = () => {
        clearTimeout(cycleTimeout)
        setNewCycleTimeout()
    }

    const setResponseTimeout = () => {
        return setTimeout(() => {
            setDenonState({loading: false})
        }, RESPONSE_TIMEOUT)
    }

    const parseSoundModeFromResponseData = async (denonResponse) => {
        //all this parsing response may be for naught, since im updating state right after anyways
        let soundMode
        let foundSoundMode = false
        for (const line of denonResponse) {
            if (line.substring(0,2) === "MS") {
                foundSoundMode = line
                soundMode = Object.values(DENON_SOUND_MODES).find(mode => mode.value === line)
                break
            }
        }

        if (!foundSoundMode) {
            console.error('Did not receive sound mode (MS) response. Trying "MS?" query')
            const followupResponse = await sendDenonQuery("MS")
            if (followupResponse.error) {
                return console.error('"MS?" query failed. Unable to update SoundModeSelect')
            }
            for (const line of followupResponse.data) {
                if (line.substring(0,2) === "MS") {
                    foundSoundMode = line
                    soundMode = Object.values(DENON_SOUND_MODES).find(mode => mode.value === line)
                    break
                }
            }
        }

        if (!soundMode) {
            if (DOLBY_MODES.includes(foundSoundMode.substring(2).replaceAll(" ", "_"))) {
                soundMode = DENON_SOUND_MODES.DOLBY
                console.info("Mapped " + foundSoundMode + " to DOLBY DIGITAL")
            } else if (DTS_MODES.includes(foundSoundMode.substring(2))) {
                soundMode = DENON_SOUND_MODES.DTS
                console.info("Mapped " + foundSoundMode + " to DTS NEURAL:X")
            } else {
                console.info(`Unknown Sound Mode: ${foundSoundMode}`)
            }
        }

        return soundMode
    }

    return (
        <div className="w-full row mx-auto flex flex-col">
            <div className="flex gap-2 w-4/5 mx-auto justify-center">
                <KeypressButton remote={remote}
                                className="btn h-10 w-1/4 bg-green-700 hover:bg-green-600"
                                value="MSMOVIE"
                                onClick={ handleCycleClick }>

                    Movie
                </KeypressButton>
                <KeypressButton remote={remote}
                                className="btn h-10 w-1/4 bg-red-700 hover:bg-red-600"
                                value="MSMUSIC"
                                onClick={ handleCycleClick }>
                    Music
                </KeypressButton>
                <KeypressButton remote={remote}
                                className="btn h-10 w-1/4 bg-blue-700 hover:bg-blue-600"
                                value="MSGAME"
                                onClick={ handleCycleClick }>
                    Game
                </KeypressButton>
                <KeypressButton remote={remote}
                                className="btn h-10 w-1/4 bg-yellow-500 hover:bg-yellow-400"
                                value="MSDIRECT"
                                onClick={ handleClick }>
                    Pure
                </KeypressButton>
            </div>
        </div>
    );
}

export default CycleSoundModes;