var db = require('../utils/db');
var AppConfigs = require("../configs_win");

db.init(AppConfigs.database()); // 初始化数据库

// 清除俱乐部在线人数
