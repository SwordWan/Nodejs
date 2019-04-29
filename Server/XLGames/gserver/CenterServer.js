//var BigInt = require("big-integer");
var express = require('express');
var crypto = require('../utils/crypto');
var db = require('../utils/db');
var http = require("../utils/http");
var AppConfigs = require("../configs_win");
var SysUtils = require("../utils/SysUtils");
var userMgr = require("./usermgr");
var dbCC = require('../utils/pgsqlCC');
var dbLGQ = require("../Utils/dbLGQ");
var alliance = require('./alliance');
var club = require('./club');
var userBLL = require('./user');
var ConstCodes = require('../utils/const');
var GLogs = require("./querylogs");
var GEvents = require("./CSFuns");
// var SMS = require("ihuyi106");
var SMS = require("../utils/SMS");

var CmdIdsLib = require("../Utils/cmdids");
var CmdIds = CmdIdsLib.CmdIds;

var ErrorUtils = require("../utils/ErrorCodes");
var ErrorCodes = ErrorUtils.ErrorCodes;
var SMS_MAPS = {};
var pUserBytesMaps = {};

var g_pAppGlobals = {
    bSuspend: false,    // 是否暂停
    iOnlineNum: 0,      // 当前在线用户数
    pClientSockets: {}, // 进入游戏的用户  iUserId -> pSocket
    iMaxGServer: 1,     // 最大游戏服务器数量 (默认为1)

    pGServerMaps: {},   // ID-> 服务器信息    当前注册过的游戏服务器信息
};

// 各俱乐部等级对应的人数
var pLevelNums = {
    "1": 100,
    "2": 180,
    "3": 260,
    "4": 340,
    "5": 420,
    "6": 500,
    "7": 600,
    "8": 700,
    "9": 800
};

// club.Init(userMgr);

// 正式服
// administrator Login@2018
// 远程连接密码：1133885402 883371

// 测试服
// 远程连接密码：1175163153  166075  Kylix@1983


// nhx175
// ========================== socket 消息 ==========================
function CheckReqArgs(pSocket, szCmd, pData) {
    var pReqArgs = SysUtils.GetJsonObj(pData);

    if (pReqArgs == null) {
        var szCommand = szCmd + "_result";
        pSocket.emit(szCommand,
            {
                wErrCode: ErrorCodes.ERR_INVALIDARGS,
                szErrMsg: "参数错误"
            });
    }

    return pReqArgs;
}

function CheckSocketUser(pSocket, szCmd) {
    var Result = true;

    if (pSocket.iUserId == null) {
        var szCommand = szCmd + "_result";

        pSocket.emit(szCommand, {
            wErrCode: ErrorCodes.ERR_USERISNOTEXISTS,
            szErrMsg: "用户不存在"
        });

        Result = false;
    }

    return Result;
}


// 获取俱乐部信息
async function GetClubInfo(iOptUser, szKeyName) {
    var pClubInfo = await dbLGQ.get_club_info(szKeyName);
    if (pClubInfo == null) return null;

    var pAdminUsers = await dbLGQ.get_club_adminusers(pClubInfo.clubid);
    console.log("GetClubInfo iOptUser:" + iOptUser + ", szKeyName:" + szKeyName + ", pAdminUser:" + JSON.stringify(pAdminUsers));

    var pCreatorInfo = await dbLGQ.get_user_info(pClubInfo.creator);

    var szCreatorAlias = "";
    if (pCreatorInfo != null) szCreatorAlias = pCreatorInfo.alias;
    var bIsAdmin = (pClubInfo.creator == iOptUser) || (pAdminUsers.indexOf(iOptUser) >= 0);

    var iLevels = 0;    // 不是该俱乐部的成员
    if (pAdminUsers.indexOf(iOptUser) >= 0) iLevels = 2;    // 管理员
    if (pClubInfo.creator == iOptUser) iLevels = 3;         // 创建者

    var iUserNums = await dbLGQ.get_club_usernums(pClubInfo.clubid);
    //var pRoomObjs = await GetRoomListByClubId(pClubInfo.clubid);
    //var iRoomCount = pRoomObjs.pRooms.length;   //await GetClubRoomCount(pClubInfo.clubid);
    var sql = 'select count(distinct(roomid)) total from tb_club_rooms where clubid = $1';
    var res = await dbCC.query(sql, [pClubInfo.clubid]);
    var iRoomCount = res.rows[0].total;

    if (iLevels > 0) {
        var pRetObj = {
            iClubId: pClubInfo.clubid,
            szName: pClubInfo.sname,
            szDesc: pClubInfo.desc,
            iCreator: pClubInfo.creator,
            szCreatorAlias: szCreatorAlias,
            //iAdminUsers: pAdminUsers,
            iLevels: pClubInfo.levels,      // 俱乐部等级
            iUserLevels: iLevels,           // 0:未加入, 1:普通用户, 2:管理员, 3:创建者
            iGolds: pClubInfo.golds,
            iActivity: pClubInfo.activity,
            iJiFen: pClubInfo.jifen,
            tmCreate: pClubInfo.ctime,
            tmLevelEndTime: pClubInfo.endtime,  // 俱乐部等级结束时间

            iAlertGolds: pClubInfo.alertgolds,  // 俱乐部预警金币
            iAlertMsgCount: pClubInfo.alertmsgcount,    // 俱乐部预警消息条数
            szIcoUrl: pClubInfo.icourl,     // 俱乐部图标
            bIsAdmin: bIsAdmin,             // 自己是否是此俱乐部的管理员
            iRoomCount: iRoomCount, //pClubInfo.roomcount, //iRoomCount,         // 牌局数量
            iOnlineNum: pClubInfo.olnums,   // 在线人数
            iTotalNum: iUserNums,     // 总人数
            iMaxUsers: pLevelNums[pClubInfo.levels], // 俱乐部最大人数
            iAllianceid: pClubInfo.allianceid,//联盟ID
            szAlliancename: pClubInfo.alliancename,//联盟名称
            iMsgCount: parseInt(pClubInfo.msgcount) + parseInt(pClubInfo.alliancemsgcount) //消息数量
        }
        return pRetObj;
    }
    else {
        var pRes = await dbCC.query("select count(*) from tb_joinclubs where clubid = $1 and userid = $2", [pClubInfo.clubid, iOptUser]);
        if (pRes.rows[0].count > 0) iLevels = 1;

        var pRetObj = {
            iClubId: pClubInfo.clubid,
            szName: pClubInfo.sname,
            szDesc: pClubInfo.desc,
            iCreator: pClubInfo.creator,
            szCreatorAlias: szCreatorAlias,
            //iAdminUsers: pAdminUsers,
            iLevels: pClubInfo.levels,      // 俱乐部等级
            iUserLevels: iLevels,           // 0:未加入, 1:普通用户, 2:管理员, 3:创建者
            iGolds: pClubInfo.golds,
            iActivity: pClubInfo.activity,
            iJiFen: pClubInfo.jifen,
            tmCreate: pClubInfo.ctime,
            iAlertGolds: pClubInfo.alertgolds,  // 俱乐部预警金币
            iAlertMsgCount: pClubInfo.alertmsgcount,    // 俱乐部预警消息条数
            tmLevelEndTime: pClubInfo.endtime,  // 俱乐部等级结束时间

            szIcoUrl: pClubInfo.icourl,     // 俱乐部图标
            bIsAdmin: bIsAdmin,             // 自己是否是此俱乐部的管理员
            iRoomCount: iRoomCount, //iRoomCount,         // 牌局数量
            iOnlineNum: pClubInfo.olnums,   // 在线人数
            iTotalNum: iUserNums,     // 总人数
            iMaxUsers: pLevelNums[pClubInfo.levels], // 俱乐部最大人数
            iAllianceid: pClubInfo.allianceid,//联盟ID
            szAlliancename: pClubInfo.alliancename,//联盟名称
            iMsgCount: parseInt(pClubInfo.msgcount) + parseInt(pClubInfo.alliancemsgcount) //消息数量
        }
        return pRetObj;
    }
}


// 获取指定俱乐部成员基本信息
async function GetClubUserInfo(iClubId) {
    var szSql = "select a.userid, alias, headico from tb_users a, tb_joinclubs b " +
        " where a.userid = b.userid and b.clubid = $1 order by lastlogintime desc ";

    var pRes = await dbCC.query(szSql, [iClubId]);

    var pItems = [];
    for (var iIndex = 0; iIndex < pRes.rows.length; ++iIndex) {
        var pRow = pRes.rows[iIndex];
        var pItem = {
            iUserId: pRow.userid,
            szAlias: pRow.alias,
            szHeadIco: pRow.headico,
            tmLastLogin: pRow.lastlogintime,
            bIsOnline: userMgr.IsOnline(pRow.userid)
        }

        pItems.push(pItem);
    }

    return pItems;
}

// 获取指定俱乐部指定成员最近30天总局数，平均输赢
async function GetClubUserGameTimes(iClubId, iUserId) {
    var Result = {
        iCount: 0,
        iJieSuanAVG: 0
    };

    var szSql = "select count(userid) as icount, sum(jiesuan) as iSum from tb_game_logs where ctime >= (current_timestamp - interval '30 day') and " +
        " clubid = $1 and userid = $2";
    var pRes = await dbCC.query(szSql, [iClubId, iUserId]);

    Result.iCount = pRes.rows[0].icount;
    Result.iJieSuanAVG = pRes.rows[0].isum;
    if (Result.iCount == null) Result.iCount = 0;
    if (Result.iJieSuanAVG == null) Result.iJieSuanAVG = 0;

    if ((Result.iCount != 0) && (Result.iJieSuanAVG > 0)) {
        Result.iJieSuanAVG = parseInt(Result.iJieSuanAVG / Result.iCount);
    }

    return Result;
}

// 获取指定俱乐部房间信息
async function GetClubRoomList(iClubId) {
    var pRooms = [];
    var pClubInfo = await dbLGQ.get_club_info(iClubId);
    if (pClubInfo == null) {
        return {
            iAllianceId: 0,
            szClubName: "",
            pRooms: pRooms
        }
    };

    var szClubName = pClubInfo.sname;       // 俱乐部名
    var iAllianceId = pClubInfo.allianceid; // 俱乐部加入的联盟ID
    var pRows = await dbLGQ.get_club_rooms(iClubId);
    for (var iIndex = 0; iIndex < pRows.length; ++iIndex) {
        var pRow = pRows[iIndex];
        console.log("iRoomId:" + pRow.roomid + ", valid:" + pRow.valid);
        if (!pRow.valid) continue;
        if (pRow.tmlen * 60 <= pRow.times) continue;

        var pItem = {
            iClubId: iClubId,
            szClubName: szClubName,

            iCreator: pRow.creator, // 创建者
            iGameId: pRow.gameid,   // 游戏ID
            iRoomId: pRow.roomid,   // 房间ID
            szRoomUUID: pRow.uuid,  // 房间唯一ID
            pRoomArgs: SysUtils.GetJsonObj(pRow.roomargs),  // 游戏规则
            iPlayerCount: pRow.usernums,  // 房间当前人数
            tmCreateTime: pRow.ctime,    // 创建时间
            iTimes: parseInt(pRow.times / 60),          // 房间使用了多少时间时长(分)
            iTimeLen: parseInt(pRow.tmlen / 60),        // 房间总时长(分)
        }
        pRooms.push(pItem);
    }

    return {
        iAllianceId: iAllianceId,
        szClubName: szClubName,
        pRooms: pRooms
    }
}

// 获取指定用户管理下的俱乐部是否有金币报警
async function IsExistsClubGoldsAlert(iUserId) {
    var szSql = "select count(a.clubid) from tb_joinclubs a, tb_clubs b \
        where a.status = 1 and a.clubid = b.clubid and b.alertmsgcount > 0 and a.userid = $1 and a.clublevel < 2";
    var pRes = await dbCC.query(szSql, [iUserId]);
    return (pRes.rows[0].count > 0);
}

async function LoginIn(szAccount, szPassword, pSocket) {
    var pRow = await dbLGQ.get_account_info(szAccount);
    if (pRow == null) {
        pSocket.emit("regphone_result", {
            wErrCode: ErrorCodes.ERR_INVOKE_FALIED,
            szErrMsg: "创建账号失败"
        });
        return;
    }

    var bExistClubAlert = await IsExistsClubGoldsAlert(pRow.userid);
    var tmNow = new Date();
    var pRetObj = {
        wErrCode: ErrorCodes.ERR_NOERROR,
        szErrMsg: "操作成功",
        iMode: 3,   // 0:新注册的账号, 1:已有账号登录
        szAccount: szAccount,
        szPassword: szPassword,
        iUserId: pRow.userid,
        szName: pRow.alias,
        szHeadIco: pRow.headico,
        iSex: pRow.sex,
        iGolds: pRow.golds,
        iGems: pRow.gems,
        iLevels: pRow.level,            // 用户等级 0: 普通用户, 1: 一级VIP, 2:二级VIP,..., 100: 后台管理员
        iRoomId: pRow.roomid,
        iRoomClubId: pRow.roomclubid,
        iClubId: pRow.clubid,
        iClubNums: pRow.clubnums,       // 可以创建的俱乐部数量
        iMsgCount: pRow.mymsgcount,
        bIsVIP: tmNow.getTime() < pRow.vipendtime.getTime(),
        tmVipEndTime: pRow.vipendtime,   // VIP结束时间
        bExistClubAlert: bExistClubAlert,
        iChgUserAliasGolds: 500,
        iChgClubAliasGolds: 10000
    }
    pSocket.emit("loginin_result", pRetObj);
    userMgr.Add(pRetObj.iUserId, pSocket);
    await OnUserLoginInEvent(pRetObj, pSocket);
}

// ========================== HTTP 通信接口 ==========================
var app = express();

// 向指定游戏服务器发送消息
function PostGServerMsg(szIpAddress, wPort, szCmd, pReqArgs, callback) {
    http.get(szIpAddress, wPort, szCmd, pReqArgs, function (bRet, pRetObj) {
        if (bRet && (pRetObj != null)) {
            callback(pRetObj);
        }
        else {
            callback(null);
        }
    });
}

// 向指定房间发送消息
function PostRoomMsg(szRoomUUID, pReqArgs, callback) {
    var szSql = "SELECT roomid FROM tb_rooms WHERE roomuuid = $1";
    db.QuerySQL(szSql, [szRoomUUID], function (pRows) {
        if (pRows.length == 0) {
            callback({
                wErrCode: ErrorCodes.ERR_ROOMISNOTEXISTS,
                szErrMsg: "房间不存在或已被删除"
            });
            return;
        }

        var iRoomId = pRows[0].roomid;
        var pGServer = GetRoomServer(iRoomId);
        if (pGServer == null) {
            callback({
                wErrCode: ErrorCodes.ERR_GAMESERVERNOTRUN,
                szErrMsg: "游戏服务器维护中"
            });
            return;
        }

        PostGServerMsg(pGServer.IP, pGServer.HTTPPORT, "/GServerCMD", pReqArgs, function (pRetObj) {
            GEvents.OnGameServerEvent(pReqArgs, pRetObj);
            //console.log(pRetObj);
        });
    });
}

// 由游戏服务器ID获取游戏服务器信息
function GetGServerItem(iServerId) {
    return g_pAppGlobals.pGServerMaps[iServerId];
}

// 由房间ID获取游戏服务器信息
function GetRoomServer(iRoomId) {
    var Result = null;

    iRoomId = parseInt(iRoomId);
    for (var sKey in g_pAppGlobals.pGServerMaps) {
        var pItem = g_pAppGlobals.pGServerMaps[sKey];
        if (pItem.ROOMIDS.indexOf(iRoomId) >= 0) {
            Result = pItem;
            break;
        }

    }

    return Result;
}

// 随机获取游戏服务器
function GetRandGServer() {
    var Result = null;

    var pItems = [];
    for (var sKey in g_pAppGlobals.pGServerMaps) {
        var pItem = g_pAppGlobals.pGServerMaps[sKey];
        pItems.push(pItem);
    }

    if (pItems.length > 0) {
        var iPos = SysUtils.GenRandValue(0, pItems.length - 1);
        Result = pItems[iPos];
    }
    else {
        console.log("GetRandGServer 没有找到可用的游戏服务器");
    }

    return Result;
}

// 获取房间加载最少的服务器
function GetFilterGServer() {
    var Result = null;

    for (var sKey in g_pAppGlobals.pGServerMaps) {
        var pItem = g_pAppGlobals.pGServerMaps[sKey];

        if (Result != null) {
            if (Result.ROOMCOUNT > pItem.ROOMCOUNT) {
                Result = pItem;
            }
        }
        else {
            Result = pItem;
        }

        if (Result.ROOMCOUNT == 0) break;
    }

    return Result;
}

//设置跨域访问
app.all("*", function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
    res.header("X-Powered-By", ' 3.2.1')
    res.header("Content-Type", "application/json;charset=utf-8");
    next();
});

// 获取版本信息
app.get("/getversion", function (req, res) {
    var pAppCfg = SysUtils.GetAppConfig();

    var pRetObj = {
        bUpdate: pAppCfg.bUpdate,
        szVersion: pAppCfg.szVersion,
        szUpdateUrl: pAppCfg.szUpdateUrl,

        pLoginServer: AppConfigs.center_server()
    }
    http.send(res, ErrorCodes.ERR_NOERROR, "操作成功", pRetObj);
});


// 查询房间信息
app.get("/getroominfo", function (req, res) {
    var pReqArgs = req.query;

    db.get_room_info(pReqArgs.iRoomId, function (pRow) {
        if (pRow == null) {
            http.send(res, ErrorCodes.ERR_ROOMISNOTEXISTS, "房间不存在");
            return;
        }

        var pJiFenObjs = SysUtils.GetJsonObj(pRow.players);
        if (pJiFenObjs == null) pJiFenObjs = {};

        var pGameObj = SysUtils.GetJsonObj(pRow.gameinfo);
        if (pGameObj == null) pGameObj = {};

        var pRoomInfo = {
            iAllId: pRow.allid,                    // 联盟俱乐部ID
            iRoomId: pReqArgs.iRoomId,
            szRoomUUID: pRow.roomuuid,             // 房间唯一ID
            iCreator: pRow.creator,                // 创建者
            iClubId: pRow.clubid,                  // 俱乐部ID
            iGameId: pRow.gameid,                  // 游戏ID
            iTimes: pRow.times,                    // 使用了多少秒了
            iTimeLen: pRow.tmlen,                  // 房间总时长(分)
            iPlayTimes: pRow.playtimes,            // 局数
            pRoomArgs: pRow.roomargs,              // 房间参数
            pGameObj: JSON.stringify(pGameObj),    // 游戏数据
            tmCreate: pRow.ctime.toLocaleString()  // 创建时间
        }

        console.log("/getroominfo iRoomId:" + pRoomInfo.iRoomId + ", tmCreate:" + pRoomInfo.tmCreate);

        var pGServer = GetRoomServer(pReqArgs.iRoomId);
        if (pGServer == null) pGServer = GetFilterGServer();
        if (pGServer == null) {
            console.log("/getroominfo iRoomId:" + pRoomInfo.iRoomId + ", 游戏服务器维护中, 请稍后重试");
            http.send(res, ErrorCodes.ERR_GAMESERVERNOTRUN, "游戏服务器维护中, 请稍后重试");
            return;
        }

        console.log("/getroominfo IP:" + pGServer.IP + ", pGServer.HTTPPORT:" + pGServer.HTTPPORT);
        PostGServerMsg(pGServer.IP, pGServer.HTTPPORT, "/GetRoomInfo", pRoomInfo, function (pRetObj) {
            if (pRetObj == null) {
                console.log("/getroominfo error 1");
                http.send(res, ErrorCodes.ERR_ENTERROOMFALIED, "查询房间失败");
                return;
            }

            if (pRetObj.IP == "") {
                console.log("/getroominfo error 2");
                http.send(res, ErrorCodes.ERR_GAMESERVERNOTRUN, "游戏服务器维护中");
                return;
            }

            var pSendData = {
                pRoomInfo: pRoomInfo,
                pAddress: {
                    ID: pRetObj.ID,
                    IP: pRetObj.IP,
                    PORT: pRetObj.PORT,
                    HTTPPORT: pRetObj.HTTPPORT,
                }
            };

            console.log("/getroominfo ok 2");
            http.send(res, ErrorCodes.ERR_NOERROR, "操作成功", pSendData);
        });
    });
});

// 获取与自己相关的俱乐部消息
app.get("/getclubmsgs", function (req, res) {
    var pReqArgs = req.query;

    var szSql = "select * from tb_clubmsgs where userid = " + pReqArgs.iUserId +
        " order by ctime desc limit 20";
    db.QuerySQL(szSql, null, function (pRows) {
        var pRetObj = [];

        for (var iIndex = 0; iIndex < pRows.length; ++iIndex) {
            var pRow = pRows[iIndex];
            var pItem = {
                iUid: pRow.uid,
                iType: pRow.msgtype,
                szDesc: pRow.desc,
                tmCreate: pRow.ctime
            }

            pRetObj.push(pItem);
        }

        http.send(res, ErrorCodes.ERR_NOERROR, "操作成功", { pItems: pRetObj });
    });
});

// 获取游戏录像数据
app.get("/getgamevideo", async function(req, res) {
    var pReqArgs = req.query;
    if ((pReqArgs.szRoomUUID == null) || (pReqArgs.iPlayTimes == null)) {
        http.send(res, ErrorCodes.ERR_INVALIDARGS, "参数错误");
        return;
    }

    var pRes = await dbCC.query("select * from tb_gamevideo_logs where roomuuid = $1 and playtimes = $2",
        [pReqArgs.szRoomUUID, pReqArgs.iPlayTimes]);
    if (pRes.rows.length == 0) {
        http.send(res, ErrorCodes.ERR_INVOKE_FALIED, "没有找到此局游戏的录像数据");
        return;
    }

    http.send(res, ErrorCodes.ERR_NOERROR, "操作成功", {
        szRoomUUID: pReqArgs.szRoomUUID,
        iRoomId: pRes.rows[0].roomid,
        tmTime: pRes.rows[0].ctime,
        pVideo: pRes.rows[0].video
    });
});


// ========================== 与游戏服务器通信接口 ==========================
// 分配房间到游戏服务器中
function AllocRoomGServer(pRoomInfo) {
    var pJiFenObjs = SysUtils.GetJsonObj(pRoomInfo.players);
    if (pJiFenObjs == null) pJiFenObjs = {};

    var pGameObj = SysUtils.GetJsonObj(pRoomInfo.gameinfo);
    if (pGameObj == null) pGameObj = {};

    var pData = {
        iAllId: pRoomInfo.allid,                    // 联盟俱乐部ID
        iRoomId: pRoomInfo.roomid,
        szRoomUUID: pRoomInfo.roomuuid,             // 房间唯一ID
        iCreator: pRoomInfo.creator,                // 创建者
        iClubId: pRoomInfo.clubid,                  // 俱乐部ID
        iGameId: pRoomInfo.gameid,                  // 游戏ID
        iTimes: pRoomInfo.times,                    // 剩余使用了多少秒了
        iTimeLen: pRoomInfo.tmlen,                  // 房间总时长
        iPlayTimes: pRoomInfo.playtimes,            // 局数
        pRoomArgs: pRoomInfo.roomargs,              // 房间参数
        pGameObj: JSON.stringify(pGameObj),         // 游戏数据
        tmCreate: pRoomInfo.ctime.toLocaleString()                   // 创建时间
    }

    var pGServer = GetRandGServer();
    console.log("AllocRoomGServer iRoomId:" + pData.iRoomId + " PORT:" + pGServer.HTTPPORT + ", tmCreate:" + pData.tmCreate);
    PostGServerMsg(pGServer.IP, pGServer.HTTPPORT, "/GetRoomInfo", pData, function (pRetObj) {
        if (pRetObj == null) {
            console.log("AllocRoomGServer 1 connect game server IP:" + pGServer.IP + ", PORT:" + pGServer.HTTPPORT);
            return;
        }

        if (pRetObj.IP == "") {
            console.log("AllocRoomGServer 2 connect game server IP:" + pGServer.IP + ", PORT:" + pGServer.HTTPPORT);
            return;
        }

        var iRoomId = parseInt(pRetObj.iRoomId);
        pGServer.ROOMIDS.push(iRoomId);
        pGServer.ROOMCOUNT += 1;
    });
}

// 分配房间到指定游戏服务器中
function SetRoomGServer(pRoomInfo, pGServer, pfnCallback) {
    var pJiFenObjs = SysUtils.GetJsonObj(pRoomInfo.players);
    if (pJiFenObjs == null) pJiFenObjs = {};

    var pGameObj = SysUtils.GetJsonObj(pRoomInfo.gameinfo);
    if (pGameObj == null) pGameObj = {};

    var pData = {
        iAllId: pRoomInfo.allid,                    // 联盟俱乐部ID
        iRoomId: pRoomInfo.roomid,
        szRoomUUID: pRoomInfo.roomuuid,             // 房间唯一ID
        iCreator: pRoomInfo.creator,                // 创建者
        iClubId: pRoomInfo.clubid,                  // 俱乐部ID
        iGameId: pRoomInfo.gameid,                  // 游戏ID
        iTimes: pRoomInfo.times,                    // 剩余使用了多少秒了
        iTimeLen: pRoomInfo.tmlen,                  // 房间总时长
        iPlayTimes: pRoomInfo.playtimes,            // 局数
        pRoomArgs: pRoomInfo.roomargs,              // 房间参数
        pGameObj: JSON.stringify(pGameObj),         // 游戏数据
        tmCreate: pRoomInfo.ctime.toLocaleString()                   // 创建时间
    }

    console.log("SetRoomGServer iRoomId:" + pData.iRoomId + " PORT:" + pGServer.HTTPPORT + ", tmCreate:" + pData.tmCreate);
    PostGServerMsg(pGServer.IP, pGServer.HTTPPORT, "/GetRoomInfo", pData, function (pRetObj) {
        if (pRetObj == null) {
            console.log("SetRoomGServer 1 connect game server IP:" + pGServer.IP + ", PORT:" + pGServer.HTTPPORT);
            pfnCallback();
            return;
        }

        if (pRetObj.IP == "") {
            console.log("SetRoomGServer 2 connect game server IP:" + pGServer.IP + ", PORT:" + pGServer.HTTPPORT);
            pfnCallback();
            return;
        }

        pfnCallback();
    });
}

// 加载房间
async function LoadAllRoom() {
    var pRooms = await dbLGQ.get_all_room();
    for (var iIndex = 0; iIndex < pRooms.length; ++iIndex) {
        var pRoomInfo = pRooms[iIndex];

        (function (pRoomInfo) {
            AllocRoomGServer(pRoomInfo);
        })(pRoomInfo);
    }
}

// 查询用户所在房间信息
app.get("/GetUserInRoomInfo", function (req, res) {

});

// 注册服务器注册
app.get("/RegGServer", async function (req, res) {
    var szIpAddress = req.ip;
    var pReqArgs = req.query;
    var pGServerObj = GetGServerItem(pReqArgs.ID);

    if (szIpAddress.indexOf("::ffff:") != -1) szIpAddress = szIpAddress.substr(7);
    pReqArgs.ROOMIDS = SysUtils.GetJsonObj(pReqArgs.ROOMIDS);

    if (pGServerObj == null) {
        pGServerObj = {
            ID: pReqArgs.ID,
            NAME: pReqArgs.NAME,
            IP: szIpAddress,
            PORT: pReqArgs.PORT,
            HTTPPORT: pReqArgs.HTTPPORT,
            ROOMCOUNT: parseInt(pReqArgs.ROOMCOUNT),
            ROOMIDS: pReqArgs.ROOMIDS,
            REFRESH: true
        }
        g_pAppGlobals.pGServerMaps[pReqArgs.ID] = pGServerObj;
        // console.log("/RegGServer NAME:" + pReqArgs.NAME + ", ID:" + pReqArgs.ID +
        //     ", IP:" + pGServerObj.IP + ", PORT:" + pReqArgs.PORT +
        //     ", HTTPPORT:" + pReqArgs.HTTPPORT);

        // console.log("/RegGServer g_pAppGlobals.iMaxGServer:" + g_pAppGlobals.iMaxGServer);
        var iCount = 0;
        for (var sKey in g_pAppGlobals.pGServerMaps) iCount += 1;
        if (iCount == g_pAppGlobals.iMaxGServer) {   // 所有游戏服务器都启动成功了
            // 加载房间信息并分配到各游戏服务器
            await LoadAllRoom();
        }
    }
    else {
        var pfnSetRoomGServer = async function (pRoomIds, iIndex, pfnCallback) {
            if (iIndex >= pRoomIds.length) {
                pfnCallback();
                return;
            }

            var iRoomId = pRoomIds[iIndex];
            var pRoomInfo = await dbLGQ.get_room_info(iRoomId);
            if (pRoomInfo == null) {
                pfnSetRoomGServer(pRoomIds, iIndex + 1, pfnCallback);
                return;
            }

            if (pRoomInfo != null) {
                SetRoomGServer(pRoomInfo, pGServerObj, function () {
                    pfnSetRoomGServer(pRoomIds, iIndex + 1, pfnCallback);
                });
            }
        }

        pGServerObj.REFRESH = false;
        console.log("pGServerObj.ROOMIDS.length:" + pGServerObj.ROOMIDS.length);
        await pfnSetRoomGServer(pGServerObj.ROOMIDS, 0, function () {
            pGServerObj.REFRESH = true;
            console.log("RegGServer NAME:" + pReqArgs.NAME + ", ID:" + pReqArgs.ID + ", ROOMCOUNT:" + pGServerObj.ROOMCOUNT +
                ", IP:" + pGServerObj.IP + ", PORT:" + pGServerObj.PORT);
        });
    }

    http.send(res, ErrorCodes.ERR_NOERROR, "ok");
});

// 刷新服务器注册
app.get("/RefreshGServer", async function (req, res) {
    var szIpAddress = req.ip;
    var pReqArgs = req.query;
    var pGServerObj = GetGServerItem(pReqArgs.ID);

    if (szIpAddress.indexOf("::ffff:") != -1) szIpAddress = szIpAddress.substr(7);

    if (pReqArgs.ROOMIDS == null) {
        pReqArgs.ROOMIDS = [];
    }
    else {
        pReqArgs.ROOMIDS = JSON.parse(pReqArgs.ROOMIDS);
    }

    if (pGServerObj == null) {
        pGServerObj = {
            ID: pReqArgs.ID,
            NAME: pReqArgs.NAME,
            IP: szIpAddress,    // pReqArgs.IP,
            PORT: pReqArgs.PORT,
            HTTPPORT: pReqArgs.HTTPPORT,
            ROOMCOUNT: parseInt(pReqArgs.ROOMCOUNT),
            ROOMIDS: pReqArgs.ROOMIDS.concat()
        }
        g_pAppGlobals.pGServerMaps[pReqArgs.ID] = pGServerObj;

        console.log("/RefreshGServer NAME:" + pReqArgs.NAME + ", ID:" + pReqArgs.ID +
            ", IP:" + pGServerObj.IP + ", PORT:" + pReqArgs.PORT +
            ", HTTPPORT:" + pReqArgs.HTTPPORT + ", ROOMCOUNT:" + pGServerObj.ROOMCOUNT);

        var iCount = 0;
        for (var sKey in g_pAppGlobals.pGServerMaps) iCount += 1;
        if (iCount == g_pAppGlobals.iMaxGServer) {   // 所有游戏服务器都启动成功了
            // 加载房间信息并分配到各游戏服务器
            await LoadAllRoom();
        }
    }
    else {
        pGServerObj.ROOMIDS = pReqArgs.ROOMIDS;
        pGServerObj.ROOMCOUNT = parseInt(pReqArgs.ROOMCOUNT);

        // var pGServerObj = GetGServerItem(pReqArgs.ID);
        // if (pGServerObj != null) {
        //     var pData = {
        //         ROOMIDS: pGServerObj.ROOMIDS.concat()
        //     };

        //     PostGServerMsg(pGServer.IP, pGServer.HTTPPORT, "/RefreshRooms", pData, function (pRetObj) {
        //     });
        // }

        //console.log("RefreshGServer NAME:" + pReqArgs.NAME + ", ID:" + pReqArgs.ID + ", ROOMCOUNT:" + pGServerObj.ROOMCOUNT);
    }

    http.send(res, ErrorCodes.ERR_NOERROR, "ok");
});

// 判断指定游戏服务器是否已运行
app.get("/IsGServerRunning", function (req, res) {
    var pReqArgs = req.query;

    http.get(pReqArgs.IP, pReqArgs.HTTPPORT, "/IsGServerRunning", {}, function (bRet, pRetObj) {
        if (bRet) {
            http.send(res, ErrorCodes.ERR_NOERROR, "游戏服务器运行中");
        }
        else {
            http.send(res, ErrorCodes.ERR_GAMESERVERNOTRUN, "游戏服务器没启动");
        }
    });
});

// 获取用户信息
app.get("/GetUserInfo", function (req, res) {
    var pReqArgs = req.query;
    try {
        pReqArgs.iUserId = parseInt(pReqArgs.iUserId);
    }
    catch (err) {
        pReqArgs.iUserId = 0;
    }

    db.get_user_info(pReqArgs.iUserId, function (pRow) {
        var pRetObj = {};

        if (pRow == null) {
            pRetObj.wErrCode = ErrorCodes.ERR_USERISNOTEXISTS;
            pRetObj.szErrMsg = "用户不存在";
        }
        else {
            pRetObj.wErrCode = ErrorCodes.ERR_NOERROR;
            pRetObj.szErrMsg = "操作成功";
            pRetObj.iUserId = pRow.userid;
            pRetObj.szAlias = pRow.alias;
            pRetObj.szHeadIco = pRow.headico;
            pRetObj.bSex = pRow.sex;
            pRetObj.iLevels = pRow.levels;
            pRetObj.iGolds = pRow.golds;
            pRetObj.iGems = pRow.gems;
            pRetObj.iClubId = pRow.clubid;
        }
        res.json(pRetObj);
    });
});

// 设置用户在线状态
app.get("/SetUserOnlineState", function (req, res) {
    var pReqArgs = req.query;
    db.set_user_online_state(pReqArgs.iUserId, pReqArgs.iClubId, pReqArgs.iRoomId);
});

// 删除指定房间
function DelRoomId(iRoomId) {
    iRoomId = parseInt(iRoomId);
    for (var sKey in g_pAppGlobals.pGServerMaps) {
        var pItem = g_pAppGlobals.pGServerMaps[sKey];
        var iPos = pItem.ROOMIDS.indexOf(iRoomId);
        if (iPos >= 0) {
            pItem.ROOMIDS.splice(iPos, 1);
            break;
        }
    }
}

app.get("/DelRoom", async function (req, res) {
    var pReqArgs = req.query;
    console.log("/DelRoom iRoomId:" + pReqArgs.iRoomId);

    DelRoomId(pReqArgs.iRoomId);
    var iCount = await dbLGQ.delete_room(pReqArgs.iRoomId);
    if (iCount == 1) {
        await dbLGQ.add_club_roomcount(pReqArgs.iClubId, -1);
    }

    var pRetObj = {
        wErrCode: ErrorCodes.ERR_NOERROR,
        szErrMsg: "操作成功",
        iRoomId: pReqArgs.iRoomId
    };

    res.json(pRetObj);
    console.log("del room iRoomId:" + pReqArgs.iRoomId + " is ok");
});

// 执行SQL语句
app.get("/ExeSQL", function (req, res) {
    // var pReqArgs = req.query;
    // var szIpAddress = req.ip;

    // if ((pReqArgs.szMode != "GET") && (pReqArgs.szMode != "SET")) {
    //     http.send(res, ErrorCodes.ERR_INVALIDARGS, "参数错误");
    //     return;
    // }

    // if (szIpAddress.indexOf("::ffff:") != -1) szIpAddress = szIpAddress.substr(7);

    // db.ExeSQL(pReqArgs.szSql, null, function (err, result) {
    //     var pRetObj = { Result: null };

    //     if (result == null) {
    //         if (pReqArgs.szMode == "GET") {  // 获取数据
    //             pRetObj.Result = [];
    //             http.send(res, ErrorCodes.ERR_INVOKE_FALIED, "获取数据失败", pRetObj);
    //         }
    //         else {
    //             pRetObj.Result = 0;
    //             http.send(res, ErrorCodes.ERR_INVOKE_FALIED, "更新数据失败", pRetObj);
    //         }
    //     }
    //     else {
    //         if (pReqArgs.szMode == "GET") {  // 获取数据
    //             pRetObj.Result = result.rows;
    //         }
    //         else {
    //             pRetObj.Result = result.rowCount;
    //         }
    //         http.send(res, ErrorCodes.ERR_NOERROR, "操作成功", pRetObj);
    //     }
    // });
});


// ===== 游戏相关接口 =====
// 设置用户带入
app.get("/SetUserJiFenDR", function (req, res) {
    var pReqArgs = req.query;
    var szIpAddress = req.ip;

    if ((pReqArgs.szMode != "GET") && (pReqArgs.szMode != "SET")) {
        http.send(res, ErrorCodes.ERR_INVALIDARGS, "参数错误");
        return;
    }

    if (szIpAddress.indexOf("::ffff:") != -1) szIpAddress = szIpAddress.substr(7);

    db.get_room_info(pReqArgs.iRoomId, function (pRoomInfo) {
        if (pRoomInfo == null) {
            http.send(res, ErrorCodes.ERR_ROOMISNOTEXISTS, "房间不存在");
            return;
        }

        var pPlayers = SysUtils.GetJsonObj(pRoomInfo.players);
        if (pPlayers == null) pPlayers = {};

        var iJiFen = parseInt(pReqArgs.iJiFen);
        var iGolds = parseInt(iJiFen / 2);
        db.get_user_info(pReqArgs.iUserId, function (pUserInfo) {
            if (pUserInfo == null) {
                http.send(res, ErrorCodes.ERR_USERISNOTEXISTS, "用户不存在");
                return;
            }

            if (pUserInfo.golds < iGolds) {
                http.send(res, ErrorCodes.ERR_NOTENOUGHGOLDS, "金币不够");
                return;
            }

            db.add_user_golds(pReqArgs.iUserId, -iGolds, function (iCount) {
                if (iCount == 1) {
                    var pUserObj = pPlayers[pReqArgs.iUserId];
                    if (pUserObj == null) {
                        pUserObj.iJiFenDR = iJiFen;    // 用户带入
                        pUserObj.iJiFen = iJiFen;      // 当前积分
                        pUserObj.iJiFenYZ = 0;         // 用户押注

                        pPlayers[pReqArgs.iUserId] = pUserObj;
                    }
                    else {
                        pUserObj.iJiFenDR += iJiFen;
                        pUserObj.iJiFen += iJiFen;
                    }
                    var szSql = "update tb_rooms set players = $1 where roomid = $2";
                    db.UpdateSQL(szSql, [JSON.stringify(pPlayers), pReqArgs.iRoomId], function (iCount) {
                        if (iCount == 1) {
                            var pRetObj = {
                                iGolds: pUserInfo.golds - iGolds,
                                iJiFen: pUserObj.iJiFen,
                            }
                            http.send(res, ErrorCodes.ERR_NOERROR, "操作成功", pRetObj);
                        }
                        else {
                            http.send(res, ErrorCodes.ERR_DBUPDATEFALIED, "带入失败");
                        }
                    });
                }
                else {
                    http.send(res, ErrorCodes.ERR_DBUPDATEFALIED, "带入失败");
                }
            });
        })
    });
});

// 玩家请求坐下
app.get("/ReqSitdown", async function (req, res) {
    var pReqArgs = req.query;
    var szIpAddress = req.ip;

    if (szIpAddress.indexOf("::ffff:") != -1) szIpAddress = szIpAddress.substr(7);

    console.log("/ReqSitdown iRoomId:" + pReqArgs.iRoomId);
    var pRoomInfo = await dbLGQ.get_room_info(pReqArgs.iRoomId);
    if (pRoomInfo == null) {
        http.send(res, ErrorCodes.ERR_ROOMISNOTEXISTS, "房间不存在");
        return;
    };

    var pClubInfo = dbLGQ.get_club_info(pRoomInfo.clubid);
    if (pClubInfo == null) {
        http.send(res, ErrorCodes.ERR_ROOMISNOTEXISTS, "房间不存在");
        return;
    }

    var pAdminUsers = SysUtils.GetJsonObj(pClubInfo.adminusers);
    if (pAdminUsers == null) pAdminUsers = [];

    var pData = {
        iRoomId: pReqArgs.iRoomId,
        iUserId: pReqArgs.iUserId,
        iReqJiFen: pReqArgs.iReqJiFen,
        iReqSeatIndex: pReqArgs.iReqSeatIndex
    };
    //console.log(pData);

    for (var iIndex = 0; iIndex < pAdminUsers.length; ++iIndex) {
        var iUserId = pAdminUsers[iIndex];

        console.log("send reqsd_request to iUserId:" + iUserId);
        userMgr.SendMsg(iUserId, "reqsd_request", pData);
    }

    http.send(res, ErrorCodes.ERR_NOERROR, "操作成功");
});

// 玩家上分请求
app.get("/AddJiFen", async function (req, res) {
    var pReqArgs = req.query;
    var szIpAddress = req.ip;

    if (szIpAddress.indexOf("::ffff:") != -1) szIpAddress = szIpAddress.substr(7);

    pReqArgs = JSON.parse(pReqArgs.pReqArgs);
    console.log("/AddJiFen iRoomId:" + pReqArgs.iRoomId);
    var pRoomInfo = await dbLGQ.get_room_info(pReqArgs.iRoomId);
    if (pRoomInfo == null) {
        http.send(res, ErrorCodes.ERR_ROOMISNOTEXISTS, "房间不存在");
        return;
    };

    var pUserIds = pReqArgs.pSendUsers;
    console.log("send addjifen_request to users:" + JSON.stringify(pUserIds));
    for (var iIndex = 0; iIndex < pUserIds.length; ++iIndex) {
        var iUserId = pUserIds[iIndex];
        userMgr.SendMsg(iUserId, "addjifen_lailao_notify", {
            wErrCode: ErrorCodes.ERR_NOERROR,
            szErrMsg: "操作成功",

            iCmd: pReqArgs.iCmd,    // 玩家申请上分
            iFromClub: pReqArgs.iClubId,
            iRoomId: pReqArgs.iRoomId,
            iFromUser: pReqArgs.iUserId
        });
        // (function (iRoomId, iUserId) {
        //     GetAddJiFenReqs(iUserId, iRoomId, function (pRetObjs) {
        //         if (pRetObjs.length > 0) {
        //             userMgr.SendMsg(iUserId, "getaddjfusers_result", {
        //                 wErrCode: ErrorCodes.ERR_NOERROR,
        //                 szErrMsg: "操作成功",
        //                 pRetObjs: pRetObjs
        //             });
        //         }
        //     });
        // })(pReqArgs.iRoomId, iUserId);
    }

    http.send(res, ErrorCodes.ERR_NOERROR, "操作成功");
});

// 申请解散房间
app.get("/JieSanRoomReq", function (req, res) {
    var pReqArgs = req.query;
    var szIpAddress = req.ip;

    if (szIpAddress.indexOf("::ffff:") != -1) szIpAddress = szIpAddress.substr(7);

    console.log("/ReqSitdown iRoomId:" + pReqArgs.iRoomId);
    db.get_room_info(pReqArgs.iRoomId, function (pRoomInfo) {
        if (pRoomInfo == null) {
            http.send(res, ErrorCodes.ERR_ROOMISNOTEXISTS, "房间不存在");
            return;
        };

        var iCreator = pRoomInfo.creator;   // 创建者
        var pData = {
            iRoomId: pReqArgs.iRoomId,
            iUserId: pReqArgs.iReqUser,
        };
        console.log(pData);
        userMgr.SendMsg(iCreator, "reqsd_request", pData);

        http.send(res, ErrorCodes.ERR_NOERROR, "操作成功");
    });
});

// 房主是否同意解散房间
app.get("/JieSanRoomRep", function (req, res) {
    var pReqArgs = req.query;
    var szIpAddress = req.ip;

    if (szIpAddress.indexOf("::ffff:") != -1) szIpAddress = szIpAddress.substr(7);

    var pGServer = GetRoomServer(pReqArgs.iRoomId);
    if (pGServer == null) {
        http.send(res, ErrorCodes.ERR_DBSERVERNOTRUN, "数据服务器未启动");
        return;
    }

    db.get_room_info(pReqArgs.iRoomId, function (pRoomInfo) {
        if (pRoomInfo == null) {
            http.send(res, ErrorCodes.ERR_ROOMISNOTEXISTS, "房间不存在");
            return;
        }

        pReqArgs.iUserId = parseInt(pReqArgs.iUserId);
        if (pReqArgs.iUserId != pRoomInfo.creator) {
            http.send(res, ErrorCodes.ERR_ERRORAUTHORITY, "只有房主才能解散房间");
            return;
        }

        PostGServerMsg(pGServer.IP, pGServer.HTTPPORT, "/DeleteRoom", pData, function (pRetObj) {
            if (pRetObj.wErrCode == ErrorCodes.ERR_NOERROR) {
                db.DeleteSQL("delete tb_rooms where roomid = $1", [pReqArgs.iRoomId], function (iCount) {
                    if (icount == 1) {
                        http.send(res, ErrorCodes.ERR_NOERROR, "操作成功");
                    }
                    else {
                        http.send(res, ErrorCodes.ERR_INVOKE_FALIED, "删除房间失败");
                    }
                });
            }
            else {
                http.send(res, ErrorCodes.ERR_INVOKE_FALIED, "删除房间失败");
            }
        });
    });
});





function ReadImage(szFileName, pResponse) {
    var pFileStream = require("fs");

    pFileStream.readFile(szFileName, "binary", function (err, file) {
        if (err != null) {
            //console.log("ReadImage read file:" + szFileName + " falied.");
        }
        else {
            pResponse.write(file, "binary");
            pResponse.end();
        }
    });
}

// 测试接口
app.get("/Test", function (req, res) {
    res.writeHead(200, { 'Content-Type': 'image/jpeg' });
    ReadImage("./Images/1.jpg", res);
});

// 获取用户头像、俱乐部图标地址
app.get("/GetImageUrl", async function (req, res) {
    var pReqArgs = req.query;

    if (pReqArgs.iMode == 1) {  // 用户头像
        res.writeHead(200, { 'Content-Type': 'image/jpeg' });
        ReadImage("./Images/" + pReqArgs.iMode + '/' + pReqArgs.iUserId + "/headico.jpg", res);
        //ReadImage("C:/GServer/XLGames/Images/" + pReqArgs.iUserId + "/headico.jpg", res);
    }
    else if (pReqArgs.iMode == 2) { // 俱乐部图标
        /*
        var pInfo = await dbLGQ.get_user_clubinfo(pReqArgs.iUserId);
        if (pInfo == null) {
            http.send(res, ErrorCodes.ERR_INVOKE_FALIED, "没有可用的俱乐部");
            return;
        }
        ReadImage("./Images/" + pInfo.clubid + "/clubico.jpg", res);
        */
        res.writeHead(200, { 'Content-Type': 'image/jpeg' });
        ReadImage("./Images/" + pReqArgs.iMode + '/' + pReqArgs.iClubId + "/clubico.jpg", res);
    }
    else {
        http.send(res, ErrorCodes.ERR_INVOKE_FALIED, "无效地址");
    }
});


// ========================================================================

// 启动的时候读取配置文件 (当前配置有几个游戏服务器，且等待几个游戏服务器都启动成功后加载房间信息再将房间自动分配到各游戏服务器中)
function WebSocketService() {
    userMgr.Init(g_pAppGlobals);

    var pCServer = AppConfigs.center_server();
    WebSocket = require("socket.io")(pCServer.PORT);

    WebSocket.sockets.on("connection", function (socket) {
        socket.on("error", function (data) {
        });

        socket.on("disconnect", function (data) {
            if (socket.iUserId != null) {
                userMgr.Delete(socket.iUserId);
            }
        });

        // 普通账号注册
        socket.on("regaccount", async function (data) {
            var pReqArgs = CheckReqArgs(socket, "regaccount", data);
            if (pReqArgs == null) return;

            var szAccount = pReqArgs.szAccount;
            var szPassword = pReqArgs.szPassword;
            var szAlias = pReqArgs.szAlias;
            var szHeadIco = pReqArgs.szHeadIco;
            var bSex = (pReqArgs.iSex != 0);

            if ((szAccount == null) || (szAccount == "")) {
                socket.emit("regaccount_result", {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "参数错误"
                });
                return;
            }

            var pUserInfo = await dbLGQ.get_account_info(szAccount);
            if (pUserInfo != null) {
                socket.emit("regaccount_result", {
                    wErrCode: ErrorCodes.ERR_ACCOUNTISEXISTS,
                    szErrMsg: "账号不存在"
                });
                return;
            }

            var bRet = await dbLGQ.create_account(szAccount, szPassword, szAlias, szHeadIco, bSex);
            if (bRet) {
                socket.emit("regaccount_result", {
                    wErrCode: ErrorCodes.ERR_NOERROR,
                    szErrMsg: "操作成功",
                    szAccount: szAccount,
                    szPassword: szPassword
                });
            }
            else {
                socket.emit("regaccount_result", {
                    wErrCode: ErrorCodes.ERR_CREATEUSERFAILED,
                    szErrMsg: "创建账号失败"
                });
            }
        });

        // // 获取手机验证码
        // socket.on("getsmscode", function (data) {
        //     var pReqArgs = CheckReqArgs(socket, "getsmscode", data);
        //     if (pReqArgs == null) return;

        //     var pSMSObj = {
        //         szCode: SysUtils.GenRandCodes(6),
        //         tmValue: new Date()
        //     }
        //     SMS_MAPS[pReqArgs.szMobile] = pSMSObj;

        //     var account = "C66602297";
        //     var password = "ee9a8199360d60a39d080b4a8e3b34cc";
        //     var apiKey = "apikey"; // international api key, if exist
        //     var szContent = "您的验证码是：" + pSMSObj.szCode + "。请不要把验证码泄露给其他人。";
        //     console.log("getsmscode phone:" + pReqArgs.szMobile + ", code:" + pSMSObj.szCode);

        //     var pSMS = new SMS(account, password, apiKey);
        //     pSMS.send(pReqArgs.szMobile, szContent, function (err, smsId) {
        //         if (err) {
        //             console.log(err.message);

        //             delete SMS_MAPS[pReqArgs.szMobile];
        //             socket.emit("getsmscode_result", {
        //                 wErrCode: ErrorCodes.ERR_INVOKE_FALIED,
        //                 szErrMsg: "获取验证码失败"
        //             });
        //         }
        //         else {
        //             socket.emit("getsmscode_result", {
        //                 wErrCode: ErrorCodes.ERR_NOERROR,
        //                 szErrMsg: "操作成功"
        //             });
        //             console.log("SMS sent, and smsId is " + smsId + ", 验证码：" + pSMSObj.szCode);
        //         }
        //     });
        // });

        // 获取手机验证码
        socket.on("getsmscode", function (data) {
            var pReqArgs = CheckReqArgs(socket, "getsmscode", data);
            if (pReqArgs == null) return;

            var pSMSObj = {
                szCode: SysUtils.GenRandCodes(6),
                tmValue: new Date()
            }
            SMS_MAPS[pReqArgs.szMobile] = pSMSObj;

            var szContent = "您的验证码是：" + pSMSObj.szCode + "。请不要把验证码泄露给其他人。";
            console.log("getsmscode phone:" + pReqArgs.szMobile + ", code:" + pSMSObj.szCode);

            SMS(pReqArgs.szMobile, pSMSObj.szCode, function (pSMS) {
                if (!pSMS.errcode) {
                    socket.emit("getsmscode_result", {
                        wErrCode: ErrorCodes.ERR_NOERROR,
                        szErrMsg: "操作成功"
                    });
                } else {
                    delete SMS_MAPS[pReqArgs.szMobile];
                        socket.emit("getsmscode_result", {
                            wErrCode: ErrorCodes.ERR_INVOKE_FALIED,
                            szErrMsg: "获取验证码失败" + "/ " + pSMS.message
                        });
                }
            });
        });

        // 获取手机验证码(解散联盟)
        socket.on("getsmscodejslm", async function (data) {
            var pReqArgs = CheckReqArgs(socket, "getsmscodejslm", data);
            if (pReqArgs == null) return;
            if (!CheckSocketUser(socket, "getsmscodejslm")) return;

            var pUserInfo = await dbLGQ.get_user_info(socket.iUserId);
            if (pUserInfo == null) {
                socket.emit("getsmscodejslm_result", {
                    wErrCode: ErrorCodes.ERR_USERISNOTEXISTS,
                    szErrMsg: "用户不存在"
                });
                return;
            }
            pReqArgs.szMobile = pUserInfo.account;

            if (pReqArgs.szMobile.length != 11) {
                socket.emit("getsmscodejslm_result", {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "无效手机号"
                });
                return;
            }

            var pSMSObj = {
                szCode: SysUtils.GenRandCodes(6),
                tmValue: new Date()
            }
            SMS_MAPS[pReqArgs.szMobile] = pSMSObj;

            var account = "C66602297";
            var password = "ee9a8199360d60a39d080b4a8e3b34cc";
            var apiKey = "apikey"; // international api key, if exist
            var szContent = "您的验证码是：" + pSMSObj.szCode + "。请不要把验证码泄露给其他人。";
            console.log("getsmscodejslm phone:" + pReqArgs.szMobile + ", code:" + pSMSObj.szCode);

            var pSMS = new SMS(account, password, apiKey);
            pSMS.send(pReqArgs.szMobile, szContent, function (err, smsId) {
                if (err) {
                    console.log(err.message);

                    delete SMS_MAPS[pReqArgs.szMobile];
                    socket.emit("getsmscodejslm_result", {
                        wErrCode: ErrorCodes.ERR_INVOKE_FALIED,
                        szErrMsg: "获取验证码失败"
                    });
                }
                else {
                    socket.emit("getsmscodejslm_result", {
                        wErrCode: ErrorCodes.ERR_NOERROR,
                        szErrMsg: "操作成功"
                    });
                    console.log("SMS sent, and smsId is " + smsId + ", 验证码：" + pSMSObj.szCode);
                }
            });
        });

        // 手机账号注册
        socket.on("regphone", async function (data) {
            var pReqArgs = CheckReqArgs(socket, "regphone", data);
            if (pReqArgs == null) return;

            var pInfo = SMS_MAPS[pReqArgs.szMobile];
            if (pInfo == null) {
                socket.emit("regphone_result", {
                    wErrCode: ErrorCodes.ERR_INVOKE_FALIED,
                    szErrMsg: "验证码超时"
                });
                return;
            }

            if (pInfo.szCode != pReqArgs.szCode) {
                socket.emit("regphone_result", {
                    wErrCode: ErrorCodes.ERR_INVOKE_FALIED,
                    szErrMsg: "验证码错误"
                });
                return;
            }
            console.log(pReqArgs);
            var pUserInfo = await dbLGQ.get_account_info(pReqArgs.szMobile);
            if (pUserInfo != null) {
                socket.emit("regphone_result", {
                    wErrCode: ErrorCodes.ERR_INVOKE_FALIED,
                    szErrMsg: "账号已存在"
                });
                return;
            }

            var bSex = (pReqArgs.iSex != 0);
            var bRet = await dbLGQ.create_account(pReqArgs.szMobile, pReqArgs.szPassword, pReqArgs.szHeadIco, bSex);
            if (bRet) {
                delete SMS_MAPS[pReqArgs.szMobile];
                await LoginIn(pReqArgs.szMobile, pReqArgs.szPassword, socket);
            }
            else {
                socket.emit("regphone_result", {
                    wErrCode: ErrorCodes.ERR_INVOKE_FALIED,
                    szErrMsg: "创建账号失败"
                });
            }
        });

        // 手机账号密码修改
        socket.on("chgpassword", async function (data) {
            var pReqArgs = CheckReqArgs(socket, "chgpassword", data);
            if (pReqArgs == null) return;

            var pInfo = SMS_MAPS[pReqArgs.szMobile];
            if (pInfo == null) {
                socket.emit("chgpassword_result", {
                    wErrCode: ErrorCodes.ERR_INVOKE_FALIED,
                    szErrMsg: "验证码超时"
                });
                return;
            }

            if (pInfo.szCode != pReqArgs.szCode) {
                socket.emit("chgpassword_result", {
                    wErrCode: ErrorCodes.ERR_INVOKE_FALIED,
                    szErrMsg: "验证码错误"
                });
                return;
            }

            var pUserInfo = await dbLGQ.get_account_info(pReqArgs.szMobile);
            if (pUserInfo == null) {
                socket.emit("chgpassword_result", {
                    wErrCode: ErrorCodes.ERR_INVOKE_FALIED,
                    szErrMsg: "账号不存在"
                });
            }

            pReqArgs.szPassword = crypto.md5(pReqArgs.szPassword);
            pReqArgs.szPassword = pReqArgs.szPassword.toLocaleUpperCase();
            if (pReqArgs.szPassword == pUserInfo.password) {
                socket.emit("chgpassword_result", {
                    wErrCode: ErrorCodes.ERR_INVOKE_FALIED,
                    szErrMsg: "新密码不能与原密码一样"
                });
                return;
            }

            var pRes = await dbCC.query("update tb_users set password = $1 where account = $2", [pReqArgs.szPassword, pReqArgs.szMobile]);
            if (pRes.rowCount == 0) {
                socket.emit("chgpassword_result", {
                    wErrCode: ErrorCodes.ERR_INVOKE_FALIED,
                    szErrMsg: "修改密码失败"
                });
                return;
            }

            delete SMS_MAPS[pReqArgs.szMobile];
            socket.emit("chgpassword_result", {
                wErrCode: ErrorCodes.ERR_NOERROR,
                szErrMsg: "操作成功"
            });
        });

        // 微信授权
        socket.on("wechatauth", function (data) {
            var pReqArgs = CheckReqArgs(socket, "wechatauth", data);
            if (pReqArgs == null) return;

            console.log("============ wechat_auth ============");
            console.log("  pReqArgs.szOS: " + pReqArgs.szOS);
            console.log("pReqArgs.szCode: " + pReqArgs.szCode);

            wxLibs.wxGetAccessToken(pReqArgs.szCode, pReqArgs.szOS, function (bRet1, pData1) {
                if (!bRet1) {
                    console.log("wechatauth call wxGetAccessToken falied...");
                    socket.emit("wechatauth_result",
                        {
                            wErrCode: ErrorCodes.ERR_GETWXINFOFALIED,
                            szErrMsg: "获取微信信息失败"
                        });
                    return;
                }

                var szAccessToken = pData1.access_token;
                var szOpenId = pData1.openid;
                if (szOpenId == null) {
                    socket.emit("wechatauth_result",
                        {
                            wErrCode: ErrorCodes.ERR_GETWXINFOFALIED,
                            szErrMsg: "获取微信信息失败"
                        });
                    console.log("wechatauth openid is null...");
                    return;
                }

                wxLibs.wxGetUserInfo(szAccessToken, szOpenId, function (bRet2, pData2) {
                    if (!bRet2) {
                        socket.emit("wechatauth_result",
                            {
                                wErrCode: ErrorCodes.ERR_GETWXINFOFALIED,
                                szErrMsg: "获取微信信息失败"
                            });
                        console.log("wechatauth call get_state_info falied...");
                        return;
                    }

                    var szOpenId = pData2.openid;
                    var szAlias = pData2.nickname;
                    var bSex = (pData2.sex != 0);
                    var szHeadIco = pData2.headimgurl;
                    var szAccount = "wx_" + szOpenId;
                    var szPassword = crypto.md5(szOpenId).toLocaleUpperCase();

                    db.create_account(szAccount, szPassword, szAlias, szHeadIco, bSex, function (bRet) {
                        if (bRet) {
                            socket.emit("wechatauth_result",
                                {
                                    wErrCode: ErrorCodes.ERR_NOERROR,
                                    szErrMsg: "操作成功",
                                    szAccount: szAccount,
                                    szPassword: szPassword
                                });
                        }
                        else {
                            socket.emit("wechatauth_result",
                                {
                                    wErrCode: ErrorCodes.ERR_CREATEACCOUNTFALIED,
                                    szErrMsg: "创建账号失败"
                                });
                        }
                    });
                });
            });
        });

        // 登录
        socket.on("loginin", async function (data) {
            var pReqArgs = CheckReqArgs(socket, "loginin", data);
            if (pReqArgs == null) return;

            console.log("=============== login ===============");

            var pfnGenUUIDKey = function() {
                var tmNow = new Date();
                var Result = tmNow.getTime().toString() + SysUtils.GenNumber(16);
                Result = crypto.md5(Result);
                Result = Result.toLocaleUpperCase();
                return Result;
            }

            var pfnCheckLoginUser = async function(pUserInfo) {
                //return false;
                
                var Result = false;
                var pSocket = userMgr.GetSocketObj(pUserInfo.userid);
                if (pSocket != null) {
                    Result = true;
                    pSocket.emit("other_login_result", { iUserId: pUserInfo.userid });                    
                }
                    
                var iRoomId = parseInt(pUserInfo.roomid);
                if (iRoomId != 0) {
                    var pRoomInfo = await dbLGQ.get_room_info(iRoomId);
                    if (pRoomInfo != null) {
                        PostRoomMsg(pRoomInfo.roomuuid, {
                            iCmdId: CmdIds.CMD_OTHERLOGIN_NOTIFY,   // 二次登录
                            iRoomId: iRoomId,
                            iUserId: pUserInfo.userid
                        }, function(pRetObj) {});
                    }
                }

                return Result;
            }

            if (pReqArgs.iMode == 1) {
                console.log("account:" + pReqArgs.szAccount);
                console.log("password:" + pReqArgs.szPassword);

                var bCreate = true;
                var pUserInfo = null;
                while (true) {
                    pUserInfo = await dbLGQ.get_account_info(pReqArgs.szAccount);
                    if (pUserInfo != null) break;

                    if (bCreate) {
                        await dbLGQ.create_account(pReqArgs.szAccount, pReqArgs.szPassword, pReqArgs.szHeadIco, pReqArgs.bSex);
                        bCreate = false;
                        continue;
                    }

                    socket.emit("loginin_result", {
                        wErrCode: ErrorCodes.ERR_ACCOUNTISNOTEXISTS,
                        szErrMsg: "账号不存在"
                    });
                    break;
                }

                //if (await pfnCheckLoginUser(pUserInfo)) return;

                pReqArgs.szPassword = crypto.md5(pReqArgs.szPassword);
                pReqArgs.szPassword = pReqArgs.szPassword.toLocaleUpperCase();
                if (pUserInfo.password != pReqArgs.szPassword) {
                    socket.emit("loginin_result", {
                        wErrCode: ErrorCodes.ERR_INVALIDPASSWORD,
                        szErrMsg: "密码错误"
                    });
                    return;
                }

                var tmNow = new Date();

                var bExistClubAlert = await IsExistsClubGoldsAlert(pUserInfo.userid);
                var pRetObj = {
                    wErrCode: ErrorCodes.ERR_NOERROR,
                    szErrMsg: "操作成功",
                    iMode: 1,
                    szAccount: pUserInfo.account,
                    iUserId: pUserInfo.userid,
                    szName: pUserInfo.alias,
                    szHeadIco: pUserInfo.headico,
                    iSex: pUserInfo.sex,
                    iGolds: pUserInfo.golds,
                    iGems: pUserInfo.gems,
                    iLevels: pUserInfo.level,            // 用户等级 0: 普通用户, 1: 一级VIP, 2:二级VIP,..., 100: 后台管理员
                    iRoomId: pUserInfo.roomid,
                    iRoomClubId: pUserInfo.roomclubid,
                    iClubId: pUserInfo.clubid,
                    iClubNums: pUserInfo.clubnums,       // 可以创建的俱乐部数量
                    iMsgCount: pUserInfo.mymsgcount,
                    bIsVIP: tmNow.getTime() < pUserInfo.vipendtime.getTime(),
                    tmVipEndTime: pUserInfo.vipendtime,   // VIP结束时间
                    bExistClubAlert: bExistClubAlert,
                    iChgUserAliasGolds: 500,
                    iChgClubAliasGolds: 10000,

                    UUID_KEY: pfnGenUUIDKey()
                }
                socket.emit("loginin_result", pRetObj);

                userMgr.Add(pRetObj.iUserId, socket);
                await OnUserLoginInEvent(pRetObj, socket);
                await dbCC.query("update tb_users set uuidkey = $1 where userid = $2", [pRetObj.UUID_KEY, pRetObj.iUserId]);
            }
            else if (pReqArgs.iMode == 2) {
                var pUserInfo = await dbLGQ.get_user_info(pReqArgs.iUserId);
                if (pUserInfo == null) {
                    socket.emit("loginin_result", {
                        wErrCode: ErrorCodes.ERR_ACCOUNTISNOTEXISTS,
                        szErrMsg: "账号不存在"
                    });
                    return;
                }

                var szUUID_Key = pUserInfo.uuidkey;
                if ((szUUID_Key == null) || (szUUID_Key == "")) {
                    szUUID_Key = pfnGenUUIDKey();
                    await dbCC.query("update tb_users set uuidkey = $1 where userid = $2", [szUUID_Key, pReqArgs.iUserId]);
                }
                else if (pReqArgs.szUUID_KEY != szUUID_Key) {
                    await pfnCheckLoginUser(pUserInfo);

                    if (pReqArgs.szUUID_KEY == "") pReqArgs.szUUID_KEY = pfnGenUUIDKey();

                    szUUID_Key = pReqArgs.szUUID_KEY;
                    await dbCC.query("update tb_users set uuidkey = $1 where userid = $2", [szUUID_Key, pReqArgs.iUserId]);
                }

                var tmNow = new Date();
                var bExistClubAlert = await IsExistsClubGoldsAlert(pUserInfo.userid);
                var pRetObj = {
                    wErrCode: ErrorCodes.ERR_NOERROR,
                    szErrMsg: "操作成功",
                    iMode: 2,
                    szAccount: pUserInfo.account,
                    iUserId: pUserInfo.userid,
                    szName: pUserInfo.alias,
                    szHeadIco: pUserInfo.headico,
                    iSex: pUserInfo.sex,
                    iGolds: pUserInfo.golds,
                    iGems: pUserInfo.gems,
                    iLevels: pUserInfo.level,            // 用户等级 0: 普通用户, 1: 一级VIP, 2:二级VIP,..., 100: 后台管理员
                    iRoomId: pUserInfo.roomid,
                    iClubId: pUserInfo.clubid,
                    iRoomClubId: pUserInfo.roomclubid,
                    iClubNums: pUserInfo.clubnums,       // 可以创建的俱乐部数量
                    iMsgCount: pUserInfo.mymsgcount,
                    bIsVIP: tmNow.getTime() < pUserInfo.vipendtime.getTime(),
                    tmVipEndTime: pUserInfo.vipendtime,   // VIP结束时间
                    bExistClubAlert: bExistClubAlert,
                    iChgUserAliasGolds: 500,
                    iChgClubAliasGolds: 10000,

                    UUID_KEY: szUUID_Key
                }
                socket.emit("loginin_result", pRetObj);

                userMgr.Add(pRetObj.iUserId, socket);
                await OnUserLoginInEvent(pRetObj, socket);
            }
            else if (pReqArgs.iMode == 3) {
                var pUserInfo = await dbLGQ.get_account_info(pReqArgs.szAccount);
                if (pUserInfo == null) {
                    socket.emit("loginin_result", {
                        wErrCode: ErrorCodes.ERR_ACCOUNTISNOTEXISTS,
                        szErrMsg: "账号不存在"
                    });
                    return;
                }

                var szUUID_Key = pUserInfo.uuidkey;
                if ((szUUID_Key == null) || (szUUID_Key == "")) {
                    szUUID_Key = pfnGenUUIDKey();
                    await dbCC.query("update tb_users set uuidkey = $1 where account = $2", [szUUID_Key, pReqArgs.szAccount]);
                }
                else if (pReqArgs.szUUID_KEY != szUUID_Key) {
                    await pfnCheckLoginUser(pUserInfo); //return;

                    if (pReqArgs.szUUID_KEY == "") pReqArgs.szUUID_KEY = pfnGenUUIDKey();

                    szUUID_Key = pReqArgs.szUUID_KEY;
                    await dbCC.query("update tb_users set uuidkey = $1 where account = $2", [szUUID_Key, pReqArgs.szAccount]);
                }

                pReqArgs.szPassword = crypto.md5(pReqArgs.szPassword);
                pReqArgs.szPassword = pReqArgs.szPassword.toLocaleUpperCase();
                if (pUserInfo.password != pReqArgs.szPassword) {
                    socket.emit("loginin_result", {
                        wErrCode: ErrorCodes.ERR_INVALIDPASSWORD,
                        szErrMsg: "密码错误"
                    });
                    return;
                }

                var tmNow = new Date();
                var bExistClubAlert = await IsExistsClubGoldsAlert(pUserInfo.userid);
                var pRetObj = {
                    wErrCode: ErrorCodes.ERR_NOERROR,
                    szErrMsg: "操作成功",
                    iMode: 3,
                    szAccount: pUserInfo.account,
                    iUserId: pUserInfo.userid,
                    szName: pUserInfo.alias,
                    szHeadIco: pUserInfo.headico,
                    iSex: pUserInfo.sex,
                    iGolds: pUserInfo.golds,
                    iGems: pUserInfo.gems,
                    iLevels: pUserInfo.level,            // 用户等级 0: 普通用户, 1: 一级VIP, 2:二级VIP,..., 100: 后台管理员
                    iRoomId: pUserInfo.roomid,
                    iRoomClubId: pUserInfo.roomclubid,
                    iClubId: pUserInfo.clubid,
                    iClubNums: pUserInfo.clubnums,       // 可以创建的俱乐部数量
                    iMsgCount: pUserInfo.mymsgcount,
                    bIsVIP: tmNow.getTime() < pUserInfo.vipendtime.getTime(),
                    tmVipEndTime: pUserInfo.vipendtime,   // VIP结束时间
                    bExistClubAlert: bExistClubAlert,

                    iChgUserAliasGolds: 500,
                    iChgClubAliasGolds: 10000,

                    UUID_KEY: pfnGenUUIDKey()
                }
                socket.emit("loginin_result", pRetObj);

                userMgr.Add(pRetObj.iUserId, socket);
                await OnUserLoginInEvent(pRetObj, socket);
            }
        });

        // 退出
        socket.on("loginout", function (data) {
            if (socket.iUserId != null) {
                var pSocket = userMgr.GetSocketObj(socket.iUserId);
                if (pSocket.id == socket.id) {
                    userMgr.Delete(socket.iUserId);
                }
            }
        });

        // 获取用户基本信息
        socket.on("getuserinfo", async function (data) {
            var pReqArgs = CheckReqArgs(socket, "getuserinfo", data);
            if (pReqArgs == null) return;
            if (!CheckSocketUser(socket, "getuserinfo")) return;

            var pUserInfo = await dbLGQ.get_user_info(pReqArgs.iUserId);
            if (pUserInfo == null) {
                socket.emit("getuserinfo_result", {
                    wErrCode: ErrorCodes.ERR_USERISNOTEXISTS,
                    szErrMsg: "用户不存在"
                });
                return;
            }

            var tmNow = new Date();
            var bExistClubAlert = await IsExistsClubGoldsAlert(pUserInfo.userid);
            var pRetObj = {
                wErrCode: ErrorCodes.ERR_NOERROR,
                szErrMsg: "操作成功",
                iUserId: pUserInfo.userid,
                szName: pUserInfo.alias,
                szHeadIco: pUserInfo.headico,
                iSex: pUserInfo.sex,
                iGolds: pUserInfo.golds,
                iGems: pUserInfo.gems,
                iLevels: pUserInfo.level,            // 用户等级 0: 普通用户, 1: 一级VIP, 2:二级VIP,..., 100: 后台管理员
                iRoomId: pUserInfo.roomid,
                iRoomClubId: pUserInfo.roomclubid,
                iClubId: pUserInfo.clubid,
                iClubNums: pUserInfo.clubnums,       // 可以创建的俱乐部数量
                iMsgCount: pUserInfo.mymsgcount,
                bIsVIP: tmNow.getTime() < pUserInfo.vipendtime.getTime(),
                tmVipEndTime: pUserInfo.vipendtime,   // VIP结束时间
                bExistClubAlert: bExistClubAlert
            }
            socket.emit("getuserinfo_result", pRetObj);
        });

        // 修改用户名称
        socket.on("chgalias", async function (data) {
            var pReqArgs = CheckReqArgs(socket, "chgalias", data);
            if (pReqArgs == null) return;
            if (!CheckSocketUser(socket, "chgalias")) return;

            var pRes = await dbCC.query("select userid, alias, golds, gems, chgalias from tb_users where userid = $1", [socket.iUserId]);
            if (pRes.rows.length == 0) {
                socket.emit("chgalias_result", {
                    wErrCode: ErrorCodes.ERR_USERISNOTEXISTS,
                    szErrMsg: "用户不存在"
                });
                return;
            }

            var pInfo = pRes.rows[0];
            pInfo.golds = parseInt(pInfo.golds);
            if (pInfo.golds < 500) {
                socket.emit("chgalias_result", {
                    wErrCode: ErrorCodes.ERR_NOTENOUGHGOLDS,
                    szErrMsg: "金币不足"
                });
                return;
            }

            var szAlias = crypto.toBase64(pReqArgs.szAlias);
            if (szAlias == pInfo.alias) {
                socket.emit("chgalias_result", {
                    wErrCode: ErrorCodes.ERR_NOERROR,
                    szErrMsg: "操作成功",
                    szAlias: pReqArgs.szAlias,
                    iGems: pInfo.gems,
                    iGolds: pInfo.golds
                });
                return;
            }

            pRes = await dbCC.query("select count(userid) from tb_users where alias = $1", [szAlias]);
            if (pRes.rows[0].count == 1) {
                socket.emit("chgalias_result", {
                    wErrCode: ErrorCodes.ERR_USERISNOTEXISTS,
                    szErrMsg: "用户名已存在"
                });
                return;
            }

            var szSql = "update tb_users set chgalias = true, alias = $1, golds = golds - $2 where userid = $3";
            pRes = await dbCC.query(szSql, [szAlias, 500, socket.iUserId]);
            if (pRes.rowCount == 0) {
                socket.emit("chgalias_result", {
                    wErrCode: ErrorCodes.ERR_DBUPDATEFALIED,
                    szErrMsg: "修改名称失败"
                });
                return;
            }

            // var pFindKeys = getGroup(pReqArgs.szAlias.split(""));
            var pFindKeys = [];
            getGroup2(pReqArgs.szAlias.split("") ,pFindKeys);
            pFindKeys.push(socket.iUserId);
            pFindKeys = pFindKeys.join(" ");
            await dbCC.query("update tb_joinclubs set forsearch = $1 where userid = $2", [pFindKeys, socket.iUserId]);

            socket.emit("chgalias_result", {
                wErrCode: ErrorCodes.ERR_NOERROR,
                szErrMsg: "操作成功",
                szAlias: pReqArgs.szAlias,
                iGems: pInfo.gems,
                iGolds: pInfo.golds - 500
            });
        });

        // 创建俱乐部
        socket.on("creategclub", async function (data) {
            var pReqArgs = CheckReqArgs(socket, "creategclub", data);
            if (pReqArgs == null) return;
            if (!CheckSocketUser(socket, "creategclub")) return;

            pReqArgs.szName = pReqArgs.szName.trim();
            if (pReqArgs.szName.length == 0) {
                socket.emit("creategclub_result", {
                    wErrCode: ErrorCodes.ERR_INVOKE_FALIED,
                    szErrMsg: "请输入有效俱乐部名"
                });
                return;
            }

            var pRes = await dbCC.query("select count(clubid) from tb_clubs where sname = $1", [pReqArgs.szName]);
            if (pRes.rows[0].count == 1) {
                socket.emit("creategclub_result", {
                    wErrCode: ErrorCodes.ERR_INVOKE_FALIED,
                    szErrMsg: "俱乐部名已存在，请重新输入"
                });
                return;
            }

            var pInfo = await dbLGQ.get_user_info(socket.iUserId);
            if (pInfo == null) {
                socket.emit("creategclub_result", {
                    wErrCode: ErrorCodes.ERR_USERISNOTEXISTS,
                    szErrMsg: "用户不存在"
                });
                return;
            }

            pRes = await dbCC.query("select count(*) from tb_clubs where creator = $1", [socket.iUserId]);
            var iCount = pRes.rows[0].count;
            if (iCount >= pInfo.clubnums) {
                socket.emit("creategclub_result", {
                    wErrCode: ErrorCodes.ERR_USERCLUBNUMISFULL,
                    szErrMsg: "用户创建的俱乐部数量已达上限"
                });
                return;
            }

            // 创建的时候加上头像 URL
            var iClubId = await dbLGQ.create_club(socket.iUserId, pReqArgs.szName, ConstCodes.CLUB_DEFAULT_DAY);
            if (iClubId == 0) {
                socket.emit("creategclub_result", {
                    wErrCode: ErrorCodes.ERR_DBUPDATEFALIED,
                    szErrMsg: "创建俱乐部失败"
                });
                return;
            }

            await dbCC.query("insert into tb_joinclubs(userid, clubid, clublevel, forsearch) values($1, $2, 0, $3)",
                [socket.iUserId, iClubId, iClubId]);
            await dbCC.query("update tb_users set clubid = $1 where userid = $2", [iClubId, socket.iUserId]);

            socket.emit("creategclub_result", {
                wErrCode: ErrorCodes.ERR_NOERROR,
                szErrMsg: "操作成功",
                iClubId: iClubId
            });
        });

        // 修改俱乐部名称
        socket.on("chgclubname", async function (data) {
            var pReqArgs = CheckReqArgs(socket, "chgclubname", data);
            if (pReqArgs == null) return;
            if (!CheckSocketUser(socket, "chgclubname")) return;

            console.log("chgclubname:" + JSON.stringify(pReqArgs));
            var pUserInfo = await dbLGQ.get_user_info(socket.iUserId);
            if (pUserInfo == null) {
                socket.emit("chgclubname_result", {
                    wErrCode: ErrorCodes.ERR_USERISNOTEXISTS,
                    szErrMsg: "用户不存在"
                });
                return;
            }

            pUserInfo.golds = parseInt(pUserInfo.golds);
            if (pUserInfo.golds < 10000) {
                socket.emit("chgclubname_result", {
                    wErrCode: ErrorCodes.ERR_NOTENOUGHGOLDS,
                    szErrMsg: "金币不足"
                });
                return;
            }

            var pClubInfo = await dbLGQ.get_club_info(pReqArgs.iClubId);
            if (pClubInfo == null) {
                socket.emit("chgclubname_result", {
                    wErrCode: ErrorCodes.ERR_CLUBISNOTEXISTS,
                    szErrMsg: "俱乐部不存在"
                });
                return;
            }

            if (parseInt(pClubInfo.creator) != socket.iUserId) {
                socket.emit("chgclubname_result", {
                    wErrCode: ErrorCodes.ERR_ERRORAUTHORITY,
                    szErrMsg: "只有创建者才能修改名称"
                });
                return;
            }

            if (pClubInfo.sname == pReqArgs.szName) {
                var pClubInfo = await GetClubInfo(socket.iUserId, pReqArgs.iClubId);
                pClubInfo.wErrCode = ErrorCodes.ERR_NOERROR;
                pClubInfo.szErrMsg = "操作成功";
                pClubInfo.iGolds = pUserInfo.golds;

                socket.emit("chgclubname_result", pClubInfo);
                return;
            }

            var szSql = "update tb_clubs set sname = $1 where clubid = $2";
            var pRes = await dbCC.query(szSql, [pReqArgs.szName, pReqArgs.iClubId]);
            if (pRes.rowCount == 1) {
                var pClubInfo = await GetClubInfo(socket.iUserId, pReqArgs.iClubId);
                // var pFindKeys = getGroup(pReqArgs.szName.split(""));
                var pFindKeys = [];
                getGroup2(pReqArgs.szName.split("") ,pFindKeys);
                pFindKeys.push(pReqArgs.iClubId);
                pFindKeys = pFindKeys.join(" ");
                db.UpdateSQL("update tb_clubs set forsearch = $1 where clubid = $2", [pFindKeys, pReqArgs.iClubId], null);

                pClubInfo.wErrCode = ErrorCodes.ERR_NOERROR;
                pClubInfo.szErrMsg = "操作成功";
                pClubInfo.iGolds = pUserInfo.golds - 10000;

                await dbLGQ.add_user_golds(socket.iUserId, -10000);
                socket.emit("chgclubname_result", pClubInfo);
            }
            else {
                socket.emit("chgclubname_result", {
                    wErrCode: ErrorCodes.ERR_DBUPDATEFALIED,
                    szErrMsg: "修改失败"
                });
            }
        });

        // 获取俱乐部信息
        socket.on("getgclubinfo", async function (data) {
            var pReqArgs = CheckReqArgs(socket, "getgclubinfo", data);
            if (pReqArgs == null) return;
            if (!CheckSocketUser(socket, "getgclubinfo")) return;

            console.log("getgclubinfo iUserId:" + socket.iUserId + ", iClubId:" + pReqArgs.iClubId);
            var pRetObj = await GetClubInfo(socket.iUserId, pReqArgs.iClubId);
            if (pRetObj == null) {
                socket.emit("getgclubinfo_result", {
                    wErrCode: ErrorCodes.ERR_CLUBISNOTEXISTS,
                    szErrMsg: "俱乐部不存在"
                });
            }
            else {
                pRetObj.wErrCode = ErrorCodes.ERR_NOERROR;
                pRetObj.szErrMsg = "操作成功";
                pRetObj.czDiamond = ConstCodes.ChongZhi_ZuanShi;
                pRetObj.czGold = ConstCodes.ChongZhi_JinBi;
                socket.emit("getgclubinfo_result", pRetObj);
            }
        });

        socket.on("searchgclubinfo", async function (data) {
            var pReqArgs = CheckReqArgs(socket, "searchgclubinfo", data);
            if (pReqArgs == null) return;
            if (!CheckSocketUser(socket, "searchgclubinfo")) return;

            var pRetObj = await GetClubInfo(socket.iUserId, pReqArgs.szName);
            if (pRetObj == null) {
                socket.emit("searchgclubinfo_result", {
                    wErrCode: ErrorCodes.ERR_CLUBISNOTEXISTS,
                    szErrMsg: "俱乐部不存在"
                });
            }
            else {
                pRetObj.wErrCode = ErrorCodes.ERR_NOERROR;
                pRetObj.szErrMsg = "操作成功";

                socket.emit("searchgclubinfo_result", pRetObj);
            }
        });

        // 获取俱乐部联盟
        socket.on("getclubunion", async function (data) {
            var pReqArgs = CheckReqArgs(socket, "getclubunion", data);
            if (pReqArgs == null) return;
            if (!CheckSocketUser(socket, "getclubunion")) return;

            var pfnGetUnionInfos = async function (pUnionIds, iIndex, pRetObj, callback) {
                if (iIndex >= pUnionIds.length) {
                    callback();
                    return;
                }

                var iClubId = pUnionIds[iIndex];
                var pItem = await GetClubInfo(socket.iUserId, iClubId);
                if (pItem != null) {
                    pRetObj.pItems.push(pItem);
                }

                pfnGetUnionInfos(pUnionIds, iIndex + 1, pRetObj, callback);
            }

            db.get_club_info(pReqArgs.iClubId, async function (pClubInfo) {
                if (pClubInfo == null) {
                    socket.emit("getclubinfo_result", {
                        wErrCode: ErrorCodes.ERR_CLUBISNOTEXISTS,
                        szErrMsg: "俱乐部不存在"
                    });
                    return;
                }

                var pUnionIds = SysUtils.GetJsonObj(pClubInfo.unions);
                if (pUnionIds = null) pUnionIds = [];

                var pRetObj = {
                    wErrCode: ErrorCodes.ERR_NOERROR,
                    szErrMsg: "操作成功",
                    pItems: []
                }

                pfnGetUnionInfos(pUnionIds, 0, pRetObj, async function () {
                    socket.emit("getclubinfo_result", pRetObj);

                    var pNewIds = [];
                    for (var iIndex = 0; iIndex < pRetObj.pItems.length; ++iIndex) {
                        var pItem = pRetObj.pItems[iIndex];
                        pNewIds.push(pItem.iClubId);
                    }

                    if (pNewIds.length != pUnionIds) {
                        var szSql = "update tb_clubs set unions = $1 where clubid = $2";
                        var szParams = [
                            JSON.stringify(pNewIds),
                            pReqArgs.iClubId
                        ];

                        db.UpdateSQL(szSql, szParams, null);
                    }
                });
            });
        });

        // 添加俱乐部管理员
        socket.on("addgcadmin", function (data) {
            var pReqArgs = CheckReqArgs(socket, "addgcadmin", data);
            if (pReqArgs == null) return;
            if (!CheckSocketUser(socket, "addgcadmin")) return;

            db.get_user_info(pReqArgs.iAddUser, function (pUserInfo) {
                if (pUserInfo == null) {
                    socket.emit("addgcadmin_result",
                        {
                            wErrCode: ErrorCodes.ERR_USERISNOTEXISTS,
                            szErrMsg: "添加的管理员用户不存在"
                        });
                    return;
                }

                db.get_club_info(pReqArgs.iClubId, function (pClubInfo) {
                    if (pClubInfo == null) {
                        socket.emit("addgcadmin_result",
                            {
                                wErrCode: ErrorCodes.ERR_CLUBISNOTEXISTS,
                                szErrMsg: "俱乐部不存在"
                            });
                        return;
                    }

                    var pAdminUsers = SysUtils.GetJsonObj(pClubInfo.adminusers);
                    if (pAdminUsers = null) pAdminUsers = [];

                    if (pAdminUsers.indexOf(pReqArgs.iAddUser) >= 0) {
                        socket.emit("addgcadmin_result",
                            {
                                wErrCode: ErrorCodes.ERR_INVOKE_FALIED,
                                szErrMsg: "该用户已经是此俱乐部的管理员了"
                            });
                        return;
                    }

                    if (pAdminUsers.length >= 5) {
                        socket.emit("addgcadmin_result",
                            {
                                wErrCode: ErrorCodes.ERR_CLUBISNOTEXISTS,
                                szErrMsg: "俱乐部不存在"
                            });
                        return;
                    }

                    pAdminUsers.push(pReqArgs.iAddUser);

                    var szSql = "update tb_clubs set adminusers = $1 where clubid = $2";
                    var szAdminUsers = JSON.stringify(pAdminUsers);
                    db.UpdateSQL(szSql, [szAdminUsers, pReqArgs.iClubId], function (iCount) {
                        if (iCount == 1) {
                            socket.emit("addgcadmin_result",
                                {
                                    wErrCode: ErrorCodes.ERR_NOERROR,
                                    szErrMsg: "操作成功",
                                    iAddAdmin: pReqArgs.iAddUser
                                });
                        }
                        else {
                            socket.emit("addgcadmin_result",
                                {
                                    wErrCode: ErrorCodes.ERR_DBUPDATEFALIED,
                                    szErrMsg: "添加此俱乐部管理员失败"
                                });
                        }
                    });
                });
            });
        });

        // 获取俱乐部成员 最近30天 总局数，平均输赢
        socket.on("getclubumjs", async function (data) {
            var pReqArgs = CheckReqArgs(socket, "getclubumjs", data);
            if (pReqArgs == null) return;
            if (!CheckSocketUser(socket, "getclubumjs")) return;

            var pRetObj = {
                wErrCode: ErrorCodes.ERR_NOERROR,
                szErrMsg: "操作成功",
                iClubId: pReqArgs.iClubId,
                pUserObjs: []
            }

            console.log("getclubumjs iClubId:" + pReqArgs.iClubId);
            var pClubInfo = await dbLGQ.get_club_info(pReqArgs.iClubId);
            if (pClubInfo == null) {
                socket.emit("getclubumjs_result", {
                    wErrCode: ErrorCodes.ERR_CLUBISNOTEXISTS,
                    szErrMsg: "俱乐部不存在"
                });
                return;
            }

            var pAdminUsers = SysUtils.GetJsonObj(pClubInfo.adminusers);
            if (pAdminUsers == null) pAdminUsers = [];

            pRetObj.iCreator = pClubInfo.creator;   // 俱乐部创建者
            var pUserObjs = await GetClubUserInfo(pReqArgs.iClubId);

            for (var iIndex = 0; iIndex < pUserObjs.length; ++iIndex) {
                var pUserObj = pUserObjs[iIndex];

                pUserObj.iLevel = 0;    // 俱乐部普通成员
                if (pUserObj.iUserId == pClubInfo.creator) {
                    pUserObj.iLevel = 2;    // 俱乐部创建者
                }
                else if (pAdminUsers.indexOf(pUserObj.iUserId) >= 0) {
                    pUserObj.iLevel = 1;    // 俱乐部管理员
                }

                var pRet = await GetClubUserGameTimes(pReqArgs.iClubId, pUserObj.iUserId);
                pUserObj.iCount = pRet.iCount;
                pUserObj.iJieSuanAVG = pRet.iJieSuanAVG;
                pRetObj.pUserObjs.push(pUserObj);

                if (pRetObj.pUserObjs.length == 100) {
                    socket.emit("getclubumjs_result", pRetObj);
                    pRetObj.pUserObjs.splice(0, 100);
                }
            }

            if (pRetObj.pUserObjs.length > 0) {
                socket.emit("getclubumjs_result", pRetObj);
            }
        });

        // 退出俱乐部
        socket.on("exitgclub", async function (data) {
            var pReqArgs = CheckReqArgs(socket, "exitgclub", data);
            if (pReqArgs == null) {
                return console.log("exitgclub 1");
            }

            if (!CheckSocketUser(socket, "exitgclub")) {
                return console.log("exitgclub 2");
            }

            console.log("exitgclub iUserId:" + socket.iUserId + ", pReqArgs.iClubId:" + pReqArgs.iClubId);
            let conn = new dbCC.conn();
            let bError = false;
            try {
                do {
                    await conn.Transaction();
                    let sql = 'delete from tb_joinclubs where userid = $1 and clubid = $2 and status = 1';
                    let res = await conn.Query(sql, [socket.iUserId, pReqArgs.iClubId]);
                    if (res.rowCount > 0) {
                        sql = 'update tb_clubs set unums = unums - 1 where clubid = $1';
                        res = await conn.Query(sql, [pReqArgs.iClubId]);
                        if (res.rowCount == 0) {
                            bError = true;
                            console.log('更新俱乐部人数失败')
                            socket.emit('exitgclub_result', {
                                wErrCode: ErrorCodes.ERR_INVALIDARGS,
                                szErrMsg: "退出俱乐部失败",
                                iUserId: socket.iUserId,
                                iClubId: pReqArgs.iClubId
                            });
                            break;
                        }
                    }
                    console.log("exitgclub res.rowCount:" + res.rowCount);

                    socket.emit('exitgclub_result', {
                        wErrCode: ErrorCodes.ERR_NOERROR,
                        szErrMsg: "俱乐部成功",
                        iUserId: socket.iUserId,
                        iClubId: pReqArgs.iClubId
                    });
                } while (false);

            } catch (e) {
                bError = true;
                console.log(e.message);
                socket.emit('exitgclub_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "退出俱乐部失败",
                    iUserId: socket.iUserId,
                    iClubId: pReqArgs.iClubId
                });
            } finally {
                if (bError) {
                    await conn.Rollback();
                } else {
                    await conn.Commit();
                }
                conn.Release();
            }
        });

        // 将指定用户踢出俱乐部
        socket.on("delclubuser", async function (data) {
            var pReqArgs = CheckReqArgs(socket, "chgcumemo", data);
            if (pReqArgs == null) return;
            if (!CheckSocketUser(socket, "chgcumemo")) return;

            var pClubInfo = await GetClubInfo(socket.iUserId, pReqArgs.iClubId);
            if (pClubInfo == null) {
                socket.emit("delclubuser_result", {
                    wErrCode: ErrorCodes.ERR_CLUBISNOTEXISTS,
                    szErrMsg: "俱乐部不存在"
                });
                return;
            }

            if (!pClubInfo.bIsAdmin) {
                socket.emit("delclubuser_result", {
                    wErrCode: ErrorCodes.ERR_ERRORAUTHORITY,
                    szErrMsg: "权限不够"
                });
                return;
            }

            var szSql = "select count(userid) as icount from tb_joinclubs where clubid = $1, userid = $2";
            db.QuerySQL(szSql, [pReqArgs.iClubId, pReqArgs.iUserId], function (pRows) {
                if (pRows[0].icount == 0) {
                    socket.emit("delclubuser_result", {
                        wErrCode: ErrorCodes.ERR_USERISNOTEXISTS,
                        szErrMsg: "该用户不在此俱乐部"
                    });
                    return;
                }

                szSql = "delete from tb_joinclubs where userid = $1 and clubid = $2";
                db.DeleteSQL(szSql, [pReqArgs.iUserId, pReqArgs.iClubId], function (iCount) {
                    if (iCount == 1) {
                        socket.emit("delclubuser_result", {
                            wErrCode: ErrorCodes.ERR_NOERROR,
                            szErrMsg: "操作成功",
                        });
                    }
                    else {
                        socket.emit("delclubuser_result", {
                            wErrCode: ErrorCodes.ERR_DBUPDATEFALIED,
                            szErrMsg: "退出俱乐部失败",
                        });
                    }
                });
            });
        });

        // 获取加入的俱乐部列表
        socket.on("getjoingclubs", async function (data) {
            if (!CheckSocketUser(socket, "getjoingclubs")) return;

            var pfnGetClubsInfo = async function (pItems, pClubIds, iIndex, callback) {
                if (iIndex >= pClubIds.length) {
                    callback();
                    return;
                }

                var pClubInfo = await GetClubInfo(socket.iUserId, pClubIds[iIndex]);
                if (pClubInfo != null) pItems.push(pClubInfo);

                pfnGetClubsInfo(pItems, pClubIds, iIndex + 1, callback);
            }

            db.QuerySQL("select * from tb_joinclubs where status = 1 and userid = $1", [socket.iUserId], async function (pRows) {
                var pClubIds = [];
                for (var iIndex = 0; iIndex < pRows.length; ++iIndex) {
                    var pRow = pRows[iIndex];
                    pClubIds.push(pRow.clubid);
                }

                var pItems = [];
                pfnGetClubsInfo(pItems, pClubIds, 0, function () {
                    socket.emit("getjoingclubs_result",
                        {
                            wErrCode: ErrorCodes.ERR_NOERROR,
                            szErrMsg: "操作成功",
                            pClubObjs: pItems
                        });
                });
            });
        });

        // 获取可以进入的房间列表
        socket.on("getlinkrooms", async function (data) {
            var pReqArgs = CheckReqArgs(socket, "getlinkrooms", data);
            if (pReqArgs == null) return;
            if (!CheckSocketUser(socket, "getlinkrooms")) return;

            var pRetObj = await GetRoomListByUserId(socket.iUserId);
            socket.emit("getlinkrooms_result", pRetObj);
        });

        // 俱乐部金币投放
        socket.on("gclubglaunch", function (data) {
            var pReqArgs = CheckReqArgs(socket, "gclubglaunch", data);
            if (pReqArgs == null) return;
            if (!CheckSocketUser(socket, "gclubglaunch")) return;

            db.get_user_info(socket.iUserId, function (pInfo) {
                if (pInfo == null) {
                    socket.emit("gclubglaunch_result",
                        {
                            wErrCode: ErrorCodes.ERR_USERISNOTEXISTS,
                            szErrMsg: "用户不存在"
                        });
                    return;
                }

                if ((pReqArgs.iGolds <= 0) || (pReqArgs.iGolds > pInfo.golds)) {
                    socket.emit("gclubglaunch_result",
                        {
                            wErrCode: ErrorCodes.ERR_NOTENOUGHGOLDS,
                            szErrMsg: "金币不够"
                        });
                    return;
                }

                db.get_club_info(pReqArgs.iClubId, function (pClubInfo) {
                    if (pClubInfo == null) {
                        socket.emit("gclubglaunch_result",
                            {
                                wErrCode: ErrorCodes.ERR_CLUBISNOTEXISTS,
                                szErrMsg: "俱乐部不存在"
                            });
                        return;
                    }

                    db.add_user_golds(socket.iUserId, -pReqArgs.iGolds, function (bRet) {
                        if (!bRet) {
                            socket.emit("gclubglaunch_result",
                                {
                                    wErrCode: ErrorCodes.ERR_DBUPDATEFALIED,
                                    szErrMsg: "金币投放失败"
                                });
                            return;
                        }

                        // 更新活跃度
                        var szSql = "update tb_clubs set activity = activity + " + pReqArgs.iGolds + " where clubid = " + pReqArgs.iClubId;
                        db.ExeSQL(szSql, function (bRet) {
                            if (!bRet) {
                                db.add_user_golds(socket.iUserId, pReqArgs.iGolds, null); // 返反金币
                                socket.emit("gclubglaunch_result",
                                    {
                                        wErrCode: ErrorCodes.ERR_DBUPDATEFALIED,
                                        szErrMsg: "金币投放失败"
                                    });
                                return;
                            }

                            var szSql = "insert into tb_clubs_glaunch (clubid, activity, golds, userid) values({0}, {1}, {2}, {3})";
                            szSql = szSql.format(pReqArgs.iClubId, pClubInfo.activity, pReqArgs.iGolds, socket.iUserId);
                            db.InsertSQL(szSql, null, null); // 写入日志信息

                            socket.emit("gclubglaunch_result",
                                {
                                    wErrCode: ErrorCodes.ERR_NOERROR,
                                    szErrMsg: "操作成功"
                                });
                        });
                    });
                });
            });
        });

        // 创建房间
        socket.on("createroom", async function (data) {
            var pReqArgs = CheckReqArgs(socket, "createroom", data);
            if (pReqArgs == null) return;
            if (!CheckSocketUser(socket, "createroom")) return;

            var pGServerInfo = GetFilterGServer();
            if (pGServerInfo == null) {
                socket.emit("createroom_result", {
                    wErrCode: ErrorCodes.ERR_GAMESERVERNOTRUN,
                    szErrMsg: "游戏服务器未启动"
                });
                return;
            }

            pReqArgs.IP = pGServerInfo.IP;
            pReqArgs.PORT = pGServerInfo.PORT;
            var pRoomInfo = await GEvents.CreateRoom(pReqArgs, socket);
            //Gian 疑问,已经分配了服务器了, 为什么这块发送消息是发给随机游戏服务器的???
            //可能是修改的是全局变量, 合理性有待确认
            if (pRoomInfo != null) AllocRoomGServer(pRoomInfo);
        });

        // 查询用户个人游戏统计信息
        socket.on("getuserginfo", function (data) {
            var pReqArgs = CheckReqArgs(socket, "getuserginfo", data);
            if (pReqArgs == null) return;
            if (!CheckSocketUser(socket, "getuserginfo")) return;

            db.get_user_info(socket.iUserId, function (pUserInfo) {
                var pGameInfo = db.get_user_extdata(pUserInfo);
                if (pGameInfo.iTotalDR == 0) {
                    pGameInfo.iTanPaiLv = 0;
                    pGameInfo.iTanPaiSLv = 0;
                }

                pGameInfo.wErrCode = ErrorCodes.ERR_NOERROR;
                pGameInfo.szErrMsg = "操作成功";

                socket.emit("getuserginfo_result", pGameInfo);
            });
        });

        // 查询房间信息
        socket.on("getroominfo", function (data) {
            var pReqArgs = CheckReqArgs(socket, "getroominfo", data);
            if (pReqArgs == null) return;
            if (!CheckSocketUser(socket, "getroominfo")) return;

            db.get_room_info(pReqArgs.iRoomId, function (pRow) {
                if (pRow == null) {
                    socket.emit("getroominfo_result",
                        {
                            wErrCode: ErrorCodes.ERR_ROOMISNOTEXISTS,
                            szErrMsg: "房间不存在"
                        });
                    return;
                }

                if (!pRow.valid) {
                    socket.emit("getroominfo_result",
                        {
                            wErrCode: ErrorCodes.ERR_ROOMISNOTEXISTS,
                            szErrMsg: "房间不存在"
                        });
                    return;
                }

                var pPlayers = SysUtils.GetJsonObj(pRow.players);
                var iPlayerCount = 0;
                if (pPlayers != null) iPlayerCount = pPlayers.iCount;

                var pRetObj = {
                    wErrCode: ErrorCodes.ERR_NOERROR,
                    szErrMsg: "操作成功",

                    iCreator: pRow.creator, // 创建者
                    iClubId: pRow.clubid,   // 所属俱乐部
                    iGameId: pRow.gameid,   // 游戏ID
                    iRoomId: pRow.roomid,   // 房间ID
                    szRoomUUID: pRow.uuid,  // 房间唯一ID
                    pRoomArgs: SysUtils.GetJsonObj(pRow.roomargs),  // 游戏规则
                    iPlayerCount: iPlayerCount, // 房间当前人数
                    tmCreateTime: pRow.ctime,   // 创建时间
                    iTimes: pRow.iTimes,        // 房间生于时长(分)
                }
                socket.emit("getroominfo_result", pRetObj);
            });
        });

        //获取权限
        socket.on('getprivileges', async function (data) {
            var pReqArgs = CheckReqArgs(socket, "getprivileges", data);
            if (pReqArgs == null) return;
            if (!CheckSocketUser(socket, "getprivileges")) return;

            var pRetObj = {
                wErrCode: ErrorCodes.ERR_NOERROR,
                szErrMsg: "操作成功",
                iClubId: pReqArgs.iClubId,
                szClubName: "",
                clublevel: 2,
                alliancelevel: 2,
                allianceid: 0,
                alliancename: ''
            }
            var sql = 'select tb_clubs.sname,tb_clubs.allianceid,tb_clubs.alliancename ,\
                        tb_joinclubs.clublevel,tb_joinclubs.alliancelevel from tb_joinclubs \
                       inner join tb_clubs on tb_clubs.clubid = tb_joinclubs.clubid \
                       where tb_joinclubs.clubid = $1 and tb_joinclubs.userid = $2';
            var pClubObj = await dbCC.query(sql, [pReqArgs.iClubId, this.iUserId]);
            if (pClubObj.rows.length > 0) {
                pRetObj.szClubName = pClubObj.rows[0].sname;
                pRetObj.clublevel = pClubObj.rows[0].clublevel;
                pRetObj.alliancelevel = pClubObj.rows[0].alliancelevel;
                pRetObj.allianceid = pClubObj.rows[0].allianceid;
                pRetObj.alliancename = pClubObj.rows[0].alliancename || '';
            }
            socket.emit("getprivileges_result", pRetObj);
        });

        // 获取俱乐部房间列表
        socket.on("getclubrooms", async function (data) {
            var pReqArgs = CheckReqArgs(socket, "getclubrooms", data);
            if (pReqArgs == null) return;
            if (!CheckSocketUser(socket, "getclubrooms")) return;

            //var pRet = await GetClubRoomList(pReqArgs.iClubId);
            var pRetObj = {
                wErrCode: ErrorCodes.ERR_NOERROR,
                szErrMsg: "操作成功",
                iClubId: pReqArgs.iClubId,
                szClubName: "",
                clublevel: 2,
                alliancelevel: 2,
                allianceid: 0,
                alliancename: '',
                pRooms: []//pRet.pRooms
            }
            var sql = 'select tb_clubs.sname, tb_clubs.levels, tb_clubs.allianceid,tb_clubs.alliancename ,\
                        tb_joinclubs.clublevel,tb_joinclubs.alliancelevel from tb_joinclubs \
                       inner join tb_clubs on tb_clubs.clubid = tb_joinclubs.clubid \
                       where tb_joinclubs.clubid = $1 and tb_joinclubs.userid = $2 and tb_joinclubs.status = 1';
            var pClubObj = await dbCC.query(sql, [pReqArgs.iClubId, this.iUserId]);
            if (pClubObj.rows.length > 0) {
                pRetObj.szClubName = pClubObj.rows[0].sname;
                pRetObj.clublevel = pClubObj.rows[0].clublevel;
                pRetObj.levels = pClubObj.rows[0].levels;
                pRetObj.alliancelevel = pClubObj.rows[0].alliancelevel;
                pRetObj.allianceid = pClubObj.rows[0].allianceid;
                pRetObj.alliancename = pClubObj.rows[0].alliancename || '';
                var pRet = await GetRoomListByClubId(pReqArgs.iClubId);
                pRetObj.pRooms = pRet.pRooms;
            }

            socket.emit("getclubrooms_result", pRetObj);
        });

        // 设置俱乐部成员备注信息
        socket.on("chgcumemo", async function (data) {
            var pReqArgs = CheckReqArgs(socket, "chgcumemo", data);
            if (pReqArgs == null) return;
            if (!CheckSocketUser(socket, "chgcumemo")) return;

            var pClubInfo = await GetClubInfo(socket.iUserId, pReqArgs.iClubId);
            if (pClubInfo == null) {
                socket.emit("chgcumemo_result", {
                    wErrCode: ErrorCodes.ERR_CLUBISNOTEXISTS,
                    szErrMsg: "俱乐部不存在"
                });
                return;
            }

            if (!pClubInfo.bIsAdmin) {
                socket.emit("chgcumemo_result", {
                    wErrCode: ErrorCodes.ERR_ERRORAUTHORITY,
                    szErrMsg: "权限不够"
                });
                return;
            }

            var szSql = "select count(userid) as icount from tb_joinclubs where clubid = $1, userid = $2";
            db.QuerySQL(szSql, [pReqArgs.iClubId, pReqArgs.iUserId], function (pRows) {
                if (pRows[0].icount == 0) {
                    socket.emit("chgcumemo_result", {
                        wErrCode: ErrorCodes.ERR_USERISNOTEXISTS,
                        szErrMsg: "该用户不在此俱乐部"
                    });
                    return;
                }

                db.change_clubuserminfo(pReqArgs.iClubId, pReqArgs.iUserId, pReqArgs.szDesc, function (iCount) {
                    if (iCount == 1) {
                        socket.emit("chgcumemo_result", {
                            wErrCode: ErrorCodes.ERR_NOERROR,
                            szErrMsg: "操作成功"
                        });
                    }
                    else {
                        socket.emit("chgcumemo_result", {
                            wErrCode: ErrorCodes.ERR_DBUPDATEFALIED,
                            szErrMsg: "修改用户备注信息失败"
                        });
                    }
                });
            });
        });

        // 获取系统公告
        socket.on("getsysnotice", function (data) {
            db.QuerySQL("select * from tb_sysnotice", null, function (pRows) {
                var pItems = [];
                for (var iIndex = 0; iIndex < pRows.length; ++iIndex) {
                    var pRow = pRows[iIndex];
                    var pItem = {
                        iUid: pRow.uid,
                        szUrl: pRow.imgurl,
                        tmCreate: pRow.ctime
                    }

                    pItems.push(pItem);
                }

                var pRetObj = {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "参数错误",
                    pItems: pItems
                }
                socket.emit("getsysnotice_result", pRetObj);
            });
        });

        // 退出游戏
        socket.on("leave", function (data) {
            if (socket.iUserId != null) {
                pGameMgr.OnLeaveRoom({ iUserId: socket.iUserId });
            }
        });

        // 查询当前所在游戏信息
        socket.on("getginfo", function (data) {
        });

        // 玩家查询战绩
        socket.on("getmyzjlogs", async function (data) {
            var pReqArgs = CheckReqArgs(socket, "getmyzjlogs", data);
            if (pReqArgs == null) return;
            if (!CheckSocketUser(socket, "getmyzjlogs")) return;

            var pRetObjs = await GLogs.GetAdminClubByUserId(socket.iUserId);
            socket.emit("getmyzjlogs_result", {
                wErrCode: ErrorCodes.ERR_NOERROR,
                szErrMsg: "操作成功",
                pRetObjs: pRetObjs
            });
        });

        // 查询牌局回顾
        socket.on("getpjlogs", async function (data) {
            var pReqArgs = CheckReqArgs(socket, "getpjlogs", data);
            if (pReqArgs == null) return;
            if (!CheckSocketUser(socket, "getpjlogs")) return;

            pReqArgs.iPlayTimes = parseInt(pReqArgs.iPlayTimes);
            NotifyPaiJuLogs(socket, pReqArgs.szRoomUUID, pReqArgs.iPlayTimes);
        });

        // 获取指定房间结算信息
        socket.on("getroomzjlogs", async function (data) {
            var pReqArgs = CheckReqArgs(socket, "getroomzjlogs", data);
            if (pReqArgs == null) return;
            if (!CheckSocketUser(socket, "getroomzjlogs")) return;

            var pRetObjs = await GLogs.QueryJieSuanLogsByRoomUUID(pReqArgs.szRoomUUID);
            socket.emit("getroomzjlogs_result", {
                wErrCode: ErrorCodes.ERR_NOERROR,
                szErrMsg: "操作成功",
                pRetObjs: pRetObjs
            });
        });

        // 获取申请上分的用户
        socket.on("getaddjfusers", async function (data) {
            var pReqArgs = CheckReqArgs(socket, "getaddjfusers", data);
            if (pReqArgs == null) return;
            if (!CheckSocketUser(socket, "getaddjfusers")) return;

            var iRoomId = parseInt(pReqArgs.iRoomId);
            var pRetObj = await GetAddJiFenReqs(socket.iUserId, iRoomId);

            // GetAddJiFenReqs(socket.iUserId, iRoomId, function (pRetObj) {
            socket.emit("getaddjfusers_result", {
                wErrCode: ErrorCodes.ERR_NOERROR,
                szErrMsg: "操作成功",
                pRetObjs: pRetObj
            });
            await dbCC.query("update tb_clubrooms_msg set msgmode = 0 where userid = $1", [socket.iUserId]);
            // });
        });

        // 同意或拒绝玩家上分
        socket.on("addjifenrep", async function (data) {
            var pReqArgs = CheckReqArgs(socket, "addjifenrep", data);
            if (pReqArgs == null) return;
            if (!CheckSocketUser(socket, "addjifenrep")) return;

            var pCmdArgs = {
                iCmdId: CmdIds.CMD_ADDJIFEN_REP,  // 添加用户积分
                //pData: {
                iUid: pReqArgs.iUid,              // 数据表记录ID
                bAgree: pReqArgs.iMode,            // 0:拒绝, 1:同意
                iFromUser: socket.iUserId,
                iDestUser: pReqArgs.iUserId,
                iFromClub: pReqArgs.iClubId,
                iRoomId: pReqArgs.iRoomId,
                szRoomUUID: pReqArgs.szRoomUUID,
                iJiFen: pReqArgs.iJiFen,
                //}
            };
            pCmdArgs.iJiFen = parseInt(pCmdArgs.iJiFen);

            // 获取指定用户是否是指定俱乐部的 VIP
            var IsClubVIP = async function (iUserId, iClubId) {
                var pRes = await dbCC.query("select isvip from tb_joinclubs where userid = $1 and clubid = $2", [iUserId, iClubId]);
                if (pRes.rows.length == 0) return false;
                return (pRes.rows[0].isvip > 0);
            }

            var bClubVIP = await IsClubVIP(pCmdArgs.iDestUser, pCmdArgs.iFromClub);
            if (bClubVIP) {
                var iGolds = await dbLGQ.get_club_golds(pCmdArgs.iFromClub);
                iGolds = parseInt(iGolds);
                if (iGolds < pCmdArgs.iJiFen) {
                    console.log("addjifenrep 俱乐部基金不够");
                    socket.emit("golds_noten_result", {
                        ErrCode: ErrorCodes.ERR_NOTENOUGHGOLDS,
                        szErrMsg: "俱乐部基金不够"
                    });
                }
            }
            else {
                var pDestUser = await dbLGQ.get_user_info(pCmdArgs.iDestUser);
                pDestUser.golds = parseInt(pDestUser.golds);
                if (pDestUser.golds < pCmdArgs.iJiFen) {
                    console.log("addjifenrep 玩家金币不够");
                    await dbCC.query("delete from tb_addjifenreq where uid = $1", [pCmdArgs.iUid]);
    
                    socket.emit("golds_noten_result", {
                        wErrCode: ErrorCodes.ERR_NOTENOUGHGOLDS,
                        szErrMsg: crypto.fromBase64(pDestUser.alias) + "金币不够",
                    });
                    return;
                }
            }

            console.log("addjifenrep iFromUser:" + socket.iUserId + ", iDestUser:" + pReqArgs.iUserId);
            PostRoomMsg(pReqArgs.szRoomUUID, pCmdArgs, function (pRetObj) {
                socket.emit("addjifenrep_result", pRetObj);
            });
        });

        // 是否开启联盟奖池
        socket.on("openjc", async function (data) {
            var pReqArgs = CheckReqArgs(socket, "openjc", data);
            if (pReqArgs == null) return;
            if (!CheckSocketUser(socket, "openjc")) return;

            var pRes = await dbCC.query("select * from tb_alliance where creator = $1", [socket.iUserId]);
            if (pRes.rows.length == 0) {
                socket.emit("openjc_result", {
                    wErrCode: ErrorCodes.ERR_ERRORAUTHORITY,
                    szErrMsg: "只有联盟创建都才能开启奖池功能"
                });
                return;
            }

            var pUserInfo = await dbLGQ.get_user_info(socket.iUserId);
            if (pUserInfo == null) {
                socket.emit("openjc_result", {
                    wErrCode: ErrorCodes.ERR_USERISNOTEXISTS,
                    szErrMsg: "用户不存在"
                });
                return;
            }
            pUserInfo.gems = parseInt(pUserInfo.gems);

            pReqArgs.iMode = parseInt(pReqArgs.iMode);
            if (pReqArgs.iMode == 0) {
                await dbCC.query("update tb_alliance set jcopen = 0 where creator = $1", [socket.iUserId]);
            }
            else {
                if (pUserInfo.gems < 50000) {
                    socket.emit("openjc_result", {
                        wErrCode: ErrorCodes.ERR_NOTENOUGHGEMS,
                        szErrMsg: "钻石不足"
                    });
                    return;
                }
                pUserInfo.gems -= 50000;

                await dbCC.query("update tb_users set gems = gems - 50000 where userid = $1", [socket.iUserId]);
                await dbCC.query("update tb_alliance set jcopen = 1 where creator = $1", [socket.iUserId]);
            }

            socket.emit("openjc_result", {
                wErrCode: ErrorCodes.ERR_NOERROR,
                szErrMsg: "操作成功",
                iGems: pUserInfo.gems,
                bOpen: (pReqArgs.iMode == 1)
            });
        });

        // 获取9星俱乐部推广
        socket.on("getclubphb", async function (data) {
            //var pReqArgs = CheckReqArgs(socket, "getclubphb", data);
            //if (pReqArgs == null) return;
            if (!CheckSocketUser(socket, "getclubphb")) return;

            var pRetObj = {
                wErrCode: ErrorCodes.ERR_NOERROR,
                szErrMsg: "操作成功",
                pItems: []
            };

            var szSql = 'SELECT * FROM	tb_clubs ORDER BY levels DESC, unums DESC ,unumstime DESC limit 10';
            var pRes = await dbCC.query(szSql);
            for (var iIndex = 0; iIndex < pRes.rows.length; ++iIndex) {
                var pRow = pRes.rows[iIndex];
                var pItem = {
                    iClubId: pRow.clubid,
                    szName: pRow.sname,
                    szDesc: pRow.desc,
                    iCreator: pRow.creator,
                    szCreatorAlias: pRow.alias,
                    iLevels: pRow.levels,
                    szIcoUrl: pRow.icourl,     // 俱乐部图标
                    iTotalNum: pRow.unums,
                    iMaxNum: pLevelNums[pRow.levels],
                    iOnlineNum: pRow.olnums,   // 在线人数
                };

                pRetObj.pItems.push(pItem);
            }
   
   
   
            socket.emit("getclubphb_result", pRetObj);
        });

        socket.on("upimage", async function (data) {
            var pReqArgs = CheckReqArgs(socket, "upimage", data);
            if (pReqArgs == null) return;
            if (!CheckSocketUser(socket, "upimage")) return;

            var sKeyId = "";
            var szFileName = "";

            if (pReqArgs.iMode == 1) {         // 头像
                sKeyId = socket.iUserId.toString();
                szFileName = "headIco" + pReqArgs.szExtName;
            }
            else if (pReqArgs.iMode == 2) {    // 俱乐部头像 只有创建者才能上传
                var pClubInfo = await dbLGQ.get_user_clubinfo(socket.iUserId);
                if (pClubInfo == null) {
                    socket.emit("upimage_result", {
                        wErrCode: ErrorCodes.ERR_INVALIDARGS,
                        szErrMsg: "没有可用的俱乐部"
                    });
                    return;
                }

                sKeyId = pClubInfo.clubid.toString();
                szFileName = "clubico" + pReqArgs.szExtName;
            }
            else {
                socket.emit("upimage_result", {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "参数错误"
                });
                return;
            }

            var pInfo = await dbLGQ.get_user_info(socket.iUserId);
            if (pInfo == null) {
                socket.emit("enter_result", {
                    wErrCode: ErrorCodes.ERR_USERISNOTEXISTS,
                    szErrMsg: "用户不存在"
                });
                return;
            }

            var pBlock = pUserBytesMaps[socket.iUserId];
            if (pBlock == null) {
                pBlock = { iDelTimes: 30 };
                pUserBytesMaps[socket.iUserId] = pBlock;
            }
            pBlock[pReqArgs.index] = {
                iSize: pReqArgs.buffersize,
                pBytes: pReqArgs.pBytes
            };
            console.log("upimage index:" + pReqArgs.index + ", len:" + pReqArgs.buffersize + ", filesize:" + pReqArgs.size);

            var iCount = 0;
            for (var sKey in pBlock) iCount += 1;

            var iBytes = 0;
            for (var iKey = 1; iKey <= iCount; ++iKey) {
                if (pBlock[iKey] == null) break;
                iBytes += pBlock[iKey].iSize;
            }

            if (iBytes != pReqArgs.size) return;

            var pBytes = "";
            for (var iKey = 1; iKey <= iCount; ++iKey) {
                if (pBlock[iKey] == null) break;

                pBytes = pBytes + pBlock[iKey].pBytes;
            }
            delete pUserBytesMaps[socket.iUserId];

            pBytes = new Buffer(pBytes, 'base64');
            SysUtils.CreateUserDirectory(sKeyId, pReqArgs.iMode);
            SysUtils.SaveImageFile(pBytes, sKeyId, pReqArgs.iMode, szFileName, async function (szFileName) {
                var szErrMsg = "";
                if (pReqArgs.iMode == 1) {     // 头像
                    szErrMsg = "修改头像失败";
                }
                else if (pReqArgs.iMode == 2) {   // 俱乐部头像
                    szErrMsg = "修改俱乐部头像失败";
                }

                if (szFileName == null) {
                    socket.emit("upimage_result", {
                        wErrCode: ErrorCodes.ERR_INVOKE_FALIED,
                        szErrMsg: szErrMsg
                    });
                    return;
                }

                if (pReqArgs.iMode == 1) {
                    var szHeadIco = "";
                    if (pInfo.szHeadIco != szHeadIco) {
                        var szUrl = SysUtils.GetUserHeadIco(socket.iUserId);
                        var szSql = "update tb_users set headico = $1 where userid = $2";
                        db.UpdateSQL(szSql, [szUrl, pInfo.userid], function (iCount) {
                            if (iCount == 1) {
                                socket.emit("upimage_result", {
                                    wErrCode: ErrorCodes.ERR_NOERROR,
                                    szErrMsg: "操作成功",
                                    iMode: pReqArgs.iMode,
                                    szUrl: szUrl
                                });
                            }
                            else {
                                socket.emit("upimage_result", {
                                    wErrCode: ErrorCodes.ERR_DBUPDATEFALIED,
                                    szErrMsg: "上传用户头像失败"
                                });
                            }
                        });
                    }
                }
                else if (pReqArgs.iMode == 2) {
                    var szUrl = SysUtils.GetClubIco(sKeyId);
                    var iCount = await dbCC.query("update tb_clubs set icourl = $1 where clubid = $2", [szUrl, pReqArgs.iClubId]);
                    if (iCount == 0) {
                        socket.emit("upimage_result", {
                            wErrCode: ErrorCodes.ERR_DBUPDATEFALIED,
                            szErrMsg: "上传俱乐部头像失败"
                        });
                        return;
                    }

                    socket.emit("upimage_result", {
                        wErrCode: ErrorCodes.ERR_NOERROR,
                        szErrMsg: "操作成功",
                        iMode: pReqArgs.iMode,
                        szUrl: szUrl
                    });
                }
            });
        });

        socket.on("game_ping", function (data) {
            socket.emit('game_pong');
        });

        //升级俱乐部
        socket.on('upgradclub', function (data) {
            var pReqArgs = CheckReqArgs(this, "upgradclub", data);
            if (pReqArgs == null) {
                return console.log('pReqArgs null');
            }
            if (!CheckSocketUser(this, "upgradclub")) {
                return console.log('CheckSocketUser err');
            }
            alliance.upgradclub(this, pReqArgs);
        })
        //创建联盟
        socket.on('createalliance', function (data) {
            var pReqArgs = CheckReqArgs(this, "createalliance", data);
            if (pReqArgs == null) {
                return console.log('pReqArgs null');
            }
            if (!CheckSocketUser(this, "createalliance")) {
                return console.log('CheckSocketUser err');
            }
            alliance.createalliance(this, pReqArgs);
        })
        //解散联盟
        socket.on('dissolvedalliance', async function (data) {
            var pReqArgs = CheckReqArgs(socket, "dissolvedalliance", data);
            if (pReqArgs == null) return;
            if (!CheckSocketUser(socket, "dissolvedalliance")) return;

            var pUserInfo = await dbLGQ.get_user_info(socket.iUserId);
            if (pUserInfo == null) {
                socket.emit("getsmscodejslm_result", {
                    wErrCode: ErrorCodes.ERR_USERISNOTEXISTS,
                    szErrMsg: "用户不存在"
                });
                return;
            }
            pReqArgs.szMobile = pUserInfo.account;

            if (pReqArgs.szMobile.length != 11) {
                socket.emit("getsmscodejslm_result", {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "无效手机号"
                });
                return;
            }

            var pInfo = SMS_MAPS[pReqArgs.szMobile];
            if (pInfo == null) {
                socket.emit("dissolvedalliance_result", {
                    wErrCode: ErrorCodes.ERR_INVOKE_FALIED,
                    szErrMsg: "验证码超时"
                });
                return;
            }

            if (pInfo.szCode != pReqArgs.szCode) {
                socket.emit("dissolvedalliance_result", {
                    wErrCode: ErrorCodes.ERR_INVOKE_FALIED,
                    szErrMsg: "验证码错误"
                });
                return;
            }
            delete SMS_MAPS[pReqArgs.szMobile];

            alliance.dissolvedalliance(this);
        })
        //开启或禁止申请加入联盟
        socket.on('allowapply', function (data) {
            var pReqArgs = CheckReqArgs(this, "allowapply", data);
            if (pReqArgs == null) {
                return console.log('pReqArgs null');
            }
            if (!CheckSocketUser(this, "allowapply")) {
                return console.log('CheckSocketUser err');
            }
            alliance.allowapply(this, pReqArgs);
        })
        //获取联盟信息
        socket.on('getallianceinfo', function (data) {
            var pReqArgs = CheckReqArgs(this, "getallianceinfo", data);
            if (pReqArgs == null) {
                return console.log('pReqArgs null');
            }
            if (!CheckSocketUser(this, "getallianceinfo")) {
                return console.log('CheckSocketUser err');
            }
            alliance.getallianceinfo(this, pReqArgs);
        });
        //获取联盟成员
        socket.on('getalliancemember', function (data) {
            var pReqArgs = CheckReqArgs(this, "getalliancemember", data);
            if (pReqArgs == null) {
                return console.log('pReqArgs null');
            }
            if (!CheckSocketUser(this, "getalliancemember")) {
                return console.log('CheckSocketUser err');
            }
            alliance.getalliancemember(this, pReqArgs);
        });
        //批准加入联盟
        socket.on('approvealliance', function (data) {
            var pReqArgs = CheckReqArgs(this, "approvealliance", data);
            if (pReqArgs == null) {
                return console.log('pReqArgs null');
            }
            if (!CheckSocketUser(this, "approvealliance")) {
                return console.log('CheckSocketUser err');
            }
            alliance.approvealliance(this, pReqArgs);
        });
        //拒绝加入联盟
        socket.on('refusedalliance', function (data) {
            var pReqArgs = CheckReqArgs(this, "refusedalliance", data);
            if (pReqArgs == null) {
                return console.log('pReqArgs null');
            }
            if (!CheckSocketUser(this, "refusedalliance")) {
                return console.log('CheckSocketUser err');
            }
            alliance.refusedalliance(this, pReqArgs);
        });
        //申请加入联盟
        socket.on('applyalliance', function (data) {
            var pReqArgs = CheckReqArgs(this, "applyalliance", data);
            if (pReqArgs == null) {
                return console.log('pReqArgs null');
            }
            if (!CheckSocketUser(this, "applyalliance")) {
                return console.log('CheckSocketUser err');
            }
            alliance.applyalliance(this, pReqArgs);
        });
        // socket.on('getapplyrecorder' ,function(data){
        //     var pReqArgs = CheckReqArgs(socket, "getapplyrecorder", data);
        //     if (pReqArgs == null) return;
        //     alliance.getapplyrecorder(this, pReqArgs);
        // });
        //设置管理员
        socket.on('setallianceadmin', function (data) {
            var pReqArgs = CheckReqArgs(this, "setallianceadmin", data);
            if (pReqArgs == null) {
                return console.log('pReqArgs null');
            }
            if (!CheckSocketUser(this, "setallianceadmin")) {
                return console.log('CheckSocketUser err');
            }
            alliance.setallianceadmin(this, pReqArgs);
        });
        //退出联盟
        socket.on('exitalliance', function (data) {
            var pReqArgs = CheckReqArgs(this, "exitalliance", data);
            if (pReqArgs == null) {
                return console.log('pReqArgs null');
            }
            if (!CheckSocketUser(this, "exitalliance")) {
                return console.log('CheckSocketUser err');
            }
            alliance.exitalliance(this, pReqArgs);
        });
        //踢出联盟
        socket.on('kickalliance', function (data) {
            var pReqArgs = CheckReqArgs(this, "kickalliance", data);
            if (pReqArgs == null) {
                return console.log('pReqArgs null');
            }
            if (!CheckSocketUser(this, "kickalliance")) {
                return console.log('CheckSocketUser err');
            }
            alliance.kickalliance(this, pReqArgs);
        });
        //升级联盟
        socket.on('upgradalliance', function (data) {
            var pReqArgs = CheckReqArgs(this, "upgradalliance", data);
            if (pReqArgs == null) {
                return console.log('pReqArgs null');
            }
            if (!CheckSocketUser(this, "upgradalliance")) {
                return console.log('CheckSocketUser err');
            }
            alliance.upgradalliance(this, pReqArgs);
        });
        //获取加入消息
        socket.on('joinmsg', function (data) {
            var pReqArgs = CheckReqArgs(this, "joinmsg", data);
            if (pReqArgs == null) {
                return console.log('pReqArgs null');
            }
            if (!CheckSocketUser(this, "joinmsg")) {
                return console.log('CheckSocketUser err');
            }
            alliance.joinmsg(this, pReqArgs);
        });

        socket.on('joinclub', function (data) {
            var pReqArgs = CheckReqArgs(this, "joinclub", data);
            if (pReqArgs == null) {
                return console.log('pReqArgs null');
            }
            if (!CheckSocketUser(this, "joinclub")) {
                return console.log('CheckSocketUser err');
            }

            console.log("joinclub iUserId:" + socket.iUserId + ", iClubId:" + pReqArgs.iClubId);
            club.joinclub(this, pReqArgs);
        });

        socket.on('approveclub', function (data) {
            var pReqArgs = CheckReqArgs(this, "approveclub", data);
            if (pReqArgs == null) return;
            if (!CheckSocketUser(this, "approveclub")) return;
            club.approveclub(this, pReqArgs);
        });

        socket.on('refuseclub', function (data) {
            var pReqArgs = CheckReqArgs(this, "refuseclub", data);
            if (pReqArgs == null) return;
            if (!CheckSocketUser(this, "refuseclub")) return;
            club.refuseclub(this, pReqArgs);
        });

        // 获取俱乐部成员
        socket.on("getclubusers", function (data) {
            var pReqArgs = CheckReqArgs(this, "getclubusers", data);
            if (pReqArgs == null) return;
            if (!CheckSocketUser(this, "getclubusers")) return;
            club.getclubusers(this, pReqArgs);
        });

        socket.on("setclubadmin", function (data) {
            var pReqArgs = CheckReqArgs(this, "setclubadmin", data);
            if (pReqArgs == null) return;
            if (!CheckSocketUser(this, "setclubadmin")) return;
            club.setclubadmin(this, pReqArgs);
        });

        socket.on("setalliancememo", function (data) {
            var pReqArgs = CheckReqArgs(this, "setalliancememo", data);
            if (pReqArgs == null) return;
            if (!CheckSocketUser(this, "setalliancememo")) return;
            alliance.setalliancememo(this, pReqArgs);
        });

        socket.on("kickclub", function (data) {
            var pReqArgs = CheckReqArgs(this, "kickclub", data);
            if (pReqArgs == null) return;
            if (!CheckSocketUser(this, "kickclub")) return;
            club.kickclub(this, pReqArgs);
        });

        socket.on('updateclubusermemo', function (data) {
            var pReqArgs = CheckReqArgs(this, "updateclubusermemo", data);
            if (pReqArgs == null) return;
            if (!CheckSocketUser(this, "updateclubusermemo")) return;
            club.updateclubusermemo(this, pReqArgs);
        });

        socket.on('rechargegold', function (data) {
            var pReqArgs = CheckReqArgs(this, "rechargegold", data);
            if (pReqArgs == null) return;
            if (!CheckSocketUser(this, "rechargegold")) return;
            club.rechargegold(this, pReqArgs);
        });

        socket.on('issuegold', function (data) {
            var pReqArgs = CheckReqArgs(this, "issuegold", data);
            if (pReqArgs == null) return;
            if (!CheckSocketUser(this, "issuegold")) return;
            club.issuegold(this, pReqArgs);
        });

        socket.on('issuegoldlist', function (data) {
            var pReqArgs = CheckReqArgs(this, "issuegoldlist", data);
            if (pReqArgs == null) return;
            if (!CheckSocketUser(socket, "issuegoldlist")) return;
            club.issuegoldlist(this, pReqArgs);
        });

        socket.on('dairulist', function (data) {
            var pReqArgs = CheckReqArgs(this, "dairulist", data);
            if (pReqArgs == null) return;
            if (!CheckSocketUser(this, "dairulist")) return;
            club.dairulist(this, pReqArgs);
        });

        socket.on('updateclubmemo', function (data) {
            var pReqArgs = CheckReqArgs(this, "updateclubmemo", data);
            if (pReqArgs == null) return;
            if (!CheckSocketUser(this, "updateclubmemo")) return;
            club.updateclubmemo(this, pReqArgs);
        });

        socket.on('buyvip', function (data) {
            var pReqArgs = CheckReqArgs(this, "buyvip", data);
            if (pReqArgs == null) return;
            if (!CheckSocketUser(this, "buyvip")) return;
            userBLL.buyvip(this, pReqArgs);
        });

        socket.on('mymessage', function (data) {
            var pReqArgs = CheckReqArgs(this, "mymessage", data);
            if (pReqArgs == null) return;
            if (!CheckSocketUser(socket, "mymessage")) return;
            userBLL.mymessage(this, pReqArgs);
        });

        socket.on('delgblub', function (data) {
            var pReqArgs = CheckReqArgs(this, "delgblub", data);
            if (pReqArgs == null) return;
            if (!CheckSocketUser(this, "delgblub")) return;
            club.delgblub(this, pReqArgs);
        });

        socket.on('issuedate', function (data) {
            var pReqArgs = CheckReqArgs(this, "issuedate", data);
            if (pReqArgs == null) return;
            if (!CheckSocketUser(this, "issuedate")) return;
            club.issuedate(this, pReqArgs);
        });

        socket.on('zhanjidate', function (data) {
            var pReqArgs = CheckReqArgs(this, "zhanjidate", data);
            if (pReqArgs == null) return;
            if (!CheckSocketUser(this, "zhanjidate")) return;
            userBLL.zhanjidate(this, pReqArgs);
        });

        socket.on('zhanjilist', function (data) {
            var pReqArgs = CheckReqArgs(this, "zhanjilist", data);
            if (pReqArgs == null) return;
            if (!CheckSocketUser(this, "zhanjilist")) return;
            userBLL.zhanjilist(this, pReqArgs);
        });

        socket.on('alertgolds', function (data) {
            var pReqArgs = CheckReqArgs(this, "alertgolds", data);
            if (pReqArgs == null) return;
            if (!CheckSocketUser(this, "alertgolds")) return;
            club.alertgolds(this, pReqArgs);
        });

        socket.on('alertgoldslist', function (data) {
            var pReqArgs = CheckReqArgs(this, "alertgoldslist", data);
            if (pReqArgs == null) return;
            if (!CheckSocketUser(this, "alertgoldslist")) return;
            club.alertgoldslist(this, pReqArgs);
        });

        socket.on('setvip', function (data) {
            var pReqArgs = CheckReqArgs(this, "setvip", data);
            if (pReqArgs == null) return;
            if (!CheckSocketUser(this, "setvip")) return;
            club.setvip(this, pReqArgs);
        });

        socket.on('issuediamond', function (data) {
            var pReqArgs = CheckReqArgs(this, "issuediamond", data);
            if (pReqArgs == null) return;
            if (!CheckSocketUser(this, "issuediamond")) return;
            club.issuediamond(this, pReqArgs);
        });

        socket.on('issuediamonddate', function (data) {
            var pReqArgs = CheckReqArgs(this, "issuediamonddate", data);
            if (pReqArgs == null) return;
            if (!CheckSocketUser(this, "issuediamonddate")) return;
            club.issuediamonddate(this, pReqArgs);
        });

        socket.on('issuediamondlist', function (data) {
            var pReqArgs = CheckReqArgs(this, "issuediamondlist", data);
            if (pReqArgs == null) return;
            if (!CheckSocketUser(this, "issuediamondlist")) return;
            club.issuediamondlist(this, pReqArgs);
        });

        // 是否启用玩家位置报警
        socket.on("opengps", async function(data) {
            var pReqArgs = CheckReqArgs(this, "issuediamondlist", data);
            if (pReqArgs == null) return;

            var pRes = await dbCC.query("update tb_users set opengps = $1 where account = $2", [pReqArgs.iOpenMode, pReqArgs.szAccount]);
            if (pRes.rowCount == 1) {
                socket.emit("opengps_result", {
                    wErrCode: ErrorCodes.ERR_NOERROR,
                    szErrMsg: "操作成功",
                    szAccount: pReqArgs.szAccount,
                    iOpenMode: pReqArgs.iOpenMode
                });
            }
            else {
                socket.emit("opengps_result", {
                    wErrCode: ErrorCodes.ERR_INVOKE_FALIED,
                    szErrMsg: "操作失败",
                    szAccount: pReqArgs.szAccount,
                    iOpenMode: pReqArgs.iOpenMode
                });
            }
        });

        // 与游戏服务器通信
        socket.on("GSServerRegister", function (pReqArgs) {
            console.log("注册游戏服务器:" + "ID:" + pReqArgs.ID + ", 地址:" + pReqArgs.IP + ":" + pReqArgs.PORT);

            var pGServer = GetGServerItem(pReqArgs.ID);
            if (pGServer != null) {
                socket.emit("OpenRooms", pGServer.ROOMIDS);
            }
            else {
                pGServer = {
                    ID: pReqArgs.ID,
                    IP: pReqArgs.IP,
                    PORT: pReqArgs.PORT,
                    HTTPPORT: pReqArgs.HTTPPORT,
                    GSPORT: pReqArgs.GSPORT,
                    SOCKET: socket,
                    //===================================
                    ROOMCOUNT: parseInt(pReqArgs.ROOMCOUNT),
                    ROOMIDS: pReqArgs.ROOMIDS.concat()
                }
                g_pAppGlobals.pGServerMaps[pReqArgs.ID] = pGServer;
            }
        });
    });

    console.log(pCServer.NAME + " 启动成功, 端口：" + pCServer.PORT);
}

function MainEntry() {
    var pCServer = AppConfigs.center_server();

    try {
        var pConfig = SysUtils.GetAppConfig();
        g_pAppGlobals.iMaxGServer = pConfig.chexuaner.gserver.count;
    }
    catch (err) {
        g_pAppGlobals.iMaxGServer = 1;
    }

    db.init(AppConfigs.database());
    dbCC.init(AppConfigs.database());
    dbLGQ.Init(dbCC);
    GEvents.Init(dbCC, dbLGQ);

    WebSocketService();

    var pServer = app.listen(pCServer.HTTPPORT, function () {
        var host = pServer.address().address;
        var port = pServer.address().port;

        console.log(pCServer);
        console.log("中心 HTTP 服务器启动成功");
    });
}

MainEntry();

// 上传自定义图像
setInterval(async function (pUserBytesMaps) {
    for (var sKey in pUserBytesMaps) {
        var pItem = pUserBytesMaps[sKey];

        pItem.iDelTimes -= 1;
        if (pItem.iDelTimes <= 0) {
            delete pUserBytesMaps[sKey];
            break;
        }
    }

    await dbCC.query("update tb_clubs set levels = 1 where extract(epoch FROM (now() - endtime)) > 0", []);
}, 1000, pUserBytesMaps);

// dbCC.init(AppConfigs.database());

//     alliance.approvealliance({iUserId:638669}, {uid:42});

async function GetRSDNotifyObj(iRoomId, pClubIds) {
    var Result = {
        wErrCode: ErrorCodes.ERR_NOERROR,
        szErrMsg: "操作成功",
        pUserObjs: [],
        pLogs: []
    }

    // 获取俱乐部里面申请上分的玩家
    var pReqObjs = await dbLGQ.get_jifenreq_users_byclubs(pClubIds);
    if (pReqObjs.length == 0) return Result;

    console.log("GetRSDNotifyObj pReqObjs.length:" + pReqObjs.length);
    for (var iIndex = 0; iIndex < pReqObjs.length; ++iIndex) {
        var pItem = pReqObjs[iIndex];
        //if (pClubIds.indexOf(pItem.iFromClub) >= 0) {
        var iMode = 1;
        pItem.iReqJiFen = parseInt(pItem.iReqJiFen);
        pItem.iJiFenSum = parseInt(pItem.iJiFenSum);
        if (pItem.iReqJiFen < pItem.iJiFenSum) iMode = 2;

        //var pClubInfo = await dbLGQ.get_club_info_with_id(pItem.iFromClub);
        var pReqItem = {
            iUid: pItem.iUid,
            iMode: iMode,
            iUserId: pItem.iUserId,
            szAlias: crypto.fromBase64(pItem.szReqUser),
            iClubId: pItem.iFromClub,
            szRoomUUID: pItem.szRoomUUID,
            szRoomName: pItem.szRoomName,
            iRoomId: pItem.iRoomId,
            iMinFenE: pItem.iMinFenE,
            iReqJiFen: pItem.iReqJiFen,
            iAddJiFen: pItem.iAddJiFen,
            iJiFenSum: pItem.iJiFenSum,
            szText: pItem.szText,
            iReqSeatIndex: -1,
            tmReqTime: pItem.tmTime
        };
        Result.pUserObjs.push(pReqItem);
        //}
    }

    return Result;
}

async function GetClubRoomMsgs(pClubIds, iRoomId, iUserId, bIsAdmin) {
    var Result = [];

    var pRes = { rows: [] };
    if (bIsAdmin && (pClubIds.length > 0)) { // 是管理员
        var szWhere = SysUtils.GetWhereStr(pClubIds);
        pRes = await dbCC.query("select * from tb_roommessage where fromclub in " + szWhere + " order by ctime desc", []);
    }
    else {
        pRes = await dbCC.query("select * from tb_roommessage where roomid = $1 and userid = $2 order by ctime desc", [iRoomId, iUserId]);
    }

    for (var iIndex = 0; iIndex < pRes.rows.length; ++iIndex) {
        var pRow = pRes.rows[iIndex];
        var pItem = {
            szClubName: pRow.clubname,
            szRoomName: pRow.roomname,
            iOptMode: pRow.mode,
            iReqUser: pRow.userid,
            szReqAlias: pRow.dstname,
            iOptUser: pRow.optuser,
            szOptAlias: pRow.dstname,
            iJiFen: pRow.jifen,
            tmTime: pRow.ctime,
            szMessage: ""
        };

        if (iUserId == pItem.iReqUser) {
            if (pItem.iOptMode == 0) {
                pItem.szMessage = pItem.szClubName + "的" + pItem.szOptAlias + "拒绝将您的带入申请";
            }
            else {
                pItem.szMessage = pItem.szClubName + "的" + pItem.szOptAlias + "同意将您的带入上限修改为" + pItem.iJiFen;
            }
        }
        else {
            if (pItem.iOptMode == 0) {
                pItem.szMessage = pItem.szClubName + "的" + pItem.szOptAlias + "拒绝将该玩家的带入申请";
            }
            else {
                pItem.szMessage = pItem.szClubName + "的" + pItem.szOptAlias + "同意将该玩家的带入上限修改为" + pItem.iJiFen;
            }
        }

        delete pItem.szClubName;
        delete pItem.iOptMode;
        delete pItem.iReqUser;
        delete pItem.iOptUser;
        delete pItem.szOptAlias;
        delete pItem.iJiFen;

        Result.push(pItem);
    }

    return Result;
}

async function GetAddJiFenReqs(iUserId, iRoomId) {
    var pRes = await dbCC.query("select count(*) from tb_clubrooms_msg where msgmode = 1 and userid = $1", [iUserId]);
    var pReqs = {
        wErrCode: ErrorCodes.ERR_NOERROR,
        szErrMsg: "操作成功",
        iMsgCount: pRes.rows[0].count,
        pUserObjs: [],
        pLogs: []
    };

    var pClubIds = await dbLGQ.get_club_by_adminuser(iUserId); // 获取用户是哪几个俱乐部的管理
    if (pClubIds.length > 0) {  // 是管理员
        pReqs = await GetRSDNotifyObj(iRoomId, pClubIds);
    }
    pReqs.pLogs = await GetClubRoomMsgs(pClubIds, iRoomId, iUserId, pClubIds.length > 0);

    return pReqs;
}

// 用户登录事件
async function OnUserLoginInEvent(pUserObj, pSocket) {
    await dbLGQ.update_last_logintime(pUserObj.iUserId);
    var pClubIds = await dbLGQ.get_club_by_adminuser(pUserObj.iUserId); // 获取用户是哪几个俱乐部的管理
    if (pClubIds.length > 0) {
        var szWhere = SysUtils.GetWhereStr(pClubIds);
        var pRes = await dbCC.query("select clubid, roomid, userid from tb_clubrooms_msg where clubid in " + szWhere + " and msgmode = 1", []);
        if (pRes.rows.length > 0) {
            var pRow = pRes.rows[0];
            pSocket.emit("addjifen_lailao_notify", {
                wErrCode: ErrorCodes.ERR_NOERROR,
                szErrMsg: "操作成功",

                iCmd: 0,
                iFromClub: pRow.clubid,
                iRoomId: pRow.roomid,
                iFromUser: pRow.userid
            });
        }
    }
}


async function getmyzj(iUserId, ymd) {
    let jushu = 0;
    let shoushu = 0;
    let list = [];

    let res = await dbCC.query('select sum(playtimes) as total from tb_myzj_logs where userid = $1', [iUserId]);
    if (res.rows.length > 0) {
        shoushu = res.rows[0].total;
    }
    res = await dbCC.query('SELECT 3 COUNT(roomuuid) as total FROM tb_myzj_logs where userid = $1', [iUserId]);
    if (res.rows.length > 0) {
        jushu = res.rows[0].total;
    }

    if (/^(\d{4})\-(\d{2})\-(\d{2})$/.test(ymd)) {
        let begin = ymd + ' 00:00:00';
        let end = ymd + ' 23:59:59';
        res = await dbCC.query('select roomargs ,jiesuan from tb_myzj_logs where ctime BETWEEN $1 AND $2 order by ctime desc', [begin, end]);
        if (res.rows.length > 0) {
            list = res.rows;
        }
    }
}


function getGroup(data, index = 0, group = []) {
    let need_apply = new Array();
    need_apply.push(data[index]);
    for (var i = 0; i < group.length; i++) {
        need_apply.push(group[i] + data[index]);
    }
    group.push.apply(group, need_apply);

    if (index + 1 >= data.length) return group;
    else return getGroup(data, index + 1, group);
}


function getGroup2(arr, r) {
    let _group = function (arr, index, r) {
        if (undefined == arr[index]) {
            return null;
        }
        let a = arr[index];
        r.push(a);
        for (let i = index + 1; i < arr.length; i++) {
            if (/^[\u4e00-\u9fa5_a-zA-Z0-9]+$/.test(arr[i])) {
                a = a + arr[i];
                r.push(a);
            }
        }
    }
    for (let i = 0; i < arr.length; i++) {
        _group(arr, i, r);
    }
}



// 验证码超时判断
function OnSMSTimerEvent() {
    var tmNow = new Date();
    var pItems = [];

    for (var sKey in SMS_MAPS) {
        var pItem = SMS_MAPS[sKey];
        if (tmNow.getTime() - pItem.tmValue.getTime() >= (1000 * 60 * 5)) { // 5 分钟内有效
            pItems.push(sKey);
        }
    }

    for (var iIndex = 0; iIndex < pItems.length; ++iIndex) {
        var szKey = pItems[iIndex];
        delete SMS_MAPS[szKey]
    }
}

//setInterval(OnSMSTimerEvent, 120 * 1000); // 为了方便测试先注释掉短信验证码超时


// 获取指定俱乐部下面有好多个房间
async function GetClubRoomCount(iClubId) {
    var pfnFindRoomItem = function (pItems, iClubId, iRoomId) {
        var Result = null;
        for (var iIndex = 0; iIndex < pItems.length; ++iIndex) {
            if ((pItems[iIndex].iClubId == iClubId) && (pItems[iIndex].iRoomId == iRoomId)) {
                Result = pItems[iIndex];
                break;
            }
        }

        return Result;
    }

    var szSql = "select count(roomid) from tb_rooms where clubid = $1";
    var pRes = await dbCC.query(szSql, [iClubId]);  // 俱乐部 iClubId 下面的房间数
    var iCount = parseInt(pRes.rows[0].count);

    var iLmId = await dbLGQ.get_club_allid(iClubId);
    if (iLmId == 0) return iCount;


    // 获取可用联盟推送出来的房间
    szSql = "select count(*) from tb_rooms where allid = $1";
    pRes = await dbCC.query(szSql, [iLmId]);
    iCount += parseInt(pRes.rows[0].count);

    return iCount;
}



var pfnFindRoomItem = function (pItems, iClubId, iRoomId) {
    var Result = null;
    for (var iIndex = 0; iIndex < pItems.length; ++iIndex) {
        if ((pItems[iIndex].iClubId == iClubId) && (pItems[iIndex].iRoomId == iRoomId)) {
            Result = pItems[iIndex];
            break;
        }
    }

    return Result;
}

// 获取
// async function GetRoomListByUserId(iUserId) {
//     var pRetObj = {
//         wErrCode: ErrorCodes.ERR_NOERROR,
//         szErrMsg: "操作成功",
//         pRooms: [], // 普通俱乐部房间
//         pLMIds: []  // 联盟ID
//     };

//     // 获取用户加入的俱乐部
//     var pClubObjs = await dbLGQ.get_user_joingclubs(iUserId);
//     if (pClubObjs.length == 0) return pRetObj;

//     // 获取加入的俱乐部创建的房间列表
//     var pLmIds = [];    // 可用联盟ID
//     var pClubIds = [];  // 加入的俱乐部ID
//     for (var iIndex = 0; iIndex < pClubObjs.length; ++iIndex) {
//         var pClubObj = pClubObjs[iIndex];

//         if ((pClubObj.iAllianceId > 0) && (pLmIds.indexOf(pClubObj.iAllianceId) == -1)) pLmIds.push(pClubObj.iAllianceId);
//         if (pClubIds.indexOf(pClubObj.iClubId) == -1) pClubIds.push(pClubObj.iClubId);

//         var szSql = "select (tmlen - times) as a1, * from tb_rooms where clubid = $1 order by clubid, basefen";
//         var pRes = await dbCC.query(szSql, [pClubObj.iClubId]);
//         for (var iPos = 0; iPos < pRes.rows.length; ++iPos) {
//             var pRow = pRes.rows[iPos];

//             if (!pRow.valid) continue;
//             if (pRow.tmlen * 60 <= pRow.times) continue;

//             var pItem = {
//                 iClubId: pClubObj.iClubId,
//                 szClubName: pClubObj.szClubName,

//                 iCreator: pRow.creator, // 创建者
//                 iRoomId: pRow.roomid,   // 房间ID
//                 szRoomUUID: pRow.uuid,  // 房间唯一ID
//                 pRoomArgs: SysUtils.GetJsonObj(pRow.roomargs),  // 游戏规则
//                 iPlayerCount: pRow.usernums,  // 房间当前人数
//                 tmCreateTime: pRow.ctime,    // 创建时间
//                 iTimes: parseInt(pRow.times / 60),          // 房间使用了多少时间时长(分)
//                 iTimeLen: parseInt(pRow.tmlen / 60),        // 房间总时长(分)
//             };
//             pRetObj.pRooms.push(pItem);
//         }
//     }

//     if (pLmIds.length > 0) {
//         // 获取可用联盟推送出来的房间
//         pRetObj.pLMIds = pLmIds.concat();
//         var szWhere = SysUtils.GetWhereStr(pLmIds);
//         var szSql = "select (tmlen - times) as a1, a.sname, b.* from tb_clubs a, tb_rooms b " +
//             " where a.clubid = b.clubid and allid in " + szWhere + " order by b.clubid, basefen, a1";
//         var pRes = await dbCC.query(szSql, null);
//         for (var iPos = 0; iPos < pRes.rows.length; ++iPos) {
//             var pRow = pRes.rows[iPos];

//             var pRoomInfo = pfnFindRoomItem(pRetObj.pRooms, pRow.clubid, pRow.roomid);
//             if (pRoomInfo != null) continue;

//             if (!pRow.valid) continue;
//             if (pRow.tmlen * 60 <= pRow.times) continue;

//             for (var iIndex = 0; iIndex < pClubObjs.length; ++iIndex) {
//                 var pClubObj = pClubObjs[iIndex];
//                 if (pClubObj.iAllianceId != pRow.allid) continue;

//                 var pItem = {
//                     iClubId: pClubObj.iClubId,
//                     szClubName: pClubObj.szClubName,

//                     iCreator: pRow.creator, // 创建者
//                     iRoomId: pRow.roomid,   // 房间ID
//                     szRoomUUID: pRow.uuid,  // 房间唯一ID
//                     pRoomArgs: SysUtils.GetJsonObj(pRow.roomargs),  // 游戏规则
//                     iPlayerCount: pRow.usernums,  // 房间当前人数
//                     tmCreateTime: pRow.ctime,    // 创建时间
//                     iTimes: parseInt(pRow.times / 60),          // 房间使用了多少时间时长(分)
//                     iTimeLen: parseInt(pRow.tmlen / 60),        // 房间总时长(分)
//                 };
//                 pRetObj.pRooms.push(pItem);
//             }
//         }
//     }

//     // 获取之前加入的联盟推送出来的房间
//     for (var iIndex = 0; iIndex < pClubObjs.length; ++iIndex) {
//         var pClubObj = pClubObjs[iIndex];

//         var szSql = "select (tmlen - times) as a1, * from tb_rooms, tb_club_rooms \
//             where tb_club_rooms.clubid = $1 and tb_rooms.allid = tb_club_rooms.allid \
//                 order by tb_club_rooms.clubid, basefen";
//         var pRes = await dbCC.query(szSql, [pClubObj.iClubId]);
//         for (var iPos = 0; iPos < pRes.rows.length; ++iPos) {
//             var pRow = pRes.rows[iPos];

//             var pRoomInfo = pfnFindRoomItem(pRetObj.pRooms, pRow.clubid, pRow.roomid);
//             if (pRoomInfo != null) continue;

//             if (!pRow.valid) continue;
//             if (pRow.tmlen * 60 <= pRow.times) continue;

//             var pItem = {
//                 iClubId: pClubObj.iClubId,
//                 szClubName: pClubObj.szClubName,

//                 iCreator: pRow.creator, // 创建者
//                 iRoomId: pRow.roomid,   // 房间ID
//                 szRoomUUID: pRow.uuid,  // 房间唯一ID
//                 pRoomArgs: SysUtils.GetJsonObj(pRow.roomargs),  // 游戏规则
//                 iPlayerCount: pRow.usernums,  // 房间当前人数
//                 tmCreateTime: pRow.ctime,    // 创建时间
//                 iTimes: parseInt(pRow.times / 60),          // 房间使用了多少时间时长(分)
//                 iTimeLen: parseInt(pRow.tmlen / 60),        // 房间总时长(分)
//             };
//             pRetObj.pRooms.push(pItem);
//         }
//     }

//     return pRetObj;
// }


async function GetRoomListByUserId(iUserId) {
    var pRetObj = {
        wErrCode: ErrorCodes.ERR_NOERROR,
        szErrMsg: "操作成功",
        pRooms: [], // 普通俱乐部房间
        pLMIds: []  // 联盟ID
    };

    let sql = [];
    sql.push('SELECT');
    sql.push('tb1.clubid,');
    sql.push('tb1.allid,');
    sql.push('tb2.roomid,');
    sql.push('tb2.roomuuid,');
    sql.push('tb2.roomargs,');
    sql.push('tb2.players,');
    sql.push('tb2.playtimes,');
    sql.push('tb2.creator,');
    sql.push('tb2.usernums,');
    sql.push('tb2.ctime,');
    sql.push('tb2.times,');
    sql.push('tb2.tmlen,');
    sql.push('tb3.levels,');
    sql.push('tmlen - times as a1,');
    sql.push('CASE WHEN tb5.sname IS NULL THEN tb3.sname ELSE tb5.sname END ,');
    sql.push('row_number() OVER ( PARTITION BY tb2.basefen ,(tmlen - times) )');// ORDER BY (tmlen - times) ASC
    sql.push('FROM tb_club_rooms AS tb1');
    sql.push('INNER JOIN tb_rooms AS tb2 ON tb2.roomid = tb1.roomid');
    sql.push('INNER JOIN tb_clubs AS tb3 ON tb3.clubid = tb1.clubid');
    sql.push('LEFT JOIN tb_alliance AS tb4 ON tb4.allianceid = tb1.allid');
    sql.push('LEFT JOIN tb_clubs AS tb5 ON tb5.clubid = tb4.creatorclubid');
    sql.push('WHERE tb1.clubid in(SELECT clubid FROM tb_joinclubs WHERE tb_joinclubs.userid = $1 and tb_joinclubs.status = 1)');
    sql.push('AND tb1.allid = 0');
    // sql.push('AND tb1.allid not in (SELECT tb_alliance.allianceid FROM tb_joinclubs INNER JOIN tb_alliance ON tb_joinclubs.clubid = tb_alliance.creatorclubid WHERE tb_joinclubs.userid = $1)');

    // console.log(sql.join(' '));
    // console.log(iUserId);

    let res = await dbCC.query(sql.join(' '), [iUserId]);
    for (let i = 0; i < res.rows.length; i++) {
        let pRow = res.rows[i];
        let pItem = {
            iClubId: pRow.clubid,
            szClubName: pRow.sname,
            iClubLevel: pRow.levels,
            iCreator: pRow.creator, // 创建者
            iRoomId: pRow.roomid,   // 房间ID
            szRoomUUID: pRow.roomuuid,  // 房间唯一ID
            pRoomArgs: SysUtils.GetJsonObj(pRow.roomargs),  // 游戏规则
            iPlayerCount: pRow.usernums,  // 房间当前人数
            tmCreateTime: pRow.ctime,    // 创建时间
            iTimes: parseInt(pRow.times / 60),          // 房间使用了多少时间时长(分)
            iTimeLen: parseInt(pRow.tmlen / 60),        // 房间总时长(分)
        };
        pRetObj.pRooms.push(pItem);
    }
    return pRetObj;
}

// async function GetRoomListByClubId(iClubId) {
//     var pRetObj = {
//         wErrCode: ErrorCodes.ERR_NOERROR,
//         szErrMsg: "操作成功",
//         pRooms: [], // 普通俱乐部房间
//         pLMIds: []  // 联盟ID
//     };

//     // 获取用户加入的俱乐部
//     var pClubObj = await dbLGQ.get_club_info_with_id(iClubId);
//     if (pClubObj == null) return pRetObj;

//     // 获取加入的俱乐部创建的房间列表
//     var pLmIds = [];    // 可用联盟ID
//     var pClubIds = [pClubObj.clubid];  // 加入的俱乐部ID
//     if (pClubObj.allianceid > 0) pLmIds.push(pClubObj.allianceid);

//     var szSql = "select (tmlen - times) as a1, * from tb_rooms where clubid = $1 order by clubid, basefen";
//     var pRes = await dbCC.query(szSql, [pClubObj.clubid]);
//     for (var iPos = 0; iPos < pRes.rows.length; ++iPos) {
//         var pRow = pRes.rows[iPos];

//         if (!pRow.valid) continue;
//         if (pRow.tmlen * 60 <= pRow.times) continue;

//         var pItem = {
//             iClubId: pClubObj.clubid,
//             szClubName: pClubObj.sname,

//             iCreator: pRow.creator, // 创建者
//             iRoomId: pRow.roomid,   // 房间ID
//             szRoomUUID: pRow.uuid,  // 房间唯一ID
//             pRoomArgs: SysUtils.GetJsonObj(pRow.roomargs),  // 游戏规则
//             iPlayerCount: pRow.usernums,  // 房间当前人数
//             tmCreateTime: pRow.ctime,    // 创建时间
//             iTimes: parseInt(pRow.times / 60),          // 房间使用了多少时间时长(分)
//             iTimeLen: parseInt(pRow.tmlen / 60),        // 房间总时长(分)
//         };
//         pRetObj.pRooms.push(pItem);
//     }

//     if (pLmIds.length > 0) {
//         // 获取可用联盟推送出来的房间
//         pRetObj.pLMIds = pLmIds.concat();
//         var szWhere = SysUtils.GetWhereStr(pLmIds);
//         var szSql = "select (tmlen - times) as a1, a.sname, b.* from tb_clubs a, tb_rooms b " +
//             " where a.clubid = b.clubid and allid in " + szWhere + " order by b.clubid, basefen, a1";
//         var pRes = await dbCC.query(szSql, null);
//         for (var iPos = 0; iPos < pRes.rows.length; ++iPos) {
//             var pRow = pRes.rows[iPos];

//             var pRoomInfo = pfnFindRoomItem(pRetObj.pRooms, pRow.clubid, pRow.roomid);
//             if (pRoomInfo != null) continue;

//             if (!pRow.valid) continue;
//             if (pRow.tmlen * 60 <= pRow.times) continue;

//             var pItem = {
//                 iClubId: pClubObj.cluid,
//                 szClubName: pClubObj.sname,

//                 iCreator: pRow.creator, // 创建者
//                 iRoomId: pRow.roomid,   // 房间ID
//                 szRoomUUID: pRow.uuid,  // 房间唯一ID
//                 pRoomArgs: SysUtils.GetJsonObj(pRow.roomargs),  // 游戏规则
//                 iPlayerCount: pRow.usernums,  // 房间当前人数
//                 tmCreateTime: pRow.ctime,    // 创建时间
//                 iTimes: parseInt(pRow.times / 60),          // 房间使用了多少时间时长(分)
//                 iTimeLen: parseInt(pRow.tmlen / 60),        // 房间总时长(分)
//             };
//             pRetObj.pRooms.push(pItem);
//         }
//     }

//     // 获取之前加入的联盟推送出来的房间
//     var szSql = "select (tmlen - times) as a1, * from tb_rooms, tb_club_rooms \
//         where tb_club_rooms.clubid = $1 and tb_rooms.allid = tb_club_rooms.allid \
//             order by tb_club_rooms.clubid, basefen";
//     var pRes = await dbCC.query(szSql, [pClubObj.clubid]);
//     for (var iPos = 0; iPos < pRes.rows.length; ++iPos) {
//         var pRow = pRes.rows[iPos];

//         var pRoomInfo = pfnFindRoomItem(pRetObj.pRooms, pRow.clubid, pRow.roomid);
//         if (pRoomInfo != null) continue;

//         if (!pRow.valid) continue;
//         if (pRow.tmlen * 60 <= pRow.times) continue;

//         var pItem = {
//             iClubId: pClubObj.clubid,
//             szClubName: pClubObj.sname,

//             iCreator: pRow.creator, // 创建者
//             iRoomId: pRow.roomid,   // 房间ID
//             szRoomUUID: pRow.uuid,  // 房间唯一ID
//             pRoomArgs: SysUtils.GetJsonObj(pRow.roomargs),  // 游戏规则
//             iPlayerCount: pRow.usernums,  // 房间当前人数
//             tmCreateTime: pRow.ctime,    // 创建时间
//             iTimes: parseInt(pRow.times / 60),          // 房间使用了多少时间时长(分)
//             iTimeLen: parseInt(pRow.tmlen / 60),        // 房间总时长(分)
//         };
//         pRetObj.pRooms.push(pItem);
//     }

//     return pRetObj;
// }

async function GetRoomListByClubId(iClubId) {
    var pRetObj = {
        wErrCode: ErrorCodes.ERR_NOERROR,
        szErrMsg: "操作成功",
        pRooms: [], // 普通俱乐部房间
        pLMIds: []  // 联盟ID
    };

    let sql = [];
    sql.push('SELECT');
    sql.push('tb1.clubid,');
    sql.push('tb1.allid,');
    sql.push('tb2.roomid,');
    sql.push('tb2.roomuuid,');
    sql.push('tb2.roomargs,');
    sql.push('tb2.players,');
    sql.push('tb2.playtimes,');
    sql.push('tb2.creator,');
    sql.push('tb2.usernums,');
    sql.push('tb2.ctime,');
    sql.push('tb2.times,');
    sql.push('tb2.tmlen,');
    sql.push('tb3.levels,');
    sql.push('CASE WHEN tb5.sname IS NULL THEN tb3.sname ELSE tb5.sname END,');
    sql.push('row_number() OVER ( PARTITION BY tb2.basefen ,(tmlen - times) )');// ORDER BY (tmlen - times) ASC
    sql.push('FROM tb_club_rooms AS tb1');
    sql.push('INNER JOIN tb_rooms AS tb2 ON tb2.roomid = tb1.roomid');
    sql.push('INNER JOIN tb_clubs AS tb3 ON tb3.clubid = tb1.clubid');
    sql.push('LEFT JOIN tb_alliance AS tb4 ON tb4.allianceid = tb1.allid');
    sql.push('LEFT JOIN tb_clubs AS tb5 ON tb5.clubid = tb4.creatorclubid');
    sql.push('WHERE tb1.clubid = $1');
    sql.push('AND tb1.allid = 0');
    // sql.push('AND tb1.allid not in (SELECT tb_alliance.allianceid FROM tb_joinclubs INNER JOIN tb_alliance ON tb_joinclubs.clubid = tb_alliance.creatorclubid WHERE tb_joinclubs.userid = $1)');

    let res = await dbCC.query(sql.join(' '), [iClubId]);
    for (let i = 0; i < res.rows.length; i++) {
        let pRow = res.rows[i];
        let pItem = {
            iClubId: pRow.clubid,
            szClubName: pRow.sname,
            iClubLevel: pRow.levels,
            iCreator: pRow.creator, // 创建者
            iRoomId: pRow.roomid,   // 房间ID
            szRoomUUID: pRow.roomuuid,  // 房间唯一ID
            pRoomArgs: SysUtils.GetJsonObj(pRow.roomargs),  // 游戏规则
            iPlayerCount: pRow.usernums,  // 房间当前人数
            tmCreateTime: pRow.ctime,    // 创建时间
            iTimes: parseInt(pRow.times / 60),          // 房间使用了多少时间时长(分)
            iTimeLen: parseInt(pRow.tmlen / 60),        // 房间总时长(分)
        };
        pRetObj.pRooms.push(pItem);
    }

    return pRetObj;
}


// 查询牌局记录
async function NotifyPaiJuLogs(pSocket, szRoomUUID, iPlayTimes) {
    var Result = {
        wErrCode: ErrorCodes.ERR_NOERROR,
        szErrMsg: "操作成功",
        iCount: 0,
        pData: null,
    };

    var pRes = await dbCC.query("select count(uid) from tb_paijuhuigu_logs where roomuuid = $1", [szRoomUUID]);
    Result.iCount = pRes.rows[0].count;
    if (Result.iCount == 0) {
        pSocket.emit("getpjlogs_result", Result);
        return;
    }

    if (iPlayTimes == -1) {
        var szSql = "select * from tb_paijuhuigu_logs where roomuuid = $1 order by playtimes desc limit 1";
        pRes = await dbCC.query(szSql, [szRoomUUID]);
        if (pRes.rows.length == 1) {
            var pRow = pRes.rows[0];
            Result.pData = {
                pLogs: SysUtils.GetJsonObj(pRow.jsonvals),
                iPlayTimes: pRow.playtimes,
                tmTime: pRow.ctime
            };
        }
    }
    else {
        var szSql = "select * from tb_paijuhuigu_logs where roomuuid = $1 and playtimes = $2";
        pRes = await dbCC.query(szSql, [szRoomUUID, iPlayTimes]);
        if (pRes.rows.length == 1) {
            var pRow = pRes.rows[0];
            Result.pData = {
                pLogs: SysUtils.GetJsonObj(pRow.jsonvals),
                iPlayTimes: pRow.playtimes,
                tmTime: pRow.ctime
            };
        }
    }

    pSocket.emit("getpjlogs_result", Result);
}

