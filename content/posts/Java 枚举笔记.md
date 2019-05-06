---
title: Java 枚举笔记
date: 2017-05-21T00:53:20+08:00
draft: false
toc: false
comments: true
aliases:
  - /detail/79
  - /detail/79/
tags:
  - java
---

## 目录
* [1、定义](#定义)
* [2、常用方法](#2、常用方法)
* [3、原理](#3、原理)
* [4、 EnumSet，EnumMap 的应用](#3、 EnumSet，EnumMap 的应用)


### 1、定义
定义一周七天的枚举类型
```java
public enum Week {
    MON, TUE, WED, THU, FRI, SAT, SUN;
}
```

包含方法和自定义域的一周七天的枚举类型
```java
public enum Week2 {
	MON(1), TUE(2), WED(3), THU(4), FRI(5), SAT(6) {
		@Override
		public boolean isRest() {
			return true;
		}
	},
	SUN(0) {
		@Override
		public boolean isRest() {
			return true;
		}
	};

	private int value;

	private Week2(int value) {
		this.value = value;
	}

	public int getValue() {
		return value;
	}

	public boolean isRest() {
		return false;
	}
}
```



### 2、常用方法
#### （1）静态方法
```java
//根据名字获取对象
Week.valueOf("MON");
//获取全部枚举
Week.values();
//根据名字获取对象，来自java.lang.Enum
Week.valueOf(Week.class,"SUN");
```

#### （2）对象方法
```
Week2 sun = Week2.SUN;
//获取该枚举对象的编号，从零开始，根据定义的先后顺序编号
sun.ordinal(); //6
//自定义的方法
sun.getValue(); //0
//自定义方法
sun.isRest();
//比较大小，按照先后顺序
sun.compareTo(Week2.FRI);
//获取该对象的名字
sun.name();
```

#### （3）遍历和switch操作
```java
for (Week e : Week.values()) {
	System.out.println(e.name());
}

Week tue = Week.TUE;
switch (tue) {
	case MON:
		System.out.println("今天是星期一");
		break;
	case TUE:
		System.out.println("今天是星期二");
		break;
	// ... ...
	default:
		System.out.println(test);
		break;
}
```

### 3、原理
定义枚举类型性相当于实现了一个类继承了`java.lang.Enum<E extends Enum<E>>`对象。

在下面实现了枚举类型`Week2`的等价类`Week3`：

**由于编译限制我们无法继承自`java.lang.Enum<E extends Enum<E>>`，所以参考其源码实现了一个`MyEnum<E extends Enum<E>>`**
```java
package com.rectcircle.javaapi.lang.simulationenum;

import java.io.Serializable;
import java.io.IOException;
import java.io.InvalidObjectException;
import java.io.ObjectInputStream;
import java.io.ObjectStreamException;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.util.HashMap;
import java.util.Map;

public abstract class MyEnum<E extends MyEnum<E>>
		implements Comparable<E>, Serializable {

	private final String name;

	public final String name() {
		return name;
	}

	private final int ordinal;

	public final int ordinal() {
		return ordinal;
	}

	protected MyEnum(String name, int ordinal) {
		this.name = name;
		this.ordinal = ordinal;
	}

	public String toString() {
		return name;
	}

	public final boolean equals(Object other) {
		return this==other;
	}

	public final int hashCode() {
		return super.hashCode();
	}


	protected final Object clone() throws CloneNotSupportedException {
		throw new CloneNotSupportedException();
	}

	public final int compareTo(E o) {
		/*
		Enum<?> other = (Enum<?>)o;
		Enum<E> self = this;
		if (self.getClass() != other.getClass() && // optimization
				self.getDeclaringClass() != other.getDeclaringClass())
			throw new ClassCastException();
		return self.ordinal - other.ordinal;
		*/

		MyEnum<?> other = (MyEnum<?>)o;
		MyEnum<E> self = this;

		return self.ordinal - other.ordinal;
	}

	@SuppressWarnings("unchecked")
	public final Class<E> getDeclaringClass() {
		Class<?> clazz = getClass();
		Class<?> zuper = clazz.getSuperclass();
		return (zuper == MyEnum.class) ? (Class<E>)clazz : (Class<E>)zuper;

	}

	public static <T extends MyEnum<T>> T valueOf(Class<T> enumType,
												String name) {
		/*
		T result = enumType.enumConstantDirectory().get(name);
		if (result != null)
			return result;
		if (name == null)
			throw new NullPointerException("Name is null");
		throw new IllegalArgumentException(
				"No enum constant " + enumType.getCanonicalName() + "." + name);
		*/

		try {
			final Method values = enumType.getMethod("values");
			java.security.AccessController.doPrivileged(
					new java.security.PrivilegedAction<Void>() {
						public Void run() {
							values.setAccessible(true);
							return null;
						}
					});
			T[] universe = (T[])values.invoke(null);

			Map<String, T> m = new HashMap<>(2 * universe.length);
			for (T constant : universe)
				m.put(((MyEnum<?>)constant).name(), constant);

			return m.get(name);
		} catch (NoSuchMethodException e) {
			e.printStackTrace();
		} catch (IllegalAccessException e) {
			e.printStackTrace();
		} catch (InvocationTargetException e) {
			e.printStackTrace();
		}
		return null;
	}


	protected final void finalize() { }

	private void readObject(ObjectInputStream in) throws IOException,
			ClassNotFoundException {
		throw new InvalidObjectException("can't deserialize enum");
	}

	private void readObjectNoData() throws ObjectStreamException {
		throw new InvalidObjectException("can't deserialize enum");
	}
}
```

**Week3对象**
```java
package com.rectcircle.javaapi.lang.simulationenum;


/**
 * Week2的等价定义
 */
public class Week3 extends MyEnum<Week3> {

	public static final Week3 MON;
	public static final Week3 TUE;
	public static final Week3 WED;
	public static final Week3 THU;
	public static final Week3 FRI;
	public static final Week3 SAT;
	public static final Week3 SUN;

	private int value;

	private static final Week3[] $VALUES;

	static {
		MON = new Week3("MON",0,1);
		TUE = new Week3("TUE",1,2);
		WED = new Week3("WED",2,3);
		THU = new Week3("THU",3,4);
		FRI = new Week3("FRI",4,5);
		SAT = new Week3("SAT",5,6){
			@Override
			public boolean isRest(){
				return true;
			}
		};
		SUN = new Week3("SUN",6,0){
			@Override
			public boolean isRest(){
				return true;
			}
		};

		$VALUES = new Week3[] {MON, TUE, WED, THU, FRI, SAT, SUN};
	}

	public static Week3[] values() {
		return $VALUES.clone();
	}

	public static Week3 valueOf(String name) {
		return MyEnum.valueOf(Week3.class, name);
	}

	public int getValue() {
		return value;
	}

	public boolean isRest() {
		return false;
	}

	protected Week3(String name, int ordinal, int value) {
		super(name, ordinal);
	}

}
```

编译器应该和这里一样，将代码预处理成如此。以实现枚举的功能。

注意：模拟实现不完全等价于真正的实现，因为编译器同时对switch语句和class对象上对枚举进行了识别。


### 4、 EnumSet，EnumMap 的应用
#### （1）java.util.EnumSet
枚举 set 在内部表示为位向量。 此表示形式非常紧凑且高效。此类的空间和时间性能应该很好，足以用作传统上基于 int 的“位标志”的替换形式，具有高品质、类型安全的优势。

Enumset是个虚类，我们只能通过它提供的静态方法来返回Enumset的实现类的实例。
返回EnumSet的两种不同的实现：如果EnumSet大小小于64，
就返回RegularEnumSet实例(当然它继承自EnumSet)，这个EnumSet实际上至用了一个long来存储这个EnumSet。
如果 EnumSet大小大于等于64，则返回JumboEnumSet实例，它使用一个long[]来存储。这样做的好处很明显： 大多数情况下返回的RegularEnumSet效率比JumboEnumSet高很多。


#### （1）java.util.EnumMap
是专门为枚举类型量身定做的Map实现。虽然使用其它的Map实现（如HashMap）也能完成枚举类型实例到值得映射，但是使用EnumMap会更加高效：它只能接收同一枚举类型的实例作为键值，并且由于枚举类型实例的数量相对固定并且有限，所以EnumMap使用数组来存放与枚举类型对应的值。这使得EnumMap的效率非常高。




