"use strict";
const express = require('express');
const router = express.Router();
const driver = require('../../driver/driver');
const db = require('../../dal/tb_users.js');
const menu = require('../../const/admin_menus.js');
const http = require('../../modules/http');
let diamond_time = new Date().getTime();

router.get('/view/diamond', async function (req, res) {
    let options = {};
    diamond_time = new Date().getTime();
    options.edit = false;
    options.cur = "recharge_diamond";
    // result.menu = menu.get(req.session.admin.is_admin);
    options.menu = menu.get(0);
    options.title = "赠送钻石";
    options.layout = 'admin/layout';
    options.diamond_time = diamond_time;
    res.render('admin/recharge/diamond', options);
});


router.post('/ajax/diamond', async function (req, res) {
    let conn = driver.get();
    let result = { errcode: 0, errmsg: '操作成功' };
    try {
        do {
            ajax_diamond_verify(result, req);
            if (result.errcode != 0) {
                break;
            }
            result.errcode = await http.diamond(req.session.admin.userid, req.body.userid, req.body.diamond);
            if (result.errcode != 0) {
                result.errmsg = '游戏服务器异常';
                break;
            }
        } while (false);
    } catch (e) {
        console.log(e);
        result.errcode = 1;
        result.errmsg = '异常';
    }

    diamond_time = new Date().getTime();
    result.diamond_time = diamond_time;
    await conn.Release();
    res.json(result);
});

function ajax_diamond_verify(result, req) {
    do {
        if (undefined == req.body || null == req.body) {
            result.errcode = 1;
            result.errmsg = '数据错误[1]';
            break;
        }

        if (undefined == req.body.diamond_time || null == req.body.diamond_time) {
            result.errcode = 1;
            result.errmsg = '数据错误[2]';
            break;
        }

        if (undefined == req.body.userid || null == req.body.userid) {
            result.errcode = 1;
            result.errmsg = '数据错误[3]';
            break;
        }

        if (undefined == req.body.diamond || null == req.body.diamond) {
            result.errcode = 1;
            result.errmsg = '数据错误[4]';
            break;
        }

        if (!/^[1-9]\d*$/.test(req.body.diamond_time)) {
            result.errcode = 1;
            result.errmsg = '数据错误[5]';
            break;
        }

        if (!/^[1-9]\d*$/.test(req.body.userid)) {
            result.errcode = 1;
            result.errmsg = '数据错误[6]';
            break;
        }

        if (!/^[1-9]\d*$/.test(req.body.diamond)) {
            result.errcode = 1;
            result.errmsg = '数据错误[7]';
            break;
        }

        if (diamond_time != req.body.diamond_time) {
            result.errcode = 1;
            result.errmsg = '数据错误[8]';
            break;
        }

    } while (false);
}


module.exports = router;