import {useRef} from "react";
import {
    useAbsoluteOrientationSensor,
    useAccelerometer,
    useGyroscope,
    useRelativeOrientationSensor
} from "@/utilities/sensors";

const SensorData = () => {
    // initialize sensors
    const acceleration = useAccelerometer({frequency: 30})
    const rotation = useGyroscope({frequency: 30})
    const absOrientation = useAbsoluteOrientationSensor({frequency: 30})
    const relOrientation = useRelativeOrientationSensor({frequency: 30})
    const prevRelOrientation = useRef(null)

    const dataDisplay = () => {
        return (
            <div className="absolute top-1/4 left-10 p-12 h-50 w-50 bg-yellow-100 z-40">
                {
                    acceleration ? (
                        <div>
                            <h5>Accelerometer</h5>
                            <ul>
                                <li>X: {acceleration.x}</li>
                                <li>Y: {acceleration.y}</li>
                                <li>Z: {acceleration.z}</li>
                            </ul>
                        </div>
                    ) : (
                        <h5>No Accelerometer</h5>)
                }

                {
                    rotation ? (
                        <div>
                            <h5>Gyroscope</h5>
                            <ul>
                                <li>X: {rotation.x}</li>
                                <li>Y: {rotation.y}</li>
                                <li>Z: {rotation.z}</li>
                            </ul>
                        </div>
                    ) : (
                        <h5>No Gyroscope</h5>)
                }

                {
                    absOrientation ? (
                        <div>
                            <h5>AbsoluteOrientation</h5>
                            <div>
                                <ul>
                                    <li>X: {absOrientation.quaternion[0]}</li>
                                    <li>Y: {absOrientation.quaternion[1]}</li>
                                    <li>Z: {absOrientation.quaternion[2]}</li>
                                    <li>W: {absOrientation.quaternion[3]}</li>
                                </ul>
                            </div>
                        </div>
                    ) : (
                        <p>No AbsoluteOrientationSensor</p>)
                }

                {
                    relOrientation ? (
                        <div>
                            <h5>RelativeOrientation</h5>
                            <div>
                                <ul>
                                    <li>X: {relOrientation.quaternion[0]}</li>
                                    <li>Y: {relOrientation.quaternion[1]}</li>
                                    <li>Z: {relOrientation.quaternion[2]}</li>
                                    <li>W: {relOrientation.quaternion[3]}</li>
                                </ul>
                            </div>
                        </div>
                    ) : (
                        <h5>No RelativeOrientationSensor</h5>)
                }
            </div>
        )
    }

    return (
        <div>
            {dataDisplay()}
        </div>
    )
}

export default SensorData