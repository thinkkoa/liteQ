/**
 * @Author: richen 
 * @Date: 2018-02-09 15:46:34 
 * @Copyright (c) - <richenlin(at)gmail.com>
 * @Last Modified by: richen
 * @Last Modified time: 2018-07-24 15:41:12
 */
const os = require('os');
const knex = require('knex');
const base = require('./base.js');
const helper = require('../helper.js');
const parser = require('../parsers/base.js');

const defaultConfig = {
    db_type: 'sqlite3',
    db_host: '127.0.0.1',
    db_port: 5432,
    db_name: 'test',
    db_user: '',
    db_pwd: '',
    db_prefix: 'think_',
    db_charset: 'utf8',
    db_timeout: 30,
    db_ext_config: {
        db_log_sql: true, //打印sql
        db_sqlite_store: 'file', // file or memory
        db_sqlite_path: os.tmpdir + helper.sep + 'sqlite'
    }
};

module.exports = class extends base {
    /**
     * 
     *
     * @param {*} config
     */
    init(config) {
        this.config = helper.extend(defaultConfig, config, true);
        if (this.config.db_ext_config.db_sqlite_store === 'file') {
            this.config.db_ext_config.db_sqlite_path += `${helper.sep}${this.config.db_name}.sqlite`;
            !helper.isDir(this.config.db_ext_config.db_sqlite_path) && helper.mkDir(this.config.db_ext_config.db_sqlite_path, 777);
        } else {
            // in memory
            this.config.db_ext_config.db_sqlite_path = ':memory:';
        }
        this.knexClient = knex({
            client: this.config.db_type || 'sqlite3',
            connection: {
                host: this.config.db_host || '127.0.0.1',
                port: this.config.db_port || 1521,
                user: this.config.db_user || '',
                password: this.config.db_pwd || '',
                database: this.config.db_name || '',
                path: this.config.db_ext_config.db_sqlite_path
            },
            pool: { min: 1, max: this.config.db_ext_config.db_pool_size || 10 }
        });
        this.parser = parser;
    }

};