import { useEffect, useRef } from "react";
import { useRelativeOrientationSensor } from "@/utilities/sensors";

interface RelativeOrientationSensorProps {
  frequency: number;
  updateOrientation: (current: unknown, previous: unknown) => void;
}

const RelativeOrientationSensor = ({ frequency, updateOrientation }: RelativeOrientationSensorProps) => {
  const relOrientation = useRelativeOrientationSensor({ frequency: frequency });
  const prevRelOrientation = useRef<unknown>(null);

  useEffect(() => {
    if (relOrientation) {
      updateOrientation(relOrientation, prevRelOrientation.current);
      prevRelOrientation.current = relOrientation;
    }
  }, [relOrientation, updateOrientation]);

  return <></>;
};

export default RelativeOrientationSensor;
