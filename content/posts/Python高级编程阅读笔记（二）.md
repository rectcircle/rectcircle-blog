---
title: Python高级编程阅读笔记（二）
date: 2017-09-29T19:39:34+08:00
draft: false
toc: true
comments: true
aliases:
  - /detail/98
  - /detail/98/
tags:
  - python
---

## 四、魔术方法

***

### 1、魔术方法语法

在python类定义中的特殊函数，命名特点是方法名称两端含有两个下划线

### 2、可用的魔术方法

#### （1）创建与销毁

**`__init__`方法**

创建类实例后立即执行此方法

```python
import random
class Dice(object):
    """初始化一个六面骰子"""
    def __init__(self, sides=6):
        self._sides = sides

    def roll(self):
        return random.randint(1,self._sides)

die = Dice(sides=20)
die._sides
die.roll()
```

    8

**`__new__`方法**

一般不需要覆盖，用于创建实例

**``__del__``方法**

当对象被回时会触发此

```python
class Xon(object):
    def __del__(self):
        print("__del__方法被执行")

Xon()
print('foo')
x = Xon()
del x
```

    __del__方法被执行
    foo
    __del__方法被执行

#### （2）类型转换

**`__str__`、`__unicode__`、`__bytes__`函数**

python2中字符串使用ascii、python3中字符串使用unicode

```python

class MyObject(object):
    def __str__(self):
        return '这是一个测试对象'
    def __unicode__(self):
        return u"unicode编码"
    def __bytes__(self):
        return "ascii编码"

str(MyObject())
```

    '这是一个测试对象'

**`__bool__`方法**

在python2中为`__nonzero__`

**`__int__`、`__float__`、`__complex__`**

#### （3）比较

**二元相等性**

* `__eq__`，`==`判断是否相等，返回True或FALSE
* `__ne__`，`!=`判断是否不相等，一般不要定义
* 一般不需定义`__ne__`，解释器会自动推导

**相对比较**

* `__lt__`，`<`返回True或False
* `__le__`，`<+`返回True或False
* `__gt__`，`>`返回True或False
* `__ge__`，`>=`返回True或False
* 一般无需全部定义以上四个，一般只需定义`__eq__`和`__lt__`所有比较都能正确执行

**`__cmp__`**方法：已经废弃

#### （4）运算符重载

**二元运算符重载**

| Operator | Method | Reverse | 即席（a x= b） |
|----------|--------|---------|---------------|
| `+` | `__add__` | `__radd__` | `__iadd__` |
| `-` | `__sub__` | `__rsub__` | `__isub__` |
| `*` | `__mul__` | `__rmul__` | `__imul__` |
| `/` | `__truediv__` | `__rtruediv__` | `__itruediv__` |
| `//` | `__floordiv__` | `__rfloordiv__` | `__ifloordiv__` |
| `%` | `__mod__` | `__rmod__` | `__imod__` |
| `**` | `__pow__` | `__rpow__` | `__ipow__` |
| `&` | `__and__` | `__rand__` | `__iand__` |
| `或` | `__or__` | `__ror__` | `__ior__` |
| `ˆ` | `__xor__` | `__rxor__` | `__ixor__` |
| `<<` | `__lshift__` | `__rlshift__` | `__ilshift__` |
| `>>` | `__rshift__` | `__rrshift__` | `__irshift__` |

**对于除法的说明**

python2 中的 `/` 代表整除， python3中`/`代表浮点除法，`//`代表整除
在python2中 只有 `__div__`，在python3中`__div__`等价于`__truediv__`

**一元操作符**

* `__pos__`表示`+`
* `__neg__`表示`-`
* `__invert__`表示`~`

```python
class ReversibleString(object):
    def __init__(self, s):
        self.s = s
    def __invert__(self):
        return self.s[::-1]
    def __str__(self):
        return self.s

rs = ReversibleString("abcdefg")
~rs
```

    'gfedcba'

**重载常见方法**

* `__len__`方法，对`len(obj)`有效和`if obj`有效
* `__repr__`方法，在交互式终端输出内容
* `__hash__`方法，若对象定义了`__eq__`那么`__hash__`将隐式为None
* `__format__`格式化方法
* `__instancecheck__`和`__subclasscheck__`极少使用
* `__abs__`和`__round__`，绝对值和前后取整

```python
from datetime import datetime


class MyDate(datetime):
    def __format__(self, spec_str):
        if not spec_str:
            spec_str = '%Y-%m-%d %H:%M:%S'
        return self.strftime(spec_str)


md = MyDate(2012, 4, 21, 11)

print('{0}'.format(md))
print('{0:%Y-%m-%d}'.format(md))
```

    2012-04-21 11:00:00
    2012-04-21

**集合**

`__contains__`方法，在`needle in saystack`时调用

```python
from datetime import date
class DateRange(object):
    def __init__(self, start, end):
        self.start = start
        self.end = end
    def __contains__(self, needle):
        return self.start <= needle <= self.end
dr = DateRange(date(2015, 1, 1), date(2015, 12, 31))
print(date(2015, 4, 21) in dr)
print(date(2, 4, 21) in dr)

```

    True
    False

* `__getitem__(self, key)` 当`obj[key]`时调用
* `__setitem__(self, key, value)` 当`obj[key]=xxx`时调用
* `__delitem__(self, key)` 当`del obg[key]`

```python
class Items:
    def __getitem__(self, key):
        print("get", key)
    def __setitem__(self, key, value):
        print('set', key,value)
    def __delitem__(self, key):
        print("del", key)

c = Items()
c['A']
c['A'] = 1
del c['A']
```

    get A
    set A 1
    del A

`__getattr__`和`__setattr__`，可能在`obj.attrname`或者`getattr(obj,'attrname')`在常规情况下找不到对象属性时调用这两个方法
`__getattribute__`，在`obj.attrname`或者`getattr(obj,'attrname')`下必然触发，这是基类的正常实现，在此可以理解为复写

### 3、其他的魔术方法

* `__iter__`
* `__next__`
* `__enter__`
* `__exit__`

## 五、元类

***

### 1、类与对象

```python
# 普通定义类的方法
class Animal(object):
    """A class representing an arbitrary animal."""
    def __init__(self, name):
        self.name = name
    def eat(self):
        pass
    def go_to_vet(self):
        pass

class Cat(Animal):
    def meow(self):
        pass
    def purr(self):
        pass
```

```python
# 通过type函数构造类
def init(self, name):
    self.name = name
def eat(self):
    pass
def go_to_vet(self):
    pass

Animal = type('Animal', (object,), {
        '__doc__': 'A class representing an arbitrary animal.',
        '__init__': init,
        'eat': eat,
        'go_to_vet': go_to_vet,
    })

def meow(self):
    return None
def purr(self):
    return None
Cat = type('Cat', (Animal,), {
    'meow': meow,
    'purr': purr,
})

c = Cat("Tom")
```

以上两种基本等价：

在内部的普通定义类，内部其实是使用`type`函数
`type`函数说明

* 第一个参数为一个字符串，表示类名
* 第二个为一个元组，表示基类
* 第三个参数为一个字典，表示该类的方法和属性

#### （2）type链

```python
print(type(1))
print(type(c))
print(type(Cat))
print(type(type))
```

    <class 'int'>
    <class '__main__.Cat'>
    <class 'type'>
    <class 'type'>

#### （3）type所扮演的角色

* type是python中的主要元类
* 默认情况下，使用class关键字创建的普通类使用type作为其元类
* type是元类层级的最高级

### 2、编写元类

```python
class Meta(type):
    def __new__(cls, name, bases, attrs):
        return super(Meta, cls).__new__(cls, name, bases, attrs)

C = Meta('C', (object, ), {})
print(type(C))

class N(object):
    pass

print(type(N))
```

    <class '__main__.Meta'>
    <class 'type'>

元类继承：多重继承两个父类拥有不同的元类

* 当两个元类一个是另一个直接子类type返回直接子类
* 当两个元类不是直接子类关系，将报错

```python
class Z(C, N):
    pass

print(type(Z))

class OtherMeta(type):
    def __new__(cls, name, bases, attrs):
        return super(Meta, cls).__new__(cls, name, bases, attrs)

OtherC = OtherMeta('OtherC', (object, ),{})
class Invalid(C, OtherC):
    pass

```

    <class '__main__.Meta'>

    ---------------------------------------------------------------------------

    TypeError                                 Traceback (most recent call last)

    <ipython-input-17-3fb2e12f7cea> in <module>()
          9
         10 OtherC = OtherMeta('OtherC', (object, ),{})
    ---> 11 class Invalid(C, OtherC):
         12     pass

    TypeError: metaclass conflict: the metaclass of a derived class must be a (non-strict) subclass of the metaclasses of all its bases

### 3、使用元类

#### （1）python3

```python
class C(metaclass=Meta):
    pass
```

#### （2）python2

```python
class C(object):
    __metaclass__ = Meta
```

#### （3）跨平台执行代码

引入six工具

```python
import six

class C(six.with_metaclass(Meta))
    pass

#或者
@six.add_metaclass(Meta)
class C(object):
    pass
```

跨平台一般在python2转python3时使用

### 4、何时使用元类

使用元类可以使代码更易理解

#### （1）说明性声明

```python
from django.db import models
class Book(models.Model):
    author = models.CharField(max_length=100)
    title = models.CharField(max_length=250)
    isbn = models.CharField(max_length=20)
    publication_date = models.DateField()
    pages = models.PositiveIntegerField()
```

实例说明：

* `models.Model`的元类是框架自定义的`ModelBase`
* 自己的类继承了`models.Model`类，其元类也是`ModelBase`
* 解释器执行到自定义类时，会执行`ModelBase.__new__`函数
* 在这个函数中对属性做了处理和替换

#### （2）验证类

要求某些类必须实现特定接口，一般通过默认值可以实现。但是有些不好实现。例如某个需要设置两个属性中的一个，不能同时都设置

```python
class FooOrBar(type):
    def __new__(cls, name, bases, attrs):
        if 'foo' in attrs and 'bar' in attrs:
            raise TypeError('Class %s cannot contain both `foo` and '
        '`bar` attributes.' % name)
        if 'foo' not in attrs and 'bar' not in attrs:
            raise TypeError('Class %s must provide either a `foo` '
        'attribute or a `bar` attribute.' % name)

        return super(FooOrBar, cls).__new__(cls, name, bases, attrs)

class Valid(metaclass=FooOrBar):
    foo = 42
```

```python
class Vaild1(metaclass=FooOrBar):
    def bar():
        pass
```

```python
class Vaild2(metaclass=FooOrBar):
    pass
```

    ---------------------------------------------------------------------------

    TypeError                                 Traceback (most recent call last)

    <ipython-input-23-642c301421b9> in <module>()
    ----> 1 class Vaild2(metaclass=FooOrBar):
          2     pass

    <ipython-input-21-1e4073c0520b> in __new__(cls, name, bases, attrs)
          6         if 'foo' not in attrs and 'bar' not in attrs:
          7             raise TypeError('Class %s must provide either a `foo` '
    ----> 8         'attribute or a `bar` attribute.' % name)
          9
         10         return super(FooOrBar, cls).__new__(cls, name, bases, attrs)

    TypeError: Class Vaild2 must provide either a `foo` attribute or a `bar` attribute.

#### （3）非继承属性

某框架一个元类为其提供一些功能，但是不希望为抽象类提供这些功能

```python
class Meta(type):
    def __new__(cls, name, bases, attrs):
        # Sanity check: If this is an abstract class, then we do not
        # want the metaclass functionality here.
        if attrs.pop('abstract', False):
            return super(Meta, cls).__new__(cls, name, bases, attrs)
        # Perform actual metaclass functionality.
        print("某框架的特别功能")

class AbstractClass(metaclass=Meta):
    abstract = True
    print("抽象类")
class RegularClass(AbstractClass):
    print("正常类")
    pass
```

    抽象类
    正常类
    某框架的特别功能

### 5、显示选择的问题

* 很多时候元类和装饰器可以实现同样功能
* 装饰器必须用户显示声明
* 元类对于用户是隐藏的
* 一般来说"显示比隐式好"，显示更容易维护

### 6、meta-coding

meta_coding指的是：用于查看应用程序中其他代码的代码。例如：应该记录其自身的代码

```python
class Logged(type):
    """
    一个元类，他可以为类函数调用记录log
    """
    def __new__(cls, name, bases, attrs):
        for key, value in attrs.items():
            if callable(value):
                attrs[key] = cls.log_call(value) #给所有函数进行装饰
        return super(Logged, cls).__new__(cls, name, bases, attrs)

    @staticmethod
    def log_call(fxn):
        """
        一个包装器，返回一个包装后的函数
        """
        def inner(*args, **kwargs):
            print('函数 %s 正在被调用，使用参数 %r 和 '
                  '关键字参数 %r.' % (fxn.__name__, args, kwargs))
            try:
                response = fxn(*args, **kwargs)
                print('函数 %s 调用成功' %
                    fxn.__name__)
                return response
            except Exception as exc:
                print('函数 %s 抛出一个异常 %r' %
                (fxn.__name__, exc))
            raise
        return inner

class MyClass(metaclass=Logged):
    def foo(self):
        pass
    def bar(self):
        raise TypeError('oh noes!')

mc = MyClass()
mc.foo()
mc.bar()

```

    函数 foo 正在被调用，使用参数 (<__main__.MyClass object at 0x7f4720d9abe0>,) 和 关键字参数 {}.
    函数 foo 调用成功
    函数 bar 正在被调用，使用参数 (<__main__.MyClass object at 0x7f4720d9abe0>,) 和 关键字参数 {}.
    函数 bar 抛出一个异常 TypeError('oh noes!',)

    ---------------------------------------------------------------------------

    RuntimeError                              Traceback (most recent call last)

    <ipython-input-29-fdf194ee23b8> in <module>()
         36 mc = MyClass()
         37 mc.foo()
    ---> 38 mc.bar()

    <ipython-input-29-fdf194ee23b8> in inner(*args, **kwargs)
         25                 print('函数 %s 抛出一个异常 %r' %
         26                 (fxn.__name__, exc))
    ---> 27             raise
         28         return inner
         29


    RuntimeError: No active exception to reraise

说明：

* `__init__`并没有被装饰，因为该方法继承自object
* 若希望`__init__`被装饰，重写此方法
* 只用在定义类时定义的方法才会被装饰后来定义的不会生效

```python
MyClass.foo = lambda self: 42
mc.foo()
```

    42

## 六、类工厂

***

类工厂指的是在运行时根据情况动态创建类（注意不是对象），实现上一般使用上一章使用的元类或者返回一个class

### 1、类工厂函数

```python
def create_animal_class():
    """
    返回一个Animal类，通过type函数
    """
    def init(self, name):
        self.name = name
    def eat(self):
        pass
    def go_to_vet(self):
        pass

    return type('Animal', (object,), {
            '__doc__': 'A class representing an arbitrary animal.',
            '__init__': init,
            'eat': eat,
            'go_to_vet': go_to_vet,
        })
Animal1 = create_animal_class()
Animal2 = create_animal_class()
animal1 = Animal1('dog')
animal2 = Animal2('dog')

print(isinstance(animal1, Animal1))
print(isinstance(animal1, Animal2))
```

    True
    False

说明：

* 上面的`create_animal_class`就是一个类工厂函数
* 调用类工厂函数返回的类是不同的

### 2、何时编写类工厂函数

#### （1）运行时属性

```python
def get_credential_class(use_proxy=False, tfa=False):
    """返回一个类，该类记录了使用不同的登录方式用户需要提供的信息
    """
    # 如果是一个用户代理，我们需要服务名和电子邮件地址
    # 在实际操作中，要求从数据库中读取所需的属性
    if use_proxy:
        keys = ['service_name', 'email_address']
    else:
        # 否则我们需要用户名和密码
        keys = ['username', 'password']
    if tfa:
        keys.append('tfa_token')
    # Return a class with a proper __init__ method which expects
    # all expected keys.
    class Credential(object):
        expected_keys = set(keys)
        def __init__(self, **kwargs):
            # Sanity check: Do our keys match?
            if self.expected_keys != set(kwargs.keys()):
                raise ValueError('Keys do not match.')
            # Write the keys to the credential object.
            for k, v in kwargs.items():
                setattr(self, k, v)
    return Credential

```

#### （2）避免类属性一致性问题

**类属性和实例属性**

* 类属性不依赖于实例直接可以使用类名调用
* 实例属性必须通过实例调用

```python
# 类属性
class C(object):
    foo = 'bar'

#实例属性
class I(object):
    def __init__(self):
        self.foo = 'bar'

print(C.foo)
print(I.foo)
```

    bar

    ---------------------------------------------------------------------------

    AttributeError                            Traceback (most recent call last)

    <ipython-input-5-1a7648de982d> in <module>()
          9
         10 print(C.foo)
    ---> 11 print(I.foo)

    AttributeError: type object 'I' has no attribute 'foo'

**实例属性隐藏类属性**

```python
c1 = C()
c2 = C()
c1.foo = 'baz' #这样不会修改类属性
print(c1.foo)
print(c2.foo)
C.foo = 'bacon'
print(c1.foo)
print(c2.foo)
```

    baz
    bar
    baz
    bacon

**类方法的限制**

* 类方法无法访问实例方法

```python
class C(object):
    foo = 'bar'

    @classmethod
    def classfoo(cls):
        return cls.foo
c1 = C()
c2 = C()
c1.foo = 'baz' #这样不会修改类属性
C.foo = 'bacon'

print(c1.foo)
print(c1.classfoo())
```

    baz
    bacon

**使用类工厂尝试**

* 尝试动态创建子类并覆盖父类的类属性

```python
def create_c_subclass(new_foo):
    class Subc(C):
        foo = new_foo
    return Subc

S =create_c_subclass('spam')
print(S.classfoo())
S =create_c_subclass('eggs')
print(S.classfoo())
```

    spam
    eggs

#### （3）实例工厂

```python
def CPrime(new_foo='bar'):
    if new_foo == 'bar':
        return C()
    class SubC(C):
        foo = new_foo
    return SubC()
```

说明：

* 返回实例的工厂函数，一般要使用类的命名方式
* 对于需要需要传递构造函数参数情况下的工厂函数签名`def XxxFactory(param, *arg, **kwargs)`

## 七、抽象基类

***

python是一门动态类型语言，也就是说函数的参数返回值不需要声明类型。在动态语言中一个对象是否满足要求的也界定是：该对象是否包含一个特定的属性或者方法。这种现象称之为鸭子模型。他强调的对象有事么，而不再以对象的身份是什么

但是在有些时候身份很重要，所以在python2.6和python3中引入了抽象基类的概念

### 1、使用抽象基类

抽象基类的基本目的是测试一个对象是否符合某种身份

如何确定你正在处理的对象是列表：通过调用`isinstance`函数

```python
isinstance([],list)
```

    True

但是，在编码中不一定真的只能是列表，如果这样就丧失了动态语言的灵活性，有时候元组也可以，`isinstance`也提供支持

```python
isinstance([],(list,tuple))
```

    True

```python
isinstance((),(list,tuple))
```

    True

有时候，需要的对象是自定义的列表，此时可以使用`hasattr`函数

```python
hasattr([],'__getitem__')
```

    True

```python
hasattr(object(), '__getitem__')
```

    False

但是不仅仅列表拥有此方法，字典也拥有此方法，可能带来问题

### 2、声明虚拟子类

为了加强对代码的检查，需要声明虚拟子类

#### （1）样例

```python
import abc
class AbstractDict(metaclass=abc.ABCMeta):
    def foo(self):
        return None

AbstractDict.register(dict) #将dict作为此抽象基类的虚拟子类
print(isinstance({}, AbstractDict))

{}.foo()
```

    True

    ---------------------------------------------------------------------------

    AttributeError                            Traceback (most recent call last)

    <ipython-input-10-bc851b3e9ae4> in <module>()
          6 AbstractDict.register(dict) #将dict作为此抽象基类的虚拟子类
          7 print(isinstance({}, AbstractDict))
    ----> 8 {}.foo()

    AttributeError: 'dict' object has no attribute 'foo'

说明：

* 声明虚拟子类，不会给现有类对象添加方法
* 只是给现存类或则新定义的类强加了一个身份标示，在使用`isinstance`时，会得到期望的结果

#### （2）使用装饰器实现注册

```python
import abc
class MySequence(metaclass=abc.ABCMeta):
    pass

# 普通方式注册虚拟子类
class CustomListLikeClass(object):
    pass
MySequence.register(CustomListLikeClass)

# 装饰器方式python3.3
@MySequence.register
class CustomListLikeClass(object):
    pass

issubclass(CustomListLikeClass, MySequence)
```

    True

#### （3）使用`__subclasshook__`

例子：定义一个鸭子类型的基类

```python
import abc

class AbstractDuck(metaclass=abc.ABCMeta):
    @classmethod
    def __subclasshook__(cls, other):
        quack = getattr(other, 'quack', None)
        if callable(quack):
            return True
        return NotImplemented

class Duck(object):
    def quack(self):
        pass

class NotDuck(object):
    quack = 'foo'

print(issubclass(Duck, AbstractDuck))
print(issubclass(NotDuck, AbstractDuck))

AbstractDuck.register(NotDuck)
print(issubclass(NotDuck, AbstractDuck))
```

    True
    False
    True

说明

* 使用`__subclasshook__`可以批量检测鸭子类型
* `issubclass`执行过程中会调用`__subclasshook__`方法，返回其返回值
* `__subclasshook__`的优先级是高于register函数的，若其有明确的返回值（True或False），将不会检查register注册的类
* 当`__subclasshook__`返回`NotImplemented`时，将自动执行register检查

### 3、声明协议

抽象基类的另一个主要价值在于其具有声明协议的作用，类似于java中的接口

#### （1）其他现有方法

**使用`NotImplemented`实现**

构建一个类省去一个关键的方法，以便于该方法可以被子类是实现

```python
from datetime import datetime

class Task(object):
    """
    一个任务抽象类，子类必须实现`_run`方法
    """
    def __init__(self):
        self.runs = []
    def run(self):
        start = datetime.now()
        result = self._run()
        end = datetime.now()
        self.runs.append({
                'start': start,
                'end': end,
                'result': result,
            })
        return result
    def _run(self):
        raise NotImplementedError('Task subclasses must define '
                                    'a _run method.')

t = Task()
t.run()
```

    ---------------------------------------------------------------------------

    NotImplementedError                       Traceback (most recent call last)

    <ipython-input-25-ecf3f64a04f7> in <module>()
         22
         23 t = Task()
    ---> 24 t.run()

    <ipython-input-25-ecf3f64a04f7> in run(self)
          9     def run(self):
         10         start = datetime.now()
    ---> 11         result = self._run()
         12         end = datetime.now()
         13         self.runs.append({


    <ipython-input-25-ecf3f64a04f7> in _run(self)
         18         return result
         19     def _run(self):
    ---> 20         raise NotImplementedError('Task subclasses must define '
         21                                     'a _run method.')
         22


    NotImplementedError: Task subclasses must define a _run method.

**使用元类**

```python
from datetime import timezone
class TaskMeta(type):
    """A metaclass that ensures the presence of a _run method
    on any non-abstract classes it creates.
    """
    def __new__(cls, name, bases, attrs):
        # If this is an abstract class, do not check for a _run method.
        if attrs.pop('abstract', False):
            return super(TaskMeta, cls).__new__(cls, name, bases, attrs)

        # Create the resulting class.
        new_class = super(TaskMeta, cls).__new__(cls, name, bases, attrs)

        # Verify that a _run method is present and raise
        # TypeError otherwise.
        if not hasattr(new_class, '_run') or not callable(new__class.__run):
            raise TypeError('Task subclasses must define a _run method.')

        # Return the new class object.
        return new_class

class Task(metaclass=TaskMeta):
    """An abstract class representing a task that must run, and
    which should track individual runs and results.
    """
    abstract = True

    def __init__(self):
        self.runs = []

    def run(self):
        start = datetime.now(tz=timezone.utc)
        result = self._run()
        end = datetime.now(tz=timezone.utc)
        self.runs.append({
                'start': start,
                'end': end,
                'result': result,
            })
        return result

t = Task()
t.run()
```

    ---------------------------------------------------------------------------

    AttributeError                            Traceback (most recent call last)

    <ipython-input-31-a65ef3b9a38f> in <module>()
         41
         42 t = Task()
    ---> 43 t.run()

    <ipython-input-31-a65ef3b9a38f> in run(self)
         31     def run(self):
         32         start = datetime.now(tz=timezone.utc)
    ---> 33         result = self._run()
         34         end = datetime.now(tz=timezone.utc)
         35         self.runs.append({

    AttributeError: 'Task' object has no attribute '_run'

#### （2）抽象基类实现

抽象类实现的意义：

* 以上两种方法虽然可以实现，但是感觉上不够形式化，有点“即席”
* 使用抽象类更加正式，符合习惯

```python
class Task(metaclass=abc.ABCMeta):
    """一个抽象类，必须实现`_run`方法
    """
    def __init__(self):
        self.runs = []

    def run(self):
        start = datetime.now(tz=timezone.utc)
        result = self._run()
        end = datetime.now(tz=timezone.utc)
        self.runs.append({
                'start': start,
                'end': end,
                'result': result,
            })
        return result

    @abc.abstractmethod
    def _run(self):
        pass

t = Task()
```

    ---------------------------------------------------------------------------

    TypeError                                 Traceback (most recent call last)

    <ipython-input-32-361afa5398fe> in <module>()
         20         pass
         21
    ---> 22 t = Task()

    TypeError: Can't instantiate abstract class Task with abstract methods _run

```python
class Subtask(Task):
    pass

st = Subtask()
```

    ---------------------------------------------------------------------------

    TypeError                                 Traceback (most recent call last)

    <ipython-input-35-e93262e20bb3> in <module>()
          2     pass
          3
    ----> 4 st = Subtask()

    TypeError: Can't instantiate abstract class Subtask with abstract methods _run

```python
class OtherSubtask(Task):
    def _run(self):
        return 2+2

ost = OtherSubtask()
ost.run()
ost.runs
```

    [{'end': datetime.datetime(2017, 9, 29, 11, 11, 47, 769002, tzinfo=datetime.timezone.utc),
      'result': 4,
      'start': datetime.datetime(2017, 9, 29, 11, 11, 47, 768996, tzinfo=datetime.timezone.utc)}]

优点：

* 抽象类不可以被实例化，者更符合C++/Java的抽象类的实现
* 这个方法更加正式，实现起来更加简单

#### （3）抽象属性

在python2.6到python3.2中

```python
import abc
class AbstractClass(metaclass=abc.ABCMeta):
    @abc.abstractproperty
    def foo(self):
        pass
```

在python3.3及其以后

```python
import abc
class AbstractClass(metaclass=abc.ABCMeta):
    @property
    @abc.abstractmethod
    def foo(self):
        pass

class InvalidChild(AbstractClass):
    pass

ic = InvalidChild()
```

    ---------------------------------------------------------------------------

    TypeError                                 Traceback (most recent call last)

    <ipython-input-39-e743bf049d03> in <module>()
          9     pass
         10
    ---> 11 ic = InvalidChild()


    TypeError: Can't instantiate abstract class InvalidChild with abstract methods foo

```python
class InvalidChild(AbstractClass):
    def foo(self):
        return 'bar'

ic = InvalidChild()
ic.foo()
```

    'bar'

#### （4）抽象类或静态方法

python3.3之后实现抽象静态方法

```python
class AbstractClass(metaclass=abc.ABCMeta):
    @classmethod
    @abc.abstractmethod
    def foo(cls):
        return 42

class InvalidChild(AbstractClass):
    pass

print(InvalidChild.foo())
ic = InvalidChild()
```

    42

    ---------------------------------------------------------------------------

    TypeError                                 Traceback (most recent call last)

    <ipython-input-42-7b1065197bdd> in <module>()
          9
         10 print(InvalidChild.foo())
    ---> 11 ic = InvalidChild()

    TypeError: Can't instantiate abstract class InvalidChild with abstract methods foo

```python
class ValidChild(AbstractClass):
    @classmethod
    def foo(cls):
        return 'bar'

vc = ValidChild()
```

### 4、内置抽象基类

python3以后：

#### （1）只包含一个方法的抽象基类

* Callable (`__call__`)
* Container (`__contains__`)
* Hashable (`__hash__`)
* Iterable (`__iter__`)
* Sized (`__len__`)

所有包含这些方法的类都会自动作为该类的子类

```python
from collections.abc import Sized

class Foo(object):
    def __len__(self):
        return 42

issubclass(Foo, Sized)
```

    True

#### （2）可供集合使用的抽象基类

* `Sequence` 和 `MutableSequence` 类似于元组或列表，
    * `Sequence`：其虚拟子类有：list、tuple、set
        * `__getitem__` 和 `__len__` 是必须实现的抽象方法
        * 提供了一些方法如`__contains__`和`__iter__`
    * `MutableSequence`：即席可修改序列
        * 添加来了 `__setitem__` 和 `__delitem__`作为抽象方法
        * 提供了`append` 和 `pop`方法
* `Mapping`
* `Set`

**使用内置抽象基类**

可以使代码更加灵活和严格，带来类型上的好处

**其他的抽象基类**

numbers模块包含众多用于数字类型的抽象基类

## 七、抽象基类

***

python是一门动态类型语言，也就是说函数的参数返回值不需要声明类型。在动态语言中一个对象是否满足要求的也界定是：该对象是否包含一个特定的属性或者方法。这种现象称之为鸭子模型。他强调的对象有事么，而不再以对象的身份是什么

但是在有些时候身份很重要，所以在python2.6和python3中引入了抽象基类的概念

### 1、使用抽象基类

抽象基类的基本目的是测试一个对象是否符合某种身份

如何确定你正在处理的对象是列表：通过调用`isinstance`函数

```python
isinstance([],list)
```

    True

但是，在编码中不一定真的只能是列表，如果这样就丧失了动态语言的灵活性，有时候元组也可以，`isinstance`也提供支持

```python
isinstance([],(list,tuple))
```

    True

```python
isinstance((),(list,tuple))
```

    True

有时候，需要的对象是自定义的列表，此时可以使用`hasattr`函数

```python
hasattr([],'__getitem__')
```

    True

```python
hasattr(object(), '__getitem__')
```

    False

但是不仅仅列表拥有此方法，字典也拥有此方法，可能带来问题

### 2、声明虚拟子类

为了加强对代码的检查，需要声明虚拟子类

#### （1）样例

```python
import abc
class AbstractDict(metaclass=abc.ABCMeta):
    def foo(self):
        return None

AbstractDict.register(dict) #将dict作为此抽象基类的虚拟子类
print(isinstance({}, AbstractDict))

{}.foo()
```

    True

    ---------------------------------------------------------------------------

    AttributeError                            Traceback (most recent call last)

    <ipython-input-10-bc851b3e9ae4> in <module>()
          6 AbstractDict.register(dict) #将dict作为此抽象基类的虚拟子类
          7 print(isinstance({}, AbstractDict))
    ----> 8 {}.foo()

    AttributeError: 'dict' object has no attribute 'foo'

说明：

* 声明虚拟子类，不会给现有类对象添加方法
* 只是给现存类或则新定义的类强加了一个身份标示，在使用`isinstance`时，会得到期望的结果

#### （2）使用装饰器实现注册

```python
import abc
class MySequence(metaclass=abc.ABCMeta):
    pass

# 普通方式注册虚拟子类
class CustomListLikeClass(object):
    pass
MySequence.register(CustomListLikeClass)

# 装饰器方式python3.3
@MySequence.register
class CustomListLikeClass(object):
    pass

issubclass(CustomListLikeClass, MySequence)
```

    True

#### （3）使用`__subclasshook__`

例子：定义一个鸭子类型的基类

```python
import abc

class AbstractDuck(metaclass=abc.ABCMeta):
    @classmethod
    def __subclasshook__(cls, other):
        quack = getattr(other, 'quack', None)
        if callable(quack):
            return True
        return NotImplemented

class Duck(object):
    def quack(self):
        pass

class NotDuck(object):
    quack = 'foo'

print(issubclass(Duck, AbstractDuck))
print(issubclass(NotDuck, AbstractDuck))

AbstractDuck.register(NotDuck)
print(issubclass(NotDuck, AbstractDuck))
```

    True
    False
    True

说明

* 使用`__subclasshook__`可以批量检测鸭子类型
* `issubclass`执行过程中会调用`__subclasshook__`方法，返回其返回值
* `__subclasshook__`的优先级是高于register函数的，若其有明确的返回值（True或False），将不会检查register注册的类
* 当`__subclasshook__`返回`NotImplemented`时，将自动执行register检查

### 3、声明协议

抽象基类的另一个主要价值在于其具有声明协议的作用，类似于java中的接口

#### （1）其他现有方法

**使用`NotImplemented`实现**

构建一个类省去一个关键的方法，以便于该方法可以被子类是实现

```python
from datetime import datetime

class Task(object):
    """
    一个任务抽象类，子类必须实现`_run`方法
    """
    def __init__(self):
        self.runs = []
    def run(self):
        start = datetime.now()
        result = self._run()
        end = datetime.now()
        self.runs.append({
                'start': start,
                'end': end,
                'result': result,
            })
        return result
    def _run(self):
        raise NotImplementedError('Task subclasses must define '
                                    'a _run method.')

t = Task()
t.run()
```

    ---------------------------------------------------------------------------

    NotImplementedError                       Traceback (most recent call last)

    <ipython-input-25-ecf3f64a04f7> in <module>()
         22
         23 t = Task()
    ---> 24 t.run()

    <ipython-input-25-ecf3f64a04f7> in run(self)
          9     def run(self):
         10         start = datetime.now()
    ---> 11         result = self._run()
         12         end = datetime.now()
         13         self.runs.append({

    <ipython-input-25-ecf3f64a04f7> in _run(self)
         18         return result
         19     def _run(self):
    ---> 20         raise NotImplementedError('Task subclasses must define '
         21                                     'a _run method.')
         22

    NotImplementedError: Task subclasses must define a _run method.

**使用元类**

```python
from datetime import timezone
class TaskMeta(type):
    """A metaclass that ensures the presence of a _run method
    on any non-abstract classes it creates.
    """
    def __new__(cls, name, bases, attrs):
        # If this is an abstract class, do not check for a _run method.
        if attrs.pop('abstract', False):
            return super(TaskMeta, cls).__new__(cls, name, bases, attrs)

        # Create the resulting class.
        new_class = super(TaskMeta, cls).__new__(cls, name, bases, attrs)

        # Verify that a _run method is present and raise
        # TypeError otherwise.
        if not hasattr(new_class, '_run') or not callable(new__class.__run):
            raise TypeError('Task subclasses must define a _run method.')

        # Return the new class object.
        return new_class

class Task(metaclass=TaskMeta):
    """An abstract class representing a task that must run, and
    which should track individual runs and results.
    """
    abstract = True

    def __init__(self):
        self.runs = []

    def run(self):
        start = datetime.now(tz=timezone.utc)
        result = self._run()
        end = datetime.now(tz=timezone.utc)
        self.runs.append({
                'start': start,
                'end': end,
                'result': result,
            })
        return result

t = Task()
t.run()
```

    ---------------------------------------------------------------------------

    AttributeError                            Traceback (most recent call last)

    <ipython-input-31-a65ef3b9a38f> in <module>()
         41
         42 t = Task()
    ---> 43 t.run()

    <ipython-input-31-a65ef3b9a38f> in run(self)
         31     def run(self):
         32         start = datetime.now(tz=timezone.utc)
    ---> 33         result = self._run()
         34         end = datetime.now(tz=timezone.utc)
         35         self.runs.append({

    AttributeError: 'Task' object has no attribute '_run'

#### （2）抽象基类实现

抽象类实现的意义：

* 以上两种方法虽然可以实现，但是感觉上不够形式化，有点“即席”
* 使用抽象类更加正式，符合习惯

```python
class Task(metaclass=abc.ABCMeta):
    """一个抽象类，必须实现`_run`方法
    """
    def __init__(self):
        self.runs = []

    def run(self):
        start = datetime.now(tz=timezone.utc)
        result = self._run()
        end = datetime.now(tz=timezone.utc)
        self.runs.append({
                'start': start,
                'end': end,
                'result': result,
            })
        return result

    @abc.abstractmethod
    def _run(self):
        pass

t = Task()
```

    ---------------------------------------------------------------------------

    TypeError                                 Traceback (most recent call last)

    <ipython-input-32-361afa5398fe> in <module>()
         20         pass
         21
    ---> 22 t = Task()

    TypeError: Can't instantiate abstract class Task with abstract methods _run

```python
class Subtask(Task):
    pass

st = Subtask()
```

    ---------------------------------------------------------------------------

    TypeError                                 Traceback (most recent call last)

    <ipython-input-35-e93262e20bb3> in <module>()
          2     pass
          3
    ----> 4 st = Subtask()

    TypeError: Can't instantiate abstract class Subtask with abstract methods _run

```python
class OtherSubtask(Task):
    def _run(self):
        return 2+2

ost = OtherSubtask()
ost.run()
ost.runs
```

    [{'end': datetime.datetime(2017, 9, 29, 11, 11, 47, 769002, tzinfo=datetime.timezone.utc),
      'result': 4,
      'start': datetime.datetime(2017, 9, 29, 11, 11, 47, 768996, tzinfo=datetime.timezone.utc)}]

优点：

* 抽象类不可以被实例化，者更符合C++/Java的抽象类的实现
* 这个方法更加正式，实现起来更加简单

#### （3）抽象属性

在python2.6到python3.2中

```python
import abc
class AbstractClass(metaclass=abc.ABCMeta):
    @abc.abstractproperty
    def foo(self):
        pass
```

在python3.3及其以后

```python
import abc
class AbstractClass(metaclass=abc.ABCMeta):
    @property
    @abc.abstractmethod
    def foo(self):
        pass

class InvalidChild(AbstractClass):
    pass

ic = InvalidChild()
```

    ---------------------------------------------------------------------------

    TypeError                                 Traceback (most recent call last)

    <ipython-input-39-e743bf049d03> in <module>()
          9     pass
         10
    ---> 11 ic = InvalidChild()

    TypeError: Can't instantiate abstract class InvalidChild with abstract methods foo

```python
class InvalidChild(AbstractClass):
    def foo(self):
        return 'bar'

ic = InvalidChild()
ic.foo()
```

    'bar'

#### （4）抽象类或静态方法

python3.3之后实现抽象静态方法

```python
class AbstractClass(metaclass=abc.ABCMeta):
    @classmethod
    @abc.abstractmethod
    def foo(cls):
        return 42

class InvalidChild(AbstractClass):
    pass

print(InvalidChild.foo())
ic = InvalidChild()
```

    42

    ---------------------------------------------------------------------------

    TypeError                                 Traceback (most recent call last)

    <ipython-input-42-7b1065197bdd> in <module>()
          9
         10 print(InvalidChild.foo())
    ---> 11 ic = InvalidChild()

    TypeError: Can't instantiate abstract class InvalidChild with abstract methods foo

```python
class ValidChild(AbstractClass):
    @classmethod
    def foo(cls):
        return 'bar'

vc = ValidChild()
```

### 4、内置抽象基类

python3以后：

#### （1）只包含一个方法的抽象基类

* Callable (`__call__`)
* Container (`__contains__`)
* Hashable (`__hash__`)
* Iterable (`__iter__`)
* Sized (`__len__`)

所有包含这些方法的类都会自动作为该类的子类

```python
from collections.abc import Sized

class Foo(object):
    def __len__(self):
        return 42

issubclass(Foo, Sized)
```

    True

#### （2）可供集合使用的抽象基类

* `Sequence` 和 `MutableSequence` 类似于元组或列表，
    * `Sequence`：其虚拟子类有：list、tuple、set
        * `__getitem__` 和 `__len__` 是必须实现的抽象方法
        * 提供了一些方法如`__contains__`和`__iter__`
    * `MutableSequence`：即席可修改序列
        * 添加来了 `__setitem__` 和 `__delitem__`作为抽象方法
        * 提供了`append` 和 `pop`方法
* `Mapping`
* `Set`

**使用内置抽象基类**

可以使代码更加灵活和严格，带来类型上的好处

**其他的抽象基类**

numbers模块包含众多用于数字类型的抽象基类
