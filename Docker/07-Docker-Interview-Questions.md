# Docker Interview & Scenario Guide — Complete Reference

> 25 questions reframed as real scenarios — understand the reasoning behind each answer so interviews and on-call debugging feel natural, not memorized.

---

## Table of Contents

1. [How to Use This Guide](#how-to-use-this-guide)
2. [Basic Level — Core Concepts](#2-basic-level--core-concepts)
3. [Intermediate Level — Networking, Volumes, Optimization](#3-intermediate-level--networking-volumes-optimization)
4. [Advanced Level — Security, Orchestration, Internals](#4-advanced-level--security-orchestration-internals)
5. [Scenario-Based Troubleshooting](#5-scenario-based-troubleshooting)
6. [Quick Comparison Tables](#6-quick-comparison-tables)
7. [Summary Cheatsheet](#summary-cheatsheet)

---

## How to Use This Guide

Each entry follows:

1. **The scenario** — what you'd face in an interview or on-call
2. **The core answer** — short, direct
3. **Why it works** — mental model
4. **Commands / code** — what you'd actually run
5. **Follow-up traps** — what interviewers ask next

Cross-references point to full guides: [Basics](./01-Docker-Basics.md), [Dockerfile](./02-Dockerfile.md), [Compose](./03-Docker-Compose.md), [Networking](./04-Docker-Networking.md), [Volumes](./05-Docker-Volumes.md), [Security](./06-Docker-Security.md).

---

## 2. Basic Level — Core Concepts

---

### Q1: What is Docker and why is it used?

**Scenario:** Interviewer asks you to explain Docker to a non-technical stakeholder, then to an engineer.

**Core answer:** Docker packages an application and its dependencies into a **portable image** that runs as an **isolated container** on any machine with Docker installed.

**Why it works:** Same artifact from laptop → CI → production. No "install Node 18 and these 12 libraries" README drift.

**Problems it solves:**

| Problem | Without Docker | With Docker |
|---------|----------------|-------------|
| Environment drift | Works on my machine | Same image everywhere |
| Slow onboarding | Hours of setup | `docker compose up` |
| Dependency conflict | Global Python 3.9 vs 3.12 | Isolated containers |
| Deploy inconsistency | Manual server config | Pull tagged image |

**Follow-up trap:** "Is Docker a VM?" — No. Containers share the host kernel; VMs virtualize hardware with guest OS each.

---

### Q2: Image vs container?

**Scenario:** Teammate says "delete the nginx image to restart the server."

**Core answer:**
- **Image** = read-only blueprint (class)
- **Container** = running (or stopped) instance with writable layer (object)

```bash
docker pull nginx:alpine    # image — on disk, not serving traffic
docker run -d --name web nginx:alpine   # container — process running
docker stop web             # container stopped, image still exists
docker rm web               # container gone, image still exists
docker rmi nginx:alpine     # image gone
```

**Why it matters:** Stopping/deleting containers doesn't remove images. Restarting usually means `docker start` or new `docker run`, not `pull` again.

---

### Q3: What is a Dockerfile?

**Scenario:** You need to package your Node API for deployment.

**Core answer:** Text recipe; each instruction adds a layer.

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

```bash
docker build -t my-api:v1 .
docker run -d -p 3000:3000 my-api:v1
```

**Why order matters:** `COPY package*.json` before `COPY . .` caches `npm ci` when only source code changes. See [02-Dockerfile.md](./02-Dockerfile.md).

---

### Q4: CMD vs ENTRYPOINT?

**Scenario:** You build a CLI tool image. Users should run different scripts but always through `python`.

**Core answer:**

| | CMD | ENTRYPOINT |
|---|-----|------------|
| Role | Default args / default command | Fixed executable |
| Override | `docker run img args` replaces CMD | Args replace CMD; need `--entrypoint` to change program |

```dockerfile
ENTRYPOINT ["python"]
CMD ["app.py"]
```

```bash
docker run mytool              # python app.py
docker run mytool migrate.py   # python migrate.py
```

**Node API pattern:** Usually `CMD ["node", "server.js"]` only — no ENTRYPOINT needed.

**Follow-up trap:** Shell form `CMD npm start` vs exec form `CMD ["npm", "start"]` — exec form handles signals correctly (PID 1 issue).

---

### Q5: What is Docker Compose?

**Scenario:** Your app needs API + Postgres + Redis. You're tired of three long `docker run` commands.

**Core answer:** YAML file defining multiple services; one command starts the stack.

```yaml
services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgres://postgres:secret@db:5432/app
    depends_on:
      - db
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_PASSWORD: secret
    volumes:
      - pgdata:/var/lib/postgresql/data
volumes:
  pgdata:
```

```bash
docker compose up -d
```

**Key insight:** Service name `db` is the hostname inside the network. Not `localhost`.

Full guide: [03-Docker-Compose.md](./03-Docker-Compose.md).

---

## 3. Intermediate Level — Networking, Volumes, Optimization

---

### Q6: Explain Docker network types

**Scenario:** Pick network mode for local dev API, high-perf metrics agent, isolated batch job, Swarm cluster.

| Driver | What | When |
|--------|------|------|
| **bridge** (custom) | Private LAN on host + DNS | Default for dev/prod single host |
| **host** | Shares host network | Linux perf, no isolation |
| **none** | Loopback only | No network needed |
| **overlay** | Multi-host VXLAN | Docker Swarm |
| **macvlan** | Real MAC on physical LAN | Legacy apps |

```bash
docker network create app-net
docker run -d --name db --network app-net postgres
docker run -d --name api --network app-net -e DB_HOST=db my-api
```

**Trap:** Default `bridge` (not custom) — **no DNS by name**. Always use user-defined bridge or Compose.

Guide: [04-Docker-Networking.md](./04-Docker-Networking.md).

---

### Q7: What are volumes and why?

**Scenario:** You `docker rm` your Postgres container and lose all users.

**Core answer:** Volumes persist data outside the container writable layer.

```bash
# Named volume (production DB)
docker run -d -v pgdata:/var/lib/postgresql/data postgres:15-alpine

# Bind mount (dev code)
docker run -d -v "$(pwd)":/app -w /app node:18-alpine npm run dev
```

| Type | Use |
|------|-----|
| Named volume | Databases, uploads |
| Bind mount | Live code editing |
| tmpfs | Secrets in RAM |

**Survives:** `docker rm` — yes (volume). **Lost on:** `docker volume rm` or `compose down -v`.

Guide: [05-Docker-Volumes.md](./05-Docker-Volumes.md).

---

### Q8: How do you optimize image size?

**Scenario:** Image is 1.8 GB; deploy takes 8 minutes.

**Step-by-step approach:**

```
1. Check what's big     → docker history my-api:v1
2. Smaller base         → node:18-alpine vs node:18
3. Multi-stage build    → builder stage not in final image
4. .dockerignore        → exclude node_modules, .git
5. Combine RUN + cleanup → rm apt cache same layer
6. Production deps only → npm ci --only=production
```

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
USER node
CMD ["node", "dist/server.js"]
```

**Typical result:** 1.8 GB → 150–250 MB.

---

### Q9: COPY vs ADD?

**Scenario:** Dockerfile needs to add files; teammate uses `ADD` for everything.

**Core answer:** Use `COPY` for files. `ADD` only when auto-extracting local tar archives.

```dockerfile
COPY package*.json ./          # ✓
ADD app.tar.gz /app/           # OK — tar extract
ADD https://x.com/f /app/      # ✗ — use curl in RUN instead
```

**Why:** `COPY` is predictable; `ADD` URL fetch is not cached well and is surprising in review.

---

### Q10: How do containers communicate?

**Scenario:** API can't reach database — `connection refused` on `localhost:5432`.

**Core answer:** Same user-defined network or Compose network — use **service/container name** as hostname.

```yaml
services:
  api:
    environment:
      DB_HOST: db
  db:
    image: postgres
```

```bash
# Manual
docker network create net
docker run -d --name db --network net postgres
docker run -d --name api --network net -e DB_HOST=db my-api
```

**Don't use:** `--link` (deprecated). **Don't use:** `localhost` for other containers.

---

### Q11: Layer caching — how to optimize?

**Scenario:** Every code change triggers 3-minute `npm ci`.

**Walkthrough:**

```
Build 1: all layers built
Build 2: change server.js only
  FROM           cached
  COPY package*  cached
  RUN npm ci     cached    ← saved 3 minutes
  COPY . .       rebuild
  CMD            rebuild
```

**BAD Dockerfile:**

```dockerfile
COPY . .
RUN npm ci
```

**GOOD Dockerfile:**

```dockerfile
COPY package*.json ./
RUN npm ci
COPY . .
```

---

### Q12: How to pass environment variables?

**Scenario:** Different config for dev/staging/prod without rebuilding image.

```bash
# Single
docker run -e NODE_ENV=production -e DB_HOST=db my-api

# File
docker run --env-file .env my-api
```

```yaml
services:
  api:
    environment:
      NODE_ENV: production
      API_KEY: ${API_KEY}
    env_file:
      - .env
```

**Build-time vs runtime:**
- `ARG` — build only (`docker build --build-arg`)
- `ENV` — build + runtime (visible in `docker inspect`)

**Security:** Never put production secrets in Dockerfile `ENV`.

---

## 4. Advanced Level — Security, Orchestration, Internals

---

### Q13: How do you handle secrets?

**Scenario:** `.env` with `DATABASE_PASSWORD` — safe for dev, not for production image.

| Approach | When |
|----------|------|
| Runtime `-e` / env_file | Dev, CI-injected |
| Docker Swarm secrets | Swarm — `/run/secrets/` |
| Vault / AWS SM / K8s secrets | Production |
| BuildKit `--secret` | npm tokens at build, not in layers |

```bash
# Swarm
echo "pass" | docker secret create db_pass -
docker service create --secret db_pass my-api
```

**Trap:** Secrets in `ENV` in Dockerfile are in image history forever.

Guide: [06-Docker-Security.md](./06-Docker-Security.md).

---

### Q14: Docker security best practices?

**Scenario:** Security review before production launch.

**Priority order:**

```
1. USER non-root in Dockerfile
2. Pin base image tag (not latest)
3. Multi-stage + minimal base (alpine/distroless)
4. Scan in CI (trivy, scout)
5. No secrets in image
6. --cap-drop ALL, read-only FS
7. Resource limits (--memory, --cpus)
8. DB not published to host
9. Never --privileged
10. Keep Docker + images patched
```

---

### Q15: Docker Swarm vs Kubernetes?

**Scenario:** Team debates orchestration for 50-microservice platform vs small internal tool.

| | Swarm | Kubernetes |
|---|-------|------------|
| Complexity | Low | High |
| Built into Docker | Yes | Separate install |
| Ecosystem | Smaller | Huge |
| Enterprise adoption | Declining | Standard |
| Best for | Simple multi-host, legacy | Large scale, cloud-native |

**Interview answer:** Swarm is simpler, built-in; K8s is industry standard for complex orchestration, auto-scaling, ecosystem (Helm, operators). Many teams use managed K8s (EKS, GKE) or serverless containers (Cloud Run, Fargate) instead of self-managing either.

---

### Q16: How do you debug a running container?

**Scenario:** API returns 500 in staging; container is running.

**Systematic flow:**

```
docker compose ps                    # running? healthy?
docker compose logs -f api           # application errors
docker compose exec api sh           # shell inside (if available)
docker compose exec api env | grep DB  # config check
docker stats api                     # OOM?
docker inspect api --format '{{.State.ExitCode}}'  # if restarting
```

```bash
# Standalone
docker logs -f --tail 100 container_id
docker exec -it container_id sh
docker top container_id
docker cp container_id:/app/logs ./logs
```

**Restart loop:** `docker logs` first — usually app crash on boot (bad env, DB not ready).

---

### Q17: Multi-stage builds — why?

**Scenario:** Final image includes TypeScript compiler, test files, devDependencies.

**Core answer:** Multiple `FROM` stages; copy only artifacts to final stage.

**Benefits:**
- Smaller image → faster deploy, less attack surface
- No compiler in production → fewer CVEs
- Clear separation build vs runtime

```dockerfile
FROM node:18-alpine AS builder
RUN npm ci && npm run build

FROM node:18-alpine
COPY --from=builder /app/dist ./dist
CMD ["node", "dist/server.js"]
```

---

### Q18: Resource limits?

**Scenario:** One container OOMs and kills host services.

**Core answer:** Linux **cgroups** — Docker sets limits:

```bash
docker run --memory=512m --cpus=1.0 --pids-limit=200 my-api
```

```yaml
deploy:
  resources:
    limits:
      memory: 512M
      cpus: '1.0'
```

**OOM behavior:** Container killed (exit 137), may restart per policy — not necessarily whole host.

---

### Q19: What is the build context?

**Scenario:** `docker build` sends 2 GB to daemon; build is slow.

**Core answer:** All files in the path you pass (`docker build .`) sent to daemon — except `.dockerignore`.

```bash
docker build -t my-api .     # . is context
```

```
Project/
├── Dockerfile
├── .dockerignore   ← exclude node_modules, .git
├── src/
└── node_modules/   ← must be ignored
```

**Trap:** `COPY` can only access files **inside** context. Can't `COPY ../other-project/file`.

---

### Q20: What happens when you `docker run`?

**Scenario:** Interviewer wants step-by-step internals.

**Flow:**

```
docker run -d -p 3000:3000 my-api:v1
        │
        ▼
Client sends request to dockerd
        │
        ▼
Image exists locally? ──NO──► docker pull
        │
       YES
        ▼
Create writable container layer on image
        │
        ▼
Create network namespace, assign IP
        │
        ▼
Apply port mappings, env, volumes
        │
        ▼
Start process (CMD/ENTRYPOINT)
        │
        ▼
Container state: running (or exited if command ends)
```

**Kernel features:** namespaces (isolation), cgroups (limits), union filesystem (layers).

---

## 5. Scenario-Based Troubleshooting

---

### Q21: Container keeps restarting

**Scenario:** `docker ps` shows `Restarting (1) 5 seconds ago`.

**Debug flow:**

```
docker logs container_id --tail 50     # why did it exit?
docker inspect container_id \
  --format 'ExitCode={{.State.ExitCode}} OOM={{.State.OOMKilled}}'
docker events --since 10m --filter container=container_id
```

| Exit code | Meaning |
|-----------|---------|
| 0 | Clean exit (maybe CMD finished — wrong for server) |
| 1 | Application error |
| 137 | SIGKILL — often OOM |
| 139 | Segfault |

**Common causes:**
- Missing env var (`DATABASE_URL`)
- DB not ready (add healthcheck + depends_on)
- Wrong CMD — process exits immediately
- Port already in use (container fails start)

**Fix test:** Run interactively without `-d`:

```bash
docker run -it --rm my-api sh
# manually: node server.js — see error
```

---

### Q22: Zero-downtime deployment?

**Scenario:** Deploy v2 without dropping active connections.

**Approaches:**

| Strategy | How |
|----------|-----|
| **Rolling update** | K8s/Swarm replaces instances one by one |
| **Blue-green** | Switch load balancer from blue to green stack |
| **Health checks** | New container must pass before traffic |

```yaml
# Swarm example
deploy:
  replicas: 3
  update_config:
    parallelism: 1
    delay: 10s
    failure_action: rollback
  rollback_config:
    parallelism: 1
```

**Plain `docker compose` on one host:** Limited — brief downtime unless you run multiple instances behind a load balancer manually.

---

### Q23: Container can't connect to database

**Scenario:** `ECONNREFUSED` or `getaddrinfo ENOTFOUND db`.

**Checklist:**

```bash
# 1. Same network?
docker network inspect myapp_default

# 2. DB running and healthy?
docker compose ps
docker compose exec db pg_isready -U postgres

# 3. DNS works?
docker compose exec api ping -c 1 db
docker compose exec api getent hosts db

# 4. Correct env?
docker compose exec api env | grep -i database

# 5. DB logs
docker compose logs db
```

| Symptom | Likely cause |
|---------|--------------|
| `ENOTFOUND db` | Wrong network or wrong hostname |
| `ECONNREFUSED` | DB not ready, wrong port, DB not listening |
| `password authentication failed` | Wrong credentials — network OK |

**Fix:** `DB_HOST=db` not `localhost`. Add `healthcheck` on db.

---

### Q24: Image build is slow

**Scenario:** CI build takes 12 minutes every commit.

**Optimization checklist:**

```
□ .dockerignore excludes node_modules, .git
□ COPY package*.json before COPY . .
□ Multi-stage — don't copy tests to final stage
□ DOCKER_BUILDKIT=1
□ BuildKit cache mounts for npm/pip
□ Smaller base (alpine)
□ docker compose build --parallel
```

```bash
DOCKER_BUILDKIT=1 docker build -t my-api .
```

**Measure:** `docker build` with `--progress=plain` — find slowest step.

---

### Q25: Stateful apps in Docker?

**Scenario:** Run production Postgres in Docker — team says containers are ephemeral.

**Core answer:** Containers are ephemeral; **volumes are not**. Stateful = container + named volume + backup strategy.

```yaml
services:
  postgres:
    image: postgres:15-alpine
    volumes:
      - postgres-data:/var/lib/postgresql/data
    environment:
      POSTGRES_PASSWORD_FILE: /run/secrets/db_password
    secrets:
      - db_password
    restart: unless-stopped
    # no ports: — internal only

volumes:
  postgres-data:

secrets:
  db_password:
    external: true
```

**Production considerations:**
- Named volume or cloud block storage
- Regular backup (`tar` pattern in [05-Docker-Volumes.md](./05-Docker-Volumes.md))
- `restart: unless-stopped`
- Don't use `compose down -v` in prod
- For HA: managed RDS / Cloud SQL, or K8s StatefulSet + operators

---

## 6. Quick Comparison Tables

### CMD vs ENTRYPOINT vs RUN

| Instruction | When runs | Purpose |
|-------------|-----------|---------|
| RUN | Build | Install deps, compile |
| CMD | Container start | Default command |
| ENTRYPOINT | Container start | Fixed executable |

### ports vs expose (Compose)

| | `ports` | `expose` |
|---|---------|----------|
| Host access | Yes | No |
| Container-to-container | Yes | Yes |

### docker run vs docker start

| | `docker run` | `docker start` |
|---|--------------|----------------|
| Creates | New container | — |
| Resumes | — | Existing container |
| New image tag | Yes | No — same container |

### Volume types

| | Named | Bind | tmpfs |
|---|-------|------|-------|
| Prod DB | ✓ | ✗ | ✗ |
| Dev code | ✗ | ✓ | ✗ |
| Temp secrets | ✗ | ✗ | ✓ |

### Network drivers

| Driver | DNS by name | Multi-host |
|--------|-------------|------------|
| Default bridge | ✗ | ✗ |
| Custom bridge | ✓ | ✗ |
| Compose default | ✓ | ✗ |
| Overlay | ✓ | ✓ |

---

## Summary Cheatsheet

**Top 10 interview one-liners (understand, don't memorize):**

1. Image = template; container = running instance with writable layer
2. `localhost` inside container is itself — use service names
3. `EXPOSE` documents; `-p` publishes
4. Named volumes survive `docker rm`; bind mounts for dev code
5. `depends_on` ≠ ready — use healthchecks
6. `COPY` deps before source for cache
7. Multi-stage = small secure production images
8. Non-root `USER` + scan + no secrets in image
9. Default bridge has no DNS — use custom network
10. `compose down -v` deletes your database

**Study path:** Read guides 01–06 → practice scenarios Q21–Q25 on a real machine → use this file for interview review.

---

*Full series: [01-Basics](./01-Docker-Basics.md) · [02-Dockerfile](./02-Dockerfile.md) · [03-Compose](./03-Docker-Compose.md) · [04-Networking](./04-Docker-Networking.md) · [05-Volumes](./05-Docker-Volumes.md) · [06-Security](./06-Docker-Security.md)*
