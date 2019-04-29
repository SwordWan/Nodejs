
cc.Class({
    extends: cc.Component,

    properties: {
        title: { default: null, type: cc.Label },
        content: { default: null, type: cc.Label },
        confirmBtn: { default: null, type: cc.Label },

        _func:null,
    },



    SetConfirmInfo: function (title, content, confirmLbl, Func) {
        this.title.string = title;
        this.content.string = content;
        this.confirmBtn.string = confirmLbl;
        this._func = Func;
        this.node.active = true;
    },

    ConfirmClick: function () {
        if (this._func != null) {
            this._func();
        }
        this.node.active = false;
    },



});
