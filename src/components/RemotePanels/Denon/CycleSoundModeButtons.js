import {DENON_SOUND_MODES, DOLBY_MODES, REMOTE} from "@/utilities/constants.js";
import RemoteButton from "@/components/UI/RemoteButton";
import {sendDenonCommand, sendDenonQuery} from "@/utilities/http";

const remote = REMOTE.DENON
function CycleSoundModes({ setDenonState, updateDenonState }) {

    const handleClick = async (event) => {
        const response = await sendDenonCommand(event.currentTarget)

        if (response.error) {
            return console.error(response.error)
        }

        //all this parsing response may be for naught, since im updating state right after anyways
        let soundMode
        let foundSoundMode = false
        for (const line of response.data) {
            if (line.substring(0,2) === "MS") {
                foundSoundMode = line
                soundMode = Object.values(DENON_SOUND_MODES).find(mode => mode.value === line)
                break
            }
        }

        if (!foundSoundMode) {
            console.error('Did not receive sound mode (MS) response. Trying "MS?" query')
            const response2 = await sendDenonQuery("MS")
            if (response2.error) {
                return console.error('"MS?" query failed. Unable to update SoundModeSelect')
            }
            for (const line of response2.data) {
                if (line.substring(0,2) === "MS") {
                    foundSoundMode = line
                    soundMode = Object.values(DENON_SOUND_MODES).find(mode => mode.value === line)
                    break
                }
            }
        }

        if (!soundMode) {
            console.info(`Unknown Sound Mode: ${foundSoundMode}`)

            if (DOLBY_MODES.includes(foundSoundMode.substring(2).replaceAll(" ", "_"))) {
                soundMode = DENON_SOUND_MODES.DOLBY
                console.info("Mapped to DOLBY DIGITAL")
            }

            if (foundSoundMode.includes("NEURAL:X")) {
                soundMode = DENON_SOUND_MODES.DTS
                console.info("Mapped to DTS NEURAL:X")
            }
        }

        setDenonState(prevState => ({
            ...prevState,
            soundMode: soundMode
        }))

        //updateDenonState()
    }

    return (
        <div className="w-full row mx-auto flex flex-col">
            <div className="flex w-full justify-items-stretch items-center ">
                <hr className="w-1/3 align-self-middle justify-self-center stroke-teal-500" />
                <span className="w-full text-center text-teal-400" >Cycle Sound Modes</span>
                <hr className="w-1/3 align-middle" />
            </div>
            <div className="flex gap-2 w-4/5 mx-auto justify-center">
                <RemoteButton remote={remote}
                              className="btn h-10 w-1/4 bg-green-700 hover:bg-green-600"
                              value="MSMOVIE"
                              onClick={handleClick}>
                    Movie
                </RemoteButton>
                <RemoteButton remote={remote}
                              className="btn h-10 w-1/4 bg-red-700 hover:bg-red-600"
                              value="MSMUSIC"
                              onClick={handleClick}>
                    Music
                </RemoteButton>
                <RemoteButton remote={remote}
                              className="btn h-10 w-1/4 bg-blue-700 hover:bg-blue-600"
                              value="MSGAME"
                              onClick={handleClick}>
                    Game
                </RemoteButton>
                <RemoteButton remote={remote}
                              className="btn h-10 w-1/4 bg-yellow-500 hover:bg-yellow-400"
                              value="MSDIRECT"
                              onClick={handleClick}>
                    Pure
                </RemoteButton>
            </div>
        </div>
    );
}

export default CycleSoundModes;