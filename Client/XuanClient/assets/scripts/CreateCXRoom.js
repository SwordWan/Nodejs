cc.Class({
    extends: cc.BaseClass,

    properties: {
        GaojiFrame: { default: null, type: cc.Node },
        GaojiContentParent: { default: null, type: cc.Node },

        
        _time: null,
        _dipi:0,
        _dairuMin: 0,
        _dairuMax: 0,
        _mangguoFengDing: 0,
        _autoStart: 0,
        _noDairu: 0,
        _DairuControl: false,
        _MangGuoOpen:false,
        _xzm: false,
        _gps: false,
        _ssm: false,
        _showPai: false,
        _leagueId: 0,
        _kongzhiDairu: null,
        _OpenMangguo: null,
        _OpenJiangchi:false,
    },

    // use this for initialization
    onLoad: function () {
        var self = this;

        self._mangguoFengDing = 4;
        this._kongzhiDairu = this.node.getChildByName("dairu").getComponent("CheckBox");
        this._OpenMangguo = this.node.getChildByName("mangguo").getComponent("CheckBox");
        this._OpenMangguo._func = function (flag) {
            if (flag) {
                self.SetLbl();
            } else {
                self.node.getChildByName("xiuzoumang").getComponent(cc.Label).string = "芒果未开启";
            }
        }


        var sc1 = this.node.getChildByName("sliderdipi").getComponent("SliderControl");
        var lbldipi = this.node.getChildByName("dipi").getComponent(cc.Label);
        var dairu = this.node.getChildByName("zuixiaodairu").getComponent(cc.Label);
        var dairu2 = this.node.getChildByName("infodairu").getComponent(cc.Label);
       
        self._dairuMin = 100;
        self._dipi = 1;
        sc1._intervalFunc = function (arg) {
            switch (arg) {
                case 0:
                    lbldipi.string = "1/2";
                    dairu.string = "100";
                    self._dipi = 1;
                    break;
                case 1:
                    lbldipi.string = "2/4";
                    dairu.string = "200";
                    self._dipi = 2;
                    break;
                case 2:
                    lbldipi.string = "5/10";
                    dairu.string = "500";
                    self._dipi = 5;
                    break;
                case 3:
                    lbldipi.string = "10/20";
                    dairu.string = "1000";
                    self._dipi = 10;
                    break;
                case 4:
                    lbldipi.string = "20/40";
                    dairu.string = "2000";
                    self._dipi = 20;
                    break;
                case 5:
                    lbldipi.string = "50/100";
                    dairu.string = "4000";
                    self._dipi = 50;
                    break;
                case 6:
                    lbldipi.string = "100/200";
                    dairu.string = "8000";
                    self._dipi = 50;
                    break;
            }
            if (!self._OpenMangguo.checked) {
                self._OpenMangguo.SetChecked(true);
            }
            self._dairuMin = Number(dairu.string);
            self.SetLbl();
        }
        this.GaojiContentParent.getChildByName("league").getChildByName("yue").getComponent(cc.Label).string = cc.vv.userMgr.gems;


        var sc2 = this.node.getChildByName("slidertime").getComponent("SliderControl");
        var timeParent = this.node.getChildByName("jueshuTime");
        timeParent.children[0].color = new cc.Color(211, 194, 105);
        timeParent.children[0].scaleX = 1.5;
        timeParent.children[0].scaleY = 1.5;
        self._time = 0.5;
        sc2._intervalFunc = function (arg) {
            for (var i = 0; i < timeParent.children.length; i++) {
                timeParent.children[i].color = new cc.Color(255, 255, 255);
                timeParent.children[i].scaleX = 1;
                timeParent.children[i].scaleY = 1;
            }
            timeParent.children[arg].color = new cc.Color(211, 194, 105);
            timeParent.children[arg].scaleX = 1.5;
            timeParent.children[arg].scaleY = 1.5;
            var temp = timeParent.children[arg].getComponent(cc.Label).string;
            self._time = temp.replace("h","");
        }


        var sc3 = this.GaojiContentParent.getChildByName("sliderfengding").getComponent("SliderControl");
        //var fengdingParent = this.GaojiContentParent.getChildByName("fengdinglbl");
        sc3._intervalFunc = function (arg) {
            console.log(arg);
            self._mangguoFengDing = (arg + 1);
            if (!self._OpenMangguo.checked) {
                self._OpenMangguo.SetChecked(true);
            }
            self.SetLbl();
        }

        var sc4 = this.GaojiContentParent.getChildByName("sliderautostart").getComponent("SliderControl");
        var autostartParent = this.GaojiContentParent.getChildByName("autostart");
        self._autoStart = 5;
        sc4._intervalFunc = function (arg) {
            self._autoStart = arg;
            if (arg == 1) {
                self._autoStart = 4;
            }
            else if (arg == 2) {
                self._autoStart = 5;
            }
            else if (arg == 3) {
                self._autoStart = 6;
            }
            else if (arg == 4) {
                self._autoStart = 7;
            }
        }


        var sc5 = this.GaojiContentParent.getChildByName("sliderNoDairu").getComponent("SliderControl");
        var autostartParent = this.GaojiContentParent.getChildByName("NoDairu");
        sc5._intervalFunc = function (arg) {
            if (arg == 0) {
                self._noDairu = 0;
            }else if (arg == 1) {
                self._noDairu = 5;
            }
            else if (arg == 2) {
                self._noDairu = 10;
            }
            else if (arg == 3) {
                self._noDairu = 15;
            }
            else if (arg == 4) {
                self._noDairu = 20;
            }
        }

      
    },

    resetInfo: function () {
        this.leagueid = 0;
    },

    RefreshDesplay: function () {
        this._DairuControl = this.node.getChildByName("dairu").getComponent("CheckBox").checked;
        this._MangGuoOpen = this.node.getChildByName("mangguo").getComponent("CheckBox").checked;
        this._xzm = this.GaojiContentParent .getChildByName("xzm").getComponent("CheckBox").checked;
        this._gps = this.GaojiContentParent .getChildByName("gps").getComponent("CheckBox").checked;
        this._ssm = this.GaojiContentParent .getChildByName("ssm").getComponent("CheckBox").checked;
        this._showPai = this.GaojiContentParent.getChildByName("xpai").getComponent("CheckBox").checked;
       // this._OpenJiangchi = this.GaojiContentParent.getChildByName("league").getChildByName("jiangchi").getComponent("CheckBox").checked;
    },
    
    GetCreateRoomData: function () {
        this.RefreshDesplay();
        var roomname = this.node.getChildByName("roomname").getComponent(cc.EditBox).string;
        if (roomname == "") {
            this.showAlert("请输入房间名称");
            return null;
        }
        var clubid = this.m_Hook.m_nodeClubGameList.$ClubGameList.m_ClubID;
        var data = {
            iClubId: clubid,
            iGameId: 0,
            pRoomArgs: {
                szName: roomname,
                iBaseFen: this._dipi,
                iMinFenE: this._dairuMin,
                iMaxFenE: this._dairuMin,
                bCtrlFenE: this._DairuControl,
                bOpenMG: this._MangGuoOpen,
                iMaxMG: this._mangguoFengDing,
                iTimes: this._time * 60,
                bXiuZM: this._xzm,
                bOpenGPS: this._gps,
                bLinkM: this._ssm,
                bCanSP: this._showPai,
                //-------------new add
                iAutoStart: this._autoStart,
                iNoXDR: this._noDairu,
                iAllid: this._leagueId,
                //openJC: this._OpenJiangchi,
            }
        };
        return data;
    },

    onCreateRoom: function () {
        cc.vv.net.send("createroom", this.GetCreateRoomData());
    },

    SetLeagueInfo: function (leagueid, leaguename, leaguelevel) {
        console.log(leagueid);
        console.log(leaguename);
        leaguelevel = parseInt(leaguelevel);
        if (leagueid == 0 || leaguelevel == 2) {
            this.GaojiContentParent.getChildByName("league").active = false;
            this.GaojiContentParent.getChildByName("new_btn_yes").y = -1850;
            this._leagueId = 0;
            this.GaojiContentParent.height = 1974;
        } else {
            var league = this.GaojiContentParent.getChildByName("league");
            league.getChildByName("leaguename").getComponent(cc.Label).string = leaguename;
            league.getChildByName("leagueid").getComponent(cc.Label).string = leagueid;
            league.active = true;
            this.GaojiContentParent.getChildByName("new_btn_yes").y = -2183;
            this.GaojiContentParent.height = 2280;
            var target = this.GaojiContentParent.getChildByName("league").getChildByName("unchecked1");
            target.active = false;
            target.parent.getChildByName("checked").active = true;
            target.parent.getChildByName("checked1").active = true;
            this._leagueId = target.parent.getChildByName("leagueid").getComponent(cc.Label).string;
            target.parent.getChildByName("pay").getComponent(cc.Label).string = 60;
        }
    },

    OnClickLeagueCheck: function (event,arg) {
        if (arg == 0) {
            event.target.active = false;
            event.target.parent.getChildByName("checked").active = true;
            event.target.parent.getChildByName("checked1").active = true;
            this._leagueId = event.target.parent.getChildByName("leagueid").getComponent(cc.Label).string;
            event.target.parent.getChildByName("pay").getComponent(cc.Label).string = 60;
        } else {
            event.target.active = false;
            event.target.parent.getChildByName("unchecked1").active = true;
            event.target.parent.getChildByName("checked").active = false;
            event.target.parent.getChildByName("pay").getComponent(cc.Label).string = 0;
            this._leagueId = 0;
        }
    },


    ShowGaojiFrame: function () {
        cc.vv.audioMgr.playSFX("dian.mp3");
        this.GaojiFrame.active = true;
        var dairu = this.node.getChildByName("zuixiaodairu").getComponent(cc.Label);
        var base = parseInt(dairu.string);
        var sc6 = this.GaojiContentParent.getChildByName("sliderzuixiaodairu").getComponent("SliderControl");
        var mindairuLbl = this.GaojiContentParent.getChildByName("zuixiaodairu").getComponent(cc.Label);
        var infodairu = this.node.getChildByName("infodairu").getComponent(cc.Label);
        mindairuLbl.string = base;
        var self = this;
        sc6._intervalFunc = function (arg) {
            console.log(arg);
            if (base == 500) {
                if (arg == 0) {
                    dairu.string = 200;
                    mindairuLbl.string = 200;
                    infodairu.string = "最小带入:" + 200;
                    self._dairuMin = 200;
                    self.node.getChildByName("infodairu").getComponent(cc.Label).string = "最小带入:" + self._dairuMin;
                } else {
                    dairu.string = base + base  * (arg - 1);
                    mindairuLbl.string = base + base  * (arg - 1);
                    infodairu.string = "最小带入:" + (base + base / 2 * (arg - 1));
                    self._dairuMin = (base + base * (arg - 1));
                    self.node.getChildByName("infodairu").getComponent(cc.Label).string = "最小带入:" + self._dairuMin;
                }
            } else {
                dairu.string = base + base / 2 * (arg - 1);
                mindairuLbl.string = base + base / 2 * (arg - 1);
                infodairu.string = "最小带入:" + (base + base / 2 * (arg - 1));
                self._dairuMin = (base + base / 2 * (arg - 1));
                self.node.getChildByName("infodairu").getComponent(cc.Label).string = "最小带入:" + self._dairuMin;
            }

          
        }
        sc6.SetProgress(0.1);
    },

    CloseGaojiFrame: function () {
        cc.vv.audioMgr.playSFX("dian.mp3");
        this.GaojiFrame.active = false;
        this.SetLbl();
    },

    SetLbl: function () {
        this.RefreshDesplay();
        this.node.getChildByName("infodairu").getComponent(cc.Label).string = "最小带入:" + this._dairuMin;
        var str = "";

        if (this._OpenMangguo.checked) {
            if (this._mangguoFengDing == 6) {
                str += "芒果封顶:无上限";
            } else {
                str += "芒果封顶:" + this._mangguoFengDing;
            }
            if (this._xzm) {
                str += " | 休揍芒";
            }
            if (this._ssm) {
                str += " | 手手芒";
            }
            this.node.getChildByName("xiuzoumang").getComponent(cc.Label).string = str;
        }
    },

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
