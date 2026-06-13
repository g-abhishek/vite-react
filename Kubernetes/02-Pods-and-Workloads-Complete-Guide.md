# Kubernetes Pods & Workloads — Complete Guide

> Pods, Deployments, StatefulSets, DaemonSets, Jobs, and CronJobs — what each workload type is, why it exists, and where to use it in production.

---

## Table of Contents

1. [What is a Pod?](#1-what-is-a-pod)
2. [Pod Lifecycle & Phases](#2-pod-lifecycle--phases)
3. [Multi-Container Pods — Init, Sidecar, Adapter](#3-multi-container-pods--init-sidecar-adapter)
4. [Pod Scheduling — Affinity, Taints, Tolerations](#4-pod-scheduling--affinity-taints-tolerations)
5. [ReplicaSet — The Layer Below Deployment](#5-replicaset--the-layer-below-deployment)
6. [Deployment — Stateless Apps](#6-deployment--stateless-apps)
7. [StatefulSet — Stable Identity & Storage](#7-statefulset--stable-identity--storage)
8. [DaemonSet — One Pod Per Node](#8-daemonset--one-pod-per-node)
9. [Job & CronJob — Batch Work](#9-job--cronjob--batch-work)
10. [When to Use What](#10-when-to-use-what)
11. [Common Pitfalls](#11-common-pitfalls)
12. [Summary Cheatsheet](#summary-cheatsheet)

---

## 1. What is a Pod?

A **Pod** is the smallest unit Kubernetes schedules. It wraps one or more containers that share:

- **One IP address** — containers talk via `localhost`
- **Volumes** — shared filesystem mounts
- **Network namespace** — same ports must not conflict

```
┌─────────────────────────────────┐
│  Pod 10.244.1.5                 │
│  ┌──────────┐  ┌─────────────┐  │
│  │ main app │  │ log sidecar │  │
│  │ :3000    │  │             │  │
│  └──────────┘  └─────────────┘  │
└─────────────────────────────────┘
```

**Why not schedule containers directly?** Kubernetes needs a co-located group unit for sidecars and shared storage. The scheduler assigns **pods** to nodes.

**Where:** You rarely create Pods directly. Use a **controller** (Deployment, StatefulSet, Job).

---

## 2. Pod Lifecycle & Phases

```
                    ┌──────────┐
                    │ Pending  │  scheduling / image pull
                    └────┬─────┘
                         ▼
                    ┌──────────┐
         ┌─────────│ Running  │─────────┐
         │         └──────────┘         │
         ▼                              ▼
   ┌───────────┐                 ┌──────────┐
   │ Succeeded │                 │  Failed  │
   └───────────┘                 └──────────┘
         (Jobs)                   (error exit)

   CrashLoopBackOff = container keeps crashing, kubelet retries with backoff
   ImagePullBackOff = can't pull image (wrong tag, no auth)
   OOMKilled        = exceeded memory limit (exit 137)
```

### Container states

| State | Meaning |
|-------|---------|
| **Waiting** | Pulling image, waiting for init container |
| **Running** | Executing |
| **Terminated** | Exited (success or failure) |

### Restart policies (pod level)

| Policy | Behavior |
|--------|----------|
| **Always** (default for Deployments) | Restart on any exit |
| **OnFailure** | Restart only on non-zero exit (Jobs) |
| **Never** | Never restart |

---

## 3. Multi-Container Pods — Init, Sidecar, Adapter

### Init containers — run BEFORE main app

```yaml
spec:
  initContainers:
  - name: wait-for-db
    image: busybox
    command: ['sh', '-c', 'until nc -z postgres 5432; do sleep 2; done']
  - name: download-config
    image: curlimages/curl
    command: ['sh', '-c', 'curl -o /config/app.json http://config-server/config']
    volumeMounts:
    - name: config
      mountPath: /config
  containers:
  - name: api
    image: my-api:v1
    volumeMounts:
    - name: config
      mountPath: /etc/config
```

**Why:** Main container only starts after DB is reachable and config is downloaded.

### Sidecar — helper running alongside main app

| Pattern | Sidecar does | Example |
|---------|--------------|---------|
| Log shipping | Reads shared log volume, ships to ELK | Fluent Bit |
| Service mesh | Proxy all traffic | Envoy (Istio) |
| Config sync | Pull config from git/API | custom sync container |

### Adapter — transform output for main app

Sidecar converts external format → format main app expects (e.g. normalize logging format).

---

## 4. Pod Scheduling — Affinity, Taints, Tolerations

### Problem

Default scheduler picks **any node with enough CPU/RAM**. Sometimes you need control:

- Run GPU workloads on GPU nodes
- Keep frontend and cache on same node (performance)
- Don't run batch jobs on production app nodes

### Node affinity — "prefer" or "require" certain nodes

```yaml
spec:
  affinity:
    nodeAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
        nodeSelectorTerms:
        - matchExpressions:
          - key: disktype
            operator: In
            values: [ssd]
```

### Pod affinity — co-locate pods

```yaml
affinity:
  podAffinity:
    requiredDuringSchedulingIgnoredDuringExecution:
    - labelSelector:
        matchLabels:
          app: redis
      topologyKey: kubernetes.io/hostname
```

**Use case:** API pod on same node as local Redis cache.

### Taints & tolerations — "only these pods may use this node"

```yaml
# Node taint (set by admin)
kubectl taint nodes gpu-node workload=gpu:NoSchedule

# Pod toleration (allows scheduling on tainted node)
spec:
  tolerations:
  - key: workload
    operator: Equal
    value: gpu
    effect: NoSchedule
```

**Real use:** Dedicated nodes for monitoring (DaemonSet tolerates taint), batch jobs on spot instances.

---

## 5. ReplicaSet — The Layer Below Deployment

```
Deployment
  └── ReplicaSet (revision 3) → Pod, Pod, Pod
  └── ReplicaSet (revision 2) → (0 pods — kept for rollback history)
```

**ReplicaSet** ensures N pods with matching labels exist. You almost never create ReplicaSets directly — **Deployment** manages them.

```bash
kubectl get rs
kubectl describe rs my-api-7d8f9c
```

---

## 6. Deployment — Stateless Apps

### What & why

**Deployment** = declarative N replicas + rolling updates + rollback.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: my-api
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  minReadySeconds: 10
  revisionHistoryLimit: 5
  template:
    metadata:
      labels:
        app: my-api
    spec:
      containers:
      - name: api
        image: myregistry/my-api:1.2.0
        ports:
        - containerPort: 3000
```

### Rolling update flow

```
[v1][v1][v1] → add v2 → wait ready → kill v1 → repeat → [v2][v2][v2]
```

### Recreate strategy (downtime OK)

```yaml
strategy:
  type: Recreate   # kill all old, then start all new
```

Use for apps that can't run two versions simultaneously (legacy singleton).

### Real use cases

| App type | Config |
|----------|--------|
| REST API | replicas: 3+, RollingUpdate, probes |
| WebSocket server | sticky sessions via Ingress annotation |
| Worker queue consumer | replicas: N based on queue depth (KEDA) |

---

## 7. StatefulSet — Stable Identity & Storage

### Why Deployment fails for stateful apps

```
Deployment pod names:  web-7f8a9b-xk2j1  (random, interchangeable)
StatefulSet pod names: web-0, web-1, web-2  (stable, ordered)
```

Each StatefulSet pod gets:
- **Stable hostname:** `web-0.my-service.default.svc.cluster.local`
- **Own PVC:** data survives pod restart
- **Ordered deploy/scale:** web-0 before web-1

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
spec:
  serviceName: postgres-headless   # required — headless Service
  replicas: 3
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:15
        volumeMounts:
        - name: data
          mountPath: /var/lib/postgresql/data
  volumeClaimTemplates:
  - metadata:
      name: data
    spec:
      accessModes: [ReadWriteOnce]
      resources:
        requests:
          storage: 20Gi
```

**Production note:** Prefer **managed databases** (RDS, Cloud SQL). StatefulSet for Postgres requires operational expertise (backups, failover).

### Headless Service (required for StatefulSet)

```yaml
apiVersion: v1
kind: Service
metadata:
  name: postgres-headless
spec:
  clusterIP: None          # headless — returns pod IPs directly
  selector:
    app: postgres
  ports:
  - port: 5432
```

---

## 8. DaemonSet — One Pod Per Node

```yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: fluent-bit
spec:
  selector:
    matchLabels:
      app: fluent-bit
  template:
    metadata:
      labels:
        app: fluent-bit
    spec:
      tolerations:
      - operator: Exists    # run on ALL nodes including tainted
      containers:
      - name: fluent-bit
        image: fluent/fluent-bit
```

**Use cases:** log collectors, node monitoring (Datadog agent), CNI plugins, storage drivers.

When you add a node → DaemonSet automatically schedules a pod on it.

---

## 9. Job & CronJob — Batch Work

### Job — run to completion

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: db-migrate
spec:
  completions: 1
  parallelism: 1
  backoffLimit: 3
  activeDeadlineSeconds: 600
  template:
    spec:
      restartPolicy: Never
      containers:
      - name: migrate
        image: my-api:1.0.0
        command: ["npm", "run", "migrate"]
```

### CronJob — scheduled

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: nightly-report
spec:
  schedule: "0 2 * * *"
  concurrencyPolicy: Forbid
  successfulJobsHistoryLimit: 3
  failedJobsHistoryLimit: 1
  jobTemplate:
    spec:
      template:
        spec:
          restartPolicy: OnFailure
          containers:
          - name: report
            image: report-generator:v1
            command: ["./generate-report.sh"]
```

**Real use cases:** DB migrations, ETL, nightly backups, certificate renewal scripts.

---

## 10. When to Use What

| Need | Workload |
|------|----------|
| Stateless web API | **Deployment** |
| Stable pod name + disk | **StatefulSet** |
| Agent on every node | **DaemonSet** |
| Run once | **Job** |
| Run on schedule | **CronJob** |
| Debug / learn | Bare **Pod** (never prod) |

---

## 11. Common Pitfalls

| BAD | GOOD |
|-----|------|
| `kubectl run` pod in prod | Deployment with replicas |
| StatefulSet for stateless API | Deployment |
| Deployment for Postgres without ops team | Managed RDS |
| No init container for DB-dependent app | Init container waits for DB |
| Ignoring pod events | `kubectl describe pod` |

---

## Summary Cheatsheet

| Workload | Replicas | Pod names | Storage | Use |
|----------|----------|-----------|---------|-----|
| Deployment | N | Random | Shared PVC optional | Stateless apps |
| StatefulSet | N | Stable (0,1,2) | Per-pod PVC | Kafka, ES, DB |
| DaemonSet | 1 per node | Random | Optional | Logs, monitoring |
| Job | Until done | Random | Optional | Migrations |
| CronJob | Scheduled | Random | Optional | Backups |

**Mental model:** Pod = atom. Pick the **controller** that matches how your app behaves when it restarts and scales.
