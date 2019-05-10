---
title: typescript 语法学习
date: 2019-04-05T00:44:35+08:00
draft: false
toc: true
comments: true
aliases:
  - /detail/189
  - /detail/189/
tags:
  - 前端
---

[项目](https://github.com/rectcircle/ts-syntax)

```typescript
/**
 * **元组有类型的数组**
 */
let xcatliu: [string, number] = ['Xcat Liu', 25];

/**
 * **声明构造函数类型**
 */
interface ClockConstructor {
	new(hour: number, minute: number): ClockInterface;
}
interface ClockInterface {
	tick():any;
}

/**
 * **获取实例类型**
 */
interface I0 {
}
const i0: I0 = {}
type I00= typeof i0

/**
 * **获取一个类的类型（也就是构造函数类型）（不是实例）**
 */
class A {
	public a : number;
	constructor(a: number) {
		this.a = a
	}
}
type NewA = typeof A  // 等价于 new (a: number) => A
function factory(c: typeof A) {
	return new c(1)
}


/**
 * **any规则**
 * * any是任意类型的父类型，所以任意类型都可以赋值给any
 * * any是任意类型的子类型，所以any变量可以传递给任意函数参数
 * * 慎用any，相当于退化成了JS
 * * 在确定any类型是可以使用，用于规避类型检查，与第三方库交互
 */
let any: any = 1
any = '123';

(function (num: number) { })(any) // 运行时可能报错，编译期间不报错

/**
 * **只读类型**
 */
interface PersonReadonly {
	readonly name: string;
	readonly age: number;
}

/**
 * **类型强转**
 * * 使用 `<类型>变量名` 在TSX不能使用
 * * 使用 `变量名 as 类型`
 */
let someValue: any = "this is a string";
let strLength: number = (<string>someValue).length;
strLength = (someValue as string).length;

interface IA {
	a: string
	b: number
}

interface IB {
	// b: string
	c: number
}

/**
 * **交叉类型**
 * 若IA、IB存在相同的成员b，则IAB中b的类型为 `IA['b'] & IB['b']`
 */
type IAandB = IA & IB

const ab: IAandB = {
	a: 'a',
	b: 2,
	// b: 'b',
	c: 3,
}

/**
 *  **联合类型**
 */

type IAOrB = IA | IB

let aOrB: IAOrB = {
	a: 'a',
	b: 2,
}


function handleAOrB(aOrb: IAOrB) {
	// 只能读取IA和IB共有的值
	// aOrb.

	// 如果需要使用，最好要进行类型判断
	if ((aOrb as IA).a !== undefined) {
		// do something
	}
	if ((aOrb as IB).c !== undefined) {
		// do something
	}
	// 或者使用typeof 或者 instanceof进行类型判断
}

/**
 * **可辨识联合：可以实现类似scala的模式匹配**
 */
interface Square {
	kind: "square";
	size: number;
}
interface Rectangle {
	kind: "rectangle";
	width: number;
	height: number;
}
interface Circle {
	kind: "circle";
	radius: number;
}
type Shape = Square | Rectangle | Circle;
function area(s: Shape) {
	switch (s.kind) {
		case "square": return s.size * s.size;
		case "rectangle": return s.height * s.width;
		case "circle": return Math.PI * s.radius ** 2;
	}
}


/**
 * **可空类型**
 */
let allowNull: number | null = null
allowNull = 1
allowNull = null

/**
 * **可选(允许undefined)参数**
 * * 使用`?:`进行定义的类型
 */
interface IC {
	a: number;
	b?: number;
}

/**
 * **类型别名**，相较于接口：
 * * 类似于宏，报错，显示不出类型别名的名字
 * * 类型别名不能被 extends和 implements（自己也不能 extends和 implements其它类型）
 * * 尽量使用接口
 */

type Name = string;
type NameResolver = () => string;
type Alias = { num: number }
interface Interface {
	num: number;
}
declare function aliased(arg: Alias): Alias;
declare function interfaced(arg: Interface): Interface;

type Easing = "ease-in" | "ease-out" | "ease-in-out";

(function (easing: Easing) {
	// do something
})("ease-in")

/**
 * **1. keyof 提取一个类型的key**
 */
const s = Symbol('s')
interface ID {
	d: number,
	1: string
	[s]: number
}
type KeyOfD = keyof ID //typeof s | "d" | 1
// type KeyOfD1 = Extract<keyof ID, string>
let key: KeyOfD = s

/**
 * **2. `K extends KeyOfT`**
 * * KeyOfT 是联合类型
 * * 那么K将约束为KeyOfT中的任意一个
 * * 一般用法为`K extends keyof T`
 */

function extendsKeyOfT<K extends KeyOfD>(k: K) {
}
extendsKeyOfT('d')
extendsKeyOfT(1)
extendsKeyOfT(s)
// extendsKeyOfT 其他全部报错


/**
 * **3. `T[K]` 索引访问操作符**
 */
type IDdType = ID['d'] // 等价于 type IDdType = number


/**
 * **结合以上123的一个例子**
 * 提取一个对象的属性
 */
function getProperty<T, K extends keyof T>(o: T, name: K): T[K] {
	return o[name]; // o[name] is of type T[K]
}
getProperty({a:1}, 'a')


/**
 * **索引类型和字符串索引签名**
 */
interface IMap<T> {
	[key: string]: T;
}
let keys: keyof IMap<number>; // string
let value: IMap<number>['foo']; // number

/**
 * **type 和 in组合使用**
 */
type IE = {
	[P in 'a'|'b'| 'c']: string;
}
/* 等价于：
type IE {
	a: string;
	b: string;
	c: string;
}
*/

/**
 * **例子：让类型转换为只读或者全部可选或全部可空**
 */
type MyReadonly<T> = {
	readonly [P in keyof T]: T[P];
}
type MyPartial<T> = {
	[P in keyof T]?: T[P];
}
type MyNullable<T> = {
	[P in keyof T]: T[P] | null
}
interface Person {
	name: string;
	age: number;
}
type PersonPartial = MyPartial<Person>;
type ReadonlyPerson = MyReadonly<Person>;

type Proxy<T> = {
	get(): T;
	set(value: T): void;
}
type Proxify<T> = {
	[P in keyof T]: Proxy<T[P]>;
}
/**
 * **例子给一个对象创建代理**
 */
function proxify<T>(o: T): Proxify<T> {
	const result = <Proxify<T>> {}
	for (const key in o) {
		result[key] = {
			get() {
				console.log(`[get] key=${key} value=${o[key]}`)
				return o[key]
			},
			set(value) {
				console.log(`[set] key=${key} oldKey=${o[key]} newValue=${value}`)
				o[key] = value
			}
		}
	}
	return result
}
const props = {
	a: 1
}
let proxyProps = proxify(props);
console.log(proxyProps.a.get())
proxyProps.a.set(2)
console.log(props.a)

/**
 * **局部更新声明**
 */
type MyPick<T, K extends keyof T> = {
	[P in K]: T[P];
}
interface IF {
	a: string
	b: number
}
function updateProps<T, K extends keyof T>(obj: T, update: MyPick<T, K>) {
	Object.assign(obj, update)
}
updateProps({ a: 1, b: 2, c: 3}, {
	a: 3,
	// b: 4,
	c: 5,
})

/**
 * **方便的创建一个具有同样value类型的object**
 */
type MyRecord<K extends keyof any, T> = {
	[P in K]: T;
}
type ThreeStringProps = MyRecord<'prop1' | 'prop2' | 'prop3', string>


type MyRequired<T> = {
	[P in keyof T]-?: T[P];
};


/**
 * **常用的预定义类型**
 * * ArrayLike<T> 想数组的类型
 * * Readonly<T> 将T的属性设为只读
 * * Partial<T>  将T的属性设为可选的
 * * Required<T> 将T的所有属性设为必填
 * * Pick<T, K extends keyof T> 从T中选取指定的属性声明
 * * Record<K extends keyof any, T> 创建一个属性值同一类型的声明
 *
 * **预定义的有条件类型**
 * * Exclude<T, U> -- 从T中剔除可以赋值给U的类型。
 * * Extract<T, U> -- 提取T中可以赋值给U的类型。
 * * NonNullable<T> -- 从T中剔除null和undefined。
 * * Parameters<T extends (...args: any[]) => any> 获取T函数的参数类型的元祖
 * * ConstructorParameters<T extends new (...args: any[]) => any>
 * * ReturnType<T> -- 获取函数返回值类型。
 * * InstanceType<T> -- 获取构造函数类型的实例类型。
 */

type MyExclude<T, U> = T extends U ? never : T;
type T00 = Exclude<"a" | "b" | "c" | "d", "a" | "c" | "f">;  // "b" | "d"
type T01 = Extract<"a" | "b" | "c" | "d", "a" | "c" | "f">;  // "a" | "c"

type T02 = Exclude<string | number | (() => void), Function>;  // string | number
type T03 = Extract<string | number | (() => void), Function>;  // () => void

type T04 = NonNullable<string | number | undefined>;  // string | number
type T05 = NonNullable<(() => string) | string[] | null | undefined>;  // (() => string) | string[]
type T06 = Parameters<(a: number, b: string) => void>
type T07 = ConstructorParameters<{ new(a: number, b: string):any }>

function f1(s: string) {
	return { a: 1, b: s };
}

class C {
	x = 0;
	y = 0;
}

type T10 = ReturnType<() => string>;  // string
type T11 = ReturnType<(s: string) => void>;  // void
type T12 = ReturnType<(<T>() => T)>;  // {}
type T13 = ReturnType<(<T extends U, U extends number[]>() => T)>;  // number[]
type T14 = ReturnType<typeof f1>;  // { a: number, b: string }
type T15 = ReturnType<any>;  // any
type T16 = ReturnType<never>;  // any
// type T17 = ReturnType<string>;  // Error
// type T18 = ReturnType<Function>;  // Error

type T20 = InstanceType<typeof C>;  // C
type T21 = InstanceType<any>;  // any
type T22 = InstanceType<never>;  // any
// type T23 = InstanceType<string>;  // Error
// type T24 = InstanceType<Function>;  // Error
```
