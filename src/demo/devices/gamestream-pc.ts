/**
 * GameStream PC sub-simulator.
 *
 * Simulates the Windows gaming PC that receives EventGhost events from the
 * HTPC (Linux). In the real setup the HTPC sends HTTP events to EventGhost
 * running on the GameStream PC to set display modes before Moonlight streaming.
 *
 * State: { displayMode }
 *
 * Only display-mode EventGhost commands mutate state; everything else is
 * fire-and-forget and just emits a log entry.
 */

import type { GameStreamPcSimState } from "@/demo/types";

// Human-readable labels for the EG display-mode event names.
const DISPLAY_MODE_LABELS: Record<string, string> = {
  displayDummy4K60: "4K 60Hz (HDR)",
  displayDummy1440p120: "1440p 120Hz (HDR)",
};

export class GameStreamPcSimulator {
  private state: GameStreamPcSimState;
  private readonly onMutate: (command: string, detail?: string) => void;

  constructor(
    initial: GameStreamPcSimState,
    onMutate: (command: string, detail?: string) => void,
  ) {
    this.state = { ...initial };
    this.onMutate = onMutate;
  }

  getState(): GameStreamPcSimState {
    return this.state;
  }

  reset(initial: GameStreamPcSimState): void {
    this.state = { ...initial };
  }

  /**
   * Receive an EventGhost event forwarded from the HTPC.
   * Display-mode commands update state; others are logged as-is.
   */
  receiveEventGhost(event: string): void {
    const label = DISPLAY_MODE_LABELS[event];
    if (label) {
      this.state = { ...this.state, displayMode: event };
      this.onMutate(`eg:${event}`, `Display set to ${label}`);
    } else {
      this.onMutate(`eg:${event}`);
    }
  }
}
