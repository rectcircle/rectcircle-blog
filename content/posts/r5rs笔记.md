---
title: r5rs笔记
date: 2018-01-30T17:13:37+08:00
draft: false
toc: true
comments: true
aliases:
  - /detail/125
  - /detail/125/
tags:
  - FP
---

## 一、概述

***

* 一种静态作用域的程序设计语言
* 隐式类型（相对的是显式类型的语言如c）
* 在 Scheme 计算过程中创建的所有对象,包括过程和继续(Continuation),都拥有无限的生存期 (Extent)
* 支持严格尾递归（一种递归优化技术）
* 过程参数按照值传递，即无论过程是否需要实参的值,实参表达式都会在过程获得控制权之前被求值。
* Scheme 从不区分字母的大小写形式

**标识符命名规范**

* 以`?`结尾表示一个谓词过程返回bool值
* 以`!`结尾表示该过程使用了赋值，引入了副作用
* 中间为`->`例如`list->vector`表示接收一个list返回一个vectror

## 二、词法约定

***

### 1、标识符

如果字母、数字和“扩展字符”序列中的第一个字符不是任何数值的起始字符,它就是一个标识符

例子

```
lambda
q
list->vector
soup
+
V17a
<=?
a34kTMNs
the-word-recursion-has-many-meanings
```

扩展字符有：

```
! $ % & * + - . / : < = > ? @ ^ _ ~
```

标识符用途

* 标识符可被用作一个变量或一个语法关键字
* 当标识符作为常量或在常量内部出现时

### 2、空白和注释

***

* 空白为了提高可读性，没有含义（空白字符右tab、空格、换行等）
* 注释，以分号开头

### 3、其他记法

***

* `[]{}|`保留

## 三、基本概念

***

### 1、变量、语法关键字和作用域

以下表达式将创建作用域

* lambda
* let
* let*
* letrec
* do

### 2、类型的互不相交性

基本类型判断的谓词如下

* boolean?
* symbol?
* char?
* vector?
* procedure?
* pair?
* number?
* string?
* port?

这些谓词定义了

* 布尔 (boolean)
* 点对 (pair)
* 符号 (symbol)
* 数值 (number)
* 字符 (char,或 character)
* 字符串(string)
* 向量 (vector)
* 端口 (port)
* 过程 (procedure)

## 四、表达式

***

### 1、基本表达式类型

#### （1）基本表达式类型

```scheme
(define x 28) ;变量定义
x             ;变量引用 ⇒ 28
```

#### （2）常量表达式

```scheme
(quote <datum>)
'<datum>
<constant>
```

`(quote <datum>)`或者 `'<datum>` 的 值 为 `<datum>`。`<datum>` 可 以 是
Scheme 对象的任何外部表示

```
(quote a)          ;⇒ a
(quote #(a b c))   ;⇒ #(a b c)
(quote (+ 1 2))    ;⇒ (+ 1 2)
'(quote a)         ;⇒ (quote a)
''a                ;⇒ (quote a)
```

数值常量、字符串常量、字符常量和布尔常量的值是“它们自身”,它们不需要被引用。

```scheme
'"abc"    ; ⇒ "abc"
"abc"     ; ⇒ "abc"
'145932   ; ⇒ 145932
145932    ; ⇒ 145932
'#t       ; ⇒ #t
#t        ; ⇒ #t
```

#### （3）过程调用

> `(<operator> <operand1>  ...)`

* 括号内的第一个元素是过程名
* 剩下的元素是参数，可以是常量、变量或者过程
* 返回为表达式的值
* 过程调用也被称为组合式
* `()`不是一个有效的表达式，也就是说括号内至少要有一个元素

#### （4）定义过程

> `(lambda <formals> <body>)`

* `<formals>` 为形参列表，个数大于等于0
* body为一个或者多个表达式组成的序列

```scheme
(lambda (x) (+ x x))       ⇒ 一个过程
((lambda (x) (+ x x)) 4)   ⇒ 8

(define reverse-subtract
  (lambda (x y) (- y x)))
(reverse-subtract 7 10)    ⇒ 3

(define add4
  (let ((x 4))
    (lambda (y) (+ x y))))
(add4 6)                   ⇒ 10
```

`<formals>` 应具有下面几种形式之一:

* `(<variable1>  ...)`: 过程拥有固定数量的参数。当过程被调用时,参数将被存储在相应变量的绑定中。
* `<variable>`: 过程拥有任意数量的参数。当过程被调用时,实参的序列被转换为一个新创建的表,该表存储在 hvariablei 的绑定中。
* `(<variable1> ... <variable n>  .  <variable n+1>)` 如 果一个由空格分隔的句点出现在最后一个变量之前,该过程就拥有 n 个或更多个参数,这里的 n 是句点前面形参的个数(至少要有一个)。存储在最后一个参数绑定中的值是一个新创建的表。除了已和其他形参匹配的所有其他实参外,剩余的实参都被存入该表中。

例子

```scheme
((lambda x x) 3 4 5 6)    ;⇒ (3 4 5 6)
((lambda (x y . z) z)     ;⇒ (5 6)
  3 4 5 6)
```

#### （5）条件表达式

> `(if <test> <consequent> <alternate>)`
> `(if <test> <consequent>)`

注意条件表达式不会严格求值

```scheme
(if #t 1 (/ 1 0))   ;不报错⇒ 1
```

#### （6）赋值

> `(set! <variable> <expression>)`

`set!`表达式的结果未定义（在mit-scheme中返回旧值）

```scheme
(define x 2)
(+ x 1)        ;⇒ 3
(set! x 4)     ;⇒ 未定义
(+ x 1)        ;⇒ 5
```

### 2、派生表达式类型

本部分的表达式大都可以通过宏使用基本表达式是实现可以说是一种语法糖或者库函数

#### （1）条件表达式

**cond**

> `(cond <clause1> <clause2> ...)`
> 其中`<clause>`为：
> `(<test> <expression1> ...)`
> 或者
> `(<test> => <expression>)` mit-scheme不支持
> 最后一个 hclausei 可以是一个“else 子句”,其格式是：
> `(else <expression1> <expression2> ...)`
> 当`<test>`为true时，返回其后的表达式的值

```scheme
(cond ((> 3 2) 'greater)
      ((< 3 2) 'less))    ;⇒ greater
(cond ((> 3 3) 'greater)
      ((< 3 3) 'less)
      (else 'equal))      ;⇒ equal
(cond ((assv 'b '((a 1) (b 2))) => cadr)
      (else #f))          ;⇒ 2
```

**case**

> `(case <key> <clause1> <clause2> ...)`
> 其中 `<key>` 为任意表达式
> `<clausei>` 的格式为：
> `((<datum1> ...) <expression1> <expression2> ...)` 其中的 `<datum>` 是某个对象的外部表示。所有的 `<datum>` 必须互不相同。
> 最后一个 `<clause>` 可以是“else 子句”

语义：

case 表达式的求值方式是:先对 `<key>` 求值,将其
结果与每个 hdatumi 进行比较,如果 `<key>` 的求值结果等
于(在 eqv? 的语义下;参见第 6.1 节)某个 `<datum>`,相
应的 `<clause>` 中的表达式就被从左至右顺序求值, `<clause>`
中最后一个表达式的(一个或多个)结果作为 case 表达
式的(一个或多个)结果返回。如果 `<key>` 的求值结果与
每个 `<clause>` 都不相等,那么,当存在 else 子句时,该子
句中的表达式被求值,最后一个表达式的(一个或多个)
结果就是 case 表达式的结果;否则, case 表达式的结果
是未定义的。

```scheme
(case (* 2 3)
  ((2 3 5 7) 'prime)
  ((1 4 6 8 9) 'omposite))    ;⇒ composite
(case (car '(c d))
  ((a) 'a)
  ((b) 'b))                   ;⇒ 未定义
(case (car '(c d))
  ((a e i o u) 'vowel)
  ((w y) 'semivowel)
  (else 'consonant))          ;⇒ consonant
```

**and** 与运算

**or** 或运算

#### （2）绑定结构 - 使用局部变量

**let**

> `(let <bindings> <body>)`
> `<bindings>` 的格式为: `((<variable1>  <init1>) ...)`

语义:在当前环境中,所有 `<init>` (以某种未定义的顺序)求值,所有 `<variable>` 被绑定到存储了 `<init>` 的结果
的新存储位置。 `<body>` 在扩展后的环境中求值, `<body>`中最后一个表达式的(一个或多个)结果被返回。每个
`<variable>` 的绑定都将 `<body>` 当作自己的作用域。

```scheme
(let ((x 2) (y 3))
  (* x y))              ;⇒ 6

(let ((x 2) (y 3))
  (let ((x 7)
        (z (+ x y)))
    (* z x)))           ;⇒ 35
```

**let\***

语法和`let`相同，在`let*`中但绑定是按照从左至右的顺序完成的。也就是说右边的变量可以引用左边的列表

```scheme
(let ((x 2) (y 3))
  (let* ((x 7)
         (z (+ x y)))
    (* z x)))         ;⇒ 70
```

**letrec**

语法和`let`相同，在`letrec`中但绑定是按照未定义顺序完成的。但是变量列表可以相互引用，这就导致了可以定义相互递归的局部变量

```scheme
(letrec ((even?
          (lambda (n)
            (if (zero? n)
                #t
                (odd? (- n 1)))))
         (odd?
          (lambda (n)
            (if (zero? n)
                #f
                (even? (- n 1))))))
  (even? 88))
                  ;⇒ #t
```

letrec 的最常见用法里,所有 `<init>` 都是 lambda 表达式

#### （3）顺序结构

> `(begin <expression1> <expression2> ... )`

`<expression>` 被从左至右顺序求值,最后一个 `<expression>`的(一个或多个)值被返回。这种表达式类型用于顺序执
行有“副作用 (Side effect)”的行为,如输入和输出。

```scheme
(define x 0)

(begin (set! x 5)
       (+ x 1))             ;⇒ 6

(begin (display "4 plus 1 equals ")
       (display (+ 4 1)))   ;⇒ 未定义
                         ;并打印输出 4 plus 1 equals 5
```

#### （4）迭代

**do**

```scheme
(do ((<variable1> <init1> <step1>)...)
    (<test> <expression> ...)
  <command> . . . )
```

* `<step>`可省略

参见例子

```scheme
(do ((vec (make-vector 5))
     (i 0 (+ i 1)))
		((= i 5) vec)
  (vector-set! vec i i))         ;⇒ #(0 1 2 3 4)

(let ((x '(1 3 5 7 9)))
  (do ((x x (cdr x))
       (sum 0 (+ sum (car x))))
      ((null? x) sum)))          ;⇒ 25
```

**命名let**

> `(let <name> <bindings> <body>)`

在`<body>`中可以使用`<name>`和 `<variable>` 值列表在此执行let代码块

例子

```scheme
(let loop ((numbers '(3 -2 1 6 -5))
           (nonneg '())
           (neg '()))
  (cond ((null? numbers) (list nonneg neg))
        ((>= (car numbers) 0)
         (loop (cdr numbers)
               (cons (car numbers) nonneg)
               neg))
        ((< (car numbers) 0)
         (loop (cdr numbers)
               nonneg
               (cons (car numbers) neg)))))
    ;⇒ ((6 1 3) (-5 -2))
```

#### （5）推迟求值

> `(delay <expression>)`

delay 结构与 force 过程一同使用,以实现懒惰求值或按需调用 (Call by need)。 `(delay <expression>)` 返回一个叫“承诺 (Promise)”的对象, 在未来某个时候,(force过程)可以要求该对象对 `<expression>` 求值并提供其结果。 `<expression>` 返回多个值的后果是未定义的。

#### （6）准引用

> `(quasiquote <qq template>)`
> ``<qq template>`

表达式用于在已知大部分(但不是全部)目标结构的情况下创建表或向量结构。
如果`<qq template>`中没有出现`,`那么准引用和引用结果相同。

`<qq template>`中的语法：

* `,<expression>` 等价于`(unquote <expression>)`逗号解引用，使用解析器解析逗号后面的值
* `@ <list | vector>` 等价于 `(unquote-splicing <expression>)` 解引用然后将前后括号剥离，将元素插入到@后的位置

例子

```scheme
`(list ,(+ 1 2) 4)         ;⇒ (list 3 4)
(let ((name 'a)) `(list ,name ',name))  ;⇒ (list a (quote a))
`(a ,(+ 1 2) ,@(map abs '(4 -5 6)) b)   ;⇒ (a 3 4 5 6 b)
`(( foo ,(- 10 3)) ,@(cdr '(c)) . ,(car '(cons)))
    ;⇒ ((foo 7) . cons)
`#(10 5 ,(sqrt 4) ,@(map sqrt '(16 9)) 8)
    ;⇒ #(10 5 2 4 3 8)
```

准引用格式可以嵌套，置换操作只作用于那些与最外层反引用有同样嵌套级别的解除引用的元素。对于内层直接解析

```scheme
`(a `(b ,(+ 1 2) ,(foo ,(+ 1 3) d) e) f)
          ;⇒ (a `(b ,(+ 1 2) ,(foo 4 d) e) f)

(let ((name1 'x)
      (name2 'y))
  `(a `(b ,,name1 ,',name2 d) e))
          ;⇒ (a `(b ,x ,'y d) e)
```

### 3、宏

根据关键字触发宏转换器，宏转换器根据参数个数与模式进行匹配，然后替换源代码处的宏替换（类似于c的宏）。宏替换不会对参数求值，仅仅是进行替换而已。所以可以实现stream

```scheme
(define-syntax cons-stream
  (syntax-rules ()
    ((cons-stream x y) (cons x (delay y)))))
```

#### （1）语法关键字的绑定结构

Let-syntax 和 letrec-syntax 与 let 和 letrec 类似,但它们不是将变量绑定到存储值的位置,而是将语法关键字绑定到宏转换器。

> `(let-syntax <bindings> <body>)`
> 其中`<bindings>`为：
> `((<keyword> <transformer spec>) ...)`

例子：

```scheme
(let-syntax ((when (syntax-rules ()
                     ((when test stmt1 stmt2 ...)
                      (if test
                          (begin stmt1
                                 stmt2 ...))))))
  (let ((if #t))
    (when if (set! if 'now))
  if))  ;⇒ now

(let ((x 'outer))
  (let-syntax ((m (syntax-rules () ((m) x))))
    (let ((x 'inner))
         (m))))
=⇒ outer
```

> letrec-syntax 语法 与 let-syntax 相同，但是支持相互宏的嵌套使用

例子：

```scheme
(letrec-syntax
  ((my-or (syntax-rules ()
            ((my-or) #f)
            ((my-or e) e)
            ((my-or e1 e2 ...)
              (let ((temp e1))
                (if temp
                    temp
                    (my-or e2 ...)))))))
  (let ((x #f)
        (y 7)
        (temp 8)
        (let odd?)
        (if even?))
    (my-or x
           (let temp)
           (if y)
           y)))    ⇒ 7
```

#### （2）模式语言

> `<transformer spec>` 的格式为:
> `(syntax-rules <literals> <syntax rule> ...)`
> 其中：`<literals>` 是由标识符组成的表，每个 `<syntax rule>`的格式为:
> `(<pattern> <template>)`

* 模式`<pattern>`或者是一个标识符,或者是一个常量,或者是下面记法之一:
	* `(<pattern> ...)`
	* `(<pattern> <pattern> ... . <pattern>)`
	* `(<pattern> ... <pattern> <ellipsis>)`
	* `#(<pattern> ...)`
	* `#(<pattern> ... <pattern> <ellipsis>)`
* 模板 `<template>` 或者是一个标识符,或者是一个常量,或者是下面记法之一:
	* `(<element> ...)`
	* `(<element> <element> ... . <template>)`
	* `#(<element> ...)`
* 其中`<ellips>`为标识符`...`

## 五、程序结构

***

### 1、程序

### 2、定义

定义可以出现在程序的顶层，和body的开头，定义的格式如下：

* `(define <variable> <expression>)`
	* 定义变量
* `(define (<variable> <formals>) <body>)`
	* 定义过程（等价于定义lambda类型变量），也就是：
	* `(define <variable> (lambda (<formals>) <body>))`
* `(define (<variable> . <formal>) <body>)`
	* `(define <variabe> (lambda <formal> <body>))`

说明：

* `<variable>` 变量名
* `<body>` 过程题（表达式）
* `<formals>` 是
	* 零个或更多个变量的序列
	* 一个或多个后面跟有由空格分隔的句点以及另一个变量的变量序列（可变变量）

例子

```scheme
;定义变量
(define a 1)

;定义过程
(define (1+ a)
  (+ 1 a))
;等价于
(define 1+
  (lambda (a) (+ 1 a)))

;定义过程（固定变量+可变变量）
(define (add a . args)
  (apply + (cons a args)))
;等价于
(define add
  (lambda (a . args)
	  (apply + (cons a args))))

;定义过程（可变变量）
(define (add . args)
  (apply + args))
;等价于
(define add
  (lambda args
	  (apply + args)))
```

#### （1）最高层定义

* 在程序的最高层,如果变量 `<variable>` 已绑定，则：
	* 定义`(define <variable> <expression>)`的作用等价于
	* `(set! <variable> <expression>)`
* 若变量`<variable>`没有绑定（定义），则
	* `define`将会定义绑定一个新的储存位置
	* `set!`将会报错

#### （2）内部定义

定义（`define`）可以出现在任意`<body>`的开头（即lambda、 let、let\*、 letrec、 let-syntax 或 letrec-syntax 表达式的`<body>`），这些定义称之为内部定义。内部定义为内部的局部变量，作用域为整个`<body>`。

```scheme
(let ((x 5))
  (define foo (lambda (y) (bar x y)))
  (define bar (lambda (a b) (+ (* a b) a)))
  (foo (+ x 3)))        ;=> 45
;等价于
(let ((x 5))
  (letrec ((foo (lambda (y) (bar x y)))
           (bar (lambda (a b) (+ (* a b) a))))
    (foo (+ x 3))))     ;=> 45
```

### 3、语法定义

语法定义只能出现在 `<program>` 的最高层。 它们的格式如下:
`(define-syntax <keyword> <transformer spec>)`

`<keyword>` 是一个标识符 , `<transformer spec>` 是 syntax-rules 的一个实例。

## 六、标准过程

***

类似于库函数

### 1、相等谓词

谓词是总返回布尔值(#t 或 #f)的过程。相等谓词在计算上对应于数学中的相等关系(它是对称的、自反的和可传递的)
在本节描述的相等谓词中, eq? 是最精细或最有辨别力的,而 equal? 是最宽松的。 eqv? 比 eq? 的辨别力稍差一些。

#### （1） `eqv?`

> `(eqv? obj 1 obj 2 )`

eqv? 过程为对象定义了一种有用的相等关系。简单地说,如果 obj1 和 obj2 在通常情况下应该被视为相同的对象,eqv? 过程就返回 #t。这种关系中有少量可以补充解释的地方,但下面所列的 eqv? 的部分定义对所有 Scheme实现都是适用的

eqv? 过程在以下情况返回 #t：

* obj1 和 obj2 都为 #t 或都为 #f
* obj1 和 obj2 都为符号(symbol)，且转换为字符串后值相等。（值相等的字符串返回false）
* obj1 和 obj2 都是数值，它们的值相等
* obj1 和 obj2 都是字符,且在 char=? 过程的语义下是相同的字符。
* obj1 和 obj2 都是空表
* obj1 和 obj2 是表示同一存储位置的点对、向量或字符串
* obj1 和 obj2 是位置标记 (Location tag) 相等的过程

eqv? 过程在以下情况返回 #f：

* obj1 和 obj2 是不同类型的对象
* obj1 和 obj2 中一个是 #t 而另一个是 #f
* obj1 和 obj2 是符号(symbol)，且转换为字符串后值相等
* obj1 和 obj2 中一个是精确数而另一个是非精确数。
* obj1 和 obj2 都是数值,但 = 过程作用于二者的结果是#f
* obj1 和 obj2 都是字符,但 char=? 过程作用于二者的结果是 #f
* obj1 和 obj2 中一个是空表,而另一个不是。
* obj1 和 obj2 是表示不同存储位置的点对、向量或字符串
* obj1 和 obj2 是过程,但二者对于某些参数的行为不同(返回不同的值或有不同的副作用)

例子

```scheme
(eqv? 'a 'a)     ;=> #t
(eqv? 'a 'b)     ;=> #f
(eqv? 2 2)       ;=> #t
(eqv? 100000000 100000000)      ;=> #t
(eqv? (cons 1 2) (cons 1 2))    ;=> #f
(eqv? (lambda () 1)
      (lambda () 2))     ;=> #f
(eqv? #f 'nil)           ;=> #f
(let ((p (lambda (x) x))) ;=> #t
  (eqv? p p))

;一下在标准中未定义但在mit-scheme中结果如下
(eqv? "" "")    ;=> #f
(eqv? '#() '#())   ;=> #t
(eqv? (lambda (x) x)
      (lambda (x) x))  ;=> #f
(eqv? (lambda (x) x)
      (lambda (y) y))  ;=> #f
(eqv? '(a) '(a))       ;=> #f
(eqv? '(b) (cdr '(a b))) ;=> #f
```

#### （2）`eq?`

`(eq? obj1 obj2 )`

eq? 与 eqv? 类似,只是在某些情况下,eq? 对于差异的辨别能力比 eqv? 更强一些。

应确保 eq? 与 eqv? 对符号、布尔值、空表、点对、过程和非空的字符串及向量的行为是一致的。
对于数值和字符, eq? 的行为是依赖于实现的,但它总会返回真或假,并且只在 eqv? 也会返回真的情况下返回真。

例子

```scheme
(eq? 'a 'a)                ;=> #t
(eq? '(a) '(a))            ;=> #f （标准未定义）
(eq? (list 'a) (list 'a))  ;=> #f
(eq? "a" "a")              ;=> #f （标准未定义）
(eq? "" "")                ;=> #f （标准未定义）
(eq? '() '())              ;=> #t
(eq? 2 2)                  ;=> #t （标准未定义）
(eq? #\A #\A)              ;=> #t （标准未定义）
(eq? car car)              ;=> #t
(let ((n (+ 2 3)))         ;=> #t （标准未定义）
  (eq? n n))
(let ((x '(a)))            ;=> #t
  (eq? x x))
(let ((x '#()))            ;=> #t
  (eq? x x))
(let ((p (lambda (x) x)))  ;=> #t
  (eq? p p))
```

原理: 通常,有可能比 eqv? 更高效地实现 eq?,如将 eq? 实现为简单的指针比较,而非更复杂的操作。一个原因是,我们可能无法在常数时间内用 eqv? 完成两个数值的比较,但利用指针比较实现的 eq? 却总可以在常数时间内完成操作。因为 eq?与 eqv? 服从同样的约束,在利用过程来实现有状态对象的应用里, eq? 也可以像 eqv? 那样使用。

#### （3）`equal?`

`(equal? obj1 obj2 )`

equal? 以递归方式比较点对、向量和字符串的内容。对于数值、符号等其他对象, equal? 使用 eqv? 进行比较。一个经验原则是,如果对象的打印输出相同,它们通常就是equal? 的。当 equal? 的参数是循环的数据结构时,它可能无法终止。

```scheme
(equal? 'a 'a)      ;=> #t
(equal? '(a) '(a))  ;=> #f
(equal? '(a (b) c)  ;=> #t
  '(a (b) c))
(equal? "abc" "abc")        ;=> #t
(equal? 2 2)                ;=> #t
(equal? (make-vector 5 ’a)  ;=> #t
        (make-vector 5 ’a))
(equal? (lambda (x) x)      ;=> #f （标准未定义）
  (lambda (y) y))
```

### 2、数值

#### （1）数值类型

* 数 (number)
* 复数 (complex)
* 实数 (real)
* 有理数 (rational)
* 整数 (integer)

类型判断谓词

* number?
* complex?
* real?
* rational?
* integer?

#### （2）精确性

Scheme 数值或者是精确的,或者是非精确的。非精确性的数值计算结果是非精确的

#### （4）数值常量的语法

* #b (二进制)
* #o (八进制)
* #d (十进制)
* #x (十六进制)
* #e 精确数
* #i 非精确数
* s、 f、d 和 l 表示short、 single、 double 和 long 精度
* 指数标记 e 指明了 Scheme实现的缺省精度。缺省精度应达到或超过 double 的精度

```scheme
3.14159265358979F0
3.14159265358979F2
3.14159265358979F-1
4e2
#e#xff
#x#iff
```

#### （5）数值运算

**类型谓词**

```scheme
(number? obj ) ;
(complex? obj )
(real? obj )
(rational? obj )
(integer? obj )
```

下面的谓词返回true，上面的谓词也会返回false

注: 在许多实现中, rational? 过程与 real? 相同, complex?过程与 number? 相同。但特殊的实现也可能精确地表示某些无理数,或将数值系统扩展到支持某种非复数。

**精确性谓词**

```scheme
(exact? z)  ;精确数
(inexact? z);非精确数
```

**比较谓词**

```scheme
(= z 1 z 2 z 3 . . . ) ;相等的
(< x 1 x 2 x 3 . . . ) ;单调递增的
(> x 1 x 2 x 3 . . . ) ;单调递减的
(<= x 1 x 2 x 3 . . . );单调非减的
(>= x 1 x 2 x 3 . . . );单调非增的
```

**特定数谓词**

```scheme
(zero? z)     ;〇？
(positive? x) ;正数
(negative? x) ;负数
(odd? n)      ;奇数
(even? n)     ;偶数
```

**最大值最小值**

```scheme
(max 3 4)
(max 3.9 4)
```

**和或积**

```scheme
(+ z1 . . . )
(* z1 . . . )
(- z1 z2)
(- z)
(- z1 z2 ...) ;可选
(/ z1 z2)
(/ z)
(/ z1 z2 ...) ;可选
```

**绝对值**

```scheme
(abs x )
```

**数论除法**

```scheme
(quotient n1 n2 )  ;整除
(remainder n1 n2 ) ;求余
(modulo n1 n2 )    ;求模
```

说明：

取余运算在计算商值向0方向舍弃小数位
取模运算在计算商值向负无穷方向舍弃小数位
例如：4/(-3)约等于-1.3
在取余运算时候商值向0方向舍弃小数位为-1
在取模运算时商值向负无穷方向舍弃小数位为-2

```scheme
(remainder 4 -3) ;1
(modulo 4 -3)    ;-2
```

**最大公约数和最小公倍数**

```scheme
(gcd n 1 . . . )
(lcm n 1 . . . )
```

**返回分子分母**

```scheme
(numerator q)
(denominator q)
```

计算时它们会将参数约分为最简分数。分母总为正数。 0 的分母被定义为 1

**舍入选择**

```scheme
(floor x )     ;返回不大于 x 的最大整数
(ceiling x )   ;返回不小于 x 的最小整数
(truncate x )  ;返回最接近 x 但绝对值不大于 x 的绝对值的整数
(round x )     ;round 返回最接近 x 的整数,当 x 位于两个整数中间时,其结果将舍入到偶数。
```

round 舍入到偶数,这是为了与 IEEE 浮点标准定义的缺省舍入模型保持一致。如果这些过程的参数是非精确的,其结果也将是非精确的。应把结果传入 inexact->exact 过程。

```scheme
(rationalize x y)
```

**指数、对数、三角、幂函数**

```scheme
(exp z) ;e的z次方
(log z) ;以e为底
(sin z)
(cos z)
(tan z)
(asin z)
(acos z)
(atan z)
(atan y x)
(sqrt z)
(expt z1 z2 ) 返回 z1 的 z2 次方，当z1不等于0时等价于e^(z2*log(z1))
```

**复数相关**

```scheme
;构造一个复数使用直角坐标系
(make-rectangular x1 x2 )
;构造一个复数使用极坐标系
(make-polar x3 x4 )
;提取复数的实部
(real-part z)
;提取复数的虚部
(imag-part z)
;提取复数的（极坐标的）半径
(magnitude z)
;提取复数的（极坐标的）角坐标
(angle z)
```

极坐标方式的角度表示为弧度制

**数表示方式转换**

```scheme
(exact->inexact z) ;转换为非精确数
(inexact->exact z) ;转换为精确数
```

#### （6）数值的输入输出

```scheme
(number->string z )
(number->string z radix )
(string->number string)
(string->number string radix )

;radix 应为精确整数,且是 2、 8、 10 或 16 中的一个
```

### 3、其他数据类型

本节描述 Scheme 的一些非数值数据类型的操作。这些类型包括:布尔型、点对、表、符号、字符、字符串和向量。

#### （1）布尔型

表示真和假的标准布尔对象被记为 #t 和 #f。 但真正重要的是, Scheme 条件表达式 (if、 cond、 and、 or、 do)把何种对象视为真或假。

在所有标准的 Scheme 值中,只有 #f 在条件表达式中被视为假。除了 #f 以外,所有标准的 Scheme 值,包括 #t、点对、空表、符号、数值、字符串、向量和过程都被视为真。

```scheme
(define (test exp)
  (if exp
      #t
      #f))

(test ())   ;=> #t
(test 0))   ;=> #t
```

#### （2）点对和表

**定义**

点对(Pair,有时也写作 Dotted pair)是一个包含两个域的记录结构,两个域分别称为 car 和 cdr (因为历史原因)。 点对由 cons 过程创建。 car 和 cdr 域由 car 和 cdr过程访问。 car 和 cdr 域由 set-car! 和 set-cdr! 过程赋值。

表可以递归定义为:或者是一个空表,或者是一个 cdr 域为表的点对。（也就是表的尾部为空表的标志、就像字符串的定义）
上述定义意味着所有表都有有限的长度,都以空表结尾

**记法**

最普遍的 Scheme 点对记法(外部表示)是“点”记法(c1 . c2),其中 c1 是 car 域的值, c2 是 cdr 域的值。

表的记法：把表中的元素简单地写在括号内,用空格分隔。空表记作 ()。例如:
(a b c d e)
和
(a . (b . (c . (d . (e . ())))))

不是以空表结尾的点对链称为非严格表。注意,非严格表不是表。可以使用表和点记法的组合表示非严格表:

(a b c . d)

等价于

(a . (b . (c . d)))

**相关过程**

* `(pair? obj )`  判断是否是点对
* `(cons obj1 obj2 )`  构建一个点对
* `(car pair )` 提取点对的car域
* `(cdr pair )` 提取点对的cdr域
* `(set-car! pair obj)` 把 obj 存入 pair 的 car 域
* `(set-cdr! pair obj )` 把 obj 存入 pair 的 cdr 域
* car 和 cdr 的组合

```scheme
(caar pair )
(cadr pair )
.
.
.
(cdddar pair )
(cddddr pair )
```

例如, caddr 可定义为:

`(define caddr (lambda (x) (car (cdr (cdr x)))))`

Scheme 提供最高可达四层的任意组合。总共有二十八个这样的过程。

* `(null? obj )` 如果 obj 是空表,则返回 #t,否则返回 #f。
* `(list? obj )` 如果 obj 是表,则返回 #t,否则返回 #f。根据定义,所有表都有有限的长度,都以空表结尾。
* `(list obj . . . )` 返回新分配的表,表中的元素是此过程的参数
* `(length list)` 返回表的长度
* `(append list . . . )` 返回一个表,该表中的元素首先是第一个 list 的元素,随后是其他 list 的元素。实际上就是将前一个参数的尾部的`()`替换为后一个参数

```scheme
(append '(x) '(y))       ;=> (x y)
(append '(a) '(b c d))   ;=> (a b c d)
(append '(a (b)) '((c))) ;=> (a (b) (c))
```

* `(reverse list)` 返回一个新分配的表,该表中以倒序包含了 list 中的元素
* `(list-tail list k)` 返回 list 略去了前 k 个元素后的子表。list 的元素少于 k个的情况是一个错误。 list-tail 可以定义为:
* `(list-ref list k)` 返回 list 中的第 k 个元素(与 (list-tail list k) 的 car域相同)。 list 的元素少于 k 个的情况是一个错误。
* 这些过程返回 list 中 car 为 obj 的第一个子表（如果 list 中没有 obj ,则返回#f (不是空表)）：
	* `(memq obj list)` 使用`eq?`
	* `(memv obj list)` 使用`eqv?`
	* `(member obj list)` 使用`equal?`
* 关联表查询（类似于map查询元素），返回关联表alist中元素的car域与obj相等的元素（是一个点对）如果 alist 中没有 car 域为 obj 的点对,则返回 #f (不是空表：
	* `(assq obj alist)` 使用`eq?`
	* `(assv obj alist)` 使用`eqv?`
	* `(assoc obj alist)` 使用`equal?`

查询的一些例子

```scheme
(memq 'a '(a b c))    ;=> (a b c)
(memq 'b '(a b c))    ;=> (b c)
(memq 'a '(b c d))    ;=> #f
(memq (list 'a) '(b (a) c))   ;=> #f
(member (list 'a) '(b (a) c)) ;=> ((a) c)
(memq 101 '(100 101 102))     ;=> (101 102) 标准未定义
(memv 101 '(100 101 102))     ;=> (101 102)

(define e '((a 1) (b 2) (c 3)))
(assq 'a e)  ;⇒ (a 1)
(assq 'b e)  ;⇒ (b 2)
(assq 'd e)  ;⇒ #f
(assq (list 'a) '(((a)) ((b)) ((c))))  ;⇒ #f
(assoc (list 'a) '(((a)) ((b)) ((c)))) ;⇒ ((a))
(assq 5 '((2 3) (5 7) (11 13)))        ;⇒ 未定义
(assv 5 '((2 3) (5 7) (11 13)))        ;⇒ (5 7)
```

#### （3）符号

符号是一类对象,其用途依赖于以下事实:当且仅当两个符号的名字拼写相同时它们就是相同的符号(在 eqv?的语义下)。在程序中表示标识符时,这是一种必备的特性。因此,大多数 Scheme 实现都在内部使用符号来表示标识符。

符号读写不可变

* `(symbol? obj )` 判断对象是否是符号
* `(symbol->string symbol )` 将符号转换为字符串
* `(string->symbol string)` 将字符串转化为符号

#### （4）字符

字符是表示字母、数字等打印字符的对象。书写字符时使用 `#<character>` 或 `#\<character name>` 的记法。例如:

```scheme
#\a     ;小写字母
#\A     ;大写字母
#\(     ;左括号
#\      ;空格
#\space ;更好的表示空格的记法
#\newline ;换行符
```

在 `#<character>` 中,大小写是敏感的,但在 `#\<character name>` 中,大小写是不敏感的

**谓词**

字符比较（非ascii码比较）

```scheme
(char=? char1 char2 )
(char<? char1 char2 )
(char>? char1 char2 )
(char<=? char1 char2 )
(char>=? char1 char2 )
;不区分大小写
(char-ci=? char1 char2 )
(char-ci<? char1 char2 )
(char-ci>? char1 char2 )
(char-ci<=? char1 char2 )
(char-ci>=? char1 char2 )
```

特殊字符谓词

```scheme
(char-alphabetic? char )  ;字母
(char-numeric? char )     ;数字
(char-whitespace? char )  ;空白 （空格、制表符、换行符、换页符或回车）
(char-upper-case? letter );大写
(char-lower-case? letter );小写
```

**过程**

类型转换谓词

```scheme
(char->integer char ) ;返回一个表示该字符的精确整数
(integer->char n)     ;返回原字符
```

大小写转换

```scheme
(char-upcase char )   ;大写
(char-downcase char ) ;小写
```

#### （5）字符串

字符串是字符的序列。字符串记作用双引号包裹，引号使用反斜杠引用。允许换行。例如：

```scheme
"The word \"recursion\" has many meanings."
"first
secend"
```

一些操作字符串的过程忽略大写和小写的不同。忽略大小写的版本的名字中都含有“-ci”

**过程**

```scheme
;make-string 返回长度为 k 的新分配的字符串。如果给出了 char ,则字符串中的所有元素都初始化为 char ,否则string 的内容是未定义的。
(make-string k)
(make-string k char )

;返回由此过程的参数组成的新分配的字符串
(string char . . . )

;返回 string 中的字符数量。
(string-length string)

;k 必须是 string 的有效索引。 string-ref 使用从零开始的索引返回 string 中的第 k 号字符。
(string-ref string k)

;k 必须是 string 的有效索引。 string-set! 将 char 存入string 的第 k 号元素并返回一个未定义的值。
(string-set! string k char )

;字符串判等
(string=? string1 string2 )
(string-ci=? string1 string2 ) ;不区分大小写

;字符串比较（类似于 c的库函数 strcmp）
(string<?  string1 string2 )
(string>?  string1 string2 )
(string<=?  string1 string2 )
(string>=?  string1 string2 )
(string-ci<?  string1 string2 )
(string-ci>?  string1 string2 )
(string-ci<=?  string1 string2 )
(string-ci>=?  string1 string2 )

;返回子串 其中0 ≤ start ≤ end ≤ (string-length string).
;子串包括start，不包括end
(substring string start end )

;返回一个新的字符串，为所有参数拼接在一起
(string-append string . . .)

;字符串和字符列表互转
(string->list string)
(list->string list)

;字符串拷贝
(string-copy string)

;将 char 存入 string 中的每个元素并返回未定义的值
(string-fill! string char )
```

#### （6）向量

**描述**

向量是一种元素由整数索引的异构结构。向量通常比相同长度的表占据更少的空间,访问随机选定的元素时,向量需要的平均时间通常也比表少。

向量的长度是它包含的元素数量。这个数量是一个精确的、非负的整数。向量创建后,其长度就是确定的。向量的有效索引是小于向量长度的精确的非负整数。 向量中第一个元素的索引是 0,最后一个元素的索引比向量的长度小 1。

（类似于C语言数组的结构）

**记法**

`#(obj . . . )`
例如,一个长度为 3,第 0 号元素为数值 0,第 1 号元素为表 (2 2 2 2),第 2 号元素为字符串 "Anna" 的向量可以记作:

```scheme
#(0 (2 2 2 2) "Anna")
'#(0 (2 2 2 2) "Anna")
```

**类型谓词**

`(vector? obj )`

如果 obj 是一个向量,则返回 #t,否则返回 #f。

**构造器**

```scheme
(make-vector k )
(make-vector k fill )
```

返回包含 k 个元素的新分配的向量。如果给出了第二个参数,则向量中的每个元素都初始化为 fill ,否则向量中每个元素的初始内容是未定义的。

```scheme
(vector obj . . . )
```

返回新分配的向量,其元素包含所有给定的参数。与 list过程类似。
例子

```scheme
(vector 'a 'b 'c) ;=> #(a b c)
```

**常用过程**

* `(vector-length vector )` 以精确整数返回 vector 中的元素数量。
* `(vector-ref vector k )` k 必须是 vector 的有效索引。 vector-ref 返回 vector 中第 k 号元素的内容。
* `(vector-set! vector k obj )` vector-set! 将 obj 存入vector 的第 k 号元素
* 与列表之间转换
	* `(vector->list vector )`
	* `(list->vector list)`
* `(vector-fill! vector fill )` 将 fill 存入 vector 的每个元素。 vector-fill! 的返回值是未定义的。

### 4、控制特征

#### （1）`procedure?`

`(procedure? obj )` 如果 obj 是一个过程,则返回 #t,否则返回 #f。

```scheme
(procedure? car)    ;⇒ #t
(procedure? ’car)   ;⇒ #f
(procedure? (lambda (x) (* x x)))
    ;⇒ #t
(procedure? ’(lambda (x) (* x x)))
    ;⇒ #f
(call-with-current-continuation procedure?)
    ;⇒ #t
```

#### （2）`apply`

`(apply proc arg1 . . . args)`

proc 必须是一个过程, args 必须是一个表使用参数列表`arg1 . . . args`调用 `proc`

例子

```scheme
(apply + (list 3 4))

(define compose
  (lambda (f g)
    (lambda args
      (f (apply g args)))))

((compose sqrt *) 12 75)
```

#### （3）`map`

`(map proc list1 list2 . . . )`

list 必须是表, proc 必须是一个参数数量和 list 数量相同且只返回一个值的过程。如果给出了两个或多个 list,则它们的长度必须相同。map 逐元素地将 proc 应用于 list 中的元素,并返回一个按顺序包含所有结果的表。 proc 作用于 list 元素的动态顺序是未定义的。

例子

```scheme
(map cadr '((a b) (d e) (g h)))    ;⇒ (b e h)
(map (lambda (n) (expt n n))       ;⇒ (1 4 27 256 3125)
  '(1 2 3 4 5))
(map + '(1 2 3) '(4 5 6))          ;⇒ (5 7 9)
(let ((count 0))
  (map (lambda (ignored)
    (set! count (+ count 1))
    count)
  '(a b)))                         ;⇒ (1 2) 或 (2 1)
```

#### （4）`for-each`

`(for-each proc list1 list2 . . . )`

for-each 的参数和 map 的参数类似,但 for-each 调用proc 的目的在于关注其副作用,而非关注其值。不同于map, for-each 保证 proc 作用于 list 中的元素时,会遵循从第一个元素到最后一个元素的顺序, for-each 的返回值是未定义的。

#### （5）`force`

`(force promise)`

强制得到承诺 promise 的值。如果该承诺此前没有被求过值,则计算该承诺的值并返回。该承诺的值被缓冲(或被记忆),因此,当它第二次被强制时,将返回上一次求得的值。

```scheme
(force (delay (+ 1 2)))        ;⇒ 3
(let ((p (delay (+ 1 2))))
  (list (force p) (force p)))  ;⇒ (3 3)

(define a-stream
  (letrec ((next
            (lambda (n)
              (cons n (delay (next (+ n 1)))))))
    (next 0)))

(define head car)
(define tail
  (lambda (stream) (force (cdr stream))))
(head (tail (tail a-stream)))   ;=> 2
```

#### （6）`call-with-current-continuation`

`(call-with-current-continuation proc)`

proc必须是拥有一个参数的过程。过程call-with-current-continuation将当前继续(参见下面的原理部分)打包为一个“逃逸过程(Escapeprocedure)”,并将该过程作为参数传入proc。

逃逸过程是一个 Scheme 过程,如果它在随后被调用,它就会放弃当时起作用的任何继续,而使用逃逸过程创建时起作用的继续。

例如在for-each中根据某些条件终止执行，那么就可以调用这个逃逸过程（相当于c语言的for中break, 函数中的return）

```scheme
(call-with-current-continuation
  (lambda (exit)
    (for-each (lambda (x)
                (if (negative? x)
                    (exit x)))
              '(54 0 37 -3 245 19))
  #t)) ;=> -3
```

某些scheme实现中，该过程称为：`call/cc`

#### （7）`values`

`(values obj . . .)`

返回一个过程，这个过程拥有一个过程类型的参数，调用这个过程就是将objs应用到过程参数，例子：

```scheme
((values 1 2 3) +)
;等价于
(+ 1 2 3)
;等价于
(apply + '(1 2 3))
```

#### （8）`call-with-values`

`(call-with-values producer consumer )`

调用参数 producer ,调用时不传入参数,并使用一个特定的继续:当一些值被传入该继续时,该继续就以这些值为参数调用 consumer 过程。调用 consumer 时的继续就是调用 call-with-values 时的继续。

例子

```scheme
(call-with-values (lambda () (values 4 5))
  (lambda (a b) b))  ;⇒ 5
(call-with-values * -) ;=> -1
```

#### （9）`dynamic-wind`

`(dynamic-wind before thunk after )`
调用过程thunk，并在调用之前先调用before，在调用之后调用after，类似于面向对象的面向切面编程

```scheme
(dynamic-wind
  (lambda () (begin (display "before") (newline)))
	(lambda () (begin (display "proc") (newline)))
	(lambda () (begin (display "after") (newline))))

(dynamic-wind
  (lambda () (begin (display "before") (newline)))
	(lambda () (call-with-current-continuation
	  (lambda (exit) (begin
		  (display "proc")
			(newline) (exit 0)
			(display "proc1")
			(newline)))))
	(lambda () (begin (display "after") (newline))))

;输出：
;before
;proc
;after
```

### 5、求值

`(eval expression environment-specifier )`
在指定的环境中求得并返回 expression 的值。 expression必须是一个以数据形式表示的有效的 Scheme 表达式,environment-specifier 必 须是下面描述的三个过程之一的返回值。

* `(scheme-report-environment version)` scheme版本号version所对应的绑定
* `(null-environment version)`  scheme版本号version所对应的**关键字**的(语法)绑定
* `(interaction-environment)` 所有环境包括用户创建的
* `user-initial-environment` mit-scheme使用

version 必须是对应于本报告(Scheme 修订 5 报告)的修订版本号的精确整数 5

```scheme
(eval '(* 7 3) (scheme-report-environment 5))   ;=> 21
(let ((f (eval '(lambda (f x) (f x x))
               (null-environment 5))))
  (f + 10))  ;=> 20
```

### 6、输入和输出

#### （1）ports

端口 (Port) 表示输入和输出设备。对于 Scheme 来说,输入端口是一个可以根据命令发送字符的 Scheme 对象,输出端口是一个可以接收字符的 Scheme 对象。

类似于c的文件描述符

* `(call-with-input-file string proc)`
* `(call-with-output-file string proc)`

proc为一个过程拥有一个参数，类型为port类型，string为文件名
使用proc对文件名为string的文件做操作。
调用 call-with-output-file 时,如果文件已经存在,其结果是未定义的。如果不能打开该文件,就报告一个错误。
如果 proc 返回,该端口就会被自动关闭, proc 产生的(一个或多个)值被返回。如果 proc 没有返回,该端口就不会被自动关闭,除非可以证明该端口再也不会被读写操作使用了。

**判断port**

* `(input-port? obj )` 判断是否是输入端口
* `(output-port? obj )` 判断是否是输出端口

**返回当前缺省端口**

* `(current-input-port)`
* `(current-output-port)`

**绑定到缺省端口**

* `(with-input-from-file string thunk )`
* `(with-output-to-file string thunk )`

将文件名为string的文件打开，并调用thunk，当thunk退出后，关闭文件。**类似于python的with语法**。在thunk中，可以使用read、write对文件进行操作。

**打开文件，并创建端口**

* `(open-input-file filename)`
* `(open-output-file filename)`

**关闭文件**

* `(close-input-port port)`
* `(close-output-port port)`

#### （2）输入

* `(read)`
* `(read port)`

read不是简单的将输入读成字符串，而是类似于引用的解析（将外部对象转换为内部对象）完整的解析完一个表达式后返回
若遇到文件结尾将返回一个(End of file) 对象，如果在开始输入对象的外部表示后遇到了文件结尾,但外部表示还不完整,无法解析,就报告一个错误。

例子

```scheme
(read) ;输入 1
;=> 1

(read) ;输入 1 2 zxcv
;=> 1
;=> 2 ;被当做命令输入
;zxcv当做命名输入，报错Unbound variable

(read) ;输入 (1 "" a c)
;=> (1 "" a c)
```

**读取一个字符**

* `(read-char)`
* `(read-char port)`

读取一个字符但是不移动文件指针

* `(peek-char)`
* `(peek-char port)`

**文件结尾**

`(eof-object? obj )`

**字符是否准备好**

类似于c的select函数

* `(char-ready?)`
* `(char-ready? port)`

#### （3）输出

**生成机器可读的输出**

* `(write obj )`
* `(write obj port)`

向给定端口 port 输出 obj 的书面表示。出现在书面表示内的字符串被双引号包围,在这些字符串中,反斜线和双引号字符被反斜线转义。字符对象使用 #\ 记法输出。 write返回未定义的值。 port 参数可以省略,这时它的缺省值是current-output-port 的返回值。

**用于生成人可读的输出**

* `(display obj )`
* `(display obj port)`

**输出换行符**

* `(newline)`
* `(newline port)`

**输出一个字符**

* `(write-char char )`
* `(write-char char port)`

#### （4）系统接口

`(load filename)`

filename 是命名一个已存在文件的字符串,该文件中包含 Scheme源代码。 load过程从该文件中读入表达式和定义并依次对它们求值。表达式的结果是否要打印输出是未定义的。 load 过程不影响 current-input-port和 current-output-port 的返回值。 load 返回未定义的值。

* `(transcript-on filename)`
* `(transcript-off)`

filename 必须是命名一个待创建的输出文件的字符串。transcript-on 的作用是以输出方式打开命名的文件,并使得用户和 Scheme 系统间后续交互的副本被写入该文件。 transcript-off 调用可结束副本输出并关闭副本文件。任何时间都只能有一个副本处于输出状态,但一些实现也可以放宽这一限制。这些过程的返回值是未定义的。
