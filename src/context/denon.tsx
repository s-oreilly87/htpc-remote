import { createContext, useCallback, useContext, useMemo, ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DENON_SOUND_MODES } from "@/constants/denon";
import type { DenonState } from "@/types/remote";
import { DENON_QUERY_KEY, fetchDenonState, parseDialogueAdjustLevel } from "@/lib/denon-query";

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
  /** Patch the cached state immediately (optimistic update).
   *  Accepts either a plain partial or a functional updater — the latter is
   *  useful when the new value depends on the current one (e.g. incrementing MV). */
  updateDenonState: (updates: Partial<DenonState> | ((prev: DenonState) => Partial<DenonState>)) => void;
  invalidateDenonState: () => Promise<void>;
};

const Context = createContext<DenonContextValue | undefined>(undefined);

export function DenonProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: DENON_QUERY_KEY,
    queryFn: fetchDenonState,
    staleTime: 30_000,
    refetchInterval: 60_000,
    // One retry on failure: helps recover from a transient hiccup on first
    // load without hammering a struggling telnet queue. Background refetch
    // failures fall through to the next refetchInterval tick naturally.
    retry: 1,
    retryDelay: 1000,
  });

  const denonState = data ?? DENON_STATE_DEFAULTS;

  // Optimistic local update — patches the cached value immediately so the UI
  // reflects user actions before the next background sync.
  const updateDenonState = useCallback(
    (updates: Partial<DenonState> | ((prev: DenonState) => Partial<DenonState>)) => {
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
    () => ({ denonState, isLoading, updateDenonState, invalidateDenonState }),
    [denonState, isLoading, updateDenonState, invalidateDenonState],
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
