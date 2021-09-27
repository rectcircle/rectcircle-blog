---
title: "常见的权限模型"
date: 2021-09-27T16:11:13+08:00
draft: false
toc: true
comments: true
tags:
  - untagged
---

## 名词定义

* 资源 (Subject)，是后端系统对实体的抽象，需要进行权限控制的目标（暂不用 Resource 名词）
* 主体 (Principal)，表示一个或者多个用户，对资源操作的发起方
* 权限 (Permission)，动词，表示主体对资源的一种操作
* 角色 (Role)，名词，表示一组权限的集合

## ACL & DCL

> [wikipedia - ACL](https://en.wikipedia.org/wiki/Access-control_list)

access-control list (ACL) 访问控制表。逻辑上，每种资源都拥有一张 acls 表，该表主要有两个字段：主体和赋予的权限集合。包含 Resource、Principal 和 Permission 三种实体

关系

```
                                                            |-------------> Permission （读）
                      |------------> Principal （用户 1）------------------->  Permission （写）
Subject （文件 A）-----
                      |------------> Principal （用户组 2）----------------->  Permission （读）
```

表设计： `acls`

| 约束 | 字段名 | 数据类型 |  描述 |
|-----|------|----------|--------|
| PK  | id   | bigint unsigned | 主键 |
| UNIQ_SUBJECT(1)     | subject_type | varchar(32) | 资源类型 |
| UNIQ_SUBJECT(2)     | subject_id | varchar(64) | 资源 id |
| UNIQ_PRINCIPAL(1)    | principal_type | varchar(36) | 访问主体类型 |
| UNIQ_PRINCIPAL(2)    | principal_id | varchar(64) | 访问主体 id |
|     | permission | varchar(32)   | 权限标识符 |

ACL 主要应用场景为：文件系统访问控制、网络控制等以资源为核心抽象的系统。

DLC 相较 ALC 区别在于，“自主（Discretionary）”控制即，拥有该权限的用户可以将权限赋给其他用户

## MAC

Mandatory Access Control  (MAC) 强制访问控制，适用于不同密级保密场景，可以看如下一个例子：

```
资源配置表
        资源: 财务文档
                主体: 财务人员
                等级：机密级
                操作：查看
主体配置表
    
        主体: 李女士
                类别: 财务人员
                等级：机密级
```

## RBAC

> [基于 RBAC 权限模型的架构设计](https://tsejx.github.io/blog/architect-design-based-on-rbac/)

Role Based Access Control (RBAC) 基于角色的权限访问控制。在逻辑上，可以为每个 User 赋予几种 Role，另外 Role 关联几个权限。包含 User Role 和 Permission 三种实体。

![rbac](/image/permission-model-rbac.png)

RBAC 主要应用场景为：企业信息管理系统。

## ABAC

Attribute-Based Access Control (ABAC) 基于属性的权限验证。通过编写权限规则 + 规则引擎来实现权限控制。针对复杂场景可以使用该模型，但是不够直观，理解比较困难。更多参见：[文章](https://juejin.cn/post/6941734947551969288#heading-5)

## Reference

* https://zhuanlan.zhihu.com/p/70548562
* https://www.jianshu.com/p/ce0944b4a903
