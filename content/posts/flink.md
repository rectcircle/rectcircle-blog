---
title: "Flink"
date: 2020-04-19T18:53:46+08:00
draft: false
toc: true
comments: true
tags:
  - 大数据
---

> 版本： 1.10.0 and scala 1.12
> 参考

* 《Flink 基础教程》
* [官网](https://flink.apache.org/zh/)
* [阿里Flink文档](https://help.aliyun.com/document_detail/103076.html)
* [Flink滑动窗口原理与细粒度滑动窗口的性能问题](https://www.jianshu.com/p/45b03390b258)
* [Flink Window的5个使用小技巧](https://zhuanlan.zhihu.com/p/98658222)

## 《Flink 基础教程》

### 简介

该书很薄，主要内容在安利 Flink 和 介绍 流式计算的一些概念

### 核心内容

#### 第1章 为何选择Flink

lambda架构 局限性

* 需要对同一份逻辑为实时和批实现两次，运维成本高

Flink 的 特性

* 高吞吐
* 低延迟
* 事件窗口
* 操作简单/表现力好
* 保证了exactly-once

#### 第2章 流处理架构

```
文件/数据库 -> 消息传输层（Kafka、MapR Streams） -> 流处理层（Flink）
```

消息处理层的理想功能（Kafka都能满足）

* 高性能
* 持久性
* 可重复消费

#### 第3章 Flink的用途

事件时间：与处理时间相对，表示事件真正发生时的时间，在生产环境中一般为 记录创建的时间戳和 埋点发生的时间戳

#### 第4章 对时间的处理

批处理必然会遇到的问题

* 太多独立的部分。为了计算数据中的事件数，这种架构动用了太多系统。每一个系统都有学习成本和管理成本，还可能存在bug。
* 对时间的处理方法不明确。假设需要改为每30分钟计数一次。这个变动涉及工作流调度逻辑（而不是应用程序代码逻辑），从而使DevOps问题与业务需求混淆。
* 预警。假设除了每小时计数一次外，还需要尽可能早地收到计数预警（比如在事件数超过10时预警）。为了做到这一点，可以在定期运行的批处理作业之外，引入Storm来采集消息流（Kafka或者MapR Streams）。
* 乱序事件流。在现实世界中，大多数事件流都是乱序的，即事件的实际发生顺序（事件数据在生成时被附上时间戳，如智能手机记录下用户登录应用程序的时间）和数据中心所记录的顺序不一样。这意味着本属于前一批的事件可能被错误地归入当前一批。批处理架构很难解决这个问题，大部分人则选择忽视它
* 批处理作业的界限不清晰。在该架构中，“每小时”的定义含糊不清，分割时间点实际上取决于不同系统之间的交互。充其量也只能做到大约每小时分割一次，而在分割时间点前后的事件既可能被归入前一批，也可能被归入当前一批。将数据流以小时为单位进行分割，实际上是最简单的方法。假设需要根据产生数据的时间段（如从用户登录到退出）生成聚合结果，而不是简单地以小时为单位分割数据，则用如图4-1和图4-2所示的架构无法直接满足需求。

流处理区别于批处理最主要的两点是：

* 流即是流，不必人为地将它分割为文件；
* 时间的定义被明确地写入应用程序代码（如以上代码的时间窗口），而不是与摄取、计算和调度等过程牵扯不清。

时间概念

* 事件时间，即事件实际发生的时间。更准确地说，每一个事件都有一个与它相关的时间戳，并且时间戳是数据记录的一部分（比如手机或者服务器的记录）。事件时间其实就是时间戳。
* 处理时间，即事件被处理的时间。处理时间其实就是处理事件的机器所测量的时间。

窗口，窗口是一种机制，它用于将许多事件按照时间或者其他特征分组，从而将每一组作为整体进行分析（比如求和）

* 时间窗口是最简单和最有用的一种窗口。它支持滚动和滑动。
    * 滚动（前后两个窗口无交集），一个参数即窗口的大小
    * 滑动（前后两个窗口有交集），两个参数即窗口大小和滑动时间
* 计数窗口，采用计数窗口时，分组依据不再是时间戳，而是元素的数量。其滚动滑动定义类似如下
    * `stream.countWindow(4)`
    * `stream.countWindow(4, 2)`
* 会话窗口
    * 一般由超时时间设定 `stream.window(SessionWindows.withGap(Time.minutes(5))`
* 窗口时间起止时间是整数

触发器

* 触发器控制生成结果的时间，即何时聚合窗口内容并将结果返回给用户。每一个默认窗口都有一个触发器。例如，采用事件时间的时间窗口将在收到水印时被触发。对于用户来说，除了收到水印时生成完整、准确的结果之外，也可以实现自定义的触发器（例如每秒提供一次近似结果）。

窗口的实现的注意点

* 开窗机制与检查点机制（第5章将详细讨论）完全分离。这意味着窗口时长不依赖于检查点间隔。事实上，窗口完全可以没有“时长”（比如上文中的计数窗口和会话窗口的例子）。
* 高级用户可以直接用基本的开窗机制定义更复杂的窗口形式（如某种时间窗口，它可以基于计数结果或某一条记录的值生成中间结果）。

时空穿梭（重播）

水印

* 水印是Flink用于处理事件时间窗口一种机制，主要用来解决乱序问题，本质上是一种超时机制
* 水印本质上就是流中的普通记录，当遇到水印记录后，表示窗口结束，表示结果置信
* 针对迟到的数据，Flink也提供很多选项
* 判断水印是否到达的方式是，根据用户设置的策略或者时间
    * 可以是固定的超时时间
    * 可以是启发式的超时时间
* 使用事件时间时，配置水印后
    * Flink 周期性的或者根据每一条有效记录的向流中插入一条特殊的水印记录
    * 窗口会根据水印时间是否到达触发窗口完成

#### 第5章 有状态的计算

保证一致性（exactly-once） —— 检查点

* 按照一定策略，将系统状态持久化，当发生故障或者需要重发时，可以不用从头计算，可以从检查点开始计算，从而保证性能

Flink 的性能 可以达到Storm的30倍左右

#### 第6章 批处理：一种特殊的流处理

从原则上说，批处理是一种特殊的流处理：当输入数据是有限的，并且只需要得到最终结果时，对所有数据定义一个全局窗口并在窗口里进行计算即可。

考虑到性能，基于 Flink 的核心引擎 Flink 专门提供了用于实现 高效 批处理 的 机制

* 用于调度和恢复的回溯法：由Microsoft Dryad引入，现在几乎用于所有批处理器；
* 用于散列和排序的特殊内存数据结构：可以在需要时，将一部分数据从内存溢出到硬盘上；
* 优化器：尽可能地缩短生成结果的时间。

Flink 批处理性能：不弱于 Spark 、 MR

## Flink 推荐页

* 所有流式场景
    * 事件驱动应用
    * 流批分析
    * 数据管道 & ETL
* 正确性保证
    * Exactly-once 状态一致性
    * 事件时间处理
    * 成熟的迟到数据处理
* 分层 API
    * SQL on Stream & Batch Data
    * DataStream API & DataSet API
    * ProcessFunction (Time & State)
* 聚焦运维
    * 灵活部署
    * 高可用
    * 保存点
* 大规模计算
    * 水平扩展架构
    * 支持超大状态
    * 增量检查点机制
* 性能卓越
    * 低延迟
    * 高吞吐
    * 内存计算

## Hello World

### 前置条件

安装 JDK8 或 JDK11

### 安装

> [本地安装教程](https://ci.apache.org/projects/flink/flink-docs-release-1.10/zh/getting-started/tutorials/local_setup.html)

Mac 安装（建议采用通用安装）

```bash
brew install apache-flink
```

通用安装

* [下载](https://flink.apache.org/downloads.html)
    * 例如 `wget https://mirror.bit.edu.cn/apache/flink/flink-1.10.0/flink-1.10.0-bin-scala_2.12.tgz`
* 解压 `tar xzf flink-*.tgz`
* `cd flink-1.10.0`

### 启动本地集群

```bash
./bin/start-cluster.sh  # Start Flink
```

访问 http://localhost:8081 查看 Web UI

### 编写代码

本例中，将使用 Flink 进行词频统计，基本需求为：

* Flink 连接到一个 Socket Server
* Flink 实时统计 该 Socket Server 发送到该 Socket 端口的文本的词频，具体为
    * 每5秒统计打印一次前5秒时间范围内词频（时间窗口为5s、滚动窗口为5s）

#### Java

**创建 Maven 项目**

```bash
mvn org.apache.maven.plugins:maven-archetype-plugin:3.1.2:generate -DarchetypeArtifactId="flink-quickstart-scala" -DarchetypeGroupId="org.apache.flink" -DarchetypeVersion="1.10.0"
```

**修改POM**

```xml
    <!-- 根据情况修改属性  -->
	<properties>
		<project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
		<flink.version>1.10.0</flink.version>
		<java.version>1.8</java.version>
		<scala.binary.version>2.12</scala.binary.version>
		<maven.compiler.source>${java.version}</maven.compiler.source>
		<maven.compiler.target>${java.version}</maven.compiler.target>
	</properties>
    <!-- Flink 编程接口，scope = provided -->
    <dependencies>
		<dependency>
			<groupId>org.apache.flink</groupId>
			<artifactId>flink-java</artifactId>
			<version>${flink.version}</version>
			<scope>provided</scope>
		</dependency>
		<dependency>
			<groupId>org.apache.flink</groupId>
			<artifactId>flink-streaming-java_${scala.binary.version}</artifactId>
			<version>${flink.version}</version>
			<scope>provided</scope>
		</dependency>
    </dependencies>

    <!-- 如果使用 VSCode 开发，需考虑删除 IDEA 和 Eclipse 相关内容-->

```

**测试代码 `src/main/java/cn/rectcircle/ch01/SocketWindowWordCount.java`**

```java
package cn.rectcircle.flinklearnwithjava.ch01;

import org.apache.flink.api.common.functions.FlatMapFunction;
import org.apache.flink.api.common.functions.ReduceFunction;
import org.apache.flink.api.java.utils.ParameterTool;
import org.apache.flink.streaming.api.datastream.DataStream;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.api.windowing.time.Time;
import org.apache.flink.util.Collector;

public class SocketWindowWordCount {

    public static void main(String[] args) throws Exception {

        // 获取 host 和 端口 参数
        final String hostname;
        final int port;
        try {
            final ParameterTool params = ParameterTool.fromArgs(args);
            hostname = params.has("hostname") ? params.get("hostname") : "localhost";
            port = params.getInt("port");
        } catch (Exception e) {
            System.err.println("No port specified. Please run 'SocketWindowWordCount "
                    + "--hostname <hostname> --port <port>', where hostname (localhost by default) "
                    + "and port is the address of the text server");
            System.err.println("To start a simple text server, run 'netcat -l <port>' and "
                    + "type the input text into the command line");
            return;
        }

        // 获取执行环境
        final StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();

        // 通过连接到套接字获取输入数据
        DataStream<String> text = env.socketTextStream(hostname, port, "\n");

        // 解析数据，对其进行分组，对其进行窗口化并汇总计数
        DataStream<WordWithCount> windowCounts = text
                // 使用正则进行分词
                .flatMap((String value, Collector<WordWithCount> out) -> {
                    for (String word : value.split("\\s")) {
                        out.collect(new WordWithCount(word, 1L));
                    }
                }).returns(WordWithCount.class)
                // .flatMap(new FlatMapFunction<String, WordWithCount>() {
                // @Override
                // public void flatMap(String value, Collector<WordWithCount> out) {
                // for (String word : value.split("\\s")) {
                // out.collect(new WordWithCount(word, 1L));
                // }
                // }
                // })
                // 按照 word 字段进行分组，
                .keyBy("word")
                // 定义时间戳口，每五秒一个窗口
                .timeWindow(Time.seconds(5))
                // reduce 操作
                // .reduce(new ReduceFunction<WordWithCount>() {
                // @Override
                // public WordWithCount reduce(WordWithCount a, WordWithCount b) {
                // return new WordWithCount(a.word, a.count + b.count);
                // }
                // })
                .reduce((WordWithCount a, WordWithCount b) -> {
                    return new WordWithCount(a.word, a.count + b.count);
                }).returns(WordWithCount.class);

        // print the results with a single thread, rather than in parallel
        // 使用一个线程打印结构
        windowCounts.print().setParallelism(1);

        // 启动 Flink
        env.execute("Socket Window WordCount");
    }

    // ------------------------------------------------------------------------

    /**
     * Data type for words with count.
     */
    public static class WordWithCount {

        public String word;
        public long count;

        public WordWithCount() {
        }

        public WordWithCount(String word, long count) {
            this.word = word;
            this.count = count;
        }

        @Override
        public String toString() {
            return word + " : " + count;
        }
    }
}
```

**使用 nc 创建 Socket Server**

```bash
nc -l 9000
```

**调试运行**

* 在 VSCode 中点击 主类上的 `Run` 即可进行调试运行

**提交任务**

```bash
./bin/flink run --class cn.rectcircle.flinklearnwithjava.ch01.SocketWindowWordCount $HOME/Workspace/learn/flink/flink-learn-with-java/target/flink-learn-with-java-1.0-SNAPSHOT.jar --port 9000
```

**查看日志**

```bash
tail -f log/flink-*-taskexecutor-*.out
```

在 nc shell 输入单词，查看输出。

#### Scala

**创建 Maven 项目**

```bash
mvn org.apache.maven.plugins:maven-archetype-plugin:3.1.2:generate -DarchetypeArtifactId="flink-quickstart-scala" -DarchetypeGroupId="org.apache.flink" -DarchetypeVersion="1.10.0"
```

**修改POM**

```xml
    <!-- 根据情况修改属性  -->
	<properties>
		<project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
		<flink.version>1.10.0</flink.version>
		<scala.binary.version>2.12</scala.binary.version>
		<scala.version>2.12.11</scala.version>
	</properties>
    <!-- Flink 编程接口，scope = provided -->
    <dependencies>
		<dependency>
			<groupId>org.apache.flink</groupId>
			<artifactId>flink-scala_${scala.binary.version}</artifactId>
			<version>${flink.version}</version>
			<scope>provided</scope>
		</dependency>
		<dependency>
			<groupId>org.apache.flink</groupId>
			<artifactId>flink-streaming-scala_${scala.binary.version}</artifactId>
			<version>${flink.version}</version>
			<scope>provided</scope>
		</dependency>

		<!-- Scala Library, provided by Flink as well. -->
		<dependency>
			<groupId>org.scala-lang</groupId>
			<artifactId>scala-library</artifactId>
			<version>${scala.version}</version>
			<scope>provided</scope>
		</dependency>
    </dependencies>

    <!-- 如果使用 VSCode 开发，需考虑删除 IDEA 和 Eclipse 相关内容-->

```

**测试代码 `src/main/scala/cn/rectcircle/ch01/SocketWindowWordCount.scala`**

```scala
package cn.rectcircle.ch01

import org.apache.flink.api.java.utils.ParameterTool
import org.apache.flink.streaming.api.scala._
import org.apache.flink.streaming.api.windowing.time.Time

object SocketWindowWordCount {

  def main(args: Array[String]): Unit = {

    // 获取 host 和 端口 参数
    val port: Int =
      try {
        ParameterTool.fromArgs(args).getInt("port")
      } catch {
        case e: Exception => {
          System.err.println(
            "No port specified. Please run 'SocketWindowWordCount --port <port>'"
          )
          return
        }
      }

    // 获取执行环境
    val env: StreamExecutionEnvironment =
      StreamExecutionEnvironment.getExecutionEnvironment

    // 通过连接到套接字获取输入数据
    val text = env.socketTextStream("localhost", port, '\n')

    // 解析数据，对其进行分组，对其进行窗口化并汇总计数
    val windowCounts = text
      .flatMap { w => w.split("\\s") } // 使用正则进行分词
      .map { w => WordWithCount(w, 1) }
      .keyBy("word") // 按照 word 字段进行分组，
      .timeWindow(Time.seconds(5), Time.seconds(1)) // 定义时间戳口，每五秒一个窗口
      .sum("count")

    // 使用一个线程打印结构
    windowCounts.print().setParallelism(1)

    // 启动 Flink
    env.execute("Socket Window WordCount")
  }

  // Data type for words with count
  case class WordWithCount(word: String, count: Long)
}
```

**使用 nc 创建 Socket Server**

```bash
nc -l 9000
```

**提交任务**

```bash
./bin/flink run --class cn.rectcircle.flinklearnwithscala.ch01.SocketWindowWordCount $HOME/Workspace/learn/flink/flink-learn-with-scala/target/flink-learn-with-scala-1.0-SNAPSHOT.jar --port 9000
```

**查看日志**

```bash
tail -f log/flink-*-taskexecutor-*.out
```

在 nc shell 输入单词，查看输出。

### 停止测试集群

```bash
./bin/stop-cluster.sh
```

## 创建项目

Flink 官方提供了 Maven Gradle 和 SBT 项目模板，因此可以很方便的创建 Flink 项目

### Java - Maven

```bash
mvn archetype:generate                               \
      -DarchetypeGroupId=org.apache.flink              \
      -DarchetypeArtifactId=flink-quickstart-java      \
      -DarchetypeVersion=1.10.0
```

或者使用 Shell 脚本

```bash
curl https://flink.apache.org/q/quickstart.sh | bash -s 1.10.0
```

注意 VSCode 开发环境 需要删除 最后的 `lifecycle-mapping` 插件

小提示

* 当项目包含多个主类时，通过 `--class` 指定
* 可以通过 POM 中主类配置修改 入口类，这样就可以不适用 `--class`指定

### Java - Gradle

参加 https://ci.apache.org/projects/flink/flink-docs-release-1.10/zh/dev/projectsetup/java_api_quickstart.html#gradle

### Scala - Maven

```bash
mvn archetype:generate                               \
      -DarchetypeGroupId=org.apache.flink              \
      -DarchetypeArtifactId=flink-quickstart-scala     \
      -DarchetypeVersion=1.10.0
```

或者使用 Shell 脚本

```bash
curl https://flink.apache.org/q/quickstart-scala.sh | bash -s 1.10.0
```

### Scala - sbt

```bash
sbt new tillrohrmann/flink-project.g8
```

或使用

```bash
bash <(curl https://flink.apache.org/q/sbt-quickstart.sh)
```

## 依赖

所有这些依赖项的作用域都应该设置为 provided

```xml
<!-- 基础依赖 -->
<dependency>
  <groupId>org.apache.flink</groupId>
  <artifactId>flink-java</artifactId>
  <version>1.10.0</version>
  <scope>provided</scope>
</dependency>
<dependency>
  <groupId>org.apache.flink</groupId>
  <artifactId>flink-streaming-java_2.11</artifactId>
  <version>1.10.0</version>
  <scope>provided</scope>
</dependency>

<!-- Flink 连接 -->
<dependency>
    <groupId>org.apache.flink</groupId>
    <artifactId>flink-connector-kafka-0.10_2.11</artifactId>
    <version>1.10.0</version>
</dependency>

<!-- Scala 基础库依赖 -->
<dependency>
    <groupId>org.scala-lang</groupId>
    <artifactId>scala-library</artifactId>
    <version>${scala.version}</version>
    <scope>provided</scope>
</dependency>
```

关于 Scala 版本：Scala 子版本号 不兼容（比如2.10、2.11、2.12不兼容），因此必须Flink二进制版本Scala保持一致

其他依赖需要打包到 jar 中，因此需要使用 `maven-shade-plugin` 扩展

```xml
<build>
    <plugins>
        <plugin>
            <groupId>org.apache.maven.plugins</groupId>
            <artifactId>maven-shade-plugin</artifactId>
            <version>3.1.1</version>
            <executions>
                <execution>
                    <phase>package</phase>
                    <goals>
                        <goal>shade</goal>
                    </goals>
                    <configuration>
                        <artifactSet>
                            <excludes>
                                <exclude>com.google.code.findbugs:jsr305</exclude>
                                <exclude>org.slf4j:*</exclude>
                                <exclude>log4j:*</exclude>
                            </excludes>
                        </artifactSet>
                        <filters>
                            <filter>
                                <!--不要拷贝 META-INF 目录下的签名，
                                否则会引起 SecurityExceptions 。 -->
                                <artifact>*:*</artifact>
                                <excludes>
                                    <exclude>META-INF/*.SF</exclude>
                                    <exclude>META-INF/*.DSA</exclude>
                                    <exclude>META-INF/*.RSA</exclude>
                                </excludes>
                            </filter>
                        </filters>
                        <transformers>
                            <transformer implementation="org.apache.maven.plugins.shade.resource.ManifestResourceTransformer">
                                <mainClass>my.programs.main.clazz</mainClass>
                            </transformer>
                        </transformers>
                    </configuration>
                </execution>
            </executions>
        </plugin>
    </plugins>
</build>
```

## 基础 API 概念

Flink 程序是实现了分布式集合转换（例如过滤、映射、更新状态、join、分组、定义窗口、聚合）的规范化程序。

集合初始创建自 source（例如读取文件、kafka 主题，或本地内存中的集合）。
结果通过 sink 返回，例如，它可以将数据写入（分布式）文件，或标准输出（例如命令行终端）。
Flink 程序可以在多种环境中运行，独立运行或嵌入到其他程序中。可以在本地 JVM 中执行，也可以在多台机器的集群上执行。

针对有界和无界两种数据 source 类型，你可以使用 DataSet API 来编写批处理程序或使用 DataStream API 来编写流处理程序。分别对应

* StreamingExecutionEnvironment 和 DataStream API
* ExecutionEnvironment 和 DataSet API

### DataSet 和 DataStream

Flink 用特有的 DataSet 和 DataStream 类来表示程序中的数据。你可以将他们视为可能包含重复项的不可变数据集合。对于 DataSet，数据是有限的，而对于 DataStream，元素的数量可以是无限的。

这些集合与标准的 Java 集合有一些关键的区别。首先它们是不可变的，也就是说它们一旦被创建你就不能添加或删除元素了。你也不能简单地检查它们内部的元素。

在 Flink 程序中，集合最初通过添加数据 source 来创建，通过使用诸如 map、filter 等 API 方法对数据 source 进行转换从而派生新的集合。

* Java DateSet API 位于 [org.apache.flink.api.java](https://github.com/apache/flink/blob/master//flink-java/src/main/java/org/apache/flink/api/java) 包
* Java DataStream API 位于 [org.apache.flink.streaming.api](https://github.com/apache/flink/blob/master//flink-streaming-java/src/main/java/org/apache/flink/streaming/api)

### Flink 程序的基本结构

* 获取执行环境，
* 加载/创建初始数据，
* 指定对数据的转换操作，
* 指定计算结果存放的位置，
* 触发程序执行

获取执行环境

* 通过 StreamExecutionEnvironment 的静态方法，创建 StreamExecutionEnvironment 实例
    * `getExecutionEnvironment()` 因为它会根据上下文环境完成正确的工作
        * 本地调试，创建你的本机执行环境
        * 提交到集群中，将使用集群中环境
    * `createLocalEnvironment()`
    * `createRemoteEnvironment(String host, int port, String... jarFiles)`

加载/创建初始数据

* 通过 `StreamExecutionEnvironment` 的实例方法，创建 `DataStream` ，比如
    * `socketTextStream`
    * `readTextFile`

指定对数据的转换操作

* 通过 `DataStream` 的 算子，创建 新的 `DataStream`，构造计算流，比如
    * `flatMap`
    * `map`
    * `keyBy`

指定计算结果存放的位置

* 通过 `DataStream` 的 创建 `DataStreamSink` 的 相关方法，创建 新的 `DataStreamSink`，比如
    * `writeAsText(String path)`
    * `print()`

触发程序执行

* 通过 `StreamExecutionEnvironment` 的 执行相关方法，触发
    * 同步 `env.execute` 返回 `JobExecutionResult`
    * 异步 `env.executeAsync` 返回 `JobClient`
        * `jobClient.getJobExecutionResult(userClassloader).get()`

延迟执行特性

无论在本地还是集群执行，所有的 Flink 程序都是延迟执行的：当程序的 main 方法被执行时，并不立即执行数据的加载和转换，而是创建每个操作并将其加入到程序的执行计划中。当执行环境调用 execute() 方法显式地触发执行的时候才真正执行各个操作。

延迟计算允许你构建复杂的程序，Flink 将其作为整体计划单元来执行。

### 指定键

某些操作需要使用 定义键操作 和 转换操作 组合使用

例如

```java
// 如下对 DataSet 分组
DataSet<...> input = // [...]
DataSet<...> reduced = input
  .groupBy(/*在这里定义键*/)
  .reduceGroup(/*一些处理操作*/);

// 如下对 DataStream 指定键
DataStream<...> input = // [...]
DataStream<...> windowed = input
  .keyBy(/*在这里定义键*/)
  .window(/*指定窗口*/);
```

**为 Tuple 定义键**

**使用字段表达式定义键**

**使用键选择器函数定义键**

### 支持的数据类型

### 累加器和计数器

### Scala API 扩展

### Java lambda 表达式

## Stream API (DataStream)

## Batch API (DataSet)

## Table API & SQL
