/**
 * @Author: richen 
 * @Date: 2018-02-09 16:22:06 
 * @Copyright (c) - <richenlin(at)gmail.com>
 * @Last Modified by: richen
 * @Last Modified time: 2019-02-27 22:24:18
 */
const base = require('./base.js');

module.exports = class extends base {
    /**
     * 
     * 
     * @param {any} cls 
     * @param {any} data 
     * @param {any} options 
     * @returns 
     */
    buildADD(cls, data, options) {
        this.knexClient = cls.insert(data).from(options.table).returning(options.pk);
        return this.parseData(this.knexClient, data, options);
    }
    /**
     * 
     * 
     * @param {any} cls 
     * @param {any} data 
     * @param {any} options 
     * @returns 
     */
    buildBATCHADD(cls, data, options) {
        this.knexClient = cls.batchInsert(options.table, data, 100).returning(options.pk);
        return this.parseData(this.knexClient, data, options);
    }
};