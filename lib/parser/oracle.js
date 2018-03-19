/**
 * @Author: richen 
 * @Date: 2018-02-09 16:22:06 
 * @Copyright (c) - <richenlin(at)gmail.com>
 * @Last Modified by: richen
 * @Last Modified time: 2018-03-19 19:36:16
 */
const helper = require('../helper.js');
const base = require('./base.js');

module.exports = class extends base{
    /**
     *
     * @param cls
     * @param data
     * @param options
     */
    parseField(cls, data, options) {
        if (helper.isEmpty(options.field)) {
            return;
        }
        let field = [];
        options.field.map(it => {
            field.push(it.toUpperCase());
        });
        cls.column(field);
    }
    /**
     * 
     * 
     * @static
     * @param {any} config 
     * @param {any} cls 
     * @param {any} data 
     * @param {any} options 
     * @returns 
     */
    static async buildSql(config, cls, data, options) {
        if (options === undefined) {
            options = data;
        }
        //防止外部options被更改
        let parseOptions = helper.extend(options, {}, true);
        parseOptions.table && (parseOptions.table = (parseOptions.table).toUpperCase());
        parseOptions.pk && (parseOptions.pk = (parseOptions.pk).toUpperCase());
        parseOptions.targetField = parseOptions.targetField ? (parseOptions.targetField).toUpperCase() : (parseOptions.pk).toUpperCase();
        let handle = new this(config);
        return handle[`build${parseOptions.method}`](cls, data, parseOptions).toString();
    }
};