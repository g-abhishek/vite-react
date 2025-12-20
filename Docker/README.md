# Docker Revision Guide 🐳

A comprehensive Docker learning and interview preparation guide.

## Contents

| File | Topic | Description |
|------|-------|-------------|
| [01-Docker-Basics.md](./01-Docker-Basics.md) | **Docker Basics** | Core concepts, architecture, containers vs VMs, essential commands |
| [02-Dockerfile.md](./02-Dockerfile.md) | **Dockerfile** | All instructions, best practices, multi-stage builds, examples |
| [03-Docker-Compose.md](./03-Docker-Compose.md) | **Docker Compose** | Multi-container apps, YAML syntax, networking, complete examples |
| [04-Docker-Networking.md](./04-Docker-Networking.md) | **Networking** | Network drivers, DNS, port mapping, isolation patterns |
| [05-Docker-Volumes.md](./05-Docker-Volumes.md) | **Volumes & Storage** | Persistence, volume types, bind mounts, backup strategies |
| [06-Docker-Security.md](./06-Docker-Security.md) | **Security** | Best practices, scanning, secrets, least privilege principle |
| [07-Docker-Interview-Questions.md](./07-Docker-Interview-Questions.md) | **Interview Questions** | 25 Q&A covering basic to advanced + scenario-based questions |

## Quick Reference

### Most Used Commands

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
docker exec -it container bash
docker stop container
docker rm container

# Compose
docker-compose up -d
docker-compose down
docker-compose logs -f

# Cleanup
docker system prune -a
```

### Dockerfile Template

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
USER node
EXPOSE 3000
CMD ["node", "server.js"]
```

### Docker Compose Template

```yaml
version: "3.8"
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    depends_on:
      - db
  db:
    image: postgres:15-alpine
    volumes:
      - db-data:/var/lib/postgresql/data
volumes:
  db-data:
```

## Key Concepts to Remember

1. **Containers are ephemeral** - Use volumes for persistence
2. **Images are layered** - Order Dockerfile instructions for caching
3. **Bridge is default network** - Use custom networks for DNS
4. **Never run as root** - Create and use non-root users
5. **Scan images** - Use Trivy, Docker Scout, or Snyk
6. **Multi-stage builds** - Reduce image size and attack surface

## Study Order

1. Start with **Basics** to understand core concepts
2. Master **Dockerfile** for building images
3. Learn **Compose** for multi-container applications
4. Understand **Networking** for container communication
5. Study **Volumes** for data persistence
6. Review **Security** best practices
7. Practice with **Interview Questions**

---

**Happy Learning! 🚀**



