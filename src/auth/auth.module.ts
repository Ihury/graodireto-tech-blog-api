import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AppConfig } from '../app.config';

import { AuthController } from './presentation/auth.controller';
import { AuthGuard } from './presentation/guards/auth.guard';

import { LoginUseCase } from './application/use-cases/login.use-case';
import { ValidateTokenUseCase } from './application/use-cases/validate-token.use-case';

import { AuthenticationService } from './domain/services/authentication.service';
import { TokenValidationService } from './domain/services/token-validation.service';

import { UserRepositoryPort } from './domain/ports/user.repository.port';
import { TokenServicePort } from './domain/ports/token.service.port';

import { PrismaUserRepository } from './infrastructure/adapters/prisma-user.repository';
import { JwtTokenService } from './infrastructure/adapters/jwt-token.service';

import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: AppConfig.jwt.secret,
      signOptions: {
        expiresIn: AppConfig.jwt.expiresIn,
      },
    }),
  ],
  controllers: [AuthController],
  providers: [
    // Presentation Layer - Guards
    AuthGuard,

    // Application Layer - Use Cases
    LoginUseCase,
    ValidateTokenUseCase,

    // Domain Layer - Services
    AuthenticationService,
    TokenValidationService,

    // Infrastructure Layer - Adapters
    {
      provide: UserRepositoryPort,
      useClass: PrismaUserRepository,
    },
    {
      provide: TokenServicePort,
      useClass: JwtTokenService,
    },
  ],
  exports: [
    AuthGuard,
    ValidateTokenUseCase,
    UserRepositoryPort,
    TokenServicePort,
  ],
})
export class AuthModule {}
