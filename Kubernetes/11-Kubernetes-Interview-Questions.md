# Kubernetes Interview Questions — Complete Guide

> Scenario-based Q&A covering architecture, workloads, networking, storage, security, and debugging — with answers that explain *why*, not just *what*.

---

## Table of Contents

1. [Fundamentals & Architecture](#fundamentals--architecture)
2. [Workloads — Pod, Deployment, StatefulSet](#workloads--pod-deployment-statefulset)
3. [Networking & Ingress](#networking--ingress)
4. [Storage & Configuration](#storage--configuration)
5. [Health, Resources & Scaling](#health-resources--scaling)
6. [Security & Operations](#security--operations)
7. [Scenario / Troubleshooting](#scenario--troubleshooting)
8. [Quick Comparison Tables](#quick-comparison-tables)

---

## Fundamentals & Architecture

### Q1: What is Kubernetes and why would you use it instead of Docker Compose?

<details>
<summary>Answer</summary>

**Kubernetes** orchestrates containers across **multiple machines** with auto-healing, scaling, rolling updates, and service discovery.

**Docker Compose** runs containers on **one host** — simpler, perfect for local dev and small deployments.

Use K8s when: multiple services, HA requirements, auto-scaling, zero-downtime deploys, multiple teams. Skip K8s for: single app on one VPS, early-stage startup.

</details>

### Q2: Explain the control plane components.

<details>
<summary>Answer</summary>

| Component | Role |
|-----------|------|
| **API Server** | Gateway — all requests go here |
| **etcd** | Stores all cluster state |
| **Scheduler** | Assigns pods to nodes |
| **Controller Manager** | Runs reconciliation loops |

Workers: **kubelet** (runs containers), **kube-proxy** (Service networking), **container runtime**.

Deep dive: [01-Introduction](./01-Kubernetes-Introduction-Complete-Guide.md)

</details>

### Q3: What is the reconciliation loop?

<details>
<summary>Answer</summary>

Controllers continuously compare **desired state** (YAML in etcd) vs **actual state** (running pods). On diff, they create/update/delete resources. Example: pod dies → Deployment controller creates replacement.

This is **declarative** — you specify outcome, not steps.

</details>

---

## Workloads — Pod, Deployment, StatefulSet

### Q4: Explain Pod, Deployment, ReplicaSet, and Service.

<details>
<summary>Answer</summary>

```
Deployment → ReplicaSet → Pods
Service → stable DNS/IP → Pods (by label selector)
```

- **Pod:** atomic unit, 1+ containers
- **ReplicaSet:** maintains N pods (managed by Deployment)
- **Deployment:** rolling updates, rollbacks
- **Service:** stable network endpoint

</details>

### Q5: Deployment vs StatefulSet?

<details>
<summary>Answer</summary>

| | Deployment | StatefulSet |
|---|------------|-------------|
| Pod names | Random | Stable (app-0, app-1) |
| Storage | Shared or none | Per-pod PVC |
| Order | Parallel | Ordered |
| Use | Stateless API | Kafka, ES, clustered DB |

Prod databases: prefer managed RDS over StatefulSet unless you have platform team.

Guide: [02-Pods-and-Workloads](./02-Pods-and-Workloads-Complete-Guide.md)

</details>

### Q6: What is a DaemonSet?

<details>
<summary>Answer</summary>

Ensures **one pod per node** — log collectors (Fluent Bit), monitoring agents, node storage drivers. New node joins → DaemonSet pod auto-scheduled.

</details>

---

## Networking & Ingress

### Q7: Why do we need Services if pods have IPs?

<details>
<summary>Answer</summary>

Pod IPs **change on restart**. Services provide stable ClusterIP + DNS (`my-api.namespace.svc.cluster.local`) and load-balance across matching pods.

Empty endpoints = selector mismatch or readiness probe failing.

Guide: [03-Networking](./03-Kubernetes-Networking-Complete-Guide.md)

</details>

### Q8: ClusterIP vs NodePort vs LoadBalancer vs Ingress?

<details>
<summary>Answer</summary>

| Type | Scope |
|------|-------|
| ClusterIP | Internal only |
| NodePort | NodeIP:30000-32767 |
| LoadBalancer | Cloud external LB |
| Ingress | HTTP routing — one LB, many apps |

**Prod HTTP:** ClusterIP + Ingress Controller.

</details>

### Q9: How does DNS work inside the cluster?

<details>
<summary>Answer</summary>

**CoreDNS** resolves `service.namespace.svc.cluster.local`. Same namespace: short name `my-api` works. Cross-namespace: `my-api.production.svc.cluster.local`.

</details>

---

## Storage & Configuration

### Q10: Explain PV, PVC, and StorageClass.

<details>
<summary>Answer</summary>

- **PVC:** pod's request ("I need 20Gi")
- **PV:** actual storage resource
- **StorageClass:** dynamic provisioning template

Flow: PVC created → StorageClass provisions cloud disk → PV bound → pod mounts PVC.

Guide: [04-Storage](./04-Kubernetes-Storage-Complete-Guide.md)

</details>

### Q11: ConfigMap vs Secret?

<details>
<summary>Answer</summary>

Both inject runtime config without rebuilding images. ConfigMap = non-sensitive. Secret = sensitive (base64 at rest — use encryption + external manager in prod). Neither should store prod passwords in plain git.

</details>

---

## Health, Resources & Scaling

### Q12: Liveness vs readiness vs startup probes?

<details>
<summary>Answer</summary>

| Probe | Fail action |
|-------|-------------|
| Startup | Block liveness until app booted |
| Readiness | Remove from Service (no traffic) |
| Liveness | Restart container |

DB down → readiness fails, liveness passes. Never put DB check on liveness.

Guide: [07-Health-Resources](./07-Health-Resources-Autoscaling-Complete-Guide.md)

</details>

### Q13: What happens when a pod exceeds memory limit?

<details>
<summary>Answer</summary>

**OOMKilled** (exit 137). Kubelet restarts container. Repeated → CrashLoopBackOff. Fix: increase limit or fix leak. Check with `kubectl describe pod` → Last State: Terminated, Reason: OOMKilled.

</details>

### Q14: How does HPA work?

<details>
<summary>Answer</summary>

Horizontal Pod Autoscaler watches metrics (CPU, memory, custom). When average CPU > target, scales Deployment replicas up (to maxReplicas). Requires resource **requests** set and metrics-server installed.

</details>

---

## Security & Operations

### Q15: Explain RBAC.

<details>
<summary>Answer</summary>

Role/ClusterRole define permissions (verbs on resources). RoleBinding/ClusterRoleBinding attach roles to users/groups/ServiceAccounts. Principle of least privilege — namespace-scoped roles for dev teams.

Guide: [06-Security](./06-Kubernetes-Security-Complete-Guide.md)

</details>

### Q16: How do you do a zero-downtime deploy?

<details>
<summary>Answer</summary>

Deployment with `RollingUpdate`, `maxUnavailable: 0`, readiness probes. New pods pass readiness before old terminated. Rollback: `kubectl rollout undo`.

</details>

---

## Scenario / Troubleshooting

### Q17: Pod stuck in Pending — how do you debug?

<details>
<summary>Answer</summary>

```bash
kubectl describe pod <name>
```

Look at Events: FailedScheduling (insufficient CPU/RAM), PVC not bound, taints without tolerations.

</details>

### Q18: CrashLoopBackOff — debug steps?

<details>
<summary>Answer</summary>

```bash
kubectl describe pod <name>   # OOMKilled? Probe failed?
kubectl logs <name> --previous # crash output
```

Common: missing env/Secret, app exception on boot, liveness too aggressive, OOM.

Guide: [09-Observability](./09-Observability-Debugging-Complete-Guide.md)

</details>

### Q19: Service returns 502 through Ingress?

<details>
<summary>Answer</summary>

```bash
kubectl get endpoints my-api   # empty?
kubectl describe ingress
```

Fix: selector labels, readiness probe, targetPort mismatch, Ingress backend service name/port.

</details>

### Q20: When would you NOT use Kubernetes?

<details>
<summary>Answer</summary>

Single monolith on one server, team without ops capacity, no HA requirements, serverless fits better (Lambda), stateful app simpler on managed PaaS. K8s adds complexity — justify with scale/HA/multi-team needs.

</details>

---

## Quick Comparison Tables

| Workload | Use |
|----------|-----|
| Deployment | Stateless apps |
| StatefulSet | Stable identity + storage |
| DaemonSet | One pod per node |
| Job / CronJob | Batch / scheduled |

| Service type | Use |
|--------------|-----|
| ClusterIP | Internal |
| LoadBalancer | Cloud external |
| Ingress | HTTP routing |

| QoS | Eviction order |
|-----|----------------|
| BestEffort | First |
| Burstable | Middle |
| Guaranteed | Last |

---

## Further Reading

Read the dedicated guides for depth on each topic — linked throughout this document.
