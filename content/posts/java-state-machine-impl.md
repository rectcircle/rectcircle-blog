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

简单来说：如果我们当前处于状态S，发生了E事件, 我们应执行操作A，然后将状态转换为S'

## 核心抽象

* Event 事件，状态如何转换取决于事件
* State 状态，状态机的状态
* Operand (Context) 状态机上下文，存放一些共享数据
* Transform 转换器，一个函数，`(Operand, OldState) -> NewState`
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
 * @param <E> 事件类型
 * @author
 */
public interface StateMachine<S extends Enum<S>, E> {

    /**
     * 获取状态机的当前状态
     * @return
     */
    S getCurrentState();

    /**
     * 做一次状态转换
     * @param event
     * @return
     */
    S doTransition(E event);
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
 * @param <E> E 事件类型
 * @author
 */
public final class StateMachineFactory<O, S extends Enum<S>, E> {

    /**
     * 通过当前状态和事件类型获取用户注册的四元组
     */
    private final Map<S, Transition<O, E, S>> transitionMachineTable = new HashMap<>();

    public StateMachineFactory<O, S, E> addTransition(S preState, S postState,
                                                      Transition<O, E, S> hook) {
        transitionMachineTable.put(preState, (o, e) -> {
            S r = hook.transition(o, e);
            if (Objects.equals(r, postState)) {
                return postState;
            }
            throw new RuntimeException("Invalid event: " + e + " at " + preState);
        });
        return this;
    }

    public StateMachineFactory<O, S, E> addTransition(S preState, Set<S> postStates,
                                                      Transition<O, E, S> hook) {
        transitionMachineTable.put(preState, (o, e) -> {
            S r = hook.transition(o, e);
            if (postStates.contains(r)) {
                return r;
            }
            throw new RuntimeException("Invalid event: " + e + " at " + preState);
        });
        return this;
    }

    public StateMachine<S, E> make(O operand, S initialState) {
        return new InternalStateMachine(operand, initialState);
    }

    /**
     * 真正的状态机，一个状态机维护一个对象 operand 和该对象的状态
     * 状态转换规则使用 {@link StateMachineFactory} 中的 {@link #transitionMachineTable}
     */
    private class InternalStateMachine
            implements StateMachine<S, E> {
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
        public synchronized S doTransition(E event) {
            var transition = transitionMachineTable.get(currentState);
            if (transition != null) {
                currentState = transition.transition(operand, event);
                return currentState;
            }
            throw new RuntimeException("Invalid event: " + event + " at " + currentState);
        }
    }
}
```

## 测试

模拟 Java 线程状态转换

`src/main/java/cn/rectcircle/learn/use/MyThreadEvent.java`

```java
package cn.rectcircle.learn.use;

/**
 * @author rectcircle
 */
public enum MyThreadEvent {
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

import java.util.Set;

import cn.rectcircle.learn.state.StateMachine;
import cn.rectcircle.learn.state.StateMachineFactory;
import cn.rectcircle.learn.use.MyThreadContext;
import cn.rectcircle.learn.use.MyThreadEvent;
import cn.rectcircle.learn.use.MyThreadState;

/**
 * @author rectcircle
 */
public class Main {

    @SuppressWarnings("PMD.MethodTooLongRule")
    public static void main(String[] args) {
        // 模拟线程状态转换
        // https://juejin.im/post/5d8313b6518825313a7bba1e

        var stateMachineFactory = new StateMachineFactory<MyThreadContext, MyThreadState, MyThreadEvent>();
        // NEW -> RUNNABLE
        stateMachineFactory.addTransition(MyThreadState.NEW, MyThreadState.RUNNABLE, (o, e) -> {
            if (e == MyThreadEvent.CallStart) {
                System.out.println("NEW -> RUNNABLE by event: " + e);
                return MyThreadState.RUNNABLE;
            }
            return MyThreadState.TERMINATED;
        });
        // RUNNABLE -> RUNNING
        stateMachineFactory.addTransition(MyThreadState.RUNNABLE, MyThreadState.RUNNING, (o, e) -> {
            if (e == MyThreadEvent.ObtainCPU) {
                System.out.println("RUNNABLE -> RUNNING by event: " + e);
                return MyThreadState.RUNNING;
            }
            return MyThreadState.TERMINATED;
        });
        // RUNNING -> BLOCKED | WAITING | TIMED_WAITING | TERMINATED
        stateMachineFactory.addTransition(MyThreadState.RUNNING, Set.of(MyThreadState.BLOCKED, MyThreadState.WAITING,
                MyThreadState.TIMED_WAITING, MyThreadState.TERMINATED), (o, e) -> {
                    MyThreadState postState = null;
                    if (e == MyThreadEvent.WaitingLock) {
                        postState = MyThreadState.BLOCKED;
                    } else if (e == MyThreadEvent.CallObjectWaitOrWaitIO) {
                        postState = MyThreadState.WAITING;
                    } else if (e == MyThreadEvent.CallWithTimeout) {
                        postState = MyThreadState.TIMED_WAITING;
                    } else if (e == MyThreadEvent.RunReturn) {
                        postState = MyThreadState.TERMINATED;
                    }
                    if (postState != null) {
                        System.out.println("RUNNING -> " + postState + " by event: " + e);
                        return postState;
                    }
                    throw new RuntimeException("RUNNING not supported event: " + e);
                });
        // BLOCKED -> RUNNABLE | TERMINATED
        stateMachineFactory.addTransition(MyThreadState.BLOCKED,
                Set.of(MyThreadState.RUNNABLE, MyThreadState.TERMINATED), (o, e) -> {
                    MyThreadState postState = null;
                    if (e == MyThreadEvent.ObtainLock) {
                        postState = MyThreadState.RUNNABLE;
                    } else if (e == MyThreadEvent.CallInterrupt) {
                        postState = MyThreadState.TERMINATED;
                    }
                    if (postState != null) {
                        System.out.println("BLOCKED -> " + postState + " by event: " + e);
                        return postState;
                    }
                    throw new RuntimeException("BLOCKED not supported event: " + e);
                });
        // WAITING -> RUNNABLE | TERMINATED
        stateMachineFactory.addTransition(MyThreadState.WAITING,
                Set.of(MyThreadState.RUNNABLE, MyThreadState.TERMINATED), (o, e) -> {
                    MyThreadState postState = null;
                    if (e == MyThreadEvent.CallObjectNotifyOrIOReady) {
                        postState = MyThreadState.RUNNABLE;
                    } else if (e == MyThreadEvent.CallInterrupt) {
                        postState = MyThreadState.TERMINATED;
                    }
                    if (postState != null) {
                        System.out.println("WAITING -> " + postState + " by event: " + e);
                        return postState;
                    }
                    throw new RuntimeException("WAITING not supported event: " + e);
                });
        // TIMED_WAITING -> RUNNABLE | TERMINATED
        stateMachineFactory.addTransition(MyThreadState.TIMED_WAITING,
                Set.of(MyThreadState.RUNNABLE, MyThreadState.TERMINATED), (o, e) -> {
                    MyThreadState postState = null;
                    if (e == MyThreadEvent.TimeoutOrReturn) {
                        postState = MyThreadState.RUNNABLE;
                    } else if (e == MyThreadEvent.CallInterrupt) {
                        postState = MyThreadState.TERMINATED;
                    }
                    if (postState != null) {
                        System.out.println("TIMED_WAITING -> " + postState + " by event: " + e);
                        return postState;
                    }
                    throw new RuntimeException("TIMED_WAITING not supported event: " + e);
                });

        StateMachine<MyThreadState, MyThreadEvent> sm = stateMachineFactory.make(new MyThreadContext(), MyThreadState.NEW);

        sm.doTransition(MyThreadEvent.CallStart);
        sm.doTransition(MyThreadEvent.ObtainCPU);
        sm.doTransition(MyThreadEvent.WaitingLock);
        sm.doTransition(MyThreadEvent.ObtainLock);
        sm.doTransition(MyThreadEvent.ObtainCPU);
        sm.doTransition(MyThreadEvent.CallObjectWaitOrWaitIO);
        sm.doTransition(MyThreadEvent.CallObjectNotifyOrIOReady);
        sm.doTransition(MyThreadEvent.ObtainCPU);
        sm.doTransition(MyThreadEvent.CallWithTimeout);
        sm.doTransition(MyThreadEvent.TimeoutOrReturn);
        sm.doTransition(MyThreadEvent.ObtainCPU);
        sm.doTransition(MyThreadEvent.RunReturn);

    }
}
```

输出

```
NEW -> RUNNABLE by event: CallStart
RUNNABLE -> RUNNING by event: ObtainCPU
RUNNING -> BLOCKED by event: WaitingLock
BLOCKED -> RUNNABLE by event: ObtainLock
RUNNABLE -> RUNNING by event: ObtainCPU
RUNNING -> WAITING by event: CallObjectWaitOrWaitIO
WAITING -> RUNNABLE by event: CallObjectNotifyOrIOReady
RUNNABLE -> RUNNING by event: ObtainCPU
RUNNING -> TIMED_WAITING by event: CallWithTimeout
TIMED_WAITING -> RUNNABLE by event: TimeoutOrReturn
RUNNABLE -> RUNNING by event: ObtainCPU
RUNNING -> TERMINATED by event: RunReturn
```
