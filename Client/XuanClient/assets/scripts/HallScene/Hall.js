var Net = require("Net")
var Global = require("Global")
// var Base64 = require("base64")
var connectCount = 0;
var socket = null;
var events = [
'creategclub_result',
'getgclubinfo_result',
'getgclubmsgs_result',
// 'getjoingclubs_result',
// 'delgblub_result',
// 'exitgclub_result',
// 'joinclub_result',
'createroom_result',
// 'getclubusers_result',
// 'getclubrooms_result',
'getclubumjs_result',
'chgclubname_result',
// 'chgalias_result',
'getlinkrooms_result',
'searchgclubinfo_result',
'getroominfo_result',
'reqsd_notify',
'loginin_result',
'getallianceinfo_result',
'upgradclub_result',
'dissolvedalliance_result',
'allowapply_result',
'createalliance_result',
'getalliancemember_result',
'applyalliance_result',
'approvealliance_result',
'setallianceadmin_result',
'exitalliance_result',
'kickalliance_result',
'upgradalliance_result',
// 'joinmsg_result',
'newmsg_result',
'refuseclub_result',
'approveclub_result',
'setalliancememo_result',
'updateclubmemo_result',
'getuserginfo_result',
// 'setclubadmin_result',
// 'kickclub_result',
'updateclubusermemo_result',
'getaddjfusers_result',
'addjifenrep_result',
'rechargegold_result',
'issuegold_result',
'issuegoldlist_result',
'dairulist_result',
'mymsg_result',
'mymessage_result',
'buyvip_result',
'getmyzjlogs_result',
'issuedate_result',
// 'zhanjidate_result',
// 'zhanjilist_result',
'alertgolds_result',
'alertgoldsmsg_result',
'upimage_result',
'getsmscode_result',
'chgpassword_result',
'setvip_result',
'issuediamond_result',
'issuediamondlist_result',
'issuediamonddate_result',
'openjc_result',
'getsmscodejslm_result',
'getprivileges_result',
'addjifen_lailao_notify',
// 'getpjlogs_result',
'alertgoldslist_result',
'getuserinfo_result',
// 'getclubphb_result',
'connect',
'disconnect',
'golds_noten_result',
'gems_noten_result',
'other_login_result',
];
cc.Class({
    extends: cc.BaseClass,

    properties: {
        ClubFrame: { default: null, type: cc.Node },
        ClubDisPlayItem: { default: null, type: cc.Node },
        PaijuFrame: { default: null, type: cc.Node },
        zhanjiFrame: { default: null, type: cc.Node },
        MineFrame: { default: null, type: cc.Node },
        SecondFrameParent: { default: null, type: cc.Node },
        WoFrameParent: { default: null, type: cc.Node },
        ClubRoomItem: { default: null, type: cc.Node },
        ClubAddRoomItem: { default: null, type: cc.Node },
        paijuItem: { default: null, type: cc.Node },
        ChangeHeadNode: { default: null, type: cc.Node },
        LeagueParent: { default: null, type: cc.Node },
        MsgItem: { default: null, type: cc.Node },
        leagueClubItem: { default: null, type: cc.Node },
        clubUserItem: { default: null, type: cc.Node },
        clubDataCountParent: { default: null, type: cc.Node },
        wodeDataCountParent: { default: null, type: cc.Node },
        LiuZhuoItem: { default: null, type: cc.Node },
        LiuZhuoMsgItem: { default: null, type: cc.Node },
        MessageFrame: { default: null, type: cc.Node },
        MessageItem: { default: null, type: cc.Node },
        jijinFafangFrame: { default: null, type: cc.Node },
        jijinFafangItem: { default: null, type: cc.Node },
        LeagueUserListItem: { default: null, type: cc.Node },
        ZhnjiDataItem: { default: null, type: cc.Node },
        ZhnjiDetailItem: { default: null, type: cc.Node },
        alertIcon: { default: null, type: cc.Node },
        alertItem: { default: null, type: cc.Node },
        ZhanjiInfoClubItem: { default: null, type: cc.Node },
        ZhanjiinfoUserItem: { default: null, type: cc.Node },
        zuanshiFafangItem: { default: null, type: cc.Node },
        zuanshiFafangFrame: { default: null, type: cc.Node },
        ConfirmFrame: { default: null, type: cc.Node },
        TuijianClubItem: { default: null, type: cc.Node },
		reconnctNode:{ default: null, type: cc.Node },

        _OpenedFirstFrame: null,
        _listener: null,
        _clubinfo: null,
        _headImage: null,
        _CurChangeMode: 0,
        _headSprite: null,
        _curLeagueData: null,
        _curLevel: 0,
        _curClubUsers: null,
        _curShenqingData: null,
        _issueGoldScript: null,
        _zhanjiScript: null,
        _IssueDiamondScript: null,
        _clubinfoNormal:0,//0:正常进   1搜索进
    },
	
	connect: function(){
        this.hideLoad();
        cc.vv.socket.addHandlers(events, this);
		this.autoLogin();
	},
	disconnect: function(){
		cc.vv.socket.reconnect();;
    },


    other_login_result: function (data) {
        cc.vv.alert._callBack = function () {
            cc.sys.localStorage.removeItem("UserName");
            cc.sys.localStorage.removeItem("UserPwd");
            console.log("清除用户信息");
            cc.vv.userMgr.userId = 0,
            cc.director.loadScene("login");
        }
        this.showAlert("您的账号在其他设备登录！");
    },

    gems_noten_result: function (event, arg) {
        this.showAlert("钻石不足！", null);
    },

    golds_noten_result: function (event, arg) {
        this.showAlert("金币不足！", null);
    },
	
    onLoad: function () {
        //BgColor:188,160,111
        if (!cc.sys.isNative && cc.sys.isMobile) {
            var cvs = this.node.getComponent(cc.Canvas);
            cvs.fitHeight = true;
            cvs.fitWidth = true;
        }
        if (!cc.vv) {
            cc.director.loadScene("start");
            return;
        }
        connectCount = 0;
        cc.vv.socket.connect(cc.vv.net.ip, this);
    },
	
    autoLogin: function () {
        cc.vv.gameNetMgr.AutoLogin();
    },

    getuserinfo_result: function (data) {
        cc.vv.userMgr.coins = data.iGolds;
        cc.vv.userMgr.gems = data.iGems;
        cc.vv.userMgr.iRoomId = data.iRoomId;
        cc.vv.userMgr.iClubId = data.iRoomClubId;
        cc.vv.userMgr.isVIP = data.bIsVIP;
        cc.vv.userMgr.vipEndTime = data.tmVipEndTime;
        this.showPrefab('Mine', this._DLG, function (node) {
            this._OpenedFirstFrame = node;
            node.$Mine.updateUserInfo();
        }.bind(this));
    },

    getlinkrooms_result: function (data) {
        if (this.m_nodeGameList) {
            this.m_nodeGameList.$GameList.setView(data)
        }
    },

    getaddjfusers_result : function (data) {
        if (this.m_nodeRequireEnter) {
            this.m_nodeRequireEnter.$RequireEnter.setView(data);
        }
        if (this.m_nodeGameList) {
            this.m_nodeGameList.$GameList._red_dot.active = data.pRetObjs.pUserObjs.length > 0;
        }
    },

    loginin_result: function (data) {
		this.hideLoad();
        if (data.wErrCode == 0) {
            //  this.showAlert(data.szErrMsg
			if(0 == connectCount) {
				connectCount++;
				this._clubinfo = this.SecondFrameParent.getChildByName("clubinfo").getComponent("ClubInfo");
				//this.initLabels();
				var self = this;
				
				if (cc.vv.userMgr.iRoomId != 0 && cc.vv.userMgr.iRoomId != null) {
					console.log(cc.vv.userMgr.iRoomId + "+++++++++++++++++++++++++********************");
					this.showLoad();
					this.scheduleOnce(function () {
						cc.vv.gameNetMgr._curClubId = cc.vv.userMgr.iClubId;
						this.ReEnterRoom(cc.vv.userMgr.iRoomId);
					}, 1);
				}

				if (cc.vv.userMgr.bExistClubAlert) {
					this.PaijuFrame.getChildByName("alert").active = true;
				}

				if (this._OpenedFirstFrame != null) {
					this._OpenedFirstFrame.active = false;
				}

				if (cc.vv.gameNetMgr._shouldJumpZhanjiFrame) {
					this.OnzhanjiBtnClick();
				} else {
                    this.OnpaijuBtnClick();
				}
			}else {
                console.log('第' + connectCount + '次进入');
            }
        } else {
            this.showAlert(data.szErrMsg);
        }
    },

    chgalias_result: function (data) {
        if (this.m_nodeChangeUserInfo) {
            this.m_nodeChangeUserInfo.$ChangeUserInfo.setView(data);
        }
    },

    addjifen_lailao_notify: function (data) {
        if (data.wErrCode == 0) {
            if (data.iCmd == 1) {
                cc.vv.audioMgr.playSFX("application.mp3");
                if (this.m_nodeGameList) {
                    this.m_nodeGameList.$GameList._red_dot.active = true;
                }
                if (this.m_nodeRequireEnter) {
                    this.m_nodeRequireEnter.$RequireEnter._red_dot.active = true;
                }
            } else {
                // cc.vv.audioMgr.playSFX("WaitOperation.mp3");
            }
        } else {
            this.showAlert(data.szErrMsg);
        }
    },

    getprivileges_result: function (data) {
        if (data.wErrCode == 0) {
            this.showPrefab('CreateRoom', this._SecDLG, function (node) {
                node.$CreateRoom.setLeagueID(data.allianceid);
            }.bind(this));
        } else {
            this.showAlert(data.szErrMsg);
        }
    },

    getsmscodejslm_result: function (data) {
        if (data.wErrCode == 0) {
            this.SecondFrameParent.getChildByName("leagueinfo").getChildByName("confirmJiesan").active = true;
        } else {
            this.showAlert(data.szErrMsg);
        }
    },

    openjc_result: function (data) {
        if (data.wErrCode == 0) {
            var check = this.LeagueParent.getChildByName("openjiangchi").getChildByName("flag").getComponent("CheckBox");
            check.SetChecked(data.bOpen);
            if (data.bOpen) {
                cc.vv.userMgr.gems = data.iGems;
            }
        } else {
            this.showAlert(data.szErrMsg);
        }
    },

    issuediamonddate_result: function (data) {
        if (data.wErrCode == 0) {
            this._IssueDiamondScript = this.SecondFrameParent.getChildByName("clubinfo").getChildByName("Zuanshidetail").getComponent("IssueDiamondDetail");
            if (data.rows.length == 0) {
                // this.showAlert("暂无发放数据");
                this._IssueDiamondScript.node.getChildByName("timeline").getComponent(cc.Label).string = cc.vv.gameNetMgr.dateFormatDay(null);
            }
            this._IssueDiamondScript.ActiveIssueDetail(data);
            this._IssueDiamondScript.node.active = true;
        } else {
            this.showAlert(data.szErrMsg);
        }
    },

    issuediamondlist_result: function (data) {
        if (data.wErrCode == 0) {
            this._IssueDiamondScript.InitDetail(data.rows);
        } else {
            this.showAlert(data.szErrMsg);
        }
    },

    issuediamond_result: function (data) {
        if (data.wErrCode == 0) {
            cc.vv.userMgr.gems -= parseInt(data.diamond);
            this.showAlert(data.szErrMsg);
        } else {
            this.showAlert(data.szErrMsg);
        }
    },

    setvip_result: function (data) {
        if (data.wErrCode == 0) {
            this._clubinfo.GetClubUser(data.memberid).isvip = data.isvip;
            if (data.isvip) {
                this.clubDataCountParent.getChildByName("setvip").children[0].getComponent(cc.Label).string = "取消会员";

            } else {
                this.clubDataCountParent.getChildByName("setvip").children[0].getComponent(cc.Label).string = "设置会员";
            }
        } else {
            this.showAlert(data.szErrMsg);
        }
    },

    chgpassword_result: function (data) {
        if (this.m_nodeModifyPsw || this.m_nodeModifyPsw.onEventHall) {
            this.m_nodeModifyPsw.$ModifyPsw.onEventHall(data);
        }
    },

    getsmscode_result: function (data) {
        if (data.wErrCode == 0) {
        } else {
            this.showAlert(data.szErrMsg);
        }
    },

    upimage_result: function (data) {
        console.log("uploadResult44444444444444444444444444444");
        console.log(data.iMode);
        console.log(data.szUrl);
        console.log("uploadResult55555555555555555555555555555");
    },

    alertgolds_result: function (data) {
        if (data.wErrCode == 0) {
            this._clubinfo._clubData.iAlertGolds = data.golds;
            this.SecondFrameParent.getChildByName("clubinfo").getChildByName("jijin").getChildByName("yujingFrame").active = false;
            this.SecondFrameParent.getChildByName("clubinfo").getChildByName("jijin").getChildByName("yujingFrame").getChildByName("yujing").getComponent(cc.Label).string = this._clubinfo._clubData.iAlertGolds;
            this.showAlert("设置成功！");
        } else {
            this.showAlert(data.szErrMsg);
        }
    },

    alertgoldsmsg_result: function (data) {
        if (!cc.vv.userMgr.bExistClubAlert) {
            cc.vv.userMgr.bExistClubAlert = true;
            this.PaijuFrame.getChildByName("alert").active = true;
            return;
        }

        if (data.wErrCode == 0) {
            if (data.rows.length > 0) {
                this.PaijuFrame.getChildByName("alert").active = false;
                for (var i = 1; i < this.alertItem.parent.children.length; i++) {
                    this.alertItem.parent.children[i].destroy();
                }
                for (var i = 0; i < data.rows.length; i++) {
                    var item = cc.instantiate(this.alertItem);
                    item.parent = this.alertItem.parent;
                    item.getChildByName("info").getChildByName("clubname").getComponent(cc.Label).string = data.rows[i].clubname;
                    item.getChildByName("info").getChildByName("alertgolds").getComponent(cc.Label).string = data.rows[i].alertgolds;
                    item.getChildByName("time").getComponent(cc.Label).string = data.rows[i].ctime;
                    item.parent.active = true;
                }
                this.PaijuFrame.getChildByName("yujingFrame").active = true;
            }
        } else {
            this.showAlert(data.szErrMsg);
        }
    },

    // zhanjilist_result: function (data) {
    //     if (data.wErrCode == 0) {
    //         this._zhanjiScript.InitDetail(data.rows);
    //     } else {
    //         this.showAlert(data.szErrMsg);
    //     }
    // },

    // zhanjidate_result: function (data) {
    //     if (data.rows.length == 0) {
    //         this.zhanjiFrame.getChildByName("timeline").getComponent(cc.Label).string = cc.vv.gameNetMgr.dateFormatDay(null);
    //     }
    //     this._zhanjiScript = this.zhanjiFrame.getComponent("Zhanji");
    //     this.zhanjiFrame.getChildByName("zongjushu").getComponent(cc.Label).string = data.iGameTimes;
    //     this.zhanjiFrame.getChildByName("zongshoushu").getComponent(cc.Label).string = data.iPlayTimes;
    //     this._zhanjiScript.ActiveIssueDetail(data);
    //     this._zhanjiScript.node.active = true;
    // },

    issuedate_result: function (data) {
        this._issueGoldScript = this.SecondFrameParent.getChildByName("clubinfo").getChildByName("jijindetail").getComponent("IssueGoldsDetail");
        if (data.rows.length == 0) {
            // this.showAlert("暂无发放数据");
            this._issueGoldScript.node.getChildByName("timeline").getComponent(cc.Label).string = cc.vv.gameNetMgr.dateFormatDay(null);
        }
        this._issueGoldScript.ActiveIssueDetail(data);
        this._issueGoldScript.node.active = true;
    },

    getmyzjlogs_result: function (data) {

    },

    buyvip_result: function (data) {
        if (data.wErrCode == 0) {
            cc.vv.userMgr.isVIP = true;
            this.showAlert(data.szErrMsg);
            // this.RefreshVipInfo();
        } else {
            this.showAlert(data.szErrMsg);
        }
    },

    RefreshVipInfo: function () {
        if (cc.vv.userMgr.isVIP) {
            this.MineFrame.getChildByName("vip").getChildByName("vip").active = true;
            this.MineFrame.getChildByName("vip").getChildByName("notvip").active = false;
            if (cc.vv.userMgr.vipEndTime == 0) {
                this.MineFrame.getChildByName("vip").getChildByName("viplbl").getComponent(cc.Label).string = "";
            } else {
                this.MineFrame.getChildByName("vip").getChildByName("viplbl").getComponent(cc.Label).string = cc.vv.gameNetMgr.dateFormatDay(cc.vv.userMgr.vipEndTime);
            }
            
            this.SecondFrameParent.getChildByName("shop").getChildByName("vip").getChildByName("vip").active = true;
            this.SecondFrameParent.getChildByName("shop").getChildByName("vip").getChildByName("notvip").active = false;
            if (cc.vv.userMgr.vipEndTime == 0) {
                this.SecondFrameParent.getChildByName("shop").getChildByName("vip").getChildByName("viplbl").getComponent(cc.Label).string = "";
            } else {
                this.SecondFrameParent.getChildByName("shop").getChildByName("vip").getChildByName("viplbl").getComponent(cc.Label).string = cc.vv.gameNetMgr.dateFormatDay(cc.vv.userMgr.vipEndTime);
            }

        } else {
            //this.MineFrame.getChildByName("vip").getChildByName("vip").active = true;
            //this.MineFrame.getChildByName("vip").getChildByName("novip").active = false;
            //if (cc.vv.userMgr.endTIme == 0) {
            //    this.MineFrame.getChildByName("vip").getChildByName("viplbl").getComponent(cc.Label).string = "";
            //} else {
            //    this.MineFrame.getChildByName("vip").getChildByName("viplbl").getComponent(cc.Label).string = cc.vv.gameNetMgr.dateFormatDay(cc.vv.userMgr.endTIme);
            //}
        }
    },

    mymsg_result: function (data) {
        if (data.wErrCode == 0) {
            this._mineRed.active = true;
            this.WoFrameParent.getChildByName("message").getChildByName("red_dot").active = true;
        } else {
            this.showAlert(data.szErrMsg);
        }
    },

    mymessage_result: function (data) {
        if (data.wErrCode == 0) {
            this.OpenmessageFrame();
            if (data.rows.length == 0) {
                this.MessageFrame.getChildByName("none").active = true;
            } else {
                this.MessageFrame.getChildByName("none").active = false;
                for (var i = 1; i < this.MessageItem.parent.children.length; i++) {
                    this.MessageItem.parent.children[i].destroy();
                }
                for (var i = 0; i < data.rows.length; i++) {
                    var item = cc.instantiate(this.MessageItem);
                    item.parent = this.MessageItem.parent;
                    item.getChildByName("date").getComponent(cc.Label).string = cc.vv.gameNetMgr.dateFormatFull(data.rows[i].ctime);
                    item.getChildByName("info").getComponent(cc.Label).string = JSON.parse(data.rows[i].title);
                    item.getChildByName("msg").getComponent(cc.Label).string = JSON.parse(data.rows[i].msgs);
                    item.active = true;
                }
                this.MessageItem.parent.height = (this.MessageItem.height + 10) * data.rows.length;
            }
        } else {
            this.showAlert(data.szErrMsg);
        }
    },

    issuegold_result: function (data) {
        if (data.wErrCode == 0) {
            this._clubinfo._clubData.iGolds -= parseInt(data.gold);
            this.showAlert(data.szErrMsg);
        } else {
            this.showAlert(data.szErrMsg);
        }
    },

    rechargegold_result: function (data) {
        if (data.wErrCode == 0) {
            this.showAlert(data.szErrMsg);
            this._clubinfo._clubData.iGolds = data.golds;
            cc.vv.userMgr.gems = data.diamondleft;
            this.SecondFrameParent.getChildByName("clubinfo").getChildByName("chongzhijijin").getChildByName("jijin").getComponent(cc.Label).string = data.golds;
            this._clubinfo.MakeJijinDisPlay();
        } else {
            this.showAlert(data.szErrMsg);
        }
    },

    issuegoldlist_result: function (data) {
        if (data.wErrCode == 0) {
            this._issueGoldScript.InitDetail(data.rows);
        } else {
            this.showAlert(data.szErrMsg);
        }
    },

    dairulist_result: function (data) {
        if (data.wErrCode == 0) {
        } else {
            this.showAlert(data.szErrMsg);
        }
    },

    GetMgrMsgs: function () {
        this.node.getChildByName("liuzhuoFrame").getChildByName("refresh").children[0].active = false;
        cc.vv.socket.send("getaddjfusers", { iRoomId: 0 });
    },

    updateclubusermemo_result: function (data) {
        if (data.wErrCode == 0) {
            this.SecondFrameParent.getChildByName("Clubuserlist").getChildByName("datacount").getChildByName("changejieshao").active = false;
        } else {
            this.showAlert(data.szErrMsg);
        }
    },

    getuserginfo_result: function (data) {
        if (data.wErrCode == 0) {
            this.showPrefab('DataCount', this._SecDLG, function (node) {
                node.$DataCount.setView(data);
            })
        } else {
            this.showAlert(data.szErrMsg);
        }
    },

    updateclubmemo_result: function (data) {
        if (data.wErrCode == 0) {
            this.SecondFrameParent.getChildByName("clubinfo").getChildByName("changejieshao").active = false;
            cc.vv.socket.send("getgclubinfo", { iClubId: this._clubinfo._clubData.iClubId });
        } else {
            this.showAlert(data.szErrMsg);
        }
    },

    setalliancememo_result: function (data) {
        if (data.wErrCode == 0) {
            this.SecondFrameParent.getChildByName("clubinfo").getChildByName("leagueinfo").getChildByName("changejieshao").active = false;
            this._clubinfo.OpenClubLianMengFrame();
        } else {
            this.showAlert(data.szErrMsg);
        }
    },

    refuseclub_result: function () {

    },

    approveclub_result: function () {

    },

    getallianceinfo_result: function (data) {
        this._curLeagueData = data;
        this._clubinfo._curLeagueData = data;
        var leagueFrame = this.SecondFrameParent.getChildByName("leagueinfo");
        this.LeagueParent.getChildByName("leagueinfo").getChildByName("leaguename").getComponent(cc.Label).string = data.sname;
        this.LeagueParent.getChildByName("leagueinfo").getChildByName("leagueid").getComponent(cc.Label).string = "ID:" + data.allianceid;
        this.LeagueParent.getChildByName("leagueinfo").getChildByName("id").getComponent(cc.Label).string = data.allianceid;
        this.LeagueParent.getChildByName("level").getChildByName("level").getComponent(cc.Label).string = "LV." + data.levels;
        this.LeagueParent.getChildByName("Mgr").getChildByName("renNum").getComponent(cc.Label).string = data.mgrcount + "/" + data.maxmgrcount;
        this.LeagueParent.getChildByName("member").getChildByName("renNum").getComponent(cc.Label).string = data.clubcount + "/" + data.maxclubcount;
        this.LeagueParent.getChildByName("jieshoushenqing").getChildByName("flag").getComponent("CheckBox").SetChecked(data.allow_apply);
        this.LeagueParent.getChildByName("openjiangchi").getChildByName("flag").getComponent("CheckBox").SetChecked(data.jcopen);
        if (data.memo == null) {
            data.memo = "";
        }
        this.LeagueParent.getChildByName("jieshao").getChildByName("jieshao").getComponent(cc.Label).string = data.memo;
        this.LeagueParent.getChildByName("jieshao").getChildByName("createtime").getComponent(cc.Label).string = cc.vv.gameNetMgr.dateFormatFull(data.ctime);
        if (data.iscreator) {
            leagueFrame.getChildByName("jiesanLeague").active = true;
            leagueFrame.getChildByName("tuichuLeague").active = false;
        } else {
            if (this._clubinfo._clubData.iCreator == cc.vv.userMgr.userId) {
                leagueFrame.getChildByName("jiesanLeague").active = false;
                leagueFrame.getChildByName("tuichuLeague").active = true;
            } else {
                leagueFrame.getChildByName("jiesanLeague").active = false;
                leagueFrame.getChildByName("tuichuLeague").active = false;
            }
        }
        leagueFrame.getComponent("CloseFrame")._ParentFrame = this.SecondFrameParent.getChildByName("clubinfo");
        this.SecondFrameParent.getChildByName("clubinfo").active = false;
        leagueFrame.active = true;
    },

    upgradalliance_result: function (data) {
        if (data.wErrCode == 0) {
            this.SecondFrameParent.getChildByName("clubinfo").getChildByName("leagueinfo").getChildByName("level").active = false;
            this._clubinfo.OpenClubLianMengFrame();
        } else {
            this.showAlert(data.szErrMsg);
        }
    },

    kickalliance_result: function (data) {
        if (data.wErrCode == 0) {
            //this._clubinfo.DelClubUser(data.userid);
            this.Getalliancemember();
        } else {
            this.showAlert(data.szErrMsg);
        }
    },
    exitalliance_result: function (data) {
        this.SecondFrameParent.getChildByName("leagueinfo").active = false;
        this._clubinfo._clubData.iAllianceid = 0;
        this._clubinfo._clubData.alliancename = "";
        var data = {
            iUserId: cc.vv.userMgr.userId,
            iClubId: this._clubinfo._clubData.iClubId,
        };
        cc.vv.socket.send("getgclubinfo", data);
    },

    setallianceadmin_result: function (data) {
        if (data.allow) {
            this._clubinfo.GetClubUser(data.memberid).alliancelevel = 1;
        } else {
            this._clubinfo.GetClubUser(data.memberid).alliancelevel = 2;
        }
    },

    approvealliance_result: function (data) {

    },

    applyalliance_result: function (data) {
        if (data.wErrCode == 0) {
            this.SecondFrameParent.getChildByName("clubinfo").getChildByName("league").getChildByName("joinleague").active = false;
            this.SecondFrameParent.getChildByName("clubinfo").getChildByName("league").active = false;
        } else {
            this.showAlert(data.szErrMsg);
        }

        //cc.vv.socket.send("getallianceinfo", { allianceid: data.allianceid });
        //this._clubinfo._clubData.iAllianceid = data.allianceid;
    },

    //isadmin 2创建者 1 管理员   0普通成员
    getalliancemember_result: function (data) {

        for (var i = 1; i < this.leagueClubItem.parent.children.length; i++) {
            this.leagueClubItem.parent.children[i].destroy();
        }
        var member = this.SecondFrameParent.getChildByName("leagueinfo").getChildByName("member");
        for (var i = 0; i < data.rows.length; i++) {
            var item = cc.instantiate(this.leagueClubItem);
            item.parent = this.leagueClubItem.parent;
            item.getChildByName("ClubiconMask").children[0].getComponent("LoadImage").LoadClubIcon(data.rows[i].clubid);
            item.getChildByName("clubname").getComponent(cc.Label).string = data.rows[i].sname;
            item.getChildByName("clubid").getComponent(cc.Label).string = data.rows[i].clubid;
            item.getChildByName("uid").getComponent(cc.Label).string = data.rows[i].uid;
            if (data.rows[i].isadmin == 0) {
                item.getChildByName("tichu").active = true;
            }
            item.active = true;
        }
        this.leagueClubItem.parent.height = (this.leagueClubItem.height + 3) * data.rows.length;
        member.active = true;
    },


    createalliance_result: function (data) {
        if (data.wErrCode != 0) {
            this.showAlert(data.szErrMsg);
            return;
        }
        this.SecondFrameParent.getChildByName("clubinfo").getChildByName("league").active = false;
        this.SecondFrameParent.getChildByName("clubinfo").getChildByName("league").getChildByName("createleague").active = false;
        cc.vv.socket.send("getallianceinfo", { allianceid: data.iAllianceid });
        this._clubinfo._clubData.iAllianceid = data.iAllianceid;
    },


    allowapply_result: function (data) {
        // cc.vv.socket.send("getallianceinfo", { allianceid: data.iAllianceid });
    },

    dissolvedalliance_result: function (data) {
        this.SecondFrameParent.getChildByName("clubinfo").getChildByName("leagueinfo").active = false;
        this._clubinfo._clubData.iAllianceid = 0;
        this._clubinfo._clubData.alliancename = "";
        var data = {
            iUserId: cc.vv.userMgr.userId,
            iClubId: this._clubinfo._clubData.iClubId,
        };
        cc.vv.socket.send("getgclubinfo", data);
    },

    upgradclub_result: function (data) {
        if (data.wErrCode == 0) {
            this.SecondFrameParent.getChildByName("clubinfo").getChildByName("level").active = false;
            var data = {
                iUserId: cc.vv.userMgr.userId,
                iClubId: this._clubinfo._clubData.iClubId,
            };
            cc.vv.socket.send("getgclubinfo", data);
        } else {
            this.showAlert(data.szErrMsg);
        }
    },

    newmsg_result: function (data) {
        this._ClubRed.active = true;;
    },

    getroominfo_result: function (data) {

    },

    chgclubname_result: function (data) {
        this.SecondFrameParent.getChildByName("changeClubInfo").active = false;
        this.getgclubinfo_result(data);
    },


    getclubumjs_result: function (data) {

    },

    createroom_result: function (data) {
        if (data.wErrCode != 0) {
            this.showAlert(data.szErrMsg);
            return;
        }
        cc.vv.socket.send("getclubrooms", { iClubId: data.iClubId });
        this.m_nodeCreateRoom.active = false;
    },

    InitClubUesrSotFun: function () {
        console.log("InitClubUesrSotFun");
        var titleParent = this.SecondFrameParent.getChildByName("Clubuserlist").getChildByName("titles");
        var self = this;
        titleParent.children[0].getComponent("CheckBox")._func = function (check) {
            self.ProcessClubUserSortTitle(0, check);
        }

        titleParent.children[1].getComponent("CheckBox")._func = function (check) {
            self.ProcessClubUserSortTitle(1, check);
        }

        titleParent.children[2].getComponent("CheckBox")._func = function (check) {
            self.ProcessClubUserSortTitle(2, check);
        }

        titleParent.children[3].getComponent("CheckBox")._func = function (check) {
            self.ProcessClubUserSortTitle(3, check);
        }
    },

    ProcessClubUserSortTitle: function (index, flag) {
        console.log(index, flag);
        var titleParent = this.SecondFrameParent.getChildByName("Clubuserlist").getChildByName("titles");
        if (index == 0) {
            titleParent.children[0].getChildByName("fg").active = false;
            titleParent.children[1].getChildByName("fg").active = true;
            titleParent.children[2].getChildByName("fg").active = true;
            titleParent.children[3].getChildByName("fg").active = true;

            if (flag) {
                this._clubinfo._clubUserInfo.rows.sort(function (a, b) {
                    var temp = 0;
                    if (a.clublevel === b.clublevel) {
                        temp = b.online - a.online;
                        if (a.online === b.online) {
                            temp = b.lastlogintime - a.lastlogintime
                        }
                    } else {
                        temp = a.clublevel - b.clublevel
                    }
                    return temp;
                });
            } else {
                this._clubinfo._clubUserInfo.rows.sort(function (a, b) {
                    var temp = 0;
                    if (a.clublevel === b.clublevel) {
                        temp = a.online - b.online;
                        if (b.online === a.online) {
                            temp = a.lastlogintime - b.lastlogintime
                        }
                    } else {
                        temp = a.clublevel - b.clublevel
                    }
                    return temp;
                });
            }
        } else if (index == 1) {
            titleParent.children[0].getChildByName("fg").active = true;
            titleParent.children[1].getChildByName("fg").active = false;
            titleParent.children[2].getChildByName("fg").active = true;
            titleParent.children[3].getChildByName("fg").active = true;
            if (flag) {
                this._clubinfo._clubUserInfo.rows.sort(function (a, b) {
                    return a.yuejushu - b.yuejushu;
                });
            } else {
                this._clubinfo._clubUserInfo.rows.sort(function (a, b) {
                    return b.yuejushu - a.yuejushu;
                });
            }
        } else if (index == 2) {
            titleParent.children[0].getChildByName("fg").active = true;
            titleParent.children[1].getChildByName("fg").active = true;
            titleParent.children[2].getChildByName("fg").active = false;
            titleParent.children[3].getChildByName("fg").active = true;
            if (flag) {
                this._clubinfo._clubUserInfo.rows.sort(function (a, b) {
                    return a.zongjushu - b.zongjushu;
                });
            } else {
                this._clubinfo._clubUserInfo.rows.sort(function (a, b) {
                    return b.zongjushu - a.zongjushu;
                });
            }
        } else if (index == 3) {
            titleParent.children[0].getChildByName("fg").active = true;
            titleParent.children[1].getChildByName("fg").active = true;
            titleParent.children[2].getChildByName("fg").active = true;
            titleParent.children[3].getChildByName("fg").active = false;
            if (flag) {
                this._clubinfo._clubUserInfo.rows.sort(function (a, b) {
                    return a.changjun - b.changjun;
                });
            } else {
                this._clubinfo._clubUserInfo.rows.sort(function (a, b) {
                    return b.changjun - a.changjun;
                });
            }
        }
        var userlist = this.SecondFrameParent.getChildByName("Clubuserlist");
        userlist.active = true;
        userlist.getComponent("CloseFrame")._ParentFrame = this.SecondFrameParent.getChildByName("clubinfo");
        this.SecondFrameParent.getChildByName("clubinfo").active = false;

        //this.ShowMask();
        //this.scheduleOnce(function () {
        //    this.InitClbuUser();
        userlist.getChildByName("New ScrollView").getComponent("ScrollExt").InitScrollData(this._clubinfo._clubUserInfo);
        //}, 0.05);
    },

    InitClbuUser: function () {
        var userlist = this.SecondFrameParent.getChildByName("Clubuserlist");
        userlist.active = true;
        var data = this._clubinfo._clubUserInfo;
        for (var i = 1; i < this.clubUserItem.parent.children.length; i++) {
            this.clubUserItem.parent.children[i].destroy();
        }
        for (var i = 0; i < data.rows.length; i++) {
            var item = cc.instantiate(this.clubUserItem);
            item.parent = this.clubUserItem.parent;
            item.getChildByName("name").getComponent(cc.Label).string = data.rows[i].alias;
            item.getChildByName("iconMask").children[0].getComponent("LoadImage").LoadUserIcon(data.rows[i].userid);
            item.getChildByName("userid").getComponent(cc.Label).string = data.rows[i].userid;
            item.getChildByName("month").getComponent(cc.Label).string = data.rows[i].yuejushu;
            item.getChildByName("total").getComponent(cc.Label).string = data.rows[i].zongjushu;
            if (data.rows[i].clublevel == 0) {
                item.getChildByName("creator").active = true;
            } else if (data.rows[i].clublevel == 1) {
                item.getChildByName("mgr").active = true;
            }

            if (data.rows[i].changjun >= 0) {
                item.getChildByName("averagelose").active = false;
                item.getChildByName("averagewin").getComponent(cc.Label).string = parseInt(data.rows[i].changjun);
            } else {
                item.getChildByName("averagewin").active = false;
                item.getChildByName("averagelose").getComponent(cc.Label).string = parseInt(data.rows[i].changjun);
            }
            if (data.rows[i].online) {
                item.getChildByName("lasttime").color = new cc.Color(60, 255, 60);
                item.getChildByName("lasttime").getComponent(cc.Label).string = "在线";
            } else {
                item.getChildByName("lasttime").color = new cc.Color(100, 100, 100);
                item.getChildByName("lasttime").getComponent(cc.Label).string = cc.vv.gameNetMgr.GetStrByNowFrameDate(data.rows[i].lastlogintime);
            }
            this.clubUserItem.parent.height = (this.clubUserItem.height + 2) * data.rows.length;
            item.active = true;
        }
        userlist.getChildByName("New ScrollView").getComponent(cc.ScrollView).scrollToTop();

       
    },

    getgclubinfo_result: function (data) {
        if (data.wErrCode == 0) {
            this.showPrefab('ClubInfo', this._SecDLG, function (node) {
                node.$ClubInfo.InitClubInfo(data);
            })
        } else {
            this.showAlert(data.szErrMsg);
        }
    },

    //用户消息
    getgclubmsgs_result: function (data) {

    },

    searchgclubinfo_result: function (data) {
        if (data.wErrCode == 0) {
            this.showPrefab('ClubInfo', this._SecDLG, function (node) {
                node.$ClubInfo.InitClubInfo(data);
            })
        } else {
            this.showAlert(data.szErrMsg);
        }
    },


    OnGongGaoBtnClick: function () {
        this.PlayBtnSound();
        if (this._OpenedFirstFrame != null) {
            this._OpenedFirstFrame.active = false;
        }
        this.showPrefab('Notice', this._DLG, function (node) {
            this._OpenedFirstFrame = node;
        }.bind(this));
    },

    OnClubBtnClick: function (event, arg) {
        this.PlayBtnSound();

        if (this._OpenedFirstFrame != null) {
            this._OpenedFirstFrame.active = false;
        }
        this.showPrefab('Club', this._DLG, function (node) {
            this._OpenedFirstFrame = node;
        }.bind(this));
    },

    OnpaijuBtnClick: function () {
        this.PlayBtnSound();
        if (this._OpenedFirstFrame != null) {
            this._OpenedFirstFrame.active = false;
        }
        this.showPrefab('GameList', this._DLG, function (node) {
            this._OpenedFirstFrame = node;
        }.bind(this))
    },

    OnzhanjiBtnClick: function () { 
        this.PlayBtnSound();
        if (this._OpenedFirstFrame != null) {
            this._OpenedFirstFrame.active = false;
        }
        this.showPrefab('Record', this._DLG, function (node) {
            this._OpenedFirstFrame = node;
        }.bind(this));
    },

    OnMineBtnClick: function () {
        //this.PlayBtnSound();
        if (this._OpenedFirstFrame != null) {
            this._OpenedFirstFrame.active = false;
        }
        cc.vv.socket.send("getuserinfo", { iUserId: cc.vv.userMgr.userId });
        // this.RefreshVipInfo();

    },

    initUserInfo: function () {
        this.PlayBtnSound();
        this.MineFrame.getChildByName("id").getComponent(cc.Label).string = "ID:"+cc.vv.userMgr.userId;
        this.MineFrame.getChildByName("name").getComponent(cc.Label).string = cc.vv.userMgr.userName;
        this.MineFrame.getChildByName("zuanshi").children[0].getComponent(cc.Label).string = cc.vv.userMgr.gems;
        this.MineFrame.getChildByName("golds").children[0].getComponent(cc.Label).string = cc.vv.userMgr.coins;
        this.MineFrame.getChildByName("iconMask").children[0].getComponent("LoadImage").LoadUserIcon(cc.vv.userMgr.userId);
    },

    OnClubClickGetClubRooms: function (event, arg) {
        var clubid = event.target.getChildByName("clubid").getComponent(cc.Label).string;
        //获取俱乐部房间列表
    },


    OnCreateRoom: function (event, arg) {
        this.PlayBtnSound();
        var createScript = event.target.parent.getComponent("CreateCXRoom");
        var data = createScript.GetCreateRoomData();
        console.log(data);
        if (data == null) {
            return;
        }
        cc.vv.socket.send("createroom", data);
    },

    OnJoinTuiJianClub: function (event, arg) {
        this.PlayBtnSound();
        var clubid = event.target.parent.getChildByName("")

        var data = {
            //iUserId: cc.vv.userMgr.userId,
            //iClubId:
        };
        cc.vv.socket.send("joinclub", data);
    },

    OnJoinClub: function (event, arg) {
        this.PlayBtnSound();
        var clubid = event.target.parent.getChildByName("clubid").getComponent(cc.Label).string;
        var data = {
            iUserId: cc.vv.userMgr.userId,
            iClubId: clubid,
        };
        cc.vv.socket.send("joinclub", data);
    },

    OnQuitClub: function (event, arg) {

        var confirmScript = this.ConfirmFrame.getComponent("ConfrmFrame");
        var self = this;
        confirmScript.SetConfirmInfo("退出俱乐部", "确定退出该俱乐部", "退出", function () {
            self.PlayBtnSound();
            var clubid = self._clubinfo._clubData.iClubId;
            var data = {
                iUserId: cc.vv.userMgr.userId,
                iClubId: clubid,
            };
            cc.vv.socket.send("exitgclub", data);
        });

    },


    OnTuiChuLianMeng: function (event, arg) {

        var confirmScript = this.ConfirmFrame.getComponent("ConfrmFrame");
        var self = this;
        confirmScript.SetConfirmInfo("退出联盟", "确定退出该联盟", "退出", function () {
            self.PlayBtnSound();
            cc.vv.socket.send("exitalliance", { allianceid: self._clubinfo._clubData.iAllianceid });
        });
    },

    ShowJieSanClubConfirm: function () {
        var confirmScript = this.ConfirmFrame.getComponent("ConfrmFrame");
        var self = this;
        confirmScript.SetConfirmInfo("解散俱乐部", "确定解散该俱乐部", "解散", function () {
            self.OnJieSanClub();
        });
    },

    OnJieSanClub: function (event, arg) {
        this.PlayBtnSound();
        var clubid = this._clubinfo._clubData.iClubId;
        var data = {
            iUserId: cc.vv.userMgr.userId,
            iClubId: clubid,
        };
        cc.vv.socket.send("delgblub", data);
    },
    //-------------second

    OpenPaipuFrame: function () {
        this.PlayBtnSound();
        this.SecondFrameParent.getChildByName("wodepaipu").active = true;
    },

    OpenmessageFrame: function () {
        this.PlayBtnSound();
        this.SecondFrameParent.getChildByName("message").active = true;
    },

    OpenZhanjiDetailFrame: function (event,arg) {
        this.PlayBtnSound();
        var id = event.target.parent.getChildByName("uuid").getComponent(cc.Label).string;
        var info = this._zhanjiScript.GetDataFromLastDataByRoomUUID(id);
        console.log(info);
        var details = JSON.parse(info.details);
        console.log(details);
        var zhanjiInfo = this.SecondFrameParent.getChildByName("zhanjiinfo");
        zhanjiInfo.getChildByName("roomuuid").getComponent(cc.Label).string = info.roomuuid;
        zhanjiInfo.getChildByName("nameinfo").getChildByName("name").getComponent(cc.Label).string = info.roomname;
        zhanjiInfo.getChildByName("nameinfo").getChildByName("clubname").getComponent(cc.Label).string = "(" + info.clubname + ")";
        zhanjiInfo.getChildByName("paijuinfo").getChildByName("timelbl").children[0].getComponent(cc.Label).string = info.shichang / 60 + "h";
        zhanjiInfo.getChildByName("paijuinfo").getChildByName("pi").children[0].getComponent(cc.Label).string = info.dipi;
        zhanjiInfo.getChildByName("paijuinfo").getChildByName("shoushu").children[0].getComponent(cc.Label).string = info.zongshoushu;
        zhanjiInfo.getChildByName("paijuinfo").getChildByName("dairu").children[0].getComponent(cc.Label).string = info.zongdairu;
        zhanjiInfo.getChildByName("timestart").getComponent(cc.Label).string = cc.vv.gameNetMgr.dateFormatHM(info.ctime);

        for (var i = 2; i < this.ZhanjiInfoClubItem.parent.children.length; i++) {
            this.ZhanjiInfoClubItem.parent.children[i].destroy();
        }

        var ismagr = false;
        if (details.clubList.length > 0) {
            ismagr = true;
        }
        if (details.clubList.length >= 2) {
            details.clubList.sort(function (a, b) {
                return b.shuying - a.shuying;
            });
            for (var j = 0; j < details.clubList.length; j++) {
                var item = cc.instantiate(this.ZhanjiInfoClubItem);
                item.parent = this.ZhanjiInfoClubItem.parent;
                item.getChildByName("clubname").getComponent(cc.Label).string = details.clubList[j].clubname;
                if (j % 2 == 0) {
                    item.getChildByName("whitebg").color = new cc.Color(30, 30, 30);
                } else
                {
                    item.getChildByName("whitebg").color = new cc.Color(18, 18, 18);
                }

                if (details.clubList[j].shuying > 0) {
                    item.getChildByName("scoreying").active = true;
                    item.getChildByName("scoreying").getComponent(cc.Label).string = "+"+details.clubList[j].shuying;
                } else {
                    item.getChildByName("scoreshu").active = true;
                    item.getChildByName("scoreshu").getComponent(cc.Label).string = details.clubList[j].shuying;
                }
                item.active = true;
            }
        }
       // this.ZhanjiInfoClubItem.parent.height = this.ZhanjiInfoClubItem * details.clubList.length;

        var big = 0;
        var small = 0;
        var bigindex = 0;
        var smallindex = 0;
        var dairu = 0;
        var dairuIndex = 0; 


        for (var j = 0; j < details.userList.length; j++) {
            var item = cc.instantiate(this.ZhanjiinfoUserItem);
            item.parent = this.ZhanjiInfoClubItem.parent;
            item.getChildByName("name").getComponent(cc.Label).string = details.userList[j].alias+ "(" + details.userList[j].userid + ")";
            item.getChildByName("dairu").getComponent(cc.Label).string = "带入:" + details.userList[j].jifendr;
            if (ismagr) {
                item.getChildByName("clubname").getComponent(cc.Label).string = details.userList[j].clubname;
            } else {
                item.getChildByName("clubname").getComponent(cc.Label).string = "";
            }
            item.getChildByName("iconMask").children[0].getComponent("LoadImage").LoadUserIcon(details.userList[j].userid);
            if (details.userList[j].jifendr > dairu) {
                dairu = details.userList[j].jifendr;
                dairuIndex = j;
            }
            if (details.userList[j].shuying > 0) {
                item.getChildByName("scoreying").active = true;
                item.getChildByName("scoreying").getComponent(cc.Label).string = "+"+details.userList[j].shuying;
                if (details.userList[j].shuying > big) {
                    big = details.userList[j].shuying;
                    bigindex = j;
                }
            } else {
                item.getChildByName("scoreshu").active = true;
                item.getChildByName("scoreshu").getComponent(cc.Label).string = details.userList[j].shuying;
                if (details.userList[j].shuying < small) {
                    small = details.userList[j].shuying;
                    smallindex = j;
                }
            }
            item.active = true;
        }
        this.ZhanjiInfoClubItem.parent.height = details.userList.length * this.ZhanjiinfoUserItem.height + this.ZhanjiInfoClubItem.height * details.clubList.length;
        zhanjiInfo.getChildByName("userinfo").getChildByName("mvp").getChildByName("name").getComponent(cc.Label).string = details.userList[bigindex].alias;
        zhanjiInfo.getChildByName("userinfo").getChildByName("mvp").getChildByName("iconMask").children[0].getComponent("LoadImage").LoadUserIcon(details.userList[bigindex].userid);
        zhanjiInfo.getChildByName("userinfo").getChildByName("dayu").getChildByName("name").getComponent(cc.Label).string = details.userList[smallindex].alias;
        zhanjiInfo.getChildByName("userinfo").getChildByName("dayu").getChildByName("iconMask").children[0].getComponent("LoadImage").LoadUserIcon(details.userList[smallindex].userid);
        zhanjiInfo.getChildByName("userinfo").getChildByName("tuhao").getChildByName("name").getComponent(cc.Label).string = details.userList[dairuIndex].alias;
        zhanjiInfo.getChildByName("userinfo").getChildByName("tuhao").getChildByName("iconMask").children[0].getComponent("LoadImage").LoadUserIcon(details.userList[dairuIndex].userid);
        zhanjiInfo.active = true;
    },

    AutoOpenZhanjiDetailFrame: function (UUID) {
        this.PlayBtnSound();
        var id = UUID;
        var info = this._zhanjiScript.GetDataFromLastDataByRoomUUID(id);
        console.log(info);
        var details = JSON.parse(info.details);
        console.log(details);
        var zhanjiInfo = this.SecondFrameParent.getChildByName("zhanjiinfo");
        zhanjiInfo.getChildByName("roomuuid").getComponent(cc.Label).string = info.roomuuid;
        zhanjiInfo.getChildByName("nameinfo").getChildByName("name").getComponent(cc.Label).string = info.roomname;
        zhanjiInfo.getChildByName("nameinfo").getChildByName("clubname").getComponent(cc.Label).string = "(" + info.clubname + ")";
        zhanjiInfo.getChildByName("paijuinfo").getChildByName("timelbl").children[0].getComponent(cc.Label).string = info.shichang / 60 + "h";
        zhanjiInfo.getChildByName("paijuinfo").getChildByName("pi").children[0].getComponent(cc.Label).string = info.dipi;
        zhanjiInfo.getChildByName("paijuinfo").getChildByName("shoushu").children[0].getComponent(cc.Label).string = info.zongshoushu;
        zhanjiInfo.getChildByName("paijuinfo").getChildByName("dairu").children[0].getComponent(cc.Label).string = info.zongdairu;
        zhanjiInfo.getChildByName("timestart").getComponent(cc.Label).string = cc.vv.gameNetMgr.dateFormatHM(info.ctime);

        for (var i = 2; i < this.ZhanjiInfoClubItem.parent.children.length; i++) {
            this.ZhanjiInfoClubItem.parent.children[i].destroy();
        }

        

        if (details.clubList.length >= 2) {

            details.clubList.sort(function (a, b) {
                return b.shuying - a.shuying;
            });

            for (var j = 0; j < details.clubList.length; j++) {
                var item = cc.instantiate(this.ZhanjiInfoClubItem);
                item.parent = this.ZhanjiInfoClubItem.parent;
                item.getChildByName("clubname").getComponent(cc.Label).string = details.clubList[j].clubname;
                if (details.clubList[j].shuying > 0) {
                    item.getChildByName("scoreying").active = true;
                    item.getChildByName("scoreying").getComponent(cc.Label).string = "+" +details.clubList[j].shuying;
                } else {
                    item.getChildByName("scoreshu").active = true;
                    item.getChildByName("scoreshu").getComponent(cc.Label).string = details.clubList[j].shuying;
                }
                item.active = true;
            }
        }
        // this.ZhanjiInfoClubItem.parent.height = this.ZhanjiInfoClubItem * details.clubList.length;

        var big = 0;
        var small = 0;
        var bigindex = 0;
        var smallindex = 0;
        var dairu = 0;
        var dairuIndex = 0;


        for (var j = 0; j < details.userList.length; j++) {
            var item = cc.instantiate(this.ZhanjiinfoUserItem);
            item.parent = this.ZhanjiInfoClubItem.parent;
            item.getChildByName("name").getComponent(cc.Label).string = details.userList[j].alias + "(" + details.userList[j].userid + ")";
            item.getChildByName("dairu").getComponent(cc.Label).string = "带入:" + details.userList[j].jifendr;
            item.getChildByName("clubname").getComponent(cc.Label).string = details.userList[j].clubname;
            item.getChildByName("iconMask").children[0].getComponent("LoadImage").LoadUserIcon(details.userList[j].userid);
            if (details.userList[j].jifendr > dairu) {
                dairu = details.userList[j].jifendr;
                dairuIndex = j;
            }
            if (details.userList[j].shuying > 0) {
                item.getChildByName("scoreying").active = true;
                item.getChildByName("scoreying").getComponent(cc.Label).string = "+" + details.userList[j].shuying;
                if (details.userList[j].shuying > big) {
                    big = details.userList[j].shuying;
                    bigindex = j;
                }
            } else {
                item.getChildByName("scoreshu").active = true;
                item.getChildByName("scoreshu").getComponent(cc.Label).string = details.userList[j].shuying;
                if (details.userList[j].shuying < small) {
                    small = details.userList[j].shuying;
                    smallindex = j;
                }
            }
            item.active = true;
        }
        this.ZhanjiInfoClubItem.parent.height = details.userList.length * this.ZhanjiinfoUserItem.height + this.ZhanjiInfoClubItem.height * details.clubList.length;
        zhanjiInfo.getChildByName("userinfo").getChildByName("mvp").getChildByName("name").getComponent(cc.Label).string = details.userList[bigindex].alias;
        zhanjiInfo.getChildByName("userinfo").getChildByName("mvp").getChildByName("iconMask").children[0].getComponent("LoadImage").LoadUserIcon(details.userList[bigindex].userid);
        zhanjiInfo.getChildByName("userinfo").getChildByName("dayu").getChildByName("name").getComponent(cc.Label).string = details.userList[smallindex].alias;
        zhanjiInfo.getChildByName("userinfo").getChildByName("dayu").getChildByName("iconMask").children[0].getComponent("LoadImage").LoadUserIcon(details.userList[smallindex].userid);
        zhanjiInfo.getChildByName("userinfo").getChildByName("tuhao").getChildByName("name").getComponent(cc.Label).string = details.userList[dairuIndex].alias;
        zhanjiInfo.getChildByName("userinfo").getChildByName("tuhao").getChildByName("iconMask").children[0].getComponent("LoadImage").LoadUserIcon(details.userList[dairuIndex].userid);
        zhanjiInfo.active = true;
    },

    //+++++++++++++++second



    OpenClubInfo: function (event, args) {
        this.PlayBtnSound();
        var clubid = event.target.parent.getChildByName("clubid").getComponent(cc.Label).string;
        cc.vv.socket.send("getgclubinfo", { iClubId: clubid });
        cc.vv.socket.send("getclubusers", { clubid: clubid, szName: null });
    },

    OpenCreateRoom: function (event, arg) {
        this.PlayBtnSound();
        //var script = this.SecondFrameParent.getChildByName("CreateRoom").getComponent("CreateCXRoom");
        //var leagueid = event.target.getChildByName("leagueid").getComponent(cc.Label).string;
        //var leaguename = event.target.getChildByName("leaguename").getComponent(cc.Label).string;
        //var leaguelevel = event.target.getChildByName("allianceLevel").getComponent(cc.Label).string;
        //script.SetLeagueInfo(leagueid, leaguename, leaguelevel);
        //script.resetInfo();
        //script.node.active = true;
        var clubid = event.target.getChildByName("iClubId").getComponent(cc.Label).string;
        cc.vv.socket.send("getprivileges", { iClubId: clubid });
    },

    OpenChangeClubFrame: function (event) {
        this.PlayBtnSound();
        var changeframe = this.SecondFrameParent.getChildByName("changeClubInfo");
        var clubid = event.target.parent.parent.getChildByName("clubid").getComponent(cc.Label).string;
        changeframe.getChildByName("clubid").getComponent(cc.Label).string = clubid;
        changeframe.getChildByName("clubname").active = this._clubinfo._clubData.szName;
        changeframe.getChildByName("ClubiconMask").children[0].getComponent("LoadImage").LoadClubIcon(clubid);
        changeframe.getChildByName("paylbl").getComponent(cc.Label).string = "修改名称需要花费" + cc.vv.userMgr.ChangeClubNamePay + "钻石";
        changeframe.getChildByName("zuanshi").getComponent(cc.Label).string = "当前拥有钻石:" + cc.vv.userMgr.gems;
        changeframe.active = true;
    },

    BtnBack: function (event, args) {
        this.PlayBtnSound();
        event.target.parent.active = false;
    },

    ChangeClubInfo: function (event, arg) {
        this.PlayBtnSound();
        var clubid = event.target.parent.getChildByName("clubid").getComponent(cc.Label).string;
        var clubname = event.target.parent.getChildByName("clubname").getComponent(cc.EditBox).string;
        if (clubname == "") {
            this.showAlert("俱乐部名称不能为空");
            return;
        }
        var data = {
            iClubId: clubid,
            szName: clubname,
        };
        cc.vv.socket.send("chgclubname", data);
    },

    OnClickChangeHead: function (event, arg) {
        this.ChangeHeadNode.active = true;
        this._headSprite = event.target.getComponent(cc.Sprite);
        this._CurChangeMode = arg;
    },


    ChangeUserIcon: function () {

        cc.vv.anysdkMgr.ProcessUserPhoto();
    },


    //imode 1用户头像 2 俱乐部头像
    UpLoadHeadImage: function (base64Code) {
        console.log(base64Code);
        console.log("upload1111111111111111111111111222222222222222222222++");
        console.log(base64Code.length);
        this.scheduleOnce(function () {
            console.log("upload1111111111111111111111111222222222222222222222---");
            cc.vv.socket.send("upimage", { iMode: imode, szExtName: ".jpg", pBytes: base64Code });
        }, 3);
    },

    //设置是否同意申请联盟
    Setallowapply: function () {
        this.PlayBtnSound();
        if (this._curLeagueData.creator != cc.vv.userMgr.userId) {
            return;
        }

        var check = this.LeagueParent.getChildByName("jieshoushenqing").getChildByName("flag").getComponent("CheckBox");
        check.onClicked()
        var agree = check.checked;
        var leagueid = this.LeagueParent.getChildByName("leagueinfo").getChildByName("id").getComponent(cc.Label).string;
        cc.vv.socket.send("allowapply", { allianceid: leagueid, allow: agree });
    },

    //设置是否开启奖池
    SetOpenJC: function (event,arg) {
        this.PlayBtnSound();
        if (this._curLeagueData.creator != cc.vv.userMgr.userId) {
            return;
        }
        var check = this.LeagueParent.getChildByName("openjiangchi").getChildByName("flag").getComponent("CheckBox");
        if (!check.checked) {
            this.SecondFrameParent.getChildByName("leagueinfo").getChildByName("confirmOpenJC").active = true;
        } else {
            cc.vv.socket.send("openjc", { iMode: 0 });
        }

        //check.onClicked()
        //var agree = check.checked;
        //var leagueid = this.LeagueParent.getChildByName("leagueinfo").getChildByName("id").getComponent(cc.Label).string;
        
    },

    SendOpenJC: function (event, arg) {
        event.target.parent.active = false;
        cc.vv.socket.send("openjc", { iMode: 1 });
    },



    Getalliancemember: function () {
        this.PlayBtnSound();
        if (this._curLeagueData.creator != cc.vv.userMgr.userId) {
            return;
        }
        var leagueid = this.LeagueParent.getChildByName("leagueinfo").getChildByName("id").getComponent(cc.Label).string;
        cc.vv.socket.send("getalliancemember", { allianceid: leagueid });
    },
    //联盟
    OnClickLevelFrame: function (event, arg) {
        this.PlayBtnSound();
        if (this._curLeagueData.creator != cc.vv.userMgr.userId)
            return;
        var level = this.SecondFrameParent.getChildByName("leagueinfo").getChildByName("level");
        level.getChildByName("leaguename").getComponent(cc.Label).string = this._curLeagueData.sname;
        level.getChildByName("lblbg").children[0].getComponent(cc.Label).string = "LV." + this._curLeagueData.levels;
        level.getChildByName("usercount").getComponent(cc.Label).string = this._curLeagueData.clubcount + "/" + this._curLeagueData.maxclubcount;
        if (parseInt(this._curLeagueData.levels) < 20) {
            level.getChildByName("targetlevel").getComponent(cc.Label).string = "LV." + (parseInt(this._curLeagueData.levels) + 1);
            level.getChildByName("curlevel").getComponent(cc.Label).string = (parseInt(this._curLeagueData.levels) + 1);
            level.getChildByName("14").getComponent(cc.Button).interactable = true;
            level.getChildByName("15").getComponent(cc.Button).interactable = true;
            level.getChildByName("pay").getComponent(cc.Label).string = 100000;
        } else {
            level.getChildByName("targetlevel").getComponent(cc.Label).string = "LV." + (parseInt(this._curLeagueData.levels));
            level.getChildByName("curlevel").getComponent(cc.Label).string = (parseInt(this._curLeagueData.levels));
            level.getChildByName("14").getComponent(cc.Button).interactable = false;
            level.getChildByName("15").getComponent(cc.Button).interactable = false;
            level.getChildByName("pay").getComponent(cc.Label).string = 0;
        }

        level.getChildByName("yue").getComponent(cc.Label).string = cc.vv.userMgr.gems;
        level.active = true;
    },
    //联盟
    AddLevel: function (event, arg) {
        this.PlayBtnSound();
        var curlevel = event.target.parent.getChildByName("curlevel").getComponent(cc.Label).string;;
        curlevel++;
        if (curlevel > 20) {
            curlevel--;
        }
        event.target.parent.getChildByName("targetlevel").getComponent(cc.Label).string = "LV." + curlevel;
        event.target.parent.getChildByName("curlevel").getComponent(cc.Label).string = curlevel;
        event.target.parent.getChildByName("pay").getComponent(cc.Label).string = (curlevel - this._curLeagueData.levels) * 100000;
    },
    //联盟
    reduceLevel: function (event, arg) {
        this.PlayBtnSound();
        var curlevel = event.target.parent.getChildByName("curlevel").getComponent(cc.Label).string;;
        curlevel--;
        if (curlevel < this._curLeagueData.levels + 1) {
            curlevel++;
        }
        event.target.parent.getChildByName("targetlevel").getComponent(cc.Label).string = "LV." + curlevel;
        event.target.parent.getChildByName("curlevel").getComponent(cc.Label).string = curlevel;
        event.target.parent.getChildByName("pay").getComponent(cc.Label).string = (curlevel - this._curLeagueData.levels) * 100000;
    },

    OnupgradallianceClick: function (event, arg) {
        this.PlayBtnSound();
        if (this._curLeagueData.levels >= 20) {
            this.showAlert("已经是最大等级");
            return;
        }
        var targetlevel = event.target.parent.getChildByName("curlevel").getComponent(cc.Label).string;
        cc.vv.socket.send("upgradalliance", { levels: targetlevel });
    },

    //俱乐部
    OnClickClubLevelFrame: function (event, arg) {
        this.PlayBtnSound();
        var data = this._clubinfo._clubData;
        if (!data.bIsAdmin)
            return;
        var level = this.SecondFrameParent.getChildByName("clubinfo").getChildByName("level");
        level.getChildByName("uplie").getChildByName("clubname").getComponent(cc.Label).string = data.szName;
        level.getChildByName("ClubiconMask").children[0].getComponent("LoadImage").LoadClubIcon(data.iClubId);
        level.getChildByName("uplie").getChildByName("lblbg").children[0].getComponent(cc.Label).string = "LV." + data.iLevels;
        level.getChildByName("lefttime").getComponent(cc.Label).string = "lefttime";
        level.getChildByName("yue").getComponent(cc.Label).string = cc.vv.userMgr.gems;
        if (parseInt(data.iLevels) < 9) {
            level.getChildByName("targetlevel").getComponent(cc.Label).string = "LV." + (parseInt(data.iLevels) + 1);
            level.getChildByName("curlevel").getComponent(cc.Label).string = (parseInt(data.iLevels) + 1);
            level.getChildByName("pay").getComponent(cc.Label).string = this._clubinfo._levelGolds[parseInt(data.iLevels) + 1];
            level.getChildByName("14").getComponent(cc.Button).interactable = true;
            level.getChildByName("15").getComponent(cc.Button).interactable = true;
        } else {
            level.getChildByName("targetlevel").getComponent(cc.Label).string = "LV." + (parseInt(data.iLevels));
            level.getChildByName("curlevel").getComponent(cc.Label).string = (parseInt(data.iLevels));
            level.getChildByName("pay").getComponent(cc.Label).string = 0;
            level.getChildByName("14").getComponent(cc.Button).interactable = false;
            level.getChildByName("15").getComponent(cc.Button).interactable = false;
        }
        level.active = true;
    },

    AddClubLevel: function (event, arg) {
        this.PlayBtnSound();
        console.log("add");
        var curlevel = event.target.parent.getChildByName("curlevel").getComponent(cc.Label).string;;
        curlevel++;
        if (curlevel > 9) {
            curlevel--;
        }

        event.target.parent.getChildByName("targetlevel").getComponent(cc.Label).string = "LV." + curlevel;
        event.target.parent.getChildByName("curlevel").getComponent(cc.Label).string = curlevel;
        event.target.parent.getChildByName("pay").getComponent(cc.Label).string = this._clubinfo._levelGolds[curlevel];
    },

    reduceClubLevel: function (event, arg) {
        this.PlayBtnSound();
        console.log("reduce");
        var curlevel = event.target.parent.getChildByName("curlevel").getComponent(cc.Label).string;;
        curlevel--;
        if (curlevel < this._clubinfo._clubData.iLevels + 1) {
            curlevel++;
        }
        event.target.parent.getChildByName("targetlevel").getComponent(cc.Label).string = "LV." + curlevel;
        event.target.parent.getChildByName("curlevel").getComponent(cc.Label).string = curlevel;
        event.target.parent.getChildByName("pay").getComponent(cc.Label).string = this._clubinfo._levelGolds[curlevel];
    },

    OnupgradClubClick: function (event, arg) {
        this.PlayBtnSound();
        var targetlevel = event.target.parent.getChildByName("curlevel").getComponent(cc.Label).string;
        if (this._clubinfo._clubData.iLevels >= 9) {
            this.showAlert("已经是最大等级");
            return;
        }
        cc.vv.socket.send("upgradclub", { levels: targetlevel });
    },

    OnkickallianceClick: function (event, arg) {
        this.PlayBtnSound();
        var uid = event.target.parent.getChildByName("uid").getComponent(cc.Label).string;
        cc.vv.socket.send("kickalliance", { uid: parseInt(uid) });
    },

    ShowChangeLianMengJieshao: function () {
        this.PlayBtnSound();
        if (this._curLeagueData.creator == cc.vv.userMgr.userId) {
            this.SecondFrameParent.getChildByName("leagueinfo").getChildByName("changejieshao").active = true;
        }
    },

    setalliancememo: function (event, arg) {
        this.PlayBtnSound();
        var inputbox = event.target.parent.getChildByName("inputbox").getComponent(cc.EditBox);
        var memo = inputbox.string;
        inputbox.string = "";
        cc.vv.socket.send("setalliancememo", { allianceid: this._curLeagueData.allianceid, memo: memo });
    },

    ShowChangeClubJieShao: function () {
        this.PlayBtnSound();
        if (this._clubinfo._clubData.iUserLevels != 3)
            return;
        this.SecondFrameParent.getChildByName("clubinfo").getChildByName("changejieshao").active = true;
    },

    setClubmemo: function (event, arg) {
        this.PlayBtnSound();
        var inputbox = event.target.parent.getChildByName("inputbox").getComponent(cc.EditBox);
        var memo = inputbox.string;
        inputbox.string = "";
        cc.vv.socket.send("updateclubmemo", { clubid: this._clubinfo._clubData.iClubId, memo: memo });
    },

    OpenClubUserDetail: function (event, arg) {
        var clubuserDataFrame = this.SecondFrameParent.getChildByName("Clubuserlist").getChildByName("datacount");
        var userid = event.target.getChildByName("userid").getComponent(cc.Label).string;
        userid = parseInt(userid);
        var userdata = null;
        for (var i = 0; i < this._curClubUsers.rows.length; i++) {
            if (userid == this._curClubUsers.rows[i].userid) {
                userdata = this._curClubUsers.rows[i];
            }
        }
        console.log(userdata);
        clubuserDataFrame.getChildByName("userid").getComponent(cc.Label).string = userdata.userid;
        clubuserDataFrame.getChildByName("uid").getComponent(cc.Label).string = userdata.uid;
        this.clubDataCountParent.getChildByName("name").getComponent(cc.Label).string = userdata.alias;
        this.clubDataCountParent.getChildByName("iconMask").children[0].getComponent("LoadImage").LoadUserIcon(userdata.userid);
        this.clubDataCountParent.getChildByName("id").getComponent(cc.Label).string = userdata.userid;
        this.clubDataCountParent.getChildByName("memo").getComponent(cc.Label).string = userdata.memo;
        if (userdata.clublevel == 2) {
            this.clubDataCountParent.getChildByName("wo_icon_change").active = true;
            this.clubDataCountParent.getChildByName("memo").active = true;
            this.clubDataCountParent.getChildByName("setmgr").active = true;
            clubuserDataFrame.getChildByName("tichu").active = true;
            this.clubDataCountParent.getChildByName("setmgr").children[0].getComponent(cc.Label).string = "设置管理员";
        } else if (userdata.clublevel == 1) {
            this.clubDataCountParent.getChildByName("wo_icon_change").active = true;
            this.clubDataCountParent.getChildByName("memo").active = true;
            this.clubDataCountParent.getChildByName("setmgr").active = true;
            clubuserDataFrame.getChildByName("tichu").active = true;
            this.clubDataCountParent.getChildByName("setmgr").children[0].getComponent(cc.Label).string = "取消管理员";
        } else if (userdata.clublevel == 0) {
            clubuserDataFrame.getChildByName("tichu").active = false;
            this.clubDataCountParent.getChildByName("setmgr").active = false;
            ///this.clubDataCountParent.getChildByName("setvip").active = false;
            this.clubDataCountParent.getChildByName("wo_icon_change").active = false;
            this.clubDataCountParent.getChildByName("memo").active = false;
        }
        if (userdata.isvip) {
            this.clubDataCountParent.getChildByName("setvip").children[0].getComponent(cc.Label).string = "取消会员";
        } else {
            this.clubDataCountParent.getChildByName("setvip").children[0].getComponent(cc.Label).string = "设置会员";
        }

        if (this._clubinfo._clubData.iUserLevels != 3) {
            clubuserDataFrame.getChildByName("tichu").active = false;
            this.clubDataCountParent.getChildByName("setmgr").active = false;
            this.clubDataCountParent.getChildByName("wo_icon_change").active = false;
            this.clubDataCountParent.getChildByName("memo").active = false;
        }

        if (userdata.extdata != null) {
            var tongji = this.clubDataCountParent.getChildByName("tongji");
            var shenglv = userdata.extdata.iWinTimes / userdata.extdata.iPlayTimes;
            if (userdata.extdata.iPlayTimes == 0) {
                shenglv = 0;
            }
            shenglv = parseFloat(shenglv) * 100;
            shenglv = parseInt(shenglv);
            var ruchilv = 100 - shenglv;
            tongji.getChildByName("shenglv").getComponent(cc.Label).string = shenglv + "%";
            tongji.getChildByName("ruchilv").getComponent(cc.Label).string = ruchilv + "%";
            this.clubDataCountParent.getChildByName("jushu").getComponent(cc.Label).string = userdata.extdata.iGameTimes;
            this.clubDataCountParent.getChildByName("shoushu").getComponent(cc.Label).string = userdata.extdata.iPlayTimes;
            tongji.getChildByName("blue").getComponent(cc.Sprite).fillRange = ruchilv / 100;

            if (cc.vv.userMgr.isVIP) {
                this.clubDataCountParent.getChildByName("tanpai").getChildByName("lbl").getComponent(cc.Label).string = userdata.extdata.iTanPaiLv;
                this.clubDataCountParent.getChildByName("tanpaisheng").getChildByName("lbl").getComponent(cc.Label).string = userdata.extdata.iTanPaiSLv;
                this.clubDataCountParent.getChildByName("changjunzhanji").getChildByName("lbl").getComponent(cc.Label).string = userdata.extdata.iJiFenSY;
                this.clubDataCountParent.getChildByName("changjundairu").getChildByName("lbl").getComponent(cc.Label).string = parseInt(parseFloat(userdata.extdata.iTotalDR / userdata.extdata.iPlayTimes) * 100);
            }
        }
        clubuserDataFrame.active = true;
    },

    SetClubVIP: function (event, arg) {
        this.PlayBtnSound();
        var targetid = event.target.parent.getChildByName("id").getComponent(cc.Label).string;
        var str = event.target.children[0].getComponent(cc.Label).string;
        var _allow = 0;
        if (str == "设置会员") {
            _allow = 1;
        } else {
            _allow = 0;
        }
        var clubid = this._clubinfo._clubData.iClubId;

        cc.vv.socket.send("setvip", { isvip: _allow, memberid: targetid, clubid: clubid });
        //{allow:true,memberid:122,clubid:2222}
    },


    getuserginfo: function (event, arg) {
        this.PlayBtnSound();
        cc.vv.socket.send("getuserginfo", { iUserId: cc.vv.userMgr.userId });
    },

    OpenUpdateClubUserMemo: function () {
        this.PlayBtnSound();
        this.SecondFrameParent.getChildByName("Clubuserlist").getChildByName("datacount").getChildByName("changejieshao").active = true;
    },

    updateclubusermemo: function (event, arg) {
        this.PlayBtnSound();
        //参数
        //{ memo: '1233', uid: 12, clubid: 123 }
        var memo = event.target.parent.getChildByName("inputbox").getComponent(cc.EditBox).string;
        var clubid = this._clubinfo._clubData.iClubId;
        var _uid = this.SecondFrameParent.getChildByName("Clubuserlist").getChildByName("datacount").getChildByName("uid").getComponent(cc.Label).string;
        this.clubDataCountParent.getChildByName("memo").getComponent(cc.Label).string = memo;
        cc.vv.socket.send("updateclubusermemo", { memo: memo, uid: _uid, clubid: clubid });
    },

    OpenJijinChongZhiFrame: function () {
        this.PlayBtnSound();
        this._clubinfo.MakeJijinDisPlay();
        this.SecondFrameParent.getChildByName("clubinfo").getChildByName("chongzhijijin").getChildByName("jijin").getComponent(cc.Label).string = this._clubinfo._clubData.iGolds;
        this.SecondFrameParent.getChildByName("clubinfo").getChildByName("chongzhijijin").active = true;
    },

    OpenFaFangFrame: function () {
        this.PlayBtnSound();
        this.SecondFrameParent.getChildByName("fafang").active = true;
        this.SecondFrameParent.getChildByName("fafang").getComponent("CloseFrame")._ParentFrame = this.SecondFrameParent.getChildByName("clubinfo");
        this.SecondFrameParent.getChildByName("clubinfo").active = false;
        this.SecondFrameParent.getChildByName("fafang").getChildByName("New ScrollView").getComponent("ScrollExtFafang").InitScrollData(this._clubinfo._clubUserInfo);
        //this.ShowMask();
        //this.scheduleOnce(function () {
        //    this.ShowFafangJinBI();
        //}, 0.05);
    },

    ShowFafangJinBI: function () {
        var data = this._clubinfo._clubUserInfo;
        for (var i = 1; i < this.jijinFafangItem.parent.children.length; i++) {
            this.jijinFafangItem.parent.children[i].destroy();
        }

        for (var i = 0; i < data.rows.length; i++) {
            var item = cc.instantiate(this.jijinFafangItem);
            item.parent = this.jijinFafangItem.parent;
            item.getChildByName("iconMask").children[0].getComponent("LoadImage").LoadUserIcon(data.rows[i].userid);
            item.getChildByName("name").getComponent(cc.Label).string = data.rows[i].alias;
            item.getChildByName("id").getComponent(cc.Label).string = data.rows[i].userid;
            item.getChildByName("memo").getComponent(cc.Label).string = data.rows[i].memo;
            item.active = true;
        }

        this.jijinFafangItem.parent.height = (this.jijinFafangItem.height + 2) * data.rows.length;
    },

    OpenFaFangZuanshiFrame: function () {
        this.PlayBtnSound();
        this.SecondFrameParent.getChildByName("fafangdia").active = true;
        this.SecondFrameParent.getChildByName("fafangdia").getComponent("CloseFrame")._ParentFrame = this.SecondFrameParent.getChildByName("clubinfo");
        this.SecondFrameParent.getChildByName("clubinfo").active = false;
        this.SecondFrameParent.getChildByName("fafangdia").getChildByName("New ScrollView").getComponent("ScrollExtFafang").InitScrollData(this._clubinfo._clubUserInfo);
        //this.ShowMask();
        //this.scheduleOnce(function () {
        //    this.ShowZuanshiUser();
        //}, 0.05);
    },
    ShowZuanshiUser: function () {
        var data = this._clubinfo._clubUserInfo;
        for (var i = 1; i < this.zuanshiFafangItem.parent.children.length; i++) {
            this.zuanshiFafangItem.parent.children[i].destroy();
        }
        for (var i = 0; i < data.rows.length; i++) {
            var item = cc.instantiate(this.zuanshiFafangItem);
            item.parent = this.zuanshiFafangItem.parent;
            item.getChildByName("iconMask").children[0].getComponent("LoadImage").LoadUserIcon(data.rows[i].userid);
            item.getChildByName("name").getComponent(cc.Label).string = data.rows[i].alias;
            item.getChildByName("id").getComponent(cc.Label).string = data.rows[i].userid;
            item.getChildByName("memo").getComponent(cc.Label).string = data.rows[i].memo;
            item.active = true;
        }
        this.zuanshiFafangItem.parent.height = (this.zuanshiFafangItem.height + 2) * data.rows.length;
    },

    OpenFafangPanel: function (event, arg) {
        this.PlayBtnSound();
        var id = event.target.getChildByName("id").getComponent(cc.Label).string;
        var name = event.target.getChildByName("name").getComponent(cc.Label).string;
        var memo = event.target.getChildByName("memo").getComponent(cc.Label).string;
        var fafang = this.jijinFafangFrame.getChildByName("fafang");
        fafang.getChildByName("name").getComponent(cc.Label).string = name;
        fafang.getChildByName("iconMask").children[0].getComponent("LoadImage").LoadUserIcon(id);
        fafang.getChildByName("id").getComponent(cc.Label).string = id;
        fafang.getChildByName("golds").getComponent(cc.Label).string = this._clubinfo._clubData.iGolds;
        if (memo == "" || memo == null)
        {
            fafang.getChildByName("memo").getComponent(cc.Label).string = "无";
        } else {
            fafang.getChildByName("memo").getComponent(cc.Label).string = memo;
        }
        fafang.active = true;
    },

    OpenFafangZuanshiPanel: function (event, arg) {
        this.PlayBtnSound();
        var id = event.target.getChildByName("id").getComponent(cc.Label).string;
        var name = event.target.getChildByName("name").getComponent(cc.Label).string;
        var memo = event.target.getChildByName("memo").getComponent(cc.Label).string;
        var fafang = this.zuanshiFafangFrame.getChildByName("fafang");
        fafang.getChildByName("name").getComponent(cc.Label).string = name;
        fafang.getChildByName("iconMask").children[0].getComponent("LoadImage").LoadUserIcon(id);
        fafang.getChildByName("id").getComponent(cc.Label).string = id;
        fafang.getChildByName("golds").getComponent(cc.Label).string = cc.vv.userMgr.gems;
        if (memo == "" || memo == null) {
            fafang.getChildByName("memo").getComponent(cc.Label).string = "无";
        } else {
            fafang.getChildByName("memo").getComponent(cc.Label).string = memo;
        }
        fafang.active = true;
    },

    OpenJiJinDetailFrame: function () {
        this.PlayBtnSound();
        this.SecondFrameParent.getChildByName("clubinfo").getChildByName("jijindetail").active = true;
    },

    //基金充值
    Onorechargegold: function (event, arg) {
        this.PlayBtnSound();
        var _count = event.target.parent.getChildByName("lbl").getComponent(cc.Label).string;
        cc.vv.socket.send("rechargegold", { clubid: this._clubinfo._clubData.iClubId,  count: _count });
    },

    //发放
    Onissuegold: function (event, arg) {
        this.PlayBtnSound();
        var golds = event.target.parent.getChildByName("goldinput").getComponent(cc.EditBox).string;
        var targetuserid = event.target.parent.getChildByName("id").getComponent(cc.Label).string;
        cc.vv.socket.send("issuegold", { gold: golds, recver: targetuserid, clubid: this._clubinfo._clubData.iClubId });
        event.target.parent.active = false;
    },

    Onissuediamond: function (event, arg) {
        this.PlayBtnSound();
        var golds = event.target.parent.getChildByName("goldinput").getComponent(cc.EditBox).string;
        var targetuserid = event.target.parent.getChildByName("id").getComponent(cc.Label).string;
        cc.vv.socket.send("issuediamond", { diamond: golds, recver: targetuserid, clubid: this._clubinfo._clubData.iClubId });
        event.target.parent.active = false;
    },
    //发放记录
    Onissuegoldlist: function () {
        
    },

    OnissueDatelist: function () {
        this.PlayBtnSound();
        cc.vv.socket.send("issuegoldlist", { clubid: 111, ymd: '20190103', page: 0 });
    },
    //带入记录
    OnFangfangbtnlist: function () {
        this.PlayBtnSound();
        cc.vv.socket.send("issuedate", { clubid: this._clubinfo._clubData.iClubId });
       // this.Onissuegoldlist();
    },


    OnissueZuanshiDatelist: function () {
        this.PlayBtnSound();
        cc.vv.socket.send("issuediamondlist", { clubid: 111, ymd: '20190103', page: 0 });
    },

    OnFangfangZuanshibtnlist: function () {
        this.PlayBtnSound();
        cc.vv.socket.send("issuediamonddate", { clubid: this._clubinfo._clubData.iClubId });
        // this.Onissuegoldlist();
    },
    OnGetMyMessage: function () {
        this.PlayBtnSound();
        cc.vv.socket.send("mymessage", { page: 0 });
        this._mineRed.active = false;
        this.WoFrameParent.getChildByName("message").getChildByName("red_dot").active = false;
    },

    //购买VIP
    Onbuyvip: function (event, arg) {
        this.PlayBtnSound();
        this.node.getChildByName("ShopBuyConfitm").active = true;
        //cc.vv.socket.send("buyvip", { index:0});
    },

    Sendbuyvip: function (event, arg) {
        this.PlayBtnSound();
        event.target.parent.active = false;
        //this.node.getChildByName("ShopBuyConfitm").active = true;
        cc.vv.socket.send("buyvip", { index:0});
    },

    onDestroy() {
        window.sdkpickphoto.unregister(this);
        cc.vv.socket.disconnect();
    },

    OpenLeagueSetMgrFrame: function () {
        this.PlayBtnSound();
        if (this._curLeagueData.creator != cc.vv.userMgr.userId) {
            return;
        }
        var arr = {
            rows:[],
        }
       arr.rows = this._clubinfo._clubUserInfo.rows.sort(function (a, b) {
            return a.alliancelevel - b.alliancelevel;
        });
        this.SecondFrameParent.getChildByName("Leagueuserlist").active = true;
        this.SecondFrameParent.getChildByName("Leagueuserlist").getComponent("CloseFrame")._ParentFrame = this.SecondFrameParent.getChildByName("leagueinfo");
        this.SecondFrameParent.getChildByName("leagueinfo").active = false;
        this.SecondFrameParent.getChildByName("Leagueuserlist").getChildByName("New ScrollView").getComponent("ScrollExtLeague").InitScrollData(arr);

        //this.ShowMask();
        //this.scheduleOnce(function () {
        //    this.OpenLeagueMgrUser();
        //}, 0.05);
    },

    OpenLeagueMgrUser: function () {
        for (var i = 1; i < this.LeagueUserListItem.parent.children.length; i++) {
            this.LeagueUserListItem.parent.children[i].destroy();
        }

        //console.log(this._clubinfo._clubUserInfo);
        for (var i = 0; i < this._clubinfo._clubUserInfo.rows.length; i++) {
            var item = cc.instantiate(this.LeagueUserListItem);
            item.parent = this.LeagueUserListItem.parent;
            item.getChildByName("name").getComponent(cc.Label).string = this._clubinfo._clubUserInfo.rows[i].alias;
            item.getChildByName("id").getComponent(cc.Label).string = this._clubinfo._clubUserInfo.rows[i].userid;
            item.getChildByName("iconMask").children[0].getComponent("LoadImage").LoadUserIcon(this._clubinfo._clubUserInfo.rows[i].userid);
            //判断是否是联盟管理员  创建者
            if (this._clubinfo._clubUserInfo.rows[i].alliancelevel == 2) {
                item.getChildByName("set").active = true;
            } else if (this._clubinfo._clubUserInfo.rows[i].alliancelevel == 1) {
                item.getChildByName("mgr").active = true;
                item.getChildByName("cancel").active = true;
            } else {
                item.getChildByName("creator").active = true;
            }
            item.active = true;
        }
    },

    SetLeagueMgr: function (event, arg) {
        this.PlayBtnSound();
        var memberid = event.target.parent.getChildByName("id").getComponent(cc.Label).string;
        cc.vv.socket.send("setallianceadmin", { allow: true, memberid: memberid, clubid: this._clubinfo._clubData.iClubId });
        event.target.active = false;
        event.target.parent.getChildByName("cancel").active = true;
    },

    CancelLeagueMgr: function (event, arg) {
        this.PlayBtnSound();
        var memberid = event.target.parent.getChildByName("id").getComponent(cc.Label).string;
        cc.vv.socket.send("setallianceadmin", { allow: false, memberid: memberid, clubid: this._clubinfo._clubData.iClubId });
        event.target.active = false;
        event.target.parent.getChildByName("set").active = true;
    },

    ShowLianmenMgrInfo: function (event, arg) {
        this.PlayBtnSound();
        event.target.parent.getChildByName("info").active = true;
    },

    OpenYuJing: function () {
        this.PlayBtnSound();
        var frame = this.SecondFrameParent.getChildByName("clubinfo").getChildByName("jijin").getChildByName("yujingFrame");
        frame.active = true;
        frame.getChildByName("yujing").getComponent(cc.Label).string = this._clubinfo._clubData.iAlertGolds;
        frame.getChildByName("curlbl").getComponent(cc.Label).string = this._clubinfo._clubData.iAlertGolds;
    },

    SetYujing: function (event, arg) {
        this.PlayBtnSound();
        var golds = event.target.parent.getChildByName("curlbl").getComponent(cc.Label).string;
        golds = parseInt(golds);
        event.target.parent.getChildByName("yujing").getComponent(cc.Label).string = golds;
        cc.vv.socket.send("alertgolds", { golds: golds, clubid: this._clubinfo._clubData.iClubId });
    },

    YujingAdd: function (event, arg) {
        this.PlayBtnSound();
        var lbl = event.target.parent.getChildByName("curlbl").getComponent(cc.Label);
        var gold = lbl.string;
        gold = parseInt(gold);
        gold += 10000;
        lbl.string = gold;
    },

    YujingReduce: function (event, arg) {
        this.PlayBtnSound();
        var lbl = event.target.parent.getChildByName("curlbl").getComponent(cc.Label);
        var gold = lbl.string;
        gold = parseInt(gold);
        gold -= 10000;
        if (gold <= 30000) {
            gold = 30000;
        }
        lbl.string = gold;
    },

    OpenNext: function (event, arg) {
        this.PlayBtnSound();
        var phoneNumber = event.target.parent.getChildByName("phoneinput").getComponent(cc.EditBox).string;
        this._GaimiPhone = phoneNumber;
        if (this._GaimiPhone == "" || this._GaimiPhone.length < 11) {
            this.showAlert("请输入正确的手机号码!");
            return;
        }
        cc.vv.socket.send("getsmscode", { szMobile: phoneNumber });
        event.target.parent.parent.getChildByName("gaimiNext").active = true;
        event.target.parent.parent.getChildByName("gaimiNext").getChildByName("phoneNumber").getComponent(cc.Label).string = phoneNumber;
    },


    OnGaiMiClick: function (event, arg) {
        this.PlayBtnSound();
        var pwd = event.target.parent.getChildByName("newpwd").getComponent(cc.EditBox).string;
        var szyzm = event.target.parent.getChildByName("yanzhengma").getComponent(cc.EditBox).string;
        var data = {
            szMobile: this._GaimiPhone,
            szPassword: pwd,
            szCode: szyzm,
        }
        cc.vv.socket.send("chgpassword", data);
    },

    PlayBtnSound: function () {
    },

    SearchUserList: function (event, arg) {
        this.PlayBtnSound();
        var input = event.target.parent.getChildByName("searchInput").getComponent(cc.EditBox).string;
        if (input == "") {
            this.OpenClubUserFrame();
        } else {
            for (var i = 1; i < this.clubUserItem.parent.children.length; i++) {
                if (this.clubUserItem.parent.children[i].getChildByName("userid").getComponent(cc.Label).string == input || this.clubUserItem.parent.children[i].getChildByName("name").getComponent(cc.Label).string == input) {
                    this.clubUserItem.parent.children[i].active = true;
                } else {
                    this.clubUserItem.parent.children[i].active = false;
                }
            }
        }
    },

    SearchfafangJijin: function (event, arg) {
        this.PlayBtnSound();
        var input = event.target.parent.getChildByName("searchInput").getComponent(cc.EditBox).string;
        if (input == "") {
            for (var i = 1; i < this.jijinFafangItem.parent.children.length; i++) {
                this.jijinFafangItem.parent.children[i].active = true;
            }
        } else {
            for (var i = 1; i < this.jijinFafangItem.parent.children.length; i++) {
                if (this.jijinFafangItem.parent.children[i].getChildByName("id").getComponent(cc.Label).string == input || this.clubUserItem.parent.children[i].getChildByName("name").getComponent(cc.Label).string == input) {
                    this.jijinFafangItem.parent.children[i].active = true;
                } else {
                    this.jijinFafangItem.parent.children[i].active = false;
                }
            }
        }
    },

    Searchfafangzuanshi: function (event, arg) {
        this.PlayBtnSound();
        var input = event.target.parent.getChildByName("searchInput").getComponent(cc.EditBox).string;
        if (input == "") {
            for (var i = 1; i < this.zuanshiFafangItem.parent.children.length; i++) {
                this.zuanshiFafangItem.parent.children[i].active = true;
            }
        } else {
            for (var i = 1; i < this.zuanshiFafangItem.parent.children.length; i++) {
                if (this.zuanshiFafangItem.parent.children[i].getChildByName("id").getComponent(cc.Label).string == input || this.clubUserItem.parent.children[i].getChildByName("name").getComponent(cc.Label).string == input) {
                    this.zuanshiFafangItem.parent.children[i].active = true;
                } else {
                    this.zuanshiFafangItem.parent.children[i].active = false;
                }
            }
        }
    },

    SearchLeagueMgr: function (event, arg) {
        this.PlayBtnSound();
        var input = event.target.parent.getChildByName("searchInput").getComponent(cc.EditBox).string;
        if (input == "") {
            for (var i = 1; i < this.LeagueUserListItem.parent.children.length; i++) {
                this.LeagueUserListItem.parent.children[i].active = true;
            }
        } else {
            for (var i = 1; i < this.LeagueUserListItem.parent.children.length; i++) {
                if (this.LeagueUserListItem.parent.children[i].getChildByName("id").getComponent(cc.Label).string == input || this.clubUserItem.parent.children[i].getChildByName("name").getComponent(cc.Label).string == input) {
                    this.LeagueUserListItem.parent.children[i].active = true;
                } else {
                    this.LeagueUserListItem.parent.children[i].active = false;
                }
            }
        }
    },

    ShowMask: function () {
        var re = this.node.getChildByName("reconnect").children[0].active = true;
        this.node.getChildByName("reconnect").children[0].getChildByName("tip").getComponent(cc.Label).string = "加载中,请稍候！";
        this.scheduleOnce(function () {
            this.node.getChildByName("reconnect").children[0].active = false;
        }, 2);
    },

    // called every frame, uncomment this function to activate update callback
    update: function (dt) {
     
    },

    CloseChildOpenClubInfoFrame: function (event, arg) {
        this.PlayBtnSound();
        event.target.parent.active = false;
        this.SecondFrameParent.getChildByName("clubinfo").active = true;
    },


    testNet: function () {
        cc.vv.net.close();
    },

    ReEnterRoom: function (roomid) {
        this.showLoad();
        var onCallBack = function (ret) {
            if (ret.wErrCode == 0) {
                cc.vv.gameNetMgr.connectXuanServer(ret);
                cc.director.loadScene("xuangame");
            } else {
                this.hideLoad();
                this.showAlert(ret.szErrMsg);
            }
        }.bind(this);
        cc.vv.http.sendRequest("/getroominfo", {
            iRoomId: roomid
        }, onCallBack);
    },

});

