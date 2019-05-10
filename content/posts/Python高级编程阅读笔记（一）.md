---
title: Python高级编程阅读笔记（一）
date: 2017-09-24T00:45:30+08:00
draft: false
toc: true
comments: true
aliases:
  - /detail/97
  - /detail/97/
tags:
  - python
---

## 一、装饰器

***

### 1、理解装饰器

以下为定义装饰器函数

```python
def decorated_by(func):
    """这就是一个装饰器函数"""
    func.__doc__ += '\n通过decorated_by装饰进行装饰。'
    return func

def add(a, b):
    """返回a+b的值"""
    return a+b

add = decorated_by(add)

help(add)
```

    Help on function add in module __main__:
    add(a, b)
        返回a+b的值
        通过decorated_by装饰进行装饰。

### 2、python中的语法

#### （1）定义

就是普通的python函数或者对象的方法；函数的第一个参数、对象的方法的第二个参数要当做函数类型来处理

#### （2）使用

```python
@decorated_by
def add1(a, b):
    """返回a+b的值"""
    return a+b

help(add1)
```

    Help on function add1 in module __main__:

    add1(a, b)
        返回a+b的值
        通过decorated_by装饰进行装饰。

#### （3）多个装饰器的调用顺序

自低而上

```python
def alse_decorated_by(func):
    """这就也是一个装饰器函数"""
    func.__doc__ += '\n通过alse_decorated_by装饰进行装饰。'
    return func

@alse_decorated_by
@decorated_by
def add2(a, b):
    """返回a+b的值"""
    return a+b

help(add2)
```

    Help on function add2 in module __main__:

    add2(a, b)
        返回a+b的值
        通过decorated_by装饰进行装饰。
        通过alse_decorated_by装饰进行装饰。

### 3、装饰器的用途

* python创建类方法`@classmethod`或`@staticmethod`
* 单元测试，`@mock.patch`
* web框架登录验证Django的`@login_required`
* web框架URI与函数的映射Flask的`@app.route`
* 表示是否为异步Celery的`@task`

### 4、装饰器的一些例子

#### （1）一个函数注册表

```python
registry = []
def register(decorated):
    registry.append(decorated)
    return decorated

@register
def foo():
    return 3

@register
def bar():
    return 5

answers = []
for func in registry:
    answers.append(func())

print(answers)
```

    [3, 5]

实际应用测试

```python
class Registry(object):
    def __init__(self):
        self._functions = []

    def register(self, decorated):
        self._functions.append(decorated)
        return decorated

    def run_all(self, *args, **kwargs):
        return_values = []
        for func in self._functions:
            return_values.append(func(*args, **kwargs))
        return return_values

a = Registry()
b = Registry()

@a.register
def foo(x=3):
    return x

@b.register
def bar(x=5):
    return x

@a.register
@b.register
def baz(x=7):
    return x

a.run_all() # [3, 7]
b.run_all() # [5, 7]

a.run_all(x=4) # [4, 4]
```

    [4, 4]

#### （2）类型检查器

```python
def requires_ints(decorated):
    def inner(*args, **kwargs):
        kwarg_values = [i for i in kwargs.values()]
        for arg in list(args) + kwarg_values:
            if not isinstance(arg, int):
                raise TypeError('%s only accepts integers as arguments.' %
                    decorated.__name__)
        # 执行被装饰的函数
        return decorated(*args, **kwargs)
    return inner

@requires_ints
def foo(x, y):
    """Return the sum of x and y."""
    return x + y

foo(1,2)
help(foo)
```

    Help on function inner in module __main__:

    inner(*args, **kwargs)

此时出现了一个问题，help查不到该函数的文档，使用`@functools.wraps(decorated)`解决

```python
import functools
def requires_ints(decorated):
    @functools.wraps(decorated)
    def inner(*args, **kwargs):
        kwarg_values = [i for i in kwargs.values()]
        for arg in list(args) + kwarg_values:
            if not isinstance(arg, int):
                raise TypeError('%s only accepts integers as arguments.' %
                    decorated.__name__)
        # 执行被装饰的函数
        return decorated(*args, **kwargs)
    return inner

@requires_ints
def foo(x, y):
    """Return the sum of x and y."""
    return x + y

help(foo)
```

    Help on function foo in module __main__:

    foo(x, y)
        Return the sum of x and y.

#### （3）用户验证

检验函数的第一个对象是否是指定类的实例（用于类型检测）

```python
class User(object):
    """A representation of a user in our application."""
    def __init__(self, username, email):
        self.username = username
        self.email = email

class AnonymousUser(User):
    """匿名用户类"""
    def __init__(self):
        self.username = None
        self.email = None
    #def __nonzero__(self): #python2
    def __bool__(self):
        return False

import functools
def requires_user(func):
    @functools.wraps(func)
    def inner(user, *args, **kwargs):
        """Verify that the user is truthy; if so, run the decorated method,
        and if not, raise ValueError.
        """
        # Ensure that user is truthy, and of the correct type.
        # The "truthy"check will fail on anonymous users, since the
        # AnonymousUser subclass has a ‘__nonzero__‘ method that
        # returns False.
        if user and isinstance(user, User):
            return func(user, *args, **kwargs)
        else:
            raise ValueError('A valid user is required to run this.')

    return inner

@requires_user
def login(u):
    pass
```

```python
login(User('name','email'))
```

```python
login(AnonymousUser())
```

    ---------------------------------------------------------------------------

    ValueError                                Traceback (most recent call last)

    <ipython-input-12-83a4ec01f1d0> in <module>()
    ----> 1 login(AnonymousUser())


    <ipython-input-10-05cf3cf34ebe> in inner(user, *args, **kwargs)
         28             return func(user, *args, **kwargs)
         29         else:
    ---> 30             raise ValueError('A valid user is required to run this.')
         31
         32     return inner


    ValueError: A valid user is required to run this.

```python
login(1)
```

    ---------------------------------------------------------------------------

    ValueError                                Traceback (most recent call last)

    <ipython-input-13-f3ac46340d07> in <module>()
    ----> 1 login(1)


    <ipython-input-10-05cf3cf34ebe> in inner(user, *args, **kwargs)
         28             return func(user, *args, **kwargs)
         29         else:
    ---> 30             raise ValueError('A valid user is required to run this.')
         31
         32     return inner


    ValueError: A valid user is required to run this.

#### （4）Json格式化输出

```python
import functools
import json

def json_output(decorated):
    """运行装饰函数，序列化该函数的结果
     到JSON，并返回JSON字符串。
    """
    @functools.wraps(decorated)
    def inner(*args, **kwargs):
        result = decorated(*args, **kwargs)
        return json.dumps(result)
    return inner

@json_output
def do_nothing():
    return {'status': 'done'}

do_nothing()
```

    '{"status": "done"}'

同时捕获特定异常并序列化

```python
import functools
import json

class JSONOutputError(Exception):
    def __init__(self, message):
        self._message = message
    def __str__(self):
        return self._message

def json_output(decorated):
    """Run the decorated function, serialize the result of that function
    to JSON, and return the JSON string.
    """
    @functools.wraps(decorated)
    def inner(*args, **kwargs):
        try:
            result = decorated(*args, **kwargs)
        except JSONOutputError as ex:
            result = {
                'status': 'error',
                'message': str(ex),
            }
        return json.dumps(result)
    return inner

@json_output
def error():
    raise JSONOutputError('This function is erratic.')

error()
```

    '{"status": "error", "message": "This function is erratic."}'

#### （5）日志管理

将函数执行时间记录到日志

```python
import functools
import logging
import time

def logged(method):
    """Cause the decorated method to be run and its results logged, along
    with some other diagnostic information.
    """
    @functools.wraps(method)
    def inner(*args, **kwargs):
        # Record our start time.
        start = time.time()
        # Run the decorated method.
        return_value = method(*args, **kwargs)
        # Record our completion time, and calculate the delta.
        end = time.time()
        delta = end - start
        # Log the method call and the result.
        logger = logging.getLogger('decorator.logged')
        logger.warn('Called method %s at %.02f; execution time %.02f '
                    'seconds; result %r.' %
        (method.__name__, start, delta, return_value))
        # Return the method's original return value.
        return return_value
    return inner

@logged
def sleep_and_return(return_value):
    time.sleep(2)
    return return_value

sleep_and_return(1)
```

    /root/anaconda3/lib/python3.6/site-packages/ipykernel_launcher.py:22: DeprecationWarning: The 'warn' method is deprecated, use 'warning' instead
    Called method sleep_and_return at 1506232994.18; execution time 2.00 seconds; result 1.

    1

### 5、装饰器参数

```python
import functools
import json

class JSONOutputError(Exception):
    def __init__(self, message):
        self._message = message
    def __str__(self):
        return self._message

def json_output(indent=None, sort_keys=False):
    """Run the decorated function, serialize the result of that function
    to JSON, and return the JSON string.
    """
    def actual_decorator(decorated):
        @functools.wraps(decorated)
        def inner(*args, **kwargs):
            try:
                result = decorated(*args, **kwargs)
            except JSONOutputError as ex:
                result = {
                    'status': 'error',
                    'message': str(ex),
                }
            return json.dumps(result, indent=indent, sort_keys=sort_keys)

        return inner

    return actual_decorator
```

```python
@json_output(indent=4)
def do_nothing():
    return {'staus':'done'}

do_nothing()
```

    '{\n    "staus": "done"\n}'

```python
@json_output()
def do_nothing1():
    return {'staus':'done'}

do_nothing1()
```

    '{"staus": "done"}'

```python
@json_output
def do_nothing2():
    return {'staus':'done'}

do_nothing2()
```

    ---------------------------------------------------------------------------

    TypeError                                 Traceback (most recent call last)

    <ipython-input-20-6ca3e34af532> in <module>()
          3     return {'staus':'done'}
          4
    ----> 5 do_nothing2()

    TypeError: actual_decorator() missing 1 required positional argument: 'decorated'

#### （1）带参数（包括空参数）装饰器的执行原理

* 首先执行装饰器函数，并获得返回值`decorator`
* 执行`decorator(函数)`获得返回值target
* 执行`target(参数)`

而不带参数的装饰器仅执行后两步，所以导致`@json_output`报错

**执行流程模拟：**

```python
# 对以下代码模拟
# @json_output(indent=4)
# def do_nothing():
#     return {'staus':'done'}
# do_nothing()

def do_nothing():
    return {'staus':'done'}

decorator = json_output(indent=4)
do_nothing = decorator(do_nothing)
do_nothing()
```

    '{\n    "staus": "done"\n}'

```python
# 对以下代码模拟
#@json_output
#def do_nothing2():
#    return {'staus':'done'}
#do_nothing2()

def do_nothing2():
    return {'staus':'done'}

do_nothing2 = json_output(do_nothing2)
do_nothing2()
```

    ---------------------------------------------------------------------------

    TypeError                                 Traceback (most recent call last)

    <ipython-input-22-c041282b9566> in <module>()
          9
         10 do_nothing2 = json_output(do_nothing2)
    ---> 11 do_nothing2()


    TypeError: actual_decorator() missing 1 required positional argument: 'decorated'

#### （2）修正，使代码可以向前兼容

```python
import functools
import json

class JSONOutputError(Exception):
    def __init__(self, message):
        self._message = message
    def __str__(self):
        return self._message

def json_output(decorated_=None, indent=None, sort_keys=False):
    """Run the decorated function, serialize the result of that function
    to JSON, and return the JSON string.
    """
    # Did we get both a decorated method and keyword arguments?
    # That should not happen.
    if decorated_ and (indent or sort_keys):
        raise RuntimeError('Unexpected arguments.')

    # Define the actual decorator function.
    def actual_decorator(func):
        @functools.wraps(func)
        def inner(*args, **kwargs):
            try:
                result = func(*args, **kwargs)
            except JSONOutputError as ex:
                result = {
                    'status': 'error',
                    'message': str(ex),
                }
            return json.dumps(result, indent=indent, sort_keys=sort_keys)
        return inner
    # Return either the actual decorator, or the result of applying
    # the actual decorator, depending on what arguments we got.
    if decorated_:
        return actual_decorator(decorated_)
    else:
        return actual_decorator
```

```python
@json_output(indent=4)
def do_nothing():
    return {'staus':'done'}

do_nothing()
```

    '{\n    "staus": "done"\n}'

```python
@json_output()
def do_nothing1():
    return {'staus':'done'}

do_nothing1()
```

    '{"staus": "done"}'

```python
@json_output
def do_nothing2():
    return {'staus':'done'}

do_nothing2()
```

    '{"staus": "done"}'

### 6、装饰类

添加对象的创建时间并添加排序的支持

```python
import functools
import time

def sortable_by_creation_time(cls):
    """给定一个类，增加类以使其实例
    可通过它们被实例化的时间戳排序
    """
    original_init = cls.__init__

    @functools.wraps(original_init)
    def new_init(self, *args, **kwargs):
        original_init(self, *args, **kwargs)
        self._created = time.time()

    cls.__init__ = new_init
    cls.__lt__ = lambda self, other: self._created < other._created
    cls.__gt__ = lambda self, other: self._created > other._created

    return cls

@sortable_by_creation_time
class Sortable(object):
    def __init__(self, identifier):
        self.identifier = identifier

    def __repr__(self):
        return self.identifier

first = Sortable('first')
second = Sortable('second')
third = Sortable('third')

sortables = [second, first, third]
sorted(sortables)
```

    [first, second, third]

### 6、类型转换

装饰器装饰一个函数后，返回一个类实例，添加很多样板代码
例如一个简单的任务执行器

```python
class Task(object):
    """一个task基类，拥有一个运行任务的run方法"""

    def run(self, *args, **kwargs):
        raise NotImplementedError('Subclasses must implement `run`.')

    def identify(self):
        return 'I am a task.'


def task(decorated):
    """返回一个运行decorated方法的Task派生类"""
    class TaskSubclass(Task):
        def run(self, *args, **kwargs):
            return decorated(*args, **kwargs)

    return TaskSubclass

@task
def foo():
    return 2 + 2

f = foo()
f.run()
f.identify()
```

    'I am a task.'

此时直接执行`foo()`，不会只执行foo，而是返回一个task派生类的实例，这使编程变得很复杂，修改如下

```python
class Task(object):
    """一个task基类，拥有一个运行任务的run方法"""
    def __call__(self, *args, **kwargs):
        return self.run(*args, **kwargs)
    def run(self, *args, **kwargs):
        raise NotImplementedError('Subclasses must implement `run`.')
    def identify(self):
        return 'I am a task.'

def task(decorated):
    """返回一个运行decorated方法的Task派生类"""
    class TaskSubclass(Task):
        def run(self, *args, **kwargs):
            return decorated(*args, **kwargs)

    return TaskSubclass()

@task
def foo():
    return 2 + 2

foo()
```

    4

### 8、装饰器总结

优点：

* 带来显示的代码可充用性
* 提供了一种完美的方式使用样板代码

问题：

* 模糊了函数被封装于另一个函数的事实
* 不便于调试
* 执行效率的下降

## 二、上下文管理器

***

### 1、理解上下文管理器

上下文管理器是一个包装任意代码块的对象。上下文管理器保证进入上下文管理器时，每次代码执行的一致性；当退出时，相关资源会被回收

### 2、上下文管理器语法

#### （1）`with`关键字

```python
with open('/path/to/filename', 'r') as my_file:
    contents = my_file.read()
```

`as`子句是可选的

当调用`open`方法时，返回一个对象，该对象包含两个特殊方法`__enter__`和`__exit__`，首先执行`__enter__`并将其的返回值赋给`as`后的关键字，在执行完`with`代码块内的内容后，将会执行`__exit__`方法

#### （2）`enter`和`exit`方法

* `__enter__`方法除了self不接受任何参数
* `__exit__`方法除了self外，还接受三个参数：异常类型、异常实例、回溯
    * 实现异常传播，该方法返回一个False
    * 中止异常，返回一个True
    * 抛出其他异常，在方法中直接抛出

例子

```python
class ContextManager(object):
    def __init__(self):
        self.entered = False
        print("__init__")

    def __enter__(self):
        self.entered = True
        print("__enter__")
        return self

    def __exit__(self, exc_type, exc_instance, traceback):
        self.entered = False
```

```python
cm = ContextManager()
cm.entered
```

    __init__

    False

```python
with cm as cm:
    print(cm.entered)
```

    __enter__
    True

```python
with ContextManager() as cm:
    print(cm.entered)
```

    __init__
    __enter__
    True

### 3、何时编写上下文管理器

#### （1）资源清理

一个数据库连接上下文管理器

```python
import psycopg2

class DBConnection(object):
    def __init__(self, dbname=None, user=None,
                    password=None, host='localhost'):
        self.host = host
        self.dbname = dbname
        self.user = user
        self.password = password

    def __enter__(self):
        self.connection = psycopg2.connect(
            dbname=self.dbname,
            host=self.host,
            user=self.user,
            password=self.password,
        )
    return self.connection.cursor()

    def __exit__(self, exc_type, exc_instance, traceback):
        self.connection.close()

with DBConnection(user='luke', dbname='foo') as db:
    db.execute('SELECT 1 + 1')
    db.fetchall()
```

#### （2）避免重复

**传播异常**

```python
class BubbleExceptions(object):
    def __enter__(self):
        return self
    def __exit__(self, exc_type, exc_instance, traceback):
        if exc_instance:
            print('Bubbling up exception: %s.' % exc_instance)
        return False

with BubbleExceptions():
    5+5

with BubbleExceptions():
    5/0
```

    Bubbling up exception: division by zero.

    ---------------------------------------------------------------------------

    ZeroDivisionError                         Traceback (most recent call last)

    <ipython-input-9-abae51d6cf71> in <module>()
         11
         12 with BubbleExceptions():
    ---> 13     5/0


    ZeroDivisionError: division by zero

**中止异常**

```python
class BubbleExceptions(object):
    def __enter__(self):
        return self
    def __exit__(self, exc_type, exc_instance, traceback):
        if exc_instance:
            print('Bubbling up exception: %s.' % exc_instance)
        return True

with BubbleExceptions():
    5+5

with BubbleExceptions():
    5/0
```

    Bubbling up exception: division by zero.

**处理特定异常**

略

### 4、更简单是实现上下文管理器

使用上下文管理器生成器

```python
import contextlib

@contextlib.contextmanager
def acceptable_error_codes(*codes):
    try:
        yield
    except ShellException as exc_instance:
        # If this error code is not in the list of acceptable error
        # codes, re-raise the exception.
        if exc_instance.code not in codes:
            raise
    # This was an acceptable error; no need to do anything.
    pass
```

## 三、生成器

***

### 1、理解生成器

生成器是一个函数，他并不执行并返回一个值，而是按照顺序返回一个或者多个值。

### 2、生成器语法

#### （1）`yield`关键字

```python
def fibonacci():
    yield 1
    yield 1
    yield 2
    yield 3
    yield 5
    yield 8

for i in fibonacci():
    print(i)
```

    1
    1
    2
    3
    5
    8

```python
def fibonacci():
    yield 1
    yield 1
    yield 2
    yield 3
    yield 5
    yield 8

for i in fibonacci():
    print(i)
```

    1
    1
    2
    3
    5
    8

#### （2）`next`函数

```python
def fibonacci():
    numbers = []
    while True:
        if len(numbers) < 2:
            numbers.append(1)
        else:
            numbers.append(sum(numbers))
            numbers.pop(0)
        yield numbers[-1]

gen = fibonacci()
gen
```

    <generator object fibonacci at 0x7f9a440c96d0>

```python
next(gen)
next(gen)
```

    2

#### （3）执行分析

* 调用带有`yield`的函数时，解释器会自动生成一个生成器对象
* 首次`next`函数时，从头开始执行生成器函数到yield，将其后面的值返回，并暂停（类似于挂起）
* 其他时候，从上次的yield语句的下一条语句开始执行，再到yield后返回并暂停

#### （4）生成器退出

* python2 使用`raise StopIteraton`异常中止
* python3 使用`return` 同时兼容py2的写法

```python
def my_generator():
    yield 1
    yield 2
    return
    yield 3

[i for i in my_generator()]
```

    [1, 2]

```python
gen = my_generator()
next(gen)
next(gen)
next(gen)
```

    ---------------------------------------------------------------------------

    StopIteration                             Traceback (most recent call last)

    <ipython-input-13-d3e84f7c15f2> in <module>()
          2 next(gen)
          3 next(gen)
    ----> 4 next(gen)

    StopIteration:

### 3、生成器间交互

给生成器传递参数，使用`gen.send()`

例子：按顺序返回完全平方数

```python
def squares(cursor = 1):
    while True:
        response = yield cursor**2 #一般情况下会返回None
        if response:
            cursor = int(response)
        else:
            cursor += 1

sq = squares()
print(next(sq))
print(next(sq))
sq.send(7)
print(next(sq))
```

    1
    4
    64

### 4、迭代对象与迭代器

* 生成器是一种迭代器
* 迭代器是一种包含`__next__`方法的对象
* 迭代对象是一种包含了`__iter__`方法的对象，该方法负责返回一个迭代器
* `for in`可以相应迭代对象和迭代器
* `next`只能相应迭代器

`range`（python3）或者`xrange`（python2）是一种迭代对象

```python
r = range(1,3)
next(r)
```

    ---------------------------------------------------------------------------

    TypeError                                 Traceback (most recent call last)

    <ipython-input-19-7cb3a8583905> in <module>()
          1 r = range(1,3)
    ----> 2 next(r)


    TypeError: 'range' object is not an iterator

```python
it = r.__iter__()
next(it)
```

    1

### 5、标准库中的生成器

#### （1）`range`

该对象返回的迭代器实际上是一个生成器

#### （2）`dict.items`及其家族

* `dict.keys`
* `dict.valuse`
* `dict.items`

```python
d = {'foo':'bar', 'baz':'bacon'}
it = iter(d.items())
next(it)
next(it)
```

    ('baz', 'bacon')

使用生成器的原因是防止创建额外的字典副本，节约内存。
在迭代期间修改字典可能出现副作用

```python
d = {'foo':'bar', 'baz':'bacon'}
it = iter(d.items())
next(it)
d['spam'] = 'eggs'
next(it)
```

    ---------------------------------------------------------------------------

    RuntimeError                              Traceback (most recent call last)

    <ipython-input-25-c1caf20db5b5> in <module>()
          3 next(it)
          4 d['spam'] = 'eggs'
    ----> 5 next(it)

    RuntimeError: dictionary changed size during iteration

#### （3）`zip`

将两个列表依次组成元组返回，直到达到最短的停止

```python
z = zip(['a','b','c','d'], ['x','y','z'])
next(z)
next(z)
next(z)
next(z)
```

    ---------------------------------------------------------------------------

    StopIteration                             Traceback (most recent call last)

    <ipython-input-26-358fa184f7bb> in <module>()
          3 next(z)
          4 next(z)
    ----> 5 next(z)

    StopIteration:

#### （4）`map`

接受一个能接受N参数的函数对象 和 N个参数列表 的对象，依次将参数列表的参数依次传入函数对象并执行并返回返回值

```python
m = map(lambda x,y: max([x,y]),[4,1,7],[3,4,5])
next(m)
next(m)
next(m)
next(m)
```

    ---------------------------------------------------------------------------

    StopIteration                             Traceback (most recent call last)

    <ipython-input-29-db80638e5ef9> in <module>()
          3 next(m)
          4 next(m)
    ----> 5 next(m)


    StopIteration:

#### （5）文件对象

`open()`返回的对象

```python
f = open('lines.txt')
next(f)
next(f)
```

### 6、何时编写生成器

* 分块访问数据
* 分块计算数据

### 7、单例模式生成器

指的是该对象既是迭代对象又是生成器，例子：

```python
class Fibonacci(object):
    def __init__(self):
        self.numbers = []
    def __iter__(self):
        return self
    def __next__(self):
        if len(self.numbers) < 2:
            self.numbers.append(1)
        else:
            self.numbers.append(sum(self.numbers))
            self.numbers.pop(0)
        return self.numbers[-1]
    def send(self, value):
        pass
    # For Python 2 compatibility
    next = __next__
```

```python
f = Fibonacci()
it1 = iter(f)
next(it1),next(it1),next(it1),next(it1),next(it1)
```

    (1, 1, 2, 3, 5)

```python
it2 = iter(f)
next(it2)
```

    8

搞清楚是否有些对象可以有多个迭代器，而有些对象则不可以

### 8、生成器内部的生成器

对生成器进行组合

```python
def gen1():
    yield 'foo'
    yield 'bar'
def gen2():
    yield 'spam'
    yield 'eggs'

#组合使用python3.3之前
def full_gen():
    for word in gen1():
        yield word
    for word in gen2():
        yield word

for s in full_gen():
    print(s)

# 或
import itertools
def full_gen():
    for word in itertools.chain(gen1(),gen2()):
        yield word
for s in full_gen():
    print(s)

#组合使用python3.3及更新
def full_gen():
    yield from gen1()
    yield from gen2()
for s in full_gen():
    print(s)

```

    foo
    bar
    spam
    eggs
    foo
    bar
    spam
    eggs
    foo
    bar
    spam
    eggs
