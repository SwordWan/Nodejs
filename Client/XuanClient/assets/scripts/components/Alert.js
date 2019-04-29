//Alert.js
cc.Class({
    extends: cc.BaseClass,

    properties: {
        m_btNode: [cc.Node],
        m_labText: cc.Label,
    },

    //0: 确定 1: 确定取消 2: 确定取消关闭
    showAlert: function (str, style, Func, Hook) {
        style = style || 0;
        this.m_Hook = Hook;
        this.m_callBack = Func;
        this.m_labText.string = str;
        for (var i in this.m_btNode) {
            this.m_btNode[i].active = parseInt(i) <= style;
        }
    },

    onBtClick: function (Tag, Data) {
        var res = null;
        if (Data == '1') res = true;
        if (Data == '0') res = false;

        if (this.m_callBack != null) {
            this.m_callBack(res);
        }
        this.hideView();
    },

});