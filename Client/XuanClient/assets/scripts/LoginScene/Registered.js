cc.Class({
    extends: cc.BaseClass,

    properties: {},

    // LIFE-CYCLE CALLBACK`S:


    Register: function (event, arg) {
        cc.vv.audioMgr.playSFX("dian.mp3");
        if (this._editPhone.$EditBox.string == '' ||
            this._editPsw.$EditBox.string == '' ||
            this._editSure.$EditBox.string == '' ||
            this._editVerify.$EditBox.string == ''
        ) {
            this.showAlert("请完善信息后重试!");
            return;
        }
        var strPsw = this._editPsw.$EditBox.string;
        var strSure = this._editPsw.$EditBox.string;
        if (strPsw != strSure) {
            this.showAlert("输入的密码不同, 请重试!");
            return;
        }
        cc.vv.phone = this._editPhone.$EditBox.string;
        cc.vv.pwd = strPsw;
        var yanzhengma = this._editVerify.$EditBox.string;
        var data = {
            szMobile: cc.vv.phone,
            szPassword: cc.vv.pwd,
            szCode: yanzhengma,
            szAlias: 0,
            szHeadIco: 0,
            iSex: 0,
        }
        cc.vv.socket.send("regphone", data);
    },

    GetYanZhengMa: function (event, arg) {
        cc.vv.audioMgr.playSFX("dian.mp3");
        if ('' == this._editPhone.$EditBox.string) {
            this.showAlert("请输入手机号!");
            return;
        }

        this._labTime.$Label.string = 60;
        this._btVertify.active = false;
        this.schedule(this._timeSchedule.bind(this), 1);

        var phoneNumber = this._editPhone.$EditBox.string;
        cc.vv.socket.send("getsmscode", {
            szMobile: phoneNumber
        });

    },

    _timeSchedule : function () {
        var time = parseInt(this._labTime.$Label.string);
        time--;
        this._labTime.$Label.string = time;
        if (time <= 0) {
            this.unschedule(this._timeSchedule);
            this._btVertify.active = true;
            this._labTime.$Label.string = 60;
        }
    },

    onShowView: function () {
        this._btVertify.active = true;
    },

    onHideView: function () {
        if (this.m_Hook.m_nodeFrame) {
            this.m_Hook.m_nodeFrame.active = true;
        }
    }
    // update (dt) {},
});