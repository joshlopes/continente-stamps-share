import type { Command } from '../../Domain/Command/Command.js';
import type { UserRole } from '@stamps-share/shared';

export class CreateUserCommand implements Command {
  readonly commandName = 'user.create';

  constructor(
    public readonly email: string,
    public readonly password: string,
    public readonly name?: string,
    public readonly role?: UserRole
  ) {}
}
