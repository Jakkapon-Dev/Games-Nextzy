import { CheckHealth } from './check-health.js';

describe('CheckHealth', () => {
  it('returns ok after the probe succeeds', async () => {
    const probe = { check: vi.fn().mockResolvedValue(undefined) };
    expect(await new CheckHealth(probe).execute()).toEqual({ status: 'ok' });
    expect(probe.check).toHaveBeenCalledOnce();
  });

  it('propagates failure for the HTTP adapter to translate into 503', async () => {
    const error = new Error('unavailable');
    await expect(
      new CheckHealth({ check: vi.fn().mockRejectedValue(error) }).execute(),
    ).rejects.toBe(error);
  });
});
