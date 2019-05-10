---
title: Canvas绘图（二）
date: 2017-02-23T21:40:48+08:00
draft: false
toc: true
comments: true
aliases:
  - /detail/40
  - /detail/40/
tags:
  - 前端
---

## 二、更多接口（续）

### 6、绘制曲线

#### （1）绘制圆弧

> context.arc() //略
> context.arcTo(x1,y1,x2,y2,radius) //起始点为x0,y0

```html
<canvas id="canvas" style="border: 1px solid #aaa;display: block;margin: 50px auto;">
</canvas>

<script>
    window.onload=function () {
        var canvas = document.getElementById('canvas');

        canvas.width = 400;
        canvas.height = 400;

        var context = canvas.getContext('2d');

        context.beginPath();
        context.moveTo(75,75); //辅助点
        context.arcTo(325,75,325,325,150); //绘制的圆弧
        //绘制路径为： 辅助点 -> 辅助线的切点 -> 圆弧 -> 切点

        context.lineWidth = 6;
        context.strokeStyle = "red";
        context.stroke();

        //以下为辅助线
        context.beginPath();
        context.moveTo(75,75);
        context.lineTo(325,75);
        context.lineTo(325,325);

        context.lineWidth = 2;
        context.strokeStyle = "gray";
        context.stroke();
    }
</script>
```

效果如下
<canvas id="canvas" style="border: 1px solid #aaa;display: block;margin: 50px auto;">
</canvas>

#### （2）绘制二次贝塞尔曲线

> context.quadraticCurveTo(x1,y1,x2,y2);

参见：http://blogs.sitepointstatic.com/examples/tech/canvas-curves/quadratic-curve.html

（3）绘制三次贝塞尔曲线

> ctx.bezierCurveTo(x1, y1, x2, y2, x3, y3);

参见http://blogs.sitepointstatic.com/examples/tech/canvas-curves/bezier-curve.html

### 7、渲染文字

> context.font = "20px sans-serif"; //此为默认字体样式，css字体设置
> context.textAlign = "left|center|right"; //文本水平对齐 默认left
> context.textBaseline = "top|middle|bottom"; //垂直对齐 默认alphabetic
> context.measureText(string).width; //返回文本的宽度px
> context.fillText("我是文本绘制！",40,100);
> context.strokeText("我是文本绘制！",40,100);

```html
<canvas id="canvas1" style="border: 1px solid #aaa;display: block;margin: 50px auto;">
</canvas>
<script type="text/javascript">
    var canvas=document.getElementById('canvas1');

    canvas.width = 400;
    canvas.height = 400;

    var context=canvas.getContext('2d');

    context.font = "20px Georgia";
    context.fillText("渲染文字",40,20);

    context.lineWidth=1;
    context.strokeStyle='#058'
    context.strokeText("我是文本描边！",40,60);

    context.fillText("我被强制收缩",40,100,80);
    context.strokeText("我被强制收缩",40,140,80);

    // Create gradient
    var gradient=context.createLinearGradient(0,0,canvas.width,0);
    gradient.addColorStop("0","magenta");
    gradient.addColorStop("0.5","blue");
    gradient.addColorStop("1.0","red");
    // Fill with gradient
    context.fillStyle=gradient;
    context.fillText("文字背景色渐变",40,180);


    var backgroundImage = new Image();
    backgroundImage.src = "gravel.jpg";
    backgroundImage.onload = function () {
        var pattern = context.createPattern(backgroundImage,"repeat");
        context.fillStyle =pattern;
        context.font = "bold 100px Arial";
        context.fillText("我还有描边效果！",40,650);
        context.strokeText("我还有描边效果！",40,650);
    }
</script>
```

效果如下

<canvas id="canvas1" style="border: 1px solid #aaa;display: block;margin: 50px auto;">
</canvas>

## 三、其他接口

### 1、绘制阴影

> context.shadowColor = "#058"; //阴影颜色
> context.shadowOffsetX = 10; //阴影偏移量
> context.shadowOffsetY = 10; //阴影偏移量
> context.shadowBlur = 5; //阴影模糊程度

```html
<canvas id="canvas2" style="border: 1px solid #aaa;display: block;margin: 50px auto;">
</canvas>
<script type="text/javascript">
    var canvas=document.getElementById('canvas2');

    canvas.width = 400;
    canvas.height = 400;

    var context=canvas.getContext('2d');

    context.fillStyle = "#580";

    context.shadowColor = "gray";
    context.shadowOffsetX = 10;
    context.shadowOffsetY = 10;
    context.shadowBlur = 5;

    context.fillRect(100,100,200,200);
</script>
```

效果如下

<canvas id="canvas2" style="border: 1px solid #aaa;display: block;margin: 50px auto;">
</canvas>

### 2、状态变量

> context.globalAlpha = 1 //默认为1，全局透明度
> context.globalCompositeOperation = "source-over" //默认//重叠效果

```html
<canvas id="canvas3" style="border: 1px solid #aaa;display: block;margin: 50px auto;">
</canvas>
<!-- 
source-over     默认。在目标图像上显示源图像。
source-atop     在目标图像顶部显示源图像。源图像位于目标图像之外的部分是不可见的。
source-in       在目标图像中显示源图像。只有目标图像内的源图像部分会显示，目标图像是透明的。
source-out      在目标图像之外显示源图像。只会显示目标图像之外源图像部分，目标图像是透明的。
destination-over    在源图像上方显示目标图像。
destination-atop    在源图像顶部显示目标图像。源图像之外的目标图像部分不会被显示。
destination-in      在源图像中显示目标图像。只有源图像内的目标图像部分会被显示，源图像是透明的。
destination-out     在源图像外显示目标图像。只有源图像外的目标图像部分会被显示，源图像是透明的。
lighter         显示源图像 + 目标图像。
copy            显示源图像。忽略目标图像。
xor             这个值与顺序无关，只绘制出不重叠的源与目标区域。所有重叠的部分都变成透明的
 -->
<div id="buttons">
    <a href="#">source-over</a>
    <a href="#">source-atop</a>
    <a href="#">source-in</a>
    <a href="#">source-out</a>
    <a href="#">destination-over</a>
    <a href="#">destination-atop</a>
    <a href="#">destination-in</a>
    <a href="#">destination-out</a>
    <a href="#">lighter</a>
    <a href="#">copy</a>
    <a href="#">xor</a>
</div>

<script>
    window.onload=function () {

        draw("source-over");
        var buttons = document.getElementById("buttons").getElementsByTagName("a");
        for (var i = 0; i < buttons.length; i++) {
            buttons[i].onclick = function () {
                draw(this.text);
                return false;
            }
        }
    };

    function draw(compositeStyle) {
        var canvas = document.getElementById('canvas3');

        canvas.width = 1200;
        canvas.height = 800;

        var context = canvas.getContext('2d');

        context.clearRect(0,0,canvas.width,canvas.height);

        context.font = "bold 40px Arial";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillStyle = "#058";
        context.fillText("globalCompositeOperation = "+ compositeStyle,canvas.width/2,60);

        context.fillStyle = "blue";
        context.fillRect(300,150,500,500);

        context.globalCompositeOperation = compositeStyle;
        context.fillStyle = "red";
        context.beginPath();
        context.moveTo(700,250);
        context.lineTo(1000,750);
        context.lineTo(400,750);
        context.closePath();
        context.fill();
    }
</script>
```

演示程序

<canvas id="canvas3" style="border: 1px solid #aaa;display: block;margin: 50px auto;"></canvas>

### 3、剪辑区域

> context.beginPath();
> //规划路径
> context.clip() //将这个路径围城的区域作为需要渲染的环境，以下渲染将在这个区域内，超出隐藏

探照灯效果

```html

<canvas id="canvas4" width="600" height="600">  
当前浏览器不支持Canvas
</canvas>
<script type="text/javascript">
  window.onload=function(){

    var canvas = document.getElementById('canvas4');

    var context=canvas.getContext('2d');
    var w =canvas.width;
    var h =canvas.height
    //探照灯
    var ball={
      x:w/2,
      y:h/2,
      r:150,
      vx:Math.random()*5+10,
      vy:Math.random()*5+10
    }
    var rot = 0;
    setInterval(function(){
      draw();
      update();
    },40);

    function draw(){
        context.clearRect(0,0,w,h);

        context.save();

        context.beginPath();
        context.fillStyle='black'
        context.fillRect(0,0,w,h);
/*      圆形探照灯
        context.beginPath();
        context.arc(ball.x,ball.y,ball.r,0,2*Math.PI);
        context.fillStyle='white';
        context.fill();
        context.clip();
    */
        context.save();
        context.translate(ball.x,ball.y);
        context.rotate(rot /180 *Math.PI );
        context.scale(ball.r,ball.r);
        drawStar(context);
        context.fillStyle="#fff";
        context.fill();
        context.restore();
        context.clip();

        context.beginPath();
        context.font='bold 120px Arial';
        context.textAlign='center';
        context.fillStyle='#ff55cc';
        context.fillText('Canvas',w/2,h/3);
        context.fillText('Canvas',w/2,h/4*3);
        context.restore();
    }

        function drawStar(ctx) {
            ctx.beginPath();
            for(var i=0;i<5;i++){
                ctx.lineTo(Math.cos((18+i*72)/180*Math.PI),-Math.sin((18+i*72)/180*Math.PI));
                ctx.lineTo(Math.cos((54+i*72)/180*Math.PI),-Math.sin((54+i*72)/180*Math.PI));
            }
            ctx.closePath();
        }

    function update(){
        rot+=1;

        ball.x+=ball.vx;
        ball.y+=ball.vy;
        if(ball.x<=ball.r){
        ball.x=ball.r;
        ball.vx=-ball.vx;
        }
        if(ball.x>=w-ball.r){
        ball.x=w-ball.r;
         ball.vx=-ball.vx;
        }
        if(ball.y<=ball.r){
        ball.y=ball.r;
         ball.vy=-ball.vy;
        }
        if(ball.y>=h-ball.r){
        ball.y=h-ball.r;
         ball.vy=-ball.vy;
      }
    }
  }
</script>
```

效果如下

<canvas id="canvas4" width="600" height="600">  
当前浏览器不支持Canvas
</canvas>

### 4、镜像方向和剪纸效果

> 对于复杂图形判读所围成区域是否在区域外部的方法：非零环绕原则

```html
<canvas id="canvas5" width="800" height="800"></canvas>
<!-- 非零环绕原则：取一点，向外画一条射线，如果该线经过了这个图形的边，一个方向为正，一个方向为负，如果非零，则为内部，如果只有一条，则是内部 -->
<script type="text/javascript">
  window.onload=function(){
    var c = document.getElementById('canvas5');
    var context=c.getContext('2d');

    context.beginPath();
    context.arc(400,400,300,0,2*Math.PI,false)
    context.arc(400,400,150,0,2*Math.PI,true);
    context.closePath();

    context.fillStyle = "#058";
    context.shadowColor='#ccc';
    context.shadowOffsetX=10;
    context.shadowOffsetY=10;
    context.shadowBlur=10;
    context.fill();
  }
</script>
```

效果如下

<canvas id="canvas5" width="800" height="800"></canvas>

### 5、交互

> context.clearRect(x,y,width,height); //清空绘制区域
> context.isPointInPath(x,y);

```html
<canvas id="canvas6" style="border: 1px solid #aaa;display: block;margin:50px auto;"></canvas>
<script>
    var balls =[];
    var canvas = document.getElementById('canvas6');
    var context = canvas.getContext('2d');

    window.onload=function () {

        canvas.width = 800;
        canvas.height = 800;
       //随机生成小球
        for (var i = 0; i < 10; i++) {
            var aball = {
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                r: Math.random() * 50 + 20
            };
            balls[i] = aball;
        }
        draw();
        canvas.addEventListener("mousemove", detect); //添加鼠标事件
    }

    function draw(x, y) {
        context.clearRect(0, 0, canvas.width, canvas.height);
        for (var i = 0; i < balls.length; i++) {
            context.beginPath();
            context.arc(balls[i].x, balls[i].y, balls[i].r, 0, Math.PI * 2);
            if (context.isPointInPath(x, y))
                context.fillStyle = "red";
            else
                context.fillStyle = "#058";
            context.fill();
        }
    }

    function detect(event) {
        //鼠标位于获取画布位置
        var x = event.clientX - canvas.getBoundingClientRect().left;
        var y = event.clientY - canvas.getBoundingClientRect().top;
        draw(x,y);
    }
</script>
```

效果如下

<canvas id="canvas6" style="border: 1px solid #aaa;display: block;margin:50px auto;"></canvas>

### 6、使用html标签控制canvas

使用css将html控件定位在canvas之上

### 7、Canvas标准

http://www.w3.org/TR/2dcontext/

### 8、扩展context2d对象

> CanvasRenderingContext2D.prototype.扩展函数名 = function(){
> //函数体，可以使用this调用其他context方法
> }

<script>
        var canvas = document.getElementById('canvas');

        canvas.width = 400;
        canvas.height = 400;

        var context = canvas.getContext('2d');

        context.beginPath();
        context.moveTo(75,75); //辅助点
        context.arcTo(325,75,325,325,150); //绘制的圆弧
        //绘制路径为： 辅助点 -> 辅助线的切点 -> 圆弧 -> 切点

        context.lineWidth = 6;
        context.strokeStyle = "red";
        context.stroke();

        //以下为辅助线
        context.beginPath();
        context.moveTo(75,75);
        context.lineTo(325,75);
        context.lineTo(325,325);

        context.lineWidth = 2;
        context.strokeStyle = "gray";
        context.stroke();
</script>

<script type="text/javascript">
    var canvas=document.getElementById('canvas1');

    canvas.width = 400;
    canvas.height = 240;

    var context=canvas.getContext('2d');

    context.font = "20px Georgia";
    context.fillText("渲染文字",40,20);

    context.lineWidth=1;
    context.strokeStyle='#058'
    context.strokeText("我是文本描边！",40,60);

    context.fillText("我被强制收缩",40,100,80);
    context.strokeText("我被强制收缩",40,140,80);

    // Create gradient
    var gradient=context.createLinearGradient(0,0,canvas.width,0);
    gradient.addColorStop("0","magenta");
    gradient.addColorStop("0.5","blue");
    gradient.addColorStop("1.0","red");
    // Fill with gradient
    context.fillStyle=gradient;
    context.fillText("文字背景色渐变",40,180);

    var backgroundImage = new Image();
    backgroundImage.src = "gravel.jpg";
    backgroundImage.onload = function () {
        var pattern = context.createPattern(backgroundImage,"repeat");
        context.fillStyle =pattern;
        context.font = "bold 100px Arial";
        context.fillText("我还有描边效果！",40,650);
        context.strokeText("我还有描边效果！",40,650);
    }
</script>

<script type="text/javascript">
    var canvas=document.getElementById('canvas2');

    canvas.width = 400;
    canvas.height = 400;

    var context=canvas.getContext('2d');

    context.fillStyle = "#580";

    context.shadowColor = "gray";
    context.shadowOffsetX = 10;
    context.shadowOffsetY = 10;
    context.shadowBlur = 5;

    context.fillRect(100,100,200,200);
</script>

<script>
        draw("source-over");
        var buttons = document.getElementById("buttons").getElementsByTagName("a");
        for (var i = 0; i < buttons.length; i++) {
            buttons[i].onclick = function () {
                draw(this.text);
                return false;
            }
        }

    function draw(compositeStyle) {
        var canvas = document.getElementById('canvas3');

        canvas.width = 800;
        canvas.height = 800;

        var context = canvas.getContext('2d');

        context.clearRect(0,0,canvas.width,canvas.height);

        context.font = "bold 40px Arial";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillStyle = "#058";
        context.fillText("globalCompositeOperation = "+ compositeStyle,canvas.width/2,60);

        context.fillStyle = "blue";
        context.fillRect(200,150,400,400);

        context.globalCompositeOperation = compositeStyle;
        context.fillStyle = "red";
        context.beginPath();
        context.moveTo(400,250);
        context.lineTo(600,750);
        context.lineTo(300,750);
        context.closePath();
        context.fill();
    }
</script>

<script type="text/javascript">
  window.onload=function(){

    var canvas = document.getElementById('canvas4');

    var context=canvas.getContext('2d');
    var w =canvas.width;
    var h =canvas.height
    //探照灯
    var ball={
      x:w/2,
      y:h/2,
      r:150,
      vx:Math.random()*5+10,
      vy:Math.random()*5+10
    }
    var rot = 0;
    setInterval(function(){
      draw();
      update();
    },40);

    function draw(){
        context.clearRect(0,0,w,h);

        context.save();

        context.beginPath();
        context.fillStyle='black'
        context.fillRect(0,0,w,h);
/*      圆形探照灯  
        context.beginPath();
        context.arc(ball.x,ball.y,ball.r,0,2*Math.PI);
        context.fillStyle='white';
        context.fill();
        context.clip();
    */
        context.save();
        context.translate(ball.x,ball.y);
        context.rotate(rot /180 *Math.PI );
        context.scale(ball.r,ball.r);
        drawStar(context);
        context.fillStyle="#fff";
        context.fill();
        context.restore();
        context.clip();

        context.beginPath();
        context.font='bold 120px Arial';
        context.textAlign='center';
        context.fillStyle='#ff55cc';
        context.fillText('Canvas',w/2,h/3);
        context.fillText('Canvas',w/2,h/4*3);
        context.restore();
    }

        function drawStar(ctx) {
            ctx.beginPath();
            for(var i=0;i<5;i++){
                ctx.lineTo(Math.cos((18+i*72)/180*Math.PI),-Math.sin((18+i*72)/180*Math.PI));
                ctx.lineTo(Math.cos((54+i*72)/180*Math.PI),-Math.sin((54+i*72)/180*Math.PI));
            }
            ctx.closePath();
        }

    function update(){
        rot+=1;

        ball.x+=ball.vx;
        ball.y+=ball.vy;
        if(ball.x<=ball.r){
        ball.x=ball.r;
        ball.vx=-ball.vx;
        }
        if(ball.x>=w-ball.r){
        ball.x=w-ball.r;
         ball.vx=-ball.vx;
        }
        if(ball.y<=ball.r){
        ball.y=ball.r;
         ball.vy=-ball.vy;
        }
        if(ball.y>=h-ball.r){
        ball.y=h-ball.r;
         ball.vy=-ball.vy;
      }
    }
  }
</script>

<script type="text/javascript">

    var c = document.getElementById('canvas5');
    var context=c.getContext('2d');

    context.beginPath();
    context.arc(400,400,300,0,2*Math.PI,false)
    context.arc(400,400,150,0,2*Math.PI,true);
    context.closePath();

    context.fillStyle = "#058";
    context.shadowColor='#ccc';
    context.shadowOffsetX=10;
    context.shadowOffsetY=10;
    context.shadowBlur=10;
    context.fill();

</script>

<script>
    var balls =[];
    var canvas = document.getElementById('canvas6');
    var context = canvas.getContext('2d');

        canvas.width = 800;
        canvas.height = 800;
       //随机生成小球
        for (var i = 0; i < 10; i++) {
            var aball = {
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                r: Math.random() * 50 + 20
            };
            balls[i] = aball;
        }
        draw();
        canvas.addEventListener("mousemove", detect); //添加鼠标事件

    function draw(x, y) {
        context.clearRect(0, 0, canvas.width, canvas.height);
        for (var i = 0; i < balls.length; i++) {
            context.beginPath();
            context.arc(balls[i].x, balls[i].y, balls[i].r, 0, Math.PI * 2);
            if (context.isPointInPath(x, y))
                context.fillStyle = "red";
            else
                context.fillStyle = "#058";
            context.fill();
        }
    }

    function detect(event) {
        //获取画布位置
        var x = event.clientX - canvas.getBoundingClientRect().left;
        var y = event.clientY - canvas.getBoundingClientRect().top;
        draw(x,y);
    }
</script>