---
title: Hadoop 笔记（二）
date: 2019-04-19T13:50:11+08:00
draft: false
toc: true
comments: true
aliases:
  - /detail/191
  - /detail/191/
tags:
  - 大数据
---

> http://hadoop.apache.org/docs/r2.6.5/
> 《Hadoop权威指南》
> [配置列表](http://hadoop.apache.org/docs/current/hadoop-mapreduce-client/hadoop-mapreduce-client-core/mapred-default.xml)

## 五、MR使用与原理

### 8、MR工作机制

#### （1）MR作业运行机制

**涉及的实体如下**

* Hadoop客户端
* YARN 资源管理器
* YARN 节点管理器
* MR 的 application master
* HDFS

图示参见《Hadoop权威指南》P185

**流程**

* 步骤1：Hadoop 客户端运行指定的main函数，并创建一个Job对象
* 步骤2：Job对象向资源管理器申请一个新的应用ID，当做作业ID
* 步骤3：
	* 检查输出目录是否存在，若存在抛出异常
	* 检查输入路径是否存在，若不存在抛出异常
	* 将作业涉及的Jar包和相关依赖文件put到HDFS中，文件目录名为作业ID
* 步骤4：调用资源管理器的submitApplication方法提交作业
* 步骤5：资源管理器接收到submitApplication消息后，询问调度器分配一个容器，并启动application master(MRAppMaster)
	* MRAppMaster是一个Java程序，负责分配任务ID、启动MR任务、管理监控MR运行、报告作业完成
		* 根据输出分片数创建指定数目的Map任务
		* 根据setNumReduceTasks()方法的设定值，创建指定书目的Reduce任务
		* 小作业将直接在MRAppMaster所在的容器（进程）运行，大作业将启动新的容器运行任务；相关设置
			* `mapreduce.job.ubertask.maxmaps` 最大uber运行的map数
			* `mapreduce.job.ubertask.maxreduces` 最大uber运行的reduce数
			* `mapreduce.job.ubertask.maxbytes` 最大uber运行的文件字节数
			* `mapreduce.job.ubertask.enable` 是否启用uber
		* 在任务运行之前，调用setupJob设置OutputCommitter（默认值为：FileOutputCommitter），来建立作业的最终输出目录和输出的临时工作空间

在非uber默认，MRAppMaster将先申请map任务的容器（考虑到数据本地化），当map完成率达到5%，开始申请Reduce任务容器。这些任务由名为YarnChild的Java程序运行任务：

* YarnChild都能执行任务OutputCommitter中的setup（搭建）和commit（提交）方法
* commit将会保证当启用推测使执行被启用时，只有一个副本被提交，其他的都会被取消

**MR分配的内存和CPU通过如下配置**

* mapreduce.map.memory.mb 默认 1024
* mapreduce.reduce.memory.mb 默认 1024
* mapreduce.map.cpu.vcores 默认 1
* mapreduce.reduce.cpu.vcores 默认 1

**进度和状态更新**

* 核心是MRAppMaster
	* 任务容器定时提交状态到MRAppMaster中
	* 客户端定时轮训MRAppMaster，将任务状态展示给用户

**作业完成**

* MRAppMaster在收到最后一个作业完成后，将Job状态设置为Success，Job轮训到之后waitForComletion返回
* 如果设置了`mapreduce.job.end-notification.url`完成后将会发起这个WebHook

#### （2）失败

**任务失败**

* 任务失败的情况
	* Streaming 任务代码非零退出、标记为失败
	* JVM异常退出，NodeManager可以直接获取到消息，表示失败
	* JVM挂起（任务进度报告超时），`mapreduce.task.timeout` 单位毫秒，默认为10分钟，0表示永远不标记失败
* 任务重试
	* 检测到失败后，MRAppMaster将进行重试，次数由`mapreduce.task.maxattempts`默认为4。
	* 任务推测执行的取消不计入失败重试
* Job允许的最大失败比例（百分比）
	* `mapreduce.map.failures.maxpercent` 默认为0
	* `mapreduce.reduce.failures.maxpercent`  默认为0

**application master运行失败**

* 由`mapreduce.am.max-attempts` 管理默认为2
* MRAppMaster在恢复过程中会通过作业历史来恢复Job状态而不是重新运行
	* `yarn.app.mapreduce.am.job.recovery.enbale` 默认为true

**节点管理器运行失败**

* 心跳超时（yarn.resourcemanager.nm.liveness-monitor.expiry-interval.ms），默认10分钟

**资源管理器运行失败**

* 属于单点故障（YARN高可用部署）

#### （3） Shuffle和排序

Shuffle 表示Map端输出到Reduce端输入的过程。涉及多次排序。图见《Hadoop权威编程》P196。这里所谓的排序是对Key进行排序。目的是将Key相同的Map输出聚集在一起，组成`<K, List<V>>`

**特殊说明**

* 除了输出最终结果外，所有的文件写入的目录位置均为为本地磁盘而不是HDFS
* 整个过程就是一个排序的过程核心逻辑是小的符合规则文件合并成大的符合规则的文件
* 符合规则的文件为：按照reducer数目按照按一定规则（如hash）进行分区，每个分区内Key有序的文件
* 合并的一般逻辑：多路归并（归并算法的归并）

**Map端过程**

* Map任务的输出首先会写入环形内存缓冲区，大小为`mapreduce.task.io.sort.mb`（默认100），一旦缓冲区内容达到阈值（`mapreduce.map.sort.spill.percent` 默认值为0.8），将启动后台线程将内存缓冲区内容写入磁盘。写入目录为`mapreduce.cluster.local.dir`下的作业目录（默认为 `${hadoop.tmp.dir}/mapred/local`），写入的文件称为溢出文件
* 在后台写入溢出文件过程中，需要进行分区（确定传递给那个reduce任务），每个分区进行排序，如果存在combiner，则进行预规约。最终形成的溢出文件则是：分区的，每个分区中，key有序的文件
* 当Map任务结束后，将会将溢出文件进行合并成一个大的输出文件（如果溢出文件数目大于`mapreduce.map.combine.minspills`， 默认值为3，将会进行一次combiner），这个输出文件和溢出文件结构一致。还可以可选的进行压缩（通过mapreduce.map.out.compress 默认为false，mapreduce.map.out.compress.codec指定压缩算法）。
* 至此Map任务彻底完成，reducer将通过HTTP（Map任务启动一个HTTP Server，工作线程数为`mapreduce.shuffle.max.threads` 默认值为0，表示机器核心数的2倍，注意该配置是针对NodeManager配置的，而不是每个作业配置）获取到输出文件的分区。
* 同时，Map任务完成后，也会通知Application Master，以便Reducer能够及时来拉取数据。
* Map端输出的文件不会再Reducer拉取后就立即删除，因为Reduce可能失败，直到任务彻底完成，才会删除任务

**Reduce端过程**

* 复制阶段：Reduce会启动`mapreduce.reduce.shuffle.parallelcopise`默认为5个复制进程进程
	* 如果Map端输出非常小（`mapreduce.reduce.shuffle.input.buffer.percent` 指定缓存占堆内存的比例）将复制到JVM内存中，否者map的输出将复制到磁盘
	* 当内存缓冲区内容达到一定阈值，则进行合并、执行combiner写入磁盘（如果有压缩要解压缩）。阈值配置如下
		* 配置内存比例： 前面提到reduce JVM堆内存的一部分用于存放来自map任务的输入，在这基础之上配置一个开始合并数据的比例。假设用于存放map输出的内存为500M，mapreduce.reduce.shuffle.merger.percent配置为0.80，则当内存中的数据达到400M的时候，会触发合并写入。
		* 配置map输出数量： 通过mapreduce.reduce.merge.inmem.threshold配置。
* 排序阶段（合并）：对多个文件进行多路归并（归并的由`mapreduce.task.io.sort.factor`设定默认为10），最后得到的文件数目最多就是  `mapreduce.task.io.sort.factor`，最后直接在合并过程中进行reduce就可以了

**相关调优参数**

参见《Hadoop权威指南》P199

#### （4）任务执行

**任务执行环境**

Mapper和Reducer可以通过`context.getConfiguration()`获取配置信息

* mapreduce.job.id 作业ID
* mapreduce.task.id 任务ID
* mapreduce.task.attemp.id 作业ID
* mapreduce.task.partition 作业中的索引
* mapreduce.task.ismap 是否是map作业

在stream可以通过环境变量信息获取，比如Python：`os.environ["mapreduce_job_id"]`

**推测执行**

参见《Hadoop权威指南》P203

**关于OutputCommitters**

* 用于设置任务初始化（创建输出目录、临时目录）
* 作业完成后进行作业清理
* 其他参见《Hadoop权威指南》P204

### 9、Configuration

#### （1）介绍

Hadoop 所有配置 通过 Configuration 类来实现。Configuration可以理解为一个Map，key为配置项，value为值。可以通过配置文件（XML）和编程方式配置或者环境变量或者命令行参数

* XML中支持使用${属性名}插值
* 若果存在多个配置文件后面加入的属性会覆盖前面的属性，final为true的除外

Hadoop 启动过程中，将使用addResource将conf目录下的所有文件读取进入conf中
配置文件的位置可以通过 HADOOP_CONF_DIR 环境变量配置
配置属性一般分为两类：

* 集群属性，只能通过配置文件改变
* 任务属性，可以通过提交的程序修改

#### （2）ToolRunner

ToolRunner，将会将使用一个命令行参数解析器（GenericOptionsParser），
将Hadoop的相关配置配置到Tool的conf中（Tool接口继承了Configurable接口）
支持如下Hadoop参数赋值方式：

* `-D p=v` 配置单个属性
* `-conf filename ...` XML配置文件
* `-fs uri`  等价于 `-D fs.default.FS=uri`

其他参见 Hadoop 权威指南 152 页

### 10、MR单元测试

依赖

```xml
    <!-- 单元测试最小化运行环境 -->
    <dependency>
      <groupId>org.apache.hadoop</groupId>
      <artifactId>hadoop-minicluster</artifactId>
      <version>${hadoop.version}</version>
      <scope>test</scope>
    </dependency>

    <!-- 单元测试 -->
    <dependency>
      <groupId>junit</groupId>
      <artifactId>junit</artifactId>
      <version>4.12</version>
      <scope>test</scope>
    </dependency>

    <!-- Hadoop2单元测试 -->
    <dependency>
      <groupId>org.apache.mrunit</groupId>
      <artifactId>mrunit</artifactId>
      <version>1.1.0</version>
      <classifier>hadoop2</classifier>
      <scope>test</scope>
    </dependency>
```

Mapper测试

```java
    new MapDriver<LongWritable, Text, Text, IntWritable>()
      .withMapper(new MaxTemperatureMapper())
      .withInput(new LongWritable(0), value)
      .withOutput(new Text("1950"), new IntWritable(-11))
      .runTest();
```

reduce测试

```java
    new ReduceDriver<Text, IntWritable, Text, IntWritable>()
      .withReducer(new MaxTemperatureReducer())
      .withInput(new Text("1950"),
          Arrays.asList(new IntWritable(10), new IntWritable(5)))
      .withOutput(new Text("1950"), new IntWritable(10))
      .runTest();
```

驱动程序测试

```java
  public static class OutputLogFilter implements PathFilter {
    public boolean accept(Path path) {
      return !path.getName().startsWith("_");
    }
  }
  
//vv MaxTemperatureDriverTestV2
  @Test
  public void test() throws Exception {
    Configuration conf = new Configuration();
    conf.set("fs.defaultFS", "file:///");
    conf.set("mapreduce.framework.name", "local");
    conf.setInt("mapreduce.task.io.sort.mb", 1);

    Path input = new Path("input/ncdc/micro");
    Path output = new Path("output");

    FileSystem fs = FileSystem.getLocal(conf);
    fs.delete(output, true); // delete old output

    MaxTemperatureDriver driver = new MaxTemperatureDriver();
    driver.setConf(conf);

    int exitCode = driver.run(new String[] {
        input.toString(), output.toString() });
    assertThat(exitCode, is(0));

    checkOutput(conf, output);
  }
//^^ MaxTemperatureDriverTestV2

  private void checkOutput(Configuration conf, Path output) throws IOException {
    FileSystem fs = FileSystem.getLocal(conf);
    Path[] outputFiles = FileUtil.stat2Paths(
        fs.listStatus(output, new OutputLogFilter()));
    assertThat(outputFiles.length, is(1));

    BufferedReader actual = asBufferedReader(fs.open(outputFiles[0]));
    BufferedReader expected = asBufferedReader(
        getClass().getResourceAsStream("/expected.txt"));
    String expectedLine;
    while ((expectedLine = expected.readLine()) != null) {
      assertThat(actual.readLine(), is(expectedLine));
    }
    assertThat(actual.readLine(), nullValue());
    actual.close();
    expected.close();
  }
  
  private BufferedReader asBufferedReader(InputStream in) throws IOException {
    return new BufferedReader(new InputStreamReader(in));
  }
```

### 11、Hadoop MR日志

聚合服务（将日志文件写入HDFS、默认关闭）：
yarn.log-aggregation-enable=true， 这样Logs链接将可以查看输出日志
默认情况下存放在 HADOOP_LOG_DIR （默认在$HADOOP_HOME/logs）
根目录下为 集群日志
userlogs为任务、应用日志

配置日志输出级别： hadoop -D mapreduce.map.log.level=DEBUG
配置日志输出到命令行：export HADOOP_ROOT_LOGGER=DEBUG,console

#### （1）在程序中输出Log

```java
public class MaxTemperatureMapper
  extends Mapper<LongWritable, Text, Text, IntWritable> {
  
  enum Temperature {
    MALFORMED,
    TESTCOUNT
  }

  private NcdcRecordParser parser = new NcdcRecordParser();

  private boolean outed = false;

  private static final Log log = LogFactory.getLog(MaxTemperatureMapper.class);
  
  @Override
  public void map(LongWritable key, Text value, Context context)
      throws IOException, InterruptedException {

    parser.parse(value);
    if (parser.isValidTemperature()) {
      int airTemperature = parser.getAirTemperature();
      context.write(new Text(parser.getYear()), new IntWritable(airTemperature));

      if (!outed) {
        // 以下为日志输出测试
        context.getCounter(Temperature.TESTCOUNT).increment(1);
        System.out.println("这是标准输出"); // 输出到 userlogs 的 stdout 文件
        System.err.println("这是标准出错"); // 输出到 userlogs 的 stderr 文件
        context.setStatus("这是context.setStatus"); // 展示在web页面
        log.info("这个是Apache Log输出"); // 输出到 userlogs 的 syslog 文件
      }
    } else if (parser.isMalformedTemperature()) {
      System.err.println("Ignoring possibly corrupt input: " + value);
      // 处理不合理的数据
      context.getCounter(Temperature.MALFORMED).increment(1);
    }
  }
}
```

#### （2）启用和查看分析日志

```bash
hadoop jar target/experiment.jar cn.rectcircle.hadooplearn.mrunit.MaxTemperatureDriver -conf src/main/resources/conf/hadoop-localhost.xml -D mapreduce.task.profile=true input/ncdc/all max-temp
hadoop fs -conf src/main/resources/conf/hadoop-localhost.xml  -rm -r max-temp
```

`-D mapreduce.task.profile=true`

输出文件和stdout在同一目录

### 12、MR的类型与格式

#### （1）MapReduce的类型

不包含Combiner

```
map: (K1, V1) -> list(K2, V2)
reduce: (K2, list(V2)) -> list(K3, V3)
```

包含Combiner

```
map: (K1, V1) -> list(K2, V2)
combiner: (K2, list(V2)) -> list(K2, V2)
reduce: (K2, list(V2)) -> list(K3, V3)
```

* 可以看出如果K2==K3 && V2==V3 则Reduce与Combiner相同

**MR的默认配置**

* 默认使用TextInputFormat
	* 输入K为LongWritable：表示行偏移量
	* 输入V为Text：每一行的文本
* 默认分区为HashPartitioner
* setNumReduceTasks=1
* 用默认的MR，逻辑就是直接输出输入
* 默认使用TextOutputFormat：`K\tV`

**对于stream模式**

* 当指定`-io text` 键将不会传递给map程序
* 其他的和Java一致
* 默认使用制表符进行分割，设置参见：《Hadoop权威指南》P217

#### （2）输入格式

* 一个输入分片由一个map任务处理，定义输入分片通过`InputSplit`类，该类实例由InputFormat获取。
* InputFormat包含连个方法：
	* getInputSplit(context) 获取分割定义
	* createRecordReader(inputSplit, context) 根据context获取个任务需要的分片数据的迭代器
* Map的执行入口为run
	* 调用setup设置环境
	* 循环调用map
	* 调用cleanup清理环境
* 注意为了效率传入MR的参数都是同一个对象（理论上应该是不可便对象）

**FileInputFormat**

（抽象） 是众多类基类，针对文件型数据源

* 提供通用辅助函数：指出作业输入文件的位置、生成分片的实现
* 提供一系列静态方法来设置job
	* addInputPath
	* addInputPaths
	* setInputPath
	* setInputPaths
* 子类需要实现：将分片分割成记录
* 默认情况下，只会将大文件进行分片，每个小文件就是一片，生成分片的大小一般与HDFS块大小一致
	* 分片大小计算方法：`max(minmumSize, min(maxmumSize, blockSize))`
* 针对小文件考虑使用`CombineFileInputFormat` ，可以将小文件打包成大文件。更好的做法是将大量小文件打包成顺序文件（因为HDFS不适合存放小文件）
* 避免切分的做法：
	* 不优雅：增大分片文件的大小
	* 优雅：创建FileInputFormat的子类将isSplitable返回false
* 获取文件信息
	* `content.getInputSplit`
* 将整个文件当做一个记录处理，实现一个FileInputFormat的子类
	* isSplitable返回false
	* 返回一个自定义的RecordReader
	* 参见 《Hadoop权威指南》 P226

**常用的InputFormat**

* TextInputFormat
	* 默认的`TextInputFormat`， 一行一条记录，K为文件偏移量，V一行的内容
	* 对于跨分片行会进行处理，原理是：
		* 直接向HDFS文件中读，
		* 如果最后一行跨分片，则读完即可，
		* 如果最后一行正好在本分片内，再多读一行
		* 每个分片的第一行不读直接忽略（起始分片除外）
		* 通过`mapreduce.input.linerecordreader.line.maxlength`这是每行最大字节数，防止内存泄漏
* KeyValueTextInputFormat
	* 按照分隔符将每一行当做一个键值对
* NlineInputFormat
	* 按照行号进行分片，即每个Map收到N行数据，N通过`mapreduce.input.lineinputformat.linespermap`设定
	* KV和TextInputFormat一致

**二进制输入**

* `SequenceFileInputFormat` 按照同步点进行分片
	* 输入Map的KV为SequenceFileInputFormat的KV格式
* `SequenceFileAsTextInputFormat`：键值类型为Text
* `SequenceFileAsBinaryInputFormat`：键值类型转换为二进制对象
* `FixedLengthInputFormat`：按照固定宽度读二进制对象，通过`fixedlengthinputformat.record.length`

**多输入源**

* 针对不同的输入源做不同的处理
* `MultipleInputs.addInputPath`

**数据库输入**

可以使用DBInputFormat，但是需要注意数据库负载。推荐使用Sqoop。

HBase输入使用TableInputFormat

#### （3）输出格式

**文本输出**

* `TextOutputFormat` 每个键值对输出一行，以分隔符分割默认`\t`

**二进制输出**

* `SequenceFileOutputFormat`
* `SequenceFileAsBinaryOutputFormat` 将KV的原始二进制值写入顺序文件
* `MapFileOutputFormat` 要保证K有序

**多个输出**

默认情况下每个reduce任务对应一个文件。现在考虑每个reduce输出的文件名是有意义的，做法一如下：自定义分区器，但是这样做有如下问题：

* 分区需要一个列表，不利于扩展性
* 数据可能倾斜

做法二：使用MultipleOutput

* 使用MultipleOutput实例在reduce中写入，而不是用context，做法如下

```java
    @Override
    protected void setup(Context context)
        throws IOException, InterruptedException {
      // 构造一个多输出源输出器
      multipleOutputs = new MultipleOutputs<NullWritable, Text>(context);
    }

// vv PartitionByStationYearUsingMultipleOutputs
    @Override
    protected void reduce(Text key, Iterable<Text> values, Context context)
        throws IOException, InterruptedException {
      for (Text value : values) {
        parser.parse(value);
        String basePath = String.format("%s/%s/part",
            parser.getStationId(), parser.getYear());
        multipleOutputs.write(NullWritable.get(), value, basePath);
      }
    }
```

**延迟输出**

* LazyOutputFormat

**写入到数据库**

可以使用DBOutputFormat，但是需要注意数据库负载。推荐使用Sqoop。

HBase输出使用TableOutputFormat

### 13、其他特性

***

#### （1）计数器

在MR的web页面可以查看到所有任务和作业的计数器和计数器值。
或者通过`hadoop job -counter`命令查看

**内置计数器**

分为如下几类

* File System 计数器
* Map-Reduce Framework 计数器

详细参见 《Hadoop权威指南》P244

**自定义计数器**

```java
// 通过枚举
context.getCounter(枚举类型).increment(1);
// 动态添加
content.getCounter(groupName, counterName)
```

**streaming计数器**

```python
sys.stderr.write('reporter:counter:group,counter,amount')
```

#### （2）排序

利用HadoopKey全局有序性排序

比较器设置方式：

* conf.setSortComparatorClass(RawComparator)
* 序列化类型实现WritableComparable

**部分排序**

* 使用默认的分区器（Hash）即可达到部分排序（每个输出文件都是有序的）

**全局排序**

* 方案1：自定义一个分区器，该分区器通过待排序字段的范围进行分区，
* 方案2：
	* 设置使用`TotalOrderPartitioner`进行分区
	* 使用InputSampler进行抽样实验，确定均匀的分区，并将其写入分布式缓存中
		* InputSampler将在Hadoop客户端进行采样

**辅助排序**

需要按照某个值进行升序排序，若相等，使用另一个值进行降序排列

* 定义自然键和自然值的组合键（组合键为Map的输出K的类型）
* 根据组合键进行排序（job.setSortComparatorClass）
* 分组和分区只考虑自然键（job.setGroupingComparatorClass, job.setPartitionerClass）

说明

* setGroupingComparatorClass 表示如何设置：`MapOutput: <K2, V2> -> ReduceInput: <K2, List<V2>>`，也就是说将Shuffle结束后，通过这个比较器对K2进行分组。
* setSortComparatorClass 表示在Shuffle过程中，如何进行排序
* setPartitionerClass 表示Shuffle过程中，如何如何分组，应该传送到Reduce端

streaming也支持此方式 参见 《Hadoop权威指南》 P263

#### （3）连接操作

**map端连接**

方式1：小表先Load到内存中（map的setup函数），然后map输出
方式2：使用`org.apache.hadoop.mapreduce.joib`包，参见`org.apache.examples.Join`，前提条件如下：

* 两个数据源必须有序（按照连接键进行排序）
* 且两个数据源分区必须相同

**reduce端连接**

适用于任意两个数据源

普通做法：

* map端按将连接键作为输出Key，Value中标记数据源
* reduce进行两次循环进行联合输出

优化做法：

* Map输入设置多数据源，Map的输出Key分为两个部分
	* 第一个部分为连接键，第二个部分为数据源标记
	* 分区、分组按照连接键进行
	* 排序按照组合键进行
* Reduce端，一次循环即可组合完成（针对一对多连接）

#### （4）边数据分布

边数据指MR作业额外需要只读数据。

* 针对少量元数据：可以使用Configuration接口当做Hadoop配置传递
* 大量数据考虑使用分布式缓存，在使用Tool工具的情况下
	* 指定边界文件
		* 使用`-files`指定额外的文件`uri`，文件可以是任意Hadoop文件系统可访问的协议，使用`,`分割
		* 使用`-archives`执行压缩包，这将会解压到任务节点
		* 使用`-libjars`可以将jar文件添加到mr任务的classpath中
	* 使用边界文件直接在setup中，使用`new java.io.File(文件名)`即可
	* 在程序中可以使用
		* `job.addCacheFile(url)`
		* `job.addCacheArchive(url)`
		* `job.setCacheFiles(url[])`
		* `job.setCacheArchives(url[])`
		* `job.addFileToClassPath(Path)`
		* `job.addArchiveToClassPath(url)`
		* `job.createSymlink()`

#### （5）MapReduce类库

略

## 六、集群管理

***

### 1、集群安全性

Hadoop不带有用户认证服务

#### （1）Kerberos和Hadoop

Kerberos是一个成熟的开源网络认证协议。Hadoop支持与Kerberos集成。Kerberos负责认证用户，Hadoop负责管理用户权限

配置：

* 修改coresite.xml
	* 修改 `hadoop.security.authentication` 设置为kerberos（默认为simaple）
	* 修改 `hadoop.security.authorization` 设置为true
* 可以配置`hadoop-policy`确定哪些用户组能访问哪些hadoop服务
* 测试
	* 直接执行hadoop命令将被拒绝`hadoop fs -put xxx`
	* 使用kinit进行认证获取票据`kinit`，在执行命令`hadoop fs -put xxx`

#### （2）基准测试

略

### 2、HDFS管理

#### （1）namenode目录结构

```
${dfs.namenode.name.dir}
├── current
│   ├── VERSION
│   ├── edits_0000000000000000001-0000000000000000605
│   ├── edits_inprogress_0000000000000000606
│   ├── fsimage_0000000000000000000
│   ├── fsimage_0000000000000000000.md5
│   ├── fsimage_0000000000000000605
│   ├── fsimage_0000000000000000605.md5
│   └── seen_txid
└── in_use.lock
```

VERSION

```
#Thu Apr 25 14:10:38 CST 2019
namespaceID=1023481244
clusterID=CID-fc80b546-6bc0-4dcb-a1d3-e90630474f7a
cTime=0
storageType=NAME_NODE
blockpoolID=BP-1620887065-127.0.0.1-1556172638824
layoutVersion=-60
```

* VERSION文件是一个Java属性文件，包含正在运行的HDFS的版本信息
	* layoutVersion是一个负整数，描述HDFS持久化数据结构的版本号，布局变更，版本递减
	* namespaceID是文件系统的唯一标识，在首次格式化时创建，对于联邦HDFS很重要
	* blockpoolID是数据块池的唯一标识符
	* cTime 创建时属性值为0，更新后为更新时间
	* storageType表示该存储目录包含的是namenode的数据结构
* in_use.lock 是个锁文件
* `edits_*` 为编辑日志文件
	* 文件系统所有写操作首先写入编辑日志，然后更新内存中的元数据
	* 编辑日志在本地磁盘中对应多个文件，每个文件称为编辑日志的一个段，名称由edits及后缀组成，后缀表示编辑日志该段的事务ID范围。
	* `edits_inprogress_000xxx` 表示处于打开可写状态的事务日志
* `fsimage_*` 文件系统元数据的完整的永久检查点，后缀为事务ID，表示到该事务的文件系统元数据状态
	* 容量可能很大几个G
	* 实际上就是namenode的关于元数据的内存镜像（不包含元数据）
	* 由inode（对目录和文件的描述）组成
		* 对文件：复制级别、修改时间、访问时间、访问权限、块大小、块组成
		* 对目录：修改时间、访问许可、配额元数据
		* 不储存块与datanode映射，映射会在启动过程中，自动建立
	* 检查点一般由辅助namenode创建，过程如下：
		* 辅助namenode请求主namenode停止使用当前正在进行中的edits文件，这样新的编辑操作记录到一个新文件中。主namenode还会更新更新所有存储目录中的seen_txid文件
		* 辅助namenode会从主namenode获取最新的fsimage和edits文件（HTTP GET）
		* 辅助namenode会将fsimage文件载入内存，逐行执行edits文件中的事务，创建新的合并后的fsimage
		* 辅助namenode将新的fsimage发回主namenode（HTTP PUT），主namenode将其保存为临时的.ckpt
		* 主namenode重新命名临时的fsimage文件，便于日后使用
		* 辅助namenode，创建检查点触发条件
			* `dfs.namenode.checkpoint.period`  单位秒，间隔时间默认1小时
			* `dfs.namenode.checkpoint.txns`  事务数，默认100万个事务，检查频率`dfs.namenode.checkpoint.checkperiod`默认为1分钟单位秒
	* name处于安全模式下可以通过`hdfs dfsadmin -saveNamespace`创建检查点

#### （2）辅助namenode的结构

和主namenode结构相同目录`dfs.namenode.checkout.dir`，这样可以在主namenode挂掉后，重新启动

* 方法一：将辅助namenode复制到新的主namenode中
* 方法二：在辅助namenode节点使用`-importCheckout`启用namenode

#### （3）datanode目录结构

```
${dfs.datanode.data.dir}
├── current
│   ├── BP-1620887065-127.0.0.1-1556172638824
│   │   ├── current
│   │   │   ├── VERSION
│   │   │   ├── finalized
│   │   │   │   └── subdir0
│   │   │   │       └── subdir0
│   │   │   │           ├── blk_1073741825
│   │   │   │           ├── blk_1073741825_1001.meta
│   │   │   │           ├── blk_1073741826
│   │   │   │           ├── blk_1073741826_1002.meta
......
│   │   │   └── rbw
│   │   ├── dncp_block_verification.log.curr
│   │   ├── dncp_block_verification.log.prev
│   │   └── tmp
│   └── VERSION
└── in_use.lock
```

* HDFS存储的数据块存储在以`blk_`为前缀的文件中，文件名还包含了该文件的原始字节数，其中以`.meta`结尾的文件为元数据

#### （3）安全模式

* namenode启动中，到namenode创建一个fsimage文件和一个空编辑日志为止，namenode处于安全模式，此模式文件系统只读
* 数据块的位置不由namenode维护，在安全模式下，datanode会向namenode报告块列表信息
* 相关命令
	* hdfs dfsadmin -safemode get # 查看是否处于安全模式
	* hdfs dfsadmin -safemode wait  # 等待安全模式退出
	* hdfs dfsadmin -safemode enter  # 进入安全模式
	* hdfs dfsadmin -safemode leave  # 离开安全模式

#### （4）日志审计

默认关闭，通过环境变量`HDFS_AUDIT_LOGGER="INFO,RFAAUDIT"`，日志文件在`hdfs-audit.log`

#### （5）相关命令行工具

dfsadmin以`hdfs dfsadmin`方式使用，常用命令：

* `-help` 帮助
* `-report` 显示文件系统信息
* `-metasave` 将某些信息存储在Hadoop日志目录的一个文件中，包括正在被复制或删除的信息以及已连接的datanode列表
* `-savemode` 安全模式相关
* `-saveNamespace` 安全模式可用，将当前文件系统状态保存为fsimage
* `-fetchImage` 从namenode获取最新的fsimage并保存为本地文件
* `-refreshNodes` 更新允许连接到namenode的datanode列表
* `-upgradeProgress` 获取HDFS升级进度或强制升级
* `-finalizeUpgrade`  移除datanode和namenode旧版本数据。在文件系统升级完成后执行
* `-setQuota` 设置目录配额，防止用户创建大量小文件
* `-clrQuota` 取消目录配额
* `-setSpaceQuota` 设置整个目录空间配额
* `-clrSpaceQuota` 清理指定的空间配额
* `-refreshServiceAcl` 刷新namenode的服务级授权策略文件
* `-allowSnapchat` 允许为指定目录创建快照
* `-disallowSnapchat` 禁止为指定目录创建快照

fsck工具，用于检查HDFS中文件健康状态

* 查看一个目录下文件的数据块情况 `hdfs fsck /`
* 查看某个文件的数据块情况 `hdfs fsck /user/xxx/xxx -files -blocks -racks`

块扫描器检查周期为`dfs.datanode.scan.period.hours` 默认为504小时

均衡器：

* 通过`start-balancer.sh` 启动

### 3、监控

设置日志级别

* http://localhost:8088/logLevel
* `hadoop daemonlog -setlevel localhost:8088 日志名 级别`
* 永久修改：log4j.properties文件中添加记录

堆栈跟踪：可通过`http://localhost:8088/stacks`

量度：http://localhost:50070/jmx

### 4、维护

#### （1）日常管理过程

**元数据备份**

```bash
hdfs dfsadmin -fetchImage fsimage.backup
```

**数据备份**

使用 `distcp` 工具

支持文件快照

**文件系统检查**

定期使用 `fsck` 进行文件系统检查

**文件系统均衡器**

通过`start-balancer.sh` 启动

#### （2）委任和解除节点

**新增节点**

默认情况下，新的节点需要加入现有集群，只需要配置namenode和resourcemanage，使用 `$HADOOP_HOME/bin/hadoop-daemon.sh start datanode` 、 `$HADOOP_HOME/bin/hadoop-daemon.sh start tasktracker` 和 `yarn-daemon.sh  start nodemanager`。

最后，在namenode节点

* `hdfs dfsadmin -refreshNodes`
* `yarn rmadmin -refreshNodes`
* `start-balancer.sh -threshold 5` 平衡节点

这样存在安全问题，可能存在未授权的Hadoop节点加入集群。

通过配置 `dfs.hosts` 指定一个 datanode 的白名单，新加入的节点必须在此文件内才允许被加入集群。namenode会读取该配置。

同样同个配置 `yarn.resourcemanager.nodes.include-path` 指定 nodemanager 的白名单，通常两者配置相同。

可以理解如果两者都不配置，相当于所有主机都允许加入集群（相当于 `*`）

> `slaves` 和 `dfs.hosts`、`yarn.resourcemanager.nodes.include-path` 的区别，`slaves`只对启动脚本有效，Hadoop守护进程永远不会读取其配置。而后者在hadoop守护进程有效

此时的新增节点的步骤如下：

* 将网络地址加入到 `include` 文件中
* 使用 `hdfs dfsadmin -refreshNodes` 将审核后的datanode更新到namenode
* 使用 `yarn rmadmin -refreshNodes` 将审核后的nodemanager接入resourcemanager
* 将节点加入到 `slaves` 文件，在未来的集群管理中使用
* 启动新的节点的datanode和nodemanager进程
  * `$HADOOP_HOME/bin/hadoop-daemon.sh start datanode`
  * `$HADOOP_HOME/bin/hadoop-daemon.sh start tasktracker`
  * `yarn-daemon.sh  start nodemanager`
* 访问Web页面查看是添加成功
* 最后在合适的时候平衡集群

**解除旧节点**

优雅的解除节点必须使用exclude文件。分别通过 `dfs.hosts.exclude` 和 `yarn.resourcemanager.nodes.exclude-path` 配置，通常指向同一文件。

节点出现在include和exclude文件组合情况的说明

| 节点是否出现在include文件 | 节点是否出现在exclude文件 | 解释                  |
|--------------------------|--------------------------|---------------------|
| 否                        | 否                        | 节点无法连接          |
| 否                        | 是                        | 节点无法连接          |
| 是                        | 否                        | 节点可以连接          |
| 是                        | 是                        | 节点可以连接，将被解除 |

从集群中解除节点的步骤如下：

* 将要解除的节点的网络地址添加到exclude文件中，不更新include文件
* 执行 `hdfs dfsadmin -refreshNodes` 更新授权的node列表
* 使用 `yarn rmadmin -refreshNodes` 更新授权的node列表
* 访问Web页面，查看状态是否是“正在解除”（Decommission In Progress），并等待状态变为“解除完毕”（Decommissioned）
* 从include文件中移除节点，并运行
  * `hdfs dfsadmin -refreshNodes`
  * `yarn rmadmin -refreshNodes`
* 从slaves中移除节点

#### （3）升级

需要做好规划，对数据和元数据进行备份，考虑兼容性。

如果HDFS文件系统布局没有发生变化，升级非常容易且可撤销升级：

* 安装新版本的Hadoop客户端和守护进程
* 关闭旧的守护进程
* 升级配置文件
* 启动新的守护进程
* 客户端使用新的库
* 升级后执行两步清理步骤
  * 从集群中移除旧的安装和配置文件
  * 在代码和配置文件中针对被被启用API进行修复

如果HDFS文件系统布局发生变化，执行上述升级过程，namenode将无法启动，此时升级步骤如下，且不可撤销升级：

* 在执行任务之前，确保前一升级已经定妥（前一次升级的历史文件已经删除，不可回退）
* 关闭YARN和MapReduce守护进程
* 关闭HDFS，并备份namenode目录
* 在集群和客户端安装新版本的Hadoop
* 使用 -upgrade 选项来启动HDFS
	* `$NEW_HADOOP_HOME/sbin/start-dfs.sh -upgrade`
	* `$NEW_HADOOP_HOME/bin/hdfs dfsadmin -upgradeProgress status` 查看升级状态
* 等待升级完成
* 检查HDFS是否运行正常
* 启动YARN和MapReduce守护进程
* 回滚或定妥升级任务
	* 回滚：
		* `$NEW_HADOOP_HOME/sbin/stop-dfs.sh`
		* `$OLD_HADOOP_HOME/sbin/start-dfs.sh rollback`
	* 定妥：
		* `$NEW_HADOOP_HOME/bin/hdfs dfsadmin -finalizeUpgrade`
		* `$NEW_HADOOP_HOME/bin/hdfs dfsadmin -upgradeProgress status`
