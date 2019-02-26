const co = require('co');
const lib = require('think_lib');
/**
 * co lib
 * 
 * @param {any} obj 
 * @returns 
 */
const thinkco = function (obj) {
    //optimize invoke co package
    if (obj && typeof obj.next === 'function') {
        return co(obj);
    }
    return Promise.resolve(obj);
};
/**
 * 表名处理
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
 * 分页处理
 * 
 * @param {any} page 
 * @param {any} listRows 
 * @returns 
 */
const parsePage = function (page = 1, listRows) {
    if (lib.isArray(page)) {
        listRows = page[1];
        page = page[0];
    }
    return { page: page, num: listRows || 10 };
};

/**
 * 条件解析
 * 
 * @param {any} model 
 * @param {any} oriOpts 
 * @param {any} [extraOptions={}] 
 * @returns 
 */
const parseOptions = function (model, oriOpts = {}) {
    //解析扩展写法参数
    if (lib.isObject(oriOpts) && !oriOpts.paresed) {
        let parseCase = { alias: 1, field: 1, where: 1, limit: 1, order: 1, group: 1, join: 1, distinct: 1, having: 1 };
        for (let n in oriOpts) {
            if (parseCase[n]) {
                model[n](oriOpts[n]);
            }
        }
    }
    let options = lib.extend(model.options, oriOpts || {}, true);
    //清空model.options,避免影响下次查询
    model.options = {};
    //获取表名
    options.table = model.tableName;
    //模型名称
    options.name = model.modelName;
    //模型查询别名
    options.alias = options.alias || model.modelName;
    //模型主键
    options.pk = model.pk || model.getPk();
    //标志
    options.paresed = true;
    return options;
};

module.exports = Object.assign(lib, new Proxy({
    thinkco: thinkco,
    parseName: parseName,
    parsePage: parsePage,
    parseOptions: parseOptions
}, {
        set: function (target, key, value, receiver) {
            if (Reflect.get(target, key, receiver) === undefined) {
                return Reflect.set(target, key, value, receiver);
            } else {
                throw Error('Cannot redefine getter-only property');
            }
        },
        deleteProperty: function (target, key) {
            throw Error('Cannot delete getter-only property');
        }
    }));


