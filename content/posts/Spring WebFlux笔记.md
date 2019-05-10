---
title: Spring WebFlux笔记
date: 2018-07-25T14:40:58+08:00
draft: false
toc: true
comments: true
aliases:
  - /detail/159
  - /detail/159/
tags:
  - Java
  - sql
---

> 参考：
> [博客1](https://blog.csdn.net/get_set/article/details/79466657)
> [Reactor](https://htmlpreview.github.io/?https://github.com/get-set/reactor-core/blob/master-zh/src/docs/index.html)

## 一、Reactor3

***

Spring WebFlux 依赖于 Reactor3

### 1、Reactor介绍

一个响应式编程库、类似于Rxjava，专注于服务端开发。提供类似发布订阅、基于数据/事件流的模型

### 2、Reactor依赖

```xml
    <dependency>
        <groupId>io.projectreactor</groupId>
        <artifactId>reactor-core</artifactId>
        <version>3.1.4.RELEASE</version>
    </dependency>
		    <dependency>
        <groupId>io.projectreactor</groupId>
        <artifactId>reactor-test</artifactId>
        <version>3.1.4.RELEASE</version>
        <scope>test</scope>
    </dependency>
    <dependency>
        <groupId>junit</groupId>
        <artifactId>junit</artifactId>
        <version>4.12</version>
        <scope>test</scope>
    </dependency>
```

### 3、Reactor基本概念

* Publisher：发布者，数据流的发布者，承载着数据，
	* 包含两类
		* Flux
		* Mono
	* 可以发出三种信号（后两种统称中止信号）
		* 值
		* 完成信号
		* 错误信号
* Subscribe：一个对信号的处理的操作，可以通过方法和实现`Subscriber`接口实现

### 4、发布者

发布者对象：Flux、Mono

* 一个Flux对象代表一个包含0..N个元素的响应式序列
* 一个Mono对象代表一个包含零或一个（0..1）元素的结果

```java
Flux.just(1, 2, 3, 4, 5, 6);
Mono.just(1);
```

从其他容器创建发布者

```java
Integer[] array = new Integer[] { 1, 2, 3, 4, 5, 6 };
Flux.fromArray(array);
List<Integer> list = Arrays.asList(array);
Flux.fromIterable(list);
Stream<Integer> stream = list.stream();
Flux.fromStream(stream);
```

发出中止信号的方法

```java
// 只有完成信号的空数据流
Flux.just();
Flux.empty();
Mono.empty();
Mono.justOrEmpty(Optional.empty());
// 只有错误信号的数据流
Flux.error(new Exception("some error"));
Mono.error(new Exception("some error"));
```

### 5、订阅

```java
		Flux.just(1, 2, 3, 4, 5, 6).subscribe(System.out::print);
		System.out.println();
		Mono.just(1).subscribe(System.out::println);

		Flux.just(1, 2, 3, 4, 5, 6)
			.subscribe(
				System.out::println, //完成信号
				System.err::println, //错误信号
				() -> System.out.println("Completed!")); //监听完成信号，正常处理完成后执行（错误不处理）
		Mono.error(new Exception("some error"))
			.subscribe(
				System.out::println,
				System.err::println,
				() -> System.out.println("Completed!")); //没有输出Completed!
```

### 6、运算符

运算符就是一系列方便的高阶函数（参数为函数类型的函数）

常用的如下

```java
		// Flux<E2> = Flux<E1>.map(E1 -> E2)
		Flux.range(1, 6)
			.map(i->i*i); //map：映射，结果为：(1, 4, 9, 16, 25, 36)
		// Flux<E2> = Flux<E1>.flatMap(E1 -> Flux<E2>)
		Flux.just("flux", "mono")
			.flatMap(s -> Flux.fromArray(s.split("\\s*")))
			.subscribe(System.out::println);
		// filter 过滤
		Flux.range(1, 6)
			.filter(i -> i % 2 == 1);
		// zip、zipWith 合并成二元组
		Flux.zip(Flux.just(1,2), Flux.just(3,4));
		Flux.just(1,2).zipWith(Flux.just(3,4));
```

其他操作符：

* 用于编程方式自定义生成数据流的create和generate等及其变体方法；
* 用于“无副作用的peek”场景的doOnNext、doOnError、doOncomplete、doOnSubscribe、doOnCancel等及其变体方法；
* 用于数据流转换的when、and/or、merge、concat、collect、count、repeat等及其变体方法；
* 用于过滤/拣选的take、first、last、sample、skip、limitRequest等及其变体方法；
* 用于错误处理的timeout、onErrorReturn、onErrorResume、doFinally、retryWhen等及其变体方法；
* 用于分批的window、buffer、group等及其变体方法； 用于线程调度的publishOn和subscribeOn方法。

### 7、并发

提供Schedulers，提供对线程池的封装，可以方便的实现异步

* 当前线程（Schedulers.immediate()）；
* 可重用的单线程（Schedulers.single()）。注意，这个方法对所有调用者都提供同一个线程来使用，
* 直到该调度器被废弃。如果你想使用独占的线程，请使用Schedulers.newSingle()；
* 弹性线程池（Schedulers.elastic()）。它根据需要创建一个线程池，重用空闲线程。线程池如果空闲时间过长 （默认为 60s）就会被废弃。对于
* I/O 阻塞的场景比较适用。Schedulers.elastic()能够方便地给一个阻塞 的任务分配它自己的线程，从而不会妨碍其他任务和资源；
* 固定大小线程池（Schedulers.parallel()），所创建线程池的大小与CPU个数等同；
* 自定义线程池（Schedulers.fromExecutorService(ExecutorService)）
* 基于自定义的ExecutorService创建 Scheduler（虽然不太建议，不过你也可以使用Executor来创建）。

与Publisher关联： 使用subscribeOn、publishOn可以更改执行环境

* publishOn会影响链中其后的操作符
* subscribeOn无论出现在什么位置，都只影响源头的执行环境

```java
		CountDownLatch countDownLatch = new CountDownLatch(1);
		Mono.fromCallable(() -> { // 使用fromCallable声明一个基于Callable的Mono；
				try {
					TimeUnit.SECONDS.sleep(2);
					System.out.println(Thread.currentThread().getName());
				} catch (InterruptedException e) {
					e.printStackTrace();
				}
				return "Hello, Reactor!";
			})
			.subscribeOn(Schedulers.elastic()) // 使用subscribeOn将任务调度到Schedulers内置的弹性线程池执行，弹性线程池会为Callable的执行任务分配一个单独的线程。
				.subscribe(System.out::println, null, countDownLatch::countDown);
		countDownLatch.await(10, TimeUnit.SECONDS);
```

### 8、错误处理

```java
		//一旦发生错误，将直接终止对后续数据的处理
		//最终错误处理
		Flux.range(1, 6)
			.map(i -> 10 / (i - 3)) // 会发生除零错误
			.map(i -> i * i)
			.subscribe(System.out::println, System.err::println);
		//捕获异常使用默认值
		Flux.range(1, 6)
			.map(i -> 10 / (i - 3))
			.onErrorReturn(0)
			.map(i -> i * i)
			.subscribe(System.out::println, s -> System.err.println("error:"+s));
		//根据异常信息，提供新的数据流
		Flux.range(1, 6)
			.map(i -> 10 / (i - 3))
			.onErrorResume(e -> Flux.just(7,8,9)) // 提供新的数据流
			.map(i -> i * i)
			.subscribe(System.out::println, System.err::println);
		// 捕获，并再包装为某一个业务相关的异常，然后再抛出业务异常
		// onErrorMap
		// 捕获，记录错误日志，然后继续抛出
		// doOnError
		// 使用 finally 来清理资源，或使用 Java 7 引入的 “try-with-resource”
		/*
			资源使用前声明
			Flux.using(
					() -> getResource(),    // 第一个参数获取资源；
					resource -> Flux.just(resource.getAll()),   // 第二个参数利用资源生成数据流；
					MyResource::clean   // 第三个参数最终清理资源。
			);
			使用doFinally
			LongAdder statsCancel = new LongAdder();    // 1

			Flux<String> flux =
			Flux.just("foo", "bar")
				.doFinally(type -> {
					if (type == SignalType.CANCEL)  // 2
					statsCancel.increment();  // 3
				})
				.take(1);   // 4
		*/
		//重试
		//retry(1)发生错误重试1次
```

### 9、背压

```java
		Flux.range(1, 6) // 1
				.doOnRequest(n -> System.out.println("Request " + n + " values...")) // 2
				.subscribe(new BaseSubscriber<Integer>() { // 3
					@Override
					protected void hookOnSubscribe(Subscription subscription) { // 4
						System.out.println("Subscribed and make a request...");
						request(1); // 5
					}

					@Override
					protected void hookOnNext(Integer value) { // 6
						try {
							TimeUnit.SECONDS.sleep(1); // 7
						} catch (InterruptedException e) {
							e.printStackTrace();
						}
						System.out.println("Get value [" + value + "]"); // 8
						request(1); // 9
					}
				});
```

### 10、单元测试支持

```java
public class ReactorLearnTest {
	private Flux<Integer> generateFluxFrom1To6() {
		return Flux.just(1, 2, 3, 4, 5, 6);
	}

	private Mono<Integer> generateMonoWithError() {
		return Mono.error(new Exception("some error"));
	}

	@Test
	public void testViaStepVerifier() {
		StepVerifier.create(generateFluxFrom1To6()).expectNext(1, 2, 3, 4, 5, 6).expectComplete().verify();
		StepVerifier.create(generateMonoWithError()).expectErrorMessage("some error").verify();
	}
}
```

### 11、Reactor3简单模拟

```java

abstract class Flux<T> implements Publisher<T> {

	public abstract void subscribe(Subscriber<? super T> s);

	//工具方法，从参数列表中生成发布者
	public static <T> Flux<T> just(T... data) {
		return new FluxArray<>(data);
	}

	static class FluxArray<T> extends Flux<T> {
		private T[] array; // 1

		public FluxArray(T[] data) {
			this.array = data;
		}

		@Override
		public void subscribe(Subscriber<? super T> actual) {
			actual.onSubscribe(new ArraySubscription<>(actual, array)); // 构建一个Subscription并作为Subscriber的参数，调用
		}

		static class ArraySubscription<T> implements Subscription { // 持有数据和Subscriber
			final Subscriber<? super T> actual;
			final T[] array; // 数据的备份
			int index;
			boolean canceled;

			public ArraySubscription(Subscriber<? super T> actual, T[] array) {
				this.actual = actual;
				this.array = array;
			}

			@Override
			public void request(long n) {
				if (canceled) {
					return;
				}
				long length = array.length;
				for (int i = 0; i < n && index < length; i++) {
					actual.onNext(array[index++]); // 调用Subscriber.next
				}
				if (index == length) {
					actual.onComplete(); // 完成后调用Subscriber.onComplete
				}
			}

			@Override
			public void cancel() { // 取消操作
				this.canceled = true;
			}
		}
	}

	public <V> Flux<V> map(Function<? super T, ? extends V> mapper) { // 实现一个操作符map
		return new FluxMap<>(this, mapper); // 构建一个新的Publisher包裹this
	}

	static class FluxMap<T, R> extends Flux<R>{
		private final Flux<? extends T> source;
		private final Function<?super T,?extends R>mapper;

		public FluxMap(Flux<? extends T> source, Function<? super T, ? extends R> mapper){
			this.source = source;
			this.mapper = mapper;
		}

		@Override
		public void subscribe(Subscriber<? super R> actual) {
			source.subscribe(new Subscriber<T>(){ //一个代理调用
					@Override
					public void onSubscribe(Subscription s) {
						actual.onSubscribe(s);
					}

					@Override
					public void onNext(T t) {
						actual.onNext(mapper.apply(t)); //在此应用变换
					}

					@Override
					public void onError(Throwable t) {
						actual.onError(t);
					}

					@Override
					public void onComplete() {
						actual.onComplete();
					}
				});
		}
	}

	public void subscribe(Consumer<? super T> consumer, //简化调用操作
			Consumer<? super Throwable> errorConsumer,
			Runnable completeConsumer){
		this.subscribe(new Subscriber<T>() {
			@Override
			public void onSubscribe(Subscription s) {
				s.request(Long.MAX_VALUE);
			}

			@Override
			public void onNext(T t) {
				consumer.accept(t);
			}

			@Override
			public void onError(Throwable t) {
				errorConsumer.accept(t);
			}

			@Override
			public void onComplete() {
				completeConsumer.run();
			}
		});
	}
}

public class ReactiveSimulation {

	public static void main(String[] args) {
		Flux
			.just(1, 2, 3, 4, 5)
			.map(i->i*2)
			.subscribe(new Subscriber<Integer>() { // 1
				@Override
				public void onSubscribe(Subscription s) {
					System.out.println("onSubscribe");
					s.request(6); // 2
				}

				@Override
				public void onNext(Integer integer) {
					System.out.println("onNext:" + integer);
				}

				@Override
				public void onError(Throwable t) {

				}

				@Override
				public void onComplete() {
					System.out.println("onComplete");
				}
		});

		Flux
			.just(1, 2, 3, 4, 5)
			.map(i->i*2)
			.subscribe(System.out::println, t-> t.printStackTrace() , ()->System.out.println("完成"));
	}
}
```

### 12、自定义数据流

```java
package cn.rectcircle.reactivelearn.reactorlearn;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Random;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import reactor.core.publisher.Flux;

class MyEventSource {

	private List<MyEventListener> listeners;

	public MyEventSource() {
		this.listeners = new ArrayList<>();
	}

	public void register(MyEventListener listener) { // 注册监听器；
		listeners.add(listener);
	}

	public void newEvent(MyEvent event) {
		for (MyEventListener listener : listeners) {
			listener.onNewEvent(event); // 向监听器发出新事件；
		}
	}

	public void eventStopped() {
		for (MyEventListener listener : listeners) {
			listener.onEventStopped(); // 告诉监听器事件源已停止；
		}
	}

	public static class MyEvent {
		private Date timeStemp;
		private String message;
		public MyEvent(){

		}
		/**
		 * @return the message
		 */
		public String getMessage() {
			return message;
		}
		/**
		 * @param message the message to set
		 */
		public void setMessage(String message) {
			this.message = message;
		}
		public MyEvent(Date timeStemp, String message){
			this.timeStemp = timeStemp;
			this.message = message;
		}
		/**
		 * @return the timeStemp
		 */
		public Date getTimeStemp() {
			return timeStemp;
		}
		/**
		 * @param timeStemp the timeStemp to set
		 */
		public void setTimeStemp(Date timeStemp) {
			this.timeStemp = timeStemp;
		}

		@Override
		public String toString() {
			return "MyEvent["+"timeStemp="+timeStemp+", message="+message+"]";
		}
	}
}

interface MyEventListener {
	void onNewEvent(MyEventSource.MyEvent event);

	void onEventStopped();
}

public class DataStreamLearn {

	public static void testGenerate(){
		// final AtomicInteger count = new AtomicInteger(1); // 外部变量，用于计数；
		// Flux.generate(sink -> {
		// 	sink.next(count.get() + " : " + new Date()); // 生成函数，向“池子”放自定义的数据；
		// 	try {
		// 		TimeUnit.SECONDS.sleep(1);
		// 	} catch (InterruptedException e) {
		// 		e.printStackTrace();
		// 	}
		// 	if (count.getAndIncrement() >= 5) {
		// 		sink.complete(); // 完成信号
		// 	}
		// }).subscribe(System.out::println); // 订阅

		// //使用伴随状态
		// Flux.generate(() -> 1, // 1
		// 		(count, sink) -> { // 2
		// 			sink.next(count + " : " + new Date());
		// 			try {
		// 				TimeUnit.SECONDS.sleep(1);
		// 			} catch (InterruptedException e) {
		// 				e.printStackTrace();
		// 			}
		// 			if (count >= 5) {
		// 				sink.complete();
		// 			}
		// 			return count + 1; // 3
		// 		}).subscribe(System.out::println);

		// 完成后处理
		Flux.generate(() -> 1, (count, sink) -> {
			sink.next(count + " : " + new Date());
			try {
				TimeUnit.SECONDS.sleep(1);
			} catch (InterruptedException e) {
				e.printStackTrace();
			}
			if (count >= 5) {
				sink.complete();
			}
			return count + 1;
		}, System.out::println) // 完成处理函数
				.subscribe(System.out::println);
	}

	public static void testCreate() throws InterruptedException{
        MyEventSource eventSource = new MyEventSource();    // 创建一个事件源
        Flux.create(sink -> { //立即执行
					eventSource.register(new MyEventListener() {    // 向事件源注册用匿名内部类创建的监听器；
						{
							System.out.println("注册了一个监听器");
						}
                        @Override
                        public void onNewEvent(MyEventSource.MyEvent event) {
                            sink.next(event);       // 当事件到来后，传递数据
                        }

                        @Override
                        public void onEventStopped() {
                            sink.complete();        // 当监听到停止信号停止数据
                        }
                    });
                }
        ).subscribe(System.out::println);       // 订阅数据源
		System.out.println("完成响应链条");
        for (int i = 0; i < 20; i++) {  // 向事件源中添加20个事件
            Random random = new Random();
            TimeUnit.MILLISECONDS.sleep(random.nextInt(1000));
            eventSource.newEvent(new MyEventSource.MyEvent(new Date(), "Event-" + i));
        }
        eventSource.eventStopped(); // 停止事件
	}

	public static void main(String[] args) throws InterruptedException {
		System.out.println("===testGenerate===");
		testGenerate();
		System.out.println("===testCreate===");
		testCreate();

	}
}
```

## 二、Spring WebFlux入门

***

### 1、HelloWorld

#### （1）创建一个简单的传统MVC项目

初始化Spring-Boot项目，依赖Web模块

```xml
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
```

创建Controller

```java
@RestController
public class HelloController {
	@GetMapping("/hello")
	public String hello() {
		return "Hello World";
	}
}
```

运行测试

#### （2）修改为WebFlux项目

修改依赖

```xml
		<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-starter-webflux</artifactId>
		</dependency>
```

修改Controller

```java
@RestController
public class HelloController {
	@GetMapping("/hello")
	public Mono<String> hello() {
		return Mono.just("Hello World");
	}
}
```

#### （3）总结

从 WebMVC 到 WebFlux 迁移，仅需引入 Webflux 包，将返回类型改为 Publisher 即可。同时 Webflux 还提供了函数式风格的API
其他变更：

* 技术栈从 spring-webmvc + servlet + Tomcat 变更为： spring-webflux + Reactor + Netty

### 2、WebFlux函数式开发模式

与传统方式的区别

* 使用`ServerRequest`和`ServerResponse`替代`ServletRequest`和`ServletResponse`
* 使用`HandlerFunction`和`RouterFunction`替代 Controller函数 和 @RequestMapping
	* HandlerFunction的声明为：`ServerRequest  -> Mono<T extends ServerResponse>` 由 request 推导出 response
	* RouterFunction的声明为：`Mono<HandlerFunction<T>> route(ServerRequest request)` 由 request -> HandlerFunction

#### （1）例子：开发获取时间和日期的端点

创建业务逻辑包`handler`，并创建类`TimerHandler`，定义一系列处理函数，`ServerRequest -> Mono<ServerResponse>`

（相当于Service）

```java
import static org.springframework.web.reactive.function.server.ServerResponse.ok;

@Service
public class TimerHandler {
	public Mono<ServerResponse> getTime(ServerRequest req){
		return ok()
				.contentType(MediaType.TEXT_PLAIN)
				.body(
					Mono.just(
						"Now is " +
							new SimpleDateFormat("HH:mm:ss").format(new Date())),
						String.class);
	}

	public Mono<ServerResponse> getDate(ServerRequest serverRequest) {
		return ok()
				.contentType(MediaType.TEXT_PLAIN)
				.body(
					Mono.just(
						"Today is " +
							new SimpleDateFormat("yyyy-MM-dd").format(new Date())),
						String.class);
	}
}
```

创建路由映射包`route`，定义路由映射（相当于Controller）

```java

import static org.springframework.web.reactive.function.server.RequestPredicates.GET;
import static org.springframework.web.reactive.function.server.RouterFunctions.route;

@Configuration
public class RouterConfig {
	@Autowired
	private TimerHandler timeHandler;

	@Bean
	public RouterFunction<ServerResponse> timeRouter() {
		return route(GET("/time"), timeHandler::getTime)
				.andRoute(GET("/date"), timeHandler::getDate);
	}

}
```

### 3、服务器推送

一般的推送实现方式：

* 短轮询：利用ajax定期向服务器请求，无论数据是否更新立马返回数据，高并发情况下可能会对服务器和带宽造成压力；
* 长轮询：利用comet不断向服务器发起请求，服务器将请求暂时挂起，直到有新的数据的时候才返回，相对短轮询减少了请求次数；
* SSE：服务端推送（Server Send Event），在客户端发起一次请求后会保持该连接，服务器端基于该连接持续向客户端发送数据，从HTML5开始加入。
* Websocket：这是也是一种保持连接的技术，并且是双向的，从HTML5开始加入，并非完全基于HTTP，适合于频繁和较大流量的双向通讯场景。

例子：实现每秒推送一次时间

`TimeHandler.java`

```java
	public Mono<ServerResponse> sendTimePerSec(ServerRequest serverRequest) {
		return ok()
				.contentType(MediaType.TEXT_EVENT_STREAM) // 使用SSE技术，MediaType.TEXT_EVENT_STREAM表示Content-Type为text/event-stream
				.body(
					Flux.interval(Duration.ofSeconds(1)) // 利用interval生成每秒一个数据的流
						.map(l -> new SimpleDateFormat("HH:mm:ss").format(new Date())),
					String.class);
	}
```

`RouterConfig.java`

```java
	@Bean
	public RouterFunction<ServerResponse> timeRouter() {
		return route(GET("/time"), timeHandler::getTime)
				.andRoute(GET("/date"), timeHandler::getDate)
				.andRoute(GET("/times"), timeHandler::sendTimePerSec); // 增加这一行
	}
```

引申WebMVC实现服务器推送SSE：
参见[github](https://github.com/aliakh/demo-spring-sse)，主要是使用 `SseEmitter` 和 `@Scheduled` 实现异步推送

### 4、响应式Spring Data

使用传统的MVC写法

#### （1）配置连接MongoDB

目前，响应式API仅支持MongoDB、Redis少数几个数据源

```
spring.data.mongodb.host=127.0.0.1
```

#### （2）创建Model和DAO

Model

```java
@Document
public class User{
	@Id // 注解属性id为ID
	private String id;
	@Indexed(unique = true) // 注解属性username为索引，并且不能重复
	private String username;
	private String phone;
	private String email;
	private String name;
	private Date birthday;
}
```

DAO

```java
public interface UserRepository extends ReactiveCrudRepository<User, String> { // User和ID的类型
	Mono<User> findByUsername(String username); // 类似JPA的方式
	Mono<Long> deleteByUsername(String username);
}
```

#### （2）创建Service

```java

@Service
public class UserService {
	@Autowired
	private UserRepository userRepository;

	/**
	 * 保存或更新。 如果传入的user没有id属性，由于username是unique的，在重复的情况下有可能报错，
	 * 这时找到以保存的user记录用传入的user更新它。
	 */
	public Mono<User> save(User user) {
		return userRepository.save(user)
					.onErrorResume(e -> // 1
						userRepository.findByUsername(user.getUsername()) // 2
					.flatMap(originalUser -> { // 4
						user.setId(originalUser.getId());
						return userRepository.save(user); // 3
					}));
	}

	public Mono<Long> deleteByUsername(String username) {
		return userRepository.deleteByUsername(username);
	}

	public Mono<User> findByUsername(String username) {
		return userRepository.findByUsername(username);
	}

	public Flux<User> findAll() {
		return userRepository.findAll();
	}
}
```

#### （3）创建Controller

针对大量的数据返回可以使用`MediaType.APPLICATION_STREAM_JSON_VALUE`方式响应式的返回

```java
@RestController
@RequestMapping("/user")
public class UserController {
	@Autowired
	private UserService userService;

	@PostMapping("")
	public Mono<User> save(User user) {
		return userService.save(user);
	}

	@DeleteMapping("/{username}")
	public Mono<Long> deleteByUsername(@PathVariable String username) {
		return userService.deleteByUsername(username);
	}

	@GetMapping("/{username}")
	public Mono<User> findByUsername(@PathVariable String username) {
		return userService.findByUsername(username);
	}

	@GetMapping("")
	public Flux<User> findAll() {
		return userService.findAll().delayElements(Duration.ofSeconds(1));
	}

	@GetMapping(value = "stream", produces = MediaType.APPLICATION_STREAM_JSON_VALUE)
	public Flux<User> findAllStream() {
		return this.userService.findAll().delayElements(Duration.ofSeconds(2));
	}
}
```

### 5、使用WebClient开发响应式Http客户端

#### （1）普通GET请求

```java
	public void webClientTest1() throws InterruptedException {
		WebClient webClient = WebClient.create("http://localhost:8080"); // 创建一个web client
		Mono<String> resp = webClient
				.get()
				.uri("/hello")
				.retrieve() // 异步地获取response信息；
				.bodyToMono(String.class); // 将response body解析为字符串；
		resp.subscribe(System.out::println); // 输出
		TimeUnit.SECONDS.sleep(1); // 睡眠一秒等待结果
	}
```

#### （2）获取流式数据

```java
	public void webClientTest2() throws InterruptedException {
		WebClient webClient = WebClient
			.builder()
			.baseUrl("http://localhost:8080")
			.build(); // 使用WebClientBuilder来构建WebClient对象；
		webClient.get()
				.uri("/user")
				.accept(MediaType.APPLICATION_STREAM_JSON) // 配置请求Header：Accept: application/stream+json；
				.exchange() // 获取response信息，返回值为ClientResponse，retrive()可以看做是exchange()方法的“快捷版”
				.flatMapMany(response -> response.bodyToFlux(User.class)) // 使用flatMap来将ClientResponse映射为Flux；
				.doOnNext(System.out::println) // 只读地peek每个元素，然后打印出来，它并不是subscribe，所以不会触发流；
				.blockLast(); // 上个例子中sleep的方式有点low，blockLast方法，顾名思义，在收到最后一个元素前会阻塞，响应式业务场景中慎用。
	}
```

#### （3）SSE请求

```java
	public void webClientTest3() throws InterruptedException {
		WebClient webClient = WebClient.create("http://localhost:8080");
		webClient.get()
				.uri("/times")
				.accept(MediaType.TEXT_EVENT_STREAM) // 配置请求Header：Accept: text/event-stream，即SSE；
				.retrieve()
				.bodyToFlux(String.class)
				.log() // 用log()代替doOnNext(System.out::println)来查看每个元素；
				.take(10) // 由于/times是一个无限流，这里取前10个，会导致流被取消；
				.blockLast();
	}
```

### 6、让数据在Http上双向无限流动起来

实现两个Endpoint：

* POST方法的/events，“源源不断”地收集数据，并存入数据库；
* GET方法的/events，“源源不断”将数据库中的记录发出来。

#### （1）Model

```java
@Document(collection = "event")
public class MyEvent {
	@Id
	private Long id;
	private String message;
}
```

#### （2）DAO

```java

public interface MyEventRepository extends ReactiveMongoRepository<MyEvent, Long> {
	@Tailable // @Tailable注解的作用类似于linux的tail命令，被注解的方法将发送无限流，需要注解在返回值为Flux这样的多个元素的Publisher的方法上；
	Flux<MyEvent> findBy(); // 2
}
```

#### （3）Controller

简单起见，省略Service

```java
@RestController
@RequestMapping("/events")
public class MyEventController {
	@Autowired
	private MyEventRepository myEventRepository;

	@PostMapping(path = "", consumes = MediaType.APPLICATION_STREAM_JSON_VALUE) // application/stream+json
	public Mono<Void> loadEvents(@RequestBody Flux<MyEvent> events) {
		// POST方法的接收数据流的Endpoint，所以传入的参数是一个Flux，
		//返回结果其实就看需要了，我们用一个Mono<Void>作为方法返回值，表示如果传输完的话只给一个“完成信号”就OK了；
		return myEventRepository.insert(events).then(); // then方法表示“忽略数据元素，只返回一个完成信号”。
	}

	@GetMapping(path = "", produces = MediaType.APPLICATION_STREAM_JSON_VALUE)
	public Flux<MyEvent> getEvents() { // 2
		// return myEventRepository.findAll().log();
		return myEventRepository.findBy().log();
	}
}
```

#### （4）数据源配置

```java

	@Bean
	public CommandLineRunner initData(MongoOperations mongo) { // 注入 mongo
		return (String... args) -> { // 命令行参数
			mongo.dropCollection(MyEvent.class); // 首先删除集合中的全部数据
			mongo.createCollection(
				MyEvent.class,
				CollectionOptions
					.empty() //创建一个空集合
					.maxDocuments(10) //最多10条记录
					.size(100000) //限制总大小
					.capped()); //生成配置
		};
	}
```

#### （5）测试

```java
	public void webClientTest4() {
		Flux<MyEvent> eventFlux = Flux.interval(Duration.ofSeconds(1))
				.map(l -> new MyEvent(System.currentTimeMillis(), "message-" + l))
				.take(5); // 创建长度为5的流
		WebClient webClient = WebClient.create("http://localhost:8080");
		webClient.post()
				.uri("/events")
				.contentType(MediaType.APPLICATION_STREAM_JSON) // 声明请求体的数据格式为application/stream+json；
				.body(eventFlux, MyEvent.class) // 类型转换
				.retrieve()
				.bodyToMono(Void.class)
				.block();
	}

```
