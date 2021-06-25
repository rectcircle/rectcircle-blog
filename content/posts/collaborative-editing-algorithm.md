---
title: "协同编辑算法"
date: 2021-06-18T20:53:11+08:00
draft: true
toc: true
comments: true
tags:
  - untagged
---

> http://www.alloyteam.com/2019/07/13659/
> https://github.com/Operational-Transformation/ot.js

## 目标

实现多人，多设备，协同编辑。

* 支持多人同时编辑
* 最终一致性，即在所有人停止编辑后，所有用户侧看到内容完全一致
* 支持显示所有编辑者的光标和选中情况
* 支持全局 Undo、Redo（多人同时编辑时，Undo 会撤销掉他人输入的内容），暂不实现用户粒度 Undo
* 支持弱网状态下使用没有异常
* 支持断网恢复

## 单用户编辑行为分析

### 编辑操作

单个用户对编辑器的编辑操作本质上就是对一个字符串（字符数组）的编辑操作，这些编辑操作可以定义为如下函数：

两个原子操作

* `insert(index, string)` 在 index 位置插入字符串 string
* `delete(index, length)` 从 index 位置删除长度 length 的字符串

派生操作

* `replace(index, length, string)` 等价于如下两个原子函数
    * `delete(index, length)`
    * `insert(index, string)`

### 光标操作

除了以上的会改变编辑器内容的编辑操作为，还有一些其他的操作，主要有如下几种

* `force(index)` 获取焦点，并将光标放置到第index个字符的前面位置
* `select(index, length)` 选中某段文本
* `blur()` 失去焦点

### 特别说明

* `force(index)` 函数的 index 的取值范围为 `[0, len(content)]` ，其他函数 `index` 的取值范围为 `[0, len(content))`

### 操作流

用户的对编辑器内容的编辑操作，就是 **编辑操作**函数 的函数的一个数组，在此可以定义为操作流。因此可以推导出如下结论：只要记录下用户的操作流，即可回放用户操作的作用版本。下文称为 Stream

## OT.io

客户端维护三个变量 lockStream lockStream' bufferStream 初始化长度为 0

1. 用户首次操作时，lockStream = lockStream' = 用户操作，此时 lockStream 将不会发生变化
2. 客户端将 lockStream 会发起 push，在接收到 ACK 之前， 以下两种情况可能发生多次
    1. 若用户继续操作对当前文本进行操作，所有操作将 append 到 bufferStream 中
    2. 若有接收到服务端 receivedStream，则对 (lockStream', bufferStream, receivedStream) 执行 transform，并将返回更新 lockStream' bufferStream （最明显的变化是版本号都 + 1）
3. 客户端接收到 ACK 后，将执行 lockStream = lockStream' = bufferStream ，清空 bufferStream，并跳到第 2 步

## 协同编辑（多用户编辑行为分析）

### 核心场景分析

不同于单用户编辑行为，若多用户对同一个文件同时进行编辑，事情将变得复杂一些：每个用户都会产生一个操作流，同时这些用户也会接收到其他用户的操作流，我们需要保证，在最终时刻，每个用户的文本内容完全一致。

为了方便描述，如下只阐述算法的原理，不考性能、存储、数据传输的具体细节。

特别说明的是，数据传输的不稳定性、延时特性是设计过程中需要考虑的重点。

我们可以通过约束简化这个问题：

* 将 Server 端持有的 Stream 作为基准的可信任的 Stream
* Client 端的变更必须基于 Server 端的 Stream 的某个版本来进行
* Client 端和 Server 端位于同一版本的语义是：应用 Stream 得到的文本是一致的即可，不要求 Stream 完全一致

因此假设一个场景，ServerStream 为 ABC，ClientStream 为 AD'，此时将操作 D' 应用到 ServerStream ，本质上就是一个变基操作。即 由 基于 A 的 D'，变换为基于 ABC 的 D。

而此时 为了保证 Client 在接收到 BC 后 和 ServerStream ABCD 版本一致，因此需要通过生成 `(BC)'`，满足 `AD' + (BC)'  = ABCD`，此时通过 diff 算法即可生成 `(BC)'`

![core](/image/collaborative-editing-algorithm-core.png)

### Client 和 Server 交互

共有两个方向的数据流

* Client -> Server
    * Request: (BaseVersion, Stream) - 该 Version 必须是 Server 端返回的 Version
    * Server Handler: 校验 Version 是否存在，不存在返回 ACK-0，否则执行如下操作并返回 ACK-1
        * 将 Stream 变基后的 Stream' 到 ServerStream 中
        * 当前 Session，使用 `Diff(BaseVersionStream + Stream, ServerStream)` 算法，生成新的 下发 Stream，
        * 针对其他 Stream 将，Stream' append 到其 下发 Stream 中
    * Response: ACK-0 或 ACK-1
* Server -> Client
    * Request: (BaseVersion, Stream)
    * Client Handler: 校验 BaseVersion 是否和 Client 的 Version 一致, 不一致返回 ACK-0
    * Response: ACK-0 或 ACK-1

### 数据结构

```go
// 编辑操作
type EditOperation struct {
    Type string
	Version string
    Index uint64
    Length uint64
    String string
}

// 操作流
type Stream struct {
    Operations []EditOperation
}

type ServerEditor struct {
	Stream Stream
	Mutex sync.Mutex // 锁定对Stream的处理
	Sessions []struct {
        Cache Stream // 待发送或发送中的流
        Version string // Cache 基于的版本
        Mutex sync.Mutex // 用于更新 Cache 的锁
    }
}
```

### 核心函数 rebase

![rebase](/image/collaborative-editing-algorithm-rebase.png)

### 核心函数 diff

略
