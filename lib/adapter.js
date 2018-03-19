/**
 * @Author: richen 
 * @Date: 2018-02-22 16:15:54 
 * @Copyright (c) - <richenlin(at)gmail.com>
 * @Last Modified by: richen
 * @Last Modified time: 2018-03-19 09:40:20
 */
const helper = require('./helper.js');
const supportType = ['mysql', 'postgresql', 'sqlite3', 'oracle'];
/**
 * Singleton
 * 
 * @returns
 */
let instances = {};
module.exports = class Adapter {
    /**
     * 
     * 
     * @static
     * @param {any} config 
     * @param {boolean} [forceNew=false] 
     * @returns 
     */
    static getInstance(config, forceNew = false) {
        if (helper.isObject(forceNew) && forceNew.getTableName) {
            return Promise.resolve(forceNew);
        }
        let key = `${config.db_type}_${config.db_host}_${config.db_port}_${config.db_name}`;
        if (instances[key] && !forceNew) {
            return Promise.resolve(instances[key]);
        }
        let dbType = helper.isEmpty(config.db_type) ? 'mysql' : (config.db_type).toLowerCase();
        if (supportType.indexOf(dbType) < 0) {
            throw Error('This database type is not supported.');
        }
        let db = require(`./db/${dbType}.js`);
        instances[key] = new db(config);
        return instances[key];
    }
};