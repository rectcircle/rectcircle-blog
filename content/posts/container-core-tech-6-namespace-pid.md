---
title: "容器核心技术（六） PID Namespace"
date: 2022-03-17T22:00:00+08:00
draft: false
toc: true
comments: true
tags:
  - 云原生
---

> 手册页面：[pid namespaces](https://man7.org/linux/man-pages/man7/pid_namespaces.7.html)。

## 背景知识

### 信号

信号是类 Unix 操作系统一种进程间通知的机制（参见：手册 [signal(7)](https://man7.org/linux/man-pages/man7/signal.7.html)）。本部分涉及的为：

* 用来协调多个进程的执行，如监听子孙进程的状态变更 `SIGCHLD`，默认忽略。需要注意的是，如果一个进程退出后，其父进程进程没有处理 `SIGCHLD` 信号，则该进程占用 PCB 将不会释放，此时该进程被称为僵尸进程。
* 无法覆盖的特权信号，`SIGKILL` （终止） 和 `SIGSTOP` （挂起，需通过 `SIGCONT` 信号唤醒）
* `SIGTERM`，可以覆盖默认的行为，一般用于优雅退出

### 1 进程

1 号进程是内核创建的第 1 个用户态进程，内核对该进程的有特殊处理。

#### 1 进程和进程树

在 Unix 类系统中，进程会组成一颗进程树，其根节点是 0 号进程。每个进程都有一个父进程，有 0 个或多个子进程。

一个进程通过 fork/clone 系统调用创建一个子进程，一个进程的父进程一般为 fork 该进程的进程，但是有一个例外是：

当一个进程的父进程退出了，为了维持进程树的关系，该进程的父进程将会被设置为 1 号进程。这种父进程变化为 1 号进程的进程被称为孤儿进程。这个过程可以叫做：1 号进程收养了该孤儿进程。

#### 1 号进程和信号

* 1 号进程只能收到一种信号，即 1 号进程注册了信号处理器的信号。参见：[kill(2)](https://man7.org/linux/man-pages/man2/kill.2.html#NOTES)，因此 `kill -9 1` 也收不到（`SIGKILL` 和 `SIGSTOP` 两个特权信号都收不到）
* 通过 [reboot(2)](https://man7.org/linux/man-pages/man2/reboot.2.html) （`LINUX_REBOOT_CMD_CAD_OFF`）关闭 CAD （Ctrl-Alt-Del） 快捷键时，CAD 将会向 1 号进程发送 `SIGINT` 信号

### `/proc` 文件系统

> 手册：[proc(5)](https://man7.org/linux/man-pages/man5/proc.5.html)

进程文件系统，通过 `mount -t proc proc /proc` 调用。top、ps 等命令都是通过该文件系统实现的。

### Unix domain socket

> 手册：[unix(7)]( https://man7.org/linux/man-pages/man7/unix.7.html)

遵循 Socket API 的 进程通讯方式，相比于网络层面的 Socket API 接口，性能是更好。

## 描述

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

## 实验

### 实验设计

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

### 源码

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
