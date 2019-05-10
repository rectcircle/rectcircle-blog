---
title: thrift
date: 2018-11-09T17:13:53+08:00
draft: false
toc: true
comments: true
aliases:
  - /detail/177
  - /detail/177/
tags:
  - 分布式
---

> [官网](http://thrift.apache.org/)
> [github](https://github.com/apache/thrift)

## 一、简介与安装

***

### 1、简介

一款开源跨语言RPC框架。

### 2、安装

[安装文档](http://thrift.apache.org/docs/install/)
[编译文档](http://thrift.apache.org/docs/BuildingFromSource)

安装的命令的作用是将定义文件`thrift`文件编译成其他语言的源文件

#### （1）osx

最新版本

```bash
brew install thrift
```

旧版：编译安装

#### （2）linux

依赖库

```bash
sudo apt-get install automake bison flex g++ git libboost-all-dev libevent-dev libssl-dev libtool make pkg-config
```

安装

```bash
./bootstrap.sh
./configure
make
make install
```

## 二、HelloWorld

### 1、创建.thrift文件

参见 [github](https://github.com/apache/thrift/blob/master/tutorial/)

shared.thrift

```thrift

namespace c_glib shared
namespace cpp shared
namespace d share // "shared" would collide with the eponymous D keyword.
namespace dart shared
namespace java shared
namespace perl shared
namespace php shared
namespace py shared
namespace haxe shared
namespace netcore shared

struct SharedStruct {
  1: i32 key
  2: string value
}

service SharedService {
  SharedStruct getStruct(1: i32 key)
}
```

tutorial.thrift

```thrift

namespace c_glib shared
namespace cpp shared
namespace d share // "shared" would collide with the eponymous D keyword.
namespace dart shared
namespace java shared
namespace perl shared
namespace php shared
namespace py shared
namespace haxe shared
namespace netcore shared

/**
 * Thrift lets you do typedefs to get pretty names for your types. Standard
 * C style here.
 */
typedef i32 MyInteger

/**
 * Thrift also lets you define constants for use across languages. Complex
 * types and structs are specified using JSON notation.
 */
const i32 INT32CONSTANT = 9853
const map<string,string> MAPCONSTANT = {'hello':'world', 'goodnight':'moon'}

/**
 * You can define enums, which are just 32 bit integers. Values are optional
 * and start at 1 if not supplied, C style again.
 */
enum Operation {
  ADD = 1,
  SUBTRACT = 2,
  MULTIPLY = 3,
  DIVIDE = 4
}

/**
 * Structs are the basic complex data structures. They are comprised of fields
 * which each have an integer identifier, a type, a symbolic name, and an
 * optional default value.
 *
 * Fields can be declared "optional", which ensures they will not be included
 * in the serialized output if they aren't set.  Note that this requires some
 * manual management in some languages.
 */
struct Work {
  1: i32 num1 = 0,
  2: i32 num2,
  3: Operation op,
  4: optional string comment,
}

/**
 * Structs can also be exceptions, if they are nasty.
 */
exception InvalidOperation {
  1: i32 whatOp,
  2: string why
}

/**
 * Ahh, now onto the cool part, defining a service. Services just need a name
 * and can optionally inherit from another service using the extends keyword.
 */
service Calculator extends shared.SharedService {

  /**
   * A method definition looks like C code. It has a return type, arguments,
   * and optionally a list of exceptions that it may throw. Note that argument
   * lists and exception lists are specified using the exact same syntax as
   * field lists in struct or exception definitions.
   */

   void ping(),

   i32 add(1:i32 num1, 2:i32 num2),

   i32 calculate(1:i32 logid, 2:Work w) throws (1:InvalidOperation ouch),

   /**
    * This method has a oneway modifier. That means the client only makes
    * a request and does not listen for any response at all. Oneway methods
    * must be void.
    */
   oneway void zip()

}

```

### 2、编译

以Python为例

```bahs
thrift --gen py tutorial.thrift
```

Python 要安装对应的库

```bash
pip install thrift
```

### 3、编写服务端

```python
# -*- coding: utf-8 -*-
#!/usr/bin/env python

import glob
import sys
sys.path.append('gen-py')

from thrift.server import TServer
from thrift.protocol import TBinaryProtocol
from thrift.transport import TTransport
from thrift.transport import TSocket
from shared.ttypes import SharedStruct
from tutorial.ttypes import InvalidOperation, Operation
from tutorial import Calculator


class CalculatorHandler:
    """服务Calculator的实现"""

    def __init__(self):
        self.log = {}

    def ping(self):
        print('ping()')

    def add(self, n1, n2):
        print('add(%d,%d)' % (n1, n2))
        return n1 + n2

    def calculate(self, logid, work):
        print('calculate(%d, %r)' % (logid, work))

        if work.op == Operation.ADD:
            val = work.num1 + work.num2
        elif work.op == Operation.SUBTRACT:
            val = work.num1 - work.num2
        elif work.op == Operation.MULTIPLY:
            val = work.num1 * work.num2
        elif work.op == Operation.DIVIDE:
            if work.num2 == 0:
                x = InvalidOperation()
                x.whatOp = work.op
                x.why = 'Cannot divide by 0'
                raise x
            val = work.num1 / work.num2
        else:
            x = InvalidOperation()
            x.whatOp = work.op
            x.why = 'Invalid operation'
            raise x

        log = SharedStruct()
        log.key = logid
        log.value = '%d' % (val)
        self.log[logid] = log

        return val

    def getStruct(self, key):
        print('getStruct(%d)' % (key))
        return self.log[key]

    def zip(self):
        print('zip()')


if __name__ == '__main__':
    # 创建实现类
    handler = CalculatorHandler()
    # 创建一个处理器
    processor = Calculator.Processor(handler)
    # 创建socket
    transport = TSocket.TServerSocket(host='127.0.0.1', port=9090)
    # 创建缓冲工厂
    tfactory = TTransport.TBufferedTransportFactory()
    # 创建传输协议工厂：使用二进制传输协议（当然还有json、压缩等）
    pfactory = TBinaryProtocol.TBinaryProtocolFactory()

    # 创建服务
    server = TServer.TSimpleServer(processor, transport, tfactory, pfactory)

    # You could do one of these for a multithreaded server
    # server = TServer.TThreadedServer(
    #     processor, transport, tfactory, pfactory)
    # server = TServer.TThreadPoolServer(
    #     processor, transport, tfactory, pfactory)

    print('Starting the server...')
    # 启动服务
    server.serve()
    print('done.')

```

### 4、编写测试客户端

```python
# -*- coding: utf-8 -*-
#!/usr/bin/env python

import sys
import glob
sys.path.append('gen-py')

from tutorial import Calculator
from tutorial.ttypes import InvalidOperation, Operation, Work

from thrift import Thrift
from thrift.transport import TSocket
from thrift.transport import TTransport
from thrift.protocol import TBinaryProtocol


def main():
    # Make socket
    # 创建socket
    transport = TSocket.TSocket('localhost', 9090)

    # Buffering is critical. Raw sockets are very slow
    # 缓冲是至关重要的。 原始套接字非常慢
    transport = TTransport.TBufferedTransport(transport)

    # Wrap in a protocol
    # 传输协议
    protocol = TBinaryProtocol.TBinaryProtocol(transport)

    # Create a client to use the protocol encoder
    # 创建一个客户端
    client = Calculator.Client(protocol)

    # Connect!
    # 打开连接
    transport.open()

    # 执行函数
    client.ping()
    print('ping()')

    sum_ = client.add(1, 1)
    print('1+1=%d' % sum_)

    work = Work()

    work.op = Operation.DIVIDE
    work.num1 = 1
    work.num2 = 0

    try:
        quotient = client.calculate(1, work)
        print('Whoa? You know how to divide by zero?')
        print('FYI the answer is %d' % quotient)
    except InvalidOperation as e:
        print('InvalidOperation: %r' % e)

    work.op = Operation.SUBTRACT
    work.num1 = 15
    work.num2 = 10

    diff = client.calculate(1, work)
    print('15-10=%d' % diff)

    log = client.getStruct(1)
    print('Check log: %s' % log.value)

    # Close!
    transport.close()


if __name__ == '__main__':
    try:
        main()
    except Thrift.TException as tx:
        print('%s' % tx.message)

```

## 三、thrift文件语法

***

时刻想着thrift就是一种中间声明语法，最终会被解释成各种编程语言的声明

### 1、基本数据类型

* bool        Boolean, one byte
* i8 (byte)   Signed 8-bit integer
* i16         Signed 16-bit integer
* i32         Signed 32-bit integer
* i64         Signed 64-bit integer
* double      64-bit floating point value
* string      String
* binary      Blob (byte array)
* `map<t1,t2>`  Map from one type to another
* `list<t1>`   Ordered list of one type
* `set<t1>`     Set of unique elements of one type

### 2、名字空间

对应编程语言的模块、包、名字空间

语法 ：

`namespace 目标语言 名字`

### 3、引入

`include 文件名`

默认会在当前 目录搜索，可以使用 `-I` 指定搜索路径

### 4、复合数据类型

#### （1）枚举

```thrift
enum Operation {
  ADD = 1,
  SUBTRACT = 2,
  MULTIPLY = 3,
  DIVIDE = 4
}
```

#### （2）结构

```thrift
struct Work {
  1: i32 num1 = 0,
  2: i32 num2,
  3: Operation op,
  4: optional string comment,
}
```

* 每一条目由`整数标识符: 类型 名字`构成
* 可选的`optional`和默认值

#### （3）异常

```thrift
exception InvalidOperation {
  1: i32 whatOp,
  2: string why
}
```

类似于结构

### 5、服务

类似于接口，支持继承，内部由函数组成

```thrift
service SharedService {
}
```

### 6、函数

只能写在服务里面，语法类c

```thrift
   void ping(),

   i32 add(1:i32 num1, 2:i32 num2),

   i32 calculate(1:i32 logid, 2:Work w) throws (1:InvalidOperation ouch),

   /**
    * This method has a oneway modifier. That means the client only makes
    * a request and does not listen for any response at all. Oneway methods
    * must be void.
    */
   oneway void zip()
```

* `返回值 函数名(整数标识符:类型 变量名, ...)`
* 可选抛出异常`throws (整数标识符:类型 异常名)`
* `void`类型可选添加`oneway`修饰，表示将客户端发出后不等待返回

### 7、其他

#### （1）typedef

类似C语言给类型创建别名

`typedef i32 MyInteger`

#### （2）常量

`const 类型 常量名 = 字面量`

```thrift
const i32 INT32CONSTANT = 9853
const map<string,string> MAPCONSTANT = {'hello':'world', 'goodnight':'moon'}
```
