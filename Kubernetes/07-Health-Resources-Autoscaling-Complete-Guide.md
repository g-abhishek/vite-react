# Kubernetes Health, Resources & Autoscaling — Complete Guide

> Probes, CPU/memory requests & limits, QoS classes, HPA, VPA, and Pod Disruption Budgets.

---

## Table of Contents

1. [Why Health & Resources Matter Together](#1-why-health--resources-matter-together)
2. [Liveness, Readiness, Startup Probes](#2-liveness-readiness-startup-probes)
3. [Resource Requests & Limits](#3-resource-requests--limits)
4. [QoS Classes](#4-qos-classes)
5. [Horizontal Pod Autoscaler (HPA)](#5-horizontal-pod-autoscaler-hpa)
6. [Vertical Pod Autoscaler (VPA)](#6-vertical-pod-autoscaler-vpa)
7. [Pod Disruption Budget (PDB)](#7-pod-disruption-budget-pdb)
8. [Real-World Node.js Example](#8-real-world-nodejs-example)
9. [Common Pitfalls](#9-common-pitfalls)
10. [Summary Cheatsheet](#summary-cheatsheet)

---

## 1. Why Health & Resources Matter Together

```
No readiness probe  → traffic hits starting pod → 502 errors
No memory limit     → one pod OOMs entire node → cascade failure
No HPA              → manual scaling at 3 AM during flash sale
No PDB              → node drain kills all pods → outage
```

These four work **together** for reliable production apps.

---

## 2. Liveness, Readiness, Startup Probes

| Probe | Question | Fail action |
|-------|----------|-------------|
| **Startup** | Still booting? | Disable liveness until pass |
| **Readiness** | Ready for traffic? | Remove from Service endpoints |
| **Liveness** | Alive or deadlocked? | **Restart container** |

### HTTP probes (most APIs)

```yaml
startupProbe:
  httpGet:
    path: /health
    port: 3000
  failureThreshold: 30
  periodSeconds: 10          # 30 × 10s = 5 min max startup

readinessProbe:
  httpGet:
    path: /ready
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 5
  failureThreshold: 3

livenessProbe:
  httpGet:
    path: /health
    port: 3000
  initialDelaySeconds: 30
  periodSeconds: 30
  timeoutSeconds: 5
```

### Node.js health endpoints

```javascript
// Cheap — liveness (is process responding?)
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Thorough — readiness (can we serve real traffic?)
app.get('/ready', async (req, res) => {
  try {
    await db.query('SELECT 1');
    await redis.ping();
    res.json({ status: 'ready' });
  } catch {
    res.status(503).json({ status: 'not ready' });
  }
});
```

### Probe timing fields

| Field | Meaning |
|-------|---------|
| `initialDelaySeconds` | Wait before first check |
| `periodSeconds` | Check interval |
| `timeoutSeconds` | Max wait for response |
| `failureThreshold` | Failures before action |
| `successThreshold` | Successes to recover (readiness) |

**Rule:** liveness = cheap check. readiness = full dependency check. Never put DB check on liveness (DB blip → restart storm).

---

## 3. Resource Requests & Limits

```yaml
resources:
  requests:
    memory: "128Mi"
    cpu: "100m"
  limits:
    memory: "512Mi"
    cpu: "500m"
```

| Field | Effect |
|-------|--------|
| **requests** | Scheduler uses for node placement; guaranteed minimum |
| **limits** | Max allowed; exceed memory → OOMKilled; exceed CPU → throttled |

### CPU units

```
1 CPU = 1 vCPU/core
500m = 0.5 CPU
100m = 0.1 CPU
```

### Memory units

```
128Mi = 128 mebibytes
1Gi = 1 gibibyte
```

### Why both matter

```
No requests → scheduler packs too many pods → node OOM
No limits   → one pod eats all RAM → kills neighbors
```

---

## 4. QoS Classes

Kubernetes assigns QoS based on requests/limits:

| QoS | Condition | Eviction priority |
|-----|-----------|-------------------|
| **Guaranteed** | limits = requests for all containers | Last evicted |
| **Burstable** | requests set, limits differ | Middle |
| **BestEffort** | no requests/limits | First evicted |

```yaml
# Guaranteed (critical prod API)
resources:
  requests:
    memory: "512Mi"
    cpu: "500m"
  limits:
    memory: "512Mi"
    cpu: "500m"
```

---

## 5. Horizontal Pod Autoscaler (HPA)

Scales **replica count** based on metrics.

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: my-api-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: my-api
  minReplicas: 2
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 60
    scaleDown:
      stabilizationWindowSeconds: 300
```

**Requires metrics-server** (or custom metrics adapter):

```bash
kubectl top pods
kubectl top nodes
kubectl get hpa
```

### Custom metrics (requests per second)

```yaml
metrics:
- type: Pods
  pods:
    metric:
      name: http_requests_per_second
    target:
      type: AverageValue
      averageValue: "1000"
```

**Real use:** e-commerce flash sale — HPA scales 3 → 15 pods in minutes.

---

## 6. Vertical Pod Autoscaler (VPA)

Adjusts **requests/limits** per pod (not replica count).

**Use when:** right-sizing memory/CPU over time.  
**Caution:** can restart pods when updating resources — use with HPA carefully (often HPA OR VPA for same deployment).

---

## 7. Pod Disruption Budget (PDB)

Ensures minimum pods during **voluntary disruptions** (node drain, cluster upgrade).

```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: my-api-pdb
spec:
  minAvailable: 2          # or maxUnavailable: 1
  selector:
    matchLabels:
      app: my-api
```

```
3 replicas, minAvailable: 2
Node drain tries to evict pods → only 1 at a time until others rescheduled
```

**Without PDB:** node maintenance can take down all pods simultaneously.

---

## 8. Real-World Node.js Example

Complete container spec:

```yaml
containers:
- name: api
  image: myregistry/my-api:1.2.0
  ports:
  - containerPort: 3000
  startupProbe:
    httpGet: { path: /health, port: 3000 }
    failureThreshold: 30
    periodSeconds: 10
  readinessProbe:
    httpGet: { path: /ready, port: 3000 }
    periodSeconds: 5
  livenessProbe:
    httpGet: { path: /health, port: 3000 }
    periodSeconds: 30
  resources:
    requests: { memory: "256Mi", cpu: "200m" }
    limits: { memory: "512Mi", cpu: "1000m" }
```

Plus Deployment `replicas: 3`, HPA `minReplicas: 3`, PDB `minAvailable: 2`.

---

## 9. Common Pitfalls

| BAD | GOOD |
|-----|------|
| DB check on liveness | DB on readiness only |
| No startupProbe on slow Java/Node app | startupProbe with high failureThreshold |
| HPA without resource requests | Set requests — HPA needs them for CPU % |
| limits >> requests (10x) | Reasonable ratio — limits 2-4× requests |
| No PDB during cluster upgrade | PDB minAvailable: N-1 |

---

## Summary Cheatsheet

| Tool | Scales | Protects |
|------|--------|----------|
| Readiness probe | Traffic routing | Bad deploys |
| Liveness probe | Restarts dead pods | Deadlocks |
| requests/limits | Scheduling/fairness | Noisy neighbors |
| HPA | Pod count | Traffic spikes |
| VPA | CPU/memory per pod | Right-sizing |
| PDB | Min available during drain | Maintenance outages |

**Mental model:** probes = traffic gates; resources = apartment size; HPA = hire more staff; PDB = never close all checkout lanes at once.
