let pgsql = require('../utils/pgsqlCC');
let ErrorUtils = require("../utils/ErrorCodes");
let ConstCodes = require('../utils/const');
let userMgr = require("./usermgr");
let crypto = require('../utils/crypto');
var ErrorCodes = ErrorUtils.ErrorCodes;
//创建联盟俱乐部最低等级
let g_create_alliance_club_levels = 5;
//创建联盟所需钻石
let g_create_alliance_diamond = 200;
//联盟等级对应的成员数量
let g_alliance_member_count = [
    0, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22
];
//升级联盟对应钻石数量
let g_alliance_upgrad_diamond = [
    0, 100000, 200000, 300000, 400000, 500000, 600000, 700000, 800000,
    900000, 1000000, 1100000, 1200000, 1300000, 1400000,
    1500000, 1600000, 1700000, 1800000, 1900000
];
//升级俱乐部对应钻石
let g_club_upgrad_diamond = [
    0, 200, 500, 600, 700, 4500, 7200, 12000, 18800, 22800
];

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

async function tb_room_search_add(conn, roomid, array) {
    let sql = 'INSERT INTO tb_room_search (room_id ,alliance_and_club) VALUES ($1 , $2)';
    return await conn.Query(sql, [roomid, array.join(' ')]);
}

async function tb_room_search_search(conn, clubid) {
    let sql = 'SELECT * FROM tb_room_search WHERE alliance_and_club @@ plainto_tsquery($1)';
    return await conn.Query(sql, [clubid]);
}

async function tb_room_search_search_page(conn, clubid, iRows, iOffset) {
    let sql = 'SELECT * FROM tb_room_search WHERE alliance_and_club @@ plainto_tsquery($1) LIMIT $2 OFFSET $3';
    return await conn.Query(sql, [clubid, iRows, iOffset]);
}

async function tb_joinclubs_search(conn, clubid) {
    let sql = 'SELECT * FROM tb_joinclubs WHERE clubid = $1';
    return await conn.Query(sql, [clubid]);
}

async function tb_alliance_add(conn, allianceid, sname, creator, clubid) {
    let sql = 'INSERT INTO tb_alliance (allianceid ,sname ,creator ,creatorclubid ,clubcount) VALUES ($1 , $2 ,$3 ,$4 , 1)';
    return await conn.Query(sql, [allianceid, sname, creator, clubid]);
}

async function tb_alliance_add_allianceid(conn, allianceid) {
    let sql = 'INSERT INTO tb_alliance (allianceid ) VALUES ($1)';
    return await conn.Query(sql, [allianceid]);
}

async function tb_alliance_upd_add(conn, sname, creator, clubid, allianceid) {
    let sql = 'UPDATE  tb_alliance set sname = $1 ,creator = $2 ,creatorclubid = $3 WHERE allianceid = $4';
    return await conn.Query(sql, [sname, creator, clubid, allianceid]);
}


async function tb_alliance_del(conn, allianceid, creator) {
    let sql = 'DELETE FROM tb_alliance WHERE allianceid = $1 AND creator = $2';
    return await conn.Query(sql, [allianceid, creator]);
}

async function tb_alliance_sel_by_allianceid(conn, allianceid) {
    let sql = 'SELECT * FROM tb_alliance WHERE allianceid = $1';
    return await conn.Query(sql, [allianceid]);
}

async function tb_alliance_sel_by_creator(conn, creator) {
    let sql = 'SELECT * FROM tb_alliance WHERE creator = $1';
    return await conn.Query(sql, [creator]);
}

async function tb_alliance_upd_allow_apply(conn, allianceid, allow_apply) {
    let sql = 'UPDATE tb_alliance SET allow_apply = $1 WHERE allianceid = $2';
    return await conn.Query(sql, [allow_apply, allianceid]);
}

async function tb_alliance_upd_clubcount_inc(conn, allianceid, iMaxClubcount) {
    let sql = 'UPDATE tb_alliance set clubcount = clubcount + 1 WHERE allianceid = $1 AND clubcount + 1 <= $2';
    return await conn.Query(sql, [allianceid, iMaxClubcount]);
}

async function tb_alliance_upd_clubcount_dec(conn, allianceid) {
    let sql = 'UPDATE tb_alliance set clubcount = clubcount - 1 WHERE allianceid = $1 AND clubcount - 1 >= 0';
    return await conn.Query(sql, [allianceid]);
}

async function tb_alliance_upd_levels(conn, levels, iUserId) {
    let sql = 'UPDATE tb_alliance set levels = $1 WHERE creator = $2 AND levels < $3';
    return await conn.Query(sql, [levels, iUserId, levels]);
}

async function tb_alliance_upd_admincount_inc(conn, allianceid, iMaxClubcount) {
    let sql = 'UPDATE tb_alliance set mgrcount = mgrcount + 1  WHERE allianceid = $1 AND mgrcount + 1 <= $2';
    return await conn.Query(sql, [allianceid, iMaxClubcount]);
}

async function tb_alliance_upd_admincount_dec(conn, allianceid) {
    let sql = 'UPDATE tb_alliance set mgrcount = mgrcount - 1 WHERE allianceid = $1 AND mgrcount - 1 >= 0';
    return await conn.Query(sql, [allianceid]);
}

async function tb_alliance_club_add(conn, allianceid, clubid, clubcreator, status, isadmin, alliancecreator) {
    let sql = 'INSERT INTO tb_alliance_club (allianceid,clubid,clubcreator,status,isadmin,alliancecreator) VALUES ($1 ,$2 ,$3 ,$4 ,$5,$6) RETURNING uid';
    return await conn.Query(sql, [allianceid, clubid, clubcreator, status, isadmin, alliancecreator]);
}

async function tb_alliance_club_sel_uid(conn, uid) {
    let sql = 'SELECT * FROM tb_alliance_club WHERE uid = $1';
    return await conn.Query(sql, [uid]);
}

async function tb_alliance_club_sel_by_allianceid(conn, allianceid) {
    let sql = 'SELECT * FROM tb_alliance_club WHERE allianceid = $1';
    return await conn.Query(sql, [allianceid]);
}

async function tb_view_alliance_club_sel_by_allianceid(conn, allianceid) {
    let sql = 'SELECT tb_alliance_club.uid, tb_alliance_club.allianceid , tb_alliance_club.isadmin ,tb_alliance_club.clubcreator as userid , \
                tb_clubs.sname ,tb_clubs.clubid FROM tb_alliance_club \
                inner join tb_clubs on tb_alliance_club.clubid = tb_clubs.clubid \
                WHERE tb_alliance_club.allianceid = $1 AND tb_alliance_club.status = 1';
    return await conn.Query(sql, [allianceid]);
}

async function tb_alliance_club_sel_allowed(conn, allianceid) {
    let sql = 'SELECT * FROM tb_alliance_club WHERE allianceid = $1 AND status = 1';
    return await conn.Query(sql, [allianceid]);
}

async function tb_alliance_club_sel_by_apply(conn, iUserId) {
    let sql = 'SELECT * FROM tb_alliance_club WHERE alliancecreator = $1 AND status = 0';
    return await conn.Query(sql, [iUserId]);
}

async function tb_alliance_club_upd_status_by_uid(conn, uid, status) {
    let sql = 'UPDATE tb_alliance_club set status = 1 WHERE uid = $1 AND status = $2';
    return await conn.Query(sql, [uid, status]);
}

async function tb_alliance_club_sel_allianceid_clubid(conn, allianceid, clubid) {
    let sql = 'SELECT * FROM tb_alliance_club WHERE allianceid = $1 AND clubid = $2';
    return await conn.Query(sql, [allianceid, clubid]);
}

async function tb_alliance_club_sel_allianceid_clubcreator(conn, allianceid, clubcreator) {
    let sql = 'SELECT * FROM tb_alliance_club WHERE allianceid = $1 AND clubcreator = $2';
    return await conn.Query(sql, [allianceid, clubcreator]);
}

async function tb_alliance_club_del_by_uid(conn, uid) {
    let sql = 'DELETE FROM tb_alliance_club WHERE uid = $1';
    return await conn.Query(sql, [uid]);
}

async function tb_alliance_club_del_by_allianceid(conn, allianceid) {
    let sql = 'DELETE FROM tb_alliance_club WHERE allianceid = $1';
    return await conn.Query(sql, [allianceid]);
}

async function tb_clubs_sel(conn, creator) {
    let sql = 'SELECT * FROM tb_clubs WHERE creator = $1';
    return await conn.Query(sql, [creator]);
}

async function tb_clubs_upd_allianceid(conn, clubid, allianceid, allianceidOld, alliancename) {
    let sql = 'UPDATE tb_clubs SET allianceid = $1 ,alliancename = $2 WHERE allianceid = $3 AND clubid = $4';
    return await conn.Query(sql, [allianceid, alliancename, allianceidOld, clubid]);
}

async function tb_users_sel(conn, iUserId) {
    let sql = 'SELECT * FROM tb_users WHERE userid = $1';
    return await conn.Query(sql, [iUserId]);
}

async function tb_users_upd_gems_dec(conn, diamond, iUserId) {
    let sql = 'UPDATE tb_users SET gems = gems - $1 WHERE userid = $2 AND gems >= $3';
    return await conn.Query(sql, [diamond, iUserId, diamond]);
}

async function tb_joinmessage_add(conn, fromname, toname, desc, type, userid, uid, clubid_allianceid, clubid_or_allianceid, join_userid) {
    //let sql = 'INSERT INTO tb_joinmessage ("fromname","toname","desc","type" ,"userid", "uid" ,clubid_allianceid) VALUES($1 ,$2 ,$3 ,$4 ,$5, $6,$7)';
    //return await conn.Query(sql, [fromname, toname, desc, type, userid, uid, clubid_allianceid]);
    let sql = 'INSERT INTO tb_joinmessage ("fromname","toname","desc","type" ,"userid", "uid" ,clubid_allianceid,clubid_or_allianceid,join_userid) VALUES($1 ,$2 ,$3 ,$4 ,$5, $6,$7,$8,$9)';
    return await conn.Query(sql, [fromname, toname, desc, type, userid, uid, clubid_allianceid,clubid_or_allianceid,join_userid]);
}

async function tb_joinmessage_sel(conn, iUserId) {
    let sql = 'SELECT * FROM tb_joinmessage WHERE userid = $1';
    return await conn.Query(sql, [iUserId]);
}

async function tb_joinmessage_del(conn, uid) {
    let sql = 'delete from tb_joinmessage where uid = $1 and "type" = $2';
    return await conn.Query(sql, [uid, '1']);
}

async function tb_joinclubs_upd_alliancelevel_by_userid_clubid(conn, alliancelevel, userid, clubid) {
    let sql = 'UPDATE tb_joinclubs SET alliancelevel = $1 WHERE userid = $2 AND clubid = $3';
    return await conn.Query(sql, [alliancelevel, userid, clubid]);
}

async function tb_club_upd_alliancemsgcount_inc(conn, clubid) {
    let sql = 'UPDATE tb_clubs SET alliancemsgcount = alliancemsgcount + 1 WHERE clubid = $1';
    return await conn.Query(sql, [clubid]);
}

async function tb_club_upd_alliancemsgcount_dec(conn, clubid) {
    let sql = 'UPDATE tb_clubs SET alliancemsgcount = alliancemsgcount - 1 WHERE clubid = $1 AND alliancemsgcount - 1 >= 0';
    return await conn.Query(sql, [clubid]);
}

async function tb_club_upd_alliancemsgcount_zero(conn, clubid) {
    let sql = 'UPDATE tb_clubs SET alliancemsgcount = 0 WHERE clubid = $1';
    return await conn.Query(sql, [clubid]);
}

//升级俱乐部
//俱乐部有时间15天
//VIP购买累加300钻石30天
//不同等级，升级俱乐部升级都重置为15天
//同等级日期时间累计
async function upgradclub(pSocket, pArgs) {
    console.log('升级俱乐部');
    let conn = new pgsql.conn();
    let bError = true;
    let iUserId = pSocket.iUserId;
    let levels = pArgs.levels;
    try {
        do {
            await conn.Transaction();
            let res = await tb_users_sel(conn, iUserId);
            if (res.rowCount == 0) {
                console.log('用户不存在');
                pSocket.emit('upgradclub_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "用户不存在"
                });
                break;
            }
            let diamond = g_club_upgrad_diamond[levels];
            if (undefined == diamond || diamond == 0) {
                console.log('等级不正确')
                pSocket.emit('upgradclub_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "参数错误"
                });
                break;
            }
            if (res.rows[0].gems < diamond) {
                console.log('钻石不足');
                pSocket.emit('upgradclub_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "钻石不足"
                });
                break;
            }
            res = await tb_clubs_sel(conn, iUserId);
            if (res.rowCount == 0) {
                console.log('俱乐部未找到');
                pSocket.emit('upgradclub_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "俱乐部未找到"
                });
                break;
            }
            let oldlevels = res.rows[0].levels;
            let oldendtime = res.rows[0].endtime.getTime();
            let currenttime = new Date().getTime();
            let clubid = res.rows[0].clubid;
            let sql = "UPDATE tb_clubs SET levels = $1, endtime = now()::timestamp + '" + ConstCodes.CLUB_DEFAULT_DAY + " day' WHERE clubid = $2";
            if (currenttime < oldendtime) { //没过期
                if (levels == oldlevels) {
                    sql = "UPDATE tb_clubs SET levels = $1, endtime = endtime::timestamp + '" + ConstCodes.CLUB_DEFAULT_DAY + " day' WHERE clubid = $2";
                }
            }
            res = await conn.Query(sql, [levels, clubid]);
            if (res.rowCount == 0) {
                pSocket.emit('upgradclub_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "更新俱乐部时间出错"
                });
                break;
            }
            res = await tb_users_upd_gems_dec(conn, diamond, iUserId);
            if (res.rowCount == 0) {
                pSocket.emit('upgradclub_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "更新用户钻石失败"
                });
                break;
            }

            console.log('升级成功');
            pSocket.emit('upgradclub_result', {
                wErrCode: ErrorCodes.ERR_NOERROR,
                szErrMsg: "升级成功"
            });

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
}

//创建联盟
async function createalliance(pSocket, pArgs) {
    console.log('创建联盟');
    let conn = new pgsql.conn();
    let bError = true;
    let iUserId = pSocket.iUserId;
    let sname = pArgs.sname;
    try {
        do {
            await conn.Transaction();
            if (undefined == sname) {
                console.log('联盟名称不正确');
                pSocket.emit('createalliance_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "联盟名称不正确"
                });
                break;
            }
            sname = sname.replace(/^\s*|\s*$/g, '');
            if (sname.length == 0 || sname.length > 12) {
                console.log('联盟名称不正确');
                pSocket.emit('createalliance_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "联盟名称不正确"
                });
                break;
            }
            let club = await tb_clubs_sel(conn, iUserId);
            if (club.rowCount == 0) {
                console.log('不是创建者，无法创建联盟');
                pSocket.emit('createalliance_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "不是创建者，无法创建联盟"
                });
                break;
            }

            if (club.rows[0].levels < g_create_alliance_club_levels) {
                console.log('俱乐部最低等级是5级');
                pSocket.emit('createalliance_result', {
                    wErrCode: ErrorCodes.ERR_CLUBLEVEL,
                    szErrMsg: "俱乐部最低等级是5级"
                });
                break;
            }

            //获取用户信息
            let res = await tb_users_sel(conn, iUserId);
            if (res.rowCount == 0) {
                console.log('用户未找到');
                pSocket.emit('createalliance_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "用户未找到"
                });
                break;
            }
            if (res.rows[0].gems < g_create_alliance_diamond) {
                pSocket.emit('createalliance_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "钻石不足"
                });
                break;
            }

            if (club.rows[0].allianceid > 0) {
                pSocket.emit('createalliance_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "已经存在联盟"
                });
                break;
            }
            let clubid = club.rows[0].clubid;
            let allianceid = 0;
            let trycount = 10000;
            for (; ;) {
                if (trycount == 1) {
                    break;
                }
                allianceid = GenNumber(6);
                try {
                    res = await tb_alliance_add_allianceid(conn, allianceid);
                    if (res.rowCount > 0) {
                        break;
                    }
                } catch (e) {

                }
                trycount--;
            }

            if (0 == trycount) {
                pSocket.emit('createalliance_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "创建联盟失败[1]"
                });
                break;
            }
            try {
                res = await tb_alliance_upd_add(conn, sname, iUserId, clubid, allianceid);
                if (res.rowCount == 0) {
                    pSocket.emit('createalliance_result', {
                        wErrCode: ErrorCodes.ERR_INVALIDARGS,
                        szErrMsg: "创建联盟失败[2]"
                    });
                    break;
                }
            } catch (e) {
                let sql = 'select * from tb_alliance where sname = $1';
                res = await conn.Query(sql, [sname]);
                if (res.rowCount == 0) {
                    pSocket.emit('createalliance_result', {
                        wErrCode: ErrorCodes.ERR_INVALIDARGS,
                        szErrMsg: "创建联盟失败[3]"
                    });
                    break;
                }
                pSocket.emit('createalliance_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "联盟名称重复"
                });
                break;
            }

            //更新当前的联盟
            res = await tb_clubs_upd_allianceid(conn, clubid, allianceid, 0, pArgs.sname);
            if (res.rowCount == 0) {
                console.log('更新联盟ID到俱乐部失败');
                pSocket.emit('createalliance_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "更新联盟ID到俱乐部失败"
                });
                break;
            }
            res = await tb_alliance_club_add(conn, allianceid, clubid, iUserId, 1, 2, iUserId);
            if (res.rowCount != 1) {
                console.log('创建俱乐部关联失败');
                pSocket.emit('createalliance_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "创建俱乐部关联失败"
                });
                break;
            }
            res = await tb_users_upd_gems_dec(conn, g_create_alliance_diamond, iUserId);
            if (res.rowCount == 0) {
                console.log('扣取用户钻石错误');
                pSocket.emit('createalliance_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "扣取用户钻石错误"
                });
                break;
            }
            res = await tb_joinclubs_upd_alliancelevel_by_userid_clubid(conn, 0, iUserId, clubid);
            if (res.rowCount == 0) {
                console.log('更新俱乐部联盟等级失败');
                pSocket.emit('createalliance_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "更新俱乐部联盟等级失败"
                });
                break;
            }

            //初始化奖池
            if (await initJiangchi(conn, allianceid, iUserId)) {
                console.log('初始化联盟奖池失败');
                pSocket.emit('createalliance_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "初始化联盟奖池失败"
                });
                break;
            }


            pSocket.emit('createalliance_result', {
                wErrCode: ErrorCodes.ERR_NOERROR,
                szErrMsg: "创建联盟成功",
                iAllianceid: allianceid
            });
            bError = false;
        } while (false);
    } catch (e) {
        console.log(e);
    } finally {
        if (bError) {
            await conn.Rollback();
        } else {
            await conn.Commit();
        }
        conn.Release();
        return !bError;
    }
}

async function initJiangchi(conn, allianceid, iUserId) {
    let bError = false;
    let pichi = [1, 2, 5, 10, 20, 50, 100]
    for (let i = 0; i < pichi.length; i++) {
        let sql = 'insert into tb_alliance_jiangchi \
                            (allianceid,tianhuang,duohuang,duoduoduo,level,userid) \
                            values ($1,$2,$3,$4,$5,$6)';
        let res = await conn.Query(sql, [allianceid, 20, 10, 2, pichi[i], iUserId]);
        if (res.rowCount == 0) {
            bError = true;
            break;
        }
    }
    return bError;
}

//解散联盟
async function dissolvedalliance(pSocket, pArgs) {
    let conn = new pgsql.conn();
    let bError = true;
    let iUserId = pSocket.iUserId;
    try {
        do {
            await conn.Transaction();
            let sql = 'select tb_users.alias ,tb_alliance.allianceid ,tb_alliance.creatorclubid from tb_alliance \
                        inner join tb_users on tb_users.userid = tb_alliance.creator  \
                        where creator = $1'
            let res = await conn.Query(sql, [iUserId]);
            if (res.rowCount == 0) {
                console.log('未找到联盟');
                pSocket.emit('dissolvedalliance_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "未找到联盟"
                });
                break;
            }
            //更新俱乐部联盟ID为0
            let allianceid = res.rows[0].allianceid;
            let allianceclubid = res.rows[0].creatorclubid;
            let alias = crypto.fromBase64(res.rows[0].alias);
            sql = 'update tb_clubs set allianceid = 0 ,alliancename = null where allianceid = $1';
            res = await conn.Query(sql, [allianceid]);
            if (res.rowCount == 0) {
                console.log('更新俱乐部联盟ID失败');
                pSocket.emit('dissolvedalliance_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "更新俱乐部联盟ID失败"
                });
                break;
            }
            res = await tb_alliance_del(conn, allianceid, iUserId);
            if (res.rowCount == 0) {
                console.log('解散联盟失败');
                pSocket.emit('dissolvedalliance_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "解散联盟失败"
                });
                break;
            }

            let title = JSON.stringify(alias + '解散了俱乐部');
            let msgs = JSON.stringify('联盟已解散');

            sql = 'select * from tb_alliance_club where allianceid = $1';
            res = await conn.Query(sql, [allianceid]);
            let rows = res.rows;

            for (let i = 0; i < rows.length; i++) {
                let applyer = rows.clubcreator;
                sql = 'insert into tb_mymessage (userid,msgs,title) values($1,$2,$3)';
                await conn.Query(sql, [applyer, msgs, title]);
                sql = 'update tb_users set mymsgcount = 1 where userid = $1';
                await conn.Query(sql, [applyer]);
            }

            res = await tb_alliance_club_del_by_allianceid(conn, allianceid);
            if (res.rowCount == 0) {
                console.log('删除联盟-俱乐部关联失败');
                pSocket.emit('dissolvedalliance_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "删除联盟-俱乐部关联失败"
                });
                break;
            }
            res = await tb_club_upd_alliancemsgcount_zero(conn, allianceclubid);
            if (res.rowCount == 0) {
                console.log('删除联盟-更新消息数量失败');
                pSocket.emit('dissolvedalliance_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "删除联盟-更新消息数量失败"
                });
                break;
            }

            bError = false;

            for (let i = 0; i < rows.length; i++) {
                let applyer = rows.clubcreator;
                let s = userMgr.GetSocketObj(applyer)
                if (s && s.connected) {
                    s.emit('mymsg_result', {
                        wErrCode: ErrorCodes.ERR_NOERROR,
                        szErrMsg: "有新的消息"
                    });
                }
            }

            pSocket.emit('dissolvedalliance_result', {
                wErrCode: ErrorCodes.ERR_INVALIDARGS,
                szErrMsg: "解散联盟成功"
            });

        } while (false);
    } catch (e) {
        console.log(e);
    } finally {
        if (bError) {
            await conn.Rollback();
        } else {
            await conn.Commit();
        }
        conn.Release();
        return !bError;
    }
}

//批准加入联盟
async function approvealliance(pSocket, pArgs) {
    let conn = new pgsql.conn();
    let bError = true;
    let iUserId = pSocket.iUserId;
    let uid = pArgs.uid;
    let allianceid = 0;
    let iMaxClubcount = 0;
    let applyer = 0;
    let clubid = 0;
    let alliancename = '';
    let allianceclubid = 0;
    let alias = '';

    try {
        do {
            await conn.Transaction();
            let sql = 'select * from tb_alliance_club where uid = $1';
            let res = await conn.Query(sql, [uid]);
            if (res.rowCount == 0) {
                console.log('批准加入联盟-申请记录未找到');
                pSocket.emit('approvealliance_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "申请记录未找到"
                });
                break;
            }
            if (res.rows[0].status != 0) {
                console.log('批准加入联盟-申请已通过');
                pSocket.emit('approvealliance_result', {
                    wErrCode: ErrorCodes.ERR_NOERROR,
                    szErrMsg: "申请已通过"
                });
                break;
            }
            let pRecorder = res.rows[0];
            allianceid = pRecorder.allianceid;
            clubid = pRecorder.clubid;
            applyer = pRecorder.clubcreator;


            sql = 'SELECT \
                    tb_users."alias", \
                    tb_joinclubs.alliancelevel, \
                    tb_alliance.creatorclubid, \
                    tb_alliance.sname, \
                    tb_alliance.levels, \
                    tb_alliance.clubcount,\
                    tb_alliance_club.* \
                    FROM \
                        tb_joinclubs \
                    INNER JOIN tb_clubs ON tb_joinclubs.clubid = tb_clubs.clubid \
                    INNER JOIN tb_users ON tb_joinclubs.userid = tb_users.userid \
                    INNER JOIN tb_alliance ON tb_clubs.allianceid = tb_alliance.allianceid \
                    INNER JOIN tb_alliance_club ON tb_alliance.allianceid = tb_alliance_club.allianceid \
                    WHERE \
                        tb_clubs.allianceid > 0 \
                    AND tb_joinclubs.userid = $1 \
                    AND tb_alliance_club.clubid = tb_joinclubs.clubid \
                    AND tb_alliance_club.allianceid = $2 \
                    order by tb_joinclubs.alliancelevel asc limit 1 offset 0';

            res = await conn.Query(sql, [iUserId, allianceid]);
            if (res.rowCount == 0) {
                console.log('批准加入联盟-权限不足1');
                pSocket.emit('approvealliance_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "权限不足"
                });
                break;
            }
            let pData = res.rows[0];
            iMaxClubcount = g_alliance_member_count[pData.levels];
            if (undefined == iMaxClubcount || 0 == iMaxClubcount) {
                console.log('批准加入联盟-数据错误');
                pSocket.emit('approvealliance_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "联盟等级数据错误"
                });
                break;
            }
            if (pData.alliancelevel == 2) {
                console.log('批准加入联盟-权限不足');
                pSocket.emit('approvealliance_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "权限不足"
                });
                break;
            }
            if (pData.allianceid != pRecorder.allianceid) {
                console.log('批准加入联盟-联盟数量达到上限，无法申请');
                pSocket.emit('approvealliance_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "权限不足"
                });
                break;
            }
            if (pData.clubcount == iMaxClubcount) {
                console.log('批准加入联盟-联盟数量达到上限，无法申请');
                pSocket.emit('approvealliance_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "联盟数量已达上限"
                });
                break;
            }

            alias = crypto.fromBase64(pData.alias);
            allianceid = pData.allianceid;
            alliancename = pData.sname;
            allianceclubid = pData.creatorclubid;

            res = await tb_alliance_club_upd_status_by_uid(conn, uid, 0);
            if (res.rowCount == 0) {
                console.log('批准加入联盟-更新状态失败');
                pSocket.emit('approvealliance_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "更新状态失败"
                });
                break;
            }

            res = await tb_alliance_upd_clubcount_inc(conn, allianceid, iMaxClubcount);
            if (res.rowCount == 0) {
                console.log('批准加入联盟-更新联盟成员数量失败');
                pSocket.emit('approvealliance_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "更新联盟成员数量失败"
                });
                break;
            }
            //conn, clubid, allianceid, allianceidOld, alliancename
            res = await tb_clubs_upd_allianceid(conn, clubid, allianceid, 0, alliancename);
            if (res.rowCount == 0) {
                console.log('批准加入联盟-更新俱乐部联盟数据失败');
                pSocket.emit('approvealliance_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "更新俱乐部联盟数据失败"
                });
                break;
            }

            res = await tb_club_upd_alliancemsgcount_dec(conn, allianceclubid);
            if (res.rowCount == 0) {
                console.log('批准加入联盟-更新消息数量失败');
                pSocket.emit('approvealliance_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "更新消息数量失败"
                });
                break;
            }

            res = await tb_joinmessage_del(conn, uid);
            if (res.rowCount == 0) {
                console.log('批准加入联盟-删除消息失败');
                pSocket.emit('approvealliance_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "删除提醒消息失败"
                });
                break;
            }

            sql = 'update tb_users set mymsgcount = 1 where userid = $1';
            res = await conn.Query(sql, [applyer]);
            if (res.rowCount == 0) {
                console.log('批准加入联盟-更新我的消息标记失败');
                pSocket.emit('approvealliance_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "更新我的消息标记失败"
                });
                break;
            }

            let title = JSON.stringify(alias + '同意了您加入联盟的申请');
            let msgs = JSON.stringify('你已经成功加入' + alliancename);
            sql = 'insert into tb_mymessage (userid,msgs,title) values($1,$2,$3)';
            res = await conn.Query(sql, [applyer, msgs, title]);
            if (res.rowCount == 0) {
                console.log('批准加入联盟-添加消息失败');
                pSocket.emit('approvealliance_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "添加消息失败"
                });
                break;
            }

            sql = 'select DISTINCT(roomid) from tb_club_rooms where allid = $1';//allianceid
            res = await conn.Query(sql, [allianceid]);
            for (let i = 0; i < res.rows.length; i++) {
                sql = 'insert into tb_club_rooms (allid,clubid,roomid) values($1,$2,$3)';
                await conn.Query(sql, [0, clubid, res.rows[i].roomid]);
            }

            let s = userMgr.GetSocketObj(applyer)
            if (s && s.connected) {
                s.emit('mymsg_result', {
                    wErrCode: ErrorCodes.ERR_NOERROR,
                    szErrMsg: "有新的消息"
                });
            }

            pSocket.emit('approvealliance_result', {
                wErrCode: ErrorCodes.ERR_NOERROR,
                szErrMsg: "批准加入联盟成功"
            });
            bError = false;

        } while (false);

    } catch (e) {
        console.log('批准加入联盟异常', e.message);
        pSocket.emit('approvealliance_result', {
            wErrCode: ErrorCodes.ERR_NOERROR,
            szErrMsg: "批准加入联盟异常"
        });
    } finally {
        if (bError) {
            await conn.Rollback();
        } else {
            await conn.Commit();
        }
        conn.Release();
    }
}
//拒绝加入联盟
async function refusedalliance(pSocket, pArgs) {
    console.log('拒绝加入联盟');
    let conn = new pgsql.conn();
    let bError = true;
    let iUserId = pSocket.iUserId;
    let uid = pArgs.uid;
    let applyer = 0;
    let clubid = 0;
    let alliancename = '';
    let allianceclubid = 0;
    let alias = '';

    try {
        do {
            await conn.Transaction();
            let sql = 'select * from tb_alliance_club where uid = $1';
            let res = await conn.Query(sql, [uid]);
            if (res.rowCount == 0) {
                console.log('拒绝加入联盟-申请记录未找到');
                pSocket.emit('refusedalliance_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "申请记录未找到"
                });
                break;
            }
            if (res.rows[0].status != 0) {
                console.log('拒绝加入联盟-申请已通过');
                pSocket.emit('refusedalliance_result', {
                    wErrCode: ErrorCodes.ERR_NOERROR,
                    szErrMsg: "申请已通过，无法拒绝"
                });
                break;
            }
            let pRecorder = res.rows[0];
            clubid = pRecorder.clubid;
            applyer = pRecorder.clubcreator;

            sql = 'SELECT \
                    tb_users."alias", \
                    tb_joinclubs.alliancelevel, \
                    tb_alliance.creatorclubid, \
                    tb_alliance.sname, \
                    tb_alliance.levels, \
                    tb_alliance.clubcount,\
                    tb_alliance_club.* \
                    FROM \
                        tb_joinclubs \
                    INNER JOIN tb_clubs ON tb_joinclubs.clubid = tb_clubs.clubid \
                    INNER JOIN tb_users ON tb_joinclubs.userid = tb_users.userid \
                    INNER JOIN tb_alliance ON tb_clubs.allianceid = tb_alliance.allianceid \
                    INNER JOIN tb_alliance_club ON tb_alliance.allianceid = tb_alliance_club.allianceid \
                    WHERE \
                        tb_clubs.allianceid > 0 \
                    AND tb_joinclubs.userid = $1 \
                    AND tb_alliance_club.clubid = tb_joinclubs.clubid \
                    order by tb_joinclubs.alliancelevel asc limit 1 offset 0';
            // sql = 'select tb_alliance_club.* ,tb_users.alias ,tb_alliance.creatorclubid,tb_alliance.sname, \
            //         tb_alliance.levels,tb_alliance.clubcount ,tb_joinclubs.alliancelevel from tb_alliance_club \
            //         inner join tb_users on tb_alliance_club.clubcreator = tb_users.userid \
            //         inner join tb_alliance on tb_alliance.allianceid = tb_alliance_club.allianceid \
            //         inner join tb_joinclubs on tb_joinclubs.userid = tb_users.userid and tb_joinclubs.clubid = tb_alliance_club.clubid \
            //         where clubcreator = $1';
            res = await conn.Query(sql, [iUserId]);
            if (res.rowCount == 0) {
                console.log('拒绝加入联盟-权限不足1');
                pSocket.emit('refusedalliance_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "权限不足"
                });
                break;
            }
            let pData = res.rows[0];
            if (pData.alliancelevel == 2) {
                console.log('批准加入联盟-权限不足');
                pSocket.emit('refusedalliance_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "权限不足"
                });
                break;
            }
            if (pData.allianceid != pRecorder.allianceid) {
                console.log('批准加入联盟-联盟数量达到上限，无法申请');
                pSocket.emit('refusedalliance_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "权限不足"
                });
                break;
            }

            alias = crypto.fromBase64(pData.alias);
            allianceid = pData.allianceid;
            alliancename = pData.sname;
            allianceclubid = pData.creatorclubid;

            res = await tb_alliance_club_del_by_uid(conn, uid);
            if (res.rowCount == 0) {
                console.log('拒绝加入联盟-删除申请记录失败');
                pSocket.emit('refusedalliance_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "删除申请记录失败"
                });
                break;
            }

            res = await tb_club_upd_alliancemsgcount_dec(conn, allianceclubid);
            if (res.rowCount == 0) {
                console.log('拒绝加入联盟-更新消息数量失败');
                pSocket.emit('refusedalliance_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "更新消息数量失败"
                });
                break;
            }

            res = await tb_joinmessage_del(conn, uid);
            if (res.rowCount == 0) {
                console.log('拒绝加入联盟-删除消息失败');
                pSocket.emit('refusedalliance_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "删除提醒消息失败"
                });
                break;
            }

            sql = 'update tb_users set mymsgcount = 1 where userid = $1';
            res = await conn.Query(sql, [applyer]);
            if (res.rowCount == 0) {
                console.log('批准加入联盟-更新我的消息标记失败');
                pSocket.emit('refusedalliance_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "更新我的消息标记失败"
                });
                break;
            }

            let title = JSON.stringify(alias + '拒绝了您加入联盟的申请');
            let msgs = JSON.stringify('加入' + alliancename + '被拒绝');
            sql = 'insert into tb_mymessage (userid,msgs,title) values($1,$2,$3)';
            res = await conn.Query(sql, [applyer, msgs, title]);
            if (res.rowCount == 0) {
                console.log('拒绝加入联盟-添加消息失败');
                pSocket.emit('refusedalliance_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "添加消息失败"
                });
                break;
            }

            let s = userMgr.GetSocketObj(applyer)
            if (s && s.connected) {
                s.emit('mymsg_result', {
                    wErrCode: ErrorCodes.ERR_NOERROR,
                    szErrMsg: "有新的消息"
                });
            }
            pSocket.emit('refusedalliance_result', {
                wErrCode: ErrorCodes.ERR_NOERROR,
                szErrMsg: "拒绝加入联盟成功"
            });
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
}

//申请加入联盟
async function applyalliance(pSocket, pArgs) {
    console.log('申请加入联盟');
    let conn = new pgsql.conn();
    let bError = true;
    let iUserId = pSocket.iUserId;
    let allianceid = pArgs.allianceid;
    try {
        do {
            await conn.Transaction();
            let club = await tb_clubs_sel(conn, iUserId);
            if (club.rowCount == 0) {
                console.log('申请加入联盟-不是俱乐部创建者，无法申请加入联盟');
                pSocket.emit('applyalliance_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "不是俱乐部创建者，无法申请加入联盟"
                });
                break;
            }
            if (club.rows[0].allianceid != 0) {
                console.log('申请加入联盟-已经加入其他联盟');
                pSocket.emit('applyalliance_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "已经加入其他联盟"
                });
                break;
            }
            let clubname = club.rows[0].sname;
            let creator = club.rows[0].creator;
            let clubid = club.rows[0].clubid;
            let alliance = await tb_alliance_sel_by_allianceid(conn, allianceid);
            if (alliance.rowCount == 0) {
                console.log('申请加入联盟-联盟未找到');
                pSocket.emit('applyalliance_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "联盟未找到"
                });
                break;
            }
            let iMaxClubcount = g_alliance_member_count[alliance.rows[0].levels];
            let allianceclubid = alliance.rows[0].creatorclubid;
            if (alliance.rows[0].allow_apply == 0) {
                console.log('申请加入联盟-不允许申请加入联盟');
                pSocket.emit('applyalliance_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "不允许申请加入联盟"
                });
                break;
            }
            if (alliance.rows[0].clubcount == iMaxClubcount) {
                console.log('申请加入联盟-数量达到上限');
                pSocket.emit('applyalliance_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "数量达到上限"
                });
                break;
            }
            let alliancename = alliance.rows[0].sname;
            let alliancecreator = alliance.rows[0].creator;
            alliance = await tb_alliance_club_sel_allianceid_clubid(conn, allianceid, clubid);
            if (alliance.rowCount > 0) {
                if (alliance.rows[0].status == 0) {
                    console.log('申请加入联盟-请勿重复提交');
                    pSocket.emit('applyalliance_result', {
                        wErrCode: ErrorCodes.ERR_INVALIDARGS,
                        szErrMsg: "请勿重复提交"
                    });
                } else {
                    console.log('申请加入联盟-已加入联盟');
                    pSocket.emit('applyalliance_result', {
                        wErrCode: ErrorCodes.ERR_INVALIDARGS,
                        szErrMsg: "已加入联盟"
                    });
                }
                break;
            }

            let alliance_club = await tb_alliance_club_add(conn, allianceid, clubid, creator, 0, 0, alliancecreator);
            if (alliance_club.rowCount == 0) {
                console.log('申请加入联盟-俱乐部关联失败');
                pSocket.emit('applyalliance_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "俱乐部关联失败"
                });
                break;
            }

            //这里获取所有的管理
            let clubid_allianceid = 'lm' + allianceid;
            res = await tb_joinmessage_add(conn, clubname, alliancename, '申请加入联盟', 1, alliancecreator, alliance_club.rows[0].uid, clubid_allianceid, allianceid, iUserId);
            if (res.rowCount == 0) {
                console.log('申请加入联盟-添加入盟消息失败');
                pSocket.emit('applyalliance_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "添加入盟消息失败"
                });
                break;
            }

            res = await tb_club_upd_alliancemsgcount_inc(conn, allianceclubid);
            if (res.rowCount == 0) {
                console.log('申请加入联盟-更新消息数量失败');
                pSocket.emit('applyalliance_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "更新消息数量失败"
                });
                break;
            }

            pSocket.emit('applyalliance_result', {
                wErrCode: ErrorCodes.ERR_NOERROR,
                szErrMsg: "申请成功",
                allianceid: allianceid
            });
            let sql = 'select tb_joinclubs.* from tb_joinclubs \
                inner join tb_alliance ON tb_joinclubs.clubid = tb_alliance.creatorclubid\
                where tb_alliance.allianceid = $1 and tb_joinclubs.alliancelevel < 2';
            res = await conn.Query(sql, [allianceid]);
            for (let i = 0; i < res.rows.length; i++) {
                let s = userMgr.GetSocketObj(res.rows[i].userid);
                if (s && s.connected) {
                    s.emit('newmsg_result', {
                        wErrCode: ErrorCodes.ERR_NOERROR,
                        szErrMsg: "有新的消息"
                    });
                }
            }

            bError = false
        } while (false);

    } catch (e) {
        console.log(e);
    } finally {
        if (bError) {
            await conn.Rollback();
        } else {
            await conn.Commit();
        }
        conn.Release();
    }
}

//获取联盟信息
async function getallianceinfo(pSocket, pArgs) {
    console.log('获取联盟信息');
    let conn = new pgsql.conn();
    let iUserId = pSocket.iUserId;
    let allianceid = pArgs.allianceid;
    try {
        do {
            let res = await tb_alliance_sel_by_allianceid(conn, allianceid);
            if (res.rowCount == 0) {
                console.log('联盟信息未找到');
                pSocket.emit('getallianceinfo_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "联盟信息未找到"
                });
                break;
            }
            let result = res.rows[0];
            let creatorclubid = result.creatorclubid;

            result.wErrCode = ErrorCodes.ERR_NOERROR;
            result.szErrMsg = "获取联盟信息成功";

            let sql = 'select count(*) as total from tb_joinclubs where clubid = $1 and alliancelevel < 2';
            res = await conn.Query(sql, [creatorclubid]);
            result.mgrcount = res.rows[0].total;

            result.iscreator = false;
            if (result.creator == iUserId) {
                result.iscreator = true;
            }
            result.maxclubcount = g_alliance_member_count[result.levels];
            result.maxmgrcount = g_alliance_member_count[result.levels];

            pSocket.emit('getallianceinfo_result', result);

        } while (false);
    } catch (e) {
        console.log(e.message);
    } finally {
        conn.Release();
    }
}

//获取联盟成员
async function getalliancemember(pSocket, pArgs) {
    let conn = new pgsql.conn();
    let iUserId = pSocket.iUserId;
    let allianceid = pArgs.allianceid;
    try {
        let res = await tb_view_alliance_club_sel_by_allianceid(conn, allianceid);
        pSocket.emit('getalliancemember_result', {
            wErrCode: ErrorCodes.ERR_NOERROR,
            szErrMsg: "获取数据成功",
            rows: res.rows
        });
    } catch (e) {
        console.log(e.message);
    } finally {
        conn.Release();
    }
}

//设置允许申请加入联盟
async function allowapply(pSocket, pArgs) {
    console.log('设置允许申请加入联盟');
    let conn = new pgsql.conn();
    let bError = true;
    let iUserId = pSocket.iUserId;
    let allianceid = pArgs.allianceid;
    let bAllow = pArgs.allow;
    try {
        do {

            let res = await tb_alliance_sel_by_allianceid(conn, allianceid);
            if (res.rowCount == 0) {
                //未找到
                console.log('设置允许申请加入联盟-联盟未找到');
                pSocket.emit('allowapply_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "设置允许申请加入联盟-联盟未找到"
                });
                break;
            }
            if (iUserId != res.rows[0].creator) {
                console.log('设置允许申请加入联盟-不是联盟长');
                pSocket.emit('allowapply_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "设置允许申请加入联盟-不是联盟长"
                });
                break;
            }
            if (bAllow) {
                await tb_alliance_upd_allow_apply(conn, allianceid, 1);
            } else {
                await tb_alliance_upd_allow_apply(conn, allianceid, 0);
            }

            pSocket.emit('allowapply_result', {
                wErrCode: ErrorCodes.ERR_NOERROR,
                szErrMsg: "设置成功"
            });

            bError = false;

        } while (false);

    } catch (e) {
        console.log(e.message);
    } finally {
        conn.Release();
    }
}

//任命联盟管理员
async function setallianceadmin(pSocket, pArgs) {
    let conn = new pgsql.conn();
    let bError = true;
    let iUserId = pSocket.iUserId;
    let allow = pArgs.allow;
    let memberid = pArgs.memberid;
    let clubid = pArgs.clubid;
    try {
        do {

            let res = await tb_alliance_sel_by_creator(conn, iUserId);
            if (res.rowCount == 0) {
                console.log('不是联盟超级管理员，无法任命联盟管理员');
                pSocket.emit('setallianceadmin_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "不是联盟长，无法任命联盟管理员",
                    allow: allow,
                    memberid: memberid
                });
                break;
            }
            if (memberid == iUserId) {
                pSocket.emit('setallianceadmin_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "自己不能任命自己",
                    allow: allow,
                    memberid: memberid
                });
                console.log('自己不能任命自己');
                break;
            }
            //直属人员
            if (clubid != res.rows[0].creatorclubid) {
                pSocket.emit('setallianceadmin_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "不是直属自己俱乐部成员任命为联盟管理员",
                    allow: allow,
                    memberid: memberid
                });
                console.log('不是直属自己俱乐部成员任命为联盟管理员');
                break;
            }
            let allianceid = res.rows[0].allianceid;
            let alliancelevel = 2;
            if (allow) {
                alliancelevel = 1;
            }
            let iMaxCount = g_alliance_member_count[res.rows[0].levels];
            let sql = 'select * from tb_joinclubs where clubid = $1 and userid = $2';
            res = await conn.Query(sql, [clubid, memberid]);
            if (res.rowCount == 0) {
                pSocket.emit('setallianceadmin_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "任命联盟管理员失败",
                    allow: allow,
                    memberid: memberid
                });
                break;
            }

            if (res.rows[0].alliancelevel == alliancelevel) {
                bError = false;
                pSocket.emit('setallianceadmin_result', {
                    wErrCode: ErrorCodes.ERR_NOERROR,
                    szErrMsg: "任命联盟管理成功",
                    allow: allow,
                    memberid: memberid
                });
                break;
            }

            // if (allow) {
            //     res = await tb_alliance_upd_admincount_inc(conn, allianceid, iMaxClubcount);
            // } else {
            //     res = await tb_alliance_upd_admincount_dec(conn, allianceid);
            // }
            // if (res.rowCount == 0) {
            //     pSocket.emit('setallianceadmin_result', {
            //         wErrCode: ErrorCodes.ERR_INVALIDARGS,
            //         szErrMsg: "任命联盟管理失败",
            //         allow: allow
            //     });
            //     break;
            // }

            res = await tb_joinclubs_upd_alliancelevel_by_userid_clubid(conn, alliancelevel, memberid, clubid);
            if (res.rowCount == 0) {
                console.log('任命联盟管理员失败');
                pSocket.emit('setallianceadmin_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "任命联盟管理员失败",
                    allow: allow,
                    memberid: memberid
                });
                break;
            }

            sql = 'select count(*) as total from tb_joinclubs where clubid = $1 and alliancelevel < 2';
            res = await conn.Query(sql, [clubid]);
            if (res.rows[0].total > iMaxCount) {
                console.log('任命联盟管理员失败,联盟管理已达上限');
                pSocket.emit('setallianceadmin_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "联盟管理已达上限",
                    allow: allow,
                    memberid: memberid
                });
                break;
            }

            bError = false;
            pSocket.emit('setallianceadmin_result', {
                wErrCode: ErrorCodes.ERR_NOERROR,
                szErrMsg: "任命联盟管理成功",
                allow: allow,
                memberid: memberid
            });

        } while (false);

    } catch (e) {
        console.log(e.message);
    } finally {
        conn.Release();
    }
}


//退出联盟
async function exitalliance(pSocket, pArgs) {
    let conn = new pgsql.conn();
    let bError = true;
    let iUserId = pSocket.iUserId;
    let allianceid = pArgs.allianceid;
    try {
        do {
            await conn.Transaction();

            let res = await tb_alliance_club_sel_allianceid_clubcreator(conn, allianceid, iUserId);
            if (res.rowCount == 0) {
                pSocket.emit('exitalliance_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "联盟信息未找到"
                });
                console.log('联盟信息未找到');
                break;
            }
            if (iUserId == res.rows[0].alliancecreator) {
                pSocket.emit('exitalliance_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "联盟长不能退出联盟"
                });
                console.log('联盟长不能退出联盟');
                break;
            }
            let uid = res.rows[0].uid;
            let clubid = res.rows[0].clubid;

            res = await tb_alliance_club_del_by_uid(conn, uid);
            if (res.rowCount == 0) {
                pSocket.emit('exitalliance_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "删除联盟失败"
                });
                console.log('删除联盟失败');
                break;
            }

            res = await tb_clubs_upd_allianceid(conn, clubid, 0, allianceid, '');
            if (res.rowCount == 0) {
                pSocket.emit('exitalliance_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "更新俱乐部联盟数据失败"
                });
                console.log('更新俱乐部联盟数据失败');
                break;
            }

            res = await tb_alliance_upd_clubcount_dec(conn, allianceid);
            if (res.rowCount == 0) {
                pSocket.emit('exitalliance_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "删除联盟失败，更新俱乐部总数失败"
                });
                console.log('删除联盟失败，更新俱乐部总数失败');
                break;
            }

            bError = false;

            pSocket.emit('exitalliance_result', {
                wErrCode: ErrorCodes.ERR_INVALIDARGS,
                szErrMsg: "退出联盟成功"
            });
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
}
//踢出联盟
async function kickalliance(pSocket, pArgs) {
    let conn = new pgsql.conn();
    let bError = true;
    let iUserId = pSocket.iUserId;
    let uid = pArgs.uid;
    try {
        do {
            await conn.Transaction();

            let sql = 'select tb_alliance.creatorclubid ,tb_alliance_club.clubid ,\
                        tb_alliance_club.allianceid ,tb_alliance_club.clubcreator \
                        from tb_alliance_club \
                        inner join tb_alliance on tb_alliance.allianceid = tb_alliance_club.allianceid \
                        where tb_alliance_club.uid = $1';
            let res = await conn.Query(sql, [uid]);
            if (res.rowCount == 0) {
                console.log('未找到联盟信息');
                pSocket.emit('kickalliance_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "未找到联盟信息"
                });
                break;
            }
            let clubid = res.rows[0].clubid;
            let allianceid = res.rows[0].allianceid;
            let applyer = res.rows[0].clubcreator;
            let creatorclubid = res.rows[0].creatorclubid;
            if (applyer == iUserId) {
                pSocket.emit('kickalliance_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "自己不能踢自己"
                });
                break;
            }
            //获取被踢者信息

            let btUserQX = await getUserQX(conn, applyer, allianceid, clubid);
            if (btUserQX.rowCount == 0) {
                pSocket.emit('kickalliance_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "未获取到被踢者记录"
                });
                break;
            }
            if (btUserQX.rows[0].alliancelevel == 0) {
                pSocket.emit('kickalliance_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "不能踢联盟长"
                });
                break;
            }

            res = await getUserQX(conn, iUserId, allianceid, creatorclubid);
            if (res.rowCount == 0) {
                console.log('权限不足');
                pSocket.emit('kickalliance_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "权限不足"
                });
                break;
            }
            if (res.rows[0].alliancelevel == 2) {
                console.log('权限不足');
                pSocket.emit('kickalliance_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "权限不足"
                });
                break;
            }

            if (res.rows[0].alliancelevel == btUserQX.rows[0].alliancelevel) {
                console.log('权限不足');
                pSocket.emit('kickalliance_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "权限不足"
                });
                break;
            }

            let alias = crypto.fromBase64(res.rows[0].alias);
            let alliancename = res.rows[0].alliancename;

            res = await tb_alliance_club_del_by_uid(conn, uid);
            if (res.rowCount == 0) {
                pSocket.emit('kickalliance_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "踢出联盟失败"
                });
                console.log('踢出联盟失败');
                break;
            }

            res = await tb_clubs_upd_allianceid(conn, clubid, 0, allianceid, '');
            if (res.rowCount == 0) {
                pSocket.emit('kickalliance_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "更新俱乐部联盟数据失败"
                });
                console.log('更新俱乐部联盟数据失败');
                break;
            }

            res = await tb_alliance_upd_clubcount_dec(conn, allianceid);
            if (res.rowCount == 0) {
                pSocket.emit('kickalliance_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "删除联盟失败，更新俱乐部总数失败"
                });
                console.log('删除联盟失败，更新俱乐部总数失败');
                break;
            }

            sql = 'update tb_users set mymsgcount = 1 where userid = $1';
            res = await conn.Query(sql, [applyer]);
            if (res.rowCount == 0) {
                console.log('删除联盟失败-更新我的消息标记失败');
                pSocket.emit('kickalliance_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "更新我的消息标记失败"
                });
                break;
            }

            let title = JSON.stringify(alias + '把你踢出了联盟');
            let msgs = JSON.stringify('你已经被踢出' + alliancename + '联盟');
            sql = 'insert into tb_mymessage (userid,msgs,title) values($1,$2,$3)';
            res = await conn.Query(sql, [applyer, msgs, title]);
            if (res.rowCount == 0) {
                console.log('删除联盟失败-添加消息失败');
                pSocket.emit('kickalliance_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "添加消息失败"
                });
                break;
            }

            bError = false;

            let s = userMgr.GetSocketObj(applyer)
            if (s && s.connected) {
                s.emit('mymsg_result', {
                    wErrCode: ErrorCodes.ERR_NOERROR,
                    szErrMsg: "有新的消息"
                });
            }

            pSocket.emit('kickalliance_result', {
                wErrCode: ErrorCodes.ERR_NOERROR,
                szErrMsg: "踢出联盟成功"
            });

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
}
//升级联盟
async function upgradalliance(pSocket, pArgs) {
    let conn = new pgsql.conn();
    let bError = true;
    let iUserId = pSocket.iUserId;
    let levels = pArgs.levels;
    try {
        do {
            await conn.Transaction();
            let diamond = g_alliance_upgrad_diamond[levels - 1];
            if (undefined == diamond) {
                pSocket.emit('upgradalliance_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "升级等级不正确"
                });
                console.log('升级等级不正确');
                break;
            }
            let res = await tb_users_sel(conn, iUserId);
            if (res.rowCount == 0) {
                pSocket.emit('upgradalliance_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "用户未找到"
                });
                console.log('用户未找到');
                break;
            }
            if (res.rows[0].gems < diamond) {
                pSocket.emit('upgradalliance_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "钻石不足"
                });
                console.log('钻石不足');
                break;
            }
            res = await tb_alliance_upd_levels(conn, levels, iUserId);
            if (res.rowCount == 0) {
                pSocket.emit('upgradalliance_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "更新联盟等级失败"
                });
                console.log('更新联盟等级失败');
                break;
            }
            res = await tb_users_upd_gems_dec(conn, diamond, iUserId);
            if (res.rowCount == 0) {
                pSocket.emit('upgradalliance_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "扣除钻石失败"
                });
                console.log('扣除钻石失败');
                break;
            }

            bError = false;

            pSocket.emit('upgradalliance_result', {
                wErrCode: ErrorCodes.ERR_NOERROR,
                szErrMsg: "升级联盟成功"
            });

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
}

async function joinmsg(pSocket, pArgs) {
    let conn = new pgsql.conn();
    let bError = true;
    let iUserId = pSocket.iUserId;
    try {
        //查找该用户是否是俱乐部管理
        //根据用户查询allianceid
        let to_tsquery = [];
        let sql = 'select tb_joinclubs.*,tb_alliance.allianceid from tb_joinclubs \
        left join tb_alliance ON tb_joinclubs.clubid = tb_alliance.creatorclubid\
        where tb_joinclubs.userid = $1 and (clublevel < 2 or alliancelevel < 2)';

        res = await conn.Query(sql, [iUserId]);
        if (res.rowCount > 0) {
            for (let i = 0; i < res.rows.length; i++) {
                let sk = 'jlb' + res.rows[i].clubid;
                if (res.rows[i].clublevel < 2) {
                    to_tsquery.push(sk);
                }
                if (null != res.rows[i].allianceid && res.rows[i].alliancelevel < 2) {
                    sk = 'lm' + res.rows[i].allianceid;
                    to_tsquery.push(sk);
                }
            }
        }
        let rows = [];
        if (to_tsquery.length > 0) {
            sql = 'select * FROM tb_joinmessage WHERE clubid_allianceid @@ to_tsquery($1)';
            res = await conn.Query(sql, [to_tsquery.join('|')]);
            rows = res.rows;
        }

        res = await tb_joinmessage_sel(conn, iUserId);
        pSocket.emit('joinmsg_result', {
            wErrCode: ErrorCodes.ERR_NOERROR,
            szErrMsg: "成功",
            rows: rows
        });
    } catch (e) {
        console.log(e.message);
    } finally {
        conn.Release();
    }
}

async function setalliancememo(pSocket, pArgs) {
    let conn = new pgsql.conn();
    let iUserId = pSocket.iUserId;
    let memo = pArgs.memo;
    let allianceid = pArgs.allianceid;
    try {
        do {
            let sql = 'update tb_alliance set memo = $1 where creator = $2 and allianceid = $3';
            let res = await conn.Query(sql, [memo, iUserId, allianceid]);
            if (res.rowCount == 0) {
                pSocket.emit('setalliancememo_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "失败"
                });
                break;
            }
            pSocket.emit('setalliancememo_result', {
                wErrCode: ErrorCodes.ERR_NOERROR,
                szErrMsg: "成功"
            });
        } while (false);

    } catch (e) {
        console.log(e.message);
    } finally {
        conn.Release();
    }
}

module.exports = {
    upgradclub: upgradclub,
    createalliance: createalliance,
    dissolvedalliance: dissolvedalliance,
    allowapply: allowapply,
    getallianceinfo: getallianceinfo,
    getalliancemember: getalliancemember,
    approvealliance: approvealliance,
    refusedalliance: refusedalliance,
    applyalliance: applyalliance,
    setallianceadmin: setallianceadmin,
    exitalliance: exitalliance,
    kickalliance: kickalliance,
    upgradalliance: upgradalliance,
    joinmsg: joinmsg,
    setalliancememo: setalliancememo
}


async function getUserQX(conn, iUserId, allianceid, creatorclubid) {
    let sql = 'SELECT \
                        tb_users."alias", \
                        tb_users.clubid AS userclubid, \
                        tb_joinclubs.clubid AS joinclubid, \
                        tb_joinclubs.userid, \
                        tb_joinclubs.alliancelevel, \
                        tb_clubs.allianceid, \
                        tb_alliance.sname AS alliancename \
                    FROM \
                        tb_users \
                    INNER JOIN tb_joinclubs ON tb_joinclubs.userid = tb_users.userid \
                    INNER JOIN tb_clubs ON tb_clubs.clubid = tb_joinclubs.clubid \
                    INNER JOIN tb_alliance ON tb_alliance.allianceid = tb_clubs.allianceid \
                    WHERE \
                        tb_users.userid = $1 AND \
                        tb_alliance.allianceid = $2 AND \
                        tb_joinclubs.clubid = $3';
    return await conn.Query(sql, [iUserId, allianceid, creatorclubid]);
}