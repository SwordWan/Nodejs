
cc.Class({
    extends: cc.Component,

    properties: {
        DayPre: { default: null, type: cc.Node },
        DayNone: { default: null, type: cc.Node },
        CurMonthLbl: { default: null, type: cc.Label },
        leftBtn: { default: null, type: cc.Node },
        rightBtn: { default: null, type: cc.Node },
        CurDayBg: { default: null, type: cc.SpriteFrame },
        weekParent: { default: null, type: cc.Node },

        _parentScript: null,
        _curYear: 0,
        _curMonth: 0,
        _curmaxyear: 0,
        _curmaxmonth: 0,
        _IsNow: false,
        _clickFunc: null,
        _lastbgDayNode:null,
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad() {
        var date = new Date();
        this._curmaxyear = this._curYear = date.getFullYear();
        this._curmaxmonth = this._curMonth = date.getMonth();
        this.rightBtn.getComponent(cc.Button).interactable = false;
        this._IsNow = true;
        this.SetDateLabel();
        this.MakeAllDayByMonth();
    },

    start() {

    },

    SetDateLabel: function () {
        this.CurMonthLbl.string = this._curYear + "/" + (this._curMonth + 1);
    },

    ClearAllDay: function () {
        for (var j = 0; j < this.weekParent.children.length; j++) {
            this.weekParent.children[j].destroy();
        }
    },

    MakeAllDayByMonth: function () {
        this.ClearAllDay();
        for (var i = 1; i < 32; i++) {
            var d = new Date(this._curYear, this._curMonth, i);
            if (d.getMonth() != this._curMonth) {
                return;
            }
            var curDay = d.getDay();
            if (i == 1) {
                if (curDay < 7) {
                    for (var j = curDay - 1; j >= 0; j--) {
                        var none = cc.instantiate(this.DayNone);
                        none.parent = this.weekParent;
                        none.active = true;
                    }
                }
            }
            var item = cc.instantiate(this.DayPre);
            item.parent = this.weekParent;
            item.name = "d" + i;
            item.getChildByName("day").getComponent(cc.Label).string = i;
            item.active = true;
        }
        this.scheduleOnce(function () {
            this.HighLightDayBtn();
        }, 0.1);
    },

    LeftBtn: function () {
        this._curMonth -= 1;
        if (this._curMonth == -1) {
            this._curMonth = 11;
            this._curYear -= 1;
        }
        this.SetDateLabel();
        if (this._IsNow) {
            this._IsNow = false;
            this.rightBtn.getComponent(cc.Button).interactable = true;
        }
        this.MakeAllDayByMonth();
    },

    RightbBtn: function () {
        this._curMonth += 1;
        if (this._curMonth == 12) {
            this._curMonth = 0;
            this._curYear += 1;
        }
        if (this._curYear == this._curmaxyear && this._curMonth == this._curmaxmonth) {
            this._IsNow = true;
            this.rightBtn.getComponent(cc.Button).interactable = false;
        }
        this.SetDateLabel();

        this.MakeAllDayByMonth();
    },

    CloseDateFrame: function () {
        this.node.active = false;
    },

    HighLightDayBtn: function () {
        var ym = this._curYear + "-";
        if (this._curMonth < 10) {
            ym += "0" + (this._curMonth + 1);
        } else {
            ym += (this._curMonth + 1);
        }
        var info = null;
        for (var i = 0; i < this._parentScript._data.rows.length; i++) {
            if (ym == this._parentScript._data.rows[i].ym) {
                info = this._parentScript._data.rows[i];
                break;
            }
        }
        if (info != null) {
            for (var i = 0; i < info.dt.length; i++) {
                var Day = info.dt[i];
                Day = parseInt(Day);
                console.log(this.weekParent.getChildByName("d"+Day));
                this.weekParent.getChildByName("d"+Day).children[1].color = new cc.Color(255, 255, 255, 255);
            }
        }
    },

    ChangeCurMonth: function (year, month) {
        this._curYear = year;
        this._curMonth = month-1;
    },


    OnDayClick: function (event, arg) {
        console.log(event.target.children[1].color.r);
        if (event.target.children[1].color.r != 255) {
            return;
        }
        //console.log(this._curYear + "-" + (this._curMonth + 1) + "-" + event.target.getChildByName("day").getComponent(cc.Label).string);
        var day = event.target.getChildByName("day").getComponent(cc.Label).string
        day = parseInt(day);
        this._parentScript.GetCurindexByDate(this._curYear, this._curMonth + 1, day);
        this.node.active = false;
        //if (this._clickFunc != null) {
        //    this._clickFunc(this._curYear, this._curMonth, day);
        //}
        if (this.CurDayBg != null) {
            if (this._lastbgDayNode != null) {
                this._lastbgDayNode.getChildByName("bg").active = false;
            }

            event.target.getChildByName("bg").getComponent(cc.Sprite).spriteFrame = this.CurDayBg;
            event.target.getChildByName("bg").active = true;
            this._lastbgDayNode = event.target;
        }
    },


    // update (dt) {},
});
