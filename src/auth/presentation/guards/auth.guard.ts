import {
  Injectable,
  Logger,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { ValidateTokenUseCase } from '../../application/use-cases/validate-token.use-case';
import { UserResponse } from '../../application/mappers/user.mapper';

export interface AuthenticatedRequest extends Request {
  user?: UserResponse;
}

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(private readonly validateTokenUseCase: ValidateTokenUseCase) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
      const header = request.header('authorization') ?? '';
      const token = header.startsWith('Bearer ') ? header.slice(7) : '';

      if (!token) {
        throw new UnauthorizedException('Missing Bearer token');
      }

      const result = await this.validateTokenUseCase.execute({ token });

      request.user = result.user;
      return true;
    } catch (err) {
      this.logger.warn(
        `Auth falhou: ${err instanceof Error ? err.message : String(err)}`,
      );
      throw err;
    }
  }
}
