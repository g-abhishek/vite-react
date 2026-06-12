# Docker Basics — Complete Guide (Basics to Advanced)

> A practical, story-driven guide to Docker fundamentals — every command explained with real scenarios so you understand *why*, not just *what* to type.

---

## Table of Contents

1. [What is Docker? — The Real Explanation](#1-what-is-docker--the-real-explanation)
2. [Why Docker Matters — The Problems It Solves](#2-why-docker-matters--the-problems-it-solves)
3. [Core Concepts & Mental Models](#3-core-concepts--mental-models)
4. [Docker Architecture — Who Does What](#4-docker-architecture--who-does-what)
5. [Containers vs Virtual Machines](#5-containers-vs-virtual-machines)
6. [Image Commands — Build Your Toolbox](#6-image-commands--build-your-toolbox)
7. [Container Commands — Run and Manage Apps](#7-container-commands--run-and-manage-apps)
8. [System Commands — Keep Docker Healthy](#8-system-commands--keep-docker-healthy)
9. [Image Layers — How Docker Stays Fast](#9-image-layers--how-docker-stays-fast)
10. [Advanced Patterns](#10-advanced-patterns)
11. [When to Use What — Decision Guide](#11-when-to-use-what--decision-guide)
12. [Common Pitfalls & How to Avoid Them](#12-common-pitfalls--how-to-avoid-them)
13. [Summary Cheatsheet](#summary-cheatsheet)

---

## 1. What is Docker? — The Real Explanation

**Docker** is a platform that packages your application — code, runtime, libraries, and config — into a **container**: a lightweight, isolated process that runs the same way on your laptop, a teammate's machine, CI, staging, and production.

### The mental model: shipping containers

Before standardized shipping containers, every port loaded cargo differently. A barrel of oil, a crate of bananas, a pallet of electronics — each needed custom handling. Containers changed that: one standard box, any ship, any truck, any crane.

Docker does the same for software:

```
WITHOUT Docker                         WITH Docker
─────────────────                      ─────────────────
Dev machine:  Node 18, works           Dev:   container runs Node 18
Staging:     Node 16, breaks           Stage: same container image
Prod:        missing lib, crashes      Prod:  same container image
```

Your app is not "installed on a server." It is **shipped as an image** and **run as a container** — identical everywhere.

### What Docker is NOT

| Misconception | Reality |
|---------------|---------|
| "Docker is a VM" | Containers share the host OS kernel — no guest OS per app |
| "Docker replaces Kubernetes" | Docker *runs* containers; Kubernetes *orchestrates* many containers across machines |
| "Docker is only for production" | Most teams use it locally first (Postgres, Redis, full stack) |

---

## 2. Why Docker Matters — The Problems It Solves

### Problem 1: "Works on my machine"

**Scenario:** You build a Node app on macOS. Your colleague uses Ubuntu. Production runs Amazon Linux. `node-gyp` fails on one machine, `sharp` installs wrong binaries on another.

**Without Docker:** Everyone maintains their own environment. Bugs appear only in CI or prod.

**With Docker:** One `Dockerfile` defines the environment. Everyone runs `docker build` and gets the same image.

```bash
# Same command, same result on any OS with Docker installed
docker build -t my-api:v1 .
docker run -p 3000:3000 my-api:v1
```

### Problem 2: Onboarding takes days

**Scenario:** New hire needs Postgres 15, Redis 7, Elasticsearch, and your API. README says "install these 12 things."

**With Docker:** `docker compose up` starts the entire stack in minutes. No polluting the host machine.

### Problem 3: Dependency conflicts

**Scenario:** Project A needs Python 3.9. Project B needs Python 3.12. Installing both globally is painful.

**With Docker:** Each project runs in its own container with its own Python version. No conflict.

### Problem 4: Inconsistent CI and production

**Scenario:** Tests pass in GitHub Actions but fail in production because the runner used a different base image.

**With Docker:** CI builds the same image you deploy. If it runs in the container locally, it runs the same in prod.

### Problem 5: Scaling and isolation

**Scenario:** Three microservices on one server — one crashes and takes down shared libraries, or one eats all RAM.

**With Docker:** Each service runs in an isolated container with its own filesystem and resource limits (`cgroups`).

### Problem 6: Rollbacks are slow

**Scenario:** Bad deploy. You need to revert to last week's version.

**With Docker:** Images are versioned (`myapp:v1.2.3`). Rollback = run the previous image tag. No reinstalling packages on the server.

---

## 3. Core Concepts & Mental Models

Learn these five words and 90% of Docker clicks into place.

### Image

A **read-only template** — like a recipe or a ISO snapshot. It contains your app, OS libraries, and config. You **build** or **pull** images; you don't "run" an image directly in daily speech (technically `docker run` takes an image and creates a container).

```
Image = Class (blueprint)
Container = Object (running instance)
```

### Container

A **running instance** of an image. It gets a thin **writable layer** on top of the read-only image. When you delete the container, that writable layer is gone (unless you used volumes — see `05-Docker-Volumes.md`).

### Registry

A **store for images** — Docker Hub, GitHub Container Registry, AWS ECR, Google Artifact Registry. `docker pull` downloads; `docker push` uploads.

### Dockerfile

A text file of instructions (`FROM`, `COPY`, `RUN`…) that tells Docker how to **build** an image. Covered in depth in `02-Dockerfile.md`.

### Daemon (dockerd)

The **background service** that actually creates containers, manages networks, and stores images. The `docker` CLI talks to it.

### How they connect

```
Dockerfile  ──build──►  Image  ──run──►  Container
                            ▲
                         pull/push
                            │
                        Registry
```

---

## 4. Docker Architecture — Who Does What

```
┌──────────────────────────────────────────────────────────┐
│                      Docker Client                        │
│              (you type: docker run, build, pull)          │
└────────────────────────┬─────────────────────────────────┘
                         │ REST API (local socket)
                         ▼
┌──────────────────────────────────────────────────────────┐
│                      Docker Host                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │              Docker Daemon (dockerd)                │  │
│  │   creates containers, networks, volumes, images     │  │
│  └────────────────────────────────────────────────────┘  │
│  ┌─────────────────┐  ┌─────────────────────────────┐   │
│  │   Containers    │  │          Images             │   │
│  │  (running apps) │  │   (read-only templates)     │   │
│  └─────────────────┘  └─────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘
                         │
                         ▼ pull / push
┌──────────────────────────────────────────────────────────┐
│                    Docker Registry                        │
│              (Docker Hub, ECR, ghcr.io, …)                │
└──────────────────────────────────────────────────────────┘
```

| Component | Role | You interact via |
|-----------|------|------------------|
| **Client** | Sends commands | Terminal: `docker …` |
| **Daemon** | Does the work | Rarely directly; `systemctl status docker` on Linux |
| **Images** | Stored templates | `docker images`, `docker pull` |
| **Containers** | Running processes | `docker ps`, `docker run` |
| **Registry** | Remote image storage | `docker pull nginx`, `docker push` |

**Why this matters:** When `docker run` "hangs," the client is waiting on the daemon. When pull is slow, it's network + registry, not your Dockerfile.

---

## 5. Containers vs Virtual Machines

### Analogy

- **VM** = building a whole new house on your property (foundation, plumbing, electricity) for each family.
- **Container** = prefab room modules snapped onto the same foundation — shared utilities, separate living space.

### Comparison

| Feature | Container | Virtual Machine |
|---------|-----------|-----------------|
| OS | Shares host kernel | Full guest OS per VM |
| Size | Often 10–500 MB | Often 2–20+ GB |
| Boot time | Seconds | Minutes |
| Isolation | Process + namespaces | Hardware-level hypervisor |
| Density | Hundreds per host | Fewer per host |

```
┌─────────── VMs ───────────┐     ┌────── Containers ──────┐
│ App │ App │ App             │     │ App │ App │ App          │
│ Lib │ Lib │ Lib             │     │ Lib │ Lib │ Lib          │
│Guest│Guest│Guest OS         │     └──────────┬─────────────┘
│ OS  │ OS  │                 │                │ Docker Engine
├─────┴─────┴─────────────────┤                │ Host OS
│        Hypervisor             │     ┌──────────┴─────────────┐
│        Host OS                │     │     Host OS            │
└───────────────────────────────┘     └────────────────────────┘
```

**When containers win:** Microservices, CI, local dev stacks, fast deploys.

**When VMs still win:** Need a full different OS kernel, strict regulatory isolation, or legacy apps that expect bare metal.

Under the hood, Linux containers use **namespaces** (isolation: PID, network, mount…) and **cgroups** (CPU/memory limits).

---

## 6. Image Commands — Build Your Toolbox

Each command below follows the same pattern:

1. **What it does** (plain English)
2. **Syntax breakdown**
3. **When you'd use it** (real scenario)
4. **Example**
5. **How it helps you**

---

### `docker pull`

**What:** Download an image from a registry to your machine.

**Syntax:** `docker pull [registry/]name[:tag]`

| Part | Meaning | Default if omitted |
|------|---------|-------------------|
| `registry/` | Where to pull from | `docker.io` (Docker Hub) |
| `name` | Image name | — |
| `:tag` | Version | `latest` |

**Scenario:** You need Postgres for local development without installing it on your Mac.

```bash
docker pull postgres:15-alpine
```

```
15-alpine: Pulling from library/postgres
...
Status: Downloaded newer image for postgres:15-alpine
docker.io/library/postgres:15-alpine
```

**How it helps:** You get an exact, tested Postgres 15 on Alpine Linux — small image, known behavior. No `brew install`, no version drift.

**Tip:** Prefer specific tags (`15-alpine`) over `latest` in production — `latest` can change under you.

---

### `docker images` / `docker image ls`

**What:** List images stored locally on your machine.

**Scenario:** Your disk is full. You want to see what's taking space before deleting.

```bash
docker images
```

```
REPOSITORY   TAG       IMAGE ID       CREATED        SIZE
postgres     15-alpine a1b2c3d4e5f6   2 weeks ago    247MB
nginx        latest    f6e5d4c3b2a1   1 month ago    187MB
my-api       v1        9z8y7x6w5v4u   3 hours ago    412MB
```

**How it helps:** You see repository name, tag, unique `IMAGE ID` (use this when names collide), and **SIZE**. Essential before cleanup or debugging "wrong image" issues.

**Flags you'll use:**

```bash
docker images postgres          # filter by repository name
docker images -f "dangling=true" # untagged intermediate images
```

---

### `docker build`

**What:** Read a `Dockerfile` in a directory and create a new image.

**Syntax:** `docker build -t name:tag [context-path]`

| Flag | Meaning |
|------|---------|
| `-t name:tag` | Name and tag your image |
| `.` | Build context = current directory (files Docker can see) |

**Scenario:** You've written a `Dockerfile` for your Express API. You want a runnable image.

```bash
# In project root (where Dockerfile lives)
docker build -t my-api:v1 .
```

```
[+] Building 45.2s
 => [1/5] FROM node:18-alpine
 => [2/5] WORKDIR /app
 => [3/5] COPY package*.json ./
 => [4/5] RUN npm ci --only=production
 => [5/5] COPY . .
 => exporting to image
 => => naming to docker.io/library/my-api:v1
```

**How it helps:** Turns your repo into a deployable artifact. Same build on laptop and CI = same image layers (when cache hits).

**Common variations:**

```bash
docker build -t my-api:v1 -f Dockerfile.prod .   # custom Dockerfile name
docker build --no-cache -t my-api:v1 .           # ignore cache (debug stale builds)
docker build --target build -t my-api:build .      # stop at a stage (multi-stage)
```

---

### `docker rmi` / `docker image rm`

**What:** Delete one or more local images.

**Scenario:** You built `my-api:v1` through `v9` during testing. You only need `v9`.

```bash
docker rmi my-api:v1 my-api:v2
# or by ID
docker rmi a1b2c3d4e5f6
```

**Error you'll see:** `image is being used by stopped container` — remove the container first (`docker rm`) or use `docker rmi -f` (force; use carefully).

**How it helps:** Frees disk space. Keeps your local environment from accumulating dozens of obsolete layers.

---

### `docker image prune`

**What:** Remove **unused** images (not referenced by any container).

```bash
docker image prune        # dangling images only (untagged)
docker image prune -a     # ALL unused images — aggressive
```

**Scenario:** After a week of development, you have 15 GB of old `node` build caches.

**How it helps:** Safe-ish cleanup. `-a` removes images not tied to a running or stopped container — confirm before running on a shared build machine.

---

### `docker tag`

**What:** Create an additional name/tag pointing to the **same** image ID (no copy).

**Syntax:** `docker tag SOURCE[:tag] TARGET[:tag]`

**Scenario:** You built `my-api:v1` locally. Docker Hub expects `yourusername/my-api:v1` for push.

```bash
docker tag my-api:v1 abhishek/my-api:v1
docker images
```

```
REPOSITORY        TAG   IMAGE ID       SIZE
my-api            v1    abc123def456   412MB
abhishek/my-api   v1    abc123def456   412MB   ← same ID
```

**How it helps:** Registries use `username/repo:tag` naming. Tagging is how you "rename" for upload without rebuilding.

---

### `docker push`

**What:** Upload a tagged image to a registry.

**Scenario:** CI built and tested `abhishek/my-api:v1`. You push so production servers can `docker pull`.

```bash
docker login                    # authenticate once
docker push abhishek/my-api:v1
```

**How it helps:** Images become the deployable unit in cloud pipelines (ECS, Kubernetes, Cloud Run all pull from a registry).

**Prerequisite:** Image must be tagged with the registry path (`ghcr.io/org/app:tag`, `123456.dkr.ecr.us-east-1.amazonaws.com/app:tag`).

---

### `docker image inspect`

**What:** Dump detailed JSON metadata about an image.

**Scenario:** Your container can't connect on port 3000. You need to verify what `EXPOSE` and `Env` the image actually has.

```bash
docker image inspect nginx:latest --format '{{.Config.ExposedPorts}}'
```

**How it helps:** Debugging without running the container — see env vars, entrypoint, cmd, labels, architecture (`arm64` vs `amd64`).

---

### `docker history`

**What:** Show each **layer** in an image and the Dockerfile instruction that created it.

**Scenario:** Your image is 2 GB but you expected 200 MB. Find which `RUN apt-get` layer bloated it.

```bash
docker history my-api:v1
```

```
IMAGE          CREATED        CREATED BY                                      SIZE
abc123         3 hours ago    CMD ["node" "server.js"]                        0B
def456         3 hours ago    COPY . .                                          45MB
ghi789         3 hours ago    RUN npm ci --only=production                      380MB  ← culprit
...
```

**How it helps:** Teaches you *why* images are large and which Dockerfile line to optimize.

---

### Image commands — quick reference

| Command | One-line purpose |
|---------|------------------|
| `docker pull` | Download image from registry |
| `docker images` | List local images |
| `docker build -t name .` | Build image from Dockerfile |
| `docker rmi` | Delete image |
| `docker image prune -a` | Clean unused images |
| `docker tag` | Alias image for registry |
| `docker push` | Upload to registry |
| `docker image inspect` | Deep metadata |
| `docker history` | Layer-by-layer size audit |

---

## 7. Container Commands — Run and Manage Apps

Containers are where daily Docker work happens. Think: **run → observe → debug → stop → remove**.

---

### `docker run`

**What:** Create a new container from an image and start it. This is the most important command.

**Syntax (common flags):**

```bash
docker run [OPTIONS] IMAGE [COMMAND]
```

| Flag | Meaning | Example |
|------|---------|---------|
| `-d` | Detached (background) | `-d` |
| `-p host:container` | Port mapping | `-p 8080:80` |
| `--name` | Human-readable name | `--name my-nginx` |
| `-e KEY=val` | Environment variable | `-e NODE_ENV=production` |
| `-v host:container` | Mount volume | `-v $(pwd):/app` |
| `--rm` | Auto-delete when stopped | `--rm` |
| `-it` | Interactive + TTY | `-it ubuntu bash` |

#### Example 1: Quick test (foreground)

**Scenario:** Verify nginx works; terminal attached until you Ctrl+C.

```bash
docker run nginx
```

**How it helps:** Fastest smoke test. Not for production — terminal is tied to container lifecycle.

#### Example 2: Background web server

**Scenario:** Run nginx and reach it at `http://localhost:8080`.

```bash
docker run -d -p 8080:80 --name web nginx
curl http://localhost:8080
```

```
<!DOCTYPE html>
<html>...
```

**Port mapping explained:**

```
-p 8080:80
    │    └── port INSIDE container (nginx listens on 80)
    └────── port on YOUR machine (browser hits 8080)
```

**How it helps:** Multiple containers can all listen on 80 *inside* their network namespace; `-p` maps them to different host ports (8080, 8081…).

#### Example 3: Database with secrets

**Scenario:** Local Postgres with a root password.

```bash
docker run -d \
  --name dev-db \
  -e POSTGRES_PASSWORD=localdev \
  -e POSTGRES_DB=myapp \
  -p 5432:5432 \
  postgres:15-alpine
```

**How it helps:** Full database in one command. Teammates use the same command = same setup. Password via `-e`, not hardcoded in image.

#### Example 4: Interactive shell

**Scenario:** Explore what's inside an image or debug a Linux tool.

```bash
docker run -it --rm ubuntu:22.04 bash
```

Inside container:

```bash
cat /etc/os-release
exit   # container removed because of --rm
```

**How it helps:** `-it` = interactive terminal. `--rm` = no leftover stopped container after you exit. Perfect for one-off experiments.

#### Example 5: Override default command

**Scenario:** Redis image defaults to `redis-server`. You want `redis-cli`.

```bash
docker run -it --rm redis:7-alpine redis-cli
```

**How it helps:** `docker run IMAGE [COMMAND]` replaces the image's default `CMD` — powerful for debugging without new images.

---

### `docker ps` / `docker ps -a`

**What:** List containers. Default = **running only**. `-a` = all (including stopped).

**Scenario:** You started five containers yesterday. Which are still running?

```bash
docker ps
```

```
CONTAINER ID   IMAGE          STATUS         PORTS                  NAMES
a1b2c3d4e5f6   nginx          Up 2 hours     0.0.0.0:8080->80/tcp   web
```

```bash
docker ps -a    # includes Exited containers
```

**How it helps:** `CONTAINER ID` (or first few chars) is what you pass to `stop`, `logs`, `exec`. `NAMES` is easier to remember — use `--name` when you run.

**Useful flags:**

```bash
docker ps -q              # IDs only (great for scripts)
docker ps --filter "name=web"
docker ps --format "table {{.Names}}\t{{.Status}}"
```

---

### `docker stop`

**What:** Gracefully stop a running container (sends SIGTERM, waits, then SIGKILL).

**Scenario:** You're done with the dev database for the day.

```bash
docker stop dev-db
# or
docker stop a1b2c3    # first chars of ID work
```

**How it helps:** Clean shutdown — Postgres flushes data, nginx finishes requests. Prefer over `kill` unless container is frozen.

**Timing:** `docker stop -t 30 dev-db` — wait 30 seconds before force kill (default is 10).

---

### `docker start`

**What:** Start a **stopped** container (same ID, same volumes, same config).

**Scenario:** You stopped `dev-db` last night. This morning you want it back **with the same data volume**.

```bash
docker start dev-db
```

**How it helps:** Unlike `docker run` (creates *new* container), `start` resumes the existing one — important for named volumes and preserved state.

---

### `docker restart`

**What:** `stop` + `start` in one command.

**Scenario:** Your app loaded config at startup. You changed an env var on the container (rare) or need a quick bounce after a hang.

```bash
docker restart web
```

**How it helps:** Faster than rm + run when you want the **same** container instance.

**Note:** To change ports or image, you must `rm` and `docker run` again — restart doesn't change create-time options.

---

### `docker rm`

**What:** Delete a **stopped** container.

```bash
docker rm dev-db
docker rm -f web          # force: stop and remove running container
docker container prune    # remove ALL stopped containers
```

**Scenario:** You ran `docker run` without `--name` twenty times. `docker ps -a` is cluttered.

**How it helps:** Frees names and metadata. `-f` when you don't care about graceful shutdown.

**Warning:** Removing a container does **not** remove volumes by default — data in named volumes survives (usually what you want).

---

### `docker exec`

**What:** Run a command **inside an already running** container.

**Scenario:** Postgres is running. You need `psql` inside it.

```bash
docker exec -it dev-db psql -U postgres -d myapp
```

**Scenario:** Node app is running but misbehaving. Open a shell.

```bash
docker exec -it my-api sh
# Alpine images often use sh, not bash
```

**How it helps:** Debug production-like containers without SSH to the host. `-it` for shells; omit for one-off commands:

```bash
docker exec dev-db pg_isready
```

**vs `docker run`:** `exec` enters existing container. `run` creates a **new** one.

---

### `docker logs`

**What:** Read stdout/stderr from a container.

```bash
docker logs web
docker logs -f web          # follow (like tail -f)
docker logs --tail 100 web  # last 100 lines
docker logs -f --since 5m web
```

**Scenario:** API returns 500. Container is running in `-d` mode — you can't see console output.

```bash
docker logs -f --tail 50 my-api
```

**How it helps:** Primary debugging tool for background containers. In orchestration, logs are still the first place you look.

---

### `docker stats`

**What:** Live CPU, memory, network I/O per container.

```bash
docker stats
docker stats web dev-db   # specific containers
```

```
CONTAINER   CPU %   MEM USAGE / LIMIT   MEM %   NET I/O
web         0.02%   5MiB / 7.6GiB       0.06%   1.2kB / 0B
dev-db      1.50%   45MiB / 7.6GiB      0.58%   2kB / 1kB
```

**Scenario:** "Docker is slow" — find which container eats 4 GB RAM.

**How it helps:** Quick performance triage without installing monitoring.

---

### `docker inspect`

**What:** Full JSON config of a container or network (IP, mounts, env, state).

**Scenario:** Find a container's IP on the Docker bridge network.

```bash
docker inspect dev-db --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}'
```

**How it helps:** When service discovery by name fails, verify networks and aliases. See `04-Docker-Networking.md` for when to use custom networks instead of IPs.

---

### `docker cp`

**What:** Copy files between host and container filesystem.

```bash
# host → container
docker cp ./seed.sql dev-db:/tmp/seed.sql

# container → host
docker cp dev-db:/var/log/postgresql/ ./logs/
```

**Scenario:** Import a SQL dump without rebuilding the image.

**How it helps:** Emergency file transfer. For regular workflows, prefer **volumes** or baking files into the image.

---

### Container lifecycle — flow diagram

```
                    docker run
                        │
                        ▼
                   ┌─────────┐
         ┌────────►│ RUNNING │◄────────┐
         │         └────┬────┘         │
    docker start       │          docker restart
         │             │ docker stop      │
         │             ▼                  │
         │         ┌─────────┐            │
         └─────────│ STOPPED │────────────┘
                   └────┬────┘
                        │ docker rm
                        ▼
                    REMOVED
```

---

### Container commands — quick reference

| Command | One-line purpose |
|---------|------------------|
| `docker run -d -p H:C --name N IMG` | Create and start in background |
| `docker ps` / `docker ps -a` | List running / all containers |
| `docker stop` / `docker start` | Stop / resume container |
| `docker restart` | Bounce container |
| `docker rm` / `docker rm -f` | Remove stopped / force remove |
| `docker exec -it` | Shell or command inside running container |
| `docker logs -f` | Stream application output |
| `docker stats` | Live resource usage |
| `docker inspect` | Network, mounts, env metadata |
| `docker cp` | Copy files host ↔ container |

---

## 8. System Commands — Keep Docker Healthy

---

### `docker version`

**What:** Client and server (daemon) version.

```bash
docker version
```

**Scenario:** Tutorial requires Docker 24+. Your colleague's build fails on BuildKit features.

**How it helps:** Confirms CLI/daemon mismatch (rare but confusing) and API version.

---

### `docker info`

**What:** System-wide summary — storage driver, running containers count, registry mirrors, warnings.

```bash
docker info
```

**Scenario:** "Cannot connect to Docker daemon" — is the daemon running? `docker info` fails fast with a clear error.

**How it helps:** First diagnostic command when Docker "doesn't work."

---

### `docker system df`

**What:** Disk usage by images, containers, volumes, build cache.

```bash
docker system df
```

```
TYPE            TOTAL     ACTIVE    SIZE      RECLAIMABLE
Images          25        8         12.4GB    9.1GB (73%)
Containers      10        2         1.2GB     800MB (66%)
Local Volumes   5         2         2.1GB     1.5GB (71%)
Build Cache     47        0         4.3GB     4.3GB
```

**Scenario:** Mac Docker Desktop says "disk full."

**How it helps:** Shows **where** to prune — images vs volumes vs cache.

---

### `docker system prune`

**What:** Remove unused Docker objects.

```bash
docker system prune           # stopped containers, dangling networks, dangling images
docker system prune -a        # + all unused images
docker system prune -a --volumes   # + unused volumes — DATA LOSS RISK
```

**Scenario:** Monthly cleanup on a dev laptop.

**How it helps:** One command tidying. **Never** use `--volumes` on a machine with production DB volumes unless you mean it.

---

## 9. Image Layers — How Docker Stays Fast

Images are stacks of **read-only layers**. Each Dockerfile instruction usually adds one layer.

```
┌─────────────────────────────┐
│   Writable Container Layer  │  ← your runtime changes (deleted with container)
├─────────────────────────────┤
│   Layer 5: CMD ["node","…"] │
├─────────────────────────────┤
│   Layer 4: COPY . .         │
├─────────────────────────────┤
│   Layer 3: RUN npm ci       │
├─────────────────────────────┤
│   Layer 2: COPY package*.json│
├─────────────────────────────┤
│   Layer 1: FROM node:18     │
└─────────────────────────────┘
```

### Walkthrough: why order matters

**Dockerfile A (good cache):**

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
CMD ["node", "server.js"]
```

1. You change `server.js` → layers 1–3 **cached**, only layer 4 rebuilds → fast.
2. You change `package.json` → layer 3 rebuilds (`npm ci` runs again) → correct.

**Dockerfile B (bad cache):**

```dockerfile
FROM node:18-alpine
COPY . .
RUN npm ci
```

1. Any file change invalidates `COPY` → `npm ci` runs every build → slow.

### Key principles

| Principle | Why |
|-----------|-----|
| Least-changing layers first | Maximize cache hits |
| Combine `RUN` cleanup in same layer | `apt-get` + `rm -rf` same line = smaller image |
| Multi-stage builds | Compile in stage 1, copy binary to slim stage 2 |

See `02-Dockerfile.md` for full Dockerfile instruction reference.

---

## 10. Advanced Patterns

### Pattern 1: One-off vs long-lived containers

| Pattern | Command | Use when |
|---------|---------|----------|
| One-off | `docker run --rm -it IMG sh` | Migrations, debugging |
| Long-lived | `docker run -d --name SVC IMG` | Databases, APIs |

### Pattern 2: Dev with bind mount

Mount source code so edits on host appear in container without rebuild.

```bash
docker run -d -p 3000:3000 \
  -v "$(pwd)":/app \
  -w /app \
  node:18-alpine \
  sh -c "npm install && npm run dev"
```

**Helps:** Fast frontend/backend iteration. Not for production deploy artifacts.

### Pattern 3: Same image, different config

```bash
docker run -d -e NODE_ENV=development --name api-dev my-api:v1
docker run -d -e NODE_ENV=production  --name api-prod my-api:v1
```

**Helps:** One build, multiple environments — config via env, not separate images.

### Pattern 4: Health check debugging

```bash
docker run -d --name web -p 8080:80 nginx
docker inspect web --format '{{.State.Health.Status}}'
```

Combine with `docker logs` when orchestrators keep restarting unhealthy containers.

### Pattern 5: Resource limits (production habit)

```bash
docker run -d \
  --memory="512m" \
  --cpus="1.0" \
  --name api \
  my-api:v1
```

**Helps:** One runaway container can't take down the whole host. Kubernetes sets these declaratively; learn the flags locally first.

---

## 11. When to Use What — Decision Guide

```
Need to run something?
 │
 ├─ Public image exists (nginx, postgres, redis)?
 │       └─► docker pull + docker run
 │
 ├─ Your own app?
 │       ├─ One container ──► Dockerfile + docker build + docker run
 │       └─ App + DB + cache ──► Docker Compose (see 03-Docker-Compose.md)
 │
 ├─ Debug running app?
 │       ├─ See output ──► docker logs -f
 │       ├─ Shell inside ──► docker exec -it
 │       └─ Network/IP ──► docker inspect
 │
 ├─ Disk full?
 │       ├─ See usage ──► docker system df
 │       └─ Clean ──► docker system prune (careful with --volumes)
 │
 └─ Deploy to cloud?
         └─► docker tag + docker push → platform pulls image
```

| Situation | Recommended approach | Reason |
|-----------|---------------------|--------|
| Local Postgres/Redis | `docker run` with official image | No host install |
| Team full stack | Docker Compose | One file, reproducible |
| Production deploy | Built image in registry | Immutable, versioned |
| Quick file test | `docker run --rm` | No cleanup |
| Persist DB data | Named volume on `docker run` | Survives container delete |
| CI pipeline | `docker build` + `docker push` | Same artifact as prod |

---

## 12. Common Pitfalls & How to Avoid Them

### Pitfall 1: Using `latest` in production

**BAD:**

```bash
docker pull my-api:latest
docker run my-api:latest
```

**GOOD:**

```bash
docker pull my-api:1.4.2
docker run my-api:1.4.2
```

**Why:** `latest` is a moving target. Yesterday's deploy and today's can differ silently.

---

### Pitfall 2: Confusing `docker run` with `docker start`

**BAD:** Expecting `docker start` to pick up a newly built image.

**GOOD:** New image version → `docker rm old` (or new name) → `docker run` with new tag.

**Why:** `start` revives the old container with old filesystem layer and create-time config.

---

### Pitfall 3: Forgetting `-p` for web apps

**BAD:**

```bash
docker run -d nginx
curl localhost:80   # connection refused or wrong service
```

**GOOD:**

```bash
docker run -d -p 8080:80 nginx
curl localhost:8080
```

**Why:** Container ports are isolated until mapped to the host.

---

### Pitfall 4: Data lost when container removed

**BAD:**

```bash
docker run -d --name db postgres:15-alpine
docker rm -f db   # all DB data in container layer — gone
```

**GOOD:**

```bash
docker run -d --name db \
  -v pgdata:/var/lib/postgresql/data \
  postgres:15-alpine
```

**Why:** Writable layer is ephemeral. Volumes persist — see `05-Docker-Volumes.md`.

---

### Pitfall 5: Building from wrong directory

**BAD:**

```bash
cd ~/projects
docker build -t my-api .    # no Dockerfile here
```

**GOOD:**

```bash
cd ~/projects/my-api
docker build -t my-api .
```

**Why:** Build **context** is the `.` path. Wrong directory = wrong files or missing Dockerfile.

---

### Pitfall 6: `docker system prune -a --volumes` on dev machine

**BAD:** Prune everything including unused volumes with production dumps.

**GOOD:** `docker system df` first; prune images/containers; protect volumes explicitly.

**Why:** Volumes are how databases survive container deletion.

---

### Pitfall 7: Running everything as root in container

**BAD:** Dockerfile never sets `USER`; processes run as root inside container.

**GOOD:** `USER node` or non-root UID in Dockerfile.

**Why:** Container escape bugs become host compromise. See `06-Docker-Security.md`.

---

## Summary Cheatsheet

| Command | Memory hook | Best use case |
|---------|-------------|---------------|
| `docker pull` | "Download template" | Get official images |
| `docker build -t .` | "Bake my app" | Create deployable image |
| `docker run -d -p` | "Start in background, expose port" | Run services locally |
| `docker ps -a` | "What's running / what died?" | Status check |
| `docker logs -f` | "Show me the app output" | Debug crashes |
| `docker exec -it` | "Get inside" | DB CLI, shell debug |
| `docker stop` / `rm` | "Shut down / delete" | Cleanup |
| `docker tag` + `push` | "Publish" | CI/CD deploy |
| `docker system df/prune` | "Disk hygiene" | Dev machine maintenance |

**Default choice for beginners:** Official image + `docker run -d -p … --name …` + `docker logs -f` when something breaks. Add a `Dockerfile` when you need your own app packaged; add Compose when you need more than one container.

**Study path:** Master this guide → `02-Dockerfile.md` (build images) → `03-Docker-Compose.md` (multi-container) → `04-Docker-Networking.md` + `05-Docker-Volumes.md` (real apps) → `06-Docker-Security.md` (production).

---

*Next: [02-Dockerfile.md](./02-Dockerfile.md) — every Dockerfile instruction with the same teach-by-scenario approach.*
