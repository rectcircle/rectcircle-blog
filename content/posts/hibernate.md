---
title: hibernate
date: 2016-11-16T23:50:08+08:00
draft: false
toc: true
comments: true
aliases:
  - /detail/21
  - /detail/21/
tags:
  - Java
---

## 一、概貌了解

### 1、第一个实验：

#### 导入jar包

```
Hibernate的required目录下
jdbc jar
```

#### 数据库新建与类对应的表

#### 根目录下新建目录

hibernate.cfg.xml

```xml
<?xml version='1.0' encoding='utf-8'?>
<!DOCTYPE hibernate-configuration PUBLIC
"-//Hibernate/Hibernate Configuration DTD 3.0//EN"
"http://www.hibernate.org/dtd/hibernate-configuration-3.0.dtd">
<hibernate-configuration>
	<session-factory>
		<!-- 数据库连接设置 -->
		<property name="connection.driver_class">com.mysql.jdbc.Driver</property>
		<property name="connection.url">jdbc:mysql://localhost:3306/hibernate</property>
		<property name="connection.username">root</property>
		<property name="connection.password">123456</property>

		<!-- 连接池 -->
		<!-- <property name="connection.pool_size">1</property> -->

		<!-- SQL dialect方言 -->
		<property name="dialect">org.hibernate.dialect.MySQLDialect</property>
		<!-- Enable Hibernate's automatic session context management -->
		<!-- <property name="current_session_context_class">thread</property> -->
		<!-- Disable the second-level cache -->
		<property name="cache.provider_class">org.hibernate.cache.internal.NoCacheProvider</property>
		<!-- 输出生成的sql语句开发者用 -->
		<property name="show_sql">true</property>
		<!-- 自动建表 -->
		<!-- <property name="hbm2ddl.auto">update</property> -->
		<!-- 映射类与表的映射关系 -->
		<mapping resource="com/rectcircle/hibernate/model/Student.hbm.xml"/>
	</session-factory>
</hibernate-configuration>
```

#### 在model包内新建Student.hbm.xml（类名.hbm.xml）

```xml
<!--内容如下：-->
<?xml version="1.0"?>
<!DOCTYPE hibernate-mapping PUBLIC
"-//Hibernate/Hibernate Mapping DTD 3.0//EN"
"http://www.hibernate.org/dtd/hibernate-mapping-3.0.dtd">

<!-- 当类表命名一致时的最简配置 -->
<hibernate-mapping package="com.rectcircle.hibernate.model">
	<class name="Student">
		<id name="id"></id><!-- 映射主鍵 -->
		<property name="name"></property>
		<property name="age"></property>
	</class>
</hibernate-mapping>
```

#### 写一个获取SessionFactory的静态类（单例模式）

```java
package com.rectcircle.hibernate.util;
import org.hibernate.SessionFactory;
import org.hibernate.cfg.Configuration;

public class HibernateUtil {
	private static final SessionFactory sessionFactory = buildSessionFactory();

	private static SessionFactory buildSessionFactory() {
		try {
			// Create the SessionFactory from hibernate.cfg.xml
			return new Configuration().configure().buildSessionFactory();
		} catch (Throwable ex) {
			// Make sure you log the exception, as it might be swallowed
			System.err.println("Initial SessionFactory creation failed." + ex);
			throw new ExceptionInInitializerError(ex);
		}
	}

	public static SessionFactory getSessionFactory() {
		return sessionFactory;
	}
}
```

#### 使用：

```java
Student s = new Student();
s.setId(1);
s.setName("s1");
s.setAge(1);

SessionFactory sf = HibernateUtil.getSessionFactory();

Session session = sf.openSession();
session.beginTransaction();
session.save(s);
session.getTransaction().commit();
session.close();

sf.close();//最好不要关闭；
```

### 2、使用注解：

不需要mapping文件：hbm.xml
在model类上添加注解：

```java
	@Entity //import javax.persistence.Entity;
	public class Teacher {...}

	@Id
	public int getId() {
		return id;
	}
```

在model类的主键字段的get方法上添加注解

在hibernate.cfg.xml文件中添加

```xml
<mapping class="com.rectcircle.hibernate.model.Teacher"/>
```

## 二、常见的O/R框架

```
Hibernate
toplink
jdo
ibatis
jpa
```

## 三、Hibernate基础配置

### 1、

需要持久化的对象类上面：
@Entity
主键字段的get方法上加
@Id

### 2、hibernate.cfg.xml配置

```xml
<property name="hbm2ddl.auto">update</property>
create：每次加载hibernate时都会删除上一次的生成的表，然后根据你的model类再重新来生成新表，哪怕两次没有任何改变也要这样执行，这就是导致数据库表数据丢失的一个重要原因。
update：最常用的属性，第一次加载hibernate时根据model类会自动建立起表的结构（前提是先建立好数据库），以后加载hibernate时根据model类自动更新表结构，即使表结构改变了但表中的行仍然存在不会删除以前的行。要注意的是当部署到服务器后，表结构是不会被马上建立起来的，是要等应用第一次运行起来后才会。
validate ：每次加载hibernate时，验证创建数据库表结构，只会和数据库中的表进行比较，不会创建新表，但是会插入新值。
create-drop：关闭sessionfactory将删除表
validate：每次检查是否完全映射

先建表-后建类（利于优化）
```

### 3、搭建日志环境

```
引入包：
	slf4j
	log4f
	slf4j-log4j12
copy:
	\hibernate-release-5.1.0.Final\project\etc\log4j.properties
```

### 4、格式化输出 sql语句：

	hibernate.format_sql :true;

### 5、直接输出 sql语句：

	hibernate.show_sql :true;

### 6、表名与类名不同时

```
	@Entity(name="_Teacher")
或
	@Entity
	@Table(name="_Teacher")
或
	在xml中class 添加属性table=""
```

### 7、

	@Basic //等价于不加注解

### 8、字段名与字段名不同

```
	在get方法添加：@Column(name="_name")
或
	在xml添加：property添加属性column="";
```

### 9、忽略某个字段的持久化

```
	在get方法上添加@Transient
或
 在xml不写
```

### 10、事件与日期的类型

```
private Date birthDate; //import java.util.Date;
//生成setget方法
这样就会自动将日期和时间同时持久化
只存日期：
	在get方法上面加：@Temporal(TemporalType.DATE)
只存时间：
	在get方法上面加：@Temporal(TemporalType.TIME)

或在xml添加：property添加属性type=""//可以填写：搜Hibernate类型
```

### 11、映射枚举类型

```
	@Enumerated(EnumType.STRING) //将枚举的字符串持久化
	@Enumerated(EnumType.ORDINAL) //将枚举的索引持久化
或
	xml略
```

### 12、ID（主键）生成策略之单主键

```java
@Id
@GeneratedValue //默认是auto相当于native

@Id
@GeneratedValue(strategy=GenerationType.AUTO) //默认是auto相当于native

GenerationType.AUTO //支持所有数据库
GenerationType.IDENTITY //支持mysql 等
GenerationType.SEQUENCE //支持oracle 等
	自定义sequence方法（oracle）
	在类上：
		@SequenceGenerator(name="这个注解的名字", sequenceName="数据库sequence的名字")
 	在@Id下
 		@GeneratedValue(strategy=GenerationType.SEQUENCE,  generator="这个注解的名字")
GenerationType.TABLE //不常用用一张表生成主键
	@Entity
	@javax.persistence.TableGenerator(
		    name="Teacher_GEN",
		    table="GENERATOR_TABLE",
		    pkColumnName = "pk_key",
		    valueColumnName = "pk_value",
		    pkColumnValue="Teacher",
		    allocationSize=1
		)

	@SequenceGenerator(name="teacherSEQ", sequenceName="teacherSEQ_DB")
```

或者

```xml
<id>
	<generator class="generatorClass"/>
</id>
```

```
increment
	用于为long, short或者int类型生成 唯一标识。
	只有在没有其他进程往同一张表中插入数据时才能使用。
	在集群下不要使用。

identity
	对DB2,MySQL, MS SQL Server, Sybase和HypersonicSQL的
	内置标识字段提供支持。
	返回的标识符是long, short 或者int类型的。

sequence
	在DB2,PostgreSQL, Oracle, SAP DB, McKoi
	中使用序列（sequence)，
	而在Interbase中使用生成器(generator)。
	返回的标识符是long, short或者 int类型的。

hilo
	使用一个高/低位算法高效的生成long,
	short 或者 int类型的标识符。
	给定一个表和字段
	（默认分别是 hibernate_unique_key 和next_hi）
	作为高位值的来源。
	高/低位算法生成的标识符只在一个特定的数据库中是唯一的。

seqhilo
	使用一个高/低位算法来高效的生成long, short 或者 int类型的标识符，
	给定一个数据库序列（sequence)的名字。

uuid
用一个128-bit的UUID算法生成字符串类型的标识符， 这在一个网络中是唯一的（使用了IP地址）。UUID被编码为一个32位16进制数字的字符串。

guid
在MS SQL Server 和 MySQL 中使用数据库生成的GUID字符串。

native(常用)
根据底层数据库的能力选择identity, sequence 或者hilo中的一个。

assigned
让应用程序在save()之前为对象分配一个标示符。
这是 <generator>元素没有指定时的默认生成策略。

select
通过数据库触发器选择一些唯一主键的行并返回主键值来分配一个主键。

foreign
使用另外一个相关联的对象的标识符。通常和<one-to-one>联合起来使用。

sequence-identity
一种特别的序列生成策略,使用数据库序列来生成实际值,
但将它和JDBC3的getGeneratedKeys结合在一起,
使得在插入语句执行的时候就返回生成的值。
目前为止只有面向JDK 1.4的Oracle 10g驱动支持这一策略。
注意，因为Oracle驱动程序的一个bug，
这些插入语句的注释被关闭了。
（原文：
Note comments on these insert statements are disabled
due to  a bug in the Oracle drivers.）
```

### 13、ID（主键）生成策略之单联合主键

持久化对象里存在一个
主键类 要求：

* 必须实现一个接口 `java.io.Serializable //可序列化`
* 重写equals和hashCode方法

```java
	@Override
	public boolean equals(Object o) {
		if(o instanceof StudentPK) {
			StudentPK pk = (StudentPK)o;
			if(this.id == pk.getId() && this.name.equals(pk.getName())) {
				return true;
			}
		}
		return false;
	}

	@Override
	public int hashCode() {
		return this.name.hashCode();
	}
```

配置：
		(1)主键类注解为@Embeddable
			需要持久化的类的主键类对象的get方法注解为@Id
（最常用）(2)需要持久化的类（实体）的主键类对象的get方法注解为@EmbeddedId
		(3)不需要写主键类；（常用）
			在需要作为id的属性的get方法上加上注解@Id；
			在持久化的类上加上 注解@IdClass(TeacherPK.class) //将作为联合主键的属性抽象为一个主键类

#### 或者

```xml
		<!--在Xxx.hbm.xml添加 -->
		<hibernate-mapping>
			<class name="com.bjsxt.hibernate.Student">
				<composite-id name="pk" class="com.bjsxt.hibernate.StudentPK">
					<key-property name="id"></key-property>
					<key-property name="name"></key-property>
				</composite-id>
```

## 四、Hibernate核心接口

### 1、configuration

```java
	sessionFactory = new AnnotationConfiguration()
					.configure()
					.buildSessionFactory();
	//当自定义hibernate.cfg.xml时，使用configure("xml名");
	//这样将会到src根目录去寻找目录
```

### 2、SessionFactory

```java
	//维护着与数据库的连接用于产生连接
	Session session = sessionFactory.openSession();
		//不建议使用，产生一个新数据库连接，一定要关闭
	session.close();

	Session session = sessionFactory.getCurrentSession();
		//不用关闭，在session提交之前，每次拿到的session都是同一个（当上下文存在）
		//但是一旦提交，这个session将关闭，所以不需要显示的关闭
		//用途界定实物边境

	/*配置上下文：hibernate.cfg.xml里
		 <property name="current_session_context_class">thread</property>
		 取值：
		 	thread：当前线程是否有此对象
		 	jta：管理分布式管理
		 	manager：（少用）
		 	custome.class：（少用）自定义
		 不设置此属性将getCurrentSession()将出错
	*/
```

### 3、session管理数据库的增删改查

```java
Session session = sessionFactory.getCurrentSession();
session.beginTransaction();
//在此写增删改查
System.out.println(t.getId()); //出错
```

```
对象的三种状态
	new出来后
Transient（瞬态的）：内存有，没id(session map没有此对象，数据库没记录)
	save()后
Persistent（持久化的）：内存有，有id(session map有对象，数据库有记录)
	session.close()后
Detached（脱管的）：内存有，有id(session map没有对象，数据库有记录)
```

#### （1）增

```java
	save()
	commit();
```java

#### （2）删（对象必须拥有id）

```java
	delete();
```

#### （3）查

```java
	Object o =(Object)load(class,主键); //将返回一个对象的代理。
																			//（当访问属性时，才执行sql查询）
																			//所以必须在commit前访问对象
	Object o =(Object)get(class,主键); //将返回一个实际的对象。
	//立即执行数据库操作
```

#### （4）改`update()`

	更新一个字段：
		1--忽略更新(少用)
			在get方法上添加 @Column(updatable=false) 或者
			xml <property updatae=false></property>
		2--Xml上：
		<hibernate-mapping>
			<class name="com.bjsxt.hibernate.Student" dynamic-update="true">
				//与缓存中的对象比较，若缓存中没有将会全部更新
				session.merge(obj);//首先select再比较，最后更新部分

		3、使用HQL语句

#### （4）增或改`saveOrUpdate(o);`

#### （5）`Session.clear();`清除缓存

#### （6）`session.flush();` //强制让数据库与缓存同步

#### （7）程序中自动生成表；

```java
	new SchemaExport(new AnnotationConfiguration().configure().create(true,true)); //过时
```

## 五、关系映射（重要）

### 1、一对一单项外键关联：

#### 在所包含的对象的get方法上加入注解：

```java
	@OneToOne //单项外键关联
	@JoinColumn(name="wifiId") //连接字段 //指定外键字段名称
```

或xml中

```xml
<class name="com.bjsxt.hibernate.StuIdCard">
		<id name="id">
			<generator class="native"></generator>
		</id>

		<property name="num"/>
		<many-to-one name="student" column="studentId" unique="true"></many-to-one>
</class>
```

### 2、一对一单项双向外键关联：

*	两个对象互相持有对方引用
*	并在两个对象id的get方法上加上@OneToOne //这样会互为外键
*	解决方案（只存在1个外键）其中一个对象@OneToOne(mappedBy="本体对象在另一个对象的名称")
*	//mappedBy必须设置，对方是主导

或者在xml中
	上一个的配置+上如下

```xml
<one-to-one name="stuIdCard" property-ref="student"></many-to-one>
```

### 3、一对一单项单向的主键关联（不重要）：

```java
	@OneToOne //单项外键关联
	@PrimaryKeyJoinColumn
```

或者

```xml
<class name="com.bjsxt.hibernate.StuIdCard">
		<id name="id">
			<generator class="foreign"> //必填foreign
				<param name="property">student</param> //id参考的对象
			</generator>
		</id>

		<property name="num"/>
		<one-to-one name="student" constrained="true"></one-to-one>
</class>
```

### 4、一对一单项双向的主键关联（不重要）：

双方加：
	@OneToOne //单项外键关联
	@PrimaryKeyJoinColumn

### 5、一对一联合主键关联（不重要）：

```java
	@OneToOne
	@JoinColumns(
		{
			@JoinColumn(name="wifeId", referencedColumnName="id"),
			@JoinColumn(name="wifeName", referencedColumnName="name")
		}
	)
	public Wife getWife() {
		return wife;
	}
```

### 6、一对一组件映射(两个对象一张表)

在对象引用的get方法上加入注解

```java
	@Embedded
```

或者

```xml
<hibernate-mapping>
	<class name="com.bjsxt.hibernate.Husband" >
		<id name="id">
			<generator class="native"></generator>
		</id>

		<property name="name"></property>
		<component name="wife">
			<property name="wifeName"></property>
			<property name="age"></property>
		</component>
    </class>

</hibernate-mapping>
```

### 7、多对一单项关联：（常用）

错误做法：在一访加冗余，
在多的部分加外键

多对一的单项关联：
	例：一个组（Group）里有多个用户（USer）
	在User里有Group的引用；
	在User的Group引用的get方法加
	@ManyToOne
	@JoinColumn(name="")//改名
或user xml中

```xml
<class>
	......
	<many-to-one name="group" column="表字段名"></many-to-one>
</class>
```

### 8、一对多单向关联（常用）

	在Group里有set<User> users；
	在Group的users的get方法加
		@OneToMany //这样写会产生一个关系表并加两个外键
	修正：//产生和多对一单向关联的表，只要两张表，在多的一方加一的id并加外键
		@OneToMany
		@JoinColumn(name="外键字段名")

或user xml中

```xml
	<class>
		......
		<set name="users">
			<key column="表字段名"></key>
			<one-to-many class="com.xxx.xxx.Xxx"></one-to-many>
		</set>
	</class>
```

### 9、多对一和一对多双向关联（常用）

	综合以上两个注解：
	一方：加@OneToMany(mappedBy="字段名")
	多方：加@ManyToOne
在xml中
	综合上面双方写法（注意表字段名要相同）

### 10、多对多单向关联（常用）

在get方法上面加注解：

```java
	@ManyToMany
	@JoinTable(name="中间表名",
		joinColumns={@JoinColumn(name="当前对象的字段名")},
		inverseJoinColumns={@JoinColumn(name="get集合的字段名")}
	)//自定义关联表名，字段名
```

xml中

```xml
<class name="com.bjsxt.hibernate.Teacher">
		<id name="id">
			<generator class="native"></generator>
		</id>

		<property name="name"></property>
		<set name="students" table="t_s">
			<key column="teacher_id"></key>
			<many-to-many class="com.bjsxt.hibernate.Student" column="student_id"/>
		</set>
</class>
```

### 11、多对多双向关联（常用）

在双方

一方

```java
	@ManyToMany
	@JoinTable(name="中间表名",
		joinColumns={@JoinColumn(name="当前对象的字段名")},
		inverseJoinColumns={@JoinColumn(name="get集合的字段名")}
	)//自定义关联表名，字段名
```

另一方

```java
	@ManyToMany(mappedby="本类的实例在对方集合的名字")
```

或者xml

双方中

```xml
<set name="students" table="t_s">
	<key column="teacher_id"></key>
	<many-to-many class="com.bjsxt.hibernate.Student" column="student_id"/>
</set>
```

### 12、注意双向关联的特性：

	在代码中设置一定要设置导航关系
	设置mappedBy

## 五、关联关系的增删改查（crud）

### 1、一对多的双向关联的crud

```java
save()
	//默认情况下不会保存关联变量
	//例子：
			User u = new User();
			u.setName("u1");
			Group g = new Group();
			g.setName("g1");
			u.setGroup(g);
			Session s = sessionFactory.getCurrentSession();
			s.beginTransaction();
			//s.save(g);
			s.save(u);
			s.getTransaction().commit();
	//出错
	//不出错只需
	@ManyToOne或 @OneToMany //只对create update delete 有效
	(cascade={CascadeType.ALL}) //增删改
	cascade（级联）可选：CascadeType.ALL //所有增删改查操作都会关联
							CascadeType.PERSIST //保存
							CascadeType.refresh //更新
							CascadeType.remove //删除
							CascadeType.merge //合并
							//只有调用对应方法才会产生级联

get
//在取出多的一方默认会把一的一方取出来（不管设不设CascadeType）
//在取出一的一方默认不会把多的一方取出来（不管设不设CascadeType）
//需要设置
			(
				mappedBy="",
				cascade={CascadeType.ALL} ,
				fetch=FetchType.EAGER //读
			)
			FetchType.EAGER (@ManyToOne默认) //取的时候默认将两者联合起来
			FetchType.LAZY (@OneToMany默认)默认不取出导航的对象当使用的时候再取出
					（必须在commit之前否则报错）


load() //取出的是代理对象，在调用对象方法时才会查数据库


update() //设置CascadeType.ALL时将会产生级联

delete()
	//删除user（多的一方）
	//user表里面有一个外键指向group的id
		//先设置关联关系为null,在删除
		//使用hql语言
		session.createQuery("delete from User u where u.id = 1").executeUpdate();
		session.getTransaction().commit();
	//删除group（一的一方）
		//先设置user全设为为null,在删除

		//account //show();
		//paraccount.show();
```

## 六、集合映射

在group里面存放user的引用

	一般情况下可以使用set
	但如果需要排序则需要使用list在get方法上加上 @OrderBy //默认按照主键排序
	参数@OrderBy("name ASC")

	使用map<某个字段的类型不能重复, User>并在get方法上加上@MapKey(name="id")来指定字段

## 七、继承映射

### 1、表设计

	Single Table 将所用字段存在一张表中，没有的设为空
	table per class 每个类一张表
	joined
			person表：存放共有的字段
					|
			|				|
	student		teacher
	（存放他们特有的字段）
	使用sql语句使用join将person与其子类进行连接

### 1、映射方案

#### （1）Single Table：

```java
	//在父类的上面加注解：
		@Entity
		@Inheritance(strategy=InheritanceType.SINGLE_TABLE)
		@DiscriminatorColumn(name="表示该记录属于的字段", discriminatorType=DiscriminatorType.STRING)
		@DiscriminatorValue("该类对象在表中区分器字段的对应值")
	在子类上注解：
		@Entity
		@DiscriminatorValue("该类对象在表中区分器字段的对应值")
```

#### （2）Table Per Class

```java
//父类上加注解:
		@Entity
		@Inheritance(strategy=InheritanceType.TABLE_PER_CLASS)
		@TableGenerator(
				name="t_gen",
				table="t_gen_table",
				pkColumnName="t_pk",
				valueColumnName="t_value",
				pkColumnValue="person_pk",
				initialValue=1,
				allocationSize=1
				)

	//在父类的id的get方法上加注解
				@Id
				@GeneratedValue(generator="t_gen", strategy=GenerationType.TABLE)
				public int getId() {
					return id;
				}

	//子类上只需加：
		@Entity不需写主键
```

#### （3）Joined

```
	//在父类上面加注解：
		@Entity
		@Inheritance(strategy=InheritanceType.InheritanceType.JOINED)
	子类上只需加：
		@Entity不需写主键
补充：sql语法
	select '值' as 字段名 from xxx
	例子1（Hibernate Table Per Class生成sql语句，zhkt正在使用的）：
			select
				openid ,
				name ,
				college ,
				zhuanye ,
				class ,
				'student' as identity
			from
				student
		union
			select
				openid ,
				name ,
				null as college ,
				null as zhuanye ,
				null as class ,
				'teacher' as identity
			from
				teacher

	例子2（Hibernate Joined生成sql语句）：
		select
			p.id as id,
			p.name as name,
			s.score as score,
			t.title as title
			case
				when s.id is not null then 'student'
				when p.id is not null then 'person'
				when t.id is not null then 'teacher'
			end as identity
		from
			person p
		left outer join
			student s
				on p.id=s.id
		left outer join
			teacher t
				on p.id=t.id
		where
			p.id=?
```

## 八、ql语句面向对象的sql语言

nativeSQL > hql > ejbql(jpql) > qbc(Query By Criteria) > qbe(query by example)
使用ql要设置导航关系

例子说明：
	板块(Category) Java
	主题(Topic) 探讨hibernate性能问题
	回复帖子(Msg) 一楼、二楼……
	?(MsgInfo)

### 1、样例

```java
	@Test
	public void testHQL_01() {
		Session session = sf.openSession();
		session.beginTransaction();
		Query q = session.createQuery("from Category");
		List<Category> categories = (List<Category>)q.list();
		for(Category c : categories) {
			System.out.println(c.getName());
		}
		session.getTransaction().commit();
		session.close();

	}

```

### 2、语法

```java
where语法
	Query q = session.createQuery("from Category c where c.name > 'c5'");

排序语法
	Query q = session.createQuery("from Category c order by c.name desc");

避免重复
	Query q = session.createQuery("select distinct c from Category c order by c.name desc");

使用占位符
	Query q = session.createQuery("from Category c where c.id > :min and c.id < :max");
	q.setParameter("min", 2);
	q.setParameter("max", 8);
	q.setInteger("min", 2);
	q.setInteger("max", 8);

链式编程
	Query q = session.createQuery("from Category c where c.id > :min and c.id < :max")
		.setInteger("min", 2)
		.setInteger("max", 8);


分页
	Query q = session.createQuery("from Category c order by c.name desc");
	q.setMaxResults(4);//设定最大结果集
	q.setFirstResult(2);//设置从第几条开始

自定义查询对象
	Query q = session.createQuery("select c.id,  c.name from Category c order by c.name desc");
	List<Object[]> categories = (List<Object[]>)q.list();


查询topic的表的category_id="1"的字段
	//设定fetch type 为lazy后将只会有一条sql语句
	Query q = session.createQuery("from Topic t where t.category.id = 1");

查询板块为1的所有回复帖子
	Query q = session.createQuery("from Msg m where m.topic.category.id = 1");

//了解即可


自定义表生成对象//此对象称为VO Value Object 或 //DTO data transfer object
	Query q = session.createQuery("select new com.bjsxt.hibernate.MsgInfo(m.id, m.cont, m.topic.title, m.topic.category.name) from Msg");



	//动手测试left right join
	//为什么不能直接写Category名，而必须写t.category
	//因为有可能存在多个成员变量（同一个类），需要指明用哪一个成员变量的连接条件来做连接
join表连接
	Query q = session.createQuery("select t.title, c.name from Topic t join t.category c "); //join Category c

学习使用uniqueResult
	@Test
	public void testHQL_14() {
		Session session = sf.openSession();
		session.beginTransaction();
		Query q = session.createQuery("from Msg m where m = :MsgToSearch "); //不重要
		Msg m = new Msg();
		m.setId(1);
		q.setParameter("MsgToSearch", m);

		Msg mResult = (Msg)q.uniqueResult(); //返回单独唯一的结果
		System.out.println(mResult.getCont());
		session.getTransaction().commit();
		session.close();

	}

	@Test
	public void testHQL_15() {
		Session session = sf.openSession();
		session.beginTransaction();
		Query q = session.createQuery("select count(*) from Msg m");

		long count = (Long)q.uniqueResult();
		System.out.println(count);
		session.getTransaction().commit();
		session.close();

	}

	@Test
	public void testHQL_16() {
		Session session = sf.openSession();
		session.beginTransaction();
		Query q = session.createQuery("select max(m.id), min(m.id), avg(m.id), sum(m.id) from Msg m");

		Object[] o = (Object[])q.uniqueResult();
		System.out.println(o[0] + "-" + o[1] + "-" + o[2] + "-" + o[3]);
		session.getTransaction().commit();
		session.close();

	}

where between and语法
	Query q = session.createQuery("from Msg m where m.id between 3 and 5");

where in () 语法
	Query q = session.createQuery("from Msg m where m.id in (3,4, 5)");

一个字段is null 与 is not null
	Query q = session.createQuery("from Msg m where m.cont is not null");

一个集合是否为空
//查询主题下面回帖为空
	Query q = session.createQuery("from Topic t where t.msgs is empty");

where like语法
//'%5':0个或者多个，'_5':表示一个
	Query q = session.createQuery("from Topic t where t.title like '%5'");

一些字符串函数：
	Query q = session.createQuery("select lower(t.title),"+ //转换为小写
				"upper(t.title),"+ //转换为大写
				"trim(t.title)," + //去掉首位空格
				"concat(t.title,'***'),"+ //连接
				"length(t.title)"+ //长度
				"from Topic t"
				");
数学函数：
	abs(数值)
	sqrt(数值)
	mod(数值1,数值2)

关键词
	current_date //当前日期
	current_time //当前时间
	current_timestap //当前时间日期
	Query q = session.createQuery("select current_date current_time current_timestap from Topic t");

日期的比较
	Query q = session.createQuery("from Topic t where t.createDate<:date");
	q.setParameter("date",new Date);

group by语法
//按标题分组查看每组有多少条记录
	Query q = session.createQuery("select t.title, count(*) from Topic t group by t.title");

ALL函数
	Query q = session.createQuery("from Topic t where t.id < ALL (select t.id from Topic t where mod(t.id, 2))");
	//相当于小于最小值

exists关键字
//查询回复为空的主题
//也可以用in 但 exists效率高
	Query q = session.createQuery("from Topic t where not exists (select m.id from msg m where m.topic.id=t.id)");

update | delete略

命名的查询，在类的加注解
	@NamedQueries(
	{
		@NamedQuery(name="topic.selectCertainTopic", query="from Topic t where t.id = :id")
	})
	@NamedNativeQueries(
	{
		@NamedNativeQuery(name="topic.select2_5Topic", query="select * from topic limit 2, 5")
	})

nativesql
	SQLQuery q = session.createSQLQuery("填写本地sql语句");


qbc(Query By Criteria)和qbe(query by example)
	@Test
	public void testQBC() {
		Session session = sf.openSession();
		session.beginTransaction();
		//criterion 标准/准则/约束
		Criteria c = session.createCriteria(Topic.class) //from Topic

					 .add(Restrictions.gt("id", 2)) //greater than = id > 2
					 .add(Restrictions.lt("id", 8)) //little than = id < 8
					 .add(Restrictions.like("title", "t_"))
					 .createCriteria("category")
					 .add(Restrictions.between("id", 3, 5)) //category.id >= 3 and category.id <=5
					 ;
		//DetachedCriterea
		for(Object o : c.list()) {
			Topic t = (Topic)o;
			System.out.println(t.getId() + "-" + t.getTitle());
		}
		session.getTransaction().commit();
		session.close();

	}

	//is empty and is not empty
	//query by criteria query by example
	@Test
	public void testQBE() {
		Session session = sf.openSession();
		session.beginTransaction();
		Topic tExample = new Topic();
		tExample.setTitle("T_");

		Example e = Example.create(tExample)
					.ignoreCase().enableLike();
		Criteria c = session.createCriteria(Topic.class)
					 .add(Restrictions.gt("id", 2))
					 .add(Restrictions.lt("id", 8))
					 .add(e)
					 ;


		for(Object o : c.list()) {
			Topic t = (Topic)o;
			System.out.println(t.getId() + "-" + t.getTitle());
		}
		session.getTransaction().commit();
		session.close();

	}
```

## 九、hibernate性能优化

### 1、session.clear()运用

	在一个大集合中遍历msg，取出含有敏感字样的对象
	这是另一种内存泄漏

### 2、1+n问题 //典型面试题

```java
	Query q = session.createQuery("from Topic");
	//Topic类的getCategory()注解设为@ManyToOne //（即默认fetch=FetchType.eager ）
	解决：
		将fetchType设为lazy//第二条语句将按需而发
	或
		在类上加注解：@BatchSize(size=5) //那么在对类成员作注入时将一条sql语句取出五条记录
	或
		使用left join fetch
			Query q = session.createQuery("from Topic t left join fetch t.category c");
		或
			List<Topic> topics = (List<Topic>)session.createCriteria(Topic.class).list();
```

### 3、list() and iterate()方法

* iterate()只发出取主键的sql语句	在遍历的时候才会根据主键在发出sql语句取出对象	在同一个session中取两遍对象那么，将只需在数据库中取出一次，第二次在session缓存中取
* list()	在同一个session中取两遍对象那么，将在数据库中取出两次
*	第一次取出时用lsit()，用的时候使用iterate()

### 4、一级缓存、二级缓存和查询缓存（面试题）

```
	一级缓存：session级的缓存	二级缓存：所有session共享的缓存成为sessionFactory级别缓存
	使用
		引入jar包
		ehcache.jar

		配置hibernate.cfh.xml
		<property name="cache.use_second_level_cache">true</property>
		<property name="cache.provider_class">org.hibernate.cache.EhCacheProvider</property>
		<property name="cache.use_query_cache">true</property>

		设置ehcache.xml
		<ehcache>
			<diskStore path="java.io.tmpdir"/>

			<defaultCache
				maxElementsInMemory="10000"
				eternal="false"
				timeToIdleSeconds="120"
				timeToLiveSeconds="1200"
				overflowToDisk="true"
			/>
			<cache name=""
				其他属性参见defaultCache/>

		</ehcache>

		添加注解@Cache //hibernate包下的
			参数：
				usage=CacheConcurrencyStrategy.READ_ONLY //只读的
					CacheConcurrencyStrategy.READ_WRITE //可读写的
				region "" //对应ehcache的缓存策略
				include "all" //

		何时使用二级缓存：
			经常被访问
			改动不大，不会经常改动
			数量有限


		默认情况下session.load() iterate()会使用二级缓存
		list()会将对象加到缓存中，但不会查询二级缓存

	查询缓存（重复查询时会用到的缓存，将查询语句与缓存对象相互关联）
	使用：
		在hibernate.cgh.xml中配置
		<property name="cache.use_query_cache">true</property>

		在调用Query时设置setCachable(true);
```

### 5、缓存算法（当空间已满，那么要如何替换旧的对象）

	LRU(Least Recently Used)
	LFU(Least Frequently Used)
	FIFO

## 十、事务的并发处理

事务：要么发生要么不发生

### 1、事务的特性(ACID)

*	原子性(Atomic) 不可再分
*	一致性(Consistency) 不改变约束
*	独立性(Itegrity) 两个事物不会出现交错执行的状态
*	持久性(Durability) 不会无缘无故的回滚

### 2、事务并发时可能出现的问题

	(1)第一类丢失更新
	(2)脏读(dirty tead)
		读的另外一个事务没有提交的数据
	(3)不可重复读取(non-repeatable read)
		同一个事务对同一个数据前后读取的数据不一致
	(4)第二类丢失更新
	(5)幻读（一般不考虑）
		在读的过程中另一个事务正在插入和更新从而影响到了当前的事务前后查询的数量

### 3、数据库的隔离机制

	read-uncommitted 能够读取未提交的数据（以上问题都可能发生）
	read-committed 只有提交后才能读出来（不会出现脏读）
	repeatable read 可重复读//mysql默认的隔离机制//实现在读后在数据上加锁
	serializable 序列化的排队处理

	如何设定：
		一般设定为read-committed
		只要数据库支持事务就不会出现第一类丢失更新
		在hibernate设定
		hibernate.connection.isolation=2

### 4、悲观锁和乐观锁(在hibernate.connection.isolation=2条件下)

	悲观锁：
		读完事务后，给数据加锁(借助数据库的锁)
		session.load(Account.class, 1, LOCkMode.UPGRADE)
		//这样发出的select语句将会加上for upfate

	乐观锁实现：
		在Account加一个属性version在get方法上加上注解@Version
		这样发生不一致就会报错对此作出相应的处理即可

## 十一、hibernate的总结

xml配置 建议查 不重要
annotation 查和背结合 重要
基础配置 用 重要
ID生成策略 用 重要
联合主键 重要 查
Configuration API 重要 用
sf.openSession/get 重要 用背
session方法 重要 用背
SchemeExport
对象状态 重要 背
一对一外键 一般 用查
一对一主键 不重要
1:n n:1 重要 用
m:n 重要 用
集合映射
双向关联mappedby 重要 用
组件映射
继承映射 重要 会说
树状结构 重要 熟练用
QL种类 一般 背
EJBQL 重要 用了解
QBC/QBE 重要 了解
1+n问题 重要 熟练
list iterate 了解
三种缓存 一般重要
缓存算法 了解
事务 重要 了解/会说
