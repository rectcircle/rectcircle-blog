---
title: travis-ci配合github使用的持续集成服务
date: 2018-06-04T19:27:36+08:00
draft: false
toc: false
comments: true
aliases:
  - /detail/150
  - /detail/150/
tags:
  - devops
---

> [参考1](http://www.ruanyifeng.com/blog/2017/12/travis_ci_tutorial.html)
> [travis-ci官方文档](https://docs.travis-ci.com/)

## 目录
* [一、持续集成](#一、持续集成)
	* [1、持续集成是什么](#1、持续集成是什么)
	* [2、为什么需要持续集成](#2、为什么需要持续集成)
* [二、travis-ci使用准备](#二、travis-ci使用准备)
	* [1、注册](#1、注册)
	* [2、下载命令行工具](#2、下载命令行工具)
* [三、基本使用说明](#三、基本使用说明)
	* [1、创建仓库](#1、创建仓库)
	* [2、添加travis-ci配置文件](#2、添加travis-ci配置文件)
	* [3、托管到github](#3、托管到github)
	* [4、打开持续构建](#4、打开持续构建)
	* [5、在readme添加勋章](#5、在readme添加勋章)
* [四、.travis.yml详解](#四、.travis.yml详解)
	* [0、相关说明](#0、相关说明)
	* [1、language属性](#1、language属性)
	* [2、设置基础设施](#2、设置基础设施)
	* [3、其他功能](#3、其他功能)
	* [4、自定义运行脚本](#4、自定义运行脚本)
	* [5、数据库支持](#5、数据库支持)
	* [6、部署支持](#6、部署支持)
	* [7、环境变量](#7、环境变量)
	* [8、通知支持](#8、通知支持)
* [五、部署到heroku](#五、部署到heroku)
	* [1、heroku基本使用](#1、heroku基本使用)
	* [2、部署到heroku.travis.yml配置](#2、部署到heroku.travis.yml配置)






## 一、持续集成
**********
### 1、持续集成是什么
持续集成服务（Continuous Integratinaijuon，简称 CI），一般来说与CVS（版本控制系统）结合使用，当用户向版本控制服务提交变更之后，CI会自动拉去项目，进行自动化的编译构建、测试、打包、并部署到服务器上。

持续集成指的是只要代码有变更，就自动运行构建和测试，反馈运行结果。确保符合预期以后，再将新代码"集成"到主干。

### 2、为什么需要持续集成

持续集成的好处在于，每次代码的小幅变更，就能看到运行结果，从而不断累积小的变更，而不是在开发周期结束时，一下子合并一大块代码。适合敏捷开发




## 二、travis-ci使用准备
*************
### 1、注册
#### （1）github
travis只能和github配合使用，所以必须拥有github账号

预先注册github


#### （2）注册travis-ci
访问 https://travis-ci.org 选择使用github登录即可


### 2、下载命令行工具
[github地址](https://github.com/travis-ci/travis.rb)

工具继续ruby，注意Ubuntu必须安装`ruby-dev`





## 三、基本使用说明
*******************
[github仓库](https://github.com/rectcircle/travis-ci-test)

### 1、创建仓库
```bash
git init
# 添加gitignore
```

创建`main.c`
```c
#include <stdio.h>

int main(){
    printf("Hello World\n");
    return 0;
}
```

本地运行
```bash
gcc -o main main.c
./main
```

### 2、添加travis-ci配置文件
创建`.travis.yml`，内容如下
```yml
language: c
compiler: gcc
before_script: "$CC -o main main.c"
script:
- "./main"

after_script: ehco $MY_SECRET_ENV

notifications:
  email:
    recipients:
    - sunben960729@163.com
env:
  global:
    secure: KcbDfi3F1PByY6rtWHlcOvZ/AXPUgv2tsl53FskMR7SkZu3StkFFLB7MWeFhXcp19u1ADe5SFNpNZY2YTHwjDJfaHN8R8z3mi0GLuwzsJGKvjRnclRXPMacjaVkNPS0At9Xo8CUw74qa7ZNPSqqD3NUEY0/ByrUEuwK9sLbhryBTb00YZY3ehmLS3WN6wFHE/puBXFR+aWuHvR1wqeSITh5ZJWbk96Y18RCgi1xHklnm8YHvXEd3OVzXHDG5R3aCEyIQ7q45Y71UHRCX6ZaTceX/frqLIQWqpRtd4ZAtZtxLmjRpMBiBfAx5PUnOYG8v2+8TUUA2pKq6+BlwAqvaeG560wHUI2N0mIbFlRL1ahCVa7m7mB1ek8nbp3ZA6rZxM3kNHQgAz5Np542788NHO5qN8mHCp93qizNDF0nNtotKqpSNZlJcZCJni4KfTos+qyPz1lyiDVPXZAQCR4U9KeUPVRKVbqwLgOzCM41lW7cy2LJ94wmkN4YbvGybMKu3QI5eXc15N3YDOyJxzeZaIoDxhg/+d2+gSAUOStykke3tN+HL7WYsJm6KtCai4g/IBv+nzasY80Tzj7i7MF7dEE1fY5P1Y2D/G3HiH+mrmjDdieYA+p6B6hULQBn6CTXN6Ju9QEIVT0O+tmnNWBSJwenbRqmt4nKPu7fkaUpB8jY=

```

**说明**
* `language`表明本项目的语言类型
* `compiler`选择编译器
* `before_script` 在`script`之前执行的内容
* `script` 执行的构建、测试脚本
* `after_script` 表示构建之后执行内容
* `notifications`: 配置通知
* `env` 配置环境变量


### 3、托管到github
添加到本地仓库
```bash
git add .
git commit -m "first commit"
```

在github上创建项目

然后提交到远程仓库
```bash
git remote add origin https://github.com/rectcircle/travis-ci-test.git
git push -u origin master
```


### 4、打开持续构建
访问 travis profile 页面打开项目的自动构建功能


### 5、在readme添加勋章
创建`READEME.md`

点击 travis 项目构建页的勋章选择markdown，复制内容粘贴到README中
```md
[![Build Status](https://travis-ci.org/rectcircle/travis-ci-test.svg?branch=master)](https://travis-ci.org/rectcircle/travis-ci-test)
```



## 四、.travis.yml详解
*********************
### 0、相关说明
#### （1）构建生命周期
travis的构建分为两步
* `install`：安装依赖（比如说node的依赖、maven的依赖）
* `script`：执行构建测试（比如说mvn package、mvn test等）

同时还用`before_install`和`befor_script`在两者之前执行

当构建成功或失败可以使用`after_success`、`after_failure`执行相关内容，使用环境变量`$TRAVIS_TEST_RESULT`获得构建结果

完成的过程如下
* 可选的安装 `apt addons`
* 可选的安装 `cache components`
* `before_install`
* `install`
* `before_script`
* `script`
* 可选 `before_cache` (清空缓存)
* `after_success` 或 `after_failure`
* 可选 `before_deploy`
* 可选 `deploy`
* 可选 `after_deploy`
* `after_script`

### 1、language属性
每个项目都要指定，若不指定默认为`ruby`

可选的语言[在此](https://docs.travis-ci.com/user/languages/)

选择语言之后，Travis将会根据语言和你的项目情况自动生成合适的配置来执行持续构建。

各个语言的系统环境[在此](https://docs.travis-ci.com/user/reference/precise/)

### 2、设置基础设施
默认的环境为Ubuntu14.04

配置
```
sudo: enabled #启动sudo权限
os: osx #选择macos操作系统
```


### 3、其他功能
* [部署到github页面](https://docs.travis-ci.com/user/deployment/pages/)
* [让程序运行在Heroku](#五、部署到heroku)
* [发布到ruby仓库](https://docs.travis-ci.com/user/deployment/rubygems/)
* [发送通知](https://docs.travis-ci.com/user/notifications/)
* 理论上只要某个服务提供了命令行工具，travis工具就能做到自动化




### 4、自定义运行脚本
#### （1）script之前的阶段
可以可以根据需求在travis的生命周期执行各种命令，支持多行例子如下

`.travis.yml`文件

install阶段，

执行单条命令
```yml
install: ./install-dependencies.sh
```

执行多条命令
```yml
install: 
  - bundle install --path vendor/bundle 
  - npm install
```

跳过install阶段
```yml
install: true
```


其他生命周期类似
```yml
script: bundle exec thor build

---

script:
- bundle exec rake build
- bundle exec rake builddoc

script: bundle exec rake build && bundle exec rake builddoc
```

* 在`before_install`, `install`, `before_script`出现非0退出码，则终止，返回构建错误
* 在`script`出现非零退出码，则终止，返回构建失败

#### （2）deploy阶段
默认情况下，deploy将会删除上面阶段代码产生的变更。使用如下跳过
```yml
deploy:
  skip_cleanup: true
```

可以使用`before_deploy` 和 `after_deploy`，前者失败会导致构建失败，后者不会

#### （3）使用apt安装软件包
可以不使用密码使用sudo

```yml
before_install:
- sudo apt-get update -qq
- sudo apt-get install -qq [packages list]
```

#### （4）Build Matrix （构建矩阵）
travis根据平台环境（比如说虚拟机版本、编译器版本）和环境变量（指定不同的数据库等）所有组合进行全方位的测试

矩阵的含义可能就是这个意思

[具体参见](https://docs.travis-ci.com/user/customizing-the-build/#Build-Matrix)




### 5、数据库支持
https://docs.travis-ci.com/user/database-setup

Travis CI中MySQL数据库默认用户名是root或者travis，密码为空

### 6、部署支持
https://docs.travis-ci.com/user/deployment/

### 7、环境变量
通常项目构建依赖与一些环境变量，在travis中环境变量变量分为全局和矩阵两个级别

#### （1）全局环境变量
```yml
env:
  - DB=postgres #每个条目定义1个为全局
  - SH=bash
  - PACKAGE_VERSION="1.0.*"
```


#### （2）矩阵环境变量
```yml
rvm:
  - 1.9.3
  - rbx-3
env:
  - FOO=foo BAR=bar #每个条目定义多个，为矩阵环境变量
  - FOO=bar BAR=foo
```

#### （3）同时使用
推荐做法
```yml
env:
  global:
    - CAMPFIRE_TOKEN=abc123
    - TIMEOUT=1000
  matrix:
    - USE_NETWORK=true
    - USE_NETWORK=false
```

#### （4）加密环境变量
```yml
env:
  global:
    - secure: mcUCykGm4bUZ3CaW6AxrIMFzuAYjA98VIz6YmYTmM0/8sp/B/54JtQS/j0ehCD6B5BwyW6diVcaQA2c7bovI23GyeTT+TgfkuKRkzDcoY51ZsMDdsflJ94zV7TEIS31eCeq42IBYdHZeVZp/L7EXOzFjVmvYhboJiwnsPybpCfpIH369fjYKuVmutccD890nP8Bzg8iegssVldgsqDagkuLy0wObAVH0FKnqiIPtFoMf3mDeVmK2AkF1Xri1edsPl4wDIu1Ko3RCRgfr6NxzuNSh6f4Z6zmJLB4ONkpb3fAa9Lt+VjJjdSjCBT1OGhJdP7NlO5vSnS5TCYvgFqNSXqqJx9BNzZ9/esszP7DJBe1yq1aNwAvJ7DlSzh5rvLyXR4VWHXRIR3hOWDTRwCsJQJctCLpbDAFJupuZDcvqvPNj8dY5MSCu6NroXMMFmxJHIt3Hdzr+hV9RNJkQRR4K5bR+ewbJ/6h9rjX6Ot6kIsjJkmEwx1jllxi4+gSRtNQ/O4NCi3fvHmpG2pCr7Jz0+eNL2d9wm4ZxX1s18ZSAZ5XcVJdx8zL4vjSnwAQoFXzmx0LcpK6knEgw/hsTFovSpe5p3oLcERfSd7GmPm84Qr8U4YFKXpeQlb9k5BK9MaQVqI4LyaM2h4Xx+wc0QlEQlUOfwD4B2XrAYXFIq1PAEic=
  matrix:
    - USE_NETWORK=true
    - USE_NETWORK=false
    - secure: <you can also put encrypted vars inside matrix>
```

加密产生方式：使用命令行工具`travis encrypt MY_SECRET_ENV=super_secret --add env.matrix`

#### （5）文件加密
* 命令`travis encrypt-file super_secret.txt`
* 将输出`super_secret.txt.enc`文件
* 将`super_secret.txt.enc`加入版本库，不要将`super_secret.txt`加入版本库
* 在`before_xxx`加入如下内容
```
before_install：openssl aes-256-cbc -K $encrypted_0a6446eb3ae3_key -iv $encrypted_0a6446eb3ae3_iv -in super_secret.txt.enc -out super_secret.txt -d
```


### 8、通知支持
https://docs.travis-ci.com/user/notifications/


## 五、部署到heroku
*******************
### 1、heroku基本使用
[略](https://www.rectcircle.cn/detail/152#%E4%B8%80%E3%80%81heroku)

### 2、部署到heroku.travis.yml配置

[文档](https://docs.travis-ci.com/user/deployment/heroku/)

* 使用`heroku auth:token`获取token
* `travis encrypt <your heroku token> --add deploy.api_key`
* 向`.travis.yml`添加配置

**常用的配置方式**
```yaml
deploy:
  provider: heroku
  app: notice-service-main
  api_key:
    secure: <加密过的token>
```

**不同分支部署到不同位置**
```yaml
deploy:
  provider: heroku
  api_key: ...
  app:
    master: my-app-staging
    production: my-app-production
		
#不同的账户
deploy:
  provider: heroku
  api_key:
    master: ...
    production: ...
  app:
    master: my-app-staging
    production: my-app-production
```

**部署特定分支**
```yaml
deploy:
  provider: heroku
  api_key: ...
  on: production
```

**部署成功后运行命令（在heroku上）**
```yaml
deploy:
  provider: heroku
  api_key: ...
  run:
    - "rake db:migrate"
    - "rake cleanup"
```


