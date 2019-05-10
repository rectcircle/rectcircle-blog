---
title: SICP笔记
date: 2018-01-30T11:25:48+08:00
draft: false
toc: true
comments: true
aliases:
  - /detail/124
  - /detail/124/
tags:
  - FP
---

## 目录

## 〇、预备

***

### 1、解释器环境

mit-scheme Release 9.1.1

### 2、参考

> https://github.com/DeathKing/Learning-SICP
> 《计算机程序的构造和解释（第二版）》
> 《r5rs标准文档》

### 3、scheme基本语法

参见[r5rs笔记](/detail/125)

## 一、构造抽象的过程

***

### 1、程序设计的基本元素

#### （1）表达式

```scheme
486
(+ 1 2)
(+ (* 3 5) (- 10 6))
```

#### （2）命名和环境

```scheme
(define size 2)
(define pi 3.14159)
size
```

#### （3）组合式的求值

组合表达式构成了一颗树

#### （4）复合过程

可以理解为一个函数

```scheme
;求某个数的平方的一个复合过程
(define (square x) (* x x))
(square 1001)

;求平方和
(define (sum-of-square x y)
  (+ (square x) (square y)))
(sum-of-square 3 4)

;一个函数f
(define (f a)
 (sum-of-square (+ a 1) (* a 2)))
(f 5)
```

#### （5）过程应用的代换模型

简单的将复合过程代换进去，并替换参数来模拟求值

例子

```scheme
(f 5)   ;=> 替换f的参数
(sum-of-square (+ 5 1) (* 5 2))  ;=> 规约
(sum-of-square 6 10)   ;=> 替换
(+ (square 6) (square 10))  ;=> 替换
(+ (* 6 6) (* 10 10)) ;规约
(+ 36 100) ;规约
136
```

另一中方式

```scheme
;替换
(f 5)
(sum-of-square (+ 5 1) (* 5 2))
(+ (square (+ 5 1)) (square (* 5 2)))
(+ (* (+ 5 1) (+ 5 1)) (* (* 5 2) (* 5 2)))
;规约求值
(+ (* 6 6) (* 10 10))
(+ 36 100)
136
```

* 第一种方式为“先求参数后应用”，称为**应用序求值**（scheme标准求值方式）
* 第二种方式为“完全展开后规约”，称为正则序求值

#### （6）条件表达式和谓词

```scheme
(define (abs x)
  (cond ((< x 0) (- x))
  		((= x 0) 0)
  		((> x 0 ) x)))

(define (abs x)
  (if (< x 0)
      (- x)
      x))
```

**练习1.5**

测试求值方式

```scheme
(define (p) (p))
(define (test x y)
  (if(= x 0)
	   0
	   y))
(test 0 (p))
```

应用序求值：陷入死循环
正则序求值：返回0

#### （7）实例采用牛顿法求平方根

```scheme
(define (average x y)
  (/ (+ x y) 2))

(define (improve guess x)
  (average guess (/ x guess)))

(define (good-enough? guess x)
  (< (abs (- (square guess) x))
     .001))

(define (try guess x)
  (if (good-enough? guess x)
      guess
      (try (improve guess x) x)))

(define (sqrt x)
  (try 1 x))
```

**联系1.6**

使用new-if代替以上的if将会出现什么问题？

```scheme
(define (new-if predicate then-clause else-clause)
  (cond (predicate then-clause)
        (else else-clause)))
```

由于scheme标准上是使用应用序求值，所以迭代的过程将会死循环

#### （8）过程作为黑箱抽象

一些定义：

* 约束变量：在一个过程中，参数列表中的变量称之为约束变量
* 自由变量：在一个过程中，没有出现在参数列表中的变量称为自由变量

隐藏细节——内部定义和块过程

```scheme
(define (sqrt x)
  (define (average x y)
    (/ (+ x y) 2))
  (define (improve guess)
    (average guess (/ x guess)))
  (define (good-enough? guess)
    (< (abs (- (square guess) x))
       .001))
  (define (try guess)
    (if (good-enough? guess)
        guess
        (try (improve guess))))
  (try 1.0))
```

### 2、过程和他们所产生的计算

对于递归程序，使用代换模型依次展开，得到的计算的形状可以反映出过程的性能（时间空间复杂度）

#### （1）线性的递归和迭代

对于阶乘的定义，直接翻译如下：

```scheme
(define (factorial n)
  (if (= n 1)
      1
			(* n (factorial (- n 1)))))
```

使用代换模型可以得到

```scheme
(factorial 4)
(* 4 (factorial 3))
(* 4 (* (factorial 3)))
(* 4 (* 3 (factorial 2)))
(* 4 (* 3 (* 2 1)))
(* 4 (* 3 2))
(* 4 6)
24
```

使用另一种定义方法

```scheme
(define (factorial n)
  (fact-iter 1 1 n))
(define (fact-iter product counter max-count)
  (if (> counter max-count)
	    product
			(fact-iter
			  (* product counter)
				(+ counter 1)
				max-count)))
```

使用代换模型可以得到

```
(factorial 4)
(fact-iter 1 1 4)
(fact-iter 1 2 4)
(fact-iter 2 3 4)
(fact-iter 6 4 4)
(fact-iter 24 5 4)
24
```

对一个递归的过程：

* 若计算的“形状”如第一个展开的话，那么这个过程就是一个**递归计算过程**，更细化的对于这种线性增长的叫做**线性递归过程**
* 若计算的“形状”如第二个展开的话，那么这个过程就是一个**迭代计算过程**。这种过程可以通过**尾递归**的方式进行优化。使其达到迭代一样的线性代价。而在scheme中语法就是这种过程的语法糖

#### （2）树形递归

类似于斐波那契数列的定义

```scheme
(define (fib n)
  (cond ((= n 0) 0)
	      ((= n 1) 1)
				(else (+ (fib (- n 1))
				         (fib (- n 2))))))
```

这就是一种树形递归

#### （3）增长的阶

也就是时间复杂度

#### （4）求幂

**版本1：递归计算过程**

```scheme
(define (expt b n)
  (if (= n 0)
      1
      (* b (expt b (- n 1)))))
```

**版本2：迭代计算过程**

```scheme
(define (expt b n)
  (expt-iter b n 1))
(define (expt-iter b counter product)
  (if (= counter 0)
	    product
			(expt-iter b
			           (- counter 1)
								 (* b product))))
```

**版本3：优化算法**

```scheme
(define (fast-expt b n)
  (cond ((= n 0) 1)
        ((even? n) (square (fast-expt b (/ n 2))))
        (else (* b (fast-expt b (- n 1))))))
```

#### （5）最大公约数

```scheme
(define (gcd a b)
  (if (= b 0)
      a
      (gcd b (remainder a b))))
```

#### （6）素数检测

**方法1：使用素数定义**

```scheme
(define (smallest-divisor n)
  (find-divisor n 2))
(define (find-divisor n test-divisor)
  (cond ((> (square test-divisor) n) n)
        ((divides? test-divisor n) test-divisor)
        (else (find-divisor n (+ test-divisor 1)))))
(define (divides? a b)
  (= (remainder b a) 0))
(define (prime? n)
  (= n (smallest-divisor n)))
```

**方法2：使用费马检测**

费马小定理：如果n是一个素数，a是小于n的任意正整数，那么a的n次方与a模n同余

算法：取位于1和n-1之间的数a，然后检查a的n次幂取模n的余数是否等于a，若不是则肯定不是素数，若是则可能是素数

```scheme
(define (expmod base exp m)
  (cond ((= exp 0) 1)
        ((even? exp)
				 (remainder (square (expmod base (/ exp 2) m)) m))
				(else
				 (remainder (* base (expmod base (- exp 1) m)) m))))

(define (fermat-test n)
  (define (try-it a)
	  (= (expmod a n n) a))
 (try-it (+ 1 (random (- n 1)))))

(define (fast-prime? n times)
  (cond ((= times 0) true)
	      ((fermat-test n) (fast-prime? n (- times 1)))
				(else false)))
```

这是一种概率性的测试，不保证完全正确

### 3、用高阶函数做抽象

scheme支持过程作为过程的参数，过程作为过程的值

#### （1）过程作为参数

**实例：使用scheme实现求和记法**

```scheme
(define (sum term a next b)
  (if (> a b)
      0
      (+ (term a)
         (sum term (next a) next b))))

;求a到b之间整数的和
(define (1+ i) (+ 1 i))
(define (identity i) i)
(define (sum-int a b)
  (sum identity a 1+ b))

;使用lambda构造
(define (sum-int a b)
  (sum (lambda (i) i) a (lambda (i) (+ 1 i)) b))
```

#### （3）过程作为一般性的方法

求函数的不动点

```scheme
;函数不动点求平方根
;y = x/y 时 y = sqrt(x)，也称y为x/y函数的不动点
;迭代求不动点：不断更新y的值，直到新值和旧值（近似）相等
;更新y值的函数（阻尼函数）在此为：y_{n+1} = (x/y_n + y_n)/2
(define (fixed-point f start)
  (define tolerance 0.00001)
  (define (close-enuf? a b)
    (< (abs (- a b)) tolerance))
  (define (iter old new)
    (if (close-enuf? old new)
        new
        (iter new (f new))))
  (iter start (f start)))

(define (sqrt1 x)
  (fixed-point
  	(lambda (y) (average (/ x y) y))
  	1))
```

#### （4）过程作为返回值

```scheme
(define average-damp
  (lambda (f)
          (lambda (x) (average (f x) x))))
(define (sqrt2 x)
  (fixed-point
  	(average-damp (lambda (y) (/ x y)))
    1))

;牛顿法求平方根
;f(y) = x - y*y = 0 时 y = sqrt(x)
;即解方程 x - y*y = 0
;牛顿迭代法（阻尼函数）：y_{n+1} = y_n - f(y_n) / f'(y_n)

;近似求导
(define deriv
  (lambda (f)
    (define dx 0.000001)
    (lambda (x)
            (/ (- (f (+ x dx))
                  (f x))
               dx))))

;牛顿迭代法求方程的解
(define (newton f guess)
  (define df (deriv f))
   (fixed-point
  	(lambda (y) (- y (/ (f y) (df y))))
  	guess)
)

(define (sqrt3 x)
  (newton (lambda (y) (- x (square y)))
          1))
```

编程语言第一元素（具有第一级状态、或者称为第一等公民）的权利或特权如下：

* 使用变量命名
* 可以提供给过程作为参数
* 可以由过程作为结果返回
* 可以包含在数据结构中

## 二、构造数据抽象

***

### 1、数据抽象引导

#### （1）实例：有理数的算数运算

```scheme
;模拟实数计算
(define (gcd a b)
  (if (= b 0)
      a
      (gcd b (remainder a b))))

;构造函数
(define (make-rat n d)
  (let ((g (gcd n d))) ;let用于创建上下文变量
  	(cons (/ n g) (/ d g))))
  ;(cons n d))
;提取函数
(define (numer x)
  (car x))
(define (denom x)
  (cdr x))
;针对复合数据结构的计算
; +
(define (+rat a b)
  (make-rat (+ (*(numer a) (denom b)) (*(numer b) (denom a)))
            (* (denom a) (denom b))))
; *
(define (*rat a b)
  (make-rat (* (numer a) (numer b))
            (* (denom a) (denom b))))
;print
(define (print-rat x)
  (newline)
  (display (numer x))
  (display "/")
  (display (denom x)))
;测试1/2 + 1/4
(define a (make-rat 1 2))
(define b (make-rat 1 4))
(define ans (+rat a b))
(print-rat a)
(print-rat b)
(print-rat ans)
```

#### （2）抽象屏障

复杂系统需要将系统分成若干层，每一层封装这一些变化性，使用过程实现，这样可以使程序的变动限制到部分

#### （3）数据意味着什么

在scheme中，数据和过程的划分没有那么清晰比如点对的一种实现

```schemem
(define (cons a b)
  (lambda (pick) (cond ((= pick 1) a)
                       ((= pick 2) b))))

(define (car x) (x 1))
(define (cdr x) (x 2))
```

这种表示叫做数据的过程性表示

### 2、层次性数据和闭包性质

闭包的有以下含义：

* 来源于抽象代数，一集元素称为在某运算之下密封，如果将该运算应用于这一集合的元素，产出的任然是该集合的元素
* 一般说某种组合数据对象的操作满足闭包性质，就是说，通过他组合起数据对象得到的结果本身还可以通过同样的操作再进行组合（类似于scheme的点对的特点）
* 闭包用于表示带有自由变量的过程的而用的实现计数

#### （1）列表的表示

```scheme
(define 1-to-4 (list 1 2 3 4))
;等价于
(define nil ())
(define 1-to-4 (cons 1 (cons 2 (cons 3 (cons 4 nil)))))
```

* nil用于表示序对的链结束，是空表，来自拉丁词汇“nihil”表示什么都没有

其他参见[r5rs](/detail/125#3-其他数据类型)

一些对表操作的高阶过程

```scheme
;列表缩放函数
(define (scale-list s l)
  (if (null? l)
      ()
      (cons (* (car l) s) (scale-list s (cdr l)))))

;map
(define (map p l)
  (if (null? l)
      ()
      (cons (p (car l)) (map p (cdr l)))))

;使用map实现实现scale
(define (scale-list s l)
  (map (lambda (a) (* s a)) l))

;foreach
(define (foreach p l)
  (if (null? l)
      "done"
      (begin (p (car l)) (foreach p (cdr l)))))

(define (foreach p l)
  (cond ((null? l) "done")
        (else (p (car l))
              (foreach p (cdr l)))))
```

#### （2）层次性结构

可以通过点对和列表实现树结构

#### （3）序列作为一种约定界面

略

### 3、符号数据

#### （2）例子：符号化求导

```scheme
;求函数的定点导数(表达式,自变量)
(define (deriv exp var)
  (cond ((constant? exp var) 0);表达式是常数，其导数为0
        ((same-var? exp var) 1)
        ((sum? exp)
          (make-sum (deriv (a1 exp) var)
                    (deriv (a2 exp) var)))
        ((product? exp)
          (make-sum
            (make-product (m1 exp) (deriv (m2 exp) var))
            (make-product (deriv (m1 exp) var) (m2 exp) )))))

(define (atom? x)
  (and (not (null? x))
       (not (pair? x))))

(define nil ())

;表达式是否是常数？
(define (constant? exp var)
  (and (atom? exp) (not (eq? exp var))))
;表达式是否和变量值相等
(define (same-var? exp var)
  (and (atom? exp) (eq? exp var)))

;表达式是否是和式
(define (sum? exp)
  (and (not (atom? exp)) (eq? (car exp) '+ )))
;和式的构造函数
(define (make-sum a1 a2)
  (cond ((and (number? a1)
              (number? a2))
         (+ a1 a2))
        ((and (number? a1)
              (= a1 0))
          a2)
        ((and (number? a2)
              (= a2 0))
          a1);添加化简
        ( else (list '+ a1 a2))))

;和式的选择函数（unapply）
(define a1 cadr) ;列表的第二个元素（语法糖）
(define a2 caddr);列表的第三个元素（语法糖）

;判断是否是乘积式
(define (product? exp)
  (and (not (atom? exp))
       (eq? (car exp) '*)))
;乘积式的构造函数
(define (make-product m1 m2)
  (cond ((and (number? m1)
              (number? m2))
              (* m1 m2))
        ((and (number? m1)m2
              (= m1 0))
              0)
        ((and (number? m2)
              (= m2 0))
              0);添加化简
        ((and (number? m1)
              (= m1 1))
              m2)
        ((and (number? m2)
              (= m2 1))
              m1);添加化简
        ( else (list '* m1 m2))))
;乘积式的选择函数（unapply）
(define m1 cadr) ;列表的第二个元素（语法糖）
(define m2 caddr);列表的第三个元素（语法糖）

;'表达式 表示 不要计算 而是当做列表解析
(define foo
  '(+ (* a (* x x))
      (+ (* b x) c)))

(deriv foo 'x)
```

### 4、抽象数据的多重表示

复数的表示：两种方案，直角坐标和极坐标

使用带标志（类型）的数据

```scheme
;通用运算符
;实现复数运算
;复数至少有两种表示方式：直角坐标和极坐标，
;要求通用运算符支持这两种记法的数据类型

;算法描述
(define (+c z1 z2)
  (make-rectangular
    (+ (real-part z1) (real-part z2))
    (+ (imag-part z1) (imag-part z2))))

(define (*c z1 z2)
  (make-polar
    (+ (magnitude z1) (magnitude z2))
    (+ (angle z1) (angle z2))))

(define (/c z1 z2)
  (make-polar
    (/ (magnitude z1) (magnitude z2))
    (- (angle z1) (angle z2))))


;1、基于类型的	分派
;简单类型系统的实现
(define (attach-type type contents)
  (cons type contents))
;选择函数
(define (type datum)
  (car datum))
(define (contents datum)
  (cdr datum))

;类型判断
;直角坐标实现的复数
(define (rectangular? z)
  (eq? (type z) 'rectangular))
;直角极坐标实现的复数
(define (polar? z)
  (eq? (type z) 'polar))

;直角坐标实现
(define (make-rectangular x y)
  (attach-type 'rectangular (cons x y)))
(define (real-part-rectangular z)
  (car z))
(define (imag-part-rectangular z)
  (cdr z))
(define (magnitude-rectangular z)
  (sqrt (+ (square (car z))
           (square (cdr z)))))
(define (angle-rectangular z)
  (atan (cdr z) (car z)))

;极坐标的实现
(define (make-polar r a)
  (attach-type 'polar (cons r a)))
(define (real-part-polar z)
  (* (car z) (cos (cdr z))))
(define (imag-part-polar z)
  (* (car z) (sin (cdr z))))
(define (magnitude-polar z)
  (car z))
(define (angle-polar z)
  (cdr z))

;对以上根据类型进行统一
(define (real-part z)
  (cond ((rectangular? z)
         (real-part-rectangular
           (contents z)))
        ((polar? z)
         (real-part-polar
           (contents z)))))
(define (imag-part z)
  (cond ((rectangular? z)
         (imag-part-rectangular
           (contents z)))
        ((polar? z)
         (imag-part-polar
           (contents z)))))
(define (magnitude z)
  (cond ((rectangular? z)
         (magnitude-rectangular
           (contents z)))
        ((polar? z)
         (magnitude-polar
           (contents z)))))
(define (angle z)
  (cond ((rectangular? z)
         (angle-rectangular
           (contents z)))
        ((polar? z)
         (angle-polar
           (contents z)))))
```

**数据导向编程，添加可加性**

```scheme
;双键值表的模拟实现
(define table ())
(define (put k1 k2 v)
  (set! table (cons (list k1 k2 v) table)))
(define (get k1 k2)
  (define (find t)
    (cond ((null? t) ())
          ((and (eq? (car(car t)) k1)
                (eq? (cadr(car t)) k2))
           (caddr(car t)))
          (else (find (cdr t)))))
  (find table))
;测试
(put 'a 'b 1)
(put 'a 'c 2)
(get 'a 'b)

(put 'rectangular 'real-part real-part-rectangular)
(put 'rectangular 'imag-part imag-part-rectangular)
(put 'rectangular 'magnitude magnitude-rectangular)
(put 'rectangular 'angle angle-rectangular)

(put 'polar 'real-part real-part-polar)
(put 'polar 'imag-part imag-part-polar)
(put 'polar 'magnitude magnitude-polar)
(put 'polar 'angle angle-polar)

(define (operate op obj)
  (let ((proc (get (type obj) op)))
  	(if (not (null? proc))
  	    (proc (contents obj))
  	    (error "undefined op"))))

;此时的代理方法
(define (real-part z)
  (operate 'real-part z))
(define (imag-part z)
  (operate 'imag-part z))
(define (magnitude z)
  (operate 'magnitude z))
(define (angle z)
  (operate 'angle z))
```

**消息传递**

除了使用操作表以外，还可以将数据封装成一个过程，这种方式称为消息传递

```scheme
(define (make-rectangular x y)
  (define (dispatch op)
	  (cond ((eq? op 'real-part) x)
		      ((eq? op 'imag-part) y)
					((eq? op 'magnitude)
					 (sqrt (+ (square x) (square y))))
					((eq? op 'magnitude)
					 (atan y x))
					(else (error "Unkown op"))))
	dispatch)
```

### 5、带有通用型操作的系统

```scheme
;将lisp自带的+-*/和复数实数计算统一到更通用的运算add、sub、mul、div

;对于实数运算goto line 169，对其中添加类型描述符，将运算替换为通用的add

;类似的，可使用过，数据导向编程实现（通过类型表实现）

;封装lisp原生运算
(define (make-number n)
  (attach-type 'number n))
(define (+number x y)
  (make-number (+ x y)))
(put 'number 'add +number)

;对于实现
(define (operate-2 op arg1 arg2)
  (if (eq? (type arg1) (type arg2))
      (let ((proc (get (type arg1) op)))
      	(if (not (null? proc))
      	    (proc (contents arg1)
      	          (contents arg2))
      	   (error "op undefined on type")))
      (error "Arg not same type")))
;通用+
(define (add x y)
  (operate-2 'add x y))

;添加多项式运算略，
;对于系数的加减运算可以使用通用add，这样系统灵活性大大提高

```

## 三、模块化、对象和状态

***

### 1、赋值和局部状态

语法

```scheme
(define var 1) ;赋创建值
(set! var (+ var 1));修改变量的值
```

#### （2）引进赋值带来的利益

**例子：通过随机数计算pi（蒙特卡罗法）**

```scheme
;cesaro法估计pi Prob(gcd(n1 n2) = 1) = 6 / (Pi*Pi)
(define (estimate-pi n)
  (sqrt (/ 6 (monte-carlo n cesaro))))

(define (cesaro)
  (= (gcd (rand) (rand)) 1))

;蒙特卡罗法，进行trials次实验experiment，记录返回#t的概率
(define (monte-carlo trials experiment)
  (define (iter remaining passed)
    (cond ((= remaining 0)
           (/ passed trials))
          ((experiment)
           (iter (- remaining 1)
                 (+ passed 1)))
          (else
           (iter (- remaining 1)
                 passed))))
  (iter trials 0))


(define random-init 1)

;有状态随机数生成器
(define rand
  (let ((x random-init))
  	(lambda ()
  	  (set! x (rand-update x))
  	  x)))

;随便实现的随机数更新函数
(define (rand-update x)
  (let ((a 76543210) (b #x12345678) (m #x7fffffff))
    (modulo (+ (* a x) b) m)))
```

**使用赋值的好处**

与所有状态必须显示地操作和传递额外的方式相比，通过引入赋值和将状态隐藏在局部变量中的技术，我们能以一种更模块化的方式构造函函数。

#### （3）引入赋值的代价

* 打破了引用透明性（使用替换模型替换不会改变表达式的值）
* 产生副作用
* 简单替换模型失效

### 2、求值的环境框架

#### （1）求值规则

如果要对一个表达式求值：

* 求值这个表达式的子表达式
* 将运算符表达式的值应用于运算对象子表达式的值

使用环境-框架模型

### 3、用变动数据做模拟

#### （1）变动的表结构

```scheme
;赋值类语句带来强大的能力的同时，破坏了引用透明性，带来了bug
(define a (cons 1 2))
(define b (cons a a))
(set-car! (car b) 3)
(car a)

;纯函数式定义cons
;阿隆佐 邱奇
(define (cons x y)
  (lambda (m) (m x y)))
(define (car x)
  (x (lambda (a d) a)))
(define (cdr x)
  (x (lambda (a d) d)))
;添加可变性之后的定义
(define (cons x y)
  (lambda (m)
    (m x
       y
       (lambda (n) (set! x n))
       (lambda (n) (set! y n)))))
(define (car x)
  (x (lambda (a d sa sd) a)))
(define (cdr x)
  (x (lambda (a d sa sd) d)))
(define (set-car! x y)
  (x (lambda (a d sa sd) (sa y))))
(define (set-cdr! x y)
  (x (lambda (a d sa sd) (sd y))))
```

#### （2）队列的表示

```scheme
;构造函数
(define (make-queue) (cons '() '()))

;两个选择函数
;检查队列是否为空
(define (empty-queue? queue) (null? (front-ptr queue)))
;返回队列前端的对象，如果为空返回错误
(define (front-queue queue)
  (if (empty-queue? queue)
      (error "FRONT called with an empty queue" queue)
      (car (front-ptr queue))))

;两个改变函数
;插入函数，插入到队列末端，返回修改过的队列作为值
(define (insert-queue! queue item)
  (let ((new-pair (cons item '())))
    (cond ((empty-queue? queue)
           (set-front-ptr! queue new-pair)
           (set-rear-ptr! queue new-pair)
           queue)
          (else
           (set-cdr! (rear-ptr queue) new-pair)
           (set-rear-ptr! queue new-pair)
           queue))))
;删除队列前端的数据项，并返回修改后的队列作为值。如果为空报错
(define (delete-queue! queue)
  (cond ((empty-queue? queue)
         (error "DELETE! called with an empty queue" queue))
        (else
         (set-front-ptr! queue (cdr (front-ptr queue)))
         queue)))


;涉及的队列的定义
(define (front-ptr queue) (car queue))
(define (rear-ptr queue) (cdr queue))
(define (set-front-ptr! queue item) (set-car! queue item))
(define (set-rear-ptr! queue item) (set-cdr! queue item))
```

#### （3）表格的表示

**一维表格（map、字典等）**

```scheme
;一维表格实现
(define (lookup key table)
  (let ((record (assoc key (cdr table))))
    (if record
        (cdr record)
        #f)))
;assoc mit-scheme 内置实现，语义如下
;equal?，允许以符号、数值或者表结构作为关键字
(define (assoc key records)
  (cond ((null? records) #f)
        ((equal? key (caar records)) (car records))
        (else (assoc key (cdr records)))))
(define (insert! key value table)
  (let ((record (assoc key (cdr table))))
  	(if record
  	    (set-cdr! record value)
  	    (set-cdr! table
  	              (cons (cons key value) (cdr table))))))
(define (make-table)
  (list '*table*))
```

**二维表格**

```scheme
;二维表格
(define (lookup key-1 key-2 table)
  (let ((subtable (assoc key-1 (cdr table))))
  	(if subtable
  	    (let ((record (assoc key-2 (cdr subtable))))
  	    	(if record
  	    	    (cdr record)
  	    	    #f))
  	    #f)))
(define (insert! key-1 key-2 value table)
  (let ((subtable (assoc key-1 (cdr table))))
    (if subtable
        (let ((record (assoc key-2 (cdr subtable))))
        	(if record
                (set-cdr! record value)
                (set-cdr! subtable
                          (cons (cons key-2 value)
                                (cdr subtable)))))
        (set-cdr! table
                  (cons (list key-1
                              (cons key-2 value))
                        (cdr table)))))
  'ok)
(define (make-table)
  (list '*table*))
```

**创建局部表格**

```scheme
;创建局部变量
(define (make-table)
  (let ((local-table (list '*table*)))
  	(define (lookup key-1 key-2)
      (let ((subtable (assoc key-1 (cdr local-table))))
         (if subtable
            (let ((record (assoc key-2 (cdr subtable))))
                 (if record
                    (cdr record)
                    #f))
            #f)))
    (define (insert! key-1 key-2 value)
      (let ((subtable (assoc key-1 (cdr local-table))))
        (if subtable
            (let ((record (assoc key-2 (cdr subtable))))
            	(if record
                    (set-cdr! record value)
                    (set-cdr! subtable
                              (cons (cons key-2 value)
                                    (cdr subtable)))))
            (set-cdr! local-table
                      (cons (list key-1
                                  (cons key-2 value))
                            (cdr local-table)))))
      'ok)
    (define (dispatch m)
      (cond ((eq? m 'lookup-proc) lookup)
            ((eq? m 'insert-proc) insert!)
            (else (error "Unknown operation -- TEBLE" m))))
    dispatch))
(define operation-table (make-table))
(define get (operation-table 'lookup-proc))
(define put (operation-table 'insert-proc))
```

#### （4）数字电路模拟器

```scheme
;数字电路仿真
;使用事件驱动模型（发布订阅）
;声明节点
(define a (make-wire))
(define b (make-wire))
(define c (make-wire))
(define d (make-wire))
(define e (make-wire))
(define s (make-wire))
;连接各个器件(形成半加器)
(or-gate a b d) ;2或门
(and-gate a b c) ;2与门
(inverter c e) ;非门
(and-gate d e s)

;将半加器构造封装起来
(define (half-adder a b s c)
  (let ((d (make-wire)) (e (make-wire)))
    (or-gate a b d) ;2或门
    (and-gate a b c) ;2与门
    (inverter c e) ;非门
    (and-gate d e s)))

;使用半加器构造一个全加器
(define (full-adder a b c-in sum c-out)
  (let ((s (make-wire))
        (c1 (make-wire))
        (c2 (make-wire)))
  	(half-adder a c-in s c1)
    (half-adder a s sum c2)
    (or-gate c1 c2 c-out)))

;实现基本元素

;非门实现
(define inverter-not 2);非门延迟时间
(define (inverter in out)
  (define (invert-input)
    (let ((new (logical-not (get-signal in)))) ;构造出新的值
    	(after-delay ;延时后执行
    	   inverter-delay ;延时时间
    	   (lambda () ;执行的函数
    	     (set-signal! out new)))))
  ;订阅事件（in发生变化），添加事件响应（invert-input）
  (add-action! in invert-input)) ;当in发生变化时执行invert-input
(define (logical-not s)
  (cond ((= s 0) 1)
        ((= s 1) 0)
        (else (error "Invalid signal" s))))

;与门的实现
(define and-gate-delay 3);非门延迟时间
(define (and-gate a1 a2 output)
  (define (and-action-procedure)
    (let ((new-value
           (logical-and (get-signal a1) (get-signal a2))))
      (after-delay and-gate-delay
                   (lambda ()
                     (set-signal! output new-value)))))
  (add-action! a1 and-action-procedure)
  (add-action! a2 and-action-procedure))
(define (logical-and a1 a2)
  (cond ((and (= a1 1) (= a2 1)) 1)
        ((and (= a1 1) (= a2 0)) 0)
        ((and (= a1 0) (= a2 1)) 0)
        ((and (= a1 0) (= a2 0)) 0)
        (else (error "Invalid signal" a1 a2))))

;或门的实现
(define or-gate-delay 5);非门延迟时间
(define (or-gate a1 a2 output)
  (define (or-action-procedure)
    (let ((new-value
           (logical-or (get-signal a1) (get-signal a2))))
      (after-delay or-gate-delay
                   (lambda ()
                     (set-signal! output new-value)))))
  (add-action! a1 or-action-procedure)
  (add-action! a2 or-action-procedure))
(define (logical-or a1 a2)
  (cond ((and (= a1 1) (= a2 1)) 1)
        ((and (= a1 1) (= a2 0)) 1)
        ((and (= a1 0) (= a2 1)) 1)
        ((and (= a1 0) (= a2 0)) 0)
        (else (error "Invalid signal" a1 a2))))

;wire的实现
(define (make-wire)
  (let ((signal 0) (action-procs '())) ;信号和关联的处理器
  	(define (set-my-signal! new)
  	  (cond ((= signal new) 'done)
  	        (else
  	          (set! signal new)
  	          (call-each action-procs))))
    (define (accept-action-proc proc)
      (set! action-procs
            (cons proc action-procs))
      (proc))
    (define (dispatch m) ;分发器函数，返回内部的函数（成员函数）
      (cond ((eq? m 'get-signal) signal)
            ((eq? m 'set-signal!) set-my-signal!)
            ((eq? m 'add-action!) accept-action-proc)
            (else
              (error "bad message m" m))))
    dispatch))

;调用所有的注册的处理函数
(define (call-each procedures)
  (cond ((null? procedures) 'done)
        (else
          ((car procedures))
          (call-each (cdr procedures)))))

;反向调用
(define (get-signal wire)
  (wire 'get-signal))
(define (set-signal! wire v)
  ((wire 'set-signal!) v))
(define (add-action! wire proc)
  ((wire 'add-action!) proc) )

;延时的实现
(define (after-delay delay action)
  (add-to-agenda!
    (+ delay (current-time the-agenda))
    action
    the-agenda))

;运行模拟器
(define (propagate)
  (cond ((empty-agenda? the-agenda) 'done)
        (else
          ((first-item the-agenda))
          (remove-first-item! the-agenda)
          (propagate))))

;管理时间和处理函数的容器
;数据结构如下
;(当前时间 ((1, (proc...)) ((2,(proc...) nil))))
;当前时间 -> 时间片(发生时间, 触发函数队列)
; ->时间片(发生时间, 触发函数队列) -> ... ->nil
;整体上来看是一个优先队列
;内部包含一个队列
;(set-car! <pair> <var>)
;(set-cdr! <pair> <var>)
(define (make-agenda)  (list 0))

(define (current-time agenda)
  (car agenda))

(define (set-current-time! agenda time)
  (set-car! agenda time))

(define (segments agenda) (cdr agenda))

(define (set-segments! agenda segments)
  (set-cdr! agenda segments))

(define (first-segment agenda) (car (segments agenda)))
(define (rest-segments agenda) (cdr (segments agenda)))

(define (empty-agenda? agenda)
  (null? (segments agenda)))

(define (add-to-agenda! time action agenda)
  (define (belongs-before? segments)
    (or (null? segments)
        (< time (segment-time (car segments)))))
  (define (make-new-time-segment time action)
    (let ((q (make-queue)))
      (insert-queue! q action)
      (make-time-segment time q)))
  (define (add-to-segments! segments)
    (if (= (segment-time (car segments)) time)
        (insert-queue! (segment-queue (car segments))
                       action)
        (let ((rest (cdr segments)))
          (if (belongs-before? rest)
              (set-cdr!
               segments
               (cons (make-new-time-segment time action)
                     (cdr segments)))
              (add-to-segments! rest)))))
  (let ((segments (segments agenda)))
    (if (belongs-before? segments)
        (set-segments!
         agenda
         (cons (make-new-time-segment time action)
               segments))
        (add-to-segments! segments))))

(define (first-item agenda)
  (if (empty-agenda? agenda)
      (error "Agenda is empty -- FIRST-AGENDA-ITEM")
      (let ((first-seg (first-segment agenda)))
        (set-current-time! agenda (segment-time first-seg))
        (front-queue (segment-queue first-seg)))))

(define (remove-first-item! agenda)
  (let ((q (segment-queue (first-segment agenda))))
    (delete-queue! q)
    (if (empty-queue? q)
        (set-segments! agenda (rest-segments agenda)))))

;时间片的定义
(define (make-time-segment time queue)
  (cons time queue))
(define (segment-time s) (car s))
(define (segment-queue s) (cdr s))

;涉及的队列的定义
(define (front-ptr queue) (car queue))
(define (rear-ptr queue) (cdr queue))
(define (set-front-ptr! queue item) (set-car! queue item))
(define (set-rear-ptr! queue item) (set-cdr! queue item))

(define (make-queue) (cons '() '()))
(define (insert-queue! queue item)
  (let ((new-pair (cons item '())))
    (cond ((empty-queue? queue)
           (set-front-ptr! queue new-pair)
           (set-rear-ptr! queue new-pair)
           queue)
          (else
           (set-cdr! (rear-ptr queue) new-pair)
           (set-rear-ptr! queue new-pair)
           queue))))
(define (delete-queue! queue)
  (cond ((empty-queue? queue)
         (error "DELETE! called with an empty queue" queue))
        (else
         (set-front-ptr! queue (cdr (front-ptr queue)))
         queue)))

(define (front-queue queue)
  (if (empty-queue? queue)
      (error "FRONT called with an empty queue" queue)
      (car (front-ptr queue))))

(define (empty-queue? queue) (null? (front-ptr queue)))

;辅助函数，探测节点的值
(define (probe name wire)
  (add-action! wire
               (lambda ()
                 (newline)
                 (display name)
                 (display " ")
                 (display (current-time the-agenda))
                 (display "  New-value = ")
                 (display (get-signal wire)))))

;测试模拟器
;定义使用的自由变量
(define the-agenda (make-agenda))
(define inverter-delay 2)
(define and-gate-delay 3)
(define or-gate-delay 5)


;定义输入与输出
(define input-1 (make-wire))
(define input-2 (make-wire))
(define sum (make-wire))
(define carry (make-wire))

;开始测试
;探测节点
(probe 'sum sum)
(probe 'carry carry)
;连线到半加器上
(half-adder input-1 input-2 sum carry)
;修改输入
(set-signal! input-1 1)
;执行模拟
(propagate)
;修改输入
(set-signal! input-1 1)
;在此模拟仿真
(propagate)
```

### 4、并发：时间是一个本质问题

### 5、流

在mit-scheme中stream内嵌实现，相关api：

* `stream-car` 取car
* `stream-cdr` 区cdr
* `cons-stream` 构造
* `the-empty-stream` 空流
* `stream-ref` 按照下表查找
* `stream-map` map
* `stream-for-each` foreach
* `stream-null?`
* `stream-filter`

#### （1）流做延时的表

**流的实现**

```scheme
(define (cons-stream x y)
  (cons x (delay y)))
;使用宏实现
(define-syntax cons-stream
  (syntax-rules ()
    ((cons-stream x y) (cons x (delay y)))))

(define (head s)
  (car s))

;force 计算延迟变量引用，计算一个promise
(define (tail s)
  (force (cdr s)))

(define the-empty-steam ())

;相关谓词
(define (empty-stream? s)
  (eq? s the-empty-steam))

;通用高阶函数
;map
(define (map-stream proc s)
  (if (empty-stream? s)
      the-empty-steam
      (cons-stream
        (proc (head s))
        (map-stream proc (tail s)))))
;filter
(define (filter	pred s)
  (cond ((empty-stream? s) the-empty-steam)
        ((pred (head s))
         (cons-stream (head s)
                      (filter pred (tail s))))
        (else (filter pred (tail s)))))

;reduceRight
(define (accumulate combiner init-val s)
  (if (empty-stream? s)
      init-val
      (combiner (head s)
                (accumulate combiner
                            init-val
                            (tail s)))))

(define (append-stream s1 s2)
  (if (empty-stream? s1)
      s2
      (cons-stream
        (head s1)
        (append-stream (tail s1) s2))))

;range
(define (enum-interval low high)
  (if (> low high)
      the-empty-steam
      (cons-stream
        low
        (enum-interval (+ 1 low) high))))

;flatten
(define (flatten st-of-st)
  (accumulate append-stream the-empty-steam st-of-st))

;flatMap
(define (flatmap f s)
  (flatten (map-stream f s)))
```

**delay和force的实现**

```scheme
(define (delay exp)
  (lambda () exp))
(define (force p)
  (p))
;提高效率，添加缓存
(define (delay exp)
  (define (memo-proc proc)
    (let ((already-run? #f) (result ()))
      (lambda ()
        (if (not already-run?)
            (begin
              (set! result (proc))
              (set! already-run? #t)
              result)
            result))))
  (memo-proc (lambda () exp)))
```

#### （2）无穷流

```scheme
;整数无限流
(define (integers-from n)
  (cons-stream n (integers-from (+ n 1))))

(define integers (integers-from 1))

(nth-stream 7 integers)

;整数无限流
(define (integers-from n)
  (cons-stream n (integers-from (+ n 1))))

(define integers (integers-from 1))

(nth-stream 7 integers)

;筛法求素数
(define (sieve s)
  (cons-stream
    (head s)
    (sieve (filter
             (lambda (r)
               (not (= 0 (remainder r (head s)))))
             (tail s)))))

(define primes (sieve (integers-from 2)))

(print-stream primes) ;注意，这是个无限循环

;按元素相加
(define (add-streams s1 s2)
  (cond ((empty-stream? s1) s2)
        ((empty-stream? s2) s1))
        (else
          (cons-stream
            (+ (head s1) (head s2))
            (add-streams (tail s1)
                         (tail s2)))))
;按元素相乘
(define (scale-stream c s)
  (map-stream (lambda (r) (* r c)) s))

;生成1的无限流
(define ones (cons-stream 1 ones))

;整数无限流
(define integers
  (cons-stream 1
    (add-streams integers ones)))

;流积分器
(define (integeral s initial-value dt)
  (define int
    (cons-stream
      init-value
      (add-streams
        (scale-stream dt s)
        int)))
  int)

(define fibs
  (cons-stream
    0 (cons-stream
        1
        (add-streams fibs (tail fibs)))))
```

#### （3）流式计算模型的使用

将迭代表示为流过程

#### （4）流和延迟求值

使用显示的delay延迟求值可能提高灵活性，但是，也会带来复杂性。
一种解决方法是，使用应用序求值

#### （5）函数式程序的模块化和对象的模块化

使用流（或者说延迟求值）可以不使用赋值实现模块化的程序。流模拟的是变化的量，例如某个对象的状态。从本质上来说，流将时间显示的表现出来，因此流解耦了被模拟世界的时间和求值过程中事件发生的顺序之间的紧密联系。

```scheme
;正则序求值语言（所有操作都是延时求值）
;应用序求值语言（标准scheme）
;正则序求值语言无法高效处理迭代的问题并将时间和表达解耦造成程序可读性下降

;对于使用维护状态解决的问题可以使用纯函数式（无副作用）的流来解决
;例如一个银行，接收一个存款，返回用户的余额
;副作用的解决：维护一个状态，余额
;流式的解决：输入一个存款流，转换为一个余额流，伪代码如下
(define (make-deposit-account balance deposit-stream)
  (cons-stream
    balance
    (make-deposit-account
      (+ balance (head deposit-stream))
      (tail deposit-stream))))
```

## 四、元语言抽象

***

### 1、元循环求值器

#### （1）求值器的内核

**eval和apply**

求值过程可以描述成两个过程eval和apply之间的相互作用

* `eval` 拥有两个参数为表达式和环境，eval对表达式进行词法解析分类
* `apply`有两个参数为过程和参数列表，分为两类：基本过程和复合过程

```scheme
(define (eval exp env)
        ;常量类型（支持数字和字符串和bool）
  (cond ((self-evaluating? exp) exp)
        ;变量类型
        ((variable? exp) (lookup-variable-value exp env))
        ;引用类型，形式(quote (1 2 3))
        ((quoted? exp) (text-of-quotation exp))
        ;赋值，形式(set! <var> <value>)
        ((assignment? exp) (eval-assignment exp env))
        ;define语句
        ((definition? exp) (eval-definition exp env))
        ;if语句
        ((if? exp) (eval-if exp env))
        ;lambda表达式，形式 (lambda (p1 ... pn) body) body支持多条语句
        ((lambda? exp)
         (make-procedure (lambda-parameters exp)
                         (lambda-body exp)
                         env))
        ;begin语句
        ((begin? exp)
         (eval-sequence (begin-actions exp) env))
        ;cond语句
        ((cond? exp) (eval (cond->if exp) env))
        ;表达式应用
        ((application? exp)
         (apply (eval (operator exp) env)
                (list-of-values (operands exp) env)))
        ;语法错误
        (else
         (error "Unkown expression type -- EVAL" exp))))

(define apply-in-underlying-scheme apply)

(define (apply procedure arguments)
        ;基本过程
  (cond ((primitive-procedure? procedure)
         (apply-primitive-procedure procedure arguments))
        ;复合过程
        ((compound-procedure? procedure)
         (eval-sequence
           (procedure-body procedure)
           (extend-envirnment
           	 (procedure-parameters procedure)
             arguments
             (procedure-environment procedure))))
        (else
          (error "Unkown expression type -- APPLY" exp))))
```

**在eval中对过程的参数的进行求值**

```scheme
(define (list-of-values exps env)
  (if (no-operands? exps)
      '()
      (cons (eval (first-operand exps) env)
            (list-of-values (rest-operand exps) env))))
```

**条件表达式**

```scheme
(define (eval-if exp env)
  (if (eq? #t (eval (if-predicate exp) env))
      (eval (if-consequent exp) env)
      (eval (if-alternative exp) env)))
```

**多语句解析**

```scheme
;序列，求一组表达式的值，并返回最后一个表达式的值。
(define (eval-sequence exps env)
  (cond ((last-exp? exps) (eval (first-exp exps) env))
        (else (eval (first-exp exps) env)
              (eval-sequence (rest-exps exps) env))))

```

**赋值和定义**

```scheme
(define (eval-assignment exp env)
  (set-variable-value! (assignment-variable exp)
                       (eval (assignment-value exp) env)
                       env)
  'ok)
(define (eval-definition exp env)
  (define-variable! (definition-variable exp)
                    (eval (definition-value exp) env)
                    env)
  'ok)
```

#### （2）表达式的表示

```scheme
;自求值表达式（判断是否是常量：数、字符串）
(define (self-evaluating? exp)
  (cond ((number? exp) #t)
        ((string? exp) #t)
        ((boolean? exp) #t)
        (else #f)))
;判断变量
(define (variable? exp)
  (symbol? exp))

;引号表达式判断
(define (quoted? exp)
  (tagged-list? exp 'quote))
(define (text-of-quotation exp)
  (cadr exp))
;判断有标签列表的标签
(define (tagged-list? exp tag)
  (if (pair? exp)
      (eq? (car exp) tag)
      #f))

;赋值,形式(set! <var> <value>)
(define (assignment? exp)
  (tagged-list? exp 'set!))
(define (assignment-variable exp)
  (cadr exp))
(define (assignment-value exp)
  (caddr exp))

;定义：(define <var> <value>)
;或者
;(define (<var> <paramer1> ... <paramern>)
;  <body>)
;等价于
;(define <var>
;  (lambda (<paramer1> ... <paramern>)
;  <body>))
(define (definition? exp);判断是否是一个定义
  (tagged-list? exp 'define))
(define (definition-variable exp);获得变量/过程名
  (if (symbol? (cadr exp))
      (cadr exp)
      (caadr exp)))
(define (definition-value exp) ;获得变量/过程体
  (if (symbol? (cadr exp))
      (caddr exp)
      ;构造一个lambda
      (make-lambda (cdadr exp) ;获取参数列表
                   (cddr exp)))) ;获取过程体
;构造一个lambda表达式
(define (make-lambda pararmers body)
  (cons 'lambda (cons pararmers body)))

;lambda表达式，是由lambda开头的表
;形式 (lambda (p1 ... pn) body) body支持多条语句
(define (lambda? exp)
  (tagged-list? exp 'lambda))
(define (lambda-parameters exp)
  (cadr exp))
(define (lambda-body exp)
  (cddr exp))


;if语句(if flag consequent <alternative可选>)
(define (if? exp)
  (tagged-list? exp 'if))
(define (if-predicate exp)
  (cadr exp))
(define (if-consequent exp)
  (caddr exp))
(define (if-alternative exp)
  (if (not (null? (cadddr exp)))
      (cadddr exp)
      #f))
;构造一个if表达式
(define (make-if predicate consequent alternative)
  (list 'if predicate consequent alternative))

;begin语句
(define (begin? exp)
  (tagged-list? exp 'begin))
(define (begin-actions exp) ;获取语句
  (cdr exp))
(define (last-exp? seq)
  (null? (cdr seq)))
(define (first-exp seq)
  (car seq))
(define (rest-exps seq)
  (cdr seq))
;构造函数
(define (sequence->exp seq)
  (cond ((null? seq) deq)
        ((last-exp? seq) (first-exp seq))
        (else (make-begin seq))))
(define (make-begin seq)
  (cons 'begin seq))

;其他的实现
(define (application? exp)
  (pair? exp))
(define (operator exp) (car exp))
(define (operands exp) (cdr exp))
(define (no-operands? ops) (null? ops))
(define (first-operand ops) (car ops))
(define (rest-operand ops) (cdr ops))

```

**派生表达式**

```scheme
;cond实现，转换为if-begin
;例如
;(cond ((> x 0) x)
;      ((= x 0) (display 'zero) 0)
;      (else (- x)))
;转换为
;(if (> x 0)
;    x
;    (if (= x 0)
;        (begin (display 'zero) 0)
;        (- x)))
(define (cond? exp)
  (tagged-list? exp 'cond))
(define (cond-clauses exp) ;获取cond条目
  (cdr exp))
(define (cond-else-clause? clause)
  (eq? (cond-predicate clauses) 'else))
(define (cond-predicate clause) ;获取条目的谓词
  (car clause))
(define (cond-actions clause) ;获取条目的动作
  (cdr clause))
(define (cond->if exp)
  (expand-clause (cond-clauses exp)))
(define (expand-clause clauses)
  (if (null? clauses)
      #f
      (let ((first (car clauses))
            (rest (cdr clauses)))
      	(if (cond-else-clause? first)
      	    (if (null? rest)
      	        (sequence->exp (cond-actions first))
      	        (error "ELSE clause isn't last -- COND->IF" clauses))
      	    (make-if (cond-predicate first)
      	             (sequence->exp (cond-actions first))
      	             (expand-clauses rest))))))

```

#### （3）求值器的数据结构

**谓词检测**

```scheme
(define (true? x) (not (eq? x #f)))
(define (false? x) (eq? x #f))
```

**过程的表示**

```scheme
;复合过程
(define (make-procedure paramters body env)
  (list 'procedure paramters body env))
(define (compound-procedure? p)
  (tagged-list? p 'procedure))
(define (procedure-parameters p)
  (cadr p))
(define (procedure-body p)
  (caddr p))
(define (procedure-environment p)
  (cadddr p))
```

**对环境的操作**

```scheme
;对环境的操作
;查找环境中的值，若没有报告一个错误
(define (lookup-variable-value var env)
  (define (env-loop env)
    (define (scan vars vals)
      (cond ((null? vars)
             (env-loop (enclosing-envirnment env)))
            ((eq? var (car vars))
             (car vals))
            (else (scan (cdr vars) (cdr vals)))))
    (if (eq? env the-empty-envirnment)
        (error "Unbound variable" var)
        (let ((frame (first-frame env)))
          (scan (frame-variables frame)
      	        (frame-values frame)))))
  (env-loop env))
;返回一个新的环境，将vars和vals映射，其外围环境为base-env
(define (extend-envirnment vars vals base-env)
  (if (= (length vars) (length vals))
      (cons (make-frame vars vals) base-env)
      (error "The length of variables and values isn't same" vars vals)))

;在环境env的第一个框架添加一个约束var和value
(define (define-variable! var val env)
  (let ((frame (first-frame env)))
  	(define (scan vars vals)
  	  (cond ((null? vars)
             (add-binding-to-frame! var val frame))
            ((eq? var (car vars))
             (set-car! vals val))
            (else (scan (cdr vars) (cdr vals)))))
    (scan (frame-variables frame)
      	  (frame-values frame))))
;修改环境中的变量的值,否则报错
(define (set-variable-value! var val env)
  (define (env-loop env)
    (define (scan vars vals)
      (cond ((null? vars)
             (env-loop (enclosing-envirnment env)))
            ((eq? var (car vars))
             (set-car! vals val))
            (else (scan (cdr vars) (cdr vals)))))
  (if (eq? env the-empty-envirnment)
      (error "Unbound variable" var)
      (let ((frame (first-frame env)))
      	(scan (frame-variables frame)
      	      (frame-values frame)))))
  (env-loop env))

;环境为框架组成的表(frame1 frame2 ... frame3)
;框架为一对表形成的序对((a b c) . (1 2 3)) 也就是 ((a b c) 1 2 3)
(define (enclosing-envirnment env)
  (cdr env))
(define (first-frame env)
  (car env))
(define the-empty-envirnment '())
(define (make-frame variables values)
  (cons variables values))
(define (frame-variables frame)
  (car frame))
(define (frame-values frame)
  (cdr frame))
(define (add-binding-to-frame! var val frame)
  (set-car! frame (cons var (frame-variables frame)))
  (set-cdr! frame (cons val (frame-values frame))))

;环境相关代码的测试
(define env0
  (extend-envirnment
    '(a b c)
    '(1 2 3)
     the-empty-envirnment))
env0
(define env1
  (extend-envirnment
    '(a b d)
    '(4 5 6)
     env0))
env1
(lookup-variable-value 'd env1)
(lookup-variable-value 'a env1)
(define-variable! 'e 7 env1)
(define-variable! 'a 8 env1)
(set-variable-value! 'c 9 env1)
```

#### （3）作为程序运行这个求值器

```scheme
(define primitive-procedures
  (list (list 'car car)
        (list 'cdr cdr)
        (list 'cons cons)
        (list 'null? null?)
        (list '+ +)
        (list '- -)
        (list '* *)
        (list '/ /)))
(define (primitive-procedure-names)
  (map car primitive-procedures))
(define (primitive-procedure-objects)
  (map (lambda (proc) (list 'primitive (cadr proc)))
       primitive-procedures))
(define (setup-environment)
  (let ((initial-env
         (extend-envirnment (primitive-procedure-names)
                            (primitive-procedure-objects)
                            the-empty-envirnment)))
    (define-variable! '#t #t initial-env)
    (define-variable! '#f #f initial-env)
    initial-env))
(define the-global-environment (setup-environment))
(define (primitive-procedure? proc)
  (tagged-list? proc 'primitive))
(define (primitive-implementation proc)
  (cadr proc))

(define (apply-primitive-procedure proc args)
  (apply-in-underlying-scheme
   (primitive-implementation proc) args))

;测试整个求值器
(eval 1 the-global-environment)
(eval "123" the-global-environment)
(eval ''a the-global-environment)
(eval '(if #t 1 2) the-global-environment)
(eval '(define a 1) the-global-environment)
(eval 'a the-global-environment)
(eval '(set! a 2) the-global-environment)
(eval 'a the-global-environment)
(eval '(+ 1 2) the-global-environment)
(eval '((lambda (a b) (+ a b)) 1 2) the-global-environment)
(eval '(define (add a b) (+ a b)) the-global-environment)
(eval '(add 1 2) the-global-environment)

;实现REPL
(define input-prompt ";;; M-Eval input:")
(define output-prompt ";;; M-Eval value:")

(define (driver-loop)
  (prompt-for-input input-prompt)
  (let ((input (read)))
    (let ((output (eval input the-global-environment)))
        (announce-output output-prompt)
        (user-print output)))
  (driver-loop))
(define (prompt-for-input string)
  (newline) (newline) (display string) (newline))
(define (announce-output string)
  (newline)(display string) (newline))
(define (user-print object)
  (if (compound-procedure? object)
      (display (list 'compound-procedure
                     (procedure-parameters object)
                     (procedure-body object)))
      (display object)))
(driver-loop)
```

#### （5）将数据作为程序

scheme中原生提供的eval

```scheme
(eval '(+ 1 2) user-initial-environment)
```

#### （6）内部定义

#### （7）将语法分析与执行分离

添加一个`analyze`过程，进行语法分析，返回一个可执行的过程，这样就可以使分析过程只进行一次。从而提高效率。

### 2、Scheme的变形——惰性求值

### 3、Scheme的变形——非确定性计算

### 4、逻辑程序设计

## 五、寄存器机器里的计算

***

### 1、寄存器机器的设计
