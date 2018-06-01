/**
 * @Author: richen 
 * @Date: 2018-02-09 15:46:34 
 * @Copyright (c) - <richenlin(at)gmail.com>
 * @Last Modified by: richen
 * @Last Modified time: 2018-06-01 11:58:31
 */
const knex = require('knex');
const oracledb = require('oracledb');
const base = require('./base.js');
const logger = require('think_logger');
const helper = require('../helper.js');
const parser = require('../parser/oracle.js');

const defaultConfig = {
    db_type: 'oracle',
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
        externalAuth: false
    }
};

module.exports = class extends base{
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
     * @param {boolean} [autoCommit=true] 
     * @returns 
     */
    connect(connnum = 0, autoCommit = true) {
        let deferred = helper.getDefer();
        if (!this.pool) {
            oracledb.autoCommit = autoCommit;
            this.pool = oracledb.createPool({
                user: this.config.db_user || 'root',
                password: this.config.db_pwd || '',
                connectString: `(DESCRIPTION = (ADDRESS = (PROTOCOL = TCP)(HOST = ${this.config.db_host || '127.0.0.1'})(PORT = ${this.config.db_port}))(CONNECT_DATA =(SERVER = DEDICATED)(SERVICE_NAME = ${this.config.db_name})))`,
                externalAuth: this.config.db_ext_config.externalAuth || false,
                queueTimeout: this.config.db_timeout * 1000 || 10000, //try connection timeout
                poolMax: this.config.db_ext_config.db_pool_size || 10
            });
        }
        this.pool.then(pl => {
            pl.getConnection((err, conn) => {
                if (err) {
                    if (connnum < 3) {
                        connnum++;
                        deferred.resolve(this.connect(connnum, autoCommit));
                    } else {
                        this.close();
                        deferred.reject(err);
                    }
                } else {
                    conn.release = conn.close;
                    deferred.resolve(conn);
                }
            });
        });
        return deferred.promise;
    }
    /**
     * 
     * 
     */
    close() {
        if (this.pool) {
            this.pool.then(pl => pl.close());
        }
        this.pool = null;
    }
    /**
     * 执行查询
     * 
     * @param {any} sql 
     * @param {number} [times=0] 
     * @returns 
     */
    query(sql, times = 0) {
        if (helper.isEmpty(sql)) {
            return Promise.reject('SQL analytic result is empty');
        }
        let connection = {};
        return this.connect().then(conn => {
            connection = conn;
            let fn = helper.promisify(connection.execute, connection);
            return fn(sql, {}, { outFormat: oracledb.OBJECT });
        }).then((data = {}) => {
            connection.release();
            logger.info(sql);
            return data.rows || [];
        }).catch(err => {
            this.close();
            // if server close connection, then retry it
            if (times < 3 && err.code.indexOf('PROTOCOL') > -1) {
                return this.query(sql, times + 1);
            }
            logger.error([err.message, '[', sql, ']']);
            return Promise.reject(err);
        });
    }
    /**
     * 执行修改
     * 
     * @param {any} sql 
     * @param {number} [times=0] 
     * @returns 
     */
    execute(sql, times = 0) {
        if (helper.isEmpty(sql)) {
            return Promise.reject('SQL analytic result is empty');
        }
        let connection = {};
        return this.connect().then(conn => {
            connection = conn;
            let fn = helper.promisify(connection.execute, connection);
            return fn(sql, {}, { outFormat: oracledb.OBJECT });
        }).then(data => {
            connection.release();
            logger.info(sql);
            if (data.insertId) {
                return data.insertId;
            }
            return data.rowCount || 0;
        }).catch(err => {
            this.close();
            // if server close connection, then retry it
            if (times < 3 && err.code.indexOf('PROTOCOL') > -1) {
                return this.execute(sql, times + 1);
            }
            logger.error([err.message, '[', sql, ']']);
            return Promise.reject(err);
        });
    }
    /**
     * 执行原生语句
     * 
     * @param {any} tableName 
     * @param {any} sqlStr 
     * @param {number} [times=0] 
     * @returns 
     */
    native(tableName, sqlStr, times = 0) {
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
            let fn = helper.promisify(connection.execute, connection);
            return fn(ouputs.sql, ouputs.bindings, { outFormat: oracledb.OBJECT });
        }).then((data = {}) => {
            connection.release();
            logger.info(ouputs.sql);
            return data.rows;
        }).catch(err => {
            this.close();
            // if server close connection, then retry it
            if (times < 3 && err.code.indexOf('PROTOCOL') > -1) {
                return this.native(tableName, sqlStr, times + 1);
            }
            logger.error([err.message, '[', ouputs.sql, ']']);
            return Promise.reject(err);
        });
    }
};