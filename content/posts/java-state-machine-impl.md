---
title: "Java 有限状态机实现"
date: 2020-07-19T15:33:26+08:00
draft: false
toc: true
comments: true
tags:
  - java
---

实验代码：https://github.com/rectcircle/state-machine-learn

## 介绍

有限自动机 (finite-state machine, FSM)，是一种数学概念，表示的是状态的转换。

在编程领域，当涉及多种状态的转换的场景，均可以使用 FSM 模型加以实现。

FSM 的核心就是 状态转换，即：

```
State(S) x Event(E) -> Actions (A), State(S')
```

简单来说：如果我们当前处于状态S，发生了类型为T的E事件, 我们应执行操作A，然后将状态转换为S'

如果才采用转换表来实现为，则转换表的每条记录为：`<S, T, Transition:(O, E) -> S' >`

* S 为 当前状态
* T 为 某种事件类型
* `Transition` 为 转换函数
    * 参数为
        * `O` 上下文
        * `E` 事件对象
    * 返回值 `S'` 为 新的状态

## 核心抽象

* Event 事件，状态如何转换取决于事件，一般 Event 包含 EventType 字段
* State 状态，状态机的状态
* Operand (Context) 状态机上下文，存放一些共享数据
* Transform 转换器，一个函数，`(Operand, Event) -> NewState`
* StateMachine 状态，封装了上述对象和函数

## Java 实现

### 新建 Maven 项目

```bash
mvn org.apache.maven.plugins:maven-archetype-plugin:3.1.2:generate -DarchetypeArtifactId="maven-archetype-quickstart" -DarchetypeGroupId="org.apache.maven.archetypes" -DarchetypeVersion="1.4"
```

### 核心接口

`src/main/java/cn/rectcircle/learn/state/Transition.java`

```java
package cn.rectcircle.learn.state;

/**
 * Hook for Transition. Post state is decided by Transition hook. Post state
 * must be one of the valid post states registered in StateMachine.
 * 状态转换的转换器
 *
 * @author
 */
@FunctionalInterface
public interface Transition<O, E, S extends Enum<S>> {
    /**
     * Transition hook.
     * @param operand the entity attached to the FSM, whose internal
     *                state may change.
     * @param event   causal event
     * @return the postState. Post state must be one of the
     *             valid post states registered in StateMachine.
     */
    S transition(O operand, E event);
}
```

`src/main/java/cn/rectcircle/learn/state/StateMachine.java`

```java

package cn.rectcircle.learn.state;

/**
 * FSM 状态机接口
 *
 * @param <S> 状态枚举类型
 * @param <T> 事件类型
 * @param <E> 事件
 * @author
 */
public interface StateMachine<S extends Enum<S>, T extends Enum<T>, E> {

    /**
     * 获取状态机的当前状态
     * @return
     */
    S getCurrentState();

    /**
     * 做一次状态转换
     * @param eventType
     * @param event
     * @return
     */
    S doTransition(T eventType, E event);
}
```

### 核心实现

`src/main/java/cn/rectcircle/learn/state/StateMachineFactory.java`

```java
package cn.rectcircle.learn.state;

import java.util.HashMap;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

/**
 * FSM 工厂
 *
 * @param <O> O operand 操作数类型
 * @param <S> S 状态机状态枚举类型
 * @param <T> T 事件类型
 * @param <E> E 事件
 * @author
 */
public final class StateMachineFactory<O, S extends Enum<S>, T extends Enum<T>, E> {

    /**
     * 通过当前状态和事件类型获取用户注册的四元组
     * 状态 State(S) + Event(E, EventType(T)) + Operator(O)  -> State(S)'
     */
    private final Map<S, Map<T, Transition<O, E, S>>> transitionMachineTable = new HashMap<>();

    public StateMachineFactory<O, S, T, E> addTransition(S preState, S postState, T eventType,
            Transition<O, E, S> hook) {
        var transitionMap = transitionMachineTable.computeIfAbsent(preState,k -> new HashMap<>(8));
        transitionMap.put(eventType, (o, e) -> {
            S r = hook.transition(o, e);
            if (Objects.equals(r, postState)) {
                return postState;
            }
            throw new RuntimeException("Invalid event: " + e + " at " + preState);
        });
        return this;
    }

    public StateMachineFactory<O, S, T, E> addTransition(S preState, Set<S> postStates, T eventType,
                                                      Transition<O, E, S> hook) {
        var transitionMap = transitionMachineTable.computeIfAbsent(preState, k -> new HashMap<>(8));
        transitionMap.put(eventType, (o, e) -> {
            S r = hook.transition(o, e);
            if (postStates.contains(r)) {
                return r;
            }
            throw new RuntimeException("Invalid event: " + e + " at " + preState);
        });
        return this;
    }

    public StateMachine<S, T, E> make(O operand, S initialState) {
        return new InternalStateMachine(operand, initialState);
    }

    /**
     * 真正的状态机，一个状态机维护一个对象 operand 和该对象的状态
     * 状态转换规则使用 {@link StateMachineFactory} 中的 {@link #transitionMachineTable}
     */
    private class InternalStateMachine
            implements StateMachine<S, T, E> {
        private final O operand;
        private S currentState;

        InternalStateMachine(O operand, S initialState) {
            this.operand = operand;
            this.currentState = initialState;
        }

        @Override
        public synchronized S getCurrentState() {
            return currentState;
        }

        @Override
        public synchronized S doTransition(T eventType, E event) {
            var transitionMap = transitionMachineTable.get(currentState);
            if (transitionMap != null) {
                var transition = transitionMap.get(eventType);
                if (transition != null) {
                    currentState = transition.transition(operand, event);
                    return currentState;
                }
            }
            throw new RuntimeException("Invalid event: " + event + " at " + currentState);
        }
    }
}
```

## 测试

模拟 Java 线程状态转换

`src/main/java/cn/rectcircle/learn/use/MyThreadEventType.java`

```java
package cn.rectcircle.learn.use;

/**
 * @author rectcircle
 */
public enum MyThreadEventType {
    /** 调用了 Start 方法 */
    CallStart,
    /** 获得CPU */
    ObtainCPU,
    /** 调用了 Runnable.run 方法返回 */
    RunReturn,
    /** 等待锁 */
    WaitingLock,
    /** 获得锁 */
    ObtainLock,
    /** Object.wait 或者 等待 IO */
    CallObjectWaitOrWaitIO,
    /** Object.notify 或者 IO 就绪 */
    CallObjectNotifyOrIOReady,
    /** 调用带有超时状态的方法 */
    CallWithTimeout,
    /** 带有超时状态的方法超时或者返回 */
    TimeoutOrReturn,
    /** 调用中断命令 */
    CallInterrupt,
    ;
}
```

`src/main/java/cn/rectcircle/learn/use/MyThreadEvent.java`

```java
package cn.rectcircle.learn.use;

/**
 * @author rectcircle
 */
public class MyThreadEvent {
    private MyThreadEventType type;

    public MyThreadEvent(MyThreadEventType type) {
        this.setType(type);
    }

    public MyThreadEventType getType() {
        return type;
    }

    public void setType(MyThreadEventType type) {
        this.type = type;
    }

    @Override
    public String toString() {
        return "MyThreadEvent [type=" + type + "]";
    }
}
```

`src/main/java/cn/rectcircle/learn/use/MyThreadState.java`

```java
package cn.rectcircle.learn.use;

/**
 * @author rectcircle
 */
public enum MyThreadState {
    /** 尚未启动的线程的线程状态。 */
    NEW,
    /** 可运行线程的线程状态，等待CPU调度。 */
    RUNNABLE,
    /** Java没有，为了方便演示添加 */
    RUNNING,
    /** 可运行线程的线程状态，等待CPU调度。等待锁或者IO */
    BLOCKED,
    /** 线程阻塞等待监视器锁定的线程状态。{@link Object#wait() Object.wait}. */
    WAITING,
    /** 线程阻塞等待监视器锁定的线程状态。
     * <ul>
     *   <li>{@link #sleep Thread.sleep}</li>
     *   <li>{@link Object#wait(long) Object.wait} with timeout</li>
     *   <li>{@link #join(long) Thread.join} with timeout</li>
     *   <li>{@link LockSupport#parkNanos LockSupport.parkNanos}</li>
     *   <li>{@link LockSupport#parkUntil LockSupport.parkUntil}</li>
     * </ul>
     */
    TIMED_WAITING,
    /** 终止线程的线程状态。线程正常完成执行或者出现异常。 */
    TERMINATED;
}
```

`src/main/java/cn/rectcircle/learn/use/MyThreadContext.java`

```java
package cn.rectcircle.learn.use;

/**
 * @author rectcircle
 */
public class MyThreadContext {

}
```

`src/main/java/cn/rectcircle/learn/Main.java`

```java
package cn.rectcircle.learn;

import cn.rectcircle.learn.state.StateMachine;
import cn.rectcircle.learn.state.StateMachineFactory;
import cn.rectcircle.learn.use.MyThreadContext;
import cn.rectcircle.learn.use.MyThreadEvent;
import cn.rectcircle.learn.use.MyThreadEventType;
import cn.rectcircle.learn.use.MyThreadState;

/**
 * @author rectcircle
 */
public class Main {

    @SuppressWarnings("PMD.MethodTooLongRule")
    public static void main(String[] args) {
        // 模拟线程状态转换
        // https://juejin.im/post/5d8313b6518825313a7bba1e

        var stateMachineFactory = new StateMachineFactory<MyThreadContext, MyThreadState, MyThreadEventType, MyThreadEvent>();
        // NEW -> RUNNABLE
        stateMachineFactory.addTransition(MyThreadState.NEW, MyThreadState.RUNNABLE, MyThreadEventType.CallStart, (o, e) -> {
            System.out.println("NEW -> RUNNABLE by event: " + e);
            return MyThreadState.RUNNABLE;
        });
        // RUNNABLE -> RUNNING
        stateMachineFactory.addTransition(MyThreadState.RUNNABLE, MyThreadState.RUNNING, MyThreadEventType.ObtainCPU, (o, e) -> {
            System.out.println("RUNNABLE -> RUNNING by event: " + e);
            return MyThreadState.RUNNING;
        });
        // RUNNING -> BLOCKED | WAITING | TIMED_WAITING | TERMINATED
        stateMachineFactory.addTransition(MyThreadState.RUNNING, MyThreadState.BLOCKED, MyThreadEventType.WaitingLock, (o, e) -> {
            System.out.println("RUNNING -> BLOCKED by event: " + e);
            return MyThreadState.BLOCKED;
        });
        stateMachineFactory.addTransition(MyThreadState.RUNNING, MyThreadState.WAITING, MyThreadEventType.CallObjectWaitOrWaitIO, (o, e) -> {
            System.out.println("RUNNING -> WAITING by event: " + e);
            return MyThreadState.WAITING;
        });
        stateMachineFactory.addTransition(MyThreadState.RUNNING, MyThreadState.TIMED_WAITING, MyThreadEventType.CallWithTimeout, (o, e) -> {
            System.out.println("RUNNING -> TIMED_WAITING by event: " + e);
            return MyThreadState.TIMED_WAITING;
        });
        stateMachineFactory.addTransition(MyThreadState.RUNNING, MyThreadState.TERMINATED, MyThreadEventType.RunReturn, (o, e) -> {
            System.out.println("RUNNING -> TERMINATED by event: " + e);
            return MyThreadState.TERMINATED;
        });
        // BLOCKED -> RUNNABLE | TERMINATED
        stateMachineFactory.addTransition(MyThreadState.BLOCKED, MyThreadState.RUNNABLE, MyThreadEventType.ObtainLock, (o, e) -> {
            System.out.println("BLOCKED -> RUNNABLE by event: " + e);
            return MyThreadState.RUNNABLE;
        });
        stateMachineFactory.addTransition(MyThreadState.BLOCKED, MyThreadState.TERMINATED, MyThreadEventType.CallInterrupt, (o, e) -> {
            System.out.println("BLOCKED -> TERMINATED by event: " + e);
            return MyThreadState.TERMINATED;
        });
        // WAITING -> RUNNABLE | TERMINATED
        stateMachineFactory.addTransition(MyThreadState.WAITING, MyThreadState.RUNNABLE, MyThreadEventType.CallObjectNotifyOrIOReady, (o, e) -> {
            System.out.println("WAITING -> RUNNABLE by event: " + e);
            return MyThreadState.RUNNABLE;
        });
        stateMachineFactory.addTransition(MyThreadState.WAITING, MyThreadState.TERMINATED, MyThreadEventType.CallInterrupt, (o, e) -> {
            System.out.println("WAITING -> TERMINATED by event: " + e);
            return MyThreadState.TERMINATED;
        });
        // TIMED_WAITING -> RUNNABLE | TERMINATED
        stateMachineFactory.addTransition(MyThreadState.TIMED_WAITING, MyThreadState.RUNNABLE, MyThreadEventType.TimeoutOrReturn, (o, e) -> {
            System.out.println("TIMED_WAITING -> RUNNABLE by event: " + e);
            return MyThreadState.RUNNABLE;
        });
        stateMachineFactory.addTransition(MyThreadState.TIMED_WAITING, MyThreadState.TERMINATED, MyThreadEventType.CallInterrupt, (o, e) -> {
            System.out.println("TIMED_WAITING -> TERMINATED by event: " + e);
            return MyThreadState.TERMINATED;
        });

        StateMachine<MyThreadState, MyThreadEventType, MyThreadEvent> sm = stateMachineFactory.make(new MyThreadContext(), MyThreadState.NEW);

        sm.doTransition(MyThreadEventType.CallStart, new MyThreadEvent(MyThreadEventType.CallStart));
        sm.doTransition(MyThreadEventType.ObtainCPU, new MyThreadEvent(MyThreadEventType.ObtainCPU));
        sm.doTransition(MyThreadEventType.WaitingLock, new MyThreadEvent(MyThreadEventType.WaitingLock));
        sm.doTransition(MyThreadEventType.ObtainLock, new MyThreadEvent(MyThreadEventType.ObtainLock));
        sm.doTransition(MyThreadEventType.ObtainCPU, new MyThreadEvent(MyThreadEventType.ObtainCPU));
        sm.doTransition(MyThreadEventType.CallObjectWaitOrWaitIO, new MyThreadEvent(MyThreadEventType.CallObjectWaitOrWaitIO));
        sm.doTransition(MyThreadEventType.CallObjectNotifyOrIOReady, new MyThreadEvent(MyThreadEventType.CallObjectNotifyOrIOReady));
        sm.doTransition(MyThreadEventType.ObtainCPU, new MyThreadEvent(MyThreadEventType.ObtainCPU));
        sm.doTransition(MyThreadEventType.CallWithTimeout, new MyThreadEvent(MyThreadEventType.CallWithTimeout));
        sm.doTransition(MyThreadEventType.TimeoutOrReturn, new MyThreadEvent(MyThreadEventType.TimeoutOrReturn));
        sm.doTransition(MyThreadEventType.ObtainCPU, new MyThreadEvent(MyThreadEventType.ObtainCPU));
        sm.doTransition(MyThreadEventType.RunReturn, new MyThreadEvent(MyThreadEventType.RunReturn));

    }
}
```

输出

```
NEW -> RUNNABLE by event: MyThreadEvent [type=CallStart]
RUNNABLE -> RUNNING by event: MyThreadEvent [type=ObtainCPU]
RUNNING -> BLOCKED by event: MyThreadEvent [type=WaitingLock]
BLOCKED -> RUNNABLE by event: MyThreadEvent [type=ObtainLock]
RUNNABLE -> RUNNING by event: MyThreadEvent [type=ObtainCPU]
RUNNING -> WAITING by event: MyThreadEvent [type=CallObjectWaitOrWaitIO]
WAITING -> RUNNABLE by event: MyThreadEvent [type=CallObjectNotifyOrIOReady]
RUNNABLE -> RUNNING by event: MyThreadEvent [type=ObtainCPU]
RUNNING -> TIMED_WAITING by event: MyThreadEvent [type=CallWithTimeout]
TIMED_WAITING -> RUNNABLE by event: MyThreadEvent [type=TimeoutOrReturn]
RUNNABLE -> RUNNING by event: MyThreadEvent [type=ObtainCPU]
RUNNING -> TERMINATED by event: MyThreadEvent [type=RunReturn]
```
