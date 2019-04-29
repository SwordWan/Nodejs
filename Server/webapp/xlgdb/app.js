"use strict";
const cfg = require('../configs');
const express = require('express');
const bodyParser = require('body-parser');
const redis = require("ioredis");
const app = express();
const adm = require("./modules/load-router");
const ses = require('./modules/redis-session');
const hbs = require('./modules/hbs');
const acc = require('./modules/access');
const sms = require('./modules/sms');
const mdb = require('./driver/driver');

const redisSMS = new redis(cfg.redisSMS);

console.log(JSON.stringify(cfg));

mdb.init(cfg.driver);
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(__dirname + '/public'));
hbs.init(app, __dirname);//hbs模块设置
ses.init(app, cfg.redisSession);//session模块设置
acc.init(app);//加载权限模块设置
adm.init(app, __dirname + '/router/admin');//加载router模块
sms.init(app, cfg.sms, redisSMS);//短信模块
//开启web服务器

app.listen(cfg.port, function () {
    console.log('express启动并监听' + cfg.ip + '，端口，' + cfg.port);
});