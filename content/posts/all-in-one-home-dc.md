---
title: "All in one 家庭数据中心"
date: 2024-02-14T17:10:00+08:00
draft: false
toc: true
comments: true
tags:
  - linux
---

## 概述

本文将介绍笔者 all in one 家庭数据中心搭建的思路、设计以及落地实施的全过程。

## 设计

### 目标和原则

* 性价比优先，性能次之。
* all in one 虚拟化。
* 7 * 24 小时不停机（可接受停电不可用）。
* 搭建家庭 NAS，保证数据安全，数据备份，虚拟机快照。
* 旁路由透明代理。
* 局域网支持公网访问。
* 开源优先，Linux 优先，轻量级优先，免费计划（订阅）优先，一次性费用优先。
* 影音、办公优先、不考虑游戏。

### 分析

**主机和配件**

All in one 且需要长时间运行，需要稳定性和省电，因此建议选择迷你主机。这里提一下选购建议：

* 建议选择 2000 以上的准系统版本，CPU AMD 和 Intel 均可，自行购买内存和硬盘。
    * 该价位迷你主机内存，一般有两个插槽，总共最大 64G，单条最大 32G。因为多个虚拟机需同时运行，且内存和 CPU 不一样，属于无法压缩资源，这里建议直接装到最大 64G。
    * 硬盘（系统盘），建议选择 PCIe 3.0 以上， 1T 以上的即可。
* 因为要长时间运行，且可能位于卧室，因此低噪声是最为重要，在购买前一定确认噪声情况。

组建 NAS 需要将多块硬盘接入主机，这里一个最廉价的（延迟和速度基本够用）方案是：

* 二手机械硬盘（价格 100 元/T）。
* 亚克力支架（搜索亚克力硬盘架，4 盘位包邮 10 元左右）。
* sata 转 usb3 连接线 （搜索硬盘连接线、硬盘易驱线 20元/个）。
* 12v DC 电源（多个或 1 拆多，20 元/4A）。
* USB HUb 1 分 4 （30 元）。

**系统**

根据上述目标，这里选型如下：

* 主机上安装 PVE 虚拟化系统（不选择 EXSI 原因是其是闭源的），其他系统均以虚拟机形式运行在 PVE 中。
* 旁路由选择 OpenWRT。
* 桌面系统使用 Windows 11 （核显直通）。
* 开发系统使用无桌面的 Debian 12， 由 Windows 11 通过 VSCode Remote SSH 连接。
* NAS 系统选择 OMV。
* Deamon 系统选择 LXDE 桌面 + Debian 12。

**外部服务**

* 使用免费计划的 cloudflare zero trust 实现在公网访问家庭局域网，详见博客： [Cloudflare 免费计划详解](/posts/cloudflare-free-plan/)。
* 使用免费计划的 cloudflare 站点托管和海外 VPS （搜索便宜年付 VPS，约 10~20 美元/年） 以及 OpenWRT 旁路由，即可实现旁路由透明代理。

### 硬件设备

本文基于的主要硬件设备如下：

* 主机：小米迷你主机准系统版 （十分不建议购买，噪音巨大）， 64G 内存，1 T SSD 硬盘。
* 外接显卡：用于 AI 炼丹，或双桌面。本方案不考虑网络游戏，因为是虚拟机，会被网络游戏反作弊程序识别，游戏建议另行购买专用游戏主机。
    * 雷电显卡扩展坞：[逍遥君DIY 雷电4雷电3显卡扩展坞 显卡坞Thunderbolt](https://item.taobao.com/item.htm?skuId=5278612827653) 。
    * 独立显卡：英伟达 RTX 3060 。
    * 台式机电源。

### 网络模型

![image](/image/all-in-one-home-dc-network.svg)

### NAS 存储

![image](/image/all-in-one-home-dc-nas.svg)

## PVE 安装和配置

### 设置路由器局域网

不要使用各大路由器厂商经常用到的网段，如：

* `192.168.0.1/24`
* `192.168.1.1/24`
* `192.168.31.1/24` 小米

这里选取的网段为 `192.168.29.1/24`，打开路由器局域网设置，修改局域网网段，然后其他设备重连即可。

### 制作安装盘

> 在其他计算机中进行如下操作。

* 前往 [PVE 下载页](https://www.proxmox.com/en/downloads)，下载最新版 ISO。
* 安装 [balenaEtcher](https://etcher.balena.io/#download-etcher)，下载烧录器。
* 插入 U 盘，打开 balenaEtcher， 选择下载的 ISO 点击 Flash，等待完成。

### 安装 PVE

> 注意：该操作会清空目标硬盘的所有数据！

* 主机连接电源、键盘、鼠标、显示器、安装盘、网线。
* 启动主机，选择图形化安装，并填写相关选项：
    * Target Harddisk: 选择要安装的系统盘
    * Country: China
    * Time Zone: Asia/Shanghai
    * Keyboard Layout: U.S. English
    * Password: 自己设置即可
    * Management Interface: 选择有线网卡
    * Hostname (FQDN): pve.rectcircle.cn （可以用个人博客的域名）
    * IP Address (CIDR): 192.168.29.2
    * Gateway: 192.168.29.1
    * DNS Server: 192.168.29.1
* 最后安装重启即可。

### 登录 PVE

浏览器打开，打开 https://192.168.29.2:8006/， 高级，继续前往192.168.29.2（不安全）。

* Language: 选择中文
* 用户名: root
* 密码： 上一步设置的密码

无有效订阅，点击确认即可，不影响使用。

### 配置 apt 源

* 注释掉 `/etc/apt/sources.list.d/` 下所有文件中的所有配置。
* 参考：[清华 Debian 软件源](https://mirrors.tuna.tsinghua.edu.cn/help/debian/)、[清华 Proxmox 软件仓库](https://mirrors.tuna.tsinghua.edu.cn/help/proxmox/) 配置 apt。
* 登录 PVE，选择 pve 节点，点击更新，点击刷新，完成后，点击升级，将 pve 更新到最新版。

## 存储管理

> 参考：[博客 PVE的local和local-lvm](https://foxi.buduanwang.vip/virtualization/pve/1434.html/)。

### 默认配置

pve 将主机的磁盘（以 1 T SSD 为例），使用 GTP 划分为 3 个分区，分别是（`fdisk -l`）：

```
Device           Start        End    Sectors   Size Type
/dev/nvme0n1p1      34       2047       2014  1007K BIOS boot
/dev/nvme0n1p2    2048    2099199    2097152     1G EFI System
/dev/nvme0n1p3 2099200 2000409230 1998310031 952.9G Linux LVM
```

用户可以使用的就是 Linux LVM，默认情况下，分为如下几部分 （`lsblk`）：

```
NAME               MAJ:MIN RM   SIZE RO TYPE MOUNTPOINTS
nvme0n1            259:0    0 953.9G  0 disk 
├─nvme0n1p1        259:1    0  1007K  0 part 
├─nvme0n1p2        259:2    0     1G  0 part /boot/efi
└─nvme0n1p3        259:3    0 952.9G  0 part 
  ├─pve-swap       252:0    0     8G  0 lvm  [SWAP]
  ├─pve-root       252:1    0    96G  0 lvm  /
  ├─pve-data_tmeta 252:2    0   8.3G  0 lvm  
  │ └─pve-data     252:4    0 816.2G  0 lvm  
  └─pve-data_tdata 252:3    0 816.2G  0 lvm  
    └─pve-data     252:4    0 816.2G  0 lvm  
```

`lvs`

```
  LV   VG  Attr       LSize    Pool Origin Data%  Meta%  Move Log Cpy%Sync Convert
  data pve twi-a-tz-- <816.21g             0.00   0.23                            
  root pve -wi-ao----   96.00g                                                    
  swap pve -wi-ao----    8.00g    
```

在 PVE 管理页面，数据中心，存储菜单，默认有如下两个：

* local 类型为目录存储，路径为 `/var/lib/vz`，用于存储 ISO 镜像、容器模板、VZDump备份。该目录位于根目录挂载点，对应上面的 pve-root 逻辑卷，只分配了 96G。
* local-lvm 类型为块存储，用于存储虚拟机磁盘、容器。对应上面的 pve-data 逻辑卷。

这种存储划分，虚拟机磁盘数据直接放到了块设备，具有较高的性能。

但是，这种配置有如下问题：

* 块设备对于用户来说是非透明，看不到磁盘内容。
* pve-root 空间太小，需要维护 local 和 local-lvm 两个 lvm 逻辑卷的磁盘大小，这些操作需要了解 lvm，并只能通过命令行来操作，对于小白运维成本高。

### 存储与快照

虚拟机和裸机相比，最重要的一个优势是，可以低成本的实现快照。在有快照的情况下，可以随意的对操作系统做任何事情，即使玩崩了，也可以将操作系统恢复到快照时候的状态。

快照是依赖底层存储实现的，因此，在 PVE 中，并不是所有的虚拟机的都是支持快照的，是否支持快照取决于创建虚拟机时磁盘配置。

在 PVE 创建虚拟机配置磁盘时，有两个核心选项：存储以及格式。这两个参数决定了当前虚拟机是否支持快照。可以总结为如下规则：

* 存储类别为 `lvm-thin` 等的支持快照。
* 其他存储类别的，格式为 `qcow2` 的支持快照。
* 其他情况不支持快照。

各种情况的枚举参见： [Proxmox VE存储入门](https://foxi.buduanwang.vip/linux/2044.html/) 、 [PVE虚拟机不能打快照](https://foxi.buduanwang.vip/virtualization/pve/1083.html/) 、 [官方文档 Proxmox VE Storage](https://pve.proxmox.com/pve-docs/chapter-pvesm.html)。

特别说明的是，如果想要安装 windows 11，那么则必须要添加一个 TPM 2.0 的磁盘，这个磁盘的格式必须为 `row`。

### 推荐配置

为了解决上述问题，这里推荐的做法：

* local-lvm (pve-data) 只保留 10 G，用来存放 TPM 之类的格式只能是 row 的磁盘。
* 其他空间全部分配给 pve-root，能用 qcow2 的磁盘就用，且都放到 local (pve-root) 。

操作如下：

* 在 PVE 管理页面，数据中心 -> 存储 -> local -> 内容，所有全都选中，保存。
* 打开 PVE shell，执行如下命令吗，删除 pve-data 并将空间合并到 pve-root：

    ```bash
    lvremove /dev/pve/data # 先删除
    # 参考 https://pve.proxmox.com/wiki/Storage:_LVM_Thin
    lvcreate -L 10G -n data pve # 重新创建 pv
    lvconvert --type thin-pool pve/data # 转换为 thin-pool 格式
    lvextend -rl +100%FREE /dev/pve/root # 将剩余空间全部分配给 pve-root
    df -h  # 查看
    ```

其他说明：

* 磁盘文件存储选 local，格式为 qcow2 的将存储在 `/var/lib/vz/images/` 目录中。
* 只有 TPM2.0 磁盘存储需要选 local-lvm，格式为 row，将存储在逻辑卷中。
* 该配置相比默认配置，磁盘性能会存在一定的性能损失。

### 备忘：根目录缩容

某些场景可能需要对根目录进行缩容以腾出空间。此时操作如下：

* 插入 pve 安装盘，在 BIOS 中引导到安装盘。
* 按 `CTRL + ALT + F2` 进入 tty，执行如下命令。

    ```bash
    e2fsck -f /dev/mapper/pve-root
    resize2fs /dev/mapper/pve-root 800G     # （仅验证过 ext4）文件系统缩容到 800G
    lvreduce -L 800G /dev/mapper/pve-root  # 逻辑卷分区缩容到 800G
    ```

* 重启即可

## Windows11 虚拟机

### Intel 核显直通准备

> 参考： [bilibili 文章](https://www.bilibili.com/read/cv27608215/)。

* 修改 `/etc/default/grub` 的 `GRUB_CMDLINE_LINUX_DEFAULT` 行内容为 `GRUB_CMDLINE_LINUX_DEFAULT="quiet intel_iommu=on iommu=pt"`。
* 修改 `/etc/modprobe.d/pve-blacklist.conf`，新增如下内容：

    ```
    blacklist i915
    blacklist snd_hda_intel
    options vfio_iommu_type1 allow_unsafe_interrupts=1
    ```

* 应用配置并重启：

    ```bash
    update-grub
    update-initramfs -u -k all
    reboot
    ```

* [下载 rom](https://github.com/cmd2001/build-edk2-gvtd/releases/tag/v0.1.0) 到 `/usr/share/kvm/` 目录下。

    ```bash
    cd /usr/share/kvm/
    wget https://github.com/cmd2001/build-edk2-gvtd/releases/download/v0.1.0/AIO.rom
    ```

### 安装和基础配置

* 前往[微软官方下载站点](https://www.microsoft.com/zh-cn/software-download/windows11/)，下载 Win11 ISO，选择如下：
    * Windows 11 (multi-edition ISO)
    * 简体中文
* 下载 [Windows VirtIO 驱动](https://github.com/virtio-win/kvm-guest-drivers-windows)，点击[下载地址](https://fedorapeople.org/groups/virt/virtio-win/direct-downloads/archive-virtio/virtio-win-0.1.240-1/)找到最新版下载。
* 登录 PVE 管理页面 -> local -> ISO 镜像，将上述 ISO 上传到 local 存储。
* 创建虚拟机，参数如下：
    * 常规
        * 名称：win-private 以及 win-company
    * 操作系统
        * 使用CD/DVD光盘镜像文件（ISO）：选择 win11 的 iso
        * 客户机操作系统：windows 11
        * Add additional drive for VirtIO drivers：添加 virtio-win-0.1.240.iso
    * 系统
        * 显卡：默认 （核显直通，则填写 none）
        * SCSI 控制器：VirtIO SCSI single
        * 机型：i440fx
        * Qemu 代理：勾选
        * BIOS：OVMF （UEFI）
        * 添加TPM：勾选，存储选 local-lvm （注意这个不是 local）
        * 添加EFI：勾选，存储选 local
        * 预注册秘钥：勾选
    * 磁盘
        * 存储：local
        * 磁盘大小（GiB）：128
        * 格式：QEMU映像格式（qcow2）
    * CPU
        * 类别：x86-64-v2-AES （pve 8 的默认值，可以保证[可迁移性](https://foxi.buduanwang.vip/virtualization/599.html/)）
        * 核心：4
    * 内存（MiB）：16384
    * 网络
        * 桥接：vmbr0
        * 模型：VirtIO （半虚拟化）。
* （仅 Intel 核显直通需要的操作）
    * 修改配置 `/etc/pve/qemu-server/xxx.conf` 配置文件，添加如下内容。

        ```
        args: -set device.hostpci0.addr=02.0 -set device.hostpci0.x-igd-gms=0x2 -set device.hostpci0.x-igd-opregion=on
        hostpci0: 0000:00:02.0,legacy-igd=1,romfile=AIO.rom
        hostpci1: 0000:00:1f.3
        ```

    * 添加鼠标和键盘设备：打开 PVE 该虚拟机硬件配置菜单，点击添加 USB 设备，将鼠标键盘添加到该虚拟机中。
    * 将显示器 HDMI 接入主机。
* 启动虚拟机，立即多次按键盘的回车键，即可进入 windows 安装页面，关键点如下：
    * Windows 安装程序：加载驱动程序，选择路径存在 win11 的驱动。
    * 在选国家地区页面，按 shift + f10 执行 `oobe\BypassNRO.cmd`（可跳过联网和登录微软账号）。
    * 在 “让我们为你连接到网络” 点击我没有 Internet 连接，点击继续执行受限设置。
    * 填写相关信息，创建一个本地账号。
    * 成功进入系统后，打开 VirtIO ISO，双击 virtio-win-guest-tools 安装 QEMU Guest Agent 和 网络驱动。

### 蓝牙直通

```bash
# /etc/modprobe.d/pve-blacklist.conf
# blacklist btusb
update-initramfs -u -k all
# lsusb 
```

### NVIDIA 显卡直通

> 参考：[博客](https://foxi.buduanwang.vip/virtualization/pve/561.html/)

屏蔽显卡驱动

```bash
echo "blacklist nouveau" >> /etc/modprobe.d/pve-blacklist.conf
echo "blacklist nvidia" >> /etc/modprobe.d/pve-blacklist.conf
# echo "blacklist nvidiafb" >> /etc/modprobe.d/pve-blacklist.conf
echo "blacklist snd_hda_intel" >> /etc/modprobe.d/pve-blacklist.conf
```

查看设备 id

```bash
lspci -nnk
# 04:00.0 VGA compatible controller [0300]: NVIDIA Corporation GA106 [GeForce RTX 3060 Lite Hash Rate] [10de:2504] (rev a1)
#         Subsystem: NVIDIA Corporation GA106 [GeForce RTX 3060 Lite Hash Rate] [10de:2504]
#         Kernel driver in use: nouveau
#         Kernel modules: nvidiafb, nouveau
# 04:00.1 Audio device [0403]: NVIDIA Corporation GA106 High Definition Audio Controller [10de:228e] (rev a1)
#         Subsystem: NVIDIA Corporation GA106 High Definition Audio Controller [10de:2504]
#         Kernel modules: snd_hda_intel
lspci -nnk
# 04:00.0 0300: 10de:2504 (rev a1)
# 04:00.1 0403: 10de:228e (rev a1)
```

将设备加入 vfio

```bash
echo "options vfio-pci ids=10de:2504,10de:228e" >> /etc/modprobe.d/vfio.conf
```

添加内核选项

```bash
echo "options kvm ignore_msrs=1" > /etc/modprobe.d/kvm.conf
```

更新内核镜像

```bash
update-initramfs -k all -u 
```

打开 pve 管理页面，选择 windows 虚拟机，点击硬件，点击添加，选择添加 pcie 设备，选择上面的设备号，并勾选所有功能、PCI-Express，取消勾选主 GPU。

保持显示为默认，打开虚拟机，等待 windows 自动安装显卡驱动。

确认安装完成后，停止虚拟机，并将显示设置为 none。

### vm 停止后归还设备

略，参见：

* [github](https://github.com/HelloZhing/pvevm-hooks)。
* [博客](https://foxi.buduanwang.vip/virtualization/pve/1590.html/)。

### 设置主机名

打开设置，系统，系统信息，重新命名这台电脑。

### 安装配置 barrier

> 详见： [github](https://github.com/debauchee/barrier) 。

barrier 是一个开源的鼠标键盘多设备流转的软件。当安装多个桌面系统时，可以使用单套键盘鼠标操作多个系统。

* 打开 github release 页，下载 exe ，并安装。
* 打开，引导页，语言选择中文，设置为客户端。
* 配置服务端 IP，填写 Deamon 虚拟机的 IP。
* 点击菜单栏，Barrier，更改设置：勾掉 开启SSL，勾选最小化启动，勾选最小化到系统托盘（这里的自动启动实测不生效）。
* 设置 barrier 在登录账号前启动。
    * 打开任务计划程序。
    * 点击创建任务
        * 常规
            * 名称：barrier
            * 选择：不管用户是否登录都要运行
        * 触发器，新建，选择启动时
        * 操作：新建，选择启动程序
            * 配置程序或脚本为 `C:\Program Files\Barrier\barrier`
        * 条件：勾掉只有在计算机使用交流电源时才启动此任务
        * 设置：勾掉如果任务运行超过一下时间，停止任务

## Dev 虚拟机

* 前往 [Debian DVD ISO 下载页](https://cdimage.debian.org/debian-cd/current/amd64/iso-dvd/)，下载无需网络依赖的 ISO （大小约 3.7 G）
* 上传到 PVE local 存储。
* 创建虚拟机，要点选项如下（其他选项默认）：
    * 客户机操作系统：Linux 6.x - 2.6 Kernel
    * Qemu代理：勾选
    * CPU：2 核
    * 内存：4G
* 操作系统安装：
    * 软件选择：仅保留标准系统工具和 SSH Server
    * 安装 GRUB 启动引导器，选择识别到的硬盘
* 操作系统配置，`su root` 执行：
    * 参考[清华镜像源](https://mirrors.tuna.tsinghua.edu.cn/help/debian/)，配置 apt。
    * 安装常用的软件： `apt install vim curl git sudo`。
    * 配置免密 sudo：`echo 'rectcircle ALL=(ALL:ALL)  NOPASSWD:ALL' > /etc/sudoers.d/rectcircle`。

## Deamon 虚拟机

### 安装虚拟机

步骤和 [Dev 虚拟机](#dev-虚拟机) 基本一致，差别在于：

* 创建虚拟机
    * CPU： 1 核
    * 内存：2G
* 操作系统安装：
    * 软件选择：Debian 桌面环境、LXDE、标准系统工具、 SSH Server
* 打开虚拟机配置选项，开启开机自启动

### 配置开机自动进入桌面

修改 /etc/lightdm/lightdm.conf 文件，在文件中找到 `#autologin-user=` （位于 `[Seat:*]` 段）。

### 安装配置 barrier

> [github](https://github.com/debauchee/barrier)

安装

```bash
apt update
apt install barrier
```

配置 barrier

* 打开终端，输入 barrier 回车启动。
* 选择中文，作为服务端。
* 点击设置服务端。
* 添加一个屏幕，配置屏幕名为对应设备的主机名。
* 点击菜单栏，Barrier，更改设置：勾掉 开启SSL，勾选自动启动。

配置自动启动

```bash
mkdir -p ~/.config/autostart
ln -s /usr/share/applications/barrier.desktop ~/.config/autostart/barrier.desktop
```

## OMV 虚拟机

### 安装虚拟机

步骤和 [Dev 虚拟机](#dev-虚拟机) 基本一致，差别在于：

* 前往 [OMV 下载页](https://www.openmediavault.org/download.html)，下载 ISO。
* 上传到 PVE local 存储。
* 创建虚拟机
    * CPU： 1 核
    * 内存：2G
* 打开虚拟机硬件添加硬盘所在的 USB 设备。
* 打开虚拟机选项，开启开机自启动。

### 基础配置

* ssh 登录 root：
    * 参考[清华镜像源 omv 配置说明](https://mirrors.tuna.tsinghua.edu.cn/help/openmediavault/)，配置 apt。
    * `apt update && apt upgrade -y`
* 浏览器输入 ip 地址，输入默认用户名 (admin)、密码 (openmediavault)登录。
* 修改登录密码：点击右上角用户图标 -> 更改密码，修改密码。
* 配置仪表盘：点击右上角用户图标 -> 仪表盘，启用所有。
* 系统 -> 工作台：
    * 自动登出：禁用。
* 使用备份用硬盘，创建【备份文件系统】。
    * 存储器 -> 文件系统，点击新建，选 ext4，选择备份用的硬盘创建。
* 其他硬盘，由 LVM 管理，并创建【主文件系统】（lvm 参见：[文章](/posts/linux-lvm/)）。
    * 系统 -> 插件，搜索 lvm，安装。
    * 存储器 -> LVM
        * 多个物理卷，将物理硬盘添加进去。
        * 多个卷组，新建一个卷组。
        * 逻辑卷，创建一个逻辑卷。
    * 存储器 -> 文件系统，点击新建，选 ext4，选择逻辑卷。
* 将【主文件系统】通过 SMB/NFS 导出。
    * 用户 -> 用户，新建，该操作会新建一个 id 为 1000 用户组为 100 (users) 的 Linux 用户。
    * 存储器 -> 共享文件系统，新建：
        * 名称：main
        * 文件系统：【主文件系统】
        * 相对路径：`/`
        * 权限：按需选项
    * 服务 -> SMB/CIFS
        * 设置：勾选已启用。
        * 共享，新建：
            * 选择 main 共享文件系统。
            * 勾掉隐藏点文件。
    * 服务 -> NFS
        * 设置：勾选已启动，保存并应用。
        * 共享：
            * Shared folder： 选择 main
            * 客户端： 填写 `192.168.29.0/24`。
            * 权限： 设为读写。
            * 扩展选项填写： `subtree_check,insecure,no_root_squash`。
* 配置备份任务。
    * 创建相关共享文件夹，存储器-> 共享文件夹：
        * 创建：important-source，选择【主文件系统】，相对路径填写 `00-Important/`
        * 创建：important-backup，选择【备份文件系统】，相对路径填写 `/`
    * 创建 Rsync 任务，服务 -> Rsync -> 任务，新建：
        * 类型：本地。
        * 源共享文件夹：important-source。
        * 目标共享文件夹：important-backup。
        * 执行时间：凌晨 5 点。
        * 试运行：勾选（先测试一次）。
    * 调试，服务 -> Rsync -> 任务，选择上一步创建的，点击运行。
    * 勾掉试运行，保存。

### 其他系统使用

* 安卓手机：ES 文件浏览器 -> 网络 -> 局域网 -> 扫描。
* Mac：访达 -> 前往 -> 连接服务器。
* Windows （SMB 协议）:
    * 打开资源管理器，网络
    * 双击 OMV，输入上一小节步骤新建的用户和密码连接。
    * 右击 main 目录，映射网络驱动器。
    * 勾选使用其他凭据链接。
    * 点击完成，输入上一小节步骤新建的用户和密码连接。

* Linux: [使用 systemd 挂载](https://www.expoli.tech/articles/2022/12/23/use-systemd-mount-any-device)。

    * 创建挂载点和配置文件

        ```bash
        mkdir -p /home/rectcircle/omv
        sudo touch /etc/systemd/system/$(systemd-escape -p --suffix=mount "/home/rectcircle/omv")
        sudo touch /etc/systemd/system/$(systemd-escape -p --suffix=automount "/home/rectcircle/omv")
        ```

    * `/etc/systemd/system/home-rectcircle-omv.mount` 内容如下：

        ```
        [Unit]
        Description=OVM NFS mount

        [Mount]
        What=192.168.29.7:/export/main
        Where=/home/rectcircle/omv
        Type=nfs


        [Install]
        WantedBy=multi-user.target
        ```

    * `/etc/systemd/system/home-rectcircle-omv.automount` 内容如下：

        ```
        [Unit]
        Description=OVM NFS automount

        [Automount]
        Where=/home/rectcircle/omv
        TimeoutIdleSec=10

        [Install]
        WantedBy=multi-user.target
        ```

    * 启用配置：`sudo systemctl enable home-rectcircle-omv.automount --now`

### 安装 omv-extras

```bash
# 方式1: 自动安装 (能访问外网场景推荐，推荐配置完成 OpenWRT 再执行)
wget -O - https://github.com/OpenMediaVault-Plugin-Developers/packages/raw/master/install | bash
# https://mirrors.tuna.tsinghua.edu.cn/OpenMediaVault/openmediavault-plugin-developers/pool/main/o/openmediavault-omvextrasorg/

# 方式2: 大陆地区
# 如下针对：omv 6
apt --yes --no-install-recommends install dirmngr gnupg
wget https://mirrors.tuna.tsinghua.edu.cn/OpenMediaVault/openmediavault-plugin-developers/pool/main/o/openmediavault-omvextrasorg/openmediavault-omvextrasorg_6.3.6_all.deb
dpkg -i openmediavault-omvextrasorg_6.3.6_all.deb
apt-get update
rm -rf openmediavault-omvextrasorg_6.3.6_all.deb
# 设置清华源
omv-env set OMV_APT_REPOSITORY_URL "https://mirrors.tuna.tsinghua.edu.cn/OpenMediaVault/public"
omv-env set OMV_APT_ALT_REPOSITORY_URL "https://mirrors.tuna.tsinghua.edu.cn/OpenMediaVault/packages"
omv-env set OMV_APT_KERNEL_BACKPORTS_REPOSITORY_URL "https://mirrors.tuna.tsinghua.edu.cn/debian"
omv-env set OMV_APT_SECURITY_REPOSITORY_URL "https://mirrors.tuna.tsinghua.edu.cn/debian-security"
omv-env set OMV_EXTRAS_APT_REPOSITORY_URL "https://mirrors.tuna.tsinghua.edu.cn/OpenMediaVault/openmediavault-plugin-developers"
omv-env set OMV_DOCKER_APT_REPOSITORY_URL "https://mirrors.tuna.tsinghua.edu.cn/docker-ce/linux/debian"
omv-env set OMV_PROXMOX_APT_REPOSITORY_URL "https://mirrors.tuna.tsinghua.edu.cn/proxmox/debian"
# 使得环境变量更改生效
omv-salt stage run all
```

* 浏览器 omv 管理页面强制刷新 `ctrl + shift + r`。
* 注意 ：omv-extra 6.3 已经将 docker, portainer 和 yacht 移除了，只能使用 openmediavault-compose，参见：[官方论坛](https://forum.openmediavault.org/index.php?thread/47983-omv-extras-6-3-openmediavault-compose-6-7/)。

### 安装其他常用插件

* ~~`openmediavault-compose` 管理 docker。安装完成后，可在：服务 -> Compose 菜单中使用。~~ （不建议安装，可能会造成网络问题）
* `openmediavault-downloader` 下载器。安装完成后，可在：服务 -> Downloader 菜单中使用。
* `openmediavault-ftp` ftp 服务。

## OpenWRT 虚拟机

### 安装虚拟机

> [官方文档](https://openwrt.org/docs/guide-user/installation/openwrt_x86)

* 从 [清华源](https://mirrors.tuna.tsinghua.edu.cn/openwrt/releases/23.05.2/targets/x86/64/) 下载最新版镜像  [`openwrt-23.05.2-x86-64-generic-ext4-combined-efi.img.gz`](https://mirrors.tuna.tsinghua.edu.cn/openwrt/releases/23.05.2/targets/x86/64/openwrt-23.05.2-x86-64-generic-ext4-combined-efi.img.gz)。
* 解压为 img 文件。
* 打开 pve local 存储，上传 img 文件。
* 后续步骤和 [Dev 虚拟机](#dev-虚拟机) 基本一致，差别在于：
    * 创建虚拟机
        * 名称：openwrt
        * CPU： 1 核
        * 操作系统：不适用任何介质
        * 内存：2G
        * 删除默认磁盘
    * 打开 pve shell，执行如下命令，导入磁盘

        ```bash
        qm disk import 105 /var/lib/vz/template/iso/openwrt-23.05.2-x86-64-generic-ext4-combined-efi.img local --format qcow2
        ```

    * 打开虚拟机配置：
        * 硬件，双击选中未使用的磁盘 0，点击添加。
        * 选项，引导顺序，将硬盘添加到第一个。
    * 点击启动，即可进入系统。

### 基础配置

* 打开控制台，配置 lan 口：需修改 `/etc/config/network` 的 lan 口的 ipaddr 为分配的地址，如 `192.168.29.254`，执行 `service network restart` 重启网络。
* 打开 openwrt 控制台 http://192.168.29.254 ，进行如下基础配置：
    * 通过引导页，配置 root 密码。
    * System -> Administration -> SSH Access 开启 ssh 登录。
* ssh 登录 openwrt，进行如下基础配置：
    * 参考 [清华源](https://mirrors.tuna.tsinghua.edu.cn/help/openwrt/)，配置。
    * 配置 hostname，`vim /etc/config/system`，hostname 为 `openwrt`。
* 打开 openwrt 控制台 http://192.168.29.254 。
    * 配置 lan 口：Network -> Interfaces，选择 br-lan，点击 Edit，编辑：常规设置 -> 网关、高级设置 -> DNS 为硬路由的 192.168.29.1 。
    * System -> Sofeware，点击 Update list，
        * 搜索 `luci-i18n-base-zh-cn`，安装中文包。
        * 搜索 `qemu-ga`，安装 qemu-agent。
* 配置旁路由（详见：[博客](https://easonyang.com/posts/transparent-proxy-in-router-gateway/)）。
    * 打开 openwrt 控制台 http://192.168.29.254 。
        * Network -> Interfaces，选择 br-lan，点击 Edit。
            * DHCP -> 高级设置 -> DHCP 选项，添加：
                * 网关 `3,192.168.29.254`。
                * DNS `6,192.168.29.254`。
            * DHCP -> 高级设置，勾选强制。
            * DHCP -> IPv6 设置， RA 服务、 DHCPv6 服务、NDP 服务均关闭。
        * 网络 -> 防火墙，关闭 SYN-flood 防御，区域 lan => wan 勾选 IP 动态伪装（实测不勾选，网络不稳定）。
    * 打开硬路由控制台 http://192.168.29.1 ，关闭 DHCP 服务。
    * 将主机和虚拟机设置为 HDCP 静态地址。
* 磁盘扩容
    * 打开 pve 控制台，openwrt 虚拟机硬件，选择硬盘，磁盘操作，调整磁盘大小，增量大小，调整到 4 G。
    * ssh 连接到 openwrt，执行如下命令（参考：[官方文档](https://openwrt.org/docs/guide-user/advanced/expand_root)）：

        ```bash
        opkg update
        opkg install parted losetup resize2fs
        wget -U "" -O expand-root.sh "https://openwrt.org/_export/code/docs/guide-user/advanced/expand_root?codeblock=0"
        . ./expand-root.sh
        sh /etc/uci-defaults/70-rootpt-resize
        ```

### 旁路由透明代理

受限于中国大陆法律法规，不做介绍，如有需要自行搜索。

### 异地组网

* （推荐） 使用 cloudflare zero trust，详见博客： [Cloudflare 免费计划详解](/posts/cloudflare-free-plan/)。
* 手动配置 Wireguard：
    * 安装 `luci-proto-wireguard` 软件包，重启虚拟机。
    * 更多参见：[博客](/posts/linux-net-virual-06-wireguard/)。
* 使用 [zerotier](https://my.zerotier.com/)，注意：大陆地区速度极慢基本不可用。参考：
    * [博客](https://kevron2u.com/set-up-a-zerotier-network-on-openwrt/)。
    * [官方 wiki](https://openwrt.org/docs/guide-user/services/vpn/zerotier)，注意该文命令，有错误，正确写法如下：

        ```bash
        cat /etc/config/zerotier
        # config zerotier sample_config
        #         option enabled 0

        #         # persistent configuration folder (for ZT controller mode)
        #         #option config_path '/etc/zerotier'
        #         # copy <config_path> to RAM to prevent writing to flash (for ZT controller mode)
        #         #option copy_config_path '1'

        #         #option port '9993'

        #         # path to the local.conf
        #         #option local_conf '/etc/zerotier.conf'

        #         # Generate secret on first start
        #         option secret ''

        #         # Join a public network called Earth
        #         list join '8056c2e21c000001'
        #         #list join '<other_network>'

        uci delete zerotier.sample_config
        uci set zerotier.rectcircle=zerotier
        uci add_list zerotier.rectcircle.join='xxx'
        uci set zerotier.rectcircle.enabled='1'
        uci commit zerotier
        service zerotier restart
        ```

## 参考

* [佛西博客](https://foxi.buduanwang.vip/category/virtualization/pve/)

<!-- 

核心绑定 `lscpu -e`。

* 当然建议大家使用virtio-scsi-single的磁盘控制器，以获得最佳性能。 https://foxi.buduanwang.vip/virtualization/pve/1226.html/ https://foxi.buduanwang.vip/virtualization/pve/1214.html/
* ID https://foxi.buduanwang.vip/virtualization/pve/bestpractice/1643.html/
* 存储 https://foxi.buduanwang.vip/linux/2044.html/ https://pve.proxmox.com/pve-docs/chapter-pvesm.html
* 镜像 https://foxi.buduanwang.vip/virtualization/pve/1574.html/
* 系统监控 https://foxi.buduanwang.vip/virtualization/pve/615.html/ -->
