cc.Class({
    extends: cc.BaseClass,

    properties: {},

    onShowView: function () {
        this.node.zIndex = 3;
    },


    setView: function (data) {

        for (var i in this._content.children) {
            this._content.children[i].active = false;
        }

        for (var i = 0; i < data.rows.length; i++) {
            var item = this._content.children[i] || cc.instantiate(this._content.children[0]);
            item.parent = this._content;
            var js = this.bindThor(item);
            js._name.$Label.string = data.rows[i].alias;
            js._head.$LoadImage.LoadUserIcon(data.rows[i].userid);
            js._month.$Label.string = data.rows[i].yuejushu;
            js._total.$Label.string = data.rows[i].zongjushu;
            js._creator.active = data.rows[i].clublevel == 0;
            js._mgr.active = data.rows[i].clublevel == 1;
            js._score.$Label.string = parseInt(data.rows[i].changjun);

            if (data.rows[i].online) {
                js._lasttime.color = new cc.Color(60, 255, 60);
                js._lasttime.$Label.string = "在线";
            } else {
                js._lasttime.color = new cc.Color(100, 100, 100);
                js._lasttime.$Label.string = cc.vv.gameNetMgr.GetStrByNowFrameDate(data.rows[i].lastlogintime);
            }

            item.customData = {
                'userid': data.rows[i].userid,
                'forsearch': data.rows[i].forsearch ||
                    ("'" + data.rows[i].userid + "'" + "'" + data.rows[i].alias + "'"),
                'detail': data.rows[i]
            }

            item.active = true;
        }
    },

    onBtUser: function (tag, data) {
        // cc.vv.socket.send("getuserginfo", {
        //     iUserId: tag.target.customData.userid
        // });
        this.m_Hook.showPrefab('DataCount', this.m_Hook._SecDLG, function (node) {
            node.$DataCount.setClubUser(tag.target.customData.detail);
        });
    },

    onBtSearch: function () {
        var str = this._searchInput.$EditBox.string;
        for (var i in this._content.children) {
            var forsearch = this._content.children[i].customData.forsearch;
            this._content.children[i].active = (str == '' ? true : (forsearch.indexOf(str) > 0));
        }
    },

});