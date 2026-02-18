export const TYPES = {
  // Repositories
  UserRepository: Symbol.for('UserRepository'),
  SessionRepository: Symbol.for('SessionRepository'),
  
  // Services
  AuthenticationService: Symbol.for('AuthenticationService'),
  
  // Infrastructure
  PrismaClient: Symbol.for('PrismaClient'),
  
  // Application
  CommandBus: Symbol.for('CommandBus'),
  CommandHandlerManager: Symbol.for('CommandHandlerManager'),
  
  // CLI
  CliRunner: Symbol.for('CliRunner'),
};
