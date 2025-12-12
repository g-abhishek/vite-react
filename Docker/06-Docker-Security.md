# Docker Security - Revision Guide

## Security Best Practices

### 1. Don't Run as Root

```dockerfile
# Create non-root user
FROM node:18-alpine

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Change ownership before switching user
COPY --chown=appuser:appgroup . /app

USER appuser

CMD ["node", "server.js"]
```

### 2. Use Minimal Base Images

```dockerfile
# Bad - Full OS with unnecessary packages
FROM ubuntu:22.04

# Good - Minimal image
FROM node:18-alpine

# Best - Distroless (no shell, minimal attack surface)
FROM gcr.io/distroless/nodejs18
```

**Image Size Comparison:**
- `node:18` - ~1GB
- `node:18-slim` - ~200MB
- `node:18-alpine` - ~170MB
- `distroless` - ~100MB

### 3. Scan Images for Vulnerabilities

```bash
# Docker Scout (built-in)
docker scout cve myimage:latest

# Trivy
trivy image myimage:latest

# Snyk
snyk container test myimage:latest
```

### 4. Use Specific Image Tags

```dockerfile
# Bad - Unpredictable, could break
FROM node:latest
FROM node:18

# Good - Specific version, reproducible
FROM node:18.17.0-alpine3.18
```

### 5. Don't Store Secrets in Images

```dockerfile
# NEVER do this
ENV API_KEY=super_secret_key
COPY .env /app/.env

# Instead, pass secrets at runtime
docker run -e API_KEY=secret myimage

# Or use Docker secrets (Swarm)
docker secret create my_secret secret.txt
```

### 6. Read-Only Filesystem

```bash
docker run --read-only myimage

# With tmpfs for temp files
docker run --read-only --tmpfs /tmp myimage
```

```yaml
# Docker Compose
services:
  app:
    image: myapp
    read_only: true
    tmpfs:
      - /tmp
      - /var/run
```

### 7. Drop Capabilities

```bash
# Drop all, add only needed
docker run --cap-drop ALL --cap-add NET_BIND_SERVICE myimage
```

```yaml
# Docker Compose
services:
  app:
    cap_drop:
      - ALL
    cap_add:
      - NET_BIND_SERVICE
```

**Common Capabilities:**
- `NET_BIND_SERVICE` - Bind to ports below 1024
- `CHOWN` - Change file ownership
- `DAC_OVERRIDE` - Bypass file permission checks
- `SETUID` / `SETGID` - Set user/group ID

### 8. Limit Resources

```bash
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
        reservations:
          memory: 256M
          cpus: '0.5'
```

### 9. Use Security Options

```bash
# Seccomp profile
docker run --security-opt seccomp=profile.json myimage

# AppArmor profile
docker run --security-opt apparmor=docker-default myimage

# No new privileges
docker run --security-opt no-new-privileges myimage
```

### 10. Network Security

```bash
# Don't use host network unless necessary
docker run --network host myimage  # Avoid

# Use custom bridge networks for isolation
docker network create --internal backend
```

---

## Dockerfile Security Checklist

```dockerfile
# 1. Use specific base image version
FROM node:18.17.0-alpine3.18

# 2. Create non-root user early
RUN addgroup -S app && adduser -S app -G app

# 3. Set working directory
WORKDIR /app

# 4. Copy dependency files first (layer caching)
COPY --chown=app:app package*.json ./

# 5. Install dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# 6. Copy app files with correct ownership
COPY --chown=app:app . .

# 7. Remove unnecessary files
RUN rm -rf .git .env* *.md tests/

# 8. Switch to non-root user
USER app

# 9. Use exec form for CMD (no shell injection)
CMD ["node", "server.js"]

# 10. Document exposed ports
EXPOSE 3000

# 11. Add healthcheck
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget --spider http://localhost:3000/health || exit 1
```

---

## Multi-Stage Build for Security

```dockerfile
# Build stage - has dev dependencies
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage - minimal
FROM node:18-alpine AS production
WORKDIR /app

# Create non-root user
RUN addgroup -S app && adduser -S app -G app

# Copy only production dependencies
COPY --chown=app:app package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy built assets
COPY --chown=app:app --from=builder /app/dist ./dist

USER app
EXPOSE 3000
CMD ["node", "dist/server.js"]
```

---

## Docker Content Trust

Sign and verify images.

```bash
# Enable content trust
export DOCKER_CONTENT_TRUST=1

# Push signed image
docker push myrepo/myimage:v1

# Pull only signed images
docker pull myrepo/myimage:v1  # Fails if not signed
```

---

## Docker Secrets (Swarm Mode)

```bash
# Create secret
echo "my_password" | docker secret create db_password -

# Use in service
docker service create \
  --name myapp \
  --secret db_password \
  myimage
```

```yaml
# docker-compose.yml (Swarm)
services:
  app:
    image: myapp
    secrets:
      - db_password
      
secrets:
  db_password:
    external: true
```

Inside container, secret available at `/run/secrets/db_password`.

---

## Container Runtime Security

### Privileged Mode - AVOID!

```bash
# Never use unless absolutely necessary
docker run --privileged myimage  # Full host access!
```

### User Namespaces

Remap container root to unprivileged host user.

```json
// /etc/docker/daemon.json
{
  "userns-remap": "default"
}
```

### Rootless Docker

Run Docker daemon as non-root user.

```bash
# Install rootless Docker
dockerd-rootless-setuptool.sh install
```

---

## Logging & Auditing

```bash
# Container logs
docker logs container_name

# Docker events
docker events

# Inspect container for security settings
docker inspect container_name | jq '.[0].HostConfig.SecurityOpt'
```

---

## Security Scanning in CI/CD

```yaml
# GitHub Actions example
- name: Build image
  run: docker build -t myimage:${{ github.sha }} .

- name: Scan image
  uses: aquasecurity/trivy-action@master
  with:
    image-ref: myimage:${{ github.sha }}
    severity: 'CRITICAL,HIGH'
    exit-code: '1'  # Fail pipeline on vulnerabilities
```

---

## Interview Quick Facts

1. **Never run as root** - Create and switch to non-root user

2. **Use minimal images** - alpine, slim, or distroless

3. **Scan images** for vulnerabilities before deployment

4. **Don't store secrets** in images or Dockerfiles

5. **Use specific tags** - never use `latest` in production

6. **Drop capabilities** - Start with `--cap-drop ALL`

7. **Read-only filesystems** prevent runtime modifications

8. **Multi-stage builds** reduce attack surface

9. **Resource limits** prevent DoS attacks

10. **Privileged mode** gives full host access - avoid!

11. **Docker Content Trust** ensures image authenticity

12. **Rootless Docker** runs daemon without root privileges


