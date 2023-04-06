import RemoteButton from "@/components/UI/RemoteButton";
import PressAndHoldButton from "@/components/UI/PressAndHoldButton";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faArrowDown, faArrowLeft, faArrowRight, faArrowUp} from "@fortawesome/free-solid-svg-icons";
import {KEYSTROKE} from "@/utilities/constants.js"

const Dpad = ({ remote }) => {

    return (
        <div id="dpad" className="flex flex-col w-full aspect-square shadow-2xl bg-gray-700 [border-radius:30%;] mx-auto">
            <div id="top-row" className="flex w-full h-1/3 place-content-center">
                <div className="flex h-full w-1/3 mx-auto place-content-center">
                    <PressAndHoldButton remote={ remote }
                                        className="btn-secondary w-full rounded-t-3xl transform scale-y-125 z-10"
                                        value={ KEYSTROKE[remote].UP }
                    >
                        <FontAwesomeIcon className="mx-auto my-auto h-1/2 w-1/2 transform scale-y-90" icon={ faArrowUp }/>
                    </PressAndHoldButton>
                </div>
            </div>
            <div id="middle-row" className="w-full h-1/3 flex">
                <div className="flex h-full w-1/3">
                    <PressAndHoldButton remote={ remote }
                                        className="btn-secondary flex w-full rounded-l-3xl transform scale-x-125 z-10"
                                        value={ KEYSTROKE[remote].LEFT }
                    >
                        <FontAwesomeIcon className="mx-auto my-auto h-1/2 w-1/2 transform scale-x-90" icon={ faArrowLeft } />
                    </PressAndHoldButton>
                </div>
                <div className="flex h-full w-1/3">
                    <RemoteButton remote={ remote }
                                  className={`btn btn-primary-${ remote.toLowerCase() } z-20 transform scale-125 rounded-full w-screen drop-shadow-2xl`}
                                  value={ KEYSTROKE[remote].OK }
                    >
                        <span className="mx-auto my-auto h-1/2 w-1/2 text-xl">OK</span>
                    </RemoteButton>
                </div>
                <div className="flex h-full w-1/3">
                    <PressAndHoldButton remote={ remote }
                                        className="btn-secondary w-full rounded-r-3xl transform scale-x-125 z-10"
                                        value={ KEYSTROKE[remote].RIGHT }
                    >
                        <FontAwesomeIcon className="mx-auto my-auto h-1/2 w-1/2 transform scale-x-90" icon={ faArrowRight } />
                    </PressAndHoldButton>
                </div>
            </div>
            <div id="bottom-row" className="flex w-full h-1/3 place-content-center">
                <div className="flex h-full w-1/3">
                    <PressAndHoldButton remote={ remote }
                                        className="btn-secondary w-full rounded-b-3xl transform scale-y-125 z-10"
                                        value={ KEYSTROKE[remote].DOWN }
                    >
                        <FontAwesomeIcon className="mx-auto my-auto h-1/2 w-1/2 transform scale-y-90" icon={ faArrowDown } />
                    </PressAndHoldButton>
                </div>
            </div>
        </div>
    );
}

export default Dpad