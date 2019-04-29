cc.Class({
    extends: cc.Component,

    properties: {
        winFont: {default: null,type: cc.BitmapFont},
    },

    // use this for initialization
    onLoad: function () {
        if (cc.vv == null) {
            return;
        }
        
    },

    // called every frame, uncomment this function to activate update callback
    update: function (dt) {
    }
  
});
