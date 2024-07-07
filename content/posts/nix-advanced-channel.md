---
title: "Nix 高级话题之 channel"
date: 2023-04-30T11:00:00+08:00
draft: true
toc: true
comments: true
tags:
  - untagged
---


> version: nix-2.22.1

## Nix Profile

## Nix Channel

```bash
# 卸载 nix
sudo rm -rf /nix ~/.nix-* ~/.local/state/nix ~/.config/nix
# 安装 nix
sh <(curl -L https://nixos.org/nix/install) --no-daemon --no-channel-add
. /home/rectcircle/.nix-profile/etc/profile.d/nix.sh
# 添加 channel 将配置添加到  ~/.nix-channels
nix-channel --add https://channels.nixos.org/nixpkgs-unstable nixpkgs
sudo apt update
sudo apt install -y cpulimit
# 限制 cpu 执行更新 channel 
cpulimit -l 1 -- nix-channel --update -vvv
# did not find cache entry for 'file:{"name":"nixpkgs-unstable","store":"/nix/store","url":"https://channels.nixos.org/nixpkgs-unstable"}'
# downloading 'https://channels.nixos.org/nixpkgs-unstable'...
# starting download of https://channels.nixos.org/nixpkgs-unstable
# finished download of 'https://channels.nixos.org/nixpkgs-unstable'; curl status = 0, HTTP status = 200, body = 1856 bytes
# acquiring write lock on '/nix/var/nix/temproots/7531'
# locking path '/nix/store/bb5kbdycl7k6fdg5ain3w4jxxh887jl7-nixpkgs-unstable'
# lock acquired on '/nix/store/bb5kbdycl7k6fdg5ain3w4jxxh887jl7-nixpkgs-unstable.lock'
# lock released on '/nix/store/bb5kbdycl7k6fdg5ain3w4jxxh887jl7-nixpkgs-unstable.lock'
# did not find cache entry for 'file:{"name":"nixexprs.tar.xz","store":"/nix/store","url":"https://releases.nixos.org/nixpkgs/nixpkgs-24.11pre642175.90338afd6177/nixexprs.tar.xz"}'
# downloading 'https://releases.nixos.org/nixpkgs/nixpkgs-24.11pre642175.90338afd6177/nixexprs.tar.xz'...
# starting download of https://releases.nixos.org/nixpkgs/nixpkgs-24.11pre642175.90338afd6177/nixexprs.tar.xz
# finished download of 'https://releases.nixos.org/nixpkgs/nixpkgs-24.11pre642175.90338afd6177/nixexprs.tar.xz'; curl status = 0, HTTP status = 200, body = 29240136 bytes
# locking path '/nix/store/s7c3bxnz9j8r2n17vwzg8ssgl6wl10pn-nixexprs.tar.xz'
# lock acquired on '/nix/store/s7c3bxnz9j8r2n17vwzg8ssgl6wl10pn-nixexprs.tar.xz.lock'
# lock released on '/nix/store/s7c3bxnz9j8r2n17vwzg8ssgl6wl10pn-nixexprs.tar.xz.lock'
# unpacking 1 channels...
# download thread shutting down

# 在上一步执行过程中，在另一个终端执行
ps -ef -w w | grep nix
# /nix/store/4z2dxs69kmhhkynyygxc4h5g28axhxjm-nix-2.23.0/bin/nix-env --profile /home/rectcircle/.local/state/nix/profiles/channels --file /tmp/nix.zaPRJ1 --install --remove-all --from-expression 'f: f { name = "nixpkgs"; channelName = "nixpkgs"; src = builtins.storePath "/nix/store/s7c3bxnz9j8r2n17vwzg8ssgl6wl10pn-nixexprs.tar.xz";  }' --quiet
# 在上一步执行过程中，在另一个终端执行 
# https://github.com/NixOS/nix/blob/2.22.1/src/libstore/unix/build/local-derivation-goal.cc#L2171
# https://github.com/NixOS/nix/blob/2.22.1/src/libstore/unix/builtins/unpack-channel.cc
cat /tmp/nix.*
#
# { name, channelName, src }:
#
# derivation {
#   builder = "builtin:unpack-channel";
#
#   system = "builtin";
#
#   inherit name channelName src;
#
#   # No point in doing this remotely.
#   preferLocalBuild = true;
# }
ls -al ~/.nix-defexpr
# channels -> /home/rectcircle/.local/state/nix/profiles/channels
# channels_root -> /nix/var/nix/profiles/per-user/root/channels
ls -al /home/rectcircle/.local/state/nix/profiles/channels
# /home/rectcircle/.local/state/nix/profiles/channels -> channels-1-link
ls -al /home/rectcircle/.local/state/nix/profiles/channels-1-link
# /home/rectcircle/.local/state/nix/profiles/channels-1-link -> /nix/store/9lryg21ajp4yx4d8qavg3jwy0crbp80f-user-environment
ls -al /nix/store/9lryg21ajp4yx4d8qavg3jwy0crbp80f-user-environment
# manifest.nix -> /nix/store/zzgjar0372zvbc1xazyf5p35aw92pspd-env-manifest.nix
# nixpkgs -> /nix/store/j13ha7fdr5n95kgk5q7nnn89h2bq6mr2-nixpkgs/nixpkgs
cat /nix/store/zzgjar0372zvbc1xazyf5p35aw92pspd-env-manifest.nix
# [ { meta = { }; name = "nixpkgs"; out = { outPath = "/nix/store/j13ha7fdr5n95kgk5q7nnn89h2bq6mr2-nixpkgs"; }; outPath = "/nix/store/j13ha7fdr5n95kgk5q7nnn89h2bq6mr2-nixpkgs"; outputs = [ "out" ]; system = "builtin"; type = "derivation"; } ]
ls -al /nix/store/j13ha7fdr5n95kgk5q7nnn89h2bq6mr2-nixpkgs/nixpkgs
# CONTRIBUTING.md
# COPYING
# default.nix
# doc
# .editorconfig
# flake.nix
# .gitattributes
# .git-blame-ignore-revs
# .github
# .gitignore
# .git-revision
# lib
# .mailmap
# maintainers
# nixos
# pkgs
# README.md
# .version -> lib/.version
# .version-suffix
(p=/nix/store/j13ha7fdr5n95kgk5q7nnn89h2bq6mr2-nixpkgs; find $p -type f; find $p -type d) | wc -l
# 70552
```
