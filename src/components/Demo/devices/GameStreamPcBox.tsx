import type { GameStreamPcSimState } from "@/demo/types";
import { InfoIcon } from "@/components/Demo/devices/InfoIcon";

const TITLE = "GameStream PC — Windows gaming PC running Nvidia GameStream + EventGhost. The HTPC sends it a display-mode command before launching Moonlight, so the stream resolution matches the TV output.";

const PURPLE = "#7c3aed";
const CARD_BG = "#0f172a";
const TEXT = "#f1f5f9";
const TEXT_MUTED = "#94a3b8";
const GREEN = "#22c55e";

// Human-readable display-mode labels matching gamestream-pc.ts
const DISPLAY_MODE_LABELS: Record<string, string> = {
  displayDummy4K60: "4K 60Hz (HDR)",
  displayDummy1440p120: "1440p 120Hz (HDR)",
};

interface Props {
  state: GameStreamPcSimState;
  x: number;
  y: number;
  width: number;
  height: number;
  isRecent: boolean;
  onInfo: (text: string) => void;
}

export function GameStreamPcBox({ state, x, y, width, height, isRecent, onInfo }: Props) {
  const displayLabel = state.displayMode
    ? (DISPLAY_MODE_LABELS[state.displayMode] ?? state.displayMode)
    : "—";

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
        stroke={isRecent ? PURPLE : "#1e293b"}
        strokeWidth={isRecent ? 2 : 1}
        className={isRecent ? "line-recent" : undefined}
      />

      {/* Header bar */}
      <rect x={x} y={y} width={width} height={24} rx={8} fill={PURPLE} />
      <rect x={x} y={y + 16} width={width} height={8} fill={PURPLE} />

      {/* Title */}
      <text
        x={x + width / 2}
        y={y + 12}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={TEXT}
        fontSize={11}
        fontWeight="bold"
      >
        GameStream PC
      </text>

      {/* Info icon */}
      <InfoIcon cx={x + 11} cy={y + 12} r={4} onClick={() => onInfo(TITLE)} />

      {/* Power indicator — always on */}
      <circle cx={x + width - 12} cy={y + 12} r={4} fill={GREEN} />

      {/* Display mode label */}
      <text
        x={x + 10}
        y={y + 42}
        dominantBaseline="middle"
        fill={TEXT_MUTED}
        fontSize={9}
      >
        DISPLAY (via EG)
      </text>
      <text
        x={x + 10}
        y={y + 58}
        dominantBaseline="middle"
        fill={TEXT}
        fontSize={11}
      >
        {displayLabel}
      </text>

      {/* Moonlight note */}
      <text
        x={x + 10}
        y={y + 78}
        dominantBaseline="middle"
        fill={TEXT_MUTED}
        fontSize={9}
      >
        Moonlight/SteamLink streams from here
      </text>
    </g>
  );
}
