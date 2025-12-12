# Docker Volumes & Storage - Revision Guide

## Why Volumes?

Containers are **ephemeral** - data inside a container is lost when the container is removed. Volumes provide **persistent storage**.

---

## Storage Types

### 1. Volumes (Recommended)

Managed by Docker, stored in `/var/lib/docker/volumes/`.

```bash
# Create volume
docker volume create my-data

# Run with named volume
docker run -d -v my-data:/app/data nginx

# Inspect volume
docker volume inspect my-data

# List volumes
docker volume ls

# Remove volume
docker volume rm my-data

# Remove unused volumes
docker volume prune
```

### 2. Bind Mounts

Mount a specific host directory into container.

```bash
# Bind mount current directory
docker run -d -v $(pwd):/app nginx

# Bind mount with absolute path
docker run -d -v /host/path:/container/path nginx

# Read-only mount
docker run -d -v /host/path:/container/path:ro nginx
```

### 3. tmpfs Mounts (Linux only)

Stored in host memory, never written to disk.

```bash
docker run -d --tmpfs /app/temp nginx

# Or with more options
docker run -d --mount type=tmpfs,destination=/app/temp,tmpfs-size=100m nginx
```

---

## Comparison

| Feature | Volumes | Bind Mounts | tmpfs |
|---------|---------|-------------|-------|
| **Location** | Docker managed | Host filesystem | Memory |
| **Persistence** | Yes | Yes | No (container stop) |
| **Portability** | High | Low (host-dependent) | N/A |
| **Performance** | Good | Varies | Fastest |
| **Backup** | Docker CLI | Standard tools | N/A |
| **Use Case** | Production data | Development | Sensitive/temp data |

---

## Volume Syntax Options

### Short Syntax (-v)

```bash
# Named volume
docker run -v volume-name:/container/path image

# Bind mount
docker run -v /host/path:/container/path image

# Anonymous volume
docker run -v /container/path image
```

### Long Syntax (--mount) - More Explicit

```bash
# Named volume
docker run --mount type=volume,source=my-vol,target=/app/data image

# Bind mount
docker run --mount type=bind,source=/host/path,target=/container/path image

# Read-only
docker run --mount type=bind,source=/host/path,target=/container/path,readonly image

# tmpfs
docker run --mount type=tmpfs,target=/app/temp image
```

**Differences:**
- `--mount`: Fails if source doesn't exist (safer)
- `-v`: Creates source directory if it doesn't exist

---

## Volume Drivers

Volumes can use different storage backends.

```bash
# Local driver (default)
docker volume create --driver local my-volume

# NFS driver example
docker volume create --driver local \
  --opt type=nfs \
  --opt o=addr=192.168.1.100,rw \
  --opt device=:/path/to/share \
  nfs-volume

# Cloud storage (plugins)
docker volume create --driver rexray/ebs ebs-volume
```

---

## Volume in Docker Compose

```yaml
version: "3.8"

services:
  db:
    image: postgres:15
    volumes:
      # Named volume
      - postgres-data:/var/lib/postgresql/data
      # Bind mount
      - ./init-scripts:/docker-entrypoint-initdb.d:ro
      
  app:
    build: .
    volumes:
      # Bind mount for development
      - .:/app
      # Anonymous volume to preserve node_modules
      - /app/node_modules

volumes:
  postgres-data:  # Named volume declaration
  
  # Volume with options
  custom-volume:
    driver: local
    driver_opts:
      type: none
      device: /path/on/host
      o: bind
```

---

## Common Patterns

### Database Persistence

```bash
# PostgreSQL
docker run -d \
  -v postgres-data:/var/lib/postgresql/data \
  -e POSTGRES_PASSWORD=secret \
  postgres

# MySQL
docker run -d \
  -v mysql-data:/var/lib/mysql \
  -e MYSQL_ROOT_PASSWORD=secret \
  mysql

# MongoDB
docker run -d \
  -v mongo-data:/data/db \
  mongo
```

### Development Hot Reload

```yaml
services:
  app:
    build: .
    volumes:
      - .:/app                  # Mount source code
      - /app/node_modules       # Preserve container's node_modules
    command: npm run dev
```

**Why exclude node_modules?**
- Host's node_modules may have different binaries (OS-specific)
- Prevents host from overwriting container's dependencies

### Sharing Data Between Containers

```yaml
services:
  producer:
    image: myproducer
    volumes:
      - shared-data:/data
      
  consumer:
    image: myconsumer
    volumes:
      - shared-data:/data:ro  # Read-only
      
volumes:
  shared-data:
```

### Backup and Restore

```bash
# Backup volume to tar file
docker run --rm \
  -v my-volume:/source:ro \
  -v $(pwd):/backup \
  alpine tar -czf /backup/backup.tar.gz -C /source .

# Restore from tar file
docker run --rm \
  -v my-volume:/target \
  -v $(pwd):/backup:ro \
  alpine tar -xzf /backup/backup.tar.gz -C /target
```

### Copy Data from Container

```bash
# Create container (don't run)
docker create --name temp myimage

# Copy file/directory out
docker cp temp:/app/data ./local-data

# Remove temp container
docker rm temp
```

---

## Volume Permissions

### Common Permission Issues

```dockerfile
# Container runs as non-root user
FROM node:18-alpine
RUN adduser -D appuser
USER appuser
WORKDIR /app

# If volume is mounted, appuser may not have write permission!
```

### Solutions

```bash
# 1. Set correct ownership in Dockerfile
RUN chown -R appuser:appuser /app

# 2. Match UID/GID with host
docker run -u $(id -u):$(id -g) -v $(pwd):/app myimage

# 3. Use named volumes (Docker manages permissions)
docker run -v my-data:/app/data myimage
```

---

## Anonymous Volumes

Created without a name, harder to manage.

```dockerfile
# In Dockerfile
VOLUME /app/data
```

```bash
# Creates anonymous volume
docker run -v /app/data myimage
```

**Cleanup:**
```bash
# Remove container and its anonymous volumes
docker rm -v container_name

# Remove all unused volumes
docker volume prune
```

---

## Interview Quick Facts

1. **Volumes** are the preferred mechanism for persisting data

2. **Bind mounts** depend on host directory structure, less portable

3. **-v** creates directory if missing, **--mount** fails (safer)

4. Data in volumes **survives container removal** (unless `docker rm -v`)

5. **Anonymous volumes** are created by `VOLUME` instruction in Dockerfile

6. Use **named volumes** in production, **bind mounts** for development

7. **:ro** suffix makes mount read-only

8. **tmpfs** stores data in memory only (not persisted)

9. Volume data is stored in `/var/lib/docker/volumes/` on Linux

10. **docker volume prune** removes unused volumes - be careful with data!

11. Container's `/app/node_modules` pattern prevents host from overwriting dependencies

12. Volumes can be **shared** between multiple containers


