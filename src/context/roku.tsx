import { createContext, useCallback, useContext, useMemo, ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { RokuState } from "@/types/remote";
import { ROKU_QUERY_KEY, fetchRokuState } from "@/lib/roku-query";

const ROKU_STATE_DEFAULTS: RokuState = {
  powerOn: false,
};

export type RokuContextValue = {
  rokuState: RokuState;
  isLoading: boolean;
  updateRokuState: (updates: Partial<RokuState>) => void;
  invalidateRokuState: () => Promise<void>;
};

const Context = createContext<RokuContextValue | undefined>(undefined);

export function RokuProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ROKU_QUERY_KEY,
    queryFn: fetchRokuState,
    staleTime: 30_000,
    refetchInterval: 2 * 60_000,
    retry: 1,
    retryDelay: 1000,
  });

  const rokuState = data ?? ROKU_STATE_DEFAULTS;

  const updateRokuState = useCallback(
    (updates: Partial<RokuState>) => {
      queryClient.setQueryData<RokuState>(ROKU_QUERY_KEY, (prev) => ({
        ...(prev ?? ROKU_STATE_DEFAULTS),
        ...updates,
      }));
    },
    [queryClient],
  );

  const invalidateRokuState = useCallback(
    () => queryClient.invalidateQueries({ queryKey: ROKU_QUERY_KEY }),
    [queryClient],
  );

  const contextValue = useMemo<RokuContextValue>(
    () => ({ rokuState, isLoading, updateRokuState, invalidateRokuState }),
    [rokuState, isLoading, updateRokuState, invalidateRokuState],
  );

  return <Context.Provider value={contextValue}>{children}</Context.Provider>;
}

export function useRokuContext(): RokuContextValue {
  const ctx = useContext(Context);
  if (!ctx) {
    throw new Error("useRokuContext must be used within a RokuProvider");
  }
  return ctx;
}
