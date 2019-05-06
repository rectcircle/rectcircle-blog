---
title: Effective C++
date: 2018-03-21T09:12:01+08:00
draft: false
toc: false
comments: true
aliases:
  - /detail/129
  - /detail/129/
tags:
  - C/C++
---

## 目录
* [一、让自己习惯C++](#一、让自己习惯C++)
	* [1、视C++为一个语言的联邦](#1、视C++为一个语言的联邦)
	* [2、使用const、enum、inline代替#define](#2、使用const、enum、inline代替#define)
	* [3、尽可能使用const](#3、尽可能使用const)
	* [4、确认对象在使用前被初始化](#4、确认对象在使用前被初始化)
* [二、构造、析构、赋值运算](#二、构造、析构、赋值运算)
	* [5、了解C++编译器默认编写并调用了那些函数](#5、了解C++编译器默认编写并调用了那些函数)
	* [6、若不想使用编译器自动生成的函数，就该明确拒绝](#6、若不想使用编译器自动生成的函数，就该明确拒绝)
	* [7、为多态基类生命virtual析构函数](#7、为多态基类生命virtual析构函数)
	* [8、别让异常逃离析构函数](#8、别让异常逃离析构函数)
	* [9、绝不在构造和析构过程中调用virtual函数](#9、绝不在构造和析构过程中调用virtual函数)
	* [10、令operator=返回一个reference to \*this](#10、令operator=返回一个reference to \*this)
	* [11、在operator=中处理自我赋值](#11、在operator=中处理自我赋值)
	* [12、复制对象勿忘其每一成分](#12、复制对象勿忘其每一成分)
* [三、资源管理](#三、资源管理)
	* [13、以对象管理资源](#13、以对象管理资源)
	* [14、在资源管理类中小心copying行为](#14、在资源管理类中小心copying行为)
	* [15、在资源管理类中提供对原始资源的访问](#15、在资源管理类中提供对原始资源的访问)
	* [16、成对new和delete时要采取与相同形式](#16、成对new和delete时要采取与相同形式)
	* [17、以独立语句将newed对象置入智能指针](#17、以独立语句将newed对象置入智能指针)
* [四、设计与声明](#四、设计与声明)
	* [18、让接口容易被正确使用，不易被误用](#18、让接口容易被正确使用，不易被误用)
	* [19、设计class犹如设计type](#18、设计class犹如设计type)
	* [20、宁以pass-by-reference-const替换pass-by-value](#20、宁以pass-by-reference-const替换pass-by-value)
	* [21、必须返回对象，别妄想返回其reference](#21、必须返回对象，别妄想返回其reference)
	* [22、将成员声明为private](#22、将成员声明为private)
	* [23、宁以non-member、non-friend替换member](#22、宁以non-member、non-friend替换member)
	* [24、若所有参数皆需类型转换，轻为此采用non-member函数](#23、若所有参数皆需类型转换，轻为此采用non-member函数)
	* [25、考虑写一个不抛出异常的swap函数](#24、考虑写一个不抛出异常的swap函数)
* [五、实现](#五、实现)
	* [26、尽可能延后定义变量式的出现时间](#26、尽可能延后定义变量式的出现时间)
	* [27、尽量少做转型动作](#27、尽量少做转型动作)
	* [28、避免返回handles指向对象内部部分](#28、避免返回handles指向对象内部部分)
	* [29、为异常安全而努力是值得的](#29、为异常安全而努力是值得的)
	* [30、透彻了解inlining的里里外外](#30、透彻了解inlining的里里外外)
	* [31、将文件间的编译依存关系将至最低](#31、将文件间的编译依存关系将至最低)
* [六、继承与面向对象设计](#六、继承与面向对象设计)
	* [32、确定你的public继承塑模出is-a关系](#32、确定你的public继承塑模出is-a关系)
	* [33、避免遮掩继承而来的名称](#33、避免遮掩继承而来的名称)
	* [34、区分接口继承和实现继承](#34、区分接口继承和实现继承)
	* [35、考虑virtual之外的其他选择](#35、考虑virtual之外的其他选择)
	* [36、绝不重新定义继承而来的非虚函数](#36、绝不重新定义继承而来的非虚函数)
	* [37、绝不重新定义继承而来的缺省参数值](#37、绝不重新定义继承而来的缺省参数值)
	* [38、通过复合塑模出has-a或“根据某物出现过”](#38、通过复合塑模出has-a或“根据某物出现过”)
	* [39、明确而谨慎的使用private继承](#39、明确而谨慎的使用private继承)
	* [40、明智而审慎的使用多重继承](#40、明智而审慎的使用多重继承)
* [七、模板与泛型编程](#七、模板与泛型编程)
	* [41、了解隐式接口和编译器多态](#41、了解隐式接口和编译器多态)
	* [42、了解typename的双重含义](#42、了解typename的双重含义)
	* [43、学习处理模板化基类内的名称](#43、学习处理模板化基类内的名称)
	* [44、将参数无关的代码抽离templates](#44、将参数无关的代码抽离templates)
	* [45、运行成员函数模板接收所有兼容类型](#45、运行成员函数模板接收所有兼容类型)
	* [46、需要类型转换时请为模板定义非成员函数](#46、需要类型转换时请为模板定义非成员函数)
	* [47、请使用traits classes表现类型信息](#47、请使用traits classes表现类型信息)
	* [48、认识template元编程](#48、认识template元编程)
* [八、定制的new和delete](#八、定制的new和delete)
	* [49、了解new-handler的行为](#49、了解new-handler的行为)
	* [50、了解new和delete的合理替换时机](#50、了解new和delete的合理替换时机)
	* [51、编写new和delete时需要固守常规](#51、编写new和delete时需要固守常规)
	* [52、写了placement new也要写placement delete](#52、写了placement new也要写placement delete)
* [九、杂项讨论](#九、杂项讨论)
	* [53、不要轻忽编译器的警告](#53、不要轻忽编译器的警告)
	* [54、让自己熟悉包括TR1在内的标准程序库](#54、让自己熟悉包括TR1在内的标准程序库)
	* [55、让自己熟悉Boost](#55、让自己熟悉Boost)

## 一、让自己习惯C++
**************************************
### 1、视C++为一个语言的联邦
C++是一种多范式的编程语言，包含面向过程的C、面向对象、面向模板元编程、函数式编程。强大灵活带来的更多的是复杂性。


### 2、使用const、enum、inline代替#define
#### （1）`#define`的缺点
* 难以调试
* 全局性
* 没有检查
* 宏函数参数求值顺序与C++函数不同

#### （2）做法
* 单纯的常量使用const代替#define
* 使用内联函数代替宏函数

### 3、尽可能使用const
#### （1）const的复杂语义
* 常量指针 `const int *i = &a` 不应许通过\*i改变改变a的值
* 指针常量 `int * const i = &a` 不允许改变i的指向
* 函数返回值（特别是运算符重载函数）添加const修饰，表示不允许修改隐性返回值（帮助检查==错拼为=）
* const修饰成员函数（返回值和方法体前均加const），可以使const和非const对象选择不同的函数执行

#### （2）做法
* 使用const做编译检查
* 编译器强制实施bitwise constness，在写程序时应使用概念上的常量性
* 当const和non-const成员函数有实质等价实现时，non-const调用const实现


### 4、确认对象在使用前被初始化
#### （1）做法
* 对内置对象进行手动初始化
* 构造函数使用成员初始化表实现初始化
* 为了避免跨编译单元初始化次序（如单例对象的实现），使用local-static代替non-local static

## 二、构造、析构、赋值运算
****************************************************
### 5、了解C++编译器默认编写并调用了那些函数
#### （1）类中缺省实现的函数
* 无参数构造函数
* 缺省拷贝构造函数
* 析构函数
* 赋值运算符重载

### 6、若不想使用编译器自动生成的函数，就该明确拒绝
* 将响应的函数生命在private域，并不提供是实现

### 7、为多态基类生命virtual析构函数
* 多态基类应该声明一个virtual析构函数（也就是说带有virtual的函数就应发就应该使用虚析构函数）
* 非基类不应该使用虚析构函数

### 8、别让异常逃离析构函数
* 析构函数不应该抛出异常
* 如果无法实现，应该将析构函数中抛出异常的部分提出来重构成一个普通函数，再抛出异常。

### 9、绝不在构造和析构过程中调用virtual函数
#### （1）原因
C++对象的构造和析构顺序，此时多态体系还没构建完成或者已经销毁。所以不可能实现多态。

### 10、令operator=返回一个reference to \*this
赋值运算符重载返回`*this`的引用有助于使用连续赋值的语法。


### 11、在operator=中处理自我赋值
添加自我复制检测，如果出现自我赋值，什么都不做

### 12、复制对象勿忘其每一成分
* 拷贝构造函数应该确保复制对象内的所有成员变量及所有基类成分



## 三、资源管理
***************************
### 13、以对象管理资源
#### （1）RAII思想
* 获得资源后立即放进管理对象
* 管理对象运行析构函数确保资源被释放

#### （2）C++提供的RAII对象
**`std::auto_ptr<T>(T *t)`**
智能指针，在析构时自动delete `T*`
该对象禁用了拷贝行为（拷贝构造函数和赋值运算符将导致源对象设为NULL）

**`std::tr1::shared_ptr<T>(T *t)`**
引用计数型智慧指针，通过引用技术判断是否需要delete资源t，但不能处理环状引用。

#### （3）做法
* 为了防止资源泄露，请使用RAII对象，他们在构造函数获取资源、在析构函数释放资源
* 两个RAII队形的区别在于copy行为

### 14、在资源管理类中小心copying行为
* 自己实现RAII时要注意copy行为，防止多次执行资源释放。
* 自己实现RAII可以使用`shared_ptr`，根据业务给出一个删除器（deleter）——在应用计数为0的时候析构时执行的行为


### 15、在资源管理类中提供对原始资源的访问
* RAII 往往要求提供原始资源访问
* 可以通过显示转换（提供get方法）或隐式转换，但一般显示转换较为安全

### 16、成对new和delete时要采取与相同形式
* 若在new中使用了`[]`，在delete中也要使用`[]`


### 17、以独立语句将newed对象置入智能指针
#### （1）例子
一个函数第一个参数为RAII对象，第二个参数为其他参数且通过一个函数获得
```cpp
processWidget(std::tr1::shared_ptr<T>(new T), priority());
```
由于编译指令重排可能的执行顺序为：
* `new T`
* `priority()`
* `shared_ptr`初始化

**这样如果`priority()`异常，则会造成内存泄露**

所以需要将newed单独写成一条语句：
```cpp
std::tr1::shared_ptr<T> pw(new T);
processWidget(pw, priority());
```

#### （2）做法
以独立语句将newed对象置入智能指针。如果不这么做，一旦异常抛出，将有可能导致难以察觉的资源泄露


## 四、设计与声明
*************************************
### 18、让接口容易被正确使用，不易被误用
* 促进正确使用包括：接口一致性，与内置类型兼容
* 防止勿用：建立新类型、限制类型上的操作、束缚对象值、消除客户程序员对资源的管理职责
* 使用`tr1::shared_ptr`支持定义型删除器。可以防止DLL问题，可被用来自动解除互锁

### 19、设计class犹如设计type
思考一下问题：
* 新类型的对象应该如何被创建和销毁？
* 对象的初始化和对象的赋值有怎样的差别？
* 新type的对象如果被passed by value，意味着什么？定义合适的拷贝构造函数
* 什么是新类型的合法值？setter和构造函数进行边界检查
* 你的新type需要配合某个继承图系？是否声明为virtual、是否使用虚析构函数
* 你的新type需要什么样的转换？是否使用构造函数隐式转换
* 什么样的操作符和函数对此新type是合理的？
* 什么样的标准函数应该驳回？见6
* 谁该取用新的type成员？
* 什么是新的type的未声明接口？
* 新的type有多么的一般？是否使用模板类
* 真的需要一个新type吗


### 20、宁以pass-by-reference-const替换pass-by-value
* 最好使用pass-by-reference-const，而不是pass-by-value，因为前者效率高（省下copy和析构）
* 以上规则不适用于内置类型，以及STL的迭代器和函数对象。对他们而言，pass-by-value更合适

### 21、必须返回对象，别妄想返回其reference
#### （1）返回对象引用的问题
* 若在栈上建立对象，在函数返回否就会被销毁，引用指向了一个未定义的地方
* 若在堆上建立对象，会造成内存泄露
* 使用static做缓存，会在多线程或者判等存在问题

#### （2）做法
返回一个对象，通过栈建立对象，然后返回该对象本身（编译器会优化临时对象的建立销毁）

测试代码
```cpp
#include <iostream>
using namespace std;
class Object
{
public:
    Object():Object(0){
        cout<<"Object()构造函数执行"<<endl;
    };
    Object(int a):a(a){
        cout<<"Object(int a)构造函数执行"<<endl;
    };
    ~Object(){
        cout<<"析造函数执行"<<endl;
    };
    Object(const Object &o){
        cout<<"拷贝构造函数执行"<<endl;
        a = o.a;
    }
    const Object& operator=(const Object &o){
        cout<<"赋值运算符重载执行"<<endl;
        a = o.a;
    }
    static Object &add1Err1(const Object & o){
        cout<<"拷贝==="<<endl;
        Object ans(o); 
        ans.a++;
        cout<<"准备返回==="<<endl;
        return ans;
    }
    static Object &add1Err2(const Object & o){
        cout<<"拷贝==="<<endl;
        Object *ans = new Object(o); 
        ans->a++;
        cout<<"准备返回==="<<endl;
        return *ans;
    }
    static Object &add1Err3(const Object & o){
        cout<<"拷贝==="<<endl;
        static Object ans;
        ans = o;
        ans.a++;
        cout<<"准备返回==="<<endl;
        return ans;
    }
    static Object add1(const Object & o){
        cout<<"拷贝==="<<endl;
        Object ans(o); 
        ans.a++;
        cout<<"准备返回==="<<endl;
        return ans;
    }
    bool operator== (const Object& o){
        return a == o.a;
    }
private:
    int a;
};



int main(){
    Object o;
    cout<<"==================="<<endl;
    Object o1(1);
    cout<<"==================="<<endl;
    Object o2 = o1;
    cout<<"==================="<<endl;
    o2 = o1;
    cout<<"==================="<<endl;
    // Object o3 = Object::add1Err1(o1); //返回的对象已销毁
    cout<<"==================="<<endl;
    Object o4 = Object::add1Err2(o1); //运行正确内存泄漏
    cout<<"==================="<<endl;
    cout<<(Object::add1Err3(o) == Object::add1Err3(o1))<<endl; //总是返回1
    cout<<"==================="<<endl;
    Object o5 = Object::add1(o1);

    cout<<"==================="<<endl;
    return 0;
}
```
### 22、将成员声明为private
* 若声明为public，完全没有封装性
* 若声明为protected，修改成员变量会影响所有派生类


### 23、宁以non-member、non-friend替换member
* 因为non-member、non-friend函数不能访问对象成员所以具有更高的封装性。
* 可以更加的模块化，使不同类型的函数放在不同的namespace中


### 24、若所有参数皆需类型转换，轻为此采用non-member函数
类有一个有理数类型Rational。为了支持与int数的运算
若使用成员函数
```cpp
Rational{
	const Rational operator*(const Rational& rhs) const;
};
result = oneHalf*2; //正确
result = 2*oneHalf; //错误
```
若使用非成员函数
```cpp
const Rational(const Rational& lhs, const Rational&rhs){}
result = oneHalf*2; //正确
result = 2*oneHalf; //正确
```

### 25、考虑写一个不抛出异常的swap函数
* 缺省的swap函数涉及一次拷贝构造函数执行和两次赋值执行，效率低下
* 提供一个成员swap同时，也要提供一个非成员的swap——通过成员swap实现。对于非模板class，特化std::swap
* 调用swap针对std::swap使用using声明式，然后调用swap并且不带任何命名空间资格修饰
* 为用户定义类型进行std template全特化是好的，但不要尝试在std中添加对std而言是全新的东西

## 五、实现
******************************
## 26、尽可能延后定义变量式的出现时间
* 提早定义变量可能是C语言遗留下来的习惯
* 提早定义变量可能导致未使用或增加构造函数的执行时间
* 延后定义有助于提高效率

### 27、尽量少做转型动作
#### （1）C风格的转型
* `(T)exp` 
* `T(exp)`

#### （2）C++提供的新式转换
* `const_cast<T>(exp)`
	* 常量性移除转换
* `dynamic_cast<T>(exp)`
	* 安全向下转型
* `reinterpret_cast<T>(exp)`
	* 低级转型
* `static_cast<T>(exp)`
	* 强制执行隐式转换

#### （3）做法
如果可以尽少使用转型，特别在注重效率的代码中避免dynamic_casts
如果转型是必要的，试着将他隐藏于某个函数
尽量使用新式转型



### 28、避免返回handles指向对象内部部分
* 避免返回handles(包括引用、指针、迭代器)指向内部对象。遵守这个条款可以增加封装性
* 如果仅仅使用const修饰返回的handles，也可能出现指向不存在的位置（因为生命周期不同）

### 29、为异常安全而努力是值得的
#### （1）异常安全函数提供一下三个保证之一
* 基本承诺：若抛出异常，程序内部事务仍保持有序状态
* 强烈保证：如果异常抛出，程序状态不变。
* 不抛掷保证：保证绝不抛出异常

#### （2）做法
* 强烈保证往往可以通过copy-and-swap实现

### 30、透彻了解inlining的里里外外
#### （1）相关背景
* 定义在类内部的成员函数隐喻者inline
* 内联可能带来更大的目标代码
* inline是一种编译器建议，并不一定会实施
* 内联函数一般放在头文件中
* virtual函数一定不会被内联
* 通过编译器的诊断级别可以查看那些inline没有被内联
* 即使inline实施，但是还会编译这个函数，因为可能出现函数指针指向他
* 构造函数可能不适合内联，因为编译器会产生大量相关代码
* 内联函数不能使用动态链接库之类的手段动态升级/迭代，必须手动全部编译

#### （2）做法
* 将大多数内联限制在小型、调用频繁的函数上
* 不要因为function template出现在头文件，就声明为inline

### 31、将文件间的编译依存关系将至最低
* 支持“编译依存性最小化”的一般构想是：相依于声明式，不相依与定义式。基于此构想的两个手段是Handle classes 和 Interface classes
* 程序库头文件应该一“完全且仅有的声明式”的形式存在。这种做法不论是否涉及templates都使用

## 六、继承与面向对象设计
************************************
### 32、确定你的public继承塑模出is-a关系
#### （1）错误的继承
* 鸟会飞，企鹅继承鸟，企鹅会飞。修改：
	* 鸟，会飞的鸟，企鹅继承鸟
	* 鸟会飞，企鹅继承鸟，企鹅重写飞，抛出错误
* 长方形，正方形继承长方形。错误原因
	* 某些可以施加于矩形上的事情（例如高度和宽度可以被外界单独修改）却不可实行在正方形上

#### （2）做法
* public继承意味着is-a。适用于base-class的每一件事都适用于派生类，因为每一个派生类对象也是一个基类对象


### 33、避免遮掩继承而来的名称
如果你继承了基类（包含重载函数），又希望覆写其中的一部分，那么需要在子类中显示的使用using生命父类的名称如：`using Base::mf1`

或者使用转交函数，然后显示的调用父类的方法
```cpp
//父类
virtual void mf1() = 0;
virtual void mf1(int);

//子类
virtual void mf1(){ Base::mf1();}
//这样mf1可见，mf1(int)不可见
```

#### （1）做法
* 派生类内的名字会遮掩基类内的名字。在public继承下从来没有人希望如此
* 为了让遮掩的名字重见天日，可以使用using是声明或者使用转交函数

### 34、区分接口继承和实现继承
* 接口继承和是实现继承不同。在public继承下，派生类总是继承基类的接口
* 纯虚函数只具体指定接口继承
* 普通虚函数具体指定接口继承及缺省实现继承
* 非虚函数指定接口继承以及强制性实现继承

### 35、考虑virtual之外的其他选择
* virtual函数的替代方案包括NVI(non-virtual interface)及策略设计模式的多种形式。NVI手段是一种特殊形式的模板方法设计模式
* 将机能函数移到class外部，带来的缺点是非成员函数无法访问其成员
* tr1::function对象的行为就像一般函数指针。可以接纳“与给定之目标签名式兼容”的所有可调用物。


### 36、绝不重新定义继承而来的非虚函数
当重新定义继承而来的非虚函数后，程序的行为就依赖于指针的类型

### 37、绝不重新定义继承而来的缺省参数值
因为函数参数的缺省值为静态绑定，此时与动态绑定的虚函数使用会出现意想不到的问题：函数调用符合多态性，默认参数取决于静态类型


### 38、通过复合塑模出has-a或“根据某物出现过”
* 复合的意义和public继承完全不同
* 在应用域，复合意味着has-a；在实现域，符合意味着is-implemented-in-terms-of（根据某事物现出）


### 39、明确而谨慎的使用private继承
* private继承意味着is-implemented-in-terms-of（根据某事物现出）。他通常比复合级别低。但当派生类需要访问protected基类成员，或重新定义继承而来的虚函数，这个设计是合理的
* 和符合不同，private继承可以造成empty base最优化。这对于致力于“对象尺寸最小化”的程序库开发者而言，可能很重要。


### 40、明智而审慎的使用多重继承
#### （1）多重继承的问题
* 基类出现多个同名函数或成员，使用会出现二义性，需要精确指明调用哪一个
* 钻石型多重继承，可能出现二义性
	* 精确指明使用哪一个
	* 使用virtual继承`class B:virtual public A{/**/}`

#### （2）做法
* 多重继承比单一继承。他可能导致新的歧义性，以及对virtual继承的需要
* virtual继承会增加大小、速度、初始化复杂度等成本。如果虚基类不带任何数据，将最具实用价值
* 多重继承的确有正当的用途。其中一个涉及“public 继承某个接口类” 和 “private 继承某个协助实现的class”的两相组合




## 七、模板与泛型编程
**********************
### 41、了解隐式接口和编译器多态
不用与Java的泛型，C++模板更加自由，使用基于表达式语句的形式判断可以传进来的类型，不需要Java或者Scala的显示声明上下界

* classes和templates都支持接口和多态
* 对classes而言接口是显式的，以函数签名为中心，多态使用virtual函数发生在运行期
* 对于templates参数而言，接口隐式的，基于有效的表达式，多态则通过template具象化函数重载解析发生在编译期

### 42、了解typename的双重含义
* 声明template参数时，class和typename可以互换
* 使用typename标识嵌套从属类型名称：但不得在base class lists 或 成员初始化列表中使用。

例子
```cpp
template <typename C>
void p(const C& c){
	C::const_iterator iter(c.begin()); //C::const_iterator可能有两种含义：标识符嵌套，类的静态成员（默认）
	 typename C::const_iterator iter(c.begin()); //表示：标识符嵌套
	//...
}
```

### 43、学习处理模板化基类内的名称
在模板类的派生类中，无法直接通过函数名调用模板基类的方法可以通过三种方式解决：
* 使用`this->基类方法名`
* 使用using声明方法`using BaseClass<T>::基类方法名;`
* 调用时指明（会导致虚函数失效）：`BaseClass<T>::基类方法名(参数列表);`


### 44、将参数无关的代码抽离templates
C++编译器对待模板类处理方法是：在模板类真正使用的时候对其进行具象化（如果有10个不同类型参数的类，编译器就会产生10个类；和Java的类型擦除不一样），这会导致代码膨胀。解决的办法是共性变性分析。

* Templates生成多个classes或者函数，所以任何templates代码都不该与某个造成膨胀的template参数产生依赖关系
* 因为非类型模板参数造成的代码膨胀可以使用类成员或函数参数解决
* 让带有完全相同二进制表述的具现类型实现共享代码


### 45、运行成员函数模板接收所有兼容类型
在C++中类型参数不同的同一个模板类实例代表者完全不同的类，为了实现不同模板参数实例的相互赋值，需要：

* 使用成员函数模板生成可接受所有兼容类型的函数
* 需要声明用于泛化拷贝构造函数和泛化赋值操作的函数


### 46、需要类型转换时请为模板定义非成员函数
当我们编写模板类，而他提供与之相关的隐式转换时请使用，请将函数定义在模板类内部，并声明为friend


### 47、请使用traits classes表现类型信息
#### （1）特质
* 可能存在多个
* 使用template struct实现
* 确认若干个你希望将来可获取的类型信息（如迭代器的分类信息）
* 为该信息选择一个名称（例如：iterator_category）
* 提供一个template和一组特化版本（例如iterator_traits），内含你希望的类型信息
* 然后就可以通过typeid或者函数重载实现，使用同一个名字针对不同类型的处理。

#### （2）做法
* Traits classes使类型信息在编译器可用。他们以templates和templates特化完成实现
* 整合重载技术，traits classes有可能在编译器对执行类型进行ifelse测试

#### （3）stl中的迭代器的实现
```cpp
//类型定义
struct input_iterator_tag {};  
struct output_iterator_tag {};  
struct forward_iterator_tag : public input_iterator_tag {};  
struct bidirectional_iterator_tag : public forward_iterator_tag {};  
struct random_access_iterator_tag : public bidirectional_iterator_tag {};  

//真正的迭代器对象，也即使是容器内的是实现
template <class T, class Distance> struct input_iterator {  
  typedef input_iterator_tag iterator_category;  
};  
struct output_iterator {  
  typedef output_iterator_tag iterator_category;  
};  
template <class T, class Distance> struct forward_iterator {  
  typedef forward_iterator_tag iterator_category;  
};  
template <class T, class Distance> struct bidirectional_iterator {  
  typedef bidirectional_iterator_tag iterator_category;  
};  
template <class T, class Distance> struct random_access_iterator {  
  typedef random_access_iterator_tag iterator_category;  
};  

//使用 一个迭代器随机移动的函数
template <class InputIterator, class Distance>  
inline void advance(InputIterator& i, Distance n) {  
  __advance(i, n, iterator_traits<InputIterator>::iterator_category()); //构造一个临时的xx_iterator_tag对象  
}  
template <class InputIterator, class Distance>  
inline void __advance(InputIterator& i, Distance n, input_iterator_tag) {  
  while (n--) ++i;  
}  
template <class BidirectionalIterator, class Distance>  
inline void __advance(BidirectionalIterator& i, Distance n,   
                      bidirectional_iterator_tag) {  
  if (n >= 0)  
    while (n--) ++i;  
  else  
    while (n++) --i;  
}  
template <class RandomAccessIterator, class Distance>  
inline void __advance(RandomAccessIterator& i, Distance n,   
                      random_access_iterator_tag) {  
  i += n;  
}  
```

### 48、认识template元编程
模板元编程是：使用C++写的执行在C++编译器中的，用于生成特化的C++代码的语言。


## 八、定制的new和delete
*****************************
### 49、了解new-handler的行为
#### （1）概念
* new handler是一个回调函数。
* 当new操作失败时，就会不断的调用new-handler直到找到足够的空间
* 如何设定new handler，通过`new_handle set_new_handler(new_handler p)` 注册

#### （2）new handler必须做的事情
* 使更多的内存可以被使用
* 安装另一个new-handler
* 卸除new-handler
* 抛bad_alloc
* 不返回

#### （3）做法
* `set_new_handler`允许客户指定一个函数，在内存分配无法满足是被调用
* Nothrow new是一个颇为局限性的new，因为他只适合内存分配：后继的构造函数调用还是可能抛出异常

### 50、了解new和delete的合理替换时机
* 为了检测运用错误
* 为了收集动态分配内存的使用信息
* 为了提高效率

### 51、编写new和delete时需要固守常规
* operator new 将包含一个无限循环，并在其中尝试分配内存，如果他无法满足内存需求，就该调用new-handler。他应该有处理0字节申请的能力。class专属版本则还应该处理比正确大小更大的（错误）申请
* operator delete应该收到null指针时不做任何事情。class专属版本还应该处理“比正确大小更大的错误申请”

### 52、写了placement new也要写placement delete
#### （1）placement new含义
标准new函数的重载形式例如
```
class Base
	static void* operator new(std::size_t size, std::ostream& logStream) throw(std::bad_alloc){
		//...
	}
}
Base *pa= new Base; //error 标准new已被覆盖
Base *pb= new (std::cerr) Base; //success
```

#### （2）做法
* 当你写一个placement operator new，请实现对应的placement operator delete。否则可能发生隐微而时断时续的内存泄露
* 当实现placement operator new和placement operator delete，不要无意识的覆盖其正常版本


## 九、杂项讨论
*************************
### 53、不要轻忽编译器的警告
* 严肃对待编译器警告，努力做到最严格的编译警告级别无警告
* 不要过度依赖编译器报警能力，因为不同编译器对待事务态度不同，一旦移植到了另外一个编译器上，编译警告信息可能消失

### 54、让自己熟悉包括TR1在内的标准程序库
* C++标准库的主要技能有STL、iostreams、locales。并包含C99标准的程序库
* TR1添加了智能指针、一般化函数指针、hash-based容器、正则表达式及另外10个组件支持


### 55、让自己熟悉Boost
略

