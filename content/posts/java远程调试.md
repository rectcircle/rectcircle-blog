---
title: Java远程调试
date: 2017-03-01T23:27:54+08:00
draft: false
toc: true
comments: true
aliases:
  - /detail/48
  - /detail/48/
tags:
  - Java
---

## 一、说明

***

### 1、项目类型

maven构建的java web应用程序

### 2、web容器

tomcat 8.0

### 3、集成开发环境

eclipse java ee 4.5.1（已汉化）

### 4、远程服务器

centos 6.5 腾讯云主机

## 二、步骤

***

### 1、项目打包

#### （1）web项目没有错误，需要调试

#### （2）项目打包

* 进入eclipse项目资源管理器
* 右键项目 -> 运行方式 -> Maven build...
* 在Goals填写maven参数 `clean package`，点击应用、运行
* 打包完成后进入 `项目目录/target/`，其中的`.war`文件即是打包完成的文件

### 2、将war包复制到远程服务器的tomcat目录下的webapps目录下

可以使用xftp传输文件

### 3、（重要）修改tomcat启动脚本`catalina.sh`或者`catalina.bat`

#### （1）在Linux平台下修改`catalina.sh`

* 用编辑器打开 `tomcat目录/bin/catalina.sh`
* 搜索定位到`$JPDA_ADDRESS`字符串
* 修改脚本去掉`JPDA_ADDRESS="localhost:8000"`前面的`localhost:`

```bash
#原始内容
if [ -z "$JPDA_ADDRESS" ]; then
JPDA_ADDRESS="localhost:8000"
fi
#修改为
if [ -z "$JPDA_ADDRESS" ]; then
JPDA_ADDRESS="8000"
fi
```

#### （2）在windows平台下修改`catalina.bat`

* 用编辑器打开 `tomcat目录/bin/catalina.sh`
* 搜索定位到`set JPDA_ADDRESS=`字符串
* 修改脚本去掉`set JPDA_ADDRESS=localhost:8000`前面的`localhost:`

```
#原始内容
set JPDA_ADDRESS=localhost:8000
#修改为
set JPDA_ADDRESS=8000
```

当然若学过脚本可以自写脚本启动

**说明a**：关于catalina脚本和startup脚本。startup相当于一个简化的启动方案，起始他也是到用catalina脚本的快捷命令

**说明b**：修改JPDA_ADDRESS的目的是，如果JPDA_OPTS的ADDRESS参数填写完整地址将只会接收匹配主机的请求连接，例如localhost:8000，那么只接受本机的远程调试连接。通过netstat -antp|grep 8000可以验证

### 4、启动tomcat服务器

使用以下方式启动服务器

```bash
cd tomcat目录/bin
./catalina.sh jpda start
```

**说明a**：tomcat启动脚本`catalina`已经自带了启动远程调试的命令选项。打开`catalina.sh`，在最后有全部命令参数说明

```bash
#.......
else

  echo "Usage: catalina.sh ( commands ... )"
  echo "commands:"
  if $os400; then
    echo "  debug             Start Catalina in a debugger (not available on OS400)"
    echo "  debug -security   Debug Catalina with a security manager (not available on OS400)"
  else
    echo "  debug             Start Catalina in a debugger"
    echo "  debug -security   Debug Catalina with a security manager"
  fi
  echo "  jpda start        Start Catalina under JPDA debugger"
  echo "  run               Start Catalina in the current window"
  echo "  run -security     Start in the current window with security manager"
  echo "  start             Start Catalina in a separate window"
  echo "  start -security   Start in a separate window with security manager"
  echo "  stop              Stop Catalina, waiting up to 5 seconds for the process to end"
  echo "  stop n            Stop Catalina, waiting up to n seconds for the process to end"
  echo "  stop -force       Stop Catalina, wait up to 5 seconds and then use kill -KILL if still running"
  echo "  stop n -force     Stop Catalina, wait up to n seconds and then use kill -KILL if still running"
  echo "  configtest        Run a basic syntax check on server.xml - check exit code for result"
  echo "  version           What version of tomcat are you running?"
  echo "Note: Waiting for the process to end and use of the -force option require that \$CATALINA_PID is defined"
  exit 1
fi
```

其中  jpda start 就是启动远程调试的命令，所以启动远程调试命令如下：（Linux）

```bash
cd tomcat目录/bin
./catalina.sh jpda start
```

### 5、回到eclipse配置远程debug

* 选择菜单 运行 -> 调试配置
* 选择远程java应用程序点击新建图表
* 填写选项
    * 名称：随便填，便于区分
    * 项目：浏览选择需要远程调试的项目
    * 连接类型：标准（套接字连接）
    * 主机：远程服务器ip
    * 允许中止远程VM：随意
    * 端口：8000
* 单击应用、调试
* 没有弹出错误、工具栏调试相关的按钮激活说明连接远程调试器成功

### 6、开始调试

* 在需要断点的位置打断点
* 浏览器访问页面
* 断点位置中断，可以查看参数
* 完成调试

### 7、初次远程调试成功后按照以下步骤远程调试

* 发布项目（步骤1、2）
* 启动tomcat服务器（步骤4）
* 点击运行 -> 调试方式 -> 初次配置远程debug的名称
* 开始调试（步骤6）

## 三、Docker 远程调试 Spring Boot

### 1、测试网络连通性

```bash
# docker 创建 一个 TCP Server
nc -lv -p 15005
# 本地连接测试
telnet docker_ip docker暴露端口
nc -vz -w 2 docker_ip docker暴露端口
```

### 2、启动 Server

```bash
java -jar -agentlib:jdwp=transport=dt_socket,server=y,suspend=y,address=0.0.0.0:15005 xxx.jar
```
