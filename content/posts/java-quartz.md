---
title: "Java Quartz"
date: 2020-07-01T21:24:22+08:00
draft: false
toc: true
comments: true
tags:
  - java
---

> Version: 2.3.2
> 实验代码：https://github.com/rectcircle/quartz-learn

参考：

* [官网](http://www.quartz-scheduler.org/)

## 简介

Quartz是的开源作业调度库，可以应用于各种小型或者大型系统。

（Python 有 APScheduler）

## 快速开始

> 参考： http://www.quartz-scheduler.org/documentation/quartz-2.3.0/quick-start.html

### 创建 Maven 项目

略

### 添加 Maven 依赖

```xml
<dependency>
    <groupId>org.quartz-scheduler</groupId>
    <artifactId>quartz</artifactId>
    <version>2.3.2</version>
</dependency>
```

### 编写配置文件

`src/main/resources/quartz.properties`

```properties
org.quartz.scheduler.instanceName = MyScheduler
org.quartz.threadPool.threadCount = 3
org.quartz.jobStore.class = org.quartz.simpl.RAMJobStore
```

* org.quartz.scheduler.instanceName 实例名
* org.quartz.threadPool.threadCount 线程池线程数
* org.quartz.jobStore.class job 存储方式，org.quartz.simpl.RAMJobStore 为内存方式，重启后丢失

### 编写 测试 Job

`src/main/java/cn/rectcircle/learn/quartz/HelloJob.java`

```java
package cn.rectcircle.learn.quartz;

import org.quartz.Job;
import org.quartz.JobExecutionContext;
import org.quartz.JobExecutionException;

public class HelloJob implements Job {

    @Override
    public void execute(JobExecutionContext context) throws JobExecutionException {
        System.out.println("被调度运行");
    }

}
```

### 编写主程序

`src/main/java/cn/rectcircle/learn/quartz/QuartzQuickStart.java`

```java
package cn.rectcircle.learn.quartz;

import org.quartz.JobDetail;
import org.quartz.Scheduler;
import org.quartz.SchedulerException;
import org.quartz.SimpleScheduleBuilder;
import org.quartz.Trigger;
import org.quartz.TriggerBuilder;
import org.quartz.impl.StdSchedulerFactory;
import org.quartz.JobBuilder;


public class QuartzQuickStart {

    public static void main(String[] args) throws InterruptedException {

        try {
            // 从工厂获取Scheduler实例
            Scheduler scheduler = StdSchedulerFactory.getDefaultScheduler();

            // 然后开始
            scheduler.start();

            // 定义工作并将其绑定到我们的HelloJob类
            JobDetail job = JobBuilder.newJob(HelloJob.class).withIdentity("job1", "group1").build();

            // 触发作业立即运行，然后每40秒重复一次
            Trigger trigger = TriggerBuilder.newTrigger().withIdentity("trigger1", "group1").startNow()
                    .withSchedule(
                            SimpleScheduleBuilder.simpleSchedule().withIntervalInSeconds(40).repeatForever()).build();

            // 告诉 quartz 使用我们的 trigger 调度 job
            scheduler.scheduleJob(job, trigger);

            Thread.sleep(60000);

            // 停止
            scheduler.shutdown();

        } catch (SchedulerException se) {
            se.printStackTrace();
        }
    }
}
```

核心流程

* 编程流程
    * 创建 Scheduler，用于 管理 Job 和 触发器
    * 创建 JobDetail 封装一个 Job
    * 创建 Trigger
    * 将 Job 和 Trigger 注册到 Scheduler，用于 中
* 调度流程
    * Scheduler 检测 Trigger 是否被触发
    * 如果被触发，将在工作线程中 执行 JobDetail 中 Job 对象 的 execute 方法

## Tutorials

### 核心接口概述

* `org.quartz.Scheduler` - 调度器，一般通过 `StdSchedulerFactory.getDefaultScheduler()` 创建，该方式会读取 `quartz.properties`
* `org.quartz.Job` - 用户定义的认为作业需要实现该接口，类似于 `java.lang.Runner`.
* `org.quartz.JobDetail` - 包装 `Job` 附加一些信息，通过 `JobBuilder` 创建
* `org.quartz.Trigger` - 定于触发规则
* `org.quartz.JobBuilder` - JobDetail 构建器
* `org.quartz.TriggerBuilder` - Trigger 构建器

### Builder

quartz 提供了大量方便的构建器，用来创建各种实体。

```java
import static org.quartz.JobBuilder.*;
import static org.quartz.SimpleScheduleBuilder.*;
import static org.quartz.CronScheduleBuilder.*;
import static org.quartz.CalendarIntervalScheduleBuilder.*;
import static org.quartz.TriggerBuilder.*;
import static org.quartz.DateBuilder.*;
```

### `Identities` 标识符

一般指 JobKey 和 TriggerKey 对象，由 group 和 name 唯一确定，与 JobDetail 和 Trigger 关联

### `Scheduler`

用来管理 Job，可以添加删除列出Job，在 `start()` 之前不会触发调，常见 API 如下

```java
scheduler.start();  // 启动
scheduler.shutdown();  // 停止
scheduler.scheduleJob(job, trigger);  // 使用触发器调度job
scheduler.clear();  // 清空
// ...
```

### `Job`

```java
package org.quartz;

public interface Job {

    public void execute(JobExecutionContext context)
        throws JobExecutionException;
}
```

当作业的触发器触发时，调度程序的工作线程之一将调用 `execute` 方法。

传递给此方法的 `JobExecutionContext` 对象为作业实例提供有关其“运行时”环境的信息 —— 执行该作业的Scheduler的句柄，触发执行的Trigger的句柄，作业的JobDetail对象以及其他一些项目。

另外，每次被调度，都会创建一个新的 Job 对象，因此无法通过成员变量在多次调度中共享状态。

quartz 提供了一种数据共享方式：JobDataMap，通过 execute 函数 的 context 对象可以获取，JobDataMap存放的值必须实现 Serializable，另外，默认的 JobFactory 会 注入 `JobDataMap` 到成员变量中

```java
// 定义
        Scheduler scheduler = StdSchedulerFactory.getDefaultScheduler();
        // name "myJob", group "group1"
        JobDetail job = JobBuilder
                .newJob(DumbJob.class)
                .withIdentity("myJob", "group1")
                .storeDurably(true)
                .usingJobData("jobSays", "Hello World!")
                .usingJobData("myFloatValue", 3.141f)
                .build();

        scheduler.start();
        scheduler.addJob(job, false);
        scheduler.triggerJob(JobKey.jobKey("myJob", "group1"));
        Thread.sleep(100);
        scheduler.shutdown();

// 使用
package cn.rectcircle.learn.quartz;

import org.quartz.Job;
import org.quartz.JobDataMap;
import org.quartz.JobExecutionContext;
import org.quartz.JobExecutionException;
import org.quartz.JobKey;

public class DumbJob implements Job {

    private String jobSays;
    private float myFloatValue;

    public DumbJob() {
    }

    public void execute(JobExecutionContext context) throws JobExecutionException {
        JobKey key = context.getJobDetail().getKey();

        JobDataMap dataMap = context.getJobDetail().getJobDataMap();

        String jobSays = dataMap.getString("jobSays");
        float myFloatValue = dataMap.getFloat("myFloatValue");

        System.err.println("Instance " + key + " of DumbJob says: " + jobSays + ", and val is: " + myFloatValue);
        System.err.println("Instance " + key + " of DumbJob says: " + this.jobSays + ", and val is: " + this.myFloatValue);
    }

    public String getJobSays() {
        return jobSays;
    }

    public void setJobSays(String jobSays) {
        this.jobSays = jobSays;
    }

    public float getMyFloatValue() {
        return myFloatValue;
    }

    public void setMyFloatValue(float myFloatValue) {
        this.myFloatValue = myFloatValue;
    }
}
```

Job 的并发性，在 Job 类上添加如下注解可以控制并发性

* `@DisallowConcurrentExecution` 同一时刻禁止并发执行同一 Job
* `@PersistJobDataAfterExecution` 允许在execute中更新 JobData 后，不加更新不会传递到下次执行（添加该注解一定要添加 `@DisallowConcurrentExecution` 防止竞态条件）

Job、JobDetail 和 Job “Instances”

Job 的其他属性

* Durability
    * 默认 false
    * false 表示 一旦 不关联 触发器，就会自动将其从 Scheduler 中删除。换句话说，非持久性工作的寿命受其触发器的存在限制。
    * true 表示 Job 可以脱离 触发器独立存在于 Scheduler
* RequestsRecovery
    * 默认 false
    * true 表示在 Scheduler 在 Job 执行期间 hard shutdown（即，它在崩溃中运行的进程或机器已关闭），则当该作业重新启动时，将重新执行该作业。调度程序再次启动。在这种情况下，`JobExecutionContext.isRecovering()` 方法将返回true。

Job execute 允许抛出的唯一异常是 `JobExecutionException`，因此通常需要使用 try-catch 包裹全部 execute 代码

### `Trigger`

常用的有 SimpleTrigger 和 CronTrigger.

#### 通用属性

* triggerKey - 唯一表示
* jobKey - 一个 Trigger 只能绑定一个 Job
* startTime - 时钟在 startTime 时间之后才会触发，java.util.Date 类型
* endTime - 时钟在 endTime 时间之前才会触发，java.util.Date 类型
* Priority 优先级 默认 为 5，可以设置任意整数，数值越大，优先级越高

#### 失火指令

失火表示 触发器错过了调度时间，失火指令表示发生时候后的处理方式，不同触发器处理不同， 使用 `org.quartz.jobStore.misfireThreshold` 参数配置超时。比如期望 12:00 触发，但是实际上调度发生在 12:06，阈值设置为 5 分钟，则会触发失火。

更多参见：https://www.cnblogs.com/pzy4447/p/5201674.html

#### Calendars 日历

可以在定义触发器并将其存储在调度程序中时将Quartz Calendar对象（不是java.util.Calendar对象）与触发器关联。日历对于从触发器的触发时间表中排除时间段很有用。例如，您可以创建一个触发器，该触发器在每个工作日的上午9:30触发工作，然后添加一个日历，其中排除了企业的所有假期。日历可以是任何实现日历接口的可序列化对象，如下所示：

```java
package org.quartz;

public interface Calendar {

  public boolean isTimeIncluded(long timeStamp);

  public long getNextIncludedTime(long timeStamp);

}
```

常用的有 `org.quartz.impl.HolidayCalendar`

#### 常用触发器之SimpleTrigger

用于在某个固定时间点启动，并每隔固定时间触发指定次数，到某个时间结束的场景

更多例子参见 http://www.quartz-scheduler.org/documentation/quartz-2.3.0/tutorials/tutorial-lesson-05.html

失火说明：https://www.cnblogs.com/pzy4447/p/5201674.html

#### 常用触发器之CronTriggers

Cron-Expressions用于配置CronTrigger的实例。Cron-Expression是实际上由七个子表达式组成的字符串，它们描述了日程表的各个细节。这些子表达式用空格分隔，代表：

* Seconds
* Minutes
* Hours
* Day-of-Month
* Month
* Day-of-Week
* Year (optional field)

更多参见 http://www.quartz-scheduler.org/documentation/quartz-2.3.0/tutorials/tutorial-lesson-06.html
和 http://www.quartz-scheduler.org/documentation/quartz-2.3.0/tutorials/crontrigger.html

### TriggerListeners 和 JobListeners

`org.quartz.TriggerListener` 接口

```java
public interface TriggerListener {

    public String getName();

    public void triggerFired(Trigger trigger, JobExecutionContext context);

    public boolean vetoJobExecution(Trigger trigger, JobExecutionContext context);

    public void triggerMisfired(Trigger trigger);

    public void triggerComplete(Trigger trigger, JobExecutionContext context,
            int triggerInstructionCode);
}
```

`org.quartz.JobListener` 接口

```java
public interface JobListener {

    public String getName();

    public void jobToBeExecuted(JobExecutionContext context);

    public void jobExecutionVetoed(JobExecutionContext context);

    public void jobWasExecuted(JobExecutionContext context,
            JobExecutionException jobException);

}
```

使用方式 继承 `JobListenerSupport` 和 `TriggerListenerSupport` 类，然后通过如下命令注册

```java
scheduler.getListenerManager().addJobListener(myJobListener, KeyMatcher.jobKeyEquals(new JobKey("myJobName", "myJobGroup")));
```

### SchedulerListeners

`org.quartz.SchedulerListener` 接口

```java
public interface SchedulerListener {

    public void jobScheduled(Trigger trigger);

    public void jobUnscheduled(String triggerName, String triggerGroup);

    public void triggerFinalized(Trigger trigger);

    public void triggersPaused(String triggerName, String triggerGroup);

    public void triggersResumed(String triggerName, String triggerGroup);

    public void jobsPaused(String jobName, String jobGroup);

    public void jobsResumed(String jobName, String jobGroup);

    public void schedulerError(String msg, SchedulerException cause);

    public void schedulerStarted();

    public void schedulerInStandbyMode();

    public void schedulerShutdown();

    public void schedulingDataCleared();
}
```

添加 一个 SchedulerListener:

```java
scheduler.getListenerManager().addSchedulerListener(mySchedListener);
```

删除 一个 SchedulerListener:

```java
scheduler.getListenerManager().removeSchedulerListener(mySchedListener);
```

### Job Stores

Job Store 用于存储作业运行过程中的各种状态数据。

切勿在代码中直接使用JobStore实例。由于某些原因，许多人试图这样做。JobStore用于Quartz本身的幕后使用。您必须（通过配置）告诉Quartz使用哪个JobStore，但是您仅应在代码中使用Scheduler接口。

#### RAMJobStore

RAMJobStore是使用最简单的JobStore，也是性能最高的（就CPU时间而言）。RAMJobStore的名称很明显：将所有数据保留在RAM中。这就是为什么它闪电般的速度，以及它如此简单的配置。缺点是当您的应用程序结束（或崩溃）时，所有调度信息都将丢失-这意味着RAMJobStore无法接受作业和触发器上的“非易失性”设置。对于某些应用程序，这是可以接受的，甚至是所需的行为，但是对于其他应用程序，这可能是灾难性的。

配置方式

```properties
org.quartz.jobStore.class = org.quartz.simpl.RAMJobStore
```

#### JDBCJobStore

JDBCJobStore也被恰当地命名-它通过JDBC将所有数据保存在数据库中。因此，它的配置要比RAMJobStore复杂一些，并且速度也不快。但是，性能下降并不是很糟糕，尤其是如果您使用主键上的索引构建数据库表时。在具有相当不错的局域网（在调度程序和数据库之间）的相当现代的一组计算机上，检索和更新触发触发器的时间通常少于10毫秒。

JDBCJobStore几乎可以与任何数据库一起使用，它已被Oracle，PostgreSQL，MySQL，MS SQLServer，HSQLDB和DB2广泛使用。要使用JDBCJobStore，必须首先创建一组数据库表供Quartz使用。您可以在Quartz发行版的“ docs / dbTables”目录中找到创建表的SQL脚本。如果没有针对您的数据库类型的脚本，只需查看现有脚本之一，然后以数据库所需的任何方式对其进行修改。需要注意的一件事是，在这些脚本中，所有表均以前缀“ QRTZ_”开头（例如表“ QRTZ_TRIGGERS”和“ QRTZ_JOB_DETAIL”）。只要您告知JDBCJobStore前缀是什么（在Quartz属性中），该前缀实际上就可以是您想要的任何前缀。使用不同的前缀对于在同一数据库中为多个调度程序实例创建多组表可能很有用。

创建表之后，在配置和启动JDBCJobStore之前，您需要做出另一个重要决定。您需要确定您的应用程序需要哪种事务类型。如果您不需要将调度命令（例如添加和删除触发器）与其他事务绑定，则可以让Quartz通过将JobStoreTX用作JobStore来管理事务（这是最常见的选择）。

如果您需要Quartz与其他事务一起工作（即在J2EE应用程序服务器中），则应使用JobStoreCMT-在这种情况下，Quartz将允许应用程序服务器容器管理事务。

最后一个难题是设置一个数据源，JDBCJobStore可以从该数据源获得与您的数据库的连接。数据源是使用几种不同方法之一在Quartz属性中定义的。一种方法是让Quartz通过提供数据库的所有连接信息来创建和管理DataSource本身。另一种方法是通过提供JDBCJobStore数据源的JNDI名称，使Quartz使用由Quartz在其中运行的应用程序服务器管理的数据源。有关属性的详细信息，请查阅“ docs / config”文件夹中的示例配置文件。

配置方式

```properties
org.quartz.jobStore.class = org.quartz.impl.jdbcjobstore.JobStoreTX
org.quartz.jobStore.driverDelegateClass = org.quartz.impl.jdbcjobstore.StdJDBCDelegate  # mysql支持
org.quartz.jobStore.tablePrefix = QRTZ_
org.quartz.jobStore.dataSource = myDS
org.quartz.jobStore.useProperties = true # 表示 JobDataMaps 中的值都是字符串（安全的选择）
```

#### TerracottaJobStore

存储在 Terracotta 缓存服务器

### 配置、资源使用和SchedulerFactory

在Quartz进行工作之前，需要配置的主要组件是：

* ThreadPool
* JobStore
* DataSources (if necessary)
* The Scheduler itself

#### StdSchedulerFactory

StdSchedulerFactory是org.quartz.SchedulerFactory接口的实现。它使用一组属性（java.util.Properties）创建和初始化Quartz Scheduler。这些属性通常存储在文件中并从文件中加载，但是也可以由程序创建并直接交给工厂。只需在工厂上调用getScheduler（）即可生成调度程序，对其进行初始化（及其ThreadPool，JobStore和DataSources），并将句柄返回其公共接口。Quartz发行版的“ docs / config”目录中有一些示例配置（包括属性说明）。您可以在Quartz文档的“参考”部分下的“配置”手册中找到完整的文档。

#### DirectSchedulerFactory

不建议使用

#### Logging

Quartz使用SLF4J框架来满足其所有日志记录需求。为了“调整”日志记录设置（例如输出量以及输出的输出位置），您需要了解SLF4J框架，这不在本文档的讨论范围之内。如果要捕获有关触发器触发和作业执行的其他信息，则可能对启用org.quartz.plugins.history.LoggingJobHistoryPlugin和/或org.quartz.plugins.history.LoggingTriggerHistoryPlugin感兴趣。

## 集群

当前群集模式可 与 JDBC-Jobstore（JobStoreTX或JobStoreCMT）和TerracottaJobStore一起使用。

功能包括负载平衡和作业故障转移（如果JobDetail的“请求恢复”标志设置为true）。

使用JobStoreTX或JobStoreCMT进行群集通过将 `org.quartz.jobStore.isClustered` 属性设置为 `true` 来启用群集。

集群中的每个实例都应使用 `quartz.properties` 大体相同（最好完全相同）

不同实例允许不同的属性为

* `org.quartz.threadPool.threadCount` 线程池
* `org.quartz.scheduler.instanceId` （可以通过 AUTO 配置自动生成id）

更多参见

* https://www.cnblogs.com/MrSaver/p/11835374.html
* https://www.cnblogs.com/zhenyuyaodidiao/p/4755649.html

必须保持集群间时间同步

## SpringBoot整合

> spring boot version: 2.3.1.RELEASE

参考：

* https://docs.spring.io/spring-boot/docs/current/reference/html/spring-boot-features.html#boot-features-quartz
* https://www.baeldung.com/spring-quartz-schedule

### 添加依赖

```xml
		<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-starter-quartz</artifactId>
		</dependency>
```

该 Starter 会 创建如下 Bean 在 Application Context （参见 `org.springframework.boot.autoconfigure.quartz.QuartzAutoConfiguration` ），`org.springframework.scheduling.quartz.SchedulerFactoryBean`，该 FactoryBean 会创建一个 `org.quartz.Scheduler`

`SchedulerFactoryBean` 在构建 `Scheduler` 过程中会扫描 Bean 工厂中的如下对象，并注册到 `Scheduler` 中

* `org.quartz.JobDetail` （因此必须是 Durability ）
* `org.quartz.Calendar`
* `org.quartz.Trigger`

此外 `SchedulerFactoryBean` 会 使用 支持 Spring 自动注入的 `org.quartz.spi.JobFactory`：`org.springframework.scheduling.quartz.SpringBeanJobFactory`。因此，自定义的 Job 支持 `@Autowired` 注入 Bean

### 使用

* 针对静态调度方式：直接创建 `Trigger` Bean 即可
* 针对动态调度方式：在合适的地方注入 `Scheduler` Bean 手动注册 `Trigger` 即可

Job `src/main/java/cn/rectcircle/learn/quartz/SpringQuartzJob.java`

```java
package cn.rectcircle.learn.quartz;

import org.quartz.Job;
import org.quartz.JobExecutionContext;
import org.quartz.JobExecutionException;
import org.springframework.beans.factory.annotation.Autowired;

import cn.rectcircle.learn.quartz.service.MyServiceImpl;


public class SpringQuartzJob implements Job {

    @Autowired
    private MyServiceImpl testServiceImpl;

    public MyServiceImpl getTestServiceImpl() {
        return testServiceImpl;
    }

    public void setTestServiceImpl(MyServiceImpl testServiceImpl) {
        this.testServiceImpl = testServiceImpl;
    }

    @Override
    public void execute(JobExecutionContext context) throws JobExecutionException {
        testServiceImpl.testMethod();
    }
}
```

配置 `src/main/java/cn/rectcircle/learn/quartz/config/QuartzConfig.java`

```java
package cn.rectcircle.learn.quartz.config;

import org.quartz.JobBuilder;
import org.quartz.JobDetail;
import org.quartz.SimpleScheduleBuilder;
import org.quartz.Trigger;
import org.quartz.TriggerBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import cn.rectcircle.learn.quartz.SpringQuartzJob;

@Configuration
public class QuartzConfig {

    @Bean
    public JobDetail jobDetail() {
        return JobBuilder.newJob().ofType(SpringQuartzJob.class)
                .storeDurably()
                .withIdentity("Qrtz_Job_Detail")
                .withDescription("Invoke Sample Job service...")
                .build();
    }

    @Bean
    public Trigger trigger(JobDetail job) {
        return TriggerBuilder.newTrigger().forJob(job).withIdentity("Qrtz_Trigger").withDescription("Sample trigger")
                .withSchedule(SimpleScheduleBuilder.simpleSchedule().repeatForever().withIntervalInSeconds(100000)).build();
    }
}
```

启动即可
