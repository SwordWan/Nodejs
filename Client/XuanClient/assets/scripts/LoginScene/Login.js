String.prototype.format = function (args) {
    if (arguments.length > 0) {
        var result = this;
        if (arguments.length == 1 && typeof (args) == "object") {
            for (var key in args) {
                var reg = new RegExp("({" + key + "})", "g");
                result = result.replace(reg, args[key]);
            }
        } else {
            for (var i = 0; i < arguments.length; i++) {
                if (arguments[i] == undefined) {
                    return "";
                } else {
                    var reg = new RegExp("({[" + i + "]})", "g");
                    result = result.replace(reg, arguments[i]);
                }
            }
        }
        return result;
    } else {
        return this;
    }
};


cc.Class({
    extends: cc.BaseClass,

    properties: {
    },

    connect: function () {
        let events = [
            'regaccount_result',
            'loginin_result',
            'getsmscode_result',
            'regphone_result',
            'chgpassword_result',
            'connect',
            'disconnect'
        ];
        cc.vv.socket.addHandlers(events);
        this.AutoLogin();
    },


    disconnect: function () {
        this.showLoad();
        cc.vv.socket.reconnect();
    },

    // use this for initialization
    onLoad: function () {
        if (!cc.sys.isNative && cc.sys.isMobile) {
            var cvs = this.node.getComponent(cc.Canvas);
            cvs.fitHeight = true;
            cvs.fitWidth = true;
            // cc.vv.audioMgr.playBGM("bgMain.mp3");
        }

        this.showLoad();

        var username = cc.sys.localStorage.getItem("UserName");
        var userpwd = cc.sys.localStorage.getItem("UserPwd");
        if (null != username && '' != username) {
            this._editAcc.$EditBox.string = username;
            this._editPwd.$EditBox.string = userpwd;
        }


        var url;
        var version = this.node.getChildByName("version").getComponent(cc.Label);
        var hotUpdateSearchPaths = cc.sys.localStorage.getItem('HotUpdateSearchPaths');
        if (hotUpdateSearchPaths) {
            url = JSON.parse(hotUpdateSearchPaths)[0] + '/project.manifest';
        } else {
            url = cc.url.raw('resources/ver/project.manifest');
        }
        cc.loader.load(url, function (err, data) {
            var localInfo = JSON.parse(data);
            console.log(localInfo.version);
            version.string = "V:" + localInfo.version;
        });

        if (!cc.vv) {
            cc.director.loadScene("start");
            return;
        }

        cc.vv.gameNetMgr.connectGameServer();

        cc.vv.socket.connect(cc.vv.net.ip, this);
        if (cc.sys.isNative && cc.sys.isMobile) {
            cc.vv.anysdkMgr.startGPSClick();
        }
        cc.vv.userMgr.GetDefaultIcon();

        this.m_nodeFrame = this.node.getChildByName('Frame');
    },

    onDestroy: function () {
        cc.vv.socket.disconnect();
    },

    OnclickService: function () {

    },

    ShowFuwu: function () {
        this.node.getChildByName("ServiceDLG").active = true;
    },

    closeFrame: function (event, arg) {
        event.target.parent.active = false;
    },


    chgpassword_result: function (data) {
        if (this.m_nodeModifyPsw && 
            this.m_nodeModifyPsw.$ModifyPsw && 
            this.m_nodeModifyPsw.$ModifyPsw.onEventResult) {
                this.m_nodeModifyPsw.$ModifyPsw.onEventResult(data);
        }
    },
    AutoLogin: function () {
        var username,
            userpwd,
            iMode;

        if (cc.sys.isBrowser) {
            var fnGetPra = function (name) { //输入参数名称 
                var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i"); //根据参数格式，正则表达式解析参数 
                var r = window.location.search.substr(1).match(reg);
                if (r != null) return unescape(r[2]);
                return null; //返回参数值 
            }
            var AutoLogonAcc = fnGetPra("AAcc");
            if (AutoLogonAcc) {
                username = AutoLogonAcc;
                userpwd = fnGetPra("APsw");
                iMode = 1;
            }
        }
        if (username == null || username == '') {
            username = cc.sys.localStorage.getItem("UserName");
            userpwd = cc.sys.localStorage.getItem("UserPwd");
            iMode = 3;
        }

        cc.vv.phone = username;
        cc.vv.pwd = userpwd;

        if (username != null && username != "") {
            var data = {
                iMode: iMode, //1:账户不存在会创建  2  不会创建
                szAccount: username,
                szPassword: userpwd,
                szUUID_KEY: "",
            };
            cc.vv.socket.send("loginin", data);
        } else {
            this.hideLoad();
        }
    },

    getsmscode_result: function (data) {
        if (data.wErrCode == 0) {

        } else {
            this.showAlert(data.szErrMsg);
        }
    },
    regphone_result: function (data) {
        if (data.wErrCode == 0) {

        } else {
            this.showAlert(data.szErrMsg);
        }
    },

    regaccount_result: function (data) {
        console.log('regaccount_result');
        if (data.wErrCode == 0) {
            this.YoukeDenglu();
        } else {
            this.showAlert(data.szErrMsg);
        }
    },

    loginin_result: function (data) {
        if (data.wErrCode == 0) {

            // szAccount   szPassword
            if (undefined != cc.vv.phone && undefined != cc.vv.pwd) {
                cc.sys.localStorage.setItem("iMode", data.iMode.toString());
                cc.sys.localStorage.setItem("UserName", cc.vv.phone);
                cc.sys.localStorage.setItem("UserPwd", cc.vv.pwd);
            }

            cc.vv.userMgr.userId = data.iUserId;
            cc.vv.userMgr.coins = data.iGolds;
            cc.vv.userMgr.userName = data.szName;
            cc.vv.userMgr.coins = data.iGolds;
            cc.vv.userMgr.gems = data.iGems;
            cc.vv.userMgr.iRoomId = data.iRoomId;
            cc.vv.userMgr.iClubId = data.iRoomClubId;
            cc.vv.userMgr.isVIP = data.bIsVIP;
            cc.vv.userMgr.vipEndTime = data.tmVipEndTime;
            cc.vv.userMgr.bExistClubAlert = data.bExistClubAlert;
            cc.vv.userMgr.ChangeNamePay = data.iChgUserAliasGolds;
            cc.vv.userMgr.ChangeClubNamePay = data.iChgClubAliasGolds;
            cc.vv.userMgr.UUID_KEY = data.UUID_KEY;
            //cc.vv.userMgr.alertClubName = data.iChgClubAliasGolds;

            cc.director.loadScene("hall");
        } else {
            cc.sys.localStorage.removeItem("UserName");
            cc.sys.localStorage.removeItem("UserPwd");
            console.log("清除用户信息");
            this.hideLoad();
            this.showAlert(data.szErrMsg);
        }
    },

    start: function () {

        var account = cc.sys.localStorage.getItem("wx_account");
        var sign = cc.sys.localStorage.getItem("wx_sign");
        var newsign = cc.sys.localStorage.getItem("wx_newsign");;
        if (sign != null && sign != newsign) {
            cc.sys.localStorage.removeItem("wx_account");
            cc.sys.localStorage.removeItem("wx_sign");
            account = null;
            sign = null;
        }
        if (account != null && sign != null) {
            var ret = {
                errcode: 0,
                account: account,
                sign: sign,
            }
            cc.vv.userMgr.onAuth(ret);
        }
    },


    OnBtnPhoneLogin: function (event, arg) {
        var check = this._togAgree.$Toggle.isChecked;
        if (!check) {
            this.showAlert("请同意服务与协议！");
            return;
        }
        cc.vv.audioMgr.playSFX("dian.mp3");
        cc.vv.phone = this._editAcc.$EditBox.string;
        cc.vv.pwd = this._editPwd.$EditBox.string;
        var data = {
            iMode: 3, //1:账户不存在会创建  2  断线重连  使用userid登录   3 不会创建
            szAccount: cc.vv.phone,
            szPassword: cc.vv.pwd,
            szUUID_KEY: "",
        };
        this.showLoad();
        cc.vv.socket.send("loginin", data);
    },

    onBtnQuickStartClicked: function () {
        cc.vv.userMgr.guestAuth();
    },

    onBtnWeichatClicked: function () {
        var self = this;
        cc.vv.anysdkMgr.login();
    },

    OnBtnYouKeDenglu: function () {
        console.log('============');
        cc.vv.audioMgr.playSFX("dian.mp3");
        this.showLoad();
        cc.vv.phone = cc.sys.localStorage.getItem("UserName");
        cc.vv.pwd = cc.sys.localStorage.getItem("UserPwd");
        if (cc.vv.phone == null || cc.vv.phone == "") {
            cc.vv.phone = "yk_" + new Date().getTime();
            cc.vv.pwd = "123456";
            var data = {
                szAccount: cc.vv.phone,
                szPassword: cc.vv.pwd,
                szAlias: "游客",
                szHeadIco: 1,
                //sex: 0,
            };
            cc.vv.socket.send("regaccount", data);
        } else {
            this.YoukeDenglu();
        }
    },

    YoukeDenglu: function () {
        cc.vv.gameNetMgr._isYouKeDenglu = true;
        cc.vv.audioMgr.playSFX("dian.mp3");
        this.showLoad();
        console.log("游客登录");
        var data = {
            iMode: 1,
            szAccount: cc.vv.phone,
            szPassword: cc.vv.pwd,
            szUUID_KEY: "",
            //sex: 0,
        };
        cc.vv.socket.send("loginin", data);
    },

    OnShowZhuCeFrame: function () {
        cc.vv.audioMgr.playSFX("dian.mp3");
        this.m_nodeFrame.active = false;
        this.showPrefab('Registered');
    },

    BtnBack: function (event, args) {
        cc.vv.audioMgr.playSFX("dian.mp3");
        event.target.parent.active = false;
    },

    OpenGaiMiFrame: function () {
        cc.vv.audioMgr.playSFX("dian.mp3");
        this.m_nodeFrame.active = false;
        this.showPrefab('SendModify');
    },

    GetGps: function () {
        let a = window.sdkgps.getLatitudeLongitude();
        this.showAlert(a);
    },

    GetDian: function () {
        var a = window.sdkbattery.getBattery();
        this.showAlert(a);
    },

    TestReplay: function () {
        cc.vv.gameNetMgr._replayRoomUUID = "1549102348237267963";
        cc.vv.gameNetMgr._replayShoushu = 1;
        cc.director.loadScene("xuangameRePlay");
    },

});