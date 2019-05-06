---
title: jquery速查
date: 2016-11-14T23:26:53+08:00
draft: false
toc: false
comments: true
aliases:
  - /detail/13
  - /detail/13/
tags:
  - 前端
---

## 一、一般写法和注意：
```js
$(document).ready(function() {
	$('#id名').事件简写(function() {
		//事件处理代码
	});
});
```


## 二、选择器
>  \>  : 子元素组合符 父元素 > 子元素
> [] : 属性选择符 元素名[属性]
> ^= : 属性值中开头
> $= : 属性值结尾
> 例：$('a[href$=."pdf"]')
> 
> 自定义选择符（注意：以0开始）
> :eq(index) :所选择的元素的第index+1个
> :even :所选择的元素的偶数个
> :odd :所选择的元素的奇数个
> :nth-child() :以一开头
> :contains(str) :所选的元素文本包含str字符串的


## 三、事件
### 简写的事件：
> blur
> change
> click
> dblclick
> error
> focus
> keydown
> keypress
> keyup
> load
> mousedown
> mousemove
> mouseout
> mouseover
> mouseup
> resize
> scroll
> select
> submit
> unload
	
### 复合事件:
#### 1、`toggle`(单击1—单击2用于隐藏菜单)
```js
toggle(function(){
	//第一次单击事件
	},
	function(){
	//第二次单击事件
	}

);

```
	
#### 2、hover(鼠标略过元素)
```js
hover(function(){
	//鼠标位于元素上
	},
	function(){
	//鼠标离开元素
	}

);
```
	
#### 3、事件的传递
jquery的时间传递按照从里朝外的冒泡方式传递的
解决这个问题有时需要：
	
```js
$('#外层元素的id').click(function(event){
	if(event.target==this){
		//这里写不会处理这个外层元素响应的事件
		//那么，内层元素的响应就不会响应
	}
});
```

#### 4、事件委托 
当多个内层元素要处理相同的事件时，可以在其最外层的元素写一个方法
那么未被拦截的元素将会被处理
	例子：
```js
$('#外层元素的id').click(function(event){
	if($(event.target).is('内层元素选择符表达式')){
		//这里写内层元素相似的方法，在外层统一处理
	}
});
```
	
#### 5、事件委托的方法：`.live() .die()` 
```js
$('绑定的元素选择器').live('click',function(){
	//这里写方法，内部会自动检测(event.target==this)
})
```


#### 6、移除事件绑定
给函数命名
```js
var 函数名=function(event){

}
```
解绑事件
```
	$('选择符').unbind('事件名','函数名');
```
重新绑定函数：
```js
	$('选择符').bind('事件名','函数名');
```
只运行一次函数
```js
	$('选择符').one('事件名','函数名');
```
7、模拟用户操作
```js
	$('选择符').trigger('事件名');
```
	
## 四、样式和动画



## 五、操作DOM
### 1、属性操作
```js
//添加属性
$('选择符').attr({
	属性名: '属性值',
	属性名: function(index,oldValue) {
		//index:自动增
		//oldValue:上一个的值
		return '前键'+index;
	},
	属性名: function(){
		return '值'+$(this).text()+'值';
	}

});
	
//获得属性的值
var v = $().prop('属性名');

//修改属性的值
$().prop('属性名','值');

/*
注意：html与dom的区别
	如：
		checked在html中是：字符串
		checked在dom中是：bool值
*/
```
			
		
### 2、dom树的操作
#### 插入
```js
$('html元素').insertAfter('选择符'); //在元素'选择符'下面（外部）插入'html元素'
$('html元素').insertBefore('选择符'); //在元素'选择符'上面（外部）插入'html元素'
$('html元素').prependTo('选择符'); //在元素'选择符'内部最上面插入'html元素'
$('html元素').appendTo('选择符'); //在元素'选择符'内部最下面插入'html元素'
```
	
#### 移动
```js
$('需要被移动的元素选择符').dom树的插入函数('选择符');
```

#### 包围现有元素
```js
$("p").wrap("<div></div>"); //在所有p元素外用div包围
```
### 3、复制元素
```js
$('选择符').clone().dom树的插入函数('选择符 ');
```

### 4、内容的setter和getter方法
```js
//例：
$('选择符').clone().find('选择符').html('替换的值').end().dom树的插入函数('选择符');

$('选择符').html('替换标签内的文本');//替换元素的文本值
$('选择符').text(); //获得元素的文本值
$('选择符').text('字符串'); //替换元素的文本值(直接显示标签)
$('选择符').replaceAll('字符串'); //替换元素的文本值
$('选择符').replaceWith('字符串'); //替换元素的文本值	
```

### 5、移除每个匹配的元素中的元素外部元素保留
```js
$('选择符').empty();
```
	
### 6、移除每个匹配的元素中的元素包括外部元素
```js
$('选择符').remove();
```



## 六、通过ajax发送数据（不刷新界面更新页面）
### 1、基于请求的加载数据
#### 加载html片段
```js
$('选择符').click(function() {
	$('选择符').load('url');
	return false;
});
```
	

#### 获得json数据并处理
```js
$('选择符').click(function() {
	$.getJSON('url',function(data){
		var html='';
		$.each(data,function(entryIndex,entry){
			…………
			html+=entry.键; //处理值为字符串
			…………

			//处理值为数组或对象
			if(entry.键){ //如果存在
				$each(entry.键,function(lineIndex,line){
					……………
					html+=line.键;
					………………

				});
			}

		});
		$('选择符').html(html);
	});
	return false;
});
```
	
	
#### 动态获得js文件,并执行js函数 
```js
$('选择符').click(function() {
	$.getScript('js文件url');
	return false;
})
```
	
	
#### 加载xml文件（也可以和json一样）
```js
$('选择符').click(function() {
	$.get('xml文件的url',function(data){
		var html='';

		$(data).find('结点').each(function(){

			var $结点=$(this);
			$结点.attr('属性名'); //获得节点的属性
			$结点.text; //获得结点间的文本值

		});

		$('选择符').html(html);
	});
	return false;
});
```

	
### 2、向服务器传递数据
#### 通过get方式获得数据
```js
$('选择符').click(function(){
	var requirData={
										键:值
									}	;
	$.get('.php或jsp或.action等等',requirData,function(data){
			//对data进行处理，追加html或更改显示
	});

	return false;

});
```
	
	
#### 通过post方式获得数据
```js
$('选择符').click(function(){
	var requirData={
										键:值
									}	;
	$.post('.php或jsp或.action等等',requirData,function(data){
			//对data进行处理，追加html或更改显示
	});

	return false;

});
```
	
	
#### 序列化表单:
```js
$('表单选择符（form）').submit(function(){
	var requirData=$(this).serialize();
	$.post('.php或jsp或.action等等',requirData,function(data){
			//对data进行处理，追加html或更改显示
	});

	return false;

});
```

### 4、为ajax请求提供不同的内容
> 使用渐进增强的原则
	
### 5、关注请求
#### 加载反馈系统：
```js
$('要插入的html文本')
	.insertBefore('要插入在...之前')
	.ajaxStart(function(){
		$(this).show();
	})
		.ajaxStop(function(){
			$(this).hide();
});
```
			
			
### 6、错误处理
#### 使用连缀
```js
.error(function(jqXHR){});
```


### 9、低级的ajax方法
```js
$('').click(function(){
	$.ajax({
		url: '', //url地址
		type: '',	//请求地址
		data:{ //请求的数据
		
		},
		dataType: "json",//可不指定
		
		
		success: function(data) { //成功后的调用的函数(参数为返回的信息)
						
		},
		error: function(errorinfo)  {//成功后的调用的函数(参数为XMLHttpRequest)
		
		}
	
	})

});
```

### 10、解决get方式请求跨域：使用JSONP
```js
$('').click(function(){
	$.ajax({
		url: '', //url地址
		type: '',	//请求地址
		dataType: 'jsonp',
		jsonp: 'callback',
		success: function(data) { //成功后的调用的函数(参数为返回的信息)
						
		},
		error: function(errorinfo)  {//成功后的调用的函数(参数为XMLHttpRequest)
		
		}
	
	})

});
/*
返回数据格式：
	callback的值(json字符串)
*/
```



	
### 11、XHR2（HTML5）提供跨域访问
在响应头添加：
```http
"Access-Control-Allow-Origin"= "*" //允许的服务器
Access-Control-Allow-Methods: POST, GET, OPTIONS   
```
