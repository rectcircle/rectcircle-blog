---
title: gdb 调试工具
date: 2017-04-06T21:24:47+08:00
draft: false
toc: false
comments: true
aliases:
  - /detail/57
  - /detail/57/
tags:
  - linux
---

## 目录
* [一、使用步骤](#一、使用步骤)
* [二、常用命令](#二、常用命令)
* [三、样例](#三、样例)


## 一、使用步骤
*********************************
### 1、编译源代码
> `gcc|g++ 源文件 -o 目标文件 -g` `-g`表示将源代码信息编译到可执行文件中


```bash
#c程序
gcc gdb-sample.c -o gdb-sample -g
#c++程序
g++ gdb-sample.cpp -o gdb-sample -g
```

### 2、进入gdb命令行
```bash
gdb
file gdb-sample #加载程序文件
```

## 二、常用命令
***********************************
### 1、加载程序命令
```gdb
file 源文件名
```

### 2、运行加载的程序
```gdb
r
```

### 3、Continue，继续执行，停到下一个断点
```gdb
c
```

### 4、添加断点
#### （1）`b 行号|函数名|*代码地址`Breakpoint的简写，设置断点
会产生一个断点标号，从0开始递增
```gdb
b 行号|函数名|*代码地址
```

#### （2）`d 断点标号` Delete breakpoint删除断点
```gdb
d 断点标号
```


### 5、单步进入Step Into（vs F11）
```gdb
s
```

### 6、单步跟踪Step Over（vs F10）
```gdb
n
```

### 7、汇编的`s`、`n`；`si`、`ni`

### 8、输出变量的值
```gdb
p <变量名称>
```

### 9、显示各类信息，Info的简写
```gdb
i
```

### 10、退出
```gdb
q
```


### 11、帮助命令
```gdb
help [命令名称]
```

## 三、样例
****************************
### 1、测试源码
gdb-sample.c
```c
#include <stdio.h>

int nGlobalVar = 0;

int tempFunction(int a, int b)
{
    printf("tempFunction is called, a = %d, b = %d /n", a, b);
    return (a + b);
}

int main()
{
    int n;
    n = 1;
    n++;
    n--;

    nGlobalVar += 100;
    nGlobalVar -= 12;

    printf("n = %d, nGlobalVar = %d /n", n, nGlobalVar);

    n = tempFunction(1, 2);
    printf("n = %d", n);

    return 0;
}
```

### 2、测试命令
```gdb
gcc gdb-sample.c -o gdb-sample -g
gdb
file gdb-sample
r
b main
r
s
p n
b 26
c
p nGlobalVar
c
p a
p b
c
display /i $pc
r
si
si
d
b *main
r
i r
i r eax
q
```

