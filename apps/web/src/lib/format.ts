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

const dateTimeFormat = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Bangkok',
  day: '2-digit',
  month: '2-digit',
  year: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

/** ISO 8601 (UTC) → Thai local time as in the design, e.g. "15/02/25 20:00 น." */
export function formatThaiDateTime(iso: string): string {
  const parts = Object.fromEntries(
    dateTimeFormat.formatToParts(new Date(iso)).map((part) => [part.type, part.value]),
  );
  return `${parts.day}/${parts.month}/${parts.year} ${parts.hour}:${parts.minute} น.`;
}
