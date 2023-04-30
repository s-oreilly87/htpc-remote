import Constants from "@/utilities/constants.js";
import KeypressButton from "@/components/UI/KeypressButton";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faArrowLeftLong, faAsterisk, faHouse} from '@fortawesome/free-solid-svg-icons';

function BackHomeOption(props) {
    return (
        <div id="back-home-option" className="w-full flex gap-2 h-12 max-h-12" style={{ height:props.height }}>
            <div className="flex w-full place-content-center gap-2">
                <KeypressButton remote={Constants.REMOTE.ROKU} id="back" className="btn btn-secondary flex w-1/6 h-full items-center place-content-center" value="Back">
                    <FontAwesomeIcon icon={faArrowLeftLong} className="h-1/2" />
                </KeypressButton>
                <KeypressButton remote={Constants.REMOTE.ROKU} id="home" className="btn btn-primary-roku flex w-1/6 h-full items-center place-content-center" value="Home">
                    <FontAwesomeIcon icon={faHouse} className="h-1/2" />
                </KeypressButton>
                <KeypressButton remote={Constants.REMOTE.ROKU} id="info" className="btn btn-secondary flex w-1/6 h-full items-center place-content-center" value="Info">
                    <FontAwesomeIcon icon={faAsterisk} className="h-1/2" />
                </KeypressButton>
            </div>
        </div>
    );
}

export default BackHomeOption;