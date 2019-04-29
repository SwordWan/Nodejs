cc.Class({
    extends: cc.BaseClass,

    properties: {
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad () {

    },

    OpenNext: function (event, arg) {
        cc.vv.audioMgr.playSFX("dian.mp3");
        var phoneNumber = this._editPhone.$EditBox.string;
        this._GaimiPhone = phoneNumber;
        if (this._GaimiPhone == "" || this._GaimiPhone.length < 11) {
            cc.vv.alert.show("请输入正确的手机号码!");
        }
        cc.vv.socket.send("getsmscode", {
            szMobile: phoneNumber
        });
        this.hideView();
        this.m_Hook.showPrefab('ModifyPsw', this.m_Hook.node, function (node) {
            node.$ModifyPsw.setPhone(this._GaimiPhone);
        }.bind(this));
    },

    onHideView: function () {
        this.onBtSound();
        if (this.m_Hook.m_nodeFrame) {
            this.m_Hook.m_nodeFrame.active = true;
        }
    }


    // update (dt) {},
});
