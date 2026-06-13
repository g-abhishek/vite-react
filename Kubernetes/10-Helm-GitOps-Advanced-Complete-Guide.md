# Helm, GitOps & Advanced Kubernetes — Complete Guide

> Helm charts, Argo CD, CRDs, Operators, deployment patterns, and service mesh intro.

---

## Table of Contents

1. [When You Outgrow Plain YAML](#1-when-you-outgrow-plain-yaml)
2. [Helm — Package Manager for Kubernetes](#2-helm--package-manager-for-kubernetes)
3. [GitOps — Argo CD & Flux](#3-gitops--argo-cd--flux)
4. [CRDs & Operators](#4-crds--operators)
5. [Advanced Deployment Patterns](#5-advanced-deployment-patterns)
6. [Service Mesh Intro (Istio)](#6-service-mesh-intro-istio)
7. [cert-manager — Automatic TLS](#7-cert-manager--automatic-tls)
8. [Multi-Cluster & Federation](#8-multi-cluster--federation)
9. [When to Use What](#9-when-to-use-what)
10. [Summary Cheatsheet](#summary-cheatsheet)

---

## 1. When You Outgrow Plain YAML

| Problem | Solution |
|---------|----------|
| 50 YAML files, copy-paste between envs | Helm templating |
| Manual kubectl apply in prod | GitOps (Argo CD) |
| Install Prometheus by hand | Helm chart or Operator |
| Complex stateful app (Postgres HA) | Operator (CloudNativePG) |
| mTLS between all services | Service mesh |

---

## 2. Helm — Package Manager for Kubernetes

### Concepts

| Term | Meaning |
|------|---------|
| **Chart** | Package of templated K8s resources |
| **Release** | Installed instance of a chart |
| **values.yaml** | Configuration overrides |

### Commands

```bash
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update
helm search repo redis

helm install my-redis bitnami/redis \
  --set auth.password=secret \
  --namespace production

helm list -n production
helm upgrade my-redis bitnami/redis --set replica.replicaCount=3
helm rollback my-redis 1
helm uninstall my-redis
```

### Custom chart structure

```
my-api-chart/
  Chart.yaml
  values.yaml
  values-staging.yaml
  values-production.yaml
  templates/
    deployment.yaml
    service.yaml
    ingress.yaml
    _helpers.tpl
```

```yaml
# values.yaml
replicaCount: 3
image:
  repository: myregistry/my-api
  tag: "1.0.0"
ingress:
  enabled: true
  host: api.example.com
```

```yaml
# templates/deployment.yaml
replicas: {{ .Values.replicaCount }}
image: {{ .Values.image.repository }}:{{ .Values.image.tag }}
```

```bash
helm install my-api ./my-api-chart -f values-production.yaml
```

---

## 3. GitOps — Argo CD & Flux

```
Git repo (YAML/Helm)  ← source of truth
        │
        ▼
Argo CD watches git
        │
        ▼
Auto-sync to cluster (or manual approve)
        │
        ▼
Drift detection — cluster must match git
```

**Why:**
- Auditable deploys (git history)
- Rollback = git revert
- No kubectl in prod CI

```yaml
# Argo CD Application (simplified)
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: my-api
spec:
  source:
    repoURL: https://github.com/org/k8s-manifests
    path: production/my-api
    targetRevision: main
  destination:
    server: https://kubernetes.default.svc
    namespace: production
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
```

---

## 4. CRDs & Operators

### Custom Resource Definition (CRD)

Extends Kubernetes API with your own objects.

```yaml
apiVersion: apiextensions.k8s.io/v1
kind: CustomResourceDefinition
metadata:
  name: databases.example.com
spec:
  group: example.com
  names:
    kind: Database
    plural: databases
  scope: Namespaced
  versions:
  - name: v1
    served: true
    storage: true
    schema: ...
```

### Operator

Controller + CRD = automated complex app management.

```
You create: Database CR (desired: Postgres 15, 3 replicas, 100GB)
Operator:   creates StatefulSet, Services, backups, failover
```

**Examples:**
- **cert-manager** — Certificate CR → auto TLS
- **CloudNativePG** — PostgreSQL clusters
- **Prometheus Operator** — ServiceMonitor CR
- **External Secrets Operator** — sync cloud secrets

---

## 5. Advanced Deployment Patterns

### Blue/Green

Two Deployments (`my-api-blue`, `my-api-green`). Switch Service selector or Ingress weight instantly.

### Canary (Argo Rollouts / Flagger)

```
v1: 90% traffic
v2: 10% traffic → monitor error rate → promote or rollback
```

### Pod Disruption Budget + cluster upgrade

Always pair production Deployments with PDB (see [07-Health-Resources](./07-Health-Resources-Autoscaling-Complete-Guide.md)).

---

## 6. Service Mesh Intro (Istio)

**Problem:** mTLS, retries, circuit breaking, observability across 50 microservices — duplicated in every app.

**Service mesh:** sidecar proxy (Envoy) in every pod handles traffic.

```
App → localhost:15001 (Envoy sidecar) → mTLS → remote Envoy → App
```

Features: mutual TLS, traffic splitting, fault injection, distributed tracing.

**When:** large microservice fleet, strong compliance (mTLS everywhere).  
**Skip when:** small team, few services — Ingress + good app code is enough.

---

## 7. cert-manager — Automatic TLS

```yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: ops@example.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
```

Ingress annotation `cert-manager.io/cluster-issuer: letsencrypt-prod` → auto TLS cert in Secret.

---

## 8. Multi-Cluster & Federation

| Pattern | Use |
|---------|-----|
| **Multi-cluster GitOps** | Argo CD manages EKS + GKE from one git repo |
| **Cluster per env** | dev cluster, prod cluster — isolation |
| **Active-active multi-region** | Global load balancer + replicated data (hard) |

Most teams: **one prod cluster per region** is enough to start.

---

## 9. When to Use What

| Need | Tool |
|------|------|
| Templating dev/staging/prod | Helm |
| Git as deploy source | Argo CD / Flux |
| Install Redis/Postgres quickly | Helm chart (dev) or managed service (prod) |
| Complex DB in K8s | Operator |
| Auto TLS | cert-manager |
| mTLS + advanced traffic | Istio / Linkerd |

---

## Summary Cheatsheet

```
Plain YAML     → learning, small apps
Helm           → templating, packaged apps
GitOps         → prod deploy discipline
Operators      → complex stateful systems
Service mesh   → many microservices, mTLS at scale
```

**Mental model:** start with YAML + git; add Helm when copy-paste hurts; add GitOps when manual apply hurts; add Operators when day-2 ops of stateful apps hurts.
