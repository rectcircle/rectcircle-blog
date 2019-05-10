---
title: Java并发（二）
date: 2018-03-25T16:21:33+08:00
draft: false
toc: true
comments: true
aliases:
  - /detail/130
  - /detail/130/
tags:
  - Java
---

> 参考：[并发编程网](http://ifeve.com/)

## 八、各种锁

***

### 1、自己实现一个简单的锁

```java
public class Lock{
	private boolean isLocked = false;

	public synchronized void lock()
		throws InterruptedException{
		while(isLocked){ //自旋锁防止虚假唤醒
			wait();
		}
		isLocked = true;
	}

	public synchronized void unlock(){
		isLocked = false;
		notify();
	}
}
```

使用

```java
public class Counter{
	private Lock lock = new Lock();
	private int count = 0;

	public int inc(){
		lock.lock();
		int newCount = ++count;
		lock.unlock();
		return newCount;
	}
}
```

### 2、锁的可重入性

以上的简单实现不具备可重入性，原因是一下代码会发生死锁

```java
public class Reentrant2{
	Lock lock = new Lock();

	public outer(){
		lock.lock();
		inner();
		lock.unlock();
	}

	public synchronized inner(){
		lock.lock();
		//do something
		lock.unlock();
	}
}
```

**一个锁被同一个线程的多个方法可以多次锁定而不阻塞称为，可重入性**

改进：添加线程信息的记录和被同一线程锁定的次数

```java
public class Lock{
	boolean isLocked = false;
	Thread  lockedBy = null;
	int lockedCount = 0;

	public synchronized void lock()
		throws InterruptedException{
		Thread callingThread =
			Thread.currentThread();
		while(isLocked && lockedBy != callingThread){
			wait();
		}
		isLocked = true;
		lockedCount++;
		lockedBy = callingThread;
  }

	public synchronized void unlock(){
		if(Thread.curentThread() ==
			this.lockedBy){
			lockedCount--;

			if(lockedCount == 0){
				isLocked = false;
				notify();
			}
		}
	}

	...
}
```

#### （1）实现原理

* volatile int state 状态变量，用于实现可重入性，同一线程lock，其++，state不为0别的线程lock，阻塞
* Thread 持有当前锁的线程多项
* 维护的双端队列结构 用于记录阻塞的线程对象。
* 公平性保证先来的阻塞线程先获取锁
* 非公平是，当当前线程释放锁后，立即有新的线程过来，抢占成功，而阻塞线程没有机会获得锁
* 使用CAS+volatile+自旋 实现对状态变量和队列的修改
* 阻塞使用LockSupport.part实现

### 3、锁的公平性

略

### 4、在finally语句中调用unlock

解锁要在若存在异常要在finally块释放锁

### 5、java.util.concurrent.locks

#### （1）`java.util.concurrent.locks.Lock`接口的实现

该接口定义了锁的一般行为，java中的是实现

**ReentrantLock**

可重入的互斥锁，类似于上面的实现，同时添加了可选的公平性策略的实现

#### （2）`java.util.concurrent.locks.ReadWriteLock`接口的实现

**读写锁的概念**

在没有写操作的时候，两个线程同时读一个资源没有任何问题，所以应该允许多个线程能在同时读取共享资源。但是如果有一个线程想去写这些共享资源，就不应该再有其它线程对该资源进行读或写（译者注：也就是说：读-读能共存，读-写不能共存，写-写不能共存）。这就需要一个读/写锁来解决这个问题。

**读写的条件**

读取 没有线程正在做写操作，且没有线程在请求写操作。
写入 没有线程正在做读写操作。

**读/写锁的重入性的选择**

* 读读可重入
* 写写可重入
* 读锁升级到写锁
* 写锁降级到读锁

**ReentrantReadWriteLock**

性质：

* 支持公平模式和非公平模式（默认）
* 重入
	* 此锁允许 reader 和 writer 按照 ReentrantLock 的样式重新获取读取锁或写入锁。在写入线程保持的所有写入锁都已经释放后，才允许重入 reader 使用它们。
	* 此外，writer 可以获取读取锁，但反过来则不成立。在其他应用程序中，当在调用或回调那些在读取锁状态下执行读取操作的方法期间保持写入锁时，重入很有用。如果 reader 试图获取写入锁，那么将永远不会获得成功。
* 锁降级
	* 重入还允许从写入锁降级为读取锁，其实现方式是：先获取写入锁，然后获取读取锁，最后释放写入锁。但是，从读取锁升级到写入锁是不可能的。
* 锁获取的中断：读取锁和写入锁都支持锁获取期间的中断。

### 6、Condition

实现对Object wait和notify的封装

#### （1）创建方式

* `lock.newCondition();`

#### （2）常用方法

* `await();` 相当于Object.wait();
* `signal();` 相当于Object.notify();

#### （3）例子

```java
 class BoundedBuffer {
   final Lock lock = new ReentrantLock();
   final Condition notFull  = lock.newCondition();
   final Condition notEmpty = lock.newCondition();

   final Object[] items = new Object[100];
   int putptr, takeptr, count;

   public void put(Object x) throws InterruptedException {
     lock.lock();
     try {
       while (count == items.length)
         notFull.await();
       items[putptr] = x;
       if (++putptr == items.length) putptr = 0;
       ++count;
       notEmpty.signal();
     } finally {
       lock.unlock();
     }
   }

   public Object take() throws InterruptedException {
     lock.lock();
     try {
       while (count == 0)
         notEmpty.await();
       Object x = items[takeptr];
       if (++takeptr == items.length) takeptr = 0;
       --count;
       notFull.signal();
       return x;
     } finally {
       lock.unlock();
     }
   }
 }
```

#### （4）实现原理

底层不使用wait实现而是使用LockSupport.part(unsafe.park)本地方法来实现阻塞的

他们的区别：

* 面向的主体不一样。LockSuport主要是针对Thread进进行阻塞处理，可以指定阻塞队列的目标对象，每次可以指定具体的线程唤醒。Object.wait()是以对象为纬度，阻塞当前的线程和唤醒单个(随机)或者所有线程。
* 实现机制不同。虽然LockSuport可以指定monitor的object对象，但和object.wait()，两者的阻塞队列并不交叉。可以看下测试例子。object.notifyAll()不能唤醒LockSupport的阻塞Thread.
* LockSupport.part 底层使用Linux下使用`pthread_cond_wait`实现

### 7、LockSupport

如果没有这个类，那么需要同步阻塞一个线程只能使用Object对象的wait、notify相关方法。但是Object的这些方法是针对对象而不是针对一个线程的。

所以Java1.6新增了LockSupport 用于创建锁定和其他同步类的基本线程阻塞原语。

特点如下

* 类似于二元信号量
* 其实现机制和wait/notify有所不同，面向的是线程。
* 不需要依赖监视器
* 与wait/notify没有交集
* 使用起来更加灵活方便
* LockSupport是不可重入
* LockSupport.park会设置中断标志，不会抛出InterruptedException

## 九、Fork-join框架

***

### 1、Fork-join的简单例子

使用ForkJoin实现`[start,end]`范围内整数之和

```java
import java.util.concurrent.*;

public class Main{

	//计算[start, end]范围内整数的和
	public static class CountTask extends RecursiveTask<Integer>{
		private static final int THRESHOLD = 2;
		private int start;
		private int end;

		public CountTask(int start, int end) {
			this.start = start;
			this.end = end;
		}

		@Override
		public String toString(){
			return "CountTast("+start+", "+end+")";
		}


		@Override
		protected Integer compute() {
			System.out.println(this.toString()+" Work in "+Thread.currentThread().getName());
			int sum = 0;
			boolean canCompute = (end - start) <= THRESHOLD;
			if (canCompute) {
				for (int i = start; i <= end; i++)
					sum += i;
			} else {
				//如果任务大于阀值，就分裂成两个子任务计算
				int mid = (start + end) / 2;
				CountTask leftTask = new CountTask(start, mid);
				CountTask rightTask = new CountTask(mid+1, end);

				//执行子任务
				leftTask.fork();
				rightTask.fork();

				//等待子任务执行完，并得到结果
				int leftResult = (int)leftTask.join();
				int rightResult = (int)rightTask.join();

				sum = leftResult + rightResult;
			}

			return sum;
		}
	}

	public static void main(String[] args) throws Exception{
		ForkJoinPool forkJoinPool = new ForkJoinPool(); //创建一个ForkJoin线程池
		 //生成一个计算资格，负责计算1+2+3+4
		CountTask task = new CountTask(1, 4);
		Future<Integer> result = forkJoinPool.submit(task);
		Thread.sleep(1000);
		if(result.isDone()){
			System.out.println(result.get());
		}
	}
}
```

### 2、Fork-join的相关概念

#### （1）Fork Join 简介

是一种并行的分治法（递归）的框架。利用多处理机并行提高分治算法的效率。
典型用法

```java
Result solve(Problem problem) {
	if (problem足够小)
		直接解决问题
	else {
			将问题分割成独立的部分
			衍生出新的子任务无解决每一部分（并行、使用独立的线程，与普通递归算法不同的地方）
			等待所有的子任务完成
			根据子任务结果得到问题的结果并返回
		}
}
```

#### （2）Fork-join的设计要求

对于Fork-join框架的设计者

Fork Join设计出来就是为了提高任务完成的效率，围绕这个目标，有一些要点是设计中需要考虑的，下面就给出一些要点。

* 线程的管理和线程的单纯性。基于如上的设计思路，我们可以看到子任务之间的相关性是相对比较简单的，可以并行处理。为了提高效率，并不需要重量级的线程结构和对应的线程维护，线程实现简单就好，满足需求即可，降低维护成本。
* 队列机制，硬件支持一定是比较有限的，那么分解的任务应该用队列维护起来，一个好的队列设计是很有必要的。
* “工作窃取”，也就是设计论文原文中提到的 Work Stealing 。对于负载比较轻的线程，可以帮助负载较重的执行线程分担任务。

对于使用者

* 可用线程数和硬件支持。线程这东西，也是有开销的东西，绝对不是越多越好，尤其在硬件基础有限的情况下。
* 任务分解的粒度。和前者有关系，就是分解的任务，“小”到什么程度是可以接受的，不可再分。

#### （3）Fork Join数据结构支持

* 轻量级的线程结构。
* 维护线程的线程池，负责线程的创建，数量维护和任务管理。
* 维护任务，并支持Work Stealing的双端队列。如下图。

### 3、Fork-join的jdk实现

#### （1）相关类

* `ForkJoinPool` 实现ForkJoin的线程池
* `ForkJoinWorkerThread`  实现ForkJoin的线程
* `ForkJoinTask<V>` 一个描述ForkJoin的抽象类
* `RecursiveAction` 无返回结果的ForkJoinTask实现
* `RecursiveTask<V>` 有返回结果的ForkJoinTask实现

#### （2）ForkJoinPool

ForkJoinPool是实现了Fork Join的线程池。看JDK源码我们知道ForkJoinPool是extends AbstractExecutorService的，也就是说间接地实现了Executor和ExecutorService接口。实际上也就意味着 ForkJoinPool是继ThreadPoolExecutor后的又一个Executor(Service)的具体实现。

**构建初始化**

* int parallelism 第一个参数是并行度，这个参数间接影响着（会额外做一些运算）这个ForkJoinPool的ForkJoinWorkerThread线程数，默认情况下，这个参数是任务运行环境的处理器个数。
* ForkJoinWorkerThreadFactory factory 这个是ForkJoinPool构建新线程ForkJoinWorkerThread 对象的工厂，类似于ThreadPoolExecutor中用到的ThreadFactory。
* Thread.UncaughtExceptionHandler handler 是线程异常处理器

**任务提交**

|说明      |在ForkJoinPool中的方法|  在ForkJoinTask中可以使用的方法|
|----------|--------------------|---------------------------|
|任务异步执行|	execute(ForkJoinTask)|	ForkJoinTask.fork()|
|等待并获取结果|	invoke(ForkJoinTask)|	ForkJoinTask.invoke()|
|异步执行并得到一个Future|	submit(ForkJoinTask)|	ForkJoinTask.fork() (ForkJoinTasks are Futures)|

### 4、Fork-join原理

ForkJoinPool成员：

* ForkJoinTask数组：负责存放程序提交给ForkJoinPool的任务
* ForkJoinWorkerThread数组：工作者线程

ForkJoinTask的fork方法实现原理：

当我们调用ForkJoinTask的fork方法时，程序会调用ForkJoinWorkerThread的pushTask方法异步的执行这个任务，然后立即返回结果。代码如下：

```java
public final ForkJoinTask fork() {
        ((ForkJoinWorkerThread) Thread.currentThread())
            .pushTask(this);
        return this;
}
```

pushTask方法把当前任务存放在ForkJoinTask 数组queue里。然后再调用ForkJoinPool的signalWork()方法唤醒或创建一个工作线程来执行任务。

ForkJoinTask的join方法实现原理。Join方法的主要作用是阻塞当前线程并等待获取结果。
首先，它调用了doJoin()方法，通过doJoin()方法得到当前任务的状态来判断返回什么结果，任务状态有四种：已完成（NORMAL），被取消（CANCELLED），信号（SIGNAL）和出现异常（EXCEPTIONAL）。

* 如果任务状态是已完成，则直接返回任务结果。
* 如果任务状态是被取消，则直接抛出CancellationException。
* 如果任务状态是抛出异常，则直接抛出对应的异常。

在doJoin()方法里，

* 首先通过查看任务的状态，看任务是否已经执行完了，
	* 如果执行完了，则直接返回任务状态，
	* 如果没有执行完，则从任务数组里取出任务并执行。如果任务顺利执行完成了，则设置任务状态为NORMAL，
	* 如果出现异常，则纪录异常，并将任务状态设置为EXCEPTIONAL。

## 十、Java NIO

***

> 参见：[并发编程网](http://ifeve.com/java-nio-all/)

### 1、概述

#### （1）核心组件

* Channels
* Buffers
* Selectors

#### （2）Channel 和 Buffer

基本上，所有的 IO 在NIO 中都从一个Channel 开始。Channel 有点象流。 数据可以从Channel读到Buffer中，也可以从Buffer 写到Channel中。

主要Channel的实现：

* FileChannel
* DatagramChannel
* SocketChannel
* ServerSocketChannel

关键的Buffer实现：

* ByteBuffer
* CharBuffer
* DoubleBuffer
* FloatBuffer
* IntBuffer
* LongBuffer
* ShortBuffer

#### （3）Selector

类似于Linux中的select

### 2、Channel

通道类似流，但又有些不同：

* 既可以从通道中读取数据，又可以写数据到通道。但流的读写通常是单向的。
* 通道可以异步地读写。
* 通道中的数据总是要先读到一个Buffer，或者总是要从一个Buffer中写入。

#### （1）如何获取一个通道

文件管道：

* FileInputStream
* FileOutputStream 或
* RandomAccessFile 对象

从io流构建

* `java.nio.channels.Channels`工厂方法

从Socket获取

* `DatagramSocket`
* `Socket`
* `ServerSocket`

### 3、Buffer

在虚拟机中的一块称为本机直接内存的地方，通过Native方法分配内存。在这个区域的好处可以传统IO自定义缓存数组在JVM堆和Native堆之间的拷贝问题，提高效率。

#### （1）Buffer的基本用法

* 写入数据到Buffer
* 调用flip()方法
* 从Buffer中读取数据
* 调用clear()方法或者compact()方法

当向buffer写入数据时，buffer会记录下写了多少数据。一旦要读取数据，需要通过flip()方法将Buffer从写模式切换到读模式。在读模式下，可以读取之前写入到buffer的所有数据。

一旦读完了所有的数据，就需要清空缓冲区，让它可以再次被写入。有两种方式能清空缓冲区：调用clear()或compact()方法。clear()方法会清空整个缓冲区。compact()方法只会清除已经读过的数据。任何未读的数据都被移到缓冲区的起始处，新写入的数据将放到缓冲区未读数据的后面。

#### （2）例子

```java
import java.io.*;
import java.nio.*;
import java.nio.channels.*;

public class Main{
	public static void main(String[] args) throws Exception{
		RandomAccessFile aFile = new RandomAccessFile("nio-data.txt", "rw");
		//获得文件频道
		FileChannel inChannel = aFile.getChannel();
		//字节缓冲
		ByteBuffer buf = ByteBuffer.allocate(48);
		//异步读到Buffer中
		int bytesRead = inChannel.read(buf);
		while (bytesRead != -1) {
			//输出上次读了多长
			System.out.println("Read " + bytesRead);
			buf.flip(); //反转Buffer

			while(buf.hasRemaining()){ //缓冲区是否有数据
				System.out.print((char) buf.get()); //一个一个读出来
			}

			buf.clear(); //清空缓冲
			bytesRead = inChannel.read(buf); //再读
		}
		aFile.close();
	}
}
```

#### （3）Buffer的实现机制——capacity,position和limit

* `capacity` Buffer的大小（可理解为数组大小）
* `position`
	* 在写模式，初始值为0，下一个可写的位置最大值为capacity – 1
	* 在对模式，position重新初始化为0，表示下一个可读的位置，最大为limit
* `limit`
	* 在写模式，表示最大可写数据数目，等于capacity
	* 在从写模式切换到读模式后，limit = 写模式下的position

基本流程

* `Buffer.allocate`：写模式-初始化
	* capacity = 设定值
	* position = 0
	* limit = capacity
* `put|take`：读、写模式-过程(读、写入n个)
	* position + n < limit
		* 成立：position += n
		* 不成立：报错或拒绝
* `rewind`：重读
	* position = 0
* `flip`：写模式->读模式
	* limit = capacity;
	* position = 0;
* `clear`：读模式->写模式（直接清除数据）
	* position = 0;
	* limit = capacity
* `compact`：读模式->写模式（保留未读完数据）
	* 将未读数据拷贝到首部
	* limit = limit - position
	* position = 0

标记和恢复，支持对当前的position做备份，在适当的时候恢复

* `mark()`
* `reset()`

#### （4）Buffer的类型

* ByteBuffer
* MappedByteBuffer
* CharBuffer
* DoubleBuffer
* FloatBuffer
* IntBuffer
* LongBuffer
* ShortBuffer

#### （5）创建Buffer

静态方法`allocate(int capacity)`

#### （6）向Buffer中写数据

* 从Channel写到Buffer。
* 通过Buffer的put()方法写到Buffer里。

#### （7）读写模式切换

* `flip()` 从写模式切换到读模式
* `clear()` 切换到写模式（历史数据不可读）
* `compact()` 将未读数据拷贝到buffer首部，切换到写模式，postion指向下一个写位置（历史未读数据可读）

#### （8）读Buffer

* 从Buffer读取数据到Channel
* 使用get()方法从Buffer中读取数据。

```java
//read from buffer into channel.
int bytesWritten = inChannel.write(buf);

byte aByte = buf.get();
```

#### （9）其他方法

**`rewind()`**

Buffer.rewind()将position设回0，所以你可以重读Buffer中的所有数据。limit保持不变，仍然表示能从Buffer中读取多少个元素（byte、char等）。

**`mark()`与`reset()`方法**

通过调用Buffer.mark()方法，可以标记Buffer中的一个特定position。之后可以通过调用Buffer.reset()方法恢复到这个position

### 4、Scatter / Gather

scatter/gather用于描述从Channel中读取或者写入到Channel的操作。

**分散（scatter）**从Channel中读取是指在读操作时将读取的数据写入多个buffer中。因此，Channel将从Channel中读取的数据“分散（scatter）”到多个Buffer中。

```java
ByteBuffer header = ByteBuffer.allocate(128);
ByteBuffer body   = ByteBuffer.allocate(1024);

ByteBuffer[] bufferArray = { header, body };

channel.read(bufferArray);
```

当一个buffer被写满后，channel紧接着向另一个buffer中写。

Scattering Reads在移动下一个buffer前，必须填满当前的buffer，这也意味着它不适用于动态消息(译者注：消息大小不固定)。换句话说，如果存在消息头和消息体，消息头必须完成填充（例如 128byte），Scattering Reads才能正常工作。

**聚集（gather）**写入Channel是指在写操作时将多个buffer的数据写入同一个Channel，因此，Channel 将多个Buffer中的数据“聚集（gather）”后发送到Channel。

```java
ByteBuffer header = ByteBuffer.allocate(128);
ByteBuffer body   = ByteBuffer.allocate(1024);

//write data into buffers

ByteBuffer[] bufferArray = { header, body };

channel.write(bufferArray);
```

注意只有position和limit之间的数据才会被写入。因此，如果一个buffer的容量为128byte，但是仅仅包含58byte的数据，那么这58byte的数据将被写入到channel中。因此与Scattering Reads相反，Gathering Writes能较好的处理动态消息。

### 5、通道之间的数据传输

在Java NIO中，如果两个通道中有一个是FileChannel，那你可以直接将数据从一个channel（译者注：channel中文常译作通道）传输到另外一个channel。

```java
RandomAccessFile fromFile = new RandomAccessFile("fromFile.txt", "rw");
FileChannel      fromChannel = fromFile.getChannel();

RandomAccessFile toFile = new RandomAccessFile("toFile.txt", "rw");
FileChannel      toChannel = toFile.getChannel();

long position = 0;
long count = fromChannel.size();

toChannel.transferFrom(position, count, fromChannel);
```

**`transferFrom(ReadableByteChannel src, long position, long count)`**

将数据从源通道传输到FileChannel中。方法的输入参数position表示从position处开始向目标文件写入数据，count表示最多传输的字节数。如果源通道的剩余空间小于 count 个字节，则所传输的字节数要小于请求的字节数。

**`transferTo(long position, long count, WritableByteChannel target)`**

将字节从此通道的文件传输到给定的可写入字节通道。

### 6、Selector

功能类似于POSIX中的select()函数，主要用于套接字通讯、网络编程

#### （1）创建

```java
Selector selector = Selector.open();
```

#### （2）注册通道

为了将Channel和Selector配合使用，必须将channel注册到selector上。通过SelectableChannel.register()方法来实现，如下：

```java
channel.configureBlocking(false);
SelectionKey key = channel.register(selector,
	Selectionkey.OP_READ);
```

与Selector一起使用时，**Channel必须处于非阻塞模式下**。这意味着不能将FileChannel与Selector一起使用，因为FileChannel不能切换到非阻塞模式。而套接字通道都可以。

注意register()方法的第二个参数。这是一个“interest集合”，意思是在通过Selector监听Channel时对什么事件感兴趣。可以监听四种不同类型的事件（对应网络编程的方法）：

* Connect
* Accept
* Read
* Write

使用如下常量

* SelectionKey.OP_CONNECT
* SelectionKey.OP_ACCEPT
* SelectionKey.OP_READ
* SelectionKey.OP_WRITE

还可以通过位或连接起来（c风格）

```java
int interestSet = SelectionKey.OP_READ | SelectionKey.OP_WRITE;
```

#### （3）SelectionKey

当向Selector注册Channel时，register()方法会返回一个SelectionKey对象。这个对象包含了一些你感兴趣的属性：

* interest集合：interest集合是你所选择的感兴趣的事件集合。可以通过SelectionKey读写interest集合
* ready集合：ready 集合是通道已经准备就绪的操作的集合。
* Channel：获得该Channel的引用
* Selector：获得该Selector的引用
* 附加的对象（可选）

#### （4）通过Selector选择通道

一旦向Selector注册了一或多个通道，就可以调用几个重载的select()方法。这些方法返回你所感兴趣的事件（如连接、接受、读或写）已经准备就绪的那些通道。换句话说，如果你对“读就绪”的通道感兴趣，select()方法会返回读事件已经就绪的那些通道。

下面是select()方法：

* int select()
* int select(long timeout)
* int selectNow()

select()方法返回的int值表示有多少通道已经就绪。亦即，自上次调用select()方法后有多少通道变成就绪状态。如果调用select()方法，因为有一个通道变成就绪状态，返回了1，若再次调用select()方法，如果另一个通道就绪了，它会再次返回1。如果对第一个就绪的channel没有做任何操作，现在就有两个就绪的通道，但在每次select()方法调用之间，只有一个通道就绪了。

#### （5）selectedKeys()

一旦调用了select()方法，并且返回值表明有一个或更多个通道就绪了，然后可以通过调用selector的selectedKeys()方法，访问“已选择键集（selected key set）”中的就绪通道。如下所示：

```java
Set selectedKeys = selector.selectedKeys()
```

可以遍历这个已选择的键集合来访问就绪的通道。如下：

```java
Set selectedKeys = selector.selectedKeys();
Iterator keyIterator = selectedKeys.iterator();
while(keyIterator.hasNext()) {
    SelectionKey key = keyIterator.next();
    if(key.isAcceptable()) {
        // a connection was accepted by a ServerSocketChannel.
    } else if (key.isConnectable()) {
        // a connection was established with a remote server.
    } else if (key.isReadable()) {
        // a channel is ready for reading
    } else if (key.isWritable()) {
        // a channel is ready for writing
    }
    keyIterator.remove();
}
```

**注意每次迭代末尾的keyIterator.remove()调用**。Selector不会自己从已选择键集中移除SelectionKey实例。必须在处理完通道时自己移除。下次该通道变成就绪时，Selector会再次将其放入已选择键集中。

SelectionKey.channel()方法返回的通道需要转型成你要处理的类型，如ServerSocketChannel或SocketChannel等。

#### （6）wakeUp()

某个线程调用select()方法后阻塞了，即使没有通道已经就绪，也有办法让其从select()方法返回。只要让其它线程在第一个线程调用select()方法的那个对象上调用Selector.wakeup()方法即可。阻塞在select()方法上的线程会立马返回。

如果有其它线程调用了wakeup()方法，但当前没有线程阻塞在select()方法上，下个调用select()方法的线程会立即“醒来（wake up）”。

#### （7）close()

用完Selector后调用其close()方法会关闭该Selector，且使注册到该Selector上的所有SelectionKey实例无效。通道本身并不会关闭。

### 7、Java NIO FileChannel

#### （1）打开FileChannel

我们无法直接打开一个FileChannel，需要通过使用一个InputStream、OutputStream或RandomAccessFile来获取一个FileChannel实例

```java
RandomAccessFile aFile = new RandomAccessFile("data/nio-data.txt", "rw");
FileChannel inChannel = aFile.getChannel();
```

#### （2）从FileChannel读取数据

略，见上例

#### （3）向FileChannel写数据

```java
String newData = "New String to write to file..." + System.currentTimeMillis();

ByteBuffer buf = ByteBuffer.allocate(48);
buf.clear();
buf.put(newData.getBytes());

buf.flip();

while(buf.hasRemaining()) {
	channel.write(buf);
}
```

注意FileChannel.write()是在while循环中调用的。因为无法保证write()方法一次能向FileChannel写入多少字节，因此需要重复调用write()方法，直到Buffer中已经没有尚未写入通道的字节。

#### （4）关闭FileChannel

`channel.close();`

#### （5）FileChannel其他方法

* 获取当前位置：`position()`
* 设置当前位置：`position(long pos)`
* 获取文件大小：`long fileSize = channel.size();`
* 删除向指定位置之后的内容：	`channel.truncate(1024);`
* 强制写入磁盘：`FileChannel.force(boolean)`，参数表明是否同时写元信息

### 8、Java NIO SocketChannel

相当于socket

#### （1）创建

* （客户端）打开一个SocketChannel并连接到互联网上的某台服务器。
* （服务端）一个新连接到达ServerSocketChannel时，会创建一个SocketChannel。

#### （2）打开

```java
SocketChannel socketChannel = SocketChannel.open();
socketChannel.connect(new InetSocketAddress("www.baidu.com", 80));
```

#### （3）向SocketChannel写数据

```java
		ByteBuffer buf = ByteBuffer.allocate(2048);
		//切换到写模式
		buf.clear();
		buf.put(("GET / HTTP/1.1\r\n"+
			"Host: www.baidu.com\r\n"+
			"Connection: keep-alive\r\n\r\n").getBytes());
		//切换到读模式
		buf.flip();
		//写入网络
		while(buf.hasRemaining()) {
			socketChannel.write(buf);
		}
		buf.clear();
```

#### （4）从SocketChannel读取数据

```java
		buf.clear();
		int len = socketChannel.read(buf);
		while (len != -1) {
			buf.flip(); //反转Buffer
			System.out.println(charset.decode(buf));
			buf.clear(); //清空缓冲
			len = socketChannel.read(buf); //再读
		}
```

#### （5）非阻塞模式

**设置**
`socketChannel.configureBlocking(false);`
**连接**

```java
socketChannel.connect(new InetSocketAddress("www.baidu.com", 80));
while(! socketChannel.finishConnect() ){
    //wait, or do something else...
}
```

**write()**

非阻塞模式下，write()方法在尚未写出任何内容时可能就返回了。所以需要在循环中调用write()。前面已经有例子了，这里就不赘述了。

**read()**

非阻塞模式下,read()方法在尚未读取到任何数据时可能就返回了。所以需要关注它的int返回值，它会告诉你读取了多少字节。

#### （6）非阻塞模式与选择器

非阻塞模式与选择器搭配会工作的更好，通过将一或多个SocketChannel注册到Selector，可以询问选择器哪个通道已经准备好了读取，写入等。Selector与SocketChannel的搭配使用会在后面详讲。

### 9、Java NIO ServerSocketChannel

#### （1）例子

```java
import java.io.*;
import java.nio.*;
import java.nio.channels.*;
import java.net.*;
import java.nio.charset.Charset;
import java.util.*;
import java.text.*;

public class Main{
	//编码
	final static Charset charset = Charset.forName("utf-8");

	//时间
	final static SimpleDateFormat sdf = new SimpleDateFormat("EEE, d MMM yyyy HH:mm:ss 'GMT'", Locale.US);
	static{
		sdf.setTimeZone(TimeZone.getTimeZone("GMT"));
	}

	public static void main(String[] args) throws Exception{
		//打开一个服务端套接字通道
		ServerSocketChannel serverSocketChannel = ServerSocketChannel.open();
		//绑定本机端口
		serverSocketChannel.socket().bind(new InetSocketAddress(8080));
		//创建缓冲
		ByteBuffer buf = ByteBuffer.allocate(2048);
		//循环接收连接
		while(true){
			SocketChannel socketChannel =
				serverSocketChannel.accept();
			//读数据
			while (socketChannel.read(buf)!=-1) {
				buf.flip(); //反转Buffer
				String req = charset.decode(buf).toString();
				System.out.println(req);
				buf.clear();
				if(req.contains("\r\n\r\n")){
					break;
				}
			}
			//写回数据
			buf.clear();
			String resp = buildBody("<!DOCTYPE html>"+
					"<html lang=\"zh_CN\">"+
					"<head>"+
					"	<meta charset=\"UTF-8\">"+
					"	<title>Test</title>"+
					"</head>"+
					"<body>"+
					"	<h1>Hello World</h1>"+
					"</body>"+
					"</html>");
			buf.put(resp.getBytes());
			buf.flip(); //切换到buffer模式
			System.out.println(resp);
			while(buf.hasRemaining()){
				socketChannel.write(buf);
			}
			buf.clear();
			socketChannel.close();
		}
	}

	private static String buildBody(String body){
		StringBuilder sb = new StringBuilder();
		sb.append("HTTP/1.1 200 OK\r\n");
		sb.append("Content-Type: text/html;charset=utf-8\r\n");
		sb.append("Content-Length: "+ body.getBytes().length +"\r\n");
		sb.append("Content-Encoding:  default\r\n");
		sb.append("Server: localhost\r\n");
		Calendar cd = Calendar.getInstance();
		sb.append("Date: "+ sdf.format(cd.getTime()) +"\r\n");
		sb.append("\r\n");
		sb.append(body);
		return sb.toString();
	}
}
```

#### （2）非阻塞式

```java
ServerSocketChannel serverSocketChannel = ServerSocketChannel.open();

serverSocketChannel.socket().bind(new InetSocketAddress(9999));
serverSocketChannel.configureBlocking(false);

while(true){
    SocketChannel socketChannel =
            serverSocketChannel.accept();

    if(socketChannel != null){
        //do something with socketChannel...
    }
}
```

### 10、Java NIO 非阻塞式服务器

```java
import java.io.*;
import java.nio.*;
import java.nio.channels.*;
import java.net.*;
import java.nio.charset.Charset;
import java.util.*;
import java.text.*;

public class NonBlockingServer{
	//编码
	final static Charset charset = Charset.forName("utf-8");

	//时间
	final static SimpleDateFormat sdf = new SimpleDateFormat("EEE, d MMM yyyy HH:mm:ss 'GMT'", Locale.US);
	static{
		sdf.setTimeZone(TimeZone.getTimeZone("GMT"));
	}

	public static void main(String[] args) throws Exception{
		//创建多路复用器
		Selector selector = Selector.open();
		//打开一个服务端套接字通道
		ServerSocketChannel serverSocketChannel = ServerSocketChannel.open();
		//服务端套接字设为false
		serverSocketChannel.configureBlocking(false);
		//绑定本机端口
		serverSocketChannel.socket().bind(new InetSocketAddress(8080));
		//在复用器中注册服务端socket
		serverSocketChannel.register(selector, SelectionKey.OP_ACCEPT);
		//循环接收连接
		while(true){
			//阻塞等待套接字，准备就绪
			selector.select();
			//获取准备好的套接字Key的迭代器
			Iterator<SelectionKey> keyIterator = selector.selectedKeys().iterator();
			//遍历
			while(keyIterator.hasNext()){
				SelectionKey key = keyIterator.next();
				if(key.isValid()) handle(key);
				keyIterator.remove();
			}
		}
	}

	private static void handle(SelectionKey key) throws Exception{
		//服务端socket
		if(key.isAcceptable()) {
			//获取该通道
			ServerSocketChannel channel = (ServerSocketChannel) key.channel();
			//获取socket
			SocketChannel socketChannel = channel.accept();
			//设为非阻塞
			socketChannel.configureBlocking(false);
			//注册到selector中
			//注册读
			socketChannel.register(key.selector(), SelectionKey.OP_READ);
		}
		if(key.isReadable() || key.isWritable()) {
			httpService(key);
		}
	}

	private static void httpService(SelectionKey key) throws Exception{
		if(key.isReadable()){
			//创建缓冲
			ByteBuffer buf = ByteBuffer.allocate(2048);
			SocketChannel socketChannel = (SocketChannel) key.channel();
			//读数据
			while (socketChannel.read(buf)!=-1) {
				buf.flip(); //反转Buffer
				String req = charset.decode(buf).toString();
				System.out.println(req);
				buf.clear();
				if(req.contains("\r\n\r\n")){
					break;
				}
			}
			//写回数据
			buf.clear();
			String resp = buildBody("<!DOCTYPE html>"+
					"<html lang=\"zh_CN\">"+
					"<head>"+
					"	<meta charset=\"UTF-8\">"+
					"	<title>Test</title>"+
					"</head>"+
					"<body>"+
					"	<h1>Hello World</h1>"+
					"</body>"+
					"</html>");
			buf.put(resp.getBytes());
			buf.flip(); //切换到buffer模式
			System.out.println(resp);
			while(buf.hasRemaining()){
				socketChannel.write(buf);
			}
			buf.clear();
			// key.interestOps(SelectionKey.OP_READ | SelectionKey.OP_WRITE);
			key.cancel();
			socketChannel.close();
		}
	}

	private static String buildBody(String body){
		StringBuilder sb = new StringBuilder();
		sb.append("HTTP/1.0 200 OK\r\n");
		sb.append("Content-Type: text/html;charset=utf-8\r\n");
		sb.append("Content-Length: "+ body.getBytes().length +"\r\n");
		sb.append("Content-Encoding:  default\r\n");
		sb.append("Server: localhost\r\n");
		Calendar cd = Calendar.getInstance();
		sb.append("Date: "+ sdf.format(cd.getTime()) +"\r\n");
		sb.append("\r\n");
		sb.append(body);
		return sb.toString();
	}
}
```

### 11、Java NIO DataGramChannel

Java NIO中的DatagramChannel是一个能收发UDP包的通道。因为UDP是无连接的网络协议，所以不能像其它通道那样读取和写入。它发送和接收的是数据包。

#### （1）打开 DatagramChannel

```java
DatagramChannel channel = DatagramChannel.open();
channel.socket().bind(new InetSocketAddress(9999));
```

#### （2）接收数据

```java
ByteBuffer buf = ByteBuffer.allocate(48);
buf.clear();
SocketAddress address = channel.receive(buf);
```

#### （3）发送数据

```java
String newData = "New String to write to file..." + System.currentTimeMillis();

ByteBuffer buf = ByteBuffer.allocate(48);
buf.clear();
buf.put(newData.getBytes());
buf.flip();

int bytesSent = channel.send(buf, new InetSocketAddress("jenkov.com", 80));
```

#### （4）连接到特定的地址

```java
channel.connect(new InetSocketAddress("jenkov.com", 80));
int bytesRead = channel.read(buf);
int bytesWritten = channel.write(but);
```

### 12、Java NIO Pipe

Pipe（管道）是2个线程之间的单向数据连接。Pipe有一个source通道和一个sink通道。数据会被写到sink通道，从source通道读取。

```java
import java.io.*;
import java.nio.*;
import java.nio.channels.*;
import java.net.*;
import java.nio.charset.Charset;
import java.util.*;
import java.text.*;
import java.util.concurrent.*;

public class Main{
	final static Charset charset = Charset.defaultCharset();

	public static void main(String[] args) throws Exception{
		Pipe pipe = Pipe.open();
		ExecutorService es = Executors.newCachedThreadPool();

		es.submit(()->{
			Pipe.SinkChannel sinkChannel = pipe.sink();
			ByteBuffer buf = ByteBuffer.allocate(48);
			boolean isRunning = true;
			while(isRunning){
				buf.clear();
				buf.put(("send from"+Thread.currentThread().getName()).getBytes());
				buf.flip();
				while(buf.hasRemaining()) {
					sinkChannel.write(buf);
				}
				Thread.sleep(1000);
			}
			return 0; //解析成Callable允许抛异常
		});
		es.submit(()->{
			Pipe.SourceChannel sourceChannel = pipe.source();
			ByteBuffer buf = ByteBuffer.allocate(48);
			int len = sourceChannel.read(buf);
			while (len != -1) {
				buf.flip(); //反转Buffer
				System.out.println(Thread.currentThread().getName()+" recevice:");
				System.out.println(charset.decode(buf));
				buf.clear(); //清空缓冲
				len = sourceChannel.read(buf);//再读
			}
			return 0; //解析成Callable允许抛异常
		});
	}
}
```

### 13、Java NIO 与IO

#### （1）两者差别

|IO             |   NIO   |
|---------------|---------|
|面向流         | 面向缓冲 |
|阻塞IO         |  非阻塞IO|
|无             |  选择器  |

#### （2）数据处理方面差别

* 普通的流式IO可以方便的处理（通过readLine之类的方法）
* 但是在NIO中，读到的数据可能是数据的一半，所以需要更复杂的数据处理，需要判断边界

### 14、Java NIO Path

Java7新增接口：`java.nio.file.Path`。表示文件系统中的路径，路径可以指向文件或者目录。可以是绝对的也可以是相对的。与环境变量Path无关。在许多方面，java.nio.file.Path接口与java.io.File类相似，但有一些细微差别。但是，在很多情况下，您可以使用Path接口替换File类的使用。

#### （1）创建

通过Paths工具类

```java
Path path=Paths.get("D://test/test.txt");
Path path1=Paths.get("/home/opt/app/test/test.txt"); //若在Windows中解析成C:/home/opt/app/test/test.txt
Path path2=Paths.get("d:\\data", "projects\\a-project\\myfile.txt"); //创建相对路径Paths.get(basePath, relativePath)

Path currentDir = Paths.get("."); //当前目录
System.out.println(currentDir.toAbsolutePath());
Path parentDir = Paths.get(".."); //父目录
```

#### （2）Path.normalize()

格式化path，即移除路径中的 . 与 ..,

#### 15、Java NIO Files

Java7新增
Java NIO Files类（java.nio.file.Files）提供了几种用于处理文件系统中的文件的方法。

java.nio.file.Files类与java.nio.file.Path实例一起使用，因此在使用Files类之前，您需要了解Path类。

#### （1） 常用方法

* `Files.exists()` 用于检查给定的Path是否存在于文件系统中。
* `Files.createDirectory()` 创建目录
* `Files.copy()` 文件复制
* `Files.move()` 文件移动或重命名
* `Files.delete()` 删除文件或目录
* `Files.walkFileTree()`递归读取path下的所有文件，完整方法Files.walkFileTree(Path, FileVisitor );可通过实现FileVisitor 接口在文件读取之前或者过程中进行某些操作。

### 16、Java NIO AsynchronousFileChannel

Java7新增 异步文件通道

#### （1）创建

```java
Path path = Paths.get("data/test.xml");
AsynchronousFileChannel fileChannel =
    AsynchronousFileChannel.open(path, StandardOpenOption.READ);
```

#### （2）读取数据

通过Future读数据

```java
Future<Integer> operation = fileChannel.read(buffer, 0);
```

通过回调函数

```java
fileChannel.read(buffer, position, buffer, new CompletionHandler<Integer, ByteBuffer>() {
    @Override
    public void completed(Integer result, ByteBuffer attachment) {
        System.out.println("result = " + result);

        attachment.flip();
        byte[] data = new byte[attachment.limit()];
        attachment.get(data);
        System.out.println(new String(data));
        attachment.clear();
    }

    @Override
    public void failed(Throwable exc, ByteBuffer attachment) {

    }
});
```

#### （3）写数据

类似于写

## 十一、Future模式

### 1、Callable接口

#### （1）形式

位于 `java.util.concurrent` 包
类似于Runnable，但是允许存在返回值来返回运算结果。声明如下

```java
public interface Callable<V> {
    V call() throws Exception;
}
```

#### （2）使用

一般与`java.util.concurrent.ExecutorService`类型相结合
在ExecutorService接口中声明了若干个submit方法的重载版本：

```java
<T> Future<T> submit(Callable<T> task);
<T> Future<T> submit(Runnable task, T result);
Future<?> submit(Runnable task);
```

### 2、Future

Future就是对于具体的Runnable或者Callable任务的执行结果进行取消、查询是否完成、获取结果。必要时可以通过get方法获取执行结果，该方法会阻塞直到任务返回结果。

```java
public interface Future<V> {
    boolean cancel(boolean mayInterruptIfRunning); //取消正在执行的任务
    boolean isCancelled(); //判断是否取消成功
    boolean isDone(); //判断是否执行完毕
    V get() throws InterruptedException, ExecutionException; //获得线程结果
    V get(long timeout, TimeUnit unit)  //获取线程结果
        throws InterruptedException, ExecutionException, TimeoutException;
}
```

### 3、FutureTask

`FutureTask`同时实现了`Future`和`Callable`接口。可以直接通过该对象实例获取结果。
执行这个任务的方式如下：

* 通过Thread
* 通过ExecutorService
