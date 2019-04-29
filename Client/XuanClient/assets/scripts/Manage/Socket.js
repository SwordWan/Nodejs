if (window.io == null) {
    window.io = require("socket-io");
}
//默认window环境下输出log;
var LOG_NET = cc.sys.os == cc.sys.OS_WINDOWS;
// var LOG_NET = false;
var Global = cc.Class({
    extends: cc.Component,
    statics: {
        ip: "",
        sio: null,
        isPinging: false,
        handlers: [],
        mContext: null,
        isReconnect: false,
        addHandlers: function (events, context) {
            for (var i in events) {
                this.addHandler(events[i], context);
            }
        },
        _addHandler: function (event, context) {
            // if (LOG_NET) console.log('regist: ', event, context);
            this.sio.on(event, function (data) {
                if (typeof (data) == "string") {
                    data = JSON.parse(data);
                }
                if (LOG_NET) console.log('%c recive:', 'color:#f00;', event, data);
                if (undefined != context[event]) {
                    context[event](data);
                } else {
                    console.warn(event + '没注册事件');
                }
            });
        },
        addHandler: function (event, context) {
            if (context && context != this.mContext) {
                this.handlers.push({
                    'event': event,
                    'context': context
                })
            }
            if (!context && this.mContext) context = this.mContext;
            if (context) this._addHandler(event, context);
        },
        connect: function (ip, context) {
            if (this.sio) {
                console.warn('请断开当前连接!');
                return;
            }
            if (LOG_NET) console.log('ConnectSocket ' + ip);
            this.ip = ip;
            this.mContext = context;
            var self = this;

            var opts = {
                'reconnection': false,
                'force new connection': true,
                'transports': ['websocket', 'polling']
            }
            this.sio = window.io.connect(ip, opts);

            this.sio.on('connect', function (data) {
                self.sio.connected = true;
                if (undefined != context['connect']) {
                    context['connect']();
                }
                if (self.isReconnect) {
                    self.isReconnect = false;
                    for (var i in self.handlers) {
                        self._addHandler(self.handlers[i].event, self.handlers[i].context)
                    }
                }
            });

            this.sio.on('disconnect', function (data) {
                self.sio.connected = false;
                self.disconnect();
                if (undefined != context['disconnect']) {
                    context['disconnect']();
                }
            });

            this.sio.on('error', function () {
                if (undefined != context['error']) {
                    context['error']();
                }
            });

            this.startHearbeat();
        },

        disconnect: function () {
            this.handlers = [];
            this.mContext = null;
            this.close();
        },

        reconnect: function () {
            if (this.sio && this.sio.connected) {
                this.close();
            }
            this.isReconnect = true;
            this.connect(this.ip, this.mContext)
        },

        startHearbeat: function () {
            this.sio.on('game_pong', function () {
                self.lastRecieveTime = Date.now();
                self.delayMS = self.lastRecieveTime - self.lastSendTime;
                //默认关闭心跳log
                // if (LOG_NET) console.log('game_pong ' + self.delayMS);
            });
            this.lastRecieveTime = Date.now();
            var self = this;

            if (!this.isPinging) {
                this.isPinging = true;
                setInterval(function () {
                    if (self.sio) {
                        self.ping();
                    }
                }.bind(this), 5000);
                setInterval(function () {
                    if (self.sio) {
                        if (Date.now() - self.lastRecieveTime > 10000) {
                            //本地调试忽略心跳
                            if (cc.sys.os != cc.sys.OS_WINDOWS)
                                self.disconnect();
                        }
                    }
                }.bind(this), 500);
                cc.game.on(cc.game.EVENT_HIDE, function (event) {
                    cc.log("切换后台", event);
                    self.close();
                }, this);
                cc.game.on(cc.game.EVENT_SHOW, function (event) {
                    cc.log("切换前台", event);
                    self.reconnect();
                }, this)
            }
        },
        send: function (event, data) {
            if (this.sio && this.sio.connected) {
                if (data != null && (typeof (data) == "object")) {
                    data = JSON.stringify(data);
                    //console.log(data);              
                }
                this.sio.emit(event, data);
                if ('game_ping' == event) return;
                if (LOG_NET) console.log('%c send:', 'color:#0f0;', event, data);
            }
        },

        ping: function () {
            if (this.sio) {
                this.lastSendTime = Date.now();
                this.send('game_ping');
            }
        },

        close: function () {
            if (LOG_NET) console.log('CloseSocket');
            this.delayMS = null;
            if (this.sio && this.sio.connected) {
                this.sio.connected = false;
                this.sio.disconnect();
            }
            this.sio = null;
        }
    }
});