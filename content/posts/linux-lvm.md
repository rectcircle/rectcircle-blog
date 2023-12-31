---
title: "Linux LVM 逻辑卷管理"
date: 2024-01-01T00:49:00+08:00
draft: false
toc: true
comments: true
tags:
  - linux
---

## 背景知识

在文章 [《用户态文件系统 fuse》](/posts/fuse/) 中，介绍了 Linux 对文件系统的抽象，fuse 文件系统的底层数据存储是可以任意定制的，并不一定会和块设备打交道。

但是，Linux 常用的本地文件系统 （如 ext4） 数据存储都是基于块设备实现的。

Linux 作为冯诺依曼架构计算机的操作系统，必然实现对输入输出（IO）硬件的支持。

但是，IO 硬件千奇百怪，且会不断迭代发展。因此， Linux 根据和 IO 硬件数据读写方式的不同，对 IO 类硬件的抽象，称之为设备 (Device)，主要包含如下两类：

* 字符设备（杂项设备），数据是流式的读写，如：鼠标、键盘、终端。
* 块设备，数据支持随机读写，如：硬盘。

如上这些设备在内核启动过程中，由这些设备驱动（据说 Linux 内核中，驱动代码占比一半），将这些设备加载到内核中。通过 `/dev` 文件系统（udev）暴露给应用程序使用。以硬盘为例，将存在类似于 `/dev/sda` 的设备文件。

为了支持将同一块硬盘划分为多个独立相互不影响的区域，即对硬盘进行分区。以实现在不同的区域，格式化为不同的文件系统。

在 Linux 中，可以使用 [parted](https://man7.org/linux/man-pages/man8/parted.8.html) 命令进行分区（可以用 `parted -l` 查看本机磁盘分区情况）。完成分区后，在 `/dev` 目录中，除了会看到硬盘对应的设备文件外，每个分区也会对应一个设备文件。通过  [lsblk](https://man7.org/linux/man-pages/man8/lsblk.8.html) （list block devices） 命令可以看到所有块设备以及分区关系，示例如下（debian 12 默认 + 挂载两块 1G 的空硬盘）：

```
NAME   MAJ:MIN RM  SIZE RO TYPE MOUNTPOINTS
sda      8:0    0   32G  0 disk 
├─sda1   8:1    0   31G  0 part /
├─sda2   8:2    0    1K  0 part 
└─sda5   8:5    0  975M  0 part [SWAP]
sdb      8:16   0    1G  0 disk 
sdc      8:32   0    1G  0 disk 
```

有了块设备后，即可使用 `mkfs.xxx` 命令，对硬盘或分区进行格式化。

```bash
mkfs.ext4 /dev/sdb
```

之后就可以使用 mount 命令将这个磁盘 mount 到文件系统中了。

```bash
mkdir -p /mnt/test-disk1
mount -t ext4 /dev/sdb /mnt/test-disk1
# umount /mnt/test-disk1  # 恢复现场
```

此时这个文件系统就可以用了（注意， mount 命令只对本次启动有效，重启后将会失效）。

Linux 根目录的挂载，是在启动过程中，通过读取 `/etc/fstab` 配置文件（该文件的 UUID 可通过 `blkid` 命令查看），然后用 mount 系统调用挂载。

## 概述

上述介绍的分区，是将一个硬盘划分多个相互独立的区域，本质上是在当前硬盘中记录了每个区域的起始结束偏移量，难以实现如下场景：

* 分区空间调整，对一个分区的调整受限于前后分区的情况，基本难以扩缩容。
* 分区是针对单块硬盘的，分区的最大大小受限于磁盘的大小。

LVM (Logical Volume Manager) 逻辑卷管理（lvm2, kernel>=2.6），就来解决单 Linux 主机，多磁盘管理的技术，具有如下能力：

* 管理多块硬盘
* 在线扩缩容
* 支持软 RAID
* 快照

简单来说 LVM 本质上，就是在多个块设备（PV）之上，虚拟出多个块设备（LV）。

## 核心概念

* VG (Volume Group) 卷组，可以理解为存储池。
* PV (Physical Volume) 物理卷，对应一个块设备可以是整块磁盘或某个物理分区。一个 PV 如果要被使用，必须加入一个 VG。
* LV (Logical Volume) 逻辑卷，LVM 生成的虚拟块设备。从 VG 中创建，必然属于某个 VG。

## 安装

```bash
apt install lvm2
```

lvm 分为两个部分： 内核和命令行工具。debian 12 内核相关功能已存在，如上命令会安装 lvm2 [命令行工具](https://packages.debian.org/bookworm/amd64/lvm2/filelist)。

## 场景

> 参考: [lvm(8) - Linux man page](https://linux.die.net/man/8/lvm)

### 实验环境

debian 12 附加两块 1 G 的硬盘，所有命令以 root 用户执行。

### 创建存储池（PV 和 VG）

```bash
# 查看块设备
lsblk
# 创建 pv
pvcreate /dev/sdb  # 将块设备格式化为 pv，该盘所有数据将丢失！
pvcreate /dev/sdc  # 将块设备格式化为 pv，该盘所有数据将丢失！
pvs                # 打印所有 pv
# 创建 vg
vgcreate VG_TEST /dev/sdb /dev/sdc
vgdisplay VG_TEST  # 打印某 vg 属性
```

### 创建文件系统（LV）

```bash
# 创建 lv
lvcreate -L 500M -n lv_test1 VG_TEST
lvs  # 查看所有 lv
# 查看对应的块设备（位于 /dev/mapper/ 目录下以及 /dev/<VG_NAME>/<LV_NAME>）
ls -al /dev/mapper/VG_TEST-lv_test1
mkfs.ext4 /dev/mapper/VG_TEST-lv_test1  # 格式化文件系统
mkdir -p /mnt/test-lv1
mount -t ext4 /dev/mapper/VG_TEST-lv_test1 /mnt/test-lv1  # 挂载
echo abc > /mnt/test-lv1/abc
cat /mnt/test-lv1/abc
df -h /mnt/test-lv1
# umount /mnt/test-lv1  # 恢复现场
```

### 文件系统在线扩容 (LV)

```bash
# 第一步: 扩容 LV
lvresize -L +700M /dev/mapper/VG_TEST-lv_test1
lvs
# 第二步: 文件系统扩容 (ext4 文件系统支持，其他文件系统可能不支持)
resize2fs /dev/mapper/VG_TEST-lv_test1
df -h /mnt/test-lv1
```

注意：

* 不要求 umount
* 执行顺序不能颠倒

### 文件系统离线缩容 (LV)

```bash
# 第一步： umount
umount /mnt/test-lv1
# 第二步： 检查文件系统 (ext4 文件系统支持，其他文件系统可能不支持)
e2fsck -f /dev/mapper/VG_TEST-lv_test1
# 第三步： 文件系统缩容 (ext4 文件系统支持，其他文件系统可能不支持)
resize2fs /dev/mapper/VG_TEST-lv_test1 500M
# 第四步： 缩容 LV
lvreduce -L 500M /dev/mapper/VG_TEST-lv_test1
# 验证
mount -t ext4 /dev/mapper/VG_TEST-lv_test1 /mnt/test-lv1  # 挂载
cat /mnt/test-lv1/abc
df -h /mnt/test-lv1
# umount /mnt/test-lv1  # 恢复现场
```

### 硬盘迁移到新设备

> 注意：如下是不停机迁移，如果旧设备可以关机，则直接关机将硬盘插入新设备即可，无需做任何操作。

如下命令在旧设备中执行。

```bash
# 0. 卸载 lv 所有挂载点
# umount /mnt/test-lv1
# 1. 停用所有 lv
lvchange -an /dev/mapper/VG_TEST-lv_test1
# 2. 停用卷组
vgchange -an VG_TEST
# 3. 导出卷组
vgexport VG_TEST
```

拔下所有硬盘，插入新设备。

如下命令在新设备中执行。

```bash
# 1. 扫描 pv
pvscan
vgs
# 2. 导入 vg
vgimport VG_TEST
# 3. 激活 vg
vgchange -ay VG_TEST
# 4. 挂载到挂载点
mkdir -p /mnt/test-lv1
mount -t ext4 /dev/mapper/VG_TEST-lv_test1 /mnt/test-lv1  # 挂载
cat /mnt/test-lv1/abc
```

### 扩充存储池（VG）

```bash
pvcreate /dev/sdd
vgextend VG_TEST /dev/sdd
```

### 软 RAID

略，参见：

* [扫盲 Linux 逻辑卷管理（LVM） — — 兼谈 RAID 以及“磁盘加密工具的整合”](https://program-think.medium.com/%E6%89%AB%E7%9B%B2-linux-%E9%80%BB%E8%BE%91%E5%8D%B7%E7%AE%A1%E7%90%86-lvm-%E5%85%BC%E8%B0%88-raid-%E4%BB%A5%E5%8F%8A-%E7%A3%81%E7%9B%98%E5%8A%A0%E5%AF%86%E5%B7%A5%E5%85%B7%E7%9A%84%E6%95%B4%E5%90%88-170e975320a7)
* [lvcreate(8) - Linux man page](https://linux.die.net/man/8/lvcreate)
