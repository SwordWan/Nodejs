if (window.io == null) {
    window.io = require("socket-io");
}
/*
function newSocket(){
	var sokect = null;
	var handlers = {};
	var self = this;
	this.connected = false;
	this.connect = function(ip ,fnConnect, fnError){
		var opts = {
			'reconnection': false,
			'force new connection': true,
			'transports': ['websocket', 'polling']
		}
		sokect = window.io.connect(ip, opts);
		sokect.on('connect', function (data) {
			self.connected = true;
			fnConnect(data);
		});
		sokect.on('error' ,function(data){
			self.connected = false;
			console.log('error');
		});
		sokect.on('disconnect', function (data) {
			self.connected = false;
			console.log("disconnect");
			if(undefined != handlers['disconnect']){
				handlers['disconnect']();
			}
		});
	};
	this.addHandler = function(event ,handler){
		handlers[event] = handler;
		if(event != "disconnect"){
			(function(ev){
				sokect.on(ev, function (data) {
					if (typeof (data) == "string") {
						data = JSON.parse(data);
					}
					if(undefined != handlers[ev]){
						handlers[ev](data);
					}
				});
			})(event);
		}
	};
	this.disconnect = function(){
		handlers = {};
		if(sokect){
			sokect.disconnect();
		}
	};
	this.emit = function(event, data){
		sokect.emit(event, data);
	};
}
*/
var Global = cc.Class({
    extends: cc.Component,
    statics: {
        ip: "",
        sio: null,
        isPinging: false,
        fnDisconnect: null,
        handlers: {},

        addHandler: function (event, fn) {
            if (this.handlers[event]) {
                console.log("event:" + event + "' handler has been registered.");
                return;
            }
			this.handlers[event] = fn;
			if(this.sio){
				this.sio.addHandler(event ,fn);
			}
			//
			/*
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
			*/
        },
        remove: function () {
            for (var key in this.handlers) {
                if (key != undefined && key != "disconnect") {
                    delete this.handlers[key];
                }
            }
        },

        removeAll: function () {
            for (var key in this.handlers) {
                if (key != undefined && this.sio &&  key != "disconnect") {
                    delete this.handlers[key];
                }
            }
            this.fnDisconnect = null;
        },
        connect: function (fnConnect, fnError) {
			if(this.sio){
				this.sio.disconnect();
			}
			this.sio = new newSocket();
			this.sio.connect(this.ip ,fnConnect, fnError);
			/*
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

            this.sio.on('error', function () {
                console.log('error');
            });

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
			*/
        },

        startHearbeat: function () {
            this.sio.on('game_pong', function () {
                self.lastRecieveTime = Date.now();
                self.delayMS = self.lastRecieveTime - self.lastSendTime;
                console.log("gamexuanpong" + self.delayMS);
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
            console.log("SendxuanMSG:" + event);
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
            console.log('gamenet.close');
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

        CloseGamenet: function () {
            this.delayMS = null;
			/*
            if (this.sio == null && this.fnDisconnect == null) {
                // this.reconnect();
                return;
            }
			*/
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
            if (this.sio != null) {
                if (this.sio.connected) {
                    return true;
                }
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