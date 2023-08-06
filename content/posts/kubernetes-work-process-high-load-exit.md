---
title: "Kubernetes 工作进程高负载退出场景"
date: 2023-08-06T23:00:00+08:00
draft: false
toc: true
comments: true
tags:
  - untagged
---

## 概述

在 Kubernetes 中，高负载可以分为高 CPU 占用和高内存占用，而 CPU 属于可压缩资源，因此 CPU 占用高并不会影响工作进程的稳定性，而内存属于不可压缩资源，高内存占用可能导致工作进程重启的问题。因此本文不讨论高 CPU 占用的问题，只讨论内存占用高的问题。

## 实验

> 测试代码库： [rectcircle/kubernetes-work-proc-high-load-exp](https://github.com/rectcircle/kubernetes-work-proc-high-load-exp)。

### 准备环境

使用 k3s 搭建一个单节点的测试 Kubernetes。

参见：[扩展 Kubernetes （一） k3s 测试环境搭建](/posts/extend-kubernetes-01-k3s-testing-env/)。

### 测试程序

该程序接收 2 个命令行参数，第一个为申请占用的内存大小 （单位 MB），第二个为申请前睡眠的描述。程序启动后，先睡眠，然后开始申请并使用内存，然后进入永久睡眠。

```c
#include <stdlib.h>
#include <unistd.h>

const size_t MB = 1024 * 1024;

int main(int argc, char *argv[]) {
    if (argc < 2 || argc > 3) {
        printf("usage: %s <alloc memory size mb> <delay seconds, default 10>\n", argv[0]);
        return 1;
    }
    size_t allocSize = atoi(argv[1]) * MB;
    if (allocSize == 0) {
        printf("error: alloc memory size mb must greate than 0\n");
        return 1;
    }
    int sleepSec = 0;
    if (argc == 3) {
        sleepSec = atoi(argv[2]);
    }
    if (sleepSec == 0) {
        sleepSec = 10;
    }
    // 睡眠再申请内存
    sleep(sleepSec);
    // 申请内存 （VSZ）
    char *m = (char *)malloc(allocSize * sizeof(char));
    if (m == NULL) {
        printf("error: alloc %dMB size memory failed\n", allocSize / MB);
        return 1;
    }
    // 使用内存 （RSS）
    for (size_t i = 0; i < allocSize; i++) {
        m[i] = i % 256;
    }
    while(1) {
        sleep(1);
    }
}
```

静态编译安装到 PATH。

```bash
gcc -static mem-alloc.c -o mem-alloc
sudo cp mem-alloc /usr/local/bin
```

验证。

```bash
./mem-alloc 100 10 # shell 1
# 等待 10 秒执行
ps aux | grep mem-alloc | grep -v grep # shell 2
# 输出第 6 列为内存占用，单位为  KB
# rectcir+  430460  0.6  0.6 103428 103108 pts/1   S+   23:06   0:00 ./mem-alloc 100
```

### 场景1：node 空闲但 c1 内存超过 limit

#### 总体设计

本文将构造如下 pod：

* 包含两个 container：c1 和 c2。
* c1 是主容器，包含2个进程 p1 和 p2，p1 为 1 号进程。该容器的内存资源规格为：
    * request: 1g
    * limit: 2g
* c2 是 sidecar 容器，包含 1 个进程 p3。
    * request: 0.25g
    * limit: 0.5g

#### 非 1 号进程内存直接超过 limit

`case1/pod1.yaml`

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: case1-1
spec:
  volumes:
  - name: mem-alloc
    hostPath:
      path: /usr/local/bin/mem-alloc
  containers:
  - name: p1
    image: busybox:1.36
    command:
    - /bin/sh
    args: 
    - -c
    - |
      mem-alloc 2500 1 &
      exec mem-alloc 100 5
    resources:
      requests:
        memory: 1G
      limits:
        memory: 2G
    volumeMounts:
    - mountPath: /bin/mem-alloc
      name: mem-alloc
  - name: p2
    image: busybox:1.36
    command:
      - /bin/sh
    args: 
      - -c
      - sleep infinity
    resources:
      requests:
        memory: 0.25G
      limits:
        memory: 0.5G
    volumeMounts:
    - mountPath: /bin/mem-alloc
      name: mem-alloc
```

* 挂载 `mem-alloc` 进程模拟内存占用。
* 在 c1 容器中，先启动一个子进程申请 2500 MB，再让 1 号进程申请 100 MB。
* 观察 pod、容器、进程情况

创建 pod

```bash
sudo kubectl apply -f case1/pod1.yaml
```

观察现象

```bash
# 等待 10 秒钟
sudo kubectl get pod case1-1
# 输出如下，说明在 Kubernetes 看来，pod 和 容器启动正常
# case1-1   2/2     Running   0          85s
sudo kubectl exec -it case1-1 -- top
# 输出如下，7 号进程已经被僵尸状态（STAT 为 Z），已经被 Kill，1 号进程正常
# Mem: 3956532K used, 12436616K free, 2252K shrd, 198904K buff, 1877444K cached
# CPU:  2.5% usr  0.0% sys  0.0% nic 97.5% idle  0.0% io  0.0% irq  0.0% sirq
# Load average: 0.23 0.26 0.18 2/439 20
#   PID  PPID USER     STAT   VSZ %VSZ CPU %CPU COMMAND
#     1     0 root     S     101m  0.6   3  0.0 mem-alloc 100 5
#    14     0 root     R     4404  0.0   3  0.0 top
#     7     1 root     Z        0  0.0   2  0.0 [mem-alloc]
```

清理现场

```bash
sudo kubectl delete pod case1-1
```

#### 1 号进程内存直接超过 limit

`case1/pod2.yaml`

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: case1-2
spec:
  volumes:
  - name: mem-alloc
    hostPath:
      path: /usr/local/bin/mem-alloc
  containers:
  - name: p1
    image: busybox:1.36
    command:
    - /bin/sh
    args: 
    - -c
    - |
      mem-alloc 100 1 &
      exec mem-alloc 2500 10
    resources:
      requests:
        memory: 1G
      limits:
        memory: 2G
    volumeMounts:
    - mountPath: /bin/mem-alloc
      name: mem-alloc
  - name: p2
    image: busybox:1.36
    command:
      - /bin/sh
    args: 
      - -c
      - sleep infinity
    resources:
      requests:
        memory: 0.25G
      limits:
        memory: 0.5G
    volumeMounts:
    - mountPath: /bin/mem-alloc
      name: mem-alloc
```

* 挂载 `mem-alloc` 进程模拟内存占用。
* 在 c1 容器中，先启动一个子进程申请 100 MB，再让 1 号进程申请 2500 MB。
* 观察 pod、容器、进程情况

创建 pod

```bash
sudo kubectl apply -f case1/pod2.yaml
```

观察现象

```bash
# 多次执行如下命令可以得到如下几种输出
sudo kubectl get pod case1-2
# 1. 说明在未申请内存时，状态正常
# NAME      READY   STATUS    RESTARTS   AGE
# case1-2   2/2     Running   0          5s
# 2. 说明 p1 1 号进程被 oomkill，Kubernetes 观测到了，Kubernetes 进行了重启。
# NAME      READY   STATUS      RESTARTS      AGE
# case1-2   1/2     OOMKilled   1 (21s ago)   35s
# 3. 说明 Kubernetes 对容器 p1 进行了多次 4 重启。
# NAME      READY   STATUS             RESTARTS      AGE
# case1-2   1/2     CrashLoopBackOff   4 (72s ago)   2m42s

sudo kubectl describe pod case1-2
# 输出部分内容如下，说明 p1 经过了多次重启，p2 一直正常，没有任何问题，不会收到影响。
# Containers:
#   p1:
#     State:          Waiting
#       Reason:       CrashLoopBackOff
#     Last State:     Terminated
#       Reason:       OOMKilled
#       Exit Code:    137
#       Started:      Sun, 06 Aug 2023 19:53:50 +0800
#       Finished:     Sun, 06 Aug 2023 19:54:02 +0800
#     Ready:          False
#     Restart Count:  4
#   p2:
#     State:          Running
#       Started:      Sun, 06 Aug 2023 19:51:30 +0800
#     Ready:          True
#     Restart Count:  0
# Conditions:
#   Type              Status
#   Initialized       True 
#   Ready             False 
#   ContainersReady   False 
#   PodScheduled      True 
# Events:
#   Type     Reason     Age                   From               Message
#   ----     ------     ----                  ----               -------
#   Normal   Scheduled  3m56s                 default-scheduler  Successfully assigned default/case1-2 to pve-vm-dev
#   Normal   Pulled     3m53s                 kubelet            Container image "busybox:1.36" already present on machine
#   Normal   Created    3m52s                 kubelet            Created container p2
#   Normal   Started    3m52s                 kubelet            Started container p2
#   Warning  BackOff    103s (x7 over 3m27s)  kubelet            Back-off restarting failed container p1 in pod case1-2_default(3d63226e-9063-4442-a3b8-effc6e1017ba)
#   Normal   Pulled     92s (x5 over 3m55s)   kubelet            Container image "busybox:1.36" already present on machine
#   Normal   Created    92s (x5 over 3m53s)   kubelet            Created container p1
#   Normal   Started    92s (x5 over 3m53s)   kubelet            Started container p1
```

清理现场

```bash
sudo kubectl delete pod case1-2
```

#### 容器总内存超过 limit 且 非 1 号进程内存占用更多

```yaml
# 将 p1 的 args 改为
    - |
      mem-alloc 2000 1 &
      exec mem-alloc 500 5
# 或
    - |
      mem-alloc 2000 5 &
      exec mem-alloc 500 1
```

现象都和 [非 1 号进程内存直接超过 limit](#非-1-号进程内存直接超过-limit) 一致。

#### 容器总内存超过 limit 且 1 号进程内存占用更多

```yaml
# 将 p1 的 args 改为
    - |
      mem-alloc 500 1 &
      exec mem-alloc 2000 5
# 或
    - |
      mem-alloc 500 5 &
      exec mem-alloc 2000 1
```

现象都和 [1 号进程内存直接超过 limit](#1-号进程内存直接超过-limit) 一致。

### 场景2：node 负载高发生驱逐

#### 配置 k3s kubelet 的 eviction-hard

参考 [为系统守护进程预留计算资源](https://kubernetes.io/zh-cn/docs/tasks/administer-cluster/reserve-compute-resources/)、 [k3s - 配置 - 安装配置选项 - 配置文件](https://docs.k3s.io/zh/installation/configuration#%E9%85%8D%E7%BD%AE%E6%96%87%E4%BB%B6)、[k3s - CLI 工具 - agent - 自定义标志](https://docs.k3s.io/zh/cli/agent#%E8%87%AA%E5%AE%9A%E4%B9%89%E6%A0%87%E5%BF%97)，配置 k3s kubelet 的 eviction-hard。

假设当前设备总内存为 16G，配置当前节点 Pod 最大可用 4G。

```bash
sudo sh -c 'echo "kubelet-arg: \"--eviction-hard=memory.available<12Gi\"" > /etc/rancher/k3s/config.yaml'
sudo systemctl restart k3s
sudo kubectl get node
sudo kubectl describe node pve-vm-dev
# 部分输出如下，可以看出可用内存不到 4G
# Allocatable:
#   cpu:                4
#   ephemeral-storage:  31861548Ki
#   hugepages-1Gi:      0
#   hugepages-2Mi:      0
#   memory:             3810236Ki
#   pods:               110
```

#### 多个 Pod 未超过 limit 但实际内存超过节点 available

* 创建 4 个 Pod。
* 内存实际占用分别为 512MB、768MB、1024MB、2048MB。
* 4 个 pod 的 request 和 limit 为 128MB、3GB。

`case2/pod.yaml`

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: case2-1
spec:
  volumes:
  - name: mem-alloc
    hostPath:
      path: /usr/local/bin/mem-alloc
  containers:
  - name: p1
    image: busybox:1.36
    command:
    - /bin/sh
    args: 
    - -c
    - exec mem-alloc 512 1
    resources:
      requests:
        memory: 128M
      limits:
        memory: 3G
    volumeMounts:
    - mountPath: /bin/mem-alloc
      name: mem-alloc
---
apiVersion: v1
kind: Pod
metadata:
  name: case2-2
spec:
  volumes:
  - name: mem-alloc
    hostPath:
      path: /usr/local/bin/mem-alloc
  containers:
  - name: p1
    image: busybox:1.36
    command:
    - /bin/sh
    args: 
    - -c
    - exec mem-alloc 768 3
    resources:
      requests:
        memory: 128M
      limits:
        memory: 3G
    volumeMounts:
    - mountPath: /bin/mem-alloc
      name: mem-alloc
---
apiVersion: v1
kind: Pod
metadata:
  name: case2-3
spec:
  volumes:
  - name: mem-alloc
    hostPath:
      path: /usr/local/bin/mem-alloc
  containers:
  - name: p1
    image: busybox:1.36
    command:
    - /bin/sh
    args: 
    - -c
    - exec mem-alloc 1024 6
    resources:
      requests:
        memory: 128M
      limits:
        memory: 3G
    volumeMounts:
    - mountPath: /bin/mem-alloc
      name: mem-alloc
---
apiVersion: v1
kind: Pod
metadata:
  name: case2-4
spec:
  volumes:
  - name: mem-alloc
    hostPath:
      path: /usr/local/bin/mem-alloc
  containers:
  - name: p1
    image: busybox:1.36
    command:
    - /bin/sh
    args: 
    - -c
    - exec mem-alloc 2048 10
    resources:
      requests:
        memory: 128M
      limits:
        memory: 3G
    volumeMounts:
    - mountPath: /bin/mem-alloc
      name: mem-alloc
```

创建这些 Pod

```bash
sudo kubectl apply -f case2/pod.yaml
```

观察 pod 情况

```bash
# 等待一分钟后执行
sudo kubectl get pod
# 输出如下，发现有两个状态为 Error (ContainerStatusUnknown) 停止了。
# NAME      READY   STATUS    RESTARTS   AGE
# case2-1   1/1     Running   0          2m59s
# case2-3   1/1     Running   0          2m59s
# case2-2   0/1     Error     0          2m59s
# case2-4   0/1     Error     0          2m59s

# 观察其中一个 Error 的 pod
sudo kubectl describe pod case2-2
# 部分输出如下，可以观察到触发了节点低内存，该 Pod 被驱逐。
# Status:           Failed
# Reason:           Evicted
# Message:          The node was low on resource: memory. Threshold quantity: 12Gi, available: 12536420Ki. Container p1 was using 788244Ki, request is 128M, has larger consumption of memory. 
# Conditions:
#   Type               Status
#   DisruptionTarget   True 
#   Initialized        True 
#   Ready              False 
#   ContainersReady    False 
#   PodScheduled       True 
# Events:
#   Type     Reason               Age    From               Message
#   ----     ------               ----   ----               -------
#   Normal   Scheduled            5m32s  default-scheduler  Successfully assigned default/case2-2 to pve-vm-dev
#   Normal   Pulled               5m29s  kubelet            Container image "busybox:1.36" already present on machine
#   Normal   Created              5m27s  kubelet            Created container p1
#   Normal   Started              5m27s  kubelet            Started container p1
#   Warning  Evicted              5m16s  kubelet            The node was low on resource: memory. Threshold quantity: 12Gi, available: 12536420Ki. Container p1 was using 788244Ki, request is 128M, has larger consumption of memory.
#   Normal   Killing              5m16s  kubelet            Stopping container p1
#   Warning  ExceededGracePeriod  5m6s   kubelet            Container runtime did not kill the pod within specified grace period.

# 释放资源观察是否能恢复
sudo kubectl delete pod case2-1 case2-3 case2-4
# 观察 Pod 无法恢复
sudo kubectl get pod
# NAME      READY   STATUS  RESTARTS   AGE
# case2-2   0/1     Error   1          5m49s
```

清理现场

```bash
sudo kubectl delete pod case2-1 case2-2 case2-3 case2-4
```

## 结论

* 如果 Pod 中所有进程实际使用内存总和大于 limit 的限制。
    * Linux 内核的 OOMKiller 特性会挑选一个进程 kill 掉。OOMKiller 挑选 Kill 进程的原则是：优先 Kill 内存占用高的、启动时间晚的。（TODO，更多参见：[容器核心技术（九） CGroup](https://github.com/rectcircle/rectcircle-blog/blob/master/content/posts/container-core-tech-9-cgroup.md)）
    * 如果 Kill 的是容器中 PID 非 1 的进程，则 Kubernetes 没有感知，什么事都不做。针对这种场景，需要在业务层自己恢复或者通过容器的探针机制检查，并重启容器。
    * 如果 Kill 的是容器中 PID 为 1 的进程，则当容器直接退出，Kubernetes 将容器状态设置为 OOMKilled 或 CrashLoopBackOff，并重启该容器，Pod 中其他运行中的容器不受影响。
* 如果一个节点的每一个 Pod 中所有进程实际使用内存总和均未超过 limit 的限制，但是当前节点所有 Pod 使用的内存总和超过了节点的 `Allocatable.memory` （`kubectl describe node xxx`）。
    * 将触发 Kubernetes 的节点压力驱逐逻辑，这种情况节点上的 Kubelet 会选择选择一些 Pod 将这些 Pod 的资源回收掉，这些 Pod 的状态将变为 Error / ContainerStatusUnknown，后续即使当节点空闲内存足够了，也不会恢复。
    * 如果被驱逐的 Pod 是由 Deployment 管理的，则会删除掉该 Pod，并选择另一个节点重新启动该 Pod。

## 参考

* [Kubernetes学习(kubernetes中的OOM-killer和应用程序运行时含义)](https://izsk.me/2023/02/09/Kubernetes-Out-Of-Memory-1/)
