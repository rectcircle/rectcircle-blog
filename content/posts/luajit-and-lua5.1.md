---
title: "LuaJIT 和 Lua 5.1"
date: 2022-09-02T18:46:13+08:00
draft: true
toc: true
comments: true
tags:
  - untagged
---

## 概述

https://blog.51cto.com/u_14861909/5441626
https://groups.google.com/g/OpenResty/c/0ftsRpgC5kE
https://github.com/openresty/luajit2/tree/v2.1-agentzh

## 开发环境搭建

### 编译安装

```bash
git clone https://luajit.org/git/luajit.git
cd luajit
MACOSX_DEPLOYMENT_TARGET=12.5.1 make && sudo make install
sudo ln -sf luajit-2.1.0-beta3 /usr/local/bin/luajit
luajit --help
cd ..
rm -rf luajit
```

说明：

* [官方建议](https://github.com/LuaJIT/LuaJIT/issues/563)：始终使用 v2.1 分支的代码编译。
* Mac 编译需要 `MACOSX_DEPLOYMENT_TARGET` 环境变量，指向系统版本（系统偏好设置 > 软件更新查看）
* 本例使用的代码版本为： [03080b795aa3496ed62d4a0697c9f4767e7ca7e5](https://github.com/LuaJIT/LuaJIT/commit/03080b795aa3496ed62d4a0697c9f4767e7ca7e5)。
* 不使用 `PREFIX=/home/myself/lj2` 参数，将安装到 `/usr/local` 相关目录下。
* 卸载使用 `sudo make uninstall` 命令。

### VSCode 扩展

* 语言服务器 [sumneko.lua](https://marketplace.visualstudio.com/items?itemName=sumneko.lua)
* 调试器 [actboy168.lua-debug](https://marketplace.visualstudio.com/items?itemName=actboy168.lua-debug)

`cmd + ,`， 配置使用 luajit 版本：

```json
{
    "Lua.telemetry.enable": false,
    "Lua.runtime.version": "LuaJIT",
    "lua.debug.settings.luaVersion": "jit",
}
```

### 运行测试

`hello.lua`

```lua
print('hello')
```

* 方式 1：命令行执行 `luajit hello.lua`。
* 方式 2：VSCode 调试，按 `F5`。
