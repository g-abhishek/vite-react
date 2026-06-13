# Kubernetes Security — Complete Guide

> RBAC, ServiceAccounts, SecurityContext, Pod Security Standards, and secrets management for production clusters.

---

## Table of Contents

1. [Security Model Overview](#1-security-model-overview)
2. [RBAC — Role-Based Access Control](#2-rbac--role-based-access-control)
3. [ServiceAccounts](#3-serviceaccounts)
4. [SecurityContext — Pod & Container Hardening](#4-securitycontext--pod--container-hardening)
5. [Pod Security Standards (PSS)](#5-pod-security-standards-pss)
6. [Network Policies (Security Layer)](#6-network-policies-security-layer)
7. [Secrets Management in Production](#7-secrets-management-in-production)
8. [Image Security](#8-image-security)
9. [Cloud IAM Integration](#9-cloud-iam-integration)
10. [Common Pitfalls](#10-common-pitfalls)
11. [Summary Cheatsheet](#summary-cheatsheet)

---

## 1. Security Model Overview

Kubernetes security has **four layers**:

```
1. Who can call the API?        → RBAC (humans, CI, pods)
2. What can pods do on nodes?   → SecurityContext, PSS
3. Who can pods talk to?         → NetworkPolicies
4. Where are secrets stored?     → Secrets + external managers
```

**Default is permissive** — secure clusters require explicit hardening.

---

## 2. RBAC — Role-Based Access Control

### Four objects

| Object | Scope | Binds |
|--------|-------|-------|
| **Role** | Namespace | verbs on resources in namespace |
| **ClusterRole** | Cluster-wide | cluster + all namespaces |
| **RoleBinding** | Namespace | Role → User/Group/ServiceAccount |
| **ClusterRoleBinding** | Cluster | ClusterRole → subject |

### Example — dev can read pods in dev namespace

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: pod-reader
  namespace: dev
rules:
- apiGroups: [""]
  resources: ["pods", "pods/log"]
  verbs: ["get", "list", "watch"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: dev-pod-readers
  namespace: dev
subjects:
- kind: Group
  name: dev-team
  apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: Role
  name: pod-reader
  apiGroup: rbac.authorization.k8s.io
```

### Common verbs

`get`, `list`, `watch`, `create`, `update`, `patch`, `delete`

### Principle of least privilege

| Role | Typical permissions |
|------|---------------------|
| Developer | get/list pods, logs in dev namespace |
| CI/CD | create/update deployments in staging |
| Admin | cluster-admin (sparingly) |
| App pod | minimal — usually no K8s API access |

```bash
kubectl auth can-i create deployments --namespace=production
kubectl auth can-i delete pods --as=system:serviceaccount:dev:default
```

---

## 3. ServiceAccounts

Every pod runs as a **ServiceAccount** (default: `default` in namespace).

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: my-api-sa
  namespace: production
---
# In Deployment
spec:
  template:
    spec:
      serviceAccountName: my-api-sa
```

**Why:** identity for RBAC (pod calling K8s API) and cloud IAM (AWS IRSA, GCP Workload Identity).

**Don't use default SA in prod** — bind minimal permissions to dedicated SA.

---

## 4. SecurityContext — Pod & Container Hardening

```yaml
spec:
  securityContext:
    runAsNonRoot: true
    runAsUser: 1000
    fsGroup: 1000
    seccompProfile:
      type: RuntimeDefault
  containers:
  - name: api
    securityContext:
      allowPrivilegeEscalation: false
      readOnlyRootFilesystem: true
      capabilities:
        drop: ["ALL"]
    volumeMounts:
    - name: tmp
      mountPath: /tmp
  volumes:
  - name: tmp
    emptyDir: {}
```

| Setting | Why |
|---------|-----|
| `runAsNonRoot` | Prevent root in container |
| `readOnlyRootFilesystem` | Limit malware write paths |
| `drop: ALL` capabilities | No CAP_SYS_ADMIN etc. |
| `allowPrivilegeEscalation: false` | Block setuid escalation |

**Dockerfile alignment:**

```dockerfile
USER node    # non-root user — matches runAsUser
```

---

## 5. Pod Security Standards (PSS)

Built-in policy levels (replacing deprecated PodSecurityPolicy):

| Level | Enforcement |
|-------|-------------|
| **Privileged** | Unrestricted — system workloads |
| **Baseline** | Blocks known risky settings (hostPath, privileged) |
| **Restricted** | Hardened — non-root, drop caps, seccomp |

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: production
  labels:
    pod-security.kubernetes.io/enforce: restricted
    pod-security.kubernetes.io/audit: restricted
    pod-security.kubernetes.io/warn: restricted
```

Pods violating policy are **rejected at admission**.

---

## 6. Network Policies (Security Layer)

See [03-Networking](./03-Kubernetes-Networking-Complete-Guide.md) for full YAML.

**Security angle:** default allow-all → NetworkPolicy default-deny + explicit allow.

```yaml
# Default deny all ingress in namespace
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-ingress
spec:
  podSelector: {}
  policyTypes:
  - Ingress
```

Then add allow rules per app.

---

## 7. Secrets Management in Production

| Approach | How |
|----------|-----|
| **External Secrets Operator** | Sync AWS Secrets Manager → K8s Secret |
| **Sealed Secrets** | Encrypt Secret in git; controller decrypts in cluster |
| **HashiCorp Vault** | Vault Agent Injector sidecar |
| **SOPS** | Mozilla SOPS encrypted files in git |

**Never:** commit plain Secrets to git. **Never:** log secret env vars.

---

## 8. Image Security

```bash
# Scan images in CI
trivy image myregistry/my-api:1.0.0

# Pin digests in prod
image: myregistry/my-api@sha256:abc123...
```

| Practice | Why |
|----------|-----|
| Private registry + imagePullSecrets | Control who pulls |
| Pin tags or digests | Reproducible deploys |
| Scan in CI | Catch CVEs before deploy |
| Distroless / alpine minimal base | Smaller attack surface |

---

## 9. Cloud IAM Integration

### AWS IRSA (IAM Roles for Service Accounts)

Pod assumes AWS IAM role without static credentials.

```yaml
metadata:
  annotations:
    eks.amazonaws.com/role-arn: arn:aws:iam::123456789:role/my-api-s3-access
```

App uses AWS SDK — credentials injected automatically.

### GCP Workload Identity

Similar — K8s SA mapped to GCP service account.

---

## 10. Common Pitfalls

| BAD | GOOD |
|-----|------|
| cluster-admin for everyone | Namespace-scoped roles |
| Pods as root | runAsNonRoot + USER in Dockerfile |
| Secrets in git | External Secrets / Sealed Secrets |
| No NetworkPolicy | Default-deny + explicit allow |
| `:latest` image tag | Pinned version or digest |
| Default ServiceAccount for apps | Dedicated SA with minimal RBAC |

---

## Summary Cheatsheet

| Layer | Tool |
|-------|------|
| API access | RBAC Role/RoleBinding |
| Pod identity | ServiceAccount |
| Container hardening | SecurityContext |
| Namespace policy | Pod Security Standards |
| Network isolation | NetworkPolicy |
| Secret storage | External Secrets / Vault |
| Cloud access | IRSA / Workload Identity |

**Mental model:** defense in depth — no single layer is enough.
