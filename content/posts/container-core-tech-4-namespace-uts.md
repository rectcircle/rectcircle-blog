---
title: "容器核心技术（四） UTS Namespace"
date: 2022-03-10T23:58:00+08:00
draft: false
toc: true
comments: true
tags:
  - 云原生
---

> 手册页面：[uts namespaces](https://man7.org/linux/man-pages/man7/uts_namespaces.7.html)。

UTS (UNIX Time-Sharing System) Namespace 提供了个对 hostname 和 NIS domain name 这两个系统标识符的的隔离。

## 背景知识

在 Linux 中，`hostname` 和 `domainname` 有很多种，需要区分清楚：

* `system hostname` (在 Linux 内核语境下直接叫 `hostname`)
    * 获取
        * [`hostname(1) 命令`](https://man7.org/linux/man-pages/man1/hostname.1.html) （无参数）
        * [`gethostname(2) 系统调用`](https://man7.org/linux/man-pages/man2/gethostname.2.html)
    * 配置
        * [`hostname(1) 命令`](https://man7.org/linux/man-pages/man1/hostname.1.html) （加一个参数）或者 `--file`
        * [`sethostname(2) 系统调用`](https://man7.org/linux/man-pages/man2/sethostname.2.html)
        * [`/etc/hostname(5) 配置文件`](https://man7.org/linux/man-pages/man5/hostname.5.html) ，在系统启动时配置一次
* `FQDN` (Fully Qualified Domain Name，在域名解析语境下直接叫 hostname)，解释参见： [`hostname(7)`](https://man7.org/linux/man-pages/man7/hostname.7.html)
    * 获取
        * [`hostname(1) 命令`](https://man7.org/linux/man-pages/man1/hostname.1.html) `--fqdn` 参数
        * [`gethostbyname2(3) 库函数`](https://linux.die.net/man/3/gethostbyname2)
    * 设置 ([原文](https://man7.org/linux/man-pages/man1/hostname.1.html#DESCRIPTION))
        * 默认通过 [`/etc/hosts(5) 配置文件`](https://man7.org/linux/man-pages/man5/hosts.5.html) 配置（每一行的格式为 `IP_address canonical_hostname [aliases...]`），值为 [/etc/hosts(5)](https://man7.org/linux/man-pages/man5/hosts.5.html) 文件中 alias 为 [`/etc/hostname(5)`](https://man7.org/linux/man-pages/man5/hostname.5.html) 的那一行的 `canonical_hostname`
        * 具体取决于 [`/etc/host.conf(5) 配置文件`](https://man7.org/linux/man-pages/man5/host.conf.5.html)
        * 没有对应系统调用（域名解析属于网络协议层面）
* `DNS domainname`，为 FQDN 去掉 第一个 `.` 和之前的内容
    * 获取
        * [`hostname(1) 命令`](https://man7.org/linux/man-pages/man1/hostname.1.html) `-d` 参数
        * [`dnsdomainname(1) 命令`](https://linux.die.net/man/1/dnsdomainname) `-d` 参数
        * [`gethostbyname2(3) 库函数`](https://linux.die.net/man/3/gethostbyname2)
    * 设置，参见 `FQDN` 设置
* `NIS/YP domainname` (在 Linux 内核语境下直接叫 `domainname`，又称 `nisdomainname`、`ypdomainname` 、 `Local domain name`)
    * 获取
        * [`hostname(1) 命令`](https://man7.org/linux/man-pages/man1/hostname.1.html) `-y` 或 `--yp` 或 `--nis` 参数
        * [`domainname(1) 命令`](https://linux.die.net/man/1/domainname)、[`nisdomainname(1) 命令`](https://linux.die.net/man/1/nisdomainname)、[`ypdomainname(1) 命令`](https://linux.die.net/man/1/ypdomainname)
        * [`getdomainname(2) 系统调用`](https://man7.org/linux/man-pages/man2/getdomainname.2.html)
    * 设置
        * [`setdomainname(2) 系统调用`](https://man7.org/linux/man-pages/man2/setdomainname.2.html)

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

## 描述

而 UTS Namespace 可以隔离的全局系统资源为：`system hostname` 和 `NIS/YP domainname`，设计的系统调用为：

* [`gethostname(2) 系统调用`](https://man7.org/linux/man-pages/man2/gethostname.2.html)
* [`sethostname(2) 系统调用`](https://man7.org/linux/man-pages/man2/sethostname.2.html)
* [`getdomainname(2) 系统调用`](https://man7.org/linux/man-pages/man2/getdomainname.2.html)
* [`setdomainname(2) 系统调用`](https://man7.org/linux/man-pages/man2/setdomainname.2.html)

下面，简单介绍下 `system hostname` 和 `NIS/YP domainname` 的应用。

* `system hostname`
    * 作为局域网邻居发现的标识符，可以通过 `${system hostname}.local` 直接访问该主机，更多参见：
        * [文章：在局域网建立.local域名](https://notes.leconiot.com/mdns.html)
        * [文章：隐藏在网络邻居背后的协议,快来看看你家网络有几种?](https://blog.csdn.net/docdocadmin/article/details/112135459)
* `NIS/YP domainname`
    * NIS 服务，更多参见：
        * [鸟哥的 Linux 私房菜：第十四章、账号控管： NIS 服务器](http://cn.linux.vbird.org/linux_server/0430nis.php)

## 实验

### 实验设计

为了验证 UTS Namespace 的能力，我们将启动一个具有新 UTS Namespace 的子进程，这个进程会设置 `hostname` 和 `domainname`。然后分别在父子两个进程观察 `hostname` 和 `domainname` 情况。

### 源码

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

### 输出及分析

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
