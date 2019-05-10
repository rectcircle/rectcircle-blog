---
title: TensorFlow教程（二）
date: 2017-07-27T20:46:54+08:00
draft: false
toc: true
comments: true
aliases:
  - /detail/85
  - /detail/85/
tags:
  - 机器学习
---

<script src="https://cdn.bootcss.com/mathjax/2.7.0/MathJax.js?config=default"></script>

> https://www.tensorflow.org/

## 二、入门

### 6、在tf.contrib.learn创建输入函数

在这教程中你将了解到，如何构建一个`input_fn`来预处理数据并将其“喂”到模型中。然后，您将实现一个input_fn，将训练，评估和预测数据提供给神经网络回归器，用于预测房价。

#### （1）自定义输入管道

**直接输入所有数据集**

当使用tf.contrib.learn训练神经网络时，可以将特征和目标数据直接传递到fit，评估或预测操作中。实例如下：

```py
training_set = tf.contrib.learn.datasets.base.load_csv_with_header(
    filename=IRIS_TRAINING, target_dtype=np.int, features_dtype=np.float32)
test_set = tf.contrib.learn.datasets.base.load_csv_with_header(
    filename=IRIS_TEST, target_dtype=np.int, features_dtype=np.float32)
...

classifier.fit(x=training_set.data,
               y=training_set.target,
               steps=2000)
```

此方法：只针对小数据集

**定义input_fn模板**

```py
def my_input_fn():

    # 在这里预处理您的数据

    # ... return 1) 包含key：特征名-value：特征量的张量 的dict
    # 2) 特征对应的标签的张量类型
    return feature_cols, labels
```

输入函数的正文包含用于预处理输入数据的特定逻辑，例如擦除不良示例或特征缩放。

**创建张量**

方式1：`tf.constant(list)`

```py
feature_column_data = [1, 2.4, 0, 9.9, 3, 120]
feature_tensor = tf.constant(feature_column_data)
print(feature_tensor)
```

方式2（针对稀疏矩阵）：`tf.SparseTensor(indices=list, values=list,dense_shape=list)`

```py
sparse_tensor = tf.SparseTensor(indices=[[0,1], [2,4]],
                                values=[6, 0.5],
                                dense_shape=[3, 5])
'''
[[0, 6, 0, 0, 0]
 [0, 0, 0, 0, 0]
 [0, 0, 0, 0, 0.5]]
'''
```

* indices：非0数据索引，从零开始
* values：索引位置对应的数据
* dense_shape：张量的尺寸

**将input_fn传递给的模型**

input_fn无参数：

`classifier.fit(input_fn=my_input_fn, steps=2000)`

input_fn从参数中读数据：

```py
# 方式1：包装函数
def my_input_function_training_set():
  return my_input_function(training_set)

classifier.fit(input_fn=my_input_fn_training_set, steps=2000)

# 方式2：偏函数
classifier.fit(input_fn=functools.partial(my_input_function,
                                          data_set=training_set), steps=2000)

# 方式3：lambda
classifier.fit(input_fn=lambda: my_input_fn(training_set), steps=2000)
```

#### （2）例子——波士顿房价预测神经网络模型

数据包含9个特征，标签为每个样例的价格（千美元）

共三个文件：

http://download.tensorflow.org/data/boston_train.csv
http://download.tensorflow.org/data/boston_test.csv
http://download.tensorflow.org/data/boston_predict.csv

**代码如下：**

```py
import itertools

import pandas as pd #这里使用了pandas库，pip install pandas安装下
import tensorflow as tf

tf.logging.set_verbosity(tf.logging.INFO) #开启INFO级别日志

#定义cvs文件的列名，以便于提取数据
COLUMNS = ["crim", "zn", "indus", "nox", "rm", "age",
           "dis", "tax", "ptratio", "medv"]
FEATURES = ["crim", "zn", "indus", "nox", "rm",
            "age", "dis", "tax", "ptratio"]
LABEL = "medv"

#读取数据
training_set = pd.read_csv("boston_train.csv", skipinitialspace=True,
                           skiprows=1, names=COLUMNS)
test_set = pd.read_csv("boston_test.csv", skipinitialspace=True,
                       skiprows=1, names=COLUMNS)
prediction_set = pd.read_csv("boston_predict.csv", skipinitialspace=True,
                             skiprows=1, names=COLUMNS)
print("测试样例")
print(type(training_set), len(training_set))
print(training_set)

#定义输入函数
def input_fn(data_set):
  feature_cols = {k: tf.constant(data_set[k].values) for k in FEATURES}
  labels = tf.constant(data_set[LABEL].values)
  return feature_cols, labels



# 特征列，可以定义列名，数据尺寸，缺省值，数据类型，正规化器等
feature_cols = [tf.contrib.layers.real_valued_column(k)
                  for k in FEATURES]
print("特征列")
print(feature_cols)

print("输入函数返回")
print(input_fn(test_set))


# 构建两层DNN型神经网络，每层10个节点，指定特征列定义
regressor = tf.contrib.learn.DNNRegressor(feature_columns=feature_cols,
                                            hidden_units=[10, 10],
                                            model_dir="/tmp/boston_model")

# 训练，指明输入函数，迭代次数
regressor.fit(input_fn=lambda: input_fn(training_set), steps=5000)

# 评估模型
ev = regressor.evaluate(input_fn=lambda: input_fn(test_set), steps=1)
loss_score = ev["loss"]
print("Loss: {0:f}".format(loss_score))

# 预测新的样例
y = regressor.predict(input_fn=lambda: input_fn(prediction_set))
# .predict() 返回一个迭代器；转换为列表并打印预测
predictions = list(itertools.islice(y, 6))
print("Predictions: {}".format(str(predictions)))

```

### 7、在tf.contrib.learn中记录日志和监视

代码基于 https://www.rectcircle.cn/detail/82#5、tf.contrib.learn快速开始 修改
运行代码仅打印出两行，并没有其他信息（日志）
tf.contrib.learn提供了一套Monitor API用于展示训练过程中的各种参数。

#### （1）开启TensorFlow的日志记录功能

**日志级别**（从详细到粗略排序）

* DEBUG,
* INFO,
* WARN,
* ERROR,
* FATAL

开启，将下面语句放在代码开头

```py
tf.logging.set_verbosity(tf.logging.INFO) #开启INFO级别日志
```

使用INFO级日志记录，tf.contrib.learn在每100个步骤之后自动输出训练损失指标到stderr。

#### （2）配置验证监视器进行流评估

tf.contrib.learn提供了几个高级监视器，您可以附加到适合的操作，以进一步跟踪指标和/或调试模型培训期间的低级TensorFlow操作，包括：

* `CaptureVariable`：在训练的每n个步骤中将指定的变量的值保存到集合中
* `PrintTensor`：在训练的每n个步骤记录指定的张量值
* `SummarySaver`：使用tf.summary.FileWriter保存tf.Summary协议缓冲区，每个n个训练步骤
* `ValidationMonitor`：在训练的每n个步骤记录一组指定的评估指标，如果需要，在某些条件下实现提前停止

#### （3）评估每N步

对测试数据进行评估，以了解该模型的泛化程度（防止过拟合），可以使用测试数据（test_set.data和test_set.target）配置ValidationMonitor来实现此目的。

**创建一个验证监视器**
针对测试集，每50次评估一次

```py
validation_monitor = tf.contrib.learn.monitors.ValidationMonitor(
    test_set.data,
    test_set.target,
    every_n_steps=50)
```

将此代码放在实例化分类器的行之前。

**创建分类器**

验证监视器依赖保存的检查点来执行评估操作，因此您需要修改分类器的实例化函数，以添加一个包含save_checkpoints_secs的tf.contrib.learn.RunConfig参数，该文件指定在训练期间在检查点保存之间经过多少秒。

```py
classifier = tf.contrib.learn.DNNClassifier(
    feature_columns=feature_columns,
    hidden_units=[10, 20, 10],
    n_classes=3,
    model_dir="/tmp/iris_model",
    config=tf.contrib.learn.RunConfig(save_checkpoints_secs=1))
```

**fit是附加上监视器**

```py
classifier.fit(x=training_set.data,
               y=training_set.target,
               steps=2000,
               monitors=[validation_monitor])
```

此时训练模型时，每迭代50步，将运行一次测试数据评估，计算loss。观察是否过拟

#### （4）使用MetricSpec定制评估指标

配置方式：通过配置一个字典，key为指标名，value为一个MetricSpec实例
MetricSpec构造函数接受四个参数：

* metric_fn：计算和返回指标值的函数。这可以是tf.contrib.metrics模块中可用的预定义函数，如tf.contrib.metrics.streaming_precision或tf.contrib.metrics.streaming_recall。
或者，您可以定义自己的自定义度量函数，该函数必须将预测和标签张量作为参数（也可以选择提供权重参数）。该函数必须以两种格式之一返回度量值：
	* 一张张量
	* 一对op（value\_op，update\_op），其中value\_op返回度量值，update\_op执行相应的操作来更新内部模型状态。
* prediction_key：包含模型返回的预测的张量的key。如果模型返回单个张量或具有单个条目的dict，则可以省略此参数。对于DNNClassifier模型，类预测将使用关键字tf.contrib.learn.PredictionKey.CLASSES在张量中返回。
* label_key：包含由模型返回的标签的张量的键，如模型的input_fn所指定，与prediction_key一样，如果input_fn返回单个张量或具有单个条目的dict，则可以省略此参数。在本教程的虹膜示例中，DNNClassifier没有input_fn（x，y数据直接传递给fit），因此不需要提供label_key。
* weights_key：可选的。张量的键（由input_fn返回）包含metric_fn的权重输入。

定制监视测试的准确性、precision、召回率样例代码如下：

```py
validation_metrics = {
    "accuracy":
        tf.contrib.learn.MetricSpec(
            metric_fn=tf.contrib.metrics.streaming_accuracy,
            prediction_key=tf.contrib.learn.PredictionKey.CLASSES),
    "precision":
        tf.contrib.learn.MetricSpec(
            metric_fn=tf.contrib.metrics.streaming_precision,
            prediction_key=tf.contrib.learn.PredictionKey.CLASSES),
    "recall":
        tf.contrib.learn.MetricSpec(
            metric_fn=tf.contrib.metrics.streaming_recall,
            prediction_key=tf.contrib.learn.PredictionKey.CLASSES)
}
```

需要修改监视器的构造

```py
validation_monitor = tf.contrib.learn.monitors.ValidationMonitor(
    test_set.data,
    test_set.target,
    every_n_steps=50,
    metrics=validation_metrics)
```

#### （5）训练迭代提前结束

通过配置监视器可以做到在满足一定条件的情况下提前结束训练迭代，以节省资源

除了记录eval指标之外，ValidationMonitor可以通过三个参数，在满足指定条件时轻松实现提前停止：

* early_stopping_metric：在early_stopping_rounds和early_stopping_metric_minimize中指定的条件下触发提前停止（例如，丢失或准确）的度量标准。默认为loss。
* early_stopping_metric_minimize：True——表示模型是最小化early_stopping_metric，False——反之
* early_stopping_rounds：设置很多步骤，如果early_stopping_metric不减少或增加训练自动停止，默认为无，这意味着不会发生早停。

修改后代码如下

```py
validation_monitor = tf.contrib.learn.monitors.ValidationMonitor(
    test_set.data,
    test_set.target,
    every_n_steps=50,
    metrics=validation_metrics,
    early_stopping_metric="loss",
    early_stopping_metric_minimize=True,
    early_stopping_rounds=200)
```

#### （6）TensorBoard日志可视化

```bash
tensorboard --logdir=/tmp/iris_model/
```

### 8、TensorBoard介绍

略

## 三、程序员指南

***

### 1、变量：创建，初始化，保存和加载

训练模型时，您可以使用变量来保存和更新参数。变量是包含张量的内存缓冲区。必须明确地初始化它们，并在培训期间和之后将其保存到磁盘。您可以稍后恢复保存的值以运行或分析模型。

相关API：

* [tf.Variable](https://www.tensorflow.org/api_docs/python/tf/Variable)类
* [tf.train.Saver](https://www.tensorflow.org/api_docs/python/tf/train/Saver)类

#### （1）创建

`tf.Variable(<initial-value>, name=<optional-name:String>)`

```py
# 创建两个变量
weights = tf.Variable(tf.random_normal([784, 200], stddev=0.35),
                      name="weights")
biases = tf.Variable(tf.zeros([200]), name="biases")
print(weights, biases)
```

调用`tf.Variable()`相当于在图中添加了以下几个操作：

* 一个变量操作，保存变量值。
* 初始化器op将变量设置为其初始值。这实际上是一个`tf.assign`操作。
* 初始值的ops，例如示例中的偏差变量的零，也被添加到图中。
tf.Variable（）值返回的值是Python类tf.Variable的一个实例。

**放置设备**

变量可以在创建时被固定到特定的设备，使用`with tf.device(...):`语句块：

```py

```

改变变量的操作像`tf.Variable.assign`或者`tf.train.Optimizer`必须在与变量相同的设备上运行。创建这些操作时，不兼容的设备布局指令将被忽略。

#### （2）初始化

在运行模型中的其他操作之前，必须明确运行变量初始化器。最简单的方法是添加一个运行所有变量初始值的操作，并在使用模型之前运行该操作。

您也可以从检查点文件中恢复变量值。

使用`tf.global_variables_initializer()`添加一个op来运行变量初始值。在完成构建模型并在会话中启动模型之后，才能运行该操作。

```py
# 添加一个初始化变量的操作
init_op = tf.global_variables_initializer()

# 然后当运行模型时
with tf.Session() as sess:
    # 运行初始化操作。
    sess.run(init_op)

    # 使用模型
		#...
```

**从另一个变量初始化**

```py
weights = tf.Variable(tf.random_normal([784, 200], stddev=0.35),
                      name="weights") #随机初始化变量
# 创建另一个与“权重”值相同的变量。
w2 = tf.Variable(weights.initialized_value(), name="w2")
# 创建另一个变量，其值为“权重”的两倍
w_twice = tf.Variable(weights.initialized_value() * 2.0, name="w_twice")
```

**自定义初始化**

```py
tf.variables_initializer()
```

#### （3）保存和恢复

保存和恢复模型的最简单方法是使用`tf.train.Saver`对象。构造函数将图形中的所有变量或指定的列表的图形添加到保存或恢复操作中。saver对象提供了运行这些操作的方法，指定检查点文件写入或读取的路径。

请注意，要恢复没有图形的模型检查点，必须首先从元数据文件导入图形（典型扩展名为.meta）。这是通过tf.train.import_meta_graph完成的，后者又返回一个可以执行还原的Saver。

**检查点文件**

变量保存在二进制文件中，大致包含从变量名称到张量值的映射。

创建Saver对象时，您可以选择在检查点文件中为变量选择名称。默认情况下，它为每个变量使用`tf.Variable.name`属性的值。

要了解检查点中的变量，可以使用inspect_checkpoint库，特别是print_tensors_in_checkpoint_file函数。

**保存变量**

使用`tf.train.Saver()`创建一个Saver来管理模型中的所有变量。

```py
save_path = saver.save(sess, "/tmp/model.ckpt")
```

**恢复变量**

相同的Saver对象用于恢复变量。请注意，当您从文件中恢复变量时，您不必事先初始化它们。

```py
saver.restore(sess, "/tmp/model.ckpt")
```

**选择要保存和还原的变量**

如果您没有将任何参数传递给`tf.train.Saver()`，则保存程序将处理图中的所有变量.它们中的每一个都保存在创建变量时传递的名称。

明确指定检查点文件中变量的名称有时是有用的。例如，您可能已经使用名为"weights"的变量训练了一个模型，该变量的值要在一个名为"params"的新变量中恢复。

只有保存或恢复模型使用的变量子集有时也是有用的。例如，您可能已经训练了一个具有5层的神经网络，您现在要训练一个具有6层的新模型，将参数从以前训练的模型的5层恢复到新模型的前5层。

通过传递给`tf.train.Saver()`构造函数一个Python字典，可以轻松地指定要保存的名称和变量：keys是要使用的名称，values是要管理的变量

注意：

* 如果需要保存和恢复模型变量的不同子集，您可以创建尽可能多的保护对象。相同的变量可以列在多个保护对象中，其值仅在运行`saver.restore()`方法时更改。
* 如果您仅在会话开始时还原模型变量的子集，则必须为其他变量运行初始化操作。有关详细信息，请参阅[tf.variables_initializer](https://www.tensorflow.org/api_docs/python/tf/variables_initializer)

```py
# 创建一些变量
v1 = tf.Variable(..., name="v1")
v2 = tf.Variable(..., name="v2")
# ...
# 添加操作以仅使用名称“my_v2”保存并恢复“v2”
saver = tf.train.Saver({"my_v2": v2})
# 之后正常使用保护对象。
# ...
```

### 2、张量：排名，形状和类型

TensorFlow应用程序使用张量数据结构来表示所有数据。可以将张量理解为n维数组。张量具有静态和动态尺寸。计算图中节点之间只能传递张量。

#### （1）等级（Rank）

又称之为维度、度数

* 0 - `s = 483` 标量
* 1 - `v = [1.1, 2.2, 3.3]` 向量
* 2 - `m = [[1, 2, 3], [4, 5, 6], [7, 8, 9]]` 矩阵

#### （2）形状（Shape）

表示各个维度的大小的描述

* 0 -	`[]`
* 1 - `[D0,]`
* 2 - `[D0, D1]`

#### （3）数据类型（Data types）

|数据类型| Python type |
|-------|-------------|
|DT_FLOAT |	tf.float32 |
|DT_DOUBLE |	tf.float64 |
|DT_INT8 |	tf.int8 |
|DT_INT16 |	tf.int16 |
|DT_INT32 |	tf.int32 |
|DT_INT64 |	tf.int64 |
|DT_UINT8 |	tf.uint8 |
|DT_UINT16 |	tf.uint16 |
|DT_STRING |	tf.string |
|DT_BOOL |	tf.bool |
|DT_COMPLEX64 |	tf.complex64 |
|DT_COMPLEX128 |	tf.complex128 |
|DT_QINT8 |	tf.qint8 |
|DT_QINT32 |	tf.qint32 |
|DT_QUINT8 |	tf.quint8 |

### 3、共享变量

例子：

构建两层卷积

#### （1）不使用共享变量

```py
def my_image_filter(input_images):
    conv1_weights = tf.Variable(tf.random_normal([5, 5, 32, 32]),
        name="conv1_weights")
    conv1_biases = tf.Variable(tf.zeros([32]), name="conv1_biases")
    conv1 = tf.nn.conv2d(input_images, conv1_weights,
        strides=[1, 1, 1, 1], padding='SAME')
    relu1 = tf.nn.relu(conv1 + conv1_biases)

    conv2_weights = tf.Variable(tf.random_normal([5, 5, 32, 32]),
        name="conv2_weights")
    conv2_biases = tf.Variable(tf.zeros([32]), name="conv2_biases")
    conv2 = tf.nn.conv2d(relu1, conv2_weights,
        strides=[1, 1, 1, 1], padding='SAME')
    return tf.nn.relu(conv2 + conv2_biases)
```

模型快速变得比这更复杂，即使在这里我们已经有四个不同的变量：`conv1_weights`, `conv1_biases`, `conv2_weights`, and `conv2_biases`.
如果调用两次这个函数，将创建两次这些变量。

#### （2）通常处理方式，将变量当做参数传递到函数中

```py
variables_dict = {
    "conv1_weights": tf.Variable(tf.random_normal([5, 5, 32, 32]),
        name="conv1_weights")
    "conv1_biases": tf.Variable(tf.zeros([32]), name="conv1_biases")
    ... etc. ...
}

def my_image_filter(input_images, variables_dict):
    conv1 = tf.nn.conv2d(input_images, variables_dict["conv1_weights"],
        strides=[1, 1, 1, 1], padding='SAME')
    relu1 = tf.nn.relu(conv1 + variables_dict["conv1_biases"])

    conv2 = tf.nn.conv2d(relu1, variables_dict["conv2_weights"],
        strides=[1, 1, 1, 1], padding='SAME')
    return tf.nn.relu(conv2 + variables_dict["conv2_biases"])

# Both calls to my_image_filter() now use the same variables
result1 = my_image_filter(image1, variables_dict)
result2 = my_image_filter(image2, variables_dict)
```

虽然方便，但在代码之外创建上述变量会破坏封装：

* 构建图形的代码必须记录要创建的变量的名称，类型和形状。
* 代码更改时，调用者可能必须创建更多或更少或不同的变量。

#### （3）TensorFlow提供的方案

TensorFlow中的变量作用域机制包括两个主要函数：

* `tf.get_variable(<name>, <shape>, <initializer>)`: 创建或返回具有给定名称的变量
* `tf.variable_scope(<scope_name>)`: 管理传递给`tf.get_variable()`的名称的名称空间

`tf.get_variable()`函数取代`tf.Variable`创建变量。他使用`<initializer>`而不是直接传值。一个`<initializer>`是一个函数，它采取形状并提供一个具有该形状的张量。以下是TensorFlow中的一些初始化器：

* `tf.constant_initializer(value)` 将所有内容初始化为提供的值，
* `tf.random_uniform_initializer(a, b)` 从均匀地初始化[A,B]，
* `tf.random_normal_initializer(mean, stddev)` 从给定的平均值和标准偏差的正态分布初始化。

要了解`tf.get_variable()`如何解决前面讨论过的问题，我们将创建一个卷积的代码重构为单独的函数，名为conv_relu：

```py
def conv_relu(input, kernel_shape, bias_shape):
    # 创建 "weights" 变量.
    weights = tf.get_variable("weights", kernel_shape,
        initializer=tf.random_normal_initializer())
    # 创建 "biases" 变量.
    biases = tf.get_variable("biases", bias_shape,
        initializer=tf.constant_initializer(0.0))
    conv = tf.nn.conv2d(input, weights,
        strides=[1, 1, 1, 1], padding='SAME')
    return tf.nn.relu(conv + biases)
```

此功能使用短名称"weights"和"biases"。我们希望将它用于`conv1`和`conv2`，但变量需要具有不同的名称。这是`tf.variable_scope()`发挥作用的地方：它推送变量的命名空间。

```py
def my_image_filter(input_images):
    with tf.variable_scope("conv1"):
        # 这儿将创建名叫 "conv1/weights", "conv1/biases" 的变量.
        relu1 = conv_relu(input_images, [5, 5, 1, 32], [32])
    with tf.variable_scope("conv2"):
        # 这儿将创建名叫 "conv2/weights", "conv2/biases" 的变量.
        return conv_relu(relu1, [5, 5, 32, 32], [32])
```

现在，我们来看看当我们调用my_image_filter()两次时会发生什么。

```py
result1 = my_image_filter(image1)
result2 = my_image_filter(image2)
# Raises ValueError(... conv1/weights already exists ...)
```

正如你看到的，`tf.get_variable()`将检查已将存在的变量是否被意外的分享。如果要共享它们，则需要通过如下配置reuse_variables()来指定它。

```py
with tf.variable_scope("image_filters") as scope:
    result1 = my_image_filter(image1)
    scope.reuse_variables()
    result2 = my_image_filter(image2)
```

#### （4）变量作用域如何工作

**理解`tf.get_variable()`**

通常调用tf.get_variable的方式：

```py
v = tf.get_variable(name, shape, dtype, initializer)
```

有两种情况：

* 情况1：`tf.get_variable_scope().reuse == False`
	* 创建新的变量时命名（全名）为：当前变量作用域+变量名
		* 全名存在：报错ValueError
		* 全名不存在：初始化变量
* 情况1：`tf.get_variable_scope().reuse == True`
	* 搜索使用全名搜索变量
		* 全名存在：返回
		* 全名不存在： 报错ValueError

**理解`tf.variable_scope()`**

tf.variable_scope()返回一个作用域对象，功能变量命全名的前缀和确定变量是否可共享，可嵌套使用

```py
with tf.variable_scope("foo"):
    with tf.variable_scope("bar"):
        v = tf.get_variable("v", [1])
assert v.name == "foo/bar/v:0"
```

**通过`tf.get_variable_scope().reuse_variables()`打开重用**

```py
with tf.variable_scope("foo"):
    v = tf.get_variable("v", [1])
    tf.get_variable_scope().reuse_variables()
    v1 = tf.get_variable("v", [1])
assert v1 is v
```

**注意**

您不能将重用标志设置为False

```py
with tf.variable_scope("root"):
    # At start, the scope is not reusing.
    # 刚开作用域变量不能重用
    assert tf.get_variable_scope().reuse == False
    with tf.variable_scope("foo"):
        # Opened a sub-scope, still not reusing.
        # 打开子作用域变量不能重用
        assert tf.get_variable_scope().reuse == False
    with tf.variable_scope("foo", reuse=True):
        # 显示的打开自作用域重用
        assert tf.get_variable_scope().reuse == True
        with tf.variable_scope("bar"):
            # 自作用于继承了父作用域重用
            assert tf.get_variable_scope().reuse == True
    # 返回父作用域，任然是不可重用
    assert tf.get_variable_scope().reuse == False
```

**捕获变量作用域**

```py
with tf.variable_scope("foo") as foo_scope:
    v = tf.get_variable("v", [1])
with tf.variable_scope(foo_scope):
    w = tf.get_variable("w", [1])
with tf.variable_scope(foo_scope, reuse=True):
    v1 = tf.get_variable("v", [1])
    w1 = tf.get_variable("w", [1])
assert v1 is v
assert w1 is w
```

**变量作用域变量缺省初始化设定**

```py
# 变量作用域变量缺省初始化设定
with tf.Session() as sess:
    with tf.variable_scope("foo4", initializer=tf.constant_initializer(0.4)):
        v = tf.get_variable("v", [1])
        init = tf.global_variables_initializer()
        sess.run(init)
        assert v.eval(sess) == 0.4  # Default initializer as set above.
        w = tf.get_variable("w", [1], initializer=tf.constant_initializer(0.3))
        init = tf.global_variables_initializer()
        sess.run(init)
        assert w.eval() == 0.3  # Specific initializer overrides the default.
        with tf.variable_scope("bar"):
            v = tf.get_variable("v", [1])
            init = tf.global_variables_initializer()
            sess.run(init)
            assert v.eval() == 0.4  # Inherited default initializer.
        with tf.variable_scope("baz", initializer=tf.constant_initializer(0.2)):
            v = tf.get_variable("v", [1])
            init = tf.global_variables_initializer()
            sess.run(init)
            assert v.eval() == 0.2  # Changed default initializer.
```

**`tf.variable_scope()`中操作名**

使用`tf.variable_scope("name")`会隐式的执行`tf.name_scope("name")`才做

```py
with tf.variable_scope("foo"):
    x = 1.0 + tf.get_variable("v", [1])
assert x.op.name == "foo/add"
```

`tf.name_scope("name")`对操作有效

```py
with tf.variable_scope("foo"):
    with tf.name_scope("bar"):
        v = tf.get_variable("v", [1])
        x = 1.0 + v
assert v.name == "foo/v:0"
assert x.op.name == "foo/bar/add"
```

### 4、线程与队列

像TensorFlow中的所有内容一样，队列是TensorFlow图中的一个节点。它是一个有状态的节点，像变量：其他节点可以修改其内容。特别地，节点可以将新项目排入队列，或者从队列中出现现有项目。

要想得到队列的感觉，我们来看一个简单的例子。我们将创建一个“先进先出”队列（FIFOQueue）并将其填充为零。然后，我们将构建一个将项目从队列中取出的图形，将一个添加到该项目，并将其放回队列的末尾。缓慢地，队列上的数字增加。

例子：

```py
import tensorflow as tf

q = tf.FIFOQueue(3,"float") #创建一个队列对象，容量3，数据类型float
init = q.enqueue_many(([0.,0.,0.],)) #向队列中添加元素

x = q.dequeue() #取出元素
y = x + 1 #+1
q_inc = q.enqueue([y]) #再放回

sess = tf.Session()

with sess.as_default():
    init.run() #0 0 0
    q_inc.run() #1 0 0
    q_inc.run() #1 1 0
    q_inc.run() #1 1 1
    q_inc.run() #2 1 1
```

#### （1）队列使用情况概述

队列可以帮助完成tf异步程序
例如，典型的输入架构是使用RandomShuffleQueue来准备用于训练模型的输入：

* 多线程准备训练示例并将其推入队列。
* 训练线程执行训练操作，使队列中的小批量出队

这样可以简化实现数据读入函数管道

tf的Session是多线程的。但是，实现一个驱动线程的Python程序并不容易。所有线程必须能够停止在一起，异常必须被捕获和报告，队列必须在停止时正确关闭。
所以tf提供了2个帮助器：[tf.train.Coordinator](https://www.tensorflow.org/api_docs/python/tf/train/Coordinator)和[tf.train.QueueRunner](https://www.tensorflow.org/api_docs/python/tf/train/QueueRunner)。这两个类配合使用。

* Coordinator 帮助多个线程停止在一起，并向等待其停止的程序报告异常
* QueueRunner 用于创建多个线程来协调同一队列中的张量。

#### （2）Coordinator

**关键方法**

* `tf.train.Coordinator.should_stop` 如果线程停止，则返回True
* `tf.train.Coordinator.request_stop` 请求线程应该停止
* `tf.train.Coordinator.join` 等待直到指定的线程停止

您首先创建一个Coordinator对象，然后创建一些使用协调器的线程。线程通常运行循环，当`should_stop()`返回True时停止。

任何线程都可以决定计算应该停止。它只需要调用`request_stop()`，其他线程将停止，因为`should_stop()`将返回True。

```py
import threading
num = 0

# 线程主体：循环直到协调器指示请求停止。
# 如果某些条件成立，请协调员停止。
def MyLoop(coord):
  while not coord.should_stop(): #本线程是否停止
    # ...do something...
    global num
    num += 1
    print(num)
    coord.request_stop() #请求本线程停止
    # if ...some condition...
    #  coord.request_stop()

# 主线程：创建一个协调器(coordinator)
coord = tf.train.Coordinator()

# 创建10个线程运行'MyLoop()'
threads = [threading.Thread(target=MyLoop, args=(coord,)) for i in range(10)]

# 启动线程并等待所有的线程停止。
for t in threads:
  t.start()
coord.join(threads)
```

协调员还支持捕获和报告异常情况

#### （3）QueueRunner

QueueRunner类创建了多个重复运行入队的线程。这些线程可以使用协调器来停止。另外，如果向协调器报告异常，则队列运行器会运行一个更接近的线程，该线程会自动关闭队列。

您可以使用队列运行程序来实现上述架构。

首先构建使用TensorFlow队列（例如tf.RandomShuffleQueue）作为输入示例的图形。添加操作流程示例并将其排入队列。添加从排队队列开始的训练操作。

```py
example = ...ops to create one example...
# 创建一个队列，一个op在队列中一次插入一个示例。
queue = tf.RandomShuffleQueue(...)
enqueue_op = queue.enqueue(example)
# 创建一个训练图，首先出现一批示例。
inputs = queue.dequeue_many(batch_size)
train_op = ...use 'inputs' to build the training part of the graph...

# Create a queue runner that will run 4 threads in parallel to enqueue
# examples.
qr = tf.train.QueueRunner(queue, [enqueue_op] * 4)

# Launch the graph.
sess = tf.Session()
# Create a coordinator, launch the queue runner threads.
coord = tf.train.Coordinator()
enqueue_threads = qr.create_threads(sess, coord=coord, start=True)
# Run the training loop, controlling termination with the coordinator.
for step in xrange(1000000):
    if coord.should_stop():
        break
    sess.run(train_op)
# When done, ask the threads to stop.
coord.request_stop()
# And wait for them to actually do it.
coord.join(enqueue_threads)
```

#### （4）处理异常

```py
try:
    for step in xrange(1000000):
        if coord.should_stop():
            break
        sess.run(train_op)
except Exception, e:
    # Report exceptions to the coordinator.
    coord.request_stop(e)
finally:
    # Terminate as usual. It is safe to call `coord.request_stop()` twice.
    coord.request_stop()
    coord.join(threads)
```

### 5、读入数据

获取数据到TensorFlow程序有三种主要方法：

* 喂食：Python代码在运行每个步骤时提供数据
* 从文件读取：在TensorFlow图的开始通过输入流读取
* 预加载数据：TensorFlow图中的常量或变量保留所有数据（针对小数据集）

#### （1）喂食（Feeding）

TensorFlow的进给机制允许您在计算图中将数据注入任何Tensor。一个python计算可以直接将数据喂给计算图

通过feed_dict参数将Feed数据提供给启动计算的`run()`或`eval()`调用

```py
with tf.Session():
  input = tf.placeholder(tf.float32)
  classifier = ...
  print(classifier.eval(feed_dict={input: my_python_preprocessing_fn()}))
```

虽然您可以用Feed数据（包括变量和常量）替换任何Tensor，但最佳做法是使用tf.placeholder节点。占位符仅仅是作为数据喂给的目标。它未初始化并且不包含任何数据。占位符如果在没有Feed的情况下执行，则会生成错误，因此您不会忘记将其提供。

#### （2）从文件读取

从文件读取记录的典型管道有以下几个阶段：

* 构建文件名列表
* 可选——文件名乱序
* 可选——期限
* 文件名队列
* 文件格式读取器
* 解码器
* 可选预处理
* 示例队列

**文件名、乱序和期限**

```py
#创建文件名列表
fileNameList = [("file%d"%i) for i in range(5)]
# print(tf.train.match_filenames_once())
print(fileNameList)

#构建文件名队列
fileNamequeue = tf.train.string_input_producer(fileNameList,shuffle=True)
print(fileNamequeue)
```

**文件格式**

根据文件格式选取合适的文件读取器，并将文件名传递给他。读取方法输出一个标识文件和记录的键（如果您有一些奇怪的记录，则用于调试）和标量字符串值。使用一个（或多个）解码器和转换ops将该字符串解码为组成示例的张量。

*CSV格式文件*

读取cvs格式的文本文件，使用`tf.TextLineReader`配合`tf.decode_csv`操作，例子：

```py
# 空列情况下默认值. 同时制定数据类型
record_defaults = [[1.], [1.], [1.], [1.], [1.],[1.], [1.],[1], [1.], [1.]]
col1, col2, col3, col4, col5,col6, col7, col8, col9,col10 = tf.decode_csv(
    value, record_defaults=record_defaults)
features = tf.stack([col1, col2, col3, col4, col5,col6, col7, col9,col10])

with tf.Session() as sess:
  # 开始填充文件名队列
  coord = tf.train.Coordinator()
  threads = tf.train.start_queue_runners(coord=coord)

  for i in range(101):
    # 检索单个实例：
    example, label = sess.run([features, col8])
    print(example,label)

  coord.request_stop()
  coord.join(threads)
```

*固定长度记录*

使用[tf.FixedLengthRecordReader](https://www.tensorflow.org/api_docs/python/tf/FixedLengthRecordReader)和[tf.decode_raw](https://www.tensorflow.org/api_docs/python/tf/decode_raw)

*标准TensorFlow格式*

https://www.github.com/tensorflow/tensorflow/blob/r1.2/tensorflow/examples/how_tos/reading_data/convert_to_records.py

**预处理**

https://github.com/tensorflow/models/tree/master/tutorials/image/cifar10/cifar10_input.py

**分批次**

```py
# 读取文件并格式化
def read_my_file_format(filename_queue):
  reader = tf.SomeReader()
  key, record_string = reader.read(filename_queue)
  example, label = tf.some_decoder(record_string)
  processed_example = some_processing(example)
  return processed_example, label

# 输入函数
def input_pipeline(filenames, batch_size, num_epochs=None):
  filename_queue = tf.train.string_input_producer(
      filenames, num_epochs=num_epochs, shuffle=True) #创建文件名队列
  example, label = read_my_file_format(filename_queue)
  # min_after_dequeue 定义有多大的随机抽取的缓冲区
  #   设定大意味着，随机化程度高，但是启动更慢，内存使用更多
  # 容量必须大于min_after_dequeue，并且数量较大确定我们将预取的最大值。建议：
  #   min_after_dequeue + (num_threads + a small safety margin) * batch_size
  min_after_dequeue = 10000
  capacity = min_after_dequeue + 3 * batch_size
  example_batch, label_batch = tf.train.shuffle_batch(
      [example, label], batch_size=batch_size, capacity=capacity,
      min_after_dequeue=min_after_dequeue)
  #example_batch, label_batch = tf.train.shuffle_batch_join(
  #    example_list, batch_size=batch_size, capacity=capacity,
  #    min_after_dequeue=min_after_dequeue) #多文件混淆
  return example_batch, label_batch
```

**使用QueueRunner对象创建线程以进行预取**

最佳实践：

```py
init_op = tf.global_variables_initializer()
sess = tf.Session()
sess.run(init_op)

# 开启输入线程队列
coord = tf.train.Coordinator()
threads = tf.train.start_queue_runners(sess=sess, coord=coord)

try:
    while not coord.should_stop():
        # 运行训练步骤或者其他什么
        sess.run(train_op)
except tf.errors.OutOfRangeError: #异常
    print('Done training -- epoch limit reached')
finally:
    # 关闭线程
    coord.request_stop()

# 等待线程结束
coord.join(threads)
sess.close()
```

#### （3）预加载数据

这仅用于可以完全加载到内存中的小型数据集。有两种方法：

* 将数据存储在常量中。
* 将数据存储在变量中，即初始化，然后再不变。

**使用常量**

```py
training_data = ...
training_labels = ...
with tf.Session():
  input_data = tf.constant(training_data)
  input_labels = tf.constant(training_labels)
  ...
```

**使用变量**

```py
training_data = ...
training_labels = ...
with tf.Session() as sess:
  data_initializer = tf.placeholder(dtype=training_data.dtype,
                                    shape=training_data.shape)
  label_initializer = tf.placeholder(dtype=training_labels.dtype,
                                     shape=training_labels.shape)
  input_data = tf.Variable(data_initializer, trainable=False, collections=[])
  input_labels = tf.Variable(label_initializer, trainable=False, collections=[])
  ...
  sess.run(input_data.initializer,
           feed_dict={data_initializer: training_data})
  sess.run(input_labels.initializer,
           feed_dict={label_initializer: training_labels})
```

#### （4）多输入管道

略

### 6、监视器：长期培训的培训帮手

要使用TensorFlow训练一个模型，您可以简单地运行训练多次，并在完成后保存训练参数的检查点。这对于能够在几个小时内训练的小型训练很有效。

较大的模型：

* 处理停机并彻底崩溃
* 可以在关机或崩溃后恢复
* 可以通过TensorBoard进行监控

为了能够在停机或崩溃后恢复训练，训练过程必须定期保存检查点。在重新启动时，它必须查找最新的检查点，并在恢复培训之前加载它。

`tf.train.Supervisor`提供一组有助于实施健壮训练过程的服务。

本教程如何显示如何直接使用监视器。还请考虑使用建立在监视器之上的几个框架之一，提供更丰富的培训循环，以及众多的定制选项：tf.learn是一个不错的选择。

请注意，主管对训练大型训练非常有帮助，但也可以用于较小训练，不受任何限制

#### （1）非常简单的场景

使用监视器的最简单的方案是：

* 创建一个Supervisor对象，将其传递到保存检查点和摘要的目录
* 向Supervisor询问与tf.train.Supervisor.managed_session的会话
* 如果监视器请求训练停止，使用session执行训练操作，检查每一步

```py
  ...create graph...
  my_train_op = ...

  sv = tf.train.Supervisor(logdir="/my/training/directory")
  with sv.managed_session() as sess:
    for step in range(100000):
      if sv.should_stop():
        break
      sess.run(my_train_op)
```

**开始服务**
在非常简单的情况下，`managed_session()`调用启动一些服务，它们在自己的线程中运行，并使用托管会话在图中运行ops。
