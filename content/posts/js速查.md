---
title: js速查
date: 2016-11-14T23:09:03+08:00
draft: false
toc: false
comments: true
aliases:
  - /detail/12
  - /detail/12/
tags:
  - 前端
---

## 一、如何在网页中加入JavaScript代码
#### 1、在网页的任何标签内加入标签

```js
<script type="text/javascript">
</script>
```

#### 2、指向js文件
```js
<script language="javascript" src="url.js">
</script>
```
	
#### 3、函数定义出现在head里，操作语句出现在body里面

## 二、调试

## 三、语法

#### 1、输出文本
```js
document.write("");
	
```
#### 2、变量（js是弱类型的语言）
定义：
	var 变量名;
	或不定义
	
规则：
	区分大小写
	
数组定义：

```js
var arr = new Array(3);
arr[0]=1;
arr[1]=2;
arr[2]=3;
arr[3]=4;
arr[3]是有效的

```
	
#### 3、运算符略

#### 4、字符串链接同java

#### 5、字符串截断
```js
str.substring(3,9);
```

#### 6、程序流程控制
```js
?:
if-else
while
switch
for (i = X; i < arr.length; i++) {
}
```

	
#### 7、日期函数
```js
var today = new Date();获得当前日期
var hour = today.getHours();
```
	
#### 8、函数
```js
function funcName (params) {
		return ...;
	}
```
	
#### 9、获得标签的值：
```js
document.标签name.value;
```
#### 10、表单（form）对象的方法
```js
document.表单名.submit();
```
	
## 四、JavaScript的事件处理
### 0、如何添加
```
在标签中 事件名做属性="javascript:函数名"
在标签中 事件名做属性="js语句"
```
	
#### 1、得到焦点
	`onfocus`
	
#### 2、失去焦点
	`onblur`

#### 3、值被改变而失去焦点
	`onchange`

#### 4、单击事件
	`onclick`

#### 5、加载事件
	`onload`

#### 6、退出事件
	`onunload`

#### 7、鼠标移动到对象事件
	`onmouseover`

#### 8、鼠标移出对象
	`onmouseout`

#### 9、form被选中是的事件
	`onselect`

#### 10、用户提交表单是事件
	`onsubmit`



## 五、JavaScript的对话框
```
	警告框alert
	询问框prompt	返回输入的值
	确认框confirm	返回true/false
```
	
	
## 六、JavaScript的内置对象
#### 1、`this`对象代表当前标签

#### 2、`for...in`
```js
//in后面接一个对象，对此对象中的所有元素循环一次
var a = Array("adv1","bgb","vaf","efb");
for(eee in a)
{
	document.write(a[eee]+"<br>");
}
//eee是属性的名字
```

	
#### 3、`with` 不推荐使用
```js
with(对象名)
	{
		//如果不写对象名直接写方法默认对 “对象名” 进行调用
	}
	with(document)
	{
		write("");
	}
```
	
#### 4、new


## 七、窗口中的对象和元素
#### 1、	window当前窗口
设定状态栏的文字：
	window.static="";
	
新开窗口
	window.open("url");
	
通过本地窗口控制新开窗口
	window.open()一个重载方法
	
地址栏的文字
	window.location
	
2、history
转向历史页面
history.back();
	
