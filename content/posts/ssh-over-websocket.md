---
title: "实现 SSH Over Websocket"
date: 2022-12-28T14:19:23+08:00
draft: true
toc: true
comments: true
tags:
  - untagged
---

## 备忘

ssh proxy

```
package main

import (
	"fmt"
	"io"
	"net"
	"os"
)

// ssh -o "ProxyCommand go run ./ %h:%p" -p 22 root@127.0.0.1
func main() {
	if len(os.Args) != 2 {
		fmt.Fprintf(os.Stderr, "Usage: %s <addr>\n", os.Args[0])
		os.Exit(1)
	}
	var (
		addr = os.Args[1]
		in   = os.Stdin
		out  = os.Stdout
	)
	conn, err := net.Dial("tcp", addr)
	if err != nil {
		fmt.Fprintf(os.Stderr, "%v\n", err)
		os.Exit(1)
	}
	errc := make(chan error, 1)
	go func() {
		_, e := io.Copy(conn, in)
		errc <- e
	}()
	go func() {
		_, e := io.Copy(out, conn)
		errc <- e
	}()
	if err = <-errc; err != nil {
		fmt.Fprintf(os.Stderr, "%v\n", err)
		os.Exit(1)
	}
}
```

