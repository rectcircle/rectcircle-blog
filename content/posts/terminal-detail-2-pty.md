---
title: "终端详解（二）PTY 详解"
date: 2025-07-28T00:36:00+08:00
draft: false
toc: true
comments: true
tags:
  - untagged
---

> 本文源码: [rectcircle/implement-terminal-from-scratch](https://github.com/rectcircle/implement-terminal-from-scratch)

## PTY 简述

上文，已经介绍了 xterm.js （终端模拟器）的输入输出是一对 ANSI 字符流。在 Unix 系统中，这对 ANSI 字符流并没有直接和应用程序的 stdio 对接。在系统内核中，对终端模拟器设备进行了抽象，提供了一种称为 PTY 的设备类型（硬件终端对应的是 TTY 设备，和 PTY 类似，本文不多介绍）。

每个 PTY 设备会产生两个设备文件描述符，一个（主设备）和终端模拟器连接，一个（从设备）和应用程序的 stdio 连接（一般为 shell 程序），这两个文件描述符中间存在一个被称为行规程（line discipline）的内核程序，来实现通用逻辑。

```
    应用程序 (Shell: Bash/Zsh 等)
      stdin  stdout/stderr
        ^       |
        |       |
      /dev/pts/xxx (从设备 slave，文件描述符)
        |       |
        |       v
    line discipline (行规程)
        ^       |
        |       |
      /dev/ptmx   (主设备 master，文件描述符)
        |       |
        |       v
    终端模拟器
```

## 行规程行为详解

行规程对终端进行一些预处理，实现了一些通用逻辑，会做如下工作：

* line buffer: 对终端模拟器中的字符输入，进行输入缓冲，直到按 `\r` （回车符），应用程序才能读到（终端诞生的时代计算机性能羸弱，如果每个字符都直接传递给应用程序，会造成性能问题。当然，现代的应用程序也可以配置这个行规程的默认行为，让行规程立即将字符发送给应用程序）。
* line edit: 根据终端模拟器输入的一些特殊字符对行缓冲中的字符序列进行编辑，如退格等。
* echo: 回显。在[终端输入 API](/posts/terminal-detail-1-device/#终端输入-api)小节中，在终端中输入的内容，终端中并没有显示，而这依赖回显功能实现。即行规程从终端接收到一个可打印字符后，会立即原样发送回终端。
* job control: 作业控制，将一些快捷键转换为信号发送给应用程序（如 ctrl+c 等）。

下面使用一个 Go 程序验证行规程的行为（源码详见 [github](https://github.com/rectcircle/implement-terminal-from-scratch/tree/master/experiment/03-pty-demo)）。

首先，准备一个模拟的应用程序，该程序只做两件事：

* 接收 SIGINT (2) 信号，接收到后，打印日志并退出。
* 读取 stdin，并将 stdin 转换为字符串，然后用 JSON 格式化一下并打印。

`experiment/03-pty-demo/02-echo-stdin-json-str/main.go`

```go
package main

import (
	"encoding/json"
	"io"
	"os"
	"os/signal"
)

func main() {
	// 处理 ctrl+c 信号
	ctrlCCh := make(chan os.Signal, 1)
	signal.Notify(ctrlCCh, os.Interrupt)
	go func() {
		<-ctrlCCh
		os.Stdout.Write([]byte("[echo-stdin-json-str][signal]: SIGINT (2)\n"))
		os.Exit(0)
	}()

	// 读并打印 stdin 内容
	buf := make([]byte, 4*1024*1024)
	for {
		n, err := os.Stdin.Read(buf)
		if err != nil {
			if err == io.EOF {
				break
			}
			panic(err)
		}

		input := string(buf[:n])
		inputJsonStr, err := json.Marshal(input)
		if err != nil {
			panic(err)
		}
		os.Stdout.Write([]byte("[echo-stdin-json-str][stdin]: "))
		os.Stdout.Write(inputJsonStr)
		os.Stdout.Write([]byte("\n"))
	}

}
```

然后，使用实现一个验证程序，该程序：

* 启动上面的模拟应用程序，并将这个应用程序连接到 pty slave。
* 从 pty master 读取内容，然后原样打印。
* 然后发送一些 PTY 序列，观察输出，观测 pty 行规程的应为。

`experiment/03-pty-demo/01-pty-host/main.go`

```go
package main

import (
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"time"

	"github.com/creack/pty"
)

const ASNIEInputSeqDemo = "hello world\r" + // 第一行: 常规的 ascii 字符，应用程序原样接受
	"中文\r" + // 第二行：中文字符，行为和第一行一样，应用程序原样接受
	"  对于可打印字符(中英文)\r" +
	"    1.在应用程序接受之前已经打印了，这是行规程的回显功能\r" +
	"    2.行规程原样透传到应用程序\r" +
	"    3.行规程将 \\r 转换为 \\n 传递给应用程序\r" +
	"    4.行规程有一个行 buffer 遇到 \\r 才会将 buffer 的内容传递给应用程序\r" +
	"测试行编辑(按退格的效果\\u007f): hello world,\u007f!\r" +
	"  可以看出，\\u007f 删除了前面的逗号, 应用程序接受到的是 hello world!\r" +
	"测试行编辑(按方向键效果): world\u001b[D\u001b[D\u001b[D\u001b[D\u001b[Dhello \r" +
	"  可以看出，方向键不会影响行规程的行编辑\r" +
	"* 即将发送 ctrl+c 信号，应用程序将收到 SIGINT(2) 信号\r" +
	"\u0003" // 最后一行：ctrl+c 信号

func main() {
	binPath, err := filepath.Abs("./echo-stdin-json-str")
	if err != nil {
		panic(err)
	}
	cmd := exec.Command(binPath)

	ptyMaster, err := pty.Start(cmd)
	if err != nil {
		panic(err)
	}
	defer ptyMaster.Close()
	go func() {
		_, _ = io.Copy(os.Stdout, ptyMaster)
	}()
	for _, b := range []byte(ASNIEInputSeqDemo) {
		_, err = ptyMaster.Write([]byte{b})
		if err != nil {
			panic(err)
		}
		time.Sleep(10 * time.Millisecond)
	}
}
```

运行测试：

```bash
cd experiment/03-pty-demo
go build -o echo-stdin-json-str ./02-echo-stdin-json-str
go run ./01-pty-host
```

输出如下（Mac 环境输出，Linux 应该也类似）：

```
hello world
[echo-stdin-json-str][stdin]: "hello world\n"
中文
[echo-stdin-json-str][stdin]: "中文\n"
  对于可打印字符(中英文)
[echo-stdin-json-str][stdin]: "  对于可打印字符(中英文)\n"
    1.在应用程序接受之前已经打印了，这是行规程的回显功能
[echo-stdin-json-str][stdin]: "    1.在应用程序接受之前已经打印了，这是行规程的回显功能\n"
    2.行规程原样透传到应用程序
[echo-stdin-json-str][stdin]: "    2.行规程原样透传到应用程序\n"
    3.行规程将 \r 转换为 \n 传递给应用程序
[echo-stdin-json-str][stdin]: "    3.行规程将 \\r 转换为 \\n 传递给应用程序\n"
    4.行规程有一个行 buffer 遇到 \r 才会将 buffer 的内容传递给应用程序
[echo-stdin-json-str][stdin]: "    4.行规程有一个行 buffer 遇到 \\r 才会将 buffer 的内容传递给应用程序\n"
测试行编辑(按退格的效果\u007f): hello world!
[echo-stdin-json-str][stdin]: "测试行编辑(按退格的效果\\u007f): hello world!\n"
  可以看出，\u007f 删除了前面的逗号, 应用程序接受到的是 hello world!
[echo-stdin-json-str][stdin]: "  可以看出，\\u007f 删除了前面的逗号, 应用程序接受到的是 hello world!\n"
测试行编辑(按方向键效果): world^[[D^[[D^[[D^[[D^[[Dhello 
[echo-stdin-json-str][stdin]: "测试行编辑(按方向键效果): world\u001b[D\u001b[D\u001b[D\u001b[D\u001b[Dhello \n"
  可以看出，方向键不会影响行规程的行编辑
[echo-stdin-json-str][stdin]: "  可以看出，方向键不会影响行规程的行编辑\n"
* 即将发送 ctrl+c ，应用程序将收到 SIGINT(2) 信号
[echo-stdin-json-str][stdin]: "* 即将发送 ctrl+c ，应用程序将收到 SIGINT(2) 信号\n"
^C[echo-stdin-json-str][signal]: SIGINT (2)
```

上文使用了 Go 的 github.com/creack/pty 库实现了 pty 的创建。该库实现了对各种操作系统 pty 创建过程的封装，屏蔽了各个操作系统的差异和创建和使用过程。

## 创建 PTY

为了更好的了解 pty 的创建和使用过程，下面将使用 C 语言重新实现一遍能在 Linux 环境运行的上述 `pty-host`。

`experiment/03-pty-demo/03-pty-host-linux-c/main.c`

```c
// #define _GNU_SOURCE
#include <stdio.h>       // printf, perror, snprintf
#include <stdlib.h>      // exit
#include <string.h>      // strlen
#include <unistd.h>      // fork, close, read, write, dup2, execl, setsid
#include <fcntl.h>       // open, O_RDWR, O_NOCTTY
#include <sys/wait.h>    // waitpid
// #include <pty.h>         // openpty, unlockpt, ptsname_r (POSIX PTY API)
#include <signal.h>      // kill, SIGTERM
#include <time.h>        // nanosleep, timespec
#include <sys/ioctl.h>   // ioctl, TIOCSPTLCK, TIOCGPTN, TIOCSCTTY

// 定义输入序列，与Go版本保持一致
const char* PTY_INPUT_SEQ_DEMO = 
    "hello world\r"  // 第一行: 常规的 ascii 字符，应用程序原样接受
    "中文\r"        // 第二行：中文字符，行为和第一行一样，应用程序原样接受
    "  对于可打印字符(中英文)\r"
    "    1.在应用程序接受之前已经打印了，这是行规程的回显功能\r"
    "    2.行规程原样透传到应用程序\r"
    "    3.行规程将 \\r 转换为 \\n 传递给应用程序\r"
    "    4.行规程有一个行 buffer 遇到 \\r 才会将 buffer 的内容传递给应用程序\r"
    "测试行编辑(按退格的效果\x7f): hello world,\x7f!\r"
    "  可以看出，\\x7f 删除了前面的逗号, 应用程序接受到的是 hello world!\r"
    "测试行编辑(按方向键效果): world\x1b[D\x1b[D\x1b[D\x1b[D\x1b[Dhello \r"
    "  可以看出，方向键不会影响行规程的行编辑\r"
    "* 即将发送 ctrl+c 信号，应用程序将收到 SIGINT(2) 信号\r"
    "\x03";  // 最后一行：ctrl+c 信号

void sleep_ms(int ms) {
    struct timespec ts;
    ts.tv_sec = ms / 1000;
    ts.tv_nsec = (ms % 1000) * 1000000;
    nanosleep(&ts, NULL);
}

int main() {
    int master_fd, slave_fd;
    pid_t pid;
    char slave_name[256];
    
    // 如下是 POSIX PTY API 实现
    // if (openpty(&master_fd, &slave_fd, slave_name, NULL, NULL) == -1) {
    //     perror("openpty failed");
    //     exit(1);
    // }
    
    // 如下是 Linux 原生方式创建PTY
    // 打开 master 端
    master_fd = open("/dev/ptmx", O_RDWR | O_NOCTTY);
    if (master_fd == -1) {
        perror("open /dev/ptmx failed");
        exit(1);
    }
    
    // 解锁 slave 端
    // if (unlockpt(master_fd) == -1) {
    //     perror("unlockpt failed");
    //     close(master_fd);
    //     exit(1);
    // }
    
    // 使用 ioctl 解锁 slave 端
    int unlock = 0;
    if (ioctl(master_fd, TIOCSPTLCK, &unlock) == -1) {
        perror("ioctl TIOCSPTLCK failed");
        close(master_fd);
        exit(1);
    }

    // 获取 slave 端名称
    // if (ptsname_r(master_fd, slave_name, sizeof(slave_name)) != 0) {
    //     perror("ptsname_r failed");
    //     close(master_fd);
    //     exit(1);
    // }

    // 使用ioctl获取PTY编号并构造slave名称
    unsigned int pty_num;
    if (ioctl(master_fd, TIOCGPTN, &pty_num) == -1) {
        perror("ioctl TIOCGPTN failed");
        close(master_fd);
        exit(1);
    }
    snprintf(slave_name, sizeof(slave_name), "/dev/pts/%u", pty_num);

    printf("pty slave path is: %s\n", slave_name);

    // 4. 打开slave端
    slave_fd = open(slave_name, O_RDWR | O_NOCTTY);
    if (slave_fd == -1) {
        perror("open slave failed");
        close(master_fd);
        exit(1);
    }
    
    printf("PTY slave file path: %s\n", slave_name);
    
    // Fork子进程
    pid = fork();
    if (pid == -1) {
        perror("fork failed");
        exit(1);
    }
    
    if (pid == 0) {
        // 子进程：设置为slave端并执行echo-stdin-json-str
        close(master_fd);
        
        // 创建新会话
        if (setsid() == -1) {
            perror("setsid failed");
            exit(1);
        }
        
        // 使用ioctl设置slave_fd为控制终端
        if (ioctl(slave_fd, TIOCSCTTY, 0) == -1) {
            perror("ioctl TIOCSCTTY failed");
            exit(1);
        }

        // 重定向标准输入输出到slave
        if (dup2(slave_fd, STDIN_FILENO) == -1 ||
            dup2(slave_fd, STDOUT_FILENO) == -1 ||
            dup2(slave_fd, STDERR_FILENO) == -1) {
            perror("dup2 failed");
            exit(1);
        }
        
        close(slave_fd);
        
        // 执行echo-stdin-json-str程序
        execl("./echo-stdin-json-str", NULL);
        perror("execl failed");
        exit(1);
    } else {
        // 父进程：作为 master 端
        close(slave_fd);
        
        // 创建子进程来读取 PTY 输出并打印到 stdout
        pid_t reader_pid = fork();
        if (reader_pid == 0) {
            // 读取子进程
            char buffer[1024];
            ssize_t bytes_read;
            
            while ((bytes_read = read(master_fd, buffer, sizeof(buffer))) > 0) {
                write(STDOUT_FILENO, buffer, bytes_read);
            }
            exit(0);
        }
        
        // 发送输入序列
        const char* input = PTY_INPUT_SEQ_DEMO;
        size_t len = strlen(input);
        
        for (size_t i = 0; i < len; i++) {
            if (write(master_fd, &input[i], 1) == -1) {
                perror("write to master failed");
                break;
            }
            sleep_ms(10);  // 10毫秒延迟，与Go版本一致
        }
        
        // 等待子进程结束
        int status;
        waitpid(pid, &status, 0);
        
        // 终止读取进程
        kill(reader_pid, SIGTERM);
        waitpid(reader_pid, NULL, 0);
        
        close(master_fd);
    }
    
    return 0;
}
```

运行测试：

```bash
cd experiment/03-pty-demo
go build -o echo-stdin-json-str ./02-echo-stdin-json-str
go run ./01-pty-host
```

输出略，和上述 Go 版本一致。

在 C 语言中版本示例中，展示了创建 PTY 的更多细节：

* pty-host 进程：
    * 使用 open 系统调用，打开 `/dev/ptmx` 文件，获取到 pty master 的文件描述符。即，创建了一个 pty master，同步 pty slave 文件也在 `/dev/pts/xxx` 创建好了。
    * 使用 ioctl 通过 TIOCSPTLCK 操作 pty master 文件描述符吗，对其关联的 pty slave 进行解锁（关于 pty 锁定机制，详见下文）。
    * 使用 ioctl 通过 TIOCGPTN 获取 pty slave 的编号，即可获取到 pty slave 文件的路径。
    * 通过 open 系统调用，打开 `/dev/pts/xxx` 文件，获取到 pty slave 的文件描述符。
    * fork 子进程 echo-stdin-json-str（见下文 echo-stdin-json-str 子进程）。
    * 再 fork 一个子进程，读取 pty master，并打印到 stdout 中，观察效果（和 go 逻辑相同）。
    * 将测试的 PTY_INPUT_SEQ_DEMO 写入 pty master（和 go 逻辑相同）。
* echo-stdin-json-str 子进程：
    * 关闭无需使用的 pty master 文件描述符 。
    * 通过 setsid 创建一个新会话（同步创建一个进程组）。
    * 通过 ioctl 将这个 pty (pty slave) 设置为这个会话的控制终端，同时这个进程将拥有这个控制终端。设置为控制终端后，这个终端接收到例如 `ctrl+c` 的 ANSI escape 序列后，pty 行规程才会将对应的信号发送给当前进程（准确的说是拥有控制终端的进程组）（关于控制终端相关，详见后续文章）。
    * 设置当前进程的 stdin、stdout、stdout 为这个 pty slave。
    * 加载执行 echo-stdin-json-str 程序。

关于 PTY 锁定机制（来源 Trae AI）：

> PTY 的锁定机制是一个历史遗留的安全特性，主要有以下几个方面的意义：
>
> 1. 权限和所有权设置的安全窗口保护 [1](https://unix.stackexchange.com/questions/477247/is-pseudo-terminals-unlockpt-tiocsptlck-a-security-feature)：
>    * 在早期系统中，从设备（slave device）的权限和所有权设置需要一定时间
>    * 锁定机制确保在权限和所有权正确设置之前，其他进程无法访问从设备
>
> 2. 权限控制 [2](https://man7.org/linux/man-pages/man3/grantpt.3.html)：
>    * 从设备的用户 ID 被设置为调用进程的真实 UID
>    * 从设备的组 ID 被设置为特定值（例如 tty）
>    * 从设备的访问模式被设置为 0620（crw--w----）
>
> 3. 初始化保护 [3](https://man7.org/linux/man-pages/man3/unlockpt.3.html)：
>    * `unlockpt()` 必须在打开从设备之前调用
>    * 这确保了从设备在完成所有必要的初始化和权限设置之前不会被访问
>
> 在现代 Linux 系统中，特别是使用 devpts 文件系统的系统上，这个锁定机制实际上已经变得不那么重要了。因为 devpts 文件系统可以在创建设备时就确保正确的权限和所有权，不存在权限设置的时间窗口问题。但是为了兼容性，这个机制仍然被保留下来。
