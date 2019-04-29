cc.Class({
    extends: cc.Component,
    properties: {
        account: null,
        userId: null,
        userName: null,
        lv: 0,
        exp: 0,
        coins: 0,
        bank:0,
        gems: 0,
        sign: 0,
        ip: "",
        sex: 0,
        iconUrl: "",
        iconSprite: null,
        roomData: null,
        buyItem: -1,
        agentid: -1,
        oldRoomId: null,
        zhuliid: -1,
        yaoqingren: null,
        upagentId: null,
        IsinitGcloudRoom: false,
        alertClubName:0,
        iRoomId: 0,
        iClubId: 0,
        isVIP: false,
        vipEndTime: null,
        bExistClubAlert: false,
        ChangeNamePay: 0,
        ChangeClubNamePay: 0,
        endTIme: 0,
        UUID_KEY:0,

        guanggaotime: 0,
        duiyouId:-1,
        duiyouInfos: null,
        userinfo:null,
        dic: new Array(),
        eventFunc:null,
        currentScene: null,
        loginUrl: "",

        _DUserIcon: null,
        _DClubIcon: null,
    },

    GetDefaultIcon: function () {
        var self = this;
        var url = cc.url.raw('resources/HeadPhoto/photo_club.png');
        cc.loader.load(url, function (err, tex) {
            var frame = new cc.SpriteFrame(tex, cc.Rect(0, 0, tex.width, tex.height));
            self._DClubIcon = frame;
        });

        var url2 = cc.url.raw('resources/NewAdd/usericon.png');
        cc.loader.load(url2, function (err, tex) {
            var frame = new cc.SpriteFrame(tex, cc.Rect(0, 0, tex.width, tex.height));
            self._DUserIcon = frame;
        });
    },

    guestAuth: function () {
        var account = cc.args["account"];
        if (account == null) {
            account = cc.sys.localStorage.getItem("account");
        }

        if (account == null) {
            account = Date.now();
            cc.sys.localStorage.setItem("account", account);
        }
        var isPw = "407704,./";
        cc.vv.http.sendRequest("/guest", { account: account, isPw: isPw }, this.onAuth);
    },

    onAuth: function (ret) {
        var self = cc.vv.userMgr;
        if (ret.errcode !== 0) {
            console.log(ret.errmsg);
        }
        else {
            self.account = ret.account;
            self.sign = ret.sign;
            self.loginUrl = cc.vv.http.url;
            cc.vv.http.url = "http://" + cc.vv.SI.hall;
            self.login();
        }
    },

    clearInfo:function()
    {
        cc.sys.localStorage.removeItem("wx_account");
        cc.sys.localStorage.removeItem("wx_sign");
        cc.vv.http.url = this.loginUrl;
    },


    login: function () {
        var self = this;
        var onLogin = function (ret) {
            if (ret.errcode != 0) {
                console.log(ret.errmsg);
                self.clearInfo();
            }
            else {
                if (!ret.userid) {
                    //jump to register user info.
                 
                    cc.director.loadScene("createrole");
                }
                else {
                    console.log(ret);
                    self.account = ret.account;
                    self.userId = ret.userid;
                    self.userName = ret.name;
                    self.lv = ret.lv;
                    self.exp = ret.exp;
                    self.coins = ret.coins;
                    self.gems = ret.gems;
                    self.bank = ret.bank;
                    self.roomData = ret.roomid;
                    self.sex = ret.sex;
                    self.ip = ret.ip;
                    self.yaoqingren = ret.yaoqingren;
                    self.buyItem = cc.sys.localStorage.getItem("shopitem");
                    self.agentid = ret.agentid;
                    self.zhuliid = ret.zhuliid;
                    cc.vv.gameNetMgr.preLoadMainScene = true;
                    self.GetUpAgentId();
                            //#write zzl GCloud
                            //cc.vv.anysdkMgr.onInitGCloud();
                            //var openId = "21446153215165431351";
                            // var test = "11111";
                            // var openId1 = cc.vv.mjutil.getOpenId(test);
                            // cc.vv.anysdkMgr.onInitGCloudRoom(openId1);
                            //var openId = cc.vv.mjutil.getOpenId(self.account);  // 语音  11.28
                            //console.log("js_____________get openId:"+openId); // 语音  11.28
                            //cc.vv.anysdkMgr.onInitGCloudRoom(openId); // 语音  11.28

                            
                            // console.log("js_____________get openId:"+openId);
                            // if(openId != -1){
                            //     cc.vv.anysdkMgr.onInitGCloudRoom(openId);
                            // }else{
                            //     console.log("js_____________openId error");
                            // }
                            cc.director.loadScene("hall");
                    }
                }
        };
        
        cc.vv.http.sendRequest("/login", { account: this.account, sign: this.sign }, onLogin);
    },

    GetUpAgentId: function ()
    {
        var self = this;
        var oncheckUserInfo = function (ret) {
            self.userinfo = ret;
            if (ret.upagent1 != 0)
            {
                self.upagentId = ret.upagent1;
            } else if (ret.upagent2 != 0) {
                self.upagentId = ret.upagent2;
            }
            else if (ret.upagent3 != 0) {
                self.upagentId = ret.upagent3;
            }
            else if (ret.upagent4 != 0) {
                self.upagentId = ret.upagent4;
            }
            else if (ret.upagent5 != 0) {
                self.upagentId = ret.upagent5;
            }
            console.log(self.upagentId+"..........");
        };

        cc.vv.http.sendRequest("/getUserInfo", { userId: cc.vv.userMgr.userId }, oncheckUserInfo);
    },

    create: function (name) {
        var self = this;
        var onCreate = function (ret) {
            if (ret.errcode !== 0) {
                console.log(ret.errmsg);
            }
            else {
                self.login();
            }
        };

        var data = {
            account: this.account,
            sign: this.sign,
            name: name
        };
        cc.vv.http.sendRequest("/create_user", data, onCreate);
    },

    

    enterRoom: function (roomId, callback, pwd, hallid,_oldRoomid) {
        var self = this;
        if ((_oldRoomid == null || _oldRoomid == 0) && cc.vv.gameNetMgr.lastJHRoom != 0)
        {
            _oldRoomid = cc.vv.gameNetMgr.lastJHRoom;
            cc.vv.gameNetMgr.lastJHRoom = 0;
        }

        var onEnter = function (ret) {
            if (ret.errcode !== 0) {
                if (ret.errcode == -1) {
                    setTimeout(function () {
                        if (callback != null)
                            self.enterRoom(roomId, callback(ret),pwd);
                    }, 300);
                }
                else {
                    console.log("进入房间失败：错误号:" + ret.errcode);
                    if (callback != null) {
                        callback(ret);
                    }
                }
            }
            else {
                if (callback != null) {
                    callback(ret);
                }
                cc.vv.gameNetMgr.connectGameServer(ret);
                cc.vv.gameNetMgr.isProxyRoom = ret.agentroom;
            }
        };

        var data = {
            account: cc.vv.userMgr.account,
            sign: cc.vv.userMgr.sign,
            roomid: roomId,
            pwd: pwd,
            hallid: hallid,
            oldRoomId:_oldRoomid,
        };
        cc.vv.http.sendRequest("/enter_private_room", data, onEnter);
    },


    reEnterRoom: function (roomId, callback) {
        var self = this;
        var onEnter = function (ret) {
            if (ret.errcode !== 0) {
                if (ret.errcode == -1) {
                    setTimeout(function () {
                        if (callback != null)
                            self.enterRoom(roomId, callback(ret));
                    }, 300);
                }
                else {
                    console.log("进入成功，执行回调");
                    if (callback != null) {
                        callback(ret);
                    }
                }
            }
            else {
                
                var call = function (ret)
                {
                    if (callback != null) {
                        callback(ret);
                    }
                    console.log("连接游戏服务器");
                    cc.vv.gameNetMgr.connectGameServer(ret);
                }
                call(ret);
                //setTimeout(call(ret), 500);
                cc.vv.gameNetMgr.isProxyRoom = ret.agentroom;
            }
        };

        var data = {
            account: cc.vv.userMgr.account,
            sign: cc.vv.userMgr.sign,
            roomid: roomId,
        };
        cc.vv.http.sendRequest("/enter_private_room", data, onEnter);
    },

});
