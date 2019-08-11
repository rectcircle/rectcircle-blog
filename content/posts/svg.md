---
title: "Svg"
date: 2019-08-06T14:17:38+08:00
draft: true
toc: true
comments: true
tags:
  - 前端
---

## 一、基本介绍和基本使用

svg是一种xml格式的图片描述文件，用于描述一组矢量图形。html支持对svg格式直接渲染和操纵，相较于canvas：

* svg是矢量图像，支持无损放大
* 在HTML中定义的svg以及其子元素存在于dom树中，可以直接操纵

## 二、svg实现图像拖拽

```html
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<meta http-equiv="X-UA-Compatible" content="ie=edge">
	<link rel="stylesheet" href="css/main.css">
	<title>CSV Test</title>
</head>
<body>
	<div class="container">
		<svg
			id="mainSvg"
			class="main-diagram"
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 800 600"
			preserveAspectRatio="xMidYMid meet"
		>
			<circle transform="translate(-400, -300)" class="diagram-atomic-element" cx="400" cy="300" r="50" />
		</svg>
	</div>
	<script src="js/main.js"></script>
</body>
</html>
```

```js
(function () {
	const mainSvg = document.getElementById('mainSvg');
	/*拖拽实现*/
	(function () {
		let targetElement = null;
		let targetOffsetStartX = 0;
		let targetOffsetStartY = 0;
		let startMetric = {}; // a: 像素比坐标，e：x轴坐标偏移量，f：y轴坐标偏移量
		mainSvg.addEventListener('mousedown', (e) => {
			if (e.target !== mainSvg) {
				targetElement = e.target;
				startMetric = targetElement.getCTM();
				targetOffsetStartX = e.offsetX;
				targetOffsetStartY = e.offsetY;
			}
		})

		mainSvg.addEventListener('mousemove', (e) => {
			if (targetElement !== null) {
				const newX = (startMetric.e + e.offsetX - targetOffsetStartX) / startMetric.a;
				const newY = (startMetric.f + e.offsetY - targetOffsetStartY) / startMetric.a;
				targetElement.setAttributeNS(null, "transform", "translate(" + newX + "," + newY + ")");
			}
		})

		mainSvg.addEventListener('mouseup', (e) => {
			targetElement = null;
		})
	})();

	const atomicElements = document.querySelector('.diagram-atomic-element');
})();
```
