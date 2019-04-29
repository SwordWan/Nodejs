const crypto = require('crypto');
const http = require('http');
let appID = null;
let appKey = null;
let redis = null;
let config = null;

var randomNumber = function (under, over) {
    return parseInt(Math.random() * (over - under + 1) + under);
};

var sendSMS = async function (phone, code, message) {
    let params = [];
    let data = {
        mall_id: appID,
        phone: phone,
        code: message.replace('[code]', code),
        title: '',
        sign: ''
    }
    data.sign = crypto.createHash('md5').update(data.mall_id + data.phone + data.code + appKey).digest('hex');
    for (let key in data) {
        params.push(key + "=" + encodeURIComponent(data[key]));
    }
    let url = "http://www.nuozhengtong.cn/sms.php?" + params.join("&");
    return new Promise(function (resolve, reject) {
        let req = http.get(url, function (res) {
            let body = '';
            res.setEncoding('utf8');
            res.on('data', function (chunk) {
                body += chunk;
            });
            res.on('end', function () {
                let d = null;
                try {
                    d = JSON.parse(body);
                    resolve(d);
                }
                catch (e) {
                    resolve({ errcode: -2, errmsg: e.message });
                }
            });
        });
        req.on('error', function (e) {
            resolve({ errcode: -1, errmsg: e.message });
        });
        req.end();
    });
}

var realNameAuthentification = async function (realname, phone, idcard) {
    let time = new Date().getTime();
    let params = [];
    let data = {
        mall_id: appID,
        realname: realname,
        idcard: idcard.toLowerCase(),
        phone: phone,
        tm: time,
        sign: ''
    }
    data.sign = crypto.createHash('md5').update(data.mall_id + data.realname + data.idcard + data.tm + appKey).digest('hex');
    for (let key in data) {
        params.push(key + "=" + encodeURIComponent(data[key]));
    }
    let url = "http://120.27.32.132:8080/phone/server?" + params.join("&");
    return new Promise(function (resolve, reject) {
        let req = http.get(url, function (res) {
            let body = '';
            res.setEncoding('utf8');
            res.on('data', function (chunk) {
                body += chunk;
            });
            res.on('end', function () {
                //console.log("Got error: " + body);
                let d = null;
                try {
                    d = JSON.parse(body);
                    if (d.data.code == 1000) {
                        resolve({ errcode: 0, errmsg: "一致" });
                    } else {
                        resolve({ errcode: 1, errmsg: "不一致" });
                    }
                }
                catch (e) {
                    resolve({ errcode: -2, errmsg: e.message });
                }
            });
        });
        req.on('error', function (e) {
            //console.log("Got error: " + e.message);
            resolve({ errcode: -1, errmsg: e.message });
        });
        req.end();
    });
};

var isMobile = function (mobile) {
    let mobileRegExp = /^1[2345789]\d{9}$/;
    return mobileRegExp.test(mobile);
}

const isID = function (s) {
    return /^[1-9]{1}[0-9]*$/.test(s);
}

var gen_key = function (mobile, verify_type) {
    return "mobile_code:" + mobile + verify_type;
}

var redis_get = function (key) {
    return new Promise(function (resolve, reject) {
        redis.get(key, function (err, data) {
            resolve({ err: err, data: data });
        });
    });
};

var redis_set = function (key, code) {
    return new Promise(function (resolve, reject) {
        redis.set(key, JSON.stringify(code), function (err, data) {
            resolve({ err: err, data: data });
        });
    });
};

var redis_expire = function (key, expire) {
    return new Promise(function (resolve, reject) {
        redis.expire(key, expire, function (err, data) {
            resolve({ err: err, data: data });
        });
    });
};

var verify_config = function (verify_type, refResult) {
    let result = false;
    do {
        if (null == redis || null == config) {
            refResult.errcode = 1;
            refResult.errmsg = "未初始化";
            break;
        }
        if (null == config[verify_type]) {
            refResult.errcode = 1;
            refResult.errmsg = "未支持的类型";
            break;
        }
        if (!isID(config[verify_type].expire)) {
            refResult.errcode = 1;
            refResult.errmsg = "过期时间不正确";
            break;
        }
        if (!isID(config[verify_type].reset_expire)) {
            refResult.errcode = 1;
            refResult.errmsg = "重置发送时间不正确";
            break;
        }
        result = true;
    } while (false);
    return result;
}

var send_code = async function (mobile, type) {
    let result = { errcode: 0, errmsg: "验证码已发送至手机" };
    do {
        if (false == verify_config(type, result)) {
            break;
        }
        if (false == isMobile(mobile)) {
            result = { errcode: 1, errmsg: "手机号不正确" };
            break;
        }
        let sendExpire = config[type].reset_expire;
        let expire = config[type].expire;
        let key = gen_key(mobile, type);
        let reply = await redis_get(key);

        if (null != reply.err) {
            result = { errcode: 1, errmsg: "获取缓存数据出错" };
            break;
        }

        if (reply.data) {
            let code = JSON.parse(reply.data);
            let time = Math.floor(new Date().getTime() / 1000);
            let div = time - code.time1;
            if (div < sendExpire) {
                result = { errcode: 1, errmsg: "提交太频繁" };
                break;
            }
        }

        let rndNumber = randomNumber(10000, 99998);
        let time = Math.floor(new Date().getTime() / 1000);
        let code = { "code": rndNumber, "time1": time, "time2": time, "use": 0 };
        reply = await redis_set(key, code);
        if (null != reply.err || "OK" != reply.data) {
            result = { errcode: 1, errmsg: "验证码生成失败" };
            break;
        }

        await redis_expire(key, expire);

        let res = await sendSMS(mobile, rndNumber, config[type].message);
        if (res.code != 1000) {
            result = { errcode: 1, errmsg: res.message };
            break;
        }

    } while (false);

    return result;
}

var get_code = async function (mobile, type) {
    let result = {};
    do {
        if (false == verify_config(type, result)) {
            break;
        }
        if (false == isMobile(mobile)) {
            result = { errcode: 1, errmsg: "手机号不正确" };
            break;
        }
        let key = gen_key(mobile, type);
        let reply = await redis_get(key);
        let expire = config[type].expire;
        if (null != reply.err) {
            result = { errcode: 1, errmsg: "获取缓存数据出错" };
            break;
        }
        if (null == reply.data) {
            result = { errcode: 1, errmsg: "获取缓存数据不存在" };
            break;
        }

        let time = Math.floor(new Date().getTime() / 1000);
        let code = JSON.parse(reply.data);
        let div = time - code.time1;
        code.use++;
        code.time2 = time;
        if (div < 0 || div > expire || code.use > 1) {
            result = { errcode: 1, errmsg: "未找到或者已过期" };
            break;
        }

        reply = await redis_set(key, code);
        if (null != reply.err && "OK" != reply.data) {
            result = { errcode: 1, errmsg: "更新使用期限失败" };
            break;
        }

        await redis_expire(key, expire - div);

        result = { errcode: 0, errmsg: "获取成功", code: code };

    } while (false);

    return result;
};

module.exports = {
    init: function (app, _config, _redis) {
        if (null == redis) {
            redis = _redis;
            config = _config;
            appID = config.appID;
            appKey = config.appKey;
            app.get('/sms', async function (request, response) {
                try {
                    let res = await send_code(request.query.mobile, request.query.verify_type);
                    response.json(res);
                } catch (err) {
                    response.json({ errcode: -1000, err: err });
                }
            });
        }
    },
    authentification: realNameAuthentification,
    send: send_code,
    get: get_code
}