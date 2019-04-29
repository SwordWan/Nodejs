cc.Class({
    extends: cc.BaseClass,

    properties: {},

    ctor() {
        this.events = ["getjoingclubs_result", "getclubrooms_result", "joinmsg_result"];
    },

    onLoad() {
        cc.vv.socket.addHandlers(this.events, this);
    },

    onShowView: function () {
        cc.vv.socket.send("getjoingclubs", { iUserId: cc.vv.userMgr.userId });
    },

    onBtClubFrame: function () {
        this.onBtSound();
        this._frame.active = !this._frame.active;
    },

    onCreateClub: function () {
        this.onBtSound();
        this._frame.active = false;
        this.m_Hook.showPrefab('CreateClub', this.m_Hook._SecDLG);
    },

    onJoinClub: function () {
        this.onBtSound();
        this._frame.active = false;
        this.m_Hook.showPrefab('JoinClub', this.m_Hook._SecDLG);
    },

    OpenClubPaiJuFrame: function (event, arg) {
        this.onBtSound();
        cc.vv.socket.send("getclubrooms", {
            iClubId: event.target.customData.iClubId
        });
    },

    getjoingclubs_result: function (data) {
        if (data.wErrCode != 0) {
            this.showAlert(data.szErrMsg);
            return;
        }

        for (var i in this._content.children) {
            this._content.children[i].active = false;
        }

        for (var i = 0; i < data.pClubObjs.length; i++) {
            var _info = data.pClubObjs[i];
            var item = this._content.children[i] || cc.instantiate(this._content.children[0]);
            item.parent = this._content;
            var js = this.bindThor(item);
            js._head.$LoadImage.LoadClubIcon(_info.iClubId);
            js._name.$Label.string = _info.szName; // name
            js._paiju.$Label.string = _info.iRoomCount + "局";
            js._rennumber.$Label.string = _info.iTotalNum + "/" + _info.iMaxUsers;
            js._club_btn_app.active = _info.bIsAdmin && _info.iMsgCount;
            item.customData = {
                'iLevels': _info.iLevels,
                'iClubId': _info.iClubId,
                'bIsAdmin': _info.bIsAdmin,
                'iAllianceid': _info.iAllianceid,
                'iAllianceid': _info.szAlliancename
            }
            item.active = true;
        }
    },

    getclubrooms_result: function (data) {
        if (data.wErrCode != 0) {
            this.showAlert(data.szErrMsg);
            return;
        }
        this.m_Hook.showPrefab('ClubGameList', this.m_Hook._SecDLG, function (node) {
            node.$ClubGameList.setView(data)
        })
    },

    onBtRequire: function (event, arg) {
        this.onBtSound();
        cc.vv.socket.send("joinmsg", { clubid: event.target.parent.customData.iClubId });
    },

    joinmsg_result: function (data) {
        this.m_Hook.showPrefab('RequireList', this.m_Hook._SecDLG, function (node) {
            node.$RequireList.setView(data);
        })
    }

});