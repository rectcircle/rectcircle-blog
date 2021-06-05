---
title: "netcat 使用：问题定位 HTTP chunked 格式非法"
date: 2021-06-03T17:37:16+08:00
draft: false
toc: true
comments: true
tags:
  - untagged
---

## 起因

在修改一个后端项目的上传文件的接口，然后使用该后端项目对应的前端 cli 工具，调试该上传文件的接口过程中 

后端报错（后端是典型的 Java 11  Spring Boot 项目）

```log
11:42:36.747 [http-nio-8020-exec-1] ERROR o.a.c.c.C.[.[.[.[dispatcherServlet] - Servlet.service() for servlet [dispatcherServlet] in context with path [/extensions] threw exception [Request processing failed; nested exception is java.lang.RuntimeException: org.apache.catalina.connector.ClientAbortException: java.io.IOException: Invalid end of line sequence (character other than CR or LF found)] with root cause
java.io.IOException: Invalid end of line sequence (character other than CR or LF found)
        at org.apache.coyote.http11.filters.ChunkedInputFilter.throwIOException(ChunkedInputFilter.java:606)
        at org.apache.coyote.http11.filters.ChunkedInputFilter.parseCRLF(ChunkedInputFilter.java:424)
        at org.apache.coyote.http11.filters.ChunkedInputFilter.doRead(ChunkedInputFilter.java:202)
        at org.apache.coyote.http11.Http11InputBuffer.doRead(Http11InputBuffer.java:248)
        at org.apache.coyote.Request.doRead(Request.java:555)
        at org.apache.catalina.connector.InputBuffer.realReadBytes(InputBuffer.java:336)
        at org.apache.catalina.connector.InputBuffer.checkByteBufferEof(InputBuffer.java:632)
        at org.apache.catalina.connector.InputBuffer.read(InputBuffer.java:362)
        at org.apache.catalina.connector.CoyoteInputStream.read(CoyoteInputStream.java:132)
        at com.google.common.io.ByteStreams.toByteArrayInternal(ByteStreams.java:181)
        at com.google.common.io.ByteStreams.toByteArray(ByteStreams.java:221)
        ...
```

## 定位

由异常栈可以看出，是后端在读取 Request 的 InputStream 的时候，报错。具体到 ChunkedInputFilter 可以看出应该是与 Chunked 格式编码异常有关。

这种问题比较难以确定，因此可以通过对客户端请求进行抓包，进行确认。

### 客户端请求抓包

执 nc 命令，启动一个 TCP Server，监听在 8022 端口，并将客户端发送的请求重定向到 request.bin 文件

```bash
nc -lv -p 8022 > request.bin
```

重新执行 cli，后端配置成 8022

```bash
npx @byted/ovsx -r http://10.227.8.141:8022/extensions -p xxx-xx-xx-xx-xxxx publish vscodevim.vim-1.20.3.vsix
```

此时查看 request.bin 文件当做文本文件打开间将看到如下内容

```http
POST /xxx HTTP/1.1
Content-Type: application/octet-stream
Host: 10.227.8.141:8022
Connection: close
Transfer-Encoding: chunked

10000
乱码
```

使用 xxd 命令生成该文件的 16 进制编码情况

```bash
xxd request.bin request.hex
```

查看  request.hex 文件，将看到如下内容

```
...
00000090: 3032 320d 0a43 6f6e 6e65 6374 696f 6e3a  022..Connection:
000000a0: 2063 6c6f 7365 0d0a 5472 616e 7366 6572   close..Transfer
000000b0: 2d45 6e63 6f64 696e 673a 2063 6875 6e6b  -Encoding: chunk
000000c0: 6564 0d0a 0d0a 3130 3030 300d 0a50 4b03  ed....10000..PK.
...
```

### 将抓到的包发送给 Server 复现问题

```bash
nc 127.0.0.1 8020 < request.bin
``` 

上文提到的问题又复现了，说明这 request.bin 确实存在问题。后面直接分析 request.bin 文件即可

### 其他正常设备作为客户端进行抓包

使用其他设备进行抓包 （参考 客户端请求抓包），发现没有问题，对两次抓包的请求 hex 进行 diff 发现，有几大段数据存在 diff

### 根据 http chunked 编码协议编写程序进行分析

https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/Transfer-Encoding

```go
package main

import (
    "bytes"
    "fmt"
    "io/ioutil"
    "log"
    "os"
    "strconv"
)

func main() {
    f, err := os.Open(os.Args[1])
    if err != nil {
        log.Fatal(err)
    }

    content, err := ioutil.ReadAll(f)
    if err != nil {
        log.Fatal(err)
    }

    rnFlag := []byte("\r\n")
    dataStart := false
    for i := 4; i < len(content); {
        if dataStart == false && bytes.Equal(content[i-4:i-2], rnFlag) && bytes.Equal(content[i-2:i], rnFlag) {
            dataStart = true
        }
        if !dataStart {
            i++
            continue
        }
        fmt.Printf("%x\n", i)
        j := i
        for ; ; j++ {
            if (content[j] >= byte('0') && content[j] <= byte('9')) || (content[j] >= byte('A') && content[j] <= byte('F')) || content[j] >= byte('a') && content[j] <= byte('f') {
                continue
            }
            if content[j] == byte('\r') {
                if content[j+1] != byte('\n') {
                    log.Fatalf("ERR1 offset %x : want \\n but got %x", j+1, content[j+1])
                }
                break
            }
            log.Fatalf("ERR2 offset %x : want \\r or number but got %x", j+1, content[j+1])
        }
        chunkedLen, _ := strconv.ParseUint(string(content[i:j]), 16, 64)

        // 10000\r\n len()= 10000 \r\n
        // i     j 1  10000        2
        j = j + 1 + int(chunkedLen) + 2 + 1

        if content[j-2] != byte('\r') {
            log.Fatalf("ERR3 offset %x : want \\r but got %x", j-2, content[j-2])
        }
        if content[j-1] != byte('\n') {
            log.Fatalf("ERR4 offset %x : want \\r but got %x", j-1, content[j-1])
        }

        i = j
    }
    defer f.Close()
}
```

分析两个请求包

```bash
# 异常的请求
go run main.go request.bin
# c6
# 100cf
# 200d8
# 300e1
# 400ea
# 500f3
# 600fc
# 70105
# 8010e
# 90117
# 2021/06/04 13:23:25 ERR3 offset a011e : want \r but got 1e
# exit status 1

# 正常请求
go run main.go request2.bin
# 无输出
```

### 结论

在我的 设备上 ，cli 发送的请求，chunked 编码异常。

## Netcat 调试分析基于 TCP 的协议

Netcat 是一个功能强大的网络工具，上述定位过程使用到了 netcat 的两个能力：监听某个端口创建一个 TCP Server 以及 作为一个客户端向 TCP Server 发送消息
nc -lv -p 8022 > request.bin
nc 127.0.0.1 8020 < request.bin 

更多 netcat 用法参见
- [博客 1](https://mjd507.github.io/2018/01/15/Use-netcat-to-transfer-TCP-UDP-Data/)
- [博客 2](https://zhuanlan.zhihu.com/p/83959309)