var AudioPlayer = require('AudioPlayer');
var AudioMgr = require('AudioMgr');

cc.Class({
    extends: cc.Component,

    properties: {
        clickSound: {default: null, displayName: "按钮声音", url: cc.AudioClip},
    },

    onLoad: function () {
        this.node.on(cc.Node.EventType.TOUCH_START, function () {
            if (this.clickSound) {
                AudioPlayer.playEffect(this.clickSound, false);
            } else {
                AudioMgr.playButtonSound();
            }
            return true;
        }, this);
        this.node.on(cc.Node.EventType.TOUCH_END, function () {

        }, this);
        this.node.on(cc.Node.EventType.TOUCH_CANCEL, function () {

        }, this);
        this.node.on(cc.Node.EventType.TOUCH_MOVE, function () {
        }, this);
    },

});
