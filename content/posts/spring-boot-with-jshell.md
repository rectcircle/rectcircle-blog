---
title: "Spring Boot With Jshell"
date: 2020-07-10T10:32:13+08:00
draft: false
toc: true
comments: true
tags:
  - java
---

Java 版本：11

参考：

* [Jshell 使用手册](http://cr.openjdk.java.net/~rfield/tutorial/JShellTutorial.html)
* [Youtube教程](https://www.youtube.com/watch?v=lTrzahYq5ok&t=674s)

实验代码：https://github.com/rectcircle/explore-spring-boot-with-jshell

## Jshell 简介

自 Java 9 起，JDK 包含了一个 REPL 工具 `jshell`，功能类似 `python` 和 `scala` 命令

因此，就可以通过 Jshell 做一些 Java 的 实验了。

## Jshell 结合 Spring Boot

在 Python Django 中，Django 提供了 `python manage.py shell` 命令用于加载 Django 框架，并启动 Python shell，可以很方便的调试 Django 程序。

理论上 Jshell 也可以实现类似的特性

### 思路

* 将 Spring Boot 项目编译为 fat jar
* 解压下来
* 启动 `Jshell` 时，将 CLASSPATH 环境变量指定为 `target/"BOOT-INF/classes:BOOT-INF/lib/*"`
* 引入 常用 组件包 和 Application 类
* 调用 main 方法启动
* 通过 我们实现的 `SpringBeanUtils` 类拿到 `ApplicationContext`，这样就可以调试 Spring 管理 的 bean 了

### 实现

创建一个测试的 Spring Boot Web 项目。

添加 测试的 Controller Service 等

```
src
└── main
    └── java
        └── cn
            └── rectcircle
                └── explore
                    └── springbootwithjshell
                        ├── ExploreSpringBootWithJshellApplication.java
                        ├── controller
                        │   └── HelloController.java
                        ├── dto
                        │   └── RespDTO.java
                        ├── service
                        │   ├── HelloService.java
                        │   └── HelloServiceImpl.java
                        └── util
                            └── SpringBeanUtils.java
```

添加 `SpringBeanUtils`

```java
package cn.rectcircle.explore.springbootwithjshell.util;

import org.springframework.context.ApplicationContext;
import org.springframework.context.ApplicationContextAware;
import org.springframework.stereotype.Component;

/**
 * 用于向不受 Spring 管理的 Bean 访问 Bean 工厂（谨慎使用）
 * @author rectcircle
 */
@Component
public class SpringBeanUtils implements ApplicationContextAware {

    private static ApplicationContext applicationContext;

    @Override
    public void setApplicationContext(ApplicationContext applicationContext) {
        SpringBeanUtils.applicationContext = applicationContext;
    }

    public static ApplicationContext getInstance() {
        return applicationContext;
    }

}
```

maven 编译 和 解压jar包

```bash
./mvnw clean package -DskipTests
cd target
jar xf $MODULE_NAME-*.jar
```

指定 `CLASSPATH` 并执行 Jshell

```bash
CLASSPATH="BOOT-INF/classes:BOOT-INF/lib/*" jshell
```

测试Jshell

```java
// import main
import cn.rectcircle.explore.springbootwithjshell.*

// import 组件
import cn.rectcircle.explore.springbootwithjshell.controller.*
import cn.rectcircle.explore.springbootwithjshell.dto.*
import cn.rectcircle.explore.springbootwithjshell.service.*
import cn.rectcircle.explore.springbootwithjshell.util.*

// 启动 Spring App
ExploreSpringBootWithJshellApplication.main(new String[]{})

// 注入 spring 上下文
var springContext = SpringBeanUtils.getInstance()

// 调试 bean
var hs = springContext.getBean(HelloService.class);
hs.sayHello("test")
```

curl 测试

```bash
curl "http://127.0.0.1:8080/hello?word=world"
```

### 脚本化

* 将上边大段 import 写入 `*.jsh` 文件。
* 通过 `*.sh` 文件，通过控制编译解压，导入环境变量的配置，实现一键进入。

`cli/jsh/base.jsh`

```java
// import main
import cn.rectcircle.explore.springbootwithjshell.*

// import 组件
import cn.rectcircle.explore.springbootwithjshell.controller.*
import cn.rectcircle.explore.springbootwithjshell.dto.*
import cn.rectcircle.explore.springbootwithjshell.service.*
import cn.rectcircle.explore.springbootwithjshell.util.*

void help() {
    System.out.println();
    System.out.println("该脚本预执行了大量代码，导入了很多类，参见：");
    System.out.println("        cli/jsh/base.jsh");
    System.out.println("        cli/jsh/explore-spring-boot-with-jshell.jsh");
    System.out.println();
    System.out.println("同时，上下文中存在注入了 springContext: ApplicationContext 等变量");
    System.out.println();
    System.out.println("常见命令如下：");
    System.out.println("        /?  查看命令帮助");
    System.out.println("        /vars  查看定义变量");
    System.out.println("        /list  查看历史命令");
    System.out.println();
}
```

`cli/jsh/explore-spring-boot-with-jshell.jsh`

```java
// 启动 Spring App
ExploreSpringBootWithJshellApplication.main(new String[]{})

// 注入 spring 上下文
var springContext = SpringBeanUtils.getInstance()

// 打印帮助提示
help()
```

`cli/spring-jshell.sh`

```bash
#!/usr/bin/env bash

set -e

NEED_COMPILE="0"
SPRING_PROFILES_ACTIVE=${SPRING_PROFILES_ACTIVE:-"default"}
MODULE_NAME="explore-spring-boot-with-jshell"

while getopts ":cp:h" opt; do #不打印错误信息, -a -c需要参数 -b 不需要传参  
  case $opt in
    c)
      NEED_COMPILE="1"
      ;;
    p)
      SPRING_PROFILES_ACTIVE=$OPTARG
      ;;
    h)
      echo "Usage: ./cli/spring-jshell -c -p <spring.profiles.active>"
      echo "    Flag:"
      echo "          -c 是否重新编译"
      echo "          -h 显示帮助"
      echo "    Option:"
      echo "          -p 指定 Spring 激活的配置名，例如 dev"
      exit 0
      ;;
    :)
      exit 1
      ;;
    ?)
      echo "Invalid option: -$OPTARG"
      exit 1
      ;;
  esac
done

echo "Parameter: "
echo NEED_COMPILE=$NEED_COMPILE
echo SPRING_PROFILES_ACTIVE=$SPRING_PROFILES_ACTIVE
echo

if [ z"$NEED_COMPILE" = z"1" ]; then
    ./mvnw clean package -DskipTests
fi

BASE_JSH_PATH=$(pwd)/cli/jsh/base.jsh
MODULE_JSH_PATH=$(pwd)/cli/jsh/$MODULE_NAME.jsh

cd target

if [ ! -d "BOOT-INF" ]; then
    jar xf $MODULE_NAME-*.jar
fi

SPRING_PROFILES_ACTIVE=$SPRING_PROFILES_ACTIVE CLASSPATH="BOOT-INF/classes:BOOT-INF/lib/*" jshell $BASE_JSH_PATH $MODULE_JSH_PATH
```

使用上

```bash
# 查看帮助
./cli/spring-jshell.sh -h
# 编译并进入jshell
./cli/spring-jshell.sh -c
# 不编译直接进入jshell
./cli/spring-jshell.sh
```
