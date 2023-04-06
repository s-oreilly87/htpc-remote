import {useEffect, useRef, useState} from "react";
import {Switch} from "@headlessui/react";
import {useWakeLock} from "react-screen-wake-lock";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faLocationCrosshairs} from "@fortawesome/free-solid-svg-icons";
import {hasRelativeOrientationSensor,} from "@/utilities/sensors";
import AirMouseCalibrationModal from "@/components/RemotePanels/PC/AirMouseCalibrationModal";
import RelativeOrientationSensor from "@/components/Sensors/RelativeOrientationSensor";
import {sendClickToNutJS, sendDisableCommandToNutJS, sendOrientationToNutJS} from "@/utilities/http.js";

const AirMouse = () => {
    const [enabled, setEnabled] = useState(false)
    const [hasRelOrientationSensor, setHasRelOrientationSensor] = useState(false)
    const [showCalibration, setShowCalibration] = useState(false)

    // Wakelock to keep screen alive while airMouse is enabled
    const { isSupported, released, request, release, type } = useWakeLock({
        // onRequest: () => alert('Screen Wake Lock: requested!'),
        // onError: () => alert('An error happened 💥'),
        // onRelease: () => alert('Screen Wake Lock: released!'),
    });
    useEffect(() => {
        if (type !== undefined) {
            if (enabled) {
                request()
            } else {
                console.log(isSupported)
                console.log(released)
                release()
            }
        }

    }, [enabled])

    useEffect(() => {
        setHasRelOrientationSensor(hasRelativeOrientationSensor())
    }, [])

    const currentOrientation = useRef(null)

    const updateOrientation = (orientation, prevOrientation) => {
        currentOrientation.current = orientation
        if (prevOrientation) {
            const deltaX = prevOrientation.quaternion[2] - orientation.quaternion[2]
            const deltaY = prevOrientation.quaternion[0] - orientation.quaternion[0]
            if (Math.abs(deltaX) > 0.0001 || Math.abs(deltaY) > 0.0005) {
                sendOrientationToNutJS('orientation', orientation.quaternion[2], orientation.quaternion[0])
            }
        }
    }

    const handleEnable = (isEnabled) => {
        if (!isEnabled) {
            sendDisableCommandToNutJS()
        }
        setEnabled(isEnabled)
    }

    const handleLeftClick = () => {
        sendClickToNutJS('left')
    }

    const handleRightClick = () => {
        sendClickToNutJS('right')
    }

    const handleSetTopLeft = () => {
        sendOrientationToNutJS('setTopLeft', currentOrientation.current.quaternion[2], currentOrientation.current.quaternion[0])
    }

    const handleSetBottomRight = () => {
        sendOrientationToNutJS('setBottomRight', currentOrientation.current.quaternion[2], currentOrientation.current.quaternion[0])
    }

    return(
        <>
            { hasRelOrientationSensor &&

                <>
                    { enabled &&
                        <RelativeOrientationSensor frequency={ 60 }
                                                   updateOrientation={ updateOrientation } />
                    }

                    <AirMouseCalibrationModal showCalibration={ showCalibration }
                                              setShowCalibration={ setShowCalibration }
                                              handleSetTopLeft={ handleSetTopLeft }
                                              handleSetBottomRight={ handleSetBottomRight }
                                              orientation={ currentOrientation }/>

                    <div className={"flex gap-3 mx-auto self-end"}>

                        { enabled &&
                            <button className={"btn px-10 py-6 bg-gray-500"} onClick={ handleLeftClick }>L</button>
                        }

                        <div className={"flex flex-col items-center gap-2"}>
                            <Switch.Group>
                                <div className={"flex flex-col items-center justify-center"}>
                                    <Switch.Label className={"text-white"}>Air Mouse</Switch.Label>
                                    <Switch
                                        checked={enabled}
                                        onChange={ handleEnable }
                                        className={`${
                                            enabled ? 'bg-blue-600' : 'bg-gray-400'
                                        } relative inline-flex h-6 w-11 items-center rounded-full`}
                                    >
                                        <span className="sr-only">Air Mouse</span>
                                        <span
                                            className={`${
                                                enabled ? 'translate-x-6 bg-white' : 'translate-x-1 bg-blue-600'
                                            } inline-block h-4 w-4 transform rounded-full  transition`}
                                        />
                                    </Switch>
                                </div>
                            </Switch.Group>

                            { enabled &&
                                <button
                                    className={"btn btn-primary-pc rounded-full aspect-square p-2 justify-center items-center h-full"}
                                    onClick={() => setShowCalibration(true)}>
                                    <FontAwesomeIcon icon={ faLocationCrosshairs }/>
                                </button>
                            }

                        </div>

                        { enabled &&
                            <button className={"btn px-10 py-6 bg-gray-500"} onClick={ handleRightClick }>R</button>
                        }
                    </div>
                </>
            }
        </>
    );
}

export default AirMouse;