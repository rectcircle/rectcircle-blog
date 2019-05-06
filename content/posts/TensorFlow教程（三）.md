---
title: TensorFlow教程（三）
date: 2017-08-04T11:42:52+08:00
draft: false
toc: false
comments: true
aliases:
  - /detail/86
  - /detail/86/
tags:
  - 机器学习
---

<script src="https://cdn.bootcss.com/mathjax/2.7.0/MathJax.js?config=default"></script>

> https://www.tensorflow.org/

## 目录
* [四、辅导](#四、辅导)
	* [1、使用GPU](#1、使用GPU)
	* [2、图像识别](#2、图像识别)



## 四、辅导
************************************
以下内容主要讲述：tf使用设备、图形识别、自然语言处理、线性模型
### 1、使用GPU
#### （1）支持的设备
tf支持cpu计算和gpu计算，当支持gpu时，优先在gpu上计算

#### （2）查看设备日志
```py
import tensorflow as tf

# 创建计算图
a = tf.constant([1.0, 2.0, 3.0, 4.0, 5.0, 6.0], shape=[2, 3], name='a')
b = tf.constant([1.0, 2.0, 3.0, 4.0, 5.0, 6.0], shape=[3, 2], name='b')
c = tf.matmul(a, b)

# 创建一个session打开设备日志
sess = tf.Session(config=tf.ConfigProto(log_device_placement=True))
# 运行操作
print(sess.run(c))
```

#### （3） 手工指派设备
使用`with tf.device`指定
```py
# 新建一个graph.
with tf.device('/cpu:0'):
  aa = tf.constant([1.0, 2.0, 3.0, 4.0, 5.0, 6.0], shape=[2, 3], name='aa')
  bb = tf.constant([1.0, 2.0, 3.0, 4.0, 5.0, 6.0], shape=[3, 2], name='bb')
  
cc = tf.matmul(a, b)
# 新建session with log_device_placement并设置为True.
sess = tf.Session(config=tf.ConfigProto(log_device_placement=True))
# 运行这个op.
print (sess.run(cc))
```

#### （4）允许GPU内存增长
默认情况下，tf使用所用的gpu内存，以便于内存碎片整理
...略

#### （5）在多GPU系统里使用单一GPU
默认使用id最小的GPU
使用`with tf.device`指定

#### （6）使用多个GPU
```py
# Creates a graph.
c = []
for d in ['/gpu:2', '/gpu:3']:
  with tf.device(d):
    a = tf.constant([1.0, 2.0, 3.0, 4.0, 5.0, 6.0], shape=[2, 3])
    b = tf.constant([1.0, 2.0, 3.0, 4.0, 5.0, 6.0], shape=[3, 2])
    c.append(tf.matmul(a, b))
with tf.device('/cpu:0'):
  sum = tf.add_n(c)
# Creates a session with log_device_placement set to True.
sess = tf.Session(config=tf.ConfigProto(log_device_placement=True))
# Runs the op.
print(sess.run(sum))
```

### 2、图像识别

