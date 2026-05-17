import { useSimulator } from "@/hooks/useSimulator";
import { HomeTheaterView } from "@/components/Demo/HomeTheaterView";
import { EventLog } from "@/components/Demo/EventLog";
import { simulator } from "@/demo/simulator";

export function DemoPanel() {
  const { state, events } = useSimulator();
  return (
    <div className="flex flex-col h-full p-4 bg-slate-900 text-slate-100 w-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 shrink-0">
        <h2 className="text-lg font-semibold text-slate-200 text-center w-full">Demo Mode</h2>
        <button
          onClick={() => simulator.reset()}
          className="px-3 py-1 text-sm bg-slate-700 hover:bg-slate-600 rounded text-slate-300 absolute right-4"
        >
          Reset
        </button>
      </div>

      {/* SVG schematic: relative container lets the absolutely-positioned SVG resolve 100% height */}
      <div className="flex-1 min-h-0 mb-3 relative">
        <HomeTheaterView state={state} events={events} />
      </div>

      {/* Event log: fixed height at bottom */}
      <div className="shrink-0 px-[15%]">
        <EventLog events={events} />
      </div>
    </div>
  );
}
