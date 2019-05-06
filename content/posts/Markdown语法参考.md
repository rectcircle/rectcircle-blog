---
title: Markdown语法参考
date: 2016-11-06T21:37:12+08:00
draft: false
toc: false
comments: true
aliases:
  - /detail/2
  - /detail/2/
tags:
  - untagged
---

### 1、 嵌入html
这是一个普通段落。
```markdown
这是一个普通段落。
```

<table>
    <tr>
        <td>Foo</td>
    </tr>
</table>
```markdown
<table>
    <tr>
        <td>Foo</td>
    </tr>
</table>
```

### 2、标题

This is an H1
=============
```markdown
This is an H1
=============
```

This is an H2
-------------
```markdown
This is an H2
-------------
```

# 这是 H1  #

```markdown
# 这是 H1  #
```

## 这是 H2  ##

```markdown
## 这是 H2  ##
```

### 这是 H3 ###

```markdown
### 这是 H3 ###
```

#### 这是 H4 ####

```markdown
#### 这是 H4 ####
```

##### 这是 H5 #####

```markdown
##### 这是 H5 #####
```

###### 这是 H6 ######

```markdown
###### 这是 H6 ######
```

后面的#号可以省略




## 3、区块引用 Blockquotes
方式1
> This is a blockquote with two paragraphs. Lorem ipsum dolor sit amet,
> consectetuer adipiscing elit. Aliquam hendrerit mi posuere lectus.

```markdown
> This is a blockquote with two paragraphs. Lorem ipsum dolor sit amet,
> consectetuer adipiscing elit. Aliquam hendrerit mi posuere lectus.
```



方式2
> This is a blockquote with two paragraphs. Lorem ipsum dolor sit amet

> Donec sit amet nisl. Aliquam semper ipsum sit amet velit. Suspendisse
id sem consectetuer libero luctus adipiscing.

```markdown
> This is a blockquote with two paragraphs. Lorem ipsum dolor sit amet

> Donec sit amet nisl. Aliquam semper ipsum sit amet velit. Suspendisse
id sem consectetuer libero luctus adipiscing.
```

嵌套
> This is the first level of quoting.
> 
> > This is nested blockquote.
>
> Back to the first level.

```markdown
> This is the first level of quoting.
> 
> > This is nested blockquote.
>
> Back to the first level.
```

包含其他markdown元素

> ## 这是一个标题。
> 
> 1.   这是第一行列表项。
> 2.   这是第二行列表项。
> 
> 给出一些例子代码：
> 
>     return shell_exec("echo $input | $markdown_script");

```markdown
> ## 这是一个标题。
> 
> 1.   这是第一行列表项。
> 2.   这是第二行列表项。
> 
> 给出一些例子代码：
> 
>     return shell_exec("echo $input | $markdown_script");
```
  
  
## 4、列表
#### 无序列表
*   Red
*   Green
*   Blue

```markdown
*   Red
*   Green
*   Blue
```

或者

+   Red
+   Green
+   Blue

```markdown
+   Red
+   Green
+   Blue
```

或者

-   Red
-   Green
-   Blue

```markdown
-   Red
-   Green
-   Blue
```

#### 有序列表
1.  Bird
2.  McHale
3.  Parish

```markdown
1.  Bird
2.  McHale
3.  Parish
```

或者

1.  Bird
1.  McHale
1.  Parish

```markdown
1.  Bird
1.  McHale
1.  Parish
```

或者

3. Bird
1. McHale
8. Parish

```markdown
3. Bird
1. McHale
8. Parish
```

#### 列表中引用

*   A list item with a blockquote:

    > This is a blockquote
    > inside a list item.

```markdown
*   A list item with a blockquote:

    > This is a blockquote
    > inside a list item.
```

#### 出现数字.需要转义

1986\. What a great season.
```markdown
1986\. What a great season.
```


## 表格
| Tables        | Are           | Cool  |
| ------------- |:-------------:| -----:|
| col 3 is      | right-aligned | $1600 |
| col 2 is      | centered      |   $12 |
| zebra stripes | are neat      |    $1 |

```markdown
| Tables        | Are           | Cool  |
| ------------- |:-------------:| -----:|
| col 3 is      | right-aligned | $1600 |
| col 2 is      | centered      |   $12 |
| zebra stripes | are neat      |    $1 |
```


## 代码区块
这是一个普通段落：

    这是一个代码区块。
		
```markdown
    这是一个代码区块。
```
		
或者
		
```cpp
#include <iostream>

using namespace std;

int main(){
	cout<<"hello world"<<endl;
	return 0;
}
```

```markdown
```cpp
#include <iostream>

using namespace std;

int main(){
	cout<<"hello world"<<endl;
	return 0;
}
//这里有三个`
```

## 链接
#### 行内式
This is [本站主页](/ "主页") inline link.
```markdown
This is [本站主页](/ "主页") inline link.
```

#### 参考式

This is [an example] [id] reference-style link.

[id]: /article "title"

```markdown
This is [an example] [id] reference-style link.

[id]: /article "title"
```

例子

I get 10 times more traffic from [Google] [1] than from
[Yahoo] [2] or [MSN] [3].

  [1]: http://google.com/        "Google"
  [2]: http://search.yahoo.com/  "Yahoo Search"
  [3]: http://search.msn.com/    "MSN Search"

```markdown
I get 10 times more traffic from [Google] [1] than from
[Yahoo] [2] or [MSN] [3].

  [1]: http://google.com/        "Google"
  [2]: http://search.yahoo.com/  "Yahoo Search"
  [3]: http://search.msn.com/    "MSN Search"
```

## 强调
*single asterisks*

```markdown
*single asterisks*
```

_single underscores_

```markdown
_single underscores_
```

**double asterisks**

```markdown
**double asterisks**
```

__double underscores__
```markdown
__double underscores__
```

un*frigging*believable
```markdown
un*frigging*believable
```

如果你的 \* 和 \_ 两边都有空白的话，它们就只会被当成普通的符号。
普通文本两端插入\*或者\_号需要加入\转义
\*this text is surrounded by literal asterisks\*
\_this text is surrounded by literal asterisks\_


## 小段代码
Use the `printf()` function.
如果要在代码区段内插入反引号，你可以用多个反引号来开启和结束代码区段：
``There is a literal backtick (`) here.``

```markdown
Use the `printf()` function.
如果要在代码区段内插入反引号，你可以用多个反引号来开启和结束代码区段：
``There is a literal backtick (`) here.``
```

A single backtick in a code span: `` ` ``
A backtick-delimited string in a code span: `` `foo` ``

Please don't use any `<blink>` tags.

```markdown
A single backtick in a code span: `` ` ``
A backtick-delimited string in a code span: `` `foo` ``

Please don't use any `<blink>` tags.
```


## 图片
![加载失败显示内容](/img/java.png "hover")
```markdown
![加载失败显示内容](/img/java.png "hover")
```


## 自动链接
<http://example.com/>
<address@example.com>

```markdown
<http://example.com/>
<address@example.com>
```


## \反斜线
\*literal asterisks\*

```markdown
\*literal asterisks\*
```

Markdown 支持以下这些符号前面加上反斜杠来帮助插入普通的符号：

	\   反斜线
	`   反引号
	*   星号
	_   底线
	{}  花括号
	[]  方括号
	()  括弧
	#   井字号
	+   加号
	-   减号
	.   英文句点
	!   惊叹号

nihaio
dsvffd


快捷键

Shortcut | Action
:------- | :-----
*Cmd-'* | "toggleBlockquote" > 引用
*Cmd-B* | "toggleBold" **加粗**
*Cmd-E* | "cleanBlock" 去除特殊标记
*Cmd-H* | "toggleHeadingSmaller" 标题级别切换
*Cmd-I* | "toggleItalic" *斜体*
*Cmd-K* | "drawLink" [链接]()
*Cmd-L* | "toggleUnorderedList" 无需列表
*Cmd-P* | "togglePreview" 预览
*Cmd-Alt-C* | "toggleCodeBlock" `代码块`
*Cmd-Alt-I* | "drawImage" 添加图片
*Cmd-Alt-L* | "toggleOrderedList" 添加有序列表
*Shift-Cmd-H* | "toggleHeadingBigger" 标题级别反向切换
*F9* | "toggleSideBySide" 代码视图同时显示切换
*F11* | "toggleFullScreen" 全屏幕

