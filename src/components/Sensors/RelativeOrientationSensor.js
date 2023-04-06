import {useEffect, useRef} from "react";
import {useRelativeOrientationSensor} from "@/utilities/sensors";


const RelativeOrientationSensor = ({frequency, updateOrientation}) => {

    // initialize relative orientation sensor
    const relOrientation = useRelativeOrientationSensor({frequency: frequency})
    const prevRelOrientation = useRef(null)

    useEffect(() => {
        if (relOrientation) {
            updateOrientation(relOrientation, prevRelOrientation.current)
            prevRelOrientation.current = relOrientation
        }
    }, [relOrientation?.quaternion[0], relOrientation?.quaternion[1], relOrientation?.quaternion[2], relOrientation?.quaternion[3]])

    return (
        <>
        </>
    )
}

export default RelativeOrientationSensor