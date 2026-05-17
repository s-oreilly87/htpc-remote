import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  useMemo,
} from "react";

import { fetchTplinkInfo } from "@/utilities/http";

export interface TplinkDeviceState {
  powerState: boolean;
  brightness?: number;
  error?: string;
}

export interface TplinkState {
  "yard-fence": TplinkDeviceState;
  "yard-dining": TplinkDeviceState;
  bedroom: TplinkDeviceState;
  stairway: TplinkDeviceState;
  basement: TplinkDeviceState;
  loading: boolean;
}

export type TplinkContextValue = [
  TplinkState,
  (props: Partial<TplinkState>) => void,
  (switchName: string) => Promise<void>,
  React.Dispatch<React.SetStateAction<TplinkState>>,
];

const DEFAULT_STATE: TplinkState = {
  "yard-fence": { powerState: false },
  "yard-dining": { powerState: false },
  bedroom:  { powerState: false },
  stairway: { powerState: false },
  basement: { powerState: false, brightness: 50 },
  loading: false,
};

const Context = createContext<TplinkContextValue | undefined>(undefined);

export function TplinkProvider({ children }: { children: ReactNode }) {
  const [tplinkState, setTplinkState] = useState<TplinkState>(DEFAULT_STATE);

  const updateTplinkState = useCallback((props: Partial<TplinkState>) => {
    setTplinkState((prevState) => ({ ...prevState, ...props }));
  }, []);

  const refreshSwitchInfo = useCallback(async (switchName: string) => {
    updateTplinkState({ loading: true });
    if (switchName === "all") {
      const ids = Object.keys(DEFAULT_STATE).filter((k) => k !== "loading");
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
    updateTplinkState({ loading: false });
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
