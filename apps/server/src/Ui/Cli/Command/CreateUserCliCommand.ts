import { inject, injectable } from 'inversify';
import type { CliCommand, CliContext, CliOption } from '../../../Domain/CliCommand/index.js';
import { CliResult } from '../../../Domain/CliCommand/index.js';
import { TYPES } from '../../../Domain/types.js';
import type { CommandBus } from '../../../Application/Command/CommandBus.js';
import { CreateUserCommand } from '../../../Application/User/CreateUserCommand.js';

@injectable()
export class CreateUserCliCommand implements CliCommand {
  readonly name = 'user:create';
  readonly description = 'Create a new user';
  readonly options: CliOption[] = [
    { name: 'email', short: 'e', description: 'User email', required: true },
    { name: 'password', short: 'p', description: 'User password', required: true },
    { name: 'name', short: 'n', description: 'User name' },
    { name: 'role', short: 'r', description: 'User role (ADMIN or SUPER_ADMIN)', defaultValue: 'ADMIN' },
  ];

  constructor(
    @inject(TYPES.CommandBus)
    private readonly commandBus: CommandBus
  ) {}

  async execute(context: CliContext): Promise<CliResult> {
    const email = context.getOption<string>('email');
    const password = context.getOption<string>('password');
    const name = context.getOption<string>('name');
    const role = context.getOption<string>('role') as 'ADMIN' | 'SUPER_ADMIN';

    if (!email || !password) {
      return CliResult.failure('Email and password are required');
    }

    try {
      const command = new CreateUserCommand(email, password, name, role);
      const user = await this.commandBus.dispatch(command);

      return CliResult.success(`User created successfully: ${user.id.toString()}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return CliResult.failure(`Failed to create user: ${message}`);
    }
  }
}
