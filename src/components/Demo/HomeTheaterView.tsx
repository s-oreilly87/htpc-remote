import { useState, useEffect } from "react";
import type { VirtualState, EventLogEntry } from "@/demo/types";
import { DeviceTarget } from "@/demo/types";
import { AvrBox } from "@/components/Demo/devices/AvrBox";
import { RokuBox } from "@/components/Demo/devices/RokuBox";
import { TvBox } from "@/components/Demo/devices/TvBox";
import { HtpcBox } from "@/components/Demo/devices/HtpcBox";
import { SpeakerArray } from "@/components/Demo/devices/SpeakerArray";
import { LightStrip } from "@/components/Demo/devices/LightStrip";

const FLASH_DURATION_MS = 2000;

interface Props {
  state: VirtualState;
  events: EventLogEntry[];
}

export function HomeTheaterView({ state, events }: Props) {
  const [flashTarget, setFlashTarget] = useState<DeviceTarget | null>(null);

  // Trigger a 2-second flash on each new event rather than pulsing continuously.
  const latestEventId = events[0]?.id;
  const latestEventTarget = events[0]?.target;
  useEffect(() => {
    if (latestEventId === undefined) return;
    setFlashTarget(latestEventTarget ?? null);
    const timer = setTimeout(() => setFlashTarget(null), FLASH_DURATION_MS);
    return () => clearTimeout(timer);
  }, [latestEventId, latestEventTarget]);

  return (
    <svg
      viewBox="0 0 800 550"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid meet"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }}
    >
      <style>{`
        @keyframes pulse-stroke {
          0%, 100% { stroke-opacity: 1; }
          50% { stroke-opacity: 0.3; }
        }
        .line-recent {
          animation: pulse-stroke 0.8s ease-in-out infinite;
        }
      `}</style>

      {/* Background */}
      <rect width={800} height={550} fill="#1e293b" rx={12} />

      {/* Connection lines */}
      {/* Roku → AVR */}
      <line
        x1={210}
        y1={280}
        x2={275}
        y2={280}
        stroke="#6d28d9"
        strokeWidth={flashTarget === DeviceTarget.ROKU ? 3 : 1.5}
        strokeDasharray={flashTarget === DeviceTarget.ROKU ? "none" : "4 3"}
        className={flashTarget === DeviceTarget.ROKU ? "line-recent" : undefined}
      />

      {/* HTPC → AVR */}
      <line
        x1={590}
        y1={280}
        x2={525}
        y2={280}
        stroke="#2563eb"
        strokeWidth={flashTarget === DeviceTarget.HTPC ? 3 : 1.5}
        strokeDasharray={flashTarget === DeviceTarget.HTPC ? "none" : "4 3"}
        className={flashTarget === DeviceTarget.HTPC ? "line-recent" : undefined}
      />

      {/* AVR → TV */}
      <line
        x1={400}
        y1={220}
        x2={400}
        y2={190}
        stroke="#0d9488"
        strokeWidth={flashTarget === DeviceTarget.DENON ? 3 : 1.5}
        strokeDasharray={flashTarget === DeviceTarget.DENON ? "none" : "4 3"}
        className={flashTarget === DeviceTarget.DENON ? "line-recent" : undefined}
      />

      {/* Device boxes */}
      <TvBox
        denonState={state.denon}
        rokuState={state.roku}
        htpcState={state.htpc}
        x={250}
        y={10}
        width={300}
        height={180}
        isRecent={false}
      />

      <AvrBox
        state={state.denon}
        x={275}
        y={220}
        width={250}
        height={140}
        isRecent={flashTarget === DeviceTarget.DENON}
      />

      <RokuBox
        state={state.roku}
        x={30}
        y={220}
        width={180}
        height={140}
        isRecent={flashTarget === DeviceTarget.ROKU}
      />

      <HtpcBox
        state={state.htpc}
        x={590}
        y={220}
        width={180}
        height={140}
        isRecent={flashTarget === DeviceTarget.HTPC}
      />

      <SpeakerArray
        soundMode={state.denon.soundMode}
        powerOn={state.denon.powerOn}
        x={200}
        y={390}
        width={400}
        height={80}
      />

      <LightStrip
        state={state.tplink}
        x={30}
        y={390}
        width={170}
        height={80}
        isRecent={flashTarget === DeviceTarget.TPLINK}
      />
    </svg>
  );
}
