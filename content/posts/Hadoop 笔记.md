---
title: Hadoop 笔记
date: 2017-04-05T23:04:33+08:00
draft: false
toc: true
comments: true
aliases:
  - /detail/56
  - /detail/56/
tags:
  - 大数据
---

> http://hadoop.apache.org/docs/r2.6.5/
> 《Hadoop权威指南》
> [配置列表](http://hadoop.apache.org/docs/current/hadoop-mapreduce-client/hadoop-mapreduce-client-core/mapred-default.xml)

## 〇、安装配置

***

> http://www.powerxing.com/install-hadoop/
> http://hadoop.apache.org/docs/r2.6.5/hadoop-project-dist/hadoop-common/SingleCluster.html

### 0、必须操作

#### （1）安装所需软件

* `ssh`
* `rsync`
* `jdk`并配置环境变量JAVA_HOME

#### （2）添加用户

```bash
useradd -m hadoop -s /bin/bash
passwd hadoop
visudo #添加到sudo组
#配置ssh登录限制（安全）、将hadoop限制为仅限localhost登录
#配置免密可能无法登录
# vi /etc/ssh/sshd_config
# service sshd restart

#配置免密登录（通过秘钥）
cd ~/.ssh/                     # 若没有该目录，请先执行一次ssh localhost
ssh-keygen -t rsa              # 会有提示，都按回车就可以
cat ./id_rsa.pub >> ./authorized_keys  # 加入授权
chmod 600 authorized_keys id_rsa

# 修改SSH客户端配置
sudo vim /etc/ssh/ssh_config
# 修改连接配置
# GSSAPIAuthentication yes
# StrictHostKeyChecking no

# 修改SSH服务器配置
sudo vim /etc/ssh/sshd_config
# UseDNS no
sudo systemctl restart sshd
```

#### （3）下载安装

```bash
# 安装Java

cd ~
mkdir java
cd java
# 下载
wget --no-cookies --header "Cookie: oraclelicense=accept-securebackup-cookie;" https://download.oracle.com/otn-pub/java/jdk/8u201-b09/42970487e3af4f5aa5bca3f542482c60/jdk-8u201-linux-x64.tar.gz
# 解压
tar -xzvf jdk-8u201-linux-x64.tar.gz
# 创建软链接
ln -s jdk1.8.0_201 default
# 编辑环境变量
vim ~/.bashrc
## Java
#export JAVA_HOME=/home/bigdata/java/default
#export CLASSPATH=".:$JAVA_HOME/lib:$JAVA_HOME/lib/tools.jar:$CLASSPATH"
#export PATH="$JAVA_HOME/bin:$PATH"

# 立即生效环境变量
source ~/.bashrc
# 查看安装是否成功
java -version

# 安装Hadoop
cd ~
mkdir hadoop
cd hadoop
wget http://mirror.bit.edu.cn/apache/hadoop/common/hadoop-2.6.5/hadoop-2.6.5.tar.gz
tar -xzvf hadoop-2.6.5.tar.gz
ln -s hadoop-2.6.5 default
vim ~/.bashrc
# 添加如下环境变量
## Hadoop
#export HADOOP_HOME=/home/bigdata/hadoop/default
#export HADOOP_COMMON_LIB_NATIVE_DIR=$HADOOP_HOME/lib/native
#export PATH="$HADOOP_HOME/bin:$PATH"
#export HADOOP_OPTS="-Djava.library.path=$HADOOP_HOME/lib:$HADOOP_COMMON_LIB_NATIVE_DIR"
source ~/.bashrc
hadoop
```

### 1、单机模式安装

> 以下使用hadoop用户操作

#### （1）测试程序

```bash
mkdir input
cp etc/hadoop/*.xml input
hadoop jar share/hadoop/mapreduce/hadoop-mapreduce-examples-2.8.0.jar grep input output 'dfs[a-z.]+'
cat output/*
#输出结果为1	dfsadmin表示成功
```

### 2、伪分布式操作

> 以下使用hadoop用户操作

Hadoop也可以以伪分布式模式运行在单节点上，其中每个Hadoop守护程序都在单独的Java进程中运行。

#### （1）修改配置文件

核心配置

```bash
# cd hadoop目录
cd $HADOOP_HOME

vim etc/hadoop/core-site.xml
#添加如下
<?xml-stylesheet type="text/xsl" href="configuration.xsl"?>
<configuration>
  <property>
    <name>fs.defaultFS</name>
    <value>hdfs://localhost/</value> <!-- 默认端口为8200 -->
  </property>

  <!-- mac或Window设置（没有手动编译Hadoop本地库情况下）-->
  <property>
    <name>io.native.lib.available</name>
    <value>false</value>
  </property>

  <!-- 使用 HADOOP_CONF_DIR 环境变量指定配置文件目录 -->
</configuration>
```

HDFS配置

```bash
vim etc/hadoop/hdfs-site.xml
#添加如下
<?xml version="1.0"?>
<?xml-stylesheet type="text/xsl" href="configuration.xsl"?>
<configuration>
  <property>
    <name>dfs.replication</name>
    <value>1</value>
  </property>
  <!-- 默认的Hadoop存储目录为/tmp/hadoop-${user.name} -->
  <!-- <property>
    <name>dfs.namenode.name.dir</name>
    <value>file:/usr/local/hadoop/tmp/dfs/name</value>
  </property><property>
    <name>dfs.datanode.data.dir</name>
    <value>file:/usr/local/hadoop/tmp/dfs/data</value>
  </property> -->
</configuration>
```

#### （2）执行 NameNode 的格式化

```bash
./bin/hdfs namenode -format
```

#### （3）开启 NameNode 和 DataNode 守护进程

```bash
./sbin/start-dfs.sh
```

#### （4）查看是否启动成功

```bash
jps
```

#### （5）重新部署

针对 DataNode 没法启动的解决方法

```bash
./sbin/stop-dfs.sh   # 关闭
rm -r ./tmp     # 删除 tmp 文件，注意这会删除 HDFS 中原有的所有数据
./bin/hdfs namenode -format   # 重新格式化 NameNode
./sbin/start-dfs.sh  # 重启
```

#### （6）hdfs 操作示例

```bash
#上面的单机模式，grep 例子读取的是本地数据，伪分布式读取的则是 HDFS 上的数据。要使用 HDFS，首先需要在 HDFS 中创建用户目录：
./bin/hdfs dfs -mkdir -p /user/hadoop

#接着将 ./etc/hadoop 中的 xml 文件作为输入文件复制到分布式文件系统中，即将 /usr/local/hadoop/etc/hadoop 复制到分布式文件系统中的 /user/hadoop/input 中。我们使用的是 hadoop 用户，并且已创建相应的用户目录 /user/hadoop ，因此在命令中就可以使用相对路径如 input，其对应的绝对路径就是 /user/hadoop/input:
./bin/hdfs dfs -mkdir input
./bin/hdfs dfs -put ./etc/hadoop/*.xml input

#查看文件列表
./bin/hdfs dfs -ls input
```

#### （7）运行任务

> 伪分布式运行 MapReduce 作业的方式跟单机模式相同，区别在于伪分布式读取的是HDFS中的文件（可以将单机步骤中创建的本地 input 文件夹，输出结果 output 文件夹都删掉来验证这一点）。

```bash
#运行
./bin/hadoop jar ./share/hadoop/mapreduce/hadoop-mapreduce-examples-*.jar grep input output 'dfs[a-z.]+'
#查看运行结果
./bin/hdfs dfs -cat output/*
#取回本地
rm -r ./output    # 先删除本地的 output 文件夹（如果存在）
./bin/hdfs dfs -get output ./output     # 将 HDFS 上的 output 文件夹拷贝到本机
cat ./output/*
```

注意输出目录不能存在

```bash
./bin/hdfs dfs -rm -r output    # 删除 output 文件夹
```

#### （8）关闭Hadoop

```bash
./sbin/stop-dfs.sh
```

### 3、配置YARN

#### （1）配置

```bash
cp ./etc/hadoop/mapred-site.xml.template ./etc/hadoop/mapred-site.xml
vim etc/hadoop/yarn-site.xml
<?xml version="1.0"?>
<!-- yarn-site.xml -->
<configuration>
  <property>
    <name>yarn.resourcemanager.hostname</name>
    <value>localhost</value>
  </property>
  <property>
    <name>yarn.nodemanager.aux-services</name>
    <value>mapreduce_shuffle</value>
  </property>
</configuration>

vim etc/hadoop/mapred-site.xml
<?xml version="1.0"?>
<!-- mapred-site.xml -->
<configuration>
  <property>
    <name>mapreduce.framework.name</name>
    <value>yarn</value>
  </property>
</configuration>
```

#### （2）启动

```bash
./sbin/start-dfs.sh
./sbin/start-yarn.sh      # 启动YARN
./sbin/mr-jobhistory-daemon.sh start historyserver  # 开启历史服务器，才能在Web中查看任务运行情况
jps

http://localhost:8088/cluster
```

> 不启动 YARN 需重命名 mapred-site.xml

#### （3）非Linux环境常见问题

* 本地库无法使用，如果需要使用需要重新编译 [doc](http://hadoop.apache.org/docs/current/hadoop-project-dist/hadoop-common/NativeLibraries.html)
* 使用Java实现的IO库的情况下，无法使用Gzip压缩Map输出 [bug](https://jira.apache.org/jira/browse/HADOOP-11334)
* `$HADOOP_HOME/libexec/hadoop-config.sh:157` Yarn Java环境变量问题 [bug](https://stackoverflow.com/questions/33968422/bin-bash-bin-java-no-such-file-or-directory)
  * 修改以上文件（似乎还是不行）
  * `sudo ln -s /usr/bin/java /bin/java`
* 伪分布式，MR如果卡在 INFO mapreduce.Job: Running job
  * `/etc/hosts` 将127.0.0.1 后面添加 `$(hostname)`

### 4、完全分布式单点配置

#### （0）介绍

Apache 的几种安装方式

* 源码包（官方）
* 二进制tar包（官方）
* 包管理工具（第三方apt、yum、brew等）
* Hadoop集群管理工具（Cloudera Manager和Apache Ambari）
	* 启发式的根据硬件配置Hadoop集群

集群部署环境

* 选择高端的商业硬件

集群规模

* 针对小规模集群（几十个节点），可以在一台机器上同时运行namenode和yarn资源管理器
* 大规模集群考虑使用分离、和HA部署

网络拓扑

* 当Hadoop在同一个机架使用默认配置集合
* 如果Hadoop跨机架部署则需要配置节点机架映射关系
* 如何配置参见《Hadoop权威指南》P284

Unix用户账号

* 为hdfs、MR、yarn创建独立的用户运行，他们属于同一个hadoop组（可选）

Hadoop配置

* 配置脚本：`$HADOOP_HOME/etc/hadoop`
* 配置管理：所有节点都保存自己的一份配置文件（而不是全局唯一）
* 环境变量相关配置说明
	* Java环境变量，编写在bashrc，推荐的做法是使用修改`$HADOOP_HOME/etc/hadoop/*-env.sh`
	* 守护进程Java堆大小：默认1000mb（每百万个数据块分配1000mb内存）
		* `hadoop-env.sh`的HADOOP_HEAPSIZE
		* `yarn-env.sh`的`YARN_RESOURCEMANAGER_HEAPSIZE`
		* 只增加namenode内存：设置`hadoop-env.sh`的`HADOOP_NAMENODE_OPTS`指定JVM内存选项
* 日志文件位置：默认在`$HADOOP_HOME/logs`，通过`HADOOP_LOG_DIR`配置
* SSH设置：`StrictHostKeyChecking no`使SSH客户端不询问验证指纹
* 集群守护进程配置
	* HDFS:
		* `fs.defaultFS`：指定默认文件系统（用于客户端），文件系统的URI，端口（默认配置8020）默认值`file:///`
		* `dfs.namenode.name.dir`：指定目录存储namenode元数据（编辑日志和文件系统镜像）的位置可以指定多个（防止节点失效，用于冗余备份）用`,`分割。默认值`file://${hadoop.tmp.dir}/dfs/name`
		* `dfs.namenode.checkpoint.dir`：设置检查点存储目录，可设置多个。默认值`file://${hadoop.tmp.dir}/dfs/namesecondary`
		* `dfs.datanode.data.dir`：指定datanode数据块存放位置，支持多个文件（用于并发读写，使用noation选项挂载磁盘）。默认值`file://${hadoop.tmp.dir}/dfs/data
		* `hadoop.tmp.dir` 默认情况下为 `/tmp/hadoop-${user.name}`
	* yarn
		* `yarn.resourcemanager.hostname`：设置资源管理器，IP地址或者主机名，默认为`0.0.0.0`
		* `yarn.resourcemanager.address`：设置资源管理器host:port，用于客户端默认为`${yarn.resourcemanager.hostname}:8032`
		* `yarn.nodemanager.local-dir`：目录列表，节点管理器允许容器运行期间存放临时文件，`file://${hadoop.tmp.dir}/nm-local-dir`
		* `yarn.nodemanager.aux-services`：指定中间服务（比如mapreduce-shuffle）
		* `yarn.nodemanager.resource.memorymb`：节点管理器可分配内存（默认值为`8192`）
		* `yarn.nodemanager.resource.vmem-pmem-ratio`：虚拟内存和物理内存之比，默认2.1
		* `yarn.nodemanager.resource.cpuvcore`：节点管理器可分配CPU虚拟核心数默认8
		* 客户端需要指定的资源配置
			* `mapreduce.map.memory.mb` 默认1024，map容器内存
			* `mapreduce.reduce.memory.mb` 默认1024，reduce容器内存
			* `mapred.child.java.opts` 默认`-Xmx200m` 用于设置虚拟机内存
			* `mapred.map.java.opts` 默认`-Xmx200m` 用于设置虚拟机内存
			* `mapred.reduce.java.opts` 默认`-Xmx200m` 用于设置虚拟机内存
	* 守护进程监听端口（HTTP和RPC）
		* `fs.defaultFS`： HDFS RPC ： 8020
		* `dfs.namenode.rpc-bind-port`：namenode绑定IP，可以设置为`0.0.0.0`，默认由`fs.defaultFS`决定
		* `dfs.datanode.ipc.address`：datanode rpc 默认为`0.0.0.0:50020`
		* `mapreduce.jobhistroy.address`：作业历史服务器RPC的IP和端口，客户端在集群外部用来查询作业历史，用于客户端
		* `mapreduce.jobhistroy.bind-host`：作业历史服务器绑定的IP
		* `yarn.resourcemanager.hostname` 设置资源管理器，IP地址或者主机名，默认为`0.0.0.0`
		* `yarn.resourcemanager.bind-host`：yarn资源管理RPC和HTTP服务器绑定的IP
		* `yarn.resourcemanager.address`：设置资源管理器host:port，用于客户端默认为`${yarn.resourcemanager.hostname}:8032`
		* 其他参见《Hadoop权威指南》P301
			* address 为结尾的配置
				* 当bind-host未给出的时候使用address进行绑定网络端口
				* 客户端使用该地址连接达到该服务器
			* bind-host 为结尾的配置：绑定指定的网卡
			* hostname 为结尾的配置：指定网络位置（主要配置项）
	* 常见HTTP服务默认端口
		* namenode `50070`
		* second namenode `50090`
		* datanode `50075`
		* 作业历史服务器 `19888`
		* yarn资源管理器 `8088`
		* yarn节点资源管理器`8042`
* 其他配置
	* 集群成员，通过文件允许某些datanode或者节点管理器加入集群
		* `dfs.hosts` 记录允许作为datanode加入集群的列表（排除：`dfs.hosts.exclude`）
		* `yarn.resourcemanager.nodes.include-path` 记录允许作为节点管理器加入集群的列表（排除：`yarn.resourcemanager.nodes.exclude-path`）
	* IO缓冲区大小：默认4K字节，`io.file.buffer.size`
	* HDFS块大小：`dfs.blocksize`
	* 保留储存空间：`dfs.datanode.du.reserved` 单位字节（保留部分空间给系统使用）
	* 回收站：`fs.trash.interval` 回收站过期时间（分钟），默认为0表示不启用回收站（只有shell操作有效，程序不启用，程序可以通过Trash类实现），启用后每个用户目录小都会存在一个隐藏目录`.Trash`
	* 作业调度（略）
	* 慢启动reduce：`mapreduce.job.reduce.slowstart.completedumps=0.05` 默认5%，表示5%的map任务完成后，启动reduce
	* 短路本地读（当数据在本机使用unix套接字连接）

#### （1）集群部署规划

| 节点名称 | NameNode | SecondaryNameNode | DataNode | ResourceManager | NodeManager |
|--------|:--------:|:-----------------:|:--------:|:--------------:|:-----------:|
| hadoop-master  | ✓  |                                  | ✓             |                            |  ✓                 |
| hadoop-slave1 |	       | ✓                              | ✓             |  ✓                        |  ✓                 |
| hadoop-slave2 |	      |                                  | ✓             |                            |  ✓                 |

#### （2）配置master节点

配置Host

```host
192.168.3.20  hadoop-master
192.168.3.21  hadoop-slave1
192.168.3.22  hadoop-slave2
```

配置`vim etc/hadoop/core-site.xml`

```xml
<configuration>
        <property>
                <name>hadoop.tmp.dir</name>
                <value>file:/usr/hadoop/default/tmp</value>
                <description>Abase for other temporary directories.</description>
        </property>
        <property>
                <name>fs.defaultFS</name>
                <value>hdfs://hadoop-master:9000</value>
        </property>
</configuration>
```

配置`vim etc/hadoop/hadoop-env.sh`

```bash
export JAVA_HOME=/usr/java/default
export HADOOP_OPTS="-Djava.library.path=${HADOOP_COMMON_LIB_NATIVE_DIR}"
```

配置`vim etc/hadoop/hdfs-site.xml`

```xml
<configuration>
    <property>
        <name>dfs.replication</name>
        <value>2</value>
    </property>
    <property>
        <name>dfs.namenode.secondary.http-address</name>
        <value>hadoop-slave1:50090</value>
    </property>
    <property>
        <name>dfs.namenode.name.dir</name>
        <value>file:/usr/hadoop/default/tmp/dfs/name</value>
    </property>
    <property>
        <name>dfs.datanode.data.dir</name>
        <value>file:/usr/hadoop/default/tmp/dfs/data</value>
    </property>
</configuration>
```

配置`vim etc/hadoop/slaves`

```host
hadoop-master
hadoop-slave1
hadoop-slave2
```

配置`vim etc/hadoop/mapred-env.sh`

```bash
export JAVA_HOME=/usr/java/default
```

`cp etc/hadoop/mapred-site.xml.template etc/hadoop/mapred-site.xml`
配置`vim etc/hadoop/mapred-site.xml`

```xml
<configuration>
    <property>
     <name>mapreduce.framework.name</name>
     <value>yarn</value>
    </property>
</configuration>
```

配置`vim etc/hadoop/yarn-env.sh`

```bash
export JAVA_HOME=/usr/java/default
```

配置`vim etc/hadoop/yarn-site.xml`

```xml
<configuration>
     <property>
        <name>yarn.nodemanager.aux-services</name>
        <value>mapreduce_shuffle</value>
     </property>
     <property>
        <name>yarn.resourcemanager.hostname</name>
        <value>hadoop-slave1</value>
     </property>
</configuration>
```

#### （3）复制虚拟机并配置静态网卡IP

略

#### （4）启动集群

namenode格式化仅需要执行一次，在`hadoop-master`节点执行（规划为NameNode的节点）

```bash
hdfs namenode -format
```

hdfs启动，在`hadoop-master`节点执行（规划为NameNode的节点）

```bash
# 启动
start-dfs.sh
# 终止
stop-dfs.sh
```

yarn启动，在`hadoop-slave1`节点执行（规划为ResourceManager的节点）

```bash
#启动
start-yarn.sh
#终止
stop-yarn.sh
```

启动过程中会使用ssh登录，所以过程中可能需要输入`yes`

## 二、hdfs原理及操作

***

### 1、常用命令

#### （1）`hadoop fs`

* `hadoop fs -ls /` 列出根目录文件
* `hadoop fs -lsr`  展开列出根目录文件
* `hadoop fs -mkdir -p /user/hadoop` 创建目录
* `hadoop fs -put a.txt /user/hadoop/` 将本地文件put到文件系统中
* `hadoop fs -get /user/hadoop/a.txt /` 从文件系统拉回本地
* `hadoop fs -cp src dst` 复制
* `hadoop fs -mv src dst` 移动
* `hadoop fs -cat /user/hadoop/a.txt` 查看
* `hadoop fs -rm /user/hadoop/a.txt` 删除
* `hadoop fs -rmr /user/hadoop/a.txt` 递归删除
* `hadoop fs -text /user/hadoop/a.txt` 以文本方式输出
* `hadoop fs -copyFromLocal localsrc dst` 与hadoop fs -put功能类似。
* `hadoop fs -moveFromLocal localsrc dst` 将本地文件上传到hdfs，同时删除本地文件。

#### （2） `hadoop fsadmin`

* `hadoop dfsadmin -report` 查看hdfs状态
* `hadoop dfsadmin -safemode enter | leave | get | wait`
* `hadoop dfsadmin -setBalancerBandwidth 1000`

#### （3）`hadoop fsck`

#### （4）`start-balancer.sh`

#### （5）相关HDFS API可以到Apache官网进行查看

http://hadoop.apache.org/docs/r2.8.0/api/index.html

### 2、java编程交互

#### (0) 相关接口

通过URI直接打开一个流

```java
	URL.setURLStreamHandlerFactory(new FsUrlStreamHandlerFactory());
	in = new URL('file:///etc/hosts').openStream();
```

通过Hadoop的FileSystem

```java
import org.apache.hadoop.conf.Configuration;
import org.apache.hadoop.fs.FileSystem;
import org.apache.hadoop.fs.Path;
import org.apache.hadoop.io.IOUtils;

Configuration conf = new Configuration();
FileSystem fs = FileSystem.get(URI.create(uri), conf);
```

FileSystem的使用

```java
// 读写
InputStream in = fs.open(new Path(uri)); // 获取一个输入流
fs.exists() // 判断文件是否存在
OutputStream out = fs.create(new Path(dst), new Progressable() { // 创建一个文件并获取一个输出流（存在报错）
	public void progress() {
		System.out.print(".");
	}
});
OutputStream out1 = fs.append(new Path(dst)) //追加一个文件内容

// 创建目录
fs.mkdirs(new Path(dir)) // 创建一个目录

// 文件信息
fs.getFileStatus(new Path(dst)) //查看文件元数据（文件信息）
fs.listStatus(new Path(dir))  // 查看目录下的文件信息
fs.globStatus(new Path(globPath))	// 通过glob模式获取文件信息

// 删除
fs.delete(new Path(p))
```

#### （1）创建hadoop项目

* 打开eclipse
* 创建简单maven项目
* 更改pom.xml

```xml
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>
  <groupId>com.rectcircle</groupId>
  <artifactId>hadoop</artifactId>
  <version>0.0.1-SNAPSHOT</version>
  <name>HadoopTest</name>

      <dependencies>
        <dependency>
            <groupId>org.apache.hadoop</groupId>
            <artifactId>hadoop-client</artifactId>
            <version>2.8.0</version>
        </dependency>

        <dependency>
            <groupId>junit</groupId>
            <artifactId>junit</artifactId>
            <version>4.12</version>
            <scope>test</scope>
        </dependency>
    </dependencies>

</project>
```

#### （2）样例1：查看某文件的前4096个字节

`FileSystemCat.java`

```java
import java.io.IOException;
import java.io.InputStream;
import java.net.URI;

import org.apache.hadoop.conf.Configuration;
import org.apache.hadoop.fs.FileSystem;
import org.apache.hadoop.fs.Path;
import org.apache.hadoop.io.IOUtils;

public class FileSystemCat {
	public static void main(String[] args) throws IOException {
		String uri = args[0]; //获取参数
		Configuration conf = new Configuration(); //创建一个hadoop配置对象
		FileSystem fs = FileSystem. get(URI.create (uri), conf); //获取文件系统实例
		InputStream in = null;
		try {
			in = fs.open(new Path(uri)); //打开一个文件流
			IOUtils.copyBytes(in, System.out, 4096, false); //将文件的前4096个字节打印到标准输出
		} finally {
			IOUtils.closeStream(in);
		}
	}
}
```

**搭建测试环境**

运行hdfs

```bash
start-all.sh
#stop-all.sh
```

进入hadoop目录

```bash
cd /usr/local/hadoop
```

在本地创建测试目录

```bash
mkdir myclass
mkdir input
```

编辑测试文件

```bash
cd input
touch  quangle.txt
vim quangle.txt
#复制如下内容进入
On the top of the Crumpetty Tree
The Quangle Wangle sat,
But his face you could not see,
On account of his Beaver Hat.
```

在hdfs中创建存放测试文件的目录`class4`

```bash
hadoop fs -mkdir /class4
hadoop fs -ls /
```

将测试文件put到hdfs中

```bash
hadoop fs -put quangle.txt /class4
hadoop fs -ls /class4
```

**编译源码**

建立源文件

```bash
cd ../myclass/
vi FileSystemCat.java
#将代码复制到文件中
```

编译

```bash
#编译
javac -classpath ../share/hadoop/common/hadoop-common-2.8.0.jar FileSystemCat.java
#打包
jar cvf FileSystemCat.jar FileSystemCat.class
ls
#输出jar和class文件
```

**运行程序**

> `hadoop jar xxx.jar mainClass arg...`

```bash
hadoop jar FileSystemCat.jar FileSystemCat /class4/quangle.txt
```

#### （3）样例2：将本地系统的文件的第101-120字节的内容写入HDFS中

```java
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.net.URI;

import org.apache.hadoop.conf.Configuration;
import org.apache.hadoop.fs.FileSystem;
import org.apache.hadoop.fs.Path;
import org.apache.hadoop.io.IOUtils;
import org.apache.hadoop.util.Progressable;

public class LocalFile2Hdfs {
	public static void main(String[] args) throws IOException {
		String local = args[0]; //本地文件路径
        String uri = args[1]; //hdfs系统的路径

        FileInputStream in = null;
        OutputStream out = null;
        Configuration conf = new Configuration();

        try {
        	// 从本地文件读取文件
        	in = new FileInputStream(new File(local));

        	//目标文件配置
        	FileSystem fs = FileSystem.get(URI.create(uri), conf);
        	out = fs.create(new Path(uri), new Progressable() {
                @Override
                public void progress() {
                    System.out.println("*");
                }
            });

        	// 跳过前100个字符
            in.skip(100);

            byte[] buffer = new byte[20];
            // 从101的位置读取20个字符到buffer中
            int bytesRead = in.read(buffer);
            if (bytesRead >= 0) { //数据写入系统
                out.write(buffer, 0, bytesRead);
            }

        } finally {
        	IOUtils.closeStream(in);
            IOUtils.closeStream(out);
		}

	}
}
```

编译运行类似

```bash
cd /usr/local/hadoop/myclass
vim LocalFile2Hdfs.java
#将代码复制到文件中
cd ../input
vim local2hdfs.txt
#复制测试文本

#编译打包运行
cd ../myclass
javac -classpath ../share/hadoop/common/hadoop-common-2.8.0.jar LocalFile2Hdfs.java
#打包时注意，由于使用了匿名对象所以生成了LocalFile2Hdfs\$1.class
jar cvf LocalFile2Hdfs.jar LocalFile2Hdfs.class LocalFile2Hdfs\$1.class
hadoop jar LocalFile2Hdfs.jar LocalFile2Hdfs ../input/local2hdfs.txt /class4/local2hdfs_part.txt

#查看
hadoop fs -cat /class4/local2hdfs_part.txt
```

#### （4）样例3：读取hdfs系统的文件的的第101-120字节内容写入本地系统

```bash
import java.io.FileOutputStream;
import java.io.OutputStream;
import java.net.URI;

import org.apache.hadoop.conf.Configuration;
import org.apache.hadoop.fs.FSDataInputStream;
import org.apache.hadoop.fs.FileSystem;
import org.apache.hadoop.fs.Path;
import org.apache.hadoop.io.IOUtils;

public class Hdfs2LocalFile {
	public static void main(String[] args) throws Exception {

		String uri = args[0];
		String local = args[1];

		FSDataInputStream in = null;
		OutputStream out = null;
		Configuration conf = new Configuration();
		try {
			FileSystem fs = FileSystem.get(URI.create(uri), conf);
			in = fs.open(new Path(uri));
			out = new FileOutputStream(local);

			byte[] buffer = new byte[20];
			in.skip(100);
			int bytesRead = in.read(buffer);
			if (bytesRead >= 0) {
				out.write(buffer, 0, bytesRead);
			}
		} finally {
			IOUtils.closeStream(in);
			IOUtils.closeStream(out);
		}
	}
}
```

编译运行类似

```bash
cd /usr/local/hadoop/myclass
vim Hdfs2LocalFile.java
#将代码复制到文件中
cd ../input
vim hdfs2local.txt
#复制测试文本

#上传测试文本
hadoop fs -copyFromLocal hdfs2local.txt /class4/hdfs2local.txt
hadoop fs -ls /class4/

#编译打包运行
cd ../myclass
javac -classpath ../share/hadoop/common/hadoop-common-2.8.0.jar Hdfs2LocalFile.java
#打包
jar cvf Hdfs2LocalFile.jar Hdfs2LocalFile.class
hadoop jar Hdfs2LocalFile.jar Hdfs2LocalFile  /class4/hdfs2local.txt hdfs2local_part.txt

#查看
cat hdfs2local_part.txt
```

### 3、Hadoop文件系统的设计与原理

#### （1）文件系统设计

大数据文件系统设计目标

* 数据处理方式为流式处理
* 面向超大文件
* 运行在普通商业硬件之上

要求此文件系统有如下特点

* 集群分布式存储
* 一次写入多次读取，不允许随机写入，只允许追加
* 容错能力强
* 不支持低延迟访问、小文件

#### （2）HDFS的概念

**HDFS**

为 `Hadoop Distributed FileSystem` 即 Hadoop分布式文件系统，在Hadoop上下文下可以简称`DFS`。在Hadoop中表现为一套接口（规范）和多个实现。

**数据块**

类似与磁盘的块。但是Hadoop数据库默认大小非常大(百MB级别)。块和磁盘块不同，只是逻辑上的，如果某个块内存放的数据小于数据块大小。实际占用磁盘空间是实际数据的大小。数据块大小主要影响到Hadoop能存放多少文件（因为数据块索引放在内存中，如果数据块很小那么存放的文件数就会少，受限于内存）。设计上和ex4 文件系统中的 inode相似。

每个数据块可以存在多个备份（通过配置设置）

**namenode 和 datanode**

在物理层面，存在这个概念

* namenode 存放文件元数据（目录结构、数据块索引）的节点，一个集群只有一个。
* datanode 存放数据块的节点，一个集群有多个。

namenode 存在单点失效问题：实现高可用需要运行一个辅助的namenode，作为namenode的备份

**联邦HDFS**

借鉴Linux文件系统中挂载点的思路。

#### （3）Hadoop文件系统

Hadoop文件系统的实现有多个：

* Local 通过Hadoop文件系统接口访问本地磁盘文件
* HDFS 配合MR使用的，是核心
* WebHDFD
* 等

编程接口方面：原生支持的是Java、提供C语言的接口（JNI实现，更新较慢）、RESTful API、NFS、FUSE

#### （4）数据流

* 文件读取过程（参见Hadoop权威指南P69）
* 文件写入过程（参见Hadoop权威指南P72）

#### （5） 一致性模型

* 使用create新建文件，立即可见
* 写入内容即使flush(JavaIO的flush)了，但是也不能保证立即可见
* 写入内容后使用hflush(FSDataOutputStream提供)，可以保证可见，但是不保证写入磁盘
* 写入内容后使用hsync(FSDataOutputStream提供)，可以保证可见，保证落磁盘

## 三、Yarn

***

### 0、Yarn简介

Yarn是一个集群资源管理器。负责调度分配集群的运算资源（主要是CPU和内存）

### 1、Yarn运行机制

YARN 通过两类守护进程提供核心服务

* 资源管理器（Resource manager）一个（master）： 负责调度
* 节点管理器（Node manager）每个节点一个（daemon）：用于启动和监控容器（container），容器可能是一个Unix进程、Linux cgroup
* 容器运行的内容分为两类：
	* Application Master ：应用管理器，负责监控应用执行情况
	* Worker：工作者，可能存在，有Application Master管理创建

Yarn 运行一个应用的过程（Hadoop权威指南P79）：

* 客户端联系资源管理器，要求启动一个容器运行Application Master(Resource manager调度一个Node Manager创建一个容器，并运行Application Master）
* Application Master负责启动工作容器或者直接运行任务，并返回结果

Yarn 申请资源会优先遵循数据本地化原则。申请资源可以一次申请全部需要的资源（Spark），可也以在运行期间动态申请（MR）。

#### 应用的生命周期

* MR中一个Job对应一个Application
* Spark中一个工作流（多个Job、或者说一个用户对话）对应一个Application，有利于容器重用，数据缓存，减少资源分配的开销
* 多用户共享一个应用，比如Slider长期运行一个Application Master，通过该Application Master申请资源，带来更低低延次

#### 构建Yarn应用

* 构建有向无环图工作流：Spark、Tez
* 流式处理：Spark、Samza、Storm
* 运行多线程程序：Twill
* 构建原生Yarn：参考yarn distributed shell

### 2、Yarn调度

#### （1）调度器选择

* FIFO 略（默认）
* 容量调度器: 多个队列每个队列可选FIFO
* 公平调度器：尽量保证每个应用都分配到均等的资源

#### （2）容量调度器的配置

队列树如下：

```
root
  |-- prod
  |-- dev
          |-- eng
          |-- science
```

**yarn-site.xml**

```xml
<configuration>
  <property>
    <name>yarn.resourcemanager.scheduler.class</name>
    <value>org.apache.hadoop.yarn.server.resourcemanager.scheduler.capacity.CapacityScheduler</value>
  </property>
<configuration>
```

**capacity-scheduler.xml**

```xml
<?xml version="1.0"?>
<configuration>
  <property>
    <name>yarn.scheduler.capacity.root.queues</name>
    <value>prod,dev</value>
  </property>
  <property>
    <name>yarn.scheduler.capacity.root.dev.queues</name>
    <value>eng,science</value>
  </property>
  <property>
    <name>yarn.scheduler.capacity.root.prod.capacity</name>
    <value>40</value> <!-- prod占40% -->
  </property>
  <property>
    <name>yarn.scheduler.capacity.root.dev.capacity</name>
    <value>60</value> <!-- dev占60% -->
  </property>
  <property>
    <name>yarn.scheduler.capacity.root.dev.maximum-capacity</name>
    <value>75</value> <!-- dev的最大容量为75% -->
  </property>
  <property>
    <name>yarn.scheduler.capacity.root.dev.eng.capacity</name>
    <value>50</value><!-- eng占dev的50% -->
  </property>
  <property>
    <name>yarn.scheduler.capacity.root.dev.science.capacity</name>
    <value>50</value><!-- science占dev的50% -->
  </property>
</configuration>
```

* prod 可能因为抢占、占有全部的资源
* dev 最多占有全部资源的75%
* eng 可能占有dev的全部资源
* science 可能占有dev的全部资源

MR 任务配置队列方式：`mapreduce.job.queuename=队列名后缀`

#### （3）公平调度器

略参见：《Hadoop权威指南》P89

其他参见 《Apache Hadoop YARN》

## 四、Hadoop的IO

***

* 数据完整性：使用改进的CRC32和数据块副本
* 压缩：MR支持Map端输出压缩、HDFS存档压缩：支持GZip等格式
* 序列化：MR过程中使用定制的极简的序列化框架、更紧凑快速。实现接口为`Writable`
	* 支持Java基本数据类型
	* 支持基本的集合类型
		* Array
		* Map
		* Set
* 基于文件的数据结构
	* SequenceFile：顺序文件（使用上可以当做一个`List<<K, V>>`）
	* MapFile：索引文件（使用上可以当做`Map<K,V>`），Key必须是有序的，索引原理是二层二分查找

## 五、MR使用与原理

***

> [文档](http://hadoop.apache.org/docs/stable/hadoop-mapreduce-client/hadoop-mapreduce-client-core/MapReduceTutorial.html)

MR一种适用于分布式环境的批处理模型

MR模型：

```
map: (K1, V1) -> list(K2, V2)
reduce: (K2, list(V2)) -> list(K3, V3)
```

开发流程

* 编写Mapper和Reducer
* 使用单元测试测试Mapper和Reducer是否符合预期
* 编写一个驱动程序来运行作业
* 使用小数据集测试驱动程序是否正确

Hadoop 提交MR作业例子：

```bash
# 不使用JAR方式
export HADOOP_CLASSPATH=target/experiment.jar
hadoop cn.rectcircle.hadooplearn.mrunit.MaxTemperatureDriver -conf src/main/resources/conf/hadoop-local.xml input/ncdc/micro output

# 使用jar，命令运行
unset HADOOP_CLASSPATH
hadoop jar target/experiment.jar cn.rectcircle.hadooplearn.mrunit.MaxTemperatureDriver -conf src/main/resources/conf/hadoop-localhost.xml input/ncdc/all max-temp
```

* `export HADOOP_CLASSPATH=target/experiment.jar` 可选本地方式运行支持
* `export HADOOP_CONF_DIR=$(pwd)/src/main/resources/pseudo-distribute-conf` 可选hadoop配置文件目录
* `-conf xxx.xml` 指定配置文件
* `-D  配置键=value` 配置

### 1、word-count例子

创建maven项目

配置pom

```xml
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>

  <groupId>cn.rectcircle.hadooplearn</groupId>
  <artifactId>wordcount</artifactId>
  <version>1.0-SNAPSHOT</version>
  <packaging>jar</packaging>

  <name>wordcount</name>
  <url>http://maven.apache.org</url>

  <properties>
    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    <hadoop.version>2.6.5</hadoop.version>
  </properties>


  <dependencies>
    <!-- https://mvnrepository.com/artifact/org.apache.hadoop/hadoop-common -->
    <dependency>
      <groupId>org.apache.hadoop</groupId>
      <artifactId>hadoop-common</artifactId>
      <version>${hadoop.version}</version>
      <scope>provided</scope>
    </dependency>

    <!-- https://mvnrepository.com/artifact/org.apache.hadoop/hadoop-hdfs -->
    <dependency>
      <groupId>org.apache.hadoop</groupId>
      <artifactId>hadoop-hdfs</artifactId>
      <version>${hadoop.version}</version>
    </dependency>

    <!-- https://mvnrepository.com/artifact/org.apache.hadoop/hadoop-client -->
    <dependency>
      <groupId>org.apache.hadoop</groupId>
      <artifactId>hadoop-client</artifactId>
      <version>${hadoop.version}</version>
    </dependency>

    <dependency>
      <groupId>junit</groupId>
      <artifactId>junit</artifactId>
      <version>4.12</version>
      <scope>test</scope>
    </dependency>
  </dependencies>

  <build>
    <finalName>${project.artifactId}</finalName>
  </build>

</project>
```

创建类`src/main/java/cn/rectcircle/hadooplearn/wordcount/WordCount.java`

```java
package cn.rectcircle.hadooplearn.wordcount;

import java.io.IOException;
import java.util.StringTokenizer;

import org.apache.hadoop.conf.Configuration;
import org.apache.hadoop.fs.Path;
import org.apache.hadoop.io.IntWritable;
import org.apache.hadoop.io.Text;
import org.apache.hadoop.mapreduce.Job;
import org.apache.hadoop.mapreduce.Mapper;
import org.apache.hadoop.mapreduce.Reducer;
import org.apache.hadoop.mapreduce.lib.input.FileInputFormat;
import org.apache.hadoop.mapreduce.lib.output.FileOutputFormat;
import org.apache.hadoop.util.GenericOptionsParser;


public class WordCount {

	//Map过程继承Mapper<KEYIN, VALUEIN, KEYOUT, VALUEOUT>
	//实现map方法
	public static class TokenizerMapper extends Mapper<Object, Text, Text, IntWritable> {

		private final static IntWritable one = new IntWritable(1);
		private Text word = new Text();

		//需要覆写的函数，Mapper的主体
		//声明为void map(KEYIN key, VALUEIN value, Context context)
		//用户输入的数据源使用InputSplit进行分片，存储每个分片的长度和偏移量的数组
		//参数key、value由InputFormat针对每个分片产生，默认的InputFormat为TextInputFormat,行为为按照换行进行分割，结果为<分片偏移量, line>
		//结果写入context即可
		public void map(Object key, Text value, Context context) throws IOException, InterruptedException {
			//默认情况下value为一行数据
			// StringTokenizer创建一个类似迭代器的对象，按照字符串的制表回车换行的字符分割
			StringTokenizer itr = new StringTokenizer(value.toString());
			while (itr.hasMoreTokens()) {
				//设置Text，Text应该是一个可变对象
				word.set(itr.nextToken());
				//将数据写入上下文
				context.write(word, one);
			}
		}
	}

	//Reduce过程继承自Reducer<KEYIN,VALUEIN,KEYOUT,VALUEOUT>
	public static class IntSumReducer extends Reducer<Text, IntWritable, Text, IntWritable> {
		private IntWritable result = new IntWritable();

		// 实现reduce方法 void reduce(KEYIN key, Iterable<VALUEIN> values, Context context)
		// 将map的结果按照key进行汇总到values里面进行reduce操作
		// key、value为map的输出
		// 结果写入context，然后经过OutFormat输出到文件
		public void reduce(Text key, Iterable<IntWritable> values, Context context)
				throws IOException, InterruptedException {
			int sum = 0;
			for (IntWritable val : values) {
				sum += val.get();
			}
			result.set(sum);
			context.write(key, result);
		}
	}

	//主程序
	public static void main(String[] args) throws Exception {
		// 创建一个配置
		Configuration conf = new Configuration();
		// 读取命令行参数
		String[] otherArgs = new GenericOptionsParser(conf, args).getRemainingArgs();
		if (otherArgs.length != 2) {
			System.err.println("Usage: wordcount <in> <out>");
			System.exit(2);
		}
		//创建一个作业
		Job job = Job.getInstance(conf, "word count");
		//设置工作的类
		job.setJarByClass(WordCount.class);
		//设定Mapper
		job.setMapperClass(TokenizerMapper.class);
		//设定Combiner
		job.setCombinerClass(IntSumReducer.class);
		//设置Reduce
		job.setReducerClass(IntSumReducer.class);
		//设定输出类型
		job.setOutputKeyClass(Text.class);
		job.setOutputValueClass(IntWritable.class);
		//设置输入输出路径
		FileInputFormat.addInputPath(job, new Path(otherArgs[0]));
		FileOutputFormat.setOutputPath(job, new Path(otherArgs[1]));
		//等待工作完成退出
		System.exit(job.waitForCompletion(true) ? 0 : 1);
	}
}
```

编译

```bash
mvn package
```

准备测试数据

```bash
mkdir input
echo 'Hello Hadoop Goodbye Hadoop' > input/file01
echo 'Hello Hadoop Goodbye Hadoop' > input/file02
hadoop fs -mkdir -p exp01/input
hadoop fs -put input/* exp01/input
hadoop fs -ls exp01/input
```

运行

```bash
hadoop jar wordcount.jar cn.rectcircle.hadooplearn.wordcount.WordCount exp01/input exp01/output
hadoop fs -ls exp01/output
hadoop fs -cat exp01/output/part-r-00001
```

### 2、Mapper

**映射**

Mapper是MR编程接口的核心之一。负责将KV转换为另一组KV

在Job中通过`Job.setMapperClass(Class)`设置

map输出的接口若要传递给Reducer则需要按照K进行分组。所以可以通过`Job.setGroupingComparatorClass(Class)`设置K比较器。

map的输出按照K进行排序，然后传递到指定的Reducer

为了减少数据传输量，可以使用`Job.setCombinerClass(Class)`设置预聚合器，进行本地Reduce

输出中间接口可以选择的进行压缩

Mapper的数量一般由输入文件（块）的数目决定。好的并行级别是每个节点10~100个Mapper。运行时间大于1分钟。要权衡并行度和启动销毁JVM的花销

### 3、Reducer

**规约**

Reduce是MR编程接口的核心之一。负责将`<K, List<V>>`转换为新的KV。保证全局每一个K对应`List<V>`是完整的全部的数据。

Reduce任务的数量可以手动设置`Job.setNumReduceTasks(int)`

reduce 有三个阶段：shuffle, sort and reduce

**shuffle**

Shuffle描述着数据从map task输出到reduce task输入的这段过程。

* map端输出的数据溢出、排序、group
* reduce去拉取，并进行group

**sort**

在reduce端对数据进行排序

**reduce**

reduce结果并没有进行排序

reduce可以不设置

### 4、Job

作业是描述一组MR任务的运行配置

可以配置：Mapper, combiner (if any), Partitioner, Reducer, InputFormat, OutputFormat  的实现

其他高级配置如：Comparator

任务日志`${HADOOP_LOG_DIR}/userlogs`

### 5、word-count例子2

```java
package cn.rectcircle.hadooplearn.wordcount;

import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;
import java.net.URI;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.StringTokenizer;

import org.apache.hadoop.conf.Configuration;
import org.apache.hadoop.fs.Path;
import org.apache.hadoop.io.IntWritable;
import org.apache.hadoop.io.Text;
import org.apache.hadoop.mapreduce.Job;
import org.apache.hadoop.mapreduce.Mapper;
import org.apache.hadoop.mapreduce.Reducer;
import org.apache.hadoop.mapreduce.lib.input.FileInputFormat;
import org.apache.hadoop.mapreduce.lib.output.FileOutputFormat;
import org.apache.hadoop.mapreduce.Counter;
import org.apache.hadoop.util.GenericOptionsParser;
import org.apache.hadoop.util.StringUtils;

public class WordCount2 {

	public static class TokenizerMapper extends Mapper<Object, Text, Text, IntWritable> {

		static enum CountersEnum {
			INPUT_WORDS
		}

		private final static IntWritable one = new IntWritable(1);
		private Text word = new Text();

		private boolean caseSensitive;
		private Set<String> patternsToSkip = new HashSet<String>();

		private Configuration conf;
		private BufferedReader fis;

		// 启动map之前执行的操作
		@Override
		public void setup(Context context) throws IOException, InterruptedException {
			conf = context.getConfiguration();
			//获取到配置
			caseSensitive = conf.getBoolean("wordcount.case.sensitive", true);
			if (conf.getBoolean("wordcount.skip.patterns", false)) {
				URI[] patternsURIs = Job.getInstance(conf).getCacheFiles();
				for (URI patternsURI : patternsURIs) {
					Path patternsPath = new Path(patternsURI.getPath());
					String patternsFileName = patternsPath.getName().toString();
					parseSkipFile(patternsFileName);
				}
			}
		}

		//解析skip文件
		private void parseSkipFile(String fileName) {
			try {
				fis = new BufferedReader(new FileReader(fileName));
				String pattern = null;
				while ((pattern = fis.readLine()) != null) {
					patternsToSkip.add(pattern);
				}
			} catch (IOException ioe) {
				System.err.println(
						"Caught exception while parsing the cached file '" + StringUtils.stringifyException(ioe));
			}
		}

		@Override
		public void map(Object key, Text value, Context context) throws IOException, InterruptedException {
			//将匹配部分删除
			String line = (caseSensitive) ? value.toString() : value.toString().toLowerCase();
			for (String pattern : patternsToSkip) {
				line = line.replaceAll(pattern, "");
			}
			//Map逻辑
			StringTokenizer itr = new StringTokenizer(line);
			while (itr.hasMoreTokens()) {
				word.set(itr.nextToken());
				context.write(word, one);
				// 计数器对象，将会在执行过程中输出
				Counter counter = context.getCounter(CountersEnum.class.getName(), CountersEnum.INPUT_WORDS.toString());
				counter.increment(1);
			}
		}
	}

	public static class IntSumReducer extends Reducer<Text, IntWritable, Text, IntWritable> {
		private IntWritable result = new IntWritable();

		public void reduce(Text key, Iterable<IntWritable> values, Context context)
				throws IOException, InterruptedException {
			int sum = 0;
			for (IntWritable val : values) {
				sum += val.get();
			}
			result.set(sum);
			context.write(key, result);
		}
	}

	public static void main(String[] args) throws Exception {
		//创建一个配置
		Configuration conf = new Configuration();
		//创建一个命令行选项解析器
		GenericOptionsParser optionParser = new GenericOptionsParser(conf, args);
		String[] remainingArgs = optionParser.getRemainingArgs();
		if ((remainingArgs.length != 2) && (remainingArgs.length != 4)) {
			System.err.println("Usage: wordcount <in> <out> [-skip skipPatternFile]");
			System.exit(2);
		}
		//创建一个Job
		Job job = Job.getInstance(conf, "word count");
		//通过查找给定类的来源来设置Jar。
		job.setJarByClass(WordCount2.class);
		//设置Mapper
		job.setMapperClass(TokenizerMapper.class);
		//设定Combiner
		job.setCombinerClass(IntSumReducer.class);
		//设定Reduce
		job.setReducerClass(IntSumReducer.class);
		//设定输出类型
		job.setOutputKeyClass(Text.class);
		job.setOutputValueClass(IntWritable.class);

		//查找skip参数
		List<String> otherArgs = new ArrayList<String>();
		for (int i = 0; i < remainingArgs.length; ++i) {
			if ("-skip".equals(remainingArgs[i])) {
				//如果存在skip参数
				//将该路径加入Job缓存文件
				job.addCacheFile(new Path(remainingArgs[++i]).toUri());
				//并设置Job配置
				job.getConfiguration().setBoolean("wordcount.skip.patterns", true);
			} else {
				otherArgs.add(remainingArgs[i]);
			}
		}
		//设置输入输出路径
		FileInputFormat.addInputPath(job, new Path(otherArgs.get(0)));
		FileOutputFormat.setOutputPath(job, new Path(otherArgs.get(1)));
		//启动Job并等待完成并退出
		System.exit(job.waitForCompletion(true) ? 0 : 1);
	}
}
```

编译

```bash
mvn package
```

运行准备

```bash
echo 'Hello World, Bye World!' > file01
echo 'Hello Hadoop, Goodbye to hadoop.' > file02
hadoop fs -mkdir -p exp02/input
hadoop fs -put file0* exp02/input
$ cat patterns.txt
\.
\,
\!
to
hadoop fs -put patterns.txt exp02/input
```

运行

```bash
# 不带参数运行
hadoop jar wordcount.jar cn.rectcircle.hadooplearn.wordcount.WordCount2 exp02/input exp02/output
hadoop fs -cat exp02/output/part-r-00000
# 带参数运行
hadoop jar wordcount.jar cn.rectcircle.hadooplearn.wordcount.WordCount2 exp02/input exp02/output2 -skip exp02/input/patterns.txt
hadoop fs -cat exp02/output2/part-r-00000
```

### 6、链接MapReduce作业

大多数情况一个MapReduce无法完成一个业务需要多个MR链接才能完成。Job提供这些操作，Hadoop提供这些操作

* 创建多个Job
* 依赖关系式 MapReuce：`org.apache.hadoop.mapred.jobcontrol.JobControl`
* `ChainMapper`和`ChainReducer`
* 还有专门的工作流引擎来实现如：Oozie 和 Azkaban

### 7、Hadoop Stream

Hadoop  支持任意编程语言（只要支持标准输入输出）编写的MR程序，称为Hadoop Stream

比如Python

例子

一个Mapper

```python
#!/usr/bin/env python
# -*- coding: utf-8 -*-

import re
import sys

for line in sys.stdin:
  val = line.strip()
  (year, temp, q) = (val[15:19], val[87:92], val[92:93])
  if (temp != "+9999" and re.match("[01459]", q)):
    print "%s\t%s" % (year, temp)

```

一个Reducer

```python
#!/usr/bin/env python
# -*- coding: utf-8 -*-

import sys

(last_key, max_val) = (None, -sys.maxint)
for line in sys.stdin:
  (key, val) = line.strip().split("\t")
  if last_key and last_key != key:
    print "%s\t%s" % (last_key, max_val)
    (last_key, max_val) = (key, int(val))
  else:
    (last_key, max_val) = (key, max(max_val, int(val)))

if last_key:
  print "%s\t%s" % (last_key, max_val)
```

本地测试（使用cat 和 管道符）

```python
cat input/ncdc/sample.txt | \
src/main/java/cn/rectcircle/hadooplearn/mrintro/stream/python/max_temperature_map.py | \
sort | \
src/main/java/cn/rectcircle/hadooplearn/mrintro/stream/python/max_temperature_reduce.py
```

在集群中运行

```python
hadoop jar $HADOOP_HOME/share/hadoop/tools/lib/hadoop-streaming-*.jar \
  -input input/ncdc/sample.txt \
  -output output \
  -mapper src/main/java/cn/rectcircle/hadooplearn/mrintro/stream/python/max_temperature_map.py \
  -combiner src/main/java/cn/rectcircle/hadooplearn/mrintro/stream/python/max_temperature_reduce.py \
  -reducer src/main/java/cn/rectcircle/hadooplearn/mrintro/stream/python/max_temperature_reduce.py
  # 分布式环境下需要将制定files
  # -files src/main/java/cn/rectcircle/hadooplearn/mrintro/stream/python/max_temperature_map.py, \
  #        src/main/java/cn/rectcircle/hadooplearn/mrintro/stream/python/max_temperature_reduce.py \
```

注意：

* 输出输出面向标准IO， K和V的分隔符为`\t`
* Reduce 输入的不是 `<K, List<V>>`的结构，而是`List<K, V>` 保证按照K从小到大排序，需要自行判断边界
