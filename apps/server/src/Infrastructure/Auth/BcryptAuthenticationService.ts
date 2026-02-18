import { injectable } from 'inversify';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import type { AuthenticationService } from '../../Domain/Auth/AuthenticationService.js';

const SALT_ROUNDS = 10;

@injectable()
export class BcryptAuthenticationService implements AuthenticationService {
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  generateToken(): string {
    return uuidv4();
  }
}
