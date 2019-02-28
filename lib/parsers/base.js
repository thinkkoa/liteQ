/**
 * @Author: richen 
 * @Date: 2018-02-09 16:22:06 
 * @Copyright (c) - <richenlin(at)gmail.com>
 * @Last Modified by: richen
 * @Last Modified time: 2019-02-28 10:43:11
 */
const knex = require('knex');
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
 * @param cls
 * @param options
 * @param alias
 * @param extkey
 */
/*eslint-disable func-style */
const parseKnexWhere = function (cls, options, alias, extkey) {
    let idt = '';
    for (let op in options) {
        idt = op.toUpperCase();
        switch (identifiers[idt]) {
            case 'OR':
                if (helper.isArray(options[op])) {
                    parseOr(cls, options[op], alias);
                }
                break;
            case 'IN':
                if (helper.isArray(options[op])) {
                    parseIn(cls, op, options[op], alias);
                } else if (helper.isObject(options[op])) {
                    for (let n in options[op]) {
                        parseIn(cls, n, options[op][n], alias);
                    }
                }
                break;
            case 'NOTIN':
                if (helper.isObject(options[op])) {
                    parseNotIn(cls, options[op], alias);
                } else if (helper.isArray(options[op]) && extkey !== undefined) {
                    parseNotIn(cls, { [extkey]: options[op] }, alias);
                }
                break;
            case 'NOT':
                if (helper.isObject(options[op])) {
                    parseNot(cls, options[op], alias);
                } else if (extkey !== undefined) {
                    parseNot(cls, { [extkey]: options[op] }, alias);
                }
                break;
            case 'OPERATOR':
                if (extkey !== undefined) {
                    parseOperator(cls, extkey, op, options[op], alias);
                } else if (helper.isObject(options[op])) {
                    for (let n in options[op]) {
                        parseKnexWhere(cls, { [n]: options[op][n] }, alias, op);
                    }
                }
                break;
            case 'AND':
            default:
                if (helper.isArray(options[op])) {
                    parseIn(cls, op, options[op], alias);
                } else if (helper.isObject(options[op])) {
                    for (let n in options[op]) {
                        parseKnexWhere(cls, { [n]: options[op][n] }, alias, op);
                    }
                } else {
                    let _key = (alias && op.indexOf('.') === -1) ? `${alias}.${op}` : op;
                    cls.where(_key, '=', options[op]);
                }
        }
    }
};
//解析or条件
function parseOr(cls, options, alias) {
    cls.where(function () {
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
function parseNot(cls, options, alias) {
    cls.whereNot(function () {
        parseKnexWhere(this, options, alias);
    });
}
//解析in条件
function parseIn(cls, key, value, alias) {
    let _key = (alias && key.indexOf('.') === -1) ? `${alias}.${key}` : key;
    cls.whereIn(_key, value);
}
//解析notin条件
function parseNotIn(cls, options, alias) {
    let _key = '';
    for (let n in options) {
        _key = (alias && n.indexOf('.') === -1) ? `${alias}.${n}` : n;
        cls.whereNotIn(_key, options[n]);
    }
}
//解析operator等条件
function parseOperator(cls, key, operator, value, alias) {
    let _key = (alias && key.indexOf('.') === -1) ? `${alias}.${key}` : key;
    cls.where(_key, operator, value);
}
//解析JOIN ON/ORON 条件
function parseOn(cls, alias, method, joinTable, joinAlias, on) {
    cls[method](`${joinTable} as ${joinAlias}`, function () {
        for (let n in on) {
            if (n.toLowerCase() === 'or') {
                if (!helper.isArray(on[n])) {
                    continue;
                }
                on[n].map(item => {
                    for (let i in item) {
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
 * @param {any} cls 
 * @param {any} type 
 * @param {any} alias 
 * @param {any} joinTable 
 * @param {any} joinAlias 
 * @param {any} on 
 * @param {any} options 
 * @param {any} where 
 */
const parseKnexJoin = function (cls, type, alias, joinTable, joinAlias, on) {
    let method;
    switch (type) {
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
    parseOn(cls, alias, method, joinTable, joinAlias, on);
};

/**
 *
 * @param cls
 * @param field
 * @param value
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
const parseKnexSchema = function (cls, tableName, fields) {
    cls.createTable(tableName, function (t) {
        let defaultVal = '', columns, intM = 'integer', pkArr = [], auto = 0;
        for (let n in fields) {
            if (fields[n].pk === true) {
                pkArr.push(n);
            }
            // increments
            if (fields[n].auto) {
                auto = 1;
                columns = t.increments(n);
            } else {
                switch (fields[n].type) {
                    case 'integer':
                        if (fields[n].size > 11) {
                            intM = 'bigInteger';
                        }
                        if (helper.isNumber(defaultVal)) {
                            columns = t[intM](n).defaultTo(defaultVal);
                        } else {
                            columns = t[intM](n);
                        }
                        break;
                    case 'float':
                        if (helper.isNumber(defaultVal)) {
                            columns = t.float(n, 8, fields[n].size || 2).defaultTo(defaultVal);
                        } else {
                            columns = t.float(n, 8, fields[n].size || 2);
                        }
                        break;
                    case 'json':
                    case 'array':
                        if (helper.isJSONStr(defaultVal)) {
                            columns = t.json(n).defaultTo(defaultVal);
                        } else {
                            columns = t.json(n);
                        }
                        break;
                    case 'text':
                        if (helper.isJSONStr(defaultVal)) {
                            columns = t.text(n).defaultTo(defaultVal);
                        } else {
                            columns = t.text(n);
                        }
                        break;
                    case 'string':
                    default:
                        if (helper.isString(defaultVal)) {
                            columns = t.string(n, fields[n].size).defaultTo(defaultVal);
                        } else {
                            columns = t.string(n, fields[n].size);
                        }
                        break;
                }
            }
            // --- columns.xx()
            // comment
            if (fields[n].comment) {
                columns.comment(fields[n].comment || '');
            }
            // required
            if (fields[n].required === true) {
                columns.notNullable(n);
            }

            // --- table.xx()
            // index
            if (fields[n].index === true) {
                fields[n].required = true;
                t.index(n, `${tableName}_${n}`);
            }
            // unique
            if (fields[n].unique === true) {
                t.unique(n);
            }
        }
        //auto_increment会默认设置字段为主键,和主键设置冲突
        if (pkArr.length > 0 && !auto) {
            t.primary(pkArr);
        }
    });
};


module.exports = class {

    constructor(config = {}) {
        this.config = config;
        this.knexClient = null;
    }
    /**
     * 
     * 
     * @param {any} cls 
     * @param {any} data 
     * @param {any} options 
     * @returns 
     */
    parseData(cls, data, options) {
        return cls;
    }
    /**
     *
     * @param cls
     * @param data
     * @param options
     */
    parseField(cls, data, options) {
        if (helper.isEmpty(options.field)) {
            return cls;
        }
        cls.column(options.field);
        return cls;
    }
    /**
     *
     * @param cls
     * @param data
     * @param options
     */
    parseWhere(cls, data, options) {
        if (helper.isEmpty(options.where)) {
            return cls;
        }
        //parse where options
        parseKnexWhere(cls, options.where, options.alias);
        return cls;
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
            return cls;
        }
        cls.groupBy(options.group);
        return cls;
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
            return cls;
        }
        cls.distinct(helper.isArray(options.distinct) ? options.distinct.join(',') : options.distinct);
        return cls;
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
            return cls;
        }
        for (let n in options.having) {
            if (helper.isObject(options.having[n])) {
                for (let y in options.having[n]) {
                    cls.having(n, y, options.having[n][y]);
                }
            }
        }
        return cls;
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
                if (helper.isArray(item.field)) {
                    item.field.map(f => options.field.push(`${joinAlias}.${f}`));
                }
            });
        }
        return cls;
    }
    /**
     *
     * @param cls
     * @param data
     * @param options
     */
    parseLimit(cls, data, options) {
        if (helper.isEmpty(options.limit)) {
            return cls;
        }
        cls.limit(options.limit[1] || 10).offset(options.limit[0] || 0);
        return cls;
    }
    /**
     *
     * @param cls
     * @param data
     * @param options
     */
    parseOrder(cls, data, options) {
        if (helper.isEmpty(options.order)) {
            return cls;
        }
        for (let n in options.order) {
            if (n.indexOf('.') > -1) {
                cls.orderBy(n, options.order[n]);
            } else {
                cls.orderBy(`${options.alias}.${n}`, options.order[n]);
            }
        }
        return cls;
    }
    /**
     *
     * @param cls
     * @param data
     * @param options
     */
    parseSchema(cls, data, options) {
        if (helper.isEmpty(data) && helper.isEmpty(options.schema)) {
            return cls;
        }
        // let dbType = options.schema.dbtype;
        parseKnexSchema(cls, options.schema.table || '', options.schema.fields || {});
        return cls;
    }
    /**
     * 
     * 
     * @param {any} cls 
     * @param {any} data 
     * @param {any} options 
     * @returns 
     */
    buildADD(cls, data, options) {
        this.knexClient = cls.insert(data).from(options.table);
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
    buildDELETE(cls, data, options) {
        this.knexClient = cls.del().from(options.table);
        return this.parseWhere(this.knexClient, data, options);
    }
    /**
     * 
     * 
     * @param {any} cls 
     * @param {any} data 
     * @param {any} options 
     * @returns 
     */
    buildUPDATE(cls, data, options) {
        this.knexClient = cls.update(data).from(options.table);
        this.parseData(this.knexClient, data, options);
        return this.parseWhere(this.knexClient, data, options);
    }
    /**
     * 
     * 
     * @param {any} cls 
     * @param {any} data 
     * @param {any} options 
     * @returns 
     */
    buildINCREMENT(cls, data, options) {
        this.knexClient = cls(options.table).increment(options.targetField, data[options.targetField]);
        delete data[options.targetField];
        this.parseData(this.knexClient, data, options);
        return this.parseWhere(this.knexClient, data, options);
    }
    /**
     * 
     * 
     * @param {any} cls 
     * @param {any} data 
     * @param {any} options 
     * @returns 
     */
    buildDECREMENT(cls, data, options) {
        this.knexClient = cls(options.table).decrement(options.targetField, data[options.targetField]);
        delete data[options.targetField];
        this.parseData(this.knexClient, data, options);
        return this.parseWhere(this.knexClient, data, options);
    }
    /**
     * 
     * 
     * @param {any} cls 
     * @param {any} data 
     * @param {any} options 
     * @returns 
     */
    buildSELECT(cls, data, options) {
        options.table = options.alias ? `${options.table} as ${options.alias}` : options.table;
        this.knexClient = cls.select().from(options.table);
        this.parseJoin(this.knexClient, data, options);
        this.parseField(this.knexClient, data, options);
        this.parseWhere(this.knexClient, data, options);
        this.parseLimit(this.knexClient, data, options);
        this.parseOrder(this.knexClient, data, options);
        this.parseDistinct(this.knexClient, data, options);
        this.parseGroup(this.knexClient, data, options);
        return this.parseHaving(this.knexClient, data, options);
    }
    /**
     * 
     * 
     * @param {any} cls 
     * @param {any} data 
     * @param {any} options 
     */
    buildCOUNT(cls, data, options) {
        options.table = options.alias ? `${options.table} as ${options.alias}` : options.table;
        this.knexClient = cls.count(`${options.targetField || options.pk} AS count`).from(options.table);
        this.parseJoin(this.knexClient, data, options);
        this.parseWhere(this.knexClient, data, options);
        this.parseLimit(this.knexClient, data, options);
        this.parseDistinct(this.knexClient, data, options);
        this.parseGroup(this.knexClient, data, options);
        return this.parseHaving(this.knexClient, data, options);
    }
    /**
     * 
     * 
     * @param {any} cls 
     * @param {any} data 
     * @param {any} options 
     */
    buildSUM(cls, data, options) {
        options.table = options.alias ? `${options.table} as ${options.alias}` : options.table;
        this.knexClient = cls.sum(`${options.targetField || options.pk} AS sum`).from(options.table);
        this.parseJoin(this.knexClient, data, options);
        this.parseWhere(this.knexClient, data, options);
        this.parseLimit(this.knexClient, data, options);
        this.parseDistinct(this.knexClient, data, options);
        this.parseGroup(this.knexClient, data, options);
        return this.parseHaving(this.knexClient, data, options);
    }
    /**
     * 
     * 
     * @param {any} cls 
     * @param {any} data 
     * @param {any} options 
     * @returns 
     */
    buildMIGRATE(cls, data, options) {
        this.knexClient = cls.schema;
        return this.parseSchema(this.knexClient, data, options);
    }
    /**
     * 
     * 
     * @static
     * @param {*} config
     * @param {*} data
     * @param {*} options
     * @param {*} cls
     * @returns 
     */
    static async buildSql(config, data, options, cls) {
        if (options === undefined) {
            options = data;
        }
        if (!cls) {
            cls = knex({
                client: config.db_type || 'mysql'
            });
        }
        //防止外部options被更改
        let parseOptions = helper.clone(options, true);
        let handle = new this(config);
        return handle[`build${parseOptions.method}`](cls, data, parseOptions).toString();
    }

    /**
     *
     *
     * @static
     * @param {*} config
     * @param {*} data
     * @param {*} options
     * @param {*} cls
     * @returns
     */
    static async querySql(config, data, options, cls) {
        if (options === undefined) {
            options = data;
        }
        //防止外部options被更改
        let parseOptions = helper.clone(options, true);
        let handle = new this(config);
        return handle[`build${parseOptions.method}`](cls, data, parseOptions);
    }
};