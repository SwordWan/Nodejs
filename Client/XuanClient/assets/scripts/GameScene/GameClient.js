var events = [
	'enter_result',
	'reqsd_result',
	'getsyncdata_result',
	'reqsdpep_result',
	'yazhu_result',
	'lose_result',
	'rest_result',
	'split_result',
	'situp_result',
	'sitdown_result',
	'enable_actions_result',
	'getpjlogs_result',
	'roomplayers_result',
	'getusermsgs_result',
	'addjifen_result',
	'playvoice_result',
	'getjyusers_result',
	'jingyan_result',
	'jclogs_result',
	'showpais_result',
	'start_result',
	'addjifenrep_result',
	'leave_result',
	'jiesan_result',
	'getvoice_result',
	'golds_change_result',
	'liuzuo_result',
	'start_notify',
	'reqsd_notify',
	'getrsdus_notify',
	'reqsdpep_notify',
	'ready_notify',
	'deal_notify',
	'actions_notify',
	'jiesuan_notify',
	'dealnext_notify',
	'lose_notify',
	'rest_notify',
	'yazhu_notify',
	'start_split_notify',
	'enter_notify',
	'split_complete_notify',
	'split_notify',
	'liuzuo_notify',
	'jiesan_notify',
	'situp_notify',
	'sitdown_notify',
	'user_notify',
	'addjifen_notify',
	'leave_notify',
	'yanshi_notify',
	'dists_warn_notify',
	'shp_notify',
	'goldsjc_changed_notify',
	'showpais_notify',
	'zhongjiang_notify',
	'opengame_notify',
	'addjifen_lailao_notify',
	'jiesan_warn_notify',
	'kanpai_notify',
	'connect',
	'error',
    'disconnect',
    'golds_noten_result',
    'gems_noten_result',
    'other_login_result',
    'yanshi_result',
    'killuser_result',
];

//框架信息
var GameClient = cc.Class({
    extends: cc.BaseClass,

    properties: {},

    // use this for initialization
    onLoad: function () {
        cc.vv.socket.connect(cc.vv.GameNet.ip, this);
        if (this.onLoadGame) this.onLoadGame();
    },

    onDestroy: function () {
		console.log('onDestroy');
        cc.vv.socket.disconnect();
    },

    connect: function () {

        cc.vv.socket.addHandlers(events, this);

        var pos = null;
        if (cc.sys.isNative && cc.sys.isMobile) {
            pos = cc.vv.anysdkMgr.getGPSPositionClick();
        } else {
            pos = {
                x: 0,
                y: 0,
            }
        }
        this.unscheduleAllCallbacks();
        cc.vv.socket.send("enter", {
            iUserId: cc.vv.userMgr.userId,
            iRoomId: cc.vv.gameNetMgr.curRoomId,
            iClubId: cc.vv.gameNetMgr._curClubId,
            fLon: pos.x,
            fLat: pos.y
        });
    },

    error: function () {
        //弹出提示框
        console.warn('error');
    },

    disconnect: function () {
        cc.vv.socket.reconnect();
    },
    // update (dt) {},
});