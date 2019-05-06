---
title: Java并发（一）
date: 2018-03-19T23:55:39+08:00
draft: false
toc: false
comments: true
aliases:
  - /detail/127
  - /detail/127/
tags:
  - java
---

> 参考：[并发编程网](http://ifeve.com/)
> [思维图](http://naotu.baidu.com/file/5ddda6cc9aa6be5ec6f23aa21743649d?token=5dd25bfd7f97cc7d)

## 目录
* [〇、基本概念](#〇、基本概念)
	* [1、异步和同步](#1、异步和同步)
	* [2、互斥与同步](#2、互斥与同步)
	* [3、阻塞、非阻塞和异步、同步IO](#3、阻塞、非阻塞和异步、同步IO)
	* [4、并发和并行](#4、并发和并行)
	* [5、静态条件和临界区](#5、静态条件和临界区)
	* [6、线程控制逃逸规则](#6、线程控制逃逸规则)
	* [7、线程安全的实现方式](#7、线程安全的实现方式)
	* [8、死锁](#8、死锁)
	* [9、线程内存模型](#9、线程内存模型)
	* [10、饥饿与公平](#10、饥饿与公平)
	* [11、乐观锁与悲观锁](#11、乐观锁与悲观锁)
	* [12、阿姆达尔定律](#12、阿姆达尔定律)
	* [13、happens-before](#13、happens-before)
	* [14、Java锁的种类以及辨析](#14、Java锁的种类以及辨析)
	* [15、虚假唤醒](#15、虚假唤醒)
* [一、语法级支持](#一、语法级支持)
	* [1、关键字](#1、关键字)
	* [2、线程通讯](#2、线程通讯)
	* [3、创建线程](#3、创建线程)
	* [4、ThreadLocal](#4、ThreadLocal)
	* [5、Thread基础设施](#5、Thread基础设施)
	* [6、线程的状态](#6、线程的状态)
* [二、五种同步辅助类](#二、五种同步辅助类)
	* [1、Semaphore信号量](#1、Semaphore信号量)
	* [2、CountDownLatch倒计时锁存](#2、CountDownLatch倒计时锁存)
	* [3、CyclicBarrier同步屏障](#3、CyclicBarrier同步屏障)
	* [4、Phaser可重用的同步屏障](#4、Phaser可重用的同步屏障)
	* [5、Exchanger交换器](#5、Exchanger交换器)
* [三、并发容器](#三、并发容器)
	* [1、阻塞队列](#1、阻塞队列)
	* [2、非阻塞并发队列](#2、非阻塞并发队列)
	* [3、其他并发容器](#3、其他并发容器)
* [四、线程池和执行器](#四、线程池和执行器)
	* [1、线程池使用](#1、线程池使用)
	* [2、线程池的分析](#2、线程池的分析)
	* [3、合理的配置线程池](#3、合理的配置线程池)
	* [4、线程池的监控](#4、线程池的监控)
	* [5、执行器](#5、执行器)
* [五、无阻塞算法](#五、无阻塞算法)
	* [1、CAS](#1、CAS)
	* [2、例子](#2、例子)
* [六、常见的并发模型](#六、常见的并发模型)
	* [1、并行工作者](#1、并行工作者)
	* [2、流水线模型](#2、流水线模型)
	* [3、函数式并行](#3、函数式并行)
* [七、原子对象](#七、原子对象)


## 〇、基本概念
****************************
### 1、异步和同步
* 同步：发送一个请求，等待结果返回
* 异步：发送一个请求，立即返回（可选：当请求接收方处理完信息再设法通知请求方）

### 2、互斥与同步
* 互斥：对于一个资源或个操作，同一时刻仅允许一个执行实体执行
* 同步：多个执行实例必须严格按照一定的执行顺序执行才能成功
* 同步一般通过互斥机制实现

### 3、阻塞、非阻塞和异步、同步IO
[参考](https://www.cnblogs.com/aspirant/p/6877350.html?utm_source=itdadao&utm_medium=referral)
阻塞和非阻塞关注的是 **单个进程的执行状态**
* 阻塞：等待IO完成，才继续执行
* 非阻塞IO：IO立即返回，使用select、epoll等

同步和异步针对应用程序来，**关注的是程序中间的协作关系**，是否有内核通知、主动和被动的问题
* 同步：进程触发IO操作以后，并**等待**或者**轮询**的去查看IO操作状态
* 异步：进程触发IO操作以后，直接返回，做自己的事情，IO交给内核来处理，完成后内核通知进程IO完成。（事件模型）

注意
* 阻塞、非阻塞、多路IO复用，都是同步IO
* 拉一个子线程去轮询、去死循环，或者使用select、poll、epoll，都不是异步

常用的IO模型：
* 同步阻塞IO（Blocking IO）：即传统的IO模型。
* 同步非阻塞IO（Non-blocking IO）：默认创建的socket都是阻塞的，非阻塞IO要求socket被设置为NONBLOCK。注意这里所说的NIO并非Java的NIO（New IO）库。
* IO多路复用（IO Multiplexing）：即经典的Reactor设计模式，Java中的Selector和Linux中的epoll都是这种模型。
* 异步IO（Asynchronous IO）：即经典的Proactor设计模式，也称为异步非阻塞IO。（Java NIO）

### 4、并发和并行
* 并发：表面上的并发，一般分时实现（宏观是并行，微观上是串行）
* 并行：真正的并行，多个任务同时执行，多运算器实现

### 5、静态条件和临界区
竞态条件：当两个线程竞争同一资源时，对资源的访问顺序敏感
临界区：导致竞态条件发生的代码区称

常见的静态条件：
* 先检查后执行（比如延迟初始化）
* 先读取后写入



### 6、线程控制逃逸规则
如果一个资源的创建，使用，销毁都在同一个线程内完成，
且永远不会脱离该线程的控制，则该资源的使用就是线程安全的。

也就是说资源只要不是多线程共享的那么都是线程安全的

### 7、线程安全的实现方式
* 使用不可变对象
* 加锁

### 8、死锁
#### （1）操作系统的算法
**银行家算法：避免死锁**
操作系统按照银行家制定的规则为进程分配资源，当进程首次申请资源时，要测试该进程对资源的最大需求量，如果系统现存的资源可以满足它的最大需求量则按当前的申请量分配资源，否则就推迟分配。当进程在执行中继续申请资源时，先测试该进程本次申请的资源数是否超过了该资源所剩余的总量。若超过则拒绝分配资源，若能满足则按当前的申请量分配资源，否则也要推迟分配。

**资源有序分配法：预防死锁**

**资源分配图化简法：检测死锁**

**撤销进程法：解决死锁**


#### （2）Java中解决方案
* 确保加锁顺序相同
* 加锁时限
* 死锁检测

#### （3）嵌套使用synchronized锁死
当嵌套使用synchronized，并使用`o.wait()`方案时，仅仅会释放一个监视器，所以可能出现死锁

#### （4）重入死锁
重入死锁，当锁对象具有不可重入性，在同一线程条用两次锁定方法，将发生重入死锁

解决方案：
* 编写代码时避免再次获取已经持有的锁
* 使用可重入锁



### 9、线程内存模型
#### （1）Java内存模型内部原理
JVM中的内存分布
* heap堆区
	* 对象实例
* stack栈区
	* Thread Stack1
		* 本地变量（基本数据类型+引用类型）
	* Thread Stack2

#### （2）Java内存模型与CPU储存结构
当对象和变量被存放在计算机中各种不同的内存区域中时，就可能会出现一些具体的问题。主要包括如下两个方面：
* 线程对共享变量修改的可见性
* 当读，写和检查共享变量时出现竞态条件


### 10、饥饿与公平
如果一个线程因为CPU时间全部被其他线程抢走而得不到CPU运行时间，这种状态被称之为“饥饿”。而该线程被“饥饿致死”正是因为它得不到CPU运行时间的机会。解决饥饿的方案被称之为“公平性” – 即所有线程均能公平地获得运行机会。

#### （1）Java中导致饥饿的原因
* 高优先级线程吞噬所有的低优先级线程的CPU时间。
* 线程被永久堵塞在一个等待进入同步块的状态，因为其他线程总是能在它之前持续地对该同步块进行访问。
* 线程在等待一个本身(在其上调用wait())也处于永久等待完成的对象，因为其他线程总是被持续地获得唤醒。

#### （2）解决方案
* 最好不要改变线程的优先级
* 避免死锁
* 使用锁对象替换同步块
* 使用公平锁

### 11、乐观锁与悲观锁
#### （1）悲观锁（排他锁）
对待并发认为悲观，对待资源的访问使用排他式的访问

#### （2）乐观锁
假设不会发生并发冲突，只在提交操作时检查是否违反数据完整性。乐观锁不能解决脏读的问题。

#### （3）例子
一个线程安全的自加器

悲观锁实现
```java
public class SynchronizedCounter{
    long count = 0;
    public void inc(){
        synchronized(this){
            count++;
        }
    }
    public long count(){
        synchronized(this){
            return this.count;
        }
    }
}

```

乐观锁实现
```java
import java.util.concurrent.atomic.AtomicLong;
public class AtomicLong{
    private AtomicLong count = new AtomicLong(0);
    public void inc(){
        boolean updated = false;
        while(!updated){
            long prevCount = this.count.get();
            updated = this.count.compareAndSet(prevCount, prevCount + 1);
        }
    }
    public long count(){
        return this.count.get();
    }
}
```

#### （4）乐观锁和悲观锁的本质
主要区分在对待资源的态度上（不管是数据库还是Java并发中），从而导致处理互斥资源访问个方法不同：
* 悲观锁，认为总会有人修改资源，使自己出错，所以直接禁止别人使用
* 乐观锁，认为别人会同时修改的概率不大，如果我在处理这个资源过程中发现资源被改动了，那么不好意思，返回一个错误信息（数据库就是回滚）

#### （5）如何选择
* 进行测试对比
* 乐观锁适用于读多写少的情况
* 悲观锁适用于写多读少的情况


### 12、阿姆达尔定律
用于拆分算法中可以并行的部分来计算时间相关的内容，参见
http://ifeve.com/amdahls-law/

公式如下
```
Speendup <= 1 / ( F + (1-F)/N )
```
* F表示：任务中必须被串行处理的部分占比
* N表示：处理器的个数
* Speendup表示：性能提高的比值
	* `Speendup = 使用并行的性能 / 串行的性能`
	* `Speendup = 串行的时间 / 使用并行的时间`
	* 也可以表示：`处理机的利用率 = Speendup / N`

结论：
* 当 `F->0, Speedup=N`，表明，完全的并行，性能提高与CPU数成正比
* 当 `F=1, Speedup=1`，表明，完全串行的情况，无法通过CPU提高性能
* 当 `N->∞, Speedup=1/F`，表明，若串行部分存在，那么通过增加CPU提高的性能将存在上限，而且CPU越多，利用率越低
* 需要在性能和CPU利用率间找到平衡






### 13、happens-before
JMM就使用happens-before的概念来阐述多线程之间的内存可见性。

在JMM中，如果一个操作执行的结果需要对另一个操作可见，那么这两个操作之间必须存在happens-before关系。

定义如下：
1. 如果一个操作happens-before另一个操作，那么第一个操作的执行结果将对第二个操作可见，而且第一个操作的执行顺序排在第二个操作之前。 
2. 两个操作之间存在happens-before关系，并不意味着一定要按照happens-before原则制定的顺序来执行。如果重排序之后的执行结果与按照happens-before关系来执行的结果一致，那么这种重排序并不非法。

**原生Java满足Happens-before关系的规则**
程序次序规则：一个线程内，按照代码顺序，书写在前面的操作先行发生于书写在后面的操作；
锁定规则：一个unLock操作先行发生于后面对同一个锁额lock操作；
volatile变量规则：对一个变量的写操作先行发生于后面对这个变量的读操作；
传递规则：如果操作A先行发生于操作B，而操作B又先行发生于操作C，则可以得出操作A先行发生于操作C；
线程启动规则：Thread对象的start()方法先行发生于此线程的每个一个动作；
线程中断规则：对线程interrupt()方法的调用先行发生于被中断线程的代码检测到中断事件的发生；
线程终结规则：线程中所有的操作都先行发生于线程的终止检测，我们可以通过Thread.join()方法结束、Thread.isAlive()的返回值手段检测到线程已经终止执行；
对象终结规则：一个对象的初始化完成先行发生于他的finalize()方法的开始；

**可以推导出的原则：**
将一个元素放入一个线程安全的队列的操作Happens-Before从队列中取出这个元素的操作
将一个元素放入一个线程安全容器的操作Happens-Before从容器中取出这个元素的操作
在CountDownLatch上的倒数操作Happens-Before CountDownLatch#await()操作
释放Semaphore许可的操作Happens-Before获得许可操作
Future表示的任务的所有操作Happens-Before Future#get()操作
向Executor提交一个Runnable或Callable的操作Happens-Before任务开始执行操作


### 14、Java锁的种类以及辨析
#### （1）自旋锁
主要特性：软件级别的实现，不需要涉及线程的状态转换，就是使用while循环判断标志。会出现忙等的情况，适用于配合CAS使用或者线程竞争不激烈的情况

#### （2）阻塞锁
利用Java线程内部机制，切换线程状态到非运行态可以通过一下方法：
* synchronized 关键字（其中的重量锁），
* ReentrantLock，
* Object.wait()
* ockSupport.park()

主要用于线程竞争激烈的情况

#### （3）可重入锁
一个线程可以重入某个锁

### 15、虚假唤醒
Object.wait等函数 ，Linux下的JVM底层使用pthread_cond_wait/pthread_cond_timedwait等函数实现等待。
这些函数本身会在多处理器下出现虚假唤醒情况，具体原因没查到



## 一、语法级支持
### 1、关键字
**锁**
语法关键字：`synchronized`
```java
synchronized (aObject) {
    //原子操作
}
public synchronized returnType 原子操作方法名(参数列表){
    //原子操作
}
```
* 对对象加锁表示：同一时间仅允许一个线程执行代码体
* 对方法加锁表示：同一时间仅允许一个线程执行方法体
* 保证并发可见性
* **具有可重入性**


**volatile**
* 保证了不同线程对这个变量进行操作时的可见性，即一个线程修改了某个变量的值，这新值对其他线程来说是立即可见的。
* 禁止进行指令重排序

### 2、线程通讯
#### （1）Object提供的线程通信机制
* `Object.wait()` 让当前线程进入等待状态，同时，`wait()`也会让当前线程释放它所持有的锁
* `Object.notify()` 或者 `Object.notifyAll()` 唤醒当前对象上的等待状态线程（随机一个或者多个），不会释放锁
* 以上方法，必须持有该对象的监视器（锁），才允许调用，否则将抛出异常



#### （2）共享数据
使用全局变量自己设计


### 3、创建线程
* 继承Thread
* 实现Runable接口

### 4、ThreadLocal
线程本地变量：ThreadLocal为变量在每个线程中都创建了一个副本，那么每个线程可以访问自己内部的副本变量。

实现：使用一个Map存储变量，key为线程对象，value为该变量在该线程的值


### 5、Thread基础设施
#### （1）`start()`
启动线程

#### （2）`join()`
等待此线程终止

#### （3）`setDaemon(boolean on) `
将该线程标记为守护线程或用户线程。
* true 守护线程：优先级低，主线程结束后若没有用户线程，守护线程直接结束
* false 用户线程：（默认）可以独立运行

#### （4）`sleep(long millis) `
睡眠但是不释放锁

#### （5）`yield() `
让出CPU

#### （6）`interrupt()`
* 用于优雅的终止长时间工作的线程（`while(true){}`线程）
* 当别的线程调用本线程引用的`interrupt()`后，这个线程的`isInterrupted()`将返回true
* 但是当本线程处于阻塞状态（例如sleep, wait, join 等状态）时，这些阻塞方法将会抛出一个中断异常

#### （7）`isInterrupted()`
判断线程是否被中断


### 6、线程的状态
运行状态图：

![线程状态图](/res/me29j-IISIZUqZowdu2XoGnv.jpg)


#### （1）初始状态（new）
线程对象被new出来之后的的状态

#### （2）可运行状态（runnable）
* 初始状态调用 t.start方法
* 锁池状态 获取到了锁
* 阻塞状态结束

#### （3）阻塞状态（Blocked）
* 运行状态 调用sleep、join或者出现io阻塞


#### （4）运行状态（Running）
* 从可运行状态 获取到了时间片


#### （5）等待队列（一种Blocked）
* 运行状态 调用锁对象的wait


#### （6）锁池状态（一种（Blocked））
* 遇到了synchronized块
* 等待队列 被其他线程调用notify

#### （7）死亡状态（Dead）
* 运行状态 run或main结束




## 二、五种同步辅助类
位于 `java.util.concurrent`
### 1、Semaphore信号量
有一个资源最多允许x个用户同时访问时使用。

形象的理解为执行某操作需要许可证，但是许可证只有x个，如果许可证发放完了，只能等了。

常用于**访问资源池**

执行顺序示意
```
--->   --->  --->
--->   --->    --->
--->             --->
//同一时刻最多x个
```


#### （1）构造函数
```java
Semaphore(int permits)  //非公平
Semaphore(int permits, boolean fair) 
```
* 公平性保证先进先处理
* permits为许可证数目


#### （2）常用方法
* `acquire()` 获取一个许可证，或则阻塞直到有许可证使用为止
* `release()` 释放一个许可证

#### （3）使用场景
* 资源池的访问控制如线程池、数据库连接池

### 2、CountDownLatch倒计时锁存
共有两组线程，其中一组线程必须等待另一组x个线程处理完成后才能开始执行

形象理解为下游工作者必须等待上游x个工作者完成后，才能有原料进行接下来的工作。

常用控制两组或者多组线程的**执行顺序**

执行顺序示意
```
--上游-->
--上游------->
--下游-  wait -------->
  --下游 wait ----->
	            --下游--->
```

**这种模式叫：闭锁**


#### （1）构造函数
`CountDownLatch(int count)`
需要count个上游工作者完成，下游工作者才能开始工作

#### （2）常用方法
* `await()` 下游工作者调用，上游工作者没有全部完成——阻塞
* `countDown()` 发出一个信号，上游一个工作者完成

#### （3）使用场景
* Map-Reduce的实现
* 生产者消费者


### 3、CyclicBarrier同步屏障
一组x个线程必须某一个点用await等待，直到第x个线程调用await后，所有线程才可以继续执行。此时状态清空，在此滴啊用await类似于之前的效果

**又叫栅栏**

执行顺序
```
--wait       --------->
--- wait     ---->
         --->(barrierAction)
---------wait-->
```

#### （1）构造函数
* `CyclicBarrier(int parties) `
* `CyclicBarrier(int parties, Runnable barrierAction)`

parties表示屏障的数目，barrierAction表示达到屏障后执行的线程

#### （2）常用方法
* `await() ` 前parties-1个调用阻塞，第parties调用所有阻塞线程就绪
* `getNumberWaiting() ` 多少个线程调用了await
* `getParties() ` 构造函数设置的屏障（parties参数）
* `reset()`  重置屏障

#### （3）使用场景
？？？

### 4、Phaser可重用的同步屏障
[参考](http://blog.csdn.net/u010739551/article/details/51083004)

类似于CyclicBarrier，但是可以分阶段进行
例如
5个学生一起参加考试，一共有三道题，要求所有学生到齐才能开始考试，全部同学都做完第一题，学生才能继续做第二题，全部学生做完了第二题，才能做第三题，所有学生都做完的第三题，考试才结束。

可使用此实现。

使用方式继承来使用

#### （1）构造函数
* `Phaser()` 创建一个Phaser
* `Phaser(int parties)` 创建一个Phaser同时指定屏障


#### （2）常用方法
* `register()` 注册一次，parties+1
* `arriveAndAwaitAdvance()` 到达并等待其他人直到当前阶段完成。等价于`awaitAdvance(arrive())`
* `awaitAdvance` 等待当期那阶段完成
* `arrive()` 到达但不等待
* `arriveAndDeregister()` 取消注册，parties-1
* `boolean onAdvance(int phase, int registeredParties)` 可重写，每阶段完成后调用。当此方法返回true时，意味着Phaser被终止，因此可以巧妙的设置此方法的返回值来终止所有线程。 
* 所有`arriveXXX`方法，将会使arrived+1，若arrived+1==parties时phase+1，arrived归零

说明：此类维护了三个重要状态phase、parties和arrived，分别表示当前阶段、线程数（屏障值）和当前阶段arrive的数目
* `phase` 发生变化时所有`await`方法将返回（从阻塞到运行）
* `parties` 可以有构造函数配置，或使用`register`增加，或使用`arriveAndDeregister`减小
* `arrived` `arrive`等方法使其增加，当达到`parties`后，`arrived`归零，`phase`加一

例子：
```jshell
jshell> var p = new Phaser(3);
p ==> java.util.concurrent.Phaser@31dc339b[phase = 0 parties = 3 arrived = 0]

jshell> p;
p ==> java.util.concurrent.Phaser@31dc339b[phase = 0 parties = 3 arrived = 0]

jshell> Runnable r = ()->{
   ...>   try{
   ...>     p.arriveAndAwaitAdvance();
   ...>   } catch (Exception e){
   ...>   }
   ...>   System.out.println("第一阶段");
   ...>   try{
   ...>     p.arriveAndAwaitAdvance();
   ...>   } catch (Exception e){
   ...>   }
   ...>   System.out.println("第二阶段");
   ...> };
r ==> $Lambda$15/2114650936@617faa95

jshell> new Thread(r).start();

jshell> new Thread(r).start();

jshell> new Thread(r).start();

jshell> 第一阶段
第一阶段
第一阶段
第二阶段
第二阶段
第二阶段


jshell> p;
p ==> java.util.concurrent.Phaser@31dc339b[phase = 2 parties = 3 arrived = 0]
```

#### （3）使用场景
非常适用于在多线程环境下同步协调**分阶段计算任务**（Fork/Join框架中的子任务之间需同步时，优先使用Phaser）



### 5、Exchanger交换器
线程间的安全的swap函数的功能。
A线程产生数据，B对象消费清空数据，都持有的数据的类型为V
初始状态 A线程 V为空，B线程数据为空
下一状态 A线程 产生数据调用交换器，阻塞
下一状态 B线程 交换器，两个数据的引用，此时 A线程的V为空，B线程有数据

例子
```java
class FillAndEmpty {
   Exchanger<DataBuffer> exchanger = new Exchanger<DataBuffer>();
   DataBuffer initialEmptyBuffer = ... a made-up type
   DataBuffer initialFullBuffer = ...

   class FillingLoop implements Runnable {
     public void run() {
       DataBuffer currentBuffer = initialEmptyBuffer;
       try {
         while (currentBuffer != null) {
           addToBuffer(currentBuffer);
           if (currentBuffer.isFull())
             currentBuffer = exchanger.exchange(currentBuffer);
         }
       } catch (InterruptedException ex) { ... handle ... }
     }
   }

   class EmptyingLoop implements Runnable {
     public void run() {
       DataBuffer currentBuffer = initialFullBuffer;
       try {
         while (currentBuffer != null) {
           takeFromBuffer(currentBuffer);
           if (currentBuffer.isEmpty())
             currentBuffer = exchanger.exchange(currentBuffer);
         }
       } catch (InterruptedException ex) { ... handle ...}
     }
   }

   void start() {
     new Thread(new FillingLoop()).start();
     new Thread(new EmptyingLoop()).start();
   }
  }
```


执行顺序
```
------ ---    ---> A线程
---    ------ ---> B线程
```

#### （1）构造函数
* `Exchanger() `

#### （2）常用方法
* `exchange(V x) ` 等待另一个线程到达此交换点（除非当前线程被中断），然后将给定的对象传送给该线程，并接收该线程的对象。

#### （3）使用场景
Exchanger 可能在应用程序（比如遗传算法和管道设计）中很有用。


## 三、并发容器
*******************************
### 1、阻塞队列
#### （1）`java.util.concurrent.BlockingQueue<E>`接口

|       |抛出异常|	特殊值|	阻塞|	超时|
|-------|--------|-----|-----|
|插入|	add(e)|	offer(e)|	put(e)|	offer(e, time, unit)|
|移除|	remove()|	poll()|	take()|	poll(time, unit)|
|检查|	element()|	peek()|	不可用|	不可用|

* BlockingQueue 不接受 null 元素
* BlockingQueue 可以是限定容量的。
* BlockingQueue 实现主要用于生产者-使用者队列
* BlockingQueue 实现是线程安全的
* 返回特殊值： offer返回true、false标记，take返回是否为空
* 抛出异常：IllegalStateException(“Queue full”) 和 NoSuchElementException

#### （2）JDK实现
* `ArrayBlockingQueue` 有界、先入先出
* `DelayQueue` 无界、该队列的头部 是延迟期满后保存时间最长的 Delayed 元素。元素必须继承Delayed接口
	* 如果延期没满，将无法从队列中取出（也就是说必须在该容器中待一段时间）
	* DelayQueue是一个使用优先队列（PriorityQueue）实现的BlockingQueue，优先队列的比较基准值是时间
	* 用途举例：
		* 缓存系统的设计：可以用DelayQueue保存缓存元素的有效期，使用一个线程循环查询DelayQueue，一旦能从DelayQueue中获取元素时，表示缓存有效期到了。
		* 定时任务调度：使用DelayQueue保存当天将会执行的任务和执行时间，一旦从DelayQueue中获取到任务就开始执行，从比如TimerQueue就是使用DelayQueue实现的。
* `LinkedBlockingQueue` 有界、FIFO、吞吐量高于`ArrayBlockingQueue`（原因是生产和消费使用了不同地锁）
* `LinkedBlockingDeque` 有界、双端可插入，双端可提取
* `PriorityBlockingQueue`, 无界阻塞队列，一个基于优先级堆实现的优先队列。优先级队列不允许使用 null 元素
* `SynchronousQueue` 一种阻塞队列，其中每个插入操作必须等待另一个线程的对应移除操作 **不存储元素**，可以用来同步并传递消息，SynchronousQueue的吞吐量高于`ArrayBlockingQueue`
* `LinkedTransferQueue` 无界、链表实现。相对于其他阻塞队列LinkedTransferQueue多了tryTransfer和transfer方法。
	* transfer方法：如果当前有消费者正在等待接收元素（消费者使用take()方法或带时间限制的poll()方法时），transfer方法可以把生产者传入的元素立刻transfer（传输）给消费者。如果没有消费者在等待接收元素，transfer方法会将元素存放在队列的tail节点，并等到该元素被消费者消费了才返回。
	* tryTransfer方法。则是用来试探下生产者传入的元素是否能直接传给消费者。如果没有消费者等待接收元素，则返回false

区别在于：是否有界和排队策略

其他参见Java Doc

#### （3）公平性
* 是否保证等待时间最长的队列最优先能够访问队列。（可能在每个线程阻塞之前记录到达时间来实现公平性——可重入锁提供了公平机制）
* 通常情况下为了保证公平性会降低吞吐量

#### （4）实现原理
* 使用Lock和Condition实现


### 2、非阻塞并发队列
类：`java.util.concurrent.ConcurrentLinkedQueue<E>`

#### （1）特点
一个基于链接节点的无界线程安全队列。此队列按照 FIFO（先进先出）原则对元素进行排序。队列的头部 是队列中时间最长的元素。队列的尾部 是队列中时间最短的元素。新的元素插入到队列的尾部，队列获取操作从队列头部获得元素。当多个线程共享访问一个公共 collection 时，ConcurrentLinkedQueue 是一个恰当的选择。此队列不允许使用 null 元素。

此实现采用了有效的“无等待 (wait-free)”算法（**也就是非阻塞**）

需要小心的是，与大多数 collection 不同，size 方法不是 一个固定时间操作。由于这些队列的异步特性，确定当前元素的数量需要遍历这些元素。

#### （2）原理
* 该类利用 `sun.misc.Unsafe` 提供的CAS操作实现**非阻塞**。
* 内部有一个内部类`Node{val, next}`，并通过`sun.misc.Unsafe`实现了一系列CAS函数
* 假设该单线程offer元素（入队），内部结构如下：

![ConcurrentLinekedQueue队列入队结构变化图](/res/ErcX9RHqyzUGZhFHoYSinfbo.jpg)

其他细节参见
* 源码
* http://ifeve.com/concurrentlinkedqueue/
* http://www.importnew.com/25668.html

**注意：使用调试器观察可能出现意想不到的问题（在我机器上打断点观察到的值和分析和预期不符，可能是sun.misc.Unsafe太过于底层导致的）**


### 3、其他并发容器
#### （1）并发Set
#### （2）并发Map
#### （3）CopyOnWriteArraySet

参见Java Doc

## 四、线程池和执行器
********************************
### 1、线程池使用
#### （1）创建
```java
new ThreadPoolExecutor(corePoolSize, maximumPoolSize,
	keepAliveTime, milliseconds,runnableTaskQueue, threadFactory,handler);
```

[文档](http://tool.oschina.net/uploads/apidocs/jdk-zh/java/util/concurrent/ThreadPoolExecutor.html)

* `corePoolSize` 池中所保存的线程数，包括空闲线程
* `maximumPoolSize` 池中允许的最大线程数
* `keepAliveTime` 当线程数大于核心时，此为终止前多余的空闲线程等待新任务的最长时间
* `unit`  keepAliveTime 参数的时间单位。
* `workQueue` 执行前用于保持任务的队列。此队列仅保持由 execute 方法提交的 Runnable 任务。
* `runnableTaskQueue` 任务队列，可选如下
	* `ArrayBlockingQueue` 是一个基于数组结构的有界阻塞队列
	* `LinkedBlockingQueue` 一个基于链表结构的阻塞队列，此队列按FIFO （先进先出） 排序元素，吞吐量通常要高于ArrayBlockingQueue。静态工厂方法Executors.newFixedThreadPool()使用了这个队列。
	* `SynchronousQueue` 一个不存储元素的阻塞队列。每个插入操作必须等到另一个线程调用移除操作，否则插入操作一直处于阻塞状态，吞吐量通常要高于LinkedBlockingQueue，静态工厂方法Executors.newCachedThreadPool使用了这个队列。
	* `PriorityBlockingQueue` 一个具有优先级得无限阻塞队列
* `threadFactory` 用于设置创建线程的工厂，可以通过线程工厂给每个创建出来的线程设置更有意义的名字，Debug和定位问题时非常又帮助。
* `handler` 由于超出线程范围和队列容量而使执行被阻塞时所使用的处理程序。


一般情况下使用`Executors`的相关如下工厂方法创建线程池，而不是手动调配参数
* `Executors.newCachedThreadPool`系列，（无界线程池，可以进行自动线程回收），参数如下
	* `corePoolSize=0`
	* `maximumPoolSize=Integer.MAX_VALUE`
	* `keepAliveTime=60L` 
	* `unit=TimeUnit.SECONDS`
	* `workQueue=new SynchronousQueue<Runnable>()`
* `Executors.newFixedThreadPool(int nThreads)`（固定大小线程池)，参数如下
	* `corePoolSize=nThreads`
	* `maximumPoolSize=nThreads`
	* `keepAliveTime=0` 
	* `unit=TimeUnit.MILLISECONDS`
	* `workQueue=new LinkedBlockingQueue<Runnable>()`
* `Executors.newSingleThreadExecutor()`（单个后台线程），参数如下
	* `corePoolSize=1`
	* `maximumPoolSize=1`
	* `keepAliveTime=0` 
	* `unit=TimeUnit.MILLISECONDS`
	* `workQueue=new LinkedBlockingQueue<Runnable>()`

#### （2）向线程池提交任务
* `execute(Runnable)` 直接执行
* `submit` 提交返回一个Future

	
#### （3）线程池关闭
shutdown或shutdownNow


### 2、线程池的分析
线程池的处理流程如下：
* 首先线程池判断基本线程池是否已满？没满，创建一个工作线程来执行任务。满了，则进入下个流程。
* 其次线程池判断工作队列是否已满？没满，则将新提交的任务存储在工作队列里。满了，则进入下个流程。
* 最后线程池判断整个线程池是否已满？没满，则创建一个新的工作线程来执行任务，满了，则交给饱和策略来处理这个任务。

### 3、合理的配置线程池
http://ifeve.com/java-threadpool/
### 4、线程池的监控
http://ifeve.com/java-threadpool/

### 5、执行器
#### （1）`java.util.concurrent.Executor`接口
此接口提供一种将任务提交与每个任务将如何运行的机制（包括线程使用的细节、调度等）分离开来的方法。通常使用 Executor 而不是显式地创建线程。例如，可能会使用以下方法，而不是为一组任务中的每个任务调用 `new Thread(new(RunnableTask())).start()`：
```java
Executor executor = anExecutor;
executor.execute(new RunnableTask1()); //唯一的方法
executor.execute(new RunnableTask2());
```
该接口不保证底层实现是多线程的

#### （2）`java.util.concurrent.ExecutorService`接口
提供了通过Callable等创建Future的接口定义。继承了`java.util.concurrent.Executor`接口

#### （3）`java.util.concurrent.Executors`工具类
此包中所定义的 Executor、ExecutorService、ScheduledExecutorService、ThreadFactory 和 Callable 类的工厂和实用方法。此类支持以下各种方法：
* 创建各种`ExecutorService`的实现：`static ExecutorService newXXXXXX()`
* 构造`Callable`：`static<T> Callable<T> callable(...)` 
* 返回线程工厂


## 五、无阻塞算法
*****************************
### 1、CAS
CAS（Compare and swap）比较和替换是设计并发算法时用到的一种技术。简单来说，比较和替换是使用一个期望值和一个变量的当前值进行比较，如果当前变量的值与我们期望的值相等，就使用一个新值替换当前变量的值。

并且者是一个原子操作，一般由操作系统或底层硬件实现。

### 2、例子
#### （1）线程安全自加器
参见 [11、乐观锁与悲观锁](#11、乐观锁与悲观锁)

#### （2）Java ConcurrentLinkedQueue的实现
参见 [2、非阻塞并发队列](#2、非阻塞并发队列)


## 六、常见的并发模型
********************************
### 1、并行工作者
#### （1）表述
作业传递给不同的工作者上。是Java最常见的形式。

比如JavaEE的web服务servlet。针对每个请求分配一个线程处理。
比如web爬虫，这种IO密集型的任务，可以提高并行度

#### （2）优缺点
**优点**
它很容易理解。你只需添加更多的工作者来提高系统的并行度。
**缺点**
共享状态很复杂，比如说共享数据库文件等（Java web 数据库）。可能出现静态条件和死锁。
任务顺序是不确定的




### 2、流水线模型
#### （1）表述
其他称谓：事件驱动系统或者反应器

流行的平台：
* Vert.x
* AKKa
* Node.JS(JavaScript)

#### （2）优缺点
**优点**
无需共享的状态，在宏观上将是并行的，但是在每个单元上来说，又是单线程实现的。所以
* 无需共享的状态
* 工作者是有状态的
* 较好的硬件整合（利用硬件的优化）
* 合理的作业顺序

**缺点**
* 代码追踪调试困难
* 容易陷入回调地狱

### 3、函数式并行
* Actor 模型
* ForkAndJoinPool
* Java8中并行streams

## 七、原子对象
*************************
参见 `java.util.concurrent.atomic` 包 since java1.5



