# Task-Tide: AI-Powered Task Scheduler
# Multi-stage Docker build for production deployment

# Stage 1: Build stage
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files (if we had any)
# COPY package*.json ./
# RUN npm ci --only=production

# Copy source code
COPY . .

# Create a simple build process (minify, optimize, etc.)
RUN echo "Building Task-Tide application..." && \
    # Add any build steps here if needed
    echo "Build completed successfully!"

# Stage 2: Production stage with Nginx
FROM nginx:alpine AS production

# Install curl for health checks
RUN apk add --no-cache curl

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built application from builder stage
COPY --from=builder /app /usr/share/nginx/html

# Set proper permissions for nginx
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/health || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
