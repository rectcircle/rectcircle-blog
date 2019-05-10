---
title: ehcache3.2文档（一）
date: 2017-01-17T23:05:27+08:00
draft: false
toc: true
comments: true
aliases:
  - /detail/37
  - /detail/37/
tags:
  - untagged
---

> scala描述

## 〇、相关资源

官方文档：http://www.ehcache.org/documentation/3.2/index.html
scala示例：https://git.oschina.net/null_834/scala-ehcache.git

## 一、快速开始

### 1、配置Ehcache

为了开始使用Ehcache，你需要配置你的第一个CacheManager和Cache。这可以通过编程配置或XML实现。

### 2、使用编程进行配置

与以前版本的Ehcache一样，处理Cache的规范方式是通过CacheManager：

> 以下代码为官方java代码的scala直接翻译

```scala
package com.alvinalexander.testproject

import org.ehcache.{Cache, CacheManager}
import org.ehcache.config.builders.{CacheConfigurationBuilder, CacheManagerBuilder, ResourcePoolsBuilder}

object Hello extends App {

	val cacheManager: CacheManager = CacheManagerBuilder.newCacheManagerBuilder().withCache( //（1）
		"preConfigured",
		CacheConfigurationBuilder.newCacheConfigurationBuilder(
			classOf[java.lang.Long],
			classOf[java.lang.String],
			ResourcePoolsBuilder.heap(10)
		) //（2）
	).build() //（3）

	cacheManager.init() //（4）

	val preConfigured: Cache[java.lang.Long, java.lang.String] = cacheManager.getCache("preConfigured", classOf[java.lang.Long], classOf[java.lang.String]) //（5）

	val myCache: Cache[java.lang.Long, java.lang.String] = cacheManager.createCache("myCache", CacheConfigurationBuilder.newCacheConfigurationBuilder(classOf[java.lang.Long], classOf[java.lang.String], ResourcePoolsBuilder.heap(10)).build()) //（6）

	myCache.put(1L, "da one!") //（7）
	val value: java.lang.String = myCache.get(1L) //（8）

	cacheManager.removeCache("preConfigured") //（9）

	cacheManager.close() //（10）

}
```

代码说明

#### （1）创建`CacheManagerBuilder`

这个静态函数 `org.ehcache.config.builders.CacheManagerBuilder.newCacheManagerBuilder`返回一个 `org.ehcache.config.builders.CacheManagerBuilder` 实例.

#### （2）创建cacheManager是配置一个缓存

使用构造器定义一个叫"preConfigured"的`Cache`。这个`Cache`实际上是`CacheManager`实例调用`cacheManager.build()`方法时创建。第一个`String`类型的参数是用于从`CacheManager`中检索`cache`的名字。第二个参数`org.ehcache.config.CacheConfiguration`用于配置缓存。我们使用`org.ehcache.config.builders.CacheConfigurationBuilder`上的静态`newCacheConfigurationBuilder()`方法来创建默认配置。

#### （3）创建`CacheManager`

最后，调用`build()`返回一个完全实例化的，我们可以使用，但未初始化的`CacheManager`。

#### （4）初始化`CacheManager`

在使用`CacheManager`之前，需要对其进行初始化，这可以通过以下两种方式之一完成：

* 调用CacheManager实例方法`init()`
* 调用CacheManagerBuilder的实例方法`build(boolean init)`

#### （5）获得一个已经创建的`Cache`

一个`Cache`通过他的名字，key的类型和value的类型来从`CacheManager`检索
例如，要获取在步骤2中声明的缓存，您需要其alias = preConfigured，keyType = Long.class和valueType = String.class。对于类型安全，我们要求传入键和值类型。如果这些不同于我们期望的，`CacheManager`在应用程序生命周期的早期抛出一个`ClassCastException`。这保护了缓存不受随机类型的污染。

#### （6）创建一个cache

`CacheManager`可用于根据需要创建新的`cache`实例。正如在步骤2，它需要传递一个名字以及一个CacheConfiguration。已添加的实例化和完全初始化的缓存将通过CacheManager.getCache API返回和/或访问。

#### （7）向cache中添加条目

新添加的缓存现在可以用于存储由键值对组成条目，put方法的第一个参数是键，第二个参数是值。记住键和值类型必须与在CacheConfiguration中定义的类型相同。此外，键必须是唯一的，并且只与一个值相关联。

#### （8）从cache中获取条目

通过调用`cache.get(key)`方法从缓存检索值。它只需要一个作为键的参数，并返回与该键相关联的值。如果没有与该键相关联的值，则返回null。

#### （9）删除和关闭一个cache

我们对一个cache调用`CacheManager.removeCache(String)`时，CacheManager不仅会删除它对Cache的引用，而且还会关闭它。缓存释放所有本地保存的临时资源（例如内存）。对此缓存的引用无法使用。

#### （10）关闭`CacheManager`

为了释放所有临时资源（内存，线程，...）一个CacheManager提供给它管理的Cache实例，你必须调用CacheManager.close（），它依次关闭当时已知的所有Cache实例。

### 3、创建具有群集支持的缓存管理器

略

### 4、存储层

与以前的版本一样，Ehcache 3提供了分层模型，以允许在较慢层（通常更丰富）上存储不断增加的数据量。

想法是，与更快的存储相关的资源更罕见，但是位于“最热”数据优选的位置。因此，较不热（较不频繁使用）的数据被移动到更丰富但较慢的层。更热的数据被移动到更快的层上。

#### （1）堆外内存

```scala
val cacheManager2:CacheManager = CacheManagerBuilder.newCacheManagerBuilder().withCache(
	"tieredCache",
	CacheConfigurationBuilder.newCacheConfigurationBuilder(
		classOf[java.lang.Long],
		classOf[java.lang.String],
		ResourcePoolsBuilder.newResourcePoolsBuilder()
			.heap(10, EntryUnit.ENTRIES)
			.offheap(10, MemoryUnit.MB) //（1）
	)
)
.build(true)

val tieredCache:Cache[java.lang.Long, java.lang.String] = cacheManager2.getCache("tieredCache",classOf[java.lang.Long], classOf[java.lang.String])

cacheManager2.close()
```

如果你想使用堆外，你必须定义一个资源池，给你想要分配的内存大小。

上面的例子分配了非常少量的堆外。记住离堆存储的数据必须被序列化和反序列化，因此比堆慢。因此，您应该偏好大量数据的堆外，其中堆上对垃圾回收有太大的影响。

不要忘记在java选项中定义`-XX：MaxDirectMemorySize`选项，根据您打算使用的堆外大小。

#### （2）硬盘持久化

略

#### （3）三层存储

略

#### （4）字节大小的堆

略

#### （5）更新ResourcePools

略

### 5、数据新鲜度

在Ehcache中，数据新鲜度通过Expiry控制。以下说明如何配置生存时间到期

```scala
	//配置生存时间到期
val cacheConfiguration:CacheConfiguration [java.lang.Long, java.lang.String]  = CacheConfigurationBuilder.newCacheConfigurationBuilder(
	classOf[java.lang.Long],
	classOf[java.lang.String],
	ResourcePoolsBuilder.heap(100) //（1）
).withExpiry(
	Expirations.timeToLiveExpiration(Duration.of(
		20,
		TimeUnit.SECONDS)//（2）
	)
).build()
```

#### （1）首先配置缓存

Expiry在缓存级别配置，因此，首先定义缓存配置

#### （2）配置过期时间

然后向其添加一个到期时间，此处使用预定义的生存时间，使用所需的持续时间配置。

### 6、使用xml方式配置

```xml
<cache alias="foo"> <!-- （1） -->
	<key-type>java.lang.String</key-type>  <!-- （2） -->
	<resources>
		<heap unit="entries">2000</heap>  <!-- （3） -->
		<offheap unit="MB">500</offheap>  <!-- （4） -->
	</resources>
</cache>

<cache-template name="myDefaults">  <!-- （5） -->
	<key-type>java.lang.Long</key-type>
	<value-type>java.lang.String</value-type>
	<heap unit="entries">200</heap>
</cache-template>

<cache alias="bar" uses-template="myDefaults">  <!-- （6） -->
	<key-type>java.lang.Number</key-type>
</cache>

<cache alias="simpleCache" uses-template="myDefaults" />  <!-- （7） -->
```

为了解析XML配置，您可以使用XmlConfiguration类型：

```scala
//xml配置
val myUrl:URL  = this.getClass().getResource("/my-config.xml")
val xmlConfig:Configuration = new XmlConfiguration(myUrl)
val myCacheManager:CacheManager = CacheManagerBuilder.newCacheManager(xmlConfig)
```
