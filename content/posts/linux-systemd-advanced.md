---
title: "Linux Systemd 高级话题"
date: 2021-03-13T13:02:12+08:00
draft: false
toc: true
comments: true
tags:
  - linux
---

> [systemd 基本用法](/posts/linux-systemctl-systemd/)

## Systemd 在 Linux 引导过程作用

### Linux 启动过程

* 内核引导，启动 0 号进程称为 `swapper` 或者 `sched` 该进程在没有需要调度的 进程时 被触发调度
* 启动 1 号进程，由 0 号进程负责启动，负责初始化用户程序，是所有用户进程的祖先进程，有很多不同实现
    * 目前主流的 Linux 发行版使用的初始化程序 /lib/systemd/systemd 进行用户程序的管理
    * 早期 Linux 使用的初始化程序 /sbin/init
    * MacOS 是 /sbin/launchd
* 启动 2 号进程，kthread 进程，负责启动内核态的进程

### systemd 和 init

关于 systemd 的争议： [知乎](https://www.zhihu.com/question/25873473)

systemd 体系复杂，引入并行启动来优化速度，因此相较 init 速度更快

### 更多 systemd 细节

[走进Linux之systemd启动过程](https://linux.cn/article-5457-1.html)

## Systemd User

[参考](https://wiki.archlinux.org/index.php/Systemd_(%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87)/User_(%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87))

systemd user 方式，直观来讲，就是 `systemctl --user` 方式来操作 systemd 的方式

### Systemd user 的用法

#### 创建用户并配置服务启动自启

```bash
test_user=xxx
sudo useradd -s /bin/bash -m $test_user
sudo loginctl enable-linger $test_user
```

#### 创建一个服务

```bash
sudo su $test_user
# 使用 systemctl --user 管理服务，不需要 root 权限
systemctl --user enable $config_path
```

#### 重启 user systemd

当用户权限发生变更时（附加组变更），需要重启 user systemd 才能生效

```bash
# 如加入 docker 组
sudo usermod -aG docker $test_user
# 需要执行如下操作才能生效
sudo loginctl disable-linger $test_user 
sudo loginctl enable-linger $test_user 
```

#### 彻底删除用户和服务

需要 kill 所有该用户的进程

```bash
userdel -r $test_user
```

### Systemd user vs systemd

systemd 有两种模式启动一个服务：

* `systemctl` 默认是使用 `--system` 参数，与 1 进程的 systemd 进程通信，该进程的 user 为 root 权限。所以 调用 `systemctl` 必须有 root 权限
* `systemctl --user`，与用户名下的 systemd 进程通讯，该进程 user 为当前用户，主组 和 附加组为该进程启动时的用户所属组。所以 调用 `systemctl --user` 不需要 root 权限

因为权限存在如上区别，需要注意：

* systemctl --user 启动的服务的配置文件不能配置用户、组、附加组，因为 启动服务的 systemd 进程是当前用户的权限，没有 root 权限所以没法以配置的用户组启动
* systemctl --user 启动的服务的 组、附加组 在 systemd 进程启动后就确定了，所以后续更新的 附加组 不会生效，除非新登录用户

### Systemd user vs 配置文件指定 user

* 管理命令权限问题
    * Systemd user，管理服务（调用 systemctl 等），不需要 root 权限，只需要登录该用户即可
    * Systemd 配置文件指定 user，管理服务（调用 systemctl 等），需要 root 权限
* 启动服务的权限问题
    * Systemd user 启动的服务的权限继承自用户的 systemd 进程的权限，无法配置（如果配置了则直接报错），且 systemd 一旦启动则无法动态修改，只能重新登录，重启 systemd 才能生效。
    * Systemd 配置文件指定 user，可以通过配置文件，灵活指定用户权限

## 常见问题

### 某用户 systemd --user 无法使用

症状

* `systemd --user` 相关操作输出 `Failed to connect to bus: No such file or directory`

解决方案

* 安装 一些依赖 `sudo apt-get install systemd libpam-systemd policykit-1 dbus-user-session`
* 重启 dbus，执行
    * `sudo systemctl restart systemd-dbus.service`
    * `sudo systemctl restart systemd-dbus.sock`
* 重置 systemd ，执行 `sudo systemctl daemon-reexec`
* 如果还不行，重启 设备

### ssh 或 su 巨慢

以下症状同时如下情况

* ssh 或 su 切换用户巨慢
* ssh -v 卡在 `debug1: pledge: network`
* 查看 `sudo tail -f /var/log/auth.log` 存在 `pam_systemd(sshd:session): Failed to create session: Connection timed out` 报错

可能的症状

* `systemctl status systemd-logind` 状态异常 `Active: active (running)`
* `sudo systemctl restart systemd-logind` 卡顿

解决方案

* 重启 dbus，执行
    * `sudo systemctl restart systemd-dbus.service`
    * `sudo systemctl restart systemd-dbus.sock`
* 重置 systemd ，执行 `sudo systemctl daemon-reexec`
* 重启 polkit， `sudo systemctl restart polkit`
* 重启 logind， `sudo systemctl restart systemd-logind`

参考

* [解释为何重启 logind](https://littlerpl.me/2019/11/08/ssh-shuck-network/)
* [执行 `sudo systemctl daemon-reexec` 的原因](https://unix.stackexchange.com/questions/393394/systemd-logind-service-fails-to-start-when-attempting-to-return-from-rescue-tar)
* https://serverfault.com/questions/792486/ssh-connection-takes-forever-to-initiate-stuck-at-pledge-network

相关组件

* systemd
* [Linux PAM](https://www.cnblogs.com/kevincaptain/p/10493885.html)
* [polkit](https://wiki.archlinux.org/index.php/Polkit_(%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87))
* logind
* dbus
