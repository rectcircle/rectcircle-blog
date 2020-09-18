---
title: "Linux Systemd (systemctl) 服务、守护进程管理"
date: 2020-09-18T10:33:46+08:00
draft: false
toc: true
comments: true
tags:
  - linux
---

> 参考：http://www.ruanyifeng.com/blog/2016/03/systemd-tutorial-commands.html 和 http://www.ruanyifeng.com/blog/2016/03/systemd-tutorial-part-two.html

## 是什么

Systemd 用来管理 Linux 下启动的后台任务/服务（守护进程），提供开机自启、服务状态检测、启动、停止、重启等功能。

Systemd 本身为 Linux 的 1 号进程 （用来替代 之前的 init）

## 常用命令

### Unit 状态

```bash
# 列出所有服务
systemctl list-units --all
# 系列的对单个 Unit 的操作
# 状态
systemctl status sshd.service
# 显示某个 Unit 是否正在运行
systemctl is-active application.service
# 显示某个 Unit 是否处于启动失败状态
systemctl is-failed application.service
# 显示某个 Unit 服务是否建立了启动链接
systemctl is-enabled application.service
```

### Unit 管理

```bash
# 立即启动一个服务
sudo systemctl start apache.service
# 立即停止一个服务
sudo systemctl stop apache.service
# 重启一个服务
sudo systemctl restart apache.service
# 杀死一个服务的所有子进程
sudo systemctl kill apache.service
# 重新加载一个服务的配置文件
sudo systemctl reload apache.service
# 开机自启
sudo systemctl enable httpd
# 重载所有修改过的配置文件
sudo systemctl daemon-reload
# 显示某个 Unit 的所有底层参数
systemctl show httpd.service
# 显示某个 Unit 的指定属性的值
systemctl show -p CPUShares httpd.service
# 设置某个 Unit 的指定属性
sudo systemctl set-property httpd.service CPUShares=500
```

### 查看日志

```bash
# 查看某个 Unit 的日志
sudo journalctl -u nginx.service
sudo journalctl -u nginx.service --since today

# 实时滚动显示某个 Unit 的最新日志
sudo journalctl -u nginx.service -f
```

## 配置文件

> https://wiki.archlinux.org/index.php/systemd_(%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87)

### 位置

* `/usr/lib/systemd/system`
* `/etc/systemd/system`

### 配置文件格式

类似于 `ini` 格式

* 不支持行尾注释
* 大小写敏感

### `Unit` 块

配置启动顺序和依赖关系，其他 略

### `Service` 块

#### Type 字段

* simple（默认值）：ExecStart字段启动的进程为主进程，**一般启动的命令是不可以退出的（一直阻塞）**
* forking：ExecStart字段将以fork()方式启动，此时父进程将会退出，子进程将成为主进程，**`nohup &` 方式启动的程序**
* oneshot：类似于simple，但只执行一次，Systemd 会等它执行完，才启动其他服务
* dbus：类似于simple，但会等待 D-Bus 信号后启动
* notify：类似于simple，启动结束后会发出通知信号，然后 Systemd 再启动其他服务
* idle：类似于simple，但是要等到其他任务都执行完，才会启动该服务。一种使用场合是为让该服务的输出，不与其他服务的输出相混合

区别：https://superuser.com/questions/1274901/systemd-forking-vs-simple/1274913

#### 命令

区块定义如何启动当前服务。

```ini
[Service]
# 启动命令
EnvironmentFile=环境变量文件
ExecStart=/bin/echo execstart1
ExecStartPost=/bin/echo post1
```

命令 支持 使用 `-` 开头，表示命令报错忽略。比如 `ExecStartPre=-exit 1`，全部脚本相关如下

* ExecReload字段：重启服务时执行的命令
* ExecStop字段：停止服务时执行的命令
* ExecStartPre字段：启动服务之前执行的命令
* ExecStartPost字段：启动服务之后执行的命令
* ExecStopPost字段：停止服务之后执行的命令

### `Install` 块

* WantedBy 字段 表示该服务所在的 Target。

表示在配置开机自启时，该服务在哪个步骤启动，一般配置为 `default.target` 或者 `graphical.target` 或者 `multi-user.target`

参见 https://www.freedesktop.org/software/systemd/man/bootup.html#System%20Manager%20Bootup

### 重新加载配置文件

```bash
# 重新加载配置文件
sudo systemctl daemon-reload

# 重启相关服务
sudo systemctl restart foobar
```
