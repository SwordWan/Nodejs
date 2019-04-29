var crypto = require("../utils/crypto");
var SysUtils = require("../utils/SysUtils")
var AppConfigs = require("../configs_win");
var http = require("../utils/http");

var ErrorUtils = require("../utils/ErrorCodes");
var ErrorCodes = ErrorUtils.ErrorCodes;

var CenterServer = AppConfigs.center_server();

function HTTPGet(szCmd, pReqArgs, callback) {
    if (szCmd != "/RefreshGServer") {
        console.log("HTTPGet szCmd:" + szCmd + ", IP:" + CenterServer.IP + ", PORT:" + CenterServer.HTTPPORT);
    }
    
    http.get(CenterServer.IP, CenterServer.HTTPPORT, szCmd, pReqArgs, function (bRet, pRetObj) {
        if (!bRet) {
            callback({wErrCode: ErrorCodes.ERR_GAMESERVERNOTRUN, szErrMsg: "数据服务器未启动"});
        }
        else {
            callback(pRetObj);
        }
    });
}
exports.HTTPGet = HTTPGet;

function HTTPJsonGet(szCmd, pJsonObj, callback) {
    if (szCmd != "/RefreshGServer") {
        console.log("HTTPJsonGet szCmd:" + szCmd + ", IP:" + CenterServer.IP + ", PORT:" + CenterServer.HTTPPORT);
    }
    
    http.Json(CenterServer.IP, CenterServer.HTTPPORT, szCmd, pJsonObj, function (bRet, pRetObj) {
        if (!bRet) {
            callback({wErrCode: ErrorCodes.ERR_GAMESERVERNOTRUN, szErrMsg: "数据服务器未启动"});
        }
        else {
            callback(pRetObj);
        }
    }); 
}
exports.HTTPJsonGet = HTTPJsonGet;



// 执行SQL
function HTTPExeSQL(szMode, szSql, callback) {
    var pReqArgs = {
        szMode: szMode,
        szSql: szSql
    }

    if ((pReqArgs.szMode != "GET") && (pReqArgs.szMode != "SET")) {
        callback({wErrCode: ErrorCodes.ERR_INVALIDARGS, szErrMsg: "参数错误"});
        return;
    }

    HTTPGet("/ExeSQL", pReqArgs, callback);
}
exports.HTTPExeSQL = HTTPExeSQL;



// 获取用户基本信息
function HTTPGetUserInfo(iUserId, callback) {
    var pReqArgs = {
        iUserId: iUserId
    }

    HTTPGet("/GetUserInfo", pReqArgs, callback);
}
exports.HTTPGetUserInfo = HTTPGetUserInfo;

// 用户设置带入积分
function HTTPSetUserJiFenDR(iRoomId, iUserId, iJiFen, callback) {
    var pReqArgs = {
        iRoomId: iRoomId,
        iUserId: iUserId,
        iJiFen: iJiFen,
    }

    HTTPGet("/SetUserJiFenDR", pReqArgs, callback);
}
exports.HTTPSetUserJiFenDR = HTTPSetUserJiFenDR;