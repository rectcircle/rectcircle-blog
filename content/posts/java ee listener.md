---
title: java ee listener
date: 2016-11-16T11:11:48+08:00
draft: false
toc: false
comments: true
aliases:
  - /detail/19
  - /detail/19/
tags:
  - 后端
---

## 一、监听器
### 1、定义
监听web对象的创建与销毁和其与对象属性发生修改的事件

### 2、作用
* 统计在线人数和在线用户
* 系统启动时加载初始化信息
* 统计网站访问量
* 和Spring结合
	
### 3、创建步骤
*	创建实现了监听器接口的类 
*	配置web.xml进行注册
		
(1)	创建一个类实现ServletContextListener接口
(2) web.xml配置
```xml
<listener>
	<listener-class>类全名</listener-class>
</listener>
```

### 4、监听器分类
按照监听对象划分：
#### (1)用于监听app环境对象(ServletContext)
获得web.xml中的参数信息并放入ServletContext对象中
web.xml写：
```xml
<context-param>
	<param-name>key</param-name>
	<param-value>value</param-value>
</context-param>
```
listener类写
```java
	servletcontextevent.getServletContext().getInitparameter("key");
	servletcontextevent.getServletContext().setAttribute("","");
```
### (2)用于监听用户会话的对象(HttpSession)
统计在线人数
在web.xml中可以配置session超时时间
```java
<session-config>
	<sessin-timeout>数字单位min</sessin-timeout><!--0表示直接删除 -->
</session-config>
```
记录访问日志

### (3)用于监听请求消息对象(ServletRequest)
记录日志

按照监听事件划分：
*	监听域对象自身的创建和销毁
*	监听域对象中的属性的增加与删除(attribute)
	*		实现ServletRequestAttributeListener等
*	监听绑定到HttpSession域中的某个对象的状态
*		解决高访问量的对象  
	*			session钝化：将session序列化
	*			session活化：将session从序列化中恢复 
*		某个实体对象实现HttpSessionBindingListener接口，在绑定和解除绑定将触发方法：绑定解除绑定
*		某个实体对象实现HttpSessionActivationListener接口：钝化活化（必须实现序列化接口）
*		不需要再web.xml注册
		
## 二、webapp启动创建顺序
> 优先级：
> >	监听器 > 过滤器 > Servlet 

## 三、Servlet3.0前提
* 使用Servlet3.0新jar
* jdk>=1.6
* 编译级别6.0
* web.xml使用3.0
* 使用支持Servlet3.0特性的web容器，如tomcat7

## 四、Servlet3.0 listener注解
```java
@WebListener 必须实现接口（无法定义监听器的顺序）
```

