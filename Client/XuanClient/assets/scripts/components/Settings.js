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
        _btnYXOpen: null,
        _btnYXClose: null,
        _btnYYOpen: null,
        _btnYYClose: null,
    },

    // use this for initialization
    onLoad: function () {
        if (cc.vv == null) {
            return;
        }
        this.gameBg = cc.find("Canvas/bg");

        this._btnYXOpen = this.node.getChildByName("yinxiao").getChildByName("btn_yx_open");
        this._btnYXClose = this.node.getChildByName("yinxiao").getChildByName("btn_yx_close");

        this._btnYYOpen = this.node.getChildByName("yinyue").getChildByName("btn_yy_open");
        this._btnYYClose = this.node.getChildByName("yinyue").getChildByName("btn_yy_close");

        this.initButtonHandler(this.node.getChildByName("btn_close"));
        this.initButtonHandler(this.node.getChildByName("btn_exit"));


        this.initButtonHandler(this._btnYXOpen);
        this.initButtonHandler(this._btnYXClose);
        this.initButtonHandler(this._btnYYOpen);
        this.initButtonHandler(this._btnYYClose);


        var slider = this.node.getChildByName("yinxiao").getChildByName("progress");
        cc.vv.utils.addSlideEvent(slider, this.node, "Settings", "onSlided");

        var slider = this.node.getChildByName("yinyue").getChildByName("progress");
        cc.vv.utils.addSlideEvent(slider, this.node, "Settings", "onSlided");

        this.refreshVolume();
        var nodebtn = this.node.getChildByName("btn_sqjsfj");
        if (cc.vv.gameNetMgr.gamestate == '' && cc.vv.gameNetMgr.numOfGames == 0) {
            if (nodebtn) {
                nodebtn.active = false;
            }
        } else {
            if (nodebtn) {
                nodebtn.active = true;
            }
        }
        //初始化网络事件监听器
        var self = this;
        this.node.on('game_playing', function (data) {
            this.node.getChildByName("btn_sqjsfj").active = true;
        });
    },

    start: function () {
        this.fangyan = cc.sys.localStorage.getItem('fangyan');  
        this.fangyanButton = this.node.getChildByName('leixingxuanze').children[3].getComponent('RadioButton');// 原来的写反了  取反
        if (this.fangyan == 'false') {
            this.fangyanButton.select();
        }
        var showBg = cc.sys.localStorage.getItem('showbg');
        this.zhuoBu = this.node.getChildByName('zhuobu');
        if (this.zhuoBu) {
            this.zhuoBu.active = false;
            //for (var i = 0; i < this.zhuoBu.childrenCount; ++i) {
            //    var n = this.zhuoBu.children[i].getComponent("RadioButton");
            //    if (n != null) {
            //        if (showBg != null) {
            //            if (showBg == i) {
            //                n.select();
            //            }
            //        } else if (i == 0) {
            //            n.select();
            //            return;
            //        }
            //    }
            //}
        }
    },

    onSlided: function (slider) {
        if (slider.node.parent.name == "yinxiao") {
            cc.vv.audioMgr.setSFXVolume(slider.progress);
        }
        else if (slider.node.parent.name == "yinyue") {
            cc.vv.audioMgr.setBGMVolume(slider.progress);
        }
        this.refreshVolume();
    },

    initButtonHandler: function (btn) {
        cc.vv.utils.addClickEvent(btn, this.node, "Settings", "onBtnClicked");
    },

    refreshVolume: function () {

        this._btnYXClose.active = cc.vv.audioMgr.sfxVolume > 0;
        this._btnYXOpen.active = !this._btnYXClose.active;

        var yx = this.node.getChildByName("yinxiao");
        var width = 430 * cc.vv.audioMgr.sfxVolume;
        var progress = yx.getChildByName("progress")
        progress.getComponent(cc.Slider).progress = cc.vv.audioMgr.sfxVolume;
        progress.getChildByName("progress").width = width;
        //yx.getChildByName("btn_progress").x = progress.x + width;


        this._btnYYClose.active = cc.vv.audioMgr.bgmVolume > 0;
        this._btnYYOpen.active = !this._btnYYClose.active;
        var yy = this.node.getChildByName("yinyue");
        var width = 430 * cc.vv.audioMgr.bgmVolume;
        var progress = yy.getChildByName("progress");
        progress.getComponent(cc.Slider).progress = cc.vv.audioMgr.bgmVolume;

        progress.getChildByName("progress").width = width;
        //yy.getChildByName("btn_progress").x = progress.x + width;
    },

    onBtnClicked: function (event) {
        if (event.target.name == "btn_close") {
            this.node.active = false;
        }
        else if (event.target.name == "btn_exit") {
            cc.sys.localStorage.removeItem("wx_account");
            cc.sys.localStorage.removeItem("wx_sign");
            cc.director.loadScene("login");
        }
        else if (event.target.name == "btn_yx_open") {
            cc.vv.audioMgr.setSFXVolume(1.0);
            this.refreshVolume();
        }
        else if (event.target.name == "btn_yx_close") {
            cc.vv.audioMgr.setSFXVolume(0);
            this.refreshVolume();
        }
        else if (event.target.name == "btn_yy_open") {
            cc.vv.audioMgr.setBGMVolume(1);
            this.refreshVolume();
        }
        else if (event.target.name == "btn_yy_close") {
            cc.vv.audioMgr.setBGMVolume(0);
            this.refreshVolume();
        }
    },

    getType: function () {
        var type = 0;
        for (var i = 0; i < this.zhuoBu.childrenCount; ++i) {
            var n = this.zhuoBu.children[i].getComponent("RadioButton");
            if (n.checked) {
                type = i;
                break;
            }
        }
        return type;
    },

    // called every frame, uncomment this function to activate update callback
    update: function (dt) {
        if (this.fangyanButton) {
            var fangyan = this.fangyanButton.checked;
            if (fangyan != this.fangyan) {
                this.fangyan = fangyan;
                cc.sys.localStorage.setItem('fangyan', !this.fangyan);
            }
        }
        //if (this.zhuoBu) {
        //    this.zhuoBu.active = false;
        //    var type = this.getType();
        //    if (this.lastType != type) {
        //        this.lastType = type;
        //        cc.sys.localStorage.setItem('showbg', this.lastType);
        //        if (this.gameBg) {
        //            this.setBg = this.gameBg.children[0];
        //            this.setBg.getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.setUserBg(this.lastType);
        //        }
        //    }
        //}
    },
});
