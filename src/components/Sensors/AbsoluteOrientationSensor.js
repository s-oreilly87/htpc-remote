import {useEffect, useRef} from "react";
import {useAbsoluteOrientationSensor} from "@/utilities/sensors";


const AbsoluteOrientationSensor = ({frequency, updateOrientation}) => {

    // initialize relative orientation sensor
    const absOrientation = useAbsoluteOrientationSensor({ frequency: frequency })
    const prevAbsOrientation = useRef(null)

    useEffect(() => {
        if (absOrientation) {
            updateOrientation(absOrientation, prevAbsOrientation.current)
            prevAbsOrientation.current = absOrientation
        }
    }, [absOrientation, updateOrientation])

    return (
        <>
        </>
    )
}

export default AbsoluteOrientationSensor