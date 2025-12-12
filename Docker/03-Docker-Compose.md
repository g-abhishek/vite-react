# Docker Compose - Revision Guide

## What is Docker Compose?

Docker Compose is a tool for defining and running **multi-container Docker applications** using a YAML file.

---

## Basic Structure

```yaml
version: "3.8"  # Compose file version

services:       # Container definitions
  service_name:
    image: image_name
    # ... configuration

networks:       # Custom networks
  network_name:

volumes:        # Named volumes
  volume_name:
```

---

## Docker Compose Commands

```bash
# Start services (build if needed)
docker-compose up
docker-compose up -d              # Detached mode
docker-compose up --build         # Force rebuild

# Stop services
docker-compose down
docker-compose down -v            # Also remove volumes
docker-compose down --rmi all     # Also remove images

# View running services
docker-compose ps

# View logs
docker-compose logs
docker-compose logs -f            # Follow logs
docker-compose logs service_name  # Specific service

# Execute command in service
docker-compose exec service_name bash

# Build/rebuild services
docker-compose build
docker-compose build --no-cache

# Scale services
docker-compose up -d --scale web=3

# Restart services
docker-compose restart
docker-compose restart service_name

# Pull images
docker-compose pull

# View config (validates and shows resolved config)
docker-compose config

# Stop services (without removing)
docker-compose stop

# Start stopped services
docker-compose start
```

---

## Service Configuration Options

### image
Specify the image to use.

```yaml
services:
  web:
    image: nginx:alpine
    
  app:
    image: myregistry.com/myapp:v1.0
```

### build
Build image from Dockerfile.

```yaml
services:
  app:
    build: .  # Dockerfile in current directory
    
  api:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
      args:
        - NODE_ENV=production
```

### ports
Map container ports to host.

```yaml
services:
  web:
    ports:
      - "8080:80"           # HOST:CONTAINER
      - "443:443"
      - "3000"              # Random host port
      - "127.0.0.1:8080:80" # Bind to specific interface
```

### volumes
Mount volumes or bind mounts.

```yaml
services:
  db:
    volumes:
      - db-data:/var/lib/mysql          # Named volume
      - ./config:/etc/config:ro         # Bind mount (read-only)
      - /host/path:/container/path      # Absolute path
      
volumes:
  db-data:  # Named volume declaration
```

### environment
Set environment variables.

```yaml
services:
  app:
    environment:
      - NODE_ENV=production
      - DB_HOST=database
      - API_KEY=${API_KEY}  # From shell/env file
      
    # Or as object
    environment:
      NODE_ENV: production
      DB_HOST: database
```

### env_file
Load environment variables from file.

```yaml
services:
  app:
    env_file:
      - .env
      - .env.production
```

### depends_on
Define service dependencies (startup order).

```yaml
services:
  web:
    depends_on:
      - db
      - redis
      
  db:
    image: postgres
    
  redis:
    image: redis
```

**Note:** `depends_on` only waits for container to start, not for service to be ready. Use healthchecks for readiness.

```yaml
services:
  web:
    depends_on:
      db:
        condition: service_healthy
        
  db:
    image: postgres
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5
```

### networks
Connect to custom networks.

```yaml
services:
  web:
    networks:
      - frontend
      - backend
      
  db:
    networks:
      - backend
      
networks:
  frontend:
  backend:
```

### restart
Restart policy.

```yaml
services:
  web:
    restart: "no"           # Default, never restart
    restart: always         # Always restart
    restart: on-failure     # Only on non-zero exit
    restart: unless-stopped # Always except when stopped
```

### command
Override default command.

```yaml
services:
  app:
    command: npm run dev
    
    # Or as list
    command: ["npm", "run", "dev"]
```

### entrypoint
Override default entrypoint.

```yaml
services:
  app:
    entrypoint: /app/entrypoint.sh
```

### healthcheck
Define container health check.

```yaml
services:
  api:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

### deploy (Swarm mode)
Deployment configuration for Docker Swarm.

```yaml
services:
  web:
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '0.5'
          memory: 256M
        reservations:
          cpus: '0.25'
          memory: 128M
      restart_policy:
        condition: on-failure
```

---

## Complete Examples

### Node.js + MongoDB + Redis

```yaml
version: "3.8"

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - MONGODB_URI=mongodb://mongo:27017/mydb
      - REDIS_URL=redis://redis:6379
    depends_on:
      - mongo
      - redis
    volumes:
      - .:/app
      - /app/node_modules
    networks:
      - app-network

  mongo:
    image: mongo:6
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db
    networks:
      - app-network

  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
    networks:
      - app-network

networks:
  app-network:
    driver: bridge

volumes:
  mongo-data:
```

### Full Stack (React + Node + PostgreSQL + Nginx)

```yaml
version: "3.8"

services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - frontend
      - backend
    networks:
      - app-network

  frontend:
    build: ./frontend
    expose:
      - "3000"
    environment:
      - REACT_APP_API_URL=/api
    networks:
      - app-network

  backend:
    build: ./backend
    expose:
      - "5000"
    environment:
      - DATABASE_URL=postgres://user:pass@db:5432/mydb
    depends_on:
      db:
        condition: service_healthy
    networks:
      - app-network

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
      - POSTGRES_DB=mydb
    volumes:
      - postgres-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U user -d mydb"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - app-network

networks:
  app-network:

volumes:
  postgres-data:
```

### Development with Hot Reload

```yaml
version: "3.8"

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
    volumes:
      - .:/app                    # Mount source code
      - /app/node_modules         # Prevent overwriting node_modules
    environment:
      - NODE_ENV=development
    command: npm run dev
```

---

## Environment Variables

### From .env file (auto-loaded)
```
# .env
DB_PASSWORD=secret
API_KEY=mykey123
```

```yaml
services:
  app:
    environment:
      - DB_PASSWORD=${DB_PASSWORD}
      - API_KEY=${API_KEY}
```

### Default values
```yaml
environment:
  - DB_HOST=${DB_HOST:-localhost}
  - PORT=${PORT:-3000}
```

---

## Networking

### Default Network
All services in a compose file are connected to a default network and can communicate using service names as hostnames.

```yaml
services:
  web:
    image: nginx
    # Can reach api at http://api:3000
    
  api:
    image: myapi
    ports:
      - "3000:3000"
```

### Custom Networks
```yaml
services:
  frontend:
    networks:
      - public
      
  backend:
    networks:
      - public
      - private
      
  database:
    networks:
      - private  # Not accessible from frontend

networks:
  public:
  private:
    internal: true  # No external access
```

---

## Interview Quick Facts

1. **docker-compose.yml** is the default file name (use `-f` for custom)

2. **Service names** become hostnames for inter-service communication

3. **depends_on** only controls startup order, not readiness

4. **Named volumes** persist data; bind mounts for development

5. Use **networks** to isolate services (e.g., frontend can't access database directly)

6. **docker-compose down -v** removes volumes (data loss!)

7. Environment variables can use **${VAR:-default}** syntax

8. **.env** file in the same directory is auto-loaded

9. Use **expose** for internal ports, **ports** for external access

10. **docker-compose config** validates and shows the resolved configuration


