/**
 * @Author: richen 
 * @Date: 2018-02-09 16:35:40 
 * @Copyright (c) - <richenlin(at)gmail.com>
 * @Last Modified by: richen
 * @Last Modified time: 2018-02-27 10:55:38
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
        this.modelName = 'User';
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
    db_prefix: ''
});

//查询测试
let now = Date.now(), ss = 0;
return model
.where({id: {'<>': 1, '>=': 0}, name: 'rrrrrrr', or: [{name: 'aa'}, {name: 'aaa'}], not: {name: 1, id: 2}, notin: {name: [1,2,3]}}).find()
// .where({or: [{name: {'like': '%aa%'}}, {memo: {'like': '%aa%'}}]}).find()
// .where({id: {'>=': 0}}).count()
// .where({id: {'>=': 0}}).sum('id')
// .where({id: {'>=': 0}}).select()
// .where({name: {'like': 'r%'}}).find()
// .where({not: {name: 'rrrrrrrrrrrrr', id: 1}}).select()
// .where({notin: {'id': [1,2,3]}}).select()
// .where({name: {'like': '%a'}}).select()
// .where({id: [1,2,3]}).select()

// .where({id: {'<>': 1, '>=': 0, notin: [1,2,3]}, name: ['aa', 'rrrrrrr'], notin: {'id': [1,2,3], num: [1,2,3]}, not: {name: '', num: [1,2,3]}, memo: {'like': '%a'}, or: [{name: 'aa', id: 1}, {name: 'rrrrrrr', id: {'>': 1}}]}).find()
// .where({'and': {id: 1, name: 'aa'}}).find()//and做key
// .where({or: [{id: 1, name: {or: [{name: 'aa'}, {memo: 'aa'}]}}, {memo: 'aa'}]}).find()//or嵌套
// .where({in: {id: [1,2,3], num: [2,3]}}).find()//in做key
// .where({'operator': {id: {'<>': 1, '>=': 0}}}).find()//operator做key
// .select({field: 'id', limit: 1, order: {id: 'desc'}, where: {name: {'<>': '', not: 'aa', notin: ['aa', 'rrr'], like: '%a'}}}) //options高级用法

// .where({id: {'<>': 1, '>=': 2, '>': 0,'<': 100, '<=': 10}}).alias('test').select()
// .countSelect()
// .join([{from: 'Profile', alias: 'pfile', on: {or: [{profile: 'id'}], profile: 'id'}, field: ['id as aid', 'test'], type: 'left'}]).find({field: ['id']})
// .field(['id','name']).join([{from: 'Profile', on: {or: [{profile: 'id'}, {name: 'test'}], profile: 'id'}, field: ['id', 'test'], type: 'left'}]).countSelect({field: ['name', 'num']})
//     .select({field: ['id','name'], join: [{from: 'Profile', on: {or: [{profile: 'id'}, {name: 'test'}], profile: 'id'}, field: ['Profile.id as pid', 'test'], type: 'left'}]})
// .field(['id', 'name']).where({id: {'>=': 0}}).group('name').countSelect()
// .query('select * from think_user where id = 1')
// .where({id:1}).increment('num', 1)
//     .where({id:1}).decrement('num', 1)

//.add({name: 'qqqesddfsdqqq'})

.then(ress => {
    echo(`${Date.now() - ss}ms -- ${JSON.stringify(ress)}`);
    process.exit();
}).catch(e => {
    // echo(e);
    process.exit();
});


//事务测试
// return model.transaction(function *(t) {
//     // for (var i = 1; i < 5; i++) {
//     //     yield model.add({name: 'rrrrrrrrrrrrr'});
//     //     yield model.add({name: 'rrrrrrr'});
//     //     yield model.add({name: 'rrrrrrrrrrrrr'});
//     // }
//     //Promise.all并行
//     // var ps = [];
//     // for (var i = 1; i < 5; i++) {
//     //     ps.push(model.add({name: 'rrrrrrrrrrrrr'}));
//     //     ps.push(model.add({name: 'rrrr'}));
//     //     ps.push(model.add({name: 'rrrrrrrrrrrrr'}));
//     // }
//     // return Promise.all(ps);

//     //跨模型执行
//     yield model.add({name: '11111111111111111'});
//     let profileModel = yield (new Profile(config)).initDB(t);
//     yield profileModel.add({test: 'rrrtest'});
// });