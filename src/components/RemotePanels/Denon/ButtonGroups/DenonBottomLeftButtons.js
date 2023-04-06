import Constants from "@/utilities/constants.js";
import RemoteButton from "@/components/UI/RemoteButton";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faPowerOff} from '@fortawesome/free-solid-svg-icons';
import {sendDenonCommand} from "@/utilities/http";

const remote = Constants.REMOTE.DENON
const KEYSTROKE = Constants.KEYSTROKE

function DenonBottomLeftButtons({ denonState, setDenonState }) {

    const handleClickPowerButton = async (event) => {

        setDenonState(prevState => ({
            ...prevState,
            powerOn: !prevState.powerOn
        }))

        // Unless power state could be unknown, awaiting response is unnecessary and could be dropped for responsiveness
        // For now it will change it, if response is unexpected
        const response = await sendDenonCommand(event.currentTarget)
        if (response.error) {
            return console.error(response.error)
        }

        let powerState = response.data === "ZMON"

        setDenonState(prevState => ({
            ...prevState,
            powerOn: powerState ?? !prevState.powerOn
        }))
    }
    return (
            <div className="flex flex-col menu-buttons justify-between w-5/6" >
                <RemoteButton remote={ remote }
                              className="btn bg-red-600 rounded-full aspect-square z-50"
                              value={KEYSTROKE.DENON.POWER}
                              onClick={ handleClickPowerButton }
                >
                    <FontAwesomeIcon icon={faPowerOff} />
                </RemoteButton>
                <RemoteButton remote={ remote } className="btn-secondary" value={ KEYSTROKE.DENON.MENU_TOGGLE }>Menu</RemoteButton>
                <RemoteButton remote={ remote } className="btn-secondary" value={ KEYSTROKE.DENON.OPTION }>Opt</RemoteButton>
                <RemoteButton remote={ remote } className="btn-secondary" value={ KEYSTROKE.DENON.INFO }>Info</RemoteButton>
                <RemoteButton remote={ remote } className="btn-secondary" value={ KEYSTROKE.DENON.BACK }>Back</RemoteButton>
            </div>
    );
}

export default DenonBottomLeftButtons;