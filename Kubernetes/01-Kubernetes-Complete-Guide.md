# Kubernetes — Master Index

> **This folder was split into dedicated deep-dive guides.** The original single document covered basics well but was too shallow for production topics like scheduling, DNS, QoS, RBAC, and GitOps. Use this page as your roadmap.

---

## Is everything covered?

| Area | Covered? | Guide |
|------|----------|-------|
| Intro, architecture, labels, reconciliation | ✅ In depth | [01-Introduction](./01-Kubernetes-Introduction-Complete-Guide.md) |
| Pods, Deployments, StatefulSet, DaemonSet, Jobs | ✅ In depth | [02-Pods-and-Workloads](./02-Pods-and-Workloads-Complete-Guide.md) |
| Services, DNS, Ingress, NetworkPolicy | ✅ In depth | [03-Networking](./03-Kubernetes-Networking-Complete-Guide.md) |
| PV, PVC, StorageClass, volume types | ✅ In depth | [04-Storage](./04-Kubernetes-Storage-Complete-Guide.md) |
| ConfigMap, Secret, namespaces, quotas | ✅ In depth | [05-Configuration](./05-Configuration-Secrets-Namespaces-Complete-Guide.md) |
| RBAC, SecurityContext, PSS | ✅ In depth | [06-Security](./06-Kubernetes-Security-Complete-Guide.md) |
| Probes, HPA, VPA, PDB, QoS | ✅ In depth | [07-Health-Resources](./07-Health-Resources-Autoscaling-Complete-Guide.md) |
| kubectl, deploy walkthrough, rollouts | ✅ In depth | [08-Operations](./08-Kubernetes-Operations-Complete-Guide.md) |
| Logs, metrics, debugging playbook | ✅ In depth | [09-Observability](./09-Observability-Debugging-Complete-Guide.md) |
| Helm, GitOps, CRDs, Operators, mesh | ✅ In depth | [10-Advanced](./10-Helm-GitOps-Advanced-Complete-Guide.md) |
| Interview Q&A | ✅ | [11-Interview](./11-Kubernetes-Interview-Questions.md) |

### Topics added in split (were missing or shallow before)

- Labels, selectors, annotations
- Init containers, sidecars, scheduling (affinity, taints/tolerations)
- CoreDNS / full DNS resolution
- Endpoints / EndpointSlices
- Headless Services
- All volume types (emptyDir, hostPath, projected)
- ResourceQuota, LimitRange, QoS classes
- Pod Security Standards
- VPA, PDB
- External Secrets, IRSA
- cert-manager, CRDs, Operators
- GitOps (Argo CD)

### Not covered (specialist / vendor-specific)

- CKA/CKAD exam drills
- Every cloud console click-path (EKS/GKE/AKS setup)
- Full Istio/Linkerd configuration
- CNI plugin internals (Calico BGP, etc.)
- Kubernetes source code

Those require hands-on lab time + official docs beyond what a general guide needs.

---

## Recommended study order

```
Docker Basics + Dockerfile (../Docker/)
    ↓
01 Introduction & Architecture
    ↓
02 Pods & Workloads
    ↓
03 Networking
    ↓
08 Operations (hands-on deploy)
    ↓
07 Health & Autoscaling
    ↓
05 Configuration
    ↓
04 Storage
    ↓
06 Security
    ↓
09 Observability
    ↓
10 Advanced (when running real clusters)
    ↓
11 Interview review
```

---

## Quick cheatsheet

See [11-Interview Questions — Quick Comparison Tables](./11-Kubernetes-Interview-Questions.md#quick-comparison-tables)
