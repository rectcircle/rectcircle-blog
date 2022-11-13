---
title: "进程管理器（四） Go supervisord"
date: 2022-11-13T18:07:54+08:00
draft: true
toc: true
comments: true
tags:
  - untagged
---

## 简述

在 《进程管理器》 的三个章节，介绍了：

* [（一）](/posts/process-manager-01-linux-background-knowledge/)：Linux 进程管理器的背景知识。
* [（二）](/posts/process-manager-02-single-process-tini-source/)：单进程管理器 tini 的源码分析。
* [（三）](/posts/process-manager-03-single-process-tini-go-impl/)：如何使用 Go 实现一个 tini 程序。

tini 是一个最小化的进程管理器，但是其只能管理一个进程。本节，将介绍另一个轻量级进程管理器 supervisord，和 tini 相比，该进程管理器可以管理多个进程。

supervisord 是由 Python 实现。但是，Python 需要一个外部的 Python 解释器依赖，在容器化场景，这要求镜像中需要安装 Python 环境，这对于容器来讲有点重。因此，本文要介绍的是由 go 语言实现的 [ochinchina/supervisord](https://github.com/ochinchina/supervisord)。

## 编译

由于 Go 语言支持静态编译的特性，因此该版本的 supervisord，可以编译成没有任何外部依赖的可执行文件。

源码和版本选择：目前最新的标签为 [v0.7.3](https://github.com/ochinchina/supervisord/tree/v0.7.3) 发布于 2021 年 5 月 3 日，距今已一年半。master 有大量的到代码，从 commit 历史来看，这段时间存在大量的 bugfix，因此本文采用写作时最新的 master 分支（commit 为： [`b1093f8906480aac2a7c82c8fa94e1e518fd6a62`](https://github.com/ochinchina/supervisord/tree/b1093f8906480aac2a7c82c8fa94e1e518fd6a62)）。

```bash
git clone https://github.com/ochinchina/supervisord.git
cd supervisord
go generate
GOOS=linux go build -tags release -a -ldflags "-linkmode external -extldflags -static" -o supervisord
./supervisord --version
# v0.7.3
```

## 命令简述

go 实现的 supervisord，通过如上命令，编译产物只有唯一的可执行文件 `supervisord`，其静态编译大小在 Linux x86 平台约 19MB。

执行 `./supervisord --version && ./supervisord --help` 输出如下：

```
Usage:
  supervisord [OPTIONS] [command]

Application Options:
  -c, --configuration= the configuration file
  -d, --daemon         run as daemon
      --env-file=      the environment file

Help Options:
  -h, --help           Show this help message

Available commands:
  ctl      Control a running daemon
  init     initialize a template
  service  install/uninstall/start/stop service
  version  show the version of supervisor
```

supervisord 可执行文件主要包含一个主命令和四个工具类的子命令。

* `supervisord [OPTIONS]`，启动 supervisord 进程。
* `supervisord ctl ...`，即 supervisorctl，操作 supervisord 进程。
* `supervisord init -o filename`，生成一个配置文件模板。
* `supervisord service ...`，为 supervisord 进程生成当前操作系统进程管理器对应的配置文文件，以 systemd 为例，将生成一个 `.service` 文件。
* `supervisord version`，打印版本。

## 使用说明

### 配置文件

supervisord 配置文件格式为 ini （Windows-INI-style），文件后缀名推荐为 `.conf`，其可配置的内容包括：

* supervisord 进程自身的配置，如日志等（`[supervisord]`）。
* supervisord server 配置（`[unix_http_server]` 和 `[inet_http_server]`）。
    * 提供 http 接口以支持 supervisorctl 操作 supervisord。
    * 提供 一个 WebUI 可以操作 supervisord。
* supervisorctl 执行时读取的配置，如配置 supervisord server 的 url （`[supervisorctl]`）。
* supervisord 管理的进程配置（`[program:x]`、`[program-default]`、`[group:x]`）。
* supervisord 内部事件监听器，启动一个用来接收 supervisord 内部事件的程序 （`[eventlistener:x]`）。
* 加载其他文件 (`[include]`)

#### 主配置配置文件查找和多配置文件

当 go 版本的 supervisord 执行时，不使用 -c 指定配置文件时，按 supervisord 会按照如下顺序尝试查找配置文件（注意，和 [Python 版](http://supervisord.org/configuration.html#configuration-file)不同）：

1. `$CWD/supervisord.conf`
2. `$CWD/etc/supervisord.conf`
3. `/etc/supervisord.conf`
4. `/etc/supervisor/supervisord.conf` (since Supervisor 3.3.0)
5. `../etc/supervisord.conf` (Relative to the executable)
6. `../supervisord.conf` (Relative to the executable)

如果 supervisord 执行时指定了 -c 则以 -c 的配置文件为准。

supervisord 的配置文件支持 `[include]` 配置段来加载其他配置文件，语法如下：

```ini
[include]
files = /an/absolute/filename.conf /an/absolute/*.conf foo.conf config??.conf
```

#### supervisord 自身配置

#### supervisord server 配置

#### supervisorctl 配置

#### 进程配置

#### eventlistener 配置

### 启动 supervisord

### 操作 supervisord

### WebUI

## 编程交互

## 已知问题

[ochinchina/supervisord](https://github.com/ochinchina/supervisord) 项目从其文档，项目管理，代码风格，测试覆盖度等方面来看，质量并不高。因此如果在生产环境使用该项目，需要对所有依赖的功能，做好充分的测试。此外开发人员需要阅读、修改源码，来解决的问题的能力。
