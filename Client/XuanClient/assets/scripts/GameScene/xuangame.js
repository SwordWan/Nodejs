import { unwatchFile, futimes } from "fs";
import { isUndefined } from "util";
// var Base64 = require("base64");
var socket = null;
var connectCount = 0;
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

var GameClient = require('GameClient')
cc.Class({
    extends: GameClient,

    properties: {
        menuFrame: { default: null, type: cc.Node },
        guizeFrame: { default: null, type: cc.Node },
        huiguFrame: { default: null, type: cc.Node },
        emojiFrame: { default: null, type: cc.Node },
        RoomInfoFrame: { default: null, type: cc.Node },
        Seats: { default: [], type: cc.Node },
        PokeAtlas: { default: null, type: cc.SpriteAtlas },
        DragPokes: { default: [], type: cc.Node },
        VoiceBtn: { default: null, type: cc.Node },
        VoiceAnim: { default: null, type: cc.Node },
        LiuZhuoParent: { default: null, type: cc.Node },
        Systtime: { default: null, type: cc.Label },
        GPSNode: { default: null, type: cc.Node },
        BateryNode: { default: null, type: cc.Sprite },
        AdminMessage: { default: null, type: cc.Node },
        StartBtn: { default: null, type: cc.Node },
        MangGuo: { default: null, type: cc.Node },
        PiChi: { default: null, type: cc.Node },
        ResultNode: { default: null, type: cc.Node },
        ResultScore: { default: null, type: cc.Node },
        ResultChip: { default: null, type: cc.Node },
        BatterySprite: { default: null, type: cc.Sprite },
        UserInfo: { default: null, type: cc.Node },
        HistoryParent: { default: null, type: cc.Node },
        ObuesrParent: { default: null, type: cc.Node },
        LeftInfoClubItem: { default: null, type: cc.Node },
        LeftInfoUserItem: { default: null, type: cc.Node },
        jiesanLbl: { default: null, type: cc.Label },
        JinYanParent: { default: null, type: cc.Node },
        JiangChiLbl: { default: null, type: cc.Node },
        JiangChiNode: { default: null, type: cc.Node },
        JiangChiLogItem: { default: null, type: cc.Node },
        JiangChiBiggest: { default: null, type: cc.Node },
        readyTime: { default: null, type: cc.Label },
        MangguoCoin: { default: null, type: cc.Node },
        reconnctNode: { default: null, type: cc.Node },
        Dipai: { default: null, type: cc.Node },

        _destId: 0,
        _curRoomId: 0,
        _gameData: null,
        _dizhu: 0,
        _totalDairu: 0,
        _seatScript: [],
        _selfSeat: null,
        _selfScript: null,
        _seatsInfo: null,
        _seeplayerInfo: null,
        _allPlayerInfo: [],
        _sitDownData: null,
        _autoXiuDiu: false,
        _autoXiu: false,
        _roomData: null,
        _createTime: null,
        _lastTime: null,
        _curtime: null,
        _piCount: 0,
        _selfSeatID: 0,
        _zuidiDaFen: 0,
        _GPSData: null,
        _addJifen: false,
        _currentJuShu: 0,
        _curShoushu: 0,
        _zongShoushu: 0,
        _isadminUser: false,
        _isShowClub: false,
        _roomPlayerData: null,
        _lastTouchTime: null,
        _voiceData: null,
        _jiesanTime: null,
        _ShowJieSuanTime: false,
        _daojishiFunc: null,
        _curJinYanData: null,
        _ReadyGameFunc: null,
        _curDelayPay: 0,
        _xiupaiTime: 0,
        _backtable: false,
        _curMaxDrag: 0,
        _bOpenGame: false,
        _isFenPaiing: false,
        _SliderMax: 0,
        _enableBtnFunc: false,
        _tidaojishiFunc: false,
        _JiesuanIng: false,
        _voiceArr:[],
        _selfActions: false,
        _GPSQuan: false,
        _jieSuanFunc: null,
        _jieSuanFunc1: null,
        _jieSuanFunc2: null,
        _ZhongjiangInfo:[],
    },

    onLoadGame: function () {
        cc.vv.xuangame = this;
        cc.vv.gameNetMgr._shouldJumpZhanjiFrame = false,
        this._ZhongjiangInfo = [];
        this._voiceData = [];
        for (var i = 0; i < this.Seats.length; i++) {
            this._seatScript.push(this.Seats[i].getComponent("XuanGameSeat"));
        }
        this._selfSeat = this.Seats[0];
        this._selfScript = this._selfSeat.getComponent("XuanGameSeat");
        this._curRoomId = cc.vv.gameNetMgr.curRoomId;
        
        this._selfSeatID = -1;
        this.initDragStuffs(this.VoiceBtn);
        for (var i = 0; i < this._seatScript.length; i++) {
            this._seatScript[i]._seatIndex = i;
        }
        
    },
	
    yanshi_result: function (data) {
        if (data.wErrCode == 0) {
        } else {
            cc.vv.alert.show(data.szErrMsg);
        }
    },

    killuser_result: function (data) {
        this.UserInfo.active = false;
        if (data.wErrCode == 0) {
            cc.vv.alert.show("踢出成功");
        } else {
            cc.vv.alert.show(data.szErrMsg);
        }
    },

    other_login_result: function (data) {
        cc.vv.alert._callBack = function () {
            cc.sys.localStorage.removeItem("UserName");
            cc.sys.localStorage.removeItem("UserPwd");
            console.log("清除用户信息");
            cc.vv.userMgr.userId = 0,
                cc.director.loadScene("login");
        }
        cc.vv.alert.show("您的账号在其他设备登录！");
    },

    gems_noten_result: function (event, arg) {
        cc.vv.alert.show("钻石不足！", null);
    },

    golds_noten_result: function (event, arg) {
        cc.vv.alert.show("金币不足！", null);
    },

    ResetAllSeatIndex: function (index) {
        this._selfSeatID = index;
        for (var i = 0; i < this._seatScript.length; i++) {
            if (index == 8)
                index = 0;
            this._seatScript[i]._seatIndex = index;
            index++;
        }
    },

    initPhoneINfo: function () {
        if (!cc.sys.isNative && !cc.sys.isMobile) {
            return;
        }
        this.scheduleOnce(function () {
            var dianl = cc.vv.anysdkMgr.getBatteryClick();
            //var dianl = 0.5;
            this.SetBattery(dianl);
        }, 1);

    },

    SetBattery: function (per) {
        if (per <= 0.2) {
            this.BatterySprite.node.color = new cc.Color(255, 0, 0, 255);
        } else if (per <= 0.4) {
            this.BatterySprite.node.color = new cc.Color(255, 255, 0, 255);
        } else {
            this.BatterySprite.node.color = new cc.Color(0, 255, 0, 255);
        }
        this.BatterySprite.fillRange = per;
    },

    liuzuo_result: function (data) {
        if (data.wErrCode == 0) {
        } else {
            cc.vv.alert.show(data.szErrMsg);
        }
    },

    golds_change_result: function (data) {
        cc.vv.userMgr.coins = data.iGolds;
    },

    getvoice_result: function (data) {
        if (data.iMode == 0) {
            this.UserInfo.getChildByName("voicereplay_1").getComponent(cc.Button).interactable = false;
        } else {
            this.UserInfo.getChildByName("voicereplay_1").getComponent(cc.Button).interactable = true;
        }
    },

    kanpai_notify: function (data) {
        //if (data.wErrCode == 0) {
        var seat = this.getSeatByUserId(data.iUserId);
        if (seat != null) {
            seat.EndShowPaiself(parseInt(data.iIndex), data.iPai);
        }
        //} else {
        //    cc.vv.alertTip.show(data.szErrMsg);
        //}
    },

    jiesan_result: function (data) {
        if (data.wErrCode == 0) {
        } else {
            cc.vv.alertTip.show("这一手结束后牌局将自动解散!!");
        }
    },

    jiesan_warn_notify: function (data) {
        cc.vv.alertTip.show("牌局还有五分钟结束！！");
    },

    leave_result: function (data) {
        if (data.wErrCode == 1004) {
            cc.vv.userMgr.iRoomId = 0;
            cc.director.loadScene("hall");
            return;
        }
        if (data.wErrCode == 0) {
        } else {
            cc.vv.alert.show(data.szErrMsg);
        }
    },

    addjifenrep_result: function (data) {
        if (data.wErrCode == 0) {
        } else {
            cc.vv.alert.show(data.szErrMsg);
        }
    },

    addjifen_lailao_notify: function (data) {
        if (data.wErrCode == 0) {
            if (!this.node.getChildByName("liuzhuoFrame").active) {
                this.node.getChildByName("gameme_ssage").active = true;
                // cc.vv.audioMgr.playSFX("WaitOperation.mp3");
            } else {
                this.getrsdus();
            }
            if (data.iCmd == 1) {
                this.node.getChildByName("gameme_ssage").children[0].active = true;
                this.node.getChildByName("liuzhuoFrame").getChildByName("refresh").children[0].active = true;
                cc.vv.audioMgr.playSFX("application.mp3");
            } else {
                // cc.vv.audioMgr.playSFX("WaitOperation.mp3");
            }

        } else {
            cc.vv.alert.show(data.szErrMsg);
        }
    },

    opengame_notify: function (data) {
        this._jiesanTime = Date.now() + data.iTimeSY * 1000;
        this.unschedule(this._ReadyGameFunc);
        this.node.getChildByName("starttime").active = false;
        this.node.getChildByName("game_btnstart").active = false;
        this.MangGuo.parent.active = true;
        this.PiChi.parent.active = true;
        this._bOpenGame = true;
    },

    start_result: function (data) {

    },

    GetString: function (index) {
        if (index == 1) {
            return "天皇";
        } else if (index == 2) {
            return "朵皇";
        } else {
            return "朵朵朵";
        }
    },

    zhongjiang_notify: function (data) {
        if (data.wErrCode == 0) {
            this._ZhongjiangInfo.push(data);
            var info = this._ZhongjiangInfo[0];
            this.DisplayZhongjiangInfo(info);
            this._ZhongjiangInfo.splice(0,1);
        } else {
            cc.vv.alert.show(data.szErrMsg);
        }
    },

    DisplayZhongjiangInfo: function (data) {
        var paoma = this.node.getChildByName("paomading");
        var str = "恭喜玩家";
        if (data.str) {
            str = data.str;
        } else {
            for (var i = 0; i < data.wins.length; i++) {
                if (i == data.wins.length - 1) {
                    str += data.wins[i].username + "击中:" + this.GetString(data.wins[i].type) + "获得" + data.wins[i].golds + "积分,";
                } else {
                    str += data.wins[i].username + "击中:" + this.GetString(data.wins[i].type) + "获得" + data.wins[i].golds + "积分,";
                }
            }
        }
        paoma.getChildByName("lbl").getComponent(cc.Label).string = str;
        paoma.active = true;
        paoma.getChildByName("lbl").getComponent(cc.Animation).play("ZHongjianganim");
        this.scheduleOnce(function () {
            paoma.active = false;
            if (this._ZhongjiangInfo.length > 0) {
                var info = this._ZhongjiangInfo[0];
                this.DisplayZhongjiangInfo(info);
                this._ZhongjiangInfo.splice(0, 1);
            }
        }, 10);
    },

    showpais_result: function (data) {
        if (data.wErrCode == 0) {
        } else {
            cc.vv.alert.show(data.szErrMsg);
        }
    },

    showpais_notify: function (data) {
        this._selfScript.CaoZuoBtnParent.getChildByName("xiupaibtn").active = false;
        for (var info in data.pPaiMaps) {
            var seat = this.getSeatByUserId(info);
            if (seat._fenpai) {
                continue;
            }
            seat.ShowPai(data.pPaiMaps[info]);
        }
        this._xiupaiTime = 3;
    },

    goldsjc_changed_notify: function (data) {

        if (data.wErrCode == 0) {
            this.SetJiangchiLbl(data.iGolds);
        } else {
            cc.vv.alert.show(data.szErrMsg);
        }
    },

    jclogs_result: function (data) {
        if (data.wErrCode == 0) {
            var curdiData = null;
            this.JiangChiNode.active = true;
            var frame1 = this.JiangChiNode.getChildByName("frame1");
            var str = "0000000" + data.iGoldsTotal;
            frame1.getChildByName("jianghci").getComponent(cc.Label).string = str.substring(str.length - 6);;
            var dipiinfo = frame1.getChildByName("dipiinfo");
            for (var i = 0; i < data.iJiangChi.length; i++) {
                dipiinfo.children[i].getChildByName("gold").getComponent(cc.Label).string = data.iJiangChi[i].golds;
                if (parseInt(dipiinfo.children[i].name) == this._roomData.iBaseFen) {
                    curdiData = data.iJiangChi[i];
                }
            }
            var frame2 = this.JiangChiNode.getChildByName("frame2");
            var str = "0000000" + curdiData.golds;
            frame2.getChildByName("jianghci").getComponent(cc.Label).string = str.substring(str.length - 6);;
            frame2.getChildByName("title").getComponent(cc.Label).string = this._roomData.iBaseFen + "皮级别积分池设定";
            frame2.getChildByName("tianhuang").getChildByName("blue").getComponent(cc.Sprite).fillRange = -curdiData.tianhuang / 100;
            frame2.getChildByName("tianhuang").getChildByName("per").getComponent(cc.Label).string = curdiData.tianhuang + "%";
            frame2.getChildByName("duohuang").getChildByName("blue").getComponent(cc.Sprite).fillRange = -curdiData.duohuang / 100;
            frame2.getChildByName("duohuang").getChildByName("per").getComponent(cc.Label).string = curdiData.duohuang + "%";
            frame2.getChildByName("duo").getChildByName("blue").getComponent(cc.Sprite).fillRange = -curdiData.duoduoduo / 100;
            frame2.getChildByName("duo").getChildByName("per").getComponent(cc.Label).string = curdiData.duoduoduo + "%";

            var frame3 = this.JiangChiNode.getChildByName("frame3");
            frame3.getChildByName("title").getComponent(cc.Label).string = this._roomData.iBaseFen + "皮级别积分池记录";
            if (data.maxUser == null) {
                frame3.getChildByName("info").active = false;
                this.JiangChiBiggest.active = false;
            } else {
                frame3.getChildByName("info").active = true;
                this.JiangChiBiggest.active = true;
                frame3.getChildByName("info").getChildByName("name").getComponent(cc.Label).string = data.maxUser.alias;
                this.JiangChiBiggest.getChildByName("name").getComponent(cc.Label).string = data.maxUser.alias;
                this.JiangChiBiggest.getChildByName("type").getComponent(cc.Label).string = data.maxUser.type;
                this.JiangChiBiggest.getChildByName("gold").getComponent(cc.Label).string = data.maxUser.golds;
                this.JiangChiBiggest.getChildByName("date").getComponent(cc.Label).string = cc.vv.gameNetMgr.dateFormatDay(data.maxUser.ctime);
            }

            for (var i = 1; i < this.JiangChiLogItem.parent.children.length; i++) {
                this.JiangChiLogItem.parent.children[i].destroy();
            }

            for (var i = 0; i < data.pLogs.length; i++) {
                var item = cc.instantiate(this.JiangChiLogItem);
                item.parent = this.JiangChiLogItem.parent;
                item.getChildByName("name").getComponent(cc.Label).string = data.pLogs[i].alias;
                item.getChildByName("type").getComponent(cc.Label).string = data.pLogs[i].type;
                item.getChildByName("gold").getComponent(cc.Label).string = data.pLogs[i].golds;
                item.getChildByName("date").getComponent(cc.Label).string = cc.vv.gameNetMgr.dateFormatDay(data.pLogs[i].ctime);
                item.active = true;
            }
        } else {
            cc.vv.alert.show(data.szErrMsg);
        }
    },

    shp_notify: function (data) {
        if (data.wErrCode == 0) {
        } else {
            cc.vv.alert.show(data.szErrMsg);
        }
    },

    jingyan_result: function (data) {
        if (data.wErrCode == 0) {
            if (this.UserInfo.active) {
                if (this._isadminUser) {
                    if (data.iMode) {
                        this.UserInfo.getChildByName("novoice").active = true;
                        this.UserInfo.getChildByName("openvoice").active = false;
                    } else {
                        this.UserInfo.getChildByName("novoice").active = false;
                        this.UserInfo.getChildByName("openvoice").active = true;
                    }
                } else {
                    this.UserInfo.getChildByName("openvoice").active = false;
                    this.UserInfo.getChildByName("novoice").active = false;
                }
            }
            cc.vv.socket.send("getjyusers", { iRoomId: this._curRoomId });
        } else {
            cc.vv.alert.show(data.szErrMsg);
        }
    },

    getjyusers_result: function (data) {
        if (data.wErrCode == 0) {
            this._curJinYanData = data.pRetObj;
            for (var i = 3; i < this.JinYanParent.children.length; i++) {
                this.JinYanParent.children[i].destroy();
            }

            var userItempre = this.JinYanParent.getChildByName("user");
            if (data.pRetObj.pSeatPlayers.length > 0) {
                this.JinYanParent.getChildByName("tablelbl").active = true;
                for (var i = 0; i < data.pRetObj.pSeatPlayers.length; i++) {
                    var seatitem = cc.instantiate(userItempre);
                    seatitem.parent = this.JinYanParent;
                    seatitem.getChildByName("info").getChildByName("name").getComponent(cc.Label).string = data.pRetObj.pSeatPlayers[i].szAlias;
                    seatitem.active = true;
                    seatitem.getChildByName("info").getChildByName("id").getComponent(cc.Label).string = data.pRetObj.pSeatPlayers[i].iUserId;
                    if (data.pRetObj.pSeatPlayers[i].bJinYan) {
                        seatitem.getChildByName("novoice").active = true;
                    } else {
                        seatitem.getChildByName("openvoice").active = true;
                    }
                }
            }
            if (data.pRetObj.pSeePlayers.length > 0) {
                this.JinYanParent.getChildByName("oblbl").active = true;
                for (var i = 0; i < data.pRetObj.pSeePlayers.length; i++) {
                    var seatitem = cc.instantiate(userItempre);
                    seatitem.parent = this.JinYanParent;
                    seatitem.active = true;
                    seatitem.getChildByName("info").getChildByName("name").getComponent(cc.Label).string = data.pRetObj.pSeePlayers[i].szAlias;
                    seatitem.getChildByName("info").getChildByName("id").getComponent(cc.Label).string = data.pRetObj.pSeePlayers[i].iUserId;
                    if (data.pRetObj.pSeePlayers[i].bJinYan) {
                        seatitem.getChildByName("novoice").active = true;
                    } else {
                        seatitem.getChildByName("openvoice").active = true;
                    }
                }
            }
        } else {
            cc.vv.alert.show(data.szErrMsg);
        }
    },

    dists_warn_notify: function (data) {
        var gpsparent = this.node.getChildByName("GPSFrame").getChildByName("parent");
        this.GPSNode.children[0].active = false;
        for (var i = 2; i < gpsparent.children.length; i++) {
            gpsparent.children[i].destroy();
        }
        for (var i in data) {
            if (data[i].length >= 2) {
                this.GPSNode.children[0].active = true;
                var gpsitem = cc.instantiate(gpsparent.getChildByName("icon_warning"));
                gpsitem.parent = gpsparent;
                gpsitem.children[0].getComponent(cc.Label).string = "玩家距离小于100米";
                gpsitem.active = true;
            }
            for (var k = 0; k < data[i].length; k++) {
                var item = cc.instantiate(gpsparent.getChildByName("item"));
                item.parent = gpsparent;
                item.getChildByName("name").getComponent(cc.Label).string = data[i][k].szAlias;
                item.active = true;
            }
        }
    },

    playvoice_result: function (data) {
        if (data.wErrCode == 0) {
            this.UserInfo.active = false;
            this.playVoice(data);
        } else {
            cc.vv.alert.show(data.szErrMsg);
        }
    },

    addjifen_result: function (data) {
        if (data.wErrCode == 0) {
        } else {
            cc.vv.alert.show(data.szErrMsg);
        }
    },
    getusermsgs_result: function (data) {
        if (data.wErrCode == 0) {
        } else {
            cc.vv.alert.show(data.szErrMsg);
        }
    },

    roomplayers_result: function (data) {
        this._roomPlayerData = data;
        this.scheduleOnce(function () {
            this.initRoomInfo();
        }, 0.3);
        if (this._bOpenGame) {
            this._jiesanTime = Date.now() + data.iTimeSY * 1000;
        }
    },

    initRoomInfo: function () {
        for (var i = 2; i < this.LeftInfoClubItem.parent.children.length; i++) {
            this.LeftInfoClubItem.parent.children[i].destroy();
        }
        if (this._isShowClub) {
            for (var i in this._roomPlayerData.pUserMaps) {
                var item = cc.instantiate(this.LeftInfoClubItem);
                item.parent = this.LeftInfoClubItem.parent;
                item.children[0].getComponent(cc.Label).string = this._roomPlayerData.pUserMaps[i].szClubName;
                item.active = true;

                var clubusers = this._roomPlayerData.pUserMaps[i].pUserObjs;
                for (var j = 0; j < clubusers.length; j++) {
                    var item = cc.instantiate(this.LeftInfoUserItem);
                    item.parent = this.LeftInfoUserItem.parent;
                    item.getChildByName("username").getComponent(cc.Label).string = clubusers[j].szAlias;
                    item.getChildByName("number").getComponent(cc.Label).string = clubusers[j].iJiFenDR;
                    item.getChildByName("score").getComponent(cc.Label).string = clubusers[j].iJiFenSY;
                    if (clubusers[j].iJiFenSY > 0) {
                        item.getChildByName("score").color = new cc.Color(250, 80, 80);
                        item.getChildByName("score").getComponent(cc.Label).string = "+" + clubusers[j].iJiFenSY;
                    } else {
                        item.getChildByName("score").color = new cc.Color(160, 255, 160);
                    }
                    if (!clubusers[j].bOnline) {
                        item.getChildByName("username").color = new cc.Color(107, 107, 107);
                        item.getChildByName("number").color = new cc.Color(107, 107, 107);
                        item.getChildByName("score").color = new cc.Color(107, 107, 107);
                    }
                    item.active = true;
                }
            }
        } else {
            var clubusers = this._roomPlayerData.pJiFenUesrs;
            for (var j = 0; j < clubusers.length; j++) {
                var item = cc.instantiate(this.LeftInfoUserItem);
                item.parent = this.LeftInfoUserItem.parent;
                item.getChildByName("username").getComponent(cc.Label).string = clubusers[j].szAlias;
                item.getChildByName("number").getComponent(cc.Label).string = clubusers[j].iJiFenDR;
                item.getChildByName("score").getComponent(cc.Label).string = clubusers[j].iJiFenSY;
                if (clubusers[j].iJiFenSY > 0) {
                    item.getChildByName("score").color = new cc.Color(250, 80, 80);
                    item.getChildByName("score").getComponent(cc.Label).string = "+" + clubusers[j].iJiFenSY;
                } else {
                    item.getChildByName("score").color = new cc.Color(160, 255, 160);
                }
                if (!clubusers[j].bOnline) {
                    item.getChildByName("username").color = new cc.Color(107, 107, 107);
                    item.getChildByName("number").color = new cc.Color(107, 107, 107);
                    item.getChildByName("score").color = new cc.Color(107, 107, 107);
                }

                item.active = true;
            }
        }
        this.LeftInfoUserItem.parent.height = (this.LeftInfoUserItem.parent.children.length + 1) * this.LeftInfoUserItem.height;
        this.RoomInfoFrame.getChildByName("New ScrollView").getComponent(cc.ScrollView).scrollToTop();
        this.InitObUserInfo(this._roomPlayerData.pSeePlayers);
    },

    OnShowClubClick: function (event, arg) {
        cc.vv.audioMgr.playSFX("dian.mp3");
        this._isShowClub = true;
        event.target.parent.active = false;
        event.target.parent.parent.getChildByName("white").active = true;
        this.initRoomInfo();
    },

    OnDisClubClick: function (event, arg) {
        cc.vv.audioMgr.playSFX("dian.mp3");
        this._isShowClub = false;
        event.target.parent.active = false;
        event.target.parent.parent.getChildByName("gray").active = true;
        this.initRoomInfo();
    },

    yanshi_notify: function (data) {
        if (data.wErrCode == 0) {
            if (data.iUserId == cc.vv.userMgr.userId) {
                this._curDelayPay *= 2;
                this._selfScript.CaoZuoBtnParent.getChildByName("delay_1").children[0].getComponent(cc.Label).string = this._curDelayPay;
            }
            var user = this.getSeatByUserId(data.iUserId);
            user.ChangeProgress(data.iWaitTimes);
        } else {
            cc.vv.alert.show(data.szErrMsg);
        }
    },


    getpjlogs_result: function (data) {
        if (data.pData == null) {
            return;
        }
        this.huiguFrame.getChildByName("shoushu").getComponent(cc.Label).string = "第" + data.pData.iPlayTimes + "手";
        this._curShoushu = data.pData.iPlayTimes;
        this._zongShoushu = parseInt(data.iCount);
        var itempre = this.HistoryParent.children[0];
        for (var i = 1; i < this.HistoryParent.children.length; i++) {
            this.HistoryParent.children[i].destroy();
        }
        for (var i = 0; i < data.pData.pLogs.length; i++) {
            var item = cc.instantiate(itempre);
            item.parent = this.HistoryParent;
            var itemdata = data.pData.pLogs[i];
            item.getChildByName("iconMask").children[0].getComponent("LoadImage").LoadUserIcon(data.pData.pLogs[i].iUserId);
            item.getChildByName("name").getComponent(cc.Label).string = data.pData.pLogs[i].szAlias;
            var poke = item.getChildByName("PokeNode");

            if (itemdata.pPais1 != null) {
                item.getChildByName("kaipai").active = true;
                item.getChildByName("qipai").active = false;
            } else if (itemdata.pPais1 == null && itemdata.iState != 5) {
                item.getChildByName("kaipai").active = false;
                item.getChildByName("qipai").active = false;
            } else {
                item.getChildByName("kaipai").active = false;
                item.getChildByName("qipai").active = true;
            }
            var display = false;
            // itemdata.pPais.length == 4 && 
            if (itemdata.pPais1 != null) {
                display = true;
                this.SetPai(poke.children[0], itemdata.pPais1[0]);
                if (itemdata.pPais1[0] == itemdata.pPais[0] || itemdata.pPais1[0] == itemdata.pPais[1]) {
                    item.getChildByName("line1").active = true;
                }
                this.SetPai(poke.children[1], itemdata.pPais1[1]);
                if (itemdata.pPais1[1] == itemdata.pPais[0] || itemdata.pPais1[1] == itemdata.pPais[1]) {
                    item.getChildByName("line2").active = true;
                }
                this.SetPai(poke.children[2], itemdata.pPais2[0]);
                if (itemdata.pPais2[0] == itemdata.pPais[0] || itemdata.pPais2[0] == itemdata.pPais[1]) {
                    item.getChildByName("line3").active = true;
                }
                this.SetPai(poke.children[3], itemdata.pPais2[1]);
                if (itemdata.pPais2[1] == itemdata.pPais[0] || itemdata.pPais2[1] == itemdata.pPais[1]) {
                    item.getChildByName("line4").active = true;
                }
                item.getChildByName("lbl1").active = true;
                item.getChildByName("lbl1").getComponent(cc.Label).string = itemdata.szPaisName1;
                item.getChildByName("lbl2").active = true;
                item.getChildByName("lbl2").getComponent(cc.Label).string = itemdata.szPaisName2;
            } else if (itemdata.bZhongJiang != undefined && itemdata.bZhongJiang) {
                display = true;
                this.SetPai(poke.children[0], itemdata.pPais[0]);
                item.getChildByName("line1").active = true;
                item.getChildByName("line2").active = true;
                this.SetPai(poke.children[1], itemdata.pPais[1]);
                if (itemdata.pPais.length == 2) {
                    poke.children[2].active = false;
                    poke.children[3].active = false;
                } else if (itemdata.pPais.length == 3) {
                    this.SetPai(poke.children[2], itemdata.pPais[2]);
                    poke.children[3].active = false;
                } else if (itemdata.pPais.length == 4) {
                    this.SetPai(poke.children[2], itemdata.pPais[2]);
                    this.SetPai(poke.children[3], itemdata.pPais[3]);
                }
                item.getChildByName("lbl1").active = true;
                item.getChildByName("lbl1").getComponent(cc.Label).string = itemdata.szPaisName1;
                item.getChildByName("lbl2").active = true;
                item.getChildByName("lbl2").getComponent(cc.Label).string = itemdata.szPaisName2;
            } else if (itemdata.bShowPai || itemdata.iSHPMode > 0) {
                display = true;
                this.SetPai(poke.children[0], itemdata.pPais[0]);
                item.getChildByName("line1").active = true;
                item.getChildByName("line2").active = true;
                this.SetPai(poke.children[1], itemdata.pPais[1]);
                if (itemdata.pPais.length == 2) {
                    poke.children[2].active = false;
                    poke.children[3].active = false;
                } else if (itemdata.pPais.length == 3) {
                    this.SetPai(poke.children[2], itemdata.pPais[2]);
                    poke.children[3].active = false;
                } else if (itemdata.pPais.length == 4) {
                    this.SetPai(poke.children[2], itemdata.pPais[2]);
                    this.SetPai(poke.children[3], itemdata.pPais[3]);
                }
                if (itemdata.iSHPMode == 1) {
                    item.getChildByName("lbl1").active = true;
                    item.getChildByName("lbl1").getComponent(cc.Label).string = "    三花六";
                } else if (itemdata.iSHPMode == 2) {
                    item.getChildByName("lbl1").active = true;
                    item.getChildByName("lbl1").getComponent(cc.Label).string = "    三花十";
                }

            } else if (itemdata.pShowIdx.length > 0) {
                display = true;
                item.getChildByName("line1").active = true;
                item.getChildByName("line2").active = true;
                if (itemdata.pPais.length == 2) {
                    poke.children[2].active = false;
                    poke.children[3].active = false;
                } else if (itemdata.pPais.length == 3) {
                    this.SetPai(poke.children[2], itemdata.pPais[2]);
                    poke.children[3].active = false;
                } else if (itemdata.pPais.length == 4) {
                    this.SetPai(poke.children[2], itemdata.pPais[2]);
                    this.SetPai(poke.children[3], itemdata.pPais[3]);
                }
                for (var j = 0; j < itemdata.pShowIdx.length; j++) {
                    this.SetPai(poke.children[itemdata.pShowIdx[j]], itemdata.pPais[itemdata.pShowIdx[j]]);
                }
            } else {
                item.getChildByName("line1").active = true;
                item.getChildByName("line2").active = true;
                if (itemdata.pPais.length == 2) {
                    poke.children[2].active = false;
                    poke.children[3].active = false;
                } else if (itemdata.pPais.length == 3) {
                    this.SetPai(poke.children[2], itemdata.pPais[2]);
                    poke.children[3].active = false;
                } else if (itemdata.pPais.length == 4) {
                    this.SetPai(poke.children[2], itemdata.pPais[2]);
                    this.SetPai(poke.children[3], itemdata.pPais[3]);
                }
            }
            if (itemdata.iUserId == cc.vv.userMgr.userId && !display) {
                this.SetPai(poke.children[0], itemdata.pPais[0]);
                this.SetPai(poke.children[1], itemdata.pPais[1]);
                if (itemdata.pPais.length == 2) {
                    poke.children[2].active = false;
                    poke.children[3].active = false;
                } else if (itemdata.pPais.length == 3) {
                    this.SetPai(poke.children[2], itemdata.pPais[2]);
                    poke.children[3].active = false;
                } else if (itemdata.pPais.length == 4) {
                    this.SetPai(poke.children[2], itemdata.pPais[2]);
                    this.SetPai(poke.children[3], itemdata.pPais[3]);
                }
            }

            if (itemdata.iAddFenMG > 0) {
                item.getChildByName("mangguo").active = true;
                item.getChildByName("mangguo").getComponent(cc.Label).string = "芒果: "+itemdata.iAddFenMG;
            } else {
                item.getChildByName("mangguo").active = false;
            }

           // var fen = itemdata.iJiFenYZ + itemdata.iAddFenMG;

            if (itemdata.iJiFenSY > 0) {
                item.getChildByName("win").active = true;
                item.getChildByName("lose").active = false;
                item.getChildByName("win").getComponent(cc.Label).string = "+" + itemdata.iJiFenSY;
            } else {
                item.getChildByName("win").active = false;
                item.getChildByName("lose").active = true;
                item.getChildByName("lose").getComponent(cc.Label).string = itemdata.iJiFenSY;
            }
            item.getChildByName("xiazhu").getComponent(cc.Label).string = "下注: " + itemdata.iJiFenYZ;
            item.active = true;
        }
    },

    SetPai: function (PaiNodeParent, paiid) {
        PaiNodeParent.children[0].active = false;
        PaiNodeParent.children[1].active = true;
        this.GetPokerCard(paiid, PaiNodeParent.children[1].getComponent(cc.Sprite));
    },

    shangyishou: function () {
        this._curShoushu--;
        if (this._curShoushu < 1) {
            this._curShoushu = 1;
            return;
        }
        cc.vv.socket.send("getpjlogs", { iRoomId: this._curRoomId, iPlayTimes: this._curShoushu });
    },

    xiayishou: function () {
        this._curShoushu++;
        if (this._curShoushu > this._zongShoushu) {
            this._curShoushu = this._zongShoushu;
        }
        cc.vv.socket.send("getpjlogs", { iRoomId: this._curRoomId, iPlayTimes: this._curShoushu });
    },

    leave_notify: function (data) {
        if (data.wErrCode == 0) {
            if (data.iUserId == cc.vv.userMgr.userId) {
                cc.vv.userMgr.iRoomId = 0;
                cc.director.loadScene("hall");
                return;
            }
            for (var i = 0; i < this._seatScript.length; i++) {
                if (this._seatScript[i]._userId == data.iUserId) {
                    this._seatScript[i].DisposeSeat();
                }
            }
            for (var i = 0; i < this._allPlayerInfo.length; i++) {
                if (this._allPlayerInfo[i].iUserId == data.iUserId) {
                    this._allPlayerInfo[i] = null;
                    this._allPlayerInfo.splice(i, 1);
                }
            }
        } else {
            cc.vv.alert.show(data.szErrMsg);
        }
    },

    addjifen_notify: function (data) {
        var user = this.getUserInfoByUserId(data.iUserId)
        if (data.bAgree) {
            if (user != null) {
                user.iJiFen = data.iJiFen;
            }
            var seat = this.getSeatByUserId(data.iUserId);
            if (seat != null) {
                seat.SetJifen(data.iJiFen);
            }
            if (data.iUserId == cc.vv.userMgr.userId) {
                this._backtable = false;
                this._selfScript.CaoZuoBtnParent.getChildByName("comeback").active = false;
            }
        }
        if (data.bAgree != undefined && !data.bAgree && data.iUserId == cc.vv.userMgr.userId && (user.iState == 0 || user.iState == 7 || user.iState == 8 )) {
            this._backtable = true;
            this._selfScript.CaoZuoBtnParent.getChildByName("comeback").active = true;
        }
    },

    user_notify: function (data) {
        if (data.pData.sign == 0) {
            var user = this.getSeatByUserId(data.iFromUser);
            if (user == null)
                return;
            user.PlayEmoji(data.pData.index);
        } else if (data.pData.sign == 1) {
            var user = this.getSeatByUserId(data.iFromUser);
            if (user == null)
                return;
            var destUser = this.getSeatByUserId(data.pData.destuserid);
            //var end = destUser.node.parent.convertToWorldSpaceAR(destUser.node.getPosition());
            var end = user.node.parent.convertToWorldSpaceAR(destUser.node.getPosition());
            user.PlayEmojiPay(data.pData.index, end);
        } else if (data.pData.sign == 2) {
            console.log(data);
            console.log("playVoice11111111111111111111111111111111111111");
            this.playVoice(data);
        }
    },

    playVoice: function (data) {

        //this._voiceArr.push(data);
        //console.log("playVoice2");
        //data = this._voiceArr.shift();
        //console.log(data);
        //var msgfile = "voicemsg.amr";
        //console.log(msgInfo.msg.length);
        //cc.vv.voiceMgr.writeVoice(msgfile, msgInfo.msg);
        //cc.vv.voiceMgr.play(msgfile);
        //this._lastPlayTime = Date.now() + msgInfo.time;

        console.log("playVoice222222222222222222222222222222222");
        console.log(data.pData.content);
        console.log("playVoice333333333333333333333333333333333");
        var msgfile = "userVoice.amr";
        window.sdkvoice.writeVoiceData(msgfile, data.pData.content);
        window.sdkvoice.play(msgfile);
        if (data.pData.pangguan) {
            this.node.getChildByName("obUesrYuyin").active = true;
            var time = Math.round(data.pData.len / 1000 * 10) / 10;
            console.log("ssssssssssssssssssssssssssss" + time);
            var user = this.getUserInfoByUserId(data.iFromUser);
            this.node.getChildByName("obUesrYuyin").getChildByName("name").getComponent(cc.Label).string = user.szAlias;
            this.node.getChildByName("obUesrYuyin").getChildByName("time").getComponent(cc.Label).string = time + "S";
            this.scheduleOnce(function () {
                this.node.getChildByName("obUesrYuyin").active = false;
            }, time);
        } else {
            var user = this.getSeatByUserId(data.iFromUser);
            user.playVoiceAnim(data.pData.len);
        }
    },

    enable_actions_result: function (data) {
        if (this._selfActions) {
            return;
        }
      //  this._enableBtnFunc = function () {
        this._selfScript.CaoZuoBtnParent.getChildByName("game_btn_autoxiu_h").active = data.bCanXIU;
        this._selfScript.CaoZuoBtnParent.getChildByName("game_btn_xq_h").active = data.bCanDIU;
        if (data.bCanXIU) {
            if (this._autoXiu) {
                this._selfScript.CaoZuoBtnParent.getChildByName("game_btn_autoxiu").active = true;
                this._selfScript.CaoZuoBtnParent.getChildByName("game_btn_autoxiu_h").active = false;
            }
          //  this._autoXiu = false;
        } else {
            this._selfScript.CaoZuoBtnParent.getChildByName("game_btn_autoxiu_h").active = false;
            this._selfScript.CaoZuoBtnParent.getChildByName("game_btn_autoxiu").active = false;
        }
        if (data.bCanDIU) {
            if (this._autoXiuDiu) {
                this._selfScript.CaoZuoBtnParent.getChildByName("game_btn_xq_h").active = false;
                this._selfScript.CaoZuoBtnParent.getChildByName("game_btn_xq").active = true;
            }
        } 
      //  }
       // this.scheduleOnce(this._enableBtnFunc, 1);
    },

    sitdown_result: function (data) {
        if (data.wErrCode == 9) {
            var self = this;
            this._sitDownData = {
                iRoomId: self._curRoomId,
                iUserId: cc.vv.userMgr.userId,
                iSeatIndex: data.iSeatIndex,
                iJiFen: 0,
            };
            this.ReFreshDairuInfo();
            this.node.getChildByName("DairuFrame").active = true;
            return;
        }
        if (data.wErrCode == 2) {
            this.StartDaojishi(data.iTimes);
        }
        if (data.wErrCode == 0) {
        } else {
            cc.vv.alert.show(data.szErrMsg);
        }
    },

    StartDaojishi: function (times) {
        this.unschedule(this._tidaojishiFunc);
        var self = this;
        this._tidaojishiFunc = function () {
            times--;
            if (cc.vv.alert.parent.active) {
                cc.vv.alert._content.string = "还有" + times + "秒才能坐位置";
            } else {
                self.unschedule(this._tidaojishiFunc);
            }
            if (times < 0) {
                self.unschedule(this._tidaojishiFunc);
            }
        }
        this.schedule(this._tidaojishiFunc, 1, 300, 0);
    },

    sitdown_notify: function (data) {
        if (data.wErrCode != 0) {
            cc.vv.alert.show(data.szErrMsg);
        }
        console.log(this._allPlayerInfo);
        var user = this.getUserInfoByUserId(data.iUserId);
        if (user == null) {
            this._allPlayerInfo.push(data);
        } else {
            user.iState = data.iState;
            user.iJiFen = data.iJiFen;
            user.iJiFenDR = data.iJiFenDR;
            user.iSeatIndex = data.iSeatIndex;
            user.iGolds = data.iGolds;
        }
        if (data.iUserId == cc.vv.userMgr.userId) {
            this._backtable = false;
            this._selfScript.CaoZuoBtnParent.getChildByName("comeback").active = false;
        }
        //var seatid = this.getLocalSeatId(data.iSeatIndex, data.iUserId);
        cc.vv.audioMgr.playSFX("Sitdown.mp3");
        if (data.iUserId == cc.vv.userMgr.userId && this.isNeedChongPai()) {
            this.ResetAllSeatIndex(data.iSeatIndex);
            this.ProcessAllUserSeat();
        }
        this.GetSeatBySeatId(data.iSeatIndex).SyncSeat(user);
        this.SetMenuDisplay();
    },

    situp_result: function (data) {
        if (data.wErrCode == 0) {
        } else {
            cc.vv.alert.show(data.szErrMsg);
        }
    },

    situp_notify: function (data) {
        if (data.iUserId == cc.vv.userMgr.userId) {
            this._selfSeatID = -1;
        }

        for (var i = 0; i < this._seatScript.length; i++) {
            if (this._seatScript[i]._userId == data.iUserId) {
                this._seatScript[i].DisposeSeat();
                this.getUserInfoByUserId(data.iUserId).iTimeOutLZ = 300;
                if (this._selfSeatID != -1) {
                    this.SelfSitChange();
                } else {
                    this.SelfStandChange();
                }
            }
        }
        this.getUserInfoByUserId(data.iUserId).iState = 10;
        this.SetMenuDisplay();
    },

    jiesan_notify: function (data) {
        this.node.getChildByName("JiesanTongzhi").active = true;
        if (data.iMode == 0)//超时解散
        {
            this.node.getChildByName("JiesanTongzhi").getChildByName("content").getComponent(cc.Label).string = "该牌局已结束";
        } else {
            this.node.getChildByName("JiesanTongzhi").getChildByName("content").getComponent(cc.Label).string = "房主解散了该房间";
        }
        this.scheduleOnce(function () {
            this.TuichuRoom();
        }, 1);
    },

    TuichuRoom: function () {
        cc.vv.audioMgr.playSFX("dian.mp3");
        cc.vv.userMgr.iRoomId = 0;
        if (this._bOpenGame) {
            cc.vv.gameNetMgr._shouldJumpZhanjiFrame = true;
        }
        cc.director.loadScene("hall");
    },

    tuichu: function () {
        cc.director.loadScene("hall");
    },



    liuzuo_notify: function (data) {
        if (data.iUserId == cc.vv.userMgr.userId) {
            this._backtable = true;
            this._selfScript.CaoZuoBtnParent.getChildByName("comeback").active = true;
        }
        var userinfo = null;
        userinfo = this.getUserInfoByUserId(data.iUserId);
        userinfo.iState = 0;
        this.SetMenuDisplay();
        var user = this.getSeatByUserId(data.iUserId);
        userinfo.iTimeOutLZ = 300;
        if (user != null) {
            user.SyncSeat(userinfo);
        }
    },

    initDragStuffs: function (node) {
        var self = this;
        //break if it's not my turn.
        node.on(cc.Node.EventType.TOUCH_START, function (event) {
            console.log(" cc.Node.EventType.TOUCH_Start");
            self._lastTouchTime = Date.now();
            self.StartVoiceAnim();
        }.bind(this));

        //node.on(cc.Node.EventType.TOUCH_MOVE, function (event) {
        //    if (self._stopDrag)
        //        return;
        //    //}
        //}.bind(this));

        node.on(cc.Node.EventType.TOUCH_END, function (event) {
            console.log(" cc.Node.EventType.TOUCH_END");
            self.EndVoiceAnim();

            //cc.vv.xuangame.ChangeDargPokePos(self.node, self.Index);
            //self.node.setPosition(this._startPos);
            // self.displayGoNextBtn();
        }.bind(this));

        node.on(cc.Node.EventType.TOUCH_CANCEL, function (event) {
            console.log(" cc.Node.EventType.TOUCH_CANCEL");
            self.EndVoiceAnim();

        }.bind(this));
    },

    StartVoiceAnim: function () {
        this.VoiceAnim.active = true;
        this.VoiceAnim.getComponent(cc.Animation).play("voiceAnim");
        cc.vv.anysdkMgr.startRecording();
    },

    EndVoiceAnim: function () {
        this.VoiceAnim.getComponent(cc.Animation).stop();
        this.VoiceAnim.active = false;
        var time = Date.now() - this._lastTouchTime;
        var obing = seat == null ? true : false;
        if (!cc.sys.isNative) {
            return;
        }
        if (time < 1000) {
            console.log("voice should longger than 1s"); jclogs
            cc.vv.anysdkMgr.CancelRecording();
        } else {
            cc.vv.anysdkMgr.stopRecording();
            var voicedata = cc.vv.anysdkMgr.GetRecordingData();
            console.log("-----------------------------------")
            console.log(voicedata);
            console.log("-----------------------------------")
            var seat = this.getSeatByUserId(cc.vv.userMgr.userId);
            var obing = seat == null ? true : false;

            var self = this;
            var data = {
                iRoomId: self._curRoomId,
                iUserId: cc.vv.userMgr.userId,
                pData: {
                    pangguan: obing,
                    len: time,
                    sign: 2,
                    content: voicedata,
                }
            }
            this.SendUserNotifyMSG(data);
        }
    },



    DargYazhuEnd: function () {
        var lblxiazhu = this._selfScript.CaoZuoBtnParent.getChildByName("dargyazhunode").getChildByName("xiazhu").getComponent(cc.Label);
        var imode = 0;
        if (lblxiazhu.string == 0) {
            return;
        } else if (lblxiazhu.string == this._selfScript._leftJifen) { // 敲
            imode = 2;
        } else {
            imode = 1;
        }
        var self = this;
        var data = {
            iRoomId: self._curRoomId,
            iUserId: cc.vv.userMgr.userId,
            iJiFen: Number(lblxiazhu.string),
            iMode: imode,
        };
        cc.vv.socket.send("yazhu", data);
        this.CloseAllCaoZuoBtn();
    },
    
    enter_notify: function (data) {
        if (data.iUserId != cc.vv.userMgr.userId) {
            if (data.bLookOn) {
                this._seeplayerInfo.push(data);
            } else {
                this._seatsInfo.push(data);
            }
        }

        var flag = false;

        for (var i = 0; i < this._allPlayerInfo.length; i++) {
            if (this._allPlayerInfo[i].iUserId == data.iUserId) {
                flag = true;
                break;
            }
        }
        if (!flag) {
            this._allPlayerInfo.push(data);
        }
        console.log(this._allPlayerInfo);
    },

    start_notify: function (data) {
        if (data.wErrCode != 0) {
            console.log(data.szErrMsg);
            return;
        }
        this.unschedule(this._jieSuanFunc);
        this.unschedule(this._jieSuanFunc1);
        this.unschedule(this._jieSuanFunc2);
        this._xiupaiTime = 0;
        this._curDelayPay = 10;
        this.PiChi.active = true;
        this._isFenPaiing = false;
        this.MangGuo.active = true;

        for (var i = 0; i < this._seatScript.length; i++) {
            if (this._seatScript[i]._userId != null || this._seatScript[i]._userId != 0) {
                this._seatScript[i].CloseXiupaiNode();
            }
        }
        if (data.iJiFenMGC != parseInt(this.MangGuo.getComponent(cc.Label).string)) {
            for (var i = 0; i < this._seatScript.length; i++) {
                if (this._seatScript[i]._userId == null || this._seatScript[i]._userId == 0) {
                    continue;
                }
                this._seatScript[i].ResetSeat();
                for (var j = 0; j < data.pPlayers.length; j++) {
                    if (!this._seatScript[i]._obIng && this._seatScript[i]._userId == data.pPlayers[j].iUserId) {
                        this._seatScript[i].MangguoCoinMove();
                    }
                }
                if (this._seatScript[i]._userId == data.iBankUser) {
                    this._seatScript[i].SetZhuang();
                }
            }
            cc.vv.audioMgr.playSFX("MoveChipFive.mp3");
            this.SetMangguo(data.iJiFenMGC, data.iJiFenMGTimes);
            this.MangGuo.parent.active = true;
        }
        //this.RoomInfoFrame.getChildByName("info").getComponent(cc.Label).string = "正在游戏中";
        this.node.getChildByName("game_btnstart").active = false;
        var self = this;
        this.scheduleOnce(function () {
            self.SetStartYazhu(data);
        }, 1);
        this.PiChi.parent.active = true;
    },

    SetStartYazhu: function (data) {
        for (var i = 0; i < this._seatScript.length; i++) {
            if (this._seatScript[i]._userId == null || this._seatScript[i]._userId == 0) {
                continue;
            }
            for (var j = 0; j < data.pPlayers.length; j++) {
                if (!this._seatScript[i]._obIng && this._seatScript[i]._userId == data.pPlayers[j].iUserId) {
                    this._seatScript[i].SetYaZhu(data.pPlayers[j].iJiFenYZ, data.pPlayers[j].iNewJiFen);
                    this._seatScript[i].SetScore(data.pPlayers[j].iNewJiFen);
                }
            }
        }
        cc.vv.audioMgr.playSFX("MoveChipFive.mp3");
    },

    enter_result: function (data) {
        if (data.wErrCode == 1004) {
            this.showAlert("该牌局已结束", 0, function (res) {
                cc.director.loadScene("hall");
            })
            return;
        }
        this.reconnctNode.active = false;
        this.CloseAllCaoZuoBtn();
        this._allPlayerInfo = [];
        this._roomData = data.pRoomArgs;
        this._seatsInfo = data.pSeatPlayers;
        this._seeplayerInfo = data.pSeePlayers;

        this._allPlayerInfo = this._allPlayerInfo.concat(data.pSeatPlayers, data.pSeePlayers);

        console.log(this._allPlayerInfo);
        if (!this._roomData.bOpenMG) {
            this.MangGuo.parent.opacity = 0;
        }
        this._bOpenGame = data.bOpenGame;
        if (data.bOpenGame) {
            if (data.iTimeSY == 0) {
                this._jiesanTime = 0;
                this.jiesanLbl.string = "剩余时间00:00:00";
            } else {
                this._jiesanTime = Date.now() + data.iTimeSY * 1000;
            }
            this.PiChi.parent.active = true;
            this.MangGuo.parent.active = true;
            this.node.getChildByName("starttime").active = false;
            this.node.getChildByName("game_btnstart").active = false;
        } else {
            this._jiesanTime = 0;
            this.jiesanLbl.string = "准备中";

            this.node.getChildByName("starttime").active = true;
            this.node.getChildByName("game_btnstart").active = data.iCreator == cc.vv.userMgr.userId;
            var count = data.iTimeSY;
            this.unschedule(this._ReadyGameFunc);
            this._ReadyGameFunc = function () {
                count--;
                //if (count <= 0) {
                //房间解散
                //}
                //cc.vv.xuangame.SetUserLiuZuoTime(this._userId, count);
                self.readyTime.string = "倒计时:" + cc.vv.gameNetMgr.GetTimeMS(count);
            }
            this.schedule(this._ReadyGameFunc, 1, 1800, 0);
        }

        //this.scheduleOnce(function () {
        //    this.actionsProcess
        //}, 2);
        this.SetMangguo(data.iJiFenMGC, data.iJiFenMGTimes);
        this.SetPiChi(data.iJiFenPC);

        this._createTime = data.tmCreate;
        this.SetRoomInfo();
        var self = this;

        this.JiangChiLbl.parent.active = data.bOpenJC;
        this.SetJiangchiLbl(data.iJiangChi);

        var dariuinfo = this.node.getChildByName("DairuFrame").getChildByName("sliderzuixiaodairu").getComponent("SliderControl");
        var lbl = this.node.getChildByName("DairuFrame").getChildByName("dairu").getComponent(cc.Label);

        this.node.getChildByName("DairuFrame").getChildByName("dairu").getComponent(cc.Label).string = data.pRoomArgs.iMinFenE;
        dariuinfo.SetProgress(0);
        dariuinfo._intervalFunc = function (arg) {
            lbl.string = data.pRoomArgs.iMinFenE * (arg + 1);
        }

        if (data.iBankerUser != 0) {
            var seat = this.getSeatByUserId(data.iBankerUser);
            if (seat != null)
                seat.SetZhuang();
        }

        if (data.pRoomArgs.bOpenGPS) {
            this.GPSNode.active = true;
        } else {
            this.GPSNode.active = false;
        }
        this._isadminUser = data.bAdminUser;
        if (this._isadminUser) {
            cc.vv.socket.send("getjyusers", { iRoomId: this._curRoomId });
        }
        this.RoomInfoFrame.getChildByName("disClub").active = this._isadminUser;
        if (data.bAdminUser) {
            this.AdminMessage.active = true;
            this.SetButtonInteractable(this.menuFrame.getChildByName("roommgr").getComponent(cc.Button),true);
            this.getrsdus();
        } else {
            this.SetButtonInteractable(this.menuFrame.getChildByName("roommgr").getComponent(cc.Button),false);
            this.AdminMessage.active = false;
        }
        this.SetButtonInteractable(this.menuFrame.getChildByName("menu_break").getComponent(cc.Button), data.iCreator == cc.vv.userMgr.userId);
        this.node.getChildByName("liuzhuoFrame").getChildByName("RoomName").getComponent(cc.Label).string = this._roomData.szName;
        this.node.getChildByName("liuzhuoFrame").getChildByName("roomTime").getComponent(cc.Label).string = this._createTime;

        for (var i = 0; i < this._seatScript.length; i++) {
            this._seatScript[i].DisposeSeat();
        }

        for (var i = 0; i < data.pSeatPlayers.length; i++) {
            if (data.pSeatPlayers[i].iUserId == cc.vv.userMgr.userId) {
                this.ResetAllSeatIndex(data.pSeatPlayers[i].iSeatIndex);
                break;
            }
        }
        for (var i = 0; i < data.pSeatPlayers.length; i++) {
            this.GetSeatBySeatId(data.pSeatPlayers[i].iSeatIndex).SyncSeat(data.pSeatPlayers[i]);
            this.GetSeatBySeatId(data.pSeatPlayers[i].iSeatIndex).TongbuState(data.pSeatPlayers[i].iGameState);
        }
        var tempseat = this.getSeatByUserId(cc.vv.userMgr.userId);
        var tempuser = this.getUserInfoByUserId(cc.vv.userMgr.userId);
        if (tempseat != null && tempuser != null && (tempuser.iState == 7 || tempuser.iState == 8) && tempseat._leftJifen > 0) {
            this._selfScript.CaoZuoBtnParent.getChildByName("comeback").active = true;
        }

        this.SetMenuDisplay();

        if (this._roomData.bOpenGPS && cc.sys.isNative && cc.sys.isMobile) {
            this.scheduleOnce(function () {
                this.ProcessGPS();
            }, 1);
        }
        this.getrsdus();


        //是否分牌：
        var uinfo = this.getUserInfoByUserId(cc.vv.userMgr.userId);

        if (uinfo.iGameState != 5 && uinfo.iSplitMode == 1) {//未分牌
            this.syncFenpai(uinfo.iTimeOutFP, uinfo.pPais);
        } else if (uinfo.iGameState != 5 && uinfo.iSplitMode == 2) { // 已分牌
            var data = {
                iUserId: cc.vv.userMgr.userId,
                pPais1: uinfo.pPais1,
                pPais2: uinfo.pPais2,
            }
            this.split_notify(data);
        }

    },

    SetRoomInfo: function () {
        this.node.getChildByName("info").getChildByName("roomname").getComponent(cc.Label).string = "房间名称："+this._roomData.szName;
        var str = "";
        if (this._roomData.bXiuZM) {
            if (this._roomData.bLinkM) {
                str = "休揍芒 | 手手芒";
            } else {
                str = "手手芒";
            }
        } else {
            if (this._roomData.bLinkM) {
                str = "手手芒";
            } 
        }
        this.node.getChildByName("info").getChildByName("arg").getComponent(cc.Label).string = str;
        this.node.getChildByName("info").getChildByName("dipi").getComponent(cc.Label).string ="底皮：" + this._roomData.iBaseFen;
    },


    //SEAT_STATE_EMPTY: -1,    // 位置为空
    //SEAT_STATE_REQSD: 0,     // 用户发出坐下请求
    //SEAT_STATE_WAIT: 1,      // 用户等待中
    //SEAT_STATE_READY: 2,     // 用户准备中
    //SEAT_STATE_PLAY: 3,      // 游戏中
    //SEAT_STATE_REST: 4,      // 休牌
    //SEAT_STATE_LOSE: 5,      // 弃牌
    //SEAT_STATE_QIAO: 6,      // 敲钵钵了
    //SEAT_STATE_LIUZ: 7,      // 留座
    //SEAT_STATE_FSW: 8,       // 分输完了
    //SEAT_STATE_SEEP: 10,      // 旁观

    SetMenuDisplay() {
        var user = this.getUserInfoByUserId(cc.vv.userMgr.userId);
        if (user == null)
            return;
        console.log(user.iState);
        if (user.iState >= 0 && user.iState < 10) {
            if (user.iState >= 1) {
                this.MenuBtnCtrl(true, true, true);
            } else {
                this.MenuBtnCtrl(true, true, false);
            }
        }

        if (user.iState == 10) {
            this.MenuBtnCtrl(false, false, false);
        }

    },

    MenuBtnCtrl: function (standup, addFen, Liuzhuo) {
        this.SetButtonInteractable(this.menuFrame.getChildByName("StandUp").getComponent(cc.Button), standup);
        this.SetButtonInteractable(this.menuFrame.getChildByName("AddBoBo").getComponent(cc.Button), addFen);
        this.SetButtonInteractable(this.menuFrame.getChildByName("liuzuo").getComponent(cc.Button), Liuzhuo);
    },
    ProcessGPS() {
        var pos = cc.vv.anysdkMgr.getGPSPositionClick();
        // otherProcess
        console.log("++++++++++++++++");
        console.log(pos.x);
        console.log(pos.y);
        cc.vv.socket.send("setjwd", { iRoomId: this._curRoomId, fLon: pos.x, fLat: pos.y });
    },


    reqsd_result: function (data) {
        if (data.wErrCode == 0) {
        } else {
            cc.vv.alert.show(data.szErrMsg);
        }
    },

    reqsd_notify: function (data) {
        var info = null;
        var userinfo = this.GetAllPlayerInfo(data.iUserId);
        userinfo.iState = 0;
        if (!userinfo.iJiFen) {
            userinfo.iJiFen = 0;
        }
        userinfo.iSeatIndex = data.iReqSeatIndex;
        for (var i = 0; i < this._allPlayerInfo.length; i++) {
            if (this._allPlayerInfo[i].iUserId == data.iUserId) {
                if (data.iUserId == cc.vv.userMgr.userId && this.isNeedChongPai()) {
                    this.ResetAllSeatIndex(data.iReqSeatIndex);
                    this.ProcessAllUserSeat();
                }
               
                this.GetSeatBySeatId(data.iReqSeatIndex).SyncSeat(this._allPlayerInfo[i]);
                break;
            }
        }
        console.log(this._allPlayerInfo);
    },
    
    getsyncdata_result: function (data) {
        this._curRoomId = data.iRoomId;
    },

    getrsdus_notify: function (data) {
        if ((data.pUserObjs.length > 0 || data.pLogs.length > 0) && !this.node.getChildByName("liuzhuoFrame").active) {
            this.node.getChildByName("gameme_ssage").children[0].active = true;
            this.node.getChildByName("gameme_ssage").active = true;
        }
        //if (data.pUserObjs.length > 0) {
        //    cc.vv.audioMgr.playSFX("application.mp3");
        //}
        this.InitLiuZHuoInfo(data);
    },

    reqsdpep_result: function (data) {
        if (data.wErrCode == 0) {
        } else {
            cc.vv.alert.show(data.szErrMsg);
        }
    },

    reqsdpep_notify: function (data) {
        var seat = this.getSeatByUserId(data.iUserId);
        if (data.bAgree) {
            if (data.iUserId == cc.vv.userMgr.userId) {
                this._selfScript._leftJifen = data.pUserObj.iJiFen;
            }
            var user = this.GetAllPlayerInfo(data.iUserId);
            user.iJiFenDR = data.pUserObj.iJiFenDR;
            user.iJiFenCDR = data.pUserObj.iJiFenCDR;
            user.iState = data.pUserObj.iState;
            user.iJiFen = data.pUserObj.iJiFen;
            if (seat == null) {
                if (data.iUserId == cc.vv.userMgr.userId) {
                    cc.vv.alert.show("上分成功!点击座位入座!");
                    cc.vv.audioMgr.playSFX("WaitOperation.mp3");
                }
            } else {
                cc.vv.audioMgr.playSFX("Sitdown.mp3");
                seat.SyncSeat(user);
            }
        } else {
            if (seat != null) {
                seat.DisposeSeat();
            }
        }
        this.SetMenuDisplay();
    },

    deal_notify: function (data) {
        //this.Dipai.active = true;
        for (var i = 0; i < data.pPlayers.length; i++) {
            this.StartDelayFapai(data, i);
            this.getUserInfoByUserId(data.pPlayers[i].iUserId).pPais = data.pPlayers[i].pPais;
        }

        for (var i = 0; i < data.pPlayers.length; i++) {
            this.StartDelayFapai2(data, i);
        }
    },

    StartDelayFapai: function (data,index) {
        this.scheduleOnce(function () {
            var seat = this.getSeatByUserId(data.pPlayers[index].iUserId);
            if (seat != null) {
                seat.StartFaPai(data.pPlayers[index].pPais, data.pPlayers.length);
            }
        }, 0.1 * index);
    },

    StartDelayFapai2: function (data, index) {
        this.scheduleOnce(function () {
            var seat = this.getSeatByUserId(data.pPlayers[index].iUserId);
            if (seat != null) {
                seat.StartFaPai2(data.pPlayers[index].pPais, data.pPlayers.length);
            }
            //if (index == data.pPlayers.length - 1) {
            //    this.Dipai.active = false;
            //}
        }, (data.pPlayers.length * 0.1) + 0.1 * index);
    },

    StopProgress: function () {
        for (var i = 0; i < this._seatScript.length; i++) {
            this._seatScript[i].StopProgress();
        }
    },

    actions_notify: function (data) {
        this.scheduleOnce(function () {
            this.actionsProcess(data);
        }, 0.2);
    },

    GetMaxDrag: function (zuidi,zuida) {
        var count = 0;
        for (var k = 0; k < 5; k++) {
            count++;
            zuidi += this._roomData.iBaseFen * 2 * 1;
            if (zuidi >= zuida) {
                return count;
            }
        }
        for (var k = 0; k < 5; k++) {
            count++;
            zuidi += this._roomData.iBaseFen * 2 * 2;
            if (zuidi >= zuida) {
                return count;
            }
        }
        for (var k = 0; k < 5; k++) {
            count++;
            zuidi += this._roomData.iBaseFen * 2 * 4;
            if (zuidi >= zuida) {
                return count;
            }
        }
        for (var k = 0; k < 5; k++) {
            count++;
            zuidi += this._roomData.iBaseFen * 2 * 8;
            if (zuidi >= zuida) {
                return count;
            }
        }
        for (var k = 0; k < 5; k++) {
            count++;
            zuidi += this._roomData.iBaseFen * 2 * 16;
            if (zuidi >= zuida) {
                return count;
            }
        }
        for (var k = 0; k < 5; k++) {
            count++;
            zuidi += this._roomData.iBaseFen * 2 * 32;
            if (zuidi >= zuida) {
                return count;
            }
        } 
        for (var k = 0; k < 5; k++) {
            count++;
            zuidi += this._roomData.iBaseFen * 2 * 64;
            if (zuidi >= zuida) {
                return count;
            }
        } 
        for (var k = 0; k < 5; k++) {
            count++;
            zuidi += this._roomData.iBaseFen * 2 * 108;
            if (zuidi >= zuida) {
                return count;
            }
        }
        return count;
    },

    MakeSliderNum: function (index,max,zuidi,zuida) {
        if (index == 0) {
            return 0;
        }
        if (index == 1) {
            return zuidi;
        }
        if (index == max) {
            return zuida;
        }

        var lbl = zuidi;
        for (var k = 1; k < index; k++) {
            zuidi += this._roomData.iBaseFen * 2 * (Math.pow(2,parseInt(k / 5)));
        }
        return zuidi;
    },

    actionsProcess: function (data) {
        if (data.iCursorUser != cc.vv.userMgr.userId) {
            var user = this.getSeatByUserId(data.iCursorUser);
            this.CloseAllCaoZuoBtn();
            this.StopProgress();
            if (user != null) {
                user.SetProgress(data.iTimeOut);
            }
            return;
        }
        this._selfActions = true;
        if (data.iSHPMode > 0) {
            return;
        }
        console.log(this._autoXiu + "--------" + this._autoXiuDiu);
        this._selfScript.CaoZuoBtnParent.getChildByName("delay_1").active = true;
        this._selfScript.CaoZuoBtnParent.getChildByName("delay_1").children[0].getComponent(cc.Label).string = this._curDelayPay;
        if (data.pCusorOpts.bCanXIU && (this._autoXiu || this._autoXiuDiu)) {
            this.OnXiuBtnClick();
            this._autoXiu = false;
            this._autoXiuDiu = false;
            this._selfScript.CaoZuoBtnParent.getChildByName("game_btn_autoxiu").active = false;
            this._selfScript.CaoZuoBtnParent.getChildByName("game_btn_autoxiu_h").active = false;
            this._selfScript.CaoZuoBtnParent.getChildByName("game_btn_xq_h").active = false;
            this._selfScript.CaoZuoBtnParent.getChildByName("game_btn_xq").active = false;
            return;
        }

        if (data.pCusorOpts.bCanDIU && this._autoXiuDiu) {
            this.OnDiuBtnClick();
            this._autoXiuDiu = false;
            this._autoXiu = false;
            this._selfScript.CaoZuoBtnParent.getChildByName("game_btn_autoxiu").active = false;
            this._selfScript.CaoZuoBtnParent.getChildByName("game_btn_autoxiu_h").active = false;
            this._selfScript.CaoZuoBtnParent.getChildByName("game_btn_xq_h").active = false;
            this._selfScript.CaoZuoBtnParent.getChildByName("game_btn_xq").active = false;
            return;
        }
       
        var user = this.getSeatByUserId(data.iCursorUser);
        this._zuidiDaFen = data.iAddYZ;
        var xiazhuSlider = this._selfScript.CaoZuoBtnParent.getChildByName("dargyazhunode").getChildByName("sliderzuixiaodairu").getComponent("DragSliderControl");
        var lblxiazhu = xiazhuSlider.node.parent.getChildByName("xiazhu").getComponent(cc.Label);
        var lblhandle = xiazhuSlider.node.getChildByName("Handle").children[0].getComponent(cc.Label);
        lblxiazhu.string = 0;
        lblhandle.string = 0;
        var self = this;
        this._SliderMax = this.GetMaxDrag(self._zuidiDaFen, self._selfScript._leftJifen);
        console.log(self._selfScript._leftJifen + "----------------");
        console.log(self._zuidiDaFen + "----------------");
        console.log(this._SliderMax + "----------------");
        xiazhuSlider.SetDot(this._SliderMax);
        xiazhuSlider._intervalFunc = function (arg) {
            console.log("----------------------" + arg);
            if (arg == self._SliderMax) {
                lblxiazhu.string = self._selfScript._leftJifen;
                lblhandle.string = "敲";
                console.log("----------------------++" + lblhandle.string);
            } else if (arg == 0) {
                lblxiazhu.string = 0;
                lblhandle.string = 0;
            } else {
                var num = self.MakeSliderNum(arg, self._SliderMax, self._zuidiDaFen, self._selfScript._leftJifen);
                console.log(num);
                lblxiazhu.string = num;
                lblhandle.string = num;
            }
        }
        this.StopProgress();
        user.SetProgress(data.iTimeOut);
        this.unschedule(this._enableBtnFunc); 
        this._selfScript.CaoZuoBtnParent.getChildByName("game_btn_autoxiu").active = false;
        this._selfScript.CaoZuoBtnParent.getChildByName("game_btn_autoxiu_h").active = false;
        this._selfScript.CaoZuoBtnParent.getChildByName("game_btn_xq_h").active = false;
        this._selfScript.CaoZuoBtnParent.getChildByName("game_btn_xq").active = false;
        if (data.iCursorUser == cc.vv.userMgr.userId) {
            if (data.pCusorOpts.bCanDIU) {
                this._selfScript.CaoZuoBtnParent.getChildByName("DiuBtn").active = true;
            }
            if (data.pCusorOpts.bCanXIU) {
                this._selfScript.CaoZuoBtnParent.getChildByName("XiuBtn").active = true;
            }
            var bet4 = this._selfScript.CaoZuoBtnParent.getChildByName("4bet");
            var bet2 = this._selfScript.CaoZuoBtnParent.getChildByName("2bet");
            var bet3 = this._selfScript.CaoZuoBtnParent.getChildByName("3bet");
            if (data.bIsQiao) {
                var qiao = this._selfScript.CaoZuoBtnParent.getChildByName("QiaoBtn");
                qiao.active = true;
                if (data.iMinYZ < this._selfScript._leftJifen) {
                    qiao.children[0].getComponent(cc.Label).string = this._selfScript._leftJifen;
                    var gen = this._selfScript.CaoZuoBtnParent.getChildByName("GenBtn");
                    gen.active = true;
                    gen.children[0].getComponent(cc.Label).string = data.iMinYZ;
                } else {
                    qiao.children[0].getComponent(cc.Label).string = data.iMinYZ;
                }
            } else {
                if (data.pCusorOpts.bCanYZ) {
                    var gen = this._selfScript.CaoZuoBtnParent.getChildByName("GenBtn");
                    gen.active = true;
                    gen.children[0].getComponent(cc.Label).string = data.iMinYZ;
                    var da = this._selfScript.CaoZuoBtnParent.getChildByName("DaBtn");
                    da.active = true;

                    if (data.iAddYZ >= this._selfScript._leftJifen) {
                        da.active = false;
                        var qiao = this._selfScript.CaoZuoBtnParent.getChildByName("QiaoBtn");
                        qiao.active = true;
                        qiao.children[0].getComponent(cc.Label).string = this._selfScript._leftJifen;
                    }

                    if (data.iAddYZ == 0) {
                        da.active = false;
                        return;
                    }
                    
                    bet4.active = true;
                    bet4.children[0].getComponent(cc.Label).string = data.iAddYZ * 3;
                    if (this._selfScript._leftJifen < data.iAddYZ * 3) {
                        bet4.getComponent(cc.Button).interactable = false;
                    } else {
                        bet4.getComponent(cc.Button).interactable = true;
                    }

                    bet2.active = true;
                    bet2.children[0].getComponent(cc.Label).string = data.iAddYZ * 1;
                    if (this._selfScript._leftJifen < data.iAddYZ * 1) {
                        bet2.getComponent(cc.Button).interactable = false;
                    } else {
                        bet2.getComponent(cc.Button).interactable = true;
                    }

                    bet3.active = true;
                    bet3.children[0].getComponent(cc.Label).string = data.iAddYZ * 2;
                    if (this._selfScript._leftJifen < data.iAddYZ * 2) {
                        bet3.getComponent(cc.Button).interactable = false;
                    } else {
                        bet3.getComponent(cc.Button).interactable = true;
                    }
                }
            }
        }
    },

    CloseAllCaoZuoBtn: function () {
        this._selfScript.CaoZuoBtnParent.getChildByName("DiuBtn").active = false;
        this._selfScript.CaoZuoBtnParent.getChildByName("XiuBtn").active = false;
        this._selfScript.CaoZuoBtnParent.getChildByName("GenBtn").active = false;
        this._selfScript.CaoZuoBtnParent.getChildByName("QiaoBtn").active = false;
        this._selfScript.CaoZuoBtnParent.getChildByName("DaBtn").active = false;
        this._selfScript.CaoZuoBtnParent.getChildByName("4bet").active = false;
        this._selfScript.CaoZuoBtnParent.getChildByName("2bet").active = false;
        this._selfScript.CaoZuoBtnParent.getChildByName("3bet").active = false;
        //this._selfScript.CaoZuoBtnParent.getChildByName("game_btn_autoxiu").active = false;
        //this._selfScript.CaoZuoBtnParent.getChildByName("game_btn_autoxiu_h").active = false;
        //this._selfScript.CaoZuoBtnParent.getChildByName("game_btn_xq_h").active = false;
        //this._selfScript.CaoZuoBtnParent.getChildByName("game_btn_xq").active = false;
        this._selfScript.CaoZuoBtnParent.getChildByName("delay_1").active = false;
        this._selfActions = false;
        if (this._selfScript._localUser) {
            this._selfScript.StopProgress();
        }
        this._selfScript.CaoZuoBtnParent.getChildByName("dargyazhunode").active = false;
    },

    yazhu_result: function (data) {
        if (data.wErrCode == 0) {
        } else {
            cc.vv.alert.show(data.szErrMsg);
        }
    },

    lose_result: function (data) {
        if (data.wErrCode == 0) {
        } else {
            cc.vv.alert.show(data.szErrMsg);
        }
    },

    rest_result: function (data) {
        if (data.wErrCode == 0) {
        } else {
            cc.vv.alert.show(data.szErrMsg);
        }
    },

    yazhu_notify: function (data) {  // imode 0:跟  1大  2 敲
        if (data.iUserId == cc.vv.userMgr.userId) {
            this._selfScript.SetYaZhu(data.iJiFenYZSum, data.iNewJiFen);
            this._selfScript._leftJifen = data.iNewJiFen;
            this._selfScript.SetActionTip(data.iMode == 0, false, false, data.iMode == 1, false, data.iMode == 2, false, false);
        } else {
            var seat = this.getSeatByUserId(data.iUserId);
            seat.SetYaZhu(data.iJiFenYZSum, data.iNewJiFen);
            seat.StopProgress();
            //SetActionTip // gen, diu, xiu, da, fendown, qiao, delay, maipai
            seat.SetActionTip(data.iMode == 0, false, false, data.iMode == 1, false, data.iMode == 2, false, false);
        }
        if (data.iMode == 2) {
            var seat = this.getSeatByUserId(data.iUserId);
            seat.MakeQiaoFx();
        }
        cc.vv.audioMgr.playSFX("MoveChipFive.mp3");
    },

    lose_notify: function (data) {
        var seat = this.getSeatByUserId(data.iUserId);
        seat.SetActionTip(false, true, false, false, false, false, false, false);
        seat.diupai();
        seat.StopProgress();
        this._piCount += parseInt(seat.YaZhuLbl.string);
        this.SetPiChi(this._piCount);
        this.getUserInfoByUserId(data.iUserId).pPais = [];
        //this.getUserInfoByUserId(data.iUserId).iState = 5;
    },

    rest_notify: function (data) {
        //if (data.iUserId == cc.vv.userMgr.userId) {
        cc.vv.audioMgr.playSFX("pcheck.wav");
        //} else {
        var seat = this.getSeatByUserId(data.iUserId);
        seat.StopProgress();
       
        seat.SetActionTip(false, false, true, false, false, false, false, false);
        //}
    },

    split_result: function (data) {
        if (data.wErrCode == 0) {
        } else {
            cc.vv.alert.show(data.szErrMsg);
        }
    },

    split_notify: function (data) {
        var seat = this.getSeatByUserId(data.iUserId);
        seat._fenpai = true;
        seat.StopProgress();
        if (data.iUserId == cc.vv.userMgr.userId) {
            this._selfScript.JieSuanSHowPai(data);
        }
        //else {
        //}
        seat.SetActionTip(false, false, false, false, true, false, false, false);
    },

    split_complete_notify: function (data) {
        this.node.getChildByName("fenpai").active = false;
        this.StopFenPaiDaojishi();
        for (var i = 0; i < data.pGroups.length; i++) {
            if (data.pGroups[i].iUserId != cc.vv.userMgr.userId) {
                var seat = this.getSeatByUserId(data.pGroups[i].iUserId);
                seat.JieSuanSHowPai(data.pGroups[i]);
            }
        }
    },

    //iMode: 0,                       // 正常结算
    //    iMode: 1,                       // 休芒
    //        iMode: 2,                       // 揍芒

    jiesuan_notify: function (data) {
        if (this._roomData.bCanSP) {
            if (this.getSeatByUserId(cc.vv.userMgr.userId)) {
                this._selfScript.DisplayXiupaiBtn();
            }
        }
        this._JiesuanIng = true;
        this.ProcessJiesuan(data);
    },

    ProcessJiesuan: function (data) {
        if (data.iMode == 0) {
            console.log("正常结算");
        } else if (data.iMode == 1) {
            console.log("休芒");
            this.MaketipLbl(0);
        } else if (data.iMode == 2) {
            console.log("揍芒");
            this.MaketipLbl(1);
        }
        cc.vv.audioMgr.playSFX("chips_to_table.wav");
        this.StopProgress();
        this.CloseAllCaoZuoBtn();
        this.MangGuo.parent.active = false;
        this.PiChi.parent.active = false;
        this.ResultNode.parent.active = true;
        this.SetPiChi(0);
        this.SetMangguo(data.iJiFenMGC, data.iJiFenMGTimes);
        this.ResultChip.parent.getChildByName("resultScore").getComponent(cc.Label).string = data.iTotalGolds;
        for (var j = 0; j < data.pJiFenObjs.length; j++) {
            if (data.pJiFenObjs[j].pShowIdx.length > 0) {
                var seat = this.getSeatByUserId(data.pJiFenObjs[j].iUserId)
                if (seat != null && !seat._fenpai) {
                    seat.ShowPaiself(data.pJiFenObjs[j].pShowIdx, data.pJiFenObjs[j].pPais);
                }
            }
        }

        for (var j = 0; j < data.pJiFenObjs.length; j++) {
            if (data.pJiFenObjs[j].iSHPMode > 0) {
                var seat = this.getSeatByUserId(data.pJiFenObjs[j].iUserId);
                if (seat != null) {
                    seat.ShowSHP(data.pJiFenObjs[j].pPais);
                    if (data.pJiFenObjs[j].iSHPMode == 1) {
                        seat.SeatNode.getChildByName("Lbl1").active = true;
                        seat.SeatNode.getChildByName("Lbl1").x = 0;
                        seat.SeatNode.getChildByName("Lbl2").active = false;
                        seat.SeatNode.getChildByName("Lbl1").getComponent(cc.Label).string = "三花六";
                        //this.SeatNode.getChildByName("Lbl2").getComponent(cc.Label).string = type2;
                    } else if (data.pJiFenObjs[j].iSHPMode == 2) {
                        seat.SeatNode.getChildByName("Lbl1").active = true;
                        seat.SeatNode.getChildByName("Lbl2").active = false;
                        seat.SeatNode.getChildByName("Lbl1").x = 0;
                        seat.SeatNode.getChildByName("Lbl1").getComponent(cc.Label).string = "三花十";
                        //this.SeatNode.getChildByName("Lbl2").getComponent(cc.Label).string = type2;
                    }
                }
            }
        }

        //this.scheduleOnce(function () {
            
        //}, 0.6);

        for (var j = 0; j < data.pJiFenObjs.length; j++) {
            var seat = this.getSeatByUserId(data.pJiFenObjs[j].iUserId);
            if (seat != null) {
                seat.ResultCoinMove();
            }
        }

        for (var j = 0; j < data.pJiFenObjs.length; j++) {
            var seat = this.getSeatByUserId(data.pJiFenObjs[j].iUserId);
            var uinfo = this.getUserInfoByUserId(data.pJiFenObjs[j].iUserId);
            if (uinfo != null) {
                uinfo.iJiFenYZ = 0;
                uinfo.pPais = [];
            }
        }
        this._jieSuanFunc2 = function () {
            this.ResultChip.parent.active = true;
            for (var j = 0; j < data.pJiFenObjs.length; j++) {
                if (data.pJiFenObjs[j].iJiFenSY > 0) {
                    var seat = this.getSeatByUserId(data.pJiFenObjs[j].iUserId);
                    if (seat != null) {
                        this.ResultCoinMove(seat.node);
                    }
                }
                if (data.pJiFenObjs[j].iJiFenSY == 0) {
                    var seat = this.getSeatByUserId(data.pJiFenObjs[j].iUserId);
                    if (seat != null) {
                        this.ResultBackCoinMove(seat.node);
                    }
                }
            }
        }
        this.scheduleOnce(this._jieSuanFunc2, 0.5);
        this._jieSuanFunc1 = function () {
            this.ResultNode.parent.active = false;
            for (var j = 0; j < data.pJiFenObjs.length; j++) {
                if (data.pJiFenObjs[j].iJiFenSY > 0) {
                    var seatu = this.getSeatByUserId(data.pJiFenObjs[j].iUserId);
                    if (seatu != null) {
                        seatu.PlayScore(data.pJiFenObjs[j].iJiFenSY);
                    }
                }
                var id = data.pJiFenObjs[j].iUserId;
                console.log(id);
                var sobj = this.getSeatByUserId(id);
                if (sobj != null) {
                    sobj.SetJifen(data.pJiFenObjs[j].iNewJiFen);
                }
                var user = this.getUserInfoByUserId(id)
                if (user != null) {
                    user.iJiFen = data.pJiFenObjs[j].iNewJiFen;
                }
            }
        }
        this.scheduleOnce(this._jieSuanFunc1,  1.5);
        //this.SetMangguo(data.iNextMG);
        this._jieSuanFunc = function () {
            for (var j = 0; j < data.pJiFenObjs.length; j++) {
                var seat = this.getSeatByUserId(data.pJiFenObjs[j].iUserId)
                if (seat != null) {
                    seat.ResetSeat();
                }
                var user = this.getUserInfoByUserId(data.pJiFenObjs[j].iUserId);
                if (user != null) {
                    user.pPais = [];
                    user.pPais1 = [];
                    user.pPais2 = [];
                }
            }
            this._selfScript.CaoZuoBtnParent.getChildByName("xiupaibtn").active = false;
            this.unschedule(this._liuzuoSchedule);
            this.ResetGame();
            this.PiChi.parent.active = true;
            this.MangGuo.parent.active = true;
            this._JiesuanIng = false;
            cc.sys.garbageCollect();
        }
        this.scheduleOnce(this._jieSuanFunc,  3);

       // console.log(this._allPlayerInfo);
    },

    SetMangguo: function (mang,beishu) {
        this.MangGuo.getComponent(cc.Label).string = mang;
        this.MangGuo.parent.getChildByName("lbl").getComponent(cc.Label).string = "芒果:x" + beishu;
    },

    SetPiChi: function (pi) {
        this.PiChi.getComponent(cc.Label).string = pi;
       // this.PiChi.parent.getChildByName("lbl").getComponent(cc.Label).string ="皮池: "+ pi;
    },

    dealnext_notify: function (data) {
        for (var i = 0; i < data.length; i++) {
            this.DealNextDelay(data, i);
            for (var k = 0; k < data[i].pPais.length; k++) {
                this.getUserInfoByUserId(data[i].iUserId).pPais.push(data[i].pPais[k]);
            }
        }
    },

    DealNextDelay: function (data, i) {
        this.scheduleOnce(function () {
            this.getSeatByUserId(data[i].iUserId).FapaiAgain(data[i].pPais, data.length);
        }, 0.15 * i);
    },

    start_split_notify: function (data) {
        
        this.scheduleOnce(function () {
            this.start_splitProcess(data);
        }, 1.8);
    },

    syncFenpai: function (time,data) {
        this.StartFenPaiDaojishi(time);
        var seatt = this.getSeatByUserId(cc.vv.userMgr.userId);
        if (seatt == null)
            return;
        for (var i = 0; i < data.length; i++) {
            this.DragPokes[i].getComponent("DargScript")._pokeId = data[i];
            this.GetPokerCard(data[i], this.DragPokes[i].getComponent(cc.Sprite));
        }
        //this._selfScript.CaoZuoBtnParent.getChildByName("delay_1").active = true;
        this._selfScript.PokeNode.active = false;
        this.node.getChildByName("fenpai").active = true;
        this._selfScript.CaoZuoBtnParent.getChildByName("game_btn_autoxiu").active = false;
        this._selfScript.CaoZuoBtnParent.getChildByName("game_btn_autoxiu_h").active = false;
        this._selfScript.CaoZuoBtnParent.getChildByName("game_btn_xq").active = false;
        this._selfScript.CaoZuoBtnParent.getChildByName("game_btn_xq_h").active = false;
        this.RefreshPoketype();
    },

    start_splitProcess: function (data) {
        this.StartFenPaiDaojishi(30);
        var seatt = this.getSeatByUserId(cc.vv.userMgr.userId);
        if (seatt == null)
            return;
        for (var i = 0; i < data.length; i++) {
            this.DragPokes[i].getComponent("DargScript")._pokeId = data[i];
            this.GetPokerCard(data[i], this.DragPokes[i].getComponent(cc.Sprite));
        }
        //this._selfScript.CaoZuoBtnParent.getChildByName("delay_1").active = true;
        this._selfScript.PokeNode.active = false;
        this.node.getChildByName("fenpai").active = true;
        this._selfScript.CaoZuoBtnParent.getChildByName("game_btn_autoxiu").active = false;
        this._selfScript.CaoZuoBtnParent.getChildByName("game_btn_autoxiu_h").active = false;
        this._selfScript.CaoZuoBtnParent.getChildByName("game_btn_xq").active = false;
        this._selfScript.CaoZuoBtnParent.getChildByName("game_btn_xq_h").active = false;
        this.RefreshPoketype();
    },
    StartFenPaiDaojishi: function (time) {
        this._isFenPaiing = true;
        this._selfScript.CloseShowCardEye();
        var daoNode = this.node.getChildByName("daojishi");
        var slider = daoNode.getChildByName("progress").getComponent(cc.ProgressBar);
        var lbl = daoNode.getChildByName("time").getComponent(cc.Label);
        var count = time;
        this.unschedule(this._daojishiFunc);
        slider.progress = 1 / 30 * count;
        lbl.string = count + "s";
        this._daojishiFunc = function () {
            count--;
            if (count <= 0) {
                this.unschedule(this._daojishiFunc);
            }
            slider.progress = 1 / 30 * count;
            lbl.string = count + "s";
        }
        this.schedule(this._daojishiFunc, 1, 30, 0);
        daoNode.active = true;
    },

    StopFenPaiDaojishi: function () {
        this.unschedule(this._daojishiFunc);
        this.node.getChildByName("daojishi").active = false;
    },

    OnMenuBtnClick: function (event, arg) {
        cc.vv.audioMgr.playSFX("dian.mp3");
        if (arg == 0) {
            this.menuFrame.getComponent(cc.Animation).play("menuout");
            this.menuFrame.getChildByName("close").active = true;

        } else {
            this.menuFrame.getComponent(cc.Animation).play("menuin");
            this.menuFrame.getChildByName("close").active = false;
        }
    },

    OnFaceBtnClick: function (event, arg) {
        cc.vv.audioMgr.playSFX("dian.mp3");
        if (arg == 0) {
            this.emojiFrame.getComponent(cc.Animation).play("facein");
            this.emojiFrame.getChildByName("close").active = true;
        } else {
            this.emojiFrame.getComponent(cc.Animation).play("faceout");
            this.emojiFrame.getChildByName("close").active = false;
        }
    },

    OnGuizeBtnClick: function (event, arg) {
        cc.vv.audioMgr.playSFX("dian.mp3");
        if (arg == 0) {
            this.menuFrame.getComponent(cc.Animation).play("menuin");
            this.menuFrame.getChildByName("close").active = false;
            this.guizeFrame.getComponent(cc.Animation).play("paixingout");
            this.guizeFrame.getChildByName("close").active = true;
        } else {
            this.guizeFrame.getComponent(cc.Animation).play("paixingin");
            this.guizeFrame.getChildByName("close").active = false;
        }
    },


    OnRoomInfoBtnClick: function (event, arg) {
        cc.vv.audioMgr.playSFX("dian.mp3");
        if (arg == 0) {
            this.RoomInfoFrame.getComponent(cc.Animation).play("RoomInfoIn");
            this.RoomInfoFrame.getChildByName("close").active = true;
            var self = this;
            var data = {
                iRoomId: self._curRoomId,
                iUserId: cc.vv.userMgr.userId,
            };
            cc.vv.socket.send("roomplayers", data);
            //this.InitObUserInfo();
            this._ShowJieSuanTime = true;
        } else {
            this.RoomInfoFrame.getComponent(cc.Animation).play("RoomInfoOut");
            this.RoomInfoFrame.getChildByName("close").active = false;
            this._ShowJieSuanTime = false;
        }
    },

    OnHuiGuBtnClick: function (event, arg) {
        cc.vv.audioMgr.playSFX("dian.mp3");
        if (arg == 0) {
            this.huiguFrame.getComponent(cc.Animation).play("zhanjiout");
            this.huiguFrame.getChildByName("close").active = true;
        } else {
            this.huiguFrame.getComponent(cc.Animation).play("zhanjiin");
            this.huiguFrame.getChildByName("close").active = false;
        }
    },

    OnQuitBtnClick: function () {
        cc.vv.audioMgr.playSFX("dian.mp3");
        var self = this;
        var data = {
            iRoomId: self._curRoomId,
            iUserId: cc.vv.userMgr.userId,
        };
        cc.vv.socket.send("leave", data);
    },

    getsyncdata: function (data) { //获取同步数据
        var self = this;
        var data = {
            iRoomId: self._curRoomId,
        };
        cc.vv.socket.send("getsyncdata", data);
    },

    getrsdus: function () {    //管理员获取需要处理的信息（申请坐下）
        this.node.getChildByName("gameme_ssage").children[0].active = false;
        this.node.getChildByName("liuzhuoFrame").getChildByName("refresh").children[0].active = false;
        var self = this;
        var data = {
            iRoomId: self._curRoomId,
            iUserId: cc.vv.userMgr.userId,
        };
        cc.vv.socket.send("getrsdus", data);
    },

    reqsdpep: function (event, arg) {    // iRoomId, iUserId, iDestUser, bAgree 管理员处理的信息的结果（申请坐下）
        var agree = arg == 0;
        var self = this;
        var userid = event.target.parent.getChildByName("shenqingrenid").getComponent(cc.Label).string;
        var dairu = event.target.parent.getChildByName("dairu").getComponent(cc.Label).string;
        var uid = event.target.parent.getChildByName("uid").getComponent(cc.Label).string;
        var data = {
            iRoomId: self._curRoomId,
            iUserId: cc.vv.userMgr.userId,
            iDestUser: userid,
            dairu: dairu,
            bAgree: agree,
            iUid:uid,
        };
        cc.vv.socket.send("addjifenrep", data);
        //cc.vv.audioMgr.playSFX("application.mp3");
        event.target.parent.active = false;
    },

    StartGame: function (event, arg) {
        cc.vv.socket.send("start", { iRoomId: this._curRoomId, iUserId: cc.vv.userMgr.userId });
        //event.target.active = false;
    },

    ready: function () {    //准备
        var self = this;
        var data = {
            iRoomId: self._curRoomId,
            iUserId: cc.vv.userMgr.userId,
        };
        cc.vv.socket.send("ready", data);
    },

    yazhu: function () {    //iRoomId, iUserId, iJiFen（申请坐下）

    },

    lose: function () {   //丢
        var self = this;
        var data = {
            iRoomId: self._curRoomId,
            iUserId: cc.vv.userMgr.userId,
        };
        cc.vv.socket.send("lose", data);
    },

    rest: function () {   // 休
        var self = this;
        var data = {
            iRoomId: self._curRoomId,
            iUserId: cc.vv.userMgr.userId,
        };
        cc.vv.socket.send("rest", data);
      
    },

    split: function () {  // 分牌
        //var self = this;
        //var data = {
        //    iRoomId: self._curRoomId,
        //    iUserId: cc.vv.userMgr.userId,
        //};
        //cc.vv.socket.send("split", data);
    },

    OpenJiesanFrame: function (event,arg) {
        //event.target.parent.active = false;
        cc.vv.audioMgr.playSFX("dian.mp3");
        this.menuFrame.getComponent(cc.Animation).play("menuin");
        this.menuFrame.getChildByName("close").active = false;
        var lbl = this.MangGuo.getComponent(cc.Label).string;
        if (lbl == "" || lbl == "0") {
            this.node.getChildByName("JiesanConfirm").getChildByName("content").getComponent(cc.Label).string = "确定解散牌局?";
        }
        this.node.getChildByName("JiesanConfirm").active = true;
        this.OnMenuBtnClick(null, 1);
    },

    JieSan: function (event,arg) {
        //for (var i = 0; i < this._seatScript.length; i++) {
        //    this._seatScript[i].DisposeSeat();
        //}
        event.target.parent.active = false;
        cc.vv.socket.send("jiesan", { iRoomId: this._curRoomId, iUserId: cc.vv.userMgr.userId, });
    },

    GetAllPlayerInfo: function (userid) {
        for (var i = 0; i < this._allPlayerInfo.length; i++) {
            if (this._allPlayerInfo[i].iUserId == userid) {
                return this._allPlayerInfo[i];
            }
        }
    },


    GetSeatPlayerInfo: function (userid) {
        for (var i = 0; i < this._seatsInfo.length; i++) {
            if (this._seatsInfo[i].iUserId == userid) {
                return this._seatsInfo[i];
            }
        }
    },

    GetSeePlayerInfo: function (userid) {
        for (var i = 0; i < this._seeplayerInfo.length; i++) {
            if (this._seeplayerInfo[i].iUserId == userid) {
                return this._seeplayerInfo[i];
            }
        }
    },

    OnClickSitDown: function (event, arg) {
        cc.vv.audioMgr.playSFX("dian.mp3");
        var self = this;
        var user = this.getUserInfoByUserId(cc.vv.userMgr.userId);
        arg = this._seatScript[arg]._seatIndex;
        console.log(user);
        if (user != null && user.iJiFen && user.iJiFen > 0) {
            var data = {
                iRoomId: self._curRoomId,
                iUserId: cc.vv.userMgr.userId,
                iSeatIndex: arg,
            };
            cc.vv.socket.send("sitdown", data);
            return;
        }
        var self = this;
        this._sitDownData = {
            iRoomId: self._curRoomId,
            iUserId: cc.vv.userMgr.userId,
            iSeatIndex: arg,
            iJiFen: 0,
        };
        //var userinfo = {
        //    iUserId: cc.vv.userMgr.userId,
        //    szAlias: cc.vv.userMgr.userName,
        //    szHeadIco: cc.vv.userMgr.iconUrl,
        //}
        //this._selfSeat.getComponent("XuanGameSeat").StartLiuZhuo(userinfo);
        this.ReFreshDairuInfo();
        this.node.getChildByName("DairuFrame").active = true;
        //cc.vv.socket.send("reqsd", data);
    },

    OnClickBacktable: function (event, arg) {
        cc.vv.audioMgr.playSFX("dian.mp3");
        var self = this;
        if (arg == 0) {
            event.target.active = false;
        }
        if (arg == 1) {
            this._addJifen = true;
            this.OnMenuBtnClick(null, 1);
        } else {
            this._addJifen = false;
            var user = this.getUserInfoByUserId(cc.vv.userMgr.userId);
            if (user.iJiFen && user.iJiFen > 0) {
                var data = {
                    iRoomId: self._curRoomId,
                    iUserId: cc.vv.userMgr.userId,
                    iSeatIndex: self._selfSeatID,
                };
                cc.vv.socket.send("sitdown", data);
                return;
            }
        }
        
        this._sitDownData = {
            iRoomId: self._curRoomId,
            iUserId: cc.vv.userMgr.userId,
            iSeatIndex: self._selfSeatID,
            iJiFen: 0,
        };
        //var userinfo = {
        //    iUserId: cc.vv.userMgr.userId,
        //    szAlias: cc.vv.userMgr.userName,
        //    szHeadIco: cc.vv.userMgr.iconUrl,
        //}
        //this._selfSeat.getComponent("XuanGameSeat").StartLiuZhuo(userinfo);
        this.ReFreshDairuInfo();
        this.node.getChildByName("DairuFrame").active = true;
        //cc.vv.socket.send("reqsd", data);
    },

    ConfirmSitDown: function (event, arg) {
        if (this._roomData.bOpenGPS && cc.sys.isNative && cc.sys.isMobile) {
            this.ProcessGPS();
        }
        var self = this;
        var DairuFrame = this.node.getChildByName("DairuFrame");
        DairuFrame.active = false;
        if (this._addJifen) {
            this._addJifen = false;
            var jifen = DairuFrame.getChildByName("dairu").getComponent(cc.Label).string;
            var data = {
                iRoomId: self._curRoomId,
                iUserId: cc.vv.userMgr.userId,
                iSeatIndex: self._selfSeatID,
                iJiFen: jifen,
            };
            cc.vv.socket.send("addjifen", data);
            //cc.vv.audioMgr.playSFX("application.mp3");
            return;
        }
        this._sitDownData.iJiFen = DairuFrame.getChildByName("dairu").getComponent(cc.Label).string;
        cc.vv.socket.send("reqsd", this._sitDownData);  // 发送申请坐下消息
    },

    CloseFrame: function (event, arg) {
        cc.vv.audioMgr.playSFX("dian.mp3");
        event.target.parent.active = false;
        if (event.target.parent.name == "DairuFrame") {
            if (this._backtable) {
                this._selfScript.CaoZuoBtnParent.getChildByName("comeback").active = true;
            }
        }
    },

    //getLocalSeatId: function (seatIndex, userid) {
    //    seatIndex = parseInt(seatIndex);
    //    if (userid == cc.vv.userMgr.userId) {
    //        this._selfSeatID = seatIndex;
    //        this.ResetAllSeatIndex(seatIndex);
    //        this.ProcessAllUserSeat();
    //        return 0;
    //    }

    //    if (this._selfSeatID == -1) {
    //        return seatIndex;
    //    } else {
    //        if (seatIndex > this._selfSeatID) {
    //            return seatIndex - this._selfSeatID;
    //        } else {
    //            return 8 - this._selfSeatID + seatIndex;
    //        }
    //    }
    //},

    GetSeatBySeatId: function (index) {
        for (var i = 0; i < this._seatScript.length; i++) {
            if (this._seatScript[i]._seatIndex == index) {
               // console.log("aaaaaaaaaaa"+index + "bbbbbbbbbbb"+i);
                return this._seatScript[i];
            }
        }
    },

    isNeedChongPai: function () {
        var selfinfo = this.getUserInfoByUserId(cc.vv.userMgr.userId);
        this._selfSeatID = selfinfo.iSeatIndex;
        //console.log(selfinfo.iSeatIndex);
        //console.log(this._seatScript[0]._seatIndex);
        //console.log("++++++++++++++++++++++++++");
        if (selfinfo.iSeatIndex == this._seatScript[0]._seatIndex) {
            console.log("座位号一样 退出");
            return false;
        } else {
            return true;
        }
    },

    ProcessAllUserSeat: function () {
     
        for (var i = 0; i < this._seatScript.length; i++) {
            this._seatScript[i].DisposeSeat();
        }

        for (var i = 0; i < this._allPlayerInfo.length; i++) {
            if (this._allPlayerInfo[i].iUserId == cc.vv.userMgr.userId) {
                continue;
            }
            if (this._allPlayerInfo[i].iState >= 0 && this._allPlayerInfo[i].iState < 10) {
                this.GetSeatBySeatId(this._allPlayerInfo[i].iSeatIndex).SyncSeat(this._allPlayerInfo[i]);
            }
        }
    },

    getSeatByUserId: function (userid) {
        for (var i = 0; i < this._seatScript.length; i++) {
            if (this._seatScript[i]._userId == userid) {
                return this._seatScript[i];
            }
        }
        return null;
    },

    getUserInfoByUserId: function (userid) {
        for (var i = 0; i < this._allPlayerInfo.length; i++) {
            if (this._allPlayerInfo[i].iUserId == userid) {
                return this._allPlayerInfo[i];
            }
        }
        return null;
    },


    AutoXiuDiu: function () {
        this._autoXiuDiu = !this._autoXiuDiu;
        if (this._autoXiuDiu)
            this._autoXiu = false;
        this._selfScript.SetXiuDiu(this._autoXiuDiu, this._autoXiu);
    },

    AutoXiu: function () {
        this._autoXiu = !this._autoXiu;
        if (this._autoXiu)
            this._autoXiuDiu = false;
        this._selfScript.SetXiuDiu(this._autoXiuDiu, this._autoXiu);
    },

    OnGenBtnClick: function (event, arg) {  //imode 0: 跟  1大  2 敲
        var self = this;
        var jifen = event.target.children[0].getComponent(cc.Label).string;
        var data = {
            iRoomId: self._curRoomId,
            iUserId: cc.vv.userMgr.userId,
            iJiFen: jifen,
            iMode: 0,
        };
        cc.vv.socket.send("yazhu", data);
        this.CloseAllCaoZuoBtn();
    },

    OnXiuBtnClick: function () {
        var self = this;
        var data = {
            iRoomId: self._curRoomId,
            iUserId: cc.vv.userMgr.userId,
        };
        cc.vv.socket.send("rest", data);
        this.CloseAllCaoZuoBtn();
    },

    OnDiuBtnClick: function () {
        var self = this;
        var data = {
            iRoomId: self._curRoomId,
            iUserId: cc.vv.userMgr.userId,
        };
        cc.vv.socket.send("lose", data);
        this.CloseAllCaoZuoBtn();
    },

    OnQiaoBtnClick: function (event, arg) {
        var self = this;
        var jifen = event.target.children[0].getComponent(cc.Label).string;
        var data = {
            iRoomId: self._curRoomId,
            iUserId: cc.vv.userMgr.userId,
            iJiFen: jifen,
            iMode: 2,
        };
        cc.vv.socket.send("yazhu", data);
        this.CloseAllCaoZuoBtn();
    },

    OnDaBtnClick: function (event, arg) {
        var self = this;
        var jifen = event.target.children[0].getComponent(cc.Label).string;
        var data = {
            iRoomId: self._curRoomId,
            iUserId: cc.vv.userMgr.userId,
            iJiFen: jifen,
            iMode: 1,
        };
        cc.vv.socket.send("yazhu", data);
        this.CloseAllCaoZuoBtn();
    },

    On2BeiBtnClick: function (event, arg) {
        var self = this;
        var jifen = event.target.children[0].getComponent(cc.Label).string;
        var data = {
            iRoomId: self._curRoomId,
            iUserId: cc.vv.userMgr.userId,
            iJiFen: jifen,
            iMode: 1,
        };
        cc.vv.socket.send("yazhu", data);
        this.CloseAllCaoZuoBtn();
    },

    On4BeiBtnClick: function (event, arg) {
        var self = this;
        var jifen = event.target.children[0].getComponent(cc.Label).string;
        var data = {
            iRoomId: self._curRoomId,
            iUserId: cc.vv.userMgr.userId,
            iJiFen: jifen,
            iMode: 1,
        };
        cc.vv.socket.send("yazhu", data);
        this.CloseAllCaoZuoBtn();
    },

    On6BeiBtnClick: function (event, arg) {
        var self = this;
        var jifen = event.target.children[0].getComponent(cc.Label).string;
        var data = {
            iRoomId: self._curRoomId,
            iUserId: cc.vv.userMgr.userId,
            iJiFen: jifen,
            iMode: 1,
        };
        cc.vv.socket.send("yazhu", data);
        this.CloseAllCaoZuoBtn();
    },

    GetPokerCard: function (cardId, _sprite) {
        var spName = "";
        var cardPoint = 0;
        var color = 0;
        if (cardId == 2000) {
            spName = "pokerbig";
        } else {
            cardPoint = cardId % 100;
            color = parseInt(cardId / 100); // 0-3     方，梅，黑,红，
            color -= 1;
            spName = "poker" + color + "_" + cardPoint;
        }
        _sprite.spriteFrame = this.PokeAtlas.getSpriteFrame(spName);
    },

    ChangeDargPokePos: function (_node, index) {
        for (var i = 0; i < this.DragPokes.length; i++) {
            if (i == index) {
                continue;
            }
            if (cc.pDistance(_node.getPosition(), this.DragPokes[i].getPosition()) < 80) {
                var temp = _node.getComponent(cc.Sprite).spriteFrame;
                _node.getComponent(cc.Sprite).spriteFrame = this.DragPokes[i].getComponent(cc.Sprite).spriteFrame;
                this.DragPokes[i].getComponent(cc.Sprite).spriteFrame = temp;

                var temp2 = _node.getComponent("DargScript")._pokeId;
                _node.getComponent("DargScript")._pokeId = this.DragPokes[i].getComponent("DargScript")._pokeId;
                this.DragPokes[i].getComponent("DargScript")._pokeId = temp2;
                break;
            }
        }
    },


    FenPaiConfirm: function () {
        this._selfScript.PokeNode.active = true;
        this.node.getChildByName("fenpai").active = false;
        var arr = [];
        var arr2 = [];
        arr.push(this.DragPokes[0].getComponent("DargScript")._pokeId);
        arr.push(this.DragPokes[1].getComponent("DargScript")._pokeId);
        arr2.push(this.DragPokes[2].getComponent("DargScript")._pokeId);
        arr2.push(this.DragPokes[3].getComponent("DargScript")._pokeId);
        console.log(arr);
        console.log(arr2);
        var self = this;
        var data = {
            pPais1: arr,
            pPais2: arr2,
            iRoomId: self._curRoomId,
        }
        cc.vv.socket.send("split", data);
        this.StopFenPaiDaojishi();
    },

    RefreshPoketype: function () {
        var arr = [];
        var arr2 = [];
        console.log(cc.vv.PokeType);
        arr.push(this.DragPokes[0].getComponent("DargScript")._pokeId);
        arr.push(this.DragPokes[1].getComponent("DargScript")._pokeId);
        arr2.push(this.DragPokes[2].getComponent("DargScript")._pokeId);
        arr2.push(this.DragPokes[3].getComponent("DargScript")._pokeId);
        var type1 = cc.vv.PokeType.GetPaiCodeObj(arr);
        if (type1 == null) {
            type1 = this.GetPoint(arr);
        } else {
            type1 = type1.szName;
        }
        var type2 = cc.vv.PokeType.GetPaiCodeObj(arr2);
        if (type2 == null) {
            type2 = this.GetPoint(arr2);
        } else {
            type2 = type2.szName;
        }
        console.log(type1);
        console.log(type2);
        this.node.getChildByName("fenpai").getChildByName("Lbl1").getComponent(cc.Label).string = type1;
        this.node.getChildByName("fenpai").getChildByName("Lbl2").getComponent(cc.Label).string = type2;
    },

    GetPoint: function (arr) {
        var end1 = arr[0] % 100 ;
        var end2 = arr[1] % 100;
        if (arr[0] == 2000)
            end1 = 6;
        if (arr[1] == 2000)
            end2 = 6;

        return (end1 + end2) % 10 + "点";
    },

    SitUp: function () {
        cc.vv.audioMgr.playSFX("dian.mp3");
        var self = this;
        var data = {
            iRoomId: self._curRoomId,
            iUserId: cc.vv.userMgr.userId,
        }
        cc.vv.socket.send("situp", data);
        this.OnMenuBtnClick(null,1);
    },

    ShowLiuZhuoFrame: function () {
        cc.vv.audioMgr.playSFX("dian.mp3");
        this.node.getChildByName("liuzhuoFrame").active = true;
        this.node.getChildByName("gameme_ssage").children[0].active = false;
        this.node.getChildByName("liuzhuoFrame").getChildByName("refresh").children[0].active = false;
        this.node.getChildByName("liuzhuoFrame").active = true;
        this.getrsdus();
    },

    InitLiuZHuoInfo: function (data) {
        for (var i = 2; i < this.LiuZhuoParent.children.length; i++) {
            this.LiuZhuoParent.children[i].destroy();
        }
        for (var i = 0; i < data.pUserObjs.length; i++) {
            var itemEx = this.LiuZhuoParent.getChildByName("itemShenQing");
            var item = cc.instantiate(itemEx);
            item.parent = this.LiuZhuoParent;
            item.getChildByName("roomname").getComponent(cc.Label).string = data.pUserObjs[i].szRoomName;
            item.getChildByName("shenqingren").getComponent(cc.Label).string = data.pUserObjs[i].szAlias;
            item.getChildByName("shenqingtime").getComponent(cc.Label).string = cc.vv.gameNetMgr.dateFormatTimeHMS(data.pUserObjs[i].tmReqTime);
            item.getChildByName("info").getComponent(cc.Label).string = "申请带入" + data.pUserObjs[i].iReqJiFen + ",总带入上限提升" + data.pUserObjs[i].iReqJiFen;
            item.getChildByName("shenqingrenid").getComponent(cc.Label).string = data.pUserObjs[i].iUserId;
            item.getChildByName("dairu").getComponent(cc.Label).string = data.pUserObjs[i].iReqJiFen;
            item.getChildByName("memo").getComponent(cc.Label).string = data.pUserObjs[i].szMemo;
            item.getChildByName("uid").getComponent(cc.Label).string = data.pUserObjs[i].iUid;
            var dairuParent = item.getChildByName("dairuchoose");
            for (var j = 0; j < dairuParent.children.length; j++) {
                dairuParent.children[j].getComponent(cc.Label).string = data.pUserObjs[i].iReqJiFen + (this._roomData.iMinFenE * j);
            }
            var sliderCtrl = item.getChildByName("sliderzuixiaodairu").getComponent("SliderControl");
            var lbl = item.getChildByName("dairu").getComponent(cc.Label);
            var baseFen = data.pUserObjs[i].iReqJiFen;
            var self = this;
            sliderCtrl._intervalFunc = function (arg) {
                lbl.string = baseFen + self._roomData.iMinFenE * arg;
                console.log(lbl.string);
            }
            item.active = true;
        }


        for (var i = 0; i < data.pLogs.length; i++) {
            var itemEx = this.LiuZhuoParent.getChildByName("itemResult");
            var item = cc.instantiate(itemEx);
            item.parent = this.LiuZhuoParent;
            item.getChildByName("roomname").getComponent(cc.Label).string = data.pLogs[i].szRoomName;
            item.getChildByName("shenqingren").getComponent(cc.Label).string = data.pLogs[i].szReqAlias;
            item.getChildByName("time").getComponent(cc.Label).string = cc.vv.gameNetMgr.dateFormatTimeHMS(data.pLogs[i].tmTime);
            item.getChildByName("info").getComponent(cc.Label).string = data.pLogs[i].szMessage;
            item.active = true;
        }
        this.LiuZhuoParent.height = data.pUserObjs.length * 623 + data.pLogs.length * 276;

        this.node.getChildByName("liuzhuoFrame").getChildByName("NeScrollView").getComponent(cc.ScrollView).scrollToTop();
    },


    ResultBackCoinMove: function (node) {
        if (node == null)
            return;
        console.log(node);
        var coin = cc.instantiate(this.ResultChip);
        coin.parent = this.ResultChip.parent;
        coin.setPosition(this.ResultChip.getPosition());
        coin.active = true;
        var end = node.parent.convertToWorldSpaceAR(node.getPosition());
        console.log(end);
        end = this.ResultChip.parent.convertToNodeSpaceAR(end);
        console.log(end);
        var moveto = cc.moveTo(0.4, end.x, end.y);
        coin.runAction(moveto);
        this.scheduleOnce(function () {
            coin.destroy();
        }, 0.5);
    },

    ResultCoinMove: function (node) {
        if (node == null)
            return;
        console.log(node);
        var coin = cc.instantiate(this.ResultChip);
        coin.parent = this.ResultChip.parent;
        coin.setPosition(this.ResultChip.getPosition());
        coin.active = true;
        var end = node.parent.convertToWorldSpaceAR(node.getPosition());
        console.log(end);
        end = this.ResultChip.parent.convertToNodeSpaceAR(end);
        console.log(end);
        var moveto = cc.moveTo(0.4, end.x, end.y);
        coin.runAction(moveto);
        this.scheduleOnce(function () {
            coin.destroy();
        }, 0.5);
    },

    ResetGame: function () {
        this._piCount = 0;
        this.SetPiChi(this._piCount);
        this._autoXiu = false;
        this._autoXiuDiu = false;
        this._selfScript.CaoZuoBtnParent.getChildByName("game_btn_autoxiu").active = false;
        this._selfScript.CaoZuoBtnParent.getChildByName("game_btn_autoxiu_h").active = false;
        this._selfScript.CaoZuoBtnParent.getChildByName("game_btn_xq_h").active = false;
        this._selfScript.CaoZuoBtnParent.getChildByName("game_btn_xq").active = false;
       // this._selfScript.node.getChildByName("ShowPaiPokeNode").active = false;
    },

    SelfSitChange: function () {
        for (var i = 0; i < this._seatScript.length; i++) {
           // console.log(this._seatScript[i]._userId );
            if (this._seatScript[i]._userId == 0 || this._seatScript[i]._userId == null) {
                this._seatScript[i].SelfSitChange();
            }
        }
        this.SetMenuDisplay();
    },

    SelfStandChange: function () {
        for (var i = 0; i < this._seatScript.length; i++) {
            this._seatScript[i].SelfStandUpChange();
        }
        this.SetMenuDisplay();
    },

    OnGPSBtnClick: function () {
        //this.GPSNode.children[0].active = false;
        this.node.getChildByName("GPSFrame").active = true;
        //this._GPSData   init
    },

    OnGpsFrameClick: function () {
        this.node.getChildByName("GPSFrame").active = false;
    },

    PlayEmoji: function (event, arg) {
        this.OnFaceBtnClick(null, 1);
        var self = this;
        var data = {
            iRoomId:self._curRoomId,
            iUserId: cc.vv.userMgr.userId,
            pData: {
                sign: 0,
                index: arg,
            }
        }
        this.SendUserNotifyMSG(data);
    },
    
    PlayEmojiPay: function (event, arg) {
        if (cc.vv.userMgr.coins < 10) {
            cc.vv.alert.show("金币不足");
            return;
        }
        var destuserid = this.UserInfo.getChildByName("userid").getComponent(cc.Label).string;
        if (destuserid == cc.vv.userMgr.userId) {
            return;
        }
        var self = this;
        var data = {
            iRoomId: self._curRoomId,
            iUserId: cc.vv.userMgr.userId,
            pData: {
                destuserid: destuserid,
                index: arg,
                sign: 1,
            }
        }
        this.SendUserNotifyMSG(data);
        this.UserInfo.active = false;
    },

    //flag: 0  emoji   1 emojipay   2 voice
    SendUserNotifyMSG: function (userdata) {
        cc.vv.socket.send("notify", userdata);
    },

    ShowUserInfo: function (user) {
        this.UserInfo.getChildByName("name").getComponent(cc.Label).string = user._userName;
        this.UserInfo.getChildByName("userid").getComponent(cc.Label).string = user._userId;
        this.UserInfo.getChildByName("id").getComponent(cc.Label).string = "ID:" + user._userId;
        this.UserInfo.getChildByName("iconMask").children[0].getComponent(cc.Sprite).spriteFrame = user.HeadIcon.getComponent(cc.Sprite).spriteFrame;
        if (this._isadminUser) {
            if (this.GetUserISJY(user._userId)) {
                this.UserInfo.getChildByName("novoice").active = true;
                this.UserInfo.getChildByName("openvoice").active = false;
            } else {
                this.UserInfo.getChildByName("novoice").active = false;
                this.UserInfo.getChildByName("openvoice").active = true;
            }
        } else {
            this.UserInfo.getChildByName("openvoice").active = false; 
            this.UserInfo.getChildByName("novoice").active = false;
        }

        if (this._isadminUser) {
            this.UserInfo.getChildByName("tichu").active = true;
        } else {
            this.UserInfo.getChildByName("tichu").active = false;
        }
        var user = this.getUserInfoByUserId(user._userId);
        console.log(user);
        var data = user.pExtObj;
        var tongji = this.UserInfo.getChildByName("info");
        tongji.getChildByName("jushu").getComponent(cc.Label).string = data.iZhongJuShu;
        tongji.getChildByName("shoushu").getComponent(cc.Label).string = data.iZhongShouShu;
        tongji.getChildByName("ruchi").getComponent(cc.Label).string = data.iRuChiLv + "%";
        tongji.getChildByName("ruchisheng").getComponent(cc.Label).string = data.iRuChiShenLv + "%";
        if (cc.vv.userMgr.isVIP) {
            tongji.getChildByName("tanpai").getComponent(cc.Label).string = data.iTanPaiLv + "%";
            tongji.getChildByName("tanpaisheng").getComponent(cc.Label).string = data.iTanPaiSLv + "%";
            tongji.getChildByName("changjunzhanji").getComponent(cc.Label).string = data.iJunChangZJ;
            tongji.getChildByName("changjundairu").getComponent(cc.Label).string = data.iJunChangDR;
        } else {
            tongji.getChildByName("tanpai").getComponent(cc.Label).string = "--";
            tongji.getChildByName("tanpaisheng").getComponent(cc.Label).string = "--";
            tongji.getChildByName("changjunzhanji").getComponent(cc.Label).string = "--";
            tongji.getChildByName("changjundairu").getComponent(cc.Label).string = "--";
        }

        this.UserInfo.active = true;

        cc.vv.socket.send("getvoice", { iRoomId: this._curRoomId, iUserId: cc.vv.userMgr.userId, iDestUser: user.iUserId });
    },

    TichuYOnghu: function () {
        cc.vv.audioMgr.playSFX("dian.mp3");
        var userid = this.UserInfo.getChildByName("userid").getComponent(cc.Label).string;
        cc.vv.socket.send("killuser", { iRoomId:this._curRoomId, iDestUser:userid });
    },

    YuYinHuifang: function (event, arg) {
        cc.vv.audioMgr.playSFX("dian.mp3");
        var userid = event.target.parent.getChildByName("userid").getComponent(cc.Label).string;
        cc.vv.socket.send("playvoice", { iRoomId: this._curRoomId, iDestUser: userid});
    },

    Requestliuzuo: function () {
        cc.vv.audioMgr.playSFX("dian.mp3");
        var self = this;
        var data = {
            iRoomId: self._curRoomId,
            iUserId: cc.vv.userMgr.userId,
        };
        cc.vv.socket.send("liuzuo", data);
        this.OnMenuBtnClick(null, 1);
    },

    OnYanshiBtnClick: function () {
        cc.vv.audioMgr.playSFX("dian.mp3");
        cc.vv.socket.send("yanshi", { iRoomId: this._curRoomId, iUserId: cc.vv.userMgr.userId });  
    },

    InitObUserInfo: function (seePlayers) {
        for (var i = 1; i < this.ObuesrParent.children.length; i++) {
            this.ObuesrParent.children[i].destroy();
        }
        for (var i = 0; i < seePlayers.length; i++) {
            var user = cc.instantiate(this.ObuesrParent.children[0]);
            user.parent = this.ObuesrParent;
            user.getChildByName("iconMask").children[0].getComponent("LoadImage").LoadUserIcon(seePlayers[i].iUserId);
            user.getChildByName("name").getComponent(cc.Label).string = seePlayers[i].szAlias;
            user.active = true;
        }
        this.ObuesrParent.height = (seePlayers.length / 3 + 1) * this.ObuesrParent.children[0].height;
        console.log(this.ObuesrParent.height);
    },

    Ongetusermsgs: function () {
        cc.vv.socket.send("getusermsgs ", { iRoomId: this._curRoomId});  
    },
    
    update(dt) {
        if (new Date().getMinutes() <= 9) {
            this._curtime = new Date().getHours() + ":0" + new Date().getMinutes();
        } else {
            this._curtime = new Date().getHours() + ":" + new Date().getMinutes();
        }
        if (this._lastTime != this._curtime) {
            this._lastTime = this._curtime;
            this.Systtime.string = this._lastTime;
            this.initPhoneINfo();
        }
        if (this._ShowJieSuanTime) {
            this.RefreshJieSanTime();
        }
    },

    SetUserOb: function (userid) {
        var user = this.getUserInfoByUserId(userid);
        if (user != null) {
            user.iState = 10;
        }
    },

    SetUserLiuZuoTime: function (userid, time) {
        var user = this.getUserInfoByUserId(userid);
        if (user != null) {
            user.iTimeOutLZ = time;
        }
    },

    GetUserLiuZuoTime: function (userid) {
        var user = this.getUserInfoByUserId(userid);
        if (user == null)
            return;
        if (user.iTimeOutLZ) {
            return user.iTimeOutLZ;
        } else {
            user.iTimeOutLZ = 300;
            return user.iTimeOutLZ;
        }
    },

    getjyusers: function () {
        //this.node.getChildByName("")
        cc.vv.audioMgr.playSFX("dian.mp3");
        this.menuFrame.getComponent(cc.Animation).play("menuin");
        this.menuFrame.getChildByName("close").active = false;
        cc.vv.socket.send("getjyusers", { iRoomId: this._curRoomId });  
        this.node.getChildByName("RoomGuanli").active = true;
        this.OnMenuBtnClick(null, 1);
    },

    SetJinYan: function (event, arg) {
        var userid = event.target.parent.parent.getChildByName("info").getChildByName("id").getComponent(cc.Label).string;
        cc.vv.socket.send("jingyan", { iRoomId: this._curRoomId, iDestUser: userid, iMode: arg });  
    },

    UserInfoSetJinYan: function (event, arg) {
        var userid = event.target.parent.parent.getChildByName("userid").getComponent(cc.Label).string;
        cc.vv.socket.send("jingyan", { iRoomId: this._curRoomId, iDestUser: userid, iMode: arg });
    },


    GetJiangChiLog: function () {
        cc.vv.socket.send("jclogs", { iRoomId: this._curRoomId }); 
       
    },

    ShowPai: function (event,arg) {
        cc.vv.socket.send("showpais", {});
        event.target.parent.active = false;
    },

    SetJiangchiLbl: function (data) {
        if (this.JiangChiLbl.active) {
            var str = "0000000" + data;
            str = str.substring(str.length - 6);
            console.log(str);
            for (var i in str) {
                if (isNaN(parseInt(i))) {
                    return;
                }
                var parent = this.JiangChiLbl.children[i].children[0];
                if (parent.children[1].getComponent(cc.Label).string != str[i]) {
                    parent.children[0].getComponent(cc.Label).string = parent.children[1].getComponent(cc.Label).string;
                    parent.children[1].getComponent(cc.Label).string = str[i];
                    parent.getComponent(cc.Animation).play("scrollUP");
                }
            }
            //this.JiangChiLbl.children[0].getComponent(cc.Label).string = ;
        }
    },

    OnJiangChiBtnClick: function (event, arg) {
        if (arg == 0) {
            this.JiangChiNode.getChildByName("frame1").active = true;
            this.JiangChiNode.getChildByName("frame2").active = false;
            this.JiangChiNode.getChildByName("frame3").active = false;
            this.JiangChiNode.getChildByName("yulan").getChildByName("bg").active = true;
            this.JiangChiNode.getChildByName("jiangchi").getChildByName("bg").active = false;
            this.JiangChiNode.getChildByName("log").getChildByName("bg").active = false;
        } else if (arg == 1) {
            this.JiangChiNode.getChildByName("frame1").active = false;
            this.JiangChiNode.getChildByName("frame2").active = true;
            this.JiangChiNode.getChildByName("frame3").active = false;
            this.JiangChiNode.getChildByName("yulan").getChildByName("bg").active = false;
            this.JiangChiNode.getChildByName("jiangchi").getChildByName("bg").active = true;
            this.JiangChiNode.getChildByName("log").getChildByName("bg").active = false;
        } else{
            this.JiangChiNode.getChildByName("frame1").active = false;
            this.JiangChiNode.getChildByName("frame2").active = false;
            this.JiangChiNode.getChildByName("frame3").active = true;
            this.JiangChiNode.getChildByName("yulan").getChildByName("bg").active = false;
            this.JiangChiNode.getChildByName("jiangchi").getChildByName("bg").active = false;
            this.JiangChiNode.getChildByName("log").getChildByName("bg").active = true;
        }
    },

    GetUserISJY: function (userid) {
        for (var i = 0; i < this._curJinYanData.pSeatPlayers.length; i++) {
            if (this._curJinYanData.pSeatPlayers[i].iUserId == userid)
                return this._curJinYanData.pSeatPlayers[i].bJinYan;
        }

        for (var i = 0; i < this._curJinYanData.pSeePlayers.length; i++) {
            if (this._curJinYanData.pSeePlayers[i].iUserId == userid)
                return this._curJinYanData.pSeePlayers[i].bJinYan;
        }
    },

    //0 休芒  1  揍芒  2没搭动
    MaketipLbl: function (index) {
        var tipnode = this.node.getChildByName("tipLbl");
        tipnode.getComponent(cc.Animation).play("TipMove");
        for (var i = 0; i < tipnode.children.length; i++) {
            if (i == index) {
                tipnode.children[i].active = true;
            } else {
                tipnode.children[i].active = false;
            }
        }
        tipnode.active = true;
    },

    ReFreshDairuInfo: function () {
        var dairuframe = this.node.getChildByName("DairuFrame");
        dairuframe.getChildByName("golds").getComponent(cc.Label).string = cc.vv.userMgr.coins;
        var user = this.getUserInfoByUserId(cc.vv.userMgr.userId);
        var zong = user.iJiFenDR;
        if (user.iJiFenDR == null) {
            zong = 0;
        }

        var cur = user.iJiFenCDR;
        if (user.iJiFenCDR == null) {
            cur = 0;
        }
        dairuframe.getChildByName("fen").getComponent(cc.Label).string = cur + "/" + zong;
        //console.log(dairuframe.getChildByName("sliderzuixiaodairu"));
        //console.log(dairuframe.getChildByName("sliderzuixiaodairu").getComponent("SliderControl"));
     //   dairuframe.getChildByName("sliderzuixiaodairu").getComponent("SliderControl").SetProgress(0);
    },

    SetButtonInteractable: function (btn, flag) {
        btn.interactable = flag;
        if (flag) {
            btn.node.color = new cc.Color(255, 255, 255, 255);
        } else {
            btn.node.color = new cc.Color(94, 94, 94, 255);
        }
    },

    RefreshJieSanTime: function () {
        if (this._jiesanTime == 0) {
            return;
        }
        var count = this._jiesanTime - Date.now();
        if (count < 0) {
            this.jiesanLbl.string = "剩余时间00:00:00";
            this._jiesanTime = 0;
            return;
        }
        count /= 1000;
        var str = "";
        var h = count / 3600;
        h = parseInt(h);
        var m = count % 3600 / 60;
        m = parseInt(m);
        var s = count % (60);
        s = parseInt(s);
        if (h < 10) {
            str += "0" + h;
        } else {
            str += h;
        }
        if (m < 10) {
            str += ":0" + m;
        } else {
            str += ":"+m;
        }
        if (s < 10) {
            str += ":0" + s;
        } else {
            str +=":"+ s;
        }
        this.jiesanLbl.string = "剩余时间" + str;
    },
    
});
