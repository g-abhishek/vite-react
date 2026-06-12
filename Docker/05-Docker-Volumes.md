# Docker Volumes & Storage — Complete Guide (Basics to Advanced)

> Containers forget everything when they die — volumes are how you keep databases, uploads, and config safe. Every storage type and command explained with real scenarios.

---

## Table of Contents

1. [What is Docker Storage? — The Real Explanation](#1-what-is-docker-storage--the-real-explanation)
2. [Why Volumes Matter — The Problems They Solve](#2-why-volumes-matter--the-problems-they-solve)
3. [Core Concepts & Mental Models](#3-core-concepts--mental-models)
4. [Three Storage Types Compared](#4-three-storage-types-compared)
5. [Volume Commands — Every Command Explained](#5-volume-commands--every-command-explained)
6. [Syntax: `-v` vs `--mount`](#6-syntax--v-vs---mount)
7. [Patterns for Real Applications](#7-patterns-for-real-applications)
8. [Backup, Restore & Migration](#8-backup-restore--migration)
9. [Permissions & Ownership](#9-permissions--ownership)
10. [Advanced Patterns](#10-advanced-patterns)
11. [When to Use What — Decision Guide](#11-when-to-use-what--decision-guide)
12. [Common Pitfalls & How to Avoid Them](#12-common-pitfalls--how-to-avoid-them)
13. [Summary Cheatsheet](#summary-cheatsheet)

---

## 1. What is Docker Storage? — The Real Explanation

A running container has a **writable layer** on top of read-only image layers. That writable layer is **ephemeral** — when the container is removed, it's gone.

**Volumes and mounts** connect container paths to storage that **outlives** the container.

### Analogy: hotel room vs storage unit

- **Container writable layer** = hotel room — leave, your stuff is cleared
- **Named volume** = storage unit — your boxes stay when you check out
- **Bind mount** = working from your own desk in the hotel room — host folder visible inside

```
Image layers (read-only)
┌─────────────────────────┐
│  Writable layer (gone   │  ← logs, temp files, db without volume
│  when container rm)   │
├─────────────────────────┤
│  Volume mount         │  ← /var/lib/postgresql/data → pgdata volume
│  (persists)           │
└─────────────────────────┘
```

---

## 2. Why Volumes Matter — The Problems They Solve

### Problem 1: Database wiped after `docker rm`

You ran Postgres, added users, removed container to "clean up" — all data gone.

**Fix:** Named volume on `/var/lib/postgresql/data`.

### Problem 2: Can't edit code without rebuilding image

Rebuild image on every `console.log` change — 2-minute feedback loop.

**Fix:** Bind mount source code in dev: `-v $(pwd):/app`.

### Problem 3: `node_modules` broken on bind mount

Host Mac mounts over container Linux — native modules wrong architecture.

**Fix:** Anonymous volume on `/app/node_modules` preserves container install.

### Problem 4: No backup strategy

Container died; no volume — no backup possible.

**Fix:** Named volumes + `tar` backup pattern (section 8).

### Problem 5: Sensitive temp data on disk

Session tokens written to disk persist after container stop.

**Fix:** `tmpfs` mount — lives in RAM only.

---

## 3. Core Concepts & Mental Models

| Term | Meaning |
|------|---------|
| **Named volume** | Docker-managed storage with a label (`pgdata`) |
| **Anonymous volume** | Volume with random ID, no friendly name |
| **Bind mount** | Host path mapped into container |
| **tmpfs** | RAM-backed filesystem |
| **Mount point** | Path inside container (`/data`) |
| **Volume driver** | Plugin for remote storage (NFS, cloud) |

### Data lifecycle

```
docker run -v pgdata:/var/lib/postgresql/data db
    │
    ▼
Container runs, writes to /var/lib/postgresql/data
    │
    ▼
docker rm db          →  container gone, pgdata volume REMAINS
    │
    ▼
docker run -v pgdata:... db   →  same data back
```

---

## 4. Three Storage Types Compared

| Feature | Named volume | Bind mount | tmpfs |
|---------|--------------|------------|-------|
| **Managed by** | Docker | You (host path) | Docker (RAM) |
| **Location** | `/var/lib/docker/volumes/` | Any host path | Memory |
| **Survives container rm** | Yes | Yes (host files) | No |
| **Portable across hosts** | High | Low | N/A |
| **Dev hot reload** | Poor | Excellent | N/A |
| **Production DB** | ✓ Best | Avoid | N/A |
| **Performance** | Good | Depends on disk | Fastest |

### When to pick each

```
Production database     → named volume
Dev source code edit    → bind mount
Secrets / sessions RAM  → tmpfs
Sharing between containers → named volume (same name)
```

---

## 5. Volume Commands — Every Command Explained

---

### `docker volume create`

**What:** Create empty named volume.

```bash
docker volume create pgdata
```

**Scenario:** Pre-create volume before first `docker run` with specific driver options.

**How it helps:** Explicit naming — easier backup scripts and documentation.

---

### `docker volume ls`

```bash
docker volume ls
```

```
DRIVER    VOLUME NAME
local     myapp_pgdata
local     3f8a9c2b4d1e7f6a...    ← anonymous
```

**Scenario:** Disk full — find orphaned volumes from old projects.

---

### `docker volume inspect`

```bash
docker volume inspect pgdata
```

```json
{
  "Mountpoint": "/var/lib/docker/volumes/pgdata/_data",
  "Driver": "local"
}
```

**How it helps:** Find actual host path (Linux) for manual inspection — path differs on Docker Desktop Mac/Win (VM internal).

---

### `docker volume rm`

```bash
docker volume rm pgdata
```

**Fails if:** Volume attached to running container.

**Scenario:** Intentionally wipe dev database — `rm` volume after `docker compose down` (without `-v` first stopping containers).

---

### `docker volume prune`

```bash
docker volume prune
# WARNING: removes ALL unused volumes
```

**Scenario:** Cleanup after months of local dev.

**Danger:** Unused production backup volume not attached to any container — **deleted**.

---

### Run with volume — `docker run -v`

```bash
# Named volume
docker run -d --name db \
  -v pgdata:/var/lib/postgresql/data \
  -e POSTGRES_PASSWORD=secret \
  postgres:15-alpine

# Bind mount
docker run -d \
  -v "$(pwd)":/app \
  -w /app \
  node:18-alpine npm run dev

# Read-only bind mount
docker run -d \
  -v "$(pwd)/config":/etc/app/config:ro \
  my-api

# Anonymous volume (only container path)
docker run -d -v /app/node_modules my-api
```

---

## 6. Syntax: `-v` vs `--mount`

### Short syntax (`-v`)

```bash
docker run -v pgdata:/var/lib/postgresql/data myimage
docker run -v /host/path:/container/path myimage
docker run -v /container/path-only myimage   # anonymous volume
```

### Long syntax (`--mount`) — explicit, safer

```bash
docker run --mount type=volume,source=pgdata,target=/var/lib/postgresql/data myimage

docker run --mount type=bind,source=/host/path,target=/container/path,readonly myimage

docker run --mount type=tmpfs,target=/app/temp,tmpfs-size=100m myimage
```

### Key difference

| Behavior | `-v` | `--mount` |
|----------|------|-----------|
| Bind mount source missing | Creates directory on host | **Fails** (safer) |
| Read-only | `:ro` suffix | `readonly` option |
| Clarity | Shorter | More explicit |

**Recommendation:** Learn `-v` for daily use; use `--mount` in production scripts where fail-fast matters.

---

## 7. Patterns for Real Applications

### Pattern 1: Database persistence

```bash
# PostgreSQL
docker run -d --name db \
  -v pgdata:/var/lib/postgresql/data \
  -e POSTGRES_PASSWORD=secret \
  postgres:15-alpine

# MySQL
docker run -d -v mysqldata:/var/lib/mysql -e MYSQL_ROOT_PASSWORD=secret mysql:8

# MongoDB
docker run -d -v mongodata:/data/db mongo:6
```

**Compose equivalent:**

```yaml
services:
  db:
    image: postgres:15-alpine
    volumes:
      - pgdata:/var/lib/postgresql/data
volumes:
  pgdata:
```

---

### Pattern 2: Dev hot reload + node_modules fix

```yaml
services:
  app:
    build: .
    volumes:
      - .:/app
      - /app/node_modules
    command: npm run dev
```

**Walkthrough:**

```
1. Bind mount . → /app     (your edits appear instantly)
2. Anonymous vol /app/node_modules  (container's npm install preserved)
3. Host's node_modules (if any) does NOT overwrite container's
```

---

### Pattern 3: Share data between containers

```yaml
services:
  writer:
    image: myproducer
    volumes:
      - shared:/data

  reader:
    image: myconsumer
    volumes:
      - shared:/data:ro

volumes:
  shared:
```

**How it helps:** Export files, shared cache, ETL handoff — one volume, two containers.

---

### Pattern 4: Init scripts for database

```yaml
services:
  db:
    image: postgres:15-alpine
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./init-scripts:/docker-entrypoint-initdb.d:ro
```

**Scenario:** SQL files in `./init-scripts/` run **only on first empty data directory**.

---

### Pattern 5: Config without rebuilding image

```bash
docker run -d \
  -v "$(pwd)/nginx.conf":/etc/nginx/nginx.conf:ro \
  nginx:alpine
```

Change config on host → `docker restart nginx` — no rebuild.

---

## 8. Backup, Restore & Migration

### Backup volume to tar

```bash
docker run --rm \
  -v pgdata:/source:ro \
  -v "$(pwd)":/backup \
  alpine tar -czf /backup/pgdata-backup.tar.gz -C /source .
```

**Walkthrough:**

```
1. --rm          ephemeral helper container
2. pgdata:/source:ro   mount volume read-only
3. $(pwd):/backup      host directory for output file
4. tar -czf ...        compress volume contents
```

### Restore from tar

```bash
docker volume create pgdata-restored

docker run --rm \
  -v pgdata-restored:/target \
  -v "$(pwd)":/backup:ro \
  alpine tar -xzf /backup/pgdata-backup.tar.gz -C /target
```

### Copy from running container

```bash
docker cp db:/var/lib/postgresql/data ./local-backup
```

**When:** Quick one-off without volume mount setup.

---

## 9. Permissions & Ownership

### The problem

```dockerfile
USER appuser
```

Bind mount `./data:/app/data` — host files owned by `root` or your UID 501. Container `appuser` (UID 1000) can't write.

### Solutions

**1. chown in Dockerfile (named volumes)**

```dockerfile
RUN chown -R appuser:appgroup /app/data
USER appuser
```

Docker initializes named volume with correct ownership on first mount.

**2. Match UID at run time (bind mounts)**

```bash
docker run -u "$(id -u):$(id -g)" -v "$(pwd)":/app myimage
```

**3. Prefer named volumes for production data**

Docker manages permissions; fewer UID mismatch issues.

---

## 10. Advanced Patterns

### Volume drivers (NFS example)

```bash
docker volume create --driver local \
  --opt type=nfs \
  --opt o=addr=192.168.1.100,rw \
  --opt device=:/export/docker/volumes \
  nfs-pgdata
```

**When:** Multiple Docker hosts need shared storage (careful with databases — usually one writer).

### `docker cp` vs volumes

| | `docker cp` | volumes |
|---|-------------|---------|
| Use | One-off extract | Ongoing persistence |
| Automation | Manual | Compose / orchestration |

### Anonymous volumes from Dockerfile

```dockerfile
VOLUME /app/data
```

Creates anonymous volume if user doesn't specify `-v`. Hard to manage — prefer explicit named volumes in Compose.

### Remove container + anonymous volumes

```bash
docker rm -v container_name    # -v removes anonymous volumes attached
```

---

## 11. When to Use What — Decision Guide

```
What are you storing?
 │
 ├─ Database files → named volume
 │
 ├─ Source code (dev) → bind mount
 │
 ├─ User uploads (prod) → named volume or cloud storage (S3)
 │
 ├─ Config files → bind mount :ro or configs/secrets
 │
 ├─ Temp sessions → tmpfs
 │
 └─ Share between 2+ containers → named volume
```

| Environment | Storage choice |
|-------------|----------------|
| Local dev app code | bind mount |
| Local dev database | named volume |
| CI test database | anonymous or tmp — ephemeral OK |
| Production database | named volume + backup |
| Production secrets | secrets manager, not volume in git |

---

## 12. Common Pitfalls & How to Avoid Them

### Pitfall 1: No volume on database

**BAD:**

```bash
docker run -d postgres:15-alpine
docker rm -f db   # data gone
```

**GOOD:**

```bash
docker run -d -v pgdata:/var/lib/postgresql/data postgres:15-alpine
```

---

### Pitfall 2: `docker compose down -v`

**BAD:** Deletes all named volumes in compose file.

**GOOD:** `docker compose down` without `-v` when you want to keep data.

---

### Pitfall 3: Bind mount hides container files

**BAD:** Mount empty host dir over `/app/node_modules` — app breaks.

**GOOD:** Anonymous volume trick or named volume for dependencies.

---

### Pitfall 4: Init scripts don't re-run

**BAD:** Change `init.sql`, expect it to run on existing volume.

**GOOD:** Init scripts only run on **empty** data directory. Migrate with proper tool (Flyway, Alembic).

---

### Pitfall 5: `volume prune` on shared machine

**BAD:** Prune "unused" volumes that were intentionally stopped.

**GOOD:** Name volumes clearly (`myapp_prod_pgdata`); document before prune.

---

### Pitfall 6: Assuming same host path on Mac/Windows

**BAD:** Scripts using `inspect` Mountpoint on Mac — path is inside Docker VM.

**GOOD:** Use `docker run` backup pattern instead of direct host path access.

---

### Pitfall 7: Read-write mount for config

**BAD:** App bug corrupts mounted `nginx.conf`.

**GOOD:** `:ro` read-only bind mounts for config.

---

## Summary Cheatsheet

| Task | Command |
|------|---------|
| Create volume | `docker volume create pgdata` |
| List volumes | `docker volume ls` |
| Run with volume | `docker run -v pgdata:/data ...` |
| Dev bind mount | `-v $(pwd):/app` |
| node_modules fix | `-v /app/node_modules` |
| Backup | `docker run --rm -v vol:/source:ro -v $(pwd):/b alpine tar czf ...` |
| Cleanup unused | `docker volume prune` ⚠️ |
| Remove with container | `docker rm -v` (anonymous only) |

**Default choices:** Named volumes for databases; bind mounts for dev code; never `down -v` unless you mean delete data.

---

*Previous: [04-Docker-Networking.md](./04-Docker-Networking.md) · Next: [06-Docker-Security.md](./06-Docker-Security.md)*
