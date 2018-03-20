/**
 * @Author: richen 
 * @Date: 2018-02-09 15:46:34 
 * @Copyright (c) - <richenlin(at)gmail.com>
 * @Last Modified by: richen
 * @Last Modified time: 2018-03-20 15:57:05
 */
const knex = require('knex');
const mssql = require('mssql');
const base = require('./base.js');
const logger = require('think_logger');
const helper = require('../helper.js');
const parser = require('../parser/base.js');

const defaultConfig = {
    db_type: 'mssql',
    db_host: '127.0.0.1',
    db_port: '1521',
    db_name: 'test',
    db_user: '',
    db_pwd: '',
    db_prefix: 'think_',
    db_charset: 'utf8',
    db_timeout: 30,
    db_ext_config: {
        db_pool_size: 10, //连接池大小
        encrypt: false // Use this if you're on Windows Azure
    }
};

module.exports = class extends base {
    constructor(config) {
        super(config);
        this.config = helper.extend(defaultConfig, config, true);
        this.knexClient = knex({
            client: 'oracledb'
        });
        this.parser = parser;
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
        if (!this.pool) {
            this.pool = new mssql.ConnectionPool({
                database: this.config.db_name,
                server: this.config.db_host || '127.0.0.1',
                user: this.config.db_user || 'root',
                password: this.config.db_pwd || '',
                port: this.config.db_port || 3306,
                connectionTimeout: this.config.db_timeout * 1000 || 10000, //try connection timeout
                parseJSON: true, // Parse JSON recordsets to JS objects
                pool: {
                    max: this.config.db_ext_config.db_pool_size || 10
                }
            });
        }
        let deferred = helper.getDefer();
        this.pool.connect(err => {
            if (err) {
                if (connnum < 3) {
                    connnum++;
                    deferred.resolve(this.connect(connnum));
                } else {
                    this.close();
                    deferred.reject(err);
                }
            } else {
                deferred.resolve(this.pool.request());
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
            this.pool.close();
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
        }).then((data = {}) => {
            connection.release();
            logger.info(sql);
            return data.rows || [];
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
            return data.rowCount || 0;
        }).catch(err => {
            this.close();
            logger.error([err.message, '[', sql, ']']);
            return Promise.reject(err);
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
        }).then((data = {}) => {
            connection.release();
            logger.info(ouputs.sql);
            return data.rows;
        }).catch(err => {
            this.close();
            logger.error([err.message, '[', ouputs.sql, ']']);
            return Promise.reject(err);
        });
    }
};