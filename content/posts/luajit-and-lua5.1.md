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

Lua 在众多领域使用广泛，如游戏等。本文主要面向学习和使用 OpenResty 开发者。因此本文介绍的 Lua 版本是 OpenResty 使用的， 兼容 Lua 5.1 语法 LuaJIT。

此外需要注意的是 OpenResty 使用的是其自己维护的 LuaJIT 的[分支](https://github.com/openresty/luajit2/tree/v2.1-agentzh)。

总体来看，在特性上：`OpenResty LuaJIT 分支 > LuaJIT > Lua 5.1`。

本文主要介绍是官方版本的 LuaJIT 的特性，没有特殊说明的表示是 Lua 5.1 的特性。如果是 LuaJIT 或 OpenResty 特有的将特殊说明。

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

### 保留字、符号、注释和字面量

`language/01-lexical.lua`

```lua
-- 保留字
--[[
    and       break     do        else      elseif
    end       false     for       function  if
    in        local     nil       not       or
    repeat    return    then      true      until     while
]]
-- 符号
--[[
    +     -     *     /     %     ^     #
    ==    ~=    <=    >=    <     >     =
    (     )     {     }     [     ]
    ;     :     ,     .     ..    ...
]]

print('逻辑运算符', true and false, true or false, not false)
print('数字运算', 1+1, 2-1, 2*3, 1/2, 5%2, 2^10)
print('# 字符串长度(字节数)', #'abc', #'中文')
print('.. 字符串拼接', 'abc' .. '中文')
print('关系运算符', 1 == 1, 1 == '1', 1 ~= 2, 1 <= 2, 1 >= 2, 1 < 2, 1 > 2)
A = 1 -- 赋值
print('() 优先级和函数参数传递', 1 + 2 * 3, (1 + 2) * 3)
T = {A='a', 'b'}
print('创建 table', type(T))
X = 1; Y = 2
print('; 结束一个语句', X, Y)
X, Y = Y, X
print(', 分割函数参数和多次赋值', X, Y)
print(". 访问 table 的指定值 T.A 等价于 T['A']", T.A, T['A'], T[1])
function MyPrint(...)
    print('MyPrint', ...)
end
MyPrint("... 变长参数", T.A, T['A'], T[1])


-- 短注释，以 -- 开头
--[[
    长注释，--紧接着长括号，本例中为 0 级长括号
]]
--[==[
    长注释，--紧接着长括号，本例中为 2 级长括号
]==]


-- 字面量: 字符串
print([[支持单引号，使用 \ 转义]], 'alo\n123"')
print([[支持双引号，使用 \ 转义]], "alo\n123\"")
print([[\数字字面量，转移 assic 码]], '\97lo\10\04923"')
print('[[ ]] 支持多行字符串（0 级长括号）',[[alo
123"]])

print('[==[ ]==] 支持多行字符串（可以有多个=号）（2 级长括号）', [==[
alo
123"]==])


-- 字面量: 数字
print('字面量: 数字', 3, 3.0, 3.1416, 314.16e-2, 0.31416E1, 0xff, 0x56)


-- 字面量: 表
print('表实现数组', { 1, 2, 3 })
print('表实现map', { a = 1, b = 2, c = 3 })
print('表实现map', { ['a'] = 1, ['b'] = 2, ['c'] = 3 })
print('表实现数组', { [1] = 'a', [2] = 'b', [3] = 'c' })
```

输出为：

```
逻辑运算符      false   true    true
数字运算        2       1       6       0.5     1       1024
# 字符串长度(字节数)    3       6
.. 字符串拼接   abc中文
关系运算符      true    false   true    true    false   true    false
() 优先级和函数参数传递 7       9
创建 table      table
; 结束一个语句  1       2
, 分割函数参数和多次赋值        2       1
. 访问 table 的指定值 T.A 等价于 T['A'] a       a       b
MyPrint ... 变长参数    a       a       b
支持单引号，使用 \ 转义 alo
123"
支持双引号，使用 \ 转义 alo
123"
\数字字面量，转移 assic 码      alo
123"
[[ ]] 支持多行字符串（0 级长括号）      alo
123"
[==[ ]==] 支持多行字符串（可以有多个=号）（2 级长括号） alo
123"
字面量: 数字    3       3       3.1416  3.1416  3.1416  255     86
表实现数组      table: 0x0108dd3520
表实现map       table: 0x0108dd35c8
表实现map       table: 0x0108dcb508
表实现数组      table: 0x0108dcac50
```

### 值、类型和作用域

## 参考

* [LuaJIT分支和标准Lua有什么不同？](https://blog.51cto.com/u_14861909/5441626)
* [开源项目Luajit是否有“死亡”的风险？](https://groups.google.com/g/OpenResty/c/0ftsRpgC5kE)
* [LuaJIT 如何发行？什么样的代码是稳定的？](https://github.com/LuaJIT/LuaJIT/issues/563)
* [LuaJIT 官方安装手册](http://luajit.org/install.html)。
* [Lua 5.1 参考手册（中文翻译）](https://www.codingnow.com/2000/download/lua_manual.html)
* [Lua 5.1 Reference Manual](https://www.lua.org/manual/5.1/)
* [OpenResty最佳实践 - Lua 入门](https://moonbingbing.gitbooks.io/openresty-best-practices/content/lua/main.html)
