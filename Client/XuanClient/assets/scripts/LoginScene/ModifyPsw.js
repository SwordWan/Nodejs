cc.Class({
    extends: cc.BaseClass,

    properties: {

    },

    onLoad () {

    },

    setPhone: function (phone) {
        this._GaimiPhone = phone;
    },

    OnGaiMiClick: function (event, arg) {
        cc.vv.audioMgr.playSFX("dian.mp3");
        var pwd = this._editNewPwd.$EditBox.string;
        var szyzm = this._editVerifity.$EditBox.string;
        var data = {
            szMobile: this._GaimiPhone,
            szPassword: pwd,
            szCode: szyzm,
        }
        cc.vv.socket.send("chgpassword", data);
    },

    onEventResult: function (data) {
        console.log(data);
        if (data.wErrCode == 0) {
            this.showAlert("修改密码成功！", 0, function () {
                this.hideView();
                this.m_Hook.m_nodeFrame.active = true;
            }.bind(this))
        } else {
            this.showAlert(data.szErrMsg);
        }
    },

    onEventHall: function (data) {
        console.log(data);
        if (data.wErrCode == 0) {
            this.showAlert("修改成功!请重新登录", 0, function () {
                cc.sys.localStorage.removeItem("UserName");
                cc.sys.localStorage.removeItem("UserPwd");
                console.log("清除用户信息");
                cc.vv.userMgr.userId = 0;
                cc.director.loadScene("login");
            }.bind(this))
        } else {
            this.showAlert(data.szErrMsg);
        }
    },
    

});