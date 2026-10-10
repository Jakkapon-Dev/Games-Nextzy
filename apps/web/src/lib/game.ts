/** Delay between eliminating two options. */
export const ELIMINATION_INTERVAL_MS = 600;

/** Pause on the remaining option before the result dialog opens. */
export const RESULT_PAUSE_MS = 400;

/**
 * The options that were not picked, in a random order (Fisher–Yates shuffle).
 * The picked score itself is decided by the API; this only drives the animation.
 */
export function eliminationOrder(
  options: readonly number[],
  picked: number,
  random: () => number = Math.random,
): number[] {
  const rest = options.filter((option) => option !== picked);
  for (let i = rest.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [rest[i], rest[j]] = [rest[j], rest[i]];
  }
  return rest;
}
