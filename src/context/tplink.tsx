import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  useMemo,
} from "react";

import { fetchTplinkInfo } from "@/utilities/http";
import { TPLINK_DEVICES } from "@/constants/smartHome";

export interface TplinkDeviceState {
  powerState: boolean;
  brightness?: number;
  error?: string;
}

export interface TplinkState {
  devices: Record<string, TplinkDeviceState>;
  loading: boolean;
}

export type TplinkContextValue = [
  TplinkState,
  (props: Record<string, TplinkDeviceState>) => void,
  (switchName: string) => Promise<void>,
  React.Dispatch<React.SetStateAction<TplinkState>>,
];

const DEFAULT_STATE: TplinkState = {
  devices: TPLINK_DEVICES.reduce<Record<string, TplinkDeviceState>>((devices, device) => {
    devices[device.id] = {
      powerState: false,
      ...(device.kind === "dimmer" ? { brightness: 50 } : {}),
    };
    return devices;
  }, {}),
  loading: false,
};

const Context = createContext<TplinkContextValue | undefined>(undefined);

export function TplinkProvider({ children }: { children: ReactNode }) {
  const [tplinkState, setTplinkState] = useState<TplinkState>(DEFAULT_STATE);

  const updateTplinkState = useCallback((props: Record<string, TplinkDeviceState>) => {
    setTplinkState((prevState) => ({
      ...prevState,
      devices: { ...prevState.devices, ...props },
    }));
  }, []);

  const refreshSwitchInfo = useCallback(async (switchName: string) => {
    setTplinkState((prevState) => ({ ...prevState, loading: true }));
    if (switchName === "all") {
      const ids = TPLINK_DEVICES.map((device) => device.id);
      const results = await Promise.all(ids.map((id) => fetchTplinkInfo(id).then((r) => ({ id, r }))));
      const patch: Record<string, TplinkDeviceState> = {};
      for (const { id, r } of results) {
        if (!r.error && r.data) patch[id] = r.data;
      }
      updateTplinkState(patch);
    } else {
      const result = await fetchTplinkInfo(switchName);
      if (result.error) {
        console.error(result.error);
      } else if (result.data) {
        updateTplinkState({ [switchName]: result.data });
      }
    }
    setTplinkState((prevState) => ({ ...prevState, loading: false }));
  }, [updateTplinkState]);

  const contextValue = useMemo<TplinkContextValue>(
    () => [tplinkState, updateTplinkState, refreshSwitchInfo, setTplinkState],
    [refreshSwitchInfo, tplinkState, updateTplinkState],
  );

  return <Context.Provider value={contextValue}>{children}</Context.Provider>;
}

export function useTplinkContext(): TplinkContextValue {
  const ctx = useContext(Context);
  if (!ctx) {
    throw new Error("useTplinkContext must be used within a TplinkProvider");
  }
  return ctx;
}
