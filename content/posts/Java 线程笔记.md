---
title: Java 线程笔记
date: 2017-05-21T12:46:27+08:00
draft: false
toc: false
comments: true
aliases:
  - /detail/80
  - /detail/80/
tags:
  - java
---

## 目录
* [1、创建线程的方式](#1、创建线程的方式)
* [2、Thread常用方法](#2、Thread常用方法)
* [3、线程状态](#3、线程状态)
* [4、线程同步](#4、线程同步)
* [5、其他线程相关类](#5、其他线程相关类)


### 1、创建线程的方式
* 实现`java.lang.Runnable`接口
* 继承自`java.lang.Thread`类

```java
public class TestThread1 {
    public static void main(String args[]) {
        Runner1 r = new Runner1();
        r.start();
        //r.run();
        //Thread t = new Thread(r);
        //t.start();
         
        for(int i=0; i<100; i++) {
            System.out.println("Main Thread:------" + i);
        }
    }
}
 
//class Runner1 implements Runnable {
class Runner1 extends Thread {
    public void run() {
        for(int i=0; i<100; i++) {   
            System.out.println("Runner1 :" + i);
        }
    }
}
```

如何选择两种方式
* 大多数情况下，如果只想重写 run() 方法，而不重写其他 Thread 方法，那么应使用 Runnable 接口。



### 2、Thread常用方法
#### （1）静态方法
* `Thread.sleep(long millis)` 线程睡眠时间
*	`Thread.currentThread()` 获取当前线程对象


#### （2）实例方法
* `t.isAlive()`：线程是否存活（线程处于三个状态都返回true）
* `t.getPriority()`：获取线程优先级
* `t.setPriority()`：设置线程优先级
	* Java线程的优先级用整数表示，取值范围是1~10，Thread类有以下三个静态常量：
	* `Thread.MAX_PRIORITY` 线程可以具有的最高优先级，取值为10。
	* `Thread.MIN_PRIORITY` 线程可以具有的最低优先级，取值为1。
	* `Thread.NORM_PRIORITY` 分配给线程的默认优先级，取值为5。
* `t.join()`：线程合并，，也就是说当前线程阻塞，等待`t`线程结束
* `t.yield()`：`t`线程让出cpu，让其他线程执行
* `t.wait()`：(来自Object)使该线程处于等待池(wait blocked pool)，**并释放锁**，直到notify()/notifyAll()，**只有`synchronized`代码体内才能调用**
* `t.notify()`：(来自Object)从等待池(wait blocked pool)，唤醒一个线程
* `t.notifyAll()`：(来自Object)从等待池(wait blocked pool),唤醒全部线程
* `t.interrupt()`：中断此线程
	* 不会中断处于运行状态的线程
	* 在进程处于阻塞状态时（如果线程在调用 Object 类的 wait()、wait(long) 或 wait(long, int) 方法，或者该类的 join()、join(long)、join(long, int)、sleep(long) 或 sleep(long, int) 方法），将接收到一个`InterruptedException`等待处理
* `t.stop()`：**已废弃**，中止线程


**`Thread.sleep(long millis)` 与 `t.interrupt()`**
```java
import java.util.*;
public class TestInterrupt {
  public static void main(String[] args) {
    MyThread thread = new MyThread();
    thread.start();
    try {Thread.sleep(10000);}
    catch (InterruptedException e) {}
		
    thread.interrupt();
  }
}

class MyThread extends Thread {
	boolean flag = true;
  public void run(){
    while(flag){
      System.out.println("==="+new Date()+"===");
      try {
        sleep(1000);
      } catch (InterruptedException e) {
        return;
      }
    }
  }
}

```


**正确中止一个线程**
定义一个共享标志量


**线程合并**
等待子线程执行结束。再执行下面的逻辑
```java
public class TestJoin {
  public static void main(String[] args) {
    MyThread2 t1 = new MyThread2("abcde");
    t1.start();
    try {
        t1.join();
    } catch (InterruptedException e) {}
         
    for(int i=1;i<=10;i++){
      System.out.println("i am main thread");
    }
  }
}
class MyThread2 extends Thread {
  MyThread2(String s){
    super(s);
  }
   
  public void run(){
    for(int i =1;i<=10;i++){
      System.out.println("i am "+getName());
      try {
        sleep(1000);
      } catch (InterruptedException e) {
        return;
      }
    }
  }
}
```




### 3、线程状态
* 新建状态：新创建了一个线程对象
* 就绪状态：线程对象创建后，其他线程调用了该对象的`start()`方法。该状态的线程位于可运行线程池中，变得可运行，等待获取CPU的使用权。
* 阻塞状态：阻塞状态是线程因为某种原因放弃CPU使用权，暂时停止运行。直到线程进入就绪状态，才有机会转到运行状态。阻塞的情况分三种：
	* 等待阻塞：运行的线程执行`wait()`方法，JVM会把该线程放入等待池中。
	* 同步阻塞：运行的线程在获取对象的同步锁时，若该同步锁被别的线程占用，则JVM会把该线程放入锁池中。
	* 其他阻塞：运行的线程执行`sleep()`或`join()`方法，或者发出了I/O请求时，JVM会把该线程置为阻塞状态。
	* 当`sleep()`状态超时、`join()`等待线程终止或者超时、或者I/O处理完毕时，线程重新转入就绪状态。
* 运行状态：就绪状态的线程获取了CPU，执行程序代码。
* 死亡状态：线程执行完了或者因异常退出了run()方法，该线程结束生命周期。

```
新建状态 -----start()----->  就绪状态  <----调度----> 运行状态 ----> 死亡状态
                               ^                      |
                   （阻塞解除） |                      | （导致阻塞的事件）
                               └----- 阻塞状态 <-------┘
```


### 4、线程同步
#### （1）问题
当多个线程同时操纵一份资源时，可能出现意想不到的问题，导致数据不一致
```java
public class TestSync implements Runnable {
	Timer timer = new Timer();

	public static void main(String[] args) {
		TestSync test = new TestSync();
		Thread t1 = new Thread(test);
		Thread t2 = new Thread(test);
		t1.setName("t1");
		t2.setName("t2");
		t1.start();
		t2.start();
	}
	public void run(){
		timer.add(Thread.currentThread().getName());
	}
}

class Timer{
	private static int num = 0;

	public /*synchronized*/ void add(String name){
		//synchronized (this) {
		num ++;
		try {Thread.sleep(1);}
		catch (InterruptedException e) {}
		System.out.println(name+", 你是第"+num+"个使用timer的线程");
		//}
	}
}
```
输出：
t2, 你是第2个使用timer的线程
t1, 你是第2个使用timer的线程

#### （2）加锁
锁定当前对象
```java
synchronized (this) {
	//原子操作
}
```
或者
```java
public synchronized returnType 原子操作方法名(参数列表){
	//原子操作
}
```
注意并不是加了锁，之后该对象就不能被更改，其他没有加锁的代码仍然可以修改其值
```java
public class TestSynchronized implements Runnable {
	Integer b = 100;

	public synchronized void m1() throws Exception{
		b = 1000;
		Thread.sleep(5000);
		System.out.println("b = " + b);

	}

	public void m2() throws Exception {
		Thread.sleep(2500);
		b = 2000;
	}

	public void run() {
		try {
			m1();
		} catch(Exception e) {
			e.printStackTrace();
		}
	}

	public static void main(String[] args) throws Exception {
		TestSynchronized tt = new TestSynchronized();
		Thread t = new Thread(tt);
		t.start();
		
		Thread.sleep(1000);
		tt.m2();
	}
}
//输出为 b = 2000
```
所以说，对于代码段，只有都加了锁才能实现互斥的作用，并不是单纯的锁住资源，其他代码段无法访问
```java
package com.rectcircle.javaapi.lang.thread;

public class TestSynchronized implements Runnable {
	Integer b = 100;

	public synchronized void m1() throws Exception{
		b = 1000;
		Thread.sleep(5000);
		System.out.println("b = " + b);
	}

	public synchronized void m2() throws Exception {
		Thread.sleep(2500);
		b = 2000;
	}

	public void run() {
		try {
			m1();
		} catch(Exception e) {
			e.printStackTrace();
		}
	}

	public static void main(String[] args) throws Exception {
		TestSynchronized tt = new TestSynchronized();
		Thread t = new Thread(tt);
		t.start();

		Thread.sleep(1000);
		tt.m2();
	}
}
```

锁的效果在锁与锁之间有效

`synchronized(obj){代码体}` 的含义是:
* 当执行**代码体**时，需要获取obj的锁对象，先检查是否可以获取
	* 若可以获取，则，获取锁对象，执行代码体。执行结束后，释放锁对象
	* 若不可获取，则，等待别的方法是否该锁对象，直到可以获取

对于不加`synchronized`的代码体：
* 不需要检查锁对象，即可直接执行代码

锁对象官方称为：对象的监视器



#### （3）加锁的问题：死锁
线程A锁住对象O1，并需要等待锁住O2，即可完成操作
线程B锁住对象O2，并需要等待锁住O1，即可完成操作
于是线程A、B在等待对方的锁释放，导致死锁，程序死在这里

```java
package com.rectcircle.javaapi.lang.thread;

public class TestDeadLock implements Runnable {
	public int flag = 1;
	static Object o1 = new Object(), o2 = new Object();

	public void run() {
		System.out.println("flag=" + flag);
		if(flag == 1) {
			synchronized(o1) {
				try {
					Thread.sleep(500);
				} catch (Exception e) {
					e.printStackTrace();
				}
				synchronized(o2) {
					System.out.println("1");
				}
			}
		}
		if(flag == 0) {
			synchronized(o2) {
				try {
					Thread.sleep(500);
				} catch (Exception e) {
					e.printStackTrace();
				}
				synchronized(o1) {
					System.out.println("0");
				}
			}
		}
	}

	public static void main(String[] args) {
		TestDeadLock td1 = new TestDeadLock();
		TestDeadLock td2 = new TestDeadLock();
		td1.flag = 1;
		td2.flag = 0;
		Thread t1 = new Thread(td1);
		Thread t2 = new Thread(td2);
		t1.start();
		t2.start();

	}
}
```

#### （4）解决死锁

#### （5）生产者和消费者问题
实现方法：
使用`BlockingQueue`

或者自己实现
```java
package com.rectcircle.javaapi.lang.thread;


public class ProducerConsumer {
	public static void main(String[] args) {
		SyncStack ss = new SyncStack();
		Producer p = new Producer(ss);
		Consumer c = new Consumer(ss);
		new Thread(p).start();
		new Thread(p).start();
		new Thread(c).start();
		new Thread(c).start();
	}
}

/**
 * 生产的对象
 */
class WoTou {
	int id;
	WoTou(int id) {
		this.id = id;
	}
	public String toString() {
		return "WoTou : " + id;
	}
}

/**
 * 同步栈
 */
class SyncStack {
	int index = 0;
	WoTou[] arrWT = new WoTou[6];

	public synchronized void push(WoTou wt) { //添加产品
		while(index == arrWT.length) {
			try {
				this.wait(); //线程等待，并释放锁
			} catch (InterruptedException e) {
				e.printStackTrace();
			}
		}
		this.notifyAll(); //唤醒所有wait()
		arrWT[index] = wt;
		index ++;
	}

	public synchronized WoTou pop() { //消费产品
		while(index == 0) {
			try {
				this.wait(); //线程等待，并释放锁
			} catch (InterruptedException e) {
				e.printStackTrace();
			}
		}
		this.notifyAll();
		index--;
		return arrWT[index];
	}
}

class Producer implements Runnable {
	SyncStack ss = null;
	Producer(SyncStack ss) {
		this.ss = ss;
	}

	public void run() {
		for(int i=0; i<20; i++) {
			WoTou wt = new WoTou(i);
			ss.push(wt);
			System.out.println("生产了：" + wt);
			try {
				Thread.sleep((int)(Math.random() * 200));
			} catch (InterruptedException e) {
				e.printStackTrace();
			}
		}
	}
}

class Consumer implements Runnable {
	SyncStack ss = null;
	Consumer(SyncStack ss) {
		this.ss = ss;
	}

	public void run() {
		for(int i=0; i<20; i++) {
			WoTou wt = ss.pop();
			System.out.println("消费了: " + wt);
			try {
				Thread.sleep((int)(Math.random() * 1000));
			} catch (InterruptedException e) {
				e.printStackTrace();
			}
		}
	}
}
```

### 5、其他线程相关类
> `java.lang.ThreadLocal`
> java1.5 以后提供`java.util.concurrent`包，提供高级工具

#### （1）`java.lang.ThreadLocal`
该类的实例在每个不同的线程都会维护一个副本，互不影响

```java
package com.rectcircle.javaapi.lang.thread;

public class ThreadLocalTest {
	public static void main(String[] args) {
		ThreadLocal<Integer> tl = new ThreadLocal<Integer>(){
			@Override
			public Integer initialValue() {
				return 0;
			}
		};

		Run r = new Run(tl);

		new Thread(r).start();
		new Thread(r).start();
		new Thread(r).start();

		for(int i=0; i<3;i++){
			System.out.print(tl.get()+" ");
			tl.set(tl.get()+1);
		}
		tl.remove();
		for(int i=0; i<3;i++){
			System.out.print(tl.get()+" ");
			tl.set(tl.get()+1);
		}
	}
}

class Run implements Runnable{
	ThreadLocal<Integer> tl = null;

	public Run(ThreadLocal<Integer> tl){
		this.tl = tl;
	}

	@Override
	public void run() {
		for(int i=0; i<3;i++){
			System.out.print(tl.get()+" ");
			tl.set(tl.get()+1);
		}
	}
}

//输出：0 1 2 0 1 2 0 1 2 0 1 2 0 1 2 
```






