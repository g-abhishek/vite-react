# Docker Networking - Revision Guide

## Network Drivers

Docker provides several network drivers for different use cases.

### 1. Bridge (Default)

Default network for containers on a single host. Containers can communicate via IP or container name (user-defined bridge).

```bash
# Create custom bridge network
docker network create my-network

# Run container on custom network
docker run -d --name web --network my-network nginx

# Containers on same network can communicate by name
docker run -d --name api --network my-network myapi
# Inside api container: curl http://web:80
```

```
┌─────────────────────────────────────────────────────┐
│                    Docker Host                       │
│  ┌─────────────┐  ┌─────────────┐                   │
│  │ Container A │  │ Container B │                   │
│  │  172.17.0.2 │  │  172.17.0.3 │                   │
│  └──────┬──────┘  └──────┬──────┘                   │
│         │                │                          │
│  ┌──────┴────────────────┴──────┐                   │
│  │     Bridge Network           │                   │
│  │     docker0 (172.17.0.1)     │                   │
│  └──────────────┬───────────────┘                   │
│                 │                                   │
└─────────────────┼───────────────────────────────────┘
                  │
            Host Network
```

### 2. Host

Container shares the host's network stack. No network isolation.

```bash
docker run -d --network host nginx
# Nginx accessible at host's port 80 directly
```

**Use Cases:**
- Performance-critical applications
- When container needs to use host network tools

**Limitations:**
- No port mapping needed/allowed
- Port conflicts with host services possible
- Only works on Linux

### 3. None

Container has no network interface (except loopback).

```bash
docker run -d --network none alpine
```

**Use Cases:**
- Maximum isolation
- Batch processing without network
- Security-sensitive workloads

### 4. Overlay

Multi-host networking for Docker Swarm. Enables communication between containers across different Docker hosts.

```bash
# Create overlay network (requires Swarm mode)
docker network create -d overlay my-overlay

# In docker-compose for Swarm
networks:
  my-overlay:
    driver: overlay
```

```
┌──────────────────┐      ┌──────────────────┐
│   Docker Host 1  │      │   Docker Host 2  │
│  ┌────────────┐  │      │  ┌────────────┐  │
│  │ Container  │  │      │  │ Container  │  │
│  └─────┬──────┘  │      │  └─────┬──────┘  │
│        │         │      │        │         │
│  ┌─────┴─────────┼──────┼────────┴─────┐  │
│  │      Overlay Network (VXLAN)        │  │
│  └─────────────────────────────────────┘  │
└──────────────────┘      └──────────────────┘
```

### 5. Macvlan

Assigns a MAC address to container, making it appear as a physical device on the network.

```bash
docker network create -d macvlan \
  --subnet=192.168.1.0/24 \
  --gateway=192.168.1.1 \
  -o parent=eth0 \
  my-macvlan
```

**Use Cases:**
- Legacy applications requiring direct network access
- Applications expecting to be directly on physical network

---

## Network Commands

```bash
# List networks
docker network ls

# Create network
docker network create my-network
docker network create --driver bridge my-bridge
docker network create --subnet 10.0.0.0/24 my-network

# Inspect network
docker network inspect my-network

# Connect container to network
docker network connect my-network container_name

# Disconnect container from network
docker network disconnect my-network container_name

# Remove network
docker network rm my-network

# Remove unused networks
docker network prune
```

---

## Default Bridge vs User-Defined Bridge

| Feature | Default Bridge | User-Defined Bridge |
|---------|---------------|---------------------|
| **DNS Resolution** | No (IP only) | Yes (container names) |
| **Isolation** | Shared default | Separate per network |
| **Connect on-the-fly** | No | Yes |
| **Environment variables** | Linked containers only | All containers |

```bash
# Default bridge - must use IP
docker run -d --name db mysql
docker run -d --name app myapp
# app cannot reach db by name

# User-defined bridge - DNS works
docker network create mynet
docker run -d --name db --network mynet mysql
docker run -d --name app --network mynet myapp
# Inside app: mysql -h db -u root -p  ✓
```

---

## Port Mapping

```bash
# Map container port 80 to host port 8080
docker run -d -p 8080:80 nginx

# Map to specific interface
docker run -d -p 127.0.0.1:8080:80 nginx

# Map multiple ports
docker run -d -p 80:80 -p 443:443 nginx

# Map to random host port
docker run -d -p 80 nginx
docker port container_name  # See assigned port

# Map UDP port
docker run -d -p 53:53/udp dns-server

# Expose port (documentation only, doesn't publish)
docker run -d --expose 3000 myapp
```

### Publish vs Expose

| | expose | -p (publish) |
|--|--------|--------------|
| **Host Access** | No | Yes |
| **Container Access** | Yes | Yes |
| **Use Case** | Internal communication | External access |

---

## DNS and Service Discovery

### Built-in DNS (User-Defined Networks)

```yaml
# docker-compose.yml
services:
  web:
    image: nginx
    networks:
      - backend
      
  api:
    image: myapi
    networks:
      - backend
    # Can reach web at: http://web:80
    
  db:
    image: postgres
    networks:
      - backend
    # api can reach db at: postgres://db:5432

networks:
  backend:
```

### DNS Resolution Order
1. Container's /etc/hosts
2. Docker's embedded DNS server
3. Host's DNS (if not found)

### Custom DNS

```bash
docker run --dns 8.8.8.8 --dns 8.8.4.4 myapp
```

---

## Network Isolation Examples

### Frontend/Backend Separation

```yaml
version: "3.8"

services:
  nginx:
    image: nginx
    ports:
      - "80:80"
    networks:
      - frontend

  api:
    image: myapi
    networks:
      - frontend
      - backend

  db:
    image: postgres
    networks:
      - backend  # Not accessible from nginx!

networks:
  frontend:
  backend:
    internal: true  # No external access
```

```
┌────────────────────────────────────────────────────────┐
│                                                        │
│   Internet                                             │
│       │                                                │
│       ▼                                                │
│   ┌───────┐      Frontend Network                      │
│   │ nginx │◄────────────────────────┐                  │
│   └───────┘                         │                  │
│                                ┌────┴────┐             │
│                                │   api   │             │
│                                └────┬────┘             │
│                                     │                  │
│   ───────────────────────────────────── Backend Network│
│                                     │       (internal) │
│                                ┌────┴────┐             │
│                                │   db    │             │
│                                └─────────┘             │
└────────────────────────────────────────────────────────┘
```

---

## Container Communication

### Same Network (Recommended)

```bash
# Create network
docker network create app-net

# Run containers on same network
docker run -d --name redis --network app-net redis
docker run -d --name app --network app-net -e REDIS_HOST=redis myapp
```

### Links (Legacy - Deprecated)

```bash
# Don't use this
docker run -d --name db mysql
docker run -d --name app --link db:database myapp
```

---

## Interview Quick Facts

1. **Default network** is `bridge` - containers can't resolve each other by name

2. **User-defined bridge** enables DNS resolution between containers

3. **Host network** removes network isolation, container uses host's network directly

4. **Overlay network** is for multi-host communication (Docker Swarm)

5. **Port mapping** format: `-p HOST:CONTAINER`

6. **Containers on different networks** cannot communicate (unless connected to both)

7. **internal: true** in network config blocks external access

8. **docker network connect** can add a running container to a network

9. **Bridge network** uses NAT for outbound traffic

10. **DNS** only works automatically on user-defined networks, not default bridge


