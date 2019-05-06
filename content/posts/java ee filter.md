---
title: java ee filter
date: 2016-11-16T11:05:07+08:00
draft: false
toc: false
comments: true
aliases:
  - /detail/18
  - /detail/18/
tags:
  - 后端
---

## 一、过滤器生命周期
> 实例化 —— Web.xml
> 初始化 —— init()
> 过滤	 —— doFilter()
> 销毁	 —— destroy()

## 二、实现
#### 新建java类实现 javax.servlet.Filter接口
```java
@Override 
public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) throws IOException, ServletException { 
	//处理请求逻辑
	HttpServletRequest req = (HttpServletRequest) request; 
	HttpServletResponse res = (HttpServletResponse) response; 
	HttpSession session = req.getSession(); 
	if (session.getAttribute("admin") == null) { 
		res.sendRedirect(req.getContextPath() + url);
		return ; 
	} 
	chain.doFilter(request, response); //执行下一个过滤器放行
	//处理响应的业务逻辑 
} 
```

#### 配置web.xml
```xml
<filter>
	<filter-name>Filter的名字</filter-name>
	<filter-name>Filter的类全名</filter-name>
	<!-- 以下可有多对 -->
	<init-param>
		<description>Filter的描述信息</description>
		<param-name>参数名称</param-name>
		<param-value>参数值</param-value>
	</init-param>
</filter>
	
<!-- 可设置一对或多对 -->
<filter-mapping>
	<filter-name>filter的名字</filter-name>
	<!-- 可设置零对或多对 -->
	<url-pattern>指定匹配过滤的url</url-pattern><!-- *代表通配符过滤所有请求 /* -->
	<!-- 可设置零对或多对 -->
	<dispatcher></dispatcher> <!-- 不配置默认为REQUEST 可选include、forward、error -->

</filter-mapping>
```

## 三、应用
*	登录验证
	*	在filter检查session验证是否登录，
	*	使用init-param参数配置放行规则，在init()存到成员变量中，
*		在doFilter()中检验放行规则
*	编码转换
*	数据过滤（sql防注入）
*	图像转码
*	响应压缩
*	加密解密
	
	
## 四、过滤器链
略

## 五、过滤器分类
#### 概念：
> 重定向（改变url地址通过浏览器对新URL地址重新发起请求改变页面）：
> * response.sendRedirect(request.getContextPath()+"/main.jsp");
> 
> 转发（服务器内部转发浏览器url不变）
> * request.getRequestDispatcher("本服务器内部url").forward(request,response);


### 1、Request：用户直接访问页面时，web容器将会调用过滤器
过滤request的请求
	
### 2、Forword：
	过滤.forward(request,response);的请求
	
### 3、include：
	过滤include方法的请求
	
### 4、error
可以在web.xml中配置：
```xml
<error-page>
	<error-code>404</error-code>
	<location>/error.jsp</location>
</error-page>
```
当访问出错时过滤,一般用于记录错误日志
	
### 5、async(servlet3.0-javaee6.0)
当后台处理长时间业务时允许异步执行后面的操作
servlet异步处理事务
web.xml 配置
```xml
<servlet>
	<description>This is the description of my J2EE component</description>
	<display-name>This is the display name of my J2EE component</display-name>
	<servlet-name>AsynServlet</servlet-name>
	<servlet-class>com.imooc.servlet.AsynServlet</servlet-class>
			<async-supported>true</async-supported>
</servlet>

<servlet-mapping>
	<servlet-name>AsynServlet</servlet-name>
	<url-pattern>/servlet/AsynServlet</url-pattern>
</servlet-mapping>	
```
代码：
```java
package com.imooc.servlet;

import java.io.IOException;
import java.io.PrintWriter;
import java.util.Date;

import javax.servlet.AsyncContext;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

public class AsynServlet extends HttpServlet {


	public void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {

		System.out.println("Servlet执行开始时间:"+new Date());
		AsyncContext context =  request.startAsync();
		new Thread(new Executor(context)).start();
		System.out.println("Servlet执行结束时间:"+new Date());
	}

	public class Executor implements Runnable{
		private AsyncContext context;
		public Executor(AsyncContext context ) {
			this.context = context;
		}

		@Override
		public void run() {
			//执行相关复杂业务
			try {
				Thread.sleep(1000*10);
//				context.getRequest();
//				context.getResponse();
				System.out.println("业务执行完成时间:"+new Date());
			} catch (InterruptedException e) {
				e.printStackTrace();
			}

		}

	}

	public void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {

		response.setContentType("text/html");
		PrintWriter out = response.getWriter();
		out.println("<!DOCTYPE HTML PUBLIC \"-//W3C//DTD HTML 4.01 Transitional//EN\">");
		out.println("<HTML>");
		out.println("  <HEAD><TITLE>A Servlet</TITLE></HEAD>");
		out.println("  <BODY>");
		out.print("    This is ");
		out.print(this.getClass());
		out.println(", using the POST method");
		out.println("  </BODY>");
		out.println("</HTML>");
		out.flush();
		out.close();
	}

	public void init() throws ServletException {
		// Put your code here
	}

}
```
		
filter代码
```java
package com.imooc.filter;

import java.io.IOException;

import javax.servlet.DispatcherType;
import javax.servlet.Filter;
import javax.servlet.FilterChain;
import javax.servlet.FilterConfig;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.annotation.WebFilter;
@WebFilter(filterName="AsynFilter",asyncSupported=true,value={"/servlet/AsynServlet"},dispatcherTypes={DispatcherType.REQUEST,DispatcherType.ASYNC})
public class AsynFilter implements Filter {

	@Override
	public void destroy() {

	}

	@Override
	public void doFilter(ServletRequest arg0, ServletResponse arg1, FilterChain arg2) throws IOException, ServletException {
		System.out.println("start.....AsynFilter");
		arg2.doFilter(arg0, arg1);
		System.out.println("end.....AsynFilter");
	}

	@Override
	public void init(FilterConfig arg0) throws ServletException {

	}

}
```
			
六、注解配置(servlet3.0-javaee6.0)
```java
	@WebFilter(filterName="实例名",value={"过滤的路径"},dispatcherTypes={DispatcherType.过滤类型1,DispatcherType.过滤类型2})
	@WebServlet() //servlet 配置注解
```
