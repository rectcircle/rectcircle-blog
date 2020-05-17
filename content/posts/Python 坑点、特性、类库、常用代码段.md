---
title: Python 坑点、特性、类库、常用代码段
date: 2018-11-08T17:37:55+08:00
draft: false
toc: false
comments: true
aliases:
  - /detail/176
  - /detail/176/
tags:
  - python
---

### 0、Python安装、环境、版本相关

#### （1）查看Python包目录

```python
help('django')
```

或者

```python
import django
import sys
sys.modules['django']
```

#### （2）Python非PIP管理的包加入PythonPath

* ~~方法1：使用`PYTHONPATH`环境变量~~
    * 不推荐：原因是优先级过高，可能覆盖系统包
* **方法2：在site-packages目录价添加一个.pth目录（推荐）**
    * Unix系：`/usr/local/lib/python2.7/site-packages/my.pth`

### 1、使用装饰器增强一个类

增强一个类的方案一般使用继承的方式。但是有时候装饰器修饰一个类给人的感觉侵入性更低。

场景：Django rest framework 返回数据添加一层包装：

```json
{
    "msg": "success",
    "code": 0,
    "data": {

		}
}
```

**注意：**最好的做法是覆写`finalize_response`方法

#### （1）方案1：继承

创建一个子类，继承自顶层类，重写其方法

```python
def _return_wrapper_response_as_view(as_view):
    def wrapper(request, *args, **kwargs):
        response = as_view(request, *args, **kwargs)
        print type(response)
        if isinstance(response, Response) and response.accepted_media_type == u'application/json':
            response.data = OrderedDict(
                code=0, msg='success', data=response.data)
            return response
        return response
    return wrapper

class WrapResponse(APIView):

    @classmethod
    def as_view(cls, *args, **initkwargs):
        # 返回一个函数 该函数 为 request -> HttpResponse
        handle = super(WrapResponse, cls).as_view(*args, **initkwargs)
        return _return_wrapper_response_as_view(handle)

```

使用时，将该类作为第一父类继承

```python
class StudentViewSet(WrapResponse ,viewsets.ModelViewSet):
    queryset = Student.objects.all()
    serializer_class = StudentSerializer
```

这样既可实现自动为放回数据添加包裹

#### （2）使用装饰器

一个直观的写法是：在类上添加一个装饰器，生成一个新的类，新的类是被修饰类的子类

```python
def wrap_response(wrap_class):
    class NewClass(wrap_class):
        @classmethod
        def as_view(cls, *args, **initkwargs):
            # 返回一个函数 该函数 为 request -> HttpResponse
            handle = super(NewClass, cls).as_view(*args, **initkwargs)
            return _return_wrapper_response_as_view(handle)
    return NewClass

# 使用
@wrap_response
class StudentViewSet(viewsets.ModelViewSet):
    queryset = Student.objects.all()
    serializer_class = StudentSerializer

    # 来自mixins.ListModelMixin
    # 将影响GET（get list）方法
    def list(self, request, *args, **kwargs):
        return super(StudentViewSet, self).list(request, *args, **kwargs)
```

看起来很好，但是运行起来，若调用了list方法，将会出现无限递归的问题，[原因参见](http://python.jobbole.com/85939/)，这个问题我找了半天。。。

解决方案：动态修改属性，动态修改bound的方法

```python
def wrap_response(wrap_class):

    old_as_view = wrap_class.as_view

    def as_view(cls, *args, **initkwargs):
        # 返回一个函数 该函数 为 request -> HttpResponse
        handle = old_as_view(*args, **initkwargs)
        return _return_wrapper_response_as_view(handle)

    wrap_class.as_view = types.MethodType(as_view, wrap_class)

    return wrap_class
```

### 2、Python新式类

Python2 根上类为object的类为新式类，根上类不是object为旧式类。

* 新式类使用C3算法搜索成员，旧式类使用深度优先搜索类成员；
* 因此新式类支持super关键字

C3算法：

[参考](https://blog.csdn.net/fmblzf/article/details/52512145)

使用`mro`函数可以查看类搜索路径

```
搜索路径定义为 L，则
L（Child（Base1，Base2）） = [ Child + merge（ L（Base1） ,  L（Base2） ,  Base1Base2 ）]
L（object） = [ object ]
```

人脑计算法：

* 第一步：画出继承图
* 第二步：从孩子开始按照深度优先搜索一条路径，删除并加入搜索链表，直到出现一个是现存继承图的某个类的父类

本质上是[拓扑排序](https://www.jianshu.com/p/c9a0b055947b)

### 3、Python类的原理

* 函数闭包+结构（字典）
* 采用原型的模式
* 有点像js但又和js不同

定义一个class相当一创建一个class类型的结构，该对象的成员分为两类

* 变量（类变量）
* 函数（称之为unbound函数）

当创建一个类的对象时：

* 创建一个结构，将其源信息指向class对象（叫做self）
* 遍历class对象内部每一个
    * 函数（类型为函数），对每个函数将self传进去，创建一个偏函数，并绑定到self内
    * 非函数，直接付给self
* 执行构造函数，返回self
* 完成

```python
def makeBoundFunction(unboundFunction, self):
    def func(*args, **kwargs):
        unboundFunction(self, *args, **kwargs)
    return func
```

以上就是`types.MethodType`的大概的实现

所以可以动态的修改一个成员函数而不会影响其他函数，通过`types.MethodType`创建

### 4、Python时间日期时区处理

#### （1）相关模块和概念

```python
import datetime
import time
import pytz
from django.utils import timezone
```

* `datetime` 的常用子模块
    * `date` 仅表示日期，主要有三个字段年月日
    * `datetime` 表示带时间的日期，主要8个字段（年月日、时分秒毫秒、时区），不带参数的大都是不带时区的，分为两类
        * 不带时区：共使用了7个字段
        * 带时区：使用了8个字段
        * 以上两类不能做比较运算
    * `timedelta` 表示时间差
* `time` 对 Unix时间的封装
* `pytz` 时区相关，配合`datetime`使用，常用的有
    * `pytz.utc`
    * `pytz.timezone('UTC')`
    * `tz = pytz.timezone('Asia/Shanghai')`
* `timezone` django 提供的一些常用的方法

#### （2）转化为Unix时间戳

```python
# 当前时刻
import time
time.time()

# 无时区的datetime
import datetime
dt = datetime.datetime.now() # 不带时区的datetime
time.mktime(dt.timetuple())

# 有时区的datetime
import pytz
utc = pytz.utc # 或者 pytz.timezone('UTC')
dtz = utc.localize(datetime.datetime.utcnow()) # 带时区的datetime
tz = pytz.timezone('Asia/Shanghai') # 本地时区
dt = dtz.astimezone(tz) # 转换为本地日期时间
time.mktime(dt.timetuple()) + dt.microsecond / 1000000.0

```

#### （3）转化为格式化的文本

#### （4）转换为无时区的datetime

```python
# 有时区的datetime
import datetime
import pytz
utc = pytz.utc # 或者 pytz.timezone('UTC')
tz = pytz.timezone('Asia/Shanghai') # 本地时区
dtz = utc.localize(datetime.datetime.now()) # 带时区的datetime
dt = dtz.astimezone(tz).replace(tzinfo=None)
```

#### （5）转化为有时区的datetime

```python
# 无时区的datetime
import datetime
import pytz
utc = pytz.utc
tz =  pytz.timezone('Asia/Shanghai')
dt = datetime.datetime.now() # 本地无时区时间
dtz = tz.localize(dt) # 本地有时区时间 # 不能使用 dtz = dt.replace(tz) 因为tz时间偏移量为8小时6分
dtz = dtz.astimezone(utc) # UTC有时区时间
```

#### （6）计算时间差

```python
# 两个datetime相减
```

#### （7）获取某天的0点和23点59分59秒

```python
# 获取今天的零点
datetime.datetime.combine(datetime.datetime.now(),datetime.time.min)
# 获取今天的24点
datetime.datetime.combine(datetime.datetime.now(),datetime.time.max)
```

#### （8）Django中的时区问题

当时区相关配置如下时：

```python
TIME_ZONE = 'Asia/Shanghai' # 设定本机时区
USE_TZ = True # 使用带时区的DateTime: django.utils.timezone
```

* MySQL数据库存储的数据为UTC时区的时间日期
* 写入数据库时：
    * 如果是无时区的datetime，将该`dt`当做`django.conf.setttings.TIME_ZONE`时区，并转换为UTC时区的datetime，并存储到数据库
    * 如果是有时区的datetime，将该`dtz`转换为UTC时间并存储到数据库
* 读取数据库时：
    * 查询出来会封装成带时区的datetime（时区为UTC）
* 条件查询时（比如`filter(create_time__gt=dt)`）
    * 无时区的datetime，直接将该`dt`当做UTC时区进行查询
    * 无时区的datetime，转换为UTC时区的datetime进行查询

#### 一个时间日期转换器

```python
# -*- coding: utf-8 -*-
"""
日期时间时区相关工具函数
"""
import pytz
import datetime

import time


class TimeConverter(object):
    """时间日期相关对象的相互转换器
    usage:
        import pytz
        import datetime
        import time

        from sptools.time.util import TimeConverter
        dt = datetime.datetime.now()
        converter = TimeConverter()
        converter.origin(dt).to(int)
        converter.origin(dt).to(datetime.datetime)
        converter.origin(dt).to(datetime.datetime, pytz.utc)
        converter.origin(dt).to(str)
    """

    def __init__(self, local_tz=None):
        """
        Args:
            local_tz: pytz.timezone 类型，当前系统的时区信息，不填：将从Django Settings中获取，若非发生异常，在重试从tzlocal中获取，若在发生异常，将设置成上海时区
        """
        if local_tz is None:
            try:
                from django.conf import settings
                local_tz = settings.TIME_ZONE
            except:
                pass
        if local_tz is None:
            try:
                from tzlocal import get_localzone
                local_tz = get_localzone()
            except:
                pass
        if local_tz is None:
            local_tz = pytz.timezone('Asia/Shanghai')
        self.local_tz = local_tz
        self.origin_value = None
        self.origin_arg = None
        self.unix_timestamp = None

    def origin(self, value, arg=None):
        """需要转换的原始时间，支持如下格式：
        Args:
            value 支持类型str, time.struct_time, float, int, long, datetime.datetime
            arg 在value为str时，arg表示格式化字符串
        """
        # 时间戳，秒级
        if isinstance(value, (float, int, long)):
            unix_timestamp = value
        # 时间结构体
        if isinstance(value, time.struct_time):
            unix_timestamp = time.mktime(value)
        # datetime
        if isinstance(value, datetime.datetime):
            # 有时区的datetime
            if value.tzinfo:
                # 转换为本地时区后，去除时区信息
                value = value.astimezone(self.local_tz).replace(tzinfo=None)
            unix_timestamp = time.mktime(value.timetuple()) + value.microsecond / 1000000.0
        # 时间格式化后的字符串
        if isinstance(value, (str, unicode)):
            if arg and not isinstance(arg, str):
                raise TypeError(u'原时间为字符串时，若arg必须给出，此时arg表示value的格式化字符串')
            if arg is None:
                unix_timestamp = time.strptime(value)
            else:
                unix_timestamp = time.strptime(value, arg)
            unix_timestamp = time.mktime(unix_timestamp)
        self.origin_value = value
        self.origin_arg = arg
        self.unix_timestamp = unix_timestamp
        return self

    def to(self, target_type, arg=None):
        # 转换为时间戳格式
        if target_type in (int, float, long):
            return target_type(self.unix_timestamp)
        # 转换为struct_time
        if target_type == time.struct_time:
            return datetime.datetime.fromtimestamp(self.unix_timestamp).timetuple()
        # datetime
        if target_type == datetime.datetime:
            dt = datetime.datetime.fromtimestamp(self.unix_timestamp)
            if arg:
                if hasattr(arg, 'localize'):
                    dt = self.local_tz.localize(dt).astimezone(arg)
                else:
                    raise TypeError(u'target_type为datetime时，arg不为空时，必须为时区类型')
            return dt
        # string
        if target_type in (str, unicode):
            if not arg:
                arg = '%Y-%m-%d %H:%M:%S'
            return datetime.datetime.fromtimestamp(self.unix_timestamp).strftime(arg)
        raise TypeError("target_type: 不支持的类型")

```

### 5、Python标准包项目结构

[参见](http://blog.konghy.cn/2018/04/29/setup-dot-py/)

```
.(package_name)
├── package_name # 包，一般只有一个
│      ├── sub_package_name
│      ├── ...
│      └── xxx.py
├── manage.py # Django Web程序存在
├── setup.cfg # python setup.py 命令的默认参数
├── setup.py  # pip 安装脚本（如果是lib库最好存在）
├── README.md
└── requirements.txt
```

* 当前目录名和包名最好一致
* 最好一个项目只有一个包
* 根目录下不要有`__init__.py`否则pylint会出错

`setup.py`文件例子

```python
# coding:utf-8

from setuptools import setup
# or
# from distutils.core import setup

setup(
        name='demo',     # 包名字
        version='1.0',   # 包版本
        description='This is a test of the setup',   # 简单描述
        author='huoty',  # 作者
        author_email='sudohuoty@163.com',  # 作者邮箱
        url='https://www.konghy.com',      # 包的主页
        packages=['demo'],                 # 包
)
```

### 6、Python2 文件名与模块名冲突

比如 `redis.py` 文件中需要引入 `import redis` 模块，在 Python2 中将导入 `redis.py`

解决方案为：

```python
from __future__ import absolute_import
```
