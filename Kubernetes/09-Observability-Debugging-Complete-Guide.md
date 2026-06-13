# Kubernetes Observability & Debugging — Complete Guide

> Logs, metrics, tracing, and a systematic debugging playbook for when things break in production.

---

## Table of Contents

1. [The Three Pillars of Observability](#1-the-three-pillars-of-observability)
2. [Logs](#2-logs)
3. [Metrics](#3-metrics)
4. [Events & kubectl Debugging](#4-events--kubectl-debugging)
5. [Debugging Playbook by Symptom](#5-debugging-playbook-by-symptom)
6. [Production Observability Stack](#6-production-observability-stack)
7. [Common Pitfalls](#7-common-pitfalls)
8. [Summary Cheatsheet](#summary-cheatsheet)

---

## 1. The Three Pillars of Observability

| Pillar | Question | K8s tools |
|--------|----------|-----------|
| **Logs** | What happened? | kubectl logs, Fluent Bit, Loki |
| **Metrics** | How much / how fast? | metrics-server, Prometheus, Grafana |
| **Traces** | Where did latency come from? | OpenTelemetry, Jaeger, Tempo |

---

## 2. Logs

### kubectl logs

```bash
kubectl logs my-api-abc12
kubectl logs -f deployment/my-api --tail=200
kubectl logs my-api-abc12 -c sidecar
kubectl logs my-api-abc12 --previous          # crashed container
kubectl logs -l app=my-api --all-containers
```

### Structured logging in Node.js

```javascript
// JSON logs — easier to query in Loki/ELK
console.log(JSON.stringify({
  level: 'info',
  msg: 'Request handled',
  pod: process.env.POD_NAME,
  method: req.method,
  path: req.path,
  ms: Date.now() - start
}));
```

Inject pod name via Downward API (see [05-Configuration](./05-Configuration-Secrets-Namespaces-Complete-Guide.md)).

### Production log pipeline

```
Pod stdout/stderr
    → DaemonSet (Fluent Bit) on each node
    → Loki / Elasticsearch / CloudWatch
    → Grafana / Kibana
```

---

## 3. Metrics

### metrics-server (built-in CPU/memory)

```bash
kubectl top pods
kubectl top nodes
kubectl top pods -n production --sort-by=memory
```

Required for **HPA** CPU-based scaling.

### Prometheus + Grafana (production)

Scrape metrics from:
- kubelet / cAdvisor (container metrics)
- kube-state-metrics (pod/deployment state)
- App `/metrics` endpoint (Prometheus client)

Key alerts:
- Pod restart rate > threshold
- HPA at maxReplicas
- Node NotReady
- PVC Pending > 5 min

---

## 4. Events & kubectl Debugging

```bash
kubectl describe pod my-api-abc12    # Events section at bottom
kubectl get events -n production --sort-by=.metadata.creationTimestamp
kubectl get pods -o wide
kubectl get endpoints my-api
```

### Active handles (leaks)

```bash
kubectl exec my-api-abc12 -- ls /proc/self/fd | wc -l
# or node-level: process._getActiveHandles in Node apps
```

---

## 5. Debugging Playbook by Symptom

### Pod Pending

```bash
kubectl describe pod <name>
```

| Event | Cause | Fix |
|-------|-------|-----|
| FailedScheduling | Insufficient CPU/RAM | Reduce requests or add nodes |
| FailedScheduling | PVC Pending | Check StorageClass |
| FailedMount | PVC not bound | `kubectl get pvc` |

### ImagePullBackOff

| Cause | Fix |
|-------|-----|
| Wrong tag | Verify image exists |
| Private registry | imagePullSecrets |
| Typo in image name | Fix deployment YAML |

### CrashLoopBackOff

```bash
kubectl logs <pod> --previous
kubectl describe pod <pod>
```

| Cause | Fix |
|-------|-----|
| App throws on startup | Fix code / env vars |
| Missing Secret key | `kubectl describe secret` |
| Liveness probe too aggressive | Increase initialDelaySeconds |
| OOMKilled | Increase memory limit or fix leak |

### Running but 502 / connection refused

```bash
kubectl get endpoints my-api    # empty = problem
kubectl describe svc my-api
```

| Cause | Fix |
|-------|-----|
| Readiness failing | Fix /ready endpoint |
| Selector mismatch | Align Service selector + pod labels |
| Wrong targetPort | Match containerPort |
| Ingress misconfigured | `kubectl describe ingress` |

### Intermittent slowness

- Check HPA — scaling lag?
- Check node CPU with `kubectl top nodes`
- Check GC / memory in app metrics
- Check database connection pool exhaustion

---

## 6. Production Observability Stack

| Layer | Popular choices |
|-------|-----------------|
| Logs | Fluent Bit → Loki / ELK |
| Metrics | Prometheus → Grafana |
| Alerts | Alertmanager → PagerDuty / Slack |
| Traces | OpenTelemetry → Jaeger / Tempo |
| APM | Datadog, New Relic (K8s agents as DaemonSet) |

---

## 7. Common Pitfalls

| BAD | GOOD |
|-----|------|
| Only `kubectl logs` in prod | Centralized log aggregation |
| No alerts on restart count | Alert on CrashLoopBackOff |
| Debug in prod without audit | Use staging replica + port-forward |
| Ignore Events section | Always `describe` first |

---

## Summary Cheatsheet

```
Pending       → describe pod → scheduling / PVC / image
CrashLoop     → logs --previous → app error / OOM / probe
502           → get endpoints → selector / readiness
Slow          → top pods + HPA + app metrics
```

**Mental model:** describe → events → logs → endpoints → fix root cause, not symptoms.
