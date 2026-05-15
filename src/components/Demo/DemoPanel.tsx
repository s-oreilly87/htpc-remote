import { useSimulator } from "@/hooks/useSimulator";
import { HomeTheaterView } from "@/components/Demo/HomeTheaterView";
import { EventLog } from "@/components/Demo/EventLog";
import { simulator } from "@/demo/simulator";

export function DemoPanel() {
  const { state, events } = useSimulator();
  return (
    <div className="flex flex-col gap-4 p-4 bg-slate-900 text-slate-100 w-full">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-200">Demo Mode</h2>
        <button
          onClick={() => simulator.reset()}
          className="px-3 py-1 text-sm bg-slate-700 hover:bg-slate-600 rounded text-slate-300"
        >
          Reset
        </button>
      </div>
      <HomeTheaterView state={state} events={events} />
      <EventLog events={events} />
    </div>
  );
}
