---
title: "Java Jpa Read Only Exception"
date: 2020-09-11T11:49:17+08:00
draft: false
toc: true
comments: true
tags:
  - java
---

## 异常表现

在使用 某些 MySQL 中间件时 （代理），如 MyCAT。 JPA 将抛出 `java.sql.SQLException: Connection is read-only. Queries leading to data modification are not allowed` 异常。

## 触发条件

* Spring Boot 2.0
* 使用 MySQL 中间件
* JAP
* 在直连 MySQL 时 没有任何异常，在使用中间件时出现异常

## 原因

参考：http://www.wangzhenhua.rocks/zh-hans/comment/336#comment-336

## 解决方案

### 方案1

（未验证，没理解原理）

参考：

* https://k4nz.com/Database_Management_System/1.MySQL_and_MariaDB/MySQL_Middleware/MyCat_-_A_Large_Database_Cluster/z.Error_List.html
* https://blog.csdn.net/aa292016616/article/details/82736054

MySQL 连接 添加参数 `useLocalSessionState=true`

### 方案2

绕过方案，禁掉 read only（可能存在性能问题），创建一个 MySQL Collection 的 代理，修改 `setReadOnly` 方法 ；并自定义 `DriverManagerDataSource` 数据源

创建 代理 `Collection`

```java
package xxx;

import java.sql.Array;
import java.sql.Blob;
import java.sql.CallableStatement;
import java.sql.Clob;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.NClob;
import java.sql.PreparedStatement;
import java.sql.SQLClientInfoException;
import java.sql.SQLException;
import java.sql.SQLWarning;
import java.sql.SQLXML;
import java.sql.Savepoint;
import java.sql.ShardingKey;
import java.sql.Statement;
import java.sql.Struct;
import java.util.Map;
import java.util.Properties;
import java.util.concurrent.Executor;

/**
 * http://www.wangzhenhua.rocks/zh-hans/mycat-spring-data-jpa-read-transaction
 */
@SuppressWarnings("all")
public class SqlConnectionProxy implements Connection {
    private Connection innerConnection;

    public SqlConnectionProxy(Connection innerConnection) {
        this.innerConnection = innerConnection;
        try {
            this.innerConnection.setReadOnly(false);
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }

    public <T> T unwrap(Class<T> iface) throws SQLException {
        return innerConnection.unwrap(iface);
    }

    public void setReadOnly(boolean readOnly) throws SQLException {
        innerConnection.setReadOnly(false);
    }
    // 其他方法代理 innerConnection ...
}
```

创建数据源

```java
package xxx;

import java.lang.reflect.InvocationTargetException;
import java.sql.Connection;
import java.sql.Driver;
import java.sql.SQLException;
import java.util.Properties;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.datasource.DriverManagerDataSource;

public class MyDataSource extends DriverManagerDataSource {
    private static Logger logger = LoggerFactory.getLogger(MyDataSource.class);

    private Boolean enableSqlConnectionProxy;

    @Override
    protected Connection getConnectionFromDriverManager(String url, Properties props) throws SQLException {
        try {
            Class<?> clazz = Class.forName("com.mysql.cj.jdbc.Driver");
            Driver driver = (Driver) clazz.getDeclaredConstructor().newInstance();

            Connection c = driver.connect(url, props);
            if (enableSqlConnectionProxy != null && enableSqlConnectionProxy.booleanValue()) {
                return new SqlConnectionProxy(c);
            } else {
                return c;
            }
        } catch (ClassNotFoundException e) {
            e.printStackTrace();
        } catch (InstantiationException e) {
            e.printStackTrace();
        } catch (IllegalAccessException e) {
            e.printStackTrace();
        } catch (IllegalArgumentException e) {
            e.printStackTrace();
        } catch (InvocationTargetException e) {
            e.printStackTrace();
        } catch (NoSuchMethodException e) {
            e.printStackTrace();
        } catch (SecurityException e) {
            e.printStackTrace();
        }
        return null;
    }

    public Boolean getEnableSqlConnectionProxy() {
        return enableSqlConnectionProxy;
    }

    public void setEnableSqlConnectionProxy(Boolean enableSqlConnectionProxy) {
        this.enableSqlConnectionProxy = enableSqlConnectionProxy;
    }
}
```

配置

```yaml
spring:
    datasource:
        driver-class-name: null
        hikari:
            data-source-class-name: xxx.MyDataSource
            data-source-properties:
                url: xxx
                username: xxx
                password: xxx
                enableSqlConnectionProxy: true
```

创建 bean

```java
package xxx;

import javax.sql.DataSource;

import com.zaxxer.hikari.HikariDataSource;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.StringUtils;

@Configuration
public class CoreConfigurer {

    @Bean
    @ConditionalOnProperty(
            prefix = "spring.datasource.hikari",
            name = "data-source-class-name",
            havingValue = "xxx.MyDataSource")
    @ConfigurationProperties(prefix = "spring.datasource.hikari")
    public DataSource dataSource(DataSourceProperties properties) {
        HikariDataSource dataSource = new HikariDataSource();
        if (StringUtils.hasText(properties.getName())) {
            dataSource.setPoolName(properties.getName());
        }
        return dataSource;
    }

}
```
