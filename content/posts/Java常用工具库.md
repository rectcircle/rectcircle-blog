---
title: "Java常用工具库"
date: 2019-12-12T10:35:29+08:00
draft: false
toc: true
comments: true
tags:
  - java
---

## 一、Apache Commons Pool

> 参考： http://kriszhang.com/object-pool/
> 官网： http://commons.apache.org/proper/commons-pool/

### 1、对象池

对象池技术是一种常见的对象缓存手段。’对象’意味着池中的内容是一种结构化实体，这也就是一般意义上面向对象中的对象模型；’池’(或动词池化)意味着将有生命周期的对象缓存到’池子’中进行管理，即用即取。缓存的目的大多是为了提升性能，对象池技术的目的也即如此。所以，对象池技术的本质简单来说就是：将具有生命周期的结构化对象缓存到带有一定管理功能的容器中，以提高对象的访问性能。

对象池的最主要的使用场景是处理网络连接，比如：数据库连接池、RPC连接池等

对象池技术与普通的本地缓存（比如guava cache）区别

* 其一，本地cache可能会有一些失效策略，比如按照时间、访问次数等，而对象池是可以没有这些特性的；
* 其二，也是最重要的一点，缓存中的对象是没有一个完整生命周期的概念，而对象池中的对象是具有生命周期的，我们甚至可以对对象的生命周期施加影响。

### 2、例子

> https://github.com/rectcircle/java-popular-utils/tree/master/src/main/java/cn/rectcircle/learn/popularutils/ch01_commons_pool

模拟一个RPCClient，将要被池化的对象

```java
import java.util.Random;

/**
 * RPCClient：模拟一个RPC的客户端，存在生命周期： <br/>
 * 初始化、连接 -> 远程调用 -> 断连、销毁 <br/>
 * 初始化、连接过程比较昂贵，所以需要对象池进行缓存复用这个RPC链接 <br/>
 */
public class RPCClient {
    private String ip;
    private int port;
    private boolean connected = false;

    private RPCClient(String ip, int port) {
        this.ip = ip;
        this.port = port;
    }

    public static RPCClient build(String ip, int port) {
        RPCClient client = new RPCClient(ip, port);
        client.connect();
        return client;
    }

    // 模拟网络延迟
    private void netDelay() {
        try {
            Thread.sleep((new Random().nextInt(200)));
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
    }

    // 模拟连接
    private boolean connect() {
        this.netDelay();
        this.connected = (new Random()).nextDouble() >= 0.05; // 模拟连接失败
        System.out.println(String.format("连接到 %s:%d", ip, port));
        return this.connected;
    }

    // 模拟远程方法调用
    public <T> T call(String method, Object arg, Class<T> retType) {
        this.netDelay();
        System.out.println(String.format("调用 %s 方法", method));
        return (T) null;
    }

    // 模拟关闭连接
    public void close() {
        this.netDelay();
        System.out.println(String.format("从 %s:%d 断开连接", ip, port));
        this.connected = false;
    }

    public boolean isConnected() {
        return connected;
    }
}
```

#### 第一步、创建工厂要被池化的对象的工厂类

```java
    // 或者继承 org.apache.commons.pool2.BasePooledObjectFactory
    public static class RPCClientFactory implements PooledObjectFactory<RPCClient> {

        private String ip;
        private int port;

        public RPCClientFactory(String ip, int port) {
            this.ip = ip;
            this.port = port;
        }

        @Override
        public void destroyObject(PooledObject<RPCClient> p) throws Exception {
            p.getObject().close();
        }

        @Override
        public PooledObject<RPCClient> makeObject() throws Exception {
            // 构造器
            return new DefaultPooledObject<>(RPCClient.build(ip, port));
        }

        @Override
        public boolean validateObject(PooledObject<RPCClient> p) {
            // 验证对象是否有效
            return p.getObject().isConnected();
        }

        @Override
        public void activateObject(PooledObject<RPCClient> p) throws Exception {
            // 对象被取出 （objectPool.borrowObject 调用）时，执行的操作
            System.out.println("对象被取出，执行的操作");
        }

        @Override
        public void passivateObject(PooledObject<RPCClient> p) throws Exception {
            // 对象被取出 （objectPool.returnObject 调用）时，执行的操作
            System.out.println("对象被归还，执行的操作");
        }
    }
```

#### 第二步、配置并创建对象池

```java
        String ip = "127.0.0.1";
        int port = 5432;

        GenericObjectPoolConfig<RPCClient> config = new GenericObjectPoolConfig<>();
        // ===== 对象池大小相关配置 =====
        // 最大空闲数
        config.setMaxIdle(5);
        // 最小空闲数, 池中只有一个空闲对象的时候，池会在创建一个对象，并借出一个对象，从而保证池中最小空闲数为1
        config.setMinIdle(1);
        // 最大池对象总数
        config.setMaxTotal(20);
        // ===== 逐出相关配置 =====
        // 逐出连接的最小空闲时间 默认1800000毫秒(30分钟)
        config.setMinEvictableIdleTimeMillis(
        // 当idle池的大于MinIdle部分的对象的 逐出连接的最小空闲时间 默认-1，永久不会逐出
        config.setSoftMinEvictableIdleTimeMillis(18000001800000);
        // 逐出扫描的时间间隔(毫秒) 如果为负数,则不运行逐出线程, 默认-1
        config.setTimeBetweenEvictionRunsMillis(1800000 * 2L);
        // 每次逐出检查时 逐出的最大数目 默认3
        config.setNumTestsPerEvictionRun(3);
        // ===== 有效性测试相关配置 =====
        // 在获取对象的时候检查有效性, 默认false
        config.setTestOnBorrow(true);
        // 在归还对象的时候检查有效性, 默认false
        config.setTestOnReturn(false);
        // 在空闲时检查有效性, 默认false
        config.setTestWhileIdle(false);
        // ====== 其他配置 =====
        // 最大等待时间， 默认的值为-1，表示无限等待。
        config.setMaxWaitMillis(5000);
        // 是否启用后进先出, 默认true
        config.setLifo(true);
        // 连接耗尽时是否阻塞, false报异常,true阻塞直到超时, 默认true
        config.setBlockWhenExhausted(true);
        ObjectPool<RPCClient> pool = new GenericObjectPool<>(new RPCClientFactory(ip, port), config);
```

#### 第三步、使用

```java
            RPCClient client = null;
            try {
                client = pool.borrowObject();
                client.call("测试", null, void.class);
            } catch (Exception e) {
                e.printStackTrace();
            } finally {
                if (client != null) {
                    try {
                        pool.returnObject(client);
                        System.out.println("---");
                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                }
            }
        pool.close(); // 关闭对象池
```

注意: **有借有还**，类似锁的使用

### 3、流程说明

* 确定需要池化的类
* 创建给对象的工厂
  * 实现 `PooledObjectFactory` 方法
* 配置并创建对象池
* 使用对象池
  * 调用 `pool.borrowObject`，借用对象
    * 检查是否有空闲状态（idle）的对象，如果有，将该对象标记为已借出状态（allocated），并移出idle池
    * 如果对象池已满且没有空闲状态（idle）的对象
      * 如果配置阻塞，将阻塞等待一段时间，超时后抛异常
      * 如果配置非阻塞，则直接抛出异常
    * 如果对象池没满且没有空闲状态的对象
      * 调用工厂方法 `factory.makeObject` 构造一个新对象，标记为已借出状态（allocated）
    * 调用工厂方法的 `factory.activateObject` 方法执行一些初始化操作
    * 最后返回一个对象
    * 如果设置了对象借出有效性检测 `config.setTestOnBorrow(true)` 将会调用工厂的 `factory.validateObject`
  * 调用 `pool.borrowObject`，归还对象
    * 将对象状态标记为空闲状态（idle）
    * 如果配置了 `config.setTestOnReturn(true)` 将会对该对象进行有效性检查，将会调用工厂的 `factory.validateObject`
    * 调用工厂方法的 `factory.passivateObject` 的执行一些清理工作
    * 如果idle池达到最大值，则清理该对象，否则添加到idle池
* EvictionTimer 驱逐辅助线程
  * 目的：定时清理 Idle 池以节约内存使用
  * 默认的策略（DefaultEvictionPolicy）是：
    * 每次最多清理 `config.setNumTestsPerEvictionRun(3)` 个对象
    * 针对每个对象进行如下测试，满足如下之一的进行驱逐：
      * 对象在上一个空闲状态的时间 大于 `config.setSoftMinEvictableIdleTimeMillis(1800000)` 且 空闲状态对象的数目 大于 `config.setMinIdle(1)`
      * 对象在上一个空闲状态的时间 大于 `config.setMinEvictableIdleTimeMillis(1800000)` 且 不用考虑idle池的数目
    * 上一个空闲状态的时间 指 当前时间减去上次归还时间
* 放逐
  * 目的：方式对象借出时间过长或者超时
  * 配置对象为 `AbandonedConfig`
  * 实现上在借出和归还函数上添加判断
