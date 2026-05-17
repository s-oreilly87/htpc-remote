import { useCallback } from "react";

import { useDenonContext } from "@/context/denon";
import { useRokuContext } from "@/context/roku";

export function useRokuCec() {
  const { rokuState, updateRokuState } = useRokuContext();
  const { updateDenonState } = useDenonContext();

  const setRokuPower = useCallback(
    (powerOn: boolean) => {
      updateRokuState({ powerOn });
      updateDenonState({ powerOn });
    },
    [updateDenonState, updateRokuState],
  );

  const toggleRokuPower = useCallback(() => {
    const powerOn = !rokuState.powerOn;
    setRokuPower(powerOn);
    return powerOn;
  }, [rokuState.powerOn, setRokuPower]);

  const wakeRoku = useCallback(() => {
    setRokuPower(true);
  }, [setRokuPower]);

  return { setRokuPower, toggleRokuPower, wakeRoku };
}
