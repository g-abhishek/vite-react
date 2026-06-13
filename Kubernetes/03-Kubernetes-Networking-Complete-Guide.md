# Kubernetes Networking — Complete Guide

> Services, DNS, Ingress, NetworkPolicies, and kube-proxy — how traffic finds your pods and how to expose apps safely.

---

## Table of Contents

1. [The Networking Problem Kubernetes Solves](#1-the-networking-problem-kubernetes-solves)
2. [Cluster Networking Model](#2-cluster-networking-model)
3. [Services — Stable Addresses](#3-services--stable-addresses)
4. [Service Types Deep Dive](#4-service-types-deep-dive)
5. [DNS & Service Discovery (CoreDNS)](#5-dns--service-discovery-coredns)
6. [Endpoints & EndpointSlices](#6-endpoints--endpointslices)
7. [Ingress — HTTP Routing](#7-ingress--http-routing)
8. [NetworkPolicies — Pod Firewall](#8-networkpolicies--pod-firewall)
9. [kube-proxy — How ClusterIP Works](#9-kube-proxy--how-clusterip-works)
10. [Real-World Scenarios](#10-real-world-scenarios)
11. [Common Pitfalls](#11-common-pitfalls)
12. [Summary Cheatsheet](#summary-cheatsheet)

---

## 1. The Networking Problem Kubernetes Solves

Pods get a **new IP every restart**:

```
my-api-abc  →  10.244.1.5  →  crash
my-api-xyz  →  10.244.2.8  →  different IP!
```

**Without Services:** hardcode IPs → breaks constantly.  
**With Services:** call `http://my-api:80` forever.

---

## 2. Cluster Networking Model

Kubernetes requires:

1. Every pod gets a unique IP (pod-to-pod reachable without NAT)
2. Agents on nodes (kubelet) can reach all pods
3. Pods see their own IP as others see it

Implemented by **CNI plugins:** Calico, Flannel, Cilium, AWS VPC CNI.

```
Node 1: 10.0.1.10          Node 2: 10.0.1.11
  Pod A: 10.244.1.5           Pod C: 10.244.2.3
  Pod B: 10.244.1.6           Pod D: 10.244.2.4

Pod A → Pod C: direct routing, no NAT
```

---

## 3. Services — Stable Addresses

```yaml
apiVersion: v1
kind: Service
metadata:
  name: my-api
spec:
  type: ClusterIP
  selector:
    app: my-api
  ports:
  - name: http
    port: 80
    targetPort: 3000
    protocol: TCP
```

```
Client pod: GET http://my-api:80
                │
                ▼
         Service ClusterIP (virtual IP)
                │
    ┌───────────┼───────────┐
    ▼           ▼           ▼
 Pod:3000   Pod:3000   Pod:3000
```

**Key fields:**
- `port` — what clients connect to on the Service
- `targetPort` — port on the container (can be name: `http`)
- `selector` — must match pod labels

---

## 4. Service Types Deep Dive

| Type | Reachable from | Use case |
|------|----------------|----------|
| **ClusterIP** | Inside cluster only | Microservice-to-microservice |
| **NodePort** | `<NodeIP>:30000-32767` | Dev quick access |
| **LoadBalancer** | External cloud LB IP | Cloud prod (single service) |
| **ExternalName** | DNS CNAME | Point to external SaaS |

### ClusterIP (default — 90% of Services)

Internal only. Frontend → Backend via DNS.

### NodePort

```yaml
spec:
  type: NodePort
  ports:
  - port: 80
    targetPort: 3000
    nodePort: 30080
```

Access: `http://<any-node-ip>:30080` — not for production (no HA, exposes all nodes).

### LoadBalancer

Cloud provider provisions ELB/NLB. `$` per LB — expensive for many apps.

**Production pattern:** one LoadBalancer → Ingress Controller → many ClusterIP Services.

### ExternalName

```yaml
spec:
  type: ExternalName
  externalName: my-db.rds.amazonaws.com
```

Pods resolve `my-db` to external RDS hostname.

### Headless Service (ClusterIP: None)

```yaml
spec:
  clusterIP: None
  selector:
    app: postgres
```

No load balancing — DNS returns **all pod IPs**. Required for StatefulSet stable identity.

```
postgres-0.postgres-headless.default.svc.cluster.local → 10.244.1.5
postgres-1.postgres-headless.default.svc.cluster.local → 10.244.2.3
```

---

## 5. DNS & Service Discovery (CoreDNS)

Every Service gets a DNS name:

```
<service>.<namespace>.svc.cluster.local
```

| Call from | DNS name |
|-----------|----------|
| Same namespace | `my-api` or `my-api:80` |
| Other namespace | `my-api.production.svc.cluster.local` |

**CoreDNS** runs in `kube-system` — resolves Service names to ClusterIP (or pod IPs for headless).

```bash
kubectl run -it --rm debug --image=busybox --restart=Never -- nslookup my-api
```

**Real use in Node.js:**

```javascript
const redis = createClient({ url: 'redis://redis:6379' });
const apiUrl = process.env.API_URL || 'http://my-api:80';
```

No hardcoded IPs — ever.

---

## 6. Endpoints & EndpointSlices

Service → Endpoints maps Service to actual pod IPs.

```bash
kubectl get endpoints my-api
# NAME     ENDPOINTS
# my-api   10.244.1.5:3000,10.244.2.8:3000,10.244.3.2:3000
```

**Empty ENDPOINTS = no matching pods** → connection refused / 502.

Causes:
- Wrong selector
- Pods not Ready (readiness probe failing)
- Pods in different namespace

EndpointSlice — scalable replacement for Endpoints (same concept, sharded for large clusters).

---

## 7. Ingress — HTTP Routing

### Why Ingress

5 apps × LoadBalancer = 5 × ~$20/month.  
Ingress = 1 LB + path/host routing.

```
Internet → LoadBalancer → Ingress Controller → rules → Services
```

### Install Ingress Controller first

```bash
# nginx ingress (minikube)
minikube addons enable ingress

# or helm
helm install ingress-nginx ingress-nginx/ingress-nginx
```

### Ingress YAML

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: app-ingress
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  ingressClassName: nginx
  tls:
  - hosts: [api.example.com, app.example.com]
    secretName: tls-cert
  rules:
  - host: api.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: my-api
            port:
              number: 80
  - host: app.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend
            port:
              number: 80
```

### pathType

| Type | Matches |
|------|---------|
| **Prefix** | `/api` matches `/api`, `/api/users` |
| **Exact** | Only exact path |
| **ImplementationSpecific** | Depends on controller |

### Real use — path routing single domain

```yaml
rules:
- host: example.com
  http:
    paths:
    - path: /api
      pathType: Prefix
      backend:
        service:
          name: my-api
          port:
            number: 80
    - path: /
      pathType: Prefix
      backend:
        service:
          name: frontend
          port:
            number: 80
```

---

## 8. NetworkPolicies — Pod Firewall

**Default:** all pods can talk to all pods (open flat network).

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: api-allow-frontend-only
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: my-api
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: frontend
    ports:
    - protocol: TCP
      port: 3000
  egress:
  - to:
    - podSelector:
        matchLabels:
          app: postgres
    ports:
    - protocol: TCP
      port: 5432
  - to:                          # allow DNS
    - namespaceSelector:
        matchLabels:
          kubernetes.io/metadata.name: kube-system
    ports:
    - protocol: UDP
      port: 53
```

**Requires CNI that supports NetworkPolicy** (Calico, Cilium — not basic Flannel).

---

## 9. kube-proxy — How ClusterIP Works

On each node, **kube-proxy** programs iptables or IPVS rules:

```
Traffic to ClusterIP 10.96.0.5:80 → DNAT to one of pod IPs (random/load-balanced)
```

You don't configure kube-proxy — it watches Services and Endpoints automatically.

---

## 10. Real-World Scenarios

### Scenario A — internal microservices

```
frontend (Deployment) → my-api (ClusterIP Service) → postgres (ExternalName to RDS)
                     → redis (ClusterIP Service)
```

### Scenario B — public API + SPA

```
Internet → Ingress (api.example.com → my-api Service)
         → Ingress (app.example.com → frontend Service)
```

### Scenario C — debug service locally

```bash
kubectl port-forward svc/my-api 8080:80
curl http://localhost:8080/health
```

---

## 11. Common Pitfalls

| Symptom | Cause | Fix |
|---------|-------|-----|
| 502 from Ingress | Empty endpoints | Check selector, readiness probe |
| `connection refused` | Wrong targetPort | Match containerPort |
| DNS not resolving | Wrong namespace | Use FQDN or same namespace |
| NetworkPolicy blocks traffic | Missing egress DNS rule | Allow UDP 53 to kube-system |
| Ingress not working | No Ingress Controller | Install nginx-ingress |

---

## Summary Cheatsheet

| Object | Purpose |
|--------|---------|
| ClusterIP | Internal stable IP + LB |
| NodePort | Dev external access |
| LoadBalancer | Cloud external IP |
| Headless | Direct pod DNS (StatefulSet) |
| Ingress | HTTP host/path routing |
| NetworkPolicy | Restrict pod traffic |
| CoreDNS | `service.namespace.svc.cluster.local` |

**Default prod stack:** ClusterIP Services + Ingress + cert-manager for TLS.
