---
title: python3 笔记
date: 2017-07-10T09:08:05+08:00
draft: false
toc: false
comments: true
aliases:
  - /detail/83
  - /detail/83/
tags:
  - 机器学习
  - python
---

> http://www.runoob.com/python3

## 目录
* [一、基本语法](#一、基本语法)
	* [1、编码](#1、编码)
	* [2、标识符](#2、标识符)
	* [3、保留字](#3、保留字)
	* [4、注释](#4、注释)
	* [5、行与缩进](#5、行与缩进)
	* [6、多行语句](#6、多行语句)
	* [7、数据类型](#7、数据类型)
	* [8、字符串](#8、字符串)
	* [9、空行](#9、空行)
	* [10、等待用户输入](#10、等待用户输入)
	* [11、同一行执行多条语句](#11、同一行执行多条语句)
	* [12、多个语句构成代码组](#12、多个语句构成代码组)
	* [13、Print 输出](#13、Print 输出)
	* [14、import 与 from...import](#14、import 与 from...import)
	* [15、命令行参数](#15、命令行参数)
	* [16、函数帮助](#16、函数帮助)
	* [17、测试脚本](#17、测试脚本)
* [二、Python3 基本数据类型](#二、Python3 基本数据类型)
	* [1、标准数据类型](#1、标准数据类型)
	* [2、Number（数字）](#2、Number（数字）)
	* [3、String（字符串）](#3、String（字符串）)
	* [4、List（列表）](#4、List（列表）)
	* [5、Tuple（元组）](#5、Tuple（元组）)
	* [6、Sets（集合）](#6、Sets（集合）)
	* [7、Dictionary（字典）](#7、Dictionary（字典）)
	* [8、数据类型的转换](#8、数据类型的转换)
	* [9、遍历操作](#9、遍历操作)
* [三、运算符](#三、运算符)
	* [1、算数运算符](#1、算数运算符)
	* [2、比较运算符](#2、比较运算符)
	* [3、赋值运算符](#3、赋值运算符)
	* [4、位运算符](#4、位运算符)
	* [5、逻辑运算符](#5、逻辑运算符)
	* [6、成员运算符](#6、成员运算符)
	* [7、身份运算符](#7、身份运算符)
* [四、流程控制](#四、流程控制)
	* [1、条件控制](#1、条件控制)
	* [2、循环控制](#2、循环控制)
	* [3、迭代器和生成器](#3、迭代器和生成器)
* [五、函数](#五、函数)
	* [1、函数定义](#1、函数定义)
	* [2、函数调用和参数传递](#2、函数调用和参数传递)
	* [3、匿名函数](#3、匿名函数)
	* [4、变量作用域](#4、变量作用域)
* [六、实现数据结构](#六、实现数据结构)
* [七、模块](#七、模块)
* [八、面向对象](#八、面向对象)





## 一、基本语法
****************************
### 1、编码
源代码编码为UTF-8

指定不同编码
```py
# -*- coding: cp-1252 -*-
```

### 2、标识符
类似于java
* 第一个字符必须是字母表中字母或下划线'\_'。
* 标识符的其他的部分有字母、数字和下划线组成。
* 标识符对大小写敏感。

在Python 3中，非-ASCII 标识符也是允许的了。

### 3、保留字
保留字即关键字，我们不能把它们用作任何标识符名称。Python 的标准库提供了一个 keyword 模块，可以输出当前版本的所有关键字：
```py
>>> import keyword
>>> keyword.kwlist
['False', 'None', 'True', 'and', 'as', 'assert', 'break', 'class', 'continue', 'def', 'del', 'elif', 'else', 'except', 'finally', 'for', 'from', 'global', 'if', 'import', 'in', 'is', 'lambda', 'nonlocal', 'not', 'or', 'pass', 'raise', 'return', 'try', 'while', 'with', 'yield']
```

### 4、注释
单行注释
```py
#这是单行注释
```
多行注释
```py
'''这是多行注释
这是多行注释
'''
```

### 5、行与缩进
python最具特色的就是使用缩进来表示代码块，不需要使用大括号({})。
缩进的空格数是可变的，但是同一个代码块的语句必须包含相同的缩进空格数。实例如下：
```py
if True:
	print ("True")
else:
	print ("False")
```
	
以下代码最后一行语句缩进数的空格数不一致，会导致运行错误：
```py
if True:
    print ("Answer")
    print ("True")
else:
    print ("Answer")
  print ("False")    # 缩进不一致，会导致运行错误
```
以上程序由于缩进不一致，执行后会出现类似以下错误：

```py
 File "test.py", line 6
    print ("False")    # 缩进不一致，会导致运行错误
                                      ^
IndentationError: unindent does not match any outer indentation level
```

### 6、多行语句
Python 通常是一行写完一条语句，但如果语句很长，我们可以使用反斜杠(\)来实现多行语句，例如：
```py
total = item_one + \
        item_two + \
        item_three
```
在 [], {}, 或 () 中的多行语句，不需要使用反斜杠(\)，例如：
```
total = ['item_one', 'item_two', 'item_three',
        'item_four', 'item_five']
```

### 7、数据类型
python中数有四种类型：整数、长整数、浮点数和复数。
整数， 如 1
长整数 是比较大的整数
浮点数 如 1.23、3E-2
复数 如 1 + 2j、 1.1 + 2.2j


### 8、字符串
* python中单引号和双引号使用完全相同。
* 使用三引号('''或""")可以指定一个多行字符串。
* 转义符 '\'
* 自然字符串， 通过在字符串前加r或R。 如 r"this is a line with \n" 则\n会显示，并不是换行。
* python允许处理unicode字符串，加前缀u或U， 如 u"this is an unicode string"。
* 字符串是不可变的。
* 按字面意义级联字符串，如"this " "is " "string"会被自动转换为this is string。

JavaScript 字符串和 scala 字符串的集合体
```py
word = '字符串' '\n'
sentence = "这是一个句子。" '\n'
paragraph = """这是一个段落，
可以由多行组成""" '\n'

print(word + sentence + paragraph)
```

### 9、空行
函数之间或类的方法之间用空行分隔，表示一段新的代码的开始。类和函数入口之间也用一行空行分隔，以突出函数入口的开始。
空行与代码缩进不同，空行并不是Python语法的一部分。书写时不插入空行，Python解释器运行也不会出错。但是空行的作用在于分隔两段不同功能或含义的代码，便于日后代码的维护或重构。
记住：空行也是程序代码的一部分。

### 10、等待用户输入
执行下面的程序在按回车键后就会等待用户输入：
```py
s =  input("\n\n按下 结束输入 继续。")
print(s)
```
以上代码中 ，"\n\n"在结果输出前会输出两个新的空行。一旦用户按下键时，程序将退出。


### 11、同一行执行多条语句
Python可以在同一行中使用多条语句，语句之间使用分号(;)分割，以下是一个简单的实例：
```py
import sys; x = 'runoob'; sys.stdout.write(x + '\n')
```


### 12、多个语句构成代码组
缩进相同的一组语句构成一个代码块，我们称之代码组。
像if、while、def和class这样的复合语句，首行以关键字开始，以冒号( : )结束，该行之后的一行或多行代码构成代码组。
我们将首行及后面的代码组称为一个子句(clause)。
如下实例：
```
if expression : 
   suite
elif expression : 
   suite 
else : 
   suite
```

### 13、Print 输出
print 默认输出是换行的，如果要实现不换行需要在变量末尾加上 end=""：
```py
x="a"
y="b"
# 换行输出
print( x )
print( y )

print('---------')
# 不换行输出
print( x, end=" " )
print( y, end=" " )
print()

# 格式化输出，类似于c的printf
print ("我叫 %s 今年 %d 岁!" % ('小明', 10))
```

### 14、import 与 from...import
在 python 用 `import` 或者 `from...import` 来导入相应的模块。
将整个模块(somemodule)导入，格式为： `import somemodule`
从某个模块中导入某个函数,格式为： `from somemodule import somefunction`
从某个模块中导入多个函数,格式为： `from somemodule import firstfunc, secondfunc, thirdfunc`
将某个模块中的全部函数导入，格式为： `from somemodule import *`

#### 例子1
**导入 sys 模块**
```py
import sys
print('================Python import mode==========================');
print ('命令行参数为:')
for i in sys.argv:
    print (i)
print ('\n python 路径为',sys.path)
```
#### 例子2
**导入 sys 模块的 argv,path 成员**
```py
from sys import argv,path  #  导入特定的成员
 
print('================python from import===================================')
print('path:',path) # 因为已经导入path成员，所以此处引用时不需要加sys.path
```

### 15、命令行参数
很多程序可以执行一些操作来查看一些基本信，Python可以使用-h参数查看各参数帮助信息：
```
$ python -h
usage: python [option] ... [-c cmd | -m mod | file | -] [arg] ...
Options and arguments (and corresponding environment variables):
-c cmd : program passed in as string (terminates option list)
-d     : debug output from parser (also PYTHONDEBUG=x)
-E     : ignore environment variables (such as PYTHONPATH)
-h     : print this help message and exit

[ etc. ]
```


### 16、函数帮助
调用 python 的 help() 函数可以打印输出一个函数的文档字符串：
```
# 如下实例，查看 max 内置函数的参数列表和规范的文档
>>> help(max)
……显示帮助信息……
```
按下 : q 两个按键即退出说明文档
如果仅仅想得到文档字符串：
```
>>> print(max.__doc__)    # 注意，doc的前后分别是两个下划线
max(iterable, *[, default=obj, key=func]) -> value
max(arg1, arg2, *args, *[, key=func]) -> value

With a single iterable argument, return its biggest item. The
default keyword-only argument specifies an object to return if
the provided iterable is empty.
With two or more arguments, return the largest argument.
```


### 17、测试脚本
```py

#验证标识符
a=1
_b1 = 2
变量 = 3

print (a)
print (_b1)
print (变量)

# 验证保留字
import keyword
print (keyword.kwlist)

#这是单行注释
'''这是多行注释
这是多行注释
'''

#行与缩进
if True:
    print ("True")
else:
    print ("False")

if True:
    print ("Answer")
    print ("True")
else:
    print ("Answer")
  #print ("False")    # 缩进不一致，会导致运行错误


#多行语句
total = "1" + \
        "2" + \
        "3"
#在 [], {}, 或 () 中的多行语句，不需要使用反斜杠(\)，例如：
total = ['item_one', 'item_two', 'item_three',
        'item_four', 'item_five']

#数据类型
a = 1 #整数
b = 10000000000000 #长整数
c = 1.23 #浮点数
d = 1 + 2j #复数

print(a)
print(b)
print(c)
print(d)

word = '字符串' '\n'
sentence = "这是一个句子。" '\n'
paragraph = """这是一个段落，
可以由多行组成""" '\n'

print(word + sentence + paragraph)

s =  input("\n\n按下 结束输入 继续。")
print(s)


import sys; x = 'runoob'; sys.stdout.write(x + '\n')


'''
缩进相同的一组语句构成一个代码块，我们称之代码组。
像if、while、def和class这样的复合语句，首行以关键字开始，以冒号( : )结束，该行之后的一行或多行代码构成代码组。
我们将首行及后面的代码组称为一个子句(clause)。
'''


#Print 输出
x="a"
y="b"
# 换行输出
print( x )
print( y )

print('---------')
# 不换行输出
print( x, end="" )
print( y, end="" )
print()


#import 与 from...import
import sys
print('================Python import mode==========================');
print ('命令行参数为:')
for i in sys.argv:
    print (i)
print ('\n python 路径为',sys.path)


from sys import argv,path  #  导入特定的成员
 
print('================python from import===================================')
print('path:',path) # 因为已经导入path成员，所以此处引用时不需要加sys.path

```


## 二、Python3 基本数据类型
****************************************************
Python 中的变量Python 中的变量**不需要声明**。每个变量在**使用前都必须赋值**，变量赋值以后该变量才会被创建。
在 Python 中，变量就是变量，它**没有类型**，我们所说的"类型"是变量所指的内存中对象的类型。
等号（=）用来给变量赋值。
等号（=）运算符左边是一个变量名,等号（=）运算符右边是存储在变量中的值。例如：

```py
counter = 100          # 整型变量
miles   = 1000.0       # 浮点型变量
name    = "runoob"     # 字符串
 
print (counter)
print (miles)
print (name)
```

**多个变量赋值**
```py
a = b = c = 1
print(a,b,c)
a, b, c = 1, 2, "runoob"
print(a,b,c)
```

### 1、标准数据类型
* Number（数字）
* String（字符串）
* List（列表）
* Tuple（元组）
* Sets（集合）
* Dictionary（字典）


### 2、Number（数字）
**Python3 支持 int、float、bool、complex（复数）。**

在Python 3里，只有一种整数类型 int，表示为长整型，没有 python2 中的 Long。

内置的 `type()` 函数可以用来查询变量所指的对象类型。
```py
a, b, c, d = 20, 5.5, True, 4+3j
print(type(a), type(b), type(c), type(d))
```

此外还可以用 isinstance 来判断：

```py
a = 111
print(isinstance(a, int))
```

isinstance 和 type 的区别在于：
```py
class A:
    pass

class B(A):
    pass

isinstance(A(), A)  # returns True
type(A()) == A      # returns True
isinstance(B(), A)    # returns True
type(B()) == A        # returns False
```
* `type()`不会认为子类是一种父类类型。
* `isinstance()`会认为子类是一种父类类型。

*注意：在 Python2 中是没有布尔型的，它用数字 0 表示 False，用 1 表示 True。到 Python3 中，把 True 和 False 定义成关键字了，但它们的值还是 1 和 0，它们可以和数字相加。*


当你指定一个值时，Number 对象就会被创建：
```py
var1 = 1
var2 = 10
```
您也可以使用del语句删除一些对象引用。
del语句的语法是：
```py
del var1[,var2[,var3[....,varN]]]]
```
您可以通过使用del语句删除单个或多个对象。例如：
```py
#创建Number对象
var1 = 1
var2 = 10
print(var1,var2)
#删除一些对象引用
del var1,var2
print(var1,var2) #报错：NameError: name 'var1' is not defined
```

#### （1）数值运算
```py
>>>5 + 4  # 加法
9
>>> 4.3 - 2 # 减法
2.3
>>> 3 * 7  # 乘法
21
>>> 2 / 4  # 除法，得到一个浮点数
0.5
>>> 2 // 4 # 除法，得到一个整数
0
>>> 17 % 3 # 取余 
2
>>> 2 ** 5 # 乘方
```

* Python可以同时为多个变量赋值，如a, b = 1, 2。
* 一个变量可以通过赋值指向不同类型的对象。
* 数值的除法（/）总是返回一个浮点数，要获取整数使用//操作符。
* 在混合计算时，Python会把整型转换成为浮点数。

#### （2）数值类型实例

|int |	float |	complex |
|----|--------|---------|
| 10 |	0.0 |	3.14j |
| 100 |	15.20 |	45.j |
| -786 |	-21.9 |	9.322e-36j |
| 080 |	32.3+e18 |	.876j |
| -0490 |	-90. |	-.6545+0J |
| -0x260 |	-32.54e100 |	3e+26J |
| 0x69 |	70.2-E12 |	4.53e-7j |

### 3、String（字符串）
Python中的字符串用单引号(')或双引号(")括起来，同时使用反斜杠(\)转义特殊字符。
字符串的截取的语法格式如下：
```py
变量[头下标:尾下标]
```
索引值以 0 为开始值，-1 为从末尾的开始位置。
加号 (+) 是字符串的连接符， 星号 (\*) 表示复制当前字符串，紧跟的数字为复制的次数。实例如下：

```py
str = 'abcdef'
print (str)          # 输出字符串
print (str[0:-1])    # 输出第一个到倒数第二个的所有字符
print (str[0])       # 输出字符串第一个字符
print (str[2:5])     # 输出从第三个开始到第五个的字符
print (str[2:])      # 输出从第三个开始的后的所有字符
print (str * 2)      # 输出字符串两次
print (str + "TEST") # 连接字符串
```

Python 使用反斜杠(\)转义特殊字符，如果你不想让反斜杠发生转义，可以在字符串前面添加一个 r，表示原始字符串：
```py
print('Ru\noob')
print(r'Ru\noob')
```

注意，Python 没有单独的字符类型，一个字符就是长度为1的字符串。
```py
word = 'Python'
print(word[0], word[5])
print(word[-1], word[-6])
```

与 C 字符串不同的是，Python 字符串不能被改变。向一个索引位置赋值，比如word[0] = 'm'会导致错误。

* 反斜杠可以用来转义，使用r可以让反斜杠不发生转义。
* 字符串可以用+运算符连接在一起，用\*运算符重复。
* Python中的字符串有两种索引方式，从左往右以0开始，从右往左以-1开始。
* Python中的字符串不能改变。

### 4、List（列表）
List（列表） 是 Python 中使用最频繁的数据类型。
列表可以完成大多数集合类的数据结构实现。列表中元素的类型可以不相同，它支持数字，字符串甚至可以包含列表（所谓嵌套）。
列表是写在方括号([])之间、用逗号分隔开的元素列表。
和字符串一样，列表同样可以被索引和截取，列表被截取后返回一个包含所需元素的新列表。
列表截取的语法格式如下：
```py
变量[头下标:尾下标]
```
索引值以 0 为开始值，-1 为从末尾的开始位置。
加号（+）是列表连接运算符，星号（\*）是重复操作。如下实例：
```py
list = [ 'abcd', 786 , 2.23, 'runoob', 70.2 ]
tinylist = [123, 'runoob']
 
print (list)            # 输出完整列表
print (list[0])         # 输出列表第一个元素
print (list[1:3])       # 从第二个开始输出到第三个元素
print (list[2:])        # 输出从第三个元素开始的所有元素
print (tinylist * 2)    # 输出两次列表
print (list + tinylist) # 连接列表
```

与Python字符串不一样的是，列表中的元素是可以改变的：
```py
a = [1, 2, 3, 4, 5, 6]
a[0] = 9
a[2:5] = [13, 14, 15]
a[2:5] = []   # 删除
print(a)
```
* List写在方括号之间，元素用逗号隔开。
* 和字符串一样，list可以被索引和切片。
* List可以使用+操作符进行拼接。
* List中的元素是可以改变的。


### 5、Tuple（元组）
元组（tuple）与列表类似，不同之处在于元组的元素不能修改。元组写在小括号(())里，元素之间用逗号隔开。
元组中的元素类型也可以不相同：
```py
tuple = ( 'abcd', 786 , 2.23, 'runoob', 70.2  )
tinytuple = (123, 'runoob')
 
print (tuple)             # 输出完整元组
print (tuple[0])          # 输出元组的第一个元素
print (tuple[1:3])        # 输出从第二个元素开始到第三个元素
print (tuple[2:])         # 输出从第三个元素开始的所有元素
print (tinytuple * 2)     # 输出两次元组
print (tuple + tinytuple) # 连接元组
```

元组与字符串类似，可以被索引且下标索引从0开始，-1 为从末尾开始的位置。也可以进行截取（看上面，这里不再赘述）。
其实，可以把字符串看作一种特殊的元组。
```py
tup = (1, 2, 3, 4, 5, 6)
print(tup[0])
print(tup[1:5])

tup[0] = 11  # 修改元组元素的操作是非法的，TypeError: 'tuple' object does not support item assignment
```

虽然tuple的元素不可改变，但它可以包含可变的对象，比如list列表。
构造包含 0 个或 1 个元素的元组比较特殊，所以有一些额外的语法规则：
```py
tup1 = ()    # 空元组
tup2 = (20,) # 一个元素，需要在元素后添加逗号
```

string、list和tuple都属于sequence（序列）。
* 与字符串一样，元组的元素不能修改。
* 元组也可以被索引和切片，方法一样。
* 注意构造包含0或1个元素的元组的特殊语法规则。
* 元组也可以使用+操作符进行拼接。


### 6、Sets（集合）
集合（set）是一个无序不重复元素的序列。
基本功能是进行成员关系测试和删除重复元素。
可以使用大括号 `{ }` 或者 `set()` 函数创建集合，注意：创建一个空集合必须用 `set()` 而不是 `{ }`，因为 `{ }` 是用来创建一个空字典。
```py
student = {'Tom', 'Jim', 'Mary', 'Tom', 'Jack', 'Rose'}
print(student)   # 输出集合，重复的元素被自动去掉
 
# 成员测试
if('Rose' in student) :
    print('Rose 在集合中')
else :
    print('Rose 不在集合中')
 
 
# set可以进行集合运算
a = set('abracadabra')
b = set('alacazam')
 
print(a)
print(b)
print(a - b)     # a和b的差集
print(a | b)     # a和b的并集
print(a & b)     # a和b的交集
print(a ^ b)     # a和b中不同时存在的元素
```

### 7、Dictionary（字典）
字典（dictionary）是Python中另一个非常有用的内置数据类型。
列表是有序的对象结合，字典是无序的对象集合。两者之间的区别在于：字典当中的元素是通过键来存取的，而不是通过偏移存取。

字典是一种映射类型，字典用"{ }"标识，它是一个无序的键(key) : 值(value)对集合。
键(key)必须使用不可变类型。
在同一个字典中，键(key)必须是唯一的。
```py
dict = {}
dict['one'] = "1 - 菜鸟教程"
dict[2]     = "2 - 菜鸟工具"
tinydict = {'name': 'runoob','code':1, 'site': 'www.runoob.com'}
 
print (dict['one'])       # 输出键为 'one' 的值
print (dict[2])           # 输出键为 2 的值
print (tinydict)          # 输出完整的字典
print (tinydict.keys())   # 输出所有键
print (tinydict.values()) # 输出所有值
```

构造、初始化字典的方法
```py
dict([('Runoob', 1), ('Google', 2), ('Taobao', 3)])
{x: x**2 for x in (2, 4, 6)}
dict(Runoob=1, Google=2, Taobao=3)
```

另外，字典类型也有一些内置的函数，例如clear()、keys()、values()等。
注意：
* 字典是一种映射类型，它的元素是键值对。
* 字典的关键字必须为不可变类型，且不能重复。
* 创建空字典使用 { }。

### 8、数据类型的转换

| 函数 |	描述 |
|-----|-------|
|int(x [,base])|将x转换为一个整数|
|float(x)|将x转换到一个浮点数|
|complex(real [,imag])|创建一个复数|
|str(x)|将对象 x 转换为字符串|
|repr(x)|将对象 x 转换为表达式字符串|
|eval(str)|用来计算在字符串中的有效Python表达式,并返回一个对象|
|tuple(s)|将序列 s 转换为一个元组|
|list(s)|将序列 s 转换为一个列表|
|set(s)|转换为可变集合|
|dict(d)|创建一个字典。d 必须是一个序列 (key,value)元组。|
|frozenset(s)|转换为不可变集合|
|chr(x)|将一个整数转换为一个字符|
|unichr(x)|将一个整数转换为Unicode字符|
|ord(x)|将一个字符转换为它的整数值|
|hex(x)|将一个整数转换为一个十六进制字符串|
|oct(x)|将一个整数转换为一个八进制字符串|


### 9、遍历操作



## 三、运算符
*******************************
### 1、算数运算符
* `+ - * %`和java、c一样
* `//`相当于整除
* `/`返回浮点数
* `**`次方运算

### 2、比较运算符
和java、c一致

### 3、赋值运算符
类似于java、c包含
`=`、`+=`、`-=`、`/=`、`%=`、`**=`、`//=`


### 4、位运算符
和java、c一致包含：
* 按位与`&`
* 按位或`|`
* 按位亦或`^`
* 按位取反`~`
* 左移`<<`
* 右移`>>`


### 5、逻辑运算符
不同于java、c
* `and`逻辑与
* `or`逻辑或
* `not`非


### 6、成员运算符
除了以上的一些运算符之外，Python还支持成员运算符，测试实例中包含了一系列的成员，包括字符串，列表或元组。

| 运算符 |	描述 | 实例 |
|-------|------|------|
| in	  | 如果在指定的序列中找到值返回 True，否则返回 False。|	x 在 y 序列中 , 如果 x 在 y 序列中返回 True。 |
	| not in |	如果在指定的序列中没有找到值返回 True，否则返回 False。 |	x 不在 y 序列中 , 如果 x 不在 y 序列中返回 True。|

```py
if('a' in 'abc'):
    print("True") #返回true

if('abc' in ['abc','fwer']):
    print("True") #返回true
```

### 7、身份运算符

| 运算符 | 描述 | 实例 |
|-------|------|------|
| is	| is 是判断两个标识符是不是引用自一个对象 |	x is y, 类似 id(x) == id(y) , 如果引用的是同一个对象则返回 True，否则返回 False |
| is not | is not 是判断两个标识符是不是引用自不同对象 | x is not y ， 类似 id(a) != id(b)。如果引用的不是同一个对象则返回结果 True，否则返回 False。|

**注：** `id()` 函数用于获取对象内存地址。

* `is`相当于java的`==`
* `==`相当于java的`equals()`函数



## 四、流程控制
### 1、条件控制
```py
if 条件1:
    语句块1
elif 条件2:
    语句块2
else:
    语句块3
```

* `elif`类似于java的`else if`
* 没有`switch – case`
* 0或0.0为False其他数字为True
* ""字符串为False其他为True

### 2、循环控制
#### （1）`while`语句
```py
while 条件：
    语句块
```
* 没有`do..while`循环

#### （2）`for`语句
```py
for 变量 in 序列:
    语句块
else:
    语句块
```

#### （3）`range()`函数
```py
range(start, end,step)
```
例子
```py
for i in range(5):
    print(i)
    
for i in range(5,9) :
    print(i)
```

#### （4）`break`和`continue`语句
类似于java中的break、continue

#### （5）`pass`语句
Python `pass`是空语句，是为了保持程序结构的完整性。
`pass` 不做任何事情，一般用做占位语句

例子
```py
while True:
    pass  # 等待键盘中断 (Ctrl+C)

class MyEmptyClass:
    pass


for letter in 'Runoob': 
    if letter == 'o':
        pass
        print ('执行 pass 块')
    print ('当前字母 :', letter)

print ("Good bye!")
```

### 3、迭代器和生成器
#### （1）迭代器
迭代器有两个基本的方法：`iter()` 和`next()`
```py
list=[1,2,3,4]
it = iter(list)    # 创建迭代器对象
for x in it:
    print (x, end=" ")
		
		
import sys         # 引入 sys 模块

list=[1,2,3,4]
it = iter(list)    # 创建迭代器对象

while True:
    try:
        print (next(it))
    except StopIteration:
        sys.exit()
```

#### （2）生成器
使用了 yield 的函数被称为生成器（generator）

跟普通函数不同的是，生成器是一个返回迭代器的函数，只能用于迭代操作，更简单点理解生成器就是一个迭代器。
在调用生成器运行的过程中，每次遇到 yield 时函数会暂停并保存当前所有的运行信息，返回yield的值。并在下一次执行 next()方法时从当前位置继续运行。

以下实例使用 yield 实现斐波那契数列：

```py
def fibonacci(n): # 生成器函数 - 斐波那契
    a, b, counter = 0, 1, 0
    while True:
        if (counter > n): 
            return
        yield a
        a, b = b, a + b
        counter += 1
				
f = fibonacci(10) # f 是一个迭代器，由生成器返回生成

for i in f:
    print(i)
```




## 五、函数
************************************
### 1、函数定义
```py
def 函数名（参数列表）:
    函数体
```

### 2、函数调用和参数传递
```py
def printme( str ):
    "打印任何传入的字符串"
    print (str);
    return

printme("我要调用用户自定义函数!")
```

python为弱类型的，变量时没有类型的，仅仅是一个无类型的引用，可以指向任何类型的对象

#### （1）参数传递
表现和java一致参见[java 参数传递](https://www.rectcircle.cn/detail/84)
**样例**
```py

def changeNum(num):
    num = 2

def changeStr(str):
    str = "b"

def changeObject(list):
    list = [2]

def changeObjectValue(list):
    list[0] = 2


num = 1
changeNum(num)
print (num)

str = "a"
changeStr(str)
print (str)

list = [1]
changeObject(list)
print(list)

changeObjectValue(list)
print(list)
```
输出
```
1
a
[1]
[2]
```

#### （2）参数分类
* 必需参数
* 关键字参数
* 命名关键字参数
* 默认参数
* 不定长参数

```py
#函数参数
def printinfo(name, age = 35, *others, **others2):
    print ("名字: ", name);
    print ("年龄: ", age);
    print (type(others));
    print (type(others2));
    for var in others:
        print(var)

    for var in others2:
        print(var + '=' + others2[var])
    return;


printinfo(age=35, name="xiaoming")
printinfo("xiaoming",35,1,2,3)
printinfo("xiaoming",35,1,2,fasdf='sdf',ods='ds',dfsf='rg')

```


### 3、匿名函数
```py
lambda [arg1 [,arg2,.....argn]]:expression
```
**例子**
```py
# 可写函数说明
sum = lambda arg1, arg2: arg1 + arg2;
 
# 调用sum函数
print ("相加后的值为 : ", sum( 10, 20 ))
print ("相加后的值为 : ", sum( 20, 20 ))
```


### 4、变量作用域
Python的作用域一共有4中，分别是：
* L （Local） 局部作用域`
* E （Enclosing） 闭包函数外的函数中`
* G （Global） 全局作用域`
* B （Built-in） 内建作用域`

以 L –> E –> G –>B 的规则查找，即：在局部找不到，便会去局部外的局部找（例如闭包），再找不到就会去全局找，再者去内建中找。
```py
x = int(2.9)  # 内建作用域
 
g_count = 0  # 全局作用域
def outer():
    o_count = 1  # 闭包函数外的函数中
    def inner():
        i_count = 2  # 局部作用域
```
Python 中只有模块（module），类（class）以及函数（def、lambda）才会引入新的作用域，其它的代码块（如 if/elif/else/、try/except、for/while等）是不会引入新的作用域的，也就是说这这些语句内定义的变量，外部也可以访问（类似于JavaScript）

**global 和 nonlocal关键字**
`global`
```py
num = 1
def fun1():
    global num  # 需要使用 global 关键字声明，否则下面修改num的值
    print(num) #此句将报错
    num = 123
    print(num)
fun1()
```

如果要修改嵌套作用域（enclosing 作用域，外层非全局作用域）中的变量则需要 nonlocal 关键字了，如下实例：
```py
def outer():
    num = 10
    def inner():
        nonlocal num   # nonlocal关键字声明
        num = 100
        print(num)
    inner()
    print(num)
outer()
```


## 六、实现数据结构
****************************************
### list相关方法
|方法 | 描述 |
|----|------|
| list.append(x) |	把一个元素添加到列表的结尾，相当于 a[len(a):] = [x]。|
| list.extend(L) |	通过添加指定列表的所有元素来扩充列表，相当于 a[len(a):] = L。|
| list.insert(i, x) |	在指定位置插入一个元素。第一个参数是准备插入到其前面的那个元素的索引，例如 a.insert(0, x) 会插入到整个列表之前，而 a.insert(len(a), x) 相当于 a.append(x) 。|
| list.remove(x) |	删除列表中值为 x 的第一个元素。如果没有这样的元素，就会返回一个错误。|
| list.pop([i]) |	从列表的指定位置删除元素，并将其返回。如果没有指定索引，a.pop()返回最后一个元素。元素随即从列表中被删除。（方法中 i 两边的方括号表示这个参数是可选的，而不是要求你输入一对方括号，你会经常在 Python 库参考手册中遇到这样的标记。）|
| list.clear() |	移除列表中的所有项，等于del a[:]。|
| list.index(x) |	返回列表中第一个值为 x 的元素的索引。如果没有匹配的元素就会返回一个错误。|
| list.count(x) |	返回 x 在列表中出现的次数。|
| list.sort() |	对列表中的元素进行排序。|
| list.reverse() |	倒排列表中的元素。|
| list.copy() |	返回列表的浅复制，等于a[:]。|

### list作为堆栈的相关方法
```
>>> stack = [3, 4, 5]
>>> stack.append(6)
>>> stack.append(7)
>>> stack
[3, 4, 5, 6, 7]
>>> stack.pop()
7
>>> stack
[3, 4, 5, 6]
>>> stack.pop()
6
>>> stack.pop()
5
>>> stack
[3, 4]
```

### list作为队列的相关方法
```
>>> from collections import deque
>>> queue = deque(["Eric", "John", "Michael"])
>>> queue.append("Terry")           # Terry arrives
>>> queue.append("Graham")          # Graham arrives
>>> queue.popleft()                 # The first to arrive now leaves
'Eric'
>>> queue.popleft()                 # The second to arrive now leaves
'John'
>>> queue                           # Remaining queue in order of arrival
deque(['Michael', 'Terry', 'Graham'])
```

### 列表推导式
```py
>>> vec = [2, 4, 6]
>>> [3*x for x in vec]
[6, 12, 18]

>>> [[x, x**2] for x in vec]
[[2, 4], [4, 16], [6, 36]]
```
这里我们对序列里每一个元素逐个调用某方法：
```py
>>> freshfruit = ['  banana', '  loganberry ', 'passion fruit  ']
>>> [weapon.strip() for weapon in freshfruit]
['banana', 'loganberry', 'passion fruit']
```

我们可以用 if 子句作为过滤器：
```py
>>> [3*x for x in vec if x > 3]
[12, 18]
>>> [3*x for x in vec if x < 2]
[]

```
其它技巧
```py
>>> vec1 = [2, 4, 6]
>>> vec2 = [4, 3, -9]
>>> [x*y for x in vec1 for y in vec2]
[8, 6, -18, 16, 12, -36, 24, 18, -54]
>>> [x+y for x in vec1 for y in vec2]
[6, 5, -7, 8, 7, -5, 10, 9, -3]
>>> [vec1[i]*vec2[i] for i in range(len(vec1))]
[8, 12, -54]
```
列表推导式可以使用复杂表达式或嵌套函数：
```py
>>> [str(round(355/113, i)) for i in range(1, 6)]
['3.1', '3.14', '3.142', '3.1416', '3.14159']
```
### 嵌套列表解析
```py
>>> matrix = [
...     [1, 2, 3, 4],
...     [5, 6, 7, 8],
...     [9, 10, 11, 12],
... ]
```

### del 语句
使用 del 语句可以从一个列表中依索引而不是值来删除一个元素。这与使用 pop() 返回一个值不同。可以用 del 语句从列表中删除一个切割，或清空整个列表（我们以前介绍的方法是给该切割赋一个空列表）。例如：
```py
>>> a = [-1, 1, 66.25, 333, 333, 1234.5]
>>> del a[0]
>>> a
[1, 66.25, 333, 333, 1234.5]
>>> del a[2:4]
>>> a
[1, 66.25, 1234.5]
>>> del a[:]
>>> a
[]
```
也可以用 del 删除实体变量：
```
>>> del a
```



## 七、模块
*********************************
### 定义模块:
* 创建`模块名.py`文件
* 完成模块设计编码

### 导入模块：
#### 方式一
```
import module1[, module2[,... moduleN]

module1.函数名(参数列表) #调用函数
```

#### 方式二
```
from modname import name1[, name2[, ... nameN]]
#from modname import * #导入所有函数变量等

name1(参数列表) #调用函数
```


### __name__属性
```py
#!/usr/bin/python3
# Filename: using_name.py

if __name__ == '__main__':
   print('程序自身在运行')
else:
   print('我来自另一模块')
```


### dir() 函数
```py
>>> import fibo, sys
>>> dir(fibo)
['__name__', 'fib', 'fib2']
>>> dir(sys)  
['__displayhook__', '__doc__', '__excepthook__', '__loader__', '__name__',
 '__package__', '__stderr__', '__stdin__', '__stdout__',
 '_clear_type_cache', '_current_frames', '_debugmallocstats', '_getframe',
 '_home', '_mercurial', '_xoptions', 'abiflags', 'api_version', 'argv',
 'base_exec_prefix', 'base_prefix', 'builtin_module_names', 'byteorder',
 'call_tracing', 'callstats', 'copyright', 'displayhook',
 'dont_write_bytecode', 'exc_info', 'excepthook', 'exec_prefix',
 'executable', 'exit', 'flags', 'float_info', 'float_repr_style',
 'getcheckinterval', 'getdefaultencoding', 'getdlopenflags',
 'getfilesystemencoding', 'getobjects', 'getprofile', 'getrecursionlimit',
 'getrefcount', 'getsizeof', 'getswitchinterval', 'gettotalrefcount',
 'gettrace', 'hash_info', 'hexversion', 'implementation', 'int_info',
 'intern', 'maxsize', 'maxunicode', 'meta_path', 'modules', 'path',
 'path_hooks', 'path_importer_cache', 'platform', 'prefix', 'ps1',
 'setcheckinterval', 'setdlopenflags', 'setprofile', 'setrecursionlimit',
 'setswitchinterval', 'settrace', 'stderr', 'stdin', 'stdout',
 'thread_info', 'version', 'version_info', 'warnoptions']
```
 
如果没有给定参数，那么 dir() 函数会罗列出当前定义的所有名称:
```py
 >>> a = [1, 2, 3, 4, 5]
>>> import fibo
>>> fib = fibo.fib
>>> dir() # 得到一个当前模块中定义的属性列表
['__builtins__', '__name__', 'a', 'fib', 'fibo', 'sys']
>>> a = 5 # 建立一个新的变量 'a'
>>> dir()
['__builtins__', '__doc__', '__name__', 'a', 'sys']
>>>
>>> del a # 删除变量名a
>>>
>>> dir()
['__builtins__', '__doc__', '__name__', 'sys']
>>>
```


### 标准模块
Python 本身带着一些标准的模块库，在 Python 库参考文档中将会介绍到（就是后面的"库参考文档"）。
有些模块直接被构建在解析器里，这些虽然不是一些语言内置的功能，但是他却能很高效的使用，甚至是系统级调用也没问题。
这些组件会根据不同的操作系统进行不同形式的配置，比如 winreg 这个模块就只会提供给 Windows 系统。
应该注意到这有一个特别的模块 sys ，它内置在每一个 Python 解析器中。变量 sys.ps1 和 sys.ps2 定义了主提示符和副提示符所对应的字符串:


### 包
```py
这里给出了一种可能的包结构（在分层的文件系统中）:
sound/                          顶层包
      __init__.py               初始化 sound 包
      formats/                  文件格式转换子包
              __init__.py
              wavread.py
              wavwrite.py
              aiffread.py
              aiffwrite.py
              auread.py
              auwrite.py
              ...
      effects/                  声音效果子包
              __init__.py
              echo.py
              surround.py
              reverse.py
              ...
      filters/                  filters 子包
              __init__.py
              equalizer.py
              vocoder.py
              karaoke.py
              ...
```
在导入一个包的时候，Python 会根据 sys.path 中的目录来寻找这个包中包含的子目录。
目录只有包含一个叫做` __init__.py` 的文件才会被认作是一个包，主要是为了避免一些滥俗的名字（比如叫做 string）不小心的影响搜索路径中的有效模块。
最简单的情况，放一个空的 `:file:__init__.py`就可以了。当然这个文件中也可以包含一些初始化代码或者为（将在后面介绍的） __all__变量赋值。
用户可以每次只导入一个包里面的特定模块，比如:
```py
import sound.effects.echo
```
这将会导入子模块:sound.effects.echo。 他必须使用全名去访问:
```py
sound.effects.echo.echofilter(input, output, delay=0.7, atten=4)
```
还有一种导入子模块的方法是:
```py
from sound.effects import echo
```
这同样会导入子模块: echo，并且他不需要那些冗长的前缀，所以他可以这样使用:
```py
echo.echofilter(input, output, delay=0.7, atten=4)
```
还有一种变化就是直接导入一个函数或者变量:
```py
from sound.effects.echo import echofilter
```
同样的，这种方法会导入子模块: echo，并且可以直接使用他的 echofilter() 函数:
```py
echofilter(input, output, delay=0.7, atten=4)
```
注意当使用`from package import item`这种形式的时候，
* 对应的item既可以是包里面的子模块（子包），或者包里面定义的其他名称，比如函数，类或者变量。
* import语法会首先把item当作一个包定义的名称，
	* 如果没找到，再试图按照一个模块去导入。
	* 如果还没找到，恭喜，一个:exc:ImportError 异常被抛出了。
* 反之，如果使用形如import item.subitem.subsubitem这种导入形式，除了最后一项，都必须是包，而最后一项则可以是模块或者是包，但是不可以是类，函数或者变量的名字。

### 从一个包中导入\*
略


## 八、面向对象
*****************************
```py
class Person:
    '''测试构造函数、类变量、成员变量、方法'''
    classVar='Person' #类变量
    __age = 0 #私有类变量

    def __init__(self,name): #构造方法
        self.name = name

    def __privateDoSth(self):
        print("私有方法")

    def sayHello(self):
        self.__privateDoSth()
        print("hello")

    
class Student(Person):
    '''测试继承、方法重写'''
    def sayHello(self):
        #self.__privateDoSth() #父类私有方法子类不能访问
        print("student")



#测试类变量
print(Person.classVar)
Person.classVar = 'PersonChange'
print(Person.classVar)
#私有变量
#print(Person.__age ) #报错

#初始化实例
p = Person('小明')
#调用方法
p.sayHello()
#调用私有方法
#p.__privateDoSth() #报错

s = Student('小华')
s.sayHello()
```
### 类的专有方法：
* `__init__` : 构造函数，在生成对象时调用
* `__del__` : 析构函数，释放对象时使用
* `__repr__` : 打印，转换
* `__setitem__` : 按照索引赋值
* `__getitem__`: 按照索引获取值
* `__len__`: 获得长度
* `__cmp__`: 比较运算
* `__call__`: 函数调用
* `__add__`: 加运算
* `__sub__`: 减运算
* `__mul__`: 乘运算
* `__div__`: 除运算
* `__mod__`: 求余运算
* `__pow__`: 乘方

### 运算符重载
```py
class Vector:
   def __init__(self, a, b):
      self.a = a
      self.b = b
 
   def __str__(self):
      return 'Vector (%d, %d)' % (self.a, self.b)
   
   def __add__(self,other):
      return Vector(self.a + other.a, self.b + other.b)
 
v1 = Vector(2,10)
v2 = Vector(5,-2)
print (v1 + v2)
```



