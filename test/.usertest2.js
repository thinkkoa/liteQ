/**
 * @ author: richen
 * @ copyright: Copyright (c) - <richenlin(at)gmail.com>
 * @ license: MIT
 * @ version: 2020-01-13 17:41:23
 */
const liteQ = require('../index.js');
const helper = liteQ.helper;

module.exports = class usertest2 extends liteQ {
    init(config) {
        // 数据表字段信息
        this.pk = 'id';
        this.modelName = 'usertest2';

        this.config = {
            db_type: 'mysql',
            db_host: '192.168.0.150',
            db_port: 3306,
            db_name: 'test',
            db_user: 'test',
            db_pwd: 'test',
            db_prefix: ''
        }
        // this.tableName = 'THINK_USER';
        this.fields = {
            id: {
                type: 'integer',
                pk: true,
                auto: true,
                comment: '用户ID'
            },
            name: {
                type: 'string',
                size: 32,
                index: true,
                // required: true,
                comment: '用户名'
            }
        };
    }
}