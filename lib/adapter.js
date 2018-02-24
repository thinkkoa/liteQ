/**
 * @Author: richen 
 * @Date: 2018-02-22 16:15:54 
 * @Copyright (c) - <richenlin(at)gmail.com>
 * @Last Modified by: richen
 * @Last Modified time: 2018-02-24 08:56:10
 */
const helper = require('./helper.js');
const supportType = ['mysql', 'postgresql', 'sqlite3'];
/**
 * Singleton
 * 
 * @returns
 */
let instances;
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
            instances = forceNew;
            return Promise.resolve(forceNew);
        }
        if (instances && !forceNew) {
            return Promise.resolve(instances);
        }
        let dbType = helper.isEmpty(config.db_type) ? 'mysql' : (config.db_type).toLowerCase();
        if (supportType.indexOf(dbType) < 0) {
            throw Error('This database type is not supported.');
        }
        let db = require(`./db/${dbType}.js`);
        instances = new db(config);
        return instances;
    }
};