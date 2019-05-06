---
title: UNIX高级编程（二）
date: 2018-06-12T23:36:59+08:00
draft: false
toc: false
comments: true
aliases:
  - /detail/154
  - /detail/154/
tags:
  - linux
---

### 4.5 进程标识符
* 每个进程都有一个非负整型表示的唯一进程ID
* 进程ID总是唯一的
* 当进程终止后，其ID值可以重用
* 在unix中
  * ID为0的进程：调度进程，称为swapper
  * ID为1的进程：init进程，自举过程结束时由内核调用
  * ID为2的进程：页守护进程，负责支持虚拟存储系统的分页操作


* 获取进程常见标识符
  * 调用进程的进程ID：`pid_t getpid();`
  * 调用进程的父进程ID：`pid_t getppid();`
  * 调用进程的实际用户ID：`uid_t getuid();`
  * 调用进程的有效用户ID：`uid_t geteuid();`
  * 调用进程的实际组ID：`gid_t getgid();`
  * 调用进程的有效组ID：`gid_t getegid();`
* 查看进程情况
  * `ps -ef | less`

### 4.6 fork等函数

```c
pid_t fork(void);
```
* `@return`
  * fork函数调用一次，但是返回两次
  * 在子进程中返回0，在父进程中返回子进程ID，出错返回-1
  * 通过返回值，可以确定是在父进程还是子进程中


* 子进程和父进程继续执行fork调用之后的指令
* 子进程是父进程的副本
  * 子进程获得父进程数据空间、堆和栈的副本
  * 父子进程并不共享这些存储空间
  * 父子进程共享正文段（只读的）
* 为了提高效率，fork后不并立即复制父进程空间，采用了COW（Copy-On-Write）
  * 当父子进程任意之一，要修改数据段、堆、栈时，进行复制操作，但仅复制修改区域

常用用法：子进程从fork返回后，立即调用exec执行另外一个程序


```c
pid_t vfork(void);
```
* vfork与fork的函数原型相同，但两者的语义不同
* vfork用于创建新进程，而该新进程的目的是exec一个新程序（执行一个可执行的文件）
* 由于新程序将有自己的地址空间，因此vfork函数并不将父进程的地址空间完全复制到子进程中。
* 子进程在调用exec或exit之前，在父进程的地址空间中运行
* vfork函数保证子进程先执行，在它调用exec或者exit之后，父进程才可能被调度执行


#### 4.6.1 父进程在fork之前new了一个对象，子进程需要delete它吗？
需要，因为写时复制，他们指向不同数据空间


#### 4.6.2 父进程在fork之前open的文件，子进程需要close文件描述符吗？
需要，因为共享文件对象若仅在父进程关闭，无法真正关闭文件，只是减少一个引用。从而造成资源浪费


#### 4.6.3 为什么write调用的输出只有一次，而printf调用的输出出现了两次？（输出到文件）
* write调用是不带用户空间缓冲的。在fork之前调用write，其数据直接写到了标准输出上
* 标准I/O库是带缓冲的，当标准输出连接到终端设备时，它是行缓冲，否则为全缓冲。
* 当printf输出到终端设备时，由于遇到换行符，因此缓冲被刷。子进程的数据空间中无缓冲内容
* 当重定向到文件时，变为全缓冲。fork后，子进程的数据空间中也有内容。所以输出两次

#### 4.6.4 子进程中，变量的值改变了；而父进程中，变量的值没有改变。原因？
不会，写时复制


#### 4.6.5 父子进程文件的什么内容？

共享文件对象，包括文件标志，文件偏移量。所以对同一个文件操作会有冲突。

解决冲突：各自进程负责各自的文件操作关闭不需要文件描述符



#### 4.6.6 子进程中对glob、var加1操作，结果改变了父进程中的变量值。原因？
说明vfork没有复制父进程的变量空间，是共享的，率先执行直到执行到exec或者exit父进程才会得到调度



### 4.7 exit函数
* 正常终止
  * 从main返回
  * 调用exit：ISO C定义
  * 调用_exit或_Exit：前者由ISO C定义，后者由POSIX.1定义
  * 最后一个线程从其启动例程返回
  * 最后一个线程调用pthread_exit
* 异常终止
  * 调用abort：产生SIGABRT信号
  * 接到某些信号
  * 最后一个线程对取消请求做出响应



* 不管进程如何终止，最后都会执行内核中的同一段代码：为相应进程关闭所有打开描述符，释放内存等等
* 若父进程在子进程之前终止了，则子进程的父进程将变为init进程，其PID为1；保证每个进程都有父进程


#### 4.7.1 当子进程先终止，父进程如何知道子进程的终止状态（exit(5)）？
* 内核为每个终止子进程保存了终止状态等信息
* 父进程调用wait等函数，可获取该信息

* 当父进程调用wait等函数后，内核将释放终止进程所使用的所有内存，关闭其打开的所有文件
* 对于已经终止、但是其父进程尚未对其调用wait等函数的进程，被称为僵尸进程


#### 4.7.2 对于父进程先终止，而被init领养的进程会是僵尸进程吗？

不会，init对每个终止的子进程，都会调用wait函数，获取其终止状态


### 4.8 wait等函数
* 当一个进程正常获知异常终止时，内核就向其父进程发送SIGCHLD信号
* 父进程可以选择忽略该信号，也可以提供信号处理函数
* 系统的默认处理方式：忽略该信号

**等待子进程结束**

```c
pid_t wait(int *statloc);
```
* `statloc`：可用于存放子进程的终止状态，可以为NULL
* `@return`：若成功返回终止进程ID，出错返回-1

作用：
* 调用wait函数之后，进程可能出现的情况
  * 如果所有子进程都还在运行，则阻塞等待，直到有一个子进程终止，wait函数才返回
  * 如果一个子进程已经终止，正等待父进程获取其终止状态，则wait函数会立即返回
  * 若进程没有任何子进程，则立即出错返回
* 注意：若接收到信号SIGCHLD后，调用wait，通常wait会立即返回

获取终止状态
* WIFEXITED(status)
* WIFSIGNALED(status)
* WIFSTOPPED(status)
* WIFCONTINUED(status)


**等待指定进程结束**
```c
pid_t waitpid(pid_t pid, int *statloc, 
               int options);
```
* `pid`
  * `pid==-1` 等待任一子进程，同wait
  * `pid>0` 等待进程ID为pid的子进程
  * `pid==0` 等待其组ID等于调用进程组ID的任一子进程
  * `pid<-1` 等待其组ID等于pid绝对值的任一子进程
* `statloc`：存放子进程终止状态
* `options`：可以为0，也可以是以下常量或运算的结果
  * WCONTINUED
  * WUNTRACED
  * WNOHANG：若pid指定的子进程并不是立即可用的，则waitpid不阻塞，此时其返回0
* `@return`：成功返回进程ID，失败返回-1

**其他wait**
* `wait3`
* `wait4`

#### 4.8.1 waitpid提供了哪些wait没有的功能？
* waitpid可等待一个特定的进程，而wait则返回任一终止子进程的状态
* waitpid提供了一个wait的非阻塞版本。有时用户希望取得一个子进程的状态，但不想阻塞
* waitpid支持作业控制

#### 4.8.2 需求?
如果一个进程fork了一个子进程，但不要它等待子进程终止，也不希望子进程处于僵死状态直到父进程终止（也就是说让子进程脱离父进程掌控，子进程退出后可以直接回收而不是等待父进程结束）

技巧：调用fork进程两次



### 4.9 exec等函数
用于执行一个可执行程序，使用本进程的PCB，所以前后的进程ID并未改变。exec只是用一个全新的程序替换了当前进程的正文、数据、堆和栈段


**一组函数**
```c
int execl(const char *pathname, 
      const char *arg0, .../*(char*)0*/);
int execv(const char *pathname, 
            char *const argv[]);
int execle(const char *pathname, 
      const char *arg0, 
      .../* (char*)0, char *const envp[] */);
int execve(const char *pathname, 
   char *const argv[], char *const envp[]);
int execlp(const char *filename,
      const char *arg0, .../* (char*)0*/);
int execvp(const char *filename, 
               char *const argv[]);
```

* `l` 表示每个命令行参数的传递方式为一个参数
* `v` 表示将命令行参数放到数组中一次传递
* `e` 调用者提供环境变量列表（数组方式）
* `p` 通过环境变量的PATH查找可执行文件

#### 4.9.1 以上六个函数是什么关系？那个是内核提供的，那些是封装？

execve是系统调用，其他是封装

```
execlp    execl    execle
  |         |        |
  v         v        v
execvp -> execv -> execve
```


### 4.10 用户ID和组ID

* 系统的权限检查是基于用户ID(UID)或组ID(GID)
* 当程序需要增加特权，或需要访问当前并不允许访问的资源时，需要更换自己的用户ID或组ID
* 可以用setuid设置实际用户ID和有效用户ID；setgid设置实际组ID和有效组ID

```c
uid_t getuid(); //获取实际用户ID
int setuid(uid_t uid); //同时设置实际UID（谁调用）和有效UID
int setgid(gid_t gid); 
```

更改规则;
* 若进程具有超级用户权限，则setuid将实际用户ID、有效用户ID、保存的设置用户ID设置为uid
* 若进程没有超级用户权限，但uid等于实际用户ID或保存的设置用户ID，则setuid只将有效用户ID设置为uid，不改变实际用户ID和保存的设置用户ID
* 若以上条件不满足，返回-1，errno设为EPERM

也就是说
* 只有超级用户进程可以更改实际用户ID
  * 实际用户ID是在用户登录时，由login程序设置的
  * login是一个超级用户进程，当它调用setuid时，会设置所有三个用户ID
* 仅当对程序文件设置了设置用户ID位时，exec才会设置有效用户ID。任何时候都可以调用setuid，将有效用户ID设置为实际用户ID或保存的设置用户ID
* 保存的设置用户ID是由exec复制有效用户ID而得来的


例子：man手册
* man程序文件是由名为man的用户拥有的，且设置用户ID位已设置。当执行exec此程序时，用户ID：
  * 实际用户ID＝我们的用户ID
  * 有效用户ID＝man
  * 保存的设置用户ID＝man
* 当man执行我们的命令，他将调用`setuid(getuid())`
  * 实际用户ID＝我们的用户ID
  * 有效用户ID＝我们的用户ID
  * 保存的设置用户ID＝man
  * 这就意味着，可以在man中使用自己的权限执行程序
* 当man需要对其手册页进行访问时，又需要将其有效用户ID改为man，man调用`setuid(man)`
  * 实际用户ID＝我们的用户ID
  * 有效用户ID＝man
  * 保存的设置用户ID＝man


总结：
* `实际用户ID`和`保存用户ID`是有效用户ID的可选值
* `实际用户ID`代表实际运行程序的用户UID
* `保存用户ID`代表该程序的所有者UID，拷贝自`有效用户ID`
  * 当设置了`设置用户ID位`启动（exec）之后，`保存用户ID==有效用户ID==可执行程序的所有者`

几种用户ID变化情况：
* exec执行后的情况
  * `设置用户ID位` 未设置
    * `实际用户ID` 不变
    * `有效用户ID` 不变
    * `保存用户ID` 从 `有效用户ID` 拷贝
  * `设置用户ID位` 已设置
    * `实际用户ID` 不变
    * `有效用户ID` 应用程序文件所有者ID
    * `保存用户ID` 从 `有效用户ID` 拷贝
* `setuid(uid)` 执行之后的情况
  * `root权限`
    * `实际用户ID` = `uid`
    * `有效用户ID` = `uid`
    * `保存用户ID` = `uid`
  * `普通权限`
    * 若`uid==实际用户ID|有效用户ID`
      * `实际用户ID` 不变
      * `有效用户ID` = uid
      * `保存用户ID` 不变
    * 否则
      * 报错


### 4.11 system函数
执行一个外部命令，并等待结束
```c
int system(const char* cmdstring);
```

* system是通过fork、exec、waitpid等实现的，因此有三种返回值
  * 即fork失败，exec失败，waitpid失败


### 4.12 进程会计

包含命令名，CPU时间总量，用户ID和组ID，启动时间等等


### 4.13 用户标识
```c
char *getlogin();
```

* 调用此函数的进程没有连接到用户登录时所用的终端，则本函数会失败，返回NULL
* 这种进程通常称为守护进程
* 成功返回登录名


### 4.14 获取进程时间
```c
clock_t times(struct tms *buf);
struct tms {
    clock_t tms_utime; //用户CPU时间
    clock_t tms_stime; //系统CPU时间
    ...............
};
```



### 4.15 进程关系
**进程组**
* 每个进程除了有一个进程ID外，还属于一个进程组
* 进程组是一个或多个进程的集合。通常，它们与同一作业关联，可以接收来自同一终端的各种信号。
* 每个进程组有一个唯一的进程组ID
* 每个进程组都可以有一个组长进程；组长进程的标识是：其进程组ID等于组长进程ID
* 只要进程组中还有一个进程存在，则进程组就存在，与组长进程存在与否无关
* 从进程组创建开始，到其中最后一个进程离开为止的时间区间，称为进程组的生存期
* 进程组中的最后一个进程可以终止，或者转移到另一个进程组


加入一个现有的进程组或者创建一个新进程组
```c
int setpgid(pid_t pid, pid_t pgid);
```
* 该函数将进程ID为pid的进程的进程组ID，设置为pgid
* 若pid=pgid，则pid代表的进程将变为进程组长
* 若pid=0，则使用调用者的进程ID
* 若pgid=0，则由pid指定的进程ID将用作进程组ID
* 注意：
  * 一个进程只能为它自己或它的子进程设置进程组ID。在子进程调用exec函数之后，父进程就不能再改变该子进程的进程组ID


用于获取调用进程的进程组ID
```c
pid_t getpgrp();
```


### 4.16 会话

* 会话是一个或多个进程组的集合
* 一次登录形成一个会话 
* Shell上的一条命令形成一个进程组
  * `proc1 | proc2 &` （开两个终端，观察组长 会话ID）
  * `proc3 | proc4 | proc5` (命令 ps –xj;程序4.21；在一个终端中分别前后台启动)


略


## 第五讲 信号

### 5.1 信号的概念
* 信号是软件中断
* 例如，Ctrl + C，将产生SIGINT信号，中断程序执行
* 它可以作为进程间通信的一种方式，但更主要的是，信号总是中断一个进程的正常运行，它更多地被用于处理一些非正常情况
* 每个信号都有一个名字，以SIG开头。
  * SIGABRT：进程异常终止信号，abort产生
  * SIGALRM：闹钟信号，计时器超时后产生
  * Linux共有31种不同的信号
  * 查看/usr/include/x86_64-linux-gnu/bits/signum.h


**信号产生**
* 当用户按某些终端键时，产生信号。例如在终端上按Ctrl+C键通常产生中断信号(SIGINT)。
* 硬件异常产生信号：除数为0、无效的存储访问等等。这些条件通常由硬件检测到，并将其通知内核。然后内核为该条件发生时正在运行的进程产生适当的信号。
* 进程用Kill函数可将信号发生给另一个进程或进程组；
* 用户用Kill命令将信号（终止信号SIGTERM）发送给其他进程
* 当检测到某种软件条件已经发生，并将其通知有关进程时产生信号。如SIGPIPE、SIGALRM
* 等等

**信号的处理方式**
* 忽略
* 捕获
* 执行系统默认动作


**常见的信号**
* SIGABRT  处理异常信号。当前进程调用abort后发送该信号；
* SIGALRM  报时时钟。当进程设置的时钟超时后，内核向进程发送一个时钟信号；
* SIGCHLD  子进程被终止或停止。每当子进程被终止或停止时，内核都会给父进程发送一个信号SIGCHLD，该信号表示的是一个子进程的消亡。
* SIGHUP  挂起信号。当终端连接断开时，内核向所有依附在此控制终端上的进程发送此信号；
* SIGINT  中断信号。当用户按下中断键时，从内核向所有与终端会话有联系的进程发出信号。
* SIGPIPE  写无接收方的管道或套接字信号。管道和套接字都是一种进程间通讯机制；
* SIGQUIT 退出信号。与SIGINT信号非常类似，当用户在终端上敲下退出键时，内核会发出这个信号。与SIGINT不同点在于，该信号会导致进程的异常终止。
* SIGTTIN/SIGTTOU 后台进程读/写信号。每当一个后台进程试图从控制终端读入/写数据时就会产生此信号，此信号的默认动作是终止进程的运行。
* SIGURG  高带宽数据通知信号。该信号通知进程，网络连接中出现了紧急情况或者带外数据；
* SIGUSR1和SIGUSR2 用户自定义信号。

**查看信号表述信息**
```c
extern char* sys_siglist[];
```

**根据信号值查看信号信息**
```c
#include<signal.h>
void psignal(int signo, const char* msg);
```

**将信号值翻译成可读的字符串**
```c
#include<string.h>
char* strsignal(int signo);
```

#### 5.1.1 strsignal函数返回了一个字符串指针
是

#### 5.1.2 该指针指向的内存区域需要释放吗？
不需要，也不可以，free会报错

#### 5.1.3 该指针指向的内存区域可以被修改吗？
不可以

#### 5.1.4 若能修改，修改后，再调用strsignal函数会有什么结果？
可以修改对应的内存区域，但是当在此调用strsignal后，又恢复原来的值。原理是有拷贝到这个缓冲区，覆盖了用户的修改



### 5.2 signal函数

```c
void (*signal(int signo, void (*func)(int)))(int);
```
* `signo`：信号名
* `func`：`void (*)(int signo)` 处理函数
  * 系统预设：
    * `SIG_IGN` 忽略处理函数
    * `SIG_DFL` 接收到信号signo后，按照系统默认动作处理
  * 自定义处理函数
* `@return void (*)(int)` 
  * 成功：返回旧的处理方式
  * 失败：`SIG_ERR`


注意事项
* 当一个进程调用fork时，其子进程继承父进程的信号处理方式（处理函数地址在子进程有意义？）
  * 比如父进程忽略子进程也忽略，共享代码空间
* 当执行一个程序时，所有信号的状态通常都是系统默认（除非调用exec的进程忽略某信号）
  * 新的可执行程序的信号状态为默认状态，防止父进程未处理信号干扰此进程
* exec函数将原先设置为要捕捉的信号，改为它们的默认动作（为什么？），其他信号的状态则不变
  * 因为exec将覆盖原有的数据空间，信号处理函数已经不存在了。


**signal函数存在的问题－不可靠**
* 在早期UNIX系（如SVR4）中， 进程每次处理信号时，随即将信号动作复位为默认动作。因此需要重复安装信号函数
  * 这样可能造成了信号丢失，因为存在时间窗口
* 通过信号改变条件变量从而空值主程序流程，可能因信号丢失造成无法进行

例子
```c
int sig_int_flag;
int main(void)
{
    void    sig_int();
    ...
    signal(SIGINT,sig_int);
    ...
    while(sig_int_flag == 0)
        //在此发生信号
        pause();
    ...
}
void sig_int()
{
    signal(SIGINT,sig_int);
    sig_int_flag = 1;
}
```


#### 5.2.1 如何获取信号处理函数

两次调用signal
```c
SigFunc *sig_int;
sig_int = signal(SIGINT, SIG_IGN);
signal(SIGINT, sig_int);
```

#### 5.2.2 当改变信号处理方式之间，有信号达到，该如何？
忽略？




### 5.3 不可靠信号和可靠信号

* 不可靠信号:建立在早期机制上的信号。这些信号的值从1到31，已有预定义含义，如SIGINT
  * 进程每次处理信号后,系统就将对信号的响应设置为默认动作(需两次调用signal)linux已解决
  * 信号可能丢失
  * 不可靠信号不支持排队（程序演示5.3，同一种信号，test后台启动）
  * 在信号处理函数执行过程中，到来的所有相同信号，都被合并为一个信号
* 可靠信号:后期引入的，其信号值从34到64
  * 可靠信号支持排队，不会丢失（程序演示5.4，同一种信号，test后台启动）
  * 可靠信号也被称为实时信号
  * 不可靠信号被称为非实时信号
* 信号：软中断（中断程序，执行信号处理程序）
* 可靠信号与不可靠信号：在信号处理程序中，收到与正处理信号不同的信号时，会中断当前信号的处理，去执行新到信号的处理函数(示例5.13)



#### 5.3.1 可靠信号的处理过程？

* 当正在处理可靠信号A时，若收到另一可靠信号B，则中断信号A的执行，转去执行信号B的处理；
* 若此时又收到信号B，则该信号在B队列排队；若此时又收到信号A，则该信号在A队列排队
* 若信号B处理完毕，则检查B队列中有无信号尚需处理，处理完毕后，再返回中断点执行



#### 5.4 信号发送与接收机制
早期的信号安装和发送机制
* signal
* kill
改进后的信号安装和发送机制
* sigaction
* sigqueue
信号可靠与否，只与信号值有关，与采用何种信号安装、发送函数无关


* kill函数、raise函数
* alarm函数、pause函数
* sleep函数及实现
* 具有超时功能的API


将信号发送给其他进程或者进程组
函数原型
```c
#include<signal.h>
int kill(pid_t pid, int signo);
```
* `signo`：需要发送的信号编号
* `pid`：发送的目的地
  * `pid > 0`：将信号发送给进程ID为pid的进程
  * `pid == 0`：将信号发送给起进程组ID等于发送进程的进程组ID，而且发送进程有许可权向其发送信号的所有进程
  * `pid < 0`	：将信号发送给其进程组ID等于pid绝对值，而且发送进程有许可权向其发送信号的所有进程
  * `pid == -1` 将信号发送给除进程0以外的所有进程，但发送进程必须有许可权
* `@return`
  * 成功返回0，
  * 出错返回-1


**将信号发送给自己**
```c
#include<signal.h>
int raise(int signo);
```
* `signo`：需要发送的信号编号
* `@return`
  * 成功返回0，
  * 出错返回-1

**用于设置一个计时器，在将来某个指定的时间，该计时器将超时，产生SIGALRM信号**
```c
#include<unistd.h>
unsigned int alarm(unsigned int seconds);
```
* `seconds`：经过seconds秒后，产生SIGALRM
* `@return`
  * 返回0或以前设置的计时器时间的余留秒数

* 注意：每个进程只有一个计时器
* 若在调用alarm时，以前已为该进程设置的计时器并未超时，则将该计时器的余留值作为本次alarm调用的值返回，以前登记的计时器，则被新计时器替代
* 取消定时器
  * 若有以前为进程登记的尚未超时的计时器，而且本次调用seconds等于0，则取消计时器

使调用进程挂起，直到捕捉到一个信号
```c
#include<unistd.h>
int pause();
```
* 只有执行了一个信号处理程序并从其返回时，pause才返回
* 返回-1，errno被设置为EINTR


#### 5.4.1 发送信号的权限？
* 有发送信号许可权的基本规则是：
  * 1）超级用户可以将信号发送给任意进程；
  * 2）发送者的实际或有效用户ID，必须等于接收者实际或有效用户ID；
* 当signo为0时，则kill仍执行正常的错误检测，但不发送信号。这常被用来确定一个特定进程是否存在。
* 如果向一个并不存在的进程发送空信号，则kill返回-1,errno则被设置为ESRCH。


#### 5.4.2 是先调用alarm函数，再调用signal函数设置SIGALRM处理函数？还是先调用signal函数设置SIGALRM处理函数，再调用alarm函数？

应该是先`alarm`，在`signal`。
若先`signal`之后，之前的时钟中断到达，signal执行的是新的处理函数造成异常

### 5.5 sleep函数及实现
`sleep`用于让调用进程挂起，直到已经过了指定的时间，或者调用进程捕捉到一个信号，并从信号处理程序返回
```c
#include<unistd.h>
unsigned int sleep(unsigned int seconds);
```

* 返回值：
  * 若已经过了指定的时间，则返回0
  * 若调用进程捕捉到一个信号，并从信号处理程序返回，则sleep提前返回，返回值是未睡够的秒数


#### 5.5.1 sleep实现方式1及问题？
Solaris 9使用alarm实现sleep函数

```c
static void  sig_alrm(int signo)
{
  return; //什么都不做，仅仅为了唤醒pause
}
unsigned int sleep1(unsigned int nsecs)
{
  if (signal(SIGALRM, sig_alrm) == SIG_ERR) //设置处理函数
    return(nsecs);
  alarm(nsecs);           // 启动定时器
  pause();                //计时器到达将会唤醒
  return( alarm(0) );     //返回定时器剩余的时间
}
```

存在的问题：
* 如果调用者此前曾设置了计时器，则它被sleep1函数中的第一次alarm调用擦去。
  * 检查第一次调用alarm的返回值，若其小于本次调用alarm的参数值，则只应等到上次设置的计时器超时；
  * 若上次设置的计时器超时时间晚于本次设置值，则在sleep1函数返回前，复位此计时器，使其在上次计时器的设定时间再次发生超时
* 该程序中修改了对SIGALRM的配置。如果编写一个函数供其他函数调用，则在该函数调用时要保存原配置，并在返回前恢复原配置；
  * 保存signal函数的返回值，在返回前复位原配置
* 在调用alarm和pause之间有一个竞争条件
  * 如果调用alarm之后，发生调度，过了很长时间后该进程才得到执行
  * 此时定时器到达，执行中断函数
  * 然后执行pause，永远等待，无法唤醒

为了解决静态条件的实现：使用`setjmp`和`longjmp`
```c
static jmp_buf  env_alrm;
static void sig_alrm(int signo) {
  longjmp(env_alrm, 1);
}

unsigned int sleep2(unsigned int nsecs) 
{
  if (signal(SIGALRM, sig_alrm) == SIG_ERR)
          return(nsecs);
  if (setjmp(env_alrm) == 0) {
          alarm(nsecs);         //启动定时器
          pause();              //挂起进程
  }
  return( alarm(0) );           //返回剩余的时间
}
```
带来的问题：
* 它涉及到与其他信号的相互作用。如果SIGALRM中断了某个其他信号处理程序，则调用longjmp会提早终止该信号处理程序（说明信号存在嵌套）




#### 5.5.2 sleep实现方式2及问题？
FreeBSD、Linux使用nanosleep提供时间延迟

```c
struct timespec {
	time_t tv_sec;	//秒数
	long tv_nsec;	//纳秒数
};
int nanosleep(const struct timespec* rqtp
				 struct timespec* rmtp);
```
* rqtp：指定需要等待的时间，秒数和纳秒数
* rmtp：当nanosleep返回时，在rmtp指定的结构体中存储距离超时的时间；若不关心该时间，可设为NULL
* 返回值：超时返回0，被信号中断，则返回-1


POSIX.1标准未对这些交互做任何说明，因此，考虑到移植性，不应对sleep的实现做任何假设
* 例如：首先调用alarm(10)
* 过了3秒，又调用了sleep(5)
* Sleep将在5秒后返回，但是否在2秒后又产生一个SIGALRM信号呢？



### 5.6 具有超时功能的API
早期的UNIX系统的一个特性是
* 如果进程在执行一个低速的系统调用（究竟什么是系统调用？与一般函数调用有何区别？）期间，捕捉到了一个信号，
* 则该系统调用就被中断不再继续执行
* 该系统调用返回出错，errno被设置为EINTR
* 这样做的理由：进程可能被这些低速系统调用永远阻塞，例如读网络


常见的低速系统调用包括
* 读写（read、write）管道、终端设备、网络
* 打开（open）终端设备等
* pause、wait函数
* 某些ioctl操作
* 某些进程间通信函数
* 注意：磁盘I/O并不属于这类低速系统调用。因为只要不是硬件错误，I/O操作总会返回。

被中断的系统调用，必须显式地处理出错返回，典型的代码：
```c
Again:
if((n=read(fd, buf, BUFFSIZE)) < 0) {
  if(errno == EINTR)
    goto Again;
  //......
}
```

* 4.2BSD引入了被中断的系统调用的自动重启动
* 不同的系统对自动重启动设置不一
  * signal
    * 4.2BSD 总是
    * solaris 绝不
    * Linux 默认（可配置：默认不重启）
  * sigaction
    * POSIX.1 未说明
    * Linux 可选

**带超时功能的read**
使用alarm实现。
```c

```
存在如下问题：
* 第一次alarm调用和read调用之间存在竞争关系，即在调用read前，alarm超时已经发生
* 在Linux中，通过signal注册的信号处理机制，被信号中断的系统调用是可以自动重启动的。这种情况下，SIGALRM信号对read的时间限制无作用

使用`alarm`和`longjmp`和`setjmp`实现
```c

```
存在如下问题：
* 它涉及到与其他信号的相互作用。如果SIGALRM中断了某个其他信号处理程序，则调用longjmp会提早终止该信号处理程序



### 5.7 信号集与可靠信号机制

* **信号未决（pending）**：在信号产生和递送之间的时间间隔；
* 进程可以选用“信号递送阻塞”。如果为进程产生了一个选择为阻塞的信号，而且对该信号的动作是系统默认动作或捕捉该信号，则该信号保持未决状态，直到下述条件之一发生：
  * 对此信号解除了阻塞；
  * 或者将对此信号的动作更改为忽略。
* 当递送一个原来被阻塞的信号给进程时，才决定其处理方式。即进程在信号递送之前仍可改变对它的动作。
* 每个进程都有一个信号屏蔽字，它规定了当前要阻塞递送到该进程的信号集。


**信号集**

* 信号集：能表示多个信号的数据类型，即信号的集合

* 类型`sigset_t`
* 定义位置`signal.h`
* `typedef __sigset_t sigset_t;`
* `sigset_t` 是16个8字节
* 在sigset_t结构体中，第一个64比特，对应信号1到63，第二个64比特，对应未定义信号


相关函数

```c
//该函数初始化由set指向的信号集，并清除其中的所有信号
int  sigemptyset( sigset_t  *set ); 
//该函数初始化由set指向的信号集，使其包括所有信号
int  sigfillset( sigset_t  *set );
//该函数将一个信号添加到set中
int  sigaddset( sigset_t  *set,  int  signo);
//该函数从set中删除信号signo
int  sigdelset( sigset_t  *set,  int  signo);
//以上四个函数成功返回0，出错返回-1

//该函数判断信号signo是否在set中
int sigismember(const sigset_t *set, int signo);
//若真返回1，若假返回0，出错返回-1
```


**信号阻塞**
当程序执行敏感任务时（比如更新数据库），不希望外界信号中断程序的运行。在这个阶段并不是简单地忽略信号，而是阻塞这些信号，当进程处理完关键任务后，还会处理这些信号。

检测或更改进程需要阻塞的信号集合，或者同时执行这两个操作，设置屏蔽字
```c
#include<signal.h>
int sigprocmask(int how, const sigset_t *set,
				    sigset_t *oset);
```

* oset：进程的当前信号屏蔽字通过oset返回，若不关心当前信号屏蔽字，可以设为NULL
* 若set不为NULL，则
  * 若how=SIG_BLOCK，则进程新的信号屏蔽字是当前信号屏蔽字和set指向信号集的并集，set包含了希望阻塞的附加信号
  * 若how=SIG_UNBLOCK，则进程新的信号屏蔽字是当前信号屏蔽字和set指向信号集补集的交集，set包含了希望解除阻塞的信号
  * 若how=SIG_SETMASK，则进程新的信号屏蔽字将被set指向的信号集的值代替
* 若set为NULL，how也无意义
* `@return`
  * 成功返回0
  * 出错返回-1


说明
* 调用sigprocmask后，如果有任何未决的、不再阻塞的信号，则在sigprocmask返回前，至少会将其中一个信号递送给该进程。
* 该函数仅为单线程的进程定义的，对于多线程的进程，有另一套函数


返回一个信号集，其中的各个信号对于调用进程是阻塞的而不能递送，因而也一定是当前未决的
```c
#include<signal.h>
int sigpending ( sigset_t  *set );
```

* set：sigpending函数填充该结构体，返回未决信号
* 成功返回0，出错返回-1


### 5.8 sigaction函数
该函数用于替换signal函数，即可以检查、修改信号的处理动作

```c
#include<signal.h>
int sigaction(int signo, const struct sigaction *act,
			       struct sigaction *oact);
```

* `signo`：指定需要处理的特定信号。应该在该信号收到之前调用sigaction。除了SIGSTOP和SIGKILL之外，可以把signo设为任何类型的信号
* 若act非空，则要修改信号的处理动作
* 若oact非空，则系统经由oact指针返回该信号的上一个动作
act、oact可以为空
* 成功返回0，出错返回-1

```c
struct sigaction {
  void (*sa_handler)(int);
  sigset_t 	sa_mask;
  int 	sa_flags;
  void 	(*sa_sigaction)(int, siginfo_t *, void *);    
};
```

* sa_handler用于设置信号处理函数的地址，或SIG_IGN、SIG_DFL
* sa_mask说明了一个信号集，在调用该信号处理函数之前，这一信号集要附加到进程的信号屏蔽字中；仅当从信号处理函数返回时，再将进程的信号屏蔽字复原
* 在信号处理函数被调用时，操作系统建立的新信号屏蔽字包括了正在被处理的信号。因此，保证了在处理一个给定信号时，同种信号会被阻塞（可靠信号与不可靠信号）
* sa_flags成员用来改变signo信号的行为属性。sa_flags的若干值可以用或运算组合。
* sa_sigaction字段：用于设置一个替代的信号处理函数
* 注意sa_sigaction和sa_handler可能使用同一个存储区域，因此只能使用其中之一


Linux中常用的sa_flags值
略

现在信号处理函数原型：
```c
void handler(int signo, siginfo_t *info, 
                        void *context);
```



### 5.9 sigqueue函数
```c
用于向进程发送一个带参数的信号
函数原型：
int sigqueue(pid_t pid, int signo, 
                    const union sigval val);
//val:
typedef union sigval {
   int sival_int;    //该值可以传递给信号处理函数
   void *sival_ptr;
}sigval_t
```


### 5.10 sigsuspend
保护一段代码使其不被某种信号中断

需要在一个原子操作中先恢复信号屏蔽字，然后使进程休眠；
```c
#include<signal.h>
int sigsuspend(const sigset_t *sigmask);
```
* 将进程的信号屏蔽字设为sigmask指向的值，在捕捉到一个信号之前，该进程挂起；
* 从一个信号处理函数返回后，sigsuspend返回，并将信号屏蔽字恢复为调用sigsuspend之前的值；
* 函数总是返回-1，errno设置为EINTR


* 该函数可以用于保护临界区代码，使其不被指定的信号中断。
* 该函数也可以用于等待一个信号处理程序设置一个全局变量


### 5.11 可重入函数和线程安全的函数
可重入函数是指：
* 某个函数被信号中断执行，信号处理函数中又调用了该函数，而不会带来任何问题的函数

不可重入的原因
* 使用静态的数据结构
* 调用malloc或free
* 标准I/O函数，例如printf等

关于errno
* 每个线程只有一个errno。
* 当信号处理函数调用某个API后，errno可能被重新设置
* 这样，被信号中断的程序将看到被修改后的errno，而不是原来的值
* 所以，信号处理函数中，需要首先保存errno，在信号处理函数返回前，恢复errno


线程安全的函数

* 对于同一个函数，若两个或两个以上的线程同时执行，均得到正确的结果，则称该函数是线程安全的函数
* 可重入的函数一定是线程安全的函数？
* 线程安全的函数，不一定是可重入的？
  * 例如：互斥变量保护的临界区
  * 例如malloc函数

### 5.12 sigsetjmp和siglongjmp函数

* 在信号处理中，当捕捉到信号并进入信号处理函数时，当前信号被自动加入到进程的信号屏蔽字中
* 当退出信号处理函数时，当前信号又会从进程信号屏蔽字中删除
* 当使用longjmp跳出信号处理函数时，信号屏蔽字会有何改动？ 不会

略

### 5.13 abort函数
略

