---
title: servlet速查
date: 2016-11-16T10:27:26+08:00
draft: false
toc: false
comments: true
aliases:
  - /detail/16
  - /detail/16/
tags:
  - java
  - 后端
---

## 一、http协议基础
1、特点
*	全称超文本传输协议
* 以明文方式发送数据（不安全）
	
## 二、web application的概念
文件层次
>	WEB-INF
> >	web.xml//web app的配置文件
>	> lib //web app用到的库文件
>	> classes //存放编译好的servlet
	
## 三、servlet的接口/类的层次结构
```
				servlet（接口）
						|
			genericServlet（类）
						|
				httpservlet（类）
			   |			|
	doGet（方法）		doPost（方法）……
```
	
## 四、第一个servlet程序
1. 新建一个java项目
2. 在项目属性->构建路径加上容器的servlet-api.jar
3. 将类继承 HttpServlet 类并重写方法
4. 将编译好的文件加入classes目录
5. 在web.xml中加入 `<servlet>` 和 `<servlet-mapping>` 标签

	
## 五、注意问题
### 1、路径问题
> 绝对路径
> web.xml中 / 代表项目根目录
> index.html / 代表域名的根目录
> 相对路径（不以/开头）
> 当前路径下寻找

### 2、地址大小写问题：
tomcat区分大小写
	
3、doGet调用doPost或反过来

### 4、中文乱码问题（重要）
```java
response.setContentType("text/html;charset=gbk");//放在得到输出流之前
request.setCharacterEncoding("gbk");//post专用，放在取参数之前
get乱码：server.xml 在 <Connector> 添加:URIEncoding="GBK"
```

### 5、建立包手动建立对应包的文件夹，修改web.xml 


## 六、servlet生命周期
1. 只有一个servlet对象（単例）
2. 过程
	* 加载
	* new（当客户端第一次请求，一次）
	* 初始化init(servletConfig) （只调一次）
	* 处理请求以多线程线程调用对象
	* 退出服务destroy()
	
	
## 七、servlet接口方法之init(servletConfig);
> genericServlet重载了函数init(servletConfig),写了一个空的init()
> 方法目的是方便程序员重写init()；更好的封装了servlentConfing;
> 让框架更加稳定
	
	
## 八、request对象
### 1、得到表单数据
```java
//方法一、
req.getParameter("username")//根据标签名获得标签值
//方法二、
Enumeration paramNames=request.getParameterName();
while(paramNames.hasMoreElements()){
	String paramName=(String) paramNames.nextElement();
	String[] paramValues=request.getParameterValues(paramName);
	if(paramValues.length==1){}
	else {
		for (int i=0; i<paramValues; i++) {

		}
	}
}
//方法三、相同参数名用新的方法
Map<String,String[]> paramMap=request.getParameterMap();
Set<Map.Entry<String,String[]>> entries=paramMap.entrySet();
for(Iterator<Map.Entry<String,String[]>> it=entries.iterator);it.hasNext();){
	Map.Entry<String,String[]> entry = it.next();
	String paramName = entry.getKey();
	String[] paraNameValues = entry.getValue();
	//......其他操作
}
```
	
### 2、其他方法
```java
//获得客户端正在访问的url地址：
request.getRequestURL().toString();
```
	
	
## 九、cookies对象
### 1、特点：
> 只能是文本内容
> 客户端可以阻止服务器写入
> 只能拿自己的webapp写入的东西
> 一个servlet/jsp设置的cookies能够被同一个路径下面或者自路径下的servlet/jsp读到
> > 分类：
> > 属于窗口/子窗口（放在内存中）
> >	属于文本


### 2、实现
```java
写入客户端
Cookie cookie = new Cookie(key,value);
//cookie.setMaxAge(int)//设置生命周期单位秒，不设置窗口关闭cookies消失
respose.addCookie(cookie);
读取信息
Cookie[] cookies=request.getCookies();
cookies[0].getName();
cookies[0].getValue();
```
	
	
## 十、session对象（信息储存在服务端）
### 1、特点
*	服务器的一块内存
*	和客户端的窗口（子窗口）对应（独一无二）
*	客户端和服务器有对应的sessionid
*	客户端向服务器发送sessionid两种方式
	* cookie
	* 重写 URL
*	如果浏览器禁用cookie，那么基于cookie的session将失效
*	如果想安全的使用session那么只能使用url重写

### 2、实现
```java
//true如果找不到此客户端对应的session对象就创建一个
HttpSession session = request.getSession(true);
T o = (T)session.getAttribute("key");//取内容，如果没有返回null
if (o == null) {
	//…………
} else {
	//…………
}
session.setAttribute(Object);
```

### 3、session的方法
```java
boolean session.isNew();//返回是否新的
session.getId();//获得session的id号
session.getCreationTime();//获得创建时间
session.getLastAccessedTime();//获得最后一次访问时间
```

### 4、request中关于session的方法
```java
request.getRequestedSessionId();//获得客户端的 session id 号
request.isRequestedSessionIdFromCookie();//客户端的session id是否是从cookie取出的
request.isRequestedSessionIdFromURL());//客户端的session id是否是从url取出的
request.isRequestedSessionIdValid());//客户端的session id是否合法
```
	
### 5、url重写
```java
"<a href=" + response.encodeURL(request.getRequestURL().toString()) + ">test</a>" ;//基于session编程防止cookie禁用，用于超链接生成	
```
### 6、session失效时间配置
> web.xml 搜索session 默认30分钟
	
	
## 十一、application（ServletContext）概念同一个webapp都可以访问
```java
//context：上下文就是使用这个类的类
ServletContext application = this.getServletContext();
Integer accessCount = application.getAttribute("acsessCount");
if (accessCount == null) {
		accessCount = new Integer(0);
	} else {
		accessCount = new Integer(accessCount.intValue() + 1);
	}
	application.setAttribute("accessCount", accessCount);
```

	
## 十二、servlet连接mysql服务器
> 	注意要将第三方的库加入到\webapps\my\WEB-INF\lib下
> 	或lib下

## 十三、servlet使用javabean
### 1、javabean概念
* 广义javabean = 普通java类
* 狭义javabean = 符合Sun JavaBean标准的类
* 在Servlet中使用Bean和在通常程序中使用Bean类似
	* 	属性名称第一个字母必须小写，一般private，比如：private productId
	* 	一般具有getters and setters
	* 	要具有一个参数为空的构造方法
	* 	但Bean不应具有GUI表现
	* 	一般是用来实现某一业务逻辑或取得特定结果
	
	
## 十四、Filter与listener（略）


	

