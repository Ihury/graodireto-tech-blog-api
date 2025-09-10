// Module
export { AuthModule } from './auth.module';

// Presentation Layer
export { AuthController } from './presentation/auth.controller';
export { AuthGuard } from './presentation/guards/auth.guard';
export type { AuthenticatedRequest } from './presentation/guards/auth.guard';

// Application Layer
export { LoginUseCase } from './application/use-cases/login.use-case';
export { ValidateTokenUseCase } from './application/use-cases/validate-token.use-case';
export { UserMapper } from './application/mappers/user.mapper';
export type {
  LoginCommand,
  LoginResult,
} from './application/use-cases/login.use-case';
export type {
  ValidateTokenCommand,
  ValidateTokenResult,
} from './application/use-cases/validate-token.use-case';
export type { UserResponse } from './application/mappers/user.mapper';

// Domain Layer - Entities
export { User } from './domain/entities/user.entity';
export { TokenPayload } from './domain/entities/token-payload.entity';

// Domain Layer - Value Objects
export { Email, DisplayName, Uuid } from '@/common/domain/value-objects';
export { PasswordHash } from './domain/value-objects/password-hash.vo';
export { AccessToken } from './domain/value-objects/access-token.vo';

// Type alias for backward compatibility
export { Uuid as UserId } from '@/common/domain/value-objects';

// Domain Layer - Ports
export { UserRepositoryPort } from './domain/ports/user.repository.port';
export { TokenServicePort } from './domain/ports/token.service.port';

// Domain Layer - Services
export { AuthenticationService } from './domain/services/authentication.service';
export { TokenValidationService } from './domain/services/token-validation.service';
