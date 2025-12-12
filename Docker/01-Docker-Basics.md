# Docker Basics - Revision Guide

## What is Docker?

Docker is a **containerization platform** that packages applications and their dependencies into lightweight, portable containers that can run consistently across different environments.

## Key Concepts

### Container vs Virtual Machine

| Feature | Container | Virtual Machine |
|---------|-----------|-----------------|
| **OS** | Shares host OS kernel | Has its own OS |
| **Size** | Lightweight (MBs) | Heavy (GBs) |
| **Startup** | Seconds | Minutes |
| **Isolation** | Process-level | Hardware-level |
| **Performance** | Near-native | Overhead due to hypervisor |
| **Resource Usage** | Low | High |

```
┌─────────────────────────────────────┐
│           Virtual Machines          │
├───────────┬───────────┬─────────────┤
│   App A   │   App B   │   App C     │
├───────────┼───────────┼─────────────┤
│  Bins/Lib │  Bins/Lib │  Bins/Lib   │
├───────────┼───────────┼─────────────┤
│  Guest OS │  Guest OS │  Guest OS   │
├───────────┴───────────┴─────────────┤
│            Hypervisor               │
├─────────────────────────────────────┤
│            Host OS                  │
├─────────────────────────────────────┤
│           Infrastructure            │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│             Containers              │
├───────────┬───────────┬─────────────┤
│   App A   │   App B   │   App C     │
├───────────┼───────────┼─────────────┤
│  Bins/Lib │  Bins/Lib │  Bins/Lib   │
├───────────┴───────────┴─────────────┤
│          Docker Engine              │
├─────────────────────────────────────┤
│            Host OS                  │
├─────────────────────────────────────┤
│           Infrastructure            │
└─────────────────────────────────────┘
```

### Docker Architecture

```
┌──────────────────────────────────────────────────────────┐
│                      Docker Client                        │
│                   (docker build, run, pull)               │
└────────────────────────┬─────────────────────────────────┘
                         │ REST API
                         ▼
┌──────────────────────────────────────────────────────────┐
│                      Docker Host                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │                   Docker Daemon                     │  │
│  │                    (dockerd)                        │  │
│  └────────────────────────────────────────────────────┘  │
│  ┌─────────────────┐  ┌─────────────────────────────┐   │
│  │    Containers   │  │          Images             │   │
│  │  ┌───┐ ┌───┐   │  │   ┌─────┐  ┌─────┐         │   │
│  │  │ C │ │ C │   │  │   │ Img │  │ Img │         │   │
│  │  └───┘ └───┘   │  │   └─────┘  └─────┘         │   │
│  └─────────────────┘  └─────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────┐
│                    Docker Registry                        │
│                   (Docker Hub, ECR, etc.)                 │
└──────────────────────────────────────────────────────────┘
```

**Components:**
- **Docker Client**: CLI tool to interact with Docker daemon
- **Docker Daemon (dockerd)**: Background service that manages containers
- **Docker Registry**: Storage for Docker images (Docker Hub, private registries)
- **Docker Images**: Read-only templates to create containers
- **Docker Containers**: Running instances of images

---

## Essential Docker Commands

### Image Commands

```bash
# Pull an image from registry
docker pull nginx:latest

# List all images
docker images
docker image ls

# Build image from Dockerfile
docker build -t myapp:v1 .

# Remove an image
docker rmi nginx:latest
docker image rm nginx:latest

# Remove all unused images
docker image prune -a

# Tag an image
docker tag myapp:v1 username/myapp:v1

# Push image to registry
docker push username/myapp:v1

# Inspect image details
docker image inspect nginx:latest

# View image history/layers
docker history nginx:latest
```

### Container Commands

```bash
# Run a container
docker run nginx

# Run in detached mode (background)
docker run -d nginx

# Run with port mapping
docker run -d -p 8080:80 nginx

# Run with name
docker run -d --name my-nginx nginx

# Run with environment variables
docker run -d -e MYSQL_ROOT_PASSWORD=secret mysql

# Run with volume mount
docker run -d -v /host/path:/container/path nginx

# Run interactively
docker run -it ubuntu bash

# List running containers
docker ps

# List all containers (including stopped)
docker ps -a

# Stop a container
docker stop container_id

# Start a stopped container
docker start container_id

# Restart a container
docker restart container_id

# Remove a container
docker rm container_id

# Remove running container forcefully
docker rm -f container_id

# Remove all stopped containers
docker container prune

# Execute command in running container
docker exec -it container_id bash

# View container logs
docker logs container_id
docker logs -f container_id  # follow/stream logs

# View container resource usage
docker stats

# Inspect container details
docker inspect container_id

# Copy files to/from container
docker cp file.txt container_id:/path/
docker cp container_id:/path/file.txt ./
```

### System Commands

```bash
# View Docker system info
docker info

# View disk usage
docker system df

# Clean up unused resources
docker system prune
docker system prune -a  # including unused images

# View Docker version
docker version
```

---

## Docker Image Layers

Images are built in **layers**. Each instruction in Dockerfile creates a layer.

```
┌─────────────────────────────┐
│      Writable Layer         │ ← Container Layer (R/W)
├─────────────────────────────┤
│   Layer 5: CMD/ENTRYPOINT   │
├─────────────────────────────┤
│   Layer 4: COPY app files   │
├─────────────────────────────┤
│   Layer 3: RUN npm install  │
├─────────────────────────────┤
│   Layer 2: WORKDIR /app     │
├─────────────────────────────┤
│   Layer 1: Base Image       │ ← FROM node:18
└─────────────────────────────┘
```

**Key Points:**
- Layers are cached and reused
- Only changed layers are rebuilt
- Order instructions from least to most frequently changing
- Use multi-stage builds to reduce final image size

---

## Interview Quick Facts

1. **Docker uses** Linux kernel features: **namespaces** (isolation) and **cgroups** (resource limits)

2. **Default network** for containers is **bridge**

3. **Docker image** is immutable; **container** adds a writable layer on top

4. **ENTRYPOINT** vs **CMD**: ENTRYPOINT defines the executable, CMD provides default arguments

5. **Volumes** persist data beyond container lifecycle

6. **Docker Compose** is for multi-container applications

7. **Docker Swarm** and **Kubernetes** are container orchestration tools

8. **Dockerfile** instructions are executed in order, each creating a layer


