/**
 * @Author: richen 
 * @Date: 2018-02-22 16:15:54 
 * @Copyright (c) - <richenlin(at)gmail.com>
 * @Last Modified by: richen
 * @Last Modified time: 2019-02-28 10:47:38
 */
const helper = require('./helper.js');
const logger = require('think_logger');
const parser = require('./parsers/base.js');
const supportType = ['mysql', 'postgresql', 'sqlite3', 'oracle', 'mssql'];
//Singleton
var instances = {};

module.exports = class Adapter {

    /**
     *Creates an instance of Adapter.
     * @param {*} config
     */
    constructor(config) {
        this.pool = null;
        this.config = config;
        this.knexClient = null;
        this.parser = parser;
        this.transTimes = 0; //transaction times
        this.init(config);
        
        if(this.knexClient){
            this.knexClient.on('query-response', function(response, obj, builder) {
                builder.toString && logger.info(builder.toString());
            });
            this.knexClient.on('query-error', function(error, obj) {
                obj.sql && logger.error(['<bindings>:', obj.bindings || [], '\r\n', '<sql>:', obj.sql]);
                throw Error(error);
            });
            if (this.knexClient.client && this.knexClient.client.pool){
                this.pool = this.knexClient.client.pool;
            }
        }
    }

    /**
     * 初始化构造方法
     *
     * @param {*} config
     */
    init(config){}

    /**
     * 
     * 
     */
    close() {
        if (this.pool) {
            this.pool.destroyer();
        }
        this.pool = null;
    }

    /**
     * 执行查询
     * 
     * @param {any} options 
     * @param {number} [times=0] 
     * @returns 
     */
    query(options, times = 0) {
        return this.parser.querySql(this.config, {}, options, this.knexClient).catch(err => {
            // if server close connection, then retry it
            if (times < 3 && err.message && err.message.indexOf('PROTOCOL') > -1) {
                return this.query(options, times + 1);
            }
            return Promise.reject(err);
        });
    }

    /**
     * 执行修改
     * 
     * @param {any} data 
     * @param {any} options 
     * @param {number} [times=0] 
     * @returns 
     */
    execute(data, options, times = 0) {
        return this.parser.querySql(this.config, data, options, this.knexClient).catch(err => {
            // if server close connection, then retry it
            if (times < 3 && err.message && err.message.indexOf('PROTOCOL') > -1) {
                return this.query(options, times + 1);
            }
            return Promise.reject(err);
        });
    }

    
    /**
     * 执行原生语句
     *
     * @param {*} sqlStr
     * @param {*} bind
     * @param {number} [times=0]
     * @returns
     */
    native(sqlStr, bind, times = 0) {
        if (helper.isEmpty(sqlStr)) {
            return Promise.reject('SQL String is null.');
        }
        return this.knexClient.raw(sqlStr, bind).then(rowData => {
            if (rowData.rows){
                return rowData.rows || [];
            } else {
                return rowData[0] || [];
            }
        }).catch(err => {
            // if server close connection, then retry it
            if (times < 3 && err.message && err.message.indexOf('PROTOCOL') > -1) {
                return this.native(sqlStr, bind, times + 1);
            }
            return Promise.reject(err);
        });
    }

    /**
     * 数据迁移
     *
     * @param {*} schema
     * @param {string} [sqlStr='']
     * @param {number} [times=0]
     * @returns
     */
    migrate(schema, sqlStr = '', times = 0){
        if (helper.isEmpty(sqlStr)){
            let options = {
                method: 'MIGRATE',
                schema: schema
            };
            return this.parser.querySql(this.config, {}, options, this.knexClient).catch(err => {
                // if server close connection, then retry it
                if (times < 3 && err.message && err.message.indexOf('PROTOCOL') > -1) {
                    return this.migrate(schema, sqlStr, times + 1);
                }
                return Promise.reject(err);
            });
        } else {
            return this.native(sqlStr, []); 
        }
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
        return this.execute(data, options);
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
        return this.execute(options);
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
        return this.execute(data, options);
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
        return this.execute(data, options);
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
        return this.execute(data, options);
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
        return this.query(options).then(result => {
            if (helper.isArray(result)) {
                if (result[0]) {
                    return result[0].count ? (helper.toInt(result[0].count) || 0) : 0;
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
        return this.query(options).then(result => {
            if (helper.isArray(result)) {
                if (result[0]) {
                    return result[0].sum ? (helper.toInt(result[0].sum) || 0) : 0;
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
        return this.query(options).then(result => {
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
        return this.query(options);
    }
    
    /**
     * Singleton
     * 
     * @static
     * @param {any} config 
     * @param {boolean} [forceNew=false] 
     * @returns 
     */
    static getInstance(config, forceNew = false) {
        if (helper.isObject(forceNew) && forceNew.getTableName) {
            return Promise.resolve(forceNew);
        }
        let key = `${config.db_type}_${config.db_host}_${config.db_port}_${config.db_name}`;
        if (instances[key] && !forceNew) {
            return Promise.resolve(instances[key]);
        }
        let dbType = helper.isEmpty(config.db_type) ? 'mysql' : (config.db_type).toLowerCase();
        if (supportType.indexOf(dbType) < 0) {
            throw Error('This database type is not supported.');
        }
        //Test cases are not completely covered, there may be errors, do not use in production environments
        if (['sqlite3', 'oracle', 'mssql'].indexOf(dbType) > -1){
            logger.warn('Test cases are not completely covered, there may be errors, do not use in production environments!!');
        }
        let cls = require(`./adapters/${dbType}.js`);
        instances[key] = new cls(config);
        return instances[key];
    }
};