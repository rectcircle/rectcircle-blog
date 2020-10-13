---
title: "Spring Integration"
date: 2020-07-05T20:53:49+08:00
draft: false
toc: true
comments: true
tags:
  - java
---

> 版本：5.3.1

参考：

* [官方](https://spring.io/projects/spring-integration)
* [官方示例](https://github.com/spring-projects/spring-integration-samples)
* [Channel Adapter 博客](http://lizhe.name/node/140)
* [其他博客](https://blog.csdn.net/qq_40929047/article/details/89569887)

## 简介

Spring Integration （Integration：集成），是 基于 Spring 的 EIP （Enterprise Integration Patterns，企业集成模式） 实现。

主要用来解决 异构系统 的交互问题，通过异步消息驱动来达到系统交互时系统之间的松耦合。

异构系统的交互一般有两种方案：

* RPC 调用（大多数应用于 同步、实时的场景）
* 异步消息系统（大多数应用于 异步、耗时的场景）

Spring Integration 就是一种异步消息系统的实现。

其通过一系列核心接口，和基础设施，可以灵活的适配各种 消息队列。通过配置组合业务逻辑

## 核心接口

> https://docs.spring.io/spring-integration/docs/5.3.1.RELEASE/reference/html/core.html#spring-integration-core-messaging

### Message 消息

`org.springframework.messaging.Message`

```java
package org.springframework.messaging;

public interface Message<T> {

	T getPayload();

	MessageHeaders getHeaders();

}
```

消息体的封装，包含两个方法：

* `getPayload` 获取消息体
* `getHeaders` 获取消息头

### Message Channels 消息信道

消息信道就是一个通道，对应两个对应原语为

* `send` 生产者
* `receive`

```
生产者 ---send(msg)---> MessageChannel ---receive---> 消费者
```

从消费者角度看，存在两种可能：

* 点对点通信，消费者只能有一个
* 发布订阅模型，多个消费者

从缓存角度看，存在两种可能：

* 会缓存消息：`PollableChannel`
* 不会缓存消息：`SubscribableChannel`

#### 顶层接口 MessageChannel

`org.springframework.messaging.MessageChannel`

```java

package org.springframework.messaging;


@FunctionalInterface
public interface MessageChannel {

	long INDEFINITE_TIMEOUT = -1;

	default boolean send(Message<?> message) {
		return send(message, INDEFINITE_TIMEOUT);
	}

	boolean send(Message<?> message, long timeout);

}
```

* 发送消息时，如果消息发送成功，则返回值为true。如果发送超时或被中断，它将返回false

#### 可轮训信道 PollableChannel

实现该接口的信道，可以主动从信道中接收消息

```java
package org.springframework.messaging;

import org.springframework.lang.Nullable;

public interface PollableChannel extends MessageChannel {

	@Nullable
	Message<?> receive();

	@Nullable
	Message<?> receive(long timeout);

}
```

* 没有消息或者超时，将返回 null

#### `SubscribableChannel`

`SubscribableChannel` 接口将消息直接发送到订阅其的 `MessageHandler` 实例。因此，它们不提供轮询的 `receive` 方法。相反，其定义了用于管理 订阅者 的方法。

也就是说 其 维护了 消息 处理器 注册表并通过调用它们处理通过此通道发送的消息。

```java
package org.springframework.messaging;

public interface SubscribableChannel extends MessageChannel {

	boolean subscribe(MessageHandler handler);

	boolean unsubscribe(MessageHandler handler);

}
```

### MessageHandler 消息处理器

```java
package org.springframework.messaging;

@FunctionalInterface
public interface MessageHandler {

	void handleMessage(Message<?> message) throws MessagingException;

}
```

## 消息端点

消息端点就是 用户业务逻辑代码 和 消息系统集成的地方。类似与 SpringMVC 中 的 Controller。

消息端点不属于核心 核心组件，仅仅属于一种概念定义，不一定有对应的接口，一般是一种具体实现，绑定这一个 消息信道。

* `Transformer` （发送端、接收端）消息转换器：将一种消息转换为另一种消息 `org.springframework.integration.transformer.Transformer`，`Message<?> transform(Message<?> message);`
* `Filter` （发送端、接收端）消息过滤
* `Router` （发送端） 根据一定规则将 消息 `send` 到那些 `MessageChannel`
* `Splitter` 从接收端接收消息，拆分成多个消息，写入发送端
* `Aggregator` 聚合器，从接收端接收多个消息，进行合并聚合，写入发送端
* **重要** `Service Activator` 一种通用端点，从接收端 接收消息 作为函数参数，并将返回值写入 输出端
* **重要** `Channel Adapter` 一种通用端点，分为 `inbound` （从外部系统读取消息，写入输入 信道） 和 `outbound` （连接一个输出信道，用户写入输出信道，该组件将消息写入外部系统）

org.springframework.integration.endpoint.AbstractPollingEndpoint.doStart()
