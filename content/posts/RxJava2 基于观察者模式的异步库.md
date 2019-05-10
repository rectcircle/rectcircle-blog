---
title: RxJava2 基于观察者模式的异步库
date: 2017-10-20T16:43:57+08:00
draft: false
toc: true
comments: true
aliases:
  - /detail/105
  - /detail/105/
tags:
  - Java
---

> https://github.com/ReactiveX/RxJava/blob/2.x/README.md
> https://github.com/ReactiveX/RxJava/wiki
> http://www.jianshu.com/p/5e93c9101dc5
> http://www.jianshu.com/p/464fa025229e
> http://www.jianshu.com/p/d149043d103a

RxJava是一个Java实现的 [Reactive 扩展](http://reactivex.io) ：通过使用可观察序列，简化异步和基于事件的程序的开发

## 一、Getting started

引入Gradle依赖

```groovy
compile "io.reactivex.rxjava2:rxjava:2.x.y"
```

创建HelloWord程序

```java
package rxjava.examples;

import io.reactivex.*;

public class HelloWorld {
    public static void main(String[] args) {
        Flowable.just("Hello world").subscribe(System.out::println);
    }
}
```

非Java8写法

```java
import io.reactivex.functions.Consumer;

Flowable.just("Hello world")
  .subscribe(new Consumer<String>() {
      @Override public void accept(String s) {
          System.out.println(s);
      }
  });
```

## 二、如何使用Rxjava

### 1、基本概念

**`Observable`**：发射源，在观察者模式中称为“被观察者”；
**`Observer`**：接收源，观察者模式中的“观察者”，可接收`Observable`发送的数据；
**`subscribe`**：订阅，观察者与被观察者，通过`subscribe()`方法进行订阅；
**Subscriber**：也是一种观察者，在2.0中 它与`Observer`没什么实质的区别，不同的是 `Subscriber`要与`Flowable`(也是一种被观察者)联合使用，该部分内容是2.0新增的，后续文章再介绍。`Obsesrver`用于订阅`Observable`，而`Subscriber`用于订阅`Flowable`

#### （1）RxJava中的观察者模式

观察者模式的概念很好理解，具体可以解释为：A 对象（观察者）对 B 对象（被观察者）的某种变化高度敏感，需要在 B 变化的一瞬间做出反应。
在程序的观察者模式，观察者不需要时刻盯着被观察者（例如 A 不需要每过 2ms 就检查一次 B 的状态），而是采用注册(Register)或者称为订阅(Subscribe)的方式，告诉被观察者：我需要你的某某状态，你要在它变化的时候通知我。

下面具体讲RxJava 的观察者模式

RxJava 有四个基本概念：Observable (被观察者)、 Observer (观察者)、 subscribe (订阅)、事件。Observable 和 Observer 通过 subscribe() 方法实现订阅关系，从而 Observable 可以在完成某些操作，获得一些结果后，回调触发事件，即发出事件来通知 Observer。

关于回调，在RxJava中可以简单的理解为：为了方便Observable和Observer交互，在Observable中，将Observer对象传入，在完成某些操作后调用Observer对象的方法，此时将触发Observer中具体实现的对应方法。

**注意：Observer是个接口，Observable是个类。**

与传统观察者模式不同， RxJava 的事件回调方法除了普通事件 onNext() 之外，还定义了三个特殊的事件：onComplete() 和 onError()，onSubscribe()。

onComplete(): 事件队列完结时调用该方法。RxJava 不仅把每个事件单独处理，还会把它们看做一个队列。
onError(): 事件队列异常。在事件处理过程中出异常时，onError() 会被触发，同时队列自动终止，不允许再有事件发出。
onSubscribe()：RxJava 2.0 中新增的，传递参数为Disposable ，Disposable 相当于RxJava1.x中的Subscription,用于解除订阅。
注意：onComplete() 和 onError() 二者也是互斥的，即在队列中调用了其中一个，就不应该再调用另一个。

RxJava的异步实现方式。让Observable (被观察者)开启子线程执行耗操作，完成耗时操作后，触发回调，通知Observer (观察者)进行主线程UI更新。如此轻松便可以实现Android中的异步，且代码简洁明了，集中分布。RxJava中默认Observer (观察者)和Observer (观察者)都在同一线程执行任务。本文主要介绍RxJava中的一些基本使用，关于线程调度问题下篇文章再进行介绍。即本文中的所有操作都默认在同一线程进行。
好了，下面我们就开始了解RxJava的一些基本使用。

### 2、基本实例

RxJava用法多种多样，其多样性体现在Obserable(被观察者)的创建上。
我们先以最基础的Obserable(被观察者)的创建为例介绍RxJava的使用：

#### （1）RxJava的三部曲

定义一个`Observable`发生源

```java
		Observable<Integer> observable= Observable.create(new ObservableOnSubscribe<Integer>() {

			//ObservableEmitter为发射器
			@Override
			public void subscribe(ObservableEmitter<Integer> e) throws Exception {
				//执行一些其他操作
				//.............
				//执行完毕，触发回调，通知观察者
				e.onNext(1);
				e.onNext(2);
				e.onNext(3);
				e.onComplete();
			}
		});
```

初始化一个`Observer`处理事件

```java
		Observer<Integer> observer= new Observer<Integer>(){
			Disposable disposable;

			@Override
			public void onSubscribe(Disposable d) { //取消订阅对象
				disposable = d;
				System.out.println("onSubscribe");
			}

			@Override
			public void onNext(Integer integer) {
				if(integer>2){ // >2 时为异常数据，解除订阅
					disposable.dispose();
					return;
				}
				System.out.println(integer);
			}

			@Override
			public void onError(Throwable e) {}

			@Override
			public void onComplete() {
				System.out.println("onComplete");
			}
		};
```

建立订阅关系

```java
		observable.subscribe(observer); //建立订阅关系
```

其他简单订阅方式

```java
		Disposable disposable = observable.subscribe(new Consumer<Integer>() {
			@Override
			public void accept(Integer integer) throws Exception {
				//这里接收数据项，相当于onNext
				System.out.println("方式2："+integer);
			}
		}, new Consumer<Throwable>() {
			@Override
			public void accept(Throwable throwable) throws Exception {
				//这里接收onError

			}
		}, new Action() {
			@Override
			public void run() throws Exception {
				//这里接收onComplete。
				System.out.println("方式2：完成");
			}
		});
```

#### （2）说明

使用create( )创建Observable最基本的创建方式。可以看到，这里传入了一个 ObservableOnSubscribe对象作为参数，它的作用相当于一个计划表，当 Observable被订阅的时候，ObservableOnSubscribe的subscribe()方法会自动被调用，事件序列就会依照设定依次触发（对于上面的代码，就是观察者Observer 将会被调用一次 onNext()）。这样，由被观察者调用了观察者的回调方法，就实现了由被观察者向观察者的事件传递，即观察者模式。

**`Observable<T>`**

发送源，负责发送数据，数据类型为`T`

**`Observer<T>`**

接收源，负责接收处理发送源发送的数据，接收的数据类型为`T`，一般包含四个方法

* `onSubscribe(Disposable d)` subscribe函数执行后执行的内容
* `onNext(T t)` 接收到next事件的处理
* `onError(Throwable e)` 接收到error事件的处理，接收到后就收不到next事件了
* `onComplete()` 接收到complete事件的处理，接收到后就收不到next事件了

**`Observable<T>.subscribe(Observer<T>)`**

将发送源和接收源连接起来，此时发送源才开始发送数据，接收源开始处理数据

**`ObservableEmitter`**

发送源的发送者，负责发送事件

* `onNext(T value)`，发出next事件，可以发出无限个
* `onComplete()`，发出complete事件，
* `onError(Throwable error)`，发出error事件
* `onComplete()`和`onError(Throwable error)`两者最多只能出现一个

**`Disposable`**

用于在某些条件下切断发送源和接收源的联系，即接收源不会处理任何事件

### 3、Observable的其他创建方式

**`just()`方式**

```java
		Observable<String> observable1 = Observable.just("Hello");
		observable1.subscribe(System.out::println);
		//输出hello
```

使用just( )，将为你创建一个Observable并自动为你调用onNext( )发射数据。通过just( )方式 直接触发onNext()，just中传递的参数将直接在Observer的onNext()方法中接收到。

**`fromIterable()`方式**

```java
		Observable<String> observable2 = Observable.fromIterable(list);
		observable2.subscribe(System.out::println);
```

使用fromIterable()，遍历集合，发送每个item。相当于多次回调onNext()方法，每次传入一个item。

注意：Collection接口是Iterable接口的子接口，所以所有Collection接口的实现类都可以作为Iterable对象直接传入fromIterable()方法。

**`defer()`方式**

```java
		Observable<String> observable3 = Observable.defer(new Callable<ObservableSource<? extends String>>() {
			@Override
			public ObservableSource<? extends String> call() throws Exception {
				System.out.println("ObservableSource");
				return Observable.just("hello");
			}
		});
		observable3.subscribe(System.out::println);
```

当观察者订阅时，才创建Observable，并且针对每个观察者创建都是一个新的Observable。以何种方式创建这个Observable对象，当满足回调条件后，就会进行相应的回调。

**`interval()`方式**

```java
		Observable<Long> observable4 = Observable.interval(2, TimeUnit.SECONDS);
		observable4.subscribe(System.out::println);
		try {
			Thread.sleep(10000);
		} catch (InterruptedException e) {
			e.printStackTrace();
		}
		//输出：0 1 2 3 4
```

创建一个按固定时间间隔发射整数序列的Observable，可用作定时器。即按照固定2秒一次调用onNext()方法。

**`range()`方式**

```java
		Observable<Integer> observable5 = Observable.range(1,20);
		observable5.subscribe(System.out::println);
```

创建一个发射特定整数序列的Observable，第一个参数为起始值，第二个为发送的个数，如果为0则不发送，负数则抛异常。上述表示发射1到20的数。即调用20次nNext()方法，依次传入1-20数字

**`timer()`方式**

```java
		Observable<Long> observable6 = Observable.timer(2, TimeUnit.SECONDS);
		observable6.subscribe(l -> System.out.println("observable6:"+l));
		try {
			Thread.sleep(3000);
		} catch (InterruptedException e) {
			e.printStackTrace();
		}
```

创建一个Observable，它在一个给定的延迟后发射一个特殊的值，即表示延迟2秒后，调用onNext()方法。

**`repeat()`方式**

```java
observable5.repeat().subscribe(System.out::println);
//一直输出1~20不会终止
```

创建一个Observable，该Observable的事件可以重复调用。

### 4、函数式接口

略

### 5、RxJava中的操作符

类似于scala中集合的高阶函数。

将`Observable`转换为另一个`Observable`对象方便处理

**`map()`操作符**

```java
Observable<Integer> observable = Observable.just("hello").map(new Function<String, Integer>() {
	@Override
	public Integer apply(String s) throws Exception {
		return s.length();
	}
});
//以下使用Lambda
observable =  Observable.just("hello").map(s -> s.length());
observable.subscribe(System.out::println);
```

map()操作符，就是把原来的Observable对象转换成另一个Observable对象，同时将传输的数据进行一些灵活的操作，方便Observer获得想要的数据形式。

**`flatMap()`操作符**

```java
Observable<Integer> observable1 = Observable.just(new Integer[] {1,2,3,4,5}).flatMap(new Function<Integer[], ObservableSource<Integer>>() {
	@Override
	public ObservableSource<Integer> apply(Integer[] integers) throws Exception {
		return Observable.fromIterable(Arrays.asList(integers));
	}
});
observable1.subscribe(System.out::println);
```

flatMap()对于数据的转换比map()更加彻底，如果发送的数据是集合，flatmap()重新生成一个Observable对象，并把数据转换成Observer想要的数据形式。它可以返回任何它想返回的Observable对象。

**`filter()`操作符**

```java
Observable.fromIterable(Arrays.asList(new String[] {"a","b", "c"}))
		.filter(s->!s.equals("b")) //过滤器
		.subscribe(System.out::println);
//输出a c
```

filter()操作符根据test()方法中，根据自己想过滤的数据加入相应的逻辑判断，返回true则表示数据满足条件，返回false则表示数据需要被过滤。最后过滤出的数据将加入到新的Observable对象中，方便传递给Observer想要的数据形式。

**`take()`操作符**

```java
Observable.fromIterable(Arrays.asList(new String[] {"a","b", "c"}))
		.take(2)
		.subscribe(System.out::println);
////输出a b
```

take()操作符：输出最多指定数量的结果。

**`doOnNext()`操作符**

```java
Observable.fromIterable(Arrays.asList(new String[] {"a","b", "c"}))
		.take(2)
		.doOnNext(s -> System.out.println("准备：" + s))
		.subscribe(System.out::println);
//输出
//		准备：a
//		a
//		准备：b
//		b
```

doOnNext()允许我们在每次输出一个元素之前做一些额外的事情。

通过操作符的使用。我们每次调用一次操作符，就进行一次观察者对象的改变，同时将需要传递的数据进行转变，最终Observer对象获得想要的数据。

## 三、RxJava中的线程调度

***

### 1、Scheduler简介

在不指定线程的情况下， RxJava 遵循的是线程不变的原则，即：在哪个线程调用 subscribe()，就在哪个线程生产事件；在哪个线程生产事件，就在哪个线程消费事件。如果需要切换线程，就需要用到 Scheduler （调度器）。
在RxJava 中，Scheduler，相当于线程控制器，RxJava 通过它来指定每一段代码应该运行在什么样的线程。RxJava 已经内置了几个 Scheduler ，它们已经适合大多数的使用场景。

### 2、Scheduler 的 API

#### （1）常用的配置

* **Schedulers.computation()**: 用于计算任务，如事件循环或和回调处理，不要用于IO操作(IO操作请使用Schedulers.io())；默认线程数等于处理器的数量
* **Schedulers.from(executor)**: 使用指定的Executor作为调度器
* **Schedulers.newThread()**: 总是启用新线程，并在新线程执行操作。
* **Schedulers.io()**: I/O 操作（读写文件、读写数据库、网络信息交互等）所使用的 Scheduler。行为模式和 newThread() 差不多，区别在于 io() 的内部实现是用一个无数量上限的线程池，可以重用空闲的线程，因此多数情况下 io() 比 newThread() 更有效率。不要把计算工作放在 io() 中，可以避免创建不必要的线程。对于普通的计算任务，请使用Schedulers.computation()；Schedulers.io( )默认是一个CachedThreadScheduler，很像一个有线程缓存的新线程调度器
* **chedulers.computation()**: 计算所使用的 Scheduler。这个计算指的是 CPU 密集型计算，即不会被 I/O 等操作限制性能的操作，例如图形的计算。这个 Scheduler 使用的固定的线程池，大小为 CPU 核数。不要把 I/O 操作放在 computation() 中，否则 I/O 操作的等待时间会浪费 CPU。
* **Schedulers.trampoline()**: 当其它排队的任务完成后，在当前线程排队开始执行
* Android 还有一个专用的 **AndroidSchedulers.mainThread()**，它指定的操作将在 Android 主线程运行。
* **Schedulers.single()**: 拥有一个线程单例，所有的任务都在这一个线程中执行，当此线程中有任务执行时，其他任务将会按照先进先出的顺序依次执行。
* **注**:
	* 在RxJava2中，废弃了RxJava1中的Schedulers.immediate()。在RxJava1中，Schedulers.immediate()的作用为在当前线程立即执行任务，功能等同于RxJava2中的Schedulers.trampoline()。
	* 而Schedulers.trampoline( )在RxJava1中的作用是当其它排队的任务完成后，在当前线程排队开始执行接到的任务，有点像RxJava2中的Schedulers.single()，但也不完全相同，因为Schedulers.single()不是在当前线程而是在一个线程单例中排队执行任务。

有了这几个 Scheduler ，就可以使用 subscribeOn() 和 observeOn() 两个方法来对线程进行控制了。

* **subscribeOn()**: 指定Observable(被观察者)所在的线程，或者叫做**事件产生**的线程。
* **observeOn()**: 指定 Observer(观察者)所运行在的线程，或者叫做**事件消费**的线程。

#### （2）样例

```java
public static void main(String[] args) throws InterruptedException {
	Observable.create(e -> {
		System.out.println("所在的线程：" + Thread.currentThread().getName());
		System.out.println("发送的数据:"  + 1);
		e.onNext(1);
	}).subscribeOn(Schedulers.io())
			.map(i -> {
				System.out.println("处理1所在的线程：" + Thread.currentThread().getName());
				return 2;
			})
			.subscribeOn(Schedulers.newThread()) //不起作用
			.observeOn(Schedulers.single())
			.map(i -> {
				System.out.println("处理2所在的线程：" + Thread.currentThread().getName());
				return 3;
			})
			.observeOn(Schedulers.computation())
			.subscribe(i ->{
				System.out.println("所在的线程：" + Thread.currentThread().getName());
				System.out.println("接收到的数据:"  + i);
			});
	Thread.sleep(100);
}
/*输出：
所在的线程：RxCachedThreadScheduler-1
发送的数据:1
处理1所在的线程：RxCachedThreadScheduler-1
处理2所在的线程：RxSingleScheduler-1
所在的线程：RxComputationThreadPool-1
接收到的数据:3
*/
```

* subscribeOn来指定对数据的处理运行在特定的线程调度器Scheduler上，直到遇到observeOn改变线程调度器若多次设定，则**只有第一次设定**起作用。
* observeOn指定下游操作运行在特定的线程调度器Scheduler上。若多次设定，每次均起作用。

### 3、网络请求

使用`Retrofit`

## 四、Flowable

***

### 1、Flowable的产生的原因

在RxJava中会经常遇到一种情况就是被观察者发送消息十分迅速以至于观察者不能及时的响应这些消息。

例如下面这种情况：

```java
	public static void main(String[] args) throws InterruptedException {
		Observable.create(new ObservableOnSubscribe<Integer>() {
			@Override
			public void subscribe(ObservableEmitter<Integer> e) throws Exception {
				for(int i=0; i<1000; i++){
					e.onNext(1);
				}
			}
		}).subscribeOn(Schedulers.io())
				.observeOn(Schedulers.single())
				.subscribe( i-> {
						Thread.sleep(2000);
						System.out.println(i);
					});

		Thread.sleep(1000*30);
	}
```

要怎么处理这些慢慢堆积起来的消息呢？Flowable就是由此产生，专门用来处理这类问题。

关于上述的问题，有个专有的名词来形容上述现象，即：Backpressure(背压)。所谓背压，即生产者的速度大于消费者的速度带来的问题。

原先的Observable已经不具备背压处理能力。Flowable是为了应对Backpressure而产生的。Flowable是一个被观察者，与Subscriber(观察者)配合使用，解决Backpressure问题。

### 2、处理Backpressure的策略

#### （1）产生Backpressure的情况

在讲具体策略之前，我们要具体分析下什么情况下才会产生Backpressure问题？
1.如果生产者和消费者在一个线程的情况下，无论生产者的生产速度有多快，每生产一个事件都会通知消费者，等待消费者消费完毕，再生产下一个事件。所以在这种情况下，根本不存在Backpressure问题。即同步情况下，Backpressure问题不存在。
2.如果生产者和消费者不在同一线程的情况下，如果生产者的速度大于消费者的速度，就会产生Backpressure问题。即异步情况下，Backpressure问题才会存在。

#### （1）Flowable相较于Observable多出的内容

```java
		Flowable<Integer> flowable = Flowable.create(new FlowableOnSubscribe<Integer>() {
			@Override
			public void subscribe(FlowableEmitter<Integer> emitter) throws Exception {
				for (int i = 0; i < 129; i++) {
					System.out.println("emit "+i);
					emitter.onNext(i);
				}

				System.out.println("emit complete");
				emitter.onComplete();
			}
		}, BackpressureStrategy.ERROR); //增加了一个参数

		Subscriber<Integer> subscriber = new Subscriber<Integer>() {

			@Override
			public void onSubscribe(Subscription s) {
				System.out.println("onSubscribe");
				//s.request(Long.MAX_VALUE);
			}

			@Override
			public void onNext(Integer integer) {
				System.out.println("onNext: " + integer);

			}
			@Override
			public void onError(Throwable t) {
				System.out.println("onError: " + t);
			}
			@Override
			public void onComplete() {
				System.out.println( "onComplete");
			}
		};
		flowable
				.subscribeOn(Schedulers.io())
				.observeOn(Schedulers.newThread())
				.subscribe(subscriber);
```

上述代码创建了一个Flowable(被观察者)和一个Subscriber(观察者)，可以看到程序如我们预期的一样输出结果了。不同的是 onSubscribe(Subscription s)中传给我们的不再是Disposable了, 而是Subscription。然而Subscription也可以用于切断观察者与被观察者之间的联系，调用Subscription.cancel()方法便可。 不同的地方在于Subscription增加了一个void request(long n)方法, 这个方法有什么用呢, 在上面的代码中也有这么一句代码:

```java
  s.request(Long.MAX_VALUE);
```

这个方法就是用来向生产者申请可以消费的事件数量。这样我们便可以根据本身的消费能力进行消费事件。
当调用了request()方法后，生产者便发送对应数量的事件供消费者消费。

**这是因为Flowable在设计的时候采用了一种新的思路也就是响应式拉取的方式,你要求多少，我便传给你多少。**

**注意：**如果不显示调用request就表示消费能力为0。

虽然并不限制向request()方法中传入任意数字，但是如果消费者并没有这么多的消费能力，依旧会造成资源浪费，最后产生OOM。

在异步调用时，RxJava中有个缓存池，用来缓存消费者处理不了暂时缓存下来的数据，缓存池的默认大小为128，即只能缓存128个事件。无论request()中传入的数字比128大或小，缓存池中在刚开始都会存入128个事件。当然如果本身并没有这么多事件需要发送，则不会存128个事件。

在ERROR策略下，如果缓存池溢出，就会立刻抛出MissingBackpressureException异常。

上面的输出

```
...
emit 127
emit 128
emit complete
onError: io.reactivex.exceptions.MissingBackpressureException: create: could not emit value due to lack of requests
```

#### （3）使用Subscription对象

`mSubscription.request(50)`：其对象的订阅器将处理50个事件

#### （4）创建Flowable对象

onBackpressureBuffer()、onBackpressureDrop()、onBackpressureLatest()等方式
