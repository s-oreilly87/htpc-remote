import { useEffect, useRef } from "react";
import {
  type OrientationReading,
  useAbsoluteOrientationSensor,
} from "@/utilities/sensors";

interface AbsoluteOrientationSensorProps {
  frequency: number;
  updateOrientation: (
    current: OrientationReading,
    previous: OrientationReading | null,
  ) => void;
}

const AbsoluteOrientationSensor = ({ frequency, updateOrientation }: AbsoluteOrientationSensorProps) => {
  const absOrientation = useAbsoluteOrientationSensor({ frequency: frequency });
  const prevAbsOrientation = useRef<OrientationReading | null>(null);

  useEffect(() => {
    if (absOrientation) {
      updateOrientation(absOrientation, prevAbsOrientation.current);
      prevAbsOrientation.current = absOrientation;
    }
  }, [absOrientation, updateOrientation]);

  return <></>;
};

export default AbsoluteOrientationSensor;
