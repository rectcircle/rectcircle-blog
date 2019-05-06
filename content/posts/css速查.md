---
title: css速查
date: 2016-11-14T22:59:00+08:00
draft: false
toc: false
comments: true
aliases:
  - /detail/11
  - /detail/11/
tags:
  - 前端
---

## 一、CSS使用方式
#### 方式一
```html
	<style>
	选择符{属性:值;属性:值...}
	</style>
```

#### 方式二
```html
	<link REL=stylesheet href="路径.css" type ="text/css">
```
	
#### 方式三 在标签属性里直接指定
```html
	<标签 style="属性:值;属性:值..." ></标签>
```
	
> 注：有两种以上css指定采取就近原则


## 二、css选择符
#### 1、class类：
在标签里指定一个属性class="class值"；

标签名.class值{属性:值;属性:值...} 选择 标签名的class值为.后面的值
.class名{属性:值;属性:值...} 选择 所有class值为“class值”的标签
注：标签```<pre>```表示保留标签内部结构
		
#### 2、id选择符
```css
#id名{属性:值;属性:值...}{属性:值;属性:值...}{属性:值;属性:值...}
```
#### 3、逗号,或者选择符
```css
标签名1,标签名2{属性:值;属性:值...}
```
#### 4、空格 层次选择符
```css
父标签 子标签{属性:值;属性:值...}
```
#### 5、属性选择器（所有包含此属性的的元素有）
```csss
[属性]
	 属性和值选择器
[属性=值]
	 属性和值选择器（多个值属性值中包含这个值的多个属性值一般空格隔开）
[属性~=值]
	 属性和值选择器（多个值属性值中包含这个值的多个属性值由-隔开）
[属性|=值]	
	 属性和值选择器（多个值属性值中以这个值开头）
[属性^=值]	
	 属性和值选择器（多个值属性值中以这个值结尾）
[属性$=值]	
	 属性和值选择器（多个值属性值中包含字符串）
[属性*=字符串]	
```
	
#### 6、伪类选择符（冒号:）
```css
a:link //普通样式
a:visited //访问过的
a:active //当得激活时
a:link:hover //鼠标在其上时
:focue //当获得焦点时

元素:before  //在元素之前插入内容
元素:after  //在元素之后插入内容
```


## 三、css的属性
#### 1、字体属性
```css
font-family	字体
font-style	字体样式
font-variant	小体大写（全部大写）
font-weight	字体粗细
font-size	字体大小
color	字体颜色
```

2、颜色与背景属性
```css
color	颜色
background-color	背景色
background-image	背景图案
background-repeat	背景图案的重复方式
background-attachment	背景的滚动
background-position	背景图案的初始位置
```
	
3、文本属性
```css
word-spacing	单词间距	单位em
letter-spacing	字母间距
text-decoration	装饰样式
vertical-align	垂直方向位置
text-transform	转为其他方式
text-align	对其
text-indent	缩进
line-height	行高
```
	
4、装饰超链接 伪类选择符
```css
<style>
	a:link{属性:值;属性:值...} 未访问时的状态
	a:visited{属性:值;属性:值...}	访问过的状态
	a:action{属性:值;属性:值...}	鼠标点中不放时的状态
	a:hover{属性:值;属性:值...}	鼠标划过的状态
</style>
```
	
5、边距属性
```css
margin-top	上边距	单位 em 或 %
margin-right	右边距
margin-bottom	下边距
margin-left	左边距
```
	
6、填充属性（距离边框）
```css
padding-top	上边距	单位 em 或 %
padding-right	右边距
padding-bottom	下边距
padding-left	左边距
```
	
7、边框属性
```css
border-top-width 上边框宽的	单位em|thin|medium|thick
border-right-width	...
...
border-width	四边
border-color	边框颜色
border-style	边框样式（线型）

border-top|right|bottom|left	所有属性	border-width|border-style|color
```
	
8、图文混排float环绕
```css
img{margin-right:2em;float:left}
```

9、列表属性
```css
li{属性:值}
display 是否显示
white-space	空白部分
list-style-type	项目编号
list-style-image	项目前的编号
list-style-position	第二行位置
```
	
10、鼠标效果属性
```css
cursor:
	值
	hand 手型
	move 移动
	ne-resize	反方向
	wait	等待
	help	求助
```


11、定位属性
```css
position 定位 absolute
top:距离上边距
```
	
12、是否可见属性
```css
visibility值 hidden 或 visible
```
	
13、z轴属性从屏幕指向操作者
```css
z-index:数字
```

14、滤镜效果（略）
