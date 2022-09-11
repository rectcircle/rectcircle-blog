---
title: "LuaJIT 和 Lua 5.1"
date: 2022-09-02T18:46:13+08:00
draft: true
toc: true
comments: true
tags:
  - untagged
---

https://github.com/rectcircle/lua-learn

https://techsingular.net/2015/03/22/%E4%B8%8D%E7%94%A8-lisp-%E5%AD%A6-lisp/

* 语法
* 模型 (表)
    * 栈
    * 环境
    * 元表
* 标准库

## 概述

Lua 在众多领域使用广泛，如游戏等。本文主要面向学习和使用 OpenResty 开发者。因此本文介绍的 Lua 版本是 OpenResty 使用的 Lua 解释器，是兼容 Lua 5.1 语法 LuaJIT。

此外需要注意的是 OpenResty 使用的是其自己维护的 LuaJIT 的[分支](https://github.com/openresty/luajit2/tree/v2.1-agentzh) （总体来看，在特性上：`OpenResty LuaJIT 分支 > LuaJIT > Lua 5.1`）。

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

## 特性

### 定位

Lua 是一个语法简单的，被定位为嵌入到 C 语言中，作为动态配置、数据处理等业务场景的脚本语言。

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

更多关于 function 的详细介绍，参见下文。

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

* Lua 的全局变量的作用域是整个程序，也就是说假如在一个函数中定一个了全局变量，在调用后，该变量在函数外面仍能够访问到。

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

### 流程控制

### 函数和方法

### 协程

### 元表

### env

### 模块

## 标准库

## 最佳实践

## 参考

* [LuaJIT分支和标准Lua有什么不同？](https://blog.51cto.com/u_14861909/5441626)
* [开源项目Luajit是否有“死亡”的风险？](https://groups.google.com/g/OpenResty/c/0ftsRpgC5kE)
* [LuaJIT 如何发行？什么样的代码是稳定的？](https://github.com/LuaJIT/LuaJIT/issues/563)
* [LuaJIT 官方安装手册](http://luajit.org/install.html)。
* [Lua 5.1 参考手册（中文翻译）](https://www.codingnow.com/2000/download/lua_manual.html)
* [Lua 5.1 Reference Manual](https://www.lua.org/manual/5.1/)
* [OpenResty最佳实践 - Lua 入门](https://moonbingbing.gitbooks.io/openresty-best-practices/content/lua/main.html)
