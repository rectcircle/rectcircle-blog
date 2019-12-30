---
title: "Rust语言"
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
> https://kaisery.github.io/trpl-zh-cn/
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

### 3、配置集成开发环境（VSCode）

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
* 无null类型设计

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

编译运行

```bash
rustc main.rs
./main
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
authors = ["rectcircle <rectcircle96@gmail.com>"]
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
authors = ["rectcircle <rectcircle96@gmail.com>"]
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

主要分为两类：标量（scalar基本数据类型）和复合（compound）

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
  * 最后一个语句有分号，则语句块无返回值

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

### 6、错误处理

Rust 异常一般分为两类：可恢复错误（recoverable）和 不可恢复错误（unrecoverable）可恢复错误通常代表向用户报告错误和重试操作是合理的情况，比如未找到文件。不可恢复错误通常是 bug 的同义词，比如尝试访问超过数组结尾的位置。

在Rust中表现不是异常，而是`Result<T, E>`以及 `panic!`

#### （1） `panic!` 与不可恢复错误

`panic!` 一旦被触发程序将直接 exit！

`panic!` 宏的调用默认将会打印程序调用堆栈。当然可以通过配置在生产环境中关闭（编译文件更小，相当于exit）：

```toml
[profile.release]
panic = 'abort'
```

自己的程序触发的panic

```rs
fn main() {
    panic!("crash and burn");
}
```

运行结果

```
$ cargo run
    Finished dev [unoptimized + debuginfo] target(s) in 0.00s
     Running `target/debug/error_handle`
thread 'main' panicked at 'crash and burn', src/main.rs:2:5
note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace.
```

第三方库触发的panic，比如数组越界

```rs
    let v = vec![1, 2, 3];
    v[99];
```

运行结果

```
$ cargo run
   Compiling error_handle v0.1.0 (/Users/sunben/Workspace/learn/rust/error_handle)
    Finished dev [unoptimized + debuginfo] target(s) in 0.64s
     Running `target/debug/error_handle`
thread 'main' panicked at 'index out of bounds: the len is 3 but the index is 99', /rustc/4560ea788cb760f0a34127156c78e2552949f734/src/libcore/slice/mod.rs:2717:10
note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace.
```

以上只会报告异常出现的位置，但是不会打印调用堆栈。根据提示使用 `RUST_BACKTRACE=1` 环境变量可以打印错误堆栈

```bash
$ RUST_BACKTRACE=1 cargo run
    Finished dev [unoptimized + debuginfo] target(s) in 0.01s
     Running `target/debug/error_handle`
thread 'main' panicked at 'index out of bounds: the len is 3 but the index is 99', /rustc/4560ea788cb760f0a34127156c78e2552949f734/src/libcore/slice/mod.rs:2717:10
stack backtrace:
   0: backtrace::backtrace::libunwind::trace
             at /Users/runner/.cargo/registry/src/github.com-1ecc6299db9ec823/backtrace-0.3.37/src/backtrace/libunwind.rs:88
  省略...
  26: std::rt::lang_start
             at /rustc/4560ea788cb760f0a34127156c78e2552949f734/src/libstd/rt.rs:64
  27: error_handle::main
note: Some details are omitted, run with `RUST_BACKTRACE=full` for a verbose backtrace.
```

注意以上追踪必须启用 debug 标识。当不使用 --release 参数运行 cargo build 或 cargo run 时 debug 标识会默认启用。

#### （2） Result 与可恢复的错误

类似于go语言，可能出错的调用一般返回被封装到 `std::result::Result` 中，针对 `Result`，我们可选的处理方式：

* 使用模式匹配进行处理
* 调用快捷方法，当出现错误时触发panic方式退出

```rs
use std::fs::File;
use std::io::ErrorKind;
use std::io;
use std::io::Read;
use std::fs::File;
use std::fs;


fn main() {
    let f = File::open("hello.txt");

    // 模式匹配处理错误
    let f = match f {
        Ok(file) => file,
        Err(error) => {
            panic!("There was a problem opening the file: {:?}", error)
        },
    };

    // 匹配不同错误
    let f = match f {
        Ok(file) => file,
        Err(error) => match error.kind() {
            ErrorKind::NotFound => match File::create("hello.txt") {
                Ok(fc) => fc,
                Err(e) => panic!("Tried to create file but there was a problem: {:?}", e),
            },
            other_error => panic!("There was a problem opening the file: {:?}", other_error),
        },
    };

    //调用快捷方法，以简化模式匹配
    let f = File::open("hello.txt").unwrap_or_else(|error| {
        if error.kind() == ErrorKind::NotFound {
            File::create("hello.txt").unwrap_or_else(|error| {
                panic!("Problem creating the file: {:?}", error);
            })
        } else {
            panic!("Problem opening the file: {:?}", error);
        }
    });

    // 出现错误时直接退出的快捷方法
    let f = File::open("hello.txt").unwrap(); //`unwarp` 直接展开错误
    let f = File::open("hello.txt").expect("Failed to open hello.txt"); // `expect` 可以打印自定义字符串
}

// 错误传递：返回一个Result<R,E>
// 去取文件到内存字符串
fn read_username_from_file() -> Result<String, io::Error> {
    let f = File::open("hello.txt");

    let mut f = match f {
        Ok(file) => file,
        Err(e) => return Err(e),
    };

    let mut s = String::new();

    match f.read_to_string(&mut s) {
        Ok(_) => Ok(s),
        Err(e) => Err(e),
    }
}

// 使用? 简写异常传递 和read_username_from_file完全等价
// 注意 ? 只能被用于返回 Result 的函数
fn read_username_from_file1() -> Result<String, io::Error> {
    let mut f = File::open("hello.txt")?;
    let mut s = String::new();
    f.read_to_string(&mut s)?; // 表示如果出现异常直接返回 Err(e)
    Ok(s)
}

// 当然对于读取到字符串的操作rust提供了一个函数
fn read_username_from_file2() -> Result<String, io::Error> {
    fs::read_to_string("hello.txt")
}
```

#### （3） 选择`panic!`还是`Result`

* 一般情况最好使用 `Result`，因为其给调用者更多的选择（调用者可以选择是处理还是`panic`）
* 示例、代码原型和测试都非常适合 panic
* 在当有可能会导致有害状态的情况下建议使用 `panic!`，比如：用于规范调用者的输入

### 7、内存管理

* 手动内存管理
* 所有权系统
* 安全内存管理

细节参见下文

### 8、抽象方式

* struct、方法、trait抽象（类似于Golang）
* 函数式编程特性
  * 模式匹配
  * 闭包
  * 迭代器
* 元编程（宏系统）

细节参见下文

## 四、所有权系统

所有权系统是 Rust 不同其他语言的最重要的部分。是为了解决内存分配问题而设计的。

同其他编程语言一样rust内存也被划分为堆（heap）和栈（stack）。在函数中：

* 值类型的变量将被防止在栈中
* 复合类型的引用放置于栈中，数据放置与堆中

### 1、所有权规则

* 所有的值都有一个叫做owner的变量
* 一次只能有一个owner
* 当owner超出的作用域，值将被回收

### 2、变量作用域

和其他预览类似：一个花括号将创建一个作用域，超出作用域的变量将无法访问

```rust
    {                      // s 非法，因为还没有声明
        let s = "hello";   // s 是合法的
        println!("{}", s);
        // 使用 s 做一些事情
    }                      // 超出作用域 s 不可用
```

#### `String` 类型示例

`String`是标准库提供的一个可变字符串。示例如下：

```rust
    let s = String::from("hello");    // 这样声明表示不可变，从一个字符串字面量创建String

    let mut s = String::from("hello"); // 声明可变的string

    s.push_str(", world!"); // push_str() 字符串拼接

    println!("{}", s); // 将打印出 `hello, world!`
```

#### 内存分配

`String::from` 实际上是在堆上申请了内存空间用于存放字符串。但是何时free，一般有两种做法：

* 自动化垃圾回收器Java等
  * 缺点：带来额外的开销
* 手动回收类似于C、C++
  * 极易出现错误和严重的漏洞

Rust不同于以上两种：

* 一旦变量超出作用域，将自动回收

```rs
    {
        let s = String::from("hello"); // s 从改点可以访问

        // do stuff with s
    }                                  // 作用域结束，s不可访问（伴随drop）
                                   // longer valid
```

#### 所有权转移

针对赋值，分配在堆上的变量将发生所有权转移，在栈上的变量将进行赋值

栈上的情况

```rs
    {
        let x = 5;
        let y = x; // x 分配在栈上，x将copy到y上，所以x, y都可以访问
        println!("{}", x);
    }
```

堆上的情况

```rs
    let s1 = String::from("hello");
    let s2 = s1; // 可以称之为所有权转移，浅拷贝，同时让s1失效

    // println!("{}, world!", s1); // 报错：borrow of moved value: `s1` value borrowed here after moverustc(E0382)
```

堆上拷贝的方法

```rs
    {
        let s1 = String::from("hello");
        let s2 = s1.clone();

        println!("s1 = {}, s2 = {}", s1, s2); // 不会报错
    }
```

### 3、变量覆盖和所有权

```rs
    {
        let s1 = String::from("hello");
        let s1 = String::from("hello"); // 变量覆盖不会带来内存回收，在花括号结束后自动回收
        let s1 = String::from("hello");
    }
```

### 4、所有权和函数

函数的传参和变量赋值类似

```rs
    let s = String::from("hello");  // s 进入作用域

    takes_ownership(s);             // s 被移动到函数内部
                                    // ... 不在合法
    // println!("所有权已转移 {}", s); // 报错
    let x = 5;                      // x 进入作用域

    makes_copy(x);                  // x 所有权转移到函数
                                    // but i32 被拷贝，所以x仍能访问
                                    // 可以使用x
    println!("标量数据类型直接拷贝，仍然可访问{}", x);

fn takes_ownership(some_string: String) { // some_string 进入作用域
    println!("{}", some_string);
} // 在这, some_string 超出作用域 `drop` 被调用. 返回
  // 内存被释放

fn makes_copy(some_integer: i32) { // some_integer 进入作用域
    println!("{}", some_integer);
} // 在这, some_integer 超出作用域. 没有什么发生.
```

函数返回值同样包含所有权转移

```rs
    let s1 = gives_ownership();         // 函数返回值的所有权转移到s1
                                        // value into s1

    let s2 = String::from("hello");     // s2 进入作用域

    let s3 = takes_and_gives_back(s2);  // s2 移动到函数内
                                        // takes_and_gives_back, 返回值
                                        // 移动到s3
    // println!("s2 {}", s2); // 报错
    println!("s3 {}", s3);



fn gives_ownership() -> String {             // gives_ownership 所有权将移动到作用域内
                                             // 返回值所有权将移动到调用者所在作用域

    let some_string = String::from("hello"); // some_string 进入作用域

    some_string                              // some_string 所有权将移动到调用者所在作用域
}

// takes_and_gives_back 将接受一个参数并返回一个参数
fn takes_and_gives_back(a_string: String) -> String { // a_string 进入
                                                      // 作用域

    a_string  // a_string 所有权将移动到调用者所在作用域
}
```

### 5、所有权总结

变量的所有权每次都遵循相同的模式：

* 赋值（函数传参、返回值）给另一个变量，所有权将转移到被赋值变量，原有变量将不可访问
* 当指向堆上数据的变量（所有权转移除外）超出作用域，将会调用 `drop` 回收内存

在不使用引用的情况下，如果需要同时想使用函数参数和返回值，则需要使用元组在返回回来：

```rs
fn main() {
    let s1 = String::from("hello");

    let (s2, len) = calculate_length(s1);

    println!("The length of '{}' is {}.", s2, len);
}

fn calculate_length(s: String) -> (String, usize) {
    let length = s.len(); // len() returns the length of a String

    (s, length)
}

```

### 6、引用

为了解决上文的问题，引入引用。

```rs
    {
        let s1 = String::from("hello");

        let len = calculate_length2(&s1);

        println!("The length of '{}' is {}.", s1, len);
    }

fn calculate_length2(s: &String) -> usize {
    s.len()
}
```

以上引用声明的方式不允许修改，因此可以使用`&mut`声明可变引用

```rs
fn main() {
    let mut s = String::from("hello");

    change(&mut s);
}

fn change(some_string: &mut String) {
    some_string.push_str(", world");
}
```

可变引用存在如下限制

* 对于特定范围内的特定数据，您只能有一个可变引用。
* 这样设计的原因：竞争发生不一致
  * 两个或更多指针同时访问同一数据。
  * 至少有一个指针被用来写入数据。
  * 没有同步数据访问的机制。

```rs
    {
        let mut s = String::from("hello");

        let r1 = &mut s;
        // let r2 = &mut s; // 报错：cannot borrow `s` as mutable more than once at a time

        // println!("{}, {}", r1, r2);
    }
```

可以通过创建作用域解决

```rs
    {
        let mut s = String::from("hello");

        {
            let r1 = &mut s;

        } // r1 goes out of scope here, so we can make a new reference with no problems.

        let r2 = &mut s;
    }
```

同样可变与不可变混用也会导致报错

```rs
    {
        let mut s = String::from("hello");

        let r1 = &s; // no problem
        let r2 = &s; // no problem
        // let r3 = &mut s; // BIG PROBLEM：cannot borrow `s` as mutable because it is also borrowed as immutable

        // println!("{}, {}, and {}", r1, r2, r3);
    }
```

判断的依据是是否同时使用：

```rs
let mut s = String::from("hello");

let r1 = &s; // no problem
let r2 = &s; // no problem
println!("{} and {}", r1, r2);
// r1 and r2 are no longer used after this point

let r3 = &mut s; // no problem
println!("{}", r3);
```

总结

* 在任意给定时间，要么 只能有一个可变引用，要么 只能有多个不可变引用。
* 以上规则在调用有改变的时候回触发检查

### 7、引用悬空

编辑器保证不会出现引用悬空：通过检测引用作用域必须在变量的作用域及子孙作用域内。

```rs
fn main() {
    let reference_to_nothing = dangle();
}

fn dangle() -> &String { // 报错引用超出变量作用域
    let s = String::from("hello");

    &s
}
```

总结

* 引用必须总是有效。

### 8、切片类型

切片是另一种没有所有权的类型（就是一种引用）。

字符串切片

```rs
let s = String::from("hello world");

let hello = &s[0..5];
let world = &s[6..11];
```

一个例子：查找字符串的第一个单词

```rs
    {
        let mut s = String::from("hello world");
        s.push_str(" 123");
        let word = first_word(&s);

        // s.clear(); // error! 类似引用计数机制，因为 work 引用了 s

        println!("the first word is: {}", word);
    }
    {
        let mut s = String::from("hello world");

        let word = first_word(&s);

        // s.clear(); // error! cannot borrow `s` as mutable because it is also borrowed as immutable

        println!("the first word is: {}", word);
    }

fn first_word(s: &String) -> &str {
    let bytes = s.as_bytes();

    for (i, &item) in bytes.iter().enumerate() {
        if item == b' ' {
            return &s[0..i];
        }
    }

    &s[..]
}
```

调用 `s.clear();` 报错的原因：

* 在获取一个不可变引用时，就不能使用可变引用了。

### 9、引用使用规则

为了确保引用不会带来很多运行时错误（悬空、竞争），应用有如下规则：

* 引用作用域必须在变量的作用域内（防止悬空）
* 出现一个不可变引用后，将
  * 可变引用或变量将**不允许**调用其声明为 `&mut self` 的方法
* 出现一个可引用后，则
  * **不允许**在同一作用域再声明一个可变引用
  * **不允许**使用上边声明的不可变对象

### 10、引用总结

* 在任意给定时间，**要么** 只能有一个可变引用，**要么** 只能有多个不可变引用。
* 引用必须总是有效。

## 五、结构体

### 1、定义并实例化结构体

#### （1）基本示例

```rs
// 结构体
struct User {
    username: String,
    email: String,
    sign_in_count: u64,
    active: bool,
}

// 方便的构造函数
fn build_user(email: String, username: String) -> User {
    User {
        email, // 相同可以省略
        username,
        active: true,
        sign_in_count: 1,
    }
}

// 元组结构体
struct Color(i32, i32, i32);
struct Point(i32, i32, i32);

fn main() {
    let user1 = User {
        email: String::from("someone@example.com"),
        username: String::from("username123"),
        active: true,
        sign_in_count: 1,
    };
    println!("User: username={} email={} sign_in_count={} active={}", user1.username, user1.email, user1.sign_in_count, user1.active);
    let user1_1 = build_user(String::from("test@example.com"), String::from("test"));
    let user2 = User {
        email: String::from("another@example.com"),
        username: String::from("anotherusername567"),
        ..user1 // 从其他实例中拷贝
    };

    let black = Color(0, 0, 0);
    let origin = Point(0, 0, 0);

    println!("Hello, world!");
}
```

#### （2）结构体与所有权

可以使结构体存储被其他对象拥有的数据的引用，不过这么做的话需要用上 生命周期（lifetimes），这是一个第十章会讨论的 Rust 功能。生命周期确保结构体引用的数据有效性跟结构体本身保持一致。如果你尝试在结构体中存储一个引用而不指定生命周期将是无效的，比如这样：

```rs
struct User {
    username: &str, // 报错
    email: &str, //  报错
    sign_in_count: u64,
    active: bool,
}

fn main() {
    let user1 = User {
        email: "someone@example.com",
        username: "someusername123",
        active: true,
        sign_in_count: 1,
    };
}
```

### 2、方法

```rs
#[derive(Debug)] // 注解
struct Rectangle {
    width: u32,
    height: u32,
}

impl Rectangle { //实现方法
    fn area(&self) -> u32 {
        self.width * self.height
    }

}

impl Rectangle {
    fn can_hold(&self, other: &Rectangle) -> bool {
        self.width > other.width && self.height > other.height
    }
}

fn main() {
    let rect1 = Rectangle { width: 30, height: 50 };

    println!("rect1 is {:?}", rect1);
    println!("rect1 is {:#?}", rect1);

    println!(
        "The area of the rectangle is {} square pixels.",
        rect1.area()
    );

    let rect1 = Rectangle { width: 30, height: 50 };
    let rect2 = Rectangle { width: 10, height: 40 };
    let rect3 = Rectangle { width: 60, height: 45 };

    println!("Can rect1 hold rect2? {}", rect1.can_hold(&rect2));
    println!("Can rect1 hold rect3? {}", rect1.can_hold(&rect3));
}
```

* 方法必须定义在结构头上下文（或者是枚举或 trait 对象的上下文）
* 第一个参数总是self，可以是：
  * `&self`
  * `&mut self`
  * `self` 不常见（仅在将当前对象转换为另一个对象）
* 类似于go，rust不使用`->`，只使用`.`，会进行自动解引用

## 六、函数式语言特性

### 1、枚举和模式匹配

创建测试项目 `cargo new enums`

#### 定义枚举

基本语法

```rs
// 定义枚举
enum IpAddrKind {
    V4,
    V6,
}

    // 使用枚举
    let four = IpAddrKind::V4;
    let six = IpAddrKind::V6;
```

* 通过`::`引用枚举

枚举作为函数参数

```rs
// 枚举值作为函数参数
fn route(ip_type: IpAddrKind) {

}

    // 调用参数为枚举方法
    route(four);
```

枚举值作为结构体成员

```rs
// 枚举值作为结构体成员
struct IpAddr {
    kind: IpAddrKind,
    address: String,
}

    // 使用枚举结构体
    let home = IpAddr {
        kind: IpAddrKind::V4,
        address: String::from("127.0.0.1"),
    };
    let loopback = IpAddr {
        kind: IpAddrKind::V6,
        address: String::from("::1"),
    };
```

枚举与值绑定

```rs
// 将数值与枚举属性绑定
enum IpAddr2 {
    V4(String),
    V6(String),
}

    let home = IpAddr2::V4(String::from("127.0.0.1"));
    let loopback = IpAddr2::V6(String::from("::1"));
```

标准库中的IPAddr的例子

```rs

// 标准库中ip的封装
struct Ipv4Addr {
    // --snip--
}
struct Ipv6Addr {
    // --snip--
}
enum IpAddr3 {
    V4(Ipv4Addr),
    V6(Ipv6Addr),
}
```

更复杂的关联数据与关联方法

```rs
//更复杂的关联数据的例子
enum Message {
    Quit, //没有关联任何数据
    Move { x: i32, y: i32 }, //包含一个匿名结构体
    Write(String), //包含单独一个 String
    ChangeColor(i32, i32, i32), //包含三个 i32
}

// 结构体同样支持方法
impl Message {
    fn call(&self) {
        // 在这里定义方法体
    }
}

    // 方法调用
    let m = Message::Write(String::from("hello"));
    m.call();
```

option实现与无null设计

```rs
// 标准库中的enum实现例子
/*
enum Option<T> {
    Some(T),
    None,
}
*/
    // Option例子
    let some_number = Some(5);
    let some_string = Some("a string");

    let absent_number: Option<i32> = None;

    let x: i8 = 5;
    let y: Option<i8> = Some(5);

    // let sum = x + y; //报错 no implementation for `i8 + std::option::Option<i8>`

```

#### 模式匹配

例子1：枚举类型模式匹配

```rs
enum Coin {
    Penny,
    Nickel,
    Dime,
    Quarter,
}

fn value_in_cents(coin: Coin) -> u32 {
    match coin {
        Coin::Penny => 1,
        Coin::Nickel => 5,
        Coin::Dime => 10,
        Coin::Quarter => 25,
    }
}
```

* 一个硬币类型的模式匹配
* 根据类型返回不同值

例子2：带有绑定值的模式匹配

```rs
enum Coin2 {
    Penny,
    Nickel,
    Dime,
    Quarter(UsState),
}

fn value_in_cents2(coin: Coin2) -> u32 {
    match coin {
        Coin2::Penny => 1,
        Coin2::Nickel => 5,
        Coin2::Dime => 10,
        Coin2::Quarter(state) => {
            println!("State quarter from {:?}!", state);
            25
        }
    }
}
```

匹配Option的一个例子

```rs
fn plus_one(x: Option<i32>) -> Option<i32> {
    match x {
        None => None,
        Some(i) => Some(i + 1),
    }
}

let five = Some(5);
let six = plus_one(five);
let none = plus_one(None);
```

通配符

```rs
    let some_u8_value = 0u8;
    match some_u8_value {
        1 => println!("one"),
        3 => println!("three"),
        5 => println!("five"),
        7 => println!("seven"),
        _ => (),
    }
```

* 支持类似scala的通配符

#### if let 单条件模式匹配符

```rs
let some_u8_value = Some(0u8);
match some_u8_value {
    Some(3) => println!("three"),
    _ => (),
}
```

等价于

```rs
if let Some(3) = some_u8_value {
    println!("three");
}
```

```rs
    let mut count = 0;
    let coin = Coin2::Dime;
    match coin {
        Coin2::Quarter(state) => println!("State quarter from {:?}!", state),
        _ => count += 1,
    }
```

等价于

```rs
    let mut count = 0;
    let coin1 = Coin2::Dime;
    if let Coin2::Quarter(state) = coin1 {
        println!("State quarter from {:?}!", state);
    } else {
        count += 1;
    }
```

### 2、闭包

新建项目 `cargo new closures` 编辑 `src/main.rs`

闭包的基本语法

```rs
use std::thread;
use std::time::Duration;


/// 一个生成训练计划的程序
/// 根据用户提供的强度值和随机因子计算接下来要做的事情
fn generate_workout(intensity: u32, random_number: u32) {
    // 用来计算运动项目的次数
    let expensive_closure = |num| { // 一个闭包，类型参数根据下方调用传的参数推断出来
        println!("缓慢计算中...");
        thread::sleep(Duration::from_secs(2));
        num
    };

    if intensity < 25 {
        println!(
            "今天, 先做 {} 个 俯卧撑 !",
            expensive_closure(intensity) // 在此处推断出闭包的参数类型和返回值类型
        );
        println!(
            "接下来, 在做 {} 个 仰卧起坐 !",
            expensive_closure(intensity) // 此处传参和返回值必须与第一次调用一致
        );
        // expensive_closure(1.2); // 报错：expected u32, found floating-point number
    } else {
        if random_number == 3 {
            println!("今天休息一下！记住要保持水分！ ");
        } else {
            println!(
                "今天, 跑 {} 分钟步!",
                expensive_closure(intensity)
            );
        }
    }
}

    generate_workout(25, 10);
```

闭包与函数

```rs
fn add_one(a: u32, version: u32) -> u32 {
    fn  add_one_v1   (x: u32) -> u32 { x + 1 }; // 这是定义了一个函数
    let add_one_v2 = |x: u32| -> u32 { x + 1 }; // 定义闭包方式1
    // 以下两种定义必须在作用域内使用才能使编译器推断出参数类型，不适用的将报错，让用户明确声明类型
    let add_one_v3 = |x|             { x + 1 }; // 定义闭包方式2
    let add_one_v4 = |x|               x + 1  ; // 定义闭包方式3
    let add_one_v5 = | |               a + 1  ; // 闭包可以捕获作用域内的变量，但是函数不能
    // fn  add_one_v6   () -> u32       { a + 1 }; // 报错：can't capture dynamic environment in a fn item


    match version {
        1 => add_one_v1(a),
        2 => add_one_v2(a),
        3 => add_one_v3(a),
        4 => add_one_v4(a),
        5 => add_one_v5(),
        _ => a+1,
    }
}

    add_one(1,5);
```

闭包作为结构体成员

```rs

struct Cacher<T>
    where T: Fn(u32) -> u32 // 闭包有三种triat类型参见下文
{
    calculation: T,
    value: Option<u32>,
}

impl<T> Cacher<T>
    where T: Fn(u32) -> u32
{
    fn new(calculation: T) -> Cacher<T> {
        Cacher {
            calculation,
            value: None,
        }
    }

    fn value(&mut self, arg: u32) -> u32 {
        match self.value {
            Some(v) => v,
            None => {
                let v = (self.calculation)(arg);
                self.value = Some(v);
                v
            },
        }
    }
}


    let mut add_one_cacher = Cacher::new(|x: u32| x+1);
    println!("{}", add_one_cacher.value(1));
```

闭包与所有权系统（闭包的三种特质）

* 闭包可以通过三种方式捕获其环境，他们直接对应函数的三种获取参数的方式：
  * 获取所有权
  * 可变引用借用
  * 不可变引用借用
* 闭包都实现如下几个特质，然后根据调用上下文选择其中的一个特质，下面的self表示对自由变量使用的方式
  * FnOnce(self)
  * FnMut(&mut self)
  * Fn(&self)
* 更多参考 https://tonydeng.github.io/2019/11/09/rust-closure-type/

```rs

fn main() {

    let x = vec![1, 2, 3];

    let equal_to_x = move |z| z == x; // 强制指定为FnOnce，且将 x 所有权移动到闭包中，当闭包执行完毕x将被回收

    // println!("can't use x here: {:?}", x); // 报错： value borrowed here after moverustc(E0382)

    let y = vec![1, 2, 3];

    assert!(equal_to_x(y));
}
```

### 3、迭代器

## 七、模块化系统

### 1、基本概念

一般情况下，一个Cargo项目就是模块系统中的一个包；一个包可以包含多个二进制crate项

* 包（Packages）： Cargo 的一个功能，它允许你构建、测试和分享 crate。
* Crates ：一个模块的树形结构，它形成了库或二进制项目。
* 模块（Modules）和 use： 允许你控制作用域和路径的私有性。
* 路径（path）：一个命名例如结构体、函数或模块等项的方式

### 2、餐馆模拟样例

一个餐馆一般有两个部分：

* 前台 front of house
* 后台 back of house

以下命令将创建一个名为 restaurant 的库

```bash
cargo new --lib restaurant
```

和不带 `--lib` 创建的项目区别在于 `src/main.rs` 变成了 `src/lib.rc`

### 3、定义模块

删除 `src/lib.rc` 原本的内容，填写如下内容

```rs
// mod 定义了一个模块
mod front_of_house {
    // 定义了一个子模块
    mod hosting {
        // 模块的内容
        fn add_to_waitlist() {}

        fn seat_at_table() {}
    }

    mod serving {
        fn take_order() {}

        fn server_order() {}

        fn take_payment() {}
    }

}
```

* `mod 模块名 {}` 表示定义了一个有名字的模块
* 花括号内可以定义：子模块、结构体、枚举、常量、特性、或者函数
* 模块树的根节点叫做 `crate`

上述代码定义的模块树结构如下：

```
crate
 └── front_of_house
     ├── hosting
     │   ├── add_to_waitlist
     │   └── seat_at_table
     └── serving
         ├── take_order
         ├── serve_order
         └── take_payment
```

### 4、路径来使用模块中的项

修改 `src/lib.rs` 如下：

```rs
// Version1： 模拟餐馆前台的模块
// mod 定义了一个模块
mod front_of_house {
    // 定义了一个子模块
    pub mod hosting {
        // 模块的内容
        pub fn add_to_waitlist() {}

        fn seat_at_table() {}
    }

    pub mod serving {
        pub fn take_order() {}

        fn server_order() {}

        fn take_payment() {}
    }

}

pub fn eat_at_restaurant() {

    // 绝对路径调用
    crate::front_of_house::hosting::add_to_waitlist();

    // 相对路径调用：当前内容在 crate 模块，相对于 crate
    front_of_house::hosting::add_to_waitlist();
}

```

* rust中定义的所有元素默认都是私有的。可以通过 `pub` 关键字来使其可见
  * 子模块中的定义可以访问祖宗模块的所有内容
  * 同一模块内的内容可以相互访问
  * 只能访问子孙模块的pub定义的内容（整个路径都必须是pub的）
* 调用支持使用相对路径和绝对路径
  * 绝对路径以 crate 开头（类似于文件系统 `/`）
  * 其他情况为 相对路径，相对于当前所在模块

### 5、使用`super`访问父路径

`super` 类似于 文件系统中的 `../`

在 `src/lib.rc` 中添加

```rs
fn serve_order() {}

mod back_of_house {
    fn fix_incorrect_order() {
        cook_order();
        super::serve_order(); // 调用父模块中的成员
    }

    fn cook_order() {}
}
```

### 6、创建公有的结构体和枚举

在 `src/lib.rs` 模块 `back_of_house` 中添加

```rs
    // 定义了一个公有的结构体
    pub struct Breakfast {
        pub toast: String, // 公有字段
        seasonal_fruit: String, // 默认是私有字段
    }

    // 实现结构体方法
    impl Breakfast {
        pub fn summer(toast: &str) -> Breakfast {
            Breakfast {
                toast: String::from(toast),
                seasonal_fruit: String::from("peaches"),
            }
        }
    }

    // 定义一个公有结构体
    pub enum Appetizer {
        Soup, // 默认是公有
        Salad, // 默认是公有
    }
```

在 `src/lib.rs` 函数 `eat_at_restaurant` 中添加

```rs
    // 夏天订购黑麦面包早餐 Order a breakfast in the summer with Rye toast
    let mut meal = back_of_house::Breakfast::summer("Rye");
    // 改变主意，想吃什么面包 Change our mind about what bread we'd like
    meal.toast = String::from("Wheat"); // 修改公有字段
    println!("I'd like {} toast please", meal.toast);

    // The next line won't compile if we uncomment it; we're not allowed
    // to see or modify the seasonal fruit that comes with the meal
    // 如果我们取消注释，则下一行将不会编译；我们不允许
    // 查看或修改随餐提供的时令水果
    // meal.seasonal_fruit = String::from("blueberries"); // 不可以修改

    // 公有的可直接访问
    let order1 = back_of_house::Appetizer::Soup;
    let order2 = back_of_house::Appetizer::Salad;
```

### 7、使用use引入到作用域

和其他语言类似

`src/lib.rc`

```rs
use crate::front_of_house::hosting;

pub fn eat_at_restaurant1() {
    hosting::add_to_waitlist();
    hosting::add_to_waitlist();
    hosting::add_to_waitlist();
}

use crate::front_of_house::hosting::add_to_waitlist; // 直接引入函数

pub fn eat_at_restaurant2() {
    add_to_waitlist();
    add_to_waitlist();
    add_to_waitlist();
}

use std::fmt::Result;
use std::io::Result as IoResult; // 重命名

// 引入并暴露，这样在外部就可以通过 类似 serving::take_order 方式调用
// 相当于在当前作用域定义了 serving 模块并 pub
pub use crate::front_of_house::serving;

use rand::Rng;

use std::collections::HashMap;

use std::{cmp::Ordering, alloc};
use std::io::{self, Write};

use std::collections::*;

```

* `use xxx::xxx::A` 导入路径，导入后，内部就可以 `A` 名使用 `A` 访问其内容
* `use xxx::xxx::A as B` 重命名，内部就可以通过名字B访问A
* `pub use xxx::xxx::A` 外部可以访问A
* `use xxx::xxx` 使用外部包
  * `Cargo.toml` 添加依赖 `rand = "0.5.5"`
  * 此时 `use xxx` 中 `xxx` 就是外部包名
* `use std::xxx` 使用 `std` 包
  * `std` 包和其他外部包使用方式一致
  * `std` 不需要显示引入依赖，是标准库，直接可以使用
* `use std::{cmp::Ordering, alloc};` 一次性引入多个包
* `use std::io::{self, Write};`
  * self表示同时引入`io`
* `use xxx::xxx::*;` 一次性引入全部

### 8、多文件模块

`src/lib.rs` 添加模块声明

```rs
mod front_of_house2;

pub use crate::front_of_house2::hosting as hosting2 ;

pub fn eat_at_restaurant3() {
    hosting2::add_to_waitlist();
    hosting2::add_to_waitlist();
    hosting2::add_to_waitlist();
}

mod front_of_house3;
```

`src/front_of_house2.rs`

```rs
pub mod hosting;
```

`src/front_of_house2/hosting.rs`

```rs
pub fn add_to_waitlist() {}
```

`src/front_of_house3/mod.rs`

```rs
pub mod hosting;
```

`src/front_of_house3/hosting.rs`

```rs
pub fn add_to_waitlist() {}
```

* 使用 `mod xxx;` 或者 `pub mod xxx;` 声明一个模块后，有两种方式实现定义：
  * 方式1：定义文件 `xxx.rs`，文件内直接编写模块定义
  * 方式2：创建目录 `xxx`，创建文件 `xxx/mod.rs`，并在该文件内直接编写模块定义
* 推荐方式（可读性更高）：
  * 针对非叶子模块使用方式2
  * 针对叶子节点使用方式1

## 八、常见的集合

### 1、Vector

```rs
    // 1. Vector 可变数组

    // 通过构造函数创建
    let v: Vec<i32> = Vec::new();
    // 通过宏创建，可以推断出类型
    let v = vec![1, 2, 3];

    // 更新Vector
    let mut v = Vec::new(); // 必须是不可变，否则报错
    v.push(5);
    v.push(6);
    v.push(7);
    v.push(8);

    // 垃圾回收
    {
        let v = vec![1,2,3,4,5];
        // 处理变量
    } //  <- 这里 v 离开作用域并被丢弃，包括内部的整数元素

    // 读取元素
    let v = vec![1,2,3,4,5];
    let third: &i32 = &v[2];
    println!("第三个元素是 {}", third);
    match v.get(2) { // get 返回一个Option
        Some(third) => println!("第三个元素是 {}", third),
        None => println!("没有第三个元素"),
    }

    let v = vec![1, 2, 3, 4, 5];
    // 使用 [] 访问不存在的元素将触发 panic
    // let does_not_exist = &v[100];
    // 使用get会返回一个None 不会触发异常
    let does_not_exist = v.get(100);

    let mut v = vec![1, 2, 3, 4, 5];
    let first = &v[0];
    // 此句将编译报错，因为上一句已经将 可变的v借用给不可便的first了
    // 原因是：v是可变数组，push可能触发内存分配，这样会破坏first的引用，导致引用悬空
    // v.push(6);
    println!("The first element is: {}", first);

    // 元素遍历
    let v = vec![100, 32, 57];
    for i in &v {
        println!("{}", i);
    }

    // 遍历过程中改变元素值
    let mut v = vec![100, 32, 57];
    for i in &mut v {
        *i += 50;
    }

    // 使用枚举来存储多种类型
    enum SpreadsheetCell {
        Int(i32),
        Float(f64),
        Text(String),
    }
    let row = vec![
        SpreadsheetCell::Int(3),
        SpreadsheetCell::Text(String::from("blue")),
        SpreadsheetCell::Float(10.12),
    ];

    // 访问并修改值
    let mut v = vec![1, 2, 4];
    if v[2] != 3 {
        v[2] = 3;
    }
```

### 2、字符串

```rs
    // 2. String 可变字符串
    // Rust 中的字符串常用的有两种：
    //   str rust核心字符串，字面量字符串类型，utf8编码
    //   String 标准库字符串，可变字符串，utf8编码
    // 除了以上两种还有其他字符串实现，比如：OsString、OsStr、CString 和 CStr

    // 创建一个空的String字符串，通过构造函数
    let mut s = String::new();

    // 通过字面量字符串&str创建字符串String
    let data = "initial contents";
    let s = data.to_string();
    // 该方法也可直接用于字符串字面值：
    let s = "initial contents".to_string();

    // 以上方法等价于 String::from
    let hello = String::from("السلام عليكم");
    let hello = String::from("Dobrý den");
    let hello = String::from("Hello");
    let hello = String::from("שָׁלוֹם");
    let hello = String::from("नमस्ते");
    let hello = String::from("こんにちは");
    let hello = String::from("안녕하세요");
    let hello = String::from("你好");
    let hello = String::from("Olá");
    let hello = String::from("Здравствуйте");
    let hello = String::from("Hola");

    // 更新字符串
    let mut s1 = String::from("foo");
    let s2 = "bar";
    s1.push_str(s2); // 并不会获取s2所有权
    println!("s2 is {}", s2);

    let mut s = String::from("lo");
    s.push('l'); // 添加一个字符

    // 字符串拼接
    let s1 = String::from("Hello, ");
    let s2 = String::from("world!");
    // + 的签名类似与： fn add(self, s: &str) -> String {
    // 注意 s1 被移动了，不能继续使用，因为self声明类型为 String 而不是 引用，所有权转移了
    // 同时 s2 使用 解引用强制多态 转换为 &str 类型（&s2[..]）所以s2仍能使用
    let s3 = s1 + &s2;

    // 使用 format! 宏进行拼接
    let s1 = String::from("tic");
    let s2 = String::from("tac");
    let s3 = String::from("toe");
    let s = format!("{}-{}-{}", s1, s2, s3);

    // String 不支持 索引
    let s1 = String::from("hello");
    // let h = s1[0]; // 报错

    // String 内部实现为 Vec<u8> 的封装，编码方式为utf8
    // 不提供索引的原因是：utf8是边长编码。无法精确定位字符
    // str支持索引，slice，但是遇到多字节字符可能引发panic
    let hello = "Здравствуйте";
    let s = &hello[0..4]; // 实际上返回 Зд
    // let s = &hello[0..1]; // 报错，因为返回的字符串是不合法的utf8编码

    // 遍历字符串
    for c in "नमस्ते".chars() {
        println!("{}", c);
    }
```

### 3、HashMap

```rs
    // 3. HashMap
    // key需要实现 Hash 和 Eq 特质，才能全功能使用
    // 创建
    use std::collections::HashMap;
    let mut scores = HashMap::new();
    scores.insert(String::from("Blue"), 10);
    scores.insert(String::from("Yellow"), 50);
    // 通过 zip创建
    let teams  = vec![String::from("Blue"), String::from("Yellow")];
    let initial_scores = vec![10, 50];
    let scores: HashMap<_, _> = teams.iter().zip(initial_scores.iter()).collect();

    // 哈希 map 和所有权
    let field_name = String::from("Favorite color");
    let field_value = String::from("Blue");
    let mut map = HashMap::new();
    map.insert(field_name, field_value);
    // 这里 field_name 和 field_value 不再有效，
    // 尝试使用它们看看会出现什么编译错误！
    // println!("{}", field_name); // 报错
    // println!("{}", field_value); // 报错

    // 访问HashMap中的值
    let mut scores = HashMap::new();
    scores.insert(String::from("Blue"), 10);
    scores.insert(String::from("Yellow"), 50);
    let team_name = String::from("Blue");
    let score = scores.get(&team_name);

    // 遍历HashMap
    let mut scores = HashMap::new();
    scores.insert(String::from("Blue"), 10);
    scores.insert(String::from("Yellow"), 50);
    for (key, value) in &scores {
        println!("{}: {}", key, value);
    }

    // 更新哈希 map
    let mut scores = HashMap::new();
    scores.insert(String::from("Blue"), 10);
    scores.insert(String::from("Blue"), 25);
    println!("{:?}", scores);

    // 只在键没有对应值时插入
    let mut scores = HashMap::new();
    scores.insert(String::from("Blue"), 10);
    scores.entry(String::from("Yellow")).or_insert(50);
    scores.entry(String::from("Blue")).or_insert(50);
    println!("{:?}", scores);

    // 根据旧值更新一个值
    let text = "hello world wonderful world";
    let mut map = HashMap::new();
    for word in text.split_whitespace() {
        let count = map.entry(word).or_insert(0);
        *count += 1;
    }
    println!("{:?}", map);
```

## 九、泛型、特质

### 1、泛型

rust 的 泛型类型实现方式C++中的模板，在编译时会被具象化出二进制代码（单态化（monomorphization））。（与Java泛型不同，Java泛型运行时擦除实现）

* 单态化优缺点
  * 运行时没有额外性能损失
  * 编译产物体积相对较大
* 类型擦除
  * 运行时有额外的性能损失
  * 编译产物体积相对较小

```rs
    // 结构体使用泛型声明
    struct Point<T> {
        x: T,
        y: T,
    }
    let integer = Point { x: 5, y: 10 };
    let float = Point { x: 1.0, y: 4.0 };

    // 结构体使用多个泛型
    struct Point1<T, U> {
        x: T,
        y: U,
    }
    let both_integer = Point1 { x: 5, y: 10 };
    let both_float = Point1 { x: 1.0, y: 4.0 };
    let integer_and_float = Point1 { x: 5, y: 4.0 };

    // 枚举中使用泛型
    enum Option<T> {
        Some(T),
        None,
    }
    enum Result<T, E> {
        Ok(T),
        Err(E),
    }

    // 为泛型实现方法
    impl<T> Point<T> {
        fn x(&self) -> &T {
            &self.x
        }
    }

    // 实现一个泛型的具象化方法
    // 本例为浮点类型的点实现计算欧拉距离的方法
    impl Point<f32> {
        fn distance_from_origin(&self) -> f32 {
            (self.x.powi(2) + self.y.powi(2)).sqrt()
        }
    }

    // 为泛型结构体实现一个泛型方法
    impl<T, U> Point1<T, U> {
        fn mixup<V, W>(self, other: Point1<V, W>) -> Point1<T, W> {
            Point1 {
                x: self.x,
                y: other.y,
            }
        }
    }
```

### 2、特质（trait）

类似go语言的接口

```rs
use std::fmt::Display;

fn main() {
    // 结构体使用泛型声明
    struct Point<T> {
        x: T,
        y: T,
    }
    let integer = Point { x: 5, y: 10 };
    let float = Point { x: 1.0, y: 4.0 };

    // 结构体使用多个泛型
    struct Point1<T, U> {
        x: T,
        y: U,
    }
    let both_integer = Point1 { x: 5, y: 10 };
    let both_float = Point1 { x: 1.0, y: 4.0 };
    let integer_and_float = Point1 { x: 5, y: 4.0 };

    // 枚举中使用泛型
    enum Option<T> {
        Some(T),
        None,
    }
    enum Result<T, E> {
        Ok(T),
        Err(E),
    }

    // 为泛型实现方法
    impl<T> Point<T> {
        fn x(&self) -> &T {
            &self.x
        }
    }

    // 实现一个泛型的具象化方法
    // 本例为浮点类型的点实现计算欧拉距离的方法
    impl Point<f32> {
        fn distance_from_origin(&self) -> f32 {
            (self.x.powi(2) + self.y.powi(2)).sqrt()
        }
    }

    // 为泛型结构体实现一个泛型方法
    impl<T, U> Point1<T, U> {
        fn mixup<V, W>(self, other: Point1<V, W>) -> Point1<T, W> {
            Point1 {
                x: self.x,
                y: other.y,
            }
        }
    }

    // 定义一个 特质
    pub trait Summary {
        fn summarize(&self) -> String;
    }

    // 为类型实现 trait
    pub struct NewsArticle {
        pub headline: String,
        pub location: String,
        pub author: String,
        pub content: String,
    }

    impl Summary for NewsArticle {
        fn summarize(&self) -> String {
            format!("{}, by {} ({})", self.headline, self.author, self.location)
        }
    }

    pub struct Tweet {
        pub username: String,
        pub content: String,
        pub reply: bool,
        pub retweet: bool,
    }

    impl Summary for Tweet {
        fn summarize(&self) -> String {
            format!("{}: {}", self.username, self.content)
        }
    }

    // 特质默认实现
    pub trait Summary1 {
        fn summarize(&self) -> String {
            String::from("(Read more...)")
        }
    }
    pub struct NewsArticle1 {
        pub headline: String,
        pub location: String,
        pub author: String,
        pub content: String,
    }
    impl Summary1 for NewsArticle1 {
    }
    let article = NewsArticle {
    headline: String::from("Penguins win the Stanley Cup Championship!"),
        location: String::from("Pittsburgh, PA, USA"),
        author: String::from("Iceburgh"),
        content: String::from("The Pittsburgh Penguins once again are the best
        hockey team in the NHL."),
    };
    println!("New article available! {}", article.summarize());

    // trait 作为函数参数
    pub fn notify(item: impl Summary) {
        println!("Breaking news! {}", item.summarize());
    }
    // trait 作为函数参数（Trait Bound）
    pub fn notify2<T: Summary>(item: T) {
        println!("Breaking news! {}", item.summarize());
    }

    pub fn notify3<T: Summary>(item1: T, item2: T) {
    }

    // 通过 + 指定多个 trait bound
    pub fn notify4(item: impl Summary + Display) {
    }

    pub fn notify5<T: Summary + Display>(item: T) {
    }

    // 使用where语法
    trait Debug{}
    fn some_function<T: Display + Clone, U: Clone + Debug>(t: T, u: U) -> i32 {0}
    fn some_function1<T, U>(t: T, u: U) -> i32
        where T: Display + Clone,
              U: Clone + Debug
    {
        0
    }

    // trait 作为函数返回值
    fn returns_summarizable() -> impl Summary { // 只能返回单一类型
        Tweet {
            username: String::from("horse_ebooks"),
            content: String::from("of course, as you probably already know, people"),
            reply: false,
            retweet: false,
        }
    }

    // 以下代码报错：因为只能返回单一类型
    // fn returns_summarizable1(switch: bool) -> impl Summary {
    //     if switch {
    //         NewsArticle {
    //             headline: String::from("Penguins win the Stanley Cup Championship!"),
    //             location: String::from("Pittsburgh, PA, USA"),
    //             author: String::from("Iceburgh"),
    //             content: String::from("The Pittsburgh Penguins once again are the best
    //             hockey team in the NHL."),
    //         }
    //     } else {
    //         Tweet {
    //             username: String::from("horse_ebooks"),
    //             content: String::from("of course, as you probably already know, people"),
    //             reply: false,
    //             retweet: false,
    //         }
    //     }
    // }

    // 例子：实现 largest 函数
    fn largest<T: PartialOrd + Copy>(list: &[T]) -> T {
        let mut largest = list[0];
        for &item in list.iter() {
            if item > largest {
                largest = item;
            }
        }
        largest
    }
    let number_list = vec![34, 50, 25, 100, 65];

    let result = largest(&number_list);
    println!("The largest number is {}", result);

    let char_list = vec!['y', 'm', 'a', 'q'];

    let result = largest(&char_list);
    println!("The largest char is {}", result);

    // 使用 trait bound 有条件地实现方法
    struct Pair<T> {
        x: T,
        y: T,
    }
    impl<T> Pair<T> {
        fn new(x: T, y: T) -> Self {
            Self {
                x,
                y,
            }
        }
    }
    impl<T: Display + PartialOrd> Pair<T> {
        fn cmp_display(&self) {
            if self.x >= self.y {
                println!("The largest member is x = {}", self.x);
            } else {
                println!("The largest member is y = {}", self.y);
            }
        }
    }
}
```

## 十、生命周期

rust 特有，声明周期也是一种泛型，用来防止引用悬空，辅助借用检查器进行检查。

### 1、显示使用

每个引用都有声明周期，声明方式如下：

```rs
&i32        // 引用
&'a i32     // 带有显式生命周期的引用
&'a mut i32 // 带有显式生命周期的可变引用

fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
}
```

样例

```rs
    // 1. 生命周期避免了悬垂引用
    // {
    //     let r; // 不可便变量只允许赋值一次
    //     {
    //         let x = 5;
    //         r = &x; // Error `x` does not live long enough，声明周期不同借用检查器不允许
    //     }
    //     println!("r: {}", r);
    // }

    // 2. 生命周期一致才可以
    {
        let x = 5;            // ----------+-- 'b
                              //           |
        let r = &x;           // --+-- 'a  |
                              //   |       |
        println!("r: {}", r); //   |       |
                              // --+       |
    }

    // 3. 函数中的泛型生命周期
    // 'a 表示一个生命周期注解，表示x、y参数和返回值必须拥有相同的生命周期
    // 调用时，'a 取x、y最小的生命周期
    fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
        if x.len() > y.len() {
            x
        } else {
            y
        }
    }
    // 正确调用，'a = string2 的声明周期
    {
        let string1 = String::from("long string is long");
        {
            let string2 = String::from("xyz");
            let result = longest(string1.as_str(), string2.as_str());
            println!("The longest string is {}", result);
        }
    }
    // // 错误调用，'a = string2 的声明周期，result是 'a 的父声明周期
    // {
    //     let string1 = String::from("long string is long");
    //     let result;
    //     {
    //         let string2 = String::from("xyz");
    //         result = longest(string1.as_str(), string2.as_str());
    //     }
    //     println!("The longest string is {}", result);
    // }

    // 4. 结构体定义中的生命周期注解
    // 这个注解意味着 ImportantExcerpt 的实例不能比其 part 字段中的引用存在的更久。
    struct ImportantExcerpt<'a> {
        part: &'a str,
    }
    impl<'a> ImportantExcerpt<'a> {
        fn level(&self) -> i32 {
            3
        }
        fn announce_and_return_part(&self, announcement: &str) -> &str {
            println!("Attention please: {}", announcement);
            self.part
        }
    }
    {
        let novel = String::from("Call me Ishmael. Some years ago...");
        let first_sentence = novel.split('.')
            .next()
            .expect("Could not find a '.'");
        let i = ImportantExcerpt { part: first_sentence };
    }
```

### 2、生命周期省略规则

* 第一条规则是每一个是引用的参数都有它自己的生命周期参数。换句话说就是，有一个引用参数的函数有一个生命周期参数：`fn foo<'a>(x: &'a i32)`，有两个引用参数的函数有两个不同的生命周期参数，fn `foo<'a, 'b>(x: &'a i32, y: &'b i32)`，依此类推。
* 第二条规则是如果只有一个输入生命周期参数，那么它被赋予所有输出生命周期参数：`fn foo<'a>(x: &'a i32) -> &'a i32`。
* 第三条规则是如果方法有多个输入生命周期参数，不过其中之一因为方法的缘故为 `&self` 或 `&mut self`，那么 self 的生命周期被赋给所有输出生命周期参数。第三条规则使得方法更容易读写，因为只需更少的符号。

### 3、静态生命周期

'static，其生命周期能够存活于整个程序期间。所有的字符串字面值都拥有 'static 生命周期，我们也可以选择像下面这样标注出来：

```rs
let s: &'static str = "I have a static lifetime.";
```

### 4、结合泛型类型参数、trait bounds 和生命周期

```rs
    fn longest_with_an_announcement<'a, T>(x: &'a str, y: &'a str, ann: T) -> &'a str
        where T: Display
    {
        println!("Announcement! {}", ann);
        if x.len() > y.len() {
            x
        } else {
            y
        }
    }
```

## 十一、测试

### 1、单元测试

* 使用 `#[cfg(test)] ` 注解的模块
  * 在模块中使用 `#[test]` 注解的函数为单元测试函数
* 代码写在 `src` 目录下

创建一个测试模块 `cargo new rusttest --lib`

编写 `src/lib.rc` 文件

```rs
pub fn add_two(base: i32) -> i32{
    base + 2
}

// src 内部的一般是单元测试
#[cfg(test)] // 只在执行 cargo test 时才编译和运行测试代码 cargo build 将忽略该模块
mod tests {
    #[test] // 表示当前函数为测试函数
    fn it_works() {
        assert_eq!(2 + 2, 4);
    }

    #[test]
    fn another() {
        panic!("Make this test fail");
    }

    #[test]
    #[should_panic] // 抛出所有异常都将测试通过
    fn should_panic() {
        panic!("应该抛出异常");
    }

    #[test]
    #[should_panic(expected = "应该抛出异常")] // 只期望指定的异常
    fn should_special_panic() {
        panic!("应该抛出异常");
    }

    #[test]
    fn should_fail() {
        assert_ne!(1, 2);
        assert!(true, "测试失败的消息");
        assert_eq!(1, 2, "{} == {} 测试失败", 1, 2);
    }

    #[test]
    fn result() -> Result<(), String> { // 使用Result报告测试结果，如果返回Ok测试通过，返回Err测试失败
        if 2 + 2 == 5 {
            Ok(())
        } else {
            Err(String::from("two plus two does not equal four"))
        }
    }

    #[test]
    #[ignore]  // 忽略该测试
    fn ignore() {
        assert!(true);
    }
}
```

运行测试

```bash
cargo test  # 运行测试
cargo test --help  # 查看相关参数
cargo test -- --test-threads=1  # 测试二进制文件的测试线程数
cargo test -- --nocapture  # 不显示println! 命令行输出
cargo test it_works  # 运行指定的测试
cargo test should  # 运行指定的测试包含should的测试
cargo test -- --ignored  # 运行`#[ignore]`的测试函数
```

* `--` 分隔符之后的参数将被传递到测试二进制文件

### 2、集成测试

创建 `tests` 目录

编写测试文件 `tests/mytest.rs`

```rs
// test 目录只能测试src/lib.rs中声明的包，不能测试src/main.rs
// use rusttest; // 此种方式也可以
// 声明被测试的外部 crate，就像其他使用该 crate 的程序要声明的那样。
extern crate rusttest;

mod common;


#[test]
fn it_adds_two() {
    common::setup();
    assert_eq!(4, rusttest::add_two(2));
}

```

测试使用的模块建议使用目录方式创建，创建文件 `tests/common/mod.rs`

```rs
pub fn setup() {
    // 编写特定库测试所需的代码
}
```

运行集成测试

```bash
cargo test it_adds_two # 运行指定测试
cargo test --test mytest # 运行指定测试文件中的测试
```

## 十二、最佳实践

### 1、二进制项目的组织结构

main 函数负责多个任务的组织问题在许多二进制项目中很常见。所以 Rust 社区开发出一类在 main 函数开始变得庞大时进行二进制程序的关注分离的指导性过程。这些过程有如下步骤：

* 将程序拆分成 main.rs 和 lib.rs 并将程序的逻辑放入 lib.rs 中。
* 当命令行解析逻辑比较小时，可以保留在 main.rs 中。
* 当命令行解析开始变得复杂时，也同样将其从 main.rs 提取到 lib.rs 中。

经过这些过程之后保留在 main 函数中的责任应该被限制为：

* 使用参数值调用命令行解析逻辑
* 设置任何其他的配置
* 调用 lib.rs 中的 run 函数
* 如果 run 返回错误，则处理这个错误

## 十三、例子：grep

创建项目 `cargo new minigrep`

编写主逻辑 `src/lib.rs`

```rs
use std::fs;
use std::error::Error;
use std::env;


// 命令行输入结构体
pub struct Config {
    pub query: String,
    pub filename: String,
    pub case_sensitive: bool,
}

impl Config {
    // 构造函数
    pub fn new(args: &[String]) -> Result<Config, &'static str> { // 使用Result包裹返回
        if args.len() < 3 {
            return Err("not enough arguments");
        }

        let query = args[1].clone();
        let filename = args[2].clone();
        let case_sensitive = env::var("CASE_INSENSITIVE").is_err(); // 读取环境变量

        Ok(Config { query, filename, case_sensitive })
    }
}


pub fn run(config: Config) -> Result<(), Box<dyn Error>> {
    let contents = fs::read_to_string(config.filename)?; // ? 传递出错误

    // println!("With text:\n{}", contents);

    let results = if config.case_sensitive { // 根据是否区分大小写调用函数
        search(&config.query, &contents)
    } else {
        search_case_insensitive(&config.query, &contents)
    };

    for line in results { // 输出结果
        println!("{}", line);
    }

    Ok(())
}

pub fn search<'a>(query: &str, contents: &'a str) -> Vec<&'a str> { // 返回结果生命周期与content一致
    let mut results = Vec::new();
    // 遍历每一行进行判断
    for line in contents.lines() {
        if line.contains(query) {
            results.push(line);
        }
    }

    results
}

pub fn search_case_insensitive<'a>(query: &str, contents: &'a str) -> Vec<&'a str> {
    let query = query.to_lowercase();
    let mut results = Vec::new();

    for line in contents.lines() {
        if line.to_lowercase().contains(&query) {
            results.push(line);
        }
    }

    results
}

// 单元测试： TDD 应该优先实现单元测试函数
#[cfg(test)]
mod tests {
    use super::*;

    // 测试用例：对不区分大消息进行测试
    #[test]
    fn one_result() {
        let query = "duct";
        let contents = "\
Rust:
safe, fast, productive.
Pick three.";

        assert_eq!(
            vec!["safe, fast, productive."],
            search(query, contents)
        );
    }

    #[test]
    fn case_insensitive() {
        let query = "rUsT";
        let contents = "\
Rust:
safe, fast, productive.
Pick three.
Trust me.";

        assert_eq!(
            vec!["Rust:", "Trust me."],
            search_case_insensitive(query, contents)
        );
    }
}
```

编写入口函数 `src/main.rs`

```rs
use std::env;
use minigrep::Config;
use std::process;


/**
 * 实现一个类似grep的命令行工具
 */
fn main() {
    // println!("Hello, world!");
    // 读取命令行参数
    let args: Vec<String> = env::args().collect(); // 读取命令行参数
    // println!("{:?}", args);

    // 解析命令行参数
    let config = Config::new(&args).unwrap_or_else(|err| { // 闭包函数处理异常
        eprintln!("Problem parsing arguments: {}", err); // 输出到标准出错流
        process::exit(1);
    });

    // println!("Searching for {}", config.query);
    // println!("In file {}", config.filename);

    // 执行主函数
    if let Err(e) = minigrep::run(config) {
        eprintln!("Application error: {}", e);

        process::exit(1);
    }
}
```
