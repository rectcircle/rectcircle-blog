---
title: "终端详解（四）简单实现一个支持作业控制的 Shell"
date: 2025-08-03T16:11:00+08:00
draft:  true
toc: true
comments: true
tags:
  - untagged
---

> 本文源码: [rectcircle/implement-terminal-from-scratch](https://github.com/rectcircle/implement-terminal-from-scratch)

## 前言

Shell 是我们与操作系统交互的重要桥梁，它不仅能执行命令行程序和解释 Shell 脚本，还具备一项需要与终端设备深度协作的核心功能 —— 作业控制 （Job Control）。

作业控制是 Shell 的高级特性，它让我们能够：

* 在后台运行程序（ `command &` ）
* 暂停和恢复进程（ Ctrl+Z 、 fg 、 bg ）
* 中断正在运行的程序（ Ctrl+C ）
* 管理多个并发任务

本文将通过 Go 语言实现一个简化版的 Shell，深入理解作业控制的工作原理。读完本文，将明白以下常见现象背后的技术原理：

* `proc1 | proc2` 管道符的实现原理是什么？
* `proc1 &` 后台进程，为什么还会输入到屏幕中？
* `proc1 &` ssh 断开后，后台任务为什么退出了？
* `nohup` 原理是什么？
* `ctrl+c` 原理是什么？

## 实现

### 初始化项目

```bash
cd project-demo
mkdir -p 02-shell-demo
cd 02-shell-demo
go mod init github.com/rectcircle/implement-terminal-from-scratch/project-demo/02-shell-demo
```

### 程序 REPL 框架

`project-demo/02-shell-demo/main.go`

```go
package main

import (
	"bufio"
	"fmt"
	"os"
	"strings"
)

func main() {
	reader := bufio.NewReader(os.Stdin)
	jobController := &JobController{}

	for {
		// 显示提示符
		fmt.Print("shell-demo> ")
		// 刷新输出缓冲区
		os.Stdout.Sync()

		// 读取用户输入
		input, err := reader.ReadString('\n')
		if err != nil {
			if err == io.EOF {
				fmt.Println("\nGoodbye!")
				break
			}
			fmt.Fprintf(os.Stderr, "Error reading input: %v\n", err)
			continue
		}

		// 去除首位换行符和空格
		input = strings.TrimSpace(input)

		// 如果输入为空，继续下一次循环
		if input == "" {
			continue
		}

		// 如果输入是 exit，退出程序
		if input == "exit" {
			fmt.Println("Goodbye!")
			break
		}

		// 解析并执行命令
		err = jobController.Execute(input)
		if err != nil {
			fmt.Fprintf(os.Stderr, "Error executing command: %v\n", err)
		}
	}
}
```

在 `project-demo/02-shell-demo/job.go` 先实现最简单的命令执行

```go
package main

import (
	"os"
	"os/exec"
	"strings"
)

type JobController struct {
}

// parseAndExecuteCommand 解析并执行命令
func (k *JobController) Execute(input string) error {
	// 分割命令和参数 (不考虑 "" '' 等语法)
	args := strings.Fields(input)
	if len(args) == 0 {
		return nil
	}

	// 第一个参数是命令，其余是参数
	cmd := exec.Command(args[0], args[1:]...)

	// 设置标准输入、输出、错误输出
	cmd.Stdin = os.Stdin
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	// 执行命令
	return cmd.Run()
}
```

### 管道符

在 `project-demo/02-shell-demo/job.go` 中，添加对 Job 的抽象，并实现管道符处理：

```go
package main

import (
	"io"
	"os"
	"os/exec"
	"strings"
	"syscall"
)

type JobController struct {
}

// Execute 解析并执行命令，支持管道符
func (k *JobController) Execute(input string) error {
	// 创建Job并执行
	job, err := NewJob(input)
	if err != nil {
		return err
	}
	return job.Execute()
}

// Job 表示一个作业，包含单个命令或管道命令
type Job struct {
	commands []*exec.Cmd     // 命令列表，每个元素是一个 *exec.Cmd
	pgid     int             // 进程组ID
	pipes    []io.ReadCloser // 管道连接
}

// NewJob 创建一个新的Job，解析命令字符串
func NewJob(input string) (*Job, error) {
	// 按管道符分割命令
	pipeCommands := strings.Split(input, "|")
	if len(pipeCommands) == 0 {
		return nil, nil
	}

	job := &Job{}

	// 将每个命令构造为 *exec.Cmd
	for _, cmdStr := range pipeCommands {
		cmdStr = strings.TrimSpace(cmdStr)
		args := strings.Fields(cmdStr)
		if len(args) == 0 {
			continue
		}

		cmd := exec.Command(args[0], args[1:]...)
		job.commands = append(job.commands, cmd)
	}

	return job, nil
}

// Execute 执行Job中的命令
func (j *Job) Execute() error {
	err := j.Start()
	if err != nil {
		return err
	}
	return j.Wait()
}

// Start 启动Job中的所有命令
func (j *Job) Start() error {
	if len(j.commands) == 0 {
		return nil
	}

	// 统一处理所有命令，都创建进程组
	cmds := j.commands

	// 设置管道连接
	for i, cmd := range cmds {
		// 设置管道
		if i == 0 {
			// 第一个命令从标准输入读取
			cmd.Stdin = os.Stdin
		} else {
			// 后续命令从前一个命令的输出读取
			cmd.Stdin = j.pipes[i-1]
		}

		if i == len(cmds)-1 {
			// 最后一个命令输出到标准输出
			cmd.Stdout = os.Stdout
		} else {
			// 中间命令的输出作为管道
			stdout, err := cmd.StdoutPipe()
			if err != nil {
				return err
			}
			j.pipes = append(j.pipes, stdout)
		}

		// 所有命令的错误输出都到标准错误
		cmd.Stderr = os.Stderr
	}

	// 启动所有命令，并设置进程组
	for i, cmd := range cmds {
		if i == 0 {
			// 第一个进程作为进程组组长
			cmd.SysProcAttr = &syscall.SysProcAttr{
				Setpgid: true,
				Pgid:    0, // 0 表示使用进程自己的PID作为进程组ID
			}
		} else {
			// 后续进程加入第一个进程的进程组
			cmd.SysProcAttr = &syscall.SysProcAttr{
				Setpgid: true,
				Pgid:    j.pgid,
			}
		}

		if err := cmd.Start(); err != nil {
			return err
		}

		// 记录第一个进程的进程组ID
		if i == 0 {
			j.pgid = cmd.Process.Pid
		}
	}

	return nil
}

// Wait 等待Job中的所有进程退出
func (j *Job) Wait() error {
	if len(j.commands) == 0 {
		return nil
	}

	// 统一使用进程组等待
	// 等待进程组中的所有进程完成
	// 使用 Wait4 等待进程组
	for {
		var status syscall.WaitStatus
		// 等待进程组中的任意子进程
		pid, err := syscall.Wait4(-j.pgid, &status, 0, nil)
		if err != nil {
			// 如果没有更多子进程，退出循环
			if err == syscall.ECHILD {
				break
			}
			return err
		}

		// 检查是否所有进程都已完成
		allDone := true
		for _, cmd := range j.commands {
			if cmd.Process != nil && cmd.ProcessState == nil {
				allDone = false
				break
			}
		}

		if allDone {
			break
		}

		// 如果进程异常退出，返回错误
		if !status.Exited() || status.ExitStatus() != 0 {
			// 继续等待其他进程，但记录错误状态
			_ = pid // 可以在这里记录哪个进程出错
		}
	}

	return nil
}
```

这里参考了 bash，将命令的执行抽象为 Job 概念：

* 单命令，是一个 Job
* `|` 管道符连接的多个命令，也是一个 Job。
* 不管单命令，还是多命令，都会为每个 Job 都会创建一个进程组。

以 `proc1 | proc2 | proc3` 作业为例。

* 三个进程会在同一个进程组内，组长为 `proc1`，这样方便调用 wait4 系统调用，等待这组进程退出。
* 这三个进程 stdio 连接情况如下：

    ```
    +--------------+           +------------------+           +------------------+           +------------------+
    |my-shell stdin| --dup2--> |stdin proc1 stdout| --pipe--> |stdin proc2 stdout| --pipe--> |stdin proc3 stdout|
    +--------------+           |            stderr|           |            stderr|           |            stderr|
                               +------------------+           +------------------+           +------------------+
                                               |                              |                              |
                                               +------------------------------+-----------------------------+
                                                                              |
                                                                            (dup2)
                                                                              |
                                                                              v
                                                                        my-shell.stderr
    ```

* 关于进程某个退出后，POSIX 行为如下，以 proc2 退出为例：
    * proc2 进程的 stdio 文件描述符会被关闭。
    * proc1 写入时会触发 SIGPIPE 信号，默认改程序会退出。
    * proc3 读取 stdin 会返回 EOF，一般情况下，程序会自行退出。

### 作业控制

作业控制实现了，一个交互式 Shell 可以在后台运行多个任务。具体而言：

* 0 个或 1 个 Job 在前台运行，0 个或多个 Job 在后台运行。
* 前台 Job 可以切换到后台，后台 Job 可以切换到前台。
* 前台 Job 可以接收来自终端的的控制信号，后台 Job 不受影响。
* 交互式 Shell 退出后，所有的 Job 均被 SIGHUP （挂断信号） 终止。

#### 是否可以启用作业控制

如上可以看出，作业控制和终端密切相关，因此一个 shell 要启用作业控制能力，必须满足如下两个条件：

* stdin 是否是 tty/pty。
* shell 所在进程组必须是当前会话的前台进程组。

因此，以 bash 为例：

* 如下条件将可以启用作业控制：
    * 使用 ssh/webshell 连接到远端启动的 `shell`： ssh/webshell server 会配置好会话和 pty。
    * 在一个 shell 交互式终端内执行 `bash`： 这个 bash 自然的在父 shell 的前台进程组内且 stdin 和 stdout 是 tty/pty。
* 如下条件将无法启用作业控制：
    * `echo 'ls -al' | bash`： 此时 bash 的 stdin 是一个 pipe。
    * `bash &`： 此时 bash 不在前台进程组。

在 `project-demo/02-shell-demo/job.go` 实现一个方法，判断当前进程是否可以启用作业控制。

```go
import (
	// ..
    "golang.org/x/sys/unix"

)

// ...

// CanEnableJobControl 判断当前进程是否可以启用作业控制
func (k *JobController) CanEnableJobControl() bool {
	// 检查是否有控制终端
	if !isatty(os.Stdin.Fd()) {
		return false
	}

	// 获取当前进程的进程组ID
	currentPgid := syscall.Getpgrp()

	// 获取前台进程组ID
	foregroundPgid, err := unix.IoctlGetInt(int(os.Stdin.Fd()), unix.TIOCGPGRP)
	if err != nil {
		return false
	}

	// 如果当前进程组就是前台进程组，则可以启用作业控制
	return currentPgid == foregroundPgid
}

// isatty 检查文件描述符是否是终端
func isatty(fd uintptr) bool {
	_, err := unix.IoctlGetTermios(int(fd), ioctlReadTermios)
	return err == nil
}
```

`project-demo/02-shell-demo/main.go` 添加检查，如果无法启用作业控制，则直接退出。

```go
// ...
func main() {
	reader := bufio.NewReader(os.Stdin)
	jobController := &JobController{}

	if !jobController.CanEnableJobControl() {
		fmt.Println("Job control not available. Exiting.")
		os.Exit(1)
	}

    // ...
}
```

获取终端信息，有一些跨平台问题，因此需要使用条件编译。

`project-demo/02-shell-demo/term_unix_bsd.go` MacOS 等系统：

```go
// https://github.com/golang/term/blob/master/term_unix_bsd.go

//go:build darwin || dragonfly || freebsd || netbsd || openbsd

package main

import "golang.org/x/sys/unix"

const ioctlReadTermios = unix.TIOCGETA

// const ioctlWriteTermios = unix.TIOCSETA
```

`project-demo/02-shell-demo/term_unix_other.go` Linux 等系统：

```go
// https://github.com/golang/term/blob/master/term_unix_other.go

//go:build aix || linux || solaris || zos

package main

import "golang.org/x/sys/unix"

const ioctlReadTermios = unix.TCGETS

// const ioctlWriteTermios = unix.TCSETS
```

测试：

```bash
cd project-demo/02-shell-demo
# 如下将可以正常执行
go run .
# 如下将立即退出，打印 Job control not available. Exiting. 
go run . &
# 如下将立即退出，打印 Job control not available. Exiting.
echo 'ls' | go run .
```

#### 支持 `&` 后台 Job

#### 孤儿进程组？？？

#### TODO

首先，要实现作业控制，在 Shell 启动阶段，Shell 必须要处于前台进程组内。

## 总结

* 将 shell 进程作为会话首进程、会话领导者、控制进程、拥有一个控制终端，不需要 shell 程序自己实现，而是由引导程序通过如下方式设置：
    * fork 出进程，如下操作均在子进程中调用
    * 调用 setsid 创建一个会话（同时切断与之前控制终端的联系）。
    * 紧接着调用 `ioctl(slave_fd, TIOCSCTTY, 0)` 将当前进程的控制终端设置为指定的终端设备，同时当前进程所在的会话也会和该终端设备关联（`Terminal Input/Output Control Set Controlling TTY`）。
    * 使用 dup2 系统调用，将当前进程的 stdin stdout stderr 重定向到终端设置文件中。
    * exec 加载 shell 程序。
* shell 进程如何告知控制终端，前台进程组是哪个？
    * 通过 `tcsetpgrp` 系统调用（Terminal Control SET Process GRouP） 设置前台进程组。
    * 不只是 shell 可以调用这个函数，该会话内的所有进程都有权限调用（bash 里面再起一个 bash 的场景的作业控制也就可以实现了）。
* 作业控制信号：
    * 终端收到如下快捷键，内核会发送信号给关联的会话的前台进程组：
        * `ctrl+c` SIGINT 中断信号
        * `ctrl+\` SIGQUIT 退出信号
        * `ctrl+z` SIGSTP 挂起信号 （内核将前台进程组挂起后会向父进程 shell 发送 SIGCHLD 信号，Shell 接收到信号后，会将 shell 设置为前台进程组）
    * pty master 被 close 时，内核会发送 SIGHUP （挂断信号） 给会话内的所有进程。
        * 因此 `&` 后，ssh 断开后，进程会挂掉。
        * 此外，如果会话领导者退出了，内核也会发送 SIGHUP 信号。
* 后台进程组
    * 读取终端（即读 stdin 时），内核会向该进程发送 SIGTTIN 信号。
    * 后台进程组打印的内容会直接打印到屏幕上（因为这些的程的 stdout 和 stderr 进程了父进程的，指向的都是这个终端设备，是同一个设备文件），因此需要 `> output.log 2>&1 &`。
* 作业和管道：
    * 作业是 shell 的概念不是操作系统的概念。
    * 一般由 `|` 连接起来的命令会组成一个 job，一般 job 和进程组一一对应。
* nohup 的原理：通过忽略 SIGHUP 信号实现的，并重定向标准输出，然后 exec 加载这个程序（nohup 进程就是要执行的进程本身）。
* 观测办法：
    * `ps -o pid,ppid,pgid,sid,comm`
* 判断当前前台进程组是谁？

## TODO

setpgid 需要父子进程均调用。
