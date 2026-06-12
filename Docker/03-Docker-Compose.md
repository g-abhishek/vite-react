# Docker Compose — Complete Guide (Basics to Advanced)

> Run your entire stack — API, database, cache, proxy — with one file and one command. Every Compose option and CLI command explained with real scenarios.

---

## Table of Contents

1. [What is Docker Compose? — The Real Explanation](#1-what-is-docker-compose--the-real-explanation)
2. [Why Compose Matters — The Problems It Solves](#2-why-compose-matters--the-problems-it-solves)
3. [Core Concepts & Mental Models](#3-core-concepts--mental-models)
4. [Compose File Anatomy](#4-compose-file-anatomy)
5. [Service Options — One by One](#5-service-options--one-by-one)
6. [Compose CLI Commands — Every Command Explained](#6-compose-cli-commands--every-command-explained)
7. [Complete Stack Examples](#7-complete-stack-examples)
8. [Environment Variables & Secrets](#8-environment-variables--secrets)
9. [Networking in Compose](#9-networking-in-compose)
10. [Advanced Patterns](#10-advanced-patterns)
11. [When to Use What — Decision Guide](#11-when-to-use-what--decision-guide)
12. [Common Pitfalls & How to Avoid Them](#12-common-pitfalls--how-to-avoid-them)
13. [Summary Cheatsheet](#summary-cheatsheet)

---

## 1. What is Docker Compose? — The Real Explanation

**Docker Compose** defines and runs **multi-container applications** from a YAML file — usually `docker-compose.yml` or `compose.yaml`.

### Analogy: restaurant floor plan

Instead of telling each waiter individually where to stand, you draw one floor plan: kitchen here, bar there, servers connect to both. Compose is that plan for containers.

```
docker-compose.yml  →  docker compose up  →  api + db + redis all running, networked
```

### Minimal example

```yaml
services:
  web:
    image: nginx:alpine
    ports:
      - "8080:80"

  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgres://postgres:secret@db:5432/myapp
    depends_on:
      - db

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_PASSWORD: secret
      POSTGRES_DB: myapp
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

```bash
docker compose up -d
curl http://localhost:8080
curl http://localhost:3000/health
```

---

## 2. Why Compose Matters — The Problems It Solves

### Problem 1: Five terminals, five `docker run` commands

**Without Compose:** Long `docker run` with ports, env, volumes, network — copy-paste errors, wrong order.

**With Compose:** One `docker compose up -d`. Entire stack defined in version-controlled YAML.

### Problem 2: "What's the database hostname?"

**Without Compose:** Containers on default bridge — no DNS by name.

**With Compose:** Service name `db` **is** the hostname. `postgres://db:5432` just works.

### Problem 3: New teammate setup takes hours

**Without Compose:** README with 20 steps, half outdated.

**With Compose:** `git clone`, `docker compose up`, done.

### Problem 4: Dev vs prod drift

**Without Compose:** Different run scripts per environment.

**With Compose:** `compose.yaml` + `compose.prod.yaml` overrides — same structure, different scale/secrets.

### Problem 5: Data lost when recreating DB container

**Without Compose:** Forgot `-v` flag on `docker run`.

**With Compose:** Named volumes declared once — survive `docker compose down` (without `-v`).

---

## 3. Core Concepts & Mental Models

| Term | Meaning |
|------|---------|
| **Service** | One container definition (maps to `docker run` options) |
| **Project** | Group of services (default name = directory name) |
| **Network** | Virtual LAN connecting services |
| **Volume** | Named persistent storage |
| **Profile** | Optional service groups (`--profile debug`) |

### Service name = DNS hostname

```yaml
services:
  api: ...
  db: ...
```

Inside `api` container: `ping db` works. **Not** `localhost` for the database — that's the api container itself.

### Compose v2 CLI

Modern Docker includes Compose as a plugin:

```bash
docker compose up      # preferred
docker-compose up      # legacy standalone binary (still common)
```

This guide uses `docker compose`.

---

## 4. Compose File Anatomy

```yaml
# Top-level keys
services:    # required — container definitions
networks:    # optional — custom networks
volumes:     # optional — named volumes
configs:     # Swarm-oriented config blobs
secrets:     # Swarm-oriented secrets

services:
  myservice:
    image: ...       # OR build: ...
    ports: ...
    environment: ...
    volumes: ...
    networks: ...
    depends_on: ...
    restart: ...
    healthcheck: ...
```

**Note:** `version:` key is **obsolete** in Compose Spec v2 — omit it in new files.

---

## 5. Service Options — One by One

---

### `image` — Use a pre-built image

**When:** Official images (postgres, redis, nginx) or images from your registry.

```yaml
services:
  cache:
    image: redis:7-alpine

  app:
    image: ghcr.io/myorg/my-api:1.4.2
```

**How it helps:** No build step — `docker compose pull` fetches exact versions.

---

### `build` — Build from Dockerfile

**When:** Your own application code.

```yaml
services:
  api:
    build: .

  worker:
    build:
      context: ./worker
      dockerfile: Dockerfile.prod
      args:
        NODE_ENV: production
```

| Field | Meaning |
|-------|---------|
| `context` | Build context path (like `docker build` last arg) |
| `dockerfile` | Filename if not `Dockerfile` |
| `args` | `--build-arg` values |

```bash
docker compose build api
docker compose up --build    # rebuild before start
```

---

### `ports` — Publish to host

**When:** Browser or Postman on your laptop needs to reach a service.

```yaml
services:
  web:
    ports:
      - "8080:80"              # host:container
      - "127.0.0.1:3000:3000"  # bind localhost only
      - "3001"                 # random host port → container 3001
```

**Scenario:** React on `:3000`, API on `:5000`, Postgres **not** published (internal only).

```yaml
  frontend:
    ports:
      - "3000:3000"
  api:
    ports:
      - "5000:5000"
  db:
  # no ports — only api reaches db via network
```

**`ports` vs `expose`:**

| | `ports` | `expose` |
|---|---------|----------|
| Host access | Yes | No |
| Container-to-container | Yes | Yes |
| Use | Public/dev access | Document internal ports |

---

### `volumes` — Persist data & dev mounts

```yaml
services:
  db:
    volumes:
      - pgdata:/var/lib/postgresql/data     # named volume
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql:ro  # bind mount

  app:
    volumes:
      - .:/app                              # live code reload
      - /app/node_modules                   # anonymous — keep container deps

volumes:
  pgdata:
```

**`/app/node_modules` trick:** Bind mount `.` overwrites container's `node_modules`. Anonymous volume preserves container's install.

See `05-Docker-Volumes.md` for depth.

---

### `environment` / `env_file`

```yaml
services:
  api:
    environment:
      NODE_ENV: production
      DB_HOST: db
      API_KEY: ${API_KEY}           # from shell or .env file
      PORT: ${PORT:-3000}            # default 3000 if unset
    env_file:
      - .env
      - .env.local
```

**Scenario:** Database URL points to service name `db`, not `localhost`.

**How it helps:** Same compose file on any machine; secrets in `.env` (gitignored).

---

### `depends_on` — Startup order

```yaml
services:
  api:
    depends_on:
      - db
      - redis
```

**Critical:** Default `depends_on` only waits for **container start**, not **service ready**. DB may still be initializing.

**Fix — wait for healthy:**

```yaml
services:
  api:
    depends_on:
      db:
        condition: service_healthy

  db:
    image: postgres:15-alpine
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5
```

```
api starts
    │
    ▼
db container up? ──NO──► wait
    │
   YES
    ▼
db healthcheck passing? ──NO──► wait
    │
   YES
    ▼
api starts
```

---

### `networks` — Control who talks to whom

```yaml
services:
  nginx:
    networks:
      - frontend
  api:
    networks:
      - frontend
      - backend
  db:
    networks:
      - backend

networks:
  frontend:
  backend:
    internal: true    # no external internet route
```

**How it helps:** Database not reachable from nginx — only from api. See `04-Docker-Networking.md`.

---

### `restart` — Auto-restart policy

```yaml
services:
  api:
    restart: unless-stopped   # reboot host → container comes back
```

| Value | Behavior |
|-------|----------|
| `no` | Never restart (default) |
| `always` | Always restart |
| `on-failure` | Restart on non-zero exit |
| `unless-stopped` | Like always, except manual stop sticks |

---

### `command` / `entrypoint` — Override image defaults

```yaml
services:
  api:
    build: .
    command: npm run dev

  migrator:
    image: my-api:latest
    command: ["npm", "run", "migrate"]
    depends_on:
      db:
        condition: service_healthy
```

**Scenario:** Same image, different commands — API server vs one-off migration job.

---

### `healthcheck`

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

**How it helps:** `docker compose ps` shows `healthy`. Other services can `depends_on: condition: service_healthy`.

---

### `deploy` — Resource limits (Compose / Swarm)

For plain `docker compose` on one machine:

```yaml
services:
  api:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
```

**Note:** Full `deploy.replicas` requires Docker Swarm (`docker stack deploy`). For local dev, use `scale` (below).

---

## 6. Compose CLI Commands — Every Command Explained

---

### `docker compose up`

**What:** Create and start all services.

```bash
docker compose up              # foreground, logs in terminal
docker compose up -d           # detached (background)
docker compose up --build      # rebuild images first
docker compose up api db       # only specific services
docker compose up -d --scale worker=3   # 3 worker containers
```

**Scenario:** Monday morning — start entire dev stack.

**How it helps:** Creates network, volumes, containers in correct dependency order.

---

### `docker compose down`

**What:** Stop and remove containers, networks. **Keeps volumes by default.**

```bash
docker compose down
docker compose down -v         # ⚠️ REMOVE VOLUMES — data loss
docker compose down --rmi all    # also remove images built by compose
docker compose down --remove-orphans
```

**Scenario:** Done for the day — free ports and container names.

**Warning:** `down -v` deletes `pgdata` — your database is gone.

---

### `docker compose ps`

**What:** List compose-managed containers.

```bash
docker compose ps
```

```
NAME                STATUS                   PORTS
myapp-api-1         Up 2 hours (healthy)     0.0.0.0:3000->3000/tcp
myapp-db-1          Up 2 hours (healthy)     5432/tcp
```

**How it helps:** Quick health and port check without `docker ps` noise from other projects.

---

### `docker compose logs`

```bash
docker compose logs
docker compose logs -f              # follow all services
docker compose logs -f api          # one service
docker compose logs --tail=100 api
```

**Scenario:** API returns 500 — stream api and db logs together.

---

### `docker compose exec`

**What:** Run command in **running** service container.

```bash
docker compose exec db psql -U postgres -d myapp
docker compose exec api sh
docker compose exec api npm run migrate
```

**vs `docker compose run`:** `exec` needs running container. `run` creates new one-off container.

```bash
docker compose run --rm api npm test   # one-off test run, remove after
```

---

### `docker compose build`

```bash
docker compose build
docker compose build --no-cache api
docker compose build --parallel
```

**When:** Dockerfile changed but you don't want to start services yet.

---

### `docker compose pull`

```bash
docker compose pull
```

**When:** CI/CD or teammate updated images in registry — fetch without building.

---

### `docker compose config`

**What:** Validate YAML and print resolved config (env substitution applied).

```bash
docker compose config
docker compose -f compose.yaml -f compose.prod.yaml config
```

**Scenario:** `${DB_HOST}` not resolving — `config` shows final values (redact before sharing).

---

### `docker compose stop` / `start` / `restart`

```bash
docker compose stop       # stop, keep containers
docker compose start      # resume stopped
docker compose restart api
```

**When:** Quick bounce without destroying containers (volumes and container ID preserved).

---

### Command quick reference

| Command | When you need it |
|---------|------------------|
| `up -d` | Start stack |
| `down` | Tear down stack |
| `ps` | Status check |
| `logs -f` | Debug |
| `exec` | Shell / CLI into running service |
| `run --rm` | One-off jobs (migrations, tests) |
| `build --no-cache` | Fix stale image |
| `config` | Validate YAML |

---

## 7. Complete Stack Examples

### Node.js + MongoDB + Redis

```yaml
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      MONGODB_URI: mongodb://mongo:27017/mydb
      REDIS_URL: redis://redis:6379
    depends_on:
      - mongo
      - redis
    volumes:
      - .:/app
      - /app/node_modules
    networks:
      - app-net

  mongo:
    image: mongo:6
    volumes:
      - mongo-data:/data/db
    networks:
      - app-net

  redis:
    image: redis:7-alpine
    networks:
      - app-net

networks:
  app-net:

volumes:
  mongo-data:
```

```bash
docker compose up -d
docker compose logs -f app
```

### Full stack: React + API + Postgres + Nginx

```yaml
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
      - public

  frontend:
    build: ./frontend
    expose:
      - "3000"
    networks:
      - public

  backend:
    build: ./backend
    expose:
      - "5000"
    environment:
      DATABASE_URL: postgres://user:pass@db:5432/mydb
    depends_on:
      db:
        condition: service_healthy
    networks:
      - public
      - private

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: mydb
    volumes:
      - postgres-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U user -d mydb"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - private

networks:
  public:
  private:
    internal: true

volumes:
  postgres-data:
```

**Traffic flow:**

```
Browser → nginx:80 → frontend:3000 (static)
                  → backend:5000 (API)
backend → db:5432 (private network only)
```

### Development with hot reload

```yaml
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      NODE_ENV: development
    command: npm run dev
```

---

## 8. Environment Variables & Secrets

### `.env` file (auto-loaded)

```
# .env — same directory as compose file, add to .gitignore
DB_PASSWORD=localdev123
API_KEY=dev-key
```

```yaml
services:
  api:
    environment:
      DB_PASSWORD: ${DB_PASSWORD}
      API_KEY: ${API_KEY:-default-key}
```

### Multiple compose files

```bash
docker compose -f compose.yaml -f compose.override.yaml up -d
```

`compose.override.yaml` — local dev overrides (auto-loaded if present).

### Production secrets

| Approach | Dev | Prod |
|----------|-----|------|
| `.env` file | ✓ | ✗ (never commit) |
| Shell env | ✓ | CI/CD inject |
| Docker secrets | Swarm | Swarm / K8s secrets |
| Vault / AWS SM | Optional | ✓ |

---

## 9. Networking in Compose

### Default behavior

All services join a **default network** named `{project}_default`. DNS: service name → container IP.

```yaml
services:
  api:
    image: myapi
    # connects to http://db:5432 automatically
  db:
    image: postgres
```

### Custom networks for isolation

See example in section 7 (nginx cannot reach db directly).

---

## 10. Advanced Patterns

### Pattern 1: One-off migrations

```bash
docker compose run --rm api npm run db:migrate
```

`--rm` removes container after exit. Doesn't affect running `api` service.

### Pattern 2: Profiles for optional services

```yaml
services:
  api:
    ...

  adminer:
    image: adminer
    ports:
      - "8081:8080"
    profiles:
      - debug
```

```bash
docker compose --profile debug up -d   # includes adminer
```

### Pattern 3: Override for prod

```yaml
# compose.prod.yaml
services:
  api:
  restart: always
  deploy:
    resources:
      limits:
        memory: 1G
  db:
  ports: []   # remove published ports
```

```bash
docker compose -f compose.yaml -f compose.prod.yaml up -d
```

### Pattern 4: Healthcheck-gated startup

Always use for databases — prevents "connection refused" race on first request.

### Pattern 5: Named project

```bash
docker compose -p myproject up -d
```

Isolates container names when running multiple copies on one host.

---

## 11. When to Use What — Decision Guide

```
How many containers?
 │
 ├─ One → docker run (see 01-Docker-Basics.md)
 │
 └─ Two or more → Docker Compose
        │
        ├─ Local dev → bind mounts + hot reload
        ├─ CI integration tests → compose up, run tests, compose down
        └─ Single-server prod → compose with prod overrides
               │
               └─ Multi-server / HA → Kubernetes, not Compose alone
```

| Need | Compose feature |
|------|-----------------|
| DB persists | named `volumes` |
| Live code edit | bind mount `.:/app` |
| Wait for DB | `healthcheck` + `depends_on` |
| Hide DB from internet | no `ports` on db, `internal` network |
| One-off task | `docker compose run --rm` |

---

## 12. Common Pitfalls & How to Avoid Them

### Pitfall 1: `localhost` in connection strings

**BAD:** `DATABASE_URL=postgres://localhost:5432/db` inside api container.

**GOOD:** `DATABASE_URL=postgres://db:5432/db` — service name as host.

---

### Pitfall 2: `depends_on` without healthcheck

**BAD:** API crashes on boot because Postgres isn't ready.

**GOOD:** `pg_isready` healthcheck + `condition: service_healthy`.

---

### Pitfall 3: `docker compose down -v` on prod data

**BAD:** Deletes named volumes.

**GOOD:** `docker compose down` without `-v`. Backup volumes separately.

---

### Pitfall 4: Publishing database ports unnecessarily

**BAD:** `ports: "5432:5432"` on db in production compose.

**GOOD:** No ports on db — only internal network access.

---

### Pitfall 5: Bind mount overwrites `node_modules`

**BAD:** `- .:/app` only — host's empty/wrong `node_modules` breaks app.

**GOOD:** Add anonymous volume `- /app/node_modules`.

---

### Pitfall 6: Committed `.env` with secrets

**BAD:** `API_KEY=sk_live_...` in git.

**GOOD:** `.env.example` with placeholders; real `.env` in `.gitignore`.

---

### Pitfall 7: Wrong compose file directory

**BAD:** Run `docker compose up` from parent directory — "no configuration file."

**GOOD:** `cd` to directory with `compose.yaml` or use `-f path/to/compose.yaml`.

---

## Summary Cheatsheet

| Task | Command |
|------|---------|
| Start stack | `docker compose up -d` |
| Stop & remove | `docker compose down` |
| Rebuild | `docker compose up -d --build` |
| Logs | `docker compose logs -f api` |
| Shell into service | `docker compose exec api sh` |
| One-off command | `docker compose run --rm api npm test` |
| Validate YAML | `docker compose config` |
| Scale (stateless) | `docker compose up -d --scale worker=3` |

**Default local stack template:** app (`build` + bind mount) + db (`image` + named volume) + custom network.

---

*Previous: [02-Dockerfile.md](./02-Dockerfile.md) · Next: [04-Docker-Networking.md](./04-Docker-Networking.md)*
