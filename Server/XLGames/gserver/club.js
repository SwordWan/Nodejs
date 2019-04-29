let pgsql = require('../utils/pgsqlCC');
let ErrorUtils = require("../utils/ErrorCodes");
let ConstCodes = require('../utils/const');
let userMgr = require("./usermgr");
let crypto = require('../utils/crypto');
let DB = require('../utils/db');
let ErrorCodes = ErrorUtils.ErrorCodes;
let g_gold = ConstCodes.ChongZhi_JinBi;//充值一次增加金币
let g_diamond = ConstCodes.ChongZhi_ZuanShi;//充值一次消耗钻石

let g_club_level_number = { "1": 100, "2": 200, "3": 300, "4": 400, "5": 600, "6": 800, "7": 1000, "8": 1200, "9": 1500 }

async function joinclub(pSocket, pArgs) {
    let conn = new pgsql.conn();
    let bError = true;
    let iUserId = pSocket.iUserId;
    let iClubId = pArgs.iClubId;
    try {
        await conn.Transaction();
        do {

            let sql = 'SELECT * FROM tb_users WHERE userid = $1';
            let res = await conn.Query(sql, [iUserId]);
            if (res.rowCount == 0) {
                console.log('用户不存在');
                pSocket.emit("joinclub_result", {
                    wErrCode: ErrorCodes.ERR_CLUBISNOTEXISTS,
                    szErrMsg: "俱乐部不存在"
                });
                break;
            }
            let pUserInfo = res.rows[0];

            sql = 'SELECT * FROM tb_clubs WHERE clubid = $1';
            res = await conn.Query(sql, [iClubId]);
            if (res.rowCount == 0) {
                console.log('俱乐部不存在');
                pSocket.emit("joinclub_result", {
                    wErrCode: ErrorCodes.ERR_CLUBISNOTEXISTS,
                    szErrMsg: "俱乐部不存在"
                });
                break;
            }
            let pClubInfo = res.rows[0];
            if (pSocket.iUserId == pClubInfo.creator) {
                console.log('自己无法加入自己创建的俱乐部');
                pSocket.emit("joinclub_result", {
                    wErrCode: ErrorCodes.ERR_CLUBISNOTEXISTS,
                    szErrMsg: "自己无法加入自己创建的俱乐部"
                });
                break;
            }

            sql = "select * from tb_joinclubs where userid = $1 and clubid = $2";
            res = await conn.Query(sql, [iUserId, iClubId]);
            if (res.rowCount != 0) {
                console.log('请勿重复提交');
                pSocket.emit("joinclub_result", {
                    wErrCode: ErrorCodes.ERR_INVOKE_FALIED,
                    szErrMsg: "请勿重复提交"
                });
                break;
            }
            sql = "insert into tb_joinclubs(userid, clubid ,status) values($1, $2 ,0) RETURNING uid";
            res = await conn.Query(sql, [iUserId, iClubId]);
            if (res.rowCount == 0) {
                console.log('加入俱乐部失败1');
                pSocket.emit("joinclub_result", {
                    wErrCode: ErrorCodes.ERR_INVOKE_FALIED,
                    szErrMsg: "加入俱乐部失败"
                });
                break;
            }
            let uid = res.rows[0].uid;

            sql = 'select count(*) as total from tb_joinclubs where clubid = $1'
            res = await conn.Query(sql, [iClubId]);
            if (res.rows[0].total > g_club_level_number[pClubInfo.levels]) {
                console.log('加入俱乐部失败1');
                pSocket.emit("joinclub_result", {
                    wErrCode: ErrorCodes.ERR_INVOKE_FALIED,
                    szErrMsg: "俱乐部人数达到上限"
                });
                break;
            }


            let clubid_allianceid = 'jlb' + iClubId;
            //sql = 'INSERT INTO tb_joinmessage ("fromname","toname","desc","type" ,"userid", "uid",clubid_allianceid) VALUES($1 ,$2 ,$3 ,$4 ,$5, $6 ,$7)';
            //res = await conn.Query(sql, [crypto.fromBase64(pUserInfo.alias), pClubInfo.sname, '加入俱乐部', 2, pClubInfo.creator, uid, clubid_allianceid]);
            sql = 'INSERT INTO tb_joinmessage ("fromname","toname","desc","type" ,"userid", "uid",clubid_allianceid,clubid_or_allianceid,join_userid) VALUES($1 ,$2 ,$3 ,$4 ,$5, $6 ,$7 ,$8 ,$9)';
            res = await conn.Query(sql, [crypto.fromBase64(pUserInfo.alias), pClubInfo.sname, '加入俱乐部', 2, pClubInfo.creator, uid, clubid_allianceid, iClubId, iUserId]);
            if (res.rowCount == 0) {
                console.log('加入俱乐部失败3');
                pSocket.emit("joinclub_result", {
                    wErrCode: ErrorCodes.ERR_INVOKE_FALIED,
                    szErrMsg: "申请加入俱乐部失败"
                });
                break;
            }

            sql = 'update tb_clubs set msgcount = msgcount + 1 where clubid = $1';
            res = await conn.Query(sql, [iClubId]);
            if (res.rowCount == 0) {
                console.log('批准加入俱乐部失败，更新状态失败');
                pSocket.emit('joinclub_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "申请加入俱乐部失败"
                });
                break;
            }
            sql = 'select * from tb_joinclubs where clubid = $1 and clublevel < 2';
            res = await conn.Query(sql, [iClubId]);
            for (let i = 0; i < res.rows.length; i++) {
                let s = userMgr.GetSocketObj(res.rows[i].userid);
                if (s && s.connected) {
                    s.emit('newmsg_result', {
                        wErrCode: ErrorCodes.ERR_NOERROR,
                        szErrMsg: "有新的消息"
                    });
                }
            }
            bError = false;
            pSocket.emit("joinclub_result", {
                wErrCode: ErrorCodes.ERR_NOERROR,
                szErrMsg: "等待管理员批准",
                iClubId: pClubInfo.clubid,
                iCreator: pClubInfo.creator,
                szDesc: pClubInfo.desc,
                iLevels: pClubInfo.levels,
                iGolds: pClubInfo.golds,
                iActivity: pClubInfo.activity,
                iJiFen: pClubInfo.jifen,
                tmCreate: pClubInfo.ctime
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
//批准加入俱乐部
async function approveclub(pSocket, pArgs) {
    let conn = new pgsql.conn();
    let bError = true;
    let iUserId = pSocket.iUserId;
    let uid = pArgs.uid;
    try {
        await conn.Transaction();
        do {
            let sql = 'select a.* ,b.alias from tb_joinclubs as a \
                        inner join tb_users as b on a.userid = b.userid  where uid = $1';
            let res = await conn.Query(sql, [uid]);
            if (res.rowCount == 0) {
                console.log('批准加入俱乐部，申请记录未找到', uid);
                pSocket.emit('approveclub_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "申请记录未找到"
                });
                /*
                bError = false;
                sql = 'select * from tb_joinmessage where uid = $1 and "type" = $2';
                res = await conn.Query(sql, [uid, '2']);
                if (res.rowCount > 0) {
                    sql = 'delete from tb_joinmessage where uid = $1 and "type" = $2';
                    await conn.Query(sql, [uid, '2']);
                    sql = 'update tb_clubs set msgcount = msgcount - 1 where clubid = $1 and msgcount - 1 >= 0';
                    await conn.Query(sql, [res.rows[0].clubid_or_allianceid]);
                }
                */
                break;
            }
            if (res.rows[0].status == 1) {
                console.log('批准加入俱乐部，已经加入俱乐部');
                pSocket.emit('approveclub_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "已经加入俱乐部"
                });
                break;
            }
            let clubid = res.rows[0].clubid;
            let applyer = res.rows[0].userid;
            let alias = crypto.fromBase64(res.rows[0].alias);
            let forsearch = [];
            getGroup2(alias.split(''), forsearch);
            forsearch.push(applyer);
            forsearch = forsearch.join(' ');

            sql = 'select a.clublevel,b.alias, c.sname as clubname from tb_joinclubs as a \
                    inner join tb_users as b on a.userid = b.userid \
                    inner join tb_clubs as c on a.clubid = c.clubid where a.userid = $1 and a.clubid = $2';
            res = await conn.Query(sql, [iUserId, clubid]);
            if (res.rowCount == 0) {
                console.log('批准加入俱乐部，数据为找到');
                pSocket.emit('approveclub_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "权限不足"
                });
                break;
            }
            if (res.rows[0].clublevel == 2) {
                console.log('批准加入俱乐部，不是管理');
                pSocket.emit('approveclub_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "权限不足"
                });
                break;
            }

            alias = crypto.fromBase64(res.rows[0].alias);
            let clubname = res.rows[0].clubname;


            sql = 'update tb_joinclubs set status = 1 ,forsearch = $1 where uid = $2';
            res = await conn.Query(sql, [forsearch, uid]);
            if (res.rowCount == 0) {
                console.log('批准加入俱乐部失败，更新状态失败');
                pSocket.emit('approveclub_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "批准加入俱乐部失败"
                });
                break;
            }

            sql = 'update tb_clubs set unums = unums + 1, msgcount = msgcount - 1 ,unumstime = now() where clubid = $1 and msgcount - 1 >= 0';
            res = await conn.Query(sql, [clubid]);
            if (res.rowCount == 0) {
                console.log('批准加入俱乐部失败，更新状态失败');
                pSocket.emit('approveclub_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "批准加入俱乐部失败"
                });
                break;
            }

            sql = 'delete from tb_joinmessage where uid = $1 and "type" = $2';
            res = await conn.Query(sql, [uid, '2']);
            if (res.rowCount == 0) {
                console.log('加入俱乐部失败，更新状态失败');
                pSocket.emit('approveclub_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "批准申请加入俱乐部失败"
                });
                break;
            }

            sql = 'update tb_users set mymsgcount = 1 where userid = $1';
            res = await conn.Query(sql, [applyer]);
            if (res.rowCount == 0) {
                console.log('批准加入俱乐部-更新我的消息标记失败');
                pSocket.emit('approveclub_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "更新我的消息标记失败"
                });
                break;
            }

            let title = JSON.stringify(alias + '同意了您加入俱乐部的申请');
            let msgs = JSON.stringify('你已经成功加入' + clubname);
            sql = 'insert into tb_mymessage (userid,msgs,title) values($1,$2,$3)';
            res = await conn.Query(sql, [applyer, msgs, title]);
            if (res.rowCount == 0) {
                console.log('批准加入俱乐部-添加消息失败');
                pSocket.emit('approveclub_result', {
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

            pSocket.emit('approveclub_result', {
                wErrCode: ErrorCodes.ERR_NOERROR,
                szErrMsg: "批准加入俱乐部成功"
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
//拒绝加入俱乐部
async function refuseclub(pSocket, pArgs) {
    let conn = new pgsql.conn();
    let bError = true;
    let iUserId = pSocket.iUserId;
    let uid = pArgs.uid;
    try {
        await conn.Transaction();
        do {
            let sql = 'select clubid ,userid from tb_joinclubs where uid = $1';
            let res = await conn.Query(sql, [uid]);
            if (res.rowCount == 0) {
                console.log('拒绝加入俱乐部，申请记录未找到', uid);
                pSocket.emit('approveclub_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "申请记录未找到"
                });
                /*
                bError = false;
                sql = 'select * from tb_joinmessage where uid = $1 and "type" = $2';
                res = await conn.Query(sql, [uid, '2']);
                if (res.rowCount > 0) {
                    sql = 'delete from tb_joinmessage where uid = $1 and "type" = $2';
                    await conn.Query(sql, [uid, '2']);
                    sql = 'update tb_clubs set msgcount = msgcount - 1 where clubid = $1 and msgcount - 1 >= 0';
                    await conn.Query(sql, [res.rows[0].clubid_or_allianceid]);
                }
                */
                break;
            }
            if (res.rows[0].status == 1) {
                console.log('拒绝加入俱乐部，已经加入俱乐部');
                pSocket.emit('approveclub_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "已经加入俱乐部"
                });
                break;
            }
            let clubid = res.rows[0].clubid;
            let applyer = res.rows[0].userid;

            sql = 'select a.clublevel,b.alias, c.sname as clubname from tb_joinclubs as a \
                    inner join tb_users as b on a.userid = b.userid \
                    inner join tb_clubs as c on a.clubid = c.clubid where a.userid = $1 and a.clubid = $2';
            res = await conn.Query(sql, [iUserId, clubid]);
            if (res.rowCount == 0) {
                console.log('拒绝加入俱乐部，数据为找到');
                pSocket.emit('approveclub_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "权限不足"
                });
                break;
            }
            if (res.rows[0].clublevel == 2) {
                console.log('拒绝加入俱乐部，不是管理');
                pSocket.emit('approveclub_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "权限不足"
                });
                break;
            }

            let alias = crypto.fromBase64(res.rows[0].alias);
            let clubname = res.rows[0].clubname;

            sql = 'delete from tb_joinclubs where uid = $1';
            res = await conn.Query(sql, [uid]);
            if (res.rowCount == 0) {
                console.log('拒绝加入俱乐部失败，删除记录失败');
                pSocket.emit('refuseclub_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "拒绝加入俱乐部失败"
                });
                break;
            }

            sql = 'update tb_clubs set msgcount = msgcount - 1 where clubid = $1 and msgcount - 1 >= 0';
            res = await conn.Query(sql, [clubid]);
            if (res.rowCount == 0) {
                console.log('拒绝加入俱乐部失败，更新状态失败');
                pSocket.emit('refuseclub_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "拒绝加入俱乐部失败"
                });
                break;
            }

            sql = 'delete from tb_joinmessage where uid = $1 and "type" = $2';
            res = await conn.Query(sql, [uid, '2']);
            if (res.rowCount == 0) {
                console.log('拒绝加入俱乐部失败，删除消息失败');
                pSocket.emit('refuseclub_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "拒绝加入俱乐部失败，删除消息失败"
                });
                break;
            }

            sql = 'update tb_users set mymsgcount = 1 where userid = $1';
            res = await conn.Query(sql, [applyer]);
            if (res.rowCount == 0) {
                console.log('拒绝加入俱乐部-更新我的消息标记失败');
                pSocket.emit('refuseclub_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "更新我的消息标记失败"
                });
                break;
            }

            let title = JSON.stringify(alias + '拒绝了您加入俱乐部的申请');
            let msgs = JSON.stringify('加入' + clubname + '俱乐部被拒绝');
            sql = 'insert into tb_mymessage (userid,msgs,title) values($1,$2,$3)';
            res = await conn.Query(sql, [applyer, msgs, title]);
            if (res.rowCount == 0) {
                console.log('批准加入联盟-添加消息失败');
                pSocket.emit('refuseclub_result', {
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

            pSocket.emit('refuseclub_result', {
                wErrCode: ErrorCodes.ERR_NOERROR,
                szErrMsg: "拒绝加入俱乐部操作成功"
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
//设置俱乐部管理员
async function setclubadmin(pSocket, pArgs) {
    let conn = new pgsql.conn();
    let bError = true;
    let iUserId = pSocket.iUserId;
    let allow = pArgs.allow;
    let memberid = pArgs.memberid;
    let clubid = pArgs.clubid;
    try {
        do {
            let sql = 'select tb_joinclubs.* ,tb_clubs.creator ,tb_clubs.adminusers from tb_joinclubs inner join tb_clubs on tb_joinclubs.clubid = tb_clubs.clubid \
                     where tb_joinclubs.userid = $1 and tb_joinclubs.clubid = $2';
            let res = await conn.Query(sql, [memberid, clubid]);
            if (res.rowCount == 0) {
                console.log('设置管理员失败 ,记录未找到');
                pSocket.emit('setclubadmin_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "设置管理员失败[1]",
                    allow: allow,
                    memberid: memberid
                });
                break;
            }
            let pData = res.rows[0];
            if (pData.creator != iUserId) {
                console.log('设置管理员失败，不是管理员');
                pSocket.emit('setclubadmin_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "权限不足",
                    allow: allow,
                    memberid: memberid
                });
                break;
            }
            if (pData.status == 0) {
                console.log('设置管理员失败，申请未通过');
                pSocket.emit('setclubadmin_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "该玩家正在等待批准加入",
                    allow: allow,
                    memberid: memberid
                });
                break;
            }
            if (pData.clublevel == 0) {
                console.log('无法设置自己');
                pSocket.emit('setclubadmin_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "自己不能设置自己",
                    allow: allow,
                    memberid: memberid
                });
            }
            let doUpdate = false;
            if (pData.clublevel == 2) {
                if (allow) {
                    doUpdate = true;
                }
            }
            if (pData.clublevel == 1) {
                if (!allow) {
                    doUpdate = true;
                }
            }
            if (doUpdate) {
                sql = 'update tb_joinclubs set clublevel = 2 where userid = $1 and clubid = $2 and clublevel = 1';
                if (allow) {
                    sql = 'update tb_joinclubs set clublevel = 1 where userid = $1 and clubid = $2 and clublevel = 2';
                }
                res = await conn.Query(sql, [memberid, clubid]);
                if (res.rowCount == 0) {
                    console.log('设置管理员失败，更新状态失败');
                    pSocket.emit('setclubadmin_result', {
                        wErrCode: ErrorCodes.ERR_INVALIDARGS,
                        szErrMsg: "更新状态失败",
                        allow: allow,
                        memberid: memberid
                    });
                    break;
                }
            }



            pSocket.emit('setclubadmin_result', {
                wErrCode: ErrorCodes.ERR_NOERROR,
                szErrMsg: "任命俱乐部管理成功",
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
//获取成员列表
async function getclubusers(pSocket, pArgs) {
    let conn = new pgsql.conn()
    let szName = pArgs.szName;
    let clubid = pArgs.clubid;

    let pagesize = 50;
    let page = 1;
    // let page = parseInt(pArgs.page);
    // if (isNaN(page) || page <= 0) {
    //     page = 1;
    // }
    try {
        for (; ;) {
            let _page = page - 1;
            let params = [clubid];
            let sql = "SELECT tb_joinclubs.*,tb_users.lastlogintime,tb_users.extdata, tb_users.alias, \
                tb_users.headico, tb_monthplaytimes.playtimes as yuejushu \
                FROM tb_joinclubs inner join tb_users on \
                tb_joinclubs.userid = tb_users.userid \
                left join tb_monthplaytimes on \
                tb_monthplaytimes.userid = tb_joinclubs.userid and tb_monthplaytimes.ctime = to_char(now(), 'yyyymm') WHERE \
                tb_joinclubs.clubid = $1 and tb_joinclubs.status = 1 ORDER BY ctime asc LIMIT $2 OFFSET $3";
            if (undefined != szName && szName.length > 0) {
                sql = "SELECT tb_joinclubs.*,tb_users.lastlogintime,tb_users.extdata, tb_users.alias, \
                tb_users.headico, tb_monthplaytimes.playtimes as yuejushu \
                FROM tb_joinclubs inner join tb_users on \
                tb_joinclubs.userid = tb_users.userid \
                left join tb_monthplaytimes on \
                tb_monthplaytimes.userid = tb_joinclubs.userid and tb_monthplaytimes.ctime = to_char(now(), 'yyyymm') \
                WHERE tb_joinclubs.clubid = $1 and tb_joinclubs.status = 1  \
                and tb_joinclubs.forsearch @@ plainto_tsquery($2) ORDER BY ctime asc LIMIT $3 OFFSET $4";
                params.push(szName);
            }
            params.push(pagesize);
            params.push(_page * pagesize);
            let res = await conn.Query(sql, params);
            let date = new Date();
            let y = date.getFullYear();
            let m = fmtMonth(date.getMonth());
            let ym = y + '' + m;
            for (let i = 0; i < res.rows.length; i++) {
                res.rows[i].alias = crypto.fromBase64(res.rows[i].alias);
                res.rows[i].online = true;
                res.rows[i].extdata = DB.get_user_extdata(res.rows[i]);
                if (undefined == userMgr.GetSocketObj(res.rows[i].userid)) {
                    res.rows[i].online = false;
                }
                if (null == res.rows[i].lastlogintime) {
                    res.rows[i].lastlogintime = 0;
                } else {
                    res.rows[i].lastlogintime = res.rows[i].lastlogintime.getTime();
                }

                if (ym == res.rows[i].extdata.szTime) {
                    res.rows[i].yuejushu = res.rows[i].extdata.iTotoY;
                } else {
                    res.rows[i].yuejushu = 0;
                }
                res.rows[i].zongjushu = res.rows[i].extdata.iGameTimes;
                if (0 == res.rows[i].extdata.iJiFenSY) {
                    res.rows[i].changjun = 0;
                } else {
                    res.rows[i].changjun = res.rows[i].extdata.iPlayTimes / res.rows[i].extdata.iJiFenSY;
                }
            }
            let bEnd = true;
            if (res.rows.length > 0) {
                bEnd = false;
            }

            pSocket.emit('getclubusers_result', {
                wErrCode: ErrorCodes.ERR_NOERROR,
                szErrMsg: "查询成功",
                rows: res.rows,
                page: page
            });
            page++;
            if (bEnd) {
                break;
            }
        }
    } catch (e) {
        console.log(e.message);
    } finally {
        conn.Release();
    }
}
//踢出俱乐部
async function kickclub(pSocket, pArgs) {
    let conn = new pgsql.conn();
    let bError = true;
    let iUserId = pSocket.iUserId;
    let uid = pArgs.uid;
    try {
        do {
            await conn.Transaction();
            let sql = 'SELECT \
                            tb_clubs.sname, \
                            tb_clubs.clubid, \
                            tb_joinclubs.* \
                        FROM \
                            tb_joinclubs \
                        INNER JOIN tb_clubs ON tb_clubs.clubid = tb_joinclubs.clubid \
                        WHERE \
                            tb_joinclubs.uid = $1';
            let res = await conn.Query(sql, [uid]);
            if (res.rowCount == 0) {
                console.log('数据未找到')
                pSocket.emit('kickclub_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "数据未找到"
                });
                break;
            }
            let clubid = res.rows[0].clubid;
            let applyer = res.rows[0].userid;
            let clubname = res.rows[0].clubname;
            let clublevel = res.rows[0].clublevel;
            if (res.rows[0].status != 1) {
                console.log('申请中的记录无法踢出')
                pSocket.emit('kickclub_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "申请中的记录无法踢出",
                    memberid: applyer
                });
                break;
            }
            if (res.rows[0].userid == iUserId) {
                console.log('自己不能踢自己')
                pSocket.emit('kickclub_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "自己不能踢自己",
                    memberid: applyer
                });
                break;
            }
            if (clublevel == 0) {
                console.log('不能踢创建者')
                pSocket.emit('kickclub_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "不能踢俱乐部创建者",
                    memberid: applyer
                });
                break;
            }

            //获取自己在俱乐部的权限
            sql = 'SELECT \
                        tb_users."alias", \
                        tb_joinclubs.clublevel \
                    FROM \
                        tb_users \
                    INNER JOIN tb_joinclubs ON tb_joinclubs.userid = tb_joinclubs.userid \
                    WHERE \
                        tb_users.userid = $1 \
                    AND tb_joinclubs.userid = $1 \
                    AND tb_joinclubs.clubid = $2';
            res = await conn.Query(sql, [iUserId, clubid]);
            if (res.rowCount == 0) {
                console.log('记录未找到');
                pSocket.emit('kickclub_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "权限不足",
                    memberid: applyer
                });
                break;
            }
            if (res.rows[0].clublevel == 2) {
                console.log('权限不足');
                pSocket.emit('kickclub_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "权限不足",
                    memberid: applyer
                });
                break;
            }
            if (clublevel == res.rows[0].clublevel) {
                console.log('都是管理无法踢出俱乐部');
                pSocket.emit('kickclub_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "权限不足",
                    memberid: applyer
                });
                break;
            }

            //增加记录
            let alias = crypto.fromBase64(res.rows[0].alias);
            let title = JSON.stringify(alias + '把你踢出了俱乐部');
            let msgs = JSON.stringify('你已经被踢出' + clubname + '俱乐部');

            sql = 'delete from tb_joinclubs where uid = $1';
            res = await conn.Query(sql, [uid]);
            if (res.rowCount == 0) {
                console.log('删除记录失败')
                pSocket.emit('kickclub_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "踢出俱乐部失败",
                    memberid: applyer
                });
                break;
            }

            sql = 'update tb_clubs set unums = unums - 1 where clubid = $1';
            res = await conn.Query(sql, [clubid]);
            if (res.rowCount == 0) {
                console.log('更新俱乐部人数')
                pSocket.emit('kickclub_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "踢出俱乐部失败",
                    memberid: applyer
                });
                break;
            }


            sql = 'insert into tb_mymessage (userid,msgs,title) values($1,$2,$3)';
            res = await conn.Query(sql, [applyer, msgs, title]);
            if (res.rowCount == 0) {
                console.log('踢出俱乐部-添加消息失败');
                pSocket.emit('kickclub_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "添加消息失败",
                    memberid: applyer
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

            pSocket.emit('kickclub_result', {
                wErrCode: ErrorCodes.ERR_NOERROR,
                szErrMsg: "踢出俱乐部成功",
                memberid: applyer
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
//更新俱乐部成员备注
async function updateclubusermemo(pSocket, pArgs) {
    let conn = new pgsql.conn();
    let iUserId = pSocket.iUserId;
    let memo = pArgs.memo;
    let uid = pArgs.uid;
    let clubid = pArgs.clubid;
    try {
        do {
            let sql = 'select * from tb_joinclubs where userid = $1 and clubid = $2';
            let res = await conn.Query(sql, [iUserId, clubid]);
            if (res.rowCount == 0) {
                console.log('记录未找到');
                pSocket.emit('updateclubusermemo_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "记录未找到"
                });
                break;
            }
            if (res.rows[0].clublevel != 0) {
                console.log('不是创建者');
                pSocket.emit('updateclubusermemo_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "不是管理员，更新失败"
                });
                break;
            }

            sql = 'update tb_joinclubs set memo = $1 where uid = $2 and clubid = $3';
            res = await conn.Query(sql, [memo, uid, clubid]);
            if (res.rowCount == 0) {
                console.log('更新备注失败');
                pSocket.emit('updateclubusermemo_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "更新备注失败",
                    memo: memo
                });
                break;
            }

            pSocket.emit('updateclubusermemo_result', {
                wErrCode: ErrorCodes.ERR_NOERROR,
                szErrMsg: "更新备注成功"
            });

        } while (false);

    } catch (e) {
        console.log(e.message);
    } finally {
        conn.Release();
    }
}
//设置俱乐部备注
async function updateclubmemo(pSocket, pArgs) {
    let conn = new pgsql.conn();
    let iUserId = pSocket.iUserId;
    let memo = pArgs.memo;
    let clubid = pArgs.clubid;
    try {
        do {
            let sql = 'select * from tb_joinclubs where userid = $1 and clubid = $2';
            let res = await conn.Query(sql, [iUserId, clubid]);
            if (res.rowCount == 0) {
                console.log('记录未找到');
                pSocket.emit('updateclubmemo_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "记录未找到"
                });
                break;
            }
            if (res.rows[0].clublevel != 0) {
                console.log('不是创建者');
                pSocket.emit('updateclubmemo_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "不是管理员，更新失败"
                });
                break;
            }

            sql = 'update tb_clubs set "desc" = $1 where clubid = $2';
            res = await conn.Query(sql, [memo, clubid]);
            if (res.rowCount == 0) {
                console.log('更新备注失败');
                pSocket.emit('updateclubmemo_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "更新备注失败"
                });
                break;
            }

            pSocket.emit('updateclubmemo_result', {
                wErrCode: ErrorCodes.ERR_NOERROR,
                szErrMsg: "更新备注成功"
            });

        } while (false);

    } catch (e) {
        console.log(e.message);
    } finally {
        conn.Release();
    }
}
//基金充值
async function rechargegold(pSocket, pArgs) {
    let conn = new pgsql.conn();
    let bError = true;
    let iUserId = pSocket.iUserId;
    let count = parseInt(pArgs.count);//数量
    let clubid = pArgs.clubid;
    try {
        do {
            await conn.Transaction();
            if (isNaN(count) || count < 1) {
                pSocket.emit('rechargegold_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "参数错误"
                });
                break;
            }
            // let sql = 'select tb_users.* ,tb_joinclubs.clublevel from tb_users inner join tb_joinclubs on \
            // tb_users.clubid = tb_joinclubs.clubid and \
            // tb_users.userid = tb_joinclubs.userid where tb_users.userid = $1 ';
            let sql = 'select tb_users.gems ,tb_joinclubs.clublevel from tb_joinclubs \
                        inner join tb_users on tb_users.userid = tb_joinclubs.userid\
                        where tb_joinclubs.userid = $1 and tb_joinclubs.clubid = $2';
            let res = await conn.Query(sql, [iUserId, clubid]);
            if (res.rowCount == 0) {
                console.log('数据未找到');
                pSocket.emit('rechargegold_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "数据未找到"
                });
                break;
            }
            if (res.rows[0].clublevel != 0) {
                console.log('权限不足');
                pSocket.emit('rechargegold_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "权限不足"
                });
                break;
            }
            let diamond = count * g_diamond;
            let gold = count * g_gold;
            let diamondleft = res.rows[0].gems - diamond;
            if (res.rows[0].gems < diamond) {
                console.log('钻石不足');
                pSocket.emit('rechargegold_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "钻石不足"
                });
                break;
            }
            sql = 'update tb_clubs set golds = golds + $1 where clubid = $2';
            res = await conn.Query(sql, [gold, clubid]);
            if (res.rowCount == 0) {
                console.log('充值失败');
                pSocket.emit('rechargegold_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "充值失败，更新金币失败"
                });
                break;
            }
            sql = 'update tb_users set gems = gems - $1 where userid = $2 and gems - $1 >= 0';
            res = await conn.Query(sql, [diamond, iUserId]);
            if (res.rowCount == 0) {
                console.log('充值失败');
                pSocket.emit('rechargegold_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "充值失败，更新钻石失败"
                });
                break;
            }
            sql = 'select golds from tb_clubs where clubid = $1';
            res = await conn.Query(sql, [clubid]);
            if (res.rowCount == 0) {
                console.log('充值失败');
                pSocket.emit('rechargegold_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "充值失败，查询失败"
                });
                break;
            }
            bError = false;
            pSocket.emit('rechargegold_result', {
                wErrCode: ErrorCodes.ERR_NOERROR,
                szErrMsg: "充值成功",
                golds: res.rows[0].golds,
                diamond: diamond,
                diamondleft: diamondleft
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
    }
}
//发放
async function issuegold(pSocket, pArgs) {
    let conn = new pgsql.conn();
    let bError = true;
    let iUserId = pSocket.iUserId;
    let clubid = pArgs.clubid;
    let gold = pArgs.gold;
    let recver = pArgs.recver;
    try {
        do {
            await conn.Transaction();
            let sql = 'select tb_users.alias, tb_joinclubs.clublevel,tb_clubs.sname as clubname from tb_joinclubs \
                        inner join tb_users on tb_users.userid = tb_joinclubs.userid \
                        inner join tb_clubs on tb_clubs.clubid = tb_joinclubs.clubid \
                        where tb_joinclubs.userid = $1 and tb_joinclubs.clubid = $2';
            let res = await conn.Query(sql, [iUserId, clubid]);
            if (res.rowCount == 0) {
                pSocket.emit('issuegold_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "参数错误",
                    recver: recver,
                    gold: gold
                });
                break;
            }
            if (res.rows[0].clublevel == 2) {
                pSocket.emit('issuegold_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "权限不足",
                    recver: recver,
                    gold: gold
                });
                break;
            }

            let senderName = crypto.fromBase64(res.rows[0].alias);
            let clubname = res.rows[0].clubname;
            sql = 'select tb_users.alias ,tb_joinclubs.status from tb_joinclubs \
                    inner join tb_users on tb_users.userid = tb_joinclubs.userid\
                    where tb_joinclubs.userid = $1 and tb_joinclubs.clubid = $2';
            res = await conn.Query(sql, [recver, clubid]);
            if (res.rowCount == 0) {
                pSocket.emit('issuegold_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "不是俱乐部成员，无法赠送",
                    recver: recver,
                    gold: gold
                });
                break;
            }
            if (res.rows[0].status == 0) {
                pSocket.emit('issuegold_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "申请中，无法赠送",
                    recver: recver,
                    gold: gold
                });
                break;
            }
            let recverName = crypto.fromBase64(res.rows[0].alias);
            /*
            俱乐部XXXX赠送了你金币
            2018年09月11日获得5000金币
            赠送者:我对你说
            */
            let date = new Date();
            let y = date.getFullYear();
            let m = fmtMonth(date.getMonth());
            let d = padZero(date.getDate())
            let ymd = y + '年' + m + '月' + d + '日';
            let title = JSON.stringify(clubname + '赠送了你金币');
            let msgs = JSON.stringify(ymd + '获得' + gold + '金币\n赠送者:' + senderName);

            sql = 'update tb_users set golds = golds + $1 where userid = $2';
            res = await conn.Query(sql, [gold, recver]);
            if (res.rowCount == 0) {
                pSocket.emit('issuegold_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "更新用户金币失败",
                    recver: recver,
                    gold: gold
                });
                break;
            }

            sql = 'update tb_clubs set golds = golds - $1 where clubid = $2 and golds - $1 >= 0';
            res = await conn.Query(sql, [gold, clubid]);
            if (res.rowCount == 0) {
                pSocket.emit('issuegold_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "基金不足",
                    recver: recver,
                    gold: gold
                });
                break;
            }
            //年月
            let ym = y + '-' + m;
            let issue_data;
            sql = 'select * from tb_issue where clubid = $1 and ym = $2';
            res = await conn.Query(sql, [clubid, ym]);
            if (res.rowCount == 0) {
                issue_data = [d];
                sql = 'insert into tb_issue(clubid,ym,dt) values($1,$2,$3)';
                res = await conn.Query(sql, [clubid, ym, JSON.stringify(issue_data)]);
            } else {
                issue_data = JSON.parse(res.rows[0].dt);
                issue_data.push(d);
                issue_data = unique(issue_data);
                sql = 'update tb_issue set dt = $1 where clubid = $2 and ym = $3';
                res = await conn.Query(sql, [JSON.stringify(issue_data), clubid, ym]);
            }
            if (res.rowCount == 0) {
                pSocket.emit('issuegold_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "发放金币失败[3]",
                    recver: recver,
                    gold: gold
                });
                break;
            }

            sql = "insert into tb_issue_logs (sender,golds,recver,clubid,ymd) values($1, $2 ,$3 ,$4,to_char(now(), 'YYYYMMDD'))";
            res = await conn.Query(sql, [senderName, gold, recverName, clubid]);
            if (res.rowCount == 0) {
                pSocket.emit('issuegold_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "发放金币失败[4]",
                    recver: recver,
                    gold: gold
                });
                break;
            }

            sql = 'update tb_users set mymsgcount = 1 where userid = $1';
            res = await conn.Query(sql, [recver]);
            if (res.rowCount == 0) {
                console.log('发放金币-更新我的消息标记失败');
                pSocket.emit('issuegold_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "更新我的消息标记失败",
                    recver: recver,
                    gold: gold
                });
                break;
            }

            sql = 'insert into tb_mymessage (userid,msgs,title) values($1,$2,$3)';
            res = await conn.Query(sql, [recver, msgs, title]);
            if (res.rowCount == 0) {
                console.log('发放金币-添加消息失败');
                pSocket.emit('issuegold_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "添加消息失败",
                    recver: recver,
                    gold: gold
                });
                break;
            }

            sql = 'select clubid ,golds ,alertgolds ,alerted,sname from tb_clubs where clubid = $1';
            res = await conn.Query(sql, [clubid]);
            if (res.rowCount == 0) {
                console.log('发放失败');
                pSocket.emit('issuegold_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "发放失败，查询失败",
                    recver: recver,
                    gold: gold
                });
                break;
            }

            await doalertgolds(conn, res.rows[0]);

            bError = false;

            let s = userMgr.GetSocketObj(recver)
            if (s && s.connected) {
                s.emit('mymsg_result', {
                    wErrCode: ErrorCodes.ERR_NOERROR,
                    szErrMsg: "有新的消息"
                });
            }

            pSocket.emit('issuegold_result', {
                wErrCode: ErrorCodes.ERR_NOERROR,
                szErrMsg: "发放金币成功",
                recver: recver,
                gold: gold
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
//发放记录
async function issuegoldlist(pSocket, pArgs) {
    let conn = new pgsql.conn();
    let iUserId = pSocket.iUserId;
    let clubid = pArgs.clubid;
    let ymd = pArgs.ymd;
    let page = parseInt(pArgs.page);
    let pagesize = 50;
    if (isNaN(page) || page <= 0) {
        page = 1;
    }
    let _page = page - 1;
    try {
        // let sql = 'select * from tb_issue_logs where clubid = $1 and ymd = $2 LIMIT $3 OFFSET $4 order by ctime desc';
        // let res = await conn.Query(sql, [clubid, ymd, pagesize, _page * pagesize]);
        let sql = 'select * from tb_issue_logs where clubid = $1 and ymd = $2 order by ctime desc';// LIMIT $3 OFFSET $4
        let res = await conn.Query(sql, [clubid, ymd]);
        if (res.rows.length > 0) {
            page = page + 1;
        }

        pSocket.emit('issuegoldlist_result', {
            wErrCode: ErrorCodes.ERR_NOERROR,
            szErrMsg: "查询成功",
            rows: res.rows,
            page: page
        });
    } catch (e) {
        console.log(e.message);
    } finally {
        conn.Release();
    }
}
//带入记录
async function dairulist(pSocket, pArgs) {
    let conn = new pgsql.conn();
    let iUserId = pSocket.iUserId;
    let clubid = pArgs.clubid;
    let ymd = pArgs.ymd;
    let page = parseInt(pArgs.page);
    let pagesize = 50;
    if (isNaN(page) || page <= 0) {
        page = 1;
    }
    let _page = page - 1;
    try {
        // let sql = 'select * from tb_dairu_logs where clubid = $1 and ymd = $2 LIMIT $3 OFFSET $4';
        // let res = await conn.Query(sql, [clubid, ymd, pagesize, _page * pagesize]);
        let sql = 'select * from tb_dairu_logs where clubid = $1 and ymd = $2';
        let res = await conn.Query(sql, [clubid, ymd]);

        if (res.rows.length > 0) {
            page = page + 1;
        }

        pSocket.emit('dairulist_result', {
            wErrCode: ErrorCodes.ERR_NOERROR,
            szErrMsg: "查询成功",
            rows: res.rows,
            page: page
        });
    } catch (e) {
        console.log(e.message);
    } finally {
        conn.Release();
    }
}
//解散俱乐部
async function delgblub(pSocket, pArgs) {
    let conn = new pgsql.conn();
    let bError = true;
    let iUserId = pSocket.iUserId;
    try {
        do {
            await conn.Transaction();
            let sql = 'select tb_clubs.clubid ,tb_clubs.allianceid ,tb_clubs.sname ,tb_users.alias from tb_clubs \
                        inner join tb_users on tb_clubs.creator = tb_users.userid \
                        where tb_clubs.creator = $1';
            let res = await conn.Query(sql, [iUserId]);
            if (res.rowCount == 0) {
                pSocket.emit('delgblub_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "权限不足"
                });
                break;
            }
            if (res.rows[0].allianceid != 0) {
                pSocket.emit('delgblub_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "请先解散联盟"
                });
                break;
            }

            let clubid = res.rows[0].clubid;
            let alias = crypto.fromBase64(res.rows[0].alias);
            let title = JSON.stringify(alias + '解散了俱乐部');
            let msgs = JSON.stringify('基金会已解散');

            sql = "select count(roomid) as icount from tb_rooms where clubid = $1";
            res = await conn.Query(sql, [clubid]);
            if (res.rows[0].icount > 0) {
                pSocket.emit('delgblub_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "不能删除还有房间的俱乐部"
                });
                break;
            }

            sql = 'select userid from tb_joinclubs where clubid = $1';
            res = await conn.Query(sql, [clubid]);
            let rows = res.rows
            for (let i = 0; i < rows.length; i++) {
                let applyer = rows[i].userid;
                sql = 'insert into tb_mymessage (userid,msgs,title) values($1,$2,$3)';
                await conn.Query(sql, [applyer, msgs, title]);
                sql = 'update tb_users set mymsgcount = 1 where userid = $1';
                await conn.Query(sql, [applyer]);
            }

            sql = 'delete from tb_joinclubs where clubid = $1';
            await conn.Query(sql, [clubid]);

            sql = 'delete from tb_clubs where clubid = $1';
            await conn.Query(sql, [clubid]);

            sql = 'update tb_users set clubid = 0 where userid = $1';
            await conn.Query(sql, [iUserId]);

            bError = false;

            for (let i = 0; i < rows.length; i++) {
                let applyer = rows[i].userid;
                let s = userMgr.GetSocketObj(applyer)
                if (s && s.connected) {
                    s.emit('mymsg_result', {
                        wErrCode: ErrorCodes.ERR_NOERROR,
                        szErrMsg: "有新的消息"
                    });
                }
            }

            pSocket.emit('delgblub_result', {
                wErrCode: ErrorCodes.ERR_NOERROR,
                szErrMsg: "解散俱乐部成功"
            });

        } while (false);
    } catch (e) {
        console.log('解散俱乐部', e.message);
        pSocket.emit('dissolvedclub_result', {
            wErrCode: ErrorCodes.ERR_INVALIDARGS,
            szErrMsg: "解散俱乐部异常"
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
//基金发放日期记录
async function issuedate(pSocket, pArgs) {
    let conn = new pgsql.conn();
    let iUserId = pSocket.iUserId;
    let clubid = pArgs.clubid;
    try {
        let sql = 'select * from tb_issue where clubid = $1 order by ctime desc';
        let res = await conn.Query(sql, [clubid]);
        pSocket.emit('issuedate_result', {
            wErrCode: ErrorCodes.ERR_NOERROR,
            szErrMsg: "获取记录成功",
            rows: res.rows
        });
    } catch (e) {
        console.log(e.message);
    } finally {
        conn.Release();
    }
}

//带入发放日期记录
async function dairudate(pSocket, pArgs) {
    let conn = new pgsql.conn();
    let iUserId = pSocket.iUserId;
    let clubid = pArgs.clubid;
    try {
        let sql = 'select * from tb_dairu where clubid = $1 order by ctime desc';
        let res = await conn.Query(sql, [clubid]);
        pSocket.emit('issuedate_result', {
            wErrCode: ErrorCodes.ERR_NOERROR,
            szErrMsg: "获取记录成功",
            rows: res.rows
        });
    } catch (e) {
        console.log(e.message);
    } finally {
        conn.Release();
    }
}

//预警设置
async function alertgolds(pSocket, pArgs) {
    let conn = new pgsql.conn();
    let iUserId = pSocket.iUserId;
    let golds = pArgs.golds;
    let clubid = pArgs.clubid;
    try {
        do {
            let sql = 'select * from tb_joinclubs where userid = $1 and clubid = $2';
            let res = await conn.Query(sql, [iUserId, clubid]);
            if (res.rowCount == 0) {
                pSocket.emit('alertgolds_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "用户未找到"
                });
                break;
            }
            if (res.rows[0].clublevel == 2) {
                pSocket.emit('alertgolds_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "权限不足"
                });
                break;
            }
            sql = 'update tb_clubs set alertgolds = $1 ,alerted = 0 where clubid = $2';
            res = await conn.Query(sql, [golds, clubid]);
            if (res.rowCount == 0) {
                pSocket.emit('alertgolds_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "设置失败"
                });
                break;
            }

            pSocket.emit('alertgolds_result', {
                wErrCode: ErrorCodes.ERR_NOERROR,
                szErrMsg: "设置成功",
                golds: golds
            });
        } while (false);

    } catch (e) {
        console.log(e.message);
        pSocket.emit('alertgolds_result', {
            wErrCode: ErrorCodes.ERR_INVALIDARGS,
            szErrMsg: "设置预警异常"
        });
    } finally {
        conn.Release();
    }
}
//产生基金预警消息
async function doalertgolds(conn, clubinfo) {
    let golds = clubinfo.golds;
    let alerted = clubinfo.alerted;
    let alertgolds = clubinfo.alertgolds;
    let clubname = clubinfo.sname;
    let clubid = clubinfo.clubid;
    do {
        if (alerted == 1) {
            break;
        }
        if (alertgolds < golds) {
            break;
        }
        //设置为不需要提醒，增加基金预警消息
        sql = 'update tb_clubs set alerted = 1 ,alertmsgcount = 1 where clubid = $1';
        await conn.Query(sql, [clubid]);

        //删除以前的消息
        sql = 'delete from tb_clubjjalertmessage where clubid = $1';
        await conn.Query(sql, [clubid]);

        //写消息
        sql = 'insert into tb_clubjjalertmessage (clubid,clubname,alertgolds) values($1,$2,$3)';
        await conn.Query(sql, [clubid, clubname, alertgolds]);

        //推送给管理
        sql = 'select userid from tb_joinclubs where clubid = $1 and clublevel < 2';
        res = await conn.Query(sql, [clubid]);
        for (let i = 0; i < res.rows.length; i++) {
            let s = userMgr.GetSocketObj(res.rows[i].userid)
            if (s && s.connected) {
                s.emit('alertgoldsmsg_result', {
                    wErrCode: ErrorCodes.ERR_NOERROR,
                    szErrMsg: "有新的消息"
                });
            }
        }
    } while (false);
}
//获取基金预警消息
async function alertgoldslist(pSocket, pArgs) {
    let conn = new pgsql.conn();
    let iUserId = pSocket.iUserId;
    try {
        do {
            let sql = 'select * from tb_joinclubs where userid = $1 and clublevel < 2';
            let res = await conn.Query(sql, [iUserId]);
            if (res.rowCount == 0) {
                pSocket.emit('alertgoldslist_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "权限不足"
                });
                break;
            }
            let clubids = [];
            for (let i = 0; i < res.rows.length; i++) {
                clubids.push(res.rows[i].clubid);
            }
            sql = 'update tb_clubs set alertmsgcount = 0 where clubid in (' + clubids.join(',') + ')';
            await conn.Query(sql, []);
            sql = "select clubname ,alertgolds,to_char(ctime, 'HH24:MI') as ctime from tb_clubjjalertmessage where clubid in (" + clubids.join(',') + ")";
            res = await conn.Query(sql, []);
            pSocket.emit('alertgoldslist_result', {
                wErrCode: ErrorCodes.ERR_NOERROR,
                szErrMsg: "获取数据成功",
                rows: res.rows
            });
        } while (false);
    } catch (e) {
        console.log(e.message);
        pSocket.emit('alertgoldslist_result', {
            wErrCode: ErrorCodes.ERR_INVALIDARGS,
            szErrMsg: "获取数据异常"
        });
    } finally {
        conn.Release();
    }
}
//发放记录
//消耗记录
async function setvip(pSocket, pArgs) {
    let conn = new pgsql.conn();
    let iUserId = pSocket.iUserId;
    let clubid = pArgs.clubid;
    let memberid = pArgs.memberid;
    let isvip = parseInt(pArgs.isvip);
    try {
        do {
            if (isNaN(isvip)) {
                isvip = 0;
            }
            let sql = 'select * from tb_joinclubs where userid = $1 and clubid = $2 and clublevel < 2';
            let res = await conn.Query(sql, [iUserId, clubid]);
            if (res.rowCount == 0) {
                console.log('不是管理');
                pSocket.emit('setvip_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "权限不足",
                    isvip: isvip,
                    memberid: memberid
                });
                break;
            }

            sql = 'update tb_joinclubs set isvip = $1 where userid = $2 and clubid = $3';
            res = await conn.Query(sql, [isvip, memberid, clubid]);
            if (res.rowCount == 0) {
                console.log('设置失败');
                pSocket.emit('setvip_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "设置失败",
                    isvip: isvip,
                    memberid: memberid
                });
                break;
            }

            pSocket.emit('setvip_result', {
                wErrCode: ErrorCodes.ERR_NOERROR,
                szErrMsg: "设置成功",
                isvip: isvip,
                memberid: memberid
            });

        } while (false);

    } catch (e) {
        console.log(e.message);
        pSocket.emit('setvip_result', {
            wErrCode: ErrorCodes.ERR_INVALIDARGS,
            szErrMsg: "数据库异常",
            isvip: isvip,
            memberid: memberid
        });
    } finally {
        conn.Release();
    }
}

async function issuediamond(pSocket, pArgs) {
    let conn = new pgsql.conn();
    let bError = true;
    let iUserId = pSocket.iUserId;
    let clubid = pArgs.clubid;
    let gold = pArgs.diamond;
    let recver = pArgs.recver;
    try {
        do {
            await conn.Transaction();
            let sql = 'select tb_users.alias, tb_joinclubs.clublevel,tb_clubs.sname as clubname from tb_joinclubs \
                        inner join tb_users on tb_users.userid = tb_joinclubs.userid \
                        inner join tb_clubs on tb_clubs.clubid = tb_joinclubs.clubid \
                        where tb_joinclubs.userid = $1 and tb_joinclubs.clubid = $2';
            let res = await conn.Query(sql, [iUserId, clubid]);
            if (res.rowCount == 0) {
                pSocket.emit('issuediamond_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "参数错误"
                });
                break;
            }
            if (res.rows[0].clublevel == 2) {
                pSocket.emit('issuediamond_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "权限不足"
                });
                break;
            }

            let senderName = crypto.fromBase64(res.rows[0].alias);
            let clubname = res.rows[0].clubname;
            sql = 'select tb_users.alias ,tb_joinclubs.status from tb_joinclubs \
                    inner join tb_users on tb_users.userid = tb_joinclubs.userid\
                    where tb_joinclubs.userid = $1 and tb_joinclubs.clubid = $2';
            res = await conn.Query(sql, [recver, clubid]);
            if (res.rowCount == 0) {
                pSocket.emit('issuediamond_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "不是俱乐部成员，无法赠送"
                });
                break;
            }
            if (res.rows[0].status == 0) {
                pSocket.emit('issuediamond_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "申请中，无法赠送"
                });
                break;
            }
            let recverName = crypto.fromBase64(res.rows[0].alias);
            /*
            俱乐部XXXX赠送了你金币
            2018年09月11日获得5000金币
            赠送者:我对你说
            */
            let date = new Date();
            let y = date.getFullYear();
            let m = fmtMonth(date.getMonth());
            let d = padZero(date.getDate())
            let ymd = y + '年' + m + '月' + d + '日';
            let title = JSON.stringify(clubname + '赠送了你钻石');
            let msgs = JSON.stringify(ymd + '获得' + gold + '钻石\n赠送者:' + senderName);

            sql = 'update tb_users set gems = gems + $1 where userid = $2';
            res = await conn.Query(sql, [gold, recver]);
            if (res.rowCount == 0) {
                pSocket.emit('issuediamond_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "更新用户钻石失败"
                });
                break;
            }

            sql = 'update tb_users set gems = gems - $1 where userid = $2 and gems - $1 >= 0';
            res = await conn.Query(sql, [gold, iUserId]);
            if (res.rowCount == 0) {
                pSocket.emit('issuediamond_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "钻石不足"
                });
                break;
            }
            //年月
            let ym = y + '-' + m;
            let issue_data;
            sql = 'select * from tb_issue_diamond where clubid = $1 and ym = $2';
            res = await conn.Query(sql, [clubid, ym]);
            if (res.rowCount == 0) {
                issue_data = [d];
                sql = 'insert into tb_issue_diamond(clubid,ym,dt) values($1,$2,$3)';
                res = await conn.Query(sql, [clubid, ym, JSON.stringify(issue_data)]);
            } else {
                issue_data = JSON.parse(res.rows[0].dt);
                issue_data.push(d);
                issue_data = unique(issue_data);
                sql = 'update tb_issue_diamond set dt = $1 where clubid = $2 and ym = $3';
                res = await conn.Query(sql, [JSON.stringify(issue_data), clubid, ym]);
            }
            if (res.rowCount == 0) {
                pSocket.emit('issuediamond_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "发放钻石失败[3]"
                });
                break;
            }

            sql = "insert into tb_issue_logs_diamond (sender,gems,recver,clubid,ymd) values($1, $2 ,$3 ,$4,to_char(now(), 'YYYYMMDD'))";
            res = await conn.Query(sql, [senderName, gold, recverName, clubid]);
            if (res.rowCount == 0) {
                pSocket.emit('issuediamond_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "发放钻石失败[4]"
                });
                break;
            }

            sql = 'update tb_users set mymsgcount = 1 where userid = $1';
            res = await conn.Query(sql, [recver]);
            if (res.rowCount == 0) {
                console.log('赠送金币-更新我的消息标记失败');
                pSocket.emit('issuediamond_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "更新我的消息标记失败"
                });
                break;
            }

            sql = 'insert into tb_mymessage (userid,msgs,title) values($1,$2,$3)';
            res = await conn.Query(sql, [recver, msgs, title]);
            if (res.rowCount == 0) {
                console.log('赠送钻石-添加消息失败');
                pSocket.emit('issuediamond_result', {
                    wErrCode: ErrorCodes.ERR_INVALIDARGS,
                    szErrMsg: "添加消息失败"
                });
                break;
            }

            bError = false;

            let s = userMgr.GetSocketObj(recver)
            if (s && s.connected) {
                s.emit('mymsg_result', {
                    wErrCode: ErrorCodes.ERR_NOERROR,
                    szErrMsg: "有新的消息"
                });
            }

            pSocket.emit('issuediamond_result', {
                wErrCode: ErrorCodes.ERR_NOERROR,
                szErrMsg: "发放钻石成功",
                diamond: gold
            });

        } while (false);
    } catch (e) {
        console.log(e.message);
        pSocket.emit('issuediamond_result', {
            wErrCode: ErrorCodes.ERR_INVALIDARGS,
            szErrMsg: e.message
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

async function issuediamondlist(pSocket, pArgs) {
    let conn = new pgsql.conn();
    let iUserId = pSocket.iUserId;
    let clubid = pArgs.clubid;
    let ymd = pArgs.ymd;
    let page = parseInt(pArgs.page);
    let pagesize = 50;
    if (isNaN(page) || page <= 0) {
        page = 1;
    }
    let _page = page - 1;
    try {
        // let sql = 'select * from tb_issue_logs where clubid = $1 and ymd = $2 LIMIT $3 OFFSET $4 order by ctime desc';
        // let res = await conn.Query(sql, [clubid, ymd, pagesize, _page * pagesize]);
        let sql = 'select * from tb_issue_logs_diamond where clubid = $1 and ymd = $2 order by ctime desc';// LIMIT $3 OFFSET $4
        let res = await conn.Query(sql, [clubid, ymd]);
        if (res.rows.length > 0) {
            page = page + 1;
        }

        pSocket.emit('issuediamondlist_result', {
            wErrCode: ErrorCodes.ERR_NOERROR,
            szErrMsg: "查询成功",
            rows: res.rows,
            page: page
        });
    } catch (e) {
        console.log(e.message);
    } finally {
        conn.Release();
    }
}

async function issuediamonddate(pSocket, pArgs) {
    let conn = new pgsql.conn();
    let iUserId = pSocket.iUserId;
    let clubid = pArgs.clubid;
    try {
        let sql = 'select * from tb_issue_diamond where clubid = $1 order by ctime desc';
        let res = await conn.Query(sql, [clubid]);
        pSocket.emit('issuediamonddate_result', {
            wErrCode: ErrorCodes.ERR_NOERROR,
            szErrMsg: "获取记录成功",
            rows: res.rows
        });
    } catch (e) {
        console.log(e.message);
    } finally {
        conn.Release();
    }
}

module.exports = {
    joinclub: joinclub,
    approveclub: approveclub,
    refuseclub: refuseclub,
    setclubadmin: setclubadmin,
    getclubusers: getclubusers,
    kickclub: kickclub,
    updateclubusermemo: updateclubusermemo,
    updateclubmemo: updateclubmemo,
    rechargegold: rechargegold,
    issuegold: issuegold,
    issuegoldlist: issuegoldlist,
    dairulist: dairulist,
    delgblub: delgblub,
    issuedate: issuedate,
    alertgolds: alertgolds,
    alertgoldslist: alertgoldslist,
    setvip: setvip,
    issuediamond: issuediamond,
    issuediamondlist: issuediamondlist,
    issuediamonddate: issuediamonddate
}

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

function getGroup2(arr, r) {
    let _group = function (arr, index, r) {
        if (undefined == arr[index]) {
            return null;
        }
        let a = arr[index];
        r.push(a);
        for (let i = index + 1; i < arr.length; i++) {
            if (/^[\u4e00-\u9fa5_a-zA-Z0-9]+$/.test(arr[i])) {
                a = a + arr[i];
                r.push(a);
            }
        }
    }
    for (let i = 0; i < arr.length; i++) {
        _group(arr, i, r);
    }
}

function parseJONS(str) {
    let r = null;
    try {
        if (str) {
            r = JSON.parse(str);
        }
    } catch (e) {

    }
    return r;
}


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