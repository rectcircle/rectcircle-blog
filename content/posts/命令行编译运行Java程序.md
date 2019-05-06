---
title: 命令行编译运行Java程序
date: 2018-08-02T16:20:03+08:00
draft: false
toc: false
comments: true
aliases:
  - /detail/160
  - /detail/160/
tags:
  - java
---

## 目录
* [0、命令行的重要性](#0、命令行的重要性)
* [1、单源文件文件无包声明Java程序](#1、单源文件文件无包声明Java程序)
* [2、多文件有包声明Java程序](#2、多文件有包声明Java程序)
* [3、有外部Jar依赖的Java程序](#3、有外部Jar依赖的Java程序)
* [4、生成Jar](#4、生成Jar)



### 0、命令行的重要性
虽然有了强大智能的IDE，但是如果不了解Java程序如何通过命令行来运行，那么IDE就相当于一个黑盒，你将不会了解Java程序是如何在IDE中编译运行的，对于一些错误你将很难排除。

在现实中，自动化越来越重要，自动化的基石就是各种脚本，脚本就是一堆命令的集合。所以了解命令行非常重要。

### 1、单源文件文件无包声明Java程序
#### （1）目录结构
```
.
└── Hello.java
```

#### （2）源码
```java
public class Hello{
	public static void main(String[] args) {
		System.out.println("Hello World");
	}
}
```

#### （3）编译
```bash
# 不指定输出目录
javac Hello.java
# -d 指定输出目录
mkdir -p target/classes
javac -d target/classes Hello.java
```

编译后目录结构
```
.
├── Hello.class
├── Hello.java
└── target
    └── classes
        └── Hello.class
```

#### （4）运行
```bash
# 后面直接跟的是要运行的类的类的全类名（必须包含main函数），java指令会到classpath中去查找该类
$ java Hello
Hello World

# -cp和-classpath用于指定classpath（class文件路径）
$ java -cp target/classes/ Hello
Hello World

$ java -classpath target/classes/ Hello
Hello World
```


### 2、多文件有包声明Java程序
#### （1）目录结构
```
.
├── make.config
└── src
    └── cn
        └── rectcircle
            └── javacmd
                ├── Main.java
                └── Person.java
```

#### （2）源码
`make.config`
```
src/cn/rectcircle/javacmd/Main.java src/cn/rectcircle/javacmd/Person.java 
```

`Person.java`
```java
package cn.rectcircle.javacmd;

public class Person {
	private String name;

	public Person() {
	}

	public Person(String name) {
		this.setName(name);
	}

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}
}
```

`Main.java`
```java
package cn.rectcircle.javacmd;

public class Main {

	public static void main(String[] args) {
		Person p = new Person("小明");
		System.out.println(p.getName());
	}
}
```


#### （3）编译
```bash
# 不指定输出目录，-sourcepath指明查找依赖的源文件的目录
# -encoding utf-8 指明源文件编码
javac src/cn/rectcircle/javacmd/Main.java src/cn/rectcircle/javacmd/Person.java -encoding utf-8

# -sourcepath指明查找依赖的源文件的目录（可以这样可以之编译一个文件），若不指定-sourcepath将报错
javac -sourcepath src src/cn/rectcircle/javacmd/Main.java -encoding utf-8

# -d 指定输出目录
mkdir -p target/classes
javac -d target/classes -sourcepath src src/cn/rectcircle/javacmd/Main.java src/cn/rectcircle/javacmd/Person.java -encoding utf-8

# 使用通配符
javac -d target/classes -sourcepath src src/cn/rectcircle/javacmd/*.java -encoding utf-8

# 指定依赖的-classpath，类似于-sourcepath，这里指定的是查找二进制文件
javac -d target/classes -cp target/classes src/cn/rectcircle/javacmd/Main.java -encoding utf-8

#可以同时指定-sourcepath -classpath同时指定
javac -d target/classes -cp target/classes -sourcepath src  src/cn/rectcircle/javacmd/Main.java -encoding utf-8

#从文件中获取命令参数，@文件名
javac @make.config  -encoding utf-8
```

编译后目录结构
```
.
├── make.config
├── make-run.sh
├── src
│   └── cn
│       └── rectcircle
│           └── javacmd
│               ├── Main.class
│               ├── Main.java
│               ├── Person.class
│               └── Person.java
└── target
    └── classes
        └── cn
            └── rectcircle
                └── javacmd
                    ├── Main.class
                    └── Person.class
```

#### （4）运行
```bash
# 运行
$ java -cp target/classes cn.rectcircle.javacmd.Main
小明

$ java -classpath src cn.rectcircle.javacmd.Main
小明
```


### 3、有外部Jar依赖的Java程序
#### （1）目录结构
```
.
├── lib
│   ├── commons-lang3-3.3.2.jar
│   └── guava-18.0.jar
└── src
    └── cn
        └── rectcircle
            └── javacmd
                └── Main.java
```

#### （2）源码

`Main.java`
```java
package cn.rectcircle.javacmd;

import java.util.Arrays;
import java.util.List;

import org.apache.commons.lang3.StringUtils;
import com.google.common.base.Joiner;

public class Main {

	public static void main(String[] args) {
		List<String> list = Arrays.asList("a", "b", "c");
		System.out.println(StringUtils.join(list,","));
		System.out.println(Joiner.on(",").join(list));
	}
}
```


#### （3）编译
```bash
# 编译，指定classpath，多个路径，windows使用;分隔、Linux使用:分隔，windows git bash要加引号
javac -classpath "lib/guava-18.0.jar;lib/commons-lang3-3.3.2.jar" src/cn/rectcircle/javacmd/Main.java -encoding utf-8

# 指定输出目录
mkdir -p target/classes
javac -d target/classes -cp "lib/guava-18.0.jar;lib/commons-lang3-3.3.2.jar" src/cn/rectcircle/javacmd/Main.java -encoding utf-8
```

编译后目录结构
```
.
├── lib
│   ├── commons-lang3-3.3.2.jar
│   └── guava-18.0.jar
├── src
│   └── cn
│       └── rectcircle
│           └── javacmd
│               ├── Main.class
│               └── Main.java
└── target
    └── classes
        └── cn
            └── rectcircle
                └── javacmd
                    └── Main.class
```

#### （4）运行
```bash
# 运行 ，指定classpath，多个路径，windows使用;分隔、Linux使用:分隔，windows git bash要加引号
$ java -classpath "src;lib/guava-18.0.jar;lib/commons-lang3-3.3.2.jar" cn.rectcircle.javacmd.Main
a,b,c
a,b,c

$ java -cp "target/classes;lib/guava-18.0.jar;lib/commons-lang3-3.3.2.jar" cn.rectcircle.javacmd.Main
a,b,c
a,b,c
```


### 4、生成Jar
#### （1）目录结构
使用[3、有外部Jar依赖的Java程序](#3、有外部Jar依赖的Java程序)已完成的情况
```
.
├── manifest.txt
├── lib
│   ├── commons-lang3-3.3.2.jar
│   └── guava-18.0.jar
├── src
│   └── cn
│       └── rectcircle
│           └── javacmd
│               ├── Main.class
│               └── Main.java
└── target
    └── classes
        └── cn
            └── rectcircle
                └── javacmd
                    └── Main.class
```

添加清单文件
```
Manifest-Version: 1.0
Main-Class: cn.rectcircle.javacmd.Main
Class-Path: lib/guava-18.0.jar lib/commons-lang3-3.3.2.jar


```

#### （2）生成Jar

> 参考
> [博客1](https://blog.csdn.net/xia7139/article/details/51010594)
> [博客2](http://blog.51cto.com/gghhgame51333/25197)

**命令`jar`**

用法: `jar {ctxui}[vfmn0PMe] [jar-file] [manifest-file] [entry-point] [-C dir] files ...`
选项:
* -c  创建新档案
* -t  列出档案目录
* -x  从档案中提取指定的 (或所有) 文件
* -u  更新现有档案
* -v  在标准输出中生成详细输出
* -f  指定档案文件名
* -m  包含指定清单文件中的清单信息
* -n  创建新档案后执行 Pack200 规范化
* -e  为捆绑到可执行 jar 文件的独立应用程序
*     指定应用程序入口点
* -0  仅存储; 不使用任何 ZIP 压缩
* -P  保留文件名中的前导 '/' (绝对路径) 和 ".." (父目录) 组件
* -M  不创建条目的清单文件
* -i  为指定的 jar 文件生成索引信息
* -C  更改为指定的目录并包含以下文件
* 
如果任何文件为目录, 则对其进行递归处理。
清单文件名, 档案文件名和入口点名称的指定顺序
与 'm', 'f' 和 'e' 标记的指定顺序相同。

```
示例 1: 将两个类文件归档到一个名为 classes.jar 的档案中:
       jar cvf classes.jar Foo.class Bar.class
示例 2: 使用现有的清单文件 'mymanifest' 并
           将 foo/ 目录中的所有文件归档到 'classes.jar' 中:
       jar cvfm classes.jar mymanifest -C foo/ .
```

**命令执行样例**

```bash
#!/bin/bash

# f:指定生成文件的文件名
# e:生成可用java -jar 运行的jar包，同时指定main类，这个main类会自动添加到manifest文件中
# C: 切换根目录，如果不写的话，将直接将当前目录当做根目录
# 此种方式不会讲依赖的jar打入jar，即使打入也不会起作用，因为java不会解析
jar -cvfe target/javacmd.jar cn.rectcircle.javacmd.Main -C target/classes .
# 查看内容
jar -tf target/javacmd.jar
#这样无效的，因为-jar指定后 -cp就失效了
java -jar target/javacmd.jar -cp "lib/guava-18.0.jar;lib/commons-lang3-3.3.2.jar"

#解决方案1：使用普通命令运行（这样jar添加main类就失去了意义）
java -cp "target/javacmd.jar;lib/guava-18.0.jar;lib/commons-lang3-3.3.2.jar" cn.rectcircle.javacmd.Main

#解决方案2：打包时手动添加manifest
# m 使用指定文件作为manifest
jar -cvfm javacmd1.jar manifest.txt -C target/classes .
java -jar javacmd1.jar

#解决方案3：使用jar进行将依赖jar进行解包，再打包
mkdir target/libclasses
cd target/libclasses
jar -xf ../../lib/commons-lang3-3.3.2.jar
jar -xf ../../lib/guava-18.0.jar
rm -rf META-INF
cd ../../
jar -cvfe target/javacmd3.jar cn.rectcircle.javacmd.Main -C target/classes . -C target/libclasses .
java -jar target/javacmd3.jar

# 打成普通的jar包
jar -cvf target/javacmd4.jar -C target/classes .
```

**执行之后的目录结构**
```
.
├── javacmd1.jar
├── lib
│   ├── commons-lang3-3.3.2.jar
│   └── guava-18.0.jar
├── make-run.sh
├── manifest.txt
├── package.sh
├── src
│   └── cn
│       └── rectcircle
│           └── javacmd
│               ├── Main.class
│               └── Main.java
└── target
    ├── classes
    │   └── cn
    │       └── rectcircle
    │           └── javacmd
    ├── javacmd3.jar
    ├── javacmd4.jar
    ├── javacmd.jar
    └── libclasses
        ├── com
        │   └── google
        │       ├── common
        │       └── thirdparty
        └── org
            └── apache
                └── commons
```

**相关说明**

* 清单(manifest)文件
	* 标准的Jar文件会包含一个清单文件`META-INF/MANIFEST.MF`，表述Jar的相关信息，主要包含如下内容
		* `Manifest-Version: 1.0` 版本
		* `Created-By: 1.8.0_171 (Oracle Corporation)` 构建工具
		* `Main-Class: cn.rectcircle.javacmd.Main` 选填，主类，当`java -jar`运行起点
		* `Class-Path: lib/guava-18.0.jar lib/commons-lang3-3.3.2.jar` classpath
		* `\r\n` 最后一行一定为此
	* jar 默认会创建清单文件
	* `-M`将不创建清单文件
	* `-m`表示使用指定的件作为清单文件
* jar包内包含jar包，内部的jar将不会解析
* `java -jar`再指定`-cp`将失效，系统的环境变量也会失效
* 当指定`-cp`或`-classpath`，系统的环境变量将失效


