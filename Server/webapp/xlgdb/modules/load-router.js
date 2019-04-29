"use strict";
let fs = require('fs');
let path = require('path');
let inited = false;
let loadRouter = function (app, dir) {
    //根据url来处理权限问题
    var dirList = fs.readdirSync(dir);
    for (let i = 0; i < dirList.length; i++) {
        let name = dirList[i];
        if (fs.statSync(dir + '/' + name).isFile()) {
            let _name = path.basename(dir + '/' + name, '.js');
            if ('index' == _name) {
                app.use('/admin', require(dir + '/' + _name));
                console.log('loader admin', '/admin');
            } else {
                app.use('/admin/' + _name, require(dir + '/' + _name));
                console.log('loader admin', '/admin/' + _name);
            }
        }
    }
}

module.exports = {
    init: function (app, dir, web, max_lv) {
        if (inited) {
            return console.log('all ready inited...');
        }
        inited = true;
        loadRouter(app, dir, web, max_lv);
    }
};