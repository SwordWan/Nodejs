var pGameMgr = require("./GameCXER"); // 游戏文件
var BigInt = require("big-integer");
var express = require('express');
var AppConfigs = require("../configs_win");
var userMgr = require("./usermgr");
var roomMgr = require("./roommgr");
var http = require("../utils/http");
var SysUtils = require("../utils/SysUtils");
var HTTPC = require("./HttpUtils");
var DB = require("../Utils/db");
var dbCC = require("../utils/pgsqlCC");
var dbLGQ = require("../utils/dbLGQ");
var CmdIdsLib = require("../Utils/cmdids");
var CmdIds = CmdIdsLib.CmdIds;

var ErrorUtils = require("../utils/ErrorCodes");
var ErrorCodes = ErrorUtils.ErrorCodes;

var _DEBUG_ = true;
if (_DEBUG_) {
    process.argv[2] = 9600;
    process.argv[3] = 9601;
    process.argv[4] = 9610;
}

// 全局变量定义
var g_pGServerInfo = AppConfigs.game_server();
var g_pAppGlobals = {
    ID: process.argv[2],    //g_pGServerInfo.ID,  // 服务器ID
    NAME: g_pGServerInfo.NAME,
    IP: g_pGServerInfo.IP,
    PORT: process.argv[2],  //g_pGServerInfo.PORT,
    HTTPPORT: process.argv[3], //g_pGServerInfo.HTTPPORT,
    GSPORT: process.argv[4],

    bSuspend: false,    // 是否暂停
    iOnlineNum: 0,      // 当前在线用户数
    pClientSockets: {}, // 进入游戏的用户  iUserId -> pSocket

    pUserMaps: {},      // iUserId -> pRoomObj
    pRoomMaps: {},      // iRoomId -> pRoomObj
    
    pUserMgr: userMgr,  // 用户管理器 (usermgr.js)
    pRoomMgr: roomMgr,  // 房间管理器 (roommgr.js)
    
    pGameMgr: pGameMgr  // 游戏文件
};
console.log("game.http ip:" + g_pGServerInfo.IP + ", port:" + process.argv[3] + ", game.websocket port:" + process.argv[2]);

// 主函数
function MainEntry() {
    if (g_pGServerInfo != null) {
        dbLGQ.Init(dbCC);
        userMgr.Init(g_pAppGlobals);
        roomMgr.Init(g_pAppGlobals, dbCC);
        pGameMgr.Init(g_pAppGlobals, dbCC, dbLGQ);

        WebSocketService(g_pAppGlobals.PORT);
    }
    else {
        console.log("游戏服务器配置文件不存在");
    }
}

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

        pSocket.emit(szCommand,
            {
                wErrCode: ErrorCodes.ERR_USERISNOTEXISTS,
                szErrMsg: "用户不存在"
            });
        
        Result = false;
    }

    return Result;
}

function WebSocketService(wPort) {
    WebSocket = require("socket.io")(wPort);

    WebSocket.sockets.on("connection", function (socket) {
        var pWSEventMaps = pGameMgr.GetWSEventMaps();    // 事件映射

        for (var sEvent in pWSEventMaps) {
            (function (pSocket, szEvent) {
                pSocket.on(szEvent, async function (data) {
                    data = SysUtils.GetJsonObj(data);

                    console.log("事件名:" + szEvent);
                    if (szEvent != "notify") console.log(data);

                    if (data != null) {
                        if (pSocket.iUserId != null) {
                            data.iUserId = pSocket.iUserId;
                            userMgr.Add(data.iUserId, pSocket);
                        }

                        data.pSocket = pSocket;

                        //try {
                            await pWSEventMaps[szEvent](data);
                        //}
                        //catch(err) {
                        //    console.log("============ try catch EVENT:" + szEvent + " =============");
                        //    console.log(err.message);
                        //}
                    }
                    else {
                        pSocket.emit(szEvent + "_result", {
                            wErrCode: ErrorCodes.ERR_INVALIDARGS,
                            szErrMsg: "无效参数"
                        });
                    }
                });
            })(socket, sEvent);
        }

        socket.on("loginin", function(data) {
            var pReqArgs = SysUtils.GetJsonObj(data);
            if (pReqArgs == null) return;
            if (pReqArgs.iUserId == null) return;

            // if (socket.iUserId == null) {
            //     userMgr.Add(pReqArgs.iUserId, socket);
            // }

            DB.get_user_info(pReqArgs.iUserId, function(pUserInfo) {
                if (pUserInfo == null) {
                    socket.emit("loginin_result", {
                        wErrCode: ErrorCodes.ERR_ACCOUNTISNOTEXISTS,
                        szErrMsg: "账号不存在"
                    });
                    return;
                }

                socket.emit("loginin_result", {
                    wErrCode: ErrorCodes.ERR_NOERROR,
                    szErrMsg: "操作成功",
                    iRoomId: pUserInfo.roomid
                });
            });
        });

        socket.on("getusermsgs", function(data) {
            var pReqArgs = CheckReqArgs(socket, "getusermsgs", data);
            if (pReqArgs == null) return;
            if (!CheckSocketUser(socket, "getusermsgs")) return;

            var szSql = "select * from tb_roommessage where roomid = $1 and userid = $2 order by ctime desc";
            DB.QuerySQL(szSql, [pReqArgs.iRoomId, socket.iUserId], function(pRows) {
                var pRetObj = {
                    wErrCode: ErrorCodes.ERR_NOERROR,
                    szErrMsg: "操作成功",
                    pMsgs: []
                };
                for (var iIndex = 0; iIndex < pRows.length; ++iIndex) {
                    var pRow = pRows[iIndex];
                    var pItem = {
                        szMessage: pRow.msgs,
                        tmTime: pRow.ctime
                    };
                    pRetObj.pMsgs.push(pItem);
                }
                socket.emit("getusermsgs_result", pRetObj);
            });
        });

        socket.on("error", function(data) {
        });
        
        socket.on("disconnect", function(data) {
            var iUserId = socket.iUserId;
            if (typeof (iUserId) != "undefined") {
                console.log("disconnect socket.id:" + socket.id + ", iUserId:" + iUserId);

                var pSocket = userMgr.GetSocketObj(iUserId);
                if (pSocket != null) {
                    if (pSocket.id == socket.id) {
                        pGameMgr.OnDisconnect({iUserId: iUserId});
                        userMgr.Delete(socket.iUserId);
                        delete socket.iUserId;
                    }
                }
                else {
                    pGameMgr.OnDisconnect({iUserId: iUserId});
                    userMgr.Delete(iUserId);
                    delete socket.iUserId;
                }
            }
        });

        socket.on("game_ping", function(data) {
            socket.emit('game_pong');
        });
    });

    console.log(g_pAppGlobals.NAME + " 启动成功, 端口：" + g_pAppGlobals.PORT);
}


// ================================== http 服务 ==================================
var app = express();

// 获取当前游戏服务器加载的房间数
function GetGServerRoomCount() {
    var Result = 0;

    for (var sKey in g_pAppGlobals.pRoomMaps) {
        if (g_pAppGlobals.pRoomMaps[sKey] != null) {
            ++Result;
        }
    }

    return Result;
}

function HTTP_SERVER_START() {
    var pHttpServer = app.listen(g_pAppGlobals.HTTPPORT);

    // 注册游戏服务器
    var pfnRegGServer = function(pfnCallback) {
        var pRoomIds = [];
        for (var sKey in g_pAppGlobals.pRoomMaps) {
            var iRoomId = parseInt(sKey);
            pRoomIds.push(iRoomId);
        }
        
        var pReqArgs = {
            ID: g_pAppGlobals.ID,
            NAME: g_pAppGlobals.NAME,
            IP: g_pAppGlobals.IP,
            PORT: g_pAppGlobals.PORT,
            HTTPPORT: g_pAppGlobals.HTTPPORT,
            ROOMCOUNT: pRoomIds.length,
            ROOMIDS: JSON.stringify(pRoomIds)
        }

        HTTPC.HTTPGet("/RegGServer", pReqArgs, function(pRetObj) {
            if (pRetObj.wErrCode == ErrorCodes.ERR_NOERROR) {
                //console.log("游戏 HTTP 服务器注册成功");
                pfnCallback(pRetObj);
            }
            else {
                //console.log("连接中心服务器...");
            }
        });
    }

    // 刷新游戏服务器
    var pfnRefreshGServer = function () {
        var pRoomIds = [];
        for (var sKey in g_pAppGlobals.pRoomMaps) {
            var iRoomId = parseInt(sKey);
            pRoomIds.push(iRoomId);
        }

        var pReqArgs = {
            ID: g_pAppGlobals.ID,
            NAME: g_pAppGlobals.NAME,
            IP: g_pAppGlobals.IP,
            PORT: g_pAppGlobals.PORT,
            HTTPPORT: g_pAppGlobals.HTTPPORT,
            ROOMCOUNT: pRoomIds.length,
            ROOMIDS: JSON.stringify(pRoomIds)
        }

        HTTPC.HTTPGet("/RefreshGServer", pReqArgs, function(pRetObj) {
            if (pRetObj.wErrCode == ErrorCodes.ERR_NOERROR) {
                //console.log("游戏 HTTP 服务器刷新成功");
            }
            else {
                console.log("连接中心服务器...");
            }
        });
    }

    if (pHttpServer != null) {
        console.log("HTTP_SERVER_START PORT:" + g_pAppGlobals.HTTPPORT);
        pfnRegGServer(function(pRetObj) {
            g_pConnectTimerPtr = setInterval(pfnRefreshGServer, 1000);
        });
    }
}

//设置跨域访问
app.all('*', function (req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "X-Requested-With");
	res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
	res.header("X-Powered-By", ' 3.2.1')
	res.header("Content-Type", "application/json;charset=utf-8");
	next();
});

// 查询游戏服务器信息
app.get("/GetGServerInfo", function(req, res) {
    var iRoomCount = 0;
    var iPlayerCount = roomMgr.GetOnlineCount();

    for (var sKey in g_pAppGlobals.pRoomMaps) {
        if (g_pAppGlobals.pRoomMaps[sKey] != null) {
            ++iRoomCount;
        }
    }

    http.send(res, ErrorCodes.ERR_NOERROR, "操作成功",
        {
            iRoomCount: iRoomCount,
            iPlayerCount: iPlayerCount
        });
});

// 查询服务器是启动状态
app.get("/IsGServerRunning", function(req, res) {
    http.send(res, ErrorCodes.ERR_NOERROR, "操作成功");
});

// 查询房间信息
app.get("/GetRoomInfo", async function(req, res) {
    var pReqArgs = req.query;

    console.log("/GetRoomInfo iRoomId:" + pReqArgs.iRoomId);
    var pRoomInfo = {
        iAllId: pReqArgs.iAllId,                    // 联盟ID
        iRoomId: parseInt(pReqArgs.iRoomId),        // 房间ID
        szRoomUUID: pReqArgs.szRoomUUID,            // 房间唯一ID
        iCreator: parseInt(pReqArgs.iCreator),      // 创建者
        iClubId: parseInt(pReqArgs.iClubId),        // 俱乐部ID
        iPlayTimes: parseInt(pReqArgs.iPlayTimes),  // 局数
        pRoomArgs: JSON.parse(pReqArgs.pRoomArgs),  // 房间参数
        tmCreate: pReqArgs.tmCreate,                // 创建时间
        iTimes: pReqArgs.iTimes,                    // 使用了多少秒了
        iTimeLen: pReqArgs.iTimeLen,                // 房间总时长(秒)
        pGameObj: JSON.parse(pReqArgs.pGameObj)       // 游戏数据
    }

    var pClubInfo = await dbLGQ.get_club_info_with_id(pReqArgs.iClubId);
    var pRoomObj = roomMgr.GetRoomObj(pReqArgs.iRoomId);
    if (pRoomObj == null) {
        pRoomObj = roomMgr.InitRoomObj(pRoomInfo);

        pRoomObj.szClubName = pClubInfo.sname;
        roomMgr.RefreshRoomPlayers(pRoomObj, function(pRoomPlayers) {
            if (pRoomObj != null) {
                http.send(res, ErrorCodes.ERR_NOERROR, "操作成功", {
                    iRoomId: pReqArgs.iRoomId,
                    ID: g_pAppGlobals.ID,
                    IP: g_pAppGlobals.IP,
                    PORT: g_pAppGlobals.PORT,
                    HTTPPORT: g_pAppGlobals.HTTPPORT
                });
            }
            else {
                http.send(res, ErrorCodes.ERR_NOERROR, "操作成功", {
                    iRoomId: pReqArgs.iRoomId,
                    ID: 0,
                    IP: "",
                    PORT: 0,
                    HTTPPORT: 0
                });
            }
    
            console.log("call /GetRoomInfo iRoomId:" + pRoomInfo.iRoomId);
        });
        return;
    }
    else {
        http.send(res, ErrorCodes.ERR_NOERROR, "操作成功", {
            iRoomId: pReqArgs.iRoomId,
            ID: g_pAppGlobals.ID,
            IP: g_pAppGlobals.IP,
            PORT: g_pAppGlobals.PORT,
            HTTPPORT: g_pAppGlobals.HTTPPORT
        });
    }
});

// 更新游戏服务器
app.get("/RefreshRooms", async function(req, res) {
    var pReqArgs = req.query;

    pReqArgs.ROOMIDS = SysUtils.GetJsonObj(pReqArgs.ROOMIDS);
    if (pReqArgs.ROOMIDS == null) {
        http.send(res, ErrorCodes.ERR_NOERROR, "操作成功", {
            ID: g_pAppGlobals.ID,
            IP: g_pAppGlobals.IP,
            PORT: g_pAppGlobals.PORT,
            HTTPPORT: g_pAppGlobals.HTTPPORT,
        });
        return;
    }

    for (var iIndex = 0; iIndex < pReqArgs.ROOMIDS.length; ++iIndex) {
        var iRoomId = parseInt(pReqArgs.ROOMIDS[iIndex]);
        var pRoomObj = roomMgr.GetRoomObj(iRoomId);
        if (pRoomObj != null) continue;

        var pRoomInfo = await dbLGQ.get_room_info_ex(iRoomId);
        if (pRoomInfo == null) continue;

        var pItem = {
            iAllId: parseInt(pRoomInfo.allid),          // 联盟ID
            iRoomId: parseInt(pRoomInfo.roomid),        // 房间ID
            szRoomUUID: pRoomInfo.roomuuid,             // 房间唯一ID
            iCreator: parseInt(pRoomInfo.creator),      // 创建者
            iClubId: parseInt(pRoomInfo.clubid),        // 俱乐部ID
            iPlayTimes: parseInt(pRoomInfo.playtimes),  // 局数
            pRoomArgs: JSON.parse(pRoomInfo.roomargs),  // 房间参数
            tmCreate: pRoomInfo.ctime,                  // 创建时间
            iTimes: pRoomInfo.times,                    // 使用了多少秒了
            iTimeLen: pRoomInfo.tmlen,                  // 房间总时长(秒)
            pGameObj: JSON.parse(pRoomInfo.gameinfo)     // 游戏数据
        };
        if (pItem.pGameObj == null) pItem.pGameObj = {};

        var pRoomObj = roomMgr.InitRoomObj(pItem);
        roomMgr.RefreshRoomPlayers(pRoomObj, function(pRoomPlayers) {
            console.log("load room uuid:" + pRoomObj.szRoomUUID + ", roomid:" + pRoomObj.iRoomId);
        });
    }

    http.send(res, ErrorCodes.ERR_NOERROR, "操作成功", {
        ID: g_pAppGlobals.ID,
        IP: g_pAppGlobals.IP,
        PORT: g_pAppGlobals.PORT,
        HTTPPORT: g_pAppGlobals.HTTPPORT,
    });
});

// 删除指定房间
app.get("/DeleteRoom", function(req, res) {
    var pReqArgs = req.query;

    var pRoomObj = g_pAppGlobals.pRoomMaps[pReqArgs.iRoomId];
    if (pRoomObj != null) {
        pRoomObj.iSecond = pRoomObj.iDelSec;
        console.log("/Delete iRoomId:" + pRoomObj.iRoomCount + ", set room timeout is true");
    }
});

// ================================
app.get("/GServerCMD", async function(req, res) {
    var pReqArgs = req.query;

    console.log("/GServerCMD, iCmdId:" + pReqArgs.iCmdId);
    //console.log(pReqArgs);

    pReqArgs.iCmdId = parseInt(pReqArgs.iCmdId);
    switch(pReqArgs.iCmdId) {
        case CmdIds.CMD_ADDJIFEN_REP:   // 添加用户积分
            var pJsonObj = {
                iUid: parseInt(pReqArgs.iUid),              // 表记录ID
                bAgree: pReqArgs.bAgree,            // 0:拒绝, 1:同意
                iFromUser: parseInt(pReqArgs.iFromUser),
                iDestUser: parseInt(pReqArgs.iDestUser),
                iFromClub: parseInt(pReqArgs.iFromClub),
                iRoomId: pReqArgs.iRoomId,
                szRoomUUID: pReqArgs.szRoomUUID,
                iJiFen: parseInt(pReqArgs.iJiFen),
            };
            await OnAddJiFenRep(res, pJsonObj);
            break;
        case CmdIds.CMD_OTHERLOGIN_NOTIFY:  // 玩家二次登录
            var pJsonObj = {
                iRoomId: parseInt(pReqArgs.iRoomId),
                iUserId: parseInt(pReqArgs.iUserId),
                pSocket: userMgr.GetSocketObj(pReqArgs.iUserId)
            }
            pGameMgr.OnOtherLoginIn(pJsonObj);
            break;
        default:
            res.json({
                wErrCode: ErrorCodes.ERR_INVOKE_FALIED,
                szErrMsg: "未知命令"
            });
    }
});

// 添加用户积分
async function OnAddJiFenRep(res, pReqArgs) {
    pRoomObj = null;
    for (var sKey in g_pAppGlobals.pRoomMaps) {
        var pItem = g_pAppGlobals.pRoomMaps[sKey];

        if (pItem.szRoomUUID == pReqArgs.szRoomUUID) {
            pRoomObj = pItem;
            break;
        }
    }

    //pReqArgs.iMode = parseInt(pReqArgs.iMode);
    pReqArgs.bAgree = (pReqArgs.bAgree == "true");
    var pData = {
        iUid: pReqArgs.iUid,
        iFromClub: pReqArgs.iFromClub,
        iRoomId: pReqArgs.iRoomId,
        iFromUser: parseInt(pReqArgs.iFromUser),
        iDestUser: parseInt(pReqArgs.iDestUser),
        iJiFen: parseInt(pReqArgs.iJiFen),
        bAgree: pReqArgs.bAgree, //(pReqArgs.iMode == 1),
        pSocket: userMgr.GetSocketObj(pReqArgs.iFromUser),
    };

    var pRetObj = await pGameMgr.OnProcessAddJiFenReq(pData);
    res.json(pRetObj);
}



// 房间广播
function SendMsgToAll(pRoomObj, szEvent, pData, iNotSend) {
    for (var iIndex = 0; iIndex < pRoomObj.pSeePlayers.length; ++iIndex) {
        var iUserId = pRoomObj.pSeePlayers[iIndex].iUserId;
        if (iUserId == iNotSend) continue;
        userMgr.SendMsg(iUserId, szEvent, pData);
    }

    for (var iIndex = 0; iIndex < pRoomObj.pPlayers.length; ++iIndex) {
        var iUserId = pRoomObj.pPlayers[iIndex].iUserId;
        if (iUserId == iNotSend) continue;
        if (iUserId != 0) userMgr.SendMsg(iUserId, szEvent, pData);
    }
}

var g_pJCMaps = {};
var g_pJiangChiMaps = {};
async function NotifyJCChanged(pRoomObj, iUid) {
    if (pRoomObj.iAllId != 0) {
        var pJCInfo = await roomMgr.GetJiangChiBaseInfo(pRoomObj);
        if (pJCInfo.iUid == -1) return;
        if (pRoomObj.iJCLoopTimes == null) pRoomObj.iJCLoopTimes = 0;

        var pRes = await dbCC.query("select sum(golds) as golds from tb_alliance_jiangchi where allianceid = $1", [pRoomObj.iAllId]);
        if (pRes.rows.length == 0) return;

        var iGolds = g_pJCMaps[pJCInfo.iUid];
        if (iGolds == null) {
            iGolds = 0;
            g_pJCMaps[pJCInfo.iUid] = 0;
        }
        
        pRes.rows[0].golds = parseInt(pRes.rows[0].golds);
        if (iGolds != pRes.rows[0].golds) {
            iGolds = pRes.rows[0].golds;
            g_pJCMaps[pJCInfo.iUid] = iGolds;
            SendMsgToAll(pRoomObj, "goldsjc_changed_notify", {
                wErrCode: ErrorCodes.ERR_NOERROR,
                szErrMsg: "操作成功",
                iGolds: iGolds
            }, 0);

            console.log("NotifyJCChanged 联盟ID:" + pRoomObj.iAllId +
                ", 奖池UID:" + pJCInfo.iUid +
                ", 房间ID:" + pRoomObj.iRoomId +
                ", 底分:" + pRoomObj.pRoomArgs.iBaseFen,
                ", 金币:" + iGolds);
        }
        else {
            pRoomObj.iJCLoopTimes += 1;
            if (pRoomObj.iJCLoopTimes == 3) {
                SendMsgToAll(pRoomObj, "goldsjc_changed_notify", {
                    wErrCode: ErrorCodes.ERR_NOERROR,
                    szErrMsg: "操作成功",
                    iGolds: iGolds
                }, 0);
                pRoomObj.iJCLoopTimes = 0;
            }
        }
    }
    // var pRes = await dbCC.query("select sum(golds) from tb_alliance_jiangchi where allianceid = $1", [pRoomObj.iAllId]);
    // //var pRes = await dbCC.query("select golds from tb_alliance_jiangchi where uid = $1", [iUid]);
    // if (pRes.rows.length == 1) {
    //     if (g_iJiangChi != pRes.rows[0].golds) {
    //         g_iJiangChi = pRes.rows[0].golds;
    //         SendMsgToAll(pRoomObj, "goldsjc_changed_notify", { iGolds: g_iJiangChi }, 0);
    //     }
    // }
}

async function RefreshSeatPlayerNums(pRoomObj) {
    var iCount = 0;
    for (var iIndex = 0; iIndex < pRoomObj.pPlayers.length; ++iIndex) {
        if (pRoomObj.pPlayers[iIndex].iUserId != 0) iCount += 1;
    }
    
    await dbCC.query("update tb_rooms set usernums = $1 where roomid = $2", [iCount, pRoomObj.iRoomId]);
}

async function TimerProc() {
    var pRoomObjs = [];

    for(var sKey in g_pAppGlobals.pRoomMaps) {
        var pRoomObj = g_pAppGlobals.pRoomMaps[sKey];
        var pRoomArgs = pRoomObj.pRoomArgs;

        await RefreshSeatPlayerNums(pRoomObj);

        var pJCObj = g_pJiangChiMaps[pRoomObj.szRoomUUID];
        if (pJCObj == null) {
            pJCObj = {};
            pJCObj.iUid = await roomMgr.GetJiangChiUID(pRoomObj);
            pJCObj.iJiangChi = 0;
            g_pJiangChiMaps[pRoomObj.szRoomUUID] = pJCObj;
        }
        await NotifyJCChanged(pRoomObj, pJCObj.iUid);

        var bDelete = false;
        if (!pRoomArgs.bRunning) {  // 房间没开局状态
            //console.log("TimerProc 1 pRoomObj.iRoomId:" + pRoomObj.iRoomId + ", iDelTimes:" + pRoomArgs.iDelTimes);

            if (pRoomArgs.iDelTimes > 0) pRoomArgs.iDelTimes -= 1;
            if (pRoomArgs.iDelTimes == 0) bDelete = true;

            (function(pRoomArgs, szRoomUUID) {
                var szRoomArgs = JSON.stringify(pRoomArgs);
                DB.UpdateSQL("update tb_rooms set times = times + 1, roomargs = $1 where roomuuid = $2", [szRoomArgs, szRoomUUID], null);
            })(pRoomArgs, pRoomObj.szRoomUUID);
        }
        else {  // 已开局状态
            //console.log("TimerProc 2 pRoomObj.iRoomId:" + pRoomObj.iRoomId + ", iDelVal:" +
            //    pRoomObj.iDelSec + ", iSecond:" + pRoomObj.iSecond);
            if (!pRoomObj.bDelete) {
                pRoomObj.iSecond += 1;
                (function(szRoomUUID) {
                    DB.UpdateSQL("update tb_rooms set times = times + 1 where roomuuid = $1", [szRoomUUID], null);
                })(pRoomObj.szRoomUUID);
            }

            var iJiFenMG = 0;
            if ((pRoomObj.pGameObj != null) && (pRoomObj.iJieSanMode != 1)) {   // 手动解散时不用判断芒果分
                if (pRoomObj.pGameObj.iJiFenMG != null) iJiFenMG = pRoomObj.pGameObj.iJiFenMG;
            }
            bDelete = ((pRoomObj.iSecond >= pRoomObj.iDelSec) && (!pRoomObj.bRunning) && (iJiFenMG == 0));
        }
        
        //console.log("TimerProc iRoomId:" + pRoomObj.iRoomId + ", iSecond:" + pRoomObj.iSecond + ", delete iSecond:" + pRoomObj.iDelSec);
        if (bDelete && !pRoomObj.bWaitJS) {  // 房间时间到了
            //console.log("TimerProc push iRoomId:" + pRoomObj.iRoomId + ", bRunning:" + pRoomObj.bRunning + ", bCanDel:" + pRoomObj.bCanDel);
            pRoomObj.bDelete = true;
            if (!pRoomObj.bRunning && pRoomObj.bCanDel) {
                console.log("TimerProc iRoomId:" + pRoomObj.iRoomId + ", iSecond:" + pRoomObj.iSecond + ", pRoomObj.iDelSec:" + pRoomObj.iDelSec);
                delete g_pJiangChiMaps[pRoomObj.szRoomUUID];
                pRoomObjs.push(pRoomObj);
            }
        }
    }

    for (var iIndex = 0; iIndex < pRoomObjs.length; ++iIndex) {
        var pRoomObj = pRoomObjs[iIndex];
        (function(pRoomObj) {
            SendMsgToAll(pRoomObj, "jiesan_notify", {
                iMode: pRoomObj.iJieSanMode // 0：超时解散，1：手动解散
            }, 0);

            HTTPC.HTTPGet("/DelRoom", { iClubId: pRoomObj.iClubId, iRoomId: pRoomObj.iRoomId }, function(pRetObj) {
                if (pRetObj.wErrCode == ErrorCodes.ERR_NOERROR) {
                    console.log("TimerProc delete room:" + pRoomObj.iRoomId);
                    roomMgr.Delete(pRoomObj);
                }
                else {
                    console.log(pRetObj);
                }
            });
        })(pRoomObj);
    }
}

// ==================================================================================
DB.init(AppConfigs.database());
dbCC.init(AppConfigs.database());

MainEntry();
HTTP_SERVER_START();

setInterval(TimerProc, 1000);



// 与中心服务器通信
function CSClientEntry() {
    var io = require("socket.io-client");
    var WebClient = io("http://" + g_pAppGlobals.IP + ":" + g_pAppGlobals.GSPORT);
    
    WebClient.on("connect", function() {
        console.log("连接中心服务器成功...");

        var pRoomIds = [];
        for (var sKey in g_pAppGlobals.pRoomMaps) {
            var iRoomId = parseInt(sKey);
            pRoomIds.push(iRoomId);
        }

        WebClient.emit("GSServerRegister", {
            ID: g_pAppGlobals.ID,               // 服务器ID
            IP: g_pAppGlobals.IP,               // 游戏服务器IP
            PORT: g_pAppGlobals.PORT,           // 游戏服务器对外 socket 端口
            HTTPPORT: g_pAppGlobals.HTTPPORT,   // 游戏服务器 http 端口
            GSPORT: g_pAppGlobals.GSPORT,       // 游戏服务器与登录服务器通信 socket 端口
            //===========================================
            ROOMCOUNT: pRoomIds.length,
            ROOMIDS: pRoomIds
        }); // 注册游戏服务器
    });

    WebClient.on("disconnect", function() {
        console.log("与中心服务器连接断开, 即将进行重连...");
    });

    WebClient.on('connect_error', function(data){
        console.log("连接失败, 正在进行重连...");
    });

    // 加载房间
    WebClient.on("OpenRooms", function(pReqArgs) {
        console.log("加载房间...")
        var pfnLoadRooms = function(pRoomIds, iIndex, callback) {
            if (iIndex >= pRoomIds.length) {
                callback();
                return;
            }

            var iRoomId = pRoomIds[iIndex];
            var pRoomObj = roomMgr.GetRoomObj(iRoomId);
            if (pRoomObj != null) {
                pfnLoadRooms(pRoomIds, iIndex + 1, callback);
                return;
            }

            DB.get_room_info(iRoomId, function(pRoomInfo) {
                if (pRoomInfo == null) {
                    pfnLoadRooms(pRoomIds, iIndex + 1, callback);
                    return;
                }

                var pRoomInfo = {
                    iAllId: pRoomInfo.addid,                   // 联盟ID
                    iRoomId: iRoomId,                          // 房间ID
                    szRoomUUID: pRoomInfo.roomuuid,            // 房间唯一ID
                    iCreator: pRoomInfo.creator,               // 创建者
                    iClubId: pRoomInfo.clubid,                 // 俱乐部ID
                    iPlayTimes: pRoomInfo.playtimes,           // 局数
                    pRoomArgs: JSON.parse(pRoomInfo.roomargs),  // 房间参数
                    tmCreate: pRoomInfo.ctime,                  // 创建时间
                    iTimes: pRoomInfo.times,                    // 使用了多少秒了
                    iTimeLen: pRoomInfo.tmlen,                  // 房间总时长(秒)
                    //pJiFenObjs: JSON.parse(pRoomInfo.players),    // 用户积分信息 (带入, 现有)
                    pGameInfo: JSON.parse(pRoomInfo.gameinfo)     // 游戏数据
                };
                
                var pRoomObj = roomMgr.InitRoomObj(pRoomInfo);
                var szSql = "select a.userid, b.alias, b.headico, a.jifendr, a.jifenkc, a.jifen, a.clubid, c.sname \
                    from tb_userjifen_info a, tb_users b, tb_clubs c \
                    where a.userid = b.userid and a.clubid = c.clubid and roomuuid = $1";
                DB.QuerySQL(szSql, [pRoomObj.szRoomUUID], function(pRows) {
                    for (var iIndex = 0; iIndex < pRows.length; ++iIndex) {
                        var pRow = pRows[iIndex];

                        pRoomObj.pRoomPlayers[pRow.userid] = {
                            szAlias: crypto.fromBase64(pRow.alias),
                            szHeadIco: pRow.headico,
                            iClubId: pRow.clubid,
                            szClubName: pRow.sname,
                            iJiFenDR: pRow.jifendr,
                            iJiFenKC: pRow.jifenkc,
                            iJiFen: pRow.iJiFen,
                            bOnline: false
                        };
                    }

                    pfnLoadRooms(pRoomIds, iIndex + 1, callback);
                });
            });
        };

        pfnLoadRooms(pReqArgs, 0, function(){
            console.log("服务器初始化完成...");
        });
    });

}
//CSClientEntry();
