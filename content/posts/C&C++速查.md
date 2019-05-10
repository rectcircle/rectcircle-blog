---
title: C&C++速查
date: 2016-11-28T11:43:48+08:00
draft: false
toc: true
comments: true
aliases:
  - /detail/30
  - /detail/30/
tags:
  - linux
  - 嵌入式开发
---

> 代码优于描述

## 一、多文件依赖

### 样例

#### 样例依赖结构

![c多文件依赖关系](/res/pw1JOTiiTGW1f_ww_G0CoPKR.png)

#### 文件内容

global

```c
//*****************.h*****************
#ifndef _GLOBAL_H_
#define _GLOBAL_H_

#include <cstdio>
int g = 0;

#endif

//*****************.c*****************
#include "global.h"
```

a

```c
//*****************.h*****************
#ifndef _A_H_
#define _A_H_

#include "global.h"
void plus1ByA();

#endif

//*****************.c*****************
#include "a.h"

void plus1ByA() {
	g++;
}
```

b

```c
//*****************.h*****************
#ifndef _B_H_
#define _B_H_

#include "global.h"
void plus1ByB();

#endif

//*****************.c*****************
#include "b.h"

void plus1ByB() {
	g++;
}
```

c

```c
//*****************.h*****************
#ifndef _C_H_
#define _C_H_

#include "a.h"
#include "b.h"

void plus2ByC();
#endif

//*****************.c*****************
#include "c.h"

void plus2ByC() {
	plus1ByA();
	plus1ByB();
}
```

main.c

```c
#include "c.h"

int main() {
	plus2ByC();
	printf("%d\n", g);

	return 0;
}
```

### （0）总结

* 在.h中定义全局变量时，在.h中使用extern声明变量，在.c文件定义初始化变量
* 在其他文件定义结构体变量时，不能在.h中定义，只能在.c定义，若想拓展到全局，使用extern关键字声明变量

### （1）全局变量处理

上面项目会出现重定义错误
将global改为如下

```c
//*****************.h*****************
#ifndef _GLOBAL_H_
#define _GLOBAL_H_

#include <cstdio>
extern int g ;

#endif

//*****************.c*****************
#include "global.h"

int g = 0;
```

这样就不会出错

### （2）定义全局结构体问题

假设在global.h定义一个结构体

```c
typedef struct S
{
	int a;
};
```

那么在所有.h文件中定义一个结构体变量会报重定义错误
如：
a.h

```c
#include "global.h"

S ss; //编译报错
void plus1ByA();

#endif
```

解决方案：

在.c中定义不会报错，想变为全局使用 extern关键字
a.h 和 a.c

```c
//*****************.h*****************
#ifndef _A_H_
#define _A_H_

#include "global.h"

//S ss;
extern S ss; //important
void plus1ByA();

#endif

//*****************.c*****************
#include "a.h"
S ss; //important

void plus1ByA() {
	g++;
}
```

## 二、Linux C网络编程

### 1、示例代码

>直接回环显示发送内容
>http://www.cnblogs.com/xudong-bupt/archive/2013/12/29/3483059.html

#### （1）server

```c
#include <sys/types.h>
#include <sys/socket.h>
#include <stdio.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <unistd.h>
#include <string.h>
#include <stdlib.h>
#include <fcntl.h>
#include <sys/shm.h>

#define MYPORT  8887
#define QUEUE   20
#define BUFFER_SIZE 1024

int main()
{
    ///创建socket
	//参数1：AFINET：IPv4的socket类型
	//参数2：SOCK_STREAM：TCP协议，SOCK_DGRAM：UDP协议
	//参数3：为0
	//返回：-1错误失败，否则为编号
    int server_sockfd = socket(AF_INET,SOCK_STREAM, 0);

    ///定义sockaddr_in，ip地址的信息
    struct sockaddr_in server_sockaddr;
    server_sockaddr.sin_family = AF_INET; //地址族
    server_sockaddr.sin_port = htons(MYPORT); //端口号，接收的端口号
    server_sockaddr.sin_addr.s_addr = htonl(INADDR_ANY); //配置ip地址为：0.0.0.0，即接收所有用户的请求

    ///bind，绑定监听端口，成功返回0，出错返回-1
	//参数1：int类型，socket编号
	//参数2：sockaddr类型，ip地址信息需要强转
	//参数3：int sizeof(server_sockaddr)
    if(bind(server_sockfd,(struct sockaddr *)&server_sockaddr,sizeof(server_sockaddr))==-1)
    {
        perror("bind");
        exit(1);
    }

    ///listen，监听，成功返回0，出错返回-1
		//参数1：int类型socket编号，
		//参数2：int 同时能处理的最大连接要求
    if(listen(server_sockfd,QUEUE) == -1)
    {
        perror("listen");
        exit(1);
    }

    ///客户端套接字
    char buffer[BUFFER_SIZE]; //缓存
    struct sockaddr_in client_addr; //客户端地址
    socklen_t length = sizeof(client_addr); //客户端地址长度

    ///成功返回非负描述字，出错返回-1
		//接受一个连接
		//参数1：socket 编号
		//参数2：用于存放客户端地址信息
		//参数3：socklen_t* 客户端地址长度
    int conn = accept(server_sockfd, (struct sockaddr*)&client_addr, &length);
    if(conn<0)
    {
        perror("connect");
        exit(1);
    }

    while(1)
    {
        memset(buffer,0,sizeof(buffer)); //清空缓存
				//接收客户端发送数据
				//参数1：连接编号，
				//参数2：缓存数据，
				//参数3：缓存长度，
				//参数4：一般设为0
        int len = recv(conn, buffer, sizeof(buffer),0);
        if(strcmp(buffer,"exit\n")==0)
            break;
        fputs(buffer, stdout);
				//向客户端发送数据
        send(conn, buffer, len, 0);
    }
		//关闭连接
    close(conn);
		//关闭socket 监听
    close(server_sockfd);
    return 0;
}
```

### （2）client

```c
#include <sys/types.h>
#include <sys/socket.h>
#include <stdio.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <unistd.h>
#include <string.h>
#include <stdlib.h>
#include <fcntl.h>
#include <sys/shm.h>

#define MYPORT  8887
#define BUFFER_SIZE 1024

int main()
{
    ///定义sockfd
    int sock_cli = socket(AF_INET,SOCK_STREAM, 0);

    ///定义sockaddr_in
    struct sockaddr_in servaddr;
    memset(&servaddr, 0, sizeof(servaddr));
    servaddr.sin_family = AF_INET;
    servaddr.sin_port = htons(MYPORT);  ///服务器端口
    servaddr.sin_addr.s_addr = inet_addr("127.0.0.1");  ///服务器ip

    ///连接服务器，成功返回0，错误返回-1
    if (connect(sock_cli, (struct sockaddr *)&servaddr, sizeof(servaddr)) < 0)
    {
        perror("connect");
        exit(1);
    }

    char sendbuf[BUFFER_SIZE];
    char recvbuf[BUFFER_SIZE];
    while (fgets(sendbuf, sizeof(sendbuf), stdin) != NULL)
    {
        send(sock_cli, sendbuf, strlen(sendbuf),0); ///发送
        if(strcmp(sendbuf,"exit\n")==0)
            break;
        recv(sock_cli, recvbuf, sizeof(recvbuf),0); ///接收
        fputs(recvbuf, stdout);

        memset(sendbuf, 0, sizeof(sendbuf));
        memset(recvbuf, 0, sizeof(recvbuf));
    }

    close(sock_cli);
    return 0;
}
```

## 三、Linux C多进程

```c
#include <unistd.h>
#include <stdio.h>

int main()
{
	pid_t fpid; //fpid表示fork函数返回的值  
	int count = 0;
	fpid = fork();
	if (fpid < 0)
		printf("error in fork!");
	else if (fpid == 0) {
		printf("i am the child process, my process id is %d\n", getpid());
		printf("我是爹的儿子\n");//对某些人来说中文看着更直白。  
		count++;
	}
	else {
		printf("i am the parent process, my process id is %d\n", getpid());
		printf("我是孩子他爹\n");
		count++;
	}
	printf("统计结果是: %d\n", count);
	return 0;
}
```

输出

```
i am the child process, my process id is 5574
我是爹的儿子
统计结果是: 1
i am the parent process, my process id is 5573
我是孩子他爹
统计结果是: 1
```

## 四、Linux C多线程

http://www.cnblogs.com/chenyadong/archive/2011/10/25/2223610.html

### 1、函数、结构说明

#### （1）`pthread_t` 线程标识符

pthread_t在头文件/usr/include/bits/pthreadtypes.h中定义：

```c
typedef unsigned long int pthread_t;
```

#### （2）`pthread_create`创建线程

```c
/**
* @param thread 线程标识符指针
* @param attr 线程属性
* @param f 入口函数指针
* @param arg 入口函数参数
* @return int 0为创建成功，否则失败
*/
int pthread_create(
	pthread_t* thread,
	pthread_attr_t * attr,
	void *(*__start_routine) (void *) f,
	void * arg
	);
```

设置线程属性：

* 设置是否绑定`pthread_attr_setscope(pthread_attr_t *attr,int scope)`
	* `PTHREAD_SCOPE_SYSTEM`（绑定的）
	* `PTHREAD_SCOPE_PROCESS`（非绑定的）
* 设置分离状态`pthread_attr_setdetachstate（pthread_attr_t *attr, int detachstate）`
	* PTHREAD_CREATE_DETACHED（分离线程）：它没有被其他的线程所等待，自己运行结束了，线程也就终止了，马上释放系统资源
	* PTHREAD _CREATE_JOINABLE（非分离线程，默认）：只有当pthread_join（）函数返回时，创建的线程才算终止，才能释放自己占用的系统资源
	* 这里要注意的一点是，如果设置一个线程为分离线程，而这个线程运行又非常快，它很可能在pthread_create函数返回之前就终止了，它终止以后就可能将线程号和系统资源移交给其他的线程使用，这样调用pthread_create的线程就得到了错误的线程号。要避免这种情况可以采取一定的同步措施，最简单的方法之一是可以在被创建的线程里调用pthread_cond_timewait函数，让这个线程等待一会儿，留出足够的时间让函数pthread_create返回。
* 线程优先级`sched_param`
	* `#include <sched.h>`
	* `sched_param param;pthread_attr_t attr;`
	* `param.sched_priority=20;`
	* `pthread_attr_setschedparam(&attr, &param);`

**线程是否绑定例子**

```c
#include <pthread.h>
pthread_attr_t attr; //创建线程属性
pthread_t tid; /*初始化属性值，均设为默认值*/
pthread_attr_init(&attr); //初始化
pthread_attr_setscope(&attr, PTHREAD_SCOPE_SYSTEM); //设置线程属性
pthread_create(&tid, &attr, (void *) my_function, NULL);
```

**设置线程优先级例子**

```c
#include <pthread.h>
#include <sched.h>
pthread_attr_t attr;
pthread_t tid;
sched_param param; //线程优先级
int newprio=20;
pthread_attr_init(&attr);
pthread_attr_getschedparam(&attr, &param); //获取默认线程优先级
param.sched_priority=newprio; //设置优先级
pthread_attr_setschedparam(&attr, &param); //写入线程属性属性
pthread_create(&tid, &attr, (void *)myfunction, myarg);
```

#### （3）`pthread_join` 等待一个线程的结束

```c
/**
* @param id 线程要等待的线程标识符
* @param thread_return 线程入口函数返回值
* @return int 0为成功，否则失败
*/
int pthread_join(
	pthread_t id,
	void **thread_return);
```

#### （4）`pthread_exit` 结束一个线程

```c
/**
* @param thread_return 线程返回值，将传递给pthread_join的第二个参数
*/
void pthread_exit(
	thread_return
);
```

### 2、线程数据

* 创建键 `pthread_once (pthread_once_t*once_control, void (*initroutine) (void))` ;
	* 第二个参数为一个函数调用`pthread_keycreate(pthread_key_t *key, void (*__destr_function) (void *));`
		* 第二个参数为线程结束时的清空内存函数
* 初始化数据
* 绑定数据`pthread_setpecific (pthread_key_t *key, 创建数据指针);`

#### （1）实例

```c
/* 声明一个键*/
pthread_key_t myWinKey;

/* 函数 createWindow */
void createWindow ( void )
{
　　Fl_Window * win;
　　static pthread_once_t once= PTHREAD_ONCE_INIT;
　　/* 调用函数createMyKey，创建键*/
　　pthread_once ( &once, createMyKey) ;
　　/*win指向一个新建立的窗口*/
　　win=new Fl_Window( 0, 0, 100, 100, "MyWindow");
　　/* 对此窗口作一些可能的设置工作，如大小、位置、名称等*/
　　setWindow(win);
　　/* 将窗口指针值绑定在键myWinKey上*/
　　pthread_setpecific ( myWinKey, win);
}

/* 函数 createMyKey，创建一个键，并指定了destructor */
void createMyKey ( void )
{
　　pthread_keycreate(&myWinKey, freeWinKey);
}

/* 函数 freeWinKey，释放空间*/
void freeWinKey ( Fl_Window * win)
{
　　delete win;
}
```

#### （2）说明

* 线程数据类似全局变量声明
* 在不同线程中，数据是不同的
* 在线程结束后会被销毁

### 3、互斥锁

* 创建锁对象`pthread_mutex_t mutex;`
* 初始化所对象`pthread_mutex_init (&mutex,NULL);`
* 锁定`pthread_mutex_lock (&mutex);`
* 打开`pthread_mutex_unlock(&mutex);`

#### （2）实例

```c
void reader_function ( void );
void writer_function ( void );
char buffer;
int buffer_has_item=0;
pthread_mutex_t mutex;
struct timespec delay;
void main ( void )
{
　　pthread_t reader;
　　/* 定义延迟时间*/
　　delay.tv_sec = 2;
　　delay.tv_nec = 0;
　　/* 用默认属性初始化一个互斥锁对象*/
　　pthread_mutex_init (&mutex,NULL);
　　pthread_create(&reader, pthread_attr_default, (void *)&reader_function), NULL);
　　writer_function( );
}

void writer_function (void)
{
　　while(1) {
　　　　/* 锁定互斥锁*/
　　　　pthread_mutex_lock (&mutex);
　　　　if (buffer_has_item==0) {
　　　　　　buffer=make_new_item( );
　　　　　　buffer_has_item=1;
　　　　}
　　　　/* 打开互斥锁*/
　　　　pthread_mutex_unlock(&mutex);
　　　　pthread_delay_np(&delay);
　　}
}

void reader_function(void)
{
　　while(1) {
　　　　pthread_mutex_lock(&mutex);
　　　　if(buffer_has_item==1)
　　　　{
　　　　　　consume_item(buffer);
　　　　　　buffer_has_item=0;
　　　　　}
　　　　pthread_mutex_unlock(&mutex);
　　　　pthread_delay_np(&delay);
　　}
}
```

## 五、C语言作用域详解

### 1、`.h` `.c`文件的职责

#### （1）`.h`头文件

* 函数变量的**声明**（使用`extern`来拓展作用域）
* 宏声明
* 结构体声明
* `#include`其他组件

#### （2）`.c`源代码文件

* 函数实现
* 变量定义
* `#include`对应的`.h`文件

### 2、C语言变量的储存类型

* 自动的（`auto`）
* 静态的（关键字`static`，定义时使用）
* 寄存器的（`register`）
* 外部的（关键字`extern`，声明时使用，定义时不必使用）

#### （0）普通全局变量

函数外部定义的变量

* 文件内部，自定义处起，具有全部可见性，可以看到变量的一切；
* 在文件外部使用必须使用`extern`关键字进行声明
* 在文件外部即使没有使用也不能定义同名的变量，否则报重定义错误

`a.h`

```c
#ifndef _A_H_
#define _A_H_

#endif
```

`a.c`文件

```c
#include "a.h"
int a = 1;
```

`main.c`文件

```c
#include "a.h"
#include <stdio.h>

int main(){
	printf("%d\n",a);
	return 0;
}
```

编译`gcc a.c main.c -o test1` **报错**
解决：在使用前使用`extern int a;`来声明来使变量`a`可见（可以在a.h也可以在main.c）

#### （1）`auto`类型（最常用，最普通的局部变量）

不用`static`修饰的局部变量类型，是最常用的

#### （2）`static`类型

**静态局部变量**（不建议使用）
可见范围=普通全局变量；生命周期=全局变量

```c
#include <stdio.h>

void add(){
	static int n = 0; //仅在编译器执行赋值
	printf("%d ",n++);
}

int main(){
	add();
	add();
	add();
	add();
}
//输出：0 1 2 3
```

特点：

* 作用域和普通局部变量相同
* 生命周期为程序全程
* 赋值操作仅仅执行一次

**静态局部变量**

* 仅在本文件内可见，在文件外不可见
* 即使在文件外也无法使用`extern`来声明

`a.h`

```c
#ifndef _A_H_
#define _A_H_
extern int a;
#endif
```

`a.c`文件

```c
#include "a.h"
static int a = 1;
```

`main.c`文件

```c
#include "a.h"
#include <stdio.h>

int main(){
	printf("%d\n",a);
	return 0;
}
```

编译`gcc a.c main.c -o test1` **报错**，static变量不能使用extern来声明

### 3、函数的`static`和`extern`声明

* 函数的定义过程中默认使用的是extern声明，所以在全局可见可访问
* static声明函数仅在定义的文件位置可见，外部文件不可访问
* 函数定义前使用必须声明

`a.h`

```c
#ifndef _A_H_
#define _A_H_
//注意在此没有声明
#endif
```

`a.c`文件

```c
#include "a.h"
#include <stdio.h>
static int a=1;

void printA(){
	printf("%d\n",a);
}
```

`main.c`文件

```c
#include "a.h"
#include <stdio.h>

int main(){
	printA();
	return 0;
}
```

编译`gcc a.c main.c -o test1` **正确**

## 六、Makefile文件

### 1、gcc命令

#### （1）测试代码

```c
//test.c
#include <stdio.h>
int main(void)
{
    printf("Hello World!\n");
    return 0;
}
```

#### （2）编译过程

* 预处理阶段 Preprocessing
* 编译 Compilation
* 汇编 Assembly
* 链接 Linking

#### （3）直接编译成可执行程序

```bash
gcc test.c -o test
```

#### （4）预处理阶段

```bash
#预处理后输出到test.i中
gcc -E test.c -o test.i
#预处理后直接输出到控制台
gcc -E test.c
```

#### （5）生成汇编代码

```bash
#将预处理后的代码生成汇编代码
gcc -S test.i -o test.s
##从源代码生成汇编代码
gcc -S test.c -o test.s
```

#### （6）汇编阶段

```bash
#从汇编代码生成目标代码
gcc -c test.s -o test.o
#从预处理后的代码生成目标代码
gcc -c test.i -o test.o
#从源代码生成目标代码
gcc -c test.c -o test.o
```

#### （7）链接阶段

```bash
#从汇编后的目标代码生成可执行程序
gcc test.o -o test
```

#### （8）多文件编译

* 对每个`.c`文件生成目标代码
* 进行目标代码进行链接

```bash
gcc -c test1.c -o test1.o
gcc -c test2.c -o test2.o
gcc test1.o test2.o -o test
```

#### （9）检错

```bash
#-pedantic选项能够帮助程序员发现一些不符合 ANSI/ISO C标准的代码，但不是全部
gcc -pedantic illcode.c -o illcode
#GCC产生尽可能多的警告信息
gcc -Wall illcode.c -o illcode
#GCC会在所有产生警告的地方停止编译
gcc -Werror test.c -o test
```

#### （10）库文件链接

```bash
#-I 编译成目标代码阶段 指定头文件路径
gcc –c -I /usr/dev/mysql/include test.c -o test.o
#–L 链接阶段 指定库文件
gcc -L /usr/dev/mysql/lib -lmysqlclient test.o -o test
#强制使用静态链接库
gcc -L /usr/dev/mysql/lib -static –lmysqlclient test.o -o test
```

### 2、动态链接库和静态链接库

* 静态链接，程序在运行后不会依赖系统函数库，自身拥有一份拷贝
* 动态链接，程序在运行时加载库函数，依赖库函数

#### （0）测试代码

文件结构

```
libtest/
 |-- myjob.c
 |-- myjob.h
 |-- test.c
```

代码内容

```c
//myjob.h
#ifndef _MYJOB_H_
#define _MYJOB_H_

int plusOne(int );

#endif


//myjob.c
#include "myjob.h"

int plusOne(int a){
	return a+1;
}


//test.c
#include <stdio.h>
#include <myjob.h>

int main(void){
	int a = 0;
	printf("0+1=%d\n",plusOne(a));
	return 0;
}
```

#### （1）编译、使用静态库

将库源代码代码编译成静态库

```bash
#生成目标代码
gcc  -c  myjob.c    -o  myjob.o
#制作成静态库
ar  -c -r -s  libmyjob.a  myjob.o
```

用户程序使用静态库

```bash
#编译成目标代码
gcc -c -I ./ test.c -o test.o
#链接，生成目标程序
gcc  test.o  libmyjob.a  -o  test
```

#### （2）编译、使用动态库

将库源代码代码编译成动态库

```bash
gcc  -Wall -fPIC    -c  myjob.c    -o  myjob.o
gcc -shared -fPIC -o libmyjob.so myjob.o
#输出的动态库名要以lib开头
#-shared:  该选项指定生成动态连接库（让连接器生成T 类型的导出符号表，有时候也生成弱连接 W 类型的导出符号），不用该标志外部程序无法连接。相当于一个可执行文件。
#-fPIC： 表示编译为位置独立的代码，不用此选项的话编译后的代码是位置相关的所以动态载入时是通过代码拷贝的方式来满足不同进程的需要，而不能达到真正代码段共享的目的。
#-L.： 表示要连接的库在当前目录中。
#LD_LIBRARY_PATH： 这个环境变量指示动态连接器可以装载动态库的路径。
```

用户程序使用动态库
方式1

```bash
#将动态链接库添加到系统库文件中
cp libmyjob.so /usr/lib
#直接编译运行
gcc -o test test.o -lmyjob
#-l[lib_name]  指定库名
# -I /include路径 (include)指定额外的头文件搜索路径
# -L /动态库路径

#查看程序引用库情况
ldd test

#运行
./test
```

方式2

```bash
#指定动态库路径
gcc -o test test.o -lmyjob -B /path/to/lib
#-B添加动态库搜索路径
#-l[lib_name]  指定库名

#配置库位置到配置文件
#echo "/path/to/lib" >> /etc/ld.so.conf && ldconfig
#或者指定路径的全局变量
#export LD_LIBRARY_PATH=$LD_LIBRARY_PATH:/path/to/lib
#或者在gcc链接时指定-rpath（或-R ）运行时动态库路径
#查看库引用情况
ldd test

运行
test
```

### 3、Makefile说明

> http://blog.csdn.net/liang13664759/article/details/1771246
> http://blog.csdn.net/haoel/article/details/2886
> https://www.cnblogs.com/wang_yb/p/3990952.html

#### （1）规则

```
#注释
target : components　　
[Tab]command

#/：换行符，表示下一行任然是这一行的延续
#标签通过 make 标签 执行
clean:
rm target1 target2 ...
```

* target：是一个目标文件（`.o`文件，可执行文件，或者标签Label）
* components：组件，要生成那个target所需要的文件
* command：也就是make需要执行的命令。（任意的Shell命令）

#### （2）使用

* 创建Makefile文件，并编写规则
* 执行`make`命令
	* make在当前目录查找Makefile
	* 如果找到，它会找文件中的第一个目标文件（target）
	* 如果这个target文件不存在，或是他所依赖的 .o 文件的文件修改时间要比他这个文件新
	* 如果这个target所依赖的.o文件也不存在，那么make会在当前文件中找目标为.o文件的依赖性，如果找到则再根据那一个规则生成.o文件。（这有点像一个堆栈的过程）
* 若果出错直接退出
* 对于标签，如clean 则通过`make clean`执行
* 根据make执行过程，修改过的文件会重新编译

#### （3）变量

makefile的变量就是字符串，处理类似C语言的宏，简单替换

```
#定义
varName = val
#使用
$(varName)
```

#### （4）make自动推导

make看到一个`.o`文件，就会自动同名的`.c`文件添加到依赖关系，并命令也会推导出来。
所以，可以省略同名的`.c`和编译命令，只要写`.h`依赖就可以了

```
#...
main.o : defs.h
kbd.o : defs.h command.h
#...
```

将具有相同的依赖的头文件的`.o`写在一起

```
kbd.o command.o files.o : command.h
display.o insert.o search.o files.o : buffer.h
```

#### （5）清空目标文件的规则

```
.PHONY : clean
clean :
-rm edit $(objects)
```

#### （6）自动生成依赖关系

```bash
#包括系统依赖
gcc -M main.c
#不包括系统依赖
gcc -MM main.c
```

#### （7）常用变量

Makefile有三个非常有用的变量。分别是`$@`，`$^`，`$<`代表：

* `$@` 目标文件
* `$^` 所有的依赖文件
* `$<` 第一个依赖文件

#### （8）缺省规则

这个规则表示所有的 .o文件都是依赖与相应的.c文件的。

```
.c.o:
	gcc -c $<
```

### 4、Makefile样例

#### （1）测试文件

目录结构

```
.
├── a.c
├── a.h
├── b.c
├── b.h
├── main.c
```

内容

```c
//a.h
#ifndef _A_H_
#define _A_H_
void printA();
#endif

//a.c
static int a=1;

void printA(){
	printf("%d\n",a);
}

//b.h
#ifndef _B_H_
#define _B_H_
extern int b;
void printB();
#endif

//b.c
#include "b.h"
#include <stdio.h>
int b=2;

void printB(){
	printf("%d\n",b);
}

//main.c
#include "a.h"
#include "b.h"
#include <stdio.h>

int main(){
	printA();
	printB();
	b++;
	printB();
	return 0;
}
```

#### （2）各个版本的`Makefile`文件

版本1

```
#第一种写法
main:main.o a.o b.o
	gcc main.o a.o b.o -o main

main.o:main.c a.h b.h
	gcc -c main.c
a.o:a.c a.h
	gcc -c a.c
b.o:b.c b.h
	gcc -c b.c

clean:
	rm -rf *.o main
```

版本1

```
#第二种写法，使用特殊符号
#$@       目标文件
#$^       所有的依赖文件
#$<       第一个依赖文件
main:main.o a.o b.o
	gcc -o $@ $^

main.o:main.c a.h b.h
	gcc -c $<
a.o:a.c a.h
	gcc -c $<
b.o:b.c b.h
	gcc -c $<

clean:
	rm -rf *.o main

```

版本3

```
#第三种写法，使用.c.o缺省规则
#$@       目标文件
#$^       所有的依赖文件
#$<       第一个依赖文件
main:main.o a.o b.o
	gcc -o $@ $^

.o.c:
	gcc -c $<

clean:
	rm -rf *.o main
```

### 5、autotools自动生成Makefile

> http://blog.csdn.net/scucj/article/details/6079052
