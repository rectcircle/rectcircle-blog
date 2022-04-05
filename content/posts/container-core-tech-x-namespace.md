---
title: "容器核心技术（四） Namespace"
date: 2022-02-11T20:38:01+08:00
draft: true
toc: true
comments: true
tags:
  - 云原生
---

## IPC Namespace

TODO

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
