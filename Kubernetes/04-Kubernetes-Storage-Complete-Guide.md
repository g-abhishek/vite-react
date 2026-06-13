# Kubernetes Storage — Complete Guide

> PV, PVC, StorageClass, volume types, and StatefulSet storage — persistent data that survives pod restarts.

---

## Table of Contents

1. [Why Storage Is Different in Kubernetes](#1-why-storage-is-different-in-kubernetes)
2. [Volume Types Overview](#2-volume-types-overview)
3. [PersistentVolume (PV)](#3-persistentvolume-pv)
4. [PersistentVolumeClaim (PVC)](#4-persistentvolumeclaim-pvc)
5. [StorageClass — Dynamic Provisioning](#5-storageclass--dynamic-provisioning)
6. [Access Modes & Reclaim Policies](#6-access-modes--reclaim-policies)
7. [Using Storage in Deployments & StatefulSets](#7-using-storage-in-deployments--statefulsets)
8. [Cloud Storage Examples (AWS, GCP)](#8-cloud-storage-examples-aws-gcp)
9. [Backup & Snapshots](#9-backup--snapshots)
10. [When to Use What](#10-when-to-use-what)
11. [Common Pitfalls](#11-common-pitfalls)
12. [Summary Cheatsheet](#summary-cheatsheet)

---

## 1. Why Storage Is Different in Kubernetes

Containers are **ephemeral** — when a pod dies, its filesystem dies with it.

```
Pod writes database → pod crashes → data GONE 💥
```

**Volumes** attach storage to pods. **PersistentVolumes** survive pod lifecycle.

---

## 2. Volume Types Overview

| Volume | Persists after pod? | Use case |
|--------|---------------------|----------|
| **emptyDir** | No (pod lifetime) | Scratch space, sidecar log sharing |
| **hostPath** | Yes (node disk) | Node-level data — avoid in prod (node tie) |
| **configMap / secret** | N/A | Config files as volumes |
| **persistentVolumeClaim** | Yes | Databases, uploads, any durable data |
| **projected** | N/A | Combine multiple sources into one mount |

```yaml
# emptyDir — sidecar pattern
volumes:
- name: cache
  emptyDir:
    sizeLimit: 1Gi

# PVC — durable
volumes:
- name: data
  persistentVolumeClaim:
    claimName: postgres-data
```

---

## 3. PersistentVolume (PV)

A **PV** is a piece of storage in the cluster — admin-provisioned or dynamically created.

```yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: pv-nfs-001
spec:
  capacity:
    storage: 100Gi
  accessModes:
  - ReadWriteMany
  storageClassName: nfs
  nfs:
    server: nfs.example.com
    path: /exports/data
```

**Static provisioning:** admin creates PV manually; user creates PVC that binds to it.

---

## 4. PersistentVolumeClaim (PVC)

A **PVC** is a pod's **request** for storage — like a pod requesting CPU.

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-data
  namespace: production
spec:
  accessModes:
  - ReadWriteOnce
  storageClassName: gp3
  resources:
    requests:
      storage: 50Gi
```

Use in pod:

```yaml
volumeMounts:
- name: pg-data
  mountPath: /var/lib/postgresql/data
volumes:
- name: pg-data
  persistentVolumeClaim:
    claimName: postgres-data
```

```bash
kubectl get pvc
kubectl describe pvc postgres-data   # shows Bound / Pending / events
```

**Pending PVC** = no matching PV or StorageClass can't provision.

---

## 5. StorageClass — Dynamic Provisioning

**StorageClass** = template for auto-creating PVs when PVC is created.

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: gp3
provisioner: ebs.csi.aws.com
parameters:
  type: gp3
  iops: "3000"
  throughput: "125"
volumeBindingMode: WaitForFirstConsumer   # wait until pod scheduled
allowVolumeExpansion: true
```

Flow:

```
User creates PVC (storageClassName: gp3)
    → provisioner creates EBS volume + PV
    → binds PVC to PV
    → pod mounts PVC
```

**Most cloud clusters have default StorageClass:**

```bash
kubectl get storageclass
```

---

## 6. Access Modes & Reclaim Policies

### Access modes

| Mode | Abbrev | Meaning |
|------|--------|---------|
| ReadWriteOnce | RWO | One node, read-write (most block storage) |
| ReadOnlyMany | ROX | Many nodes, read-only |
| ReadWriteMany | RWX | Many nodes, read-write (NFS, EFS, Filestore) |

**EBS / GCP PD = RWO only.** Need RWX → NFS, AWS EFS, Azure Files.

### Reclaim policy (what happens when PVC deleted)

| Policy | Behavior |
|--------|----------|
| **Retain** | PV kept, data preserved — manual cleanup |
| **Delete** | PV + cloud disk deleted (default dynamic) |
| **Recycle** | Deprecated — scrub and reuse |

**Production databases:** often `Retain` + snapshot before delete.

---

## 7. Using Storage in Deployments & StatefulSets

### Deployment + PVC (single writer — careful)

Only **one pod** can mount RWO PVC. `replicas: 3` with one RWO PVC = only one pod mounts; others fail.

**Use RWO PVC with Deployment only when replicas: 1** (single-instance DB — not ideal).

### StatefulSet + volumeClaimTemplates (correct for clustered state)

```yaml
volumeClaimTemplates:
- metadata:
    name: data
  spec:
    accessModes: [ReadWriteOnce]
    storageClassName: gp3
    resources:
      requests:
        storage: 20Gi
```

Creates `data-postgres-0`, `data-postgres-1`, … — one PVC per pod, stable binding.

---

## 8. Cloud Storage Examples

| Cloud | StorageClass provisioner | Typical use |
|-------|-------------------------|-------------|
| AWS EKS | `ebs.csi.aws.com` | gp3 block (RWO) |
| AWS EKS | `efs.csi.aws.com` | EFS (RWX) |
| GCP GKE | `pd.csi.storage.gke.io` | Persistent Disk |
| Azure AKS | `disk.csi.azure.com` | Managed Disk |

---

## 9. Backup & Snapshots

**VolumeSnapshot** (CSI):

```yaml
apiVersion: snapshot.storage.k8s.io/v1
kind: VolumeSnapshot
metadata:
  name: postgres-backup-2024-01-15
spec:
  volumeSnapshotClassName: csi-aws-vsc
  source:
    persistentVolumeClaimName: postgres-data
```

**Production:** Velero for cluster-wide backup, or managed DB backups (preferred).

---

## 10. When to Use What

| Need | Solution |
|------|----------|
| Temp scratch space | emptyDir |
| Shared config file | configMap volume |
| App uploads / cache (single pod) | PVC (RWO) |
| Shared files across pods | PVC (RWX) + NFS/EFS |
| Database in K8s | StatefulSet + volumeClaimTemplates |
| Database in prod (recommended) | **Managed RDS/Cloud SQL** outside cluster |

---

## 11. Common Pitfalls

| BAD | GOOD |
|-----|------|
| Deployment replicas: 3 + one RWO PVC | StatefulSet or RWX storage |
| No StorageClass, PVC Pending | Check `kubectl get sc` |
| Expect data after `delete pod` without PVC | Use PVC for durable data |
| hostPath in prod | PVC with cloud provisioner |
| Postgres in Deployment | Managed RDS or StatefulSet + ops runbook |

---

## Summary Cheatsheet

```
PVC (request) → binds to → PV (actual disk)
StorageClass → auto-creates PV when PVC created
RWO = one node | RWX = shared across nodes
StatefulSet volumeClaimTemplates = one PVC per pod
```

**Mental model:** PVC = "I need a locker." PV = the locker. StorageClass = vending machine that creates lockers on demand.
