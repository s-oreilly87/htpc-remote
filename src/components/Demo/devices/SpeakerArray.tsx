import type { DenonSoundMode } from "@/types/remote";
import { InfoIcon } from "@/components/Demo/devices/InfoIcon";

const TITLE = "Speakers — channel configuration is driven by the Denon AVR sound mode. Active channels are lit in teal. Stereo = FL/FR, surround modes add C/SL/SR.";

const TEAL = "#0d9488";
const CARD_BG = "#0f172a";
const TEXT = "#f1f5f9";
const TEXT_MUTED = "#94a3b8";
const GRAY = "#334155";

interface SpeakerDef {
  label: string;
  relX: number;
  relY: number;
}

const SPEAKERS: SpeakerDef[] = [
  { label: "FL", relX: 0.1, relY: 0.35 },
  { label: "FR", relX: 0.9, relY: 0.35 },
  { label: "C",  relX: 0.5, relY: 0.2  },
  { label: "SL", relX: 0.15, relY: 0.75 },
  { label: "SR", relX: 0.85, relY: 0.75 },
];

function getActiveSpeakers(soundMode: DenonSoundMode | null): Set<string> {
  if (!soundMode) return new Set(["FL", "FR"]);
  const val = soundMode.value.toUpperCase();
  if (val.includes("STEREO")) return new Set(["FL", "FR"]);
  if (
    val.includes("DOLBY") ||
    val.includes("DTS") ||
    val.includes("MULTI") ||
    val.includes("SURR")
  ) {
    return new Set(["FL", "FR", "C", "SL", "SR"]);
  }
  return new Set(["FL", "FR", "C"]);
}

interface Props {
  soundMode: DenonSoundMode | null;
  powerOn: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  onInfo: (text: string) => void;
}

export function SpeakerArray({ soundMode, powerOn, x, y, width, height, onInfo }: Props) {
  const active = getActiveSpeakers(soundMode);

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
        stroke="#1e293b"
        strokeWidth={1}
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
        Speakers
      </text>

      {/* Info icon */}
      <InfoIcon cx={x + width - 12} cy={y + 12} r={4} onClick={() => onInfo(TITLE)} />

      {/* Speaker dots */}
      {SPEAKERS.map((sp) => {
        const cx = x + sp.relX * width;
        const cy = y + 14 + sp.relY * (height - 14);
        const isActive = powerOn && active.has(sp.label);
        return (
          <g key={sp.label}>
            <circle
              cx={cx}
              cy={cy}
              r={7}
              fill={isActive ? TEAL : GRAY}
            />
            <text
              x={cx}
              y={cy}
              textAnchor="middle"
              dominantBaseline="middle"
              fill={TEXT}
              fontSize={7}
              fontWeight="bold"
            >
              {sp.label}
            </text>
          </g>
        );
      })}

      {/* Sound mode label */}
      {soundMode && (
        <text
          x={x + width / 2}
          y={y + height - 8}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={TEXT_MUTED}
          fontSize={8}
        >
          {soundMode.label}
        </text>
      )}
    </g>
  );
}
