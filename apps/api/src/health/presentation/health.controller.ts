import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { CheckHealth } from '../application/check-health.js';

/** Liveness and database connectivity check for the hosting platform and monitoring. */
@Controller('health')
export class HealthController {
  constructor(private readonly health: CheckHealth) {}

  @Get()
  async check(): Promise<{ status: 'ok' }> {
    try {
      return await this.health.execute();
    } catch (error) {
      throw new ServiceUnavailableException('Database is not reachable', { cause: error });
    }
  }
}
