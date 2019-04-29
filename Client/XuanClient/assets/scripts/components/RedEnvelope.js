cc.Class({
    extends: cc.Component,

    properties: {
        yqmFrame: { default: null, type: cc.Node },
        yqmlbl: { default: null, type: cc.Label },
        gold: { default: null, type: cc.Label },
        cash: { default: null, type: cc.Label },
        quan: { default: null, type: cc.Label },
        jushu: { default: null, type: cc.Label },
        mianfei: { default: null, type: cc.Label },
        myyqm: { default: null, type: cc.Label },
        record: { default: null, type: cc.Node },
        myrank: { default: null, type: cc.Node },
        rank: { default: null, type: cc.Node },
        myqunrank: { default: null, type: cc.Node },
        otherqun: { default: null, type: cc.Node },
        shareFrame: { default: null, type: cc.Node },
        diany: { default: null, type: cc.Node },
        share: { default: null, type: cc.Node },
        //numofpp30: { default: null, type: cc.Label },
        //numofpp50: { default: null, type: cc.Label },
        newOne: { default: null, type: cc.Label },
        newTwo: { default: null, type: cc.Label },
        oldOne: { default: null, type: cc.Label },
        oldTwo: { default: null, type: cc.Label },

        _records: null,
        _ranks: null,
        _jietuTarget: null,
        _cashCount: 0,
        _quanCount: 0,
        

    },

    // use this for initialization
    onLoad: function () {
        this.myyqm.string = cc.vv.userMgr.userId;
        if (cc.vv.userMgr.yaoqingren != 0 && cc.vv.userMgr.yaoqingren != null)
        {
            this.yqmlbl.string = cc.vv.userMgr.yaoqingren;
        }
    },

    onEnable: function () {
        this.shareFrame.active = false;

        this.RefreshInfo();

        var url = cc.vv.http.url;
        cc.vv.http.url = "http://daili.qxtx78.com:808/ApiServer";

        var self = this;
        //var onRecordsBack = function (ret) {
        //    //self._records = ret;
        //    if (ret.data != null) {
        //        self.initRecords(ret.data);
        //    }
        //};

        //var onRanksback = function (ret) {
        //    if (ret.data != null) {
        //        self.initRanks(ret.data);
        //    }
        //};

        //var onQunRanksback = function (ret) {
        //    if (ret.data != null) {
        //        self.initQunRanks(ret.data);
        //    }
        //};

        var onFxmjRanks = function (ret) {
            //self._records = ret;
            if (ret.data != null) {
                self.initFxmjRanks(ret.data);
            }
        };

        var onFxmjPrizes = function (ret) {
            if (ret.data != null) {
                self.initFxmjPrizes(ret.data);
            }
        };
        //cc.vv.http.sendRequest("/GetGroupRedRanks", { userId: cc.vv.userMgr.userId }, onQunRanksback);

        //cc.vv.http.sendRequest("/GetRedRecords", { userId: cc.vv.userMgr.userId }, onRecordsBack);

        //cc.vv.http.sendRequest("/GetRedRanks", { userId: cc.vv.userMgr.userId }, onRanksback);

        cc.vv.http.sendRequest("/GetFxmjRanks", { userId: cc.vv.userMgr.userId }, onFxmjRanks);

        cc.vv.http.sendRequest("/GetFxmjPrizes", { userId: cc.vv.userMgr.userId }, onFxmjPrizes);

        cc.vv.http.url = url;

     
    },

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
    // 比赛排名
    initFxmjRanks: function (data) {
        for (var i = 2; i < this.myqunrank.parent.children.length; i++) {
            this.myqunrank.parent.children[i].destroy();
        }
        if (data == null)
            return;
        var flag = false;
        if (data.UserRank != null && data.UserRank.userid != null && data.RankList.length > 0 && data.UserRank.userid != data.RankList[0].userid) {

            this.myqunrank.getChildByName("name").getComponent(cc.Label).string = this.checkNameLength(data.UserRank.username);
            this.myqunrank.getChildByName("rank").getComponent(cc.Label).string = data.UserRank.rank;
            this.myqunrank.getChildByName("count").getComponent(cc.Label).string = data.UserRank.score;
            this.myqunrank.active = true;
            flag = true;
        }
        this.myqunrank.parent.height = data.RankList.length * 80 + 100;
        for (var i = 0; i < data.RankList.length; i++) {
            if (data.RankList[i].userid == cc.vv.userMgr.userId && flag)
                continue;
            var obj = cc.instantiate(this.otherqun);
            obj.parent = this.myqunrank.parent;
            obj.active = true;
            obj.getChildByName("name").getComponent(cc.Label).string = this.checkNameLength(data.RankList[i].username);
            obj.getChildByName("rank").getComponent(cc.Label).string = data.RankList[i].rank;
            obj.getChildByName("count").getComponent(cc.Label).string = data.RankList[i].score;
        }
    },

    checkNameLength: function (str)
    {
        if (str.length > 4) {
           str = str.substring(0, 3);
        }
        return str;
    },

    //获奖记录
    initFxmjPrizes: function (data) {

        for (var i = 2; i < this.rank.parent.children.length; i++) {
            this.rank.parent.children[i].destroy();
        }
        if (data == null)
            return;
        //if (data.UserRank != null && data.RankList.length > 0 && data.UserRank.userid != data.RankList[0].userid) {
        //    this.myrank.getChildByName("name").getComponent(cc.Label).string = data.UserRank.userid;
        //    this.myrank.getChildByName("rank").getComponent(cc.Label).string = data.UserRank.rank;
        //    this.myrank.getChildByName("quanzhu").getComponent(cc.Label).string = data.UserRank.adminuser;
        //    this.myrank.getChildByName("quangolds").getComponent(cc.Label).string = data.UserRank.admingolds;
        //    this.myrank.getChildByName("usergolds").getComponent(cc.Label).string = data.UserRank.usergolds;
        //    this.myrank.getChildByName("time").getComponent(cc.Label).string = data.UserRank.dtime;
        //    this.myrank.active = true;
        //}
        var count = 0;
        for (var j = 0; j < data.length; j++) {
            var d = data[j];
            //data = data[0];
            for (var i = 0; i < d.length; i++) {
                count += 1;
                var obj = cc.instantiate(this.rank);
                obj.parent = this.rank.parent;
                obj.active = true;
                obj.getChildByName("name").getComponent(cc.Label).string = this.checkNameLength(d[i].username);
                obj.getChildByName("rank").getComponent(cc.Label).string = d[i].rank;
                obj.getChildByName("quanzhu").getComponent(cc.Label).string = this.checkNameLength(d[i].adminname);
                obj.getChildByName("quangolds").getComponent(cc.Label).string = d[i].admingolds;
                obj.getChildByName("usergolds").getComponent(cc.Label).string = d[i].usergolds;
                obj.getChildByName("time").getComponent(cc.Label).string = d[i].dtime;
            }
        }
        this.rank.parent.height = count * 80 + 100;
    },

    initRecords: function (data)
    {
        for (var i = 1; i < this.record.parent.children.length; i++) {
            this.record.parent.children[i].destroy();
        }
        console.log(data.length);
        if (data.length > 5)
            this.record.parent.height = data.length * 80;
        for (var i = 0; i < data.length; i++) {
            var obj = cc.instantiate(this.record);
            obj.parent = this.record.parent;
            obj.active = true;
            var str = "抢到了" + data[i].typename + "" + data[i].rpackval;
            obj.getChildByName("index").getComponent(cc.Label).string = i+1;
            obj.getChildByName("detail").getComponent(cc.Label).string = str;
            obj.getChildByName("time").getComponent(cc.Label).string = data[i].rpacktime;
            console.log(str);
        }
        
    },

    initRanks: function (data) {

        for (var i = 2; i < this.rank.parent.children.length; i++)
        {
            this.rank.parent.children[i].destroy();
        }
        if (data.UserRank != null && data.RankList.length > 0 && data.UserRank.userid != data.RankList[0].userid) {
            this.myrank.getChildByName("name").getComponent(cc.Label).string = data.UserRank.username;
            this.myrank.getChildByName("rank").getComponent(cc.Label).string = data.UserRank.rank;
            this.myrank.getChildByName("count").getComponent(cc.Label).string = data.UserRank.lotterytotal;
            this.myrank.active = true;
        }
        this.rank.parent.height = data.RankList.length * 80 + 100;
        for (var i = 0; i < data.RankList.length; i++) {
            if (data.RankList[i].userid == cc.vv.userMgr.userId)
                continue;
            var obj = cc.instantiate(this.rank);
            obj.parent = this.rank.parent;
            obj.active = true;
            obj.getChildByName("name").getComponent(cc.Label).string = data.RankList[i].username;
            obj.getChildByName("rank").getComponent(cc.Label).string = data.RankList[i].rank;
            obj.getChildByName("count").getComponent(cc.Label).string = data.RankList[i].lotterytotal;
        }
    },
    initQunRanks: function (data) {
        for (var i = 2; i < this.myqunrank.parent.children.length; i++) {
            this.myqunrank.parent.children[i].destroy();
        }
        if (data.UserRank != null && data.RankList.length > 0 && data.UserRank.userid != data.RankList[0].userid) {
            this.myqunrank.getChildByName("name").getComponent(cc.Label).string = data.UserRank.userid;
            this.myqunrank.getChildByName("rank").getComponent(cc.Label).string = data.UserRank.rank;
            this.myqunrank.getChildByName("count").getComponent(cc.Label).string = data.UserRank.lotterytotal;
            this.myqunrank.active = true;
        }
        this.myqunrank.parent.height = data.RankList.length * 80 + 100;
        for (var i = 0; i < data.RankList.length; i++) {
            if (data.RankList[i].userid == cc.vv.userMgr.userId)
                continue;
            var obj = cc.instantiate(this.otherqun);
            obj.parent = this.myqunrank.parent;
            obj.active = true;
            obj.getChildByName("name").getComponent(cc.Label).string = data.RankList[i].userid;
            obj.getChildByName("rank").getComponent(cc.Label).string = data.RankList[i].rank;
            obj.getChildByName("count").getComponent(cc.Label).string = data.RankList[i].lotterytotal;
        }
    },

    RefreshInfo: function ()
    {
        var self = this;
        var oncheckUserInfo = function (ret) {
            self.gold.string = ret.qredptimes;
            self.cash.string = ret.cash / 100;
            self.quan.string = ret.lottery;
            self._cashCount = ret.cash / 100;
            self._quanCount = ret.lottery;
            //self.jushu.string = ret.RSpreaderSubNum;  // 推荐新人人数
            //self.numofpp30.string = ret.RSpreaderSubGT30;  // 新人满30局人数
            //self.numofpp50.string = ret.RSpreaderSubGT50;// 新人满50局人数
            //console.log("time" + ret.tmKFStop);
            if (ret.tmKFStop != null) {
                var date = new Date(ret.tmKFStop);
                self.mianfei.string = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate()+" "+ date.toLocaleTimeString();
            } else
                self.mianfei.string = "";
        };
        cc.vv.http.sendRequest("/getUserInfo", { userId: cc.vv.userMgr.userId }, oncheckUserInfo);
        
        var oncheckUserInfo2 = function (ret) {
			console.log("11111");
			console.log(ret);
			console.log("22222");
            self.newOne.string = ret.iRet1;
            self.newTwo.string = ret.iRet2;
            self.oldOne.string = ret.iRet3;
            self.oldTwo.string = ret.iRet4;
        };
        cc.vv.http.sendRequest("/getGTimes", { iUserId: cc.vv.userMgr.userId }, oncheckUserInfo2);
    },



    shareRed: function ()
    {

        //var size = this._jietuTarget.getContentSize();
        //var fileName = "shareRed.jpg";
        //var fullPath = jsb.fileUtils.getWritablePath() + fileName;
        //if (jsb.fileUtils.isFileExist(fullPath)) {
        //    jsb.fileUtils.removeFile(fullPath);
        //}
        //var texture = new cc.RenderTexture(Math.floor(size.width), Math.floor(size.height));
        ////texture.setPosition(cc.p(size.width / 2, size.height / 2));
        //texture.begin();
        //this._jietuTarget._sgNode.visit();
        //texture.end();
        //texture.saveToFile(fileName, cc.IMAGE_FORMAT_JPG);
        //cc.vv.anysdkMgr.onShareImg(fullPath, size.width, size.height);
        //console.log(fullPath);
        //this._jietuTarget._sgNode.active = false;

        this.shareFrame.getChildByName("bg").active = true;
        this.shareFrame.getChildByName("shareBtn").active = false;
        cc.vv.anysdkMgr.shareResult("redEnvelope.jpg");
        this.shareFrame.getChildByName("shareBtn").active = true;
        this.shareFrame.getChildByName("bg").active = false;
        this.shareFrame.active = false;
    },


    openShareFrame(event,arg)
    {
        if (arg == 0) {
            this.shareFrame.active = true;
            this.share.active = true;
            //if (this._jietuTarget) {
            //    this.share._sgNode.x = 439;
            //    this.share._sgNode.y = 80;
            //}
            this.share.getChildByName("cash").getComponent(cc.Label).string = this._cashCount + "元";
            this.diany.active = false;
            this._jietuTarget = this.share;
        } else
        {

            this.shareFrame.active = true;
            this.diany.active = true;
            //if (this._jietuTarget) {
            //    this.diany._sgNode.x = 439;
            //    this.diany._sgNode.y = 80;
            //}
            //this.diany._sgNode.active = true;
            this.share.active = false;
            this._jietuTarget = this.diany;
        }
    },

    closeShareFrame()
    {
        this.shareFrame.active = false;
    },

});
