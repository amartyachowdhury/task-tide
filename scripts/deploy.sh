#!/bin/bash

# Task-Tide: Production Deployment Script
# Automated deployment script for Task-Tide application

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="task-tide"
CONTAINER_NAME="task-tide-app"
PORT="8080"
HEALTH_CHECK_URL="http://localhost:${PORT}/health"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    log_success "Docker and Docker Compose are installed"
}

# Check if port is available
check_port() {
    if lsof -Pi :${PORT} -sTCP:LISTEN -t >/dev/null; then
        log_warning "Port ${PORT} is already in use. Stopping existing containers..."
        docker-compose down 2>/dev/null || true
    fi
}

# Build the application
build_app() {
    log_info "Building Task-Tide application..."
    docker-compose build
    log_success "Application built successfully"
}

# Deploy the application
deploy_app() {
    log_info "Deploying Task-Tide application..."
    docker-compose up -d task-tide
    log_success "Application deployed successfully"
}

# Wait for application to be healthy
wait_for_health() {
    log_info "Waiting for application to be healthy..."
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f ${HEALTH_CHECK_URL} >/dev/null 2>&1; then
            log_success "Application is healthy and ready!"
            return 0
        fi
        
        log_info "Health check attempt ${attempt}/${max_attempts}..."
        sleep 2
        ((attempt++))
    done
    
    log_error "Application failed to become healthy after ${max_attempts} attempts"
    return 1
}

# Show application status
show_status() {
    log_info "Application Status:"
    echo ""
    echo "🌐 Application URL: http://localhost:${PORT}"
    echo "🏥 Health Check: ${HEALTH_CHECK_URL}"
    echo ""
    
    # Show container status
    docker-compose ps
    
    echo ""
    log_info "Useful commands:"
    echo "  View logs:     docker-compose logs -f task-tide"
    echo "  Stop app:      docker-compose down"
    echo "  Restart app:   docker-compose restart task-tide"
    echo "  Shell access:  docker-compose exec task-tide sh"
}

# Main deployment function
main() {
    log_info "Starting Task-Tide deployment..."
    echo ""
    
    check_docker
    check_port
    build_app
    deploy_app
    
    if wait_for_health; then
        echo ""
        show_status
        echo ""
        log_success "🎉 Task-Tide deployment completed successfully!"
        log_info "You can now access your application at http://localhost:${PORT}"
    else
        log_error "❌ Deployment failed. Check the logs with: docker-compose logs task-tide"
        exit 1
    fi
}

# Handle script arguments
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "stop")
        log_info "Stopping Task-Tide application..."
        docker-compose down
        log_success "Application stopped"
        ;;
    "restart")
        log_info "Restarting Task-Tide application..."
        docker-compose restart task-tide
        log_success "Application restarted"
        ;;
    "logs")
        docker-compose logs -f task-tide
        ;;
    "status")
        show_status
        ;;
    "help")
        echo "Task-Tide Deployment Script"
        echo ""
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  deploy   - Deploy the application (default)"
        echo "  stop     - Stop the application"
        echo "  restart  - Restart the application"
        echo "  logs     - Show application logs"
        echo "  status   - Show application status"
        echo "  help     - Show this help message"
        ;;
    *)
        log_error "Unknown command: $1"
        echo "Use '$0 help' for available commands"
        exit 1
        ;;
esac
