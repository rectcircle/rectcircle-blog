---
title: python的科学计算包-Numpy
date: 2017-08-16T12:55:17+08:00
draft: false
toc: false
comments: true
aliases:
  - /detail/88
  - /detail/88/
tags:
  - 机器学习
  - python
---

> https://docs.scipy.org/doc/numpy/index.html

## 目录
* [一、数据类型array](#一、数据类型array)
	* [1、array简介](#1、array简介)
	* [2、创建array](#2、创建array)
	* [3、array的切片和索引](#3、array的切片和索引)
	* [4、array的属性](#3、array的属性)
	* [5、array元素的类型](#4、array元素的类型)
	* [6、array的重载运算符方法](#6、array的重载运算符方法)
	* [7、array的成员方法](#7、array的成员方法)
	* [8、array的广播规则](#8、array的广播规则)
	* [9、随机模块](9、随机模块)
* [二、array操作](#二、array操作)
	* [1、数组操作例程](#1、数组操作例程)
	* [2、线性代数相关操作](#2、线性代数相关操作)




## 一、数据类型array
*******************************************
### 1、array简介
array，也就是数组，是numpy中最基础的数据结构，最关键的属性是维度和元素类型。array是np中最基本的运算单元。
array是一个相同类型的元素列表，通过整数元组索引。


### 2、创建array
> https://docs.scipy.org/doc/numpy/reference/routines.array-creation.html

#### （1）使用`np.array()`由Python列表初始化创建
```py
a = [1, 2, 3, 4]     	
b = np.array(a)

c = [[1, 2], [3, 4]]  	# 二维列表
d = np.array(c)         	# 二维numpy数组
```
函数声明：`numpy.array(object, dtype=None, copy=True, order='K', subok=False, ndmin=0)`
* `object`：一个数组，任何暴露了数组接口的对象（也就是说对象的`__array__`方法返回一个数组），或者任何（嵌套）序列
* https://docs.scipy.org/doc/numpy/reference/generated/numpy.array.html


#### （2）其他从已存在数据创建
* `asarray(a[, dtype, order])`，类似于`array()`，但是当a为narray时，不会发生拷贝
* `asanyarray(a[, dtype, order])`	Convert the input to an ndarray, but pass ndarray subclasses through.
* `ascontiguousarray(a[, dtype])`	Return a contiguous array in memory (C order).
* `asmatrix(data[, dtype])`	创建一个矩阵
* `copy(a[, order])`	拷贝
* `frombuffer(buffer[, dtype, count, offset])`	将缓冲区作为一个一维数组
* `fromfile(file[, dtype, count, sep])`	从文本或二进制文件中的数据构造数组。
* `fromfunction(function, shape, **kwargs)`	Construct an array by executing a function over each coordinate.
* `fromiter(iterable, dtype[, count])`	从可迭代对象创建
* `fromstring(string[, dtype, count, sep])`	从字符串创建一维数组
* `loadtxt(fname[, dtype, comments, delimiter, ...])`	从文本文件创建

例子
```py
b = np.array(a)

np.asarray(b) is b
np.array(b) is b
np.fromstring('\x01\x02', dtype=np.uint8)
np.fromstring('1 2', dtype=int, sep=' ')
np.fromstring('1, 2', dtype=int, sep=',')
np.fromstring('\x01\x02\x03\x04\x05', dtype=np.uint8, count=3)
```

#### （3）以特定规则创建
* `empty(shape[, dtype, order])`	指定形状和类型创建空数组，元素值随机
* `empty_like(a[, dtype, order, subok])`	创建和a数组形状相同的数组，元素值随机
* `eye(N[, M, k, dtype])`	创建特殊二位矩阵，某条对角线为的值为1，其他元素值为0
* `identity(n[, dtype])`	返回单位矩阵（n\*n的方阵，主对角线全为1，其他元素值为0）
* `ones(shape[, dtype, order])`	返回以1为填充的数组
* `ones_like(a[, dtype, order, subok])`	创建和a数组形状相同的数组，以1为填充
* `zeros(shape[, dtype, order])`	返回以0为填充的数组
* `zeros_like(a[, dtype, order, subok])`	创建和a数组形状相同的数组，以0为填充
* `full(shape, fill_value[, dtype, order])`	返回给定形状和类型的新数组，填充值为标量fill_value
* `full_like(a, fill_value[, dtype, order, subok])`	创建和a数组形状相同的数组，填充值为标量fill_value

```py
np.empty(1)
np.empty([1])
np.empty([2,3])

np.eye(3)
np.identity(3)
np.ones(3)
np.zeros(3)
np.full([2,3],2)
```

#### （4）创建记录数组
略
#### （5）创建字符数组
略
#### （6）数值范围
* `np.arange([start,] stop[, step,][, dtype])` 在给定的间隔内返回均匀间隔的值（给定间隔）
* `np.linspace(start, stop[, num, endpoint, ...])`	在指定的间隔内返回均匀间隔的数字（给定返回的数字个数）
* `np.logspace(start, stop[, num, endpoint, base, ...])`	返回数字在对数刻度上均匀间隔。
* `np.geomspace(start, stop[, num, endpoint, dtype])`	返回数字在对数刻度上平均间隔（几何级数）
* `np.meshgrid(*xi, **kwargs)` 从坐标向量返回坐标矩阵。
* `np.mgrid`	nd_grid instance which returns a dense multi-dimensional “meshgrid”.
* `np.ogrid`	nd_grid instance which returns an open multi-dimensional “meshgrid”.

```py
np.arange(0,3)
np.arange(0,3,0.5)
np.linspace(0,3,6)
np.logspace(0,4)
np.geomspace(0,4)
```

#### （7）创建矩阵
* `np.diag(v[, k])`	提取对角线或构造对角阵列
* `np.diagflat(v[, k])` 将v转换为1维再构造矩阵对焦矩阵
* `np.tri(N[, M, k, dtype])` 一个数组，其中给定对角线和下方的数组和其他地方的零
* `np.tril(m[, k])`	下三角形矩阵
* `np.triu(m[, k])`	上三角形矩阵
* `np.vander(x[, N, increasing])`	生成Vandermonde矩阵

```py
np.diag([1,1,1])
np.diag([1,1,1],1)
np.diag([1,1,1],-1)
np.diag(np.array([[1,2,3],[4,5,6],[7,8,9]]))
np.diagflat([[1,2],[3,4]])
np.tri(3, 5, 2)
np.tri(3, 5, -1)
np.tril([[1,2,3],[4,5,6],[7,8,9],[10,11,12]], -1)
np.triu([[1,2,3],[4,5,6],[7,8,9],[10,11,12]], -1)
np.vander([1,2,3,5], 3)
np.vander([1,2,3,5], increasing=True)
```

#### （8）矩阵类

* `np.mat(data[, dtype])` 将data解释成矩阵
* `np.bmat(obj[, ldict, gdict])`	从字符串，嵌套序列或数组构建矩阵对象


### 3、array的切片和索引
> https://docs.scipy.org/doc/numpy/reference/arrays.indexing.html#arrays-indexing

#### （1）索引
通过`x[obj]`表达式，索引从0开始，取出元素
```py
d = np.array([[1,2,3],[4,5,6],[7,8,9]])
d[1,2]
```

#### （2）切片
**基本切片表达式：**
`x[i:j:k]`
`i`表示起始索引（包括），`j`表示结束索引（不包括），`k`表示步长默认为1，
```py
x = np.array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
x[1:7:2]
x[1:7]
```
**负数i，j，k**
负数`i`表示索引`n + i`，负数`j`表示`n+j`，`n`表示元素个数
负数`k`表示递减（当起始索引在结束索引后面，否则将取回`array([], dtype=int32)`）
```py
x[-2:10]
x[-3:3:-1]
x[1:3:-1]
x[3:1:-1]
```

**i或j不填**
表示一直切片到尽头
```py
x[5:] # array([5, 6, 7, 8, 9])
x[-5:] # array([5, 6, 7, 8, 9])
x[-5::1] # array([5, 6, 7, 8, 9])
x[-5::-1] # array([5, 4, 3, 2, 1, 0])
```

**全部不填**
选中全部
```py
x[:]
```

**多维的情况**
按照各个维度进行切片
```py
x = np.array([[[1],[2],[3]], [[4],[5],[6]]])
x[1:2]
x[1:]
x[1:,:,:]
# 以上三种等价 array([[[4],[5],[6]]])
```

**省略号**
等价于多个前缀`:`
```py
x[...,0] # 等价于x[:,:,0]
```

**np.newaxis**
添加一个维度
```py
x[:,np.newaxis,:,:].shape # 等价于x[:,None,:,:].shape
```

**一个整数`i`与`i:i+1`的区别**
`i`：表示取出元素，减少一个维度
`i:i+1`：进行切片，只包含一个元素，维度不变
```py
x[...,0]   #array([[1, 2, 3],[4, 5, 6]])
x[...,0:1] #array([[[1],[2],[3]],[[4],[5],[6]]])
```

#### （3）高级索引
当选择成分为非元组的对象将触发高级索引（元素必须为整型或者bool型）

高级索引将返回拷贝而不是一个基本索引的视图

`x[(1,2,3),]`将触发高级索引，` x[(1,2,3)]`相当于`x[1,2,3]`触发基本索引
`x[[1,2,3]]`将触发高级索引，`x[[1,2,slice(None)]]`将触发普通索引

**整数数组索引**
假设为二维数组，基本形式为`[rows, columns]`，rows为列表，表示选中的行，columns为选中的列，行列组成坐标组成新的切片

*例子1*
```py
x = np.array([[1, 2], [3, 4], [5, 6]])
x[[0, 1, 2], [0, 1, 0]] #array([1, 4, 5])
```
以上说明：
选取第0,1,3行的对应的第0,1,0列的元素
也就是说选取坐标为(0,0),(1,1),(2,0)的元素
等价于`np.array([x[0,0],x[1,1],x[2,0]])`


*例子2*
```py
x = np.array([[ 0,  1,  2],
           [ 3,  4,  5],
           [ 6,  7,  8],
           [ 9, 10, 11]])
rows = [[0, 0], 
        [3, 3]]
columns = [[0, 2], 
           [0, 2]]
x[rows, columns] #array([[ 0,  2], [ 9, 11]])
```
等价于
```py
np.array([[ x[0,0], x[0,2] ],
          [ x[3,0], x[3,2] ]])
```
等价于
```py
x[[[0],[3]], [0,2]]
```
等价于
```py
x[np.ix_([0,3], [0,2])]
```

*综合应用高级索引和基本索引*
```py
x[1:2, 1:3] #array([[4, 5]])
# 等价于 x[1:2, [1, 2]]
```


**bool数组索引**
类似于一种过滤器,True的元素被选中，False的元素被剔除
```py
x = np.array([[1., 2.], [np.nan, 3.], [np.nan, np.nan]])
x[~np.isnan(x)] #array([ 1.,  2.,  3.])

x = np.array([1., -1., -2., 3])
x[x < 0] += 20 # array([  1.,  19.,  18.,   3.])

x = np.array([[0, 1], [1, 1], [2, 2]])
rowsum = x.sum(-1) # array([1, 2, 4])
x[rowsum <= 2, :] # array([[0, 1], [1, 1]])

x = np.array([[ 0,  1,  2],
           [ 3,  4,  5],
           [ 6,  7,  8],
           [ 9, 10, 11]])
rows = (x.sum(-1) % 2) == 0 # array([False,  True, False,  True], dtype=bool)
columns = [0, 2]
x[np.ix_(rows, columns)] #array([[ 3,  5], [ 9, 11]])
# 等价于 x[rows[:, np.newaxis], columns]
```



### 4、array的属性
* `ndarray.flags` Information about the memory layout of the array
* **`ndarray.shape`** 数组的形状，返回数组各个维度的大小的元组
* `ndarray.strides` 遍历数组时在每个维中步进的字节数。
* **`ndarray.ndim`** 数组的维度
* `ndarray.data` 指向数组数据开头的Python缓冲区对象
* **`ndarray.size`** 数组的元素数
* `ndarray.itemsize` 一个数组元素的长度（以字节计）
* `ndarray.nbytes` 数组元素消耗的总字节数
* `ndarray.base` 内存来自某个其他对象的基础对象
* **`ndarray.dtype`** 数组的元素数据类型


### 5、array元素的类型
> https://docs.scipy.org/doc/numpy/reference/arrays.scalars.html

| np.类型名 |	对应于别的语言的类型 |	字符简称 |
|----------|----------------------|----------|
|**Booleans** |||
|np.bool\_ |	Python bool |	'?' |
| np.bool8 |	8 bit bool	 | |
| **Int** |||
| np.byte |	C char |	'b' |
| np.short |	C short |	'h' |
| np.intc |	C int  #int32 |	'i'   |
| np.int\_ |	Python int |	'l' |
| np.longlong |	C long long |	'q' |
| np.intp |	用作指针  |	'p' |
| np.int8 | 8 bits  | |
| np.int16 | 16 bits | |
| np.int32 | 32 bits | |
| np.int64 | 64 bits | |
| **Unsigned Int**|||
| np.ubyte |	C unsigned char |	'B'|
| np.ushort |	C unsigned short |	'H'|
| np.uintc |	C unsigned int  |	'I'|
| np.uint |	Python unsigned int  |	'L'|
| np.ulonglong |	C unsigned long long  |	'Q'|
| np.uintp |	用作指针 |	'P'|
| np.uint8 | 8 bits | |
| np.uint16 | 16 bits | |
| np.uint32 | 32 bits | |
| np.uint64 |	64 bits	 ||
| **浮点数类型** |||
|np.half||	 	'e'|
|np.single|	compatible: C float |	'f'|
|np.double|	compatible: C double |	 |
|np.float\_|	compatible: Python float |	'd'|
|np.longfloat|	compatible: C long float |	'g'|
|np.float16|	16 bits |	 |
|np.float32|	32 bits	||
|np.float64|	64 bits |	 |
|np.float96|	96 bits, platform? |	 |
|np.float128|	128 bits, platform? ||
| **复数浮点数：** |||
|np.csingle |	 |	'F'|
|np.complex\_ |	compatible: Python complex|	'D'|
|np.clongfloat |	 |	'G'|
|np.complex64 |	two 32-bit floats	 ||
|np.complex128 |	two 64-bit floats	| |
|np.complex192 |	two 96-bit floats, platform?	 ||
|np.complex256 |	two 128-bit floats, platform?	 ||

### 6、array的重载运算符方法
**比较运算符：**
* `<`
* `<=` 
* `>` 
* `>=` 
* `==` 
* `!=`

```py
x = np.array([[ 0,  1,  2],
           [ 3,  4,  5],
           [ 6,  7,  8],
           [ 9, 10, 11]])
					 
x < 1
x < x
x <= x
```
参数为 标量或者 形状相同的矩阵，返回一个形状相同的bool数组，表示**按元素比较的结果**

**一元运算符：**
* `-x` 元素取反
* `+x` 不变
* `abs(x)`  元素取非
* `~x` 元素按位取非

**算数运算符（二元运算符）：**
* `a+b`
* `a-b`
* `a*b`
* `a/b`
* `a//b`
* `a%b`
* `divmod(x, y)` 同时返回除数和余数
* `pow(x, y[, z])	`或者 `x**y`
* `x<<y`
* `x>>y`
* `x&y`
* `x|y`
* `x^y`

第二操作数为标量或者和第一操作数相同的尺寸的数组，**按元素运算**

**赋值运算符**
* `x+=y`
* `x-=y`
* `x*=y`
* `x/=y`
* `x//=y`
* `x%=y`
* `x**=y`
* `x<<=y`
* `x>>=y`
* `x&=y`
* `x|=y`
* `x^=y`
第二操作数为标量或者和第一操作数相同的尺寸的数组，**按元素运算**

**矩阵乘法**（python3.5 和NumPy1.10.0）
* `x@y` x乘以y
* `x@=y` x乘以y赋值给x



### 7、array的成员方法
#### （1）数组转换
* `ndarray.item(*args)`	将数组的元素复制到标准的Python标量并返回
* **`ndarray.tolist()`**	将数组作为（可能嵌套的）python列表返回
* **`ndarray.itemset(*args)`**	将标量插入数组（如果可能，标量被转换为数组的dtype），至少两个参数，最后一个参数为插入值，前几个参数为索引
* `ndarray.tostring([order])`	构造包含数组中原始数据字节的Python字节
* `ndarray.tobytes([order])`	构造包含数组中原始数据字节的Python字节
* `ndarray.tofile(fid[, sep, format])`	将数组写入文件作为文本或二进制（默认）
* `ndarray.dump(file)`	将数组的pickle转储到指定的文件
* `ndarray.dumps()`	以字符串形式返回数组的pickle
* `ndarray.astype(dtype[, order, casting, ...])`	数组的复制，转换为指定的类型
* `ndarray.byteswap(inplace)`	交换数组元素的字节
* `ndarray.copy([order])`	返回数组的副本
* `ndarray.view([dtype, type])` 具有相同数据的数组的新视图
* `ndarray.getfield(dtype[, offset])` 返回给定数组的字段作为某种类型
* `ndarray.setflags([write, align, uic])`	分别设置数组标志WRITEABLE，ALIGNED和UPDATEIFCOPY
* `ndarray.fill(value)` 使用标量值填充数组

```py
x = np.array([[1,2,3],
              [4,5,6],
              [7,8,9]])
x.item(2)
x.item(1,1)
x.tolist()
x.itemset(1,2,3)
x.itemset((0,0),3)
x.tostring()
x.tobytes()
x.dumps()
x.astype(np.float) #返回一个拷贝
x.fill(1)
```

#### （2）形状操纵
* **`ndarray.reshape(shape[, order])`**	返回包含新形状的相同数据的数组，传入一个列表
* `ndarray.resize(new_shape[, refcheck])`	改变数组本身的形状和尺寸
* `ndarray.transpose(*axes)`	返回一个转置的结果，不填表示各个维度逆序，否则填写n个整数
* `ndarray.swapaxes(axis1, axis2)`	返回一个视图，交换轴axis1和轴axis1
* `ndarray.flatten([order])`	返回一个拷贝，将数组展平为1维
* `ndarray.ravel([order])`	返回一个平坦的数组
* `ndarray.squeeze([axis])`	返回一个原数组去除一个维度（这个维度的尺寸必须为1必须为）

```py
x = np.array(range(10))
x.reshape([2,5])
x.reshape(5,2)
x.reshape((5,2))
x.resize(2,5)
x.transpose()
x.transpose(1,0)
x2 = np.array([[[1,2],[3,4]],[[5,6],[7,8]]])
x2.transpose()
x2.transpose(2,1,0)
x.swapaxes(1,0)
x.flatten()
x2.flatten()
x2.ravel()
x3 = np.array([[1],[2],[3]])
x3.squeeze(1)
```

#### （3）元素的选择和操作
* `ndarray.take(indices[, axis, out, mode])`	**取**，返回一个数组的切片，根据索引和轴 
* `ndarray.put(indices, values[, mode])` **放**，将索引位置的值设置为values的值
* `ndarray.repeat(repeats[, axis])` 按索引和轴重复元素
* ndarray.choose(choices[, out, mode])	Use an index array to construct a new array from a set of choices.
* ndarray.sort([axis, kind, order])	Sort an array, in-place.
* ndarray.argsort([axis, kind, order])	Returns the indices that would sort this array.
* ndarray.partition(kth[, axis, kind, order])	Rearranges the elements in the array in such a way that value of the element in kth position is in the position it would be in a sorted array.
* ndarray.argpartition(kth[, axis, kind, order])	Returns the indices that would partition this array.
* ndarray.searchsorted(v[, side, sorter])	Find indices where elements of v should be inserted in a to maintain order.
* ndarray.nonzero()	返回非零元素的索引
* ndarray.compress(condition[, axis, out])	Return selected slices of this array along given axis.
* ndarray.diagonal([offset, axis1, axis2])	Return specified diagonals.

```py
# 元素选取和操作
x = np.array([[[1,2],[3,4]],[[5,6],[7,8]]])
x.take([1,0])
x.take([1,0],0)
x.put(0,0)
x.put([0,1],0)
x.put([0,1],[0,1])
x.put([(0,0),(0,1)],[1,2])
x = np.array([[1,2],[3,4]])
x.repeat(2) #先展开成一维，再重复位2
x.repeat(3, axis=1) #第1个轴内元素重复3次
x.repeat([1, 2], axis=0) #第0个轴的元素分别重复1,2次
```

#### （4）元素沿轴计算
这里的许多方法都具有`axis`参数
* 如果axis不填（为None），数组将视为1维的进行运算
* 如果axis是一个整数，将沿着这个轴的每一个子元素展开为1维进行计算

例子：
```py
x = np.array([[[1,2],[3,4]],[[5,6],[7,8]]]) #可以想成空间坐标系中的点
x.sum() #返回一个标量36
x.sum(0) #按照0轴相加返回一个2*2的数组 array([[ 6,  8],  [10, 12]])
x.sum(1) #按照1轴相加返回一个2*2的数组 array([[ 4,  6],  [12, 14]])
x.sum(2) #按照2轴相加返回一个2*2的数组 array([[ 3,  7],  [11, 15]])
```


* `ndarray.argmax([axis, out])` 返回沿给定轴的最大值的索引
* ndarray.min([axis, out, keepdims])	返回沿给定轴的最小值
* ndarray.argmin([axis, out])	返回沿给定轴的最小值的索引
* ndarray.ptp([axis, out])	返回沿给定轴的极差（最大值-最小值）
* ndarray.clip([min, max, out])	返回一个数组，元素的值在`[min, max]`之间，形状和原数组相同，小于min、大于max取min、max
* ndarray.conj()	复合共轭所有元素？？
* ndarray.round([decimals, out])	将每个元素四舍五入到给定的小数位数返回
* ndarray.trace([offset, axis1, axis2, dtype, out])	按照数组的对角线返回总和
* ndarray.sum([axis, dtype, out, keepdims])	返回沿给定轴的元素的和
* ndarray.cumsum([axis, dtype, out])	返回沿给定轴的元素的**累加和**
* ndarray.mean([axis, dtype, out, keepdims])	返回沿给定轴的元素的平均值
* ndarray.var([axis, dtype, out, ddof, keepdims])	沿给定轴返回数组元素的方差
* ndarray.std([axis, dtype, out, ddof, keepdims])	返回沿给定轴的数组元素的标准差
* ndarray.prod([axis, dtype, out, keepdims])	返回给定轴上的数组元素的乘积
* ndarray.cumprod([axis, dtype, out])	沿着给定的轴返回元素的**累乘积**
* ndarray.all([axis, out, keepdims])	如果所有元素求值为True，则返回True
* ndarray.any([axis, out, keepdims])	如果评估的任何元素为True，则返回True

```py
x = np.array([[[1,2],[3,4]],[[5,6],[7,8]]]) #可以想成空间坐标系中的点
x.sum()
x.sum(0)
x.sum(1)
x.sum(2)
x.argmax()
x.min()
x.argmin()
x.ptp()
x.clip(1,5)
x.clip(1,6)
x.cumsum()
x.cumsum(0)
x.mean()
x.var()
x.std()
x.prod()
x.cumprod()
x.all()
x.any()
```

### 8、array的广播规则
> https://zhuanlan.zhihu.com/p/24309547

对于array，默认执行对位运算。涉及到多个array的对位运算需要array的维度一致，如果一个array的维度和另一个array的子维度一致，则在没有对齐的维度上分别执行对位运，这种机制叫做广播（broadcasting），言语解释比较难，还是看例子理解：
```py
import numpy as np

a = np.array([
    [1, 2, 3],
    [4, 5, 6]
])

b = np.array([
    [1, 2, 3],
    [1, 2, 3]
])

'''
维度一样的array，对位计算
array([[2, 4, 6],
       [5, 7, 9]])
'''
a + b

'''
array([[0, 0, 0],
       [3, 3, 3]])
'''
a - b

'''
array([[ 1,  4,  9],
       [ 4, 10, 18]])
'''
a * b

'''
array([[1, 1, 1],
       [4, 2, 2]])
'''
a / b

'''
array([[ 1,  4,  9],
       [16, 25, 36]])
'''
a ** 2

'''
array([[  1,   4,  27],
       [  4,  25, 216]])
'''
a ** b

c = np.array([
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9],
    [10, 11, 12]
])
d = np.array([2, 2, 2])

'''
广播机制让计算的表达式保持简洁
d和c的每一行分别进行运算
array([[ 3,  4,  5],
       [ 6,  7,  8],
       [ 9, 10, 11],
       [12, 13, 14]])
'''
c + d

'''
array([[ 2,  4,  6],
       [ 8, 10, 12],
       [14, 16, 18],
       [20, 22, 24]])
'''
c * d

'''
1和c的每个元素分别进行运算
array([[ 0,  1,  2],
       [ 3,  4,  5],
       [ 6,  7,  8],
       [ 9, 10, 11]])
'''
c - 1
```


### 9、随机模块
```py
import numpy as np
import numpy.random as random

# 设置随机数种子
random.seed(42)

# 产生一个1x3，[0,1)之间的浮点型随机数
# array([[ 0.37454012,  0.95071431,  0.73199394]])
# 后面的例子就不在注释中给出具体结果了
random.rand(1, 3)

# 产生一个[0,1)之间的浮点型随机数
random.random()

# 下边4个没有区别，都是按照指定大小产生[0,1)之间的浮点型随机数array，不Pythonic…
random.random((3, 3))
random.sample((3, 3))
random.random_sample((3, 3))
random.ranf((3, 3))

# 产生10个[1,6)之间的浮点型随机数
5*random.random(10) + 1
random.uniform(1, 6, 10)

# 产生10个[1,6)之间的整型随机数
random.randint(1, 6, 10)

# 产生2x5的标准正态分布样本
random.normal(size=(5, 2))

# 产生5个，n=5，p=0.5的二项分布样本
random.binomial(n=5, p=0.5, size=5)

a = np.arange(10)

# 从a中有回放的随机采样7个
random.choice(a, 7)

# 从a中无回放的随机采样7个
random.choice(a, 7, replace=False)

# 对a进行乱序并返回一个新的array
b = random.permutation(a)

# 对a进行in-place乱序
random.shuffle(a)

# 生成一个长度为9的随机bytes序列并作为str返回
# '\x96\x9d\xd1?\xe6\x18\xbb\x9a\xec'
random.bytes(9)
```

## 二、array操作
***********************************
### 1、数组操作例程
没有前缀的表示`np.函数`，有前缀的`ndarray`表示array成员方法，不带括号的表示array成员的属性
#### （1）基本操作
* `copyto(dst, src[, casting, where])`	将值从一个阵列复制到另一个阵列，并根据需要进行广播

#### （2）改变数组形状
* `reshape(a, newshape[, order])`	给数组赋予一个新的形状，而不改变它的数据
* `ravel(a[, order])`	返回一个连续的平坦阵列
* `ndarray.flat`	数组上的1-D迭代器
* `ndarray.flatten([order])`	将数组的副本返回到一个维度

```py
x = np.array([[[1,2],[3,4]],[[5,6],[7,8]]])
np.reshape(x,[2,4])
x.flat
x.flatten()
```


#### （3）转置式操作

* `moveaxis(a, source, destination)` 移轴操作改变轴的位置
* `rollaxis(a, axis[, start])`	向后滚动指定的轴，直到它位于给定的位置
* `swapaxes(a, axis1, axis2)`	交换数组的两个轴
* `ndarray.T`	与self.transpose（）相同，除了`self.ndim <2`之后返回self。
* `transpose(a[, axes])`	转置（轴逆序）

```py
np.moveaxis(x,0,1)
np.rollaxis(x,0,1)
np.swapaxes(x,0,1)
x.T
np.transpose(x)
```

#### （4）更改维度数目
* `atleast_1d(*arys)`	将输入转换为至少有一个维度的数组
* `atleast_2d(*arys)`	将输入视为具有至少两个维度的数组
* `atleast_3d(*arys)`	将输入视为具有至少三维的数组
* `broadcast`	产生模仿广播的对象
* `broadcast_to(array, shape[, subok])`	广播一个数组到一个新的形状
* `broadcast_arrays(*args, **kwargs)`	将任意数量的阵列相互广播
* `expand_dims(a, axis)`	在数组的添加一个维度
* `squeeze(a[, axis])`	从数组的形状中删除单维条目

```py
np.atleast_1d(1)
np.atleast_2d([1,2,3])
np.atleast_3d([[1,2],[3,4]])
np.broadcast
np.expand_dims(x, 2)
```

#### （5）改变阵列的种类
* `asarray(a[, dtype, order])`	将输入转换为数组
* `asanyarray(a[, dtype, order])`	将输入转换为ndarray，但通过ndarray子类
* `asmatrix(data[, dtype])`	将输入解释为矩阵
* `asfarray(a[, dtype])`	返回一个转换为浮点型的数组
* `asfortranarray(a[, dtype])`	在内存中返回以Fortran顺序排列的数组
* `ascontiguousarray(a[, dtype])`	返回内存中的连续数组（C顺序）
* `asarray_chkfinite(a[, dtype, order])`	将输入转换为数组，检查NaN或Infs
* `asscalar(a)`	将大小为1的数组转换为其标量等价物
* `require(a[, dtype, requirements])`	返回满足要求的提供类型的数组

#### （6）在array中添加新的数组

* `concatenate((a1, a2, ...)[, axis])` 沿现有轴加入一系列数组
* `stack(arrays[, axis])`	沿着新轴加入一系列数组
* `column_stack(tup)` 将1-D数组作为列堆叠成2-D数组
* `dstack(tup)`	按顺序深度（沿第三轴）堆栈数组
* `hstack(tup)`	堆栈排列顺序（行）
* `vstack(tup)`	Stack arrays in sequence vertically (row wise).
* `block(arrays)`	Assemble an nd-array from nested lists of blocks.

```py
x = np.array([[ 0,  1,  2],
           [ 3,  4,  5],
           [ 6,  7,  8],
           [ 9, 10, 11]])
np.column_stack(([1,1,1,1],x)) #在x前添加一列
np.row_stack(([1,1,1],x)) #在x前添加一行
```


#### （7）拆分数组
* `split(ary, indices_or_sections[, axis])`	将数组拆分成多个子数组
* `array_split(ary, indices_or_sections[, axis])` 将数组拆分成多个子数组
* `dsplit(ary, indices_or_sections)`	沿着第3轴（深度）将阵列分割成多个子阵列
* `hsplit(ary, indices_or_sections)`	将阵列水平分割成多个子阵列（列）
* `vsplit(ary, indices_or_sections)`	将阵列垂直分割成多个子阵列（逐行）

#### （8）平铺数组

* `tile(A, reps)`	通过重复A构造一个数组，由reps给出的次数
* `repeat(a, repeats[, axis])`	重复数组元素

#### （9）添加和删除元素

* `delete(arr, obj[, axis])`	沿删除的轴返回一个带有子数组的新数组。
* `insert(arr, obj, values[, axis])`	在给定的索引之前沿着给定的轴插入值
* `append(arr, values[, axis])`	将值附加到数组的末尾
* `resize(a, new_shape)`	返回一个具有指定形状的新数组
* `trim_zeros(filt[, trim])`	从1-D数组或序列修剪前导和/或尾部零
* `unique(ar[, return_index, return_inverse, ...])`	查找数组的独特元素

#### （10）重新排列元素
* `flip(m, axis)` 沿着给定的轴反转数组中元素的顺序
* `fliplr(m)`	在左/右方向翻转数组。
* `flipud(m)`	在上/下方向翻转数组。
* `reshape(a, newshape[, order])`	给数组赋予一个新的形状，而不改变它的数据
* `roll(a, shift[, axis])`	沿着给定的轴滚动阵列元素
* `rot90(m[, k, axes])`	在轴指定的平面内将阵列旋转90度


### 2、线性代数相关操作
> https://docs.scipy.org/doc/numpy/reference/routines.linalg.html

#### （1）矩阵和向量
* `dot(a, b[, out])`	两个数组的点积， 对于二维数组相当于矩阵乘法，对于一维数组相当于向量的内积
* `vdot(a, b)` 返回两个向量的点积，按位相乘在求和，对于高维的要先展平为1维
* `inner(a, b)`	用于1-D数组的向量的普通内积，在更高维度上是最后轴上的和积。
* `outer(a, b[, out])`	计算两个向量的外积
* `matmul(a, b[, out])`或者`a@b`	矩阵乘积
* `tensordot(a, b[, axes])` ？？？
* `einsum(subscripts, *operands[, out, dtype, ...])`	Evaluates the Einstein summation convention on the operands.
* `linalg.matrix_power(M, n)`	Raise a square matrix to the (integer) power n.
* `kron(a, b)`	Kronecker product of two arrays.
* `U, s, V = np.linalg.svd(e)`对不镇定矩阵，进行SVD分解并重建




```py
np.dot(3, 4)
np.dot([1,2], [3,4])
a = [[1, 0], [0, 1]]
b = [[4, 1], [2, 2]]
np.dot(a, b)
np.vdot(a,b)
np.vdot([1,2],[3,4])
np.inner([1,2],[3,4])
np.inner(a,b) # [[1*4+0*1, 1*2+0*2],[0*4+1*1,0*2+1*2]] = [[4,2][1,2]]
np.outer([1,2],[3,4])
'''
a = [a0, a1, ..., aM] and b = [b0, b1, ..., bN]
则np.outer(a,b)输出
[[a0*b0  a0*b1 ... a0*bN ]
 [a1*b0    .
 [ ...          .
 [aM*b0            aM*bN ]]
'''
np.matmul(a,b)
```

#### （2）其他
https://docs.scipy.org/doc/numpy/reference/routines.linalg.html

