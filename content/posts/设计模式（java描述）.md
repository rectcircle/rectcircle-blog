---
title: 设计模式（java描述）
date: 2017-02-26T17:05:00+08:00
draft: false
toc: true
comments: true
aliases:
  - /detail/46
  - /detail/46/
tags:
  - untagged
---

## 一、简介

***

在软件工程中，【设计模式】是对软件设计中普遍存在的各种问题，所提出的 解决方案。

换句话说，设计模式是一套被反复使用、多数人知晓的、经过分类的、代码设计的 经验的总结。使用设计模式是为了可重用代码，让代码更容易被他人理解，保证代码可靠性。

### 1.1 设计模式原则

#### 1、开闭原则（Open Close Principle）

开闭原则的意思是：对扩展开放，对修改封闭。在程序需要进行扩展的时候，不能去修改或影响原有的代码，实现一个热插拔的效果。简言之，是为了使程序的扩展性更好，易于维护和升级。想要达到这样的效果，我们需要使用接口和抽象类。

#### 2、里氏替换原则（Liskov Substitution Principle）

里氏替换原则是面向对象设计的基本原则之一。 里氏替换原则中说，任何基类可以出现的地方，子类一定可以出现。里氏替换原则是继承复用的基石，只有当子类可以替换掉基类，且软件单位的功能不受到影响时，基类才能真正被复用，而且子类也能够在基类的基础上增加新的行为。里氏代换原则是对开闭原则的补充。实现开闭原则的关键步骤就是抽象化，而基类与子类的继承关系就是抽象化的具体实现，所以里氏代换原则是对实现抽象化的具体步骤的规范。

#### 3、依赖倒置原则（Dependence Inversion Principle）

这个原则是开闭原则的基础，核心内容：针对接口编程，高层模块不应该依赖底层模块，二者都应该依赖抽象。

#### 4、接口隔离原则（Interface Segregation Principle）

这个原则的意思是：使用多个隔离的接口，比使用单个庞大的接口要好。其目的在于降低耦合度。由此可见，其实设计模式就是从大型软件架构出发，便于升级和维护的软件设计思想。它强调低依赖、低耦合。

#### 5、单一职责原则（Single Responsibility Principle）

一个实体应尽量少地与其他实体之间发生相互作用，应该使得系统功能模块相对独立。

可能有的人会觉得单一职责原则和前面的接口隔离原则很相似，其实不然。其一，单一职责原则原注重的是职责；而接口隔离原则注重对接口依赖的隔离。其二，单一职责原则主要约束的是类，其次才是接口和方法，它针对的是程序中的实现和细节；而接口隔离原则主要约束接口，主要针对抽象，针对程序整体框架的构建。

#### 6、最少知识原则（Demeter Principle）

一个对象应该对其他对象保持最少的了解。类与类之间的关系越密切，耦合度越大，当一个类发生改变时，对另一个类的影响也越大。如果两个类不必彼此直接通信，那么这两个类就不应当发生直接的相互作用。如果其中一个类需要调用另一个类的某一个方法的话，可以通过第三者转发这个调用。所以在类的设计上，每一个类都应当尽量降低成员的访问权限。

#### 7、合成复用原则（Composite Reuse Principle）

合成复用原则就是在一个新的对象里通过关联关系（组合关系、聚合关系）来使用一些已有的对象，使之成为新对象的一部分；新对象通过委派调用已有对象的方法达到复用功能的目的。简而言之，尽量使用 组合/聚合 的方式，而不是使用继承。

### 1.2 设计模式分类

通常来说设计模式分为三大类：

* **创建型模式** ：工厂模式、抽象工厂模式、单例模式、建造者模式、原型模式。

* **结构型模式** ：适配器模式、装饰者模式、代理模式、外观模式、桥接模式、组合模式、享元模式。

* **行为型模式** ：策略模式、模板方法模式、观察者模式、迭代子模式、责任链模式、命令模式、备忘录模式、状态模式、访问者模式、中介者模式、解释器模式。

## 二、工厂模式

***

### 2.1 样例类图

用工厂模式来创建人。现在我们来当回 “女娲娘娘”，先创建一个男人，他每天都 “吃饭、睡觉、打豆豆”，然后我们再创建一个女人，她每天也 “吃饭、睡觉、打豆豆”。

我们以简单工厂模式为例。
![类图](/res/3y9pyDzoeqnyPDKrzrE6rAq7.png)

### 2.1 简单工厂模式示例代码

```java
// 抽象产品，定义产品的方法
abstract class Human {
    public abstract void eat();
    public abstract void sleep();
    public abstract void beat();
}

// 具体产品-男人
class Man extends Human{
    public void eat() {
        System.out.println("男人在吃。。。");
    }

    public void sleep() {
        System.out.println("男人在睡。。。");
    }

    public void beat() {
        System.out.println("男人在打豆豆。。。");
    }

}

// 具体产品-女人
class Female extends Human{

    public void eat() {
        System.out.println("女人在吃。。。");
    }

    public void sleep() {
        System.out.println("女人在睡。。。");
    }

    public void beat() {
        System.out.println("女人在打豆豆。。。");
    }

}

// 简单工厂
public class HumanFactory {
    public static Human createHuman(String gender){
        Human human = null;
        if( gender.equals("man") ){
            human = new Man();
        }else if( gender.equals("female")){
            human = new Female();
        }

        return human;
    }
}

// 女娲造人
public class Goddess {
    public static void main(String[] args) throws IOException {
        // 造个男人
        Human human = HumanFactory.createHuman("man");
        human.eat();
        human.sleep();
        human.beat();
    }
}
```

### 2.2 工厂方法模式示例代码

简单工厂模式就是上面那样子了，那么工厂方法模式又有什么不同呢？工厂方法模式在简单工厂模式的基础之上，把简单工厂抽象化了。

```java
// 抽象产品，定义产品的方法
abstract class Human {
    public abstract void eat();
    public abstract void sleep();
    public abstract void beat();
}

// 具体产品-男人
class Man extends Human{
    public void eat() {
        System.out.println("男人在吃。。。");
    }

    public void sleep() {
        System.out.println("男人在睡。。。");
    }

    public void beat() {
        System.out.println("男人在打豆豆。。。");
    }

}

// 具体产品-女人
class Female extends Human{

    public void eat() {
        System.out.println("女人在吃。。。");
    }

    public void sleep() {
        System.out.println("女人在睡。。。");
    }

    public void beat() {
        System.out.println("女人在打豆豆。。。");
    }

}

// 简单工厂变为了抽象工厂
abstract class HumanFactory {
    public abstract Human createHuman(String gender) throws IOException;
}

// 具体工厂（每个具体工厂负责一个具体产品）
class ManFactory extends HumanFactory{
    public Human createHuman(String gender) throws IOException {
        return new Man();
    }
}
class FemaleFactory extends HumanFactory{
    public Human createHuman(String gender) throws IOException {
        return new Female();
    }
}

// 女娲造人
public class Goddess {

    public static void main(String[] args) throws IOException {
        // 造个男人
        HumanFactory hf = new ManFactory();
        Human h = hf.createHuman("man");
        h.eat();
        h.sleep();
        h.beat();
    }
}
```

### 2.3 工厂模式应用

你可能就问了，工厂模式工厂模式的，我咋没见过哪儿用过啊？这这这儿，在 Java 库里面。根据不同的参数，getInstance() 方法会返回不同的 Calendar 对象。

```java
java.util.Calendar - getInstance()
java.util.Calendar - getInstance(TimeZone zone)
java.util.Calendar - getInstance(Locale aLocale)
java.util.Calendar - getInstance(TimeZone zone, Locale aLocale)
java.text.NumberFormat - getInstance()
java.text.NumberFormat - getInstance(Locale inLocale)
```

## 三、抽象工厂模式

### 3.1 实例类图

“女娲娘娘”只有一个，而我们的工厂却可以有多个，因此在这里用作例子就不合适了。作为“女娲娘娘”生产出来的男人女人们，那就让我们来当一次吃货吧。（吃的东西总可以任性多来一点...）

现在，假设我们有 A、B 两个厨房。每个厨房拥有的餐具和食品都不一样，但是用户搭配使用的方式，比如刀子和苹果、杯子和牛奶等等，我们假设是一致的。

![类图](/res/97n-NA592RIXRPldMRibp7Oy.png)

### 3.2 实例代码

```java
// 抽象工厂
public interface KitchenFactory {
    public Food getFood();
    public TableWare getTableWare();
}

// 抽象食物
public interface Food {
    public String getFoodName();
}

// 抽象餐具
public interface TableWare {
    public String getToolName();
}

// 以具体工厂 AKitchen 为例
public class AKitchen implements KitchenFactory {

    public Food getFood() {
       return new Apple();
    }

    public TableWare getTableWare() {
       return new Knife();
    }
}

// 具体食物 Apple 的定义如下
public class Apple implements Food{
    public String getFoodName() {
       return "apple";
    }
}

// 具体餐具 Knife 的定义如下
public class Knife implements TableWare {
    public String getToolName() {
       return "knife";
    }
}


// 吃货要开吃了
public class Foodaholic {

    public void eat(KitchenFactory k) {
       System.out.println("A foodaholic is eating "+ k.getFood().getFoodName()
              + " with " + k.getTableWare().getToolName() );
    }

    public static void main(String[] args) {
       Foodaholic fh = new Foodaholic();
       KitchenFactory kf = new AKitchen();
       fh.eat(kf);

    }
}
```

### 3.3 应用

抽象工厂模式特别适合于这样的一种产品结构：产品分为几个系列，在每个系列中，产品的布局都是类似的，在一个系列中某个位置的产品，在另一个系列中一定有一个对应的产品。这样的产品结构是存在的，这几个系列中同一位置的产品可能是互斥的，它们是针对不同客户的解决方案，每个客户都只选择其一。

### 3.4 工厂方法模式、抽象工厂模式区别

工厂方法模式、抽象工厂模式，傻傻分不清楚...

为了解释得更清楚，先介绍两个概念：

* **产品等级结构**：比如一个抽象类是食物，其子类有苹果、牛奶等等，则抽象食物与具体食物名称之间构成了一个产品等级结构。食物是抽象的父类，而具体的食物名称是其子类。

* **产品族**：在抽象工厂模式中，产品族是指由同一个工厂生产的，位于不同产品等级结构中的一组产品。如 AKitchen 生产的苹果、刀子，苹果属于食物产品等级结构中，而刀子则属于餐具产品等级结构中。

因此工厂方法模式、抽象工厂模式最大的区别在于：

工厂方法模式：针对的是 一个**产品等级结构**。

抽象工厂模式：针对 多个**产品等级结构**。

## 四、适配器模式

***

### 4.1 实例类图

国标与英标之间实现一个适配器

![图](/res/iTljXzXU7Jgar64eaKwXYzXG.png)

### 4.2 实例代码

```java
// 英标接口，充电的具体实现
public interface EnPluginInterface {
    void chargeWith3Pins();
}

// 国标接口，充电的具体实现
public interface CnPluginInterface {
    void chargeWith2Pins();
}


// 实现英标接口的充电方法
public class EnPlugin implements EnPluginInterface {
    public void chargeWith3Pins() {
        System.out.println("英标充电中。。。")
    }
}


// 实现国标接口的充电方法
public class CnPlugin implements CnPluginInterface {
    public void chargeWith2Pins() {
        System.out.println("国标充电中。。。");
    }
}

// 在室内充电
public class Home {
    private EnPluginInterface enPlugin;

    public Home() { }

    public Home(EnPluginInterface enPlugin) {
        this.enPlugin = enPlugin;
    }

    public void setPlugin(EnPluginInterface enPlugin) {
        this.enPlugin = enPlugin;
    }

    // 充电
    public void charge() {
        enPlugin.chargeWith3Pins();
    }
}

// 英标测试类
public class Test {
    public static void main(String[] args) {
        EnPluginInterface enPlugin = new EnPlugin();
        Home home = new Home(enPlugin);

        // 会输出 “charge with EnPlugin”
        home.charge();
    }
}


// 现在你回内陆了，只能用国标充电



// 适配器，实际上是一个英标的实现，调用国标的方法
public class PluginAdapter implements EnPluginInterface {
    private CnPluginInterface cnPlugin;

    public PluginAdapter(CnPluginInterface cnPlugin) {
        this.cnPlugin = cnPlugin;
    }

    // 这是重点，适配器实现了英标的接口，然后重载英标的充电方法为国标的方法
    @Override
    public void chargeWith3Pins() {
        cnPlugin.chargeWith2Pins();
    }
}

// 适配器测试类
public class AdapterTest {
    public static void main(String[] args) {
        CnPluginInterface cnPlugin = new CnPlugin();
        Home home = new Home();
        PluginAdapter pluginAdapter = new PluginAdapter(cnPlugin);
        home.setPlugin(pluginAdapter);

        // 会输出 “国标充电中。。。”
        home.charge();
    }
}
```

### 4.3 应用

前面已经说了，当你想使用一个已有的类，但是这个类的接口跟你的又不一样，不能拿来直接用，这个时候你就需要一个适配器来帮你了，其主要作用就是在旧的接口、新的接口之间完成适配。

`java.io.InputStreamReader`

## 五、装饰器模式

***

### 5.2 示例代码

```java
// 抽象类 Girl
public abstract class Girl {
    String description = "no particular";

    public String getDescription(){
        return description;
    }
}

// 美国女孩
public class AmericanGirl extends Girl {
    public AmericanGirl() {
        description = "+AmericanGirl";
    }
}

// 国产妹子
public class ChineseGirl extends Girl {
    public ChineseGirl() {
        description = "+ChineseGirl";
    }
}

// 装饰者
public abstract class GirlDecorator extends Girl {
    public abstract String getDescription();
}

// 下面以美国女孩示例
// 给美国女孩加上金发
public class GoldenHair extends GirlDecorator {

    private Girl girl;

    public GoldenHair(Girl g) {
        girl = g;
    }

    @Override
    public String getDescription() {
        return girl.getDescription() + "+with golden hair";
    }

}

// 加上身材高大的特性
public class Tall extends GirlDecorator {

    private Girl girl;

    public Tall(Girl g) {
        girl = g;
    }

    @Override
    public String getDescription() {
        return girl.getDescription() + "+is very tall";
    }

}


// 检验一下
public class Main {

    public static void main(String[] args) {
        Girl g1 = new AmericanGirl();
        System.out.println(g1.getDescription());

        GoldenHair g2 = new GoldenHair(g1);
        System.out.println(g2.getDescription());

        Tall g3 = new Tall(g2);
        System.out.println(g3.getDescription());

        // 你也可以一步到位
        // Girl g = new Tall(new GoldenHair(new AmericanGirl()));
    }
}
```

### 5.3 应用

当你需要动态地给一个对象添加功能，实现功能扩展的时候，就可以使用装饰者模式。

Java IO 类中有一个经典的装饰者模式应用， BufferedReader 装饰了 InputStreamReader.

```java
BufferedReader input = new BufferedReader(new InputStreamReader(System.in));
```

* InputStreamReader(InputStream in) - InputSteamReader 读取 bytes 字节内容，然后转换成 characters 流 输出。
* BufferedReader(Reader in) - 从 characters 流 中读取内容并缓存。

## 六、观察者模式

一句话，观察者模式（Observer Pattern）就是一种 “发布者-订阅者” 的模式。有时也被称为 “模型-视图”模式、“源-监听者”模式等。在这种模式中，由一个目标对象来管理所有依赖与它的观察者对象，并且当这个目标对象自身发生改变时，会主动向它的观察者们发出通知。

### 6.2 示例代码

```java
// Subject 主题接口
public interface Subject {
    public void registerObserver(Observer o); //注册观察者（添加事件回调）
    public void removeObserver(Observer o); //删除观察者（删除回调）
    public void notifyAllObservers(); //发布消息（触发事件）
}

// 观察者接口
public interface Observer {
    public void update(Subject s);
}

// 视频网站某狐 实现 Subject 接口
public class VideoSite implements Subject{

    // 观察者列表 以及 更新了的视频列表
    private ArrayList<Observer> userList;
    private ArrayList<String> videos;

    public VideoSite(){
        userList = new ArrayList<Observer>();
        videos = new ArrayList<String>();
    }

    @Override
    public void registerObserver(Observer o) {
        userList.add(o);
    }

    @Override
    public void removeObserver(Observer o) {
        userList.remove(o);
    }

    @Override
    public void notifyAllObservers() {
        for (Observer o: userList) {
            o.update(this);
        }
    }

    public void addVideos(String video) {
        this.videos.add(video);
        notifyAllObservers();
    }

    public ArrayList<String> getVideos() {
        return videos;
    }

    public String toString(){
        return videos.toString();
    }
}

// 实现观察者，即看视频的美剧迷们
public class VideoFans implements Observer {

    private String name;

    public VideoFans(String name){
        this.name = name;
    }
    @Override
    public void update(Subject s) {
        System.out.println(this.name + ", new videos are available! ");
        // print video list
        System.out.println(s);
    }
}

//  测试一下
public class Main {

    public static void main(String[] args) {
        VideoSite vs = new VideoSite();
        vs.registerObserver(new VideoFans("LiLei"));
        vs.registerObserver(new VideoFans("HanMeimei"));
        vs.registerObserver(new VideoFans("XiaoMing"));

        // add videos
        vs.addVideos("Video 1");
        //vs.addVideos("Video 2");
    }
}
```

### 6.3 应用

前面已经说了，观察者模式也可以理解为 “源-监听者” 模式，这种应用就太多了。举个简单的例子就是各种 listener，比如当你有一个按键，你肯定要给这个按键添加监听事件（listener）来完成指定动作吧，这就是一种应用。

## 七、单例模式

### 7.2 实现方式

#### 7.2.1 恶汉模式

最常见、最简单的单例模式写法之一。顾名思义，“饿汉模式” 就是很 “饥渴”，所以一上来就需要给它新建一个实例。但这种方法有一个明显的缺点，那就是不管有没有调用过获得实例的方法（本例中为 getWife() ），每次都会新建一个实例。

```java
// 饿汉模式
public class Wife {

    // 一开始就新建一个实例
    private static final Wife wife = new Wife();

    // 默认构造方法
    private Wife() {}

    // 获得实例的方法
    public static Wife getWife() {
        return wife;
    }
}
```

#### 7.2.2 懒汉模式

最常见、最简单的单例模式之二，跟 “饿汉模式” 是 “好基友”。再次顾名思义，“懒汉模式” 就是它很懒，一开始不新建实例，只有当它需要使用的时候，会先判断实例是否为空，如果为空才会新建一个实例来使用。

```java
// 懒汉模式
public class Wife {

    //一开始没有新建实例
    private static Wife wife;

    private Wife() { }

    // 需要时再新建
    public static Wife getWife() {
        if (wife == null) {
            wife = new Wife();
        }
        return wife;
    }
}
```

#### 7.2.3 线程安全的懒汉模式

是不是感觉很简单？但是上面的懒汉模式却存在一个严重的问题。那就是如果有多个线程并行调用 getWife() 方法的时候，还是会创建多个实例，单例模式就失效了。

Bug 来了，改改改！

简单，我们在基本的懒汉模式上，把它设为线程同步（synchronized）就好了。synchronized 的作用就是保证在同一时刻最多只有一个线程运行，这样就避免了多线程带来的问题。关于 synchronized 关键字，你可以 点击这里 了解更多。

```java
// 懒汉模式（线程安全）
public class Wife {
    private static Wife wife;

    private Wife() { }

    // 添加了 synchronized 关键字
    public static synchronized Wife getWife() {
        if (wife == null) {
            wife = new Wife();
        }
        return wife;
    }
}
```

#### 7.2.4 双重检验锁（double check）

线程安全的懒汉模式解决了多线程的问题，看起来完美了。但是它的效率不高，每次调用获得实例的方法 getWife() 时都要进行同步，但是多数情况下并不需要同步操作（例如我的 wife 实例并不为空可以直接使用的时候，就不需要给 getWife() 加同步方法，直接返回 wife 实例就可以了）。所以只需要在第一次新建实例对象的时候，使用同步方法。

不怕，程序猿总是有办法的。于是，在前面的基础上，又有了 “双重检验锁” 的方法。

```java
// 双重锁的 getWife() 方法
public static Wife getWife() {

    // 第一个检验锁，如果不为空直接返回实例对象，为空才进入下一步
    if (wife == null) {
        synchronized (Wife.class) {

            //第二个检验锁，因为可能有多个线程进入到 if 语句内
            if (wife == null) {
                wife = new Wife();
            }
        }
    }
    return wife ;
}
```

java
你以为这终于圆满了？NO...Too young, too naive! 主要问题在于 wife = new Wife() 这句代码，因为在 JVM（Java 虚拟机）执行这句代码的时候，要做好几件事情，而 JVM 为了优化代码，有可能造成做这几件事情的执行顺序是不固定的，从而造成错误。（为了不把问题更加复杂化，这里没有深入讲解在 JVM 中具体是怎么回事，有兴趣的同学可以点击 这里 自行了解下。）

这个时候，我们需要给实例加一个 volatile 关键字，它的作用就是防止编译器自行优化代码。最后，我们的 “双重检验锁” 版本终于出炉了...

```java
// 双重检验锁
public class Wife {
    private volatile static Wife wife;

    private Wife() { }

    public static Wife getWife() {
        if (wife == null) {
            synchronized(Wife.class) {
                if (wife == null) {
                    wife = new Wife();
                }
            }
        }

        return wife;
    }
}
```

#### 7.2.5 静态内部类

上面的方法，修修补补，实在是太复杂了... 而且 volatile 关键字在某些老版本的 JDK 中无法正常工作。咱们得换一种方法，即 “静态内部类”。这种方式，利用了 JVM 自身的机制来保证线程安全，因为 WifeHolder 类是私有的，除了 getWife() 之外没有其它方式可以访问实例对象，而且只有在调用 getWife() 时才会去真正创建实例对象。（这里类似于 “懒汉模式”）

```java
// 静态内部类
public class Wife {
    private static class WifeHolder {
        private static final Wife wife = new Wife();
    }

    private Wife() { }

    public static Wife getWife() {
        return WifeHolder.wife;
    }
}
```

#### 7.2.6 枚举

```java
// 枚举
public enum Wife {
    INSTANCE;

    // 自定义的其他任意方法
    public void whateverMethod() { }
}
```

## 八、迭代器

***

### 8.1 目的

为了以一致的方式遍历容器

### 8.2 设计方案

#### 8.2.1 Iterable接口

该接口定义了一个方法，用于返回一个实现Iterable的对象
`Iterable iterator();`

#### 8.2.2 Iterator接口

该接口定义了迭代器的行为，用于返回实现某项事物的遍历迭代器对象

```java
boolean hasNext();
V next();
void remove();
```

#### 8.2.3 实现迭代器

* 容器定义一个实现Iterator的内部类
* 容器实现 `Iterable` ，在`Iterable iterator();`返回上一步实现的内部类

#### 8.2.4 迭代器的使用

```java
Iterator it = iterable.iterator();
while(it.hasNext()){
	V val = it.next();
	if(test(val)){
		it.remove();
	}
}
```

### 8.3 JDK中的Iterator

主要在容器中使用

## 九、策略模式

***

### 9.1 目的

为了灵活的变更策略

### 9.2 JDK中的实例

排序的比较方式的策略

### 9.3 设计思路

以比较策略为例

#### 9.3.1 需求

要求实现一组sort函数，可以对任意的数组类型排序，可以灵活的指定排序的比较方式，签名如下

```java
void sort(Object[] os); //使用类默认比较策略
void sort(Object[] os, 比较策略); //自定义比较策略
```

#### 9.3.2 Comparable接口

使对象可比较方法，拥有一个和别人比较的方法：`int compareTo(Obejct o);`

#### 9.3.3 实现`void sort(Object[] os);`

在需要比较的时候将Object转换为Comparable类型，并调用compareTo进行比较

#### 9.3.4 Comparator接口

真正的比较策略接口，拥有两个对象比较的方法`int compare(Obejct a, Object b);`

#### 9.3.5 实现`void sort(Object[] os, Comparator c);`

在需要比较的时候调用Comparator的compare方法进行比较。

#### 9.3.6 使用比较函数

**方式1：定义默认比较方式**

待比较类型实现Comparable接口

**方式2：使用时自定义比较策略**

在需要比较时，创建一个比较策略对象，传入sort方法

## 十、代理模式

***

### 10.1 目的

* 灵活的给一个函数的前后添加逻辑业务

### 10.2 静态代理

#### （1）使用继承（不推荐）

* 给需要代理对象创建一个子类（代理类）
* 在子类中重写需要代理的方法：
	* 前置逻辑
	* 返回值=调用父类方法
	* 后置逻辑
	* 返回返回值
* 创建一个父类的引用指向代理类

**缺点**

* 不能灵活的进行多层代理
* 不能灵活的指定多层代理代理的顺序

#### （2）使用组合

* 为需要代理的对象创建一个接口，接口的内容为需要代理的方法
* 代理对象持有一个被代理对象的接口类型的引用，可以通过构造函数传递
* 代理对象实现这个接口，并实现对接口的每一个方法实现代理逻辑
* 创建一个被代理对象
* 创建一个代理对象，使用被代理对象初始化
* 创建一个接口类型指向代理对象

#### （3）静态代理的缺点

* 同一段代理逻辑如果在不同的对象中使用，不能复用
* 需要为每一个对象的每一个需要被代理的方法实现代理逻辑

### 10.3 动态代理

使用动态编译（动态生成并加载类） + 反射 实现。

#### 10.3.1 实现一个代理逻辑的接口`InvocationHandler`

该接口具有一个方法： `public Object invoke(Object obj, Method method, Object[] args)`
实现该方法：

* 添加一个被代理对象的引用target，通过构造函数传入
* 实现invoke方法
	* 前置逻辑
	* 调用被代理对象的方法：`Object ret = method.invoke(target, args);`
	* 后置逻辑
	* 返回被代理对象的返回值

#### 10.3.2 实现代理的工具方法 `newProxyInstance`

该工具函数声明如下：

```java
public static Object newProxyInstance(ClassLoader loader,
                                          Class<?>[] interfaces,
                                          InvocationHandler h)
```

**实现过程**

* 动态定义一个类并生成字节码
	* 该类持有一个InvocationHandler类型的引用，并生成构造函数
	* 这个类要实现所有的interfaces接口
	* 动态创建指向接口的方法的Method类型的成员变量
	* 动态生成接口所有方法的实现，每个方法调用InvocationHandler的invoke方法，参数列表为：
		* this
		* 该方法对应的Method方法
		* 方法参数
* 使用指定的classloader加载类
* 通过反射创建一个实例并返回

## 十一、责任链

***

### 11.1 目的

使对同一事物的处理的多个步骤可以灵活组合扩展

### 11.2 实现方式

**实现方式1**：使用外部容器保存Handler

* 定义Handler接口包含一个方法handle
* 根据需求创建Handler接口的实现
* 创建HandlerChain，实现Handler接口，包含一个Handler的列表，在handle里循环调用每一个Handler的handle函数
* 用户创建一个Processor对象，并根据需求放入Handler实现，并调用Processor的process函数

**实现方式2**：Handle接口内部保存Handler

* 定义Handler接口包含一个方法handle和nextHandler和setHandler
* 根据需求创建Handler接口的实现，实现包含下一级处理器的引用
* 用户创建处理器实例并设置处理器链

### 11.3 JDK中的使用

#### 11.4 JavaWeb中的Filter

* javax.servlet.Filter接口含有`doFilter(ServletRequest request, ServletResponse response, FilterChain chain)`方法
* javax.servlet.FilterChain接口含有`void	doFilter(ServletRequest request, ServletResponse response)`

使用示例：

```java
public class FilterImpl implements Filter {
    @Override
    public void init(FilterConfig filterConfig) throws ServletException {
        System.out.println("init ... ");
    }
    @Override
    public void doFilter(ServletRequest request, ServletResponse response,
            FilterChain chain) throws IOException, ServletException {
        System.out.println("before ... ");
				chain.doFilter(request, response);
				System.out.println("after ... ");
    }
    @Override
    public void destroy() {
        System.out.println("destroy ... ");

    }
}
```

FilterChain的模拟实现

```java
public class FilterChainImpl implements FilterChain {

	private List<Filter> filters = new LinkedList<>();
	private int idx=0;

	@Override
	public void doFilter(ServletRequest request, ServletResponse response) throws IOException, ServletException {
			if(idx==filters.size()) return;
			filter f = filters.get(idx);
			idx++;
			f.doFilter(request, response, this);
	}

}
```

## 十二、桥接模式

***

### 12.1 目的

将抽象和行为分离

在软件系统中，某些类型由于自身的逻辑，它具有**两个或多个维度**的变化，那么如何应对这种“多维度的变化”？如何利用面向对象的技术来使得该类型能够轻松的沿着多个方向进行变化，而又不引入额外的复杂度？这就要使用Bridge模式。

### 12.2 实现方式

* 创建一个`抽象化角色`的抽象类，拥有一个`实施者角色`的引用，并实现给他赋值的方法，（例如：一个礼物）
* 创建一个`实施者角色`的类，并根据业务实现不同的实施者
* 创建`具体角色`从`抽象化角色`继承，并在合适的位置调用`实施者角色`的方法
* 客户可以根据需求创建 `拥有xxx实施者的xxx角色` 满足二维扩展

## 十三、命令模式

***

### 13.1 目的

* 调用者与执行者没有直接关系，通过命令对象来关联。
* 将一个请求封装成一个对象，从而使您可以用不同的请求对客户进行参数化。
* 可以实现一个undo

### 13.2 实现方式

* 创建一个命令接口`Command`包含一个或两个方法`execute`和`undo`（可选）
* 创建不同的`Command`实现类
* 创建命令调用类，包含一个命令的列表，并提供添加命令和执行命令的方法
* 客户根据情况向调用类添加命令和执行命令

## 十四、状态模式

***

### 14.1 目的

根据不同的状态，选择不同的实现。

### 14.2 实现方式

* 创建一个行为接口
* 创建不同状态下的行为接口的实现
* 根据不同的状态创建不同的行为对象

## 十五、Mediator模式

***

（中介者模式）

### 15.1 目的

当类之间的关系十分复杂时，可以使用禁止类之间直接的引用，使用一个中介者管理

### 15.2 实现方式

* 定义一个中介者类，包含所有其他他要管理的类
* 实现对各个类的操作的封装

## 十六、Facade模式

（外观模式）

### 16.1 目的

当一个模块的使用涉及很多类的调用，可以使用一个管理对象，外界对模块的使用由该管理对象提供
