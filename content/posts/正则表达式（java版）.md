---
title: 正则表达式（java版）
date: 2016-11-14T22:36:06+08:00
draft: false
toc: true
comments: true
aliases:
  - /detail/9
  - /detail/9/
tags:
  - Java
---

### 1、常用方法

```java
boolean String.matches(String regex); //判断是否匹配
String.replaceAll(String regex, String str); //替换所有匹配的字符串

Pattern p = Pattern.compile(String regex); //编译一个模式
Matcher m = p.matcher(String target); //对指定字符串进行这种模式的匹配，并将结果存到Matcher中

//Matcher所有的匹配操作将会影响其他匹配，匹配完后指针不会前移
boolean Matcher.matches(); //是否匹配整个字符串
Matcher.reset(); //将指针放到字符串首（初始化匹配）
boolean Matcher.find(); //是否能找到匹配的子串，找到后，将找到的子串及之前的字符去掉，重新匹配
boolean Matcher.lookingAt(); //每次从字符串首部查找子串

//进行一次find操作后，打印出当前匹配串的起始位置和结束位置
int Matcher.start();
int Matcher.end();

//忽略大小写
Pattern.compile(String regex, int flag);

//查找匹配的字符串并返回回来
while(m.find()){
	String m.group(); // 可以用来实现捕获组替换
}

//分组用小括号组号从1开始算起，计算组号按照左小括号位置为准
Pattern.compile("(a)(b)");
while(m.find()){
	String m.group(1);
}

//替换
String m.replaceAll(String tar);
//替换单数个子串
```

### 2、正则表达式语法

#### 预定义字符类（元字符）

* .	匹配除换行符以外的任意字符
* \w	单词字符：[a-zA-Z_0-9]
* \W	非单词字符：[^\w]
* \s	匹配任意的空白符：[ \t\n\x0B\f\r]
* \S	非空白字符：[^\s]
* \d	匹配数字：[0-9]
* \D	非数字： [^0-9]

#### Greedy（贪婪）数量词（边界字符）-最长匹配

* \b	匹配单词的开始或结束（单词边界分开两个单词的字符）
* ^	匹配字符串的开始
* $	匹配字符串的结束
* \B	非单词边界
* \A	输入的开头
* \G	上一个匹配的结尾
* \Z	输入的结尾，仅用于最后的结束符（如果有的话）
* \z	输入的结尾

#### Reluctant 数量词 -最短匹配

* X?? X，一次或一次也没有
* X*? X，零次或多次
* X+? X，一次或多次
* X{n}? X，恰好 n 次
* X{n,}? X，至少 n 次
* X{n,m}? X，至少 n 次，但是不超过 m 次

#### Possessive 数量词 -效率高

* X?+ X，一次或一次也没有
* X*+ X，零次或多次
* X++ X，一次或多次
* X{n}+ X，恰好 n 次
* X{n,}+ X，至少 n 次
* X{n,m}+ X，至少 n 次，但是不超过 m 次

#### 数量词（常用限定符）

* `*`	重复零次或更多次
* `+`	重复一次或更多次
* ?	重复零次或一次
* {n}	重复n次
* {n,}	重复n次或更多次
* {n,m}	重复n到m次

#### 字符类 （表示范围匹配一个字符）

* `[abc]` a、b 或 c（简单类）
* `[^abc]` 任何字符，除了 a、b 或 c（否定）
* `[a-zA-Z]` a 到 z 或 A 到 Z，两头的字母包括在内（范围）
* `[a-d[m-p]]` a 到 d 或 m 到 p：[a-dm-p]（并集）
* `[a-z&&[def]]` d、e 或 f（交集）
* `[a-z&&[^bc]]` a 到 z，除了 b 和 c：[ad-z]（减去）
* `[a-z&&[^m-p]]` a 到 z，而非 m 到 p：[a-lq-z]（减去）

#### 特殊构造（非捕获）

* (?:X) X，作为非捕获组
* (?idmsux-idmsux)  Nothing，但是将匹配标志i d m s u x on - off
* (?idmsux-idmsux:X)   X，作为带有给定标志 i d m s u x on - off
* 的非捕获组
* (?=X) X，通过零宽度的正 lookahead
* (?!X) X，通过零宽度的负 lookahead
* (?<=X) X，通过零宽度的正 lookbehind
* (?<!X) X，通过零宽度的负 lookbehind
* (?*X) X，作为独立的非捕获组
*
* Back （向前）引用
* \n 任何匹配的 nth 捕获组

### 3、例子

* 查找空白行：
* 匹配email地址：

### 4、需要转移个字符

* $ 匹配输入字符串的结尾位置。如果设置了 RegExp 对象的 Multiline 属性，则 $ 也匹配 ‘\n' 或 ‘\r'。要匹配 $ 字符本身，请使用 \$。
* ( ) 标记一个子表达式的开始和结束位置。子表达式可以获取供以后使用。要匹配这些字符，请使用 \\( 和 \\)。
* `*` 匹配前面的子表达式零次或多次。要匹配 * 字符，请使用 \\*。
* `+` 匹配前面的子表达式一次或多次。要匹配 + 字符，请使用 \\+。
* . 匹配除换行符 \n之外的任何单字符。要匹配 .，请使用 \\。
* `[ ]` 标记一个中括号表达式的开始。要匹配 [，请使用 \\[。
* `?` 匹配前面的子表达式零次或一次，或指明一个非贪婪限定符。要匹配 ? 字符，请使用 \\?。
* `\` 将下一个字符标记为或特殊字符、或原义字符、或向后引用、或八进制转义符。例如， ‘n' 匹配字符 ‘n'。'\n' 匹配换行符。序列 ‘\\\\' 匹配 “\”，而 ‘\\(' 则匹配 “(”。
* `^` 匹配输入字符串的开始位置，除非在方括号表达式中使用，此时它表示不接受该字符集合。要匹配 ^ 字符本身，请使用 \^。
* `{ }` 标记限定符表达式的开始。要匹配 {，请使用 \\{。
* `|` 指明两项之间的一个选择。要匹配 |，请使用 \\|。

### 5、常用例子

**获取捕获组替换**

https://blog.csdn.net/djh122/article/details/44828215
