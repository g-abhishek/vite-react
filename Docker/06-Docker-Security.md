# Docker Security — Complete Guide (Basics to Advanced)

> Containers are not VMs — a mistake in image or runtime config can expose the host. Every security practice explained with scenarios, not checklists to memorize.

---

## Table of Contents

1. [What is Docker Security? — The Real Explanation](#1-what-is-docker-security--the-real-explanation)
2. [Why Security Matters — The Problems It Solves](#2-why-security-matters--the-problems-it-solves)
3. [Core Concepts & Mental Models](#3-core-concepts--mental-models)
4. [Image Security — Build Time](#4-image-security--build-time)
   - [Practice 1: Don't run as root (USER walkthrough)](#practice-1-dont-run-as-root)
5. [Runtime Security — Run Time](#5-runtime-security--run-time)
6. [Network & Secret Security](#6-network--secret-security)
7. [Scanning & CI/CD Integration](#7-scanning--cicd-integration)
8. [Docker Secrets & Content Trust](#8-docker-secrets--content-trust)
9. [Advanced Patterns](#9-advanced-patterns)
10. [When to Use What — Decision Guide](#10-when-to-use-what--decision-guide)
11. [Common Pitfalls & How to Avoid Them](#11-common-pitfalls--how-to-avoid-them)
12. [Summary Cheatsheet](#summary-cheatsheet)

---

## 1. What is Docker Security? — The Real Explanation

Docker security is **layered**:

1. **What you put in the image** (dependencies, secrets, users)
2. **How you run the container** (root, capabilities, read-only FS)
3. **How containers connect** (network isolation, published ports)
4. **How you verify and update** (scanning, pinning, patches)

### Analogy: apartment security

- **Image** = what's inside the apartment (flammable materials?)
- **Runtime flags** = locks on doors and windows
- **Network** = which rooms connect to the street
- **Scanning** = building inspection before move-in

A container is **not** a hard security boundary like a VM — it shares the host kernel. Treat compromise as possible; **limit blast radius**.

---

## 2. Why Security Matters — The Problems It Solves

### Problem 1: Container escape via root + kernel bug

Process runs as root inside container → kernel vulnerability → host access.

**Fix:** Non-root `USER`, keep kernel and Docker updated.

### Problem 2: Secrets baked into image layers

`ENV API_KEY=sk_live_xxx` in Dockerfile — visible in `docker history` forever.

**Fix:** Runtime env, secrets manager, BuildKit secrets.

### Problem 3: Huge attack surface

Full Ubuntu image with 400 packages — more CVEs.

**Fix:** Alpine, slim, distroless — minimal packages.

### Problem 4: Database on public internet

`5432:5432` published — automated scans within minutes.

**Fix:** Internal network only; no host port.

### Problem 5: One container eats all RAM — DoS

Runaway memory leak takes down entire host.

**Fix:** `--memory` limits; orchestrator quotas.

### Problem 6: Supply chain — malicious base image

Pull random image from Docker Hub — backdoor preinstalled.

**Fix:** Pin digests, scan, Content Trust, private registry.

---

## 3. Core Concepts & Mental Models

| Term | Meaning |
|------|---------|
| **Attack surface** | Ways in — open ports, shells, packages |
| **Blast radius** | Damage if one container compromised |
| **Capabilities** | Linux fine-grained privileges (not all-or-nothing root) |
| **Seccomp** | Syscall filter profile |
| **Namespace** | Isolation (PID, network, mount) |
| **Rootless Docker** | Daemon runs without host root |
| **Distroless** | Image with app only — no shell, no package manager |

### Security layers diagram

```
┌─────────────────────────────────────────┐
│  Scan & sign images (CI)                │
├─────────────────────────────────────────┤
│  Minimal Dockerfile (USER, no secrets)  │
├─────────────────────────────────────────┤
│  Runtime: read-only, cap-drop, limits   │
├─────────────────────────────────────────┤
│  Network: internal DB, no extra ports   │
├─────────────────────────────────────────┤
│  Host: patched kernel, rootless optional │
└─────────────────────────────────────────┘
```

---

## 4. Image Security — Build Time

---

### Practice 1: Don't run as root

**Scenario:** RCE in your Node app — attacker gets shell.

**What `USER` does:** Selects which Linux user runs your app. It does **not** create that user — you or the base image must do that first.

**Full step-by-step guide (create vs built-in user, `COPY --chown`, order, pitfalls):**  
→ [`02-Dockerfile.md` § USER — Creating Users & Running Non-Root](./02-Dockerfile.md#user--creating-users--running-non-root-step-by-step)

#### Quick decision

| Base image | Create user? | Typical line |
|------------|--------------|--------------|
| `node:*` | No — use built-in `node` | `USER node` |
| `python:*`, bare `alpine` | Yes | `RUN addgroup ... && adduser ...` then `USER app` |
| `distroless/*` | No — use `nonroot` | `USER nonroot` |

#### Verify a user exists (before `USER`)

```bash
docker run --rm node:20-alpine cat /etc/passwd | grep node
docker run --rm node:20-alpine id node
```

#### BAD — runs as root (default when `USER` omitted)

```dockerfile
FROM node:18-alpine
COPY . .
CMD ["node", "server.js"]   # runs as root (uid 0)
```

#### GOOD — built-in `node` user (no adduser)

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY --chown=node:node package*.json ./
RUN npm ci --omit=production
COPY --chown=node:node . .
USER node
CMD ["node", "server.js"]
```

#### GOOD — custom `app` user (when image has no built-in user)

```dockerfile
FROM node:18-alpine
WORKDIR /app
RUN addgroup -S app && adduser -S app -G app
COPY --chown=app:app package*.json ./
RUN npm ci --only=production
COPY --chown=app:app . .
USER app
CMD ["node", "server.js"]
```

#### Step order (why it matters)

```
1. FROM / WORKDIR
2. RUN adduser     ← only if no built-in user
3. RUN npm ci      ← as root (install needs write access)
4. COPY --chown    ← app files owned by non-root user
5. USER app|node   ← switch before CMD
6. CMD             ← runtime process is non-root
```

**How it helps:** Attacker gets shell as uid 1000, not root — cannot install packages, limited file access, harder kernel escape.

**Verify after build:**

```bash
docker build -t my-api .
docker run --rm my-api whoami   # node or app, not root
```

---

### Practice 2: Use minimal base images

| Image | Approx size | Shell | Best for |
|-------|-------------|-------|----------|
| `node:18` | ~1 GB | yes | Legacy needs |
| `node:18-slim` | ~200 MB | yes | glibc apps |
| `node:18-alpine` | ~170 MB | yes | Most Node APIs |
| `gcr.io/distroless/nodejs18` | ~100 MB | **no** | Production |

```dockerfile
FROM gcr.io/distroless/nodejs18
COPY --chown=nonroot:nonroot . /app
WORKDIR /app
CMD ["server.js"]
```

**Trade-off:** Distroless — can't `docker exec` bash for debug. Use separate debug image tag.

---

### Practice 3: Pin specific image tags

**BAD:** `FROM node:latest`

**GOOD:** `FROM node:18.17.0-alpine3.18`

**Better:** Pin by digest (immutable):

```dockerfile
FROM node:18.17.0-alpine3.18@sha256:abc123...
```

---

### Practice 4: Never store secrets in images

**BAD:**

```dockerfile
ENV DATABASE_PASSWORD=supersecret
COPY .env .
ARG NPM_TOKEN=xxx
```

**GOOD:**

```bash
docker run -e DATABASE_PASSWORD="$DATABASE_PASSWORD" my-api
```

BuildKit secret (not in layer history):

```bash
DOCKER_BUILDKIT=1 docker build --secret id=npmrc,src=$HOME/.npmrc -t my-api .
```

```dockerfile
# syntax=docker/dockerfile:1
RUN --mount=type=secret,id=npmrc,target=/root/.npmrc npm ci
```

---

### Practice 5: Multi-stage builds

```dockerfile
FROM node:18-alpine AS builder
RUN npm ci && npm run build

FROM node:18-alpine AS production
RUN adduser -S app
COPY --from=builder --chown=app:app /app/dist ./dist
USER app
CMD ["node", "dist/server.js"]
```

**How it helps:** Compiler, devDependencies, `.git`, tests never reach production image.

---

### Practice 6: Remove unnecessary files

```dockerfile
RUN npm ci --only=production && \
    npm cache clean --force && \
    rm -rf .git tests *.md
```

---

### Practice 7: Use exec form for CMD

**BAD:** `CMD npm start` — runs under `/bin/sh -c`, signal handling issues, injection risk in some setups.

**GOOD:** `CMD ["npm", "start"]`

---

### Secure Dockerfile template

```dockerfile
FROM node:18.17.0-alpine3.18

RUN addgroup -S app && adduser -S app -G app

WORKDIR /app
COPY --chown=app:app package*.json ./
RUN npm ci --only=production && npm cache clean --force

COPY --chown=app:app . .

USER app
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "server.js"]
```

---

## 5. Runtime Security — Run Time

---

### Read-only filesystem

**Scenario:** Attacker writes webshell to `/app` or modifies binaries.

```bash
docker run --read-only --tmpfs /tmp my-api
```

```yaml
# Compose
services:
  api:
    read_only: true
    tmpfs:
      - /tmp
      - /var/run
```

**How it helps:** Runtime file mutations fail — app should only write to explicit volumes or tmpfs.

---

### Drop Linux capabilities

Root in container has many **capabilities** by default. Drop all, add only what's needed.

```bash
docker run --cap-drop ALL --cap-add NET_BIND_SERVICE my-api
```

| Capability | Why add |
|------------|---------|
| `NET_BIND_SERVICE` | Bind ports < 1024 without root |
| `CHOWN` | Rare — fix ownership at build |

```yaml
services:
  api:
    cap_drop:
      - ALL
    cap_add:
      - NET_BIND_SERVICE
```

**Default:** `--cap-drop ALL` unless you know you need one.

---

### No new privileges

```bash
docker run --security-opt no-new-privileges my-api
```

Prevents processes from gaining more privileges via setuid binaries.

---

### Resource limits

```bash
docker run --memory=512m --cpus=1.0 --pids-limit=100 my-api
```

```yaml
services:
  api:
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '1.0'
```

**How it helps:** One container can't exhaust host RAM/CPU (DoS protection).

---

### Avoid privileged mode

```bash
# NEVER unless you understand the risk
docker run --privileged myimage
```

`--privileged` ≈ root on host — disables most isolation.

---

### Seccomp & AppArmor

```bash
docker run --security-opt seccomp=default.json my-api
docker run --security-opt apparmor=docker-default my-api
```

Custom seccomp profiles restrict syscalls — advanced hardening for high-security environments.

---

## 6. Network & Secret Security

### Don't publish internal services

```yaml
services:
  db:
    # NO ports: section
    networks:
      - internal
networks:
  internal:
    internal: true
```

### Avoid host network unless required

```bash
docker run --network host my-api   # shares host network stack
```

### Environment variables for secrets (dev only)

```bash
docker run -e API_KEY="$API_KEY" my-api
```

**Warning:** Env vars visible in `docker inspect` and process list. Production: use Docker Swarm secrets, Vault, AWS Secrets Manager, K8s secrets.

---

## 7. Scanning & CI/CD Integration

### Why scan?

Base image has OpenSSL CVE. You never wrote that code — still your problem in prod.

### Trivy

```bash
trivy image my-api:v1
trivy image --severity CRITICAL,HIGH my-api:v1
```

### Docker Scout

```bash
docker scout cve my-api:v1
docker scout recommendations my-api:v1
```

### CI pipeline example

```yaml
# GitHub Actions
- name: Build
  run: docker build -t my-api:${{ github.sha }} .

- name: Scan
  uses: aquasecurity/trivy-action@master
  with:
    image-ref: my-api:${{ github.sha }}
    severity: CRITICAL,HIGH
    exit-code: '1'
```

**How it helps:** Block deploy on critical CVEs — fix base image or patch before production.

---

## 8. Docker Secrets & Content Trust

### Docker Secrets (Swarm mode)

```bash
echo "db_password" | docker secret create db_password -

docker service create \
  --name api \
  --secret db_password \
  my-api
```

Inside container: `/run/secrets/db_password` — memory filesystem, not in image.

```yaml
services:
  api:
    secrets:
      - db_password
secrets:
  db_password:
    external: true
```

### Docker Content Trust

Sign and verify images:

```bash
export DOCKER_CONTENT_TRUST=1
docker push myregistry/my-api:v1   # signs on push
docker pull myregistry/my-api:v1   # verifies signature
```

**How it helps:** Supply chain — ensures image came from your team and wasn't tampered with.

---

## 9. Advanced Patterns

### Pattern 1: Rootless Docker

Run Docker daemon as non-root user on host.

```bash
dockerd-rootless-setuptool.sh install
```

**How it helps:** Even daemon compromise isn't host root.

### Pattern 2: User namespaces

```json
// /etc/docker/daemon.json
{ "userns-remap": "default" }
```

Container root mapped to unprivileged host user.

### Pattern 3: Separate read-only config mounts

```yaml
volumes:
  - ./config.yml:/app/config.yml:ro
```

### Pattern 4: Distroless + debug sidecar

Production: distroless image. Debug: attach `docker debug` (Docker Desktop) or ephemeral debug container on same network.

### Pattern 5: Image signing in registry

GHCR, ECR, Harbor support signing and vulnerability scanning on push.

---

## 10. When to Use What — Decision Guide

```
Hardening priority?
 │
 ├─ Quick wins (do today)
 │     ├─ non-root USER in Dockerfile
 │     ├─ pin image tags
 │     ├─ no secrets in image
 │     ├─ scan in CI
 │     └─ don't publish DB ports
 │
 ├─ Production API
 │     ├─ alpine/slim or distroless
 │     ├─ multi-stage build
 │     ├─ read_only + tmpfs
 │     ├─ cap-drop ALL
 │     └─ memory/CPU limits
 │
 └─ High security / compliance
       ├─ seccomp profiles
       ├─ Content Trust
       ├─ rootless Docker
       └─ external secrets manager
```

| Control | Dev | Production |
|---------|-----|------------|
| Non-root USER | ✓ | ✓ required |
| Image scanning | optional | ✓ required |
| Read-only FS | optional | ✓ recommended |
| cap-drop ALL | optional | ✓ recommended |
| Secrets in .env | OK (gitignored) | ✗ use vault |
| Distroless | optional | ✓ when no shell needed |

---

## 11. Common Pitfalls & How to Avoid Them

### Pitfall 1: Secrets in Dockerfile ENV

**BAD:** `ENV AWS_SECRET_KEY=...`

**GOOD:** Runtime injection or secrets manager.

---

### Pitfall 2: `--privileged` for convenience

**BAD:** "App needs Docker inside Docker" → `--privileged`

**GOOD:** Docker socket mount (still risky) or proper CI job — never privileged by default.

---

### Pitfall 3: Mounting Docker socket

```bash
-v /var/run/docker.sock:/var/run/docker.sock
```

Container can control host Docker — **equivalent to root on host**. Only in trusted admin tools.

---

### Pitfall 4: Trusting `latest` images

**BAD:** Production pulls `nginx:latest` daily — behavior changes.

**GOOD:** Pin version + digest; update deliberately after scan.

---

### Pitfall 5: Ignoring scan results

**BAD:** "CVE in openssl in base image — we'll fix later" for 6 months.

**GOOD:** Rebuild on patched base weekly or on critical CVE immediately.

---

### Pitfall 6: Running database as root with published port

**BAD:** Default postgres image + `5432:5432` on public cloud.

**GOOD:** Internal network, strong password, no public port, non-default credentials.

---

### Pitfall 7: Shell in production for "just in case"

**BAD:** Full Ubuntu image so ops can ssh-like debug.

**GOOD:** Slim image + `docker exec` with debug profile or sidecar.

---

## Summary Cheatsheet

| Practice | How |
|----------|-----|
| Non-root | `USER node` or `USER app` — [full walkthrough](./02-Dockerfile.md#user--creating-users--running-non-root-step-by-step) |
| Small image | alpine / slim / distroless + multi-stage |
| No secrets in image | runtime `-e`, BuildKit `--secret` |
| Pin versions | `node:18.17.0-alpine3.18@sha256:...` |
| Scan | `trivy image`, `docker scout cve` |
| Limit resources | `--memory`, `--cpus` |
| Drop caps | `--cap-drop ALL` |
| Read-only | `--read-only --tmpfs /tmp` |
| Network | DB on internal network, no `-p` |
| Never | `--privileged`, secrets in ENV |

**Default production posture:** Non-root + pinned alpine + multi-stage + scan in CI + internal DB network + resource limits.

---

*Previous: [05-Docker-Volumes.md](./05-Docker-Volumes.md) · Next: [07-Docker-Interview-Questions.md](./07-Docker-Interview-Questions.md)*
