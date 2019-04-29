"use strict";
const express = require('express');
const router = express.Router();
const driver = require('../../driver/driver');
const db = require('../../dal/tb_alliance_jiangchi.js');
const db_alliance = require('../../dal/tb_alliance');
const menu = require('../../const/admin_menus.js');
const regex = require('../../const/regex');

router.get('/view/list', async function (req, res) {
    let options = await getCommonList(req, getCount, getList)
    options.url_page_p1 = '/admin/tb_alliance_jiangchi/view/list?p=1';
    options.url_page_p2 = '/admin/tb_alliance_jiangchi/view/list?p=';
    options.url_page_p3 = '/admin/tb_alliance_jiangchi/view/list?p=';
    options.url_page_p4 = '/admin/tb_alliance_jiangchi/view/list?p=';
    options.cur = "tb_alliance_jiangchi";
    // options.menu = menu.get(req.session.admin.is_admin);
    options.menu = menu.get(0);
    options.title = "需要自己修改的";
    options.layout = 'admin/layout';
    res.render('admin/tb_alliance_jiangchi/list', options);
});

router.get('/view/create', async function (req, res) {
    let options = {};
    options.edit = false;
    options.cur = "tb_alliance_jiangchi";
    // result.menu = menu.get(req.session.admin.is_admin);
    options.menu = menu.get(0);
    options.title = "创建奖池配置";
    options.layout = 'admin/layout';
    options.posturl = '/admin/tb_alliance_jiangchi/ajax/create';
    res.render('admin/tb_alliance_jiangchi/view', options);
});

router.get('/view/update', async function (req, res) {
    let conn = driver.get();
    let options = { errcode: 0 };
    try {
        do {
            await view_update_verify(options, req);
            if (options.errcode != 0) {
                break;
            }
            let params = {};
            let rows = await db.tb_alliance_jiangchi_select(conn, params);
            if (rows.length == 0) {
                options.errcode = 1;
                options.errmsg = '数据未找到';
            } else {
                options.row = rows[0];
            }
        } while (false);

    } catch (e) {
        console.log(e);
    }
    await conn.Release();
    options.edit = true;
    options.cur = "tb_alliance_jiangchi";
    // options.menu = menu.get(req.session.admin.is_admin);
    options.menu = menu.get(0);
    options.title = "编辑奖池配置";
    options.layout = 'admin/layout';
    options.posturl = '/admin/tb_alliance_jiangchi/ajax/update';
    res.render('admin/tb_alliance_jiangchi/view', options);
});

router.post('/ajax/create', async function (req, res) {
    let conn = driver.get();
    let result = { errcode: 0, errmsg: '创建奖池配置成功' };
    try {
        do {
            await ajax_create_verify(result, req);
            if (result.errcode != 0) {
                break;
            }
            let res = await db_alliance.tb_alliance_select_by_allianceid(conn, req.body.allianceid);
            if (res.rowCount == 0) {
                result.errcode = -1;
                result.errmsg = '创建失败，联盟未找到';
                break;
            }
            req.body.userid = res.rows[0].creator;
            res = await db.tb_alliance_jiangchi_add(conn, req.body);
            if (res.rowCount == 0) {
                result.errcode = -1;
                result.errmsg = '创建失败';
                break;
            }
        } while (false);
    } catch (e) {
        console.log(e);
        result.errcode = -1;
        result.errmsg = e.message;
    }
    await conn.Release();
    res.json(result);
});

router.post('/ajax/update', async function (req, res) {
    let conn = driver.get();
    let result = { errcode: 0, errmsg: '编辑成功' };
    try {
        do {
            await ajax_update_verify(result, req);
            if (result.errcode != 0) {
                break;
            }
            if (req.body.type === 1) {
                let row = await db.tb_alliance_jiangchi_update_by_allianceid_level_1(conn, req.body);
                if (row.rowCount == 0) {
                    result.errcode = -1;
                    result.errmsg = '编辑失败';
                    break;
                }
            } else {
                let row = await db.tb_alliance_jiangchi_update_by_allianceid_level(conn, req.body);
                if (row.rowCount == 0) {
                    result.errcode = -1;
                    result.errmsg = '编辑失败';
                    break;
                }
            }

        } while (false);
    } catch (e) {
        console.log(e);
        result.errcode = -1;
        result.errmsg = e.message;
    }
    await conn.Release();
    res.json(result);
});

router.get('/ajax/delete', async function (req, res) {
    let conn = driver.get();
    let result = { errcode: 0, errmsg: '操作成功' };
    try {
        do {
            await ajax_update_verify(result, req);
            if (result.errcode != 0) {
                break;
            }

            let row = {};
            let res = db.tb_alliance_jiangchi_delete(conn, row);
            if (res.affectedRows == 0) {
                result.errcode = -1;
                result.errmsg = '删除失败';
            }

        } while (false);

    } catch (e) {
        console.log(e);
        result.errcode = -1;
        result.errmsg = e.message;
    }
    await conn.Release();
    res.json(result);
});

router.get('/view/search', async function (req, res) {
    let conn = driver.get();
    let options = {};
    options.cur = "tb_alliance_jiangchi";
    // options.menu = menu.get(req.session.admin.is_admin);
    options.menu = menu.get(0);
    options.title = "奖池设置";
    options.layout = 'admin/layout';
    options.rows = [];
    options.posturl = '["/admin/tb_alliance_jiangchi/ajax/create","/admin/tb_alliance_jiangchi/ajax/update"]';
    options.allianceid = req.query.allianceid || 0;
    try {
        do {
            let res = await db_alliance.tb_alliance_select_by_allianceid(conn, req.query.allianceid);
            if (res.rowCount == 0) {
                break;
            }
            options.rows.push({ uid: 0, level: 1, golds: 0, tianhuang: 0, duohuang: 0, duoduoduo: 0 });
            options.rows.push({ uid: 0, level: 2, golds: 0, tianhuang: 0, duohuang: 0, duoduoduo: 0 });
            options.rows.push({ uid: 0, level: 5, golds: 0, tianhuang: 0, duohuang: 0, duoduoduo: 0 });
            options.rows.push({ uid: 0, level: 10, golds: 0, tianhuang: 0, duohuang: 0, duoduoduo: 0 });
            options.rows.push({ uid: 0, level: 20, golds: 0, tianhuang: 0, duohuang: 0, duoduoduo: 0 });
            options.rows.push({ uid: 0, level: 50, golds: 0, tianhuang: 0, duohuang: 0, duoduoduo: 0 });
            options.rows.push({ uid: 0, level: 100, golds: 0, tianhuang: 0, duohuang: 0, duoduoduo: 0 });
            let rows = await db.tb_alliance_jiangchi_by_allianceid(conn, req.query.allianceid);

            for (let i = 0; i < rows.length; i++) {
                let row = rows[i];
                if (row.level == 1) {
                    options.rows.splice(0, 1, row);
                } else if (row.level == 2) {
                    options.rows.splice(1, 1, row);
                } else if (row.level == 5) {
                    options.rows.splice(2, 1, row);
                } else if (row.level == 10) {
                    options.rows.splice(3, 1, row);
                } else if (row.level == 20) {
                    options.rows.splice(4, 1, row);
                } else if (row.level == 50) {
                    options.rows.splice(5, 1, row);
                } else if (row.level == 100) {
                    options.rows.splice(6, 1, row);
                }
            }
        } while (false);
    } catch (e) {
        console.log(e);
    }
    await conn.Release();

    options.rowCount = options.rows.length;

    res.render('admin/tb_alliance_jiangchi/search', options);
});


async function getCommonList(req, cbCount, cbList) {
    let conn = driver.get();
    let result = { errcode: 0 };
    result.curr_page = parseInt(req.query.page);
    result.pagesize = 20;
    if (isNaN(result.curr_page)) {
        result.curr_page = 1;
    }
    try {
        result.record_count = await cbCount(conn, req);
        result.max_page = Math.ceil(result.record_count / result.pagesize);
        if (result.curr_page > result.max_page) {
            result.curr_page = result.max_page;
        }
        if (result.curr_page < 1) {
            result.curr_page = 1;
        }
        result.rows = await cbList(conn, req, result.curr_page, result.pagesize);
    } catch (e) {
        console.log(e);
        result.rows = [];
        result.max_page = 1;
        result.record_count = 0;
    } finally {
        await conn.Release();
        result.prev_page = result.curr_page - 1;
        result.next_page = result.curr_page + 1;
        if (result.prev_page < 1) {
            result.prev_page = 1;
        }
        if (result.next_page > result.max_page) {
            result.next_page = result.max_page;
        }
    }
    console.log(result);
    return result;
}

async function getCount(conn, req) {
    var row = {};
    return await db.tb_alliance_jiangchi_count(conn, row);
}

async function getList(conn, req, page, size) {
    var row = { page: page, size: size };
    return await db.tb_alliance_jiangchi_list(conn, row);
}

async function view_update_verify(result, req) {

}

async function ajax_create_verify(result, req) {
    let total = 0;
    do {
        if (!regex.isID(req.body.allianceid)) {
            result.errcode = 1;
            result.errmsg = '联盟ID不正确';
            break;
        }
        if (!regex.isNumber(req.body.golds)) {
            result.errcode = 1;
            result.errmsg = '奖池金币数不正确';
            break;
        }
        if (!regex.isID(req.body.tianhuang)) {
            result.errcode = 1;
            result.errmsg = '天皇奖励比例不正确';
            break;
        }
        if (!regex.isID(req.body.duohuang)) {
            result.errcode = 1;
            result.errmsg = '朵皇奖励比例不正确';
            break;
        }
        if (!regex.isID(req.body.duoduoduo)) {
            result.errcode = 1;
            result.errmsg = '朵朵朵奖励比例不正确';
            break;
        }

        total = parseInt(req.body.tianhuang) + parseInt(req.body.duohuang) + parseInt(req.body.duoduoduo);
        if (total > 100) {
            result.errcode = 1;
            result.errmsg = '比例不正确';
            break;
        }

    } while (false);
}

async function ajax_update_verify(result, req) {
    ajax_create_verify(result, req);
    do {
        if (!regex.isNumber(req.body.type)) {
            result.errcode = 1;
            result.errmsg = '类型不正确';
            break;
        }
        if (req.body.type !== 1 && req.body.type !== 0) {
            result.errcode = 1;
            result.errmsg = '类型不正确';
            break;
        }
    } while (false);

}

async function ajax_delete_verify(result, req) {

}

function isArray(o) {
    return o instanceof Array;
}

module.exports = router;