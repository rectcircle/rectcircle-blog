---
title: "容器核心技术（九） CGroup"
date: 2022-10-15T00:15:42+08:00
draft: true
toc: true
comments: true
tags:
  - 云原生
---

## 概述

https://tech.meituan.com/2015/03/31/cgroups.html

event 事件通知 https://www.jianshu.com/p/f2403e33c766
runc https://www.jianshu.com/p/7c18075aa735
docker cgroup 配置 https://www.jianshu.com/p/fdfeabcb08b4
cgroup namespace https://hustcat.github.io/cgroup-namespace/
runc mount v1 https://github.com/opencontainers/runc/blob/main/libcontainer/rootfs_linux.go#L234 https://github.com/opencontainers/runc/blob/25c9e888686773e7e06429133578038a9abc091d/libcontainer/rootfs_linux.go#L234 binding 的方式。

原理：

* docker
    * 在宿主机的 /sys/fs/cgroup/$hierarchy/docker/容器ID
    * mount binding 到 rootfs 的 /sys/fs/cgroup/$hierarchy
* k8s
    * https://kubernetes.io/zh-cn/docs/concepts/scheduling-eviction/pod-overhead/
    * /sys/fs/cgroup/memory/kubepods/podd7f4b509-cf94-4951-9417-d1087c92a5b2

## cgroup v1

### 配置 debian 11 使用 v1

> 参考：[在新 Linux 发行版上切换 cgroups 版本](https://www.vvave.net/archives/introduction-to-linux-kernel-control-groups-v2.html)

Debian 11 已经默认启用了 cgroup v2。可以通过如下方式切换到 cgroup v1：

编辑 `/etc/default/grub`。

```
# GRUB_CMDLINE_LINUX_DEFAULT="quiet"
GRUB_CMDLINE_LINUX_DEFAULT="quiet systemd.unified_cgroup_hierarchy=false systemd.legacy_systemd_cgroup_controller=false"
```

执行生成 grub 配置。

```bash
sudo grub-mkconfig -o /boot/grub/grub.cfg
```

重启系统。

```bash
sudo reboot
```

### 实验

## cgroup v2

## 实验

### 实验设计

### 实验输出

## 参考
