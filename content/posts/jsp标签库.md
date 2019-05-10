---
title: jsp标签库
date: 2016-11-16T11:27:50+08:00
draft: false
toc: true
comments: true
aliases:
  - /detail/20
  - /detail/20/
tags:
  - 后端
---

## 一、EL表达式

### 1、语法结构

```java
$(表达式)
```

### 2、变量

#### 内置变量对应关系：

* page pageScope
* request requestScope
* session sessionScope
* application applicationScope

#### 表单传递参数的封装的对象

```
param request.getParameter(String )
paramValues request.getParameterValues() //其实是一个数组
header
headerValues
cookie
initParam
pageContext
例 $(username) 在以上变量中从小到大搜索
		如果找不到返回null（经检验不显示）
```

### 3、操作符

```
.和[]
对内置对象访问用 “.”
自定义对象最好用["name"];
.：访问一个bean的属性或Map entry
[]：访问一个数组或链表元素
empty
funs(args)
```

## 二、JSTL标签库

### 0、包括：

```
Core <c:>
XML processing <x:>
I18N formatting <fmt:>
Database access <sql:>
Functions <fn:>
```

### 1、使用准备

下载jar包

### 2、Core标签库（核心标签库）

*	多用途：`<c:out> <c:set> <c:remove> <c:catch>`
*	条件控制：`<c:if> <c:choose> <c:when> <c:otherwise>`
*	循环控制标签：`<c:forEach> <c:forTokens>`
*	URL相关标签：`<c:import> <c:url> <c:redirect> <c:aram>`

#### (1) `<c:out>`

```java
	<c:out value="${param.id}" //输出的值
	 default="用户未输入"  //如果未找到输出的值
	 escapeXml="true"> //是否将特殊字符转换如" "转换为&nbsp;
</c:out>
```

#### (2)、`<c:set>`两组不能胡乱使用（重要）

```java
	第一组对bean对象或map设置
<c:set target="${userBean}" //必须是EL表达式选取bean对象或map对象
		 property="username" ///bean 的属性或 map的key
			value="这是用户名测试对be" />//值
	第二组对基本变量进行设置
<c:set value="这是对基本变量的设置"//值
		 var="oneStr"//变量名
		 scope="request"/>//范围
```

#### (3)、`<c:remove>`删除scope中的变量

```java
<c:remove var="oneStr" //变量名
 scope="page"/> //作用范围，可不写默认范围为全部搜索
```

#### (4)、`<c:catch var="err">`捕获异常标签

```
当出现异常时，err!=null
通过 ${err.message}可以查看异常信息
```

#### (5)、`<c:if test="${}">`//条件判断的EL表达式

```java
var="flag" //储存条件判断结果的
scope=""/> //var的作用范围
```

#### (6)、复杂的多路分支判断语句

```java
<c:choose>
	<c:when test="${}">
		//语句
	</c:when>
	<c:when test="${}">
		//语句
	</c:when>
	<c:otherwise>
		//语句
	</c:otherwise>
</c:choose>
```

#### (7)、用于循环的标签

```java
<c:forEach items="${}" //进行循环的集合
	 var="item"> //迭代的对象名

</c:forEach>

<c:forEach  var="i" //
	begin="1"
	end="5"
	step="1"
	varStatus="" //可选的显示循环状态的变量
	>

</c:forEach>
```

#### (8)、用于分割字符

```java
<c:forTokens items="a,b,c,d" //进行分割的EL表达式或常量
	delims="," //分隔符
	begin="0" //可选开始条件（从第？+1分割符开始分割）
	end="2" //可选结束条件（到底？+1个分隔符结束）
	step="1" //可选步长
	var="value" //可选将分割出的字符串储存在此变量中
	varStatus="" //可选
	>
	${value}
</c:forTokens>
```

#### (9)、包含

```
<c:import url="" //需要包含的jsp页面的url地址
	context=""  //上下文环境（目录）指定后 url 必须下 /
	charEncoding="" //字符集
	var="" //导入文本的变量
	scope="" //var的作用域
	vaeReader="" //接收文本的java.io.Reader对象
/>
```

#### (10)、`<c:url />` //自动调用url编码方便

#### (11)、`<c:redirect>	</c:redirect>` //客户端重定向

#### (12)、`<c:param name="" value="" />`

包含在<url>或<redirect>标签内用于穿参数

## 三、I18N标签库(略)

`<fmt: >`

## 四、xml processing 标签库

### 1、简介

#### 核心标签

```xml
<x:parse>
<x:out>
<x:set>
```

#### 流控制标签

```java
<x:if>
<x:choose>
<x:when>
<x:otherwise>
<x:forEach>
```

#### 转换标签

```java
<x:transform>
<x:param>
```

### 2、`<x:parse>`用于解析的标签

例：

```java
<c:import var="xmlFile" url=""/>
<x:parse varFileValue doc="${xmlFile}"/>
```

略

## 五、数据库在做标签

### 1、简介

```html
<sql:setDataSource>
<sql:query>
<sql:update>
<sql:transaction>
<sql:param>
<sql:dateParam>
```

### 2、

```java
<sql:setDataSource
	var="dataSrc"
	url="jdbc:………………"
	driver=""
	user=""
	password=""
/>
```

### 3、

```java
<sql:query
	var="queryResults"
	dataSourse="${dataSrc}"
	>
	select * from table1

</sql:query>

<c:forEach var="row" items="${queryResults.rows}">
	<tr>
		<td>${row.username}</td>
		<td>${row.password}</td>
	</tr>

</c:forEach>
```

### 4、

```java
<sql:update>
	update语句
</sql:update>
```

### 5、`<sql:param>`与`<sql:dateParam>`

相当于java sql的预处理?传参数
