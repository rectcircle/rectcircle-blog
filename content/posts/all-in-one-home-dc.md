---
title: "All in one 家庭数据中心"
date: 2023-12-29T18:10:00+08:00
draft: true
toc: true
comments: true
tags:
  - linux
---

## 设计

### 设备

### 网络模型

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

各种情况的枚举参见： [Proxmox VE存储入门](https://foxi.buduanwang.vip/linux/2044.html/) 或 [官方文档 Proxmox VE Storage](https://pve.proxmox.com/pve-docs/chapter-pvesm.html)。

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
        * 类别：x86-64-v2-AES （pve 8 的默认值，可以保证可迁移性）
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


TODO https://foxi.buduanwang.vip/yj/561.html/

https://www.bilibili.com/read/cv26863115/?jump_opus=1

https://zhing.fun/pve_igpupt/

https://github.com/HelloZhing/pvevm-hooks

### vm 停止后归还设备

https://github.com/HelloZhing/pvevm-hooks

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
* 操作系统配置：
    * 参考[清华镜像源](https://mirrors.tuna.tsinghua.edu.cn/help/debian/)，配置 apt。
    * 安装常用的软件： `apt install vim curl git sudo`。
    * 配置免密 sudo：`echo 'rectcircle ALL=(ALL:ALL)  NOPASSWD:ALL' > /etc/sudoers.d/rectcircle`。

## Deamon 虚拟机

步骤和 [Dev 虚拟机](#dev-虚拟机) 基本一致，差别在于：

* 创建虚拟机
    * CPU： 1 核
    * 内存：2G
* 操作系统安装：
    * 软件选择：Debian 桌面环境、LXDE、标准系统工具、 SSH Server

## OMV 虚拟机

步骤和 [Dev 虚拟机](#dev-虚拟机) 基本一致，差别在于：

* 前往 [OMV 下载页](https://www.openmediavault.org/download.html)，下载 ISO。
* 上传到 PVE local 存储。
* 创建虚拟机
    * CPU： 1 核
    * 内存：2G

## OpenWRT 虚拟机

## 备忘

* 当然建议大家使用virtio-scsi-single的磁盘控制器，以获得最佳性能。 https://foxi.buduanwang.vip/virtualization/pve/1226.html/ https://foxi.buduanwang.vip/virtualization/pve/1214.html/
* ID https://foxi.buduanwang.vip/virtualization/pve/bestpractice/1643.html/
* 存储 https://foxi.buduanwang.vip/linux/2044.html/ https://pve.proxmox.com/pve-docs/chapter-pvesm.html
* 镜像 https://foxi.buduanwang.vip/virtualization/pve/1574.html/

## 参考

* [佛西博客](https://foxi.buduanwang.vip/category/virtualization/pve/)
