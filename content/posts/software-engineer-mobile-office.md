---
title: "移动办公探索（适用于软件开发工程师）"
date: 2021-05-29T16:53:19+08:00
draft: false
toc: true
comments: true
tags:
  - untagged
---

## 目标

* 能通过总重量 < 1000 g 的主设备（目前为平板 / 手机）完成全部的编码开发，即能够安装官方 VSCode （不是 codeserver，原因是希望可以通过 remote ssh 连接到开发机） 和 各种开发环境
* 有全功能的 Linux 开发环境
* 兼顾娱乐和办公
* 可扩展连接各种外接设备（显示器），以获取更好的体验

## Chrome OS 生态

略

## Android 生态

### 设备

（全功能 TypeC 用于实现外接显示器扩展）

* 方案 1：具有全功能 TypeC 的较高性能的安卓手机 + 拓展坞 + 便携式显示器（小米手机全系不支持）
    * [坚果 R2 + TNT Go](https://www.smartisan.com/item/100187101)
* 方案 2：具有全功能 TypeC 的较高性能的安卓平板 + 拓展坞
    * [联想平板小新 Pad Pro 2021](https://item.lenovo.com.cn/product/1014616.html)
* 方案 3（推荐）：具有全功能 TypeC 的普通性能安卓平板 + 高性能安卓手机 + 拓展坞
    * [联想平板小新Pad Plus](https://item.lenovo.com.cn/product/1014618.html) + 任意高性能安卓手机

### 思路

设备可以划分为 2 种角色：

* 计算设备：负责运行 Linux 开发环境，需要较高的性能
* 显示设备：负责通过 VNC 协议连接到计算设备中的 Linux 环境

其他技术参数推荐

* 计算设备：CPU 骁龙 870 以上 + 内存 8g 以上 + 存储 256g 以上（空余空间 100g 以上），重量（手机 < 200g，pad < 700g）
* 显示设备：屏幕11寸以上，100% P3 色域，内存 6g 以上，存储 128g 以上

### 操作过程

#### `F-Droid` 安装

（计算设备）

F-Droid 是一个用来安装开源软件的安卓市场，后面需要用到 `termux` 及 `termux:api` 需要使用该软件进行安装。访问 https://f-droid.org/ 下载安装即可

#### `termux` 和 `termux:api`

（计算设备）

打开 `F-Droid`，搜索 `termux` 和 `termux:api` 进行安装

特别注意

* 不要在 Play 商店安装，因为无法过审，商店里面的是旧版，无法执行 `apt update`
* termux 的 shell 并不是完整的 Linux 环境，参见 [wiki](https://wiki.termux.com/wiki/Differences_from_Linux)

关于 termux，更多参见

* [博客](https://www.sqlsec.com/2018/05/termux.html)
* [官方网站](https://termux.com/)

#### 安装 `tmoe-linux`

（计算设备）

tmoe-linux （[gitee](https://gitee.com/mo2/linux) | [github](https://github.com/2moe/tmoe-linux)），是一个国人编写的 shell 脚本工具集，该项目的主要用于，在 `Android-termux`、`Window-WLS` 环境（宿主机）中，利用容器（[proot/chroot](https://wiki.termux.com/wiki/PRoot)）和 qemu 技术，安装和配置一个全功能的 Linux（容器环境）。

```bash
# 宿主机环境
apt update
apt install -y curl
. <(curl -L l.tmoe.me)
```

一路 Yes，将进入一个主菜单，选择 `proot容器`，选择 `arm64发行版`，... 一路选择第一个即可。

安装完成后将安装一个基本完整的 `Kali` arm64 Linux系统（细节可通过 `neofetch` 查看）（后文称容器环境）

特别注意，以上安装的是利用 proot 方式，也并不是完全完整的 Linux 环境。如果想安装 x64 的环境或者想要更完整的环境，需要选择 `proot容器 -> cross-arch...`（基于 qemu），但是该方案性能存在问题（软件虚拟化，性能存在问题）

#### 安装 VNC Viewer

（显示设备）

通过 Play 商店下载，或者 百度 搜下

#### tmoe 操作

以上简述的是安装完成后。计算设备重新打开 termux 安卓软件后，进入的是 Termux 这个宿主机环境，此时需要执行一些命令才能进入容器环境。

宿主机

* `debian` 即可进入容器环境的 shell
* `startvnc` 即可进入容器环境的 shell，同时启动 vnc
* `startx11vnc` 即可进入容器环境的 shell，同时启动 vnc
* `stopvnc` 停止 vnc
* `tmoe` 重新进入脚本主菜单，可以安装其他的环境，或者卸载当前环境（功能众多可自行探索）

容器

* `tmoe` 进入容器管理的脚本主菜单，可以安装一些软件，配置 zsh，配置 vnc
* `startvnc` 启动 vnc
* `startx11vnc` 启动 vnc
* `stopvnc` 停止 vnc

建议

* 建议使用 tigerVNC 或 x11VNC，连接效果较好

### 性能测试

> [geekbench](https://www.geekbench.com/blog/2021/03/geekbench-54/)

```bash
wget https://cdn.geekbench.com/Geekbench-5.4.0-LinuxARMPreview.tar.gz
tar xf Geekbench-5.4.0-LinuxARMPreview.tar.gz
cd Geekbench-5.4.0-LinuxARMPreview
./geekbench_aarch64
```

结果（小米 11 骁龙 888）

* 单核 `955`，多核 `2983` （小米 11 官方分数 单核 1132、多核 3758）

说明该方案性能损失不大
