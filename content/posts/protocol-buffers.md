---
title: "Protocol Buffers"
date: 2019-12-20T15:39:33+08:00
draft: false
toc: true
comments: true
tags:
  - 后端
---

> [官方](https://developers.google.com/protocol-buffers)
> [PB3中文文档翻译](https://colobu.com/2017/03/16/Protobuf3-language-guide/)
> [PB2中文文档翻译](https://colobu.com/2015/01/07/Protobuf-language-guide/)
> [测试代码](https://github.com/rectcircle/pb-learn)

## 一、简介

> https://developers.google.com/protocol-buffers/docs/overview

PB 是 Google 开发的与语言平台无关的、可扩展的转为序列化数据使用的协议。可以类比XML，但是PB更小更快更简单。你可以一次定义数据结构，多次在不同的编程语言中使用。

如何使用

* 在 `.proto` 文件中定义消息的数据结构
* 使用 PB 提供的编译器（代码生成器） 生成用于访问数据的类
* 使用 PB 提供的类库和生成的代码序列化和反序列化数据
* PB定义的 `.proto` 有向前兼容性，用新的 `.proto` 解析旧的二进制数据，新的添加的字段将置空而非报错

与XML相比PB有如下优势

* 更简单
* 小3到10倍（二进制存储）
* 快20到100倍
* 不那么模棱两可
* 生成易于通过编程使用的数据访问类

与XML相比PB有如下劣势（二进制协议的问题）

* 数据文件人类不可读
* 不可自描述

## 二、下载安装

> https://developers.google.com/protocol-buffers/docs/downloads.html

前往 https://github.com/protocolbuffers/protobuf/tags 下载需要版本的发行包。

选择 `protoc-$VERSION-$PLATFORM.zip` 文件进行下载，解压后目录结构如下：

```
├── bin
│   └── protoc
├── include
│   └── google
│       └── protobuf
│           ├── any.proto
│           ├── api.proto
│           ├── compiler
│           │   └── plugin.proto
│           ├── descriptor.proto
│           ├── duration.proto
│           ├── empty.proto
│           ├── field_mask.proto
│           ├── source_context.proto
│           ├── struct.proto
│           ├── timestamp.proto
│           ├── type.proto
│           └── wrappers.proto
└── readme.txt
```

其中 protoc 为编译器

将 bin 加入 PATH 环境变量

```bash
export PATH="$HOME/Workspace/dev-bin/protoc-3.11.2-osx-x86_64/bin:$PATH"
```

## 三、官方样例

一个非常简单的“地址簿”应用程序，它可以在文件中读取和写入人们的联系方式。通讯录中的每个人都有一个姓名，一个ID，一个电子邮件地址和一个联系电话。

### 1、Java示例

> https://developers.google.com/protocol-buffers/docs/javatutorial

#### （1）准备

创建Java项目

编写 `.proto` 文件 `src/main/resources/address_book.proto`

```proto
syntax = "proto2"; // 声明语法类型：目前有proto2和proto3连个版本

// 包名类似java
// protoc命令参数：
// java_package 指定生成代码包名，生成Java代码时如果不指定的话，生成代码的包名默认为下面
// java_outer_classname Java外部类名，如果不指定，将通过将文件名转换为驼峰大小写来生成
package cn.rectcircle.learn.addressbook;

option java_package = "com.example.tutorial";
option java_outer_classname = "AddressBookProtos";

message Person {
    // string int32 表示数据类型
  required string name = 1; // 后面的 标号表示 唯一标识符，小于16，则只占1字节
  required int32 id = 2; // required 表示必填
  optional string email = 3; // optional 表示可选

  enum PhoneType {
    MOBILE = 0;
    HOME = 1;
    WORK = 2;
  }

  message PhoneNumber {
    required string number = 1;
    optional PhoneType type = 2 [default = HOME];
  }

  repeated PhoneNumber phones = 4; // repeated 表示该字段可以重复多次，类似于数组
}

message AddressBook {
  repeated Person people = 1;
}
```

编译

```bash
protoc -I=src/main/resources --java_out=src/main/java src/main/resources/address_book.proto
```

以上命令将生成一个Java文件 `src/main/java/cn/rectcircle/learn/pb/AddressBookProtos.java`

添加依赖

```xml
        <dependency>
            <groupId>com.google.protobuf</groupId>
            <artifactId>protobuf-java</artifactId>
            <version>3.11.1</version>
        </dependency>
```

#### （2）使用

```java
        // 构造一个对象
        Person john = Person.newBuilder()
                .setId(1234)
                .setName("John Doe")
                .setEmail("jdoe@example.com")
                .addPhones(
                Person.PhoneNumber.newBuilder()
                    .setNumber("555-4321")
                    .setType(Person.PhoneType.HOME))
                .build();
        System.out.println("构建的对象");
        System.out.println(john);
        System.out.println();

        // 序列化
        ByteArrayOutputStream os = new ByteArrayOutputStream();
        john.writeTo(os);
        byte[] data = os.toByteArray();
        System.out.println("序列化数据字节数：" + data.length);
        System.out.println();

        // 反序列化
        Person john2 = Person.parseFrom(new ByteArrayInputStream(data));
        System.out.println("反序列化出的对象");
        System.out.println(john);
        System.out.println("反序列化出的对象与原始对象equals结果："+john2.equals(john));
        System.out.println();
```

#### （3）先前兼容规则

* 不得更改任何现有字段的标签号
* 不得添加或删除任何必填字段
* 可以删除可选或重复的字段
* 您可以添加新的可选或重复字段，但必须使用新的标签号（即，该协议缓冲区中从未使用过的标签号，甚至删除的字段也从未使用过）

遵循如上规则后：

* 当旧代码读取新消息时，只是忽略任何新字段。
    * 对于旧代码，已删除的可选字段将仅具有其默认值，而删除的重复字段将为空。
* 新代码还将透明地读取旧消息
    * 新添加的可选字段不会出现在旧消息中，因此需要明确检查是否已使用 `has_` 方法来检测，或者需要在`.proto` 文件中使用[default = value]提供合理的默认值。
    * 未给默认值的可选字段默认值为：
        * 对于字符串，默认值为空字符串。
        * 对于布尔值，默认值为false。
        * 对于数字类型，默认值为零。
    * 如果添加了一个新的重复字段，则新代码将无法判断：
        * 它是空的（由新代码）
        * 还是根本没有设置（由旧代码）
        * 因为没有 `has_` 标志
