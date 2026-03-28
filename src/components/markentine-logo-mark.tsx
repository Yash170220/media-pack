/**
 * Brand mark for Markentine — upward trend + peak node (growth / performance),
 * not a letterform. Renders inside the gold gradient square used in nav/footer.
 * Use `color` for dark marks on light/gold gradients, or e.g. #FEFEF8 on warm/dark fills.
 */
export function MarkentineLogoIcon({
  className,
  size = 20,
  color = "#06080F",
}: {
  className?: string
  size?: number
  /** Stroke/fill color; baseline uses reduced opacity */
  color?: string
}) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      style={{ color }}
    >
      {/* Baseline */}
      <path
        d="M3 19.5h18"
        stroke="currentColor"
        strokeOpacity={0.22}
        strokeWidth={1}
        strokeLinecap="round"
      />
      {/* Growth curve: insight → momentum → breakout */}
      <path
        d="M4 16.5 L9.5 11 L14 13.5 L20 5.5"
        stroke="currentColor"
        strokeWidth={2.15}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={4} cy={16.5} r={1.6} fill="currentColor" fillOpacity={0.35} />
      <circle cx={9.5} cy={11} r={1.6} fill="currentColor" fillOpacity={0.55} />
      <circle cx={14} cy={13.5} r={1.6} fill="currentColor" fillOpacity={0.55} />
      <circle cx={20} cy={5.5} r={2.35} fill="currentColor" />
    </svg>
  )
}
