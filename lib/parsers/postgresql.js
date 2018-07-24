/**
 * @Author: richen 
 * @Date: 2018-02-09 16:22:06 
 * @Copyright (c) - <richenlin(at)gmail.com>
 * @Last Modified by: richen
 * @Last Modified time: 2018-07-24 16:24:50
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
};