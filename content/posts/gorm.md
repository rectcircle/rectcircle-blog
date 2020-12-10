---
title: "GORM"
date: 2020-12-10T11:26:31+08:00
draft: false
toc: true
comments: true
tags:
  - golang
  - 后端
---

> 版本：GORM2 （https://github.com/go-gorm/gorm v1.20.8）
>
> 实验代码：[rectcircle/gorm-learn](https://github.com/rectcircle/gorm-learn)

参考

* [官方](https://gorm.io/zh_CN/)

## 入门

### Hello world

创建项目

```bash
mkdir gorm-learn
cd gorm-learn
go mod init github.com/rectcircle/gorm-learn
```

安装依赖

```bash
# 核心依赖
go get -u gorm.io/gorm
# 测试用 sqlite 驱动
go get -u gorm.io/driver/sqlite
```

编写代码 `quickstart/main.go`

```go
package main

import (
	"log"
	"os"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// Product - 测试的entity
type Product struct {
	gorm.Model
	Code  string
	Price uint
}

func main() {

	// 打开日志
	newLogger := logger.New(
		log.New(os.Stdout, "\r\n", log.LstdFlags), // io writer
		logger.Config{
			LogLevel: logger.Info, // Log level
		},
	)

	db, err := gorm.Open(sqlite.Open("test.db"), &gorm.Config{Logger: newLogger})
	if err != nil {
		panic("failed to connect database")
	}

	// 迁移 schema
	db.AutoMigrate(&Product{})

	// Create
	db.Create(&Product{Code: "D42", Price: 100})

	// Read
	var product Product
	db.First(&product, 1)                 // 根据整形主键查找
	db.First(&product, "code = ?", "D42") // 查找 code 字段值为 D42 的记录

	// Update - 将 product 的 price 更新为 200
	db.Model(&product).Update("Price", 200)
	// Update - 更新多个字段
	db.Model(&product).Updates(Product{Price: 200, Code: "F42"}) // 仅更新非零值字段
	db.Model(&product).Updates(map[string]interface{}{"Price": 200, "Code": "F42"})

	// Delete - 删除 product
	db.Delete(&product, 1)
}
```

运行

```bash
go run ./quickstart
```

### 模型声明

GORM 倾向于约定，而不是配置。默认情况下，GORM 使用 `ID` 作为主键，使用结构体名的 `蛇形复数`（即 `snake_cases`） 作为表名，字段名的 `蛇形` （即 `snake_case`） 作为列名，并使用 `CreatedAt`、`UpdatedAt` 字段追踪创建、更新时间

`gorm.Model` 包含id、创建时间、更新时间、删除时间，可用于嵌入

更多参见[官方文档](https://gorm.io/zh_CN/docs/models.html)

### 连接到数据库

GORM 官方支持的数据库类型有： MySQL, PostgreSQL, SQlite, SQL Server

更多参见[官方文档](https://gorm.io/zh_CN/docs/connecting_to_the_database.html)

## 更多

参见[官方文档](https://gorm.io/zh_CN/docs/)（十分完善丰富，直接看官方文档即可）
