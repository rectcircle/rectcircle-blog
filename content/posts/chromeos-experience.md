---
title: "ChromeOS 体验 (FydeOS)"
date: 2022-07-10T00:31:38+08:00
draft: false
toc: true
comments: true
tags:
  - untagged
---

## 概述

作为一名开发人员，一直关注各种桌面级/移动级操作系统的进展，其中就包含 ChromeOS。

对于一个开发者（客户端、嵌入式、硬件开发者除外）而言，对于操作系统的要求如下：

* 流畅、稳定而现代化的系统 UI。
* 完整的 Linux 环境。
* 好用的浏览器。
* 丰富的开发者和娱乐软件生态。

对于这三个要求，ChromeOS，都可以比较完美的支持：

* ChromeOS 是后发的桌面级操作系统，它的 UI 是现代化的。在诞生之处，ChromeOS 目标是可以在廉价的设备上流畅运行，因此流畅度没有问题。最后，ChromeOS 内核基于 Linux，且系统相对封闭，在专用设备上稳定性应该有所保证（FydeOS for PC 这种无法面向一大类机器的发行版，无法保证稳定性）。
* ChromeOS 系统层面，通过虚拟机技术，提供了具有独立内核的 Linux 子系统。
* ChromeOS 就是对 Chrome 浏览器的操作系统化的产品，浏览器的体验毋庸置疑。
* ChromeOS 可以在 Linux 子系统中安装 Linux GUI 程序，因此可以直接安装如 VSCode、Jetbrains 等 IDE，开发者软件生态丰富。
* ChromeOS 系统层面，通过 Linux 容器化技术，提供了 Android 运行环境，可以安装和运行安卓 App，具有了 Android 应用生态。

在国内，有一家厂商燧炻创新发行的 ChromeOS 的国内适配版: FydeOS。

在过去的几年中，也曾经尝试几次在一台闲置的 x86 设备上，安装过几次 FydeOS，但是总是有一些严重的问题，比如：wifi 连不上，安卓运行时初始化失败、Linux 子系统初始化失败等。

这两天，又一次尝试安装 FydeOS，发现这个版本，可以完美的支持这台设备。于是，探索了下 ChromeOS 提供的核心能力的技术原理，就有了这篇文章。

注：本文的的内容和结论，基于在一台古早的 x86 设备上安装的 FydeOS 系统上进行的探索和实验，并结合网络上 Chrome OS 的相关技术文档而得到。

## 设备信息

这台是一个台 15.6 寸的笔记本电脑（[海尔 s500](https://www.haier.com/computers/bjb/20140321_92434.shtml)），购置于 2015 年 9 月左右，当时京东购机价为 3599 元左右，基本参数如下：

* 内存: 8G DDR3L 内存（原机 4G、后扩展到 8G）
* CPU: 英特尔 酷睿i5 4代系列, [i5-4210M](https://www.intel.cn/content/www/cn/zh/products/sku/81012/intel-core-i54210m-processor-3m-cache-up-to-3-20-ghz/specifications.html)
* 磁盘: 1TB 5400 转 SATA 机械硬盘
* WIFI: 802.11bgn (仅支持 2.4 Ghz)
* 蓝牙: 本机无，后购置了一个外置 USB 免驱蓝牙 ([jd](https://item.jd.com/100026235324.html))

## 系统版本和安装

本次安装 ChromeOS 版本为，燧炻创新发布的 [FydeOS for PC - Intel 酷睿系列第三代至第八代处理器及 Intel HD 系列核心显卡](https://fydeos.com/download/pc/intel-hd)，具体版本信息为:

* 版本号: 14.2-SP1 ([更新日志](https://fydeos.com/release/14.2-SP1/amd64-fydeos))
* 发布日期: 2022-05-31
* HASH(sha256): 8066c8e08129bd85838c00b5c96fb12a192b87e668657ca73634ecbf763ee8d2

安装方式基本上是傻瓜式的，非常简单，参见：[首次运行 FydeOS for PC](https://fydeos.com/help/knowledge-base/getting-started/fydeos-for-pc) 文档。

Chromium 版本为（进入系统后查看）： 96.0.4664.208

## 开发环境搭建

首先，在设置 -> 高级 -> 开发者 -> Linux 开发环境 中启用 Linux 开发环境。

### 安装 IDE (以 VSCode 为例)

* 打开 [VSCode 下载页面](https://code.visualstudio.com/#alt-downloads)，下载 .deb 包。
* 打开 文件，我的文件 -> 下载内容，右击 通过 Linux 安装。

稍等片刻，即可安装完成。安装完成后可以直接在启动器 Linux 应用中看到图标。点击即可打开。

### 配置中文和字体

> 参考：[安装 Android 应用、配置 Linux 环境：FydeOS 进阶使用教程](https://sspai.com/post/56234)

首先是设置时区，在终端中输入：

```bash
sudo dpkg-reconfigure tzdata
# 选择亚洲 (Asia), 上海 (Shanghai)
```

安装中文字体：

```bash
sudo apt install fonts-wqy-microhei fonts-wqy-zenhei
```

配置字符集为 `zh_CN.uft8`：

```bash
sudo dpkg-reconfigure locales
```

字符集配置完成完成后需重启生效：

```bash
sudo reboot
```

### 安装可视化包管理器

> 参考：[ChromeOS Linux setup](https://chromeos.dev/en/linux/setup#visual-package-management)

```bash
sudo apt install -y gnome-software gnome-packagekit && \
sudo apt update
```

### 安装中文输入法

Linux 子系统中是无法使用 ChromeOS 的输入法的，因此需要在 Linux 子系统中安装中文输入法。

具体步骤参见：[FydeOS 知识库](https://fydeos.com/help/knowledge-base/linux-subsystem/chinese-ime-in-linux-subsystem) 。

注意：

* 上文做 3.1 之前，需要先执行 fcitx 命令。
* 可以选择安装搜狗输入法：https://shurufa.sogou.com/linux 下载下来，然后在 Linux 子系统中通过 `sudo dpkg -i xxx.deb` 来安装
* 可以选择安装 Google 拼音输入法，在 Linux 子系统中通过 `sudo apt install fcitx-googlepinyin` 来安装（需重启才能配置）。

### VPN 和 网络代理

ChromeOS 和 Android 是深度集成的。ChromeOS 可以使用 Android 代理 App 提供的代理作为整个系统的全局 VPN。也就是说 ChromeOS 的浏览器、Android App、Linux 子系统都会走 Android App 的代理。

打开一个 Android 代理 App 后，在 ChromeOS 的网络设置里面，可以看到该 VPN 已经生效了。

### 小提示

至此，即可在 Linux 子系统中开发应用程序了，此外还有一些小提示：

* Linux 子系统的文件共享和 ChromeOS 的文件共享，参见下文：[Linux 子系统分析](#linux-子系统分析)
* 开发调试 Android App，参见 FydeOS 官方文档： [在 FydeOS 下开发调试安卓程序指北](https://fydeos.com/help/knowledge-base/linux-subsystem/android-development-guide-with-fydeos)

## Chrome OS 浅析

### crosh

通过 ctrl + shift + t 可以进入 crosh (The Chromium OS shell) 终端，详细手册参见： [Chromium crosh README](https://chromium.googlesource.com/chromiumos/platform2/+/HEAD/crosh/README.md)。

通过 `help` 和 `help_advanced` 命令可以查看 crosh 支持的命令列表（如 `free` 查看内存）。

这里通过 `shell` 命令，可以打开一个 bash 终端，这个终端运行在 ChromeOS 所在 Linux 内核中，用户为 chronos。

chronos 用户就是 ChromeOS 运行 Chrome 的用户。在 FydeOS 中，[chronos 用户没有设置密码](https://fydeos.com/help/faq#what-is-the-account-and-password-used-to-log-in-to-the-command-line)，而且可拥有 sudo root 的权限（相当于 Android 系统 root 了），这给我们很大的自定义空间，后文将介绍这一点。

相关命令如下（下文命令均在该 shell 中执行）：

```bash
# ctrl + shift + t
shell
su su root
```

### 内核版本

执行 `uname -a` 输出如下：

```
Linux localhost 5.4.188-16917-g3358c5a3654f-dirty #2 SMP PREEMPT Thu May 26 15:47:47 CST 2022 x86_64 Intel(R) Core(TM) i5-4210M CPU @ 2.60GHz GenuineIntel GNU/Linux
```

可以看出 Linux 内核版本为 5.4。

### init 进程选型

执行 `stat /proc/1/exe` 输出如下：

```
  File: /proc/1/exe -> /sbin/init
  Size: 0               Blocks: 0          IO Block: 1024   symbolic link
Device: 5h/5d   Inode: 783097      Links: 1
Access: (0777/lrwxrwxrwx)  Uid: (    0/    root)   Gid: (    0/    root)
Context: u:r:cros_init:s0
Access: 2022-07-10 01:21:29.404407129 -0700
Modify: 2022-07-10 01:21:19.401406853 -0700
Change: 2022-07-10 01:21:19.401406853 -0700
 Birth: -
```

执行 `/sbin/init` 输出如下：

```
Usage: init [OPTION]...
Process management daemon.

Options:
  -q, --quiet                 reduce output to errors only
  -v, --verbose               increase output to include informational messages
      --help                  display this help and exit
      --version               output version information and exit

This daemon is normally executed by the kernel and given process id 1 to denote its special status.  When executed by a user process, it
will actually run /sbin/telinit.

Report bugs to <upstart-devel@lists.ubuntu.com>
```

可以看出 ChromeOS 的 init 进程为： [upstart](https://en.wikipedia.org/wiki/Upstart)。经过搜索，可以找到：[ChromeOS 的 boot 设计文档](https://www.chromium.org/chromium-os/chromiumos-design-docs/boot-design/)，该文档中确定了 ChromeOS 的 init 进程为 upstart。

知道了 init 是 upstart，我们就可以通过在 `/etc/init` 目录里面添加自定义的开启自启配置文件，即可做到在 ChromeOS 的所在的内核，开机自动运行一些进程/服务（下文有介绍）。

### libc 库选型

执行 `/lib64/libc.so.6` 输出如下：

```
GNU C Library (Gentoo 2.32-r17 p8) stable release version 2.32.
Copyright (C) 2020 Free Software Foundation, Inc.
This is free software; see the source for copying conditions.
There is NO warranty; not even for MERCHANTABILITY or FITNESS FOR A
PARTICULAR PURPOSE.
Compiled by GNU CC version 10.2.0.
libc ABIs: UNIQUE IFUNC ABSOLUTE
For bug reporting instructions, please see:
<http://crbug.com/new>.
```

可以看出 ChromeOS 采用的 libc 为 Linux 标准的 glibc，版本为 2.32。这篇[文档](https://chromium.googlesource.com/chromiumos/third_party/glibc/+/chromeos-2.15/FAQ)介绍了 ChromeOS 编译 glibc 的 FAQ，印证了 ChromeOS 使用 libc 版本为 glibc。

> 不同的 libc 可能是相互不兼容，确认 ChromeOS 使用的是标准的 glibc，那么直接在 ChromeOS 所在内核运行程序的难度将会大大降低，因为 Linux 上主流的 C/C++ 编写的程序多数是首选兼容 glibc 的。

### 文件管理

在 ChromeOS 文件 APP 只能看到有限的一些目录，主要是我的文件目录。该目录 ChromeOS 所在内核文件系统的哪里呢？经过查找，发现位于 `/home/chronos/user/MyFiles` 路径下。

### Linux 子系统分析

> 首先在 设置 -> 高级 -> 开发者 中开启 Linux 开发环境。

经过检索，可以发现 ChromeOS 开发了一个半虚拟化的软件 [crosvm](https://chromium.googlesource.com/chromiumos/platform/crosvm/) 来运行 Linux 子系统内核。

通过 `ps aux | grep crosvm` 可以看出运行了很多 crosvm 相关的进程。

下面介绍一下 Linux 子系统和 ChromeOS 文件共享的机制。

**将 Chrome OS 的文件共享到 Linux 子系统中**

* 在 ChromeOS 的文件 APP 中，右击 我的文件 ，选择 `与 Linux 共享`。
* 此时即可在 Linux 子系统中，在 `/mnt/chromeos/MyFiles` 目录中看到，Downloads 等目录。该目录是有读写权限的。

**读取 Linux 子系统 `$HOME` 目录**

* 在 ChromeOS 的文件 APP 中，可以看到：`我的文件 > Linux 文件`，通过这个目录可以访问 Linux 子系统中的 `$HOME` 目录。
* 在 ChromeOS 的 shell 中，如何访问该目录呢？
    * 通过 `mount | grep linux` 查看，输出如下

        ```
        fuse:sshfs://rectcircle@penguin.termina.linux.test: on /media/fuse/crostini_ba1970ad840cb1d1a3344784b0d0cc65044919aa_termina_penguin type fuse.sshfs (rw,nosuid,nodev,noexec,relatime,nosymfollow,dirsync,user_id=1000,group_id=1001,default_permissions,allow_other)
        ```

    * 输出的第二行，可以该目录是通过 sshfs 的方式挂载到的了 ChromeOS 的 `/media/fuse/crostini_ba1970ad840cb1d1a3344784b0d0cc65044919aa_termina_penguin` 路径下。
    * 该目录是有完整的读写权限的。也就是说，也可以通过该目录来实现共享。

### Android 运行环境分析

执行 `ps aux | grep android` 部分输出如下：

```
656362   19537  0.0  1.3 3280440 106868 ?      Sl   Jul09   0:00 com.android.bluetooth
665415   19543  0.0  1.6 3306188 135056 ?      Sl   Jul09   0:00 com.android.systemui
665412   19811  0.0  2.2 3340244 180320 ?      S<l  Jul09   0:01 com.android.documentsui
656428   19907  0.0  0.9 3254256 80592 ?       Sl   Jul09   0:00 com.android.se
665400   19978  0.0  1.0 3255944 85372 ?       Sl   Jul09   0:00 com.android.externalstorage
665370   19992  0.0  1.0 3265500 84240 ?       Sl   Jul09   0:00 com.android.printspooler
665366   20000  0.0  1.2 3263232 100612 ?      Sl   Jul09   0:00 com.google.android.deskclock
665394   20066  0.0  1.1 3255888 91116 ?       Sl   Jul09   0:00 android.process.media
665406   20143  0.0  1.1 3253692 92172 ?       Sl   Jul09   0:00 com.android.providers.calendar
665375   20319  0.0  1.5 1197284 124264 ?      Sl   Jul09   0:00 com.google.android.tts
665402   20507  0.0  0.9 3255064 79792 ?       Sl   Jul09   0:00 com.google.android.ext.services
```

可以看出 Android 的进程在 ChromeOS 内核中，是可以直接列出的，因此基本可以确定 ChromeOS 的安卓运行时是通过 Linux 容器技术 来运行的（和 Docker 容器所依赖的 Linux 容器技术一致，即 Namespace 和 CGroup）。即：目前 FydeOS 使用的安卓运行时是基于 ARC++ 的 Android 9 版本。

ChromeOS 已经[转向的基于 VM 的 ARCVM 方案](https://chromeos.dev/en/posts/making-android-more-secure-with-arcvm)，其安全性更高，Android 部分和 ChromeOS 的耦合将变低，但是性能会有损失，本文将不多介绍，关于 FydeOS 考虑参见：[社区](https://community.fydeos.com/t/topic/15374)。

ARC 相关技术可以阅读博客：[Chrome OS上的Android系统](https://paul.pub/android-on-chrome-os/#id-arc-%E9%A1%B9%E7%9B%AE)

下面介绍安卓运行时和 ChromeOS 文件共享的机制。

* ChromeOS 文件 App，我的文件 -> 安卓文件，在安卓系统看来，位于 `/storage/emulated/0/Android`。
* Android 文件系统的  `/storage/emulated/0/Download` 实际上就是 ChromeOS 的 `/home/chronos/user/MyFiles/Downloads`。
* 通过 `mount | grep android` 可以看出 Android 文件系统根路径位于 ChromeOS 的 `/opt/google/containers/android/rootfs/root`
* 通过 `mount | grep android` 可以看出 Android 文件系统的  `/storage/emulated/0`  位于 ChromeOS 的 `/run/arc/sdcard/default/emulated/0`

### 总结

既封闭又开放。

* 封闭指的是：虽然基于 Linux 内核，但是没有暴露 Linux 内核 API，也没有提供专用的系统级 API。而是 GUI 应用完全基于 Web API 仅能优先的使用操作系统资源。这保证流畅性和稳定性。
* 开放指的是：
    * 通过 Android App 可以运行 Android App: Android 运行时和 ChromeOS 共用内核，通过 Linux 容器化技术（无虚拟化损失），可以兼顾性能和一定的安全性。
    * 通过 Linux 子系统可以运行 Linux App（包括 GUI）: Linux 子系统是面向开发者的，采用虚拟化技术，损失的一点性能，满足了对开发者对灵活性的要求（拥有完整的内核权限），同时保证了 ChromeOS 的稳定性和安全性。

## 在 ChromeOS 所在 Linux 环境运行 Linux 程序

可以用下图来总结下上文分析的 ChromeOS 整体架构（逻辑上，仅供参考）。

```

+----------------------------------------------------+------------------------------------+-----------------------------------------------------+
|                   Android App                      |     Web Page, Extension, PWA       |               Linux Process (GUI App)               |
+------------------------------+---------------------+------------------------------------+-----------------------+-----------------------------+
|                              |                     |              Chrome                |                       |                             |
+  ARC++ (namespace & cgroup)  |                     +------------------------------------+                       | crosvm (Guest Linux Kernel) |
|                              |                                 GUI FrameWork                                    |                             |
+------------------------------+----------------------------------------------------------------------------------+-----------------------------+
|                                                        Linux Kernel & Hardware Driver                                                         |
+-----------------------------------------------------------------------------------------------------------------------------------------------+

```

某些时候，我们可能需要直接在 ChromeOS 所在的 Linux 环境运行一些 Linux 程序（注意：不是 Linux 子系统）。

在本例中，我们会在 ChromeOS 中安装以一个罗技 k380 的程序，该程序会在该蓝牙键盘连接到设备后，恢复 F (F1~F12) 键为标准功能（ k380 这个蓝牙键盘，默认的 F 键是一些快捷键，比如 F12 是减小音量，这对于开发者非常难受）。

在 Windows 和 Mac 上，可以通过官方 Logi Option App 来配置。但是在 Linux 中，可以通过开源项目实现该效果，源码地址为： [jergusg/k380-function-keys-conf](https://github.com/jergusg/k380-function-keys-conf)。既然该开源项目可以在常规的 Linux 中运行，那么应该也可以在 ChromeOS 所在的 Linux 环境中运行。

### 编译

常规 Linux 开源项目编译环境一般都是主流的 Linux 发行版（Debian / Red Hat），因此对 [jergusg/k380-function-keys-conf](https://github.com/jergusg/k380-function-keys-conf) 的编译，需要在 ChromeOS 的 Linux 子系统中编译。

进入 Linux 子系统，执行如下命令，clone 代码，安装编译工具，编译安装到 Linux 子系统：

```bash
git clone https://github.com/jergusg/k380-function-keys-conf.git
cd k380-function-keys-conf
# 目前 Linux 子系统的版本为 Debian 11
sudo apt install build-essential
sudo make install
```

### 安装

观察 Makefile（`cat Makefile`）其中安装部分的内容如下：

```
CC = gcc
PREFIX = /usr/local
BINDIR = $(DESTDIR)$(PREFIX)/bin
UDEVDIR = $(DESTDIR)/etc/udev/rules.d

install: k380_conf
        install -d $(BINDIR)
        install k380_conf fn_on.sh $(BINDIR)
        install -d $(UDEVDIR)
        echo "ACTION==\"add\", KERNEL==\"hidraw[0-9]*\", RUN+=\"$(BINDIR)/fn_on.sh /dev/%k\"" > $(UDEVDIR)/80-k380.rules
```

可以看出，安装如下文件：

* /usr/local/bin/k380_conf
* /usr/local/bin/fn_on.sh
* /etc/udev/rules.d/80-k380.rules

在 Linux 子系统的终端中，将这些文件复制到 Download 目录中：

```bash
sudo mv /usr/local/bin/k380_conf /usr/local/bin/fn_on.sh /etc/udev/rules.d/80-k380.rules /mnt/chromeos/MyFiles/Downloads
# 会输出 failed to preserve ownership 可以忽略
```

ctrl + shift + t 打开 ChromeOS 的终端，输入 `shell`，将刚刚复制的，位于 `/home/chronos/user/MyFiles/Downloads` 目录下的文件，复制到 ChromeOS 的目录中：

```bash
sudo mv /home/chronos/user/MyFiles/Downloads/k380_conf /usr/local/bin/k380_conf
sudo mv /home/chronos/user/MyFiles/Downloads/fn_on.sh /usr/local/bin/fn_on.sh
sudo mkdir -p /etc/udev/rules.d
sudo mv /home/chronos/user/MyFiles/Downloads/80-k380.rules /etc/udev/rules.d/80-k380.rules
```

### 运行

仍然在 ChromeOS 的终端中执行：

```bash
fn_on.sh
```

由于配置 `/etc/udev/rules.d/80-k380.rules`，k380 键盘通过连接后，将会自动执行 fn_on.sh 脚本，自动化的配置。

### 开机自启动

本例中，我们不需要配置开机自启，如果需要配置开机自启，只需要在：

* 在 /etc/init 目录下添加配置文件。
* 使用 initctl 命令启动服务。

更多参见：[upstart 官方文档](https://upstart.ubuntu.com/getting-started.html)。

### 总结

如果想在 ChromeOS 所在的 Linux 环境（注意：不是 Linux 子系统）中直接运行（或开机启动）一个程序，基本步骤如下：

* 在 Linux 子系统 Clone 代码，并在 Linux 子系统中编译。
* 将 Linux 子系统的产物 Copy 到共享目录，如 `/mnt/chromeos/MyFiles/Downloads`。
* 在 ChromeOS Shell 中，将产物从共享目录（如：`/home/chronos/user/MyFiles/Downloads`）复制到指定目录中。
* （可选）配置开机自启，在 ChromeOS Shell 中：
    * 开机自启配置文件 `/etc/init/xxx.conf`。
    * 通过 initctl 启动服务。

本部分介绍的是手动编译和安装软件到 ChromeOS 所在的 Linux 环境。但是开源届，有一个对 ChromeOS 所在的 Linux 环境进行包管理的命令行工具 [craw](https://chromebrew.github.io/)。通过该工具可以直接在 ChromeOS 所在 Linux 环境安装各种软件包。
