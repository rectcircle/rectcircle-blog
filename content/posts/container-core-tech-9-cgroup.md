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

Linux 内核通过文件提供（VFS）暴露 CGroup 的 API。也就是说，用户可以通过文件系统 API 来控制进程的 CGroup 情况。

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
* 通过写入 pid `<cgroup>/cgroup.procs` 可以将一个进程移动到指定 cgroup 中。
* 假设 cgroup A 对应的路径为 `<hierarchy>/A`，B 对应的路径为 `<hierarchy>/A/B`，则可以说 A 时 B 的父 CGroup。此时，B 对资源的限制默认继承 A 的配置，且 B 不能超过 A 的配置的上限。
* 假设一个进程已经位于某个子系统为 `cpu,cpuacct` 的 hierarchy 中了，则该进程就不能加入其他的只有 `cpu` 的 hierarchy。因为如果允许这种情况存在，内核就不知道该进程的 cpu 要以哪个为准了。

## cgroup v2

## Docker 和 kubernetes 的 cgroup

## 常用的 cgroup 子系统

### cpu

#### 描述

自 Linux 2.6 起，Linux 的 CPU 调度器使用的是 CFS (完全公平调度器)。 cgroup 的 cpu 子系统中，通过 [CFS 调度器带宽控制](https://docs.kernel.org/translations/zh_CN/scheduler/sched-bwc.html)特性，以实现控制进程的 CPU 使用率的目的（只对 `non-RT` 非实时策略生效）。相关参数（文件）如下：

* `cpu.cfs_quota_us` 一个周期内最大运行时间，默认为 -1（即不限制）。需要注意的是，如果是多核情况，该值的取值范围为 `(0, 核数*cpu.cfs_period_us]`。
* `cpu.cfs_period_us` 单个 CPU 一个周期的长度，默认为 100000 us （即 100 ms），不能超过 1 s。
* `cpu.cfs_burst_us` 略，参见：[CFS 带宽控制](https://docs.kernel.org/translations/zh_CN/scheduler/sched-bwc.html)。

除了如上和 CFS 相关的参数，还有如下参数（文件）可以配置：

* `cpu.shares` 在同一层级下。组内 CPU 的权重。需要注意的是，当 CPU 空闲时，所有组内的 CPU 都是可以占有全部的 CPU 的，当 CPU 繁忙时，各个组的 CPU 时间片的分配则按照这个参数按比例分配，数值越高分配的 CPU 越多。默认为 1024。

说明：除了 cgroup 外，还有一种方式可以 CPU affinity 的方式将进程绑定到某些核心下来控制 CPU 的使用。可以通过 [`taskset`](https://man7.org/linux/man-pages/man1/taskset.1.html) 命令或 [`sched_setaffinity(2) 系统调用`](https://man7.org/linux/man-pages/man2/sched_setaffinity.2.html)设置，也可以通过 cpuset cgroup 子系统进行配置（`/sys/fs/cgroup/cpuset`），本文不多赘述。

总结：

* 配置 CPU 繁忙时调度的优先级，可以通过 `cpu.shares` 进行配置，该设置不影响系统空闲时最大 CPU 使用量。
* 限制最大 CPU 使用量，可以使用 `cpu.cfs_quota_us` 进行配置，即：`最大使用核心数 = cpu.cfs_quota_us/cpu.cfs_period_us`。（`cpu.cfs_period_us` 一般保持默认，配置分子 `cpu.cfs_quota_us` 即可），k8s 的 `resources.limit.cpu` 即通过该方式实现。

参考：

* [glommer/memcg cpu_stat/Documentation/cgroups/cpu.txt](https://kernel.googlesource.com/pub/scm/linux/kernel/git/glommer/memcg/+/cpu_stat/Documentation/cgroups/cpu.txt)
* [CFS Bandwidth Control](https://docs.kernel.org/scheduler/sched-bwc.html) | [CFS 带宽控制](https://docs.kernel.org/translations/zh_CN/scheduler/sched-bwc.html)
* [Cgroup的CPU资源隔离介绍&docker cpu限制](https://blog.csdn.net/liukuan73/article/details/53358423)

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

### devices

### net_cls

### blkio

## CGroup 的权限委托

## cgroup namespace

## 最佳实践

* 虽然 Linux 没有限制创建自己的 cgroup hierarchy。但是，一般情况下，没有必要重新创建自己的 cgroup hierarchy。因为在多数情况下，我们对每种系统资源的管控通过一棵树就可以实现。因此，直接在 `/sys/fs/cgroup/<hierarchy>/` 目录下建立自己应用的 cgroup (目录) 即可。

## 参考

https://tech.meituan.com/2015/03/31/cgroups.html

event 事件通知 https://www.jianshu.com/p/f2403e33c766
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
