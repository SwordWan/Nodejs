cc.Class({
    extends: cc.BaseClass,

    properties: {
        timeline: { default: null, type: cc.Label },
        leftBtn: { default: null, type: cc.Button },
        rightBtn: { default: null, type: cc.Button },
        DetailItem: { default: null, type: cc.Node },

        _data: null,
        _curDateArrIndex: 0,
        _curDayArrIndex: 0,
        _dateScript: null,
        _lastData:null,
    },

    // LIFE-CYCLE CALLBACKS:

    ctor () {
        this.events = ['zhanjidate_result', 'zhanjilist_result'];
    },

    onLoad() {
        this._dateScript = this.node.getChildByName("DateNode").getComponent("ZhanjiDateComponent");
        this._dateScript._parentScript = this;
        cc.vv.socket.addHandlers(this.events, this)
    },

    zhanjilist_result: function (data) {
        if (data.wErrCode == 0) {
            this.InitDetail(data.rows);
        } else {
            this.showAlert(data.szErrMsg);
        }
    },

    zhanjidate_result: function (data) {
        if (data.rows.length == 0) {
            this._timeline.$Label.string = cc.vv.gameNetMgr.dateFormatDay(null);
        }
        this._labTotalCnt.$Label.string = data.iGameTimes;
        this._labTotalHands.$Label.string = data.iPlayTimes;
        this.ActiveIssueDetail(data);
        this.node.active = true;
    },

    onShowView: function () {
        cc.vv.socket.send("zhanjidate", {});
    },

    OnDateClick: function () {
        this.node.getChildByName("DateNode").active = true;
    },

    ActiveIssueDetail: function (data) {
        this._data = data;
        if (this._data.rows.length == 0) {
            return;
        }

        for (var i = 0; i < this._data.rows.length; i++) {
            this._data.rows[i].dt = JSON.parse(this._data.rows[i].dt);
        }
        this._curDateArrIndex = 0;
        this._curDayArrIndex = this._data.rows[this._curDateArrIndex].dt.length - 1;
        this.InitDateList();
    },

    OnLeftBtn: function (event, arg) {
        if (this._data.rows.length == 0)
            return;
        this._curDayArrIndex--;
        if (this._curDayArrIndex == -1) {
            this._curDateArrIndex--;
            if (this._curDateArrIndex == -1) {
                this._curDateArrIndex = 0;
                this._curDayArrIndex = 0;

            } else {
                this._curDayArrIndex = this._data.rows[this._curDateArrIndex].dt.length - 1;
            }
        }
        var arr = this._data.rows[this._curDateArrIndex].ym.split("-");
        this._dateScript.ChangeCurMonth(parseInt(arr[0]), parseInt(arr[1]));
        this.InitDateList();
    },

    OnRightBtn: function (event, arg) {
        if (this._data.rows.length == 0)
            return;
        this._curDayArrIndex++;
        if (this._curDayArrIndex == this._data.rows[this._curDateArrIndex].dt.length) {
            this._curDateArrIndex++;
            if (this._curDateArrIndex == this._data.rows.length) {
                this._curDateArrIndex--;
                this._curDayArrIndex--;
            } else {
                this._curDayArrIndex = 0;
            }
        }

        var arr = this._data.rows[this._curDateArrIndex].ym.split("-");
        this._dateScript.ChangeCurMonth(parseInt(arr[0]), parseInt(arr[1]));
        this.InitDateList();
    },

    InitDateList: function () {
        this.timeline.string = this._data.rows[this._curDateArrIndex].ym + "-" + this._data.rows[this._curDateArrIndex].dt[this._curDayArrIndex];
        var str = this._data.rows[this._curDateArrIndex].ym + this._data.rows[this._curDateArrIndex].dt[this._curDayArrIndex];
        console.log(str);
        str = str.replace("-", "");
        console.log(str);
        cc.vv.socket.send("zhanjilist", {ymd: str,});
    },

    GetCurindexByDate: function (year, month, day) {
        var ym = year + "-";
        if (month < 10) {
            ym += "0" + month;
        } else {
            ym += month;
        }
        var d = "";
        if (day < 10) {
            d = "0" + day;
        } else {
            d = "" + day;
        }
        for (var i = 0; i < this._data.rows.length; i++) {
            if (ym == this._data.rows[i].ym) {
                var ymd = this._data.rows[i];
                for (var j = 0; j < ymd.dt.length; j++) {
                    if (ymd.dt[j] == d) {
                        this._curDateArrIndex = i;
                        this._curDayArrIndex = j;
                        break;
                    }
                }
                break;
            }
        }
        this.InitDateList();
    },

    ClearDetail: function () {
        for (var i in this._content.children) {
            this._content.children[i].active = false;
        }
    },

    InitDetail: function (data) {
        this.ClearDetail();
        this._lastData = data;
        for (var i in data) {
            var item = this._content.children[i] || cc.instantiate(this._content.children[0]);
            var js = this.bindThor(item);
            item.parent = this._content;
            var details = JSON.parse(data[i].details);
            console.log(details);
            js._dipi.$Label.string = data[i].dipi + "/"+data[i].dipi * 2;
            js._shichang.$Label.string = data[i].shichang;
            js._roomname.$Label.string = data[i].roomname;
            js._clubname.$Label.string = "("+data[i].clubname+")";
            js._uuid.$Label.string = data[i].roomuuid;
            item.customData = i;
            details.userList.forEach(element => {
                if (element.userid == cc.vv.userMgr.userId) {
                    if (element.shuying > 0) {
                        js._winscore.active = true;
                        js._losescore.active = false;
                        js._winscore.$Label.string = "+"+element.shuying;
                    } else {
                        js._winscore.active = false;
                        js._losescore.active = true;
                        js._losescore.$Label.string = element.shuying;
                    }
                }
            });
            item.active = true;
        }
    },

    GetDataFromLastDataByRoomUUID: function (roomUUID) {
        for (var i = 0; i < this._lastData.length; i++) {
            if (this._lastData[i].roomuuid == roomUUID) {
                return this._lastData[i];
            }
        }
    },

    onBtRecordDetail: function (event, data) {
        this.onBtSound();
        this.m_Hook.showPrefab('RecordDetail', this.m_Hook._SecDLG, function (node) {
            node.$RecordDetail.setView(this._lastData[event.target.customData]);
        }.bind(this))
    },

    // update (dt) {},
});
