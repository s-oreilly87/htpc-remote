import type { HtpcSimState } from "@/demo/types";

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
}

export function HtpcBox({ state, x, y, width, height, isRecent }: Props) {
  const isOn = state.activeApp !== null;

  return (
    <g>
      <title>HTPC — controlled via EventGhost (Windows) or ydotool/shell scripts (Linux Wayland), robotjs for keystroke/mouse (Linux X11 / macOS)</title>
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

      {/* Power indicator */}
      <circle
        cx={x + width - 14}
        cy={y + 14}
        r={5}
        fill={isOn ? GREEN : GRAY}
      />

      {/* Active app */}
      <text
        x={x + 12}
        y={y + 50}
        dominantBaseline="middle"
        fill={TEXT_MUTED}
        fontSize={10}
      >
        APP
      </text>
      <text
        x={x + 12}
        y={y + 66}
        dominantBaseline="middle"
        fill={TEXT}
        fontSize={11}
      >
        {state.activeApp ?? "—"}
      </text>

      {/* Display mode */}
      <text
        x={x + 12}
        y={y + 90}
        dominantBaseline="middle"
        fill={TEXT_MUTED}
        fontSize={10}
      >
        DISPLAY
      </text>
      <text
        x={x + 12}
        y={y + 106}
        dominantBaseline="middle"
        fill={TEXT}
        fontSize={10}
      >
        {state.displayMode ?? "—"}
      </text>

      {/* Audio mode */}
      <text
        x={x + 12}
        y={y + 122}
        dominantBaseline="middle"
        fill={TEXT_MUTED}
        fontSize={9}
      >
        {state.audioMode ?? ""}
      </text>
    </g>
  );
}
