function PopSeatUserInfo()
{
    var obj = new Object;
    obj.bg = null;
    obj.userid = null;
    obj.headimage = null;
    obj.name = null;
    obj.tongyi = null;
    obj.jujie = null;
    obj.dengdai = null;
    obj.init = function (bg)
    {
        obj.bg = bg;
        if (bg)
        {
            obj.headimage = bg.getChildByName("headimage");
            obj.name = bg.getChildByName("name");
            obj.tongyi = bg.getChildByName("tongyi");
            obj.jujie = bg.getChildByName("jujie");
            obj.dengdai = bg.getChildByName("dengdai");
        }
    }
    obj.Reset = function ()
    {
        if (obj.tongyi)
            obj.tongyi.active = false;
        if (obj.jujie)
            obj.jujie.active = false;
        if (obj.dengdai)
            obj.dengdai.active = false;
    }
    obj.setState = function (str) {
        obj.Reset();
        if (str == "tongyi") {
            if (obj.tongyi)
                obj.tongyi.active = true;
        }
        else if (str == "jujue") {
            if (obj.jujie)
                obj.jujie.active = true;
        }
        else if (str == "dengdai") {
            if (obj.dengdai)
            obj.dengdai.active = true;
        }
    }
    return obj;
}

cc.Class({
    extends: cc.Component,

    properties: {
        // foo: {
        //    default: null,
        //    url: cc.Texture2D,  // optional, default is typeof default
        //    serializable: true, // optional, default is true
        //    visible: true,      // optional, default is true
        //    displayName: 'Foo', // optional
        //    readonly: false,    // optional, default is false
        // },
        // ...
        _popuproot: null,
        _settings: null,
        _dissolveNotice: null,

        _endTime: -1,
        _extraInfo: null,
        _noticeLabel: null,
        _ResUserinfo: [],
        sqjsfj: null,
        heardkuang:null,
    },

    // use this for initialization
    onLoad: function () {
        if (cc.vv == null) {
            return;
        }
               this.usrIdcancel = [];
            this.usrIdagree = [];
        cc.vv.popupMgr = this;

        var tiem = cc.find("Canvas/popups/dissolve_notice/bar");
        if (tiem)
            this._timeBarProgressBar = tiem.getComponent(cc.ProgressBar);
        this.userListImageLayout = cc.find("Canvas/popups/dissolve_notice/userList");
        this.fromUser = cc.find("Canvas/popups/dissolve_notice/fromuser");


        this.notionjujue = cc.find("Canvas/popups/dissolve_notice/jujue");

        this._popuproot = cc.find("Canvas/popups");
        this._settings = cc.find("Canvas/popups/settings");
        this._dissolveNotice = cc.find("Canvas/popups/dissolve_notice");
       // this._noticeLabel = this._dissolveNotice.getChildByName("info").getComponent(cc.Label);

        this.sqjsfj = cc.find("Canvas/popups/settings/btn_sqjsfj");
        this.sqjsfj.active = false;
        this.closeAll();
        if (this._dissolveNotice) {
            this.btn_agree = this._dissolveNotice.getChildByName('btn_agree');
            this.btn_reject = this._dissolveNotice.getChildByName('btn_reject');
        }

        this.addBtnHandler("settings/btn_close");
        this.addBtnHandler("settings/btn_sqjsfj");
        this.addBtnHandler("dissolve_notice/btn_agree");
        this.addBtnHandler("dissolve_notice/btn_reject");
        this.addBtnHandler("dissolve_notice/jujue/btnok");
       // this.addBtnHandler("dissolve_notice/btn_ok");

        var self = this;
        this.node.on("dissolve_notice", function (event) {
            var data = event.detail;

            self.showDissolveNotice(data);

        });

        var self = this;
        this.node.on("game_dissolve", function (event) {
            var data = event.detail;
            self.showDissolveNotice(data);
        });

        this.node.on("dissolve_cancel", function (event) {
            var data = event.detail;
            var num = self.GetPlayingUsersNum();
            if (data != null && data.jujueUsers != null) {
                var len = data.jujueUsers.length;
                var bili = len/num;

                if (bili >= 0.5)
                {
                    if (self.notionjujue)
                    {
                        self.notionjujue.active = true;
                    }
                }
            }
        });
        //console.log("cc.vv.gameNetMgr.conf.gameType......." + JSON.stringify(cc.vv.gameNetMgr.conf));
        //if (cc.vv.gameNetMgr.conf.gameType == 1) {
        //    this.sqjsfj.active = false;
        //}
        //初始化网络事件监听器
        var self = this;
        this.node.on('game_end', function (data) {
            self._popuproot.active = false;
        });

        this.node.on('game_sync', function (data) {
            if (cc.vv.gameNetMgr.gamedissolvedata == null)
                self._popuproot.active = false;
        });


        cc.loader.loadRes("prefabs/heardkuang", function (err, prefab) {
            self.heardkuang = prefab;
            if (self.heardkuang == null) { 
                console.log("error:资源加载失败--prefabs/heardkuang");
            } else
            {
                if (cc.vv.gameNetMgr.dissoveData) {
                    self.showDissolveNotice(cc.vv.gameNetMgr.dissoveData);
                }
            }
        });

    },


    GetPlayingUsersNum: function ()
    {
        var seats = cc.vv.gameNetMgr.seats;
        var count = 0;
        for (var i = 0; i < seats.length; i++)
        {
            if (seats[i].userid > 0)
            {
                count++;
            }
        }
        return count;
    },


    start: function () {
      
    },

    addBtnHandler: function (btnName) {
        var btn = cc.find("Canvas/popups/" + btnName);
        this.addClickEvent(btn, this.node, "PopupMgr_Cow", "onBtnClicked");
    },

    addClickEvent: function (node, target, component, handler) {
        var eventHandler = new cc.Component.EventHandler();
        eventHandler.target = target;
        eventHandler.component = component;
        eventHandler.handler = handler;

        var clickEvents = node.getComponent(cc.Button).clickEvents;
        clickEvents.push(eventHandler);
    },


    onBtnClicked: function (event) {
    //    this.closeAll();
        var btnName = event.target.name;
        if (btnName == "btn_agree") {
            cc.vv.net.send("dissolve_agree");
        }
        else if (btnName == "btn_reject") {
            cc.vv.net.send("dissolve_reject");
        }
        else if (btnName == "btn_sqjsfj") {       
            cc.vv.net.send("dissolve_request");
        }
        else if (btnName == "btn_close") {
            this.closeAll();
        }
        else if (btnName == "btnok") {
            this.closeAll();
            this.notionjujue.active = false;
        }
    },

    closeAll: function () {
        this._popuproot.active = false;
        this._settings.active = false;
        this._dissolveNotice.active = false;
    },

    showSettings: function () {
        this.closeAll();
        this._popuproot.active = true;
        this.showUserInfo();
        this._settings.active = true;

        if ((cc.vv.gameNetMgr.gamestate != "" && cc.vv.gameNetMgr.numOfGames == 0) || cc.vv.gameNetMgr.numOfGames >= 1 && (cc.vv.gameNetMgr.conf.type == cc.vv.gameNetMgr.FKNIU_GAME || cc.vv.gameNetMgr.conf.type == cc.vv.gameNetMgr.FK_JINHUA)) {
            this.sqjsfj.active = true;
        }
        else
        {
            this.sqjsfj.active = false;
        }
    },

    showUserInfo: function ()
    {
        if (this.userListImageLayout) {
            var num = 0;
            if (cc.vv.gameNetMgr.seats != null) {

                for (var i = 0; i < cc.vv.gameNetMgr.seats.length; i++)
                {
                    if (cc.vv.gameNetMgr.seats[i].userid != 0)
                    {
                        num++;
                    }
                }
            }
                //num = cc.vv.gameNetMgr.seats.length;
            if (num == 0)
                return;
            var layout = this.userListImageLayout.getComponent(cc.Layout);
            if (layout) {
                var width = layout.node.width;
                layout.spacingx = 20;
                var spacingx = layout.spacingx;
                var userkuantprefab = cc.instantiate(this.heardkuang);
                var spacingxl = (width - (spacingx * (num - 1) + (userkuantprefab.width * num))) / 2;
                layout.paddingLeft = spacingxl;
            }

            if (this.userListImageLayout.childrenCount < num)
            {
                for (var i = 0; i < num; i++) {
                    var userkuantprefab = cc.instantiate(this.heardkuang);
                    if (userkuantprefab) {
                        this.userListImageLayout.addChild(userkuantprefab);
                        this.userListImageLayout.children[i].y = 0;

                        var temp = PopSeatUserInfo();
                        temp.init(userkuantprefab);

                        this._ResUserinfo.push(temp);
                    }
                }
            }
        }
    },

    showDissolveRequest: function () {
        this.closeAll();
        this._popuproot.active = true;
    },

    showDissolveNotice: function (data) {
        this.showUserInfo();
        console.log('showDissolveNotice');
        console.log(data);
        this.Alltime = 300;
        this._endTime = Date.now() / 1000 + data.time;
    
        this.closeAll();

        this._popuproot.active = true;

        this._dissolveNotice.active = true;

        
        if (data.tongyiUsers.length == 1 && data.jujueUsers.length == 0 && this.notionjujue.active) // 防止有玩家未点击拒绝确定按钮  新的解散请求再次发送的情况
        {
            this.notionjujue.active = false;
        }
    },

    // called every frame, uncomment this function to activate update callback
    update: function (dt) {
        if (this._endTime > 0) {
            var lastTime = this._endTime - Date.now() / 1000;
            if (lastTime < 0) {
                this._endTime = -1;
            }
            var bilitime = (lastTime / this.Alltime) * 1;

            if (this._timeBarProgressBar)
                this._timeBarProgressBar.progress = bilitime;

            //var m = Math.floor(lastTime / 60);
            //var s = Math.ceil(lastTime - m * 60);
            //var str = "";
            //if (m > 0) {
            //    str += m + "分";
            //}
            //   this._noticeLabel.string = str + s + "秒后房间将自动解散" + this._extraInfo;
        }
        if (cc.vv.gameNetMgr.gamedissolvedata != null && this.heardkuang != null) {
            var seats = cc.vv.gameNetMgr.seats;
            var data = cc.vv.gameNetMgr.gamedissolvedata;
            this.showDissolveNotice(data);
            var tongyiOrjujielist = data;
            if (this.fromUser) {
                var fromUserLabel = this.fromUser.getComponent(cc.Label);
                if (fromUserLabel) {
                    for (var k in seats) {
                        if (seats[k].userid == tongyiOrjujielist.fromUser) {
                            var namestr = seats[k].name.substring(0,4);

                            fromUserLabel.string = "玩家" + namestr + "申请解散房间，全部玩家同意后房间将解散";
                        }
                    }
                }
            }
            var isMe = false;
            //同意
            var resindex = 0;
            for (var i = 0; i < tongyiOrjujielist.tongyiUsers.length; i++) {
                if (tongyiOrjujielist.tongyiUsers[i] == cc.vv.userMgr.userId) {
                    isMe = true;
                }
                if (this._ResUserinfo != null) {
                    this._ResUserinfo[resindex].userid = tongyiOrjujielist.tongyiUsers[i];
                    this._ResUserinfo[resindex].setState("tongyi");

                    var label = this._ResUserinfo[resindex].name.getComponent(cc.Label);

                    if (label) {
                        label.string = this.getUserName(tongyiOrjujielist.tongyiUsers[i]);
                    }
                    //if (cc.vv.gameNetMgr.userIcons != null && cc.vv.gameNetMgr.userIcons[this._ResUserinfo[resindex].userid].node != null) {
                    var s = this._ResUserinfo[resindex].headimage.getComponent(cc.Sprite);
                    s.spriteFrame = cc.vv.gameNetMgr.userIcons[this._ResUserinfo[resindex].userid].node.getComponent(cc.Sprite).spriteFrame;
                    s.node.width = 100;
                    s.node.height = 100;
                    //}
                    resindex++;
                }
            }
            //拒绝
            for (var j = 0; j < tongyiOrjujielist.jujueUsers.length; j++) {
                if (tongyiOrjujielist.jujueUsers[j] == cc.vv.userMgr.userId) {
                    isMe = true;
                }
                if (this._ResUserinfo != null) {
                    this._ResUserinfo[resindex].userid = tongyiOrjujielist.jujueUsers[j];
                    this._ResUserinfo[resindex].setState("jujue");

                    var label = this._ResUserinfo[resindex].name.getComponent(cc.Label);
                    if (label) {
                        label.string = this.getUserName(tongyiOrjujielist.jujueUsers[j]);
                    }
                    //if (cc.vv.gameNetMgr.userIcons != null && cc.vv.gameNetMgr.userIcons[this._ResUserinfo[resindex].userid].node != null){
                        var s = this._ResUserinfo[resindex].headimage.getComponent(cc.Sprite);
                        s.spriteFrame = cc.vv.gameNetMgr.userIcons[this._ResUserinfo[resindex].userid].node.getComponent(cc.Sprite).spriteFrame;
                        s.node.width = 100;
                        s.node.height = 100;
                    //}
                    resindex++;
                }
            }
            var tempuser = tongyiOrjujielist.jujueUsers;
            for (var i = 0; i < tongyiOrjujielist.tongyiUsers.length; i++) {
                tempuser.push(tongyiOrjujielist.tongyiUsers[i]);
            }

            var dengdaiUser = [];
            var tempseat = [];

            for (var pp = 0; pp < seats.length; pp++)
            {
                tempseat.push(seats[pp].userid);
            }

            for (var t = 0; t < tempuser.length; t++)
            {          
                if (tempseat.indexOf(tempuser[t]) != -1) {
                    for (var ppp = 0; ppp < tempseat.length; ppp++) {
                        if (tempuser[t] == tempseat[ppp]) {
                            tempseat.splice(ppp, 1);
                        }
                    }
                }               
            }
            //等待中
            dengdaiUser = tempseat;
            var index = 0;
            for (; resindex < seats.length; resindex++) {
                if (dengdaiUser[index] == 0) continue;
                this._ResUserinfo[resindex].userid = dengdaiUser[index];
                this._ResUserinfo[resindex].setState("dengdai");
               // if (cc.vv.gameNetMgr.userIcons != null && cc.vv.gameNetMgr.userIcons[this._ResUserinfo[resindex].userid].node != null) {
                    var s = this._ResUserinfo[resindex].headimage.getComponent(cc.Sprite);
                    s.spriteFrame = cc.vv.gameNetMgr.userIcons[this._ResUserinfo[resindex].userid].node.getComponent(cc.Sprite).spriteFrame;
                    s.node.width = 100;
                    s.node.height = 100;
                //}
                var label = this._ResUserinfo[resindex].name.getComponent(cc.Label);
                if (label) {
                    label.string = this.getUserName(dengdaiUser[index]);
                }
                index++;
            }

            if (this.btn_agree) {
                this.btn_agree.active = !isMe;
            }
            if (this.btn_reject) {
                this.btn_reject.active = !isMe;
            }
            cc.vv.gameNetMgr.gamedissolvedata = null;
           
            if ((tongyiOrjujielist.tongyiUsers.length -1) / cc.vv.gameNetMgr.seats.length >= 0.5) {
                this.closeAll();
            }
        }
    },
    getUserName: function (userid)
    {
        for (var p = 0; p < cc.vv.gameNetMgr.seats.length; p++) {
            if (cc.vv.gameNetMgr.seats[p].userid == userid) {
                return cc.vv.gameNetMgr.seats[p].name;
            }
        }
    },

    onDestroy: function () {
        this._popuproot.active = false;
        this._dissolveNotice.active = false;
    }
});
