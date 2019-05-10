---
title: ZooKeeper笔记
date: 2018-12-24T11:00:39+08:00
draft: false
toc: false
comments: true
aliases:
  - /detail/183
  - /detail/183/
tags:
  - 分布式
---

> https://zookeeper.apache.org/

## 一、介绍

***

### 1

#### （1）Zookeeper官方简介

ZooKeeper是一个分布式的开源协调服务，用于分布式应用程序。它公开了一组简单的原语，分布式应用程序可以基于这些原语实现更高级别的同步、配置维护、组和命名服务。它被设计成易于编程，并使用按照文件系统的常见目录树结构样式化的数据模型。它在Java运行，并对Java和C都有绑定。

#### （2） 设计目标：

* 简单性：
	* 原语简单：复杂的功能需要客户端来实现，所以虽然其可以作为微服务注册中心当时需要自己实现一个富客户端，不如consal可以开箱即用
	* 易于理解：提供了类似文件系统的树形结构
	* 高吞吐和低延迟：系统状态和数据存储在内存镜像中
* 可复制性：
	* 以集群方式运行，所有节点状态一致，多数节点可用，系统就可用，客户端只要连接到任意一个可用节点即可使用
* 有序性：有全局ID
* 快：读多写少的场景非常快

#### （3）数据模型

提供类似文件系统的树形结构：

* 存在根节点`/`
* 每个子节点存储两类数据（与文件系统不同）
	* 与该节点绑定的数据（字符串），只能被原子的读写
	* 该节点的子孙节点
	* 节点被定义为`znode`
	* 有一种叫做临时节点的特殊节点：在会话结束后自动删除

条件更新和watch

* ZooKeeper支持类似文件系统的watch（监听回调）
* 客户端对某个节点进行监听，当该节点发生更新、删除，客户端将受到相应事件

#### （4）基本原语

* create 创建一个节点
* delete 删除一个节点
* exists 测试一个节点是否存在
* get data 从一个节点读数据
* set data 向一个节点写数据
* get children 获取一个节点的孩子节点
* sync waits for data to be propagated

## 二、安装配置

***

### 1、下载安装

前提条件：安装java

[ZooKeeper下载地址](https://www.apache.org/dyn/closer.cgi/zookeeper/)

解压

```bash
tar -xzvf zookeeper-3.4.12.tar.gz
```

### 2、单机配置

```bash
cd zookeeper-3.4.12
vim conf/zoo.cfg
# 编辑内容如下
# ZooKeeper使用的以毫秒为单位的基本时间单位。它用于执行心跳，最小会话超时是tickTime的两倍。
tickTime=2000
# 持久化数据存放位置
dataDir=/tmp/zookeeper
# 客户端连接的端口
clientPort=2181
```

启动服务

```bash
bin/zkServer.sh start
```

### 3、集群配置

配置主机 `sudo vim /etc/hosts`

```host
192.168.3.20  zoo1
192.168.3.21  zoo2
192.168.3.22  zoo3
```

配置ZooKeeper `vim etc/zoo.cfg`

```cfg
tickTime=2000
dataDir=/home/rectcircle/zookeeper/default/data
# 日志文件存放目录
dataLogDir=/home/rectcircle/zookeeper/default/log
# 客户端连接端口
clientPort=2181
# 单位tickTime倍数：initLimit is timeouts ZooKeeper uses to limit the length of time the ZooKeeper servers in quorum have to connect to a leader.
initLimit=5
# 单位tickTime倍数：The entry syncLimit limits how far out of date a server can be from a leader.
syncLimit=2
# server.id=host:ip1:ip2
# ip1 主从通信的端口
# ip2 主从选举端口
server.1=zoo1:2888:3888
server.2=zoo2:2888:3888
server.3=zoo3:2888:3888
```

拷贝`hosts`和ZooKeeper软件包到其他两个机器`scp`

**重要：**在不同机器的`dataDir`目录下创建`myid`文件，填写`zoo.cfg`中配置的本机器的`id`

在所有机器启动ZooKeeper

```bash
# zoo1
bin/zkServer.sh start
# zoo2
bin/zkServer.sh start
# zoo3
bin/zkServer.sh start
```

日志在运行目录下的`zookeeper.out`

### 4、配置清单

#### （1）必选配置

* `clientPort` 监听客户端的连接
* `dataDir` 内存快照位置
* `tickTime` 基本事件单元，毫秒单位，用来控制心跳和超时，默认最小会话超时时间为两倍`tickTime`

#### （2）可选配置

* `dataLogDir` 事务日志
* `maxClientCnxns` 限制客户端连接数量，防止Dos攻击
* `minSessionTimeout` 最小会话超时时间，默认为 `2*tickTime`
* `maxSessionTimeout` 最大会话超时时间，默认为`20*tickTime`

#### （3）集群配置

* `initLimit` follower 连接到leader的时间，表示tickTime的倍数
* `syncLimit` leader与follower发送消息和应答的超时时间，表示tickTime的倍数
* `server.id` 集群的地址信息

## 三、使用

***

### 1、zkshell

```bash
bin/zkCli.sh -server zoo1:2181
```

命令列表：

```
ZooKeeper -server host:port cmd args
	stat path [watch]
	set path data [version]
	ls path [watch]
	delquota [-n|-b] path
	ls2 path [watch]
	setAcl path acl
	setquota -n|-b val path
	history
	redo cmdno
	printwatches on|off
	delete path [version]
	sync path
	listquota path
	rmr path
	get path [watch]
	create [-s] [-e] path data acl
	addauth scheme auth
	quit
	getAcl path
	close
	connect host:port
```

例子操作

```bash
# 列出子节点
ls /
# 创建一个节点
create /zk 这是该节点的值
ls /
# 获取节点的值和详细信息
get /zk
# 修改节点的值
set /zk 这是该节点的值2
# 删除
delete /zk
ls /
```

### 2、Java编程接口

#### （1）Jar包

```xml
  <!-- https://mvnrepository.com/artifact/org.apache.zookeeper/zookeeper -->
  <dependency>
    <groupId>org.apache.zookeeper</groupId>
    <artifactId>zookeeper</artifactId>
    <version>3.4.12</version>
  </dependency>
```

#### （1）HelloWorld

```java
package cn.rectcircle.zklearn;

import java.io.IOException;

import org.apache.zookeeper.CreateMode;
import org.apache.zookeeper.KeeperException;
import org.apache.zookeeper.WatchedEvent;
import org.apache.zookeeper.Watcher;
import org.apache.zookeeper.ZooKeeper;
import org.apache.zookeeper.ZooDefs.Ids;

public class ZKHelloWorld {

	private static final int SESSION_TIMEOUT = 30000;
	private static final String addr = "192.168.3.21:2181";

	public static void main(String[] args) throws IOException, KeeperException, InterruptedException {
		// watch是一次性触发
		Watcher watcher = (WatchedEvent event) -> {
			System.out.println("接收到事件："+event);
		};

		final ZooKeeper zk = new ZooKeeper(addr, SESSION_TIMEOUT, watcher);
		zk.exists("/zoo2/children1", true);

		System.out.println("创建ZooKeeper节点(path: /zoo2, data:myData2, acl:OPEN_ACL_UNSAFE, type: PERSISTENT)");
		zk.create("/zoo2", "myData2".getBytes(), Ids.OPEN_ACL_UNSAFE, CreateMode.PERSISTENT); //监听触发

		System.out.println("查看是否创建成功");
		System.out.println(new String(zk.getData("/zoo2", false, null))); //没有重新设置监听

		System.out.println("修改数据节点");
		zk.setData("/zoo2", "update_Data".getBytes(), -1); //事件不会触发

		System.out.println("查看是否修改成功");
		System.out.println(new String(zk.getData("/zoo2", true, null))); //此时对/zoo2重新测试了监听

		zk.create("/zoo2/children1", new byte[0], Ids.OPEN_ACL_UNSAFE, CreateMode.PERSISTENT);
		System.out.println("查看/zoo2孩子列表");
		System.out.println(zk.getChildren("/zoo2", false));
		zk.delete("/zoo2/children1", -1);

		System.out.println("删除节点");
		zk.delete("/zoo2", -1);

		System.out.println("查看是否删除成功");
		System.out.println("节点状态: "+zk.exists("/zoo2", false));

		zk.close();
	}
}
```

#### （2）使用ZooKeeper实现分布式锁

算法步骤：

* 客户端连接zookeeper，并在`/locks`下创建临时的且有序的子节点，第一个客户端对应的子节点为`/locks/{lockName}_lock_0000000000`，第二个为`/locks/{lockName}_lock_0000000001`，以此类推；
* 客户端获取`/locks`下的子节点列表，判断自己创建的子节点是否为当前子节点列表中序号最小的子节点，如果是则认为获得锁，否则监听刚好在自己之前一位的子节点删除消息，获得子节点变更通知后重复此步骤直至获得锁；
* 执行业务代码；
* 完成业务流程后，删除对应的子节点释放锁。

以下为一个实现

ZKReentrantLock.java 文件

```java
package cn.rectcircle.zklearn;

import java.io.IOException;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.locks.Condition;
import java.util.concurrent.locks.Lock;
import java.util.concurrent.locks.ReentrantLock;

import org.apache.zookeeper.CreateMode;
import org.apache.zookeeper.KeeperException;
import org.apache.zookeeper.WatchedEvent;
import org.apache.zookeeper.Watcher;
import org.apache.zookeeper.ZooDefs;
import org.apache.zookeeper.ZooKeeper;
import org.apache.zookeeper.data.Stat;

/**
 * zk实现的进程级别的锁，不可以直接在多线程中使用，且不支持严格可重入（同一线程可以多次获取，但是一次释放全部）
 */
class ZKProcessLock implements Lock {
	// 锁根节点
	private static final String ROOT_LOCK = "/locks";
	private static final String SPLIT_STRING = "_lock_";

	// 会话超时事件
	private static final int SESSION_TIMEOUT = 30000;
	// zk客户端
	private final ZooKeeper zk;
	// 当前锁名
	private final String lockName;
	// 监听的事件
	private final Watcher watcher = (WatchedEvent event) -> {
		System.out.println("接收到事件：" + event);
		if (this.countDownLatch != null) {
			this.countDownLatch.countDown();
		}
	};
	// 用于阻塞等待watch的时间
	private CountDownLatch countDownLatch;
	// 等待锁的key
	private String waitLockKey;
	// 当前进程锁的key
	private String currentLockKey;

	/**
	 * 配置分布式锁
	 *
	 * @param addr     连接的url
	 * @param lockName 锁名
	 * @throws IOException
	 */
	public ZKProcessLock(String addr, String lockName) {
		try {
			this.zk = new ZooKeeper(addr, SESSION_TIMEOUT, watcher);
			this.lockName = lockName;
			// 这将触发一个watched事件
			Stat stat = zk.exists(ROOT_LOCK, false);
			// 检测是否创建了锁目录，若是没有创建，则创建。
			if (stat == null) {
				zk.create(ROOT_LOCK, new byte[0], ZooDefs.Ids.OPEN_ACL_UNSAFE, CreateMode.PERSISTENT);
			}
		} catch (IOException | KeeperException | InterruptedException e) {
			throw new ZKLockException(e);
		}
	}

	private boolean waitForLock(long waitTime, TimeUnit unit) throws InterruptedException {
		if (this.countDownLatch == null) {
			this.countDownLatch = new CountDownLatch(1);
		}
		boolean result = false;
		try {
			Stat stat = this.zk.exists(this.waitLockKey, true);
			if (stat != null) {
				System.out.println(Thread.currentThread().getName() + "等待进程锁 " + this.waitLockKey);
				if (waitTime != 0) {
					result = this.countDownLatch.await(waitTime, unit);
				} else {
					this.countDownLatch.await();
					result = true;
				}
			}
		} catch (KeeperException e) {
			throw new ZKLockException(e);
		} finally {
			if (result) {
				this.countDownLatch = null;
				System.out.println(Thread.currentThread().getName() + " 获得到了进程锁");
			}
		}
		return result;
	}

	@Override
	public void lock() {
		try {
			lockInterruptibly();
		} catch (InterruptedException e) {
			lock();
		}
	}

	@Override
	public void lockInterruptibly() throws InterruptedException {
		if (this.writeAndCheckZK()) {
			System.out.println(Thread.currentThread().getName() + " " + lockName + "获得了进程锁");
			return;
		}
		try {
			if (waitForLock(0, null)) {
				return;
			}
			unlock();
		} catch (Exception e) {
			unlock();
			throw e;
		}
	}

	private boolean writeAndCheckZK(){
		if (this.lockName.contains(SPLIT_STRING)) {
			throw new ZKLockException("锁名有误");
		}
		// 创建临时有序节点
		try {
			if (this.currentLockKey == null) {
				this.currentLockKey = zk.create(ROOT_LOCK + "/" + this.lockName + SPLIT_STRING, new byte[0],
						ZooDefs.Ids.OPEN_ACL_UNSAFE, CreateMode.EPHEMERAL_SEQUENTIAL);
			}
			System.out.println(this.currentLockKey + " 已经创建");
			// 取所有子节点
			List<String> lockKeys = zk.getChildren(ROOT_LOCK, false);
			String currentKey = this.currentLockKey.replace(ROOT_LOCK + "/", "");
			// 如果存在小于currentKey的值，则返回其中的最大值
			// 否则返回currentKey
			String waitOrCurrentKey = lockKeys.stream()
					.filter(s -> s.startsWith(this.lockName) && s.compareTo(currentKey) < 0)
					.reduce((s1, s2) -> s1.compareTo(s2) >= 0 ? s1 : s2).orElse(currentKey);
			// 若当前节点为最小节点，则获取锁成功
			if (this.currentLockKey.equals(ROOT_LOCK + "/" + waitOrCurrentKey)) {
				return true;
			}
			// 若不是最小节点，则找到自己的前一个节点
			this.waitLockKey = ROOT_LOCK + "/" + waitOrCurrentKey;
		} catch (KeeperException | InterruptedException e) {
			e.printStackTrace();
		}
		return false;
	}

	@Override
	public boolean tryLock() {
		if (writeAndCheckZK()){
			return true;
		}
		unlock();
		return false;
	}

	@Override
	public boolean tryLock(long time, TimeUnit unit) throws InterruptedException {
		if (this.writeAndCheckZK()) {
			return true;
		}
		try {
			if (waitForLock(time, unit)) {
				return true;
			}
			unlock();
			return false;
		} catch (InterruptedException e) {
			unlock();
			throw e;
		}
	}

	@Override
	public void unlock() {
		try {
			if(this.currentLockKey!=null){
				this.zk.delete(this.currentLockKey, -1);
				this.currentLockKey = null;
				this.waitLockKey = null;
				this.countDownLatch = null;
			}
		} catch (KeeperException e) {
			throw new ZKLockException(e);
		} catch (InterruptedException e){
			unlock();
		}
	}

	@Override
	public Condition newCondition() {
		throw new UnsupportedOperationException("ZK分布式锁暂不支持条件变量");
	}

}

/**
 * ZKProcessLock + ReentrantLock 实现的可重入分布式锁
 */
public class ZKReentrantLock implements Lock {

	private final ZKProcessLock processLock;
	private final ReentrantLock threadLock;
	private int  count;

	public ZKReentrantLock(String addr, String lockName) {
		this.processLock = new ZKProcessLock(addr, lockName);
		this.threadLock = new ReentrantLock();
		this.count = 0;
	}

	@Override
	public void lock() {
		threadLock.lock();
		if(this.count++ > 0){
			return;
		}
		processLock.lock();
	}

	@Override
	public void lockInterruptibly() throws InterruptedException {
		try {
			threadLock.lockInterruptibly();
			if (this.count++ > 0) {
				return;
			}
		} catch (InterruptedException e) {
			throw e;
		}
		try {
			processLock.lockInterruptibly();
		} catch (InterruptedException e) {
			this.unlock();
			throw e;
		}


	}

	@Override
	public boolean tryLock() {
		if (threadLock.tryLock()){
			if (this.count++ > 0) {
				return true;
			}
			if(processLock.tryLock()){
				return true;
			} else {
				this.unlock();
			}
		}
		return false;
	}

	@Override
	public boolean tryLock(long time, TimeUnit unit) throws InterruptedException {
		if (threadLock.tryLock(time, unit)){
			if (this.count++ > 0) {
				return true;
			}
			if (processLock.tryLock(time, unit)) {
				return true;
			} else {
				unlock();
			}
		}
		return false;
	}

	@Override
	public void unlock() {
		if(--this.count==0){
			processLock.unlock();
		}
		threadLock.unlock();
	}

	@Override
	public Condition newCondition() {
		throw new UnsupportedOperationException("ZK分布式锁暂不支持条件变量");
	}

	public static void main(String[] args) throws IOException, InterruptedException {
		String addr = "192.168.3.21:2181";

		// Lock lock = new ZKProcessLock(addr, "test1");
		// lock.lock();
		// lock.lock();
		// System.out.println("---");
		// Thread.sleep(1000);

		// Lock lock1 = new ZKProcessLock(addr, "test1");
		// Lock lock2 = new ZKProcessLock(addr, "test1");
		// lock1.lock();
		// Thread t = new Thread(()->{
		// 	// lock2.lock();
		// 	try {
		// 		lock2.lockInterruptibly();
		// 	} catch (InterruptedException e) {
		// 		e.printStackTrace();
		// 	}
		// 	lock2.unlock();
		// });
		// t.start();
		// Thread.sleep(1000);
		// t.interrupt();
		// lock1.unlock();
		// System.out.println("===");
		// Thread.sleep(10000);

		Lock lock = new ZKReentrantLock(addr, "test2");
		lock.lock();
		lock.lock();
		lock.unlock();
		Thread t = new Thread(()->{
			lock.lock();
			System.out.println(Thread.currentThread().getName()+"加锁一次");
			lock.unlock();
		});
		t.start();
		System.out.println(Thread.currentThread()+"加锁2次，解锁一次");
		Thread.sleep(1000);
		lock.unlock();
		System.out.println("===");
	}

}
```

ZKLockException.java

```java
package cn.rectcircle.zklearn;


public class ZKLockException extends RuntimeException{

	private static final long serialVersionUID = 1L;

	public ZKLockException(Throwable e) {
		super(e);
	}

	public ZKLockException(String msg) {
		super(msg);
	}

}

```

## 四、常见用法

***

### 1、统一命名服务

又叫命名服务、服务发现

命名服务也是分布式系统中比较常见的一类场景。在分布式系统中，通过使用命名服务，客户端应用能够根据指定名字来获取资源或服务的地址，提供者等信息。被命名的实体通常可以是集群中的机器，提供的服务地址，远程对象等等——这些我们都可以统称他们为名字（Name）。其中较为常见的就是一些分布式服务框架中的服务地址列表。通过调用ZK提供的创建节点的API，能够很容易创建一个全局唯一的path，这个path就可以作为一个名称。

阿里巴巴集团开源的分布式服务框架Dubbo中使用ZooKeeper来作为其命名服务，维护全局的服务地址列表，点击这里查看Dubbo开源项目。在Dubbo实现中：

服务提供者在启动的时候，向ZK上的指定节点/dubbo/${serviceName}/providers目录下写入自己的URL地址，这个操作就完成了服务的发布。

服务消费者启动的时候，订阅/dubbo/${serviceName}/providers目录下的提供者URL地址， 并向/dubbo/${serviceName} /consumers目录下写入自己的URL地址。

注意，所有向ZK上注册的地址都是临时节点，这样就能够保证服务提供者和消费者能够自动感应资源的变化。

另外，Dubbo还有针对服务粒度的监控，方法是订阅/dubbo/${serviceName}目录下所有提供者和消费者的信息。

类似的服务还有：consul

### 2、分布式锁服务

不解释

实现实现见上面代码。官方实现

```xml
<dependency>
	<groupId>org.apache.curator</groupId>
	<artifactId>curator-recipes</artifactId>
	<version>4.0.0</version>
</dependency>
```

### 3、配置管理

在分布式系统里，我们会把一个服务应用分别部署到n台服务器上，这些服务器的配置文件是相同的（例如：我设计的分布式网站框架里，服务端就有4台服务器，4台服务器上的程序都是一样，配置文件都是一样），如果配置文件的配置选项发生变化，那么我们就得一个个去改这些配置文件，如果我们需要改的服务器比较少，这些操作还不是太麻烦，如果我们分布式的服务器特别多，比如某些大型互联网公司的hadoop集群有数千台服务器，那么更改配置选项就是一件麻烦而且危险的事情。这时候zookeeper就可以派上用场了，我们可以把zookeeper当成一个高可用的配置存储器，把这样的事情交给zookeeper进行管理，我们将集群的配置文件拷贝到zookeeper的文件系统的某个节点上，然后用zookeeper监控所有分布式系统里配置文件的状态，一旦发现有配置文件发生了变化，每台服务器都会收到zookeeper的通知，让每台服务器同步zookeeper里的配置文件，zookeeper服务也会保证同步操作原子性，确保每个服务器的配置文件都能被正确的更新。

### 4、集群管理与Master选举

#### （1）集群机器监控：

这通常用于那种对集群中机器状态，机器在线率有较高要求的场景，能够快速对集群中机器变化作出响应。这样的场景中，往往有一个监控系统，实时检测集群机器是否存活。过去的做法通常是：

* 监控系统通过某种手段（比如ping）定时检测每个机器，
* 或者每个机器自己定时向监控系统汇报“我还活着”。 这种做法可行，但是存在两个比较明显的问题：
	* 集群中机器有变动的时候，牵连修改的东西比较多。
	* 有一定的延时。

利用ZooKeeper有两个特性，就可以实时另一种集群机器存活性监控系统：

* 客户端在节点 x 上注册一个Watcher，那么如果 x?的子节点变化了，会通知该客户端。
* 创建EPHEMERAL类型的节点，一旦客户端和服务器的会话结束或过期，那么该节点就会消失。

例如，监控系统在 /clusterServers 节点上注册一个Watcher，以后每动态加机器，那么就往 /clusterServers 下创建一个 EPHEMERAL类型的节点：/clusterServers/{hostname}. 这样，监控系统就能够实时知道机器的增减情况，至于后续处理就是监控系统的业务了。

#### （2）Master选举

Master选举则是zookeeper中最为经典的应用场景了。 在分布式环境中，相同的业务应用分布在不同的机器上，有些业务逻辑（例如一些耗时的计算，网络I/O处理），往往只需要让整个集群中的某一台机器进行执行，其余机器可以共享这个结果，这样可以大大减少重复劳动，提高性能，于是这个master选举便是这种场景下的碰到的主要问题。

利用ZooKeeper的强一致性，能够保证在分布式高并发情况下节点创建的全局唯一性，即：同时有多个客户端请求创建 /currentMaster 节点，最终一定只有一个客户端请求能够创建成功。利用这个特性，就能很轻易的在分布式环境中进行集群选取了。

另外，这种场景演化一下，就是动态Master选举。这就要用到?EPHEMERAL_SEQUENTIAL类型节点的特性了。

上文中提到，所有客户端创建请求，最终只有一个能够创建成功。在这里稍微变化下，就是允许所有请求都能够创建成功，但是得有个创建顺序，于是所有的请求最终在ZK上创建结果的一种可能情况是这样： /currentMaster/{sessionId}-1 ,?/currentMaster/{sessionId}-2 ,?/currentMaster/{sessionId}-3 ….. 每次选取序列号最小的那个机器作为Master，如果这个机器挂了，由于他创建的节点会马上小时，那么之后最小的那个机器就是Master了。

在搜索系统中，如果集群中每个机器都生成一份全量索引，不仅耗时，而且不能保证彼此之间索引数据一致。因此让集群中的Master来进行全量索引的生成，然后同步到集群中其它机器。另外，Master选举的容灾措施是，可以随时进行手动指定master，就是说应用在zk在无法获取master信息时，可以通过比如http方式，向一个地方获取master。

在Hbase中，也是使用ZooKeeper来实现动态HMaster的选举。在Hbase实现中，会在ZK上存储一些ROOT表的地址和HMaster的地址，HRegionServer也会把自己以临时节点（Ephemeral）的方式注册到Zookeeper中，使得HMaster可以随时感知到各个HRegionServer的存活状态，同时，一旦HMaster出现问题，会重新选举出一个HMaster来运行，从而避免了HMaster的单点问题

### 5、负载均衡

这里说的负载均衡是指软负载均衡。在分布式环境中，为了保证高可用性，通常同一个应用或同一个服务的提供方都会部署多份，达到对等服务。而消费者就须要在这些对等的服务器中选择一个来执行相关的业务逻辑，其中比较典型的是消息中间件中的生产者，消费者负载均衡。

消息中间件中发布者和订阅者的负载均衡，linkedin开源的KafkaMQ和阿里开源的metaq都是通过zookeeper来做到生产者、消费者的负载均衡。这里以metaq为例如讲下：

生产者负载均衡：metaq发送消息的时候，生产者在发送消息的时候必须选择一台broker上的一个分区来发送消息，因此metaq在运行过程中，会把所有broker和对应的分区信息全部注册到ZK指定节点上，默认的策略是一个依次轮询的过程，生产者在通过ZK获取分区列表之后，会按照brokerId和partition的顺序排列组织成一个有序的分区列表，发送的时候按照从头到尾循环往复的方式选择一个分区来发送消息。
消费负载均衡：

在消费过程中，一个消费者会消费一个或多个分区中的消息，但是一个分区只会由一个消费者来消费。MetaQ的消费策略是：

每个分区针对同一个group只挂载一个消费者。
如果同一个group的消费者数目大于分区数目，则多出来的消费者将不参与消费。
如果同一个group的消费者数目小于分区数目，则有部分消费者需要额外承担消费任务。
在某个消费者故障或者重启等情况下，其他消费者会感知到这一变化（通过 zookeeper watch消费者列表），然后重新进行负载均衡，保证所有的分区都有消费者进行消费。

### 6、分布式通知协调

利用 watcher 功能

### 7、分布式队列

队列方面，简单地讲有两种，一种是常规的先进先出队列，另一种是要等到队列成员聚齐之后的才统一按序执行。对于第一种先进先出队列，和分布式锁服务中的控制时序场景基本原理一致，这里不再赘述。

第二种队列其实是在FIFO队列的基础上作了一个增强。通常可以在 /queue 这个znode下预先建立一个/queue/num 节点，并且赋值为n（或者直接给/queue赋值n），表示队列大小，之后每次有队列成员加入后，就判断下是否已经到达队列大小，决定是否可以开始执行了。这种用法的典型场景是，分布式环境中，一个大任务Task A，需要在很多子任务完成（或条件就绪）情况下才能进行。这个时候，凡是其中一个子任务完成（就绪），那么就去 /taskList 下建立自己的临时时序节点 （CreateMode.EPHEMERAL_SEQUENTIAL），当 /taskList 发现自己下面的子节点满足指定个数，就可以进行下一步按序进行处理了。
