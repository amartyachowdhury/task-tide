# Task-Tide: AI-Powered Task Scheduler
# Makefile for Docker operations

.PHONY: help build run stop clean dev logs shell health

# Default target
help: ## Show this help message
	@echo "Task-Tide Docker Commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# Production commands
build: ## Build the production Docker images
	docker-compose build

run: ## Run the production application
	docker-compose up -d
	@echo "Task-Tide is running at:"
	@echo "  Frontend: http://localhost:8080"
	@echo "  Backend API: http://localhost:3001"
	@echo "  API Health: http://localhost:3001/health"

stop: ## Stop the production application
	docker-compose down

restart: ## Restart the production application
	docker-compose restart

# Development commands
dev: ## Run in development mode
	docker-compose --profile dev up -d dev
	@echo "Task-Tide dev server is running at:"
	@echo "  Frontend: http://localhost:3000"
	@echo "  Backend API: http://localhost:3001"

dev-stop: ## Stop development server
	docker-compose --profile dev down

# Individual service commands
build-frontend: ## Build only the frontend
	docker-compose build frontend

build-backend: ## Build only the backend
	docker-compose build backend

run-frontend: ## Run only the frontend
	docker-compose up -d frontend

run-backend: ## Run only the backend
	docker-compose up -d backend

# Utility commands
logs: ## Show application logs
	docker-compose logs -f

logs-frontend: ## Show frontend logs
	docker-compose logs -f frontend

logs-backend: ## Show backend logs
	docker-compose logs -f backend

logs-dev: ## Show development logs
	docker-compose --profile dev logs -f dev

shell-frontend: ## Open shell in frontend container
	docker-compose exec frontend sh

shell-backend: ## Open shell in backend container
	docker-compose exec backend sh

shell-dev: ## Open shell in development container
	docker-compose --profile dev exec dev sh

health: ## Check application health
	@echo "Checking frontend health..."
	@curl -f http://localhost:8080/health || echo "Frontend is not healthy"
	@echo "Checking backend health..."
	@curl -f http://localhost:3001/health || echo "Backend is not healthy"

health-frontend: ## Check frontend health
	curl -f http://localhost:8080/health || echo "Frontend is not healthy"

health-backend: ## Check backend health
	curl -f http://localhost:3001/health || echo "Backend is not healthy"

# Cleanup commands
clean: ## Remove containers and images
	docker-compose down --rmi all --volumes --remove-orphans

clean-all: ## Remove everything including volumes
	docker-compose down --rmi all --volumes --remove-orphans
	docker system prune -f

# Build and run in one command
deploy: build run ## Build and run the application

# Status commands
status: ## Show container status
	docker-compose ps

# Quick start commands
quick-start: build run ## Quick start (build and run)
	@echo "Waiting for services to be ready..."
	@sleep 10
	@make health