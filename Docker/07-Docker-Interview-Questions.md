# Docker Interview Questions

## Basic Level

### Q1: What is Docker and why is it used?
**Answer:** Docker is a containerization platform that packages applications with their dependencies into lightweight, portable containers. It's used for:
- Consistent environments (dev, staging, production)
- Faster deployment and scaling
- Resource efficiency compared to VMs
- Microservices architecture enablement
- CI/CD pipeline integration

### Q2: What is the difference between a Docker image and a container?
**Answer:**
- **Image**: Read-only template containing application code, libraries, and dependencies. Like a class in OOP.
- **Container**: Running instance of an image with a writable layer. Like an object instance.

```bash
# Image = Blueprint
docker pull nginx  # Download image

# Container = Running instance
docker run nginx   # Create container from image
```

### Q3: What is a Dockerfile?
**Answer:** A text file with instructions to build a Docker image. Each instruction creates a layer.

```dockerfile
FROM node:18-alpine    # Base image
WORKDIR /app           # Set working directory
COPY package*.json ./  # Copy files
RUN npm install        # Execute command
COPY . .               # Copy remaining files
EXPOSE 3000            # Document port
CMD ["node", "app.js"] # Default command
```

### Q4: What is the difference between CMD and ENTRYPOINT?
**Answer:**
- **CMD**: Default command/arguments. Can be overridden by `docker run` args.
- **ENTRYPOINT**: Main executable. Harder to override (needs `--entrypoint`).

```dockerfile
# CMD can be overridden
CMD ["npm", "start"]
# docker run myimage npm test → runs "npm test"

# ENTRYPOINT is fixed, CMD provides defaults
ENTRYPOINT ["node"]
CMD ["app.js"]
# docker run myimage script.js → runs "node script.js"
```

### Q5: What is Docker Compose?
**Answer:** Tool for defining and running multi-container applications using a YAML file.

```yaml
version: "3.8"
services:
  web:
    image: nginx
    ports:
      - "80:80"
  db:
    image: postgres
    environment:
      POSTGRES_PASSWORD: secret
```

```bash
docker-compose up -d    # Start all services
docker-compose down     # Stop and remove
```

---

## Intermediate Level

### Q6: Explain Docker networking types.
**Answer:**
1. **Bridge** (default): Private network on host, containers communicate via IP/name
2. **Host**: Container uses host's network directly, no isolation
3. **None**: No networking, complete isolation
4. **Overlay**: Multi-host networking for Docker Swarm
5. **Macvlan**: Assigns MAC address, appears as physical device

### Q7: What are Docker volumes and why are they used?
**Answer:** Volumes provide persistent storage for containers.

```bash
# Named volume (Docker managed)
docker run -v mydata:/app/data myimage

# Bind mount (host directory)
docker run -v /host/path:/container/path myimage
```

**Why volumes?**
- Data persists beyond container lifecycle
- Can be shared between containers
- Better performance than bind mounts
- Easier backup and migration

### Q8: How do you optimize Docker image size?
**Answer:**
1. Use minimal base images (alpine, slim, distroless)
2. Multi-stage builds
3. Combine RUN commands to reduce layers
4. Clean up in same layer as install
5. Use .dockerignore
6. Remove unnecessary files

```dockerfile
# Multi-stage build
FROM node:18 AS builder
WORKDIR /app
COPY . .
RUN npm ci && npm run build

FROM node:18-alpine
COPY --from=builder /app/dist ./dist
CMD ["node", "dist/app.js"]
```

### Q9: What is the difference between COPY and ADD?
**Answer:**
- **COPY**: Simply copies files/directories from host to container
- **ADD**: Same as COPY, plus:
  - Can extract tar archives automatically
  - Can download from URLs (not recommended)

**Best practice:** Use COPY unless you need tar extraction.

### Q10: How do containers communicate with each other?
**Answer:**
1. **Same network**: Use container name as hostname
2. **Links (deprecated)**: `--link` flag
3. **Docker Compose**: Automatic DNS on default network

```yaml
services:
  web:
    networks:
      - backend
  api:
    networks:
      - backend
  # web can reach api at http://api:port
```

### Q11: What is Docker layer caching and how do you optimize it?
**Answer:** Docker caches each layer and reuses unchanged layers.

**Optimization:**
```dockerfile
# Bad - cache invalidated on any code change
COPY . .
RUN npm install

# Good - dependencies cached separately
COPY package*.json ./
RUN npm install
COPY . .  # Source code changes don't affect npm install cache
```

### Q12: How do you pass environment variables to containers?
**Answer:**
```bash
# Single variable
docker run -e MY_VAR=value myimage

# From file
docker run --env-file .env myimage
```

```yaml
# Docker Compose
services:
  app:
    environment:
      - MY_VAR=value
    env_file:
      - .env
```

---

## Advanced Level

### Q13: How do you handle secrets in Docker?
**Answer:**
1. **Environment variables** (runtime, not in Dockerfile)
2. **Docker Secrets** (Swarm mode) - stored encrypted
3. **External secret managers** (Vault, AWS Secrets Manager)
4. **Build-time secrets** (`--secret` flag)

```bash
# Docker secrets (Swarm)
docker secret create db_pass secret.txt
docker service create --secret db_pass myimage
# Secret available at /run/secrets/db_pass
```

### Q14: Explain Docker security best practices.
**Answer:**
1. Run as non-root user
2. Use minimal base images
3. Scan images for vulnerabilities
4. Don't store secrets in images
5. Use read-only filesystem
6. Drop unnecessary capabilities
7. Limit resources (memory, CPU)
8. Use multi-stage builds
9. Sign and verify images (Content Trust)
10. Keep Docker and images updated

### Q15: What is the difference between Docker Swarm and Kubernetes?
**Answer:**

| Feature | Docker Swarm | Kubernetes |
|---------|--------------|------------|
| **Complexity** | Simple | Complex |
| **Setup** | Easy, built into Docker | Requires separate setup |
| **Scaling** | Good | Excellent |
| **Auto-healing** | Basic | Advanced |
| **Load Balancing** | Built-in | Requires ingress controller |
| **Community** | Smaller | Larger |
| **Use Case** | Simpler deployments | Enterprise, complex apps |

### Q16: How do you debug a running container?
**Answer:**
```bash
# Execute shell in container
docker exec -it container_id sh

# View logs
docker logs container_id
docker logs -f container_id  # Follow

# Inspect container
docker inspect container_id

# View resource usage
docker stats container_id

# View processes
docker top container_id

# Copy files for inspection
docker cp container_id:/path/file ./local
```

### Q17: What are multi-stage builds and why use them?
**Answer:** Multi-stage builds use multiple FROM statements to create smaller, more secure images.

```dockerfile
# Stage 1: Build
FROM node:18 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production (only runtime needed)
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
CMD ["node", "dist/app.js"]
```

**Benefits:**
- Smaller final image (no build tools)
- Fewer vulnerabilities
- Faster deployment

### Q18: How does Docker handle resource limits?
**Answer:** Docker uses Linux cgroups (control groups).

```bash
# Memory limit
docker run --memory=512m myimage

# CPU limit
docker run --cpus=1.5 myimage

# Memory + CPU
docker run --memory=512m --cpus=1 myimage
```

```yaml
# Docker Compose
services:
  app:
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '1'
```

### Q19: Explain the Docker build context.
**Answer:** Build context is the set of files at the specified path sent to Docker daemon for building.

```bash
docker build -t myimage .  # Current directory is context
docker build -t myimage /path/to/context
```

**Important:**
- Large context = slow builds
- Use `.dockerignore` to exclude files
- Only files in context can be copied to image

```
# .dockerignore
node_modules
.git
*.log
```

### Q20: What happens when you run `docker run`?
**Answer:**
1. Docker client sends request to daemon
2. Daemon checks if image exists locally
3. If not, pulls image from registry
4. Creates writable container layer on top of image
5. Creates network interface and assigns IP
6. Starts container and runs specified command
7. Container runs until command completes or stopped

---

## Scenario-Based Questions

### Q21: A container keeps restarting. How do you troubleshoot?
**Answer:**
```bash
# Check logs
docker logs container_id

# Check exit code
docker inspect container_id | grep ExitCode

# Check events
docker events --since 10m

# Run interactively
docker run -it myimage sh

# Check health
docker inspect --format='{{.State.Health.Status}}' container_id
```

### Q22: How would you deploy a zero-downtime update?
**Answer:**
1. **Rolling update** (Swarm/K8s)
2. **Blue-Green deployment**
3. **Health checks** before routing traffic

```yaml
# Docker Swarm rolling update
deploy:
  replicas: 3
  update_config:
    parallelism: 1
    delay: 10s
    failure_action: rollback
```

### Q23: Container can't connect to database. How do you debug?
**Answer:**
```bash
# Check both containers on same network
docker network inspect network_name

# Test DNS resolution
docker exec app ping db

# Check database is running
docker exec db pg_isready

# Check logs
docker logs db
docker logs app

# Verify environment variables
docker exec app env | grep DB
```

### Q24: Image build is slow. How do you optimize?
**Answer:**
1. Order Dockerfile: least changing → most changing
2. Use multi-stage builds
3. Leverage layer caching
4. Use .dockerignore
5. Use BuildKit (`DOCKER_BUILDKIT=1`)
6. Use smaller base images

```bash
# Enable BuildKit for faster builds
DOCKER_BUILDKIT=1 docker build -t myimage .
```

### Q25: How do you run stateful applications in Docker?
**Answer:**
1. Use **named volumes** for data persistence
2. Use **docker-compose** for consistent setup
3. Implement proper **backup strategies**
4. Consider **orchestration** (Swarm/K8s) for HA

```yaml
services:
  postgres:
    image: postgres:15
    volumes:
      - postgres-data:/var/lib/postgresql/data
    environment:
      POSTGRES_PASSWORD_FILE: /run/secrets/db_password
    secrets:
      - db_password

volumes:
  postgres-data:
```



