---
title: "Linux IPC"
date: 2022-03-13T01:28:48+08:00
draft: true
toc: true
comments: true
tags:
  - untagged
---

## 概述

IPC（Inter-Process Communication，进程间通讯），有多种。

系统学习：https://www.cnblogs.com/philip-tell-truth/p/6284475.html

## 管道 (pipe)

> 手册：[`pipe(7) 文档`](https://man7.org/linux/man-pages/man7/pipe.7.html) | [`pipe(2) 系统调用`](https://man7.org/linux/man-pages/man2/pipe.2.html)

管道是 Unix 系统 最古老的一种 IPC 机制。该机制的特点是：

* 通讯机制是半双工的，即 Pipe 的两个端点一个只能写入，另一个只能读取。
* 管道只能在具有公共祖先的进程间通讯，通常，一个管道由一个进程创建，在进程调用 fork 后，这个管道在父子进程通讯中使用。

在 Linux 中管道又称匿名管道，而 FIFO 被称为命名管道，本部分介绍的是匿名管道。

Linux 中 pipe 的函数声明为：

```cpp
#include <unistd.h>

int pipe (int fd[2])
```

* 参数 `fd` 是一个长度为 2 的数组，用来存放管道两个端点的文件描述符。
    * `fd[0]` 为读取端点的文件描述符
    * `fd[1]` 为写入端点的文件描述符
* 返回值 `-1` 表示出错

实例：一个进程创建一个管道由，在进程调用 fork 后，父进程发送 `hello world\n` 字符串，子进程读取。

```cpp
// gcc src/c/01-namespace/03-ipc/01-pipe.c && sudo ./a.out
#include <unistd.h>    // For pipe(2), STDOUT_FILENO
#include <limits.h>    // For PIPE_BUF
#include <stdlib.h>   // For EXIT_FAILURE, exit
#include <stdio.h>    // For perror
#include <sys/wait.h>  // For waitpid(2)
#include <string.h>    // For strlen(3)

#define errExit(msg)    do { perror(msg); exit(EXIT_FAILURE); \
                               } while (0)

void main()
{
    int n;
    int fd[2];
    pid_t pid;
    const char *msg = "hello world\n";
    const int MAXLINE = 1024;
    char line[MAXLINE];

    if (pipe(fd) < 0)
        errExit("pipe");

    if ((pid = fork())< 0)
        errExit("fork");

    if (pid > 0) // 父进程
    {
        close(fd[0]); // 父进程不需要使用管道的读取端点，所以关闭它
        write(fd[1], msg, strlen(msg));
        wait(NULL);
    }
    else // 子进程
    {
        close(fd[1]); // 子进程不需要使用管道的写入端点，所以关闭它
        n = read(fd[0], line, MAXLINE);
        write(STDOUT_FILENO, line, n);
    }
}
```

输出为：`hello world\n`

### popen 和 pclose

> 手册： [`popen(3) 库函数`](https://man7.org/linux/man-pages/man3/popen.3.html)

[`popen(3) 库函数`](https://man7.org/linux/man-pages/man3/popen.3.html) 封装了，父进程创建一个子进程，写入子进程标准输入 或 读取子进程标准输出的能力（读写只能二选一）。

函数声明为：

```cpp
#include <stdio.h>

FILE *popen(const char *command, const char *type);
int pclose(FILE *stream);
```

`popen` 实现原理为：

* 调用 `pipe(pfd)` 系统调用创建一个管道
* 调用 `fork` 创建一个子进程
    * 父进程根据 `type` 决定关闭 `pfd[0]` 或 `pfd[1]`，然后调用 `fdopen()` 库函数将另一个 `pfd[0]` 或 `pfd[1]` 封装成 `*FILE` 返回
    * 子进程根据 `type` 决定关闭 `pfd[0]` 或 `pfd[1]`，然后调用 `dup2` 系统调用重定向标准输入/输出到 `pfd[0]` 或 `pfd[1]`，然后调用 `exec` 使用 `sh -c command` 执行命令。

### 协同进程

一种比较常见的父子进程通讯方式。即，父进程创建两个管道，分别连接到子进程的标准输入和标准输出上，从而实现通讯。

该方式在只有 ksh 提供支持，sh，bash，csh 并不支持。

实现上需要注意标准 I/O 缓冲机制问题（全缓冲）

### shell 管道

在 shell 中 `command1 | command2` 的语法，是通过 [`pipe(2) 系统调用`](https://man7.org/linux/man-pages/man2/pipe.2.html) 和 [`dup2(2) 系统调用`](https://man7.org/linux/man-pages/man2/dup.2.html) 实现的。即：

* 当前进程标准输入，对接上级进程的标准输出
* 当前进程标准输出，对接下级进程的标准输入

实现上需要注意标准 I/O 缓冲机制问题（全缓冲）

### 注意事项

* 管道被设计来用于一对一单向通讯。并发使用存在如下问题：存在消息长度存在 `PIPE_BUF` 限制（4096）。如果单次写入超过该限制，则会被拆成多次发送。在多写的场景，会发生消息不连续的问题。这种场景让程序正确运行实现上比较困难，因此不建议用在在并发场景中。
* 如果写一个写端已经关闭的管道，读端将将返回 `0` 表示文件结束（不是 `-1`，`-1` 表示错误）。
* 如果写一个读端已经关闭的管道，将触发 `SIGPIPE` 信号，该信号的默认处理器为终止进程。如果处理了该信号，则写端将返回 `-1`，并且设置 `errno` 为 `EPIPE`。

## 命名管道 (FIFO)

> 手册：[`fifo(7) 文档`](https://man7.org/linux/man-pages/man7/fifo.7.html) | [`mkfifo(1) 命令`](https://man7.org/linux/man-pages/man1/mkfifo.1.html) | [mkfifo(3) 库函数](https://man7.org/linux/man-pages/man3/mkfifo.3.html)

FIFO (first-in first-out special file, named pipe) 又称命名管道，其特点和管道 (pipe) 相比

* 相同点是：通讯机制是半双工的，即 Pipe 的两个端点一个只能写入，另一个只能读取。
* 不点在是：FIFO 会在文件系统中创建一个类型为 `fifo` 的文件，支持任意进程打开该文件进行通讯，而管道 (pipe) 只能在具有公共祖先的进程间通讯。

Linux 中 FIFO 文件创建函数声明为：

```cpp
#include <sys/types.h>
#include <sys/stat.h>

int mkfifo(const char *pathname, mode_t mode);

#include <fcntl.h>           /* Definition of AT_* constants */
#include <sys/stat.h>

int mkfifoat(int dirfd, const char *pathname, mode_t mode);
```

创建完成后：

* 使用 [`stat(2) 系统调用`](https://man7.org/linux/man-pages/man2/lstat.2.html)，使用 `S_IFIFO` 判断是否是 FIFO 文件。
* 使用 [`open(2)` 系统调用](https://man7.org/linux/man-pages/man2/open.2.html)，即可打开一个 FIFO 文件。
    * `O_RDONLY` 打开该 FIFO 的读端点
    * `O_WRONLY` 打开该 FIFO 的写断点
    * `O_NONBLOCK` 是否阻塞
        * 如果未设置 `O_NONBLOCK`，`O_RDONLY` 要阻塞到有进程使用 `O_WRONLY` 打开的时候返回。
        * 如果设置了 `O_NONBLOCK`，`O_RDONLY` 要会立即返回，如果没有写入进程，则返回 -1，errno 设置为 `ENXIO`。
* 使用 [`write(2) 系统调用`](https://man7.org/linux/man-pages/man2/write.2.html) 写入一个 fifo 文件描述符时，类似与管道。如果没有进程打开该 fifo 文件的读断点(`O_RDONLY`)，将触发 `SIGPIPE` 信号，该信号的默认处理器为终止进程。如果处理了该信号，则写端将返回 `-1`，并且设置 `errno` 为 `EPIPE`。
* 使用 [`read(2) 系统调用`](https://man7.org/linux/man-pages/man2/read.2.html) 读取一个 fifo 文件描述符时，类似与管道。如果没有进程打开该 fifo 文件的写断点(`O_WRONLY`)，读端将将返回 `0` 表示文件结束（不是 `-1`，`-1` 表示错误）。

在 shell 中

* 可以通过 [`mkfifo(1) 系统命令`](https://man7.org/linux/man-pages/man1/mkfifo.1.html) 直接在文件系统中创建一个 fifo 文件。
* 可以通过 `| tee fifo文件`，`<fifo文件`，`>fifo文件` 重定向和管道符读写 fifo 文件，来以有向无环图的方式串联多个标准 IO 处理程序，并不产生任何磁盘数据。

如 `apue` 书上的一个例子

```bash
mkfifo fifo1
prog3 < fifo1 &
prog1 < infile | tee fifo1 | prog2
```

在这个例子中，任务 DAG 为：

```
                                        ---(fifo1)--> prog3
                                       |
infile ----(pipe)---> prog1 ---(tee)---
                                       |
                                        ---(pipe)---> prog2
```
