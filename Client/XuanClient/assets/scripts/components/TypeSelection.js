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
        leixingxuanze: cc.Node,
        gamelist: cc.Node,
    },

    // use this for initialization
    onLoad: function () {

    },

    getType: function () {
        var type = 0;
        for (var i = 0; i < this.leixingxuanze.childrenCount; ++i) {
            if (this.leixingxuanze.children[i].getComponent("RadioButton").checked) {
                type = i;
                break;
            }
        }
        return type;
    },

    onCloseClick: function () {
        this.node.active = false;
    },

    // called every frame, uncomment this function to activate update callback
    update: function (dt) {
        var type = this.getType();
        if (this.lastType != type) {
            this.lastType = type;
            for (var i = 0; i < this.gamelist.childrenCount; ++i) {
                this.gamelist.children[i].active = false;
                if (type == i) {
                    this.gamelist.children[i].active = true;
                }
            }
        }
    },
});
