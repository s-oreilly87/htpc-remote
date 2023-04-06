import Constants from "@/utilities/constants.js";
import RemoteButton from "@/components/UI/RemoteButton";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faClapperboard, faGamepad} from "@fortawesome/free-solid-svg-icons";

const AppButtons = (props) => {
    return (
        <div className="flex mx-auto w-full">
            <div className="w-full flex gap-2 justify-center">
                <RemoteButton remote={Constants.REMOTE.PC} className="btn btn-primary-pc w-1/4 flex flex-col items-center justify-center gap-1" value="launchPlaynite">
                    <FontAwesomeIcon icon={faGamepad} className="w-1/3 mx-auto" />PlayNite
                </RemoteButton>
                <RemoteButton remote={Constants.REMOTE.PC} className="btn btn-primary-pc w-1/4 flex flex-col items-center justify-center gap-1" value="launchKodi">
                    <FontAwesomeIcon icon={faClapperboard} className="w-1/3 mx-auto" />Kodi
                </RemoteButton>
                <RemoteButton remote={Constants.REMOTE.PC} id="" className="btn btn-primary-pc w-1/4" value="???">???</RemoteButton>
            </div>
        </div>
    )
}

export default AppButtons