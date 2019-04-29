
cc.Class({
    extends: cc.Component,

    properties: {
        ParentFrameArr:{ default: [], type: cc.Node },
        _ParentFrame: null,
    },
    // LIFE-CYCLE CALLBACKS:
    // onLoad () {},
    BtnBack: function (event, args) {
        cc.vv.audioMgr.playSFX("dian.mp3");
        event.target.parent.active = false;
        if (this._ParentFrame != null) {
            this._ParentFrame.active = true;
        }
        if (this.ParentFrameArr.length > 0) {
            for (var i = 0; i < this.ParentFrameArr.length; i++) {
                this.ParentFrameArr[i].active = true;
            }
        }
    },

    OpenFrame: function () {
        this.node.active = true;
        if (this._ParentFrame != null) {
            this._ParentFrame.active = false;
        }
        if (this.ParentFrameArr.length > 0) {
            for (var i = 0; i < this.ParentFrameArr.length; i++) {
                this.ParentFrameArr[i].active = false;
            }
        }
    },

    start () {

    },

    // update (dt) {},
});
