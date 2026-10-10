import { describe, expect, it } from 'vitest';
import { eliminationOrder } from './game';

const options = [300, 500, 1000, 3000];

describe('eliminationOrder', () => {
  it('eliminates every option except the picked one, exactly once', () => {
    const order = eliminationOrder(options, 1000);
    expect(order).toHaveLength(3);
    expect([...order].sort((a, b) => a - b)).toEqual([300, 500, 3000]);
  });

  it('uses the random source to vary the order', () => {
    expect(eliminationOrder(options, 300, () => 0)).toEqual([1000, 3000, 500]);
    expect(eliminationOrder(options, 300, () => 0.99)).toEqual([500, 1000, 3000]);
  });
});
