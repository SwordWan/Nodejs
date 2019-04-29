cc.Class({
    extends: cc.Component,

    properties: {

        contentParent: { default: null, type: cc.Node },
        JieSanBtn: { default: null, type: cc.Node },
        tuichuBtn: { default: null, type: cc.Node },
        jiaruBtn: { default: null, type: cc.Node },
        
        _clubId: 0,
        _clubData: null,
        _curLeagueData: null,
        _levelGolds: null,
        _curChongZhiJijinFenshu: 0,
        _clubUserInfo:null,
        
    },
    //ilevel  俱乐部等级
    //用户排序  iUserLevels: 0未加入  1  普通成员  2管理员 3创建者
    // alliancelevel 0创建者 1管理员 2普通会员
    //clublevel  0创建者  1管理员  2普通
    // use this for initialization
    onLoad: function () {
        //this._clubId = this.node.getChildByName("clubid").getComponent(cc.Label).string;
        this._levelGolds = {};
        this._levelGolds[2] = 450;
        this._levelGolds[3] = 600;
        this._levelGolds[4] = 750;
        this._levelGolds[5] = 4500;
        this._levelGolds[6] = 7200;
        this._levelGolds[7] = 12000;
        this._levelGolds[8] = 18800;
        this._levelGolds[9] = 22800;
        this._curChongZhiJijinFenshu = 1;
    },


    InitClubInfo: function (data) {
        this._clubData = data;
        this.node.getChildByName("nameinfo").getChildByName("changename").active = false;
        this.node.getChildByName("clubid").getComponent(cc.Label).string = data.iClubId;
        this.node.getChildByName("ClubiconMask").children[0].getComponent("LoadImage").LoadClubIcon(data.iClubId);
        this.node.getChildByName("idclub").getComponent(cc.Label).string = "ID:" + data.iClubId;
        this.node.getChildByName("createtime").getComponent(cc.Label).string = "创建时间:" + cc.vv.gameNetMgr.dateFormatFull(data.tmCreate);
        this._clubId = data.iClubId;
        this.node.getChildByName("nameinfo").getChildByName("clubname").getComponent(cc.Label).string = data.szName;
        if (data.iUserLevels == 3) {
            this.jiaruBtn.active = false;
            this.tuichuBtn.active = false;
            this.JieSanBtn.active = true;
            this.node.getChildByName("nameinfo").getChildByName("changename").active = true;
            this.contentParent.getChildByName("clubunion").active = true;
            //this.contentParent.getChildByName("clubhuoyue").active = true;
            this.contentParent.getChildByName("clubjijin").active = true;
        } else if (data.iUserLevels == 1) {
            this.jiaruBtn.active = false;
            this.tuichuBtn.active = true;
            this.JieSanBtn.active = false;
            this.node.getChildByName("nameinfo").getChildByName("changename").active = false;
            this.contentParent.getChildByName("clubunion").active = true;
            //this.contentParent.getChildByName("clubhuoyue").active = false;
            this.contentParent.getChildByName("clubjijin").active = false;
        } else if (data.iUserLevels == 2) {
            this.jiaruBtn.active = false;
            this.tuichuBtn.active = true;
            this.JieSanBtn.active = false;
            this.node.getChildByName("nameinfo").getChildByName("changename").active= false;
            this.contentParent.getChildByName("clubunion").active = true;
            //this.contentParent.getChildByName("clubhuoyue").active = true;
            this.contentParent.getChildByName("clubjijin").active = true;
        } else { // 0
            this.jiaruBtn.active = true;
            this.tuichuBtn.active = false;
            this.JieSanBtn.active = false;
            this.node.getChildByName("nameinfo").getChildByName("changename").active= false;
            this.contentParent.getChildByName("clubunion").active = false;
            this.contentParent.getChildByName("clubhuoyue").active = false;
            this.contentParent.getChildByName("clubjijin").active = false;
        }
        this.node.getChildByName("creator").getComponent(cc.Label).string = "创建者:" + data.szCreatorAlias;
        this.contentParent.getChildByName("level").getChildByName("level").getComponent(cc.Label).string = "LV" + data.iLevels;
        if (data.iLevels == 1) {
            this.contentParent.getChildByName("level").getChildByName("endtime").getComponent(cc.Label).string = "永久";
        } else {
            this.contentParent.getChildByName("level").getChildByName("endtime").getComponent(cc.Label).string = cc.vv.gameNetMgr.dateFormatDay(data.tmLevelEndTime) + "到期";
        }
       
        
        this.contentParent.getChildByName("users").getChildByName("renNum").getComponent(cc.Label).string = data.iTotalNum + "/" + data.iMaxUsers;
        this.contentParent.getChildByName("jieshao").getChildByName("jieshao").getComponent(cc.Label).string = data.szDesc;
        this.contentParent.getChildByName("jieshao").getChildByName("createtime").getComponent(cc.Label).string = cc.vv.gameNetMgr.dateFormatFull(data.tmCreate);
        if (data.szAlliancename != null) {
            this.contentParent.getChildByName("clubunion").getChildByName("leaguename").getComponent(cc.Label).string = data.szAlliancename;
        } else {
            this.contentParent.getChildByName("clubunion").getChildByName("leaguename").getComponent(cc.Label).string = "";
        }
        this.node.active = true;
    },
    
    OpenClubJiJinFrame: function () {
      //  cc.vv.net.send("getclubusers", { iClubId: 725641 });
        this.node.getChildByName("jijin").active = true;
        this.node.getChildByName("jijin").getChildByName("yue").getComponent(cc.Label).string = this._clubData.iGolds;
    },

    OpenChongzhiJiJinFrame: function () {
       // cc.vv.net.send("getclubusers", { iClubId: 725641 });
        this.node.getChildByName("chongzhijijin").active = true;
    },

    OpenJiJinDetailFrame: function () {
      //  cc.vv.net.send("getclubusers", { iClubId: 725641 });
        this.node.getChildByName("jijindetail").active = true;
    },

    JiJinChongZhiAdd: function (event, arg) {
        var lbl = event.target.parent.getChildByName("lbl").getComponent(cc.Label);
        this._curChongZhiJijinFenshu += 1;
        lbl.string = this._curChongZhiJijinFenshu;
        this.MakeJijinDisPlay();
    },

    JiJinChongZhiReduce: function (event, arg) {
        var lbl = event.target.parent.getChildByName("lbl").getComponent(cc.Label);
        this._curChongZhiJijinFenshu -= 1;
        if (this._curChongZhiJijinFenshu == 0) {
            this._curChongZhiJijinFenshu = 1;
        }
        lbl.string = this._curChongZhiJijinFenshu;
        this.MakeJijinDisPlay();
    },

    MakeJijinDisPlay: function () {
        var jijinFrame = this.node.getChildByName("chongzhijijin");
        jijinFrame.getChildByName("get").getComponent(cc.Label).string = (this._curChongZhiJijinFenshu * this._clubData.czGold) / 1000 + "k";
        if (this._curChongZhiJijinFenshu * this._clubData.czDiamond <= cc.vv.userMgr.gems) {
            jijinFrame.getChildByName("pay").color = new cc.Color(255, 255, 255);
        } else {
            jijinFrame.getChildByName("pay").color = new cc.Color(255, 66,66);
        }
        jijinFrame.getChildByName("pay").getComponent(cc.Label).string = (this._curChongZhiJijinFenshu * this._clubData.czDiamond) / 1000 + "k/" + cc.vv.userMgr.gems / 1000 + "k";
    },



    OpenClubHuoYueFrame: function () {
      //  cc.vv.net.send("getclubusers", { iClubId: 725641 });
        this.node.getChildByName("huoyueclub").active = true;
    },

    OpenClubLianMengFrame: function () {
        if (this._clubData.iAllianceid == 0) {
            if (this._clubData.iCreator != cc.vv.userMgr.userId)
                return;
            this.node.getChildByName("league").active = true;
        } else {
            cc.vv.net.send("getallianceinfo", { allianceid: this._clubData.iAllianceid });
        }
    },

    OpenCreateLeague: function (event, arg) {
        this.node.getChildByName("league").getChildByName("createleague").active = true;
    },

    openShenQingJoin: function (event, arg) {
        this.node.getChildByName("league").getChildByName("joinleague").active = true;
    },

    OnCreateLeagueClick: function (event, arg) {
        var name = event.target.parent.getChildByName("leagueName").getComponent(cc.EditBox).string;
        cc.vv.net.send("createalliance", { sname: name });
    },

    OnJoinLeagueClick: function (event,arg) {
        var id = event.target.parent.getChildByName("leagueid").getComponent(cc.EditBox).string;
        id = parseInt(id);
        cc.vv.net.send("applyalliance", { allianceid: id });
    },

    OpenJiesanLianmengConfirm: function (event, arg) {
        //event.target.parent.getChildByName("confirmJiesan").active = true;
        //发送验证码
        cc.vv.net.send("getsmscodejslm", {});
    },

    OnJieSanLianMengClick: function (event, arg) {
        var szcode = event.target.parent.getChildByName("inputbox").getComponent(cc.EditBox).string;
        cc.vv.net.send("dissolvedalliance", { szCode: szcode, allianceid: this._clubData.iAllianceid });
        event.target.active = false;
    },


    DelClubUser: function (userid) {
        for (var i = 0; i < this._clubUserInfo.rows.length; i++) {
            if (this._clubUserInfo.rows[i].userid == userid) {
                this._clubUserInfo.rows[i] = null;
                this._clubUserInfo.rows.splice(i,1);
                return;
            }
        }
    },
    
    OpenClubLevelFrame: function () {
        //cc.vv.net.send("getclubusers", { iClubId: 725641 });
        //this.node.getChildByName("clubinfo").getChildByName("userlist").active = true;
    },

    GetClubUser: function (userid) {
        for (var i = 0;i < this._clubUserInfo.rows.length; i++) {
            if (this._clubUserInfo.rows[i].userid == userid) {
                return this._clubUserInfo.rows[i];
            }
        }
    },


    onDisable() {
        cc.vv.net.send("getjoingclubs", { iUserId: cc.vv.userMgr.userId });
        cc.vv.net.send("getclubrooms", { iClubId: this._clubData.iClubId });
    },

});
