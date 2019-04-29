let io = require("socket.io-client");
let opts = {
    'reconnection': false,
    'force new connection': true,
    'transports': ['websocket', 'polling']
}

let socket = null;
let pUser = null;

function emit(cmd, pArgs) {
    console.log(pArgs);
    do {
        if (null == socket || !socket.connected) {
            console.log('离线');
            break;
        }
        socket.emit(cmd, JSON.stringify(pArgs));
    } while (false);
}

function loginin(arr) {
    let pArgs = {
        szAccount: arr[1],
        szPassword: arr[2],
        iMode: 1
    }
    emit('loginin', pArgs);
}

function creategclub(arr) {
    let pArgs = {
        szName: arr[1]
    }
    emit('creategclub', pArgs);
}

function getgclubinfo(arr) {
    let pArgs = {
        iClubId: arr[1]
    }
    emit('getgclubinfo', pArgs);
}

function createalliance(arr) {
    let pArgs = {
        sname: arr[1]
    }
    emit('createalliance', pArgs);
}

function dissolvedalliance(arr) {
    let pArgs = {

    }
    emit('dissolvedalliance', pArgs);
}

function upgradclub(arr) {
    let pArgs = {
        levels: arr[1]
    }
    emit('upgradclub', pArgs);
}

function allowapply(arr) {
    let pArgs = {
        allianceid: arr[1],
        allow: arr[2] == 'true'
    }
    emit('allowapply', pArgs);
}

function getallianceinfo(arr) {
    let pArgs = {
        allianceid: arr[1]
    }
    emit('getallianceinfo', pArgs);
}

function getalliancemember(arr) {
    let pArgs = {
        allianceid: arr[1]
    }
    emit('getalliancemember', pArgs);
}

function approvealliance(arr) {
    let pArgs = {
        uid: arr[1]
    }
    emit('approvealliance', pArgs);
}

function refusedalliance(arr) {
    let pArgs = {
        uid: arr[1]
    }
    emit('refusedalliance', pArgs);
}

function applyalliance(arr) {
    let pArgs = {
        allianceid: arr[1]
    }
    emit('applyalliance', pArgs);
}

// function getapplyrecorder(arr) {
//     let pArgs = {
//         allianceid: arr[1]
//     }
//     emit('getapplyrecorder', pArgs);
// }

function setallianceadmin(arr) {
    let pArgs = {
        memberid: arr[1],
        clubid: arr[2],
        allow: arr[3] == 'true',
    }
    emit('setallianceadmin', pArgs);
}

function exitalliance(arr) {
    let pArgs = {
        allianceid: arr[1]
    }
    emit('exitalliance', pArgs);
}

function kickalliance(arr) {
    let pArgs = {
        uid: arr[1]
    }
    emit('kickalliance', pArgs);
}

function upgradalliance(arr) {
    let pArgs = {
        levels: arr[1]
    }
    emit('upgradalliance', pArgs);
}

function joinmsg(arr) {
    emit('joinmsg', {});
}

function joinclub(arr) {
    let pArgs = {
        iClubId: arr[1]
    }
    emit('joinclub', pArgs);
}
function approveclub(arr) {
    let pArgs = {
        uid: arr[1]
    }
    emit('approveclub', pArgs);
}
function refuseclub(arr) {
    let pArgs = {
        uid: arr[1]
    }
    emit('refuseclub', pArgs);
}
function setclubadmin(arr) {
    let pArgs = {
        memberid: arr[1],
        clubid: arr[2],
        allow: arr[3] == 'true',
    }
    emit('setclubadmin', pArgs);
}
function getclubusers(arr) {
    let pArgs = {
        clubid: arr[1],
        szName: arr[2]
    }
    emit('getclubusers', pArgs);
}

function setalliancememo(arr) {
    let pArgs = {
        allianceid: arr[1],
        memo: arr[2]
    }
    emit('setalliancememo', pArgs);
}

function printCmd() {
    console.log('0 创建连接');
    console.log('1 登录 1 用户名 密码');
    console.log('2 创建俱乐部 2 俱乐部名称');
    console.log('3 获取俱乐部信息 3 俱乐部ID');
    console.log('4 创建联盟 4 联盟名称');
    console.log('5 升级俱乐部 5 升级等级');
    console.log('6 解散联盟 6 俱乐部 联盟ID');
    console.log('7 设置申请加入联盟 7 联盟ID true');
    console.log('8 获取联盟信息 联盟ID');
    console.log('9 获取联盟成员 9 联盟ID');
    console.log('10 批准加入联盟 10 联盟UID');
    console.log('11 拒绝加入联盟 11 联盟UID');
    console.log('12 申请加入联盟 12 联盟ID');
    console.log('13 任命联盟管理员 13 用户ID 俱乐部ID true or false');
    console.log('14 退出联盟 14 联盟ID');
    console.log('15 踢出联盟 15 联盟UID 联盟ID');
    console.log('16 升级联盟 16 升级等级');
    console.log('17 获取加入消息');
    console.log('18 申请加入俱乐部 18 俱乐部ID');
    console.log('19 批准申请加入俱乐部 19 joinmsg的UID');
    console.log('20 拒绝申请加入俱乐部 20 joinmsg的UID');
    console.log('21 设置俱乐部管理员 21 用户ID 俱乐部ID true or false');
    console.log('22 获取成员列表 22 俱乐部ID');
    console.log('23 联盟介绍 23 联盟ID 联盟介绍')
}

require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
}).on('line', async function (line) {
    let arr = line.split(' ');
    if (arr[0] == '0') {
        socket = io.connect('http://127.0.0.1:9500', opts);
        socket.on("connect", function () {
            console.log('connect');
        });
        socket.on('connect_error', function () {
            console.log('connect_error');
        });
        socket.on('disconnect', function () {
            console.log('disconnect');
        });
        socket.on('loginin_result', function (pData) {
            console.log(pData);
        });
        socket.on('creategclub_result', function (pData) {
            console.log(pData);
        });
        socket.on('getgclubinfo_result', function (pData) {
            console.log(pData);
        });
        socket.on('createalliance_result', function (pData) {
            console.log(pData);
        });
        socket.on('upgradclub_result', function (pData) {
            console.log(pData);
        });
        socket.on('dissolvedalliance_result', function (pData) {
            console.log(pData);
        });
        socket.on('allowapply_result', function (pData) {
            console.log(pData);
        });
        socket.on('getallianceinfo_result', function (pData) {
            console.log(pData);
        });
        socket.on('getalliancemember_result', function (pData) {
            console.log(pData);
        });
        socket.on('approvealliance_result', function (pData) {
            console.log(pData);
        });
        socket.on('refusedalliance_result', function (pData) {
            console.log(pData);
        });
        socket.on('applyalliance_result', function (pData) {
            console.log(pData);
        });
        socket.on('setallianceadmin_result', function (pData) {
            console.log(pData);
        });
        socket.on('exitalliance_result', function (pData) {
            console.log(pData);
        });

        socket.on('kickalliance_result', function (pData) {
            console.log(pData);
        });

        socket.on('upgradalliance_result', function (pData) {
            console.log(pData);
        });
        socket.on('newmsg_result', function (pData) {
            console.log(pData);
        });
        socket.on('joinmsg_result', function (pData) {
            console.log(pData);
        });
        socket.on('joinclub_result', function (pData) {
            console.log(pData);
        });
        socket.on('approveclub_result', function (pData) {
            console.log(pData);
        });
        socket.on('refuseclub_result', function (pData) {
            console.log(pData);
        });
        socket.on('setclubadmin_result', function (pData) {
            console.log(pData);
        });
        socket.on('getclubusers_result', function (pData) {
            console.log(pData);
        });
        socket.on('setalliancememo_result', function (pData) {
            console.log(pData);
        });
    } else if (arr[0] == '1') {
        loginin(arr);
    } else if (arr[0] == '2') {
        creategclub(arr);
    } else if (arr[0] == '3') {
        getgclubinfo(arr);
    } else if (arr[0] == '4') {
        createalliance(arr);
    } else if (arr[0] == '5') {
        upgradclub(arr);
    } else if (arr[0] == '6') {
        dissolvedalliance();
    } else if (arr[0] == '7') {
        allowapply(arr);
    } else if (arr[0] == '8') {
        getallianceinfo(arr);
    } else if (arr[0] == '9') {
        getalliancemember(arr);
    } else if (arr[0] == '10') {
        approvealliance(arr);
    } else if (arr[0] == '11') {
        refusedalliance(arr);
    } else if (arr[0] == '12') {
        applyalliance(arr);
    } else if (arr[0] == '13') {
        setallianceadmin(arr);
    } else if (arr[0] == '14') {
        exitalliance(arr);
    } else if (arr[0] == '15') {
        kickalliance(arr);
    } else if (arr[0] == '16') {
        upgradalliance(arr);
    } else if (arr[0] == '17') {
        joinmsg(arr);
    } else if (arr[0] == '18') {
        joinclub(arr);
    } else if (arr[0] == '19') {
        approveclub(arr);
    } else if (arr[0] == '20') {
        refuseclub(arr);
    } else if (arr[0] == '21') {
        setclubadmin(arr);
    } else if (arr[0] == '22') {
        getclubusers(arr);
    } else if (arr[0] == '23') {
        setalliancememo(arr);
    } else {
        printCmd();
    }
});
