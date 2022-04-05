---
title: "进程管理器（一） Linux 背景知识"
date: 2022-04-05T18:09:52+08:00
draft: true
toc: true
comments: true
tags:
  - untagged
---

## 系列综述

## 本节概述

参考 APUE （Unix 环境高级编程第 3版）和 Linux Manuel 站点。

## 进程关系

（采用问题引出的方式阐述本章）

### 进程生命周期

### 进程树

### 进程和权限

* 超级管理员 root 和 CAP_SYS_ADMIN 权限
* setuid 降权
* 设置用户 id 位提权

（附加组不在讨论范围内）

https://www.jianshu.com/p/be7d77068b44

apue 1.8、4.4 、8.11、9.1

### 进程组

### 会话

### 控制终端和前后台进程组

### 孤儿进程组

## 信号

### 信号概念

#### 信号处理的三种行为

#### 信号处理函数调用

真正的异步性（比多线程还早的一种异步性） 和 函数可重入（并发问题） 和 sleep 问题 和 中断系统调用（自动重启）

### 信号集

### 信号异步处理

#### Signal 函数

不可靠语义，有效一次（早期是这样的）

#### sigaction 函数

* 可靠语义，一直有效
* 可实现异步串行化

### 信号同步处理

* sigwait & sigtimedwait https://pubs.opengroup.org/onlinepubs/009604499/functions/sigwait.html
* sigsuspend

### 信号继承

### 常见信号说明

#### 作业控制信号

## shell 原理

https://github.com/krallin/tini/issues/8

## 备忘

* docker --init
    * https://docs.docker.com/engine/reference/run/#specify-an-init-process
    * /sbin/docker-init
* man signal https://man7.org/linux/man-pages/man7/signal.7.html
    * SIGTTIN
    * SIGTTOU
    * SIGURG docker bug https://docs.docker.com/engine/release-notes/#20107
* 信号处理函数
    * https://man7.org/linux/man-pages/man2/sigaction.2.html
    * https://www.jianshu.com/p/9b8281fe75c5
* 实时信号 https://www.icode9.com/content-3-763729.html
* 信号 mask
    * https://blog.51cto.com/u_1793109/606688
    * https://blog.csdn.net/u010709783/article/details/78390184
    * https://jason--liu.github.io/2019/04/15/use-sigprocmask/
    * https://www.cnblogs.com/my_life/articles/5146192.html
* 查看进程各种 id https://unix.stackexchange.com/questions/82724/ps-arguments-to-display-pid-ppid-pgid-and-sid-collectively
* Go 语言信号处理
    * https://pkg.go.dev/os/signal
    * https://juejin.cn/post/6875097644100763655
    * https://www.hitzhangjie.pro/blog/2021-05-25-go%E7%A8%8B%E5%BA%8F%E4%BF%A1%E5%8F%B7%E5%A4%84%E7%90%86%E8%BF%87%E7%A8%8B/#sigpipe%E4%BF%A1%E5%8F%B7%E5%A4%84%E7%90%86
    * https://books.studygolang.com/The-Golang-Standard-Library-by-Example/chapter16/16.03.html
    * https://golang.design/under-the-hood/zh-cn/part2runtime/ch06sched/signal/
    * CGO
        * https://stackoverflow.com/questions/47869988/how-does-cgo-handle-signals
        * https://github.com/golang/go/issues/7227
* 更改 session 的前台进程 https://man7.org/linux/man-pages/man3/tcgetpgrp.3.html#DESCRIPTION 和 SIGTTOU 信号未忽略，导致的阻塞问题
* Go bug reset 不处理 ignored 信号
    * https://github.com/golang/go/issues/46321
    * https://github.com/golang/go/issues/20479
* Go fork 多线程问题
* Go syscall 和 RawSyscall 区别
    * https://www.cnblogs.com/dream397/p/14301620.html
    * https://stackoverflow.com/questions/16977988/details-of-syscall-rawsyscall-syscall-syscall-in-go
* go unix 库 https://cs.opensource.google/go/x/sys/+/483a9cbc:unix/ioctl.go;l=28
* 终端颜色和环境变量 TERM，LS_COLORS
* 守护进程
    * https://www.kawabangga.com/posts/3849
    * https://www.cnblogs.com/yaodd/p/5558857.html
* Go fork 两种方式之 reexec 方式
    * https://jiajunhuang.com/articles/2018_03_08-golang_fork.md.html
    * https://github.com/moby/moby/blob/master/pkg/reexec/reexec.go
* Go fork 问题 https://stackoverflow.com/questions/28370646/how-do-i-fork-a-go-process
* Go 语言的 tcxx 相关函数实现 https://github.com/snabb/tcxpgrp
* GO 进程收割者 https://gist.github.com/williammartin/eb355f7d387791a9c225361e5d19ea40
* Go exec https://gobyexample.com/execing-processes
* APUE
    * https://blog.csdn.net/qq_41453285/article/details/90484881
    * https://blog.csdn.net/TODD911/article/details/17011259
* 信号继承
    * https://blog.csdn.net/guozhiyingguo/article/details/53837424
    * https://www.freesion.com/article/2325480275/
* Go 设置父进程死亡信号通知 https://gist.github.com/corvuscrypto/cec8255687aa962c3562d0e5c548da37#file-main-go-L52
