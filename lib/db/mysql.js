/**
 * @Author: richen 
 * @Date: 2018-02-09 15:46:34 
 * @Copyright (c) - <richenlin(at)gmail.com>
 * @Last Modified by: richen
 * @Last Modified time: 2018-03-07 18:51:38
 */
const knex = require('knex');
const mysql = require('mysql');
const logger = require('think_logger');
const helper = require('../helper.js');
const parser = require('../parser/base.js');

const defaultConfig = {
    db_type: 'mysql',
    db_host: '127.0.0.1',
    db_port: '3306',
    db_name: 'test',
    db_user: '',
    db_pwd: '',
    db_prefix: 'think_',
    db_charset: 'utf8',
    db_timeout: 30,
    db_ext_config: {
        db_pool_size: 10, //连接池大小
    }
};

module.exports = class {
    constructor(config) {
        this.config = helper.extend(defaultConfig, config, true);
        this.knexClient = knex({
            client: 'mysql'
        });
        this.parser = new parser(this.config);
        //node-mysql2 not support utf8 or utf-8
        let charset = (this.config.encoding || '').toLowerCase();
        if (charset === 'utf8' || charset === 'utf-8') {
            this.config.charset = 'UTF8_GENERAL_CI';
        }
        this.pool = null;
        this.transTimes = 0; //transaction times
    }
    /**
     * 
     * 
     * @param {number} [connnum=0] 
     * @returns 
     */
    connect(connnum = 0) {
        let deferred = helper.getDefer();
        if (!this.pool) {
            this.pool = mysql.createPool({
                database: this.config.db_name,
                host: this.config.db_host || '127.0.0.1',
                user: this.config.db_user || 'root',
                password: this.config.db_pwd || '',
                port: this.config.db_port || 3306,
                encoding: this.config.db_charset || 'utf8',
                connectTimeout: this.config.db_timeout * 1000 || 10000, //try connection timeout
                connectionLimit: this.config.db_ext_config.db_pool_size || 10
            });
            this.pool.on('error', (err) => {
                if (connnum < 3) {
                    connnum++;
                    deferred.resolve(this.connect(connnum));
                } else {
                    this.close();
                    deferred.reject(err);
                }
            });
        }
        this.pool.getConnection((err, conn) => {
            if (err) {
                if (connnum < 3) {
                    connnum++;
                    deferred.resolve(this.connect(connnum));
                } else {
                    this.close();
                    deferred.reject(err);
                }
            } else {
                deferred.resolve(conn);
            }
        });
        return deferred.promise;
    }
    /**
     * 
     * 
     */
    close() {
        if (this.pool) {
            this.pool.end();
        }
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
            logger.error(sql);
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
            logger.error(sql);
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
        // let tableName = schemas.table;
        // return this.execute(this.knexClient.schema.dropTableIfExists(tableName).toString()).then(() => {
        let options = {
            method: 'MIGRATE',
            schema: schemas
        };
        return this.parser.buildSql(this.knexClient.schema, config, options).then(sql => {
            if (/\n/.test(sql)) {
                let temp = sql.replace(/\n/g, '').split(';'), ps = [];
                temp.map(item => {
                    ps.push(this.execute(item));
                });
                return Promise.all(ps);
            }
            return this.execute(sql);
        });
        // });
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
            logger.error(ouputs.sql);
            return Promise.reject(err);
        });
    }
    /**
     * 开启事务
     * 
     * @returns 
     */
    startTrans() {
        if (this.transTimes === 0) {
            this.transTimes++;
            return this.execute('START TRANSACTION');
        }
        return Promise.resolve();
    }
    /**
     * 提交事务
     * 
     * @returns 
     */
    commit() {
        if (this.transTimes > 0) {
            this.transTimes = 0;
            return this.execute('COMMIT').then(data => {
                this.close();
                return data;
            });
        }
        return Promise.resolve();
    }
    /**
     * 回滚事务
     * 
     * @returns 
     */
    rollback() {
        if (this.transTimes > 0) {
            this.transTimes = 0;
            return this.execute('ROLLBACK').then(data => {
                this.close();
                return data;
            });
        }
        return Promise.resolve();
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
        let knexCls = this.knexClient.insert(data).from(options.table);
        return this.parser.buildSql(knexCls, data, options).then(sql => {
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
        let knexCls = this.knexClient.del().from(options.table);
        return this.parser.buildSql(knexCls, options).then(sql => {
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
        let knexCls = this.knexClient.update(data).from(options.table);
        return this.parser.buildSql(knexCls, data, options).then(sql => {
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
        options.method = 'UPDATE';
        options.alias = undefined;
        let knexCls = this.knexClient;
        if (data[field]) {
            knexCls = knexCls.increment(field, data[field]);
            delete data[field];
        }
        knexCls = knexCls.from(options.table);
        return this.parser.buildSql(knexCls, data, options).then(sql => {
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
        options.method = 'UPDATE';
        options.alias = undefined;
        let knexCls = this.knexClient;
        if (data[field]) {
            knexCls = knexCls.decrement(field, data[field]);
            delete data[field];
        }
        knexCls = knexCls.from(options.table);
        return this.parser.buildSql(knexCls, data, options).then(sql => {
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
        field = field || `${options.alias}.${options.pk}`;
        let knexCls = this.knexClient.count(`${field} AS count`).from(`${options.table} AS ${options.alias}`);
        return this.parser.buildSql(knexCls, options).then(sql => {
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
        field = field || `${options.alias}.${options.pk}`;
        let knexCls = this.knexClient.sum(`${field} AS sum`).from(`${options.table} AS ${options.alias}`);
        return this.parser.buildSql(knexCls, options).then(sql => {
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
        let knexCls = this.knexClient.select().from(`${options.table} AS ${options.alias}`);
        return this.parser.buildSql(knexCls, options).then(sql => {
            return this.query(sql);
        }).then(result => {
            //
            return result;
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
        let knexCls = this.knexClient.select().from(`${options.table} AS ${options.alias}`);
        return this.parser.buildSql(knexCls, options).then(sql => {
            return this.query(sql);
        }).then(result => {
            //
            return result;
        });
    }
};