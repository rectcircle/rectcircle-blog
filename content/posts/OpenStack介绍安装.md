---
title: OpenStack介绍安装
date: 2018-10-30T10:25:04+08:00
draft: false
toc: false
comments: true
aliases:
  - /detail/172
  - /detail/172/
tags:
  - devops
---

## 目录

> 参考：[官方文档](https://docs.openstack.org/)
> [一键式安装](https://docs.openstack.org/training_labs/)



* [一、OpenStack介绍](#一、OpenStack介绍)
	* [1、OpenStack简介](#1、OpenStack简介)
	* [2、OpenStack基本组件](2、OpenStack基本组件)
* [二、OpenStack安装](#二、OpenStack安装)
	* [1、环境条件](#1、环境条件)
	* [2、认证服务](#2、认证服务)
	* [3、镜像服务](#3、镜像服务)
	* [4、计算服务](#4、计算服务)
	* [5、网络服务](#5、网络服务)
	* [6、仪表盘](#6、仪表盘)
	* [7、块存储服务](#7、块存储服务)


## 〇、安装虚拟机

**~~命令行安装（没有成功）~~** 
```bash
# 配置语言环境
sudo dpkg-reconfigure locales
# 安装KVM
# sudo apt install qemu-kvm libvirt-clients libvirt-daemon-system
sudo apt-get install qemu-kvm libvirt-bin

# 将用户添加到用户组
# adduser <youruser> libvirt
# adduser <youruser> libvirt-qemu

sudo adduser <youruser> kvm
sudo adduser <youruser> libvirt

# 查看虚拟机列表
virsh list --all

# 连接虚拟机
virsh --connect qemu:///system list --all

# 安装虚拟机安装工具
sudo apt install virtinst

# 获取镜像
wget http://mirrors.163.com/centos/7.5.1804/isos/x86_64/CentOS-7-x86_64-Minimal-1804.iso

# 创建配置网桥
brctl addbr br0
# 网络模式选择说明：
# 在ip资源受限的情况下不能使用桥接模式
# 应该使用

# 安装虚拟机
virt-install --connect qemu:///system  --name centos-controller --ram 4096 --vcpus=1 --location  /home/sunben.96/download/CentOS-7-x86_64-Minimal-1804.iso --disk path=/home/sunben.96/vm-disk/centos7-controller.qcow2,size=20,format=qcow2 --network network=default --os-type=linux --os-variant=rhel6 --extra-args='console=ttyS0' --force
```


#### （1）安装虚拟机软件

使用开源免费的[virtualbox](https://www.virtualbox.org/)


#### （2）下载镜像

这里选择最新版的 [centos7.5.1804](http://mirrors.163.com/centos/7.5.1804/isos/x86_64/CentOS-7-x86_64-Minimal-1804.iso)

#### （3）创建虚拟机

网络设计：

* 虚拟机使用NAT方式联网和相互沟通：可以访问宿主机，可以访问周围虚拟机，可以访问互联网，宿主机不能访问虚拟机（对应文档的管理网络）
	* 地址段为：192.168.2.0/24
	* 网关为：192.168.2.1
	* controller节点为：192.168.2.101 对应网卡为`enp0s3`
	* compute节点为：192.168.2.102 对应网卡为`enp0s3`
* 宿主机连接管理虚拟机使用Only_Host方式：主机宿主机可双向访问：用于ssh连接http服务开放宿主机访问的能力（仅仅为了ssh连接使用，文档中无对应）
	* 地址段为：192.168.3.0/24
	* 网关为：192.168.3.1
	* controller节点为：192.168.3.101 对应的网卡为`enp0s8`
	* compute节点为：192.168.3.102`enp0s8`
* 提供者网络（注意使用仅主机模式）
	* 地址段为：203.0.113.0/24
	* 网关为：203.0.113.1
	* controller节点为： 对应网卡为`enp0s9`
	* compute节点为： 对应网卡为`enp0s9`

提供者网络配置

编辑文件`/etc/sysconfig/network-scripts/ifcfg-enp0s9`
```
TYPE=Ethernet
BOOTPROTO="none"
NAME=enp0s9
UUID=d200ef80-f8b1-4e88-a60d-50a0adcba75e # 通过 uuidgen enp0s9 创建
DEVICE=enp0s9
ONBOOT=yes
```

配置情况：

Controller节点：

* CPU 1
* RAM 4096
* disk 20G
* centos7.5.1804 最小化安装

Compute节点：

* CPU 1
* RAM 2048
* disk 10G
* centos7.5.1804 最小化安装


安装完成后的基本配置：

```bash
# 对应编辑你的网卡配置文件
vi /etc/sysconfig/network-scripts/ifcfg-enp0s3
# 启用 ONBOOT=yes

#重启服务
service network restart

# 测试是否可以连接外网
ping www.baidu.com

# 更新系统
yum -y update

# 安装网络管理工具包
yum -y install net-tools

# 所有节点关闭selinux，者非常重要

# 关机
shutdown now
```

配置两个网卡

* 都不适用DHCP，因为ip需要固定方便管理
* NAT网络设置：
	* 全局设置（**不是虚拟机设置**）-> 网络 -> 新建一个NAT网络，配置如上描述
Host_Only网络设置：
	* 路径可能在如下两个：
	* 旧版 全局设置（**不是虚拟机设置**）-> 网络 -> 新建一个NAT网络
	* MAC最新版 菜单 -> 管理 -> 主机网络管理器
* 配置虚拟机网络
	* 网卡1 -> 选择界面
	* 网卡2 -> 选择界面

重启机器

* ifconfig 查看两张网卡名字
* 使用nmtui配置网卡
	* 编译配置
	* 激活配置
	* ping测试

可以创建一个sudo用户，配置使用公私钥登录虚拟机

虚拟机节点Compute，可以从Controller复制，使用`nmtui`修改网络配置即可


## 一、OpenStack介绍
***

配置注意事项：

* 不能有中文注释
* 所有节点关闭Selinux

### 1、OpenStack简介
OpenStack是一个云操作系统，通过数据中心可控制大型的计算、存储、网络等资源池。所有的管理通过前端界面管理员就可以完成，同样也可以通过web接口让最终用户部署资源。

就是一个服务器集群资源分配管理系统

### 2、OpenStack基本组件
* Horion：UI组件，用户控制面板，提供两套、分别针对管理员和用户
	* 提供了一个基于web的自服务门户，与OpenStack底层服务交互，诸如启动一个实例，分配IP地址以及配置访问控制。
* KeyStone：认证鉴权模块
	* 为其他OpenStack服务提供认证和授权服务，为所有的OpenStack服务提供一个端点目录。
* Neutron：网络组件（配置虚拟机网络、分配IP等）
	* 确保为其它OpenStack服务提供网络连接即服务，比如OpenStack计算。为用户提供API定义网络和使用。基于插件的架构其支持众多的网络提供商和技术。
* Cinder：块存储（为虚拟机提供挂载盘）
	* 为运行实例而提供的持久性块存储。它的可插拔驱动架构的功能有助于创建和管理块存储设备。
* Nova：计算资源管理组件（创建选择虚拟机）
	* 在OpenStack环境中计算实例的生命周期管理。按需响应包括生成、调度、回收虚拟机等操作。
* Glance：镜像仓库
	* 存储和检索虚拟机磁盘镜像，OpenStack计算会在实例部署时使用此服务。
* Swift：对象存储
	* 通过一个 RESTful,基于HTTP的应用程序接口存储和任意检索的非结构化数据对象。它拥有高容错机制，基于数据复制和可扩展架构。它的实现并像是一个文件服务器需要挂载目录。在此种方式下，它写入对象和文件到多个硬盘中，以确保数据是在集群内跨服务器的多份复制。
* Ceilometer：监控
	* 为OpenStack云的计费、基准、扩展性以及统计等目的提供监测和计量。
* Heat
	* Orchestration服务支持多样化的综合的云应用，通过调用OpenStack-native REST API和CloudFormation-compatible Query API，支持:term:`HOT <Heat Orchestration Template (HOT)>`格式模板或者AWS CloudFormation格式模板


## 二、OpenStack安装

***

> [参考](https://docs.openstack.org/install-guide)

测试环境centos 7.5.1804

注意OpenStack版本众多，一定要参考官方文档的对应版本。

本文参考的是Rocky (August 2018)（其实应该理解为分支才对，每个版本都独自更新维护）

而通过命令查看的版本是这个大版本下的小版本

注意创建备份

### 1、环境条件

至少要有两个节点，配置如下：

* 控制节点: 1 处理器, 4 GB 内存, 及5 GB 存储
* 计算节点: 1 处理器, 2 GB 内存, 及10 GB 存储

简单起见使用密码做安全认证

假设使用如下网络结构化：

* ~~管理使用 10.0.0.0/24 带有网关 10.0.0.1~~
	* ~~这个网络需要一个网关以为所有节点提供内部的管理目的的访问，例如包的安装、安全更新、 DNS，和 NTP。~~
* ~~提供者网段 203.0.113.0/24，网关203.0.113.1~~
	* ~~这个网络需要一个网关来提供在环境中内部实例的访问。~~

参考以上虚拟机配置

配置hosts文件，添加如下配置：
```host
192.168.2.101 controller
192.168.2.102 compute
```

**安装网络时间同步协议（NTP）**

分布式系统要保持一致性一般都需要统一的时钟源。NTP就是时间服务

控制节点
* `yum install chrony`
* 编辑`/etc/chrony.conf`
	* 编译远端服务器`server NTP_SERVER iburst`（表示时间同步服务器的配置，控制节点默认即可）
	* 编辑放行端口~~`allow 10.0.0.0/24`~~，（`allow 192.168.2.0/24`）
* 重启并设置自启
	* `systemctl enable chronyd.service`
	* `systemctl start chronyd.service`

其他节点
* `yum install chrony`
* 编辑`/etc/chrony.conf`
	* 编译远端服务器`server controller iburst`注释其他全部
* 重启并设置自启
	* `systemctl enable chronyd.service`
	* `systemctl start chronyd.service`

验证操作
* 两个节点分别运行`chronyc sources`

#### （1）安装OpenStack库

所有节点都需要

```bash
# 这一步非常重要，安装OpenStack指定的版本库
yum install centos-release-openstack-rocky # 根据版本选择
yum upgrade
yum install python-openstackclient
```


#### （2）安装MySql数据库

大多数 OpenStack 服务使用 SQL 数据库来存储信息。 典型地，数据库运行在**控制节点**上。

```bash
yum install mariadb mariadb-server python2-PyMySQL -y
```

创建并编辑 `/etc/my.cnf.d/openstack.cnf`

```ini
[mysqld]
#bind-address = 10.0.0.11 #适当的绑定地址，根据自己子网情况而定，如果重启失败，注释掉本条
bind-address = 192.168.2.101
default-storage-engine = innodb
innodb_file_per_table
max_connections = 4096
collation-server = utf8_general_ci
character-set-server = utf8
```

重启并加固
```bash
systemctl enable mariadb.service
systemctl start mariadb.service
mysql_secure_installation
```


#### （4）消息队列

OpenStack 使用 message queue 协调操作和各服务的状态信息。消息队列服务一般运行在**控制节点**上。

本指南安装 RabbitMQ 消息队列服务，因为大部分发行版本都支持它。如果你想安装不同的消息队列服务，查询与之相关的文档。

```bash
# 安装
yum install rabbitmq-server
# 启动服务
systemctl enable rabbitmq-server.service
systemctl start rabbitmq-server.service
# 添加用户密码
rabbitmqctl add_user openstack 123456
# 设置权限
rabbitmqctl set_permissions openstack ".*" ".*" ".*"
```

#### （5）memecached
认证服务认证缓存使用Memcached缓存令牌。缓存服务memecached运行在**控制节点**。在生产部署中，我们推荐联合启用防火墙、认证和加密保证它的安全。

```bash
yum install memcached python-memcached
# 编辑  /etc/sysconfig/memcached 文件和配置服务使用控制节点管理IP地址，以此使其它节点通过管理网访问控制节点。
# OPTIONS="-l 127.0.0.1,::1,controller"
systemctl enable memcached.service
systemctl start memcached.service
```

#### （6）安装ETCD

OpenStack服务可以使用ETCD，一种分布式可靠的密钥值存储，用于分布式密钥锁定、存储配置、跟踪服务生存度和其他场景。一般装在**控制节点**

```bash
yum install etcd
```

编辑/etc/etcd/etcd.conf文件，并将ETCD_INITIAL_CLUSTER、ETCD_INITIAL_ADVERTISE_PEER_URLS、ETCD_ADVERTISE_CLIENT_URLS、ETCD_LISTEN_CLIENT_URLS设置为控制器节点的管理IP地址，以便其他节点能够通过管理网络访问：

```
#[Member]
ETCD_DATA_DIR="/var/lib/etcd/default.etcd"
ETCD_LISTEN_PEER_URLS="http://192.168.2.101:2380"
ETCD_LISTEN_CLIENT_URLS="http://192.168.2.101:2379"
ETCD_NAME="controller"
#[Clustering]
ETCD_INITIAL_ADVERTISE_PEER_URLS="http://192.168.2.101:2380"
ETCD_ADVERTISE_CLIENT_URLS="http://192.168.2.101:2379"
ETCD_INITIAL_CLUSTER="controller=http://192.168.2.101:2380"
ETCD_INITIAL_CLUSTER_TOKEN="etcd-cluster-01"
ETCD_INITIAL_CLUSTER_STATE="new"
```

自启启动

```bash
systemctl enable etcd
systemctl start etcd
```


### 2、认证服务

安装在控制节点

#### （1）先决条件

创建数据库和管理员令牌
```sql
# 创建数据库
CREATE DATABASE keystone;
# 对``keystone``数据库授予恰当的权限：
# KEYSTONE_DBPASS 为令牌密码（123456）
GRANT ALL PRIVILEGES ON keystone.* TO 'keystone'@'localhost' \
  IDENTIFIED BY '123456';
GRANT ALL PRIVILEGES ON keystone.* TO 'keystone'@'%' \
  IDENTIFIED BY '123456';
```

#### （2）安装

```bash
yum install openstack-keystone httpd mod_wsgi
```

#### （3）配置

配置`/etc/keystone/keystone.conf `

```ini
[database]
#...
connection = mysql+pymysql://keystone:123456@controller/keystone
#将``KEYSTONE_DBPASS``替换为你为数据库选择的密码。

#在``[token]``部分，配置Fernet UUID令牌的提供者。

[token]
provider = fernet # 一种token生成技术
```

初始化身份认证服务数据库

```bash
su -s /bin/sh -c "keystone-manage db_sync" keystone
```

初始化Fernet keys：
```bash
keystone-manage fernet_setup --keystone-user keystone --keystone-group keystone
keystone-manage credential_setup --keystone-user keystone --keystone-group keystone
```

启动身份认证服务

```bash
keystone-manage bootstrap --bootstrap-password 123456 \
  --bootstrap-admin-url http://controller:5000/v3/ \
  --bootstrap-internal-url http://controller:5000/v3/ \
  --bootstrap-public-url http://controller:5000/v3/ \
  --bootstrap-region-id RegionOne
```

配置Apache Http服务器

编辑 ` /etc/httpd/conf/httpd.conf`  中 `ServerName controller`
创建链接 `ln -s /usr/share/keystone/wsgi-keystone.conf /etc/httpd/conf.d/`

```bash
systemctl enable httpd.service
systemctl start httpd.service # 要关闭 selinux ，否则报错
```

配置环境变量

```
export OS_USERNAME=admin
export OS_PASSWORD=123456
export OS_PROJECT_NAME=admin
export OS_USER_DOMAIN_NAME=Default
export OS_PROJECT_DOMAIN_NAME=Default
export OS_AUTH_URL=http://controller:5000/v3
export OS_IDENTITY_API_VERSION=3
```

#### （4）创建一个用户

创建一个**域**和**项目**的命令是（不用执行，我们使用default域）：

```bash
openstack domain create --description "An Example Domain" example
```

创建一个service 项目

```bash
openstack project create --domain default \
  --description "Service Project" service
```

执行如下命令创建一个普通用户（默认存在一个admin用户）

```bash
#创建一个project叫做`myproject`
openstack project create --domain default \
  --description "Demo Project" myproject
	
#创建一个用户，输入密码为123456
openstack user create --domain default \
  --password-prompt myuser
#创建一个角色
openstack role create myrole
#将角色添加到项目中
openstack role add --project myproject --user myuser myrole
```

#### （5）验证操作

```bash
unset OS_AUTH_URL OS_PASSWORD
openstack --os-auth-url http://controller:5000/v3 \
  --os-project-domain-name Default --os-user-domain-name Default \
  --os-project-name admin --os-username admin token issue
openstack --os-auth-url http://controller:5000/v3 \
  --os-project-domain-name Default --os-user-domain-name Default \
  --os-project-name myproject --os-username myuser token issue
```

#### （6）创建环境变量脚本

为了方便后面的操作。创建两个环境变量脚本

`~/env/admin-openrc`

```bash
export OS_PROJECT_DOMAIN_NAME=Default
export OS_USER_DOMAIN_NAME=Default
export OS_PROJECT_NAME=admin
export OS_USERNAME=admin
export OS_PASSWORD=123456
export OS_AUTH_URL=http://controller:5000/v3
export OS_IDENTITY_API_VERSION=3
export OS_IMAGE_API_VERSION=2
```

`~/env/demo-openrc`

```bash
export OS_PROJECT_DOMAIN_NAME=Default
export OS_USER_DOMAIN_NAME=Default
export OS_PROJECT_NAME=myproject
export OS_USERNAME=myuser
export OS_PASSWORD=123456
export OS_AUTH_URL=http://controller:5000/v3
export OS_IDENTITY_API_VERSION=3
export OS_IMAGE_API_VERSION=2
```

使用脚本

```bash
. ~/env/admin-openrc
```

### 3、镜像服务

glance 提供镜像管理服务。提供rest http 端点。后端有多种选择：对象存储服务、文件系统。

在本例中，为了简单起见，将文件系统的后端配置为本地文件系统。默认情况下在`/var/lib/glance/images/`目录（控制节点）

镜像服务包括以下几个组件

* glance-api
* glance-registry 存储，处理和检索有关镜像的元数据。元数据包括大小和类型等项目。
* Database
* Storage repository for image files
* Metadata definition service

#### （1）安装在**控制节点**

**创建数据库**

```bash
mysql -u root -p
CREATE DATABASE glance;
# 简单起见将用户密码设为123456
GRANT ALL PRIVILEGES ON glance.* TO 'glance'@'localhost' \
  IDENTIFIED BY '123456';
GRANT ALL PRIVILEGES ON glance.* TO 'glance'@'%' \
  IDENTIFIED BY '123456';
```

**配置用户项目组**

```bash
source env/admin-openrc
# 在默认域创建用户
# 密码简单起见设置为123456
openstack user create --domain default --password-prompt glance
# 配置用户角色admin，并加入service项目
openstack role add --project service --user glance admin
# 创建glance服务实体
openstack service create --name glance \
  --description "OpenStack Image" image
```

**创建Image服务API端点**

```bash
openstack endpoint create --region RegionOne \
  image public http://controller:9292
openstack endpoint create --region RegionOne \
  image internal http://controller:9292
openstack endpoint create --region RegionOne \
  image admin http://controller:9292
```

**安装和配置**

```bash
yum install openstack-glance
```

编辑 `/etc/glance/glance-api.conf`

```ini
[database]
# ...
# 注意密码
connection = mysql+pymysql://glance:123456@controller/glance

[keystone_authtoken]
# ...
www_authenticate_uri  = http://controller:5000
auth_url = http://controller:5000
memcached_servers = controller:11211
auth_type = password
project_domain_name = Default
user_domain_name = Default
project_name = service
username = glance
password = 123456 # 密码

[paste_deploy]
# ...
flavor = keystone

[glance_store]
# ...
stores = file,http
default_store = file
filesystem_store_datadir = /var/lib/glance/images/
```

编辑`/etc/glance/glance-registry.conf`

```ini
[database]
# ...
connection = mysql+pymysql://glance:123456@controller/glance

[keystone_authtoken]
# ...
www_authenticate_uri = http://controller:5000
auth_url = http://controller:5000
memcached_servers = controller:11211
auth_type = password
project_domain_name = Default
user_domain_name = Default
project_name = service
username = glance
password = 123456

[paste_deploy]
# ...
flavor = keystone
```

**初始化数据库**

```bash
su -s /bin/sh -c "glance-manage db_sync" glance
```

启动并配置开机自启

```bash
systemctl enable openstack-glance-api.service \
  openstack-glance-registry.service
systemctl start openstack-glance-api.service \
  openstack-glance-registry.service

```

#### （2）验证操作

```bash
source env/admin-openrc
wget http://download.cirros-cloud.net/0.4.0/cirros-0.4.0-x86_64-disk.img
openstack image create "cirros" \
  --file cirros-0.4.0-x86_64-disk.img \
  --disk-format qcow2 --container-format bare \
  --public
openstack image list
```


### 4、计算服务

计算服务包括如下模块：

* nova-api service 接受并响应最终用户计算API调用。该服务支持OpenStack Compute API。它强制执行某些策略并启动大多数编排活动，例如运行实例。
* nova-api-metadata service 接受来自实例的元数据请求。当您在具有nova-network安装的多主机模式下运行时，通常会使用nova-api-metadata服务。有关详细信息，请参阅“计算管理员指南”中的元数据服务。
* nova-compute service 通过虚拟机管理程序API创建和终止虚拟机实例的工作器守护程序。例如：
	* XenAPI for XenServer/XCP
	* libvirt for KVM or QEMU
	* VMwareAPI for VMware
	* 处理相当复杂。基本上，守护程序接受来自队列的操作并执行一系列系统命令，例如启动KVM实例并更新其在数据库中的状态。
* nova-placement-api service 跟踪每个提供商的库存和使用情况。有关详细信息，请参阅Placement API。
* nova-scheduler service 从队列中获取虚拟机实例请求，并确定它运行的计算服务器主机。
* nova-conductor module Mediates interactions between the nova-compute service and the database. It eliminates direct accesses to the cloud database made by the nova-compute service. The nova-conductor module scales horizontally. However, do not deploy it on nodes where the nova-compute service runs. For more information, see the conductor section in the Configuration Options.
* nova-consoleauth daemon （自18.0.0版开始不推荐使用：nova-consoleauth自18.0.0（Rocky）以来已弃用，将在即将发布的版本中删除。）Authorizes tokens for users that console proxies provide. See nova-novncproxy and nova-xvpvncproxy. This service must be running for console proxies to work. You can run proxies of either type against a single nova-consoleauth service in a cluster configuration. For information, see About nova-consoleauth.
* nova-novncproxy daemon 提供通过VNC连接访问正在运行的实例的代理。支持基于浏览器的novnc客户端。
* nova-spicehtml5proxy daemon 提供通过SPICE连接访问正在运行的实例的代理。支持基于浏览器的HTML5客户端。
* nova-xvpvncproxy daemon 提供通过VNC连接访问正在运行的实例的代理。支持OpenStack特定的Java客户端。队列用于在守护进程之间传递消息的中央集线器。通常用RabbitMQ实现，也可以用另一个AMQP消息队列实现，如  ZeroMQ
* SQL database 存储云基础架构的大多数构建时和运行时状态，包括：
	* Available instance types
	* Instances in use
	* Available networks
	* 从理论上讲，OpenStack Compute可以支持SQLAlchemy支持的任何数据库。常见的数据库是用于测试和开发工作的SQLite3，MySQL，MariaDB和PostgreSQL。

#### （1）安装配置控制节点

**先决条件**

```
mysql -u root -p

CREATE DATABASE nova_api;
CREATE DATABASE nova;
CREATE DATABASE nova_cell0;
CREATE DATABASE placement;

#简单起见所有密码设为123456
GRANT ALL PRIVILEGES ON nova_api.* TO 'nova'@'localhost' \
  IDENTIFIED BY '123456';
GRANT ALL PRIVILEGES ON nova_api.* TO 'nova'@'%' \
  IDENTIFIED BY '123456';

GRANT ALL PRIVILEGES ON nova.* TO 'nova'@'localhost' \
  IDENTIFIED BY '123456';
GRANT ALL PRIVILEGES ON nova.* TO 'nova'@'%' \
  IDENTIFIED BY '123456';

GRANT ALL PRIVILEGES ON nova_cell0.* TO 'nova'@'localhost' \
  IDENTIFIED BY '123456';
GRANT ALL PRIVILEGES ON nova_cell0.* TO 'nova'@'%' \
  IDENTIFIED BY '123456';

GRANT ALL PRIVILEGES ON placement.* TO 'placement'@'localhost' \
  IDENTIFIED BY '123456';
GRANT ALL PRIVILEGES ON placement.* TO 'placement'@'%' \
  IDENTIFIED BY '123456';
```

**使能admin用户**

```bash
source admin-openrc
```

**创建Compute服务凭据**

```bash
# 创建nova用户（密码123456）
openstack user create --domain default --password-prompt nova
openstack role add --project service --user nova admin

# 创建服务实体
openstack service create --name nova \
  --description "OpenStack Compute" compute

# 创建Compute API服务端点：
openstack endpoint create --region RegionOne \
  compute public http://controller:8774/v2.1
openstack endpoint create --region RegionOne \
  compute internal http://controller:8774/v2.1
openstack endpoint create --region RegionOne \
  compute admin http://controller:8774/v2.1

# 创建 placement 用户（密码123456）
openstack user create --domain default --password-prompt placement
openstack role add --project service --user placement admin

# 创建服务实体
openstack service create --name placement \
  --description "Placement API" placement

# 创建Placement API服务端点：
openstack endpoint create --region RegionOne \
  placement public http://controller:8778
openstack endpoint create --region RegionOne \
  placement internal http://controller:8778
openstack endpoint create --region RegionOne \
  placement admin http://controller:8778

```

**安装和配置组件**

```bash
yum install openstack-nova-api openstack-nova-conductor \
  openstack-nova-console openstack-nova-novncproxy \
  openstack-nova-scheduler openstack-nova-placement-api
```

编辑 `/etc/nova/nova.conf`文件

使能api

```ini
[DEFAULT]
# ...
enabled_apis = osapi_compute,metadata
```

配置数据库

```ini
[api_database]
# ...
connection = mysql+pymysql://nova:123456@controller/nova_api

[database]
# ...
connection = mysql+pymysql://nova:123456@controller/nova

[placement_database]
# ...
connection = mysql+pymysql://placement:123456@controller/placement
```

配置消息队列

```ini
[DEFAULT]
# ...
transport_url = rabbit://openstack:123456@controller
```

配置keystone

```ini
[api]
# ...
auth_strategy = keystone

[keystone_authtoken]
# ...
auth_url = http://controller:5000/v3
memcached_servers = controller:11211
auth_type = password
project_domain_name = default
user_domain_name = default
project_name = service
username = nova
password = 123456
```

配置管理ip

```ini
[DEFAULT]
# ...
my_ip = 192.168.2.101
```

启用网络服务支持

```ini
[DEFAULT]
# ...
use_neutron = true
firewall_driver = nova.virt.firewall.NoopFirewallDriver
```
配置vnc、镜像查找

```ini
[vnc]
enabled = true
# ...
server_listen = $my_ip
server_proxyclient_address = $my_ip
In the [glance] section, configure the location of the Image service API:

[glance]
# ...
api_servers = http://controller:9292

[oslo_concurrency]
# ...
lock_path = /var/lib/nova/tmp

[placement]
# ...
region_name = RegionOne
project_domain_name = Default
project_name = service
auth_type = password
user_domain_name = Default
auth_url = http://controller:5000/v3
username = placement
password = 123456
```

添加Apache配置`/etc/httpd/conf.d/00-nova-placement-api.conf`

```ini
<Directory /usr/bin>
   <IfVersion >= 2.4>
      Require all granted
   </IfVersion>
   <IfVersion < 2.4>
      Order allow,deny
      Allow from all
   </IfVersion>
</Directory>
```

重启httpd

```bash
systemctl restart httpd
```

初始化数据库

```bash
su -s /bin/sh -c "nova-manage api_db sync" nova
su -s /bin/sh -c "nova-manage cell_v2 map_cell0" nova
su -s /bin/sh -c "nova-manage cell_v2 create_cell --name=cell1 --verbose" nova
su -s /bin/sh -c "nova-manage db sync" nova
su -s /bin/sh -c "nova-manage cell_v2 list_cells" nova
```

启动并配置开机自启

```bash
systemctl enable openstack-nova-api.service \
  openstack-nova-scheduler.service openstack-nova-conductor.service \
  openstack-nova-novncproxy.service
systemctl start openstack-nova-api.service \
  openstack-nova-scheduler.service openstack-nova-conductor.service \
  openstack-nova-novncproxy.service

# 注意这两条命令官网没有，需要添加否则获取openstack console url show selfservice-instance将报错
systemctl start openstack-nova-consoleauth
systemctl enable openstack-nova-consoleauth
```


#### （1）安装在**计算节点**

**安装软件**

```bash
yum install openstack-nova-compute
```

**配置**

打开 `/etc/nova/nova.conf`

```ini
[DEFAULT]
# 使能api
enabled_apis = osapi_compute,metadata

# 配置消息队列
transport_url = rabbit://openstack:123456@controller

# 当前节点在管理网络中的ip
my_ip = 192.168.2.102

use_neutron = true
firewall_driver = nova.virt.firewall.NoopFirewallDriver

[api]
# ...
auth_strategy = keystone

[keystone_authtoken]
# ...
auth_url = http://controller:5000/v3
memcached_servers = controller:11211
auth_type = password
project_domain_name = default
user_domain_name = default
project_name = service
username = nova
password = 123456

[vnc]
# ...
enabled = true
server_listen = 0.0.0.0
server_proxyclient_address = $my_ip
novncproxy_base_url = http://192.168.3.101:6080/vnc_auto.html #注意此url必须是宿主机可以访问控制节点

[glance]
# ...
api_servers = http://controller:9292

[oslo_concurrency]
# ...
lock_path = /var/lib/nova/tmp


[placement]
# ...
region_name = RegionOne
project_domain_name = Default
project_name = service
auth_type = password
user_domain_name = Default
auth_url = http://controller:5000/v3
username = placement
password = 123456
```

**完成安装**

确定机器是否支持硬件虚拟化

```bash
egrep -c '(vmx|svm)' /proc/cpuinfo
```

* 如果以上命令输出非零，则不需要进行配置
* 如果没有输出零值则需要进行如下配置

编辑 `/etc/nova/nova.conf`

```ini
[libvirt]
# ...
virt_type = qemu
```

设置开机自启并启动

```bash
systemctl enable libvirtd.service openstack-nova-compute.service
systemctl start libvirtd.service openstack-nova-compute.service
```

**将计算节点添加到cell数据库**

在**控制节点**运行如下命令

```bash
source env/admin-openrc
openstack compute service list --service nova-compute

# 发现计算节点
su -s /bin/sh -c "nova-manage cell_v2 discover_hosts --verbose" nova
```

#### （3）验证操作
在**控制节点**执行如下命令
```bash
source env/admin-openrc

# 列出服务组件以验证每一个进程是否注册成功
openstack compute service list

# 在身份服务中列出API端点以验证与身份服务的连接性：
openstack catalog list

# 在图像服务中列出图像以验证与图像服务的连接性：
openstack image list

# 检查单元格和放置API是否成功工作：
nova-status upgrade check
```


### 5、网络服务

OpenStack网络服务组件被称为`neutron`，包含如下组件：

* neutron-server 接收api请求并转发到下层服务
* OpenStack Networking plug-ins and agents
* Messaging queue


#### （1）宿主机网络配置

参见开头上方的架构配置

#### （2）安装配置**控制节点**

**数据库**

进入MySql `mysql -uroot -p`

```sql
CREATE DATABASE neutron;

GRANT ALL PRIVILEGES ON neutron.* TO 'neutron'@'localhost' \
  IDENTIFIED BY '123456';
GRANT ALL PRIVILEGES ON neutron.* TO 'neutron'@'%' \
  IDENTIFIED BY '123456';
```


配置

```bash
source env/admin-openrc

# 密码简单设置为123456
openstack user create --domain default --password-prompt neutron

openstack role add --project service --user neutron admin

openstack service create --name neutron \
  --description "OpenStack Networking" network
	
openstack endpoint create --region RegionOne \
  network public http://controller:9696
	
openstack endpoint create --region RegionOne \
  network internal http://controller:9696

openstack endpoint create --region RegionOne \
  network admin http://controller:9696
```

**选项2：自服务网络配置**


```bash
yum install openstack-neutron openstack-neutron-ml2 \
  openstack-neutron-linuxbridge ebtables
```

编辑`/etc/neutron/neutron.conf`

```ini
[database]

connection = mysql+pymysql://neutron:123456@controller/neutron

[DEFAULT]
# 启用ml2插件，路由服务和重叠ip地址
core_plugin = ml2
service_plugins = router
allow_overlapping_ips = true

transport_url = rabbit://openstack:123456@controller
# 身份认证
auth_strategy = keystone

# 配置与计算节点相关内容
notify_nova_on_port_status_changes = true
notify_nova_on_port_data_changes = true


[keystone_authtoken]
#身份认证
www_authenticate_uri = http://controller:5000
auth_url = http://controller:5000
memcached_servers = controller:11211
auth_type = password
project_domain_name = default
user_domain_name = default
project_name = service
username = neutron
password = 123456


[nova]
# nova配置
auth_url = http://controller:5000
auth_type = password
project_domain_name = default
user_domain_name = default
region_name = RegionOne
project_name = service
username = nova
password = 123456


[oslo_concurrency]
# 锁路径
lock_path = /var/lib/neutron/tmp
```

配置模块层2（ML2）插件，编辑文件`/etc/neutron/plugins/ml2/ml2_conf.ini`

```ini

[ml2]
# ...
type_drivers = flat,vlan,vxlan
tenant_network_types = vxlan
mechanism_drivers = linuxbridge,l2population
extension_drivers = port_security

[ml2_type_flat]
# ...
flat_networks = provider

[ml2_type_vxlan]
# ...
vni_ranges = 1:1000

[securitygroup]
# ...
enable_ipset = true
```


配置 Linux 桥接代理，编辑`/etc/neutron/plugins/ml2/linuxbridge_agent.ini`

```ini
[linux_bridge]
physical_interface_mappings = provider:enp0s9 # 要桥接到的提供者网络网卡的名字

[vxlan]
enable_vxlan = true
local_ip = 192.168.2.101 # 管理网络的控制节点ip
l2_population = true

[securitygroup]
# ...
enable_security_group = true
firewall_driver = neutron.agent.linux.iptables_firewall.IptablesFirewallDriver
```

设置 `sysctl` 配置文件`vim /etc/sysctl.conf`
```
net.bridge.bridge-nf-call-iptables=1
net.bridge.bridge-nf-call-ip6tables=1
```

使用`sysctl -p`生效

若 报错 
```
sysctl: cannot stat /proc/sys/net/bridge/bridge-nf-call-iptables: 没有那个文件或目录
sysctl: cannot stat /proc/sys/net/bridge/bridge-nf-call-ip6tables: 没有那个文件或目录
```

[启用`br_netfilter`模块](http://www.cnblogs.com/sxwen/p/8417268.html)

```bash
modprobe br_netfilter
sysctl -p
```


并设置`br_netfilter`开机自启，创建完成后效果如下

```bash
cat /etc/rc.sysinit
#!/bin/bash
for file in /etc/sysconfig/modules/*.modules ; do
[ -x $file ] && $file
done

cat /etc/sysconfig/modules/br_netfilter.modules
modprobe br_netfilter

chmod 755 /etc/sysconfig/modules/br_netfilter.modules
```

查看模块情况：`lsmod |grep br_netfilter`
输出类似如下
```
br_netfilter           22209  0
bridge                136173  1 br_netfilter
```

配置三层代理，编辑文件`/etc/neutron/l3_agent.ini`

```ini
[DEFAULT]
interface_driver = linuxbridge
```

配置dhcp `/etc/neutron/dhcp_agent.ini`

```ini
[DEFAULT]

interface_driver = linuxbridge
dhcp_driver = neutron.agent.linux.dhcp.Dnsmasq
enable_isolated_metadata = true
```


配置元数据代理，编辑`/etc/neutron/metadata_agent.ini`

```ini
[DEFAULT]

nova_metadata_host = controller
metadata_proxy_shared_secret = 123456 # 简单起见
```

配置计算服务以使用网络服务，编辑`/etc/nova/nova.conf`

```ini
[neutron]

url = http://controller:9696
auth_url = http://controller:5000
auth_type = password
project_domain_name = default
user_domain_name = default
region_name = RegionOne
project_name = service
username = neutron
password = 123456
service_metadata_proxy = true
metadata_proxy_shared_secret = 123456
```


**完成安装**

```bash
ln -s /etc/neutron/plugins/ml2/ml2_conf.ini /etc/neutron/plugin.ini

su -s /bin/sh -c "neutron-db-manage --config-file /etc/neutron/neutron.conf \
  --config-file /etc/neutron/plugins/ml2/ml2_conf.ini upgrade head" neutron

systemctl restart openstack-nova-api.service

systemctl enable neutron-server.service \
  neutron-linuxbridge-agent.service neutron-dhcp-agent.service \
  neutron-metadata-agent.service
systemctl start neutron-server.service \
  neutron-linuxbridge-agent.service neutron-dhcp-agent.service \
  neutron-metadata-agent.service
	
# 网络选项2 需要执行
systemctl enable neutron-l3-agent.service
systemctl start neutron-l3-agent.service
```

#### （3）安装配置计算节点

```bash
yum install openstack-neutron-linuxbridge ebtables ipset
```

**配置通用组件，编辑`/etc/neutron/neutron.conf`**

```ini
[DEFAULT]
transport_url = rabbit://openstack:123456@controller

auth_strategy = keystone

[keystone_authtoken]
www_authenticate_uri = http://controller:5000
auth_url = http://controller:5000
memcached_servers = controller:11211
auth_type = password
project_domain_name = default
user_domain_name = default
project_name = service
username = neutron
password = 123456

[oslo_concurrency]
lock_path = /var/lib/neutron/tmp
```

**网络选项2：自服务网络配置**

编辑`/etc/neutron/plugins/ml2/linuxbridge_agent.ini`

```ini
[linux_bridge]
physical_interface_mappings = provider:enp0s3 # 要桥接到的网卡的名字

[vxlan]
enable_vxlan = true
local_ip = 192.168.2.102 # 本节点在管理网络的ip 
l2_population = true

[securitygroup]
# ...
enable_security_group = true
firewall_driver = neutron.agent.linux.iptables_firewall.IptablesFirewallDriver
```

同样需要配置启用`br_netfilter`

**配置计算服务使用网络服务**

编辑`/etc/nova/nova.conf`

```ini
[neutron]

url = http://controller:9696
auth_url = http://controller:5000
auth_type = password
project_domain_name = default
user_domain_name = default
region_name = RegionOne
project_name = service
username = neutron
password = 123456
```

**完成安装**

**注意：关闭selinux**

```bash
systemctl restart openstack-nova-compute.service

systemctl enable neutron-linuxbridge-agent.service
systemctl start neutron-linuxbridge-agent.service
```

#### （4）验证操作

在**控制节点**执行


```bash
source env/admin-openrc
openstack network agent list
```

### 6、仪表盘

建议安装了，非必要。在**控制节点**安装

```bash
yum install openstack-dashboard
```

编辑`/etc/openstack-dashboard/local_settings`

```python
OPENSTACK_HOST = "controller"

ALLOWED_HOSTS = ['*'] #建议为*

SESSION_ENGINE = 'django.contrib.sessions.backends.cache'

CACHES = {
    'default': {
         'BACKEND': 'django.core.cache.backends.memcached.MemcachedCache',
         'LOCATION': 'controller:11211',
    }
}

OPENSTACK_KEYSTONE_URL = "http://%s:5000/v3" % OPENSTACK_HOST

OPENSTACK_KEYSTONE_MULTIDOMAIN_SUPPORT = True

OPENSTACK_API_VERSIONS = {
    "identity": 3,
    "image": 2,
    "volume": 2,
}

OPENSTACK_KEYSTONE_DEFAULT_DOMAIN = "Default"

OPENSTACK_KEYSTONE_DEFAULT_ROLE = "user"


# #以下为网络选项1
#OPENSTACK_NEUTRON_NETWORK = {
#   ...
#    'enable_router': False,
#    'enable_quotas': False,
#    'enable_distributed_router': False,
#    'enable_ha_router': False,
#    'enable_lb': False,
#    'enable_firewall': False,
#    'enable_vpn': False,
#    'enable_fip_topology_check': False,
#}

TIME_ZONE = 'Asia/Shanghai' # 时区设置为中国
```


编辑`/etc/httpd/conf.d/openstack-dashboard.conf`

```
WSGIApplicationGroup %{GLOBAL}
```

重启服务

```bash
systemctl restart httpd.service memcached.service
```

### 7、块存储服务

[参见](https://docs.openstack.org/install-guide/openstack-services.html#minimal-deployment-for-rocky)
