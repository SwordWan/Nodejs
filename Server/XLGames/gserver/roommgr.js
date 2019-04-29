var crypto = require("../utils/crypto");
var SysUtils = require("../utils/SysUtils");
var DB = require("../Utils/db");
var ErrorUtils = require("../utils/ErrorCodes");
var ErrorCodes = ErrorUtils.ErrorCodes;
var pgsql = require('../utils/pgsqlCC');
var jcLibs = require("./JiangChi");
var GLibs = require("./GCXLibs");

var AppGlobals = null;

var SeatState = {
    SEAT_STATE_EMPTY: -1,    // 位置为空
    SEAT_STATE_REQSD: 0,     // 用户发出坐下请求
    SEAT_STATE_WAIT: 1,      // 用户等待中
    SEAT_STATE_READY: 2,     // 用户准备中
    SEAT_STATE_PLAY: 3,      // 游戏中
    SEAT_STATE_REST: 4,      // 休牌
    SEAT_STATE_LOSE: 5,      // 弃牌
    SEAT_STATE_QIAO: 6,      // 敲钵钵了
    SEAT_STATE_LIUZ: 7,      // 留座
    SEAT_STATE_FSW: 8,       // 分输完了

    SEAT_STATE_SEEP: 10,     // 旁观
}
exports.SeatState = SeatState;

var dbCC = null;
var UserMgr = null;
exports.Init = function (pAppGlobals, dbC) {
    AppGlobals = pAppGlobals;
    UserMgr = AppGlobals.pUserMgr;
    dbCC = dbC;
}


// 获取指定用户当前所在房间对象
function GetUserRoomObj(iUserId) {
    return AppGlobals.pUserMaps[iUserId];
}
exports.GetUserRoomObj = GetUserRoomObj;

// 在指定房间对象中获取用户对象
function GetUserObj(pRoomObj, iUserId) {
    var Result = null;

    for (var iIndex = 0; iIndex < pRoomObj.pPlayers.length; ++iIndex) {
        var pUserObj = pRoomObj.pPlayers[iIndex];
        if (pUserObj.iUserId == iUserId) {
            Result = pUserObj;
            break;
        }
    }

    if (Result == null) {
        for (var iIndex = 0; iIndex < pRoomObj.pSeePlayers.length; ++iIndex) {
            var pUserObj = pRoomObj.pSeePlayers[iIndex];
            if (pUserObj.iUserId == iUserId) {
                Result = pUserObj;
                break;
            }
        }
    }

    return Result;
}
exports.GetUserObj = GetUserObj;

// 获取空闲位置
function GetEmptySeatIndex(pRoomObj) {
    var Result = -1;

    for (var iIndex = 0; iIndex < pRoomObj.pPlayers.length; ++iIndex) {
        var pUserObj = pRoomObj.pPlayers[iIndex];
        if (pUserObj.iUserId == 0) {
            Result = iIndex;
            break;
        }
    }

    return Result;
}
exports.GetEmptySeatIndex = GetEmptySeatIndex;

// 移出指定观战用户
function RemoveSeeUser(pRoomObj, iUserId) {
    var Result = null;

    for (var iIndex = pRoomObj.pSeePlayers.length - 1; iIndex >= 0; --iIndex) {
        var pUserObj = pRoomObj.pSeePlayers[iIndex];
        if (pUserObj.iUserId == iUserId) {
            Result = pUserObj;
            pRoomObj.pSeePlayers.splice(iIndex, 1);
            delete AppGlobals.pUserMaps[iUserId];
            break;
        }
    }

    return Result;
}
exports.RemoveSeeUser = RemoveSeeUser;

// 清除上分请求定时器
function ClearJFReqTimerPtr(pUserObj) {
    if (pUserObj == null) return;
    if (pUserObj.pAddJiFenTimer != null) {
        clearTimeout(pUserObj.pAddJiFenTimer);
        delete pUserObj.pAddJiFenTimer;

        delete pUserObj.tmReqTime;
        delete pUserObj.iReqJiFen;
        delete pUserObj.iReqSeatIndex;
    }
}
exports.ClearJFReqTimerPtr = ClearJFReqTimerPtr;

// 清除留桌定时器
function ClearLZReqTimerPtr(pUserObj) {
    if (pUserObj == null) return;

    pUserObj.bLiuZuo = false;
    if (pUserObj.pLZTimerPtr != null) {
        clearTimeout(pUserObj.pLZTimerPtr);
        delete pUserObj.pLZTimerPtr;
        delete pUserObj.tmReqLZTimes;
    }
}
exports.ClearLZReqTimerPtr = ClearLZReqTimerPtr;


// 移出指定位置用户
function RemoveSeatUser(pRoomObj, iUserId) {
    var Result = null;

    for (var iIndex = pRoomObj.pPlayers.length - 1; iIndex >= 0; --iIndex) {
        var pUserObj = pRoomObj.pPlayers[iIndex];
        if (pUserObj.iUserId == iUserId) {
            Result = {
                iSeatIndex: SeatState.SEAT_STATE_EMPTY,
                iUserId: pUserObj.iUserId,
                szAlias: pUserObj.szAlias,
                szHeadIco: pUserObj.szHeadIco,
                bSex: pUserObj.bSex,
                iGolds: pUserObj.iGolds,
                tmVipEnd: pUserObj.tmVipEnd,
                pExtObj: pUserObj.pExtObj,
                iLevels: pUserObj.iLevels,
                iEnterClubId: pUserObj.iEnterClubId,
                iState: SeatState.SEAT_STATE_SEEP,
                bOnline: pUserObj.bOnline,
                fLon: pUserObj.fLon,    // 经度
                fLat: pUserObj.fLat,    // 纬度
            }

            pUserObj.iUserId = 0;
            pUserObj.szAlias = "";
            pUserObj.szHeadIco = "";
            pUserObj.iGolds = 0;
            pUserObj.iState = SeatState.SEAT_STATE_EMPTY;
            pUserObj.bOnline = false;
            pUserObj.iEnterClubId = 0;
            pUserObj.pExtObj = null;
            pUserObj.fLon = 0;
            pUserObj.fLat = 0;
            pUserObj.iTimesYS = 0;
            pUserObj.iTimeOutPlayTimes = 0;
            pUserObj.bLiuZuo = false;
            pUserObj.pVoice = null;
            pUserObj.tmVipEnd = new Date();

            ClearJFReqTimerPtr(pUserObj);   // 清除上分请求超时
            ClearLZReqTimerPtr(pUserObj);

            delete pUserObj.tmWSFTime;
            if (pUserObj.pWSFTimePtr != null) {
                clearTimeout(pUserObj.pWSFTimePtr);
                delete pUserObj.pWSFTimePtr;
            }

            delete AppGlobals.pUserMaps[iUserId];

            break;
        }
    }

    return Result;
}
exports.RemoveSeatUser = RemoveSeatUser;

// 添加旁观用户
function AddSeePlayer(pRoomObj, pUserObj) {
    var pItem = {
        iSeatIndex: -1,
        iUserId: pUserObj.iUserId,
        szAlias: pUserObj.szAlias,
        szHeadIco: pUserObj.szHeadIco,
        bSex: pUserObj.bSex,
        iGolds: pUserObj.iGolds,
        iLevels: pUserObj.iLevels,
        iEnterClubId: pUserObj.iEnterClubId,
        tmVipEnd: pUserObj.tmVipEnd,
        pExtObj: pUserObj.pExtObj,
        iState: SeatState.SEAT_STATE_SEEP,
        bOnline: pUserObj.bOnline,
        fLon: pUserObj.fLon,
        fLat: pUserObj.fLat,
        bLookOn: true   // 旁观
    }
    pRoomObj.pSeePlayers.push(pItem);    // 设置为旁观用户

    AppGlobals.pUserMaps[pItem.iUserId] = pRoomObj;
}
exports.AddSeePlayer = AddSeePlayer;

// 更新指定位置用户信息
function UpdateSeatUser(pRoomObj, iSeatIndex, pUserObj) {
    if (pUserObj == null) return;
    
    var pItem = pRoomObj.pPlayers[iSeatIndex];

    pItem.iUserId = pUserObj.iUserId;
    pItem.szAlias = pUserObj.szAlias;
    pItem.szHeadIco = pUserObj.szHeadIco;
    pItem.bSex = pUserObj.bSex;
    pItem.iGolds = pUserObj.iGolds;
    pItem.pExtObj = pUserObj.pExtObj;
    pItem.iState = SeatState.SEAT_STATE_WAIT;
    pItem.iLevels = pUserObj.iLevels;
    pItem.tmVipEnd = pUserObj.tmVipEnd;
    pItem.iEnterClubId = pUserObj.iEnterClubId;
    pItem.fLon = pUserObj.fLon;
    pItem.fLat = pUserObj.fLat;
    pItem.bLiuZuo = false;
    pItem.bOnline = true;
    pItem.pVoice = null;
    pItem.iTimesYS = 0;
    pItem.iTimeOutPlayTimes = 0;

    AppGlobals.pUserMaps[pItem.iUserId] = pRoomObj;

    return pItem;
}
exports.UpdateSeatUser = UpdateSeatUser;

// 获取房间剩余时间
function GetRoomTimeSY(pRoomObj) {
    Result = 0;

    if (!pRoomObj.pRoomArgs.bRunning) {  // 房间没开局状态
        Result = pRoomObj.pRoomArgs.iDelTimes;
    }
    else {  // 已开局状态
        Result = pRoomObj.iDelSec - pRoomObj.iSecond;
    }
    if (Result < 0) Result = 0;

    return Result;
}
exports.GetRoomTimeSY = GetRoomTimeSY;

function SendMsg(pSocket, szEvent, pData) {
    if (pSocket != null) pSocket.emit(szEvent, pData);
}
exports.SendMsg = SendMsg;

function SendMsgToUser(iUserId, szEvent, pData) {
    UserMgr.SendMsg(iUserId, szEvent, pData);
    // var pSocket = AppGlobals.GetSocketObj(iUserId);
    // if (pSocket != null) UserMgr.SendMsg(pSocket, szEvent, pData);
}
exports.SendMsgToUser = SendMsgToUser;

// 房间广播
function SendMsgToAll(pRoomObj, szEvent, pData, iNotSend) {
    for (var iIndex = 0; iIndex < pRoomObj.pSeePlayers.length; ++iIndex) {
        var iUserId = pRoomObj.pSeePlayers[iIndex].iUserId;
        if (iUserId == iNotSend) continue;
        SendMsgToUser(iUserId, szEvent, pData);
    }

    for (var iIndex = 0; iIndex < pRoomObj.pPlayers.length; ++iIndex) {
        var iUserId = pRoomObj.pPlayers[iIndex].iUserId;
        if (iUserId == iNotSend) continue;
        if (iUserId != 0) SendMsgToUser(iUserId, szEvent, pData);
    }
}
exports.SendMsgToAll = SendMsgToAll;

// 获取被踢掉的玩家缓存信息
function GetKillUser(pRoomObj, iUserId) {
    var Result = null;

    for (var iIndex = 0; iIndex < pRoomObj.pKillUsers.length; ++iIndex) {
        var pItem = pRoomObj.pKillUsers[iIndex];
        if (pItem.iUserId == iUserId) {
            Result = pItem;
            break;
        }
    }

    return Result;
}
exports.GetKillUser = GetKillUser;

// 缓存踢掉的玩家
function AddKillUser(pRoomObj, iUserId) {
    var pItem = GetKillUser(pRoomObj, iUserId);
    if (pItem == null) {
        pItem = {
            iUserId: iUserId,
            iTimes: 5 * 60  // 被踢掉的玩家5分钟后才能重装进房间
        };
        pRoomObj.pKillUsers.push(pItem);
    }
}
exports.AddKillUser = AddKillUser;

function OnTimerEvent(pRoomObj) {
    for (var iIndex = pRoomObj.pKillUsers.length - 1; iIndex >= 0; --iIndex) {
        var pItem = pRoomObj.pKillUsers[iIndex];

        if (pItem.iTimes > 0) pItem.iTimes -= 1;
        if (pItem.iTimes <= 0) {
            pRoomObj.pKillUsers.splice(iIndex, 1);
        }
    }

    var iTimeSY = GetRoomTimeSY(pRoomObj);
    //console.log(iTimeSY + ", notify time:" + (5 * 60));
    if (iTimeSY == 5 * 60) {
        console.log("OnTimerEvent 牌局要解散了...");
        SendMsgToAll(pRoomObj, "jiesan_warn_notify", { iRoomId: pRoomObj.iRoomId }, 0);
    }
}
exports.OnTimerEvent = OnTimerEvent;

// 获取指定房间对应的奖池ID
var pLevelMaps = {
    "1": 1,
    "2": 2,
    "5": 3,
    "10": 4,
    "20": 5,
    "50": 6,
    "100": 7,
};

var pMaxGoldsMaps = {
    "1": 10000,
    "2": 20000,
    "5": 30000,
    "10": 60000,
    "20": 120000,
    "50": 200000,
    "100": 200000,
};

async function GetJiangChiUID(pRoomObj) {
    var Result = -1;

    var pRes = await dbCC.query("select allianceid from tb_alliance_club where clubid = $1", [pRoomObj.iClubId]);
    if (pRes.rows.length == 0) return Result;

    var iKeyId = pRes.rows[0].allianceid;
    var iLevel = pRoomObj.pRoomArgs.iBaseFen;
    pRes = await dbCC.query("select * from tb_alliance_jiangchi where allianceid = $1 and level = $2", [iKeyId, iLevel]);
    if (pRes.rows.length == 0) return Result;

    return pRes.rows[0].uid;
}
exports.GetJiangChiUID = GetJiangChiUID;

async function GetJiangChiBaseInfo(pRoomObj) {
    var Result = {
        iUid: -1,
        iGolds: 0,
        bIsFull: false
    };
    if (pRoomObj.iAllId == 0) return Result;

    var pRes = await dbCC.query("select jcopen from tb_alliance where allianceid = $1", [pRoomObj.iAllId]);
    if (pRes.rows.length == 0) return Result;
    if (pRes.rows[0].jcopen == 0) return Result; 

    var iLevel = pRoomObj.pRoomArgs.iBaseFen;
    pRes = await dbCC.query("select * from tb_alliance_jiangchi where allianceid = $1 and level = $2", [pRoomObj.iAllId, iLevel]);
    if (pRes.rows.length == 0) return Result;

    Result.iUid = parseInt(pRes.rows[0].uid);
    Result.iGolds = parseInt(pRes.rows[0].golds);
    Result.bIsFull = (Result.iGolds >= pMaxGoldsMaps[pRoomObj.pRoomArgs.iBaseFen]);

    return Result;
}
exports.GetJiangChiBaseInfo =  GetJiangChiBaseInfo;

// 获取指定房间对应的奖池信息
async function GetJiangChiInfo(pSocket, pRoomObj) {
    // var pRes = await dbCC.query("select allianceid from tb_alliance where clubid = $1", [pRoomObj.iClubId]);
    // if (pRes.rows.length == 0) {
    //     return { iGoldsTotal: 0, iJiangChi: [], pLogs: [] };
    // }
    var iKeyId = pRoomObj.iAllId;
    if (iKeyId == 0) {
        pSocket.emit("jclogs_result", { iGoldsTotal: 0, iJiangChi: 0, pLogs: [] });
        return;
    }

    //var iKeyId = pRes.rows[0].allianceid;
    var iLevel = pRoomObj.pRoomArgs.iBaseFen;
    pRes = await dbCC.query("select * from tb_alliance_jiangchi where allianceid = $1 and level = $2", [iKeyId, iLevel]);
    if (pRes.rows.length == 0) return null;

    var pReqArgs = {
        uid: pRes.rows[0].uid,
        allianceid: iKeyId,
        level: pRoomObj.pRoomArgs.iBaseFen
    };
    await jcLibs.list(pSocket, pReqArgs);
}
exports.GetJiangChiInfo = GetJiangChiInfo;

// 获取指定房间对应的奖池信息
async function GetJiangChiInfoByAID(pSocket, pRoomObj) {
    var iKeyId = pRoomObj.iAllId;
    if (iKeyId == 0) {
        pSocket.emit("jclogs_result", { iGoldsTotal: 0, iJiangChi: 0, pLogs: [] });
        return;
    }

    var iLevel = pRoomObj.pRoomArgs.iBaseFen;
    pRes = await dbCC.query("select * from tb_alliance_jiangchi where allianceid = $1 and level = $2", [iKeyId, iLevel]);
    if (pRes.rows.length == 0) return null;

    var pReqArgs = {
        uid: pRes.rows[0].uid,
        allianceid: iKeyId,
        level: iLevel
    };
    await jcLibs.list(pSocket, pReqArgs);
}
exports.GetJiangChiInfoByAID = GetJiangChiInfoByAID;



// 判断分牌后的牌
function GetPaiJCType(pPlayerObj) {
    if (pPlayerObj.pPais1 == null) return jcLibs.TYPE_DEF.NONE;
    
    // 一等奖  // 丁皇 (红3 + 大王)  + 天牌 (一对红Q)
    // 二等奖  // 对子 + 丁皇 (红3 + 大王)
    // 三等奖  // 两对牌

    var pPaiObjL = GLibs.GetPaiCodeObj(pPlayerObj.pPais1);
    var pPaiObjR = GLibs.GetPaiCodeObj(pPlayerObj.pPais2);
    if ((pPaiObjL != null) && (pPaiObjR != null)) {
        // 一等奖  // 丁皇 (红3 + 大王)  + 天牌 (一对红Q)
        if ((pPaiObjL.iCode == 0) && (pPaiObjR.iCode == 1)) {
            return jcLibs.TYPE_DEF.TIANHUANG;
        }
        else if ((pPaiObjL.iCode == 1) && (pPaiObjR.iCode == 0)) {
            return jcLibs.TYPE_DEF.TIANHUANG;
        }

        // 二等奖  // 对子 + 丁皇 (红3 + 大王)
        if (GLibs.IsDZ(pPlayerObj.pPais1) || GLibs.IsDZ(pPlayerObj.pPais2)) {
            if ((pPaiObjL.iCode == 0) && (pPaiObjR.iCode >= 1) && (pPaiObjR.iCode <= 15)) {
                return jcLibs.TYPE_DEF.DUOHUANG;
            }
            else if ((pPaiObjR.iCode == 0) && (pPaiObjL.iCode >= 1) && (pPaiObjL.iCode <= 15)) {
                return jcLibs.TYPE_DEF.DUOHUANG;
            }
        }
        
        // 三等奖  // 两对牌
        if (GLibs.IsDZ(pPlayerObj.pPais1) && GLibs.IsDZ(pPlayerObj.pPais2)) {
            return jcLibs.TYPE_DEF.DUODUODUO;
        }
    }

    return jcLibs.TYPE_DEF.NONE;
}
exports.GetPaiJCType = GetPaiJCType;

// 采用分牌前的牌来判断
function GetPaiJCTypeEx(pPais) {
    if (pPais == null) return jcLibs.TYPE_DEF.NONE;
    if (pPais.length < 4) return jcLibs.TYPE_DEF.NONE;

    // 自动分组
    var pGroup = [
        { 
            pPais1: [pPais[0], pPais[1]],
            pPais2: [pPais[2], pPais[3]]
        },

        { 
            pPais1: [pPais[0], pPais[2]],
            pPais2: [pPais[1], pPais[3]]
        },

        { 
            pPais1: [pPais[0], pPais[3]],
            pPais2: [pPais[1], pPais[2]]
        },
    ];

    var iType = jcLibs.TYPE_DEF.NONE;
    for (var iIndex = 0; iIndex < pGroup.length; ++iIndex) {
        var pItem = pGroup[iIndex];
        var iRet = GetPaiJCType(pItem);
        if (iRet > iType) iType = iRet;
    }
    
    return iType;
}
exports.GetPaiJCTypeEx = GetPaiJCTypeEx;

// 调试输入位置上的玩家
function LogSeatUsers(pRoomObj) {
    //return;
    
    console.log("##### LogSeatUsers iRoomId:" + pRoomObj.iRoomId + ", pSeats.length:" + pRoomObj.pPlayers.length);
    for (var iIndex = 0; iIndex < pRoomObj.pPlayers.length; ++iIndex) {
        var pUserObj = pRoomObj.pPlayers[iIndex];
        if (pUserObj.iUserId == 0) continue;
        
        var pJiFenObj = GetJiFenObj(pRoomObj, pUserObj.iUserId);
        if (pJiFenObj == null) pJiFenObj = { iJiFen: 0 };
        console.log("LogSeatUsers iIndex:" + iIndex + ", iSeatIndex:" + pUserObj.iSeatIndex + ", iUserId:" +
            pUserObj.iUserId + ", iState:" + pUserObj.iState + ", iJiFen:" + pJiFenObj.iJiFen);
    }
}
exports.LogSeatUsers = LogSeatUsers;


// 计算最大芒果分
function GetMaxMGF(pRoomObj) {
    var Result = 0;

    if (pRoomObj.pRoomArgs.bOpenMG) {
        if (pRoomObj.pRoomArgs.iMaxMG < 6) {
            for (var iIndex = 1; iIndex <= pRoomObj.pRoomArgs.iMaxMG; ++iIndex) {
                Result = Result + pRoomObj.pRoomArgs.iBaseFen * 2;
            }
        }
        else {
            Result = 409600;
        }
    }

    return Result;
}

// 创建房间对象 (pRoomInfo：数据表房间记录)
function CreateRoomObj(pRoomInfo) {
    var Result = {
        iAllId: pRoomInfo.iAllId,                   // 联盟俱乐部ID
        iClubId: pRoomInfo.iClubId,                 // 俱乐部ID
        szRoomUUID: pRoomInfo.szRoomUUID,           // 房间唯一ID
        iRoomId: pRoomInfo.iRoomId,                 // 房间ID
        pRoomArgs: pRoomInfo.pRoomArgs,             // 房间参数
        iCreator: pRoomInfo.iCreator,               // 创建者
        iPlayTimes: pRoomInfo.iPlayTimes,           // 局数
        tmCreate: pRoomInfo.tmCreate,               // 创建时间
        iMaxMGF: 0,                                 // 最大芒果分
        pKillUsers: [],                             // 当前被踢的玩家,5分钟后移出(5分钟后才能再次进入房间)
        pRoomPlayers: {},                           // 房间里面上了分的玩家信息
        iSecond: parseInt(pRoomInfo.iTimes),                  // 房间使用了多少秒了
        iDelSec: parseInt(pRoomInfo.iTimeLen),                // 房间结束时间 (iSecond >= iDelSec 时回收房间)
        iBankerIndex: -1,                                     // 初始化时第一个位置的玩家当庄

        bRunning: false,    // 是否已开局

        bWaitJS: false,     // 结算时间
        bCanDel: true,      // 是否启用删除功能
        bDelete: false,     // 该房间是否应该删除了
        iJieSanMode: 0,     // 0：超时解散，1：手动解散

        pGameMgr: null,     // 游戏管理器
        pPlayers: [],       // 玩家数据
        pSeePlayers: [],    // 旁观用户
        pJingYanUsers: [],  // 被禁言的玩家

        pGameObj: pRoomInfo.pGameObj,   //pRoomInfo.pGameInfo,

        pStartTimePtr: null, // 自动开局定时器
        pTimerPtr: null,     // 定时器(开局后使用的)

        pTimerEvent: null
    }
    Result.iMaxMGF = GetMaxMGF(Result);
    //console.log(Result.pGameObj);

    if (Result.pRoomArgs.iMaxSeePlayer == null) Result.pRoomArgs.iMaxSeePlayer = 20;

    // 最大玩家数
    for (var iIndex = 0; iIndex < Result.pRoomArgs.iMaxPlayer; ++iIndex) {
        var pUserObj = {
            iSeatIndex: iIndex, // 当前座位位置
            iUserId: 0,
            szAlias: "",
            szHeadIco: "",
            bSex: false,
            iGolds: 0,
            iLevels: 0,
            iEnterClubId: 0,
            tmVipEnd: new Date(),
            pExtObj: null,
            iState: SeatState.SEAT_STATE_EMPTY,         // -1:位置为空 0:空闲, 1:准备, 2:正在玩
            bOnline: false,
            fLon: 0,    // 经度
            fLat: 0,    // 纬度
            iTimesYS: 0,
            iTimeOutPlayTimes: 0,
            pVoice: null,   // 语音数据
            pLink: null,    // 环形指针, 方便计算庄家
        }

        var pPrev = null;
        if (Result.pPlayers.length > 0) pPrev = Result.pPlayers[Result.pPlayers.length - 1];

        Result.pPlayers.push(pUserObj);

        if (pPrev != null) pPrev.pLink = pUserObj;
        if (iIndex == Result.pRoomArgs.iMaxPlayer - 1) pUserObj.pLink = Result.pPlayers[0];
    }

    if (Result.pGameObj == null) Result.pGameObj = {};

    if (Result.pGameObj.iJiFenMG == null) {
        Result.pGameObj.iJiFenMG = 0;  // 上一局转过来的芒果
    }
    else {
        Result.pGameObj.iJiFenMG = parseInt(Result.pGameObj.iJiFenMG);
    }
    //console.log("iJiFenMG:" + Result.pGameObj.iJiFenMG);

    if (Result.pGameObj.iNextMG == null) {
        Result.pGameObj.iNextMG = 0;    // 下一局要打的芒果
    }
    else {
        Result.pGameObj.iNextMG = parseInt(Result.pGameObj.iNextMG);
    }

    if (Result.pGameObj.iWinUser == null) {
        Result.pGameObj.iWinUser = 0;  // 上一局揍芒赢家
    }
    else {
        Result.pGameObj.iWinUser = parseInt(Result.pGameObj.iWinUser);
    }

    if (Result.pGameObj.iJiFenMGTimes == null) {
        Result.pGameObj.iJiFenMGTimes = 0;
    }
    else {
        Result.pGameObj.iJiFenMGTimes = parseInt(Result.pGameObj.iJiFenMGTimes);
    }

    Result.bCanDel = (Result.pGameObj.iJiFenMG == 0)    // 上一局的芒果分没被吃完时临时该房间的删除房间功能
    Result.pTimerEvent = setInterval(OnTimerEvent, 1000, Result);

    return Result;
}

function AddJiFenUser(pRoomObj, pReqObj, iJiFen, szClubName, bOnline) {
    var Result = {
        szAlias: crypto.fromBase64(pReqObj.szReqUser),
        iClubId: pReqObj.iFromClub, // 玩家在哪个俱乐部上的分
        szClubName: szClubName,     // 上分俱乐部的名称
        iJiFenDR: iJiFen,           // 总带入积分
        iJiFenCDR: pReqObj.iAddJiFen,             // 当前带入
        iJiFenYQ: 0,                              // 积分预取
        iJiFen: pReqObj.iAddJiFen,                // 身上的积分
        iJiFenSY: 0,                              // 当前输赢
        iSumSY: 0,                                // 输赢汇总
        bOnline: bOnline
    };
    pRoomObj.pRoomPlayers[pReqObj.iUserId] = Result;

    return Result;
}
exports.AddJiFenUser = AddJiFenUser;

function GetJiFenObj(pRoomObj, iUserId) {
    return pRoomObj.pRoomPlayers[iUserId];
}
exports.GetJiFenObj = GetJiFenObj;

function SetStakeObj(pRoomObj, iUserId, pStakeObj) {
    var pItem = pRoomObj.pRoomPlayers[iUserId];
    if (pItem != null) pItem.pStake = pStakeObj;
}
exports.SetStakeObj = SetStakeObj;

function GetStakeObj(pRoomObj, iUserId) {
    var Result = null;

    var pItem = pRoomObj.pRoomPlayers[iUserId];
    if (pItem != null) {
        Result = pItem.pStake;
    }

    return Result;
}
exports.GetStakeObj = GetStakeObj;

function ClearStakeObjs(pRoomObj) {
    for (var sKey in pRoomObj.pRoomPlayers) {
        pRoomObj.pRoomPlayers[sKey].pStake = null;
    }
}
exports.ClearStakeObjs = ClearStakeObjs;


function RefreshRoomPlayers(pRoomObj, callback) {
    var szSql = "select a.userid, b.alias, a.jifendr, a.jifenkc, a.jifenyq, a.jifen, a.jifensy, a.clubid, a.stakes, c.sname \
        from tb_userjifen_info a, tb_users b, tb_clubs c \
        where a.userid = b.userid and a.clubid = c.clubid and roomuuid = $1";
    DB.QuerySQL(szSql, [pRoomObj.szRoomUUID], function (pRows) {
        for (var iIndex = 0; iIndex < pRows.length; ++iIndex) {
            var pRow = pRows[iIndex];

            var pItem = {
                szAlias: crypto.fromBase64(pRow.alias),
                //szHeadIco: pRow.headico,
                iClubId: pRow.clubid,       // 玩家在哪个俱乐部上的分
                szClubName: pRow.sname,     // 上分俱乐部的名称
                iJiFenDR: parseInt(pRow.jifendr),     // 总带入积分
                iJiFenCDR: parseInt(pRow.jifenkc),     // 积分库存 (当前带入)
                iJiFenYQ: parseInt(pRow.jifenyq),     // 积分预取
                iJiFen: parseInt(pRow.jifen),         // 身上的积分
                iJiFenSY: 0,                          // 当前输赢
                iSumSY: parseInt(pRow.jifensy),       // 输赢汇总
                bOnline: false              // 在线状态
            }
            pItem.iJiFenSY = pItem.iJiFen - pItem.iJiFenCDR;
            pRoomObj.pRoomPlayers[pRow.userid] = pItem;

            //console.log(pRoomObj.pRoomPlayers[pRow.userid]);
            var pStake = SysUtils.GetJsonObj(pRow.stakes);
            if (pStake != null) {
                pRoomObj.pRoomPlayers[pRow.userid].iJiFen += pStake.iJiFenYZ;   // + pStake.iJiFenMG;
            }
        }

        DB.UpdateSQL("update tb_userjifen_info set stakes = null where roomuuid = $1", [pRoomObj.szRoomUUID], function (iCount) {
            callback(pRoomObj.pRoomPlayers);
        });
    });
}
exports.RefreshRoomPlayers = RefreshRoomPlayers;

// 获取指定房间
function GetRoomObj(iRoomId) {
    return AppGlobals.pRoomMaps[iRoomId];
}
exports.GetRoomObj = GetRoomObj;

// 获取指定房间人数信息
function GetPlayerCount(pRoomObj) {
    var Result = {
        iPlayerNum: 0,      // 座位上的玩家数
        iSeePlayerNum: 0,   // 旁观玩家数
        iReadyNum: 0,       // 已准备的玩家   
    }

    for (var iIndex = 0; iIndex < pRoomObj.pPlayers.length; ++iIndex) {
        var pUserObj = pRoomObj.pPlayers[iIndex];
        if (pUserObj.iUserId != 0) {
            ++Result.iPlayerNum;
        }

        if (pUserObj.iState == 1) {
            ++Result.iReadyNum;
        }
    }

    Result.iSeePlayerNum += pRoomObj.pSeePlayers.length;

    return Result;
}
exports.GetPlayerCount = GetPlayerCount;

// 加载房间
function InitRoomObj(pRoomInfo) {
    var Result = AppGlobals.pRoomMaps[pRoomInfo.iRoomId];
    if (Result == null) {
        Result = CreateRoomObj(pRoomInfo);
        AppGlobals.pRoomMaps[Result.iRoomId] = Result;
    };

    return Result;
}
exports.InitRoomObj = InitRoomObj;

// 用户进入房间
function EnterRoom(pRoomObj, pUserInfo) {
    var pCountObj = exports.GetPlayerCount(pRoomObj);
    if (pCountObj.iSeePlayerNum == pRoomObj.pRoomArgs.iMaxSeePlayer) {
        return { wErrCode: ErrorCodes.ERR_ROOMPLAYERISFULL, szErrMsg: "房间人数已满" };
    }

    var pUserObj = {
        iSeatIndex: -1,
        iUserId: pUserInfo.iUserId,
        szAlias: pUserInfo.szAlias,
        szHeadIco: pUserInfo.szHeadIco,
        bSex: pUserInfo.bSex,
        iGolds: pUserInfo.iGolds,
        iLevels: pUserInfo.iLevels,
        iEnterClubId: pUserInfo.iEnterClubId,
        tmVipEnd: pUserInfo.tmVipEnd,
        pExtObj: pUserInfo.pExtObj,
        iState: SeatState.SEAT_STATE_SEEP,
        fLon: pUserInfo.fLon,
        fLat: pUserInfo.fLat,
        bOnline: true,
        bLookOn: true   // 旁观
    }

    var pItem = GetUserObj(pRoomObj, pUserInfo.iUserId);
    if (pItem == null) pRoomObj.pSeePlayers.push(pUserObj);    // 设置为旁观用户
    //console.log(pRoomObj.pSeePlayers[0]);

    pRoomObj.pGameMgr = AppGlobals.pGameMgr;
    AppGlobals.pUserMaps[pUserObj.iUserId] = pRoomObj;

    return {
        wErrCode: ErrorCodes.ERR_NOERROR,
        szErrMsg: "操作成功",
        pSeePlayers: pRoomObj.pSeePlayers,
        pPlayers: pRoomObj.pPlayers,
    };
}
exports.EnterRoom = EnterRoom;

function GetRoomClubIds(pRoomObj) {
    var pClubIds = [];
    for (var sKey in pRoomObj.pRoomPlayers) {
        var pJiFenObj = pRoomObj.pRoomPlayers[sKey];

        if (pClubIds.indexOf(pJiFenObj.iClubId) == -1) {
            pClubIds.push(pJiFenObj.iClubId);
        }
    }
    return pClubIds.join(" ");
}
exports.GetRoomClubIds = GetRoomClubIds;

function GetRoomUserIds(pRoomObj) {
    var pUserIds = [];
    for (var sKey in pRoomObj.pRoomPlayers) {
        //var pJiFenObj = pRoomObj.pRoomPlayers[sKey];
        pUserIds.push(sKey);
    }
    return pUserIds.join(" ");
}

// 删除房间
function Delete(pRoomObj) {
    if (pRoomObj == null) return;
    if (pRoomObj.pTimerPtr != null) clearTimeout(pRoomObj.pTimerPtr);

    var pJiFenObjs = {};
    for (var sKey in pRoomObj.pRoomPlayers) {
        var iUserId = parseInt(sKey);

        pJiFenObjs[sKey] = {
            iJiFenDR: pRoomObj.pRoomPlayers[sKey].iJiFenDR, // 总带入
            iJiFenCDR: pRoomObj.pRoomPlayers[sKey].iJiFenCDR, // 当前带入
            iJiFen: pRoomObj.pRoomPlayers[sKey].iJiFen,     // 身上的积分
        }

        (function (pRoomObj, iUserId) {
            DB.get_user_info(iUserId, function (pUserInfo) {
                if (pUserInfo == null) return;

                var pJiFenObj = GetJiFenObj(pRoomObj, iUserId);
                var pExtObj = DB.get_user_extdata(pUserInfo);
                var iJiFenSY = (pJiFenObj.iJiFen + pJiFenObj.iJiFenCDR) - pJiFenObj.iJiFenDR;   // 玩家输赢积分

                console.log("iUserId:" + iUserId + ", iJiFenSY:" + iJiFenSY);

                pExtObj.iGameTimes += 1;
                pExtObj.iJiFenSY = pExtObj.iJiFenSY + iJiFenSY;
                pExtObj.iJiFenSY = parseInt(pExtObj.iJiFenSY / 2);
                if (pJiFenObj.iJiFen > pJiFenObj.iJiFenDR) pExtObj.iWinTimes += 1;

                // 房间牌局回顾
                DB.update_user_extdata(iUserId, pExtObj);
                DB.UpdateSQL("update tb_joinclubs set extdata = $1 where userid = $2 and clubid = $3",
                    [JSON.stringify(pExtObj), iUserId, pRoomObj.iClubId], null);

                // 总局数, 总输赢
                szSql = "update tb_joinclubs set playtimes = playtimes + 1, jiesuan = jiesuan + $1 where clubid = $2 and userid = $3";
                DB.UpdateSQL(szSql, [iJiFenSY, pRoomObj.iClubId, iUserId]);

                // 本月局数
                szSql = "select count(*) as icount from tb_monthplaytimes where ctime = to_char(now(), 'yyyymm')";
                DB.QuerySQL(szSql, null, function (pRows) {
                    var iCount = 0;
                    if (pRows.length == 1) iCount = pRows[0].icount;

                    if (iCount == 1) {
                        var szSql = "update tb_monthplaytimes set playtimes = playtimes + 1 where clubid = $1 and userid = $2";
                        DB.UpdateSQL(szSql, [pRoomObj.iClubId, iUserId], null);
                    }
                    else {
                        var szSql = "insert into tb_monthplaytimes(clubid, userid, playtimes) values($1, $2, $3)";
                        DB.InsertSQL(szSql, [pRoomObj.iClubId, iUserId, 1], null);
                    }
                });
            });
        })(pRoomObj, iUserId);
    }

    // 房间结算信息
    var szClubIds = GetRoomUserIds(pRoomObj);
    var szUserIds = GetRoomUserIds(pRoomObj);
    var szJiFenInfo = JSON.stringify(pJiFenObjs);
    var szSql = "insert into tb_game_logs(clubid, roomuuid, roomid, roomargs, playtimes, clubids, userids, jiesuan, allid, creator) " +
        " values($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)";
    DB.InsertSQL(szSql, [pRoomObj.iClubId, pRoomObj.szRoomUUID, pRoomObj.iRoomId, JSON.stringify(pRoomObj.pRoomArgs),
    pRoomObj.iPlayTimes, szClubIds, szUserIds, szJiFenInfo, pRoomObj.iAllId, pRoomObj.iCreator]);

    DB.DeleteSQL("delete from tb_roommessage where roomid = $1", [pRoomObj.iRoomId], null);
    DB.UpdateSQL("update tb_users set roomid = 0 where roomid = $1", [pRoomObj.iRoomId], null);
    DB.DeleteSQL("delete from tb_addjifenreq where roomuuid = $1", [pRoomObj.szRoomUUID], null);
    DB.DeleteSQL("delete from tb_userjifen_info where roomuuid = $1", [pRoomObj.szRoomUUID], null);

    for (var iIndex = 0; iIndex < pRoomObj.pSeePlayers.length; ++iIndex) {
        var pUserObj = pRoomObj.pSeePlayers[iIndex];
        delete AppGlobals.pUserMaps[pUserObj.iUserId];
    }

    for (var iIndex = 0; iIndex < pRoomObj.pPlayers.length; ++iIndex) {
        var pUserObj = pRoomObj.pPlayers[iIndex];

        ClearLZReqTimerPtr(pUserObj);

        delete AppGlobals.pUserMaps[pUserObj.iUserId];
    }

    delete AppGlobals.pRoomMaps[pRoomObj.iRoomId];
}
exports.Delete = async function (pRoomObj) {
    await Del_CC(pRoomObj);
};


function fmtMonth(month) {
    if (month + 1 < 10) {
        return padZero(month + 1);
    }
    return month + 1 + '';
}

function padZero(number) {
    if (number < 10) return '0' + number;
    return number + '';
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

async function Del_CC(pRoomObj) {
    if (pRoomObj == null) return;
    if (pRoomObj.pTimerPtr != null) clearTimeout(pRoomObj.pTimerPtr);
    if (pRoomObj.pTimerEvent != null) clearTimeout(pRoomObj.pTimerEvent);

    let conn = new pgsql.conn();
    let bError = true;
    try {
        var tmNow = new Date();
        var szTimeY = tmNow.Format("yyyyMM");

        await conn.Transaction();

        if (!pRoomObj.pRoomArgs.bRunning) {             // 房间没启动退回玩家金币
            for (var sKey in pRoomObj.pRoomPlayers) {
                var iUserId = parseInt(sKey);
                var pItem = pRoomObj.pRoomPlayers[sKey];
                var iGolds = parseInt(pItem.iJiFenDR / 2);
                await conn.Query("update tb_users set golds = golds + $1 where userid = $2", [iGolds, iUserId]);
            }
        }

        do {
            let mapUser = {};
            let mapClub = {};
            let date = new Date();
            let y = date.getFullYear();
            let m = fmtMonth(date.getMonth());
            let d = padZero(date.getDate())
            let ym = y + '-' + m;
            let ymd = y + '' + m + '' + d + '';
            let iClubId = pRoomObj.iClubId;
            let iAllianceid = pRoomObj.iAllId;
            let forsearch = [];
            let userList = [];
            let clubList = [];
            let zongdairu = 0;
            /*
            管理可以看自己所在俱乐部的
            普通的只能看自己的
            如果是联盟管理开局
            那个管理开的，那么就只有该管理可看，
            如果是联盟长，那么所有管理开的房间都可看
            */
            let sql = 'select tb_userjifen_info.* ,tb_users.extdata ,tb_users.alias ,tb_clubs.sname as clubname \
                        from tb_userjifen_info \
                        inner join tb_users on tb_users.userid = tb_userjifen_info.userid \
                        inner join tb_clubs on tb_clubs.clubid = tb_userjifen_info.clubid \
                        where tb_userjifen_info.roomuuid = $1';
            let res = await conn.Query(sql, [pRoomObj.szRoomUUID]);

            if (iAllianceid > 0) {
                forsearch.push('lm' + iAllianceid);
                forsearch.push('lmgl' + pRoomObj.iCreator);
            }

            for (let i = 0; i < res.rows.length; i++) {
                let row = res.rows[i];
                //let shuying = row.jifen - row.jifenkc + row.jifenyq;      // 赢
                var pJiFenObj = GetJiFenObj(pRoomObj, row.userid);
                let shuying =  pJiFenObj.iSumSY; // pJiFenObj.iJiFenSY;
                
                zongdairu += row.jifenkc;   // 当前带入 // row.jifendr (管理员拖动的带入);
                if (undefined == mapUser[row.userid]) {
                    mapUser[row.userid] = {
                        userid: row.userid,
                        alias: crypto.fromBase64(row.alias),
                        clubname: row.clubname,
                        extdata: DB.get_user_extdata(row.extdata)
                    };
                }
                forsearch.push('us' + row.userid)
                forsearch.push('jlb' + row.clubid);
                if (undefined == mapClub[row.clubid]) {
                    mapClub[row.clubid] = {
                        shuying: 0,
                        clubname: row.clubname
                    };
                }
                mapClub[row.clubid].shuying += shuying;
                userList.push({
                    userid: row.userid,
                    alias: crypto.fromBase64(row.alias),
                    clubid: row.clubid,
                    clubname: row.clubname,
                    jifendr: row.jifenkc,   //row.jifendr,
                    shuying: shuying
                });

                var pRes = await conn.Query("select * from tb_users where userid = $1", [row.userid]);
                if (pRes.rows.length == 1) {
                    var pUserInfo = pRes.rows[0];
                    var pJiFenObj = GetJiFenObj(pRoomObj, row.userid);
                    var pExtObj = DB.get_user_extdata(pUserInfo);
                    var iJiFenSY = pJiFenObj.iJiFen - pJiFenObj.iJiFenCDR;   // 玩家输赢积分
    
                    console.log("iUserId:" + row.userid + ", iJiFenSY:" + iJiFenSY);

                    if (pExtObj.szTime != szTimeY) {
                        pExtObj.szTime = szTimeY;
                        pExtObj.iTotoY = 1;
                    }
                    else {
                        pExtObj.iTotoY += 1;                        
                    }

                    pExtObj.iGameTimes += 1;
                    pExtObj.iJiFenSY = pExtObj.iJiFenSY + iJiFenSY;
                    pExtObj.iJiFenSY = parseInt(pExtObj.iJiFenSY / 2);
                    if (pJiFenObj.iJiFen > pJiFenObj.iJiFenCDR) pExtObj.iWinTimes += 1;
    
                    // 房间牌局回顾
                    var szExtObj = JSON.stringify(pExtObj);
                    await conn.Query("update tb_users set extdata = $1 where userid = $2", [szExtObj, pUserInfo.userid]);
                    await conn.Query("update tb_joinclubs set extdata = $1 where userid = $2 and clubid = $3",
                        [szExtObj, row.userid, pRoomObj.iClubId]);
                }
            }

            forsearch = unique(forsearch);
            forsearch = forsearch.join(' ');

            for (let clubid in mapClub) {
                clubList.push({
                    clubid: clubid,
                    clubname: mapClub[clubid].clubname,
                    shuying: mapClub[clubid].shuying
                });
            }

            sql = 'insert into tb_game (ym ,dt ,forsearch) values($1,$2,$3)';

            await conn.Query(sql, [ym, d, forsearch]);

            userList.sort(function (a, b) {
                return b.shuying - a.shuying;
            })

            let details = {
                userList: userList,
                clubList: clubList
            }

            sql = 'select * from tb_clubs where clubid =$1';
            res = await conn.Query(sql, [iClubId]);
            let clubname = '以删除俱乐部'
            if (res.rowCount > 0) {
                clubname = res.rows[0].sname;
            }
            sql = 'insert into tb_game_logs \
                    (roomuuid ,forsearch ,ymd ,clubid ,shichang ,dipi ,zongshoushu ,zongdairu ,details ,clubname ,roomname) \
                    values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10, $11)';
            await conn.Query(sql, [pRoomObj.szRoomUUID, forsearch, ymd, iClubId, pRoomObj.pRoomArgs.iTimes,
                pRoomObj.pRoomArgs.iBaseFen, pRoomObj.iPlayTimes, zongdairu,
                JSON.stringify(details), clubname, pRoomObj.pRoomArgs.szName]);

            await conn.Query("delete from tb_roommessage where roomid = $1", [pRoomObj.iRoomId]);
            await conn.Query("delete from tb_addjifenreq where roomuuid = $1", [pRoomObj.szRoomUUID]);
            await conn.Query("delete from tb_userjifen_info where roomuuid = $1", [pRoomObj.szRoomUUID]);
            await conn.Query("delete from tb_club_rooms where roomid = $1", [pRoomObj.iRoomId]);
            await conn.Query("delete from tb_clubrooms_msg where roomid = $1", [pRoomObj.iRoomId]);

            for (var iIndex = 0; iIndex < pRoomObj.pSeePlayers.length; ++iIndex) {
                var pUserObj = pRoomObj.pSeePlayers[iIndex];
                delete AppGlobals.pUserMaps[pUserObj.iUserId];
            }

            for (var iIndex = 0; iIndex < pRoomObj.pPlayers.length; ++iIndex) {
                var pUserObj = pRoomObj.pPlayers[iIndex];

                ClearJFReqTimerPtr(pUserObj);
                ClearLZReqTimerPtr(pUserObj);

                delete AppGlobals.pUserMaps[pUserObj.iUserId];
            }

            delete AppGlobals.pRoomMaps[pRoomObj.iRoomId];

            bError = false;
        } while (false);

        await conn.Query("update tb_users set roomid = 0, clubid = 0 where roomid = $1", [pRoomObj.iRoomId]);
    } catch (e) {
        console.log(e.messagge);
    } finally {
        if (bError) {
            await conn.Rollback();
        } else {
            await conn.Commit();
        }
        conn.Release();
    }
};

// 1：俱乐部退出联盟后，之前联盟推送出来的房间要一直看得到，直接房间删除
// 2：加倍押注有问题