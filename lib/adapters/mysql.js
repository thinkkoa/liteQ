/**
 * @Author: richen 
 * @Date: 2018-02-09 15:46:34 
 * @Copyright (c) - <richenlin(at)gmail.com>
 * @Last Modified by: richen
 * @Last Modified time: 2019-02-27 22:34:02
 */
const knex = require('knex');
const adapter = require('../adapter.js');
const helper = require('../helper.js');


const defaultConfig = {
    db_type: 'mysql',
    db_host: '127.0.0.1',
    db_port: 3306,
    db_name: 'test',
    db_user: '',
    db_pwd: '',
    db_prefix: 'think_',
    db_charset: 'utf8',
    db_timeout: 30,
    db_ext_config: {
        db_pool_size: 10, //连接池大小
        db_dateStrings: false,
    }
};

module.exports = class extends adapter {

    /**
     * 
     *
     * @param {*} config
     */
    init(config) {
        this.config = helper.extend(defaultConfig, config, true);
        //node-mysql2 not support utf8 or utf-8
        let charset = (this.config.encoding || '').toLowerCase();
        if (charset === 'utf8' || charset === 'utf-8') {
            this.config.charset = 'utf8mb4';
        }
        this.knexClient = knex({
            client: this.config.db_type || 'mysql',
            connection: {
                host: this.config.db_host || '127.0.0.1',
                port: this.config.db_port || 3306,
                user: this.config.db_user || '',
                password: this.config.db_pwd || '',
                database: this.config.db_name || '',
                charset: this.config.charset || 'utf8mb4',
                dateStrings: this.config.db_ext_config.db_dateStrings || false,
                connectTimeout: this.config.db_timeout * 1000 || 10000, //try connection timeout
            },
            pool: { min: 1, max: this.config.db_ext_config.db_pool_size || 10 }
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
        return this.parser.querySql(this.config, data, options, this.knexClient).then(res => {
            if (res && res.length === 1) {
                return res[0];
            }
            return res || [];
        }).catch(err => {
            // if server close connection, then retry it
            if (times < 3 && err.message && err.message.indexOf('PROTOCOL') > -1) {
                return this.query(options, times + 1);
            }
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
            return this.knexClient.raw('START TRANSACTION');
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
            return this.knexClient.raw('COMMIT').then(data => {
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
            return this.knexClient.raw('ROLLBACK').then(data => {
                this.close();
                return data;
            });
        }
        return Promise.resolve();
    }
};
