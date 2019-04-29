var AppGlobals = null;

exports.Init = function (pAppGlobals) {
    AppGlobals = pAppGlobals;
}

exports.Add = function (iUserId, pSocket) {
    AppGlobals.pClientSockets[iUserId] = pSocket;
    AppGlobals.iOnlineNum += 1;

    pSocket.iUserId = iUserId;

    console.log("usermgr add user:" + iUserId);
}

exports.Delete = function (iUserId) {
    if (AppGlobals.pClientSockets[iUserId] != null) {
        AppGlobals.iOnlineNum -= 1;
        delete AppGlobals.pClientSockets[iUserId];

        console.log("usermgr delete user:" + iUserId);
    }
};

exports.GetSocketObj = function (iUserId) {
    return AppGlobals.pClientSockets[iUserId];
};

exports.GetIpAddress = function (iUserId) {
    let Result = "";
    let pSocket = AppGlobals.pClientSockets[iUserId];
    if (pSocket != null) {
        let pHandShake = pSocket.handshake;
        
        Result = pHandShake.address;
        if (Result.indexOf("::ffff:") != -1) {
            Result = szHostIp.substr(7);
        }
    }

    return Result;
}

exports.IsOnline = function (iUserId) {
    return (AppGlobals.pClientSockets[iUserId] != null);
};

exports.GetOnlineCount = function () {
    return AppGlobals.iOnlineNum;
}

exports.SendMsg = function (iUserId, szEvent, pMsg) {
    let pSocket = AppGlobals.pClientSockets[iUserId];
    if (pSocket != null) {
        pSocket.emit(szEvent, pMsg);
        //console.log("usermgr.SendMsg iUserId:" + iUserId + ", szEvent:" + szEvent);
    }
};

exports.SendErrorMsg = function (iUserId, wErrCode, szErrMsg) {
    let pSocket = AppGlobals.pClientSockets[iUserId];
    if (pSocket != null) {
        pSocket.emit("error_message", {
            wErrCode: wErrCode,
            szErrMsg: szErrMsg
        });
    }
}