---
title: "Nginx 反向代理 Upstream 失败重试和封禁机制"
date: 2022-10-20T19:43:04+08:00
draft: false
toc: true
comments: true
tags:
  - untagged
---

## 概述

在 Nginx 中，使用 proxy_pass 进行反向代理时，可以使用： `proxy_next_upstream`、`proxy_next_upstream_tries`、`server 的 max_fails 参数`、`server 的 fail_timeout 参数` 来配置失败重试以及 upstream server 的封禁机制。

这里通过实验来验证这些字段的含义和用途，防止错误配置出现线上 bug。

## 重试机制

* [`proxy_next_upstream`](http://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_next_upstream)：默认值为 `error timeout`，用来定义哪些场景配置为：不成功的尝试（unsuccessful attempts）。可以配置为 `error timeout http_500` 等。
* [`proxy_next_upstream_tries`](http://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_next_upstream_tries)：默认值为 `0` 即不限制，用来定义不成功的尝试（unsuccessful attempts）的尝试次数，注意这里是尝试（`tries`） 不是重试（`retries`），也就是说：
    * `0` 表示不限制，尝试所有 upstream 的 server。
    * `1` 表示只尝试 1 次，也就是说，第 1 次尝试，不管是否为不成功的尝试（unsuccessful attempts），就立即返回。
    * `2` 表示尝试 2 次，也就是说，第 1 次尝试，如果为不成功的尝试（unsuccessful attempts），就额外在尝试 1 次。

## server 封禁

* [`server 的 max_fails 参数`](http://nginx.org/en/docs/http/ngx_http_upstream_module.html)：默认值为 `1`，用来配置 server 封禁，介绍参见下文。
* [`server 的 fail_timeout 参数`](http://nginx.org/en/docs/http/ngx_http_upstream_module.html)：`10s`，用来配置 server 封禁，介绍参见下文。

Nginx 会为 upstream 的每个 server 维护一个 `counter`，这个 `counter` 被定义为，从当前时间往前 `fail_timeout` 的时间段内（实现上可能是简单的分时间段，需要看源码），该 server 作为第 1 个尝试 server 且这次尝试被定义为不成功的尝试（unsuccessful attempts）的尝试的请求的次数。举个例子：

* 某 upstream 有 3 个 server，一个请求过来：
    * 按照负载均衡策略，第 1 个尝试了 server1，但是响应命中了 `proxy_next_upstream` 参数，为不成功的尝试（unsuccessful attempts）。
    * 按照 `proxy_next_upstream_tries = 2` 又尝试了 server2，但是响应命中了 `proxy_next_upstream` 参数，为不成功的尝试（unsuccessful attempts）。
    * Nginx 给客户端返回 server1 的响应。
* 此时：
    * server1 的 `counter` 递增 1。
    * server2 的 `counter` 不变。

当某个 server 的 `counter` 等于 `max_fails` 后，这个 server 将被封禁 `fail_timeout`，封禁期间该节点将不会尝试。

当封禁到期后，该 server 重新接收请求，并将 `counter` 归零。

需要特别注意的是：实测，Nginx 以上的节点封禁规则生效的前提为 `proxy_next_upstream_tries != 1`。

## 配置示例

```nginx
# ...

http {
    upstream demo {
        server  127.0.0.1:8001;  # 默认: max_fails=1 fail_timeout=10s
        server  127.0.0.1:8002;  # 默认: max_fails=1 fail_timeout=10s
        server  127.0.0.1:8003;  # 默认: max_fails=1 fail_timeout=10s
    }
    server {
        listen       8000;
        server_name  localhost;

        location /500 {
            proxy_next_upstream error timeout http_500; # 哪些错误认为是不成功的尝试（unsuccessful attempts），默认为 error timeout，这里的只 http_500 是个例子，强烈不建议设置，否则可能导致异常的节点封禁。
            proxy_next_upstream_tries 2;                # 尝试下一个 server 的次数，默认为 0 不限制
            proxy_pass http://demo; 
        }
    }
    # ...
}
```

## 实验过程

### 网络拓扑

```
client ---> nginx (:8000) ---> server 1 (:8001)
                           |
                           +-> server 2 (:8002)
                           |
                            -> server 3 (:8003)
```

### 实验代码

#### Server

(`server/main.go`)

```go
package main

import (
	"fmt"
	"net/http"
	"os"
	"sync/atomic"
)

var counter int32

func resp502(w http.ResponseWriter, req *http.Request) {
	atomic.AddInt32(&counter, 1)
	clientcounter := req.URL.Query().Get("counter")
	fmt.Printf("(%s) server counter: %d, client counter:%s\n", os.Args[1], counter, clientcounter)
	w.WriteHeader(500)
	fmt.Fprintf(w, "(%s) server counter: %d", os.Args[1], counter)
}

func main() {
	http.HandleFunc("/500", resp502)
	http.ListenAndServe(fmt.Sprintf(":%s", os.Args[1]), nil)
}
```

#### Client

(`client/main.go`)

```go
package main

import (
	"fmt"
	"io/ioutil"
	"net/http"
	"os"
	"sync/atomic"
	"time"
)

var counter int32

func req500Path() {
	atomic.AddInt32(&counter, 1)
	resp, err := http.Get(fmt.Sprintf("http://localhost:%s/500?counter=%d", os.Args[1], counter))
	if err != nil {
		fmt.Printf("client counter: %d, error: %s\n", counter, err)
		return
	}
	contentBytes, _ := ioutil.ReadAll(resp.Body)
	fmt.Printf("client counter: %d, status: %d, body: %s\n", counter, resp.StatusCode, string(contentBytes))
}

func main() {
	for i := 0; i < 20; i++ {
		req500Path()
		time.Sleep(1 * time.Second)
	}
}

```

#### Nginx

`nginx.conf`

```nginx

user  nginx;
worker_processes  auto;

error_log  /var/log/nginx/error.log notice;
pid        /var/run/nginx.pid;


events {
    worker_connections  1024;
}


http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
                      '$status $body_bytes_sent "$http_referer" '
                      '"$http_user_agent" "$http_x_forwarded_for"';

    access_log  /var/log/nginx/access.log  main;

    sendfile        on;
    #tcp_nopush     on;

    keepalive_timeout  65;

    #gzip  on;

    upstream demo {
        server  127.0.0.1:8001;  # 默认: max_fails=1 fail_timeout=10s
        server  127.0.0.1:8002;  # 默认: max_fails=1 fail_timeout=10s
        server  127.0.0.1:8003;  # 默认: max_fails=1 fail_timeout=10s
    }
    server {
        listen       8000;
        server_name  localhost;

        location /500 {
            proxy_next_upstream error timeout http_500; # 哪些错误认为是不成功的尝试（unsuccessful attempts），默认为 error timeout，这里的 http_500 是个例子，强烈不建议设置，否则可能导致异常的节点封禁。
            proxy_next_upstream_tries 2;                # 尝试下一个 server 的次数，默认为 0 不限制
            proxy_pass http://demo; 
        }
    }
    # include /etc/nginx/conf.d/*.conf;
}

```

### 运行代码

```bash
# 修改 proxy_next_upstream_tries 重复实验

# 测试
go run ./server 8001  # 终端 1
go run ./server 8002  # 终端 2
go run ./server 8003  # 终端 3
docker run --network host --name demo-nginx -v $(pwd)/nginx.conf:/etc/nginx/nginx.conf:ro nginx:1.23.2  # 终端 4
go run ./client 8000  # 终端 5

# 恢复现场
# ctrl + c 终端 1~5
docker rm -f demo-nginx
```

### 输出分析

* 修改 `proxy_next_upstream_tries` 为 1 时，Nginx 只请求了一个 server，且没有任何节点被封禁，所有请求，按照**轮询负载均衡策略**，获得到了 upstream server 返回的 500。

```
# go run ./server 8001
(8001) server counter: 1, client counter:1
(8001) server counter: 2, client counter:4
(8001) server counter: 3, client counter:7
(8001) server counter: 4, client counter:10
(8001) server counter: 5, client counter:13
(8001) server counter: 6, client counter:16
(8001) server counter: 7, client counter:19

# go run ./server 8002
(8002) server counter: 1, client counter:2
(8002) server counter: 2, client counter:5
(8002) server counter: 3, client counter:8
(8002) server counter: 4, client counter:11
(8002) server counter: 5, client counter:14
(8002) server counter: 6, client counter:17
(8002) server counter: 7, client counter:20

# go run ./server 8003
(8003) server counter: 1, client counter:3
(8003) server counter: 2, client counter:6
(8003) server counter: 3, client counter:9
(8003) server counter: 4, client counter:12
(8003) server counter: 5, client counter:15
(8003) server counter: 6, client counter:18
```

* `proxy_next_upstream_tries` 为 0、2、3、4、5 ... 时：
    * 第 1 个请求，请求了 `8001`，`8002`，封禁了 `8001`，返回 `8002` 响应的 500。
    * 第 2 个请求，请求了 `8003`，`8002`，封禁了 `8003`，返回 `8002` 响应的 500。
    * 第 3 个请求，请求了 `8002`，此时没有了可用的 server，返回 Nginx 的 502。
    * 第 12 个请求，请求了 `8001`，`8001` 刚被解封，又被封禁，此时没有了可用的 server，返回 Nginx 的 502。
    * 第 13 个请求，请求了 `8003`，`8003` 刚被解封，又被封禁，此时没有了可用的 server，返回 Nginx 的 502。
    * 第 14 个请求，请求了 `8002`，`8002` 刚被解封，又被封禁，此时没有了可用的 server，返回 Nginx 的 502。

```
# go run ./server 8001
(8001) server counter: 1, client counter:1
(8001) server counter: 2, client counter:12

# go run ./server 8002
(8002) server counter: 1, client counter:1
(8002) server counter: 2, client counter:2
(8002) server counter: 3, client counter:3
(8002) server counter: 4, client counter:14

# go run ./server 8003
(8003) server counter: 1, client counter:2
(8003) server counter: 2, client counter:13
```
