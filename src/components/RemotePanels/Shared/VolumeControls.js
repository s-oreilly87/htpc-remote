import KeypressButton from "@/components/UI/KeypressButton";
import PressAndHoldButton from "@/components/UI/PressAndHoldButton";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faVolumeHigh, faVolumeLow, faVolumeXmark} from '@fortawesome/free-solid-svg-icons';
import {KEYSTROKE} from "@/utilities/constants.js";

function VolumeControls({ remote }) {
    return(
        <div id="volume-buttons" className="flex flex-col w-3/4 gap-5 h-full place-self-end" role="group">
            <div className="flex flex-col gap-0.5 h-3/4">
                <PressAndHoldButton remote={remote}
                                    className={`btn btn-primary-${ remote.toLowerCase() } flex rounded-t-full w-full h-1/2` }
                                    value={KEYSTROKE[remote].VOL_UP}>
                    <FontAwesomeIcon icon={ faVolumeHigh } className="w-5/6 mx-auto my-auto"/>
                </PressAndHoldButton>
                <PressAndHoldButton remote={ remote }
                                    className={ `btn btn-primary-${ remote.toLowerCase() } flex rounded-b-full h-1/2` }
                                    value={ KEYSTROKE[remote].VOL_DOWN }>
                    <FontAwesomeIcon icon={ faVolumeLow } className="w-5/6 mx-auto my-auto"/>
                </PressAndHoldButton>
            </div>
            <div className="h-1/4 flex place-content-center align-bottom">
                <KeypressButton remote={ remote }
                                className="btn bg-red-600 rounded-full aspect-square flex w-5/6 h-2/3 justify-center items-center"
                                value={ KEYSTROKE[remote].MUTE }>
                    <FontAwesomeIcon icon={ faVolumeXmark } />
                </KeypressButton>
            </div>
        </div>
    );
}

export default VolumeControls;