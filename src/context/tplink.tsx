import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  useMemo,
} from "react";

export interface TplinkDeviceState {
  powerState: boolean;
  brightness?: number;
  error?: string;
}

export interface TplinkState {
  "yard-fence": TplinkDeviceState;
  "yard-dining": TplinkDeviceState;
  basement?: TplinkDeviceState;
  loading: boolean;
}

export type TplinkContextValue = [
  TplinkState,
  (props: Partial<TplinkState>) => void,
  (switchName: string) => Promise<void>,
  React.Dispatch<React.SetStateAction<TplinkState>>,
];

const DEFAULT_STATE: TplinkState = {
  "yard-fence": {
    powerState: false,
  },
  "yard-dining": {
    powerState: false,
  },
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
    const response = await fetch(`api/tp-link/info/${switchName}`);
    if (200 !== response.status) {
      console.error(response.statusText);
      return;
    }
    updateTplinkState(await response.json());
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
