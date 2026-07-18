// wwwelly's mark: a single flat dot in the brand's sage-teal accent — the
// small circle that sits before the "wwwelly" wordmark in the header. Reused
// on its own (no text) anywhere a compact brand glyph is needed, e.g. as the
// icon for the "Todo" filter entry.
export function Logo({ className, size = 28 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      className={className}
      aria-hidden
    >
      <circle cx="20" cy="20" r="20" fill="var(--brand-teal)" />
    </svg>
  )
}
