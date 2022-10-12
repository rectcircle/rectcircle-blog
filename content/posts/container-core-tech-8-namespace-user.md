---
title: "容器核心技术（八） User Namespace"
date: 2022-09-19T00:01:00+08:00
draft: true
toc: true
comments: true
tags:
  - 云原生
---

## 背景知识

Linux 所有 Namespace 中最复杂的一部分，在了解 User Namespace 之前，最好前置阅读：[Linux 进程权限](/posts/linux-process-permission/)。

## 描述

User Namespace 实现了对进程权限的隔离，其特点如下所示：

* 关系： User Namespace 之间存在父子关系（换句话说，User Namespace 在宏观上可以看成一棵树，内核限制最多 32 层）。
* 和进程的关系：每一个进程都会关联一个 User Namespace。
* 初始： 在 Linux 系统启动时，内核会创建一个，初始 User Namespace（换句话说，在 Linux 中的普通进程和该初始 User Namespace 中关联）。
* 创建： 使用 `CLONE_NEWUSER` 标志调用 [`clone(2) 系统调用`](https://man7.org/linux/man-pages/man2/clone.2.html) 会创建一个新的 User Namespace （当然 [`unshare(2) 系统调用`](https://man7.org/linux/man-pages/man2/unshare.2.html) 也可以，在此不多赘述）。指的特别说明的是，和其他 Namespace 不同，创建 User Namespace 不需要任何特权（换句话说，任意的用户的进程都可以创建一个新的 User Namespace），该 User Namespace 和其创建时所在 User Namespace 构成父子关系。
* 和 Capabilities 关系：
    * Capabilities 是按 User Namespace 隔离的。
    * 新创建 User Namespace 的进程拥有当前内核所定义的全部的 Capabilities （具体而言，`cat /proc/新创建User Namespace的进程ID/status | grep Cap` 得到的输出是和 `cat /proc/1/status | grep Cap` 一样，其 `CapEff` 都是 `000001ffffffffff` TODO 待定，但至少 CapBnd 一定是全部的没问题）。
    * 只有拥有该 User Namespace 的 `CAP_SYS_ADMIN` 能力才能通过 [`setns(2) 系统调用`](https://man7.org/linux/man-pages/man2/setns.2.html) 加入该 User Namespace，加入后该进程将拥有当前内核所定义的全部的 Capabilities。
    * 在一个 User Namespace 中，[`execve(2) 系统调用`](https://man7.org/linux/man-pages/man2/execve.2.html) 会重新计算 Capabilities，参见：[Linux 进程权限](/posts/linux-process-permission/)。
    * 另一个 User Namespace 进程是否拥有某 User Namespace 的 Capabilities：
        * 如果一个进程在该 User Namespace 中拥有的 Capabilities，则同样拥有子孙 User Namespace 对应的 Capabilities （比如初始 User Namespace 的 root 进程同样拥有其他所有 User Namespace 的所有 Capabilities）。
        * 父 User Namespace 中创建该子 User Namespace 的有效用户 ID，会被设置为该子 User Namespace 的所有者，因此父 User Namespace 中具有同样有效用户 ID 的进程将具有该子 User Namespace 的全部的 Capabilities。
* 和其他 Namespace 的关系：
    * 其他 Namespace 会和其创建时的 User Namespace 关联（所有者），这意味着，拥有该 User Namespace 对应的 Capabilities 的进程就有权限操纵这些其他 Namespace 的资源。
    * 在使用 [`clone(2) 系统调用`](https://man7.org/linux/man-pages/man2/clone.2.html) 或 [`unshare(2) 系统调用`](https://man7.org/linux/man-pages/man2/unshare.2.html)  创建其他 Namespace 时，如果有 `CLONE_NEWUSER` 标志，则内核会先创建出 User Namespace，然后再创建其他的 Namespace。然后，这些其他的 Namespace 和这个刚刚创建的 User Namespace 关联。
* 非初始 User Namespace 进程的说明和限制：
    * 有些系统调用操作的资源并没有对应的 Namespace 进行隔离，因此只能在初始 User Namespace 中可以调用如：
        * 更改系统时间 （`CAP_SYS_TIME`）
        * 加载内核模块 （`CAP_SYS_MODULE`）
        * 创建块设备 （`CAP_MKNOD`）
    * 当一个非初始 User Namespace 关联了一个 Mount Namespace 时，该进程即使拥有 `CAP_SYS_ADMIN` 也只允许 mount 如下文件系统：
        * `/proc` (since Linux 3.8)
        * `/sys` (since Linux 3.8)
        * `devpts` (since Linux 3.9)
        * `tmpfs(5)` (since Linux 3.9)
        * `ramfs` (since Linux 3.9)
        * `mqueue` (since Linux 3.9)
        * `bpf` (since Linux 4.4)
        * `overlayfs` (since Linux 5.11)
    * 当一个非初始 User Namespace 关联了一个 Cgroup Namespace 时，该进程拥有 `CAP_SYS_ADMIN`，自 Linux 4.6 起，将允许 mount Cgroup v1 和 v2 的文件系统。
    * 当一个非初始 User Namespace 关联了一个 PID Namespace 时，该进程拥有 `CAP_SYS_ADMIN`，自 Linux 3.8 起，将允许 mount /proc 文件系统。
    * 注意，mount 基于块的文件系统时，只允许拥有 `CAP_SYS_ADMIN` 的初始 User Namespace 操作。
* User Namespace 之间的 ID 映射。
    * 新创建的 User Namespace 需要通过向 `/proc/[pid]/uid_map` 和 `/proc/[pid]/gid_map` 文件写入配置才能使用 [`setuid(2)`](https://man7.org/linux/man-pages/man2/setuid.2.html)、 [`setgid(2)`](https://man7.org/linux/man-pages/man2/setgid.2.html) 等与 id 相关的系统调用。顾名思义 `gid_map` 和 `uid_map` 时类似的，因此只介绍 `uid_map`。
    * `uid_map` 的格式为：
        * 每行包含三个用空格分隔的 32 位无符号整数，分别为（`to-user-id-start from-user-id-start range`）：
            * `to-user-id-start` 如果当前文件为 `/proc/[pid]/uid_map`，则该值为 `[pid]` 所在 User Namespace 的用户 ID
            * `from-user-id-start` 取决于读取 `/proc/[pid]/uid_map` 进程所在的 User Namespace（不同 User Namespace 进程读 `uid_map` 看到的第二列的内容是不一样的。）。
                * 如果和 `[pid]` 所在的 User Namespace 相同，则 `from-user-id-start` 表示映射到父 User Namespace 的用户 ID。
                * 如果和 `[pid]` 所在的 User Namespace 不同，则 `from-user-id-start` 表示映射读写 `/proc/[pid]/uid_map` 进程所在的 User Namespace 的用户 ID。
            * range 表示映射的范围，必须大于 0。
    * `uid_map` 写入说明
        * 只能写入一次，也就是说一旦确定则不能修改，刚创建时该文件是空的。
        * 写入必须以换行符结尾。包含多行，Linux 4.14 之前最多 5 行，Linux 4.15 起，最多 340 行，多行中的映射范围不允许有重叠，最少写入 1 行。
        * 写入的进程必须拥有该文件 User Namespace 的 `CAP_SETUID` (`CAP_SETGID`) 的 capability 且 写入的进程的 User Namespace 必须是当前 User Namespace 或者 父 User Namespace。
        * 写入的映射的用户 ID（组 ID）必须依次在父用户命名空间。
        * 如果想映射父进程的 0 (即 `xxx 0 xxx`)，除了满足上述要求外：还要求（Since Linux 5.12，解决一个安全漏洞）：
            * 如果是该 User Namespace 的进程写入，要求创建该 User Namespace 时的父进程必须有的 `CAP_SETFCAP` capability。
            * 如果是该 User Namespace 的父 User Namespace 的进程写入，要求该父进程必须有的 `CAP_SETFCAP` capability。
        * 以下两个 case 需要特别说明：
            * 当写入进程有父 User Namespace 的 `CAP_SETUID` (`CAP_SETGID`) capability 时，则没有其他限制。
            * 否则，存在如下限制：
                * 写入进程和创建该 User Namespace 的父进程有相同 effective user ID （EUID），且写入的内容必须包含一个映射到父进程的 EUID 的行。
                * 写入在 gid_map 之前，必须通过写入 `"deny"` 到 `/proc/[pid]/setgroups` 文件，来禁用 [`setgroups(2)`](https://man7.org/linux/man-pages/man2/setgroups.2.html) 系统调用。
    * 初始 User Namespace 没有父 User Namespace，但为了一致 `cat /proc/1/uid_map` 返回 `0          0 4294967295` （`4294967295 = 2^32-1`，`2^32` 即 `-1` 不被映射，原因是在一些系统调用中表示无用户）
    * `/proc/[pid]/setgroups`
        * 通过写入 `"deny"` 到 `/proc/[pid]/setgroups` 来禁用 [`setgroups(2)`](https://man7.org/linux/man-pages/man2/setgroups.2.html) 系统调用 （加入自：Linux 3.19，解决安全问题）。
        * `/proc/[pid]/setgroups` 的默认值：
            * 初始 User Namespace 其默认值为 `"allow"`。
            * 子 User Namespace 的默认值会继承父 User Namespace 的值。如果继承来的默认值为 `"deny"`，则无法再设置为 `"allow"`。
        * `/proc/[pid]/setgroups` 可以在写入 `/proc/[pid]/gid_map` 前写入多次。
    * `uid_map` 的作用
        * 进程身份：获取进程身份（如 [`getuid(2)`](https://man7.org/linux/man-pages/man2/getuid.2.html)、 [`getgid(2)`](https://man7.org/linux/man-pages/man2/getgid.2.html)） 和 获取文件信息（如 [`stat(2)`](https://man7.org/linux/man-pages/man2/stat.2.html)） 的系统调用获取到的 ID 都是映射到当前进程所在 User Namespace 的 ID（根据 uid_map 配置的字段进行映射。）。
        * 文件访问：当一个进程访问一个文件时，需要将该进程 id 映射到初始 User Namespace 中来确定是否有权限。当通过 [`stat(2)`](https://man7.org/linux/man-pages/man2/stat.2.html) 查看该文件的所有者 ID 时，则映射到当前 User Namespace。
        * 文件特权操作：除了 User Namespace 的进程需要拥有 `CAP_CHOWN`, `CAP_DAC_OVERRIDE`, `CAP_DAC_READ_SEARCH`, `CAP_FOWNER`, `CAP_FSETID` 这些权限外，还需要操作的文件的所属用户和所属组都必须已经映射到当前 User Namespace 中了（`CAP_FOWNER` 只要求所属用户映射即可，所属组可以不映射）。
        * 执行 Set-user-ID 或 set-group-ID 程序文件：如果该文件已经被映射，则以映射后的 User/Group ID 为准，如果没映射，则忽略 Set-user-ID 或 set-group-ID 位（即不改变 euid/egid，类似于 [mount(2)](https://man7.org/linux/man-pages/man2/mount.2.html) 使用了 `MS_NOSUID` 标志）。
        * Unix 套接字也会进行映射，参见 [unix(7)](https://man7.org/linux/man-pages/man7/unix.7.html) 的 SCM_CREDENTIALS。
        * 一个例子，父进程用户 id 是 1000，创建的当前进程绑定了一个新的 User Namespace，且配置的 `/proc/self/uid_map` 的内容为 `0 1000 500`，则：
            * 当前进程调用 [`getuid(2)`](https://man7.org/linux/man-pages/man2/getuid.2.html) 返回 `0`
            * 当前进程 对父进程的家目录调用 [`stat(2)`](https://man7.org/linux/man-pages/man2/stat.2.html) 看到的文件 owner 也为 `0` 即 root。
            * 当前进程可以通过 `chown` 修改父级成家目录文件的所有者（TODO 待确认）。
    * 未映射的 ID
        * 在各种情况（如 `stat(2)`、`getuid(2)`），均返回为溢出用户/组，定义在 `/proc/sys/kernel/overflowuid`、`/proc/sys/kernel/overflowgid` 一般为 `65534`。
        * 在某些情况，进程没有映射的其他 User Namespace 的进程，读 `uid_map`、`gid_map` 文件，第二个字段将返回 `4294967295` （`-1`）。

## 实验

### 实验设计

当前进程可以通过 `chown` 修改父级成家目录文件的所有者。?

### Go 源码

### 输出分析

## 总结

### Linux User Namespace 关系图

进程是核心，User Namespace 之间、User Namespace 和 其他 Namespace、User Namespace 和 Caps、User Namespace 和 UserID、User Namespace 和 文件系统。

### Linux 系统调用权限校验流程

通过对 Linux 进程的用户身份、Capabilities 以及 User Namespace 的了解。

可以看出，Linux 内核判断某进程对某个系统调用是否有权限的逻辑如下所示：

## 应用场景

## 参考

https://www.junmajinlong.com/virtual/namespace/user_namespace/

rootless

* https://rootlesscontaine.rs/
* https://docs.docker.com/engine/security/rootless/
* https://developer.aliyun.com/article/700923
