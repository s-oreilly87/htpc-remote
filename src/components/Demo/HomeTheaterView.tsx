import { useState, useEffect } from "react";
import type { VirtualState, EventLogEntry } from "@/demo/types";
import { DeviceTarget } from "@/demo/types";
import { AvrBox } from "@/components/Demo/devices/AvrBox";
import { RokuBox } from "@/components/Demo/devices/RokuBox";
import { TvBox } from "@/components/Demo/devices/TvBox";
import { HtpcBox } from "@/components/Demo/devices/HtpcBox";
import { GameStreamPcBox } from "@/components/Demo/devices/GameStreamPcBox";
import { SpeakerArray } from "@/components/Demo/devices/SpeakerArray";
import { LightStrip } from "@/components/Demo/devices/LightStrip";

const FLASH_DURATION_MS = 2000;

// ── Layout (viewBox 800×560) ──────────────────────────────────────────────────
//
// Row 1  y=16   LightStrip — x=32, w=736
// Row 2  y=94   Roku | AVR (centered at x=400) | HTPC  — equal widths (200px), equal gaps (92px)
// Row 3  y=280  GameStreamPcBox (right, x=592) | TV 16:9 (center, x=260) — same y
// Row 4  y=467  SpeakerArray — same width+x as TV
//
// Connection lines:
//   Roku right  → AVR left     (horizontal, pulses on ROKU)
//   HTPC left   → AVR right    (horizontal, pulses on HTPC)
//   GS PC top-center → HTPC bottom-center  (vertical, pulses on GAMESTREAM_PC)
//   AVR bottom-center → TV top-center      (vertical, pulses on DENON)

const L = {
  lights:   { x: 32,  y: 16,  width: 736, height: 50  },
  // 3 equal boxes × 200px + 2 gaps × 92px = 600 + 184 = 784px ✓
  roku:     { x: 8,   y: 94,  width: 200, height: 132 },
  avr:      { x: 300, y: 94,  width: 200, height: 132 },  // center at x=400
  htpc:     { x: 592, y: 94,  width: 200, height: 132 },
  gspc:     { x: 592, y: 280, width: 200, height: 90  },  // same x/w as HTPC
  tv:       { x: 260, y: 280, width: 280, height: 157 },  // 280/157 ≈ 16:9, center x=400
  speakers: { x: 260, y: 467, width: 280, height: 54  },
} as const;

// Computed anchor points for connection lines
const LINES = {
  rokuRight:    L.roku.x + L.roku.width,                  // 208
  avrLeft:      L.avr.x,                                  // 300
  avrRight:     L.avr.x + L.avr.width,                    // 500
  htpcLeft:     L.htpc.x,                                  // 592
  rowMidY:      L.roku.y + L.roku.height / 2,             // 160
  htpcBottom:   L.htpc.y + L.htpc.height,                 // 226
  gspcTop:      L.gspc.y,                                  // 280
  htpcCenterX:  L.htpc.x + L.htpc.width / 2,             // 692
  avrCenterX:   L.avr.x + L.avr.width / 2,               // 400
  avrBottom:    L.avr.y + L.avr.height,                   // 226
  tvTop:        L.tv.y,                                    // 280
} as const;

// ── Tooltip overlay ────────────────────────────────────────────────────────────
const TOOLTIP = { x: 80, y: 188, width: 640, height: 96, pad: 14 } as const;

interface TooltipOverlayProps {
  text: string;
  onDismiss: () => void;
}

function TooltipOverlay({ text, onDismiss }: TooltipOverlayProps) {
  return (
    <g>
      {/* Full-SVG dismiss target */}
      <rect width={800} height={560} fill="transparent" onClick={onDismiss} style={{ cursor: "default" }} />
      {/* Card */}
      <rect
        x={TOOLTIP.x} y={TOOLTIP.y}
        width={TOOLTIP.width} height={TOOLTIP.height}
        rx={10} fill="#0f172a" stroke="#475569" strokeWidth={1.5}
      />
      <foreignObject
        x={TOOLTIP.x + TOOLTIP.pad} y={TOOLTIP.y + TOOLTIP.pad}
        width={TOOLTIP.width - TOOLTIP.pad * 2}
        height={TOOLTIP.height - TOOLTIP.pad * 2}
      >
        {/* @ts-expect-error: xmlns required on foreignObject content root */}
        <div xmlns="http://www.w3.org/1999/xhtml" style={{
          color: "#cbd5e1",
          fontSize: "12px",
          lineHeight: "1.6",
          fontFamily: "system-ui, sans-serif",
        }}>
          {text}
        </div>
      </foreignObject>
    </g>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

interface Props {
  state: VirtualState;
  events: EventLogEntry[];
}

export function HomeTheaterView({ state, events }: Props) {
  const [flashTarget, setFlashTarget] = useState<DeviceTarget | null>(null);
  const [tooltipText, setTooltipText] = useState<string | null>(null);

  const latestEventId = events[0]?.id;
  const latestEventTarget = events[0]?.target;
  useEffect(() => {
    if (latestEventId === undefined) return;
    setFlashTarget(latestEventTarget ?? null);
    const timer = setTimeout(() => setFlashTarget(null), FLASH_DURATION_MS);
    return () => clearTimeout(timer);
  }, [latestEventId, latestEventTarget]);

  const isFlash = (t: DeviceTarget) => flashTarget === t;

  const lineProps = (t: DeviceTarget) => ({
    stroke: TARGET_STROKE[t],
    strokeWidth: isFlash(t) ? 3 : 1.5,
    strokeDasharray: isFlash(t) ? "none" : "4 3",
    className: isFlash(t) ? "line-recent" : undefined,
  });

  const showInfo = (text: string) =>
    setTooltipText(prev => (prev === text ? null : text));

  return (
    <svg
      viewBox="0 0 800 560"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid meet"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }}
    >
      <style>{`
        @keyframes pulse-stroke {
          0%, 100% { stroke-opacity: 1; }
          50% { stroke-opacity: 0.3; }
        }
        .line-recent { animation: pulse-stroke 0.8s ease-in-out infinite; }
      `}</style>

      {/* Background */}
      <rect width={800} height={560} fill="#1e293b" rx={12} />

      {/* ── Connection lines (drawn behind boxes) ────────────────────────── */}

      {/* Roku → AVR (HDMI ARC) */}
      <line
        x1={LINES.rokuRight} y1={LINES.rowMidY}
        x2={LINES.avrLeft}   y2={LINES.rowMidY}
        {...lineProps(DeviceTarget.ROKU)}
      />

      {/* HTPC → AVR (HDMI in) */}
      <line
        x1={LINES.htpcLeft}  y1={LINES.rowMidY}
        x2={LINES.avrRight}  y2={LINES.rowMidY}
        {...lineProps(DeviceTarget.HTPC)}
      />

      {/* GS PC → HTPC (Moonlight stream) */}
      <line
        x1={LINES.htpcCenterX} y1={LINES.htpcBottom}
        x2={LINES.htpcCenterX} y2={LINES.gspcTop}
        {...lineProps(DeviceTarget.GAMESTREAM_PC)}
      />

      {/* AVR → TV (HDMI ARC — main output path) */}
      <line
        x1={LINES.avrCenterX} y1={LINES.avrBottom}
        x2={LINES.avrCenterX} y2={LINES.tvTop}
        {...lineProps(DeviceTarget.DENON)}
      />

      {/* ── Device boxes ─────────────────────────────────────────────────── */}

      <LightStrip
        state={state.tplink}
        {...L.lights}
        isRecent={isFlash(DeviceTarget.TPLINK)}
        onInfo={showInfo}
      />

      <RokuBox
        state={state.roku}
        {...L.roku}
        isRecent={isFlash(DeviceTarget.ROKU)}
        onInfo={showInfo}
      />

      <AvrBox
        state={state.denon}
        {...L.avr}
        isRecent={isFlash(DeviceTarget.DENON)}
        onInfo={showInfo}
      />

      <HtpcBox
        state={state.htpc}
        {...L.htpc}
        isRecent={isFlash(DeviceTarget.HTPC)}
        onInfo={showInfo}
      />

      <GameStreamPcBox
        state={state.gamestreamPc}
        {...L.gspc}
        isRecent={isFlash(DeviceTarget.GAMESTREAM_PC)}
        onInfo={showInfo}
      />

      <TvBox
        denonState={state.denon}
        rokuState={state.roku}
        htpcState={state.htpc}
        {...L.tv}
        onInfo={showInfo}
      />

      <SpeakerArray
        soundMode={state.denon.soundMode}
        powerOn={state.denon.powerOn}
        {...L.speakers}
        onInfo={showInfo}
      />

      {/* ── Tooltip overlay (rendered last = always on top) ──────────────── */}
      {tooltipText && (
        <TooltipOverlay text={tooltipText} onDismiss={() => setTooltipText(null)} />
      )}
    </svg>
  );
}

const TARGET_STROKE: Record<DeviceTarget, string> = {
  [DeviceTarget.DENON]: "#0d9488",
  [DeviceTarget.ROKU]: "#6d28d9",
  [DeviceTarget.HTPC]: "#2563eb",
  [DeviceTarget.GAMESTREAM_PC]: "#7c3aed",
  [DeviceTarget.TPLINK]: "#f59e0b",
};
