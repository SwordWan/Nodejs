// 扯旋儿
var AppConfigs = require("../configs_win");
var crypto = require("../utils/crypto");
var SysUtils = require("../utils/SysUtils")
var HTTP = require("./HttpUtils");
var DB = require("../Utils/db");
//var dbCC = require("../utils/pgsqlCC");
//var dbLGQ = require("../utils/dbLGQ");
var Poker = require("./Poker");
var GLibs = require("./GCXLibs");
var jcLibs = require("./JiangChi");
var ErrorUtils = require("../utils/ErrorCodes");
var ErrorCodes = ErrorUtils.ErrorCodes;

const __ENABLE_OPT_TIMEOUT__ = true;  // 是否启用超时自动 休，丢，分牌

var TIME_OUT_REQSF_VALUE = 300;       // 300 秒后上分申请超时
var TIME_OUT_LZ_VALUE = 300;          // 300 秒后留桌超时
var TIME_OUT_ACTION_VALUE = 16;       // 10 秒超时自动休丢牌
var TIME_OUT_SPLIT_VALUE = 30;        // 30 秒超时自动分牌
var TIME_OUT_START_VALUE = 4;         // 4 秒后自动开始下一局
var TIME_OUT_JIESUAN_VALUE = 2;       // 2 秒后自动结算
//====================================

// 动作ID
var ActionTypes = {
    ACTION_TYPE_CDF: 1,     // 出底分
    ACTION_TYPE_GEN: 2,     // 跟
    ACTION_TYPE_DA: 3,      // 大
    ACTION_TYPE_QIAO: 4,    // 敲
    ACTION_TYPE_XIU: 5,     // 休
    ACTION_TYPE_DIU: 6,     // 丢
    ACTION_TYPE_YSHI: 7,    // 延时
    ACTION_TYPE_DEAL: 8,    // 发牌

    ACTION_TYPE_FENPAI: 9, // 分牌
    ACTION_TYPE_JIESUAN: 10,    // 结算
};
//====================================

// 初始化
var UserMgr = null;
var RoomMgr = null;
var dbCC = null;
var dbLGQ = null;
var g_pAppGlobals = null;
var g_pOpenGPSMaps = {};    // userid -> true / false

exports.Init = function (pAppGlobals, dbC, dbL) {
    g_pAppGlobals = pAppGlobals;

    dbCC = dbC;
    dbLGQ = dbL;

    UserMgr = pAppGlobals.pUserMgr;
    RoomMgr = pAppGlobals.pRoomMgr;
}


// 获取游戏配置
function GetConfig() {
    var pAppCfg = SysUtils.GetAppConfig();
    return pAppCfg.chexuaner;
}

// let g_CCSendIndex = 0;
// let g_CCdir = './' + new Date().getTime();
// let g_fs = require('fs');
// g_fs.mkdirSync(g_CCdir);
function SendMsg(pSocket, szEvent, pData) {
    if (pSocket != null) {
        //g_CCSendIndex++;
        //let pRoomObj = RoomMgr.GetUserRoomObj(pSocket.iUserId);
        //if (pRoomObj == null) return;

        // g_fs.writeFileSync(g_CCdir + '/' + pRoomObj.iRoomId + '_' + g_CCSendIndex + '.txt',
        //     JSON.stringify({
        //         szEvent: szEvent,
        //         pData: pData
        //     }),
        //     'utf-8');
        pSocket.emit(szEvent, pData);
    }
}

// // 发送消息
// function SendMsg(pSocket, szEvent, pData) {
//     if (pSocket != null) pSocket.emit(szEvent, pData);
// }

function SendMsgToUser(iUserId, szEvent, pData) {
    var pSocket = UserMgr.GetSocketObj(iUserId);
    if (pSocket != null) SendMsg(pSocket, szEvent, pData);
}

// 房间广播
function SendMsgToAll(pRoomObj, szEvent, pData, iNotSend) {
    for (var iIndex = 0; iIndex < pRoomObj.pPlayers.length; ++iIndex) {
        var iUserId = pRoomObj.pPlayers[iIndex].iUserId;
        if (iUserId == iNotSend) continue;
        if (iUserId != 0) SendMsgToUser(iUserId, szEvent, pData);
    }
    
    for (var iIndex = 0; iIndex < pRoomObj.pSeePlayers.length; ++iIndex) {
        var iUserId = pRoomObj.pSeePlayers[iIndex].iUserId;
        if (iUserId == iNotSend) continue;
        SendMsgToUser(iUserId, szEvent, pData);
    }
}

// 发送给指定用户集
function SendMsgToUsers(pUserIds, szEvent, pData) {
    for (var iIndex = 0; iIndex < pUserIds.length; ++iIndex) {
        SendMsgToUser(pUserIds[iIndex], szEvent, pData);
    }
}






// 当前玩家是否正在牌局进入中
function IsPlayingUser(pUserObj) {
    if (pUserObj == null) return false;

    // var SeatState = {
    //     SEAT_STATE_EMPTY: -1,    // 位置为空
    //     SEAT_STATE_REQSD: 0,     // 用户发出坐下请求
    //     SEAT_STATE_WAIT: 1,      // 用户等待中
    //     SEAT_STATE_READY: 2,     // 用户准备中
    //     SEAT_STATE_PLAY: 3,      // 常规游戏状态
    //     SEAT_STATE_REST: 4,      // 休牌状态
    //     SEAT_STATE_LOSE: 5,      // 弃牌
    //     SEAT_STATE_QIAO: 6,      // 敲钵钵了
    //     SEAT_STATE_SEEP: 7,      // 旁观状态
    // }

    if (pUserObj.iState == RoomMgr.SeatState.SEAT_STATE_PLAY) return true;
    if (pUserObj.iState == RoomMgr.SeatState.SEAT_STATE_REST) return true;
    if (pUserObj.iState == RoomMgr.SeatState.SEAT_STATE_LOSE) return true;
    if (pUserObj.iState == RoomMgr.SeatState.SEAT_STATE_QIAO) return true;

    return false;
}

// 获取在玩玩家
function GetPlayerObj(pRoomObj, iUserId) {
    var Result = null;

    //if (!pRoomObj.bRunning) return Result;
    if (pRoomObj.pGameObjEx == null) return Result;

    var pGameObjEx = pRoomObj.pGameObjEx;
    for (var iIndex = 0; iIndex < pGameObjEx.pPlayers.length; ++iIndex) {
        var pItem = pGameObjEx.pPlayers[iIndex];
        if (pItem.iUserId == iUserId) {
            Result = pItem;
            break;
        }
    }
    return Result;
}

// 改变当前用户
async function MoveNext(pRoomObj) {
    var pGameObj = pRoomObj.pGameObjEx;
    var pCursor = pGameObj.pCursor;

    console.log("MoveNext pCursor is null: " + pCursor == null);
    if (pCursor != null) console.log("1. MoveNext pCursor.iUserId:" + pCursor.iUserId);

    var iLoopTimes = 0;
    pGameObj.pCursor = pCursor.pNext;
    while (true) {
        if (pGameObj.pCursor.iState == RoomMgr.SeatState.SEAT_STATE_PLAY) break;

        if (pGameObj.pCursor.iState == RoomMgr.SeatState.SEAT_STATE_QIAO) {
            pGameObj.pCursor = pGameObj.pCursor.pNext;
            if (pGameObj.pCursor == pCursor) {
                console.log("MoveNext pGameObj.pCursor == pCursor break 1");
                break;
            }
            continue;
        }

        if (pGameObj.pCursor.iState == RoomMgr.SeatState.SEAT_STATE_REST) {
            var pStakeObj = RoomMgr.GetStakeObj(pRoomObj, pGameObj.pCursor.iUserId);
            if (pStakeObj.iJiFenYZ < pGameObj.iCurrentYZ) {
                pGameObj.pCursor.iState = RoomMgr.SeatState.SEAT_STATE_PLAY;    // 重置状态
                break;    // 休牌玩家后面的玩家加注了
            }
        }

        pGameObj.pCursor = pGameObj.pCursor.pNext;

        if (pGameObj.pCursor == pGameObj.pFirst) {
            ++pGameObj.iRoundNum;  // 走完几圈了
        }

        if (pGameObj.pCursor == pCursor) {
            console.log("MoveNext pGameObj.pCursor == pCursor break 2");
            break;
        }
    }

    if (pGameObj.pCursor != null) {
        console.log("3. MoveNext pCursor.iUserId:" + pGameObj.pCursor.iUserId);

        if (pGameObj.pCursor.iSHPMode == 1) {
            await OnLose({ iRoomId: pRoomObj.iRoomId, iUserId: pGameObj.pCursor.iUserId });
            await MoveNext(pRoomObj);
        }
    }
    console.log("MoveNext leave");

    return pGameObj.pCursor;
}

// 获取用户个人数据
function GetUserExtDataObj(pUserObj) {
    var Result = {}
    var pExtObj = pUserObj.pExtObj;
    if (pExtObj == null) {
        Result = {
            szTime: "",
            iTotoY: 0,      // 月均

            iZhongJuShu: 0,        // 总局数
            iZhongShouShu: 0,      // 总手数
            iRuChiLv: 0,           // 入池率   //pExtObj.iRuChiTimes
            iRuChiShenLv: 0,       // 放池胜率

            iTanPaiLv: 0,           // 摊牌率
            iTanPaiSLv: 0,         // 摊牌胜率
            iWinTimes: 0,           // 总共赢了多少局
            iFirstJZ: 0,   // 首轮加注率
            iFirstZJZ: 0,   // 首轮再加注率
            iMangGuoSLv: 0,  // 芒果胜率
            iJunChangDR: 0,        // 均场带入
            iJunChangZJ: 0,              // 均场输赢
        }
    }
    else {
        Result = {
            szTime: pExtObj.szTime,
            iTotoY: pExtObj.iTotoY,      // 月均

            iZhongJuShu: pExtObj.iGameTimes,        // 总局数
            iZhongShouShu: pExtObj.iPlayTimes,      // 总手数
            iRuChiLv: SysUtils.GenRandValue(15, 75),        // 入池率   //pExtObj.iRuChiTimes
            iRuChiShenLv: SysUtils.GenRandValue(13, 26),    // 入池率

            iTanPaiLv: pExtObj.iTanPaiLv,           // 摊牌率
            iTanPaiSLv: pExtObj.iTanPaiSLv,         // 摊牌胜率
            iWinTimes: pExtObj.iWinTimes,           // 总共赢了多少局
            iFirstJZ: (pExtObj.iFirstJZ / pExtObj.iPlayTimes).toFixed(2),   // 首轮加注率
            iFirstZJZ: (pExtObj.iFirstZJZ / pExtObj.iPlayTimes).toFixed(2),   // 首轮再加注率
            iMangGuoSLv: SysUtils.GenRandValue(5, 21),  // 芒果胜率
            iJunChangDR: parseInt(pExtObj.iTotalDR / pExtObj.iGameTimes),        // 均场带入
            iJunChangZJ: pExtObj.iJiFenSY,              // 均场输赢
        }
        if ((pExtObj.iTotalDR > 0) && (pExtObj.iGameTimes == 0)) {
            Result.iJunChangDR = pExtObj.iTotalDR;
        }
        if (Result.iJunChangDR == null) Result.iJunChangDR = pExtObj.iTotalDR;
    }

    return Result;
}

// 获取指定用户是否是指定俱乐部的 VIP
async function IsClubVIP(iUserId, iClubId) {
    var pRes = await dbCC.query("select isvip from tb_joinclubs where userid = $1 and clubid = $2", [iUserId, iClubId]);
    if (pRes.rows.length == 0) return false;
    return (pRes.rows[0].isvip > 0);
}


// 玩家掉线
async function OnDisconnect(pReqArgs) {
    console.log("OnDisconnect iUserId:" + pReqArgs.iUserId);

    var pRoomObj = RoomMgr.GetUserRoomObj(pReqArgs.iUserId);
    if (pRoomObj == null) return;

    var pUserObj = RoomMgr.GetUserObj(pRoomObj, pReqArgs.iUserId);
    if (pUserObj == null) return;

    var pItem = RoomMgr.GetJiFenObj(pRoomObj, pUserObj.iUserId);
    if (pItem != null) pItem.bOnline = false;

    pUserObj.bOnline = false;   // 掉线了
    if (pUserObj.iState == RoomMgr.SeatState.SEAT_STATE_SEEP) {
        RoomMgr.RemoveSeeUser(pRoomObj, pReqArgs.iUserId);
        await dbLGQ.update_user_roomid(pReqArgs.iUserId, 0, 0);
        SendMsgToAll(pRoomObj, "leave_notify", {
            wErrCode: ErrorCodes.ERR_NOERROR,
            szErrMsg: "操作成功",

            iUserId: pReqArgs.iUserId,
            iSeatIndex: -1
        });
    }

    console.log("OnDisconnect iRoomId:" + pRoomObj.iRoomId + ", iUserId:" + pReqArgs.iUserId);
}
exports.OnDisconnect = OnDisconnect;

// 获取用户超时动作剩余时间
function GetTimeOutInfo(pRoomObj, pUserObj) {
    var Result = {
        iMode: -1,   // 0:玩家申请上分, 1:留座剩余秒数, 2:休丢, 3:分牌
        iTimeLZ: TIME_OUT_REQSF_VALUE,      // 留桌超时
        iTimeAC: 0,                         // 动作超时(押注，丢，休，分牌)
    };

    var tmNow = new Date();
    if (pUserObj.tmReqTime != null) {    // 玩家申请上分状态
        Result.iMode = 0;
        var iVal = tmNow.getTime() - pUserObj.tmReqTime.getTime();

        Result.iTimeLZ = TIME_OUT_REQSF_VALUE - parseInt(iVal / 1000);    // 上分申请剩余秒数
        if (Result.iTimeLZ < 0) Result.iTimeLZ = 0;
    }
    else if (pUserObj.tmReqLZTimes != null) {    // 请求留座时间
        Result.iMode = 1;
        var iVal = tmNow.getTime() - pUserObj.tmReqLZTimes.getTime();

        Result.iTimeLZ = TIME_OUT_LZ_VALUE - parseInt(iVal / 1000);       // 留座剩余秒数
        if (Result.iTimeLZ < 0) Result.iTimeLZ = 0;
    }

    pUserObj = GetPlayerObj(pRoomObj, pUserObj.iUserId);
    if (pUserObj != null) {
        if (pUserObj.tmOptTimerPtr != null) {        // 玩家存在动作
            Result.iMode = 2;
            var iVal = tmNow.getTime() - pUserObj.tmOptTimerPtr.getTime();
    
            var iTimeVal = TIME_OUT_ACTION_VALUE;   // 休丢
            if (pUserObj.iOptCmd == 3) {
                Result.iMode = 3;
                iTimeVal = TIME_OUT_SPLIT_VALUE; // 分牌
                console.log("GetTimeOutInfo split time out:" + iTimeVal);
            }
    
            Result.iTimeAC = iTimeVal - parseInt(iVal / 1000);
            if (Result.iTimeAC < 0) Result.iTimeAC = 0;
        }
    }

    return Result;
}

// 获取同步数据
async function OnGetSyncData(pRoomObj, iFromUser) {
    console.log("GetSyncData iRoomId:" + pRoomObj.iRoomId);

    var pGameObj = pRoomObj.pGameObj;
    var pGameObjEx = pRoomObj.pGameObjEx;

    var bOpenJC = await dbLGQ.get_jcopen_state(pRoomObj.iAllId);
    var Result = {
        wErrCode: ErrorCodes.ERR_NOERROR,
        szErrMsg: "操作成功",
        iCreator: pRoomObj.iCreator,            // 房主
        iClubId: pRoomObj.iClubId,              // 俱乐部ID
        bOpenGame: pRoomObj.pRoomArgs.bRunning, // 房间是否已开局
        bRunning: pRoomObj.bRunning,            // 当前游戏是否进行中
        tmCreate: pRoomObj.tmCreate,            // 创建时间
        pRoomArgs: pRoomObj.pRoomArgs,          // 房间参数
        iBankerUser: 0,                         // (pGameObj != null) ? pGameObj.pBanker.iUserId : 0,
        iCursorUser: 0,                         // (pGameObj != null) ? pGameObj.pCursor.iUserId : 0,
        pSeePlayers: [],                        // 旁观玩家
        pSeatPlayers: [],                       // 坐位置的玩家
        iFreeSecond: pRoomObj.iSecond,          // 房间剩余有效时间
        iTimeSY: RoomMgr.GetRoomTimeSY(pRoomObj), // 房间还剩余多少秒删除
        iJiFenMGC: pGameObj.iJiFenMG,             // 芒果池
        iJiFenMGTimes: pGameObj.iJiFenMGTimes,    // 几芒了
        iJiFenPC: 0,                              // 皮池
        bOpenJC: bOpenJC,                         // 是否开启奖池
        iJiangChi: 0,                             // 奖池总金币
    }

    if (bOpenJC) {
        var pRes = await dbCC.query("select sum(golds) as jcgolds from tb_alliance_jiangchi where allianceid = $1", [pRoomObj.iAllId]);
        if (pRes.rows.length == 1) Result.iJiangChi = pRes.rows[0].jcgolds;
    }

    // 位置上的玩家
    for (var iIndex = 0; iIndex < pRoomObj.pPlayers.length; ++iIndex) {
        var pUserObj = pRoomObj.pPlayers[iIndex];
        if (pUserObj.iUserId == 0) continue;

        var pTimeOut = GetTimeOutInfo(pRoomObj, pUserObj);     // 玩家超时数据
        var pItem = {
            iSeatIndex: pUserObj.iSeatIndex,
            iUserId: pUserObj.iUserId,
            szAlias: pUserObj.szAlias,
            szHeadIco: pUserObj.szHeadIco,
            bSex: pUserObj.bSex,
            iGolds: pUserObj.iGolds,
            iState: pUserObj.iState,
            iSeatState: pUserObj.iState,    // 位置玩家状态
            iGameState: RoomMgr.SeatState.SEAT_STATE_WAIT,  // 坐起在位置上，但没在牌局中
            fLon: pUserObj.fLon,
            fLat: pUserObj.fLat,
            bOnline: pUserObj.bOnline,

            iSplitMode: 0,           // 0:未分牌阶段, 1:未分牌, 2:已分牌
            iTimeOutLZ: 0,           // 留桌超时
            iTimeOutAC: 0,           // 休丢超时
            iTimeOutFP: 0,           // 分牌超时

            bLiuZuo: pUserObj.bLiuZuo,              // 玩家是否请求了留座
            tmReqLZTimes: pUserObj.tmReqLZTimes,    // 请求留座时间

            pExtObj: GetUserExtDataObj(pUserObj),
        }
        if (pTimeOut.iMode == 0 || pTimeOut.iMode == 1) {    // 玩家申请上分
            pItem.iTimeOutLZ = pTimeOut.iTimeLZ;
        }
        else if (pTimeOut.iMode == 2) { // 休丢
            pItem.iTimeOutAC = pTimeOut.iTimeAC;
        }
        else if (pTimeOut.iMode == 3) {
            pItem.iTimeOutFP = pTimeOut.iTimeAC;
        }

        // var tmNow = new Date();
        // if (pUserObj.tmVipEnd.getTime() < tmNow.getTime()) {
        //     var pExtObj = pItem.pExtObj;
        //     pExtObj.iTanPaiLv = "-";
        //     pExtObj.iTanPaiSLv = "-";
        //     pExtObj.iWinTimes = "-";
        //     pExtObj.iFirstJZ = "-";
        //     pExtObj.iFirstZJZ = "-";
        //     pExtObj.iMangGuoSLv = "-";
        //     pExtObj.iJunChangDR = "-";
        //     pExtObj.iJunChangZJ = "-";
        // }

        if (pUserObj.tmReqTime != null) {
            var tmNow = new Date();
            pItem.iReqSeatTimeOut = 180 - (tmNow.getTime() - pUserObj.tmReqTime.getTime()) / 1000;
            if (pItem.iReqSeatIndex < 0) pItem.iReqSeatTimeOut = 0;
        }

        var pJiFenObj = RoomMgr.GetJiFenObj(pRoomObj, pUserObj.iUserId);
        if (pJiFenObj == null) {
            pJiFenObj = {
                iJiFenDR: 0,
                iJiFenCDR: 0,
                iJiFenYQ: 0,
                iJiFen: 0
            };
        }

        pItem.iJiFenDR = pJiFenObj.iJiFenDR;
        pItem.iJiFenCDR = pJiFenObj.iJiFenCDR;
        pItem.iJiFenYQ = pJiFenObj.iJiFenYQ;
        pItem.iJiFen = pJiFenObj.iJiFen;

        var pPlayer = GetPlayerObj(pRoomObj, pUserObj.iUserId);
        if (IsPlayingUser(pPlayer)) {
            pItem.iJiFen = pPlayer.iOrgJiFen;   // 本局开始时的玩家积分
            pItem.iGameState = pPlayer.iState;  // 玩家游戏状态 (正在玩，敲，休，丢)
        }

        var pStakeObj = RoomMgr.GetStakeObj(pRoomObj, pUserObj.iUserId);
        if (pStakeObj != null) {
            pItem.iJiFenMG = pStakeObj.iJiFenMG;
            pItem.iJiFenYZ = pStakeObj.iJiFenYZ;

            if (pUserObj.iState == RoomMgr.SeatState.SEAT_STATE_LOSE) Result.iJiFenPC += pItem.iJiFenYZ;
        }

        Result.pSeatPlayers.push(pItem);
    }

    // 旁观玩家
    for (var iIndex = 0; iIndex < pRoomObj.pSeePlayers.length; ++iIndex) {
        var pUserObj = pRoomObj.pSeePlayers[iIndex];

        var pItem = {
            iSeatIndex: pUserObj.iSeatIndex,
            iUserId: pUserObj.iUserId,
            szAlias: pUserObj.szAlias,
            szHeadIco: pUserObj.szHeadIco,
            bSex: pUserObj.bSex,
            iGolds: pUserObj.iGolds,
            iState: pUserObj.iState,
            iTimeOutLZ: TIME_OUT_LZ_VALUE,       // 留桌超时
            iTimeOutAC: 0,       // 动作超时
            fLon: pUserObj.fLon,
            fLat: pUserObj.fLat,
            bOnline: pUserObj.bOnline,
            pExtObj: GetUserExtDataObj(pUserObj),
        }

        // var tmNow = new Date();
        // if (pUserObj.tmVipEnd.getTime() < tmNow.getTime()) {
        //     var pExtObj = pItem.pExtObj;
        //     pExtObj.iTanPaiLv = "-";
        //     pExtObj.iTanPaiSLv = "-";
        //     pExtObj.iWinTimes = "-";
        //     pExtObj.iFirstJZ = "-";
        //     pExtObj.iFirstZJZ = "-";
        //     pExtObj.iMangGuoSLv = "-";
        //     pExtObj.iJunChangDR = "-";
        //     pExtObj.iJunChangZJ = "-";
        // }

        var pJiFenObj = RoomMgr.GetJiFenObj(pRoomObj, pUserObj.iUserId);
        if (pJiFenObj == null) {
            pJiFenObj = {
                iJiFenDR: 0,
                iJiFenCDR: 0,
                iJiFenYQ: 0,
                iJiFen: 0,
            };
        }

        pItem.iJiFenDR = pJiFenObj.iJiFenDR;
        pItem.iJiFenCDR = pJiFenObj.iJiFenCDR;
        pItem.iJiFenYQ = pJiFenObj.iJiFenYQ;
        pItem.iJiFen = pJiFenObj.iJiFen;

        Result.pSeePlayers.push(pItem);
    }

    if (pGameObjEx != null) {
        if (pGameObjEx.pBanker != null) Result.iBankerUser = pGameObjEx.pBanker.iUserId;
        if (pGameObjEx.pCursor != null) Result.iCursorUser = pGameObjEx.pCursor.iUserId;
    }

    if (Result.bRunning) {
        for (var iIndex = 0; iIndex < pRoomObj.pPlayers.length; ++iIndex) {
            if (pRoomObj.pPlayers[iIndex].iUserId == 0) continue;

            var pItem = GetPlayerObj(pRoomObj, pRoomObj.pPlayers[iIndex].iUserId);
            if (pItem == null) continue;
            if (pItem.pPais == null) continue;

            for (var iPos = 0; iPos < Result.pSeatPlayers.length; ++iPos) {
                var pUserObj = Result.pSeatPlayers[iPos];
                if (pUserObj.iUserId == pItem.iUserId) {
                    pUserObj.pPais = pItem.pPais.concat();
                    pUserObj.pShowIdx = pItem.pShowIdx.concat();

                    if (pGameObjEx.szState == "split") {
                        if (pItem.pPais1 == null) {
                            pUserObj.iSplitMode = 1;
                        }
                        else {
                            pUserObj.iSplitMode = 2;
                        }
                    }

                    if (pItem.pPais1 != null) {
                        pUserObj.pPais1 = pItem.pPais1;
                        pUserObj.pPais2 = pItem.pPais2;
                    }
                    break;
                }
            }
        }

        var pGameObjEx = pRoomObj.pGameObjEx;
        if (pGameObjEx.pCursor != null) {
            await SendOperator(pRoomObj, pGameObjEx.pCursor, pGameObjEx.bCanXIU, true, true, false, true, iFromUser);
        }
    }

    return Result;
}


// 解散房间
async function OnJieSan(pReqArgs) {
    console.log("OnJieSan iRoomId:" + pReqArgs.iRoomId + ", iUserId:" + pReqArgs.iUserId);

    var pRoomObj = RoomMgr.GetRoomObj(pReqArgs.iRoomId);
    if (pRoomObj == null) {
        SendMsg(pReqArgs.pSocket, "jiesan_result", {
            wErrCode: ErrorCodes.ERR_ROOMISNOTEXISTS,
            szErrMsg: "房间不存在"
        });
        return;
    }

    var pUserObj = RoomMgr.GetUserObj(pRoomObj, pReqArgs.iUserId);
    if (pUserObj == null) return;

    if (pUserObj.iUserId != pRoomObj.iCreator) {
        SendMsg(pReqArgs.pSocket, "jiesan_result", {
            wErrCode: ErrorCodes.ERR_ERRORAUTHORITY,
            szErrMsg: "只有房主才能解散房间"
        });
        return;
    }

    var pGameObj = pRoomObj.pGameObj;
    // if (pGameObj.iJiFenMG > 0) {
    //     SendMsg(pReqArgs.pSocket, "jiesan_result", {
    //         wErrCode: ErrorCodes.ERR_INVOKE_FALIED,
    //         szErrMsg: "不能解散有芒果分的房间"
    //     });
    //     return;
    // }

    if (pRoomObj.bRunning) {
        SendMsgToAll(pRoomObj, "jiesan_result", {
            wErrCode: ErrorCodes.ERR_WAITGAMEOVER,
            szErrMsg: "房间解散时芒果将会被系统回收",
            iReqUser: pUserObj.iUserId,
        });
        pRoomObj.bJieSan = true;
        return;
    }

    // SendMsgToAll(pRoomObj, "jiesan_result", {
    //     wErrCode: ErrorCodes.ERR_WAITGAMEOVER,
    //     szErrMsg: "",
    //     iReqUser: pUserObj.iUserId,
    // });

    pRoomObj.iJieSanMode = 1;
    pRoomObj.bCanDel = true;
    pRoomObj.bDelete = true;
    pRoomObj.bRunning = false;
    pRoomObj.iSecond = pRoomObj.iDelSec;
    pRoomObj.pRoomArgs.iDelTimes = 0;
}

// 自定义消息
async function OnCustomNotify(pReqArgs) {
    console.log("OnCustomNotify iRoomId:" + pReqArgs.iRoomId + ", iUserId:" + pReqArgs.iUserId);

    var pRoomObj = RoomMgr.GetRoomObj(pReqArgs.iRoomId);
    if (pRoomObj == null) {
        SendMsg(pReqArgs.pSocket, "user_notify", {
            wErrCode: ErrorCodes.ERR_ROOMISNOTEXISTS,
            szErrMsg: "房间不存在"
        });
        return;
    }

    pReqArgs.iUserId = parseInt(pReqArgs.iUserId);
    var pData = pReqArgs.pData;
    if (pData == null) return;
    if (pData.sign == null) return;

    switch (pData.sign) {
        case 0: // 免费表情
            {
            }
            break;
        case 1: // 收费表情
            {
                var pUserObj = RoomMgr.GetUserObj(pRoomObj, pReqArgs.iUserId);
                if (pUserObj != null) {
                    var iGolds = await dbLGQ.get_user_golds(pReqArgs.iUserId);
                    if (iGolds < 10) {
                        SendMsg(pReqArgs.pSocket, "golds_noten_result", {
                            wErrCode: ErrorCodes.ERR_NOTENOUGHGOLDS,
                            szErrMsg: "金币不足"
                        });
                        return;
                    }

                    await dbLGQ.add_user_golds(pReqArgs.iUserId, -10);
                    pUserObj.iGolds = iGolds - 10;

                    SendMsg(pReqArgs.pSocket, "golds_change_result", {
                        wErrCode: ErrorCodes.ERR_NOERROR,
                        szErrMsg: "操作成功",
                        iGolds: iGolds - 10
                    });
                }
            }
            break;
        case 2: // 语音
            if (pRoomObj.pJingYanUsers.indexOf(pReqArgs.iUserId) == -1) {
                var pUserObj = RoomMgr.GetUserObj(pRoomObj, pReqArgs.iUserId);
                if (pUserObj == null) break;
                if (pUserObj.iSeatIndex == -1) break;
                pUserObj.pVoice = {
                    wErrCode: ErrorCodes.ERR_NOERROR,
                    szErrMsg: "操作成功",
                    iFromUser: pReqArgs.iUserId,
                    pData: pReqArgs.pData
                };;
            }
            break;
    }

    var pMsg = {
        wErrCode: ErrorCodes.ERR_NOERROR,
        szErrMsg: "操作成功",
        iFromUser: pReqArgs.iUserId,
        pData: pReqArgs.pData
    };
    SendMsgToAll(pRoomObj, "user_notify", pMsg);
}

// 语音回放
async function OnPlayVoice(pReqArgs) {
    var pRoomObj = RoomMgr.GetRoomObj(pReqArgs.iRoomId);
    if (pRoomObj == null) {
        SendMsg(pReqArgs.pSocket, "playvoice_result", {
            wErrCode: ErrorCodes.ERR_ROOMISNOTEXISTS,
            szErrMsg: "房间不存在"
        });
        return;
    }

    var pUserObj = RoomMgr.GetUserObj(pRoomObj, pReqArgs.iDestUser);
    if (pUserObj == null) {
        SendMsg(pReqArgs.pSocket, "playvoice_result", {
            wErrCode: ErrorCodes.ERR_USERISNOTEXISTS,
            szErrMsg: "玩家不存在"
        });
        return;
    }

    if (pUserObj.iSeatIndex == -1) {
        SendMsg(pReqArgs.pSocket, "playvoice_result", {
            wErrCode: ErrorCodes.ERR_USERISNOTEXISTS,
            szErrMsg: "玩家不存在"
        });
        return;
    }

    if (pUserObj.pVoice == null) {
        SendMsg(pReqArgs.pSocket, "playvoice_result", {
            wErrCode: ErrorCodes.ERR_INVOKE_FALIED,
            szErrMsg: "没有语音数据"
        });
        return;
    }

    SendMsg(pReqArgs.pSocket, "playvoice_result", pUserObj.pVoice);
}

// 玩家进入房间事件
async function OnEnterRoom(pReqArgs) {
    console.log("OnEnterRoom iClubId:" + pReqArgs.iClubId + ", iRoomId:" +
        pReqArgs.iRoomId + ", iUserId:" + pReqArgs.iUserId +
        ", socket.id:" + pReqArgs.pSocket.id);

    if (pReqArgs.iClubId == null || pReqArgs.iClubId == 0) {
        SendMsg(pReqArgs.pSocket, "enter_result", {
            wErrCode: ErrorCodes.ERR_ROOMISNOTEXISTS,
            szErrMsg: "参数错误，无效俱乐部ID"
        });
        return;
    }

    var pRoomObj = RoomMgr.GetRoomObj(pReqArgs.iRoomId);
    if (pRoomObj == null) {
        SendMsg(pReqArgs.pSocket, "enter_result", {
            wErrCode: ErrorCodes.ERR_ROOMISNOTEXISTS,
            szErrMsg: "房间不存在"
        });
        return;
    }

    // if (pRoomObj == null) {
    //     HTTP.HTTPGet("/getroominfo", { iRoomId: pReqArgs.iRoomId }, function (pRetObj) {
    //         if (pRetObj.wErrCode == ErrorCodes.ERR_NOERROR) {
    //             OnEnterRoom(pReqArgs);
    //         }
    //         else {
    //             SendMsg(pReqArgs.pSocket, "enter_result", {
    //                 wErrCode: ErrorCodes.ERR_ROOMISNOTEXISTS,
    //                 szErrMsg: "房间不存在"
    //             });
    //         }
    //     });
    //     return;
    // }

    if (pReqArgs.fLon == null) pReqArgs.fLon = 0;
    if (pReqArgs.fLat == null) pReqArgs.fLat = 0;

    pReqArgs.iUserId = parseInt(pReqArgs.iUserId);

    var pUserInfo = await dbLGQ.get_user_info(pReqArgs.iUserId);
    if (pUserInfo == null) {
        SendMsg(pReqArgs.pSocket, "enter_result", {
            wErrCode: ErrorCodes.ERR_USERISNOTEXISTS,
            szErrMsg: "用户不存在"
        });
        return;
    }

    pUserInfo.golds = parseInt(pUserInfo.golds);
    pUserInfo.gems = parseInt(pUserInfo.gems);
    pUserInfo.opengps = parseInt(pUserInfo.opengps);
    g_pOpenGPSMaps[pUserInfo.userid] = (pUserInfo.opengps != 0);

    var pUserObj = RoomMgr.GetUserObj(pRoomObj, pReqArgs.iUserId);
    if (pUserObj == null) {
        // if (pRoomObj.pRoomArgs.iNoXDR > 0) {
        //     var iNoXDR = pRoomObj.pRoomArgs.iNoXDR * 60; // 房间剩余多少分钟时禁止新玩家带入 (0, 5分钟, 10分钟, 15分钟, 20分钟) 
        //     if (pRoomObj.iSecond < iNoXDR) {
        //         SendMsg(pReqArgs.pSocket, "enter_result", {
        //             wErrCode: ErrorCodes.ERR_ISCANNOTENTERTIME,
        //             szErrMsg: "带入时间已过"
        //         });
        //         return;
        //     }
        // }
    
        var pJiFenObj = RoomMgr.GetJiFenObj(pRoomObj, pUserInfo.userid);
        if (pJiFenObj == null) pJiFenObj = { iJiFen: 0, iJiFenDR: 0 };
        var pPlayerObj = GetPlayerObj(pRoomObj, pUserInfo.userid);
        if (pPlayerObj != null) {
            if (pPlayerObj.iOrgJiFen != null) pJiFenObj.iJiFen = pPlayerObj.iOrgJiFen;
        }

        pUserObj = {
            iUserId: pUserInfo.userid,
            szAlias: pUserInfo.alias,
            szHeadIco: pUserInfo.headico,
            bSex: pUserInfo.sex,
            iGolds: pUserInfo.golds,
            iLevels: pUserInfo.levels,
            iEnterClubId: pReqArgs.iClubId,
            tmVipEnd: pUserInfo.vipendtime,
            pExtObj: DB.get_user_extdata(pUserInfo),
            fLon: pReqArgs.fLon,
            fLat: pReqArgs.fLat,
    
            iJiFen: pJiFenObj.iJiFen,
            iJiFenDR: pJiFenObj.iJiFenDR
        }
    
        RoomMgr.EnterRoom(pRoomObj, pUserObj);
    }
    else {
        pUserObj.fLon = pReqArgs.fLon;
        pUserObj.fLat = pReqArgs.fLat;
        pUserObj.szAlias = pUserInfo.alias;
    }
    UserMgr.Add(pReqArgs.iUserId, pReqArgs.pSocket);
    
    var pRetObj = await OnGetSyncData(pRoomObj, pReqArgs.iUserId);
    // var pClubInfo = await dbLGQ.get_club_info_with_id(pRoomObj.iClubId);
    // if (pClubInfo != null) pRoomObj.szClubName = pClubInfo.sname;

    var pAdminUserIds = await dbLGQ.get_club_adminusers(pRoomObj.iClubId);
    if (pReqArgs.iClubId > 0) {
        var pClubAdmins = await dbLGQ.get_club_adminusers(pReqArgs.iClubId);
        pAdminUserIds = pAdminUserIds.concat(pClubAdmins);
    }

    for (var iIndex = 0; iIndex < pRetObj.pSeePlayers.length; ++iIndex) {
        var pItem = pRetObj.pSeePlayers[iIndex];
        pItem.bAdminUser = (pAdminUserIds.indexOf(pItem.iUserId) >= 0);  // 是否是房间管理员
    }

    for (var iIndex = 0; iIndex < pRetObj.pSeatPlayers.length; ++iIndex) {
        var pItem = pRetObj.pSeatPlayers[iIndex];
        pItem.bAdminUser = (pAdminUserIds.indexOf(pItem.iUserId) >= 0);  // 是否是房间管理员
    }

    pUserObj = RoomMgr.GetUserObj(pRoomObj, pReqArgs.iUserId);
    var pItem = pRoomObj.pRoomPlayers[pReqArgs.iUserId];
    if (pItem != null) pItem.bOnline = true;

    pRetObj.bAdminUser = (pAdminUserIds.indexOf(pReqArgs.iUserId) >= 0);

    //console.log(JSON.stringify(pRetObj));
    SendMsg(pReqArgs.pSocket, "enter_result", pRetObj);

    var pNotifyObj = {
        wErrCode: ErrorCodes.ERR_NOERROR,
        szErrMsg: "操作成功",
        iCreator: pRoomObj.iCreator,
        iSeatIndex: pUserObj.iSeatIndex,
        iUserId: pUserObj.iUserId,
        szAlias: pUserObj.szAlias,
        szHeadIco: pUserObj.szHeadIco,
        bSex: pUserObj.bSex,
        iGolds: pUserObj.iGolds,
        iLevels: pUserObj.iLevels,
        iState: pUserObj.iState,
        bAdminUser: pRetObj.bAdminUser,  // 是否是房间管理员
        bOnline: pUserObj.bOnline,
        pExtObj: GetUserExtDataObj(pUserObj),
        bLookOn: pUserObj.iState == RoomMgr.SeatState.SEAT_STATE_SEEP
    };

    SendMsgToAll(pRoomObj, "enter_notify", pNotifyObj); //, pNotifyObj.iUserId);

    await dbLGQ.update_user_roomid(pUserObj.iUserId, pRoomObj.iRoomId, pReqArgs.iClubId);
    await NotifyPaiJuLogs(pReqArgs.pSocket, pRoomObj, -1);
}

// 玩家更新经纬度
async function OnSetLonLat(pReqArgs) {
    console.log("OnSetLonLat iRoomId:" + pReqArgs.iRoomId + ", iUserId:" + pReqArgs.iUserId);
    var pRoomObj = RoomMgr.GetRoomObj(pReqArgs.iRoomId);
    if (pRoomObj == null) {
        SendMsg(pReqArgs.pSocket, "setjwd_result", {
            wErrCode: ErrorCodes.ERR_ROOMISNOTEXISTS,
            szErrMsg: "房间不存在"
        });
        return;
    }

    var pUserObj = RoomMgr.GetUserObj(pRoomObj, pReqArgs.iUserId);
    if (pUserObj == null) {
        SendMsg(pReqArgs.pSocket, "setjwd_result", {
            wErrCode: ErrorCodes.ERR_USERISNOTEXISTS,
            szErrMsg: "用户不在房间中"
        });
        return;
    }

    pUserObj.fLon = pReqArgs.fLon;
    pUserObj.fLat = pReqArgs.fLat;
    
    var pDists = GetPlayerDistObjs(pRoomObj);
    SendMsgToAll(pRoomObj, "dists_warn_notify", pDists);
}

// 获取房间冲了分的用户与旁观用户
async function OnGetRoomPlayers(pReqArgs) {
    var pRoomObj = RoomMgr.GetRoomObj(pReqArgs.iRoomId);
    if (pRoomObj == null) {
        console.log("OnGetRoomPlayers 1");
        SendMsg(pReqArgs.pSocket, "roomplayers_result", {
            wErrCode: ErrorCodes.ERR_ROOMISNOTEXISTS,
            szErrMsg: "房间不存在"
        });
        return;
    }

    var pUserObj = RoomMgr.GetUserObj(pRoomObj, pReqArgs.iUserId);
    if (pUserObj == null) return;

    var pUserMaps = {};
    var pJiFenUesrs = [];
    var pSeePlayers = [];

    for (var sKey in pRoomObj.pRoomPlayers) {
        var pJiFenObj = pRoomObj.pRoomPlayers[sKey];

        var pGroup = pUserMaps[pJiFenObj.iClubId];
        if (pGroup == null) {
            pGroup = {
                iClubId: pJiFenObj.iClubId,
                szClubName: pJiFenObj.szClubName,
                pUserObjs: []
            }
            pUserMaps[pJiFenObj.iClubId] = pGroup;
        }

        var iJiFen = pJiFenObj.iJiFen;
        var iUserId = parseInt(sKey);
        var pPlayerObj = GetPlayerObj(pRoomObj, iUserId);
        if (pPlayerObj != null) {
            if (pPlayerObj.iOrgJiFen != null) {
                iJiFen = pPlayerObj.iOrgJiFen;
            }

            var pStakeObj = RoomMgr.GetStakeObj(pRoomObj, iUserId);
            if (pStakeObj != null) {
                iJiFen += pStakeObj.iJiFenMG;
            }
        }

        var bOnline = false;
        var pUserObj = RoomMgr.GetUserObj(pRoomObj, iUserId);
        if (pUserObj != null) {
            if (pUserObj.iSeatIndex != -1) bOnline = true;
        }

        var pItem = {
            iUserId: iUserId,
            szAlias: pJiFenObj.szAlias,
            szHeadIco: pJiFenObj.szHeadIco,
            iJiFen: iJiFen,
            iJiFenDR: pJiFenObj.iJiFenCDR, //pJiFenObj.iJiFenDR,
            iJiFenSY: iJiFen - pJiFenObj.iJiFenCDR, // pJiFenObj.iJiFenSY
            bOnline:  bOnline,  //UserMgr.IsOnline(sKey)
        };
        pGroup.pUserObjs.push(pItem);
        pJiFenUesrs.push(pItem);

        // if (bOnline) {
        //     pSeePlayers.push()
        // }
    }

    for (var iIndex = 0; iIndex < pRoomObj.pSeePlayers.length; ++iIndex) {
        var pItem = pRoomObj.pSeePlayers[iIndex];
        pSeePlayers.push({
            iUserId: pItem.iUserId,
            szAlias: pItem.szAlias,
            szHeadIco: pItem.szHeadIco
        });

        //console.log(pSeePlayers[pSeePlayers.length - 1]);
    }

    // 排序
    for (var sKey in pUserMaps) {
        var pGroup = pUserMaps[sKey];
        pGroup.pUserObjs.sort(function (left, right) {
            return right.iJiFenSY - left.iJiFenSY;
        });
    }

    pJiFenUesrs.sort(function(left, right) {
        return right.iJiFenSY - left.iJiFenSY;
    });

    SendMsg(pReqArgs.pSocket, "roomplayers_result", {
        pUserMaps: pUserMaps,       // 按俱乐部分组排序
        pJiFenUesrs: pJiFenUesrs,   // 所有上分玩家排序
        pSeePlayers: pSeePlayers,   // 旁观
        iTimeSY: RoomMgr.GetRoomTimeSY(pRoomObj), // 房间还剩余多少秒删除
    });
}

// 管理员踢人
async function OnKillUser(pReqArgs) {
    var pRoomObj = RoomMgr.GetRoomObj(pReqArgs.iRoomId);
    if (pRoomObj == null) {
        console.log("OnKillUser iRoomId:" + pReqArgs.iRoomId + " 房间不存在");
        SendMsg(pReqArgs.pSocket, "killuser_result", {
            wErrCode: ErrorCodes.ERR_ROOMISNOTEXISTS,
            szErrMsg: "房间不存在"
        });
        return;
    }

    var pUserObj = RoomMgr.GetUserObj(pRoomObj, pReqArgs.iUserId);
    if (pUserObj == null) {
        console.log("OnKillUser iAdminUser:" + pReqArgs.iUserId + " 没在房间里面");
        return;
    }

    var pDestUser = RoomMgr.GetUserObj(pRoomObj, pReqArgs.iDestUser);
    if (pDestUser == null) {
        console.log("OnKillUser iAdminUser:" + pReqArgs.iDestUser + " 没在房间里面");
        return;
    };

    if (pDestUser.iSeatIndex == -1) {
        console.log("OnKillUser iAdminUser:" + pReqArgs.iDestUser + " 没在房间里面");
        return;
    };

    var pJiFenObj = RoomMgr.GetJiFenObj(pRoomObj, pReqArgs.iDestUser);
    if (pJiFenObj == null) {
        console.log("OnKillUser iAdminUser:" + pReqArgs.iDestUser + " 没上分");
        return;
    }

    var pClubIds = await dbLGQ.get_club_by_adminuser(pReqArgs.iUserId);
    if (pClubIds.indexOf(pJiFenObj.iClubId) == -1) {
        SendMsg(pReqArgs.pSocket, "killuser_result", {
            wErrCode: ErrorCodes.ERR_INVOKE_FALIED,
            szErrMsg: "只能踢本俱乐部的人"
        });
        return;
    }

    if (!pRoomObj.bRunning) {
        OnSitup({
            iRoomId: pRoomObj.iRoomId,
            iUserId: pReqArgs.iDestUser,
            pSocket: UserMgr.GetSocketObj(pReqArgs.iDestUser)
        });

        SendMsg(pReqArgs.pSocket, "killuser_result", {
            wErrCode: ErrorCodes.ERR_NOERROR,
            szErrMsg: "操作成功"
        });
        RoomMgr.AddKillUser(pRoomObj, pDestUser.iUserId);
    }
    else {
        var pPlayerObj = RoomMgr.GetPlayerObj(pRoomObj, pDestUser.iUserId);
        if (pPlayerObj == null) {   // 玩家不在牌局中
            OnSitup({
                iRoomId: pRoomObj.iRoomId,
                iUserId: pReqArgs.iDestUser,
                pSocket: UserMgr.GetSocketObj(pReqArgs.iDestUser)
            });
    
            SendMsg(pReqArgs.pSocket, "killuser_result", {
                wErrCode: ErrorCodes.ERR_NOERROR,
                szErrMsg: "操作成功"
            });
            RoomMgr.AddKillUser(pRoomObj, pDestUser.iUserId);
            return;
        }

        if ((pPlayerObj.iState != RoomMgr.SeatState.SEAT_STATE_PLAY) && (pPlayerObj.iState != RoomMgr.SeatState.SEAT_STATE_REST) &&
            (pPlayerObj.iState != RoomMgr.SeatState.SEAT_STATE_QIAO)) {

            OnSitup({
                iRoomId: pRoomObj.iRoomId,
                iUserId: pReqArgs.iDestUser,
                pSocket: UserMgr.GetSocketObj(pReqArgs.iDestUser)
            });
    
            SendMsg(pReqArgs.pSocket, "killuser_result", {
                wErrCode: ErrorCodes.ERR_NOERROR,
                szErrMsg: "操作成功"
            });
            RoomMgr.AddKillUser(pRoomObj, pDestUser.iUserId);
        }
        else {
            pDestUser.bKill = true;
            SendMsg(pReqArgs.pSocket, "killuser_result", {
                wErrCode: ErrorCodes.ERR_NOERROR,
                szErrMsg: "操作成功"
            });
        }
    }
}

// 检查是否自动开始游戏
function CheckAutoStartGame(pRoomObj) {
    if (pRoomObj.bRunning) {
        console.log("CheckAutoStartGame 1");
        return;
    }

    var iPlayerNum = 0;
    var pRoomArgs = pRoomObj.pRoomArgs;
    var iMinJiFen = pRoomArgs.iBaseFen * 2 + pRoomObj.pGameObj.iNextMG;

    for (var iIndex = 0; iIndex < pRoomObj.pPlayers.length; ++iIndex) {
        var pUserObj = pRoomObj.pPlayers[iIndex];
        if (pUserObj.iUserId == 0) continue;

        if (pUserObj.bLiuZuo || pUserObj.pLZTimerPtr != null) continue;

        var pJiFenObj = RoomMgr.GetJiFenObj(pRoomObj, pUserObj.iUserId);
        if (pJiFenObj == null) continue;

        //console.log("CheckAutoStartGame iUserId:" + pUserObj.iUserId + ", iState:" + pUserObj.iState);
        if (pUserObj.iState == RoomMgr.SeatState.SEAT_STATE_WAIT || pUserObj.iState == RoomMgr.SeatState.SEAT_STATE_READY) {
            if (pJiFenObj.iJiFen >= iMinJiFen) iPlayerNum += 1;
        }
    }

    console.log("CheckAutoStartGame pRoomArgs.bRunning:" + pRoomArgs.bRunning + ", pRoomArgs.iAutoStart:" + pRoomArgs.iAutoStart);
    console.log("CheckAutoStartGame iPlayerNum:" + iPlayerNum);
    if (pRoomArgs.bRunning) {
        if ((iPlayerNum >= 2) && (pRoomObj.pTimerPtr == null)) {
            var pReqArgs = {
                iRoomId: pRoomObj.iRoomId,
                iUserId: pRoomObj.iCreator,
                pSocket: null
            };

            var iTimeOut = TIME_OUT_START_VALUE;
            if (pRoomObj.iGTimes == 0) iTimeOut = 2;

            pRoomObj.pTimerPtr = setTimeout(OnStart, iTimeOut * 1000, pReqArgs);
        };
    }
    else if ((pRoomArgs.iAutoStart > 0) && (iPlayerNum >= pRoomArgs.iAutoStart)) {
        var pReqArgs = {
            iRoomId: pRoomObj.iRoomId,
            iUserId: pRoomObj.iCreator,
            pSocket: null
        };

        //var iTimeOut = TIME_OUT_START_VALUE;
        //if (pRoomObj.iGTimes == 0) iTimeOut = 2;
        pRoomObj.pTimerPtr = setTimeout(OnStart, 1000, pReqArgs);
    }

}

// 检查是否中断自动开局定时器
function CheckStopAutoStartGame(pRoomObj) {
    if (pRoomObj.bRunning) return;

    var iPlayerNum = 0;
    var iMinJiFen = pRoomObj.pRoomArgs.iBaseFen * 2 + pRoomObj.pGameObj.iNextMG;
    for (var iIndex = 0; iIndex < pRoomObj.pPlayers.length; ++iIndex) {
        var pUserObj = pRoomObj.pPlayers[iIndex];
        if (pUserObj.iUserId == 0) continue;
        if (pUserObj.bLiuZuo || pUserObj.pLZTimerPtr != null) continue;

        var pJiFenObj = RoomMgr.GetJiFenObj(pRoomObj, pUserObj.iUserId);
        if (pJiFenObj == null) continue;

        if (pUserObj.iState == RoomMgr.SeatState.SEAT_STATE_WAIT) {
            if (pJiFenObj.iJiFen >= iMinJiFen) iPlayerNum += 1;
        }
    }

    if ((iPlayerNum < 2) && (pRoomObj.pTimerPtr != null)) {
        clearTimeout(pRoomObj.pTimerPtr);
        delete pRoomObj.pTimerPtr;
    };
}

// 玩家离开房间事件
async function OnLeaveRoom(pReqArgs) {
    console.log("OnLeaveRoom iUserId:" + pReqArgs.iUserId);

    var pRoomObj = RoomMgr.GetRoomObj(pReqArgs.iRoomId);
    if (pRoomObj == null) {
        delete g_pOpenGPSMaps[pReqArgs.iUserId];

        await dbLGQ.update_user_roomid(pReqArgs.iUserId, 0, 0);
        SendMsg(pReqArgs.pSocket, "leave_result", {
            wErrCode: ErrorCodes.ERR_ROOMISNOTEXISTS,
            szErrMsg: "房间不存在"
        });
        return;
    }

    console.log("OnLeaveRoom iRoomId:" + pRoomObj.iRoomId + ", iUserId:" + pReqArgs.iUserId);

    var pUserObj = RoomMgr.GetUserObj(pRoomObj, pReqArgs.iUserId);
    if (pUserObj == null) {
        SendMsg(pReqArgs.pSocket, "leave_result", {
            wErrCode: ErrorCodes.ERR_NOERROR,
            szErrMsg: "操作成功"
        });

        delete g_pOpenGPSMaps[pReqArgs.iUserId];
        await dbLGQ.update_user_roomid(pReqArgs.iUserId, 0, 0);
        console.log("OnLeaveRoom iRoomId:" + pRoomObj.iRoomId + ", iUserId:" + pReqArgs.iUserId + " is not in this room");
        return;
    }
    var iSeatIndex = pUserObj.iSeatIndex;

    console.log("OnLeaveRoom iState:" + pUserObj.iState);
    var pPlayerObj = GetPlayerObj(pRoomObj, pUserObj.iUserId);
    if (IsPlayingUser(pPlayerObj)) {
        if (pPlayerObj.iState != RoomMgr.SeatState.SEAT_STATE_LOSE) {
            if (pPlayerObj == pRoomObj.pGameObjEx.pCursor) {    // 如果是当前玩家在没有丢牌时退出房间，则认为玩家丢牌退出
                OnLose(pReqArgs);

                setTimeout(async function(pRoomObj, iUserId, iSeatIndex) {
                    delete g_pOpenGPSMaps[iUserId];

                    await dbLGQ.update_user_roomid(iUserId, 0, 0);
                    SendMsgToAll(pRoomObj, "leave_notify", {
                        wErrCode: ErrorCodes.ERR_NOERROR,
                        szErrMsg: "操作成功",
        
                        iUserId: iUserId,
                        iSeatIndex: iSeatIndex
                    });
                    pPlayerObj.pUserRef = null;  // 用户离开房间了
           
                    RoomMgr.RemoveSeatUser(pRoomObj, iUserId);
    
                    var pDists = GetPlayerDistObjs(pRoomObj);
                    SendMsgToAll(pRoomObj, "dists_warn_notify", pDists);
                }, 1000, pRoomObj, pReqArgs.iUserId, iSeatIndex);
            }
            else {
                SendMsg(pReqArgs.pSocket, "leave_result", {
                    wErrCode: ErrorCodes.ERR_INVOKE_FALIED,
                    szErrMsg: "牌局中不能退出房间"
                });
            }
        }
        else {
            delete g_pOpenGPSMaps[pReqArgs.iUserId];
            await dbLGQ.update_user_roomid(pReqArgs.iUserId, 0, 0);
            SendMsgToAll(pRoomObj, "leave_notify", {
                wErrCode: ErrorCodes.ERR_NOERROR,
                szErrMsg: "操作成功",

                iUserId: pReqArgs.iUserId,
                iSeatIndex: iSeatIndex
            });
            pPlayerObj.pUserRef = null;  // 用户离开房间了

            RoomMgr.RemoveSeatUser(pRoomObj, pReqArgs.iUserId);

            var pDists = GetPlayerDistObjs(pRoomObj);
            SendMsgToAll(pRoomObj, "dists_warn_notify", pDists);
        }

        return;
    }

    delete g_pOpenGPSMaps[pReqArgs.iUserId];
    await dbLGQ.update_user_roomid(pReqArgs.iUserId, 0, 0);
    SendMsgToAll(pRoomObj, "leave_notify", {
        wErrCode: ErrorCodes.ERR_NOERROR,
        szErrMsg: "操作成功",

        iUserId: pReqArgs.iUserId,
        iSeatIndex: iSeatIndex
    });

    if (iSeatIndex == -1) {
        RoomMgr.RemoveSeeUser(pRoomObj, pReqArgs.iUserId);
    }
    else {
        RoomMgr.RemoveSeatUser(pRoomObj, pReqArgs.iUserId);
    }

    var pDists = GetPlayerDistObjs(pRoomObj);
    SendMsgToAll(pRoomObj, "dists_warn_notify", pDists);

    CheckStopAutoStartGame(pRoomObj);

    var pItem = pRoomObj.pRoomPlayers[pReqArgs.iUserId];
    if (pItem != null) pItem.bOnline = false;

    console.log("OnLeaveRoom iRoomId leave");
}

// 获取用户间的距离
function GetPlayerDistObjs(pRoomObj) {
    var Result = {};
    var bDoSend = false;

    var pfnIndexOf = function(pItems, iUserId) {
        var Result = -1;
        for (var iIndex = 0; iIndex < pItems.length; ++iIndex) {
            var pItem = pItems[iIndex];
            if (pItem.iUserId == iUserId) {
                Result = iIndex;
                break;
            }
        }
        return Result;
    }

    var pfnAddDistUser = function(pDistMaps, pUserObj1, pUserObj2) {
        var bInsert = false;
        var bDoInsert = true;
        var sGroupKey = 1;
        for (var sKey in pDistMaps) sGroupKey += 1;

        for (var sKey in pDistMaps) {
            var pItems = pDistMaps[sKey];
            for (var iIndex = 0; iIndex < pItems.length; ++iIndex) {
                var pUserObj = pItems[iIndex];
                if (pUserObj.iUserId == pUserObj1.iUserId) {
                    var iPos1 = pfnIndexOf(pItems, pUserObj1.iUserId);
                    var iPos2 = pfnIndexOf(pItems, pUserObj2.iUserId);
                    if (iPos1 >= 0 && iPos2 >= 0) {
                        bDoInsert = false;
                        break;
                    }

                    if (iPos1 >= 0 && iPos2 == -1) {
                        bInsert = true;
                        pItems.push(pUserObj2);
                        break;
                    }
                    else if (iPos1 == -1 && iPos2 >= 0) {
                        bInsert = true;
                        pItems.push(pUserObj1);
                        break;
                    }
                }
            }

            if (bInsert) break;
        }

        if (!bInsert && bDoInsert) {
            pDistMaps[sGroupKey] = [pUserObj1, pUserObj2];
        }
    }

    for (var iIndex = 0; iIndex < pRoomObj.pPlayers.length; ++iIndex) {
        var pUserObj1 = pRoomObj.pPlayers[iIndex];
        if (pUserObj1.iUserId == 0) continue;
        if ((pUserObj1.fLat == 0) && (pUserObj1.fLon == 0)) continue;
        
        var bOpenGPS1 = g_pOpenGPSMaps[pUserObj1.iUserId];
        if (bOpenGPS1 != null) {
            if (!bOpenGPS1) continue;
        } 

        for (var iPos = iIndex + 1; iPos < pRoomObj.pPlayers.length; ++iPos) {
            var pUserObj2 = pRoomObj.pPlayers[iPos];
            if (pUserObj2.iUserId == 0) continue;
            if ((pUserObj2.fLat == 0) && (pUserObj2.fLon == 0)) continue;

            var bOpenGPS2 = g_pOpenGPSMaps[pUserObj2.iUserId];
            if (bOpenGPS2 != null) {
                if (!bOpenGPS2) continue;
            } 

            var fDist = SysUtils.GetDistance(pUserObj1, pUserObj2);
            if (fDist <= 0.1) { // <= 100 米
                bDoSend = true;
                var pItem1 = {
                    iUserId: pUserObj1.iUserId,
                    szAlias: pUserObj1.szAlias,
                    szHeadIco: pUserObj1.szHeadIco,
                };

                var pItem2 = {
                    iUserId: pUserObj2.iUserId,
                    szAlias: pUserObj2.szAlias,
                    szHeadIco: pUserObj2.szHeadIco,
                };

                pfnAddDistUser(Result, pItem1, pItem2);
            }
        }
    }

    if (bDoSend) {
        console.log(JSON.stringify(Result));
        //console.log("GetPlayerDistObjs ret true");
    }
    else {
        Result = {};
    }

    return Result;
}

async function OnGetPlayersDists(pReqArgs) {
    var pRoomObj = RoomMgr.GetRoomObj(pReqArgs.iRoomId);
    if (pRoomObj == null) {
        SendMsg(pReqArgs.pSocket, "getdist_result", {
            wErrCode: ErrorCodes.ERR_ROOMISNOTEXISTS,
            szErrMsg: "房间不存在"
        });
        return;
    }

    var pItems = GetPlayerDistObjs(pRoomObj);
    if (pItems == null) pItems = {};
    SendMsg(pReqArgs.pSocket, "getdist_result", {
        wErrCode: ErrorCodes.ERR_NOERROR,
        szErrMsg: "操作成功",
        pItems: pItems
    });
}


async function GetClubRoomMsgs(pClubIds, iRoomId, iUserId, bIsAdmin) {
    var Result = [];

    var pRes = { rows: [] };
    if (bIsAdmin && (pClubIds.length > 0)) { // 是管理员
        var szWhere = SysUtils.GetWhereStr(pClubIds);
        pRes = await dbCC.query("select * from tb_roommessage where fromclub in " + szWhere +
            " or (roomid = $1 and userid = $2) order by ctime desc", [iRoomId, iUserId]);
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
            szOptAlias: pRow.optname,
            iJiFen: pRow.jifen,
            tmTime: pRow.ctime,
            szMessage: ""
        };

        if (iUserId == pItem.iReqUser) {
            if (pItem.iOptMode == 0) {
                pItem.szMessage = pItem.szClubName + "的" + pItem.szOptAlias + "拒绝了您的带入申请";
            }
            else {
                pItem.szMessage = pItem.szClubName + "的" + pItem.szOptAlias + "同意将您的带入上限修改为" + pItem.iJiFen;
            }
        }
        else {
            if (pItem.iOptMode == 0) {
                pItem.szMessage = pItem.szClubName + "的" + pItem.szOptAlias + "拒绝了该玩家的带入申请";
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


// 用户获取房间消息
async function OnGetReqSDUsers(pReqArgs) {
    console.log("OnGetReqSDUsers iRoomId:" + pReqArgs.iRoomId + ", iUserId:" + pReqArgs.iUserId);
    var pRoomObj = RoomMgr.GetRoomObj(pReqArgs.iRoomId);
    if (pRoomObj == null) {
        SendMsg(pReqArgs.pSocket, "getrsdus_result", {
            wErrCode: ErrorCodes.ERR_ROOMISNOTEXISTS,
            szErrMsg: "房间不存在"
        });
        return;
    }

    var pUserObj = RoomMgr.GetUserObj(pRoomObj, pReqArgs.iUserId);
    if (pUserObj == null) {
        console.log("OnGetReqSDUsers iRoomId:" + pReqArgs.iRoomId + ", iUserId:" + pReqArgs.iUserId + " is not in room");
        return;
    }

    var pRes = await dbCC.query("select count(*) from tb_clubrooms_msg where msgmode = 1 and userid = $1", [pReqArgs.iUserId]);
    var pReqs = {
        wErrCode: ErrorCodes.ERR_NOERROR,
        szErrMsg: "操作成功",
        iMsgCount: pRes.rows[0].count,
        pUserObjs: [],
        pLogs: []
    };

    // pReqArgs.iUserId = parseInt(pReqArgs.iUserId);
    // if (pRoomObj.iAllId > 0) {  // 联盟推送出来的房间

    // }

    console.log("OnGetReqSDUsers 1");
    var pClubIds = await dbLGQ.get_club_by_adminuser(pReqArgs.iUserId); // 获取用户是哪几个俱乐部的管理
    console.log("OnGetReqSDUsers pClubIds.length:" + pClubIds.length);
    
    if (pClubIds.length > 0) {  // 是管理员
        pReqs = await GetRSDNotifyObj(pRoomObj, pClubIds);
        console.log("OnGetReqSDUsers pReqs.pUserObjs.length:" + pReqs.pUserObjs.length);
    }
    pReqs.pLogs = await GetClubRoomMsgs(pClubIds, pRoomObj.iRoomId, pReqArgs.iUserId, pClubIds.length > 0);

    console.log("OnGetReqSDUsers pReqs.pLogs.length:" + pReqs.pLogs.length);

    SendMsg(pReqArgs.pSocket, "getrsdus_notify", pReqs);
    await dbCC.query("update tb_clubrooms_msg set msgmode = 0 where userid = $1", [pReqArgs.iUserId]);
    console.log("OnGetReqSDUsers leave");
}


// 玩家坐下
async function OnSitdown(pReqArgs) {
    var pRoomObj = RoomMgr.GetRoomObj(pReqArgs.iRoomId);
    if (pRoomObj == null) {
        SendMsg(pReqArgs.pSocket, "sitdown_result", {
            wErrCode: ErrorCodes.ERR_ROOMISNOTEXISTS,
            szErrMsg: "房间不存在"
        });
        return;
    }
    console.log("OnSitdown iRoomId:" + pRoomObj.iRoomId + ", iUserId:" + pReqArgs.iUserId + ", iSeatIndex:" + pReqArgs.iSeatIndex);

    var pKillObj = RoomMgr.GetKillUser(pRoomObj, pReqArgs.iUserId);
    if (pKillObj != null) {
        SendMsg(pReqArgs.pSocket, "sitdown_result", {
            wErrCode: ErrorCodes.ERR_INVOKE_FALIED,
            szErrMsg: "还有" + parseInt(pKillObj.iTimes) + "秒才能坐位置",
            iTimes: parseInt(pKillObj.iTimes),
        });
        return;
    }

    var pUserObj = RoomMgr.GetUserObj(pRoomObj, pReqArgs.iUserId);
    if (pUserObj == null) return;

    var pJiFenObj = RoomMgr.GetJiFenObj(pRoomObj, pUserObj.iUserId);
    if (pJiFenObj == null) {
        console.log("OnSitdown error 1");
        SendMsg(pReqArgs.pSocket, "sitdown_result", {
            wErrCode: ErrorCodes.ERR_NOTENOUGHJIFEN,
            szErrMsg: "积分不够",
            iSeatIndex: pReqArgs.iSeatIndex
        });
        return;
    }

    var iMinJiFen = pRoomObj.pRoomArgs.iBaseFen * 2 + pRoomObj.pGameObj.iNextMG;
    if (pJiFenObj.iJiFen <= iMinJiFen) {
        SendMsg(pReqArgs.pSocket, "sitdown_result", {
            wErrCode: ErrorCodes.ERR_NOTENOUGHJIFEN,
            szErrMsg: "积分不够",
            iSeatIndex: pReqArgs.iSeatIndex
        });
        return;
    }

    pReqArgs.iSeatIndex = parseInt(pReqArgs.iSeatIndex);
    if ((pReqArgs.iSeatIndex < 0) || (pReqArgs.iSeatIndex >= pRoomObj.pPlayers.length)) {
        SendMsg(pReqArgs.pSocket, "sitdown_result", {
            wErrCode: ErrorCodes.ERR_INVALIDSEATINDEX,
            szErrMsg: "无效位置"
        });
        return;
    }

    var pSeatUser = pRoomObj.pPlayers[pReqArgs.iSeatIndex];
    if ((pSeatUser.iUserId != 0) && (pSeatUser.iUserId != pReqArgs.iUserId)) {
        SendMsg(pReqArgs.pSocket, "sitdown_result", {
            wErrCode: ErrorCodes.ERR_ROOMPLAYERISFULL,
            szErrMsg: "此位置有人"
        });
        return;
    }

    pUserObj.iTimeOutPlayTimes = 0;
    if (pUserObj.iSeatIndex == -1) {
        pUserObj = RoomMgr.RemoveSeeUser(pRoomObj, pUserObj.iUserId);
        pUserObj = RoomMgr.UpdateSeatUser(pRoomObj, pReqArgs.iSeatIndex, pUserObj);

        var pPlayerObj = GetPlayerObj(pRoomObj, pUserObj.iUserId);
        if (pPlayerObj != null) pPlayerObj.iSeatIndex = pUserObj.iSeatIndex;
    }
    else {
        RoomMgr.ClearLZReqTimerPtr(pUserObj);
        pUserObj.iState = RoomMgr.SeatState.SEAT_STATE_WAIT;
    }

    SendMsgToUser(pUserObj.iUserId, "sitdown_result", {
        wErrCode: ErrorCodes.ERR_NOERROR,
        szErrMsg: "操作成功",
        iUserId: pUserObj.iUserId,
        iGolds: pUserObj.iGolds,
        iJiFen: pJiFenObj.iJiFen
    });

    RoomMgr.LogSeatUsers(pRoomObj);

    SendMsgToAll(pRoomObj, "sitdown_notify", {
        wErrCode: ErrorCodes.ERR_NOERROR,
        szErrMsg: "操作成功",
        iSeatIndex: pUserObj.iSeatIndex,
        iUserId: pUserObj.iUserId,
        szAlias: pUserObj.szAlias,
        szHeadIco: pUserObj.szHeadIco,
        bSex: pUserObj.bSex,
        iGolds: pUserObj.iGolds,
        iState: pUserObj.iState,
        bOnline: pUserObj.bOnline,
        iJiFenDR: pJiFenObj.iJiFenDR,   // 带入积分
        iJiFen: pJiFenObj.iJiFen        // 剩余积分
    }, 0);

    var pDists = GetPlayerDistObjs(pRoomObj);
    SendMsgToAll(pRoomObj, "dists_warn_notify", pDists);

    CheckAutoStartGame(pRoomObj);

    console.log("OnSitdown leave");
}

// 离开座位
async function OnSitup(pReqArgs) {
    var pRoomObj = RoomMgr.GetRoomObj(pReqArgs.iRoomId);
    if (pRoomObj == null) {
        SendMsg(pReqArgs.pSocket, "situp_result", {
            wErrCode: ErrorCodes.ERR_ROOMISNOTEXISTS,
            szErrMsg: "房间不存在"
        });
        return;
    }
    console.log("OnSitup iRoomId:" + pRoomObj.iRoomId + ", iUserId:" + pReqArgs.iUserId);
    RoomMgr.LogSeatUsers(pRoomObj);

    var pUserObj = RoomMgr.GetUserObj(pRoomObj, pReqArgs.iUserId);
    if (pUserObj == null) return;
    if (pUserObj.iSeatIndex == -1) return;

    var pPlayerObj = GetPlayerObj(pRoomObj, pReqArgs.iUserId);
    if (IsPlayingUser(pPlayerObj)) {
        console.log("OnSitup iUserId:" + pPlayerObj.iUserId + ", iState:" + pPlayerObj.iState);
        //pPlayerObj = GetPlayerObj(pRoomObj, pUserObj.iUserId);
        if (pPlayerObj.iState == RoomMgr.SeatState.SEAT_STATE_LOSE) {
            var pDestUser = RoomMgr.RemoveSeatUser(pRoomObj, pPlayerObj.iUserId);
            RoomMgr.AddSeePlayer(pRoomObj, pDestUser);

            SendMsgToAll(pRoomObj, "situp_notify", {
                wErrCode: ErrorCodes.ERR_NOERROR,
                szErrMsg: "操作成功",
                iUserId: pPlayerObj.iUserId,
                iSeatIndex: pPlayerObj.iSeatIndex
            });

            var pDists = GetPlayerDistObjs(pRoomObj);
            SendMsgToAll(pRoomObj, "dists_warn_notify", pDists);
            
            return;
        }

        if (pPlayerObj == pRoomObj.pGameObjEx.pCursor) {
            OnLose({ iRoomId: pRoomObj.iRoomId, iUserId: pPlayerObj.iUserId, pSocket: pReqArgs.pSocket });

            setTimeout(async function(pRoomObj, iUserId, iSeatIndex) {
                var pDestUser = RoomMgr.RemoveSeatUser(pRoomObj, iUserId);
                if (pDestUser != null) {
                    pDestUser = RoomMgr.AddSeePlayer(pRoomObj, pDestUser);
                    pPlayerObj.pUserRef = null;
        
                    SendMsgToAll(pRoomObj, "situp_notify", {
                        wErrCode: ErrorCodes.ERR_NOERROR,
                        szErrMsg: "操作成功",
                        iUserId: iUserId,
                        iSeatIndex: iSeatIndex
                    });

                }
            }, 1000, pRoomObj, pPlayerObj.iUserId, pPlayerObj.iSeatIndex);

            var pDists = GetPlayerDistObjs(pRoomObj);
            SendMsgToAll(pRoomObj, "dists_warn_notify", pDists);

            return;
        }

        console.log("OnSitup 111111111111111111111111111");
        SendMsg(pReqArgs.pSocket, "situp_result", {
            wErrCode: ErrorCodes.ERR_INVOKE_FALIED,
            szErrMsg: "牌局中不能离开座位"
        });
        return;
    }

    RoomMgr.LogSeatUsers(pRoomObj);

    console.log("OnSitup pUserObj.iUserId:" + pUserObj.iUserId);
    SendMsgToAll(pRoomObj, "situp_notify", {
        wErrCode: ErrorCodes.ERR_NOERROR,
        szErrMsg: "操作成功",
        iUserId: pUserObj.iUserId,
        iSeatIndex: pUserObj.iSeatIndex
    });

    var pDestUser = RoomMgr.RemoveSeatUser(pRoomObj, pUserObj.iUserId);
    RoomMgr.AddSeePlayer(pRoomObj, pDestUser);

    var pDists = GetPlayerDistObjs(pRoomObj);
    SendMsgToAll(pRoomObj, "dists_warn_notify", pDists);

    CheckStopAutoStartGame(pRoomObj);
}

// 留座
async function OnLiuZuo(pReqArgs) {
    var pRoomObj = RoomMgr.GetRoomObj(pReqArgs.iRoomId);
    if (pRoomObj == null) {
        SendMsg(pReqArgs.pSocket, "liuzuo_result", {
            wErrCode: ErrorCodes.ERR_ROOMISNOTEXISTS,
            szErrMsg: "房间不存在"
        });
        return;
    }

    console.log("OnLiuZuo iRoomId:" + pRoomObj.iRoomId + ", iUserId:" + pReqArgs.iUserId);

    var pUserObj = RoomMgr.GetUserObj(pRoomObj, pReqArgs.iUserId);
    if (pUserObj == null) {
        console.log("OnLiuZuo 1");
        return;
    }

    if (pUserObj.iSeatIndex == -1) {
        console.log("OnLiuZuo 2");
        return;
    }

    var pPlayerObj = GetPlayerObj(pRoomObj, pUserObj.iUserId);
    if (pPlayerObj != null) {
        if (pPlayerObj.iState == RoomMgr.SeatState.SEAT_STATE_LOSE) {   // 丢牌玩家可以直接留座
            await DoLiuZuo(pRoomObj, pUserObj);
        }
        else {
            pUserObj.bLiuZuo = true;

            SendMsg(pReqArgs.pSocket, "liuzuo_result", {
                wErrCode: ErrorCodes.ERR_WAITGAMEOVER,
                szErrMsg: "本手牌局结束后将自动留桌"
            });    
        }
        return;
    }

    await DoLiuZuo(pRoomObj, pUserObj);
}

// 回座
async function OnHuiZuo(pReqArgs) {
    var pRoomObj = RoomMgr.GetRoomObj(pReqArgs.iRoomId);
    if (pRoomObj == null) {
        SendMsg(pReqArgs.pSocket, "huozuo_result", {
            wErrCode: ErrorCodes.ERR_ROOMISNOTEXISTS,
            szErrMsg: "房间不存在"
        });
        return;
    }

    console.log("OnHuiZuo iRoomId:" + pRoomObj.iRoomId + ", iUserId:" + pReqArgs.iUserId);

    var pUserObj = RoomMgr.GetUserObj(pRoomObj, pReqArgs.iUserId);
    if (pUserObj == null) {
        console.log("OnHuiZuo 1");
        return;
    }

    if (pUserObj.iSeatIndex == -1) {
        console.log("OnHuiZuo 2");
        return;
    }

    if (pUserObj.iState != RoomMgr.SeatState.SEAT_STATE_LIUZ) {
        SendMsg(pReqArgs.pSocket, "huozuo_result", {
            wErrCode: ErrorCodes.ERR_INVOKE_FALIED,
            szErrMsg: "只有留桌用户才能回桌"
        });
        return;
    }

    var iJiFen = 0;
    var pJiFenObj = RoomMgr.GetJiFenObj(pRoomObj, pUserObj.iUserId);
    if (pJiFenObj != null) iJiFen = pJiFenObj.iJiFen;

    var iMinJiFen = pRoomObj.pRoomArgs.iBaseFen * 2 + pRoomObj.pGameObj.iNextMG;
    if (iJiFen < iMinJiFen) {
        SendMsg(pReqArgs.pSocket, "huozuo_result", {
            wErrCode: ErrorCodes.ERR_NOTENOUGHJIFEN,
            szErrMsg: "积分不够"
        });
        return;
    }

    pUserObj.iTimeOutPlayTimes = 0;
    pUserObj.iState = RoomMgr.SeatState.SEAT_STATE_WAIT;

    RoomMgr.ClearLZReqTimerPtr(pUserObj);

    SendMsgToAll(pRoomObj, "huozuo_notify", {
        wErrCode: ErrorCodes.ERR_NOERROR,
        szErrMsg: "操作成功",
        iUserId: pUserObj.iUserId,
        iJiFen: iJiFen,
        iSeatIndex: pUserObj.iSeatIndex
    });
}

function DoYanShi(pRoomObj, pUserObj, tmStop, iWaitTimes) {
    if (pUserObj.iOptCmd == 1) {    // 休
        console.log("DoYanShi iOptCmd == 1");
        pUserObj.tmOptTimerPtr = new Date(); //tmStop;
        pUserObj.pOptTimerPtr = setTimeout(TimeOutAutoXiu, iWaitTimes * 1000, pRoomObj, pUserObj);
        return true;
    }
    else if (pUserObj.iOptCmd == 2) {   // 丢
        console.log("DoYanShi iOptCmd == 2");
        pUserObj.tmOptTimerPtr = new Date();    // tmStop;
        pUserObj.pOptTimerPtr = setTimeout(TimeOutAutoLose, iWaitTimes * 1000, pRoomObj, pUserObj);
        return true;
    }
    else if (pUserObj.iOptCmd == 3) {   // 分牌
        console.log("DoYanShi iOptCmd == 3");
        pUserObj.tmOptTimerPtr = new Date();    // tmStop;
        pUserObj.pOptTimerPtr = setTimeout(TimeOutAutoSplit, iWaitTimes * 1000, pRoomObj, pUserObj);
        return true;
    }

    return false;
}

// 延时
async function OnYanShi(pReqArgs) {
    var pRoomObj = RoomMgr.GetRoomObj(pReqArgs.iRoomId);
    if (pRoomObj == null) {
        SendMsg(pReqArgs.pSocket, "yanshi_result", {
            wErrCode: ErrorCodes.ERR_ROOMISNOTEXISTS,
            szErrMsg: "房间不存在"
        });
        return;
    }
    console.log("OnYanShi iRoomId:" + pRoomObj.iRoomId + ", iUserId:" + pReqArgs.iUserId);

    var pPlayerObj = GetPlayerObj(pRoomObj, pReqArgs.iUserId);
    if (pPlayerObj == null) {
        console.log("OnYanShi pPlayerObj == null");
        return;
    }

    var pGameObjEx = pRoomObj.pGameObjEx;
    if (pGameObjEx == null) {
        console.log("OnYanShi pGameObjEx == null");
        return;
    }

    if (pGameObjEx.pCursor == null) {
        console.log("OnYanShi pGameObjEx.pCursor == null");
        return;
    }

    if (pPlayerObj.iUserId != pGameObjEx.pCursor.iUserId) {
        console.log("OnYanShi pPlayerObj != pGameObjEx.pCursor");
        return;
    }

    if (pPlayerObj.pOptTimerPtr == null) {
        console.log("OnYanShi pPlayerObj.pOptTimerPtr == null");
        return;
    }

    if (pPlayerObj.iTimesYS > 4) {
        console.log("OnYanShi 每圈只能延时五次, iUserId:" + pPlayerObj.iUserId);

        SendMsg(pReqArgs.pSocket, "yanshi_result", {
            wErrCode: ErrorCodes.ERR_INVOKE_FALIED,
            szErrMsg: "每圈只能延时五次"
        });
        return;
    }

    console.log("OnYanShi 1");
    var iCostGolds = 0;
    if (pPlayerObj.iTimesYS > 0) {
        iCostGolds = 50;
        for (var iLoop = 0; iLoop < pPlayerObj.iTimesYS; ++iLoop) {
            iCostGolds = iCostGolds * 2;
        }
    }
    pPlayerObj.iTimesYS += 1;

    console.log("OnYanShi 2");
    var pUserInfo = await dbLGQ.get_user_info(pPlayerObj.iUserId);
    pUserInfo.golds = parseInt(pPlayerObj.golds);
    if (pUserInfo.golds < iCostGolds) {
        pPlayerObj.iTimesYS -= 1;
        console.log("OnYanShi pUserObj.iGolds < " + iCostGolds);
        SendMsg(pReqArgs.pSocket, "golds_noten_result", {
            wErrCode: ErrorCodes.ERR_NOTENOUGHGOLDS,
            szErrMsg: "金币不够"
        });
        return;
    }

    var tmStop = pPlayerObj.tmOptTimerPtr;
    ClearUserOptTimerPtr(pPlayerObj);
    
    // if (pUserInfo != null) {
    //     pUserObj.iGolds = parseInt(pUserInfo.golds);
    //     pUserObj.iGems = parseInt(pUserInfo.gems);
    // }

    // tmStop.setSeconds(tmStop.getSeconds() + 10, 0);
    // var tmStart = new Date();
    // var iWaitTimes = (tmStop.getTime() - tmStart.getTime()) / 1000;

    // iWaitTimes = parseInt(iWaitTimes);
    // console.log("OnYanShi iWaitTimes:" + iWaitTimes);

    if (DoYanShi(pRoomObj, pPlayerObj, tmStop, TIME_OUT_ACTION_VALUE)) {
        console.log("OnYanShi ok");

        SendMsgToAll(pRoomObj, "yanshi_notify", {
            wErrCode: ErrorCodes.ERR_NOERROR,
            szErrMsg: "操作成功",

            iUserId: pPlayerObj.iUserId,
            iAddTimes: 10,
            iWaitTimes: TIME_OUT_ACTION_VALUE,
            iGolds: pUserInfo.golds - iCostGolds
        });
    }
}

// 超时自动休牌
async function TimeOutAutoXiu(pRoomObj, pUserObj) {
    if (!__ENABLE_OPT_TIMEOUT__) return;
    if (!pRoomObj.bRunning) return;

    console.log("TimeOutAutoXiu iRoomId:" + pRoomObj.iRoomId + ", iUserId:" + pUserObj.iUserId);

    var pGameObj = pRoomObj.pGameObjEx;
    if (pUserObj != pGameObj.pCursor) {
        console.log("TimeOutAutoXiu iRoomId:" + pRoomObj.iRoomId + ", iUserId:" + pUserObj.iUserId + " is not current user");
        return;
    }

    OnRest({
        iRoomId: pRoomObj.iRoomId,
        iUserId: pUserObj.iUserId,
        bTimeOut: true,
        pSocket: UserMgr.GetSocketObj(pUserObj.iUserId)
    });

    // pUserObj.iState = RoomMgr.SeatState.SEAT_STATE_REST;

    // SendMsgToAll(pRoomObj, "rest_notify", {
    //     wErrCode: ErrorCodes.ERR_NOERROR,
    //     szErrMsg: "操作成功",
    //     iUserId: pUserObj.iUserId
    // });

    // if (IsXiuM(pRoomObj)) {
    //     OnXiuMEvent(pRoomObj);
    //     return;
    // }

    // await ExeNextAction(pRoomObj);
}

// 超时自动丢牌
function TimeOutAutoLose(pRoomObj, pUserObj) {
    if (!__ENABLE_OPT_TIMEOUT__) return;
    if (!pRoomObj.bRunning) return;

    console.log("TimeOutAutoLose iRoomId:" + pRoomObj.iRoomId + ", iUserId:" + pUserObj.iUserId);

    var pGameObj = pRoomObj.pGameObjEx;
    if (pUserObj != pGameObj.pCursor) {
        console.log("TimeOutAutoLose iRoomId:" + pRoomObj.iRoomId + ", iUserId:" + pUserObj.iUserId + " is not current user");
        return;
    }

    var pReqArgs = {
        iRoomId: pRoomObj.iRoomId,
        iUserId: pUserObj.iUserId,
        pSocket: UserMgr.GetSocketObj(pUserObj.iUserId),
        bTimeOut: true,
    };
    OnLose(pReqArgs);
}

// 超时自动分牌
function TimeOutAutoSplit(pRoomObj, pUserObj) {
    if (!__ENABLE_OPT_TIMEOUT__) return;
    if (!pRoomObj.bRunning) return;

    console.log("TimeOutAutoSplit iRoomId:" + pRoomObj.iRoomId + ", iUserId:" + pUserObj.iUserId);

    if (pUserObj.pPais1 != null) return;

    var pReqArgs = {
        iRoomId: pRoomObj.iRoomId,
        iUserId: pUserObj.iUserId,
        pSocket: UserMgr.GetSocketObj(pUserObj.iUserId),
        pPais1: [pUserObj.pPais[0], pUserObj.pPais[1]],
        pPais2: [pUserObj.pPais[2], pUserObj.pPais[3]]
    };
    OnSplit(pReqArgs);
}

// 清除超时
function RemoveTimeOut(pRoomObj) {
    if (pRoomObj.pTimerPtr != null) {
        clearTimeout(pRoomObj.pTimerPtr);
        pRoomObj.pTimerPtr = null;
    }
}

// 发送分牌消息
async function NotifySplitNotify(pRoomObj) {
    var pGameObjEx = pRoomObj.pGameObjEx;

    pGameObjEx.szState = "split";
    for (var iIndex = 0; iIndex < pGameObjEx.pPlayers.length; ++iIndex) {
        var pUserObj = pGameObjEx.pPlayers[iIndex];
        if (pUserObj.iState == RoomMgr.SeatState.SEAT_STATE_LOSE) continue;

        ClearUserOptTimerPtr(pUserObj);

        pUserObj.iOptCmd = 3;
        pUserObj.tmOptTimerPtr = new Date();
        //pUserObj.tmOptTimerPtr.setSeconds(pUserObj.tmOptTimerPtr.getSeconds() + TIME_OUT_SPLIT_VALUE);
        pUserObj.pOptTimerPtr = setTimeout(TimeOutAutoSplit, TIME_OUT_SPLIT_VALUE * 1000, pRoomObj, pUserObj);

        SendMsgToUser(pUserObj.iUserId, "start_split_notify", pUserObj.pPais);
    }
}

// 玩家准备
async function OnReady(pReqArgs) {
    var pRoomObj = RoomMgr.GetRoomObj(pReqArgs.iRoomId);
    if (pRoomObj == null) {
        SendMsg(pReqArgs.pSocket, "ready_result", {
            wErrCode: ErrorCodes.ERR_ROOMISNOTEXISTS,
            szErrMsg: "房间不存在"
        });
        return;
    }
    console.log("OnReady iRoomId:" + pRoomObj.iRoomId + ", iUserId:" + pReqArgs.iUserId);

    if (pRoomObj.bRunning) return;

    var pUserObj = RoomMgr.GetUserObj(pRoomObj, pReqArgs.iUserId);
    if (pUserObj == null) return;
    if (pUserObj.iState != RoomMgr.SeatState.SEAT_STATE_WAIT) return;

    var bStart = true;
    var iReadyNum = 0;

    pUserObj.iState = RoomMgr.SeatState.SEAT_STATE_READY;

    var iMinJiFen = pRoomObj.pRoomArgs.iBaseFen * 2 + pRoomObj.pGameObj.iNextMG;
    for (var iIndex = 0; iIndex < pRoomObj.pPlayers.length; ++iIndex) {
        var pItem = pRoomObj.pPlayers[iIndex];

        if (pItem.iUserId == 0) continue;
        if (pItem.iState == RoomMgr.SeatState.SEAT_STATE_REQSD) continue;

        var pJiFenObj = RoomMgr.GetJiFenObj(pItem.iUserId);
        if ((pItem.iState == RoomMgr.SeatState.SEAT_STATE_READY) && (pJiFenObj.iJiFen >= iMinJiFen)) {
            ++iReadyNum;
        }
    }

    SendMsgToAll(pRoomObj, "ready_notify", {
        wErrCode: ErrorCodes.ERR_NOERROR,
        szErrMsg: "操作成功",
        iUserId: pUserObj.iUserId
    });

    if (bStart && (iReadyNum >= 2)) {
        await StartGame(pRoomObj);
    }
}

// 房主点开始
async function OnStart(pReqArgs) {
    var pRoomObj = RoomMgr.GetRoomObj(pReqArgs.iRoomId);
    if (pRoomObj == null) {
        SendMsg(pReqArgs.pSocket, "start_result", {
            wErrCode: ErrorCodes.ERR_ROOMISNOTEXISTS,
            szErrMsg: "房间不存在"
        });
        return;
    }
    console.log("OnStart iRoomId:" + pRoomObj.iRoomId + ", iUserId:" + pReqArgs.iUserId +
        ", bRunning:" + pRoomObj.bRunning + ", iCreator:" + pRoomObj.iCreator);

    if (pRoomObj.bRunning) return;

    pRoomObj.bWaitJS = false;
    if (pRoomObj.pGameObj.iJiFenMG == 0) {
        if (pRoomObj.iSecond >= pRoomObj.iDelSec - 5) return;
    }

    delete pRoomObj.pPaiMaps;
    pRoomObj.isShowPai = false;
    if (undefined == pRoomObj.countOnstart) {
        pRoomObj.countOnstart = 0;
    }
    pRoomObj.countOnstart++;

    console.log('onstart showpai', pRoomObj.isShowPai);
    RemoveTimeOut(pRoomObj);
    // var pUserObj = RoomMgr.GetUserObj(pRoomObj, pReqArgs.iUserId);
    // if (pUserObj == null) {
    //     console.log("OnStart error 1");
    //     return;
    // }

    console.log("OnStart 1");
    if (pReqArgs.iUserId != pRoomObj.iCreator) {
        console.log("OnStart error 2");
        SendMsg(pReqArgs.pSocket, "start_result", {
            wErrCode: ErrorCodes.ERR_ERRORAUTHORITY,
            szErrMsg: "只有房主才能点开始"
        });
        return;
    }

    var pfnStartGame = async function (pRoomObj) {
        if (!pRoomObj.bRunning) {
            RemoveTimeOut(pRoomObj);

            RoomMgr.LogSeatUsers(pRoomObj);

            var iReadyNum = 0;
            var iMinJiFen = pRoomObj.pRoomArgs.iBaseFen * 2 + pRoomObj.pGameObj.iNextMG;

            console.log("OnStart call pfnStartGame pRoomObj.pPlayers.length:" + pRoomObj.pPlayers.length);
            for (var iIndex = 0; iIndex < pRoomObj.pPlayers.length; ++iIndex) {
                var pItem = pRoomObj.pPlayers[iIndex];
                if (pItem.iUserId == 0) continue;
                //console.log("OnStart iUserId:" + pItem.iUserId + ", iState:" + pItem.iState);

                if (pItem.bLiuZuo) {
                    await DoLiuZuo(pRoomObj, pItem);
                    continue;
                }

                if (pItem.pLZTimerPtr != null) continue;
                if (pItem.iState == RoomMgr.SeatState.SEAT_STATE_REQSD) continue;
                if (pItem.iState == RoomMgr.SeatState.SEAT_STATE_LIUZ) continue;
                if (pItem.iState == RoomMgr.SeatState.SEAT_STATE_FSW) continue;

                var pJiFenObj = RoomMgr.GetJiFenObj(pRoomObj, pItem.iUserId);
                if (pJiFenObj == null) pJiFenObj = { iJiFen: 0 };
                if (pJiFenObj.iJiFen < iMinJiFen) {
                    //console.log("OnStart iUserId:" + pItem.iUserId + ", iJiFen:" + pJiFenObj.iJiFen + ", iMinJiFen:" + iMinJiFen);
                    continue;
                }

                //RoomMgr.ClearJFReqTimerPtr(pItem);
                //RoomMgr.ClearLZReqTimerPtr(pItem);
                pItem.iState = RoomMgr.SeatState.SEAT_STATE_READY;
                ++iReadyNum;
            }

            console.log("OnStart iReadyNum:" + iReadyNum);
            if (iReadyNum >= 2) {
                pRoomObj.iGTimes = 1;
                await StartGame(pRoomObj);
            }
            else {
                pRoomObj.iGTimes = 0;
            }
        }
    }

    console.log("OnStart 2");
    var pRoomArgs = pRoomObj.pRoomArgs;
    if (!pRoomArgs.bRunning) {
        console.log("OnStart 3");
        pRoomArgs.bRunning = true;
        var szRoomArgs = JSON.stringify(pRoomArgs);
        await dbCC.query("update tb_rooms set times = 0, roomargs = $1 where roomuuid = $2", [szRoomArgs, pRoomObj.szRoomUUID]);
        SendMsgToAll(pRoomObj, "opengame_notify", {
            wErrCode: ErrorCodes.ERR_NOERROR,
            szErrMsg: "操作成功",
            iTimeSY: RoomMgr.GetRoomTimeSY(pRoomObj),
            iUserId: pRoomObj.iCreator
        });

        console.log("OnStart 5");
        await pfnStartGame(pRoomObj);
    }
    else {
        console.log("OnStart 4");
        await pfnStartGame(pRoomObj);
    }
}

// 获取最大押注
function GetMaxYZ(pRoomObj) {
    var Result = 0;
    var pGameObj = pRoomObj.pGameObj;
    var pGameObjEx = pRoomObj.pGameObjEx;

    for (var iIndex = 0; iIndex < pGameObjEx.pPlayers.length; ++iIndex) {
        var pUserObj = pGameObjEx.pPlayers[iIndex];
        var pStakeObj = RoomMgr.GetStakeObj(pRoomObj, pUserObj.iUserId);
        if (pUserObj.iState != RoomMgr.SeatState.SEAT_STATE_LOSE) {
            if (Result < pStakeObj.iJiFenYZ) Result = pStakeObj.iJiFenYZ;
        }
    }

    return Result;
}

function ClearUserOptTimerPtr(pUserObj) {
    if (pUserObj.pOptTimerPtr != null) {
        clearTimeout(pUserObj.pOptTimerPtr);

        //delete pUserObj.iOptCmd;
        delete pUserObj.tmOptTimerPtr;
        delete pUserObj.pOptTimerPtr;
    }
}

// 三花牌通知
function NotifySHP(pRoomObj) {
    var pGameObjEx = pRoomObj.pGameObjEx;
    if (pGameObjEx == null) return;

    var pRetObj = {
        wErrCode: ErrorCodes.ERR_NOERROR,
        szErrMsg: "操作成功",
        pItems: []
    };

    for (var iIndex = 0; iIndex < pGameObjEx.pPlayers.length; ++iIndex) {
        var pUserObj = pGameObjEx.pPlayers[iIndex];

        var iSHPMode = 0;
        if (pUserObj.iSHPMode == 1) {
            if (GLibs.IsKeySHL(pUserObj.pPais)) {
                iSHPMode = 1;
            }
            else if (GLibs.IsKeySHS(pUserObj.pPais)) {
                iSHPMode = 2;
            }
        }

        if (iSHPMode != 0) {
            pRetObj.pItems.push({
                iUserId: pUserObj.iUserId,
                pPais: pUserObj.pPais,
                iSHPMode: iSHPMode,
            });
        }
    }

    if (pRetObj.pItems.length > 0) SendMsgToAll(pRoomObj, "shp_notify", pRetObj, 0);
}


// 押注
async function OnStake(pReqArgs) {
    var pRoomObj = RoomMgr.GetRoomObj(pReqArgs.iRoomId);
    if (pRoomObj == null) {
        SendMsg(pReqArgs.pSocket, "yazhu_result", {
            wErrCode: ErrorCodes.ERR_ROOMISNOTEXISTS,
            szErrMsg: "房间不存在"
        });
        return;
    }
    console.log("OnStake iRoomId:" + pRoomObj.iRoomId + ", iUserId:" + pReqArgs.iUserId);

    if (!pRoomObj.bRunning) return;

    var pPlayerObj = GetPlayerObj(pRoomObj, pReqArgs.iUserId);
    if (pPlayerObj == null) {
        console.log("OnStake iRoomId:" + pRoomObj.iRoomId + ", iUserId:" + pReqArgs.iUserId + " is not playing");
        return;
    }

    if (pPlayerObj.iState == RoomMgr.SeatState.SEAT_STATE_LOSE) { // 丢牌玩家不能再押注
        console.log("OnStake iRoomId:" + pRoomObj.iRoomId + ", iUserId:" + pReqArgs.iUserId + " is lose user.");
        return;
    }

    if (pPlayerObj.iState == RoomMgr.SeatState.SEAT_STATE_QIAO) { // 敲牌玩家不能再押注
        console.log("OnStake iRoomId:" + pRoomObj.iRoomId + ", iUserId:" + pReqArgs.iUserId + " is qiao user.");
        return;
    }

    var pGameObjEx = pRoomObj.pGameObjEx;
    if (pPlayerObj != pGameObjEx.pCursor) {   // 只有轮到自己时才能押注
        console.log("OnStake iRoomId:" + pRoomObj.iRoomId + ", iUserId:" + pReqArgs.iUserId + " is not current user");
        return;
    }

    pReqArgs.iJiFen = parseInt(pReqArgs.iJiFen);
    pReqArgs.iMode = parseInt(pReqArgs.iMode);

    var pJiFenObj = RoomMgr.GetJiFenObj(pRoomObj, pPlayerObj.iUserId);    // 玩家积分信息
    var pStakeObj = RoomMgr.GetStakeObj(pRoomObj, pPlayerObj.iUserId);

    var iMaxYZ = GetMaxYZ(pRoomObj);
    if (pReqArgs.iJiFen == iMaxYZ) pReqArgs.iMode = 0;

    if (pReqArgs.iMode == 0) {   // 跟
        pReqArgs.iJiFen = iMaxYZ - pStakeObj.iJiFenYZ;    //pGameObjEx.iCurrentYZ - pStakeObj.iJiFenYZ;
        //if (pReqArgs.iJiFen < pGameObjEx.iJiFenGEN) pReqArgs.iJiFen = pGameObjEx.iJiFenGEN;

        if (pReqArgs.iJiFen >= pJiFenObj.iJiFen) {
            pReqArgs.iMode = 2;
            pReqArgs.iJiFen = pJiFenObj.iJiFen;
        }
        console.log("OnStake 跟");
    }
    else if (pReqArgs.iMode == 1) {  // 加注
        if (pReqArgs.iJiFen < pGameObjEx.iCurrentYZ) {
            SendMsg(pReqArgs.pSocket, "yazhu_result", {
                wErrCode: ErrorCodes.ERR_NOTENOUGHJIFEN,
                szErrMsg: "加注积分不能小于 " + pGameObjEx.iCurrentYZ
            });
            return;
        }

        console.log("OnStake 大");
        pReqArgs.iJiFen = pReqArgs.iJiFen - pStakeObj.iJiFenYZ;
    }
    else {  // 敲
        console.log("OnStake 敲");
        pReqArgs.iJiFen = pJiFenObj.iJiFen;
    }

    console.log("OnStake iUserId:" + pPlayerObj.iUserId + ", iJiFenYZ:" + pReqArgs.iJiFen);
    if (pReqArgs.iJiFen > pJiFenObj.iJiFen) {
        console.log("OnStake 1111111111111111111111");
        SendMsg(pReqArgs.pSocket, "yazhu_result", {
            wErrCode: ErrorCodes.ERR_NOTENOUGHJIFEN,
            szErrMsg: "积分不够"
        });

        return;
    }

    RemoveTimeOut(pRoomObj);
    ClearUserOptTimerPtr(pPlayerObj);

    pJiFenObj.iJiFen -= pReqArgs.iJiFen;
    pStakeObj.iJiFenYZ += pReqArgs.iJiFen;
    console.log("OnStake iUserId:" + pPlayerObj.iUserId + ", iJiFenYZ:" + pStakeObj.iJiFenYZ + ", pJiFenObj.iJiFen:" + pJiFenObj.iJiFen);

    pPlayerObj.iTimeOutPlayTimes = 0;
    //if (pUserObj.iSHPMode == 1) pUserObj.iSHPMode = 2;  // 把手上的三花牌当做普通牌型计算
    if (pJiFenObj.iJiFen == 0) {
        pReqArgs.iMode = 2;
        pPlayerObj.iState = RoomMgr.SeatState.SEAT_STATE_QIAO; // 敲钵钵了
    }

    if (pReqArgs.iMode == 1) {
        pGameObjEx.iJiFenGEN = pStakeObj.iJiFenYZ;
    }
    else if (pReqArgs.iMode == 2) {
        pGameObjEx.iJiFenGEN = pStakeObj.iJiFenYZ;
    }

    iMaxYZ = GetMaxYZ(pRoomObj);
    if (pGameObjEx.iJiFenGEN < iMaxYZ) pGameObjEx.iJiFenGEN = iMaxYZ;

    if (pGameObjEx.iCurrentYZ <= pStakeObj.iJiFenYZ) {
        pGameObjEx.iCurrentYZ = pStakeObj.iJiFenYZ * 2;
    }
    console.log("OnStake iJiFenGEN:" + pGameObjEx.iJiFenGEN + ", iJiFenJIA:" + pGameObjEx.iCurrentYZ);

    await dbLGQ.update_user_stake(pRoomObj.szRoomUUID, pPlayerObj.iUserId, -pReqArgs.iJiFen, pStakeObj);
    var pRetObj = {
        wErrCode: ErrorCodes.ERR_NOERROR,
        szErrMsg: "操作成功",

        iUserId: pPlayerObj.iUserId,
        iJiFenYZ: pReqArgs.iJiFen,          // 此次押注积分
        iJiFenYZSum: pStakeObj.iJiFenYZ,    // 此用户总押注积分
        iJiFenYZMax: pGameObjEx.iCurrentYZ, // 本圈最大押注积分
        iNewJiFen: pPlayerObj.iOrgJiFen,    // pJiFenObj.iJiFen,        // 用户剩余积分
        iMode: pReqArgs.iMode               // 0:跟, 1:大, 2:敲
    }
    SendMsgToAll(pRoomObj, "yazhu_notify", pRetObj);

    pPlayerObj.bOperator = true;
    pPlayerObj.bBQStake = true;     // 玩家本轮喊话了
    pPlayerObj.iTimesYZ += 1;
    pGameObjEx.bCanXIU = false;     // 有人押注后禁用休操作

    AddActionStake(pRoomObj.pVideo, pPlayerObj.iUserId, pReqArgs.iMode, pStakeObj.iJiFenYZ);    // 保存录像数据

    for (var iIndex = 0; iIndex < pGameObjEx.pPlayers.length; ++iIndex) {
        var pItem = pGameObjEx.pPlayers[iIndex];
        if (pItem.iUserId == pPlayerObj.iUserId) continue;

        var pItemJF = RoomMgr.GetStakeObj(pRoomObj, pItem.iUserId);
        if (pStakeObj.iJiFenYZ >= pItemJF.iJiFenYZ * 2) pItem.bBQStake = false;
    }

    // 重置休牌玩家状态
    for (var iIndex = 0; iIndex < pGameObjEx.pPlayers.length; ++iIndex) {
        var pItem = pGameObjEx.pPlayers[iIndex];
        if (pItem.iState == RoomMgr.SeatState.SEAT_STATE_REST) {
            pItem.iState = RoomMgr.SeatState.SEAT_STATE_PLAY;
        }
    }
    await ExeNextAction(pRoomObj);

    console.log("OnStake leave");
}

// 丢
async function OnLose(pReqArgs) {
    var pRoomObj = RoomMgr.GetRoomObj(pReqArgs.iRoomId);
    if (pRoomObj == null) {
        SendMsg(pReqArgs.pSocket, "lose_result", {
            wErrCode: ErrorCodes.ERR_ROOMISNOTEXISTS,
            szErrMsg: "房间不存在"
        });
        return;
    }
    console.log("OnLose iRoomId:" + pRoomObj.iRoomId + ", iUserId:" + pReqArgs.iUserId);

    if (!pRoomObj.bRunning) return;

    var pPlayerObj = GetPlayerObj(pRoomObj, pReqArgs.iUserId);
    if (pPlayerObj == null) {
        console.log("OnLose iRoomId:" + pRoomObj.iRoomId + ", iUserId:" + pReqArgs.iUserId + " is not playing");
        return;
    }

    var pGameObjEx = pRoomObj.pGameObjEx;
    if (pPlayerObj != pGameObjEx.pCursor) {
        console.log("OnLose iRoomId:" + pRoomObj.iRoomId + ", iUserId:" + pReqArgs.iUserId + " is not current user");
        return;
    }

    RemoveTimeOut(pRoomObj);
    ClearUserOptTimerPtr(pPlayerObj);

    pPlayerObj.bOperator = true;
    pPlayerObj.iState = RoomMgr.SeatState.SEAT_STATE_LOSE;

    if (pReqArgs.bTimeOut) {
        pPlayerObj.iTimeOutPlayTimes += 1; // 用户没有手动操作，超时丢牌
    }
    else {
        pPlayerObj.iTimeOutPlayTimes = 0;
    }

    SendMsgToAll(pRoomObj, "lose_notify", {
        wErrCode: ErrorCodes.ERR_NOERROR,
        szErrMsg: "操作成功",
        iUserId: pPlayerObj.iUserId
    });

    AddActionLose(pRoomObj.pVideo, pPlayerObj.iUserId); // 保存录像数据

    await ExeNextAction(pRoomObj);
}

// 休
async function OnRest(pReqArgs) {
    var pRoomObj = RoomMgr.GetRoomObj(pReqArgs.iRoomId);
    if (pRoomObj == null) {
        SendMsg(pReqArgs.pSocket, "rest_result", {
            wErrCode: ErrorCodes.ERR_ROOMISNOTEXISTS,
            szErrMsg: "房间不存在"
        });
        return;
    }
    console.log("OnRest iRoomId:" + pRoomObj.iRoomId + ", iUserId:" + pReqArgs.iUserId);

    if (!pRoomObj.bRunning) return;

    var pPlayerObj = GetPlayerObj(pRoomObj, pReqArgs.iUserId);
    if (pPlayerObj == null) {
        console.log("OnRest iRoomId:" + pRoomObj.iRoomId + ", iUserId:" + pReqArgs.iUserId + " is not playing");
        return;
    }

    if (!pPlayerObj.pOperator.bCanXIU) {
        console.log("OnRest iRoomId:" + pRoomObj.iRoomId + ", iUserId:" + pReqArgs.iUserId + " is can not xiu");
        return;
    }

    var pGameObjEx = pRoomObj.pGameObjEx;
    if (pPlayerObj != pGameObjEx.pCursor) {
        console.log("OnRest iRoomId:" + pRoomObj.iRoomId + ", iUserId:" + pReqArgs.iUserId + " is not current user");
        return;
    }

    if (!pGameObjEx.bCanXIU) {
        SendMsg(pReqArgs.pSocket, "rest_result", {
            wErrCode: ErrorCodes.ERR_CANNOTXIUPAI,
            szErrMsg: "不能休牌了"
        });
        return;
    }

    RemoveTimeOut(pRoomObj);
    ClearUserOptTimerPtr(pPlayerObj);

    pPlayerObj.bBQStake = true;
    pPlayerObj.bOperator = true;
    pPlayerObj.iTimesYZ += 1;
    pGameObjEx.iXiuNum += 1;

    if (!pPlayerObj.bTimeOut) pPlayerObj.iTimeOutPlayTimes = 0;
    pGameObjEx.pSHUsers.push(pPlayerObj.iUserId);
    pPlayerObj.iState = RoomMgr.SeatState.SEAT_STATE_REST;
    //if (pUserObj.iSHPMode == 1) pUserObj.iSHPMode = 2;  // 把手上的三花牌当做普通牌型计算

    SendMsgToAll(pRoomObj, "rest_notify", {
        wErrCode: ErrorCodes.ERR_NOERROR,
        szErrMsg: "操作成功",
        iUserId: pPlayerObj.iUserId
    });

    AddActionRest(pRoomObj.pVideo, pPlayerObj.iUserId); // 保存录像数据

    if (IsXiuM(pRoomObj)) {    // 是否休芒
        // 所有人都休了 (休芒, 下一局要打芒果, 下一局每个用户再拿一份之前桌子上自己出的底钱再放到底上)
        // 比如每一局每个底为 2 分的话，第一次休芒为 2 分，每 2 次 4 分，第三次 8 分，以此类推
        //pRoomObj.iJiFenMG = pRoomObj.iJiFenMG + pRoomObj.iJiFenMG;  // 下一局要打的芒果分
        OnXiuMEvent(pRoomObj);
        return;
    }

    if (IsZouM(pRoomObj)) {     // 是否揍芒
        //pRoomObj.iJiFenMG = pRoomObj.iJiFenMG + pRoomObj.iJiFenMG;  // 下一局要打的芒果分(本局押注玩家下局不打芒果)
        OnZouMEvent(pRoomObj);
        return;
    }
    else {
        ExeNextAction(pRoomObj);
    }
}

// 分牌
async function OnSplit(pReqArgs) {
    var pRoomObj = RoomMgr.GetRoomObj(pReqArgs.iRoomId);
    if (pRoomObj == null) {
        SendMsg(pReqArgs.pSocket, "split_result", {
            wErrCode: ErrorCodes.ERR_ROOMISNOTEXISTS,
            szErrMsg: "房间不存在"
        });
        return;
    }
    console.log("OnSplit iRoomId:" + pRoomObj.iRoomId + ", iUserId:" + pReqArgs.iUserId);

    if (!pRoomObj.bRunning) return;

    var pPlayerObj = GetPlayerObj(pRoomObj, pReqArgs.iUserId);
    if (pPlayerObj == null) {
        console.log("OnSplit iRoomId:" + pRoomObj.iRoomId + ", iUserId:" + pReqArgs.iUserId + " is not playing");
        return;
    }

    RemoveTimeOut(pRoomObj);
    ClearUserOptTimerPtr(pPlayerObj);

    if (pPlayerObj.pPais.length == 4) {
        var pPais1 = pReqArgs.pPais1;
        var pPais2 = pReqArgs.pPais2;

        if (pPlayerObj.pPais.indexOf(pPais1[0]) == -1) return;
        if (pPlayerObj.pPais.indexOf(pPais1[1]) == -1) return;

        if (pPlayerObj.pPais.indexOf(pPais2[0]) == -1) return;
        if (pPlayerObj.pPais.indexOf(pPais2[1]) == -1) return;

        pPais1[0] = parseInt(pPais1[0]);
        pPais1[1] = parseInt(pPais1[1]);
        pPais1.sort(function(left, right) {
            return GLibs.ComparePai(left, right);
        });

        pPais2[0] = parseInt(pPais2[0]);
        pPais2[1] = parseInt(pPais2[1]);
        pPais2.sort(function(left, right) {
            return GLibs.ComparePai(left, right);
        });

        pPlayerObj.pPais1 = pPais1.concat();
        pPlayerObj.pPais2 = pPais2.concat();

        var iRet = GLibs.ComparePais(pPlayerObj.pPais1, pPlayerObj.pPais2);
        if (iRet == 1) {
            var pTemp = pPlayerObj.pPais1.concat();

            pPlayerObj.pPais1 = pPlayerObj.pPais2;
            pPlayerObj.pPais2 = pTemp;
        }

        SendMsgToAll(pRoomObj, "split_notify", {
            wErrCode: ErrorCodes.ERR_NOERROR,
            szErrMsg: "操作成功",

            iUserId: pPlayerObj.iUserId,
            pPais1: pPlayerObj.pPais1.concat(),
            pPais2: pPlayerObj.pPais2.concat()
        });

        var iSplitNum = 0;
        var iPlayerNum = 0;
        var pGameObjEx = pRoomObj.pGameObjEx;
        for (var iIndex = 0; iIndex < pGameObjEx.pPlayers.length; ++iIndex) {
            var pItem = pGameObjEx.pPlayers[iIndex];
            if (pItem.iState == RoomMgr.SeatState.SEAT_STATE_LOSE) continue;

            ++iPlayerNum;
            if (pItem.pPais1 != null) iSplitNum += 1;
        }

        if (iSplitNum == iPlayerNum) {
            var pRetObj = {
                wErrCode: ErrorCodes.ERR_NOERROR,
                szErrMsg: "操作成功",
                pGroups: []
            };

            for (var iIndex = 0; iIndex < pGameObjEx.pPlayers.length; ++iIndex) {
                var pItem = pGameObjEx.pPlayers[iIndex];
                if (pItem.iState == RoomMgr.SeatState.SEAT_STATE_LOSE) continue;

                // var iRet = GLibs.ComparePais(pItem.pPais1, pItem.pPais2);
                // if (iRet == 1) {
                //     var pTemp = pItem.pPais1.concat();

                //     pItem.pPais1 = pItem.pPais2;
                //     pItem.pPais2 = pTemp;
                // }

                pRetObj.pGroups.push({
                    iUserId: pItem.iUserId,
                    pPais1: pItem.pPais1,
                    pPais2: pItem.pPais2
                });
            }
            SendMsgToAll(pRoomObj, "split_complete_notify", pRetObj);

            AddActionSplit(pRoomObj.pVideo, pRetObj.pGroups);   // 保存录像数据

            await JieShuan(pRoomObj);     // 所有玩家都分完牌了，结算输赢
        }
    }
}

// 牌局结束后是否要显示指定牌
async function OnDisplayPai(pReqArgs) {
    var pRoomObj = RoomMgr.GetRoomObj(pReqArgs.iRoomId);
    if (pRoomObj == null) {
        SendMsg(pReqArgs.pSocket, "showpai_result", {
            wErrCode: ErrorCodes.ERR_ROOMISNOTEXISTS,
            szErrMsg: "房间不存在"
        });
        return;
    }
    console.log("OnDisplayPai iRoomId:" + pRoomObj.iRoomId + ", iUserId:" + pReqArgs.iUserId);

    if (!pRoomObj.bRunning) return;

    var pUserObj = GetPlayerObj(pRoomObj, pReqArgs.iUserId);
    if (pUserObj == null) {
        console.log("OnDisplayPai iRoomId:" + pRoomObj.iRoomId + ", iUserId:" + pReqArgs.iUserId + " is not playing");
        return;
    }

    pReqArgs.iIndex = parseInt(pReqArgs.iIndex);
    
    var iPos = pUserObj.pShowIdx.indexOf(pReqArgs.iIndex);
    if (pReqArgs.iShowMode == 0) {
        if (iPos >= 0) pUserObj.pShowIdx.splice(iPos, 1);
    }
    else if (iPos == -1) {
        pUserObj.pShowIdx.push(pReqArgs.iIndex);
    }

    SendMsg(pReqArgs.pSocket, "showpai_result", {
        wErrCode: ErrorCodes.ERR_NOERROR,
        szErrMsg: "操作成功",
        pShowIdx: pUserObj.pShowIdx
    });
}

// 秀牌
async function OnShowPai(pReqArgs) {
    var pRoomObj = RoomMgr.GetUserRoomObj(pReqArgs.iUserId);  // RoomMgr.GetRoomObj(pReqArgs.iRoomId);
    if (pRoomObj == null) {
        SendMsg(pReqArgs.pSocket, "showpais_result", {
            wErrCode: ErrorCodes.ERR_ROOMISNOTEXISTS,
            szErrMsg: "房间不存在"
        });
        return;
    }
    console.log("OnShowPai iRoomId:" + pRoomObj.iRoomId + ", iUserId:" + pReqArgs.iUserId);

    if (pRoomObj.pPaiMaps == null) {
        console.log("OnShowPai iRoomId:" + pRoomObj.iRoomId + " pGameObjEx is null");
        return;
    }
    var countOnstart = pRoomObj.countOnstart;
    var pUserInfo = await dbLGQ.get_user_info(pReqArgs.iUserId);
    pUserInfo.gems = parseInt(pUserInfo.gems);
    if (pUserInfo.gems < 100) {
        SendMsg(pReqArgs.pSocket, "gems_noten_result", {
            wErrCode: ErrorCodes.ERR_NOTENOUGHGEMS,
            szErrMsg: "钻石不够"
        });
        return;
    }

    if (countOnstart == pRoomObj.countOnstart) {
        console.log('OnShowPai showpai 1', pRoomObj.isShowPai)

        if (pRoomObj.isShowPai) {
            return;
        }
        pRoomObj.isShowPai = true;
        if (pRoomObj.pTimerPtr) {
            clearTimeout(pRoomObj.pTimerPtr);
            pRoomObj.pTimerPtr = null;
        }

        console.log('OnShowPai showpai 2', pRoomObj.isShowPai);

        await dbCC.query("update tb_users set gems = gems - 100 where userid = $1", [pReqArgs.iUserId]);

        var pRetObj = {
            wErrCode: ErrorCodes.ERR_NOERROR,
            szErrMsg: "操作成功",
            pPaiMaps: pRoomObj.pPaiMaps
        };

        SendMsgToAll(pRoomObj, "showpais_notify", pRetObj, 0);

        await DB_SetPJHG_ShowPai(pRoomObj);
        await NotifyToAllPaiJuLogs(pRoomObj, -1);

        var pReqArgs = {
            iRoomId: pRoomObj.iRoomId,
            iUserId: pRoomObj.iCreator,
            pSocket: null
        };
        pRoomObj.pTimerPtr = setTimeout(OnStart, TIME_OUT_START_VALUE * 1000, pReqArgs);

        console.log('================================ 2');
        console.log(countOnstart , pRoomObj.countOnstart);
    }
    else {
        console.log('================================ 1');
        console.log(countOnstart , pRoomObj.countOnstart);
    }
}


// 将游戏数据转换成保存到数据库中的数据格式
function GetDBSaveObj(pRoomObj) {
    var pGameObj = pRoomObj.pGameObj;
    var pGameObjEx = pRoomObj.pGameObjEx;

    var pSaveObj = {
        iJiFenMG: pGameObj.iJiFenMG,    // 芒果池剩余积分
        iNextMG: pGameObj.iNextMG,      // 下一局要打的芒果
        iWinUser: pGameObj.iWinUser,    // 上一局揍芒赢家
        pStakes: {}                     // 押注信息
    };

    for (var iIndex = 0; iIndex < pGameObjEx.pPlayers.length; ++iIndex) {
        var pUserObj = pGameObjEx.pPlayers[iIndex];
        var pStakeObj = RoomMgr.GetStakeObj(pRoomObj, pUserObj.iUserId);
        if (pStakeObj == null) continue;

        pSaveObj.pStakes[pUserObj.iUserId] = {
            iJiFenYZ: pStakeObj.iJiFenYZ,
            iJiFenMG: pStakeObj.iJiFenMG
        };
    }

    return pSaveObj;
}

async function UpdateAllPlayerJiFen(pRoomObj, bClearStakes) {
    var pfnSaveOnePlayer = async function (pPlayers, iIndex) {
        if (iIndex >= pPlayers.length) return;

        var pUserObj = pPlayers[iIndex];
        var pJiFenObj = RoomMgr.GetJiFenObj(pRoomObj, pUserObj.iUserId);
        var pStakeObj = RoomMgr.GetStakeObj(pRoomObj, pUserObj.iUserId);

        if (bClearStakes) {
            await dbCC.query("update tb_userjifen_info set jifen = $1, jifensy = $2, stakes = null where roomuuid = $3 and userid = $4",
                [pJiFenObj.iJiFen, pJiFenObj.iSumSY, pRoomObj.szRoomUUID, pUserObj.iUserId]);
        }
        else {
            await dbCC.query("update tb_userjifen_info set jifen = $1, jifensy = $2, stakes = $3 where roomuuid = $4 and userid = $5",
                [pJiFenObj.iJiFen, pJiFenObj.iSumSY, JSON.stringify(pStakeObj), pRoomObj.szRoomUUID, pUserObj.iUserId]);
        }

        await pfnSaveOnePlayer(pPlayers, iIndex + 1);
    }

    await dbCC.query("update tb_rooms set gameinfo = $1 where roomuuid = $2",
        [JSON.stringify(pRoomObj.pGameObj), pRoomObj.szRoomUUID]);

    await pfnSaveOnePlayer(pRoomObj.pGameObjEx.pPlayers, 0);
}

// 录像数据
function CreateActionsObject(pRoomObj) {
    var pGameObj = pRoomObj.pGameObj;
    var pGameObjEx = pRoomObj.pGameObjEx;

    var pPlayers = [];
    for (var iIndex = 0; iIndex < pGameObjEx.pPlayers.length; ++iIndex) {
        var pPlayerObj = pGameObjEx.pPlayers[iIndex];
        var pJiFenObj = RoomMgr.GetJiFenObj(pRoomObj, pPlayerObj.iUserId);
        var pItem = {
            iUserId: pPlayerObj.iUserId,
            szAlias: pPlayerObj.szAlias,
            szHeadIco: pPlayerObj.szHeadIco,
            iSeatIndex: pPlayerObj.iSeatIndex,
            iOrgJiFen: pJiFenObj.iJiFen,
            pPais: pPlayerObj.pPais,  // 初始发牌
        };

        pPlayers.push(pItem);
    }

    var Result = {
        iRoomId: pRoomObj.iRoomId,
        szRoomUUID: pRoomObj.szRoomUUID,
        pRoomArgs: pRoomObj.pRoomArgs,
        iBanker: pGameObjEx.pBanker.iUserId,
        iJiFenMGC: pGameObj.iJiFenMG,
        pPlayers: pPlayers,
        pActions: []
    };

    return Result;
}

// 押底分动作
function AddActionBaseYZ(pVideo, pData) {
    var pActionObj = {
        iCmd: ActionTypes.ACTION_TYPE_CDF,        // 1:出底分 2:跟, 3:大, 4:敲, 5:休, 6:丢, 7:延时, 8:发牌
        szCmdName: "罢底",
        pData: pData
    };
    pVideo.pActions.push(pActionObj);
}

// 休动作
function AddActionRest(pVideo, iUserId) {
    var pActionObj = {
        iUserId: iUserId,
        iCmd: ActionTypes.ACTION_TYPE_XIU,
        szCmdName: "休",
    }
    pVideo.pActions.push(pActionObj);
}

// 丢动作
function AddActionLose(pVideo, iUserId) {
    var pActionObj = {
        iUserId: iUserId,
        iCmd: ActionTypes.ACTION_TYPE_DIU,
        szCmdName: "丢",
    }
    pVideo.pActions.push(pActionObj);
}

// 押注动作
function AddActionStake(pVideo, iUserId, iMode, iValue) {
    var iCmd = ActionTypes.ACTION_TYPE_QIAO;
    var szCmdName = "敲";

    if (iMode == 0) {
        szCmdName = "跟";
        iCmd = ActionTypes.ACTION_TYPE_GEN;
    }
    else if (iMode == 1) {
        szCmdName = "大";
        iCmd = ActionTypes.ACTION_TYPE_DA;
    }

    var pActionObj = {
        iUserId: iUserId,
        iCmd: iCmd,        // 1:出底分 2:跟, 3:大, 4:敲, 5:休, 6:丢, 7:延时, 8:发牌
        szCmdName: szCmdName,
        iValue: iValue,    // 跟 / 大 / 敲 积分,  / 延时秒数
    };
    pVideo.pActions.push(pActionObj);
}

// 发牌动作
function AddActionDeal(pVideo, pData) {
    var pActionObj = {
        iCmd: ActionTypes.ACTION_TYPE_DEAL,        // 1:出底分 2:跟, 3:大, 4:敲, 5:休, 6:丢, 7:延时, 8:发牌
        szCmdName: "发牌",
        pData: pData
    };
    pVideo.pActions.push(pActionObj);
}

// 分牌动作
function AddActionSplit(pVideo, pData) {
    var pActionObj = {
        iCmd: ActionTypes.ACTION_TYPE_FENPAI,        // 1:出底分 2:跟, 3:大, 4:敲, 5:休, 6:丢, 7:延时, 8:发牌
        szCmdName: "分牌",
        pData: pData
    };
    pVideo.pActions.push(pActionObj);
}

// 结算动作
function AddActionJieSuan(pVideo, pData) {
    var pActionObj = {
        iCmd: ActionTypes.ACTION_TYPE_JIESUAN,        // 1:出底分 2:跟, 3:大, 4:敲, 5:休, 6:丢, 7:延时, 8:发牌
        szCmdName: "结算",
        pData: pData
    };
    pVideo.pActions.push(pActionObj);
}

// ====================================== 扯旋儿游戏逻辑 ======================================
// 洗牌
function Shuffle(pGameObjEx) {
    pGameObjEx.pPais = [
        2000,               // 大王
        112, 312,           // 方块与红桃 Q
        211, 411,           // 梅子与黑桃 J
        110, 210, 310, 410, // 4 张 10
        209, 409,           // 梅子与黑桃 9
        108, 208, 308, 408, // 4 张 8
        107, 207, 307, 407, // 4 张 7
        106, 206, 306, 406, // 4 张 6
        205, 405,           // 梅子与黑桃 5
        104, 204, 304, 404, // 4 张 4
        303,                // 红桃 3
        102, 302            // 方块与红桃 2
    ];

    var iTimes = 1000;
    while (iTimes > 0) {
        var iLeft = SysUtils.GenRandValue(0, pGameObjEx.pPais.length - 1);
        var iRight = SysUtils.GenRandValue(0, pGameObjEx.pPais.length - 1);
        if (iLeft != iRight) {
            var iVal = pGameObjEx.pPais[iLeft];
            pGameObjEx.pPais[iLeft] = pGameObjEx.pPais[iRight];
            pGameObjEx.pPais[iRight] = iVal;
            --iTimes;
        }
    }
}

// 随机获取一张牌
function GetRandPai(pGameObjEx) {
    return pGameObjEx.pPais.pop();
}

// 发指定牌, 如果指定的牌不存在，则随机发一张牌
function GetSpecifyPai(pGameObjEx, iPai) {
    var iPos = pGameObjEx.pPais.indexOf(iPai);
    if (iPos == -1) {
        return GetRandPai(pGameObjEx);
    }
    else {
        pGameObjEx.pPais.splice(iPos, 1);
        return iPai;
    }
}

// 发牌
function GetRandPoker(pUserObj, pPais) {
    var iPai = -1;
    if (pUserObj.pCtrlPais != null) {
        console.log(pUserObj.pCtrlPais);

        if (pUserObj.pCtrlPais.length > 0) iPai = pUserObj.pCtrlPais.pop();
    }

    if (iPai == -1) {
        var iRandPos = SysUtils.GenRandValue(0, pPais.length - 1);
        iPai = pPais[iRandPos];
        pPais.splice(iRandPos, 1);
    }
    pUserObj.pPais.push(iPai);

    return iPai;
}

function GetNewPoker(pRoomObj, pUserObj) {
    var pGameObjEx = pRoomObj.pGameObjEx;

    var iPai = -1;
    if (pUserObj.pCtrlPais != null) {
        if (pUserObj.pCtrlPais.length > 0) iPai = pUserObj.pCtrlPais.pop();
    }

    if (iPai == -1) iPai = GetRandPai(pGameObjEx);

    pUserObj.pPais.push(iPai);

    return iPai;
}

async function Deal(pRoomObj, pGameObjEx) {
    var pData = {
        wErrCode: ErrorCodes.ERR_NOERROR,
        szErrMsg: "操作成功",
        iBankerUser: pGameObjEx.pBanker.iUserId,
        pPlayers: []
    }

    //var pUserObjs = [];
    for (var iIndex = 0; iIndex < pGameObjEx.pPlayers.length; ++iIndex) {
        var pPlayerObj = pGameObjEx.pPlayers[iIndex];

        // 先发两张牌
        GetNewPoker(pRoomObj, pPlayerObj);
        GetNewPoker(pRoomObj, pPlayerObj);

        var pItem = {
            iSeatIndex: pPlayerObj.iSeatIndex,
            iUserId: pPlayerObj.iUserId,
            pPais: pPlayerObj.pPais.concat()
        };
        //pUserObjs.push(pItem);
        pData.pPlayers.push(pItem);
        //console.log("Deal :" + JSON.stringify(pItem));
    }
    AddActionDeal(pRoomObj.pVideo, pData);

    SendMsgToAll(pRoomObj, "deal_notify", pData, 0);
}

// 开局
async function StartGame(pRoomObj) {
    pRoomObj.bRunning = true;

    RemoveTimeOut(pRoomObj);

    pRoomObj.pRoomArgs.iBaseFen = parseInt(pRoomObj.pRoomArgs.iBaseFen);
    //pRoomObj.pRoomArgs.iMaxMG = parseInt(pRoomObj.pRoomArgs.iMaxMG);
    //pRoomObj.pRoomArgs.iMaxMG = 409600;

    console.log("StartGame iRoomId:" + pRoomObj.iRoomId +
        ", iBaseFen:" + pRoomObj.pRoomArgs.iBaseFen +
        ", iMaxMG:" + pRoomObj.pRoomArgs.iMaxMG);

    var pGameObj = pRoomObj.pGameObj;
    var pGameObjEx = {  // 游戏过程中数据对象
        pPais: [],
        pPlayers: [],
        pBanker: null,
        pCursor: null,
        pFirst: null,
        pFirstYZ: null, // 第一个押注玩家 (庄家的下二家, 庄家的下一家为必买一张牌)
        bCanXIU: false,  // 当前是否可以休
        iDealNum: 2,    // 每个用户发了几张牌了(初始每个用户发 2 张牌)
        iRoundNum: 1,   // 转了几轮了
        iCurrentYZ: pRoomObj.pRoomArgs.iBaseFen * 2,    // 最后一次押注分数
        pActionUsers: [],   // 哪些用户要显示自动休丢按钮状态
        iMaxQ: 0,           // 当前最大敲牌用户
        
        iXiuNum: 0,         // 有几个玩家休牌了
        bCanJZ: true,       // 是否搭动了(是否可以加注)
        bDDRound: 0,        // 第几圈喊钱出现在没搭动

        szState: "yazhu",   // 押注中
        pSHUsers: [],       // 本轮哪些玩家说话了
        pAction: {

        }
    };
    pRoomObj.pGameObjEx = pGameObjEx;     // 扩展游戏数据

    // 生成庄家
    if ((pRoomObj.iBankerIndex == null) || (pRoomObj.iBankerIndex == -1)) pRoomObj.iBankerIndex = 0;

    var pBanker = null;
    var iStartIndex = pRoomObj.iBankerIndex;
    while (true) {
        iStartIndex += 1;
        if (iStartIndex >= pRoomObj.pPlayers.length) iStartIndex = 0;

        var pItem = pRoomObj.pPlayers[iStartIndex];
        if (pItem.iUserId == 0) continue;

        if (pItem.iState == RoomMgr.SeatState.SEAT_STATE_READY) {
            pRoomObj.iBankerIndex = iStartIndex;
            pBanker = pItem;
            break;
        }

        if (iStartIndex == pRoomObj.iBankerIndex) break;
    }
    pGameObjEx.pBanker = pBanker;

    console.log("StartGame iRoomId:" + pRoomObj.iRoomId + ", iBankerUser:" + pBanker.iUserId + ", 2.iBankerIndex:" + pBanker.iSeatIndex);

    var iCtrlIndex = 0;
    var pCtrlPais = [
        [106, 312, 206, 2000],
        [104, 411, 306, 303],
        //[410, 210, 204, 310],
        //[404, 307, 102, 108],
        // [107, 307, 208, 408],
        
        // [102, 108, 104, 210],
        // [302, 308, 304, 410],

        // [204, 206, 211, 110],
        // [404, 406, 411, 310],

        // [106, 107, 205, 207],
        // [312, 405, 112, 306],
        // [209, 409, 303, 2000],
    ];

    // 选出所有本局要玩的用户
    for (var iIndex = 0; iIndex < pRoomObj.pPlayers.length; ++iIndex) {
        var pUserObj = pRoomObj.pPlayers[iIndex];
        if (pUserObj.iUserId == 0) continue;
        if (pUserObj.iState != RoomMgr.SeatState.SEAT_STATE_READY) continue;
        if (pUserObj.pLZTimerPtr != null) continue;

        if (pUserObj.iTimeOutPlayTimes == null) pUserObj.iTimeOutPlayTimes = 0;

        //console.log("StartGame iUserId:" + pUserObj.iUserId + ", iTimeOutPlayTimes:" + pUserObj.iTimeOutPlayTimes);
        var pItem = {
            iSeatIndex: pUserObj.iSeatIndex,
            iUserId: pUserObj.iUserId,
            szAlias: pUserObj.szAlias,
            szHeadIco: pUserObj.szHeadIco,
            iState: RoomMgr.SeatState.SEAT_STATE_PLAY,
            pPais: [],
            pShowIdx: [],           // 牌局结束后哪几张牌要显示出来
            pOperator: {
                bCanXIU: false,     // 是否可以休
                bCanDIU: false,     // 是否可以丢
                bCanYZ: false,      // 是否可以押注
                bCanFP: false,      // 是否可以分牌
            },
            pNext: null,
            iTimesYS: 0,            // 本轮执行了几次延时操作
            bBQStake: false,        // 本轮玩家是否喊了钱
            bOperator: false,       // 本轮此用户发话没得
            iTimesYZ: 0,            // 本轮一共喊了几次钱
            iSHPMode: 0,            // 0:常规牌, 1:三花六或三花十, 2:三花六或三花十当普通牌计算
            pCtrlPais: null,        // pCtrlPais[iCtrlIndex];
            iTimeOutPlayTimes: pUserObj.iTimeOutPlayTimes,   // 超时没有动作自动丢牌次数
            pUserRef: pUserObj,     // 用户对象引用
        };
        pUserObj.iState = pItem.iState;

        var pPrev = null;
        if (pGameObjEx.pPlayers.length > 0) pPrev = pGameObjEx.pPlayers[pGameObjEx.pPlayers.length - 1];
        
        RoomMgr.ClearLZReqTimerPtr(pUserObj);
        RoomMgr.ClearJFReqTimerPtr(pUserObj);
        pGameObjEx.pPlayers.push(pItem);

        if (pPrev != null) pPrev.pNext = pItem;
        if (pItem.iUserId == pBanker.iUserId) pGameObjEx.pBanker = pItem;

        //pItem.pCtrlPais = pCtrlPais[iCtrlIndex];
        //++iCtrlIndex;

        //console.log("StartGame player userid:" + pItem.iUserId + ", pCtrlPokers:" + JSON.stringify(pItem.pCtrlPais));
    }
    var pLast = pGameObjEx.pPlayers[pGameObjEx.pPlayers.length - 1];
    pLast.pNext = pGameObjEx.pPlayers[0];

    if (pGameObjEx.pBanker == null) console.log("StartGame pGameObj.pBanker == null");
    if (pGameObjEx.pBanker.pNext == null) console.log("StartGame pGameObj.pBanker.pNext == null");

    pGameObjEx.pCursor = pGameObjEx.pBanker.pNext;
    pGameObjEx.pFirst = pGameObjEx.pCursor;

    console.log("StartGame pBanker.iUserId:" + pBanker.iUserId + ", iSeatIndex:" + pBanker.iSeatIndex);
    console.log("StartGame pFirst.iUserId:" + pGameObjEx.pFirst.iUserId);

    // 扣底分 与 芒果
    RoomMgr.ClearStakeObjs(pRoomObj);    // 清空上一局押注信息
    if (pRoomObj.pRoomArgs.bLinkM) {     // 开启了手手芒
        if (pGameObj.iNextMG == 0) pGameObj.iNextMG = pRoomObj.pRoomArgs.iBaseFen * 2;
    }
    pGameObjEx.bRuChi = (pGameObj.iNextMG > 0); // 本局是否入池

    var pMsgData = {
        wErrCode: ErrorCodes.ERR_NOERROR,
        szErrMsg: "操作成功",
        iBankUser: pBanker.iUserId,
        iJiFenMGC: 0,
        iJiFenMGTimes: pGameObj.iJiFenMGTimes,
        pPlayers: []
    };

    pRoomObj.pVideo = CreateActionsObject(pRoomObj);    // 创建录像回放数据

    for (var iIndex = 0; iIndex < pGameObjEx.pPlayers.length; ++iIndex) {
        var pItem = pGameObjEx.pPlayers[iIndex];
        var pJiFenObj = RoomMgr.GetJiFenObj(pRoomObj, pItem.iUserId);

        pItem.iFirstJZ = 0;     // 首轮加注
        pItem.iFirstZJZ = 0;    // 首轮再加注
        pItem.iOrgJiFen = pJiFenObj.iJiFen;   // 原始积分
        pJiFenObj.iJiFen -= pRoomObj.pRoomArgs.iBaseFen;        // 出底分

        var iJiFenYZ = pRoomObj.pRoomArgs.iBaseFen;
        if (pItem == pGameObjEx.pCursor) {    // 首家多出一份底自动押第一次注
            pJiFenObj.iJiFen -= pRoomObj.pRoomArgs.iBaseFen;
            iJiFenYZ += pRoomObj.pRoomArgs.iBaseFen;
        }
        else {
            pGameObjEx.pActionUsers.push(pItem.iUserId);
        }

        var iJiFenMG = 0;
        if (pItem.iUserId == pRoomObj.iWinUser) {   // 上一局揍芒赢家
            if (pRoomObj.pRoomArgs.bLinkM) iJiFenMG = pRoomObj.pRoomArgs.iBaseFen * 2;
        }
        else {
            iJiFenMG = pGameObj.iNextMG;    // 出芒果分(如果没有开启芒果，此值为0)
        }
        pJiFenObj.iJiFen -= iJiFenMG;
        pItem.iOrgJiFen -= iJiFenMG;

        RoomMgr.SetStakeObj(pRoomObj, pItem.iUserId, { iJiFenMG: iJiFenMG, iJiFenYZ: iJiFenYZ });
        pGameObj.iJiFenMG += iJiFenMG;  // 芒果池

        var pMsgItem = {
            iUserId: pItem.iUserId,
            iJiFenMG: iJiFenMG,
            iJiFenYZ: iJiFenYZ,
            iNewJiFen: pItem.iOrgJiFen   // pJiFenObj.iJiFen
        };
        pMsgData.pPlayers.push(pMsgItem);

        //console.log("StartGame iUserId:" + pItem.iUserId +
        //    ", iJiFenMG:" + iJiFenMG +
        //    ", iJiFenYZ:" + iJiFenYZ +
        //    ", iJiFenMGC:" + pGameObj.iJiFenMG);
    }
    pMsgData.iJiFenMGC = pGameObj.iJiFenMG;

    AddActionBaseYZ(pRoomObj.pVideo, pMsgData);  // 保存录像数据

    pGameObjEx.iJiFenGEN = pRoomObj.pRoomArgs.iBaseFen * 2; // 跟注分
    if (pGameObjEx.iCurrentYZ < pGameObj.iJiFenMG) {
        pGameObjEx.iCurrentYZ = pGameObj.iJiFenMG;
    }
    if (pGameObjEx.iCurrentYZ == 0) {
        pGameObjEx.iCurrentYZ = pRoomObj.pRoomArgs.iBaseFen * 2;
    }

    pGameObjEx.pCursor.bOperator = true;
    pGameObjEx.pCursor = pGameObjEx.pCursor.pNext;

    await UpdateAllPlayerJiFen(pRoomObj, false);

    SendMsgToAll(pRoomObj, "start_notify", pMsgData);
    Shuffle(pGameObjEx);            // 洗牌

    var iCount = pMsgData.pPlayers.length;
    setTimeout(async function(pRoomObj, pGameObjEx, iCount) {
        await Deal(pRoomObj, pGameObjEx);     // 发牌
        setTimeout(SendOperator, iCount * 200 + 500, pRoomObj, pGameObjEx.pCursor, false, true, true, false);
        //await SendOperator(pRoomObj, pGameObjEx.pCursor, false, true, true, false);   // 庄家的下二家发话
    }, 2 * 1000, pRoomObj, pGameObjEx, iCount);
}

// 是否休芒
function IsXiuM(pRoomObj) {
    console.log("IsXiuM enter");
    var Result = true;
    var pGameObjEx = pRoomObj.pGameObjEx;

    if (!pRoomObj.pRoomArgs.bXiuZM) return false;   // 没有启用芒果功能

    for (var iIndex = 0; iIndex < pGameObjEx.pPlayers.length; ++iIndex) {
        var pItem = pGameObjEx.pPlayers[iIndex];

        if ((pItem.iState == RoomMgr.SeatState.SEAT_STATE_LOSE) || (pItem.iState == RoomMgr.SeatState.SEAT_STATE_REST)) continue;

        Result = false;
        break;
    }
    console.log("IsXiuM Result:" + Result);

    return Result;
}

// 是否揍芒
function IsZouM(pRoomObj) {
    console.log("IsZouM enter");
    var Result = true;
    var pGameObjEx = pRoomObj.pGameObjEx;
    var iPlayNum = 0;
    var iXPlayNum = 0;
    var iQPlayNum = 0;

    if (!pRoomObj.pRoomArgs.bXiuZM && !pRoomObj.pRoomArgs.bLinkM) return false;   // 没有启用芒果功能
    if (pGameObjEx.iDealNum > 2) {
        console.log("IsZouM Result:false");
        return false;
    }

    for (var iIndex = 0; iIndex < pGameObjEx.pPlayers.length; ++iIndex) {
        var pItem = pGameObjEx.pPlayers[iIndex];
        if (pItem.iState == RoomMgr.SeatState.SEAT_STATE_LOSE) continue;

        if (pItem.iState == RoomMgr.SeatState.SEAT_STATE_PLAY) iPlayNum += 1;
        if (pItem.iState == RoomMgr.SeatState.SEAT_STATE_REST) iXPlayNum += 1;
        if (pItem.iState == RoomMgr.SeatState.SEAT_STATE_QIAO) iQPlayNum += 1;
    }

    if (iXPlayNum > 0) Result = false;
    if (iPlayNum + iQPlayNum > 1) Result = false;
    console.log("IsZouM Result:" + Result);

    return Result;
}

// 获取牌局回顾 JSON 串
function GetPaiJuHuiGuJsonStr(pRoomObj) {
    var Result = [];
    var pGameObjEx = pRoomObj.pGameObjEx;

    for (var iIndex = 0; iIndex < pGameObjEx.pPlayers.length; ++iIndex) {
        var pUserObj = pGameObjEx.pPlayers[iIndex];
        var pJiFenObj = RoomMgr.GetJiFenObj(pRoomObj, pUserObj.iUserId);

        if (pUserObj.pPais == null) continue;
        if (pUserObj.pPais.length == 0) continue;

        var iSHPMode = 0;
        if (pUserObj.iSHPMode == 1) {
            if (GLibs.IsKeySHL(pUserObj.pPais)) {
                iSHPMode = 1;
            }
            else if (GLibs.IsKeySHS(pUserObj.pPais)) {
                iSHPMode = 2;
            }
        }

        var pItem = {
            iJiFenMGC: pRoomObj.pGameObj.iJiFenMG,
            iUserId: pUserObj.iUserId,
            szAlias: pUserObj.szAlias,
            szHeadIco: pUserObj.szHeadIco,
            bShowPai: pRoomObj.isShowPai,   // 是否秀牌
            iState: pUserObj.iState,        // 用户状态
            iSHPMode: iSHPMode,             // 三花牌类型 (0:普通牌, 1:三花六, 2:三花十)
            bZhongJiang: pUserObj.bZhongJiang,  // 玩家是否中奖
            pShowIdx: pUserObj.pShowIdx,    // 初始两张牌是否显示
            pPais: pUserObj.pPais,          // 用户手牌
            pPais1: null,                   // 用户分牌1
            pPais2: null,                   // 用户分牌2
            szPaisName1: null,
            szPaisName2: null,
            iJiFenYZ: pUserObj.iSaveYZ,     // 用户押注
            iJiFenMG: pUserObj.iSaveMG,     // 用户出的芒果
            iAddFenYZ: pUserObj.iAddFenYZ,  // 用户赢了多少皮
            iAddFenMG: pUserObj.iAddFenMG,  // 用户赢了多少芒果
            iJiFenSY: pUserObj.iJiFenSY,    // 本局总输赢

            pJiFenObj_iJiFen: pJiFenObj.iJiFen,
            pJiFenObj_iJiFenDR: pJiFenObj.iJiFenDR,
            pJiFenObj_iJiFenCDR: pJiFenObj.iJiFenCDR,
            pJiFenObj_iJiFenYQ: pJiFenObj.iJiFenYQ,
            pJiFenObj_iSumSY: pJiFenObj.iSumSY,
            pJiFenObj_iJiFenSY: pJiFenObj.iJiFenSY,
        };
        // console.log("pItem.iUserId:" + pItem.iUserId +
        //     ", iJiFenYZ:" + pUserObj.iSaveYZ +
        //     ", iJiFenMG:" + pUserObj.iSaveMG +
        //     ", iAddFenYZ:" + pUserObj.iAddFenYZ +
        //     ", iAddFenMG:" + pUserObj.iAddFenMG +
        //     ", iJiFenSY:" + pUserObj.iJiFenSY);

        //pItem.iJiFenSY = (pUserObj.iAddFenYZ + pUserObj.iAddFenMG - pUserObj.iSaveYZ - pUserObj.iSaveMG);

        if (pUserObj.pPais1 != null) {
            pItem.pPais1 = pUserObj.pPais1;
            pItem.pPais2 = pUserObj.pPais2;

            pItem.szPaisName1 = GLibs.GetPaiCodeObj(pItem.pPais1);
            if (pItem.szPaisName1 == null) {
                var iPoint = GLibs.GetPaiPoint(pItem.pPais1[0]) + GLibs.GetPaiPoint(pItem.pPais1[1]);

                iPoint = iPoint % 10;
                pItem.szPaisName1 = iPoint + "点";
            }
            else {
                pItem.szPaisName1 = pItem.szPaisName1.szName;
            }

            pItem.szPaisName2 = GLibs.GetPaiCodeObj(pItem.pPais2);
            if (pItem.szPaisName2 == null) {
                var iPoint = GLibs.GetPaiPoint(pItem.pPais2[0]) + GLibs.GetPaiPoint(pItem.pPais2[1]);

                iPoint = iPoint % 10;
                pItem.szPaisName2 = iPoint + "点";
            }
            else {
                pItem.szPaisName2 = pItem.szPaisName2.szName;
            }
        }

        Result.push(pItem);
    }

    return Result;
}

// 写入玩家日志信息
async function DB_SaveLogs(pRoomObj) {
    var pUserMaps = {};
    var pGameObjEx = pRoomObj.pGameObjEx;

    for (var iIndex = 0; iIndex < pGameObjEx.pPlayers.length; ++iIndex) {
        var pUserObj = pGameObjEx.pPlayers[iIndex];
        var pJiFenObj = RoomMgr.GetJiFenObj(pRoomObj, pUserObj.iUserId);

        pUserMaps[pUserObj.iUserId] = {
            pUserObj: pUserObj,
            iJiFenDR: pJiFenObj.iJiFenDR,
            iJiFen: pJiFenObj.iJiFen,
            iJiFenSY: pJiFenObj.iJiFenSY //pJiFenObj.iJiFen - pJiFenObj.iJiFenCDR   // 玩家当前输赢 = 剩余积分 - 带入积分
        }
    }

    for (var sKey in pUserMaps) {
        var pUserObj = pUserMaps[sKey].pUserObj;
        var iJiFenSY = pUserMaps[sKey].iJiFenSY;

        // 更新用户个人输赢信息
        await dbLGQ.update_player_jiesuan_logs(pRoomObj.iClubId, pRoomObj.szRoomUUID, pRoomObj.iRoomId, pRoomObj.pRoomArgs, pUserObj.iUserId, iJiFenSY);

        // 更新扩展数据
        var pUserInfo = await dbLGQ.get_user_info(pUserObj.iUserId);
        if (pUserInfo != null) {
            var pExtObj = dbLGQ.get_user_extdata(pUserInfo);

            var pUserItem = GetPlayerObj(pRoomObj, pUserObj.iUserId);
            if (pUserItem != null) {
                if (pUserItem.iJiFenSY > 0) pExtObj.iWinTimes += 1;
            } 

            pExtObj.iPlayTimes += 1;
            pExtObj.iFirstJZ += pUserObj.iFirstJZ;
            pExtObj.iFirstZJZ += pUserObj.iFirstZJZ;
            if (pGameObjEx.bRuChi) {
                pExtObj.iRuChiTimes += 1;
                if (pUserObj.iWinMode == 2) pExtObj.iRuChiWinTimes += 1;
            }
            if (pUserObj.pUserRef != null) pUserObj.pUserRef.pExtObj = pExtObj;

            await dbLGQ.update_user_extdata(pUserObj.iUserId, pExtObj);
        }
    }

    // 保存牌局回顾
    var pJsonObj = GetPaiJuHuiGuJsonStr(pRoomObj);
    await dbLGQ.save_paijuhuigu_logs(pRoomObj.szRoomUUID, pRoomObj.iRoomId, pRoomObj.iPlayTimes, pJsonObj);
}

// 设置牌局回顾为秀牌状态
async function DB_SetPJHG_ShowPai(pRoomObj) {
    var pRes = await dbCC.query("select * from tb_paijuhuigu_logs where roomuuid = $1 and playtimes = $2",
        [pRoomObj.szRoomUUID, pRoomObj.iPlayTimes]);
    if (pRes.rows.length == 1) {
        var pRetObjs = SysUtils.GetJsonObj(pRes.rows[0].jsonvals);
        if (pRetObjs != null) {
            for (var iIndex = 0; iIndex < pRetObjs.length; ++iIndex) {
                pRetObjs[iIndex].bShowPai = true;
            }

            await dbCC.query("update tb_paijuhuigu_logs set jsonvals = $1 where roomuuid = $2 and playtimes = $3",
                [JSON.stringify(pRetObjs), pRoomObj.szRoomUUID, pRoomObj.iPlayTimes]);
        }
    }
}

// 查询牌局记录
async function NotifyPaiJuLogs(pSocket, pRoomObj, iPlayTimes) {
    var Result = {
        wErrCode: ErrorCodes.ERR_NOERROR,
        szErrMsg: "操作成功",
        iCount: 0,
        pData: null,
    };

    var pRes = await dbCC.query("select count(uid) from tb_paijuhuigu_logs where roomuuid = $1", [pRoomObj.szRoomUUID]);
    Result.iCount = pRes.rows[0].count;
    if (Result.iCount == 0) {
        SendMsg(pSocket, "getpjlogs_result", Result);
        return;
    }

    if (iPlayTimes == -1) {
        var szSql = "select * from tb_paijuhuigu_logs where roomuuid = $1 order by playtimes desc limit 1";
        pRes = await dbCC.query(szSql, [pRoomObj.szRoomUUID]);
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
        pRes = await dbCC.query(szSql, [pRoomObj.szRoomUUID, iPlayTimes]);
        if (pRes.rows.length == 1) {
            var pRow = pRes.rows[0];
            Result.pData = {
                pLogs: SysUtils.GetJsonObj(pRow.jsonvals),
                iPlayTimes: pRow.playtimes,
                tmTime: pRow.ctime
            };
        }
    }

    SendMsg(pSocket, "getpjlogs_result", Result);
}

async function NotifyToAllPaiJuLogs(pRoomObj, iPlayTimes) {
    for (var iIndex = 0; iIndex < pRoomObj.pPlayers.length; ++iIndex) {
        var pUserObj = pRoomObj.pPlayers[iIndex];
        if (pUserObj.iUserId == 0) continue;

        var pSocket = UserMgr.GetSocketObj(pUserObj.iUserId);
        if (pSocket == null) continue;

        await NotifyPaiJuLogs(pSocket, pRoomObj, iPlayTimes);
    }

    for (var iIndex = 0; iIndex < pRoomObj.pSeePlayers.length; ++iIndex) {
        var pUserObj = pRoomObj.pSeePlayers[iIndex];
        if (pUserObj.iUserId == 0) continue;

        var pSocket = UserMgr.GetSocketObj(pUserObj.iUserId);
        if (pSocket == null) continue;

        await NotifyPaiJuLogs(pSocket, pRoomObj, iPlayTimes);
    }
}

async function OnGetPaiJuLogs(pReqArgs) {
    var pRoomObj = RoomMgr.GetRoomObj(pReqArgs.iRoomId);
    if (pRoomObj == null) {
        SendMsg(pReqArgs.pSocket, "getpjlogs_result", {
            wErrCode: ErrorCodes.ERR_ROOMISNOTEXISTS,
            szErrMsg: "房间不存在"
        });
        return;
    }

    await NotifyPaiJuLogs(pReqArgs.pSocket, pRoomObj, pReqArgs.iPlayTimes);
}

// 留座
function DoLiuZuoTimeOut(iRoomId, iUserId, pSocket) {
    var pRoomObj = RoomMgr.GetRoomObj(iRoomId);
    if (pRoomObj == null) return;

    var pUserObj = RoomMgr.GetUserObj(pRoomObj, iUserId);
    if (pUserObj == null) return;

    RoomMgr.ClearLZReqTimerPtr(pUserObj);

    if (pSocket == null) pSocket = UserMgr.GetSocketObj(iUserId);
    var pParams = {
        iRoomId: pRoomObj.iRoomId,
        iUserId: pUserObj.iUserId,
        pSocket: pSocket
    }
    OnSitup(pParams);
}

async function DoLiuZuo(pRoomObj, pUserObj) {
    var Result = false;

    pUserObj.bLiuZuo = false;
    if (pUserObj.pLZTimerPtr == null) {
        Result = true;
        pUserObj.iState = RoomMgr.SeatState.SEAT_STATE_LIUZ;
        pUserObj.tmReqLZTimes = new Date(); // 请求留座时间
        pUserObj.pLZTimerPtr = setTimeout(DoLiuZuoTimeOut, TIME_OUT_LZ_VALUE * 1000, pRoomObj.iRoomId, pUserObj.iUserId, null);
        SendMsgToAll(pRoomObj, "liuzuo_notify", {
            wErrCode: ErrorCodes.ERR_NOERROR,
            szErrMsg: "操作成功",
            iUserId: pUserObj.iUserId
        });
    }

    return Result;
}

// 检查是否解散房间
function CheckJieSan(pRoomObj) {
    var Result = false;

    if (pRoomObj.bJieSan) {
        pRoomObj.iJieSanMode = 1;
        pRoomObj.bCanDel = true;
        pRoomObj.bDelete = true;
        pRoomObj.bRunning = false;
        pRoomObj.iSecond = pRoomObj.iDelSec;
        pRoomObj.pRoomArgs.iDelTimes = 0;

        setTimeout(function(pRoomObj) {
            pRoomObj.bWaitJS = false;
        }, TIME_OUT_START_VALUE * 1000, pRoomObj);
        Result = true;
    }

    return Result;
}

// 休芒事件
async function OnXiuMEvent(pRoomObj) {
    console.log("OnXiuMEvent");
    var pGameObj = pRoomObj.pGameObj;
    var pGameObjEx = pRoomObj.pGameObjEx;

    pGameObjEx.szState = "jiesuan";

    RemoveTimeOut(pRoomObj);

    //pRoomObj.iBankerIndex = pGameObjEx.pBanker.iSeatIndex;

    if (pGameObj.iJiFenMGTimes < pRoomObj.pRoomArgs.iMaxMG) {
        pGameObj.iJiFenMGTimes += 1;
        pGameObj.iNextMG += pRoomObj.pRoomArgs.iBaseFen * 2;    // 下一局要打的芒果
    }

    var iTotalGolds = 0;
    // 返还用户押注
    var pRetObjs = [];
    var pPaiMaps = {};
    for (var iIndex = 0; iIndex < pGameObjEx.pPlayers.length; ++iIndex) {
        var pItem = pGameObjEx.pPlayers[iIndex];
        var pStakeObj = RoomMgr.GetStakeObj(pRoomObj, pItem.iUserId);
        var pJiFenObj = RoomMgr.GetJiFenObj(pRoomObj, pItem.iUserId);

        pPaiMaps[pItem.iUserId] = [pItem.pPais[0], pItem.pPais[1]];

        // if (!pItem.bOnline) {
        //     pItem.iTimeOutPlayTimes += 1;
        //     console.log("OnXiuMEvent iUserId:" + pItem.iUserId + ", iTimeOutPlayTimes:" + pItem.iTimeOutPlayTimes);
        // }
        ClearUserOptTimerPtr(pItem);

        iTotalGolds += pStakeObj.iJiFenYZ + pStakeObj.iJiFenMG;

        pItem.iSaveYZ = pStakeObj.iJiFenYZ;
        pItem.iSaveMG = pStakeObj.iJiFenMG;
        pItem.iAddFenYZ = pStakeObj.iJiFenYZ;
        pItem.iAddFenMG = 0;

        pJiFenObj.iJiFen += pStakeObj.iJiFenYZ;
        pItem.iWinMode = 0; // 0:平, 1:输, 2:赢
        delete pItem.iOrgJiFen;

        var iSHPMode = 0;
        if (pItem.iSHPMode == 1) {
            if (GLibs.IsKeySHL(pItem.pPais)) {
                iSHPMode = 1;
            }
            else if (GLibs.IsKeySHS(pItem.pPais)) {
                iSHPMode = 2;
            }
        }

        var pRetObj = {
            iUserId: pItem.iUserId,
            iAddFen: pStakeObj.iJiFenYZ,
            iJiFenSY: 0,
            iNewJiFen: pJiFenObj.iJiFen + pJiFenObj.iJiFenYQ,
            iSHPMode: iSHPMode,
            pShowIdx: pItem.pShowIdx,
            pPais: pItem.pPais.concat()
        };
        pItem.iJiFenSY = 0; //pItem.iJiFenSY = -pStakeObj.iJiFenMG;
        pJiFenObj.iSumSY -= pStakeObj.iJiFenMG;

        pRetObjs.push(pRetObj);
    }
    pRoomObj.pPaiMaps = pPaiMaps;

    pRoomObj.iPlayTimes += 1;
    await dbLGQ.add_room_playtimes(pRoomObj.iRoomId);

    pRoomObj.bRunning = false;  // 重置房间运行状态

    // 休芒通知
    SendMsgToAll(pRoomObj, "jiesuan_notify", {
        wErrCode: ErrorCodes.ERR_NOERROR,
        szErrMsg: "操作成功",

        iMode: 1,                       // 休芒
        iTotalGolds: iTotalGolds,
        iJiFenMGC: pGameObj.iJiFenMG,   // 芒果池
        iNextMG: pGameObj.iNextMG,      // 下一局芒果
        iJiFenMGTimes: pGameObj.iJiFenMGTimes,  // 当前几芒了

        pJiFenObjs: pRetObjs
    }, 0);

    AddActionJieSuan(pRoomObj.pVideo, {
        iMode: 1,   // 休芒
        iTotalGolds: iTotalGolds,
        iJiFenMGC: pGameObj.iJiFenMG,           // 芒果池
        iNextMG: pGameObj.iNextMG,              // 下一局芒果
        iJiFenMGTimes: pGameObj.iJiFenMGTimes,  // 当前几芒了

        pJiFenObjs: pRetObjs
    });     // 保存录像数据

    await OnGameOver(pRoomObj);
    pRoomObj.bRunning = false;
    for (var iIndex = 0; iIndex < pGameObjEx.pPlayers.length; ++iIndex) {
        var pUserObj = pGameObjEx.pPlayers[iIndex];
        pUserObj.iState = RoomMgr.SeatState.SEAT_STATE_WAIT;
        var pUserRef = RoomMgr.GetUserObj(pRoomObj, pUserObj.iUserId);
        if (pUserRef != null) {
            if ((pUserRef.iSeatIndex != -1) && (pUserRef.iState != RoomMgr.SeatState.SEAT_STATE_LIUZ)) {
                pUserRef.iState = RoomMgr.SeatState.SEAT_STATE_WAIT;
            }
        }
    }
    delete pGameObjEx.pPlayers;
    delete pRoomObj.pGameObjEx;
    if (CheckJieSan(pRoomObj)) return;

    var pReqArgs = {
        iRoomId: pRoomObj.iRoomId,
        iUserId: pRoomObj.iCreator,
        pSocket: null
    };
    pRoomObj.pTimerPtr = setTimeout(OnStart, TIME_OUT_START_VALUE * 1000, pReqArgs);
}

// 计算中了奖池分的的玩家
async function CheckUsersJC(pRoomObj, iUid, iMode, pJFMaps) {
    var pReqArgs = {
        uid: iUid,
        user: []
    };
    if (pReqArgs.uid == 0) return 0;

    var pGameObjEx = pRoomObj.pGameObjEx;
    if (iMode == 1) {   // 只剩一个玩家没有丢牌
        for (var iIndex = 0; iIndex < pGameObjEx.pPlayers.length; ++iIndex) {
            var pItem = pGameObjEx.pPlayers[iIndex];

            pItem.bZhongJiang = false;
            if (pItem.iState != RoomMgr.SeatState.SEAT_STATE_LOSE) {
                var iRet = RoomMgr.GetPaiJCTypeEx(pItem.pPais);
                if (iRet > 0) {
                    pItem.bZhongJiang = true;
                    pReqArgs.user.push({
                        userid: pItem.iUserId,
                        type: iRet
                    });
                }

                break;
            }
        }
    }
    else {  // 正常分牌结算
        for (var iIndex = 0; iIndex < pGameObjEx.pPlayers.length; ++iIndex) {
            var pItem = pGameObjEx.pPlayers[iIndex];
            //console.log("CheckUsersJC iUserId:" + pItem.iUserId + ", iState:" + pItem.iState);

            pItem.bZhongJiang = false;
            if ((pItem.iState == RoomMgr.SeatState.SEAT_STATE_PLAY) || (pItem.iState == RoomMgr.SeatState.SEAT_STATE_QIAO)) {
                var iRet = RoomMgr.GetPaiJCType(pItem);
                // console.log(pItem.pPais);
                // console.log("pai type:" + iRet);
                if (iRet > 0) {
                    pItem.bZhongJiang = true;
                    pReqArgs.user.push({
                        userid: pItem.iUserId,
                        type: iRet
                    });
                }
            }
        }
    }

    if ((pReqArgs.uid > 0) && (pReqArgs.user.length > 0)) {
        var pRetObj = await jcLibs.calcjiangchi(pReqArgs);

        for (var iIndex = 0; iIndex < pRetObj.wins.length; ++iIndex) {
            var pItem = pRetObj.wins[iIndex];
            var pUserObj = RoomMgr.GetUserObj(pRoomObj, pItem.userid);
            if (pUserObj != null) {
                pItem.username = pUserObj.szAlias;
            }
            else {
                var pUserInfo = await dbLGQ.get_user_info(pItem.userid);
                pItem.username = pUserInfo.alias;
            }

            var iJiFen = parseInt(pItem.golds);
            pJFMaps[pUserObj.iUserId] = iJiFen;

            await dbLGQ.add_user_jifen(pRoomObj.szRoomUUID, pItem.userid, 0, 0, 0, iJiFen);
            
            var pJiFenObj = RoomMgr.GetJiFenObj(pRoomObj, pItem.userid);
            pJiFenObj.iJiFen += iJiFen;
            
            var pPlayerObj = GetPlayerObj(pRoomObj, pItem.userid);
            //pPlayerObj.iAddFen += iJiFen;
            //pPlayerObj.iNewJiFen += iJiFen;
            pPlayerObj.iJiFenSY += iJiFen;
        }

        for (var iIndex = 0; iIndex < pRetObj.alliance_wins.length; ++iIndex) {
            var pItem = pRetObj.alliance_wins[iIndex];
            //console.log("CheckUsersJC alliance iUserId:" + pItem.userid + ", iJiFen:" + pItem.golds);
            // var pUserObj = RoomMgr.GetUserObj(pRoomObj, pItem.userid);
            // if (pUserObj != null) {
            //     pItem.username = pUserObj.szAlias;
            // }
            // else {
            //     var pUserInfo = await dbLGQ.get_user_info(pItem.userid);
            //     pItem.username = pUserInfo.alias;
            // }

            // var iJiFen = parseInt(pItem.golds);
            // //var bUpdate = await dbLGQ.isexists_jifenreq(pRoomObj.iRoomId, pItem.userid);
            // //if (bUpdate) {
            // //    await dbLGQ.add_user_jifen(pRoomObj.szRoomUUID, pItem.userid, 0, 0, 0, iJiFen);
            // //}
            // //else {
            //     await dbLGQ.insert_user_jifen(pRoomObj.szRoomUUID, pItem.userid, pRoomObj.iClubId, 0, 0, 0, iJiFen);
            // //}
            
            // var pJiFenObj = RoomMgr.GetJiFenObj(pRoomObj, pItem.userid);
            // pJiFenObj.iJiFen += iJiFen;

            // var pPlayerObj = GetPlayerObj(pRoomObj, pItem.userid);
            // //pPlayerObj.iAddFen += iJiFen;
            // //pPlayerObj.iNewJiFen += iJiFen;
            // pPlayerObj.iJiFenSY += iJiFen;
        }

        pRetObj.wErrCode = ErrorCodes.ERR_NOERROR;
        pRetObj.szErrMsg = "操作成功";

        var iKeyId = pRoomObj.iAllId;
        for (var sKey in g_pAppGlobals.pRoomMaps) {
            var pRoom = g_pAppGlobals.pRoomMaps[sKey];
            if (pRoom.iAllId != iKeyId) continue;

            SendMsgToAll(pRoom, "zhongjiang_notify", pRetObj);
        }

        await jcLibs.writelogs(pRetObj.wins, pRetObj.alliance_wins, iKeyId, 0, pRoomObj.pRoomArgs.iBaseFen);
    }

    return pReqArgs.uid;
}

// 揍芒事件
async function OnZouMEvent(pRoomObj) {
    console.log("OnZouMEvent");
    var pGameObj = pRoomObj.pGameObj;
    var pGameObjEx = pRoomObj.pGameObjEx;

    pGameObjEx.szState = "jiesuan";

    NotifySHP(pRoomObj);

    //pRoomObj.iBankerIndex = pGameObjEx.pBanker.iSeatIndex;

    // 生成临时变量, 查找赢家
    var iTotalGolds = 0;
    var pWinUser = null;
    var pUserMaps = {};
    for (var iIndex = 0; iIndex < pGameObjEx.pPlayers.length; ++iIndex) {
        var pItem = pGameObjEx.pPlayers[iIndex];
        var pStakeObj = RoomMgr.GetStakeObj(pRoomObj, pItem.iUserId);

        pUserMaps[pItem.iUserId] = [pItem.pPais[0], pItem.pPais[1]];

        ClearUserOptTimerPtr(pItem);

        iTotalGolds += pStakeObj.iJiFenYZ + pStakeObj.iJiFenMG;

        pItem.iSaveYZ = pStakeObj.iJiFenYZ;
        pItem.iSaveMG = pStakeObj.iJiFenMG;
        pItem.iAddFenYZ = 0;
        pItem.iAddFenMG = 0;

        pItem.iAddFen = 0;

        if (pItem.iState != RoomMgr.SeatState.SEAT_STATE_LOSE) pWinUser = pItem;
    }
    pRoomObj.pPaiMaps = pUserMaps;
    pRoomObj.iWinUser = pWinUser.iUserId;   // 揍芒赢家，下一局可以不用打芒果
    console.log("OnZouMEvent iWinUser:" + pRoomObj.iWinUser);

    // 输赢结算
    var iJiFenMGC = 0;      // 芒果池加分
    var pWinStakeObj = RoomMgr.GetStakeObj(pRoomObj, pWinUser.iUserId);

    for (var iIndex = 0; iIndex < pGameObjEx.pPlayers.length; ++iIndex) {
        var pItem = pGameObjEx.pPlayers[iIndex];
        var pStakeObj = RoomMgr.GetStakeObj(pRoomObj, pItem.iUserId);

        if (pItem == pWinUser) {
            pItem.iWinMode = 2; // 0:平, 1:输, 2:赢
            pItem.iAddFen += pStakeObj.iJiFenYZ;
            continue;
        }

        if (pItem.iSHPMode == 1) {  // 三花牌
            pItem.iAddFen = pStakeObj.iJiFenYZ;
            pStakeObj.iJiFenYZ = 0;
            continue;
        }

        pItem.iWinMode = 1; // 0:平, 1:输, 2:赢
        if (pWinStakeObj.iJiFenYZ >= pStakeObj.iJiFenYZ) { // 本局押注
            pWinUser.iAddFen += pStakeObj.iJiFenYZ;
            pStakeObj.iJiFenYZ = 0;
            pItem.iAddFen = 0;
        }
        else {
            pWinUser.iAddFen += pWinStakeObj.iJiFenYZ;
            pStakeObj.iJiFenYZ -= pWinStakeObj.iJiFenYZ;
            pItem.iAddFen += pStakeObj.iJiFenYZ;
        }

        pItem.iAddFenYZ = pItem.iAddFen;        // 退回多余的押注分
    }
    pWinUser.iAddFenYZ += pWinUser.iAddFen;

    // 吃芒果
    if (pWinStakeObj.iJiFenYZ >= pGameObj.iJiFenMG) {
        pWinUser.iAddFen += pGameObj.iJiFenMG;
        pWinUser.iAddFenMG = pGameObj.iJiFenMG;

        pGameObj.iJiFenMG = 0;
    }
    else {
        pWinUser.iAddFen += pWinStakeObj.iJiFenYZ;
        pWinUser.iAddFenMG = pWinStakeObj.iJiFenYZ;

        pGameObj.iJiFenMG -= pWinStakeObj.iJiFenYZ;
    }
    pWinStakeObj.iJiFenYZ = 0;

    pGameObj.iJiFenMG += iJiFenMGC;

    if (pGameObj.iJiFenMGTimes < pRoomObj.pRoomArgs.iMaxMG) {
        pGameObj.iJiFenMGTimes += 1;
        pGameObj.iNextMG += pRoomObj.pRoomArgs.iBaseFen * 2;    // 下一局要打的芒果
    }

    var iWaterSum = 0;
    //var iUid = await RoomMgr.GetJiangChiUID(pRoomObj);   // 奖池UID
    var pJCInfo = await RoomMgr.GetJiangChiBaseInfo(pRoomObj);

    var pJFMaps = {};
    if (pJCInfo.iUid > 0) {
        await CheckUsersJC(pRoomObj, pJCInfo.iUid, 1, pJFMaps);      // 用户中奖池分
    }

    var pRetObjs = [];
    for (var iIndex = 0; iIndex < pGameObjEx.pPlayers.length; ++iIndex) {
        var pItem = pGameObjEx.pPlayers[iIndex];
        var pStakeObj = RoomMgr.GetStakeObj(pRoomObj, pItem.iUserId);
        var pJiFenObj = RoomMgr.GetJiFenObj(pRoomObj, pItem.iUserId);

        var iSHPMode = 0;
        if (pItem.iSHPMode == 1) {
            if (GLibs.IsKeySHL(pItem.pPais)) {
                iSHPMode = 1;
            }
            else if (GLibs.IsKeySHS(pItem.pPais)) {
                iSHPMode = 2;
            }
        }

        var iAddJiFen = pItem.iAddFenYZ + pItem.iAddFenMG;    // 赢的押注 + 赢的芒果
        pItem.iJiFenSY = iAddJiFen - pItem.iSaveYZ; // - pItem.iSaveMG; // 本局输赢

        // if (pItem.iUserId != pWinUser.iUserId) {
        //     iAddJiFen += pStakeObj.iJiFenYZ;
        //     pItem.iJiFenSY += pStakeObj.iJiFenYZ;
        // }

        if ((pJCInfo.iUid > 0) && (!pJCInfo.bIsFull)) { // 抽水到奖池
            if (pItem.iJiFenSY >= pRoomObj.pRoomArgs.iBaseFen * 20) {
                var iWater = pRoomObj.pRoomArgs.iBaseFen * 2;

                iAddJiFen -= iWater;
                pItem.iJiFenSY -= iWater;
                iWaterSum += iWater;
            }
        }
        pJiFenObj.iJiFen += iAddJiFen;

        var iFenJC = pJFMaps[pItem.iUserId];
        if (iFenJC == null) iFenJC = 0;
        pJiFenObj.iSumSY += pItem.iJiFenSY + iFenJC - pStakeObj.iJiFenMG; //pItem.iSaveMG;

        var pRetObj = {
            iUserId: pItem.iUserId,
            iAddFen: pItem.iAddFen,
            iJiFenSY: pItem.iJiFenSY,
            iNewJiFen: pJiFenObj.iJiFen + pJiFenObj.iJiFenYQ,
            pPais: pItem.pPais.concat(),
            pShowIdx: pItem.pShowIdx,
            iSHPMode: iSHPMode
        };
        pRetObjs.push(pRetObj);
    }

    pRoomObj.iPlayTimes += 1;
    await dbLGQ.add_room_playtimes(pRoomObj.iRoomId);

    pRoomObj.bRunning = false;  // 重置房间运行状态

    // 揍芒通知
    SendMsgToAll(pRoomObj, "jiesuan_notify", {
        wErrCode: ErrorCodes.ERR_NOERROR,
        szErrMsg: "操作成功",

        iMode: 2,                       // 揍芒
        iTotalGolds: iTotalGolds,
        iJiFenMGC: pGameObj.iJiFenMG,   // 芒果池
        iNextMG: pGameObj.iNextMG,      // 下一局芒果
        iJiFenMGTimes: pGameObj.iJiFenMGTimes,  // 当前几芒了

        pJiFenObjs: pRetObjs
    }, 0);

    AddActionJieSuan(pRoomObj.pVideo, {
        iMode: 2,   // 揍芒
        iTotalGolds: iTotalGolds,
        iJiFenMGC: pGameObj.iJiFenMG,           // 芒果池
        iNextMG: pGameObj.iNextMG,              // 下一局芒果
        iJiFenMGTimes: pGameObj.iJiFenMGTimes,  // 当前几芒了

        pJiFenObjs: pRetObjs
    });     // 保存录像数据

    if (pJCInfo.iUid > 0) {
        //await CheckUsersJC(pRoomObj, pJCInfo.iUid, 1);      // 用户中奖池分
        if (iWaterSum > 0) await jcLibs.jiangchiinc({ uid: pJCInfo.iUid, golds: iWaterSum });   // 抽水到奖池
    }
    console.log("OnZouMEvent 444");

    await OnGameOver(pRoomObj);
    pRoomObj.bRunning = false;
    for (var iIndex = 0; iIndex < pGameObjEx.pPlayers.length; ++iIndex) {
        var pUserObj = pGameObjEx.pPlayers[iIndex];
        pUserObj.iState = RoomMgr.SeatState.SEAT_STATE_WAIT;
        var pUserRef = RoomMgr.GetUserObj(pRoomObj, pUserObj.iUserId);
        if (pUserRef != null) {
            if ((pUserRef.iSeatIndex != -1) && (pUserRef.iState != RoomMgr.SeatState.SEAT_STATE_LIUZ)) {
                pUserRef.iState = RoomMgr.SeatState.SEAT_STATE_WAIT;
            }
        }
    }
    delete pGameObjEx.pPlayers;
    delete pRoomObj.pGameObjEx;
    if (CheckJieSan(pRoomObj)) return;

    var pReqArgs = {
        iRoomId: pRoomObj.iRoomId,
        iUserId: pRoomObj.iCreator,
        pSocket: null
    };

    pRoomObj.pTimerPtr = setTimeout(OnStart, TIME_OUT_START_VALUE * 1000, pReqArgs);
}

// 检查用户是否留座
async function CheckUserLuoZuo(pRoomObj) {
    var iMinJiFen = pRoomObj.pRoomArgs.iBaseFen * 2 + pRoomObj.pGameObj.iNextMG;

    for (var iIndex = 0; iIndex < pRoomObj.pPlayers.length; ++iIndex) {
        var pUserObj = pRoomObj.pPlayers[iIndex];
        if (pUserObj.iUserId == 0) continue;

        if (pUserObj.bKill) {   // 此用户被管理员踢出房间
            delete pUserObj.bKill;

            var pJiFenObj = RoomMgr.GetJiFenObj(pRoomObj, pUserObj.iUserId);

            if (pJiFenObj != null) {
                if (pJiFenObj.iJiFenYQ > 0) {
                    pJiFenObj.iJiFen += pJiFenObj.iJiFenYQ;
                    pJiFenObj.iJiFenYQ = 0;
    
                    await dbLGQ.add_user_jifen(pRoomObj.szRoomUUID, pUserObj.iUserId, 0, 0,
                        pJiFenObj.iJiFenYQ, pJiFenObj.iJiFenYQ);   
                }
            }

            RoomMgr.AddKillUser(pRoomObj, pUserObj.iUserId);
            OnSitup({
                iRoomId: pRoomObj.iRoomId,
                iUserId: pUserObj.iUserId,
                pSocket: UserMgr.GetSocketObj(pUserObj.iUserId)
            });

            continue;
        }

        var pJiFenObj = RoomMgr.GetJiFenObj(pRoomObj, pUserObj.iUserId);
        if (pJiFenObj == null) continue;

        if (pJiFenObj.iJiFenYQ > 0) {
            //console.log("CheckUserJiFen iUserId:" + pUserObj.iUserId + ", iJiFenYQ:" + pJiFenObj.iJiFenYQ);
            pJiFenObj.iJiFen += pJiFenObj.iJiFenYQ;
            // SendMsgToAll(pRoomObj, "addjifen_notify", {
            //     ErrCode: ErrorCodes.ERR_NOERROR,
            //     szErrMsg: "操作成功",
            //     bAgree: true,
            //     iMode: 2,
            //     iUserId: pUserObj.iUserId,
            //     iGolds: pUserObj.iGolds,
            //     iReqAddJiFen: pJiFenObj.iJiFenYQ,

            //     iJiFenDR: pJiFenObj.iJiFenDR,   // 总带入积分
            //     iJiFenCDR: pJiFenObj.iJiFenCDR,   // 当前带入
            //     iJiFenYQ: 0,
            //     iJiFen: pJiFenObj.iJiFen
            // });

            pJiFenObj.iJiFenYQ = 0;
            await dbLGQ.update_user_jifen(pRoomObj.szRoomUUID, pUserObj.iUserId, pJiFenObj);
            //await dbLGQ.add_user_jifen(pRoomObj.szRoomUUID, pUserObj.iUserId, 0, 0, pJiFenObj.iJiFenYQ, pJiFenObj.iJiFenYQ);
        }

        var pPlayerObj = GetPlayerObj(pRoomObj, pUserObj.iUserId);
        if (pPlayerObj != null) pUserObj.iTimeOutPlayTimes = pPlayerObj.iTimeOutPlayTimes;

        //console.log("CheckUserLuoZuo iUserId:" + pUserObj.iUserId + ", iTimeOutPlayTimes:" + pUserObj.iTimeOutPlayTimes);
        if ((pJiFenObj.iJiFen < iMinJiFen) || (pUserObj.iTimeOutPlayTimes > 1)) {
            if (pUserObj.iState != RoomMgr.SeatState.SEAT_STATE_LIUZ) {
                pUserObj.iState = RoomMgr.SeatState.SEAT_STATE_LIUZ;  // SEAT_STATE_FSW; // 分输完了

                setTimeout(async function(pRoomObj, iUserId) {
                    var pUserObj = RoomMgr.GetUserObj(pRoomObj, iUserId);
                    if (pUserObj == null) return;

                    //pUserObj.iState = RoomMgr.SeatState.SEAT_STATE_LIUZ;  // SEAT_STATE_FSW; // 分输完了
                    var bRet = await DoLiuZuo(pRoomObj, pUserObj);
                    if (!bRet) {
                        SendMsgToAll(pRoomObj, "liuzuo_notify", {
                            ErrCode: ErrorCodes.ERR_NOERROR,
                            szErrMsg: "操作成功",
                            iUserId: pUserObj.iUserId
                        });
                    }
                }, 3 * 1000, pRoomObj, pUserObj.iUserId);
            }
        }

        if (pUserObj.iState == RoomMgr.SeatState.SEAT_STATE_LIUZ) {
            pUserObj.bLiuZuo = false;
            continue;
        }

        if (pUserObj.bLiuZuo) {
            pUserObj.bLiuZuo = false;
            await DoLiuZuo(pRoomObj, pUserObj);
        }
    }
}

// 结算
async function JieShuan(pRoomObj) {
    console.log("JieShuan");
    var pGameObj = pRoomObj.pGameObj;
    var pGameObjEx = pRoomObj.pGameObjEx;

    pGameObjEx.szState = "jiesuan";
    pGameObjEx.pCursor = null;

    RemoveTimeOut(pRoomObj);
    console.log("JieShuan pGameObj.iDealNum:" + pGameObjEx.iDealNum + ", pGameObj.iJiFenMG:" + pGameObj.iJiFenMG + 
        ", pGameObj.iJiFenMGTimes:" + pGameObj.iJiFenMGTimes);

    NotifySHP(pRoomObj);

    var iPlayCount = 0;
    var pPlayers = [];
    var pLostPlayers = [];  // 丢牌玩家
    var pGroups = [];

    var iWaterSum = 0;
    var pJCInfo = await RoomMgr.GetJiangChiBaseInfo(pRoomObj);
    console.log(pJCInfo);
    //var iUid = await RoomMgr.GetJiangChiUID(pRoomObj);  // 奖池UID

    var iTotalGolds = 0;
    for (var iIndex = 0; iIndex < pGameObjEx.pPlayers.length; ++iIndex) {
        var pPlayer = pGameObjEx.pPlayers[iIndex];
        var pStakeObj = RoomMgr.GetStakeObj(pRoomObj, pPlayer.iUserId);

        // if (!pPlayer.bOnline) {
        //     pPlayer.iTimeOutPlayTimes += 1;
        //     console.log("OnXiuMEvent iUserId:" + pPlayer.iUserId + ", iTimeOutPlayTimes:" + pPlayer.iTimeOutPlayTimes);
        // }
        ClearUserOptTimerPtr(pPlayer);

        iTotalGolds += pStakeObj.iJiFenYZ + pStakeObj.iJiFenMG;

        // 生成临时变量
        pPlayer.iSaveYZ = pStakeObj.iJiFenYZ;
        pPlayer.iSaveMG = pStakeObj.iJiFenMG;

        pPlayer.iAddFenMG = 0;    // 临时变量
        pPlayer.iAddFenYZ = 0;    // 临时变量
        pPlayer.iJiFenSY = 0;     // 输赢的积分
        pPlayer.iJiFenS = 0;      // 输家最多输的分数
        pPlayer.iSaveS = 0;
        pPlayer.iGetFen = 0;

        if ((pPlayer.iState == RoomMgr.SeatState.SEAT_STATE_PLAY) || (pPlayer.iState == RoomMgr.SeatState.SEAT_STATE_QIAO) ||
            (pPlayer.iState == RoomMgr.SeatState.SEAT_STATE_REST)) {

            ++iPlayCount;

            // 计算头尾牌
            var pPaiInfo = {
                pPaisT: null,
                pPaisW: null
            };

            if (pPlayer.pPais1 != null) {
                var pSplitObj = {
                    pPais1: pPlayer.pPais1,
                    pPais2: pPlayer.pPais2
                }
                //pPaiInfo = GLibs.GetPaiSW(pSplitObj);

                var iRet = GLibs.ComparePais(pPlayer.pPais1, pPlayer.pPais2);
                if (iRet == -1) {
                    pPaiInfo.pPaisT = pPlayer.pPais1;
                    pPaiInfo.pPaisW = pPlayer.pPais2;
                }
                else {
                    pPaiInfo.pPaisT = pPlayer.pPais2;
                    pPaiInfo.pPaisW = pPlayer.pPais1;
                }
            }

            pPlayer.pPaisT = pPaiInfo.pPaisT;   // 头牌
            pPlayer.pPaisW = pPaiInfo.pPaisW;   // 尾牌

            pPlayers.push(pPlayer);
            //console.log("JieShuan push iUserId:" + pPlayer.iUserId);
        }
        else if (pPlayer.iState == RoomMgr.SeatState.SEAT_STATE_LOSE) {
            if (pPlayer.iSHPMode != 1) {
               // console.log("JieShuan lost iUserId:" + pPlayer.iUserId);
                pLostPlayers.push(pPlayer);
            }
        }
    }

    var iMode = 1;
    console.log("JieShuan push iPlayCount:" + iPlayCount);
    if (iPlayCount >= 2) {
        iMode = 2;
        // 根据尾牌由大到小排序
        pPlayers.sort(function (left, right) {
            var iRet = GLibs.ComparePais(left.pPaisW, right.pPaisW);
            if (iRet == 0) {    // 尾大小相同就再比较头
                iRet = GLibs.ComparePais(left.pPaisT, right.pPaisT);
            }

            return iRet;
        });


        // 计算每个丢牌玩家最大输掉的积分
        for (var iIndex = 0; iIndex < pLostPlayers.length; ++iIndex) {
            var pLostUser = pLostPlayers[iIndex];
            var pLostUserStakeObj = RoomMgr.GetStakeObj(pRoomObj, pLostUser.iUserId);

            if (pLostUser.iSHPMode == 1) continue;  // 用户是三花牌

            for (var iPos = 0; iPos < pPlayers.length; ++iPos) {
                var pWinUser = pPlayers[iPos];
                var pWinUserStakeObj = RoomMgr.GetStakeObj(pRoomObj, pWinUser.iUserId);

                if (pLostUser.iJiFenS < pWinUserStakeObj.iJiFenYZ) {
                    pLostUser.iJiFenS = pWinUserStakeObj.iJiFenYZ;

                    if (pLostUser.iJiFenS > pLostUserStakeObj.iJiFenYZ) {
                        pLostUser.iJiFenS = pLostUserStakeObj.iJiFenYZ;
                    }
                }
            }
        }

        // 计算剩余比牌玩家最大输掉的积分
        for (var iIndex = 0; iIndex < pPlayers.length - 1; ++iIndex) {
            var pWinUser = pPlayers[iIndex];
            var pWinUserStakeObj = RoomMgr.GetStakeObj(pRoomObj, pWinUser.iUserId);

            for (var iPos = iIndex + 1; iPos < pPlayers.length; ++iPos) {
                var pLostUser = pPlayers[iPos];
                var pLostUserStakeObj = RoomMgr.GetStakeObj(pRoomObj, pLostUser.iUserId);

                var iRetT = GLibs.ComparePais(pWinUser.pPaisT, pLostUser.pPaisT);
                var iRetW = GLibs.ComparePais(pWinUser.pPaisW, pLostUser.pPaisW);
                // console.log("pWinUser iUserId:" + pWinUser.iUserId + ", pLostUser iUserId:" + pLostUser.iUserId +
                //     ", iRetT:" + iRetT + ", iRetW:" + iRetW);

                var bDoUpdate = false;
                if ((iRetT == -1) && (iRetW == -1)) bDoUpdate = true;   // 头尾都大
                if ((iRetT == -1) && (iRetW == 0)) bDoUpdate = true;
                if ((iRetT == 0) && (iRetW == -1)) bDoUpdate = true;
                if (!bDoUpdate) continue;

                if (pLostUser.iJiFenS < pWinUserStakeObj.iJiFenYZ) {
                    pLostUser.iJiFenS = pWinUserStakeObj.iJiFenYZ;

                    if (pLostUser.iJiFenS > pLostUserStakeObj.iJiFenYZ) {
                        pLostUser.iJiFenS = pLostUserStakeObj.iJiFenYZ;
                    }
                }
            }
        }

        for (var iIndex = 0; iIndex < pLostPlayers.length; ++iIndex) {
            var pItem = pLostPlayers[iIndex];
            pItem.iSaveS = pItem.iJiFenS;
            //console.log("lost pItem.iUserId:" + pItem.iUserId + ", pItem.iJiFenS:" + pItem.iJiFenS);
        }
        
        for (var iIndex = 0; iIndex < pPlayers.length; ++iIndex) {
            var pItem = pPlayers[iIndex];
            pItem.iSaveS = pItem.iJiFenS;
            //console.log("pItem.iUserId:" + pItem.iUserId + ", pItem.iJiFenS:" + pItem.iJiFenS);
        }

        // 按牌大小分组
        var iIndex = 0;
        while (iIndex < pPlayers.length) {
            var pPrev = pPlayers[iIndex];

            var pItems = [pPrev];
            for (var iPos = iIndex + 1; iPos < pPlayers.length; ++iPos) {
                var pNext = pPlayers[iPos];

                var iRetT = GLibs.ComparePais(pPrev.pPaisT, pNext.pPaisT);
                var iRetW = GLibs.ComparePais(pPrev.pPaisW, pNext.pPaisW);

                if ((iRetT == 0) && (iRetW == 0)) { // 头尾都相等
                    pItems.push(pNext);
                    ++iIndex;
                }
                else {
                    break;
                }
            }
            ++iIndex;

            pGroups.push(pItems);
        }

        // 将头尾相等的玩家按押注分数由小到大排序
        var pfnSortWinUsers = function (pGameObj, pWinUsers) {
            pWinUsers.sort(function (left, right) {
                var pStakeL = RoomMgr.GetStakeObj(pRoomObj, left.iUserId);
                var pStakeR = RoomMgr.GetStakeObj(pRoomObj, right.iUserId);
                return pStakeL.iJiFenYZ - pStakeR.iJiFenYZ;
            });
        }

        var pfnCalcWinUsersJiFen = function (pRoomObj, pWinUsers, iJiFenSum, iMode) {
            var pGameObj = pRoomObj.pGameObj;
            var pGameObjEx = pRoomObj.pGameObjEx;
            var pMainMaps = {};
            var pJiFens = [];

            pfnSortWinUsers(pGameObj, pWinUsers);
            for (var iWinPos = 0; iWinPos < pWinUsers.length; ++iWinPos) {
                var pWinUser = pWinUsers[iWinPos];
                var pStakeObj = RoomMgr.GetStakeObj(pRoomObj, pWinUser.iUserId);

                pJiFens.push(pStakeObj.iJiFenYZ);
            }

            for (var iPos = 0; iPos < pJiFens.length; ++iPos) {
                var iJiFenYZ = pJiFens[iPos];

                for (var iWinPos = 0; iWinPos < pWinUsers.length; ++iWinPos) {
                    var pWinUser = pWinUsers[iWinPos];
                    var pStakeObj = RoomMgr.GetStakeObj(pRoomObj, pWinUser.iUserId);

                    if (pStakeObj.iJiFenYZ >= iJiFenYZ) {
                        var pItems = pMainMaps[iJiFenYZ];
                        if (pItems == null) {
                            pItems = [];
                            pMainMaps[iJiFenYZ] = pItems;
                        }

                        if (pItems.indexOf(pWinUser) == -1) {
                            pItems.push(pWinUser);
                            //console.log("[JiFenYZ] pMainMaps iJiFenYZ:" + iJiFenYZ + ", iUserId:" + pWinUser.iUserId);
                        }
                    }
                }
            }

            var iSubVal = 0;
            for (var sKey in pMainMaps) {
                var iJiFen = parseInt(sKey);
                var pItems = pMainMaps[sKey];

                var iItemPos = 0;
                var pCursor = pGameObjEx.pBanker.pNext;

                iJiFen -= iSubVal;
                iSubVal = parseInt(sKey);
                while (true) {  // 查找最先吃分的玩家
                    iItemPos = pItems.indexOf(pCursor);
                    if (iItemPos >= 0) break;

                    pCursor = pCursor.pNext;
                }

                while ((iJiFen > 0) && (iJiFenSum > 0)) {
                    pCursor = pItems[iItemPos];

                    if (iMode == 0) {
                        pCursor.iAddFenYZ += 1;
                    }
                    else {
                        pCursor.iAddFenMG += 1;
                    }

                    --iJiFen;
                    --iJiFenSum;
                    iItemPos = (iItemPos + 1) % pItems.length;
                }
            }

            return iJiFenSum;
        }

        var pfnCalcWinGroupsJiFen = function (pRoomObj, pGroups, iJiFenSum, iMode) {
            for (var iIndex = 0; iIndex < pGroups.length; ++iIndex) {
                var pWinUsers = pGroups[iIndex];

                pfnSortWinUsers(pRoomObj.pGameObj, pWinUsers);
                iJiFenSum = pfnCalcWinUsersJiFen(pRoomObj, pWinUsers, iJiFenSum, iMode);
            }

            return iJiFenSum;
        }

        // 吃芒果
        var pfnCalcWinUsersJiFenMG = function (pRoomObj, pWinUsers, iJiFenSum, iMode) {
            var pGameObj = pRoomObj.pGameObj;
            var pGameObjEx = pRoomObj.pGameObjEx;
            var pMainMaps = {};
            var pJiFens = [];

            pfnSortWinUsers(pGameObj, pWinUsers);
            for (var iWinPos = 0; iWinPos < pWinUsers.length; ++iWinPos) {
                var pWinUser = pWinUsers[iWinPos];
                var pStakeObj = RoomMgr.GetStakeObj(pRoomObj, pWinUser.iUserId);

                pJiFens.push(pStakeObj.iJiFenYZ - pWinUser.iSaveS);
            }

            for (var iPos = 0; iPos < pJiFens.length; ++iPos) {
                var iJiFenYZ = pJiFens[iPos];

                for (var iWinPos = 0; iWinPos < pWinUsers.length; ++iWinPos) {
                    var pWinUser = pWinUsers[iWinPos];
                    var pStakeObj = RoomMgr.GetStakeObj(pRoomObj, pWinUser.iUserId);

                    if (pStakeObj.iJiFenYZ - pWinUser.iSaveS >= iJiFenYZ) {
                        var pItems = pMainMaps[iJiFenYZ];
                        if (pItems == null) {
                            pItems = [];
                            pMainMaps[iJiFenYZ] = pItems;
                        }

                        if (pItems.indexOf(pWinUser) == -1) {
                            pItems.push(pWinUser);
                            //console.log("[JiFenMG] pMainMaps iJiFenYZ:" + iJiFenYZ + ", iUserId:" + pWinUser.iUserId);
                        }
                    }
                }
            }

            var iSubVal = 0;
            for (var sKey in pMainMaps) {
                var iJiFen = parseInt(sKey);
                var pItems = pMainMaps[sKey];

                var iItemPos = 0;
                var pCursor = pGameObjEx.pBanker.pNext;

                iJiFen -= iSubVal;
                iSubVal = parseInt(sKey);
                while (true) {  // 查找最先吃分的玩家
                    iItemPos = pItems.indexOf(pCursor);
                    if (iItemPos >= 0) break;

                    pCursor = pCursor.pNext;
                }

                while ((iJiFen > 0) && (iJiFenSum > 0)) {
                    pCursor = pItems[iItemPos];

                    if (iMode == 0) {
                        pCursor.iAddFenYZ += 1;
                    }
                    else {
                        pCursor.iAddFenMG += 1;
                    }

                    --iJiFen;
                    --iJiFenSum;
                    iItemPos = (iItemPos + 1) % pItems.length;
                }
            }

            return iJiFenSum;
        }

        var pfnCalcWinGroupsJiFenMG = function (pRoomObj, pGroups, iJiFenSum, iMode) {
            for (var iIndex = 0; iIndex < pGroups.length; ++iIndex) {
                var pWinUsers = pGroups[iIndex];

                pfnSortWinUsers(pRoomObj.pGameObj, pWinUsers);
                iJiFenSum = pfnCalcWinUsersJiFenMG(pRoomObj, pWinUsers, iJiFenSum, iMode);
            }

            return iJiFenSum;
        }

        // 分数结算(比牌玩家计算输赢)
        for (var iIndex = 0; iIndex < pGroups.length - 1; ++iIndex) {
            var pWinUsers = pGroups[iIndex];

            for (var iPos = iIndex + 1; iPos < pGroups.length; ++iPos) {
                var pLostUsers = pGroups[iPos];

                for (var iLostIdx = 0; iLostIdx < pLostUsers.length; ++iLostIdx) {
                    var pLostUser = pLostUsers[iLostIdx];

                    var pWinUser = pWinUsers[0];
                    var iRetT = GLibs.ComparePais(pWinUser.pPaisT, pLostUser.pPaisT);
                    var iRetW = GLibs.ComparePais(pWinUser.pPaisW, pLostUser.pPaisW);

                    var bDoUpdate = false;
                    if ((iRetT == -1) && (iRetW == -1)) bDoUpdate = true;   // 头尾都大
                    if ((iRetT == -1) && (iRetW == 0)) bDoUpdate = true;
                    if ((iRetT == 0) && (iRetW == -1)) bDoUpdate = true;

                    if (bDoUpdate) {       
                        var iJiFenS = pLostUser.iJiFenS;
                        var iRet = pfnCalcWinUsersJiFen(pRoomObj, pWinUsers, pLostUser.iJiFenS, 0);
                        pLostUser.iJiFenS = iRet;

                        var pStakeObj = RoomMgr.GetStakeObj(pRoomObj, pLostUser.iUserId);
                        pStakeObj.iJiFenYZ -= (iJiFenS - iRet);
                        pLostUser.iSaveS -= (iJiFenS - iRet);
                        if (pStakeObj.iJiFenYZ < 0) pStakeObj.iJiFenYZ = 0;
                    }
                }
            }
        }

        // 分数结算(吃丢牌玩家)
        for (var iIndex = 0; iIndex < pGroups.length; ++iIndex) {
            var pWinUsers = pGroups[iIndex];

            for (var iPos = 0; iPos < pLostPlayers.length; ++iPos) {
                var pLostUser = pLostPlayers[iPos];
                var iJiFenS = pLostUser.iJiFenS;
                var iRet = pfnCalcWinUsersJiFen(pRoomObj, pWinUsers, pLostUser.iJiFenS, 0);
                pLostUser.iJiFenS = iRet;
                
                var pStakeObj = RoomMgr.GetStakeObj(pRoomObj, pLostUser.iUserId);
                pStakeObj.iJiFenYZ -= (iJiFenS - iRet);
                pLostUser.iSaveS -= (iJiFenS - iRet);
                if (pStakeObj.iJiFenYZ < 0) pStakeObj.iJiFenYZ = 0;
            }

            // var iJiFenSum = 0;  // 丢牌玩家总输分数
            // for (var iPos = 0; iPos < pLostPlayers.length; ++iPos) {
            //     var pLostUser = pLostPlayers[iPos];
            //     iJiFenSum += pLostUser.iJiFenS;
            //     pLostUser.iJiFenS = 0;
            //     pLostUser.iSaveS = 0;
            // }

            // if (iJiFenSum > 0) pfnCalcWinGroupsJiFen(pRoomObj, pGroups, iJiFenSum, 0);
        }

        // 吃芒果
        //console.log("JieShuan 1 pGameObj.iJiFenMG:" + pGameObj.iJiFenMG);
        if (pGameObj.iJiFenMG > 0) {
            pGameObj.iJiFenMG = pfnCalcWinGroupsJiFenMG(pRoomObj, pGroups, pGameObj.iJiFenMG, 1);
        }
    }
    else {
        // 只剩一个玩家了，其他玩家全丢牌了
        var pWinUser = null;
        for (var iIndex = 0; iIndex < pGameObjEx.pPlayers.length; ++iIndex) {
            var pPlayer = pGameObjEx.pPlayers[iIndex];
            if (pPlayer.iState != RoomMgr.SeatState.SEAT_STATE_LOSE) {
                pWinUser = pPlayer;
                break;
            }
        }
        var pWinUserStakeObj = RoomMgr.GetStakeObj(pRoomObj, pWinUser.iUserId);

        console.log("JieShuan iWinUser:" + pWinUser.iUserId);

        // 计算每个丢牌玩家最大输掉的积分
        for (var iIndex = 0; iIndex < pLostPlayers.length; ++iIndex) {
            var pLostUser = pLostPlayers[iIndex];
            var pLostUserStakeObj = RoomMgr.GetStakeObj(pRoomObj, pLostUser.iUserId);

            if (pLostUser.iSHPMode == 1) continue;  // 三花牌

            if (pLostUser.iJiFenS < pWinUserStakeObj.iJiFenYZ) {
                pLostUser.iJiFenS = pWinUserStakeObj.iJiFenYZ;

                if (pLostUser.iJiFenS > pLostUserStakeObj.iJiFenYZ) {
                    pLostUser.iJiFenS = pLostUserStakeObj.iJiFenYZ;
                }
            }
            //console.log("JieShuan iLostUser:" + pLostUser.iUserId + ", iJiFenS:" + pLostUser.iJiFenS);
        }

        for (var iPos = 0; iPos < pLostPlayers.length; ++iPos) {    // 丢牌玩家
            var pLostUser = pLostPlayers[iPos];
            var pLostUserStakeObj = RoomMgr.GetStakeObj(pRoomObj, pLostUser.iUserId);

            pLostUserStakeObj.iJiFenYZ -= pLostUser.iJiFenS;
            pWinUser.iAddFenYZ += pLostUser.iJiFenS;
            pLostUser.iJiFenS = 0;

            //console.log("JieShuan pLostUser.iJiFenYZ:" + pLostUserStakeObj.iJiFenYZ);
        }

        // 吃芒果
        console.log("JieShuan 2 pGameObj.iJiFenMG:" + pGameObj.iJiFenMG);
        if (pGameObj.iJiFenMG <= pWinUserStakeObj.iJiFenYZ) {
            pWinUser.iAddFenMG += pGameObj.iJiFenMG;
        }
        else {
            pWinUser.iAddFenMG = pWinUserStakeObj.iJiFenYZ;
        }
        pGameObj.iJiFenMG -= pWinUser.iAddFenMG;
    }

    // 求最大赢家
    var iMaxYF = 0;
    if (pJCInfo.iUid > 0) {
        for (var iIndex = 0; iIndex < pGameObjEx.pPlayers.length; ++iIndex) {
            var pUserObj = pGameObjEx.pPlayers[iIndex];
            var pStakeObj = RoomMgr.GetStakeObj(pRoomObj, pUserObj.iUserId);
    
            // 用户退回的押注分 + 赢的押注分 + 赢的芒果分 - 用户原始押注分
            var iAddFen = pStakeObj.iJiFenYZ + pUserObj.iAddFenYZ + pUserObj.iAddFenMG - pUserObj.iSaveS;
            if (pUserObj.iState == RoomMgr.SeatState.SEAT_STATE_LOSE) {
                if (pUserObj.iSHPMode != 1) iAddFen -= pStakeObj.iJiFenYZ;
            }
    
            var iJiFenSY = iAddFen - pUserObj.iSaveYZ;  // - pUserObj.iSaveMG;
            if (iJiFenSY >= iMaxYF) iMaxYF = iJiFenSY;
        }

        console.log("JieShuan iMode:" + iMode);
    }

    var pJFMaps = {};
    if (pJCInfo.iUid > 0) {
        await CheckUsersJC(pRoomObj, pJCInfo.iUid, iMode, pJFMaps);      // 用户中奖池分
    }

    // 统计各用户输赢, 更新用户积分
    var pPaiMaps = {};
    var pJiFenObjs = [];
    for (var iIndex = 0; iIndex < pGameObjEx.pPlayers.length; ++iIndex) {
        var pUserObj = pGameObjEx.pPlayers[iIndex];
        var pJiFenObj = RoomMgr.GetJiFenObj(pRoomObj, pUserObj.iUserId);
        var pStakeObj = RoomMgr.GetStakeObj(pRoomObj, pUserObj.iUserId);

        pPaiMaps[pUserObj.iUserId] = [pUserObj.pPais[0], pUserObj.pPais[1]];

        // 用户退回的押注分 + 赢的押注分 + 赢的芒果分 - 用户原始押注分
        var iAddFen = pStakeObj.iJiFenYZ + pUserObj.iAddFenYZ + pUserObj.iAddFenMG - pUserObj.iSaveS;
        if (pUserObj.iState == RoomMgr.SeatState.SEAT_STATE_LOSE) {
            if (pUserObj.iSHPMode != 1) iAddFen -= pStakeObj.iJiFenYZ;
        }

        // console.log("1.iUserId:" + pUserObj.iUserId +
        //     ", iOldJiFen:" + pJiFenObj.iJiFen +
        //     ", iJiFenYZ:" + pStakeObj.iJiFenYZ +
        //     ", iAddFenYZ:" + pUserObj.iAddFenYZ +
        //     ", iAddFenMG:" + pUserObj.iAddFenMG +
        //     ", iJiFenS:" + pUserObj.iSaveS +
        //     ", iAddFen:" + iAddFen);

        pJiFenObj.iJiFen += iAddFen;
        pUserObj.iJiFenSY = iAddFen - pUserObj.iSaveYZ; // - pUserObj.iSaveMG;
        //console.log("2.iUserId:" + pUserObj.iUserId);

        var iSHPMode = 0;
        if (pUserObj.iSHPMode == 1) {
            if (GLibs.IsKeySHL(pUserObj.pPais)) {
                iSHPMode = 1;
            }
            else if (GLibs.IsKeySHS(pUserObj.pPais)) {
                iSHPMode = 2;
            }
        }

        if ((pJCInfo.iUid > 0) && (!pJCInfo.bIsFull)) { // 抽水到奖池
            if ((pUserObj.iJiFenSY == iMaxYF) && (pUserObj.iJiFenSY >= pRoomObj.pRoomArgs.iBaseFen * 20)) {
                var iWater = pRoomObj.pRoomArgs.iBaseFen * 2;
                pUserObj.iJiFenSY -= iWater;
                pJiFenObj.iJiFen -= iWater;

                iWaterSum += iWater;
            }
        }

        var iJiFenJC = pJFMaps[pUserObj.iUserId];
        if (iJiFenJC == null) iJiFenJC = 0;

        var pSendMsg = {
            iUserId: pUserObj.iUserId,
            iAddFen: iAddFen,
            iJiFenSY: pUserObj.iJiFenSY + iJiFenJC,
            iNewJiFen: pJiFenObj.iJiFen + pJiFenObj.iJiFenYQ,
            pPais: pUserObj.pPais.concat(),
            pShowIdx: pUserObj.pShowIdx,
            iSHPMode: iSHPMode
        };
        
        pJiFenObj.iSumSY += pUserObj.iJiFenSY + iJiFenJC - pStakeObj.iJiFenMG;//pUserObj.iJiFenMG;
        //console.log("JieShuan iUserId:" + pUserObj.iUserId + " iNewJiFen:" + pSendMsg.iNewJiFen);

        pJiFenObjs.push(pSendMsg);

        if (pStakeObj.iAddFenYZ > pUserObj.iSaveYZ) {
            pUserObj.iWinMode = 2;
        }
        else if (pStakeObj.iAddFenYZ == pUserObj.iSaveYZ) {
            pUserObj.iWinMode = 1;
        }
        else {
            pUserObj.iWinMode = 0;
        }
    }

    pRoomObj.pPaiMaps = pPaiMaps;

    pRoomObj.iPlayTimes += 1;
    await dbLGQ.add_room_playtimes(pRoomObj.iRoomId);

    pRoomObj.bCanDel = (pGameObj.iJiFenMG == 0);
    if (pRoomObj.pRoomArgs.bLinkM) { // 开启了手手芒
        pGameObj.iNextMG = pRoomObj.pRoomArgs.iBaseFen * 2;
    }
    else {
        pGameObj.iNextMG = 0;
    }

    pGameObj.iJiFenMGTimes = 0;
    SendMsgToAll(pRoomObj, "jiesuan_notify", {
        wErrCode: ErrorCodes.ERR_NOERROR,
        szErrMsg: "操作成功",

        iMode: 0,   // 正常结算
        iTotalGolds: iTotalGolds,
        iJiFenMGC: pGameObj.iJiFenMG,   // 芒果池
        iNextMG: pGameObj.iNextMG,      // 下一局芒果
        iJiFenMGTimes: pGameObj.iJiFenMGTimes,  // 当前几芒了

        pJiFenObjs: pJiFenObjs
    }, 0);

    if (pJCInfo.iUid > 0) {
        //await CheckUsersJC(pRoomObj, pJCInfo.iUid, iMode);
        if (iWaterSum > 0) await jcLibs.jiangchiinc({ uid: pJCInfo.iUid, golds: iWaterSum });   // 抽水到奖池
    }

    AddActionJieSuan(pRoomObj.pVideo, {
        iMode: 0,   // 正常结算
        iTotalGolds: iTotalGolds,
        iJiFenMGC: pGameObj.iJiFenMG,           // 芒果池
        iNextMG: pGameObj.iNextMG,              // 下一局芒果
        iJiFenMGTimes: pGameObj.iJiFenMGTimes,  // 当前几芒了

        pJiFenObjs: pJiFenObjs
    });     // 保存录像数据
    
    await OnGameOver(pRoomObj);
    pRoomObj.bRunning = false;
    for (var iIndex = 0; iIndex < pGameObjEx.pPlayers.length; ++iIndex) {
        var pUserObj = pGameObjEx.pPlayers[iIndex];
        pUserObj.iState = RoomMgr.SeatState.SEAT_STATE_WAIT;
        var pUserRef = RoomMgr.GetUserObj(pRoomObj, pUserObj.iUserId);
        if (pUserRef != null) {
            if ((pUserRef.iSeatIndex != -1) && (pUserRef.iState != RoomMgr.SeatState.SEAT_STATE_LIUZ)) {
                pUserRef.iState = RoomMgr.SeatState.SEAT_STATE_WAIT;
            }
        }
    }
    delete pGameObjEx.pPlayers;
    delete pRoomObj.pGameObjEx;
    if (CheckJieSan(pRoomObj)) return;

    var pReqArgs = {
        iRoomId: pRoomObj.iRoomId,
        iUserId: pRoomObj.iCreator,
        pSocket: null
    };
    pRoomObj.pTimerPtr = setTimeout(OnStart, TIME_OUT_START_VALUE * 1000, pReqArgs);
}


// 获取指定用户允许的操作
function GetEnableActions(pRoomObj, iUserId) {
    var pPlayerObj = GetPlayerObj(pRoomObj, iUserId);
    var pStakeObj = RoomMgr.GetStakeObj(pRoomObj, iUserId);
    var pGameObjEx = pRoomObj.pGameObjEx;

    var Result = {
        bCanXIU: true,  // 是否可以休
        bCanDIU: true,  // 是否可以丟
        iCursorUser: pGameObjEx.pCursor.iUserId,
        pCusorOpts: {
            bCanXIU: false,
            bCanDIU: false,
            bCanYZ: false,
        },
        iMinYZ: 0,
        iAddYZ: 0,
        bIsQiao: false,
        iSHPMode: 0,
        iTimeOut: -1
    }

    if (pPlayerObj == null) {
        Result.bCanXIU = false;
        Result.bCanDIU = false;
    }
    else {
        console.log("GetEnableActions iUserId:" + iUserId + ", iState:" + pPlayerObj.iState);
        if ((pPlayerObj.iState == RoomMgr.SeatState.SEAT_STATE_QIAO) ||
            (pPlayerObj.iState == RoomMgr.SeatState.SEAT_STATE_LOSE)) {
    
            Result.bCanXIU = false;
            Result.bCanDIU = false;
    
            return Result;
        }
    
        var iMaxYZ = GetMaxYZ(pRoomObj);
        if (pPlayerObj.iState == RoomMgr.SeatState.SEAT_STATE_REST) {
            if (iMaxYZ > pStakeObj.iJiFenYZ) {
                Result.bCanXIU = false;
                return Result;
            }
        }
        else if (pPlayerObj.iState == RoomMgr.SeatState.SEAT_STATE_PLAY) {
            if (iMaxYZ > pStakeObj.iJiFenYZ) {
                Result.bCanXIU = false;
                return Result;
            }
        }
        else {
            Result.bCanXIU = false;
            Result.bCanDIU = false;
        }
    
    }
    
    if (!pRoomObj.pGameObjEx.bCanXIU) Result.bCanXIU = false;

    Result.iSHPMode = Result.iSHPMode;
    Result.pCusorOpts.bCanXIU = Result.bCanXIU;
    Result.pCusorOpts.bCanDIU = Result.bCanDIU;

    return Result;
}

// 计算哪些用户需要显示 自动休/自动丢 按钮
function CheckActionUsers(pRoomObj) {
    var pGameObjEx = pRoomObj.pGameObjEx;
    var pActionUsers = pGameObjEx.pActionUsers;

    var iPlayerCount = 0;
    var iMaxYZ = GetMaxYZ(pRoomObj);

    pActionUsers.splice(0, pActionUsers.length);
    for (var iIndex = 0; iIndex < pGameObjEx.pPlayers.length; ++iIndex) {
        var pItem = pGameObjEx.pPlayers[iIndex];
        if (pItem.iState == RoomMgr.SeatState.SEAT_STATE_LOSE) continue;
        if (pItem.iState == RoomMgr.SeatState.SEAT_STATE_QIAO) continue;
        if (pItem.iState == RoomMgr.SeatState.SEAT_STATE_REST) continue;

        iPlayerCount += 1;
        var pStake = RoomMgr.GetStakeObj(pRoomObj, pItem.iUserId);
        if (pStake.iJiFenYZ >= iMaxYZ) continue;
        if (pItem == pGameObjEx.pCursor) continue;

        pActionUsers.push(pItem.iUserId);
    }

    var pStake = RoomMgr.GetStakeObj(pRoomObj, pGameObjEx.pCursor.iUserId);
    if ((iPlayerCount > 1) && (pActionUsers.length == 0) && (pStake.iJiFenYZ == iMaxYZ)) {
        for (var iIndex = 0; iIndex < pGameObjEx.pPlayers.length; ++iIndex) {
            var pItem = pGameObjEx.pPlayers[iIndex];
            if (pItem.iState == RoomMgr.SeatState.SEAT_STATE_LOSE) continue;
            if (pItem.iState == RoomMgr.SeatState.SEAT_STATE_QIAO) continue;
            if (pItem.iState == RoomMgr.SeatState.SEAT_STATE_REST) continue;
            if (pItem == pGameObjEx.pCursor) continue;

            pActionUsers.push(pItem.iUserId);
        }
    }
}

// 给指定玩家发送可用动作
async function SendOperator(pRoomObj, pUserObj, bCanXIU, bCanDIU, bCanYZ, bCanFP, bReconnect, iFromUser) {
    var pGameObj = pRoomObj.pGameObj;
    var pGameObjEx = pRoomObj.pGameObjEx;

    if (pGameObjEx == null) return;
    if (pGameObjEx.szState == "split") return;

    console.log("SendOperator iUserId:" + pUserObj.iUserId);

    pUserObj.pOperator.bCanFP = bCanFP;
    if (bCanFP) {
        pUserObj.pOperator.bCanXIU = false;
        pUserObj.pOperator.bCanDIU = false;
        pUserObj.pOperator.bCanYZ = false;
    }
    else {
        pUserObj.pOperator.bCanXIU = bCanXIU;
        pUserObj.pOperator.bCanDIU = bCanDIU;
        pUserObj.pOperator.bCanYZ = bCanYZ;
    }

    if (pUserObj.iSHPMode == 1) { // 三花6,10
        bCanYZ = false;
        bCanXIU = false;
        pUserObj.pOperator.bCanXIU = false;
        pUserObj.pOperator.bCanDIU = true;
        pUserObj.pOperator.bCanYZ = false;
    }
    console.log(pUserObj.pOperator);

    var iMinYZ = 0;
    var iAddYZ = 0;
    if (bCanYZ) {   // 可以押注
        var pJiFenObj = RoomMgr.GetRoomObj(pRoomObj, pUserObj.iUserId);      // 玩家积分信息

        iMinYZ = pGameObjEx.iJiFenGEN;  // pGameObjEx.iCurrentYZ;
        if (iMinYZ > pUserObj.iOrgJiFen) iMinYZ = pUserObj.iOrgJiFen;

        iAddYZ = GetMaxYZ(pRoomObj);   // pGameObjEx.iCurrentYZ;
        if (iAddYZ < iMinYZ) iAddYZ = iMinYZ;
        if (iAddYZ < pGameObj.iJiFenMG) iAddYZ = pGameObj.iJiFenMG;
        
        // if (iAddYZ < pGameObj.iJiFenMG) {
        //     iAddYZ = pGameObj.iJiFenMG;
        // }
        // else {
        //     iAddYZ = iAddYZ * 2;
        // }

        console.log("SendOperator iUserId:" + pUserObj.iUserId + ", bBQStake:" + pUserObj.bBQStake +
            ", iMinYZ:" + iMinYZ + ", pGameObj.iJiFenMG:" + pGameObj.iJiFenMG + ", iAddYZ:" + iAddYZ);
        if (!pUserObj.bBQStake) {
            //iAddYZ = iMinYZ + iMinYZ;
            if (iAddYZ < pGameObj.iJiFenMG) iAddYZ = pGameObj.iJiFenMG;
        }
        else {
            iAddYZ = 0;       // 本轮喊钱了
        }

        if (iAddYZ > 0 && iAddYZ < GetMaxYZ(pRoomObj) * 2) iAddYZ = GetMaxYZ(pRoomObj) * 2;

        console.log("pUserObj.bBQStake:" + pUserObj.bBQStake);
        
    }

    console.log("SendOperator bCanYZ:" + bCanYZ + ", iMinYZ:" + iMinYZ + ", pGameObjEx.iJiFenGEN:" + pGameObjEx.iJiFenGEN);

    var iSHPMode = 0;
    if (pUserObj.iSHPMode == 1) {
        if (GLibs.IsKeySHL(pUserObj.pPais)) {
            iSHPMode = 1;
        }
        else if (GLibs.IsKeySHS(pUserObj.pPais)) {
            iSHPMode = 2;
        }
    }

    CheckActionUsers(pRoomObj);

    var iTimeOut = TIME_OUT_ACTION_VALUE;
    if (!bReconnect) {
        ClearUserOptTimerPtr(pUserObj);
    }
    else {  // 断线重连
        var pCursor = pGameObjEx.pCursor;

        if (pCursor.tmOptTimerPtr != null) {
            var tmNow = new Date();
            iTimeOut = tmNow.getTime() - pCursor.tmOptTimerPtr.getTime();
            iTimeOut = TIME_OUT_ACTION_VALUE - parseInt(iTimeOut / 1000);
            if (iTimeOut < 0) iTimeOut = 0;
        }
        else {
            iTimeOut = 0;
        }
    }

    // if ((iAddYZ > 0) && (iAddYZ < iMinYZ + iMinYZ) && (!pUserObj.bBQStake)) {
    //     iAddYZ = iMinYZ + iMinYZ;
    // }

    pGameObjEx.bCanJZ = (iAddYZ > 0);   // 是否可以加注

    var pJiFenObj = RoomMgr.GetJiFenObj(pRoomObj, pUserObj.iUserId);
    console.log("SendOperator iUserId:" + pUserObj.iUserId + ", iMinYZ:" + iMinYZ + ", pJiFenObj.iJiFen:" + pJiFenObj.iJiFen);
    var pMsgs = {
        wErrCode: ErrorCodes.ERR_NOERROR,
        szErrMsg: "操作成功",
        iCursorUser: pUserObj.iUserId,
        pCusorOpts: pUserObj.pOperator,             // 当前玩家可以进行的操作
        iMinYZ: iMinYZ,                             // 最小押注
        iAddYZ: iAddYZ,                             // 最小加注
        bIsQiao: (iMinYZ >= pJiFenObj.iOrgJiFen),   // 是否敲牌押注
        iSHPMode: iSHPMode,                         // 三花牌模式 0:普通牌, 1:三花六, 2:三花十
        iTimeOut: iTimeOut                          // 动作超时(秒)
    };
    if (pUserObj.iSHPMode == 1) {
        pMsgs.iMinYZ = 0;
        pMsgs.iAddYZ = 0;
        pMsgs.bIsQiao = false;
    }
    //console.log(pMsgs);

    if (!bReconnect) {
        SendMsgToAll(pRoomObj, "actions_notify", pMsgs);
   
        for (var iIndex = 0; iIndex < pGameObjEx.pPlayers.length; ++iIndex) {
            var pItem = pGameObjEx.pPlayers[iIndex];
            if (pItem.iState == RoomMgr.SeatState.SEAT_STATE_LOSE) continue;
            if (pItem.iUserId == pUserObj.iUserId) continue;
            if (pGameObjEx.pActionUsers.indexOf(pItem.iUserId) == -1) continue;
    
            var pActions = GetEnableActions(pRoomObj, pItem.iUserId);
            SendMsgToUser(pItem.iUserId, "enable_actions_result", pActions);
        }
    }
    else {
        SendMsgToUser(iFromUser,  "actions_notify", pMsgs);

        if (pGameObjEx.pCursor.iUserId != iFromUser) {
            var pActions = GetEnableActions(pRoomObj, iFromUser);
            SendMsgToUser(iFromUser, "enable_actions_result", pActions);
        }

        return;
    }
    
    if (bCanXIU) {
        console.log("SendOperator xiu timer");
        pUserObj.iOptCmd = 1;
        pUserObj.tmOptTimerPtr = new Date();
        //pUserObj.tmOptTimerPtr.setSeconds(pUserObj.tmOptTimerPtr.getSeconds() + TIME_OUT_ACTION_VALUE);
        pUserObj.pOptTimerPtr = setTimeout(TimeOutAutoXiu, TIME_OUT_ACTION_VALUE * 1000, pRoomObj, pUserObj);
    }
    else {
        if (pUserObj.iSHPMode == 1) {
            var pReqArgs = {
                iRoomId: pRoomObj.iRoomId,
                iUserId: pUserObj.iUserId,
                pSocket: UserMgr.GetSocketObj(pUserObj.iUserId),
                bTimeOut: false,
            };
            OnLose(pReqArgs);
            //TimeOutAutoLose(pRoomObj, pUserObj);
            return;
        }

        console.log("SendOperator diu timer");
        pUserObj.iOptCmd = 2;
        pUserObj.tmOptTimerPtr = new Date();
        //pUserObj.tmOptTimerPtr.setSeconds(pUserObj.tmOptTimerPtr.getSeconds() + TIME_OUT_ACTION_VALUE);
        pUserObj.pOptTimerPtr = setTimeout(TimeOutAutoLose, TIME_OUT_ACTION_VALUE * 1000, pRoomObj, pUserObj);
    }
}

// 执行下一动作
async function ExeNextAction(pRoomObj) {
    var iOptMode = 0;     // 0:发下一张牌, 1:下一个玩家说话
    var pGameObj = pRoomObj.pGameObj;
    var pGameObjEx = pRoomObj.pGameObjEx;

    console.log("ExeNextAction 1");

    var bDoSplit = false;
    var iMaxYZ = 0;         // 最大押注分
    var iMaxQPYZ = 0;       // 最大敲牌押注
    var iTimesYZ = 0;
    var pPlayers = [];      // 在玩玩家
    var pQPlayers = [];     // 敲钵钵玩家
    var pXPlayers = [];     // 休牌玩家
    var pDPlayers = [];     // 丢牌玩家
    var bAllOperator = true;   // 本轮所有玩家都发话了
    var pSHPUserObjs = [];     // 三花牌用户

    for (var iIndex = 0; iIndex < pGameObjEx.pPlayers.length; ++iIndex) {
        var pUserObj = pGameObjEx.pPlayers[iIndex];
        var pStakeObj = RoomMgr.GetStakeObj(pRoomObj, pUserObj.iUserId);
        //console.log("ExeNextAction iUserId:" + pUserObj.iUserId + ", iState:" + pUserObj.iState);

        switch (pUserObj.iState) {
            case RoomMgr.SeatState.SEAT_STATE_QIAO: // 敲家
                if (iMaxQPYZ < pStakeObj.iJiFenYZ) iMaxQPYZ = pStakeObj.iJiFenYZ;
                if (iTimesYZ < pUserObj.iTimesYZ) iTimesYZ = pUserObj.iTimesYZ;
                pQPlayers.push(pUserObj);
                if (pUserObj.iSHPMode == 1) pSHPUserObjs.push(pUserObj);
                break;
            case RoomMgr.SeatState.SEAT_STATE_REST: // 休家
                if (!pUserObj.bOperator) bAllOperator = false;
                if (iTimesYZ < pUserObj.iTimesYZ) iTimesYZ = pUserObj.iTimesYZ;
                pXPlayers.push(pUserObj);
                break;
            case RoomMgr.SeatState.SEAT_STATE_PLAY: // 玩家
                if (iMaxYZ < pStakeObj.iJiFenYZ) iMaxYZ = pStakeObj.iJiFenYZ;
                if (iTimesYZ < pUserObj.iTimesYZ) iTimesYZ = pUserObj.iTimesYZ;
                if (!pUserObj.bOperator) bAllOperator = false;
                pPlayers.push(pUserObj);
                break;
            case RoomMgr.SeatState.SEAT_STATE_LOSE: // 丢
                pDPlayers.push(pUserObj);
                break;
        }
    }

    // 三花牌自动丢判断判断
    if ((pSHPUserObjs.length > 0) && (pPlayers.length <= 1)) {
        for (var iIndex = 0; iIndex < pSHPUserObjs.length; ++iIndex) {
            var pUserObj = pSHPUserObjs[iIndex];
            pUserObj.iState = RoomMgr.SeatState.SEAT_STATE_LOSE;
        }

        bDoSplit = false;
        pPlayers = [];      // 在玩玩家
        pQPlayers = [];     // 敲钵钵玩家
        pXPlayers = [];     // 休牌玩家
        pDPlayers = [];     // 丢牌玩家
        bAllOperator = true;   // 本轮所有玩家都发话了

        for (var iIndex = 0; iIndex < pGameObjEx.pPlayers.length; ++iIndex) {
            var pUserObj = pGameObjEx.pPlayers[iIndex];
            var pStakeObj = RoomMgr.GetStakeObj(pRoomObj, pUserObj.iUserId);

            switch (pUserObj.iState) {
                case RoomMgr.SeatState.SEAT_STATE_QIAO: // 敲家
                    pQPlayers.push(pUserObj);
                    break;
                case RoomMgr.SeatState.SEAT_STATE_REST: // 休家
                    pXPlayers.push(pUserObj);
                    break;
                case RoomMgr.SeatState.SEAT_STATE_PLAY: // 玩家
                    pPlayers.push(pUserObj);
                    break;
                case RoomMgr.SeatState.SEAT_STATE_LOSE: // 丢
                    pDPlayers.push(pUserObj);
                    break;
            }
        }
    }

    for (var iIndex = 0; iIndex < pXPlayers.length; ++iIndex) {
        var pUserObj = pXPlayers[iIndex];
        var pStakeObj = RoomMgr.GetStakeObj(pRoomObj, pUserObj.iUserId);

        if (pStakeObj.iJiFenYZ < iMaxQPYZ) {    // 休牌玩家存在押注分数小于最大敲钵钵分数
            console.log("ExeNextAction 1111111111");
            iOptMode = 1;   // 下一个玩家说话
            break;
        }
    }

    if (!bAllOperator && (pPlayers.length + pXPlayers.length > 1)) {
        console.log("ExeNextAction 22222222222");
        iOptMode = 1;    // 本轮还有在玩玩家还没有说话
    }

    if (iOptMode == 0) {
        var iValue = 0;
        for (var iIndex = 0; iIndex < pPlayers.length; ++iIndex) {
            var pUserObj = pPlayers[iIndex];
            var pStakeObj = RoomMgr.GetStakeObj(pRoomObj, pUserObj.iUserId);

            if (pStakeObj.iJiFenYZ < iMaxQPYZ) {    // 在玩玩家存在押注分数小于最大敲钵钵分数
                console.log("ExeNextAction 33333333333333");
                iOptMode = 1;   // 下一个玩家说话
                break;
            }

            if (iValue == 0) iValue = pStakeObj.iJiFenYZ;
            if (iValue != pStakeObj.iJiFenYZ) {
                console.log("ExeNextAction 4444444444444444");
                iOptMode = 1;   // 至少存在2个在玩玩家押注分数不等
                break;
            }
        }
    }

    if (iOptMode == 0) {
        if ((pPlayers.length > 0) && (pXPlayers.length > 0)) {
            console.log("ExeNextAction 4444444444444444");
            iOptMode = 1;
        }
    }

    // 所有在玩玩家押注分数肯定一样了，且最大敲家分数 <= 在玩玩家押注分数
    console.log("ExeNextAction iOptMode:" + iOptMode);
    if (iOptMode == 1) {        // 移动到下一个玩家
        var pCurrent = pRoomObj.pGameObjEx.pCursor;
        var pCursor = await MoveNext(pRoomObj);

        console.log("ExeNextAction pCurrent.iUserId:" + pCurrent.iUserId + ", pCursor.iUserId:" + pCursor.iUserId);
        if ((pCurrent != pCursor) && (pCursor.iState == RoomMgr.SeatState.SEAT_STATE_PLAY)) {
            var pStakeObj = RoomMgr.GetStakeObj(pRoomObj, pCursor.iUserId);
            if (!pCursor.bOperator) {
                await SendOperator(pRoomObj, pCursor, pGameObjEx.bCanXIU, true, true, false);
                return;
            }
            else if (pStakeObj.iJiFenYZ < GetMaxYZ(pRoomObj)) {
                console.log("ExeNextAction move next and SendOperator");
                await SendOperator(pRoomObj, pCursor, pGameObjEx.bCanXIU, true, true, false);
                return;
            }
        }
        iOptMode = 0;
    }

    if (IsXiuM(pRoomObj)) {     // 是否休芒
        OnXiuMEvent(pRoomObj);
        return;
    }

    if (IsZouM(pRoomObj)) {     // 是否揍芒
        OnZouMEvent(pRoomObj);
        return;
    }

    if (pGameObjEx.iDealNum == 4) { // 牌发完了，结算
        if ((pPlayers.length > 0) && (pQPlayers.length > 0)) {
            await NotifySplitNotify(pRoomObj);
            console.log("ExeNextAction start_split_notify 1");
            return;
        }

        if ((pXPlayers.length > 0) && (pQPlayers.length > 0)) {
            await NotifySplitNotify(pRoomObj);
            console.log("ExeNextAction start_split_notify 1");
            return;
        }

        if (pPlayers.length + pQPlayers.length == 1) {
            console.log("ExeNextAction JieShaun 1111");
            await JieShuan(pRoomObj);
            return;
        }

        await NotifySplitNotify(pRoomObj);
        console.log("ExeNextAction start_split_notify 2");
        //pRoomObj.pTimerPtr = setTimeout(TimeOutAutoSplit, TIME_OUT_SPLIT_VALUE, pRoomObj);
        return;
    }


    var iDealTimes = 1; // 发几张牌
    if (pPlayers.length > 1) {
        console.log("ExeNextAction case 1");
    }
    else if ((pPlayers.length == 1) && (pQPlayers.length == 0)) {
        console.log("ExeNextAction case 2");
        await JieShuan(pRoomObj);
        return;
    }
    else if ((pXPlayers.length > 0) && (pQPlayers.length > 0)) {
        console.log("ExeNextAction case 3");
        iDealTimes = 4 - pGameObjEx.iDealNum;   // 直接把牌发完
        bDoSplit = true;
    }
    else if ((pPlayers.length == 1) && (pQPlayers.length > 0)) {
        console.log("ExeNextAction case 4");
        iDealTimes = 4 - pGameObjEx.iDealNum;   // 直接把牌发完
        bDoSplit = true;
    }
    else if ((pPlayers.length == 0) && (pXPlayers.length == 0) && (pQPlayers.length > 0)) {
        console.log("ExeNextAction case 6");
        iDealTimes = 4 - pGameObjEx.iDealNum;   // 直接把牌发完
        if (pQPlayers.length == 1) {
            console.log("ExeNextAction case 6");
            await JieShuan(pRoomObj);
            return;
        }
        bDoSplit = true;
    }

    var bReset = true;
    var iNumVals = pXPlayers.length + pQPlayers.length + pPlayers.length;
    if (!pGameObjEx.bCanJZ && (pGameObjEx.iXiuNum == pPlayers.length)) {// (iNumVals > 1)) {
        console.log("ExeNextAction 上一轮没搭动，直接发牌分牌");
        iDealTimes = 4 - pGameObjEx.iDealNum;   // 直接把牌发完
        //if (iTimesYZ > 1) {
            bReset = false;
            bDoSplit = true;
        //}
    }
    
    if (bReset) {
        pGameObjEx.iXiuNum = 0;
        for (var iIndex = 0; iIndex < pGameObjEx.pPlayers.length; ++iIndex) {
            var pUserObj = pGameObjEx.pPlayers[iIndex];
            pUserObj.iTimesYZ = 0;
        }
    }

    console.log("ExeNextAction bDoSplit:" + bDoSplit + ", iLoopTimes:" + iDealTimes);

    var pMaxPaiInfo = {
        iPai: -1,
        pUserObj: null
    };

    var iWaitVals = 0;
    var iPlayerCount = 0;   // 新一轮还有几个人在玩

    pSHPUserObjs = [];      // 三花牌用户
    if (iDealTimes > 0) {
        var iCount = pGameObjEx.pPlayers.length;
        var pCursorUser = pGameObjEx.pBanker.pNext;
        var pQueueUsers = [];

        while (iCount > 0) {
            if (pCursorUser.iState == RoomMgr.SeatState.SEAT_STATE_LOSE) {
                --iCount;
                pCursorUser = pCursorUser.pNext;
                continue; // 丢牌玩家
            }
            
            pQueueUsers.push(pCursorUser.iUserId);   // 按庄家开始排序进队列
            pCursorUser = pCursorUser.pNext;
            --iCount;
        }
        console.log("ExeNextAction deal times 1");

        var pDataMaps = {};
        for (var iLoop = 0; iLoop < iDealTimes; ++iLoop) {
            iPlayerCount = 0;
            pMaxPaiInfo = {
                iPai: -1,
                pUserObj: null
            };

            for (var iIndex = 0; iIndex < pGameObjEx.pPlayers.length; ++iIndex) {
                var pUserObj = pGameObjEx.pPlayers[iIndex];
                if (pUserObj.iState == RoomMgr.SeatState.SEAT_STATE_LOSE) continue; // 丢牌玩家
    
                if (pUserObj.iState == RoomMgr.SeatState.SEAT_STATE_REST) {
                    pUserObj.iState = RoomMgr.SeatState.SEAT_STATE_PLAY;    // 新一轮重置在玩用户状态
                }
    
                ++iPlayerCount;
                pUserObj.bOperator = false;
                pUserObj.bBQStake = false;      // 发新一张牌的时候，重置本轮喊钱状态
    
                var iPai = -1;
                if (pUserObj.pCtrlPais == null) {
                    iPai = pGameObjEx.pPais.pop();
                }
                else {
                    iPai = pUserObj.pCtrlPais.pop();
                }
                pUserObj.pPais.push(iPai);
                //var iPai = GetRandPoker(pUserObj, pPais);
    
                var iSHPMode = 0;
                if (pUserObj.iSHPMode == 0) {
                    if (GLibs.IsKeySHL(pUserObj.pPais)) {   // 三花六
                        iSHPMode = 1;
                        pUserObj.iSHPMode = 1;
                        console.log("ExeNextAction iUserId:" + pUserObj.iUserId + ", 三花六");
                    }
                    else if (GLibs.IsKeySHS(pUserObj.pPais)) {  // 三花十
                        iSHPMode = 2;
                        pUserObj.iSHPMode = 1;
                        console.log("ExeNextAction iUserId:" + pUserObj.iUserId + ", 三花十");
                    }
    
                    if (iSHPMode > 0 && GLibs.GetDZ(pUserObj.pPais)) {  // 有对子的情况不能算三花牌
                        iSHPMode = 0;
                        pUserObj.iSHPMode = 0;
                        console.log("ExeNextAction iUserId:" + pUserObj.iUserId + ", 三花牌有队子不能算三花牌");
                    }
    
                    if (pUserObj.iSHPMode == 1) pSHPUserObjs.push(pUserObj);
                }
    
                if (pMaxPaiInfo.iPai != -1) {
                    var iRet = GLibs.ComparePai(iPai, pMaxPaiInfo.iPai);
                    if (iRet == -1) {
                        pMaxPaiInfo.iPai = iPai;
                        pMaxPaiInfo.pUserObj = pUserObj;
                    }
                    else if (iRet == 0) {
                        var iPos1 = pQueueUsers.indexOf(pMaxPaiInfo.pUserObj.iUserId);
                        var iPos2 = pQueueUsers.indexOf(pUserObj.iUserId);

                        if (iPos1 > iPos2) {
                            pMaxPaiInfo.pUserObj = pUserObj;
                        }
                    }
                }
                else {
                    pMaxPaiInfo.iPai = iPai;
                    pMaxPaiInfo.pUserObj = pUserObj;
                }

                pUserObj.iTimesYS = 0;  // 新一轮重置延时次数

                var pItem = pDataMaps[pUserObj.iUserId];
                if (pItem == null) {
                    pItem = {
                        iSeatIndex: pUserObj.iSeatIndex,
                        iUserId: pUserObj.iUserId,
                        pPais: []
                    };
                    pDataMaps[pUserObj.iUserId] = pItem;
                }
                pItem.pPais.push(iPai);
            }
    
            ++pGameObjEx.iDealNum;

            pGameObjEx.iMaxQ = 0;
            pGameObjEx.iJiFenGEN = GetMaxYZ(pRoomObj) * 2;
            if (pGameObjEx.iJiFenGEN < pGameObj.iJiFenMG) pGameObjEx.iJiFenGEN = pGameObj.iJiFenMG;
        }

        var pSendMsgs = [];
        for (var sKey in pDataMaps) {
            var pItem = pDataMaps[sKey];
            pSendMsgs.push(pItem);
        }
        iWaitVals = pSendMsgs.length;

        pGameObjEx.pSHUsers = [];        
        SendMsgToAll(pRoomObj, "dealnext_notify", pSendMsgs);

        AddActionDeal(pRoomObj.pVideo, pSendMsgs);

        console.log("ExeNextAction deal times 2");
    }

    if (bDoSplit) {
        pGameObjEx.pCursor = null;
        pGameObjEx.szState = "split";

        iPlayerCount = 0;
        for (var iIndex = 0; iIndex < pGameObjEx.pPlayers.length; ++iIndex) {
            var pUserObj = pGameObjEx.pPlayers[iIndex];
            if (pUserObj.iState == RoomMgr.SeatState.SEAT_STATE_LOSE) continue; // 丢牌玩家

            if (pUserObj.iSHPMode == 1) {
                pUserObj.iState = RoomMgr.SeatState.SEAT_STATE_LOSE;
                SendMsgToAll(pRoomObj, "lose_notify", {
                    wErrCode: ErrorCodes.ERR_NOERROR,
                    szErrMsg: "操作成功",
                    iUserId: pUserObj.iUserId
                });

                continue;
            }
            ++iPlayerCount;
        }

        if (iPlayerCount > 1) {
            console.log("ExeNextAction 1");
            await NotifySplitNotify(pRoomObj);
            //setTimeout(NotifySplitNotify, 1000, pRoomObj);
        }
        else {
            console.log("ExeNextAction 2");
            await JieShuan(pRoomObj);
            //setTimeout(JieShuan, 1000, pRoomObj);
        }
        //pRoomObj.pTimerPtr = setTimeout(TimeOutAutoSplit, TIME_OUT_SPLIT_VALUE, pRoomObj);
    }
    else {
        console.log("ExeNextAction 3");
        iPlayerCount = 0;
        for (var iIndex = 0; iIndex < pGameObjEx.pPlayers.length; ++iIndex) {
            var pUserObj = pGameObjEx.pPlayers[iIndex];
            if (pUserObj.iState == RoomMgr.SeatState.SEAT_STATE_LOSE) continue; // 丢牌玩家

            if (pUserObj.iSHPMode == 1) {
                pUserObj.iState = RoomMgr.SeatState.SEAT_STATE_LOSE;
                SendMsgToAll(pRoomObj, "lose_notify", {
                    wErrCode: ErrorCodes.ERR_NOERROR,
                    szErrMsg: "操作成功",
                    iUserId: pUserObj.iUserId
                });

                continue;
            }

            ++iPlayerCount;
        }

        if (iPlayerCount == 1) {
            setTimeout(JieShuan, TIME_OUT_JIESUAN_VALUE * 1000, pRoomObj);
            return;
        }

        console.log("ExeNextAction 4");
        pGameObjEx.pCursor = pMaxPaiInfo.pUserObj;
        var pCursor = pGameObjEx.pCursor;
        while (true) {
            //console.log("ExeNextAction iUserId:" + pCursor.iUserId + ", iState:" + pCursor.iState);
            if (pCursor.iState == RoomMgr.SeatState.SEAT_STATE_LOSE) pCursor = pCursor.pNext;
            if (pCursor.iState == RoomMgr.SeatState.SEAT_STATE_QIAO) pCursor = pCursor.pNext;

            if (pCursor.iState == RoomMgr.SeatState.SEAT_STATE_PLAY) break;
            if (pCursor == pGameObjEx.pCursor) break;
        }
        pGameObjEx.pCursor = pCursor;

        //MoveNext(pRoomObj);
        pGameObjEx.bCanXIU = true;
        //pGameObjEx.iJiFenGEN = GetMaxYZ(pRoomObj) * 2;
        
        setTimeout(async function(pRoomObj, pGameObjEx) {
            await SendOperator(pRoomObj, pGameObjEx.pCursor, true, true, true, false);
        }, iWaitVals * 200 + 500, pRoomObj, pGameObjEx);

        //SendOperator(pRoomObj, pGameObjEx.pCursor, true, true, true, false);
    }
}

async function GetRSDNotifyObj(pRoomObj, pClubIds) {
    var Result = {
        wErrCode: ErrorCodes.ERR_NOERROR,
        szErrMsg: "操作成功",
        pUserObjs: [],
        pLogs: []
    }

    // 获取房间里面申请上分的玩家
    var pReqObjs = await dbLGQ.get_jifenreq_users_byclubs(pClubIds);
    if (pReqObjs.length == 0) return Result;

    console.log("GetRSDNotifyObj pReqObjs.length:" + pReqObjs.length);
    for (var iIndex = 0; iIndex < pReqObjs.length; ++iIndex) {
        var pItem = pReqObjs[iIndex];
        //if (pClubIds.indexOf(pItem.iFromClub) >= 0) {
            var iMode = 1;
            if (pItem.iReqJiFen < pItem.iJiFenSum) iMode = 2;

            var iSeatIndex = -1;
            var pUserObj = RoomMgr.GetUserObj(pRoomObj, pItem.iUserId);
            if (pUserObj != null) iSeatIndex = pUserObj.iSeatIndex;

            var pClubInfo = await dbLGQ.get_club_info_with_id(pItem.iFromClub);
            var pReqItem = {
                iUid: pItem.iUid,
                iMode: iMode,
                iUserId: pItem.iUserId,
                szAlias: crypto.fromBase64(pItem.szReqUser),
                iClubId: pItem.iFromClub,
                szRoomUUID: pItem.szRoomUUID,
                szRoomName: pItem.szRoomName,
                iRoomId: pItem.iRoomId,
                szMemo: pClubInfo.sname,
                iMinFenE: pItem.iMinFenE,
                iReqJiFen: pItem.iReqJiFen,
                iAddJiFen: pItem.iAddJiFen,
                iJiFenSum: pItem.iJiFenSum,
                iReqSeatIndex: iSeatIndex,
                tmReqTime: pItem.tmTime
            };
            Result.pUserObjs.push(pReqItem);
        //}
    }

    return Result;
}

// 玩家申请上分
async function OnReqAddJiFen(pReqArgs) {
    var pRoomObj = RoomMgr.GetRoomObj(pReqArgs.iRoomId);
    if (pRoomObj == null) {
        console.log("OnReqAddJiFen ######## 1");
        SendMsg(pReqArgs.pSocket, "addjifen_result", {
            wErrCode: ErrorCodes.ERR_ROOMISNOTEXISTS,
            szErrMsg: "房间不存在"
        });
        return;
    }
    console.log("OnReqAddJiFen iRoomId:" + pRoomObj.iRoomId + ", iUserId:" + pReqArgs.iUserId + ", iJiFen:" + pReqArgs.iJiFen);

    pReqArgs.iJiFen = parseInt(pReqArgs.iJiFen);
    var pUserObj = RoomMgr.GetUserObj(pRoomObj, pReqArgs.iUserId);
    if (pUserObj == null) {
        console.log("OnReqAddJiFen ######## 2");
        console.log("OnReqAddJiFen iUserId:" + pReqArgs.iUserId + " is not in this room.");
        SendMsg(pReqArgs.pSocket, "addjifen_result", {
            wErrCode: ErrorCodes.ERR_INVOKE_FALIED,
            szErrMsg: "用户不存在"
        });
        return;
    }

    var pJiFenObj = RoomMgr.GetJiFenObj(pRoomObj, pReqArgs.iUserId);
    if (pJiFenObj == null) {
        pJiFenObj = {
            iJiFenDR: 0,     // 总带入
            iJiFenCDR: 0,    // 当前带入
            iJiFenYQ: 0,
            iJiFen: 0,
            iClubId: pUserObj.iEnterClubId    // 玩家上分的俱乐部ID
        };
    }
    var iClubId = pJiFenObj.iClubId;
    console.log("OnReqAddJiFen iClubId:" + iClubId);

    // 用户库存分够的情况
    if (pJiFenObj.iJiFenDR - pJiFenObj.iJiFenCDR >= pReqArgs.iJiFen) {
        pJiFenObj.iJiFenCDR += pReqArgs.iJiFen;

        var pPlayerObj = GetPlayerObj(pRoomObj, pReqArgs.iUserId);
        if (IsPlayingUser(pPlayerObj)) {    // 牌局过程中的玩家要等本局结束后才把分加上去
            pJiFenObj.iJiFenYQ += pReqArgs.iJiFen;
        }
        else {
            pJiFenObj.iJiFen += pReqArgs.iJiFen;
        }

        if (pUserObj != null) {
            if (pUserObj.iState == RoomMgr.SeatState.SEAT_STATE_REQSD) {
                pUserObj.iState = RoomMgr.SeatState.SEAT_STATE_WAIT;
            }
            else if (pUserObj.iState == RoomMgr.SeatState.SEAT_STATE_LIUZ) {
                var iMinJiFen = pRoomObj.pRoomArgs.iBaseFen * 2 + pRoomObj.pGameObj.iNextMG;
                if (pJiFenObj.iJiFen > iMinJiFen) {
                    pUserObj.iState = RoomMgr.SeatState.SEAT_STATE_WAIT;
                    RoomMgr.ClearLZReqTimerPtr(pUserObj);
                }
            }
            else if (pUserObj.iState == RoomMgr.SeatState.SEAT_STATE_FSW) {
                pUserObj.iState = RoomMgr.SeatState.SEAT_STATE_WAIT;
                delete pUserObj.tmWSFTime;
                if (pUserObj.pWSFTimePtr != null) {
                    clearTimeout(pUserObj.pWSFTimePtr);
                    delete pUserObj.pWSFTimePtr;
                }
            }
        }
        
        //await dbLGQ.update_user_jifen(pRoomObj.szRoomUUID, pUserObj.iUserId, pJiFenObj);
        await dbLGQ.add_user_jifen(pRoomObj.szRoomUUID, pUserObj.iUserId, 0, pReqArgs.iJiFen, 0, pReqArgs.iJiFen);

        var pItem = {
            iSeatIndex: pUserObj.iSeatIndex,
            iUserId: pUserObj.iUserId,
            //szAlias: pDestUser.szAlias,
            //szHeadIco: pDestUser.szHeadIco,
            //bSex: pDestUser.bSex,
            iGolds: pUserObj.iGolds,
            iState: pUserObj.iState,
            bOnline: pUserObj.bOnline,
            iJiFenDR: pJiFenObj.iJiFenDR,     // 总带入积分
            iJiFenCDR: pJiFenObj.iJiFenCDR,   // 当前带入
            iJiFenYQ: pJiFenObj.iJiFenYQ,     // 预取积分
            iJiFen: pJiFenObj.iJiFen          // 用户身上的积分
        };
        SendMsgToAll(pRoomObj, "reqsdpep_notify", {
            wErrCode: ErrorCodes.ERR_NOERROR,
            szErrMsg: "操作成功",
            bAgree: true,
            iUserId: pUserObj.iUserId,
            pUserObj: pItem,
            iMode: 2
        });

        var iJiFen = pJiFenObj.iJiFen;
        if (pPlayerObj != null) {
            if (pPlayerObj.iOrgJiFen != null) iJiFen = pPlayerObj.iOrgJiFen;
        }

        SendMsgToUser(pReqArgs.iUserId, "addjifen_notify", {
            wErrCode: ErrorCodes.ERR_NOERROR,
            szErrMsg: "操作成功",
            bAgree: true,
            iMode: 2,
            iUserId: pItem.iUserId,
            iGolds: pItem.iGolds,
            iReqAddJiFen: pReqArgs.iJiFen,

            iJiFenDR: pJiFenObj.iJiFenDR,     // 总带入积分
            iJiFenCDR: pJiFenObj.iJiFenCDR,   // 当前带入
            iJiFenYQ: pJiFenObj.iJiFenYQ,
            iJiFen: iJiFen,     // pJiFenObj.iJiFen
        });
        console.log("OnReqAddJiFen ######## 3");

        CheckAutoStartGame(pRoomObj);

        return;
    }

    // 用户库存分不够的情况
    var bClubVIP = await IsClubVIP(pReqArgs.iUserId, iClubId);
    if (bClubVIP) {
        var iGolds = await dbLGQ.get_club_golds(iClubId);
        iGolds = parseInt(iGolds);
        if (iGolds + iGolds < pReqArgs.iJiFen) {
            SendMsg(pReqArgs.pSocket, "golds_noten_result", {
                wErrCode: ErrorCodes.ERR_NOTENOUGHGOLDS,
                szErrMsg: "俱乐部基金不够"
            });

            console.log("OnProcessAddJiFenReq 俱乐部基金不够");
            return { wErrCode: ErrorCodes.ERR_NOTENOUGHGOLDS, szErrMsg: "俱乐部基金不够" };
        }
    }
    else {
        var iGolds = await dbLGQ.get_user_golds(pUserObj.iUserId);
        iGolds = parseInt(iGolds);
        pUserObj.iGolds = iGolds;

        if (pUserObj.iGolds + pUserObj.iGolds < pReqArgs.iJiFen) {
            SendMsg(pReqArgs.pSocket, "golds_noten_result", {
                wErrCode: ErrorCodes.ERR_NOTENOUGHGOLDS,
                szErrMsg: "金币不够"
            });
            console.log("金币不够");
            return;
        }
    }

    var bRet = await dbLGQ.isexists_jifenreq(pRoomObj.iRoomId, pReqArgs.iUserId);
    if (bRet) {
        SendMsg(pReqArgs.pSocket, "addjifen_result", {
            wErrCode: ErrorCodes.ERR_INVOKE_FALIED,
            szErrMsg: "请等待房间管理员同意"
        });
        console.log("OnReqAddJiFen 请等待房间管理员同意 ");
        return;
    }

    var iJiFenKC = pJiFenObj.iJiFenDR - pJiFenObj.iJiFenCDR;
    var pHttpReqData = {
        iRoomId: pRoomObj.iRoomId,
        szRoomName: pRoomObj.pRoomArgs.szName,
        iUserId: pUserObj.iUserId,
        szAlias: pUserObj.szAlias,
        iClubId: iClubId,                                    // 用户应该在哪个俱乐部上分
        iAddJiFen: pReqArgs.iJiFen,                          // 请求成功后用户身上加多少积分
        iReqJiFen: pReqArgs.iJiFen - iJiFenKC,               // 新申请加上的积分
        pSendUsers: []
    };
    //console.log(pHttpReqData);

    var iJiFenSum = pReqArgs.iJiFen + pJiFenObj.iJiFenDR;
    var pReqObj = {
        iFromClub: iClubId,                             // 玩家从哪个俱乐部上分
        iRoomId: pRoomObj.iRoomId,
        szRoomUUID: pRoomObj.szRoomUUID,
        szRoomName: pRoomObj.pRoomArgs.szName,          // 房间名
        iMinFenE: pRoomObj.pRoomArgs.iMinFenE,          // 最小带入
        iUserId: pUserObj.iUserId,                      // 用户ID
        szReqUser: crypto.toBase64(pUserObj.szAlias),   // 用户名
        iAddJiFen: pHttpReqData.iAddJiFen,              // 请求成功后用户身上加多少积分
        iReqJiFen: pHttpReqData.iReqJiFen,              // 请求上好多分
        iJiFenSum: iJiFenSum,                           // 成功后总带入积分
        szMemo: pReqArgs.szMemo,                        // 备注信息
        szText: "申请带入" + pReqArgs.iJiFen + "总带入上限提升" + iJiFenSum,
        tmTime: new Date()
    };

    await dbLGQ.add_jifendr_request(pRoomObj.iClubId, pRoomObj.szRoomUUID, pRoomObj.iRoomId,
        iClubId, pReqArgs.iUserId, pReqObj);  // 将申请写入数据

    var pJiFenObj = RoomMgr.GetJiFenObj(pRoomObj, pReqArgs.iUserId);
    if (pJiFenObj == null) {
        var pItem = pRoomObj.pPlayers[pReqArgs.iSeatIndex];
        if ((pItem.iUserId != 0) && (pReqArgs.iUserId != pItem.iUserId)) {
            // 此位置已经被其他人申请了，系统重新分配位置
            if (pRoomObj.pPlayers[pReqArgs.iSeatIndex].iUserId != 0) {
                SendMsg(pReqArgs.pSocket, "addjifen_result", {
                    wErrCode: ErrorCodes.ERR_INVALIDSEATINDEX,
                    szErrMsg: "此位置已有人"
                });
                console.log("OnReqAddJiFen ######## 4");
                return;
            }
        }

        pUserObj = RoomMgr.RemoveSeeUser(pRoomObj, pReqArgs.iUserId);   // 第一次申请上分的玩家肯定是在旁观位得
        pUserObj = RoomMgr.UpdateSeatUser(pRoomObj, pReqArgs.iSeatIndex, pUserObj);

        SendMsgToAll(pRoomObj, "reqsd_notify", {
            iUserId: pReqArgs.iUserId,
            iReqJiFen: pReqArgs.iJiFen,
            iReqSeatIndex: pReqArgs.iSeatIndex
        }, 0);

        console.log("OnReqAddJiFen ######## 5");
        if (pUserObj != null) {
            RoomMgr.ClearJFReqTimerPtr(pUserObj);
            RoomMgr.ClearLZReqTimerPtr(pUserObj);

            pUserObj.tmReqTime = new Date();        // 申请坐位置的时候
            pUserObj.iReqJiFen = pReqArgs.iJiFen;   // 申请带入多少积分
            pUserObj.iReqSeatIndex = pReqArgs.iSeatIndex;
            pUserObj.iState = RoomMgr.SeatState.SEAT_STATE_REQSD;

            pUserObj.pAddJiFenTimer = setTimeout(async function (pRoomObj, iUserId, iSeatIndex) {
                var pDestUser = RoomMgr.RemoveSeatUser(pRoomObj, iUserId);
                if (pDestUser != null) RoomMgr.AddSeePlayer(pRoomObj, pDestUser);

                SendMsgToAll(pRoomObj, "reqsdtimeout_notify", {
                    wErrCode: ErrorCodes.ERR_NOERROR,
                    szErrMsg: "操作成功",
                    iUserId: iUserId,
                    iSeatIndex: iSeatIndex
                });

            }, TIME_OUT_REQSF_VALUE * 1000, pRoomObj, pUserObj.iUserId, pUserObj.iSeatIndex);
        }
    }
    else {
        var pItem = pRoomObj.pPlayers[pReqArgs.iSeatIndex];
        if ((pItem.iUserId != 0) && (pReqArgs.iUserId != pItem.iUserId)) {
            // 此位置已经被其他人申请了，系统重新分配位置
            if (pRoomObj.pPlayers[pReqArgs.iSeatIndex].iUserId != 0) {
                SendMsg(pReqArgs.pSocket, "addjifen_result", {
                    wErrCode: ErrorCodes.ERR_INVALIDSEATINDEX,
                    szErrMsg: "此位置已有人"
                });

                console.log("OnReqAddJiFen ######## 4");
                return;
            }
        }

        pUserObj = RoomMgr.RemoveSeeUser(pRoomObj, pReqArgs.iUserId);
        pUserObj = RoomMgr.UpdateSeatUser(pRoomObj, pReqArgs.iSeatIndex, pUserObj);
        // var iMinJiFen = pRoomObj.pRoomArgs.iBaseFen * 2 + pRoomObj.pGameObj.iNextMG;
        // if (pJiFenObj.iJiFen < iMinJiFen) {
        if ((pJiFenObj.iJiFen == 0) && (GetPlayerObj(pRoomObj, pReqArgs.iUserId) == null)) {
            //pUserObj = RoomMgr.GetUserObj(pRoomObj, pReqArgs.iUserId);
            //pUserObj.iState = RoomMgr.SeatState.SEAT_STATE_REQSD;

            SendMsgToAll(pRoomObj, "reqsd_notify", {
                iUserId: pReqArgs.iUserId,
                iReqJiFen: pReqArgs.iJiFen,
                iReqSeatIndex: pReqArgs.iSeatIndex
            }, 0);

        }
        else {
            SendMsgToAll(pRoomObj, "addjifen_notify", {
                iUserId: pReqArgs.iUserId,
                iReqJiFen: pReqArgs.iJiFen,
                iReqSeatIndex: pReqArgs.iSeatIndex
            }, 0);
        }
        // }
        
        var iMinJiFen = pRoomObj.pRoomArgs.iBaseFen * 2 + pRoomObj.pGameObj.iNextMG;
        if ((pUserObj != null) && (pJiFenObj.iJiFen < iMinJiFen) && (GetPlayerObj(pRoomObj, pReqArgs.iUserId) == null)) {
            RoomMgr.ClearLZReqTimerPtr(pUserObj);
            RoomMgr.ClearJFReqTimerPtr(pUserObj);

            pUserObj.tmReqTime = new Date();        // 申请坐位置的时候
            pUserObj.iReqJiFen = pReqArgs.iJiFen;   // 申请带入多少积分
            pUserObj.iReqSeatIndex = pReqArgs.iSeatIndex;
            pUserObj.iState = RoomMgr.SeatState.SEAT_STATE_REQSD;

            pUserObj.pAddJiFenTimer = setTimeout(async function (pRoomObj, iUserId, iSeatIndex) {
                var pDestUser = RoomMgr.RemoveSeatUser(pRoomObj, iUserId);
                if (pDestUser != null) RoomMgr.AddSeePlayer(pRoomObj, pDestUser);

                SendMsgToAll(pRoomObj, "reqsdtimeout_notify", {
                    wErrCode: ErrorCodes.ERR_NOERROR,
                    szErrMsg: "操作成功",
                    iUserId: iUserId,
                    iSeatIndex: iSeatIndex
                });

            }, TIME_OUT_REQSF_VALUE * 1000, pRoomObj, pUserObj.iUserId, pUserObj.iSeatIndex);
        }
    }

    console.log("OnReqAddJiFen ######## 6");
    await NotifyRoomMessage(pReqObj.iFromClub, pRoomObj.iRoomId, pReqObj.iUserId, 1);  // 房间消息来了

    var pDists = GetPlayerDistObjs(pRoomObj);
    SendMsgToAll(pRoomObj, "dists_warn_notify", pDists);
}

// 保存用户在房间中是否存在有上分消息 (iMode 0/1)
async function WriteClubRoomMsgFlag(iClubId, iRoomId, iFromUser) {
    var pAdminUsers = await dbLGQ.get_club_adminusers(iClubId);

    // 写入管理员消息
    for (var iIndex = 0; iIndex < pAdminUsers.length; ++iIndex) {
        var iAdminUser = pAdminUsers[iIndex];

        var pRes = await dbCC.query("update tb_clubrooms_msg set msgmode = 1 where clubid = $1 and roomid = $2 and userid = $3",
            [iClubId, iRoomId, iAdminUser]);
        if (pRes.rowCount == 1) continue;
        
        await dbCC.query("insert into tb_clubrooms_msg(clubid, roomid, userid, msgmode) values($1, $2, $3, 1)",
            [iClubId, iRoomId, iAdminUser]);
    }
    
    if (pAdminUsers.indexOf(iFromUser) == -1) {
        // 写入普通玩家消息
        var pRes = await dbCC.query("update tb_clubrooms_msg set msgmode = 1 where clubid = $1 and roomid = $2 and userid = $3",
            [iClubId, iRoomId, iFromUser]);
        if (pRes.rowCount == 0) {
            await dbCC.query("insert into tb_clubrooms_msg(clubid, roomid, userid, msgmode) values($1, $2, $3, 1)",
                [iClubId, iRoomId, iFromUser]);
        }
    }

    return pAdminUsers;
}

function ClearTempVars(pDestUser) {
    if (pDestUser == null) return;

    delete pDestUser.iReqAddJiFen;
    delete pDestUser.tmReqTime;
    delete pDestUser.iReqJiFen;
    delete pDestUser.iReqSeatIndex;

    if (pDestUser.pReqSeatTimePtr != null) {
        clearTimeout(pDestUser.pReqSeatTimePtr);
        delete pDestUser.pReqSeatTimePtr;
    }
}

// 管理员同意或拒绝玩家上分 (游戏服务器)
async function OnAddJiFenRep(pReqArgs) {
    var pRoomObj = RoomMgr.GetRoomObj(pReqArgs.iRoomId);
    if (pRoomObj == null) {
        SendMsg(pReqArgs.pSocket, "addjifenrep_result", {
            wErrCode: ErrorCodes.ERR_ROOMISNOTEXISTS,
            szErrMsg: "房间不存在"
        });
        return;
    }
    console.log("OnAddJiFenRep iRoomId:" + pRoomObj.iRoomId + ", iUserId:" + pReqArgs.iUserId);

    var pUserObj = RoomMgr.GetUserObj(pRoomObj, pReqArgs.iUserId);
    if (pUserObj == null) {
        SendMsg(pReqArgs.pSocket, "addjifenrep_result", {
            wErrCode: ErrorCodes.ERR_USERISNOTEXISTS,
            szErrMsg: "用户不存在"
        });
        return;
    }

    //pReqArgs.iMode = parseInt(pReqArgs.iMode);
    pReqArgs.iDestUser = parseInt(pReqArgs.iDestUser);
    var pRes = await dbCC.query("select * from tb_addjifenreq where uid = $1", [pReqArgs.iUid]);
    if (pRes.rows.length == 0) {
        SendMsg(pReqArgs.pSocket, "addjifenrep_result", {
            wErrCode: ErrorCodes.ERR_INVOKE_FALIED,
            szErrMsg: "申请已失效"
        });
        return;
    }

    var pReqObj = SysUtils.GetJsonObj(pRes.rows[0].infos);
    var pData = {
        iUid: pReqArgs.iUid,
        iFromClub: pReqObj.iFromClub,
        iRoomId: pReqArgs.iRoomId,
        iFromUser: parseInt(pReqArgs.iUserId),
        iDestUser: parseInt(pReqArgs.iDestUser),
        iJiFen: parseInt(pReqArgs.dairu),
        bAgree: pReqArgs.bAgree,
        pSocket: pReqArgs.pSocket
    };
    console.log("OnAddJiFenRep dairu:" + pReqArgs.dairu);
    //console.log(pData);

    var pRet = await OnProcessAddJiFenReq(pData);
    SendMsg(pReqArgs.pSocket, pRet);
}

// 管理员同意或拒绝玩家上分 (中心服务器)
async function OnProcessAddJiFenReq(pReqArgs) {
    var pRoomObj = RoomMgr.GetRoomObj(pReqArgs.iRoomId);
    if (pRoomObj == null) {
        console.log("OnProcessAddJiFenReq 房间不存在 1");
        return { ErrCode: ErrorCodes.ERR_ROOMISNOTEXISTS, szErrMsg: "房间不存在" };
    }
    console.log("OnProcessAddJiFenReq iRoomId:" + pRoomObj.iRoomId + ", iUserId:" + pReqArgs.iDestUser + ", iJiFen:" + pReqArgs.iJiFen);

    var pReqObj = await dbLGQ.get_jifenreq_by_uid(pReqArgs.iUid);
    if (pReqObj == null) {
        console.log("OnProcessAddJiFenReq 上分请求已失效 1");
        return { wErrCode: ErrorCodes.ERR_INVOKE_FALIED, szErrMsg: "上分请求已失效" };
    }

    var pUserMaps = await dbLGQ.get_users_baseinfo([pReqArgs.iDestUser, pReqArgs.iFromUser]);
    if ((pUserMaps[pReqArgs.iFromUser] == null) || (pUserMaps[pReqArgs.iDestUser] == null)) {
        SendMsgToUser(pReqArgs.iFromUser, "addjifenrep_result", {
            ErrCode: ErrorCodes.ERR_USERISNOTEXISTS,
            szErrMsg: "用户不存在"
        });
        return { wErrCode: ErrorCodes.ERR_USERISNOTEXISTS, szErrMsg: "用户不存在" };
    }

    var pURoomObj = RoomMgr.GetRoomObj(pReqObj.iRoomId);
    if (pURoomObj == null) {
        console.log("OnProcessAddJiFenReq 房间不存在 2");
        return { ErrCode: ErrorCodes.ERR_ROOMISNOTEXISTS, szErrMsg: "房间不存在" };
    }

    var pDestUser = RoomMgr.GetUserObj(pURoomObj, pReqArgs.iDestUser);
    if (pDestUser != null) RoomMgr.ClearJFReqTimerPtr(pDestUser);

    // 管理员拒绝上分请求
    if (!pReqArgs.bAgree) {
        console.log("OnProcessAddJiFenReq 管理员拒绝上分请求");
        await dbCC.query("delete from tb_addjifenreq where uid = $1", [pReqArgs.iUid]);

        await dbLGQ.add_shangfen_msgs(pURoomObj.iClubId, pURoomObj.szClubName, pURoomObj.iRoomId, pURoomObj.pRoomArgs.szName,
            pReqArgs.iFromUser, pUserMaps[pReqArgs.iFromUser].szAlias,
            pReqArgs.iDestUser, pUserMaps[pReqArgs.iDestUser].szAlias,
            pReqObj.iReqJiFen, 0, pReqObj.iFromClub);

        await NotifyRoomMessage(pReqObj.iFromClub, pURoomObj.iRoomId, pReqArgs.iDestUser, 2);  // 房间消息来了       

        var pDestUser = RoomMgr.GetUserObj(pURoomObj, pReqArgs.iDestUser);
        if (pDestUser != null) {
            var iMode = 1;
            var szCmd = "reqsdpep_notify";

            var pJiFenObj = RoomMgr.GetJiFenObj(pURoomObj, pReqArgs.iDestUser);
            if (pJiFenObj != null) {
                iMode = 2;
                szCmd = "addjifen_notify";
            }

            SendMsgToAll(pURoomObj, szCmd, {
                wErrCode: ErrorCodes.ERR_NOERROR,
                szErrMsg: "操作成功",
                bAgree: false,
                iUserId: pReqArgs.iDestUser,
                iMode: iMode,
                //pMsgObj: pMsgObj
            });
            if (pJiFenObj == null) pJiFenObj = { iJiFen: 0 };
            var iMinJiFen = pRoomObj.pRoomArgs.iBaseFen * 2 + pRoomObj.pGameObj.iNextMG;

            console.log("OnProcessAddJiFenReq iDestUser:" + pReqArgs.iDestUser + ", pJiFenObj:" + JSON.stringify(pJiFenObj));
            if (pJiFenObj.iJiFen < iMinJiFen) {
                OnSitup({ iRoomId: pRoomObj.iRoomId, iUserId: pReqArgs.iDestUser, pSocket: UserMgr.GetSocketObj(pReqArgs.iDestUser) });

                //pDestUser = RoomMgr.RemoveSeatUser(pURoomObj, pReqArgs.iDestUser);
                //RoomMgr.AddSeePlayer(pURoomObj, pDestUser);
            }
            ClearTempVars(pDestUser);
        }

        return {
            wErrCode: ErrorCodes.ERR_NOERROR,
            szErrMsg: "俱乐部的 " + pUserMaps[pReqArgs.iFromUser].szAlias + " 拒绝了 " + pUserMaps[pReqArgs.iDestUser].szAlias + " 的带入申请"
        };
    }

    // 管理员同意上分请求
    var iCostGolds = parseInt(pReqArgs.iJiFen);
    var bClubVIP = await IsClubVIP(pReqArgs.iDestUser, pReqArgs.iFromClub);
    if (bClubVIP) {
        var iGolds = await dbLGQ.get_club_golds(pReqArgs.iFromClub);
        iGolds = parseInt(iGolds);
        if (iGolds < iCostGolds) {
            console.log("OnProcessAddJiFenReq 俱乐部基金不够");
            SendMsgToUser(pReqArgs.iFromUser, "golds_noten_result", {
                ErrCode: ErrorCodes.ERR_NOTENOUGHGOLDS,
                szErrMsg: "俱乐部基金不够"
            });

            await dbCC.query("delete from tb_addjifenreq where uid = $1", [pReqArgs.iUid]);

            return { wErrCode: ErrorCodes.ERR_NOTENOUGHGOLDS, szErrMsg: "俱乐部基金不够" };
        }
        await dbLGQ.add_club_golds(pReqArgs.iFromClub, -iCostGolds);
    }
    else {
        if (pUserMaps[pReqArgs.iDestUser].iGolds < iCostGolds) {
            console.log("OnProcessAddJiFenReq 金币不够");
            SendMsgToUser(pReqArgs.iFromUser, "golds_noten_result", {
                ErrCode: ErrorCodes.ERR_NOTENOUGHGOLDS,
                szErrMsg: pUserMaps[pReqArgs.iDestUser].szAlias + "的金币不足"
            });

            // SendMsgToUser(pReqArgs.iDestUser, "golds_noten_result", {
            //     ErrCode: ErrorCodes.ERR_NOTENOUGHGOLDS,
            //     szErrMsg: "金币不够"
            // });
            await dbCC.query("delete from tb_addjifenreq where uid = $1", [pReqArgs.iUid]);
            return { wErrCode: ErrorCodes.ERR_NOTENOUGHGOLDS, szErrMsg: "金币不够" };
        }

        await dbLGQ.add_user_golds(pReqArgs.iDestUser, -iCostGolds);
        pUserMaps[pReqArgs.iDestUser].iGolds -= iCostGolds;

        SendMsg(pReqArgs.pSocket, "golds_change_result", {
            wErrCode: ErrorCodes.ERR_NOERROR,
            szErrMsg: "操作成功",
            iGolds: pUserMaps[pReqArgs.iDestUser].iGolds
        });
    }

    var iMode = 1;
    var iJiFenYQ = 0;
    var pFromClub = await dbLGQ.get_club_info_with_id(pReqObj.iFromClub);
    var pJiFenObj = RoomMgr.GetJiFenObj(pURoomObj, pReqArgs.iDestUser);

    if (pJiFenObj == null) {
        var pRes = await dbCC.query("select sname from tb_clubs where clubid = $1", [pReqObj.iFromClub]);
        if (pRes.rows.length == 0) {
            console.log("OnProcessAddJiFenReq 俱乐部不存在");
            return { wErrCode: ErrorCodes.ERR_CLUBISNOTEXISTS, szErrMsg: "俱乐部不存在" };
        }

        console.log("OnProcessAddJiFenReq pReqArgs.iJiFen:" + pReqArgs.iJiFen);
        pJiFenObj = RoomMgr.AddJiFenUser(pURoomObj, pReqObj, pReqArgs.iJiFen, pFromClub.sname,
            UserMgr.IsOnline(pReqArgs.iDestUser));
        
        var szSql = "insert into tb_userjifen_info(roomuuid, userid, clubid, jifendr, jifenkc, jifenyq, jifen) values($1, $2, $3, $4, $5, $6, $7)";
        await dbCC.query(szSql, [pURoomObj.szRoomUUID, pReqArgs.iDestUser, pJiFenObj.iClubId, pJiFenObj.iJiFenDR,
            pJiFenObj.iJiFenCDR, pJiFenObj.iJiFenYQ, pJiFenObj.iJiFen]);
    }
    else {
        var bAutoLZ = false;    // 玩家是否是自动留座
        var iMinJiFen = pRoomObj.pRoomArgs.iBaseFen * 2 + pRoomObj.pGameObj.iNextMG;
        if ((pJiFenObj.iJiFen < iMinJiFen) && (pDestUser != null)) {
            if (pDestUser.iState == RoomMgr.SeatState.SEAT_STATE_LIUZ) bAutoLZ = true;
        }

        iMode = 2;
        pJiFenObj.iJiFenDR += pReqArgs.iJiFen;     // 总带入
        pJiFenObj.iJiFenCDR += pReqObj.iAddJiFen;  // 当前带入

        var pDestUser = GetPlayerObj(pURoomObj, pReqArgs.iDestUser);
        if (pDestUser == null) {
            pJiFenObj.iJiFen += pReqObj.iAddJiFen;
        }
        else {
            iJiFenYQ = pReqObj.iAddJiFen;
            pJiFenObj.iJiFenYQ += pReqObj.iAddJiFen;
        }

        var szSql = "update tb_userjifen_info set jifendr = jifendr + $1, jifenkc = jifenkc + $2, \
            jifenyq = jifenyq + $3, jifen = jifen + $4 \
            where roomuuid = $5 and userid = $6";
        await dbCC.query(szSql, [pReqArgs.iJiFen, pReqObj.iAddJiFen, iJiFenYQ, pReqObj.iAddJiFen - iJiFenYQ,
            pURoomObj.szRoomUUID, pReqArgs.iDestUser]);
    }

    await dbCC.query("delete from tb_addjifenreq where uid = $1", [pReqArgs.iUid]);

    await dbLGQ.add_shangfen_msgs(pURoomObj.iClubId, pFromClub.sname, pURoomObj.iRoomId, pURoomObj.pRoomArgs.szName,
        pReqArgs.iFromUser, pUserMaps[pReqArgs.iFromUser].szAlias,
        pReqArgs.iDestUser, pUserMaps[pReqArgs.iDestUser].szAlias,
        pJiFenObj.iJiFenDR, 1, pReqObj.iFromClub);

    await NotifyRoomMessage(pReqObj.iFromClub, pURoomObj.iRoomId, pReqArgs.iDestUser, 3);  // 房间消息来了

    var pRes = await dbCC.query("select extdata from tb_users where userid = $1", [pReqArgs.iDestUser]);
    var pExtObj = dbLGQ.get_user_extdata(pRes.rows[0]);
    pExtObj.iTotalDR += pJiFenObj.iJiFenDR;
    await dbCC.query("update tb_users set extdata = $1 where userid = $2", [JSON.stringify(pExtObj), pReqArgs.iDestUser]);

    pDestUser = RoomMgr.GetUserObj(pURoomObj, pReqArgs.iDestUser);
    if (pDestUser != null) {
        pDestUser.pExtObj.iTotalDR += pJiFenObj.iJiFenDR;

        ClearTempVars(pDestUser);

        var iJiFen = pJiFenObj.iJiFen;
        var pPlayerObj = GetPlayerObj(pURoomObj, pReqArgs.iDestUser);
        if (pPlayerObj != null) {
            if (pPlayerObj.iOrgJiFen != null) iJiFen = pPlayerObj.iOrgJiFen;
        }

        if (pDestUser.iState == RoomMgr.SeatState.SEAT_STATE_REQSD) {
            iMode = 1;
            pDestUser.iState = RoomMgr.SeatState.SEAT_STATE_WAIT;
        }
        else if (pDestUser.iState == RoomMgr.SeatState.SEAT_STATE_LIUZ) {
            iMode = 1;
            pDestUser.iState = RoomMgr.SeatState.SEAT_STATE_WAIT;
            //if (bAutoLZ) pDestUser.iState = RoomMgr.SeatState.SEAT_STATE_WAIT;
        }
        else if (pDestUser.iState == RoomMgr.SeatState.SEAT_STATE_FSW) {
            iMode = 1;
            pDestUser.iState = RoomMgr.SeatState.SEAT_STATE_WAIT;
        }
        if (iMode == 1) pDestUser.iState = RoomMgr.SeatState.SEAT_STATE_WAIT;

        pDestUser.iGolds = pUserMaps[pReqArgs.iDestUser].iGolds;
        var pItem = {
            iSeatIndex: pDestUser.iSeatIndex,
            iUserId: pDestUser.iUserId,
            iGolds: pDestUser.iGolds,
            iState: pDestUser.iState,
            bOnline: pDestUser.bOnline,
            iJiFenDR: pJiFenObj.iJiFenDR,   // 总带入积分
            iJiFenCDR: pJiFenObj.iJiFenCDR,   // 当前带入
            iJiFenYQ: pJiFenObj.iJiFenYQ,   // 预取积分
            iJiFen: iJiFen        // 用户身上的积分
        };

        var szCmd = "reqsdpep_result";
        if (iMode == 2) szCmd = "addjifen_notify";

        if (pDestUser.iState == RoomMgr.SeatState.SEAT_STATE_WAIT) {
            RoomMgr.ClearJFReqTimerPtr(pDestUser);
            RoomMgr.ClearLZReqTimerPtr(pDestUser);

            delete pDestUser.tmWSFTime;
            if (pDestUser.pWSFTimePtr != null) {
                clearTimeout(pDestUser.pWSFTimePtr);
                delete pDestUser.pWSFTimePtr;
            }
        }

        SendMsgToUser(pDestUser.iUserId, szCmd, {
            wErrCode: ErrorCodes.ERR_NOERROR,
            szErrMsg: "操作成功",
            bAgree: true,
            iMode: iMode,
            iUserId: pDestUser.iUserId,
            iState: pDestUser.iState,
            iGolds: pDestUser.iGolds,
            iJiFenDR: pJiFenObj.iJiFenDR,     // 总带入积分
            iJiFenCDR: pJiFenObj.iJiFenCDR,   // 当前带入
            iJiFenYQ: pJiFenObj.iJiFenYQ,
            iJiFen: pJiFenObj.iJiFen,
            //pMsgObj: pMsgObj
        });

        if (iMode == 1) {
            SendMsgToAll(pURoomObj, "reqsdpep_notify", {
                wErrCode: ErrorCodes.ERR_NOERROR,
                szErrMsg: "操作成功",
                bAgree: true,
                iUserId: pDestUser.iUserId,
                pUserObj: pItem,
                iMode: iMode
            });

        }

        CheckAutoStartGame(pURoomObj);
    }

    return {
        wErrCode: ErrorCodes.ERR_NOERROR,
        szErrMsg: "俱乐部的 " + pUserMaps[pReqArgs.iFromUser].szAlias + " 同意了 " + pUserMaps[pReqArgs.iDestUser].szAlias + " 的带入申请"
    };
}
exports.OnProcessAddJiFenReq = OnProcessAddJiFenReq;

// 禁言
async function OnJingYan(pReqArgs) {
    var pRoomObj = RoomMgr.GetRoomObj(pReqArgs.iRoomId);
    if (pRoomObj == null) {
        console.log("OnJingYan 房间不存在");
        SendMsg(pReqArgs.pSocket, "jingyan_result", {
            wErrCode: ErrorCodes.ERR_ROOMISNOTEXISTS,
            szErrMsg: "房间不存在"
        });
    }

    var pFromUser = RoomMgr.GetUserObj(pRoomObj, pReqArgs.iUserId);
    if (pFromUser == null) {
        console.log("OnJingYan 房间不存在");
        return;
    }

    pReqArgs.iUserId = parseInt(pReqArgs.iUserId);
    var pAdminUserIds = await dbLGQ.get_club_adminusers(pRoomObj.iClubId);
    if (pAdminUserIds.indexOf(pReqArgs.iUserId) == -1) {
        console.log("OnJingYan 房间不存在");
        SendMsg(pReqArgs.pSocket, "jingyan_result", {
            wErrCode: ErrorCodes.ERR_ROOMISNOTEXISTS,
            szErrMsg: "只有管理员才能禁言"
        });
        return;
    }

    pReqArgs.iDestUser = parseInt(pReqArgs.iDestUser);
    pReqArgs.iMode = parseInt(pReqArgs.iMode);

    var iPos = pRoomObj.pJingYanUsers.indexOf(pReqArgs.iDestUser);
    if (pReqArgs.iMode == 1) {
        if (iPos == -1) {
            pRoomObj.pJingYanUsers.push(pReqArgs.iDestUser);
        }
    }
    else if (iPos >= 0) {
        pRoomObj.pJingYanUsers.splice(iPos, 1);
    }

    SendMsgToAll(pRoomObj, "jingyan_result", {
        wErrCode: ErrorCodes.ERR_NOERROR,
        szErrMsg: "操作成功",
        iMode: pReqArgs.iMode,
        iOptUser: pReqArgs.iFromUser,
        iDestUser: pReqArgs.iDestUser
    });
}

// 获取奖池信息
async function OnGetJiangChiList(pReqArgs) {
    var pRoomObj = RoomMgr.GetRoomObj(pReqArgs.iRoomId);
    if (pRoomObj == null) {
        console.log("OnJingYan 房间不存在");
        SendMsg(pReqArgs.pSocket, "jclogs_result", {
            wErrCode: ErrorCodes.ERR_ROOMISNOTEXISTS,
            szErrMsg: "房间不存在"
        });
        return;
    }

    await RoomMgr.GetJiangChiInfo(pReqArgs.pSocket, pRoomObj);
    // SendMsg(pReqArgs.pSocket, "jclogs_result", {
    //     wErrCode: ErrorCodes.ERR_NOERROR,
    //     szErrMsg: "操作成功",
    //     pRetObj: pRetObj
    // });
}

// 获取禁言玩家
async function OnGetJYUsers(pReqArgs) {
    var pRoomObj = RoomMgr.GetRoomObj(pReqArgs.iRoomId);
    if (pRoomObj == null) {
        console.log("OnGetJYUsers 房间不存在");
        SendMsg(pReqArgs.pSocket, "getjyusers_result", {
            wErrCode: ErrorCodes.ERR_ROOMISNOTEXISTS,
            szErrMsg: "房间不存在"
        });
        return;
    }

    var pRetObj = {
        pSeePlayers: [],
        pSeatPlayers: []
    };

    for (var iIndex = 0; iIndex < pRoomObj.pSeePlayers.length; ++iIndex) {
        var pUserObj = pRoomObj.pSeePlayers[iIndex];
        var bJinYan = pRoomObj.pJingYanUsers.indexOf(pUserObj.iUserId) >= 0;

        var pItem = {
            iUserId: pUserObj.iUserId,
            szAlias: pUserObj.szAlias,
            bJinYan: bJinYan
        };
        pRetObj.pSeePlayers.push(pItem);
    }

    for (var iIndex = 0; iIndex < pRoomObj.pPlayers.length; ++iIndex) {
        var pUserObj = pRoomObj.pPlayers[iIndex];
        if (pUserObj.iUserId == 0) continue;
        var bJinYan = pRoomObj.pJingYanUsers.indexOf(pUserObj.iUserId) >= 0;

        var pItem = {
            iUserId: pUserObj.iUserId,
            szAlias: pUserObj.szAlias,
            bJinYan: bJinYan
        };
        pRetObj.pSeatPlayers.push(pItem);
    }

    SendMsg(pReqArgs.pSocket, "getjyusers_result", {
        wErrCode: ErrorCodes.ERR_NOERROR,
        szErrMsg: "操作成功",
        pRetObj: pRetObj
    });
}

// 通知房间上分消息
async function NotifyRoomMessage(iFromClub, iRoomId, iDestUser, iCmd) {
    var pHttpReqData = {
        iCmd: iCmd,
        iRoomId: iRoomId,
        iUserId: iDestUser,
        iClubId: iFromClub,                         // 用户应该在哪个俱乐部上分
        pSendUsers: []
    };

    var pRoomObj = RoomMgr.GetRoomObj(iRoomId);
    var pUserIds = await WriteClubRoomMsgFlag(iFromClub, iRoomId, iDestUser);  // await dbLGQ.get_club_adminusers(pReqObj.iFromClub);
    for (var iIndex = 0; iIndex < pUserIds.length; ++iIndex) {
        var iUserId = pUserIds[iIndex];

        SendMsgToUser(iUserId, "addjifen_lailao_notify", {
            wErrCode: ErrorCodes.ERR_NOERROR,
            szErrMsg: "操作成功",

            iCmd: iCmd,  // 1:用户申请上分, 2:管理员拒绝上分, 3:管理员同意上分
            iFromClub: iFromClub,
            iRoomId: iRoomId,
            iFromUser: iDestUser,
        });

        pHttpReqData.pSendUsers.push(iUserId);
    }

    if (pUserIds.indexOf(iDestUser) == -1) {
        SendMsgToUser(iDestUser, "addjifen_lailao_notify", {
            wErrCode: ErrorCodes.ERR_NOERROR,
            szErrMsg: "操作成功",

            iCmd: iCmd,  // 1:用户申请上分, 2:管理员拒绝上分, 3:管理员同意上分
            iFromClub: iFromClub,
            iRoomId: iRoomId,
            iFromUser: iDestUser,
        });
    }
    HTTP.HTTPJsonGet("/AddJiFen", pHttpReqData, function (pRetObj) {});  // 通知中心服务器
}


async function OnKanPai(pReqArgs) {
    var pRoomObj = RoomMgr.GetRoomObj(pReqArgs.iRoomId);
    if (pRoomObj == null) {
        console.log("OnKanPai 房间不存在");
        SendMsg(pReqArgs.pSocket, "kanpai_result", {
            wErrCode: ErrorCodes.ERR_ROOMISNOTEXISTS,
            szErrMsg: "房间不存在"
        });
        return;
    }

    if (pRoomObj.pPaiMaps == null) return;

    var iIndex = parseInt(pReqArgs.iIndex);
    var pPais = pRoomObj.pPaiMaps[pReqArgs.iUserId];
    SendMsgToAll(pRoomObj, "kanpai_notify", {
        iUserId: pReqArgs.iUserId,
        iPai: pPais[iIndex],
        iIndex: pReqArgs.iIndex
    });

    if (pRoomObj.pTimerPtr != null) {
        clearTimeout(pRoomObj.pTimerPtr);
        var pParams = {
            iRoomId: pRoomObj.iRoomId,
            iUserId: pRoomObj.iCreator,
            pSocket: null
        };
        pRoomObj.pTimerPtr = setTimeout(OnStart, 2 * 1000, pParams);
        console.log("OnKanPai yanshi");
    }

    console.log("OnKanPai iUserId:" + pReqArgs.iUserId + ", iPai:" + pPais[iIndex] +
        ", iIndex:" + pReqArgs.iIndex);
}

// 获取指定玩家的语音数据
async function OnGetVoice(pReqArgs) {
    var pRoomObj = RoomMgr.GetRoomObj(pReqArgs.iRoomId);
    if (pRoomObj == null) {
        console.log("OnGetVoice 房间不存在");
        SendMsg(pReqArgs.pSocket, "getvoice_result", {
            wErrCode: ErrorCodes.ERR_ROOMISNOTEXISTS,
            szErrMsg: "房间不存在"
        });
        return;
    }

    var pUserObj = RoomMgr.GetUserObj(pRoomObj, pReqArgs.iDestUser);
    if (pUserObj == null) return;
    if (pUserObj.iSeatIndex == -1) iMode = 0;

    var iMode = 0;
    if (pUserObj.pVoice != null) iMode = 1;

    SendMsg(pReqArgs.pSocket, "getvoice_result", {
        wErrCode: ErrorCodes.ERR_NOERROR,
        szErrMsg: "操作成功",
        iMode: iMode
    });
}

// 二次登录
function OnOtherLoginIn(pReqArgs) {
    SendMsg(pReqArgs.pSocket, "other_login_result", {
        wErrCode: ErrorCodes.ERR_ISOTHERLOGININ,
        szErrMsg: "你的号在其它位置登录了"
    });
}
exports.OnOtherLoginIn = OnOtherLoginIn;

// ==========================================================================
// 获取 网络消息->事件 映射
function GetWSEventMaps() {
    var WSEventMaps = {
        "enter": OnEnterRoom,             // 进房间
        "leave": OnLeaveRoom,             // 离开房间
        
        "reqsd": OnReqAddJiFen,           // 申请上分
        "addjifen": OnReqAddJiFen,        // 申请上分
        "getrsdus": OnGetReqSDUsers,      // 用户获取房间消息(所有玩家)，上分申请(管理员)
        "addjifenrep": OnAddJiFenRep,     // 管理员同意或拒绝上分

        "sitdown": OnSitdown,             // 玩家坐下
        "situp": OnSitup,                 // 离开座位(旁观)
        "ready": OnReady,                 // 准备
        "start": OnStart,                 // 房主点开始
        "yazhu": OnStake,                 // 押注
        "lose": OnLose,                   // 丢
        "rest": OnRest,                   // 休
        "split": OnSplit,                 // 分牌
        "jiesan": OnJieSan,               // 解散房间
        "getdist": OnGetPlayersDists,     // 获取用户间距离
        "getpjlogs": OnGetPaiJuLogs,      // 查询牌局记录 iRoomId, iPlayTimes, { 返回: 牌总局数, 指定局数结算信息 }
        "liuzuo": OnLiuZuo,               // 留座
        "huizuo": OnHuiZuo,               // 回座
        "yanshi": OnYanShi,               // 延时
        "showpai": OnDisplayPai,          // 设置牌局后指定牌是否要显示出来
        "showpais": OnShowPai,            // 秀牌
        "jingyan": OnJingYan,             // 禁言
        "roomplayers": OnGetRoomPlayers,  // 获取房间中冲了分的用户
        "killuser": OnKillUser,           // 管理员踢人
        "notify": OnCustomNotify,         // 自定义通知
        "playvoice": OnPlayVoice,         // 语音回放
        "jclogs": OnGetJiangChiList,      // 获取奖池信息
        "getjyusers": OnGetJYUsers,       // 获取禁言玩家
        "setjwd": OnSetLonLat,            // 设置经纬度
        "kanpai": OnKanPai,               // 显示指定牌
        "getvoice": OnGetVoice,           // 获取指定玩家是否存在语音数据
    };
    return WSEventMaps;
}
exports.GetWSEventMaps = GetWSEventMaps;

// 一局结束
async function OnGameOver(pRoomObj) {
    pRoomObj.bWaitJS = true;

    await DB_SaveLogs(pRoomObj);        // 保存日志信息
    await UpdateAllPlayerJiFen(pRoomObj, true);

    for (var iIndex = 0; iIndex < pRoomObj.pPlayers.length; ++iIndex) {
        var pUserObj = pRoomObj.pPlayers[iIndex];
        var pJiFenObj = RoomMgr.GetJiFenObj(pRoomObj, pUserObj.iUserId);
        if (pJiFenObj == null) continue;

        pJiFenObj.iJiFenSY = pJiFenObj.iJiFen - pJiFenObj.iJiFenCDR;

        // console.log("OnGameOver iPlayTimes:" + pRoomObj.iPlayTimes +
        //     ", iUserId:" + pUserObj.iUserId +
        //     ", iJiFenDR:" + pJiFenObj.iJiFenDR +
        //     ", iJiFenCDR:" + pJiFenObj.iJiFenCDR +
        //     ", iJiFenSY:" + pJiFenObj.iJiFenSY);
    }

    RoomMgr.ClearStakeObjs(pRoomObj);
    await CheckUserLuoZuo(pRoomObj);
    await NotifyToAllPaiJuLogs(pRoomObj, -1);

    if (pRoomObj.pVideo != null) {
        await dbCC.query("insert into tb_gamevideo_logs(roomid, roomuuid, playtimes, video) values($1, $2, $3, $4)",
            [pRoomObj.iRoomId, pRoomObj.szRoomUUID, pRoomObj.iPlayTimes, JSON.stringify(pRoomObj.pVideo)]);
        delete pRoomObj.pVideo;
    }

    if (pRoomObj.pNetMsgs != null) delete pRoomObj.pNetMsgs;
}