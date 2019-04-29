import { setTimeout } from "timers";

cc.Class({
    extends: cc.Component,

    properties: {
        GameEventHandler: null,
        LoginEventHandler: null,
        HallEventHandler: null,
        curRoomId: null,
        _reconnectNet: false,
        _reconnectGameNet: false,
        _curClubId: 0,
        _shouldJumpZhanjiFrame: false,
        _tempFunc: null,
        _isLogin: false,
        _isYouKeDenglu: false,
        _replayRoomUUID: 0,
        _replayShoushu:0,
    },



    AutoLogin: function () {
		var iMode = parseInt( cc.sys.localStorage.getItem("iMode") );
		var username = cc.vv.phone;
		var userpwd = cc.vv.pwd;
		var data = {
			iMode: iMode,
			szAccount: username,
			szPassword: userpwd,
			szUUID_KEY: cc.vv.userMgr.UUID_KEY,
		};
		cc.vv.socket.send("loginin", data);
		/*
        if (this._isYouKeDenglu) {
            console.log("游客登录");
            var name = cc.sys.localStorage.getItem("XYKName");
            var mima = cc.sys.localStorage.getItem("XYKPwd");
            var data = {
                iMode: 1,
                szAccount: name,
                szPassword: mima,
                szUUID_KEY: cc.vv.userMgr.UUID_KEY,
                //sex: 0,
            };
            cc.vv.net.send("loginin", data);
        } else {
            var username = cc.sys.localStorage.getItem("UserName");
            var userpwd = cc.sys.localStorage.getItem("UserPwd");
            var data = {
                iMode: 3,
                szAccount: username,
                szPassword: userpwd,
                szUUID_KEY: cc.vv.userMgr.UUID_KEY,
            };
            cc.vv.net.send("loginin", data);
        }
		*/
    },

    reset: function () {
      
    },
    

    resetGame: function ()
    {
        this.reset();
    },
  

    dispatchCommonEvent(event, data) {
        if (this.GameEventHandler) {
            this.GameEventHandler.emit(event, data);
        }
        if (this.LoginEventHandler) {
            this.LoginEventHandler.emit(event, data);
        }
        if (this.HallEventHandler) {
            this.HallEventHandler.emit(event, data);
        }
    },

    dispatchGameEvent(event, data) {
        if (this.GameEventHandler) {
            this.GameEventHandler.emit(event, data);
        }
    },

    dispatchHallEvent(event, data) {
        if (this.HallEventHandler) {
            this.HallEventHandler.emit(event, data);
        }
    },
    dispatchLoginEvent(event, data) {
        if (this.LoginEventHandler) {
            this.LoginEventHandler.emit(event, data);
        }
    },
    
    
    getArrayIndex: function (bArray, value) {
        for (var i = 0; i < bArray.length; i++) {
            if (value == bArray[i]) {
                return i;
            }
        }
        return -1;
    },
    
    initConnec: function () {
        var self = this;
        cc.vv.net.addHandler("disconnect", function (data) {
            console.log("disconnectHallNet-------" + data);
            cc.vv.net.remove();
            self._reconnectNet = true,
            self.dispatchCommonEvent("disconnect",null);
            //var fnTestServerOn = function () {
            //    cc.vv.net.test(function (ret) {
            //        if (ret) {
            //            self.connectGameServer();
            //        }
            //        else {
            //            setTimeout(fnTestServerOn, 3000);
            //        }
            //    });
            //}
            //fnTestServerOn();
        });

        cc.vv.GameNet.addHandler("disconnect", function (data) {

            console.log("disconnectXUanGame-------" + data);
            cc.vv.GameNet.remove();
            self._reconnectGameNet = true,
            self.dispatchGameEvent("disconnect",null);
            // self.connectXuanServer();
            //var fnTestServerOn = function () {
            //    cc.vv.GameNet.test(function (ret) {
            //        if (ret) {
            //            self.connectXuanServer();
            //        }
            //        else {
            //            setTimeout(fnTestServerOn, 3000);
            //        }
            //    });
            //}
            //fnTestServerOn();
        });
    },

    initCommonHandlers: function () {
        var self = this;
        cc.vv.net.addHandler("error_message", function (data) {
            console.log("somethingwrong");
            var content = self.getErrCode(data.iErrCode, data.szErrMsg);
            cc.vv.alert.show('提示', content, null);
            self.dispatchCommonEvent("somethingWrong", data);
        });


        cc.vv.net.addHandler("other_login_result", function (data) {
            console.log("other_login_result");
            cc.vv.alert.show('提示', "您的账号在其他设备登录！", null);
            cc.sys.localStorage.removeItem("UserName");
            cc.sys.localStorage.removeItem("UserPwd");
            console.log("清除用户信息");
            cc.vv.userMgr.userId = 0,
            cc.director.loadScene("login");
            //console.log(data);
           // self.dispatchGameEvent("reqsd_notify", data);
        });

        cc.vv.GameNet.addHandler("other_login_result", function (data) {
            console.log("other_login_result");
            cc.vv.alert.show('提示', "您的账号在其他设备登录！", null);
            cc.sys.localStorage.removeItem("UserName");
            cc.sys.localStorage.removeItem("UserPwd");
            console.log("清除用户信息");
            cc.vv.userMgr.userId = 0,
                cc.director.loadScene("login");
            //console.log(data);
            // self.dispatchGameEvent("reqsd_notify", data);
        });

        cc.vv.GameNet.addHandler("golds_noten_result", function (data) {
            console.log("golds_noten_result");
            cc.vv.alert.show("金币不足！", null);
        });

        cc.vv.GameNet.addHandler("gems_noten_result", function (data) {
            console.log("gems_noten_result");
            cc.vv.alert.show( "钻石不足！", null);
        });

        cc.vv.net.addHandler("golds_noten_result", function (data) {
            console.log("golds_noten_result");
            cc.vv.alert.show("金币不足！", null);
        });

        cc.vv.net.addHandler("gems_noten_result", function (data) {
            console.log("gems_noten_result");
            cc.vv.alert.show("钻石不足！", null);
        });

        
    },

    initGameHandlers: function () {
        var self = this;
      
        cc.vv.GameNet.addHandler("error_message", function (data) {
            console.log("somethingWrong");
            self.dispatchGameEvent("somethingWrong", data);
        });
        
        cc.vv.GameNet.addHandler("enter_result", function (data) {
            console.log("enter_result");
            console.log(data);
            self.dispatchGameEvent("enter_result", data);
        });

        cc.vv.GameNet.addHandler("enter_notify", function (data) {
            console.log("enter_notify");
            console.log(data);
            self.dispatchGameEvent("enter_notify", data);
        });

        

        //"enter": OnEnterRoom,           // 进房间
        //"reqsd": OnReqSitDown,          // 申请坐下
        //"getsyncdata": OnGetSyncData,   // 获取同步数据
        //"getrsdus": OnGetReqSDUsers,    // 管理员获取提出了坐位置的用户
        //"reqsdpep": OnReqSGRep,         // 管理员是否同意指定用户坐位置
        //"ready": OnReady,               // 准备
        //"yazhu": OnStake,               // 押注
        //"lose": OnLose,                 // 丢
        //"rest": OnRest,                 // 休
        //        

        cc.vv.GameNet.addHandler("reqsd_result", function (data) {
            console.log("reqsd_result");
            console.log(data);
            self.dispatchGameEvent("reqsd_result", data);
        });

        cc.vv.GameNet.addHandler("reqsd_notify", function (data) {
            console.log("reqsd_notify");
            console.log(data);
            self.dispatchGameEvent("reqsd_notify", data);
        });

        cc.vv.GameNet.addHandler("getsyncdata_result", function (data) {
            console.log("getsyncdata_result");
            console.log(data);
            self.dispatchGameEvent("getsyncdata_result", data);
        });

        cc.vv.GameNet.addHandler("getrsdus_notify", function (data) {
            console.log("getrsdus_notify");
            console.log(data);
            self.dispatchGameEvent("getrsdus_notify", data);
        });

        cc.vv.GameNet.addHandler("reqsdpep_result", function (data) {  // 坐下成功回复
            console.log("reqsdpep_result");
            console.log(data);
            self.dispatchGameEvent("reqsdpep_result", data);
        });


        cc.vv.GameNet.addHandler("reqsdpep_notify", function (data) {  // 坐下房间通知
            console.log("reqsdpep_notify");
            console.log(data);
            self.dispatchGameEvent("reqsdpep_notify", data);
        });

        cc.vv.GameNet.addHandler("deal_notify", function (data) {  // 坐下房间通知
            console.log("deal_notify");
            console.log(data);
            self.dispatchGameEvent("deal_notify", data);
        });

        cc.vv.GameNet.addHandler("actions_notify", function (data) {  // 坐下房间通知
            console.log("actions_notify");
            console.log(data);
            self.dispatchGameEvent("actions_notify", data);
        });

        cc.vv.GameNet.addHandler("ready_notify", function (data) {
            console.log("ready_notify");
            console.log(data);
            self.dispatchGameEvent("ready_notify", data);
        });

        cc.vv.GameNet.addHandler("yazhu_result", function (data) {
            console.log("yazhu_result");
            console.log(data);
            self.dispatchGameEvent("yazhu_result", data);
        });

        cc.vv.GameNet.addHandler("yazhu_notify", function (data) {
            console.log("yazhu_notify");
            console.log(data);
            self.dispatchGameEvent("yazhu_notify", data);
        });


        cc.vv.GameNet.addHandler("lose_result", function (data) {
            console.log("lose_result");
            console.log(data);
            self.dispatchGameEvent("lose_result", data);
        });

        cc.vv.GameNet.addHandler("lose_notify", function (data) {
            console.log("lose_notify");
            console.log(data);
            self.dispatchGameEvent("lose_notify", data);
        });
        
        cc.vv.GameNet.addHandler("rest_result", function (data) {
            console.log("rest_result");
            console.log(data);
            self.dispatchGameEvent("rest_result", data);
        });

        cc.vv.GameNet.addHandler("rest_notify", function (data) {
            console.log("rest_notify");
            console.log(data);
            self.dispatchGameEvent("rest_notify", data);
        });

        cc.vv.GameNet.addHandler("split_complete_notify", function (data) {
            console.log("split_complete_notify");
            console.log(data);
            self.dispatchGameEvent("split_complete_notify", data);
        });
        
        cc.vv.GameNet.addHandler("split_result", function (data) {
            console.log("split_result");
            console.log(data);
            self.dispatchGameEvent("split_result", data);
        });

        cc.vv.GameNet.addHandler("split_notify", function (data) {
            console.log("split_notify");
            console.log(data);
            self.dispatchGameEvent("split_notify", data);
        });

        //dealnext_result   发下一张牌
        
        //lose_notify: 丢通知
        //rest_notify: 休通知
        //yazhu_notify: 押注通知
        //split_result: 分牌应答
        //start_split_notify
        cc.vv.GameNet.addHandler("dealnext_notify", function (data) {
            console.log("dealnext_notify");
            console.log(data);
            self.dispatchGameEvent("dealnext_notify", data);
        });
        cc.vv.GameNet.addHandler("lose_notify", function (data) {
            console.log("lose_notify");
            console.log(data);
            self.dispatchGameEvent("lose_notify", data);
        });
        cc.vv.GameNet.addHandler("rest_notify", function (data) {
            console.log("rest_notify");
            console.log(data);
            self.dispatchGameEvent("rest_notify", data);
        });
        cc.vv.GameNet.addHandler("yazhu_notify", function (data) {
            console.log("yazhu_notify");
            console.log(data);
            self.dispatchGameEvent("yazhu_notify", data);
        });
        cc.vv.GameNet.addHandler("start_split_notify", function (data) {
            console.log("start_split_notify");
            console.log(data);
            self.dispatchGameEvent("start_split_notify", data);
        });

        cc.vv.GameNet.addHandler("jiesuan_notify", function (data) {
            console.log("jiesuan_notify");
            console.log(data);
            self.dispatchGameEvent("jiesuan_notify", data);
        });
        cc.vv.GameNet.addHandler("start_notify", function (data) {
            console.log("start_notify");
            console.log(data);
            self.dispatchGameEvent("start_notify", data);
        });

        cc.vv.GameNet.addHandler("liuzuo_notify", function (data) {
            console.log("liuzuo_notify");
            console.log(data);
            self.dispatchGameEvent("liuzuo_notify", data);
        });

        cc.vv.GameNet.addHandler("jiesan_notify", function (data) {
            console.log("jiesan_notify");
            console.log(data);
            self.dispatchGameEvent("jiesan_notify", data);
        });
        cc.vv.GameNet.addHandler("situp_notify", function (data) {
            console.log("situp_notify");
            console.log(data);
            self.dispatchGameEvent("situp_notify", data);
        });
        cc.vv.GameNet.addHandler("situp_result", function (data) {
            console.log("situp_result");
            console.log(data);
            self.dispatchGameEvent("situp_result", data);
        });

        cc.vv.GameNet.addHandler("sitdown_result", function (data) {
            console.log("sitdown_result");
            console.log(data);
            self.dispatchGameEvent("sitdown_result", data);
        });

        cc.vv.GameNet.addHandler("sitdown_notify", function (data) {
            console.log("sitdown_notify");
            console.log(data);
            self.dispatchGameEvent("sitdown_notify", data);
        });

        cc.vv.GameNet.addHandler("enable_actions_result", function (data) {
            console.log("enable_actions_result");
            console.log(data);
            self.dispatchGameEvent("enable_actions_result", data);
        });
        
        cc.vv.GameNet.addHandler("user_notify", function (data) {
            console.log("user_notify");
            console.log(data);
            self.dispatchGameEvent("user_notify", data);
        });

        cc.vv.GameNet.addHandler("addjifen_result", function (data) {
            console.log("addjifen_result");
            console.log(data);
            self.dispatchGameEvent("addjifen_result", data);
        });

        cc.vv.GameNet.addHandler("addjifen_notify", function (data) {
            console.log("addjifen_notify");
            console.log(data);
            self.dispatchGameEvent("addjifen_notify", data);
        });

        cc.vv.GameNet.addHandler("leave_notify", function (data) {
            console.log("leave_notify");
            console.log(data);
            self.dispatchGameEvent("leave_notify", data);
        });

        cc.vv.GameNet.addHandler("getpjlogs_result", function (data) {
            console.log("getpjlogs_result");
            console.log(data);
            self.dispatchGameEvent("getpjlogs_result", data);
        });

        cc.vv.GameNet.addHandler("yanshi_notify", function (data) {
            console.log("yanshi_notify");
            console.log(data);
            self.dispatchGameEvent("yanshi_notify", data);
        });
        cc.vv.GameNet.addHandler("roomplayers_result", function (data) {
            console.log("roomplayers_result");
            console.log(data);
            self.dispatchGameEvent("roomplayers_result", data);
        });

        cc.vv.GameNet.addHandler("getusermsgs_result", function (data) {
            console.log("getusermsgs_result");
            console.log(data);
            self.dispatchGameEvent("getusermsgs_result", data);
        });

        cc.vv.GameNet.addHandler("playvoice_result", function (data) {
            console.log("playvoice_result");
            console.log(data);
            self.dispatchGameEvent("playvoice_result", data);
        });

        cc.vv.GameNet.addHandler("dists_warn_notify", function (data) {
            console.log("dists_warn_notify");
            console.log(data);
            self.dispatchGameEvent("dists_warn_notify", data);
        });

        cc.vv.GameNet.addHandler("getjyusers_result", function (data) {
            console.log("getjyusers_result");
            console.log(data);
            self.dispatchGameEvent("getjyusers_result", data);
        });

        cc.vv.GameNet.addHandler("jingyan_result", function (data) {
            console.log("jingyan_result");
            console.log(data);
            self.dispatchGameEvent("jingyan_result", data);
        });

        cc.vv.GameNet.addHandler("shp_notify", function (data) {
            console.log("shp_notify");
            console.log(data);
            self.dispatchGameEvent("shp_notify", data);
        });

        cc.vv.GameNet.addHandler("goldsjc_changed_notify", function (data) {
            console.log("goldsjc_changed_notify");
            console.log(data);
            self.dispatchGameEvent("goldsjc_changed_notify", data);
        });

        
        cc.vv.GameNet.addHandler("zhongjiang_notify", function (data) {
            console.log("zhongjiang_notify");
            console.log(data);
            self.dispatchGameEvent("zhongjiang_notify", data);
        });

        cc.vv.GameNet.addHandler("jclogs_result", function (data) {
            console.log("jclogs_result ");
            console.log(data);
            self.dispatchGameEvent("jclogs_result", data);
        });

        cc.vv.GameNet.addHandler("showpais_notify", function (data) {
            console.log("showpais_notify ");
            console.log(data);
            self.dispatchGameEvent("showpais_notify", data);
        });

        cc.vv.GameNet.addHandler("showpais_result", function (data) {
            console.log("showpais_result ");
            console.log(data);
            self.dispatchGameEvent("showpais_result", data);
        });

        cc.vv.GameNet.addHandler("start_result", function (data) {
            console.log("start_result ");
            console.log(data);
            self.dispatchGameEvent("start_result", data);
        });

        cc.vv.GameNet.addHandler("opengame_notify", function (data) {
            console.log("opengame_notify ");
            console.log(data);
            self.dispatchGameEvent("opengame_notify", data);
        });

        cc.vv.GameNet.addHandler("addjifen_lailao_notify", function (data) {
            console.log("addjifen_lailao_notify");
            console.log(data);
            self.dispatchGameEvent("addjifen_lailao_notify", data);
        });

        cc.vv.GameNet.addHandler("addjifenrep_result", function (data) {
            console.log("addjifenrep_result");
            console.log(data);
            self.dispatchGameEvent("addjifenrep_result", data);
        });

        cc.vv.GameNet.addHandler("leave_result", function (data) {
            console.log("leave_result");
            console.log(data);
            self.dispatchGameEvent("leave_result", data);
        });

        cc.vv.GameNet.addHandler("jiesan_warn_notify", function (data) {
            console.log("jiesan_warn_notify");
            console.log(data);
            self.dispatchGameEvent("jiesan_warn_notify", data);
        });

        cc.vv.GameNet.addHandler("jiesan_result", function (data) {
            console.log("jiesan_result");
            console.log(data);
            self.dispatchGameEvent("jiesan_result", data);
        });

        cc.vv.GameNet.addHandler("kanpai_notify", function (data) {
            console.log("kanpai_notify");
            console.log(data);
            self.dispatchGameEvent("kanpai_notify", data);
        });

        cc.vv.GameNet.addHandler("getvoice_result", function (data) {
            console.log("getvoice_result");
            console.log(data);
            self.dispatchGameEvent("getvoice_result", data);
        });


        cc.vv.GameNet.addHandler("golds_change_result", function (data) {
            console.log("golds_change_result");
            console.log(data);
            self.dispatchGameEvent("golds_change_result", data);
        });

        cc.vv.GameNet.addHandler("liuzuo_result", function (data) {
            console.log("liuzuo_result");
            console.log(data);
            self.dispatchGameEvent("liuzuo_result", data);
        });
    },

    initHallHandlers: function () {
        var self = this;
        cc.vv.net.addHandler("creategclub_result", function (data) {
            console.log("creategclub_result");
            self.dispatchHallEvent("creategclub_result", data);
        });

        cc.vv.net.addHandler("getgclubinfo_result", function (data) {
            console.log("getgclubinfo_result");
            self.dispatchHallEvent("getgclubinfo_result", data);
        });

        cc.vv.net.addHandler("getgclubmsgs_result", function (data) {
            console.log("getgclubmsgs_result");
            self.dispatchHallEvent("getgclubmsgs_result", data);
        });

        cc.vv.net.addHandler("getjoingclubs_result", function (data) {
            console.log("getjoingclubs_result");
            self.dispatchHallEvent("getjoingclubs_result", data);
        });

        cc.vv.net.addHandler("delgblub_result", function (data) {
            console.log("delgblub_result");
            self.dispatchHallEvent("delgblub_result", data);
        });

        cc.vv.net.addHandler("exitgclub_result", function (data) {
            console.log("exitgclub_result");
            self.dispatchHallEvent("exitgclub_result", data);
        });

        cc.vv.net.addHandler("joinclub_result", function (data) {
            console.log("joinclub_result");
            self.dispatchHallEvent("joinclub_result", data);
        });

        cc.vv.net.addHandler("createroom_result", function (data) {
            console.log("createroom_result");
            self.dispatchHallEvent("createroom_result", data);
        });

        cc.vv.net.addHandler("getclubusers_result", function (data) {
            console.log("getclubusers_result");
            self.dispatchHallEvent("getclubusers_result", data);
        });

        cc.vv.net.addHandler("getclubrooms_result", function (data) {
            console.log("getclubrooms_result");
            self.dispatchHallEvent("getclubrooms_result", data);
        });

        cc.vv.net.addHandler("getclubumjs_result", function (data) {
            console.log("getclubumjs_result");
            self.dispatchHallEvent("getclubumjs_result", data);
        });

        cc.vv.net.addHandler("chgclubname_result", function (data) {
            console.log("chgclubname_result");
            self.dispatchHallEvent("chgclubname_result", data);
        });


        cc.vv.net.addHandler("chgalias_result", function (data) {
            console.log("chgalias_result");
            self.dispatchHallEvent("chgalias_result", data);
        });

        cc.vv.net.addHandler("getlinkrooms_result", function (data) {
            console.log("getlinkrooms_result");
            self.dispatchHallEvent("getlinkrooms_result", data);
        });

        cc.vv.net.addHandler("searchgclubinfo_result", function (data) {
            console.log("searchgclubinfo_result");
            self.dispatchHallEvent("searchgclubinfo_result", data);
        });

        cc.vv.net.addHandler("getroominfo_result", function (data) {
            console.log("getroominfo_result");
            self.dispatchHallEvent("getroominfo_result", data);
        });

        cc.vv.net.addHandler("getallianceinfo_result", function (data) {
            console.log("getallianceinfo_result");
            self.dispatchHallEvent("getallianceinfo_result", data);
        });

        cc.vv.net.addHandler("upgradclub_result", function (data) {
            console.log("upgradclub_result");
            self.dispatchHallEvent("upgradclub_result", data);
        });

        cc.vv.net.addHandler("dissolvedalliance_result", function (data) {
            console.log("dissolvedalliance_result");
            self.dispatchHallEvent("dissolvedalliance_result", data);
        });

        cc.vv.net.addHandler("allowapply_result", function (data) {
            console.log("allowapply_result");
            self.dispatchHallEvent("allowapply_result", data);
        });

        cc.vv.net.addHandler("createalliance_result", function (data) {
            console.log("createalliance_result");
            self.dispatchHallEvent("createalliance_result", data);
        });

        cc.vv.net.addHandler("getalliancemember_result", function (data) {
            console.log("getalliancemember_result");
            self.dispatchHallEvent("getalliancemember_result", data);
        });

        // 申请加入
        cc.vv.net.addHandler("applyalliance_result", function (data) {
            console.log("applyalliance_result");
            self.dispatchHallEvent("applyalliance_result", data);
        });

        //批准加入
        cc.vv.net.addHandler("approvealliance_result", function (data) {
            console.log("approvealliance_result");
            self.dispatchHallEvent("approvealliance_result", data);
        });

        cc.vv.net.addHandler("setallianceadmin_result", function (data) {
            console.log("setallianceadmin_result");
            self.dispatchHallEvent("setallianceadmin_result", data);
        });

        cc.vv.net.addHandler("exitalliance_result", function (data) {
            console.log("exitalliance_result");
            self.dispatchHallEvent("exitalliance_result", data);
        });
        
        cc.vv.net.addHandler("kickalliance_result", function (data) {
            console.log("kickalliance_result");
            self.dispatchHallEvent("kickalliance_result", data);
        });

        cc.vv.net.addHandler("upgradalliance_result", function (data) {
            console.log("upgradalliance_result");
            self.dispatchHallEvent("upgradalliance_result", data);
        });

        cc.vv.net.addHandler("joinmsg_result", function (data) {
            console.log("joinmsg_result");
            self.dispatchHallEvent("joinmsg_result", data);
        });

        cc.vv.net.addHandler("newmsg_result", function (data) {
            console.log("newmsg_result");
            self.dispatchHallEvent("newmsg_result", data);
        });


        cc.vv.net.addHandler("refuseclub_result", function (data) {
            console.log("refuseclub_result");
            self.dispatchHallEvent("refuseclub_result", data);
        });

        cc.vv.net.addHandler("approveclub_result", function (data) {
            console.log("approveclub_result");
            self.dispatchHallEvent("approveclub_result", data);
        });

        cc.vv.net.addHandler("setalliancememo_result", function (data) {
            console.log("setalliancememo_result");
            self.dispatchHallEvent("setalliancememo_result", data);
        });

        cc.vv.net.addHandler("updateclubmemo_result", function (data) {
            console.log("updateclubmemo_result");
            self.dispatchHallEvent("updateclubmemo_result", data);
        });

        cc.vv.net.addHandler("getuserginfo_result", function (data) {
            console.log("getuserginfo_result");
            self.dispatchHallEvent("getuserginfo_result", data);
        });

        cc.vv.net.addHandler("setclubadmin_result", function (data) {
            console.log("setclubadmin_result");
            self.dispatchHallEvent("setclubadmin_result", data);
        });

        cc.vv.net.addHandler("kickclub_result", function (data) {
            console.log("kickclub_result");
            self.dispatchHallEvent("kickclub_result", data);
        });

        cc.vv.net.addHandler("updateclubusermemo_result", function (data) {
            console.log("updateclubusermemo_result");
            self.dispatchHallEvent("updateclubusermemo_result", data);
        });

        cc.vv.net.addHandler("getaddjfusers_result", function (data) {
            console.log("getaddjfusers_result");
            console.log(data),
            self.dispatchHallEvent("getaddjfusers_result", data);
        });

        cc.vv.net.addHandler("addjifenrep_result", function (data) {
            console.log("addjifenrep_result");
            console.log(data),
                self.dispatchHallEvent("addjifenrep_result", data);
        });

        cc.vv.net.addHandler("rechargegold_result", function (data) {
            console.log("rechargegold_result");
            console.log(data),
                self.dispatchHallEvent("rechargegold_result", data);
        });

        cc.vv.net.addHandler("issuegold_result", function (data) {
            console.log("issuegold_result");
            console.log(data),
                self.dispatchHallEvent("issuegold_result", data);
        });

        cc.vv.net.addHandler("issuegoldlist_result", function (data) {
            console.log("issuegoldlist_result");
            console.log(data),
                self.dispatchHallEvent("issuegoldlist_result", data);
        });

        cc.vv.net.addHandler("dairulist_result", function (data) {
            console.log("dairulist_result");
            console.log(data),
                self.dispatchHallEvent("dairulist_result", data);
        });

        cc.vv.net.addHandler("mymsg_result", function (data) {
            console.log("mymsg_result");
            console.log(data),
                self.dispatchHallEvent("mymsg_result", data);
        });

        cc.vv.net.addHandler("mymessage_result", function (data) {
            console.log("mymessage_result");
            console.log(data),
                self.dispatchHallEvent("mymessage_result", data);
        });

        cc.vv.net.addHandler("buyvip_result", function (data) {
            console.log("buyvip_result");
            console.log(data),
                self.dispatchHallEvent("buyvip_result", data);
        });

        cc.vv.net.addHandler("getmyzjlogs_result", function (data) {
            console.log("getmyzjlogs_result");
            console.log(data),
                self.dispatchHallEvent("getmyzjlogs_result", data);
        });

        cc.vv.net.addHandler("issuedate_result", function (data) {
            console.log("issuedate_result");
            console.log(data),
                self.dispatchHallEvent("issuedate_result", data);
        });

        cc.vv.net.addHandler("zhanjidate_result", function (data) {
            console.log("zhanjidate_result");
            console.log(data);
            self.dispatchHallEvent("zhanjidate_result", data);
        });

        cc.vv.net.addHandler("zhanjilist_result", function (data) {
            console.log("zhanjilist_result");
            console.log(data);
            self.dispatchHallEvent("zhanjilist_result", data);
        });

        cc.vv.net.addHandler("alertgolds_result", function (data) {
            console.log("alertgolds_result");
            console.log(data);
            self.dispatchHallEvent("alertgolds_result", data);
        });

        cc.vv.net.addHandler("alertgoldsmsg_result", function (data) {
            console.log("alertgoldsmsg_result");
            console.log(data);
            self.dispatchHallEvent("alertgoldsmsg_result", data);
        });

        cc.vv.net.addHandler("upimage_result", function (data) {
            console.log("upimage_result");
            console.log(data);
            self.dispatchHallEvent("upimage_result", data);
        });

        cc.vv.net.addHandler("setvip_result", function (data) {
            console.log("setvip_result");
            console.log(data);
            self.dispatchHallEvent("setvip_result", data);
        });

        cc.vv.net.addHandler("issuediamond_result", function (data) {
            console.log("issuediamond_result");
            console.log(data);
            self.dispatchHallEvent("issuediamond_result", data);
        });

        cc.vv.net.addHandler("issuediamondlist_result", function (data) {
            console.log("issuediamondlist_result");
            console.log(data);
            self.dispatchHallEvent("issuediamondlist_result", data);
        });

        cc.vv.net.addHandler("issuediamonddate_result", function (data) {
            console.log("issuediamonddate_result");
            console.log(data);
            self.dispatchHallEvent("issuediamonddate_result", data);
        });

        cc.vv.net.addHandler("openjc_result", function (data) {
            console.log("openjc_result");
            console.log(data);
            self.dispatchHallEvent("openjc_result", data);
        });

        cc.vv.net.addHandler("getsmscodejslm_result", function (data) {
            console.log("getsmscodejslm_result");
            console.log(data);
            self.dispatchHallEvent("getsmscodejslm_result", data);
        });

        cc.vv.net.addHandler("getprivileges_result", function (data) {
            console.log("getprivileges_result");
            console.log(data);
            self.dispatchHallEvent("getprivileges_result", data);
        });
        cc.vv.net.addHandler("addjifen_lailao_notify", function (data) {
            console.log("addjifen_lailao_notify");
            console.log(data);
            self.dispatchHallEvent("addjifen_lailao_notify", data);
        });

        cc.vv.net.addHandler("getpjlogs_result", function (data) {
            console.log("getpjlogs_result");
            console.log(data);
            self.dispatchHallEvent("getpjlogs_result", data);
        });

        cc.vv.net.addHandler("alertgoldslist_result", function (data) {
            console.log("alertgoldslist_result");
            console.log(data);
            self.dispatchHallEvent("alertgoldslist_result", data);
        });

        cc.vv.net.addHandler("getuserinfo_result", function (data) {
            console.log("getuserinfo_result");
            console.log(data);
            self.dispatchHallEvent("getuserinfo_result", data);
        });
        
        
        cc.vv.net.addHandler("getclubphb_result", function (data) {
            console.log("getclubphb_result");
            console.log(data);
            self.dispatchHallEvent("getclubphb_result", data);
        });
    },

    initLoginHandlers: function () {
        var self = this;
        cc.vv.net.addHandler("regaccount_result", function (data) {
            console.log("regaccount_result");
            self.dispatchLoginEvent("regaccount_result", data);
        });

        cc.vv.net.addHandler("loginin_result", function (data) {
            console.log("loginin_result");
            self._isLogin = true;
            self.dispatchCommonEvent("loginin_result", data);
        });

        cc.vv.net.addHandler("getsmscode_result", function (data) {
            console.log("getsmscode_result");
            self.dispatchCommonEvent("getsmscode_result", data);
        });

        cc.vv.net.addHandler("regphone_result", function (data) {
            console.log("regphone_result");
            self.dispatchLoginEvent("regphone_result", data);
        });

        cc.vv.net.addHandler("chgpassword_result", function (data) {
            console.log("chgpassword_result");
            self.dispatchCommonEvent("chgpassword_result", data);
        });
    },
    
    connectGameServer: function () {
        cc.vv.net.remove();
        cc.vv.net.ip = cc.vv.SI.pLoginServer.IP + ":" + cc.vv.SI.pLoginServer.PORT;
    },

    YizhiLoginin: function () {
        var data = {
            iMode: 2,
            iUserId: cc.vv.userMgr.userId,
        };
        cc.vv.net.send("loginin", data);
        var self = this;
        var fun = function () {
            if (!self._isLogin) {
                self.YizhiLoginin();
            }
        }
        setTimeout(fun,2000);
    },

    connectXuanServer: function(data) {
        cc.vv.GameNet.remove();
        this.curRoomId = data.pRoomInfo.iRoomId;
        cc.vv.GameNet.ip = data.pAddress.IP + ":" + data.pAddress.PORT;
        console.log("connectGameServer++++++++++++++++++" + cc.vv.GameNet.ip);
    },

    CloseGameNetConnect: function () {
        cc.vv.GameNet.close();
    },

    CloseNetConnect: function () {
        cc.vv.net.close();
    },

    GetRandomNum: function (Min, Max) {
        var Range = Max - Min;
        var Rand = Math.random();
        return (Min + Math.round(Rand * Range));
    },

    dateFormatDay: function (time) {
        var date = new Date(time);
        if (time == null)
            date = new Date();
        var datetime = "{0}-{1}-{2}";
        var year = date.getFullYear();
        var month = date.getMonth() + 1;
        month = month >= 10 ? month : ("0" + month);
        var day = date.getDate();
        day = day >= 10 ? day : ("0" + day);
        datetime = datetime.format(year, month, day);
        return datetime;
    },

    dateFormatFull: function (time) {
        var date = new Date(time);
        var datetime = "{0}-{1}-{2} {3}:{4}:{5}";
        var year = date.getFullYear();
        var month = date.getMonth() + 1;
        month = month >= 10 ? month : ("0" + month);
        var day = date.getDate();
        day = day >= 10 ? day : ("0" + day);
        var h = date.getHours();
        h = h >= 10 ? h : ("0" + h);
        var m = date.getMinutes();
        m = m >= 10 ? m : ("0" + m);
        var s = date.getSeconds();
        s = s >= 10 ? s : ("0" + s);
        datetime = datetime.format(year, month, day, h, m, s);
        return datetime;
    },

    dateFormatHM: function (time) {
        var date = new Date(time);
        var h = date.getHours();
        h = h >= 10 ? h : ("0" + h);
        var m = date.getMinutes();
        m = m >= 10 ? m : ("0" + m);
        return h+":"+m;
    },

    dateFormatTime: function (time) {
        var date = new Date(time);
        var datetime = "{0}-{1}";
        var year = date.getFullYear();
        var month = date.getMonth() + 1;
        month = month >= 10 ? month : ("0" + month);
        var day = date.getDate();
        day = day >= 10 ? day : ("0" + day);
        var h = date.getHours();
        h = h >= 10 ? h : ("0" + h);
        var m = date.getMinutes();
        m = m >= 10 ? m : ("0" + m);
        datetime = datetime.format( h, m);
        return datetime;
    },

    dateFormatTimeHMS: function (time) {
        var date = new Date(time);
        var datetime = "{0}:{1}:{2}";
        var h = date.getHours();
        h = h >= 10 ? h : ("0" + h);
        var m = date.getMinutes();
        m = m >= 10 ? m : ("0" + m);
        var s = date.getSeconds();
        s = s >= 10 ? s : ("0" + s);
        datetime = datetime.format(h, m, s);
        return datetime;
    },

    GetStrByNowFrameDate: function (number) {
        var date = new Date(number);
        var now = new Date();
        if (date.getFullYear() == now.getFullYear() && date.getMonth() == now.getMonth() && date.getDate() == now.getDate()) {
            return this.dateFormatHM(number);
        }
        var days = now.getTime() - date.getTime();
        var day = parseInt(days / (1000 * 60 * 60 * 24));
        if (day == 0) {
            day = parseInt(days / (1000 * 60 * 60));
            return day + "小时前";
        } else if (day > 0 && day < 30) {
            return day + "天前";
        } else {
            day = parseInt(days / (1000 * 60 * 60 * 24 * 30));
            return day + "个月以前";
        }
    },

    GetTimeMS: function (second) {
        var m = second / 60;
        var s = second % 60;
        m = parseInt(m);
        var str = "";
        if (m < 9) {
            str = "0" + m;
        } else {
            str = m;
        }
        str += ":";
        if (s < 9) {
            str += "0" + s;
        } else {
            str += s;
        }
        return str;
    },
});
