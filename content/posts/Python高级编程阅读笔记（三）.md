---
title: Python高级编程阅读笔记（三）
date: 2017-09-30T15:06:49+08:00
draft: false
toc: true
comments: true
aliases:
  - /detail/99
  - /detail/99/
tags:
  - python
---

## 八、字符串与Unicode

***

### 1、文本字符串与字节字符串

#### （1）Python3中的字符串数据

* 文本字符串类型为类型为`str`
* 字节字符串类型为`bytes`
* 两种类型不会进行隐式转换
    * 内容相同的`str`和`bytes`在逻辑上不相等
    * 字符串插值，也能有问题

```python
text_str = '这是一个文本字符串'
type(text_str)
```

    str

```python
byte_str = b'this is byte string'
type(byte_str)
```

    bytes

```python
# 将str转换为bytes
text_str.encode('utf-8')
```

    b'\xe8\xbf\x99\xe6\x98\xaf\xe4\xb8\x80\xe4\xb8\xaa\xe6\x96\x87\xe6\x9c\xac\xe5\xad\x97\xe7\xac\xa6\xe4\xb8\xb2'

```python
# 将bytes转换为str
byte_str.decode('utf-8')
```

    'this is byte string'

```python
# 是否相等
b'foo' == 'foo'
```

    False

```python
b'foo %s' % 'foo'
```

    ---------------------------------------------------------------------------

    TypeError                                 Traceback (most recent call last)

    <ipython-input-7-ea098828dc88> in <module>()
    ----> 1 b'foo %s' % 'foo'


    TypeError: %b requires bytes, or an object that implements __bytes__, not 'str'

```python
'foo %s' % b'foo'
```

    "foo b'foo'"

#### （2）python2 字符串

* 在Python2中，Python3中的`str`叫做`unicode`
* 在Python2中，Python3中的`bytes`叫做`str`
* 当两者混用，将会触发隐式转换，字节数组将转换为文本字符串
* 默认使用`ascii`编码

### 2、包含非ASCII字符的字符串

#### （1）观察区别

```python
# hello world的希腊文
text_str = 'Γεια σας, τον κόσμο.'
type(text_str)
```

    str

```python
# 尝试编码为ascii码字节数组
text_str.encode('ascii')
```

    ---------------------------------------------------------------------------

    UnicodeEncodeError                        Traceback (most recent call last)

    <ipython-input-11-78ff164e0408> in <module>()
          1 # 尝试编码为ascii码字节数组
    ----> 2 text_str.encode('ascii')

    UnicodeEncodeError: 'ascii' codec can't encode characters in position 0-3: ordinal not in range(128)

```python
# 尝试编码为utf-8
byte_str = text_str.encode('utf-8')
```

```python
print(len(text_str)) #表示实际的字母长度
print(len(byte_str)) #表示字节长度
```

    19
    34

#### （2）Unicode是ASCII的超集

ASCII的字符在Unicode中的表示形式是一致的

### 3、其他编码

常见的`ISO-8859`或者叫做`latin-1`也是`ASCII`的超集。但是编码之间是不兼容的，可能出现乱码或者报错

```python
text_str = 'El zorro marrón rápido saltó por encima ' + 'de los perros vagos.'
text_str.encode('utf-8')
text_str.encode('latin-1')

text_str.encode('utf-8').decode('latin-1')
text_str.encode('latin-1').decode('utf-8')
```

    ---------------------------------------------------------------------------

    UnicodeDecodeError                        Traceback (most recent call last)

    <ipython-input-16-bcc4bf65d67f> in <module>()
          4
          5 text_str.encode('utf-8').decode('latin-1')
    ----> 6 text_str.encode('latin-1').decode('utf-8')

    UnicodeDecodeError: 'utf-8' codec can't decode byte 0xf3 in position 13: invalid continuation byte

### 4、读取文件

#### （1）Python3

正常情况下，会自动解码。编码格式是通过获取操作系统的编码方式

```python
import locale
locale.getpreferredencoding()
```

    'UTF-8'

对于其他编码可以使用指定编码：

```python
with open('08字符串与Unicode.ipynb', 'r', encoding='utf-8') as f:
    text_str = f.read()

type(text_str)
```

    str

或者使用先读取字节，在进行解码的做法

```python
with open('08字符串与Unicode.ipynb', 'rb') as f:
    byte_str = f.read()

type(byte_str)
```

    bytes

#### （2）python2

在Python2中，无论如何返回的都是一个字节字符串

```python
with open('unicode.txt', 'r') as f:
    byte_str = f.read()
type(byte_str)
```

这需要自行解码

#### （3）读取其他源

读取数据库、从网络中读取、XML、JSON等，提供了很多库，这些库大多数返回文本字符串，编码可以自己指定

#### （4）指定Python文件的编码

在文件头添加：

```python
# -*- coding: utf-8 -*-
```

### 5、严格编码

严格编码指：当遇到无法解码的内容时报错，如：utf8编码

#### （1）不触发错误

指定严格编码不报错，使用处理函数

```python
text_str = 'Γεια σας, τον κόσμο.'
byte_str = text_str.encode('utf-8')
byte_str.decode('ascii', 'replace')
```

    '�������� ������, ������ ����������.'

```python
# 自定义错误处理函数
import codecs
def replace_with_underscore(err):
    length = err.end - err.start
    return ('_' * length, err.end)

codecs.register_error('replace_with_underscore', replace_with_underscore)
text_str = 'Γεια σας, τον κόσμο.'
byte_str = text_str.encode('utf-8')
byte_str.decode('ascii', 'replace_with_underscore')
```

    '________ ______, ______ __________.'

## 九、正则表达式

***

### 1、Python中的正则表达式

#### （1）相关模块

`re`

#### （2）相关方法和对象

* `re.search(reg, str)` 获取第一个匹配，返回`match`对象
* `re.match(reg, str)` 获取str的开头的第一个匹配，相当于正则表达式的`^`，返回`match`对象
* `re.findall(reg, str)`和`re.finditer(reg, str)` 获取所有匹配，返回字符串对象列表或者迭代器
* `match`对象

```python
import re
match = re.search(r'fox', 'The quick brown fox jumped…')
match.group()
```

    'fox'

```python
import re
re.findall(r'o', 'The quick brown fox jumped…')
```

    ['o', 'o']

### 2、基本正则表达式

#### （1）字符组

* 基本语法`[Pp]`，匹配，p或者P
* 区间`[a-zA-Z]`匹配大小写字母
* 取反`[^a-z]`匹配所有非小写字符
* 预定义字符组（快捷方式）
    * `\d` 匹配数字字符
    * `\s` 匹配空白字符
    * `\b` 匹配单词边界
    * 以上的取反形式为`\大写`
* 开始与结束`^字符`和`字符$` 表示匹配字符必须在待匹配字符串的首或者尾
* 任意字符`.`匹配除了`\n`之外的所有字符

#### （2）可选字符

`字符?`表示字符出现0或1次

#### （3）重复

* `字符{n}` 字符重复n次
* `字符{n, m}` 字符重复n~m次，贪婪的匹配
* `字符{n, m}?` 字符重复n~m次，惰性的匹配
* `字符{n,}` 字符最少重复n次
* `字符*` 字符出现0次或多次相当于`字符{0,,}`

### 3、分组

在匹配中提取部分数据

例如

```python
match = re.search(r'([\d]{3})-([\d]{4})', '867-5309 / Jenny')
match.groups()
```

    ('867', '5309')

整个正则表达式属于零分组，`group`函数有一个参数传递一个分组号，默认值是0

#### （2）命名分组

语法：在`(`后面添加`?P<group_name>`

```python
match = re.search(r'(?P<first_three>[\d]{3})-(?P<last_four>[\d]{4})', '867-5309')
print(match.groups())
print(match.group(1))
print(match.group('first_three'))
print(match.groupdict())
```

    ('867', '5309')
    867
    867
    {'first_three': '867', 'last_four': '5309'}

#### （3）引用已存在的分组

使用`\数字`引用已存在的分组，如：`\1`

```python
match = re.search(r'<([\w_-]+)>stuff</\1>', '<foo>stuff</foo>')
match.groups()
```

    ('foo',)

### 4、先行断言

基于内容之后的的东西是否存在来接收或者拒绝一个匹配

例如：`n(?!e)`表示匹配n后面不存在e的情况，但是匹配结果不包含n后面的字符

```python
re.search(r'n(?!e)', 'na')
```

    <_sre.SRE_Match object; span=(2, 3), match='n'>

```python
re.search(r'n(?!e)', 'n')
```

    <_sre.SRE_Match object; span=(0, 1), match='n'>

```python
re.search(r'n(?!e)', 'ne')
```

正向先行断言

例如：`n(?=e)`表示匹配n紧跟着e的情况，但是匹配结果不包含n后面的字符e

```python
 re.search(r'n(?=e)', 'ne')
```

    <_sre.SRE_Match object; span=(0, 1), match='n'>

```python
 re.search(r'n(?=e)', 'na')
```

```python
 re.search(r'n(?=e)', 'n')
```

### 5、标记

* 不区分大小写`re.IGNORECASE`别名`re.I`
* ASCII和Unicode标记`re.ASCII`和`re.UNICODE`别名`re.A`和`re.U`
* 匹配换行符`re.DOTALL`别名`re.S`
* 多行模式`re.MULTILINE`别名`re.M`，此时`^`表示为每一行的开头
* 详细模式`re.VERBOSE`允许使用#作为注释和空白忽略别名`re.X`
* 调试模式`re.DEBUG`输出调试信息 没有别名

例子：

```python
re.search(r'python', 'PYTHON IS AWESOME', re.IGNORECASE)
```

    <_sre.SRE_Match object; span=(0, 6), match='PYTHON'>

```python
re.search(r'.+', 'foo\nbar')
```

    <_sre.SRE_Match object; span=(0, 3), match='foo'>

```python
 re.search(r'.+', 'foo\nbar', re.DOTALL)
```

    <_sre.SRE_Match object; span=(0, 7), match='foo\nbar'>

```python
 re.search(r'ˆbar', 'foo\nbar')
```

```python
re.search(r'ˆbar', 'foo\nbar', re.MULTILINE)
```

```python
re.search(r"""(?P<first_three>[\d]{3}) # The first three digits
                -                      # A literal hyphen(?P<last_four>
                (?P<last_four>[\d]{4})               # The last four digits""", '867-5309', re.VERBOSE)
```

    <_sre.SRE_Match object; span=(0, 8), match='867-5309'>

```python
re.search(r'(?P<first_three>[\d]{3})-(?P<last_four>[\d]{4})', '867-5309', re.DEBUG)
```

    SUBPATTERN 1 0 0
      MAX_REPEAT 3 3
        IN
          CATEGORY CATEGORY_DIGIT
    LITERAL 45
    SUBPATTERN 2 0 0
      MAX_REPEAT 4 4
        IN
          CATEGORY CATEGORY_DIGIT

    <_sre.SRE_Match object; span=(0, 8), match='867-5309'>

使用多个标记`re.DOTALL | re.MULTILINE`或者`re.S | re.M.`

使用内联标记`(?别名)`

```python
re.search('(?i)FOO', 'foo').group()
```

    'foo'

### 6、替换

`re.sub(reg, repace, str)` 在字符串str，使用repace替换原字符串str中的模式

```python
# 普通的替换
re.sub('abc','123','abcdefabc')
```

    '123def123'

```python
# 在替换的字符串中使用分组
re.sub(r'(a)bc',r'\1 123','abcdef')
```

    'a 123def'

执行过程

* 先进行正则匹配，确定各个组的值
* 将用于替换的字符串中`\n`替换为真正的值
* 再将原字符串的0分组（匹配到的字符串）替换为上一步的值

### 7、已编译的正则表达式

正则表达式使用前需要编译，对于常用的正则表达式可以进行预编译

```python
reg = re.compile(r'abc')
```

该方法返回一个正则表达式对象，该对象包含以上所有方法，使用时省略第一个正则表达式字符串参数
