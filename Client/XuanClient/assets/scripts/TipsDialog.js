cc.Class({
    extends: cc.Component,

    properties: {
        titleLabel: {default: null, displayName: "提示", type: cc.Label},
        contentLabel: {default: null, displayName: "内容", type: cc.Label},

        _okCallBack: null,
        _cancelCallBack: null,
    },

    onLoad: function () {

    },
    setTips(content, okCallBack){
        this.contentLabel.string = content;
        this._okCallBack = okCallBack;
    },
    onClickOk(){
        if (this._okCallBack) {
            this._okCallBack();
        }
        this.node.destroy();
    },
    onClickCancel(){
        if (this._cancelCallBack) {
            this._cancelCallBack();
        }
        this.node.destroy();
    },
});
