---
title: "Nix 详解（四） HTTP 二进制缓存详解"
date: 2023-03-20T01:50:00+08:00
draft: false
toc: true
comments: true
tags:
  - untagged
---

> version: nix-2.14.1

## 简述

nixpkgs 作为 nix 官方的 channel，定义了 80000+ 个包的构建过程。用户在使用这些包时，如果都需要现场编译的话，那么包的安装速度会非常慢。

从前面几篇文章可以看出，nix 利用函数式的 nix 语言配合 `/nix/store` 存储机制，可以做到 nix 包的可重现。

基于此，自然的想法是， nixpkgs 在后台，将 nixpkgs 的所有的包够构建出来，并存储在 `/nix/store` 目录，并通过 HTTP 服务将 `/nix/store` 托管在互联网上。

此时，用户只需配置这个 HTTP 服务的地址，在安装 nixpkgs 包时，从该 HTTP 服务中下载包构建产物即可，这样将跳过编译过程，可以大大加快 nix 包的安装过程。

这个 HTTP 服务就被称为二进制缓存服务。本文将围绕这个二进制缓存服务介绍：

* 将通过 Go 实现一个简单的聚合器，介绍 HTTP 服务的接口规范（官方暂无详细说明）。
* 如何将任意一台机器的 `/nix/store` 部署成一个二进制缓存服务，并介绍其原理。
* 如何将存储在 `/nix/store` 的一个包及其依赖导出到文件，以及如何将该文件导入到 `/nix/store` 中。

关于二进制缓存服务官方的文档，主要有：

* [Nix Wiki - Binary Cache](https://nixos.wiki/wiki/Binary_Cache)
* [Nix Reference Manual - Sharing Packages Between Machines](https://nixos.org/manual/nix/stable/package-management/sharing-packages.html)

## 二进制缓存聚合器

在第一篇文章，安装部分，在 `~/.config/nix/nix.conf` 配置的 `substituters = https://mirrors.tuna.tsinghua.edu.cn/nix-channels/store https://cache.nixos.org/` 就是配置两个二进制缓存地址。

* 第一个 `https://mirrors.tuna.tsinghua.edu.cn/nix-channels/store` 是清华大学提供的 nixpkgs 二进制缓存的 mirror。
* 第二个 `https://cache.nixos.org/` 是 nixpkgs 官方提供的二进制缓存，在中国大陆地区访问缓慢甚至难以访问。

以上这些配置，仍然无法保证安装速度原因如下：

* 清华 mirror 同步的并不全且不及时，很多缓存在 `https://cache.nixos.org/` 存在，但是在清华源并不存在。需要 failback 到官方缓存，速度巨慢。
* 对于非 nixpkgs 的包的二进制缓存，在大陆地区可能仍然无法访问，每加一个二进制缓存，都需要用户更改 `substituters` 配置。

下文将简单的实现一个反向代理，来将多个二进制缓存进行聚合。

### 代码和解读

`nix-binary-cache-aggregator/main.go`

```go
package main

import (
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
	"strings"
)

type upstream struct {
	URL      string
	UseProxy bool
}

func newHandle(httpProxy string, upstreams []upstream) (func(w http.ResponseWriter, r *http.Request), error) {
	client := http.DefaultClient
	proxyClient := http.DefaultClient
	if httpProxy != "" {
		httpProxyURL, err := url.Parse(httpProxy)
		if err != nil {
			return nil, err
		}
		proxyClient = &http.Client{Transport: &http.Transport{Proxy: http.ProxyURL(httpProxyURL)}}
	}

	return func(w http.ResponseWriter, r *http.Request) {
		// 打印访问日志
		log.Printf("path: %s", r.URL.Path)
		// TODO 优先从缓存中读取。
		// 尝试从 upstream 中获取
		var resp *http.Response
		for i, u := range upstreams {
			targetPath := strings.TrimSuffix(u.URL, "/") + r.URL.Path
			c := client
			if u.UseProxy {
				c = proxyClient
			}
			_resp, err := c.Get(targetPath)
			if err != nil {
				log.Printf("  try upstream[%d]: %s, error: %s", i, targetPath, err)
				continue
			}
			if _resp.StatusCode != 200 {
				log.Printf("  try upstream[%d]: %s, status code is: %d", i, targetPath, _resp.StatusCode)
				_resp.Body.Close()
				continue
			}
			log.Printf("  try upstream[%d]: %s, success", i, targetPath)
			resp = _resp
			break
		}
		if resp == nil {
			log.Printf("  all upstream not found")
			w.WriteHeader(404)
			return
		}
		defer resp.Body.Close()
		w.WriteHeader(resp.StatusCode)
		_, _ = io.Copy(w, resp.Body)
		// TODO 起一个协程写入缓存中。
	}, nil
}

func main() {
	upstreams := []upstream{
		{
			URL:      "https://mirrors.tuna.tsinghua.edu.cn/nix-channels/store",
			UseProxy: false,
		},
		{
			URL:      "https://cache.nixos.org",
			UseProxy: true,
		},
	}
	httpProxy := os.Getenv("HTTP_PROXY")
	os.Unsetenv("HTTP_PROXY")
	handle, err := newHandle(httpProxy, upstreams)
	if err != nil {
		panic(err)
	}
	http.HandleFunc("/", handle)
	if err := http.ListenAndServe(":8000", nil); err != nil {
		panic(err)
	}
}
```

代码说明（来自 chatgpt）：

这是一段 Go 语言编写的简单的 HTTP 反向代理服务器。它接收来自客户端的请求并尝试从多个上游（即 upstreams）中获取响应数据，然后将响应数据返回给客户端。如果所有的上游都无法提供响应数据，则返回 404 错误。

在代码中，我们可以看到以下函数和变量的定义：

* upstream 结构体：包含一个 URL 字段和一个 UseProxy 字段。URL 字段表示上游 URL，UseProxy 字段表示是否使用代理。
* newHandle 函数：返回一个处理 HTTP 请求的函数，该函数根据请求的 URL 路径尝试从上游中获取响应数据并返回给客户端。如果所有上游都无法提供响应数据，则返回 404 错误。
* main 函数：该函数创建一个 HTTP 服务器并监听端口 8000，然后将所有请求路由到 newHandle 函数返回的处理函数中进行处理。

该代理服务器的工作流程如下：

* 获取客户端请求的 URL 路径。
* 对于每个上游，将上游 URL 和请求路径拼接为一个新的 URL，然后使用 HTTP 客户端发出 GET 请求。
* 如果请求成功，将响应数据返回给客户端。
* 如果请求失败或响应状态码不是 200，则跳过该上游，继续向下一个上游发起请求。
* 如果所有上游都无法提供响应数据，则返回 404 错误。

需要注意的是，这段代码只是一个简单的反向代理服务器示例，实际生产环境中需要进行更多的安全和性能优化。例如，可以添加访问控制、缓存、日志记录等功能来提高系统的可用性和稳定性。

### 运行

```bash
cd nix-binary-cache-aggregator
HTTP_PROXY=http://192.168.31.254:1082 go run ./
```

这里的 `http://192.168.31.254:1082` 是一个 HTTP 代理，这个 HTTP 代理有一个连接海外的专线。

## 二进制缓存接口规范

### 使用二进制缓存聚合器

使用 `nix-env -e hello && nix-collect-garbage -d  && nix-env -iA nixpkgs.hello --option substituters http://127.0.0.1:8000` 命令（或修改 `~/.config/nix/nix.conf` 的 substituters 字段）。

观察上文 `go run ./` 输出如下：

```
2023/03/19 21:59:53 path: /nix-cache-info
2023/03/19 21:59:53   try upstream[0]: https://mirrors.tuna.tsinghua.edu.cn/nix-channels/store/nix-cache-info, success
2023/03/19 21:59:53 path: /v02pl5dhayp8jnz8ahdvg5vi71s8xc6g.narinfo
2023/03/19 21:59:53   try upstream[0]: https://mirrors.tuna.tsinghua.edu.cn/nix-channels/store/v02pl5dhayp8jnz8ahdvg5vi71s8xc6g.narinfo, success
2023/03/19 21:59:53 path: /nar/0qjw94x5c54sk397xhz4l134mk4cvyiakvdbczmal08rgd975sp5.nar.xz
2023/03/19 21:59:53   try upstream[0]: https://mirrors.tuna.tsinghua.edu.cn/nix-channels/store/nar/0qjw94x5c54sk397xhz4l134mk4cvyiakvdbczmal08rgd975sp5.nar.xz, success
```

### 二进制缓存接口路径

上文，可以看出，一共有三类路径，分别是：

* `/nix-cache-info` 这个缓存服务的基础信息。
* `/$hash.narinfo` 待下载的文件（nar、Nix 归档文件，参见：[论文](https://edolstra.github.io/pubs/phd-thesis.pdf) Figure 5.2 ）的元信息。
* `/nar/0qjw94x5c54sk397xhz4l134mk4cvyiakvdbczmal08rgd975sp5.nar.xz` nar 文件的下载路径。

执行 `curl http://127.0.0.1:8000/nix-cache-info`，输出如下：

```
StoreDir: /nix/store
WantMassQuery: 1
Priority: 40
```

* `StoreDir` 该缓存服务的 nix store 存储路径。
* `WantMassQuery` 该缓存服务是否可以并发请求（说明来自 chatgpt）。
* `Priority` 该二进制缓存的优先级，客户端配置多个时，会按照该字段排序进行下载，数值越小优先级越高。

`curl http://127.0.0.1:8000/v02pl5dhayp8jnz8ahdvg5vi71s8xc6g.narinfo` 输出如下：

```
StorePath: /nix/store/v02pl5dhayp8jnz8ahdvg5vi71s8xc6g-hello-2.12.1
URL: nar/0qjw94x5c54sk397xhz4l134mk4cvyiakvdbczmal08rgd975sp5.nar.xz
Compression: xz
FileHash: sha256:0qjw94x5c54sk397xhz4l134mk4cvyiakvdbczmal08rgd975sp5
FileSize: 50160
NarHash: sha256:1bkbsk4wkk92syg4s7wafy5cxrsprlinax35zgp54y9r0f7a44jz
NarSize: 226504
References: 76l4v99sk83ylfwkz8wmwrm4s8h73rhd-glibc-2.35-224 v02pl5dhayp8jnz8ahdvg5vi71s8xc6g-hello-2.12.1
Deriver: 25i5yk3xxr0g54rab62jfmi2hpmcapiw-hello-2.12.1.drv
Sig: cache.nixos.org-1:wNCGXAt+CyxXwRFKCama8lAYXI+nz0ON4AWKZ7wCL7ccoJ8UTf1FtQzFi5MXZ7DuebGr90POlbotF7NfcS+iCw==
```

* `StorePath` 该包的存储路径。
* `URL` 该包的下载路径。
* `Compression` 压缩格式。
* `FileHash` 文件 hash（`.nar.xz` 压缩文件）。
* `FileSize` 文件大小（`.nar.xz` 压缩文件）。
* `NarHash` nar 文件 hash（解压后）。
* `NarSize` nar 文件大小（解压后）。
* `References` 直接依赖的其他包。
* `Deriver` 产生该包的 `deriver`。
* `Sig` 签名。

`wget http://127.0.0.1:8000/nar/0qjw94x5c54sk397xhz4l134mk4cvyiakvdbczmal08rgd975sp5.nar.xz && ls -al 0qjw94x5c54sk397xhz4l134mk4cvyiakvdbczmal08rgd975sp5.nar.xz && rm -rf 0qjw94x5c54sk397xhz4l134mk4cvyiakvdbczmal08rgd975sp5.nar.xz`

```
-rw-rw-r-- 1 rectcircle users 50160  3月 19 22:44 0qjw94x5c54sk397xhz4l134mk4cvyiakvdbczmal08rgd975sp5.nar.xz
```

可以看出，该文件的 size 和 `narinfo` 的 `FileSize` 相同。

## 二进制缓存服务实现探究

二进制缓存服务就是根据设备上 `/nix/store` 以及 `/nix/var/nix` 相关元数据，生成 `.narinfo` 以及 `.nar.xz` 文件的下载服务。

### nar 文件生成

nar 文件是一种 Nix 软件包存档文件格式，用于在不同的计算机系统之间传递和安装 Nix 软件包。NAR代表 `"Nix Archive"`，它是一种可扩展的归档格式，其中包含了 Nix 软件包的所有文件和元数据（来自 chatgpt）。

通过 `nix-store --dump /nix/store/v02pl5dhayp8jnz8ahdvg5vi71s8xc6g-hello-2.12.1 > test.nar` 命令，可以生成一个 nar 文件。

观察，该文件：

* `ls -al test.nar`。可以看出，该文件的大小为： `226504`，对应上文的 `NarSize`。
* `nix-hash --type sha256 --flat --base32 test.nar`。可以看出，该文件的 hash 是 `1bkbsk4wkk92syg4s7wafy5cxrsprlinax35zgp54y9r0f7a44jz`，对应上文的 `NarHash`。

通过 `xz test.nar` 命令，可以生成一个 `test.nar.xz` 文件。

观察，该文件：

* `ls -al test.nar.xz`。可以看出，该文件的大小为： `50160`，对应上文的 `FileSize`。
* `nix-hash --type sha256 --flat --base32 test.nar.xz`。可以看出，该文件的 hash 是 `0qjw94x5c54sk397xhz4l134mk4cvyiakvdbczmal08rgd975sp5`，对应上文的 `FileHash`。

注意，生成 hash，请使用 nix-hash 命令，而非 shasum + base32。

### narinfo 文件生成

* `StorePath` 该包的存储路径。
* `URL` 该包的下载路径，取决于路由格式，一般为 `nar/$FileHash.nar.xz`。
* `Compression` 压缩格式，一般为 `xz`。
* `FileHash` 参见上文。
* `FileSize` 参见上文。
* `NarHash` 除了上文方式外，还可以通过 `nix-store -q --hash /nix/store/v02pl5dhayp8jnz8ahdvg5vi71s8xc6g-hello-2.12.1` 命令可以查看，该命令读取的是 `/nix/var/nix/db` 数据库中的，不是实时计算的。
* `NarSize` 除了上文方式外，还可以通过 `nix-store -q --size /nix/store/v02pl5dhayp8jnz8ahdvg5vi71s8xc6g-hello-2.12.1` 命令可以查看，该命令读取的是 `/nix/var/nix/db` 数据库中的，不是实时计算的。
* `References` 通过 `nix-store -q --references /nix/store/v02pl5dhayp8jnz8ahdvg5vi71s8xc6g-hello-2.12.1` 命令可以查看。
* `Deriver` 通过 `nix-store -q --deriver /nix/store/v02pl5dhayp8jnz8ahdvg5vi71s8xc6g-hello-2.12.1` 命令可以查看。
* `Sig` 通过 `nix-store --generate-binary-cache-key key-name secret-key-file public-key-file` 生成。

## 搭建二进制缓存服务

### 安装

社区有几个 nix 二进制缓存服务，这里介绍两个分别是：

* [`edolstra/nix-serve`](https://github.com/edolstra/nix-serve)， 官方 [wiki](https://nixos.wiki/wiki/Binary_Cache) 和 [手册](https://nixos.org/manual/nix/stable/package-management/sharing-packages.html) 介绍的就是这个。
* [`aristanetworks/nix-serve-ng`](https://github.com/aristanetworks/nix-serve-ng)，自称性能最好的 nix 二进制缓存服务。

本文将安装 nix-serve-ng。

```bash
# nix-serve 和 nix-serve-ng 都有 bug，因此需要使用旧版 nix。
# https://github.com/aristanetworks/nix-serve-ng/issues/22
# https://github.com/NixOS/nix/issues/7704
# nix-env -iA nixpkgs.nix-serve-ng
nix-env -E '_: let pkgs = import <nixpkgs> {}; in pkgs.nix-serve-ng.override { nix = pkgs.nixVersions.nix_2_12; }' -i --option substituters http://127.0.0.1:8000 
```

### 运行验证

运行

```bash
# 默认绑定 5000 端口
nix-serve
```

验证

```bash
curl http://127.0.0.1:5000/nix-cache-info
# StoreDir: /nix/store
# WantMassQuery: 1
# Priority: 30

curl http://127.0.0.1:5000/v02pl5dhayp8jnz8ahdvg5vi71s8xc6g.narinfo
# StorePath: /nix/store/v02pl5dhayp8jnz8ahdvg5vi71s8xc6g-hello-2.12.1
# URL: nar/v02pl5dhayp8jnz8ahdvg5vi71s8xc6g-1bkbsk4wkk92syg4s7wafy5cxrsprlinax35zgp54y9r0f7a44jz.nar
# Compression: none
# NarHash: sha256:1bkbsk4wkk92syg4s7wafy5cxrsprlinax35zgp54y9r0f7a44jz
# NarSize: 226504
# References: 76l4v99sk83ylfwkz8wmwrm4s8h73rhd-glibc-2.35-224 v02pl5dhayp8jnz8ahdvg5vi71s8xc6g-hello-2.12.1
# Deriver: 25i5yk3xxr0g54rab62jfmi2hpmcapiw-hello-2.12.1.drv
# Sig: cache.nixos.org-1:wNCGXAt+CyxXwRFKCama8lAYXI+nz0ON4AWKZ7wCL7ccoJ8UTf1FtQzFi5MXZ7DuebGr90POlbotF7NfcS+iCw==
```

可以看出，为了性能 `nix-serve-ng` 并未启用压缩模式，比较适合高速内网使用，如果在公网提供服务，该服务不能满足需求。

## /nix/store 导入导出

上文的 `nix-serve-ng` 服务的是基于 nix-store 命令同款库实现的。

如果我们需要部署一个二进制缓存服务，这台机器应该只作为 HTTP Server，提供二进制缓存服务。不可能在这台机器进行构建。

最好的做法是，将 `/nix` 目录存储在 NAS 中，并有多台二进制缓存和构建节点，这些节点，都挂载 NAS 到 `/nix` 目录。构建节点负责调用 `nix-build` 构建不存在的包，二进制缓存节点负责对外提供 HTTP Server（本方案，未测试，重点关注 `/nix` 并发访问是否有问题），该方案本文将不多赘述。

另一种简单的做法，是单台节点提供二进制缓存服务，其他多台构建节点负责构建，并将构建产物同步到 二进制缓存服务节点。

注意，直接 scp 或 rsync `/nix/store` 是不行的，原因在于 nix-store 还有一些元数据存储在 sqlite 数据库中，位于 `/nix/var/nix` 目录。

因此，这就要求 nix 提供构建产物导入导出的机制。nix 提供了相关能力。

### 拷贝 Closure

> [Copying Closures via SSH](https://nixos.org/manual/nix/stable/package-management/copy-closure.html)

Closure 指包含了一个包自身及其所有依赖的文件，即一个 nar 文件列表。 nix 提供了一个命令可以将某个 `/nix/store/xxx` 目录及其依赖通过 scp 拷贝到另一台机器的能力。

```bash
nix-copy-closure --to alice@itchy.example.org /nix/store/v02pl5dhayp8jnz8ahdvg5vi71s8xc6g-hello-2.12.1
```

注意，如果依赖或包自身远端已经存在了，该方式将不会重复 copy。

除了以上方式外，nix 还提供了将 Closure 导出到文件命令，以及将 Closure 导入到 `/nix/store` 的命令。

```bash
# 在一台机器上导出
nix-store --export $(nix-store -qR /nix/store/v02pl5dhayp8jnz8ahdvg5vi71s8xc6g-hello-2.12.1) > hello.closure
# 在另一台机器上导入
nix-store --import < hello.closure
```

注意，该方式可以灵活的通过各种网络协议传输文件，文件内容的裁剪需要通过缓存服务 API 自助实现。

### 拷贝 nar

除了上文拷贝 Closure 外，nix 还提供了导入导出 nar 的能力，上文已经说明，本部分仅做记录。

```bash
# 在一台机器上导出
nix-store --dump /nix/store/v02pl5dhayp8jnz8ahdvg5vi71s8xc6g-hello-2.12.1 > v02pl5dhayp8jnz8ahdvg5vi71s8xc6g.nar
# 在另一台机器上导入
nix-store --import v02pl5dhayp8jnz8ahdvg5vi71s8xc6g.nar
```

### 自定义 Channel 缓存

对于自定义 Channel 构建和缓存服务，nix 生态中已有类似的开源软件或商业产品，这里简单列一下：

* [`NixOS/hydra`](https://github.com/NixOS/hydra) 一个基于 Nix 的持续集成平台，NixOS 和 nixpkgs 就是使用该开源软件构建的。
* [`cachix`](https://www.cachix.org/) 基于 nix 的付费的商业版缓存服务，对于开源项目有 5G 免费存储额度。

在企业场景，基于以上技术，完全可以基于企业已有基础设施，较低成本的实现一套自定义 Channel 包的构建和缓存服务。
