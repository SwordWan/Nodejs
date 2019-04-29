cc.Class({
    extends: cc.BaseClass,

    properties: {
    },

    ctor() {
        this.events = ["creategclub_result"];
    },

    onLoad() {
        cc.vv.socket.addHandlers(this.events, this)
    },


    OnCreateClub: function () {
        this.onBtSound();
        var data = {
            iUserId: cc.vv.userMgr.userId,
            szName: this._clubname.$EditBox.string,
        };
        cc.vv.socket.send("creategclub", data);
    },

    creategclub_result: function (data) {
        if (data.wErrCode == 0) {
            this.node.active = false;
            this.m_Hook.m_nodeClub.onShowView();
        } else {
            this.showAlert(data.szErrMsg);
        }
    },

});
