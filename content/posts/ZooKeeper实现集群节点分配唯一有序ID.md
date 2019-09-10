---
title: "ZooKeeper实现集群节点分配唯一有序ID"
date: 2019-09-10T17:01:43+08:00
draft: false
toc: true
comments: true
tags:
  - 分布式
---

## 场景

后端多实例部署的过程中，可能需要为每个实例分配一个指定范围的有序ID，例如存在如下限制：

* 每个实例ID取值范围在 `0~31` 且不可重复
* 当实例下线后（可能直接kill），被分配的id要回收

在开发某项目过程中，就遇到了如上问题。因为没有使用MySQL的自增ID，而是使用了 `Twitter` 的ID生成器。该生成器需要用户提供一个workId，该workId的取值范围是 `0~31`，每个实例不可以重复。因此需要一个机制给每个实例分配一个id。如果ID重复的话则存在出现ID冲突的问题。

## 思路

基于此需求自然想到了ZooKeeper的临时节点功能。利用ZooKeeper可以实现此功能：

* 服务启动时，读取ZooKeeper指定目录下的临时节点
* 遍历临时节点，临时节点的名字取值范围为`0~31`，将`0~31`中不存在临时节点中的放入可用id列表中
* 随机选取一个可用id去ZooKeeper指定目录下创建临时节点，成功，则表示该实例分配的id为此id
* 另外如果与ZooKeeper连接断开，在恢复后需要重新分配id（在如下代码中，使用回调的方式实现）

## 实现

核心代码：

```java
package xxx;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.function.Consumer;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.apache.commons.lang3.RandomUtils;
import org.apache.curator.RetryPolicy;
import org.apache.curator.framework.CuratorFramework;
import org.apache.curator.framework.CuratorFrameworkFactory;
import org.apache.curator.framework.state.ConnectionState;
import org.apache.curator.retry.RetryNTimes;
import org.apache.zookeeper.CreateMode;

import xxx.CommonProperties;

/**
 * 为支持多实例部署zookeeper进行协调（给每个实例分配一个id（0~31），给idService使用）
 */
public class ClusterDeploymentImpl implements ClusterDeployment {

    private Logger logger = LoggerFactory.getLogger(getClass());

    private CuratorFramework curatorFramework;

    private List<Consumer<ClusterDeployment>> listeners = new ArrayList<>();

    public ClusterDeploymentImpl(CommonProperties commonProperties) {
        this.commonProperties = commonProperties;
        RetryPolicy retryPolicy = new RetryNTimes(Integer.MAX_VALUE, 5000);
        CuratorFramework client = CuratorFrameworkFactory.builder()
                    .connectString(commonProperties.getZookeeperAddr())
                    .sessionTimeoutMs(5000)
                    .connectionTimeoutMs(5000)
                    .retryPolicy(retryPolicy)
                .build();
        client.start();
        client.getConnectionStateListenable()
                .addListener((CuratorFramework curatorFramework, ConnectionState connectionState) -> {
                    if (connectionState == ConnectionState.RECONNECTED) {
                        while (true) {
                            try {
                                if (curatorFramework.getZookeeperClient().blockUntilConnectedOrTimedOut()) {
                                    for (Consumer<ClusterDeployment> listener : listeners) {
                                        listener.accept(this);
                                    }
                                    break;
                                }
                            } catch (InterruptedException e) {
                                break;
                            } catch (Exception e) {
                            }
                        }
                    }
                });
        this.curatorFramework = client;
    }

    private CommonProperties commonProperties;

    private int workerId = -1;

    private String processId;

    private String getProcessId() {
        if (processId == null) {
            this.processId = UUID.randomUUID().toString();
        }
        return this.processId;
    }

    @Override
    public void updateWorkerId(boolean forced) throws Exception {
        String path = commonProperties.getZookeeperWorkerIdsPath();
        // 不存在则创建目录
        if (curatorFramework.checkExists().forPath(path) == null) {
            curatorFramework.create()
                    .creatingParentsIfNeeded()
                    // .creatingParentContainersIfNeeded()
                    .withMode(CreateMode.PERSISTENT).forPath(path);
        }
        Set<Integer> ids = curatorFramework.getChildren().forPath(path).stream().map(Integer::parseInt)
                .collect(Collectors.toSet());
        // 如果不是强制的需要检查是否已经占有该id（防止节点占用多个workId）
        if (!forced) {
            for (Integer workerId : ids) {
                try {
                    String processId = new String(curatorFramework.getData().forPath(path + "/" + workerId));
                    if (processId.equals(this.processId)) {
                        this.workerId = workerId;
                        return;
                    }
                } catch (Exception e) {
                    logger.error("get workerId=" + workerId + " data processId error", e);
                }
            }
        }
        List<Integer> availableIds = new ArrayList<>();
        // 获取所有可用id
        for (int i = 0; i < 32; i++) {
            if (!ids.contains(i)) {
                availableIds.add(i);
            }
        }
        // 抢占workId
        while (availableIds.size() > 0) {
            int idx = RandomUtils.nextInt(0, availableIds.size());
            int workerId = availableIds.get(idx);
            availableIds.remove(idx);
            try {
                curatorFramework.create()
                        .creatingParentsIfNeeded()
                        // .creatingParentContainersIfNeeded()
                        .withMode(CreateMode.EPHEMERAL)
                        .forPath(path + "/" + workerId, this.getProcessId().getBytes());
                this.workerId = workerId;
                return;
            } catch (Exception e) {
                logger.error("apply workerId="+ workerId +" processId=" + this.getProcessId() + " error", e);
                continue;
            }
        }
        throw new Exception("please see zookeeper `"+ path +"`, worker_ids are exhausted");
    }

    @Override
    public int getWorkerId() throws Exception {
        if (this.workerId != -1) {
            return this.workerId;
        }
        this.updateWorkerId(true);
        return this.workerId;
    }

    @Override
    public void addReconnectedListener(Consumer<ClusterDeployment> clusterDeployment) {
        this.listeners.add(clusterDeployment);
    }
}
```

Id生成器代理类：在ZooKeeper断开连接重连后自动切换

```java
package xxx;

import java.util.Collection;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import xxx.config.CommonProperties;
import xxx.service.deploy.ClusterDeployment;


public class IdServiceProxy implements IdService {

    private Logger logger = LoggerFactory.getLogger(getClass());

    private IdService idService;

    public  IdServiceProxy(ClusterDeployment clusterDeployment, CommonProperties commonProperties) throws Exception {
        this.idService = new IdServiceTwitter(clusterDeployment.getWorkerId(), commonProperties.getIdDataCenterId());
        logger.info("connect to zookeeper workId={}", clusterDeployment.getWorkerId());
        // 添加重连刷新逻辑
        clusterDeployment.addReconnectedListener((c) -> {
            try {
                int oldWorkerId = c.getWorkerId();
                c.updateWorkerId(false);
                if (oldWorkerId != c.getWorkerId()) {
                    logger.info("reconnected to zookeeper workId={}", c.getWorkerId());
                    this.idService = new IdServiceTwitter(c.getWorkerId(), commonProperties.getIdDataCenterId());
                }
            } catch (Exception e) {
            }
        });
    }

    @Override
    public long nextId() {
        return idService.nextId();
    }

    @Override
    public Collection<Long> nextIds(int num) {
		return idService.nextIds(num);
	}
}
```

生成Bean逻辑

```java
    @ConditionalOnProperty(prefix = "xxx.common", name = "zookeeper-enabled")
    @Bean
    public ClusterDeployment clusterDeployment() {
        return new ClusterDeploymentImpl(commonProperties);
    }

    /**
     * 没使用zookeeper（测试环境直接使用0）
     */
    @ConditionalOnMissingBean(ClusterDeployment.class)
    @Bean(name="idService")
    public IdService idServiceNoZookeeper() {
        return new IdServiceTwitter(commonProperties.getIdWorkerId(), commonProperties.getIdDataCenterId());
    }

    /**
     * 使用了zookeeper（线上模式）
     */
    @ConditionalOnBean(ClusterDeployment.class)
    @Bean(name = "idService")
    public IdService idService(@Autowired ClusterDeployment clusterDeployment) throws Exception {
        return new IdServiceProxy(clusterDeployment, commonProperties);
    }

    @Bean
    public ApplicationContextProvider applicationContextProvider() {
        return new ApplicationContextProvider();
    }
```

相关配置

```yaml
# 是否启用zookeeper协调（目前用于数据库id生成器的workerId）
xxx.common.zookeeper-enabled: true
xxx.common.zookeeper-addr: 10.110.148.25:2181
xxx.common.zookeeper-worker-ids-path: /dw_auto/worker_ids
```

添加依赖如下

```xml
        <dependency>
            <groupId>org.apache.curator</groupId>
            <artifactId>curator-framework</artifactId>
            <version>${curator.version}</version>
            <exclusions>
                <exclusion>
                    <groupId>org.apache.zookeeper</groupId>
                    <artifactId>zookeeper</artifactId>
                </exclusion>
            </exclusions>
        </dependency>
        <dependency>
            <groupId>org.apache.curator</groupId>
            <artifactId>curator-recipes</artifactId>
            <version>${curator.version}</version>
        </dependency>
```
