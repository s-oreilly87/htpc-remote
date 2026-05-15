import type { DenonSimState, RokuSimState, HtpcSimState } from "@/demo/types";

const CARD_BG = "#0f172a";
const TEXT = "#f1f5f9";
const TEXT_MUTED = "#94a3b8";
const SCREEN_BG = "#0a0f1e";
const SCREEN_ACTIVE = "#1e3a5f";

interface Props {
  denonState: DenonSimState;
  rokuState: RokuSimState;
  htpcState: HtpcSimState;
  x: number;
  y: number;
  width: number;
  height: number;
  isRecent: boolean;
}

export function TvBox({ denonState, rokuState, htpcState, x, y, width, height, isRecent }: Props) {
  // Determine what's showing on screen
  let screenContent = "No Signal";
  let screenBg = SCREEN_BG;

  if (rokuState.powerOn && rokuState.currentApp) {
    screenContent = rokuState.currentApp.label;
    screenBg = SCREEN_ACTIVE;
  } else if (htpcState.activeApp) {
    screenContent = htpcState.activeApp;
    screenBg = SCREEN_ACTIVE;
  } else if (rokuState.powerOn) {
    screenContent = "Roku Home";
    screenBg = "#1a1a2e";
  }

  const accentColor = isRecent ? "#64748b" : "#334155";
  const screenPad = 16;
  const screenY = y + 32;
  const screenH = height - 48;
  const screenW = width - screenPad * 2;

  return (
    <g>
      {/* Card background (TV bezel) */}
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={10}
        fill={CARD_BG}
        stroke={isRecent ? "#64748b" : "#1e293b"}
        strokeWidth={isRecent ? 2 : 1}
        className={isRecent ? "line-recent" : undefined}
      />

      {/* Title bar */}
      <rect x={x} y={y} width={width} height={28} rx={10} fill={accentColor} />
      <rect x={x} y={y + 20} width={width} height={8} fill={accentColor} />

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
        TV / Display
      </text>

      {/* Screen area */}
      <rect
        x={x + screenPad}
        y={screenY}
        width={screenW}
        height={screenH}
        rx={4}
        fill={screenBg}
      />

      {/* Screen content label */}
      <text
        x={x + width / 2}
        y={screenY + screenH / 2 - 10}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={TEXT_MUTED}
        fontSize={9}
      >
        NOW SHOWING
      </text>
      <text
        x={x + width / 2}
        y={screenY + screenH / 2 + 8}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={TEXT}
        fontSize={12}
        fontWeight="bold"
      >
        {screenContent.length > 22 ? screenContent.slice(0, 22) + "…" : screenContent}
      </text>

      {/* Input indicator */}
      {denonState.input && (
        <text
          x={x + width / 2}
          y={screenY + screenH - 10}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={TEXT_MUTED}
          fontSize={9}
        >
          {denonState.input.label}
        </text>
      )}
    </g>
  );
}
