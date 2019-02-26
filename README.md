# liteQ

[![npm version](https://badge.fury.io/js/liteq.svg)](https://badge.fury.io/js/liteq)
[![Build Status](https://travis-ci.org/thinkkoa/liteQ.svg?branch=master)](https://travis-ci.org/thinkkoa/liteQ)

QueryBuilder for JavaScript. Supports MySQL, PostgreSQL, MariaDB, SQLite, MS SQL Server, Oracle and more. Works in NodeJS.

-> 2.x 性能提升50%!!!

# Installation

```
npm install liteq --save
```

# Example

### 创建模型

创建 user.js文件，示例代码如下：


```js
const liteQ = require('liteq');

module.exports = class extends liteQ {
    // 构造方法
    init(){
        // 模型名称,映射实体表 user
        this.modelName = 'user';
        // 数据表主键
        this.pk = 'id';
    }
}

```

### 实例化模型

```js
const user = require("./user.js");
//数据源配置
let config = {
    db_type: 'mysql', // 数据库类型,支持mysql,postgressql,sqlite3,oracle,mssql
    db_host: '127.0.0.1', // 服务器地址
    db_port: 3306, // 端口
    db_name: 'test', // 数据库名
    db_user: 'root', // 用户名
    db_pwd: '', // 密码
};

//实例化
let userModel = new user(config);
```

### CURD

```js

// add
let result = await userModel.add({"name": "张三"});

// delete
result = await userModel.where({id: 1}).delete();

// update
result = await userModel.where({id: 2}).update({"name": "李四"});

// select 
result = await userModel.where({id: 3}).find(); //limit 1
result = await userModel.where({"name": {"<>": ""}}).select(); //query name is not null


```
# document
https://thinkkoa.org/orm/query.jhtml

# License

MIT
