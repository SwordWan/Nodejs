/*
    tb_clubs:俱乐部
    tb_clubmsgs:俱乐部消息
    tb_game_logs:
    tb_joinclubs:用户加入的俱乐部
    tb_myzj_logs:用户个人单房间输赢结算
    tb_online_logs:用户在线信息
    tb_rooms:房间
    tb_roomlogs:房间日志
    tb_sysnotice:系统通知
    tb_usermemo:俱乐部用户备注信息
    tb_users:用户表

    自动字段 alter table 表名 alter column uid set default nextval('序列名');
*/
var pg = require("pg");
var crypto = require('./crypto');
var SysUtils = require("./SysUtils")
var BigInt = require("big-integer");

var pool = null;
var g_pEvents = {
    OnDisconnect: null
}

function GenNumber(iIdLen) {
    var Result = 0;
    var szNumber = "";

    while (true) {
        var iNumVal = Math.floor(Math.random() * 10);
        szNumber = szNumber + iNumVal;

        if (szNumber[0] == '0') {
            szNumber = "";
        }

        if (szNumber.length == iIdLen) {
            Result = parseInt(szNumber);
            break;
        }
    }

    return Result;
}

exports.init = function (config) {
    if (pool == null) {
        pool = pg.Pool(config);
    }
};

function SetDisconnectHandler(Event) {
    g_pEvents.OnDisconnect = Event;
}
exports.SetDisconnectHandler = SetDisconnectHandler;

function ExeSQL(sql, args, callback) {
    pool.connect(function (err, client, done) {
        if (err != null) {
            if (g_pEvents.OnDisconnect != null) {
                g_pEvents.OnDisconnect(err);
            }
            if (callback != null) callback(null);
        }
        else if (args != null) {
            client.query(sql, args, function (err, result) {
                done(); // 释放连接  
                
                //事件驱动回调
                if (callback != null) {
                    if ((err != null) || (result == null)) console.error(sql, err);

                    callback(err, result);
                }
            });
        }
        else {
            client.query(sql, function (err, result) {
                done(); // 释放连接  
                
                //事件驱动回调
                if (callback != null) {
                    if ((err != null) || (result == null)) console.error(sql, err);

                    callback(err, result);
                }
            });
        }
    });
};
exports.ExeSQL = ExeSQL;

function QuerySQL(sql, args, callback) {
    if(callback == null) return;

    ExeSQL(sql, args, function(err, result) {
        if (result == null) {
            callback([]);
            return;
        }

        callback(result.rows);
    });
}
exports.QuerySQL = QuerySQL;

function UpdateSQL(sql, args, callback) {
    ExeSQL(sql, args, function(err, result) {
        if (callback != null) {
            if (result == null) {
                callback(0);
                return;
            }
    
            callback(result.rowCount);
        }
    });
}
exports.UpdateSQL = UpdateSQL;

function InsertSQL(sql, args, callback) {
    ExeSQL(sql, args, function(err, result) {
        if (callback != null) {
            if (result == null) {
                callback(0);
                return;
            }
    
            callback(result.rowCount);
        }
    });
}
exports.InsertSQL = InsertSQL;

function DeleteSQL(sql, args, callback) {
    ExeSQL(sql, args, function(err, result) {
        if (callback != null) {
            if (result == null) {
                callback(0);
                return;
            }
    
            callback(result.rowCount);
        }
    });
}
exports.DeleteSQL = DeleteSQL;






// 创建账号
exports.create_account = function (account, password, alias, headico, sex, callback) {
    if (account == null || password == null) {
        if (callback != null) callback(0);
        return;
    }

    var pfnGenUserId = function (callback) {
        var iUserId = GenNumber(6);
        QuerySQL("select count(userid) as icount from tb_users where userid = $1", [iUserId],
            function (rows) {
                if (rows.length == 1) {
                    if (rows[0].icount == 1) {
                        pfnGenUserId(callback);
                    }
                    else {
                        callback(iUserId);
                    }
                }
                else {
                    callback(0);
                }
            });
    }

    pfnGenUserId(function (iUserId) {
        if (iUserId == 0) {
            if (callback != null) callback(0);
            return;
        }

        try {
            var szAlias = crypto.toBase64(alias);
            alias = szAlias;
        }
        catch(err) {
            if (alias == null) alias = "";
        }

        password = crypto.md5(password);
        password = password.toLocaleUpperCase();
        if (headico == null) headico = "null";

        var pExtObj = exports.get_user_extdata({});
        var sql = "INSERT INTO tb_users(account, password, alias, headico, sex, userid, extdata) " +
            " VALUES($1, $2, $3, $4, $5, $6, $7)";

        alias = iUserId.toString();
        alias = crypto.toBase64(alias);

        var pParams = [account, password, alias, headico, sex, iUserId, JSON.stringify(pExtObj)];

        InsertSQL(sql, pParams, function (count) {
            if (callback == null) return;

            callback(count);
        });
    });
};

exports.get_user_extdata = function (pUserInfo) {
    var Result = SysUtils.GetJsonObj(pUserInfo.extdata);
    if (Result == null) {
        var tmNow = new Date();
        Result = {
            szTime: tmNow.Format("yyyyMM"),
            iTotoY: 0,      // 月均

            iTotalDR: 0,    // 总带入
            iPlayTimes: 0,  // 总局数
            iGameTimes: 0,  // 总手数
            iRuChiTimes: 0, // 入池数
            iRuChiWinTimes: 0,  // 入池赢的局数
            iJiFenSY: 0,        // 平均输赢分数
            iWinTimes: 0,       // 总共赢了多少局
            iFirstJZ: 0,        // 首轮加注次数
            iFirstZJZ: 0,       // 首轮再加注次数

            // 随机值
            iTanPaiLv: SysUtils.GenRandValue(3, 25),    // 摊牌率
            iTanPaiSLv: SysUtils.GenRandValue(3, 73),   // 摊牌胜率
        };
    }

    return Result;
}

// 更新用户扩展数据
exports.update_user_extdata = function (iUserId, pExtObj, callback) {
    var szExtObj = JSON.stringify(pExtObj);
    UpdateSQL("update tb_users set extdata = $1 where userid = $2", [szExtObj, iUserId], callback);
}

// 根据账号获取用户信息
exports.get_account_info = function (account, callback) {
    if (callback == null) return;

    if (account == null) {
        callback(null);
        return;
    }

    var sql = "SELECT * FROM tb_users WHERE account = '" + account + "'";
    QuerySQL(sql, null, function (rows) {
        if (rows == null) {
            callback(null);
            return
        }

        if (rows.length == 0) {
            callback(null);
            return;
        }

        try {
            var szAlias = crypto.fromBase64(rows[0].alias);
            rows[0].alias = szAlias;
        }
        catch (err) {
            
        }
        callback(rows[0]);
    });
};

// 根据用户ID获取用户信息
exports.get_user_info = function (userId, callback) {
    if (callback == null) return;

    if (userId == null) {
        callback(null);
        return;
    }

    var sql = "SELECT * FROM tb_users WHERE userid = " + userId;
    QuerySQL(sql, null, function (rows) {
        if (rows == null) {
            callback(null);
            return
        }

        if (rows.length == 0) {
            callback(null);
            return;
        }

        try {
            var szAlias = crypto.fromBase64(rows[0].alias);
            rows[0].alias = szAlias;
        }
        catch (err) {
            
        }
        callback(rows[0]);
    });
};

// 获取指定用户基本数据
exports.get_users_baseinfo = function(pUserIds, callback) {
    if (callback == null) return;

    var szKeyValue = "(";
    for (var iIndex = 0; iIndex < pUserIds.length; ++iIndex) {
        if (szKeyValue.length > 1) {
            szKeyValue = szKeyValue + ", " + pUserIds[iIndex];
        }
        else {
            szKeyValue = szKeyValue + pUserIds[iIndex];
        }
    }

    if (szKeyValue.length == 1) {
        callback({});
        return;
    }

    szKeyValue = szKeyValue + ")";
    QuerySQL("select * from tb_users where userid in " + szKeyValue, null, function(pRows) {
        var pUserMaps = {};
        for (var iIndex = 0; iIndex < pRows.length; ++iIndex) {
            var pRow = pRows[iIndex];
            pUserMaps[pRow.userid] = {
                iGolds: pRow.golds,
                szAlias: crypto.fromBase64(pRows[0].alias),
                szHeadIco: pRow.headico
            };
        }
        callback(pUserMaps);
    });
}

// 根据用户ID获取用户金币
exports.get_user_golds = function (userId, callback) {
    if (callback == null) return;

    if (userId == null) {
        callback(0);
        return;
    }

    var sql = "SELECT golds FROM tb_users WHERE userid = " + userId;
    QuerySQL(sql, null, function (rows) {
        if (rows == null) {
            callback(0);
            return
        }

        if (rows.length == 0) {
            callback(0);
            return;
        }

        callback(rows[0].golds);
    });
};

// 添加用户金币
exports.add_user_golds = function (iUserId, iGolds, callback) {
    var szSql = "update tb_users set golds = golds + " + iGolds + " where userid = " + iUserId;
    UpdateSQL(szSql, null, callback);
};

// 更新用户当前所在房间ID
exports.update_user_roomid = function (userId, roomId, callback) {
    var sql = "UPDATE tb_users SET roomid = " + roomId + " WHERE userid = " + userId;
    UpdateSQL(sql, null, callback);
};

// 创建房间
exports.create_room = function (creator, clubid, gameid, configs, ip, port, callback) {
    var pfnGenRoomId = function (callback) {
        var iRoomId = GenNumber(6);
        QuerySQL("select count(roomid) as icount from tb_rooms where roomid = " + iRoomId, null,
            function (rows) {
                if (rows[0].icount == 1) {
                    pfnGenRoomId(callback);
                }
                else {
                    callback(iRoomId);
                }
            });
    }

    pfnGenRoomId(function (iRoomId) {
        var szUUID = "{0}{1}";
        szUUID = szUUID.format(Date.now(), iRoomId);

        var iTimes = configs.iTimes * 60;   // 房间总时长 (秒)
        var szRoomConf = JSON.stringify(configs);
        var sql = " INSERT INTO tb_rooms(roomuuid,roomid,roomargs,gameid,creator,clubid, ipaddr, port, times, tmlen) VALUES('{0}',{1},'{2}',{3},{4},{5},'{6}',{7}, {8}, {9})";
        sql = sql.format(szUUID, iRoomId, szRoomConf, gameid, creator, clubid, ip, port, 0, iTimes);

        InsertSQL(sql, null, function (count) {
            if (count != 1) {
                callback(null);
                return;
            }

            var pRoomObj = {
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

            callback(pRoomObj);

            exports.add_room_logs(creator, clubid, gameid, iRoomId, szUUID, configs, iTimes);
        });
    });
};

// 添加创建房间日志
exports.add_room_logs = function (creator, clubid, gameid, roomid, roomuuid, configs, times) {
    var szRoomConf = JSON.stringify(configs);
    var sql = " INSERT INTO tb_roomlogs(roomuuid,roomid,roomargs,gameid,creator,clubid, tmlen) VALUES('{0}',{1},'{2}',{3},{4},{5}, {6})";
    sql = sql.format(roomuuid, roomid, szRoomConf, gameid, creator, clubid, times);
    InsertSQL(sql, null, null);
}

// 获取指定房间信息
exports.get_room_info = function (roomId, callback) {
    if (callback == null) return;

    if (roomId == null) {
        callback(null);
        return;
    }

    var sql = "SELECT * FROM tb_rooms WHERE roomid = " + roomId;
    QuerySQL(sql, null, function (rows) {
        if (rows == null) {
            callback(null);
            return;
        }

        if (rows.length == 1) {
            callback(rows[0]);
        }
        else {
            callback(null);
        }
    });
};

// 删除指定房间
exports.delete_room = function (roomId, callback) {
    var sql = "DELETE FROM tb_rooms WHERE roomid = " + roomId;
    DeleteSQL(sql, null, callback);
}

// 获取指定游戏类型房间总数
exports.get_room_count = function (gameid, callback) {
    if (callback == null) return;

    var sql = "SELECT count(*) as icount FROM tb_rooms WHERE gameid = " + gameid;
    QuerySQL(sql, null, function (rows) {
        callback(rows[0].icount);
    });
}

// 获取指定游戏类型所有房间信息
exports.get_room_list = function (gameid, callback) {
    if (callback == null) return;

    var sql = "SELECT * FROM tb_rooms WHERE gameid = " + gameid;
    QuerySQL(sql, null, function (rows) {
        callback(rows);
    });
};

// 获取所有房间
exports.get_all_room = function (callback) {
    if (callback == null) return;

    var sql = "SELECT * FROM tb_rooms WHERE valid";
    QuerySQL(sql, null, function (rows) {
        callback(rows);
    });
};

// 获取指定用户创建的所有房间信息
exports.get_user_rooms = function (userId, callback) {
    if (callback == null) return;

    var sql = "SELECT * FROM tb_rooms WHERE creator = " + userId;
    QuerySQL(sql, null, function (rows) {
        callback(rows);
    });
};

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

// 创建俱乐部
exports.create_club = function (creator, name, day, callback) {
    var pfnGenClubId = function (callback) {
        var iClubId = GenNumber(6);
        QuerySQL("select count(clubid) as icount from tb_clubs where clubid = " + iClubId, null,
            function (rows) {
                if (rows[0].icount == 1) {
                    pfnGenClubId(callback);
                }
                else {
                    callback(iClubId);
                }
            });
    }

    pfnGenClubId(function(iClubId){
        var pAdminUsers = [creator];
        var sql = "insert into tb_clubs(clubid, creator, sname, adminusers ,endtime, forsearch, unums) values($1, $2, $3, $4 ,now()::timestamp + '"+ day +" day', $5, 1)";
        //sql = sql.format(iClubId, creator, name, JSON.stringify(pAdminUsers));
        
        var pFindKeys = getGroup(name.split(""));
        pFindKeys.push(iClubId);
        pFindKeys = pFindKeys.join(" ");

        InsertSQL(sql, [iClubId, creator, name, JSON.stringify(pAdminUsers), pFindKeys], function(count){
            if (count == 0) {
                callback(0);
                return;
            }

            callback(iClubId);
        });
    });
}

// 获取俱乐部信息
exports.get_club_info = function (szKeyName, callback) {
    if (callback == null) return;

    var szSql = "select * from tb_clubs where (forsearch @@ plainto_tsquery($1))";
    QuerySQL(szSql, [szKeyName], function (rows) {
        if (rows == null) {
            callback(null);
            return;
        }

        if (rows.length == 0) {
            callback(null);
            return;    
        }

        callback(rows[0]);
    });
}

// 获取俱乐部信息
exports.get_club_infoex = function (szKeyName, callback) {
    if (callback == null) return;

    // var iClubId = 0;
    // try {
    //     iClubId = parseInt(szKeyName);
    // }
    // catch(err) {

    // }

    var szSql = "select * from tb_clubs where (forsearch @@ plainto_tsquery($1))";
    QuerySQL(szSql, [szKeyName], function (rows) {
        if (rows == null) {
            callback(null);
            return;
        }

        if (rows.length == 0) {
            callback(null);
            return;    
        }

        callback(rows[0]);
    });
}


// 获取指定俱乐部下的所有房间信息
exports.get_club_rooms = function (clubid, callback) {
    if (callback == null) return;

    var szSql = "SELECT (tmlen - times) as a1, * FROM tb_rooms where clubid = $1 order by basefen, a1 asc";
    QuerySQL(szSql, [clubid], function (rows) {
        callback(rows);
    });
}

// 添加俱乐部总人数
exports.add_club_totalusers = function(clubid, addnums, callback) {
    var szSql = "update tb_clubs set unums = unums + $1 where clubid = $2";
    UpdateSQL(szSql, [addnums, clubid], callback);
}

// 添加俱乐部在线人数
exports.add_club_onlineusers = function(clubid, addnums, callback) {
    var szSql = "update tb_clubs set olnums = olnums + $1 where clubid = $2";
    UpdateSQL(szSql, [addnums, clubid], callback);
}

// 添加俱乐部房间数
exports.add_club_roomcount = function(clubid, addnums, callback) {
    var szSql = "update tb_clubs set roomcount = roomcount + $1 where clubid = $2";
    UpdateSQL(szSql, [addnums, clubid], callback);
}

// 修改俱乐部用户备注
exports.change_clubuserminfo = function(clubid, userid, desc, callback) {
    var szSql = "select count(userid) as icount from tb_usermemo where clubid = $1, userid = $2";
    QuerySQL(szSql, [clubid, userid], function(pRows) {       
        if (pRows[0].icount == 1) {
            szSql = "update tb_usermemo set desc = $1 where clubid = $2 and userid = $3";
            UpdateSQL(szSql, [desc, clubid, userid], callback);
        }
        else {
            szSql = "insert into tb_usermemo(clubid, userid, desc) values($1, $2, $3)";
            ExeSQL(szSql, [clubid, userid, desc], callback);
        }
    });
}

// 设置用户在线状态
exports.set_user_online_state = function (userid, clubid, roomid, callback) {
    if (clubid == null) clubid = 0;
    if (roomid == null) roomid = 0;

    var szSql = "select count(userid) as icount from tb_online_logs where userid = $1";
    QuerySQL(szSql, [userid], function(pRows) {
        var pExeArgs = [];
        var pfnSqlFunc = null;

        if (pRows[0].icount == 0) {
            pfnSqlFunc = InsertSQL;
            pExeArgs = [userid, clubid, roomid];
            szSql = "insert into tb_online_logs(userid, clubid, roomid) values($1, $2, $3)";
        }
        else {
            pfnSqlFunc = UpdateSQL;
            pExeArgs = [clubid, roomid, userid];
            szSql = "update into tb_online_logs set clubid = $1, roomid = $2 where userid = $3";
        }

        pfnSqlFunc(szSql, pExeArgs, function(iCount) {
            if (callback != null) callback(iCount == 1);
        });
    });
}

// 更新房间玩家押注信息
exports.update_players_jifeninfo = function (iRoomId, pJiFenObjs, pGameObj, callback) {
    var szSql = "update tb_rooms set players = $1, gameinfo = $2 where roomid = $3";
    
    var szVal1 = JSON.stringify(pJiFenObjs);
    var szVal2 = "null";
    if (pGameObj != null) szVal2 = JSON.stringify(pGameObj);

    UpdateSQL(szSql, [szVal1, szVal2, iRoomId], callback);
}

// 增加游戏局数
exports.add_room_playtimes = function(iRoomId) {
    UpdateSQL("update tb_rooms set playtimes = playtimes + 1 where roomid = $1", [iRoomId], null);
}

// 保存个人大局输赢结算
exports.update_player_jiesuan_logs = function(iClubId, szRoomUUID, iRoomId, pRoomArgs, iUserId, iJiFenSY) {
    var szSql = "select count(*) as icount from tb_myzj_logs where roomuuid = $1 and userid = $2";
    QuerySQL(szSql, [szRoomUUID, iUserId], function(pRows) {
        if (pRows[0].icount == 1) {
            szSql = "update tb_myzj_logs set jiesuan = $1, playtimes = playtimes + 1 where roomuuid = $2 and userid = $3";
            UpdateSQL(szSql, [iJiFenSY, szRoomUUID, iUserId], null);
        }
        else {
            var szRoomArgs = JSON.stringify(pRoomArgs);

            szSql = "insert into tb_myzj_logs(clubid, roomuuid, roomid, roomargs, userid, jiesuan) values($1, $2, $3, $4, $5, $6)";
            InsertSQL(szSql, [iClubId, szRoomUUID, iRoomId, szRoomArgs, iUserId, iJiFenSY], null);
        }
    });
}

// 保存游戏数据
exports.update_gamedata = function(iRoomId, pGameObj) {
    var szSql = "update tb_rooms set gameinfo = $1 where roomid = $2";    
    var szVal1 = JSON.stringify(pGameObj);

    UpdateSQL(szSql, [szVal1, iRoomId], callback);
}

// 保存牌局回顾信息
exports.save_paijuhuigu_logs = function(szRoomUUID, iRoomId, iPlayTimes, pJsonObj, callback) {
    var szSql = "insert into tb_paijuhuigu_logs(roomuuid, roomid, playtimes, jsonvals) values($1, $2, $3, $4)";
    var szJsonVals = JSON.stringify(pJsonObj);
    
    UpdateSQL(szSql, [szRoomUUID, iRoomId, iPlayTimes, szJsonVals], callback);
}

// 添加房间消息
exports.add_room_messages = function(iRoomId, iUserId, szMsgs, callback) {
    var szSql = "insert into tb_roommessage(roomid, userid, msgs) values($1, $2, $3)";
    UpdateSQL(szSql, [iRoomId, iUserId, szMsgs], callback);
}

// 添加代入申请消息
exports.add_jifendr_request = function(iRoomClubId, szRoomUUID, iRoomId, iUserClubId, iUserId, pReqData, callback) {
    var szSql = "insert into tb_addjifenreq(clubid, roomuuid, roomid, userclub, userid, infos) values($1, $2, $3, $4, $5, $6)";
    UpdateSQL(szSql, [iRoomClubId, szRoomUUID, iRoomId, iUserClubId, iUserId, JSON.stringify(pReqData)], callback);
}

// 获取用户是否在指定房间申请了上分
exports.isexists_jifenreq = function(iRoomId, iUserId, callback) {
    var szSql = "select count(*) as icount from tb_addjifenreq where roomid = $1 and userid = $2";
    QuerySQL(szSql, [iRoomId, iUserId], function(pRows) {
        callback(pRows[0].icount == 1);
    });
}

// 获取指定房间指定用户上分请求数据
exports.get_user_jifenreq = function(iRoomId, iUserId, callback) {
    var szSql = "select infos from tb_addjifenreq where roomid = $1 and userid = $2";
    QuerySQL(szSql, [iRoomId, iUserId], function(pRows) {
        if (pRows.length == 0) {
            callback(null);
            return;
        }

        var pReqObj = SysUtils.GetJsonObj(pRows[0].infos);
        callback(pReqObj);
    });
}

// 获取指定房间申请上分的玩家
exports.get_jifenreq_users = function(iRoomId, callback) {
    var szSql = "select infos from tb_addjifenreq where roomid = $1";
    QuerySQL(szSql, [iRoomId], function(pRows) {
        var pRetObjs = [];
        for (var iIndex = 0; iIndex < pRows.length; ++iIndex) {
            var pRow = pRows[iIndex];
            var pReqObj = SysUtils.GetJsonObj(pRow.infos);
            
            pRetObjs.push(pReqObj);
        }
        callback(pRetObjs);
    });
}

// 删除代入申请消息
exports.del_jifendr_request = function(szRoomUUID, iUserId, callback) {
    var szSql = "delete from tb_addjifenreq where roomuuid = $1 and userid = $2";
    UpdateSQL(szSql, [szRoomUUID, iUserId], callback);
}

// 获取指定用户是哪个几俱乐部的管理员
exports.get_club_by_adminuser = function(iUserId, callback) {
    var szSql = "select clubid, clublevel from tb_joinclubs where userid = $1 and " + 
        " (clublevel = 0 or clublevel = 1) and status = 1";
    QuerySQL(szSql, [iUserId], function(pRows) {
        var pClubIds = [];

        for (var iIndex = 0; iIndex < pRows.length; ++iIndex) {
            var pRow = pRows[iIndex];
            pClubIds.push(pRow.clubid);
        }

        callback(pClubIds);
    });
}

// 获取指定俱乐部的管理员
exports.get_club_adminusers = function(iClubId, callback) {
    var szSql = "select userid from tb_joinclubs where (clubid = $1) and (clublevel = 0 or clublevel = 1)";
    QuerySQL(szSql, [iClubId], function(pRows) {
        var pUserIds = [];
        for (var iIndex = 0; iIndex < pRows.length; ++iIndex) {
            var iUserId = pRows[iIndex].userid;
            pUserIds.push(iUserId);
        }

        callback(pUserIds);
    });
}

// 更新用户最后登录时间
exports.update_last_logintime = function(iUserId) {
    UpdateSQL("update tb_users set lastlogintime = now() where userid = $1", [iUserId], null);
}


// 添加玩家积分信息
exports.insert_user_jifen = function(szRoomUUID, iUserId, iClubId, iJiFenDR, iJiFenKC, iJiFenYQ, iJiFen, callback) {
    var szSql = "insert into tb_userjifen_info(roomuuid, userid, clubid, jifendr, jifenkc, jifenyq, jifen) \
        values($1, $2, $3, $4, $5, $6, $7)";
    InsertSQL(szSql, [szRoomUUID, iUserId, iClubId, iJiFenDR, iJiFenKC, iJiFenYQ, iJiFen], callback);
}

// 添加玩家积分
exports.add_user_jifen = function(szRoomUUID, iUserId, iJiFenDR, iJiFenKC, iJiFenYQ, iJiFen, callback) {
    var szSql = "update tb_userjifen_info set jifendr = jifendr + $1, jifenkc = jifenkc + $2, \
        jifenyq = jifenyq + $3, jifen = jifen + $4 \
        where roomuuid = $5 and userid = $6";
    UpdateSQL(szSql, [iJiFenDR, iJiFenKC, iJiFenYQ, iJiFen, szRoomUUID, iUserId], callback);
}

// 添加玩家积分
exports.set_user_jifen = function(szRoomUUID, iUserId, iJiFen, callback) {
    var szSql = "update tb_userjifen_info set jifen = $1, stakes = null where roomuuid = $1 and userid = $2";
    UpdateSQL(szSql, [iJiFen, szRoomUUID, iUserId], callback);
}

// 添加玩家积分
exports.add_user_jifenex = function(szRoomUUID, iUserId, iClubId, iJiFenDR, iJiFenKC, iJiFenYQ, iJiFen, callback) {
    var szSql = "select count(uid) as num from tb_userjifen_info where roomuuid = $1 and userid = $2";
    QuerySQL(szSql, [szRoomUUID, iUserId], function(pRows) {
        if (pRows[0].num == 1) {
            exports.add_user_jifen(szRoomUUID, iUserId, iJiFenDR, iJiFenKC, iJiFenYQ, iJiFen, callback);
        }
        else {
            exports.insert_user_jifen(szRoomUUID, iUserId, iJiFenDR, iJiFenKC, iJiFenYQ, iJiFen, callback);
            }
    });
}

// 添加玩家身上的积分
exports.update_user_stake = function(szRoomUUID, iUserId, iJiFen, pStakeObj, callback) {
    var szSql = "update tb_userjifen_info set jifen = jifen + $1, stakes = $2 \
        where roomuuid = $3 and userid = $4";
    UpdateSQL(szSql, [iJiFen, JSON.stringify(pStakeObj), szRoomUUID, iUserId], callback);
}