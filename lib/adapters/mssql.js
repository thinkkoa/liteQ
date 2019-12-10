/**
 * @Author: richen 
 * @Date: 2018-02-09 15:46:34 
 * @Copyright (c) - <richenlin(at)gmail.com>
 * @Last Modified by: richen
 * @Last Modified time: 2018-07-24 15:41:22
 */
const knex = require('knex');
const adapter = require('../adapter.js');
const helper = require('../helper.js');

const defaultConfig = {
    db_type: 'mssql',
    db_host: '127.0.0.1',
    db_port: 1521,
    db_name: 'test',
    db_user: '',
    db_pwd: '',
    db_prefix: 'think_',
    db_charset: 'utf8',
    db_timeout: 30,
    db_ext_config: {
        db_pool_size: 10, //连接池大小
        db_log_sql: true, //打印sql
        encrypt: false // Use this if you're on Windows Azure
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
            client: this.config.db_type || 'mssql',
            connection: {
                host: this.config.db_host || '127.0.0.1',
                port: this.config.db_port || 1521,
                user: this.config.db_user || '',
                password: this.config.db_pwd || '',
                database: this.config.db_name || '',
                client_encoding: this.config.db_charset || 'utf8',
                connectionTimeout: this.config.db_timeout * 1000 || 10000, //try connection timeout
                parseJSON: true, // Parse JSON recordsets to JS objects
            },
            pool: { min: 1, max: this.config.db_ext_config.db_pool_size || 10 }
        });
    }

};