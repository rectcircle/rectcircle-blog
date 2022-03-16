---
title: "容器核心技术（五） IPC Namespace"
date: 2022-03-17T23:58:00+08:00
draft: false
toc: true
comments: true
tags:
  - 云原生
---

> 手册页面：[ipc namespaces](https://man7.org/linux/man-pages/man7/ipc_namespaces.7.html)。

## 背景知识

> [WIKI](https://zh.wikipedia.org/wiki/%E8%A1%8C%E7%A8%8B%E9%96%93%E9%80%9A%E8%A8%8A)

IPC （Inter-Process Communication，进程间通讯） 有很多中方式，在 Linux 中主要有：

* 文件系统
* Signal 信号
* Pipe 管道
* FIFO 命名管道
* System V IPC
    * 消息队列
    * 信号量
    * 共享内存
* POSIX IPC
    * 消息队列
    * 信号量
    * 共享内存
* 网络 Socket
* Unix Domain Socket

更多参见：[Linux IPC](/posts/linux-ipc/)

## 描述

IPC Namespace 主要隔离了如下全局资源：

* System V IPC，包括消息队列、信号量、共享内存。
* POSIX IPC 的 消息队列，不包括信号量、共享内存（原因是信号量和共享内存是基于 tmpfs 文件系统的，已经通过 mount namespace 隔离过了）。

不同的 IPC Namespace 的如下 `/proc` 接口是隔离的：

* `/proc/sys/fs/mqueue` POSIX message queue 接口。
* `/proc/sys/kernel` 中的 System V IPC 接口，即：msgmax、msgmnb、msgmni、sem、shmall、shmmax、shmmni 和shm_rmid_forced。
* System V IPC 接口 `/proc/sysvipc`。

当 IPC 命名空间被销毁时（即，当最后一个进程是命名空间的成员终止），所有 IPC 对象在命名空间被自动销毁。

使用 IPC 命名空间需要一个配置有的内核 CONFIG_IPC_NS 选项。

## 实验

### 实验设计

启动一个具有新 IPC Namespace 的子进程，这个进程会设置 创建一个 System V 消息队列。然后分别在父子两个进程观察系统消息队列列表。

### 源码

#### C 语言描述

```cpp
// gcc src/c/01-namespace/03-ipc/main.c && sudo ./a.out

#define _GNU_SOURCE	   // Required for enabling clone(2)
#include <sys/wait.h>  // For waitpid(2)
#include <sys/mount.h> // For mount(2)
#include <sys/mman.h>  // For mmap(2)
#include <sched.h>	   // For clone(2)
#include <signal.h>	   // For SIGCHLD constant
#include <stdio.h>	   // For perror(3), printf(3), perror(3)
#include <unistd.h>    // For execv(3), sleep(3)
#include <stdlib.h>    // For exit(3), system(3)
#include <sys/ipc.h>   // For ftok(3), key_t
#include <sys/msg.h>   // For msgget(2)

#define errExit(msg)    do { perror(msg); exit(EXIT_FAILURE); \
                               } while (0)

#define STACK_SIZE (1024 * 1024)

char *const child_args[] = {
	"/bin/bash",
	"-xc",
	"ipcs -q",
	NULL};

void create_msg_queue() 
{
	key_t k = ftok("/system_v_msg_queue_test_1", 1);
	int msgid = msgget(k, IPC_CREAT);
}

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
	// 创建一个 System V 消息队列
	create_msg_queue();
	printf("=== new ipc namespace process ===\n");
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
	// 创建新进程，并为该进程创建一个 IPC Namespace（CLONE_NEWIPC），并执行 new_namespace_func 函数
	// clone 库函数声明为：
	// int clone(int (*fn)(void *), void *stack, int flags, void *arg, ...
	// 		  /* pid_t *parent_tid, void *tls, pid_t *child_tid */);
	// 更多参见：https://man7.org/linux/man-pages/man2/clone.2.html
	// 为了测试方便，同时创建 Mount Namespace 和 PID Namespace
	pid_t p1 = clone(new_namespace_func, child_stack + STACK_SIZE, SIGCHLD | CLONE_NEWNS | CLONE_NEWIPC | CLONE_NEWPID, NULL);
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

// sudo go run ./src/go/01-namespace/03-ipc/main.go

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

	script = "ipcs -q"
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
	// 创建新进程，并为该进程创建一个 IPC Namespace（syscall.CLONE_NEWIPC）
	// 更多参见：https://man7.org/linux/man-pages/man2/clone.2.html
	// 为了测试方便，同时创建 Mount Namespace 和 PID Namespace
	cmd.SysProcAttr = &syscall.SysProcAttr{
		Cloneflags: syscall.CLONE_NEWNS | syscall.CLONE_NEWPID | syscall.CLONE_NEWIPC,
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

func createMsgQueue() {
	// key_t k = ftok("/system_v_msg_queue_test_1", 1);
	// int msgid = msgget(k, IPC_CREAT);

	if err := exec.Command("sh", "-c", "ipcmk -Q").Run(); err != nil {
		panic(err)
	}
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
	// 挂载当前 PID Namespace 的 proc
	// 因为在新的 Mount Namespace 中执行，所有其他进程的目录树不受影响
	// 等价命令为：mount -t proc proc /proc
	// 更多参见：https://man7.org/linux/man-pages/man8/mount.8.html
	if err := syscall.Mount("proc", "/proc", "proc", 0, ""); err != nil {
		panic(err)
	}
	// 创建一个 System V 消息队列
	createMsgQueue()
	return runTestScript("=== new ipc namespace process ===")
}

func oldNamespaceProccess() <-chan error {
	return runTestScript("=== old namespace process ===")
}

func main() {
	switch len(os.Args) {
	case 1:
		// 1. 执行 newNamespaceExec，启动一个具有新的 IPC Namespace 的进程
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

# sudo ./src/shell/01-namespace/03-ipc/main.sh

script="ipcs -q"

# unshare -m -i -p 创建新进程，并为该进程创建一个 ipc Namespace（-i）
# 更多参见：https://man7.org/linux/man-pages/man1/unshare.1.html
# 为了测试方便，同时创建 Mount Namespace (-m) 和 PID Namespace (-p)

# 注意 unshare 会自动取消进程的所有共享，因此不需要手动执行：mount --make-rprivate /
# 更多参见：https://man7.org/linux/man-pages/man1/unshare.1.html 的 --propagation 参数说明

# mount -t proc proc /proc 挂载 proc 文件系统，等价于 mount("proc", "/proc", "proc", 0, NULL) 系统调用
# 更多参见：https://man7.org/linux/man-pages/man8/mount.8.html

# ipcmk -Q 创建一个 System V 消息队列

# 注意：bash 的最后一条命令将不会 fork 进程，所以在最后补充一个 sleep ，让命令在新的进程执行！
# https://unix.stackexchange.com/questions/466496/why-is-there-no-apparent-clone-or-fork-in-simple-bash-command-and-how-its-done
unshare -m -i -p /bin/bash -c "/bin/bash -c 'mount -t proc proc /proc \
	&& ipcmk -Q \
	&& echo \"=== new ipc namespace process ===\" && set -x && $script' && sleep 10" &
pid1=$!

sleep 5
# 创建新的进程（不创建 Namespace），并执行测试命令
/bin/bash -c "echo '=== old namespace process ===' && set -x && $script" &
pid2=$!

wait $pid1
wait $pid2
```

### 输出及分析

```
=== new ipc namespace process ===
+ ipcs -q

------ Message Queues --------
key        msqid      owner      perms      used-bytes   messages    
0x8a0d2334 0          root       644        0            0           

=== old namespace process ===
+ ipcs -q

------ Message Queues --------
key        msqid      owner      perms      used-bytes   messages    
```

可以看出 new ipc namespace 中创建的 System V 消息队列，在初始 Namespace 中并不存在。
