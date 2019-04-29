cc.Class({
    extends: cc.BaseClass,

    properties: {

    },

    ctor() {
        this.events = ["alertgoldslist_result"];
    },

    onLoad() {
        cc.vv.socket.addHandlers(this.events, this)
    },

    onShowView: function () {
        cc.vv.socket.send("getlinkrooms", {
            iUserId: cc.vv.userMgr.userId
        })
        cc.vv.socket.send("getaddjfusers", {
            iRoomId: 0
        });
    },

    setView: function (data) {
        if (data.wErrCode != 0) {
            this.showAlert(data.szErrMsg);
            return;
        }

        for (var i in this._content.children) {
            this._content.children[i].active = false;
        }

        for (var i in data.pRooms) {
            var _info = data.pRooms[i];
            var item = this._content.children[i] || cc.instantiate(this._content.children[0]);
            item.parent = this._content;
            var js = this.bindThor(item);

            js._head.$LoadImage.LoadClubIcon(_info.iClubId);
            js._roomname.$Label.string = _info.pRoomArgs.szName; // name
            js._score.$Label.string = _info.pRoomArgs.iBaseFen + "/" + (_info.pRoomArgs.iBaseFen * 2); //score
            js._user.$Label.string = _info.iPlayerCount + "/" + 8; //人数
            js._time.$Label.string = _info.iTimes + "/" + _info.iTimeLen; //当前时间/总时间
            js._gps.active = _info.pRoomArgs.bOpenGPS;
            js._run.active = _info.pRoomArgs.bRunning;
            js._full.active = _info.iPlayerCount == 8;
            js._empty.active = _info.iPlayerCount > 0;

            js.node.customData = {
                'roomid': _info.iRoomId,
                'clubid': _info.iClubId
            };
            // js._roomid.$Label.string = _info.iRoomId; // name
            // js._clubname.$Label.string = _info.szClubName;
            // js._clubLevel.$Label.string = _info.iClubLevel;
            // js._clubid.$Label.string = _info.iClubId;

            item.active = true;
        }
    },

    onBtEnterRoom: function (event) {
        this.onBtSound();;
        cc.vv.gameNetMgr._curClubId = event.target.customData.clubid;
        this.m_Hook.ReEnterRoom(event.target.customData.roomid);
    },

    OnShowLiuZhuoFrame: function () {
        this.m_Hook.showPrefab('RequireEnter', this.m_Hook._SecDLG);
    },

    //基金
    alertgoldslist_result: function (data) {
        cc.vv.userMgr.bExistClubAlert = false;
        if (data.wErrCode == 0) {
            if (data.rows.length > 0) {
                this.PaijuFrame.getChildByName("alert").active = false;
                for (var i = 1; i < this.alertItem.parent.children.length; i++) {
                    this.alertItem.parent.children[i].destroy();
                }
                for (var i = 0; i < data.rows.length; i++) {
                    var item = cc.instantiate(this.alertItem);
                    item.parent = this.alertItem.parent;
                    item.getChildByName("info").getChildByName("clubname").getComponent(cc.Label).string = data.rows[i].clubname;
                    item.getChildByName("info").getChildByName("alertgolds").getComponent(cc.Label).string = data.rows[i].alertgolds;
                    item.getChildByName("time").getComponent(cc.Label).string = data.rows[i].ctime;
                    //item.parent.active = true;
                    item.active = true;
                }
                this.PaijuFrame.getChildByName("yujingFrame").active = true;
            }
        } else {
            cc.vv.alert.show(data.szErrMsg);
        }
    },

    OnAlertClick: function () {
        cc.vv.socket.send("alertgoldslist", {});
    },


});