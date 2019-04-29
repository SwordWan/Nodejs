cc.Class({
    extends: cc.Component,

    properties: {
        // foo: {
        //    default: null,      // The default value will be used only when the component attaching
        //                           to a node for the first time
        //    url: cc.Texture2D,  // optional, default is typeof default
        //    serializable: true, // optional, default is true
        //    visible: true,      // optional, default is true
        //    displayName: 'Foo', // optional
        //    readonly: false,    // optional, default is false
        // },
        // ...
        reconnctNode: { default: null, type: cc.Node },
        IsGameScene:false,
        _reconnect: null,
        _lblTip: null,
        _lastPing: 0,
        _lisenterHide: null,
        _lisenterShow: null,
        _reconGameFun: null,
        _reconHallFun: null,
    },

    // use this for initialization
    onLoad: function () {
        this._lblTip = this.reconnctNode.getChildByName("tip").getComponent(cc.Label);
        var self = this;
        this.node.on('disconnect', function () {
            self.testDelay();
        });

        this.node.on('onConnectNetSuccess', function () {
            if (!self.IsGameScene) {
                self.unscheduleAllCallbacks();
                self.reconnctNode.active = false;
            }
        });

        this.node.on('onConnectGameNetSuccess', function () {
            if (self.IsGameScene) {
                self.unscheduleAllCallbacks();
                self.reconnctNode.active = false;
            }
        });
        

        this._lisenterHide = cc.eventManager.addCustomListener(cc.game.EVENT_HIDE, function () {
            cc.log("游戏进入后台");
            if (self.IsGameScene) {
                cc.vv.gameNetMgr.CloseGameNetConnect();
                 cc.vv.gameNetMgr.CloseNetConnect();
            } else {
                cc.vv.gameNetMgr.CloseNetConnect();
            }
        });

        this._lisenterShow = cc.eventManager.addCustomListener(cc.game.EVENT_SHOW, function () {
            cc.log("重新返回游戏");
            cc.vv.gameNetMgr.CloseGameNetConnect();
            cc.vv.gameNetMgr.CloseNetConnect();
            // self.refreshInfo();
        });
    },

    testDelay: function () {
        console.log("断线重连");
        
        if (this.IsGameScene) {
            if (!cc.vv.GameNet.IsConnect()) {
                this._lblTip.string = "正在尝试重连...";
                this.reconnctNode.active = true;
                this.scheduleOnce(function () {
                    this.MakeReconnctGameSever();
                }, 0.1);
            }
           
            if (!cc.vv.net.IsConnect()) {
                this.scheduleOnce(function () {
                    this.MakeReconnctHallSever();
                }, 0.1);
            }
        } else {
            if (!cc.vv.net.IsConnect()) {
                this._lblTip.string = "正在尝试重连...";
                this.reconnctNode.active = true;
                this.scheduleOnce(function () {
                    this.MakeReconnctHallSever();
                }, 0.1);
            }
        }
    },

    MakeReconnctGameSever: function () {
        if (this.IsGameScene) {
            if (!cc.vv.GameNet.IsConnect()) {
                //cc.vv.GameNet.CloseGamenet();
                cc.vv.GameNet.remove();
                cc.vv.gameNetMgr.connectXuanServer(null);
            } else {
                this.unschedule(this._reconGameFun);
                this.reconnctNode.active = false;
                return;
            }
        }

        this._reconGameFun = this.scheduleOnce(function () {
            this.MakeReconnctGameSever();
        }, 3);
    },

    MakeReconnctHallSever: function () {
        if (!cc.vv.net.IsConnect()) {
            //cc.vv.net.CloseNet();
            cc.vv.net.remove();
            cc.vv.gameNetMgr.connectGameServer(null);
        } else {
            if (!this.IsGameScene) {
                this.unschedule(this._reconHallFun);
                this.reconnctNode.active = false;
            }
            return;
        }
        this._reconHallFun = this.scheduleOnce(function () {
            this.MakeReconnctHallSever();
        }, 3);
    },
    // called every frame, uncomment this function to activate update callback
    //update: function (dt) {
    //    if (this._reconnect.active) {
    //        var t = Math.floor(Date.now() / 1000) % 4;
    //        this._lblTip.string = "与服务器断开连接，正在尝试重连";
    //        this._loading_image.rotation = this._loading_image.rotation - dt * 45;
    //        for (var i = 0; i < t; ++i) {
    //            this._lblTip.string += '.';
    //        }
    //    }
    //},

    onDestroy: function () {
        cc.vv.gameNetMgr.reconnect = null;
        cc.eventManager.removeListener(this._lisenterHide);
        cc.eventManager.removeListener(this._lisenterShow);
    },
});
