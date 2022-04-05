---
title: "Podman Buildah Skopeo"
date: 2022-01-02T01:08:23+08:00
draft: true
toc: true
comments: true
tags:
  - untagged
---

```
# 安装
sudo apt install libgpgme-dev libassuan-dev libbtrfs-dev libdevmapper-dev pkg-config
git clone https://github.com/containers/skopeo $GOPATH/src/github.com/containers/skopeo
cd $GOPATH/src/github.com/containers/skopeo && make bin/skopeo
make bin/skopeo
sudo cp ./bin/skopeo /usr/local/bin
# docker 模式
skopeo --insecure-policy copy docker://nginx:1.21.6 docker-archive:/$(pwd)/nginx-docker.tar
mkdir nginx-docker && tar -xvf nginx-docker.tar -C nginx-docker
# oci
skopeo --insecure-policy copy docker://nginx:1.21.6 oci:$(pwd)/nginx-oci:test1
mkdir nginx-oci && tar -xvf nginx-oci.tar -C nginx-oci
# dir
skopeo --insecure-policy copy docker://nginx:1.21.6 dir:$(pwd)/nginx-dir
```

https://xie.infoq.cn/article/a7254c5d64fcb3be8d6822415

rootless

https://indico.cern.ch/event/757415/contributions/3421994/attachments/1855302/3047064/Podman_Rootless_Containers.pdf
https://developers.redhat.com/blog/2020/09/25/rootless-containers-with-podman-the-basics
https://github.com/containers/podman/blob/main/docs/tutorials/rootless_tutorial.md

container in container

https://www.redhat.com/sysadmin/podman-inside-container

https://stackoverflow.com/questions/56032747/how-to-run-podman-from-inside-a-container
