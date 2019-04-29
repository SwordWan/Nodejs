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
        _userinfo:null,
        _userId:null,
    },

    // use this for initialization 
    onLoad: function () {
        if(cc.vv == null){
            return;
        }
        
        this._userinfo = cc.find("Canvas/userinfo");
        this._userinfo.active = false;
        cc.vv.utils.addClickEvent(this._userinfo,this.node,"UserInfoShow","onClicked");
        
        cc.vv.userinfoShow = this;
    },

    refresh: function () {
        if (cc.vv.gameNetMgr.conf.zhuduimode == null || !cc.vv.gameNetMgr.conf.zhuduimode)
            return;

        //console.log('cc.vv.gameNetMgr.isShowZuDuiBtn: ' + cc.vv.gameNetMgr.isShowZuDuiBtn);
        console.log('cc.vv.gameNetMgr.isShowQuitLinkBtn: ' + cc.vv.gameNetMgr.isShowQuitLinkBtn);
        console.log('cc.vv.gameNetMgr.isShowLinkBtn: ' + cc.vv.gameNetMgr.isShowLinkBtn);
        console.log('cc.vv.userMgr.userId: ' + cc.vv.userMgr.userId);
        console.log('cc.vv.userMgr.duiyouId: ' + cc.vv.userMgr.duiyouId);
        this._userinfo.getChildByName("end_call_btn").active = false;
        this._userinfo.getChildByName("call_btn").active = false;
        console.log('this._userId: ' + this._userId);
        if (this._userId == cc.vv.userMgr.duiyouId && cc.vv.gameNetMgr.seats[cc.vv.gameNetMgr.getSeatIndexByID(cc.vv.userMgr.duiyouId)].online == true) {
            this._userinfo.getChildByName("tip").active = true;
            this._userinfo.getChildByName("end_call_btn").active = cc.vv.gameNetMgr.isShowQuitLinkBtn;
            this._userinfo.getChildByName("call_btn").active = cc.vv.gameNetMgr.isShowLinkBtn;
            if (cc.vv.gameNetMgr.isShowQuitLinkBtn)
            {
                this._userinfo.getChildByName("tip").getComponent(cc.Label).string = "和" + this.getName(cc.vv.userMgr.userName) + "通话中";
                cc.vv.gameNetMgr.iscalling = false;
            }
            else
            {
                if (cc.vv.gameNetMgr.iscalling) {
                    this._userinfo.getChildByName("tip").getComponent(cc.Label).string = "正在呼叫" + this.getName(cc.vv.userMgr.userName) + ",请稍候";; 
                } else
                {
                    this._userinfo.getChildByName("tip").getComponent(cc.Label).string = "";
                }
            }
        } else if (this._userId == cc.vv.userMgr.userId && cc.vv.gameNetMgr.seats[cc.vv.gameNetMgr.getSeatIndexByID(cc.vv.userMgr.duiyouId)].online == true) {
            this._userinfo.getChildByName("tip").active = true;
            if (cc.vv.gameNetMgr.isShowQuitLinkBtn) {
                this._userinfo.getChildByName("tip").getComponent(cc.Label).string = "和" + this.getName(cc.vv.gameNetMgr.seats[cc.vv.gameNetMgr.getSeatIndexByID(cc.vv.userMgr.duiyouId)].name) + "通话中";
                cc.vv.gameNetMgr.iscalling = false;
            }
            else {
                if (cc.vv.gameNetMgr.iscalling) {
                    this._userinfo.getChildByName("tip").getComponent(cc.Label).string = "正在呼叫" + this.getName(cc.vv.gameNetMgr.seats[cc.vv.gameNetMgr.getSeatIndexByID(cc.vv.userMgr.duiyouId)].name)+",请稍候";
                } else {
                    this._userinfo.getChildByName("tip").getComponent(cc.Label).string = "";
                }
            }
        }else{
            this._userinfo.getChildByName("end_call_btn").active = false;
            this._userinfo.getChildByName("call_btn").active = false;
            this._userinfo.getChildByName("tip").active = false;
        }
        
        // this._userinfo.getChildByName("end_call_btn").active = cc.vv.gameNetMgr.isShowQuitLinkBtn;
        // this._userinfo.getChildByName("call_btn").active = cc.vv.gameNetMgr.isShowLinkBtn;
        
    },

    getName: function (str)
    {
        if(str.length > 5) {
            return cc.vv.userMgr.userName.substring(0, 5);
        }
        return str;
    },
    
    show: function (name, userId, iconSprite, sex, ip, gems,coins, isOpenLink) {
        if(userId != null && userId > 0){
            this._userId = userId;
            this.refresh();
            this._userinfo.active = true;
            this._userinfo.getChildByName("icon").getComponent(cc.Sprite).spriteFrame = iconSprite.spriteFrame;
            this._userinfo.getChildByName("name").getComponent(cc.Label).string = "昵称:"+name;
            if(isOpenLink == true && cc.vv.gameNetMgr.isShowZuDuiBtn == true && cc.vv.userMgr.userId != userId){
                this._userinfo.getChildByName("zuduibtn").active = true;
            }else{
                this._userinfo.getChildByName("zuduibtn").active = false;
            }
            if(ip){
                ip = ip.replace("::ffff:","");
            }
            else{
                ip = '离线';
            }
            this._userinfo.getChildByName("ip").getComponent(cc.Label).string = "IP: " + ip;
            this._userinfo.getChildByName("id").getComponent(cc.Label).string = "ID: " + userId;
            //var new_str_gems = 0;
            //if(gems > 100000){
            //    new_str_gems = gems/10000 + "W+";
            //}else{
            //    new_str_gems = gems;
            //}
            //if (cc.vv.gameNetMgr.conf.type == cc.vv.gameNetMgr.QUAN_MJ || cc.vv.gameNetMgr.conf.type == cc.vv.gameNetMgr.JINHUA_GAME || cc.vv.gameNetMgr.conf.type == cc.vv.gameNetMgr.NIUNIU_GAME ) {
            //    this._userinfo.getChildByName("bs").active = false;
            //    this._userinfo.getChildByName("bean").active = true;
            //} else
            //{
            //    this._userinfo.getChildByName("bs").active = true;
            //    this._userinfo.getChildByName("bean").active = false;
            //}
            this._userinfo.getChildByName("gems").getComponent(cc.Label).string = gems;
            this._userinfo.getChildByName("money").getComponent(cc.Label).string = coins;
            
            var sex_female = this._userinfo.getChildByName("sex_female");
            sex_female.active = false;

            var sex_male = this._userinfo.getChildByName("sex_male");
            sex_male.active = false;
            
            
            if(sex == 1){
                sex_male.active = true;
            }   
            else if (sex == 0) {

                sex_female.active = true;
            }else{
                sex_male.active = true;
            }
        }
    },
    
    onClicked:function(){
        this._userinfo.active = false;
    }

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
