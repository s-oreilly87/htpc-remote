import { useSyncExternalStore } from "react";
import { simulator } from "@/demo/simulator";
import type { VirtualState, EventLogEntry } from "@/demo/types";

const getState = (): VirtualState => simulator.getState();
const getEvents = (): EventLogEntry[] => simulator.getEvents();
const subscribe = (fn: () => void): (() => void) => simulator.subscribe(fn);

export function useSimulator(): { state: VirtualState; events: EventLogEntry[] } {
  const state = useSyncExternalStore(subscribe, getState, getState);
  const events = useSyncExternalStore(subscribe, getEvents, getEvents);
  return { state, events };
}
