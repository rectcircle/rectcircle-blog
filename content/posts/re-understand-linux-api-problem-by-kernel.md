---
title: "【不定期更新】从内核角度重新理解 Linux API 常见问题"
date: 2022-03-13T00:52:49+08:00
draft: true
toc: true
comments: true
tags:
  - untagged
---

## 说明

* API 指的是什么？
* 阐述用户态和内核态？（程序和库的关系）
* 本文深度到什么层次？（内核数据结构层面，不多涉及实现）

## 文件描述符

从 PCB 看

https://zhuanlan.zhihu.com/p/34280875

https://linux.fasionchan.com/zh_CN/latest/system-programming/file-io/file-descriptor.html

### 原理

### 涉及问题解释

#### Linux 一切皆文件

#### Linux 网络编程多进程模式原理

#### Linux Socketpair 原理

https://man7.org/linux/man-pages/man2/socketpair.2.html

#### Nodejs Process IPC 原理

https://www.imyangyong.com/blog/2019/09/node/Node%E5%A4%9A%E8%BF%9B%E7%A8%8B%E6%9E%B6%E6%9E%84%E7%9A%84%E5%8E%9F%E7%90%86/#%E5%88%9B%E5%BB%BA%E5%AD%90%E8%BF%9B%E7%A8%8B

https://stackoverflow.com/questions/57538850/how-node-ipc-works-between-2-processes

#### 父子进程共享文件描述符的偏移量

#### 标准输入输出重定向原理

（dup2）
