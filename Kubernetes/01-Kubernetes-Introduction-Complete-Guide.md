# Kubernetes Introduction & Architecture — Complete Guide

> What Kubernetes is, why it exists, how the cluster is built, and how the reconciliation loop works — the foundation for every other guide in this folder.

---

## Table of Contents

1. [What is Kubernetes?](#1-what-is-kubernetes)
2. [Why Kubernetes Matters](#2-why-kubernetes-matters)
3. [Core Concepts & Mental Models](#3-core-concepts--mental-models)
4. [Labels, Selectors, and Annotations](#4-labels-selectors-and-annotations)
5. [Kubernetes Architecture](#5-kubernetes-architecture)
6. [The Reconciliation Loop](#6-the-reconciliation-loop)
7. [How kubectl Talks to the Cluster](#7-how-kubectl-talks-to-the-cluster)
8. [Managed Kubernetes (EKS, GKE, AKS)](#8-managed-kubernetes-eks-gke-aks)
9. [Coverage Map — What to Read Next](#9-coverage-map--what-to-read-next)
10. [When to Use Kubernetes](#10-when-to-use-kubernetes)
11. [Common Pitfalls](#11-common-pitfalls)
12. [Summary Cheatsheet](#summary-cheatsheet)

---

## 1. What is Kubernetes?

**Kubernetes** (K8s) is a **container orchestrator** — software that runs, scales, heals, and updates containerized applications across a **cluster** of machines.

```
Docker:     "Run this container on one machine"
Kubernetes: "Run 5 copies across 3 machines, restart if they crash,
               roll out v2 without downtime, give them stable network names"
```

### Mental model: airport control tower

You declare **desired state** ("3 replicas of my-api"). Kubernetes **reconciles** actual state to match — continuously, automatically.

### What K8s is NOT

| Myth | Truth |
|------|-------|
| Replaces Docker | Docker runs containers; K8s orchestrates them |
| Is a cloud | Runs on AWS/GCP/Azure/your servers |
| Required for every app | Docker Compose on one VPS is fine for many projects |

---

## 2. Why Kubernetes Matters

| Problem without K8s | K8s solution |
|---------------------|--------------|
| Container crashed at 3 AM, stayed down | Deployment auto-recreates pods |
| Manual deploy = downtime | Rolling updates |
| Traffic spike, can't scale fast | HPA adds pods automatically |
| Pod IP changes on restart | Service provides stable DNS |
| Config baked into image | ConfigMap / Secret injected at runtime |
| One app eats all node RAM | Resource limits + namespaces |

---

## 3. Core Concepts & Mental Models

### Object hierarchy

```
Cluster
 └── Node (machine)
      └── Pod (1+ containers)
           └── Container (your app)
```

### The eight objects you use daily

| Object | One line | Deep dive |
|--------|----------|-----------|
| Pod | Run container(s) | [02-Pods-and-Workloads](./02-Pods-and-Workloads-Complete-Guide.md) |
| Deployment | Manage N pods + updates | [02-Pods-and-Workloads](./02-Pods-and-Workloads-Complete-Guide.md) |
| Service | Stable network to pods | [03-Networking](./03-Kubernetes-Networking-Complete-Guide.md) |
| Ingress | HTTP routing from outside | [03-Networking](./03-Kubernetes-Networking-Complete-Guide.md) |
| ConfigMap / Secret | Runtime config | [05-Configuration](./05-Configuration-Secrets-Namespaces-Complete-Guide.md) |
| Namespace | Isolate environments | [05-Configuration](./05-Configuration-Secrets-Namespaces-Complete-Guide.md) |
| PVC | Persistent disk | [04-Storage](./04-Kubernetes-Storage-Complete-Guide.md) |
| HPA | Auto-scale on CPU/memory | [07-Health-Resources](./07-Health-Resources-Autoscaling-Complete-Guide.md) |

### Building manager analogy

| K8s | Analogy |
|-----|---------|
| Cluster | Building |
| Node | Floor |
| Pod | Apartment |
| Deployment | Lease: "always 3 apartments occupied" |
| Service | Front desk phone number |
| Ingress | Lobby directory |

---

## 4. Labels, Selectors, and Annotations

These connect objects together. **Understanding labels is non-negotiable.**

### Labels — identity tags

```yaml
metadata:
  labels:
    app: my-api
    env: production
    tier: backend
    version: "1.2.0"
```

**Used by:** Services (route traffic), Deployments (own pods), NetworkPolicies, HPA.

### Selectors — queries on labels

```yaml
# Service finds pods with app=my-api
spec:
  selector:
    app: my-api

# Deployment owns pods with matching labels
spec:
  selector:
    matchLabels:
      app: my-api
  template:
    metadata:
      labels:
        app: my-api    # MUST match selector
```

**If selector ≠ pod labels → Service has zero endpoints → 502 errors.**

Verify:

```bash
kubectl get endpoints my-api
kubectl get pods --show-labels
```

### Annotations — metadata (not for selection)

```yaml
metadata:
  annotations:
    kubernetes.io/change-cause: "deploy v1.2.0 by ci-bot"
    nginx.ingress.kubernetes.io/rewrite-target: /
```

Used by tools (Ingress controllers, cert-manager) — not for label selectors.

---

## 5. Kubernetes Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ CONTROL PLANE (brain)                                        │
│  API Server  — all kubectl/commands enter here               │
│  etcd        — stores entire cluster state                   │
│  Scheduler   — assigns pods to nodes                         │
│  Controller Manager — runs reconciliation loops              │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────┼──────────────────────────────────┐
│ WORKER NODES (muscle)    ▼                                   │
│  kubelet         — starts/stops containers on this node      │
│  kube-proxy      — Service load balancing (iptables/IPVS)    │
│  container runtime — containerd / CRI-O                    │
│  [Pod] [Pod] [Pod]                                           │
└─────────────────────────────────────────────────────────────┘
```

| Component | What | Why |
|-----------|------|-----|
| **API Server** | REST gateway | Auth, validation, single entry point |
| **etcd** | Key-value DB | Source of truth — backup etcd in prod |
| **Scheduler** | Pod → Node assignment | Considers CPU/RAM requests, affinity, taints |
| **Controller Manager** | Deployment, ReplicaSet, Job controllers… | Keeps actual = desired |
| **kubelet** | Node agent | Reports health, pulls images, runs probes |
| **kube-proxy** | Network rules | Implements ClusterIP load balancing |

---

## 6. The Reconciliation Loop

Every controller follows:

```
1. Read desired state (your YAML in etcd)
2. Read actual state (running pods, etc.)
3. Diff → act (create, update, delete)
4. Repeat forever (watch loop)
```

Example — pod dies:

```
Desired: replicas: 3
Actual:  2 pods running
Action:  create 1 pod
```

This is **declarative** infrastructure — you describe the end state, not the steps.

---

## 7. How kubectl Talks to the Cluster

```
kubectl apply -f deployment.yaml
       │
       ▼
API Server (validates, stores in etcd)
       │
       ▼
Deployment controller → ReplicaSet controller → Scheduler → kubelet
```

**Imperative vs declarative:**

```bash
# Imperative (avoid in prod)
kubectl run nginx --image=nginx
kubectl scale deployment my-api --replicas=5

# Declarative (preferred — git-tracked YAML)
kubectl apply -f deployment.yaml
```

Full kubectl reference: [08-Operations](./08-Kubernetes-Operations-Complete-Guide.md)

---

## 8. Managed Kubernetes (EKS, GKE, AKS)

| Provider | Service | Control plane |
|----------|---------|---------------|
| AWS | EKS | AWS manages control plane |
| GCP | GKE | Google manages control plane |
| Azure | AKS | Microsoft manages control plane |

You manage worker nodes (or use autoscaling node groups). Control plane HA is handled for you.

---

## 9. Coverage Map — What to Read Next

The original single guide covered basics well but **shallow** on several production topics. This folder splits each area into a **dedicated deep-dive**:

| # | Guide | Topics covered in depth |
|---|-------|-------------------------|
| 01 | **This file** | Intro, architecture, labels, reconciliation |
| 02 | [Pods & Workloads](./02-Pods-and-Workloads-Complete-Guide.md) | Pod lifecycle, init/sidecar, Deployment, StatefulSet, DaemonSet, Job, CronJob, scheduling |
| 03 | [Networking](./03-Kubernetes-Networking-Complete-Guide.md) | Services, DNS, Ingress, NetworkPolicy, kube-proxy, headless services |
| 04 | [Storage](./04-Kubernetes-Storage-Complete-Guide.md) | PV, PVC, StorageClass, volume types, StatefulSet storage |
| 05 | [Configuration](./05-Configuration-Secrets-Namespaces-Complete-Guide.md) | ConfigMap, Secret, namespaces, quotas, downward API |
| 06 | [Security](./06-Kubernetes-Security-Complete-Guide.md) | RBAC, ServiceAccounts, SecurityContext, PSS, secrets management |
| 07 | [Health & Autoscaling](./07-Health-Resources-Autoscaling-Complete-Guide.md) | Probes, requests/limits, QoS, HPA, VPA, PDB |
| 08 | [Operations](./08-Kubernetes-Operations-Complete-Guide.md) | kubectl, rolling updates, local clusters, full Node.js deploy |
| 09 | [Observability](./09-Observability-Debugging-Complete-Guide.md) | Logs, metrics, tracing, debugging playbook |
| 10 | [Advanced](./10-Helm-GitOps-Advanced-Complete-Guide.md) | Helm, GitOps, CRDs, Operators, canary, service mesh intro |
| 11 | [Interview Q&A](./11-Kubernetes-Interview-Questions.md) | Scenario-based questions |

### Topics intentionally in advanced guide

- Helm charts and values
- Argo CD / Flux GitOps
- Custom Resource Definitions (CRDs) and Operators
- Istio / service mesh basics
- cert-manager for TLS

---

## 10. When to Use Kubernetes

```
Single app, one server, small team?
  → Docker Compose — simpler

Multiple services, need HA + auto-scale + zero-downtime deploys?
  → Kubernetes (managed: EKS/GKE/AKS)

Stateful database?
  → Managed RDS/Cloud SQL preferred; StatefulSet only with platform team
```

---

## 11. Common Pitfalls

| Pitfall | Fix |
|---------|-----|
| Learning YAML before concepts | Read guides 01–03 first |
| Creating Pods directly | Always use Deployment |
| Label selector mismatch | `kubectl get endpoints` |
| No resource limits | Always set requests + limits |
| Secrets in git | External Secrets Operator |

---

## Summary Cheatsheet

| Term | Meaning |
|------|---------|
| Cluster | Full K8s installation |
| Node | Worker machine |
| Pod | Smallest deployable unit |
| Deployment | Manages replica count + updates |
| Service | Stable DNS/IP to pods |
| Namespace | Virtual cluster partition |
| etcd | Cluster state database |
| Reconciliation | Loop that fixes drift |

**Default learning path:** 01 → 02 → 03 → 08 (hands-on) → 07 → 06 → rest as needed.
