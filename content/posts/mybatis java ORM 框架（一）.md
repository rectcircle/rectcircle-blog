---
title: mybatis java ORM 框架（一）
date: 2017-10-21T20:23:45+08:00
draft: false
toc: false
comments: true
aliases:
  - /detail/107
  - /detail/107/
tags:
  - java
---

> http://www.mybatis.org/mybatis-3/zh/index.html
> http://blog.csdn.net/gebitan505/article/details/54929287

## 目录
* [一、相关说明](#一、相关说明)
	* [1、开发环境](#1、开发环境)
	* [2、toy项目需求](#2、toy项目需求)
	* [3、初始化项目](#3、初始化项目)
* [二、通用步骤](#二、通用步骤)
	* [1、实现model对象](#1、实现model对象)
	* [2、创建数据库及表结构](#2、创建数据库及表结构)
* [三、无配置文件注解版](#三、无配置文件注解版)
	* [1、包扫描配置](#1、包扫描配置)
	* [2、实现相应的mapper接口](#2、实现相应的mapper接口)
	* [3、测试](#3、测试)
	* [4、在service中使用](#4、在service中使用)
* [四、极简xml方式](#四、极简xml方式)
	* [1、配置xml位置](#1、配置xml位置)
	* [2、编写mybatis-config.xml](#2、编写mybatis-config.xml)
	* [3、编写mapper.xml](#3、编写mapper.xml)
	* [4、创建mapper接口](#4、创建mapper接口)
	* [5、测试使用](#5、测试使用)
* [五、官方文档摘要](#五、官方文档摘要)
	* [1、入门](#1、入门)
	* [2、XML配置文件](#2、XML配置文件)
	* [3、XML映射文件](108#3、XML映射文件)
	* [4、动态SQL](108#4、动态SQL)
	* [5、Java API](108#5、Java API)
	* [6、SQL语句构建器](108#6、SQL语句构建器)
* [六、MyBatis-Spring-Boot-Starter](108#六、MyBatis-Spring-Boot-Starter)


## 一、相关说明
********************************
### 1、开发环境
IntelliJ IDEA

### 2、toy项目需求
简单的商品后台管理系统
* 管理系统目的：对一系列商品和用户的管理。
* 商品属性包括价格，名称，描述，分类等。
* 管理系统需要支持对商品的增删查改，对分类的增删查改，支持按照分类浏览商品。
* 支持用户的增删查改
* 附加项：
	* 可以做用户的登录注册功能，
	* 可以做用户权限级别[查看权限，修改权限]，自由发挥）

### 3、初始化项目
* 使用IDEA 的 spring boot 初始化器
* 配置application.properties中配置数据库信息

```
spring.datasource.url = jdbc:mysql://localhost:3306/commodity
spring.datasource.username = root
spring.datasource.password = 123456
spring.datasource.driverClassName = com.mysql.jdbc.Driver

# 配置session
spring.session.store-type=none
```



## 二、通用步骤
****************************************
### 1、实现model对象
#### （1）设计实体类
假设该项目拥有一个User实体，包含以下成员
* id:Long
* username:String
* password:String
* name:String

#### （2）创建实体类
创建一个包，命名为model
实现一个实体类（javabean）
```java
package cn.rectcircle.ssm.model;

import java.io.Serializable;

public class User implements Serializable {
	private static final long serialVersionUID = 1L;
	private Long id;
	private String username;
	private String password;
	private String name;

	public User(String username, String password, String name) {
		this.username = username;
		this.password = password;
		this.name = name;
	}

	public User() {

	}

	@Override
	public String toString() {
		return "User{" +
				"id=" + id +
				", username='" + username + '\'' +
				", password='" + password + '\'' +
				", name='" + name + '\'' +
				'}';
	}

	public void setId(Long id) {
		this.id = id;
	}

	public void setUsername(String username) {
		this.username = username;
	}

	public void setPassword(String password) {
		this.password = password;
	}

	public void setName(String name) {
		this.name = name;
	}

	public Long getId() {
		return id;
	}

	public String getUsername() {
		return username;
	}

	public String getPassword() {
		return password;
	}

	public String getName() {
		return name;
	}
}

```

### 2、创建数据库及表结构
根据模型设计编写sql
以mysql为例
```sql
CREATE DATABASE `commodity`;

CREATE TABLE user (
  id       BIGINT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(20)  NOT NULL UNIQUE KEY,
  password VARCHAR(255) NOT NULL,
  `name`   VARCHAR(20)  NOT NULL
);
```

## 三、无配置文件注解版
*****************************
这种方式更能可能受限于Java注解，缺乏灵活性

### 1、包扫描配置
#### （1）mapper包扫描
在Spring boot入口类上添加注解`@MapperScan("cn.rectcircle.ssm.mapper")`
```java
package cn.rectcircle.ssm;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@MapperScan("cn.rectcircle.ssm.mapper")
public class SsmApplication {

	public static void main(String[] args) {
		SpringApplication.run(SsmApplication.class, args);
	}
}
```
这样Spring就会自动扫描接口创建相应的实体类

#### （2）实体类包扫描
在application.properties添加

```
# 配置mybatis实体类
mybatis.type-aliases-package=cn.rectcircle.ssm.model
```

### 2、实现相应的mapper接口
#### （1）创建mapper包

#### （2）定义业务逻辑需要的Dao操作
```java
package cn.rectcircle.ssm.mapper;

import cn.rectcircle.ssm.model.User;
import org.apache.ibatis.annotations.*;

import java.util.List;

public interface UserMapper {

	@Insert("INSERT INTO user(username,password,name) VALUES(#{username}, #{password}, #{name})")
	void insert(User user);

	@Select("SELECT * FROM user")
	@Results({
			@Result(property = "username",  column = "username", javaType = String.class),
	})
	List<User> getAll();

	@Select("SELECT * FROM user WHERE id = #{id}")
	User getOne(Long id);

	@Delete("DELETE FROM user WHERE TRUE")
	void deleteAll();

}
```

* @Select 是查询类的注解，所有的查询均使用这个
* @Result 修饰返回的结果集，关联实体类属性和数据库字段一一对应，如果实体类属性和数据库属性名保持一致，就不需要这个属性来修饰。
* @Insert 插入数据库使用，直接传入实体类会自动解析属性到对应的值
* @Update 负责修改，也可以直接传入对象
* @delete 负责删除

[参见](http://www.mybatis.org/mybatis-3/zh/java-api.html)

注意，使用#符号和$符号的不同：
```java
// This example creates a prepared statement, something like select * from teacher where name = ?;
@Select("Select * from teacher where name = #{name}")
Teacher selectTeachForGivenName(@Param("name") String name);

// This example creates n inlined statement, something like select * from teacher where name = 'someName';
@Select("Select * from teacher where name = '${name}'")
Teacher selectTeachForGivenName(@Param("name") String name);
```
### 3、测试
在Maven测试目录下创建相同的包结构创建如下测试类。
使用`@Autowired`以成员变量的方式注入
```java
package cn.rectcircle.ssm.mapper;

import cn.rectcircle.ssm.model.User;
import org.junit.Assert;
import org.junit.runner.RunWith;

import org.junit.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.junit4.SpringRunner;

@RunWith(SpringRunner.class)
@SpringBootTest
public class UserMapperTest {

	@Autowired
	private UserMapper userMapper;

	@Test
	public void testInsert() throws Exception {
		userMapper.deleteAll();

		userMapper.insert(new User("aa", "a123456","a"));
		userMapper.insert(new User("bb", "b123456", "b"));

		Assert.assertEquals(2, userMapper.getAll().size());
	}

}
```

### 4、在service中使用
同样使用`@Autowired`以成员变量的方式注入


## 四、极简xml方式
### 1、配置xml位置
在application.properties中添加
```
# 配置xml文件位置
mybatis.config-locations=classpath:mybatis/mybatis-config.xml
mybatis.mapper-locations=classpath:mybatis/mapper/*.xml
```

### 2、编写mybatis-config.xml
mybatis-config.xml 配置
```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE configuration
		PUBLIC "-//mybatis.org//DTD Config 3.0//EN"
		"http://mybatis.org/dtd/mybatis-3-config.dtd">
<configuration>
	<typeAliases>
		<typeAlias alias="Integer" type="java.lang.Integer" />
		<typeAlias alias="Long" type="java.lang.Long" />
		<typeAlias alias="HashMap" type="java.util.HashMap" />
		<typeAlias alias="LinkedHashMap" type="java.util.LinkedHashMap" />
		<typeAlias alias="ArrayList" type="java.util.ArrayList" />
		<typeAlias alias="LinkedList" type="java.util.LinkedList" />
		
	</typeAliases>
</configuration>
```

### 3、编写mapper.xml
```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper
		PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
		"http://mybatis.org/dtd/mybatis-3-mapper.dtd">


<!--mapper 定义该文件与哪一个java类对应 -->
<mapper namespace="cn.rectcircle.ssm.mapper.UserMapper1">

	<!--resultMap 定义返回结果和数据库列名中的映射 -->
	<resultMap id="BaseResultMap" type="cn.rectcircle.ssm.model.User">
		<id column="id" property="id" jdbcType="BIGINT"/>
		<result column="username" property="username" jdbcType="VARCHAR"/>
		<result column="password" property="password" jdbcType="VARCHAR"/>
		<result column="name" property="name" jdbcType="VARCHAR"/>
	</resultMap>

	<!-- sql语句块用于 使用include引入 -->
	<sql id="Base_Column_List">
		id, username, password, name
	</sql>

	<!--定义一条select语句，返回结果使用BaseResultMap定义的规则映射成java对象-->
	<select id="getAll" resultMap="BaseResultMap">
		SELECT
		<include refid="Base_Column_List"/> <!--在此引入了sql语句块，直接替换-->
		FROM user
	</select>

	<!-- parameterType指定传入参数类型 -->
	<select id="getOne" parameterType="java.lang.Long" resultMap="BaseResultMap">
		SELECT
		<include refid="Base_Column_List"/>
		FROM user
		WHERE id = #{id}
	</select>

	<!--指定主键，并自动注入到参数的属性中-->
	<insert id="insert"
	        useGeneratedKeys="true"
	        keyProperty="id"
	        parameterType="cn.rectcircle.ssm.model.User">
		INSERT INTO
		user
		(username,password,name)
		VALUES
		(#{username}, #{password}, #{name})
	</insert>

	<update id="update" parameterType="cn.rectcircle.ssm.model.User">
		UPDATE
		user
		SET
		<if test="userName != null">username = #{username},</if>
		<if test="passWord != null">password = #{password},</if>
		name = #{name}
		WHERE
		id = #{id}
	</update>

	<delete id="delete" parameterType="java.lang.Long">
		DELETE FROM
		user
		WHERE
		id =#{id}
	</delete>

	<delete id="deleteAll">
		DELETE FROM
		user
		WHERE TRUE
	</delete>

</mapper>
```

### 4、创建mapper接口
```java
package cn.rectcircle.ssm.mapper;

import cn.rectcircle.ssm.model.User;

import java.util.List;

public interface UserMapper1 {

	List<User> getAll();

	User getOne(Long id);

	int insert(User user);

	int update(User user);

	void delete(Long id);

	void deleteAll();

}
```

#### 5、测试使用
使用`@Autowired`注入
```java
package cn.rectcircle.ssm.mapper;

import cn.rectcircle.ssm.model.User;
import org.junit.Assert;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.junit4.SpringRunner;

@RunWith(SpringRunner.class)
@SpringBootTest
public class UserMapper1Test {

	@Autowired
	private UserMapper1 userMapper1;

	@Test
	public void testInsert() throws Exception {
		userMapper1.deleteAll();

		User user1 = new User("aa", "a123456","a");
		User user2 = new User("bb", "b123456", "b");
		System.out.println(userMapper1.insert(user1));
		System.out.println(userMapper1.insert(user2));

		System.out.println(user1.getId());
		System.out.println(user2.getId());


		Assert.assertEquals(2, userMapper1.getAll().size());
	}

}
```


## 五、官方文档摘要
*****************************
### 1、入门
#### （1）安装
添加依赖：[Mybatis](http://mvnrepository.com/artifact/org.mybatis/mybatis)，以及jdbc驱动和数据库实现

或者 maven Spring Boot
```xml
		<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-starter-jdbc</artifactId>
		</dependency>
		<dependency>
			<groupId>org.mybatis.spring.boot</groupId>
			<artifactId>mybatis-spring-boot-starter</artifactId>
			<version>1.3.1</version>
		</dependency>
		<dependency>
			<groupId>mysql</groupId>
			<artifactId>mysql-connector-java</artifactId>
			<scope>runtime</scope>
		</dependency>
```

#### （2）从 XML 中构建 SqlSessionFactory
* MyBatis 以一个 SqlSessionFactory 的实例为中心的
* SqlSessionFactory 的实例可以通过 SqlSessionFactoryBuilder 获得
* SqlSessionFactoryBuilder 则可以从
	*  XML 配置文件
	*  或一个预先定制的 Configuration 的实例
*  构建出 SqlSessionFactory 的实例

样例代码
```java
String resource = "org/mybatis/example/mybatis-config.xml";
InputStream inputStream = Resources.getResourceAsStream(resource);
SqlSessionFactory sqlSessionFactory = new SqlSessionFactoryBuilder().build(inputStream);
```

XML 配置文件中包含了对 MyBatis 系统的核心设置，包含获取数据库连接实例的数据源（DataSource）和决定事务作用域和控制方式的事务管理器（TransactionManager）。XML 配置文件的详细内容后面再探讨，这里先给出一个简单的示例：
```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE configuration
  PUBLIC "-//mybatis.org//DTD Config 3.0//EN"
  "http://mybatis.org/dtd/mybatis-3-config.dtd">
<configuration>
  <environments default="development">
    <environment id="development">
      <transactionManager type="JDBC"/>
      <dataSource type="POOLED">
        <property name="driver" value="${driver}"/>
        <property name="url" value="${url}"/>
        <property name="username" value="${username}"/>
        <property name="password" value="${password}"/>
      </dataSource>
    </environment>
  </environments>
  <mappers>
    <mapper resource="org/mybatis/example/BlogMapper.xml"/>
  </mappers>
</configuration>
```

在 spring boot 中一般这些信息可以在application.properties文件中配置


#### （2）Java代码配置
```java
DataSource dataSource = BlogDataSourceFactory.getBlogDataSource(); //javax.sql.DataSource
TransactionFactory transactionFactory = new JdbcTransactionFactory();
Environment environment = new Environment("development", transactionFactory, dataSource);
Configuration configuration = new Configuration(environment);
configuration.addMapper(BlogMapper.class);
SqlSessionFactory sqlSessionFactory = new SqlSessionFactoryBuilder().build(configuration);
```

#### （3）从 SqlSessionFactory 中获取 SqlSession
例如
旧版写法
```java
SqlSession session = sqlSessionFactory.openSession();
try {
  Blog blog = (Blog) session.selectOne("org.mybatis.example.BlogMapper.selectBlog", 101);
} finally {
  session.close();
}
```

新版写法
```java
SqlSession session = sqlSessionFactory.openSession();
try {
  BlogMapper mapper = session.getMapper(BlogMapper.class);
  Blog blog = mapper.selectBlog(101);
} finally {
  session.close();
}
```
其中BlogMapper用户自定义的接口，定义常规Dao操作，其中selectBlog就是其中一个
Blog是用户自定义的实体类，应用与Db中的表映射

原理如下

#### （4）探究已映射的 SQL 语句
**通过XML映射语句实例：**
```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper
  PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
  "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="org.mybatis.example.BlogMapper">
  <select id="selectBlog" resultType="Blog">
    select * from Blog where id = #{id}
  </select>
</mapper>
```
在命名空间org.mybatis.example.BlogMapper中定义了一个名为“selectBlog”的映射语句，这样它就允许你使用指定的完全限定名org.mybatis.example.BlogMapper.selectBlog来调用映射语句，就像上面的例子中做的那样：
```java
Blog blog = (Blog) session.selectOne("org.mybatis.example.BlogMapper.selectBlog", 101);
```
如果名字空间和Java接口定义一致就可以使用以下写法
```java
  BlogMapper mapper = session.getMapper(BlogMapper.class);
  Blog blog = mapper.selectBlog(101);
```


**通过注解实现**
```java
package org.mybatis.example;
public interface BlogMapper {
  @Select("SELECT * FROM blog WHERE id = #{id}")
  Blog selectBlog(int id);
}
```


#### （5）作用域（Scope）和生命周期
对象生命周期和依赖注入框架
依赖注入框架可以创建线程安全的、基于事务的 SqlSession 和映射器（mapper）并将它们直接注入到你的 bean 中，因此可以直接忽略它们的生命周期。如果对如何通过依赖注入框架来使用 MyBatis 感兴趣可以研究一下 MyBatis-Spring 或 MyBatis-Guice 两个子项目。

**SqlSessionFactoryBuilder**:
这个类可以被实例化、使用和丢弃，一旦创建了 SqlSessionFactory，就不再需要它了。因此 SqlSessionFactoryBuilder 实例的最佳作用域是方法作用域（也就是**局部方法变量**）

**SqlSessionFactory**:
SqlSessionFactory 一旦被创建就应该在应用的运行期间一直存在，最简单的就是使用**单例模式**或者静态单例模式。

**SqlSession**:
每个线程都应该有它自己的 SqlSession 实例。SqlSession 的实例**不是线程安全**的，因此是不能被共享的，所以它的最佳的作用域是请求或方法作用域。
如果你现在正在使用一种 Web 框架，要考虑 SqlSession 放在一个和 HTTP 请求对象相似的作用域中。换句话说，**每次收到的 HTTP 请求，就可以打开一个 SqlSession，返回一个响应，就关闭它**。这个关闭操作是很重要的，你应该把这个关闭操作放到 finally 块中以确保每次都能执行关闭。下面的示例就是一个确保 SqlSession 关闭的标准模式：
```java
SqlSession session = sqlSessionFactory.openSession();
try {
  // do work
} finally {
  session.close();
}
```

**映射器实例（Mapper Instances）**:
映射器是创建用来绑定映射语句的接口。映射器接口的实例是从 SqlSession 中获得的。因此从技术层面讲，**映射器实例的最大作用域是和 SqlSession 相同的**，因为它们都是从 SqlSession 里被请求的。


### 2、XML配置文件
mybatis-config.xml文件的配置
#### （1）properties
用于配置一些属性，这些属性在全局配置文件都可以通过`${属性名使用}`
```xml
	<properties resource="org/mybatis/example/config.properties">
		<property name="username" value="dev_user"/>
		<property name="password" value="F2Fa3!33TYyg"/>
	</properties>
```
使用
```xml
<dataSource type="POOLED">
  <property name="driver" value="${driver}"/>
  <property name="url" value="${url}"/>
  <property name="username" value="${username}"/>
  <property name="password" value="${password}"/>
</dataSource>
```
关于属性的优先级：通过方法参数传递的属性具有最高优先级，resource/url 属性中指定的配置文件次之，最低优先级的是 properties 属性中指定的属性。

从MyBatis 3.4.2开始，你可以为占位符指定一个默认值。例如：
```xml
<dataSource type="POOLED">
  <!-- ... -->
  <property name="username" value="${username:ut_user}"/> <!-- 如果username没有定义，将使用ut_user作为默认值 -->
</dataSource>
```
前提有开启此特性
```xml
<properties resource="org/mybatis/example/config.properties">
  <!--开启属性默认值 -->
  <property name="org.apache.ibatis.parsing.PropertyParser.enable-default-value" value="true"/>
</properties>
```

#### （2）settings
全局设置
```xml
	<!--mybatis 设置 -->
	<settings>
		<!--该配置影响的所有映射器中配置的缓存的全局开关。-->
		<setting name="cacheEnabled" value="true"/>
		<!--延迟加载的全局开关。当开启时，所有关联对象都会延迟加载。 特定关联关系中可通过设置fetchType属性来覆盖该项的开关状态。	-->
		<setting name="lazyLoadingEnabled" value="true"/>
		<!--当开启时，任何方法的调用都会加载该对象的所有属性。否则，每个属性会按需加载（参考lazyLoadTriggerMethods).-->
		<setting name="aggressiveLazyLoading" value="true"/>
		<!--是否允许单一语句返回多结果集（需要兼容驱动）。 -->
		<setting name="multipleResultSetsEnabled" value="true"/>
		<!--使用列标签代替列名。不同的驱动在这方面会有不同的表现， 具体可参考相关驱动文档或通过测试这两种不同的模式来观察所用驱动的结果。-->
		<setting name="useColumnLabel" value="true"/>
		<!--	允许 JDBC 支持自动生成主键，需要驱动兼容。 如果设置为 true 则这个设置强制使用自动生成主键，尽管一些驱动不能兼容但仍可正常工作（比如 Derby）。-->
		<setting name="useGeneratedKeys" value="false"/>
		<!--	指定 MyBatis 应如何自动映射列到字段或属性。 NONE 表示取消自动映射；PARTIAL 只会自动映射没有定义嵌套结果集映射的结果集。 FULL 会自动映射任意复杂的结果集（无论是否嵌套）-->
		<setting name="autoMappingBehavior" value="PARTIAL"/>
		<!--指定发现自动映射目标未知列（或者未知属性类型）的行为。
NONE: 不做任何反应
WARNING: 输出提醒日志 ('org.apache.ibatis.session.AutoMappingUnknownColumnBehavior' 的日志等级必须设置为 WARN)
FAILING: 映射失败 (抛出 SqlSessionException)-->
		<setting name="autoMappingUnknownColumnBehavior" value="WARNING"/>
		<!--配置默认的执行器。SIMPLE 就是普通的执行器；REUSE 执行器会重用预处理语句（prepared statements）； BATCH 执行器将重用语句并执行批量更新。-->
		<setting name="defaultExecutorType" value="SIMPLE"/>
		<!--设置超时时间，它决定驱动等待数据库响应的秒数。-->
		<setting name="defaultStatementTimeout" value="25"/>
		<!--为驱动的结果集获取数量（fetchSize）设置一个提示值。此参数只可以在查询设置中被覆盖。-->
		<setting name="defaultFetchSize" value="100"/>
		<!--允许在嵌套语句中使用分页（RowBounds）。如果允许使用则设置为false。-->
		<setting name="safeRowBoundsEnabled" value="false"/>
		<!--允许在嵌套语句中使用分页（ResultHandler）。如果允许使用则设置为false。-->
		<setting name="safeResultHandlerEnabled" value="false"/>
		<!--	是否开启自动驼峰命名规则（camel case）映射，即从经典数据库列名 A_COLUMN 到经典 Java 属性名 aColumn 的类似映射。-->
		<setting name="mapUnderscoreToCamelCase" value="false"/>
		<!--MyBatis 利用本地缓存机制（Local Cache）防止循环引用（circular references）和加速重复嵌套查询。 默认值为 SESSION，这种情况下会缓存一个会话中执行的所有查询。 若设置值为 STATEMENT，本地会话仅用在语句执行上，对相同 SqlSession 的不同调用将不会共享数据。-->
		<setting name="localCacheScope" value="SESSION"/>
		<!--当没有为参数提供特定的 JDBC 类型时，为空值指定 JDBC 类型。 某些驱动需要指定列的 JDBC 类型，多数情况直接用一般类型即可，比如 NULL、VARCHAR 或 OTHER。-->
		<setting name="jdbcTypeForNull" value="OTHER"/>
		<!--指定哪个对象的方法触发一次延迟加载。-->
		<setting name="lazyLoadTriggerMethods" value="equals,clone,hashCode,toString"/>
		<!--defaultScriptingLanguage	指定动态 SQL 生成的默认语言。-->
		<!--其他参见 http://www.mybatis.org/mybatis-3/zh/configuration.html#properties-->
	</settings>
```

#### （3）typeAliases（类型别名）
```xml
<typeAliases>
  <typeAlias alias="Author" type="domain.blog.Author"/>
  <typeAlias alias="Blog" type="domain.blog.Blog"/>
  <typeAlias alias="Comment" type="domain.blog.Comment"/>
  <typeAlias alias="Post" type="domain.blog.Post"/>
  <typeAlias alias="Section" type="domain.blog.Section"/>
  <typeAlias alias="Tag" type="domain.blog.Tag"/>
	<package name="domain.blog"/> <!-- 会使用 Bean 的首字母小写的非限定类名来作为它的别名 -->
</typeAliases>
```
使用注解
```java
@Alias("author")
public class Author {
    ...
}
```

已经为许多常见的 Java 类型内建了相应的类型别名。它们都是**大小写不敏感**的

|别名 |	映射的类型|
|-----|---------|
|\_byte |	byte|
|\_long |	long|
|\_short |	short|
|\_int |	int|
|\_integer |	int|
|\_double |	double|
|\_float |	float|
|\_boolean |	boolean|
|string |	String|
|byte |	Byte|
|long |	Long|
|short |	Short|
|int |	Integer|
|integer |	Integer|
|double |	Double|
|float |	Float|
|boolean |	Boolean|
|date |	Date|
|decimal |	BigDecimal|
|bigdecimal |	BigDecimal|
|object |	Object|
|map |	Map|
|hashmap |	HashMap|
|list |	List|
|arraylist |	ArrayList|
|collection |	Collection|
|iterator |	Iterator|

#### （4）[typeHandlers](http://www.mybatis.org/mybatis-3/zh/configuration.html#typeHandlers)
无论是 MyBatis 在预处理语句（PreparedStatement）中设置一个参数时，还是从结果集中取出一个值时， 都会用类型处理器将获取的值以合适的方式转换成 Java 类型。下表描述了一些默认的类型处理器。

略

#### （5）[对象工厂（objectFactory）](http://www.mybatis.org/mybatis-3/zh/configuration.html#objectFactory)
MyBatis 每次创建结果对象的新实例时，它都会使用一个对象工厂（ObjectFactory）实例来完成。 默认的对象工厂需要做的仅仅是实例化目标类，要么通过默认构造方法，要么在参数映射存在的时候通过参数构造方法来实例化。 如果想覆盖对象工厂的默认行为，则可以通过创建自己的对象工厂来实现。

略


#### （6）[插件（plugins）](http://www.mybatis.org/mybatis-3/zh/configuration.html#plugins)

#### （7）[配置环境（environments）](http://www.mybatis.org/mybatis-3/zh/configuration.html#environments)
例子
```xml
<environments default="development">
  <environment id="development">
    <transactionManager type="JDBC">
      <property name="..." value="..."/>
    </transactionManager>
    <dataSource type="POOLED">
      <property name="driver" value="${driver}"/>
      <property name="url" value="${url}"/>
      <property name="username" value="${username}"/>
      <property name="password" value="${password}"/>
    </dataSource>
  </environment>
</environments>
```
#### [（8）databaseIdProvider](http://www.mybatis.org/mybatis-3/zh/configuration.html#databaseIdProvider)
略

#### （9）映射器（mappers）
既然 MyBatis 的行为已经由上述元素配置完了，我们现在就要定义 SQL 映射语句了。但是首先我们需要告诉 MyBatis 到哪里去找到这些语句。 Java 在自动查找这方面没有提供一个很好的方法，所以最佳的方式是告诉 MyBatis 到哪里去找映射文件。你可以使用相对于类路径的资源引用， 或完全限定资源定位符（包括 file:/// 的 URL），或类名和包名等。例如：
```xml
<!-- Using classpath relative resources -->
<mappers>
  <mapper resource="org/mybatis/builder/AuthorMapper.xml"/>
  <mapper resource="org/mybatis/builder/BlogMapper.xml"/>
  <mapper resource="org/mybatis/builder/PostMapper.xml"/>
</mappers>
```
```xml
<!-- Using url fully qualified paths -->
<mappers>
  <mapper url="file:///var/mappers/AuthorMapper.xml"/>
  <mapper url="file:///var/mappers/BlogMapper.xml"/>
  <mapper url="file:///var/mappers/PostMapper.xml"/>
</mappers>
```
```xml
<!-- Using mapper interface classes -->
<mappers>
  <mapper class="org.mybatis.builder.AuthorMapper"/>
  <mapper class="org.mybatis.builder.BlogMapper"/>
  <mapper class="org.mybatis.builder.PostMapper"/>
</mappers>
```
```xml
<!-- Register all interfaces in a package as mappers -->
<mappers>
  <package name="org.mybatis.builder"/>
</mappers>
```




