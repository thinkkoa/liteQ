/**
 * @Author: richen 
 * @Date: 2018-02-09 16:22:06 
 * @Copyright (c) - <richenlin(at)gmail.com>
 * @Last Modified by: richen
 * @Last Modified time: 2018-03-08 17:05:22
 */
const helper = require('../helper.js');
const identifiers = {
    OR: 'OR',
    AND: 'AND',
    NOT: 'NOT',
    IN: 'IN',
    NOTIN: 'NOTIN',
    '>': 'OPERATOR',
    '<': 'OPERATOR',
    '<>': 'OPERATOR',
    '<=': 'OPERATOR',
    '>=': 'OPERATOR',
    'LIKE': 'OPERATOR'
};

/**
 * 
 * 
 * @param {any} name 
 * @returns 
 */
const parseName = function (name) {
    name = name.trim();
    if (!name) {
        return name;
    }
    //首字母如果是大写，不转义为_x
    name = name[0].toLowerCase() + name.substr(1);
    return name.replace(/[A-Z]/g, function (a) {
        return '_' + a.toLowerCase();
    });
};

/**
 * 书写方法:
 * or:  {or: [{...}, {...}]}
 * not: {not: {name: '', id: 1}}
 * notin: {notin: {'id': [1,2,3]}}
 * in: {id: [1,2,3]}
 * and: {id: 1, name: 'a'},
 * operator: {id: {'<>': 1}}
 * operator: {id: {'<>': 1, '>=': 0, '<': 100, '<=': 10}}
 * like: {name: {'like': '%a'}}
 * @param knex
 * @param options
 * @param alias
 * @param extkey
 */
/*eslint-disable func-style */
const parseKnexWhere = function (knex, options, alias, extkey) {
    let idt = '';
    for (let op in options) {
        idt = op.toUpperCase();
        switch (identifiers[idt]) {
            case 'OR':
                if (helper.isArray(options[op])) {
                    parseOr(knex, options[op], alias);
                }
                break;
            case 'IN':
                if (helper.isArray(options[op])) {
                    parseIn(knex, op, options[op], alias);
                } else if (helper.isObject(options[op])) {
                    for (let n in options[op]) {
                        parseIn(knex, n, options[op][n], alias);
                    }
                }
                break;
            case 'NOTIN':
                if (helper.isObject(options[op])) {
                    parseNotIn(knex, options[op], alias);
                } else if (helper.isArray(options[op]) && extkey !== undefined) {
                    parseNotIn(knex, { [extkey]: options[op] }, alias);
                }
                break;
            case 'NOT':
                if (helper.isObject(options[op])) {
                    parseNot(knex, options[op], alias);
                } else if (extkey !== undefined) {
                    parseNot(knex, { [extkey]: options[op] }, alias);
                }
                break;
            case 'OPERATOR':
                if (extkey !== undefined) {
                    parseOperator(knex, extkey, op, options[op], alias);
                } else if (helper.isObject(options[op])) {
                    for (let n in options[op]) {
                        parseKnexWhere(knex, { [n]: options[op][n] }, alias, op);
                    }
                }
                break;
            case 'AND':
            default:
                if (helper.isArray(options[op])) {
                    parseIn(knex, op, options[op], alias);
                } else if (helper.isObject(options[op])) {
                    for (let n in options[op]) {
                        parseKnexWhere(knex, { [n]: options[op][n] }, alias, op);
                    }
                } else {
                    let _key = (alias && op.indexOf('.') === -1) ? `${alias}.${op}` : op;
                    knex.where(_key, '=', options[op]);
                }
        }
    }
};
//解析or条件
function parseOr(knex, options, alias) {
    knex.where(function () {
        options.map(item => {
            if (helper.isObject(item)) {
                this.orWhere(function () {
                    parseKnexWhere(this, item, alias);
                });
            }
        });
    });
}
//解析not条件
function parseNot(knex, options, alias) {
    knex.whereNot(function () {
        parseKnexWhere(this, options, alias);
    });
}
//解析in条件
function parseIn(knex, key, value, alias) {
    let _key = (alias && key.indexOf('.') === -1) ? `${alias}.${key}` : key;
    knex.whereIn(_key, value);
}
//解析notin条件
function parseNotIn(knex, options, alias) {
    let _key = '';
    for (let n in options) {
        _key = (alias && n.indexOf('.') === -1) ? `${alias}.${n}` : n;
        knex.whereNotIn(_key, options[n]);
    }
}
//解析operator等条件
function parseOperator(knex, key, operator, value, alias) {
    let _key = (alias && key.indexOf('.') === -1) ? `${alias}.${key}` : key;
    knex.where(_key, operator, value);
}
//解析JOIN ON/ORON 条件
function parseOn(knex, alias, method, joinTable, joinAlias, on){
    knex[method](`${joinTable} as ${joinAlias}`, function () {
        for (let n in on) {
            if (n.toLowerCase() === 'or') {
                if (!helper.isArray(on[n])) {
                    continue;
                }
                on[n].map(item => {
                    for(let i in item){
                        this.orOn(`${alias}.${i}`, '=', `${joinAlias}.${item[i]}`);
                    }
                });
            } else {
                this.on(`${alias}.${n}`, '=', `${joinAlias}.${on[n]}`);
            }
        }
    });
}
/**
 * //解析后结果
        //.innerJoin('accounts', function() {
        //    this.on('accounts.id', '=', 'users.account_id').on('accounts.owner_id', '=', 'users.id').orOn('accounts.owner_id', '=', 'users.id')
        //})
 * 
 * @param {any} knex 
 * @param {any} type 
 * @param {any} alias 
 * @param {any} joinTable 
 * @param {any} joinAlias 
 * @param {any} on 
 * @param {any} options 
 * @param {any} where 
 */
const parseKnexJoin = function (knex, type, alias, joinTable, joinAlias, on) {
    let method;
    switch (type){
        case 'left':
            method = 'leftJoin';
            break;
        case 'right':
            method = 'leftJoin';
            break;
        default:
            method = 'innerJoin';
            break;
    }
    parseOn(knex, alias, method, joinTable, joinAlias, on);
};

/**
 *
 * @param field
 * @param value
 * @param dbType
 * @return {string}
 * let types = {
            integer: {},
            string: {size: 50},
            float: {precision: 8, size: 2},
            json: {},
            array: [],
            text: {}
        };
 */
const parseKnexSchema = function (field, value, dbType) {
    let str = '', primary = false, defaults;
    if (value.primaryKey !== undefined && value.primaryKey === true) {
        primary = true;
    }
    //默认值
    if (value.default !== undefined) {
        defaults = value.default;
    } else if (value.defaultsTo !== undefined) {
        defaults = value.defaultsTo;
    }
    switch (value.type) {
        case 'integer':
            if (primary === true) {
                str += `t.increments('${field}').primary()`;
            } else {
                str += `t.integer('${field}')`;
            }
            if (helper.isNumber(defaults)) {
                str += `.defaultTo(${defaults})`;
            }
            break;
        case 'float':
            str += `t.float('${field}', 8, ${value.size || 2})${primary === true ? '.primary()' : ''}`;
            if (helper.isNumber(defaults)) {
                str += `.defaultTo(${defaults})`;
            }
            break;
        case 'string':
            str += `t.string('${field}', ${value.size || 50})${primary === true ? '.primary()' : ''}`;
            if (helper.isString(defaults)) {
                str += `.defaultTo(${defaults})`;
            }
            break;
        case 'json':
        case 'array':
            str += `t.json('${field}')`;
            if (helper.isJSONStr(defaults)) {
                str += `.defaultTo(${defaults})`;
            }
            break;
        case 'text':
            str += `t.text('${field}')`;
            if (helper.isString(defaults)) {
                str += `.defaultTo(${defaults})`;
            }
            break;
        default:
            str += `t.string('${field}')${primary === true ? '.primary()' : ''}`;
            if (helper.isString(defaults)) {
                str += `.defaultTo(${defaults})`;
            }
            break;
    }
    if (value.index !== undefined && value.index === true) {
        str += `.index('${field}')`;
    }
    if (value.unique !== undefined && value.unique === true) {
        str += `.unique()`;
    }

    return str + ';';
};


module.exports = class {

    constructor(config = {}) {
        this.config = config;
    }

    /**
     *
     * @param cls
     * @param data
     * @param options
     */
    parseLimit(cls, data, options) {
        if (helper.isEmpty(options.limit)) {
            return;
        }
        cls.limit(options.limit[1] || 10).offset(options.limit[0] || 0);
    }

    /**
     *
     * @param cls
     * @param data
     * @param options
     */
    parseOrder(cls, data, options) {
        if (helper.isEmpty(options.order)) {
            return;
        }
        for (let n in options.order) {
            if (n.indexOf('.') > -1) {
                cls.orderBy(n, options.order[n]);
            } else {
                cls.orderBy(`${options.alias}.${n}`, options.order[n]);
            }
        }
    }

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
        cls.column(options.field);
    }

    /**
     *
     * @param cls
     * @param data
     * @param options
     */
    parseWhere(cls, data, options) {
        if (helper.isEmpty(options.where)) {
            return;
        }
        //parse where options
        parseKnexWhere(cls, options.where, options.alias);
    }

    /**
     * group('xxx')
     * group(['xxx', 'xxx'])
     * @param cls
     * @param data
     * @param options
     */
    parseGroup(cls, data, options) {
        if (helper.isEmpty(options.group)) {
            return;
        }
        cls.groupBy(options.group);
    }
    /**
     * distinct(['first_name', 'last_name'])
     * 
     * @param {any} cls 
     * @param {any} data 
     * @param {any} options 
     * @returns 
     */
    parseDistinct(cls, data, options) {
        if (helper.isEmpty(options.distinct)) {
            return;
        }
        cls.distinct(helper.isArray(options.distinct) ? options.distinct.join(',') : options.distinct);
    }
    /**
     * having({"name":{">": 100}})
     * 
     * @param {any} cls 
     * @param {any} data 
     * @param {any} options 
     * @returns 
     */
    parseHaving(cls, data, options) {
        if (helper.isEmpty(options.having)) {
            return;
        }
        for (let n in options.having) {
            if (helper.isObject(options.having[n])) {
                for (let y in options.having[n]) {
                    cls.having(n, y, options.having[n][y]);
                }
            }
        }
    }

    /**
     * join([{from: 'Test', alias: 'test', on: {aaa: bbb, ccc: ddd}, field: ['id', 'name'], type: 'inner'}])
     * join([{from: 'Test', alias: 'test', on: {or: [{aaa: bbb}, {ccc: ddd}]}, field: ['id', 'name'], type: 'left'}])
     * join([{from: 'Test', alias: 'test', on: {aaa: bbb, ccc: ddd}, field: ['id', 'name'], type: 'right'}])
     * @param cls
     * @param data
     * @param options
     */
    parseJoin(cls, data, options) {
        if (helper.isArray(options.join)) {
            let type, fields = [], alias = options.alias, joinAlias = '', joinTable = '';
            options.field.map(fl => {
                fields.push(`${alias}.${fl}`);
            });
            options.field = fields;

            options.join.map(item => {
                type = item.type ? item.type.toLowerCase() : 'inner';
                joinTable = `${this.config.db_prefix}${parseName(item.from)}`;
                joinAlias = item.alias || item.from;
                parseKnexJoin(cls, type, alias, joinTable, joinAlias, item.on || {});
                if (helper.isArray(item.field)){
                    item.field.map(f => options.field.push(`${joinAlias}.${f}`));
                }
            });
        }
    }

    /**
     *
     * @param cls
     * @param data
     * @param options
     */
    parseSchema(cls, data, options) {
        if (helper.isEmpty(data) || helper.isEmpty(options.schema)) {
            return;
        }
        let tableName = `${data.db_prefix}${parseName(options.schema.name)}`;
        let str = [], fields = options.schema.fields, dbType = options.schema.dbType;
        for (let v in fields) {
            str.push(parseKnexSchema(v, fields[v], dbType));
        }
        /*eslint-disable no-new-func */
        let func = new Function('t', str.join('\n'));
        cls.createTableIfNotExists(tableName, func);
    }

    /**
     *
     * @param cls
     * @param data
     * @param options
     * @returns {string}
     */
    async parseSql(cls, data, options) {
        try {
            let caseList = {
                SELECT: { join: 1, where: 1, field: 1, limit: 1, order: 1, group: 1, distinct: 1, having: 1 },
                ADD: { data: 1 },
                UPDATE: { where: 1, data: 1 },
                DELETE: { where: 1 },
                COUNT: { join: 1, where: 1, limit: 1, group: 1, distinct: 1, having: 1 },
                SUM: { join: 1, where: 1, limit: 1, group: 1, distinct: 1, having: 1 },
                MIGRATE: { schema: 1 }
            };
            if (cls) {
                let optType = options.method;
                //处理join
                if (options.join && caseList[optType].join) {
                    await this.parseJoin(cls, data, options);
                    // caseList[optType].join && (caseList[optType].join = 0);
                }
                //处理其他options
                for (let n in options) {
                    if (caseList[optType][n] && n !== 'join') {
                        let mt = `parse${helper.ucFirst(n)}`;
                        mt && helper.isFunction(this[mt]) && await this[mt](cls, data, options);
                    }
                }
                return cls.toString();
            }
            return '';
        } catch (e) {
            throw new Error(e);
        }
    }

    /**
     *
     * @param cls
     * @param data
     * @param options
     * @returns {string}
     */
    buildSql(cls, data, options) {
        if (options === undefined) {
            options = data;
        }
        //防止外部options被更改
        let parseOptions = helper.extend(options, {}, true);
        return this.parseSql(cls, data, parseOptions);
    }
};