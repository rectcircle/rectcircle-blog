---
title: Linux——iptables
date: 2016-11-19T22:14:56+08:00
draft: false
toc: true
comments: true
aliases:
  - /detail/23
  - /detail/23/
tags:
  - linux
---

## 规则组成及原理

### 1、iptables的四表五链

四张表规则表

* filter 访问控制，规则匹配
* nat 地址转发
* mangle
* raw

五条链

* input
* output
* forword
* pre_routing
* post_routing

### 2、iptables规则组成

数据包访问控制

* accept 允许通过
* drop 丢弃，不会通知客户端
* reject 拒绝、返回客户端消息

数据表改写

* snat 源地址改写
* dnet 目的地址改写

信息记录

* log

![iptables命令组成](/res/LGZETqIWcWn1P1nuPGgAucHL.png)

```bash
 -A 增加规则在最后
 -D 删除规则
 -L 列出规则
 -F 清除现有规则
 -P 默认iptables
 -I 插入到第一条规则
 -R
 -n

	-p tcp 协议
	-s 发起源
	-d 目标地址
	-sport 源端口
	-dport 目标端口
	-dports 目标端口段
	-m

	 -j
		 ACCEPT
		 DROP
		 REJECT
		 DNAT
		 SNAT
```

### 3、实战场景

#### 场景一

##### （1）开放所有地址本机端口tcp 80,22,10-21端口访问

```bash
#查看现有规则
iptables -nL

#添加规则
iptables -I INPUT -p tcp --dport 80 -j ACCEPT
iptables -I INPUT -p tcp --dport 22 -j ACCEPT
iptables -I INPUT -p tcp --dport 20:21 -j ACCEPT
iptables -I INPUT -p tcp --dport 443 -j ACCEPT

iptables -t filter -I INPUT -i lo -j ACCEPT #允许本地回环网卡通讯
iptables -I INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT #允许访问其他主机

#参照 netstat -luntp

#删除记录
iptables -D INPUT -p tcp --dport 80 -j ACCEPT
```

##### （2）允许ping

```bash
iptables -I INPUT -p icmp -j ACCEPT
```

##### （3）禁用所有其他端口

```bash
#先执行开放端口命令
iptables -A INPUT -j REJECT

```

##### 命令汇总

```
iptables -F
iptables -I INPUT -p tcp --dport 80 -j ACCEPT
iptables -I INPUT -p tcp --dport 22 -j ACCEPT
iptables -I INPUT -p tcp --dport 20:21 -j ACCEPT
iptables -I INPUT -p tcp --dport 443 -j ACCEPT

iptables -A INPUT -j REJECT

#问题
#127.0.0.1无法访问放行端口
#本机无法访问外网主机
#解决：
iptables -t filter -I INPUT -i lo -j ACCEPT #允许本地回环网卡通讯
iptables -I INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT #允许访问其他主机

#添加场景，仅允许某主机访问指定端口
iptables -D INPUT -p tcp --dport 80 -j ACCEPT
iptables -I INPUT -p tcp -s ip地址 --dport 80 -j ACCEPT

```

#### 场景二

* ftp主动模式下iptables的规则配置
* ftp被动模式下配置

##### （1）ftp主动模式下iptables的规则配置

```bash
#下载安装vsftpd
#开启主动模式支持

#开启只需要开放21端口
iptables -I INPUT -p tcp --dport 21 -j ACCEPT
iptables -I INPUT -p tcp --dport 22 -j ACCEPT
iptables -I INPUT -P icmp -j ACCEPT
iptabels -I INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT
iptabels -A INPUT -j REJECT
iptabels -nL
FTP切换主动模式 passive(匿名者登陆anonymous)

```

##### （2）ftp被动模式下iptables的规则配置

```bash

```
