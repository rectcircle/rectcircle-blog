---
title: "AWS Firecracker 轻量级虚拟机"
date: 2021-03-21T19:44:02+08:00
draft: false
toc: true
comments: true
tags:
  - linux
---

## 简介

firecracker 是 aws 开源的轻量级虚拟机，具有毫秒级别的启动速度。

相较 Docker 其拥有独立的内核和更好的安全性。

使用 Rust 基于 KVM 实现，通过阉割掉传统虚拟机不必要的能力实现快速启动。

更多细节参见

* [Github](https://github.com/firecracker-microvm/firecracker)
* [Github/docs](https://github.com/firecracker-microvm/firecracker/tree/master/docs)
* [深度解析 AWS Firecracker 原理篇 – 虚拟化与容器运行时技术](https://aws.amazon.com/cn/blogs/china/deep-analysis-aws-firecracker-principle-virtualization-container-runtime-technology/)
* [宣布推出 Firecracker 开源技术：适用于无服务器计算的安全、快速的 microVM](https://aws.amazon.com/cn/blogs/china/firecracker-open-source-secure-fast-microvm-serverless/)

## 实验

> [Get started](https://github.com/firecracker-microvm/firecracker/blob/master/docs/getting-started.md)

### 准备

#### 机器

* 一台 Linux 物理机 或 支持嵌套虚拟化的虚拟机
* x86_64 架构
* 内核版本 4.14+，通过 `uname -a` 查看
* 给当前用户添加 `/dev/kvm` 设备的读写权限
    * `sudo apt install acl`
    * `sudo setfacl -m u:${USER}:rw /dev/kvm`

#### 资源

下载 firecracker 二进制文件，并重命名

```bash
release_url="https://github.com/firecracker-microvm/firecracker/releases"
latest=$(basename $(curl -fsSLI -o /dev/null -w  %{url_effective} ${release_url}/latest))
arch=`uname -m`
curl -L ${release_url}/download/${latest}/firecracker-${latest}-${arch}.tgz \
| tar -xz
mv firecracker-${latest}-$(uname -m) firecracker
```

下载 Linux 内核

```bash
wget https://s3.amazonaws.com/spec.ccfc.min/img/quickstart_guide/x86_64/kernels/vmlinux.bin
```

下载 根文件系统

```bash
wget https://s3.amazonaws.com/spec.ccfc.min/img/hello/fsfiles/hello-rootfs.ext4
```

### 运行

打开两个 shell

第一个 shell 启动 firecracker

```bash
rm -f /tmp/firecracker.socket
./firecracker --api-sock /tmp/firecracker.socket
```

第二个 shell 操作 firecracker

```bash
# 设置虚拟器内核
kernel_path=$(pwd)/vmlinux.bin
curl --unix-socket /tmp/firecracker.socket -i \
    -X PUT 'http://localhost/boot-source'   \
    -H 'Accept: application/json'           \
    -H 'Content-Type: application/json'     \
    -d "{
        \"kernel_image_path\": \"${kernel_path}\",
        \"boot_args\": \"console=ttyS0 reboot=k panic=1 pci=off\"
      }"
# 设置虚拟机根文件系统
rootfs_path=$(pwd)/hello-rootfs.ext4
curl --unix-socket /tmp/firecracker.socket -i \
  -X PUT 'http://localhost/drives/rootfs' \
  -H 'Accept: application/json'           \
  -H 'Content-Type: application/json'     \
  -d "{
        \"drive_id\": \"rootfs\",
        \"path_on_host\": \"${rootfs_path}\",
        \"is_root_device\": true,
        \"is_read_only\": false
   }"
# 可选的配置虚拟机的资源
curl --unix-socket /tmp/firecracker.socket -i  \
  -X PUT 'http://localhost/machine-config' \
  -H 'Accept: application/json'            \
  -H 'Content-Type: application/json'      \
  -d '{
      "vcpu_count": 2,
      "mem_size_mib": 1024,
      "ht_enabled": false
  }'
# 运行虚拟机
curl --unix-socket /tmp/firecracker.socket -i \
  -X PUT 'http://localhost/actions'       \
  -H  'Accept: application/json'          \
  -H  'Content-Type: application/json'    \
  -d '{
      "action_type": "InstanceStart"
   }'
```

### 测试

前往 第一个 shell，输入 `root` 和 `root` 即可登录该虚拟机

### 关机

```bash
curl --unix-socket /tmp/firecracker.socket -i \
  -X PUT 'http://localhost/actions'       \
  -H  'Accept: application/json'          \
  -H  'Content-Type: application/json'    \
  -d '{
      "action_type": "SendCtrlAltDel"
   }'
```

### 更多

网络/镜像制作等，参见 [Github/docs](https://github.com/firecracker-microvm/firecracker/tree/master/docs)
