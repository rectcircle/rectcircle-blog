---
title: "终端详解（四）简单实现一个支持作业控制的 Shell"
date: 2025-10-14T21:40:00+08:00
draft:  false
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
* `ctrl+c` 原理是什么？
* `proc1 &` ssh 断开后，后台任务为什么退出了？`nohup` 原理是什么？

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
	job, err := NewJob(input)
	if err != nil {
		return err
	}
	// 启动 Job
	err = job.Start()
	if err != nil {
		return err
	}
	return job.Wait()
}

// Job 表示一个作业，包含单个命令或管道命令
type Job struct {
	commands []*exec.Cmd     // 命令列表，每个元素是一个 *exec.Cmd
	pgid     int             // 进程组ID
	pipes    []io.ReadCloser // 管道连接
	exitCode int           // Job 整体退出码（最后一个进程），-1 表示正在运行中

}

// NewJob 创建一个新的Job，解析命令字符串
func NewJob(input string) (*Job, error) {
	// 按管道符分割命令
	pipeCommands := strings.Split(input, "|")
	if len(pipeCommands) == 0 {
		return nil, nil
	}

	job := &Job{}
	job.exitCode = -1

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

	for i, cmd := range j.commands {
		if cmd.Process == nil {
			// 进程还没有启动
			continue
		}
		var wstatus syscall.WaitStatus
		wpid, err := syscall.Wait4(cmd.Process.Pid, &wstatus, 0, nil)
		// Wait4 出错，可能是进程不存在或权限问题
		if err != nil {
			if err == syscall.ECHILD {
				// 进程已经不存在了
				continue
			}
			// 未知错误，直接抛异常
			return err
		}
		if wpid == 0 {
			// WNOHANG 且没有子进程状态变化，说明进程还在运行
			continue
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

> 另外： Setpgid 的 Go 的实现隐藏了一个细节。如果是 C 的实现需要 fork 后，父子进程都需要调用 Setpgid 以避免静态问题。

### 前台进程组

在上一步，为 Job 创建了进程组。但是没有将这个 Job 设置为前台进程组。因此，这个 shell-demo 和 bash 相比无法正确的处理信号：

比如：

```bash
cd project-demo/02-shell-demo
go run .
# 输入 sleep 100 
# 输入 回车
# 输入 ctrl+c
```

此时 shell-demo 就退出了，这和 bash 行为是不一致的。bash 的行为是将 sleep 100 进程停止， bash 继续等待用户输入。

因为只有前台进程组才能收到终端输入的 ctrl+c 信号，要实现类似 bash 的行为需要：

1. 在创建 JobController 的时候，记录当前 shell 所在进程组 ID
2. 在执行 Job 进程组的时候，需要将前台进程组从 Shell 所在进程组切换到 Job 所在进程组。
3. 在 Job 进程组退出后，将前台进程组重新设置为 Shell 所在进程组（必须切换回来，否则 Shell 通过 stdin 读取终端时会触发 SIGTTIN 信号，因为 stdin 只能前台进程组可以读取）。

`project-demo/02-shell-demo/job.go` 添加 JobController 构造函数，记录当前 shell 所在进程组 ID：

```go
import (
    // ...
	"golang.org/x/sys/unix"
)

type JobController struct {
	// 当前 shell 所在的前台进程组 ID
	shellForegroundPgid int
}


func NewJobController() (*JobController, error) {
	currentPgid, err := unix.Getpgid(0)
	if err != nil {
		return nil, fmt.Errorf("Execute job, get pgid failed: %s", err)
	}

	return &JobController{
		shellForegroundPgid: currentPgid,
	}, nil
}
```

在 `project-demo/02-shell-demo/main.go` main 函数中使用构造函数新建 JobController：

```go
func main() {
	reader := bufio.NewReader(os.Stdin)
	jobController, err := NewJobController()
	if err != nil {
		fmt.Println("Job control not available. Exiting.")
		os.Exit(1)
	}
	//...
}
```

`project-demo/02-shell-demo/job.go` Job 的 Start 方法，实现上述第 2 点：

```go
	// ...
	for i, cmd := range cmds {
		if i == 0 {
			// 第一个进程作为进程组组长，并将该进程组设置为前台
			cmd.SysProcAttr = &syscall.SysProcAttr{
				Setpgid: true,
				Pgid:    0, // 0 表示使用进程自己的PID作为进程组ID
				// 实现原理是：
				// 1. 在 fork 之前，调用 sigprocmask 屏蔽了所有信号 (runtime/proc.go syscall_runtime_BeforeFork)。
				// 2. 在 fork 之后 exec 之前：
				//    a. 调用 TIOCSPGRP 将子进程进程组设置为 session 的前台进程组 (syscall/exec_libc2.go forkAndExecInChild)。
				//    b. 调用 msigrestore 恢复到信号屏蔽集 (runtime/proc.go syscall_runtime_AfterForkInChild)。
				Foreground: true, // 将当前进程组设置为 session 的前台进程组
			}
		}
		// ...
	}
	// ...
```

`project-demo/02-shell-demo/job.go` JobController 的 Execute 方法，实现上述第 3 点：

```go
func (k *JobController) ForceSetShellForeground() {
	// 需要忽略 SIGTTOU 信号，否则会导致前台进程组切换失败，原因如下：
	// 1. Unix 系统为了安全，当调用 TIOCSPGRP 的进程不在前台进程组时，会发送 SIGTTOU 信号，而 SIGTTOU 的默认行为是退出进程。
	//    因为 TIOCSPGRP 是给 Shell 程序调用的，如果普通程序调用这个函数，会破坏 Shell 的作业管理，因此 Unix 系统才设计了这个机制。
	// 2. 我们实现的这个程序就是一个 Shell，因此就是要调用 TIOCSPGRP 的，因此需要避免 SIGTTOU 信号的影响，有两种办法。
	//    a. 忽略这个信号，这里采用这个方案。
	//    b. 通过 sigprocmask 屏蔽这个信号（这里需要说一下，对于其他信号，屏蔽信号只是延后信号的处理，但是对于 SIGTTOU 信号，屏蔽了之后，就不会再产生了） Go 的 syscall.SysProcAttr.Foreground 通过该方案实现。
	signal.Ignore(syscall.SIGTTOU)
	defer signal.Reset(syscall.SIGTTOU)
	err := unix.IoctlSetPointerInt(int(os.Stdin.Fd()), unix.TIOCSPGRP, k.shellForegroundPgid)
	if err != nil {
		panic(err)
	}
}

// Execute 解析并执行命令，支持管道符
func (k *JobController) Execute(input string) error {
	job, err := NewJob(input)
	if err != nil {
		return err
	}
	// 启动 Job
	err = job.Start()
	if err != nil {
		return err
	}
	defer k.ForceSetShellForeground() // 执行结束后强制把 shell 进程设置为前台

	return job.Wait()

}
```

关于 TIOCSPGRP 以及 SIGTTOU 详见 [文档](https://pubs.opengroup.org/onlinepubs/9699919799/functions/tcsetpgrp.html)。

### 作业控制

前文已经介绍了前台进程组，已经涉及了作业控制的核心部分，即前台/后台进程组，而作业控制就是对多个 Job 的前后台的管理。

* 0 个或 1 个 Job 在前台运行，0 个或多个 Job 在后台运行。
* 前台 Job 可以切换到后台，后台 Job 可以切换到前台。
* 前台 Job 可以接收来自终端的的控制信号，后台 Job 不受影响。
* 交互式 Shell 退出后，所有的 Job 均被 SIGHUP （挂断信号） 终止。

#### 是否支持作业控制

如上可以看出，作业控制和终端密切相关，因此一个 shell 要启用作业控制能力，必须满足如下两个条件：

* stdin 是否是 tty/pty。
* shell 所在进程组必须是当前会话的前台进程组。

因此，以 bash 为例：

* 如下条件将可以启用作业控制：
    * 使用 ssh/webshell 连接到远端启动的 `shell`： ssh/webshell server 会配置好会话和 pty。
    * 在一个 shell 交互式终端内执行 `bash`： 这个 bash 自然的在父 shell 的前台进程组内且 stdin 和 stdout 是 tty/pty。
* 这里介绍一下，一些无法启用作业控制例子：
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
	// 获取前台进程组ID
	pgrpid := syscall.Getpgrp()

	// 如果当前进程组就是前台进程组，则可以启用作业控制
	return k.shellForegroundPgid == pgrpid
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

#### 启动后台 Job

在 Bash 中，可以通过在命令末尾添加 `&` 符号，将一个命令置入后台执行，即启用后台 Job。

Bash 后台 Job 的表现如下：

* 后台进程启动后，Bash 不会等待后台进程退出，而是打印 Job ID 和进程组 ID 后，进入下一轮 REPL 循环，等待用户输入新的命令。
* 后台进程组不会设置为当前会话的前台进程组，也就是说 ctrl + c 等信号不会发送给这个后台进程组。
* 后台进程的标准输出会输出到当前终端，因此可能出现前后台进程组日志交替输出的现象。
* 当后台进程组退出后，在 REPL 的下一个命令执行时，会打印这个后台进程组已经退出的相关日志。

例如 `echo 'sleep 2 && echo abc' | sh &` 输入情况如下：

* 立即打印： `[1] 77842`
* 立即打印： `$PS1` 然后等待用户输入
* 2 秒后打印： `abc`
* 按回车后打印： `[1]+  Done                    echo 'sleep 2 && echo abc' | sh`

首先把 `project-demo/02-shell-demo/main.go` 的 main 函数里将用户输入空串的 continue 的逻辑删除掉，因为空串仍然需要后台 Job 逻辑（）。

```diff
@@ -37,11 +41,6 @@ func main() {
                // 去除首位换行符和空格
                input = strings.TrimSpace(input)
 
-               // 如果输入为空，继续下一次循环
-               if input == "" {
-                       continue
-               }
-
```

然后 `project-demo/02-shell-demo/job.go` 的 Job 结构体：

* 需要添加 `commandStr`、`exitCode`、`background` 来记录 Job 的命令字符串、退出码以及是否是后台任务，并在 `NewJob` 构造函数解析 `&` 符号，并对前面的字段进行正确初始化。
* Job 的 Start 函数的 `Foreground` 字段由 Job 的 `background` 字段值决定。
* 对 `Wait` 函数进行扩展改造：
    * 支持非阻塞调用，在后台 Job 场景，需要通过非阻塞调用来检测 Job 情况。
    * Job 最后一个命令的退出码需记录到 Job 结构体的 `exitCode` 字段中。

```go
// Job 表示一个作业，包含单个命令或管道命令
type Job struct {
	commandStr string          // 命令字符串
	// ...
	exitCode   int             // Job 整体退出码（最后一个进程），-1 表示正在运行中

	background bool // 是否是后台 job
}


// NewJob 创建一个新的Job，解析命令字符串
func NewJob(commandStr string) (*Job, error) {
	commandStr = strings.TrimSpace(commandStr)
	background := false
	if strings.HasSuffix(commandStr, "&") {
		background = true
		commandStr = strings.TrimSuffix(commandStr, "&")
	}

	// 按管道符分割命令
	pipeCommands := strings.Split(commandStr, "|")
	if len(pipeCommands) == 0 {
		return nil, nil
	}

	job := &Job{}
	job.commandStr = commandStr
	job.background = background
	job.exitCode = -1

	// ...
}

// Start 启动Job中的所有命令
func (j *Job) Start() error {
	// ..
				Foreground: !j.background, // 将当前进程组设置为 session 的前台进程组
	// ..
}

func (j *Job) Wait(wnohang bool) error {
	if j.exitCode != -1 {
		return nil
	}
	if len(j.commands) == 0 {
		j.exitCode = 0
		return nil
	}
	// 调用 wait 命令检查进程状态
	waitOptions := 0
	if wnohang {
		waitOptions = syscall.WNOHANG
	}
	for i, cmd := range j.commands {
		// ...
		wpid, err := syscall.Wait4(cmd.Process.Pid, &wstatus, waitOptions, nil)
		// ...
		if i == len(j.commands)-1 {
			// 最后一个命令的退出码作为 job 的退出码
			j.exitCode = wstatus.ExitStatus()
		}
	}
	return nil
}
```

最后 `project-demo/02-shell-demo/job.go` 的 JobController 结构体：

* 添加 `runningJobIds map[int]*Job` 字段，记录运行中的所有 Job。
* 在 `NewJobController` 构造函数中，对 `runningJobIds` 进行初始化。
* 在 `Execute` 函数中，前置检查并打印已退出的 Job，并区分前后台 Job 执行不同的逻辑。

```go

type JobController struct {
	// ...
	// 运行中的 job id (从 1 开始)
	runningJobIds map[int]*Job

}

func NewJobController() (*JobController, error) {
	//...

	return &JobController{
		// ...
		runningJobIds:       make(map[int]*Job),
	}, nil
}

// NewJob 新建一个 Job，返回 JobID
func (k *JobController) AddJob(input string) (int, error) {
	job, err := NewJob(input)
	if err != nil {
		return 0, err
	}
	var jobId = 1
	for ; ; jobId++ {
		if _, ok := k.runningJobIds[jobId]; !ok {
			k.runningJobIds[jobId] = job
			break
		}
	}

	return jobId, nil
}

// Execute 解析并执行命令，支持管道符
func (k *JobController) Execute(input string) error {
	// 前置流程：检查后台进程是否执行完成
	for jobId, job := range k.runningJobIds {
		if job.background {
			err := job.Wait(true)
			if err != nil {
				return err
			}
			var statusStr = ""
			if job.exitCode == -1 {
				// 进程还在运行
				continue
			} else if job.exitCode == 0 {
				statusStr = "Done"
			} else {
				statusStr = fmt.Sprintf("Exit %d", job.exitCode)
			}
			fmt.Printf("[%d] %s                  %s\n", jobId, statusStr, job.commandStr)
			delete(k.runningJobIds, jobId)
		}
	}

	// 空字符串啥都不做
	if input == "" {
		return nil
	}

	// 创建 Job
	jobId, err := k.AddJob(input)
	if err != nil {
		return err
	}
	job := k.runningJobIds[jobId]
	// 启动 Job
	err = job.Start()
	if err != nil {
		return err
	}
	// 前台执行
	if !job.background {
		defer func() { // 执行结束后，从 job 列表中删除
			delete(k.runningJobIds, jobId)
		}()
		defer k.ForceSetShellForeground() // 执行结束后强制把 shell 进程设置为前台
		return job.Wait(false)
	}
	// 后台执行
	fmt.Printf("[%d] %d\n", jobId, job.pgid)
	return nil
}
```

#### 前后台 Job 切换

在 Bash 中前后台 Job 的创建和切换操作和原理如下所示：

* 启动后台 Job: 用户在命令最后添加 `&`，详见上文。
* 启动前台 Job: 用户直接输入命令，详见上文。
* 前台 Job -> 后台 (暂停状态) Job: 用户键入 `ctrl+z`。
    * 该 Job 进程组内的所有进程，将接收到 SIGTSTP 信号 (Terminal Stop, 20)，内核将这些进程的调度状态设置为 STOP。
    * Bash 进程 wait4 系统调用返回，通过 wstatus 可以获取到这些进程处于 stopped 状态（不再能获取到CPU，也就是进程被暂停，不再执行了）。
    * Bash 进程将该进程设置为后台 Job，并将 Bash 自身设置为前台进程组，打印当前该 Job 的 jobid、处于退出状态、命令字符串如： `[1]+  Stopped                 sleep 100`，并打印命令提示符，等待下一个命令。
* 后台 (暂停状态) Job -> 后台 (运行中) Job：用户在命令提示符输入 `bg <jobid>`。
    * Bash 向该处于暂停状态的后台 Job 的进程组发送 SIGCONT (Continue, 18) 信号。
    * 内核将该进程组的所有进程加入内核调度队列，进入正常调度。
    * Bash 打印 jobid 以及命令字符串全文以及 `&` 后缀，如： `[1]+ sleep 100 &`。并打印命令提示符，等待下一个命令。
* 后台 Job -> 前台 Job： 用户在命令提示符输入  `fg <jobid>`。
    * 打印命令字符串全文。
    * 如果该后台 Job 处于 Stop 状态，则先向该处于暂停状态的后台 Job 的进程组发送 SIGCONT (Continue, 18) 信号。
    * 将 Job 的进程组设置为前台进程组。
    * 阻塞 wait4 该 Job 的进程组退出或暂停。
* 用户可以通过 `jobs` 这 bash 内置命令获取到所有后台任务。

    如：

    ```
    [1]   Running                 sleep 1000 &
    [2]+  Stopped                 sleep 10000
    [3]-  Running                 sleep 100000 &
    ```

    * 第一列 `[jobid]±` 表示 job id，其中 `+` 和 `-` 的含义参见： [文档](https://tldp.org/LDP/abs/html/x9644.html#JOBIDTABLE)，本文不多介绍。
    * 第二列 `Running|Stopped|Done|Exit x` 表示 Job 状态
    * 剩余列 `命令字符串`，如果是 Running 状态则包含 `&` 符号。

一个示例如下：

```
$ sleep 1000&
[1] 58485

$ sleep 10000
^Z
[2]+  Stopped                 sleep 10000

$ sleep 100000
^Z
[3]+  Stopped                 sleep 100000

$ bg 3
[3]+ sleep 100000 &

$ jobs
[1]   Running                 sleep 1000 &
[2]+  Stopped                 sleep 10000
[3]-  Running                 sleep 100000 &
```

> 其他说明： Linux 中暂停一个进程除了 SIGTSTP (Terminal Stop, 20, 可捕获， ctrl+z 或 kill 触发) 外，还有一个 SIGSTOP (Stop, 19, 不可捕获， kill 触发) 信号，两者都能通过 SIGCONT 恢复

修改 `project-demo/02-shell-demo/job.go` 添加相关逻辑

```go
package main

import (
	// ...
	"sort"
	"strconv"
	// ...
)

// Job 状态常量
const (
	JobStatusRunning = "Running"
	JobStatusStopped = "Stopped"
	JobStatusDone    = "Done"
)

// ...

// Execute 解析并执行命令，支持管道符
func (k *JobController) Execute(input string) error {
	// 前置流程：检查后台进程是否执行完成
	for _, jobId := range k.sortedJobIds() {
		job := k.runningJobIds[jobId]
		if job.background {
			err := job.Wait(true)
			if err != nil {
				return err
			}
			var statusStr = ""
			if job.exitCode == -1 {
				// 进程还在运行
				continue
			} else if job.exitCode == 0 {
				statusStr = JobStatusDone
			} else {
				statusStr = fmt.Sprintf("Exit %d", job.exitCode)
			}
			fmt.Printf("[%d] %s                  %s\n", jobId, statusStr, job.commandStr)
			delete(k.runningJobIds, jobId)
		}
	}

	// 空字符串啥都不做
	if input == "" {
		return nil
	}

	// 尝试执行内建命令
	isBuiltin, err := k.tryExecuteBuiltinCommand(input)
	if err != nil {
		fmt.Fprintf(os.Stderr, "%s\n", err.Error())
		return nil
	}
	if isBuiltin {
		return nil
	}

	// 创建 Job
	jobId, err := k.AddJob(input)
	if err != nil {
		return err
	}
	job := k.runningJobIds[jobId]
	// 启动 Job
	err = job.Start()
	if err != nil {
		delete(k.runningJobIds, jobId)
		return err
	}
	// 前台执行
	if !job.background {
		return k.waitForegroundJob(jobId, job)
	}
	// 后台执行
	fmt.Printf("[%d] %d\n", jobId, job.pgid)
	return nil
}


func (k *JobController) sortedJobIds() []int {
	keys := make([]int, 0, len(k.runningJobIds))
	for id := range k.runningJobIds {
		keys = append(keys, id)
	}
	sort.Ints(keys) // 升序
	return keys
}

// tryExecuteBuiltinCommand 处理内置命令，返回是否是内置命令
func (k *JobController) tryExecuteBuiltinCommand(input string) (bool, error) {
	args := strings.Fields(input)
	if len(args) == 0 {
		return false, nil
	}

	switch args[0] {
	case "jobs":
		return true, k.handleJobsCommand()
	case "bg":
		if len(args) != 2 {
			return true, fmt.Errorf("bg: usage: bg <jobid>")
		}
		return true, k.handleBgCommand(args[1])
	case "fg":
		if len(args) != 2 {
			return true, fmt.Errorf("fg: usage: fg <jobid>")
		}
		return true, k.handleFgCommand(args[1])
	default:
		return false, nil
	}
}

// handleJobsCommand 处理 jobs 命令
func (k *JobController) handleJobsCommand() error {
	for _, jobId := range k.sortedJobIds() {
		job := k.runningJobIds[jobId]
		var statusStr string
		if job.exitCode == -1 {
			statusStr = JobStatusRunning
		} else if job.exitCode == -2 {
			statusStr = JobStatusStopped
		} else if job.exitCode == 0 {
			statusStr = JobStatusDone
		} else {
			statusStr = fmt.Sprintf("Exit %d", job.exitCode)
		}

		commandStr := job.commandStr
		if job.exitCode == -1 && job.background {
			commandStr += " &"
		}

		fmt.Printf("[%d] %s                  %s\n", jobId, statusStr, commandStr)
	}
	return nil
}

// handleBgCommand 处理 bg 命令
func (k *JobController) handleBgCommand(jobIdStr string) error {
	jobId, err := strconv.Atoi(jobIdStr)
	if err != nil {
		return fmt.Errorf("bg: invalid job id: %s", jobIdStr)
	}

	job, exists := k.runningJobIds[jobId]
	if !exists {
		return fmt.Errorf("bg: job %d not found", jobId)
	}

	if job.exitCode != -2 {
		return fmt.Errorf("bg: job %d is not stopped", jobId)
	}

	// 向进程组发送 SIGCONT 信号
	err = syscall.Kill(-job.pgid, syscall.SIGCONT)
	if err != nil {
		return fmt.Errorf("bg: failed to send SIGCONT to job %d: %v", jobId, err)
	}

	// 更新 Job 状态
	job.exitCode = -1
	job.background = true

	// 打印 Job 信息
	fmt.Printf("[%d] %s &\n", jobId, job.commandStr)

	return nil
}

// handleFgCommand 处理 fg 命令
func (k *JobController) handleFgCommand(jobIdStr string) error {
	jobId, err := strconv.Atoi(jobIdStr)
	if err != nil {
		return fmt.Errorf("fg: invalid job id: %s", jobIdStr)
	}

	job, exists := k.runningJobIds[jobId]
	if !exists {
		return fmt.Errorf("fg: job %d not found", jobId)
	}

	// 打印命令字符串
	fmt.Printf("%s\n", job.commandStr)

	// 如果 Job 处于 Stop 状态，先发送 SIGCONT 信号
	if job.exitCode == -2 {
		err = syscall.Kill(-job.pgid, syscall.SIGCONT)
		if err != nil {
			return fmt.Errorf("fg: failed to send SIGCONT to job %d: %v", jobId, err)
		}
	}

	// 将 Job 的进程组设置为前台进程组
	signal.Ignore(syscall.SIGTTOU)
	defer signal.Reset(syscall.SIGTTOU)
	err = unix.IoctlSetPointerInt(int(os.Stdin.Fd()), unix.TIOCSPGRP, job.pgid)
	if err != nil {
		return fmt.Errorf("fg: failed to set job %d as foreground: %v", jobId, err)
	}

	// 更新 Job 状态
	job.background = false
	job.exitCode = -1

	// TODO: 走统一的 wait 前台进程逻辑，也需要支撑 ctrl + z
	// 阻塞等待 Job 退出或暂停
	return k.waitForegroundJob(jobId, job)
}

// waitForegroundJob 等待前台 Job 执行完成，并处理清理逻辑
func (k *JobController) waitForegroundJob(jobId int, job *Job) error {
	defer func() { // 执行结束后，从 job 列表中删除
		if job.exitCode != -1 && job.exitCode != -2 {
			delete(k.runningJobIds, jobId)
		}
	}()
	defer k.ForceSetShellForeground() // 执行结束后强制把 shell 进程设置为前台

	err := job.Wait(false)
	if err != nil {
		return err
	}

	// 判断是否是 stop 状态
	if job.exitCode == -2 {
		fmt.Printf("[%d] %s                  %s\n", jobId, JobStatusStopped, job.commandStr)
	}

	return nil
}

// Job 表示一个作业，包含单个命令或管道命令
type Job struct {
	commandStr string          // 命令字符串
	commands   []*exec.Cmd     // 命令列表，每个元素是一个 *exec.Cmd
	pgid       int             // 进程组ID
	pipes      []io.ReadCloser // 管道连接
	exitCode   int             // Job 整体退出码：-1 运行中，-2 已暂停，其他值为退出码
	background bool            // 是否是后台 job
}

// ...

func (j *Job) Wait(wnohang bool) error {
	if j.exitCode != -1 {
		return nil
	}
	if len(j.commands) == 0 {
		j.exitCode = 0
		return nil
	}
	// 调用 wait 命令检查进程状态
	waitOptions := syscall.WUNTRACED // 添加 WUNTRACED
	if wnohang {
		waitOptions |= syscall.WNOHANG // 使用位或操作
	}

	for i, cmd := range j.commands {
		if cmd.Process == nil {
			// 进程还没有启动
			continue
		}
		var wstatus syscall.WaitStatus
		wpid, err := syscall.Wait4(cmd.Process.Pid, &wstatus, waitOptions, nil)
		// Wait4 出错，可能是进程不存在或权限问题
		if err != nil {
			if err == syscall.ECHILD {
				// 进程已经不存在了
				continue
			}
			// 未知错误，直接抛异常
			return err
		}
		if wpid == 0 {
			// WNOHANG 且没有子进程状态变化，说明进程还在运行
			continue
		}
		// 检查进程是否被暂停
		if wstatus.Stopped() {
			j.exitCode = -2
			// 对于暂停的进程，不设置 exitCode
			return nil
		}

		if i == len(j.commands)-1 {
			// 最后一个命令的退出码作为 job 的退出码
			j.exitCode = wstatus.ExitStatus()
		}
	}
	return nil
}

// ...
```

#### 挂断信号

SIGHUP（Hangup，挂断）是 Unix/POSIX 系统中的一个信号，最初用于表示“控制终端断开”（例如串口/调制解调器挂断）。现代系统中，pty master 被 close 时，内核会发送 SIGHUP （挂断信号） 给会话内的所有进程。

这也是为什么 SSH 断开连接后，正在运行的程序全都退出了。

而 nohup 就是通过忽略 SIGHUP 信号，然后重定向标准输出/标准出错输出到文件（当标准输出/标准出错为终端时）（默认为 nohup.out），标准输入不处理，然后 exec 加载这个程序（nohup 进程就是要执行的进程本身），来解决 shell 退出后，后台任务退出的问题。

常见用法如下：

```bash
nohup your_cmd >/var/log/your_cmd.log 2>&1 </dev/null &
```

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
    * 这个系统调用会产生一个 SIGTTOU 信号，需要忽略 SIGTTOU 信号，否则会导致前台进程组切换失败。
* 作业控制信号：
    * 终端收到如下快捷键，内核会发送信号给关联的会话的前台进程组：
        * `ctrl+c` SIGINT 中断信号
        * `ctrl+\` SIGQUIT 退出信号
        * `ctrl+z` SIGSTP 挂起信号 （内核暂停前台进程组的进程，然后父进程 wait4 会返回，然后可以获取这个进程是否处于 stop 状态，然后可以将之切换到后台）
    * pty master 被 close 时，内核会发送 SIGHUP （挂断信号） 给会话内的所有进程。
        * 因此 `&` 后，ssh 断开后，进程会挂掉。
        * 此外，如果会话领导者退出了，内核也会发送 SIGHUP 信号。
* 后台进程组
    * 读取终端（即读 stdin 时），内核会向该进程发送 SIGTTIN 信号。
    * 后台进程组打印的内容会直接打印到屏幕上（因为这些的程的 stdout 和 stderr 进程了父进程的，指向的都是这个终端设备，是同一个设备文件），因此需要 `> output.log 2>&1 &`。
* 作业和管道：
    * 作业是 shell 的概念不是操作系统的概念。
    * 一般由 `|` 连接起来的命令会组成一个 job，一般 job 和进程组一一对应。
* nohup 的原理：通过忽略 SIGHUP 信号并对标准输出标准出错进行重定向，然后 exec 加载这个程序（nohup 进程就是要执行的进程本身），来解决 shell 退出后，后台任务退出的问题。
* 观测办法：
    * `ps -o pid,ppid,pgid,sid,comm`
