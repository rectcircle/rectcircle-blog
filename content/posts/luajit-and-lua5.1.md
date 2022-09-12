---
title: "LuaJIT 和 Lua 5.1"
date: 2022-09-02T18:46:13+08:00
draft: false
toc: true
comments: true
tags:
  - untagged
---

## 概述

Lua 在众多领域使用广泛，如游戏等。本文主要面向学习和使用 OpenResty 开发者。因此本文介绍的 Lua 版本是 OpenResty 使用的 Lua 解释器，是兼容 Lua 5.1 语法 LuaJIT。

此外需要注意的是 OpenResty 使用的是其自己维护的 LuaJIT 的[分支](https://github.com/openresty/luajit2/tree/v2.1-agentzh) （总体来看，在特性上：`OpenResty LuaJIT 分支 > LuaJIT > Lua 5.1`）。

示例代码参见 github： [rectcircle/lua-learn](https://github.com/rectcircle/lua-learn)

## 开发环境搭建

### 编译安装

```bash
git clone https://luajit.org/git/luajit.git
cd luajit
MACOSX_DEPLOYMENT_TARGET=12.5.1 make && sudo make install
sudo ln -sf luajit-2.1.0-beta3 /usr/local/bin/luajit
luajit --help
cd ..
rm -rf luajit
```

说明：

* [官方建议](https://github.com/LuaJIT/LuaJIT/issues/563)：始终使用 v2.1 分支的代码编译。
* Mac 编译需要 `MACOSX_DEPLOYMENT_TARGET` 环境变量，指向系统版本（系统偏好设置 > 软件更新查看）
* 本例使用的代码版本为： [03080b795aa3496ed62d4a0697c9f4767e7ca7e5](https://github.com/LuaJIT/LuaJIT/tree/03080b795aa3496ed62d4a0697c9f4767e7ca7e5)。
* 不使用 `PREFIX=/home/myself/lj2` 参数，将安装到 `/usr/local` 相关目录下。
* 卸载使用 `sudo make uninstall` 命令。

更多参见：[官方安装手册](http://luajit.org/install.html)。

### VSCode 扩展

* 语言服务器 [sumneko.lua](https://marketplace.visualstudio.com/items?itemName=sumneko.lua)。更多参见：官方 [wiki](https://github.com/sumneko/lua-language-server/wiki)。
* 调试器 [actboy168.lua-debug](https://marketplace.visualstudio.com/items?itemName=actboy168.lua-debug)。更多参见：官方 [wiki](https://github.com/actboy168/lua-debug/wiki)。

`cmd + ,`， 配置使用 luajit 版本：

```json
{
    "Lua.telemetry.enable": false,
    "Lua.runtime.version": "LuaJIT",
    "lua.debug.settings.luaVersion": "jit",
}
```

### 运行测试

`hello.lua`

```lua
print('hello')
```

* 方式 1：命令行执行 `luajit hello.lua`。
* 方式 2：VSCode 调试，按 `F5`。

## 语言特性

### 定位

Lua 是一个语法简单的，被定位为嵌入到 C 语言中，作为动态配置、数据处理等业务场景的脚本语言。

本部分仅介绍 Lua 语言自身的部分，不介绍 C 和 Lua 的交互。

### 注释

和 sql 语言类似，使用 `--` 开启一个注释。

```lua
-- 短注释，以 -- 开头
```

Lua 还支持一种长注释。`--[[内容支持换行]]` 或 `--[==[内容支持换行]==]`，这里的 `=` 可以有多个，只要能对的上，且长度匹配都可以。

```lua
--[[
    长注释，--紧接着长括号，本例中为 0 级长括号
]]
--[==[
    长注释，--紧接着长括号，本例中为 2 级长括号
]==]

```

### 类型和操作符

Lua 一共有 8 种数据类型，分别是： nil, boolean, number, string, function, userdata, thread, table。

下文将使用了两个内置函数介绍这 8 种数据类型：

* `print` 打印 0 到多个值到标准输出。
* `type` 获取一个值的类型名。

#### nil

nil 即空类型（和其他语言的 null/nil 类型），只有一种值 nil。

```lua
print(type(nil), nil)
-- nil     nil
```

#### boolean

boolean 值只有两种值 true、false。

```lua
print(type(true), true)
print(type(false), false)
-- boolean true
-- boolean false
```

和 Python 类似， Lua 采用 `and`、 `or`、 `not` 作为逻辑运算符。

```lua
print(true and false, true or false, not false)
-- false   true    true
```

#### number

number 类型，实现为双精度浮点数。

```lua
print(type(1.1), 1.1)
print(type(1), 1)
print('字面量: 数字', 3, 3.0, 3.1416, 314.16e-2, 0.31416E1, 0xff, 0x56)
-- number  1.1
-- number  1
-- 字面量: 数字    3       3       3.1416  3.1416  3.1416  255     86
```

和其他语言类似，Lua 支持 `+`、 `-`、 `*`、 `/`、 `%` 算数运算符，除此之外，Lua 还原生支持 `^` 次幂运算符。

```lua
print(1+1, 2-1, 2*3, 1/2, 5%2, 2^10)
-- 2       1       6       0.5     1       1024
```

同样， Lua 支持关系运算符， `==`、 `~=`、 `<=`、 `>=`、 `<`、 `>`。这里需要特别说明的是：不等于使用的时 `~=` 而不是常见的 `!=`。

```lua
print(1 == 1, 1 == '1', 1 ~= 2, 1 <= 2, 1 >= 2, 1 < 2, 1 > 2)
-- true    false   true    true    false   true    false
```

需要特别说明的时，Lua 并没有提供原生的位运算运算符，如需使用，可以搜索一些第三方库。

#### string

string 类型，即字节数组。需要特别说明的是 Lua 不关心 string 的字符集。

```lua
print(type('string'), 'string')
-- string  string
```

在 Lua 中，字符串字面量支持单引号、双引号以及长括号。长括号形如 `[[内容]]` 或 `[==[内容]==]`，这里的`内容`支持换行等任意特殊字符，`=`支持 0 个或多个。

```lua
print([[支持单引号，使用 \ 转义]], 'alo\n123"')
print([[支持双引号，使用 \ 转义]], "alo\n123\"")
print([[\数字字面量，转移 ascii 码]], '\97lo\10\04923"')
print('[[ ]] 支持多行字符串（0 级长括号）',[[alo
123"]])
print('[==[ ]==] 支持多行字符串（可以有多个=号）（2 级长括号）', [==[
alo
123"]==])

-- 支持单引号，使用 \ 转义 alo
-- 123"
-- 支持双引号，使用 \ 转义 alo
-- 123"
-- \数字字面量，转移 ascii 码      alo
-- 123"
-- [[ ]] 支持多行字符串（0 级长括号）      alo
-- 123"
-- [==[ ]==] 支持多行字符串（可以有多个=号）（2 级长括号） alo
-- 123"
```

#### function

Lua 本质上以一种长得很像 C 语言的函数式编程语言，因此 Lua 的函数也是第一公民，函数也是一种数据类型。

```lua
function Add(a, b)
    return a + b
end
print(type(Add), Add)
-- function        function: 0x010564a058
```

更多关于 function 的详细介绍，参见[下文](#函数)。

#### userdata

userdata 类型，该类型的具体类型由通过 C 语言定义，并提供 Lua 可以调用的相关函数。该数据类型涉及到与 C 语言互操作，本文不多介绍。

#### thread

thread 类型，即 coroutine，协同程序，协程。和操作系统线程相比相同点事，拥有独立的堆栈、局部变量、和指令指针。但是不同点在于：

* 协程切换只能通过代码来实现，而不是操作系统线程是由操作系统来控制。
* 协程是串行的，而不是并发的。

```lua
T = coroutine.create(function() print('thread running') end)
print(type(T), T)
coroutine.resume(T)
-- thread  thread: 0x01053a07e0
-- thread running
```

更多关于 thread 的详细介绍，参见下文。

#### table

table 类型，可以用来实现对应其他语言的 array 和 map 相同的能力。

```lua
print(type({}), {})
-- table   table: 0x010539e4c0
```

table 作为数组使用。

```lua
for i, v in ipairs({'a', 'b', 3}) do
    print(i, v)
end
-- 1       a
-- 2       b
-- 3       3

for i, v in ipairs({ a = 1, [0] = 'aa', [1] = 'bb', [2] = 'cc', [4] = 3 }) do
    print(i, v)
end
-- 1       bb
-- 2       cc
```

可以看出：

* table 作为数组使用时，下标是从 1 开始的，这和大多数主流编程语言都不一样。
* 在遍历数组时，如果 table 中，有数字非数字的，不是从 1 连续的，都会被忽略。
* 在遍历数组时，一定会按照从 1 开始从小到大依次遍历，因此可以使用 table.sort 对数组进行排序。

table 作为 map 使用。

```lua
for i, v in pairs({ a = 1, [0] = 'aa', [1] = 'bb', [2] = 'cc', [4] = 3 }) do
    print(i, v)
end
-- 0       aa
-- 1       bb
-- 2       cc
-- a       1
-- 4       3
```

需要特别说明的是，table 作为 map 时，遍历是 key 的顺序时不保证的，如需保证顺序，需转换为数组再排序。

table 元素的访问。

```lua
T = { a = 1, [1] = 'b', ['1c']= 2 }
print(T['a'], T[1], T['1c'])
print(T.a)
-- 1       b       2
-- 1
```

即支持两种模式：

* `T['a']` 中括号，支持访问任意元素。
* `T.a` 点号，只支持下标为符合 lua 标识符规则的元素，如上的 1 和 `1c` 都不行。

#### 自动类型转换

Lua 在进行 string 和 number 的操作时，会进行自动类型转换。

```lua
print(type(1 + "2"))  -- 自动转为数字
print(type(1 .. "2")) -- 自动转为字符串
-- number
-- string
```

当然，也可以手动进行转换

```lua
print(type(tonumber('1')))
print(type(tostring(1)))
-- number
-- string
```

#### `#` 运算符

可用于获取

* 字符串的字节长度。
* table 的 下标为数字 1 开始的连续的下标的最大值。

```lua
print(#'abc', #{1,2,3}, #{a=1, b=2}, #{a=1, b=2, 1, 2, 3}, #{[0]=0, [2]=2, [4]=4})
-- 3       3       0       3       4
-- 注意：这里最后一个实测返回 4，有些奇怪。
```

### 变量

Lua 的变量分为全局变量和局部变量。如下所示：

* 定义一个全局变量的方式为：`变量名 = 表达式`，表达式为必选。
* 定义一个局部变量的方式为：`local 变量名 = 表达式`，表达式为可选。

```lua
A = 1
local b = 2
local c
print(A, b, c)
-- 1       2       nil
```

关于 Lua 变量，需要注意的是：

* Lua 的全局变量的作用域是整个程序，也就是说，假如在一个函数中定一个了全局变量，在调用后，该变量在函数外面仍能够访问到。

    ```lua
    function F1()
        D1 = 1
    end
    F1()
    print(D1)
    -- 1
    ```

* Lua 的局部变量的表现和其他语言类似，脱离作用域后，将不存在。

    ```lua
    function F2()
        local d2 = 1
    end
    F2()
    print(d2)
        -- nil
    ```

* Lua 是动态类型的，也就是说，Lua 变量不会和类型绑定，不同类型的值可以复制给同一个变量。

    ```lua
    E = 1
    print(type(E), E)
    E = 'string'
    print(type(E), E)
        -- number  1
    -- string  string
    ```

* Lua 的同一个名字的局部变量可以定义多次，后面定义的会隐藏前面定义的。

### 流程控制

#### if elseif else

```lua
function IfNumber(i)
    if i > 0 then
        print('>0')
    elseif i < 0 then  -- 可选
        print('<0')
    else               -- 可选
        print('==0')
    end
end
IfNumber(1)
IfNumber(0)
IfNumber(-1)
-- >0
-- ==0
-- <0
```

#### while 和 until

```lua
local i = 0
while i < 10 do
    if i == 5 then
        break
    end
    print('while', i)
    i = i + 1
end

i = 0
repeat
    print('until', i)
    i = i + 1
until i >= 5

-- while   0
-- while   1
-- while   2
-- while   3
-- while   4
-- until   0
-- until   1
-- until   2
-- until   3
-- until   4
```

需要特别说明的是，Lua 不支持 continue。

#### for

数字循环 `for i = start, end, step do ... end`。

```lua
for i = 1, 3, 1 do  -- 起始(包括), 结束(包括), 步长(可以省略, 默认为 1)
    print('for-num', i)
end
-- for-num 1
-- for-num 2
-- for-num 3
```

table (数组) 通过 `ipairs` 函数返回的迭代器进行遍历。

```lua
for k, v in ipairs({ "one", "two", "three" }) do
    print('for-it', k, v)
end
-- for-it  1       one
-- for-it  2       two
-- for-it  3       three
```

以上等价于：

```lua
do
    local f, s, var = ipairs({ "one", "two", "three" })
    while true do
        local k, v = f(s, var)
        var = k
        if var == nil then break end
        print('for-mock', k, v)
    end
end
-- for-mock        1       one
-- for-mock        2       two
-- for-mock        3       three
```

table (map) 通过 `pairs` 函数返回的迭代器进行遍历。

```lua
for k, v in pairs({a=1, b=2, c=3}) do
    print('for-it', k, v)
end
-- for-it  c       3
-- for-it  a       1
-- for-it  b       2
```

### 函数

#### 函数定义

在 Lua 中，函数也是一种数据类型，因此也分全局和局部函数。

```lua
function GlobalAdd1(a, b) -- 全局函数（方式 1）
    return a + b
end
GlobalAdd2 = function(a, b) -- 全局函数（方式 2）
    return a + b
end

local function localAdd1(a, b) -- 局部函数（方式 1）
    return a + b
end
local localAdd2;
localAdd2 = function(a, b) -- 局部函数（方式 2）
    return a + b
end

print('add', GlobalAdd1(1, 1), GlobalAdd2(1, 1), localAdd1(1, 1), localAdd2(1, 1))

-- add     2       2       2       2
```

#### 定义到 table 中

```lua
local t1 = { name = "abc" }
function t1.PrintName1() -- 方式 1
    print("print t1.name 1", t1.name)
end
t1.PrintName2 = function() -- 方式 2
    print("print t1.name 2", t1.name)
end

t1.PrintName1()
t1.PrintName2()

-- print t1.name 1 abc
-- print t1.name 2 abc
```

#### 函数返回值

Lua 函数支持返回 0 到多个返回值。

```lua
local nilReturn = (function() return end)()
print("nil return", nilReturn)

function r() return 1, 2, 3 end

local rr1 = r()
print('返回多个值, 接收 1 个', rr1)
local rr1, rr2 = r()
print('返回多个值, 接收 2 个', rr1, rr2)
local rr1, rr2, rr3 = r()
print('返回多个值, 接收 3 个', rr1, rr2, rr3)

-- nil return      nil
-- 返回多个值, 接收 1 个   1
-- 返回多个值, 接收 2 个   1       2
-- 返回多个值, 接收 3 个   1       2       3
```

#### 函数参数

Lua 函数参数在调用时：

* 如果传递的参数少于函数声明的数目，则填充 nil。
* 如果传递的参数多余函数声明的数目，多余的将被忽略。
* 如果将一个函数的调用作为函数参数，且这个函数有多个返回值。
    * 如果函数调用作为函数的最后一个参数，则所有返回值都会作为参数都会传递。
    * 如果函数调用不是作为函数的最后一个参数，则之后将第一个返回值作为参数传递。

```lua
function r() return 1, 2, 3 end
function f(a, b, c) print('f(a, b, c) params:', a, b, c) end

f(3, 4)
f(3, 4, 5)
f(3, 4, 5, 6)
f(r())
f(r(), 10)
f(10, r())

-- f(a, b, c) params:      3       4       nil
-- f(a, b, c) params:      3       4       5
-- f(a, b, c) params:      3       4       5
-- f(a, b, c) params:      1       2       3
-- f(a, b, c) params:      1       10      nil
-- f(a, b, c) params:      10      1       2
```

Lua 支持可变参数 `...`。

* 在函数形参列表的最后可以通过 `...` 声明可变参数。
* 可以通过 `{...}` 将可变参数转换为一个 table (数组)。
* 可以通过 `unpack` 函数，将一个 table (数组) 作为可变参数进行传递。
* `...` 可以直接传递给其他函数的可变参数。
* 通过 `select` 函数可以获取可变参数的长度或者截取从 index 开始到之后的可变参数。

```lua
function r() return 1, 2, 3 end

function g(a, b, ...) print('params a, b, {...}, select(#, ...), #{select(2, ...)}, ... :', a, b, { ... }, select('#', ...), #{select(2, ...)}, ...) end

g(3)
g(3, 4)
g(3, 4, 5, 8)
g(5, r())
g(unpack({ 'a', 'b', 'c', 'd', 'e' }))
-- params a, b, {...}, select(#, ...), #{select(2, ...)}, ... :    3       nil     table: 0x010818d160     0       0
-- params a, b, {...}, select(#, ...), #{select(2, ...)}, ... :    3       4       table: 0x010818d6f8     0       0
-- params a, b, {...}, select(#, ...), #{select(2, ...)}, ... :    3       4       table: 0x010818d518     2       1       5       8
-- params a, b, {...}, select(#, ...), #{select(2, ...)}, ... :    5       1       table: 0x0108184c80     2       1       2       3
-- params a, b, {...}, select(#, ...), #{select(2, ...)}, ... :    a       b       table: 0x01081854f8     3       2       c       d       e
```

#### 方法

调用或定义 table 的一个函数时，可以使用 `:` 语法糖，以实现类似其他语言方法的能力：

* 定义时使用 `:`，则可以在函数体里面隐含一个 `self` 变量，指向调用者。
* 调用时使用 `:`，则会将调用对象作为参数传递到函数的第一个参数的位置。

```lua
local t2 = { total = 0 }
function t2:Add1(a) -- 语法糖，隐含一个 self 变量，等价于下方 t2
    self.total = self.total + a
end
function t2.Add2(self, a)
    self.total = self.total + a
end

t2:Add1(1) -- 语法糖，隐含一个 self 变量传递
t2.Add1(t2, 1)
t2:Add2(1) -- 语法糖，隐含一个 self 变量传递
t2.Add2(t2, 1)
print('t2.total = ', t2.total)
-- t2.total =      4
```

### 错误处理

#### 产生错误

通过 assert 或者 error 函数可以产生一个错误。如果没有捕捉的话，错误会中断整个程序的执行。

```lua
assert(1 == 1, '断言函数的消息, 如果第一个参数是 false, 则触发 error')
-- error (message [, level]) -- 抛出异常
```

#### 捕获错误

通过 pcall 和 xpcall 可以捕捉错误。

```lua
print('pcall has error', pcall(function() error("my error") end))
print('pcall success', pcall(function() return 1 end))
print('xpcall success', pcall(function() return 1 end, function(err) print(err) end))
print('xpcall 1', xpcall(function() error("my error") end, function(err) print(err) end))
print('xpcall 2', xpcall(function() error("my error") end, function(err) print(err) return err end))
-- pcall has error false   hello.lua:1: my error
-- pcall success   true    1
-- xpcall success  true    1
-- hello.lua:4: my error
-- xpcall 1        false   nil
-- hello.lua:5: my error
-- xpcall 2        false   hello.lua:5: my error
```

### 协程

#### 创建协程

通过 `coroutine.wrap` 和 `coroutine.create` 可以创建一个协程。

```lua
local cof1 = coroutine.wrap(function()
    print('coroutine.wrap called')
end)

local co1 = coroutine.create(function()
    print('coroutine.create called')
end)
```

#### 启动协程

通过 `coroutine.wrap` 创建的协程，可以通过函数调用的方式启动。

通过 `coroutine.create` 创建的协程，可以通过 `coroutine.resume` 方式启动。

```lua
cof1('cof1')
coroutine.resume(co1, 'co1')
-- coroutine.wrap called   cof1
-- coroutine.create called co1
```

#### 协程 yield 和 返回值

* 在协程内部，可以通过 `coroutine.yield` 函数：
    * 暂停该协程的执行。
    * 对该协程 `coroutine.resume` 的调用将返回，第一个返回值是 bool，表示协程是否没有发生错误。
        * 如果第一个返回值为 false，则第二个返回值为错误信息。
        * 如果第一个返回值为 true，第二个极其之后的返回值，是 `coroutine.yield` 函数传递的内容。
* 当协程函数返回后， 对该协程 `coroutine.resume` 的调用将返回，返回内容似乎协程函数的返回值。
* 对协程调用 `coroutine.resume` 时：
    * 如果协程没有启动过，`coroutine.resume` 的参数将作为协程函数的参数进行传递。
    * 如果协程启动过，并通过 `coroutine.yield` 暂停执行，`coroutine.resume` 的参数将作为 `coroutine.yield` 的返回值返回。

```lua
local co2 = coroutine.create(function(a, msg)
    print('[co2] a, msg: ', a, msg)
    local a3, msg3 = coroutine.yield(2, 'coroutine.yield 被调用')
    print('[co2] a3, msg3: ', a3, msg3)
    return 4, '返回'
end)

local ok2, a2, msg2 = coroutine.resume(co2, 1, 'coroutine.resume 第一次调用')
print('[main] ok2, a2, msg2: ', ok2, a2, msg2)
local ok4, a4, msg4 = coroutine.resume(co2, 3, 'coroutine.resume 第二次调用')
print('[main] ok4, a4, msg4: ', ok4, a4, msg4)
-- [co2] a, msg:   1       coroutine.resume 第一次调用
-- [main] ok2, a2, msg2:   true    2       coroutine.yield 被调用
-- [co2] a3, msg3:         3       coroutine.resume 第二次调用
-- [main] ok4, a4, msg4:   true    4       返回
```

#### 其他协程函数

* `coroutine.status(thread)` 获取给定协程对象的状态， dead, running, suspend, normal。
* `coroutine.running()` 获取当前函数所在协程对象，main 协程将返回 nil。

### 元表

在 Lua 中，8 种数据类型值的各种操作，如 + - * / . [] 等，都是通过一种称为 metatable 的机制实现的。

* 除了 userdata、table 类型外，其他每种类型的所有值，都共享一套内建的 metatable。
* userdata 和 table，每个对象（实例），都可以配置绑定一个自定义的 metatable。
* 只有 table 的 metatable 可以 Lua 代码更改，其他只能通过 C 语言修改。即通过 `function setmetatable(table: table, metatable?: table) -> table` 函数，可以设置一个 table 的元表。
    * table 参数，要自定义元表的 table 类型的值。
    * metatable 要给 table 绑定的元表，如果为 nil 表示清楚元表。
    * 返回 table 参数。

通过给 table 自定义 metatable ，可以实现类似 Python 、C++ 的运算符重载特性。

一个复数的例子如下所示：

```lua
function NewComplex(r, i)
    local o = { r = r, i = i }
    function o:print()
        print(r .. "+" .. i .. "i")
    end

    setmetatable(o, {
        __add = function(a, b)
            return NewComplex(a.r + b.r, a.i + b.i)
        end
    })
    return o
end

local a = NewComplex(1, 2)
local b = NewComplex(3, 4)
local c = a + b
c.print()
-- 4+6i
```

元表如果包含key `__metatable`，则表示：

* 如果某个 table 一旦绑定该元表，则不再允许通过 `setmetatable` 修改，如果修改，抛出错误。
* 通过 `getmetatable` 获取到的值为 `__metatable` 对应的 value。


```lua
D = {}
setmetatable(D, {})
setmetatable(D, { __metatable = "not allow change metatable" }) 
-- setmetatable(d, {})  -- 将报错
print(getmetatable(D)) -- 获取 metatable 只会返回 __metatable 的值。
-- not allow change metatable
```

上文介绍了元表 key `__add` 对应的是 `+` 运算符，Lua 中的所有运算符都有对应的 key，如 `.` 对应 `__index`，需要注意的是元表的 value 不一定是函数，也可能是其他类型，比如 `__index` 可以是函数也可以是 table。详细说明参见：[官方手册](https://www.lua.org/manual/5.1/manual.html#2.8)。

最后，元表除了可以实现运算符重载外，还可以对 table 的垃圾回收进行配置，更多参见：[官方手册](https://www.lua.org/manual/5.1/manual.html#2.10)。

### env

回顾一下上文的[变量](#变量)章节。 Lua 的变量，分为全局变量和局部变量。其中全局变量一旦被定义，则在后续的所有代码中，都可以通过该变量名直接访问。

实际上，在 Lua 中，全局变量（也包括全局函数标准库）实际上是存储在一个被称为 env 的 table 中的，全局变量名为该表的 key。每个函数都会和一张 env 表绑定。

* Lua 入口脚本可以理解为一个函数，Lua 解释器会在执行脚本前，创建一张 env 表，并和入口脚本绑定，这个 env 表中包含了标准库中的各种函数如 `print` 等，需要特别说明的是，这个 env 表中包含一个 `_G` 指向 env 表自身。
* 当在入口脚本定义一个函数时，Lua 会该函数的 env 设置为函数定义所在位置的函数绑定 env 表，也就是说当前函数和待调用函数共用一张 env 表。这就是为什么全局函数在函数中定义后，在函数调用结束后，任然可以访问的原因。
* 在函数中，可以通过 `getfenv` 获取当前函数绑定的 env 表，可以通过 `setfenv` 给当前函数设置一张新的 env 表。

描述调用一个全局函数的过程（以 `print("hello")` 为例）：

* 获取到当前函数绑定的 env 表，假设这个表为 `E`，后续操作等价于 `E.print("hello")`，即触发 `gettable_event` 的行为。
* 查找 `E` 中是否存在 key `print`，如果存在则直接返回并调用函数。否则继续执行后续流程。
* 获取 `E` 的 metatable 判断是否存在 key `__index`，如果存在
    * 如果是 table 类型，则对该 table 继续触发 `gettable_event` 行为。
    * 如果是函数类型，则返回 `__index(E, 'print')`。

```lua
function F1()
    E3 = 3
end

function Ef()
    print("C", C)
    -- 第一个参数和 getfenv 类似，第二个参数为要设置的表
    -- 可以通过 setmetatable 继承上层环境，形成类似链表的结构
    local newEnv = {}
    setmetatable(newEnv, { __index = getfenv(1) })
    setfenv(1, newEnv)
    E1 = 1 -- E1 不会逃逸到全局环境中了
    print("C", C) -- 会查找旧的环境
    print("getfenv", getfenv) -- 会递归的查找 _G
    F1()  -- F1 定义在顶层，所以 env 仍然是全局 env，所以在外层仍然存在
    function F2() -- 该函数定义在 newEnv ，所以 env 是 newEnv
        E4 = 4
    end
    F2()
    -- 环境表不设置 _G 的，则找不到全局变量和函数
    setfenv(1, { print = print })
    print("C", C) -- 可以看出已经找不到上层定义的 C 函数了。
    print("getfenv", getfenv) -- 可以看出已经找不到 getfenv 全局函数了。
    E2 = 2 -- E1 不会逃逸到全局环境中了
end

Ef()
print('E1', E1)
print('E2', E2)
print('E3', E3)
print('E4', E4)

-- C       nil
-- C       nil
-- getfenv function: builtin#10
-- C       nil
-- getfenv nil
-- E1      nil
-- E2      nil
-- E3      3
-- E4      nil
```

最后，需要特别说明的是：

* 从函数视角看，每个函数都会绑定一个 env 表。
* 函数默认 env 表的确定，发生在函数定义阶段，而非调用阶段。
* 通过 `setfenv(f: integer|fun(), table: table) -> function` 可以手动设置一个函数的 env 表。第一个参数为要配置的函数，可以函数或者数字，1 表示当前函数，2 表示调用当前函数的函数，以此类推。
* 同样的通过 `getfenv(f?: integer|fun()) -> table` 可以获取当前函数的 env 表。

### 模块和包

上文介绍的都是单个 Lua 脚本文件，Lua 也提供了模块和包相关能力，可以通过目录和文件来组织代码。

Lua 模块支持 C 语言编写的动态链接库和 Lua 脚本，本文仅介绍 Lua 脚本。

#### 动态执行代码

再介绍模块和包之前，先介绍 Lua 动态执行代码相关的能力。

Lua 是动态的解释型语言，因此也提供了在运行时执行，内容为 lua 代码的字符串或者文件的能力。

* `function dofile(filename?: string) -> ...any` 将执行 filename 文件的内容，并获取返回值。
* `function load(chunk: string|function, chunkname?: string, mode?: "b"|"bt"|"t", env?: table) -> function?, 2. error_message: string?` 加载一个代码块。如果 chunk 是一个字符串，代码块指这个字符串。 如果 chunk 是一个函数， load 不断地调用它获取代码块的片断。 每次对 chunk 的调用都必须返回一个字符串紧紧连接在上次调用的返回串之后。 当返回空串、nil、或是不返回值时，都表示代码块结束。最终，代码不会执行，而是封住到函数里面返回。
* `function loadstring(text: string, chunkname?: string) -> function?, error_message: string?` 将字符串作为 lua 代码到一个函数里面。
* `function loadfile(filename?: string, mode?: "b"|"bt"|"t", env?: table) -> function?, error_message: string?` 和 load 类似。

#### 模块定义

在 Lua 中，一个模块就是一个 lua 代码文件，可以通过如下方式导出函数或变量：

* 通过 `return` 导出。
* 全局变量 （不推荐）。

`08-module-declare/2.lua` 通过 return 导出变量。

```lua
local module = {}

-- 导出的函数
function module.PrintModule()
    print('my module 2')
end

-- 导出模块
return module
```

`08-module-declare/4_1.lua` 通过全局变量导出（方式 1），注意如果没有 `package.seeall`，将无法使用标准库相关函数，如 `print`。

```lua
module("mymod4_1", package.seeall) -- 等价于： 08-module-declare/4_2.lua

function PrintModule()
    print('my module 4_1')
end
```

`08-module-declare/4_2.lua` 通过全局变量导出（方式 2）。

```lua
mymod4_2 = {}
setmetatable(mymod4_2, {__index=getfenv(1)})
setfenv(1, mymod4_2)

function PrintModule()
    print('my module 4_2')
end
```

#### 导入模块

通过 `function require(modname: string) -> ...` 函数可以导入一个模块。 

* 参数为模块名，影响代码文件的搜索过程，参见下文。
* 返回值为模块代码的 `return` 语句的内容。


```lua
local mymod2 = require('08-module-declare.2')
mymod2.PrintModule()
require('08-module-declare.4_1')
mymod4_1.PrintModule()
require('08-module-declare.4_2')
mymod4_2.PrintModule()
-- my module 2
-- my module 4_1
-- my module 4_2
```

`require` 的执行过程如下所示：

* 依次调用 `package.loaders` 数组中的模块加载器函数（声明和 `require` 函数一致），默认情况包含 4 个加载函数。
    * 第 1 个加载器会从 `package.preload` 表中查找
    * 第 2 个加载器会从从 `package.path` 中查找对应的 lua 文件。
        * 如 `package.path = ./?.lua;/usr/local/share/luajit-2.1.0-beta3/?.lua;/usr/local/share/lua/5.1/?.lua;/usr/local/share/lua/5.1/?/init.lua`。
        * 此时，会将 require 参数的 `.` 替换为 `/` 然后替换 package.path 参数中的 ?，到对应的文件中去加载模块。
    * 第 3 个加载器会从 `package.cpath` 中查找对应的 C 动态库。并调用 `luaopen_` + 模块名最后一个 - 的后面的字符串并将 . 替换为 _（如 `a.v1-b.c` -> `luaopen_b_c`）。
    * 第 4 个加载器，如 `a.b.c` 模块，会搜索 `a` 库，并调用 `luaopen_a_b_c` 函数。
* 加载完成后，结果记录将到 `package.loaded[modname]` 中，下次再次 `require` 将直接从这个变量中取。
* 如果 reqire 找不到，将抛出错误。

## 标准库

标准库也是 Lua 语言的一部分，上文提到的函数实际上都是标准库的一部分，更多关于标准库的详解，参见：[官方手册](https://www.lua.org/manual/5.1/manual.html#5)。

## 高级用法

### 面相对象风格

Lua 原生没有提供面向对象的能力，但是可以通过元表实现类似的效果，一个示例如下：

```lua
-- 通过 table 和 metatable 实现面向对象

-- 类、抽象父类、子类、单继承、实例化。

-- 抽象父类
Shape = { type='none' }
function Shape:new(type) -- 父类构造函数
    local o = {type=type}
    setmetatable(o, { __index = Shape })
    return o
end
function Shape:print() -- 父类方法
    print("type: ", self.type , "area:", self:getArea())
end
function Shape:getArea() -- 待子类实现的方法
    error('no impl')
end

-- 子类
Rectangle = { length = 0, breadth = 0 }
setmetatable(Rectangle, { __index = Shape }) -- 继承父类
function Rectangle:new(length, breadth) -- 子类构造函数
    local o = Shape:new('Rectangle')
    o.length = length
    o.breadth = breadth
    setmetatable(o, { __index = Rectangle })
    return o
end
function Rectangle:getArea() -- 子类实现父类方法 getArea
    return self.length * self.breadth
end
function Rectangle:diagonal()  -- 子类自己的方法
    return (self.length^2 + self.breadth^2)^(0.5)
end
function Rectangle:print() -- 子类覆写方法 print
    print('length: ', self.length, 'breadth: ', self.breadth)
    Shape.print(self) -- 子类调用父类的方法
    print('and diagonal: ', self:diagonal())
end

-- 实例化
local r = Rectangle:new(3, 4)
r:print()
```

### 推荐的模块写法

定义模块

```lua
-- square.lua 长方形模块
local _M = {}           -- 局部的变量
_M._VERSION = '1.0'     -- 模块版本

local mt = { __index = _M }

function _M.new(self, width, height)
    return setmetatable({ width=width, height=height }, mt)
end

function _M.get_square(self)
    return self.width * self.height
end

function _M.get_circumference(self)
    return (self.width + self.height) * 2
end

return _M
```

导入模块

```lua
local square = require "square"

local s1 = square:new(1, 2)
print(s1:get_square())          --output: 2
print(s1:get_circumference())   --output: 6
```

更多参见：

* [抵制使用 module() 定义模块](https://moonbingbing.gitbooks.io/openresty-best-practices/content/lua/not_use_module.html)
* [module 是邪恶的](https://moonbingbing.gitbooks.io/openresty-best-practices/content/lua/module_is_evil.html)



## 参考

* [LuaJIT分支和标准Lua有什么不同？](https://blog.51cto.com/u_14861909/5441626)
* [开源项目Luajit是否有“死亡”的风险？](https://groups.google.com/g/OpenResty/c/0ftsRpgC5kE)
* [LuaJIT 如何发行？什么样的代码是稳定的？](https://github.com/LuaJIT/LuaJIT/issues/563)
* [LuaJIT 官方安装手册](http://luajit.org/install.html)。
* [Lua 5.1 参考手册（中文翻译）](https://www.codingnow.com/2000/download/lua_manual.html)
* [Lua 5.1 Reference Manual](https://www.lua.org/manual/5.1/)
* [OpenResty最佳实践 - Lua 入门](https://moonbingbing.gitbooks.io/openresty-best-practices/content/lua/main.html)
