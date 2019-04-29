cc.Class({
    extends: cc.BaseClass,

    properties: {
    },

    ctor() {
        this.events = ["getclubphb_result"];
    },

    onLoad() {
        cc.vv.socket.addHandlers(this.events, this);
    },

    onShowView: function () {
        cc.vv.socket.send("getclubphb", null);
        this.node.zIndex = 1;
    },

    onBtSearchClub: function (event, arg) {
        this.onBtSound();
        var data = {
            szName:this._editClubID.$EditBox.string,
        };
        cc.vv.socket.send("searchgclubinfo", data);
    },

    OnBtCLub: function (event, arg) {
        this.onBtSound();
        var data = {
            szName: event.target.customData.iClubId,
        };
        cc.vv.socket.send("searchgclubinfo", data);
    },

    getclubphb_result: function (data) {
        if (data.wErrCode == 0) {
            for (var i in this._content.children) {
                this._content.children[i].active = false;
            }

            for (var i = 0; i < data.pItems.length; i++) {
                var item = this._content.children[i] || cc.instantiate(this._content.children[0]);
                var _info = data.pItems[i];
                item.parent = this._content;
                var js = this.bindThor(item);
                js._head.$LoadImage.LoadClubIcon(_info.iClubId);
                js._name.$Label.string = _info.szName; // name
                js._rennumber.$Label.string = _info.iTotalNum + "/" + _info.iMaxNum;

                item.customData = {
                    'iLevels':_info.iLevels,
                    'iClubId':_info.iClubId,
                }
                item.active = true;
            }
        } else {
            this.showAlert(data.szErrMsg);
        }
    },

});
