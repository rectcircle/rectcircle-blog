---
title: Canvas绘图（一）
date: 2017-02-20T21:10:17+08:00
draft: false
toc: true
comments: true
aliases:
  - /detail/38
  - /detail/38/
tags:
  - 前端
---

## 一、基础知识

### 1、标签写法

```html
<canvas id="canvas" width="300" height="150" style="border:1px solid #aaa">您的浏览器不支持canvas</canvas>
```

效果如下

<canvas id="canvas" width="300" height="150" style="border:1px solid #aaa">您的浏览器不支持canvas</canvas>

### 2、获取标签dom元素

```html
<script type="text/javascript">
	var canvas = document.getElementById('canvas');

	canvas.width = 200; //设置宽度
	canvas.height = 100; //设置高度

	var context = canvas.getContext('2d'); //获取绘图环境
</script>
```

### 3、绘制简单图形

#### （1）绘制直线

```html
<canvas id="canvas1" width="300" height="150" style="border:1px solid #aaa"></canvas>

<script type="text/javascript">
	var canvas = document.getElementById('canvas1');

	var context = canvas.getContext('2d'); //获取绘图环境

	context.moveTo(50,50);
	context.lineTo(100,100);
	context.lineTo(100,50);

	context.lineWidth = 5; //设置宽度
	context.strokeStyle = "#f00"; //设置绘图颜色

	context.stroke(); //绘制线条
</script>
```

效果如下

<canvas id="canvas1" width="300" height="150" style="border:1px solid #aaa"></canvas>

#### （2）绘制多边形（带边框）

```html
<canvas id="canvas2" width="300" height="150" style="border:1px solid #aaa"></canvas>

<script type="text/javascript">
	var canvas = document.getElementById('canvas2');

	var context = canvas.getContext('2d'); //获取绘图环境

	context.moveTo(50,50);
	context.lineTo(100,100);
	context.lineTo(100,50);
	context.closePath(); //关闭这个线条

	context.fillStyle = "rgb(2,100,30)";

	context.fill(); //实心图形

	//绘制边框
	context.lineWidth = 5; //设置宽度
	context.strokeStyle = "red"; //设置绘图颜色

	context.stroke(); //绘制线条
</script>
```

效果如下

<canvas id="canvas2" width="300" height="150" style="border:1px solid #aaa"></canvas>

#### （3）绘制多个图形（清除上一个状态）

```html
<canvas id="canvas3" width="300" height="150" style="border:1px solid #aaa"></canvas>

<script type="text/javascript">
	var canvas = document.getElementById('canvas3');

	var context = canvas.getContext('2d'); //获取绘图环境

	context.beginPath(); //清除上一个状态
	context.moveTo(50,50);
	context.lineTo(100,100);
	context.lineTo(100,50);
	context.closePath(); //做图形闭合处理（从最后的状态点自动lineTo回归起始点封口）

	context.strokeStyle = "#00f"; //设置绘图颜色

	context.stroke(); //绘制线条


	context.beginPath();
	context.moveTo(120,120);
	context.lineTo(10,150);

	context.strokeStyle = "red"; //设置绘图颜色

	context.stroke(); //绘制线条
</script>
```

效果如下
<canvas id="canvas3" width="300" height="150" style="border:1px solid #aaa"></canvas>

#### （4）绘制弧形

```html
<canvas id="canvas4" width="300" height="150" style="border:1px solid #aaa"></canvas>

<script type="text/javascript">
	var canvas = document.getElementById('canvas4');

	var context = canvas.getContext('2d'); //获取绘图环境

	context.beginPath();
	context.lineWidth = 2;
	context.strokeStyle = "red";
	context.arc(
		50,50, 25, //圆心坐标、半径
		0,0.5*Math.PI, //起点弧度值，结束弧度值
		true //默认false，顺时针绘制
	);
	context.stroke();


	context.beginPath();
	context.lineWidth = 2;
	context.strokeStyle = "blue";
	context.arc(
		150,50, 25, //圆心坐标、半径
		0,0.5*Math.PI, //起点弧度值，结束弧度值
		false //默认false，顺时针绘制
	);
	context.stroke();
</script>
```

效果如下

<canvas id="canvas4" width="300" height="150" style="border:1px solid #aaa"></canvas>

#### （5）绘制矩形

```html
<canvas id="canvas5" width="300" height="150" style="border:1px solid #aaa"></canvas>
​
<script type="text/javascript">
  var canvas = document.getElementById('canvas5');

  var context = canvas.getContext('2d'); //获取绘图环境

  context.beginPath();
	//绘制矩形路径
	context.rect(0,0,50,50);

  context.strokeStyle = "red";
  context.stroke();

	//直接绘制矩形
	context.beginPath();

	context.fillStyle = "blue";
	context.fillRect(51,0,50,50);

	context.strokeRect(102,0,50,50);

</script>
```

效果如下

<canvas id="canvas5" width="300" height="150" style="border:1px solid #aaa"></canvas>

## 二、更多接口

### 1、线条、填充样式赋值选项——css支持的颜色设置

context.fillStyle和contextstrokeStyle

* `#ffffff`
* `#fff`
* `rgb(1,1,1)`
* `rgba(1,1,1,.5)`
* `hsl`
* `hsla`
* `red`

### 2、线条属性

#### （0）样例绘制五角星

```html
<canvas id="canvas6" width="300" height="300" style="border:1px solid #aaa"></canvas>
<script type="text/javascript">
	var canvas=document.getElementById('canvas6');
	var context=canvas.getContext('2d');

	drawStar(context, 150, 300, 150, 150,30);

	function drawStar(cxt,r,R,x,y,rot){
		cxt.lineWidth=10;
		cxt.beginPath();
		for(var i=0; i<5; i++){
			cxt.lineTo(Math.cos((18+i*72-rot)/180*Math.PI)*R+x,
										 -Math.sin((18+i*72-rot)/180*Math.PI)*R+y);
			cxt.lineTo(Math.cos((54+i*72-rot)/180*Math.PI)*r+x,
										 -Math.sin((54+i*72-rot)/180*Math.PI)*r+y);
		}
		cxt.closePath();
		cxt.stroke();
	}
</script>
```

效果如下

<canvas id="canvas6" width="300" height="300" style="border:1px solid #aaa"></canvas>

#### （1）线条头尾样式

ctx.lineCap="butt|round|square"; //默认，圆头，方头

#### （2）线条连接样式

> ctx.lineJoin = "miter|bevel|round" //默认尖角|斜接|圆角
> 当取值为miter时即"miter"时，存在配置
> ctx.miterLimit = 10 延伸超过10不显示，使用bevel显示

```html
<canvas id="canvas7" width="300" height="300" style="border:1px solid #aaa"></canvas>
<script type="text/javascript">
	var canvas=document.getElementById('canvas7');
	var context=canvas.getContext('2d');

	context.lineWidth=10;
	context.lineJoin = "round"
	drawStar(context, 50, 100, 150, 150,30);

</script>
```

<canvas id="canvas7" width="300" height="300" style="border:1px solid #aaa"></canvas>

### 3、图形变换

> context.translate(100,100);  //平移
> context.rotate(20*Math.PI/180); //旋转
> context.scale(0.5,0.5); //缩放（位置坐标，线条宽度也会缩放）
> context.transform(a,b,c,d,e,f) //设置变换矩阵进行变换，在以前的基础上设置
> context.setTransform(a,b,c,d,e,f) //设置变换矩阵进行变换，先设为单位矩阵，在设置

```html
<canvas id="canvas8" width="300" height="300" style="border:1px solid #aaa">您的浏览器不支持canvas</canvas>
<script type="text/javascript">
	var canvas=document.getElementById('canvas8');
	var context=canvas.getContext('2d');

	context.save(); //保持图形状态状态

	context.fillStyle='skyblue';
	context.translate(100,100);
	// context.rotate(20*Math.PI/180);
	// context.scale(0.5,0.5);
	context.fillRect(0,0,50,50);
	context.restore();               // 与save成对出现

	context.save();
	context.fillStyle='green';
	context.translate(150,150);
	context.fillRect(0,0,50,50);   // translate是叠加的  这里应该注意
	context.restore();
</script>
```

效果如下

<canvas id="canvas8" width="300" height="300" style="border:1px solid #aaa">您的浏览器不支持canvas</canvas>

### 4、线性渐变

> var linearGrad = context.createLinearGradient(0,0,300,300); //设置渐变线段的起点坐标，终点坐标
> lineGrad.addColorStop(0.0,'white'); //设置渐变线的关键点位置和色彩

```html
<canvas id="canvas9" width="300" height="300" style="border:1px solid #aaa">您的浏览器不支持canvas</canvas>
<script type="text/javascript">
	var canvas=document.getElementById('canvas9');
	var context=canvas.getContext('2d');

	var linearGrad = context.createLinearGradient(0,0,300,300); //设置渐变线段的起点坐标，终点坐标
	lineGrad.addColorStop(0.0,'white');
	lineGrad.addColorStop(0.25,'yellow');
	lineGrad.addColorStop(0.5,'green');
	lineGrad.addColorStop(0.75,'blue');
	lineGrad.addColorStop(1.0,'black');

	context.fillStyle = lineGrad;

	context.fillRect(0,0,300,300);

</script>
```

<canvas id="canvas9" width="300" height="300" style="border:1px solid #aaa">您的浏览器不支持canvas</canvas>

### 5、镜像渐变

> var radialGrad = context.createRadialGradient(x0,y0,r0,x1,y1,r1); //设置圆的坐标
> radialGrad.addColorStop(0.0,'white'); //设置渐变的关键点位置和色彩

```html
<canvas id="canvas10" width="300" height="300" style="border:1px solid #aaa">您的浏览器不支持canvas</canvas>
<script type="text/javascript">
	var canvas=document.getElementById('canvas10');
	var context=canvas.getContext('2d');

	var radialGrad = context.createRadialGradient(150,150,10,150,150,200); //设置圆的坐标
	radialGrad.addColorStop(0.0,'white');
	radialGrad.addColorStop(0.25,'yellow');
	radialGrad.addColorStop(0.5,'green');
	radialGrad.addColorStop(0.75,'blue');
	radialGrad.addColorStop(1.0,'black');

	context.fillStyle = radialGrad;

	context.fillRect(0,0,300,300);

</script>
```

<canvas id="canvas10" width="300" height="300" style="border:1px solid #aaa">您的浏览器不支持canvas</canvas>

### 6、图片等样式画布填充纹理

> //创建一个图片对象
> var img = new Image();
> img.src = "img.jpg";
>
> //创建一个canvas元素
> var bkgCanvas = document.createElement("canvas");
> //一系列操作
>
> //视频等
>
> var pattern = context.createPattern(img|bkgCanvas|bkgVideo, repeat-style);
> context.fillStyle = pattern;
> context.fillRect(0,0,x,y);
> //repeat-style:no-repeat | repeat-x | repeat-y | repeat
> //重复样式

<script>
	var canvas = document.getElementById('canvas1');

	var context = canvas.getContext('2d'); //获取绘图环境

	//设置状态
	context.moveTo(50,50);
	context.lineTo(100,100);
	context.lineTo(100,50);

	context.lineWidth = 5; //设置宽度
	context.strokeStyle = "#f00"; //设置绘图颜色
	//调用绘制函数
	context.stroke(); //绘制线条
</script>

<script>
	var canvas = document.getElementById('canvas2');

	var context = canvas.getContext('2d'); //获取绘图环境

	context.lineTo(100,50);
	context.closePath();

	context.fillStyle = "rgb(2,100,30)";

	context.fill(); //实心图形

	//绘制边框
	context.lineWidth = 5; //设置宽度
	context.strokeStyle = "red"; //设置绘图颜色

	context.stroke(); //绘制线条
</script>

<script type="text/javascript">
	var canvas = document.getElementById('canvas3');
	var context = canvas.getContext('2d'); //获取绘图环境
	context.beginPath(); //清除上一个状态
	context.moveTo(50,50);
	context.lineTo(100,100);
	context.lineTo(100,50);
	context.closePath(); //做图形闭合处理（从最后的状态点自动lineTo回归起始点封口）
	context.strokeStyle = "#00f"; //设置绘图颜色
	context.stroke(); //绘制线条
	context.beginPath();
	context.moveTo(120,120);
	context.lineTo(10,150);
	context.strokeStyle = "red"; //设置绘图颜色
	context.stroke(); //绘制线条
</script>

<script type="text/javascript">
	var canvas = document.getElementById('canvas4');

	var context = canvas.getContext('2d'); //获取绘图环境

	context.beginPath();
	context.lineWidth = 2;
	context.strokeStyle = "red";
	context.arc(
		50,50, 25, //圆心坐标、半径
		0,0.5*Math.PI, //起点弧度值，结束弧度值
		true //默认false，顺时针绘制
	);
	context.stroke();

	context.beginPath();
	context.lineWidth = 2;
	context.strokeStyle = "blue";
	context.arc(
		150,50, 25, //圆心坐标、半径
		0,0.5*Math.PI, //起点弧度值，结束弧度值
		false //默认false，顺时针绘制
	);
	context.stroke();
</script>

<script type="text/javascript">
	var canvas = document.getElementById('canvas5');
	var context = canvas.getContext('2d'); //获取绘图环境
	context.beginPath();
	//绘制矩形路径
	context.rect(0,0,50,50);
	context.strokeStyle = "red";
	context.stroke();
	//直接绘制矩形
	context.beginPath();
	context.fillStyle = "blue";
	context.fillRect(51,0,50,50);
	context.strokeRect(102,0,50,50);
</script>

<script type="text/javascript">
	var canvas=document.getElementById('canvas6');
	var context=canvas.getContext('2d');

	context.lineWidth=10;
	drawStar(context, 50, 100, 150, 150,30);

	function drawStar(cxt,r,R,x,y,rot){
		cxt.beginPath();

		for(var i=0; i<5; i++){
			cxt.lineTo(Math.cos((18+i*72-rot)/180*Math.PI)*R+x,-Math.sin((18+i*72-rot)/180*Math.PI)*R+y);
			cxt.lineTo(Math.cos((54+i*72-rot)/180*Math.PI)*r+x,-Math.sin((54+i*72-rot)/180*Math.PI)*r+y);
		}

		cxt.closePath();
		cxt.stroke();
	}
</script>

<script type="text/javascript">
	var canvas=document.getElementById('canvas7');
	var context=canvas.getContext('2d');

	context.lineWidth=10;
	context.lineJoin = "round"
	drawStar(context, 50, 100, 150, 150,30);

</script>

<script type="text/javascript">
	var canvas=document.getElementById('canvas8');
	var context=canvas.getContext('2d');

	context.save(); //保持图形状态状

	context.fillStyle='skyblue';
	context.translate(100,100);
	// context.rotate(20*Math.PI/180);
	// context.scale(0.5,0.5);
	context.fillRect(0,0,50,50);
	context.restore();               // 与save成对出现

	context.save();
	context.fillStyle='green';
	context.translate(150,150);
	context.fillRect(0,0,50,50);   // translate是叠加的  这里应该注意
	context.restore();
</script>

<script type="text/javascript">
	var canvas=document.getElementById('canvas9');
	var context=canvas.getContext('2d');

	var linearGrad = context.createLinearGradient(0,0,150,150); //设置渐变线段的起点坐标，终点坐标
	linearGrad.addColorStop(0.0,'white');
	linearGrad.addColorStop(0.25,'yellow');
	linearGrad.addColorStop(0.5,'green');
	linearGrad.addColorStop(0.75,'blue');
	linearGrad.addColorStop(1.0,'black');

	context.fillStyle = linearGrad;

	context.fillRect(0,0,300,300);
</script>

<script type="text/javascript">
	var canvas=document.getElementById('canvas10');
	var context=canvas.getContext('2d');

	var radialGrad = context.createRadialGradient(150,150,10,150,150,200); //设置圆的坐标
	radialGrad.addColorStop(0.0,'white');
	radialGrad.addColorStop(0.25,'yellow');
	radialGrad.addColorStop(0.5,'green');
	radialGrad.addColorStop(0.75,'blue');
	radialGrad.addColorStop(1.0,'black');

	context.fillStyle = radialGrad;

	context.fillRect(0,0,300,300);
</script>