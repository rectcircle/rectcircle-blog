---
title: "Hive UDF and Transform"
date: 2020-04-20T21:27:23+08:00
draft: false
toc: true
comments: true
tags:
  - 大数据
---

## 介绍

UDF 和 Transform 是 Hive 提供的对 SQL 的扩展机制。

在遇到一些复杂场景，Hive SQL 无法实现，但是又不想使用原生MR/Spark的低级API开发时，就可以通过 UDF 或者 Transform 来实现这些复杂的特性，在SQL中通过特定语法调用即可实现。

UDF 和 Transform 可以实现类似的同能，他们的区别如下

- Hive UDF 必须使用JVM语言编写，嵌入到Task的JVM中，通过函数调用，因此几乎没有额外的开销。
- Transform 利用标准 IO 管道进行交互，运行在不同的进程，因此有额外的开销，但是灵活性较大，支持任意语言。

## 示例

### 需求如下

- 判断某些字符串是否包含日期
- 最好可以提取出日期
- 支持多种语言

简单分析来看，有两种实现方案

- 通过SQL正则实现，但是识别率理论上比较低
- UDF/Transform实现，利用开源第三方库实现，识别率高，因此使用第此方案

### UDF实现

经过调研，发现有一个Java库可以实现此功能，[Chrono-java](https://github.com/wanasit/chrono-java) 。现在只需写一个UDF即可

#### 创建项目/添加依赖

- 创建 Maven 项目
- 添加依赖 `pom.xml`，**需要注意的是**
    - 需要添加内部仓库
    - Hadoop 的两个依赖必须是 `<scope>provided</scope>` 的
    - 需要使用 插件 `maven-shade-plugin` 打 fat jar

```xml
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/maven-v4_0_0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <!-- 基本信息 -->

    <properties>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
        <project.reporting.outputEncoding>UTF-8</project.reporting.outputEncoding>
        <java.version>1.8</java.version>
        <maven.compiler.source>${java.version}</maven.compiler.source>
        <maven.compiler.target>${java.version}</maven.compiler.target>
        <hadoop.version>2.6.0</hadoop.version>
        <hive.version>1.2.3</hive.version>
        <scala.version>2.10.4</scala.version>
        <spark.version>2.3.0</spark.version>
    </properties>

    <repositories>
        <repository>
            <id>Chrono date parser library</id>
            <url>https://raw.github.com/wanasit/chrono-java/mvn-repo/</url>
            <snapshots>
                <enabled>true</enabled>
                <updatePolicy>always</updatePolicy>
            </snapshots>
        </repository>
    </repositories>

    <dependencies>
        <!-- 单侧 -->
        <dependency>
            <groupId>junit</groupId>
            <artifactId>junit</artifactId>
            <version>4.12</version>
            <scope>test</scope>
        </dependency>
        <!-- UDF 依赖 -->
        <dependency>
            <groupId>org.apache.hadoop</groupId>
            <artifactId>hadoop-common</artifactId>
            <version>${hadoop.version}</version>
            <scope>provided</scope>
        </dependency>
        <dependency>
            <groupId>org.apache.hive</groupId>
            <artifactId>hive-exec</artifactId>
            <version>${hive.version}</version>
            <scope>provided</scope>
        </dependency>
        <!-- 日期提取器依赖 -->
        <dependency>
            <groupId>com.wanasit</groupId>
            <artifactId>chrono</artifactId>
            <version>LATEST</version>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-compiler-plugin</artifactId>
                <version>3.1</version>
                <configuration>
                    <source>${java.version}</source>
                    <target>${java.version}</target>
                </configuration>
            </plugin>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-shade-plugin</artifactId>
                <version>2.3</version>
                <executions>
                    <execution>
                        <phase>package</phase>
                        <goals>
                            <goal>shade</goal>
                        </goals>
                        <configuration>
                            <minimizeJar>false</minimizeJar>
                            <createDependencyReducedPom>false</createDependencyReducedPom>
                            <artifactSet>
                                <includes></includes>
                            </artifactSet>
                        </configuration>
                    </execution>
                </executions>
            </plugin>
        </plugins>
    </build>

</project>
```

#### 编写代码

- `DateExtractUDF.java` 需要注意的是
    - 建议继承 org.apache.hadoop.hive.ql.udf.generic.GenericUDF 如果继承UDF 的话会通过反射调用效率相对较低
    - 小心处理异常，一旦有一个异常，任务就会失败

```java

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

import com.wanasit.chrono.Chrono;
import com.wanasit.chrono.ParsedResult;

import org.apache.hadoop.hive.ql.exec.Description;
import org.apache.hadoop.hive.ql.exec.UDFArgumentException;
import org.apache.hadoop.hive.ql.exec.UDFArgumentLengthException;
import org.apache.hadoop.hive.ql.metadata.HiveException;
import org.apache.hadoop.hive.ql.udf.generic.GenericUDF;
import org.apache.hadoop.hive.serde2.objectinspector.ObjectInspector;
import org.apache.hadoop.hive.serde2.objectinspector.ObjectInspectorFactory;
import org.apache.hadoop.hive.serde2.objectinspector.primitive.IntObjectInspector;
import org.apache.hadoop.hive.serde2.objectinspector.primitive.LongObjectInspector;
import org.apache.hadoop.hive.serde2.objectinspector.primitive.PrimitiveObjectInspectorFactory;
import org.apache.hadoop.hive.serde2.objectinspector.primitive.StringObjectInspector;

/**
 * @Example
 */
@Description(name = "date_extract_from_human_language", value = "_FUNC_(human_language, ref_date: bigint|int second timestamp) - extract array<date> from human language string")
public class DateExtractUDF extends GenericUDF {

    private StringObjectInspector humanLanguageStringOI;
    private LongObjectInspector refDateLongOI;
    private IntObjectInspector refDateIntOI;
    private SimpleDateFormat simpleDateFormat = new SimpleDateFormat("yyyy-mm-dd hh:mm:ss");
    private Date now;
    // private ListObjectInspector resultOI;

    @Override
    public ObjectInspector initialize(ObjectInspector[] arguments) throws UDFArgumentException {
        if (arguments.length <= 0 || arguments.length >= 3) {
            throw new UDFArgumentLengthException(
                    "parameter error: except date_extract_from_human_language(human_language: string, ref_date = now)");
        }
        ObjectInspector first = arguments[0];
        if (!(first instanceof StringObjectInspector)) {
            throw new UDFArgumentException("first argument must be a string");
        }
        if (arguments.length == 1) {
            now = new Date();
        }
        if (arguments.length == 2) {
            ObjectInspector second = arguments[1];
            if (second instanceof LongObjectInspector) {
                refDateLongOI = (LongObjectInspector) second;
            } else if (second instanceof IntObjectInspector) {
                refDateIntOI = (IntObjectInspector) second;
            } else {
                throw new UDFArgumentException("second argument must be a long / int second timestamp");
            }
        }

        this.humanLanguageStringOI = (StringObjectInspector) first;
        return ObjectInspectorFactory
                .getStandardListObjectInspector(PrimitiveObjectInspectorFactory.javaStringObjectInspector);
    }

    @Override
    public Object evaluate(DeferredObject[] arguments) throws HiveException {
        try {
            if (arguments == null || arguments.length == 0 || arguments[0] == null) {
                return new ArrayList<>(0);
            }
            String str = humanLanguageStringOI.getPrimitiveJavaObject(arguments[0].get());
            if (str == null) {
                return new ArrayList<>(0);
            }
            Date refDate = now;
            if (arguments.length >= 2 && arguments[1] != null) {
                if (this.refDateIntOI != null) {
                    int ts = refDateIntOI.get(arguments[1].get());
                    refDate = new Date(ts * 1000L);
                }
                if (this.refDateLongOI != null) {
                    long ts = refDateLongOI.get(arguments[1].get());
                    refDate = new Date(ts * 1000L);
                }
            }

            List<ParsedResult> parsedResults = Chrono.Parse(str, refDate);
            return parsedResults.stream().flatMap(p -> {
                List<String> r = new ArrayList<>(2);
                Date d;
                try {
                    if (p.start != null) {
                        d = p.start.date();
                        if (d != null) {
                            r.add(simpleDateFormat.format(d));
                        }
                    }
                    if (p.end != null) {
                        d = p.end.date();
                        if (d != null) {
                            r.add(simpleDateFormat.format(d));
                        }
                    }
                } catch (NullPointerException e) {
                    // Chrono 库有问题，会抛空指针异常
                }
                return r.stream();
            }).collect(Collectors.toList());
        } catch (NullPointerException e) {
            return new ArrayList<>(0);
        }
    }

    @Override
    public String getDisplayString(String[] children) {
        return "date_extract_from_human_language(human_language:string, ref_date=now)";
    }
}
```

#### 打包并上传到 HDFS

```bash
mvn package
hadoop fs -put -f target/date-extract-udf-1.0.0.jar hdfs://path/to
```

#### 在 Spark SQL 中使用

```sql
create temporary function date_extract_from_human_language as 'xxx.xxx.xxx.DateExtractUDF' using jar 'hdfs://path/to/date-extract-udf-1.0.0.jar';
```

### Transform (Python为例)

Chrono-java 虽然可以实现，但是支持日文和英文，而其他 Java 的库又不支持多语言。而一个Python库却可以实现多语言支持 https://github.com/scrapinghub/dateparser 。因此需要实现一个 Transform

#### 创建项目和依赖

```bash
mkdir dateparser-udf
cd dateparser-udf
# 创建虚拟环境，注意不能使用 link 必须拷贝过来
virtualenv venv --always-copy
echo 'dateparser' > requirements.txt
source venv/bin/activate
pip install -r requirements.txt
```

**需要注意的是**

- 因为Yarn集群一般运行在Linux环境，所以代码必须在，Linux开发。否则如果在Mac开发的话，一些 so 文件在Yarn环境是无法执行的
- Transform程序需要运行在 Yarn 环境，而Yarn 环境不一定有 Python 环境，因此需要将代码和环境都打成targz包，防止在HDFS中，因此必须通过 virtualenv venv --always-copy 创建运行环境
- 为了方式产生 .pyc，在测试的时候最好导出环境变量 export PYTHONDONTWRITEBYTECODE=1

#### 编写 Transform

Transform 程序就是一个普通的命令行程序，Hive 与 Transform 程序 通过 标准IO交互。因此代码类似于如下效果

```python
# -*- coding: UTF-8 -*-

from __future__ import print_function

import os
import sys
import time
import datetime

from dateparser import search

'''
第一个参数 human_language: string
第二个参数 ref_date: number
剩下的0到n个参数 others

@return array<string>, others
'''

for line in sys.stdin:
    line = line.strip()
    fields = line.split('\t')

    if len(fields) < 2:
        raise AttributeError('At least 2 parameters are required (human_language, ref_date [, ...])')
    string = fields[0]
    try:
        ref_time = float(fields[1])
    except ValueError as e:
        raise AttributeError(
            'second argument must be a second timestamp number')

    ref_date = datetime.datetime.fromtimestamp(ref_time)
    datetime_arr = search.search_dates(
        string, settings={'RELATIVE_BASE': ref_date})
    if datetime_arr is None:
        result_arr = []
    else:
        result_arr = map(lambda d: '"{}"'.format(d[1].strftime('%Y-%m-%d %H:%M:%S')), datetime_arr)

    result = ['[{}]'.format(','.join(result_arr))]
    result.extend(fields[2:])
    print('\t'.join(result))

```

需要注意的是

- transform 是关键字不是函数，一旦使用了 transform 就不能使用其他字段了，也就是说如下写法是非法

```sql
select
    a,
    transform(b) using 'dateparser-udf.tgz/dateparser-udf/venv/bin/python dateparser-udf.tgz/dateparser-udf/date_extract_from_human_language.py' as b
```

- 应该写成

select
    transform(b,a) using 'dateparser-udf.tgz/dateparser-udf/venv/bin/python dateparser-udf.tgz/dateparser-udf/date_extract_from_human_language.py' as b,a

- 所以代码中需要接受更多原本可以放在 select 后面的参数
- 此外，因为使用 `\t` 分割列，`\n` 分割行，若数据中 `\t` 或 `\n` 将会错位，在调用的时候需要预处理，`regexp_replace('2020-03-01\tfsadfa', '[\\t\\n]', ' ')`（需要使用2个反斜线转移）
- 仔细检查异常抛出情况
- 不得已情况下再使用，性能较差

#### 打包 并 上传到HDFS中

```bash
tar -zcvf  dateparser-udf.tgz dateparser-udf
hadoop fs -put -f dateparser-udf.tgz hdfs://path/to
```

#### 在 SQL 中使用

```sql
add ARCHIVE hdfs://path/to/dateparser-udf.tgz;
select
    transform(regexp_replace('2020-03-01\tfsadfa', '\t', ' '), UNIX_TIMESTAMP(), 'a', null, 1)
    using 'dateparser-udf.tgz/dateparser-udf/venv/bin/python dateparser-udf.tgz/dateparser-udf/date_extract_from_human_language.py'
    as date_info, a, b, c
```

**需要注意的是**

- using 子句中 要使用 venv/bin/python 的 Python
- 只能使用 hive 执行
