# liteQ

[![npm version](https://badge.fury.io/js/liteq.svg)](https://badge.fury.io/js/liteq)
[![Build Status](https://travis-ci.org/thinkkoa/liteQ.svg?branch=master)](https://travis-ci.org/thinkkoa/liteQ)

QueryBuilder for Node.js. Supports MySQL, PostgreSQL, MariaDB, SQLite, MS SQL Server, Oracle, and more.


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

## field(string | string[])

设置在查询中选择的列

```
// select 'aaa', 'bbb', 'ccc' from user limit 1;
userModel.field(['aaa', 'bbb', 'ccc']).find();

```

## alias(string)
设置所查询表的别名

```
// select u.id from user as u limit 1;
userModelalias('u').find();
```

## where(object)
设置查询条件，入参为object类型

### and

```js
userModel.where({ name: 'walter', state: 'new mexico' }).find();

userModel.where({ age: { '>=': 30 , '<=': 60}}).find();

```

### or

```js
// select * from think_user where (name = 'walter') or (occupation = 'teacher')
userModel.where({
    or : [
        { name: 'walter' },
        { occupation: 'teacher' }
    ]
}).find();

//select * from think_user where (id = 1 and name = walter) or (occupation ='teacher')
userModel.where({
    or : [
        { name: 'walter' , id: 1},
        { occupation: 'teacher' }
    ]
}).find();

```

### in

```js
userModel.where({
    name : ['Walter', 'Skyler']
}).find();
```

### not in

```js
userModel.where({
    name: { 'notin' : ['Walter', 'Skyler'] }
}).find();

userModel.where({
    notin: { 'name' : ['Walter', 'Skyler'] , 'id': [1, 3]}
}).find();
```

### is null

```js
userModel.where({
    name: null }
}).find();

```
### is not null

```js
userModel.where({
    not: {name: null} }
}).find();

userModel.where({
    name: {"!=": null} }
}).find();


userModel.where({
    name: {"<>": null} }
}).find();

```


### less than

```js
userModel.where({ age: { '<': 30 }}).find();
```

### less than or equal

```js
userModel.where({ age: { '<=': 30 }}).find();
```

### greater than

```js
userModel.where({ age: { '>': 30 }}).find();
```

### greater than or equal

```js
userModel.where({ age: { '>=': 30 }}).find();
```

### not equal

```js
userModel.where({ age: { '<>': 30 }}).find();

userModel.where({ age: { '!=': 30 }}).find();
```

### not

```js
userModel.where({ age: { 'not': 30 }}).find();

userModel.where({ not: { 'age': 30, 'name': 'aa' }}).find();

```

### like

```js
userModel.where({ name: { 'like': '%walter' }}).find();
userModel.where({ name: { 'like': 'walter%' }}).find();
userModel.where({ name: { 'like': '%walter%' }}).find();
```

## limit(skip: number, limit: number)
设置查询分拣的结果数量

```
// select * from user limit 20, 10;
userModel.limit(20, 10).select();
```

## order(values: object)
设置字段排序

```
//select * from user order by id desc limit 1;
userModel.order({"id": "desc"}).find();
```

## distinct(values: string[])
设置去重的字段

```
//select distinct(name) from user where name = 'aa';
userModel.distinct(["name"]).where({"name": "aa"}).select();
```
## group(values: string | string[])
设置分组查询的字段名

```
//select name from user where name = 'aa' group by age;
userModel.field(["name"]).where({"name": "aa"}).group("age").select();
```
## having(values: object)
用于分组查询的having子句. 仅可以配合group使用

```
//select name from user where name = 'aa' group by age having age > 10;
userModel.field(["name"]).where({"name": "aa"}).having({"age": {">":10}}).group("age").select();
```

## join(values: any[])
join查询
```js
//将join表字段写到field方法内，join表条件写入where
userModel
.field(['id','name','Demo.id','Demo.name'])
.join([{from: 'Demo', on: {demoid: 'id'}, type: 'inner'}])
.where({id: 1, 'Demo.name': 'test'})
.find()

//将join表字段声明在join方法的field属性内
userModel
.join([{from: 'Demo', alias: 'demo', on: {demoid: 'id'}, field: ['id', 'name'], type: 'inner'}])
.where({id: 1, 'demo.name': 'test'})
.find()
```
join方法传入的是一个数组，每一个数组元素均表示join一个表。

* from : 需要的join的模型名

* alias : 需要的join的模型查询别名

* on : join的on条件

* field : join表筛选的字段

* type : join的类型，目前支持 inner,left,right三种


## add(data: object | any[], options?: object)
新增数据

* data 新增的字段对象键值对象
* options 扩展项 

```
// insert into `user` (`name`) values ('qqqesddfsdqqq')
userModel.add({"name": "qqqesddfsdqqq"});

// insert into `user` (`name`) values ('qqqesddfsdqqq'), ('qqqesddfsdqqq')
userModel.add([{"name": "qqqesddfsdqqq"}, {"name": "qqqesddfsdqqq"}]);

```

## delete(options?: object)
删除数据

* options 扩展项 

```
// delete from `user` where `id` = 10 
userModel.where({ id: 10 }).delete();
```

## update(data: object, options?: object)
更新数据

* data 更新的字段键值对象
* options 扩展项 

```
//update `user` set `name` = 'aa' where `id` = 10
userModel.where({ id: 10 }).update({ name: 'aa' });
```

## increment(field: string, step = 1, data = {}, options?: object)
字段自增

* field 需要自增的字段名
* step 步进
* data 需要同步执行更新的其他字段数据
* options 扩展项 

```
//update `user` set `num` = `num` + 1 where `id` in (1, 2)
userModel.where({ id: [1, 2] }).increment('num', 1);
```

## decrement(field: string, step = 1, data = {}, options?: object)
字段自减

* field 需要自减的字段名
* step 步进
* data 需要同步执行更新的其他字段数据
* options 扩展项 

```
//update `user` set `num` = `num` - 1 where `id` in (1, 2)
userModel.where({ id: [1, 2] }).decrement('num', 1);
```

## count(field: string, options = {})
根据条件检索行数

* field 需要获取行数的字段名
* options 扩展项 

```
// select count(`num`) from `user` where `id` in (1, 2)
userModel.where({ id: [1, 2] }).count("num");
```


## sum(field: string, options = {})
根据条件计算字段求和

* field 需要求和的字段名
* options 扩展项 

```
// select sum(`num`) from `user` where `id` in (1, 2)
userModel.where({ id: [1, 2] }).sum("num");
```

## find(options?: object)
查询单条

* options 扩展项 

## select(options?: object)
查询多条数据

* options 扩展项 

## countSelect(options?: object)
分页查询

* options 扩展项 

## sql(options = {}, data?: object | any[]) 
生成sql语句，不同数据库会有所区别

## query(sqlStr: string, params = [])
原生语句查询

* sqlStr 原生sql语句，不同数据库有区别
* params bind模式字段名

```
userModel.query("select * from user where name='?' and age > ?", ["test", 18])
```

## transaction(fn: Function)
执行事务

* fn 事务包含的执行内容回调函数

## forUpdate(tsx: Object)
事务查询锁,必须在transaction回调函数内部使用

* tsx 事务回调函数入参.事务操作句柄

## migrate(sqlStr: string)
表结构同步到数据库

# License

MIT
