---
title: "终端详解（四）简单实现一个支持作业控制的 Shell"
date: 2025-08-03T16:11:00+08:00
draft:  true
toc: true
comments: true
tags:
  - untagged
---

> 本文源码: [rectcircle/implement-terminal-from-scratch](https://github.com/rectcircle/implement-terminal-from-scratch)

## 了解到哪些问题的答案

* `proc1 &` 为什么还会输入到屏幕中。
* `proc1 &` ssh 断开后，后台任务为什么不在了？
* `nohup` 原理。
* `ctrl+c` 原理。

## 作业控制

* 将 shell 进程作为会话首进程、会话领导者、控制进程、拥有一个控制终端，不需要 shell 程序自己实现，而是由引导程序通过如下方式设置：
    * fork 出进程，如下操作均在子进程中调用
    * 调用 setsid 创建一个会话（同时切断与之前控制终端的联系）。
    * 紧接着调用 `ioctl(slave_fd, TIOCSCTTY, 0)` 将当前进程的控制终端设置为指定的终端设备，同时当前进程所在的会话也会和该终端设备关联（`Terminal Input/Output Control Set Controlling TTY`）。
    * 使用 dup2 系统调用，将当前进程的 stdin stdout stderr 重定向到终端设置文件中。
    * exec 加载 shell 程序。
* shell 进程如何告知控制终端，前台进程组是哪个？
    * 通过 `tcsetpgrp` 系统调用（Terminal Control SET Process GRouP） 设置前台进程组。
    * 不只是 shell 可以调用这个函数，该会话内的所有进程都有权限调用（bash 里面再起一个 bash 的场景的作业控制也就可以实现了）。
* 作业控制信号：
    * 终端收到如下快捷键，内核会发送信号给关联的会话的前台进程组：
        * `ctrl+c` SIGINT 中断信号
        * `ctrl+\` SIGQUIT 退出信号
        * `ctrl+z` SIGSTP 挂起信号 （内核将前台进程组挂起后会向父进程 shell 发送 SIGCHLD 信号，Shell 接收到信号后，会将 shell 设置为前台进程组）
    * pty master 被 close 时，内核会发送 SIGHUP （挂断信号） 给会话内的所有进程。
        * 因此 `&` 后，ssh 断开后，进程会挂掉。
        * 此外，如果会话领导者退出了，内核也会发送 SIGHUP 信号。
* 后台进程组
    * 读取终端（即读 stdin 时），内核会向该进程发送 SIGTTIN 信号。
    * 后台进程组打印的内容会直接打印到屏幕上（因为这些的程的 stdout 和 stderr 进程了父进程的，指向的都是这个终端设备，是同一个设备文件），因此需要 `> output.log 2>&1 &`。
* 作业和管道：
    * 作业是 shell 的概念不是操作系统的概念。
    * 一般由 `|` 连接起来的命令会组成一个 job，一般 job 和进程组一一对应。
* nohup 的原理：通过忽略 SIGHUP 信号实现的，并重定向标准输出，然后 exec 加载这个程序（nohup 进程就是要执行的进程本身）。
* 观测办法：
    * `ps -o pid,ppid,pgid,sid,comm`

## TODO

setpgid 需要父子进程均调用。
