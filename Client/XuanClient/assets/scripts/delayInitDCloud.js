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
    },

    // use this for initialization
    onLoad: function () {
        if (!cc.vv.userMgr.IsinitGcloudRoom) {
            cc.vv.userMgr.IsinitGcloudRoom = true;
            try {
                this.scheduleOnce(function () {
                    var openId = cc.vv.mjutil.getOpenId(cc.vv.userMgr.account);  // 语音  11.28
                    console.log("js_____________get openId:" + openId); // 语音  11.28
                    cc.vv.anysdkMgr.onInitGCloudRoom(openId); // 语音  11.28
                }, 2);
            } catch (e) {
                    cc.vv.alert.show("提示", "语音初始化失败,请稍候重试");
                    this.scheduleOnce(function () {
                        cc.vv.alert.hide();
                    }, 2);
            }
        }
    },

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
