---
title: "Remote Development"
date: 2020-04-18T19:38:24+08:00
draft: false
toc: true
comments: true
weight: 100
summary: 优质扩展推荐首篇——远程开发
---

## 前言

### 简介

> https://code.visualstudio.com/docs/remote/remote-overview

远程开发是，19年 VSCode 推出的一项重大特性。因此将 《远程开发》 章节作为 VSCode 优质扩展的第一篇。

近几年来 云 十分火爆，因此各种 云 IDE 应运而生。但是这也云 IDE 在功能上与本地IDE无法相提并论。

而 VSCode 的 Remote Development，真正实现了不损失功能的情况下实现了远程开发，而且配置简单，在使用上和本地 VSCode 几乎没有差别，这对于开发者来说是非常大的福音。

Visual Studio Code远程开发允许您将容器，远程主机或[Windows子系统](https://docs.microsoft.com/windows/wsl)（WSL）用作完整功能的开发环境。您可以：

* 在您部署到的同一操作系统上进行开发，或使用更大或更专业的硬件。
* 将开发环境沙盒化，以避免影响本地计算机配置。
* 使新贡献者易于上手，并使每个人都保持一致的环境。
* 使用本地操作系统上不可用的工具或运行时，或管理它们的多个版本。
* 使用Linux的Windows子系统开发部署了Linux的应用程序。
* 从多台机器或位置访问现有的开发环境。
* 调试在其他位置（例如客户站点或云中）运行的应用程序。

### 场景

#### 远程开发

有时，迫于现状，正在开发的项目依赖特定的环境（比如：操作系统/网络隔离/宿主环境），导致在本地运行和调试程序及其困难甚至不可能。另外，在和线上环境相同的环境下开发，可以杜绝因为环境不同导致的问题。

此时每次开发可能这样的流程：

* 本地开发
* 利用git、ftp、sftp、scp等手段同步到开发机
* 在开发机启动程序，观察日志输出

一般情况下，以上流程虽然较长，但是可以接受，但是在 Debug 的时候需要频繁修改代码 各种 print。开发效率及其低下的。

在使用 VSCode Remote Development 后，只需要做一次前序操作：

* 安装 Remote Development 扩展
* 连接到远端主机，并打开项目
* 在远端安装扩展

此后，就可以像在本地开发一样进行开发。

利用 Remote Development 开发还有如下好处

* 如果远程主机性能很强，则可以提高编译速度和扩展的响应速度
* 自己的本地机器不会因为扩展的语言服务器在进行CPU密集的运算而造成风扇狂响了

远程开发需要付出的代价

* 与远程主机较好的网络连接（带宽不必要求太高，延迟越低越好）

#### 一致性开发环境（敏捷）

在 敏捷开发/持续交付 要求可以快速的搭建开发环境， Docker 容器化是实现该需求的关键。

当容器技术和VSCode结合，不管项目如何复杂，都可以真正实现

* 所有成员开发环境一致
* 开发环境快速搭建
* 开发环境统一管理

### 原理

> https://code.visualstudio.com/docs/remote/remote-overview

整体架构

![architecture](https://code.visualstudio.com/assets/docs/remote/remote-overview/architecture.png)

Remote - SSH 架构

![architecture-ssh](https://code.visualstudio.com/assets/docs/remote/ssh/architecture-ssh.png)

## 安装

### 命令安装

* `ext install ms-vscode-remote.vscode-remote-extensionpack`
    * `ext install ms-vscode-remote.remote-ssh`
        * `ext install ms-vscode-remote.remote-ssh-edit`
    * `ext install ms-vscode-remote.remote-wsl`
    * `ext install ms-vscode-remote.remote-containers`
* `ext install ms-vsonline.vsonline`

### 商店链接

* 扩展包 [Remote Development](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.vscode-remote-extensionpack)
    * [Remote - SSH](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-ssh)
        * [Remote - SSH: Editing Configuration Files](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-ssh-edit)
    * [Remote - WSL](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-wsl)
    * [Remote - Containers](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)
* [Visual Studio Online](https://marketplace.visualstudio.com/items?itemName=ms-vsonline.vsonline)

## 特性

远程开发

## Remote - SSH

### 相关链接

* [Remote Development using SSH](https://code.visualstudio.com/docs/remote/ssh)

### 使用说明

常用命令

* `>remote ssh: connect to host` 连接到远端Server
* `>remote ssh: open configuration file` 打开 ssh 配置文件
* `>remote ssh: settings` 打开设置
* `>remote-ssh:show log` 打开日志

基本使用

* 进入 `>remote ssh: connect to host` 命令
* 选择 ssh config 已经配置好的主机或者输入用户名主机信息，形如 `username@host`

技巧

* 通过 `~/.ssh/config` 可以方便的管理 server 列表，可通过 `>remote ssh: open configuration file` 命令打开
* 通过 活动栏 图标打开 远程资源管理器，可以查看所有可以历史打开的远程工作区，方便一键打开远程开发
* 远程开发的窗口，与本地开发窗口不同点在于
    * 扩展视图：添加了安装到远程的特性
    * 设置视图：添加了远程主机的设置，优先级 在 工作区 和 用户设置之间。

[提示](https://code.visualstudio.com/docs/remote/troubleshooting#_ssh-tips)

* 通过 `remote SSH` 连接主机，需要进行如下配置
    * 远程主机开启 sshd 服务，且开启ssh端口
    * （不强制，单非常建议）配置 主机 通过 key-based 验证（所谓的免密登录），最简单的方式是在本地设备执行如下命令 （[参考](https://code.visualstudio.com/docs/remote/troubleshooting#_quick-start-using-ssh-keys)）
        * 如果本地设备没有公私钥需要执行 `ssh-keygen -t rsa -C "your_email@example.com"`
        * 将公钥拷贝到远端 `ssh-copy-id username@host`
* 连接失败，安装如下步骤进行检查
    * 配置 `"remote.SSH.showLoginTerminal": true,` 观察是否需要输入密码
    * 在连接远端的VSCode 窗口执行 `>remote-ssh:show log` 观察输出
    * 进入远端主机可以尝试，杀死进程并清理文件

```bash
kill -9 `ps ax | grep "remoteExtensionHostAgent.js" | grep -v grep | awk '{print $1}'`
kill -9 `ps ax | grep "watcherService" | grep -v grep | awk '{print $1}'`
rm -rf ~/.vscode-server # Or ~/.vscode-server-insiders
```

### 常用配置

```json
{
    // 连接远端自动安装的扩展列表
    "remote.SSH.defaultExtensions": [
        // 常用工具
        "editorconfig.editorconfig",
        "donjayamanne.githistory",
        "codezombiech.gitignore",
        // Java
        "vscjava.vscode-java-pack",
        "gabrielbb.vscode-lombok",
        "pivotal.vscode-boot-dev-pack",
        // Python
        "ms-python.python",
    ],
    // 配置端口转发
    "remote.SSH.defaultForwardedPorts": [
        {
            "localPort": 8080,
            "name": "example",
            "remotePort": 8080
        }
    ],
    // 使用密码登录的时候需要
    "remote.SSH.showLoginTerminal": true
}
```

## Remote - Containers

Remote - SSH 解决了远程开发的问题，但是本质上还是 个人 的 定制的环境，仍然不够敏捷。

通过 Remote - Containers 可以做到团队项目成员一致性的环境、真正快速的搭建开发环境、开发环境统一管理。可以极大的降低大型项目的环境搭建问题。

## 其他扩展

参见：[官网文档](https://code.visualstudio.com/docs/remote/remote-overview)
