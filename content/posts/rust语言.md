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

## 六、枚举和模式匹配

创建测试项目 `cargo new enums`

### 1、定义枚举

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

### 2、模式匹配

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

### 3、if let 单条件模式匹配符

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