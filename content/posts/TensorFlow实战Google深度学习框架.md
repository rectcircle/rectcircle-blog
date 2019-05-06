---
title: TensorFlow实战Google深度学习框架
date: 2017-10-19T10:27:42+08:00
draft: false
toc: false
comments: true
aliases:
  - /detail/104
  - /detail/104/
tags:
  - 机器学习
---

<script src="https://cdn.bootcss.com/mathjax/2.7.0/MathJax.js?config=default"></script>

## 目录
* [三、TensorFlow入门](#三、TensorFlow入门)
	* [1、计算模型——计算图](#1、计算模型——计算图)
	* [2、数据模型——张量](#2、数据模型——张量)
	* [3、运行模型——会话](#3、运行模型——会话)
	* [4、实现神经网络](#4、实现神经网络)
* [四、深层神经网络](#四、深层神经网络)
	* [1、激活函数](#1、激活函数)
	* [2、损失函数定义](#2、损失函数定义)
	* [3、神经网络优化算法](#3、神经网络优化算法)
	* [4、神经网络进一步优化](#4、神经网络进一步优化)
* [五、MNIST数字识别问题](#五、MNIST数字识别问题)
	* [1、数据处理](#1、数据处理)
	* [2、神经网络实现](#2、神经网络实现)
	* [3、变量管理](#3、变量管理)
	* [4、模型持久化](#4、模型持久化)


## 三、TensorFlow入门
***************************************
### 1、计算模型——计算图
#### （1）使用
定义计算图
```python
import tensorflow as tf
a = tf.constant([1.0, 2.0], name="a")
b = tf.constant([2.0, 3.0], name="b")
result = a + b
```
系统会创建一个默认的计算图
```python
print(a.graph is tf.get_default_graph())
```
使用`tf.Graph()`创建一个新的计算图
```python
import tensorflow as tf
g1 = tf.Graph()
with g1.as_default():
    v = tf.get_variable("v", [1], initializer = tf.zeros_initializer) # 设置初始值为0

g2 = tf.Graph()
with g2.as_default():
    v = tf.get_variable("v", [1], initializer = tf.ones_initializer())  # 设置初始值为1
    
with tf.Session(graph = g1) as sess:
    tf.global_variables_initializer().run()
    with tf.variable_scope("", reuse=True):
        print(sess.run(tf.get_variable("v")))

with tf.Session(graph = g2) as sess:
    tf.global_variables_initializer().run()
    with tf.variable_scope("", reuse=True):
        print(sess.run(tf.get_variable("v")))
```
使用指定设备
```python
g = tf.Graph()
# 指定运算执行设备
with g.device('/gpu:0'):
	result = a + b
```
可以通过集合管理不同的资源，
* 通过`tf.add_to_collection`将资源加到集合中
* 通过`tf.get_collection(key)`获取所有资源

|集合名称（key）|集合内容|使用场景|
|-------|-------|-------|
|tf.GraphKeys.VARIABLES|所有变量|持久化模型|
|tf.GraphKeys.TRAINABLE_VARIABLES|可学习的变量（一般指神经网络的参数）|训练模型、生成模型可视化的内容|
|tf.GraphKeys.SUMMARIES|日志生成相关张量|计算可视化|
|tf.GraphKeys.QUEUE_RUNNERS|处理 QueueRunner|处理输入|
|tf.GraphKeys.MOVING_AVERAGE_VARIABLES|所有计算滑动平均值的变量|计算滑动平均值|

### 2、数据模型——张量

一个张量主要保存三个属性：名字name、维度shape、类型type
以下代码不会运行计算只会得到一个结果的引用
```python
import tensorflow as tf
a = tf.constant([1.0, 2.0], name="a")
b = tf.constant([2.0, 3.0], name="b")
result = a + b
print(result)
```

#### （1）张量的使用
用途
* 记录中间结果的引用
* 张量可以获取中间结果


### 3、运行模型——会话
#### （1）创建和关闭会话
```python
# 创建一个会话。
sess = tf.Session()

# 使用会话得到之前计算的结果。
print(sess.run(result))

# 关闭会话使得本次运行中使用到的资源可以被释放。
sess.close()
```

#### （2）使用`with`创建会话
```python
with tf.Session() as sess:
    print(sess.run(result))
```

#### （3）指定默认会话
```python
sess = tf.Session()
with sess.as_default():
     print(result.eval())
```
注意
```python
sess = tf.Session()

# 下面的两个命令有相同的功能。
print(sess.run(result))
print(result.eval(session=sess))
```

#### （4）使用`tf.InteractiveSession`构建会话
使用该方法在交互式环境下，可以绑定session对象
```python
sess = tf.InteractiveSession ()
print(result.eval())
sess.close()
```

#### （5）通过ConfigProto配置会话
```python
config=tf.ConfigProto(allow_soft_placement=True, log_device_placement=True)
sess1 = tf.InteractiveSession(config=config)
sess2 = tf.Session(config=config)
```
* `allow_soft_placement=True`时，满足一下任意条件，GPU运算将放在CPU上运行
	* 运算无法在GPU上运算
	* 没有GPU资源 
	* 运算输入包含对CPU计算结果的引用
* `log_device_placement=True`时，会记录每个节点被安排在哪个设备，方便调试。但在生产环境下应当设置为False，减少日志输出


### 4、实现神经网络
#### （1）TensorFlow游乐场
http://playground.tensorflow.org

#### （2）神经网络参数和TensorFlow变量
创建2\*3的矩阵变量的方法，元素值初始化为随机值分布为：均值为0，标准差为2
```python
weights = tf.Variable(tf.random_normal([2,3], stddev=2))
```

##### TensorFlow随机数生成函数

| 函数名称 | 随机数分布 | 主要参数 |
|---------|-----------|----------|
|tf.random_normal | 正太分布 | 平均值、标准差、取值类型 |
|tf.truncated_normal | 正太分布，但如果随机出来的值偏离平均值超过2个标准差，那么这个数将会被重新随机 | 平均值、标准差、取值类型 |
|tf.random_uniform | 平均分布 | 最小、最大取值，取值类型 |
|tf.random_gamma | Gamma分布 | 形状参数 alpha 、尺度参数 beta 、取值类型 |

##### 通过常数初始化一个变量

|函数名称|功能|样例|
|-------|---|-----|
|tf.zeros|生成全0的数组|tf.zeros([2,3],tf.int32)|
|tf.ones|生成全1的数组|tf.ones([2,3],tf.int32)|
|tf.fill|生成全为指定值的数组|tf.fill([2,3],9)|
|tf.constant|产生一个给定值的常量|tf.constant([1,2,3])|

在神经网络中经常使用常数值设置偏置（bias）
```python
biases = tf.Variable(tf.zeros([3]))
```
也可以通过其他变量创建新的变量
```python
w2 = tf.Variable(weights.initialized_value())
w3 = tf.Variable(weights.initialized_value() * 2.0)
```

#### （3）通过变量实现神经网络参数并实现向前传播
```python
import tensorflow as tf

# 声明w1、w2两个变量。这里还通过设置seed参数设定了随机种子
# 这样可以保证每次运行都一直
w1= tf.Variable(tf.random_normal([2, 3], stddev=1, seed=1))
w2= tf.Variable(tf.random_normal([3, 1], stddev=1, seed=1))

# 暂时将输入的特征向量定义为一个常量，为1*2矩阵
x = tf.constant([[0.7, 0.9]])

# 获取输出
a = tf.matmul(x, w1)
y = tf.matmul(a, w2)

sess = tf.Session()
# 初始化变量
sess.run(w1.initializer)
sess.run(w2.initializer)

# 获得输出
print(sess.run(y))
sess.close()
```

一次初始化所有变量
```python
init_op = tf.global_variables_initializer()
sess = tf.Session()
sess.run(init_op)
sess.close()
```

所有的变量将自动添加到 TensorFlow 中的 tf.GraphKeys.VARIABLES	 集合。通过tf.global_variables()可以获取所有变量。通过`trainable`（默认为True）可以将次变量放置于tf.GraphKeys.TRAINABLE_VARIABLES	集合，可以通过tf.trainable_variables()获取

类似张量，维度（shape）和类型（type）是变量最重要的属性，其类型是不可变的。但是维度是不可变的。


#### （4）通过TensorFlow训练神经网络模型
使用tf.placeholder代指训练数据
```python
# 使用tf.placeholder代指训练数据。维度不一定给出
# 显示指定可以减少出错，一般第一维表示样本数指定为None，表示任意
x = tf.placeholder(tf.float32, shape=(None, 2), name="x-input")
y_= tf.placeholder(tf.float32, shape=(None, 1), name='y-input') 
a = tf.matmul(x, w1)
y = tf.matmul(a, w2)

sess = tf.Session()

# 初始化变量
init_op = tf.global_variables_initializer()  
sess.run(init_op)

# 训练模型
print(sess.run(y, feed_dict={x: [[0.7,0.9]]}))
```
其中feed_dict 是一个字典，给予每个用placeholder的取值

增加输入
```python
x = tf.placeholder(tf.float32, shape=(3, 2), name="input")
a = tf.matmul(x, w1)
y = tf.matmul(a, w2)

sess = tf.Session()
#使用tf.global_variables_initializer()来初始化所有的变量
init_op = tf.global_variables_initializer()  
sess.run(init_op)

print(sess.run(y, feed_dict={x: [[0.7,0.9],[0.1,0.4],[0.5,0.8]]})) 
```


定义一个代价函数
```python
# 定义代价函数刻画预测值与真实值之间的差距
cross_entropy = -tf.reduce_mean(y_ * tf.log(tf.clip_by_value(y, 1e-10, 1.0))) 
# 定义学习率
learning_rate = 0.001
# 定义反向传播算法来优化神经网络中的参数
train_step = tf.train.AdamOptimizer(0.001).minimize(cross_entropy)
```

生成模拟数据集
```python
from numpy.random import RandomState
rdm = RandomState(1)
X = rdm.rand(128,2)
Y = [[int(x1+x2 < 1)] for (x1, x2) in X]
```

创建会话运行计算图
```python
batch_size = 8
with tf.Session() as sess:
    init_op = tf.global_variables_initializer()
    sess.run(init_op)
    
    # 输出目前（未经训练）的参数取值。
    print ("w1:", sess.run(w1))
    print ("w2:", sess.run(w2))
    print ("\n")
    
    # 训练模型。
    STEPS = 5000
    for i in range(STEPS):
        start = (i*batch_size) % 128
        end = (i*batch_size) % 128 + batch_size
        sess.run(train_step, feed_dict={x: X[start:end], y_: Y[start:end]})
        if i % 1000 == 0:
            total_cross_entropy = sess.run(cross_entropy, feed_dict={x: X, y_: Y})
            print("After %d training step(s), cross entropy on all data is %g" % (i, total_cross_entropy))
    
    # 输出训练后的参数取值。
    print ("\n")
    print ("w1:", sess.run(w1))
    print ("w2:", sess.run(w2))
```

#### （5）完整的神经网络样例程序
```python
import tensorflow as tf
from numpy.random import RandomState

# 1. 定义神经网络的参数，输入和输出节点。
batch_size = 8
w1= tf.Variable(tf.random_normal([2, 3], stddev=1, seed=1))
w2= tf.Variable(tf.random_normal([3, 1], stddev=1, seed=1))
x = tf.placeholder(tf.float32, shape=(None, 2), name="x-input")
y_= tf.placeholder(tf.float32, shape=(None, 1), name='y-input')

# 2. 定义前向传播过程，损失函数及反向传播算法。
a = tf.matmul(x, w1)
y = tf.matmul(a, w2)
cross_entropy = -tf.reduce_mean(y_ * tf.log(tf.clip_by_value(y, 1e-10, 1.0))) 
train_step = tf.train.AdamOptimizer(0.001).minimize(cross_entropy)


# 3. 生成模拟数据集。
rdm = RandomState(1)
X = rdm.rand(128,2)
Y = [[int(x1+x2 < 1)] for (x1, x2) in X]


# 4. 创建一个会话来运行TensorFlow程序。
batch_size = 8
with tf.Session() as sess:
    init_op = tf.global_variables_initializer()
    sess.run(init_op)

    # 输出目前（未经训练）的参数取值。
    print ("w1:", sess.run(w1))
    print ("w2:", sess.run(w2))
    print ("\n")

    # 训练模型。
    STEPS = 5000
    for i in range(STEPS):
        start = (i*batch_size) % 128
        end = (i*batch_size) % 128 + batch_size
        sess.run(train_step, feed_dict={x: X[start:end], y_: Y[start:end]})
        if i % 1000 == 0:
            total_cross_entropy = sess.run(cross_entropy, feed_dict={x: X, y_: Y})
            print("After %d training step(s), cross entropy on all data is %g" % (i, total_cross_entropy))

    # 输出训练后的参数取值。
    print ("\n")
    print ("w1:", sess.run(w1))
    print ("w2:", sess.run(w2))
```

## 四、深层神经网络
*****************************************
### 1、激活函数
TensorFlow提供几个常用的激活函数
* tf.nn.relu
* tf.sigmoid
* tf.tanh

```python
a = tf.nn.relu(tf.matmul(x, w1) + biases1)
y = tf.nn.relu(tf.matmul(a, w1) + biases2)
```

### 2、损失函数定义
#### （1）交叉熵代价函数
$$
H(p, q) = - \sum\_x p(x) log q(x)
$$
说明：
* p为真正的结果
* q为预测的概率

例子：
* p 为 (1, 0, 0)，q 为 (0.5, 0.4, 0.1)
H(p,q) = -(1\*log(0.5) + 0\*log(0.4) + 0\*log(0.1)) = 0.3
* p 为 (1, 0, 0)，q 为 (0.8, 0.1, 0.1)
H(p,q) = -(1\*log(0.8) + 0\*log(0.1) + 0\*log(0.1)) = 0.1

```python
cross_entropy = -tf.reduce_mean(
	y_ * tf.log(tf.clip_by_value(y, 1e-10, 1.0)))
```

或者
```python
tf.nn.sigmoid_cross_entropy_with_logits(logits=y, labels=y_)
```
其中y\_为正确结果，y为预测值


回归常用的代价函数：均方差
\\(y\_i\\)表示为正确答案，\\(y'\_i\\)为预测值
$$
MSE(y, y') = \frac{1}{n} \sum\_{i=1}^{n} (y\_i - y'\_i)^2
$$
实现
```python
mse = tf.reduce_mean(tf.square(y_ - y))
```
其中y\_为正确结果，y为预测值


#### （2）自定义代价函数
```python
loss = tf.reduce_sum(tf.where(tf.greater(v1, v2),
											(v1-v2)*a, (v2-v1)*b))
```
* `tf.where(condition, x=None, y=None, name=None)`，当condition成立，选中x的值，否则选中y的值

#### （3）例子
```python
import tensorflow as tf
from numpy.random import RandomState

batch_size = 8

# 定义神经网络的相关参数和变量
x = tf.placeholder(tf.float32, shape=(None, 2), name="x-input")
# 回归问题一般只有一个输出节点
y_ = tf.placeholder(tf.float32, shape=(None, 1), name='y-input')

# 定义了一个单层神经网络向前传播的过程，简单加权和
w1= tf.Variable(tf.random_normal([2, 1], stddev=1, seed=1))
y = tf.matmul(x, w1)

# 定义损失函数使得预测少了的损失大，于是模型应该偏向多的方向预测。
loss_less = 10
loss_more = 1
loss = tf.reduce_sum(tf.where(tf.greater(y, y_), (y - y_) * loss_more, (y_ - y) * loss_less))
train_step = tf.train.AdamOptimizer(0.001).minimize(loss)

# 通过随机数生成一个模拟数据集
rdm = RandomState(1)
X = rdm.rand(128,2)
Y = [[x1+x2+rdm.rand()/10.0-0.05] for (x1, x2) in X]

# 训练神经网络
with tf.Session() as sess:
    init_op = tf.global_variables_initializer()
    sess.run(init_op)
    STEPS = 5000
    for i in range(STEPS):
        start = (i*batch_size) % 128
        end = (i*batch_size) % 128 + batch_size
        sess.run(train_step, feed_dict={x: X[start:end], y_: Y[start:end]})
        if i % 1000 == 0:
            print("After %d training step(s), w1 is: " % (i))
            print (sess.run(w1), "\n")
    print ("Final w1 is: \n", sess.run(w1))
```

### 3、神经网络优化算法
反向传播和梯度下降法


### 4、神经网络进一步优化
#### （1）设置学习率
* 过大，会发散
* 过小，速度慢

使用指数衰减法
```python
import tensorflow as tf

TRAINING_STEPS = 100 #迭代次数
global_step = tf.Variable(0)

# 使用exponential_decay生成学习率
# 初始学习率为0.1
# 因为staircase=True，所以每迭代100次学习率*0.96
LEARNING_RATE = tf.train.exponential_decay(0.1, global_step, 1, 0.96, staircase=True)

# 构造向前传播
x = tf.Variable(tf.constant(5, dtype=tf.float32), name="x")
y = tf.square(x)
train_op = tf.train.GradientDescentOptimizer(LEARNING_RATE).minimize(y, global_step=global_step)

with tf.Session() as sess:
		# 初始化变量
    sess.run(tf.global_variables_initializer())
    for i in range(TRAINING_STEPS):
        sess.run(train_op) # 执行训练过程
        if i % 10 == 0:
            LEARNING_RATE_value = sess.run(LEARNING_RATE)
            x_value = sess.run(x)
            print ("After %s iteration(s): x%s is %f, learning rate is %f."% (i+1, i+1, x_value, LEARNING_RATE_value))
```

#### （2）过拟合问题
使用正则化
L1正则化：
$$
R(w) = ||w||\_1 = \sum\_i|w\_i|
$$
L2正则化：
$$
R(w) = ||w||\_2 = \sum\_i|w\_i^2|
$$
实践中可以L1和L2同时使用
$$
R(w) = \sum\_i \alpha|w\_i|+(1-\alpha)w\_i^2
$$
使用正则化
```python
tf.contrib.layers.l2_regularizer(lambda1)(w1)
```
* lambda1表示正则化参数
* w1表示权重


例子
```python
import tensorflow as tf
import matplotlib.pyplot as plt
import numpy as np

data = []
label = []
np.random.seed(0)

# 以原点为圆心，半径为1的圆把散点划分成红蓝两部分，并加入随机噪音。
for i in range(150):
    x1 = np.random.uniform(-1,1)
    x2 = np.random.uniform(0,2)
    if x1**2 + x2**2 <= 1:
        data.append([np.random.normal(x1, 0.1),np.random.normal(x2,0.1)])
        label.append(0)
    else:
        data.append([np.random.normal(x1, 0.1), np.random.normal(x2, 0.1)])
        label.append(1)
        
data = np.hstack(data).reshape(-1,2)
label = np.hstack(label).reshape(-1, 1)
plt.scatter(data[:,0], data[:,1], c=label,
           cmap="RdBu", vmin=-.2, vmax=1.2, edgecolor="white")
plt.show()

# 获取权重并将正则化加入集合
def get_weight(shape, lambda1):
    var = tf.Variable(tf.random_normal(shape), dtype=tf.float32)
    tf.add_to_collection('losses', tf.contrib.layers.l2_regularizer(lambda1)(var))
    return var
		
x = tf.placeholder(tf.float32, shape=(None, 2))
y_ = tf.placeholder(tf.float32, shape=(None, 1))
sample_size = len(data)

# 每层节点的个数
layer_dimension = [2,10,5,3,1]

n_layers = len(layer_dimension)

cur_layer = x
in_dimension = layer_dimension[0]

# 循环生成网络结构
for i in range(1, n_layers):
    out_dimension = layer_dimension[i]
    weight = get_weight([in_dimension, out_dimension], 0.003)
    bias = tf.Variable(tf.constant(0.1, shape=[out_dimension]))
    cur_layer = tf.nn.elu(tf.matmul(cur_layer, weight) + bias)
    in_dimension = layer_dimension[i]

y= cur_layer

# 损失函数的定义。
mse_loss = tf.reduce_sum(tf.pow(y_ - y, 2)) / sample_size #不加正则化的代价函数
tf.add_to_collection('losses', mse_loss)
loss = tf.add_n(tf.get_collection('losses')) #加入L2正则化的代价函数

# 定义训练的目标函数mse_loss，训练次数及训练模型
train_op = tf.train.AdamOptimizer(0.001).minimize(mse_loss)
TRAINING_STEPS = 40000

with tf.Session() as sess:
    tf.global_variables_initializer().run()
    for i in range(TRAINING_STEPS):
        sess.run(train_op, feed_dict={x: data, y_: label})
        if i % 2000 == 0:
            print("After %d steps, mse_loss: %f" % (i,sess.run(mse_loss, feed_dict={x: data, y_: label})))

    # 画出训练后的分割曲线       
    xx, yy = np.mgrid[-1.2:1.2:.01, -0.2:2.2:.01]
    grid = np.c_[xx.ravel(), yy.ravel()]
    probs = sess.run(y, feed_dict={x:grid})
    probs = probs.reshape(xx.shape)

plt.scatter(data[:,0], data[:,1], c=label,
           cmap="RdBu", vmin=-.2, vmax=1.2, edgecolor="white")
plt.contour(xx, yy, probs, levels=[.5], cmap="Greys", vmin=0, vmax=.1)
plt.show()


# 定义训练的目标函数loss，训练次数及训练模型
train_op = tf.train.AdamOptimizer(0.001).minimize(loss)
TRAINING_STEPS = 40000

with tf.Session() as sess:
    tf.global_variables_initializer().run()
    for i in range(TRAINING_STEPS):
        sess.run(train_op, feed_dict={x: data, y_: label})
        if i % 2000 == 0:
            print("After %d steps, loss: %f" % (i, sess.run(loss, feed_dict={x: data, y_: label})))

    # 画出训练后的分割曲线       
    xx, yy = np.mgrid[-1:1:.01, 0:2:.01]
    grid = np.c_[xx.ravel(), yy.ravel()]
    probs = sess.run(y, feed_dict={x:grid})
    probs = probs.reshape(xx.shape)

plt.scatter(data[:,0], data[:,1], c=label,
           cmap="RdBu", vmin=-.2, vmax=1.2, edgecolor="white")
plt.contour(xx, yy, probs, levels=[.5], cmap="Greys", vmin=0, vmax=.1)
plt.show()
```

#### （3）滑动平均模型
```python
shadow_variable = decay * shadow_variable + (1-decay)*variable
```
* `shadow_variable`称为影子变量
* `variable`为待更新的变量
* `decay`为衰减率，一般设置为接近于1的数

样例：
```python
import tensorflow as tf

# 定义变量及滑动平均类
v1 = tf.Variable(0, dtype=tf.float32)
step = tf.Variable(0, trainable=False)
ema = tf.train.ExponentialMovingAverage(0.99, step)
maintain_averages_op = ema.apply([v1]) 

with tf.Session() as sess:
    
    # 初始化
    init_op = tf.global_variables_initializer()
    sess.run(init_op)
    print (sess.run([v1, ema.average(v1)]))
    
    # 更新变量v1的取值
    sess.run(tf.assign(v1, 5))
    sess.run(maintain_averages_op)
    print (sess.run([v1, ema.average(v1)]) )
    
    # 更新step和v1的取值
    sess.run(tf.assign(step, 10000))  
    sess.run(tf.assign(v1, 10))
    sess.run(maintain_averages_op)
    print (sess.run([v1, ema.average(v1)])       )
    
    # 更新一次v1的滑动平均值
    sess.run(maintain_averages_op)
    print (sess.run([v1, ema.average(v1)])     )
```

## 五、MNIST数字识别问题
****************************
### 1、数据处理
```python
from tensorflow.examples.tutorials.mnist import input_data
mnist = input_data.read_data_sets("../../datasets/MNIST_data/", one_hot=True)

print ("Training data size: ", mnist.train.num_examples)
print ("Validating data size: ", mnist.validation.num_examples)
print ("Testing data size: ", mnist.test.num_examples)

print ("Example training data: ", mnist.train.images[0] )
print ("Example training data label: ", mnist.train.labels[0])

batch_size = 100
xs, ys = mnist.train.next_batch(batch_size)    # 从train的集合中选取batch_size个训练数据。
print ("X shape:", xs.shape                     )
print ("Y shape:", ys.shape                     )
```



### 2、神经网络实现
```python
import tensorflow as tf
from tensorflow.examples.tutorials.mnist import input_data
                                                                                                                                        
# 输入数据相关参数
INPUT_NODE = 784     # 输入节点
OUTPUT_NODE = 10     # 输出节点
                                                                                                                                        
# 配置神经网络
LAYER1_NODE = 500    # 隐藏层节点数
                                                                                                                                        
BATCH_SIZE = 100     # 每次batch打包的样本个数
                                                                                                                                        
# 模型相关的参数
LEARNING_RATE_BASE = 0.8      #基础学习率
LEARNING_RATE_DECAY = 0.99    #学习率的衰减率
REGULARAZTION_RATE = 0.0001   #正则化系数
TRAINING_STEPS = 5000         #训练轮数
MOVING_AVERAGE_DECAY = 0.99   #滑动平均衰减率
                                                                                                                                        
def inference(input_tensor, avg_class, weights1, biases1, weights2, biases2):
    """搭建向前传播计算图
        实现一个三层全连接神经网络，使用ReLU激活函数
        """
    # 不使用滑动平均类
    if avg_class == None:
        layer1 = tf.nn.relu(tf.matmul(input_tensor, weights1) + biases1)
        return tf.matmul(layer1, weights2) + biases2
                                                                                                                                        
    else:
        # 使用滑动平均类
        layer1 = tf.nn.relu(tf.matmul(input_tensor, avg_class.average(weights1)) + avg_class.average(biases1))
        return tf.matmul(layer1, avg_class.average(weights2)) + avg_class.average(biases2)
                                                                                                                                        
                                                                                                                                        
def train(mnist):
    x = tf.placeholder(tf.float32, [None, INPUT_NODE], name='x-input')
    y_ = tf.placeholder(tf.float32, [None, OUTPUT_NODE], name='y-input')
    # 生成隐藏层的参数。
    weights1 = tf.Variable(tf.truncated_normal([INPUT_NODE, LAYER1_NODE], stddev=0.1))
    biases1 = tf.Variable(tf.constant(0.1, shape=[LAYER1_NODE]))
    # 生成输出层的参数。
    weights2 = tf.Variable(tf.truncated_normal([LAYER1_NODE, OUTPUT_NODE], stddev=0.1))
    biases2 = tf.Variable(tf.constant(0.1, shape=[OUTPUT_NODE]))
                                                                                                                                        
    # 计算不含滑动平均类的前向传播结果
    y = inference(x, None, weights1, biases1, weights2, biases2)
                                                                                                                                        
    # 定义训练轮数及相关的滑动平均类
    global_step = tf.Variable(0, trainable=False)
        # 初始化滑动平均类，加快早期变量的更新速度
    variable_averages = tf.train.ExponentialMovingAverage(MOVING_AVERAGE_DECAY, global_step)
        # 在所有训练变量上应用滑动平均值
    variables_averages_op = variable_averages.apply(tf.trainable_variables())
        # 在构建向前传播计算图，过程中使用 average 函数执行滑动平均值
    average_y = inference(x, variable_averages, weights1, biases1, weights2, biases2)
                                                                                                                                        
    # 计算交叉熵及其平均值
    # cross_entropy = tf.nn.sparse_softmax_cross_entropy_with_logits(y, tf.argmax(y_, 1))
    cross_entropy = tf.nn.sparse_softmax_cross_entropy_with_logits(labels=tf.argmax(y_, 1), logits=y)
    cross_entropy_mean = tf.reduce_mean(cross_entropy)
                                                                                                                                        
    # 损失函数的计算
        # 创建l2正则化函数
    regularizer = tf.contrib.layers.l2_regularizer(REGULARAZTION_RATE)
    regularaztion = regularizer(weights1) + regularizer(weights2) #执行l2正则化
    loss = cross_entropy_mean + regularaztion #生成最终的代价函数
                                                                                                                                        
    # 设置指数衰减的学习率。
    learning_rate = tf.train.exponential_decay(
        LEARNING_RATE_BASE, #基础学习率
        global_step, #当前迭代次数
        mnist.train.num_examples / BATCH_SIZE, #完成所有数据需要的迭代次数
        LEARNING_RATE_DECAY, #学习率衰减率
        staircase=True)
                                                                                                                                        
    # 优化损失函数，创建优化器
    train_step = tf.train.GradientDescentOptimizer(learning_rate).minimize(loss, global_step=global_step)
                                                                                                                                        
    # 反向传播更新参数和更新每一个参数的滑动平均值同时进行
        # 下面两行代码等价于train_op = tf.group(train_step, variables_averages_op)
    with tf.control_dependencies([train_step, variables_averages_op]):
        train_op = tf.no_op(name='train')

    # 计算正确率
    correct_prediction = tf.equal(tf.argmax(average_y, 1), tf.argmax(y_, 1))
    accuracy = tf.reduce_mean(tf.cast(correct_prediction, tf.float32))

    # 初始化会话，并开始训练过程。
    with tf.Session() as sess:
        tf.global_variables_initializer().run()
        validate_feed = {x: mnist.validation.images, y_: mnist.validation.labels}
        test_feed = {x: mnist.test.images, y_: mnist.test.labels}
                                                                                                                                        
        # 循环的训练神经网络。
        for i in range(TRAINING_STEPS):
                        # 在验证集正确率
            if i % 1000 == 0:
                validate_acc = sess.run(accuracy, feed_dict=validate_feed)
                print("After %d training step(s), validation accuracy using average model is %g " % (i, validate_acc))

                        # 执行一次迭代
            xs,ys=mnist.train.next_batch(BATCH_SIZE)
            sess.run(train_op,feed_dict={x:xs,y_:ys})

                # 测试集的正确率
        test_acc=sess.run(accuracy,feed_dict=test_feed)
        print(("After %d training step(s), test accuracy using average model is %g" %(TRAINING_STEPS, test_acc)))


def main(argv=None):
    mnist = input_data.read_data_sets("../../datasets/MNIST_data", one_hot=True)
    train(mnist)
```


### 3、变量管理
#### （1）说明
```python
# 下面这两个定义等价
v = tf.get_variable("v", shape=[1], initializer=tf.constant_initializer(1.0))
v = tf.Variable(tf.constant(1.0, shape=[1], name="v"))
```
当神经网络更加复杂时，使用变量管理来传递参数


在上下文管理器foo中创建变量v
```python
with tf.variable_scope("foo"):
    v = tf.get_variable("v", [1], initializer=tf.constant_initializer(1.0))
     
# 名字空间foo中已经存在v的变量，下面的代码将报错
#with tf.variable_scope("foo"):
#    v = tf.get_variable("v", [1])

# 当reuse=True时，tf.get_variable函数将获取已经声明的变量，若没有声明将报错
with tf.variable_scope("foo", reuse=True):
    v1 = tf.get_variable("v", [1])
print v == v1

#with tf.variable_scope("bar", reuse=True):
   # v = tf.get_variable("v", [1])
```

#### （2）嵌套上下文管理器中的reuse参数的使用
嵌套上下文管理器reuse机制是继承 
```python
with tf.variable_scope("root"):
    print (tf.get_variable_scope().reuse)
    
    with tf.variable_scope("foo", reuse=True):
        print (tf.get_variable_scope().reuse)
        
        with tf.variable_scope("bar"):
            print (tf.get_variable_scope().reuse)
            
    print (tf.get_variable_scope().reuse)
```

#### （3）tf.variable_scope将创建命名空间
```python
v1 = tf.get_variable("v", [1])
print (v1.name)

with tf.variable_scope("foo",reuse=True):
    v2 = tf.get_variable("v", [1])
print (v2.name)

with tf.variable_scope("foo"):
    with tf.variable_scope("bar"):
        v3 = tf.get_variable("v", [1])
        print (v3.name)
        
v4 = tf.get_variable("v1", [1])
print (v4.name)
```
输出
```
v:0
foo/v:0
foo/bar/v:0
v1:0
```

```python
with tf.variable_scope("",reuse=True):
    v5 = tf.get_variable("foo/bar/v", [1])
    print (v5 == v3) #True
    v6 = tf.get_variable("v1", [1])     
    print (v6 == v4) #True
```

### 4、模型持久化
#### （1）持久化
```python
import tensorflow as tf
v1 = tf.Variable(tf.constant(1.0, shape=[1]), name = "v1")
v2 = tf.Variable(tf.constant(2.0, shape=[1]), name = "v2")
result = v1 + v2

init_op = tf.global_variables_initializer()
saver = tf.train.Saver()

with tf.Session() as sess:
    sess.run(init_op)
    saver.save(sess, "Saved_model/model.ckpt")
```
* 上面操作将产生三个文件：
	* model.ckpt.meta
	* model.ckpt
	* checkpoint

#### （2）加载
```python
# 必须重新定义计算图
v1 = tf.Variable(tf.constant(1.0, shape=[1]), name = "v1")
v2 = tf.Variable(tf.constant(2.0, shape=[1]), name = "v2")
result = v1 + v2

with tf.Session() as sess:
    saver.restore(sess, "Saved_model/model.ckpt")
    print (sess.run(result))
```

加载持久化的计算图
```python
# 不必重新加载
saver = tf.train.import_meta_graph("Saved_model/model.ckpt.meta")
with tf.Session() as sess:
    saver.restore(sess, "Saved_model/model.ckpt")
    print (sess.run(tf.get_default_graph().get_tensor_by_name("add:0")) )
```

#### （3）加载变量时重命名
```python
v1 = tf.Variable(tf.constant(1.0, shape=[1]), name = "other-v1")
v2 = tf.Variable(tf.constant(2.0, shape=[1]), name = "other-v2")
saver = tf.train.Saver({"v1": v1, "v2": v2}) #将文件中名字为"v1"的值赋给v1

with tf.Session() as sess:
    saver.restore(sess, "Saved_model/model.ckpt")
```


#### （4）滑动窗口类保存
查看影子变量
```python
reset #清空ipython所有变量
import tensorflow as tf

v = tf.Variable(0, dtype=tf.float32, name="v")
for variables in tf.global_variables(): 
	print (variables.name)
    
ema = tf.train.ExponentialMovingAverage(0.99)
maintain_averages_op = ema.apply(tf.global_variables())
for variables in tf.global_variables(): #可以看到影子变量
	print (variables.name)
```
保存滑动平均模型
```python
saver = tf.train.Saver()
with tf.Session() as sess:
    init_op = tf.global_variables_initializer()
    sess.run(init_op)
    
    sess.run(tf.assign(v, 10))
    sess.run(maintain_averages_op)
    # 保存的时候会将v:0  v/ExponentialMovingAverage:0这两个变量都存下来。
    saver.save(sess, "Saved_model/model2.ckpt")
    print (sess.run([v, ema.average(v)]))
		# 输出：[10.0, 0.099999905]
```
加载滑动平均值
```python
v = tf.Variable(0, dtype=tf.float32, name="v")

# 通过变量重命名将原来变量v的滑动平均值直接赋值给v。
saver = tf.train.Saver({"v/ExponentialMovingAverage": v})
with tf.Session() as sess:
    saver.restore(sess, "Saved_model/model2.ckpt")
    print (sess.run(v))
```

#### （5）使用滑动平均类的`variables_to_restore`
`tf.train.ExponentialMovingAverage`类提供了`variables_to_restore`方法，提供用于变量重命名的字典
```python
#从新进入ipython
import tensorflow as tf
v = tf.Variable(0, dtype=tf.float32, name="v")
ema = tf.train.ExponentialMovingAverage(0.99)
print (ema.variables_to_restore())

saver = tf.train.Saver(ema.variables_to_restore())
with tf.Session() as sess:
    saver.restore(sess, "Saved_model/model2.ckpt")
    print (sess.run(v))
```


#### （6）pb文件的保存与加载
保存
```python
import tensorflow as tf
from tensorflow.python.framework import graph_util

#定义计算图
v1 = tf.Variable(tf.constant(1.0, shape=[1]), name = "v1")
v2 = tf.Variable(tf.constant(2.0, shape=[1]), name = "v2")
result = v1 + v2

#变初始化
init_op = tf.global_variables_initializer()
with tf.Session() as sess:
    sess.run(init_op)
		#导出计算图
    graph_def = tf.get_default_graph().as_graph_def()
    
		#导出相关变量
		output_graph_def = graph_util.convert_variables_to_constants(sess, graph_def, ['add'])
    with tf.gfile.GFile("Saved_model/combined_model.pb", "wb") as f:
           f.write(output_graph_def.SerializeToString())
```
加载
```python
import tensorflow as tf
from tensorflow.python.platform import gfile
with tf.Session() as sess:
    model_filename = "Saved_model/combined_model.pb"
   
    with gfile.FastGFile(model_filename, 'rb') as f:
        graph_def = tf.GraphDef()
        graph_def.ParseFromString(f.read())

    result = tf.import_graph_def(graph_def, return_elements=["add:0"])
    print (sess.run(result))
```




