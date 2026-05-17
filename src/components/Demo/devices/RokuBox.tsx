import type { RokuSimState } from "@/demo/types";
import { InfoIcon } from "@/components/Demo/devices/InfoIcon";

const TITLE = "Roku TV — source selection and navigation controlled via the Roku ECP HTTP API (port 8060), proxied through Next.js rewrites. Volume keypresses are mirrored to the Denon AVR via HDMI ARC.";

const VIOLET = "#6d28d9";
const CARD_BG = "#0f172a";
const TEXT = "#f1f5f9";
const TEXT_MUTED = "#94a3b8";
const GREEN = "#22c55e";
const GRAY = "#475569";

interface Props {
  state: RokuSimState;
  x: number;
  y: number;
  width: number;
  height: number;
  isRecent: boolean;
  onInfo: (text: string) => void;
}

export function RokuBox({ state, x, y, width, height, isRecent, onInfo }: Props) {
  const appLabel = state.currentApp?.label ?? "Home";

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
        stroke={isRecent ? VIOLET : "#1e293b"}
        strokeWidth={isRecent ? 2 : 1}
        className={isRecent ? "line-recent" : undefined}
      />

      {/* Header bar */}
      <rect x={x} y={y} width={width} height={28} rx={8} fill={VIOLET} />
      <rect x={x} y={y + 20} width={width} height={8} fill={VIOLET} />

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
        Roku TV
      </text>

      {/* Info icon */}
      <InfoIcon cx={x + 14} cy={y + 14} onClick={() => onInfo(TITLE)} />

      {/* Power indicator */}
      <circle
        cx={x + width - 14}
        cy={y + 14}
        r={5}
        fill={state.powerOn ? GREEN : GRAY}
      />

      {/* Current app */}
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
        y={y + 68}
        dominantBaseline="middle"
        fill={TEXT}
        fontSize={11}
      >
        {appLabel.length > 18 ? appLabel.slice(0, 18) + "…" : appLabel}
      </text>

      {/* Navigation focus */}
      <text
        x={x + 12}
        y={y + 96}
        dominantBaseline="middle"
        fill={TEXT_MUTED}
        fontSize={10}
      >
        FOCUS
      </text>
      <text
        x={x + 12}
        y={y + 114}
        dominantBaseline="middle"
        fill={TEXT}
        fontSize={10}
      >
        {state.navigationFocus.length > 18
          ? state.navigationFocus.slice(0, 18) + "…"
          : state.navigationFocus}
      </text>
    </g>
  );
}
