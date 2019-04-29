var AppConfigs = require("../configs_win");
var SysUtils = require("../utils/SysUtils");
var dbCC = require('../utils/pgsqlCC');

var ErrorUtils = require("../utils/ErrorCodes");
var ErrorCodes = ErrorUtils.ErrorCodes;

dbCC.init(AppConfigs.database());

var userMgr = null;
function Init(pUserMgr) {
    userMgr = pUserMgr;     // 用户管理器
}
exports.Init = Init;

function SendMsgToUser(iUserId, szEvent, pJsonObj) {
    if (userMgr == null) return;
    userMgr.SendMsg(iUserId, szEvent, pJsonObj);
}





// 注册游戏服务器与中心服务器socket消息事件
function RegisterGSEventHandler(pSocket, sEvent) {
    var pWSEventMaps = GetWSEventMaps();    // 事件映射
    for (var sEvent in pWSEventMaps) {
        (function (pSocket, szEvent) {
            pSocket.on(szEvent, function (data, pfn) {
                //data = SysUtils.GetJsonObj(data);

                console.log("事件名:" + szEvent);
                console.log(data);

                if (data == null) data = {};
                
                data.pSocket = pSocket;
                pWSEventMaps[szEvent](data, pfn);
            });
        })(pSocket, sEvent);
    }
}
exports.RegisterGSEventHandler = RegisterGSEventHandler;

function GetWSEventMaps() {
    return {
        "GSServerRegister": OnGSServerRegister,     // 注册游戏服务器
        "AddJiFenRequest": OnAddJiFenRequest,       // 上分请求
    };
}

// 注册游戏服务器
function OnGSServerRegister(pReqArgs, pFuncRep) {
    var pRoomIds = [];

    pFuncRep(pRoomIds); // 将游戏服务器对应的房间ID回发给游戏服务器
}

// 上分请求
function OnAddJiFenRequest(pReqArgs, pFuncRep) {
    var pRes = await dbCC.query("select * from tb_rooms where roomid = $1", [pReqArgs.iRoomId]);
    if (pRes.rows.length == 0) {
        pFuncRep({
            wErrCode: ErrorCodes.ERR_ROOMISNOTEXISTS,
            szErrMsg: "房间不存在或已被删除"
        });
        return;
    }

    pReqArgs.wErrCode = ErrorCodes.ERR_NOERROR;
    pReqArgs.szErrMsg = "操作成功";

    pRes = await dbCC.query("select userid from tb_joinclubs where (clubid = $1) and (clublevel = 0 or clublevel = 1)", [pReqArgs.iClubId]);
    for (var iIndex = 0; iIndex < pRes.rows.length; ++iIndex) {
        var iUserId = pRes.rows[iIndex];
        var pReqs = await DB_GetAddJiFenRequests(iUserId, iRoomId);
        if (pReqs.length == 0) continue;

        SendMsgToUser(iUserId, "getaddjfusers_result", {
            wErrCode: ErrorCodes.ERR_NOERROR,
            szErrMsg: "操作成功",
            pRetObjs: pReqs
        });
    }

    pFuncRep({
        wErrCode: ErrorCodes.ERR_NOERROR,
        szErrMsg: "操作成功"
    }); // 将游戏服务器对应的房间ID回发给游戏服务器
}








// ========================================================================================
async function DB_GetAddJiFenRequests(iUserId, iRoomId) {
    var Result = [];
    var pClubIds = []; // 用户是哪些俱乐部的管理
    
    var pRes = await dbCC.query("select clubid from tb_joinclubs where userid = $1 and (clublevel = 0 or clublevel = 1)", [iUserId]);
    for (var iIndex = 0; iIndex < pRes.rows.length; ++iIndex) {
        var pRow = pRes.rows[iIndex];
        pClubIds.push(pRow.clubid);
    }

    // 获取用户管理下的俱乐部玩家申请上分的消息
    if (pClubIds.length == 0) {
        callback(Result);
        return;
    }

    var szWhere = "(";
    for (var iIndex = 0; iIndex < pClubIds.length; ++iIndex) {
        if (szWhere.length > 1) {
            szWhere = szWhere + "," + pClubIds[iIndex];
        }
        else {
            szWhere = szWhere + pClubIds[iIndex];
        }
    }
    szWhere = szWhere + ")";

    var szSql = "select a.*, b.alias from tb_addjifenreq a, tb_users b where " +
        " (a.userid = b.userid) and ((a.clubid in " + szWhere + ") or (userclub in " + szWhere + "))";
    pRes = await dbCC.query(szSql, null);
    
    for (var iIndex = 0; iIndex < pRes.rows.length; ++iIndex) {
        var pRow = pRes.rows[iIndex];
        var pItem = SysUtils.GetJsonObj(pRow.infos);

        pItem.iUid = pRow.uid;  // 申请唯一ID
        pItem.szReqUser = crypto.fromBase64(pItem.szReqUser);
        if (iRoomId == 0) {
            Result.push(pItem);
        }
        else if (pItem.iRoomId == iRoomId) {
            Result.push(pItem);
        }
    }

    return Result;
}