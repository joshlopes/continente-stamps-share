import 'reflect-metadata';
import { Container } from 'inversify';
import { PrismaClient } from '../generated/prisma/index.js';
import { TYPES } from './Domain/types.js';

// Application
import { CommandBus } from './Application/Command/CommandBus.js';
import { CommandHandlerManager } from './Application/Command/CommandHandlerManager.js';
import { CreateUserHandler } from './Application/User/CreateUserHandler.js';
import { CreateUserCommand } from './Application/User/CreateUserCommand.js';

// Infrastructure
import { OrmUserRepository } from './Infrastructure/User/OrmUserRepository.js';
import { OrmSessionRepository } from './Infrastructure/Session/OrmSessionRepository.js';
import { BcryptAuthenticationService } from './Infrastructure/Auth/BcryptAuthenticationService.js';

// UI - CLI
import { CliRunner, CLI_COMMAND } from './Ui/Cli/CliRunner.js';
import { CreateUserCliCommand } from './Ui/Cli/Command/CreateUserCliCommand.js';

export function createContainer(): Container {
  const container = new Container();

  // Prisma
  const prisma = new PrismaClient();
  container.bind<PrismaClient>(TYPES.PrismaClient).toConstantValue(prisma);

  // Repositories
  container.bind(TYPES.UserRepository).to(OrmUserRepository).inSingletonScope();
  container.bind(TYPES.SessionRepository).to(OrmSessionRepository).inSingletonScope();

  // Services
  container.bind(TYPES.AuthenticationService).to(BcryptAuthenticationService).inSingletonScope();

  // Command Handler Manager
  container.bind(TYPES.CommandHandlerManager).to(CommandHandlerManager).inSingletonScope();

  // Command Bus
  container.bind(TYPES.CommandBus).to(CommandBus).inSingletonScope();

  // Command Handlers
  container.bind(CreateUserHandler).toSelf().inSingletonScope();

  // Register command handlers
  const handlerManager = container.get<CommandHandlerManager>(TYPES.CommandHandlerManager);
  const createUserHandler = container.get(CreateUserHandler);
  handlerManager.register(new CreateUserCommand('', '').commandName, createUserHandler);

  // CLI Commands
  container.bind(CLI_COMMAND).to(CreateUserCliCommand).inSingletonScope();

  // CLI Runner
  container.bind(TYPES.CliRunner).to(CliRunner).inSingletonScope();

  return container;
}
