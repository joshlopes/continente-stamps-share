import { inject, injectable } from 'inversify';
import type { CommandHandler } from '../Command/CommandHandler.js';
import type { CreateUserCommand } from './CreateUserCommand.js';
import { User } from '../../Domain/User/User.js';
import type { UserRepository } from '../../Domain/User/UserRepository.js';
import type { AuthenticationService } from '../../Domain/Auth/AuthenticationService.js';
import { TYPES } from '../../Domain/types.js';

@injectable()
export class CreateUserHandler implements CommandHandler<CreateUserCommand, User> {
  constructor(
    @inject(TYPES.UserRepository)
    private readonly userRepository: UserRepository,
    @inject(TYPES.AuthenticationService)
    private readonly authService: AuthenticationService
  ) {}

  async handle(command: CreateUserCommand): Promise<User> {
    const existingUser = await this.userRepository.findByEmail(command.email);
    if (existingUser) {
      throw new Error(`User with email ${command.email} already exists`);
    }

    const passwordHash = await this.authService.hashPassword(command.password);

    const user = User.create({
      email: command.email,
      passwordHash,
      name: command.name,
      role: command.role,
    });

    await this.userRepository.save(user);

    return user;
  }
}
