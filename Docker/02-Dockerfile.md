# Dockerfile — Complete Guide (Basics to Advanced)

> Learn to package any app into a Docker image — every instruction explained with scenarios, layer caching walkthroughs, and production-ready examples.

---

## Table of Contents

1. [What is a Dockerfile? — The Real Explanation](#1-what-is-a-dockerfile--the-real-explanation)
2. [Why Dockerfiles Matter — The Problems They Solve](#2-why-dockerfiles-matters--the-problems-they-solve)
3. [Core Concepts & Mental Models](#3-core-concepts--mental-models)
4. [Instruction Reference — One by One](#4-instruction-reference--one-by-one)
5. [CMD vs ENTRYPOINT — The Confusion Killer](#5-cmd-vs-entrypoint--the-confusion-killer)
6. [Building Images — Commands & Workflow](#6-building-images--commands--workflow)
7. [Complete Dockerfile Examples](#7-complete-dockerfile-examples)
8. [Multi-Stage Builds](#8-multi-stage-builds)
9. [.dockerignore — Protect Your Build](#9-dockerignore--protect-your-build)
10. [Advanced Patterns](#10-advanced-patterns)
11. [When to Use What — Decision Guide](#11-when-to-use-what--decision-guide)
12. [Common Pitfalls & How to Avoid Them](#12-common-pitfalls--how-to-avoid-them)
13. [Summary Cheatsheet](#summary-cheatsheet)

---

## 1. What is a Dockerfile? — The Real Explanation

A **Dockerfile** is a text recipe that tells Docker how to build an **image**. Each line is an instruction; each instruction (usually) creates one **read-only layer**.

### Analogy: baking instructions

```
Recipe card (Dockerfile)  →  Baked cake (Image)  →  Slice served (Container)
```

You don't ship your kitchen to production. You ship the **recipe** so anyone can bake the **same cake**.

### Minimal example

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

Build it:

```bash
docker build -t my-api:v1 .
docker run -d -p 3000:3000 my-api:v1
```

**What happened:** Docker read each line top-to-bottom, executed build steps, cached layers, and produced image `my-api:v1`.

---

## 2. Why Dockerfiles Matter — The Problems They Solve

### Problem 1: "Install these 15 things first"

README says: install Node 18, Python, libvips, Redis client libs… New hire spends a day fixing paths.

**With Dockerfile:** Environment is code. `docker build` reproduces it exactly.

### Problem 2: Drift between dev and prod

Dev uses `npm install`; prod uses `npm ci`. Subtle version differences cause prod-only bugs.

**With Dockerfile:** One `RUN npm ci` line — same lockfile, same image everywhere.

### Problem 3: Giant images, slow deploys

Shipping full Ubuntu + build tools + source = 2 GB image, 5-minute deploys.

**With Dockerfile + multi-stage:** Final image contains only the runtime binary — 50 MB, 30-second deploys.

### Problem 4: Security holes from convenience

`FROM node:latest`, run as root, copy `.env` into image.

**With Dockerfile discipline:** Pinned base, non-root `USER`, secrets at runtime — smaller attack surface.

### Problem 5: Slow rebuilds on every code change

Copy entire repo first, then `npm install` — any file change reinstalls all dependencies.

**With layer order:** Dependencies layer cached; only app code layer rebuilds.

---

## 3. Core Concepts & Mental Models

| Term | Meaning |
|------|---------|
| **Build context** | Files Docker can see during `docker build` (the `.` path) |
| **Layer** | Cached snapshot after each instruction |
| **Build-time** | Happens during `docker build` (`RUN`, `COPY`) |
| **Run-time** | Happens when container starts (`CMD`, `ENTRYPOINT`) |
| **ARG** | Variable only during build |
| **ENV** | Variable in build **and** running container |

### Layer caching flow

```
Change server.js only:
  FROM node:18     ✓ cached
  COPY package*    ✓ cached
  RUN npm ci       ✓ cached
  COPY . .         ✗ rebuild (this layer + below)
  CMD [...]        ✗ rebuild metadata
```

---

## 4. Instruction Reference — One by One

Each instruction: **what it does**, **when to use it**, **example**, **how it helps**.

---

### `FROM` — Pick your foundation

**What:** Base image — OS + runtime. Must be first instruction (except `ARG` before `FROM`).

**Scenario:** Node API needs Node 18 on a small Linux base.

```dockerfile
FROM node:18-alpine
```

| Base choice | Size (approx) | When to use |
|-------------|---------------|-------------|
| `node:18` | ~1 GB | Need full Debian tools |
| `node:18-slim` | ~200 MB | Balance of size + glibc compatibility |
| `node:18-alpine` | ~170 MB | Default for most Node apps |
| `gcr.io/distroless/nodejs18` | ~100 MB | Production, no shell needed |
| `scratch` | 0 | Static Go binaries only |

**How it helps:** Everything else builds on this layer. Pin versions: `node:18.17.0-alpine3.18` not `latest`.

```dockerfile
# ARG before FROM — dynamic base version
ARG NODE_VERSION=18
FROM node:${NODE_VERSION}-alpine
```

---

### `WORKDIR` — Set the current directory

**What:** Creates directory (if needed) and sets cwd for following instructions.

**Scenario:** Your app expects to run from `/app`, not `/`.

```dockerfile
WORKDIR /app
COPY package.json .    # lands in /app/package.json
RUN npm ci             # runs in /app
```

**How it helps:** Avoids `cd` in every `RUN`. Cleaner paths in `COPY` and `CMD`.

**Pitfall:** Multiple `WORKDIR` lines stack paths (`WORKDIR /a` then `WORKDIR b` → `/a/b`).

---

### `COPY` — Bring files into the image

**What:** Copy from **build context** (host) into image.

**Scenario:** Copy dependency manifest before source for cache.

```dockerfile
COPY package*.json ./
COPY src/ ./src/
COPY --chown=node:node . .
```

| Form | Meaning |
|------|---------|
| `COPY src dest` | Copy file or directory |
| `COPY --chown=user:group` | Set ownership (use with non-root `USER`) |
| `COPY --from=builder /app/dist ./dist` | Copy from another build stage |

**How it helps:** Only files in build context can be copied — that's why `.dockerignore` matters.

---

### `ADD` — COPY plus extras (usually avoid)

**What:** Like `COPY`, but also auto-extracts local `.tar` archives and *can* fetch URLs.

```dockerfile
ADD local-archive.tar.gz /app/   # OK — auto-extract
ADD https://example.com/file .   # BAD — unpredictable, not cached well
```

**Rule:** Use `COPY` unless you specifically need tar extraction. **Pros/cons:**

| | COPY | ADD |
|---|------|-----|
| Simple file copy | ✓ | ✓ |
| Tar auto-extract | ✗ | ✓ |
| URL download | ✗ | ✓ (avoid) |
| Predictable caching | ✓ | ✗ for URLs |

---

### `RUN` — Execute during build

**What:** Runs shell command; result is baked into a layer.

**Scenario:** Install OS packages and Node dependencies.

```dockerfile
# Shell form — runs through /bin/sh -c
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Exec form — no shell, no variable expansion
RUN ["npm", "ci", "--only=production"]
```

**How it helps:** Installs happen once at build time, not every container start.

**Layer tip — combine and clean in one RUN:**

```dockerfile
# BAD — apt cache stays in layer 1 even if layer 2 deletes it
RUN apt-get update && apt-get install -y curl
RUN rm -rf /var/lib/apt/lists/*

# GOOD — delete in same layer as install
RUN apt-get update && \
    apt-get install -y curl && \
    rm -rf /var/lib/apt/lists/*
```

---

### `ENV` — Environment variables (build + runtime)

**What:** Sets env vars visible when container runs (and in subsequent Dockerfile lines).

```dockerfile
ENV NODE_ENV=production
ENV PORT=3000
```

**Scenario:** App reads `process.env.PORT`. Set default in image; override at `docker run -e PORT=4000`.

**How it helps:** Documents expected config. Persists in `docker inspect`.

---

### `ARG` — Build-time only variables

**What:** Variables for `docker build`; **not** in running container unless you copy to `ENV`.

```dockerfile
ARG BUILD_VERSION=dev
ARG NODE_VERSION=18
FROM node:${NODE_VERSION}-alpine
LABEL version=$BUILD_VERSION
```

```bash
docker build --build-arg BUILD_VERSION=1.4.2 -t my-api:1.4.2 .
```

**ARG vs ENV:**

| | ARG | ENV |
|---|-----|-----|
| Available at build | ✓ | ✓ |
| Available at runtime | ✗ | ✓ |
| Override at run | ✗ | `docker run -e` |
| Override at build | `--build-arg` | Dockerfile only |

---

### `EXPOSE` — Document ports (does not publish)

**What:** Metadata saying "this container listens on port X."

```dockerfile
EXPOSE 3000
EXPOSE 8080/tcp
```

**Scenario:** Teammate reads Dockerfile to know which port to map.

```bash
docker run -p 3000:3000 my-api   # YOU must publish with -p
```

**How it helps:** Documentation + some orchestration tools read it. **Does NOT** open ports on host.

---

### `VOLUME` — Declare mount points

**What:** Tells Docker "data here should persist outside container layer."

```dockerfile
VOLUME /var/lib/postgresql/data
```

**Scenario:** Database image; data must survive container delete.

**How it helps:** Creates anonymous volume if user doesn't specify `-v`. Prefer explicit named volumes in `docker run` or Compose.

---

### `USER` — Run as non-root

**What:** Switch user for subsequent instructions and container runtime.

```dockerfile
RUN addgroup -S app && adduser -S app -G app
COPY --chown=app:app . .
USER app
CMD ["node", "server.js"]
```

**How it helps:** If attacker escapes container process, they're not root on host. See `06-Docker-Security.md`.

---

### `LABEL` — Metadata

```dockerfile
LABEL maintainer="team@example.com"
LABEL version="1.4.2"
LABEL org.opencontainers.image.source="https://github.com/org/repo"
```

**How it helps:** Traceability in registries and compliance audits.

---

### `HEALTHCHECK` — Is the app actually ready?

**What:** Docker periodically runs a command; marks container healthy/unhealthy.

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1
```

**Scenario:** API starts but DB connection fails for 20 seconds. Orchestrator waits for `healthy` before routing traffic.

| Flag | Meaning |
|------|---------|
| `interval` | Time between checks |
| `timeout` | Max time for check command |
| `start-period` | Grace period after start |
| `retries` | Failures before `unhealthy` |

**How it helps:** Compose `depends_on: condition: service_healthy` uses this.

```dockerfile
HEALTHCHECK NONE   # Disable healthcheck inherited from base image
```

---

## 5. CMD vs ENTRYPOINT — The Confusion Killer

### Mental model

- **ENTRYPOINT** = the program (fixed: `node`, `python`, `/entrypoint.sh`)
- **CMD** = default arguments (easy to override)

### Pattern 1: CMD only (most Node apps)

```dockerfile
CMD ["node", "server.js"]
```

```bash
docker run my-api                    # node server.js
docker run my-api node worker.js     # OVERRIDES entire CMD → node worker.js
```

### Pattern 2: ENTRYPOINT + CMD (CLI-style images)

```dockerfile
ENTRYPOINT ["python"]
CMD ["app.py"]
```

```bash
docker run mytool                    # python app.py
docker run mytool script.py          # python script.py  (CMD replaced, ENTRYPOINT kept)
docker run --entrypoint python3 mytool app.py
```

### Comparison table

| Feature | CMD | ENTRYPOINT |
|---------|-----|------------|
| Override with `docker run args` | Replaces whole CMD | Args append/replace CMD |
| Override mechanism | Just pass command | Need `--entrypoint` to change program |
| Best for | Single default start command | Wrapper scripts, CLI tools |

### Flow diagram

```
Container starts
       │
       ▼
 ENTRYPOINT defined? ──NO──► Run CMD
       │
      YES
       ▼
 Run ENTRYPOINT + CMD (as default args)
       │
       ▼
 docker run ... extra args?
       │
       ├─ Replaces CMD (ENTRYPOINT + CMD pattern)
       └─ Replaces CMD entirely (CMD-only pattern)
```

---

## 6. Building Images — Commands & Workflow

### `docker build`

```bash
docker build -t my-api:v1 .
```

| Flag | Scenario |
|------|----------|
| `-t name:tag` | Name the output image |
| `-f Dockerfile.prod` | Non-default Dockerfile |
| `--no-cache` | Debug stale cache |
| `--build-arg KEY=val` | Pass ARG values |
| `--target production` | Stop at named stage |
| `--progress=plain` | Verbose build output |

**Build context explained:**

```bash
cd ~/projects/my-api
docker build -t my-api .
#                    └── everything in this folder sent to daemon (except .dockerignore)
```

Large context = slow build. **Always** use `.dockerignore`.

### Verify your image

```bash
docker images my-api
docker history my-api:v1
docker run --rm my-api:v1 node -e "console.log('ok')"
```

---

## 7. Complete Dockerfile Examples

### Node.js API (production)

```dockerfile
# ── Base ──────────────────────────────────────────────────────
FROM node:18-alpine

# ── Dependencies (cached layer) ───────────────────────────────
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# ── App code ──────────────────────────────────────────────────
COPY . .

# ── Security ──────────────────────────────────────────────────
RUN addgroup -S app && adduser -S app -G app && chown -R app:app /app
USER app

# ── Runtime ───────────────────────────────────────────────────
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget -qO- http://localhost:3000/health || exit 1
CMD ["node", "server.js"]
```

**Build & run:**

```bash
docker build -t my-api:v1 .
docker run -d -p 3000:3000 --name api my-api:v1
curl http://localhost:3000/health
```

### Python API

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN useradd -m appuser && chown -R appuser:appuser /app
USER appuser

EXPOSE 8000
CMD ["python", "app.py"]
```

### Development Dockerfile (hot reload)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]
```

Use with Compose bind mount — see `03-Docker-Compose.md`.

---

## 8. Multi-Stage Builds

### The idea

Stage 1 has compilers and devDependencies. Stage 2 copies **only artifacts** into a slim image.

```
┌─────────────┐     COPY dist/      ┌─────────────┐
│   builder   │ ──────────────────► │  production │
│ npm ci      │                     │ npm ci --prod│
│ npm build   │                     │ node dist/  │
│ 800 MB      │                     │ 120 MB      │
└─────────────┘                     └─────────────┘
```

### Node.js multi-stage

```dockerfile
# ── Stage 1: Build ────────────────────────────────────────────
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ── Stage 2: Production ───────────────────────────────────────
FROM node:18-alpine AS production
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
USER node
EXPOSE 3000
CMD ["node", "dist/server.js"]
```

```bash
docker build --target production -t my-api:prod .
```

### Go — minimal scratch image

```dockerfile
FROM golang:1.21-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /main .

FROM scratch
COPY --from=builder /main /main
EXPOSE 8080
ENTRYPOINT ["/main"]
```

**How it helps:** Final image has no shell, no package manager — tiny and hard to attack.

### Pros & cons

| Pros | Cons |
|------|------|
| Much smaller images | More complex Dockerfile |
| Fewer CVEs in prod image | Must understand stage naming |
| Build tools never in prod | Debugging prod image harder (no shell) |

---

## 9. .dockerignore — Protect Your Build

**What:** Like `.gitignore` — excludes files from build context.

**Scenario:** Without it, `COPY . .` sends 400 MB `node_modules` to daemon every build.

```
node_modules
.git
.env
.env.*
dist
coverage
*.log
Dockerfile*
docker-compose*
README.md
.vscode
```

**How it helps:**
- Faster builds (less data sent)
- Smaller layers (no accidental secrets)
- Better cache hits

---

## 10. Advanced Patterns

### Pattern 1: BuildKit cache mounts (faster npm/pip)

```dockerfile
# syntax=docker/dockerfile:1
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --only=production
```

```bash
DOCKER_BUILDKIT=1 docker build -t my-api .
```

### Pattern 2: Build secrets (never in image layers)

```bash
# Not: ARG NPM_TOKEN in Dockerfile (can leak in history)
DOCKER_BUILDKIT=1 docker build \
  --secret id=npmrc,src=$HOME/.npmrc \
  -t my-api .
```

### Pattern 3: Init wrapper for signal handling

Node doesn't handle PID 1 signals well. Use `dumb-init` or `tini`:

```dockerfile
RUN apk add --no-cache dumb-init
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
```

**How it helps:** `docker stop` sends SIGTERM; app shuts down gracefully.

### Pattern 4: Separate dev and prod Dockerfiles

```
Dockerfile          # production
Dockerfile.dev      # dev with hot reload tools
```

Compose picks via `dockerfile: Dockerfile.dev`.

---

## 11. When to Use What — Decision Guide

```
Packaging your app?
 │
 ├─ Simple Node/Python API?
 │     └─► Single-stage alpine + non-root USER
 │
 ├─ Frontend build (React/Vite) + static server?
 │     └─► Multi-stage: build → nginx:alpine
 │
 ├─ Go/Rust binary?
 │     └─► Multi-stage → scratch or distroless
 │
 ├─ Need shell in production container?
 │     └─► alpine/slim (not distroless)
 │
 └─ Local dev only?
       └─► Dockerfile.dev + Compose bind mount
```

| Instruction | Use when |
|-------------|----------|
| `COPY` | Always for files |
| `ADD` | Local tar extract only |
| `ENV` | Runtime config defaults |
| `ARG` | Version pins at build time |
| `HEALTHCHECK` | Orchestration / depends_on healthy |
| `USER` | Always in production |

---

## 12. Common Pitfalls & How to Avoid Them

### Pitfall 1: `COPY . .` before `RUN npm ci`

**BAD:**

```dockerfile
COPY . .
RUN npm ci
```

**GOOD:**

```dockerfile
COPY package*.json ./
RUN npm ci
COPY . .
```

**Why:** Every code change invalidates npm install layer.

---

### Pitfall 2: Secrets in Dockerfile or image

**BAD:**

```dockerfile
ENV API_KEY=sk_live_xxx
COPY .env .
```

**GOOD:**

```bash
docker run -e API_KEY=$API_KEY my-api
# or secrets manager / Compose env_file (not committed)
```

---

### Pitfall 3: `latest` base image

**BAD:** `FROM node:latest`

**GOOD:** `FROM node:18.17.0-alpine3.18`

---

### Pitfall 4: Running as root

**BAD:** No `USER` line — container runs as root.

**GOOD:** Create user, `COPY --chown`, `USER app`.

---

### Pitfall 5: Shell form CMD and signal issues

**BAD:** `CMD npm start` (runs as shell, PID 1 issues)

**GOOD:** `CMD ["npm", "start"]` or use `dumb-init`.

---

### Pitfall 6: Forgetting EXPOSE ≠ publish

**BAD:** `EXPOSE 3000` then wonder why `curl localhost:3000` fails.

**GOOD:** `docker run -p 3000:3000 my-api`

---

### Pitfall 7: Huge build context

**BAD:** No `.dockerignore`, copying `node_modules` and `.git`.

**GOOD:** `.dockerignore` + verify with `docker build` timing.

---

## Summary Cheatsheet

| Instruction | Purpose | Remember |
|-------------|---------|----------|
| `FROM` | Base image | Pin version |
| `WORKDIR` | cd into directory | One clear path |
| `COPY` | Add files | deps before source |
| `RUN` | Build steps | combine + cleanup |
| `ENV` | Runtime env | defaults |
| `ARG` | Build-only vars | `--build-arg` |
| `EXPOSE` | Document port | still need `-p` |
| `USER` | Non-root | production must |
| `HEALTHCHECK` | Readiness | for Compose depends |
| `CMD` | Default command | easy override |
| `ENTRYPOINT` | Fixed executable | CLI pattern |

**Default production Dockerfile order:**

```
FROM → WORKDIR → COPY deps → RUN install → COPY app → USER → EXPOSE → HEALTHCHECK → CMD
```

---

*Previous: [01-Docker-Basics.md](./01-Docker-Basics.md) · Next: [03-Docker-Compose.md](./03-Docker-Compose.md)*
