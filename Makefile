.PHONY: help setup dev dev-server dev-web logs build start stop down restart \
        db-generate db-migrate db-create-migration db-push db-studio db-reset db-seed \
        lint typecheck test test-unit test-watch test-file clean shell cli user-create

# Default target
.DEFAULT_GOAL := help

# Colors for help output
BLUE := \033[34m
GREEN := \033[32m
YELLOW := \033[33m
RESET := \033[0m

help: ## Show this help message
	@echo "$(GREEN)Continente Stamps Share$(RESET) - TypeScript monorepo with CQRS"
	@echo ""
	@echo "$(YELLOW)Usage:$(RESET)"
	@echo "  make <target>"
	@echo ""
	@echo "$(YELLOW)Targets:$(RESET)"
	@awk 'BEGIN {FS = ":.*##"} /^[a-zA-Z_-]+:.*##/ { printf "  $(BLUE)%-20s$(RESET) %s\n", $$1, $$2 }' $(MAKEFILE_LIST)

# =============================================================================
# Setup & Installation (all via Docker)
# =============================================================================

setup: ## Full project setup (start services, install deps, setup db)
	docker-compose --profile dev up -d postgres
	docker-compose --profile dev run --rm dev bun install
	docker-compose --profile dev run --rm dev sh -c "rm -rf apps/web/node_modules/.vite"
	docker-compose --profile dev run --rm dev sh -c "cd apps/server && bunx prisma generate"
	docker-compose --profile dev run --rm dev sh -c "cd apps/server && bunx prisma migrate dev"
	@echo "$(GREEN)Setup complete!$(RESET)"
	@echo "Run 'make dev' to start development server"

# =============================================================================
# Development (all via Docker)
# =============================================================================

dev: ## Start both backend and web dev servers
	@echo "Starting backend and web dev servers..."
	@echo "Backend: http://localhost:4587"
	@echo "Frontend: http://localhost:5173"
	docker-compose --profile dev run --rm --service-ports dev sh -c "cd apps/server && bun run --watch src/main.ts & cd /app/apps/web && API_URL=http://localhost:4587 bun run dev --host; wait"

dev-server: ## Start backend development server only (with hot reload)
	docker-compose --profile dev run --rm --service-ports dev sh -c "cd apps/server && bun run --watch src/main.ts"

dev-web: ## Start web UI development server only
	docker-compose --profile dev run --rm --service-ports dev sh -c "cd apps/web && API_URL=http://host.docker.internal:4587 bun run dev --host"

shell: ## Open a shell in the dev container
	docker-compose --profile dev run --rm dev sh

# =============================================================================
# CLI Commands (via Docker)
# =============================================================================

cli: ## Run CLI command (usage: make cli CMD="user:create -e user@example.com -p password123")
	docker-compose --profile dev run --rm dev sh -c "cd apps/server && bun run src/cli.ts $(CMD)"

user-create: ## Create a user (usage: make user-create EMAIL=user@example.com PASSWORD=password123 NAME="John Doe")
	docker-compose --profile dev run --rm dev sh -c "cd apps/server && bun run src/cli.ts user:create --email $(EMAIL) --password $(PASSWORD) $(if $(NAME),--name \"$(NAME)\",)"

# =============================================================================
# Production (Docker)
# =============================================================================

build: ## Build production Docker image
	DOCKER_BUILDKIT=1 COMPOSE_DOCKER_CLI_BUILD=1 docker-compose build app

start: ## Start production stack
	docker-compose up -d
	@echo "$(GREEN)App is running at http://localhost$(RESET)"

stop: ## Stop all containers
	docker-compose down

down: ## Stop containers and remove volumes (WARNING: deletes all data)
	docker-compose down -v

restart: stop build start ## Stop, rebuild and restart

logs: ## Show container logs
	docker-compose logs -f

# =============================================================================
# Database (Prisma)
# =============================================================================

db-generate: ## Generate Prisma client
	docker-compose --profile dev run --rm dev sh -c "cd apps/server && bunx prisma generate"

db-migrate: ## Apply pending database migrations
	docker-compose --profile dev run --rm dev sh -c "cd apps/server && bunx prisma migrate deploy"

db-create-migration: ## Create a new migration (interactive)
	docker-compose --profile dev run --rm dev sh -c "cd apps/server && bunx prisma migrate dev"

db-push: ## Push schema changes without migration
	docker-compose --profile dev run --rm dev sh -c "cd apps/server && bunx prisma db push"

db-studio: ## Open Prisma Studio (port 5555)
	docker-compose --profile dev run --rm -p 5555:5555 dev sh -c "cd apps/server && bunx prisma studio"

db-reset: ## Reset database (WARNING: deletes all data)
	docker-compose --profile dev run --rm dev sh -c "cd apps/server && bunx prisma migrate reset"

db-seed: ## Seed the database
	docker-compose --profile dev run --rm dev sh -c "cd apps/server && bun run db:seed"

# =============================================================================
# Code Quality
# =============================================================================

lint: ## Run linter
	docker-compose --profile dev run --rm dev bun run lint

typecheck: ## Run TypeScript type checking
	docker-compose --profile dev run --rm dev bun run typecheck

# =============================================================================
# Testing
# =============================================================================

test: ## Run all tests
	docker-compose --profile test run --rm test sh -c "cd apps/server && bunx prisma generate && bunx prisma migrate deploy && cd /app && bun run test"

test-unit: ## Run unit tests only
	docker-compose --profile test run --rm test sh -c "bun run test"

test-watch: ## Run tests in watch mode
	docker-compose --profile test run --rm test sh -c "bun test --watch"

test-file: ## Run a specific test file (usage: make test-file FILE=apps/server/src/__tests__/User.test.ts)
	docker-compose --profile test run --rm test sh -c "bun test $(FILE)"

# =============================================================================
# Cleanup
# =============================================================================

clean: ## Stop containers and remove volumes (WARNING: deletes all data)
	docker-compose down -v
	@echo "$(GREEN)All containers stopped and volumes removed$(RESET)"
