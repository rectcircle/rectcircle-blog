---
title: "容器核心技术（一） 实验环境准备 & Linux 基础知识"
date: 2022-02-11T20:17:40+08:00
draft: false
toc: true
comments: true
tags:
  - 云原生
---

## 实验环境准备

为了更好的实验容器核心技术，通过虚拟机（VirtualBox）安装一个纯净的 Linux 系统环境（Debian 11）。

* 下载安装 [VirtualBox](https://www.virtualbox.org/)，（Mac 安装或更新后，需打开系统偏好设置 -> 安全 -> 安全性与隐私，解锁并重启）
* 下载 [Debian 11](https://www.debian.org/) ISO 镜像
* VirtualBox 最小化安装 Debian 11
    * 点击新建（名称：Debian11-base，类型：Linux，版本：Debian），一路 Next 即可
    * 配置网络，让宿主机可以访问虚拟机
        * 工具右侧图标 -> 网络 -> 创建 -> 启用 DHCP -> 引用
        * Debian11-base -> 设置 -> 网络 -> 网卡 2 -> 启用（连接方式：Host Only，界面名称：上一步创建的） -> OK
    * 点击设置 -> 存储 -> 没有盘片 -> 分配光驱旁边的光盘 -> 选择虚拟盘，选择上一步下载好的 Debian 11 -> OK
    * 点击启动，进入[系统安装](https://www.debian.org/releases/stable/amd64/ch06s03.zh-cn.html)，注意：
        * 语言时区等可以选择中文
        * 配置网络：选择 `enpo0s3` 作为主网络
        * 磁盘默认即可（最后一步确认，选择是）
        * apt 源可以选择华为云
        * 选择并安装软件下载步骤可能很慢，要花费 30 分钟左右（解决办法可以参考：[B 站视频](https://www.bilibili.com/video/av74615315/)）
        * 选择和安装软件：桌面环境不需要安装，只需选择，SSH Server 和 标准系统工具
* 配置虚拟机系统内部网络
    * 登录到 root 账号
    * 执行如下命令

    ```bash
    echo 'auto enpo0s8' >> /etc/network/interfaces
    echo 'iface enpo0s8 inet dhcp' >> /etc/network/interfaces
    systemctl restart networking
    if a # 查看 IP 是 192.168.56.xxx
    ```

* 宿主机执行 `ssh 普通用户名@192.168.56.xxx` 输入密码登录
* 安装必备环境（常见命令以及 C 和 Golang 开发环境）

    ```
    su root
    apt install sudo wget curl
    echo '普通用户名 ALL=(ALL) NOPASSWD:ALL' /etc/sudoers.d/myuser
    apt install build-essential gdb
    wget https://go.dev/dl/go1.17.7.linux-amd64.tar.gz
    tar -zxvf go1.17.7.linux-amd64.tar.gz -C /usr/local/
    echo 'export GOROOT=/usr/local/go' >> /etc/profile
    echo 'export PATH=/usr/local/go/bin:$PATH' >> /etc/profile
    ```

* 查看 系统版本（内核、gcc、glibc、go）
    * 内核版本 `uname -r`： `5.10.0-11-amd64`
    * gcc 版本 `gcc -v`： `gcc version 10.2.1 20210110 (Debian 10.2.1-6) `
    * glibc 版本 `ldd --version`：`ldd (Debian GLIBC 2.31-13+deb11u2) 2.31`
* 停止虚拟机 Debian11-base，复制一份 `Debian11-exp01` 来做实验，防止把环境搞坏了还要重新从头安装

## 系统调用、库函数和工具

学习 Linux 可以分两个比较独立的两个层面，其一 Linux 内核层，其二 Linux 应用层。本系列仅涉及 Linux 应用层相关内容。

Linux 是一个操作系统平台，其在应用层提供了多种能力，从底层到上层分别为：

* [系统调用](https://man7.org/linux/man-pages/dir_section_2.html)（有限数量，约 500 左右）。这些系统调用太过于底层，调用时，需要使用汇编设置寄存器的方式调用。在 Linux 的 [man 文档](https://man7.org/linux/man-pages/index.html)中，其描述方式也是通过 glibc 的包装函数描述的
* 库函数（各种编程语言不同，同一种编程语言也有不同的实现）
    * 其中 [C 语言的库函数](https://man7.org/linux/man-pages/dir_section_3.html) 是最常见的，C 语言的库函数称为 [libc](https://man7.org/linux/man-pages/man7/libc.7.html) （standard C library），Linux 上的 libc 实现有多种，主流的有：
        * [glibc](http://www.gnu.org/software/libc/) （文件名为：`libc.so.6`） 最广泛使用的大而全的 libc 实现， 主流的生产环境 Linux 发行版多数使用该版本，如 Debian 系、Red Hat 系。主要包含如下 API
            * Linux 系统调用的包装
            * 常见 Unix API：BSD， OS-specific
            * 各种 C 语言国际标准的实现：[ISO C11](https://en.wikipedia.org/wiki/C11_(C_standard_revision)), [POSIX.1-2008（可移植操作系统接口）](https://en.wikipedia.org/wiki/POSIX), [IEEE 754-2008（浮点数）](https://en.wikipedia.org/wiki/IEEE_754-2008_revision)
        * [musl libc](http://musl.libc.org/) 轻量级库，在容器环境广泛使用，使用该 libc 的发行版有 [Alpine Linux](https://zh.wikipedia.org/wiki/Alpine_Linux)
    * 其他高级语言的标准库一般也会有对操作系统系统调用进行封装，但高级语言更在乎抽象和跨平台能力，一般只会封装多个操作系统都存在的部分，而不是只针对 Linux。
* [命令](https://man7.org/linux/man-pages/dir_section_1.html)，`*nix` 类操作系统，一般都会提供常用的命令行工具。这些命令行工具，可以由任意编程语言编写，一般都会通过对库函数的调用来实现某些特殊功能。

以上这些，系统调用是最稳定的，是 Linux 的本质。而库函数是经过封装的，且不同编程语言的封装方式，用法还不一样。因此作为 Linux 应用层的学习者，最应该重视应该是系统调用。

作为 Linux 应用层学习者，应该自发的将学习的知识划分到以上三种层次的一个层次中，然后联系相关其他层的知识，构建一张完备的知识网络。

下面有个关于 Linux 创建一个新进程并绑定 [Namespace](https://man7.org/linux/man-pages/man7/namespaces.7.html) 相关：

* [clone 系统调用](https://man7.org/linux/man-pages/man2/clone.2.html)
* Go 语言的 [exec.Command](https://pkg.go.dev/os/exec#Command) 和 [syscall.SysProAttr 的 Cloneflags](https://pkg.go.dev/syscall#SysProcAttr) 相关库函数 （glibc 库函数 clone 和系统调用 clone 是同一篇文档，不便于展示区别，因此使用 Go 语言）
* [unshare 命令](https://man7.org/linux/man-pages/man1/unshare.1.html)

Linux 的文档非常丰富，且组织良好。通过 [man 站点](https://man7.org/linux/man-pages/index.html)可以查看最权威详实的文档。

## Linux 创建进程

在 Linux 中，创建进程众所周知的就是 `fork` 函数。实际上，创建进程的库函数有：

* [`fork` 函数](https://man7.org/linux/man-pages/man2/fork.2.html)：通过复制当前进程的方式，创建一个新进程，返回新进程的进程 ID，父进程返回 0。[注意](https://man7.org/linux/man-pages/man2/fork.2.html#NOTES)：
    * 页表会进行全量复制，内存写时复制。
    * Linux kernel 2.3.3 之前，fork 是一个系统调用包装
    * Linux kernel 2.3.3 之后，fork 只是一个 glibc 的库函数，最终调用 `clone` 系统调用（使用 `SIGCHLD` 标志）
* [`vfork` 函数](https://man7.org/linux/man-pages/man2/vfork.2.html)：类似于 `fork` 性能略优于 `fork`，不会复制页表。编写跨 Unix 平台程序时，不建议使用。[注意](https://man7.org/linux/man-pages/man2/vfork.2.html)：
    * 不会复制页表，因此新进程不应该修改内存而是直接调用 `exec` 相关函数
    * 在 Linux 中 `vfork` 不是一个系统调用，只是一个 glibc 的库函数，最终调用 `clone` 系统调用（使用 `CLONE_VM | CLONE_VFORK | SIGCHLD` 标志）
* [`clone` 函数](https://man7.org/linux/man-pages/man2/clone.2.html)：创建一个新进程（线程），与 `fork` 和 `vfork` 相比：
    * 可以更精确的控制，哪些执行上下文在之间共享，可以做到 `fork`、`vfork`、`pthread_create` 类似的效果
    * 可以控制进程的**Namespace**（容器的核心技术）
    需要注意的是：
    * [`clone` 函数](https://man7.org/linux/man-pages/man2/clone.2.html) 是一个 glibc 函数，其也是 `clone` 系统调用的封装。
    * `clone` 系统调用本身并不接受一个函数指针作为参数，其真实声明类似于，`long clone(unsigned long flags, void *child_stack, void *ptid, void *ctid, struct pt_regs *regs);`，参见：[stackoverflow](https://stackoverflow.com/a/18904917)。
    * 在 Linux 5.3 之后，[`clone` 函数](https://man7.org/linux/man-pages/man2/clone.2.html#VERSIONS) 开始使用 clone3 系统调用
    * 编写跨 Unix 平台程序时，不建议使用。

## Linux 文件系统

关于 Linux 的文件系统，众所周知的有：一切皆文件的理念，以及 ext2，ext4 这些文件系统。

从设计角度来看，Linux 文件系统的遵循插件化/面向接口的原则，Linux 定义了两套接口：

* 面向 Linux 使用者的，一切皆文件的，文件/目录树操作的系统调用。比如：打开文件 `open`，查看路径状态 `stat` 等
* 面向 Linux 开发者的，VFS （Virtual File System，虚拟文件系统）。上面提到的 ext2、ext4 以及网络文件系统 ceph、联合文件系统 overlay2 等都是 VFS 的一种实现。在实现上，开发者只需要实现有限几个函数，并编译成一个 Linux 模块，并插入到内核中即可为 Linux 添加一种新的 VFS 的实现。简单的实现参见：[博客 1](https://blog.csdn.net/qq_35536179/article/details/109013447) | [博客 2](https://blog.csdn.net/dog250/article/details/100099936)
