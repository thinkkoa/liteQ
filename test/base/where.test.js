/*eslint-disable */
const knex = require('knex');
const Test = require('../test-runner.js');
const baseparser = require('../../lib/parser/base.js');


describe('Query Generation ::', function () {
    describe('Grouping statements with WHERE', function () {
        it('should generate a query when an WHERE statement', function (done) {
            Test({
                outcomes: [
                    {
                        dialect: 'mysql',
                        config: {
                            db_type: 'mysql',
                            db_host: '127.0.0.1',
                            db_port: 3306,
                            db_name: 'test',
                            db_user: 'root',
                            db_pwd: '',
                            db_prefix: 'think_',
                            db_charset: 'utf8',
                            db_ext_config: {safe: true, db_log_sql: true, db_pool_size: 10}
                        },
                        options: {method: 'SELECT'},
                        parser:baseparser,
                        client: knex({client: 'mysql'}).select().from('think_user AS User'),
                        query: {
                            where: {id: {'<>': 1, '>=': 0}, name: 'rrrrrrr', or: [{name: 'aa'}, {name: 'aaa'}], not: {name: 1, id: 2}, notin: {name: [1,2,3]}},
                            limit: 1
                        },
                        sql: "select * from `think_user` as `User` where `User`.`id` <> 1 and `User`.`id` >= 0 and `User`.`name` = 'rrrrrrr' and ((`User`.`name` = 'aa') or (`User`.`name` = 'aaa')) and not (`User`.`name` = 1 and `User`.`id` = 2) and `User`.`name` not in (1, 2, 3) limit 10"
                    },
                    {
                        dialect: 'postgresql',
                        config: {
                            db_type: 'postgresql',
                            db_host: '127.0.0.1',
                            db_port: 3306,
                            db_name: 'test',
                            db_user: 'root',
                            db_pwd: '',
                            db_prefix: 'think_',
                            db_charset: 'utf8',
                            db_ext_config: {safe: true, db_log_sql: true, db_pool_size: 10}
                        },
                        options: {method: 'SELECT'},
                        parser:baseparser,
                        client: knex({client: 'mysql'}).select().from('think_user AS User'),
                        query: {
                            where: {id: {'<>': 1, '>=': 0}, name: 'rrrrrrr', or: [{name: 'aa'}, {name: 'aaa'}], not: {name: 1, id: 2}, notin: {name: [1,2,3]}},
                            limit: 1
                        },
                        sql: "select * from `think_user` as `User` where `User`.`id` <> 1 and `User`.`id` >= 0 and `User`.`name` = 'rrrrrrr' and ((`User`.`name` = 'aa') or (`User`.`name` = 'aaa')) and not (`User`.`name` = 1 and `User`.`id` = 2) and `User`.`name` not in (1, 2, 3) limit 10"
                    }
                ]
            }, done);
        });
        it('should generate a query when an WHERE statement', function (done) {
            Test({
                outcomes: [
                    {
                        dialect: 'mysql',
                        config: {
                            db_type: 'mysql',
                            db_host: '127.0.0.1',
                            db_port: 3306,
                            db_name: 'test',
                            db_user: 'root',
                            db_pwd: '',
                            db_prefix: 'think_',
                            db_charset: 'utf8',
                            db_ext_config: {safe: true, db_log_sql: true, db_pool_size: 10}
                        },
                        options: {method: 'SELECT'},
                        parser:baseparser,
                        client: knex({client: 'mysql'}).select().from('think_user AS User'),
                        query: {
                            where: {or: [{name: {'like': '%aa%'}}, {memo: {'like': '%aa%'}}]},
                            limit: 1
                        },
                        sql: "select * from `think_user` as `User` where ((`User`.`name` like '%aa%') or (`User`.`memo` like '%aa%')) limit 10"
                    },
                    {
                        dialect: 'postgresql',
                        config: {
                            db_type: 'postgresql',
                            db_host: '127.0.0.1',
                            db_port: 3306,
                            db_name: 'test',
                            db_user: 'root',
                            db_pwd: '',
                            db_prefix: 'think_',
                            db_charset: 'utf8',
                            db_ext_config: {safe: true, db_log_sql: true, db_pool_size: 10}
                        },
                        options: {method: 'SELECT'},
                        parser:baseparser,
                        client: knex({client: 'mysql'}).select().from('think_user AS User'),
                        query: {
                            where: {or: [{name: {'like': '%aa%'}}, {memo: {'like': '%aa%'}}]},
                            limit: 1
                        },
                        sql: "select * from `think_user` as `User` where ((`User`.`name` like '%aa%') or (`User`.`memo` like '%aa%')) limit 10"
                    }
                ]
            }, done);
        });
    });
});
