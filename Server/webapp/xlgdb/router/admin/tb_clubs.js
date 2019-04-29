"use strict";
const express = require('express');
const router = express.Router();
const driver = require('../../driver/driver');
const db = require('../../dal/tb_clubs.js');
const menu = require('../../const/admin_menus.js');

router.get('/view/list', async function (req, res) {
    let options = await getCommonList(req, getCount, getList)
    options.url_page_p1 = '/admin/tb_clubs/view/list?p=1';
    options.url_page_p2 = '/admin/tb_clubs/view/list?p=';
    options.url_page_p3 = '/admin/tb_clubs/view/list?p=';
    options.url_page_p4 = '/admin/tb_clubs/view/list?p=';
    options.cur = "tb_clubs";
    // options.menu = menu.get(req.session.admin.is_admin);
    options.menu = menu.get(0);
    options.title = "需要自己修改的";
    options.layout = 'admin/layout';
    res.render('admin/tb_clubs/list', options);
});

router.get('/view/create', async function (req, res) {
    let options = {};
    options.edit = false;
    options.cur = "tb_clubs";
    // result.menu = menu.get(req.session.admin.is_admin);
    options.menu = menu.get(0);
    options.title = "需要自己修改的";
    options.layout = 'admin/layout';
    options.posturl = '/admin/tb_clubs/ajax/create';
    res.render('admin/tb_clubs/view', options);
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
            let rows = await db.tb_clubs_select(conn, params);
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
    options.cur = "tb_clubs";
    // options.menu = menu.get(req.session.admin.is_admin);
    options.menu = menu.get(0);
    options.title = "需要自己修改的";
    options.layout = 'admin/layout';
    options.posturl = '/admin/tb_clubs/ajax/update';
    res.render('admin/tb_clubs/view', options);
});

router.post('/ajax/create', async function (req, res) {
    let conn = driver.get();
    let result = { errcode: 0, errmsg: '操作成功' };
    try {
        do {
            await ajax_create_verify(result, req);
            if (result.errcode != 0) {
                break;
            }
            let row = {};
            let res = db.tb_clubs_add(conn, row);
            if (res.affectedRows == 0) {
                result.errcode = -1;
                result.errmsg = '创建失败';
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
    let result = { errcode: 0, errmsg: '操作成功' };
    try {
        do {
            await ajax_update_verify(result, req);
            if (result.errcode != 0) {
                break;
            }
            let row = {};
            let res = db.tb_clubs_update(conn, row);
            if (res.affectedRows == 0) {
                result.errcode = -1;
                result.errmsg = '更新失败';
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
            let res = db.tb_clubs_delete(conn, row);
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
        console.log(result);
        return result;
    }
}

async function getCount(conn, req) {
    var row = {};
    return await db.tb_clubs_count(conn, row);
}

async function getList(conn, req, page, size) {
    var row = { page: page, size: size };
    return await db.tb_clubs_list(conn, row);
}

async function view_update_verify(result, req) {

}

async function ajax_create_verify(result, req) {

}

async function ajax_update_verify(result, req) {

}

async function ajax_delete_verify(result, req) {

}

module.exports = router;