"use strict";
const hbs = require('hbs');
const moment = require('moment');
const crypto = require('crypto');

const md5 = function (content) {
	var md5 = crypto.createHash('md5');
	md5.update(content);
	return md5.digest('hex');	
}

const toBase64 = function(content){
	return new Buffer(content).toString('base64');
}

const fromBase64 = function(content){
	return new Buffer(content, 'base64').toString();
}


const blocks = {};
const extend_handler = function (name, context) {
    var block = blocks[name];
    if (!block) {
        block = blocks[name] = [];
    }
    block.push(context.fn(this)); // for older versions of handlebars, use block.push(context(this));
};
const block_handler = function (name, context) {
    var len = (blocks[name] || []).length;
    var val = (blocks[name] || []).join('\n');
    blocks[name] = [];
    return len ? val : context.fn(this);
};
const if_equal = function (a, b, context) {
    if (a == b) {
        return context.fn(this);
    }
    return context.inverse(this);
};
const if_id_not_equal = function (a, b, context) {
    let id = parseInt(a);
    if (a != b && !isNaN(id)) {
        return context.fn(this);
    }
    return context.inverse(this);
};
const prettifySex = function (sex) {
    if (sex == 1) {
        return '男';
    }
    return '女';
};
const prettifyTime = function (timestamp, format) {
    if ("" == timestamp) {
        return "";
    }
    return moment(new Date(timestamp * 1000)).format(format);
}
const greaterThan = function (v1, v2, options) {
    if (v1 > v2) {
        //满足添加继续执行
        return options.fn(this);
    } else {
        //不满足条件执行{{else}}部分
        return options.inverse(this);
    }
}
const addition = function (v1, v2) {
    return v1 + v2;
}
const radio = function (v1, v2) {
    if (v1 == v2) {
        return ' checked="checked" ';
    }
    return ' ';
}
const selected = function (v1, v2) {
    if (v1 == v2) {
        return ' selected="selected" ';
    }
    return ' ';
}
//101 刮刮乐
//102 车行
//103 扯线(25线)
//104 捕鱼
//105 牛牛
//106 21点
//107 消消乐
//108 扯线(9线)
//109 飞禽走兽
const game = function (gameID) {
    if (gameID == 101) {
        return '刮刮乐';
    }
    if (gameID == 102) {
        return '车行';
    }
    if (gameID == 103) {
        return '扯线(25线)';
    }
    if (gameID == 104) {
        return '捕鱼';
    }
    if (gameID == 105) {
        return '牛牛';
    }
    if (gameID == 106) {
        return '21点';
    }
    if (gameID == 107) {
        return '消消乐';
    }
    if (gameID == 108) {
        return '扯线(9线)';
    }
    if (gameID == 109) {
        return '飞禽走兽';
    }
    return '默认';
}
const fmtOpType = function (opType) {
    if (opType == 0) {
        return '赠送';
    }
    return '接收';
}
const fmtOpType2 = function (opType, alias2) {
    if (opType == 0) {
        return '赠送者：' + new Buffer(alias2, 'base64').toString();
    }
    return '接收者：' + new Buffer(alias2, 'base64').toString();
}
const decodeBase64 = function (base64) {
    return new Buffer(base64, 'base64').toString();
}
const fmtGMT = function (v, datefmt) {
    return moment(v).format(datefmt);// 
}
const fmtWin = function (gold) {
    if (gold > 0) {
        return '赢';
    }
    return '输';
}
const fmtOnline = function (online) {
    if (online == 1) {
        return '在线';
    }
    return '离线';
}
const fmtLocked = function (locked) {
    if (locked == 0) {
        return '未锁定';
    }
    return '已锁定';
}
const fmtA = function (gameid) {
    if (gameid == 0) {
        return '#';
    }
    return '/admin/user/detail_kc?gameid=' + gameid;
}

const fmtInput = function (child, golds) {
    if (child > 0) {
        return golds;
    }
    return '<input value="' + golds + '" class="inpMain">&nbsp;<button class="mybtn" onclick="doChange(this);">修改<button>';
}

const fmtInput2 = function (golds) {
    return '<input value="' + golds + '" class="inpMain">&nbsp;<button class="mybtn" onclick="doChange(this);">修改<button>&nbsp;<button class="mybtn" onclick="doZhuanRu(this);">转入奖池<button>';
}

const fmtLevel = function (child, level, gameid) {
    if (child > 0) {
        if (level == 0) {
            return '<a href="/admin/user/detail_kc_1?gameid=' + gameid + '&level=' + level + '">初级场</a>';
        }
        if (level == 1) {
            return '<a href="/admin/user/detail_kc_1?gameid=' + gameid + '&level=' + level + '">中级场</a>';
        }
        if (level == 2) {
            return '<a href="/admin/user/detail_kc_1?gameid=' + gameid + '&level=' + level + '">高级场</a>';
        }
        if (level == 3) {
            return '<a href="/admin/user/detail_kc_1?gameid=' + gameid + '&level=' + level + '">超级场</a>';
        }
    } else {
        if (level == 0) {
            return '初级场';
        }
        if (level == 1) {
            return '中级场';
        }
        if (level == 2) {
            return '高级场';
        }
        if (level == 3) {
            return '超级场';
        }
    }
}
const fmtLockedButton = function (locked) {
    if (locked == 0) {
        return '锁定';
    }
    return '解锁';
}

const fmtVipButton = function (vip) {
    if (vip > 99) {
        return '取消VIP';
    }
    return '设置VIP'
}


const fmtLevel2 = function (level) {
    if (level == 0) {
        return '（初级场）';
    }
    if (level == 1) {
        return '（中级场）';
    }
    if (level == 2) {
        return '（高级场）';
    }
    if (level == 3) {
        return '（超级场）';
    }
}

const fmtLinkPumped = function (gameid, level, s, e) {
    if (gameid == 0) {
        return '#';
    }
    return '/admin/user/pumped_1?gameid=' + gameid + '&level=' + level + '&s=' + s + '&e=' + e;
}

const fmtMoney = function (s, n) {
    if (n > 0) {
        s = parseFloat((s + "").replace(/[^\d\.-]/g, "")).toFixed(n) + "";
    } else {
        s = s + "";
    }
    let r = "";
    let a = s.split(".");
    let l = a[0].split("").reverse();
    if (undefined != a[1]) {
        r = "." + a[1];
    }
    let t = "";
    for (let i = 0; i < l.length; i++) {
        t += l[i] + ((i + 1) % 3 == 0 && (i + 1) != l.length ? "," : "");
    }
    return t.split("").reverse().join("") + r;
}

const fmtGPSState = function(opengps){
    if(0 == opengps){
        return '禁止GPS';
    }
    return '启用GPS';
}


var inited = false;
module.exports = {
    init: function (app, dirname) {
        //设置模板扩展
        if (!inited) {
            inited = true;
            hbs.registerHelper('extend', extend_handler);
            //设置模板block
            hbs.registerHelper('block', block_handler);
            //设置模板block
            hbs.registerHelper('if_equal', if_equal);
            hbs.registerHelper('if_id_not_equal', if_id_not_equal);
            hbs.registerHelper('prettifySex', prettifySex);
            hbs.registerHelper('prettifyTime', prettifyTime);
            hbs.registerHelper("greaterThan", greaterThan);
            hbs.registerHelper('addition', addition);
            hbs.registerHelper('radio', radio);
            hbs.registerHelper('selected', selected);
            hbs.registerHelper('game', game);
            hbs.registerHelper('fmtOpType', fmtOpType);
            hbs.registerHelper('fmtOpType2', fmtOpType2);
            hbs.registerHelper('decodeBase64', decodeBase64);
            hbs.registerHelper('fmtGMT', fmtGMT);
            hbs.registerHelper('fmtWin', fmtWin);
            hbs.registerHelper('fmtOnline', fmtOnline);
            hbs.registerHelper('fmtLocked', fmtLocked);
            hbs.registerHelper('fmtA', fmtA);
            hbs.registerHelper('fmtInput', fmtInput);
            hbs.registerHelper('fmtLevel', fmtLevel);
            hbs.registerHelper('fmtLockedButton', fmtLockedButton);
            hbs.registerHelper('fmtLevel2', fmtLevel2);
            hbs.registerHelper('fmtLinkPumped', fmtLinkPumped);
            hbs.registerHelper('fmtMoney', fmtMoney);
            hbs.registerHelper('fmtVipButton', fmtVipButton);
            hbs.registerHelper('fmtInput2',fmtInput2)
            hbs.registerHelper('fromBase64',fromBase64);
            hbs.registerHelper('fmtGPSState',fmtGPSState);
            //设置局部模板路径
            hbs.registerPartials(dirname + '/views/partials');
            //设置模板引擎,用hbs作为模版引擎
            app.set('view engine', 'hbs');
            //设置模板路径
            app.set('views', dirname + '/views');
        }
    }
}

