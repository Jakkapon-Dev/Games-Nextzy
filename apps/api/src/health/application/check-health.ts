export interface HealthProbe {
  check(): Promise<void>;
}

export class CheckHealth {
  constructor(private readonly probe: HealthProbe) {}

  async execute(): Promise<{ status: 'ok' }> {
    await this.probe.check();
    return { status: 'ok' };
  }
}
