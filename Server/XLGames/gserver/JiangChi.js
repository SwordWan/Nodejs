"use strict";
//let configs = require('./configs');
let express = require('express');
//let bodyParser = require('body-parser');
//let app = express();
let pgsql = require('../utils/pgsqlCC');
let BigNumber = require('bignumber.js');
let cropto = require('../utils/crypto');
var ErrorUtils = require("../utils/ErrorCodes");
var ErrorCodes = ErrorUtils.ErrorCodes;

// let x = new BigNumber(1234.56);
// console.log(x.dp(0, 3).toString());
// console.log(x.toString())

//pgsql.init(configs.driver);
// app.use(bodyParser.urlencoded({ extended: false }));
// app.use(bodyParser.json());
// app.use(express.static(__dirname + '/public'));

const TYPE_DEF = {
    NONE: 0,
    TIANHUANG: 1,
    DUOHUANG: 2,
    DUODUODUO: 3
}
exports.TYPE_DEF = TYPE_DEF;

async function calcjiangchi(body) {
    let conn = new pgsql.conn();
    let wins = [];
    let alliance_wins = [];
    let bError = true;
    try {
        do {
            await conn.Transaction();
            let sql = 'select userid ,golds ,tianhuang ,duohuang ,duoduoduo ,level from tb_alliance_jiangchi where uid = $1 FOR UPDATE';
            let res = await conn.Query(sql, [body.uid]);
            if (res.rowCount == 0) {
                console.log('========== not found');
                break;
            }
            let level = res.rows[0].level;
            let golds = new BigNumber(res.rows[0].golds);
            let rate_tianhuang = new BigNumber(res.rows[0].tianhuang).div(100);
            let rate_duohuang = new BigNumber(res.rows[0].duohuang).div(100);
            let rate_duoduoduo = new BigNumber(res.rows[0].duoduoduo).div(100);
            let rate_alliancer = new BigNumber(10).div(100);
            console.log('奖池金币数', golds.toString());
            console.log('天皇比例', rate_tianhuang.toString());
            console.log('朵皇比例', rate_duohuang.toString());
            console.log('朵朵朵比例', rate_duoduoduo.toString());
            let alliancergolds = new BigNumber(0);
            let alliancer = res.rows[0].userid;
            let lostgolds = new BigNumber(0);
            for (let i = 0; i < body.user.length; i++) {
                let win = body.user[i];
                let rate;
                if (TYPE_DEF.TIANHUANG == win.type) {
                    rate = rate_tianhuang;
                } else if (TYPE_DEF.DUOHUANG == win.type) {
                    rate = rate_duohuang;
                } else if (TYPE_DEF.DUODUODUO == win.type) {
                    rate = rate_duoduoduo;
                }

                let _userwin = golds.multipliedBy(rate);
                console.log('userwin去掉小数点前', _userwin.toString());
                _userwin = _userwin.dp(0, 3);
                console.log('userwin去掉小数点后', _userwin.toString());
                let _alliancergolds = _userwin.multipliedBy(rate_alliancer);
                console.log('管理去掉小数点前', _alliancergolds.toString());
                _alliancergolds = _alliancergolds.dp(0, 3);
                console.log('管理去掉小数点后', _alliancergolds.toString());
                alliancergolds = alliancergolds.plus(_alliancergolds);
                console.log('管理获得总金币数', alliancergolds.toString());
                golds = golds.minus(_userwin).minus(_alliancergolds);
                console.log('下轮计算奖池数', golds.toString());
                wins.push({ userid: win.userid, golds: _userwin.toString(), type: win.type });
                lostgolds = lostgolds.plus(_userwin).plus(_alliancergolds);
                console.log('奖池减少金币数', lostgolds.toString());
            }
            console.log('管理赢得金币数', alliancergolds.toString());
            alliance_wins.push({ userid: alliancer, golds: alliancergolds.toString() });

            sql = 'update tb_alliance_jiangchi set golds = golds - $1 where uid = $2';
            res = await conn.Query(sql, [lostgolds.toString(), body.uid]);
            if (res.rowCount == 0) {
                console.log('=========================');
                wins = [];
                alliance_wins = [];
                break;
            }
            bError = false;
        } while (false);
    } catch (e) {
        console.log(e.message);
        wins = [];
        alliance_wins = [];
    } finally {
        if (bError) {
            await conn.Rollback();
        } else {
            await conn.Commit();
        }
        conn.Release();
    }
    return { wins: wins, alliance_wins: alliance_wins };
}
exports.calcjiangchi = calcjiangchi;

async function writelogs(wins, alliance_wins, allianceid, creator ,level) {
    let conn = new pgsql.conn();
    try {
        do {
            for (let i = 0; i < wins.length; i++) {
                let golds = wins[i].golds;
                if (golds == '0' || golds == 0) {
                    continue;
                }
                let userid = wins[i].userid;
                let type = wins[i].type;
                let sql = 'insert into tb_userwin_logs("golds","userid","allianceid","alliancecreator","type","level") values($1,$2,$3,$4,$5,$6)';
                let res = await conn.Query(sql, [golds, userid, allianceid, creator, type, level]);
                if (res.rowCount == 0) {
                    console.log('写用户奖池日志失败');
                    break;
                }
            }
            for (let i = 0; i < alliance_wins.length; i++) {
                let golds = wins[i].golds;
                let userid = wins[i].userid;
                let sql = 'insert into tb_alliancewin_logs(userid,allianceid,golds,level) values($1,$2,$3,$4)';
                let res = await conn.Query(sql, [userid, allianceid, golds, level]);
                if (res.rowCount == 0) {
                    console.log('写管理奖池日志失败');
                    break;
                }
            }
        } while (false);
    } catch (e) {
        console.log(e.message);
    } finally {
        conn.Release();
    }
}
exports.writelogs = writelogs;

async function jiangchiinc(body) {
    let conn = new pgsql.conn();
    let result;
    try {
        do {
            let sql = 'update tb_alliance_jiangchi set golds = golds + $1 where uid = $2';
            let res = await conn.Query(sql, [body.golds, body.uid]);
            if (res.rowCount == 0) {
                console.log('奖池增加失败');
                result = { errcode: -1, errmsg: '奖池增加失败' };
                break;
            }
            result = { errcode: 0, errmsg: '奖池增加成功' };
        } while (false);
    } catch (e) {
        console.log(e.message);
        result = { errcode: -1, errmsg: '奖池增加异常' };
    } finally {
        conn.Release();
    }
    return result;
}
exports.jiangchiinc = jiangchiinc;

async function list(pSocket, pArgs) {
    let conn = new pgsql.conn();
    let jiangchi = [];
    let userlog = [];
    let uid = pArgs.uid;
    let allianceid = pArgs.allianceid;
    let level = pArgs.level;
    let mapLv = {
        '1': 0,
        '2': 1,
        '5': 2,
        '10': 3,
        '20': 4,
        '50': 5,
        '100': 6
    };
    try {

        let sql = 'select "golds","tianhuang","duohuang","duoduoduo","level" from tb_alliance_jiangchi where allianceid = $1 order by "level" asc';
        let res = await conn.Query(sql, [allianceid]);
        jiangchi = [
            { uid: 0, level: 1, golds: 0, tianhuang: 0, duohuang: 0, duoduoduo: 0 },
            { uid: 0, level: 2, golds: 0, tianhuang: 0, duohuang: 0, duoduoduo: 0 },
            { uid: 0, level: 3, golds: 0, tianhuang: 0, duohuang: 0, duoduoduo: 0 },
            { uid: 0, level: 4, golds: 0, tianhuang: 0, duohuang: 0, duoduoduo: 0 },
            { uid: 0, level: 5, golds: 0, tianhuang: 0, duohuang: 0, duoduoduo: 0 },
            { uid: 0, level: 6, golds: 0, tianhuang: 0, duohuang: 0, duoduoduo: 0 },
            { uid: 0, level: 7, golds: 0, tianhuang: 0, duohuang: 0, duoduoduo: 0 }
        ]
        let goldstotal = new BigNumber(0);
        for (let i = 0; i < res.rows.length; i++) {
            let lv = mapLv[res.rows[i].level];
            jiangchi.splice(lv, 1, res.rows[i]);
            goldstotal = goldstotal.plus(res.rows[i].golds);
        }
        let maxUser = null;
        sql = 'select tb_users.alias, max(tb_userwin_logs.golds) as golds ,type,tb_userwin_logs.ctime from tb_userwin_logs \
                 inner join tb_users on tb_userwin_logs.userid = tb_users.userid \
                 where allianceid=$1 and level=$2 GROUP BY "alias" ,type,tb_userwin_logs.ctime';
        res = await conn.Query(sql, [pArgs.allianceid, level]);
        if (res.rows.length > 0) {
            let row = res.rows[0];
            maxUser = {
                alias: cropto.fromBase64(row.alias),
                type: getstype(row.type),
                golds: row.golds,
                ctime: row.ctime,
            }

        }
        sql = 'select tb_users.alias, tb_userwin_logs.* from tb_userwin_logs inner join tb_users on tb_userwin_logs.userid = tb_users.userid where allianceid=$1 and level=$2 order by ctime desc limit 10 offset 0';
        res = await conn.Query(sql, [pArgs.allianceid, level]);
        let userlog = []

        for (let i = 0; i < res.rows.length; i++) {
            let row = res.rows[i];
            userlog.push({
                alias: cropto.fromBase64(row.alias),
                type: getstype(row.type),
                golds: row.golds,
                ctime: row.ctime,
            });

        }

        pSocket.emit("jclogs_result", {
            wErrCode: ErrorCodes.ERR_NOERROR,
            szErrMsg: "操作成功",
            iGoldsTotal: goldstotal,
            iJiangChi: jiangchi,
            pLogs: userlog,
            maxUser: maxUser
        });
    } catch (e) {
        console.log(e.message);
    } finally {
        conn.Release();
    }
}
exports.list = list;

/* uid 奖池记录 uid
{uid:12,golds:20}
*/
// app.use('/jangchi/inc', async function (req, res) {
//     let result = await jiangchiinc(req.body);
//     res.json(result);
// });
// /*
// {uid:12,user:[{type:1 ,userid:20},{type:2 ,userid:20},{type:2 ,userid:20}]}
// */
// app.use('/jiangchi', async function (req, res) {
//     let logs = await calcjiangchi(req.body);
//     res.json(logs.wins);
//     writelogs(logs.wins, logs.alliance_wins);
// });
/*
query.uid
query.allianceid
query.level
*/
// app.use('/jiangchiall', async function (req, res) {
//     let conn = new pgsql.conn();
//     let jiangchi = [];
//     let userlog = [];
//     let uid = req.query.uid;
//     let allianceid = req.query.allianceid;
//     let level = req.query.level;
//     try {

//         let sql = 'select "golds","tianhuang","duohuang","duoduoduo","level" from tb_alliance_jiangchi where uid = $1';
//         let res = await conn.Query(sql, uid);
//         jiangchi = [
//             { uid: 0, level: 1, golds: 0, tianhuang: 0, duohuang: 0, duoduoduo: 0 },
//             { uid: 0, level: 2, golds: 0, tianhuang: 0, duohuang: 0, duoduoduo: 0 },
//             { uid: 0, level: 3, golds: 0, tianhuang: 0, duohuang: 0, duoduoduo: 0 },
//             { uid: 0, level: 4, golds: 0, tianhuang: 0, duohuang: 0, duoduoduo: 0 },
//             { uid: 0, level: 5, golds: 0, tianhuang: 0, duohuang: 0, duoduoduo: 0 },
//             { uid: 0, level: 6, golds: 0, tianhuang: 0, duohuang: 0, duoduoduo: 0 },
//             { uid: 0, level: 7, golds: 0, tianhuang: 0, duohuang: 0, duoduoduo: 0 }
//         ]
//         for (let i = 0; i < res.rows; i++) {
//             let lv = parseInt(res.rows[0].level);
//             jiangchi.splice(lv, 1, row);
//         }
//         sql = 'select tb_users.alias,* from tb_userwin_logs where allianceid=$1 ,level=$2 order by ctime desc limit 0 ,10';
//         res = await conn.Query(sql, [req.body.allianceid, allianceid, level]);
//         let userlog = []
//         let goldstotal = new BigNumber(0);
//         for (let i = 0; i < res.rows.length; i++) {
//             let row = rows[i];
//             userlog.push({
//                 alias: cropto.fromBase64(row.alias),
//                 stype: getstype(row.type),
//                 golds: row.golds,
//                 ctime: row.ctime,
//             });
//             goldstotal = goldstotal.plus(row.golds);
//         }
//     } catch (e) {
//         console.log(e.message);
//     } finally {
//         conn.Release();
//     }

//     res.json({ errcode: 0, errmsg: '操作成功', goldstotal: goldstotal, jiangchi: jiangchi, logs: userlog });
// })

function getstype(type) {
    if (TYPE_DEF.TIANHUANG == type) {
        return '天皇';
    }
    if (TYPE_DEF.DUOHUANG == type) {
        return '朵皇';
    }
    if (TYPE_DEF.DUODUODUO == type) {
        return '朵朵朵'
    }
}



// app.listen(configs.jiangchi.port, configs.jiangchi.host, function () {
//     console.log('express启动并监听' + configs.jiangchi.host + '，端口，' + configs.jiangchi.port);
// });


async function t() {
    let body = {
        uid: 1,
        user: [{ type: 1, userid: 20 }, { type: 2, userid: 20 }, { type: 2, userid: 20 }]
    };

    let logs = await calcjiangchi(body);
    writelogs(logs.wins, logs.alliance_wins);
}