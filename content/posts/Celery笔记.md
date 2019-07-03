---
title: "Celery笔记"
date: 2019-07-03T10:20:29+08:00
draft: false
toc: true
comments: true
tags:
  - python
---

> http://docs.jinkan.org/docs/celery/
> 实验项目代码： https://github.com/rectcircle/celery-learn

## 安装

```bash
pip install celery
```

## 简介、概念与原理

### 简介

Celery 是 Python 实现的并行分布式框架，对消息队列进行了一步封装。实现了异步任务的任务提交、序列化、消费者调度和结果存储等。

### 相关概念

* broker：消息中间件，用于存放任务信息的存储单元，可以选择RabbitMQ，Redis等
* backend：结果存储，可选特性，用于存储任务执行结果用
* worker：任务执行单元，监听broker中需要执行任务，并运行调度任务，并将结果存放到backend
* client：提交任务， 查询任务结果（开启backend可用）的用户进程

### 原理

```
client  ----提交任务---> broker  <-------监视状态、获取任务信息------->  worker
  |                                                                    |
  |                                                                    |
  |                                                                    | 执行任务
  |                                                                    |
  |                                                                    |
   -------查询结果------> backend <-----------将结果存储到backend----------
```

## 第一个例子

任务（worker） `get_started/tasks.py`

```py
# -*- coding: utf-8 -*-

from celery import Celery
from time import sleep

app = Celery('tasks',
             broker='redis://localhost:6379/1',)


# 在此定义了一个任务
@app.task
def add(x, y):
    print "get_started 消费者开始执行"
    sleep(5)
    result = x + y
    print "get_started 消费者执行结束"
    return result

# 运行该任务： celery -A get_started.tasks worker --loglevel=info
# 并发度默认为cpu核心数
```

执行任务

```bash
celery -A get_started.tasks worker --loglevel=info
```

生产者（client）`get_started/producer.py`

```py
# -*- coding: utf-8 -*-

from get_started.tasks import add


def product():
    print "get_started 生产者 调用开始"
    result = add.delay(4, 4)
    print "get_started 生产这 调用结束"
    return result
```

测试运行`run.py`

```py
# -*- coding: utf-8 -*-

from get_started.producer import product
from celery.result import AsyncResult
from time import sleep


if __name__ == '__main__':
    # 不配置结果backend，将无法拿到结果
    print "====测试不使用backend===="
    task_result1 = product()
    task_result2 = product()
    print type(task_result1)
    print task_result1.task_id, task_result2.task_id
    print task_result1.backend, task_result2.backend

    # while not task_result1.ready():
    #     sleep(.5)
    # print task_result1.result
    # while not task_result2.ready():
    #     sleep(.5)
    # print task_result2.result

```

运行

```bash
python run.py
```
