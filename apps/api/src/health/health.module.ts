import { Module } from '@nestjs/common';
import { HealthController } from './presentation/health.controller.js';
import { CheckHealth } from './application/check-health.js';
import { PrismaHealthProbe } from './infrastructure/prisma-health-probe.js';

@Module({
  controllers: [HealthController],
  providers: [
    PrismaHealthProbe,
    {
      provide: CheckHealth,
      inject: [PrismaHealthProbe],
      useFactory: (probe: PrismaHealthProbe) => new CheckHealth(probe),
    },
  ],
})
export class HealthModule {}
