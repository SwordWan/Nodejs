var crypto = require('../utils/crypto');
var db = require('../utils/db');
var AppConfigs = require("../configs_win");
var SysUtils = require("../utils/SysUtils");
var userMgr = require("./usermgr");
var PGSQLCC = require('../utils/pgsqlCC');
var ErrorUtils = require("../utils/ErrorCodes");
var ErrorCodes = ErrorUtils.ErrorCodes;

PGSQLCC.init(AppConfigs.database());   // 初始化数据库连接

// 获取指定用户是哪些俱乐部的管理
async function GetAdminClubByUserId(iUserId) {
    var pGameLogs = [];
    var pRoomIds = [];

    // 先把自己创建和自己玩过的房间选出来
    var szSql = "select roomuuid, roomid, roomargs, playtimes, a.clubid, b.sname, a.ctime " +
        " from tb_game_logs a, tb_clubs b " +
        " where (a.clubid = b.clubid) and ((userids @@ plainto_tsquery ($1)) or (a.creator = $2))";
    let res = await PGSQLCC.query(szSql, [iUserId, iUserId]);
    if (res.rows == null) return pGameLogs;

    for (var iIndex = 0; iIndex < res.rows.length; ++iIndex) {
        var pRow = res.rows[iIndex];
        var pItem = {
            iClubId: pRow.clubid,
            szClubName: pRow.sname,
            szRoomUUID: pRow.roomuuid,
            iRoomId: pRow.roomid,
            pRoomArgs: SysUtils.GetJsonObj(pRow.roomargs),
            iPlayTimes: pRow.playtimes,
            tmTime: pRow.ctime
        };
        pRoomIds.push(pItem.szRoomUUID);

        pGameLogs.push(pItem);
    }

    // 找出所有有管理权限的俱乐部ID
    var szClubIds = "(";
    szSql = "select clubid from tb_joinclubs where userid = $1 and (clublevel = 0 or clublevel = 1)";
    res = await PGSQLCC.query(szSql, [iUserId]);
    if (res.rows != null) {
        for (var iIndex = 0; iIndex < res.rows.length; ++iIndex) {
            var pRow = res.rows[iIndex];
            if (szClubIds.length > 1) {
                szClubIds = szClubIds + ", " + pRow.clubid;
            }
            else {
                szClubIds = szClubIds + pRow.clubid;
            }
        }
    }

    if (szClubIds.length == 1) return pGameLogs;
    szClubIds = szClubIds + ")";

    var szSql = "select roomuuid, roomid, roomargs, playtimes, a.clubid, b.sname, a.ctime " +
        " from tb_game_logs a, tb_clubs b " +
        " where (a.clubid = b.clubid) and (b.clubid in " + szClubIds + ") and (allianceid = 0)";
    res = await PGSQLCC.query(szSql, null);
    if (res.rows == null) return pGameLogs;

    for (var iIndex = 0; iIndex < res.rows.length; ++iIndex) {
        var pRow = res.rows[iIndex];
        if (pRoomIds.indexOf(pRow.roomuuid) >= 0) continue;

        var pItem = {
            iClubId: pRow.clubid,               // 房间在由哪个俱乐部开的
            szClubName: pRow.sname,             // 俱乐部ID
            szRoomUUID: pRow.roomuuid,          // 房间UUID
            iRoomId: pRow.roomid,              // 房间ID
            pRoomArgs: SysUtils.GetJsonObj(pRow.roomargs),  // 房间参数
            iPlayTimes: pRow.playtimes,                     // 总手数
            tmTime: pRow.ctime                              // 时间
        };
        pGameLogs.push(pItem);
    }

    // 按时间降序排序
    for (var iPos1 = 0; iPos1 < pGameLogs.length - 1; ++iPos1) {
        var pItemL = pGameLogs[iPos1];
        for (var iPos2 = iPos1 + 1; iPos2 < pGameLogs.length; ++iPos2) {
            var pItemR = pGameLogs[iPos2];
            if (pItemR.tmTime > pItemL.tmTime) {
                pGameLogs[iPos1] = pItemR;
                pGameLogs[iPos2] = pItemL;
                pItemL = pGameLogs[iPos1];
            }
        }
    }

    var Result = {}
    for (var iIndex = 0; iIndex < pGameLogs.length; ++iIndex) {
        var pItem = pGameLogs[iIndex];
        var szKey = pItem.tmTime.Format("yyyy-MM-dd");
        
        var pLogObj = Result[szKey];
        if (pLogObj == null) {
            pLogObj = {
                iGameTotals: 0,  // 总局数
                iPlayTotals: 0,  // 总手数
                pItems: []
            };
            Result[szKey] = pLogObj;
        }

        pLogObj.iGameTotals += 1;
        pLogObj.iPlayTotals += pItem.iPlayTimes;
        pLogObj.pItems.push(pItem);
    }

    return Result;
} 

// 获取游戏记录(记录列表)
async function QueryJieSuanLogsByClubId(iClubId) {
    var Result = [];

    var szSql = "select roomuuid, roomid, roomargs, playtimes, a.clubid, b.sname, a.ctime " +
        " from tb_game_logs a, tb_clubs b " +
        " where a.clubid = b.clubid and a.clubid @@ plainto_tsquery($1)";
    let res = await PGSQLCC.query(szSql, [iClubId]);
    if (res.rows == null) return Result;

    for (var iIndex = 0; iIndex < res.rows.length; ++iIndex) {
        var pRow = res.rows[iIndex];
        var pItem = {
            iClubId: pRow.clubid,               // 房间在由哪个俱乐部开的
            szClubName: pRow.sname,             // 俱乐部ID
            szRoomUUID: pRow.roomuuid,          // 房间UUID
            iRoomId: pRow.iRoomId,              // 房间ID
            pRoomArgs: SysUtils.GetJsonObj(pRow.roomargs),  // 房间参数
            iPlayTimes: pRow.playtimes,                     // 总手数
            tmTime: pRow.ctime                              // 时间
        };
        Result.push(pItem);
    }

    return Result;
}

// 获取游戏记录(记录列表)
async function QueryJieSuanLogsByUserId(iUserId) {
    var Result = [];

    var szSql = "select roomuuid, roomid, roomargs, playtimes, a.clubid, b.sname, a.ctime " +
        " from tb_game_logs a, tb_clubs b " +
        " where a.clubid = b.clubid and userids @@ plainto_tsquery($1)";
    let res = await PGSQLCC.query(szSql, [iUserId]);
    if (res.rows == null) return Result;

    for (var iIndex = 0; iIndex < res.rows.length; ++iIndex) {
        var pRow = res.rows[iIndex];
        var pItem = {
            iClubId: pRow.clubid,
            szClubName: pRow.sname,
            szRoomUUID: pRow.roomuuid,
            iRoomId: pRow.iRoomId,
            pRoomArgs: SysUtils.GetJsonObj(pRow.roomargs),
            iPlayTimes: pRow.playtimes,
            tmTime: pRow.ctime
        };
        Result.push(pItem);
    }

    return Result;
}

// 获取用户基本信息
async function GetUserInfo(iUserId, iClubId) {
    var Result = {
        szAlias: "",
        szHeadIco: "",
        szClubName: ""
    };

    var szSql = "select alias, headico, b.clubid, b.sname from tb_users a, tb_clubs b where userid = $1 and b.clubid = $2";
    let res = await PGSQLCC.query(szSql, [iUserId, iClubId]);
    if (res.rows == null) return Result;
    if (res.rows.length == 0) return Result;

    Result.szAlias = crypto.fromBase64(res.rows[0].alias);
    Result.szHeadIco = res.rows[0].headico;
    Result.szClubName = res.rows[0].sname;

    return Result;
}

// 查询房间结算信息
async function QueryJieSuanLogsByRoomUUID(szRoomUUID) {
    var Result = {
        iClubId: 0,
        szClubName: "",
        szRoomArgs: "",
        pUserObjs: [],
        iMVPUser: 0, // 赢得最多的  MVP
        iTHUser: 0,  // 带入最多的  土豪
        iDYUser: 0,  // 输的最多的  大鱼
    }

    var szSql = "select roomuuid, roomid, roomargs, playtimes, a.clubid, b.sname, userids, jiesuan, a.ctime " +
        " from tb_game_logs a, tb_clubs b " +
        " where a.clubid = b.clubid and roomuuid = $1";

    let res = await PGSQLCC.query(szSql, [szRoomUUID]);
    if (res.rows == null) return Result;
    if (res.rows.length == 0) return Result;

    var pRow = pRetObj.rows[0];

    Result.iClubId = pRow.clubid;
    Result.szClubName = pRow.sname;
    Result.szRoomArgs = pRow.roomargs;

    var iMVPValue = 0;
    var iTHValue = 0;
    var iDYValue = 10000000;
    var pJiFenObjs = SysUtils.GetJsonObj(pRow.jiesuan);

    for (var sUserId in pJiFenObjs) {
        var pJiFenObj = pJiFenObjs[sUserId];
        var pUserObj = {
            iUserId: sUserId,                       // 用户ID
            iJiFenDR: pJiFenObj.iJiFenDR,           // 带入积分
            iJiFenSY: pJiFenObj.iJiFen - pJiFenObj.iJiFenDR,    // 输赢积分
            iClubIdSF: pJiFenObj.iClubId,           // 用户上分的俱乐部ID
        };

        var pInfo = await GetUserInfo(sUserId, pJiFenObj.iClubId);
        pUserObj.szAlias = pInfo.szAlias;           // 用户名
        pUserObj.szHeadIco = pInfo.szHeadIco;       // 用户头像
        pUserObj.szClubName = pInfo.szClubName;     // 上分的俱乐部名

        if (pUserObj.iJiFenSY > iMVPValue) Result.iMVPUser = pUserObj.iUserId;
        if (pUserObj.iJiFenDR > iTHValue) Result.iTHUser = pUserObj.iUserId;
        if (pUserObj.iJiFenSY < iDYValue) Result.iDYUser = pUserObj.iUserId;

        Result.pUserObjs.push(pUserObj);
    }

    return Result;
}

exports.GetAdminClubByUserId = GetAdminClubByUserId;
exports.QueryJieSuanLogsByClubId = QueryJieSuanLogsByClubId;
exports.QueryJieSuanLogsByUserId = QueryJieSuanLogsByUserId;
exports.QueryJieSuanLogsByRoomUUID = QueryJieSuanLogsByRoomUUID;