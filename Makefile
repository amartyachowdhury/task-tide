# Task-Tide: AI-Powered Task Scheduler
# Makefile for Docker operations

.PHONY: help build run stop clean dev logs shell health

# Default target
help: ## Show this help message
	@echo "Task-Tide Docker Commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# Production commands
build: ## Build the production Docker image
	docker-compose build task-tide

run: ## Run the production application
	docker-compose up -d task-tide
	@echo "Task-Tide is running at http://localhost:8080"

stop: ## Stop the production application
	docker-compose down

restart: ## Restart the production application
	docker-compose restart task-tide

# Development commands
dev: ## Run in development mode
	docker-compose --profile dev up -d task-tide-dev
	@echo "Task-Tide dev server is running at http://localhost:3000"

dev-stop: ## Stop development server
	docker-compose --profile dev down

# Database commands (for future use)
db-up: ## Start PostgreSQL database
	docker-compose --profile postgres up -d postgres

db-down: ## Stop PostgreSQL database
	docker-compose --profile postgres down

redis-up: ## Start Redis
	docker-compose --profile redis up -d redis

redis-down: ## Stop Redis
	docker-compose --profile redis down

# Utility commands
logs: ## Show application logs
	docker-compose logs -f task-tide

logs-dev: ## Show development logs
	docker-compose --profile dev logs -f task-tide-dev

shell: ## Open shell in running container
	docker-compose exec task-tide sh

health: ## Check application health
	curl -f http://localhost:8080/health || echo "Application is not healthy"

# Cleanup commands
clean: ## Remove containers and images
	docker-compose down --rmi all --volumes --remove-orphans

clean-all: ## Remove everything including volumes
	docker-compose down --rmi all --volumes --remove-orphans
	docker system prune -f

# Build and run in one command
deploy: build run ## Build and run the application

# Full stack (with databases)
full-stack: ## Run full stack with databases
	docker-compose --profile postgres --profile redis up -d

full-stop: ## Stop full stack
	docker-compose --profile postgres --profile redis down
