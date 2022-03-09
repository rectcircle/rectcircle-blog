---
title: "容器核心技术（四） Namespace"
date: 2022-02-11T20:38:01+08:00
draft: true
toc: true
comments: true
tags:
  - 云原生
---

TODO 这个文章拆分成多篇。

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

* 创建：通过 [`clone(2) 系统调用`](https://man7.org/linux/man-pages/man2/clone.2.html)的 flag 来为**新创建的进程**创建新的 Namespace
* 加入：通过 [`setns(2) 系统调用`](https://man7.org/linux/man-pages/man2/setns.2.html)将**当前线程**（注意当前进程不允许有多个线程）加入某个其他进程的 Namespace（注意：当前进程的权限必须大于加入的进程的 Namespace 即不能发生越权），`docker exec` 就是通过这个系统调用实现的（PID Namespace 是个例外，参见下文）
* 创建：通过 [`unshare(2) 系统调用`](https://man7.org/linux/man-pages/man2/unshare.2.html)为**当前进程**创建新的 Namespace（PID Namespace 是个例外，参见下文）
* 查看：通过 [`ioctl_ns(2) 系统调用`](https://man7.org/linux/man-pages/man2/ioctl_ns.2.html)来查看命名空间的关系（主要是 user namespace 和 pid namespace）

除了系统调用外，Linux 也提供了响应的命令来创建、加入 Namespace：

* 创建：通过 [`unshare(1) 命令`](https://man7.org/linux/man-pages/man1/unshare.1.html)启动一个进程，然后再为该进程，创建新的 Namespace（PID Namespace 是个例外，参见下文），该命令的实现为：先调用 [`unshare(2) 系统调用`](https://man7.org/linux/man-pages/man2/unshare.2.html)，然后 **`exec`** 执行命令
* 加入：通过 [`nsenter(1) 命令`](https://man7.org/linux/man-pages/man1/nsenter.1.html)启动一个进程，然后再将该进程，加入一个 Namespace（PID Namespace 是个例外，参见下文），该命令的实现为：先调用 [`setns(2) 系统调用`](https://man7.org/linux/man-pages/man2/unshare.2.html)，然后 **`fork-exec`** 执行命令

关于 Namespace 的描述，Linux 手册非常详细的手册说明：

* [namespaces(7)](https://man7.org/linux/man-pages/man7/namespaces.7.html) - 整体描述
* [mount_namespaces(7)](https://man7.org/linux/man-pages/man7/mount_namespaces.7.html)
* [uts_namespaces(7)](https://man7.org/linux/man-pages/man7/uts_namespaces.7.html)
* [ipc_namespaces(7)](https://man7.org/linux/man-pages/man7/ipc_namespaces.7.html)
* [pid_namespaces(7)](https://man7.org/linux/man-pages/man7/pid_namespaces.7.html)
* [network_namespaces(7)](https://man7.org/linux/man-pages/man7/network_namespaces.7.html)
* [user_namespaces(7)](https://man7.org/linux/man-pages/man7/user_namespaces.7.html)
* [cgroup_namespaces(7)](https://man7.org/linux/man-pages/man7/cgroup_namespaces.7.html)
* [time_namespaces(7)](https://man7.org/linux/man-pages/man7/time_namespaces.7.html)

下文，将以 Go 语言、 C 语言、Shell 命令三种形式，来介绍这些 Namespace。实验环境说明参见：[容器核心技术（一） 实验环境准备 & Linux 基础知识](/posts/container-core-tech-1-experiment-preparation-and-linux-base)

## Mount Namespace

> 手册页面：[mount namespaces](https://man7.org/linux/man-pages/man7/mount_namespaces.7.html)。

### 背景知识

> 手册：[mount(2) 系统调用](https://man7.org/linux/man-pages/man2/mount.2.html) | [mount(8) 命令](https://man7.org/linux/man-pages/man8/mount.8.html)

#### mount 概述

目录树是 Linux 一种的全局系统资源，对目录树的一个节点绑定一个文件系统的操作叫做挂载（`mount`），即通过 `mount` 系统调用实现的。

Linux 支持多种多样的挂载，这里先介绍几种常见的例子：

* 挂载 一个 ext4 格式的文件系统（磁盘分区） 到某个目录上
* 挂载 一个 U 盘到某个目录上
* 挂载 一个 ISO 光盘镜像文件到某个目录上

除了上述情况外，还有一个在容器技术中会用到的挂载类型

* 挂载一个 tmpfs 到 /tmp 目录，tmpfs 是一种特殊的文件系统，一般用于缓存，数据存储在内存和 swap 中，系统重启后会丢失。
* bind 某一个目录（也可以是文件）到另一个目录（也可以是文件，类型需和源保持一致），实现的效果类似于一个软链指向两一个目录，但是优点是，对于进程来说，是无法分辨出同一个文件的两个路径的关系。该能力是容器引擎实现挂载宿主机目录的核心技术。
* 将几个目录组成一套 overlay 文件系统，并挂载在某个目录，这是容器引擎（如 Docker）实现镜像和容器数据存储的核心技术，在下一篇文章有专门介绍。

内核支持 mount 的文件系统类型参见： `/proc/filesystems`。

关于更多常见的挂载命令，可以参见：[文章：Linux mount （第一部分）](https://segmentfault.com/a/1190000006878392)。

mount 的调用需要 `CAP_SYS_ADMIN` 权限。

#### mount 和 目录树

Linux 的每个文件系统在目录树上都有一个挂载点，这个挂载点目录的子孙目录有两种可能：a) 当前文件系统的目录 b) 另一个文件系统的挂载点。因此，挂载点也是组成了一颗挂载点树。因此 Linux 文件相关  从文件系统、目录树和挂载点视角来看，如下图所示：

![image](/image/container-core-tech-fs-mount-tree.png)

因此，可以看出：`目录树 = 文件系统 + 挂载点`。

#### mount 系统调用和命令

> 手册：[mount(2) 系统调用](https://man7.org/linux/man-pages/man2/mount.2.html) | [mount(8) 命令](https://man7.org/linux/man-pages/man8/mount.8.html)

mount 系统调用和命令一般有五个参数：

* `type` 文件系统类型
* `source` 源，与 `type` 有关，有可能是 目录、块设备或者 null 等等
* `target` 目标，绑定到的路径，必填，一般情况下是一个目录（bind 的情况可能是一个文件），如果是目录，该文件在当前文件系统中必须存在。
* `data` 参数，与 `type` 有关，一般是是一串由逗号分隔的选项
* `mountflags` 附加选项 flag
    * 配置 mount 的操作类型
        * `MS_REMOUNT` 重新挂载
        * `MS_BIND` bind 挂载
        * `MS_SHARED`、`MS_PRIVATE`、`MS_SLAVE`、`MS_UNBINDABLE`。改变一个挂载的传播类型
        * `MS_MOVE` 将现有挂载移动到新位置
        * 创建一个新的挂载：`mountflags` 不包括上述任何一项
    * 其他附加选项
        * `MS_DIRSYNC` 所有文件系统的更新都应该立即完成写入磁盘。参见：[mount(8) dirsync](https://man7.org/linux/man-pages/man8/mount.8.html)
        * `MS_LAZYTIME` 减少 inode 时间戳的磁盘更新（atime、mtime、ctime) 通过仅在内存中维护这些更改。这磁盘时间戳仅在以下情况下更新：
            * 需要更新 inode 以进行一些更改与文件时间戳无关；
            * 应用程序使用 fsync(2)、syncfs(2) 或同步（2）；
            * 未删除的 inode 从内存中逐出；
            * 自 inode 启动以来已超过 24 小时写入磁盘。
        * `MS_REC` 递归，与 MS_BIND 结合使用以创建递归绑定挂载；结合传播类型标志递归地改变所有的传播类型子树中的挂载。
        * `MS_RDONLY` 只读模式
        * 其他参见：[mount(2) 系统调用](https://man7.org/linux/man-pages/man2/mount.2.html)

#### 创建一个新的挂载

不使用 `MS_REMOUNT`, `MS_BIND`, `MS_MOVE`, `MS_SHARED`, `MS_PRIVATE`, `MS_SLAVE`, `MS_UNBINDABLE` 这些特殊参数的情况下为创建一个新的挂载。其他参数由 `type` 决定。

#### 重新挂载已存在挂载

允许更改现有挂载的 `mountflags` 和 `data` ，而无需卸载和重新安装文件系统。

* 使用 `MS_REMOUNT` 标志
* 使用相同的 `target` 参数
* `source` 和 `filesystemtype` 参数将被忽略

更多参见：[mount(2) 系统调用](https://man7.org/linux/man-pages/man2/mount.2.html)

#### 创建一个 bind 挂载

* 使用 `MS_BIND` 标志
* `sourcec` 源目录
* `target` 目标目录
* `data` 忽略
* 默认情况只会绑定这个目录，而不会绑定这个目录下的其他挂载，可以通过 `MS_REC` 选项递归挂载

经测试 bind 并不会造成递归。原理参见下文：mount 传播类型

#### 移动一个挂载

* 使用 `mountflags` 标志
* `source` 指定一个现有的mount
* `target` 指定该挂载的被搬迁新位置
* `mountflags` 参数中的其余位将被忽略，同样，`type` 和 `data` 也会被忽略。
* 这个操作是原子的：在任何时候子树的挂载都不会被卸载。

#### mount 传播类型

##### mount 属性介绍

> 手册：[proc(5)](https://man7.org/linux/man-pages/man5/proc.5.html)

挂载点列表以及每个挂载点的详细属性可以通过 `/proc/self/mountinfo` 文件查看，其每一行的格式为：

```
36 35 98:0 /mnt1 /mnt2 rw,noatime master:1 - ext3 /dev/root rw,errors=continue
(1)(2)(3)   (4)   (5)      (6)      (7)   (8) (9)   (10)         (11)
```

* (1)  mount ID，此挂载点的唯一 ID。
* (2)  parent ID，此挂载点的父挂载点 ID（如果此挂载点是挂载点树的根节点，parent ID = mount ID）。一个挂载点的父亲是当前挂载点的目录所在的挂载点。当当前挂载点的 parent 不在当前目录树，则这 parent ID 将不会出现在 `/proc/self/mountinfo` 文件中（比如 `chroot(2)`、`pivot_root(2)`）
* (4)  root: 将相对于当前文件系统根目录的绝对路径挂载到挂载点
* (5)  mount point: 相对于当前进程的绝对路径
* (6)  mount options: `mount(2)` 的 `data` 参数
* (7)  optional fields: 0 或多个以 `,` 分割的可选字段，每个字段格式为 `tag[:value]`
* 其他略

##### bind 引入的问题

在引入 bind 之前，一个文件系统的内容只对应目录树上一个路径（不考虑硬链接/软链接）。

引入 bind 之后，一个文件系统的内容在目录树上就会对应多个路径。如：将 `/home/a` 目录 bind 到 `/home_a` 路径下 （对应下图 `1. bind`）。

此时。如果向对这些路径中的一个子目录中 bind 一个其他的目录，操作，其他路径是否可见呢？如：将 `/m2` bind 到 `/home_a/.m2`，`/home/a/.m2` 是否也自动绑定呢（对应下图 `2. bind` 后，`3.❓` 的情况）？

![image](/image/container-core-tech-fs-mount-tree-bind.png)

##### `传播特性` 和 `peer group`

该问题由，Linux 在挂载点的 `optional fields` 字段： `${传播类型}:${peer group}` 决定。

先来看 `peer group`。`peer group` 是一个数字 ID，Linux 保证同一个文件系统的 `peer group` 是相同的，这个 `peer group` 中必须有一个 `MS_SHARED`，否则 `peer group` 相同的所有挂载点的 `peer group` 都会被清空。

以上图为例：执行完 `1.bind` 后，`/home_a` 和 `home` 属于同一个文件系统，所以其 `peer group` 是相同的。

接下来看 `传播类型` 字段，关于挂载点的传播类型有四种：

* `shared` (`MS_SHARED`)，共享：
    * 以当前挂载点的子目录作为 mount 的 `target` 或删除当前挂载点子目录的一个挂载，这个挂载事件会传播到具有相同的 `peer group` （意味着同一个的文件系统）的挂载点。
    * 当前挂载会接收其他具有相同的 `peer group`（意味着同一个的文件系统） 的挂载事件。
* `-` (`MS_PRIVATE`)，私有：
    * 以当前挂载点的子目录作为 mount 的 `target` 或删除当前挂载点子目录的一个挂载，不会影响其他挂载点。
    * 当前挂载不会接收任何其他具有相同的 `peer group`（意味着同一个的文件系统） 的挂载事件。
* `master` (`MS_SLAVE`)，从模式：
    * 以当前挂载点的子目录作为 mount 的 `target` 或删除当前挂载点子目录的一个挂载，不会影响其他挂载点。
    * 当前挂载会接收其他具有相同的 `peer group`（意味着同一个的文件系统） 的挂载事件。
* `unbindable` (`MS_UNBINDABLE`)，发送和接收的行为和 `MS_PRIVATE`，此外，还附加如下约束：
    * 针对某个目录进行递归 bind 时（`MS_BIND | MS_REC`），如果该目录的子目录存在一个配置 `MS_UNBINDABLE` 的挂载点，将忽略。
    * 直接 bind 该挂载点，将报错。

因此我们来枚举下上图操作 `2. bind` 后， `3.❓` 的情况：

|  | `/home` 挂载点 `MS_SHARED` | `/home` 挂载点 `MS_PRIVATE` | `/home` 挂载点 `MS_SLAVE` |
|---|---|---|---|
| `/home_a` 挂载点 `MS_SHARED` | ✅|  ❌| ✅|
| `/home_a` 挂载点 `MS_PRIVATE` | ❌ | ❌ |  ❌|
| `/home_a` 挂载点 `MS_SLAVE` |  ❌| ❌ |  ❌|  ❌|

假设， `/home` 挂载点 `MS_SHARED` 且 `/home_a` 挂载点 `MS_SHARED`，此时相关挂载点的属性如下表所示：

| ID | Parent ID | Root | mount point | optional fields | 文件系统| 说明 |
|----|-----------|------|-------------|-----------------|--------|-----|
| 26 | 1         | `/`  | `/`         | `shared:1`      |  `/`   | 根目录挂载点 |
| 209 | 26       | `/`  | `/home`     | `shared:122`    | `/home` | `/home` 挂载点 |
| 216 | 26       | `/`  | `/m2`       | `shared:126`    | `/m2`   | `/m2` 挂载点 |
| 223 | 26       | `/a` | `/home_a`   | `shared:122`    | `/home` | 操作 `1. bind` |
| 230 | 223      | `/` | `/home_a/.m2`   | `shared:126` | `/m2`  | 操作 `2. bind` |
| 231 | 209      | `/` | `/home/a/.m2`   | `shared:126` | `/m2`  |  `3. ❓` 结果 |

接下来，探讨创建一个挂载点的 `传播类型` 和 `peer group` 的初始化情况：

* 第一步，确认挂载的 `source` 所在的挂载点（以 `1. bind` 操作为例，其挂载点为 `/home`）。
* 新的挂载点的 `传播类型` 和 `peer group` 为和第一步确认的挂载点保持一致。

最后，探讨下一个挂载点的 `传播类型` 和 `peer group` 的变化情况：

* 将一个 `MS_SHARED` 的挂载点设置为 `MS_SLAVE` 时，如果设置后，`peer group` 相同的挂载点不存在 `传播特性` 为 `MS_SHARED` 是，这个挂载点将直接变为 `MS_PRIVATE`（`peer group` 将丢失）。否则可以变为 `MS_SLAVE`。
* 将 `MS_SHARED` 或 `MS_SLAVE` 设为 `MS_PRIVATE` 或 `MS_UNBINDABLE`，`peer group` 将丢失。
* 将 `MS_PRIVATE` 或 `MS_UNBINDABLE` 设为 `MS_SLAVE` 将不生效
* 将 `MS_PRIVATE` 或 `MS_UNBINDABLE` 设为 `MS_SHARED` 将分配一个新的 `peer group`

##### 修改传播类型参数说明

* `target` 填写要改变的挂载点
* `source`、`data`、`type` 忽略
* `mountflags` 上文已经介绍清楚
    * `MS_SHARED`
    * `MS_PRIVATE`
    * `MS_SLAVE`
    * `MS_UNBINDABLE`

#### Example

```bash
#!/usr/bin/env bash

abs_dir=$(cd $(dirname $0); pwd)
cd $abs_dir

# 开始测试
echo '=== origin ==='
tree

sudo mount --bind source1 target1
echo '=== bind ./source1 ./target1 ==='
tree

sudo mount --bind source2 target1/target2
echo '=== / is share & ./target1 is share ==='
echo '=== bind ./source2 ./target1/target2 : ./source1/target2 ✅  ==='
cat /proc/self/mountinfo | grep "/ / "
cat /proc/self/mountinfo | grep "propagation"
tree

sudo umount target1/target2
sudo mount --make-slave target1
sudo mount --bind source2 source1/target2
echo '=== / is share & ./target1 is slave ==='
echo '=== bind ./source2 ./source1/target2 : ./target1/target2/ ✅  ==='
cat /proc/self/mountinfo | grep "/ / "
cat /proc/self/mountinfo | grep "propagation"
tree

sudo umount source1/target2
sudo mount --bind source2 target1/target2
echo '=== bind ./source2 ./target1/target2 : ./source1/target2 ❌ ==='
cat /proc/self/mountinfo | grep "/ / "
cat /proc/self/mountinfo | grep "propagation"
tree

sudo umount target1/target2
sudo umount target1
```

输出

```
=== origin ===
.
├── source1
│   ├── source1
│   └── target2
│       └── target2
├── source2
│   └── mounted
├── target1
│   └── target1
└── test.sh

4 directories, 5 files
=== bind ./source1 ./target1 ===
.
├── source1
│   ├── source1
│   └── target2
│       └── target2
├── source2
│   └── mounted
├── target1
│   ├── source1
│   └── target2
│       └── target2
└── test.sh

5 directories, 6 files
=== / is share & ./target1 is share ===
=== bind ./source2 ./target1/target2 : ./source1/target2 ✅  ===
26 1 8:1 / / rw,relatime shared:1 - ext4 /dev/sda1 rw,errors=remount-ro
209 26 8:1 /home/rectcircle/container-core-tech-experiment/data/propagation/source1 /home/rectcircle/container-core-tech-experiment/data/propagation/target1 rw,relatime shared:1 - ext4 /dev/sda1 rw,errors=remount-ro
216 209 8:1 /home/rectcircle/container-core-tech-experiment/data/propagation/source2 /home/rectcircle/container-core-tech-experiment/data/propagation/target1/target2 rw,relatime shared:1 - ext4 /dev/sda1 rw,errors=remount-ro
217 26 8:1 /home/rectcircle/container-core-tech-experiment/data/propagation/source2 /home/rectcircle/container-core-tech-experiment/data/propagation/source1/target2 rw,relatime shared:1 - ext4 /dev/sda1 rw,errors=remount-ro
.
├── source1
│   ├── source1
│   └── target2
│       └── mounted
├── source2
│   └── mounted
├── target1
│   ├── source1
│   └── target2
│       └── mounted
└── test.sh

5 directories, 6 files
=== / is share & ./target1 is slave ===
=== bind ./source2 ./source1/target2 : ./target1/target2/ ✅  ===
26 1 8:1 / / rw,relatime shared:1 - ext4 /dev/sda1 rw,errors=remount-ro
209 26 8:1 /home/rectcircle/container-core-tech-experiment/data/propagation/source1 /home/rectcircle/container-core-tech-experiment/data/propagation/target1 rw,relatime master:1 - ext4 /dev/sda1 rw,errors=remount-ro
216 26 8:1 /home/rectcircle/container-core-tech-experiment/data/propagation/source2 /home/rectcircle/container-core-tech-experiment/data/propagation/source1/target2 rw,relatime shared:1 - ext4 /dev/sda1 rw,errors=remount-ro
217 209 8:1 /home/rectcircle/container-core-tech-experiment/data/propagation/source2 /home/rectcircle/container-core-tech-experiment/data/propagation/target1/target2 rw,relatime master:1 - ext4 /dev/sda1 rw,errors=remount-ro
.
├── source1
│   ├── source1
│   └── target2
│       └── mounted
├── source2
│   └── mounted
├── target1
│   ├── source1
│   └── target2
│       └── mounted
└── test.sh

5 directories, 6 files
=== bind ./source2 ./target1/target2 : ./source1/target2 ❌ ===
26 1 8:1 / / rw,relatime shared:1 - ext4 /dev/sda1 rw,errors=remount-ro
209 26 8:1 /home/rectcircle/container-core-tech-experiment/data/propagation/source1 /home/rectcircle/container-core-tech-experiment/data/propagation/target1 rw,relatime master:1 - ext4 /dev/sda1 rw,errors=remount-ro
216 209 8:1 /home/rectcircle/container-core-tech-experiment/data/propagation/source2 /home/rectcircle/container-core-tech-experiment/data/propagation/target1/target2 rw,relatime shared:1 - ext4 /dev/sda1 rw,errors=remount-ro
.
├── source1
│   ├── source1
│   └── target2
│       └── target2
├── source2
│   └── mounted
├── target1
│   ├── source1
│   └── target2
│       └── mounted
└── test.sh

5 directories, 6 files
```

### 描述

#### 隔离

Mount Namespace 实现了进程间目录树挂载（文件系统）的隔离，即：不同 Namespace 的进程看到的目录树可以是不一样的，且这些进程中的挂载是相互不影响的。

#### 共享和传播

> 本部分主要在手册：[mount_namespaces(7)](https://man7.org/linux/man-pages/man7/mount_namespaces.7.html#SHARED_SUBTREES) 阐述

已经在 《背景知识 —— mount 传播类型》阐述过了。

共享和传播在容器技术中应用参见：《场景 —— 某 Namespace 的进程为其他 Namespace Mount 文件系统》

#### 其他相关内容

除了概述设计的相关系统调用、函数、命令以及文档的手册外，本部分还设计如下内容参见为：

* [mount(2) 系统调用](https://man7.org/linux/man-pages/man8/mount.8.html)
* [mount(8) 命令](https://man7.org/linux/man-pages/man8/mount.8.html)
* [umount(2) 系统调用](https://man7.org/linux/man-pages/man2/umount.2.html)
* [umount(8) 命令](https://man7.org/linux/man-pages/man8/umount.8.html)
* [pivot_root(2) 系统调用](https://man7.org/linux/man-pages/man2/pivot_root.2.html)
* [pivot_root(8) 系统调用](https://man7.org/linux/man-pages/man8/pivot_root.8.html)

* [文章：Linux mount （第二部分 - Shared subtrees）](https://segmentfault.com/a/1190000006899213)
* [mount_namespaces(7) Shared subtrees](https://man7.org/linux/man-pages/man7/mount_namespaces.7.html#SHARED_SUBTREES)

此外，对于根目录挂载点的切换，需要通过 [pivot_root(2) 系统调用](https://man7.org/linux/man-pages/man2/pivot_root.2.html) 实现。

### 实验

#### 实验设计

为了验证 Mount Namespace 的能力，我们将启动一个具有新 Mount Namespace 的 bash 的进程，这个进程将会使用 bind 挂载的方式将 `data/binding/source` 目录挂载到当前目录的 `data/binding/target` 目录，其中 `data/binding/source` 包含一个文件 `a`。并观察：

* 具有新 Mount Namespace 的 bash 进程，看到 `data/binding/source` 目录和 `data/binding/target` 目录，内容一致
* 其他普通进程，看到的 `data/binding/source` 目录和 `data/binding/target` 目录，内容**不**一致

此外还可以观察两个进程的 `mount` 命令的输出，以及 `readlink /proc/self/ns/mnt`、`cat /proc/self/mounts`、`cat /proc/self/mountinfo` 以及 `cat /proc/self/mountstats` 等的输出。

#### C 语言描述

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

#define errExit(msg)    do { perror(msg); exit(EXIT_FAILURE); \
                               } while (0)

#define STACK_SIZE (1024 * 1024)

char *const child_args[] = {
	"/bin/bash",
	"-xc",
	"ls data/binding/target \
	&& readlink /proc/self/ns/mnt \
	&& cat /proc/self/mounts | grep data/binding/target || true \
	&& cat /proc/self/mountinfo | grep data/binding/target || true \
	&& cat /proc/self/mountstats | grep data/binding/target || true \
	&& sleep 10 \
	",
	NULL};

int new_namespace_func(void *args)
{
	// 首先，需要阻止挂载事件传播到其他 Mount Namespace，参见：https://man7.org/linux/man-pages/man7/mount_namespaces.7.html#NOTES
	// 如果不执行这个语句， cat /proc/self/mountinfo 所有行将会包含 shared，这样在这个子进程中执行 mount 其他进程也会受影响
	// 关于 Shared subtrees 更多参见：
	//   https://segmentfault.com/a/1190000006899213
	//   https://man7.org/linux/man-pages/man7/mount_namespaces.7.html#SHARED_SUBTREES
	// 下面语句的含义是：重新递归挂（MS_REC）载 / ，并设置为不共享（MS_SLAVE 或 MS_PRIVATE）
	// 说明：
	//   MS_SLAVE 换成 MS_PRIVATE 也能达到同样的效果
	//   等价于执行：mount --make-rslave / 命令
	if (mount(NULL, "/", NULL , MS_SLAVE | MS_REC, NULL) == -1)
		errExit("mount-MS_SLAVE");
	// 使用 MS_BIND 参数将 data/binding/source 挂载（绑定）到 data/binding/target
	// 因为在新的 Mount Namespace 中执行，所有其他进程的目录树不受影响
	// 等价命令为：mount --bind data/binding/source data/binding/target
	// mount 函数声明为：
	//    int mount(const char *source, const char *target,
	//              const char *filesystemtype, unsigned long mountflags,
	//              const void *data);
	// 更多参见：https://man7.org/linux/man-pages/man2/mount.2.html
	if (mount("data/binding/source", "data/binding/target", NULL, MS_BIND, NULL) == -1)
		errExit("mount-MS_BIND");
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
	return p;
}

int main()
{
	// 为子进程提供申请函数栈
	void *child_stack = mmap(NULL, STACK_SIZE,
							 PROT_READ | PROT_WRITE,
							 MAP_PRIVATE | MAP_ANONYMOUS | MAP_STACK,
							 -1, 0);
	if (child_stack == MAP_FAILED)
		errExit("mmap");
	// 创建新进程，并为该进程创建一个 Mount Namespace（CLONE_NEWNS），并执行 new_namespace_func 函数
	// clone 库函数声明为：
	// int clone(int (*fn)(void *), void *stack, int flags, void *arg, ...
	// 		  /* pid_t *parent_tid, void *tls, pid_t *child_tid */);
	// 更多参见：https://man7.org/linux/man-pages/man2/clone.2.html
	pid_t p1 = clone(new_namespace_func, child_stack + STACK_SIZE, SIGCHLD | CLONE_NEWNS, NULL);
	if (p1 == -1)
		errExit("clone");
	sleep(5);
	// 创建新的进程（不创建 Namespace），并执行测试命令
	pid_t p2 = old_namespace_exec();
	if (p2 == -1)
		errExit("fork");
	waitpid(p1, NULL, 0);
	waitpid(p2, NULL, 0);
	return 0;
}
```

#### Go 语言描述

```go
//go:build linux

// sudo go run ./src/go/01-namespace/01-mount/main.go

package main

import (
	"fmt"
	"log"
	"os"
	"os/exec"
	"syscall"
	"time"
)

const (
	sub = "sub"

	script = "ls data/binding/target " +
		"&& readlink /proc/self/ns/mnt " +
		"&& cat /proc/self/mounts | grep data/binding/target || true" +
		"&& cat /proc/self/mountinfo | grep data/binding/target || true " +
		"&& cat /proc/self/mountstats | grep data/binding/target || true " +
		"&& sleep 10"
)

func runTestScript(tip string) <-chan error {
	fmt.Println(tip)
	cmd := exec.Command("/bin/bash", "-cx", script)
	cmd.Stdin = os.Stdin
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	result := make(chan error)
	go func() {
		result <- cmd.Run()
	}()
	return result
}

func newNamespaceProccess() <-chan error {
	cmd := exec.Command(os.Args[0], "sub")
	// 创建新进程，并为该进程创建一个 Mount Namespace（syscall.CLONE_NEWNS）
	// 更多参见：https://man7.org/linux/man-pages/man2/clone.2.html
	cmd.SysProcAttr = &syscall.SysProcAttr{
		Cloneflags: syscall.CLONE_NEWNS,
	}
	cmd.Stdin = os.Stdin
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	result := make(chan error)
	go func() {
		result <- cmd.Run()
	}()
	return result
}

func newNamespaceProccessFunc() <-chan error {
	// 首先，需要阻止挂载事件传播到其他 Mount Namespace，参见：https://man7.org/linux/man-pages/man7/mount_namespaces.7.html#NOTES
	// 如果不执行这个语句， cat /proc/self/mountinfo 所有行将会包含 shared，这样在这个子进程中执行 mount 其他进程也会受影响
	// 关于 Shared subtrees 更多参见：
	//   https://segmentfault.com/a/1190000006899213
	//   https://man7.org/linux/man-pages/man7/mount_namespaces.7.html#SHARED_SUBTREES
	// 下面语句的含义是：重新递归挂（MS_REC）载 / ，并设置为不共享（MS_SLAVE 或 MS_PRIVATE）
	// 说明：
	//   MS_SLAVE 换成 MS_PRIVATE 也能达到同样的效果
	//   等价于执行：mount --make-rslave / 命令
	if err := syscall.Mount("", "/", "", syscall.MS_SLAVE|syscall.MS_REC, ""); err != nil {
		panic(err)
	}
	// 将 data/binding/source 挂载（绑定）到 data/binding/target
	// 因为在新的 Mount Namespace 中执行，所有其他进程的目录树不受影响
	// 等价命令为：mount --bind data/binding/source data/binding/target
	// 更多参见：https://man7.org/linux/man-pages/man8/mount.8.html
	if err := syscall.Mount("data/binding/source", "data/binding/target", "", syscall.MS_BIND, ""); err != nil {
		panic(err)
	}
	return runTestScript("=== new mount namespace process ===")
}

func oldNamespaceProccess() <-chan error {
	return runTestScript("=== old namespace process ===")
}

func main() {
	switch len(os.Args) {
	case 1:
		// 1. 执行 newNamespaceExec，启动一个具有新的 Mount Namespace 的进程
		r1 := newNamespaceProccess()
		time.Sleep(5 * time.Second)
		// 3. 创建新的进程（不创建 Namespace），并执行测试脚本
		r2 := oldNamespaceProccess()
		err1, err2 := <-r1, <-r2
		if err1 != nil {
			panic(err1)
		}
		if err2 != nil {
			panic(err2)
		}
		return
	case 2:
		// 2. 该进程执行 newNamespaceProccessFunc，配置 hostname 和 domainname，并执行测试脚本
		if os.Args[1] == sub {
			if err := <-newNamespaceProccessFunc(); err != nil {
				panic(err)
			}
			return
		}
	}
	log.Fatalf("usage: %s [sub]", os.Args[0])
}
```

#### Shell 描述

```bash
#!/usr/bin/env bash

# sudo ./src/shell/01-namespace/01-mount/main.sh

script="ls data/binding/target  \
	&& readlink /proc/self/ns/mnt  \
	&& cat /proc/self/mounts | grep data/binding/target || true \
	&& cat /proc/self/mountinfo | grep data/binding/target || true  \
	&& cat /proc/self/mountstats | grep data/binding/target || true  \
	&& sleep 10"

# 创建新进程，并为该进程创建一个 Mount Namespace（-m）
# 更多参见：https://man7.org/linux/man-pages/man1/unshare.1.html

# 注意 unshare 会自动取消进程的所有共享，因此不需要手动执行：mount --make-rprivate /
# 更多参见：https://man7.org/linux/man-pages/man1/unshare.1.html 的 --propagation 参数说明

# 将 data/binding/source 挂载（绑定）到 data/binding/target
# 因为在新的 Mount Namespace 中执行，所有其他进程的目录树不受影响
# 等价系统调用为：mount("data/binding/source", "data/binding/target", NULL, MS_BIND, NULL);
# 更多参见：https://man7.org/linux/man-pages/man8/mount.8.html
unshare -m /bin/bash -c "mount --bind data/binding/source data/binding/target \
	&& echo '=== new mount namespace process ===' && set -x $script" &
pid1=$!

sleep 5
# 创建新的进程（不创建 Namespace），并执行测试命令
/bin/bash -c "echo '=== old namespace process ===' && set -x $script" &
pid2=$!

wait $pid1
wait $pid2
```

#### 输出及分析

按照代码上方注释，编译并运行，输出形如：

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
+ true
+ grep data/binding/target
+ cat /proc/self/mountinfo
+ true
+ grep data/binding/target
+ cat /proc/self/mountstats
+ true
+ sleep 10
```

* 前半部分输出为，具有新的 Mount Namespace 的进程打印的，以 `=== new mount namespace process ===` 开头
* 后半部分输出为，在旧的 Namespace 中进程打印的，以 `=== old namespace process ===` 开头
* 两半部分执行的测试命令是相同的
    * ls data/binding/target 输出，前半部分结果为 `a`，后半部分为空。证明了 Mount Namespace 隔离是有效的
    * 后面的一系列对 `/proc` 关于 `mount` 的观察，前半部分有输出，后半部分没有输出。也证明了 Mount Namespace 隔离是有效的

### 扩展：切换根文件系统

最早，切换某个进程的根目录的系统调用为 [chroot(2)](https://man7.org/linux/man-pages/man2/chroot.2.html)，该能力最早出现在 1979 年的Unix V7 系统。chroot 仅仅是通过修改，进程的 task 结构体中 fs 结构体中的 root 字段实现的（[博客 1](https://huadeyu.tech/system/chroot-implement-detail.html)）。存在很多越狱手段，参见：[博客2](https://zhengyinyong.com/post/chroot-mechanism/#chroot-%E7%9A%84%E5%AE%89%E5%85%A8%E9%97%AE%E9%A2%98)。

配合 Mount Namespace，[pivot_root(2) 系统调用](https://man7.org/linux/man-pages/man2/pivot_root.2.html)可以实现完全隔离的根目录。

#### 实验设计

为了验证 [pivot_root(2) 系统调用](https://man7.org/linux/man-pages/man2/pivot_root.2.html)隔离根目录挂载点的能力。我们准备一个包含 `busybox` 的目录，用来充当新的根目录（下文称为 rootfs）。该目录位于 `data/busybox/rootfs`。准备命令为：

```bash
mkdir -p data/busybox/rootfs
cd data/busybox/rootfs
mkdir bin .oldrootfs
cd bin
wget https://busybox.net/downloads/binaries/1.35.0-x86_64-linux-musl/busybox
chmod +x busybox
# ./busybox --install -s ./
ln -s busybox sh
ln -s busybox ls
cd ..
mkdir .oldrootfs
touch README
touch .oldrootfs/README
```

最终 `data/busybox/rootfs` 目录数结构为

```
./data/busybox/rootfs/
├── bin
│   ├── busybox
│   ├── ls -> busybox
│   └── sh -> busybox
├── .oldrootfs
│   └── README
└── README
```

本实验，启动具有新 Mount Namespace 进程，该进程会执行 pivot_root 将根目录切换到 `data/busybox/rootfs/`，并执行新的根目录的 `/bin/sh` （即 `data/busybox/rootfs/bin/sh`），执行 `ls /` 和 `ls /bin` 观察其输出。

> 💡 busybox 是一个没有任何外部依赖（不依赖任何动态链接库，包括 glibc）的命令行工具合集，包含如 sh、ls 等常用命令。更多参见：[busybox 官网](https://busybox.net/)

#### C 语言描述

```cpp
// gcc src/c/01-namespace/01-mount/pivot_root/main.c && sudo ./a.out

// 本例参考了：https://man7.org/linux/man-pages/man2/pivot_root.2.html#EXAMPLES

#define _GNU_SOURCE    // Required for enabling clone(2)
#include <sys/wait.h>  // For waitpid(2)
#include <sys/mount.h> // For mount(2)
#include <sys/mman.h>  // For mmap(2)
#include <sched.h>     // For clone(2)
#include <signal.h>    // For SIGCHLD constant
#include <stdio.h>     // For perror(3), printf(3), perror(3)
#include <unistd.h>    // For execv(3), sleep(3)
#include <stdlib.h>    // For exit(3), system(3)
#include <limits.h>    // For PATH_MAX
#include <sys/syscall.h> // For  SYS_* constants

#define errExit(msg)    do { perror(msg); exit(EXIT_FAILURE); \
                               } while (0)

static int
pivot_root(const char *new_root, const char *put_old)
{
    return syscall(SYS_pivot_root, new_root, put_old);
}

#define STACK_SIZE (1024 * 1024)

char *const child_args[] = {
    "/bin/sh",
    "-xc",
    "export PATH=/bin && ls / && ls /bin",
    NULL};

char *const new_root = "data/busybox/rootfs";
char *const put_old = "data/busybox/rootfs/.oldrootfs";
char *const put_old_on_new_rootfs = "/.oldrootfs";

int new_namespace_func(void *args)
{
    // 首先，需要阻止挂载事件传播到其他 Mount Namespace，参见：https://man7.org/linux/man-pages/man7/mount_namespaces.7.html#NOTES
    // 如果不执行这个语句， cat /proc/self/mountinfo 所有行将会包含 shared，这样在这个子进程中执行 mount 其他进程也会受影响
    // 关于 Shared subtrees 更多参见：
    //   https://segmentfault.com/a/1190000006899213
    //   https://man7.org/linux/man-pages/man7/mount_namespaces.7.html#SHARED_SUBTREES
    // 下面语句的含义是：重新递归挂（MS_REC）载 / ，并设置为不共享（MS_SLAVE 或 MS_PRIVATE）
    // 说明：
    //   MS_SLAVE 换成 MS_PRIVATE 也能达到同样的效果
    //   等价于执行：mount --make-rslave / 命令
    if (mount(NULL, "/", NULL, MS_SLAVE | MS_REC, NULL) == -1)
        errExit("mount-MS_SLAVE");
    // 确保 new_root 是一个挂载点
    if (mount(new_root, new_root, NULL, MS_BIND, NULL) == -1)
        errExit("mount-MS_BIND");
    // 切换根挂载目录，将 new_root 挂载到根目录，将旧的根目录挂载到 put_old 目录下
    // - new_root 和 put_old 必须是一个目录
    // - new_root 和 put_old 不能和当前根目录相同。
    // - put_old 必须是 new_root 的子孙目录
    // - new_root 必须是挂载点的路径，但不能是根目录。如果不是的话，可以通过 mount bind 方式转换为一个挂载点（参见上一个命令）。
    // - 旧的根目录必须是挂载点。
    // 更多参见：https: // man7.org/linux/man-pages/man2/pivot_root.2.html
    // 此外，可以通过 pivot_root(".", ".") 来实现免除创建临时目录，参见： https://github.com/opencontainers/runc/commit/f8e6b5af5e120ab7599885bd13a932d970ccc748
    if (pivot_root(new_root, put_old) == -1)
        errExit("pivot_root");
    // 根目录已经切换了，所以之前的工作目录已经不存在了，所以需要将 working directory 切换到根目录
    if (chdir("/") == -1)
        errExit("chdir");
    // 取消挂载旧的根目录路径
    if (umount2(put_old_on_new_rootfs, MNT_DETACH) == -1)
        perror("umount2");
    printf("=== new mount namespace and pivot_root process ===\n");
    execv(child_args[0], child_args);
    errExit("execv");
}

int main()
{
    // 为子进程提供申请函数栈
    void *child_stack = mmap(NULL, STACK_SIZE,
                             PROT_READ | PROT_WRITE,
                             MAP_PRIVATE | MAP_ANONYMOUS | MAP_STACK,
                             -1, 0);
    if (child_stack == MAP_FAILED)
        errExit("mmap");
    // 创建新进程，并为该进程创建一个 Mount Namespace（CLONE_NEWNS），并执行 new_namespace_func 函数
    // clone 库函数声明为：
    // int clone(int (*fn)(void *), void *stack, int flags, void *arg, ...
    // 		  /* pid_t *parent_tid, void *tls, pid_t *child_tid */);
    // 更多参见：https://man7.org/linux/man-pages/man2/clone.2.html
    pid_t p1 = clone(new_namespace_func, child_stack + STACK_SIZE, SIGCHLD | CLONE_NEWNS, NULL);
    if (p1 == -1)
        errExit("clone");
    waitpid(p1, NULL, 0);
    return 0;
}
```

#### Go 语言描述

```go
//go:build linux

// sudo go run ./src/go/01-namespace/01-mount/pivot_root/main.go

package main

import (
	"fmt"
	"log"
	"os"
	"os/exec"
	"syscall"
)

const (
	sub = "sub"

	newroot = "data/busybox/rootfs"

	script = "export PATH=/bin && ls / && ls /bin"
)

func runTestScript(tip string) <-chan error {
	fmt.Println(tip)
	cmd := exec.Command("/bin/sh", "-cx", script)
	cmd.Stdin = os.Stdin
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	result := make(chan error)
	go func() {
		result <- cmd.Run()
	}()
	return result
}

func newNamespaceExec() <-chan error {
	cmd := exec.Command(os.Args[0], "sub")
	// 创建新进程，并为该进程创建一个 Mount Namespace（syscall.CLONE_NEWNS）
	// 更多参见：https://man7.org/linux/man-pages/man2/clone.2.html
	cmd.SysProcAttr = &syscall.SysProcAttr{
		Cloneflags: syscall.CLONE_NEWNS,
	}
	cmd.Stdin = os.Stdin
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	result := make(chan error)
	go func() {
		result <- cmd.Run()
	}()
	return result
}

func pivotRootAndRun() <-chan error {
	// 首先，需要阻止挂载事件传播到其他 Mount Namespace，参见：https://man7.org/linux/man-pages/man7/mount_namespaces.7.html#NOTES
	// 如果不执行这个语句， cat /proc/self/mountinfo 所有行将会包含 shared，这样在这个子进程中执行 mount 其他进程也会受影响
	// 关于 Shared subtrees 更多参见：
	//   https://segmentfault.com/a/1190000006899213
	//   https://man7.org/linux/man-pages/man7/mount_namespaces.7.html#SHARED_SUBTREES
	// 下面语句的含义是：重新递归挂（MS_REC）载 / ，并设置为不共享（MS_SLAVE 或 MS_PRIVATE）
	// 说明：
	//   MS_SLAVE 换成 MS_PRIVATE 也能达到同样的效果
	//   等价于执行：mount --make-rslave / 命令
	if err := syscall.Mount("", "/", "", syscall.MS_SLAVE|syscall.MS_REC, ""); err != nil {
		panic(err)
	}
	// 确保 new_root 是一个挂载点
	if err := syscall.Mount(newroot, newroot, "", syscall.MS_BIND, ""); err != nil {
		panic(err)
	}
	// 切换根挂载目录，将 new_root 挂载到根目录，将旧的根目录挂载到 put_old 目录下
	// 可以通过 pivot_root(".", ".") 来实现免除创建临时目录，参见： https://github.com/opencontainers/runc/commit/f8e6b5af5e120ab7599885bd13a932d970ccc748
	// - new_root 和 put_old 必须是一个目录
	// - new_root 和 put_old 不能和当前根目录相同。
	// - put_old 必须是 new_root 的子孙目录
	// - new_root 必须是挂载点的路径，但不能是根目录。如果不是的话，可以通过 mount bind 方式转换为一个挂载点（参见上一个命令）。
	// - 旧的根目录必须是挂载点。
	if err := os.Chdir(newroot); err != nil {
		panic(err)
	}
	if err := syscall.PivotRoot(".", "."); err != nil {
		panic(err)
	}
	// 根目录已经切换了，所以之前的工作目录已经不存在了，所以需要将 working directory 切换到根目录
	if err := os.Chdir("/"); err != nil {
		panic(err)
	}
	return runTestScript("=== new mount namespace and pivot_root process ===")
}

func main() {
	switch len(os.Args) {
	case 1:
		// 1. 执行 newNamespaceExec，启动一个具有新的 Mount Namespace 的进程
		r1 := newNamespaceExec()
		err1 := <-r1
		if err1 != nil {
			panic(err1)
		}
		return
	case 2:
		// 2. 该进程执行 pivotRootAndRun，配置 Mount，调用 pivotRoot 并运行测试脚本
		if os.Args[1] == sub {
			if err := <-pivotRootAndRun(); err != nil {
				panic(err)
			}
			return
		}
	}
	log.Fatalf("usage: %s [sub]", os.Args[0])
}
```

#### Shell 描述

```bash
#!/usr/bin/env bash

# sudo ./src/shell/01-namespace/01-mount/pivot_root/main.sh

new_root="data/busybox/rootfs"
script="ls / && ls /bin"

# unshare -m: 创建新进程，并为该进程创建一个 Mount Namespace（-m）
# 更多参见：https://man7.org/linux/man-pages/man1/unshare.1.html\
# 注意 unshare 会自动取消进程的所有共享，因此不需要手动执行：mount --make-rprivate /
# 更多参见：https://man7.org/linux/man-pages/man1/unshare.1.html 的 --propagation 参数说明

# mount --bind: 确保 new_root 是一个挂载点
# cd $new_root: 确保 working directory 是新的 rootfs
# pivot_root: 切换 rootfs
# cd /: 根目录已经切换了，所以之前的工作目录已经不存在了，所以需要将 working directory 切换到根目录
unshare -m /bin/bash -c "mount --bind $new_root $new_root \
	&& cd $new_root \
	&& pivot_root . . \
	&& cd / \
	&& echo '=== new mount namespace and pivot_root process ===' \
	&& /bin/sh -xc \"$script\"" &
pid1=$!

wait $pid1
```

#### 输出及分析

按照代码上方注释，编译并运行，输出形如：

```
=== new mount namespace and pivot_root process ===
+ ls /
README  bin
+ ls /bin
busybox  ls       sh
```

可以看出根目录已经切换了。

## UTS Namespace

> 手册页面：[uts namespaces](https://man7.org/linux/man-pages/man7/uts_namespaces.7.html)。

UTS (UNIX Time-Sharing System) Namespace 提供了个对 hostname 和 NIS domain name 这两个系统标识符的的隔离。

### 背景知识

在 Linux 中，`hostname` 和 `domainname` 有很多种，需要区分清楚：

* `system hostname` (在 Linux 内核语境下直接叫 `hostname`)
    * 获取
        * [`hostname(1)` 命令](https://man7.org/linux/man-pages/man1/hostname.1.html) （无参数）
        * [`gethostname(2)` 系统调用](https://man7.org/linux/man-pages/man2/gethostname.2.html)
    * 配置
        * [`hostname(1)` 命令](https://man7.org/linux/man-pages/man1/hostname.1.html) （加一个参数）或者 `--file`
        * [`sethostname(2)` 系统调用](https://man7.org/linux/man-pages/man2/sethostname.2.html)
        * [`/etc/hostname(5)` 配置文件](https://man7.org/linux/man-pages/man5/hostname.5.html) ，在系统启动时配置一次
* `FQDN` (Fully Qualified Domain Name，在域名解析语境下直接叫 hostname)，解释参见： [hostname(7)](https://man7.org/linux/man-pages/man7/hostname.7.html)
    * 获取
        * [`hostname(1)` 命令](https://man7.org/linux/man-pages/man1/hostname.1.html) `--fqdn` 参数
        * [`gethostbyname2(3)` 库函数](https://linux.die.net/man/3/gethostbyname2)
    * 设置 ([原文](https://man7.org/linux/man-pages/man1/hostname.1.html#DESCRIPTION))
        * 默认通过 [/etc/hosts(5)](https://man7.org/linux/man-pages/man5/hosts.5.html) 配置（每一行的格式为 `IP_address canonical_hostname [aliases...]`），值为 [/etc/hosts(5)](https://man7.org/linux/man-pages/man5/hosts.5.html) 文件中 alias 为 [/etc/hostname(5)](https://man7.org/linux/man-pages/man5/hostname.5.html) 的那一行的 `canonical_hostname`
        * 具体取决于 [/etc/host.conf(5) 配置文件](https://man7.org/linux/man-pages/man5/host.conf.5.html)
        * 没有对应系统调用（域名解析属于网络协议层面）
* `DNS domainname`，为 FQDN 去掉 第一个 `.` 和之前的内容
    * 获取
        * [`hostname(1)` 命令](https://man7.org/linux/man-pages/man1/hostname.1.html) `-d` 参数
        * [`dnsdomainname(1)` 命令](https://linux.die.net/man/1/dnsdomainname) `-d` 参数
        * [`gethostbyname2(3)` 库函数](https://linux.die.net/man/3/gethostbyname2)
    * 设置，参见 `FQDN` 设置
* `NIS/YP domainname` (在 Linux 内核语境下直接叫 `domainname`，又称 `nisdomainname`、`ypdomainname` 、 `Local domain name`)
    * 获取
        * [`hostname(1)` 命令](https://man7.org/linux/man-pages/man1/hostname.1.html) `-y` 或 `--yp` 或 `--nis` 参数
        * [`domainname(1)` 命令](https://linux.die.net/man/1/domainname)、[`nisdomainname(1)` 命令](https://linux.die.net/man/1/nisdomainname)、[`ypdomainname(1)`命令](https://linux.die.net/man/1/ypdomainname)
        * [`getdomainname(2)` 系统调用](https://man7.org/linux/man-pages/man2/getdomainname.2.html)
    * 设置
        * [`setdomainname(2)` 系统调用](https://man7.org/linux/man-pages/man2/setdomainname.2.html)

举一个例子，比如：

* `/etc/hostname` 内容为 `thishost`
* `/etc/hosts` 存在一行 `127.0.1.1       thishost.mydomain.org  thishost`

此时

* `system hostname` 为 `thishost`
* `FQDN` 为 `thishost.mydomain.org`
* `DNS domainname` 为 `mydomain.org`
* `NIS/YP domainname` 为 `(none)`

可以得出如下关系：

```
${FQDN} = ${system hostname} . ${DNS domainname}
```

### 描述

而 UTS Namespace 可以隔离的全局系统资源为：`system hostname` 和 `NIS/YP domainname`，设计的系统调用为：

* [`gethostname(2)` 系统调用](https://man7.org/linux/man-pages/man2/gethostname.2.html)
* [`sethostname(2)` 系统调用](https://man7.org/linux/man-pages/man2/sethostname.2.html)
* [`getdomainname(2)` 系统调用](https://man7.org/linux/man-pages/man2/getdomainname.2.html)
* [`setdomainname(2)` 系统调用](https://man7.org/linux/man-pages/man2/setdomainname.2.html)

下面，简单介绍下 `system hostname` 和 `NIS/YP domainname` 的应用。

* `system hostname`
    * 作为局域网邻居发现的标识符，可以通过 `${system hostname}.local` 直接访问该主机，更多参见：
        * [文章：在局域网建立.local域名](https://notes.leconiot.com/mdns.html)
        * [文章：隐藏在网络邻居背后的协议,快来看看你家网络有几种?](https://blog.csdn.net/docdocadmin/article/details/112135459)
* `NIS/YP domainname`
    * NIS 服务，更多参见：
        * [鸟哥的 Linux 私房菜：第十四章、账号控管： NIS 服务器](http://cn.linux.vbird.org/linux_server/0430nis.php)

### 实验

#### 实验设计

为了验证 UTS Namespace 的能力，我们将启动一个具有新 UTS Namespace 的子进程，这个进程会设置 `hostname` 和 `domainname`。然后分别在父子两个进程观察 `hostname` 和 `domainname` 情况。

#### C 语言描述

```cpp
// gcc src/c/01-namespace/02-uts/main.c && sudo ./a.out

#define _GNU_SOURCE	   // Required for enabling clone(2)
#include <sys/wait.h>  // For waitpid(2)
#include <sys/mount.h> // For mount(2)
#include <sys/mman.h>  // For mmap(2)
#include <sched.h>	   // For clone(2)
#include <signal.h>	   // For SIGCHLD constant
#include <stdio.h>	   // For perror(3), printf(3), perror(3)
#include <unistd.h>	   // For execv(3), sleep(3), sethostname(2), setdomainname(2)
#include <stdlib.h>    // For exit(3), system(3)
#include <string.h>    // For strlen(3)

#define errExit(msg)    do { perror(msg); exit(EXIT_FAILURE); \
                               } while (0)

#define STACK_SIZE (1024 * 1024)

char *const child_args[] = {
	"/bin/bash",
	"-xc",
	"hostname && hostname --nis || true",
	NULL};

char *const new_hostname = "new-hostname";
char *const new_domainname = "new-domainname";

int new_namespace_func(void *args)
{
	if (sethostname(new_hostname, strlen(new_hostname)) == -1 )
		errExit("sethostname");
	if (setdomainname(new_domainname, strlen(new_domainname)) == -1)
		errExit("setdomainname");
	printf("=== new uts namespace process ===\n");
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
	return p;
}

int main()
{
	// 为子进程提供申请函数栈
	void *child_stack = mmap(NULL, STACK_SIZE,
							 PROT_READ | PROT_WRITE,
							 MAP_PRIVATE | MAP_ANONYMOUS | MAP_STACK,
							 -1, 0);
	if (child_stack == MAP_FAILED)
		errExit("mmap");
	// 创建新进程，并为该进程创建一个 UTS Namespace（CLONE_NEWUTS），并执行 new_namespace_func 函数
	// clone 库函数声明为：
	// int clone(int (*fn)(void *), void *stack, int flags, void *arg, ...
	// 		  /* pid_t *parent_tid, void *tls, pid_t *child_tid */);
	// 更多参见：https://man7.org/linux/man-pages/man2/clone.2.html
	pid_t p1 = clone(new_namespace_func, child_stack + STACK_SIZE, SIGCHLD | CLONE_NEWUTS, NULL);
	if (p1 == -1)
		errExit("clone");
	sleep(5);
	// 创建新的进程（不创建 Namespace），并执行测试命令
	pid_t p2 = old_namespace_exec();
	if (p2 == -1)
		errExit("fork");
	waitpid(p1, NULL, 0);
	waitpid(p2, NULL, 0);
	return 0;
}
```

#### Go 语言描述

```go
//go:build linux

// sudo go run ./src/go/01-namespace/02-uts/main.go

package main

import (
	"fmt"
	"log"
	"os"
	"os/exec"
	"syscall"
	"time"
)

const (
	sub = "sub"

	script = "hostname && hostname --nis || true"
)

func runTestScript(tip string) <-chan error {
	fmt.Println(tip)
	cmd := exec.Command("/bin/bash", "-cx", script)
	cmd.Stdin = os.Stdin
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	result := make(chan error)
	go func() {
		result <- cmd.Run()
	}()
	return result
}

func newNamespaceProccess() <-chan error {
	cmd := exec.Command(os.Args[0], "sub")
	// 创建新进程，并为该进程创建一个 UTS Namespace（syscall.CLONE_NEWUTS）
	// 更多参见：https://man7.org/linux/man-pages/man2/clone.2.html
	cmd.SysProcAttr = &syscall.SysProcAttr{
		Cloneflags: syscall.CLONE_NEWUTS,
	}
	cmd.Stdin = os.Stdin
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	result := make(chan error)
	go func() {
		result <- cmd.Run()
	}()
	return result
}

func newNamespaceProccessFunc() <-chan error {
	if err := syscall.Sethostname([]byte("new-hostname")); err != nil {
		panic(err)
	}
	if err := syscall.Setdomainname([]byte("new-domainname")); err != nil {
		panic(err)
	}
	return runTestScript("=== new uts namespace process ===")
}

func oldNamespaceProccess() <-chan error {
	return runTestScript("=== old namespace process ===")
}

func main() {
	switch len(os.Args) {
	case 1:
		// 1. 执行 newNamespaceExec，启动一个具有新的 UTS Namespace 的进程
		r1 := newNamespaceProccess()
		time.Sleep(5 * time.Second)
		// 3. 创建新的进程（不创建 Namespace），并执行测试命令
		r2 := oldNamespaceProccess()
		err1, err2 := <-r1, <-r2
		if err1 != nil {
			panic(err1)
		}
		if err2 != nil {
			panic(err2)
		}
		return
	case 2:
		// 2. 该进程执行 newNamespaceProccessFunc，配置 hostname 和 domainname，并执行测试脚本
		if os.Args[1] == sub {
			if err := <-newNamespaceProccessFunc(); err != nil {
				panic(err)
			}
			return
		}
	}
	log.Fatalf("usage: %s [sub]", os.Args[0])
}
```

#### Shell 描述

```bash
#!/usr/bin/env bash

# sudo ./src/shell/01-namespace/02-uts/main.sh

script="hostname && hostname --nis || true"

# 创建新进程，并为该进程创建一个 UTS Namespace（-u）
# 更多参见：https://man7.org/linux/man-pages/man1/unshare.1.html

# 设置新的 hostname 和 domainname
unshare -u /bin/bash -c "hostname new-hostname && domainname new-domainname \
	&& echo '=== new uts namespace process ===' && set -x && $script" &
pid1=$!

sleep 5
# 创建新的进程（不创建 Namespace），并执行测试命令
/bin/bash -c "echo '=== old namespace process ===' && set -x && $script" &
pid2=$!

wait $pid1
wait $pid2
```

#### 输出及分析

按照代码上方注释，编译并运行，输出形如：

```
=== new uts namespace process ===
+ hostname
new-hostname
+ hostname --nis
new-domainname
=== old namespace process ===
+ hostname
debian
+ hostname --nis
hostname: Local domain name not set
+ true
```

* 具有新的 Mount Namespace 的进程打印的 hostname 和 domainname 发生了变化
* 旧的 Namespace 中进程打印的 hostname 和 domainname 没有受到影响

## IPC Namespace

TODO

## PID Namespace

> 手册页面：[pid namespaces](https://man7.org/linux/man-pages/man7/pid_namespaces.7.html)。

### 背景知识

#### 信号

信号是类 Unix 操作系统一种进程间通知的机制（参见：手册 [signal(7)](https://man7.org/linux/man-pages/man7/signal.7.html)）。本部分涉及的为：

* 用来协调多个进程的执行，如监听子孙进程的状态变更 `SIGCHLD`，默认忽略。需要注意的是，如果一个进程退出后，其父进程进程没有处理 `SIGCHLD` 信号，则该进程占用 PCB 将不会释放，此时该进程被称为僵尸进程。
* 无法覆盖的特权信号，`SIGKILL` （终止） 和 `SIGSTOP` （挂起，需通过 `SIGCONT` 信号唤醒）
* `SIGTERM`，可以覆盖默认的行为，一般用于优雅退出

#### 1 进程

1 号进程是内核创建的第 1 个用户态进程，内核对该进程的有特殊处理。

##### 1 进程和进程树

在 Unix 类系统中，进程会组成一颗进程树，其根节点是 0 号进程。每个进程都有一个父进程，有 0 个或多个子进程。

一个进程通过 fork/clone 系统调用创建一个子进程，一个进程的父进程一般为 fork 该进程的进程，但是有一个例外是：

当一个进程的父进程退出了，为了维持进程树的关系，该进程的父进程将会被设置为 1 号进程。这种父进程变化为 1 号进程的进程被称为孤儿进程。这个过程可以叫做：1 号进程收养了该孤儿进程。

##### 1 号进程和信号

* 1 号进程只能收到一种信号，即 1 号进程注册了信号处理器的信号。参见：[kill(2)](https://man7.org/linux/man-pages/man2/kill.2.html#NOTES)，因此 `kill -9 1` 也收不到（`SIGKILL` 和 `SIGSTOP` 两个特权信号都收不到）
* 通过 [reboot(2)](https://man7.org/linux/man-pages/man2/reboot.2.html) （`LINUX_REBOOT_CMD_CAD_OFF`）关闭 CAD （Ctrl-Alt-Del） 快捷键时，CAD 将会向 1 号进程发送 `SIGINT` 信号

#### `/proc` 文件系统

> 手册：[proc(5)](https://man7.org/linux/man-pages/man5/proc.5.html)

进程文件系统，通过 `mount -t proc proc /proc` 调用。top、ps 等命令都是通过该文件系统实现的。

#### Unix domain socket

> 手册：[unix(7)]( https://man7.org/linux/man-pages/man7/unix.7.html)

遵循 Socket API 的 进程通讯方式，相比于网络层面的 Socket API 接口，性能是更好。

### 描述

> 手册：[pid_namespaces(7)](https://man7.org/linux/man-pages/man7/pid_namespaces.7.html)

* 通过 `CLONE_NEWPID` 可以创建一个 PID Namespace
    * `clone(2)` 系统调用产生的进程就是该 PID Namespace 的**第一个进程**
    * `setns(2)` 系统调用后，再调用 `fork/clone` 系统调用（不需要指定 `CLONE_NEWPID`），产生的进程就是该 PID Namespace 的进程。注意：调用 `setns(2)` 的进程的 PID Namespace 不会发生变化。
    * `unshare(2)` 系统调用后，再调用 `fork/clone` 系统调用（不需要指定 `CLONE_NEWPID`），产生的进程就是该 PID Namespace 的进程，第一次调用时产生的进程，就是该 PID Namespace 的**第一个进程**。注意：调用 `unshare(2)` 的进程的 PID Namespace 不会发生变化。
* PID Namespace 支持嵌套
    * 最大 32 层
    * 当前 PID Namespace 可见所有子孙 Namespace 的进程，可见意味着可以 kill、设置优先级
    * 当前 PID Namespace 无法看到祖先 Namespace 下的进程
    * 一个进程在每一层 PID Namespace 都有一个 PID，进程自身调用 `getpid` 看到的是当前 PID Namespace 的 PID
    * 如果当前 PID Namespace 的进程的父进程也是当前 PID Namespace 内的进程，则  `getppid(2)` 返回该父进程在该 PID Namespace 的 PID
    * 如果当前 PID Namespace 的进程的父进程不是当前 PID Namespace 内的进程，则  `getppid(2)` 返回该父进程返回 0 （`setns(2)` 和 `unshare(2)` 语义造成的）

![image](/image/container-core-tech-namespace-pid-create-or-join.png)

* `setns(2)` 和 `unshare(2)` 语义，由于一个进程的 PID Namespace 从创建的那一刻就固定了，所以 `setns(2)` 和 `unshare(2)`，并不会影响当前进程的 PID Namespace（ 仅仅修改 `/proc/[pid]/ns/pid_for_children` 文件）。（试想一下，如果 PID Namespace 发生了变化，那么他们的进程号就变了，而很多程序假设自身的进程号不会发生变化的，这样就破坏了兼容性）
* 新的 PID Namespace 的**第一个进程**的进程号为 `1`，即在该 PID Namespace 中，该进程就是受内核特殊处理的 1 号进程（参见上文：1 号进程和信号，1 号进程和进程树），此外还需要注意：
    * 该 PID Namespace 内的进程无法 `kill -9` 杀死 1 号进程（受内核保护）。
    * 祖先 PID Namespace 的进程可以向该 1 号进程通过 `kill -9` 发送信号，此时该进程的行为和普通进程一致。但是有一点需要注意的是（**手册也没有阐述** `5.10.0-11-amd64` 稳定复现）：
        * 如果该 PID Namespace 存在一个 `进程 a`，其父进程不在该 PID Namespace 中 （即：通过 `setns(2)` 创建到该 Namespace 中），且这个父进程没有处理 `SIGCHLD` 信号。此时 `kill -9` 1 号进程
        * `进程 a` 将变成僵尸进程，该名字空间下的所有进程都将无响应
        * 该 PID Namespace 处于可不加入状态（即：通过 `setns(2)` 创建将报错 `ENOMEM`）
        * 只有 `进程 a` 真正退出，该 PID Namespace 的其他进程才能退出
    * 如果某 PID Namespace 的 1 号进程退出了，则整个 PID Namespace 所有进程将被杀死，也就是说这个 PID Namespace 已经消失了。
        * 内核会向该 PID Namespace 下的所有进程发送 `SIGKILL` (9) 信号
        * 无法再在该 Namespace 中 `fork` 进程，比如：之前通过调用了 `setns(2)` 和 `unshare(2)` 将该进程 `/proc/[pid]/ns/pid_for_children` 设置为一个 1 号进程现在已经退出的 PID Namespace，然后执行 `fork`，此时会报 `ENOMEM` 错误。
    * 在非 Init PID Namespace 调用 [`reboot(2)`](https://man7.org/linux/man-pages/man2/reboot.2.html) 行为不同，调用后，1 号进程将直接被终止，该进程的父进程 [`wait(2)`](https://man7.org/linux/man-pages/man2/wait.2.html) 收到子进程的退出信号为 `SIGHUP` 或 `SIGINT` （由参数决定） 信号（通过 `WTERMSIG(wstatus)` 获得）
    * PID Namespace 1 号进程收养孤儿机制
        * `getppid(2)` 不为 0 的会被当前 PID Namespace 的 1 号进程收养
        * `getppid(2)` 为 0 的不会被当前 PID Namespace 的 1 号进程收养，而是被之前父 PID Namespace 所在的 PID Namespace 的 1 号进程收养 （产生这种进程的原因还是 `setns(2)` 和 `unshare(2)` 语义造成的），在当前 PID Namespace 看来，该进程的 `getppid(2)` 仍为 0
* `/proc`
    * 显示的是在执行 mount 时刻进程所属的 PID Namespace 下的可见的进程（包含子孙进程）。
    * 一个常见做法是，PID Namespace 配合 Mount Namespace 使用，执行 `mount -t proc proc /proc`，将当前 PID Namespace 的进程信息挂载进去。（如果不这么做，`/proc/self` 看到的还是该进程在父 PID Namespace 中的信息）
    * `/proc/sys/kernel/ns_last_pid` 是当前 PID Namespace 的 last pid，可以通过更改该文件的值，来配置即将创建的进程的 ID（从 `ns_last_pid + 1` 开始查找）
* 杂项
    * `SCM_CREDENTIALS` `unix(7)` 会翻译成对应的 PID Namespace 的 PID

![image](/image/container-core-tech-namespace-pid-proccess-tree-and-operate.png)

### 实验

#### 实验设计

为了验证 PID Namespace 的能力，按照时序进行如下操作：

* (0s) `主进程` 启动一个具有新 PID Namespace 和 Mount Namespace 的 `进程(a)`，主进程 sleep 1s
* (0s) `进程(a)` 会先挂载 `/proc`， sleep 2s
* (1s) `主进程` 构造一个孤儿进程，`进程(b)`，该进程在新 PID Namespace 中，其 ppid 为 0，在父 PID Namespace 中其 ppid 为 1
* (2s) `主进程` 构造 `进程(c)`，该进程在新 PID Namespace 中，其 ppid 为 0，，在父 PID Namespace 中其 ppid 为 `主进程`
* (3s) `子进程(a)` 执行命令：
    * 构造一个 `孤儿进程(d)`，在该 PID Namespace，其 ppid 为 1
    * 观察 `/proc` 目录
    * 观察该 PID Namespace 的所有进程
    * 尝试 `kill -9 1`
    * 再次观察该 PID Namespace 的所有进程
    * `exec sleep infinity`
* (4s) 然后 fork `子进程(e)`，该进程在主进程初始状态的 PID Namespace 中，执行命令：
    * 观察 `/proc` 目录
    * 观察所有 sleep 进程
    * 尝试 `kill -9 进程(a)`
    * 再次观察观察所有 sleep 进程
* (5s) 主进程退出

该实验在第 3s 末进程状态应该为：

![image](/image/container-core-tech-namespace-pid-exp.png)

注意，上图描述的是 C 语言版本可以达到的效果：

* 在 Go 语言 和 Shell 描述的实验代码中，`进程 c` 的父进程应该是 `nsenter`。这个 `nsenter` 的 PID Namespace 为 main，这个 `nsenter` 的父进程为 main。

此外，阅读下列实验代码，可以关注注释中的如下内容：

* `seq: xxs` 标明时序过程。
* `进程 x` 表示相关语句来生成实验设计中的进程

#### C 语言描述

注意事项

* 父进程需要处理 `SIGCHLD` 信号，否则主进程 `kill -9` 新 PID Namespace 的 1 号进程（即 `进程 a`）时，上文实验设计 `进程 c` 变成僵尸进程，导致新 PID Namespace 的所有进程无响应
* 使用 [`sleep(3) 库函数`](https://man7.org/linux/man-pages/man3/sleep.3.html) 会被 `SIGCHLD` 信号中断，导致时序不符合预期。因此需要使用 [`nanosleep(2) 系统调用`](https://man7.org/linux/man-pages/man2/nanosleep.2.html) 手动实现一个专门的 sleep。

实验代码如下

```cpp
// gcc src/c/01-namespace/04-pid/main.c && sudo ./a.out

#define _GNU_SOURCE	   // Required for enabling clone(2)
#include <sys/wait.h>  // For waitpid(2)
#include <sys/mount.h> // For mount(2)
#include <sys/mman.h>  // For mmap(2)
#include <sys/syscall.h> // For SYS_pidfd_open

#include <time.h>	   // For nanosleep(2)
#include <sched.h>	   // For clone(2)
#include <signal.h>	   // For SIGCHLD
#include <stdio.h>	   // For perror(3), printf(3), perror(3)
#include <unistd.h>    // For execv(3), sleep(3)
#include <stdlib.h>    // For exit(3), system(3)


#define errExit(msg)    do { perror(msg); exit(EXIT_FAILURE); \
                               } while (0)

#define STACK_SIZE (1024 * 1024)

void my_sleep(int sec)
{
	struct timespec t = {
		.tv_sec = sec,
		.tv_nsec = 0};
	// sleep 会被信号打断，因此通过 nanosleep 重新实现一下
	// https: // man7.org/linux/man-pages/man2/nanosleep.2.html
	while (nanosleep(&t, &t) != 0)
		;
}

// 进程 a：当前 bash，最终为 sleep infinity
// 进程 d：nohup sleep infinity 孤儿进程在该 PID Namespace 中，其 ppid 为 1
char *const proccess_a_args[] = {
	"/bin/bash",
	"-xc",
	"bash -c 'nohup sleep infinity >/dev/null 2>&1 &' \
	&& echo $$ \
	&& ls /proc \
	&& ps -o pid,ppid,cmd \
	&& kill -9 1\
	&& ps -o pid,ppid,cmd \
	&& exec sleep infinity \
	",
	NULL};

// 进程 b： 在该 PID Namespace 中，构造一个孤儿进程，其 ppid 为 0，在父 PID Namespace 中 为 1
char *proccess_b_args[] = {
	"/bin/bash",
	"-c",
	"",
	NULL};

// 进程 c： sleep infinity 进程在该 PID Namespace 中，其 ppid 为 0，在父 PID Namespace 中 ppid 为 主进程
char *const proccess_c_args[] = {
	"/bin/bash",
	"-c",
	"exec sleep infinity",
	NULL};

// 进程 e：
char *const proccess_e_args[] = {
	"/bin/bash",
	"-xc",
	"ls /proc \
	&& ps -eo pid,ppid,cmd | grep sleep | grep -v grep  \
	&& kill -9 $(ps -eo pid,ppid | grep $PPID | awk '{print $1}' | sed -n '2p') \
	&& ps -eo pid,ppid,cmd | grep sleep | grep -v grep \
	",
	NULL};

int new_namespace_func(void *args)
{
	// seq: 0s

	// 首先，需要阻止挂载事件传播到其他 Mount Namespace，参见：https://man7.org/linux/man-pages/man7/mount_namespaces.7.html#NOTES
	// 如果不执行这个语句， cat /proc/self/mountinfo 所有行将会包含 shared，这样在这个子进程中执行 mount 其他进程也会受影响
	// 关于 Shared subtrees 更多参见：
	//   https://segmentfault.com/a/1190000006899213
	//   https://man7.org/linux/man-pages/man7/mount_namespaces.7.html#SHARED_SUBTREES
	// 下面语句的含义是：重新递归挂（MS_REC）载 / ，并设置为不共享（MS_SLAVE 或 MS_PRIVATE）
	// 说明：
	//   MS_SLAVE 换成 MS_PRIVATE 也能达到同样的效果
	//   等价于执行：mount --make-rslave / 命令
	if (mount(NULL, "/", NULL , MS_SLAVE | MS_REC, NULL) == -1)
		errExit("mount-MS_SLAVE");
	// 挂载当前 PID Namespace 的 proc
	// 因为在新的 Mount Namespace 中执行，所有其他进程的目录树不受影响
	// 等价命令为：mount -t proc proc /proc
	// mount 函数声明为：
	//    int mount(const char *source, const char *target,
	//              const char *filesystemtype, unsigned long mountflags,
	//              const void *data);
	// 更多参见：https://man7.org/linux/man-pages/man2/mount.2.html
	if (mount("proc", "/proc", "proc", 0, NULL) == -1)
		errExit("mount-proc");
	my_sleep(3);
	// seq: 3s
	printf("=== new pid namespace process ===\n");
	execv(proccess_a_args[0], proccess_a_args);
	perror("exec");
	exit(EXIT_FAILURE);
}

pid_t fork_proccess(char *const *argv)
{
	pid_t p = fork();
	if (p == 0)
	{
		execv(argv[0], argv);
		perror("exec");
		exit(EXIT_FAILURE);
	}
	return p;
}

void set_pid_namespace(pid_t pid) {
	int fd = syscall(SYS_pidfd_open, pid, 0);
	if (fd == -1)
		errExit("pidfd_open");
	if (setns(fd, CLONE_NEWPID) == -1)
		errExit("setns");
	close(fd);
}

void print_child_handler(int sig) {
	int wstatus;
	pid_t pid;
	// https://man7.org/linux/man-pages/man2/waitpid.2.html
	// 获取子进程退出情况
	while ((pid=waitpid(-1, &wstatus, WNOHANG)) > 0) {
		printf("*** pid %d exit by %d signal\n", pid, WTERMSIG(wstatus));
	}
}

void register_signal_handler() {
	// 处理 SIGCHLD 信号，解决僵尸进程阻塞 Namespace 进程退出的情况。
	signal(SIGCHLD, print_child_handler);
}

int main(int argc, char *argv[])
{
	// seq: 0s
	printf("=== main: %d\n", getpid());
	// 注册 SIGCHLD 处理程序，会产生僵尸进程，而导致 PID Namespace 无法退出
	register_signal_handler();
	// 为子进程提供申请函数栈
	void *child_stack = mmap(NULL, STACK_SIZE,
							 PROT_READ | PROT_WRITE,
							 MAP_PRIVATE | MAP_ANONYMOUS | MAP_STACK,
							 -1, 0);
	if (child_stack == MAP_FAILED)
		errExit("mmap");
	// 创建新进程，并为该进程创建一个 PID Namespace（CLONE_NEWPID），并执行 new_namespace_func 函数
	// clone 库函数声明为：
	// int clone(int (*fn)(void *), void *stack, int flags, void *arg, ...
	// 		  /* pid_t *parent_tid, void *tls, pid_t *child_tid */);
	// 更多参见：https://man7.org/linux/man-pages/man2/clone.2.html
	pid_t pa = clone(new_namespace_func, child_stack + STACK_SIZE, SIGCHLD | CLONE_NEWNS | CLONE_NEWPID, NULL); // 进程 a
	if (pa == -1)
		errExit("clone-PA");
	printf("=== PA: %d\n", pa);

	my_sleep(1);
	// seq: 1s

	// 构造 进程 b
	char buf[256];
	// 通过 nsenter 进入进程 a 的 PID Namespace
	sprintf(buf, "exec nsenter -p -t %d bash -c 'echo === PB: \"$$ in new pid namespace\" && exec sleep infinity'", pa);
	proccess_b_args[2] = buf;
	pid_t pbp = fork_proccess(proccess_b_args);
	if (pbp == -1)
		errExit("clone-PB");
	my_sleep(1);

	// seq: 2s

	// 此时 kill 掉 nsenter 进程，sleep infinity 就能称为满足条件的进程 b
	kill(pbp, SIGKILL);

	// 主进程 setns PID Namespace 为 进程 a
	set_pid_namespace(pa);
	// fork 进程 c
	pid_t pc = fork_proccess(proccess_c_args);
	if (pc == -1)
		errExit("clone-PC");
	printf("=== PC: %d\n", pc);

	my_sleep(2);
	// seq: 4s

	// 恢复主进程 PID Namespace
	set_pid_namespace(1);
	printf("=== old pid namespace process ===\n");
	pid_t pe = fork_proccess(proccess_e_args);

	my_sleep(1);
	// seq: 5s

	return 0;
}
```

#### Go 语言描述

注意事项：

* Go 不能直接使用 setns 系统调用（因为 setns 不支持多线程调用，而 go runtime 是多线程），因此还是通过 nsenter 命令实现 `进程 c`

```go
//go:build linux

// sudo go run src/go/01-namespace/04-pid/main.go

package main

import (
	"fmt"
	"log"
	"os"
	"os/exec"
	"os/signal"
	"syscall"
	"time"
)

const (
	sub = "sub"
)

var proccess_a_args = []string{
	"/bin/bash",
	"-xc",
	"bash -c 'nohup sleep infinity >/dev/null 2>&1 &' " +
		"&& echo $$ " +
		"&& ls /proc " +
		"&& ps -o pid,ppid,cmd " +
		"&& kill -9 1 " +
		"&& ps -o pid,ppid,cmd " +
		"&& exec sleep infinity ",
}

var proccess_e_args = []string{
	"/bin/bash",
	"-xc",
	"ls /proc " +
		"&& ps -eo pid,ppid,cmd | grep sleep | grep -v grep " +
		"&& kill -9 $(ps -eo pid,ppid | grep $PPID | awk '{print $1}' | sed -n '2p') " +
		"&& ps -eo pid,ppid,cmd | grep sleep | grep -v grep ",
}

func asyncExec(name string, arg ...string) int {
	cmd := exec.Command(name, arg...)
	cmd.Stdin = os.Stdin
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	cmd.Start()
	return cmd.Process.Pid
}

func newNamespaceProccess() int {
	cmd := exec.Command(os.Args[0], "sub")
	// 创建新进程，并为该进程创建一个 PID Namespace（syscall.CLONE_NEWPID
	// 更多参见：https://man7.org/linux/man-pages/man2/clone.2.html
	cmd.SysProcAttr = &syscall.SysProcAttr{
		Cloneflags: syscall.CLONE_NEWNS | syscall.CLONE_NEWPID,
	}
	cmd.Stdin = os.Stdin
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	cmd.Start()
	return cmd.Process.Pid
}

func newNamespaceProccessFunc() {
	// seq: 0s
	// 首先，需要阻止挂载事件传播到其他 Mount Namespace，参见：https://man7.org/linux/man-pages/man7/mount_namespaces.7.html#NOTES
	// 如果不执行这个语句， cat /proc/self/mountinfo 所有行将会包含 shared，这样在这个子进程中执行 mount 其他进程也会受影响
	// 关于 Shared subtrees 更多参见：
	//   https://segmentfault.com/a/1190000006899213
	//   https://man7.org/linux/man-pages/man7/mount_namespaces.7.html#SHARED_SUBTREES
	// 下面语句的含义是：重新递归挂（MS_REC）载 / ，并设置为不共享（MS_SLAVE 或 MS_PRIVATE）
	// 说明：
	//   MS_SLAVE 换成 MS_PRIVATE 也能达到同样的效果
	//   等价于执行：mount --make-rslave / 命令
	if err := syscall.Mount("", "/", "", syscall.MS_SLAVE|syscall.MS_REC, ""); err != nil {
		panic(err)
	}
	// 挂载当前 PID Namespace 的 proc
	// 因为在新的 Mount Namespace 中执行，所有其他进程的目录树不受影响
	// 等价命令为：mount -t proc proc /proc
	// 更多参见：https://man7.org/linux/man-pages/man8/mount.8.html
	if err := syscall.Mount("proc", "/proc", "proc", 0, ""); err != nil {
		panic(err)
	}
	time.Sleep(3 * time.Second)

	// seq: 3s
	fmt.Println("=== new pid namespace process ===")
	if err := syscall.Exec(proccess_a_args[0], proccess_a_args, nil); err != nil {
		panic(err)
	}
}

func registerSignalhandler() {
	// 处理 SIGCHLD 信号，解决僵尸进程阻塞 Namespace 进程退出的情况。
	sigs := make(chan os.Signal, 1)
	signal.Notify(sigs, syscall.SIGCHLD)
	go func() {
		for {
			<-sigs
			for {
				var wstatus syscall.WaitStatus
				pid, err := syscall.Wait4(-1, &wstatus, syscall.WNOHANG, nil)
				if err != nil || pid == -1 || pid == 0 {
					break
				}
				fmt.Printf("*** pid %d exit by %d signal\n", pid, wstatus.Signal())
			}
		}
	}()
}

func mainProccess() {
	// seq: 0s
	fmt.Printf("=== main: %d\n", os.Getpid())
	// 注册 SIGCHLD 处理程序，会产生僵尸进程，而导致 PID Namespace 无法退出
	registerSignalhandler()
	// 1. 执行 newNamespaceExec，启动一个具有新的 PID Namespace 的进程
	pa := newNamespaceProccess()
	fmt.Printf("=== PA: %d\n", pa)

	time.Sleep(1 * time.Second)
	// seq: 1s

	// 构造 进程 b
	// 通过 nsenter 进入进程 a 的 PID Namespace
	pbp := asyncExec("/bin/bash", "-c", fmt.Sprintf("exec nsenter -p -t %d bash -c 'echo === PB: \"$$ in new pid namespace\" && exec sleep infinity'", pa))
	time.Sleep(1 * time.Second)
	// 此时 kill 掉 nsenter 进程，sleep infinity 就能称为满足条件的进程 b
	syscall.Kill(pbp, syscall.SIGKILL)

	// seq: 2s
	// 构造进程 c
	// Go 不能直接使用 setns 系统调用（因为 setns 不支持多线程调用，而 go runtime 是多线程），因此还是通过 nsenter 命令实现
	_ = asyncExec("/bin/bash", "-c", fmt.Sprintf("exec nsenter -p -t %d bash -c 'echo === PC: \"$$ in new pid namespace\" && exec sleep infinity'", pa))

	time.Sleep(2 * time.Second)
	// seq: 4s
	fmt.Println("=== old pid namespace process ===")
	_ = asyncExec(proccess_e_args[0], proccess_e_args[1:]...)

	time.Sleep(1 * time.Second)
	// seq: 5s

	return
}

func main() {
	switch len(os.Args) {
	case 1:
		mainProccess()
		return
	case 2:
		if os.Args[1] == sub {
			newNamespaceProccessFunc()
			return
		}
	}
	log.Fatalf("usage: %s [sub]", os.Args[0])
}
```

#### Shell 描述

`src/shell/01-namespace/04-pid/main.sh`

```bash
#!/usr/bin/env bash

# sudo ./src/shell/01-namespace/04-pid/main.sh

# 注意：该脚本运行于进程为 main
# 设置 main 进程的 /proc/[pid]/ns/pid_for_children
# mount namespace 不能在此设置，因为 mount namespace 会立即生效 
exec unshare -p bash $(cd $(dirname "$0"); pwd)/seq00.sh
```

`src/shell/01-namespace/04-pid/seq00.sh`

```bash
#!/usr/bin/env bash

# 注意：该脚本运行于进程为 main

# seq: 0s

echo "=== main: $$"
# bash 默认处理了 SIGCHLD 信号，因此不需要处理信号

### 构造进程 a
# 创建一个新的 mount namespace
unshare -m bash -c 'mount -t proc proc /proc \
    && sleep 3 \
    && echo "=== new pid namespace process ===" \
    && set -x \
    && bash -c "nohup sleep infinity >/dev/null 2>&1 &" \
    && echo $$ \
    && ls /proc \
    && ps -o pid,ppid,cmd \
    && kill -9 1 \
    && ps -o pid,ppid,cmd \
    && exec sleep infinity \
' &

pa=$!
echo "=== PA: $pa"
sleep 1

# seq: 1s

# 恢复 main 进程 /proc/[pid]/ns/pid_for_children 为初始状态
exec nsenter -p -t 1 bash $(cd $(dirname "$0"); pwd)/seq01.sh $pa
```

`src/shell/01-namespace/04-pid/seq01.sh`

```bash
#!/usr/bin/env bash

# 注意：该脚本运行于 main 进程的子进程，其 PID Namespace 和 main 进程相同

pa=$1

# seq: 1s

### 构造进程 b
nsenter -p -t $pa bash -c 'echo "=== PB: $$ in new pid namespace" && exec sleep infinity' &
pbp=$! # 进程 b 的父进程
sleep 1

# seq: 2s

kill -9 $pbp # kill 进程 b 的父进程，进程 b 构造完成

### 构造进程 c
nsenter -p -t $pa bash -c 'echo "=== PC: $$ in new pid namespace" && exec sleep infinity' &

sleep 2

# seq: 4s

echo "=== old pid namespace process ==="
set -x
ls /proc
ps -eo pid,ppid,cmd | grep sleep | grep -v grep
kill -9 $pa
ps -eo pid,ppid,cmd | grep sleep | grep -v grep

```

### 输出及分析

```
=== main: 4683
=== PA: 4684
=== PB: 2 in new pid namespace
=== PC: 4708
*** pid 4697 exit by 9 signal
=== new pid namespace process ===
+ bash -c 'nohup sleep infinity >/dev/null 2>&1 &'
+ echo 1
1
+ ls /proc
1  6          bus       cpuinfo    dma            fb           iomem     kcore      kpagecgroup  locks    mounts        partitions   self      swaps          thread-self  version
2  acpi       cgroups   crypto     driver         filesystems  ioports   keys       kpagecount   meminfo  mtrr          pressure     slabinfo  sys            timer_list   vmallocinfo
3  asound     cmdline   devices    dynamic_debug  fs           irq       key-users  kpageflags   misc     net           sched_debug  softirqs  sysrq-trigger  tty          vmstat
5  buddyinfo  consoles  diskstats  execdomains    interrupts   kallsyms  kmsg       loadavg      modules  pagetypeinfo  schedstat    stat      sysvipc        uptime       zoneinfo
+ ps -o pid,ppid,cmd
	PID    PPID CMD
	  1       0 /bin/bash -xc bash -c 'nohup sleep infinity >/dev/null 2>&1 &' ?&& echo $$ ?&& ls /proc ?&& ps -o pid,ppid,cmd ?&& kill -9 1?&& ps -o pid,ppid,cmd ?&& exec sleep infini
	  2       0 sleep infinity
	  3       0 sleep infinity
	  5       1 sleep infinity
	  7       1 ps -o pid,ppid,cmd
+ kill -9 1
+ ps -o pid,ppid,cmd
	PID    PPID CMD
	  1       0 /bin/bash -xc bash -c 'nohup sleep infinity >/dev/null 2>&1 &' ?&& echo $$ ?&& ls /proc ?&& ps -o pid,ppid,cmd ?&& kill -9 1?&& ps -o pid,ppid,cmd ?&& exec sleep infini
	  2       0 sleep infinity
	  3       0 sleep infinity
	  5       1 sleep infinity
	  8       1 ps -o pid,ppid,cmd
+ exec sleep infinity
=== old pid namespace process ===
+ ls /proc
1    11    15    204   24    278  3     3853  4426  4683  48   585  691        cmdline    dynamic_debug  irq          kpageflags  net           softirqs       tty
10   110   1558  2072  2445  280  302   3854  4458  4684  489  6    717        consoles   execdomains    kallsyms     loadavg     pagetypeinfo  stat           uptime
104  1183  17    2078  25    283  306   4     45    4698  49   62   9          cpuinfo    fb             kcore        locks       partitions    swaps          version
105  12    18    2079  253   285  311   4193  4586  47    490  621  acpi       crypto     filesystems    keys         meminfo     pressure      sys            vmallocinfo
106  13    183   21    270   287  318   429   46    4708  50   641  asound     devices    fs             key-users    misc        sched_debug   sysrq-trigger  vmstat
107  14    19    22    272   290  3762  43    462   4710  51   65   buddyinfo  diskstats  interrupts     kmsg         modules     schedstat     sysvipc        zoneinfo
108  147   2     229   274   291  3764  44    463   4714  52   652  bus        dma        iomem          kpagecgroup  mounts      self          thread-self
109  148   20    23    277   294  3852  4413  4682  4715  575  66   cgroups    driver     ioports        kpagecount   mtrr        slabinfo      timer_list
+ grep -v grep
+ grep sleep
+ ps -eo pid,ppid,cmd
   4684    4683 sleep infinity
   4698       1 sleep infinity
   4708    4683 sleep infinity
   4710    4684 sleep infinity
++ sed -n 2p
++ awk '{print $1}'
++ grep 4683
++ ps -eo pid,ppid
+ kill -9 4684
*** pid 4708 exit by 9 signal
*** pid 4684 exit by 9 signal
+ grep -v grep
+ grep sleep
+ ps -eo pid,ppid,cmd
*** pid 4714 exit by 0 signal
```

分析上面输出日志可以看出，第 3s 末进程关系和实验描述一致：

![image](/image/container-core-tech-namespace-pid-exp-result.png)

注意，以上输出是 C 语言版本的 Go 和 Shell 版本略有不同：

* 在 Go 语言场景，进程 B 的 PID 为 `5` 而不是 `2`，因为 Go 会启动多个线程，这些线程会占用一些 PID。
* 在 Shell 语言场景，进程 B 的 PID 也不为 `2`，因为在 `seq00.sh` 脚本里面的一部分外部命令也占用了部分进程号。

## 场景

### 某 Namespace 的进程为其他 Namespace Mount 文件系统

TODO 分为管理者和使用者。管理者通过 share 传播特性 ([K8S CSI](https://kubernetes-csi.github.io/docs/deploying.html#driver-volume-mounts))

### 某 Namespace 的子进程进入其他 Namespace

假设一个新的 mount & pid namespace 进程，挂载了旧的 pid namespace 的 /proc 文件系统，且这个进程又有 root 权限。那么这个进程将可以切换到就 pid namespace 可见的进程的任意 namespace。

```cpp
// gcc src/c/01-namespace/scenes/01-join_to_ns.c && sudo ./a.out

// 参考：https://man7.org/linux/man-pages/man2/setns.2.html#EXAMPLES
#define _GNU_SOURCE    // Required for enabling clone(2)
#include <sys/wait.h>  // For waitpid(2)
#include <sys/mount.h> // For mount(2)
#include <sys/mman.h>  // For mmap(2)
#include <sched.h>     // For clone(2)
#include <signal.h>    // For SIGCHLD constant
#include <stdio.h>     // For perror(3), printf(3), perror(3)
#include <unistd.h>    // For execv(3), sleep(3)
#include <stdlib.h>    // For exit(3), system(3)
#include <limits.h>    // For PATH_MAX
#include <fcntl.h>     // For O_RDONLY, O_CLOEXEC
#include <sys/syscall.h> // For  SYS_* constants

#define errExit(msg)    do { perror(msg); exit(EXIT_FAILURE); \
                               } while (0)

static int
pivot_root(const char *new_root, const char *put_old)
{
    return syscall(SYS_pivot_root, new_root, put_old);
}

#define STACK_SIZE (1024 * 1024)

char *const child_args[] = {
    "/bin/sh",
    "-xc",
    "export PATH=/bin:$PATH && ls /",
    NULL};

char *const put_old = "data/busybox/rootfs2/.oldrootfs";
char *const new_root = "data/busybox/rootfs2";
char *const new_root_old_proc = "data/busybox/rootfs2/.oldproc";
char *const put_old_on_new_rootfs = "/.oldrootfs";

pid_t fork_proccess(char *const *argv)
{
    pid_t p = fork();
    if (p == 0)
    {
        execv(argv[0], argv);
        perror("exec");
        exit(EXIT_FAILURE);
    }
    return p;
}

int new_namespace_func(void *args)
{
    // mount 的传播性
    if (mount(NULL, "/", NULL, MS_PRIVATE | MS_REC, NULL) == -1)
        errExit("mount-MS_PRIVATE");
    // 确保 new_root 是一个挂载点
    if (mount(new_root, new_root, NULL, MS_BIND, NULL) == -1)
        errExit("mount-MS_BIND");
    // 绑定旧的 /proc
    if (mount("/proc", new_root_old_proc, NULL, MS_BIND, NULL) == -1)
        errExit("mount-MS_BIND-PROC");
    // 切换根挂载目录，将 new_root 挂载到根目录，将旧的根目录挂载到 put_old 目录下
    if (pivot_root(new_root, put_old) == -1)
        errExit("pivot_root");
    // 根目录已经切换了，所以之前的工作目录已经不存在了，所以需要将 working directory 切换到根目录
    if (chdir("/") == -1)
        errExit("chdir");
    // 取消挂载旧的根目录路径
    if (umount2(put_old_on_new_rootfs, MNT_DETACH) == -1)
        perror("umount2");
    printf("=== new mount namespace and pivot_root process ===\n");
    int pid = fork_proccess(child_args);
    if (pid == -1)
        perror("fork");
    waitpid(pid, NULL, 0);

    int fd = open("/.oldproc/1/ns/mnt", O_RDONLY | O_CLOEXEC);
    if (fd == -1)
        errExit("open");
    if (setns(fd, 0) == -1)
        errExit("setns");
    close(fd);
    printf("=== old mount namespace process by setns ===\n");
    pid = fork_proccess(child_args);
    if (pid == -1)
        perror("fork");
    waitpid(pid, NULL, 0);
}

int main()
{
    // 为子进程提供申请函数栈
    void *child_stack = mmap(NULL, STACK_SIZE,
                             PROT_READ | PROT_WRITE,
                             MAP_PRIVATE | MAP_ANONYMOUS | MAP_STACK,
                             -1, 0);
    if (child_stack == MAP_FAILED)
        errExit("mmap");
    // 创建新进程，并为该进程创建一个 Mount Namespace（CLONE_NEWNS），并执行 new_namespace_func 函数
    pid_t p1 = clone(new_namespace_func, child_stack + STACK_SIZE, SIGCHLD | CLONE_NEWNS | CLONE_NEWPID, NULL);
    if (p1 == -1)
        errExit("clone");
    waitpid(p1, NULL, 0);
    return 0;
}
```

输出为

```
=== new mount namespace and pivot_root process ===
+ export 'PATH=/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin'
+ ls /
README  bin
=== old mount namespace process by setns ===
+ export PATH=/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
+ ls /
bin  boot  dev  etc  home  initrd.img  initrd.img.old  lib  lib32  lib64  libx32  lost+found  media  mnt  opt  proc  root  run  sbin  srv  sys  tmp  usr  var  vmlinuz  vmlinuz.old
r
```

分析

注意：`/proc/[pid]/ns/` 目录下面的文件，看起来是一个一个的普通的软链，但实际这些文件是特殊的，检验方式是使用 `cp -d` 复制出来，使用 `open` 是无法打开的，但是原文件是可以打开的。

利用该特性，我们可以在一个具有新的 Namespace 的进程中启动一个新进程，这个进程位于初始化 Namespace （宿主机）中，就像没有 Namespace 一样。换句话说，一个挂载了 `/proc` 的 docker 特权容器，可以在宿主机环境执行任意命令。

```bash
# 一个挂载了 `/proc` 的 docker 特权容器
docker run --privileged --mount type=bind,src=/proc,target=/root_proc  -it debian:11  bash
apt update && apt install gcc vim
# copy https://man7.org/linux/man-pages/man2/setns.2.html#EXAMPLES 这个例子代码到 main.c 中
gcc main.c -o ns_exec
# 执行 ls 看一下，可以发现文件系统已经切换到宿主机了
./ns_exec /root_proc/1/ns/mnt /bin/bash
```

## Docker & K8S 概念和本文技术对应关系

## 备忘

Namespace C 语言描述 https://xigang.github.io/2018/10/14/namespace-md/
unshare / mount https://segmentfault.com/a/1190000006913509 。
https://osh-2020.github.io/lab-4/namespaces/
https://osh-2020.github.io/
http://121.36.228.94/2021/02/21/linux_kernel_namespace/
https://www.redhat.com/sysadmin/behind-scenes-podman
