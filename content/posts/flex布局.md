---
title: "Flex布局"
date: 2019-07-21T01:17:50+08:00
draft: false
toc: true
comments: true
tags:
  - 前端
---

参考 https://www.runoob.com/w3cnote/flex-grammar.html

```html
<!DOCTYPE html>
<html>
<head>
	<meta charset="UTF-8">
	<meta http-equiv="X-UA-Compatible" content="IE=Edge">
	<title>Help</title>
	<style>
		/* 主布局 */
		/* main {
			background: #000;
			bottom: 0;
			left: 0;
			right: 0;
			top: 0;
			overflow: hidden;
			position: absolute;
			padding: 0 15px;
		}
		article {
			float: left;
			width: 75%;
			height: 100%;
			background-color: blue;
			overflow: scroll;
		}
		aside {
			float: right;
			width: 25%;
			height: 100%;
			overflow: scroll;
			background-color: yellow;
		} */
		main {
			background: #000;
			/* 以下为让main沾满整个窗口且不可滚动 */
			position: absolute;
			top: 0;
			bottom: 0;
			left:0;
			right: 0;
			overflow: hidden;
			/* 作为flex容器并进行设置 */
			display: flex; /* 启用flex布局 */
			flex-direction: row; /* 方向 row | row-reverse | column | column-reverse */
			flex-wrap: nowrap; /* 是否换行 nowrap | wrap | wrap-reverse
			/* flex-flow: <flex-direction> <flex-wrap>; */
			justify-content: flex-start; /* 对齐方向 flex-start | flex-end | center | space-between | space-around */
			/* 交叉对齐方向 align-items: flex-start | flex-end | center | baseline | stretch; */
			/* align-content: flex-start | flex-end | center | space-between | space-around | stretch; */
		}
		article {
			order: 0 /* order属性定义项目的排列顺序。数值越小，排列越靠前，默认为0。 */;
			flex-grow: 3 /* flex-grow属性定义项目的放大比例，默认为0，即如果存在剩余空间，也不放大。（类似于百分比） */;
			/* flex-shrink属性定义了项目的缩小比例，默认为1，即如果空间不足，该项目将缩小。 */
			/* flex-basis属性定义了在分配多余空间之前，项目占据的主轴空间（main size）。浏览器根据这个属性，计算主轴是否有多余空间。它的默认值为auto，即项目的本来大小。 */
			/* flex: none | [ <'flex-grow'> <'flex-shrink'>? || <'flex-basis'> ] */
			/* align-self: auto | flex-start | flex-end | center | baseline | stretch; */
			background-color: blue;
			padding: 1rem;
			overflow: scroll;
		}
		aside {
			order: 1;
			flex-grow: 1;
      flex-shrink: 0;
			background-color: yellow;
			padding: 1rem;
			overflow: scroll;
		}
		/* 面包屑导航 */
		.breadcrumb {
			padding: 8px 15px;
			margin-bottom: 20px;
			list-style: none;
			background-color: #f5f5f5;
			border-radius: 4px;
		}

		.breadcrumb>li {
			display: inline-block;
		}

		.breadcrumb>li+li:before {
			padding: 0 5px;
			color: #ccc;
			content: "/\00a0";
		}
	</style>
</head>

<body>
	<main>
		<article>
			<ol class="breadcrumb">
				<li><a href="/article">文章</a></li>
				<li class="active">全部</li>
			</ol>
		</article>
		<aside>
			<ul>
				<li><a href="">全局配置</a></li>
				<li><a href="">全局配置</a></li>
				<li><a href="">全局配置</a></li>
				<li><a href="">全局配置</a></li>
				<li><a href="">全局配置</a></li>
				<li><a href="">全局配置</a></li>
				<li><a href="">全局配置</a></li>
				<li><a href="">全局配置</a></li>
				<li><a href="">全局配置</a></li>
				<li><a href="">全局配置</a></li>
				<li><a href="">全局配置</a></li>
				<li><a href="">全局配置</a></li>
				<li><a href="">全局配置</a></li>
				<li><a href="">全局配置</a></li>
				<li><a href="">全局配置</a></li>
				<li><a href="">全局配置</a></li>
				<li><a href="">全局配置</a></li>
				<li><a href="">全局配置</a></li>
				<li><a href="">全局配置</a></li>
				<li><a href="">全局配置</a></li>
				<li><a href="">全局配置</a></li>
				<li><a href="">全局配置</a></li>
				<li><a href="">全局配置</a></li>
				<li><a href="">全局配置</a></li>
				<li><a href="">全局配置</a></li>
				<li><a href="">全局配置</a></li>
				<li><a href="">全局配置</a></li>
				<li><a href="">全局配置</a></li>
				<li><a href="">全局配置</a></li>
				<li><a href="">全局配置</a></li>
				<li><a href="">全局配置</a></li>
				<li><a href="">全局配置</a></li>
				<li><a href="">全局配置</a></li>
				<li><a href="">全局配置</a></li>
				<li><a href="">全局配置</a></li>
				<li><a href="">全局配置</a></li>
				<li><a href="">全局配置</a></li>
				<li><a href="">全局配置</a></li>
				<li><a href="">全局配置</a></li>
				<li><a href="">全局配置</a></li>
				<li><a href="">全局配置</a></li>
			</ul>
		</aside>
	</main>
</body>

</html>
```
