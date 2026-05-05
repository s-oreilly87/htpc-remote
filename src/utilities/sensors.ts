import { useEffect, useState } from "react";

export type Quaternion = [number, number, number, number] | Float32Array;

export interface SensorConfig {
  frequency?: number;
}

interface SensorErrorEvent extends Event {
  error: DOMException;
}

interface SensorWithControls extends EventTarget {
  start: () => void;
  stop: () => void;
  addEventListener(
    type: "reading",
    listener: (event: any) => void,
    options?: boolean | AddEventListenerOptions,
  ): void;
  addEventListener(
    type: "error",
    listener: (event: SensorErrorEvent) => void,
    options?: boolean | AddEventListenerOptions,
  ): void;
}

interface OrientationSensor extends SensorWithControls {
  quaternion: Quaternion;
}

interface AccelerometerSensor extends SensorWithControls {
  x: number;
  y: number;
  z: number;
  acceleration?: {
    x: number;
    y: number;
    z: number;
  };
}

interface GyroscopeSensor extends SensorWithControls {
  x: number;
  y: number;
  z: number;
}

declare global {
  interface Window {
    AbsoluteOrientationSensor: new (config?: SensorConfig) => OrientationSensor;
    RelativeOrientationSensor: new (config?: SensorConfig) => OrientationSensor;
    Accelerometer: new (config?: SensorConfig) => AccelerometerSensor;
    Gyroscope: new (config?: SensorConfig) => GyroscopeSensor;
  }
}

export interface OrientationReading {
  quaternion: Quaternion;
}

interface RotationReading {
  x: number;
  y: number;
  z: number;
}

interface AccelerationReading {
  x: number;
  y: number;
  z: number;
}

export function useAbsoluteOrientationSensor(
  { frequency }: SensorConfig = {},
  callback?: (quaternion: Quaternion) => void,
) {
  const [absOrientation, setAbsOrientation] = useState<OrientationReading | null>(
    null,
  );

  useEffect(() => {
    if ("AbsoluteOrientationSensor" in window) {
      const sensor = new window.AbsoluteOrientationSensor({
        frequency,
      });
      sensor.start();
      sensor.addEventListener("reading", () => {
        setAbsOrientation({ quaternion: sensor.quaternion });

        if (callback instanceof Function) {
          callback(sensor.quaternion);
        }
      });

      sensor.addEventListener("error", (event) => {
        console.log(event.error.name, event.error.message);
        setAbsOrientation(null);
      });

      return () => {
        sensor.stop();
      };
    } else {
      console.log("AbsoluteOrientationSensor not supported");
    }
  }, [frequency, callback]);

  return absOrientation;
}

export function useRelativeOrientationSensor(
  { frequency }: SensorConfig = {},
  callback?: (sensor: OrientationSensor) => void,
) {
  const [relOrientation, setRelOrientation] = useState<OrientationReading | null>(
    {
      quaternion: [0, 0, 0, 0],
    },
  );

  useEffect(() => {
    if (typeof window.RelativeOrientationSensor === "function") {
      const sensor = new window.RelativeOrientationSensor({
        frequency,
      });
      sensor.start();
      sensor.addEventListener("reading", () => {
        setRelOrientation({ quaternion: sensor.quaternion });

        if (callback instanceof Function) {
          callback(sensor);
        }
      });

      sensor.addEventListener("error", (event) => {
        console.log(event.error.name, event.error.message);
        setRelOrientation(null);
      });

      return () => {
        sensor.stop();
      };
    } else {
      console.log("RelativeOrientationSensor not supported");
    }
  }, [frequency, callback]);

  return relOrientation;
}

export function useAccelerometer(
  { frequency }: SensorConfig = {},
  callback?: (acceleration?: AccelerationReading) => void,
) {
  const [acceleration, setAcceleration] = useState<AccelerationReading | null>(
    null,
  );

  useEffect(() => {
    if ("Accelerometer" in window) {
      const sensor = new window.Accelerometer({
        frequency,
      });
      sensor.start();
      sensor.addEventListener("reading", () => {
        setAcceleration({
          x: sensor.x,
          y: sensor.y,
          z: sensor.z,
        });

        if (callback instanceof Function) {
          callback(sensor.acceleration);
        }
      });

      sensor.addEventListener("error", (event) => {
        console.log(event.error.name, event.error.message);
        setAcceleration(null);
      });

      return () => {
        sensor.stop();
      };
    } else {
      console.log("Accelerometer not supported");
    }
  }, [frequency, callback]);

  return acceleration;
}

export function useGyroscope(
  { frequency }: SensorConfig = {},
  callback?: (rotation: RotationReading) => void,
) {
  const [rotation, setRotation] = useState<RotationReading | null>(null);

  useEffect(() => {
    if ("Gyroscope" in window) {
      const sensor = new window.Gyroscope({
        frequency,
      });
      sensor.start();
      sensor.addEventListener("reading", () => {
        const currentRotation = {
          x: sensor.x,
          y: sensor.y,
          z: sensor.z,
        };

        setRotation(currentRotation);

        if (callback instanceof Function) {
          callback(currentRotation);
        }
      });

      sensor.addEventListener("error", (event) => {
        console.log(event.error.name, event.error.message);
        setRotation(null);
      });

      return () => {
        sensor.stop();
      };
    } else {
      console.log("Gyroscope not supported");
    }
  }, [frequency, callback]);

  return rotation;
}

export function hasRelativeOrientationSensor() {
  let relOrientationSensor: OrientationSensor | null = null;
  try {
    if (typeof window.RelativeOrientationSensor !== "function") {
      return false;
    }

    relOrientationSensor = new window.RelativeOrientationSensor({
      frequency: 10,
    });
    relOrientationSensor.addEventListener("error", (event: SensorErrorEvent) => {
      // Handle runtime errors.
      if (event.error.name === "NotAllowedError") {
        console.log("Permission to access sensor was denied.");
      } else if (event.error.name === "NotReadableError") {
        console.log("Cannot connect to the sensor.");
      }
      return false;
    });
    relOrientationSensor.addEventListener("reading", (event) => {
      console.log(event);
    });
    relOrientationSensor.start();
    relOrientationSensor.stop();
    return true;
  } catch (error) {
    // Handle construction errors.
    if (error instanceof DOMException && error.name === "SecurityError") {
      console.log("Sensor construction was blocked by the Permissions Policy.");
    } else if (error instanceof ReferenceError) {
      console.log("Sensor is not supported by the User Agent.");
    } else {
      throw error;
    }
    return false;
  }
}

export function hasAWorkingRelativeOrientationSensor() {
  let relOrientation: OrientationReading | null;
  if (typeof window.RelativeOrientationSensor === "function") {
    const sensor = new window.RelativeOrientationSensor({
      frequency: 5,
    });
    sensor.start();

    sensor.addEventListener("reading", () => {
      relOrientation = { quaternion: sensor.quaternion };
    });

    sensor.addEventListener("error", (event) => {
      console.log(event.error.name, event.error.message);
      relOrientation = null;
    });

    sensor.stop();
  } else {
    console.log("RelativeOrientationSensor not supported");
    relOrientation = null;
  }

  return relOrientation;
}
