---
title: "容器核心技术（三） Mount Namespace"
date: 2022-03-10T23:38:00+08:00
draft: false
toc: true
comments: true
tags:
  - 云原生
---

> 手册页面：[mount namespaces](https://man7.org/linux/man-pages/man7/mount_namespaces.7.html)。

## 挂载 (mount)

> 手册：[`mount(2) 系统调用`](https://man7.org/linux/man-pages/man2/mount.2.html) | [`mount(8) 命令`](https://man7.org/linux/man-pages/man8/mount.8.html)

### 概述

目录树是 Linux 一种的全局系统资源，将一个文件系统绑定到目录树的一个节点的操作叫做挂载，即 `mount`。在 Linux 中，是通过 [`mount(2) 系统调用`](https://man7.org/linux/man-pages/man2/mount.2.html) 或 [`mount(8) 命令`](https://man7.org/linux/man-pages/man8/mount.8.html) 实现的。

这里先介绍几种在日常使用 Linux 过程中，常见的一些关于挂载的例子：

* 挂载 一个 ext4 格式的文件系统（磁盘分区） 到某个目录上
* 挂载 一个 U 盘到某个目录上
* 挂载 一个 ISO 光盘镜像文件到某个目录上
* 挂载一个 `tmpfs` 到某个目录，tmpfs 是一种特殊的文件系统，一般用于缓存，数据存储在内存和 swap 中，系统重启后会丢失。

在容器技术中，使用到的挂载主要是如下两种情况：

* bind 某一个目录（也可以是文件）到另一个目录（也可以是文件，类型需和源保持一致）。实现的效果类似于一个软链指向两一个目录，区别是，对于进程来说，是无法分辨出同一个文件的两个路径的关系。该能力是容器引擎实现挂载 host 目录或 volume 的核心技术。
* 将几个目录组成一套 overlay 文件系统，并挂载在某个目录，这是容器引擎实现镜像和容器数据存储的核心技术，后续文章有专门介绍。

更多关于 Linux 支持 mount 的文件系统类型，参见： `/proc/filesystems` 文件。下面给出的是 `Debian11` 的 `/proc/filesystems` 文件内容

```
nodev   sysfs
nodev   tmpfs
nodev   bdev
nodev   proc
nodev   cgroup
nodev   cgroup2
nodev   cpuset
nodev   devtmpfs
nodev   debugfs
nodev   tracefs
nodev   securityfs
nodev   sockfs
nodev   bpf
nodev   pipefs
nodev   ramfs
nodev   hugetlbfs
nodev   devpts
nodev   mqueue
nodev   pstore
        ext3
        ext2
        ext4
nodev   autofs
nodev   configfs
        fuseblk
nodev   fuse
nodev   fusectl
nodev   binfmt_misc
```

注意：mount 的调用需要 `CAP_SYS_ADMIN` 权限。

### mount 和 目录树

众所周知，和 Window 文件访问需要先确定盘（设备）不同，Linux 的文件是以目录树的形式进行抽象的。

在 Linux 中，如果想让进程访问文件系统内部的文件，就必须将该文件系统绑定到在目录树的一个路径上（该路径被称为挂载点）。

站在目录树角度，目录树上每个节点有两种可能：a) 当前文件系统的内容 b) 另一个文件系统的挂载点。因此，挂载点也是组成了一颗挂载点树。

总的来说分别从文件系统、目录树和挂载点视角来看，如下图所示：

![image](/image/container-core-tech-fs-mount-tree.png)

即：`目录树 = 文件系统 + 挂载点`。

### mount 系统调用和命令

> 手册：[`mount(2) 系统调用`](https://man7.org/linux/man-pages/man2/mount.2.html) | `[mount(8) 命令](https://man7.org/linux/man-pages/man8/mount.8.html)`

mount 系统调用和命令的参数可以分为五个类：

* `type` 文件系统类型
* `source` 源，与 `type` 有关，有可能是 目录、块设备或者不需要 等等
* `target` 目标，即挂载点，绑定到目录树的路径，必填，一般情况下是一个目录（也可能是一个文件），该路径必须在当前文件系统中存在。
* `data` 参数，与 `type` 有关，一般是是一串由逗号分隔的选项
* `mountflags` 附加标志
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
        * 其他参见：[`mount(2) 系统调用`](https://man7.org/linux/man-pages/man2/mount.2.html)

### 创建一个新的挂载点

* [`mount(2) 系统调用`](https://man7.org/linux/man-pages/man2/mount.2.html)：不使用 `MS_REMOUNT`, `MS_BIND`, `MS_MOVE`, `MS_SHARED`, `MS_PRIVATE`, `MS_SLAVE`, `MS_UNBINDABLE` 这些特殊参数的情况下为创建一个新的挂载。其他参数由 `type` 决定。
* [`mount(8) 命令`](https://man7.org/linux/man-pages/man8/mount.8.html)，参见文章：
[Linux mount （第一部分）](https://segmentfault.com/a/1190000006878392)。

### 重新挂载已存在挂载点

允许更改现有挂载的 `mountflags` 和 `data` ，而无需卸载和重新安装文件系统。

* 使用 `MS_REMOUNT` 标志
* 使用相同的 `target` 参数
* `source` 和 `filesystemtype` 参数将被忽略

更多参见：[`mount(2) 系统调用`](https://man7.org/linux/man-pages/man2/mount.2.html)

### 创建一个 bind 挂载点

* 使用 `MS_BIND` 标志
* `sourcec` 源目录
* `target` 目标目录
* `data` 忽略
* 默认情况只会绑定这个目录，而不会绑定这个目录下的其他挂载，可以通过 `MS_REC` 选项递归挂载

经测试 bind 并不会造成递归。原理参见下文：mount 传播类型

### 移动一个挂载点

* 使用 `mountflags` 标志
* `source` 指定一个现有的mount
* `target` 指定该挂载的被搬迁新位置
* `mountflags` 参数中的其余位将被忽略，同样，`type` 和 `data` 也会被忽略。
* 这个操作是原子的：在任何时候子树的挂载都不会被卸载。

### mount 传播类型

#### 挂载点属性介绍

> 手册：[proc(5)](https://man7.org/linux/man-pages/man5/proc.5.html)

挂载点列表以及每个挂载点的详细属性可以通过 `/proc/self/mountinfo` 文件查看，其每一行的格式为：

```
36 35 98:0 /mnt1 /mnt2 rw,noatime master:1 - ext3 /dev/root rw,errors=continue
(1)(2)(3)   (4)   (5)      (6)      (7)   (8) (9)   (10)         (11)
```

* (1)  mount ID，此挂载点的唯一 ID。
* (2)  parent ID，此挂载点的父挂载点 ID。
    * 如果此挂载点是挂载点树的根节点，parent ID = mount ID。
    * 父挂载点指的是：从当前挂载点路径开始向上递归，找到的第一个挂载点。
    * 如果当前挂载点的 parent 不在当前目录树，则这 parent ID 将不会出现在 `/proc/self/mountinfo` 文件中（比如 `chroot(2)`、`pivot_root(2)` 情况）。
* (4)  root: 将当前文件系统的那个目录（一般是 `/`），挂载到挂载点。
* (5)  mount point: 挂载点路径。
* (6)  mount options: `mount(2)` 的 `data` 参数
* (7)  optional fields: 0 或多个以 `,` 分割的可选字段，每个字段格式为 `tag[:value]`
* 其他略

#### bind 引入的问题

在引入 bind 之前，一个文件系统的内容只对应目录树上一个路径（不考虑硬链接/软链接）。

引入 bind 之后，一个文件系统的内容在目录树上就会对应多个路径。如：将 `/home/a` 目录 bind 到 `/home_a` 路径下 （对应下图 `1. bind`）。

此时。如果向对这些路径中的一个子目录中 bind 一个其他的目录，操作，其他路径是否可见呢？如：将 `/m2` bind 到 `/home_a/.m2`，`/home/a/.m2` 是否也自动绑定呢（对应下图 `2. bind` 后，`3.❓` 的情况）？

![image](/image/container-core-tech-fs-mount-tree-bind.png)

#### `传播特性` 和 `peer group`

在 Linux 中，上文提到的 `3.❓` 的情况，由挂载点 `optional fields` 字段的 `${传播类型}:${peer group}` 决定。

先来看 `peer group`。`peer group` 是一个数字 ID，Linux 保证同一个文件系统的 `peer group` 是相同的（注意：这个 `peer group` 中必须有一个 `MS_SHARED`，否则 `peer group` 相同的所有挂载点的 `peer group` 都会被清空）。

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

#### 修改传播类型参数说明

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

## 描述

### 隔离

Mount Namespace 实现了进程间挂载点树的隔离，即：不同 Namespace 的进程看到的挂载点树可以是不一样的（导致目录树不同），且这些进程中的挂载是相互不影响的。

### 传播类型

> 本部分主要在手册：[mount_namespaces(7)](https://man7.org/linux/man-pages/man7/mount_namespaces.7.html#SHARED_SUBTREES) 阐述

已该部分，已经在 《背景知识 —— mount 传播类型》阐述过了。

共享和传播在容器技术中应用参见：《场景 —— 某 Namespace 的进程为其他 Namespace Mount 文件系统》

### 文件共享

Mount Namespace 隔离的是是挂载点树，而不是目录树，因此如果在两个不同 Mount Namespace 挂载了相同的文件系统，则该文件系统就在这两个 Mount Namespace 中实现了共享。两者对文件的修改上方都是可见的。这就是容器引擎可以通过宿主机目录共享数据的原因。

### 相关系统调用和命令

除了 《Namespace 概述》 描述的相关系统调用、函数、命令以及文档的手册外，本部分还涉及如下内容：

* [`mount(2) 系统调用`](https://man7.org/linux/man-pages/man8/mount.8.html)
* [`mount(8) 命令`](https://man7.org/linux/man-pages/man8/mount.8.html)
* [`umount(2) 系统调用`](https://man7.org/linux/man-pages/man2/umount.2.html)
* [`umount(8) 命令`](https://man7.org/linux/man-pages/man8/umount.8.html)
* [`pivot_root(2) 系统调用`](https://man7.org/linux/man-pages/man2/pivot_root.2.html)
* [`pivot_root(8) 系统调用`](https://man7.org/linux/man-pages/man8/pivot_root.8.html)

特别说明，对于根目录挂载点的切换，需要通过 [`pivot_root(2) 系统调用`](https://man7.org/linux/man-pages/man2/pivot_root.2.html) 实现。

## 实验

### 实验设计

为了验证 Mount Namespace 的能力，我们将启动一个具有新 Mount Namespace 的 bash 的进程，这个进程将会使用 bind 挂载的方式将 `data/binding/source` 目录挂载到当前目录的 `data/binding/target` 目录，其中 `data/binding/source` 包含一个文件 `a`。并观察：

* 具有新 Mount Namespace 的 bash 进程，看到 `data/binding/source` 目录和 `data/binding/target` 目录，内容一致
* 其他普通进程，看到的 `data/binding/source` 目录和 `data/binding/target` 目录，内容**不**一致

此外还可以观察两个进程的 `mount` 命令的输出，以及 `readlink /proc/self/ns/mnt`、`cat /proc/self/mounts`、`cat /proc/self/mountinfo` 以及 `cat /proc/self/mountstats` 等的输出。

### 源码

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
        // 2. 该进程执行 newNamespaceProccessFunc，binding 文件系统，并执行测试脚本
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

### 输出及分析

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

## 扩展实验：切换根文件系统

最早，切换某个进程的根目录的系统调用为 [`chroot(2)`](https://man7.org/linux/man-pages/man2/chroot.2.html)，该能力最早出现在 1979 年的Unix V7 系统。chroot 仅仅是通过修改，进程的 task 结构体中 fs 结构体中的 root 字段实现的（[博客 1](https://huadeyu.tech/system/chroot-implement-detail.html)）。存在很多越狱手段，参见：[博客2](https://zhengyinyong.com/post/chroot-mechanism/#chroot-%E7%9A%84%E5%AE%89%E5%85%A8%E9%97%AE%E9%A2%98)。

配合 Mount Namespace，[`pivot_root(2) 系统调用`](https://man7.org/linux/man-pages/man2/pivot_root.2.html)可以实现完全隔离的根目录。

### 实验设计

为了验证 [`pivot_root(2) 系统调用`](https://man7.org/linux/man-pages/man2/pivot_root.2.html) 隔离根目录挂载点的能力。我们准备一个包含 `busybox` 的目录，用来充当新的根目录（下文称为 rootfs）。该目录位于 `data/busybox/rootfs`。准备命令为：

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

### 源码

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

### 输出及分析

按照代码上方注释，编译并运行，输出形如：

```
=== new mount namespace and pivot_root process ===
+ ls /
README  bin
+ ls /bin
busybox  ls       sh
```

可以看出根目录已经切换了。
