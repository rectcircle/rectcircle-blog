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
    * `''string''` 两个单引号包裹的字符串，支持多行，该类字符串会自动删除每一行相同数目（这个数目为所有行中前导空格数最小的数目）的前导空格。比如：

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
* 路径，如 `/bin/sh`、`./abc`、`abc/123`，包含一个斜杠的会被识别为路径类型。nix 会把这些路径都转换为绝对路径，注意 nix 中的相对路径都是相对于 `.nix` 源代码文件的。

    nix 也支持 `~/abc` 这种写法。

    nix 还支持一种特殊写法，如 `<nixpkgs>`，nix 在 `NIX_PATH` 环境变量中查找指定名字的路径，当 `NIX_PATH` 不存在时，会在 `~/.nix-defexpr/channels` 中查找。

    路径可以作为字符串插值的符号，如 `"${./foo.txt}"`，针对这种情况，nix 会将路径对应文件或目录复制到 `"/nix/store/<hash>-foo.txt"` 中。（Nix 语言假定在计算 Nix 表达式时所有输入文件都将保持不变。例如，假设您在 nix repl 会话期间使用了内插字符串中的文件路径。稍后在同一会话中，更改文件内容后，再次使用文件路径评估内插字符串可能不会返回新的存储路径，因为 Nix 可能不会重新读取文件内容）

    除了 `<>` 语法外，路径也支持插值，注意，至少要有一个 `/` 出现在插值之前，才会被识别为路径。例如：`a.${foo}/b.${bar}` 会被识别为除法运算而不是路径，因此需要改为 `./a.${foo}/b.${bar}`。

    注意，通过 `nix-instantiate --eval` 执行文件时，如果使用 `--strict` 启用严格模式，则需要保证所有的 PATH 都必须存在，且 nix 会将这些文件或目录复制到 `/nix/store` 中，路径变量的值将变为 `/nix/store/$hash-$name`。

* bool，可选值为 true 或 false。
* null，空值，表示 null。

完整示例 (`nix-lang-demo/02-primitives-data-type.nix`)。

```nix
# nix-env -iA nixpkgs.jq # 为了更好的展示结果，使用 jq 进行结果格式化展示。
# nix-instantiate --eval nix-lang-demo/02-primitives-data-type.nix --strict --json | jq
let
  a = "1";
in {
  demo_01_str_double_quotes = "foo bar \r \t \n \\ \${";
  demo_02_str_with_string_interpolation = "a: ${a}";
  demo_03_str_two_single_quotes = ''
    line1
    line2
    \r \n \t \
    ''\r ''\t ''\n ''' ''${
    a: ${a}
    '';

  demo_04_str_url = https://rectcircle.cn;
  demo_05_num_int = 1;
  demo_06_num_float = 1.1;
  demo_07_num_e = .27e13;

  demo_08_path_abs_path = /bin/sh;
  demo_09_path_rel_path1 = ./demopath/a;
  demo_10_path_rel_path2 = demopath/a;
  demo_11_path_home_path = ~/.bashrc;

  demo_12_bool_true = true;
  demo_13_bool_false = false;

  demo_14_null = null;
}
```

执行代码 `nix-env -iA nixpkgs.jq && nix-instantiate --eval nix-lang-demo/02-primitives-data-type.nix --strict --json | jq`，输出如下：

```json
{
  "demo_01_str_double_quotes": "foo bar \r \t \n \\ ${",
  "demo_02_str_with_string_interpolation": "a: 1",
  "demo_03_str_two_single_quotes": "line1\nline2\n\\r \\n \\t \\\n\r \t \n'' ${\na: 1\n",
  "demo_04_str_url": "https://rectcircle.cn",
  "demo_05_num_int": 1,
  "demo_06_num_float": 1.1,
  "demo_07_num_e": 2700000000000,
  "demo_08_path_abs_path": "/nix/store/9wk86jmq024g8yb40wh4y5znkh1dix8y-sh",
  "demo_09_path_rel_path1": "/nix/store/w996igw5fhzp5pmk8g9bfv99is99b0ap-a",
  "demo_10_path_rel_path2": "/nix/store/w996igw5fhzp5pmk8g9bfv99is99b0ap-a",
  "demo_11_path_home_path": "/nix/store/x1znix2cdfg9fnmgvkdda19n28jphdm7-.bashrc",
  "demo_12_bool_true": true,
  "demo_13_bool_false": false,
  "demo_14_null": null
}
```

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

完整示例 (`nix-lang-demo/03-func-data-type.nix`)。

```nix
# nix-env -iA nixpkgs.jq # 为了更好的展示结果，使用 jq 进行结果格式化展示。
# nix-instantiate --eval nix-lang-demo/03-func-data-type.nix --strict --json | jq
let
  addOne = x: x+1;
  add = x: y: x + y;
  addTwo = add 2;
  addAttrs = {x, y}: x + y;
  addAttrsYDefault2 = {x, y?2}: x + y;
  addAttrsAtAndRemaining = attrs@{x, y, ...}: x + attrs.y + attrs.z;
in {
  demo_01_add_one_2 = addOne 2;
  demo_02_add_1_2 = add 1 2;
  demo_03_add_two_1 = addTwo 1;
  demo_04_add_attrs_x1_y2 = addAttrs { x = 1; y = 2; };
  demo_05_add_attrs_y_default2_x1 = addAttrsYDefault2 { x = 1; };
  demo_06_add_attrs_at_and_remaining_x_1_y_1_z_1_q_3 = addAttrsAtAndRemaining { x = 1; y = 1; z = 1; q = 3; };
}
```

执行代码 `nix-env -iA nixpkgs.jq && nix-instantiate --eval nix-lang-demo/03-func-data-type.nix --strict --json | jq`，输出如下：

```json
{
  "demo_01_add_one_2": 3,
  "demo_02_add_1_2": 3,
  "demo_03_add_two_1": 3,
  "demo_04_add_attrs_x1_y2": 3,
  "demo_05_add_attrs_y_default2_x1": 3,
  "demo_06_add_attrs_at_and_remaining_x_1_y_1_z_1_q_3": 3
}
```

### 列表

nix 通过方括号 `[]` 定义一个列表。和其他语言不通，列表中的元素通过空格而不是分割。

如： `[ 123 ./foo.nix "abc" (f { x = y; }) ]`，这个列表包含 4 个元素。第一个元素为数字、第二个元素为路径、第三个元素为字符串、第四个元素为调用函数 `f` 并获取结果（使用了小括号包裹）。

而对于 `[ 123 ./foo.nix "abc" f { x = y; } ]` 列表，包含 5 个元素。第四个元素为一个函数、第五个元素为属性集。

注意：数组的求值是惰性的，且是严格长度的。

完整示例 (`nix-lang-demo/04-list-data-type.nix`)。

```nix
# nix-env -iA nixpkgs.jq # 为了更好的展示结果，使用 jq 进行结果格式化展示。
# nix-instantiate --eval nix-lang-demo/04-list-data-type.nix --strict --json | jq
let
  addAttrs = { x, y }: x + y;
  demo_01_list_1 = [ 123 demopath/a "abc" (addAttrs { x = 1; y = 2; }) ];
  demo_01_list_2 = [ 123 demopath/a "abc" addAttrs { x = 1; y = 2; } ];
in
{
  demo_01_list_1 = demo_01_list_1;
  demo_01_list_2_len = builtins.length demo_01_list_2;
}
```

执行代码 `nix-env -iA nixpkgs.jq && nix-instantiate --eval nix-lang-demo/03-func-data-type.nix --strict --json | jq`，输出如下：

```json
{
  "demo_01_list_1": [
    123,
    "/nix/store/w996igw5fhzp5pmk8g9bfv99is99b0ap-a",
    "abc",
    3
  ],
  "demo_01_list_2_len": 5
}
```

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

完整示例 (`nix-lang-demo/05-attrs-data-type.nix`)。

```nix
# nix-env -iA nixpkgs.jq # 为了更好的展示结果，使用 jq 进行结果格式化展示。
# nix-instantiate --eval nix-lang-demo/05-attrs-data-type.nix --strict --json | jq
let
  bKey = "b";
  dKey = "d";
  demo_01_define = {
    a = 1;
    b = "b";
    "$!@#?" = 123;
    ${dKey} = 4;
    ${null} = true;
  };
  demo_02_access = {
    a = demo_01_define.a;
    b = demo_01_define.${bKey};
    c = demo_01_define.c or "c not exist";
    "$!@#?" = demo_01_define."$!@#?";
    d = demo_01_define.d;
  };

  callable_attr_define = { __functor = self: x: x + self.x; };
  demo_03_callable_attr_object = callable_attr_define // { x = 1; };

  demo_04_rec_attr1 = rec {
    y = 123;
    x = y;
  };
  y = 456;
  demo_05_rec_attr2 = rec {
    x = y;
    y = 123;
  };
in
{
  demo_01_define = demo_01_define;
  demo_02_access = demo_02_access;
  demo_03_call_attr = demo_03_callable_attr_object 2;
  demo_04_rec_attr1 = demo_04_rec_attr1;
  demo_05_rec_attr2 = demo_05_rec_attr2;
}
```

执行代码 `nix-env -iA nixpkgs.jq && nix-instantiate --eval nix-lang-demo/05-attrs-data-type.nix --strict --json | jq`，输出如下：

```json
{
  "demo_01_define": {
    "$!@#?": 123,
    "a": 1,
    "b": "b",
    "d": 4
  },
  "demo_02_access": {
    "$!@#?": 123,
    "a": 1,
    "b": "b",
    "c": "c not exist",
    "d": 4
  },
  "demo_03_call_attr": 3,
  "demo_04_rec_attr1": {
    "x": 123,
    "y": 123
  },
  "demo_05_rec_attr2": {
    "x": 123,
    "y": 123
  }
}
```

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

### 示例

`nix-lang-demo/06-var.nix`

```nix
# nix-env -iA nixpkgs.jq # 为了更好的展示结果，使用 jq 进行结果格式化展示。
# nix-instantiate --eval nix-lang-demo/06-var.nix --strict --json | jq

let 
  a = 1;
  b = 2;
  attrs1 = {
    x = 3;
    y = 4;
  };
  attrs2 = {
    m = 5;
    n = 6;
  };
in with attrs2;
{
  inherit a b;
  inherit (attrs1) x y;
  m = m;
  inherit n;
}
```

执行代码 `nix-env -iA nixpkgs.jq && nix-instantiate --eval nix-lang-demo/06-var.nix --strict --json | jq`，输出如下：

```json
{
  "a": 1,
  "b": 2,
  "m": 5,
  "n": 6,
  "x": 3,
  "y": 4
}
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
in if x > 0 then "x > 0" else "x <= 0"
```

返回，  "x > 0"。

### 循环

nix 是个无副作用的函数式的表达式语言。因此，nix 没有命令式编程语言的 while 或者 for 循环。

一般情况，需要循环场景，就是对列表或者属性集进行转换。nix 可以通过内置高阶函数，如 `builtins.filter`、 `builtins.map`，来达到类似的效果。

### 示例

`nix-lang-demo/07-flow-control.nix`

```nix
# nix-env -iA nixpkgs.jq # 为了更好的展示结果，使用 jq 进行结果格式化展示。
# nix-instantiate --eval nix-lang-demo/07-flow-control.nix --strict --json | jq
let
  x = 1;
  l = [1 2 3 4 5 6];
  filter = builtins.filter;
  map = builtins.map;
in {
  demo_01_x_great_than_0 = if x > 0 then "x > 0" else "x <= 0";
  demo_02_l_filter_map = map (e: e * 2) (filter (e: e<=3) l);
}
```

执行代码 `nix-env -iA nixpkgs.jq && nix-instantiate --eval nix-lang-demo/07-flow-control.nix --strict --json | jq`，输出如下：

```json
{
  "demo_01_x_great_than_0": "x > 0",
  "demo_02_l_filter_map": [
    2,
    4,
    6
  ]
}
```

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

### 示例

`nix-lang-demo/08-err-handle.nix`

```nix
# nix-env -iA nixpkgs.jq # 为了更好的展示结果，使用 jq 进行结果格式化展示。
# nix-instantiate --eval nix-lang-demo/08-err-handle.nix --strict --json | jq
let
  divide = a: b: assert b !=0 ; a / b;
  throw_err = msg: builtins.throw msg;
  abort_err = msg: builtins.abort msg;
in {
  demo_01_4_div_2 = divide 4 2;
  demo_02_try_4_div_0 = builtins.tryEval (divide 4 0);
  demo_03_try_4_div_2 = builtins.tryEval (divide 4 2);
  demo_04_try_throw_err = builtins.tryEval (throw_err "err");
  # demo_05_try_abort_err = builtins.tryEval (abort_err "err"); # abort 无法捕捉
  # demo_06_try_builtins_4_div_0 = builtins.tryEval (4 / 0); # 除 0 无法捕捉
}
```

执行代码 `nix-env -iA nixpkgs.jq && nix-instantiate --eval nix-lang-demo/08-err-handle.nix --strict --json | jq`，输出如下：

```json
{
  "demo_01_4_div_2": 2,
  "demo_02_try_4_div_0": {
    "success": false,
    "value": false
  },
  "demo_03_try_4_div_2": {
    "success": true,
    "value": 2
  },
  "demo_04_try_throw_err": {
    "success": false,
    "value": false
  }
}
```

## 操作

> 参见：[Nix 手册 Operators](https://nixos.org/manual/nix/stable/language/operators.html#operators)

Nix 操作符和 C 语言的类似，区别是：

* nix 不支持 `:?`，类似效果的是 `if then else`。
* nix 不支持 `++`，`--`、`+=`、`-=` 等类似的涉及修改变量值的操作符。
* nix 支持的一些 C 语言没有的操作符：
    * `attrset ? attrpath`，返回 bool 值， 判断属性集中是否存在某个属性。attrpath 支持 `a.b.c` 格式。
    * `list ++ list`，返回一个 list，两个 list 连接产生一个新的 list。
    * `string + string`，返回一个 string，字符串拼接。
    * `path + path`，返回一个 path，路径拼接（注意最终都会转换为绝对路径进行拼接，而不是路径 join）。
    * `path + string`，返回一个 path，路径拼接（两者先转换为字符串，然后直接拼接到一起，然后转换为一个路径）。
    * `string + path`，返回一个 string，路径拼接（path 路径必须存在，nix 会将该路径复制到 /nix/store 中，并将 string 和 `/nix/store/$hash-文件名` 拼接，并转换为字符串），比如 `"/abc" + ./README.md`，返回 `"/abc/nix/store/qmj08qmd1bb89g6wami4v2fq5ma4f42c-README.md"`。
    * `attrset // attrset` 使用后一个属性集更新到前一个属性集中（存在则覆盖），返回这个更新后的属性集。
    * `bool -> bool` 一种特殊的逻辑运算符，等价于 `!b1 || b2`，参见：[wiki](https://en.wikipedia.org/wiki/Truth_table#Logical_implication)。

完整示例 (`nix-lang-demo/09-operators.nix`)。

```nix
# nix-env -iA nixpkgs.jq # 为了更好的展示结果，使用 jq 进行结果格式化展示。
# nix-instantiate --eval nix-lang-demo/09-operators.nix --strict --json | jq
let
  attrs1 = {
    x = 1;
  };
  list1 = [1 2];
  list2 = [3 4];
in
{
  demo_01_attrs1_has_x = attrs1 ? x;
  demo_02_attrs1_has_y = attrs1 ? y;
  demo_03_attrs1_has_a_dot_b = attrs1 ? a.b;

  demo_04_list1_concat_list2 = list1 ++ list2;

  demo_05_str1_concat_str2 = "abc" + "123";
  # demo_06_path1_concat_path2 = demopath/a + demopath/b; # 严格模式将报错，因为返回的路径不存在。
  demo_07_path1_concat_str2 = "demopath/a" + demopath/b; 
  # demo_08_str1_concat_path2 = demopath/a + "demopath/b"; # 严格模式将报错，因为返回的路径不存在。

  demo_08_attrs = attrs1;
  demo_09_attrs1_merge_attrs2 = attrs1 // {y = 2;};

  demo_10_implication = false -> true;
}
```

执行代码 `nix-env -iA nixpkgs.jq && nix-instantiate --eval nix-lang-demo/09-operators.nix --strict --json | jq`，输出如下：

```json
{
  "demo_01_attrs1_has_x": true,
  "demo_02_attrs1_has_y": false,
  "demo_03_attrs1_has_a_dot_b": false,
  "demo_04_list1_concat_list2": [
    1,
    2,
    3,
    4
  ],
  "demo_05_str1_concat_str2": "abc123",
  "demo_07_path1_concat_str2": "demopath/a/nix/store/nqxj2if4v96ksj1mgsblgc375wcslf83-b",
  "demo_08_attrs": {
    "x": 1
  },
  "demo_09_attrs1_merge_attrs2": {
    "x": 1,
    "y": 2
  },
  "demo_10_implication": true
}
```

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
    * `import` 参见下文：[模块系统](#模块系统)。
    * `isNull e` 判断是否是 null（此功能已弃用；使用 `e == null` 代替）。
    * `map f list` 转换一个列表，函数式编程的 map 原语。
    * `placeholder` 不太理解，参见：[原文](https://nixos.org/manual/nix/stable/language/builtins.html#builtins-placeholder)。
    * `removeAttrs set list` 从 set 中删除指定的属性。
    * `scopedImport` 未找到相关文档。
    * `throw` 参见上文错误处理。
    * `toString` 将值转换为字符串，一个属性集可以通过特殊属性 `__toString = self: ...;` 自定义 toString 格式。
* 其他内置函数，参见：[Nix 手册 - 内置函数](https://nixos.org/manual/nix/stable/language/builtins.html)。

## fetch 相关函数

nix 提供了一些从网络上下载文件的内置函数，执行这些函数，nix 会将这些文件下载下来，并存储到 `/nix/store` 中，并返回存储的路径。

* `builtins.fetchurl` 下载 url。

  ```nix
  let fetchurl = builtins.fetchurl;
  in fetchurl {
    url = "http://ftp.nluug.nl/pub/gnu/hello/hello-2.1.1.tar.gz";
    sha256 = "1md7jsfd8pa45z73bz1kszpp01yw6x5ljkjk2hx7wl800any6465";
  }
  ```

* `builtins.fetchGit args` 从 git 中下载文件。

    * args 是一个属性集。

        * `url` 仓库地址。
        * `name` 存储到 `/nix/store` 的名称，默认为 URL 的 basename。
        * `rev` 要获取的 git 修订版。默认为 ref 指向的。
        * `ref` 分支名或者标签名，如 `master`、`"refs/heads/0.5-release"`，默认为 `HEAD`。
        * `submodules` 是否 checkout 子模块，默认为 false。
        * `shallow` 是否浅克隆，默认为 false。
        * `allRefs` 是否获取仓库的所有引用，默认为 false，即只获取 `ref` 参数配置的。

    * 示例：通过 ssh 从私有仓库获取。

        ```nix
        builtins.fetchGit {
          url = "git@github.com:my-secret/repository.git";
          ref = "master";
          rev = "adab8b916a45068c044658c4158d81878f9ed1c3";
        }
        ```

    * 示例：配置引用。

        ```nix
        builtins.fetchGit {
          url = "https://github.com/NixOS/nix.git";
          ref = "refs/heads/0.5-release";
        }
        ```

    * 示例：下载指定分支的指定 commit（推荐配置 rev 来指定 commit，这样是可重现的，否则随着分支的提交，未来某个时刻获取到的和当前可能不一致）。

        ```nix
        builtins.fetchGit {
          url = "https://github.com/nixos/nix.git";
          rev = "841fcbd04755c7a2865c51c1e2d3b045976b7452";
          ref = "1.11-maintenance";
        }
        ```

    * 示例：如果要查找的 commit 位于 git 存储库的默认分支中，您可以省略 ref 属性。

        ```nix
        builtins.fetchGit {
          url = "https://github.com/nixos/nix.git";
          rev = "841fcbd04755c7a2865c51c1e2d3b045976b7452";
        }
        ```

    * 示例：指定某个具体 tag。

        ```nix
        builtins.fetchGit {
          url = "https://github.com/nixos/nix.git";
          ref = "refs/tags/1.9";
        }
        ```

    * 示例：获取最新版本。

        ```nix
        builtins.fetchGit {
          url = "ssh://git@github.com/nixos/nix.git";
          ref = "master";
        }
        ```

* `builtins.fetchTarball args`  从 url 中下载一个 tar 包（压缩格式必须是 gzip, bzip2 or xz 之一的）（缓存在 `~/.cache/nix/tarballs/` 路径），并解包到一个目录中。注意，tar 的顶层目录会被删除。然后将目录存储到 `/nix/store`，并返回该路径，该函数一般和 import 函数（参见下文）一起使用。

    ```nix
    with import (fetchTarball {
      url = "https://github.com/NixOS/nixpkgs/archive/nixos-14.12.tar.gz";
      sha256 = "1jppksrfvbk5ypiqdz4cddxdl8z6zyzdb2srq8fcffr327ld5jj2";
    }) {};
    ```

完整示例 (`nix-lang-demo/10-builtins-fetch.nix`)。

```nix
# nix-env -iA nixpkgs.jq # 为了更好的展示结果，使用 jq 进行结果格式化展示。
# nix-instantiate --eval nix-lang-demo/10-builtins-fetch.nix --strict --json | jq
let
  fetchurl = builtins.fetchurl;
  fetchGit = builtins.fetchGit;
  fetchTarball = builtins.fetchTarball;
in
{
  demo_01_fetchurl = fetchurl {
    url = "http://ftp.nluug.nl/pub/gnu/hello/hello-2.1.1.tar.gz";
    sha256 = "1md7jsfd8pa45z73bz1kszpp01yw6x5ljkjk2hx7wl800any6465";
  };
  demo_02_fetchGit = fetchGit {
    name = "learn-nix-demo-source";
    url = "https://github.com/rectcircle/learn-nix-demo.git";
    rev = "7f4952a6ecf7dcd90c8bb0c8d14795ae1add5326";
    ref = "master";
    shallow = true;
  };
  demo_03_fetchTarball = fetchTarball {
    url = "https://mirrors.tuna.tsinghua.edu.cn/nix-channels/releases/nixpkgs-unstable%40nixpkgs-23.05pre462063.2ce9b9842b5/nixexprs.tar.xz";
  };
}
```

执行代码 `nix-env -iA nixpkgs.jq && nix-instantiate --eval nix-lang-demo/10-builtins-fetch.nix --strict --json | jq`，输出如下：

```json
{
  "demo_01_fetchurl": "/nix/store/9bw6xyn3dnrlxp5vvis6qpmdyj4dq4xy-hello-2.1.1.tar.gz",
  "demo_02_fetchGit": "/nix/store/zjii7ls858zb1qw0mi2v3rd7xg780fav-learn-nix-demo-source",
  "demo_03_fetchTarball": "/nix/store/10njnx13qh4x3z7j7q0jh7m64s0s95w1-source"
}
```

## 模块系统

nix 通过 `import path`， 执行其他文件的代码，并返回执行的结果。在 nix 中 import 是一个内置函数。这里的 path 可以是一个 `.nix` 文件，也可以是一个目录，如果是一个目录或压缩包的话，将执行该目录中的 `default.nix` 文件。示例如下：

通过 `import` 函数可以将 nix 代码拆分到文件和目录，以实现模块划分和代码复用。

前文介绍的 nixpkgs channel 本质上就是这样一个模块。下文有一些导入 nixpkgs 的一些惯用用法。

* 示例 1：通过 github 提供的 archive 链接，导入一个历史上某个版本的 nixpkgs。

    ```nix
    let
        pkgs = import (builtins.fetchTarball {
            url = "https://github.com/NixOS/nixpkgs/archive/d1c3fea7ecbed758168787fe4e4a3157e52bc808.tar.gz";
        }) {};
    in
    ```

* 示例 2：通过 git 命令，导入一个历史上某个版本的 nixpkgs。

    ```nix
    let
        pkgs = import (builtins.fetchGit {
            # Descriptive name to make the store path easier to identify
            name = "my-old-revision";
            url = "https://github.com/NixOS/nixpkgs/";
            ref = "refs/heads/nixpkgs-unstable";
            rev = "d1c3fea7ecbed758168787fe4e4a3157e52bc808";
        }) {};
    in
    ```

完整示例

`nix-lang-demo/demopath/default.nix`

```nix
{
  c = "demopath/default.nix var c";
}
```

`nix-lang-demo/11-import.nix`。

```nix
# nix-env -iA nixpkgs.jq # 为了更好的展示结果，使用 jq 进行结果格式化展示。
# nix-instantiate --eval nix-lang-demo/11-import.nix --strict --json | jq
let
  import_file = import ./01-hello.nix;
  import_dir = import ./demopath;
in
{
  demo_01_import_file = import_file;
  demo_02_import_dir = import_dir;
}
```

执行代码 `nix-env -iA nixpkgs.jq && nix-instantiate --eval nix-lang-demo/11-import.nix --strict --json | jq`，输出如下：

```json
{
  "demo_01_import_file": "hello world",
  "demo_02_import_dir": {
    "c": "demopath/default.nix var c"
  }
}
```

## 推导 (derivation)

> 参考: [nix-pills/our-first-derivation](https://nixos.org/guides/nix-pills/our-first-derivation.html) | [nix-pills/working-derivation.html](https://nixos.org/guides/nix-pills/working-derivation.html)

### 概述

前文，我们一直将 nix 定位为一个包管理工具。但实际上，从本质上来说，nix 的核心是一个包构建系统。

因此，nix 语言需要提供一套机制，可以让用户定义，软件包从源码到二进制产物的过程。

而推导（derivation）就是这样一个最重要的的一个内置函数。是 nix 作为一个构建系统的核心。

### 参数说明

在 nix 中， derivation 内置函数，定义一个软件包重源码到二进制产物的过程，该函数传递一个属性集作为参数，包含如下属性：

* `system` 必填，字符串，定义该构建过程要求的 CPU 架构（x86_64、arm）和操作系统名（linux、darwin）。可通过 `nix -vv --version` 命令获取（或者通过 `builtins.currentSystem` 变量获取，如果是支持所有平台，则可以直接使用这个参数），如果系统不匹配将失败（通过配置，nix 支持远端构建，参见： [forward builds for other platforms](https://nixos.org/manual/nix/stable/advanced-topics/distributed-builds.html)）。该字段会作为环境变量传递给 `builder` 进程。
* `name` 必填，字符串。被 nix-env 用作包的符号名称，并影响其最终存储路径 `/nix/store/$hash-$name`，如果同时支持多版本的场景吗，建议该字段为 `包名-版本号`。。该字段会作为环境变量传递给 `builder` 进程。
* `builder` 必填，字符串或路径，描述一个构建脚本，可以来是另一个 derivation、源码，如 `./builder.sh`。推荐使用 bash `"${pkgs.bash}/bin/bash"`。该字段指向的路径会拷贝到 `/nix/store` 中，并作为环境变量传递给 `builder` 进程。
* `args` 选填，字符串列表，传递给 `builder` 的命令行参数。推荐写法为 `["-c" '' 编译脚本 '']`。
* `outputs` 选填，字符串列表，默认为 `["out"]`。一般情况下，不需要更改（除非想精细化的管理依赖，如配置为 `[ "lib" "headers" "doc" ]`时，其他的推导只需要依赖 `lib` 目录，这种写法可以加速缓存下载）。nix 会在 `/nix/store` 中创建这个列表中声明的所有路径。然后，将该列表中的元素作为 key，对应的路径作为 value，作为环境变量传递给 `builder` 进程。
* `其他属性` 选填，支持字符串、数字、路径、列表、bool、null。这些字段会作为环境变量传递到 `builder` 进程中。需要说明的是：
    * 路径类型，会拷贝到 `/nix/store` 中，然后将绝对路径传递 `builder` 给进程。
    * bool 类型 true，会转换为 1。bool 类型 false、null 会转换为空串。
    * 列表类型，元素会转换为字符串，然后用空格分隔拼接成一个字符串。

### 示例

#### 源码

假设我们有一个 Go 项目，该项目是一个命令行工具，希望通过 nix 编译和发行该包。本部分实现一下该项目：

`nix-package-demo/go.mod`

```go
module github.com/rectcircle/learn-nix-demo/nix-package-demo

go 1.19
```

`nix-package-demo/main.go`

```go
package main

import "fmt"

func main() {
	fmt.Println("hello world!")
}
```

#### 定义 derivation

`nix-lang-demo/12-derivation.nix`

```nix
# drv_path=$(nix-instantiate nix-lang-demo/12-derivation.nix) && echo "drv_path: $drv_path" && echo "drv: $(nix --extra-experimental-features nix-command show-derivation $drv_path)" && nix-store -r $drv_path && nix-store --read-log $drv_path
# nix-env -e my-nix-package-demo-0.0.1 ; nix-collect-garbage -d  # 彻底卸载。

# 整体来开，该文件定义了一个函数，该函数，参数为 pkgs 默认会拿系统中的 nixpkgs，返回一个 derivation 的返回值。
{pkgs ? import <nixpkgs> { } }:
let
  derivation = builtins.derivation;
  # pkgs = import <nixpkgs> {};
  # 从 github 中获取示例项目的源码，会存储到 /nix/store 中的一个子目录中。source 的值是一个指向这个子目录的路径。
  source = fetchGit {
    name = "learn-nix-demo-source";
    url = "https://github.com/rectcircle/learn-nix-demo.git";
    rev = "7f4952a6ecf7dcd90c8bb0c8d14795ae1add5326";
    ref = "master";
    shallow = true;
  };
in 
derivation {
  # 由于 go 项目是跨平台的，所以，这里直接使用 builtins.currentSystem，表示支持任意平台。
  system = builtins.currentSystem;
  name = "my-nix-package-demo-0.0.1";
  # 会启动 nixpkgs 的 bash 来构建项目。
  builder = "${pkgs.bash}/bin/bash";
  # 额外的环境变量，会传递到 builder 进程。
  A = "1";
  # bash 命令的参数。即 bash -c 脚本 。
  args = [ "-c" 
  # 在这个脚本，观察下，nix 如何设置这个脚本的环境变量，以及文件系统，参见输出。
  ''
    set -e
    ${pkgs.coreutils}/bin/echo ">>> export -p" && export -p && echo

    echo ">>> export PATH=${pkgs.go_1_19}/bin:${pkgs.bash}/bin:${pkgs.coreutils}/bin" && export PATH="${pkgs.go_1_19}/bin:${pkgs.bash}/bin:${pkgs.coreutils}/bin" && echo

    echo ">>> pwd" && pwd && echo
    echo ">>> id" && id && echo
    echo ">>> ls -al /" && ls -al / && echo
    echo ">>> ls -al /bin" && ls -al /bin && echo
    echo ">>> ls -al /build" && ls -al /build && echo
    echo ">>> ls -al /nix/store" && ls -al /nix/store && echo

    echo ">>> mkdir -p $out/bin" && mkdir -p $out/bin && echo
    echo ">>> cd ${source}/nix-package-demo && CGO_ENABLED=0 go build -o $out/bin/my-nix-package-demo ./" && cd ${source}/nix-package-demo && CGO_ENABLED=0 go build -o $out/bin/my-nix-package-demo ./ && echo

    echo ">>> ls -al $out/bin" && ls -al $out/bin && echo
  ''];
}
```

#### 测试和输出分析

执行 `drv_path=$(nix-instantiate nix-lang-demo/12-derivation.nix) && echo "drv_path: $drv_path" && echo "drv: $()" && nix-store -r $drv_path && nix-store --read-log $drv_path` 命令，输出可以分为三部分。

第一部分，`nix-instantiate nix-lang-demo/12-derivation.nix` 的执行，通过 `echo "drv_path: $drv_path"` 可以看出去，其将打印一个路径。

```
drv_path: /nix/store/svf3hf64w6sadkc0gdpbss7ql0cr6s3d-my-nix-package-demo-0.0.1.drv
```

这个路径命名为 `/nix/store/$hash-$name.drv`。可以看出，nix-instantiate 会执行 `nix-lang-demo/12-derivation.nix` 表达式（如果该文件返回的是一个函数类型，则会使用 `{}` 再调用该函数）。并将结果到该路径。

`.drv` 文件是 nix 构建工具的输入，nix 会根据该文件的配置来执行构建（如有缓存，将直接拉取而跳过构建）。

第二部分， `nix --extra-experimental-features nix-command show-derivation $drv_path` 将使用 json 格式展示上一步产生的 `.drv` 文件。

```json
{
  "/nix/store/svf3hf64w6sadkc0gdpbss7ql0cr6s3d-my-nix-package-demo-0.0.1.drv": {
    "args": [
      "-c",
      "set -e\n/nix/store/bg8f47vihykgqcgblxkfk9sbvc4dnksa-coreutils-9.1/bin/echo \">>> export -p\" && export -p && echo\n\necho \">>> export PATH=/nix/store/633qlvqjryvq0h43nwvzkd5vqxh2rh3c-go-1.19.6/bin:/nix/store/5ynbf6wszmggr0abwifdagrixgnya5vy-bash-5.2-p15/bin:/nix/store/bg8f47vihykgqcgblxkfk9sbvc4dnksa-coreutils-9.1/bin\" && export PATH=\"/nix/store/633qlvqjryvq0h43nwvzkd5vqxh2rh3c-go-1.19.6/bin:/nix/store/5ynbf6wszmggr0abwifdagrixgnya5vy-bash-5.2-p15/bin:/nix/store/bg8f47vihykgqcgblxkfk9sbvc4dnksa-coreutils-9.1/bin\" && echo\n\necho \">>> pwd\" && pwd && echo\necho \">>> id\" && id && echo\necho \">>> ls -al /\" && ls -al / && echo\necho \">>> ls -al /bin\" && ls -al /bin && echo\necho \">>> ls -al /build\" && ls -al /build && echo\necho \">>> ls -al /nix/store\" && ls -al /nix/store && echo\n\necho \">>> mkdir -p $out/bin\" && mkdir -p $out/bin && echo\necho \">>> cd /nix/store/zjii7ls858zb1qw0mi2v3rd7xg780fav-learn-nix-demo-source/nix-package-demo && CGO_ENABLED=0 go build -o $out/bin/my-nix-package-demo ./\" && cd /nix/store/zjii7ls858zb1qw0mi2v3rd7xg780fav-learn-nix-demo-source/nix-package-demo && CGO_ENABLED=0 go build -o $out/bin/my-nix-package-demo ./ && echo\n\necho \">>> ls -al $out/bin\" && ls -al $out/bin && echo\n"
    ],
    "builder": "/nix/store/5ynbf6wszmggr0abwifdagrixgnya5vy-bash-5.2-p15/bin/bash",
    "env": {
      "A": "1",
      "builder": "/nix/store/5ynbf6wszmggr0abwifdagrixgnya5vy-bash-5.2-p15/bin/bash",
      "name": "my-nix-package-demo-0.0.1",
      "out": "/nix/store/rqj3xxlzw7i9iwqqw2xafj9ykv4gy1zh-my-nix-package-demo-0.0.1",
      "system": "x86_64-linux"
    },
    "inputDrvs": {
      "/nix/store/c65s9ncxdkfcijaxn6c9gglcw1zyaapx-go-1.19.6.drv": [
        "out"
      ],
      "/nix/store/czc8ym3wasmrsnwvlxzavxlfpfi2zg65-bash-5.2-p15.drv": [
        "out"
      ],
      "/nix/store/psc5y2s3prwxf1ph760nd7n1978s4411-coreutils-9.1.drv": [
        "out"
      ]
    },
    "inputSrcs": [
      "/nix/store/zjii7ls858zb1qw0mi2v3rd7xg780fav-learn-nix-demo-source"
    ],
    "outputs": {
      "out": {
        "path": "/nix/store/rqj3xxlzw7i9iwqqw2xafj9ykv4gy1zh-my-nix-package-demo-0.0.1"
      }
    },
    "system": "x86_64-linux"
  }
}
```

重点关注，如下字段：

* `inputDrvs` nix 会分析，我们的 nix 代码，分析我们是否引用了其他**推导**。本例中，我们在 builder 中使用了 `${pkgs.bash}`、在 args 中使用了 `${pkgs.go_1_19}`、`${pkgs.bash}`、`${pkgs.coreutils}`。因此， nix 识别出这些依赖，添加到了该字段。在 `nix-instantiate` 执行过程中，这些依赖就会被构建完成。
* `inputSrcs` nix 会分析，我们的 nix 代码，分析我们是否引用了其他**路径**。本例中，我们在 args 中引用 fetchGit 获取到的 `source` 路径。因此 nix 识别出了这些依赖，添加到了该字段。在 `nix-instantiate` 执行过程中，这些依赖就会被获取完成。
* `env` 字段中包含了 `A`，说明声明中的 `A` 属性被加到了环境变量中。此外 `outputs.out` 也被加到了环境变量中。
* `outputs` 可以看出 outputs 目录，已经被创建出来。

此外，需要强调的是：

* 所有的路径都在 `/nix/store` 目录中。nix 不会依赖除了 /nix/store 之外的其他目录，这保证了 nix 函数式不可便的特性。
* 可以看出 `outputs.out` 目录的 hash 值在编译执行之前就确定，从该特性可以看出，nix 的 hash 是由 nix 代码的执行情况决定的，而不是文件内容的 hash。这保证了，同样的 nix 代码生成的各种目录都是一致的。基于这一点 nix 才能实现二进制缓存。

第三部分：`nix-store -r $drv_path && nix-store --read-log $drv_path` 根据 `.drv` 进行编译（对应目录不存在的话），然后打印出输出。

```
/nix/store/rqj3xxlzw7i9iwqqw2xafj9ykv4gy1zh-my-nix-package-demo-0.0.1
>>> export -p
declare -x A="1"
declare -x HOME="/homeless-shelter"
declare -x NIX_BUILD_CORES="4"
declare -x NIX_BUILD_TOP="/build"
declare -x NIX_LOG_FD="2"
declare -x NIX_STORE="/nix/store"
declare -x OLDPWD
declare -x PATH="/path-not-set"
declare -x PWD="/build"
declare -x SHLVL="1"
declare -x TEMP="/build"
declare -x TEMPDIR="/build"
declare -x TERM="xterm-256color"
declare -x TMP="/build"
declare -x TMPDIR="/build"
declare -x builder="/nix/store/5ynbf6wszmggr0abwifdagrixgnya5vy-bash-5.2-p15/bin/bash"
declare -x name="my-nix-package-demo-0.0.1"
declare -x out="/nix/store/rqj3xxlzw7i9iwqqw2xafj9ykv4gy1zh-my-nix-package-demo-0.0.1"
declare -x system="x86_64-linux"

>>> export PATH=/nix/store/633qlvqjryvq0h43nwvzkd5vqxh2rh3c-go-1.19.6/bin:/nix/store/5ynbf6wszmggr0abwifdagrixgnya5vy-bash-5.2-p15/bin:/nix/store/bg8f47vihykgqcgblxkfk9sbvc4dnksa-coreutils-9.1/bin

>>> pwd
/build

>>> id
uid=1000(nixbld) gid=100(nixbld) groups=100(nixbld),65534(nogroup)

>>> ls -al /
total 32
drwxr-x---   9 nixbld nixbld  4096 Mar 12 07:27 .
drwxr-x---   9 nixbld nixbld  4096 Mar 12 07:27 ..
drwxr-xr-x   2 nixbld nixbld  4096 Mar 12 07:27 bin
drwx------   2 nixbld nixbld  4096 Mar 12 07:27 build
drwxr-xr-x   4 nixbld nixbld  4096 Mar 12 07:27 dev
dr-xr-xr-x   2 nixbld nixbld  4096 Mar 12 07:27 etc
drwxr-xr-x   3 nixbld nixbld  4096 Mar 12 07:27 nix
dr-xr-xr-x 194 nobody nogroup    0 Mar 12 07:27 proc
drwxrwxrwt   2 nixbld nixbld  4096 Mar 12 07:27 tmp

>>> ls -al /bin
total 224
drwxr-xr-x 2 nixbld nixbld   4096 Mar 12 07:27 .
drwxr-x--- 9 nixbld nixbld   4096 Mar 12 07:27 ..
-r-xr-xr-x 1 nixbld nixbld 217776 Jan  1  1970 sh

>>> ls -al /build
total 8
drwx------ 2 nixbld nixbld 4096 Mar 12 07:27 .
drwxr-x--- 9 nixbld nixbld 4096 Mar 12 07:27 ..

>>> ls -al /nix/store
total 68
drwxrwxr-t 17 nixbld nixbld 4096 Mar 12 07:27 .
drwxr-xr-x  3 nixbld nixbld 4096 Mar 12 07:27 ..
dr-xr-xr-x  4 nixbld nixbld 4096 Jan  1  1970 2w4k8nvdyiggz717ygbbxchpnxrqc6y9-gcc-12.2.0-lib
dr-xr-xr-x  4 nixbld nixbld 4096 Jan  1  1970 5ynbf6wszmggr0abwifdagrixgnya5vy-bash-5.2-p15
dr-xr-xr-x  3 nixbld nixbld 4096 Jan  1  1970 633qlvqjryvq0h43nwvzkd5vqxh2rh3c-go-1.19.6
dr-xr-xr-x  6 nixbld nixbld 4096 Jan  1  1970 76l4v99sk83ylfwkz8wmwrm4s8h73rhd-glibc-2.35-224
dr-xr-xr-x  4 nixbld nixbld 4096 Jan  1  1970 9zbi407givkvv1m0bd0icwcic3b3q24y-mailcap-2.1.53
dr-xr-xr-x  4 nixbld nixbld 4096 Jan  1  1970 bg8f47vihykgqcgblxkfk9sbvc4dnksa-coreutils-9.1
dr-xr-xr-x  4 nixbld nixbld 4096 Jan  1  1970 bw9s084fzmb5h40x98mfry25blj4cr9r-acl-2.3.1
dr-xr-xr-x  3 nixbld nixbld 4096 Jan  1  1970 bx5ikpp0p8nx88xdldkx16w3k3jzd2qc-busybox-static-x86_64-unknown-linux-musl-1.36.0
dr-xr-xr-x  3 nixbld nixbld 4096 Jan  1  1970 dg8213bqr29hg180gf4ypcj2vvzw4fl3-tzdata-2022g
dr-xr-xr-x  5 nixbld nixbld 4096 Jan  1  1970 jn9kg98dsaajx4mh95rb9r5rf2idglqh-attr-2.5.1
dr-xr-xr-x  3 nixbld nixbld 4096 Jan  1  1970 jvl8dr21nrwhqywwxcl8di4j55765gvy-gmp-with-cxx-stage4-6.2.1
dr-xr-xr-x  4 nixbld nixbld 4096 Jan  1  1970 lg2skbyyn1d7nkczqjz8mms38z4nhj2b-iana-etc-20221107
dr-xr-xr-x  3 nixbld nixbld 4096 Jan  1  1970 qmnr18aqd08zdkhka695ici96k6nzirv-libunistring-1.0
dr-xr-xr-x  4 nixbld nixbld 4096 Jan  1  1970 vv6rlzln7vhxk519rdsrzmhhlpyb5q2m-libidn2-2.3.2
dr-xr-xr-x  4 nixbld nixbld 4096 Jan  1  1970 zjii7ls858zb1qw0mi2v3rd7xg780fav-learn-nix-demo-source

>>> mkdir -p /nix/store/rqj3xxlzw7i9iwqqw2xafj9ykv4gy1zh-my-nix-package-demo-0.0.1/bin

>>> cd /nix/store/zjii7ls858zb1qw0mi2v3rd7xg780fav-learn-nix-demo-source/nix-package-demo && CGO_ENABLED=0 go build -o /nix/store/rqj3xxlzw7i9iwqqw2xafj9ykv4gy1zh-my-nix-package-demo-0.0.1/bin/my-nix-p>

>>> ls -al /nix/store/rqj3xxlzw7i9iwqqw2xafj9ykv4gy1zh-my-nix-package-demo-0.0.1/bin
total 1796
drwxr-xr-x 2 nixbld nixbld    4096 Mar 12 07:27 .
drwxr-xr-x 3 nixbld nixbld    4096 Mar 12 07:27 ..
-rwxr-xr-x 1 nixbld nixbld 1827660 Mar 12 07:27 my-nix-package-demo
```

* `export -p` 可以看出，nix builder 中的执行环境是一个和操作系统完全隔离的干净的环境。其中：
    * `HOME="/homeless-shelter"`、 `PATH="/path-not-set"` 只是一个占位符。
    * 上文 `.drv` 中的环境变量都正确的注入了。
    * `pwd`、`TMP`、`TEMPDIR` 都在 `/build` 目录。
* `id` 可以看出，nix 创建了一个构建用的用户 `1000(nixbld)`。
* `ls -al /` 可以看出，nix 应该利用了 Linux 的 Mount 和 User namespace 实现的构建隔离。

#### 恢复现场

```bash
nix-env -e my-nix-package-demo-0.0.1 ; nix-collect-garbage -d
```

### derivation 和 stdenv.mkDerivation

这里可以看出，写一个 derivation 启动一个 bash 还是比较麻烦的，最麻烦的是，需要手动设置 PATH 环境变量。

为此，nixpkgs 封装了一个便捷的函数 `stdenv.mkDerivation`，该函数就是对 `derivation` 的封装，提供了更友好的编程接口。

因此，在实践中，一般使用 `stdenv.mkDerivation` 来定义一个推导。

关于 `stdenv.mkDerivation` 参见下文 [nixpkgs 分析](#nixpkgs-分析)。

## 常见 shell.nix 分析

上一篇文章，我们使用 shell.nix 定义了一个项目的开发依赖。代码 `nix-package-demo/shell.nix` 如下所示：

```nix
# { pkgs ? import <nixpkgs> { } }:
let 
  pkgs = import ( builtins.fetchTarball { 
    url = "https://mirrors.tuna.tsinghua.edu.cn/nix-channels/releases/nixpkgs-unstable%40nixpkgs-23.05pre460011.f5ffd578778/nixexprs.tar.xz"; 
  }) {};
in
pkgs.mkShell {
  buildInputs =
    [
      pkgs.curl
      pkgs.jq
      pkgs.go
      pkgs.which
    ];
  shellHook = ''
    export TEST_ENV_VAR=ABC
  '';
}
```

执行命令 `drv_path=$(nix-instantiate nix-package-demo/shell.nix) && echo "drv_path: $drv_path" && echo "drv: $(nix --extra-experimental-features nix-command show-derivation $drv_path)"` 可以看到输出如下：

```
drv_path: /nix/store/wwmkmm2wvfjh5jh5mhb0anxqpz4s26cx-nix-shell.drv
drv: {
  "/nix/store/wwmkmm2wvfjh5jh5mhb0anxqpz4s26cx-nix-shell.drv": {
    "args": [
      "-e",
      "/nix/store/6xg259477c90a229xwmb53pdfkn6ig3g-default-builder.sh"
    ],
    "builder": "/nix/store/5ynbf6wszmggr0abwifdagrixgnya5vy-bash-5.2-p15/bin/bash",
    "env": {
      "__structuredAttrs": "",
      "buildInputs": "/nix/store/gd51gknpxqaxyd0gycmszm8ckrvwvs0l-curl-7.88.0-dev /nix/store/7paksrb0nbm7q9x7rzzabqlgjci9rx8k-jq-1.6-dev /nix/store/633qlvqjryvq0h43nwvzkd5vqxh2rh3c-go-1.19.6 /nix/store/v0g0r8khhdxn8gwcx3yg57wmndzfdgz5-which-2.21",
      "buildPhase": "{ echo \"------------------------------------------------------------\";\n  echo \" WARNING: the existence of this path is not guaranteed.\";\n  echo \" It is an internal implementation detail for pkgs.mkShell.\";\n  echo \"------------------------------------------------------------\";\n  echo;\n  # Record all build inputs as runtime dependencies\n  export;\n} >> \"$out\"\n",
      "builder": "/nix/store/5ynbf6wszmggr0abwifdagrixgnya5vy-bash-5.2-p15/bin/bash",
      "cmakeFlags": "",
      "configureFlags": "",
      "depsBuildBuild": "",
      "depsBuildBuildPropagated": "",
      "depsBuildTarget": "",
      "depsBuildTargetPropagated": "",
      "depsHostHost": "",
      "depsHostHostPropagated": "",
      "depsTargetTarget": "",
      "depsTargetTargetPropagated": "",
      "doCheck": "",
      "doInstallCheck": "",
      "mesonFlags": "",
      "name": "nix-shell",
      "nativeBuildInputs": "",
      "out": "/nix/store/2zx26yarglz5wqbkl6mqbaxqfyinrixn-nix-shell",
      "outputs": "out",
      "patches": "",
      "phases": "buildPhase",
      "preferLocalBuild": "1",
      "propagatedBuildInputs": "",
      "propagatedNativeBuildInputs": "",
      "shellHook": "export TEST_ENV_VAR=ABC\n",
      "stdenv": "/nix/store/c3f4jdwzn8fm9lp72m91ffw524bakp6v-stdenv-linux",
      "strictDeps": "",
      "system": "x86_64-linux"
    },
    "inputDrvs": {
      "/nix/store/65wj1fwk5f3wncd1j3dmk29k3nzghl8d-which-2.21.drv": [
        "out"
      ],
      "/nix/store/c65s9ncxdkfcijaxn6c9gglcw1zyaapx-go-1.19.6.drv": [
        "out"
      ],
      "/nix/store/czc8ym3wasmrsnwvlxzavxlfpfi2zg65-bash-5.2-p15.drv": [
        "out"
      ],
      "/nix/store/r7wldahsa6maa0m7nnjf82azcy4g8hdh-jq-1.6.drv": [
        "dev"
      ],
      "/nix/store/saw3hgzcr6lsy051kclm3y7kif8b4i6h-curl-7.88.0.drv": [
        "dev"
      ],
      "/nix/store/xjk0c9yw2i25xr08ngk60bc47q9fw2jd-stdenv-linux.drv": [
        "out"
      ]
    },
    "inputSrcs": [
      "/nix/store/6xg259477c90a229xwmb53pdfkn6ig3g-default-builder.sh"
    ],
    "outputs": {
      "out": {
        "path": "/nix/store/2zx26yarglz5wqbkl6mqbaxqfyinrixn-nix-shell"
      }
    },
    "system": "x86_64-linux"
  }
}
```

因此 `mkShell` 本质上就是创建了一个包含了声明依赖的 derivation。

而 `nix-shell` 的流程就是，先调用 `nix-instantiate nix-package-demo/shell.nix`，生成一个 `.drv` 文件，然后根据该文件配置，启动一个 Shell。

## nixpkgs 分析

> 参考： [nixpkgs github](https://github.com/NixOS/nixpkgs) | [nixpkgs 手册](https://nixos.org/manual/nixpkgs/stable/) |

基于上面的背景知识，nixpkgs 和 nix channel 的原理可以很容易的立即。

nixpkgs 本质上就是一个 nix 代码库，该库主要包含如下两类内容：

* 一些对 nix 原生能力进行易用化封装的函数，如 `mkShell`、`stdenv.mkDerivation`。
* 包含了开源世界 80000+ 个软件包的 `derivation` 声明。

可以通过 `nixpkgs.hello` 的源码（[pkgs/applications/misc/hello/default.nix](https://github.com/NixOS/nixpkgs/blob/f94a71f899b26311b439c9efc25f915745b50a8c/pkgs/applications/misc/hello/default.nix)），以及生成的 `.drv` 来了解，如何通过 `stdenv.mkDerivation` 来定一个软件包的 `derivation`。

```bash
nix-env -iA nixpkgs.hello
ls -al /nix/store/*-hello-*.drv
nix --extra-experimental-features nix-command show-derivation /nix/store/7ky0zmis8b384k5sx852i0fq7x9ir2jl-hello-2.12.1.drv
```

这里重点介绍一下，nixpkgs 的 `stdenv.mkDerivation` 的属性集参数的一些重要属性（详见：[Chapter 6. The Standard Environment](https://nixos.org/manual/nixpkgs/stable/#chap-stdenv)）。

* `pname` 包名。
* `version` 包版本。最终对应 derivation name 为 `"${pname}-${version}"`。
* `src` 源代码路径一般等于 fetch 相关函数调用。在脚本可以通过 `src` 环境变量获取到。
* `nativeBuildInputs` 声明仅在本次编译时依赖的其他包（derivation），如 go 编译器，git 等。
* `buildInputs` 声明在运行时依赖的其他包（derivation），如 glibc 等，为了支持交叉编译，还有大量 `depsXxx` 相关属性，不太理解。
* `passthru` 该属性目前主要用户测试，该字段的变更不会影响 `.drv` 文件的生成，不会影响 hash 的生成。
* `xxxPhase` 默认如果不给出此类参数，将自动执行位于 `pkgs/stdenv/generic/setup.sh` 中的所有阶段。如果项目中没有提供 Makefile 则需要手动提供 `buildPhase`、`installPhase` 脚本。支持的所有阶段如下（`$` 开头的表示默认没有实现）：

    ```
    $prePhases unpackPhase patchPhase $preConfigurePhases configurePhase $preBuildPhases buildPhase checkPhase $preInstallPhases installPhase fixupPhase installCheckPhase $preDistPhases distPhase $postPhases
    ```

针对各种不同的编程语言和框架， nixpkgs 也提供了对应的便捷函数，如 `buildGoModule`，本文不多赘述，详见：[Chapter 17. Languages and frameworks](https://nixos.org/manual/nixpkgs/stable/#chap-language-support)。

## 自定义 channel

## 其他说明

### 纯函数性

hash 值

### 各种 Name
