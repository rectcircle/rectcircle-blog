---
title: "Rust"
date: 2019-07-28T10:24:54+08:00
draft: false
toc: true
comments: true
tags:
  - 其他编程语言
---

> 版本 1.36.0
> 参考：https://www.rust-lang.org/zh-CN/
> https://doc.rust-lang.org/stable/book/
> https://doc.rust-lang.org/stable/reference/

## 一、安装和配置

### 1、*nix安装

```bash
curl https://sh.rustup.rs -sSf | sh
```

默认安装位置为：`~/.cargo/bin`

如果使用VSCode集成开发环境，安装完成后，需要彻底重启VSCode。

### 2、配置环境变量

正常情况下，默认会将环境变量配置好，即在 `~/.bash_profile` 文件中添加一行 `export PATH="$HOME/.cargo/bin:$PATH"`

## 3、配置集成开发环境（VSCode）

开发环境安装

https://marketplace.visualstudio.com/items?itemName=rust-lang.rust

调试器安装

https://marketplace.visualstudio.com/items?itemName=vadimcn.vscode-lldb

https://github.com/vadimcn/vscode-lldb/blob/v1.2.3/MANUAL.md#cargo-support

例子配置

```jsonc
{
	"version": "0.2.0",
	"configurations": [
		{
			"name": "test",
			"type": "lldb",
			"request": "launch",
			"cargo": {
				// "args": ["test", "--no-run", "--lib"], // Cargo command line to build the debug target
				"args": ["build"], // is another possibility
			}
		}
	]
}
```

## 二、起步

### 0、语言特点

Rust是mozilla推出的一款系统级的编程语言，其两大特点在于零开销抽象和安全性。

* 手动内存管理
* 静态类型语言，自动类型推断
* 系统级别语言效率类似于C++

### 1、HelloWorld

```bash
mkdir hello_world
cd hello_world
```

创建文件 `main.rs`

```rs
fn main() {
    println!("Hello, world!");
}
```

从HelloWorld可以看出Rust语言的一些特性：

* 支持顶层函数（不像Java，只能写方法）
* 需要分号
* C家族的语法风格（花括号）
* 奇怪的 `!`，文档说是宏

### 2、Hello cargo

cargo是rust包管理器，定义了标准rust项目的目录结构，并解决依赖

查看 cargo 版本

```bash
cargo --version
```

#### （1）创建Cargo项目

```bash
cargo new hello_cargo
```

* 将会创建一个hello_cargo的目录（VSCode插件全部功能使用，必须将cargo项目作为工作空间根目录）
* 同时初始化一个git仓库
* 包含src目录
* 包含cargo配置文件Cargo.toml

`Cargo.toml` 文件内容如下

```toml
[package]
name = "hello_cargo"
version = "0.1.0"
authors = ["sunben <sunben.96@bytedance.com>"]
edition = "2018"

# See more keys and their definitions at https://doc.rust-lang.org/cargo/reference/manifest.html

[dependencies]
```

#### （2）常用命令

* `cargo new project_name`
* `cargo build`
* `cargo run`
* `cargo check` 语法检查

## 三、基本语法

### 1、体验——猜数字游戏

创建新的项目进行试验

```bash
cargo new guessing_game
```

修改 `Cargo.toml` 添加依赖

```toml
[package]
name = "guessing_game"
version = "0.1.0"
authors = ["sunben <sunben.96@bytedance.com>"]
edition = "2018"

# See more keys and their definitions at https://doc.rust-lang.org/cargo/reference/manifest.html

[dependencies]
rand = "0.3.14"
```

* `"0.3.14"` 表示 `^0.3.14` 表示与该版本兼容的版本
* `Cargo.lock` 保证全部用户使用相同的版本，除非手动的`cargo update`或者更新`Cargo.toml`文件

修改 `src/main.rs`

```rs
use std::io;
use std::cmp::Ordering;
use rand::Rng;

fn main() {
    println!("Guess the number!");

    let secret_number = rand::thread_rng().gen_range(1, 101);

    loop {
        println!("Please input your guess.");

        let mut guess = String::new();

        io::stdin().read_line(&mut guess)
            .expect("Failed to read line");

        let guess: u32 = match guess.trim().parse() {
            Ok(num) => num,
            Err(_) => continue,
        };

        println!("You guessed: {}", guess);

        match guess.cmp(&secret_number) {
            Ordering::Less => println!("Too small!"),
            Ordering::Greater => println!("Too big!"),
            Ordering::Equal => {
                println!("You win!");
                break;
            }
        }
    }
}
```

* 导入库语法 `use`，父子模块使用`::`分割
* 创建变量，使用 `let`，`mut`表示可变，不加表示不可变变量
* `new()` 相当于构造函数，`::`调用函数表示调用静态函数
* 使用 `use std::io;`，就可以使用`io::stdin()`调用，否则只能使用`std::io::stdin()`调用
  * 可以这么做 `use std::io::stdin;`，直接引入函数，`stdin()`调用
* `loop` 类似 `while(true)`
* `&` 表示传引用，默认引用不可便，`&mut`声明引用可变
* `read_line` 将返回一个Result对象，可能是Ok或Err，expect方法将返回真正的结果，如果Err将展示异常信息然后直接退出程序（调用panic!）
* 支持类似Scala的模式匹配、智能类型推测
* `println!` 支持模板字符串

### 2、变量与不可变

创建新项目

```bash
cargo new variables
```

修改 `src/main.rs`

变量默认不可变，不可以重新赋值（包括传递引用后修改也不允许），否者编译报错

```rs
fn main() {
    let x = 5;
    println!("The value of x is: {}", x);
    x = 6; // 此行将编译报错，因为修改了不可便变量
    println!("The value of x is: {}", x);
}

```

允许变量可变使用 mut 声明

```rs
    let mut x = 5;
    println!("The value of x is: {}", x);
    x = 6;
    println!("The value of x is: {}", x);
```

#### （1） 变量（let）和常量（const）的区别

* 常量不能使用`mut`修饰
* const必须显示指定类型
* 常量可以在任何范围内声明，包括全局范围，这使得它们对许多代码部分需要了解的值很有用。
* 最后一个区别是常量可能只设置为常量表达式，不是能是函数调用的结果或只能在运行时计算的任何其他值。

```rs
    const MAX_POINTS: u32 = 100_000;
```

* 常量在程序运行的整个时间内有效，在它们声明的范围内，使它们成为应用程序域中程序的多个部分可能需要知道的值的有用选择，例如最大点数、允许游戏的玩家获得光速或光速。
* 将整个程序中使用的硬编码值命名为常量，有助于将该值的含义传达给代码的未来维护者。如果将来需要更新硬编码值，那么在代码中只需要更改一个位置也是有帮助的。

#### （2）变量覆盖

```rs
    let x = 5;

    let x = x + 1;

    let x = x * 2;

    println!("The value of x is: {}", x);

    let spaces = "   ";
    let spaces = spaces.len();
    println!("The value of spaces is: {}", spaces);

    // let mut spaces1 = "   ";
    // spaces1 = spaces1.len(); // 编译报错
```

* 在同一作用域可以多次声明同名不可便对象，下面声明的将覆盖上面声明的变量，可以实现类似于可变变量赋值的效果
* 变量覆盖还支持不同类型
* 当然赋值不允许

### 3、数据类型

主要分为两类：标量（基本数据类型）和复合（复杂数据类型）

#### （1）标量数据——整型

| 长度   | 有符号 | 无符号 |
|-------|--------|------|
| 8-bit | `i8` | `u8` |
| 16-bit | `i16` | `u16` |
| 32-bit | `i32` | `u32` |
| 64-bit | `i64` | `u64` |
| 128-bit | `i128` | `u128` |
| arch | `isize` | `usize` |

#### （2）标量数据——浮点类型

```rs
fn main() {
    let x = 2.0; // f64

    let y: f32 = 3.0; // f32
}
```

#### （3）数字计算

```rs
fn main() {
    // addition
    let sum = 5 + 10;

    // subtraction
    let difference = 95.5 - 4.3;

    // multiplication
    let product = 4 * 30;

    // division
    let quotient = 56.7 / 32.2;

    // remainder
    let remainder = 43 % 5;
}

```

#### （4）标量数据——bool类型

```rs
fn main() {
    let t = true;

    let f: bool = false; // with explicit type annotation
}
```

#### （4）标量数据——字符类型

```rs
fn main() {
    let c = 'z';
    let z = 'ℤ';
    let heart_eyed_cat = '😻';
}
```

* 32 位 Unicode 码

#### （5）复合类型——元组

```rs
fn main() {
    let x: (i32, f64, u8) = (500, 6.4, 1);

    let five_hundred = x.0;

    let six_point_four = x.1;

    let one = x.2;
}
```

#### （6）复合类型——数组

```rs
fn main() {
    let a: [i32; 5] = [1, 2, 3, 4, 5];
    let b = [3; 5]; // 长度为5，元素全部都是3的数组


    let first = a[0];
    let second = a[1];
}
```

数组越界将产生panic（异常）

### 4、函数

#### （1）基本特性

```rs
fn main() {
    another_function(5);
}

fn another_function(x: i32) {
    println!("The value of x is: {}", x);
}
```

* 定义顺序和调用顺序不相关
* 函数体可以包含表达式和声明（rust是一门表达式语言）
  * 表达式必须有返回值（比如：宏、函数调用、`{}`包裹的语句）
  * 声明没有返回值（比如let, fn）
* `{}` 包裹的（scala和传统语法的合体）
  * 最后一个语句如果没有分号，则最后一个表达式的结果是该语句块的结果
  * 最后一个语句有分号，怎该语句块无返回值

```rs
fn add(a: i32, b: i32) -> i32 {
    let c = {
        a+b // 不需要加分号
    };
    c
}
```

#### （2）返回值

* 函数的返回值是其最后一个表达式的值
* `return` 在设计上用于提前返回

```rs

fn five() -> i32 {
    5
}

// fn plus_one(x: i32) -> i32 {
//     x + 1; // 报错
// }
```

### 5、注释

```rs
// hello, world
```

* 普通注释，使用双斜杠
* 文档注释使用 `/**/`

### 5、控制流

#### （1）条件语句

```rs
fn main() {
    let number = 3;

    if number < 5 {
        println!("condition was true");
    } else {
        println!("condition was false");
    }
}
```

* 类似Java条件只能是bool类型
* 类似Scala，if也是表达式（前提类型匹配）

#### （2）循环

使用loop，死循环，使用break终止

```rs
    let mut counter = 0;

    let result = loop {
        counter += 1;

        if counter == 10 {
            break counter * 2;
        }
    };

    println!("The result is {}", result);

    'outer: loop {
        while true {
            break 'outer;
        }
    }
```

使用while

```rs
    let mut number = 3;

    while number != 0 {
        println!("{}!", number);

        number -= 1;
    }

    println!("LIFTOFF!!!");

    let mut x = vec![1, 2, 3];

    while let Some(y) = x.pop() {
        println!("y = {}", y);
    }

    while let _ = 5 {
        println!("Irrefutable patterns are always true");
        break;
    }
```

使用for

```rs
fn main() {
    let a = [10, 20, 30, 40, 50];

    for element in a.iter() {
        println!("the value is: {}", element);
    }

    for number in (1..4).rev() {
        println!("{}!", number);
    }
    println!("LIFTOFF!!!");
}
```

* 都支持 break, continue 类似Java支持label, 使用break goto
* while 支持模式匹配
