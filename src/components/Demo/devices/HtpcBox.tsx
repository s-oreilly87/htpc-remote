import type { HtpcSimState } from "@/demo/types";
import { InfoIcon } from "@/components/Demo/devices/InfoIcon";

const TITLE = "HTPC — Windows: controlled via EventGhost HTTP events. Linux Wayland: ydotool + shell scripts. Linux X11 / macOS: robotjs for keystroke and mouse. App, display mode, and audio mode are inferred from preset event names.";

const BLUE = "#2563eb";
const CARD_BG = "#0f172a";
const TEXT = "#f1f5f9";
const TEXT_MUTED = "#94a3b8";
const GREEN = "#22c55e";
const GRAY = "#475569";

interface Props {
  state: HtpcSimState;
  x: number;
  y: number;
  width: number;
  height: number;
  isRecent: boolean;
  onInfo: (text: string) => void;
}

export function HtpcBox({ state, x, y, width, height, isRecent, onInfo }: Props) {
  // HTPC has no power control integration — it's always on.
  const isOn = true;

  return (
    <g>
      {/* Card background */}
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={8}
        fill={CARD_BG}
        stroke={isRecent ? BLUE : "#1e293b"}
        strokeWidth={isRecent ? 2 : 1}
        className={isRecent ? "line-recent" : undefined}
      />

      {/* Header bar */}
      <rect x={x} y={y} width={width} height={28} rx={8} fill={BLUE} />
      <rect x={x} y={y + 20} width={width} height={8} fill={BLUE} />

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
        HTPC
      </text>

      {/* Info icon */}
      <InfoIcon cx={x + 14} cy={y + 14} onClick={() => onInfo(TITLE)} />

      {/* Power indicator */}
      <circle
        cx={x + width - 14}
        cy={y + 14}
        r={5}
        fill={isOn ? GREEN : GRAY}
      />

      {/* Active app */}
      <text x={x + 12} y={y + 38} dominantBaseline="middle" fill={TEXT_MUTED} fontSize={9}>
        APP
      </text>
      <text x={x + 12} y={y + 52} dominantBaseline="middle" fill={TEXT} fontSize={11} fontWeight="bold">
        {state.activeApp ?? "—"}
      </text>

      {/* Display mode */}
      <text x={x + 12} y={y + 72} dominantBaseline="middle" fill={TEXT_MUTED} fontSize={9}>
        DISPLAY
      </text>
      <text x={x + 12} y={y + 86} dominantBaseline="middle" fill={TEXT} fontSize={11}>
        {state.displayMode ?? "—"}
      </text>

      {/* Audio mode */}
      <text x={x + 12} y={y + 106} dominantBaseline="middle" fill={TEXT_MUTED} fontSize={9}>
        AUDIO
      </text>
      <text x={x + 12} y={y + 120} dominantBaseline="middle" fill={TEXT} fontSize={11}>
        {state.audioMode ?? "—"}
      </text>
    </g>
  );
}
