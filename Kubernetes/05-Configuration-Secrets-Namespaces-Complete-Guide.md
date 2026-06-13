# Kubernetes Configuration, Secrets & Namespaces — Complete Guide

> ConfigMaps, Secrets, Namespaces, ResourceQuotas, and the Downward API — configure apps without rebuilding images.

---

## Table of Contents

1. [Why External Configuration Matters](#1-why-external-configuration-matters)
2. [ConfigMaps](#2-configmaps)
3. [Secrets](#3-secrets)
4. [Injecting Config — Env vs Volume](#4-injecting-config--env-vs-volume)
5. [Namespaces](#5-namespaces)
6. [ResourceQuota & LimitRange](#6-resourcequota--limitrange)
7. [Downward API](#7-downward-api)
8. [Real-World Patterns](#8-real-world-patterns)
9. [Common Pitfalls](#9-common-pitfalls)
10. [Summary Cheatsheet](#summary-cheatsheet)

---

## 1. Why External Configuration Matters

**Bad:**

```dockerfile
ENV DATABASE_URL=postgres://prod-server/db   # wrong in staging!
```

**Good:** same image everywhere; Kubernetes injects config at runtime.

```
Image my-api:2.1.0  +  ConfigMap (dev)   = dev behavior
Image my-api:2.1.0  +  ConfigMap (prod)  = prod behavior
```

---

## 2. ConfigMaps

Non-sensitive configuration.

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
  namespace: production
data:
  LOG_LEVEL: "info"
  MAX_CONNECTIONS: "100"
  feature-flags.json: |
    {"newCheckout": true, "darkMode": false}
```

Create from file:

```bash
kubectl create configmap app-config --from-file=config.json
kubectl create configmap app-config --from-literal=LOG_LEVEL=debug
```

---

## 3. Secrets

Sensitive data — base64 at rest (enable **encryption at rest** in prod).

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: db-credentials
type: Opaque
stringData:                    # plain text in YAML — K8s encodes
  username: appuser
  password: s3cr3tP@ss
  database-url: postgres://appuser:s3cr3tP@ss@postgres:5432/mydb
```

### Secret types

| Type | Use |
|------|-----|
| **Opaque** | Generic key-value |
| **kubernetes.io/tls** | TLS cert + key |
| **kubernetes.io/dockerconfigjson** | Private registry auth |

### Production secrets — never plain YAML in git

| Approach | Tool |
|----------|------|
| External Secrets Operator | Sync from AWS SM / Vault |
| Sealed Secrets | Encrypted in git, decrypted in cluster |
| SOPS | Encrypted YAML in git |
| Cloud IAM | IRSA (AWS), Workload Identity (GCP) |

---

## 4. Injecting Config — Env vs Volume

### Environment variables

```yaml
env:
- name: LOG_LEVEL
  valueFrom:
    configMapKeyRef:
      name: app-config
      key: LOG_LEVEL
- name: DATABASE_URL
  valueFrom:
    secretKeyRef:
      name: db-credentials
      key: database-url
```

### envFrom — bulk inject

```yaml
envFrom:
- configMapRef:
    name: app-config
- secretRef:
    name: db-credentials
```

### Volume mount — config as files

```yaml
volumeMounts:
- name: config
  mountPath: /etc/config
  readOnly: true
volumes:
- name: config
  configMap:
    name: app-config
# Files: /etc/config/LOG_LEVEL, /etc/config/feature-flags.json
```

**When to use volume:** app reads config file on startup or watches for changes (hot reload).

**When to use env:** 12-factor apps, simple key-value.

---

## 5. Namespaces

Virtual clusters for isolation.

```bash
kubectl create namespace staging
kubectl apply -f deployment.yaml -n staging
kubectl get pods -n staging
kubectl get pods --all-namespaces
```

### DNS across namespaces

```
my-api.staging.svc.cluster.local
my-api.production.svc.cluster.local
```

Same Service name, different namespaces — no collision.

### Real org structure

| Namespace | Contents |
|-----------|----------|
| `dev` | Developer experiments |
| `staging` | Pre-prod testing |
| `production` | Live traffic |
| `monitoring` | Prometheus, Grafana |
| `ingress-nginx` | Ingress controller |

---

## 6. ResourceQuota & LimitRange

### ResourceQuota — cap total resources per namespace

```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: dev-quota
  namespace: dev
spec:
  hard:
    pods: "20"
    requests.cpu: "10"
    requests.memory: 20Gi
    limits.cpu: "20"
    limits.memory: 40Gi
    persistentvolumeclaims: "5"
```

**Why:** prevent dev namespace from consuming entire cluster.

### LimitRange — defaults per pod/container

```yaml
apiVersion: v1
kind: LimitRange
metadata:
  name: default-limits
  namespace: dev
spec:
  limits:
  - default:
      memory: 512Mi
      cpu: 500m
    defaultRequest:
      memory: 128Mi
      cpu: 100m
    type: Container
```

**Why:** pods without limits get sensible defaults instead of unlimited.

---

## 7. Downward API

Expose pod metadata to the container itself.

```yaml
env:
- name: POD_NAME
  valueFrom:
    fieldRef:
      fieldPath: metadata.name
- name: POD_NAMESPACE
  valueFrom:
    fieldRef:
      fieldPath: metadata.namespace
- name: POD_IP
  valueFrom:
    fieldRef:
      fieldPath: status.podIP
```

**Use case:** logging (include pod name in log lines), registration with service discovery.

---

## 8. Real-World Patterns

### Pattern — same app, three environments

```
namespaces: dev, staging, production
each has: ConfigMap (app-config) + Secret (db-credentials)
same Deployment YAML, different namespace: kubectl apply -n staging
```

### Pattern — feature flags

```yaml
data:
  FEATURE_NEW_CHECKOUT: "true"
```

Change ConfigMap → rolling restart pods → feature toggled without new image.

### Pattern — private Docker registry

```bash
kubectl create secret docker-registry regcred \
  --docker-server=myregistry.io \
  --docker-username=user \
  --docker-password=pass
```

```yaml
spec:
  imagePullSecrets:
  - name: regcred
```

---

## 9. Common Pitfalls

| BAD | GOOD |
|-----|------|
| Secrets in git | External Secrets / Sealed Secrets |
| ConfigMap for passwords | Secret (or external manager) |
| Forget restart after ConfigMap change | `kubectl rollout restart deployment/my-api` |
| Hardcode namespace in app | Downward API or env from helm values |
| No ResourceQuota in shared cluster | Quota per team namespace |

**Note:** ConfigMap/Secret volume updates can take ~60s to propagate; env vars require pod restart.

---

## Summary Cheatsheet

| Object | Stores | Sensitive? |
|--------|--------|------------|
| ConfigMap | Config, feature flags | No |
| Secret | Passwords, tokens, TLS | Yes |
| Namespace | Isolation boundary | — |
| ResourceQuota | Namespace resource cap | — |
| LimitRange | Default pod limits | — |

**Golden rule:** build once (image), configure many (ConfigMap/Secret per env).
