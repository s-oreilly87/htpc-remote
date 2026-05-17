interface Props {
  cx: number;
  cy: number;
  r?: number;
  onClick?: () => void;
}

/**
 * Small ⓘ badge rendered in SVG. Place inside a <g> that carries a <title>
 * for native browser hover, and wire onClick to show a custom click tooltip.
 */
export function InfoIcon({ cx, cy, r = 5, onClick }: Props) {
  return (
    <g style={{ cursor: "help" }} onClick={onClick}>
      {/* Enlarged transparent hit target */}
      <rect
        x={cx - r - 4} y={cy - r - 4}
        width={(r + 4) * 2} height={(r + 4) * 2}
        fill="transparent"
      />
      {/* Filled circle background */}
      <circle cx={cx} cy={cy} r={r} fill="white" fillOpacity={0.15} />
      {/* Circle outline */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="white" strokeWidth={1} strokeOpacity={0.5} />
      {/* Serif "i" — serifs make it read as ℹ at small sizes */}
      <text
        x={cx}
        y={cy + 0.5}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="white"
        fillOpacity={0.8}
        fontSize={r * 1.5}
        fontFamily="Georgia, 'Times New Roman', serif"
        fontWeight="bold"
      >
        i
      </text>
    </g>
  );
}
