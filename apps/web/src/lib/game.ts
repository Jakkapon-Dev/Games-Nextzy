/** Delay between highlight steps while the draw is spinning fast. */
export const SPIN_STEP_MS = 70;

/** Shortest fast spin, so a quick API response still feels like a draw. */
export const MIN_SPIN_MS = 900;

/** Delays of the final steps: each one lingers longer before the highlight stops. */
export const SLOWDOWN_MS = [100, 130, 170, 230, 320, 450, 650, 950] as const;

/** How long the highlight rests on the picked option before it turns green. */
export const LANDING_PAUSE_MS = 350;

/** Pause on the picked option before the result dialog opens. */
export const RESULT_PAUSE_MS = 400;

export interface SpinStep {
  index: number;
  delayMs: number;
}

/**
 * Highlight steps that continue from `fromIndex` (-1 before the first step), slow down and stop
 * on `targetIndex`. The picked score is decided by the API; this only drives the animation.
 */
export function spinPath(fromIndex: number, targetIndex: number, count: number): SpinStep[] {
  if (!Number.isInteger(targetIndex) || targetIndex < 0 || targetIndex >= count) {
    throw new RangeError(`Target index ${targetIndex} is outside the ${count} options`);
  }
  const ending = [...SLOWDOWN_MS, LANDING_PAUSE_MS];
  let steps = ending.length;
  while ((fromIndex + steps) % count !== targetIndex) steps++;
  const delays = [...Array<number>(steps - ending.length).fill(SPIN_STEP_MS), ...ending];
  return delays.map((delayMs, step) => ({ index: (fromIndex + step + 1) % count, delayMs }));
}
