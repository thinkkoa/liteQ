/**
 * @Author: richen 
 * @Date: 2018-02-09 15:46:34 
 * @Copyright (c) - <richenlin(at)gmail.com>
 * @Last Modified by: richen
 * @Last Modified time: 2018-04-12 15:31:56
 */
const logger = require('think_logger');
const helper = require('../helper.js');

module.exports = class {
    constructor(config) {
        this.pool = null;
    }
    /**
     * 执行查询
     * 
     * @param {any} sql 
     * @returns 
     */
    query(sql) {
        if (helper.isEmpty(sql)) {
            return Promise.reject('SQL analytic result is empty');
        }
        let connection = {};
        return this.connect().then(conn => {
            connection = conn;
            let fn = helper.promisify(connection.query, connection);
            return fn(sql);
        }).then((rows = []) => {
            connection.release();
            logger.info(sql);
            return rows;
        }).catch(err => {
            this.close();
            logger.error([err.message, '[', sql, ']']);
            return Promise.reject(err);
        });
    }
    /**
     * 执行修改
     * 
     * @param {any} sql 
     * @returns 
     */
    execute(sql) {
        if (helper.isEmpty(sql)) {
            return Promise.reject('SQL analytic result is empty');
        }
        let connection = {};
        return this.connect().then(conn => {
            connection = conn;
            let fn = helper.promisify(connection.query, connection);
            return fn(sql);
        }).then(data => {
            connection.release();
            logger.info(sql);
            if (data.insertId) {
                return data.insertId;
            }
            return data.affectedRows || 0;
        }).catch(err => {
            this.close();
            logger.error([err.message, '[', sql, ']']);
            return Promise.reject(err);
        });
    }
    /**
     * 结构迁移
     * @param schemas
     * @param config
     */
    migrate(schemas, config) {
        if (helper.isEmpty(schemas) || helper.isEmpty(config)) {
            return Promise.resolve();
        }
        let options = {
            method: 'MIGRATE',
            schema: schemas
        };
        return this.parser.buildSql(this.config, this.knexClient, config, options).then(sql => {
            if (/\n/.test(sql)) {
                let temp = sql.replace(/\n/g, '').split(';'), ps = [];
                temp.map(item => {
                    ps.push(this.execute(item));
                });
                return Promise.all(ps);
            }
            return this.execute(sql);
        });
    }
    /**
     * 执行原生语句
     * 
     * @param {any} tableName 
     * @param {any} sqlStr 
     * @returns 
     */
    native(tableName, sqlStr) {
        if (helper.isEmpty(sqlStr)) {
            return Promise.reject('_OPERATION_WRONG_');
        }
        if ((/[&(--);]/).test(sqlStr)) {
            sqlStr = sqlStr.replace(/&/g, '&amp;').replace(/;/g, '').replace(/--/g, '&minus;&minus;');
        }
        if (sqlStr.indexOf(tableName) === -1) {
            return Promise.reject('table name error');
        }
        let ouputs = this.knexClient.raw(sqlStr).toSQL();
        if (helper.isEmpty(ouputs)) {
            return Promise.reject('SQL analytic result is empty');
        }
        let connection = {};
        return this.connect().then(conn => {
            connection = conn;
            let fn = helper.promisify(connection.query, connection);
            return fn(ouputs.sql, ouputs.bindings);
        }).then((rows = []) => {
            connection.release();
            logger.info(ouputs.sql);
            return rows;
        }).catch(err => {
            this.close();
            logger.error([err.message, '[', ouputs.sql, ']']);
            return Promise.reject(err);
        });
    }
    /**
     * 增加数据
     * 
     * @param {any} data 
     * @param {any} [options={}] 
     * @returns 
     */
    add(data, options = {}) {
        options.method = 'ADD';
        options.alias = undefined;
        return this.parser.buildSql(this.config, this.knexClient, data, options).then(sql => {
            return this.execute(sql);
        }).then(result => {
            //
            return result;
        });
    }
    /**
     * 删除数据
     * 
     * @param {any} [options={}] 
     * @returns 
     */
    delete(options = {}) {
        options.method = 'DELETE';
        options.alias = undefined;
        return this.parser.buildSql(this.config, this.knexClient, options).then(sql => {
            return this.execute(sql);
        }).then(result => {
            //
            return result;
        });
    }
    /**
     * 更新数据
     * 
     * @param {any} data 
     * @param {any} [options={}] 
     * @returns 
     */
    update(data, options = {}) {
        options.method = 'UPDATE';
        options.alias = undefined;
        return this.parser.buildSql(this.config, this.knexClient, data, options).then(sql => {
            return this.execute(sql);
        }).then(result => {
            //
            return result;
        });
    }
    /**
     * 字段自增
     * 
     * @param {any} data 
     * @param {any} field 
     * @param {any} [options={}] 
     * @returns 
     */
    increment(data, field, options = {}) {
        options.method = 'INCREMENT';
        options.alias = undefined;
        options.targetField = field;
        return this.parser.buildSql(this.config, this.knexClient, data, options).then(sql => {
            return this.execute(sql);
        }).then(result => {
            //更新前置操作内会改变data的值
            if (!helper.isEmpty(data)) {
                this.update(data, options);
            }
            return result;
        });
    }
    /**
     * 字段自减
     * 
     * @param {any} data 
     * @param {any} field 
     * @param {any} [options={}] 
     * @returns 
     */
    decrement(data, field, options = {}) {
        options.method = 'DECREMENT';
        options.alias = undefined;
        options.targetField = field;
        return this.parser.buildSql(this.config, this.knexClient, data, options).then(sql => {
            return this.execute(sql);
        }).then(result => {
            //更新前置操作内会改变data的值
            if (!helper.isEmpty(data)) {
                this.update(data, options);
            }
            return result;
        });
    }
    /**
     * 统计数据条数
     * 
     * @param {any} field 
     * @param {any} [options={}] 
     * @returns 
     */
    count(field, options = {}) {
        options.method = 'COUNT';
        options.limit = [0, 1];
        options.targetField = field;
        return this.parser.buildSql(this.config, this.knexClient, options).then(sql => {
            return this.query(sql);
        }).then(result => {
            if (helper.isArray(result)) {
                if (result[0]) {
                    return result[0].count ? (result[0].count || 0) : 0;
                } else {
                    return 0;
                }
            } else {
                return result.count || 0;
            }
        });
    }
    /**
     * 统计字段求和
     * 
     * @param {any} field 
     * @param {any} [options={}] 
     * @returns 
     */
    sum(field, options = {}) {
        options.method = 'SUM';
        options.limit = [0, 1];
        options.targetField = field;
        return this.parser.buildSql(this.config, this.knexClient, options).then(sql => {
            return this.query(sql);
        }).then(result => {
            if (helper.isArray(result)) {
                if (result[0]) {
                    return result[0].sum ? (result[0].sum || 0) : 0;
                } else {
                    return 0;
                }
            } else {
                return result.sum || 0;
            }
        });
    }
    /**
     * 查询单条数据
     * 
     * @param {any} [options={}] 
     * @returns 
     */
    find(options = {}) {
        options.method = 'SELECT';
        options.limit = [0, 1];
        return this.parser.buildSql(this.config, this.knexClient, options).then(sql => {
            return this.query(sql);
        }).then(result => {
            //
            return helper.isArray(result) ? result[0] : result;
        });
    }
    /**
     * 查询多条数据
     * 
     * @param {any} [options={}] 
     * @returns 
     */
    select(options = {}) {
        options.method = 'SELECT';
        return this.parser.buildSql(this.config, this.knexClient, options).then(sql => {
            return this.query(sql);
        }).then(result => {
            //
            return result;
        });
    }
};