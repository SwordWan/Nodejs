// var CSERVER_IP = "47.98.188.228";
// var GSERVER_IP = "47.98.188.228";

var CSERVER_IP = "192.168.0.181";
var GSERVER_IP = "192.168.0.181";

exports.database = function () {
    return {
        user: "postgres",
        database: "xlgdb",
        password: "963852741",
        port: 5432,
        max: 20,
        idleTimeoutMillis: 3000
    }
}

//账号服配置
exports.center_server = function () {
    return {
        ID: 1,
        NAME: "中心服务器",
        IP: CSERVER_IP,
        PORT: 9500,
        HTTPPORT: 9501
    };
}

//游戏服配置
exports.game_server = function () {
    return {
        ID: 101,    // 服务器ID (游戏服务器架设到的电脑ID标识)
        NAME: "扯旋儿",
        IP: GSERVER_IP,
        PORT: 9600,
        HTTPPORT: 9601
    }
}