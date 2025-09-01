# Multi-stage Dockerfile for one-api
# Stage 1: Build React frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app/web/air

# Copy package files
COPY web/air/package*.json ./

# Install dependencies
RUN npm ci --only=production --silent

# Copy frontend source
COPY web/air ./

# Build frontend and move to correct location
RUN npm run build

# Stage 2: Build Go application
FROM golang:1.21-alpine AS backend-builder

# Install build dependencies
RUN apk add --no-cache git gcc musl-dev

WORKDIR /app

# Copy go mod files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy source code
COPY . .

# Copy built frontend from previous stage
COPY --from=frontend-builder /app/web/build ./web/build

# Build Go application with optimizations
RUN CGO_ENABLED=1 GOOS=linux go build \
    -ldflags='-w -s -extldflags "-static"' \
    -a -installsuffix cgo \
    -o one-api \
    main.go

# Stage 3: Final runtime image
FROM alpine:3.18

# Install runtime dependencies
RUN apk add --no-cache \
    ca-certificates \
    tzdata \
    && rm -rf /var/cache/apk/*

# Create non-root user
RUN addgroup -g 1001 -S oneapi && \
    adduser -u 1001 -S oneapi -G oneapi

# Create data directory with proper permissions
RUN mkdir -p /data && \
    chown -R oneapi:oneapi /data

# Set working directory
WORKDIR /app

# Copy binary from builder stage
COPY --from=backend-builder /app/one-api .

# Change ownership to non-root user
RUN chown oneapi:oneapi /app/one-api

# Switch to non-root user
USER oneapi

# Create volume for data persistence
VOLUME ["/data"]

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/status || exit 1

# Set environment variables
ENV GIN_MODE=release \
    DATA_SOURCE_NAME=/data/one-api.db

# Run the application
CMD ["./one-api"]