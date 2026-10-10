const scoreFormat = new Intl.NumberFormat('en-US');

/** 8500 → "8,500" */
export function formatScore(value: number): string {
  return scoreFormat.format(value);
}

/** Share of `value` in `max` as a percentage clamped to 0–100. */
export function toPercent(value: number, max: number): number {
  if (max <= 0) return 0;
  return Math.min(100, Math.max(0, (value / max) * 100));
}
