cc.Class({
    extends: cc.Component,

    properties: {
        // foo: {
        //    default: null,
        //    url: cc.Texture2D,  // optional, default is typeof default
        //    serializable: true, // optional, default is true
        //    visible: true,      // optional, default is true
        //    displayName: 'Foo', // optional
        //    readonly: false,    // optional, default is false
        // },
        // ...
        _nextPlayTime: 1,
        _replay: null,
        _isPlaying: true,
        _btn_pause: null,
        _btn_play: null
    },

    // use this for initialization
    onLoad: function () {
        if (cc.vv == null) {
            return;
        }

        this._replay = cc.find("Canvas/replay");
        this._btn_pause = this._replay.getChildByName("btn_pause");
        this._btn_play = this._replay.getChildByName("btn_play");
        this._replay.active = cc.vv.replayMgr.isReplay();
        this._btn_pause.active = false;
        this._btn_play.active = true;
    },

    onBtnPauseClicked: function () {
        if (!this._isPlaying) {
            this._btn_pause.active = false;
            this._btn_play.active = true;
            this._isPlaying = true;
        } else {
            this._isPlaying = false;
        }
    },

    onBtnPlayClicked: function () {
        if (this._isPlaying) {
            this._btn_pause.active = true;
            this._btn_play.active = false;
            this._isPlaying = false;
        } else {
            this._isPlaying = true;
        }
    },

    onBtnBackClicked: function () {
        cc.vv.replayMgr.clear();
        cc.vv.gameNetMgr.reset();
        cc.vv.gameNetMgr.roomId = null;
        if (cc.vv.gameNetMgr != null) {
            cc.vv.gameNetMgr.IsinTheBackplay = false;
        }
        cc.director.loadScene("hall");
    },

    // called every frame, uncomment this function to activate update callback
    update: function (dt) {
        if (cc.vv) {
            if (this._isPlaying && cc.vv.replayMgr.isReplay() == true && this._nextPlayTime > 0) {
                this._nextPlayTime -= dt;
                if (this._nextPlayTime < 0) {
                    this._nextPlayTime = cc.vv.replayMgr.takeAction();
                }
            }
        }
    },
});