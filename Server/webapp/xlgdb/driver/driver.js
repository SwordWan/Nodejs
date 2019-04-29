let driver;
module.exports = {
    init: function (config) {
        if (driver) {
            return console.log('inited....');
        }
        if (config.driver == 'mysql') {
            driver = require('./mysql');
        } else if (config.driver == 'pgsql') {
            driver = require('./pgsql');
        } else {
            throw new Error('not support');
        }
        driver.init(config.options);
    },
    get: function () {
        return new driver.conn();
    }
};