cc.Class({
    extends: cc.BaseClass,

    properties: {},

    ctor() {
        this.m_RequireItem = new Array();
        this.m_ResultItem = new Array();
    },

    onLoad() {
        this.m_nodeRequire = this._require;
        this.m_nodeResult = this._result;
    },

    onShowView: function () {
        this.onBtRefresh();
    },

    setView(data) {
        if (data.wErrCode == 0) {
            data = data.pRetObjs;

            for (var i in this._content.children) {
                this._content.children[i].active = false;
            }

            for (var i = 0; i < data.pUserObjs.length; i++) {
                var item = this.m_RequireItem[i] || cc.instantiate(this.m_nodeRequire);
                if (!this.m_RequireItem[i]) this.m_RequireItem.push(item);
                item.parent = this._content;
                var js = this.bindThor(item);
                js._roomname.$Label.string = data.pUserObjs[i].szRoomName;
                js._shenqingren.$Label.string = data.pUserObjs[i].szAlias;
                js._shenqingtime.$Label.string = cc.vv.gameNetMgr.dateFormatTimeHMS(data.pUserObjs[i].tmReqTime);
                js._info.$Label.string = "申请带入" + data.pUserObjs[i].iReqJiFen + ",总带入上限提升" + data.pUserObjs[i].iReqJiFen;
                js._memo.$Label.string = data.pUserObjs[i].szText;
                js._dairu.$Label.string = data.pUserObjs[i].iReqJiFen;
                var sliderCtrl = item.getChildByName("sliderzuixiaodairu").getComponent("SliderControl");
                var _minfen = data.pUserObjs[i].iMinFenE;
                sliderCtrl._intervalFunc = function (label, arg) {
                    label.string = _minfen * (arg + 1);
                    console.log(js._dairu.$Label.string);
                }.bind(this, js._dairu.$Label)

                item.customData = {
                    'shenqingrenid': data.pUserObjs[i].iUserId,
                    'clubid': data.pUserObjs[i].iClubId,
                    'roomid': data.pUserObjs[i].iRoomId,
                    'uuid': data.pUserObjs[i].szRoomUUID,
                    'uid': data.pUserObjs[i].iUid
                }

                item.active = true;
            }

            for (var i = 0; i < data.pLogs.length; i++) {
                var item = this.m_ResultItem[i] || cc.instantiate(this.m_nodeResult);
                if (!this.m_ResultItem[i]) this.m_ResultItem.push(item);
                item.parent = this._content;
                var js = this.bindThor(item);
                js._roomname.$Label.string = data.pLogs[i].szRoomName;
                js._shenqingren.$Label.string = data.pLogs[i].szReqAlias;
                js._time.$Label.string = cc.vv.gameNetMgr.dateFormatTimeHMS(data.pLogs[i].tmTime);
                js._info.$Label.string = data.pLogs[i].szMessage;
                item.active = true;
            }
            this._ScrollView.$ScrollView.scrollToTop();
        } else {
            console.log(data.szErrMsg);
        }
    },

    onBtAgree: function (event, arg) {
        this.onBtSound();

        var js = this.bindThor(event.target.parent);
        var data = js.node.customData;
        var clubid = data.clubid;
        var roomid = data.roomid;
        var uuid = data.uuid;
        var userid = data.shenqingrenid;
        var uid = data.uid;
        var jifen = js._dairu.$Label.string;

        var data = {
            iMode: arg == '1' ? true : false,
            iClubId: clubid,
            iUserId: userid,
            iRoomId: roomid,
            szRoomUUID: uuid,
            iJiFen: jifen,
            iUid: uid,
        }
        cc.vv.socket.send("addjifenrep", data);
        js.node.active = false;
    },

    onBtRefresh: function () {
        cc.vv.socket.send("getaddjfusers", {
            iRoomId: 0
        });
        if (this.m_Hook.m_nodeGameList) {
            this.m_Hook.m_nodeGameList.$GameList._red_dot.active = false;
        }
        if (this.m_Hook.m_nodeRequireEnter) {
            this.m_Hook.m_nodeRequireEnter.$RequireEnter._red_dot.active = false;
        }
    },

    addjifenrep_result: function (data) {
        if (data.wErrCode == 0) {} else {
            this.showAlert(data.szErrMsg);
        }
    },


    // update (dt) {},
});