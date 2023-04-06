import {useEffect, useRef} from "react";
import {useAbsoluteOrientationSensor} from "@/utilities/sensors";


const AbsoluteOrientationSensor = ({frequency, updateOrientation}) => {

    // initialize relative orientation sensor
    const absOrientation = useAbsoluteOrientationSensor({frequency: frequency})
    const prevAbsOrientation = useRef(null)

    useEffect(() => {
        if (absOrientation) {
            updateOrientation(absOrientation, prevAbsOrientation.current)
            prevAbsOrientation.current = absOrientation
        }
    }, [absOrientation?.quaternion[0], absOrientation?.quaternion[1], absOrientation?.quaternion[2], absOrientation?.quaternion[3]])

    return (
        <>
        </>
    )
}

export default AbsoluteOrientationSensor