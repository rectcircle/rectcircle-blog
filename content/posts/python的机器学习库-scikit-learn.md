---
title: python的机器学习库-scikit-learn
date: 2017-09-11T12:49:20+08:00
draft: false
toc: false
comments: true
aliases:
  - /detail/92
  - /detail/92/
tags:
  - 机器学习
  - python
---

<script src="https://cdn.bootcss.com/mathjax/2.7.0/MathJax.js?config=default"></script>


> http://scikit-learn.org/stable/documentation.html
>  http://cwiki.apachecn.org/pages/viewpage.action?pageId=10030181

## 目录
* [一、安装](#一、安装)
* [二、快速入门](#二、快速入门)
	* [1、机器学习：问题设置](#1、机器学习：问题设置)
	* [2、加载示例数据集](#2、加载示例数据集)
	* [3、学习和预测](#3、学习和预测)
	* [4、模型持久化](#4、模型持久化)
	* [5、约定](#5、约定)
* [三、监督学习](#三、监督学习)
	* [1、广义线性模型](#1、广义线性模型)
* [四、Tutorials](#四、Tutorials)
	* [1、快速入门](#1、快速入门)
	* [2、统计学习](#2、统计学习)


## 一、安装
*******************************
### 要求
Python (>= 2.7 or >= 3.3),
NumPy (>= 1.8.2),
SciPy (>= 0.13.3).

### 安装命令
```py
pip install -U scikit-learn
```

### 注意事项
* Windows下直接pip安装可能出错，前往 http://www.lfd.uci.edu/~gohlke/pythonlibs/ 下载对应的`scipy`
* Windows下直接pip安装numpy可能出错，应前往 http://www.lfd.uci.edu/~gohlke/pythonlibs/ 下载对应的`numpy+mkl`版本的`numpy`
* 安装命令
```
cd .whl文件目录
pip install xxx.whl
```


## 二、快速入门
*************************************
### 1、机器学习：问题设置
略
### 2、加载示例数据集
scikit-learn提供了一些标准数据集，例如 用于分类的 [鸢尾花](https://en.wikipedia.org/wiki/Iris_flower_data_set)和[手写数字](http://archive.ics.uci.edu/ml/datasets/Pen-Based+Recognition+of+Handwritten+Digits)数据集和用于回归的 波士顿房价 数据集。
```py
from sklearn import datasets
iris = datasets.load_iris()
digits = datasets.load_digits() 
```

数据集是一个类似字典的对象，它保存有关数据的所有数据和一些元数据。
`.data`是一个二维数组，保存的是数据样本，
`.target`是一个向量，保存的是数据样本对应的标签，
`.target_names`是一个向量，保存的是所有标签的集合
`.images`是一个三维数组，保存的是原始手写数字的图片集合
```py
In [2]: digits.data.shape
Out[2]: (1797, 64)

In [3]: digits.target.shape
Out[3]: (1797,)

In [4]: digits.target_names.shape
Out[4]: (10,)

In [5]: digits.images.shape
Out[5]: (1797, 8, 8)
```

see to :
* [简单示例](http://scikit-learn.org/stable/auto_examples/classification/plot_digits_classification.html#sphx-glr-auto-examples-classification-plot-digits-classification-py)
* [数据集加载单元](http://scikit-learn.org/stable/datasets/index.html#datasets)

### 3、学习和预测
识别手写数字的目标是：给出图像来预测其表示的数字。
我们给出了10个可能类（数字从零到九）中的每一个的样本，我们在其上拟合一个 估计器，以便能够预测 看不见的样本所属的类。

在scikit-learn中，分类估计器是一个python对象，它实现了`fit(X, y)` 和 `predict(T)`方法

估计器的一个实例是sklearn.svm.SVC类，它实现了支持向量机的分类器。估计器的构造函数的参数是模型参数（超参数），可以将其看作黑盒
```py
from sklearn import svm
clf = svm.SVC(gamma=0.001, C=100.) 
```

#### （1）选择模型参数
在这个例子中，我们设置gamma手动的值。通过使用诸如网格搜索和交叉验证等工具，可以自动找到参数的良好值。

我们已将创建了一个估计器，但是必须从适应模型（fit），也就是说，它必须从模型中学习。使用`fit(X,y)`方法完成
```py
clf.fit(digits.data[:-1], digits.target[:-1]) 
```

现在，您可以使用预测`predict(X)`新值，特别是可以向分类器询问digits数据集中最后一个图像的数字是什么：
```py
clf.predict(digits.data[-1:]) #预测结果
digits.target[-1:] #正确结果
```


### 4、模型持久化
可以通过使用Python的内置持久化模型（即pickle）将模型保存下来：
```py
import pickle
s = pickle.dumps(clf)
clf2 = pickle.loads(s)
clf2.predict(X[0:1])
digits.target[0:1]
```

在特殊情况下，使用joblib的joblib.dump＆joblib.load替换pickle可能会对大数据更有效，但只能持久化到磁盘而不是字符串：
```py
from sklearn.externals import joblib
joblib.dump(clf, 'filename.pkl') 
clf = joblib.load('filename.pkl')  
```

see to :
* https://pythonhosted.org/joblib/persistence.html
* http://scikit-learn.org/stable/modules/model_persistence.html#model-persistence



### 5、约定
#### （1）类型转换
* 除非另有规定，输入将被转换为float64
* 回归的target被转换为float64
* 估计器的超参数可以在通过该`sklearn.pipeline.Pipeline.set_params`方法构建之后进行更新
* 多类与多标签拟合时：所执行的学习和预测任务取决于适合的目标数据的格式

```py
>>> from sklearn import datasets
>>> from sklearn.svm import SVC
>>> iris = datasets.load_iris()
>>> clf = SVC()
>>> clf.fit(iris.data, iris.target) 
SVC(C=1.0, cache_size=200, class_weight=None, coef0=0.0,
  decision_function_shape=None, degree=3, gamma='auto', kernel='rbf',
  max_iter=-1, probability=False, random_state=None, shrinking=True,
  tol=0.001, verbose=False)
 
>>> list(clf.predict(iris.data[:3]))
[0, 0, 0]
 
>>> clf.fit(iris.data, iris.target_names[iris.target]) 
SVC(C=1.0, cache_size=200, class_weight=None, coef0=0.0,
  decision_function_shape=None, degree=3, gamma='auto', kernel='rbf',
  max_iter=-1, probability=False, random_state=None, shrinking=True,
  tol=0.001, verbose=False)
 
>>> list(clf.predict(iris.data[:3])) 
['setosa', 'setosa', 'setosa'] 
```
这里，第一个predict()返回一个整数数组，因为iris.target 使用了一个整数数组fit。第二个predict()返回一个字符串数组，因为iris.target_names是用于拟合。


## 三、监督学习
**********************************
### 1、广义线性模型
以下是一组用于回归的方法，其中目标值预期是输入变量的线性组合。在数学概念中，\\(\hat{y}\\)是预测值
$$
\hat{y}(w,x) = w\_0 + w\_1x\_1+...+w\_px\_p
$$
在整个模块中，我们指定向量\\(w=(w\_1, w\_2,... ,w\_p)\\)作为`coef_`，\\(w\_0\\) 作为`intercept_`

要使用广义线性回归执行分类，请参阅[Logistic 回归](http://scikit-learn.org/stable/modules/linear_model.html#logistic-regression)

#### （1）普通最小二乘法
LinearRegression fits a linear model with coefficients \\(w=(w\_1, w\_2,... ,w\_p)\\) to minimize the residual sum of squares between the observed responses in the dataset, and the responses predicted by the linear approximation. Mathematically it solves a problem of the form:

[LinearRegression](http://scikit-learn.org/stable/modules/generated/sklearn.linear_model.LinearRegression.html#sklearn.linear_model.LinearRegression) （线性回归）拟合具有系数\\(w=(w\_1, w\_2,... ,w\_p)\\) 的线性模型，来最小化 数据集中观察到的响应之间的残差平方和，以及通过线性近似预测的响应。在数学上它解决了一个形式的问题：
$$
\min\_{w} ||X\_w-y||\_2^2
$$

LinearRegression ( 线性回归 ) 将采用其拟合方法数组 X ， y 并将其线性模型的系数 w 存储在其 coef\_ 成员中：
```py
from sklearn import linear_model
reg = linear_model.LinearRegression()
reg.fit ([[0, 0], [1, 1], [2, 2]], [0, 1, 2])
reg.coef_
```

优劣：[正规方程Normal Equation求解线性回归](https://www.rectcircle.cn/detail/64)

**复杂度**

该方法使用 X 的 singular value decomposition ( 奇异值分解 ) 来计算最小二乘解。如果 X 是 size(n, p) 的矩阵，则该方法的成本为 O(np^2)，当n>=p。

#### （2）岭回归 
```py
from sklearn import linear_model
reg = linear_model.Ridge (alpha = .5)
reg.fit ([[0, 0], [0, 0], [1, 1]], [0, .1, 1])
reg.coef_
reg.intercept_
```
**复杂度**
这种方法与 普通最小二乘方法 的复杂度相同。

#### （3）Lasso
```py
from sklearn import linear_model
reg = linear_model.Lasso(alpha = 0.1)
reg.fit([[0, 0], [1, 1]], [0, 1])
reg.predict([[1, 1]])
```

#### （4）Multi-task Lasso (多任务套索)

### 看不懂。。。


## 四、Tutorials
***************************************
### 1、快速入门
转到 [二、快速入门](#二、快速入门)

### 2、统计学习
> http://scikit-learn.org/stable/tutorial/statistical_inference/supervised_learning.html

#### （1）统计学习的设定和估计器对象
**数据集**
Scikit学习处理来自用2D数组表示的一个或多个数据集的学习信息。它们可以被理解为多维观察的列表。我们说这些阵列的第一个轴是样本轴，而第二个轴是特征轴。

scikit自带的一个简单的数据集：iris数据集
```py
>>> from sklearn import datasets
>>> iris = datasets.load_iris()
>>> data = iris.data
>>> data.shape
(150, 4)
```
它由150个iris花的观察组成，每个由4个特征描述：它们的萼片和花瓣的长度和宽度，详细参见`iris.DESCR`

当数据最初不在`(n_samples, n_features)`形状时，需要进行预处理才能被scikit学习使用。


**估计器对象**
fitting数据：scikit-learn的主要API实现叫做估计器。一个估计器对象从数据中学习；它可能是一个分类器，回归器或者聚类算法或者从行数据中提取过滤的transformer

All estimator objects expose a fit method that takes a dataset (usually a 2-d array):
所有的估计器对象都公开了一个针对二位数据集的`fit`方法
```py
>>> estimator.fit(data)
```

估计器参数：估计器的所有参数可以在实例化时设置，或通过修改相应的属性实现：
```py
>>> estimator = Estimator(param1=1, param2=2)
>>> estimator.param1
1
```

估计参数：当数据与估计器拟合时，根据手头的数据估计参数。所有估计的参数是以下划线结尾的估计对象的属性：
```py
>>> estimator.estimated_param_ 
```

#### （2）监督学习：从高维观察预测输出变量
在监督学习中解决的问题：
[监督学习](http://scikit-learn.org/stable/supervised_learning.html#supervised-learning)包括学习两个数据集之间的联系：观察数据X和我们试图预测的外部变量y，通常称为“目标”或“标签”。通常，y是长度为n_samples的1D阵列。
scikit-learning中的所有监督估计器都包含`fit(X,y)`方法来拟合模型和`predict(X)`方法，给定未标记的观察值X返回预测标签y。

名词解析：分类和回归
如果预测任务是在一组有限标签中对观测值进行分类，换句话说，将“观察到”对象命名，则该任务被称为分类任务。另一方面，如果目标是预测连续的目标变量，则被认为是回归任务。
在scikit学习中进行分类时，y是整数或字符串的向量。


**最近邻和维度灾难**
irises数据集
```py
import numpy as np
from sklearn import datasets
iris = datasets.load_iris()
iris_X = iris.data
iris_y = iris.target
np.unique(iris_y)
```

k-最近邻 分类（KNN）
算法描述：
kNN算法的核心思想是如果一个样本在特征空间中的k个最相邻的样本中的大多数属于某一个类别，则该样本也属于这个类别，并具有这个类别上样本的特性。该方法在确定分类决策上只依据最邻近的一个或者几个样本的类别来决定待分样本所属的类别。
https://baike.baidu.com/item/%E9%82%BB%E8%BF%91%E7%AE%97%E6%B3%95

```py
# 将数据分割为训练集和测试集
# 随机排列，随机分割数据
np.random.seed(0)
indices = np.random.permutation(len(iris_X))
iris_X_train = iris_X[indices[:-10]]
iris_y_train = iris_y[indices[:-10]]
iris_X_test  = iris_X[indices[-10:]]
iris_y_test  = iris_y[indices[-10:]]
# 创建并拟合最近邻分类器
from sklearn.neighbors import KNeighborsClassifier
knn = KNeighborsClassifier()
knn.fit(iris_X_train, iris_y_train) 

knn.predict(iris_X_test)
iris_y_test
```

维度灾难：随着维度增加（超过一个临界值，但是训练数据没有增加）分类器的性能直线下降（过拟合）
参考：https://zhuanlan.zhihu.com/p/22403460

**线性模型：从回归到稀疏**
糖尿病数据集：
糖尿病数据集包括对442名患者的10个生理变量（年龄，性别，体重，血压）测量值，以及一年后疾病进展的指标：
```py
import numpy as np
from sklearn import datasets
diabetes = datasets.load_diabetes()
diabetes_X_train = diabetes.data[:-20]
diabetes_X_test  = diabetes.data[-20:]
diabetes_y_train = diabetes.target[:-20]
diabetes_y_test  = diabetes.target[-20:]
```
任务是预测生理变量的疾病进展。
```py
from sklearn import linear_model
regr = linear_model.LinearRegression()
regr.fit(diabetes_X_train, diabetes_y_train)

print(regr.coef_) # 优化后的学习参数

# 平均平方误差
np.mean((regr.predict(diabetes_X_test)-diabetes_y_test)**2)


# Explained variance score: 1 is perfect prediction
# and 0 means that there is no linear relationship
# between X and y.
regr.score(diabetes_X_test, diabetes_y_test) 
```

特征缩减
If there are few data points per dimension, noise in the observations induces high variance:
如果每个维度几乎没有数据点，则观测值中的噪声会导致高方差：
```py
X = np.c_[ .5, 1].T
y = [.5, 1]
test = np.c_[ 0, 2].T
regr = linear_model.LinearRegression()

import matplotlib.pyplot as plt 
plt.figure() 

np.random.seed(0)
for _ in range(6): 
   this_X = .1*np.random.normal(size=(2, 1)) + X
   regr.fit(this_X, y)
   plt.plot(test, regr.predict(test)) 
   plt.scatter(this_X, y, s=3)  
```

高维统计学习的一个解决方案是将回归系数缩小到零：任何两个随机选择的观察集可能是不相关的。这就是所谓的**岭回归**：
```py
regr = linear_model.Ridge(alpha=.1)

plt.figure() 

np.random.seed(0)
for _ in range(6): 
   this_X = .1*np.random.normal(size=(2, 1)) + X
   regr.fit(this_X, y)
   plt.plot(test, regr.predict(test)) 
   plt.scatter(this_X, y, s=3) 
```

这是偏差/方差折衷的一个例子：脊α参数越大，偏差越高，方差越小。
我们可以选择alpha来减少遗漏误差，这次使用糖尿病数据集而不是我们的合成数据：
```py
alphas = np.logspace(-4, -1, 6)
print([regr.set_params(alpha=alpha
            ).fit(diabetes_X_train, diabetes_y_train,
            ).score(diabetes_X_test, diabetes_y_test) for alpha in alphas]) 
```
捕获拟合参数噪声阻止模型推广到新数据称为过拟合。由山脊回归引入的偏差称为正则化。

稀疏数据的压缩

完整的糖尿病数据集的表示将涉及11个维度（10个特征维度和目标变量之一）。很难在这样的表现上形成一种直觉，但是记住它将是一个相当空白的空间可能是有用的。

我们可以看到，虽然特征2在整个模型上具有很强的系数，但在考虑特征1时，它传达了关于y的很少信息。为了改善问题的调节（即减轻维度灾难），仅选择信息特征并设置非信息特征（如特征2至0）将是有趣的。岭回归将减少其贡献，但不能将其设置为零。另一种惩罚方法，称为Lasso（最小绝对收缩和选择算子），可以将一些系数设置为零。这种方法被称为稀疏方法，稀疏性可以看作是奥卡姆剃须刀的应用：更喜欢更简单的模型
```py
regr = linear_model.Lasso()
scores = [regr.set_params(alpha=alpha
            ).fit(diabetes_X_train, diabetes_y_train
            ).score(diabetes_X_test, diabetes_y_test)
       for alpha in alphas]
best_alpha = alphas[scores.index(max(scores))]
regr.alpha = best_alpha
regr.fit(diabetes_X_train, diabetes_y_train)
print(regr.coef_)
```


逻辑回归
```py
logistic = linear_model.LogisticRegression(C=1e5)
logistic.fit(iris_X_train, iris_y_train)
```


**支持向量机**
```py
from sklearn import svm
svc = svm.SVC(kernel='linear')
svc.fit(iris_X_train, iris_y_train)   
```
使用核函数
```py
svc = svm.SVC(kernel='linear') # 线性核函数
svc = svm.SVC(kernel='poly',
              degree=3) # 多项式核函数
svc = svm.SVC(kernel='rbf')
# gamma: inverse of size of
# radial kernel # 径向基函数
```

样例：
http://scikit-learn.org/stable/_downloads/plot_iris_exercise.py
