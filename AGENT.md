# Continente Stamps Share

A TypeScript monorepo using Bun, featuring CQRS pattern, Inversify DI, and Prisma ORM.

## Architecture

- **CQRS Pattern**: Commands are handled through a CommandBus with registered handlers
- **Inversify DI**: Dependency injection container for managing services
- **Prisma ORM**: Database access with type-safe queries
- **Monorepo**: Workspace-based structure with shared packages

## Project Structure

```
├── apps/
│   ├── server/          # Backend API (Hono + Bun)
│   │   ├── src/
│   │   │   ├── Application/   # Use cases, command handlers
│   │   │   ├── Domain/        # Business logic, entities, interfaces
│   │   │   ├── Infrastructure/ # External services, repositories
│   │   │   └── Ui/            # HTTP routes, CLI commands
│   │   └── prisma/            # Database schema
│   └── web/             # Frontend (React + Vite)
└── packages/
    └── shared/          # Shared types and schemas
```

## Getting Started

```bash
# Setup (via Docker - installs deps, runs migrations)
make setup

# Development (starts backend + frontend dev servers)
make dev

# Create a user
make user-create EMAIL=admin@example.com PASSWORD=password123

# Run CLI commands
make cli CMD="user:create -e user@example.com -p password123"

# Run tests (uses separate test container + test database)
make test

# Run a specific test file
make test-file FILE=apps/server/src/__tests__/User.test.ts
```

## Docker Architecture

- **Dev container**: Uses `oven/bun:1.3-alpine` directly (no Dockerfile build needed)
- **Test container**: Separate container with test database for isolation
- **Production**: Multi-stage Dockerfile with nginx + supervisord (single container)
- **Postgres**: v18 with healthcheck, auto-creates test database via init-db.sh
- Docker Compose profiles: `dev`, `test` (use `--profile` flag or Makefile targets)
- Named volume for `node_modules` to avoid conflicts with host

## Key Patterns

### Command Handler
```typescript
@injectable()
export class CreateUserHandler implements CommandHandler<CreateUserCommand, User> {
  constructor(
    @inject(TYPES.UserRepository) private readonly userRepository: UserRepository
  ) {}

  async handle(command: CreateUserCommand): Promise<User> {
    // Implementation
  }
}
```

### CLI Command
```typescript
@injectable()
export class CreateUserCommand implements CliCommand {
  readonly name = 'user:create'
  readonly description = 'Create a new user'
  
  async execute(context: CliContext): Promise<CliResult> {
    // Implementation
  }
}
```
