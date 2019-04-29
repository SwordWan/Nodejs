const express = require('express');
const router = express.Router();
const driver = require('../../driver/driver');
const db = require('../../dal/tb_users.js');
const crypto = require('crypto');

router.get('/', function (req, res) {
    res.render('admin/signin', {
        layout: false
    });
});

router.post('/signin', async function (req, res, next) {
    let conn = driver.get();
    let user = req.query.user || req.body.user || '';
    let pass = req.query.pass || req.body.pass || '';
    let result = { errcode: 0, errmsg: '登陆成功' };
    let row = null;
    do {
        try {
            row = {
                user: user
            }
            let currtime = Math.floor(new Date().getTime() / 1000);

            // let res = await db.tb_users_get_by_account(conn, row.user);
            let sql = 'select * from tb_admin_cc where account = $1';
            let res = await conn.Query(sql, [user]);
            if (res.rowCount == 0) {
                result.errcode = -1;
                result.errmsg = '用户名或密码错误';
                break;
            }
            row = res.rows[0];
            if (row.locktime > currtime) {
                result.errcode = -1;
                result.errmsg = '用户被锁定';
                break;
            }

            if (row.pass.toLowerCase() != crypto.createHash('md5').update(pass).digest('hex').toLowerCase()) {
                console.log('密码不正确');
                let val = [user];
                sql = 'update tb_admin_cc set logincount = logincount + 1 where account = $1';
                if (row.locktime == 0) {
                    let locktime = currtime + 15 * 60;
                    val = [locktime, user];
                    sql = 'update tb_admin_cc set logincount = 1 ,locktime = $1 where account = $2';
                }

                await conn.Query(sql, val);
                result.errcode = -1;
                result.errmsg = '用户名或密码错误';
                break;
            }

            sql = 'update tb_admin_cc set logincount = 0 ,locktime = 0 where account = $1';
            await conn.Query(sql, [user]);

        } catch (e) {
            result.errcode = -1;
            result.errmsg = '用户名或密码错误，错误码[2]';
        }
    } while (false);

    if (result.errcode == 0) {
        req.session.admin = row;
    }
    await conn.Release();
    res.json(result);
});

router.get('/signout', async function (req, res, next) {
    req.session.destroy(function (err) {
        res.redirect('/admin/signin');
    });
});

module.exports = router