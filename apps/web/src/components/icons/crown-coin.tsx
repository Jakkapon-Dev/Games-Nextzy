import { useId } from 'react';

/** Gold coin with a crown, redrawn as SVG from the design's raster asset. */
export function CrownCoin({ size = 30, className }: { size?: number; className?: string }) {
  const id = useId();
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={`${id}-rim`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFD54A" />
          <stop offset="1" stopColor="#F59E0B" />
        </linearGradient>
        <linearGradient id={`${id}-face`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFB300" />
          <stop offset="1" stopColor="#F59300" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="31" fill={`url(#${id}-rim)`} />
      <circle cx="32" cy="32" r="24" fill={`url(#${id}-face)`} />
      <circle cx="32" cy="32" r="24" fill="none" stroke="#FFC83D" strokeWidth="2" />
      <path
        d="M19 40 L17 25 L25.5 31 L32 21 L38.5 31 L47 25 L45 40 Z"
        fill="#FFE07A"
        stroke="#FFF2B8"
        strokeWidth="1"
        strokeLinejoin="round"
      />
      <rect x="19" y="41.5" width="26" height="4" rx="1.5" fill="#FFE07A" />
    </svg>
  );
}
