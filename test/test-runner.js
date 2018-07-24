/**
 * Given a db flavor and a query object, generate the SQL statement and test
 * it against the expected outcome.
 */
/*eslint-disable */
const assert = require('assert');
const async = require('async');
const genPromise = require('./genPromise.js');
const path = require('path');
const liteQ = require('../index.js');


class User extends liteQ {
    init(config) {
        // 数据表字段信息
        this.fields = {
            id: {
                type: 'integer',
                pk: true
            }
        };
        this.modelName = 'User';
    }
}
process.env.NODE_ENV = 'development';

module.exports = function (test, cb) {
    const testDialect = function(outcome, next) {
        let model = new User(outcome.config);
        let parser = outcome.parser;

        for (let n in outcome.query) {
            model = model[n](outcome.query[n]);
        }

        let options = liteQ.helper.parseOptions(model, outcome.options);
        return genPromise(function*(){
            let result = yield parser.buildSql(outcome.config, options);
            try {
                echo([outcome.dialect, result])
                assert.equal(result, outcome.sql);
                next();
            } catch (e) {
                return cb(e);
            };
        })();
    };
    
    async.each(test.outcomes, testDialect, cb);
};
