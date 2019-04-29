if (window.io == null) {
    window.io = require("socket-io");
}

var Global = cc.Class({
    extends: cc.Component,
    statics: {
        ip: "",
        sio: null,
        isPinging: false,
        fnDisconnect: null,
        handlers: {},

        reconnect: function () {
            this.test(function (ret) {
                if (ret) {
                    //cc.director.loadScene('hall');
                    console.log("test返回值：" + ret);
                    var onCreate = function (ret) {
                        if (ret.iRoomId != 0) {
                            cc.vv.gameNetMgr.reset();
                            var roomId = cc.vv.userMgr.oldRoomId;
                            if (roomId != null) {
                                cc.vv.userMgr.oldRoomId = null;
                                console.log("reenterroom：" + roomId);
                                cc.vv.userMgr.reEnterRoom(roomId, function (ret) {
                                    if (ret.errcode != 0) {
                                        cc.vv.gameNetMgr.resetGame();
                                        cc.vv.gameNetMgr.roomId = null;
                                        if (cc.vv.CowGame != null) {
                                            if (cc.vv.userMgr.currentScene != "cowhall") {
                                                cc.director.loadScene("CowHall");
                                                cc.vv.userMgr.currentScene = "cowhall";
                                            }
                                        } else {
                                            cc.director.loadScene("hall");
                                        }
                                    }
                                });
                            }
                        } else {
                            cc.vv.gameNetMgr.reset();
                            cc.vv.gameNetMgr.roomId = null
                            cc.vv.userMgr.oldRoomId = null
                            cc.vv.userMgr.roomData = null;
                            if (cc.vv.CowGame != null) {
                                if (cc.vv.userMgr.currentScene != "cowhall") {
                                    cc.director.loadScene("CowHall");
                                    cc.vv.userMgr.currentScene = "cowhall";
                                }
                            } else {
                                cc.director.loadScene("hall");
                            }
                        }
                    };
                    cc.vv.http.sendRequest("/get_player_state", { userId: cc.vv.userMgr.userId, gameId: cc.vv.gameNetMgr.conf.type }, onCreate);/// 在游戏服务器关闭重启之后  还在房间里面的玩家应该被踢出去
                }
                else {
                    setTimeout(fnTestServerOn, 3000);
                }
            });
        },

        addHandler: function (event, fn) {
            if (this.handlers[event]) {
                console.log("event:" + event + "' handler has been registered.");
                return;
            }

            var handler = function (data) {
                //console.log(event + "(" + typeof (data) + "):" + (data ? data.toString() : "null"));
                if (event != "disconnect" && typeof (data) == "string") {
                    data = JSON.parse(data);
                }
                fn(data);
            };

            this.handlers[event] = handler;
            if (this.sio) {
                console.log("register1:function " + event);
                this.sio.on(event, handler);
            }
        },
        remove: function () {
            for (var key in this.handlers) {
                if (key != undefined &&  key != "disconnect") {
                    delete this.handlers[key];
                }
            }
        },

        removeAll: function () {
            console.log("removeall");
            for (var key in this.handlers) {
                if (key != undefined && this.sio && key != "login_finished" && key != "login_cow_finished" && key != "login_zjh_finished" && key != "disconnect" && key != "login_result") {
                    delete this.handlers[key];
                }
            }
            this.fnDisconnect = null;
        },
        connect: function (fnConnect, fnError) {
            var self = this;

            var opts = {
                'reconnection': false,
                'force new connection': true,
                'transports': ['websocket', 'polling']
            }
            this.sio = window.io.connect(this.ip, opts);
            console.log("获得sio:"+this.sio);
            this.sio.on('reconnect', function () {
                console.log('reconnection');
            });
            this.sio.on('connect', function (data) {
                self.sio.connected = true;
                fnConnect(data);
            });

            this.sio.on('disconnect', function (data) {
                console.log("disconnect");
                self.sio.connected = false;
                self.close();
               
            });

            this.sio.on('connect_failed', function () {
                console.log('connect_failed');
            });
            console.log(this.handlers);
            for (var key in this.handlers) {
                var value = this.handlers[key];
                if (typeof (value) == "function") {
                    if (key == 'disconnect') {
                        this.fnDisconnect = value;
                    }
                    else {
                        console.log("register:function " + key);
                        this.sio.on(key, value);
                    }
                }
            }
            this.startHearbeat();
        },

        startHearbeat: function () {
            this.sio.on('game_pong', function () {
                self.lastRecieveTime = Date.now();
                self.delayMS = self.lastRecieveTime - self.lastSendTime;
                console.log("gamepong" + self.delayMS);
            });
            this.lastRecieveTime = Date.now();
            var self = this;
            console.log(1);
            if (!self.isPinging) {
                console.log(1);
                self.isPinging = true;
                setInterval(function () {
                    if (self.sio) {
                        if (Date.now() - self.lastRecieveTime > 10000) {
                        
                            self.close();
                        }
                        else {
                            self.ping();
                        }
                    }
                }, 5000);
            }
        },
        send: function (event, data) {
            console.log("SendMSG:" + event);
            console.log(data);
            if (this.sio.connected) {
                if (data != null && (typeof (data) == "object")) {
                    data = JSON.stringify(data);
                    //console.log(data);              
                }
                this.sio.emit(event, data);
            }
        },


        ping: function () {
            this.lastSendTime = Date.now();
            this.send('game_ping');
        },

        close: function () {
            console.log('net.close');
            this.delayMS = null;
            if (this.sio == null && this.fnDisconnect == null)
            {
               // this.reconnect();
                return;
            }
                
            if (this.sio && this.sio.connected) {
                console.log("上面啊");
                this.sio.connected = false;
                this.sio.disconnect();
                this.sio = null;
            }
            if (this.fnDisconnect) {
                console.log("下面啊");
                this.fnDisconnect();
                this.fnDisconnect = null;
            }
        },

        CloseNet: function () {
            this.delayMS = null;
            if (this.sio == null && this.fnDisconnect == null) {
                // this.reconnect();
                return;
            }
            if (this.sio && this.sio.connected) {
                console.log("上面啊");
                this.sio.connected = false;
                this.sio.disconnect();
                this.sio = null;
            }
        },

        IsConnect: function () {
            console.log(this.sio);
            if (this.sio) {
                console.log(this.sio.connected);
            }
            if (this.sio != null && this.sio.connected) {
                return true;
            } else {
                return false;
            }
        },


        test: function (fnResult) {
            var xhr = null;
            var fn = function (ret) {
                fnResult(ret.isonline);
                xhr = null;
            }

            var arr = this.ip.split(':');
            var roomId = cc.vv.userMgr.oldRoomId;
            
            var data = {
                account: cc.vv.userMgr.account,
                sign: cc.vv.userMgr.sign,
                ip: arr[0],
                port: arr[1],
                roomid: roomId,
            }
            xhr = cc.vv.http.sendRequest("/is_server_online", data, fn);
            setTimeout(function () {
                if (xhr) {
                    xhr.abort();
                    fnResult(false);
                }
            }, 1500);
            /*
            var opts = {
                'reconnection':false,
                'force new connection': true,
                'transports':['websocket', 'polling']
            }
            var self = this;
            this.testsio = window.io.connect(this.ip,opts);
            this.testsio.on('connect',function(){
                console.log('connect');
                self.testsio.close();
                self.testsio = null;
                fnResult(true);
            });
            this.testsio.on('connect_error',function(){
                console.log('connect_failed');
                self.testsio = null;
                fnResult(false);
            });
            */
        }
    },
});