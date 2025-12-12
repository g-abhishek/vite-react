# Dockerfile - Revision Guide

## What is Dockerfile?

A **Dockerfile** is a text file containing instructions to build a Docker image. Each instruction creates a layer in the image.

---

## Dockerfile Instructions

### FROM
Base image for the build. **Must be the first instruction**.

```dockerfile
FROM node:18-alpine
FROM ubuntu:22.04
FROM python:3.11-slim
FROM scratch  # Empty base image
```

### WORKDIR
Sets the working directory for subsequent instructions.

```dockerfile
WORKDIR /app
WORKDIR /usr/src/app
```

### COPY
Copies files/directories from host to container.

```dockerfile
COPY package.json .
COPY . .
COPY src/ /app/src/
COPY --chown=node:node . .
```

### ADD
Similar to COPY but can:
- Extract tar archives automatically
- Download from URLs (not recommended)

```dockerfile
ADD archive.tar.gz /app/
ADD https://example.com/file.txt /app/  # Avoid this
```

**Best Practice:** Prefer `COPY` over `ADD` unless you need tar extraction.

### RUN
Executes commands during image build.

```dockerfile
# Shell form
RUN apt-get update && apt-get install -y curl

# Exec form
RUN ["npm", "install"]

# Multi-line (reduces layers)
RUN apt-get update && \
    apt-get install -y \
    curl \
    vim \
    git && \
    rm -rf /var/lib/apt/lists/*
```

### CMD
Default command to run when container starts. **Can be overridden**.

```dockerfile
# Exec form (preferred)
CMD ["node", "server.js"]
CMD ["npm", "start"]

# Shell form
CMD node server.js
```

### ENTRYPOINT
Sets the main executable. **Harder to override** than CMD.

```dockerfile
ENTRYPOINT ["node"]
CMD ["server.js"]

# Container runs: node server.js
# Override CMD: docker run myimage app.js → node app.js
```

### CMD vs ENTRYPOINT

| Feature | CMD | ENTRYPOINT |
|---------|-----|------------|
| **Purpose** | Default arguments | Main executable |
| **Override** | Easy with docker run args | Requires --entrypoint flag |
| **Use Case** | Default parameters | Fixed command |

```dockerfile
# Combined usage (recommended pattern)
ENTRYPOINT ["python"]
CMD ["app.py"]

# docker run myimage → python app.py
# docker run myimage script.py → python script.py
```

### ENV
Sets environment variables.

```dockerfile
ENV NODE_ENV=production
ENV PORT=3000
ENV DB_HOST=localhost DB_PORT=5432
```

### ARG
Build-time variables (not available in running container).

```dockerfile
ARG NODE_VERSION=18
FROM node:${NODE_VERSION}-alpine

ARG BUILD_DATE
LABEL build-date=$BUILD_DATE
```

```bash
docker build --build-arg NODE_VERSION=20 -t myapp .
```

### EXPOSE
Documents which ports the container listens on. **Does not publish ports**.

```dockerfile
EXPOSE 3000
EXPOSE 80/tcp
EXPOSE 53/udp
```

### VOLUME
Creates a mount point for persistent data.

```dockerfile
VOLUME /data
VOLUME ["/var/log", "/var/db"]
```

### USER
Sets the user for subsequent instructions and container runtime.

```dockerfile
RUN useradd -m appuser
USER appuser
```

### LABEL
Adds metadata to the image.

```dockerfile
LABEL version="1.0"
LABEL maintainer="dev@example.com"
LABEL description="My awesome app"
```

### HEALTHCHECK
Defines how to check if container is healthy.

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

HEALTHCHECK NONE  # Disable inherited healthcheck
```

---

## Sample Dockerfiles

### Node.js Application

```dockerfile
# Use specific version with alpine for smaller size
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files first (leverage layer caching)
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start application
CMD ["node", "server.js"]
```

### Python Application

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies first
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["python", "app.py"]
```

### Multi-Stage Build (Optimized)

```dockerfile
# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production
FROM node:18-alpine AS production

WORKDIR /app

# Copy only production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy built assets from builder stage
COPY --from=builder /app/dist ./dist

USER node
EXPOSE 3000
CMD ["node", "dist/server.js"]
```

### Go Application (Multi-Stage)

```dockerfile
# Build stage
FROM golang:1.21-alpine AS builder

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o main .

# Final stage - minimal image
FROM scratch

COPY --from=builder /app/main /main
EXPOSE 8080
ENTRYPOINT ["/main"]
```

---

## Best Practices

### 1. Use Specific Base Image Tags
```dockerfile
# Bad
FROM node:latest

# Good
FROM node:18.17.0-alpine3.18
```

### 2. Minimize Layers
```dockerfile
# Bad - 3 layers
RUN apt-get update
RUN apt-get install -y curl
RUN apt-get install -y vim

# Good - 1 layer
RUN apt-get update && \
    apt-get install -y curl vim && \
    rm -rf /var/lib/apt/lists/*
```

### 3. Order Instructions by Change Frequency
```dockerfile
# Dependencies change less often than source code
COPY package*.json ./
RUN npm install
COPY . .  # Source code last
```

### 4. Use .dockerignore
```
node_modules
.git
.env
*.log
Dockerfile
.dockerignore
```

### 5. Don't Run as Root
```dockerfile
RUN useradd -m appuser
USER appuser
```

### 6. Use Multi-Stage Builds
Reduces final image size by excluding build tools and intermediate files.

### 7. Clean Up in Same Layer
```dockerfile
RUN apt-get update && \
    apt-get install -y package && \
    rm -rf /var/lib/apt/lists/*
```

---

## .dockerignore

Prevents files from being copied to build context.

```
# Dependencies
node_modules
vendor

# Build outputs
dist
build

# Version control
.git
.gitignore

# IDE
.vscode
.idea

# Environment files
.env
.env.local

# Logs
*.log
logs

# Docker files
Dockerfile*
docker-compose*

# Tests
__tests__
*.test.js
coverage

# Docs
README.md
docs
```

---

## Interview Quick Facts

1. **FROM** must be the first instruction (except ARG before FROM)

2. **COPY** vs **ADD**: Use COPY unless you need tar extraction

3. **CMD** vs **ENTRYPOINT**: CMD is easily overridden, ENTRYPOINT is the fixed executable

4. **Multi-stage builds** reduce image size significantly

5. Each instruction creates a **layer** (except ENV, LABEL, etc.)

6. **Layer caching**: If a layer hasn't changed, Docker reuses cached version

7. **ARG** is build-time only, **ENV** persists in running container

8. **EXPOSE** only documents ports, doesn't publish them (use `-p` flag)


