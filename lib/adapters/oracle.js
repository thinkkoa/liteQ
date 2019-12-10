/**
 * @Author: richen 
 * @Date: 2018-02-09 15:46:34 
 * @Copyright (c) - <richenlin(at)gmail.com>
 * @Last Modified by: richen
 * @Last Modified time: 2018-07-24 19:06:15
 */
const knex = require('knex');
const adapter = require('../adapter.js');
const helper = require('../helper.js');
const parser = require('../parsers/oracle.js');

const defaultConfig = {
    db_type: 'oracle',
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
        externalAuth: false
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
            client: this.config.db_type || 'oracledb',
            connection: {
                host: this.config.db_host || '127.0.0.1',
                port: this.config.db_port || 1521,
                user: this.config.db_user || '',
                password: this.config.db_pwd || '',
                database: this.config.db_name || '',
                connectString: `(DESCRIPTION = (ADDRESS = (PROTOCOL = TCP)(HOST = ${this.config.db_host || '127.0.0.1'})(PORT = ${this.config.db_port}))(CONNECT_DATA =(SERVER = DEDICATED)(SERVICE_NAME = ${this.config.db_name})))`,
                externalAuth: this.config.db_ext_config.externalAuth || false,
                queueTimeout: this.config.db_timeout * 1000 || 10000, //try connection timeout
            },
            pool: { min: 1, max: this.config.db_ext_config.db_pool_size || 10 }
        });
        //oracle parser
        this.parser = parser;
    }

};