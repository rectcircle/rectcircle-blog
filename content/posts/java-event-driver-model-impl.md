---
title: "Java 事件驱动模型实现"
date: 2020-07-18T18:25:27+08:00
draft: false
toc: true
comments: true
tags:
  - java
---

参考：

* Hadoop Yarn 部分源码

实验代码：https://github.com/rectcircle/java-event-driver-learn

## 简介

<!-- 计算机CPU是以固定的频率不间断的进行逻辑计算的，但是因为要与人类进行交互，不得不需要等待某些事情（事件）的发生才能进行响应。

如果程序傻傻的等待这些事件的发生才做出响应，这样会造成CPU白白的空转，浪费宝贵的 CPU 资源。

因此，在硬件层面，就提供了中断机制。 -->

事件驱动模型是一种编程范式，一般应用于：

* 在网络编程中，一般情况下会与非阻塞IO（NIO）相结合，实现为应用层的 异步IO （AIO）。
* 在UI编程中，事件驱动模型也是几乎所有UI框架的标配
* 在业务层，面对需要阻塞等待的场景，事件驱动模型一般是处理此类问题的性能最好的解决方案

总的来说，在面对需要“等待”、“阻塞”、“轮询”的场景，都需要事件驱动模型来解决。

事件驱动模型也存在一些问题：

* 流程不清晰，逻辑相对复杂，代码不易阅读，调试困难

放在分布式系统中，与之类似的是 消息驱动模型

## 概念

* `Event` 事件
* `Dispatcher` 分发器，Driver
* `EventHandler` 事件处理器

## 使用方式

* 定义 `EventHandler` 进行事件处理逻辑
* 调用 `Dispatcher` 注册 `EventHandler`
* 在合适的地方 调用 `Dispatcher.dispatchEvent` 的 触发事件

## 流程

* 合适的位置 调用 `Dispatcher.dispatchEvent` 发送一个 `Event`
* `Dispatcher` 的 事件循环 取出 `Event`，分发给每一个 `EventHandler`

## Java 实现

### 新建 Maven 项目

```bash
mvn org.apache.maven.plugins:maven-archetype-plugin:3.1.2:generate -DarchetypeArtifactId="maven-archetype-quickstart" -DarchetypeGroupId="org.apache.maven.archetypes" -DarchetypeVersion="1.4"
```

添加日志依赖

```xml
        <dependency>
            <groupId>ch.qos.logback</groupId>
            <artifactId>logback-classic</artifactId>
            <version>1.2.3</version>
        </dependency>
        <dependency>
            <groupId>ch.qos.logback</groupId>
            <artifactId>logback-core</artifactId>
            <version>1.2.3</version>
        </dependency>
        <dependency>
            <groupId>org.slf4j</groupId>
            <artifactId>slf4j-api</artifactId>
            <version>1.7.30</version>
        </dependency>
```

### 核心接口

#### Event

`src/main/java/cn/rectcircle/learn/event/Event.java`

```java
package cn.rectcircle.learn.event;

/**
 * Interface defining events api.
 * 事件接口
 * @author
 */
public interface Event<T extends Enum<T>> {

    /**
     * 事件类型
     * @return
     */
    T getType();

    /**
     * 事件触发的时间戳
     * @return 时间戳
     */
    long getTimestamp();

    /**
     * 获取分发器
     *
     * @return {@link Dispatcher}
     */
    Dispatcher getDispatcher();

    /**
     * human string of event
     * @return
     */
    @Override
    String toString();
}
```

#### EventHandler

`src/main/java/cn/rectcircle/learn/event/EventHandler.java`

```java
package cn.rectcircle.learn.event;


/**
 * Interface for handling events of type T
 * 事件处理器接口
 *
 * @param <T> 事件类型的类型
 * @param <E> parameterized event of type T 事件的类型
 * @author
 */
@FunctionalInterface
public interface EventHandler<T extends Enum<T>, E extends Event<T>> {

    /**
     * 处理函数
     * @param event 事件
     */
    void handle(E event);

}
```

#### Dispatcher

```java
package cn.rectcircle.learn.event;

/**
 * Event Dispatcher interface. It dispatches events to registered event handlers
 * based on event types. 事件分发器。用于将事件分发到注册到 该 事件 eventType 的 EventHandler
 *
 * @author
 */
public interface Dispatcher {

    /**
     * 触发一个事件
     * @param event 一个事件
     */
    <T extends Enum<T>, E extends Event<T>> void dispatchEvent(E event);

    /**
     * 针对一种事件类型，注册一个消息处理器
     * @param eventType 事件类型
     * @param handler 事件处理器
     */
    <T extends Enum<T>, E extends Event<T>> void register(T eventType, EventHandler<T, E> handler);

    /**
     * 针对一种事件类型的类型，注册一个消息处理器，即所有该 class 的类型都会触发该处理器
     *
     * @param eventTypeClazz 事件类型的类型
     * @param handler        事件处理器
     */
    <T extends Enum<T>, E extends Event<T>> void register(Class<T> eventTypeClazz, EventHandler<T, E> handler);
}
```

#### EventHandler

`src/main/java/cn/rectcircle/learn/event/EventHandler.java`

```java
package cn.rectcircle.learn.event;


/**
 * Interface for handling events of type T
 * 事件处理器接口
 *
 * @param <T> 事件类型的类型
 * @param <E> parameterized event of type T 事件的类型
 * @author
 */
@FunctionalInterface
public interface EventHandler<T extends Enum<T>, E extends Event<T>> {

    /**
     * 处理函数
     * @param event 事件
     */
    void handle(E event);

}
```

### Dispatcher 的 实现

`src/main/java/cn/rectcircle/learn/event/AsyncDispatcher.java`

```java
package cn.rectcircle.learn.event;


import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Dispatches {@link Event}s in a separate thread. Currently only single thread
 * does that. Potentially there could be multiple channels for each event type
 * class and a thread pool can be used to dispatch the events.
 * 异步调度器：
 * <ui>
 * <li>每一个事件类型允许注册一个或多个事件处理器</li>
 * <li>事件循环运行在单独的线程中</li>
 * <li>事件处理器与事件循环运行在不同的线程中（异步），同一个事件的多个事件处理器运行在同一线程中（同步）</li>
 * </ui>
 * @author
 */
public class AsyncDispatcher implements Dispatcher {

    private static final Logger LOG = LoggerFactory.getLogger(AsyncDispatcher.class);
    private static final int EVENT_PRINT_THRESHOLD = 1000;

    private final BlockingQueue<Event<?>> eventQueue;
    private volatile boolean stopped = false;

    private Thread eventHandlingThread;
    private final ExecutorService eventHandlingPool;
    protected final Map<Object, EventHandler<?, ?>> eventDispatchers;

    public AsyncDispatcher(ExecutorService eventHandlingPool) {
        this(eventHandlingPool, new LinkedBlockingQueue<>());
    }

    public AsyncDispatcher(ExecutorService eventHandlingPool, BlockingQueue<Event<?>> eventQueue) {
        this.eventQueue = eventQueue;
        this.eventDispatchers = new HashMap<>();
        this.eventHandlingPool = eventHandlingPool;
    }

    /**
     * 事件循环逻辑
     */
    Runnable createThread() {
        return () -> {
            while (!stopped && !Thread.currentThread().isInterrupted()) {
                Event<?> event;
                try {
                    event = eventQueue.take();
                } catch (InterruptedException ie) {
                    if (!stopped) {
                        LOG.warn("AsyncDispatcher thread interrupted", ie);
                    }
                    return;
                }
                dispatch(event);
            }
        };
    }

    /**
     * 启动事件循环
     */
    public void serviceStart() {
        // 创建一个单线程的线程池
        ThreadPoolExecutor singleThread = new ThreadPoolExecutor(1, 1, 0L,
                TimeUnit.MILLISECONDS, new LinkedBlockingQueue<>(), runnable -> {
            eventHandlingThread = new Thread(runnable);
            eventHandlingThread.setName("AsyncDispatcher event handler");
            return eventHandlingThread;
        });
        singleThread.execute(createThread());
    }

    /**
     * 关闭事件循环
     */
    public void serviceStop() {
        stopped = true;
        if (eventHandlingThread != null) {
            eventHandlingThread.interrupt();
            try {
                eventHandlingThread.join();
            } catch (InterruptedException ie) {
                LOG.warn("Interrupted Exception while stopping", ie);
            }
        }
    }

    /**
     * 分发函数，事件循环调用
     */
    protected <T extends Enum<T>, E extends Event<T>> void dispatch(E event) {
        if (LOG.isDebugEnabled()) {
            LOG.debug("Dispatching the event " + event.getClass().getName() + "."
                    + event.toString());
        }

        T type = event.getType();
        try {
            @SuppressWarnings("unchecked")
            EventHandler<T, E> handler1 = (EventHandler<T, E>) eventDispatchers.get(type.getClass());
            @SuppressWarnings("unchecked")
            EventHandler<T, E> handler2 = (EventHandler<T, E>) eventDispatchers.get(type);
            if (handler1 == null && handler2 == null) {
                throw new Exception("No handler for registered for " + type);
            }
            // 提交事件处理到 worker 线程池
            eventHandlingPool.execute(() -> {
                if (handler1 != null) {
                    handler1.handle(event);
                }
                if (handler2 != null) {
                    handler2.handle(event);
                }
            });
        } catch (Throwable t) {
            LOG.error("something happen in handle", t);
        }
    }

    private <T extends Enum<T>, E extends Event<T>> void internalRegister(Object eventType, EventHandler<T, E> handler){
        // check to see if we have a listener registered
        // 检查是否已注册侦听器
        @SuppressWarnings("unchecked")
        EventHandler<T, E> registeredHandler = (EventHandler<T, E>) eventDispatchers.get(eventType);
        LOG.info("Registering " + eventType + " for " + handler.getClass());
        if (registeredHandler == null) {
            eventDispatchers.put(eventType, handler);
        } else if (!(registeredHandler instanceof MultiListenerHandler)) {
            MultiListenerHandler<T, E> multiHandler = new MultiListenerHandler<>();
            multiHandler.addHandler(registeredHandler);
            multiHandler.addHandler(handler);
            eventDispatchers.put(eventType, multiHandler);
        } else {
            // already a multilistener, just add to it
            // 已经是 multilistener，只需添加即可
            MultiListenerHandler<T, E> multiHandler = (MultiListenerHandler<T, E>) registeredHandler;
            multiHandler.addHandler(handler);
        }
    }

    /**
     * 注册函数，某事件类型注册第一个处理器时直接注册，注册第二个时创建使用 {@link MultiListenerHandler} 进行包裹
     */
    @Override
    public <T extends Enum<T>, E extends Event<T>> void register(T eventType,
            EventHandler<T, E> handler) {
        this.internalRegister(eventType, handler);
    }


    @Override
    public <T extends Enum<T>, E extends Event<T>> void register(Class<T> eventTypeClazz, EventHandler<T, E> handler) {
        this.internalRegister(eventTypeClazz, handler);
    }

    @Override
    public <T extends Enum<T>, E extends Event<T>> void dispatchEvent(E event) {
        int queueSize = eventQueue.size();
        if (queueSize != 0 && queueSize % EVENT_PRINT_THRESHOLD == 0) {
            LOG.info("Size of event-queue is " + queueSize);
        }
        int remCapacity = eventQueue.remainingCapacity();
        if (remCapacity < EVENT_PRINT_THRESHOLD) {
            LOG.warn("Very low remaining capacity in the event-queue: " + remCapacity);
        }
        try {
            eventQueue.put(event);
        } catch (InterruptedException e) {
            LOG.error("interrupted while put in event queue");
            throw new RuntimeException(e);
        }
    }

    /**
     * Multiplexing an event. Sending it to different handlers that
     * are interested in the event.
     */
    static class MultiListenerHandler<T extends Enum<T>, E extends Event<T>> implements EventHandler<T, E> {
        List<EventHandler<T, E>> listofHandlers;

        public MultiListenerHandler() {
            listofHandlers = new ArrayList<>();
        }

        @Override
        public void handle(E event) {
            for (EventHandler<T, E> handler : listofHandlers) {
                handler.handle(event);
            }
        }

        void addHandler(EventHandler<T, E> handler) {
            listofHandlers.add(handler);
        }
    }

}
```

### 方便用户使用事件抽象类

`src/main/java/cn/rectcircle/learn/event/AbstractEvent.java`

```java
package cn.rectcircle.learn.event;

/**
 * Parent class of all the events. All events extend this class.
 * 所有事件的父类：包含类型和时间戳
 *
 * @author
 */
public abstract class AbstractEvent<T extends Enum<T>> implements Event<T> {

    private final T type;
    private final long timestamp;
    private final Dispatcher dispatcher;

    public AbstractEvent(Dispatcher dispatcher, T type) {
        // We're not generating a real timestamp here. It's too expensive.
        // System.currentTimeMillis 存在一定性能问题 https://www.jianshu.com/p/3fbe607600a5
        this(dispatcher, type, -1L);
    }

    public Dispatcher getDispatcher() {
        return dispatcher;
    }

    public AbstractEvent(Dispatcher dispatcher, T type, long timestamp) {
        this.dispatcher = dispatcher;
        this.type = type;
        this.timestamp = timestamp;
    }

    @Override
    public long getTimestamp() {
        return timestamp;
    }

    @Override
    public T getType() {
        return type;
    }

    @Override
    public String toString() {
        return "EventType: " + getType();
    }

}
```

## 测试

* 主线程 发送 一个 包含一个单词 的 事件，打印 `Hello $单词`

### 创建相关 Event 和 EventType

`src/main/java/cn/rectcircle/learn/base/BaseEventType.java`

```java
package cn.rectcircle.learn.base;

/**
 * @author rectcircle
 */
public enum BaseEventType {
    /** 测试事件类型 */
    HELLO,
    /** 测试事件类型 */
    HI,
    ;
}
```

`src/main/java/cn/rectcircle/learn/base/BaseEvent.java`

```java
package cn.rectcircle.learn.base;

import cn.rectcircle.learn.event.AbstractEvent;
import cn.rectcircle.learn.event.Dispatcher;

/**
 * @author rectcircle
 */
public class BaseEvent extends AbstractEvent<BaseEventType> {

    private final String word;

    public BaseEvent(final Dispatcher dispatcher, final BaseEventType type, final String word) {
        super(dispatcher, type);
        this.word = word;
    }

    public String getWord() {
        return word;
    }

}
```

### 整体测试

`src/main/java/cn/rectcircle/learn/main/BaseUsage.java`

```java
package cn.rectcircle.learn.main;

import java.util.concurrent.Executors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import cn.rectcircle.learn.base.BaseEvent;
import cn.rectcircle.learn.base.BaseEventType;
import cn.rectcircle.learn.event.AsyncDispatcher;

/**
 * @author rectcircle
 */
@SuppressWarnings({"PMD.ThreadPoolCreationRule", "PMD.UndefineMagicConstantRule"})
public class BaseUsage {

    private static final Logger LOG = LoggerFactory.getLogger(BaseUsage.class);

    public static void main(String[] args) {

        AsyncDispatcher dispatcher = new AsyncDispatcher(
            Executors.newSingleThreadExecutor()
        );

        // 注册处理器
        dispatcher.register(BaseEventType.HELLO, (BaseEvent e) -> {
            LOG.info("Hello " + e.getWord());
        });
        dispatcher.register(BaseEventType.HI, (BaseEvent e) -> {
            LOG.info("Hi " + e.getWord());
        });
        dispatcher.register(BaseEventType.class, (BaseEvent e) -> {
            LOG.info("通过 class 注册 " + e.getWord());
        });

        // 启动事件循环
        dispatcher.serviceStart();

        // 发送事件
        for (int i = 0; i < 10; i++) {
            dispatcher.dispatchEvent(new BaseEvent(dispatcher, BaseEventType.HELLO, "World"));
            dispatcher.dispatchEvent(new BaseEvent(dispatcher, BaseEventType.HI, "世界"));
        }
    }
}
```
