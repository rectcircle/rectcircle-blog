---
title: "Spring Transaction常见问题处理"
date: 2019-09-10T18:58:41+08:00
draft: false
toc: true
comments: true
tags:
  - Java
---


[https://blog.csdn.net/gm371200587/article/details/79869449](https://blog.csdn.net/gm371200587/article/details/79869449)
[https://www.cnblogs.com/sweetchildomine/p/6978037.html](https://www.cnblogs.com/sweetchildomine/p/6978037.html)
[https://stackoverflow.com/questions/23132822/what-is-the-difference-between-defining-transactional-on-class-vs-method](https://stackoverflow.com/questions/23132822/what-is-the-difference-between-defining-transactional-on-class-vs-method)
[https://www.ibm.com/developerworks/cn/java/j-master-spring-transactional-use/index.html](https://www.ibm.com/developerworks/cn/java/j-master-spring-transactional-use/index.html)

## 同一个Service内部方法调用

一般Spring Boot对于事务的控制通过 `@Transactional` 进行控制，在启动过程中，Spring会通过动态代理一个 `Service` 的代理类。给所有有 `@Transactional` 注解的方法切入事务管理器的相关逻辑。在所有通过 `@Autowired` 注入的 `Service` 都是 代理类。

对于如下代码：

```java
@Service
public class EventServiceImpl implements EventService {
    @Override
//    @Transactional
    public void methodA() {
        this.methodB();
        Event event = new Event();
        event.setName("test");
        eventRepository.save(event);
        eventRepository.flush();
    }

    @Override
    @Transactional(readOnly = true)
    public void methodB() {
        List<Event> events = eventRepository.findAll();
        events.stream().forEach(event -> System.out.println(event.getName()));
        Event event = new Event();
        event.setName("test2");
        eventRepository.save(event);
        eventRepository.flush();
    }
}
```

在 `Controller` 中调用 `methodA` 将不会抛出异常，说明 `@Transactional(readOnly = true)` 无效

### 解决方案

方案1：使用 AspectJ，在编译期将代理注入class类，而不是生成代理类。[参考](https://www.ibm.com/developerworks/cn/java/j-master-spring-transactional-use/index.html)

方案2：使用 Spring 默认 AOP实现，将自己注入自己作为一个属性叫做 `self` ，所有调用自身的方法都是用 `self` 而不是 `this`

```java
@Service
public class EventServiceImpl implements EventService {

    @Autowired
    private EventServiceImpl self;

    @Override
//    @Transactional
    public void methodA() {
        this.methodB();
        Event event = new Event();
        event.setName("test");
        self.eventRepository.save(event);
        eventRepository.flush();
    }

    @Override
    @Transactional(readOnly = true)
    public void methodB() {
        List<Event> events = eventRepository.findAll();
        events.stream().forEach(event -> System.out.println(event.getName()));
        Event event = new Event();
        event.setName("test2");
        eventRepository.save(event);
        eventRepository.flush();
    }
}
```
