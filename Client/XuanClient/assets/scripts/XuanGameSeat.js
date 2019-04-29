import { EAFNOSUPPORT } from "constants";

cc.Class({
    extends: cc.Component,

    properties: {
        SeatDownNode: { default: null, type: cc.Node },
        NoneNode: { default: null, type: cc.Node },
        SeatNode: { default: null, type: cc.Node },
        ZhuangNode: { default: null, type: cc.Node },
        HeadIcon: { default: null, type: cc.Node },
        NameLbl: { default: null, type: cc.Label },
        ScoreLbl: { default: null, type: cc.Label },
        YuyinNode: { default: null, type: cc.Node },
        GenTip: { default: null, type: cc.Node },
        DiuTip: { default: null, type: cc.Node },
        XiuTip: { default: null, type: cc.Node },
        DaTip: { default: null, type: cc.Node },
        FenDownTip: { default: null, type: cc.Node },
        QiaoTip: { default: null, type: cc.Node },
        DelayTip: { default: null, type: cc.Node },
        MaiPaiTip: { default: null, type: cc.Node },
        YaZhuSprite: { default: null, type: cc.Node },
        YaZhuLbl: { default: null, type: cc.Label },
        PokeNode: { default: null, type: cc.Node },
        PaiSign: { default: null, type: cc.Node },
        MaskNode: { default: null, type: cc.Node },
        PokePos: { default: null, type: cc.Node },
        CaoZuoBtnParent: { default: null, type: cc.Node },
        EmojiNode: { default: null, type: cc.Node },
        EmojiPayNode: { default: null, type: cc.Node },

        _seatIndex: 0,
        _localUser: false,
        _userId: 0,
        _userName: null,
        _userInfo: null,
        _liuzuoSchedule: null,
        _zero: null,
        _fapaiCount: 0,
        _obIng: false,
        _leftJifen: 0,
        _selfUserSeat: false,
        _progressFrame: null,
        _changeSpeed: 0,
        _currentRange: 0,
        _startChangeProgress: false,
        _EmojiPayFrame: null,
        _temp: 0,
        _paiSingMove: null,
        _isTimeUp: false,
        _emojiFunc: null,
        _fenpai:false,
    },

    // LIFE-CYCLE CALLBACKS:
    onLoad() {
        this._obIng = false;
        this._zero = { x: 360, y: 640 };
        this._progressFrame = this.SeatNode.getChildByName("progress").getComponent(cc.Sprite);
        this._paiSingMove = this.SeatNode.getChildByName("paisignMove");
        this.node.getChildByName("ShowPaiPokeNode").children[0].active = false;
        this.node.getChildByName("ShowPaiPokeNode").children[1].active = false;
    },

    ResetSomeThing: function () {
        this.PaiSign.active = false;
        this._paiSingMove.active = false;
        this.node.getChildByName("score").active = false;
        this.CloseXiupaiNode();
    },

    SyncSeat: function (info) {
        this.unscheduleAllCallbacks();
        this.ResetSomeThing();
        this._startChangeProgress = false;
        console.log(info);
        this.NoneNode.active = false;
        this.SeatDownNode.active = false;
        this.SeatNode.active = true;
        this._userId = info.iUserId;
        this._userName = info.szAlias;
        this.HeadIcon.getComponent("LoadImage").LoadUserIcon(this._userId);
        this._localUser = this._userId == cc.vv.userMgr.userId;
        this.ScoreLbl.string = info.iJiFen;
        this.NameLbl.string = info.szAlias;//info.name;
        this._leftJifen = info.iJiFen;
        this._fapaiCount = 0;
        this.SeatNode.getChildByName("fire").active = false;
        this.YuyinNode.active = false;
        this.GenTip.active = false;
        this.DiuTip.active = false;
        this.XiuTip.active = false;
        this.DaTip.active = false;
        this.FenDownTip.active = false;
        this.QiaoTip.active = false;
        this.DelayTip.active = false;
        this.MaiPaiTip.active = false;
        this.YaZhuLbl.node.parent.active = false;
        this.PokeNode.active = false;
        var lbl1 = this.SeatNode.getChildByName("Lbl1");
        var lbl2 = this.SeatNode.getChildByName("Lbl2");
        lbl1.active = false;
        lbl2.active = false;
        if (this._localUser) {
            this.CaoZuoBtnParent.getChildByName("xiupaibtn").active = false;
            this.PokeNode.scaleX = 1;
            this.PokeNode.scaleY = 1;
            // this.PokeNode.y = -230;
            // lbl1.x = -110;
            // lbl1.y = -350;
            // lbl2.x = 110;
            // lbl2.y = -350;
        } else {
            this.PokeNode.scaleX = 0.5;
            this.PokeNode.scaleY = 0.5;
            // this.PokeNode.y = -200;
            // lbl1.x = -90;
            // lbl1.y = -285;
            // lbl2.x = 90;
            // lbl2.y = -285;
        }
        this.ResetPokes();
        this.unschedule(this._liuzuoSchedule);
        if (info.iState >= 1 && info.iState < 7) {
            if (info.iJiFenYZ && info.iJiFenYZ > 0) {
                this.SetYaZhu(info.iJiFenYZ, info.iJiFen);
            }
            this.MaskNode.active = false;
            if (this._userId == cc.vv.userMgr.userId && info.iJiFen > 0) {
                this.CaoZuoBtnParent.getChildByName("comeback").active = false;
            }
            if (info.pPais) {
                if (info.pPais.length > 0) {
                    this._fapaiCount = info.pPais.length - 1;
                }
            }
            if (!this._localUser && info.pPais && info.pPais.length > 0) {
                this.PaiSign.active = true;
            } 
            this.TongbuState(info.iState);
            this.scheduleOnce(function () {
                if (info.pPais) {
                    this.SyncSHowPai(info.pPais);
                } else {
                    this.PaiSign.active = false;
                }
            }, 0.5);
        } else if (info.iState < 10) {
            this._leftJifen = info.iJiFen;
            this.ScoreLbl.string = info.iJiFen;
            this.MaskNode.active = true;
            this.PaiSign.active = false;
            var lbl = this.MaskNode.getChildByName("second").getComponent(cc.Label);
            var count = cc.vv.xuangame.GetUserLiuZuoTime(this._userId);
            lbl.string = count + "s";
            var self = this;
            this.unschedule(this._liuzuoSchedule);
            cc.vv.xuangame.SetUserLiuZuoTime(this._userId, 300);
            this._liuzuoSchedule = function () {
                count--;
                if (count <= 0) {
                    cc.vv.xuangame.SetUserOb(this._userId);
                    cc.vv.xuangame.SetUserLiuZuoTime(this._userId, 300);
                    self.DisposeSeat();
                    //var data = {
                    //    iRoomId: cc.vv.xuangame._curRoomId,
                    //    iUserId: cc.vv.userMgr.userId,
                    //}
                    //cc.vv.GameNet.send("situp", data);
                }
                cc.vv.xuangame.SetUserLiuZuoTime(this._userId, count);
                lbl.string = count + "s";
            }
            this.schedule(this._liuzuoSchedule, 1, 300, 0);
            if (this._userId == cc.vv.userMgr.userId && (info.iState == 7 || info.iState == 8)) {
                this.CaoZuoBtnParent.getChildByName("comeback").active = true;
            }
        }
        
        if (this._userId == cc.vv.userMgr.userId) {
            cc.vv.xuangame.SelfSitChange();
        }
        //����ͷ��
        //��ʼ��userseat
        if (this._localUser) {
            this.CaoZuoBtnParent.active = true;
        }
    },

    TongbuState: function (state) {
        if (state == 6) {
            this.QiaoTip.active = true;
            this.MakeQiaoFx();
            this.PaiSign.active = !this._localUser;
        } else if (state == 5) {
            this.DiuTip.active = true;
            this.PaiSign.active = false;
            this.PokeNode.active = this._localUser;
        } else if (state == 4) {
            this.PaiSign.active = !this._localUser;
            this.XiuTip.active = true;
        }
    },

    SetZhuang: function () {
        this.ZhuangNode.active = true;
    },

    SetProgress: function (num) {
        this._changeSpeed = 1 / num / 45;
        this._currentRange = 0;
        this._progressFrame.fillRange = 1 / 16 * num;
        this._startChangeProgress = true;
        this._progressFrame.node.active = true;
        this._isTimeUp = false;
    },

    ChangeProgress: function (num) {
        this._changeSpeed = 1 / num / 45;
        this._currentRange = 0;
        this._progressFrame.fillRange = 1;
    },

    StopProgress: function () {
        this._startChangeProgress = false;
        this._progressFrame.node.active = false;
    },

    //StartLiuZhuo: function (info) {
    //    this.NoneNode.active = false;
    //    this.SeatNode.active = true;
    //    this._userId = info.iUserId;
    //    if (this._userId == cc.vv.userMgr.userId) {
    //        this._localUser = true;
    //    }
    //    this.ScoreLbl.string = 0;
    //    this.NameLbl.string = info.szAlias;//info.name;
    //    this._leftJifen = 0;
    //    this.MaskNode.active = true;
    //    var lbl = this.MaskNode.getChildByName("second").getComponent(cc.Label);
    //    var count = 180;
    //    lbl.string = count+"s";
    //    var self = this;
    //    this._liuzuoSchedule = function () {
    //        count--;
    //        if (count <= 0) {
    //            self.DisposeSeat();
    //        }
    //        lbl.string = count + "s";
    //    }
    //    this.schedule(this._liuzuoSchedule, 1,180,0);   //(function, interval, repeat, delay);
    //    //����ͷ��
    //    //��ʼ��userseat
    //    if (this._localUser) {
    //        this.CaoZuoBtnParent.active = true;
    //        this.YuyinNode.active = false;
    //        this.GenTip.active = false;
    //        this.DiuTip.active = false;
    //        this.XiuTip.active = false;
    //        this.DaTip.active = false;
    //        this.FenDownTip.active = false;
    //        this.QiaoTip.active = false;
    //        this.DelayTip.active = false;
    //        this.MaiPaiTip.active = false;
    //        this.YaZhuLbl.node.parent.active = false;
    //        this.PokeNode.active = false;
    //        this.PaiSign.active = false;
    //    
    //    this.ResetPokes();
    //},

    ZuoxiaResult: function (data) {
        cc.vv.audioMgr.playSFX("Sitdown.mp3");
        if (this._userId == cc.vv.userMgr.userId && this._leftJifen > 0) {
            this.CaoZuoBtnParent.getChildByName("comeback").active = false;
        }
        this.unschedule(this._liuzuoSchedule);
        cc.vv.xuangame.SetUserLiuZuoTime(this._userId, 300); 
        this.MaskNode.active = false;
        this.ScoreLbl.string = data.iJiFen;
        this._leftJifen = data.iJiFen;
    },

    DisposeSeat: function () {
        //if (this.PokeNode.active) {
        //    this.diupai();
        //}
        if (this._localUser) {
            cc.vv.xuangame.CloseAllCaoZuoBtn();
        }
        this._localUser = false;
        this.unschedule(this._liuzuoSchedule);
        if (this._userId == cc.vv.userMgr.userId) {
            cc.vv.xuangame.SelfStandChange();
        }
        this.HeadIcon.getComponent("LoadImage").LoadUserIcon(1,0);
        this.SeatNode.active = false;
        if (this._selfUserSeat) {
            this.NoneNode.active = true;
            this.SeatDownNode.active = false;
        } else {
            this.NoneNode.active = false;
            this.SeatDownNode.active = true;
        }
        this.ZhuangNode.active = false;
        if (this.CaoZuoBtnParent != null) {
            this.CaoZuoBtnParent.getChildByName("game_btn_xq_h").active = false;
            this.CaoZuoBtnParent.getChildByName("game_btn_xq").active = false;
            this.CaoZuoBtnParent.getChildByName("game_btn_autoxiu_h").active = false;
            this.CaoZuoBtnParent.getChildByName("game_btn_autoxiu").active = false;
        }
        this.ResetPokes();
        this.StopProgress();
        this.PaiSign.active = false;
        this.MaskNode.active = false;
       
        this._userId = 0;
        this.node.getChildByName("CaoZuoBtn").active = false;
    },

    SelfSitChange: function () {
        //if (this._userId != 0)
        //    return;
        this.NoneNode.active = true;
        this.SeatDownNode.active = false;
        this._selfUserSeat = true;
    },

    SelfStandUpChange: function () {
        //if (this._userId != 0)
        //    return;
        this.NoneNode.active = false;
        this.SeatDownNode.active = true;
        this._selfUserSeat = false;
    },

    StartFaPai: function (pais,leng) {
        //console.log("localUser:" + this._localUser);
        //pais = [407,211];
        this.PokeNode.active = true;
        this.makeCardAnim(this.PokeNode.children[0], pais[0], 0);
        //this.scheduleOnce(function () {
        //    this.makeCardAnim(this.PokeNode.children[1], pais[1], 1);
        //}, 0.15 * leng);
        this._fapaiCount = 1;
    },

    StartFaPai2: function (pais, leng) {
        //console.log("localUser:" + this._localUser);
        //pais = [407,211];
        //this.PokeNode.active = true;
        //this.makeCardAnim(this.PokeNode.children[0], pais[0], 0);
        this.makeCardAnim(this.PokeNode.children[1], pais[1], 1);
        //this.scheduleOnce(function () {
        //}, 0.15 * leng);
    },

    FapaiAgain: function (pais, leng) {
        if (this._localUser) {
            this._fapaiCount++;
        } else {
            if (this._fapaiCount == 0) {
                this._fapaiCount == 2;
            } else {
                this._fapaiCount++;
            }
        }
        this.makeCardAnim2(this.PokeNode.children[this._fapaiCount], pais[0], this._fapaiCount);
        if (pais.length == 2) {
            if (pais[0] != pais[1]) {
                if (this._localUser) {
                    this._fapaiCount++;
                } else {
                    this._fapaiCount = 3;
                }
                this.scheduleOnce(function () {
                    this.makeCardAnim2(this.PokeNode.children[this._fapaiCount], pais[1], this._fapaiCount);
                }, 0.15 * leng);
            }
        }
    },

    ResetPokes: function () {
        for (var i = 0; i < this.PokeNode.children.length; i++) {
            this.PokeNode.children[i].children[0].setPosition(this.PokeNode.children[i].convertToNodeSpaceAR(this._zero));
            this.PokeNode.children[i].children[0].active = false;
            this.PokeNode.children[i].children[1].active = false;
        }
        this.PokeNode.active = false;
        this.CloseShowCardEye();
        if (this._localUser) {
            this.PokeNode.children[0].x = -162;
            this.PokeNode.children[1].x = -70;
            this.PokeNode.children[2].x = 22;
            this.PokeNode.children[3].x = 114;
        } else {
            this.PokeNode.children[2].x = 22;
            this.PokeNode.children[3].x = 114;
        }
       
    },

    CloseShowCardEye: function () {
        if (this._localUser) {
            this.PokeNode.children[0].getChildByName("showcard").active = false;
            this.PokeNode.children[1].getChildByName("showcard").active = false;
        }
    },

    makeCardAnim: function (node, cardID, index) {
        if (node == null || node == undefined)
            return;
        cc.vv.audioMgr.playSFX("SendCard.mp3");
        cc.vv.xuangame.GetPokerCard(cardID, node.children[1].getComponent(cc.Sprite));
        var self = this;
        if (self._localUser) {
            if (index == 0) {
                self.PokeNode.children[0].x = -70;
                self.PokeNode.children[1].x = 22;
            }
        }
        var pos = cc.vv.xuangame.Dipai.parent.convertToWorldSpaceAR(cc.vv.xuangame.Dipai.getPosition());
        pos = node.convertToNodeSpaceAR(pos);
        console.log(pos);
        node.children[0].setPosition(pos);
        node.active = true;
        node.children[0].active = true;
        //node.children[1].active = true;
        var end = null;
        var endScale = null;
        node.children[0].setScale(0.6);
        if (this._localUser) {
            endScale = cc.v2(1, 1);
            if (index == 0) {
                end = cc.v2(0, 0);
            } else {
                end = cc.v2(0, 0);
            }
        } else {
            endScale = cc.v2(0.5, 0.5);
            end = this.PaiSign.parent.convertToWorldSpaceAR(this.PaiSign.getPosition());
            end = node.convertToNodeSpaceAR(end);
        }
        var spawn = cc.spawn(cc.moveTo(0.25, end.x, end.y), cc.scaleTo(0.25, endScale.x));
        //var moveto = cc.moveTo(0.2, end.x, end.y)
        var func = function () {
            if (self._localUser) {
                //self.GetPokerCard(cardID, self.CardArr[index].getChildByName("fg").getComponent(cc.Sprite));
                //self.CardArr[index].getComponent(cc.Animation).play("PokeRotate");
                node.setScale(1);
                node.getComponent(cc.Animation).play("pokeRotate");
                self.scheduleOnce(function () {
                    node.children[0].active = false;
                    node.children[1].active = true;
                }, 0.15);
            } else {
                //node.children[0].active = false;
                if (index == 1) {
                    self.PokeNode.children[0].active = false;
                    self.PokeNode.children[1].active = false;
                    self.PokeNode.children[0].children[0].active = false;
                    self.PokeNode.children[1].children[0].active = false;
                    self.PaiSign.active = true;
                    self.PokeNode.children[0].setScale(1);
                    self.PokeNode.children[1].setScale(1);
                }
            }
        };
        var des = cc.callFunc(func);
        //if (this._localUser) {
        //}
        var delay = cc.delayTime(0.1);
        var seq = new cc.Sequence([delay, spawn, des]);
        node.children[0].runAction(seq);
    },


    makeCardAnim2: function (_node, cardID, index) {
        cc.vv.audioMgr.playSFX("SendCard.mp3");
        if (_node == null || _node == undefined)
            return;
        //cc.vv.audioMgr.playSFX("dian.mp3");
        console.log(index + "++++++++++++++++++++++++");
        cc.vv.xuangame.GetPokerCard(cardID, _node.children[1].getComponent(cc.Sprite));
        var self = this;
        if (self._localUser) {
            if (index == 2) {
                self.PokeNode.children[0].x = -107;
                self.PokeNode.children[1].x = -15;
                self.PokeNode.children[2].x = 77;
            }
            if (index == 3) {
                this.PokeNode.children[0].x = -162;
                this.PokeNode.children[1].x = -70;
                this.PokeNode.children[2].x = 22;
                this.PokeNode.children[3].x = 114;
            }
        } else {
            if (index == 2) {
                self.PokeNode.children[2].x = -20;
            }
            if (index == 3) {
                self.PokeNode.children[2].x = -70;
                self.PokeNode.children[3].x = 22;
            }
        }
        var pos = _node.convertToNodeSpaceAR(this._zero)
        //console.log(pos);
        _node.children[0].setPosition(pos);
        _node.active = true;
        _node.children[0].active = true;
        _node.children[0].setScale(0.6);
        var end = null;
        if (this._localUser) {
            end = cc.v2(0, 0);
        } else {
            if (index == 2) {
                end = cc.v2(0, 0);
            }
            if (index == 3) {
                end = cc.v2(30, 0);
            }
           
        }
        var spawn = cc.spawn(cc.moveTo(0.25, end.x, end.y), cc.scaleTo(0.25, 1));     
        var func = function () {
            
            //self.GetPokerCard(cardID, self.CardArr[index].getChildByName("fg").getComponent(cc.Sprite));
            //self.CardArr[index].getComponent(cc.Animation).play("PokeRotate");
            _node.setScale(1);
            _node.getComponent(cc.Animation).play("pokeRotate");
            self.scheduleOnce(function () {
                _node.children[0].active = false;
                _node.children[1].active = true;
            }, 0.15);
        };
        var des = cc.callFunc(func);
        //if (this._localUser) {
        //}
        var delay = cc.delayTime(0.1);
        var seq = new cc.Sequence([delay, spawn, des]);
        _node.children[0].runAction(seq);
    },

    ActionProcess: function (data) {
        //this.CaoZuoBtnParent.getComponent()        
    },

    SetXiuDiu: function (xiudiu, xiu) {
        if (this.CaoZuoBtnParent.getChildByName("game_btn_autoxiu_h").active || this.CaoZuoBtnParent.getChildByName("game_btn_autoxiu").active) {
            this.CaoZuoBtnParent.getChildByName("game_btn_autoxiu_h").active = !xiu;
            this.CaoZuoBtnParent.getChildByName("game_btn_autoxiu").active = xiu;
        }
        if (this.CaoZuoBtnParent.getChildByName("game_btn_xq_h").active || this.CaoZuoBtnParent.getChildByName("game_btn_xq").active ) {
            this.CaoZuoBtnParent.getChildByName("game_btn_xq_h").active = !xiudiu;
            this.CaoZuoBtnParent.getChildByName("game_btn_xq").active = xiudiu;
        }
    },

    SetActionTip: function (gen, diu, xiu, da, fendown, qiao, delay, maipai) {
        console.log("-----------------------------------setActionTip");
        this.GenTip.active = gen;
        this.DiuTip.active = diu;
        this.XiuTip.active = xiu;
        this.DaTip.active = da;
        this.FenDownTip.active = fendown;
        this.QiaoTip.active = qiao;
        this.DelayTip.active = delay;
        this.MaiPaiTip.active = maipai;
    },

    ResetSeat: function () {
        this.SetActionTip(false, false, false, false, false, false, false, false);
        this.ResetPokes();
        this.ZhuangNode.active = false;
        this.PokeNode.active = false;
        this.PaiSign.active = false;
        this._fenpai = false;
        this.YaZhuSprite.parent.active = false;
        this.SeatNode.getChildByName("fire").active = false;
        this.SeatNode.getChildByName("Lbl1").active = false;
        this.SeatNode.getChildByName("Lbl2").active = false;
    },

    SetYaZhu: function (yazhuCount, shengyuFen) {
        if (!this.YaZhuSprite.parent.active) {
            this.YaZhuLbl.string = 0;
            this.YaZhuSprite.parent.children[2].active = false;
            this.YaZhuSprite.parent.active = true;
        }
        this.YaZhuSprite.active = true;
        var end = this.YaZhuSprite.getPosition();
        var pos = this.node.convertToWorldSpace(this.SeatNode.getPosition());
        pos = this.YaZhuSprite.parent.convertToNodeSpaceAR(pos);
        this.YaZhuSprite.setPosition(pos);
        var moveto = cc.moveTo(0.2, end.x, end.y);
        this.YaZhuSprite.runAction(moveto);
     
        this.scheduleOnce(function () {
            this.YaZhuLbl.string = yazhuCount;
            // this.ScoreLbl.string = shengyuFen;
            this._leftJifen = shengyuFen;
            this.YaZhuSprite.parent.children[2].active = true;
        }, 0.2);
    },

    SetScore: function (shengyuFen) {
        console.log("setScore+++++++++++++++++++++++");
        this.ScoreLbl.string = shengyuFen;
        this._leftJifen = shengyuFen;
    },

    DiuAction: function () {
        var end = this.node.convertToNodeSpaceAR(this._zero)
        var moveto = cc.moveTo(0.4, end.x, end.y);
        this.PaiSign.runAction(moveto);
    },

    OnHeadClick: function () {
        cc.vv.xuangame.ShowUserInfo(this);
    },

    JieSuanSHowPai: function (data) {
        if (this._localUser) {
            this.SetPokePos(-162, -70, 47, 139);
        } else {
            this.SetPokePos(-156,-96,22,82);
        }
        this.PokeNode.active = true;
        var pai1 = this.PokeNode.children[0];
        pai1.active = true;
        pai1.children[0].active = false;
        pai1.children[1].active = true;
        cc.vv.xuangame.GetPokerCard(data.pPais1[0], pai1.children[1].getComponent(cc.Sprite));

        var pai2 = this.PokeNode.children[1];
        pai2.active = true;
        pai2.children[0].active = false;
        pai2.children[1].active = true;
        cc.vv.xuangame.GetPokerCard(data.pPais1[1], pai2.children[1].getComponent(cc.Sprite));

        var pai3 = this.PokeNode.children[2];
        pai3.active = true;
        pai3.children[0].active = false;
        pai3.children[1].active = true;
        cc.vv.xuangame.GetPokerCard(data.pPais2[0], pai3.children[1].getComponent(cc.Sprite));

        var pai4 = this.PokeNode.children[3];
        pai4.active = true;
        pai4.children[0].active = false;
        pai4.children[1].active = true;
        cc.vv.xuangame.GetPokerCard(data.pPais2[1], pai4.children[1].getComponent(cc.Sprite));

        var type1 = cc.vv.PokeType.GetPaiCodeObj(data.pPais1);
        if (type1 == null) {
            type1 = cc.vv.xuangame.GetPoint(data.pPais1);
        } else {
            type1 = type1.szName;
        }
        var type2 = cc.vv.PokeType.GetPaiCodeObj(data.pPais2 );
        if (type2 == null) {
            type2 = cc.vv.xuangame.GetPoint(data.pPais2);
        } else {
            type2 = type2.szName;
        }
        var lbl1 = this.SeatNode.getChildByName("Lbl1");
        var lbl2 = this.SeatNode.getChildByName("Lbl2");;
        lbl1.active = true;
        lbl2.active = true;
        // if (this._localUser) {
        //     lbl1.x = -110;
        //     lbl1.y = -350;
        //     lbl2.x = 110;
        //     lbl2.y = -350;
        // } else {
        //     lbl1.x = -90;
        //     lbl1.y = -285;
        //     lbl2.x = 90;
        //     lbl2.y = -285;
        // }
        lbl1.getComponent(cc.Label).string = type1;
        lbl2.getComponent(cc.Label).string = type2;
    },

    SetPokePos: function (x1,x2,x3,x4) {
        this.PokeNode.children[0].x = x1;
        this.PokeNode.children[1].x = x2;
        this.PokeNode.children[2].x = x3;
        this.PokeNode.children[3].x = x4;
    },

    SyncSHowPai: function (data) {
        if (data.length == 0)
            return;
        this.PokeNode.active = true;
        
        if (data.length >= 2 && this._userId == cc.vv.userMgr.userId) {
            this.PokeNode.children[0].x = -60;
            this.PokeNode.children[1].x = 60;
            this.PaiSign.active = false;
            var pai1 = this.PokeNode.children[0];
            pai1.active = true;
            pai1.children[0].active = false;
            pai1.children[1].active = true;
            cc.vv.xuangame.GetPokerCard(data[0], pai1.children[1].getComponent(cc.Sprite));
            var pai2 = this.PokeNode.children[1];
            pai2.active = true;
            pai2.children[0].active = false;
            pai2.children[1].active = true;
            cc.vv.xuangame.GetPokerCard(data[1], pai2.children[1].getComponent(cc.Sprite));
            this._fapaiCount = 1;

            var pai3 = this.PokeNode.children[2];
            pai3.active = false;
            var pai4 = this.PokeNode.children[3];
            pai4.active = false;
        }

        if (data.length == 3) {
            if (this._localUser) {
                this.PokeNode.children[0].x = -120;
                this.PokeNode.children[1].x = 0;
                this.PokeNode.children[2].x = 120;
            } else {
                this.PokeNode.children[2].x = 0;
            }
            this._fapaiCount = 2;
            var pai1 = this.PokeNode.children[2];
            pai1.active = true;
            pai1.children[0].active = false;
            pai1.children[1].active = true;
            cc.vv.xuangame.GetPokerCard(data[2], pai1.children[1].getComponent(cc.Sprite));
            var pai2 = this.PokeNode.children[3];
            pai2.active = false;
        }
        if (data.length == 4) {
            if (this._localUser) {
                this.PokeNode.children[0].x = -180;
                this.PokeNode.children[1].x = -60;
                this.PokeNode.children[2].x = 60;
                this.PokeNode.children[3].x = 180;
            } else {
                this.PokeNode.children[2].x = -60;
                this.PokeNode.children[3].x = 60;
            }
            this._fapaiCount = 3;
            var pai1 = this.PokeNode.children[2];
            pai1.active = true;
            pai1.children[0].active = false;
            pai1.children[1].active = true;
            cc.vv.xuangame.GetPokerCard(data[2], pai1.children[1].getComponent(cc.Sprite));
            if (data[2] == data[3]) {
                return;
            }
            var pai2 = this.PokeNode.children[3];
            pai2.active = true;
            pai2.children[0].active = false;
            pai2.children[1].active = true;
            cc.vv.xuangame.GetPokerCard(data[3], pai2.children[1].getComponent(cc.Sprite));
        }
    },

    ShowSHP: function (data) {
        if (data.length == 0)
            return;
        this.PokeNode.active = true;

        if (data.length >= 2) {
            this.PokeNode.children[0].x = -60;
            this.PokeNode.children[1].x = 60;
            this.PaiSign.active = false;
            var pai1 = this.PokeNode.children[0];
            pai1.active = true;
            pai1.children[0].active = false;
            pai1.children[1].active = true;
            cc.vv.xuangame.GetPokerCard(data[0], pai1.children[1].getComponent(cc.Sprite));
            var pai2 = this.PokeNode.children[1];
            pai2.active = true;
            pai2.children[0].active = false;
            pai2.children[1].active = true;
            cc.vv.xuangame.GetPokerCard(data[1], pai2.children[1].getComponent(cc.Sprite));
        }

        if (data.length == 3) {
            this.PokeNode.children[0].x = -120;
            this.PokeNode.children[1].x = 0;
            this.PokeNode.children[2].x = 120;
            var pai1 = this.PokeNode.children[2];
            pai1.active = true;
            pai1.children[0].active = false;
            pai1.children[1].active = true;
            cc.vv.xuangame.GetPokerCard(data[2], pai1.children[1].getComponent(cc.Sprite));
        }
        if (data.length == 4) {
            this.PokeNode.children[0].x = -180;
            this.PokeNode.children[1].x = -60;
            this.PokeNode.children[2].x = 60;
            this.PokeNode.children[3].x = 180;
            var pai1 = this.PokeNode.children[2];
            pai1.active = true;
            pai1.children[0].active = false;
            pai1.children[1].active = true;
            cc.vv.xuangame.GetPokerCard(data[2], pai1.children[1].getComponent(cc.Sprite));
            var pai2 = this.PokeNode.children[3];
            pai2.active = true;
            pai2.children[0].active = false;
            pai2.children[1].active = true;
            cc.vv.xuangame.GetPokerCard(data[3], pai2.children[1].getComponent(cc.Sprite));
        }
    },


    ResultCoinMove: function () {
        this.YaZhuSprite.parent.children[2].active = false;
        this.YaZhuSprite.active = false;
        var coin = cc.instantiate(this.YaZhuSprite);
        coin.parent = this.YaZhuSprite.parent;
        coin.setPosition(this.YaZhuSprite.getPosition());
        coin.active = true;
        var end = cc.vv.xuangame.ResultNode.parent.convertToWorldSpaceAR(cc.vv.xuangame.ResultNode.getPosition());
        end = this.YaZhuSprite.parent.convertToNodeSpaceAR(end);
        var moveto = cc.moveTo(0.4, end.x, end.y);
        coin.runAction(moveto);
        this.scheduleOnce(function () {
            if (coin == undefined)
                return;
            coin.destroy();
            this.YaZhuSprite.parent.active = false;
        }, 0.5);
    },

    MangguoCoinMove: function () {
        var coin = cc.instantiate(this.YaZhuSprite);
        coin.parent = this.SeatNode;
        coin.setPosition(0,0);
        coin.active = true;
        var end = cc.vv.xuangame.MangguoCoin.parent.convertToWorldSpaceAR(cc.vv.xuangame.MangguoCoin.getPosition());
        end = this.SeatNode.parent.convertToNodeSpaceAR(end);
        var moveto = cc.moveTo(0.4, end.x, end.y);
        coin.runAction(moveto);
        this.scheduleOnce(function () 
        {
            if (coin == undefined)
                return;
            coin.destroy();
        }, 0.5);
    },

    PlayEmoji: function (index) {
        this.unschedule(this._emojiFunc);
        this.EmojiNode.active = true;
        this.EmojiNode.getComponent(cc.Animation).play("emoji" + index);
        this._emojiFunc = function () {
            this.EmojiNode.active = false;
        }
        this.scheduleOnce(this._emojiFunc, 1.5);
    },

    PlayScore: function (score) {
        var scoreLbl = this.node.getChildByName("score");
        scoreLbl.active = true;
        if (score > 0) {
            score = "+" + score;
        }
        scoreLbl.getComponent(cc.Label).string = score;
        scoreLbl.getComponent(cc.Animation).play("JiesuanScoreMove");
        this.scheduleOnce(function () {
            scoreLbl.active = false;
        }, 1);
    },

    SetJifen: function (iNewJiFen) {
        console.log("setJifen+++++++++++++++++++++++");
        this.ScoreLbl.string = iNewJiFen;
        this._leftJifen = iNewJiFen;
    },

    PlayEmojiPay: function (index, end) {
        var emo = cc.instantiate(this.EmojiPayNode.children[index]);
        emo.parent = this.EmojiPayNode;
        emo.setPosition(this.EmojiPayNode.children[index].getPosition());
        if (emo.getComponent(cc.Sprite)) {
            this._EmojiPayFrame = emo.getComponent(cc.Sprite).spriteFrame;
        }
        emo.setPosition(0, 0);
        end = emo.parent.convertToNodeSpaceAR(end);
        emo.active = true;
        var moveto = cc.moveTo(0.6, end.x, end.y);
        var _time = 0.8;
        if (index == 0) {
            emo.scaleX = 2;
            emo.scaleY = 2;
        } else if (index == 1) {
            emo.getComponent(cc.Animation).play("bingtong");
        } else if (index == 2) {
            moveto = cc.moveTo(0.4, end.x, end.y);
            _time = 0.5;
            emo.getComponent(cc.Animation).play("boom");
            cc.vv.audioMgr.playSFX("magicface_2.mp3");
        } else if (index == 3) {
            emo.scaleX = 1.3;
            emo.scaleY = 1.3;
            moveto = cc.moveTo(0.4, end.x, end.y);
            _time = 0.5;
            emo.getComponent(cc.Animation).play("huoba");
        } else if (index == 4) {
            emo.getComponent(cc.Animation).play("hongxin");
        } else if (index == 5) {

        } else if (index == 6) {
            cc.vv.audioMgr.playSFX("magicface_5.mp3");
            emo.getComponent(cc.Animation).play("bishou2");
        } else if (index == 7) {
            emo.scaleX = 1.5;
            emo.scaleY = 1.5;
            emo.getComponent(cc.Animation).play("kiss");
            _time = 0.8;
        }
        emo.runAction(moveto);
        this.scheduleOnce(function () {
            this.ProcessEmojiPay(emo, index);
        }, _time);
    },
    ProcessEmojiPay: function (node, index) {
        var _time = 0;
        if (index == 0) {
            node.scaleX = 1.5;
            node.scaleY = 1.5;
            node.getComponent(cc.Animation).play("xihongshi");
            cc.vv.audioMgr.playSFX("magicface_1.mp3");
            _time = 1.7;
        } else if (index == 1) {
           
            cc.vv.audioMgr.playSFX("magicface_0.mp3");
            _time = 1.5;
        } else if (index == 2) {
            _time = 1.2;
        } else if (index == 3) {
            node.scaleX = 1.2;
            node.scaleY = 1.2;
            cc.vv.audioMgr.playSFX("magicface_3.mp3");
            _time = 1;
        } else if (index == 4) {
           
            _time = 0.8;
            cc.vv.audioMgr.playSFX("item7.mp3");
        } else if (index == 5) {
            node.getComponent(cc.Animation).play("rose");
            cc.vv.audioMgr.playSFX("magicface_4.mp3");
            _time = 2.5;
        } else if (index == 6) {
            _time = 1.8;
        } else if (index == 7) {
          
            cc.vv.audioMgr.playSFX("item6.mp3");
            _time = 1.5;
        }
        this.scheduleOnce(function () {
            node.getComponent(cc.Animation).stop();
            node.destroy();
        }, _time);
    },


    playVoiceAnim: function (time) {
        this.YuyinNode.active = true;
        var time = Math.round(time / 1000 * 10) / 10;
        console.log("ssssssssssssssssssssssssssss" + time);
        this.YuyinNode.children[0].getComponent(cc.Label).string = time + "s";
        this.scheduleOnce(function () {
            this.YuyinNode.active = false;
        }, time);
    },

    diupai: function () {
        cc.vv.audioMgr.playSFX("foldCardSound.mp3");
        this.PaiSign.active = false;
        this._paiSingMove.setPosition(this.PaiSign.getPosition());
        this._paiSingMove.getComponent(cc.Animation).play("PaiSignRotate");
        var pos = this._paiSingMove.parent.convertToNodeSpaceAR(this._zero);
        var moveto = cc.moveTo(0.4,pos.x, pos.y);
        this._paiSingMove.active = true;
        this._paiSingMove.runAction(moveto);
        this.scheduleOnce(function () {
            this._paiSingMove.getComponent(cc.Animation).stop();
            this._paiSingMove.active = false;
        }, 0.5);
    },

    MakeQiaoFx: function () {
        this.SeatNode.getChildByName("fire").active = true;
        this.SeatNode.getChildByName("fire").getComponent(cc.Animation).play("fire");
    },

    ShowPai: function (pais) {
        this.PaiSign.active = false;
        var showpainode = this.node.getChildByName("ShowPaiPokeNode");
        showpainode.active = true;
        showpainode.children[0].active = true;
        showpainode.children[1].active = true;
        cc.vv.xuangame.GetPokerCard(pais[0], showpainode.children[0].children[1].getComponent(cc.Sprite));
        cc.vv.xuangame.GetPokerCard(pais[1], showpainode.children[1].children[1].getComponent(cc.Sprite));
        showpainode.children[0].getComponent(cc.Animation).play("pokeRotate");
        showpainode.children[1].getComponent(cc.Animation).play("pokeRotate");
        this.scheduleOnce(function () {
            showpainode.children[0].children[0].active = false;
            showpainode.children[0].children[1].active = true;
            showpainode.children[1].children[0].active = false;
            showpainode.children[1].children[1].active = true;
        }, 0.15);
        this.PokeNode.children[0].active = false;
        this.PokeNode.children[1].active = false;


        this.scheduleOnce(function () {
            this.node.getChildByName("ShowPaiPokeNode").active = false;
            this.node.getChildByName("ShowPaiPokeNode").children[0].active = false;
            this.node.getChildByName("ShowPaiPokeNode").children[1].active = false;
        }, 3);
    },

    EndShowPaiself: function (index, pais) {
        console.log(pais);
        var showpainode = this.node.getChildByName("ShowPaiPokeNode");
        showpainode.active = true;
        showpainode.children[index].active = true;

        cc.vv.xuangame.GetPokerCard(pais, showpainode.children[index].children[1].getComponent(cc.Sprite));
        showpainode.children[index].getComponent(cc.Animation).play("pokeRotate");
        this.scheduleOnce(function () {
            showpainode.children[index].children[0].active = false;
            showpainode.children[index].children[1].active = true;
        }, 0.15);
        this.PokeNode.children[index].active = false;

        this.scheduleOnce(function () {
            this.node.getChildByName("ShowPaiPokeNode").active = false;
            this.node.getChildByName("ShowPaiPokeNode").children[0].active = false;
            this.node.getChildByName("ShowPaiPokeNode").children[1].active = false;
        }, 3);
    },

    CloseXiupaiNode: function () {
        this.node.getChildByName("ShowPaiPokeNode").active = false;
        this.node.getChildByName("ShowPaiPokeNode").children[0].active = false;
        this.node.getChildByName("ShowPaiPokeNode").children[1].active = false;
    },



    ShowPaiself: function (indexarr, pais) {
        console.log(indexarr);
        console.log(pais);
        var showpainode = this.node.getChildByName("ShowPaiPokeNode");
        showpainode.children[0].active = false;
        showpainode.children[1].active = false;
        showpainode.active = true;
        for (var i = 0; i < indexarr.length; i++) {
            this.XiupaiFunc(i, indexarr,pais);
        }

        this.scheduleOnce(function () {
            this.node.getChildByName("ShowPaiPokeNode").active = false;
            this.node.getChildByName("ShowPaiPokeNode").children[0].active = false;
            this.node.getChildByName("ShowPaiPokeNode").children[1].active = false;
        }, 3);
    },

    XiupaiFunc: function (i, indexarr, pais) {
        var showpainode = this.node.getChildByName("ShowPaiPokeNode");
        showpainode.children[indexarr[i]].active = true;
        cc.vv.xuangame.GetPokerCard(pais[indexarr[i]], showpainode.children[indexarr[i]].children[1].getComponent(cc.Sprite));
        showpainode.children[indexarr[i]].getComponent(cc.Animation).play("pokeRotate");
        this.scheduleOnce(function () {
            showpainode.children[indexarr[i]].children[0].active = false;
            showpainode.children[indexarr[i]].children[1].active = true;
        }, 0.15);
        this.PokeNode.children[indexarr[i]].active = false;
    },

    DisplayXiupaiBtn: function () {
        this.CaoZuoBtnParent.getChildByName("xiupaibtn").active = true;
    },

    update(dt) {
        if (this._startChangeProgress) {
            this._progressFrame.fillRange -= this._changeSpeed;
            if (this._progressFrame.fillRange < 0.2 && !this._isTimeUp) {
                cc.vv.audioMgr.playSFX("TimeUp.mp3");
                this._isTimeUp = true;
            }
            //console.log(this._currentRange);
            if (this._progressFrame.fillRange <= 0) {
                this.StopProgress();
            }
        }
    },
});
