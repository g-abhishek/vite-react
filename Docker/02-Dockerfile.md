# Dockerfile — Complete Guide (Basics to Advanced)

> Learn to package any app into a Docker image — every instruction explained with scenarios, layer caching walkthroughs, and production-ready examples.

---

## Table of Contents

1. [What is a Dockerfile? — The Real Explanation](#1-what-is-a-dockerfile--the-real-explanation)
2. [Why Dockerfiles Matter — The Problems They Solve](#2-why-dockerfiles-matters--the-problems-they-solve)
3. [Core Concepts & Mental Models](#3-core-concepts--mental-models)
   - [Why `COPY package*.json` → `npm ci` → `COPY . .`?](#why-copy-packagejson--npm-ci--copy--)
4. [Instruction Reference — One by One](#4-instruction-reference--one-by-one)
5. [CMD vs ENTRYPOINT — The Confusion Killer](#5-cmd-vs-entrypoint--the-confusion-killer)
6. [Building Images — Commands & Workflow](#6-building-images--commands--workflow)
7. [Complete Dockerfile Examples](#7-complete-dockerfile-examples)
   - [Development & Hot Reload (full example)](#development--hot-reload-full-example)
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

### Why `COPY package*.json` → `npm ci` → `COPY . .`?

This order confuses many people. Two separate questions: **what** does `COPY . .` do, and **why** does it come **after** `npm ci`?

#### What does `COPY . .` do?

It copies files from your **build context** (the folder where you run `docker build`) into the image.

```dockerfile
WORKDIR /app
COPY . .
#    │  │
#    │  └── destination inside the image (because of WORKDIR → /app)
#    └── source on your machine (the . in docker build .)
```

Example — your project folder:

```
Your laptop (Docker/Test02-1/)     →     Image (/app/)
├── index.js                         →     /app/index.js
├── package.json                     →     /app/package.json
├── package-lock.json                →     /app/package-lock.json
└── Dockerfile                       →     /app/Dockerfile (unless .dockerignore)
```

After `COPY . .`, your app code (`index.js`) is inside the image. `CMD ["node", "index.js"]` can run it.

**Important:** `COPY . .` does **not** install dependencies. It only copies files. `express` (or other packages) must already be installed by a previous `RUN npm ci` step.

#### Why must `COPY . .` come **after** `npm ci`?

**Reason: Docker layer caching.**

Docker builds in **layers**. Each instruction creates a layer. If nothing relevant changed since the last build, Docker **reuses the cached layer** and skips that step.

**The Dockerfile pattern:**

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./    # Step A — only lockfiles
RUN npm ci               # Step B — install dependencies
COPY . .                 # Step C — application source code
CMD ["node", "index.js"]
```

| Step | What happens | How often does this layer change? |
|------|--------------|-----------------------------------|
| `COPY package*.json ./` | Copies only `package.json` + `package-lock.json` | Rarely — when you add/remove a dependency |
| `RUN npm ci` | Installs packages into `node_modules/` | Only when package files above changed |
| `COPY . .` | Copies `index.js`, source, config files | **Often** — every code edit |

**Scenario: you change only `index.js`**

With the **good order**:

```
COPY package*.json ./   →  CACHED ✓  (package.json unchanged)
RUN npm ci              →  CACHED ✓  (skipped — saves 10–30+ seconds)
COPY . .                →  REBUILD   (index.js changed)
CMD [...]               →  REBUILD
```

`npm ci` does not run again. Only copy + metadata rebuild.

With the **bad order**:

```dockerfile
COPY . .              # copies EVERYTHING first
RUN npm ci
```

```
COPY . .              →  REBUILD   (any file change — even index.js)
RUN npm ci            →  REBUILD   (full install again every time) ✗
```

Any change to **any** file invalidates `COPY . .`, so `npm ci` runs again even when `package.json` did not change.

#### Visual comparison

```
GOOD ORDER (package files → npm ci → source code)
────────────────────────────────────────────────

  package.json changes        index.js changes only
         │                            │
         ▼                            ▼
  COPY package*.json          COPY package*.json  ← CACHED
         │                            │
         ▼                            ▼
  RUN npm ci (slow)           RUN npm ci          ← CACHED ✓
         │                            │
         ▼                            ▼
  COPY . .                    COPY . .            ← rebuilds
         │                            │
         ▼                            ▼
  CMD                         CMD


BAD ORDER (COPY everything first)
─────────────────────────────────

  index.js changes only
         │
         ▼
  COPY . .              ← rebuilds (any file touched)
         │
         ▼
  RUN npm ci            ← runs again (wasteful) ✗
```

#### Walkthrough with a real Dockerfile

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./    # Only package.json + package-lock.json land in /app/
RUN npm ci               # Reads those files → creates /app/node_modules/express/...
COPY . .                 # index.js lands in /app/index.js (express already installed)
CMD ["node", "index.js"]
```

Rebuild after editing `index.js`:

```bash
docker build -t my-api .
```

You should see:

```
 => CACHED [3/5] COPY package*.json ./
 => CACHED [4/5] RUN npm ci
 => [5/5] COPY . .
```

`CACHED` on `npm ci` means Docker skipped reinstalling dependencies.

#### What if you only use `COPY . .` once (no separate package copy)?

```dockerfile
COPY . .
RUN npm ci
```

This **works** — the image will run fine. But every code change triggers a full `npm ci`. Fine for learning; slow for daily development and CI.

#### Mental model

```
COPY package*.json + npm ci  =  "install kitchen equipment" (expensive — cache this)
COPY . .                     =  "bring today's ingredients" (cheap — changes often)

Don't rebuild the entire kitchen every time you change one ingredient.
```

#### Quick reference

| Question | Answer |
|----------|--------|
| What does `COPY . .` do? | Copies project files from your folder into the image (into `/app` with `WORKDIR`) |
| Why after `npm ci`? | So code changes do not force `npm ci` to run again (layer cache) |
| Why `COPY package*.json` first? | Dependency files change less often than source — isolate the slow `npm ci` step |
| Can I use only `COPY . .`? | Yes, but builds are slower on every code change |

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

**Scenario:** Copy dependency manifest before source for cache. See [Why `COPY package*.json` → `npm ci` → `COPY . .`?](#why-copy-packagejson--npm-ci--copy--) for the full explanation of this order.

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

### Development & Hot Reload (full example)

**Runnable project:** `Docker/hot-reload-example/` — copy, run, edit `index.js`, watch the server restart.

#### The problem

In production you **bake** code into the image (`COPY . .`). Every code change requires `docker build` again — slow and wrong for day-to-day dev.

You want: edit a file on your laptop → server inside the container picks it up → process restarts → refresh browser. That is **hot reload in Docker**.

#### Mental model: two different Dockerfiles

```
Production (Dockerfile)          Development (Dockerfile.dev)
─────────────────────────        ─────────────────────────────
COPY source into image           Install deps only
Code lives IN the image            Code lives on your laptop
Change code → rebuild image      Change code → bind mount syncs instantly
CMD ["node", "index.js"]          CMD ["npm", "run", "dev"]  (nodemon)
```

Production and dev are **different goals**. Do not use one Dockerfile for both without trade-offs.

#### How it works (bind mount + file watcher)

```
Your laptop                    Docker container
───────────                    ────────────────
index.js  ──bind mount .:/app──►  /app/index.js  (same file, live)
                                 nodemon watches /app/index.js
                                 file change → restart node process
                                 Express serves new code
```

**Why not only `COPY . .` in dev?**  
`COPY` runs at **build time**. After the container starts, edits on your host are invisible inside the image. You need a **bind mount** so the container reads your live files.

**Why the anonymous `/app/node_modules` volume?**  
When you mount `.:/app`, you would also overwrite the container's `node_modules` with your host folder (often empty or built for macOS, not Linux). The anonymous volume keeps the Linux `node_modules` from `npm ci` inside the image.

```
volumes:
  - .:/app              # host source code wins
  - /app/node_modules   # container node_modules wins (shadows host)
```

#### File watcher gotcha (Mac / Windows)

Docker Desktop bind mounts do not always propagate inotify/fs events to Linux containers. **nodemon** may never see your save.

Fix (use at least one):

| Fix | Where |
|-----|--------|
| `"legacyWatch": true` in `nodemon.json` | Recommended |
| `CHOKIDAR_USEPOLLING=true` in compose | Fallback for stubborn setups |
| `nodemon --legacy-watch` in script | Same as nodemon.json flag |

The example uses both `nodemon.json` and `CHOKIDAR_USEPOLLING` for reliability on Docker Desktop.

#### `Dockerfile.dev`

```dockerfile
FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
RUN npm ci                    # includes nodemon (devDependency)

# Do NOT COPY source — compose bind mount provides it at runtime
EXPOSE 3000
CMD ["npm", "run", "dev"]
```

#### `docker-compose.dev.yml`

```yaml
services:
  api:
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
      CHOKIDAR_USEPOLLING: "true"
```

#### `package.json` + `nodemon.json`

```json
{
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js"
  },
  "devDependencies": {
    "nodemon": "^3.1.11"
  }
}
```

```json
{
  "watch": ["index.js", "nodemon.json"],
  "ext": "js,json",
  "legacyWatch": true
}
```

#### Try it (step by step)

```bash
cd Docker/hot-reload-example

# Start dev stack (builds image, mounts your folder, runs nodemon)
docker compose -f docker-compose.dev.yml up --build

# In another terminal — see current response
curl http://localhost:3000
# → {"message":"Hello from Docker with hot reload! ...","time":"..."}

# Edit index.js — change MESSAGE string, save
# Watch compose logs:
#   [nodemon] restarting due to changes...
#   [nodemon] starting `node index.js`

curl http://localhost:3000   # new message, new time

# Stop
docker compose -f docker-compose.dev.yml down
```

#### Production contrast (same folder)

```bash
docker build -t hot-reload-api:prod -f Dockerfile .
docker run -p 3000:3000 hot-reload-api:prod
# Edit index.js on host → NO effect (code is inside image)
```

#### Flow diagram

```
docker compose up
       │
       ▼
Build Dockerfile.dev (npm ci → node_modules in image)
       │
       ▼
Start container with bind mount .:/app
       │
       ▼
nodemon watches index.js
       │
       ▼
You save index.js on laptop
       │
       ▼
Watcher detects change (poll/legacyWatch)
       │
       ▼
nodemon kills old node → starts new node
       │
       ▼
Browser/curl sees updated response
```

#### Pros & cons

| Approach | Pros | Cons |
|----------|------|------|
| Bind mount + nodemon | Fast feedback, same deps as prod base image | Mac/Windows watcher quirks; not identical to prod filesystem |
| Rebuild image every change | Matches prod exactly | Too slow for dev |
| Run node on host, DB in Docker | Simplest hot reload | "Works on my machine"; skips containerized runtime |
| `docker compose watch` (Compose 2.22+) | Built-in sync/rebuild | Newer feature; still need restart command for Node |

#### Common mistakes

| Mistake | Symptom | Fix |
|---------|---------|-----|
| No bind mount | Saves do nothing | Add `- .:/app` in compose |
| Mount without `/app/node_modules` | `Cannot find module 'express'` | Anonymous volume for node_modules |
| `npm ci --omit=dev` in Dockerfile.dev | nodemon missing | Install devDependencies in dev image |
| No legacyWatch on Mac | Never restarts | `nodemon.json` or polling env |
| `COPY . .` then bind mount | Works but rebuilds cache oddly | Omit COPY in dev Dockerfile |

More compose patterns: `03-Docker-Compose.md`. Volume details: `05-Docker-Volumes.md`.

---

## 8. Multi-Stage Builds

### 1. What is a multi-stage build?

A **multi-stage build** is one Dockerfile with **multiple `FROM` instructions**. Each `FROM` starts a new **stage** — a separate filesystem that does not automatically carry over to the next stage.

```
Single-stage Dockerfile:
  Everything you install ends up in the final image
  (compilers, devDependencies, source code, test files)

Multi-stage Dockerfile:
  Stage 1 (builder)  →  compile, test, bundle
  Stage 2 (production) → copy ONLY the output files
  Stage 1 is thrown away — never ships to production
```

Think of it as a **factory floor vs showroom**:

```
Factory (builder stage)     Showroom (production stage)
├── welding machines        ├── finished product only
├── raw steel               ├── no factory equipment
├── safety gear             ├── small, clean, customer-ready
└── 800 MB                  └── 120 MB
```

Only the showroom image is tagged and pushed to your registry. The factory is dismantled after each build.

---

### 2. Why do multi-stage builds exist?

**Problem — fat production images:**

```dockerfile
# Single-stage Node + TypeScript API
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci                    # installs typescript, jest, eslint...
COPY . .
RUN npm run build             # creates dist/
CMD ["node", "dist/server.js"]
```

What is **inside the final image**:

| Included | Needed at runtime? |
|----------|-------------------|
| `dist/server.js` | Yes |
| `node_modules` (production deps) | Yes |
| `node_modules` (devDependencies) | No |
| `typescript`, `jest`, `@types/*` | No |
| Your full `src/` source | No |
| `.git`, test files | No |

Result: **~800 MB** image. Slow pulls on every deploy. Larger attack surface (more packages = more CVEs).

**Solution — multi-stage:**

```
Builder:  npm ci (all deps) + npm run build  →  produces dist/
Production: npm ci --only=production + COPY dist/ from builder
Result: ~120 MB — only runtime deps + compiled output
```

| Benefit | Real impact |
|---------|-------------|
| **Smaller images** | 30s deploy vs 5 min pull on slow networks |
| **Fewer CVEs** | No compilers, no dev tools in prod |
| **Faster scaling** | K8s pulls smaller image when scaling pods |
| **Security** | Source code and secrets used at build time stay out of prod image |

---

### 3. How it works — step by step

```dockerfile
FROM node:18-alpine AS builder    # Stage 1 named "builder"
# ... build steps ...

FROM node:18-alpine AS production # Stage 2 named "production" — fresh filesystem
COPY --from=builder /app/dist ./dist
# ... runtime steps ...
```

**What happens during `docker build`:**

```
Step 1: Start stage "builder"
        Fresh alpine + node — empty /app

Step 2: RUN npm ci, RUN npm run build
        Creates /app/dist, /app/node_modules (with dev deps)
        All cached as builder's layers

Step 3: Start stage "production"
        NEW fresh alpine + node — builder's files DO NOT exist here
        (unless you explicitly COPY --from=builder)

Step 4: COPY --from=builder /app/dist ./dist
        Docker copies ONLY /app/dist from builder → production

Step 5: Final image = production stage only
        builder stage is discarded
```

```
┌─────────────────────────────────────────────────────────────┐
│                    BUILD TIME                                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   STAGE 1: builder                                           │
│   ┌─────────────────────────────────────────────────────┐ │
│   │  FROM node:18-alpine AS builder                      │ │
│   │  npm ci          → node_modules (800 packages)       │ │
│   │  npm run build   → dist/server.js                    │ │
│   │  src/, tests/, typescript — all here                   │ │
│   └──────────────────────────┬──────────────────────────┘ │
│                              │                               │
│                    COPY --from=builder                       │
│                    (only what you copy)                      │
│                              │                               │
│                              ▼                               │
│   STAGE 2: production                                        │
│   ┌─────────────────────────────────────────────────────┐ │
│   │  FROM node:18-alpine AS production                   │ │
│   │  npm ci --only=production → lean node_modules        │ │
│   │  dist/server.js      ← copied from builder           │ │
│   │  NO src/, NO typescript, NO jest                     │ │
│   └─────────────────────────────────────────────────────┘ │
│                              │                               │
│                              ▼                               │
│                    FINAL IMAGE (what you push)                 │
│                    ~120 MB                                   │
│                                                              │
│   builder stage: DISCARDED — not in final image              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

### 4. Key syntax — `AS`, `COPY --from`, `--target`

#### `AS builder` — name a stage

```dockerfile
FROM node:18-alpine AS builder
```

Names this stage so later stages can reference it. Without `AS`, you can still use `--from=0` (stage index), but names are clearer.

#### `COPY --from=builder` — copy across stages

```dockerfile
COPY --from=builder /app/dist ./dist
#     │              │            │
#     │              │            └── destination in CURRENT stage
#     │              └── path in BUILDER stage
#     └── which stage to copy from
```

You can copy from **any previous stage** or even **another image**:

```dockerfile
COPY --from=nginx:alpine /etc/nginx/nginx.conf /etc/nginx/nginx.conf
```

#### `--target production` — build a specific stage

```bash
docker build --target production -t my-api:prod .
```

| Without `--target` | With `--target production` |
|--------------------|----------------------------|
| Builds **last** stage in Dockerfile | Builds **only up to** named stage |
| Default behavior | Use when Dockerfile has 3+ stages (dev, test, prod) |

---

### 5. Node.js multi-stage — full annotated Dockerfile

```dockerfile
# ── Stage 1: Build ────────────────────────────────────────────
FROM node:18-alpine AS builder
WORKDIR /app

# Layer cache: deps change less often than source code
COPY package*.json ./
RUN npm ci                    # installs ALL deps including devDependencies
                              # typescript, @types/node, jest, etc.

COPY . .                      # source code — changes frequently
RUN npm run build             # tsc / esbuild → outputs to dist/

# At this point builder contains:
#   dist/server.js     ← we need this
#   node_modules/      ← 600 MB, mostly dev deps — we DON'T copy this
#   src/               ← source — we DON'T copy this

# ── Stage 2: Production ───────────────────────────────────────
FROM node:18-alpine AS production
WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production  # ONLY runtime deps (express, pg, etc.)
                              # fresh install — no dev deps leak in

COPY --from=builder /app/dist ./dist   # ONLY the compiled output

USER node                     # non-root — security
EXPOSE 3000
CMD ["node", "dist/server.js"]
```

Build and run:

```bash
docker build --target production -t my-api:prod .
docker images my-api:prod
# REPOSITORY   TAG    SIZE
# my-api       prod   ~120MB   (vs ~800MB single-stage)

docker run -d -p 3000:3000 --name api my-api:prod
```

---

### 6. What to copy vs what to leave behind

| Artifact | Copy to production? | Why |
|----------|---------------------|-----|
| `dist/` or `build/` | Yes | Compiled output — this IS your app |
| `node_modules` (prod only) | Yes — via `npm ci --only=production` | Runtime dependencies |
| `node_modules` (from builder) | **No** | Contains devDependencies |
| `src/` | **No** | Source not needed — you run `dist/` |
| `package.json` | Yes | Needed for `npm ci --only=production` |
| `tsconfig.json`, `.eslintrc` | **No** | Build-time only |
| `tests/` | **No** | Never run tests in prod image |

**Common mistake — copying builder's node_modules:**

```dockerfile
# ❌ BAD — copies ALL deps including devDependencies
COPY --from=builder /app/node_modules ./node_modules

# ✅ GOOD — fresh production-only install
RUN npm ci --only=production
```

---

### 7. Real use cases

#### Use case A — TypeScript Express API

```
builder:   npm ci → tsc → dist/
production: npm ci --prod + dist/ → node dist/server.js
```

(See full example in section 5 above.)

#### Use case B — React / Vite frontend → nginx

Frontend builds to **static files** — no Node.js needed at runtime.

```dockerfile
# ── Stage 1: Build frontend ──────────────────────────────────
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build              # → dist/index.html, dist/assets/

# ── Stage 2: Serve with nginx ─────────────────────────────────
FROM nginx:alpine AS production
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

```
builder:  node + npm + vite + react  (~900 MB)
production: nginx + static HTML/JS/CSS  (~25 MB)
```

No Node.js in production at all — nginx serves files.

#### Use case C — Next.js standalone output

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build              # next build with output: 'standalone'

FROM node:18-alpine AS production
WORKDIR /app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
USER node
EXPOSE 3000
CMD ["node", "server.js"]
```

Next.js `standalone` mode bundles only required `node_modules` — even smaller production image.

#### Use case D — Three stages (build → test → prod)

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM builder AS test
RUN npm test                   # fails build if tests fail
# test stage is not the final image

FROM node:18-alpine AS production
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
USER node
CMD ["node", "dist/server.js"]
```

```bash
# CI runs tests as part of build — tests never in prod image
docker build --target production -t my-api:prod .
# If npm test fails → build fails → bad code never images
```

---

### 8. Go — extreme minimalism (scratch image)

Compiled languages benefit even more — the binary IS the app.

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

| Stage | Contents | Size |
|-------|----------|------|
| builder | Go compiler, source, modules | ~400 MB |
| scratch | Single binary only | **~10 MB** |

`scratch` = empty image. No shell, no `ls`, no `curl`. Smallest possible — ideal for Go/Rust.

**Trade-off:** you cannot `docker exec -it container sh` — debugging is harder.

---

### 9. Layer caching across stages

Each stage has **its own layer cache**. Optimize builder the same way as single-stage:

```dockerfile
# ✅ GOOD — package.json cached separately from source
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ❌ BAD — any source change reinstalls all deps
COPY . .
RUN npm ci
RUN npm run build
```

Production stage also caches `npm ci --only=production` when only `dist/` changes:

```
Change only src/api.ts:
  builder: npm ci CACHED, COPY . . rebuilds, npm run build rebuilds
  production: npm ci CACHED, COPY --from=builder dist/ rebuilds
```

---

### 10. Verify what is actually in your image

```bash
# Compare sizes
docker images my-api:prod my-api:single-stage

# List files in production image
docker run --rm my-api:prod ls -la /app
# Should see: dist/, node_modules/, package.json
# Should NOT see: src/, tsconfig.json, tests/

# Check for devDependencies leak
docker run --rm my-api:prod ls node_modules | grep typescript
# Should return nothing

# Dive tool — layer-by-layer analysis
docker run --rm -it \
  -v /var/run/docker.sock:/var/run/docker.sock \
  wagoodman/dive my-api:prod
```

---

### 11. Common pitfalls

#### Pitfall 1 — Copying builder's node_modules

```dockerfile
# ❌ Brings devDependencies into production
COPY --from=builder /app/node_modules ./node_modules

# ✅ Fresh production install
RUN npm ci --only=production
```

#### Pitfall 2 — Forgetting `COPY --from` path

```dockerfile
RUN npm run build    # outputs to dist/
COPY --from=builder /app/build ./dist   # ❌ wrong path — empty dir!
COPY --from=builder /app/dist ./dist    # ✅ match your build output
```

Check your `tsconfig.json` `outDir` or bundler output path.

#### Pitfall 3 — Native modules (bcrypt, sharp)

Native addons compile against builder's architecture. If builder and production use **same base image** (`node:18-alpine` both stages), you're fine.

If stages differ (builder: debian, prod: alpine) → native modules break.

```dockerfile
# ✅ Same base for both stages when using native modules
FROM node:18-alpine AS builder
FROM node:18-alpine AS production
```

#### Pitfall 4 — `.dockerignore` still matters

Multi-stage does not fix bloated build context. Exclude `node_modules` from context — let `npm ci` install inside the image.

#### Pitfall 5 — Debugging scratch/distroless images

No shell in `scratch` or `gcr.io/distroless`. For debugging, use a temporary debug stage:

```dockerfile
FROM node:18-alpine AS production
# ... prod image ...

FROM production AS debug
USER root
RUN apk add --no-cache curl bind-tools
```

```bash
docker build --target debug -t my-api:debug .
docker run -it my-api:debug sh
```

---

### 12. When to use multi-stage vs single-stage

```
Does your build step produce artifacts separate from source?
 │
 ├─ TypeScript → dist/        → YES, multi-stage
 ├─ React/Vite → static files → YES, multi-stage (→ nginx)
 ├─ Go/Rust → binary          → YES, multi-stage (→ scratch)
 ├─ Plain Node.js (no build)  → MAYBE — single-stage alpine is fine
 │   COPY + npm ci --prod already lean if no devDeps installed
 └─ Local dev Dockerfile.dev  → NO — single-stage + bind mount
```

| Approach | Image size | Complexity |
|----------|------------|------------|
| Single-stage + `npm ci --only=production` | ~200 MB | Low |
| Multi-stage (Node compiled) | ~120 MB | Medium |
| Multi-stage → nginx (frontend) | ~25 MB | Medium |
| Multi-stage → scratch (Go) | ~10 MB | Medium |

---

### 13. Pros & cons

| Pros | Cons |
|------|------|
| Much smaller images | More complex Dockerfile |
| Fewer CVEs in prod image | Must know build output paths |
| Build tools never in prod | Harder to debug scratch/distroless |
| Can run tests in build stage | Native modules need matching bases |
| Faster deploys and K8s pulls | Learning curve for `COPY --from` |

---

### Mental model

```
Multi-stage = photograph the finished dish, throw away the kitchen

Stage 1 (builder):  messy, tools everywhere, raw ingredients
Stage 2 (production): only the plated dish leaves the restaurant

COPY --from=builder  =  "bring only this plate from the kitchen"
--target production  =  "customers only see the dining room, not the kitchen"
```

**Golden rule:** if you would not run it in production (`tsc`, `jest`, `webpack`), it must not be in the final image. Multi-stage enforces that automatically.

### Go — minimal scratch image (reference)

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

> Full explanation with diagrams: [Why `COPY package*.json` → `npm ci` → `COPY . .`?](#why-copy-packagejson--npm-ci--copy--)

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

**Why:** `COPY . .` copies **all** project files. Docker invalidates that layer when **any** file changes. If `npm ci` comes after `COPY . .`, every edit to `index.js` (or README, or `.gitignore`) forces a full dependency reinstall — even when `package.json` did not change.

**What `COPY . .` actually does:** copies files from your build context into the image (e.g. into `/app/`). It does **not** install packages — that is `RUN npm ci`'s job. The order matters for **caching**, not because copy installs dependencies.

**Verify caching works:**

```bash
# Edit only index.js, then rebuild — expect CACHED on npm ci
docker build -t my-api .
```

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
FROM → WORKDIR → COPY package*.json → RUN npm ci → COPY . . → USER → EXPOSE → HEALTHCHECK → CMD
```

**Why `COPY . .` after `npm ci`:** `COPY . .` only copies files (not install). Order is for **layer cache** — code changes should not rerun `npm ci`. See [full explanation](#why-copy-packagejson--npm-ci--copy--).

---

*Previous: [01-Docker-Basics.md](./01-Docker-Basics.md) · Next: [03-Docker-Compose.md](./03-Docker-Compose.md)*
