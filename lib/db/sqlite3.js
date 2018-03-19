/**
 * @Author: richen 
 * @Date: 2018-02-09 15:46:34 
 * @Copyright (c) - <richenlin(at)gmail.com>
 * @Last Modified by: richen
 * @Last Modified time: 2018-03-19 18:04:06
 */
const os = require('os');
const knex = require('knex');
const base = require('./base.js');
const sqlite3 = require('sqlite3').verbose();
const logger = require('think_logger');
const helper = require('../helper.js');
const parser = require('../parser/base.js');

const defaultConfig = {
    db_type: 'sqlite3',
    db_host: '127.0.0.1',
    db_port: '5432',
    db_name: 'test',
    db_user: '',
    db_pwd: '',
    db_prefix: 'think_',
    db_charset: 'utf8',
    db_timeout: 30,
    db_ext_config: {
        db_sqlite_store: 'file', // file or memory
        db_sqlite_path: os.tmpdir + helper.sep + 'sqlite'
    }
};

module.exports = class extends base{
    constructor(config) {
        super(config);
        this.config = helper.extend(defaultConfig, config, true);
        this.knexClient = knex({
            client: 'sqlite3'
        });
        this.parser = parser;
        this.connection = null;
    }
    /**
     * 
     * 
     * @param {number} [connnum=0] 
     * @returns 
     */
    connect(connnum = 0) {
        if (this.connection) {
            return Promise.resolve(this.connection);
        }
        if (this.config.db_ext_config.db_sqlite_store === 'file') {
            this.config.db_ext_config.db_sqlite_path += `${helper.sep}${this.config.db_name}.sqlite`;
            !helper.isDir(this.config.db_ext_config.db_sqlite_path) && helper.mkDir(this.config.db_ext_config.db_sqlite_path, 777);
        } else {
            // in memory
            this.config.db_ext_config.db_sqlite_path = ':memory:';
        }
        let deferred = helper.getDefer();
        let db = new sqlite3.Database(this.config.path, err => {
            if (err) {
                // deferred.reject(err);
                if (connnum < 3) {
                    connnum++;
                    deferred.resolve(this.connect(connnum));
                } else {
                    this.close();
                    deferred.reject(err);
                }
            } else {
                this.connection = db;
                deferred.resolve(db);
            }
        });
        if (this.config.connectTimeout) {
            db.configure('busyTimeout', this.config.db_timeout);
        }
        return deferred.promise;
    }
    /**
     * 
     * 
     */
    close() {
        if (this.connection) {
            this.connection.end();
        }
        this.connection = null;
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
            let fn = helper.promisify(connection.all, connection);
            return fn(sql);
        }).then((data = {}) => {
            logger.info(sql);
            return data.rows || [];
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
            let fn = helper.promisify(connection.run, connection);
            return fn(sql);
        }).then(data => {
            logger.info(sql);
            if (data.insertId) {
                return data.insertId;
            }
            return data.rowCount || 0;
        }).catch(err => {
            this.close();
            logger.error(sql);
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
            let fn = helper.promisify(connection.all, connection);
            return fn(ouputs.sql, ouputs.bindings);
        }).then((rows = []) => {
            logger.info(ouputs.sql);
            return rows;
        }).catch(err => {
            this.close();
            logger.error(ouputs.sql);
            return Promise.reject(err);
        });
    }
};