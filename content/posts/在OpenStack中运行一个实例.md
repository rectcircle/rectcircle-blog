---
title: 在OpenStack中运行一个实例
date: 2018-11-23T10:23:35+08:00
draft: false
toc: false
comments: true
aliases:
  - /detail/179
  - /detail/179/
tags:
  - devops
---

## 目录

> 参考：[官方文档](https://docs.openstack.org/)

* [三、OpenStack运行一个实例](#三、OpenStack运行一个实例)
	* [1、命令行工具和仪表盘](#1、命令行工具和仪表盘)
	* [2、创建虚拟网络](#2、创建虚拟网络)
	* [3、创建m1.nano flavor](#3、创建m1.nano flavor)
	* [4、创建一对秘钥](#4、创建一对秘钥)
	* [5、运行实例](#5、运行实例)
	* [6、其他可选配置](#6、其他可选配置)


## 三、OpenStack运行一个实例
***

### 1、命令行工具和仪表盘

* [命令行客户端](https://docs.openstack.org/python-openstackclient/rocky/cli/command-objects/server.html#server-create)
* [仪表盘](https://docs.openstack.org/horizon/rocky/user/)


### 2、创建虚拟网络

**网络选项2：自服务网络**

目前的虚拟机网络情况

* 存在两个网段
	* 主要用于联网、虚拟机交互的网段`192.168.2.0/24`（相当于文档中管理网络）
	* 仅用于ssh的网段`192.168.3.0/24`
* Controller 
	* 网卡`enp0s3`绑定IP`192.168.2.101`
	* 网卡`enp0s8`绑定IP`192.168.3.101`
* Compute
	* 网卡`enp0s3`绑定IP`192.168.2.101`
	* 网卡`enp0s8`绑定IP`192.168.3.101`

现在需要添加一个新的**提供者网络**，所以需要配置网卡（在我的虚拟机上为`enp0s9`），**所有节点**

网卡配置如下

```
TYPE=Ethernet
BOOTPROTO="none"
NAME=enp0s9
UUID=d200ef80-f8b1-4e88-a60d-50a0adcba75e # 通过 uuidgen enp0s9 创建
DEVICE=enp0s9
ONBOOT=yes
```

* 网段为`203.0.113.0/24`网关为`203.0.113.1`

此时需要修改配置文件（所有节点都要更改）为该对应网卡`/etc/neutron/plugins/ml2/linuxbridge_agent.ini`

```ini
physical_interface_mappings = provider:enp0s9
```

虚拟机内部使用的网段，根据文档选择如下

* `172.16.1.0/24`

#### （1）创建自服务网络

**在控制节点执行**

**先创建提供者网络**

```bash
source env/admin-openrc
openstack network create  --share --external \
--provider-physical-network provider \
--provider-network-type flat provider

openstack subnet create --network provider \
  --allocation-pool start=203.0.113.101,end=203.0.113.250 \
  --dns-nameserver 114.114.114.114  --gateway 203.0.113.1 \
  --subnet-range 203.0.113.0/24 provider
```

**创建自服务网络**

```bash
source env/demo-openrc
openstack network create selfservice

# 创建子网
openstack subnet create --network selfservice \
  --dns-nameserver 114.114.114.114 --gateway 172.16.1.1 \
  --subnet-range 172.16.1.0/24 selfservice
```

* `--dns-nameserver` dns服务器ip，可以从`/etc/resolv.conf`获得
* `--gateway` 自服务网关
* `--subnet-range`  子网范围


创建一个路由

```bash
source env/demo-openrc
openstack router create router
openstack router add subnet router selfservice
openstack router set router --external-gateway provider # 网络名
```

验证操作

```bash
source env/admin-openrc
ip netns
openstack port list --router router
ping -c 4 203.0.113.101
```


### 3、创建m1.nano flavor

```bash
openstack flavor create --id 0 --vcpus 1 --ram 64 --disk 1 m1.nano
```


### 4、创建一对秘钥

```bash
source env/demo-openrc
ssh-keygen -q -N ""
openstack keypair create --public-key ~/.ssh/id_rsa.pub mykey

# 配置安全组
openstack security group rule create --proto icmp default # 允许ping
openstack security group rule create --proto tcp --dst-port 22 default # 允许ssh
```


### 5、运行实例

**网络选项2**

查看环境信息

```bash
source env/demo-openrc
openstack flavor list
openstack image list
openstack network list
openstack security group list
```

创建一个实例

```bash
#创建自服务网络的ID
# 其中net-id为openstack network list显示的selfservice项的ID
openstack server create --flavor m1.nano --image cirros \
  --nic net-id=27fed14d-f627-4991-89a1-f42940dcd8f2 --security-group default \
  --key-name mykey selfservice-instance
	
openstack server list
```

创建ip

```bash
openstack console url show selfservice-instance
```

ssh连接

* 创建浮动ip
* 给实例分配浮动ip


### 6、其他可选配置

略


