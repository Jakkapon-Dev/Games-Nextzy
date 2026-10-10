/** Gold coin with a crown, redrawn as SVG from the design's raster asset. */
export function CrownCoin({ size = 30, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="32" cy="32" r="32" fill="#FFB800" />
      <path
        d="M30 3.5a28.5 28.5 0 0 1 9 1.6M45 8a28.5 28.5 0 0 1 3.4 3.6M5.5 33a28.5 28.5 0 0 0 16 25M58.5 32a28.5 28.5 0 0 1-1.8 9.8"
        fill="none"
        stroke="#FFD43B"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="32" cy="32" r="25" fill="#F79400" />
      <circle cx="32" cy="32" r="21" fill="#FFCC33" />
      <path d="M17.8 25.3 L26.2 29 L32 20.6 L37.8 29 L46.2 25.3 L43 42.5 H21 Z" fill="#F79400" />
    </svg>
  );
}
