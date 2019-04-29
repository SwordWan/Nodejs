"use strict";
let inited = false;
const accessWeb = async function (req, res, next) {
    if (req.path == '/admin/signin' || req.path == '/admin/signin/signin' || req.path == '/admin/signin/signout') {
        next()
    } else {
        if (req.session && req.session.admin) {
            next();
        } else {
            if (/^\/admin/.test(req.path)) {
                res.redirect('/admin/signin');
            } else {
                next();
            }
        }
    }
}

module.exports = {
    init: function (app) {
        if (inited) {
            return console.log('all ready inited');
        }
        inited = true;
        app.use(async function (req, res, next) {
            accessWeb(req, res, next);
            // next();
        });
    }
}
