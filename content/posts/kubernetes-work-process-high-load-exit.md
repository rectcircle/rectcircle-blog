---
title: "Kubernetes 工作进程高负载退出场景"
date: 2023-05-28T21:40:00+08:00
draft: true
toc: true
comments: true
tags:
  - untagged
---

## 概述

在 Kubernetes 中，高负载可以分为高 CPU 占用和高内存占用，而 CPU 属于可压缩资源，因此 CPU 占用高并不会影响工作进程的稳定性，而内存属于不可压缩资源，高内存占用可能导致工作进程重启的问题。因此本文不讨论高 CPU 占用的问题，只讨论内存占用高的问题。

## 实验

> 测试代码库： TODO

### 设计

本文将构造如下 pod：

* 包含两个 container：c1 和 c2。
* c1 是主容器，包含2个进程 p1 和 p2，p1 为 1 号进程。该容器的内存资源规格为：
    * request: 1g
    * limit: 2g
* c2 是 sidecar 容器，包含 1 个进程 p3。
    * request: 0.25g
    * limit: 0.5g

### 准备环境

使用 k3s 搭建一个单节点的测试 Kubernetes。

参见：[扩展 Kubernetes （一） k3s 测试环境搭建](/posts/extend-kubenates-01-k3s-testing-env/)。

### 测试程序

该程序接收一个命令行参数，为申请占用的内存大小 （单位 MB）。程序启动后，先睡眠 10 秒钟，然后开始申请并使用内存，然后进入永久睡眠。

```c
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>

const size_t MB = 1024 * 1024;

int main(int argc, char *argv[]) {
    if (argc != 2) {
        printf("usage: %s <alloc memory size mb>\n", argv[0]);
        return 1;
    }
    size_t allocSize = atoi(argv[1]) * MB;
    if (allocSize == 0) {
        printf("error: alloc memory size mb must greate than 0\n");
        return 1;
    }
    // 睡眠 10 秒再申请内存
    sleep(10);
    // 申请内存 （VSZ）
    char *m = (char *)malloc(allocSize * sizeof(char));
    if (m == NULL) {
        printf("error: alloc %dMB size memory failed\n", allocSize / MB);
        return 1;
    }
    // 使用内存 （RSS）
    for (size_t i = 0; i < allocSize; i++) {
        m[i] = i % 256;
    }
    while(1) {
        sleep(1);
    }
}
```

静态编译。

```bash
gcc -static mem-alloc.c -o mem-alloc
```

验证。

```bash
./mem-alloc 100 # shell 1
# 等待 10 秒执行
ps aux | grep mem-alloc | grep -v grep # shell 2
# 输出第 6 列为内存占用，单位为  KB
# rectcir+  430460  0.6  0.6 103428 103108 pts/1   S+   23:06   0:00 ./mem-alloc 100
```

### 场景1：node 空闲但 c1 内存超过 limit

* 常规 runc
    * 分场景
        * p1 > p2 oom kill p1，containerd 重启：p1、p2 均重启。退出码/信号多少？
        * p1 < p2 oom kill p2，p1 仍运行。退出码/信号多少？
    * pod 无异常（ip 不会变化、数据不丢失）。c2 仍运行。

### 场景2：node 负载高发生驱逐
