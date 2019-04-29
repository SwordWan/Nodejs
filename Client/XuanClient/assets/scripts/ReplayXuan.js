
cc.Class({
    extends: cc.Component,

    properties: {
        Seats: { default: [], type: cc.Node },
        MangGuo: { default: null, type: cc.Node },
        PiChi: { default: null, type: cc.Node },
        MangguoCoin: { default: null, type: cc.Node },
        PokeAtlas: { default: null, type: cc.SpriteAtlas },
        ResultNode: { default: null, type: cc.Node },
        ResultScore: { default: null, type: cc.Node },
        ResultChip: { default: null, type: cc.Node },

        _replayData: null,
        _curActionIndex: 0,
        _roomData: null,
        _seatScript: [],
        _allPlayerInfo: null,
        _actions: null,
        _zhuangSeatIndex: 0,
        _fapaicount: 0,
        _Dtime:0,
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad() {
        cc.vv.replayXuan = this;
        for (var i = 0; i < this.Seats.length; i++) {
            this._seatScript.push(this.Seats[i].getComponent("replaySeat"));
        }

        for (var i = 0; i < this._seatScript.length; i++) {
            this._seatScript[i]._seatIndex = i;
        }

        this.GetReplayData(cc.vv.gameNetMgr._replayRoomUUID, cc.vv.gameNetMgr._replayShoushu);
    },

    GetReplayData: function (roomid,playtimes) {
        var self = this;
        var onCallBack = function (ret) {
            console.log(ret);
            if (ret.wErrCode == 0) {
                self.InitInfo(ret);
            } else {
                cc.vv.alert.show(ret.szErrMsg);
            }
        };
        cc.vv.http.sendRequest("/getgamevideo", { szRoomUUID: roomid, iPlayTimes: playtimes }, onCallBack);
    },

    ReplayEnd: function () {
        this.node.getChildByName("mask").active = true;
    },

    Replay: function () {
        this.node.getChildByName("mask").active = false;
        this.InitInfo();
    },

    InitInfo: function (data) {
        if (data != null) {
            this._replayData = JSON.parse(data.pVideo);
        }
        console.log(this._replayData);
        this._roomData = this._replayData.pRoomArgs;
        this.SetRoomInfo();
        this._allPlayerInfo = this._replayData.pPlayers;
        this._actions = this._replayData.pActions;
        this._curActionIndex = 0;
        this.MangGuo.parent.active = true;
        this.PiChi.parent.active = true;
        this._fapaicount = 0;
        this._Dtime = 1;
        for (var i = 0; i < this._allPlayerInfo.length; i++) {
            this._allPlayerInfo[i].iJiFen = this._allPlayerInfo[i].iOrgJiFen;
            this.GetSeatBySeatId(this._allPlayerInfo[i].iSeatIndex).SyncSeat(this._allPlayerInfo[i]);
            if (this._allPlayerInfo[i].iUserId == this._replayData.iBanker) {
                this._zhuangSeatIndex = this._allPlayerInfo[i].iSeatIndex;
                this.GetSeatBySeatId(this._allPlayerInfo[i].iSeatIndex).SetZhuang();
            }
        }
        this.scheduleOnce(function () {
            this.ReplayRound();
        }, 1);
    },


    SetRoomInfo: function () {
        this.node.getChildByName("info").getChildByName("roomname").getComponent(cc.Label).string = "房间名称：" + this._roomData.szName;
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
        this.node.getChildByName("info").getChildByName("dipi").getComponent(cc.Label).string = "底皮：" + this._roomData.iBaseFen;
    },
   

    ReplayRound: function () {
        if (this._curActionIndex == this._actions.length) {
            return;
        }
        var delayTime = 0;
        var item = this._actions[this._curActionIndex];

        this.StopProgress();
        if (item.iCmd == 1) {  //底分
            this.MakeDifen(item);
            delayTime = this._Dtime;
        } else if (item.iCmd == 2) {  // 跟
            delayTime = this._Dtime;
            this.DelayProcessActions(this._Dtime, 2, item);
        } else if (item.iCmd == 3) {  // 大
            delayTime = this._Dtime;
            this.DelayProcessActions(this._Dtime, 3, item);
        } else if (item.iCmd == 4) {  // 敲
            delayTime = this._Dtime;
            this.DelayProcessActions(this._Dtime, 4, item);
        } else if (item.iCmd == 5) {  // 休
            delayTime = this._Dtime;
            this.DelayProcessActions(this._Dtime, 5, item);
        } else if (item.iCmd == 6) {  // 丢
            delayTime = this._Dtime;
            this.DelayProcessActions(this._Dtime, 6, item);
        } else if (item.iCmd == 7) {  // 延时
            delayTime = this._Dtime;
            this.DelayProcessActions(this._Dtime, 7, item);
        } else if (item.iCmd == 8) {  // 发牌
            if (item.pData.pPlayers) {
                delayTime = item.pData.pPlayers.length * 0.2 + 0.5;
                this._fapaicount += 1;
                this.MakeFapai(item);
            } else {
                delayTime = item.pData.length * 0.2 + 0.5;
                this._fapaicount += 1;
                this.MakeFapaiAgain(item);
            }
        } else if (item.iCmd == 9) {  // 分牌
            delayTime = this._Dtime + 3;
            this.Fenpai_delay(item);
            this.MakeFenPai(item);
        } else if (item.iCmd == 10) {  // 结算
            this.Action_Jiesuan(item.pData);
        } else {
            return;
        }
        
        this._curActionIndex += 1;
        this.scheduleOnce(function () {
            this.ReplayRound();
        }, delayTime);
    },

    MakeFenPai: function (item) {
        this.scheduleOnce(function () {
            this.Action_Fenpai(item);
        }, this._Dtime + 2);
    },

    DelayProcessActions: function (delayTime, index, item) {
        this.makeProgress(item.iUserId);
        this.scheduleOnce(function () {
            this.MakeAction(index, item);
        }, delayTime);
    },

    MakeAction: function (index, item) {
        console.log(index);
        console.log(item);
        if (item.iCmd == 2) {  // 跟
            this.Action_Gen(item);
        } else if (item.iCmd == 3) {  // 大
            this.Action_Da(item);
        } else if (item.iCmd == 4) {  // 敲
            this.Action_Qiao(item);
        } else if (item.iCmd == 5) {  // 休
            this.Action_Xiu(item);
        } else if (item.iCmd == 6) {  // 丢
            this.Action_Diu(item);
        } else if (item.iCmd == 7) {  // 延时
            this.Action_Yanshi(item);
        } 
    },

    MakeDifen: function (data) {
        for (var i = 0; i < data.pData.pPlayers.length; i++) {
            var seat = this.getSeatByUserId(data.pData.pPlayers[i].iUserId);
            seat.SetYaZhu(data.pData.pPlayers[i].iJiFenYZ, data.pData.pPlayers[i].iNewJiFen);
            seat.SetScore(data.pData.pPlayers[i].iNewJiFen);
            seat.MangguoCoinMove();
        }
        this.SetMangguo(data.pData.iJiFenMGC, data.pData.iJiFenMGTimes);
    },


    Action_Gen: function (data) {
        var seat = this.getSeatByUserId(data.iUserId);
        seat.SetYaZhu(data.iValue);
        seat.SetActionTip(true, false, false, false, false, false, false, false);
        cc.vv.audioMgr.playSFX("MoveChipFive.mp3");
    },

    Action_Da: function (data) {
        var seat = this.getSeatByUserId(data.iUserId);
        seat.SetYaZhu(data.iValue);
        seat.SetActionTip(false, false, false, true, false, false, false, false);
        cc.vv.audioMgr.playSFX("MoveChipFive.mp3");
    },

    Action_Qiao: function (data) {
        var seat = this.getSeatByUserId(data.iUserId);
        seat.SetYaZhu(data.iValue);
        seat.MakeQiaoFx();
        seat.SetActionTip(false, false, false,false, false, true, false, false);
        cc.vv.audioMgr.playSFX("MoveChipFive.mp3")
    },

    Action_Xiu: function (data) {
        var seat = this.getSeatByUserId(data.iUserId);
        cc.vv.audioMgr.playSFX("pcheck.wav");
        seat.SetActionTip(false, false, true, false, false, false, false, false);
        //this.getUserInfoByUserId(data.iUserId).iState = 5;
    },

    Action_Diu: function (data) {
        var seat = this.getSeatByUserId(data.iUserId);
        seat.SetActionTip(false, true, false, false, false, false, false, false);
        seat.diupai();
        seat.StopProgress();
        this._piCount += parseInt(seat.YaZhuLbl.string);
        this.SetPiChi(this._piCount);
    },

    Action_Yanshi: function (data) {
        var user = this.getSeatByUserId(data.iUserId);
        user.ChangeProgress(15);
    },


    MakeFapai: function (data) {
       
        this.scheduleOnce(function () {
            for (var i = 0; i < data.pData.pPlayers.length; i++) {
                this.StartDelayFapai(data.pData, i);
            }
        }, 0.5);
    },
    
    StartDelayFapai: function (data, index) {
        this.scheduleOnce(function () {
            var seat = this.getSeatByUserId(data.pPlayers[index].iUserId);
            if (seat != null) {
                seat.StartFaPai(data.pPlayers[index].pPais, data.pPlayers.length);
            }
        }, 0.2 * index);
    },

    MakeFapaiAgain: function (data) {
        this.scheduleOnce(function () {
            for (var i = 0; i < data.pData.length; i++) {
                this.StartDelayFapaiAgain(data.pData, i);
            }
        }, 0.5);
    },

    StartDelayFapaiAgain: function (data, index) {
        this.scheduleOnce(function () {
            var seat = this.getSeatByUserId(data[index].iUserId);
            if (seat != null) {
                seat.FapaiAgain(data[index].pPais, data.length);
            }
        }, 0.2 * index);
    },


    Fenpai_delay: function (data) {
        for (var i = 0; i < data.pData.length; i++) {
            this.makeProgress(data.pData[i].iUserId);
        }
    },


    Action_Fenpai: function (data) {
        for (var i = 0; i < data.pData.length; i++) {
            var seat = this.getSeatByUserId(data.pData[i].iUserId);
            seat.StopProgress();
            seat.JieSuanSHowPai(data.pData[i]);
            seat.SetActionTip(false, false, false, false, true, false, false, false);
        }
        
    },

    Action_Jiesuan: function (data) {
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

        this.scheduleOnce(this._jieSuanFunc1, 1.5);

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
            this.PiChi.parent.active = true;
            this.MangGuo.parent.active = true;
            this.ReplayEnd(); 
        }
        this.scheduleOnce(this._jieSuanFunc, 3);
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
   
    
    getSeatByUserId: function (userid) {
        for (var i = 0; i < this._seatScript.length; i++) {
            if (this._seatScript[i]._userId == userid) {
                return this._seatScript[i];
            }
        }
        return null;
    },

    GetSeatBySeatId: function (index) {
        for (var i = 0; i < this._seatScript.length; i++) {
            if (this._seatScript[i]._seatIndex == index) {
                // console.log("aaaaaaaaaaa"+index + "bbbbbbbbbbb"+i);
                return this._seatScript[i];
            }
        }
    },

    getUserInfoByUserId: function (userid) {
        for (var i = 0; i < this._allPlayerInfo.length; i++) {
            if (this._allPlayerInfo[i].iUserId == userid) {
                return this._allPlayerInfo[i];
            }
        }
        return null;
    },

    SetMangguo: function (mang, beishu) {
        this.MangGuo.getComponent(cc.Label).string = mang;
        this.MangGuo.parent.getChildByName("lbl").getComponent(cc.Label).string = "芒果:x" + beishu;
    },

    SetPiChi: function (pi) {
        this.PiChi.getComponent(cc.Label).string = pi;
        // this.PiChi.parent.getChildByName("lbl").getComponent(cc.Label).string ="皮池: "+ pi;
    },

    StopProgress: function () {
        for (var i = 0; i < this._seatScript.length; i++) {
            this._seatScript[i].StopProgress();
        }
    },

    makeProgress: function (userid) {
        this.getSeatByUserId(userid).SetProgress(15);
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


    GetPoint: function (arr) {
        var end1 = arr[0] % 100;
        var end2 = arr[1] % 100;
        if (arr[0] == 2000)
            end1 = 6;
        if (arr[1] == 2000)
            end2 = 6;

        return (end1 + end2) % 10 + "点";
    },

     update (dt) {},
});
