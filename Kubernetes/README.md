# Kubernetes Learning Guide

Understand Kubernetes from first principles — *what*, *why*, *where*, and *real use cases* — split into **dedicated deep-dive guides** per major concept.

## Contents

| # | Guide | Topics |
|---|-------|--------|
| — | [Master Index](./01-Kubernetes-Complete-Guide.md) | Roadmap, coverage map, study order |
| 01 | [Introduction & Architecture](./01-Kubernetes-Introduction-Complete-Guide.md) | What/why K8s, control plane, labels, reconciliation |
| 02 | [Pods & Workloads](./02-Pods-and-Workloads-Complete-Guide.md) | Pod lifecycle, Deployment, StatefulSet, DaemonSet, Job, scheduling |
| 03 | [Networking](./03-Kubernetes-Networking-Complete-Guide.md) | Services, DNS, Ingress, NetworkPolicy, kube-proxy |
| 04 | [Storage](./04-Kubernetes-Storage-Complete-Guide.md) | PV, PVC, StorageClass, volume types |
| 05 | [Configuration](./05-Configuration-Secrets-Namespaces-Complete-Guide.md) | ConfigMap, Secret, namespaces, quotas |
| 06 | [Security](./06-Kubernetes-Security-Complete-Guide.md) | RBAC, ServiceAccounts, SecurityContext, PSS |
| 07 | [Health & Autoscaling](./07-Health-Resources-Autoscaling-Complete-Guide.md) | Probes, requests/limits, HPA, VPA, PDB |
| 08 | [Operations](./08-Kubernetes-Operations-Complete-Guide.md) | kubectl, rollouts, local clusters, Node.js deploy |
| 09 | [Observability & Debugging](./09-Observability-Debugging-Complete-Guide.md) | Logs, metrics, debugging playbook |
| 10 | [Helm, GitOps & Advanced](./10-Helm-GitOps-Advanced-Complete-Guide.md) | Helm, Argo CD, CRDs, Operators, service mesh |
| 11 | [Interview Questions](./11-Kubernetes-Interview-Questions.md) | Scenario-based Q&A |

## Prerequisites

1. [Docker/01-Docker-Basics.md](../Docker/01-Docker-Basics.md)
2. [Docker/02-Dockerfile.md](../Docker/02-Dockerfile.md)

## How These Guides Teach

Every concept follows:

- **What is it?** — definition + diagram
- **Why does it exist?** — problem without it
- **Where is it used?** — YAML, kubectl, real scenarios
- **Mental model** — analogy to remember
- **BAD vs GOOD** — pitfalls section in each guide

## Quick Start

```bash
minikube start
kubectl get nodes
kubectl apply -f k8s/    # after reading 08-Operations
```

## Was the single doc enough?

The original all-in-one guide was a **good overview** but **not** every concept in production depth. It was missing or shallow on: scheduling (taints/affinity), CoreDNS, Endpoints, QoS, ResourceQuota, Pod Security Standards, VPA, cert-manager, CRDs/Operators, and GitOps. The split guides above cover those in depth.
