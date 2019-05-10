---
title: Dart笔记
date: 2019-03-17T11:56:11+08:00
draft: false
toc: true
comments: true
aliases:
  - /detail/188
  - /detail/188/
tags:
  - 其他编程语言
---

> [官方](https://www.dartlang.org/)
> [创建包](https://www.dartlang.org/guides/libraries/create-library-packages)
> [指南](https://www.dartlang.org/guides/language/language-tour)
> [系统库](https://www.dartlang.org/guides/libraries/create-library-packages)
> [来自Java](https://codelabs.developers.google.com/codelabs/from-java-to-dart/)

## 〇、简介安装开发环境

***

[官网](https://www.dartlang.org/)

### 1、简介

* 一门客户端开发语言，可以开发Web、Android、IOS应用
* Google开发
* 静态类型、类型安全面向对象的语言
* 不支持函数重载
* 多门语言的集合体
	* JavaScript 的异步特性（async、await）
	* C++ 构造函数初始化列表、运算符重载、const
	* Java 支持继承、接口、注解、泛型、final
	* Scala mixin 组合、支持省略new关键字
	* Python 生成器迭代器、非必须捕捉的异常（支持其他抛出非异常类型）

### 2、安装

mac

```bash
brew tap dart-lang/dart
brew install dart
```

### 3、开发环境搭建

* 安装VSCode
* 安装dart插件

### 4、包管理

#### （1）pub

包管理工具`pub`，在darkSDK中存在

常用命令

* `pub get` 下载依赖
* `pub deps` 查看依赖关系
* `pub global` 运行激活命令
* `pub run` 运行一个脚本

```bash
pub run bin/main.dart
```

#### （2）创建项目

```bash
pub global run stagehand package-simple  # 简单项目
pub global run stagehand console-full  # 命令行
```

或者VSCode运行命令`dart: New Project`

#### （3）包结构

```
. (root dir)
├── CHANGELOG.md
├── README.md
├── analysis_options.yaml
├── example
├── lib
├── pubspec.lock
├── pubspec.yaml
└── test
```

* 必须的文件为`pubspec.yaml`此文件为包的一些属性文件
* 必须的目录为`lib` 该目录存放源代码文件
	* 按照惯例应该包含`src`子目录用于存放源代码，按照惯例是私有
	* 需要导出的内容通过lib下的一个文件进行导出
* 可选的目录
	* `web` 创建一个前端项目，包含html css等
	* `bin` 创建一个后台项目，一般包含一个`main.dart`文件
	* `example` 创建一个包程序，包含`*.dart`文件

```dart
/// Support for doing something awesome.
///
/// More dartdocs go here.
library syntax_learn;

export 'src/syntax_learn_base.dart';

// TODO: Export any libraries intended for clients of this package.
```

## 一、语法特性

***

### 1、包导入导出

* Dart中一个文件就是一个模块，文件中的所有非`_`开头的名字都会在import时导入，一个文件内的所有符号都可见
* `park`和`park of` 作用是将多个文件中的所有非`_`开头的名字都相互可见，并且在import一个包含`library`的文件后所有的文件符号都会被导入（不推荐使用，官方解释不够清晰）
* `export 'url'`  组合导出，import后悔将该文件和export的文件的所有的非`_`开头的符号全部导出

**导入**

```dart
// 引入系统包
import 'dart:html';
// 使用pub包管理工具引入一个包
import 'package:test/test.dart';
// 使用相对路径引入一个包
import 'lib/student/student.dart';
// 支持任何uri协议
import 'http://hello/hello.dart';

// 完全导入：以上均为完全导入

// 部分导入
// 只导入几个少数
import 'package:math' show Random;
// 隐藏几个少数
import 'package:math' hide Random;

// 别名
import 'package:math' as mymath;

// 延迟导入
import 'package:greetings/hello.dart' deferred as hello;
Future greet() async { //延迟导入之前必须手动加载
  await hello.loadLibrary();
  hello.printGreeting();
}
```

**导出（不适用part）**

`lib/export.dart`

```dart
library export;

export 'src/export.dart';
```

`lib/src/export.dart`

```dart
num add(num a, num b) {
  return a + b;
}
```

main

```dart
import 'package:syntax_learn/export.dart';

// Define a function.
printInteger(int aNumber) {
  print('The number is $aNumber.'); // Print to console.
}

// This is where the app starts executing.
main() {
  var number = 42; // Declare and initialize a variable.
  printInteger(number); // Call a function.
  printInteger(add(1, 2));
  printInteger(min3(1, 2, 3));
}
```

**导出使用 part**

`lib/part.dart`

```dart
library part;

part 'src/part/part1.dart';
part 'src/part/part2.dart';
```

`lib/src/part/part1.dart`

```dart
part of part;

num min2(num a, num b) {
  return a < b ? a : b;
}
```

`lib/src/part/part2.dart`

```dart
part of part;

num min3(num a, num b, num c) {
  return min2(min2(a, b), c);
}
```

main

```dart
import 'package:syntax_learn/syntax_learn.dart';

// Define a function.
printInteger(int aNumber) {
  print('The number is $aNumber.'); // Print to console.
}

// This is where the app starts executing.
main() {
  printInteger(min3(1, 2, 3));
}
```

### 2、重要概念

* 一切都是对象包括：数字、字符串、null、函数、类，都是Object的子类
* 强类型，支持类型推断
* 支持泛型
* 支持顶层函数
* 使用`_`表示私有的
* 同时支持表达式和语句

### 3、变量

object 和 dynamic 区别

* dynamic 变量不会进行类型检查（直接是弱类型）
* object 变量是强类型会进行类型检查

```dart
variableTest() {
  var name = 'Bob';

  dynamic name1 = 'Bob'; // 不要使用

  String name2 = 'Bob';

  final name3 = 'Bob'; // Without a type annotation

  final String nickname = 'Bobby';

  const bar = 1000000; // Unit of pressure (dynes/cm2)
  const double atm = 1.01325 * bar; // Standard atmosphere

  var foo = const [];
  final bar1 = const [];
  const baz = []; // Equivalent to `const []`

  foo = [1, 2, 3]; // Was const []

  // String -> int
  var one = int.parse('1');
  assert(one == 1);

  // String -> double
  var onePointOne = double.parse('1.1');
  assert(onePointOne == 1.1);

  // int -> String
  String oneAsString = 1.toString();
  assert(oneAsString == '1');

  // double -> String
  String piAsString = 3.14159.toStringAsFixed(2);
  assert(piAsString == '3.14');

  const msPerSecond = 1000;
  const secondsUntilRetry = 5;
  const msUntilRetry = secondsUntilRetry * msPerSecond;

  var s1 = 'Single quotes work well for string literals.';
  var s2 = "Double quotes work just as well.";
  var s3 = 'It\'s easy to escape the string delimiter.';
  var s4 = "It's even easier to use the other delimiter.";

  var s = r'In a raw string, not even \n gets special treatment.';

  var names = <String>{};

  final constantSet = const {
    'fluorine',
    'chlorine',
    'bromine',
    'iodine',
    'astatine',
  };

  var gifts = {
    // Key:    Value
    'first': 'partridge',
    'second': 'turtledoves',
    'fifth': 'golden rings'
  };

  var nobleGases = {
    2: 'helium',
    10: 'neon',
    18: 'argon',
  };

  gifts['first'] = 'partridge';
  gifts['second'] = 'turtledoves';
  gifts['fifth'] = 'golden rings';

  nobleGases[2] = 'helium';
  nobleGases[10] = 'neon';
  nobleGases[18] = 'argon';

  var clapping = '\u{1f44f}';
  print(clapping);
  print(clapping.length);
  print(clapping.codeUnits);
  print(clapping.runes.toList());

  var sym = #doSomething; // 符号

  Runes input = new Runes(
      '\u2665  \u{1f605}  \u{1f60e}  \u{1f47b}  \u{1f596}  \u{1f44d}');
  print(new String.fromCharCodes(input));
  print(input.length);

  var s10 = #radix;
  var s11 = #bar;
  print(s10);
  print(s11);
}
```

### 4、函数

```dart
import 'package:meta/meta.dart';

/// 动态类型：不写类型
isNull(obj) {
  return obj == null;
}

/// 声明类型
bool isNotNull(Object obj) {
  return obj != null;
}

/// 箭头函数：只支持一条表达式
bool isZero(num n) => n == 0;

/// 可选命名参数
void enableFlags(int a, {@required bold, hidden = false}) {
  print(a);
  print(bold);
  print(hidden);
}

/// 可选位置参数
String say(String from, String msg, [String device]) {
  var result = '$from says $msg';
  if (device != null) {
    result = '$result with a $device';
  }
  return result;
}

void doStuff(
    {List<int> list = const [1, 2, 3],
    Map<String, String> gifts = const {
      'first': 'paper',
      'second': 'cotton',
      'third': 'leather'
    }}) {
  print('list:  $list');
  print('gifts: $gifts');
}

var loudify = (msg) => '!!! ${msg.toUpperCase()} !!!';

foo() {}

testFunction() {
  enableFlags(0);
  enableFlags(1, bold: false);
  enableFlags(2, bold: true, hidden: false);

  print(say("tom", "hi"));
  print(say("小明", "你好", 'Android'));

  doStuff();

  () {
    print("匿名函数");
  }();

  assert(foo() == null);

}
```

### 5、操作符

```dart
class Person {
  String name;
  Person(this.name);

  void say1() {
    print('say1');
  }

  void say2() {
    print('say2');
  }
}

testOperator() {
  assert(5 / 2 == 2.5); // Result is a double
  assert(5 ~/ 2 == 2); // Result is an int 整除

  assert('5/2 = ${5 ~/ 2} r ${5 % 2}' == '5/2 = 2 r 1');

  // Type test operators 类型操作
  bool c = true;
  if (c is bool) {
    // 类型检查
    c = false;
    print(c);
  }
  dynamic emp = Person('Tim');
  dynamic o;

  (emp as Person).name = 'Bob';
  // (o as Person).name = 'Bob'; // 报错
  (o as Person)?.name = 'Bob';

  // 如果o是null，将2赋值给o
  o ??= 2;
  print(o);
  // 如果o不是null，将忽略复制
  o ??= 3;
  print(o);
  // Assign value to o
  o = 1;
  print(o);

  print(null ?? 'null');
  print(1 ?? 'not null');
}
```

### 6、控制流

```dart
testControlFlow(){
  for (var i = 0; i < 5; i++) {
    print('!');
  }

  for (var item in [1, 2, 3]) {
    print(item);
  }

  var command = 'CLOSED';
  switch (command) {
    case 'CLOSED': // Empty case falls through.
    case 'NOW_CLOSED':
      // Runs for both CLOSED and NOW_CLOSED.
      print('switch');
      break;
  }

  switch (command) {
    case 'CLOSED':
      print('CLOSE');
      continue nowClosed;
    // Continues executing at the nowClosed label.

    nowClosed:
    case 'NOW_CLOSED':
      // Runs for both CLOSED and NOW_CLOSED.
      print('NOW_CLOSED');
      break;
  }
}
```

### 7、异常

* 非受检异常

```dart
testException() {
  try {
    throw FormatException('Expected at least 1 section');
  } catch (e) {
    print(e);
  }

  try {
    throw 'Out of llamas!';
  } catch (e) {
    print(e);
  }

  try {
    throw Exception();
  } on UnimplementedError {
    print('UnimplementedError');
  } on FormatException {
    print('FormatException');
  } on Exception catch (e) {
    print(e);
  }

  try {
    throw UnimplementedError("未实现的方法");
  } catch (e, s) {
    print('Exception details:\n $e');
    print('Stack trace:\n $s');
    // rethrow; // Allow callers to see the exception.
  } finally {
    print("finally");
  }
}
```

### 8、类继承和混入

* 支持一个缺省构造函数（或一个工厂构造函数）、多个命名构造函数；也就是说不支持构造函数重载
* 支持const构造函数（能保证组合链上的对象都是const）
  * 使用const构造该类实例必须满足：构造函数的参数的构造函数为const类型。否则编译失败
* 支持静态成员函数、静态成员变量（不支持重写、支持覆盖）
* 支持抽象类
* 支持讲一个类当做一个接口
* 支持`@override`
* 支持get、set
* 支持运算符重载
* 支持枚举类型
* 支持mixin继承

```dart
import 'dart:math';

class Point {
  num x; // Declare instance variable x, initially null.
  num y; // Declare y, initially null.
  num z = 0; // Declare z, initially 0.
  num distanceFromOrigin;

  // Point():this.origin();

  // Point(num x, num y) {
  //   // There's a better way to do this, stay tuned.
  //   this.x = x;
  //   this.y = y;
  // }

  Point(this.x, this.y) : distanceFromOrigin = sqrt(x * x + y * y);

  Point.origin() {
    // this 只能放在构造函数列表
    x = 0;
    y = 0;
  }

  Point.NaN() : this(num.parse('NaN'), num.parse('NaN'));

  // Delegates to the main constructor.
  Point.alongXAxis(num x) : this(x, 0);

  num distanceTo(Point other) {
    var dx = x - other.x;
    var dy = y - other.y;
    return sqrt(dx * dx + dy * dy);
  }

  static num distanceBetween(Point a, Point b) {
    var dx = a.x - b.x;
    var dy = a.y - b.y;
    return sqrt(dx * dx + dy * dy);
  }
}

class ImmutablePoint {
  static final ImmutablePoint origin = const ImmutablePoint(0, 0);

  final num x, y;

  const ImmutablePoint(this.x, this.y);
}

class Logger {
  final String name;
  bool mute = false;

  // _cache is library-private, thanks to
  // the _ in front of its name.
  static final Map<String, Logger> _cache = <String, Logger>{};

  factory Logger(String name) {
    if (_cache.containsKey(name)) {
      return _cache[name];
    } else {
      final logger = Logger._internal(name);
      _cache[name] = logger;
      return logger;
    }
  }

  Logger._internal(this.name);

  void log(String msg) {
    if (!mute) print(msg);
  }
}

void f() {}

class Rectangle {
  num left, top, width, height;

  Rectangle(this.left, this.top, this.width, this.height);

  // Define two calculated properties: right and bottom.
  num get right => left + width;
  set right(num value) => left = value - width;
  num get bottom => top + height;
  set bottom(num value) => top = value - height;
}

abstract class Doer {
  // Define instance variables and methods...

  void doSomething(); // Define an abstract method.
}

class EffectiveDoer extends Doer {
  @override
  void doSomething() {
    // Provide an implementation, so the method is not abstract here...
  }
}

// A person. The implicit interface contains greet().
class Person1 {
  // In the interface, but visible only in this library.
  final _name;

  // Not in the interface, since this is a constructor.
  Person1(this._name);

  // In the interface.
  String greet(String who) => 'Hello, $who. I am $_name.';
}

// An implementation of the Person interface.
class Impostor implements Person1 {
  get _name => '';

  String greet(String who) => 'Hi $who. Do you know who I am?';
}

String greetBob(Person1 person) => person.greet('Bob');

class Vector {
  final int x, y;

  Vector(this.x, this.y);

  Vector operator +(Vector v) => Vector(x + v.x, y + v.y);
  Vector operator -(Vector v) => Vector(x - v.x, y - v.y);

  bool operator ==(v) => v is Vector && x == v.x && y == v.y;
  // Operator == and hashCode not shown. For details, see note below.
  // ···
}

class AA {
  // Unless you override noSuchMethod, using a
  // non-existent member results in a NoSuchMethodError.
  @override
  void noSuchMethod(Invocation invocation) {
    print('You tried to use a non-existent member: ' +
        '${invocation.memberName}');
  }
}

enum Color { red, green, blue }

abstract class Super {
  void method() {
    print("Super");
  }
}

class MySuper implements Super {
  void method() {
    print("MySuper");
  }
}

mixin Mixin on Super {
  void method() {
    super.method();
    print("Sub");
  }
}

class Client extends MySuper with Mixin {}

abstract class P {
  void method() {
    print("P");
  }
}

class C extends P {
  void method() {
    super.method();
    print("C");
  }
}

mixin A on P {
  void method() {
    super.method();
    print("A");
  }
}

mixin B on P {
  void method() {
    super.method();
    print("B");
  }
}

class AB extends C with A, B {
} //相当于 AB extends (B extends (A extends (C extends P)))

class BA extends C with B, A {
} //相当于 BA extends (A extends (B extends (C extends P)))

class Queue {
  static const initialCapacity = 16;
  // ···
}

testClass() {
  var point = Point(0, 9);
  point.x = 4; // Use the setter method for x.
  print(Point.origin());

  var constPoint = ImmutablePoint(1, 1);
  var a = const ImmutablePoint(1, 1);
  var b = const ImmutablePoint(1, 1);
  print(identical(constPoint, b)); // They are the same instance!
  print(identical(a, b)); // They are the same instance!

  const pointAndLine = const {
    'point': const [const ImmutablePoint(0, 0)],
    'line': const [const ImmutablePoint(1, 10), const ImmutablePoint(-2, 11)],
  };

  // 和上面等价
  const pointAndLine1 = {
    'point': [ImmutablePoint(0, 0)],
    'line': [ImmutablePoint(1, 10), ImmutablePoint(-2, 11)],
  };

  var pointAndLine2 = {
    'point': [Point(0, 0)],
    'line': [ImmutablePoint(1, 10), ImmutablePoint(-2, 11)],
  };

  var pointAndLine3 = const {
    'point': [ImmutablePoint(0, 0)],
    'line': [ImmutablePoint(1, 10), ImmutablePoint(-2, 11)],
  };

  var logger = Logger('UI');
  logger.log('Button clicked');

  print(greetBob(Person1('Kathy')));
  print(greetBob(Impostor()));

  final v = Vector(2, 3);
  final w = Vector(2, 2);

  print(v + w == Vector(4, 5));
  print(v - w == Vector(0, 1));

  assert(Color.red.index == 0);
  assert(Color.green.index == 1);
  assert(Color.blue.index == 2);

  List<Color> colors = Color.values;
  assert(colors[2] == Color.blue);
  Client().method();
  print("===AB===");
  AB().method();
  print("===BA===");
  BA().method();
}
```

### 9、泛型

类似于Java

```dart
var names = <String>['Seth', 'Kathy', 'Lars'];
var uniqueNames = <String>{'Seth', 'Kathy', 'Lars'};
var pages = <String, String>{
  'index.html': 'Homepage',
  'robots.txt': 'Hints for web robots',
  'humans.txt': 'We are people, not machines'
};

var nameSet = Set<String>.from(names);

T first<T>(List<T> ts) {
  // Do some initial work or error checking, then...
  T tmp = ts[0];
  // Do some additional checking or processing...
  return tmp;
}

testGenerics(){
  var names = List<String>();
  names.addAll(['Seth', 'Kathy', 'Lars']);
  print(names is List<String>);
  print(names is List<int>);
}
```

### 10、异步支持

类似于JavaScript的`await`和`async`

```dart
Future<String> lookUpVersion() async => '1.0.0';

Future<void> asyncFunction() async {
  print(await lookUpVersion());
  try {
    var version = await lookUpVersion();
  } catch (e) {
    // React to inability to look up the version
  }

  var s = Stream.fromIterable([1, 2, 3]);
  await for (var v in s) {
    // Executes each time the stream emits a value.
    if (v==3){
      break;
    }
    print(v);
  }
}

testAsync() {
  var f = asyncFunction();
}
```

### 11、生成器

* 类似于Python或者Scala的生成器
* 同步生成一个 `Iterable` 对象
* 异步生成一个 `Stream` 对象
* 支持递归生成器优化

```dart
Iterable<int> naturalsTo(int n) sync* {
  int k = 0;
  while (k < n) yield k++;
}

Stream<int> asynchronousNaturalsTo(int n) async* {
  int k = 0;
  while (k < n) yield k++;
}

Iterable<int> naturalsDownFrom(int n) sync* {
  if (n > 0) {
    yield n;
    yield* naturalsDownFrom(n - 1);
  }
}
```

### 12、可调用对象

```dart
class WannabeFunction {
  call(String a, String b, String c) => '$a $b $c!';
}

main() {
  var wf = new WannabeFunction();
  var out = wf("Hi","there,","gang");
  print('$out');
}
```

### 13、并发机制

* 使用Actor模型，不共享变量，使用消息通信
* 可以理解为客户服务器模型类似socket编程
* 和fork不同，全局变量任然为初始值，而不是spawn时刻的快照

```dart
import 'dart:async';
import 'dart:isolate';

String testShared = 'null'; // 变量不共享

Future mainIsolate() async {
  // 创建一个接收端：用于接收sub传递的发送接口
  var receivePort = new ReceivePort();
  testShared = 'main';
  // 创建一个isolate绑定，并与发送端绑定，不共享内存
  // 创建一个isolate并执行函数
  await Isolate.spawn(echo, receivePort.sendPort);
  // 等待echo发送来第一个消息，这个消息是一个SendPort对象
  SendPort sendPort = await receivePort.first;
  print('from main:' + testShared);

  var msg = await sendReceive(sendPort, "foo");
  print('received $msg');
  msg = await sendReceive(sendPort, "bar");
  print('received $msg');
}

// the entry point for the isolate
echo(SendPort sendPort) async {
  // Open the ReceivePort for incoming messages.
  // 创建主通信接口
  var port = new ReceivePort();
  print("from echo:" + testShared);
  testShared = 'sub';
  // Notify any other isolates what port this isolate listens to.
  // 将主通信接口的发送端传递出去
  sendPort.send(port.sendPort);

  await for (var msg in port) {
    var data = msg[0];
    SendPort replyTo = msg[1];
    replyTo.send(data);
    if (data == "bar") port.close();
  }
}

/// sends a message on a port, receives the response,
/// and returns the message
/// 可以理解为创建一个socket短连接，等待接收报文
Future sendReceive(SendPort port, msg) {
  ReceivePort response = new ReceivePort();
  port.send([msg, response.sendPort]);
  return response.first;
}

testIsolate() {
  mainIsolate().timeout(Duration(seconds: 1));
}
```

### 14、类型定义

```dart
typedef Compare = int Function(Object a, Object b);

class SortedCollection {
  Compare compare;

  SortedCollection(this.compare);
}

// Initial, broken implementation.
int sort(Object a, Object b) => 0;

typedef Compare1<T> = int Function(T a, T b);

int sort1(int a, int b) => a - b;

void main() {
}

void testTypedef() {
  SortedCollection coll = SortedCollection(sort);
  assert(coll.compare is Function);
  assert(coll.compare is Compare);
  assert(sort is Compare1<int>); // True!
}
```

### 15、元数据

* 类似于Java反射

```dart
import 'dart:mirrors';

class Todo {
  final String who;
  final String what;

  const Todo(this.who, this.what);

  @override
  String toString() {
    return '[TODO]' + who + ":" + what;
  }
}

@Todo('seth', 'make this do something')
void doSomething() {
  print('do something');
}

@Todo('my', 'haha')
class AAA {
  @Todo('xx', 'xx')
  func() {}
}

testMetadata() {
  ClosureMirror closureMirror = reflect(doSomething);
  print(closureMirror.function.metadata.first.reflectee);

  InstanceMirror instanceMirror = reflect(AAA());
  print(instanceMirror.type.metadata.first.reflectee);

  ClassMirror classMirror = reflectClass(AAA);
  print(classMirror.metadata.first.reflectee);

  print(classMirror.declarations[#func].metadata.first.reflectee);
}
```

### 16、注释

```dart
// 单行注释
/*
多行注释
*/

/// 文档注释 [path]，[] 会生成链接
/// 全面支持Markdown

/**
 * 文档注释，官方推荐三斜线注释
 */
```
