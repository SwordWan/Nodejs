var express = require('express');
var crypto = require('../utils/crypto');
var db = require('../utils/db');
var http = require("../utils/http");
var AppConfigs = require("../configs_win");
var SysUtils = require("../utils/SysUtils");
var userMgr = require("./usermgr");
var dbCC = require('../utils/pgsqlCC');
var dbLGQ = require("../utils/dbLGQ");
var alliance = require('./alliance');
var club = require('./club');
var ConstCodes = require('../utils/const');
var GLogs = require("./querylogs");

var CmdIdsLib = require("../Utils/cmdids");
var CmdIds = CmdIdsLib.CmdIds;

var ErrorUtils = require("../utils/ErrorCodes");
var ErrorCodes = ErrorUtils.ErrorCodes;

var dbCC = null;
var dbLGQ = null;

function Init(dbC, dbL) {
    dbCC = dbC;
    dbLGQ = dbL;
}
exports.Init = Init;


function OnGameServerEvent(pReqArgs, pRetObj) {
    if (pReqArgs == null) {
        console.log("OnGameServerEvent:无效参数");
        return;
    }

    if (pReqArgs.iCmdId == null) {
        console.log("OnGameServerEvent: iCmdId 无效");
        return;
    }

    console.log("OnGameServerEvent: iCmdId:" + pReqArgs.iCmdId);
}
exports.OnGameServerEvent = OnGameServerEvent;



function GetRoomNumber(iLevel) {
    if (iLevel <= 1) return 1;
    if (iLevel <= 2) return 2;
    if (iLevel <= 3) return 3;
    if (iLevel <= 4) return 4;
    if (iLevel <= 5) return 5;
    if (iLevel <= 6) return 6;
    if (iLevel <= 7) return 7;
    if (iLevel <= 8) return 8;
    if (iLevel <= 9) return 9;

    return 1;
}
async function allianceRoom(conn, iLianMId, iClubId, row, pRoomObj) {
    let bError = true;
    do {
        if (iLianMId != row.allianceid) {
            pSocket.emit("createroom_result", {
                wErrCode: ErrorCodes.ERR_DBUPDATEFALIED,
                szErrMsg: "不要乱来"
            });
            break;
        }
        if (row.alliancelevel == 2) {
            pSocket.emit("createroom_result", {
                wErrCode: ErrorCodes.ERR_DBUPDATEFALIED,
                szErrMsg: "不是联盟管理，无法创建房间"
            });
            break;
        }
        let sql = 'select clubid from tb_clubs where allianceid = $1';
        let res = await conn.Query(sql, [iLianMId]);
        let errcount = 0
        for (let i = 0; i < res.rows.length; i++) {
            let row = res.rows[i];
            sql = "insert into tb_club_rooms(allid, clubid, roomid) values($1, $2, $3)";
            resC = await conn.Query(sql, [iLianMId, row.clubid, pRoomObj.roomid]);
            if (resC.rowCount == 0) {
                errcount++;
                break;
            }
            // if (iClubId == row.clubid) {
            //     continue;
            // }
            sql = "insert into tb_club_rooms(allid, clubid, roomid) values($1, $2, $3)";
            resC = await conn.Query(sql, [0, row.clubid, pRoomObj.roomid]);
            if (resC.rowCount == 0) {
                errcount++;
                break;
            }
        }
        if (errcount > 0) {
            break;
        }

        bError = false;
    } while (false);

    return bError;
}
async function clubRoom(conn, iLianMId, row, pReqArgs, pRoomObj) {
    if (row.clublevel == 2) {
        pSocket.emit("createroom_result", {
            wErrCode: ErrorCodes.ERR_DBUPDATEFALIED,
            szErrMsg: "不是俱乐部管理，无法创建房间"
        });
        return true;
    }
    let sql = "insert into tb_club_rooms(allid, clubid, roomid) values($1, $2, $3)";
    let res = await conn.Query(sql, [0, pReqArgs.iClubId, pRoomObj.roomid]);
    if (res.rowCount == 0) {
        return true;
    }
    return false;
}

async function add_room_logs(conn, creator, clubid, gameid, roomid, roomuuid, configs, times) {
    var szRoomConf = JSON.stringify(configs);
    var sql = " INSERT INTO tb_roomlogs(roomuuid,roomid,roomargs,gameid,creator,clubid, tmlen) VALUES('{0}',{1},'{2}',{3},{4},{5}, {6})";
    sql = sql.format(roomuuid, roomid, szRoomConf, gameid, creator, clubid, times);
    var pRes = await conn.Query(sql, []);
    return (pRes.rowCount == 1);
}

async function add_club_roomcount(conn, clubid, addnums) {
    var szSql = "update tb_clubs set roomcount = roomcount + $1 where clubid = $2";
    var pRes = await conn.Query(szSql, [addnums, clubid]);
    return (pRes.rowCount == 1);
}

async function get_room_info(conn, iRoomId) {
    var sql = "SELECT * FROM tb_rooms WHERE roomid = $1";
    var pRes = await conn.Query(sql, [iRoomId]);
    if (pRes.rows.length == 0) return null;
    return pRes.rows[0];
}

async function create_room(conn, creator, clubid, gameid, configs, ip, port, allid) {
    var iRoomId = 0;
    var iTimes = configs.iTimes * 60;   // 房间总时长 (秒)
    var szRoomConf = JSON.stringify(configs);
    var pRoomObj = null;
    if (allid == null) allid = 0;
    for (let i = 0; i < 100000; i++) {
        iRoomId = SysUtils.GenNumber(6);
        try {
            var szUUID = "{0}{1}";
            szUUID = szUUID.format(Date.now(), iRoomId);
            var sql = " INSERT INTO tb_rooms(roomuuid,roomid,roomargs,gameid,creator, clubid, ipaddr, port, times, tmlen, allid ,basefen) VALUES('{0}',{1},'{2}',{3},{4},{5},'{6}',{7}, {8}, {9}, {10},{11})";
            sql = sql.format(szUUID, iRoomId, szRoomConf, gameid, creator, clubid, ip, port, 0, iTimes, allid, configs.iBaseFen);
            var pRes = await conn.Query(sql, []);
            if (pRes.rowCount == 0) {
                break;
            };
            if (false == await add_room_logs(conn, creator, clubid, gameid, iRoomId, szUUID, configs, iTimes)) {
                break;
            }
            pRoomObj = {
                creator: creator,
                clubid: clubid,
                gameid: gameid,
                uuid: szUUID,
                roomid: iRoomId,
                roomargs: configs,
                times: 0,
                tmlen: iTimes,
                ctime: new Date()
            };
            break;
        } catch (e) {
            console.log(e.message);
        }
    }

    return pRoomObj;
}

// =======================================================================================
async function CreateRoom(pReqArgs, pSocket) {
    if (pReqArgs.pRoomArgs.iMaxPlayer == null) pReqArgs.pRoomArgs.iMaxPlayer = 8;
    let conn = new dbCC.conn();
    let bError = true;
    let pRoomObj = null;
    let roomInfo = null;
    try {
        do {
            await conn.Transaction();
            pReqArgs.pRoomArgs.bRunning = false;
            pReqArgs.pRoomArgs.iDelTimes = 30 * 60;// pReqArgs.pRoomArgs.iTimes * 60;      // 30分钟后自动解散
            let iLianMId = parseInt(pReqArgs.pRoomArgs.iAllid);
            let sql = 'select tb_joinclubs.userid,tb_joinclubs.clubid,tb_joinclubs.clublevel,\
                tb_joinclubs.alliancelevel,tb_clubs.allianceid from tb_joinclubs \
                inner join tb_clubs on tb_clubs.clubid = tb_joinclubs.clubid \
                where tb_joinclubs.status = 1 and tb_joinclubs.clubid = $1 and tb_joinclubs.userid = $2';
            let res = await dbCC.query(sql, [pReqArgs.iClubId, pSocket.iUserId]);
            if (res.rows.length == 0) {
                pSocket.emit("createroom_result", {
                    wErrCode: ErrorCodes.ERR_DBUPDATEFALIED,
                    szErrMsg: "管理员未找到"
                });
                break;
            }

            {
                let pRes = await dbCC.query("select gems from tb_users where userid = $1", [pSocket.iUserId]);
                if (pRes.rows.length == 0) {
                    pSocket.emit("createroom_result", {
                        wErrCode: ErrorCodes.ERR_USERISNOTEXISTS,
                        szErrMsg: "用户不存在"
                    });
                    break;
                }

                var iGems = parseInt(pRes.rows[0].gems);
                if (iGems < 60) {
                    console.log("钻石不足，创建联盟推送房间失败");
                    pSocket.emit("gems_noten_result", {
                        wErrCode: ErrorCodes.ERR_NOTENOUGHGEMS,
                        szErrMsg: "钻石不足"
                    });
                    break;
                }

                await dbCC.query("update tb_users set gems = gems - 60 where userid = $1", [pSocket.iUserId]);
            }


            pRoomObj = await create_room(conn, pSocket.iUserId,
                pReqArgs.iClubId,
                pReqArgs.iGameId,
                pReqArgs.pRoomArgs,
                pReqArgs.IP,
                pReqArgs.PORT,
                pReqArgs.pRoomArgs.iAllid);
            if (null == pRoomObj) {
                pSocket.emit("createroom_result", {
                    wErrCode: ErrorCodes.ERR_DBUPDATEFALIED,
                    szErrMsg: "创建房间失败"
                });
                break;
            }

            let row = res.rows[0];
            if (iLianMId > 0) {
                if (await allianceRoom(conn, iLianMId, pReqArgs.iClubId, row, pRoomObj)) {
                    break;
                }
            } else {
                if (await clubRoom(conn, iLianMId, row, pReqArgs, pRoomObj)) {
                    break;
                }
            }

            let iMaxRoomN = 1;
            let pRes = await dbCC.query("select levels, endtime from tb_clubs where now() < endtime and clubid = $1", [pReqArgs.iClubId]);
            if (pRes.rows.length == 1) {
                iMaxRoomN = GetRoomNumber(pRes.rows[0].levels);
            }

            if (iLianMId == 0) {    // 联盟房间数量没有上限限止
                pRes = await dbCC.query("select count(roomid) as icount from tb_rooms where clubid = $1", [pReqArgs.iClubId]);
                if (pRes.rows[0].icount >= iMaxRoomN) {
                    pSocket.emit("createroom_result", {
                        wErrCode: ErrorCodes.ERR_DBUPDATEFALIED,
                        szErrMsg: "俱乐部创建的房间数已达上限"
                    });
                    break;
                }
            }

            var pRetObj = {
                wErrCode: ErrorCodes.ERR_NOERROR,
                szErrMsg: "操作成功",
                iCreator: pRoomObj.creator,
                iClubId: pRoomObj.clubid,
                iGameId: pRoomObj.gameid,
                szRoomUUID: pRoomObj.uuid,
                iRoomId: pRoomObj.roomid,
                pRoomArgs: pRoomObj.roomargs,
                szIpAddress: pReqArgs.IP,
                wPort: pReqArgs.PORT,
                tmCreate: new Date()
            };
            if (false == await add_club_roomcount(conn, pReqArgs.iClubId, 1)) {
                pSocket.emit("createroom_result", {
                    wErrCode: ErrorCodes.ERR_DBUPDATEFALIED,
                    szErrMsg: "创建房间失败"
                });
                break;
            }

            roomInfo = await get_room_info(conn, pRetObj.iRoomId);
            if (null == roomInfo) {
                pSocket.emit("createroom_result", {
                    wErrCode: ErrorCodes.ERR_DBUPDATEFALIED,
                    szErrMsg: "创建房间失败"
                });
                break;
            }
            pSocket.emit("createroom_result", pRetObj);
            bError = false;
        } while (false);
    } catch (e) {
        console.log(e.message);
    } finally {
        if (bError) {
            await conn.Rollback();
        } else {
            await conn.Commit();
        }
        conn.Release();
    }

    return roomInfo;
}

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
    } else {
        console.log("GetRandGServer 没有找到可用的游戏服务器");
    }
    return Result;
}

function AllocRoomGServer(pRoomInfo, pGServer) {
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


exports.CreateRoom = CreateRoom;