---
title: "Redux"
date: 2020-03-27T17:22:23+08:00
draft: true
toc: true
comments: true
tags:
  - 前端
---

## 一、简述

极简状态管理容器，大小仅有 2KB

原则

* 单一数据源 `store` （意味着单一state）
* 只能通过 `Dispatch Action` 来修改 `state`
* 使用 `Reducer` 纯函数来执行修改 `state`

## 二、快速开始

```bash
npx create-react-app redux-learn
cd redux-learn
npm install --save redux
```

### 1、Hello World

`src/redux01/redux.js`

```js
import { createStore } from 'redux';
import React from 'react';

/**
 * 步骤1: 创建一个 Reducer
 * 这是一个 reducer，形式为 (state, action) => state 的纯函数。
 * 描述了 action 如何把 state 转变成下一个 state。
 */
function reducer(state, action) {
    // 初始化
    if (state === undefined) {
        return 0;
    }
// function reducer(state = 0, action) {
    // 业务逻辑
    switch (action.type) {
        case 'INCREMENT':
            return state + 1;
        case 'DECREMENT':
            return state - 1;
        case 'CLEAR_NUM':
            return 0;
        default:
            return state;
    }
}

// 步骤2: 创建 Redux store 来存放应用的状态。
// API 是 { subscribe, dispatch, getState }。
let store = createStore(reducer);

// 步骤3: 手动订阅更新，也可以事件绑定到视图层。
const update = () => {
    const valueEle = document.getElementsByClassName('numValue');
    valueEle[0].innerHTML = store.getState().toString();
}
store.subscribe(update);

// 步骤4: 在View中使用
export default class Number1 extends React.Component {
    addNumber = () => {
        // 改变内部 state 惟一方法是 dispatch 一个 action。
        // action 可以被序列化，用日记记录和储存下来，后期还可以以回放的方式执行
        store.dispatch({ type: 'INCREMENT' });
    }
    minusNumber = () => {
        store.dispatch({ type: 'DECREMENT' });
    }
    clearNumber = () => {
        store.dispatch({ type: 'CLEAR_NUM' });
    }

    render() {
        return (
            <div className="wrapper">
                <h3>Redux 01: Hello World</h3>
                Current Number: <span className="numValue">0</span>
                <div>
                    <button onClick={this.minusNumber}>-</button>
                    <button onClick={this.clearNumber}>clear</button>
                    <button onClick={this.addNumber}>+</button>
                </div>
            </div>
        )
    }
}
```

修改 `src/App.js`

```js
import React from 'react';
import './App.css';
import Number1 from './redux01/redux';

function App() {
  return (
    <div className="App">
      <Number1/>
    </div>
  );
}

export default App;
```

启动测试 `npm start`

### 2、核心概念

#### Action

用于描述已发生的事件，且能携带数据的 plain object

按照 Redux 约定，这个 `Action` 形式如下

```js
{
    type: '常量',
    payload: {
    }
}
```

使用 Action 的位置

* `store.dispatch(action)` 在 view 层触发
* `reducer(state, action) -> state` 处理状态变

#### Reducer

纯函数，执行计算，返回新的 state

函数声明为 `(state, action) => state`

注意点：

* 第一次执行时（初始化），`state` 为 `undefined`
* 每次更新都必须返回一个新的 `state`，不能直接修改参数中的 `state`

#### State

`state` 由 `createStore` 创建的，包含 `{ subscribe, dispatch, getState }` 这三个方法的数据源。

`createStore`，有三种写法

* `createStore(reducer)`
* `createStore(reducer, enhancer)`
* `createStore(reducer, preloadedState, enhancer)`

`createStore`，返回值包含三个函数

* `dispatch(action)`
* `getState() => state`
* `subscribe(listener) => unSubscribe`

因此 `createStore`，实现方式为闭包，大概如下

```js
export const createStore = (reducer) => {
    let state = undefined;
    let listeners = [];

    return {
        dispatch: (action) => {
            state = reducer(state, action);
            for (const listener of listeners) {
                listener();
            }
        },
        getState: () => state,
        subscribe: (listener) => {
            listeners.push(listener);
            return () => {
                listeners.splice(listeners.lastIndexOf(listener))
            }
        }
    }
}
```

### 3、重构

创建新的目录 `src/redux02/`

* 将 action 的type 定义为常量 `configs/actions.js`
* 将 action 的构建 定义为函数 `actions/numbers.js`
* 将 Reducer 定义到 专门的目录 `reducers/`
* 将 Reducer 的初始化和 Case When 抽离出一个高阶函数 `reducerCreator(initialState, handlers) => (state, action) => state`

`src/redux02/configs/actions.js`

```js
export const INCREMENT = 'INCREMENT'
export const DECREMENT = 'DECREMENT'
export const CLEAR_NUM = 'CLEAR_NUM'
```

`src/redux02/actions/numbers.js`

```js
// Action 构造函数
import * as constant from '../configs/actions'

export const incrementNum = () => ({
    type: constant.INCREMENT
});

export const decrementNum = () => ({
    type: constant.DECREMENT
});

export const clearNum = () => ({
    type: constant.CLEAR_NUM
});

```

`src/redux02/reducers/number.js`

```js
import * as constant from '../configs/actions'

const initialState = {
    number: 0,
};

const reducerCreator = (initialState, handlers) => {
    return (state = initialState, action) => {
        if (handlers.hasOwnProperty(action.type)) {
            return handlers[action.type](state, action);
        } else {
            return state;
        }
    }
}

export default reducerCreator(initialState, {
    [constant.INCREMENT]: (state, action) => {
        return {
            ...state,
            number: state.number + 1
        };
    },
    [constant.DECREMENT]: (state, action) => {
        return {
            ...state,
            number: state.number - 1
        };
    },
    [constant.CLEAR_NUM]: (state, action) => {
        return {
            ...state,
            number: 0
        };
    },
})
```

入口文件变为 `src/redux02/redux.js`

```js
import { createStore } from 'redux';
import React from 'react';
import number from './reducers/number';
import { incrementNum, decrementNum, clearNum } from './actions/numbers';

// 步骤2: 创建 Redux store 来存放应用的状态。
// API 是 { subscribe, dispatch, getState }。
let store = createStore(number);

// 步骤3: 手动订阅更新，也可以事件绑定到视图层。
const update = () => {
    const valueEle = document.getElementsByClassName('numValue2');
    valueEle[0].innerHTML = store.getState().number.toString();
}
store.subscribe(update);

// 步骤4: 在View中使用
export default class Number2 extends React.Component {
    addNumber = () => {
        // 改变内部 state 惟一方法是 dispatch 一个 action。
        // action 可以被序列化，用日记记录和储存下来，后期还可以以回放的方式执行
        store.dispatch(incrementNum());
    }
    minusNumber = () => {
        store.dispatch(decrementNum());
    }
    clearNumber = () => {
        store.dispatch(clearNum());
    }

    render() {
        return (
            <div className="wrapper">
                <h3>Redux 02: Hello World</h3>
                Current Number: <span className="numValue2">0</span>
                <div>
                    <button onClick={this.minusNumber}>-</button>
                    <button onClick={this.clearNumber}>clear</button>
                    <button onClick={this.addNumber}>+</button>
                </div>
            </div>
        )
    }
}
```

### 4、支持多个Reducer

* 分别创建多个 `Reducer`
* 最后使用 `combineReducers({reducerKey: reducer})` 函数组合为一个 `Reducer`，并创建 store
* 此时 `state` 的结构为 `{reducerKey: reducerState}`

combineReducers 的实现大概如下

```js
export const combineReducers = (reducerObj) => {
    return (state = {}, action) => {
        const newState = {};
        Object.keys(reducerObj).forEach(reducerName => {
            const reducer = reducerObj[reducerName];
            newState[reducerName] = reducer(state[reducerName], action);
        });
        return {
            ...state,
            ...newState,
        }
    }
}
```

因此所有注册的监听函数都可以获取到所有的 `state`

### 5、Redux 结合 React

目录结构

* `actions` 存放 action 构造函数
* `containers` 存放需要共享全局状态的组件
* `components` 存放不需要共享全局状态的组件
* `reducers` 存放 reducers
* `configs/actions.js` 存放 `action.type` 的常量值

依赖包 `react-redux`，包含两个API

* `<Provider store>`
* `connect`
