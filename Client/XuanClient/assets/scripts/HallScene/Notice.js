cc.Class({
    extends: cc.BaseClass,

    properties: {
    },

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {},

    start () {

    },

    showView: function () {
        this._ScrollView.active = true;
        this._content.active = false;
    },

    onBtItem: function () {
        this.m_Hook.PlayBtnSound();
        this._ScrollView.active = false;
        this._content.active = true;
    },

    onBtReturn: function () {
        this.m_Hook.PlayBtnSound();
        this._ScrollView.active = true;
        this._content.active = false;
    }

    // update (dt) {},
});
