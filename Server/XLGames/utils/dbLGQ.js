let crypto = require('../utils/crypto');
let SysUtils = require("./SysUtils")
let ErrorUtils = require("../utils/ErrorCodes");
let ErrorCodes = ErrorUtils.ErrorCodes;

var dbCtrl = null;
function Init(dbCC) {
    dbCtrl = dbCC;
}
exports.Init = Init;

function get_user_extdata(pUserInfo) {
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
exports.get_user_extdata = get_user_extdata;


// 创建账号
async function create_account(account, password, headico, sex) {
    var iUserId = 0;

    while(true) {
        iUserId = SysUtils.GenNumber(6);
        var pRes = await dbCtrl.query("select count(userid) from tb_users where userid = $1", [iUserId]);

        if (pRes.rows[0].count == 0) break;
    }

    alias = iUserId.toString();
    alias = crypto.toBase64(alias);

    password = crypto.md5(password);
    password = password.toLocaleUpperCase();

    if (headico == null) headico = "null";

    var pExtObj = get_user_extdata({});
    var szSql = "INSERT INTO tb_users(account, password, alias, headico, sex, userid, extdata) VALUES($1, $2, $3, $4, $5, $6, $7)";
    var pRes = await dbCtrl.query(szSql, [account, password, alias, headico, sex, iUserId, JSON.stringify(pExtObj)]);
    
    return (pRes.rowCount == 1);
}
exports.create_account = create_account;

// 获取用户信息
async function get_account_info(szAccount) {
    var pRes = await dbCtrl.query("select * from tb_users where account = $1", [szAccount]);
    if (pRes.rows.length == 0) return null;
    
    pRes.rows[0].alias = crypto.fromBase64(pRes.rows[0].alias);
    return pRes.rows[0];
}
exports.get_account_info = get_account_info;

async function get_user_info(iUserId) {
    var pRes = await dbCtrl.query("select * from tb_users where userid = $1", [iUserId]);
    if (pRes.rows.length == 0) return null;
    
    pRes.rows[0].alias = crypto.fromBase64(pRes.rows[0].alias);
    return pRes.rows[0];
}
exports.get_user_info = get_user_info;

// 更新用户扩展数据
async function update_user_extdata(iUserId, pExtObj) {
    var szExtObj = JSON.stringify(pExtObj);
    var pRes = await dbCtrl.query("update tb_users set extdata = $1 where userid = $2", [szExtObj, iUserId]);
    return (pRes.rowCount == 1);
}
exports.update_user_extdata = update_user_extdata;

// 获取指定用户基本数据
async function get_users_baseinfo(pUserIds) {
    if (pUserIds == null) pUserIds = [];
    if (pUserIds.length == 0) return {};

    var szKeyValue = "(";
    for (var iIndex = 0; iIndex < pUserIds.length; ++iIndex) {
        if (szKeyValue.length > 1) {
            szKeyValue = szKeyValue + ", " + pUserIds[iIndex];
        }
        else {
            szKeyValue = szKeyValue + pUserIds[iIndex];
        }
    }
    if (szKeyValue.length == 1) return {};

    szKeyValue = szKeyValue + ")";
    var pRes = await dbCtrl.query("select * from tb_users where userid in " + szKeyValue, null);
    
    var pUserMaps = {};
    for (var iIndex = 0; iIndex < pRes.rows.length; ++iIndex) {
        var pRow = pRes.rows[iIndex];
        pUserMaps[pRow.userid] = {
            iGems: pRow.gems,
            iGolds: parseInt(pRow.golds),
            szAlias: crypto.fromBase64(pRow.alias),
            szHeadIco: pRow.headico
        };
    }
    return pUserMaps;
}
exports.get_users_baseinfo = get_users_baseinfo;

// 添加用户金币
async function add_user_golds(iUserId, iGolds) {
    var szSql = "update tb_users set golds = golds + $1 where userid = $2";
    var pRes = await dbCtrl.query(szSql, [iGolds, iUserId]);
    return (pRes.rowCount == 1);
}
exports.add_user_golds = add_user_golds;

// 获取用户金币
async function get_user_golds(iUserId) {
    var pRes = await dbCtrl.query("select golds from tb_users where userid = $1", [iUserId]);
    if (pRes.rows.length == 0) return 0;
    return pRes.rows[0].golds;
}
exports.get_user_golds = get_user_golds;

// 更新用户当前所在房间ID
async function update_user_roomid(iUserId, iRoomId, iClubId) {
    var szSql = "UPDATE tb_users SET roomid = $1, roomclubid = $2  WHERE userid = $3";
    var pRes = await dbCtrl.query(szSql, [iRoomId, iClubId, iUserId]);

    return (pRes.rowCount == 1);
}
exports.update_user_roomid = update_user_roomid;

// 创建房间
async function add_room_logs(creator, clubid, gameid, roomid, roomuuid, configs, times) {
    var szRoomConf = JSON.stringify(configs);
    var sql = " INSERT INTO tb_roomlogs(roomuuid,roomid,roomargs,gameid,creator,clubid, tmlen) VALUES('{0}',{1},'{2}',{3},{4},{5}, {6})";
    sql = sql.format(roomuuid, roomid, szRoomConf, gameid, creator, clubid, times);
    var pRes = await dbCtrl.query(sql, null);

    return (pRes.rowCount == 1);
}

async function create_room(creator, clubid, gameid, configs, ip, port, allid) {
    var iRoomId = 0;

    while(true) {
        iRoomId = SysUtils.GenNumber(6);
        var pRes = await dbCtrl.query("select count(roomid) from tb_rooms where roomid = $1", [iRoomId]);

        if (pRes.rows[0].count == 0) break;
    }

    if (allid == null) allid = 0;

    var szUUID = "{0}{1}";
    szUUID = szUUID.format(Date.now(), iRoomId);

    var iTimes = configs.iTimes * 60;   // 房间总时长 (秒)
    var szRoomConf = JSON.stringify(configs);
    var sql = " INSERT INTO tb_rooms(roomuuid,roomid,roomargs,gameid,creator, clubid, ipaddr, port, times, tmlen, allid) VALUES('{0}',{1},'{2}',{3},{4},{5},'{6}',{7}, {8}, {9}, {10})";
    sql = sql.format(szUUID, iRoomId, szRoomConf, gameid, creator, clubid, ip, port, 0, iTimes, allid);

    var pRes = await dbCtrl.query(sql, null);
    if (pRes.rowCount == 0) return null;

    await add_room_logs(creator, clubid, gameid, iRoomId, szUUID, configs, iTimes);

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
    return pRoomObj;
}
exports.create_room = create_room;

// 获取指定房间信息
async function get_room_info(iRoomId) {
    var sql = "SELECT * FROM tb_rooms WHERE roomid = $1";
    var pRes = await dbCtrl.query(sql, [iRoomId]);
    if (pRes.rows.length == 0) return null;
    return pRes.rows[0];
}
exports.get_room_info = get_room_info;

// 获取指定房间信息
async function get_room_info_ex(iRoomId) {
    var sql = "SELECT a.*, b.sname FROM tb_rooms a, tb_clubs b WHERE a.clubid = b.clubid and roomid = $1";
    var pRes = await dbCtrl.query(sql, [iRoomId]);
    if (pRes.rows.length == 0) return null;
    return pRes.rows[0];
}
exports.get_room_info_ex = get_room_info_ex;

// 删除指定房间
async function delete_room(iRoomId) {
    var sql = "DELETE FROM tb_rooms WHERE roomid = $1";
    var pRes = await dbCtrl.query(sql, [iRoomId]);
    return (pRes.rowCount == 1);
}
exports.delete_room = delete_room;

// 获取所有房间
async function get_all_room() {
    var pRes = await dbCtrl.query("SELECT * FROM tb_rooms WHERE valid", null);
    return pRes.rows;
}
exports.get_all_room = get_all_room;

// 获取指定用户创建的所有房间信息
async function get_user_rooms(iUserId) {
    var pRes = await dbCtrl.query("select * from tb_rooms where creator = $1", [iUserId]);
    return pRes.rows;
}
exports.get_user_rooms = get_user_rooms;

// 创建俱乐部
async function create_club(creator, name, day) {
    var iClubId = 0;
    while(true) {
        iClubId = SysUtils.GenNumber(6);

        var pRes = await dbCtrl.query("select count(clubid) from tb_clubs where clubid = " + iClubId, null);
        if (pRes.rows[0].count == 0) break;
    }

    var pAdminUsers = [creator];
    var sql = "insert into tb_clubs(clubid, creator, sname, adminusers ,endtime, forsearch, unums) values($1, $2, $3, $4 ,now()::timestamp + '"+ day +" day', $5, 1)";

    var pFindKeys = SysUtils.GetGroup(name.split(""));
    pFindKeys.push(iClubId);
    pFindKeys = pFindKeys.join(" ");

    var pRes = await dbCtrl.query(sql, [iClubId, creator, name, JSON.stringify(pAdminUsers), pFindKeys]);
    if (pRes.rowCount == 0) iClubId = 0; 

    return iClubId;
}
exports.create_club = create_club;

// 获取俱乐部信息
async function get_club_info_with_id(iClubId) {
    var szSql = "select * from tb_clubs where clubid = $1";
    var pRes = await dbCtrl.query(szSql, [iClubId]);
    if (pRes.rows.length == 0) return null;

    return pRes.rows[0];
}
exports.get_club_info_with_id = get_club_info_with_id;

async function get_club_info(szFindValue) {
    var szSql = "select * from tb_clubs where (forsearch @@ plainto_tsquery($1))";
    var pRes = await dbCtrl.query(szSql, [szFindValue]);
    if (pRes.rows.length == 0) return null;

    return pRes.rows[0];
}
exports.get_club_info = get_club_info;

// 获取指定俱乐部下的所有房间信息
async function get_club_rooms(iClubId) {
    var szSql = "SELECT (tmlen - times) as a1, * FROM tb_rooms where clubid = $1 order by basefen, a1 asc";
    var pRes = await dbCtrl.query(szSql, [iClubId]);
    return pRes.rows;
}
exports.get_club_rooms = get_club_rooms;

// 添加俱乐部总人数
async function add_club_totalusers(clubid, addnums) {
    var szSql = "update tb_clubs set unums = unums + $1 where clubid = $2";
    var pRes = await dbCtrl.query(szSql, [addnums, clubid]);
    return (pRes.rowCount == 1);
}
exports.add_club_totalusers = add_club_totalusers;

// 添加俱乐部在线人数
async function add_club_onlineusers(clubid, addnums) {
    var szSql = "update tb_clubs set olnums = olnums + $1 where clubid = $2";
    var pRes = await dbCtrl.query(szSql, [addnums, clubid]);
    return (pRes.rowCount == 1);
}
exports.add_club_onlineusers = add_club_onlineusers;

// 添加俱乐部房间数
async function add_club_roomcount(clubid, addnums) {
    var szSql = "update tb_clubs set roomcount = roomcount + $1 where clubid = $2";
    var pRes = await dbCtrl.query(szSql, [addnums, clubid]);
    return (pRes.rowCount == 1);
}
exports.add_club_roomcount = add_club_roomcount;

// 修改俱乐部用户备注
async function change_clubuserminfo(clubid, userid, desc) {
    var szSql = "select count(userid) from tb_usermemo where clubid = $1, userid = $2";
    var pRes = await dbCtrl.query(szSql, [clubid, userid]);
    
    if (pRes.rows[0].count == 1) {
        szSql = "update tb_usermemo set desc = $1 where clubid = $2 and userid = $3";
        pRes = await dbCtrl.query(szSql, [desc, clubid, userid]);
    }
    else {
        szSql = "insert into tb_usermemo(clubid, userid, desc) values($1, $2, $3)";
        pRes = await dbCtrl.query(szSql, [clubid, userid, desc]);
    }

    return (pRes.rowCount == 1);
}
exports.change_clubuserminfo = change_clubuserminfo;

// 设置用户在线状态
async function set_user_online_state(userid, clubid, roomid) {
    if (clubid == null) clubid = 0;
    if (roomid == null) roomid = 0;

    var szSql = "select count(userid) from tb_online_logs where userid = $1";
    var pRes = await dbCtrl.query(szSql, [userid]);

    if (pRes.rows[0].count == 0) {
        szSql = "insert into tb_online_logs(userid, clubid, roomid) values($1, $2, $3)";
        pRes = await dbCtrl.query(szSql, [userid, clubid, roomid]);
    }
    else {
        szSql = "update into tb_online_logs set clubid = $1, roomid = $2 where userid = $3";
        pRes = await dbCtrl.query(szSql, [clubid, roomid, userid]);
    }

    return (pRes.rowCount == 1);
}
exports.set_user_online_state = set_user_online_state;

// 增加游戏局数
async function add_room_playtimes(iRoomId) {
    var pRes = await dbCtrl.query("update tb_rooms set playtimes = playtimes + 1 where roomid = $1", [iRoomId]);
    return (pRes.rowCount == 1);
}
exports.add_room_playtimes = add_room_playtimes;

// 保存个人大局输赢结算
async function update_player_jiesuan_logs(iClubId, szRoomUUID, iRoomId, pRoomArgs, iUserId, iJiFenSY) {
    var szSql = "select count(*) from tb_myzj_logs where roomuuid = $1 and userid = $2";
    var pRes = await dbCtrl.query(szSql, [szRoomUUID, iUserId]);

    if (pRes.rows[0].count == 1) {
        szSql = "update tb_myzj_logs set jiesuan = $1, playtimes = playtimes + 1 where roomuuid = $2 and userid = $3";
        pRes = await dbCtrl.query(szSql, [iJiFenSY, szRoomUUID, iUserId]);
    }
    else {
        var szRoomArgs = JSON.stringify(pRoomArgs);
        szSql = "insert into tb_myzj_logs(clubid, roomuuid, roomid, roomargs, userid, jiesuan) values($1, $2, $3, $4, $5, $6)";
        pRes = await dbCtrl.query(szSql, [iClubId, szRoomUUID, iRoomId, szRoomArgs, iUserId, iJiFenSY]);
    }

    return (pRes.rowCount == 1);
}
exports.update_player_jiesuan_logs = update_player_jiesuan_logs;

// 保存牌局回顾信息
async function save_paijuhuigu_logs(szRoomUUID, iRoomId, iPlayTimes, pJsonObj) {
    var szSql = "insert into tb_paijuhuigu_logs(roomuuid, roomid, playtimes, jsonvals) values($1, $2, $3, $4)";
    var szJsonVals = JSON.stringify(pJsonObj);

    var pRes = await dbCtrl.query(szSql, [szRoomUUID, iRoomId, iPlayTimes, szJsonVals]);

    return (pRes.rowCount == 1);
}
exports.save_paijuhuigu_logs = save_paijuhuigu_logs;

// 添加房间消息
async function add_room_messages(iRoomId, iUserId, szMsgs) {
    var szSql = "insert into tb_roommessage(roomid, userid, msgs) values($1, $2, $3)";
    var pRes = await dbCtrl.query(szSql, [iRoomId, iUserId, szMsgs]);

    return (pRes.rowCount == 1);
}
exports.add_room_messages = add_room_messages;

// 添加代入申请消息
async function add_jifendr_request(iRoomClubId, szRoomUUID, iRoomId, iUserClubId, iUserId, pReqData) {
    var szSql = "insert into tb_addjifenreq(clubid, roomuuid, roomid, userclub, userid, infos) values($1, $2, $3, $4, $5, $6)";
    var pRes = await dbCtrl.query(szSql, [iRoomClubId, szRoomUUID, iRoomId, iUserClubId, iUserId, JSON.stringify(pReqData)]);

    return (pRes.rowCount == 1);
}
exports.add_jifendr_request = add_jifendr_request;

// 获取指定房间指定用户上分请求数据
async function get_user_jifenreq(iRoomId, iUserId) {
    var szSql = "select infos from tb_addjifenreq where roomid = $1 and userid = $2";
    var pRes = await dbCtrl.query(szSql, [iRoomId, iUserId]);
    if (pRes.rows.count == 0) return null;

    return SysUtils.GetJsonObj(pRes.rows[0].infos);
}
exports.get_user_jifenreq = get_user_jifenreq;

// 获取指定申请上分数据
async function get_jifenreq_by_uid(iUid) {
    var Result = null;

    var szSql = "select uid, infos from tb_addjifenreq where uid = $1";
    var pRes = await dbCtrl.query(szSql, [iUid]);
    if (pRes.rows.length == 1) {
        Result = SysUtils.GetJsonObj(pRes.rows[0].infos);
        Result.iUid = iUid;
    }
    return Result;
}
exports.get_jifenreq_by_uid = get_jifenreq_by_uid;

// 获取指定房间申请上分的玩家
async function get_jifenreq_users(iRoomId) {
    var szSql = "select uid, infos from tb_addjifenreq where roomid = $1";
    var pRes = await dbCtrl.query(szSql, [iRoomId]);
    
    var pRetObjs = [];
    for (var iIndex = 0; iIndex < pRes.rows.length; ++iIndex) {
        var pRow = pRes.rows[iIndex];
        var pReqObj = SysUtils.GetJsonObj(pRow.infos);
        
        pReqObj.iUid = pRow.uid;
        pRetObjs.push(pReqObj);
    }
    return pRetObjs;
}
exports.get_jifenreq_users = get_jifenreq_users;

// 获取指定俱乐部上分的玩家
async function get_jifenreq_users_byclubs(pClubIds) {
    if (pClubIds.length == 0) return [];

    var szWhere = SysUtils.GetWhereStr(pClubIds);
    var szSql = "select uid, infos from tb_addjifenreq where userclub in " + szWhere;
    var pRes = await dbCtrl.query(szSql, []);
    
    var pRetObjs = [];
    for (var iIndex = 0; iIndex < pRes.rows.length; ++iIndex) {
        var pRow = pRes.rows[iIndex];
        var pReqObj = SysUtils.GetJsonObj(pRow.infos);
        
        pReqObj.iUid = pRow.uid;
        pRetObjs.push(pReqObj);
    }
    return pRetObjs;
}
exports.get_jifenreq_users_byclubs = get_jifenreq_users_byclubs;

// 删除代入申请消息
async function del_jifendr_request(szRoomUUID, iUserId) {
    var szSql = "delete from tb_addjifenreq where roomuuid = $1 and userid = $2";
    var pRes = await dbCtrl.query(szSql, [szRoomUUID, iUserId]);

    return (pRes.rowCount == 1);
}
exports.del_jifendr_request = del_jifendr_request;

// 获取指定用户创建的俱乐部
async function get_user_clubinfo(iUserId) {
    var pRes = await dbCtrl.query("select * from tb_clubs where creator = $1", [iUserId]);
    if (pRes.rows.length == 0) return null;
    return pRes.rows[0];
}
exports.get_user_clubinfo = get_user_clubinfo;

// 判断指定用户是否是指定俱乐部的管理员
async function is_club_admin(iClubId, iUserId) {
    var szSql = "select count(clubid) from tb_joinclubs where userid = $1 and clubid = $2 and clublevel <= 1 and status = 1";
    var pRes = await dbCtrl.query(szSql, [iUserId, iClubId]);
    return (pRes.rows[0].count == 1);
}
exports.is_club_admin = is_club_admin;

// 获取指定用户是哪个几俱乐部的管理员
async function get_club_by_adminuser(iUserId) {
    var szSql = "select clubid, clublevel from tb_joinclubs where userid = $1 and clublevel <= 1 and status = 1";
    var pRes = await dbCtrl.query(szSql, [iUserId]);

    var pClubIds = [];
    for (var iIndex = 0; iIndex < pRes.rows.length; ++iIndex) {
        var pRow = pRes.rows[iIndex];
        pClubIds.push(pRow.clubid);
    }

    return pClubIds;
}
exports.get_club_by_adminuser = get_club_by_adminuser;

// 获取指定俱乐部人数
async function get_club_usernums(iClubId) {
    var pRes = await dbCtrl.query("select count(userid) from tb_joinclubs where clubid = $1", [iClubId]);
    return pRes.rows[0].count;
}
exports.get_club_usernums = get_club_usernums;

// 获取指定俱乐部的管理员
async function get_club_adminusers(iClubId) {
    var szSql = "select userid from tb_joinclubs where (clubid = $1) and (clublevel <= 1)";
    var pRes = await dbCtrl.query(szSql, [iClubId]);

    var pUserIds = [];
    for (var iIndex = 0; iIndex < pRes.rows.length; ++iIndex) {
        var iUserId = pRes.rows[iIndex].userid;
        pUserIds.push(iUserId);
    }

    return pUserIds;
}
exports.get_club_adminusers = get_club_adminusers;

// 获取指定联盟下面的俱乐部ID与名称
async function get_alli_clubs(iAllId) {
    var szSql = "select a.clubid, sname from tb_alliance_club a, tb_clubs b where (a.clubid = b.clubid) and (a.allianceid = $1)";
    var pRes = await dbCtrl.query(szSql, [iAllId]);

    var pClubObjs = [];
    for (var iIndex = 0; iIndex < pRes.rows.length; ++iIndex) {
        pClubObjs.push({
            iAllId: iAllId,
            iClubId: pRes.rows[iIndex].clubid,
            szClubName: pRes.rows[iIndex].sname
        });
    }

    return pClubObjs;
}
exports.get_alli_clubs = get_alli_clubs;


// 获取指定俱乐部ID加入的联盟ID
async function get_club_allid(iClubId) {
    var szSql = "select allianceid from tb_clubs where clubid = $1";
    var pRes = await dbCtrl.query(szSql, [iClubId]);

    if (pRes.rows.length == 0) return 0;
    return pRes.rows[0].allianceid;
}
exports.get_club_allid = get_club_allid;



// 更新用户最后登录时间
async function update_last_logintime(iUserId) {
    var pRes = await dbCtrl.query("update tb_users set lastlogintime = now() where userid = $1", [iUserId]);
    return (pRes.rowCount == 1);
}
exports.update_last_logintime = update_last_logintime;

// 添加玩家积分信息
async function insert_user_jifen(szRoomUUID, iUserId, iClubId, iJiFenDR, iJiFenKC, iJiFenYQ, iJiFen) {
    var szSql = "insert into tb_userjifen_info(roomuuid, userid, clubid, jifendr, jifenkc, jifenyq, jifen) \
        values($1, $2, $3, $4, $5, $6, $7)";

    var pRes = await dbCtrl.query(szSql, [szRoomUUID, iUserId, iClubId, iJiFenDR, iJiFenKC, iJiFenYQ, iJiFen]);
    if (pRes.rowCount == 1);
}
exports.insert_user_jifen = insert_user_jifen;

// 添加玩家积分
async function add_user_jifen(szRoomUUID, iUserId, iJiFenDR, iJiFenKC, iJiFenYQ, iJiFen) {
    var szSql = "update tb_userjifen_info set jifendr = jifendr + $1, jifenkc = jifenkc + $2, \
        jifenyq = jifenyq + $3, jifen = jifen + $4 \
        where roomuuid = $5 and userid = $6";
    var pRes = await dbCtrl.query(szSql, [iJiFenDR, iJiFenKC, iJiFenYQ, iJiFen, szRoomUUID, iUserId]);
    if (pRes.rowCount == 1);
}
exports.add_user_jifen = add_user_jifen;

// 添加玩家积分
async function set_user_jifen(szRoomUUID, iUserId, iJiFen) {
    var szSql = "update tb_userjifen_info set jifen = $1, stakes = null where roomuuid = $1 and userid = $2";
    var pRes = await dbCtrl.query(szSql, [iJiFen, szRoomUUID, iUserId]);
    return (pRes.rowCount == 1);
}
exports.set_user_jifen = set_user_jifen;

// 添加玩家身上的积分
async function update_user_stake(szRoomUUID, iUserId, iJiFen, pStakeObj) {
    var szSql = "update tb_userjifen_info set jifen = jifen + $1, stakes = $2 where roomuuid = $3 and userid = $4";
    var pRes = await dbCtrl.query(szSql, [iJiFen, JSON.stringify(pStakeObj), szRoomUUID, iUserId]);
    return (pRes.rowCount == 1);
}
exports.update_user_stake = update_user_stake;

// 更新玩家积分
async function update_user_jifen(szRoomUUID, iUserId, pJiFenObj) {
    var szSql = "update tb_userjifen_info set jifendr = $1, jifenkc = $2, jifen = $3 where roomuuid = $4 and userid = $5";
    var pRes = await dbCtrl.query(szSql, [pJiFenObj.iJiFenDR, pJiFenObj.iJiFenCDR, pJiFenObj.iJiFen, szRoomUUID, iUserId]);
    return (pRes.rowCount == 1);
}
exports.update_user_jifen = update_user_jifen;

// 更新玩家积分
async function update_user_jifen_ex(szRoomUUID, iUserId, pJiFenObj) {
    var bRet = await update_user_jifen(szRoomUUID, iUserId, pJiFenObj);
    if (!bRet) {
        bRet = await insert_user_jifen(szRoomUUID, iUserId, pJiFenObj.iClubId, pJiFenObj.iJiFenDR,
            pJiFenObj.iJiFenCDR, pJiFenObj.iJiFenYQ, pJiFenObj.iJiFen);
    }
    return bRet;
}
exports.update_user_jifen_ex = update_user_jifen_ex;

// 获取用户是否在指定房间申请了上分
async function isexists_jifenreq(iRoomId, iUserId) {
    var szSql = "select count(*) from tb_addjifenreq where roomid = $1 and userid = $2";
    var pRes = await dbCtrl.query(szSql, [iRoomId, iUserId]);
    return (pRes.rows[0].count > 0);
}
exports.isexists_jifenreq = isexists_jifenreq;

// 获取俱乐部金币
async function get_club_golds(iClubId) {
    var pRes = await dbCtrl.query("select golds from tb_clubs where clubid = $1", [iClubId]);
    if (pRes.rows.length == 0) return 0;
    return pRes.rows[0].golds;
}
exports.get_club_golds = get_club_golds;

// 添加俱乐部金币
async function add_club_golds(iClubId, iGolds) {
    var pRes = await dbCtrl.query("update tb_clubs set golds = golds + $1 where clubid = $2", [iGolds, iClubId]);
    return (pRes.rowCount == 0);
}
exports.add_club_golds = add_club_golds;

// 获取指定玩家加入了哪些俱乐部
async function get_user_joingclubs(iUserId) {
    var szSql = "select a.clubid, b.sname, b.allianceid from tb_joinclubs a, tb_clubs b where a.clubid = b.clubid and a.userid = $1";
    var pRes = await dbCtrl.query(szSql, [iUserId]);

    var pClubObjs = [];
    for (var iIndex = 0; iIndex < pRes.rows.length; ++iIndex) {
        var pClubObj = {
            iClubId: pRes.rows[iIndex].clubid,
            szClubName: pRes.rows[iIndex].sname,
            iAllianceId: pRes.rows[iIndex].allianceid,
        }
        pClubObjs.push(pClubObj);
    }

    return pClubObjs;
}
exports.get_user_joingclubs = get_user_joingclubs;


// 判断联盟是否开启奖池
async function get_jcopen_state(iAllId) {
    if (iAllId == 0) return false;

    var pRes = await dbCtrl.query("select jcopen from tb_alliance where allianceid = $1", [iAllId]);
    if (pRes.rows.length == 0) return false;

    return (pRes.rows[0].jcopen == 1);
}
exports.get_jcopen_state = get_jcopen_state;

// 添加房间上分消息
async function add_shangfen_msgs(iClubId, szClubName, iRoomId, szRoomName, iFromUser, szFromUser, iDestUser, szDestUser, iJiFen, iMode, iFromClub) {
    var pRes = await dbCtrl.query("insert into tb_roommessage(clubid, clubname, roomid, roomname, optuser, optname, userid, dstname, jifen, mode, fromclub ) \
        values($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)", [iClubId, szClubName, iRoomId, szRoomName, iFromUser, szFromUser,
            iDestUser, szDestUser, iJiFen, iMode, iFromClub]);
    return (pRes.rowCount == 1);
}
exports.add_shangfen_msgs = add_shangfen_msgs;