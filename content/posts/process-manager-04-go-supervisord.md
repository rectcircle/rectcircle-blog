---
title: "进程管理器（四） Go supervisord"
date: 2022-11-13T18:07:54+08:00
draft: false
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

## 基本使用

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

### 启动 supervisord

通过 `supervisord [OPTIONS]` 可以直接启动 supervisord。options，说明如下：

* `-c` 或 `--configuration=` 指定配置文件路径。关于配置文件，参见下文：[配置文件](#配置文件)。不填写时，会再按照如下顺序搜索配置文件（注意，和 [Python 版](http://supervisord.org/configuration.html#configuration-file)不同）：

    1. `$CWD/supervisord.conf`
    2. `$CWD/etc/supervisord.conf`
    3. `/etc/supervisord.conf`
    4. `/etc/supervisor/supervisord.conf` (since Supervisor 3.3.0)
    5. `../etc/supervisord.conf` (Relative to the executable)
    6. `../supervisord.conf` (Relative to the executable)

* `-d` 或 `--daemon` 后台模式运行（fork 两次）。
* `--env-file=` 环境变量文件（即 `.env` 文件）。

### 操作 supervisord

supervisord 提供了 ctl 子命令来操作进程。支持：

* 对进程/组的 status, start, stop, signal, pid (获取进程 id), fg（前台化） 操作。
* 对 supervisord 的 shutdown, reload 操作。

supervisord ctl 是通过 XMLRPC 方式来操作一个已经启动的 supervisord。因此，需要先获取到 supervisord 的地址，supervisord ctl 会连接按照如下顺序获取到的第一个地址，并进行连接和 rpc 调用：

* 指定了 `-s` 或者 `--serverurl=` 选项。
* 按照上文 [启动 supervisord](#启动-supervisord) 加载配置的方式获取到配置文件，读取 `[supervisorctl]` 中的 `serverurl` 配置。
* 最后，兜底使用 `http://localhost:9001`。

supervisord ctl 的示例操作如下。

```bash
supervisord ctl status
supervisord ctl status program-1 program-2...
supervisord ctl status group:*
supervisord ctl stop program-1 program-2...
supervisord ctl stop group:*
supervisord ctl stop all
supervisord ctl start program-1 program-2...
supervisord ctl start group:*
supervisord ctl start all
supervisord ctl shutdown
supervisord ctl reload
supervisord ctl signal <signal_name> <process_name> <process_name> ...
supervisord ctl signal all
supervisord ctl pid <process_name>
supervisord ctl fg <process_name>
```

### WebUI

supervisord 启动的 server 除了暴露基于 http 的 xmlrpc 端口外，还会提供一个 WebUI。通过该 webui，可以可视化的启动进程。

## 配置文件

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

supervisord 的配置文件支持 `[include]` 配置段来加载其他配置文件，语法如下：

```ini
[include]
files = /an/absolute/filename.conf /an/absolute/*.conf foo.conf config??.conf
```

### supervisord 自身配置

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

### supervisord server 配置

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

### supervisorctl 配置

```ini
[supervisorctl]
serverurl = unix:///tmp/supervisor.sock  ; 默认值为 http://localhost:9001。 supervisord ctl 会读取该参数，通过该 url 提供的 xmlrpc 接口操作 supervisord。
username = chris                         ; 用户名
password = 123                           ; 密码
; prompt = mysupervisor                    ; go 版本不支持
```

### 进程配置

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
redirect_stderr=false                    ; 默认为 false。是否将 stderr 重定向到 stdout（相当于 /the/program 2>&1）。
stdout_logfile=AUTO                      ; go 版本默认为 /dev/null。日志输出位置，支持 /dev/null, /dev/stdout, syslog, syslog @[protocol:]host[:port]., /path/to/file。支持多个输出目标，以逗号分割，如：test.log, /dev/stdout。
stdout_logfile_maxbytes=50MB             ; 默认 50MB。日志文件轮换的阈值（当日志文件大于该值时，将创建一个新的文件）。支持  KB, MB, GB 单位的字符串， 0 表示不轮换。
stdout_logfile_backups=10                ; 默认为 10。日志文件轮换后保留的最大日志文件个数。
stderr_logfile=AUTO                      ; 参见 stdout_logfile。
stderr_logfile_maxbytes=50MB             ; 参见 stdout_logfile_maxbytes。
stderr_logfile_backups=10                ; 参见 stdout_logfile_backups。
environment=KEY="val",KEY2="val2"        ; 环境变量。
priority=999                             ; 默认 999。只影响进程启动关闭的顺序。数字越小，越先启动后停止。
user = user1                             ; 默认为 supervisord 进程用户。指定进程启动所在的用户， supervisord 进程必须为 root 才行。
directory=/tmp                           ; 默认继承 supervisord。进程工作目录。
; serverurl=AUTO                           ; 默认为 AUTO。向该进程通过环境变量 SUPERVISOR_SERVER_URL 传递 supervisord 的 url。实测 go 版本不支持。
; 下面参数只有 Go 版本存在。
restartpause=0                           ; 默认为 0。重启时，停止后等待的秒数。
restart_when_binary_changed=false        ; 默认为 false。是否在程序二进制文件发生更改后重启。
restart_cmd_when_binary_changed=         ; 默认为 ""。程序文件发生更改后，使用重启命令字符串。
restart_signal_when_binary_changed=      ; 默认为 ""。程序文件发生更改后，则发送信号以重新启动的信号。
restart_directory_monitor=               ; 默认为 ""。为重新启动目的而被监视的路径。
restart_file_pattern=                    ; 默认为 ""。如果文件在 restart_directory_monitor 下发生更改并且文件名与此模式匹配，则进行重新启动。
restart_cmd_when_file_changed=           ; 默认为 ""。如果 restart_directory_monitor 下具有模式 restart_file_pattern 的任何受监视文件发生更改时的重启命令。
restart_signal_when_file_changed=        ; 默认为 ""。如果 restart_directory_monitor 下任何模式为 restart_file_pattern 的监控文件发生变化，该信号将被发送到程序。
depends_on =                             ; 默认为空。该程序的依赖。影响程序的启动顺序。
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

### 进程分组配置

对上文 `[program:x]` 进行配置分组，有如下两个作用：

* 通过 priority 控制一组进程的启动顺序。
* 通过 supervisord ctl 批量操作进程。

```ini
[group:x]
programs=bar,baz
priority=999
```

### eventlistener 配置

启动一个事件监听进程，参见：[编程交互-监听事件](#监听事件)。

```ini
[eventlistener:x]
; 略 和 [program:x] 基本一致。
```

## 编程交互

### 配置进程

supervisord 进程的配置是通过配置文件方式来实现的。因此，如果想通过编程的方式来配置一个进程，则需要规划好配置文件的格式。推荐的规划如下：

* 一个 supervisord 主配置文件。如位于 `/etc/supervisord.conf`。
* 多个 supervisord 的辅助配置文件。如位于 `/etc/supervisord.d/*.conf`

此时主配置文件 `/etc/supervisord.conf` 关于配置文件相关的配置如下所示。

```ini
[include]
files = /etc/supervisord.d/*.conf
; ...
```

需要对进程进行管理的程序，只需要在 `/etc/supervisord.d` 目录下添加相关配置文件，然后 reload 即可。

### 操作进程

supervisord 配置里启动一个 rpc server，然后就可以通过 rpc 协议来操作这些进程了，因此在主配置文件添加 rpc server 的相关配置，如果是本机管理，建议使用 socket 文件的方式。如：

```ini
[unix_http_server]
file = /var/run/supervisord.sock

[supervisorctl]
serverurl = unix:///var/run/supervisord.sock
```

此时，可以使用 ochinchina/supervisord 提供的 [xmlrpcclient](https://github.com/ochinchina/supervisord/tree/master/xmlrpcclient) 模块（`go get github.com/ochinchina/supervisord/xmlrpcclient`），来实现对进程的管理。

### 监听事件

> 协议参见：[Python 版文档](http://supervisord.org/events.html)。

略

## 其他说明

### 生产环境建议

[ochinchina/supervisord](https://github.com/ochinchina/supervisord) 项目从其文档，项目管理，代码风格，测试覆盖度等方面来看，质量并不高。因此如果在生产环境使用该项目，需要对所有依赖的功能，做好充分的测试。此外开发人员需要阅读、修改源码，来解决的问题的能力。

### 进程状态机

![image](/image/supervisord-subprocess-transitions.png)

* STOPPED 进程从未启动过。
* STARTING 进程正在启动中（进程启动，且持续时间 < startsecs。如果 startsecs = 0，则跳过该状态）。
* RUNNING 程序正在运行中（进程启动，且持续时间 >= startsecs。或 startsecs = 0 直接进入该状态）。
* BACKOFF 进程退出太快 （进程启动，在 < startsecs 之前就退出了，会进入该状态。然后如果还有 startretries 机会，会立即转换到 STARING 状态，尝试再次启动）。
* STOPPING 进程停止或者从未启动过。
* EXITED 进程从 RUNNING 状态退出（根据 autorestart、exitcodes 决定是否要重启）。
* FATAL 进程在经历了 startretries 次启动后，仍然未成功，则切换到该状态。
* UNKNOWN 未知，supervisord 发生问题。

### 按顺序启动进程

* 方式 1：（Go 版本独有）通过 program 配置段的 `depends_on` 参数可以按照顺序启动进程。
* 方式 2：通过 program 配置段的 `priority` 参数指定顺序。

### 进程更新自动重启

通过 program 配置段的 `restart_xxx` 相关配置可以实现。

### 编译问题

官方给的编译命令是：

```bash
go generate
GOOS=linux go build -tags release -a -ldflags "-linkmode external -extldflags -static" -o supervisord
```

这条命令需要再 alpine (musl-libc) 的操作系统中，编译的结果接口才能正常。如果在常规的 glibc 的 Linux 发行版中（如 debian）编译，将出现如下警告：

```
/tmp/go-link-2389416050/000002.o: In function `mygetgrouplist':
/xxx/src/os/user/getgrouplist_unix.go:18: warning: Using 'getgrouplist' in statically linked applications requires at runtime the shared libraries from the glibc version used for linking
```

这将导致编译出的二进制依赖 glibc，在 glibc 版本不正确，或者没有 glibc 的镜像中，使用 `program.user` 配置将 panic。

如果仍在 debian 系统进行编译，有如下几种解决办法：

1. 强制指定 musl-libc 编译。

    ```bash
    sudo apt-get update && sudo apt-get install -y musl-tools
    GOOS=linux CC=musl-gcc go build -tags release -a -ldflags "-linkmode external -extldflags -static" -o output/supervisord
    ```

2. 关闭 cgo。

    ```bash
    GOOS=linux CGO_ENABLED=0 go build -tags release -a -ldflags "-extldflags -static" -o output/supervisord
    ```

3. 单独设置 `os/user` 使用纯 go 实现。

    ```bash
    GOOS=linux go build -tags osusergo,release -a -ldflags "-linkmode external -extldflags -static" -o supervisord
    ```

### 问题

#### 缺失健康和就绪检查

* supervisord 对于进程的监控做的很不到位，没有健康检查机制（比如监控某个端口是否存在，http 请求状态等）。
* supervisord 对于没有对进程的就绪检查，只能通过 startsecs 参数来给程序设定初始化时间。某些场景，两个程序相互依赖，如 B -> A，且 B 需要等待 A 就绪 B 才能启动，且 A 的初始化时间不定，此时 supervisord 就没法很好的支持，只能在 B 程序中实现等待逻辑。

#### 缺失 pid 文件方式的进程管理

某些程序启动后立即退出，但是会产生一个 pid 文件，后续对该程序的管理以改 pid 文件为准。

supervisord 原生不支持该模式，在 Python 版中，需要通过一个 `pidproxy` 的程序来进行代理，参见：[pidproxy](http://supervisord.org/subprocess.html#pidproxy-program)。

#### startsecs 参数为 0 进程状态异常

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
