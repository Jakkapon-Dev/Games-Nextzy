import { Module } from '@nestjs/common';
import { SessionController } from './presentation/session.controller.js';
import { InitializePlayerSession } from './application/initialize-player-session.js';
import { ResolvePlayerSession } from './application/resolve-player-session.js';
import { PrismaSessionRepository } from './infrastructure/prisma-session-repository.js';
import { CryptoSessionTokens } from './infrastructure/crypto-session-tokens.js';

@Module({
  controllers: [SessionController],
  providers: [
    PrismaSessionRepository,
    CryptoSessionTokens,
    {
      provide: ResolvePlayerSession,
      inject: [PrismaSessionRepository, CryptoSessionTokens],
      useFactory: (repository: PrismaSessionRepository, tokens: CryptoSessionTokens) =>
        new ResolvePlayerSession(repository, tokens),
    },
    {
      provide: InitializePlayerSession,
      inject: [PrismaSessionRepository, CryptoSessionTokens, ResolvePlayerSession],
      useFactory: (
        repository: PrismaSessionRepository,
        tokens: CryptoSessionTokens,
        resolve: ResolvePlayerSession,
      ) => new InitializePlayerSession(repository, tokens, resolve),
    },
  ],
  exports: [ResolvePlayerSession],
})
export class SessionModule {}
