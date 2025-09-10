import { User } from '../entities/user.entity';
import { Email, Uuid } from '@/common/domain/value-objects';

export abstract class UserRepositoryPort {
  abstract findByEmail(email: Email): Promise<User | null>;
  abstract findById(id: Uuid): Promise<User | null>;
  abstract save(user: User): Promise<User>;
  abstract delete(id: Uuid): Promise<void>;
}
