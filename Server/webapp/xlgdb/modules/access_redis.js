"use strict";
let inited = false;
let redisMobile = null;
const accessWeb = function (req, res, next) {
    let api = {
        '/api/user/charge': "用户兑换",
        '/api/user/unharvest': '用户未收取元龙币',
        '/api/user/updatepass': '更新用户密码'
    };
    let front = {
        '/community': '社区',
        '/personal': '个人信息'
    };
    let admin = {
        '/admin': '后台管理首页',
        '/admin/index': '后台管理首页',
        '/admin/manager': '管理员列表界面',
        '/admin/manager/view-1': '创建管理员界面',
        '/admin/manager/view-2': '编辑管理员界面',
        '/admin/user': '用户列表界面',
        '/admin/user/view-1': '创建用户界面',
        '/admin/user/view-2': '编辑用户界面',
        '/admin/equity': '股权设置界面',
        '/admin/equity/search': '股权查询界面',
        '/admin/notice/list': '公告列表设置',
        '/admin/notice/create': '创建公告设置界面',
        '/admin/notice/edit': '编辑公告设置界面',
        '/admin/activities/list': '活动列表设置界面',
        '/admin/activities/create': '创建活动设置界面',
        '/admin/activities/edit': '编辑活动设置界面',

        '/admin/order/list': '订单记录页面',

        '/admin/eth/list': '以太坊转入转出列表',
        '/admin/contract/list': '合约管理列表',
        '/admin/contract/create': '创建合约',
        // '/admin/contract/edit':'编辑合约',
        '/admin/contract/out_list': '转出任务列表',
        '/admin/contract/config': '以太坊全局配置',
        '/admin/contract/send_logs': '以太坊发送日志',

        '/admin/ueditor': '上传文件接口',
        '/admin/manager/create': '创建管理员接口',
        '/admin/manager/update': '创建管理员接口',
        '/admin/user/create': '创建用户接口',
        '/admin/user/update': '编辑用户接口',
        '/admin/equity/set': '设置股权接口',
        '/admin/notice/add': '创建公告接口',
        '/admin/notice/update': '更新公告接口',
        '/admin/notice/delete': '删除公告接口',
        '/admin/activities/add': '创建活动接口',
        '/admin/activities/update': '更新活动接口',
        '/admin/activities/delete': '删除活动接口',
        '/admin/contract/add': '创建合约接口',
        '/admin/contract/redo': '重新执行转出',
        '/admin/contract/account': '设置中心账户',
        '/admin/contract/blocknumber': '设置同步区块高度'
    };

    if ('/admin/signin' == req.path || '/admin/manager/signout' == req.path || '/admin/manager/signin' == req.path) {
        next();
    } else {
        if (api[req.path]) {
            if (req.session && req.session.user) {
                next();
            } else {
                res.json({ errcode: -1000, errmsg: "登录超时或未登录" });
            }
        } else if (front[req.path]) {
            if (req.session && req.session.user) {
                next();
            } else {
                res.redirect('/signin');
            }
        } else if (admin[req.path]) {
            if (req.session && req.session.admin) {
                next();
            } else {
                if (req.xhr) {
                    res.json({ errcode: -1000, errmsg: "登录超时或未登录" });
                } else {
                    res.redirect('/admin/signin');
                }
            }
        } else {
            if (/^\/admin/.test(req.path)) {
                if (req.xhr) {
                    res.json({ errcode: -1000, errmsg: "登录超时或未登录" });
                } else {
                    res.redirect('/admin/signin');
                }
            } else {
                next();
            }
        }
    }
}

const accessApp = async function (req, res, next) {
    if (req.path == '/app/reset_pwd' || req.path == '/app/login' || req.path == '/app/register') {
        next();
    } else {
        if (undefined == req.query.token || null == req.query.token) {
            res.json({ errcode: -1000, errmsg: "未登陆" });
        } else {
            let rnd3 = 'token:' + req.query.token;
            try {
                let user = await redisMobile.get(rnd3);
                if (user) {
                    req.user = JSON.parse(user);
                    // let rnd4 = 'user:' + req.user.user_id;
                    // await redisMobile.expire(rnd3, 60 * 20);
                    // await redisMobile.expire(rnd4, 60 * 20);
                    next();
                } else {
                    res.json({ errcode: -1000, errmsg: "未登陆" });
                }
            } catch (e) {
                console.log(e);
                res.json({ errcode: -1000, errmsg: "未登陆" });
            }
        }
    }
}

module.exports = {
    init: function (app, redis) {
        if (inited) {
            return console.log('all ready inited');
        }
        inited = true;
        redisMobile = redis;
        app.use(async function (req, res, next) {
            if (/^\/app/.test(req.path)) {
                accessApp(req, res, next);
            } else {
                accessWeb(req, res, next);
            }
        });
    }
}
