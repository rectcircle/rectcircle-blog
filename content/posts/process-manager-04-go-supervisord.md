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
    * 提供 http 接口（xmlrpc）以支持 supervisorctl 操作 supervisord。
    * 提供 一个 WebUI 可以操作 supervisord。
* supervisorctl 执行时读取的配置，如配置 supervisord server 的 url （`[supervisorctl]`）。
* supervisord 管理的进程配置（`[program:x]`、`[program-default]`、`[group:x]`）。
* supervisord 内部事件监听器，启动一个用来接收 supervisord 内部事件的程序 （`[eventlistener:x]`）。
* 加载其他文件 (`[include]`)

配置文件的一些配置值支持通过 `%(ENV_X)s` 语法进行引用环境变量，参考下文说明。

本部分只列出 go 版本 supervisord 支持的配置项。

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

```ini
[supervisord]
logfile = /file/to/path    ; 默认为 $CWD/supervisord.log。支持 %(here)s 环境变量语法。supervisord 自身日志输出文件。设置为 /dev/stdout 之类的特殊文件时，需要将 logfile_maxbytes 设置为 0。
logfile_maxbytes = 50MB    ; 默认为 50MB。 日志文件轮换的阈值（当日志文件大于该值时，将创建一个新的文件）。支持  KB, MB, GB 单位的字符串， 0 表示不轮换。
logfile_backups = 10       ; 默认为 10。日志文件轮换后保留的最大日志文件个数。
loglevel = info            ; 默认为 info。日志级别，可选为 trace, debug, info, warning, error, fatal and panic。注意，可选值和 Python 版不同。
pidfile = /file/to/path    ; 默认为 $CWD/supervisord.pid。支持 %(here)s 环境变量语法。写入当前 supervisord 进程 PID 的文件路径。
minfds = 1024              ; 默认为 1024。在 supervisord 启动时至少保留这个数量的文件描述符资源 (Rlimit nofiles)。
minprocs = 20              ; 默认为 20。在 supervisord 启动时至少保留这个数量的进程资源 (Rlimit noproc)。 
identifier = supervisord   ; 默认为 supervisor。此 supervisord 进程的标识符。如果在同一命名空间中的一台机器上运行多个 supervisord，则需要。主要用于 rpc 接口。
```

#### supervisord server 配置

```ini
[inet_http_server]
port = 127.0.0.1:9001         ; 默认为 None，不监听。监听的 tcp 端口。如：127.0.0.1:9001，:9001。
username = test1              ; 默认为 None。无鉴权。
password = thepassword        ; 默认为 None。无鉴权。密码明文以及 SHA-1 摘要的形式，参见 [unix_http_server] 的 password。

[unix_http_server]
file = /path/to/socket_file ; [unix_http_server] 存在时，默认为 /tmp/supervisord.sock，否则为 None。不监听。支持 %(here)s 环境变量语法。rpc/http 服务所在监听的 uds。文件权限默认为 755。当存在 [unix_http_server] 时必填。
; chmod = 0777              ; go 版本不支持。
; chown = nobody:nogroup    ; go 版本不支持
username=test1              ; 默认为 None。无鉴权。
password={SHA}82ab876d1387bfafe46cc1c8a2ef074eae50cb1d  ; 默认为 None。无鉴权。密码明文以及 SHA-1 摘要的形式。
```

#### supervisorctl 配置

```ini
[supervisorctl]
serverurl = unix:///tmp/supervisor.sock  ; 默认值为 http://localhost:9001。 supervisord ctl 会读取该参数，通过该 url 提供的 xmlrpc 接口操作 supervisord。
username = chris                         ; 用户名
password = 123                           ; 密码
; prompt = mysupervisor                    ; go 版本不支持
```

#### 进程配置

```ini
[program:x]
command = /bin/cat                   ; 无默认值。进程启动命令。支持绝对路径以及相对于 $PATH 的相对路径，命令行参数也应该写在这里。需要特别注意的是，因为分号 (;) 是 ini 文件的注释，因此如果包含分号，需要使用反斜杠进行转义 \;。
process_name = %(program_name)s        ; 默认为 %(program_name)s。进程名。除非配置了 numprocs，否则无需关心该参数。
numprocs = 1                           ; 默认为 1。启动的进程数量，如果大于 1，则 process_name 必须配置，且配置的值必须包含 %(process_num)s 。
; numprocs_start = 0                   ; go 不支持。%(process_num)s 的其实值。
autostart = true                       ; 默认为 true。是否在 supervisord 启动时自动启动该进程。
startsecs = 1                          ; 默认为 1。程序在启动后持续多少秒，才将进程状态从 starting 转换到 running，如果运行时长没有达到该限制，则会按照 startretries 进行重试。0 表示不约束最小运行时长。其值必须是整数。
startretries = 3                       ; 默认为 3。表示程序启动失败多少次后，才将该进程状态设置为 FATAL 状态。实测该参数只有 startsecs 不为 0 才生效。
autorestart = true                     ; 默认为 unexpected。配置程序重启策略。可选值为：false - 永不自动重启，true - 总是自动重启，unexpected - 只有程序启动失败才自动重启（取决于 exitcodes 参数）。实测该参数只有 startsecs 不为 0 才生效。
exitcodes = 0,2                          ; 默认为 0。影响 autorestart = unexpected：如果进程退出码不为该参数指定的值，会重新启动。
stopsignal = TERM                        ; 默认为 TERM。 supervisord ctl stop 时的信号。
stopwaitsecs = 10                        ; 默认为 10。优雅退出的时间。
stopasgroup = true                       ; 默认为 false。supervisord ctl stop 信号是否发送给整个进程组。
killasgroup = true                       ; 默认为 false。supervisord ctl stop 强制退出时，是否发送给整个进程组。
user = user1                             ; 默认为 supervisord 进程用户。指定进程启动所在的用户， supervisord 进程必须为 root 才行。
redirect_stderr=false                    ; 默认为 false。是否将 stderr 重定向到 stdout（相当于 /the/program 2>&1）。
stdout_logfile=AUTO                      ; go 版本默认为 /dev/null。日志输出位置，支持 /dev/null, /dev/stdout, syslog, syslog @[protocol:]host[:port]., /path/to/file。支持多个输出目标，以逗号分割，如：test.log, /dev/stdout。
stdout_logfile_maxbytes=50MB             ; 默认 50MB。日志文件轮换的阈值（当日志文件大于该值时，将创建一个新的文件）。支持  KB, MB, GB 单位的字符串， 0 表示不轮换。
stdout_logfile_backups=10                ; 默认为 10。日志文件轮换后保留的最大日志文件个数。
stderr_logfile=AUTO                      ; 参见 stdout_logfile。
stderr_logfile_maxbytes=50MB             ; 参见 stdout_logfile_maxbytes。
stderr_logfile_backups=10                ; 参见 stdout_logfile_backups。
environment=KEY="val",KEY2="val2"        ; 环境变量。
directory=/tmp                           ; 默认继承 supervisord。进程工作目录。
; serverurl=AUTO                           ; 默认为 AUTO。向该进程通过环境变量 SUPERVISOR_SERVER_URL 传递 supervisord 的 url。实测 go 版本不支持。
```

一些重试场景的说明：

* 某个**非**常驻进程，运行时间很短（小于 1s）。且可能失败（exit != 0）。此时：
    * 无论成功失败与否，只执行一次（似乎有 bug，参见下文：[startsecs 参数为 0 进程状态异常](#startsecs-参数为-0-进程状态异常)）。

        ```ini
        [program:x]
        command =  sh -c 'sleep 0.5 && echo "模拟非常驻进程异常退出了" && exit 1' ; 测试
        stdout_logfile = /dev/stdout
        startsecs = 0
        ; startretries = 3          ; startsecs = 0 该参数无意义。
        ; autorestart = unexpected  ; startsecs = 0 该参数无意义。
        ```

    * 重试 3 次都失败后不再重试： supervisord 无法实现该特性。
    * 无限重试直到成功： supervisord 无法优雅实现该特性，只能通过 sleep 来实现。

        ```ini
        [program:x]
        command =  sh -c 'sleep 2 && echo "模拟真实的命令失败了" && exit 1' ; 测试
        stdout_logfile = /dev/stdout
        startsecs = 1   ; 设置为 0 的话，autorestart 不会生效。
        ; startretries = 3  ; command 参数 sleep 2 了秒钟，因此这个参数没有意义。
        autorestart = unexpected
        ```

* 某个常驻进程：
    * 退出后（不管正常还是异常退出）无限重试：supervisord 无法优雅实现。

        ```ini
        [program:x]
        command =  sh -c 'sleep 0.1 && echo "模拟真实的常驻进程正常退出了" && exit 0' ; 测试
        stdout_logfile = /dev/stdout
        startsecs = 1
        startretries = 2147483647  ; 需要设置为非常大的值（这里写的是 2^32-1），否则可能在第 1 就退出了，不会无限重试了。
        autorestart = true
        ```

    * 退出后（不管正常还是异常退出）重试 3 次：supervisord 无法优雅实现。

        ```ini
        [program:x]
        command =  sh -c 'sleep 2 && echo "模拟真实的常驻进程正常退出了" && exit 0' ; 测试
        stdout_logfile = /dev/stdout
        startsecs = 2147483647     ; 永远处于 starting 状态（这里写的是 2^32-1 秒），让 startretries 生效。会造成进程状态永远达不到 running 的问题。
        startretries = 3          ; 重试 3 次。
        ; autorestart = true    ; 该参数无意义了。
        ```

#### eventlistener 配置

### 启动 supervisord

### 操作 supervisord

### WebUI

## 编程交互

## 已知问题

[ochinchina/supervisord](https://github.com/ochinchina/supervisord) 项目从其文档，项目管理，代码风格，测试覆盖度等方面来看，质量并不高。因此如果在生产环境使用该项目，需要对所有依赖的功能，做好充分的测试。此外开发人员需要阅读、修改源码，来解决的问题的能力。

### startsecs 参数为 0 进程状态异常

配置文件如下：

```ini
[program:x]
command =  sh -c 'sleep 0.5 && echo "模拟非常驻进程异常退出了" && exit 1' ; 测试
stdout_logfile = /dev/stdout
startsecs = 0
; startretries = 3          ; startsecs = 0 该参数无意义。
; autorestart = unexpected  ; startsecs = 0 该参数无意义。
```

等待退出后，执行 `./supervisord ctl status x` 获取到 `x` 的状态仍然是 running，输出如下：

```
x                                Running   pid 12994, uptime 0:00:10
```
