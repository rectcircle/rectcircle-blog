---
title: "NixOS 详解"
date: 2023-04-10T00:00:00+08:00
draft: true
toc: true
comments: true
tags:
  - untagged
---

> version: [22.11](https://nixos.org/manual/nixos/stable/release-notes.html#sec-release-22.11)

## 安装

前往 NixOS ISO [下载页](https://nixos.org/download.html#nixos-iso)，建议下载 Graphical ISO image（该镜像也可以选择最小化安装）。

参考网络上制作 Linux USB 启动盘的教程制作 USB 启动盘。然后使用该 ISO 引导启动需要安装 NixOS 的设备。然后按照图形化安装程序的步骤一键安装即可，注意：

* 键盘布局建议选择 English (US) - Default。
* 可以选择不安装桌面环境。

安装完成后，重启系统即可进入 NixOS。

## 快速配置

假设按照章节说明，选了 Minimal Installation （不安装桌面环境），需要进行一些配置才能更好的使用，大概配置如下内容。

* 使用清华源二进制缓存加速下载
* 最小化安装的 NixOS 的只提供了 nano 编辑器，Linux 用户应该更熟悉 vim，因此，安装 vim。
* NixOS 图形化安装程序并没有对 hostname 配置，在这里配置一下。
* 最小化安装的 NixOS 默认并没有开启 SSH，为了更方便的使用 NixOS，下面来开启 SSH。

和其他 Linux 发行版不同，NixOS 通过 `/etc/nixos/configuration.nix` 配置文件来配置系统的一切，使用 `sudo nano /etc/nixos/configuration.nix` 来修改该配置文件：

```nix
  # 在配置文件花括号里面，添加如下行
  nix.settings.substituters = [ "https://mirrors.tuna.tsinghua.edu.cn/nix-channels/store" ];

  # 如下部分默认配置文件均有对应的说明，搜索即可
  networking.hostName = "pve-vm-nixos"; # Define your hostname.
  environment.systemPackages = with pkgs; [
    vim # Do not forget to add an editor to edit configuration.nix! The Nano editor is also installed by default.
    wget
  ];
  services.openssh.enable = true;
```

大陆地区，从清华源获取 Channel。

```bash
sudo nix-channel --add https://mirrors.tuna.tsinghua.edu.cn/nix-channels/nixos-22.11 nixos
sudo nix-channel --update
```

将 `/etc/nixos/configuration.nix` 应用到系统中。

```bash
sudo nixos-rebuild switch
```

至此，一个最小化的 NixOS 配置完成，可通过 ssh 远程登录 NixOS。

## NixOS 设计和原理解析

## nixos-rebuild 使用说明

## 配置文件说明
