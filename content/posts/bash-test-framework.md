---
title: "Bash 测试框架"
date: 2024-08-15T17:43:00+08:00
draft: false
toc: true
comments: true
tags:
  - untagged
---

## 简述

在使用各种语言编写的程序时，我们经常需要对程序的功能进行验证。这时候就需要使用测试框架，如 Java 的 JUnit、Python 的 pytest、Go 的 testing 模块等。

Bash 作为 Shell 脚本语言，一般不会写一些复杂的逻辑，因此很少有使用测试框架的需求。但是，当我们想执行一些复杂端到端测试或验证一个操作系统环境时（如虚拟机镜像的测试、Docker 镜像的测试），Bash 来编写测试脚本就非常方便了。

本文将以此为例，介绍如何使用 Bash 编写一个简单的测试框架，以及如何使用这个测试框架，验证面向各个开发语言的编译环境。

最后，将介绍主流的开源 Bash 测试框架 Bats。

## 实现简单的 Bash 测试框架

### loginfo 函数

包含时间日期的格式打印日志： `loginfo <msg>`。

实现如下：

```bash
loginfo(){
    echo "[$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")] $@" 
}
```

示例

```bash
loginfo hello
# [2024-08-15T07:32:51.000Z] hello
```

### assert 函数

`assert` 函数，传递一个子命令，如果子命令执行成功，则测试通过；如果子命令执行失败，则测试失败。用法如下：

```
assert <msg> -- <cmd> <args...>
assert <cmd> <args...>
```

实现如下：

```bash
assert(){
    set +e
    msg_arr=()
    sub_cmd=
    sub_args=()

    meet_delimiter=0
    for arg in "$@"; do
        if [ "$meet_delimiter" = "0" ] ;then
            # 没有遇到分割符号 --
            if [ "$arg" = "--" ] ;then
                meet_delimiter=1
            else
                msg_arr+=("$arg")
            fi
        elif [ "$meet_delimiter" = "1" ] ;then
            # 遇到过分割符后的第一个参数
            sub_cmd="$arg"
            meet_delimiter=2
        else
            sub_args+=("$arg")
        fi
    done
    if [ "$meet_delimiter" = "0" ] && [ ${#msg_arr[@]} -ne 0 ] ;then
        sub_cmd="${msg_arr[0]}"
        sub_args=("${msg_arr[@]:1}")
        msg_arr=()
    fi
    unset meet_delimiter arg
    # echo msg="${msg_arr[@]}" sub_cmd="$sub_cmd" sub_args="${sub_args[@]}"

    if [ -z "$sub_cmd" ] ;then
        echo "error: cmd param not found"
        echo "usage: assert <msg> -- <cmd> <args...>"
        echo "       assert <cmd> <args...>"
        return 1
    fi
    loginfo "--- will assert ${msg_arr[@]}: $sub_cmd ${sub_args[@]}"
    eval "$sub_cmd ${sub_args[@]}"
    if [ $? -eq 0 ] ;then
        loginfo "--- assert ok ${msg_arr[@]}: $sub_cmd ${sub_args[@]}"
        echo
    else
        loginfo "--- assert fail ${msg_arr[@]}: $sub_cmd ${sub_args[@]}"
        echo
        exit 1
    fi
}
```

* 首先解析参数，真正实现应该采用 getopt getopts 解析。
* 打印执行子命令之前的的日志。
* 使用 eval 执行子命令，原因是有些场景子命令需要执行 `|` 管道符，直接执行无法处理。
* 判断子命令执行结果，如果执行成功，则打印日志，测试通过；如果执行失败，则打印日志，测试失败直接退出，退出码为 1。
* 失败场景使用 `exit 1` 原因是，希望失败可以直接中断后续的测试。另外，实测 `return 1` 调用方使用 `set -e` 无效。

使用示例如下：

```bash
assert
# error: cmd param not found
# usage: assert <msg> -- <cmd> <args...>
#        assert <cmd> <args...>
assert pwd
# [2024-08-15T07:50:19.099Z] --- will assert : pwd 
# /home/rectcircle
# [2024-08-15T07:50:19.105Z] --- assert ok : pwd 
assert -- pwd
# [2024-08-15T07:50:19.099Z] --- will assert : pwd 
# /home/rectcircle
# [2024-08-15T07:50:19.105Z] --- assert ok : pwd 
assert 'test pwd' -- pwd
# [2024-08-15T07:51:28.083Z] --- will assert test pwd: pwd 
# /home/rectcircle
# [2024-08-15T07:51:28.084Z] --- assert ok test pwd: pwd 
assert 'test false' -- false
# [2024-08-15T07:52:26.675Z] --- will assert test false: false 
# [2024-08-15T07:52:26.676Z] --- assert fail test false: false 
# 退出码 1
```

### assert_regex 函数

`assert_regex` 函数，判断子命令的输出是否匹配正则表达式。用法如下：

```
assert_regex <grep-pattern> <msg> -- <cmd> <args...>
assert_regex <grep-pattern> <cmd> <args...>
```

实现如下：

```bash
assert_regex(){
    grep_pattern="$1"
    shift
    assert "$@" "|" grep -E "$grep_pattern"
}
```

* 这里实现非常简单，直接调用 `assert` 函数，并使用管道符合 grep 进行输出匹配。

使用示例如下：

```bash
assert_regex "abc" echo 'abc'
# [2024-08-15T08:04:00.441Z] --- will assert : echo abc | grep -E abc
# abc
# [2024-08-15T08:04:00.443Z] --- assert ok : echo abc | grep -E abc
assert_regex "123" echo 'abc'
# [2024-08-15T08:04:05.941Z] --- will assert : echo abc | grep -E 123
# [2024-08-15T08:04:05.943Z] --- assert fail : echo abc | grep -E 123
# 退出码 1
```

### assert_http 函数

`assert_http` 函数，后台启动子命令，并发起 http 请求，并判断 http 响应码是否符合预期。用法如下：

```
assert_http <url> <status-code> <msg> -- <server-start-cmd> <args...>
assert_http <url> <status-code> <server-start-cmd> <args...>
```

实现如下：

```bash
assert_http(){
    set +e
    url="$1"
    status_code="$2"
    shift
    shift

    msg_arr=()
    sub_cmd=
    sub_args=()

    meet_delimiter=0
    for arg in "$@"; do
        if [ "$meet_delimiter" = "0" ] ;then
            # 没有遇到分割符号 --
            if [ "$arg" = "--" ] ;then
                meet_delimiter=1
            else
                msg_arr+=("$arg")
            fi
        elif [ "$meet_delimiter" = "1" ] ;then
            # 遇到过分割符后的第一个参数
            sub_cmd="$arg"
            meet_delimiter=2
        else
            sub_args+=("$arg")
        fi
    done
    if [ "$meet_delimiter" = "0" ] && [ ${#msg_arr[@]} -ne 0 ] ;then
        sub_cmd="${msg_arr[0]}"
        sub_args=("${msg_arr[@]:1}")
        msg_arr=()
    fi
    unset meet_delimiter arg
    if [ -z "$sub_cmd" ] ;then
        echo "error: cmd param not found"
        echo "usage: assert_http <url> <status-code> <msg> -- <server-start-cmd> <args...>"
        echo "       assert_http <url> <status-code> <server-start-cmd> <args...>"
        return 1
    fi
    loginfo "--- will assert http ${msg_arr[@]}: url is $url, want status code is $status_code, server start command is $sub_cmd ${sub_args[@]}"
    loginfo "will start server"
    set -m
    eval "$sub_cmd ${sub_args[@]}" &
    job_pid_id=$!
    set +m
    echo "server pid is $job_pid_id"
    # sleep 1000
    max_retries=30
    trap "kill -9 -$job_pid_id" RETURN SIGINT SIGTERM
    retries=0
    while [ $retries -lt $max_retries ]; do
        loginfo "will exec: curl --max-time 1 -s -o /dev/null -w \"%{http_code}\" \"$url\""
        got_status_code=$(curl --max-time 1 -s -o /dev/null -w "%{http_code}" "$url")
        if [ "$got_status_code" = "$status_code" ]; then
            loginfo "retry $retries success: status code is equal to $status_code"
            loginfo "--- http assert ok ${msg_arr[@]}: url is $url, want status code is $status_code, server start command is $sub_cmd ${sub_args[@]}"
            return 0
        else
            loginfo "retry $retries not success: status code is $got_status_code not equal to $status_code"
            retries=$((retries + 1))
            sleep 1
        fi
    done
    loginfo "--- http assert failed ${msg_arr[@]}: url is $url, want status code is $status_code, server start command is $sub_cmd ${sub_args[@]}"
    exit 1
}
```

* 首先解析参数，真正实现应该采用 getopt getopts 解析。
* 打印执行子命令之前的的日志。
* 使用 `set -m` 启用作业控制（确保为后续执行的子命令创建进程组） 使用 eval 执行子命令，并通过 `&` 在后台执行。
* 使用 curl 轮询判断状态码是否符合预期，如果不符合预期在指定次数后，判定测试失败。
* 执行结束后，使用 `kill -9` 杀死整个进程组（`-` 表示进程组）。

使用示例如下：

```bash
assert_http http://localhost:8080 200 'echo -e "HTTP/1.1 200 OK\n\nok" | nc -l -k -p 8080 -q 1'
# [2024-08-15T09:50:40.245Z] --- will assert http : url is http://localhost:8080, want status code is 200, server start command is echo -e "HTTP/1.1 200 OK\n\nok" | nc -l -k -p 8080 -q 1 
# [2024-08-15T09:50:40.245Z] will start server
# server pid is 926101
# [2024-08-15T09:50:40.246Z] will exec: curl --max-time 1 -s -o /dev/null -w "%{http_code}" "http://localhost:8080"
# GET / HTTP/1.1
# Host: localhost:8080
# User-Agent: curl/7.88.1
# Accept: */*

# [2024-08-15T09:50:40.252Z] retry 0 success: status code is equal to 200
# [2024-08-15T09:50:40.253Z] --- http assert ok : url is http://localhost:8080, want status code is 200, server start command is echo -e "HTTP/1.1 200 OK\n\nok" | nc -l -k -p 8080 -q 1 
# ./util.sh: 第 144 行：kill: (-926101) - 没有那个进程
```

### register_clear 函数

`register_clear` 函数，注册一个清理函数，在一个脚本结束且退出码为非 0 时执行。用法为 `registe_clear <cmd-or-func>`。

实现如下：

```bash
registe_clear(){
    trap "[ \"\$?\" -eq 0 ] && $1 || true" EXIT
}
```

* 这里使用了 trap 命令，注册一个信号处理函数，即：当脚本退出时，判断退出码是否为 0，如果为 0 则执行清理函数，否则不执行。

使用示例如下：

```bash
# test.sh
# registe_clear 'echo clear'
# exit 1
bash test.sh
# 无输出

# test.sh
# registe_clear 'echo clear'
# exit 0
bash test.sh
# clear
```

## 示例：测试各个编程语言编译环境

* 假设上述函数定义在 `util.sh`。
* 如下每个语言的测试脚本位于 `test/<lang>/test.sh`。
* `data/<lang>` 目录下有各个语言的测试项目。

### 基础环境

```bash
#!/usr/bin/env bash
set -e

script_path=$(readlink -f $(dirname "$0"))
source $script_path/../../util.sh

loginfo "=== start test _default_ ==="


loginfo "=== test file system ==="
assert touch /tmp/.abc
assert test -e /etc/command-not-found.sh
assert ! touch /.abc
assert 'arr=(/path/to/xxx-xxx-*) && [ ${#arr[@]} -ne 0 ]'

loginfo "=== test command ==="
assert which bash
assert which sh
assert which wget
assert which curl
assert which git
assert which sudo
assert which netstat
assert which nc
assert which zsh
assert which socat
assert which man
assert which tmux
assert which rsync
assert which sshpass
assert which unzip
assert which locale
assert which ip
assert which ping
assert which less
assert which vim
assert which nc
assert which xz
assert which fzy
assert which jq
assert which nix
assert which nix-build
assert which nix-channel
assert which nix-channel-index
assert which nix-collect-garbage
assert which nix-copy-closure
assert which nix-daemon
assert which nix-env
assert which nix-hash
assert which nix-index
assert which nix-instantiate
assert which nix-locate
assert which nix-prefetch-url
assert which nix-shell
assert which nix-store
assert which python python3 python3.12 pip node gcc openssl gdb make pkg-config gettext
```

### C++

```bash
#!/usr/bin/env bash
set -e


script_path=$(readlink -f $(dirname "$0"))
source $script_path/../../util.sh


clear(){
    loginfo "will clear test data"
    rm -rf $script_path/../../data/cpp/hello/c-main
    rm -rf $script_path/../../data/cpp/hello/cpp-main
    rm -rf $script_path/../../data/cpp/cmake/build
    rm -rf /tmp/test/cpp
}
register_clear clear
clear


loginfo "=== start test basic env ==="
assert which clang-apply-replacements clangd clang-format clang-linker-wrapper clang-offload-packager clang-refactor clang-repl clang-change-namespace clang-doc clang-include-cleaner clang-move clang-pseudo clang-rename clang-scan-deps clang-check clang-extdef-mapping clang-include-fixer clang-offload-bundler clang-query clang-reorder-fields clang-tidy
assert which cmake cpack ctest
assert which autoconf  autoheader  autom4te  autoreconf  autoscan  autoupdate  ifnames
assert which aclocal automake
assert which m4
assert which libtool  libtoolize
assert_regex share/aclocal 'echo $ACLOCAL_PATH' 


loginfo "=== start test hello project"
cd $script_path/../../data/cpp/hello
assert g++ main.cpp -o cpp-main
assert_regex "Hello" ./cpp-main
assert gcc main.c -o c-main
assert_regex "Hello" ./c-main


loginfo "=== start test cmake project"
cd $script_path/../../data/cpp/cmake
assert cmake -S./ -B./build
assert cmake --build ./build
assert_regex "Hello" ./build/main


loginfo "=== start test compile dropbear"
mkdir -p /tmp/test/cpp
cd /tmp/test/cpp
git clone https://github.com/mkj/dropbear.git
cd dropbear
git checkout DROPBEAR_2022.83
assert nix-env -iA nixpkgs.zlib nixpkgs.libxcrypt
assert ./configure --prefix=$HOME/.local
assert 'source ~/.bashrc && make PROGRAMS="dropbear dbclient dropbearkey dropbearconvert scp"'
assert make install
assert ~/.local/sbin/dropbear -h


loginfo "=== start test compile leveldb"
mkdir -p /tmp/test/cpp
cd /tmp/test/cpp
git clone https://github.com/google/leveldb
cd leveldb
git submodule update --init --recursive
mkdir -p build && cd build
assert cmake -DCMAKE_BUILD_TYPE=Release ..
assert cmake --build .
assert make test


loginfo "=== start test compile curl with nghttp2"
mkdir -p /tmp/test/cpp
cd /tmp/test/cpp
git clone https://github.com/nghttp2/nghttp2
cd nghttp2
git checkout d97bc7d8745ded136efa6e9e747f2310406893dd
git submodule update --init
assert autoreconf -i
assert automake
assert autoconf
assert ./configure --prefix=$HOME/.local
assert make
assert make install
assert_regex libnghttp2.a ls -al ~/.local/lib 
assert_regex libnghttp2.so ls -al ~/.local/lib 

cd ../
git clone https://github.com/curl/curl
cd curl
git checkout ba235ab269080dc66e35835c829f7ac4290dbc1d
assert autoreconf -fi
assert nix-env -iA nixpkgs.libpsl
assert ./configure --prefix=$HOME/.local --with-nghttp2=$HOME/.local --with-ssl
assert make
assert make install
assert_regex 'nghttp2' ~/.local/bin/curl --version
assert_regex 'libnghttp2.so' ldd ~/.local/bin/curl
assert ~/.local/bin/curl --http2 -I nghttp2.org
assert_regex 'HTTP/2' ~/.local/bin/curl --http2 -I nghttp2.org
```

### Golang

```bash
#!/usr/bin/env bash
set -e

script_path=$(readlink -f $(dirname "$0"))
source $script_path/../../util.sh

loginfo "=== start test golang ==="


loginfo "=== test basic env ==="
assert_regex "GOPROXY.*https.*goproxy.cn.*direct" go env
assert which go
assert which dlv
assert which gofmt
assert which gopls
assert which staticcheck
assert_regex "GOROOT=.*nix" go env
assert_regex "GOPATH=.*home/.*/go" go env


loginfo "=== test hello project ==="
cd $script_path/../../data/golang/hello
assert test -e go.mod
assert go get github.com/gin-gonic/gin
assert go mod tidy 
assert go build
assert ./main
assert go run ./
assert go test


loginfo "=== test sample cgo project ==="
cd $script_path/../../data/golang/samplecgo
assert test -e go.mod
assert go build
assert_regex "/nix/store/.*/ld-linux-x86-64.so.2" "ldd ./main | grep ld-linux-x86-64.so.2"
assert ./main
assert "CGO_LDFLAGS='-Wl,-rpath=/lib/x86_64-linux-gnu -Wl,--dynamic-linker=/lib64/ld-linux-x86-64.so.2' go build"
assert 'arr=(/nix/store/.*/ld-linux-x86-64.so.2) && [ ${#arr[@]} -eq 0 ]'


loginfo "=== test kubernetes project ==="
cd /tmp && rm -rf gin
assert git clone --depth 1 https://github.com/gin-gonic/gin.git
cd gin
assert go build
assert go test
rm -rf /tmp/gin
```

### Java

```bash
#!/usr/bin/env bash
set -e


script_path=$(readlink -f $(dirname "$0"))
source $script_path/../../util.sh


clear(){
    loginfo "will clear test data"
    rm -rf $script_path/../../data/java/hello/Main.class
    rm -rf /tmp/test/java
}
register_clear clear
clear


loginfo "=== start test basic env ==="
assert which java
assert which mvn
assert which gradle
assert_regex "maven.aliyun.com" cat ~/.m2/settings.xml
assert_regex "'version.*17.*'" 'java -version 2>&1'
assert_regex "'javac.*17.*'" 'javac -version 2>&1'
assert mvn -v
assert gradle -v

loginfo "=== start test hello ==="
cd $script_path/../../data/java/hello
javac Main.java
java Main


loginfo "=== start test maven and gradle project"
mkdir -p /tmp/test/java
cd /tmp/test/java
wget https://repo.huaweicloud.com/repository/maven/org/springframework/boot/spring-boot-cli/3.3.2/spring-boot-cli-3.3.2-bin.zip
# wget https://repo.maven.apache.org/maven2/org/springframework/boot/spring-boot-cli/3.3.2/spring-boot-cli-3.3.2-bin.zip
unzip -o spring-boot-cli-3.3.2-bin.zip
spring_cmd=$(pwd)/spring-3.3.2/bin/spring
# $spring_cmd init --list
mkdir -p spring-web-maven
cd spring-web-maven
assert $spring_cmd init --type maven-project --dependencies web --extract
assert mvn package
assert_http localhost:8080 404 mvn spring-boot:run
cd /tmp/test/java
mkdir -p spring-web-gradle
cd spring-web-gradle
assert $spring_cmd init --type gradle-project --dependencies web --extract
# fixme: https://docs.gradle.org/current/userguide/toolchains.html#sec:custom_loc
# gradle -q javaToolchains
mkdir -p ~/.gradle
export JAVA_HOME=$(dirname $(dirname $(readlink -f $(which java))))
export GRADLE_USER_HOME=$HOME/.gradle
echo 'org.gradle.java.installations.fromEnv=JAVA_HOME' > ~/.gradle/gradle.properties # 不工作，原因是 cat $(which gradle) -P 覆盖了。
echo "org.gradle.java.installations.paths=$JAVA_HOME" > ~/.gradle/gradle.properties
# fixme end
# ./gradlew -q javaToolchains
# gradle -q javaToolchains
# gradle -Porg.gradle.java.installations.fromEnv=JAVA_HOME -q javaToolchains
# gradle -Porg.gradle.java.installations.paths=/nix/store/zmj3m7wrgqf340vqd4v90w8dw371vhjg-openjdk-17.0.7+7/lib/openjdk -q javaToolchains
assert gradle clean bootJar
assert_http localhost:8080 404 gradle clean bootRun
rm -rf /tmp/test/java


loginfo "=== start test spring-projects/spring-petclinic"
mkdir -p /tmp/test/java
cd /tmp/test/java
git clone https://gitee.com/rectcircle/spring-petclinic.git
# git clone https://github.com/spring-projects/spring-petclinic
cd spring-petclinic && git checkout 383edc1656e305f8151c258b6925df00f7b53655
assert mvn install -Dmaven.test.skip=true
assert_http localhost:8080 200 java -jar target/spring-petclinic-3.3.0-SNAPSHOT.jar
rm -rf /tmp/test/java
```

### Node.js

```bash
#!/usr/bin/env bash
set -e


script_path=$(readlink -f $(dirname "$0"))
source $script_path/../../util.sh


clear(){
    loginfo "will clear test data"
    rm -rf $script_path/../../data/nodejs/koa/app
    rm -rf $script_path/../../data/nodejs/koa/node_modules
    cd $script_path/../../data/nodejs/koa
    npm remove sass bcrypt sqlite3 krb5
    rm -rf ~/.nvm/alias ~/.nvm/versions
    # rm -rf ~/.nvm/.cache
}
register_clear clear
clear



loginfo "=== start test basic env ==="
assert_regex "npmmirror.com" 'echo $FNM_NODE_DIST_MIRROR'
assert_regex "npmmirror.com" 'echo $NVM_NODEJS_ORG_MIRROR'
assert ls -al ~/.npm/lib
assert_regex 'yarn' cat ~/.nvm/default-packages
assert_regex 'pnpm' cat ~/.nvm/default-packages
assert_regex 'node_modules/.bin' 'echo $PATH'
assert_regex ${PNPM_HOME} 'echo $PATH'
assert_regex .npm/bin 'echo $PATH'
assert ! test -z $FNM_NODE_DIST_MIRROR
assert_regex $HOME/.nvm 'echo $NVM_DIR'
assert_regex $HOME/.local/share/pnpm 'echo $PNPM_HOME'
assert_regex $HOME/.npm 'echo $npm_config_prefix'
assert "bash -c 'source ~/.bashrc && type fnm'"
assert which node
assert which npm
assert which npx
assert which nvm.sh
assert "bash -c 'source ~/.bashrc && type nvm'"
assert which pnpm
assert which pnpx
assert which yarn
assert which yarnpkg


loginfo "=== start test package manager ==="
cd $script_path/../../data/nodejs/koa
export ELECTRON_MIRROR=http://npmmirror.com/mirrors/electron/
assert pnpm --version
assert pnpm install
assert_http http://localhost:3000 200 pnpm run start
assert pnpm i -g @electron-forge/cli
assert which electron-forge
assert 'electron-forge init --template=webpack app'
assert pnpm add tree-sitter tree-sitter-javascript
assert pnpm rebuild
assert pnpm remove tree-sitter tree-sitter-javascript
assert pnpm rebuild
rm -rf node_modules
rm -rf $script_path/../../data/nodejs/koa/app

assert npm install
assert_http http://localhost:3000 200 npm run start
assert npm i -g @electron-forge/cli
assert which electron-forge
assert 'electron-forge init --template=webpack app'
assert npm install tree-sitter tree-sitter-javascript
assert npm rebuild
assert npm remove tree-sitter tree-sitter-javascript
assert npm rebuild
rm -rf node_modules
rm -rf $script_path/../../data/nodejs/koa/app

assert yarn install
assert_http http://localhost:3000 200 yarn run start
assert yarn global add @electron-forge/cli
assert which electron-forge
assert 'electron-forge init --template=webpack app'
assert yarn add tree-sitter tree-sitter-javascript
assert yarn install --force
assert yarn remove tree-sitter tree-sitter-javascript
assert yarn install --force
rm -rf node_modules
rm -rf $script_path/../../data/nodejs/koa/app


loginfo "=== start test nvm ==="
assert "bash -c 'source ~/.bashrc && nvm install 16'"
assert_regex 16 "bash -c 'source ~/.bashrc && node -v'"
assert_regex "$HOME/.nvm/versions/node/"  "bash -c 'source ~/.bashrc && which npm'"
assert_regex "$HOME/.nvm/versions/node/"  "bash -c 'source ~/.bashrc && which pnpm'"
assert_regex "$HOME/.nvm/versions/node/"  "bash -c 'source ~/.bashrc && which yarn'"
rm -rf ~/.nvm/alias ~/.nvm/versions
# rm -rf ~/.nvm/.cache


loginfo "=== start test fnm ==="
assert "bash -c 'source ~/.bashrc && fnm install 18'"
assert_regex 18 "bash -c 'source ~/.bashrc && node -v'"
assert_regex 'fnm_multishells/.*/bin/npm' "bash -c 'source ~/.bashrc && which npm'"
assert_regex 'fnm_multishells/.*/bin/pnpm' "bash -c 'source ~/.bashrc && which pnpm'"
assert_regex 'fnm_multishells/.*/bin/yarn' "bash -c 'source ~/.bashrc && which yarn'"


loginfo "=== start test node gyp ==="
cd $script_path/../../data/nodejs/koa
assert npm i sass bcrypt sqlite3
assert 'nix-env -iA nixpkgs.libkrb5 && pip install setuptools && CC=$(which gcc) npm i krb5'
npm remove sass bcrypt sqlite3 krb5
```

### Python

```bash
#!/usr/bin/env bash
set -e


script_path=$(readlink -f $(dirname "$0"))
source $script_path/../../util.sh


clear(){
    loginfo "will clear test data"
    rm -rf ~/.local/bin/pip ~/.local/bin/pip3 ~/.local/bin/pip3.12 
    rm -rf ~/.local/lib/python3.12/site-packages
    rm -rf /tmp/test/venv
    rm -rf /tmp/test/poerty ~/.local/bin/poetry
    rm -rf ~/.local/lib/python3.11/site-packages ~/.local/bin/pip3.11
    if test -e ~/.bashrc_bak ;then
        rm -rf ~/.bashrc
        mv ~/.bashrc_bak ~/.bashrc
    fi
    rm -rf ~/.conda
    # rm -rf ~/.cache
    # mkdir -p ~/.cache
}
register_clear clear
clear

loginfo "=== start basic env ==="
assert_regex '.conda/bin' 'echo $PATH'
assert which python
assert "bash -c 'source ~/.bashrc && type conda'"
assert which pip
assert which poetry


loginfo "=== test hello project ==="
cd $script_path/../../data/python/hello
assert_regex '"hello world"' python main.py


loginfo "=== test pip ==="
assert '测试 upgrade pip 后 pip 能否正常工作' -- "pip install --upgrade pip && pip install -y requests"
assert '测试 mysqlclient 安装' -- "nix-env -iA nixpkgs.libmysqlclient && pip install mariadb && python -c 'import mariadb'"
#  boto3 太慢，先去掉
assert '测试 top100 库安装' -- pip install urllib3 botocore requests certifi typing-extensions idna charset-normalizer python-dateutil setuptools packaging s3transfer aiobotocore wheel pyyaml six grpcio-status pip numpy s3fs fsspec cryptography cffi google-api-core pycparser pandas importlib-metadata pyasn1 rsa zipp click pydantic attrs protobuf jmespath platformdirs pytz jinja2 awscli colorama markupsafe pyjwt tomli googleapis-common-protos wrapt filelock cachetools google-auth pluggy requests-oauthlib virtualenv pytest oauthlib pyarrow docutils exceptiongroup pyasn1-modules jsonschema iniconfig scipy pyparsing aiohttp isodate soupsieve sqlalchemy beautifulsoup4 psutil pydantic-core pygments multidict pyopenssl yarl decorator tzdata async-timeout tqdm grpcio frozenlist pillow aiosignal greenlet openpyxl et-xmlfile requests-toolbelt annotated-types lxml tomlkit werkzeug proto-plus pynacl deprecated azure-core asn1crypto distlib importlib-resources coverage more-itertools google-cloud-storage websocket-client
# import boto3; 太慢，先去掉
assert '测试 top100 库导入' -- "python -c 'import urllib3; import botocore; import requests; import certifi; import typing_extensions; import idna; import charset_normalizer; import dateutil; import packaging; import s3transfer; import aiobotocore; import yaml; import six; import numpy; import s3fs; import fsspec; import cryptography; import cffi; import pycparser; import pandas; import importlib_metadata; import pyasn1; import rsa; import zipp; import click; import pydantic; import attrs; import jmespath; import platformdirs; import pytz; import jinja2; import awscli; import colorama; import markupsafe; import jwt; import tomli; import wrapt; import filelock; import cachetools; import pluggy; import requests_oauthlib; import virtualenv; import pytest; import oauthlib; import pyarrow; import docutils; import exceptiongroup; import pyasn1_modules; import jsonschema; import iniconfig; import scipy; import pyparsing; import aiohttp; import isodate; import soupsieve; import sqlalchemy; import bs4; import psutil; import pydantic_core; import pygments; import multidict; import OpenSSL; import yarl; import decorator; import tzdata; import async_timeout; import tqdm; import frozenlist; import PIL; import aiosignal; import greenlet; import openpyxl; import et_xmlfile; import requests_toolbelt; import annotated_types; import lxml; import tomlkit; import werkzeug; import nacl; import deprecated; import azure; import asn1crypto; import distlib; import importlib_resources; import coverage; import more_itertools; import websocket;'"


loginfo "=== test venv ==="
rm -rf /tmp/test/venv && mkdir -p /tmp/test/venv
cd /tmp/test/venv
assert 'venv 测试前置准备确保 requests 已安装到系统 python 中' -- pip install requests
assert python -m venv defaultvenv
source ./defaultvenv/bin/activate
assert 'venv 和系统库隔离 requests 找不到' -- "! python -c 'import requests'"
assert_regex /tmp/test/venv/defaultvenv/bin/pip which pip
assert_regex /tmp/test/venv/defaultvenv/bin/python which python
assert_regex '"hello world"' python $script_path/../../data/python/hello/main.py
assert '测试 venv pip 简单安装' -- pip install requests 
assert '测试 venv mysqlclient 安装' -- "nix-env -iA nixpkgs.libmysqlclient && pip install mariadb && python -c 'import mariadb'"
deactivate
cd $script_path/../..


loginfo "=== test poerty project ==="
rm -rf /tmp/test/poerty && mkdir -p /tmp/test/poerty
cd /tmp/test/poerty
assert poetry new myproject312
cd myproject312
assert poetry config virtualenvs.in-project true
assert poetry install
assert_regex '3.12' ./.venv/bin/python -V
assert 'poerty 测试前置准备确保 requests 已安装到系统 python 中' -- pip install requests
source ./.venv/bin/activate
assert 'poerty venv 和系统库隔离 requests 找不到' -- "! python -c 'import requests'"
assert_regex /tmp/test/poerty/myproject312/.venv/bin/pip which pip
assert_regex /tmp/test/poerty/myproject312/.venv/bin/python which python
assert_regex '"hello world"' python $script_path/../../data/python/hello/main.py
assert '测试 poerty venv pip 简单安装' -- pip install requests 
assert '测试 poerty venv mysqlclient 安装' -- "nix-env -iA nixpkgs.libmysqlclient && pip install mariadb && python -c 'import mariadb'"
deactivate
cd $script_path/../..


loginfo "=== test use nix switch python version ==="
assert nix-env -iA nixpkgs.python311
assert_regex '3.11' python -V
assert '检查 python3.11 pip' -- "bash -lc 'pip -V'"
assert '测试 python3.11 pip 简单安装' -- pip install requests 
assert '测试 python3.11 mysqlclient 安装' -- "nix-env -iA nixpkgs.libmysqlclient && pip install mariadb && python -c 'import mariadb'"
assert nix-env --uninstall python3
assert_regex '3.12'  'py=$(which python) && $py -V'


# loginfo "=== test conda ==="
cp -rf ~/.bashrc ~/.bashrc_bak
assert "bash -c 'source ~/.bashrc && conda init bash'"
source ~/.bashrc
assert_regex '.conda/bin/python' which python
# fixme: 内存不够，会被 kill
# assert 'source ~/.bashrc && nix-env --uninstall mariadb-connector-c && conda install -y conda-forge::mariadb-connector-c'
# assert pip install mariadb
# assert "python -c 'import mariadb'"
```

### Rust

```bash
#!/usr/bin/env bash
set -e


script_path=$(readlink -f $(dirname "$0"))
source $script_path/../../util.sh


clear(){
    loginfo "will clear test data"
    rm -rf /tmp/test/rust
    rm -rf ~/.rustup && mkdir -p ~/.rustup
}
register_clear clear
clear



loginfo "=== start test basic env ==="
assert_regex "rsproxy-sparse" 'cat ~/.cargo/config'
assert_regex "rsproxy.cn" 'cat ~/.cargo/config'
assert which rustc cargo rust-analyzer rustc rustdoc rust-gdb rust-gdbgui rust-lldb rustup
assert_regex '.cargo/bin' 'echo $PATH'
assert_regex "'git-fetch-with-cli = true'" 'cat ~/.cargo/config'
assert_regex 'rust-analyzer.debug.engine.*vadimcn.vscode-lldb' 'cat /cloudide/workspace/.cloudide/data/Machine/settings.json'


loginfo "=== start test cargo rust hello project ==="
mkdir -p /tmp/test/rust
cd /tmp/test/rust
assert cargo new hello
cd hello
assert_regex "'Hello, world!'" cargo run
assert cargo build --release
assert_regex "'Hello, world!'" ./target/release/hello


loginfo "=== start test rustup"
# fixme: rustup 源配置
export RUSTUP_DIST_SERVER=https://rsproxy.cn
export RUSTUP_UPDATE_ROOT=https://rsproxy.cn/rustup
assert rustup install 1.80.1
assert_regex '1.80.1' rustc -V
```

## 开源 Bash 测试框架 bats 简介

上面只实现了一个测试框架最最基础的能力，是对 bash 测试框架原理的一种探索。

当然在开源有很多成熟的开源测试框架，比如（stars 截止 20240815）：

* [bats-core](https://github.com/bats-core/bats-core) 4.8k stars。
* [shunit2](https://github.com/kward/shunit2) 1.6k stars。
* [shellspec](https://github.com/shellspec/shellspec) 1.1k stars。
* [bash_unit](https://github.com/pgrange/bash_unit) 590 stars。
* [bach](https://github.com/bach-sh/bach) 549 stars。
* [assert.sh](https://github.com/lehmannro/assert.sh) 487 stars。
* [shpec](https://github.com/rylnd/shpec) 377 stars

目前 github starts 数量最多的 Bash 测试框架 bits，本部分将介绍其基本用法。

安装：

```bash
git clone https://github.com/bats-core/bats-core.git
cd bats-core
sudo ./install.sh /usr/local
```

bats 有一套自己 dsl 语法，写一个测试脚本 `test.bats`，示例如下：

```bats
#!/usr/bin/env bats

@test "true" {
  # 这里写 bash 脚本，如果相当于 set -e 执行，如果有任意一条命令失败（退出码非零），该测试失败。
  true
}

@test "false" {
  false
}
```

运行测试 `bats test.bats`，输出如下：

```
 ✓ true
 ✗ false
   (in test file test.bats, line 8)
     `false' failed

2 tests, 1 failure
```

VSCode 扩展： [jetmartin.bats](https://marketplace.visualstudio.com/items?itemName=jetmartin.bats)。

更多详见： [官网](https://bats-core.readthedocs.io/en/stable/index.html)。
