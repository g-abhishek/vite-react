# Docker Learning Guide

In-depth, scenario-based Docker guides — understand *why* each command and config exists, not just memorize syntax.

## Contents

| File | Topic | What you'll learn |
|------|-------|-------------------|
| [01-Docker-Basics.md](./01-Docker-Basics.md) | **Docker Basics** | Concepts, architecture, every image/container/system command with scenarios |
| [02-Dockerfile.md](./02-Dockerfile.md) | **Dockerfile** | Every instruction, layer caching, multi-stage builds, `.dockerignore` |
| [03-Docker-Compose.md](./03-Docker-Compose.md) | **Docker Compose** | Multi-container stacks, YAML options, every CLI command |
| [04-Docker-Networking.md](./04-Docker-Networking.md) | **Networking** | Drivers, DNS, port mapping, isolation patterns |
| [05-Docker-Volumes.md](./05-Docker-Volumes.md) | **Volumes & Storage** | Named volumes, bind mounts, backup, permissions |
| [06-Docker-Security.md](./06-Docker-Security.md) | **Security** | Image hardening, runtime flags, scanning, secrets |
| [07-Docker-Interview-Questions.md](./07-Docker-Interview-Questions.md) | **Interview & Scenarios** | 25 Q&A as troubleshooting stories + comparison tables |

## How These Guides Work

Each guide follows the same teaching pattern:

- **Real scenario first** — "your database vanished after `docker rm`"
- **Plain-English explanation** — what happens and why
- **Runnable examples** — commands you can copy and run
- **How it helps** — the concrete problem solved
- **BAD vs GOOD** — common mistakes with fixes
- **Decision guides** — when to use which approach
- **Cheatsheet** — quick reference at the end

No external links required to understand any topic.

## Study Order

```
01 Basics          → mental models, daily commands
02 Dockerfile      → package your own app
03 Compose         → API + DB + Redis in one file
04 Networking      → how containers find each other
05 Volumes         → keep data when containers die
06 Security        → production habits
07 Interview       → review scenarios after 01–06
```

## Quick Start (5 minutes)

```bash
# 1. Run nginx
docker run -d -p 8080:80 --name web nginx:alpine
curl http://localhost:8080

# 2. See it running
docker ps
docker logs web

# 3. Clean up
docker stop web && docker rm web
```

## Quick Reference

### Most used commands

```bash
# Images
docker pull image:tag
docker build -t name:tag .
docker images
docker rmi image

# Containers
docker run -d -p 8080:80 --name myapp image
docker ps -a
docker logs -f container
docker exec -it container sh
docker stop container
docker rm container

# Compose
docker compose up -d
docker compose down
docker compose logs -f

# Cleanup (careful with -v and prune)
docker system df
docker system prune
```

### Production Dockerfile skeleton

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN adduser -S app && chown -R app:app /app
USER app
EXPOSE 3000
HEALTHCHECK CMD wget -qO- http://localhost:3000/health || exit 1
CMD ["node", "server.js"]
```

### Compose skeleton

```yaml
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgres://postgres:secret@db:5432/app
    depends_on:
      db:
        condition: service_healthy
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_PASSWORD: secret
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      retries: 5
volumes:
  pgdata:
```

## Key principles (understand these once)

1. **Image = recipe, container = meal** — deleting the meal doesn't burn the recipe
2. **Service name = hostname** in Compose/custom networks (not `localhost`)
3. **Volumes for data, bind mounts for dev code**
4. **EXPOSE documents, `-p` publishes**
5. **Non-root, pinned tags, scan images** — security basics
6. **`compose down -v` deletes volumes** — only when you mean it
