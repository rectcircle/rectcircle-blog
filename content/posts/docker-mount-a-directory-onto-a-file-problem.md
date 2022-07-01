---
title: "Docker 启动报错 trying to mount a directory onto a file"
date: 2022-07-01T16:01:15+08:00
draft: false
toc: true
comments: true
tags:
  - untagged
---

## 问题日志

机器重启后，在调用 `docker start dd0e8a07a224` 将出现如下错误日志：

```
Error response from daemon: OCI runtime create failed: container_linux.go:349: starting container process caused "process_linux.go:449: container init caused \"rootfs_linux.go:58: mounting \\\"/test/mount/abc\\\" to rootfs \\\"/data00/docker/overlay2/0709c78a56c450f17a533832db01f1a64deaecd0290bf905f9a171c89ddf1eea/merged\\\" at \\\"/data00/docker/overlay2/0709c78a56c450f17a533832db01f1a64deaecd0290bf905f9a171c89ddf1eea/merged/abc\\\" caused \\\"not a directory\\\"\"": unknown: Are you trying to mount a directory onto a file (or vice-versa)? Check if the specified host path exists and is the expected type
Error: failed to start containers: dd0e8a07a2243322f19ab55036f42295376927fffbb7b911cf4b8375a853adb1
```

## 问题复现

回忆该容器的创建命令（`docker run`），包含了 `-v /test/mount/abc:/abc`，挂载宿主机目录的参数。创建时 `/test/mount/abc` 是一个文件，出问题时 `/test/mount/abc` 变成了目录。

因此复现步骤如下：

```bash
# 创建测试挂载文件并创建容器
mkdir -p /test/mount
touch /test/mount/abc
docker run -d --name test-mount-error -v /test/mount/abc:/abc -it busybox sleep 100000000

# 观察输出挂载情况，发现文件一股在
docker exec -it test-mount-error sh -c ls -al
# abc   bin   dev   etc   home  proc  root  sys   tmp   usr   var

# 停止容器并删除宿主机的  /test/mount/abc 文件并创建 /test/mount/abc 目录
docker stop test-mount-error
rm -rf /test/mount/abc && mkdir /test/mount/abc

# 重启启动已启动的容器
docker start test-mount-error
# Error response from daemon: OCI runtime create failed: container_linux.go:349: starting container process caused "process_linux.go:449: container init caused \"rootfs_linux.go:58: mounting \\\"/test/mount/abc\\\" to rootfs \\\"/data00/docker/overlay2/8e0704ed4c38d54469fc7ed205e538b8fabc7227b2d28e8f41ad2dc471f3062d/merged\\\" at \\\"/data00/docker/overlay2/8e0704ed4c38d54469fc7ed205e538b8fabc7227b2d28e8f41ad2dc471f3062d/merged/abc\\\" caused \\\"not a directory\\\"\"": unknown: Are you trying to mount a directory onto a file (or vice-versa)? Check if the specified host path exists and is the expected type
# Error: failed to start containers: test-mount-error
```

## 问题分析

观察容器文件系统情况，执行 `docker inspect test-mount-error -f '{{.GraphDriver.Data}}'`，格式化输出如下：

```
map[
    LowerDir:/data00/docker/overlay2/8e0704ed4c38d54469fc7ed205e538b8fabc7227b2d28e8f41ad2dc471f3062d-init/diff:/data00/docker/overlay2/b99572ac092c84df3fa29148b420387be46e950da68b0564b0e3bcf643fdf39c/diff 
    MergedDir:/data00/docker/overlay2/8e0704ed4c38d54469fc7ed205e538b8fabc7227b2d28e8f41ad2dc471f3062d/merged 
    UpperDir:/data00/docker/overlay2/8e0704ed4c38d54469fc7ed205e538b8fabc7227b2d28e8f41ad2dc471f3062d/diff 
    WorkDir:/data00/docker/overlay2/8e0704ed4c38d54469fc7ed205e538b8fabc7227b2d28e8f41ad2dc471f3062d/work]
```

观察 `UpperDir` 的路径可以发现存在 `abc` 文件， `ls /data00/docker/overlay2/8e0704ed4c38d54469fc7ed205e538b8fabc7227b2d28e8f41ad2dc471f3062d/diff`：

```bash
-rwxr-xr-x 1 root root    0 7月   1 16:16 abc
```

由此，结合 [mount namespace](/posts/container-core-tech-3-namespace-mount/) 和 overlay2 文件系统相关知识，可以推测出 Docker 的 `-v` 和 `--mount` 到容器的指定目录的原理是：

1. 在容器文件系统 `diff` 目录中创建，待挂载的文件或目录对应的挂载点文件/目录（本例中为 `/test/mount/abc`），注意，`diff` 目录已经存在了对象的文件/目录且和宿主机路径对应的文件的类型不一致（本例中为  `<容器文件系统存储>/diff/abc`），则直接报错。原因是：
    * mount binding 系统调用的目标（挂载点），在当前文件系统中，必须存在。
    * mount binding 系统调用的源（宿主机路径）的文件类型必须和目标文件类型一致。
2. 容器启动过程中，在新的 mount namespace 中 mount binding 宿主机路径（本例中为 `/test/mount/abc`）到 路径作为根路径的对应路径（本例中为  `<容器文件系统存储>/diff/abc`）。
3. 后面就是创建 overlay2 文件系统，然后调用 `pivot_root` 系统调用切换根文件系统。

如上所示，原因就是 `/test/mount/abc` 和  `<容器文件系统存储>/diff/abc` 文件类型不一致。

## 解决办法

网络上针对该问题的解决办法都要求删除该容器，这在某些场景是不可接受的，既然知道了上述原理，解决办法就很简单：手动删除 `<容器文件系统存储>/diff/` 中挂载点文件/目录，然后启动容器即可。

```bash
rm -rf /data00/docker/overlay2/$(docker inspect test-mount-error -f '{{.GraphDriver.Data.UpperDir}}')/abc
docker start test-mount-error
# docker rm -f test-mount-error && rm -rf /test # 实验完成后清理现场
```
