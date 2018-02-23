/**
 * @Author: richen 
 * @Date: 2018-02-09 16:35:40 
 * @Copyright (c) - <richenlin(at)gmail.com>
 * @Last Modified by: richen
 * @Last Modified time: 2018-02-23 19:29:50
 */
const helper = require('../lib/helper.js');
const liteQ = require('../index.js');

class user extends liteQ {
    init(config){
        // 数据表字段信息
        this.fields = {
            id: {
                type: 'integer',
                primaryKey: true
            }
        };
        this.modelName = 'user';
    }
}
process.env.NODE_ENV = 'development';
// const model = new user({
//     db_type: 'postgresql',
//     db_host: '127.0.0.1',
//     db_port: 5432,
//     db_name: 'test',
//     db_user: 'root',
//     db_pwd: 'richenlin',
//     db_prefix: ''
// });
const model = new user({
    db_type: 'mysql',
    db_host: '127.0.0.1',
    db_port: 3306,
    db_name: 'test',
    db_user: 'root',
    db_pwd: 'richenlin',
    db_prefix: 'think_'
});
let now = Date.now(), ss = 0;
 
// return model.where().find()
// return model.where({id: 11}).delete()
// return model.update({name:'hahahaha', id: 1})
// return model.increment('profile', 1, {where: {name:'hahahaha', id: 1}})
// return model.decrement('profile', 1, {where: {name:'hahahaha', id: 1}})
// return model.count()
// return model.select()
return model.countSelect()
.then(res => {
    ss = Date.now();
    echo(`${ss - now}ms -- ${JSON.stringify(res)}`);
    return model.where().find();
}).then(ress => {
    echo(`${Date.now() - ss}ms -- ${JSON.stringify(ress)}`);
    process.exit();
}).catch(e => {
    // echo(e);
    process.exit();
});