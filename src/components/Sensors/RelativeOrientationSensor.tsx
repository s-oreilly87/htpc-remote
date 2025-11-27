import { useEffect, useRef } from "react";
import {
  type OrientationReading,
  useRelativeOrientationSensor,
} from "@/utilities/sensors";

interface RelativeOrientationSensorProps {
  frequency: number;
  updateOrientation: (
    current: OrientationReading,
    previous: OrientationReading | null,
  ) => void;
}

const RelativeOrientationSensor = ({ frequency, updateOrientation }: RelativeOrientationSensorProps) => {
  const relOrientation = useRelativeOrientationSensor({ frequency: frequency });
  const prevRelOrientation = useRef<OrientationReading | null>(null);

  useEffect(() => {
    if (relOrientation) {
      updateOrientation(relOrientation, prevRelOrientation.current);
      prevRelOrientation.current = relOrientation;
    }
  }, [relOrientation, updateOrientation]);

  return <></>;
};

export default RelativeOrientationSensor;
