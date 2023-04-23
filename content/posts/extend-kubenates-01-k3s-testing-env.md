---
title: "扩展 Kubernetes （一） k3s 测试环境搭建"
date: 2023-04-22T20:00:00+08:00
draft: false
toc: true
comments: true
tags:
  - untagged
---

## 系列概述

Kubernetes 是高度可扩展的。即 Kubernetes 可以在不修改 Kubernetes 源码的情况下，提供 Kubernetes 原生不具备的能力。

Kubernetes 扩展点众多，本系列无法一一枚举，因此本系列将从具体场景和实践出发，介绍 Kubernetes 的部分扩展点。

本系列未提到的 Kubernetes 扩展能力，可以参见 Kubernetes 官方文档：[扩展 Kubernetes](https://kubernetes.io/zh-cn/docs/concepts/extend-kubernetes/)。

本系列假设读者了解 Kubernetes 的基本使用，理解 Kubernetes 的基本概念，如 Pod、Deployment、PV、PVC 等。

## k3s 简述

要对 Kubernetes 进行扩展开发，需要搭建一个 Kubernetes 测试环境，本系列将在一台 Linux 虚拟机上使用 k3s 搭建一个 Kubernetes 测试集群。

选择 k3s 的原因是：

* 完全兼容 Kubernetes。
* 生产就绪，轻量级。
* CNCF Sandbox 项目。
* 维护者是 Rancher Labs （创始人为华人 [Sheng Liang（梁胜）](https://2d2d.io/s1/rancher/)），2020 被 SUSE （号称全球最大的独立开源公司）收购。

关于 k3s 的简述，参见： [K3s - 轻量级 Kubernetes](https://docs.k3s.io/zh/)。

k3s 除了支持单机部署一个集群外，还支持如下场景，比如：

* 高可用部署：
    * [多 server 并使用外部数据库](https://docs.k3s.io/zh/architecture#%E5%85%B7%E6%9C%89%E5%A4%96%E9%83%A8%E6%95%B0%E6%8D%AE%E5%BA%93%E7%9A%84%E9%AB%98%E5%8F%AF%E7%94%A8-k3s-server)
    * [server 禁用 agent](https://docs.k3s.io/zh/advanced#%E8%BF%90%E8%A1%8C%E6%97%A0-agent-%E7%9A%84-server%E5%AE%9E%E9%AA%8C%E6%80%A7)
    * 为多个 server 配置一个 4 层 LB。
    * agent 独立部署，配置 server 为上一步的 LB 地址。
* 混合云：[支持 agent 部署在不同的内网中](https://docs.k3s.io/zh/installation/network-options#%E5%88%86%E5%B8%83%E5%BC%8F%E6%B7%B7%E5%90%88%E6%88%96%E5%A4%9A%E4%BA%91%E9%9B%86%E7%BE%A4)。
* [IPv4、IPv6 双栈](https://docs.k3s.io/zh/installation/network-options#%E5%8F%8C%E6%A0%88-ipv4--ipv6-%E7%BD%91%E7%BB%9C)。

更多参见：[官方文档](https://docs.k3s.io/zh/)。

## 安装 k3s

> version: [v1.26.3+k3s1](https://github.com/k3s-io/k3s/tree/v1.26.3+k3s1)

在使用 systemd 或 openrc 的 Linux x86_64 或 amd 操作系统 （kernal version >= 5.1） 中执行如下安装命令（详细要求参见：[官方文档 - 要求](https://docs.k3s.io/zh/installation/requirements)）：

```bash
# curl -sfL https://get.k3s.io | sh -
# 中国大陆
curl -sfL https://rancher-mirror.rancher.cn/k3s/k3s-install.sh | INSTALL_K3S_MIRROR=cn sh -
sudo chmod 666 /etc/rancher/k3s/k3s.yaml # 仅测试，让当前机器其他用户可以直接通过 kubectl 操作集群。
```

输出如下：

```
[INFO]  Finding release for channel stable
[INFO]  Using v1.26.3+k3s1 as release
[INFO]  Downloading hash rancher-mirror.rancher.cn/k3s/v1.26.3-k3s1/sha256sum-amd64.txt
[INFO]  Downloading binary rancher-mirror.rancher.cn/k3s/v1.26.3-k3s1/k3s
[INFO]  Verifying binary download
[INFO]  Installing k3s to /usr/local/bin/k3s
[INFO]  Skipping installation of SELinux RPM
[INFO]  Creating /usr/local/bin/kubectl symlink to k3s
[INFO]  Creating /usr/local/bin/crictl symlink to k3s
[INFO]  Creating /usr/local/bin/ctr symlink to k3s
[INFO]  Creating killall script /usr/local/bin/k3s-killall.sh
[INFO]  Creating uninstall script /usr/local/bin/k3s-uninstall.sh
[INFO]  env: Creating environment file /etc/systemd/system/k3s.service.env
[INFO]  systemd: Creating service file /etc/systemd/system/k3s.service
[INFO]  systemd: Enabling k3s unit
Created symlink /etc/systemd/system/multi-user.target.wants/k3s.service → /etc/systemd/system/k3s.service.
[INFO]  systemd: Starting k3s
```

脚本主要行为 （分析 get.k3s.io 脚本）：

* 校验系统：确保当前系统存在 systemd 或 openrc。
* 下载安装 k3s 二进制文件到 `/usr/local/bin/` 目录。
* 在 `/usr/local/bin` 创建软链 kubectl crictl ctr 指向 k3s 二进制文件。
* 在 `/usr/local/bin` 创建 `k3s-killall.sh`、`k3s-uninstall.sh` 脚本。
* 创建环境变量文件 `/etc/systemd/system/k3s.service.env`。
* 安装 systemd service 到 `/etc/systemd/system/k3s.service`，并启动该 service。

在安装阶段，安装脚本安装的文件如下所示：

```
/usr/local/bin/
  k3s                # 唯一的可执行文件
  kubectl -> k3s
  crictl -> k3s
  ctr -> k3s
  k3s-killall.sh     # 停止服务的脚本
  k3s-uninstall.sh   # 卸载 k3s 的脚本

/etc/systemd/system/
  k3s.service.env    # 环境变量
  k3s.service
```

## 运行分析

### 配置和数据目录

在运行，k3s 会产生如下目录和文件。

```
/etc/rancher/
  k3s/k3s.yaml           # kubectl
  node/password          # 节点秘钥
/run/
  k3s/containerd/        # containerd 相关文件目录
  flannel/subnet.env     # flannel 网络配置
/var/lib/
  rancher/k3s/           # k3s 数据目录
  kubelet/               # kubelet 数据目录
```

### 进程和架构分析

```bash
ps -ef -w w
```

![image](/image/how-it-works-k3s-revised-9c025ef482404bca2e53a89a0ba7a3c5.svg)

* `/usr/local/bin/k3s server` k3s server 进程，包含：
    * `supervisor` 和 `tunnel proxy` kubernetes apiserver 和 kubelet 之间在边缘计算场景单向网络的问题（[apiserver -> kubelet 方向](https://kubernetes.io/zh-cn/docs/concepts/architecture/control-plane-node-communication/#api-server-to-kubelet)，在边缘场景无法通讯问题）。
    * 默认网络组件 `Flunnel`。
    * 多个 [Kubernetes 控制面组件](https://kubernetes.io/zh-cn/docs/concepts/overview/components/#control-plane-components)：
        * apiserver
        * sqlite (替代 etcd)
        * scheduler
        * controller manager
    * 多个 [Kubernetes Node 组件](https://kubernetes.io/zh-cn/docs/concepts/overview/components/#node-components)：
        * kubelet
        * kube-proxy

    可以看出，all in one，这就是 k3s 和标准 Kubernetes 的核心区别

* `containerd -c /var/lib/rancher/k3s/agent/etc/containerd/config.toml -a /run/k3s/containerd/containerd.sock --state /run/k3s/containerd --root /var/lib/rancher/k3s/agent/containerd` containerd 进程，默认会启动如下容器（k3s 称为封装的[组件](https://docs.k3s.io/zh/installation/packaged-components#%E5%B0%81%E8%A3%85%E7%9A%84%E7%BB%84%E4%BB%B6)）：
    * `traefik` 默认 ingress controller。
    * `metrics-server` 容器。
    * `local-path-provisioner` 利用本地磁盘实现 pvc 的一个存储类。
    * `coredns` core dns。

## 安装 Kubernetes 仪表板

参见：[官方文档](https://docs.k3s.io/zh/installation/kube-dashboard)。

注意，如果浏览器和 k3s server 不在同一设备执行如下命令：

```bash
# k3s 所在设备执行
kubectl proxy
# 浏览器所在设备执行
ssh -L localhost:8001:localhost:8001 -NT dev # dev 为 k3s 所在设备的 host
```

打开浏览器，访问：  http://localhost:8001/api/v1/namespaces/kubernetes-dashboard/services/https:kubernetes-dashboard:/proxy/ 。

token 通过如下方式获取：

```bash
kubectl -n kubernetes-dashboard create token admin-user
```
