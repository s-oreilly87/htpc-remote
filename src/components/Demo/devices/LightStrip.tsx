import type { TplinkSimState } from "@/demo/types";
import { InfoIcon } from "@/components/Demo/devices/InfoIcon";

const TITLE = "TP-Link smart home — lights toggled via Next.js API routes that proxy to the TP-Link Kasa local REST API. Brightness and power state per device.";

const AMBER = "#f5b30b";
const CARD_BG = "#0f172a";
const TEXT = "#f1f5f9";
const TEXT_MUTED = "#94a3b8";
const GRAY = "#334155";

const DEVICE_LABELS: Record<string, string> = {
  "yard-fence": "Fence",
  "yard-dining": "Dining",
  "bedroom":  "Bed",
  "stairway": "Stairs",
  "basement": "TV Room",
};

interface Props {
  state: TplinkSimState;
  x: number;
  y: number;
  width: number;
  height: number;
  isRecent: boolean;
  onInfo: (text: string) => void;
}

/**
 * Horizontal light strip. Devices are evenly distributed across the full width
 * so the strip fills nicely regardless of how wide the container is.
 */
export function LightStrip({ state, x, y, width, height, isRecent, onInfo }: Props) {
  const devices = Object.entries(state.devices);
  const DOT_R = 8;
  const TITLE_H = 14;
  const LABEL_H = 10;

  // Evenly distribute dots across the full width
  const dotCY = y - 4 + TITLE_H + (height - TITLE_H - LABEL_H) / 2;
  const labelY = dotCY + DOT_R + LABEL_H / 2 + 6;
  const slotW = devices.length > 0 ? width / devices.length : width;

  return (
    <g>
      <rect
        x={x} y={y} width={width} height={height}
        rx={8} fill={CARD_BG}
        stroke={isRecent ? AMBER : "#1e293b"}
        strokeWidth={isRecent ? 2 : 1}
        className={isRecent ? "line-recent" : undefined}
      />

      <text
        x={x + 10} y={y + TITLE_H / 2}
        dominantBaseline="middle"
        fill={TEXT_MUTED} fontSize={9}
      >
        Lights
      </text>

      {/* Info icon — right edge of title row */}
      <InfoIcon cx={x + width - 10} cy={y + TITLE_H / 2} r={4} onClick={() => onInfo(TITLE)} />

      {devices.length === 0 ? (
        <text
          x={x + width / 2} y={y + height / 2}
          textAnchor="middle" dominantBaseline="middle"
          fill={TEXT_MUTED} fontSize={9}
        >
          No devices
        </text>
      ) : (
        devices.map(([id, dev], i) => {
          const cx = x + slotW * i + slotW / 2;
          const brightness = dev.brightness ?? 100;
          const opacity = dev.powerState ? 0.15 + (brightness / 100) * 0.75 : 0.2;
          const fill = dev.powerState ? AMBER : GRAY;
          const shortLabel = DEVICE_LABELS[id] ?? id.slice(0, 6);

          return (
            <g key={id}>
              {dev.powerState && (
                <circle cx={cx} cy={dotCY} r={DOT_R + 5} fill={AMBER} opacity={0.12} />
              )}
              <circle cx={cx} cy={dotCY} r={DOT_R} fill={fill} opacity={opacity} />
              <text
                x={cx} y={labelY}
                textAnchor="middle" dominantBaseline="middle"
                fill={TEXT} fontSize={7}
              >
                {shortLabel}
              </text>
            </g>
          );
        })
      )}
    </g>
  );
}
