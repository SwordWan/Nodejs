cc.Class({
    extends: cc.Component,

    properties: {
        contentLabel: {default: null, displayName: "内容", type: cc.Label},

    },

    onLoad: function () {

    },
    setContent(content){
        this.contentLabel.string = content;
    },

});
