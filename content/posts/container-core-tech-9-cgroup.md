---
title: "容器核心技术（九） CGroup"
date: 2022-10-15T00:15:42+08:00
draft: true
toc: true
comments: true
tags:
  - 云原生
---

## 概述

CGroup 即 Control groups (控制组)，是 Linux 内核提供的对进程资源的使用进行限制和监控的机制。

Linux 内核通过文件系统（VFS）提供 CGroup 的 API 。也就是说，用户可以通过文件系统 API 来控制进程的 CGroup 情况。

下面介绍 CGroup 的一些概念：

* cgroup (控制组)：控制一组进程的 1 种或者多种 Linux 资源的概念。
* hierarchy (层级)：cgroup 作为节点构成一颗树。 hierarchy 通过 mount 系统调用来创建，每个 hierarchy 会绑定一种或多种 subsystem。
* subsystem (子系统, resource controllers, 资源控制器)： Linux 内核支持控制的资源类型，有如下类型：

    * cpu (v1 since 2.6.24, v2 since 4.15) 限制 cpu 使用（在 v2 中，还包含 cpuacct）。
    * cpuacct (v1 since 2.6.24) cpu 使用情况统计。
    * cpuset (v1 since 2.6.24, v2 since 5.0) 限制使用那些 cpu 核心。
    * memory (v1 since 2.6.25, v2 since 4.5) 限制和统计内存使用。
    * devices (v1 since 2.6.26) 控制设备使用。
    * freezer (v1 since 2.6.28, v2 since 5.0) suspend 和 restore (resume) 该进程。
    * net_cls (v1 since 2.6.29) 给进程网络包打标。
    * blkio (v1 since 2.6.33), io (v2 since 4.5) 控制块设备的 io 。
    * perf_event (v1 since 2.6.39, v2 since 4.11) 统计 cgroup 组粒度的 perf 事件。
    * net_prio (v1 since 3.3) 配置网络接口的优先级。
    * hugetlb (v1 since 3.5, v2 since 5.6) 限制对大页表的使用。
    * pids (v1 since 4.3, v2 since 4.5) 限制允许创建的进程数量。
    * rdma (v1 since 4.11, v2 since 4.11) 限制 RDMA (远程直接内存访问)。

目前有 v1 和 v2 两个版本，API 层面 v1 和 v2 相互不兼容。另外 v2 并不能完全覆盖 v1 的能力，因此，在较新的发行版中，可以同时使用 v1 和 v2 两个版本的 cgroup API，对于 v2 不支持的部分可以继续使用 v1 的 API。

## cgroup v1

> 参考: [cgroups(7) — Linux manual page#CGROUPS VERSION 1](https://man7.org/linux/man-pages/man7/cgroups.7.html#CGROUPS_VERSION_1)

### 配置 debian 11 使用 v1

> 参考：[在新 Linux 发行版上切换 cgroups 版本](https://www.vvave.net/archives/introduction-to-linux-kernel-control-groups-v2.html)

Debian 11 已经默认启用了 cgroup v2。可以通过如下方式切换到 cgroup v1：

编辑 `/etc/default/grub`。

```
# GRUB_CMDLINE_LINUX_DEFAULT="quiet"
GRUB_CMDLINE_LINUX_DEFAULT="quiet systemd.unified_cgroup_hierarchy=false systemd.legacy_systemd_cgroup_controller=false"
```

执行生成 grub 配置。

```bash
sudo grub-mkconfig -o /boot/grub/grub.cfg
```

重启系统。

```bash
sudo reboot
```

### 观察 debian 的 cgroup

在 Linux 中，目前主流使用进程管理器(1 号进程)，是 systemd。 systemd 在系统初始化阶段会自动的创建相关 cgroup。通过 `mount | grep cgroup` 可以看到：

```
tmpfs on /sys/fs/cgroup type tmpfs (ro,nosuid,nodev,noexec,size=4096k,nr_inodes=1024,mode=755)
cgroup2 on /sys/fs/cgroup/unified type cgroup2 (rw,nosuid,nodev,noexec,relatime,nsdelegate)
cgroup on /sys/fs/cgroup/systemd type cgroup (rw,nosuid,nodev,noexec,relatime,xattr,name=systemd)
cgroup on /sys/fs/cgroup/freezer type cgroup (rw,nosuid,nodev,noexec,relatime,freezer)
cgroup on /sys/fs/cgroup/blkio type cgroup (rw,nosuid,nodev,noexec,relatime,blkio)
cgroup on /sys/fs/cgroup/cpu,cpuacct type cgroup (rw,nosuid,nodev,noexec,relatime,cpu,cpuacct)
cgroup on /sys/fs/cgroup/net_cls,net_prio type cgroup (rw,nosuid,nodev,noexec,relatime,net_cls,net_prio)
cgroup on /sys/fs/cgroup/pids type cgroup (rw,nosuid,nodev,noexec,relatime,pids)
cgroup on /sys/fs/cgroup/cpuset type cgroup (rw,nosuid,nodev,noexec,relatime,cpuset)
cgroup on /sys/fs/cgroup/memory type cgroup (rw,nosuid,nodev,noexec,relatime,memory)
cgroup on /sys/fs/cgroup/hugetlb type cgroup (rw,nosuid,nodev,noexec,relatime,hugetlb)
cgroup on /sys/fs/cgroup/perf_event type cgroup (rw,nosuid,nodev,noexec,relatime,perf_event)
cgroup on /sys/fs/cgroup/devices type cgroup (rw,nosuid,nodev,noexec,relatime,devices)
cgroup on /sys/fs/cgroup/rdma type cgroup (rw,nosuid,nodev,noexec,relatime,rdma)
```

上面的每一行，都是一个 hierarchy，以 `cgroup on /sys/fs/cgroup/cpu,cpuacct type cgroup (rw,nosuid,nodev,noexec,relatime,cpu,cpuacct)` 为例。。

* hierarchy 与 `cpu` 和 `cpuacct` 子系统关联。也就是说：systemd 在引导阶段，通过类似于命令 `mount -t cgroup -o cpu,cpuacct none /sys/fs/cgroup/cpu,cpuacct` 的系统调用创建了该 hierarchy。
* hierarchy 的根 cgroup 为 `/sys/fs/cgroup/cpu,cpuacct`。`ls -al /sys/fs/cgroup/cpu,cpuacct` 可以看到该根 cgroup 有如下文件：

    ```
    -rw-r--r--  1 root root   0 11月 28 20:54 cgroup.clone_children
    -rw-r--r--  1 root root   0 11月 28 20:46 cgroup.procs
    -r--r--r--  1 root root   0 11月 28 20:54 cgroup.sane_behavior
    -r--r--r--  1 root root   0 11月 28 20:54 cpuacct.stat
    -rw-r--r--  1 root root   0 11月 28 20:54 cpuacct.usage
    -r--r--r--  1 root root   0 11月 28 20:54 cpuacct.usage_all
    -r--r--r--  1 root root   0 11月 28 20:54 cpuacct.usage_percpu
    -r--r--r--  1 root root   0 11月 28 20:54 cpuacct.usage_percpu_sys
    -r--r--r--  1 root root   0 11月 28 20:54 cpuacct.usage_percpu_user
    -r--r--r--  1 root root   0 11月 28 20:54 cpuacct.usage_sys
    -r--r--r--  1 root root   0 11月 28 20:54 cpuacct.usage_user
    -rw-r--r--  1 root root   0 11月 28 20:54 cpu.cfs_period_us
    -rw-r--r--  1 root root   0 11月 28 20:54 cpu.cfs_quota_us
    -rw-r--r--  1 root root   0 11月 28 20:54 cpu.shares
    -r--r--r--  1 root root   0 11月 28 20:54 cpu.stat
    -rw-r--r--  1 root root   0 11月 28 20:54 notify_on_release
    -rw-r--r--  1 root root   0 11月 28 20:54 release_agent
    -rw-r--r--  1 root root   0 11月 28 20:54 tasks
    ```

* 通过对这些文件的读写，可以设置和获取该 cgroup 资源限制和使用情况，比如通过 `cat /sys/fs/cgroup/cpu,cpuacct/cgroup.procs` 可以获取关联到该 cgroup 的进程有哪些。
* 通过在 `/sys/fs/cgroup/cpu,cpuacct/` 目录创建文件，如 `mkdir test`，可以创建一个子 cgroup，此时 `ls -al test`，将看到和 `ls -al /sys/fs/cgroup/cpu,cpuacct` 类似的内容。
* 通过将 pid 写入 `cgroup.procs` 的文件，如 `sudo sh -c "echo $$ > test/cgroup.procs"`， 可以将当前 shell 加入指定的 cgroup，注意加入该 cgroup 后创建的进程将自动和该 cgroup 关联。
* 如果 `/test` cgroup 没有关联的进程（将当前 shell 移出 `sudo sh -c "echo $$ > cgroup.procs"`，否则报错：设备或资源忙），则可以通过 `sudo rmdir test` 命令删除掉该 cgroup（注意 `rm` 命令不行）。

通过 `cat /proc/self/cgroup` 可以看到当前 `cat /proc/$$/cgroup` 可以看出，当前系统的进程，都自动的关联到了 systemd 在 `/sys/fs/cgroup/` 目录下创建的 cgroup 中了。

```
12:rdma:/
11:devices:/user.slice
10:perf_event:/
9:hugetlb:/
8:memory:/user.slice/user-1000.slice/session-3.scope
7:cpuset:/
6:pids:/user.slice/user-1000.slice/session-3.scope
5:net_cls,net_prio:/
4:cpu,cpuacct:/
3:blkio:/
2:freezer:/
1:name=systemd:/user.slice/user-1000.slice/session-3.scope
0::/user.slice/user-1000.slice/session-3.scope
```

### cgroup v1 文件系统

```
/sys/fs/cgroup/
    cpu,cpuacct/           -+                         -+
        cgroup.procs        +--> <cgroup>              |
        ...                -+                          |
        docker/            -+                          |
            cgroup.procs    +--> <cgroup>              +----> <hierarchy> (cpu,cpuacct)
            ...            -+                          |
            container1/    -+--> <cgroup>              |
            container2/    -+--> <cgroup>              |
            container3/    -+--> <cgroup>             -+
    memory/                -+--> <cgroup>             -+----> <hierarchy> (memory)
    ...
```

* 所有的 hierarchy 都位于 `/sys/fs/cgroup` 目录下，该目录是一个 tmpfs，由 `systemd` 通过类似 `mount -t tmpfs -o size=4096K tmpfs /sys/fs/cgroup` 命令的系统调用创建。
* 每个 hierarchy 由 `systemd` 通过类似于 `mount -t cgroup -o cpu,cpuacct none /sys/fs/cgroup/cpu,cpuacct` 类似的系统调用创建。
* cgroup 在文件系统重表现为 hierarchy 目录下的任意一级目录，如 `<hierarchy>/`、`<hierarchy>/A` `<hierarchy>/A/B` 就是三个 cgroup。
* 每个 cgroup 包含如下信息：
    * 该 cgroup 关联的 subsystem 为调用 `mount -t cgroup` 时 -o 指定的些（通过 mount 可以看到）。
    * 该 cgroup 目录包含如下两类：
        * 文件：用于设置或者查看该 cgroup 的资源限制配置、占用情况、关联的进程。
        * 目录：该 cgroup 的子 cgroup。
* 通过将 PID 写入 `<cgroup>/cgroup.procs`，可以将一个进程移动到指定的 CGroup 中。
* 假设 CGroup A 对应的路径为 `<hierarchy>/A`，B 对应的路径为 `<hierarchy>/A/B`，则可以说 A 是 B 的父 CGroup。此时，B 对资源的限制默认继承 A 的配置，且 B 不能超过 A 的配置上限。
* 如果一个进程已经位于某个子系统为 `cpu,cpuacct` 的 hierarchy 中，那么该进程就不能加入其他只有 `cpu` 的 hierarchy。因为如果允许这种情况存在，内核就无法确定该进程的 CPU 该以哪个为准。

## cgroup v2

## Docker 和 kubernetes 的 cgroup

## 常用的 cgroup 子系统

本部分，仅介绍 cgroup v1 的内容。

### cpu、cpuacct 和 cpuset

#### cpu 描述

自 Linux 2.6 起，Linux 的 CPU 调度器使用的是 CFS (完全公平调度器)。 cgroup 的 cpu 子系统中，通过 [CFS 调度器带宽控制](https://docs.kernel.org/translations/zh_CN/scheduler/sched-bwc.html) 特性，以实现控制进程的 CPU 使用率的目的（只对 `non-RT` 非实时策略生效）。相关参数（文件）如下：

* `cpu.cfs_quota_us` 一个周期内最大运行时间，默认为 -1（即不限制）。需要注意的是，如果是多核情况，该值的取值范围为 `(0, 核数*cpu.cfs_period_us]`。
* `cpu.cfs_period_us` 单个 CPU 一个周期的长度，默认为 100000 us （即 100 ms），不能超过 1 s。
* `cpu.cfs_burst_us` 略，参见：[CFS 带宽控制](https://docs.kernel.org/translations/zh_CN/scheduler/sched-bwc.html)。

除了如上和 CFS 相关的参数，还有如下参数（文件）可以配置：

* `cpu.shares` 在同一层级下。组内 CPU 的权重。需要注意的是，当 CPU 空闲时，所有组内的 CPU 都是可以占有全部的 CPU 的，当 CPU 繁忙时，各个组的 CPU 时间片的分配则按照这个参数按比例分配，数值越高分配的 CPU 越多。默认为 1024。

说明：除了 cgroup 外，还有一种方式可以 CPU affinity 的方式将进程绑定到某些核心下来控制 CPU 的使用。可以通过 [`taskset`](https://man7.org/linux/man-pages/man1/taskset.1.html) 命令或 [`sched_setaffinity(2) 系统调用`](https://man7.org/linux/man-pages/man2/sched_setaffinity.2.html)设置，也可以通过 [cpuset cgroup 子系统](https://docs.kernel.org/admin-guide/cgroup-v1/cpusets.html?highlight=cpuset)进行配置（`/sys/fs/cgroup/cpuset`），本文不多赘述。

总结：

* 配置 CPU 繁忙时调度的优先级，可以通过 `cpu.shares` 进行配置，该设置不影响系统空闲时最大 CPU 使用量。
* 要限制最大 CPU 使用量，可以使用 `cpu.cfs_quota_us` 进行配置。即，最大使用核心数等于 `cpu.cfs_quota_us/cpu.cfs_period_us`。一般情况下 `cpu.cfs_period_us` 保持默认，只需要配置 `cpu.cfs_quota_us` 就可以了。Kubernetes 中的 resources.limit.cpu 也是通过这种方式实现的。

参考：

* [glommer/memcg cpu_stat/Documentation/cgroups/cpu.txt](https://kernel.googlesource.com/pub/scm/linux/kernel/git/glommer/memcg/+/cpu_stat/Documentation/cgroups/cpu.txt)
* [CFS Bandwidth Control](https://docs.kernel.org/scheduler/sched-bwc.html) | [CFS 带宽控制](https://docs.kernel.org/translations/zh_CN/scheduler/sched-bwc.html)
* [Cgroup的CPU资源隔离介绍&docker cpu限制](https://blog.csdn.net/liukuan73/article/details/53358423)

#### cpuacct 描述

cpuacct 子系统用于统计该 cgroup 下的进程的 CPU 使用情况。在一般的 Linux 系统中和 cpu 子系统位于同一个层次目录下即： `/sys/fs/cgroup/cpu,cpuacct`。常用文件如下：

* `cpuacct.usage` 系统运行到现在，当前 cgroup 下的进程所使用的 cpu 时间，单位为纳秒。
* `cpuacct.usage_all` 系统运行到现在，当前 cgroup 下的进程在每个核心下，用户态和内核态，分别使用的 cpu 时间，单位为纳秒。
* `cpuacct.usage_percpu` 系统运行到现在，当前 cgroup 下的进程在每个核心下，分别使用的 cpu 时间，单位为纳秒。

通过这些文件可以计算出某个 cgroup 下 CPU 的其他指标，简单的算法为：

* 获取当前时刻 `cpuacct` 相关文件内容 （记为 before）。
* sleep 1 秒后，再次获取 `cpuacct` 相关文件内容（记为 after）。
* `after - before`，即可获取 1 秒内 CPU 时间消耗情况。

最后，一些常用的指标如下：

* cgroup cpu 核心使用数： `(after{cpuacct.usage} - before{cpuacct.usage}) / 1000000000`。取值范围和 cgroup 分配的核心数有关，如：
    * `cpu.cfs_period_us` 为 100000。
    * `cpu.cfs_quota_us` 为 400000。
    * 则上述公式取值范围为 `[0, 4]`
    * 假设某一秒内其值为 `2.1` 则表示，使用了 2.1 个 CPU 核，即 `210%` 个 CPU。
* cgroup cpu 总体使用率：`(after{cpuacct.usage} - before{cpuacct.usage}) / 1000000000 / (cpu.cfs_period_us / cpu.cfs_quota_us)`。取值范围为 `[0, 1]`，即分配给该 cgroup 的全部的 cpu 资源的使用率。

这些指标在容器资源监控场景非常有用，通过 k8s 中，内置到 Kubelet 的 [`cAdvisor`](https://github.com/google/cadvisor) 对容器的 CPU 的监控的原理和上述类似，关于 k8s 的 metrics 相关，参见：[官方文档](https://kubernetes.io/zh-cn/docs/tasks/debug/debug-cluster/resource-metrics-pipeline/)。

#### cpuset 描述

cpu 子系统控制的是进程在 cpu 时间片上的分配，无法控制 cpu 被调度到哪个核心。而 cpuset 子系统控制的就是：进程能被调度到那些 cpu。一般情况下，该子系统位于位于 `/sys/fs/cgroup/cpuset` hierarchy 目录。

常用文件如下：

* `cpuset.cpus` 当前 cgroup 下的进程可以使用的 cpu 核心的范围，例如 `0-5`。

k8s 的 CPU 策略管理中，如果 kubelet 开启了 static 策略，那么，QoS 为 Guaranteed 的 Pod， 则会利用到了该特性来分配独占 CPU，参见： [官方文档](https://kubernetes.io/zh-cn/docs/tasks/administer-cluster/cpu-management-policies/#static-policy)。

#### 实验

> 参考：[使用 cgroups-v1 为应用程序设置 CPU 限制](https://access.redhat.com/documentation/zh-cn/red_hat_enterprise_linux/8/html/managing_monitoring_and_updating_the_kernel/setting-cpu-limits-to-applications-using-cgroups-v1_setting-limits-for-applications)

实验规划如下：

* 创建一个协程，改协程实现一个死循环，用来占满一个 CPU。
* 打印当前进程 CPU 占用率，此时应该是 100% 左右。
* 创建一个 demo cpu cgroup，将 CPU 上线设置为 20%。并将当前进程加入到该 cgroup 中。
* 打印当前进程 CPU 占用率，应该应该是 20% 左右。

实验代码 `src/go/01-namespace/07-cgroup/v1/01-cpu/main.go`，如下：

```go
package main

import (
	"fmt"
	"os"
	"path"
	"strconv"
	"strings"
	"time"

	"github.com/shirou/gopsutil/v3/process"
	"golang.org/x/sys/unix"
)

func usage100PercentCPU() {
	i := 0
	for {
		i = i + 1
	}
}

func printSelfCPUPercent(p *process.Process) {
	cpuPercent, err := p.Percent(1 * time.Second)
	if err != nil {
		panic(err)
	}
	fmt.Printf("%.2f%s\n", cpuPercent, "%")
}

func attachSelfToCgroup(cgroupPath string) error {
	return os.WriteFile(path.Join(cgroupPath, "cgroup.procs"), []byte(fmt.Sprint(os.Getpid())), 0644)
}

func printSelfCgroup(subsys string) {
	selfCgroupBytes, err := os.ReadFile("/proc/self/cgroup")
	if err != nil {
		panic(err)
	}
	for _, line := range strings.Split(string(selfCgroupBytes), "\n") {
		subSystems := strings.Split(strings.Split(line, ":")[1], ",")
		for _, now := range subSystems {
			if now == subsys {
				fmt.Println(line)
				return
			}
		}
	}
	panic(fmt.Errorf("subsys not found: %s", subsys))
}

func main() {

	// 启动 CPU 负载
	go usage100PercentCPU()

	p, err := process.NewProcess(int32(os.Getpid()))
	if err != nil {
		panic(err)
	}

	// 打印默认的情况
	fmt.Printf("当前进程的 cpu cgroup 为: ")
	printSelfCgroup("cpu")
	fmt.Printf("当前进程的 cpu 使用率为: ")
	printSelfCPUPercent(p)
	fmt.Println()

	// 在默认 cpu 层级，根 cgroup 创建一个名为 demo 的 cgroup。
	cpuDemoCgroupDir := "/sys/fs/cgroup/cpu/demo"
	err = os.Mkdir(cpuDemoCgroupDir, 777)
	if err != nil {
		panic(err)
	}
	defer func() {
		// 使用 unix 的 rmdir 系统调用。
		// 参考 https://github.com/opencontainers/runc/blob/main/libcontainer/cgroups/utils.go#L231
		err = unix.Rmdir(cpuDemoCgroupDir)
		if err != nil && err != unix.ENOENT {
			panic(err)
		}
	}()
	// 配置 CPU quota 为 0.2 核，0.2 * 100000 = 20000
	cpuCFSQuotaPath := path.Join(cpuDemoCgroupDir, "cpu.cfs_quota_us")
	cpuCFSPeriodPath := path.Join(cpuDemoCgroupDir, "cpu.cfs_period_us")
	cpuCFSPeriod, err := os.ReadFile(cpuCFSPeriodPath) // 100000
	if err != nil {
		panic(err)
	}
	cpuCFSPeriodInt, err := strconv.ParseInt(strings.TrimSpace(string(cpuCFSPeriod)), 10, 32)
	if err != nil {
		panic(err)
	}
	cpuCore := 0.2
	cpuCFSQuotaInt := int(cpuCore * float64(cpuCFSPeriodInt))
	err = os.WriteFile(cpuCFSQuotaPath, []byte(fmt.Sprint(cpuCFSQuotaInt)), 0644)
	if err != nil {
		panic(err)
	}
	cpuCFSQuota, err := os.ReadFile(cpuCFSQuotaPath)
	if err != nil {
		panic(err)
	}
	fmt.Printf("创建 demo cpu cgroup, 配置 core: %f, 即\n  cpu.cfs_quota_us: %s\n  cpu.cfs_quota_us: %s\n",
		cpuCore,
		strings.TrimSpace(string(cpuCFSQuota)),
		strings.TrimSpace(string(cpuCFSPeriod)),
	)
	// 将当前进程加入到当前 cgroup
	err = attachSelfToCgroup(cpuDemoCgroupDir)
	if err != nil {
		panic(err)
	}
	defer func() {
		// 进程退出前，将当前进程脱离 demo cgroup，如果不处理，删除 cgroup 将报错 device or resource busy
		err = attachSelfToCgroup("/sys/fs/cgroup/cpu")
		if err != nil {
			panic(err)
		}
	}()
	fmt.Println("当前进程已加入 demo cpu cgroup")
	fmt.Println()

	fmt.Printf("当前进程的 cpu cgroup 为: ")
	printSelfCgroup("cpu")
	fmt.Printf("当前进程的 cpu 使用率为: ")
	printSelfCPUPercent(p)
}
```

输出如下：

```
当前进程的 cpu cgroup 为: 4:cpu,cpuacct:/
当前进程的 cpu 使用率为: 93.24%

创建 demo cpu cgroup, 配置 core: 0.200000, 即
  cpu.cfs_quota_us: 20000
  cpu.cfs_quota_us: 100000
当前进程已加入 demo cpu cgroup

当前进程的 cpu cgroup 为: 4:cpu,cpuacct:/demo
当前进程的 cpu 使用率为: 21.37%
```

### memory

#### 背景知识

首先需要了解，在 Linux 中，一个进程关于内存占用的一些指标概念：

* RSS (Resident Set Size)，常驻内存大小。进程在物理内存中实际保存的总内存（包含共享库占用的共享内存总数，不包含已 swap 到磁盘中的内存），可以按照进程粒度进程统计。
* Page Cache (Buffer/Cache)，主要是 IO （文件系统）的缓存（读写文件），该部分内存一般不会回收，会根据配置达到一定水平线后进行回收，该部分内存是多个进程共享呢，由内核统一管理，不会和进程关联，在使用 cgroup 时，可以按照 cgroup 粒度进行统计。

#### 描述

cgroup 对内存的控制的相关主要参数（文件）如下所示（只介绍 [runc](https://github.com/opencontainers/runc/blob/main/libcontainer/cgroups/fs/memory.go#L20) 使用的那些）：

* `memory.limit_in_bytes` rw，默认值 9223372036854771712（0x7FFFFFFFFFFFF000 基本上等于无限制），内存使用（硬）限制，对应的指标为 RSS + Page Cache（不包含 `swap`），写入 -1 表示无限制。需要注意的是：
    * cgroup 对应指标超过该值时，内核行为由 `memory.oom_control` 参数决定：
        * `memory.oom_control.oom_kill_disable = 0` 内核将 kill -9 该 cgroup 中 `/proc/<pid>/oom_score + /proc/<pid>/oom_score_adj` 数值最高的进程（内存占用最高的）（`oom_adj` 是旧的 api，应该使用 `oom_score_adj`）。
            * `oom_score` 是由内核计算出来的，消耗内存越多分越高，存活时间越长分越低，取值范围为。
            * `oom_score_adj` 可以由用户配置，取值范围为 `['-1000', '1000']`（`-1000` 永远不会被 kill，`1000` 首先被 kill），如果想修改 `oom_score_adj` 则需要 `CAP_SYS_RESOURCE` 特权（参见：[proc(5) 手册](https://man7.org/linux/man-pages/man5/proc.5.html)）。
            * 更多关于 oom killer 参见：[Taming the OOM killer](https://lwn.net/Articles/317814/)。
        * `memory.oom_control.oom_kill_disable = 1` 该 cgroup 中的进程，调用 [brk(2) 系统调用](https://man7.org/linux/man-pages/man2/brk.2.html) （即 malloc 等）分配内存时，会进入不可中断休眠，表现是进程卡住。在这种场景，可以通过 `cgroup.event_control` 文件来监听到 oom 事件，并交由用户进程进行更精细的处理，而不是简单的 kill，更多参见下文 `cgroup.event_control`。
    * 该值会影响 Swap 分区的使用，假设该参数设置为 `100MB`，但是 `swap` 还剩余 `100MB`。则在该 cgroup 的进程看来，只要申请的内存总量 `>= 200MB` 才会被 Kill。因此，在测试该参数时，使用 `sudo swapoff -a` 先关闭 Swap 以排除 Swap 的干扰。
* `memory.soft_limit_in_bytes` rw，默认值和 `memory.limit_in_bytes` 一致，内存使用软限制，在 `CONFIG_PREEMPT_RT` 系统中不可用，对应的指标为 RSS + Page Cache。cgroup 对应指标超过该值，将触发内核，回收超过限额的进程占用的内存（猜测是回收 Page Cache），使之尽量和该值靠拢。
* `memory.memsw.limit_in_bytes` rw，默认值和 `memory.limit_in_bytes` 一致，对应的指标为 RSS + Page Cache + Swap，行为和 `memory.limit_in_bytes` 一致。
* `memory.usage_in_bytes` r，该 cgroup 中使用的内存总数，对应的指标为 RSS + Page Cache。
* `memory.max_usage_in_bytes` r，该 cgroup 使用的中内存+swap总数，对应的指标为 RSS + Page Cache + Swap。
* `memory.swappiness` rw，默认值 60，配置内存交换的发生时机，越小交换的次数越少，参见：[Understanding vm.swappiness](https://linuxhint.com/understanding_vm_swappiness/)。
* `memory.oom_control` rw，
    * 写入 `1`，可以配置禁用内核 oom killer（默认启用 oom killer）。
    * 读取可以获取到如下数据：
        * oom_kill_disable 默认为 0，是否禁用内核 oom killer。参见 `memory.limit_in_bytes` 描述。
        * under_oom bool 值类型，表示当前 cgroup 是否处于缺少内存的状态。如果该 cgroup 缺少内存，则会暂停它里面的进程。under_oom 条目报告值为 1，否则为 0。
        * oom_kill ??
* `cgroup.event_control` w，事件通知虚拟文件，某进程可以创建一个 eventfd ，并将将该 eventfd 的文件描述符写入 `cgroup.event_control`，然后内核就会将 oom 事件写入该 eventfd 文件描述符，这个进程通过 epoll 获取到该事件。有两种常见用途：
    * `memory.oom_control.oom_kill_disable = 0` ，监听 oom 事件，进行监控报警，辅助调度。
    * 配置 `memory.oom_control.oom_kill_disable = 1` ，在用户态实现 oom-killer，而不是使用内核的 oom-killer。
* `memory.stat` 获取各种 cgroup 粒度的内存相关统计数据，更多参见：[Memory Resource Controller - 5.2 stat file](https://docs.kernel.org/admin-guide/cgroup-v1/memory.html#stat-file)。
* `memory.use_hierarchy` rw，默认值 1，已弃用，是否将子 cgroup 的内存使用情况统计到当前cgroup里面。
* `memory.failcnt` rw，查看示当前 cgroup 命中限制的次数，可以通过写入 0 重置该计数器。
* `memory.numa_stat` r，类似于 `memory.stat` 用于查看 numa 架构相关内存状态。

参考：

* [Linux Kernal Docs - Memory Resource Controller](https://docs.kernel.org/admin-guide/cgroup-v1/memory.html)
* [Cgroup - Linux内存资源管理](https://zorrozou.github.io/docs/books/cgroup_linux_memory_control_group.html)
* [使用event_control监听memory cgroup的oom事件](https://www.jianshu.com/p/f2403e33c766)
* [Redhat 资源管理指南 - A.7. memory](https://access.redhat.com/documentation/zh-cn/red_hat_enterprise_linux/7/html/resource_management_guide/sec-memory)
* [linux内核的oom score是咋算出来的](https://blog.csdn.net/u010278923/article/details/105688107)
* [Taming the OOM killer](https://lwn.net/Articles/317814/)
* [proc(5) 手册](https://man7.org/linux/man-pages/man5/proc.5.html)
* [Linux swappiness参数设置与内存交换](https://cloud.tencent.com/developer/article/1503835)
* [Understanding vm.swappiness](https://linuxhint.com/understanding_vm_swappiness/)
* [Linux Cgroup系列（04）：限制cgroup的内存使用（subsystem之memory](https://segmentfault.com/a/1190000008125359)
* [Cgroup 内存使用的监测手段](https://zhuanlan.zhihu.com/p/524431768)
* [docker cgroup 技术之memory（首篇）](https://www.cnblogs.com/charlieroro/p/10180827.html)

#### 实验

实验规划如下：

1. 启动一个监控进程，创建一个 demo memory cgroup，将 `memory.limit_in_bytes` 设置为 100 MB，其他保持默认。
2. 监控进程创建两个子进程，加入上面创建的 demo memory cgroup，并申请 70 MB 内存，观察是否有一个被 kill，另外一个仍然存活。
3. 监控进程再创建一个子进程，加入上面创建的 demo memory cgroup，并设置该进程的 oom_score_adj 为 1000，并申请 50 MB 内存，观察是否有该进程被优先 kill。
4. 监控进程写入 1 到 `memory.oom_control` 禁用内核 oom killer，并通过 `cgroup.event_control` 文件配置当前进程接受 OOM 事件。
5. 监控再创建一个子进程，加入上面创建的 demo memory cgroup，并申请 50 MB 内存，观察是否有进程被 kill，观察两个进程的进程状态，观察是否 OOM 事件通知，观察 `memory.usage_in_bytes`、`memory.oom_control` 文件内容。

实验代码 `src/go/01-namespace/07-cgroup/v1/02-memory/main.go`，如下：

```go
package main

import (
	"fmt"
	"io/ioutil"
	"os"
	"os/exec"
	"path"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/shirou/gopsutil/v3/process"
	"golang.org/x/sys/unix"
)

const (
	MB                  = 1024 * 1024
	memoryDemoCgroupDir = "/sys/fs/cgroup/memory/demo"
)

const (
	SubCommandMonitor = "monitor"
	SubCommandAlloc   = "alloc"
)

var PinnedAllocMemory [][]byte

func allocMemory(size int64) {
	b := make([]byte, size)
	for i := int64(0); i < size; i++ {
		b[i] = byte(i)
	}
	PinnedAllocMemory = append(PinnedAllocMemory, b)
}

func printRSSMemory(p *process.Process) {
	m, err := p.MemoryInfo()
	if err != nil {
		panic(err)
	}
	s := 0
	for i := 0; i < len(PinnedAllocMemory[0]); i++ {
		s += int(PinnedAllocMemory[0][i])
	}
	fmt.Printf("  pid %d: %s\n", p.Pid, m.String())
}

func handleOOMEvent() {
	fmt.Println("=== handle oom event ...")
	usage_in_bytes, err := os.ReadFile(path.Join(memoryDemoCgroupDir, `memory.usage_in_bytes`))
	if err != nil {
		panic(err)
	}
	fmt.Printf("memory.usage_in_bytes: \n%s\n", string(usage_in_bytes))
	ommControlBytes, err := os.ReadFile(path.Join(memoryDemoCgroupDir, `memory.oom_control`))
	if err != nil {
		panic(err)
	}
	fmt.Printf("memory.oom_control: \n%s\n", string(ommControlBytes))
	procsBytes, err := os.ReadFile(path.Join(memoryDemoCgroupDir, "cgroup.procs"))
	if err != nil {
		panic(err)
	}
	procs := strings.Split(string(procsBytes), "\n")
	for _, pidStr := range procs {
		pidStr = strings.TrimSpace(pidStr)
		if pidStr == "" {
			break
		}
		pid64, _ := strconv.ParseInt(pidStr, 10, 32)
		p, err := process.NewProcess(int32(pid64))
		if err != nil {
			panic(err)
		}
		status, err := p.Status()
		if err != nil {
			panic(err)
		}
		oom_score, _ := os.ReadFile(fmt.Sprintf("/proc/%d/oom_score", p.Pid))
		oom_adj, _ := os.ReadFile(fmt.Sprintf("/proc/%d/oom_adj ", p.Pid))
		oom_score_adj, _ := os.ReadFile(fmt.Sprintf("/proc/%d/oom_score_adj", p.Pid))
		fmt.Printf("pid %d state is: %v (oom_adj=%s, oom_score=%s, oom_score_adj=%s)\n", p.Pid, status, strings.TrimSpace(string(oom_adj)), strings.TrimSpace(string(oom_score)), strings.TrimSpace(string(oom_score_adj)))
		// 如果要模拟内核的 oom-killer 的逻辑： oom_score + oom_adj + oom_score_adj 排序，并给最大的那个发送 SIGKILL(9) 信号。
		//
		// 但是 oom-killer 作为 Linux 内存分配的最后的保证，非常不建议禁用 oom-killer。
		//
		// 因此推荐如下：
		//   1. 通过调整 `oom_score_adj` 来调整进程的内存优先级，以自定义 oom 时 killer 的顺序。
		//   2. 可以通过监听 oom killer 事件，统计 oom 发生的频率，以辅助调度。
		//   2. 如需收集记录进程被 kill 的日志，只能通过 `dmesg` 或 /var/log/syslog 内核日志获取信息 （killed process）。
	}
}

func createOOMEventHandler() {
	// https://www.jianshu.com/p/f2403e33c766
	// https://access.redhat.com/documentation/zh-cn/red_hat_enterprise_linux/7/html/resource_management_guide/sec-memory
	var events [128]unix.EpollEvent
	var buf [8]byte
	// 创建epoll实例
	epollFd, err := unix.EpollCreate1(unix.EPOLL_CLOEXEC)
	if err != nil {
		panic(err)
	}
	// 创建eventfd实例
	efd, _ := unix.Eventfd(0, unix.EFD_CLOEXEC)

	event := unix.EpollEvent{
		Fd:     int32(efd),
		Events: unix.EPOLLHUP | unix.EPOLLIN | unix.EPOLLERR,
	}
	// 将eventfd添加到epoll中进行监听
	unix.EpollCtl(epollFd, unix.EPOLL_CTL_ADD, int(efd), &event)

	// 打开oom_control文件
	evtFile, _ := os.Open(path.Join(memoryDemoCgroupDir, "memory.oom_control"))

	// 注册oom事件，当有oom事件时，eventfd将会有数据可读
	data := fmt.Sprintf("%d %d", efd, evtFile.Fd())
	ioutil.WriteFile(path.Join(memoryDemoCgroupDir, "cgroup.event_control"), []byte(data), 0o700)

	for {
		// 开始监听oom事件
		n, err := unix.EpollWait(epollFd, events[:], -1)
		if err == nil {
			for i := 0; i < n; i++ {
				// 消费掉eventfd的数据
				unix.Read(int(events[i].Fd), buf[:])
				// 处理 oom envent
				handleOOMEvent()
			}
		}
	}
}

func monitor() {
	// 1.1 在默认 memory 层级，根 cgroup 创建一个名为 demo 的 cgroup。
	if err := os.Mkdir(memoryDemoCgroupDir, 0o755); err != nil {
		panic(err)
	}
	defer func() {
		// 使用 unix 的 rmdir 系统调用。
		// 参考 https://github.com/opencontainers/runc/blob/main/libcontainer/cgroups/utils.go#L231
		if err := unix.Rmdir(memoryDemoCgroupDir); err != nil && err != unix.ENOENT {
			panic(err)
		}
	}()
	// 1.2 配置该 cgroup 的 memory.limit_in_bytes 为 100 MB
	if err := os.WriteFile(filepath.Join(memoryDemoCgroupDir, "memory.limit_in_bytes"), []byte("100M"), 0o644); err != nil {
		panic(err)
	}

	// 2.1 创建两个进程，先加入 cgroup，再分配 70MB 左右内存（注意：实测先分配内存再加入不会被 cgroup 感知？）。
	proc1 := exec.Command("/proc/self/exe", fmt.Sprint(70*MB))
	proc1.Stdout = os.Stdout
	proc1.Stderr = os.Stderr
	if err := proc1.Start(); err != nil {
		panic(err)
	}
	proc1Done := make(chan error, 1)
	go func() { proc1Done <- proc1.Wait(); close(proc1Done) }()
	defer func() { proc1.Process.Kill(); proc1.Wait() }()
	fmt.Printf("proc1 %d start ...\n", proc1.Process.Pid)
	time.Sleep(1 * time.Second)

	proc2 := exec.Command("/proc/self/exe", fmt.Sprint(70*MB))
	proc2.Stdout = os.Stdout
	proc2.Stderr = os.Stderr
	if err := proc2.Start(); err != nil {
		panic(err)
	}
	proc2Done := make(chan error, 1)
	go func() { proc2Done <- proc2.Wait(); close(proc2Done) }()
	defer func() { proc2.Process.Kill(); proc2.Wait() }()
	fmt.Printf("proc2 %d start ...\n", proc2.Process.Pid)
	time.Sleep(1 * time.Second)

	// 2.3 观察两个进程的存活状态
	select {
	case <-proc1Done:
		fmt.Printf("proc1 %d has exited: %s\n", proc1.Process.Pid, proc1.ProcessState.String())
	default:
		fmt.Printf("proc1 %d running\n", proc1.Process.Pid)
	}
	select {
	case <-proc2Done:
		fmt.Printf("proc2 %d has exited: %s\n", proc2.Process.Pid, proc2.ProcessState.String())
	default:
		fmt.Printf("proc2 %d is running\n", proc2.Process.Pid)
	}
	fmt.Println()

	// 3.1 再创建一个子进程，加入上面创建的 demo memory cgroup，并设置该进程的 oom_score_adj 为 1000，并申请 50 MB 内存
	proc3 := exec.Command("/proc/self/exe", fmt.Sprint(50*MB), "1000")
	proc3.Stdout = os.Stdout
	proc3.Stderr = os.Stderr
	if err := proc3.Start(); err != nil {
		panic(err)
	}
	proc3Done := make(chan error, 1)
	go func() { proc3Done <- proc3.Wait(); close(proc3Done) }()
	defer func() { proc3.Process.Kill(); proc3.Wait() }()
	fmt.Printf("proc3 %d start ...\n", proc3.Process.Pid)
	time.Sleep(1 * time.Second)

	select {
	case <-proc1Done:
		fmt.Printf("proc1 %d has exited: %s\n", proc1.Process.Pid, proc1.ProcessState.String())
	default:
		fmt.Printf("proc1 %d running\n", proc1.Process.Pid)
	}
	select {
	case <-proc2Done:
		fmt.Printf("proc2 %d has exited: %s\n", proc2.Process.Pid, proc2.ProcessState.String())
	default:
		fmt.Printf("proc2 %d is running\n", proc2.Process.Pid)
	}
	select {
	case <-proc3Done:
		fmt.Printf("proc3 %d has exited: %s\n", proc3.Process.Pid, proc3.ProcessState.String())
	default:
		fmt.Printf("proc3 %d is running\n", proc3.Process.Pid)
	}
	fmt.Println()

	// ! 注意：这里只是一个演示，在生产环境不建议禁用 oom-killer
	// 4.1 监控进程写入 1 到 `memory.oom_control` 禁用内核 oom killer，并通过 `cgroup.event_control` 文件配置当前进程接受 OOM 事件。
	if err := os.WriteFile(filepath.Join(memoryDemoCgroupDir, "memory.oom_control"), []byte("1"), 0o644); err != nil {
		panic(err)
	}
	go createOOMEventHandler()
	// 5.1 监控再创建一个子进程，加入上面创建的 demo memory cgroup，并申请 50 MB 内存
	proc4 := exec.Command("/proc/self/exe", fmt.Sprint(50*MB))
	proc4.Stdout = os.Stdout
	proc4.Stderr = os.Stderr
	if err := proc4.Start(); err != nil {
		panic(err)
	}
	proc4Done := make(chan error, 1)
	go func() { proc4Done <- proc4.Wait(); close(proc4Done) }()
	defer func() { proc4.Process.Kill(); proc4.Wait() }()
	fmt.Printf("proc4 %d start ...\n", proc4.Process.Pid)
	time.Sleep(1 * time.Second)
	// time.Sleep(60 * time.Second)
}

// sudo swapoff -a
// go build ./src/go/01-namespace/07-cgroup/v1/02-memory && sudo ./02-memory; rm -rf ./02-memory
// sudo dmesg -T | egrep -i 'killed process'
// sudo swapon -a

func main() {
	if len(os.Args) == 1 {
		monitor()
	} else {
		s, err := strconv.ParseInt(os.Args[1], 10, 64)
		if err != nil {
			panic(err)
		}
		// 2.1.a 加入 Cgroup。
		if err = os.WriteFile(path.Join(memoryDemoCgroupDir, "cgroup.procs"), []byte(fmt.Sprint(os.Getpid())), 0o644); err != nil {
			panic(err)
		}
		// 3.1.a 配置进程的 `oom_score_adj`
		if len(os.Args) == 3 {
			adj, err := strconv.ParseInt(os.Args[2], 10, 64)
			if err != nil {
				panic(err)
			}
			if err = os.WriteFile("/proc/self/oom_score_adj", []byte(fmt.Sprint(adj)), 0o644); err != nil {
				panic(err)
			}
		}
		// 2.2.b 申请内存
		allocMemory(s)
		p, err := process.NewProcess(int32(os.Getpid()))
		if err != nil {
			panic(err)
		}
		printRSSMemory(p)
		time.Sleep(60 * time.Second)
	}
}
```

输出如下：

```
proc1 380232 start ...
  pid 380232: {"rss":80896000,"vms":1247854592,"hwm":0,"data":0,"stack":0,"locked":0,"swap":0}
proc2 380256 start ...
  pid 380256: {"rss":82972672,"vms":1247789056,"hwm":0,"data":0,"stack":0,"locked":0,"swap":0}
proc1 380232 has exited: signal: killed
proc2 380256 is running

proc3 380270 start ...
proc1 380232 has exited: signal: killed
proc2 380256 is running
proc3 380270 has exited: signal: killed

proc4 380295 start ...
=== handle oom event ...
memory.usage_in_bytes: 
104857600

memory.oom_control: 
oom_kill_disable 1
under_oom 1
oom_kill 2

pid 380256 state is: [sleep] (oom_adj=, oom_score=669, oom_score_adj=0)
pid 380295 state is: [sleep] (oom_adj=, oom_score=668, oom_score_adj=0)
```

#### 最佳实现

* oom-killer 作为 Linux 内存资源的硬限制，不建议通过 `memory.oom_control` 禁用。
* 如有对进行内存优先级的自定义需求，可以通过 `/proc/<pid>/oom_score_adj` 来调整。
* `cgroup.event_control` 仅建议用来，监听 oom killer 事件，统计 oom 发生的频率，以辅助调度。
* 如需收集记录进程被 kill 的日志，只能通过 `dmesg` 或 `/var/log/syslog` 内核日志获取信息 （killed process） 来获取。

#### k8s 驱逐

* k8s 对内存管理的最小粒度是 Pod。
* k8s 将 Pod `resources.limits.memory` 设置到 cgroup 的 `memory.limit_in_bytes`。
* k8s 会按照 [QoS](https://kubernetes.io/zh-cn/docs/tasks/configure-pod-container/quality-service-pod/) 配置 Pod 中进程的 `/proc/<pid>/oom_score_adj`。
* k8s 的后台进程 (kubelet)，会在后台监控宿主机（node）的资源水位，在触发 cgroup 的 oom-killer 之前，主动的杀死 Pod （压力驱逐，该机制仅针对类似内存之类的不可压缩资源），更多参见：[节点压力驱逐](https://kubernetes.io/zh-cn/docs/concepts/scheduling-eviction/node-pressure-eviction/)。
* 总结一下，站在 Pod 角度。可以分两种情况，来讨论 k8s Pod 因内存问题而出现异常：
    * Pod 进程实际使用的内存总和的内存超过了 `resources.limits.memory` 的限制。此时 cgroup 的 `memory.limit_in_bytes` 发生作用，会 kill 掉这个内存使用超限的进程。在这种情况下，操作的粒度是进程，因此 Pod 并不一定会被会退出，而是某个（些）进程退出。
    * Node 压力过大，Pod 申请的内存没有达到限制。此时 k8s 的节点压力驱逐机制生效，会按照策略驱逐某个（些）Pod，并重新调度到其他的 Node 中重新创建。在这种情况下，操作的粒度是 Pod，因此整个 Pod 都会退出。

### devices

### net_cls

### blkio

## CGroup 的权限委托

## cgroup namespace

## 最佳实践

* 虽然 Linux 没有限制创建自己的 cgroup hierarchy。但是，一般情况下，没有必要重新创建自己的 cgroup hierarchy。因为在多数情况下，我们对每种系统资源的管控通过一棵树就可以实现。因此，直接在 `/sys/fs/cgroup/<hierarchy>/` 目录下建立自己应用的 cgroup (目录) 即可。

## 参考

https://tech.meituan.com/2015/03/31/cgroups.html

runc https://www.jianshu.com/p/7c18075aa735
docker cgroup 配置 https://www.jianshu.com/p/fdfeabcb08b4
cgroup namespace https://hustcat.github.io/cgroup-namespace/
runc mount v1 https://github.com/opencontainers/runc/blob/main/libcontainer/rootfs_linux.go#L234 https://github.com/opencontainers/runc/blob/25c9e888686773e7e06429133578038a9abc091d/libcontainer/rootfs_linux.go#L234 binding 的方式。

原理：

* docker
    * 在宿主机的 /sys/fs/cgroup/$hierarchy/docker/容器ID
    * mount binding 到 rootfs 的 /sys/fs/cgroup/$hierarchy
* k8s
    * https://kubernetes.io/zh-cn/docs/concepts/scheduling-eviction/pod-overhead/
    * /sys/fs/cgroup/memory/kubepods/podd7f4b509-cf94-4951-9417-d1087c92a5b2
