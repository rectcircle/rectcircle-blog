---
title: "终端详解（三）实现 WebShell"
date: 2025-08-03T16:11:00+08:00
draft: false
toc: true
comments: true
tags:
  - untagged
---

> 本文源码: [rectcircle/implement-terminal-from-scratch](https://github.com/rectcircle/implement-terminal-from-scratch)

## 设计思路

前面系列文章已介绍 terminal 设备 API 和 PTY 的相关机制。基于此，可以按照如下思路实现一个简单的 WebShell 服务：

* Client (浏览器) <-> Server 使用 WebSocket 进行通讯，收发 ANSI escape 字符流。
* Client 使用 [xterm.js](https://xtermjs.org/) 库，实现终端能力。
* Server 使用 Go 实现：
    * HTTP Server 由使用 Go 的 `"net/http"` 标准库提供支持。
    * WebSocket 协议由 [github.com/coder/websocket](https://github.com/coder/websocket) 库提供支持。
    * PTY 创建由 [github.com/creack/pty](https://github.com/creack/pty) 库提供支持。
* 此外，在 Client 和 Server ANSI escape 字符流收发位置打印传输内容，以便于观测 terminal 相关技术内部实现原理。

## Client

使用 vite 创建一个 vanilla (不适用任何框架) 前端项目，并添加 xterm.js 依赖。

```bash
npm create vite@latest 
npm install -D @xterm/xterm
```

编写 [client/src/main.js](https://github.com/rectcircle/implement-terminal-from-scratch/blob/master/project-demo/01-webshell-demo/client/src/main.js)：

```js
// 引入项目 css
import './style.css'
// 引入 xterm 的 css
import '../node_modules/@xterm/xterm/css/xterm.css'
// 引入 xterm.js
import { Terminal } from '@xterm/xterm'


// 逻辑
async function main() {
  // 创建一个终端实例
  const terminal = new Terminal();
  terminal.open(document.querySelector('#app'));

  // 创建 websocket client ， 连接到 server。
  const wsConn = new WebSocket(`ws://localhost:8080/`);

  // 从 terminal 获取到的用户输入的 ANSI escape 字符流，发送给服务端。
  terminal.onData((data) => {
    // 打印日志
    console.log("terminal->ws: "+JSON.stringify(data) + " [" + (new TextEncoder()).encode(data) + "]");
    wsConn.send(data);
  });
  
  // 从 websocket 读取服务端返回的 ANSI escape 字符流，写入终端中。
  wsConn.onmessage = (event) => {
    // 打印日志
    console.log("ws->terminal: "+JSON.stringify(event.data) + " [" + (new TextEncoder()).encode(event.data) + "]");
    terminal.write(event.data);
  };

  // 其他： 略
  wsConn.onerror = (event) => {
    console.error('WebSocket error: ', event);
    // TODO: 错误处理
  }
  wsConn.onclose = (event) => {
    // TODO: 关闭处理
  }

}

main();
```

## Server

使用 `go mod init` 创建一个 Go module，然后编写服务端 [`server/main.go`](https://github.com/rectcircle/implement-terminal-from-scratch/blob/master/project-demo/01-webshell-demo/server/main.go)：

首先，在 main 函数中注册 http 处理函数并启动 http server：

```go
package main

import (
	"log/slog"
	"net/http"
	"os"
)

func main() {
	// 注册处理函数
	http.HandleFunc("/", ptyWsHandler)

	// 在 8080 端口启动 http 服务器
	slog.Info("Starting webshell demo server on :8080...")
	if err := http.ListenAndServe(":8080", nil); err != nil {
		slog.Error("http listen and serve failed ", "err", err)
		os.Exit(1)
	}
}
```

ptyWsHandler 处理函数， upgrade websocket 请求，创建 pty 和 bash 进程，并将 pty master 和 websocket 流对接。

```go
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"

	"github.com/coder/websocket"
)


func ptyWsHandler(w http.ResponseWriter, r *http.Request) {

	// 允许跨域（仅测试）。
	options := &websocket.AcceptOptions{
		OriginPatterns: []string{"*"},
	}

	// 接收 websocket upgrade 请求。
	wsConn, err := websocket.Accept(w, r, options)
	if err != nil {
		slog.Error("websocket accept failed", "err", err)
		return
	}
	defer wsConn.CloseNow()

	// 创建 pty，创建一个 bash 进程，并将 pty slave 和 bash 进程绑定。
	// 然后，返回 pty master。
	ptyFile, err := startShellByPty()
	if err != nil {
		slog.Error("start shell by pty failed", "err", err)
		wsConn.Close(websocket.StatusInternalError, "start shell by pty failed")
		return
	}
	defer ptyFile.Close()

	// 创建一个新的 ctx。
	ctx := context.Background()

	// 创建两个 channel 接收 websocket 关闭信号。
	clientToPtyCloseCh := make(chan struct{})
	ptyToClientCloseCh := make(chan struct{})

	// 从 pty master 读取 -> 写入到 websocket
	go func() {
		buf := make([]byte, 1024)
		for {
			// 从 pty 读取数据
			n, err := ptyFile.Read(buf)
			if err != nil {
				// TODO: 细化错误处理
				slog.Error("read from pty failed", "err", err)
				wsConn.Close(websocket.StatusNormalClosure, err.Error())
				close(clientToPtyCloseCh)
				return
			}
			if n > 0 {
				// 打印日志
				jsonStr, _ := json.Marshal(string(buf[:n]))
				fmt.Printf("pty->ws: %s, %v\n", string(jsonStr), buf[:n])
				// 读取到数据后，将其写入 WebSocket
				err := wsConn.Write(ctx, websocket.MessageText, buf[:n])
				if err != nil {
					// TODO: 细化错误处理
					slog.Error("write to websocket failed", "err", err)
					_ = ptyFile.Close()
					close(clientToPtyCloseCh)
					return
				}
			}
		}
	}()

	// read from websocket -> write to pty file
	// 从 websocket 读取 -> 写入到 pty master
	go func() {
		for {
			// 从 WebSocket 读取数据
			_, buf, err := wsConn.Read(ctx)
			if err != nil {
				// TODO: 细化错误处理
				slog.Error("read from websocket failed", "err", err)
				_ = ptyFile.Close()
				close(ptyToClientCloseCh)
				return
			}

			if len(buf) > 0 {
				// 打印日志
				jsonStr, _ := json.Marshal(string(buf))
				fmt.Printf("ws->pty: %s, %v\n", string(jsonStr), buf)
				// 读取到数据后，将其写入 pty
				_, err := ptyFile.Write(buf)
				if err != nil {
					// TODO: 细化错误处理
					slog.Error("write to pty failed", "err", err)
					_ = wsConn.Close(websocket.StatusNormalClosure, err.Error())
					close(ptyToClientCloseCh)
					return
				}
			}
		}
	}()

	select {
	case <-clientToPtyCloseCh:
	case <-ptyToClientCloseCh:
	}
}
```

startShellByPty 函数，实现非常简单，使用 github.com/creack/pty 库来启动进程即可。

```go
package main

import (
	"os/exec"

	"github.com/creack/pty"
)


func startShellByPty() (*os.File, error) {
	cmd := exec.Command("/bin/bash", "-il")
	// 使用伪终端启动这个命令
	return pty.Start(cmd)
}
```

## 启动服务

启动 server

```bash
cd project-demo/01-webshell-demo/server
go run ./
```

启动 client

```bash
cd project-demo/01-webshell-demo/client
npm install
npm run dev
```

打开客户端页面： http://localhost:5173/ 即获取到一个运行 bash 的终端。

在 server 控制台和客户端页面的开发者工具均可可以观察到 ANSI escape 字符流的详细情况。
