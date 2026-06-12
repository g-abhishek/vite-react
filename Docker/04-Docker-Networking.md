# Docker Networking — Complete Guide (Basics to Advanced)

> How containers find each other, reach the internet, and stay isolated — every network driver and command with scenarios you will actually hit in dev and production.

---

## Table of Contents

1. [What is Docker Networking? — The Real Explanation](#1-what-is-docker-networking--the-real-explanation)
2. [Why Networking Matters — The Problems It Solves](#2-why-networking-matters--the-problems-it-solves)
3. [Core Concepts & Mental Models](#3-core-concepts--mental-models)
4. [Network Drivers — When to Use Each](#4-network-drivers--when-to-use-each)
5. [Network Commands — Every Command Explained](#5-network-commands--every-command-explained)
6. [Default Bridge vs User-Defined Bridge](#6-default-bridge-vs-user-defined-bridge)
7. [Port Mapping — Host ↔ Container](#7-port-mapping--host--container)
8. [DNS & Service Discovery](#8-dns--service-discovery)
9. [Network Isolation Patterns](#9-network-isolation-patterns)
10. [Advanced Patterns](#10-advanced-patterns)
11. [When to Use What — Decision Guide](#11-when-to-use-what--decision-guide)
12. [Common Pitfalls & How to Avoid Them](#12-common-pitfalls--how-to-avoid-them)
13. [Summary Cheatsheet](#summary-cheatsheet)

---

## 1. What is Docker Networking? — The Real Explanation

Every Docker container has a **network stack** — IP address, routes, DNS settings — virtualized on the host. **Networking** is how you control:

- Can container A reach container B?
- Can your laptop reach the container?
- Can the container reach the internet?
- Should the database be hidden from the public edge?

### Analogy: apartment building

- **Host** = the building
- **Bridge network** = internal hallway connecting apartments
- **Port mapping** = doorbell that rings a specific apartment from the street
- **Custom networks** = separate wings with different access rules

---

## 2. Why Networking Matters — The Problems It Solves

### Problem 1: "Connection refused" to database

App uses `localhost:5432` inside container — but Postgres is in **another** container. `localhost` is always **self**.

**Fix:** Service discovery — connect to `db:5432` on a shared network.

### Problem 2: Port conflicts on host

Three containers all want host port 80.

**Fix:** Map different host ports (`8080:80`, `8081:80`) or use reverse proxy on one published port.

### Problem 3: Database exposed to internet

Published `5432:5432` on a cloud VM — bots scan and brute-force within hours.

**Fix:** No host port on DB; only app container on same private network.

### Problem 4: Containers can't find each other by name

Default bridge network has **no embedded DNS**.

**Fix:** User-defined bridge or Docker Compose default network.

### Problem 5: Performance-sensitive app

NAT overhead on bridge network matters for extreme throughput.

**Fix:** `host` network mode (Linux only, trade isolation).

---

## 3. Core Concepts & Mental Models

| Term | Meaning |
|------|---------|
| **Network namespace** | Isolated network stack per container |
| **Bridge** | Virtual switch connecting containers on one host |
| **docker0** | Default bridge interface on host (usually 172.17.0.1) |
| **Port mapping** | DNAT rule: host:port → container:port |
| **DNS** | Embedded resolver on user-defined networks |
| **Ingress** | Traffic entering container from outside |
| **Egress** | Traffic leaving container to internet |

### Traffic paths

```
Browser ──► host:8080 ──► NAT ──► container:80 (published port)

api container ──► embedded DNS "db" ──► db container:5432 (same network)

db container ──✗──► internet (internal: true network)
```

---

## 4. Network Drivers — When to Use Each

---

### Bridge (default)

**What:** Private network on a single Docker host. Containers get private IPs; outbound traffic NATs through host.

```
┌──────────────── Docker Host ────────────────┐
│  ┌─────────┐         ┌─────────┐             │
│  │  api    │         │   db    │             │
│  │172.18.0.2│◄──────►│172.18.0.3│             │
│  └────┬────┘         └────┬────┘             │
│       └────────┬────────────┘                 │
│         my-network (bridge)                   │
│                │                              │
│           docker0 / br-xxx                    │
└────────────────┼──────────────────────────────┘
                 │
            Physical NIC → Internet
```

**When:** Almost all local dev and single-host deployments.

```bash
docker network create app-net
docker run -d --name db --network app-net postgres:15-alpine
docker run -d --name api --network app-net -e DB_HOST=db my-api
docker exec api ping -c 1 db    # works on user-defined bridge
```

**Pros & cons:**

| Pros | Cons |
|------|------|
| Isolation between containers | NAT overhead (minor) |
| DNS on custom bridges | Single-host only (use overlay for multi-host) |
| Port mapping control | Default bridge has no DNS |

---

### Host

**What:** Container shares host's network namespace — no isolation, no `-p` mapping.

```bash
docker run -d --network host nginx
# nginx on host port 80 directly
```

**When:** Max performance, or binding many dynamic ports (some monitoring agents).

**Limitations:**
- Linux only (Docker Desktop Mac/Win behaves differently)
- Port conflicts with host services
- No network isolation

| Pros | Cons |
|------|------|
| No NAT overhead | No isolation |
| Simple port binding | Security risk |

---

### None

**What:** Only loopback (`lo`) inside container — no external network.

```bash
docker run -d --network none alpine sleep 3600
docker exec <id> ip addr   # only lo
```

**When:** Batch jobs with no network, maximum isolation, security-sensitive processing.

---

### Overlay

**What:** Multi-host network for Docker Swarm — containers on different machines share virtual network (VXLAN).

```bash
docker swarm init
docker network create -d overlay my-overlay
```

**When:** Docker Swarm clusters. For Kubernetes, use CNI plugins instead.

```
Host 1 [container A]───────┐
                           ├── overlay (VXLAN)
Host 2 [container B]───────┘
```

---

### Macvlan

**What:** Container gets real MAC address on physical LAN — appears as separate machine on network.

```bash
docker network create -d macvlan \
  --subnet=192.168.1.0/24 \
  --gateway=192.168.1.1 \
  -o parent=eth0 \
  macnet
```

**When:** Legacy apps needing direct L2 network presence, IP-based ACLs on physical network.

**Rare** in cloud-native setups.

---

## 5. Network Commands — Every Command Explained

---

### `docker network ls`

**What:** List networks on this host.

```bash
docker network ls
```

```
NETWORK ID     NAME              DRIVER    SCOPE
abc123         bridge            bridge    local
def456         host              host      local
ghi789         myapp_default     bridge    local   ← Compose created
```

**How it helps:** Find Compose project network name for `inspect` and debugging.

---

### `docker network create`

**What:** Create user-defined bridge (or other driver).

```bash
docker network create app-net
docker network create --subnet 10.10.0.0/24 --gateway 10.10.0.1 app-net
docker network create -d bridge frontend
```

**Scenario:** Two apps on same host must communicate by name without Compose.

```bash
docker network create backend
docker run -d --name redis --network backend redis:7-alpine
docker run -d --name api --network backend -e REDIS_HOST=redis my-api
```

---

### `docker network inspect`

**What:** JSON details — containers attached, subnets, gateway.

```bash
docker network inspect app-net
```

**Scenario:** "What IP does db have?" — but prefer DNS name over hardcoded IP.

```bash
docker network inspect app-net --format '{{range .Containers}}{{.Name}} {{.IPv4Address}}{{"\n"}}{{end}}'
```

---

### `docker network connect` / `disconnect`

**What:** Attach or detach running container from network.

```bash
docker network connect backend api    # api now on two networks
docker network disconnect backend api
```

**Scenario:** Admin tool container needs temporary access to DB network.

```bash
docker run -d --name adminer --network database-net adminer
# or connect existing:
docker network connect database-net adminer
```

**How it helps:** Dynamic topology without recreating containers.

---

### `docker network rm` / `prune`

```bash
docker network rm app-net
docker network prune    # remove unused networks
```

**Fails if:** Containers still attached — stop/remove them first.

---

## 6. Default Bridge vs User-Defined Bridge

| Feature | Default `bridge` | User-defined bridge |
|---------|------------------|---------------------|
| DNS by container name | ✗ | ✓ |
| Isolated from other projects | ✗ | ✓ |
| Connect while running | ✗ | ✓ |
| Compose default network | N/A | ✓ |

### Default bridge — must use IP

```bash
docker run -d --name db postgres:15-alpine
docker run -d --name app my-api
# app cannot resolve "db" by name on default bridge
docker inspect db --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}'
# app must use 172.17.0.x — fragile
```

### User-defined bridge — DNS works

```bash
docker network create mynet
docker run -d --name db --network mynet postgres:15-alpine
docker run -d --name app --network mynet my-api
docker exec app getent hosts db
# 172.18.0.2    db
```

**Default choice:** Always create a custom network or use Compose.

---

## 7. Port Mapping — Host ↔ Container

### Basic mapping

```bash
docker run -d -p 8080:80 nginx
#      host ──► container
```

**Scenario:** Three nginx instances:

```bash
docker run -d -p 8081:80 --name web1 nginx
docker run -d -p 8082:80 --name web2 nginx
docker run -d -p 8083:80 --name web3 nginx
```

### Bind to specific interface

```bash
docker run -d -p 127.0.0.1:8080:80 nginx
# only localhost — not reachable from LAN
```

**How it helps:** Dev security — DB admin UI not exposed on office WiFi.

### Random host port

```bash
docker run -d -p 80 nginx
docker port <container> 80
# 0.0.0.0:49153
```

### UDP ports

```bash
docker run -d -p 53:53/udp coredns
```

### `docker port`

```bash
docker port web 80
# 0.0.0.0:8080
```

### Publish vs expose

| | `EXPOSE` in Dockerfile | `-p` on run |
|---|--------------------------|-------------|
| Opens host port | No | Yes |
| Documents intent | Yes | Yes |
| Inter-container access | Yes (same network) | Yes |

```yaml
# Compose: internal only
services:
  api:
    expose:
      - "5000"      # visible to other services
    # no ports: — not on host
```

---

## 8. DNS & Service Discovery

### Resolution order (inside container)

```
1. /etc/hosts (container's own entries)
2. Docker embedded DNS (127.0.0.11)
3. Host's upstream DNS (if not found)
```

### Compose / custom bridge

Service name = hostname:

```yaml
services:
  api:
    environment:
      DB_HOST: db
  db:
    image: postgres
```

### Network aliases

```yaml
services:
  db:
    networks:
      backend:
        aliases:
          - database
          - postgres-primary
```

`api` can connect to `database` or `db` or service name.

### Custom DNS servers

```bash
docker run --dns 8.8.8.8 --dns 8.8.4.4 myapp
```

**When:** Container must resolve internal corporate DNS names.

### Links (deprecated — do not use)

```bash
# LEGACY — use custom networks instead
docker run --link db:database myapp
```

---

## 9. Network Isolation Patterns

### Pattern: Frontend / API / DB tiers

```yaml
services:
  nginx:
    ports:
      - "80:80"
    networks:
      - public

  api:
    networks:
      - public
      - private

  db:
    networks:
      - private

networks:
  public:
  private:
    internal: true
```

```
Internet
    │
    ▼
┌────────┐     public      ┌─────┐
│ nginx  │◄───────────────►│ api │
└────────┘                 └──┬──┘
                              │ private (internal)
                         ┌────▼────┐
                         │   db    │
                         └─────────┘
```

**How it helps:** Even if nginx is compromised, attacker can't reach db directly — different network, no route from public to private without api.

### Pattern: Debug container on demand

```bash
docker run -it --rm --network myapp_private nicolaka/netshoot
# inside: dig db, curl api:3000, tcpdump
```

`netshoot` = networking Swiss Army knife image for debugging.

---

## 10. Advanced Patterns

### Pattern 1: Reverse proxy as single entry point

Only nginx publishes port 80; api and frontend use `expose` only.

### Pattern 2: Macvlan for legacy IP licensing

Some software licenses bind to MAC/IP on physical network.

### Pattern 3: Host network for metrics agent

Collect host-level metrics without NAT complexity (Linux prod).

### Pattern 4: Multiple networks per container

API on both `frontend` and `backend` — bridge between tiers (see section 9).

### Pattern 5: `extra_hosts` in Compose

```yaml
services:
  api:
    extra_hosts:
      - "legacy.corp.local:10.0.0.50"
```

Adds entry to container's `/etc/hosts` when DNS can't resolve legacy names.

---

## 11. When to Use What — Decision Guide

```
Container communication?
 │
 ├─ Same Compose project → default network, use service names
 │
 ├─ Manual docker run → create user-defined bridge first
 │
 ├─ Need host LAN IP → macvlan (rare)
 │
 ├─ Multi-host Swarm → overlay
 │
 ├─ Max perf, Linux only → host
 │
 └─ No network at all → none

Expose to laptop browser?
 │
 ├─ Dev → ports: "3000:3000"
 │
 └─ Prod → reverse proxy only, db has no published ports
```

| Driver | Default choice for |
|--------|-------------------|
| bridge (custom) | ✓ Local dev, single host |
| bridge (default) | Avoid — no DNS |
| host | High-perf Linux edge cases |
| overlay | Swarm multi-host |
| none | Isolated batch jobs |
| macvlan | Legacy L2 requirements |

---

## 12. Common Pitfalls & How to Avoid Them

### Pitfall 1: `localhost` for inter-container calls

**BAD:** `curl http://localhost:5432` from api to reach db.

**GOOD:** `postgres://db:5432/mydb`

---

### Pitfall 2: Default bridge expecting DNS

**BAD:** `docker run --name db` and `docker run --name app` without shared custom network.

**GOOD:** `docker network create net` + `--network net` on both.

---

### Pitfall 3: Publishing database ports

**BAD:** `-p 5432:5432` on production DB.

**GOOD:** DB only on internal network; only api connects.

---

### Pitfall 4: Hardcoding container IPs

**BAD:** `DB_HOST=172.18.0.3` — IP changes on recreate.

**GOOD:** `DB_HOST=db` — DNS name stable.

---

### Pitfall 5: `--network host` on Mac/Windows expecting Linux behavior

**BAD:** Assuming host networking works identically on Docker Desktop.

**GOOD:** Test on target platform; prefer port mapping on Desktop.

---

### Pitfall 6: Firewall blocking published ports

**BAD:** `docker run -p 8080:80` works locally but not from another machine — host firewall.

**GOOD:** Open firewall port or bind `127.0.0.1` if local-only intended.

---

### Pitfall 7: Two compose projects can't resolve each other's services

**BAD:** Project A expects `projectB_db_1` hostname.

**GOOD:** External network:

```yaml
networks:
  shared:
    external: true
```

Create once: `docker network create shared`, attach both projects.

---

## Summary Cheatsheet

| Task | Command / approach |
|------|-------------------|
| Create network | `docker network create app-net` |
| Run on network | `docker run --network app-net --name api ...` |
| Connect running container | `docker network connect app-net db` |
| Publish port | `-p 8080:80` |
| Inspect | `docker network inspect app-net` |
| DNS between containers | user-defined bridge or Compose |
| Hide DB from internet | no `-p`, `internal: true` network |
| Debug DNS/connectivity | `docker run -it --rm --network app-net nicolaka/netshoot` |

**Default choice:** Docker Compose with custom networks; service names for hostnames; only edge service publishes ports.

---

*Previous: [03-Docker-Compose.md](./03-Docker-Compose.md) · Next: [05-Docker-Volumes.md](./05-Docker-Volumes.md)*
