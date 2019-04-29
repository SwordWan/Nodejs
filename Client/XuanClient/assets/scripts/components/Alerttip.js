cc.Class({
    extends: cc.Component,

    properties: {
     
        parent: { default: null, type: cc.Node },
    },

    // use this for initialization
    onLoad: function () {
        if (cc.vv == null) {
            return;
        }
        this._alert = this.node;
        this._content = this.parent.getChildByName("content").getComponent(cc.Label);
        cc.vv.alertTip = this;
    },


    show: function (content) {
        this._content.string = content;
        this.node.active = true;
        this.parent.active = true;
        this.node.getComponent(cc.Animation).play("alertTip");
    },
    
    onDestory: function () {
        if (cc.vv) {
            cc.vv.alert = null;
        }
    }

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
