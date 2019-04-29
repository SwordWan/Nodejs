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
        _status: null,
        _endTime: 0,
    },

    // use this for initialization
    start: function () {
        this._status = cc.find('Canvas/status');
    },

    // called every frame, uncomment this function to activate update callback
    update: function (dt) {
        this._endTime += dt;
        if (this._endTime >= 1) {
            this._endTime = 0;
            var xinhao = this._status.getChildByName('xinhao');
            var xinhaoIndex = 3;
            for (var i = 0; i < xinhao.children.length; ++i) {
                xinhao.children[i].active = false;
            }
            if (cc.vv.net.delayMS != null) {
                if (cc.vv.net.delayMS > 500) {
                    xinhaoIndex = 2;
                }
                else if (cc.vv.net.delayMS > 100) {
                    xinhaoIndex = 1;
                }
                else {
                    xinhaoIndex = 0;
                }
            }
            xinhao.children[xinhaoIndex].active = true;

            var power = this._status.getChildByName('power');
            power.scaleX = cc.vv.anysdkMgr.getBatteryPercent();
        }
    },
});
