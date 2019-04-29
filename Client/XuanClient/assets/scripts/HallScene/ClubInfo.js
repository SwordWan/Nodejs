cc.Class({
    extends: cc.BaseClass,

    properties: {

    },

    ctor() {
        this.events = ["getclubusers_result", "delgblub_result", "exitgclub_result", "joinclub_result"];
    },

    onLoad() {
        cc.vv.socket.addHandlers(this.events, this);
    },

    onShowView: function () {
        this.node.zIndex = 2;
    },

    InitClubInfo: function (data) {
        this._clubData = data;
        this._clubid.$Label.string = 'ID:  ' + data.iClubId;
        this._head.$LoadImage.LoadClubIcon(data.iClubId);
        this._createtime.$Label.string = "创建时间: " + cc.vv.gameNetMgr.dateFormatFull(data.tmCreate);
        this._clubname.$Label.string = data.szName;

        this._btJoin.active = data.iUserLevels == 0;
        this._btExit.active = data.iUserLevels == 1 || data.iUserLevels == 2;
        this._btDiss.active = data.iUserLevels == 3;

        this._creator.$Label.string = "创建者:" + data.szCreatorAlias;

        this._renNum.$Label.string = data.iTotalNum + "/" + data.iMaxUsers;
        this._desc.$Label.string = data.szDesc;

        this.m_ClubID = data.iClubId

        this.node.active = true;
    },


    onClubUser: function (tag, data) {
        this.m_UserInfo = new Array();
        cc.vv.socket.send("getclubusers", {
            clubid: this.m_ClubID,
            szName: null
        });
        this.showLoad();
    },

    getclubusers_result: function (data) {
        this.m_UserInfo = this.m_UserInfo.concat(data.rows);
        if (data.rows.length == 0) {
            this.hideLoad();
            this.m_Hook.showPrefab('ClubUser', this.m_Hook._SecDLG, function (node) {
                node.$ClubUser.setView({
                    'rows': this.m_UserInfo
                });
            }.bind(this));
        }

    },

    onDissClub: function () {
        this.onBtSound();
        this.showAlert('确定解散该俱乐部?', 1, function (res) {
            if (res) {
                var data = {
                    iUserId: cc.vv.userMgr.userId,
                    iClubId: this.m_ClubID,
                };
                cc.vv.socket.send("delgblub", data);
            }
        }.bind(this));
    },

    onJoinClub: function () {
        this.onBtSound();
        var data = {
            iUserId: cc.vv.userMgr.userId,
            iClubId: this.m_ClubID,
        };
        cc.vv.socket.send("joinclub", data);
    },

    onExitClub: function () {
        this.onBtSound();
        this.showAlert('确定退出该俱乐部?', 1, function (res) {
            if (res) {
                var data = {
                    iUserId: cc.vv.userMgr.userId,
                    iClubId: this.m_ClubID,
                };
                cc.vv.socket.send("exitgclub", data);
            }
        });
    },


    delgblub_result: function (data) {
        if (data.wErrCode == 0) {
            this.hideView();
        } else {
            this.showAlert(data.szErrMsg);
        }
    },

    exitgclub_result: function (data) {
        if (data.wErrCode == 0) {
            this.hideView();
        } else {
            this.showAlert(data.szErrMsg);
        }
    },

    joinclub_result: function (data) {
        if (data.wErrCode == 0) {
            this.hideView();
        } else {
            this.showAlert(data.szErrMsg);
        }
    },


});