---
title: Docker
date: 2018-06-05T15:48:09+08:00
draft: false
toc: true
comments: true
aliases:
  - /detail/151
  - /detail/151/
tags:
  - devops
---

> 参考:
> [docker官方网站](https://www.docker.com/)
> [docker官方文档](https://docs.docker.com/)
> [docker官方中文网站](https://www.docker-cn.com/)
> [docker官方中文文档](http://docs.docker-cn.com/)
> [github:docker](https://github.com/docker)
> [docker从入门到实践](https://github.com/yeasy/docker_practice)

***

## 一、docker介绍

***

### 1、简介

#### （1）服务运行平台的发展

**物理机阶段**

服务运行平台最初是某企业买或租一台或多台物理服务器，在上面装上真实的操作系统，配置运行环境，专人管理。

缺点：

* 门槛高
* 价格贵
* 维护困难
* 变更扩容困难
* 开发运行割裂，流程复杂

**虚拟机阶段**

云服务的兴起，云服务提供商在全球各地架设数据中心，他们在众多机器上以虚拟机的方式提供服务。用户只需在相关平台购买任意配置的实例即可使用

优点

* 门槛低
* 价格低
* 维护相对容易
* 支持动态扩容

缺点

* 仍然需要针对虚拟机安装支持环境
* 部署困难

**容器阶段**

容器提供的是相对隔绝的运行环境，不同与虚拟机，在开发阶段只要配置好相关的依赖，放到容器上运行，就能保证一直的运行结果

优点

* 开发环境和运行环境高度统一
* 易于交付部署
* 支持对自动化更好的支持
* 统一管理
* 隔离避免不同程序在一台虚拟机上产生冲突

#### （2）docker介绍

Docker 是世界领先的软件容器平台。开发人员利用 Docker 可以消除协作编码时“在我的机器上可正常工作”的问题。运维人员利用 Docker 可以在隔离容器中并行运行和管理应用，获得更好的计算密度。企业利用 Docker 可以构建敏捷的软件交付管道，以更快的速度、更高的安全性和可靠的信誉为 Linux 和 Windows Server 应用发布新功能。

有了容器，就可以将软件运行所需的所有资源打包到一个隔离的容器中。容器与虚拟机不同，不需要捆绑一整套操作系统，只需要软件工作所需的库资源和设置。系统因此而变得高效、轻量、自给自足，还能保证部署在任何环境中的软件都能始终如一地运行。

#### （3）docker特点

* 轻量级：
	* 在一台机器上运行的多个 Docker 容器可以共享这台机器的操作系统内核；它们能够迅速启动，只需占用很少的计算和内存资源。
	* 镜像是通过文件系统层进行构造的，并共享一些公共文件。这样就能尽量降低磁盘用量，并能更快地下载镜像。
* 标准
	* Docker 容器基于开放式标准，能够在所有主流 Linux 版本、Microsoft Windows 以及包括 VM、裸机服务器和云在内的任何基础设施上运行。
* 安全
	* Docker 赋予应用的隔离性不仅限于彼此隔离，还独立于底层的基础设施。Docker 默认提供最强的隔离，因此应用出现问题，也只是单个容器的问题，而不会波及到整台机器。

### 2、docker架构

![docker架构图](/res/UKoiNui-oN-vmzaFkLWpt43X.png)

* Docker daemon（Docker进程）：Docker进程是部署在linux操作系统上，负责支撑Docker Container的运行以及本地Image的管理。
* Client（Docker客户端）：用户不直接操作Docker daemon，用户通过Docker client访问Docker，Docker client提供pull、run等操作命令。通过REST API与Docker daemon交互
* Docker Image：Docker 镜像就是一个只读的模板。例如：一个镜像可以包含一个完整的 ubuntu 操作系统环境，里面仅安装了 Apache 或用户需要的其它应用程序。
* Docker Container：Docker 利用容器来运行应用。容器是从镜像创建的运行实例。它可以被启动、开始、停止、删除。每个容器都是相互隔离的、保证安全的平台。可以把容器看做是一个简易版的 Linux 环境（包括root用户权限、进程空间、用户空间和网络空间等）和运行在其中的应用程序。
* Docker Registry：仓库分为公开仓库（Public）和私有仓库（Private）两种形式最大的公开仓库是 Docker Hub，存放了数量庞大的镜像供用户下载。

### 3、基本概念

* 镜像（ Image ）
* 容器（ Container ）
* 仓库（ Repository ）

#### （1）镜像

Docker 镜像是一个特殊的文件系统，除了提供容器运行时所需的程序、库、资源、配置等文 件外，还包含了一些为运行时准备的一些配置参数（如匿名卷、环境变量、用户等）。镜像 不包含任何动态数据，其内容在构建之后也不会被改变。

**分层存储**

镜像并不是想ISO一样一整个文件，而是分层的（像Maven里的依赖管理类似，存在依赖关系）

#### （2）Docker 容器

镜像（ Image ）和容器（ Container ）的关系，就像是面向对象程序设计中的 类 和 实例 一样，镜像是静态的定义，容器是镜像运行时的实体。容器可以被创建、启动、停止、删 除、暂停等。

另一个比喻就是程序与进程的关系

容器运行期间创建的存储层（文件系统）在容器停止后都会被被删除，若想要保存文件，必须挂载外部数据卷，或使用网络方式放在别处

数据卷的声明周期独立于Docker容器

#### （3）Docker Registry（注册中心）

一个 Docker Registry 中可以包含多个仓库（ Repository ）；每个仓库可以包含多个标签 （ Tag ）；每个标签对应一个镜像。

通常，一个仓库会包含同一个软件不同版本的镜像，而标签就常用于对应该软件的各个版 本。我们可以通过 `<仓库名>:<标签>` 的格式来指定具体是这个软件哪个版本的镜像。如果不给 出标签，将以 `latest` 作为默认标签。

**Docker Registry 公开服务**
Docker Registry 公开服务是开放给用户使用、允许用户管理镜像的 Registry 服务。一般这类 公开服务允许用户免费上传、下载公开的镜像，并可能提供收费服务供用户管理私有镜像。

* 公开服务是官方的 Docker Hub
* CoreOS 的 Quay.io
* Google 的 Google Container Registry，Kubernetes
* 国内镜像
	* 阿里云加速
	* DaoCloud 加速器
* 国内服务
	* 时速云镜像仓库、
	* 网易云 镜像服务、
	* DaoCloud 镜像市场、
	* 阿里云镜像库

**私有 Docker Registry**

不对外开发的注册中心

#### （4）总结

与Java Maven对比

* `Maven仓库`相当于Docker的`Registry`
	* `Maven中的groupId+artifactId`相当于Docker中的`仓库Repository`
	* `Maven中的version`相当于Docker中的`Tag`
* `Java虚拟机`相当于Docker的`容器`
* `Maven中的pom文件+生成的二进制文件`相当于Docker中的`镜像`

注意：

* 一个镜像可能对应多个标签（类似Unix的硬链接）

（5）理解

* Docker 容器有自己的kernel吗？
	* 没有，docker和宿主机共享kernel
* Docker的kernel version由镜像确定还是由宿主机确定
	* 由宿主机决定，但是Docker的镜像运行的环境一般是Linux x64，所以windows的Docker应该包含一个Linux子系统

## 二、docker安装配置使用

***

### 1、安装

#### （1）Ubuntu安装

**卸载旧版**

```bash
sudo apt-get remove docker docker-engine docker.io
```

**安装**

```bash
#更新 apt 软件包索引：
sudo apt-get update

#安装软件包，以允许 apt 通过 HTTPS 使用镜像仓库：
sudo apt-get install \
     apt-transport-https \
     ca-certificates \
     curl \
     software-properties-common

#添加 Docker 的官方 GPG 密钥：
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
sudo apt-key fingerprint 0EBFCD88

#设置 stable 镜像仓库
# arm64
sudo add-apt-repository \
    "deb [arch=amd64] https://download.docker.com/linux/ubuntu \
    $(lsb_release -cs) \
    stable"
# 18.04
sudo add-apt-repository \
        "deb [arch=amd64] https://download.docker.com/linux/ubuntu \
        artful \
        stable"

#更新
sudo apt-get update
#安装
sudo apt-get install docker-ce

```

### 2、配置

**验证安装**

```bash
sudo docker run hello-world
```

**查看版本**

```bash
docker version
```

**配置国内Docker镜像**

配置`/etc/docker/daemon.json`

```json
{
	"registry-mirrors":
	[
		"https://registry.docker-cn.com"
	]
}
```

重启

```bash
sudo systemctl daemon-reload
sudo systemctl restart docker
```

**配置不使用sudo**

```bash
sudo groupadd docker
sudo usermod -aG docker $USER
#注销并重新登录
#测试
docker run hello-world
```

### 3、简单使用

#### （1）创建测试程序

`app.py`：一个HelloWordHttp服务器

```py
from flask import Flask
from redis import Redis, RedisError
import os
import socket

# Connect to Redis
redis = Redis(host="redis", db=0, socket_connect_timeout=2, socket_timeout=2)

app = Flask(__name__)

@app.route("/")
def hello():
    try:
        visits = redis.incr("counter")
    except RedisError:
        visits = "<i>cannot connect to Redis, counter disabled</i>"

    html = "<h3>Hello {name}!</h3>" \
           "<b>Hostname:</b> {hostname}<br/>" \
           "<b>Visits:</b> {visits}"
    return html.format(name=os.getenv("NAME", "world"), hostname=socket.gethostname(), visits=visits)

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=80)
```

`requirements.txt`python依赖文件

```
Flask
Redis
```

#### （2）编写`Dockerfile`

`Dockerfile` 将在您的容器内定义环境中执行的操作。对网络接口和磁盘驱动器等资源的访问在此环境内实现虚拟化，这将独立于系统的其余部分，因此您必须将端口映射到外部，并具体说明您要“复制”到该环境的文件。但是，在执行此操作后，您可以期望此 `Dockerfile` 中定义的应用构建的行为在运行时始终相同。

```docker
# 将官方 Python 运行时用作父镜像
FROM python:2.7-slim

# 将工作目录设置为 /app
WORKDIR /app

# 将当前目录内容复制到位于 /app 中的容器中
ADD . /app

# 安装 requirements.txt 中指定的任何所需软件包
RUN pip install -r requirements.txt

# 使端口 80 可供此容器外的环境使用
EXPOSE 80

# 定义环境变量
ENV NAME World

# 在容器启动时运行 app.py
CMD ["python", "app.py"]
```

#### （3）构建应用

```bash
docker build -t friendlyhello .
#查看结果
docker images
```

#### （4）运行应用

**前台运行**

```bash
docker run -p 4000:80 friendlyhello
```

访问：`http://localhost:4000/`

* `4000:80` 表示在docker外部可以通过4000访问应用80提供的服务，而80无法从外部使用，是一个映射

**后台运行**

```bash
docker run -d -p 4000:80 friendlyhello
#查看
docker ps
#停止
docker stop [CONTAINER ID]
```

#### （5）发布镜像

[略](https://docs.docker-cn.com/get-started/part2/#%E5%85%B1%E4%BA%AB%E9%95%9C%E5%83%8F)

**注册docker账号**

**cli工具登录**

```bash
docker login
```

**标记镜像**

`docker tag image username/repository:tag`

```bash
docker tag friendlyhello rectcircle/get-started:part1
# 查看
docker images
```

**发布镜像**

`docker push username/repository:tag`

```bash
docker push rectcircle/get-started:part1
```

**从远程镜像仓库中拉取并运行镜像**

`docker run -p 4000:80 username/repository:tag`

```bash
docker run -p 4000:80 rectcircle/get-started:part1
```

#### （6）使用服务

**服务的概念**

在分布式应用中，应用的不同部分称为“服务”。例如，假设有一个视频共享网站，它可能提供用于在数据库中存储应用程序数据的服务、用于在用户上传一些内容后在后台进行视频转码的服务、用于前端的服务等。

服务实际上是“生产中的容器”。一项服务仅运行一个镜像，但它会编制镜像的运行方式 - 它应使用的端口、容器的多少个从节点应运行才能使服务的容量满足其需求等。扩展服务将更改运行该软件的容器实例数，并将多个计算资源分配给进程中的服务。

幸运的是，很容易使用 Docker 平台定义、运行和扩展服务 – 只需编写一个 `docker-compose.yml` 文件即可。

**创建`docker-compose.yml`**

```yml
version: "3"
services: #定义服务
  web: #服务类型为web
    # 从镜像库中拉取
    image: rectcircle/get-started:part1
    deploy: #部署方式
      replicas: 5 #部署实例数目
      resources: #资源限制
        limits:
          cpus: "0.1" #最多使用10%的cpu
          memory: 50M #最大内存占用
      restart_policy: #重启策略
        condition: on-failure
    ports: #端口映射策略
      - "80:80"
    networks: #网络方式
      - webnet
networks:
  webnet:
```

**运行新的负载均衡的应用**

准备

```bash
docker swarm init
```

现在，运行此命令。您必须为应用指定一个名称。在此处该名称设置为 getstartedlab：

```bash
docker stack deploy -c docker-compose.yml getstartedlab
```

查看

```bash
docker stack ps getstartedlab
```

**支持原地更新**

修改配置后直接执行以下命令就可以直接生效，而不是重启

```bash
docker stack deploy -c docker-compose.yml getstartedlab
```

**清除应用和 swarm**

```bash
docker stack rm getstartedlab
docker swarm leave --force
```

#### （7）swarm 集群

swarm 是一组运行 Docker 并且已加入集群中的机器。执行此操作后，您可以继续运行已使用的 Docker 命令，但现在它们在集群上由 swarm 管理节点执行。 swarm 中的机器可以为物理或虚拟机。加入 swarm 后，可以将它们称为节点。

* `docker swarm init` 启用 swarm mode 并使当前机器成为 swarm 管理节点
* `docker swarm join` 以工作节点形式加入 swarm

### 4、使用到的指令

```bash
docker build -t friendlyname .# 使用此目录的 Dockerfile 创建镜像
docker run -p 4000:80 friendlyname  # 运行端口 4000 到 90 的“友好名称”映射
docker run -d -p 4000:80 friendlyname         # 内容相同，但在分离模式下
docker ps                                 # 查看所有正在运行的容器的列表
docker stop <hash>                     # 平稳地停止指定的容器
docker ps -a           # 查看所有容器的列表，甚至包含未运行的容器
docker kill <hash>                   # 强制关闭指定的容器
docker rm <hash>              # 从此机器中删除指定的容器
docker rm $(docker ps -a -q)           # 从此机器中删除所有容器
docker images -a                               # 显示此机器上的所有镜像
docker rmi <imagename>            # 从此机器中删除指定的镜像
docker rmi $(docker images -q)             # 从此机器中删除所有镜像
docker login             # 使用您的 Docker 凭证登录此 CLI 会话
docker tag <image> username/repository:tag  # 标记 <image> 以上传到镜像库
docker push username/repository:tag            # 将已标记的镜像上传到镜像库
docker run username/repository:tag                   # 运行镜像库中的镜像

docker stack ls              # 列出此 Docker 主机上所有正在运行的应用
docker stack deploy -c <composefile> <appname>  # 运行指定的 Compose 文件
docker stack services <appname>       # 列出与应用关联的服务
docker stack ps <appname>   # 列出与应用关联的正在运行的容器
docker stack rm <appname>                             # 清除应用

docker-machine create --driver virtualbox myvm1 # 创建 VM（Mac、Win7、Linux）
docker-machine create -d hyperv --hyperv-virtual-switch "myswitch" myvm1 # Win10
docker-machine env myvm1                # 查看有关节点的基本信息
docker-machine ssh myvm1 "docker node ls"         # 列出 swarm 中的节点
docker-machine ssh myvm1 "docker node inspect <node ID>"        # 检查节点
docker-machine ssh myvm1 "docker swarm join-token -q worker"   # 查看加入令牌
docker-machine ssh myvm1   # 打开与 VM 的 SSH 会话；输入“exit”以结束会话
docker-machine ssh myvm2 "docker swarm leave"  # 使工作节点退出 swarm
docker-machine ssh myvm1 "docker swarm leave -f" # 使主节点退出，终止 swarm
docker-machine start myvm1            # 启动当前未运行的 VM
docker-machine stop $(docker-machine ls -q)               # 停止所有正在运行的 VM
docker-machine rm $(docker-machine ls -q) # 删除所有 VM 及其磁盘镜像
docker-machine scp docker-compose.yml myvm1:~     # 将文件复制到节点的主目录
docker-machine ssh myvm1 "docker stack deploy -c <file> <app>"   # 部署应用
```

## 三、常用命令

***

### 1、镜像命令

**搜索镜像**

```bash
docker search java
```

**下载镜像**

```bash
# docker pull [选项] [Docker Registry 地址[:端口号]/]仓库名[:标签]
docker pull java
```

**列出镜像**

```bash
docker images
#或者
docker image ls
# 查看所有镜像（包含中间层镜像）
docker image ls -a
# 查看空悬镜像
docker image ls -f dangling=true
# 删除空悬镜像
docker image prune
#列出部分镜像
docker image ls ubuntu
docker image ls ubuntu:16.04
docker image ls -f since=mongo:3.2
docker image ls -f label=com.example.version=0.1
# 特定格式输出
docker image ls --format "{{.ID}}: {{.Repository}}"
```

**删除镜像**

```bash
docker rmi hello-world
docker rmi -f $(docker imgages)
#docker image rm [选项] <镜像1> [<镜像2> ...]
#其中， <镜像> 可以是 镜像短 ID 、 镜像长 ID 、 镜像名 或者 镜像摘要 。
```

**查看镜像、容器、数据卷所占用的空间**

```bash
docker system df
```

### 2、容器命令

#### （1）新建并启动容器

`docker run`

选项

* -d 后台运行
* -P 随机端口映射
* -p 指定端口映射
	* `ip:hostPort:containPort`
	* `ip::containPort`
	* `hostPort:containPort`
	* `containPort`
* --network 网络模式
	* `--network=bridge` 默认：网桥
	* `--network=host`
	* `--network=containter:NAME_or_ID`
	* `--network=none`
* -i 交互式操作
* -t 终端
* --mount 或 -v
	* `-v /src/webapp:/opt/webapp` 格式：`本机目录:容器内目录`
	* `--mount type=bind,source=/src/webapp,target=/opt/webapp`
* --rm 这个参数是说容器退出后随之将其删除。默认情况下，为了排障需求，退出的容器并不会立即删除，除非手动 docker rm

**实例**

```bash
docker run java /bin/echo 'hello world' #等价于直接运行echo 'hello world'
docker run -d -p 91:80 nginx
```

会自动检测本机是否有指定镜像，若没有会自动下载一个

docker run 后台操作

* 检查本地是否存在指定的镜像，不存在就从公有仓库下载
* 利用镜像创建并启动一个容器
* 分配一个文件系统，并在只读的镜像层外面挂载一层可读写层
* 从宿主主机配置的网桥接口中桥接一个虚拟接口到容器中去
* 从地址池配置一个 ip 地址给容器
* 执行用户指定的应用程序
* 执行完毕后容器被终止

#### （2）其他常用

* 列出的容器 `docker ps` (所有容器、不包括停止了的，使用`-a`查看所有)
* 停止 `docker stop [CONTAINER ID]`
* 强行停止 `docker kill [CONTAINER ID]`
* 启动已停止 `docker start [CONTAINER ID]`
* 重启 `docker restart [CONTAINER ID]`
* 进入容器`docker attach [CONTAINER ID]`（相当于打开一个终端、但是进入多次都是同一个终端）
* 使用nsenter进入容器

```bash
docker ps
docker inspect --format "{{.State.Pid}}" [CONTAINER ID]
nsenter --target [PID] --mount --uts --ipc --net --pid
```

* Linux系统进入环境

```bash
#宿主机为windows
winpty docker exec -it [CONTAINER ID] bash
#宿主机为Linux
docker exec -it [CONTAINER ID] bash
```

* 删除容器 `docker rm [CONTAINER ID]`
* 删除所有 `docker rm $(docker ps -a -q)`
* 导出容器镜像

```bash
# 导入导出容器快照
# 导出
docker ps -a
docker export 7691a814370e > ubuntu.tar

# 导入容器快照
cat ubuntu.tar | docker import - test/ubuntu:v1.0
docker import http://example.com/exampleimage.tgz example/imagerepo
```

## 四、Dockerfile

***

> [文档](https://docs.docker.com/compose/overview/)

Dockerfile是一种用于构建镜像的脚本

### 1、Dockerfile常用命令

* `ADD <src> ... <dest>` 尽可能的使用`COPY`，仅在需要自动解压压缩文件时使用
	* src只能是Dockerfile所在目录及子目录的内容
	* src是url，不以`/`结尾，则视为文件
	* scr是url，以`/`结尾，视为目录
	* scr是目录，将整个目录复制，包括文件系统元数据
	* 如果文件是可识别压缩格式，docker会自动解压
* `ARG k=v` 构建环境变量：构建时有效，运行时无效
* `CMD` 容器启动命令
	* `CMD ["可执行命令", "参数"]`
	* `CMD command p1 p2`  默认解析成 `sh -c`
	* 参数列表格式： CMD ["参数1", "参数2"...] 。在指定了 ENTRYPOINT 指令后，用 CMD 指 定具体的参数。
* `COPY` 类似`ADD` 不支持URL和压缩包
	* `COPY <源路径>... <目标路径>`
	* `COPY ["<源路径1>",... "<目标路径>"]`
	* 支持通配符go的`filepath.Match`规则
	* `<目标路径>` 可以是容器内的绝对路径，也可以是相对于工作目录的相对路径（工作目录可以用 WORKDIR 指令来指定）。目标路径不需要事先创建，如果目录不存在会在复制文件前先行 创建缺失目录。
	* 使用 COPY 指令，源文件的各种元数据都会保留。比如读、写、执 行权限、文件变更时间等。
* `ENTRYPOINT` 类似于`CMD` 入口点
	* 当设置了入口点`CMD`的参数将和`ENTRYPOINT`拼接成`<ENTRYPOINT> "<CMD>"`
	* 最佳实践
		* 让镜像变成像命令一样使用
		* `ENTRYPOINT`运行脚本，接受参数，做一些前置操作
* `ENV` 设置环境变量：构建时、运行时都可用
	* `ENV <key> <value>`
	* `ENV <key1>=<value1> <key2>=<value2>...`
	* 这个指令很简单，就是设置环境变量而已，无论是后面的其它指令，如 RUN ，还是运行时的 应用，都可以直接使用这里定义的环境变量。
* `EXPOSE port ...` 暴露端口
* `FROM` 指定基础镜像，写在第一行
* `LABEL` 添加元数据
* `MAINTAINER` 指定维护者信息
* `RUN` 创建容器时执行的命令，一个层镜像最好使用一个，多条命令使用&&连接
* `USER` 指定执行用户
* `VOLUME` 指定挂载点，用于持久化数据
* `WORKDIR` 指定工作目录

### 2、docker build

构建一个镜像，命名格式如下

```bash
docker build [选项] <上下文路径/URL/->
```

上下文路径指定的Dockerfile使用的相对路径的基础路径。docker build会将上下文路径的内容发送到docker引擎，进行构建。如果不需要发送的路径可以通过`.dockerignore`文件进行忽略

例子

```bash
# 上下文路径为当前pwd，指定构建路径的标签，构建脚本为上下文路径内的Dockerfile
docker build -t nginx:v3 .
# 从git仓库进行构建
docker build https://github.com/twang2218/gitlab-ce-zh.git
# 从指定tar包构建
docker build http://server/context.tar.gz
# 从标准输入中读取 Dockerfile 进行构建，这种方式没有上下文，不允许从上下文路径拷贝文件
docker build - < Dockerfile
cat Dockerfile | docker build -
# 从标准输入中读取上下文压缩包进行构建
docker build - < context.tar.gz
```

## 五、Docker Compose

***

### 1、Compose概述

Compose是定义和运行多容器Docker应用程序的工具。通过定义一个yml配置文件来配置应用程序服务。然后通过一个命令启动整个服务集群。

使用Compose基本上是一个三步过程：

* 使用Dockerfile定义应用程序的环境，以便在任何地方复制。
* 在docker-compose.yml中定义组成应用程序的服务，以便它们可以在隔离的环境中一起运行。
* 使用`docker-compose up`命令运行

Compose 中有两个重要的概念：

* 服务 ( service )：一个应用的容器，实际上可以包括若干运行相同镜像的容器实例。
* 项目 ( project )：由一组关联的应用容器组成的一个完整业务单元，在 dockercompose.yml 文件中定义。

Compose具有管理应用程序整个生命周期的命令：

* 启动，停止和重建服务
* 查看正在运行的服务的状态
* 流式传输运行服务的日志输出
* 在服务上运行一次性命令

### 2、Compose安装

Compose 项目由 Python 编写，实现上调用了 Docker 服务提供的 API 来对容器进行管理。因此，只要所操作的平台支持 Docker API，就可以在其上利用 Compose 来进行编排管理。

Compose 支持 Linux、macOS、Windows 10 三大平台。

Compose 可以通过 Python 的包管理工具 pip 进行安装，也可以直接下载编译好的二进制文
件使用，甚至能够直接在 Docker 容器中运行。

确保已经安装Docker

#### （1）Linux安装

本质上是一个shell脚本

```bash
sudo curl -L https://github.com/docker/compose/releases/download/1.21.2/docker-compose-$(uname -s)-$(uname -m) -o /usr/local/bin/docker-compose

sudo chmod +x /usr/local/bin/docker-compose

#测试安装
docker-compose --version
```

### 3、基本使用

#### （1）创建测试项目

```bash
# 创建项目目录
mkdir composetest
cd composetest

# 创建文件
touch app.py  docker-compose.yml  Dockerfile  requirements.txt
```

#### （2）程序源码

**app.py**

```py
import time

import redis
from flask import Flask


app = Flask(__name__)
cache = redis.Redis(host='redis', port=6379)


def get_hit_count():
    retries = 5
    while True:
        try:
            return cache.incr('hits')
        except redis.exceptions.ConnectionError as exc:
            if retries == 0:
                raise exc
            retries -= 1
            time.sleep(0.5)


@app.route('/')
def hello():
    count = get_hit_count()
    return 'Hello World! I have been seen {} times.\n'.format(count)


if __name__ == "__main__":
    app.run(host="0.0.0.0", debug=True)
```

**依赖**

```
flask
redis
```

#### （3）编写Dockerfile

**Dockerfile**

```
FROM python:3.4-alpine
ADD . /code
WORKDIR /code
RUN pip install -r requirements.txt
CMD ["python", "app.py"]
```

#### （4）编写compoes配置文件

**docker-compose.yml**

```yml
version: '3'
services: # 定义服务
  web: # web服务
    build: . # 从当前目录
    ports: # 端口映射
     - "5000:5000"
  redis: # redis服务
    image: "redis:alpine"
```

#### （5）运行

```bash
docker-compose up
docker-compose up -d # 后台
```

#### （6）测试

* 访问`localhost:5000`
* 查看镜像情况`docker image ls`

#### （7）绑定一个挂载

```bash
version: '3'
services:
  web:
    build: .
    ports:
     - "5000:5000"
    volumes:
     - .:/code # 将当前目录挂载到docker中的/code
  redis:
    image: "redis:alpine"
```

重新运行

这样修改源文件后将立即生效

#### （8）其他命令

```bash
# 后台启动
docker-compose up -d
# 查看进程
docker-compose ps
# 在docker中运行命令
docker-compose run web env
# 停止
docker-compose stop
# 删除数据
docker-compose down --volumes
```

#### （9）相关概念

Docker Compose 所管理的容器分为三层：工程、服务、容器。

* 其运行目录下的所有文件组成一个工程
* 一个工程包括多个服务
* 一个服务定义了容器运行的镜像、参数和依赖，可以启动多个容器实例

### 4、docker-compose.yml

#### （1）指定版本

`version: '3'`

最新版为3

#### （2）`services.<name>`下常用命令

**build**

用于指定服务的构建配置

```yml
# 直接指定路径
build: ./dir

# 指定更多参数
build:
	context: ./dir
	dockerfile: Dockerfile-alternate
	args:
		buildno:1
```

**command**

配置容器启动后默认的执行的命令

```yml
command: bundle exec thin -p 3000
```

**dns**

配置dns服务器

**dns_search**

dns搜索域

**environment**

```yaml

environment:
	RACK_ENV: development
	SHOW: 'true'

#或者
environment:
	- RACK_ENV=development
	- SHOW='true'

```

**env_file**

环境变量文件

**expose**

暴露的端口

```yaml
expose:
	- "3000"
	- "8000"
```

**external_links**

导出服务名

**image**

指定镜像

**links**

连接服务名，这样就可以通过内部连接该服务，而不是通过外部端口

```yaml
web:
	links:
		- db
		- db:database
```

**networks**

**network_mode**

网络模式

**ports**

暴露端口信息

```yml
ports:
	- "3000"
	- "3000-3005"
	- "8000:8000"
	- "9090-9091:8080-8081"
	- "127.0.0.1:8001:8001"
```

**volumes**

卷挂载路径设置

```yaml
volumes：
	- /var/lib/mysql
	- /opt/data:/var/lib/mysql # 本机路径:docker内容器路径
	- ./cache:/tmp/cache
```

**volumes_from**

从另外一个服务挂路径

### 5、docker-compose常用命令

#### （1）命令格式

`docker-compose [-f=<arg>...] [options] [COMMAND] [ARGS...]`

#### （2）命令选项

* -f, --file FILE 指定使用的 Compose 模板文件，默认为 docker-compose.yml ，可以多次指定。
* -p, --project-name NAME 指定项目名称，默认将使用所在目录名称作为项目名。
* --x-networking 使用 Docker 的可拔插网络后端特性
* --x-network-driver DRIVER 指定网络后端的驱动，默认为 bridge
* --verbose 输出更多调试信息。
* -v, --version 打印版本并退出。

#### （3）命令使用说明

* `build` 构建
	* 格式 `docker-compose build [options] [SERVICE...]`
	* --force-rm 删除构建过程中的临时容器。
	* --no-cache 构建镜像过程中不使用 cache（这将加长构建过程）。
	* --pull 始终尝试通过 pull 来获取更新版本的镜像。
* `config` 验证 Compose 文件格式是否正确，若正确则显示配置，若格式错误显示错误原因。
* `down` 此命令将会停止 up 命令所启动的容器，并移除网络
* `exec` 进入指定的容器。
* `help` 帮助
* `images` 列出 Compose 文件中包含的镜像。
* `kill` 结束服务
	* 格式 `docker-compose kill [options] [SERVICE...]`
	* 支持通过 -s 参数来指定发送的信号，例如通过如下指令发送 SIGINT 信号。`docker-compose kill -s SIGINT`
* `logs` 查看输出
	* 格式 `docker-compose logs [options] [SERVICE...]`
	* 可以通过 --no-color 来关闭颜色
* `pause` 暂停一个服务容器
	* 格式 `docker-compose pause [SERVICE...]`
* `port` 打印某个容器端口所映射的公共端口
	* 格式 `docker-compose port [options] SERVICE PRIVATE_PORT`
	* --protocol=proto 指定端口协议，tcp（默认值）或者 udp。 --index=index 如果同一服务存在多个容器，指定命令对象容器的序号（默认为 1）。
* `ps` 查看所有容器及状态
	* 格式为 `docker-compose ps [options] [SERVICE...]`
	* -q 只打印容器的 ID 信息
* `pull` 拉取服务依赖的镜像
	* --ignore-pull-failures 忽略拉取镜像过程中的错误
* `push` 推送服务依赖的镜像到 Docker 镜像仓库
* `restart` 重启项目中的服务。
	* 格式 `docker-compose restart [options] [SERVICE...]`
	* -t, --timeout TIMEOUT 指定重启前停止容器的超时（默认为 10 秒）。
* `rm` 删除所有（停止状态的）服务容器。推荐先执行 docker-compose stop 命令来停止容器。
	* 格式为 `docker-compose rm [options] [SERVICE...]`
	* -f, --force 强制直接删除，包括非停止状态的容器。一般尽量不要使用该选项。
	* -v 删除容器所挂载的数据卷。
* `run` 在指定服务上执行一个命令 `docker-compose run web bash`
	* 格式 `docker-compose run [options] [-p PORT...] [-e KEY=VAL...] SERVICE [COMMAND]`
	* 默认情况下，如果存在关联，则所有关联的服务将会自动被启动，除非这些服务已经在运行中。 该命令类似启动容器后运行指定的命令，相关卷、链接等等都将会按照配置自动创建。 两个不同点：
		* 给定命令将会覆盖原有的自动运行命令；
		* 不会自动创建端口，以避免冲突。
	* 如果不希望自动启动关联的容器，可以使用 --no-deps
	* 选项：
		* -d 后台运行容器。
		* --name NAME 为容器指定一个名字。
		* --entrypoint CMD 覆盖默认的容器启动指令。
		* -e KEY=VAL 设置环境变量值，可多次使用选项来设置多个环境变量。
		* -u, --user="" 指定运行容器的用户名或者 uid。
		* --no-deps 不自动启动关联的服务容器。
		* --rm 运行命令后自动删除容器， d 模式下将忽略。
		* -p, --publish=[] 映射容器端口到本地主机。
		* --service-ports 配置服务端口并映射到本地主机。
		* -T 不分配伪 tty，意味着依赖 tty 的指令将无法运行。
* `scale` 指定服务运行数量
	* 格式 `docker-compose scale [options] [SERVICE=NUM...]`
	* 例子 `docker-compose scale web=3 db=2`
	* 将启动 3 个容器运行 web 服务，2 个容器运行 db 服务。 一般的，当指定数目多于该服务当前实际运行容器，将新创建并启动容器；反之，将停止容器。
	* -t, --timeout TIMEOUT 停止容器时候的超时（默认为 10 秒）。
* `start` 启动指定服务已存在的容器
	* 格式 `docker-compose start [SERVICE...]`
* `stop` 停止已运行的容器
	* 格式 `docker-compose start [SERVICE...]`
	* -t, --timeout TIMEOUT 停止容器时候的超时（默认为 10 秒）。
* `top` 查看各个服务容器内运行的进程。
* `unpause` 恢复处于暂停状态中的服务。
	* 格式 `docker-compose unpause [SERVICE...]`
* `up` 启动整个服务集合
	* 格式 `docker-compose up [options] [SERVICE...]`
	* -d 在后台运行服务容器。
	* --no-color 不使用颜色来区分不同的服务的控制台输出。
	* --no-deps 不启动服务所链接的容器。
	* --force-recreate 强制重新创建容器，不能与 --no-recreate 同时使用。
	* --no-recreate 如果容器已经存在了，则不重新创建，不能与 --force-recreate 同时使用。
	* --no-build 不自动构建缺失的服务镜像。
	* -t, --timeout TIMEOUT 停止容器时候的超时（默认为 10 秒）。
* `version` 打印版本信息

### 6、Docker Compose网络设置

#### （1）基本概念

默认情况下Compose会创建一个网络，服务中的所有容器都会加入该网络。容器就可以通过服务名作为hostname互相访问

例如：在myapp目录下

```yaml
version: '3'

services: #定义服务
  eureka: #服务名
    build: . #当前服务的镜像来自当前目录的Dockerfile
    ports:
      - "8000:8000" #指定端口映射
	db:
		image: postgres
```

当up时：

* 创建名为myapp_default的网络
* 使用web服务配置创建容器，将web这个名称加入到myapp_default
* 使用db服务配置创建容器，将db这个名称加入到myapp_default

这样web可以通过`postgres://db:5432`访问db容器

#### （2）更新容器

使用`docker-compose up`即可更新

#### （3）links

可以在link中定义一个别名，访问

```yml
version: '3'

services: #定义服务
  eureka: #服务名
    build: . #当前服务的镜像来自当前目录的Dockerfile
		links:
			- "db:database"
    ports:
      - "8000:8000" #指定端口映射
	db:
		image: postgres
```

这样web可以通过`postgres://database:5432`访问db容器

#### （4）自定义网络

```yml
version: '3'

services: #定义服务
	proxy:
		build: ./proxy
		networks:
			- front
	app:
		build: ./app
		networks:
			- front
			- back
	db:
		image: postgres
		networks:
			- back

networks:
	front: # Use a custom driver
		driver: custom-driver-1
	back: # Use a custom driver which takes special options
		driver: custom-driver-2
		driver_opts:
			foo: "1"
			bar: "2"
```

#### （5）配置默认网络

```yml
version: '3'

services: #定义服务
  web: #服务名
    build: . #当前服务的镜像来自当前目录的Dockerfile
    ports:
      - "8000:8000" #指定端口映射
	db:
		image: postgres

networks:
	default:
		driver: custom-driver-1
```

#### （5）使用已存在的网路

```yml
networks:
	default:
		external:
			name: my-pre-existing-network
```

## 六、编程技巧

### 1、处理容器退出指令

捕获 `SIGTERM` 信号，进行状态变更处理
