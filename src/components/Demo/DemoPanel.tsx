import { useSimulator } from "@/hooks/useSimulator";
import { HomeTheaterView } from "@/components/Demo/HomeTheaterView";
import { EventLog } from "@/components/Demo/EventLog";
import { simulator } from "@/demo/simulator";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleInfo } from "@fortawesome/free-solid-svg-icons";
import { DemoModeWelcomeInfoModal } from "@/components/Demo/DemoModeWelcomeInfoModal";
import { DENON_STATE_DEFAULTS, useDenonContext } from "@/context/denon";
import { ROKU_STATE_DEFAULTS, useRokuContext } from "@/context/roku";
import { TPLINK_STATE_DEFAULTS, useTplinkContext } from "@/context/tplink";

export function DemoPanel() {
  const { state, events } = useSimulator();
  const [isInfoOpen, setIsInfoOpen] = useState(true);
  const { updateDenonState } = useDenonContext();
  const { updateRokuState } = useRokuContext();
  const [, , , setTplinkState] = useTplinkContext();

  const resetDemo = () => {
    simulator.reset();
    updateDenonState(DENON_STATE_DEFAULTS);
    updateRokuState(ROKU_STATE_DEFAULTS);
    setTplinkState(TPLINK_STATE_DEFAULTS);
  };

  return (
    <div className="flex flex-col h-full p-4 bg-slate-900 text-slate-100 w-full overflow-hidden border-l-4 border-slate-950">
      <DemoModeWelcomeInfoModal isOpen={isInfoOpen} setIsOpen={setIsInfoOpen} />

      {/* Header */}
      <div className="relative flex items-center justify-around mb-3 shrink-0">
        <h2 className="fixed text-lg font-semibold text-slate-200 text-center">Demo Mode</h2>
        <button
          type="button"
          onClick={() => setIsInfoOpen(true)}
          className="flex h-8 w-8 items-center translate-x-16 justify-center rounded-full border border-slate-600 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
          aria-label="Open demo mode information"
          title="Demo mode information"
        >
          <FontAwesomeIcon icon={faCircleInfo} />
        </button>
        <button
          onClick={resetDemo}
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
