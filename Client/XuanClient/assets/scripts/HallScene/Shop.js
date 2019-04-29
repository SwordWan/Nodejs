cc.Class({
    extends: cc.BaseClass,

    properties: {

    },

    // LIFE-CYCLE CALLBACKS:

    onShowView: function () {
        this._labGold.$Label.string = cc.vv.userMgr.coins;
    },

});
