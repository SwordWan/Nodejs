cc.Class({
    extends: cc.BaseClass,

    properties: {},

    // LIFE-CYCLE CALLBACKS:

    onLoad() {},

    setView: function (info) {
        console.log(info);
        var details = JSON.parse(info.details);
        console.log(details);
        this.roomuuid = info.roomuuid;
        this._roomName.$Label.string = info.roomname;
        this._clubName.$Label.string = "(" + info.clubname + ")";
        this._time.$Label.string = info.shichang / 60 + "h";
        this._dipi.$Label.string = info.dipi;
        this._hands.$Label.string = info.zongshoushu;
        this._bring.$Label.string = info.zongdairu;
        this._timestart.$Label.string = cc.vv.gameNetMgr.dateFormatHM(info.ctime);

        for (var i in this._content.children) {
            this._content.children[i].active = false;
        }

        var big = 0;
        var small = 0;
        var bigindex = 0;
        var smallindex = 0;
        var dairu = 0;
        var dairuIndex = 0;


        for (var j in details.userList) {
            var item = this._content.children[j] || cc.instantiate(this._content.children[0]);
            item.parent = this._content;
            var js = this.bindThor(item);

            item.parent = this._content;
            js._name.$Label.string = details.userList[j].alias + "(" + details.userList[j].userid + ")";
            js._dairu.$Label.string = "带入:" + details.userList[j].jifendr;
            js._clubname.$Label.string = details.userList[j].clubname;

            js._headicon.$LoadImage.LoadUserIcon(details.userList[j].userid);
            if (details.userList[j].jifendr > dairu) {
                dairu = details.userList[j].jifendr;
                dairuIndex = j;
            }
            if (details.userList[j].shuying > 0) {
                js._scoreying.active = true;
                js._scoreshu.active = false;
                js._scoreying.$Label.string = "+" + details.userList[j].shuying;
                if (details.userList[j].shuying > big) {
                    big = details.userList[j].shuying;
                    bigindex = j;
                }
            } else {
                js._scoreshu.active = true;
                js._scoreying.active = false;
                js._scoreshu.$Label.string = details.userList[j].shuying;
                if (details.userList[j].shuying < small) {
                    small = details.userList[j].shuying;
                    smallindex = j;
                }
            }
            item.active = true;
        }

        this._nameMVP.$Label.string = details.userList[bigindex].alias;
        this._iconMVP.$LoadImage.LoadUserIcon(details.userList[bigindex].userid);
        this._nameFish.$Label.string = details.userList[smallindex].alias;
        this._iconFish.$LoadImage.LoadUserIcon(details.userList[smallindex].userid);
        this._nameRich.$Label.string = details.userList[dairuIndex].alias;
        this._iconRich.$LoadImage.LoadUserIcon(details.userList[dairuIndex].userid);
    },

    onBtReview: function () {
        this.onBtSound();
        this.m_Hook.showPrefab('Review', this.m_Hook._SecDLG, function (node) {
            node.$Review.OpenPaiju(this.roomuuid);
        }.bind(this))
    },

});