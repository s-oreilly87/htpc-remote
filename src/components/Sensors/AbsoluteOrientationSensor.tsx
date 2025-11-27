import { useEffect, useRef } from "react";
import { useAbsoluteOrientationSensor } from "@/utilities/sensors";

interface AbsoluteOrientationSensorProps {
  frequency: number;
  updateOrientation: (current: unknown, previous: unknown) => void;
}

const AbsoluteOrientationSensor = ({ frequency, updateOrientation }: AbsoluteOrientationSensorProps) => {
  const absOrientation = useAbsoluteOrientationSensor({ frequency: frequency });
  const prevAbsOrientation = useRef<unknown>(null);

  useEffect(() => {
    if (absOrientation) {
      updateOrientation(absOrientation, prevAbsOrientation.current);
      prevAbsOrientation.current = absOrientation;
    }
  }, [absOrientation, updateOrientation]);

  return <></>;
};

export default AbsoluteOrientationSensor;
