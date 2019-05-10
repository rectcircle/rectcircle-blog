---
title: Dell PowerEdgeT30 配置
date: 2017-03-31T19:36:50+08:00
draft: false
toc: true
comments: true
aliases:
  - /detail/54
  - /detail/54/
tags:
  - linux
---

### 1、制作系统启动

* 下载镜像文件
* 下载、安装并打开UltraISO软件
* 选择 文件->打开 选择系统镜像文件
* 选择 启动->写入硬盘映像
* 选择u盘，执行写入，等待完毕

### 2、centos安装配置选项

* 服务器插入u盘
* 开机进入boot选择usb启动
* 进入安装页面

分区原则：swap分区为内存的两倍
选择基本网络服务器安装
设置root密码

### 3、配置网络

#### （1）临时配置网络信息（共享笔记本wifi网络）

* 打开笔记本连接wifi，配置wifi网卡为共享的。
* 打开以太网卡，配置ip为wifi的另一网段（192.168.2.1），和网络掩码（255.255.255.0）。其他留空
* 笔记本和服务器通过网线直接连接
* 配置linux服务器

```bash
ifconfig 网卡号 ip地址（192.168.2.2） netmask 子网掩码（255.255.255.0）
route add default gw 笔记本以太网卡的ip（192.168.2.1）
vim /etc/resolv.conf
添加：nameserver dns ip最多三条
nameserver 202.96.128.166
nameserver 202.38.224.68
nameserver 114.114.114.114
```

* centos 7可以使用ip命令配置
* 使用xshell连接服务器

#### （2）永久配置网络信息

* setup（redhat独有，centos 7不支持）
	* 打开配置
	* 执行`service network restart` # 注意/etc/sysconfig/network-scripts/ifcfg-enp0s31f6 ONBOOT 设为yes
* centos7

```bash
yum install NetworkManager-tui
systemctl start NetworkManager
nmtui #配置
# 注意/etc/sysconfig/network-scripts/ifcfg-enp0s31f6 ONBOOT 设为yes
service network restart
```

* 更改配置文件

网卡信息文件

```bash
vim /etc/sysconfig/network-scripts/ifcfg-enp0s31f6
TYPE=Ethernet #网络类型为以太网
BOOTPROTO=dhcp #dhcp是否使用，可选none|dhcp|static
DEFROUTE=yes #
PEERDNS=yes
PEERROUTES=yes
IPV4_FAILURE_FATAL=no
IPV6INIT=yes
IPV6_AUTOCONF=yes
IPV6_DEFROUTE=yes
IPV6_PEERDNS=yes
IPV6_PEERROUTES=yes
IPV6_FAILURE_FATAL=no
IPV6_ADDR_GEN_MODE=stable-privacy
NAME=enp0s31f6 #网卡设备名
UUID=33bf32ea-28a4-408f-bde5-0c044ce4e48d
DEVICE=enp0s31f6  #网卡设备名
ONBOOT=no #启用此网卡，应该为yes
#使用非dhcp，添加
IPADDR0=192.168.100.100  #地址
PREFIX0=24  #掩码
GATEWAY0=192.168.100.1   网关
DNS1=8.8.8.8  #dns
DNS2=8.8.4.4 #dns
```

主机名文件

```bash
```

dns配置文件

```bash
vim /etc/resolv.conf
添加：nameserver dns ip最多三条
nameserver 202.96.128.166
nameserver 202.38.224.68
nameserver 114.114.114.114
```

	* `service network restart`重启

#### （3）配置时间自动同步

```bash
timedatectl set-ntp yes
```

### 4、安装、配置mariadb（mysql数据库）

#### （1）安装

```bash
yum install MariaDB-server
systemctl start mariadb
service mysql start
systemctl enable mariadb #开机自启，或使用setup
```

#### （2）配置

查看mysql速查https://www.rectcircle.cn/detail/52

#### （3）开放端口

```bash
>>> 开启端口
firewall-cmd --zone=public --add-port=3306/tcp --permanent
 命令含义：
--zone #作用域
--add-port=3306/tcp #添加端口，格式为：端口/通讯协议
--permanent #永久生效，没有此参数重启后失效
>>> 重启防火墙
firewall-cmd --reload
```

### 5、安装jdk

#### （1）下载jdk

#### （2）安装

```bash
mkdir /usr/java
cp jdk-8u121-linux-x64.rpm /usr/java/
cd /usr/java/
chmod +x jdk-8u121-linux-x64.rpm
rpm -ivh jdk-7u25-linux-x64.rpm
```

#### （3）配置环境变量

```bash
vim /etc/profile

export JAVA_HOME=/usr/java/jdk1.8.0_121
export CLASSPATH=.:$JAVA_HOME/jre/lib/rt.jar:$JAVA_HOME/lib/dt.jar:$JAVA_HOME/lib/tools.jar
export PATH=$PATH:$JAVA_HOME/bin

. /etc/profile
```

### 6、安装tomcat

#### （1）下载tomcat

#### （2）安装

```bash
unzip -d  apache-tomcat-8.0.32.zip
mv apache-tomcat-8.0.32 /usr/local/tomcat
cd /usr/local/tomcat/bin
chmod 744 /usr/local/tomcat/bin/*.sh
```

#### （3）配置

```bash
vim /etc/rc.local #开机自启
chmod +x /etc/rc.d/rc.local #修改自启脚本权限
#修改端口、防止乱码
vim tomcat/conf/server.xml

    <Connector port="80" protocol="HTTP/1.1"
               connectionTimeout="20000"
               redirectPort="8443"
               URIEncoding="UTF-8" />
```
