const co = require('co');
const lib = require('think_lib');
/**
 * co lib
 * 
 * @param {any} obj 
 * @returns 
 */
lib.thinkco = function (obj) {
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
lib.parseName = function (name) {
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
lib.parsePage = function (page = 1, listRows) {
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
lib.parseOptions = function (model, oriOpts = {}) {
    if (oriOpts.paresed === true) {
        return oriOpts;
    }
    //解析扩展写法参数
    let paresedOpt = Object.create(model.options);
    //清空model.options,避免影响下次查询
    model.options = {};
    if (lib.isObject(oriOpts) && !oriOpts.paresed) {
        const parseCase = { alias: 1, field: 1, where: 1, limit: 1, order: 1, group: 1, join: 1, distinct: 1, having: 1 };
        for (let n in oriOpts) {
            if (parseCase[n]) {
                const cls = model[n](oriOpts[n]);
                paresedOpt = Object.assign(paresedOpt, cls.options);
            }
        }
    }
    if (!lib.isEmpty(oriOpts)) {
        // paresedOpt = lib.extend(paresedOpt, oriOpts, true);
        paresedOpt = Object.assign(paresedOpt, oriOpts);
    }

    //获取表名
    paresedOpt.table = paresedOpt.table || model.tableName;
    //模型名称
    paresedOpt.name = model.modelName;
    //模型查询别名
    paresedOpt.alias = paresedOpt.alias || model.modelName;
    //模型主键
    paresedOpt.pk = model.pk || model.getPk();
    //模型字段
    if (lib.isEmpty(paresedOpt.field)) {
        paresedOpt.field = Object.keys(model.fields || {}) || [];
    }
    //标志
    paresedOpt.paresed = true;
    return paresedOpt;
};

module.exports = lib;


