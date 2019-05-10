---
title: RabbitMQ
date: 2018-05-27T15:23:43+08:00
draft: false
toc: true
comments: true
aliases:
  - /detail/148
  - /detail/148/
tags:
  - 分布式
---

> [官网](http://www.rabbitmq.com/)
> [教程](http://www.rabbitmq.com/getstarted.html)

## 一、安装

***

### 1、Ubuntu

* [下载](http://www.rabbitmq.com/install-debian.html)
* 安装：略
* 服务启动停止状态

```bash
service rabbitmq-server start
service rabbitmq-server stop
service rabbitmq-server status
```

* 启动管理插件

```bash
sudo rabbitmq-plugins enable rabbitmq_management
#http://localhost:15672/
#username:guest, password:guest
```

## 二、教程

***

### 1、HelloWorld

#### （1）简介

RabbitMQ是一个消息中间件，用于转发消息，类似于各种编程语言中的阻塞队列。官方将其比喻为一个邮局，你可以将一封信放入邮箱，可以肯定的是最终快递员会将信交付到你的收件人手中。在这个比喻中，RabbitMQ代表的是邮政信箱，邮局和邮递员。

RabbitMQ和邮局的主要区别在于它不处理纸张，而是接受，存储和转发二进制数据块 - 消息。

生产意味着发送。一个发送消息的程序是一个生产者：简称`P`
队列代表着“邮箱”，一个队列只受主机内存和磁盘限制的约束，它本质上是一个很大的消息缓冲区。许多生产者可以发送消息到一个队列，并且许多消费者可以尝试从一个队列接收数据：简称`MQ`
消费与接收有类似的意义。消费者是一个主要等待接收消息的程序：简称`C`

#### （2）Java

**生产者**

```java
import com.rabbitmq.client.Channel;
import com.rabbitmq.client.Connection;
import com.rabbitmq.client.ConnectionFactory;

public class Send {

  private final static String QUEUE_NAME = "hello";

  public static void main(String[] argv) throws Exception {
    ConnectionFactory factory = new ConnectionFactory();
    factory.setHost("localhost");
    Connection connection = factory.newConnection();
    Channel channel = connection.createChannel();

    channel.queueDeclare(QUEUE_NAME, false, false, false, null);
    String message = "Hello World!";
    channel.basicPublish("", QUEUE_NAME, null, message.getBytes("UTF-8"));
    System.out.println(" [x] Sent '" + message + "'");

    channel.close();
    connection.close();
  }
}
```

**消费者**

```java
import com.rabbitmq.client.*;

import java.io.IOException;

public class Recv {

  private final static String QUEUE_NAME = "hello";

  public static void main(String[] argv) throws Exception {
    ConnectionFactory factory = new ConnectionFactory();
    factory.setHost("localhost");
    Connection connection = factory.newConnection();
    Channel channel = connection.createChannel();

    channel.queueDeclare(QUEUE_NAME, false, false, false, null);
    System.out.println(" [*] Waiting for messages. To exit press CTRL+C");

    Consumer consumer = new DefaultConsumer(channel) {
      @Override
      public void handleDelivery(String consumerTag, Envelope envelope, AMQP.BasicProperties properties, byte[] body)
          throws IOException {
        String message = new String(body, "UTF-8");
        System.out.println(" [x] Received '" + message + "'");
      }
    };
    channel.basicConsume(QUEUE_NAME, true, consumer);
  }
}
```

#### （3）Spring AMQP

略
