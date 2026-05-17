import type { DenonSimState } from "@/demo/types";

const TEAL = "#0d9488";
const CARD_BG = "#0f172a";
const TEXT = "#f1f5f9";
const TEXT_MUTED = "#94a3b8";
const GREEN = "#22c55e";
const GRAY = "#475569";

interface Props {
  state: DenonSimState;
  x: number;
  y: number;
  width: number;
  height: number;
  isRecent: boolean;
}

export function AvrBox({ state, x, y, width, height, isRecent }: Props) {
  const volumePct = state.MV !== undefined ? (state.MV / 98) * 100 : 0;
  const barWidth = (width - 24) * (volumePct / 100);

  return (
    <g>
      <title>Denon AVR — queries via Telnet (port 23), commands via HTTP (port 80)</title>
      {/* Card background */}
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={8}
        fill={CARD_BG}
        stroke={isRecent ? TEAL : "#1e293b"}
        strokeWidth={isRecent ? 2 : 1}
        className={isRecent ? "line-recent" : undefined}
      />

      {/* Header bar */}
      <rect x={x} y={y} width={width} height={28} rx={8} fill={TEAL} />
      <rect x={x} y={y + 20} width={width} height={8} fill={TEAL} />

      {/* Title */}
      <text
        x={x + width / 2}
        y={y + 14}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={TEXT}
        fontSize={12}
        fontWeight="bold"
      >
        Denon AVR
      </text>

      {/* Power indicator */}
      <circle
        cx={x + width - 14}
        cy={y + 14}
        r={5}
        fill={state.powerOn ? GREEN : GRAY}
      />

      {/* Input label */}
      <text x={x + 12} y={y + 40} dominantBaseline="middle" fill={TEXT_MUTED} fontSize={9}>INPUT</text>
      <text x={x + 12} y={y + 54} dominantBaseline="middle" fill={TEXT} fontSize={11}>
        {state.input?.label ?? "—"}
      </text>

      {/* Sound mode */}
      <text x={x + width / 2 + 10} y={y + 40} dominantBaseline="middle" fill={TEXT_MUTED} fontSize={9}>MODE</text>
      <text x={x + width / 2 + 10} y={y + 54} dominantBaseline="middle" fill={TEXT} fontSize={11}>
        {state.soundMode.label}
      </text>

      {/* Volume label */}
      <text x={x + 12} y={y + 74} dominantBaseline="middle" fill={TEXT_MUTED} fontSize={9}>
        VOL {state.MV !== undefined ? state.MV : "—"}
      </text>

      {/* Mute badge */}
      {state.muteOn && (
        <text
          x={x + width - 12} y={y + 74}
          textAnchor="end" dominantBaseline="middle"
          fill="#ef4444" fontSize={10} fontWeight="bold"
        >
          MUTE
        </text>
      )}

      {/* Volume bar track */}
      <rect x={x + 12} y={y + 86} width={width - 24} height={6} rx={3} fill="#1e293b" />
      {/* Volume bar fill */}
      <rect x={x + 12} y={y + 86} width={barWidth} height={6} rx={3} fill={state.muteOn ? GRAY : TEAL} />

      {/* DynEQ / DynComp row */}
      <text x={x + 12}             y={y + 108} dominantBaseline="middle" fill={TEXT_MUTED} fontSize={9}>
        DynEQ: {state.psDynEqOn ? "ON" : "OFF"}
      </text>
      <text x={x + width / 2 + 10} y={y + 108} dominantBaseline="middle" fill={TEXT_MUTED} fontSize={9}>
        DIL: {state.psDilOn ? "ON" : "OFF"}
      </text>
    </g>
  );
}
