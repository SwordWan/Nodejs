"use strict";
const session = require('express-session');
const redis = require('connect-redis')(session);
let inited = false;
module.exports = {
    init: function (app, redis_session_options) {
        if (inited) {
            return console.log('inited...');
        }
        inited = true;
        // let ttl = 1 * 24 * 60 * 60;
        // let redis_session_options = {
        //     "host": "127.0.0.1",
        //     "port": "8888",
        //     "ttl": ttl,   //Session的有效期
        //     "prefix": "dragon_coin_sess:",
        //     db: 0
        // };
        let maxAge = null; //ttl * 1000;
        let session_options = {
            name: "sid",
            cookie: { maxAge: maxAge },
            store: new redis(redis_session_options),
            secret: 'express',
            resave: true,
            saveUninitialized: true
        };
        app.use(session(session_options));
    }
}
