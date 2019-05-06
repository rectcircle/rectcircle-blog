---
title: Python高级编程阅读笔记（四）
date: 2017-10-04T18:46:13+08:00
draft: false
toc: false
comments: true
aliases:
  - /detail/101
  - /detail/101/
tags:
  - python
---

## 目录
* [十、Python2与Python3](#十、Python2与Python3)
    * [1、跨版本兼容性策略](#1、跨版本兼容性策略)
    * [2、Python3中的变更](#2、Python3中的变更)    
    * [3、标准库重定位](#3、标准库重定位)
* [十一、测试的连续性](#十一、测试的连续性)
    * [1、测试的连续性](#1、测试的连续性)
    * [2、测试代码](#2、测试代码)
    * [3、单元测试框架](#3、单元测试框架)
    * [4、模拟](#4、模拟)
    * [5、其他测试工具](#5、其他测试工具)
* [十二、CLI工具](#十二、CLI工具)
    * [1、optparse](#1、optparse)
    * [2、argparse](#2、argparse)
* [十三、asyncio模块](#十三、asyncio模块)
    * [1、事件循环](#1、事件循环)
    * [2、协程](#2、协程)
    * [3、Futrue对象与Task对象](#3、Futrue对象与Task对象)
    * [4、回调](#4、回调)
    * [5、任务聚合](#5、任务聚合)
    * [6、队列](#6、队列)
    * [7、服务器](#7、服务器)
* [十四、代码风格](#十四、代码风格)
    * [1、原则](#1、原则)
    * [2、标准](#2、标准)


## 十、Python2与Python3
******************************
### 1、跨版本兼容性策略
#### （1）`__future__`模块
在Python2中导入该模块后，可以引入Python3的特性

#### （2）`2to3`工具
将Python2的代码转换为Python3的代码的工具
```bash
2to3 xxx.py #仅仅提供建议，不会更改文件
2to3 -w xxx.py #更改文件
```
使用本工具不一定可以处理所有情况

#### （3）`six`兼容性库
根本上来说，`six`为Python2和Python3中变更的元素提供唯一接口


### 2、Python3中的变更
#### （1）字符串和Unicode
参见第8章

#### （2）Print函数
* Python2中，`Print`是个语句，`print 'hello world'`
* Python3中，`Print`是个函数，`print ('hello world')`
* Python2.6以后，通过`from __future__ import print_function`可以引入Python3中Print函数

#### （3）除法
* 在Python2中，`整数/整数`代表整除，返回一个整数
* 在Python3中，`整数/整数`代表精确除法，返回一个浮点数
* 在Python3中，`整数//整数`代表整除，等价于Python2中的`整数/整数`
* Python2中，通过`from __future__ import division`可以引入Python3中`/`的行为

#### （4）绝对与相对导入
* Python2中，搜索包的方式是：当前路径+系统路径
* Python3中，搜索包的方式是：系统路径，目的是防止自定义的模块覆盖掉系统模块
* Python3中，显示的搜索当前路径：`import .模块名`
* Python2中，通过`from __future__ import absolute_import`可以引入Python3中的行为

#### （5）“老式风格”类的移除
* 在Python2中，定义新式的类（支持super等特性的类）需要`class ClassName(BaseClass):`，而`class ClassName:`代表旧式的类
* 在Python3中，去除了旧式类，当继承object时，可以直接使用`class ClassName:`

#### （6）元类语法
参见第五章

#### （7）异常语法
* 在Python3中，去除了类似`raise ValueError, '非法的值'`的怪异语法，仅保留了`raise ValueError('非法的值')`
* 在Python3中，去除了类似`except ValueError, ex`的怪异语法，仅保留了`except ValueError as ex`
* 在Python3中，添加了异常链，在处理异常时抛出异常，原始的异常将保留下来


```python
try:
    raise ValueError('新的异常') from IOError('原始异常')
except ValueError as ex:
    print(ex)
    print(ex.__cause__)
```

    新的异常
    原始异常


#### （8）字典方法
* 在Python2中，字典的`keys`、`valuse`、`items`返回的是一个完整的列表，`iterkeys`、`itervaluse`、`iteritems`返回的是一个迭代器，`viewkeys`、`viewvaluse`、`viewitems`返回的是一个视图
* 在Python3中，仅保留了视图，并且命令为`keys`、`valuse`、`items`

#### （9）函数方法
* Python2.5中，函数方法的属性名为`func_closure`、`func_code`、`func_defaults`、`func_globals`
* Python2.6及以后，函数方法的属性名为`__closure__`、`__code__`、`__defaults__`、`__globals__`


#### （10）迭代器
* Python2中，期待的迭代器命名为`next`方法
* Python3中，期待的迭代器命名为`__next__`方法


### 3、标准库重定位
#### （1）合并“高效”的模块
* 在Python2中`pickle`和`StringIO`都提供了更快的c语言版本`cPickle`和`cStringIO`
* 在Python3中，只提供了`pickle`和`StringIO`

#### （2）URL模块
* Python2中，有3个与URL相关的模块：`urllib`、`urllib2`、`urlparse`
* Python3中，以上3个被合并为一个个`urllib`，他有4个子模块`error`、`parse`、`request`、`response`

#### （3）重命名
| Python3 | Python2 | SIX.MOVES |
|---------|---------|-----------|
| configparser | ConfigParser | Configparser |
| filter | itertools.ifilter | filter |
| input | raw_input | input |
| map | itertools.imap | map |
| range | xrange | range |
| functools.reduce | reduce | reduce |
| socketserver | SocketServer | socketserver |
| zip | itertools.izip | zip |

#### （4）其他包重组
* xml
* tkinter




## 十一、测试的连续性
*************************************
### 1、测试的连续性
#### （1）副本生态系统
* 在副本生态系统中，任何程序依靠的外部依赖都必须以同样的方式出现和设置
* 这种测试环境不仅被设计与测试特定代码，还会测试实际生产环境中的完整生态环境
* 在应用程序的不同组件之间来回传递额任何数据都需要以完全相同的方式传输
* 又称为系统测试

#### （2）隔离的环境
* 通常用于测试指定的的代码段
* 在隔离的环境下执行的测试通常阻断测试代码与外部的依赖，主要关注实际代码所做的工作
* 这类测试不显示的测试程序与其他服务的交互性
* 将代码与其他内容隔离的测试被称为单元测试

#### （3）各自的优缺点
* 速度
    * 隔离环境测试（单元测试）速度快
* 交互性
    * 单元测试不具备交互性，所以还需要副本生态系统
    
### 2、测试代码
测试一个函数：计算一个人结婚时的年龄
```python
def calculate_age_at_wedding(person_id):
    """计算一个人结婚时的年龄，传递一个此人在数据库中的ID"""
    # 从数据库中查询一个人
    # 并且anniversary 是 datetime.date 对象.
    person = get_person_from_db(person_id)
    anniversary = person['anniversary']
    birthday = person['birthday']
    # 计算结婚时的年龄
    age = anniversary.year – birthday.year
    # 如果生日晚于周年纪念日，那么从年龄减去一个
    if birthday.replace(year=anniversary.year) > anniversary:
        age -= 1
    # 完成返回年龄
    return age
```

#### （1）代码布局
在很多情况下，若要进行单元测试，需要按照更容易进行测试的方向进行重构。

在本例中，该函数的目的是执行计算年龄的算法，所以可以把第一行查询数据库的操作交给调用层


```python
def calculate_age_at_wedding(person):
    """计算一个人结婚时的年龄，传递一个此人的的数据，类型为dict-like"""
    # 从数据库中查询一个人
    # 并且anniversary 是 datetime.date 对象.
    anniversary = person['anniversary']
    birthday = person['birthday']
    # 计算结婚时的年龄
    age = anniversary.year - birthday.year
    # 如果生日晚于周年纪念日，那么从年龄减去一个
    if birthday.replace(year=anniversary.year) > anniversary:
        age -= 1
    # 完成返回年龄
    return age
```

#### （2）测试函数


```python
from datetime import date

person = {
    'anniversary' : date(2012, 4, 21),
    'birthday' : date(1986, 6, 15)
}

age = calculate_age_at_wedding(person)
age
```




    25



在这里存在两个问题
* 测试仍然要在交互终端中手动执行，而单元测试套件可以自动执行
* 该测试仅有一组测试数据，不能有效测试函数的问题

使用以下测试函数解决此问题


```python
def test_calculate_age_at_wedding():
    """calculate_age_at_wedding的测试函数"""
    # 如果结婚月日在一个生日月日之前
    person = {'anniversary': date(2012, 4, 21),
            'birthday': date(1986, 6, 15)}
    age = calculate_age_at_wedding(person)
    assert age == 25, 'Expected age 25, got %d.' % age
    # 如果结婚月日在一个生日月日之后
    person = {'anniversary': date(1969, 8, 11),
    'birthday': date(1945, 2, 15)}
    age = calculate_age_at_wedding(person)
    assert age == 24, 'Expected age 24, got %d.' % age
    
test_calculate_age_at_wedding()
```

#### （3）assert语句
在python中assert是一个关键字，期望表达式为True，若为False则会引发AssertionError异常


### 3、单元测试框架
第三方包提供的单元测试如
* `py.test`
* `nose`
Python标准库也提供了单元测试的模块`unittest`


```python
import unittest
from datetime import date

class Tests(unittest.TestCase):
    def test_calculate_age_at_wedding(self):
        """calculate_age_at_wedding的测试函数"""
        # 如果结婚月日在一个生日月日之前
        person = {'anniversary': date(2012, 4, 21),
                    'birthday': date(1986, 6, 15)}
        age = calculate_age_at_wedding(person)
        self.assertEqual(age, 25)
        
        # 如果结婚月日在一个生日月日之后
        person = {'anniversary': date(1969, 8, 11),
        'birthday': date(1945, 2, 15)}
        age = calculate_age_at_wedding(person)
        self.assertEqual(age, 24)
```

#### （1）执行单元测试
将函数和测试代码保存到`wedding.py`中，使用命令执行单元测试
```bash
python -m unittest wedding
```
输出如下
```
.
----------------------------------------------------------------------
Ran 1 test in 0.000s
OK
```

**失败的情况**

在文件中的Tests类中添加如下内容
```python
def test_failure_case(self):
    """Assert a wrong age, and fail."""
    person = {'anniversary': date(2012, 4, 21),
    'birthday': date(1986, 6, 15)}
    age = calculate_age_at_wedding(person)
    self.assertEqual(age, 99)
```
输出
```
.F
======================================================================
FAIL: test_failure_case (wedding.Tests)
Assert a wrong age, and fail.
----------------------------------------------------------------------
Traceback (most recent call last):
File "wedding.py", line 50, in test_failure_case
self.assertEqual(age, 99)
AssertionError: 25 != 99
```

单元测试框架的优点
* 当遇到测试不通过的情况，使用`unittest`不会立即停止，他会继续执行直到执行完所有的测试函数


**错误**
在文件中的Tests类中添加如下内容
```python
def test_error_case(self):
    """Attempt to send an empty dict to the function."""
    person = {}
    age = calculate_age_at_wedding(person)
    self.assertEqual(age, 25)
```
输出
```
.EF
======================================================================
ERROR: test_error_case (wedding.Tests)
Attempt to send an empty dict to the function.
----------------------------------------------------------------------
Traceback (most recent call last):
File "wedding.py", line 55, in test_error_case
age = calculate_age_at_wedding(person)
File "wedding.py", line 10, in calculate_age_at_wedding
anniversary = person['anniversary']
KeyError: 'anniversary'
======================================================================
FAIL: test_failure_case (wedding.Tests)
Assert a wrong age, and fail.
----------------------------------------------------------------------
Traceback (most recent call last):
File "wedding.py", line 50, in test_failure_case
self.assertEqual(age, 99)
AssertionError: 25 != 99
----------------------------------------------------------------------
Ran 3 tests in 0.000s
FAILED (failures=1, errors=1)
```
被测试函数中抛出非`AssertionError`异常将触发测试错误

**跳过测试**
```python
@unittest.skipIf(True, 'This test was skipped.')
def test_skipped_case(self):
    """Skip this test."""
    pass
```
输出
```
.s
----------------------------------------------------------------------
Ran 2 tests in 0.000s
OK (skipped=1)
```


#### （2）载入测试
使用`discover`关键字，他会自动查找命名规则为`test*.py`的模块，并执行他，这样就可以将测试代码和逻辑相分离


### 4、模拟
目的，在不重构代码的情况下，方便单元测试，比如说直接测试第一个版本的函数，引入`mock`模块
#### （1）模拟函数调用
`mock`模块就是一个打补丁的库，他临时将给定命名空间的一个变量替换为称为`MagicMock`的特殊对象，然后在模拟范围结束后，将其恢复


```python
##########将要被测试的代码##########
def get_person_from_db(person_id):
    raise RuntimeError('The real `get_person_from_db` function was called.')

def calculate_age_at_wedding(person_id):
    """计算一个人结婚时的年龄，传递一个此人在数据库中的ID"""
    # 从数据库中查询一个人
    # 并且anniversary 是 datetime.date 对象.
    person = get_person_from_db(person_id)
    anniversary = person['anniversary']
    birthday = person['birthday']
    # 计算结婚时的年龄
    age = anniversary.year - birthday.year
    # 如果生日晚于周年纪念日，那么从年龄减去一个
    if birthday.replace(year=anniversary.year) > anniversary:
        age -= 1
    # 完成返回年龄
    return ag

##########测试代码##########
import unittest
import sys
from datetime import date
# Import mock regardless of whether it is from the standard library
# or from the PyPI package.
try:
    from unittest import mock
except ImportError:
    import mock

class Tests(unittest.TestCase):
    def test_calculate_age_at_wedding(self):
        """测试一个函数`calculate_age_at_wedding`该函数需要一个参数person_id
        """
        
        # 在这里测试和逻辑在同一个模块所以要导入使用`__name__`
        # 在一般情况下，测试和代码分离
        # 这个模块发送到'mock.patch.object`
        module = sys.modules[__name__]
        with mock.patch.object(module, 'get_person_from_db') as m:
            # 确保get_person_from_db函数返回一个有效的字典。
            m.return_value = {'anniversary': date(2012, 4, 21),
                                'birthday': date(1986, 6, 15)}
            # 执行函数，并断言测试
            age = calculate_age_at_wedding(person_id=42)
            self.assertEqual(age, 25)
```

#### （2）断言被模拟调用
有时候需要对被替换调用的函数的传递的参数和次数有限制
* `MagicMock.assert_called_once_with`确保函数使用的参数符合规则，并仅调用一次
* `MagicMock.assert_called_with`也类似

```python
class Tests(unittest.TestCase):
    def test_calculate_age_at_wedding(self):
        #...
        with mock.patch.object(module, 'get_person_from_db') as m:
            #...
            # Assert that the 'get_person_from_db' method was called
            # the way we expect.
            m.assert_called_once_with(42)
```
如果以上`m.assert_called_once_with(42)`不正确，执行测试，将出现如下输出

```
F
======================================================================
FAIL: test_calculate_age_at_wedding (wedding.Tests)
Establish that the 'calculate_age_at_wedding' function seems
----------------------------------------------------------------------
Traceback (most recent call last):
File "/Users/luke/Desktop/wiley/wedding.py", line 58, in
test_calculate_age_at_wedding
m.assert_called_once_with(84)
File
"/Library/Frameworks/Python.framework/Versions/3.4/lib/python3.4/unittest
/mock.py", line 771, in assert_called_once_with
return self.assert_called_with(*args, **kwargs)
File
"/Library/Frameworks/Python.framework/Versions/3.4/lib/python3.4/unittest
/mock.py", line 760, in assert_called_with
raise AssertionError(_error_message()) from cause
AssertionError: Expected call: get_person_from_db(84)
Actual call: get_person_from_db(42)
----------------------------------------------------------------------
Ran 1 test in 0.001s
```

#### （3）模拟检查
**调用次数和状态**


```python
# 检查是否被调用过
from unittest import mock
m = mock.MagicMock()
print(m.called)
m(foo='bar')
print(m.called)
```

    False
    True



```python
# 检查调用次数
from unittest import mock
m = mock.MagicMock()
print(m.call_count)
m(foo='bar')
print(m.call_count)
m(spam='eggs')
print(m.call_count)
```

    0
    1
    2


**多次调用**
`MagicMock`中存在一个`call`对象，每当对`MagicMock`对象发起一次调用，将会创建一个`call`对象，该对象记录了调用的签名


```python
from unittest.mock import call
a = call(42)
b = call(42)
c = call('foo')
print(a is b)
print(a == b)
print(a == c)
```

    False
    True
    False



```python
#检查是否调用了这个签名
from unittest.mock import MagicMock, call
m = MagicMock()
m.call('a')
m.call('b')
m.call('c')
m.call('d')
m.assert_has_calls([call.call('b'), call.call('c')])
```

#### （4）检查调用
`call`其实是`tuple`（元组）的子类，包含三个元素的元组，第二和第三个元素是函数参数的签名

所以通过检查`c[1]`和`c[2]`可见测试部分签名


```python
from unittest.mock import call
c = call('foo', 'bar', spam='eggs')
print(c[0])
print(c[1])
print(c[2])
```

    
    ('foo', 'bar')
    {'spam': 'eggs'}



```python
assert c[2]['spam'] == 'eggs'
assert 'baz' in c[1]
```


    ---------------------------------------------------------------------------

    AssertionError                            Traceback (most recent call last)

    <ipython-input-19-a138eabaca5b> in <module>()
          1 assert c[2]['spam'] == 'eggs'
    ----> 2 assert 'baz' in c[1]
    

    AssertionError: 


#### 5、其他测试工具
* coverage
* tox
* 其他测试执行程序
    * nose
    * py.test



## 十二、CLI工具
************************************
### 1、optparse
optparse在python2.7之后被定义为过时。

optparse功能是提供一种清晰一致的方式读取命令行，包括参数以及选项开关

#### （1）一个简单的参数
```python
import optparse

if __name__ == '__main__':
    parser = optparse.OptionParser()
    options, args = parser.parse_args() 

    print(' '.join(args).upper())
```
**`__name__ == '__main__'`**

在python中每个模块都有一个`__name__`属性，该属性总是被设置为当前正在执行的模块的名字

当脚本在命令行直接执行时`__name__`将会被命名为`'__main__'`

**`OptionParser`**
作用是用于接收CLI命令的参数和选项

`parser.parse_args()`
* 第一个返回的是选项的集合，选项一般以`-`或者`--`开头
* 第二个返回的是除了选项的数的列表
* 如果遇到解释器无法识别的错误将会引发sys.exit，用于将无法捕获
* 第一个参数的读取方式为`options.xxx`，`options['xxx']`将返回一个Value对象，`options.__dict__`将返回一个字典

#### （2）选项
**选项类型**
* 一个标记或者开关，如：`--verbose`和`--quiet`（通常提供简写形式`-v`，`-q`）
* 给期望的参数赋值，如：`--host xxx`和`--port xx`

**向`OptionParser`添加选项**
```python
import optparse
if __name__ == '__main__':
    parser = optparse.OptionParser()
    parser.add_option('-q', '--quiet',
        action='store_true',
        dest='quiet',
        help='Suppress output.',
    )
```
说明
* action关键字参数是一个标记
    * 若不设置它，表示该选项后面要接收一个参数
    * 若要设置它，表示该选型是一个开关型的选项，可选的值为
        * `'store_true'`：表示提供该参数时代表的值为True
        * `'store_false'`：表示提供该参数时代表的值为False
* `dest`关键字参数表示该选项在程序中的名称，若不填，OptionParser将推断出一个名称
* `help`关键字参数表示该选项在帮助信息显示的内容，`optparse`将会提供一个默认的`--help`选项

**带有值的选项**
```python
import optparse

if __name__ == '__main__':
    parser = optparse.OptionParser()
    parser.add_option('-H', '--host',
        default='localhost',
        dest='host',
        help='The host to connect to. Defaults to localhost.',
        type=str,
    )
    options, args = parser.parse_args()
```
说明：
* `default`，可选参数，默认值，表示该若用户，不显示的设置该参数时的默认值（但是若填写了该选项但不提供参数将报错）
* `type`，可选参数，多数情况下可以通过默认值选项自动推断


**非字符串值**
```python
parser.add_option('-p', '--port',
    default=5432,
    dest='port',
    help='The port to connect to. Defaults to 5432.',
    type=int,
)
```

**指定选型值的方式**
样例
```python
import optparse

if __name__ == '__main__':
    parser = optparse.OptionParser()
    
    parser.add_option('-H', '--host',
        default='localhost',
        dest='host',
        help='The host to connect to. Defaults to localhost.',
        type=str,
    )
    parser.add_option('-p', '--port',
        default=5432,
        dest='port',
        help='The port to connect to. Defaults to 5432.',
        type=int,
    )
    
    options, args = parser.parse_args()
    
    print('The host is %s, and the port is %d.' %
        (options.host, options.port))

```
*短格式语法*
```bash
python optparse_host_and_port.py -H localhost
python optparse_host_and_port.py -H "localhost"
python optparse_host_and_port.py -Hlocalhost
python optparse_host_and_port.py -H"localhost"
```
注意不能使用`=`号因为等号会作为输入写入
```bahs
python optparse_host_and_port.py -H=localhost
The host is =localhost, and the port is 5432.

python optparse_host_and_port.py -H="localhost"
The host is =localhost, and the port is 5432.
```

*长格式语法*
```bash
python cli_script.py --host localhost
python cli_script.py --host "localhost"
python cli_script.py --host=localhost
python cli_script.py --host="localhost"
```


**位置参数**
任何没有附加到选项参数都会被解析器认为是一个位置参数
```python
import optparse

if __name__ == '__main__':
    parser = optparse.OptionParser()
    options, args = parser.parse_args()
    
    print('The sum of the numbers sent is: %d' %
        sum([int(i) for i in args]))
```
执行
```bash
python optparse_sum.py 1 2 5
The sum of the numbers sent is: 8
```

**计数器**
```python
if __name__ == '__main__':
    parser = optparse.OptionParser()
    parser.add_option('-v',
        action='count',
        default=0,
        dest='verbosity',
        help='Be more verbose. This flag may be repeated.',
    )
    
    options, args = parser.parse_args()
    print('The verbosity level is %d, ah ah ah.' % options.verbosity)
```
执行
```bash
python count_script.py
The verbosity level is 0, ah ah ah.
python count_script.py -v
The verbosity level is 1, ah ah ah.
python count_script.py -v -v
The verbosity level is 2, ah ah ah.
python count_script.py -vvvvvvvvvvv
The verbosity level is 11, ah ah ah.
```

**列表值**
```python
import optparse

if __name__ == '__main__':
    parser = optparse.OptionParser()
    parser.add_option('-u', '--user',
        action='append',
        default=[],
        dest='users',
        help='The username to be printed. Provide this multiple times to '
        'print the username for multiple users.',
    )
    options, args = parser.parse_args()
    
    for user in options.users:
        print('Username: %s.' % user)
```

执行
```bash
python echo_usernames.py -u me
Username: me.
python echo_usernames.py -u me -u myself
Username: me.
Username: myself.
```

#### （3）使用optparse的原因
* 在Python2.6以前和Python3.0到Python3.2的版本，必须使用optparse


### 2、argparse
类似于optparse
#### （1）本质
```python
import argparse

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    args = parser.parse_args()
    print('The script ran successfully and did nothing.')
```
与optparse不同的是，返回一个args对象

#### （2）参数与选项
**选项标记**
```python
parser.add_argument('-q', '--quiet',
    action='store_true',
    dest='quiet',
    help='Suppress output.',
)
```

**替代前缀**
```python
import argparse

if __name__ == '__main__':
    parser = argparse.ArgumentParser(prefix_chars='/')

    parser.add_argument('/q', '//quiet',
        action='store_true',
        dest='quiet',
        help='Suppress output.',
    )
    args = parser.parse_args()
    print('Quiet mode is %r.' % args.quiet)
```
这样就可以使用`/q`和`//quiet`替代`-q`和`--quiet`

**带有值的选项**
```python
import argparse

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
        parser.add_argument('-H', '--host',
        default='localhost',
        dest='host',
        help='The host to connect to. Defaults to localhost.',
        type=str,
    )
    args = parser.parse_args()
    print('The host is %s.' % args.host)
```
以下所有等价
```bash
python argparse_args.py -Hlocalhost
python argparse_args.py -H"localhost"
python argparse_args.py -H=localhost
python argparse_args.py -H="localhost"
python argparse_args.py -H localhost
python argparse_args.py -H "localhost"
python argparse_args.py --host=localhost
python argparse_args.py --host="localhost"
python argparse_args.py --host localhost
python argparse_args.py --host "localhost"
```

**枚举选项**
```python
import argparse

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--cheese',
        choices=('american', 'cheddar', 'provolone', 'swiss'),
        default='swiss',
        dest='cheese',
        help='The kind of cheese to use',
    )
    args = parser.parse_args()
    print('You have chosen %s cheese.' % args.cheese)
```
这样若参数的值超出这几个枚举值，将会报错

**接收多个值**
```python
import argparse

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--madlib',
        default=['fox', 'dogs'],
        dest='madlib',
        help='Two words to place in the madlib.',
        nargs=2,
    )
    args = parser.parse_args()
    print('The quick brown {0} jumped over the '
        'lazy {1}.'.format(*args.madlib))
```
`nargs`表示接收参数的个数，可选为
* 数字，参数数目必须为此个，少或者多将报错
* `'+'`，参数数目为1个或多个
* `'*'`，参数数目为0个或多个

执行
```bash
python argparse_multiargs.py
    The quick brown fox jumped over the lazy dogs.
python argparse_multiargs.py --madlib pirate ninjas
    The quick brown pirate jumped over the lazy ninjas.
```

**位置参数**
使用argparse使用位置参数必须显示声明，否则将报错
```python
import argparse

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('addends',
        help='Integers to provide a sum of',
        nargs='+',
        type=int,
    )
    
    args = parser.parse_args()
    print('%s = %d' % (
        ' + '.join([str(i) for i in args.addends]),
        sum(args.addends),
    ))
```
执行
```bash
python cli_script.py --help
usage: cli_script.py [-h] addends [addends…]
positional arguments:
addends Integers to provide a sum of
optional arguments:
-h, --help show this help message and exit


python cli_script.py 1 2 5
1 + 2 + 5 = 8
```
**读取文件**
```python
import argparse

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('-c', '--config-file',
        default='/etc/cli_script',
        dest='config',
        help='The configuration file to use.',
        type=argparse.FileType('r')
    )
    args = parser.parse_args()
    print(args.config.read())
```
运行
```bash
echo "This is my config file." > foo.txt
python cli_script.py --config-file foo.txt
    This is my config file.
    
python cli_script.py --config-file bar.txt
usage: cli_script.py [-h] [-c CONFIG]
cli_script.py: error: argument -c/--config-file: can't open 'bar.txt':
[Errno 2] No such file or directory: 'bar.txt'
```

#### （3） 使用argparse的原因
* optparse已经停止维护了，官方支持argparse开发
* 位置参数和选项处理更加一致


## 十三、asyncio模块
*************************************************
该模块在Python3.4中引入，在Python2中不可用

### 1、事件循环
大多数异步应用程序的实现是通过后台执行事件循环。当代码需要执行时，这些代码才会注册到事件循环中。

将一个函数注册到事件循环会是他变成一个任务。事件循环负责在获取任务后，马上或者等待一段时间后执行它

#### （1）一个简单的事件循环
通过`asyncio.get_event_loop()`返回一个`BaseEventLoop`对象


```python
import asyncio
loop = asyncio.get_event_loop()
loop.is_running()
```




    False



**执行循环**
```python
loop.run_forever()
```
执行以上代码程序将陷入死循环，按Ctrl+C似乎也不能停止

**注册任务并执行循环**

使用`call_soon`函数，注册顺序是先进先出的FIFO的队列


```python
import functools
def hello_world():
    print('hello world!')
    
def stop_loop(loop):
    print('Stopping loop.')
    loop.stop()
    
loop.call_soon(hello_world)
loop.call_soon(functools.partial(stop_loop, loop))
loop.run_forever()
```

    hello world!
    Stopping loop.


**延迟调用**


```python
loop = asyncio.get_event_loop()
loop.call_later(1, hello_world)
loop.call_later(2, functools.partial(stop_loop, loop))
loop.run_forever()
```

    hello world!
    Stopping loop.


**偏函数**

利用现有函数，通过传递参数，和底层调用，生成新的函数。


```python
# 以下和hello_world函数等价
partial = functools.partial(print, 'hello world!')
partial.func
```




    <function print>



使用偏函数的原因是方便调试

**任务结束前执行循环**


```python
loop = asyncio.get_event_loop()
@asyncio.coroutine
def trivial():
    return '在结束前执行'

loop.run_until_complete(trivial())
```




    '在结束前执行'



`@asyncio.coroutine`将函数转换为一个协程。`run_until_complete`函数会阻塞的运行任务

**执行一个后台循环**

```python
# 引入线程模块
import asyncio
import threading

def run_loop_in_background(loop):
    def thread_func(l):
        asyncio.set_event_loop(l)
        l.run_forever()
    thread = threading.Thread(target=thread_func, args=(loop,))
    thread.start()
    return thread

loop = asyncio.get_event_loop()
t = run_loop_in_background(loop)
loop.is_running()
```

这段代码仅用于实验，因为这样对于停止循环造成难度（`loop.stop()`将失效）。
下面将给事件循环注册函数


```python
loop.call_soon_threadsafe(functools.partial(print,'hello, world!'))
```




    <Handle print('hello, world!')()>



以上方法返回一个Handle对象，该对象仅有一个方法，`cancel`用于取消任务

### 2、协程
在asyncio中大多数函数都是协程。协程使用一种被设计用于事件循环中执行的特殊函数。此外，若创建了协程但并未执行它，那么将会在日志中记录一个错误


```python
import asyncio

@asyncio.coroutine
def coro_sum(*args):
    answer = 0 
    for i in args:
        answer += i 
    return answer

loop = asyncio.get_event_loop()
loop.run_until_complete(coro_sum(1, 2, 3, 4, 5))

```

    hello, world!





    15



这里创建的函数不再是一个普通的函数，而是一个协程，不可以通过常规方式调用。返回的起始是一个生成器，底层实现类似于


```python
print(coro_sum(1, 2, 3, 4, 5))
try:
    next(coro_sum(1, 2, 3, 4, 5))
except StopIteration as ex:
    print(ex.value)
```

    <generator object coro_sum at 0x7f87630d2fc0>
    15


#### （1）嵌套的协程
通过`yield from`语句，模拟顺序编写异步代码，不使用直接的函数调用是为了提高协程的复用性


```python
import asyncio

@asyncio.coroutine 
def nested(*args):
    print('The `nested` function ran with args: %r' % (args,))
    return [i + 1 for i in args]

@asyncio.coroutine
def outer(*args):
    print('The `outer` function ran with args: %r' % (args,))
    answer = yield from nested(*[i * 2 for i in args])
    return answer

loop = asyncio.get_event_loop()
loop.run_until_complete(outer(2, 3, 5, 8))
```

    The `outer` function ran with args: (2, 3, 5, 8)
    The `nested` function ran with args: (4, 6, 10, 16)





    [5, 7, 11, 17]



### 3、Futrue对象与Task对象
由于asyncio完成工作的方式大多是异步的，所以处理函数返回值可能出现问题。yield提供了一种方式。但有时还需要其他方式

#### （1）Future对象
本质上，Future是一个用于通知异步函数状态的对象。包括函数执行状态、函数结果、函数异常等

#### （2）Task对象
Task对象是Future的子类，是最常用的对象，每当一个协程被安排执行时，协程就会被包装秤Task对象。Task对象的主要任务是储存结果并未yield from语句提供值

事件一直会被循环，使用asyncio.ensure_future方法将协程放入事件循环并返回Task对象

下面是一个普通的协程


```python
import asyncio

@asyncio.coroutine
def make_tea(variety):
    print('Now making %s tea.' % variety)
    asyncio.get_event_loop().stop()
    return '%s tea' % variety 
```

其中`asyncio.get_event_loop().stop()`是中止事件循环的方法

接下来是将任务注册到事件循环


```python
task = asyncio.ensure_future(make_tea('chamomile'))
task
```




    <Task pending coro=<make_tea() running at /root/anaconda3/lib/python3.6/asyncio/coroutines.py:208>>




```python
task.done()
```




    False




```python
task.result()
```


    ---------------------------------------------------------------------------

    InvalidStateError                         Traceback (most recent call last)

    <ipython-input-13-753967b63670> in <module>()
    ----> 1 task.result()
    

    InvalidStateError: Result is not ready.


执行事件循环


```python
loop = asyncio.get_event_loop()
loop.run_forever()
```

    Now making chamomile tea.



```python
task.done()
```




    True




```python
task.result()
```




    'chamomile tea'



### 4、回调


```python
import asyncio
loop = asyncio.get_event_loop()

@asyncio.coroutine
def make_tea(variety):
    print('Now making %s tea.' % variety)
    return '%s tea' % variety

def confirm_tea(future):
    print('The %s is made.' % future.result())

task = asyncio.ensure_future(make_tea('green')) #注册事件循环
task.add_done_callback(confirm_tea) #添加回调，将会在事件执行结束后执行

loop.run_until_complete(task)
```

    Now making green tea.
    The green tea is made.





    'green tea'



#### （1）不保证成功
Future仅仅是被执行，但是不能保证执行成功

#### （2）幕后
将多个回调传递到Future，回调不能保证执行顺序

#### （3）带参数的回调
回调函数接收作为位置参数的Future的对象，但是不允许接收其他参数。可以通过偏函数实现其他接收参数


```python
import asyncio
import functools

loop = asyncio.get_event_loop()

@asyncio.coroutine
def make_tea(variety):
    print('Now making %s tea.' % variety)
    return '%s tea' % variety

def add_ingredient(ingredient, future):
    print('Now adding %s to the %s.' % (ingredient, future.result()))


task = asyncio.ensure_future(make_tea('herbal'))
task.add_done_callback(functools.partial(add_ingredient, 'honey'))

loop.run_until_complete(task)
```

    Now making herbal tea.
    Now adding honey to the herbal tea.





    'herbal tea'



### 5、任务聚合
任务聚合的作用：
* 一组任务中的任何任务完成后采取某些行动都是一样的
* 所有的任务都完成后，才能执行某些行动

#### （1）聚集任务
第一种机制是通过`gather`函数。他接收一系列协程或者任务，返回将这些任务聚合后的的那个任务，并提供了为一组任务全部完成后执行一次的回调


```python
import asyncio
loop = asyncio.get_event_loop()

@asyncio.coroutine
def make_tea(variety):
    print('Now making %s tea.' % variety)
    return '%s tea' % variety

meta_task = asyncio.gather(
    make_tea('chamomile'),
    make_tea('green'),
    make_tea('herbal')
)

print(meta_task.done())

loop.run_until_complete(meta_task)
print(meta_task.done())
print(meta_task.result())
```

    False
    Now making chamomile tea.
    Now making herbal tea.
    Now making green tea.
    True
    ['chamomile tea', 'green tea', 'herbal tea']



```python
# 为一组任务全部完成后，执行一次的回调
import asyncio
loop = asyncio.get_event_loop()

@asyncio.coroutine
def make_tea(variety):
    print('Now making %s tea.' % variety)
    return '%s tea' % variety

def mix(future):
    print('Mixing the %s together.' % ' and '.join(future.result()) )

meta_task = asyncio.gather(make_tea('herbal'), make_tea('green'))
meta_task.add_done_callback(mix)

loop.run_until_complete(meta_task)
```

    Now making green tea.
    Now making herbal tea.
    Mixing the herbal tea and green tea together.





    ['herbal tea', 'green tea']



#### （2）等待任务
使用`wait`函数
* 他接收一个协程列
* 他有一个单独的未知参数，可以设置一旦有任务完成，这个聚集任务就返回，无需等待所有任务完成
* 他的返回值为二元元组，第一个部分是已完成的任务，第二个部分为未完成的部分，且是无序的


```python
import asyncio
loop = asyncio.get_event_loop()

@asyncio.coroutine
def make_tea(variety):
    print('Now making %s tea.' % variety)
    return '%s tea' % variety

coro = asyncio.wait([make_tea('chamomile'), make_tea('herbal')])
loop.run_until_complete(coro)
```

    Now making herbal tea.
    Now making chamomile tea.





    ({<Task finished coro=<make_tea() done, defined at /root/anaconda3/lib/python3.6/asyncio/coroutines.py:208> result='chamomile tea'>,
      <Task finished coro=<make_tea() done, defined at /root/anaconda3/lib/python3.6/asyncio/coroutines.py:208> result='herbal tea'>},
     set())



**超时**


```python
import asyncio
loop = asyncio.get_event_loop()

coro = asyncio.wait([asyncio.sleep(5), asyncio.sleep(1)], timeout=3)
loop.run_until_complete(coro)
```




    ({<Task finished coro=<sleep() done, defined at /root/anaconda3/lib/python3.6/asyncio/tasks.py:462> result=None>},
     {<Task pending coro=<sleep() running at /root/anaconda3/lib/python3.6/asyncio/tasks.py:476> wait_for=<Future pending cb=[<TaskWakeupMethWrapper object at 0x7f8763088078>()]>>})



**等待任意任务**


```python
# 当任意一个任务完成后立即停止执行其他任务
import asyncio
loop = asyncio.get_event_loop()

coro = asyncio.wait([
    asyncio.sleep(3),
    asyncio.sleep(2),
    asyncio.sleep(1),
    ], return_when=asyncio.FIRST_COMPLETED)

loop.run_until_complete(coro)
```




    ({<Task finished coro=<sleep() done, defined at /root/anaconda3/lib/python3.6/asyncio/tasks.py:462> result=None>},
     {<Task pending coro=<sleep() running at /root/anaconda3/lib/python3.6/asyncio/tasks.py:476> wait_for=<Future pending cb=[<TaskWakeupMethWrapper object at 0x7f8763088768>()]>>,
      <Task pending coro=<sleep() running at /root/anaconda3/lib/python3.6/asyncio/tasks.py:476> wait_for=<Future pending cb=[<TaskWakeupMethWrapper object at 0x7f87630888b8>()]>>})



**等待异常**


```python
# 当异常发生时立即停止执行，
# 若没有发生异常，将等待所有任务执行完毕返回
import asyncio
loop = asyncio.get_event_loop()

@asyncio.coroutine
def raise_ex_after(seconds):
    yield from asyncio.sleep(seconds)
    raise RuntimeError('Raising an exception.')

coro = asyncio.wait([
    asyncio.sleep(1),
    raise_ex_after(2),
    asyncio.sleep(3),
    ], return_when=asyncio.FIRST_EXCEPTION)

loop.run_until_complete(coro)

```




    ({<Task finished coro=<raise_ex_after() done, defined at <ipython-input-25-fbc575f4c652>:5> exception=RuntimeError('Raising an exception.',)>,
      <Task finished coro=<sleep() done, defined at /root/anaconda3/lib/python3.6/asyncio/tasks.py:462> result=None>},
     {<Task pending coro=<sleep() running at /root/anaconda3/lib/python3.6/asyncio/tasks.py:476> wait_for=<Future pending cb=[<TaskWakeupMethWrapper object at 0x7f8763088678>()]>>})



### 6、队列



```python
import asyncio
queue = asyncio.Queue()
queue.put_nowait('foo')
print(queue.qsize())
print(queue.get_nowait())
print(queue.qsize())
```

    1
    foo
    0


说明
* `put_nowait`和`get_nowait`表示立即添加或者移除项
* 若对空队列执行`get_nowait`将报异常
* 若队列已满`put_nowait`将会包异常
* `get`方法不会报异常，该方法是一个协程，若该方法取不到数据，将会一直阻塞，直到拿到数据
* `put`方法不会报异常，该方法是一个协程，若队列已满，则需要等待有数据弹出才会继续执行


```python
import asyncio
loop = asyncio.get_event_loop()
queue = asyncio.Queue()

queue.put_nowait('foo')
loop.run_until_complete(queue.get())
```




    'foo'




```python
# 没有数据
import asyncio
loop = asyncio.get_event_loop()
queue = asyncio.Queue()

task = asyncio.ensure_future(queue.get())
coro = asyncio.wait([task], timeout=1)

loop.run_until_complete(coro)
```




    (set(),
     {<Task pending coro=<Queue.get() running at /root/anaconda3/lib/python3.6/asyncio/queues.py:167> wait_for=<Future pending cb=[<TaskWakeupMethWrapper object at 0x7f8763088a38>()]>>})




```python
#添加数据后
queue.put_nowait('bar')

import functools
def stop(l, future):
    l.stop()

task.add_done_callback(functools.partial(stop, loop))
loop.run_forever()
print(task.result())
```

    bar


#### （1）最大队列长度


```python
import asyncio
queue = asyncio.Queue(maxsize=5)
```

### 7、服务器
一个简单服务器的例子

```python
import asyncio

class Shutdown(Exception):
    pass

class ServerProtocol(asyncio.Protocol):
    def connection_made(self, transport):
        self.transport = transport
        self.write('Welcome.')
        
    def data_received(self, data):
        # 检查数据对于空数据不执行任何操作
        if not data:
            return

        # 这个服务器的命令应该是一个单一的单词
        # 空格分隔的参数。
        message = data.decode('ascii')
        command = message.strip().split(' ')[0].lower()
        args = message.strip().split(' ')[1:]
        # 验证命令是否存在
        if not hasattr(self, 'command_%s' % command):
            self.write('Invalid command: %s' % command)
            return
        # 返回一个命令属性
        try:
            return getattr(self, 'command_%s' % command)(*args)
        except Exception as ex:
            self.write('Error: %s\n' % str(ex))
        
        
    def write(self, msg_string):
        string += '\n'
        self.transport.write(msg_string.encode('ascii', 'ignore'))
        
    def command_add(self, *args):
        args = [int(i) for i in args]
        self.write('%d' % sum(args))
        
    def command_shutdown(self):
        self.write('Okay. Shutting down.')
        raise KeyboardInterrupt
    
    
if __name__ == '__main__':
    loop = asyncio.get_event_loop()
    coro = loop.create_server(ServerProtocol, '127.0.0.1', 8000)
    asyncio.async(coro)
    try:
        loop.run_forever()
    except KeyboardInterrupt:
        pass
```
执行
```bash
telnet 127.0.0.1 8000
Trying 127.0.0.1…
Connected to localhost.
Escape character is 'ˆ]'.
Welcome.

add 3 5
8

make_tea
Invalid command: make_tea

shutdown
Okay. Shutting down.
Connection closed by foreign host.
```


## 十四、代码风格
**********************
### 1、原则
#### （1）假定你的代码需要维护

#### （2）保持一致
* 内部和外部保持一致
* 在代码层次和代码风格上要保持内部一致性，代码风格要贯穿项目保持一致
* 代码和项目要和其他人保持一致

#### （3）考虑对象在程序中的存在方式，尤其是那些带有数据的对象

#### （4）不要做重复工作

#### （5）让注释讲故事

#### （6）奥卡姆剃须刀原则


### 2、标准
Python社区大部分遵循所谓的[PEP8](https://www.python.org/dev/peps/pep-0008/)指导原则
#### （1）简洁的规则
* 使用4个空格缩进，不要使用制表符`\t`
* 变量使用下划线连接，不要使用驼峰标示（使用`my_var`而不是`myVar`）
* 如果一个变量金子啊内部使用，在变量前添加下划线
* 运算符前后加空格，包括赋值运算，关键字参数设定默认值不需要
* 在列表或者字典前后不要有空格（使用`[1, 2, 3]`而不是`[ 1, 2, 3 ]`）

#### （2）文档字符串
* 如果文档字符串占一行，则需要和代码之间加空行
* 如果有多行，将结束的单独双引号占一行

#### （3）空行
* 类和类之间2个空行
* 方法和函数之间1个空行

#### （4）导入
* 导入模块，每个模块占一行
* 在同一个模块中导入多个名字，可以放在一行
* 注意使用`as`进行重命名

#### （5）变量
* 通常情况下非常短的命名并不合适，除了循环变量
* 避免与Python中的名字重复

#### （6）注释
注释应该放在语句之前，代码变更注释也要更新

#### （7）行长度
* PEP8中规定，行长度不应该超过79，文档不应超过72个字符
* 在对函数调用、列表、字典进行分行时，在行为应该添加逗号


