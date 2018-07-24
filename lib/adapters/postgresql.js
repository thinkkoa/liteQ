/**
 * @Author: richen 
 * @Date: 2018-02-09 15:46:34 
 * @Copyright (c) - <richenlin(at)gmail.com>
 * @Last Modified by: richen
 * @Last Modified time: 2018-07-24 17:22:51
 */
const knex = require('knex');
const adapter = require('../adapter.js');
const helper = require('../helper.js');
const parser = require('../parsers/postgresql.js'); 

const defaultConfig = {
    db_type: 'postgresql',
    db_host: '127.0.0.1',
    db_port: 5432,
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

module.exports = class extends adapter {
    /**
     * 
     *
     * @param {*} config
     */
    init(config) {
        this.config = helper.extend(defaultConfig, config, true);
        this.knexClient = knex({
            client: this.config.db_type || 'postgresql',
            connection: {
                host: this.config.db_host || '127.0.0.1',
                port: this.config.db_port || 5432,
                user: this.config.db_user || '',
                password: this.config.db_pwd || '',
                database: this.config.db_name || '',
                client_encoding: this.config.db_charset || 'utf8',
                connectionTimeoutMillis: this.config.db_timeout * 1000 || 10000, //try connection timeout
            },
            pool: { min: 1, max: this.config.db_ext_config.db_pool_size || 10 }
        });
        this.parser = parser;
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
        return this.execute(data, options).then(res => {
            if (helper.isArray(res)) {
                return res.length == 1 ? res[0] : 0;
            } else {
                return [];
            }
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
            return this.knexClient.raw('BEGIN');
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