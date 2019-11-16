---
title: "Antlr4语法分析器"
date: 2019-11-05T14:53:33+08:00
draft: false
toc: true
comments: true
tags:
  - untagged
---

> https://www.antlr.org/
> [实验项目](https://github.com/rectcircle/antlr4-learn)

## 安装

```bash
cd /usr/local/lib
sudo curl -O https://www.antlr.org/download/antlr-4.7.2-complete.jar
export CLASSPATH=".:/usr/local/lib/antlr-4.7.2-complete.jar:$CLASSPATH"
alias antlr4='java -jar /usr/local/lib/antlr-4.7.2-complete.jar'
alias grun='java org.antlr.v4.gui.TestRig'
```

## 开发环境搭建

> 介绍VSCode开发环境

安装插件： https://marketplace.visualstudio.com/items?itemName=mike-lischke.vscode-antlr4

## 简单示例

实现一个支持整形四则运算的解释器

### 创建测试项目

```bash
mvn archetype:generate -DarchetypeArtifactId="archetype-quickstart-jdk8" -DarchetypeGroupId="com.github.ngeor" -DarchetypeVersion="1.2.0"
```

添加依赖

```xml
<dependency>
    <groupId>org.antlr</groupId>
    <artifactId>antlr4</artifactId>
    <version>4.7.2</version>
</dependency>
```

### 添加语法文件并生成代码

测试语法文件（语法类似扩展巴科斯范式）

`src/main/java/cn/rectcircle/antlr4test/Expr.g4`

```g
grammar Expr;

prog: stat+;

stat:
	expr NEWLINE			# printExpr
	| ID '=' expr NEWLINE	# assign
	| NEWLINE				# blank;

expr:
	expr op = ('*' | '/') expr		# MulDiv
	| expr op = ('+' | '-') expr	# AddSub
	| INT							# int
	| ID							# id
	| '(' expr ')'					# parens;

MUL: '*'; // assigns token name to '*' used above in grammar
DIV: '/';
ADD: '+';
SUB: '-';
ID: [a-zA-Z]+;
INT: [0-9]+;
NEWLINE: '\r'? '\n';
WS: [ \t]+ -> skip;
```

上述代码描述了 支持int类型的四则运算的表达式

生成代码

```bash
antlr4 src/main/java/cn/rectcircle/antlr4test/Expr.g4 -o src/main/java/cn/rectcircle/antlr4test/parser -package cn.rectcircle.antlr4test.parser -visitor -no-listener -Xexact-output-dir
```

* 默认生成在g4文件所在目录
* -o dir 指定目录将生成到 不指定 `-Xexact-output-dir` 将生成到 `$dir/src/main/java/cn/rectcircle/antlr4test` 下
* -Xexact-output-dir 指定后 将直接生成到 -o 指定的目录下
* -visitor 表示生成visitor接口，用于实现树节点遍历控制

### Visitor

```java
package cn.rectcircle.antlr4test;

import java.util.HashMap;


import cn.rectcircle.antlr4test.parser.ExprBaseVisitor;
import cn.rectcircle.antlr4test.parser.ExprParser;
import cn.rectcircle.antlr4test.parser.ExprParser.AddSubContext;
import cn.rectcircle.antlr4test.parser.ExprParser.BlankContext;
import cn.rectcircle.antlr4test.parser.ExprParser.IdContext;
import cn.rectcircle.antlr4test.parser.ExprParser.PrintExprContext;
import cn.rectcircle.antlr4test.parser.ExprParser.ProgContext;

class EvalException extends RuntimeException {
    private static final long serialVersionUID = 1743556669279352945L;
    private final String message;

    public EvalException(String message) {
        this.message = message;
    }

    public String getMessage() {
        return message;
    }
}

public class EvalVisitor extends ExprBaseVisitor<Integer> {

    private HashMap<String, Integer> vars;
    private int resultId = 0;
    private int line = 0;
    private boolean quickFailed = true;

    public EvalVisitor() {
        this(true);
    }

    public EvalVisitor(boolean quickFailed) {
        this.quickFailed = quickFailed;
        this.vars = new HashMap<String, Integer>();
        this.resultId = 0;
        this.line = 0;
    }

    @Override
    public Integer visitProg(ProgContext context) {
        try {
            return super.visitProg(context);
        } catch (EvalException e) {
            if (quickFailed) {
                System.out.println(e.getMessage());
            }
            return null;
        }
    }

    @Override
    public Integer visitPrintExpr(PrintExprContext ctx) {
        try {
            line++;
            String id = "res" + resultId;
            resultId++;
            Integer value = visit(ctx.expr());
            this.vars.put(id, value);
            System.out.println(id + ": " + value);
            return value;
        } catch (EvalException e) {
            if (quickFailed) {
                throw e;
            } else {
                System.out.println(e.getMessage());
                return null;
            }
        }

    }

    @Override
    public Integer visitAssign(ExprParser.AssignContext ctx) {
        try {
            line++;
            String id = ctx.ID().getText();
            Integer value = visit(ctx.expr());
            this.vars.put(id, value);
            System.out.println(id + ": " + value);
            line++;
            return value;
        } catch (EvalException e) {
            if (quickFailed) {
                throw e;
            } else {
                System.out.println(e.getMessage());
                return null;
            }
        }
    }

    @Override
    public Integer visitBlank(BlankContext ctx) {
        line++;
        return super.visitBlank(ctx);
    }

    @Override
    public Integer visitMulDiv(ExprParser.MulDivContext ctx) {
        Integer left = visit(ctx.expr(0));
        Integer right = visit(ctx.expr(1));

        if (ctx.op.getType() == ExprParser.MUL) {
            return left * right;
        } else {
            return left / right;
        }
    }

    @Override
    public Integer visitAddSub(AddSubContext ctx) {
        Integer left = visit(ctx.expr(0));
        Integer right = visit(ctx.expr(1));

        if (ctx.op.getType() == ExprParser.ADD) {
            return left + right;
        } else {
            return left - right;
        }
    }

    @Override
    public Integer visitInt(ExprParser.IntContext ctx) {
        try {
            return Integer.valueOf(ctx.INT().getText());
        } catch (NumberFormatException e) {
            throw new EvalException("line " + line + ": 数值解析失败 " + ctx.INT().getText());
        }
    }

    @Override
    public Integer visitId(IdContext ctx) {
        String id = ctx.getText();
        if (this.vars.containsKey(id)) {
            return this.vars.get(id);
        }
        throw new EvalException("line "+ line + ": 未定义的标识符 " + id);
    }
}
```

### 测试

```java
package cn.rectcircle;


import org.antlr.v4.runtime.CharStreams;
import org.antlr.v4.runtime.CommonTokenStream;

import cn.rectcircle.antlr4test.EvalVisitor;
import cn.rectcircle.antlr4test.parser.ExprLexer;
import cn.rectcircle.antlr4test.parser.ExprParser;

/**
 * Hello world!
 */
public final class App {
    private App() {
    }

    /**
     * Says hello to the world.
     * @param args The arguments of the program.
     */
    public static void main(String[] args) {
        String [] stats = {
                "1 + 2 + 3",
                "a = 6",
                "b = 2",
                "a",
                "b",
                "c = a+b",
                "a + b",
                "d",
                "c"
        };

        EvalVisitor visitor = new EvalVisitor();

        for (String stat : stats) {
            ExprLexer lexer = new ExprLexer(CharStreams.fromString(stat + "\n"));
            System.out.println(">>> " + stat);
            CommonTokenStream tokenStream = new CommonTokenStream(lexer);
            ExprParser parser = new ExprParser(tokenStream);
            visitor.visit(parser.prog());
            System.out.println();
        }

    }
}

```

输出如下

```
>>> 1 + 2 + 3
res0: 6

>>> a = 6
a: 6

>>> b = 2
b: 2

>>> a
res1: 6

>>> b
res2: 2

>>> c = a+b
c: 8

>>> a + b
res3: 8

>>> d
line 11: 未定义的标识符 d

>>> c
res5: 8

```

### 说明

该语法分析器的使用流程是：

* 定义一个语法定义文件（后缀名`.g4`）
* 通过antlr4的编译器把g4文件生成Java代码，核心文件如下（开启vistor）
  * XxxParser
  * XxxLexer
  * XxxBaseVistor
  * XxxVisitor
* 继承 XxxBaseVistor 实现逻辑，将用户输入经过antlr4创建的语法树，通过遍历转换为内部数据结构、或其他操作
