cc.Class({
    extends: cc.BaseClass,

    properties: {

    },

    ctor () {
    },

    onLoad () {
    },

    onShowView: function () {
        this._headicon.$LoadImage.LoadUserIcon(cc.vv.userMgr.userId);
        this._editName.$EditBox.string = cc.vv.userMgr.userName;
        this._labPay.$Label.string = "修改名称需要花费"+ cc.vv.userMgr.ChangeNamePay + "金币";
    },

    onBtOk: function (event, arg) {
        this.onBtSound();
        var name = this._editName.$EditBox.string;
        if (name == "") {
            this.showAlert("用户名不能为空");
            return;
        }
        var data = {
            iUserId: cc.vv.userMgr.userId,
            szAlias: name,
        };
        cc.vv.socket.send("chgalias", data);
    },

    onBtHead: function () {
        this.onBtSound();
        this._ChageHeadSprite.active = true;
    },

    setView: function (data) {
        if (data.wErrCode != 0) {
            this.showAlert(data.szErrMsg);
            return;
        }
        cc.vv.userMgr.userName = data.szAlias;
        cc.vv.userMgr.coins = data.iGolds;
        this.hideView();
        this.m_Upper.updateUserInfo();
    },


});
