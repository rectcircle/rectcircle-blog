---
title: Java远程方法调用
date: 2018-03-29T21:19:38+08:00
draft: false
toc: false
comments: true
aliases:
  - /detail/132
  - /detail/132/
tags:
  - 分布式
---

## 目录
* [一、HelloWord](#一、HelloWord)
	* [1、代码目录结构](#1、代码目录结构)
	* [2、远程方法接口](#2、远程方法接口)
	* [3、服务端接口的实现和服务器的搭建](#3、服务端接口的实现和服务器的搭建)
	* [4、客户端的搭建](#4、客户端的搭建)
	* [5、编译HelloWorld](#5、编译HelloWorld)
	* [6、运行测试HelloWorld](#6、运行测试HelloWorld)
	* [7、另一种方式注册表单独运行](#7、另一种方式注册表单独运行)
* [二、相关类和接口](#二、相关类和接口)
	* [1、Remote](#1、Remote)
	* [2、Naming](#2、Naming)
	* [3、UnicastRemoteObject](#3、UnicastRemoteObject)




## 一、HelloWord
**************************************
### 1、代码目录结构
```
.
├── client
│   └── HelloClient.java
├── server
│   ├── HelloImpl.java
│   └── HelloServer.java
└── service
    └── Hello.java
```

### 2、远程方法接口
远程方法调用的接口，继承Remote标记接口。客户端服务端都应该加载此接口。
在此接口定义需要的方法
`service/Hello.java`
```java
package service;

import java.rmi.Remote;  
import java.rmi.RemoteException;  
  
public interface Hello extends Remote {  
    public String sayHello(String name) throws RemoteException;  
}
```

### 3、服务端接口的实现和服务器的搭建
服务端对远程方法调用的接口的实现类（此类仅需要服务端加载）
`server/HelloImpl.java`
```java
package server;

import java.rmi.RemoteException;  
import java.rmi.server.UnicastRemoteObject;  
import service.Hello;
  
public class HelloImpl extends UnicastRemoteObject implements Hello {  
    private static final long serialVersionUID = -271947229644133464L;  
  
    public HelloImpl() throws RemoteException{  
        super();  
    }  
  
    public String sayHello(String name) throws RemoteException {  
        return "Hello,"+name;  
    }  
}
```

服务器的实现（对远程方法对象的注册）
`server/HelloServer.java`
```java
package server;

import java.rmi.Naming;  
import java.rmi.registry.LocateRegistry;  

import service.Hello;  

public class HelloServer {  
    public static void main(String[] args) {  
        try{  
            Hello h = new HelloImpl();  
              
            //创建并导出接受指定port请求的本地主机上的Registry实例。  
            LocateRegistry.createRegistry(12312);  
              
            /** Naming 类提供在对象注册表中存储和获得远程对远程对象引用的方法 
             *  Naming 类的每个方法都可将某个名称作为其一个参数， 
             *  该名称是使用以下形式的 URL 格式（没有 scheme 组件）的 java.lang.String: 
             *  //host:port/name 
             *  host：注册表所在的主机（远程或本地)，省略则默认为本地主机 
             *  port：是注册表接受调用的端口号，省略则默认为1099，RMI注册表registry使用的著名端口 
             *  name：是未经注册表解释的简单字符串 
             */  
            //Naming.bind("//host:port/name", h);  
            Naming.bind("rmi://localhost:12312/Hello", h);  
            System.out.println("HelloServer启动成功");  
        }catch(Exception e){  
            e.printStackTrace();  
        }  
    }  
}  
```

### 4、客户端的搭建
`client/Client.java`
```java
package client;

import java.net.MalformedURLException;  
import java.rmi.Naming;  
import java.rmi.NotBoundException;  
import java.rmi.RemoteException;
import service.Hello;
  
public class HelloClient {  
    public static void main(String[] args) {  
        try {  
            Hello h = (Hello)Naming.lookup("rmi://localhost:12312/Hello");  
            System.out.println(h.sayHello("zx"));  
        } catch (MalformedURLException e) {  
            System.out.println("url格式异常");  
        } catch (RemoteException e) {  
            System.out.println("创建对象异常");  
            e.printStackTrace();  
        } catch (NotBoundException e) {  
            System.out.println("对象未绑定");  
        }  
    }  
}  
```

### 5、编译HelloWorld
```bash
#进入项目目录
javac ./*/*.java 
```

### 6、运行测试HelloWorld
打开另个终端，在一个终端上启动服务器
```bash
java server.HelloServer
```
在另一个终端启动服务端
```bash
java client.HelloClient
```


### 7、另一种方式注册表单独运行
以上代码`server/HelloServer.java`中，LocateRegistry.createRegistry(12312); 是创建并运行注册表程序。还有另一种方式，让注册表程序独立运行

添加文件`server/HelloServer2.java`如下
```java
package server;

import java.rmi.Naming;  
import java.rmi.registry.LocateRegistry;  

import service.Hello;  

public class HelloServer2 {  
    public static void main(String[] args) {  
        try{  
            Hello h = new HelloImpl();  
              
            //创建并导出接受指定port请求的本地主机上的Registry实例。  
            //LocateRegistry.createRegistry(12312);  
              
            /** Naming 类提供在对象注册表中存储和获得远程对远程对象引用的方法 
             *  Naming 类的每个方法都可将某个名称作为其一个参数， 
             *  该名称是使用以下形式的 URL 格式（没有 scheme 组件）的 java.lang.String: 
             *  //host:port/name 
             *  host：注册表所在的主机（远程或本地)，省略则默认为本地主机 
             *  port：是注册表接受调用的端口号，省略则默认为1099，RMI注册表registry使用的著名端口 
             *  name：是未经注册表解释的简单字符串 
             */  
            //Naming.bind("//host:port/name", h);  
            Naming.bind("rmi://localhost:12312/Hello", h);  
            System.out.println("HelloServer启动成功");  
        }catch(Exception e){  
            e.printStackTrace();  
        }  
    }  
}  
```

编译
```bash
javac server/HelloServer2.java
```

运行服务端注册表程序（必须先执行，而且不能关闭）
```bash
rmiregistry 12312
```

运行服务端程序
```bash
java server.HelloServer2
```
运行客户端程序
```bash
java client.HelloClient
```

## 二、相关类和接口
******************************
### 1、Remote
`java.rmi.Remote`

一个标记接口，所有远程方法接口必须继承自此接口


### 2、Naming
`java.rmi.Naming`

#### （1）常用方法
* `static void	bind(String name, Remote obj) ` 将指定 name 绑定到远程对象。
* `static String[]	list(String name) ` 返回在注册表中绑定的名称所组成的数组。
* `static Remote	lookup(String name) ` 返回与指定 name 关联的远程对象的引用（一个 stub）。
* `static void	rebind(String name, Remote obj) ` 将指定名称重新绑定到一个新的远程对象。
* `static void	unbind(String name) ` 销毁与远程对象关联的指定名称的绑定。


### 3、UnicastRemoteObject
服务器端实现远程方法接口必须继承此方法


