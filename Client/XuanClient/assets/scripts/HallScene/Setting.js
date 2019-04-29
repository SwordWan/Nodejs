cc.Class({
    extends: cc.BaseClass,

    properties: {
        m_Check: cc.Component
    },

    onLoad() {
        this.m_Check._func = function (flag) {
            if (flag) {
                cc.vv.audioMgr.setSFXVolume(1, true);
                cc.sys.localStorage.setItem("yinxiao", 1);
            } else {
                cc.vv.audioMgr.setSFXVolume(0, true);
                cc.sys.localStorage.setItem("yinxiao", 0);
            }
        }
    },

    onShowView: function () {
        var yinxiao = cc.sys.localStorage.getItem("yinxiao");
        
        this.m_Check.SetChecked(yinxiao == 1);
    },

    onBtChangeAcc: function () {
        this.onBtSound();
        cc.sys.localStorage.removeItem("UserName");
        cc.sys.localStorage.removeItem("UserPwd");
        cc.vv.userMgr.userId = 0,
        cc.director.loadScene("login");
    },

    onBtChangePsw: function () {
        this.onBtSound();
        cc.vv.socket.send("getsmscode", {
            szMobile: cc.vv.phone
        });
        this.hideView();
        this.m_Hook.showPrefab('ModifyPsw', this.m_Hook._SecDLG, function (node) {
            node.$ModifyPsw.setPhone(cc.vv.phone);
        }.bind(this))
    },


});