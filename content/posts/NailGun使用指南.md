---
title: NailGun使用指南
date: 2018-08-03T10:04:57+08:00
draft: false
toc: false
comments: true
aliases:
  - /detail/161
  - /detail/161/
tags:
  - java
---

> 参考
> [github](https://github.com/facebook/nailgun)
> [官网](http://martiansoftware.com/nailgun/)
> [博客1](https://blog.csdn.net/taozhi8833998/article/details/38089543)
> [测试代码](https://github.com/rectcircle/nailgun-learn)


## 目录
* [1、NailGun简介](#1、NailGun简介)
* [2、客户端安装](#2、客户端安装)
* [3、服务端嵌入应用程序](#3、服务端嵌入应用程序)
* [4、服务端独立使用](#4、服务端独立使用)
* [5、服务端参数](#5、服务端参数)
* [6、客户端参数](#6、客户端参数)
* [7、Nails](#7、Nails)





### 1、NailGun简介
NailGun的功能主要是解决Java程序在启动过程中的JVM启动开销。

Java程序主要运行在虚拟机中，虚拟机的启动需要花费大量时间和占用大量资源。所以如果一些非周期的Java程序需要频繁启动，而且主要逻辑不复杂，如果使用`java`命令启动，那么系统的资源利用率将极低（大部分资源都消耗在启动和回收JVM中了）。因此，很少Linux命令或脚本是用Java写的。

NailGun就是为了解决这个问题。NailGun主要分为客户端和服务端。服务端就是一个Java程序（jar），会长时间运行在后台。客户端是一个C命令行程序，接收的参数为要运行的Java类的类名和其他参数。两者主要通过网络通信。工作流程如下
* 启动服务端，并使用-cp指定你所写的Java程序所在的classpath
* 启动客户端，指定你所写的Java程序的主类和参数
* 服务端接收到信息，通过反射运行指定的主类，并将输入和输出重定向到网络流
* 客户端输入和输出
* 这样，通过客户端运行Java程序就可以像普通`java`命令一样运行，但是没有JVM启动销毁的开销


**NailGun的优点**
* 程序启动快，没有JVM启动销毁开销
* 可以远程调用，看起来就像本机运行一样

**NailGun的缺点**
* Java程序的更新，不会生效，必须重启服务端
* 因为多个程序运行在同一个JVM中，所以可能出现并发问题（静态变量会出现问题）


### 2、客户端安装
#### （1）Linux Ubuntu安装
```bash
sudo apt-get install nailgun
```

在Linux客户端和服务端，都会安装完毕
```bash
# 查看安装位置
dpkg -L nailgun
```

运行
```bahs
ng-nailgun
```


#### （2）windows安装
* 前往[Github](https://github.com/facebook/nailgun)下载源码
* 下载安装[Cygwin](https://www.cygwin.com/)
* 安装完成后将其bin目录加入环境变量，注意cygwin可能与git for windows冲突
* 打开Cygwin64 Terminal进入源码根目录
* 执行`make`将会创建可执行文件`ng.exe`
* 使用cmd运行ng.exe输出使用指南即成功


### 3、服务端嵌入应用程序
#### （1）创建项目
创建maven项目最好

#### （2）创建测试主类
```java
package cn.rectcircle.nailgunlearn;

public class App {
    public static void main( String[] args ) {
        System.out.println( "Hello World!" );
    }
}
```

#### （3）引入依赖
maven仓库的版本是0.9.1，尽量使用与客户端一致的版本
```xml
    <!-- https://mvnrepository.com/artifact/com.martiansoftware/nailgun-server -->
      <dependency>
        <groupId>com.martiansoftware</groupId>
        <artifactId>nailgun-server</artifactId>
        <version>0.9.1</version>
      </dependency>
```


如果是更新版本，要从源码编译，并安装到本地仓库
前往[Github](https://github.com/facebook/nailgun)下载源码
编译
```bash
# 进入源码目录
# 编译安装
mvn clean install
```
进入`nailgun-server/pom.xml`查看版本号

```xml
    <dependency>
      <groupId>com.martiansoftware</groupId>
      <artifactId>nailgun-server</artifactId>
      <version>0.9.3-SNAPSHOT</version>
		</dependency>
```


#### （4）编译插件
```xml
  <build>
    <plugins>
      <plugin>
        <groupId>org.apache.maven.plugins</groupId>
        <artifactId>maven-assembly-plugin</artifactId>
        <version>2.5.5</version>
        <configuration>
          <archive>
            <manifest>
              <mainClass>com.martiansoftware.nailgun.NGServer</mainClass>
            </manifest>
          </archive>
          <descriptorRefs>
            <descriptorRef>jar-with-dependencies</descriptorRef>
          </descriptorRefs>
        </configuration>
        <executions>
          <execution>
            <id>make-assembly</id>
            <phase>package</phase>
            <goals>
              <goal>single</goal>
            </goals>
          </execution>
        </executions>
      </plugin>
    </plugins>
  </build>
```

以上插件将生成一个可运行的jar并包含所有依赖

#### （5）运行服务端

```bash
java -jar target/nailgun-learn-1.0-SNAPSHOT-jar-with-dependencies.jar

# 输出
# NGServer 0.9.3-SNAPSHOT started on all addresses, port 2113.
```

#### （6）运行客户端
```bash
ng.exe cn.rectcircle.nailgunlearn.App
# 输出
# Hello World!
```

#### （7）缺点
* 添加新的程序都要重启服务端


### 4、服务端独立使用
#### （1）编译生成服务端的jar
**windows需要编译**

前往[Github](https://github.com/facebook/nailgun)下载源码
编译
```bash
# 进入源码目录
# 编译安装
mvn clean package
```
进入`nailgun-server/target`，nailgun-server-0.9.3-SNAPSHOT.jar就是编译好的服务端


Linux安装之后直接jar已放入相关目录`/usr/share/java/nailgun-server.jar`


#### （2）运行服务端
**直接使用`-jar`运行**
这种方式需要通过客户端来配置环境变量，否者将找不到类异常
```bash
java -jar target/nailgun-server-0.9.3-SNAPSHOT.jar
```

**同时指定环境变量**
```bash
java -cp ".;target/nailgun-server-0.9.3-SNAPSHOT.jar" com.martiansoftware.nailgun.NGServer
```


#### （3）编写程序
这是简单起见写单文件

**程序1**
```java

public class App1{
	public static void main(String [] args){
		System.out.println("App1");
	}
}
```

**程序2**
```java

public class App2 {
	public static void main(String[] args) {
		System.out.println("App2");
	}
}
```

#### （4）编译程序

javac App1.java App2.java

#### （5）运行客户端
```bash
# 注意：编译后的文件必须在nailgun-server的classpath之下，否者将抛异常
# 两种方式
# 1、使用ng ng-cp 配置classpath，见下面
# 2、使用java启动nailgun-server时就指定classpath
ng.exe App1
ng.exe App2
```


### 5、服务端参数
```bash
Usage: java com.martiansoftware.nailgun.NGServer
   or: java com.martiansoftware.nailgun.NGServer port
   or: java com.martiansoftware.nailgun.NGServer IPAddress
   or: java com.martiansoftware.nailgun.NGServer IPAddress:port
   or: java com.martiansoftware.nailgun.NGServer IPAddress:port timeout
```



### 6、客户端参数

```
Usage: ng 全类名 [--nailgun-options] [args]
          (执行一个带有main函数的类)
   or: ng alias [--nailgun-options] [args]
          (to execute an aliased class)
   or: alias [--nailgun-options] [args]
          (to execute an aliased class, where "alias"
           is both the alias for the class and a symbolic
           link to the ng client)

where options include:
   --nailgun-D<name>=<value>   set/override a client environment variable
   --nailgun-version           print product version and exit
   --nailgun-showversion       print product version and continue
   --nailgun-server            to specify the address of the nailgun server
                               (default is NAILGUN_SERVER environment variable
                               if set, otherwise localhost)
   --nailgun-port              to specify the port of the nailgun server
                               (default is NAILGUN_PORT environment variable
                               if set, otherwise 2113)
   --nailgun-filearg FILE      places the entire contents of FILE into the
                               next argument, which is interpreted as a string
                               using the server's default character set.  May
be
                               specified more than once.
   --nailgun-help              print this message and exit
```


### 7、Nails
NailGun提供类似插件的东西。可以通过客户端调用
#### （1） ng-alias 别名
为要运行的类起一个别名
```bash
# 查看所有别名
ng ng-alias

# 设置别名
ng ng-alias 别名 全名
```

#### （2） ng-cp 指定classpath
注意：java9、10将抛异常

运行时指定classpath
```bash
# 将服务端运行路径设置为环境变量（原理是调用类加载器加载）
ng ng-cp .
```

#### （3）停止服务端
```bash
ng ng-stop
```

#### （4）其他参见官网


