import { Injectable } from '@nestjs/common';
import { hashPassword, verifyPassword } from './password.util';

@Injectable()
export class PasswordService {
  hash(plain: string) {
    return hashPassword(plain);
  }

  verify(plain: string, hash: string) {
    return verifyPassword(plain, hash);
  }
}
