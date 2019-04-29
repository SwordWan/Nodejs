let pgsql = require('../utils/pgsqlCC');
let ErrorUtils = require("../utils/ErrorCodes");
let ConstCodes = require('../utils/const');
let userMgr = require("./usermgr");
let crypto = require('../utils/crypto');
let ErrorCodes = ErrorUtils.ErrorCodes;
let DB = require("../Utils/db");

//购买vip金卡
async function buyvip(pSocket, pArgs) {
    let conn = new pgsql.conn();
    let iUserId = pSocket.iUserId;
    let index = parseInt(pArgs.index);
    try {
        do {
            if (isNaN(index) || undefined == ConstCodes.Vip_ZuanShi[index] || ConstCodes.Vip_ZuanShi[index] < 1) {
                pSocket.emit("buyvip_result", {
                    wErrCode: ErrorCodes.ERR_CLUBISNOTEXISTS,
                    szErrMsg: "记录未找到"
                });
                break;
            }
            let date = new Date();
            let diamond = ConstCodes.Vip_ZuanShi[index];
            let sql = 'select * from tb_users where userid = $1';
            let res = await conn.Query(sql, [iUserId]);
            if (res.rowsCount == 0) {
                pSocket.emit("buyvip_result", {
                    wErrCode: ErrorCodes.ERR_CLUBISNOTEXISTS,
                    szErrMsg: "用户未找到"
                });
                break;
            }
            if (res.rows[0].gems < diamond) {
                pSocket.emit("buyvip_result", {
                    wErrCode: ErrorCodes.ERR_CLUBISNOTEXISTS,
                    szErrMsg: "钻石不足"
                });
                break;
            }
            sql = "update tb_users set gems = gems - $1 ,vipendtime = vipendtime::timestamp + '30 day' where userid = $2 and gems - $1 >= 0";
            if (res.rows[0].vipendtime.getTime() < date.getTime()) {
                sql = "update tb_users set gems = gems - $1 ,vipendtime = now()::timestamp + '30 day' where userid = $2 and gems - $1 >= 0";
            }
            res = await conn.Query(sql, [diamond, iUserId]);
            if (res.rowsCount == 0) {
                console.log('更新vip时间失败', diamond, iUserId);
                pSocket.emit("setvip_result", {
                    wErrCode: ErrorCodes.ERR_CLUBISNOTEXISTS,
                    szErrMsg: "购买VIP金卡失败"
                });
                break;
            }

            pSocket.emit("buyvip_result", {
                wErrCode: ErrorCodes.ERR_NOERROR,
                szErrMsg: "购买VIP金卡成功"
            });

        } while (false);

    } catch (e) {
        console.log(e.message);
        pSocket.emit("buyvip_result", {
            wErrCode: ErrorCodes.ERR_CLUBISNOTEXISTS,
            szErrMsg: '接口异常'
        });
    } finally {
        conn.Release();
    }
}
//我的消息
async function mymessage(pSocket, pArgs) {
    let conn = new pgsql.conn();
    let iUserId = pSocket.iUserId;
    let page = parseInt(pArgs.page);
    let pagesize = 50;
    if (isNaN(page) || page <= 0) {
        page = 1;
    }
    let _page = page - 1;
    try {
        let sql = 'update tb_users set mymsgcount = 0 where userid = $1';
        await conn.Query(sql, [iUserId]);

        sql = 'select * from tb_mymessage where userid = $1 order by uid desc LIMIT $2 OFFSET $3';
        let res = await conn.Query(sql, [iUserId, pagesize, _page * pagesize]);
        // let sql = 'select * from tb_mymessage where userid = $1 ';
        // let res = await conn.Query(sql, [iUserId]);

        if (res.rows.length > 0) {
            page = page + 1;
        }

        pSocket.emit('mymessage_result', {
            wErrCode: ErrorCodes.ERR_NOERROR,
            szErrMsg: "查询成功",
            rows: res.rows,
            page: page
        });
    } catch (e) {
        console.log(e.message);
    } finally {
        conn.Release();
    }
}

//得到我的战绩查询参数
async function getforsearch(conn, iUserId) {
    let sql = 'select tb_clubs.allianceid ,tb_clubs.clubid ,tb_joinclubs.clublevel ,\
                    tb_joinclubs.alliancelevel from tb_joinclubs \
                    left join tb_clubs on tb_clubs.clubid = tb_joinclubs.clubid \
                    where tb_joinclubs.userid = $1';
    let res = await conn.Query(sql, [iUserId]);
    let forsearch = [];
    for (let i = 0; i < res.rows.length; i++) {
        if (res.rows[i].alliancelevel == 0) {
            forsearch.push('lm' + res.rows[i].allianceid);
        } else if (res.rows[i].alliancelevel == 1) {
            forsearch.push('lmgl' + iUserId);
        }
        if (res.rows[i].clublevel == 0) {
            forsearch.push('jlb' + res.rows[i].clubid);
        } else if (res.rows[i].clublevel == 1) {
            forsearch.push('jlb' + res.rows[i].clubid);
        }
    }
    forsearch.push('us' + iUserId);
    forsearch = unique(forsearch);

    return forsearch.join('|');
}
//我的战绩日历
async function zhanjidate(pSocket, pArgs) {
    let conn = new pgsql.conn();
    let iUserId = pSocket.iUserId;
    try {
        do {
            let forsearch = await getforsearch(conn, iUserId);
            let sql = 'select * from tb_game where forsearch @@ to_tsquery($1) order by ctime desc';
            let res = await conn.Query(sql, [forsearch]);
            let mapDT = {};
            for (let i = 0; i < res.rows.length; i++) {
                if (undefined == mapDT[res.rows[i].ym]) {
                    mapDT[res.rows[i].ym] = [];
                }
                mapDT[res.rows[i].ym].push(res.rows[i].dt);
            }
            let rows = [];
            for (let ym in mapDT) {
                let dt = unique(mapDT[ym]);
                dt.sort(function (a, b) {
                    return parseInt(a) - parseInt(b);
                });
                rows.push({ ym: ym, dt: JSON.stringify(dt) });
            }
            sql = 'select extdata from tb_users where userid = $1 ';
            res = await conn.Query(sql, [iUserId]);
            if (res.rowCount == 0) {
                console.log('用户未找到');
                pSocket.emit('zhanjidate_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "数据错误"
                });
                break;
            }
            let pExtData = DB.get_user_extdata(res.rows[0]);
            pSocket.emit('zhanjidate_result', {
                wErrCode: ErrorCodes.ERR_NOERROR,
                szErrMsg: "获取数据成功",
                iPlayTimes: pExtData.iPlayTimes,
                iGameTimes: pExtData.iGameTimes,
                rows: rows
            });
        } while (false);
    } catch (e) {
        console.log(e.messagge);
    } finally {
        conn.Release();
    }
}
//我的战绩列表
async function zhanjilist(pSocket, pArgs) {
    let conn = new pgsql.conn();
    let iUserId = pSocket.iUserId;
    let ymd = pArgs.ymd;
    try {
        let forsearch = await getforsearch(conn, iUserId);
        let sql = 'select * from tb_game_logs where forsearch @@ to_tsquery($1) and ymd = $2 order by ctime desc';
        let res = await conn.Query(sql, [forsearch, ymd]);
        //判断是否是管理
        for (let i = 0; i < res.rows.length; i++) {
            let isAdmin = false;
            if (res.rows[i].forsearch != null || res.rows[i].forsearch != '') {
                let tmpforsearch = res.rows[i].forsearch.replace(/\'/g, "").split(' ');
                for (let j = 0; j < tmpforsearch.length; j++) {
                    if (tmpforsearch[j].indexOf('us') != -1) {
                        continue;
                    }
                    if (forsearch.indexOf(tmpforsearch[j]) != -1) {
                        isAdmin = true;
                        break;
                    }
                }
            }
            if (!isAdmin) {
                let details = JSON.parse(res.rows[i].details);
                details.clubList = [];
                for (let k = 0; k < details.userList.length; k++) {
                    details.userList[k].clubname = '';
                }
                res.rows[i].details = JSON.stringify(details);
            }
        }
        pSocket.emit('zhanjilist_result', {
            wErrCode: ErrorCodes.ERR_NOERROR,
            szErrMsg: "获取数据成功",
            rows: res.rows
        });
    } catch (e) {
        console.log(e.messagge);
    } finally {
        conn.Release();
    }
}

//钻石兑换金币
let diamond2goldsArr = [
    { diamond: 60, golds: 620 },
    { diamond: 300, golds: 3200 },
    { diamond: 1280, golds: 14000 },
    { diamond: 3280, golds: 37300 },
    { diamond: 6480, golds: 75800 },
];
async function diamond2golds(pSocket, pArgs) {
    let conn = new pgsql.conn();
    let iUserId = pSocket.iUserId;
    let index = parseInt(pArgs.index);
    try {
        do {
            if (isNaN(index) || index < 0 || undefined == diamond2goldsArr[index]) {
                console.log('参数错误');
                pSocket.emit('diamond2golds_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "参数错误"
                });
                break;
            }
            let params = diamond2goldsArr[index];
            let sql = 'update tb_users set gems = gems - $1 ,golds = golds + $2 where userid = $3 and gems - $1 >= 0';
            let res = await conn.Query(sql, [params.diamond, params.golds, iUserId]);
            if (res.rowCount == 0) {
                console.log('兑换失败');
                pSocket.emit('diamond2golds_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "兑换失败"
                });
                break;
            }
            pSocket.emit('diamond2golds_result', {
                wErrCode: ErrorCodes.ERR_NOERROR,
                szErrMsg: "兑换成功",
                gems: params.diamond,
                golds: params.golds
            });
        } while (false);
    } catch (e) {
        console.log(e.message);
        pSocket.emit('diamond2golds_result', {
            wErrCode: ErrorCodes.ERR_INVALIDARGS,
            szErrMsg: "兑换异常"
        });
    } finally {
        conn.Release();
    }
}

function unique(arr) {
    var result = [], hash = {};
    for (var i = 0, elem; (elem = arr[i]) != null; i++) {
        if (!hash[elem]) {
            result.push(elem);
            hash[elem] = true;
        }
    }
    return result;
}

module.exports = {
    buyvip: buyvip,
    mymessage: mymessage,
    zhanjidate: zhanjidate,
    zhanjilist: zhanjilist,
    diamond2golds: diamond2golds
}