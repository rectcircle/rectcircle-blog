---
title: Paxos协议
date: 2018-12-17T19:11:01+08:00
draft: false
toc: false
comments: true
aliases:
  - /detail/181
  - /detail/181/
tags:
  - 分布式
---

* [维基百科](https://zh.wikipedia.org/zh-cn/Paxos%E7%AE%97%E6%B3%95)
* [知乎](https://www.zhihu.com/question/19787937)
* [博客1](http://www.cnblogs.com/woshiweige/p/4521165.html)


目的：

在Paxos结束后再所有的节点的值（value）一致

主要角色：

* proposers 提案者
* acceptors 接受者（审批人）

消息内容：

* 编号n
* 提案（value）

过程：
* prepare阶段：
	* proposer选择一个提案编号n并将prepare请求发送给acceptors中的所有acceptors
	* acceptor收到prepare消息后，如果提案的编号大于它已经回复的所有prepare消息(回复消息表示接受accept)，则acceptor将自己上次接受的提案（value）回复给proposer，并承诺不再回复小于n的提案；
* 批准阶段：
	* 当一个proposer收到了多数acceptors对prepare的回复后，就进入批准阶段。它要向回复prepare请求的acceptors发送accept请求
		* 如果acceptors回复中有已经接受了提案（other-values），就发送`<编号n, other-value>`，其中other-value是编号最大的那一个
		* 如果acceptors回复中没有一个已经接受了提案（other-value），就发送`<编号n, my-value>` 自己的提案（my-value）
	* Acceptor反映
		* 如果acceptor编号大于请求的编号：拒绝
		* 如果acceptor编号等于请求的编号
			* 如果提案（value）没有被设置：设置value
			* 否则拒绝
		* acceptor编号不可能小于请求的编号

在以上连个阶段Acceptor的特点

* 编号会一致更新为最大的
* 提案（value）一旦确定不能改变



