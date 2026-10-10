import { Module } from '@nestjs/common';
import { PrismaProgressUnitOfWork } from './prisma-progress-unit-of-work.js';

@Module({ providers: [PrismaProgressUnitOfWork], exports: [PrismaProgressUnitOfWork] })
export class ProgressPersistenceModule {}
