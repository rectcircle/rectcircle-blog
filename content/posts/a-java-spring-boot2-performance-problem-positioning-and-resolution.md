---
title: "一次 SpringBoot2 性能问题的定位和解决"
date: 2021-09-22T22:39:58+08:00
draft: false
toc: true
comments: true
tags:
  - java
---

## 现象

对一个开源项目 https://github.com/eclipse/openvsx 进行一定的改造后，进行了私有化部署。该项目是一个典型的 Java 项目，技术栈如下：

* Java 11
* Spring Boot 2
* Spring Security
* Spring Session
* JPA
* Spring Data Elasticsearch

运行几个月后，出现如下问题：

后端有多台实例，流量大的实例所有接口均非常缓慢，均大于 5 秒，流量小的实例，接口延迟正常。

另外，数据库为多个项目公用，负载本身就很高。

## 定位过程

### 尝试复现

* 使用 IDE 启动 Debug，并连接到生产环境的数据库。
* `curl` 或 Postman 请求Debug，观察延迟。结果：接口延迟正常。
* 使用压测软件 `ab`，进行压测。

```bash
# 安装
sudo apt update
sudo apt install -y apache2-utils
# 压测 QPS 比较高接口
ab -n 10000 -c 100 'http://localhost:xxx/xxx1' # 纯数据库查询 接口
ab -n 10000 -c 100 'http://localhost:xxx/xxx2' # 包含 ES 查询 接口
# 同时在执行压测的时候，另起一个 terminal，curl 其他接口，观察延迟
curl http://localhost:xxx/xxx2
```

* 以上压测结果显示，当压测接口并发度比较高的时候，延迟将上升，且其他包含数据库请求的接口都变得缓慢。

基本可以确认，是数据库的问题。推测是数据库连接池耗尽。

### 问题确认

#### 手动打日志

在压测 QPS 高的接口时，在其他如下逻辑记录，获取一个数据库连接的耗时日志。

```java
long start = 0, end = 0;
var hds =  (HikariDataSource) this.datasource;
try {
    start = System.currentTimeMillis();
    var c = hds.getConnection();
    end = System.currentTimeMillis();
    logger.info("test get connection spend time: " + (end-start));
} catch (SQLException e) {
    e.printStackTrace();
}
```

经测试，发现在并发 100 的场景下，获取一个数据库连接耗时月 4 秒。

#### 打开 Hikari 连接池日志

```yaml
# src/main/resources/application.yml
logging.level.com.zaxxer.hikari.pool.HikariPool: trace
```

同样执行压测，发现，waiting 的申请数据库连接的数目高达 70。

经过以上定位。可以确定，是数据库连接池耗尽导致的性能问题。

## 问题分析

由于该项目使用的是 JPA，即 Hibernate，且存在大量的级联操作。同时 QPS 搞得那个请求，每个请求，均需查询大量的数据。另外随着时间推移，QPS 不断上升，数据库连接池最终被耗尽，导致整体接口响应缓慢。

## 解决方案

以下三种方案，能支持的 QPS 依次增加。

### 方案 1：扩大数据库连接池

该方案，最简单，但是上限就是数据库的连接数。如果数据库负载已经很高了，该方案就无法使用了。

```yaml
# src/main/resources/application.yml
spring:
  datasource:
    type: com.zaxxer.hikari.HikariDataSource
    hikari:
      maximum-pool-size: 100
```

### 方案 2：数据库读写分离

该方案，需数据库实现了读写分离，且 QPS 上限线比单纯数据库连接池方案高很多，且可以通过添加从库的方案进行水平扩容。另外，对业务代码没有侵入较小。是一个比较好方案。

需要特别注意的是，可能存在读写库同步延迟，可能导致不一致。

实现参考：

* [博客 1](https://ethendev.github.io/2018/12/17/JPA-MySQL-read-write-separation/)
* [博客 2](https://juejin.cn/post/6844904175424241677#heading-6)

思路说明（Spring Boot 2）：

* 原本，单数据源，只有一个 DataSource 对象。支持多数据源后，将需要初始化三个 DataSource
    * masterDataSource（可以不放到 Spring 容器中）
    * slaveDataSource （可以不放到 Spring 容器中）
    * dynamicDataSource （注意该数据源不能有名字，必须是 `@Bean` 的方式声明）
* 切换 DataSource，有两种方式
    * 方式 1：根据 `@Transactional` 是否是 ReadOnly 自动切换（没有走通）
    * 方式 2：通过 `ThreadLocal` 实现一个切换 `Context`，来记录切换情况，下文将以本方式为例，注意注意 ThreadLocal 读过一次后就立即设置为默认值，防止在一个线程中的请求，前面的影响后面的。
* 其他依赖 DataSource 的 Spring 组件，防止出现无法写入问题，需手动配置为 `masterDataSource` 数据源。比如 Spring Session，可以通过 `@SpringSessionDataSource` 方式来配置

**配置文件规划**

```yaml
# src/main/resources/application.yml
spring:
  datasource:
    master:
      url: xxx
    slave:
      url: xxx
```

**Java Config**

```java
@Configuration
public class MyConfig {

    @Autowired
    @Qualifier(value = "dataSourceMasterProperties")
    Properties masterProperties;

    @Bean(name = "dataSourceMasterProperties")
    @ConfigurationProperties(prefix = "spring.datasource.master")
    public Properties masterProperties() {
        return new Properties();
    }

    @Autowired
    @Qualifier(value = "dataSourceSlaveProperties")
    Properties slaveProperties;

    @Bean(name = "dataSourceSlaveProperties")
    @ConfigurationProperties(prefix = "spring.datasource.slave")
    public Properties slaveProperties() {
        return new Properties();
    }

    DataSource masterDataSource;

    @Bean("masterDataSource")
    @Qualifier("masterDataSource")
	@SpringSessionDataSource
    public DataSource masterDataSource() {
        if (masterDataSource != null) {
            return masterDataSource;
        }
        HikariDataSource dataSource = new HikariDataSource();
        dataSource.setDataSourceProperties(masterProperties);
        // 其他配置
        masterDataSource = dataSource;
        return dataSource;
    }

    public DataSource slaveDataSource() {
        HikariDataSource dataSource = new HikariDataSource();
        dataSource.setDataSourceProperties(slaveProperties);
        // 其他配置
        return dataSource;
    }

    @Bean
    @Primary
    public DataSource dynamicDataSource() throws IOException {
        Map<Object, Object> targetDataSources = new HashMap<>();
        targetDataSources.put(DynamicRoutingDataSourceContext.MASTER, masterDataSource());
        targetDataSources.put(DynamicRoutingDataSourceContext.SLAVE, slaveDataSource());
        AbstractRoutingDataSource dynamicDataSource = new AbstractRoutingDataSource() {
            @Override
            protected Object determineCurrentLookupKey() {
                try {
                    return DynamicRoutingDataSourceContext.getDataSourceKey();
                } finally {
                    // 一定要 reset
                    DynamicRoutingDataSourceContext.reset();
                }
            }
        };

        dynamicDataSource.setDefaultTargetDataSource(targetDataSources.get(DynamicRoutingDataSourceContext.MASTER));
        dynamicDataSource.setTargetDataSources(targetDataSources);
        return dynamicDataSource;
    }
}
```

**切换数据源 Context**

```java
public class DynamicRoutingDataSourceContext {

    public static final String MASTER = "master";

    public static final String SLAVE = "slave";

    private static final ThreadLocal<String> threadLocalDataSourceKey = new ThreadLocal<>();

    private static void setRoutingDataSourceKey(String dataSource) {
        threadLocalDataSourceKey.set(dataSource);
    }

    public static void setMaster() {
        setRoutingDataSourceKey(MASTER);
    }

    public static void setSlave() {
        setRoutingDataSourceKey(SLAVE);
    }


    public static String getDataSourceKey() {
        var k = threadLocalDataSourceKey.get();
        if (k == null) {
            return MASTER;
        }
        return k;
    }

    public static void reset() {
        threadLocalDataSourceKey.remove();
	}
}
```

**只读的 Service 方法设置为读库**

```java
public XxxDTO getXxx() {
    DynamicRoutingDataSourceContext.setSlave();
    // ...
}
```

### 方案 3：添加缓存

* 通过 Nginx 添加缓存，参考：[博客](https://www.app-scope.com/tutorial/configure-caching-with-nginx.html)。
* 业务侧手动添加缓存。

## 经验教训

* 对性能有一定要求的场景，尽量不要使用 JPA 这种不可控的 ORM。
