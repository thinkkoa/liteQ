/**
 * @Author: richen 
 * @Date: 2018-02-22 16:15:54 
 * @Copyright (c) - <richenlin(at)gmail.com>
 * @Last Modified by: richen
 * @Last Modified time: 2019-02-28 10:47:38
 */
const helper = require('./helper.js');
const logger = require('think_logger');
const supportType = ['mysql', 'postgresql', 'sqlite3', 'oracle', 'mssql'];
const __LiteQInstances = {};

module.exports = class Adapter {

    /**
     *Creates an instance of Adapter.
     * @param {*} config
     */
    constructor(config) {
        this.pool = null;
        this.config = config;
        this.knexClient = null;
        this.parser = null;
        this.transTimes = 0; //transaction times
        this.init(config);
        if (this.knexClient) {
            config = this.config;
            this.knexClient.on('query-response', function (response, obj, builder) {
                builder.toString && config.db_ext_config && config.db_ext_config.db_log_sql && logger.custom('INFO', 'blue', builder.toString());
            });
            this.knexClient.on('query-error', function (error, obj) {
                obj.sql && logger.error(['<bindings>:', obj.bindings || [], '\r\n', '<sql>:', obj.sql]);
                throw Error(error);
            });
            if (this.knexClient.client && this.knexClient.client.pool) {
                this.pool = this.knexClient.client.pool;
            }
        }
    }

    /**
     * 初始化构造方法
     *
     */
    init() { }



    /**
     * 
     * 
     */
    async close() {
        try {
            if (this.pool) {
                await this.pool.destroy();
            }
            this.pool = null;
            return null;
        } catch (e) {
            logger.error(e);
            return null;
        }
    }

    /**
     * 生成sqlString
     *
     * @param {*} options
     * {method: find | select | add | update | count | sum | decrement | increment}
     * @param {*} [data={}]
     * @returns
     */
    sql(options, data = {}) {
        switch (options.method) {
            case 'find':
                options.limit = [0, 1];
                options.method = 'SELECT';
                break;
            case 'select':
                options.method = 'SELECT';
                break;
            case 'add':
                options.method = 'ADD';
                break;
            case 'update':
                options.method = 'UPDATE';
                break;
            case 'count':
                options.method = 'COUNT';
                break;
            case 'sum':
                options.method = 'SUM';
                break;
            case 'decrement':
                options.method = 'DECREMENT';
                break;
            case 'increment':
                options.method = 'INCREMENT';
                break;
            default:
                options.method = 'SELECT';
                break;
        }

        if (['ADD', 'UPDATE'].includes(options.method) && helper.isEmpty(data)) {
            return Promise.reject('paramer data is empty');
        }
        if (['COUNT', 'SUM', 'DECREMENT', 'INCREMENT'].includes(options.method) && helper.isEmpty(data)) {
            return Promise.reject('paramer field is empty');
        }
        return this.parser.buildSql(this.config, data, options, this.knexClient).catch(err => {
            return Promise.reject(err);
        });
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
            if (rowData.rows) {
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
     * @returns
     */
    async migrate(schema, sqlStr = '') {
        if (helper.isEmpty(sqlStr)) {
            try {
                let options = {
                    method: 'MIGRATE',
                    schema: schema
                };
                const ex = await this.knexClient.schema.hasTable(schema.table).catch(() => false);
                if (!ex) {
                    //直接使用this.parser.querySql会导致create table多次执行，目前原因未知。暂时使用buildSql
                    // sqlStr = await this.parser.buildSql(this.config, {}, options, this.knexClient);
                    // const sqlArr = sqlStr.split(';');
                    // // 串行
                    // for (const item of sqlArr) {
                    //     await this.knexClient.raw(item, []);
                    // }
                    await this.parser.querySql(this.config, {}, options, this.knexClient);
                } else {
                    logger.error(`Table ${schema.table} already exists`);
                }
                return Promise.resolve();
            } catch (err) {
                return Promise.reject(err);
            }
        } else {
            return this.knexClient.raw(sqlStr, []);
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
     * 批量增加数据
     *
     * @param {*} data
     * @param {*} [options={}]
     * @returns
     */
    batchAdd(data, options = {}) {
        options.method = 'BATCHADD';
        options.alias = undefined;
        return this.execute(data, options).then(res => {
            if (helper.isArray(res)) {
                for (let i = 1; i < data.length; i++) {
                    res.push(res[0] + i);
                }
            }
            return res;
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
                if (!helper.isEmpty(options.group)) {
                    return result.length;
                } else {
                    return result[0].count ? (helper.toInt(result[0].count) || 0) : 0;
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
                if (!helper.isEmpty(options.group)) {
                    let res = 0;
                    result.map(it => {
                        const iSum = helper.toInt(it.sum);
                        if (iSum) {
                            res += iSum;
                        }
                    });
                    return res;
                } else {
                    return result[0].sum ? (helper.toInt(result[0].sum) || 0) : 0;
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
     * @param {*} config
     * @param {*} forceNew
     * @returns
     */
    static async getInstance(config, forceNew) {
        let key = `${config.db_type}_${config.db_host}_${config.db_port}_${config.db_name}`;

        if (__LiteQInstances[key] && !forceNew) {
            return Promise.resolve(__LiteQInstances[key]);
        }

        let dbType = helper.isEmpty(config.db_type) ? 'mysql' : (config.db_type).toLowerCase();
        if (dbType === 'mariadb' || dbType.indexOf('mysql') > -1) {
            dbType = 'mysql';
        }
        if (supportType.indexOf(dbType) < 0) {
            throw Error('This database type is not supported.');
        }
        //Test cases are not completely covered, there may be errors, do not use in production environments
        // if (['sqlite3', 'oracle', 'mssql'].indexOf(dbType) > -1) {
        //     logger.warn('Test cases are not completely covered, there may be errors, do not use in production environments!!');
        // }
        const adapter = require(`./adapters/${dbType}.js`);
        if (forceNew) {
            config = helper.extend(config, {
                db_ext_config: {
                    db_pool_size: 1
                }
            });
        }
        const cls = new adapter(config);
        if (!forceNew) {
            __LiteQInstances[key] = cls;
        }
        return cls;
    }
};