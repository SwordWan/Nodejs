cc.Class({
    extends: cc.BaseClass,

    properties: {
    },

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {},

    updateUserInfo: function () {
        this._labID.$Label.string = "ID:"+cc.vv.userMgr.userId;
        this._labName.$Label.string = cc.vv.userMgr.userName;
        this._labDiamon.$Label.string = cc.vv.userMgr.gems;
        this._labGold.$Label.string = cc.vv.userMgr.coins;
        this._headicon.$LoadImage.LoadUserIcon(cc.vv.userMgr.userId);
    },

    onBtModify: function () {
        this.onBtSound();
        this.m_Hook.showPrefab('ChangeUserInfo', this.m_Hook._SecDLG, function (node) {
            node.$ChangeUserInfo.m_Upper = this;
        }.bind(this));
    },

    onBtShop: function () {
        this.onBtSound();
        this.m_Hook.showPrefab('Shop', this.m_Hook._SecDLG);
    },

    onBtMineData: function () {
        this.onBtSound();
        cc.vv.socket.send("getuserginfo", { iUserId: cc.vv.userMgr.userId });
    },

    onBtSetting: function () {
        this.onBtSound();
        this.m_Hook.showPrefab('Setting', this.m_Hook._SecDLG);
    }

});
