import type { TplinkSimState } from "@/demo/types";

const AMBER = "#f59e0b";
const CARD_BG = "#0f172a";
const TEXT = "#f1f5f9";
const TEXT_MUTED = "#94a3b8";
const GRAY = "#334155";

interface Props {
  state: TplinkSimState;
  x: number;
  y: number;
  width: number;
  height: number;
  isRecent: boolean;
}

export function LightStrip({ state, x, y, width, height, isRecent }: Props) {
  const devices = Object.entries(state.devices);
  const dotR = 8;
  const dotSpacing = devices.length > 0 ? Math.min(36, (width - 20) / devices.length) : 36;

  return (
    <g>
      {/* Background */}
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={8}
        fill={CARD_BG}
        stroke={isRecent ? AMBER : "#1e293b"}
        strokeWidth={isRecent ? 2 : 1}
        className={isRecent ? "line-recent" : undefined}
      />

      {/* Title */}
      <text
        x={x + width / 2}
        y={y + 12}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={TEXT_MUTED}
        fontSize={9}
      >
        Lights
      </text>

      {/* Device bulbs */}
      {devices.length === 0 ? (
        <text
          x={x + width / 2}
          y={y + height / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={TEXT_MUTED}
          fontSize={9}
        >
          No devices
        </text>
      ) : (
        devices.map(([id, dev], i) => {
          const cx = x + 10 + dotSpacing * i + dotSpacing / 2;
          const cy = y + height / 2 - 4;
          const brightness = dev.brightness ?? 100;
          const opacity = dev.powerState ? 0.3 + (brightness / 100) * 0.7 : 0.2;
          const fill = dev.powerState ? AMBER : GRAY;
          const shortId = id.length > 6 ? id.slice(0, 6) : id;

          return (
            <g key={id}>
              {/* Glow effect for on bulbs */}
              {dev.powerState && (
                <circle
                  cx={cx}
                  cy={cy}
                  r={dotR + 4}
                  fill={AMBER}
                  opacity={0.15}
                />
              )}
              <circle
                cx={cx}
                cy={cy}
                r={dotR}
                fill={fill}
                opacity={opacity}
              />
              <text
                x={cx}
                y={cy + dotR + 9}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={TEXT}
                fontSize={7}
              >
                {shortId}
              </text>
            </g>
          );
        })
      )}
    </g>
  );
}
