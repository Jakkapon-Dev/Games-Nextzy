import { describe, expect, it } from 'vitest';
import { LANDING_PAUSE_MS, SLOWDOWN_MS, SPIN_STEP_MS, spinPath } from './game';

const ending = [...SLOWDOWN_MS, LANDING_PAUSE_MS];

describe('spinPath', () => {
  it.each([-1, 0, 1, 2, 3].flatMap((from) => [0, 1, 2, 3].map((target) => [from, target])))(
    'moves one option at a time from %i and stops on %i',
    (from, target) => {
      const path = spinPath(from, target, 4);

      expect(path.at(-1)?.index).toBe(target);
      path.forEach((step, i) => {
        const previous = i === 0 ? from : path[i - 1].index;
        expect(step.index).toBe((previous + 1) % 4);
      });
    },
  );

  it('keeps the fast pace until the slowdown and rests on the picked option', () => {
    const delays = spinPath(0, 0, 4).map((step) => step.delayMs);

    expect(delays.slice(-ending.length)).toEqual(ending);
    expect(delays.slice(0, -ending.length).every((delay) => delay === SPIN_STEP_MS)).toBe(true);
    expect(delays.length - ending.length).toBeLessThan(4);
  });

  it('rejects a target that is not one of the options', () => {
    expect(() => spinPath(0, -1, 4)).toThrow(RangeError);
    expect(() => spinPath(0, 4, 4)).toThrow(RangeError);
  });
});
