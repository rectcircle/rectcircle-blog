---
title: jsp速查
date: 2016-11-16T10:57:17+08:00
draft: false
toc: false
comments: true
aliases:
  - /detail/17
  - /detail/17/
tags:
  - java
  - 后端
---

## 一、jsp简介
> jsp--java server page

jsp拥有servlet的优点：
* jsp就是servlet，当用户第一次访问jsp时，容器根据jsp生成.java并编译
* 只有当客户端第一次请求JSP时，才需要将其转换、编译
* 优良的性能优于CGI，PHP，ASP
* 平台无关性操作系统无关，Web服务器无关
* 可扩展性tag的扩展机制，简化页面开发


## 二、jsp编程--基本语法
### 1、概念
#### JSP传统语法
> Declaration
> Scriptlet
> Expression
> Comment
> Directives
> 	Action动作指令
	内置对象
JSTL
JSF


### 2、Scriptlet
```java
<%程序代码块%>
```
不能够定义方法


### 3、表达式
```java
<%=字符串格式%>
//等价于servlet的输出out.println()；
```


4、Declaration
<%! 全局代码区 %>
	等价于servlet的成员变量和成员函数
	尽量不要设计成员变量
	
	
5、Directives	编译指令
```
<%@Directive 属性='属性值' %>
常见的directive
	page：
	<%@page language="script language"| 所用语言默认java（不指定）
			extends="className"| 转换为servlet代码时所继承的父类（不指定）
			import="importList"| 引入的包
			buffer="none|kb size"|   --none:不缓冲，默认8k（不指定）
			session="true|false"|   --是否可以使用session，默认true（不指定）
			autoFlush="true|false"  --缓冲器是否自动清除，默认true
			isThreadSafe="true|false"|  --默认false(永远不要设成true)是否加线程锁
			info="infoText"|    --任何字符
			errorPage="errorPageUrl"| --如果出错转到指定.jsp处理
			isErrorPage="true|false"| --该页面是处理异常的页面，那么其就可以调用exception对象如：exception.getMessage();
			contentType="text/html;charset=utf-8"|	--设置字符集
			pageEncoding="gb2312"
	%>
	
	include:
	<%@include file="URL.jsp" %>
	--将url里面的内容拷贝到当前位置（静态包含编译期间包含，无法传参，字符集要相同且两边都要写）
	
	tarlib
```
	
### 6、action（动态指令--运行期的命令）
#### (1)动态包含：`<jsp:include page="URL.jsp" flush="true"/>`
```java
//包含与被包含的两个jsp产生两个对象，其内置对象也不同但是内容一样
//可以传参数 <jsp:include page="URL.jsp?user=1234" flush="true"/>
//或者：
<jsp:include page="URL.jsp" flush="true"/>
	<jsp:param name="参数名" value="<%=对象%>">
</jsp:include>
```
	
#### (2)转向
```java
	response.sendRedirect("url");//将url发还给客户端并转向"url"的地址
		/*
		注意：此语句下面的语句仍会执行，参数会丢失
		是不同的request
		send后的语句会继续执行，除非return
		速度慢
		需要到客户端的往返，可以转到任何页面
		可以传参数，直接写在url后面
		"URL"中:/代表域名，不加/代表当前文件路径
		*/
	
	<jsp:forward page="URL"/>
		/*浏览器地址栏不变
		虽然不是同一个request但是参数相同甚至更多
		forward后的语句不会继续发送给客户端
		速度快
		服务器内部转换，
		可以传参数
		"URL"中:/代表当前webapp的根路径，不加/代表当前文件路径
*/
```

### 7、使用javaBean重要（面向对象的编程）
```
jsp:useBean 的参数及含义
	id:对象实例名称
	scope:Bean对象作用的范围，默认为page，对整个jsp页面有效
	class:Bean类名称(全名）
	type:Bean实例类型，可以是本类，或其父类，或实现的接口，默认为本类
```

#### 例子0、bean的测试代码
```java
package bean;
import java.io.Serializable;
public class CounterBean implements java.io.Serializable
{
  int count = 0;
  public CounterBean()  { }
  public int getCount() { count++; return count; }
  public void setCount(int c) { count=c; }
}
```



#### 例子1、scope="request"
```java
<jsp:useBean id="cb" class="带包名的类名">
</jsp:useBean>
//等价于 带包名的类名 cd = new 带包名的类名();
<jsp:setProperty name="cd" property="成员变量" value="值"/>
//等价于cb.set成员变量(值);
<jsp:getProperty name="cd" property="成员变量"/>
//等价于out.print(cd.get成员变量());
```

	
#### 例子2、`scope="request"`（（本例与以下例子）上下两段代码等价，在`<jsp:forward page="RequestBean2.jsp" />`的转向可以访问javabean）
```java
<jsp:useBean id="counterBean"
             scope="request"
             class="bean.CounterBean" />
<%--
<%
	bean.CounterBean counterBean = (bean.CounterBean)request.getAttribute("counterBean");
	if(counterBean == null) {
		counterBean = new bean.CounterBean();
		request.setAttribute("counterBean", counterBean);
	}
%>
--%>
```
	
#### 例子3、`scope="session"`
```java
<jsp:useBean id="counterBean"
             scope="session"
             class="bean.CounterBean" />
<%--
<%
bean.CounterBean counterBean = (bean.CounterBean)session.getAttribute("counterBean");
if(counterBean == null) {
	counterBean = new bean.CounterBean();
	session.setAttribute("counterBean", counterBean);
}
%>
--%>
```

#### 例子4、`scope="application"`
```java
<%--
<jsp:useBean id="counterBean"
             scope="application"
             class="bean.CounterBean" />    
--%>
 
<%
bean.CounterBean counterBean = (bean.CounterBean)application.getAttribute("counterBean");
if(counterBean == null) {
	counterBean = new bean.CounterBean();
	application.setAttribute("counterBean", counterBean);
}
%>
```

#### 例子5、传参
```java
<jsp:setProperty
 name="cd"
 property="成员变量"
 value="<%=request.getParameter("参数名")%>"/>
等价于
<jsp:setProperty
	name="javabean对象名或id"
	Property="成员变量名"
	param="用户请求的参数"/>
	
或者（用户传递的参数名必须与对象的成员属性一直才能一次性设置参数）
<jsp:useBean id="对象名" class="类全名" scope="request" >
	<jsp:setProperty
		name="javabean对象名或id"
		Property="*"
	/>
</jsp:useBean>
```

	
#### 例子6、获得参数
```java
<jsp:getProperty name="对象名" property="成员变量名"/>
```
	


### 7、内置对象
> out（打印输出）
> request（请求）
> response（响应）

### 8、注释
```
html注释<!-- -->
	注意<!-- <%代码%>-->代码会被执行；
jsp注释<%-- --%>
java注释
	//
	/**/
	/***/
```
