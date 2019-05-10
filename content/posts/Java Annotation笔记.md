---
title: Java Annotation笔记
date: 2017-05-16T21:40:46+08:00
draft: false
toc: true
comments: true
aliases:
  - /detail/76
  - /detail/76/
tags:
  - Java
---

> 参考：
> http://blog.csdn.net/lylwo317/article/details/52163304
> http://www.cnblogs.com/peida/archive/2013/04/24/3036689.html

### 1、原理

#### （1）简单使用

**定义**

```java
package com.rectcircle.javaapi.lang.annotation;

import java.lang.annotation.*;

/**
 * @author Rectcircle
 *         createTime 2017/5/16
 */
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
public @interface HelloAnnotation {

	String say() default "Hi";

}
```

**使用**

```java
package com.rectcircle.javaapi.lang.annotation;

import java.lang.annotation.Target;

/**
 * @author Rectcircle
 *         createTime 2017/5/16
 */
@HelloAnnotation(say = "Hello Annotation!")
public class AnnotationTest {
	public static void main(String[] args) {
		HelloAnnotation annotation = AnnotationTest.class.getAnnotation(HelloAnnotation.class);//获取TestMain类上的注解对象
		System.out.println(annotation.say());//调用注解对象的say方法，并打印到控制台
	}
}
```

#### （2）实现流程

* 用户定义了一个注解类型
* 用户在另一个地方使用注解
* 编译源码的过程中，用户自定义的注解编译成为继承了`Annotation`接口的接口
* 在java运行时，jvm检测到使用注解的位置，jvm将动态生成一个实现了注解接口的对象绑定到那个位置。
* 用户可以使用这个注解实现一些事情，比如注入一些信息

#### （3）常用内置注解

* `@Override`若该注解使用在不是覆盖父类方法的地方将警告，防止拼错方法名
* `@Deprecated`标记过时，建议不要使用
* `@SuppressWarnings`抑制编译器警告

### 2、元注解

#### （0）作用

元注解，注解的注解，用于定义注解类型

#### （1）`java.lang.annotation.Target`

在定义注解类型时，指出该注解可以使用的范围，可选值为 `java.lang.annotation.ElementType`

* `ElementType.TYPE` 类、接口（包括注解类型）或者枚举类型
* `ElementType.FIELD` 字段声明（包括枚举常量）
* `ElementType.METHOD` 方法声明
* `ElementType.PARAMETER` 方法参数声明
* `ElementType.CONSTRUCTOR` 构造函数声明
* `ElementType.LOCAL_VARIABLE` 局部变量声明
* `ElementType.ANNOTATION_TYPE` 注释类型声明
* `ElementType.PACKAGE` 包声明

例子

```java
@Target(ElementType.TYPE)
public @interface Table {
    /**
     * 数据表名称注解，默认值为类名称
     * @return
     */
    public String tableName() default "className";
}

@Target(ElementType.FIELD)
public @interface NoDBColumn {

}
```

#### （2）`java.lang.annotation.Retention`

在定义注解类型时，指出该注解的声明周期（被保留的时间长短），可选值为 `java.lang.annotation.RetentionPolicy`

* `RetentionPolicy.SOURCE` 编译器要丢弃的注释。
* `RetentionPolicy.CLASS` 编译器将把注释记录在类文件中，但在运行时 VM 不需要保留注释。
* `RetentionPolicy.RUNTIME` 编译器将把注释记录在类文件中，在运行时 VM 将保留注释，因此可以反射性地读取。

#### （3）`java.lang.annotation.Documented`

在定义注解类型时，指出该注解的信息是否加入javadoc中，没有成员，仅作为标记

#### （4）`java.lang.annotation.Inherited`

在定义注解类型时，指出该注解是否具有遗传性，也就是说，父类使用此注解，子类是否仍要继承该注解
没有成员仅作为标记

### 3、定义注解类型

使用@interface自定义注解时，自动继承了java.lang.annotation.Annotation接口，由编译程序自动完成其他细节。在定义注解时，不能继承其他的注解或接口。@interface用来声明一个注解，其中的每一个方法实际上是声明了一个配置参数。方法的名称就是参数的名称，返回值类型就是参数的类型（返回值类型只能是基本类型、Class、String、enum）。可以通过default来声明参数的默认值。

#### （1）定义注解格式

```java
public @interface 注解名 {定义体}
```

#### （2）注解参数的可支持数据类型

* 所有基本数据类型（int,float,boolean,byte,double,char,long,short)
* String类型
* Class类型
* enum类型
* Annotation类型
* 以上所有类型的数组

#### （3） 定义注解参数的一般做法

第一,只能用public或默认(default)这两个访问权修饰.例如,String value();这里把方法设为defaul默认类型；
第二,参数成员只能用基本类型byte,short,char,int,long,float,double,boolean八种基本数据类型和 String,Enum,Class,annotations等数据类型,以及这一些类型的数组.例如,String value();这里的参数成员就为String;
第三,如果只有一个参数成员,最好把参数名称设为"value",后加小括号.例:下面的例子FruitName注解就只有一个参数成员。

### 4、获取注解信息

#### （1）注解处理器类库(`java.lang.reflect.AnnotatedElement`)

Java使用Annotation接口来代表程序元素前面的注解，该接口是所有Annotation类型的父接口。除此之外，Java在java.lang.reflect 包下新增了AnnotatedElement接口，该接口代表程序中可以接受注解的程序元素，该接口主要有如下几个实现类：

* Class：类定义
* Constructor：构造器定义
* Field：累的成员变量定义
* Method：类的方法定义
* Package：类的包定义

#### （2）AnnotatedElement定义的方法

* `<T extends Annotation> T getAnnotation(Class<T> annotationClass)`: 返回改程序元素上存在的、指定类型的注解，如果该类型注解不存在，则返回null。
* `Annotation[] getAnnotations()`:返回该程序元素上存在的所有注解。
* `boolean is AnnotationPresent(Class<?extends Annotation> annotationClass)`:判断该程序元素上是否包含指定类型的注解，存在则返回true，否则返回false.
* `Annotation[] getDeclaredAnnotations()`：返回直接存在于此元素上的所有注释。与此接口中的其他方法不同，该方法将忽略继承的注释。（如果没有注释直接存在于此元素上，则返回长度为零的一个数组。）该方法的调用者可以随意修改返回的数组；这不会对其他调用者返回的数组产生任何影响。

### 5、例子

```java
/***********注解声明***************/

/**
 * 水果名称注解
 * @author peida
 *
 */
@Target(ElementType.FIELD)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface FruitName {
    String value() default "";
}

/**
 * 水果颜色注解
 * @author peida
 *
 */
@Target(ElementType.FIELD)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface FruitColor {
    /**
     * 颜色枚举
     * @author peida
     *
     */
    public enum Color{ BULE,RED,GREEN};

    /**
     * 颜色属性
     * @return
     */
    Color fruitColor() default Color.GREEN;

}

/**
 * 水果供应者注解
 * @author peida
 *
 */
@Target(ElementType.FIELD)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface FruitProvider {
    /**
     * 供应商编号
     * @return
     */
    public int id() default -1;

    /**
     * 供应商名称
     * @return
     */
    public String name() default "";

    /**
     * 供应商地址
     * @return
     */
    public String address() default "";
}

/***********注解使用***************/

public class Apple {

    @FruitName("Apple")
    private String appleName;

    @FruitColor(fruitColor=Color.RED)
    private String appleColor;

    @FruitProvider(id=1,name="陕西红富士集团",address="陕西省西安市延安路89号红富士大厦")
    private String appleProvider;

    public void setAppleColor(String appleColor) {
        this.appleColor = appleColor;
    }
    public String getAppleColor() {
        return appleColor;
    }

    public void setAppleName(String appleName) {
        this.appleName = appleName;
    }
    public String getAppleName() {
        return appleName;
    }

    public void setAppleProvider(String appleProvider) {
        this.appleProvider = appleProvider;
    }
    public String getAppleProvider() {
        return appleProvider;
    }

    public void displayName(){
        System.out.println("水果的名字是：苹果");
    }
}

/***********注解处理器***************/

public class FruitInfoUtil {
    public static void getFruitInfo(Class<?> clazz){

        String strFruitName=" 水果名称：";
        String strFruitColor=" 水果颜色：";
        String strFruitProvicer="供应商信息：";

        Field[] fields = clazz.getDeclaredFields();

        for(Field field :fields){
            if(field.isAnnotationPresent(FruitName.class)){
                FruitName fruitName = (FruitName) field.getAnnotation(FruitName.class);
                strFruitName=strFruitName+fruitName.value();
                System.out.println(strFruitName);
            }
            else if(field.isAnnotationPresent(FruitColor.class)){
                FruitColor fruitColor= (FruitColor) field.getAnnotation(FruitColor.class);
                strFruitColor=strFruitColor+fruitColor.fruitColor().toString();
                System.out.println(strFruitColor);
            }
            else if(field.isAnnotationPresent(FruitProvider.class)){
                FruitProvider fruitProvider= (FruitProvider) field.getAnnotation(FruitProvider.class);
                strFruitProvicer=" 供应商编号："+fruitProvider.id()+" 供应商名称："+fruitProvider.name()+" 供应商地址："+fruitProvider.address();
                System.out.println(strFruitProvicer);
            }
        }
    }
}


public class FruitRun {

    /**
     * @param args
     */
    public static void main(String[] args) {

        FruitInfoUtil.getFruitInfo(Apple.class);

    }

}

/***********输出结果***************/
/*
水果名称：Apple
水果颜色：RED
供应商编号：1 供应商名称：陕西红富士集团 供应商地址：陕西省西安市延安路89号红富士大厦
*/

```
