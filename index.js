/**
 * @Author: richen 
 * @Date: 2018-01-31 14:07:54 
 * @Copyright (c) - <richenlin(at)gmail.com>
 * @Last Modified by: richen
 * @Last Modified time: 2019-07-02 18:00:13
 */

// global.Promise = require('bluebird');
const logger = require('think_logger');
const helper = require('./lib/helper.js');
const adapter = require('./lib/adapter.js');

/**
 * 
 * 
 * @class liteQ
 */
class liteQ {
    /**
     * Creates an instance of liteQ.
     * @param {any[]} args 
     * @memberof liteQ
     */
    constructor(...args) {
        // 数据表字段信息
        this.fields = this.fields || {
            id: {
                type: 'integer',
                pk: true
            }
        };
        // 主键
        this.pk = this.pk || '';
        // init
        this.init(...args);

        if (!this.config) {
            // 数据源配置
            if (args[0]) {
                this.config = args[0];
            } else {
                throw Error('model config is undefined.');
            }
        }
        // SQL操作项
        this.options = {};
        // Adapter实例
        this.instance = null;
        // 模型名称
        if (!this.modelName) {
            throw Error('modelName is undefined.');
        }
        // 数据表名
        this.tableName = this.tableName || this.getTableName();
    }
    /**
     * 
     * 
     * @memberof liteQ
     */
    init() {

    }

    /**
     * Get an adapter instance.
     * 
     * @param {boolean} [forceNew=false] 
     * @returns 
     * @memberof liteQ
     */
    async getInstance(forceNew = false) {
        if (!this.instance || forceNew) {
            this.instance = await adapter.getInstance(this.config, forceNew);
        }
        return this.instance;
    }

    /**
     * Setting up an adapter instance.
     *
     * @param {*} ins
     * @returns
     * @memberof liteQ
     */
    setInstance(ins) {
        if (!ins || !ins.knexClient) {
            return this.error('The parameter passed in must be an instance of the adapter!');
        }
        const model = Object.create(this);
        model.instance = ins;
        return model;
    }

    /**
     * 
     * 
     * @param {any} err 
     * @returns 
     * @memberof liteQ
     */
    error(err) {
        let msg = err;
        if (msg) {
            if (!helper.isError(msg)) {
                if (!helper.isString(msg)) {
                    msg = JSON.stringify(msg);
                }
                msg = new Error(msg);
            }
            logger.error(msg);
        }
        return Promise.reject(msg);
    }
    /**
     * 获取表名
     * 
     * @returns 
     * @memberof liteQ
     */
    getTableName() {
        if (helper.isEmpty(this.modelName)) {
            return this.error('modelName is undefined.');
        }
        if (!this.tableName) {
            let tableName = this.config.db_prefix || '';
            tableName += helper.parseName(this.modelName);
            this.tableName = tableName.toLowerCase();
        }
        return this.tableName;
    }
    /**
     * 获取主键
     * 
     * @returns 
     * @memberof liteQ
     */
    getPk() {
        try {
            if (helper.isEmpty(this.pk)) {
                for (const n in this.fields) {
                    if (this.fields[n] && this.fields[n].pk === true) {
                        this.pk = n;
                        break;
                    }
                }
            }
            return this.pk;
        } catch (e) {
            return this.error(e);
        }
    }

    /**
     * 分拣列
     * field(['aaa', 'bbb', 'ccc'])
     * @param {any} values 
     * @returns 
     * @memberof liteQ
     */
    field(values) {
        try {
            if (!values) {
                return this;
            }
            if (helper.isString(values)) {
                values = values.replace(/ +/g, '').split(',');
            }
            if (helper.isArray(values)) {
                this.options.field = values;
            }
            return this;
        } catch (e) {
            return this.error(e);
        }
    }
    /**
     * 别名
     * alias('xxx')
     * @param {any} values 
     * @returns 
     * @memberof liteQ
     */
    alias(values) {
        try {
            if (!values) {
                return this;
            }
            if (helper.isString(values)) {
                this.options.alias = values;
            }
            return this;
        } catch (e) {
            return this.error(e);
        }
    }
    /**
     * 查询条件
     * or:  where({or: [{...}, {...}]})
     * not: where({not: {name: '', id: 1}})
     * notin: where({notin: {'id': [1,2,3]}})
     * in: where({id: [1,2,3]})
     * and: where({id: 1, name: 'a'},)
     * operator: where({id: {'<>': 1}})
     * operator: where({id: {'<>': 1, '>=': 0, '<': 100, '<=': 10}})
     * like: where({name: {'like': '%a'}})
     * @param {any} values 
     * @returns 
     * @memberof liteQ
     */
    where(values) {
        try {
            if (!values) {
                return this;
            }
            if (helper.isObject(values)) {
                this.options.where = values;
            }
            return this;
        } catch (e) {
            return this.error(e);
        }
    }
    /**
     * 区间
     * limit(1)
     * limit(10, 20)
     * limit([10, 10])
     * @param {any} skip 
     * @param {any} limit 
     * @returns 
     * @memberof liteQ
     */
    limit(skip, limit) {
        try {
            if (skip === undefined) {
                skip = 0;
            }
            if (skip && limit === undefined) {
                if (helper.isArray(skip)) {
                    limit = skip[1];
                    skip = skip[0];
                } else {
                    limit = skip;
                    skip = 0;
                }
            }
            if (limit === undefined) {
                limit = 1;
            }
            skip = helper.toInt(skip);
            limit = helper.toInt(limit);
            this.options.limit = [skip, limit];
            return this;
        } catch (e) {
            return this.error(e);
        }
    }
    /**
     * 排序
     * order({xxx: 'desc'})
     * @param {any} values 
     * @returns 
     * @memberof liteQ
     */
    order(values) {
        try {
            if (!values) {
                return this;
            }
            if (helper.isObject(values)) {
                this.options.order = values;
            }
            return this;
        } catch (e) {
            return this.error(e);
        }
    }
    /**
     * 去重
     * distinct(['first_name'])
     * @param {array} values 
     * @returns 
     * @memberof liteQ
     */
    distinct(values) {
        try {
            if (!values) {
                return this;
            }
            if (helper.isArray(values)) {
                this.options.distinct = values;
            }
            return this;
        } catch (e) {
            return this.error(e);
        }
    }
    /**
     * 分组
     * group('xxx')
     * group(['xxx', 'xxx'])
     * @param {any} values 
     * @returns 
     * @memberof liteQ
     */
    group(values) {
        try {
            if (!values) {
                return this;
            }
            if (helper.isString(values) || helper.isArray(values)) {
                this.options.group = values;
            }
            return this;
        } catch (e) {
            return this.error(e);
        }
    }
    /**
     * HAVING子句
     * having({"name":{">": 100}})
     * @param {any} values 
     * @returns 
     * @memberof liteQ
     */
    having(values) {
        try {
            if (!values) {
                return this;
            }
            if (helper.isObject(values)) {
                this.options.having = values;
            }
            return this;
        } catch (e) {
            return this.error(e);
        }
    }
    /**
     * 关联
     * join([{from: 'Test', alias: 'test', on: {aaa: bbb, ccc: ddd}, field: ['id', 'name'], type: 'inner'}])
     * join([{from: 'Test', alias: 'test', on: {or: [{aaa: bbb}, {ccc: ddd}]}, field: ['id', 'name'], type: 'left'}])
     * join([{from: 'Test', alias: 'test', on: {aaa: bbb, ccc: ddd}, field: ['id', 'name'], type: 'right'}])
     * @param {any} values 
     * @returns 
     * @memberof liteQ
     */
    join(values) {
        try {
            if (!values) {
                return this;
            }
            if (helper.isArray(values)) {
                this.options.join = values;
            }
            return this;
        } catch (e) {
            return this.error(e);
        }
    }
    /**
     * 新增数据
     * 
     * @param {any} data 
     * @param {any} options 
     * @returns 
     * @memberof liteQ
     */
    async add(data, options) {
        try {
            if (helper.isEmpty(data)) {
                throw Error('Data can not be empty');
            }
            let parsedOptions = helper.parseOptions(this, options);
            let instance = await this.getInstance();
            let result;
            if (helper.isArray(data)) {
                result = await instance.batchAdd(data, parsedOptions);
                return result || [];
            } else {
                result = await instance.add(data, parsedOptions);
                data[this.pk] = data[this.pk] ? data[this.pk] : result;
                return data[this.pk] || 0;
            }

        } catch (e) {
            return this.error(e);
        }
    }
    /**
     * 删除数据
     * 
     * @param {any} options 
     * @returns 
     * @memberof liteQ
     */
    async delete(options) {
        try {
            let parsedOptions = helper.parseOptions(this, options);
            if (helper.isEmpty(parsedOptions.where)) {
                return this.error('The deletion condition can not be empty');
            }
            let instance = await this.getInstance();
            let result = await instance.delete(parsedOptions);
            return result || 0;
        } catch (e) {
            return this.error(e);
        }
    }
    /**
     * 更新数据
     * 
     * @param {any} data 
     * @param {any} options 
     * @returns 
     * @memberof liteQ
     */
    async update(data, options) {
        try {
            let parsedOptions = helper.parseOptions(this, options);
            // copy data
            let _data = helper.clone(data, true);
            // 如果存在主键数据 则自动作为更新条件
            this.pk = this.getPk();
            if (helper.isEmpty(parsedOptions.where)) {
                if (!helper.isEmpty(_data[this.pk])) {
                    parsedOptions.where = {};
                    parsedOptions.where[this.pk] = _data[this.pk];
                    delete _data[this.pk];
                } else {
                    throw Error('Update condition error');
                }
            } else {
                if (!helper.isEmpty(_data[this.pk])) {
                    delete _data[this.pk];
                }
            }
            let instance = await this.getInstance();
            let result = await instance.update(_data, parsedOptions);
            return result || [];
        } catch (e) {
            return this.error(e);
        }
    }
    /**
     * 字段自增
     * 
     * @param {any} field 
     * @param {number} [step=1] 
     * @param {any} data 
     * @param {any} options 
     * @returns 
     * @memberof liteQ
     */
    async increment(field, step = 1, data = {}, options) {
        try {
            let parsedOptions = helper.parseOptions(this, options);
            if (helper.isEmpty(field)) {
                return this.error('Field name error');
            }
            data[field] = step;
            let instance = await this.getInstance();
            let result = await instance.increment(data, field, parsedOptions);
            return result || [];
        } catch (e) {
            return this.error(e);
        }
    }
    /**
     * 字段自减
     * 
     * @param {any} field 
     * @param {number} [step=1] 
     * @param {any} data 
     * @param {any} options 
     * @returns 
     * @memberof liteQ
     */
    async decrement(field, step = 1, data = {}, options) {
        try {
            let parsedOptions = helper.parseOptions(this, options);
            if (helper.isEmpty(field)) {
                return this.error('Field name error');
            }
            data[field] = step;
            let instance = await this.getInstance();
            let result = await instance.decrement(data, field, parsedOptions);
            return result || [];
        } catch (e) {
            return this.error(e);
        }
    }
    /**
     * 统计数据条数
     * 
     * @param {any} field 
     * @param {any} options 
     * @returns 
     * @memberof liteQ
     */
    async count(field, options = {}) {
        try {
            let parsedOptions = helper.parseOptions(this, options);
            let instance = await this.getInstance();
            field = field || this.getPk();
            let result = await instance.count(field, parsedOptions);
            return result || 0;
        } catch (e) {
            return this.error(e);
        }
    }

    /**
     * 统计字段求和
     *
     * @param {*} field
     * @param {*} [options={}]
     * @returns
     * @memberof liteQ
     */
    async sum(field, options = {}) {
        try {
            let parsedOptions = helper.parseOptions(this, options);
            let instance = await this.getInstance();
            field = field || this.getPk();
            let result = await instance.sum(field, parsedOptions);
            return result || 0;
        } catch (e) {
            return this.error(e);
        }
    }
    /**
     * 查询单条数据
     * 
     * @param {any} options 
     * @memberof liteQ
     */
    async find(options) {
        try {
            let parsedOptions = helper.parseOptions(this, options);
            let instance = await this.getInstance();
            let result = await instance.find(parsedOptions);
            return result || {};
        } catch (e) {
            return this.error(e);
        }
    }
    /**
     * 查询多条数据
     * 
     * @param {any} options 
     * @returns 
     * @memberof liteQ
     */
    async select(options) {
        try {
            let parsedOptions = helper.parseOptions(this, options);
            let instance = await this.getInstance();
            let result = await instance.select(parsedOptions);
            return result || [];
        } catch (e) {
            return this.error(e);
        }
    }
    /**
     * 分页查询
     * 
     * @param {any} options 
     * @returns 
     * @memberof liteQ
     */
    async countSelect(options) {
        try {
            let parsedOptions = helper.parseOptions(this, options);
            let instance = await this.getInstance();
            let countNum = await instance.count(this.getPk(), parsedOptions);
            let pageOptions = helper.parsePage(parsedOptions.page || 1, parsedOptions.num || 10);
            let totalPage = Math.ceil(countNum / pageOptions.num);
            if (pageOptions.page > totalPage) {
                pageOptions.page = totalPage;
            }
            //传入分页参数
            let offset = (pageOptions.page - 1) < 0 ? 0 : (pageOptions.page - 1) * pageOptions.num;
            parsedOptions.limit = [offset, pageOptions.num];
            let result = helper.extend({ count: countNum, total: totalPage }, pageOptions);
            result.data = await instance.select(parsedOptions);
            return result;
        } catch (e) {
            return this.error(e);
        }
    }

    /**
     * 生成sqlString
     *
     * @param {*} options 
     * {method: find | select | add | update | count | sum | decrement | increment}
     * @param {*} data
     * @returns
     * @memberof liteQ
     */
    async sql(options = {}, data) {
        try {
            let parsedOptions = helper.parseOptions(this, options);
            let instance = await this.getInstance();
            let result = await instance.sql(parsedOptions, data);
            return result || [];
        } catch (e) {
            return this.error(e);
        }
    }

    /**
     * 原生语句查询
     * mysql  TestModel.query('select ?, ? from test where id=?', ['id', 'name', 1]);
     * mongo  TestModel.query('db.test.find()');
     * @param {any} sqlStr 
     * @param {any} [params=[]] binding
     * @returns 
     * @memberof liteQ
     */
    async query(sqlStr, params = []) {
        try {
            let instance = await this.getInstance();
            if (helper.isEmpty(params)) {
                logger.warn('recommended use of the bind variable pattern.');
            }
            if ((/[&(--);]/).test(sqlStr)) {
                sqlStr = sqlStr.replace(/&/g, '&amp;').replace(/;/g, '').replace(/--/g, '&minus;&minus;');
            }
            let result = await instance.native(sqlStr, params);
            return result;
        } catch (e) {
            return this.error(e);
        }
    }
    /**
     * 执行事务
     * 
     * @param {Function} fn 
     * @returns 
     * @memberof liteQ
     */
    async transaction(fn) {
        const instance = await this.getInstance(true);
        const trx = await instance.knexClient.transaction();
        try {
            instance.knexClient = trx;
            let result = await fn(instance);
            await trx.commit();
            return result;
        } catch (e) {
            await trx.rollback();
            return this.error(e);
        } finally {
            await instance.close();
            this.instance = null;
        }
    }

    /**
     * 事务查询锁
     *
     * @param {*} tsx
     * @memberof liteQ
     */
    forUpdate(tsx) {
        this.instance.knexClient.transacting(tsx).forUpdate();
        return this;
    }

    /**
     * 数据迁移
     *
     * @param {*} sqlStr
     * @returns
     * @memberof liteQ
     */
    async migrate(sqlStr) {
        try {
            let instance = await this.getInstance();
            let schema = {
                table: this.tableName,
                name: this.modelName,
                fields: this.fields,
                dbtype: this.config.db_type
            };
            let result = await instance.migrate(schema, sqlStr);
            return result;
        } catch (e) {
            return this.error(e);
        }
    }
}

liteQ.helper = helper;
module.exports = liteQ;