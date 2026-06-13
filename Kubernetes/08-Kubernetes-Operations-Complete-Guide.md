# Kubernetes Operations — Complete Guide

> kubectl, rolling updates, local clusters, and a full end-to-end Node.js deployment walkthrough.

---

## Table of Contents

1. [kubectl Fundamentals](#1-kubectl-fundamentals)
2. [Imperative vs Declarative](#2-imperative-vs-declarative)
3. [Rolling Updates & Rollbacks](#3-rolling-updates--rollbacks)
4. [Local Kubernetes Clusters](#4-local-kubernetes-clusters)
5. [Full Deploy Walkthrough — Node.js API](#5-full-deploy-walkthrough--nodejs-api)
6. [Day-2 Operations](#6-day-2-operations)
7. [Common Pitfalls](#7-common-pitfalls)
8. [Summary Cheatsheet](#summary-cheatsheet)

---

## 1. kubectl Fundamentals

`kubectl` is the CLI for the Kubernetes API.

### Context & namespace

```bash
kubectl config get-contexts
kubectl config use-context minikube
kubectl config set-context --current --namespace=production
```

### Essential commands

```bash
# Apply / delete
kubectl apply -f deployment.yaml
kubectl apply -f ./k8s/ -n production
kubectl delete -f deployment.yaml

# Inspect
kubectl get pods,deploy,svc,ingress
kubectl get pods -o wide
kubectl get all -n production
kubectl describe pod my-api-abc12
kubectl describe deployment my-api

# Logs & debug
kubectl logs my-api-abc12
kubectl logs -f deployment/my-api --tail=100
kubectl logs my-api-abc12 -c sidecar --previous
kubectl exec -it my-api-abc12 -- sh
kubectl port-forward svc/my-api 8080:80

# Scale & update
kubectl scale deployment/my-api --replicas=5
kubectl set image deployment/my-api api=my-api:v2
kubectl rollout status deployment/my-api
kubectl rollout history deployment/my-api
kubectl rollout undo deployment/my-api
```

### Generate YAML without applying

```bash
kubectl create deployment my-api --image=my-api:v1 --dry-run=client -o yaml > deployment.yaml
```

### Useful output formats

```bash
kubectl get pods -o yaml
kubectl get pods -o jsonpath='{.items[*].metadata.name}'
kubectl get events --sort-by=.metadata.creationTimestamp
```

---

## 2. Imperative vs Declarative

| Style | Example | Prod? |
|-------|---------|-------|
| Imperative | `kubectl run`, `kubectl scale` | Debug only |
| Declarative | `kubectl apply -f` | **Yes — git-tracked YAML** |

**GitOps flow:**

```
Edit YAML → git commit → CI/CD or Argo CD applies → cluster matches git
```

---

## 3. Rolling Updates & Rollbacks

```bash
# Trigger update
kubectl set image deployment/my-api api=myregistry/my-api:1.3.0
kubectl rollout status deployment/my-api

# Pause / resume (canary manual control)
kubectl rollout pause deployment/my-api
kubectl rollout resume deployment/my-api

# Rollback
kubectl rollout undo deployment/my-api
kubectl rollout undo deployment/my-api --to-revision=4
```

Watch pods during rollout:

```bash
kubectl get pods -l app=my-api -w
```

---

## 4. Local Kubernetes Clusters

| Tool | Command | Best for |
|------|---------|----------|
| **minikube** | `minikube start` | Learning, addons |
| **kind** | `kind create cluster` | CI, lightweight |
| **Docker Desktop** | Enable K8s in settings | Mac/Windows quick start |

```bash
# minikube
minikube start --cpus=4 --memory=8192
minikube addons enable ingress
minikube service my-api --url

# kind
kind create cluster --name dev
kubectl cluster-info --context kind-dev

# Verify
kubectl run nginx --image=nginx --port=80
kubectl get pods
kubectl delete pod nginx
```

---

## 5. Full Deploy Walkthrough — Node.js API

### Prerequisites

- Docker image pushed: `myregistry/my-api:1.0.0`
- Cluster running with Ingress controller

### File structure

```
k8s/
  namespace.yaml
  configmap.yaml
  secret.yaml
  deployment.yaml
  service.yaml
  ingress.yaml
  hpa.yaml
```

### Apply order

```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secret.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml
kubectl apply -f k8s/hpa.yaml

kubectl get all -n production
kubectl rollout status deployment/my-api -n production
```

### Verify

```bash
kubectl port-forward svc/my-api 8080:80 -n production
curl http://localhost:8080/health

kubectl logs -l app=my-api -n production -f
kubectl get endpoints my-api -n production
kubectl get hpa -n production
```

### Update to v1.1.0

```bash
kubectl set image deployment/my-api api=myregistry/my-api:1.1.0 -n production
kubectl rollout status deployment/my-api -n production
```

See YAML templates in [01-Introduction](./01-Kubernetes-Introduction-Complete-Guide.md) and individual guides for each resource type.

---

## 6. Day-2 Operations

| Task | Command |
|------|---------|
| Restart pods (pick up ConfigMap) | `kubectl rollout restart deployment/my-api` |
| Drain node for maintenance | `kubectl drain node1 --ignore-daemonsets` |
| Cordon node (no new pods) | `kubectl cordon node1` |
| Copy file from pod | `kubectl cp my-api-abc:/app/logs.txt ./logs.txt` |
| Debug ephemeral pod | `kubectl run debug --image=busybox -it --rm -- sh` |
| Top resources | `kubectl top pods`, `kubectl top nodes` |

---

## 7. Common Pitfalls

| BAD | GOOD |
|-----|------|
| `kubectl delete pod` expecting permanent delete | Delete Deployment, or pod recreates |
| No `-n namespace` | Always specify namespace in prod |
| Edit live cluster, not git | GitOps — edit YAML, apply |
| Skip `rollout status` | Wait for rollout before declaring success |

---

## Summary Cheatsheet

```bash
kubectl apply -f .                    # deploy
kubectl get pods,svc,deploy           # status
kubectl describe pod <name>           # debug events
kubectl logs -f deployment/<name>     # logs
kubectl exec -it <pod> -- sh          # shell
kubectl port-forward svc/<n> 8080:80  # local test
kubectl rollout undo deployment/<n>   # rollback
```

**Mental model:** kubectl is a remote control for the API server — everything is an API object.
