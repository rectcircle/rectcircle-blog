---
title: Centos7 自定义服务配置文件
date: 2019-04-05T17:33:14+08:00
draft: false
toc: false
comments: true
aliases:
  - /detail/190
  - /detail/190/
tags:
  - linux
---

```ini
[Unit]
# 简单描述服务
Description=基于OpenStack的Spark开发环境守护节点
# 描述服务类别，表示本服务需要在network服务启动后在启动
After=network.target sshd.service
# Before=xxx.service      # 表示需要在某些服务启动之前启动，After和Before字段只涉及启动顺序，不涉及依赖关系。

# 核心区域
[Service]
# 表示后台运行模式，也就是说启动脚本会在有限时间内停止
# Type=forking
# 设置服务运行的用户
User=bigdata
# 设置服务运行的用户组
Group=bigdata
# 定义systemd如何停止服务
KillMode=control-group
# 存放PID的绝对路径
# PIDFile=/home/bigdata/graduation-project/node_daemon/pid
# 定义服务进程退出后，systemd的重启方式，默认是不重启
# Restart=no
# 服务启动命令，命令需要绝对路径
ExecStart=/home/bigdata/graduation-project/node_daemon/gunicorn_deploy.sh
# 表示给服务分配独立的临时空间
PrivateTmp=true

[Install]
# 多用户
WantedBy=multi-user.target  
```