cc.Class({
    extends: cc.BaseClass,

    properties: {},

    ctor() {
        this.events = ['kickclub_result', 'setclubadmin_result'];
    },

    onLoad() {
        cc.vv.socket.addHandlers(this.events, this);
    },

    onShowView: function () {
        this.node.zIndex = 4;
    },


    _setData: function (data) {
        var shenglv = data.iWinTimes / data.iPlayTimes;
        if (data.iPlayTimes == 0) {
            shenglv = 0;
        }
        shenglv = parseFloat(shenglv) * 100;
        shenglv = parseInt(shenglv);
        var ruchilv = data.iRuChiWinTimes / data.iRuChiTimes;
        console.log(ruchilv);
        ruchilv = parseInt(ruchilv * 100);
        this._inRatio.$Label.string = shenglv + "%";
        this._winRatio.$Label.string = ruchilv + "%";
        this._labTotalCnt.$Label.string = data.iGameTimes;
        this._labHandCnt.$Label.string = data.iPlayTimes;
        this._inbar.$ProgressBar.progress = ruchilv / 100;
        this._winbar.$ProgressBar.progress = shenglv / 100;

        this._labShow.$Label.string = data.iTanPaiLv + "%";
        this._labShowWin.$Label.string = data.iTanPaiSLv + "%";
        this._labEveryScore.$Label.string = data.iJiFenSY + "%";
        this._labBring.$Label.string = parseInt(data.iTotalDR / data.iPlayTimes) + "%";
    },

    setView: function (data) {
        this._btSet.active = false;
        this._btCancel.active = false;
        this._btKick.active = false;
        this._Name.$Label.string = cc.vv.userMgr.userName;
        this._ID.$Label.string = "ID:" + cc.vv.userMgr.userId;
        this._headicon.$LoadImage.LoadUserIcon(cc.vv.userMgr.userId);
        this._setData(data);
    },

    setClubUser: function (userdata) {
        this.m_Uid = userdata.uid;
        this.m_ClubID = userdata.clubid;

        this._ID.$Label.string = userdata.userid;
        this._Name.$Label.string = userdata.alias;
        this._headicon.$LoadImage.LoadUserIcon(userdata.userid);
        this._btSet.active = userdata.clublevel == 2;
        this._btCancel.active = userdata.clublevel == 1;
        this._btKick.active = (userdata.clublevel == 2 || userdata.clublevel == 1);

        if (userdata.extdata != null) {
            this._setData(userdata.extdata);
        }
    },

    onBtKickUser: function (event, arg) {
        this.onBtSound();
        cc.vv.socket.send("kickclub", {
            uid: this.m_Uid
        });
    },

    onBtSetMgr: function (event, arg) {
        this.onBtSound();
        var targetid = this._ID.$Label.string;

        cc.vv.socket.send("setclubadmin", {
            allow: arg == '1' ? true : false,
            memberid: targetid,
            clubid: this.m_ClubID
        });
    },

    kickclub_result: function (data) {
        if (data.wErrCode == 0) {
            this.node.active = false;
            this.m_Hook.m_nodeClubInfo.$ClubInfo.onClubUser();
        } else {
            this.showAlert(data.szErrMsg);
        }
    },

    setclubadmin_result: function (data) {
        if (data.wErrCode == 0) {
            this._btSet.active = !data.allow;
            this._btCancel.active = data.allow;
            this.m_Hook.m_nodeClubInfo.$ClubInfo.onClubUser();
        } else {
            this.showAlert(data.szErrMsg);
        }
    },




});