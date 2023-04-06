import {useEffect, useState} from "react";

export function useAbsoluteOrientationSensor({frequency} = {}, callback) {
    const [absOrientation, setAbsOrientation] = useState(null);

    useEffect(() => {
        if ('AbsoluteOrientationSensor' in window) {
            const sensor = new window.AbsoluteOrientationSensor({
                frequency
            });
            sensor.start();
            sensor.addEventListener('reading', () => {
                setAbsOrientation({quaternion: sensor.quaternion});

                if (callback instanceof Function) {
                    callback(sensor.quaternion);
                }
            });

            sensor.addEventListener('error', event => {
                console.log(event.error.name, event.error.message);
                setAbsOrientation(null);
            });

            return () => {
                sensor.stop();
            };
        } else {
            console.log('AbsoluteOrientationSensor not supported');
        }
    }, [frequency, callback]);

    return absOrientation;
}

export function useRelativeOrientationSensor({frequency} = {}, callback) {
    const [relOrientation, setRelOrientation] = useState({quaternion: [0, 0, 0, 0]});

    useEffect(() => {
        if ('RelativeOrientationSensor' in window) {
            const sensor = new window.RelativeOrientationSensor({
                frequency
            });
            sensor.start();
            sensor.addEventListener('reading', () => {
                setRelOrientation({quaternion: sensor.quaternion});

                if (callback instanceof Function) {
                    callback(sensor);
                }
            });

            sensor.addEventListener('error', event => {
                console.log(event.error.name, event.error.message);
                setRelOrientation(null);
            });

            return () => {
                sensor.stop();
            };
        } else {
            console.log('RelativeOrientationSensor not supported');
        }
    }, [frequency, callback]);

    return relOrientation;
}

export function useAccelerometer({frequency} = {}, callback) {
    const [acceleration, setAcceleration] = useState(null);

    useEffect(() => {
        if ('Accelerometer' in window) {
            const sensor = new window.Accelerometer({
                frequency
            });
            sensor.start();
            sensor.addEventListener('reading', () => {
                setAcceleration({
                    x: sensor.x,
                    y: sensor.y,
                    z: sensor.z
                });

                if (callback instanceof Function) {
                    callback(sensor.acceleration);
                }
            });

            sensor.addEventListener('error', event => {
                console.log(event.error.name, event.error.message);
                setAcceleration(null);
            });

            return () => {
                sensor.stop();
            };
        } else {
            console.log('Accelerometer not supported');
        }
    }, [frequency, callback]);

    return acceleration;
}

export function useGyroscope({frequency} = {}, callback) {
    const [rotation, setRotation] = useState(null);

    useEffect(() => {
        if ('Gyroscope' in window) {
            const sensor = new window.Gyroscope({
                frequency
            });
            sensor.start();
            sensor.addEventListener('reading', () => {
                setRotation({
                    x: sensor.x,
                    y: sensor.y,
                    z: sensor.z
                });

                if (callback instanceof Function) {
                    callback(sensor.quaternion);
                }
            });

            sensor.addEventListener('error', event => {
                console.log(event.error.name, event.error.message);
                setRotation(null);
            });

            return () => {
                sensor.stop();
            };
        } else {
            console.log('Gyroscope not supported');
        }
    }, [frequency, callback]);

    return rotation;
}


export function hasRelativeOrientationSensor() {
    let relOrientationSensor = null;
    try {
        relOrientationSensor = new RelativeOrientationSensor({ frequency: 10 });
        relOrientationSensor.onerror = (event) => {
            // Handle runtime errors.
            if (event.error.name === 'NotAllowedError') {
                console.log('Permission to access sensor was denied.');
            } else if (event.error.name === 'NotReadableError') {
                console.log('Cannot connect to the sensor.');
            }
            return false
        };
        relOrientationSensor.onreading = (e) => {
            console.log(e);
        };
        relOrientationSensor.start();
        relOrientationSensor.stop()
        return true
    } catch (error) {
        // Handle construction errors.
        if (error.name === 'SecurityError') {
            console.log('Sensor construction was blocked by the Permissions Policy.');
        } else if (error.name === 'ReferenceError') {
            console.log('Sensor is not supported by the User Agent.');
        } else {
            throw error;
        }
        return false
    }
}

export function hasAWorkingRelativeOrientationSensor() {
    let relOrientation
    if ('RelativeOrientationSensor' in window) {
        const sensor = new window.RelativeOrientationSensor({
            frequency: 5
        });
        sensor.start();

        sensor.addEventListener('reading', () => {
            relOrientation = {quaternion: sensor.quaternion};
        });

        sensor.addEventListener('error', event => {
            console.log(event.error.name, event.error.message);
            relOrientation = null;
        });

        sensor.stop();
    } else {
        console.log('RelativeOrientationSensor not supported');
        relOrientation = null
    }

    return relOrientation;
}