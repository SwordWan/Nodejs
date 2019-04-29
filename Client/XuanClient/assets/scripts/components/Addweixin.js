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
        _ShowWeiXinBg:{
            default:null,
            type:cc.Node,
        }
    },

    // use this for initialization
    onLoad: function () {

    },  
    ShowWeixin:function()
    {
      cc.vv.alert.show("消息", "添加微信 买砖石", function () {
                        cc.vv.alert._alert.active = false;
                        
                    }, false);
        
    }
    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
