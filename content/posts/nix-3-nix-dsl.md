---
title: "Nix 详解（三） nix 领域特定语言"
date: 2023-02-25T20:48:49+08:00
draft: true
toc: true
comments: true
tags:
  - untagged
---

> version: nix-2.14.1

## 概述

为了更好的描述一个包，从源码到制品的过程，nix 设计了一套领域特定语言（DSL），来声明一个包。这个语言就叫做 nix 语言。

nix 是一种特定领域的、纯函数式的、惰性求值的、动态类型的编程语言。

该语言主要的应用场景为：

* 定义一个 nix channel，之前文章多次提到的 nixpkgs 收录的超过 8 万个包，就是通过 nix 语言声明的。
* 在 `shell.nix` 中使用，正如之前文章所讲，其可以为一个项目定义一个可重现的隔离的开发环境。
* 在 NixOS 中，来定义操作系统环境，本系列不多赘述。

## Hello World

`nix-lang-demo/01-hello.nix`

```nix
let
  msg = "hello world";
in msg
```

运行代码，`nix-instantiate --eval nix-lang-demo/01-hello.nix`，输出如下：

```
"hello world"
```

除了直接运行一个 `.nix` 代码文件外。通过实验性的 `nix repl` 命令，可以打开一个 nix 交互式 shell，来交互式的执行 nix 表达式。

关于 `let in` 参见下文：[局部变量](#局部变量)

## 程序结构

和常规的命令式通用编程语言不同，nix 是一种声明式的表达式语言。

常规的 Go、Java、C 等编程语言，一个程序的入口是一个 main 函数。

在 nix 中，没有一个 main 函数。一个 nix 的程序就是 nix 提供的几种基本结构组合而成的表达式。

在执行一个正确的 nix 程序时，解释器最终会推导出一个且必须推导出一个值出来。这个值，必须是 nix 支持的几种数据类型之一，参见下文。

## 数据类型

nix 的数据类型类似于 JSON，可以分为基本数据类型、列表和属性集。

### 基本数据类型

* 字符串，支持多种表达方式。
    * `"string"` 双引号包裹的字符串，对于特殊字符需使用 `\` 转移，如： `\"`、`\$`、`\n`、`\r`、`\t`。该类字符串支持使用 `${}` 进行插值。和其他语言的 `""` 相比，在 nix 中，该类型字符串支持多行的写法。
    * `''string''` 两个单引号包裹的字符串，支持多行，该类字符串会自动删除每一行相同数目（这个数目为所有行中前导空格数最小的数目，如果第一行紧挨这`''`，则不参与统计）的前导空格。比如：

        ```nix
        ''
          This is the first line.
          This is the second line.
            This is the third line.
        ''
        ```

        等价于

        `"This is the first line.\nThis is the second line.\n  This is the third line.\n"`

        该类型字符串也支持 `${}`进行字符串插值。，对于特殊字符需使用 `''` 转移，如：

        * `'''` 等价于 `"''"`
        * `''$` 等价于 `"$"`
        * `\n` 等价于 `"\\n"`，`''\n` 等价于 `"\n"`
        * `\r` 等价于 `"\\r"`，`''\r` 等价于 `"\r"`
        * `\t` 等价于 `"\\t"`，`''\t` 等价于 `"\t"`

    * 双单引号字符串和双引号字符串相比，有更少的引用，且，在书写多行字符串时，代码格式化的缩进会自动去除，且，有更少的转移字符。因此，在写多行字符串时，建议使用双单引号格式。
    * 最后，符合 [RFC 2396](http://www.ietf.org/rfc/rfc2396.txt) 的 URL 可以不适用引号包裹，可以直接使用。

* 数字，支持且不区分整型和浮点型，格式如 `123`、`123.43`、`.27e13`
* 路径，如 `/bin/sh`、`./abc`、`abc/123`，包含一个斜杠的会被识别为路径类型。nix 会把这些路径都转换为绝对路径。

    nix 也支持 `~/abc` 这种写法。

    nix 还支持一种特殊写法，如 `<nixpkgs>`，nix 在 `NIX_PATH` 环境变量中查找指定名字的路径，当 `NIX_PATH` 不存在时，会在 `~/.nix-defexpr/channels` 中查找。

    路径可以作为字符串插值的符号，如 `"${./foo.txt}"`，针对这种情况，nix 会将路径对应文件或目录复制到 `"/nix/store/<hash>-foo.txt"` 中。（Nix 语言假定在计算 Nix 表达式时所有输入文件都将保持不变。例如，假设您在 nix repl 会话期间使用了内插字符串中的文件路径。稍后在同一会话中，更改文件内容后，再次使用文件路径评估内插字符串可能不会返回新的存储路径，因为 Nix 可能不会重新读取文件内容）

    除了 `<>` 语法外，路径也支持插值，注意，至少要有一个 `/` 出现在插值之前，才会被识别为路径。例如：`a.${foo}/b.${bar}` 会被识别为除法运算而不是路径，因此需要改为 `./a.${foo}/b.${bar}`。

* bool，可选值为 true 或 false。
* null，空值，表示 null。

### 函数类型

nix 语言是函数式的，其函数也是一种数据类型，也就是说 nix 的函数可以作为返回值，也可以作为变量。

因为函数可以在列表、属性集中使用，因此先介绍函数。

nix 函数的定义语法为: `函数参数: 函数体`，语义为：接收一个值作为一个参数，并返回值。函数调用方式为 `函数名 函数参数值`。例如：

```nix
let 
  addOne = x: x+1;
in addOne 1 # 返回 2
```

可以说，上面这句话，这就是 nix 函数的全部。但是基于此 nix 提供了一些和 Python 差不多强大的函数能力。

* 多参数函数。如：函数 f `x: y: x + y`，其实等价于 `x: (y: x + y)`，可以理解为，参数为 `x` 的函数返回了一个参数为 `y` 的函数，这个参数为 `y` 的函数返回 `x + y` 的值。调用方式为 `f 1 2`，其实等价于 `(f 1) 2`。
* 命名参数函数。示例如下：
    * 简单场景，函数 f `{a, b}: a + b`，本质上是一种语法糖，节本等价于 `x: x.a + x.b`。调用方式为 `f {a = 1; b = 2; }`，但是需要注意的是这种方式 nix 会对参数进行属性是否存在校验。也就是说调用时缺少（`f {a = 1;}`）或者多余（`f {a = 1; b = 2; c= 3;}` ）属性均会报错。
    * 属性默认值，函数 f `{a, b ? 0}: a + b`，`b ? 0`表示 b 的默认值为 0，调用时可以不传 b，如 `f {a = 1;}` 将返回 1。
    * 其他属性和命名属性，函数 f `args@{ a, b, ... }: a + b + args.b + args.c` 或 `{ a, b, ... }@args: a + b + args.b + args.c`。`...` 该函数调用时，允许传递了除了 a, b 之外的属性。`@args` 表示将整个属性集赋值给变量 `args`，在函数体中可以使用 args 访问整个属性集。`...` 和 `@` 一般同时出现，但这不是强制的。如下方式调用：
        * `f {a = 1; b = 2;}` 报错。
        * `f {a = 1; b = 2; c = 3;}` 返回 8。
        * `f {a = 1; b = 2; c = 3; d = 4;}` 返回 8。

### 列表

nix 通过方括号 `[]` 定义一个列表。和其他语言不通，列表中的元素通过空格而不是分割。

如： `[ 123 ./foo.nix "abc" (f { x = y; }) ]`，这个列表包含 4 个元素。第一个元素为数字、第二个元素为路径、第三个元素为字符串、第四个元素为调用函数 `f` 并获取结果（使用了小括号包裹）。

而对于 `[ 123 ./foo.nix "abc" f { x = y; } ]` 列表，包含 5 个元素。第四个元素为一个函数、第五个元素为属性集。

注意：数组的求值是惰性的，且是严格长度的。

### 属性集

nix 通过花括号 `{}` 定义一个属性集。属性集的每个元素（属性）为一个键值对，key 和 value 使用 `=` 分割，以 `;` 结尾。

如：

```nix
{
  x = 123;
  text = "Hello";
  y = f { bla = 456; };
}
```

该示例包含 3 个属性，分别是：值为数字的 x、值为字符串的 text、值为 f 函数返回值的 y。

属性集的属性通过点号 `.` 方式访问，如：`{ a = "Foo"; b = "Bar"; }.a`。

如果访问属性不存在时，取默认值，可以通过 `or` 实现，如：`{ a = "Foo"; b = "Bar"; }.c or "Xyzzy"`。

属性集的 Name 可以是任意字符串，如果是包含特殊字符可以使用 `."xxx"` 的方式访问，如：`{ "$!@#?" = 123; }."$!@#?"`。

属性的访问也支持插值，如：`let bar = "foo"; in { foo = 123; }.${bar}`，等价于 `{ foo = 123; }.foo`。

属性定义时其名字也支持插值，如：`let bar = "foo"; in { ${bar} = 123; }.foo`，等价于 `{ foo = 123; }.foo`。

属性定义是如果其名字插值的是一个 null，则不会将该属性添加到该属性即中（因为 null 无法转换为一个字符串），如：`{ ${null} = true; }` 等价于 `{}`。

属性集可以通过 `__functor` 属性名定义成一个函数，如：

```nix
let add = { __functor = self: x: x + self.x; };
    inc = add // { x = 1; };
in add 1
```

* 第一行，定义了一个 add 属性集，其 `__functor` 是属性是一个函数，该函数参数为 self 和 x，函数体为 `self.x + x`
* 第二行，使用 `{ x = 1; }` 更新（`//` 语法） add 属性集，其返回，赋值给变量 inc（注意这里的更新并不会影响 add 值自身，因为 nix 的值都是不可变的）。
* 第三行，将 inc 作为函数调用，参数为 1。此时，实际上调用了 `__functor` 函数。
* 利用该特性可以实现类似面向对象的效果。

默认情况下，定义一个属性集，属性之间是不能相互引用，如下将报错：

```nix
{
  y = 123;
  x = y;
}
```

通过，在花括号前添加 `rec`，表示声明一个递归属性集。此时，同一属性集内部的属性可以相互引用，如下不会报错：

```nix
rec {
  y = 123;
  x = y;
}
```

此外，递归属性集，属性的引用和顺序无关，如下不会报错：

```nix
rec {
  x = y;
  y = 123;
}
```

此外，在递归属性集中，如果引用的名字，在作用域内有同名的变量，且属性集内也有同名的属性，此时取属性集属性的值。如下：

```nix
let y = 456;
in rec {
  x = y;
  y = 123;
}
```

将返回： `{ x = 123; y = 123; }`。

## 变量

### 局部变量

nix 通过 `let in` 来创建一个作用域，并定义一批变量，如：

```
let
  a = 1;
  b = 2;
in
  a + b
```

如上写法等价于： `1 + 2`。

### 属性继承

当我们想构造一个属性集，并想将作用域中的某些属性作为该属性集的属性时，一般的写法如下：

```nix
let
  a = 1;
  b = 2;
in {
  a = a;
  b = b;
  c = 3;
}
```

nix 提供继承语法糖，可以将上述简化为形式：

```nix
let
  a = 1;
  b = 2;
in {
  inherit a b;
  c = 3;
}
```

inherit 还可以从一个属性集中继承几个属性，示例如下：

```nix
let
  a = 1;
  x = {
    b = 2;
    c = 3;
  };
in {
  inherit a;
  inherit (x) b c;
}
```

等价于：

```nix
let
  a = 1;
  x = {
    b = 2;
    c = 3;
  };
in {
  a = 1;
  b = x.b;
  c = x.c;
}
```

### with 表达式

类似于 python 的 with。通过 with 可以创建一个作用域，并将一个属性集中属性作为作用域中的变量。

示例如下：

```nix
with {
  a = 1;
  b = 2;
}; a + b
```

等价于：

```nix
let
  a = 1;
  b = 2;
in a + b
```

等价于：

```nix
let 
x = {
    a = 1;
    b = 2; 
  };
in with x;
a + b
```

## 流程控制

### 条件表达式

语法如下：

```
if e1 then e2 else e3
```

例如：

```
let x = 1;
in if x > 0 then "x > 0" else "x <= 1"
```

返回，  "x > 0"。

### 循环

nix 是个无副作用的函数式的表达式语言。因此，nix 没有命令式编程语言的 while 或者 for 循环。

一般情况，需要循环场景，就是对列表或者属性集进行转换。nix 可以通过内置高阶函数，如 `builtins.filter`、 `builtins.map`，来达到类似的效果。

## 错误处理

### 断言

通过 assert 可以检查某些条件是否成立，语法如下：

```nix
assert e1; e2
```

其中 e1 是一个可以计算为 bool 类型值的表达式。如果 e1 为 true，则返回 e2 的值，如果 e1 为 false，则停止计算，并打印调用栈信息。如：

* `assert true; 1` 将返回 1。
* `assert false; 1` 将报错。

### 抛出错误

nix 的错误抛出，由内置函数提供，语法如下：

```nix
builtins.throw s
```

抛出错误，如果上层没有处理，解释器会打印消息 `s`，并停止运行（评估）。

### 错误终止

nix 的错误终止，由内置函数提供，语法如下：

```nix
builtins.abort s
```

上层无法捕捉该异常，解释器会打印消息 `s`，并停止运行（评估）。

### 错误捕捉

nix 的错误捕捉，由内置函数提供，语法如下：

```nix
builtins.tryEval e
```

* 只能捕捉 `assert` 和 `builtins.throw` 产生的错误。
* 返回一个属性集，包含两个手机用：
    * `success` bool 类型，是否成功，如果捕捉到错误，则该属性为 `false`。
    * `value` 任意类型。
        * 如果 `success = false`，则该参数为 `false`，注意，不是错误消息（参见：[issue](https://github.com/NixOS/nix/issues/356)）。
        * 否者该参数 e 的值。

## 操作

> 参见：[Nix 手册 Operators](https://nixos.org/manual/nix/stable/language/operators.html#operators)

Nix 操作符和 C 语言的类似，区别是：

* nix 不支持 `:?`，类似效果的是 `if then else`。
* nix 不支持 `++`，`--`、`+=`、`-=` 等类似的涉及修改变量值的操作符。
* nix 支持的一些 C 语言没有的操作符：
    * `attrset ? attrpath`，返回 bool 值， 判断属性集中是否存在某个属性。
    * `list ++ list`，返回一个 list，两个 list 连接产生一个新的 list。
    * `string + string`，返回一个 string，字符串拼接。
    * `path + path`，返回一个 path，路径拼接（注意最终都会转换为绝对路径进行拼接，而不是路径 join）。
    * `path + string`，返回一个 path，路径拼接（两者先转换为字符串，然后直接拼接到一起，然后转换为一个路径）。
    * `string + path`，返回一个 string，路径拼接（path 路径必须存在，nix 会将该路径复制到 /nix/store 中，并将 string 和 `/nix/store/$hash-文件名` 拼接，并转换为字符串），比如 `"/abc" + ./README.md`，返回 `"/abc/nix/store/qmj08qmd1bb89g6wami4v2fq5ma4f42c-README.md"`。
    * `attrset // attrset` 使用后一个属性集更新到前一个属性集中（存在则覆盖），返回这个更新后的属性集。
    * `bool -> bool` 一种特殊的逻辑运算符，等价于 `!b1 || b2`，参见：[wiki](https://en.wikipedia.org/wiki/Truth_table#Logical_implication)。

## 内置常量和内置函数

* 内置常量：
    * `builtins`，包含内置函数的属性集。
    * `builtins.currentSystem`，如 `"i686-linux"` or `"x86_64-darwin"`。
* 已经添加到顶层作用域，无需通过 `builtins` 引用的内置函数：
    * `abort`，参见上文错误处理。
    * `baseNameOf s` 类似于 gnu 的 basename，去除路径的路径，返回文件名。
    * `break` In debug mode (enabled using --debugger), pause Nix expression evaluation and enter the REPL. Otherwise, return the argument v.
    * `derivation` nix 编译系统核心函数，参见下文：[推导](#推导-derivation)。
    * `derivationStrict` 没找到相关手册，只有一个相关 [issue](https://github.com/NixOS/nix/issues/7569)。
    * `dirOf s` 类似于 gnu 的 dirname，返回路径所在目录。
    * `fetchGit`、`fetchMercurial`、`fetchTarball`、`fetchTree`，参见下文：[fetch 相关函数](#fetch-相关函数)。
    * `fromTOML` 未找到相关文档。
    * `import` 参见下文：[导入其他文件](#导入其他文件)。
    * `isNull e` 判断是否是 null（此功能已弃用；使用 `e == null` 代替）。
    * `map f list` 转换一个列表，函数式编程的 map 原语。
    * `placeholder` 不太理解，参见：[原文](https://nixos.org/manual/nix/stable/language/builtins.html#builtins-placeholder)。
    * `removeAttrs set list` 从 set 中删除指定的属性。
    * `scopedImport` 未找到相关文档。
    * `throw` 参见上文错误处理。
    * `toString` 将值转换为字符串，一个属性集可以通过特殊属性 `__toString = self: ...;` 自定义 toString 格式。
* 其他内置函数，参见：[Nix 手册 - 内置函数](https://nixos.org/manual/nix/stable/language/builtins.html)。

## 导入其他文件

## fetch 相关函数

## 推导 (derivation)

https://www.zhihu.com/question/279855101/answer/2023496231

## 常见 shell.nix 分析

nix 执行 `shell.nix` 脚本（如果返回一个函数 `LAMBDA`，则使用 `{}` 调用该函数），产生一个非函数值，根据这个值启动一个 Shell。

## nixpkgs 分析

## 自定义 channel
