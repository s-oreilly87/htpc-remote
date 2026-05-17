import { ROKU_APPS } from "@/constants/roku";
import { InfoIcon } from "@/components/Demo/devices/InfoIcon";
import { LinuxLaunchAppCommand } from "@/constants/htpcControls";
import type { DenonSimState, RokuSimState, HtpcSimState } from "@/demo/types";

const TITLE = "TV / Display — passive output device. Input source is selected via Roku ECP; audio is routed through the Denon AVR via HDMI ARC. The HTPC connects as HDMI4 on the Roku TV.";

const CARD_BG = "#0f172a";
const SCREEN_BG = "#060d1a";
const TEXT = "#f1f5f9";
const TEXT_MUTED = "#94a3b8";
const ACCENT = "#334155";

// ── Signal chain derivation ───────────────────────────────────────────────────

interface ChainStep {
  label: string;
  final: boolean;
}

function deriveChain(roku: RokuSimState, htpc: HtpcSimState): ChainStep[] {
  const isHtpcInput = roku.currentApp?.id === ROKU_APPS.HDMI.HDMI4.id;

  // HTPC selected as Roku input (HDMI4)
  if (roku.powerOn && isHtpcInput) {
    const chain: ChainStep[] = [{ label: "HDMI4: HTPC", final: false }];

    if (htpc.activeApp === LinuxLaunchAppCommand.Moonlight) {
      chain.push({ label: "HTPC (Moonlight)", final: false });
      chain.push({ label: "GameStream PC", final: true });
    } else if (htpc.activeApp) {
      chain.push({ label: `HTPC (${htpc.activeApp})`, final: true });
    } else {
      chain.push({ label: "HTPC", final: true });
    }

    return chain;
  }

  // Roku streaming app
  if (roku.powerOn && roku.currentApp) {
    const label = roku.currentApp.label.length > 30
      ? roku.currentApp.label.slice(0, 30) + "…"
      : roku.currentApp.label;
    return [
      { label: "Roku", final: false },
      { label, final: true },
    ];
  }

  // Roku on but no app launched
  if (roku.powerOn) {
    return [{ label: "Roku Home", final: true }];
  }

  // HTPC app without TV (e.g. Plexamp audio-only)
  if (htpc.activeApp) {
    return [
      { label: "HTPC", final: false },
      { label: htpc.activeApp, final: true },
    ];
  }

  return [{ label: "No Signal", final: true }];
}

// ── Chain rendering helpers ───────────────────────────────────────────────────

const STEP_H  = 20; // height allocated to each non-final step
const ARROW_H = 14; // height allocated to each arrow
const FINAL_H = 30; // height allocated to the final (large) step

function chainContentHeight(n: number): number {
  // (n-1) steps + (n-1) arrows + 1 final
  return (n - 1) * (STEP_H + ARROW_H) + FINAL_H;
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  denonState: DenonSimState;
  rokuState: RokuSimState;
  htpcState: HtpcSimState;
  x: number;
  y: number;
  width: number;
  height: number;
  onInfo: (text: string) => void;
}

export function TvBox({ denonState, rokuState, htpcState, x, y, width, height, onInfo }: Props) {
  const HEADER_H = 28;
  const PADDING = 12;

  const chain = deriveChain(rokuState, htpcState);
  const contentAreaH = height - HEADER_H - PADDING * 2;
  const chainH = chainContentHeight(chain.length);

  // Center the chain block vertically in the content area
  const chainStartY = y + HEADER_H + PADDING + Math.max(0, (contentAreaH - chainH) / 2);

  return (
    <g>
      {/* Outer card */}
      <rect x={x} y={y} width={width} height={height} rx={10} fill={CARD_BG} stroke="#1e293b" strokeWidth={1} />

      {/* Header bar */}
      <rect x={x} y={y} width={width} height={HEADER_H} rx={10} fill={ACCENT} />
      <rect x={x} y={y + HEADER_H - 8} width={width} height={8} fill={ACCENT} />

      <text
        x={x + width / 2}
        y={y + HEADER_H / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={TEXT}
        fontSize={12}
        fontWeight="bold"
      >
        TV / Display
      </text>

      {/* Info icon */}
      <InfoIcon cx={x + 14} cy={y + HEADER_H / 2} onClick={() => onInfo(TITLE)} />

      {/* Denon input badge — top-right corner */}
      {denonState.input && (
        <text
          x={x + width - 10}
          y={y + HEADER_H / 2}
          textAnchor="end"
          dominantBaseline="middle"
          fill={TEXT_MUTED}
          fontSize={9}
        >
          AVR: {denonState.input.label}
        </text>
      )}

      {/* Screen area */}
      <rect
        x={x + 8}
        y={y + HEADER_H + 4}
        width={width - 16}
        height={height - HEADER_H - 8}
        rx={6}
        fill={SCREEN_BG}
      />

      {/* Signal chain — rendered centered in the screen area */}
      {chain.map((step, i) => {
        const isLast = i === chain.length - 1;
        // Each non-final step + its arrow occupies (STEP_H + ARROW_H). The final
        // step sits after all the non-final pairs and takes FINAL_H.
        const stepCenterY = isLast
          ? chainStartY + (chain.length - 1) * (STEP_H + ARROW_H) + FINAL_H / 2
          : chainStartY + i * (STEP_H + ARROW_H) + STEP_H / 2;

        if (isLast) {
          return (
            <text
              key={`step-${i}`}
              x={x + width / 2}
              y={stepCenterY}
              textAnchor="middle"
              dominantBaseline="middle"
              fill={TEXT}
              fontSize={22}
              fontWeight="bold"
            >
              {step.label}
            </text>
          );
        }

        const arrowY = chainStartY + i * (STEP_H + ARROW_H) + STEP_H + ARROW_H / 2;

        return (
          <g key={`step-${i}`}>
            <text
              x={x + width / 2}
              y={stepCenterY}
              textAnchor="middle"
              dominantBaseline="middle"
              fill={TEXT_MUTED}
              fontSize={12}
            >
              {step.label}
            </text>
            <text
              x={x + width / 2}
              y={arrowY}
              textAnchor="middle"
              dominantBaseline="middle"
              fill={TEXT_MUTED}
              fontSize={11}
            >
              ↓
            </text>
          </g>
        );
      })}

      {/* "NOW SHOWING" watermark label — bottom-left of screen */}
      <text
        x={x + 18}
        y={y + height - 12}
        dominantBaseline="middle"
        fill={TEXT_MUTED}
        fontSize={8}
        opacity={0.5}
      >
        NOW SHOWING
      </text>
    </g>
  );
}
