/**
 * @Author: richen 
 * @Date: 2018-02-09 15:46:34 
 * @Copyright (c) - <richenlin(at)gmail.com>
 * @Last Modified by: richen
 * @Last Modified time: 2018-03-19 18:04:12
 */
const knex = require('knex');
const mysql = require('mysql');
const base = require('./base.js');
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

module.exports = class extends base{
    constructor(config) {
        super(config);
        this.config = helper.extend(defaultConfig, config, true);
        this.knexClient = knex({
            client: 'mysql'
        });
        this.parser = parser;
        //node-mysql2 not support utf8 or utf-8
        let charset = (this.config.encoding || '').toLowerCase();
        if (charset === 'utf8' || charset === 'utf-8') {
            this.config.charset = 'UTF8_GENERAL_CI';
        }
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
};