const express = require('express');
const router = express.Router();
const menus = require('../../const/admin_menus.js');

router.get('/', async function (req, res) {
    let options = {};
    options.layout = 'admin/layout';
    // options.menu = menus.get(req.session.admin.is_admin);
    options.menu = menus.get(0);
    options.cur = 'home';
    res.render('admin/index', options);
});

module.exports = router