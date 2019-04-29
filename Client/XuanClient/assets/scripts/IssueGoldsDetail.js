
cc.Class({
    extends: cc.Component,

    properties: {
        timeline: { default: null, type: cc.Label },
        leftBtn: { default: null, type: cc.Button },
        rightBtn: { default: null, type: cc.Button },
        ScrillPanel: { default: null, type: cc.Node },
        DetailItem: { default: null, type: cc.Node },

        _data: null,
        _curDateArrIndex: 0,
        _curDayArrIndex: 0,
        _dateScript: null,
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad() {
        this._dateScript = this.node.getChildByName("DateNode").getComponent("DateComponent");
        this._dateScript._parentScript = this;
    },

    start() {

    },

    OnDateClick: function () {
        this.node.getChildByName("DateNode").active = true;
    },

    ActiveIssueDetail: function (data) {
        this._data = data;
        
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
        cc.vv.net.send("issuegoldlist", { clubid: this._data.rows[this._curDateArrIndex].clubid, ymd: str, page: 1 });
    },

    GetCurindexByDate: function (year,month,day) {
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
        for (var i = 1; i < this.DetailItem.parent.children.length; i++) {
            this.DetailItem.parent.children[i].destroy();
        }
    },

    InitDetail: function (data) {
        this.ClearDetail();
        for (var i = 0; i < data.length; i++) {
            var item = cc.instantiate(this.DetailItem);
            item.parent = this.DetailItem.parent;
            item.getChildByName("sender").getComponent(cc.Label).string = data[i].sender;
            item.getChildByName("receiver").getComponent(cc.Label).string = data[i].recver;
            item.getChildByName("number").getComponent(cc.Label).string = data[i].golds;
            item.active = true;
        }
        this.DetailItem.parent.height = this.DetailItem.height * data.length;
    },
    
    // update (dt) {},
});
