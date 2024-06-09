---
title: "Nix 高级话题之 profile"
date: 2023-04-30T11:00:00+08:00
draft: true
toc: true
comments: true
tags:
  - untagged
---


> version: nix-2.22.1

local-overlay

```bash
# 在宿主机安装 nix，并 nix-env 安装 go，参考：
# https://bytedance.larkoffice.com/docx/G8SLdpqiUoL2h2xfOUFcHQ4mnyc

# sudo su root
rm -rf /tmp/nix-local-overlay/nix-store-upper
docker rm -f nix-local-overlay
# 在宿主机安装 nix，并通过 nix-env 安装 go
# docker 使用 busybox:latest 镜像，启动 nix-local-overlay 镜像
# --security-opt 必须加，否则会报错 error: Operation not permitted
mkdir -p /tmp/nix-local-overlay/nix-store-upper /tmp/nix-local-overlay/nix-store-work
docker run --security-opt seccomp=unconfined --user root -d --name nix-local-overlay -v /nix:/nix-lower/nix:ro -v /tmp/nix-local-overlay/nix-store-upper:/nix-store-upper -v /tmp/nix-local-overlay/nix-store-work:/nix-store-work busybox:latest tail -f /dev/null

# 手动 overlayfs
docker inspect nix-local-overlay | grep MergedDir # 获取 rootfs，并 cd 进入
# cd 上一步
mkdir -p nix/store
mount -t overlay overlay -o lowerdir=/nix/store,upperdir=/tmp/nix-local-overlay/nix-store-upper,workdir=/tmp/nix-local-overlay/nix-store-work $MergedDir/nix/store # 注意：这里 -o 必须使用宿主机所在的原始路径
# docker inspect nix-local-overlay | grep Pid
# nsenter -t 4004663 -m bash

# 进入容器
docker exec -it nix-local-overlay sh
# 添加用户
adduser -u 1000 nix # 输入密码
chown nix:nix /nix /nix/store
su nix
cd ~
touch ~/.profile
# 安装
wget http://nix.byted.org/install
sh install --no-daemon --no-channel-add
source ~/.profile
which nix
# 配置
mkdir -p ~/.config/nix && cat > ~/.config/nix/nix.conf <<EOF
substituters = https://nix.byted.org/cache
sandbox = false
store = local-overlay://?lower-store=%2Fnix-lower%3Fread-only%3Dtrue&upper-layer=/nix-store-upper&check-mount=false
extra-experimental-features = nix-command flakes local-overlay-store read-only-local-store
gc-reserved-space = 0
EOF
echo 'https://nix.byted.org/channel/nixpkgs/nixpkgs-unstable nixpkgs' > ~/.nix-channels

# 验证
nix eval  --expr '1 + 2'
nix-channel --update
nix-env -iA nixpkgs.go # 秒装
# 去宿主机看，upper 层没有 go，直接复用 lower 的
ls -al /tmp/nix-local-overlay/nix-store-upper
```

nix help-stores --extra-experimental-features nix-command

https://nix.dev/manual/nix/2.22/store/types/experimental-local-overlay-store
