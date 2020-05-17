---
title: Spring Security
date: 2018-05-07T16:26:12+08:00
draft: false
toc: true
comments: true
aliases:
  - /detail/141
  - /detail/141/
tags:
  - Java
---

> 参考
> 官方文档：[中文](https://springcloud.cc/spring-security-zhcn.html) | [英文](https://docs.spring.io/spring-security/site/docs/current/reference/htmlsingle/)
> [博客](http://elim.iteye.com/category/182468)
> [开源书](https://waylau.gitbooks.io/spring-security-tutorial/content/docs/overview.html)

## 〇、介绍

***

## 一、一个简单的例子

***

### 1、实现功能

#### （1）使用技术

* Spring Boot
* JPA
* h2内嵌数据库
* Thymeleaf模板
* Security
* web（SpringMVC）

#### （2）需求

`/ GET`用于获取读者的借书信息需要实现登录之后才能访问

### 2、初始化项目

使用 http://start.spring.io 创建项目。选择模块如下

* Web
* Security
* JPA
* Thymeleaf
* H2

### 3、创建相关实体和DAO

简单包含两个实体：Reader和Book

```java
@Entity
public class Reader implements UserDetails {
	private static final long serialVersionUID = 1L;
	@Id
	private String username;
	private String fullname;
	private String password;
	//...
	//UserDetails相关方法：未获取用户关于安全的一些信息的接口。
	@Override
	public Collection<? extends GrantedAuthority> getAuthorities() {
		return Arrays.asList(new SimpleGrantedAuthority("ROLE_READER"));
	}
	@Override	public String getPassword() { return password; }
	@Override	public String getUsername() {	return username; }
	@Override	public boolean isAccountNonExpired() { return true; }
	@Override public boolean isAccountNonLocked() {	return true; }
	@Override public boolean isCredentialsNonExpired() {return true;}
	@Override	public boolean isEnabled() {return true;}
}


@Entity
public class Book {
	@Id
	@GeneratedValue(strategy=GenerationType.AUTO)
	private Long id;
	@ManyToOne
	private Reader reader;
	private String isbn;
	private String title;
	private String author;
	private String description;
}
```

DAO简单使用JPA的接口

```java
public interface ReaderRepository
			extends JpaRepository<Reader, String> {

}
public interface ReadingListRepository extends JpaRepository<Book, Long> {
	List<Book> findByReader(Reader reader);
}
```

### 4、Controller实现

```java
@Controller
@RequestMapping("/")
public class ReadingListController {

	private ReadingListRepository readingListRepository;

	@Autowired
	public ReadingListController(
			ReadingListRepository readingListRepository) {
		this.readingListRepository=readingListRepository;
	}

	@RequestMapping(method=RequestMethod.GET)
	public String readersBooks(Reader reader, Model model) {
		List<Book>	readingList = readingListRepository.findByReader(reader);
		if (readingList != null) {
			model.addAttribute("books", readingList);
			model.addAttribute("reader", reader);
		}
		return "readingList";
	}

	@RequestMapping(method=RequestMethod.POST)
	public String addToReadingList(Reader reader, Book book) {
		book.setReader(reader);
		readingListRepository.save(book);
		return "redirect:/";
	}
}
```

### 5、SpringSecurity的配置

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig extends WebSecurityConfigurerAdapter {

	@Autowired
	private ReaderRepository readerRepository;

	@Override
	protected void configure(HttpSecurity http) throws Exception {
		http
			.authorizeRequests() //
				.antMatchers("/").hasRole("READER")
				.antMatchers("/**").permitAll() //放行其他所有
			.and()
				.formLogin() //登录表单设置
				.loginPage("/login") //url = /login
				.failureUrl("/login?error=true"); //失败页面
	}

	@Override
	protected void configure(AuthenticationManagerBuilder auth) throws Exception {
		//配置如何获取用于验证的UserDetails的Service（需要实现UserDetailsService接口）
		//在此简单的直接实现如下
		auth
			.userDetailsService(userDetailsService())
			.passwordEncoder(NoOpPasswordEncoder.getInstance());
	}

	//同时放入bean容器，测试时会用到
	@Bean
	public UserDetailsService userDetailsService() {
		return username->{
			if(username.equals("root")) {
				return new Reader("root", "root", "root");
			}
			Optional<Reader> optional = readerRepository.findById(username);
			if(optional.isPresent()) {
				return optional.get();
			}
			throw new UsernameNotFoundException("User '" + username + "' not found.");
		};
	}

}

```

### 6、方便将已认证用户注入到Controller参数

```java
//自定义参数处理器：用户登录成功后，将用户信息注入到参数中
public class ReaderHandlerMethodArgumentResolver implements HandlerMethodArgumentResolver {

	public ReaderHandlerMethodArgumentResolver() {
		System.out.println("=============ReaderHandlerMethodArgumentResolver===============");
	}

	//当参数要被解析成Reader的时候（Controller内部方法的类型），使用本处理器处理
	@Override
	public boolean supportsParameter(MethodParameter parameter) {
		return Reader.class.isAssignableFrom(parameter.getParameterType());
	}

	//处理方法：验证用户登录信息
	@Override
	public Object resolveArgument(
			MethodParameter parameter, //方法参数的封装
			ModelAndViewContainer mavContainer, //
			NativeWebRequest webRequest,  //原生的Request
			WebDataBinderFactory binderFactory) throws Exception {

		Authentication auth = (Authentication) webRequest.getUserPrincipal();
		//验证通过返回
		//验证不通过返回null
		return auth != null && auth.getPrincipal() instanceof Reader ? auth.getPrincipal() : null;

	}

}
```

另一种方式：只用注解`@AuthenticationPrincipal`注解

在Controller相关参数上加注解

```java
	@RequestMapping(value="/", method=RequestMethod.GET)
	public String readersBooks(@AuthenticationPrincipal Reader reader, Model model) {
		List<Book>	readingList = readingListRepository.findByReader(reader);
		if (readingList != null) {
			model.addAttribute("books", readingList);
			model.addAttribute("reader", reader);
			model.addAttribute("amazonID", amazonConfig.getAssociateId());
		}
		return "readingList";
	}
```

### 7、注册HandlerMethodArgumentResolver和登录视图

```java
package cn.rectcircle.borrowinglist;

import java.util.List;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

//SpringMVC相关配置
@Configuration
public class WebMvcConfg implements WebMvcConfigurer {

	@Override
	public void addArgumentResolvers(List<HandlerMethodArgumentResolver> argumentResolvers) {
		argumentResolvers.add(new ReaderHandlerMethodArgumentResolver());
	}

	//直接将/login转发到login.html模板去渲染
	@Override
	public void addViewControllers(ViewControllerRegistry registry) {
		registry.addViewController("/login").setViewName("login");
	}
}
```

### 8、SpringSecurity工作流程

#### （1）相关概念

* 认证（登录过程）
    * 通过用户名/密码或者其他形式识别该用户是谁
* 授权（权限检查）
    * 必须先通过认证过程
    * 检查该用户是否具有访问该资源/该操作的权限

#### （2）本例中的认证和流程

* 用户访问自己借阅的书籍显然需要 `认证` （登录）
* 登录之后要判断该用户是否有权限查看这些信息所以需要`授权`（比如说不能访问管理员才能访问的资源）

#### （3）执行过程

* 用户访问 `/ GET` 想要获取自己借阅的书籍
* 后台发现该用户未登录
    * 根据 `SecurityConfig` 配置跳转到配置的登录页面
    * 用户输入用户名密码
        * 错误跳转到 `SecurityConfig` 配置的错误页面
        * 正确重定向到 `/ GET`
* 后台发现该用户已登录
    * 验证用户是否具有访问该资源的权限（在本例中：是否具有`READER`角色）
        * 有则放行
        * 无则返回403

### 9、其他相关坑

#### （1）权限和角色

在覆写UserDetails的UserDetails方法时。要注意若是角色，加`ROLE_`前缀

```java
	@Override
	public Collection<? extends GrantedAuthority> getAuthorities() {
		return Arrays.asList(new SimpleGrantedAuthority("ROLE_READER"));
	}
```

此时在WebSecurityConfigurerAdapter中配置`hasRole("READER")`才能生效

```java
	@Override
	protected void configure(HttpSecurity http) throws Exception {
		http
			.authorizeRequests() //
				.antMatchers("/").hasRole("READER")
				//...
	}
```

#### （2）`.loginPage("/login")`方法

这个`/login`必须是在SpringMVC中的一个URL，不能仅仅是模板或者外部URL。实现方式

* 写一个`Controller`渲染模板
* 在`WebMvcConfigurer`中配置

```java
	@Override
	public void addViewControllers(ViewControllerRegistry registry) {
		registry.addViewController("/login").setViewName("login");
	}
```

#### （3）关于SpringBoot自动配置MVC的覆盖问题

**在Spring4.x系列**

* @EnableWebMvc+extends WebMvcConfigurationAdapter，在扩展的类中重写父类的方法即可，这种方式会屏蔽springboot的@EnableAutoConfiguration中的设置
* extends WebMvcConfigurationSupport，在扩展的类中重写父类的方法即可，这种方式会屏蔽springboot的@EnableAutoConfiguration中的设置
* extends WebMvcConfigurationAdapter，在扩展的类中重写父类的方法即可，这种方式依旧使用springboot的@EnableAutoConfiguration中的设置

**在Spring5.x系列**
因为全面启用了Java8的默认接口方法，WebMvcConfigurationAdapter被废弃。所以直接实现WebMvcConfigurer方法并覆写先关方法即可

## 二、JavaConfig

***

### 0、JavaConfig通用方式

```java
@EnableWebSecurity
public class WebSecurityConfig extends WebSecurityConfigurerAdapter {

	//配置主要URL（那些URL需要认证？需要什么权限？通过什么方式认证-form表单其他？）
	@Override
	protected void configure(HttpSecurity http) throws Exception {
		super.configure(http);
	}


	//配置AuthenticationManager（如何进行认证？如何获取用户信息？）
	@Override
	protected void configure(AuthenticationManagerBuilder auth) throws Exception {
		auth
			.inMemoryAuthentication()
				.passwordEncoder(NoOpPasswordEncoder.getInstance())
					.withUser("user")
					.password("password")
					.roles("USER");
	}


	//覆盖默认的Bean userDetailsService 时使用
	//同时放入bean容器，测试时会用到
	@Bean
	public UserDetailsService userDetailsService() {
		// ensure the passwords are encoded properly
		UserBuilder users = User.withDefaultPasswordEncoder();
		InMemoryUserDetailsManager manager = new InMemoryUserDetailsManager();
		manager.createUser(users.username("user").password("password").roles("USER").build());
		manager.createUser(users.username("admin").password("password").roles("USER","ADMIN").build());
		return manager;
	}

}
```

### 1、展示示例

```java
@EnableWebSecurity
public class WebSecurityConfig extends WebSecurityConfigurerAdapter {
//=======HelloWorld级别的java配置======
	@Bean
	public UserDetailsService userDetailsService() {
		InMemoryUserDetailsManager manager = new InMemoryUserDetailsManager();
		manager.createUser(
				User.withDefaultPasswordEncoder() //仅供演示使用，生产环境不安全
						.username("user")
						.password("password")
						.roles("USER").build());
		return manager;
	}
}
```

实现的功能：

* 在你的应用程序中对每个URL进行验证
* 为你生成一个登陆表单
* 允许使用用户名 Username user 和密码 Password password 使用验证表单进行验证。
* 允许用户登出
* 其他参见文档

### 2、HttpSecurity

在上例中我们没有对URL进行相关配置，就能生效的原因是`WebSecurityConfigurerAdapter`默认实现了以下方法

```java
	@Override
	protected void configure(HttpSecurity http) throws Exception {
		http
			.authorizeRequests() //配置需要验证的Url
				.anyRequest().authenticated() //所有Url，通过认证即可访问（不需权限检测）
				.and() //相当于xml标签的关闭
			.formLogin() //基于表单验证（没有其他配置表示默认实现）
				.and()
			.httpBasic(); //允许用户使用http协议
	}
```

#### （1）配置登录表单

```java
	//自定义登录表单
	protected void configure(HttpSecurity http) throws Exception {
		http
			.authorizeRequests()
				.anyRequest().authenticated()
				.and()
			.formLogin()
				.loginPage("/login")
				.permitAll();
	}
```

* post参数的登录名参数必须被命名为username
* post参数的密码参数必须被命名为password

#### （2）针对URL自定义访问控制

```java
	//自定义拦截请求
	protected void configure(HttpSecurity http) throws Exception {
		http
			.authorizeRequests()
				.antMatchers("/resources/**", "/signup", "/about").permitAll() //这几个页面不需要验证
				.antMatchers("/admin/**").hasRole("ADMIN")  //ADMIN角色才能访问
				.antMatchers("/db/**").access("hasRole('ADMIN') and hasRole('DBA')") //必须同时具有ADMIN和DBA角色才能访问
				.anyRequest().authenticated() //其他页面验证通过才能访问
				.and()
			// ...
			.formLogin();
	}
```

#### （3）处理登出

当使用WebSecurityConfigurerAdapter, 注销功能会自动应用。默认是访问URL`/logout`将注销登陆的用户：

* 使HTTP Session 无效
* 清楚所有已经配置的 RememberMe 认证
* 清除SecurityContextHolder
* 跳转到 /login?logout

```java
	//注销配置
	protected void configure(HttpSecurity http) throws Exception {
		LogoutHandler logoutHandler = new CookieClearingLogoutHandler("mycookieKey");
		LogoutSuccessHandler logoutSuccessHandler = new SimpleUrlLogoutSuccessHandler();
		http
			.logout() //配置登出
				.logoutUrl("/my/logout") //登出Url
				.logoutSuccessUrl("/my/index") //登出成功跳转的URL
				.logoutSuccessHandler(logoutSuccessHandler) //让你设置定制的 LogoutSuccessHandler。如果指定了这个选项那么logoutSuccessUrl()的设置会被忽略
				.invalidateHttpSession(true) //指定是否在注销时让HttpSession无效。 默认设置为 true。
				.addLogoutHandler(logoutHandler) //添加一个LogoutHandler.默认SecurityContextLogoutHandler会被添加为最后一个LogoutHandler。
				.deleteCookies("myCookiesKey")  //允许指定在注销成功时将移除的cookie
				.and()
				// ...
			.formLogin();
	}
```

**LogoutHandler**

一般来说，LogoutHandler的实现类可以参阅到注销处理中。他们被用来执行必要的清理，因而他们不应该抛出错误，Spring提供的实现

* PersistentTokenBasedRememberMeServices
* TokenBasedRememberMeServices
* CookieClearingLogoutHandler
* CsrfLogoutHandler
* SecurityContextLogoutHandler

**LogoutSuccessHandler**

LogoutSuccessHandler被LogoutFilter在成功注销后调用，用来进行重定向或者转发相应的目的地。注意这个借口与LogoutHandler几乎一样，但是可以抛出异常。

下面是提供的一些实现：

* SimpleUrlLogoutSuccessHandler
* HttpStatusReturningLogoutSuccessHandler

### 3、WebFlux Security

略

### 4、验证

#### （1）内存验证

```java
@Bean
public UserDetailsService userDetailsService() throws Exception {
	// ensure the passwords are encoded properly
	UserBuilder users = User.withDefaultPasswordEncoder();
	InMemoryUserDetailsManager manager = new InMemoryUserDetailsManager();
	manager.createUser(users.username("user").password("password").roles("USER").build());
	manager.createUser(users.username("admin").password("password").roles("USER","ADMIN").build());
	return manager;
}
```

#### （2）JDBC验证

```java
	//JDBC验证
	@Autowired
	private DataSource dataSource;

	@Autowired
	public void configureGlobal(AuthenticationManagerBuilder auth) throws Exception {
		// ensure the passwords are encoded properly
		UserBuilder users = User.withDefaultPasswordEncoder();
		auth
			.jdbcAuthentication()
				.dataSource(dataSource)
				.withDefaultSchema()
				.withUser(users.username("user").password("password").roles("USER"))
				.withUser(users.username("admin").password("password").roles("USER","ADMIN"));
	}
```

#### （3）LDAP 验证

略

#### （4）AuthenticationProvider

可以通过一个自定义的AuthenticationProvider为bean定义自定义身份验证。

```java
	@Bean
	public AuthenticationProvider springAuthenticationProvider() {
		return new AuthenticationProvider() {
			@Override
		    public Authentication authenticate(Authentication authentication) throws AuthenticationException {
		        UsernamePasswordAuthenticationToken token = (UsernamePasswordAuthenticationToken) authentication;
		        String username = token.getName();
		        //从数据库找到的用户
		        UserDetails userDetails = null;
		        if(username != null) {
		            userDetails = userDetailsService.loadUserByUsername(username);
		        }
		        //一下认证不通过
		        if(userDetails == null) {
		            throw new UsernameNotFoundException("用户名/密码无效");
		        }else if (!userDetails.isEnabled()){
		            throw new DisabledException("用户已被禁用");
		        }else if (!userDetails.isAccountNonExpired()) {
		            throw new AccountExpiredException("账号已过期");
		        }else if (!userDetails.isAccountNonLocked()) {
		            throw new LockedException("账号已被锁定");
		        }else if (!userDetails.isCredentialsNonExpired()) {
		            throw new LockedException("凭证已过期");
		        }
		        //数据库用户的密码
		        String password = userDetails.getPassword();
		        //与authentication里面的credentials相比较
		        if(!password.equals(token.getCredentials())) {
		            throw new BadCredentialsException("Invalid username/password");
		        }
		        //授权
		        return new UsernamePasswordAuthenticationToken(userDetails, password,userDetails.getAuthorities());
		    }
			@Override
		    public boolean supports(Class<?> authentication) {
		        //返回true后才会执行上面的authenticate方法,这步能确保authentication能正确转换类型
		        return UsernamePasswordAuthenticationToken.class.equals(authentication);
		    }

		};
	}
```

#### （5）UserDetailsService

使用自定义UserDetailsService实现，为了方面，要将自定义的UserDetailsService放入Bean容器，并显式的注册

### 5、OAuth 2.0登录

参见文档

### 6、RememberMe

更多配置请键入`.`

```java
	@Override
	protected void configure(HttpSecurity http) throws Exception {
		http.rememberMe();
		super.configure(http);
	}
```

## 三、实现逻辑和核心接口核心类

### 1、执行路径

#### （1）认证过程

* 用户使用用户名和密码进行登录。
* Spring Security将获取到的用户名和密码封装成一个实现了Authentication接口的UsernamePasswordAuthenticationToken。
* 将上述产生的token对象传递给AuthenticationManager进行登录认证。
* AuthenticationManager会一次调用注册的AuthenticationProvider进行验证
* 默认情况下AuthenticationProvider会调用PasswordEncoder验证密码
* 认证成功后将会返回一个封装了用户权限等信息的Authentication对象。
* 通过调用SecurityContextHolder.getContext().setAuthentication(...)将AuthenticationManager返回的Authentication对象赋予给当前的SecurityContext。

#### （2）鉴权过程

略

### 2、核心类概述

#### （1） SecurityContextHolder

* SecurityContextHolder是用来保存SecurityContext的
* SecurityContext中含有当前正在访问系统的用户的详细信息
* 通过SecurityContextHolder一系列静态方法可以获取到当前用户的信息

```java
  public String getCurrentUsername() {
      Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
      if (principal instanceof UserDetails) {
         return ((UserDetails) principal).getUsername();
      }
      if (principal instanceof Principal) {
         return ((Principal) principal).getName();
      }
      return String.valueOf(principal);
   }

	public String getCurrentUsername() {
		return SecurityContextHolder.getContext().getAuthentication().getName();
	}
```

### 3、核心接口概述

#### （1）Authentication

Authentication是一个接口，用来表示用户认证信息的，在用户登录认证之前相关信息会封装为一个Authentication具体实现类的对象，在登录认证成功之后又会生成一个信息更全面，包含用户权限等信息的Authentication对象，然后把它保存在SecurityContextHolder所持有的SecurityContext中，供后续的程序进行调用，如访问权限的鉴定等。

#### （2） AuthenticationManager

AuthenticationManager是一个用来处理认证（Authentication）请求的接口。在其中只定义了一个方法authenticate()

```java
Authentication authenticate(Authentication authentication) throws AuthenticationException;
```

* 在Spring Security中，AuthenticationManager的默认实现是`ProviderManager`，
* 而且它不直接自己处理认证请求，而是委托给其所配置的AuthenticationProvider列表，然后会依次使用每一个AuthenticationProvider进行认证，
* 如果有一个AuthenticationProvider认证后的结果不为null，则表示该AuthenticationProvider已经认证成功，之后的AuthenticationProvider将不再继续认证。
* 如果所有的AuthenticationProvider的认证结果都为null，则表示认证失败，将抛出一个ProviderNotFoundException。

#### （3）AuthenticationProvider

包含两个方法

```java
Authentication authenticate(Authentication authentication) throws AuthenticationException;
boolean supports(Class<?> authentication);
```

* 执行具体的认证逻辑，由AuthenticationManager的authenticate调用
* 内部实现类为 DaoAuthenticationProvider 具体逻辑为
    * 校验认证请求最常用的方法是根据请求的用户名加载对应的UserDetails，然后比对UserDetails的密码与认证请求的密码是否一致，一致则表示认证通过

#### （4）UserDetailsService

包含一个方法：根据用户名获取UserDetails

```java
UserDetails loadUserByUsername(String username) throws UsernameNotFoundException;
```

* 内部实现类为：
    * `JdbcDaoImpl` 通过Jdbc获取
    * `InMemoryDaoImpl` 简单从内存配置中获取

#### （5）UserDetails

包含如下方法：获取用户认证需要的信息

```java
	Collection<? extends GrantedAuthority> getAuthorities();
	String getPassword();
	String getUsername();
	boolean isAccountNonExpired();
	boolean isAccountNonLocked();
	boolean isCredentialsNonExpired();
	boolean isEnabled();
```

* 内部实现类为：User

#### （6）PasswordEncoder

用于对密码进行加密和验证

```Java
	String encode(CharSequence rawPassword);
	boolean matches(CharSequence rawPassword, String encodedPassword);
```

#### （7）GrantedAuthority

用户权限信息获取

```java
	String getAuthority();
```

* 内部实现：SimpleGrantedAuthority

### 4、内部提供的常用的类和工具

#### （1）JdbcDaoImpl

JdbcDaoImpl允许我们从数据库来加载UserDetails，其底层使用的是Spring的JdbcTemplate进行操作，所以我们需要给其指定一个数据源。此外，我们需要通过usersByUsernameQuery属性指定通过username查询用户信息的SQL语句；通过authoritiesByUsernameQuery属性指定通过username查询用户所拥有的权限的SQL语句；如果我们通过设置JdbcDaoImpl的enableGroups为true启用了用户组权限的支持，则我们还需要通过groupAuthoritiesByUsernameQuery属性指定根据username查询用户组权限的SQL语句。当这些信息都没有指定时，将使用默认的SQL语句，默认的SQL语句如下所示。

```sql
select username, password, enabled from users where username=? --根据username查询用户信息
select username, authority from authorities where username=? --根据username查询用户权限信息
select g.id, g.group_name, ga.authority from groups g, groups_members gm, groups_authorities ga where gm.username=? and g.id=ga.group_id and g.id=gm.group_id --根据username查询用户组权限
```

建表语句

```sql
create table users(
      username varchar_ignorecase(50) not null primary key,
      password varchar_ignorecase(50) not null,
      enabled boolean not null);

create table authorities (
      username varchar_ignorecase(50) not null,
      authority varchar_ignorecase(50) not null,
      constraint fk_authorities_users foreign key(username) references users(username));

create unique index ix_auth_username on authorities (username,authority);

create table groups (
  id bigint generated by default as identity(start with 0) primary key,
  group_name varchar_ignorecase(50) notnull);

create table group_authorities (
  group_id bigint notnull,
  authority varchar(50) notnull,
  constraint fk_group_authorities_group foreign key(group_id) references groups(id));

create table group_members (
  id bigint generated by default as identity(start with 0) primary key,
  username varchar(50) notnull,
  group_id bigint notnull,
  constraint fk_group_members_group foreign key(group_id) references groups(id));
```

#### （2）InMemoryUserDetailsManager

测试用

* （3.x为）InMemoryDaoImpl

#### （3）SimpleGrantedAuthority

设置用户的权限信息：当表示一个角色的时候要加`ROLE_`前缀

```java
//实现UserDetails的getAuthorities方法时使用
	@Override
	public Collection<? extends GrantedAuthority> getAuthorities() {
		return Arrays.asList(new SimpleGrantedAuthority("ROLE_READER"));
	}
```

## 四、SpringSecurity测试

***

> [文档](https://docs.spring.io/spring-security/site/docs/current/reference/html/test-method.html)

### 1、依赖

```xml
		<dependency>
			<groupId>org.springframework.security</groupId>
			<artifactId>spring-security-test</artifactId>
			<scope>test</scope>
		</dependency>
```

### 2、@WithMockUser

#### （1）注解位置

测试类、测试方法

#### （2）功能

通过创建简单的UserDetails对象（Spring内部的User），来通过验证，但是忽略了真正的类型，在需要自定义UserDetails色时候不能使用

#### （3）使用示例

```java
//方法上
@Test
@WithMockUser(username = "root", password = "root", roles = "READER")
public void homePage_authenticatedUser() throws Exception {
	mockMvc.perform(get("/")).andExpect(status().isOk());
}


//类上
@RunWith(SpringRunner.class)
@SpringBootTest
@AutoConfigureMockMvc
@WithMockUser(username="admin",roles={"USER","ADMIN"})
public class WithMockUserTests {
}
```

### 3、@WithUserDetails

#### （1）注解位置

测试类、测试方法

#### （2）功能

* 通过提供的用户名，从UserDetailsService中查询UserDetails对象，进行验证
* 必须自定义或者显式的注册名为userDetailsService的bean

```java
	//这种方式使用 @WithUserDetails 会发生找不到用户的情况
	@Override
	protected void configure(AuthenticationManagerBuilder auth) throws Exception {
		auth
			.inMemoryAuthentication()
				.passwordEncoder(NoOpPasswordEncoder.getInstance())
					.withUser("root")
					.password("password")
					.roles("USER");
	}


	//这种方式 可以使用 @WithUserDetails
	@Bean
	public UserDetailsService userDetailsService() {
		// ensure the passwords are encoded properly
		UserBuilder users = User.withDefaultPasswordEncoder();
		InMemoryUserDetailsManager manager = new InMemoryUserDetailsManager();
		manager.createUser(users.username("root").password("password").roles("USER").build());
		manager.createUser(users.username("admin").password("password").roles("USER","ADMIN").build());
		return manager;
	}
```

#### （3）使用示例

```java
	@Test
	@WithUserDetails("root")
	public void homePage_authenticatedUser1() throws Exception {
		mockMvc.perform(get("/")
				).andExpect(status().isOk());
	}

```

### 4、自定义测试注解

```java
@Retention(RetentionPolicy.RUNTIME)
@WithMockUser(value="rob",roles="ADMIN")
public @interface WithMockAdmin { }
```

## 五、源码阅读

> 2020-05-17 更新

一般情况，通过以上的简单配置即可满足大部分需求，但是面对某些特殊场景，需要更加熟悉 SpringSecurity 的原理才能更好的定制化的进行认证和鉴权

### 1、底层协议

Spring Security 是一个通用的安全框架，落实到 Web 开发方面

回归到最底层的协议和标准，是标准的 Servlet 标准（所谓的Java EE）（与之类似 Python 有 WSGI）

自然而然，Spring Security Web 底层实现是依托于 `javax.servlet.Filter`

Spring Security Web对认证和鉴权预定义了一条 `Filter` 链，这个链条 有一系列 内置的 Filter 实现，具体可以参见 https://docs.spring.io/spring-security/site/docs/current/reference/html5/#ns-custom-filters

这里有个图（转载自 https://blog.csdn.net/u012702547/article/details/89629415）

![Spring-Security-Filter](/image/spring-security-filter.png)

### 2、推荐阅读的源码

通过阅读源码可以理解整个流程，

* 登录相关（有特殊登录需求，通过模仿如下实现即可实现自己的功能）
    * Filter `org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter`
    * Authentication `org.springframework.security.authentication.UsernamePasswordAuthenticationToken`
    * AuthenticationManager （一般不用重写） `org.springframework.security.authentication.ProviderManager`
    * AuthenticationProvider `org.springframework.security.authentication.DaoAuthenticationProvider`
    * AuthenticationSuccessHandler `org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler` 登录成功后做的事情
    * 继承 `AbstractAuthenticationProcessingFilter` 创建对象时注意事项
        * 需要实现 Remember Me 功能，需要 手动配置 `RememberMeServices` 对象
        * 登录成功处理，需要 手动配置 `AuthenticationSuccessHandler`
        * 需要手动配置 `AuthenticationManager`
    * 自定义例子可以参考 https://www.jianshu.com/p/779d3071e98d
* Remember Me 相关
    * Filter `org.springframework.security.web.authentication.rememberme.RememberMeAuthenticationFilter` 不建议覆写
    * Authentication `org.springframework.security.authentication.RememberMeAuthenticationProvider` 不建议覆写
    * AuthenticationProvider `org.springframework.security.authentication.RememberMeAuthenticationProvider` 不建议覆写
    * RememberMeServices `org.springframework.security.web.authentication.rememberme.TokenBasedRememberMeServices`，特殊需求建议覆写，覆写方式为
        * 实现 `RememberMeServices`
        * 代理 `TokenBasedRememberMeServices` 添加自己想要的功能
        * `loginSuccess` 为 登录 成功后调用设置 cookie 用的
    * 自定义 `RememberMeServices` 注意事项
        * 配置时，一定要指定 `key` 否则会用 uuid 导致不一致，创建自定义的Service 和 `.rememberMe().rememberMeServices(rememberMeServices).key("test")` 都需要
    * Remember Me 原理可以参考 https://blog.csdn.net/qq_37142346/article/details/801146参考
* 其他接口
    * UserDetails 一般继承 `org.springframework.security.core.userdetail.User` 实现自己的 User，一般通过 `Authentication#getPrincipal` 获取
    * UserDetailsService 与用户数据源交互，核心方法为通过 `username` 获取 `UserDetails`
    * AuthenticationEntryPoint 一般用于跳转到登录页面
    * 常用的 AuthenticationException，查看 `AuthenticationException` 抽象类利用 IDE 的查看实现功能查看

## 六、错误处理

* `.exceptionHandling().accessDeniedHandler()` 自定义处理器似乎无效 参考 https://stackoverflow.com/questions/48306302/spring-security-creating-403-access-denied-custom-response
* `.exceptionHandling().authenticationEntryPoint()` 似乎可以实现 https://howtodoinjava.com/spring-restful/access-denied-json-response/

建议通过 `.authorizeRequests().antMatchers("/error").permitAll()` 然后在 Spring MVC 中实现

```java
import xxx.xxx.xx.xxx.controller;

import javax.servlet.RequestDispatcher;
import javax.servlet.http.HttpServletRequest;

import org.springframework.boot.web.servlet.error.ErrorController;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import xxx.xxx.xx.xxx.dto.ResponseDTO;

@RestController
public class BasicStatusCodeErrorController implements ErrorController {

    @RequestMapping("/error")
    public ResponseDTO<?> handleError(HttpServletRequest request) {
        Object status = request.getAttribute(RequestDispatcher.ERROR_STATUS_CODE);
        Object message = request.getAttribute(RequestDispatcher.ERROR_MESSAGE);
        if (message == null){
            message = "Unknown Basic Error";
        }

        if (status != null) {
            Integer statusCode = Integer.valueOf(status.toString());

            return ResponseDTO.failure(statusCode, message.toString());
        }
        return ResponseDTO.failure(500, "Internal Server Error");
    }

    @Override
    public String getErrorPath() {
        return "/error";
    }
}
```
