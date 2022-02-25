---
title: "容器核心技术（二） Namespace"
date: 2022-02-11T20:38:01+08:00
draft: true
toc: true
comments: true
tags:
  - 云原生
---


## 概述

在编写程序时，多数场景都是在对操作系统提供的资源进行操作。这些资源按照隔离性，可以分为进程独占资源以及全局系统资源。

进程独占资源的例子有：页表以及虚拟内存、CPU 时间片、寄存器等。这些资源的特性就是，不同进程只能操作自身的资源，进程与进程之间是隔离的。

而全局系统资源恰恰相反，全局系统资源的特性是，不同进程间是共享的，不同进程的操作会影响到其他进程。全局系统资源的例子有：文件系统、网络接口等。

全局系统资源给进程带来相互通讯协调的能力，但是也带来一些问题，即进程间相互影响。

而 Namespace 就是 Linux 提供的一种对全局系统资源进程分组隔离的机制，即：同一个 Namespace 的进程看到的全局系统资源是共享的，而不同 Namespace 的进程全局系统资源是隔离的。截止到 Linux Kernel 5.6，Linux 提供了 8 种[全局资源的 Namespace](https://man7.org/linux/man-pages/man7/namespaces.7.html#DESCRIPTION) ：

| Namespace | Flag | man 手册 | 内核版本 | 说明 |
|-----------|-----|----------|------|-----|
| Mount | CLONE_NEWNS | mount_namespaces(7) | Kernel 2.4.19, 2002 | 挂载命名空间（mount namespaces），隔离挂载点等信息，子挂载命名空间的挂载不会向上传递到父挂载命名空间，是 Linux 内核历史上第一个命名空间的概念。|
| UTS | CLONE_NEWUTS | uts_namespaces(7) | Kernel 2.6.19, 2006 | Unix 主机命名空间（UTS namespaces, UNIX Time-Sharing），隔离主机名与域名等信息，不同的 UTS 命名空间可以拥有不同的主机名，在网络上呈现为多个主机。|
| IPC |CLONE_NEWIPC | ipc_namespaces(7) | Kernel 2.6.19, 2006 | 进程间通信命名空间（IPC namespaces, Inter-Process Communication），隔离 System V IPC，不同 IPC 命名空间中的进程不能使用传统的 System V 风格的进程间通信方式，如共享内存（SHM）等。 |
| PID | CLONE_NEWNET | pid_namespaces(7) | Kernel 2.6.24, 2008 | 进程 ID 命名空间（PID namespaces），隔离进程的 PID 空间，不同的 PID 命名空间中的 PID 可以重复，互不影响。|
| Network | CLONE_NEWNET | network_namespaces(7) | Kernel 2.6.29, 2009 | 网络命名空间（network namespaces），虚拟化一个完整的网络栈，每个网络栈拥有一套完整的网络资源，包括网络设备（interfaces）、路由表与防火墙等。与其他命名空间不同，网络命名空间没有层次结构，所有的网络命名空间互相独立，每个进程只能属于一个网络命名空间，并且网络命名空间在没有进程属于它的时候不会自动消失。|
| User | CLONE_NEWUSER | user_namespaces(7) | Kernel 3.8, 2013 | 用户命名空间（user namespaces），隔离用户与组信息，子用户命名空间中的每个用户和组（UID / GID）均映射到父用户命名空间中的一个用户和组，提供一种更好的权限隔离方式。通过将容器中的 root 用户映射到主机上的一个非特权用户，可以提升容器的安全性，这也是 LXC / LXD 实现「非特权容器」的方法。|
| Cgroup | CLONE_NEWCGROUP | cgroup_namespaces(7) | Kernel 4.6, 2016 |  Cgroup 命名空间，类似 chroot，隔离 cgroup 层次结构，子命名空间看到的根 cgroup 结构实际上是父命名空间的一个子树。|
| Time | CLONE_NEWTIME | time_namespaces(7) | Kernel 5.6, 2020 | 系统时间命名空间，与 UTS 命名空间类似，允许不同的进程看到不同的系统时间。|

Namespace 在 Linux 中是进程的属性和进程组紧密相关：一个进程的 Namespace 默认是和其父进程保持一致的。Linux 提供了几个系统调用，来创建、加入观察 Namespace：

* 创建：通过 [`clone` 系统调用](https://man7.org/linux/man-pages/man2/clone.2.html)的 flag 来为**新创建的进程**创建新的 Namespace
* 加入：通过 [`setns` 系统调用](https://man7.org/linux/man-pages/man2/setns.2.html)将**当前进程**加入某个其他进程的 Namespace（注意：当前进程的权限必须大于加入的进程的 Namespace 即不能发生越权），`docker exec` 就是通过这个系统调用实现的
* 创建：通过 [`unshare` 系统调用](https://man7.org/linux/man-pages/man2/unshare.2.html)为**当前进程**创建新的 Namespace
* 查看：通过 [`ioctl` 系统调用(ioctl_ns)](https://man7.org/linux/man-pages/man2/ioctl_ns.2.html)来查找有关命名空间的信息

下文，将以 Go 语言、 C 语言、Shell 命令三种形式，来介绍这些 Namespace。实验环境说明参见：[容器核心技术（一） 实验环境准备 & Linux 基础知识](/posts/container-core-tech-1-experiment-preparation-and-linux-base)

## Mount Namespace

> 手册页面：[mount namespaces](https://man7.org/linux/man-pages/man7/mount_namespaces.7.html)。

### 核心知识

目录树是 Linux 一种的全局系统资源，对目录树的一个节点绑定一个文件系统的操作叫做挂载（`mount`），即通过 `mount` 系统调用实现的。

Linux 支持多种多样的挂载，这里先介绍几种常见的例子：

* 挂载 一个 ext4 格式的文件系统（磁盘分区） 到某个目录上
* 挂载 一个 U 盘到某个目录上
* 挂载 一个 ISO 光盘镜像文件到某个目录上

除了上述情况外，还有一个在容器技术中会用到的挂载类型

* 挂载一个 tmpfs 到 /tmp 目录，tmpfs 是一种特殊的文件系统，一般用于缓存，数据存储在内存和 swap 中，系统重启后会丢失。
* bind 某一个目录（也可以是文件）到另一个目录（也可以是文件，类型需和源保持一致），实现的效果类似于一个软链指向两一个目录，但是优点是，对于进程来说，是无法分辨出同一个文件的两个路径的关系。该能力是容器引擎实现挂载宿主机目录的核心技术。
* 将几个目录组成一套 overlay 文件系统，并挂载在某个目录，这是容器引擎（如 Docker）实现镜像和容器数据存储的核心技术，在下一篇文章有专门介绍。

本部分涉及的系统调用、函数、命令以及文档参见为：

* [mount_namespaces(7)](https://man7.org/linux/man-pages/man7/mount_namespaces.7.html)
* [clone(2) 系统调用](https://man7.org/linux/man-pages/man2/clone.2.html)
* [unshare(1) 命令](https://man7.org/linux/man-pages/man1/unshare.1.html)
* [mount(2) 系统调用](https://man7.org/linux/man-pages/man8/mount.8.html)
* [mount(8) 命令](https://man7.org/linux/man-pages/man8/mount.8.html)
* [umount(2) 系统调用](https://man7.org/linux/man-pages/man2/umount.2.html)
* [umount(8) 命令](https://man7.org/linux/man-pages/man8/umount.8.html)

### 目的

Mount Namespace 就是实现了进程间目录树挂载的隔离，即：不同 Namespace 的进程看到的目录树可以是不一样的，且这些进程中的挂载是相互不影响的。

### 实验设计

为了验证 Mount Namespace 能力的能力，我们将启动一个具有新 Mount Namespace 的 bash 的进程，这个进程将会使用 bind 挂载的方式将 `data/binding/source` 目录挂载到当前目录的 `data/binding/target` 目录，其中 `data/binding/source` 包含一个文件 `a`。并观察：

* 具有新 Mount Namespace 的 bash 进程，看到 `data/binding/source` 目录和 `data/binding/target` 目录，内容一致
* 其他普通进程，看到的 `data/binding/source` 目录和 `data/binding/target` 目录，内容**不**一致

此外还可以观察两个进程的 `mount` 命令的输出，以及 `readlink /proc/self/ns/mnt`、`cat /proc/self/mounts`、`cat /proc/self/mountinfo` 以及 `cat /proc/self/mountstats` 等的输出。

### 实验源码、效果和解释

### C 语言描述

```cpp
// gcc src/c/01-namespace/01-mount/main.c && sudo ./a.out

#define _GNU_SOURCE	   // Required for enabling clone(2)
#include <sys/wait.h>  // For waitpid(2)
#include <sys/mount.h> // For mount(2)
#include <sys/mman.h>  // For mmap(2)
#include <sched.h>	   // For clone(2)
#include <signal.h>	   // For SIGCHLD constant
#include <stdio.h>	   // For perror(3), printf(3), perror(3)
#include <unistd.h>    // For execv(3), sleep(3)
#include <stdlib.h>    // For exit(3), system(3)

#define STACK_SIZE (1024 * 1024)

char *const child_args[] = {
	"/bin/bash",
	"-xc",
	"ls data/binding/target \
	&& readlink /proc/self/ns/mnt \
	&& cat /proc/self/mounts | grep data/binding/target \
	&& cat /proc/self/mountinfo | grep data/binding/target \
	&& cat /proc/self/mountstats | grep data/binding/target \
	&& sleep 10 \
	",
	NULL};

int new_namespace_func(void *args)
{
	// 首先，需要阻止挂载事件传播到其他 Mount Namespace，参见：https://man7.org/linux/man-pages/man7/mount_namespaces.7.html#NOTES
	// 如果不执行这个语句， cat /proc/self/mountinfo 所有行将会包含 shared，这样在这个子进程中执行 mount 其他进程也会受影响
	// 更多参见：https://man7.org/linux/man-pages/man7/mount_namespaces.7.html#SHARED_SUBTREES
	mount(NULL, "/", NULL , MS_SLAVE | MS_REC, NULL);
	// 使用 MS_BIND 参数将 data/binding/source 挂载（绑定）到 data/binding/target
	// 因为在新的 Mount Namespace 中执行，所有其他进程的目录树不受影响
	mount("data/binding/source", "data/binding/target", NULL, MS_BIND, NULL);
	printf("=== new mount namespace process ===\n");
	execv(child_args[0], child_args);
	perror("exec");
	exit(EXIT_FAILURE);
}

pid_t old_namespace_exec()
{
	pid_t p = fork();
	if (p == 0)
	{
		printf("=== old namespace process ===\n");
		execv(child_args[0], child_args);
		perror("exec");
		exit(EXIT_FAILURE);
	}
	if (p == -1) {
		perror("fork");
		exit(1);
	}
	return p;
}

int main()
{
	// 为子进程提供申请函数栈
	void *child_stack = mmap(NULL, STACK_SIZE,
							 PROT_READ | PROT_WRITE,
							 MAP_PRIVATE | MAP_ANONYMOUS | MAP_STACK,
							 -1, 0);
	// 创建新的 Mount Namespace 进程中执行 new_namespace_func 函数
	pid_t p1 = clone(new_namespace_func, child_stack + STACK_SIZE, SIGCHLD | CLONE_NEWNS, NULL);
	if (p1 == -1)
	{
		perror("clone");
		exit(1);
	}
	sleep(5);
	// 创建新的进程（不创建 Namespace），并执行测试命令
	pid_t p2 = old_namespace_exec();
	waitpid(p1, NULL, 0);
	waitpid(p2, NULL, 0);
	return 0;
}
```

编译并运行，输出为：

```
=== new mount namespace process ===
+ ls data/binding/target
a
+ readlink /proc/self/ns/mnt
mnt:[4026532188]
+ grep data/binding/target
+ cat /proc/self/mounts
/dev/sda1 /home/rectcircle/container-core-tech-experiment/data/binding/target ext4 rw,relatime,errors=remount-ro 0 0
+ grep data/binding/target
+ cat /proc/self/mountinfo
231 210 8:1 /home/rectcircle/container-core-tech-experiment/data/binding/source /home/rectcircle/container-core-tech-experiment/data/binding/target rw,relatime master:1 - ext4 /dev/sda1 rw,errors=remount-ro
+ grep data/binding/target
+ cat /proc/self/mountstats
device /dev/sda1 mounted on /home/rectcircle/container-core-tech-experiment/data/binding/target with fstype ext4
+ sleep 10
=== old namespace process ===
+ ls data/binding/target
+ readlink /proc/self/ns/mnt
mnt:[4026531840]
+ grep data/binding/target
+ cat /proc/self/mounts
```

### Go 语言描述

### Bash 命令

```
sudo mount --make-private -t overlay overlay -o lowerdir=overlay/demo1/lower1:overlay/demo1/lower2,upperdir=overlay/demo1/upper,workdir=overlay/demo1/work overlay/demo1/merged
sudo mount --make-private -t overlay overlay -o lowerdir=overlay/demo2/lower1:overlay/demo2/lower2,upperdir=overlay/demo2/upper,workdir=overlay/demo2/work overlay/demo2/merged
sudo umount overlay/demo1/merged
sudo umount overlay/demo2/merged

cat /proc/self/mountinfo
readlink /proc/$$/ns/mnt 

sudo mount --bind /tmp binded
```

## 备忘

Namespace C 语言描述 https://xigang.github.io/2018/10/14/namespace-md/
unshare / mount https://segmentfault.com/a/1190000006913509 。
https://osh-2020.github.io/lab-4/namespaces/
https://osh-2020.github.io/
http://121.36.228.94/2021/02/21/linux_kernel_namespace/
https://www.redhat.com/sysadmin/behind-scenes-podman
