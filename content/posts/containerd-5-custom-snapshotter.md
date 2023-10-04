---
title: "Containerd 详解（五） 自定义 snapshotter"
date: 2023-10-05T00:36:00+08:00
draft: false
toc: true
comments: true
tags:
  - untagged
---

> version: [v1.7.0](https://github.com/containerd/containerd/tree/v1.7.0)

## 概述

上文已经详细了解了 overlay snapshotter 的源码。本文将以如下场景为例，实现一个自定义的 snapshotter。

一般情况下，如果想给容器添加一些额外的文件，一般都是通过挂载宿主目录的的方式来实现。

但是有些场景（如：编译场景的依赖库缓存加速），需要基于以这些文件为基础进行修改，又要求这些更改，不影响其他容器时，宿主机挂载就无法满足需求。

这种场景，可以利用 overlayfs 的特性，在镜像的 lower 层之上，再添加一个 lower 层目录来实现。

## 设计

基于 containerd 内置的 overlay snapshotter 实现一个自定义 snapshotter 插件： 这个插件会通过 snapshotter labels 指定附加的宿主机目录，添加到 mount option 的 lower 中。

## 实现

> 源码：[rectcircle/overlay-custom-add-lower-snapshotter](https://github.com/rectcircle/overlay-custom-add-lower-snapshotter)

`snapshotter/constants.go`

```go
//go:build linux

package snapshotter

const (
	// 改插件默认的存储路径
	DefaultRootDir = "/var/lib/containerd/cn.rectcircle.containerd.overlay-custom-add-lower-snapshotter"
	// 该插件提供 grpc 服务的 socks 文件名，路径为 paths.Join(rootDir, SocksFileName)
	// 默认为 /var/lib/containerd/cn.rectcircle.containerd.overlay-custom-add-lower-snapshotter/grpc.socks
	SocksFileName = "grpc.socks"
	// 实现添加自定义 lower 路径的 label key，支持多个路径，以分号 : 分隔。
	// label 必须以 containerd.io/snapshot/ 开头，参见，containerd 源码：
	//   `snapshots/snapshotter.go@FilterInheritedLabels`
	//   `metadata/snapshot.go@createSnapshot`
	LabelCustomAddLowerPaths = "containerd.io/snapshot/overlay-custom-add-lower.paths"
)
```

`cmd/overlay-custom-add-lower-snapshotter/main.go`

```go
//go:build linux

package main

import (
	"log"
	"net"
	"os"
	"path"

	"github.com/urfave/cli/v2"

	snapshotsapi "github.com/containerd/containerd/api/services/snapshots/v1"
	"github.com/containerd/containerd/contrib/snapshotservice"
	"github.com/containerd/containerd/snapshots/overlay"
	"github.com/rectcircle/overlay-custom-add-lower-snapshotter/snapshotter"
	"google.golang.org/grpc"
)

func main() {

	app := &cli.App{
		Name:  "overlay-custom-add-lower-snapshotter",
		Usage: "Run a custom-add-lower overlay containerd snapshotter",
		Flags: []cli.Flag{
			&cli.StringFlag{
				Name:  "root-dir",
				Value: snapshotter.DefaultRootDir,
				Usage: "Adds as an optional label \"containerd.io/snapshot/overlay.upperdir\"",
			},
			&cli.BoolFlag{
				Name:  "async-remove",
				Value: true,
				Usage: "Defers removal of filesystem content until the Cleanup method is called",
			},
			&cli.BoolFlag{
				Name:  "upperdir-label",
				Value: false,
				Usage: "AsynchronousRemove defers removal of filesystem content until the Cleanup method is called",
			},
		},
		Action: func(ctx *cli.Context) error {
			// 创建 snapshotter
			root := ctx.String("root-dir")
			sOpts := []overlay.Opt{}
			if ctx.Bool("async-remove") {
				sOpts = append(sOpts, overlay.AsynchronousRemove)
			}
			if ctx.Bool("upperdir-label") {
				sOpts = append(sOpts, overlay.WithUpperdirLabel)
			}
			sn, err := snapshotter.NewSnapshotter(root, sOpts...)
			if err != nil {
				return err
			}
			// 封装成 grpc service
			service := snapshotservice.FromSnapshotter(sn)
			// 创建一个 rpc server
			rpc := grpc.NewServer()
			// 将 grpc service 注册到 grpc server
			snapshotsapi.RegisterSnapshotsServer(rpc, service)
			// Listen and serve
			socksPath := path.Join(root, snapshotter.SocksFileName)
			err = os.RemoveAll(socksPath)
			if err != nil {
				return err
			}
			l, err := net.Listen("unix", socksPath)
			if err != nil {
				return nil
			}
			return rpc.Serve(l)
		},
	}

	if err := app.Run(os.Args); err != nil {
		log.Fatal(err)
	}
}
```

`snapshotter/snapshotter.go`

```go
//go:build linux

package snapshotter

import (
	"context"
	"fmt"
	"os"
	"strings"

	"github.com/containerd/containerd/mount"
	"github.com/containerd/containerd/snapshots"
	"github.com/containerd/containerd/snapshots/overlay"
)

func NewSnapshotter(root string, opts ...overlay.Opt) (snapshots.Snapshotter, error) {
	sn, err := overlay.NewSnapshotter(root, opts...)
	if err != nil {
		return nil, err
	}
	return &overlayCustomAddLowerSnapshotter{sn}, nil
}

// overlayCustomAddLowerSnapshotter 继承 overlay Snapshotter，在返回 mounts 的地方进行改造
type overlayCustomAddLowerSnapshotter struct {
	snapshots.Snapshotter
}

// Mounts implements snapshots.Snapshotter.
func (s *overlayCustomAddLowerSnapshotter) Mounts(ctx context.Context, key string) ([]mount.Mount, error) {
	mounts, err := s.Snapshotter.Mounts(ctx, key)
	if err != nil {
		return nil, err
	}
	return s.tryAddLowers(ctx, key, mounts)
}

// Prepare implements snapshots.Snapshotter.
func (s *overlayCustomAddLowerSnapshotter) Prepare(ctx context.Context, key string, parent string, opts ...snapshots.Opt) ([]mount.Mount, error) {
	mounts, err := s.Snapshotter.Prepare(ctx, key, parent, opts...)
	if err != nil {
		return nil, err
	}
	return s.tryAddLowers(ctx, key, mounts)
}

// View implements snapshots.Snapshotter.
func (s *overlayCustomAddLowerSnapshotter) View(ctx context.Context, key string, parent string, opts ...snapshots.Opt) ([]mount.Mount, error) {
	mounts, err := s.Snapshotter.View(ctx, key, parent, opts...)
	if err != nil {
		return nil, err
	}
	return s.tryAddLowers(ctx, key, mounts)
}

// tryAddLowers 所有返回 mounts 的地方，都需要调用该函数，根据 label ，给 lower 选项添加自定义的 lower 路径。
func (s *overlayCustomAddLowerSnapshotter) tryAddLowers(ctx context.Context, key string, mounts []mount.Mount) ([]mount.Mount, error) {
	if len(mounts) != 1 || mounts[0].Type != "overlay" {
		return mounts, nil
	}
	info, err := s.Snapshotter.Stat(ctx, key)
	if err != nil {
		return nil, err
	}
	lowerPathString, ok := info.Labels[LabelCustomAddLowerPaths]
	if !ok || lowerPathString == "" {
		return mounts, nil
	}
	lowerPaths := strings.Split(lowerPathString, ":")
	for _, p := range lowerPaths {
		if p == "" {
			continue
		}
		err = os.MkdirAll(p, 0o755)
		if err != nil {
			return nil, fmt.Errorf("mkdir lower path %s error: %s", p, err)
		}
	}
	for i, o := range mounts[0].Options {
		if strings.HasPrefix(o, "lowerdir=") {
			mounts[0].Options[i] = "lowerdir=" + lowerPathString + ":" + strings.TrimPrefix(o, "lowerdir=")
			break
		}
	}
	return mounts, nil
}
```

## 编译

```bash
go build ./cmd/overlay-custom-add-lower-snapshotter
```

## containerd 使用

### 启动

```bash
sudo ./overlay-custom-add-lower-snapshotter
```

### 配置

`/etc/containerd/config.toml`

```toml
version = 2

[proxy_plugins]
  [proxy_plugins.overlay-custom-add-lower-snapshotter]
    type = "snapshot"
    address = "/var/lib/containerd/cn.rectcircle.containerd.overlay-custom-add-lower-snapshotter/grpc.socks"
```

配置 containerd namespace 的默认 snapshotter。

```bash
sudo ctr namespace label default containerd.io/defaults/snapshotter=overlay-custom-add-lower-snapshotter
# 验证完恢复现场如下：
# sudo ctr namespace label default containerd.io/defaults/snapshotter=
```

### 验证

**拉取一个新的镜像**

```bash
sudo ctr images pull docker.io/library/nginx:1.25
```

观察路径， `sudo ls -al /var/lib/containerd/cn.rectcircle.containerd.overlay-custom-add-lower-snapshotter/snapshots` 有输出子目录。

**使用上述 snapshotter label 启动容器**

```bash
sudo ctr run --snapshotter-label containerd.io/snapshot/overlay-custom-add-lower.paths=/tmp/overlayfs-custom-lower --rm -t docker.io/library/nginx:1.25 nginx-with-custom-lower bash
```

观察：

* 在容器外执行 `sudo ctr snapshot --snapshotter overlay-custom-add-lower-snapshotter info nginx-with-custom-lower` 可以观察到 label `containerd.io/snapshot/overlay-custom-add-lower.paths` 存在。
* 在容器内执行 `ls -al /` 是个标准的 linux 目录。
* 在容器外执行 `sudo mkdir /tmp/overlayfs-custom-lower/test_dir`。
* 在容器内执行 `ls -al /` 发现，多了一个 /test_dir 目录。
* 在容器内执行 `touch /test_dir/incontainer`。
* 在容器外执行 `sudo ls -al /tmp/overlayfs-custom-lower/test_dir` 仍然是空目录。
* 在容器外执行 `sudo touch /tmp/overlayfs-custom-lower/test_dir/after-outcontainer`
* 在容器内执行 `ls -al /test_dir` 发现 `after-outcontainer` 和 `incontainer` 均存在。

## kubernetes 适配

一般自定义 snapshotter 都是要在 kubernetes 中使用的，因此需要配置 cri 的 snapshotter 为自定义 snapshotter，值为 `proxy_plugins.xxx` 的 `xxx`。

`/etc/containerd/config.toml`

```toml
version = 2
[plugins."io.containerd.grpc.v1.cri".containerd]
  snapshotter = "overlay-custom-add-lower-snapshotter"
```

此外，默认情况下，cri 默认不会传递任何 snapshot labels 到 pod 业务容器的 snapshot 中，而如上改动是依赖特殊 label 传递配置的。而在 kubernetes 特殊定制的特性一般通过 pod 的 annotation 或 label 来传递。

因此，为了将该特性透传到在 kubernetes 中，需要：

* 定义该特性的 pod annotation 或 label 的 key 以及语义。
* 修改 cri 的 CreateContainer （`pkg/cri/server/container_create.go`）逻辑，在 `sOpts, err := snapshotterOpts(c.config.ContainerdConfig.Snapshotter, config)` 源码附近，根据需求将 kubernetes pod annotation 或 label 转化为 snapshot label。

具体实现本文不再赘述。

## 参考

* [containerd docs: plugin](https://github.com/containerd/containerd/blob/main/docs/PLUGINS.md)
* [containerd docs: CRI config - snapshotter](https://github.com/containerd/containerd/blob/main/docs/cri/config.md#snapshotter)
