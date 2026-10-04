import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DENON_SOUND_MODES } from "@/constants/denon";
import type { DenonState } from "@/types/remote";
import {
  DENON_QUERY_KEY,
  fetchDenonState,
  fetchDenonAdvancedState,
  parseDialogueAdjustLevel,
} from "@/lib/denon-query";

import { sendDenonCommand } from "@/utilities/http";
import { KEYSTROKE } from "@/constants/remotes";

export { parseDialogueAdjustLevel };

export const DENON_STATE_DEFAULTS: DenonState = {
  powerOn: false,
  muteOn: false,
  input: null,
  soundMode: DENON_SOUND_MODES.NONE,
  dynComp: "",
  psDilOn: false,
  psDynEqOn: false,
  MV: 50.0,
  PSDIL: 0,
  PSREFLEV: "0",
  PSDYNVOL: "OFF",
};

export type DenonContextValue = {
  denonState: DenonState;
  /** True only on the very first fetch (no cached data yet). Use this for
   *  spinners and disabled states — background refetch polls are silent. */
  isLoading: boolean;
  isPowerPending: boolean;
  togglePower: () => Promise<void>;
  /** Patch the cached state immediately (optimistic update).
   *  Accepts either a plain partial or a functional updater — the latter is
   *  useful when the new value depends on the current one (e.g. incrementing MV). */
  updateDenonState: (
    updates: Partial<DenonState> | ((prev: DenonState) => Partial<DenonState>),
  ) => void;
  invalidateDenonState: () => Promise<void>;
};

const Context = createContext<DenonContextValue | undefined>(undefined);

interface DenonProviderProps {
  children: ReactNode;
}

export function DenonProvider({ children }: DenonProviderProps) {
  const queryClient = useQueryClient();
  const powerPending = useRef(false);
  const [isPowerPending, setIsPowerPending] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: DENON_QUERY_KEY,
    queryFn: async ({ signal }) => {
      const state = await fetchDenonState(
        queryClient.getQueryData<DenonState>(DENON_QUERY_KEY) ??
          DENON_STATE_DEFAULTS,
        signal,
      );
      const latest =
        queryClient.getQueryData<DenonState>(DENON_QUERY_KEY) ??
        DENON_STATE_DEFAULTS;
      return {
        ...latest,
        powerOn: state.powerOn,
        muteOn: state.muteOn,
        input: state.input,
        soundMode: state.soundMode,
      };
    },
    enabled: !isPowerPending,
    staleTime: 5_000,
    refetchInterval: 10_000,
    // One retry on failure: helps recover from a transient hiccup on first
    // load without hammering a struggling telnet queue. Background refetch
    // failures fall through to the next refetchInterval tick naturally.
    retry: 1,
    retryDelay: 1000,
  });

  const denonState = data ?? DENON_STATE_DEFAULTS;

  useEffect(() => {
    if (!denonState.powerOn) {
      void queryClient.cancelQueries({
        queryKey: [...DENON_QUERY_KEY, "advanced"],
        exact: true,
      });
    }
  }, [denonState.powerOn, queryClient]);

  useQuery({
    queryKey: [...DENON_QUERY_KEY, "advanced"],
    enabled: denonState.powerOn && !isPowerPending,
    queryFn: async ({ signal }) => {
      const patch = await fetchDenonAdvancedState(signal);
      if (!signal.aborted && !powerPending.current) {
        queryClient.setQueryData<DenonState>(DENON_QUERY_KEY, (previous) => ({
          ...(previous ?? DENON_STATE_DEFAULTS),
          ...patch,
        }));
      }
      return patch;
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
    retry: false,
  });

  const togglePower = useCallback(async () => {
    if (powerPending.current) return;
    powerPending.current = true;
    setIsPowerPending(true);
    await queryClient.cancelQueries({ queryKey: DENON_QUERY_KEY });
    try {
      const response = await sendDenonCommand({ value: KEYSTROKE.DENON.POWER });
      if (response.error || typeof response.data !== "boolean") {
        console.error(response.error ?? "Denon: missing power confirmation");
      } else {
        const powerOn = response.data;
        queryClient.setQueryData<DenonState>(DENON_QUERY_KEY, (previous) => ({
          ...(previous ?? DENON_STATE_DEFAULTS),
          powerOn,
        }));
      }
    } finally {
      powerPending.current = false;
      setIsPowerPending(false);
      // Also resync on failure: a write may have reached the AVR before disconnect.
      await queryClient.invalidateQueries({
        queryKey: DENON_QUERY_KEY,
        exact: true,
      });
    }
  }, [queryClient]);

  // Optimistic local update — patches the cached value immediately so the UI
  // reflects user actions before the next background sync.
  const updateDenonState = useCallback(
    (
      updates:
        | Partial<DenonState>
        | ((prev: DenonState) => Partial<DenonState>),
    ) => {
      queryClient.setQueryData<DenonState>(DENON_QUERY_KEY, (prev) => {
        const base = prev ?? DENON_STATE_DEFAULTS;
        const patch = typeof updates === "function" ? updates(base) : updates;
        return { ...base, ...patch };
      });
    },
    [queryClient],
  );

  // Triggers a fresh fetch, e.g. after sending a command to the AVR.
  const invalidateDenonState = useCallback(
    () => queryClient.invalidateQueries({ queryKey: DENON_QUERY_KEY }),
    [queryClient],
  );

  const contextValue = useMemo<DenonContextValue>(
    () => ({
      denonState,
      isLoading,
      isPowerPending,
      togglePower,
      updateDenonState,
      invalidateDenonState,
    }),
    [
      denonState,
      isLoading,
      isPowerPending,
      togglePower,
      updateDenonState,
      invalidateDenonState,
    ],
  );

  return <Context.Provider value={contextValue}>{children}</Context.Provider>;
}

export function useDenonContext(): DenonContextValue {
  const ctx = useContext(Context);
  if (!ctx) {
    throw new Error("useDenonContext must be used within a DenonProvider");
  }
  return ctx;
}
