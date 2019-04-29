cc.Class({
    extends: cc.Component,

    properties: {
        _arrow: null,
        _pointer: null,
        _timeLabel: null,
        _time: -1,
        _alertTime: -1,
        _playEfxs: null,
        // foo: {
        //    default: null,
        //    url: cc.Texture2D,  // optional, default is typeof default
        //    serializable: true, // optional, default is true
        //    visible: true,      // optional, default is true
        //    displayName: 'Foo', // optional
        //    readonly: false,    // optional, default is false
        // },
        // ...
    },

    // use this for initialization
    onLoad: function () {
        var gameChild = this.node.getChildByName("game");
        this._arrow = gameChild.getChildByName("arrow");
        this._pointer = this._arrow.getChildByName("pointer");
        this._playEfxs = gameChild.getChildByName('userkuang');
        //this._playEfxs = this._userkuang.getChildByName('Z_user_kuang');
        this.initPointer();

        this._timeLabelSpriteOne = this._arrow.getChildByName("gewei").getComponent(cc.Sprite);
        this._timeLabelSpriteTen = this._arrow.getChildByName("shiwei").getComponent(cc.Sprite);
        // this._timeLabel.string = "00";

        var self = this;

        this.node.on('game_playing', function (data) {
            self.initPointer();
        });

        this.node.on('game_chupai', function (data) {
            self.initPointer();
            self._time = 20;
            self._alertTime = 3;
        });
    },


    initPointer: function () {
        if (cc.vv == null) {
            return;
        }
        var turn = cc.vv.gameNetMgr.turn;
        var localIndex = cc.vv.gameNetMgr.getLocalIndex(turn);
        //ani.play('user_kuang');
        for (var i = 0; i < this._pointer.children.length; ++i) {
            if (i == localIndex) {
                this._pointer.children[i].active = true;
                cc.vv.mahjongmgr.setUserAnims(i, true);
            } else {
                this._pointer.children[i].active = false;
                cc.vv.mahjongmgr.setUserAnims(i, false);
            }
        }
    },

    ReOnline: function (time)
    {   
        console.log("ReOnline" + time);
        var times = time / 1000;
        if (times != null) {
            if (times > 20 )
                this._time = 0;
            else {
                this._time = 20 - times;
            }
        }
        else
        {
            this._time = 0;
        }
    },
    // called every frame, uncomment this function to activate update callback
    update: function (dt) {
        if (this._time > 0) {
            this._time -= dt;
            if (this._alertTime > 0 && this._time < this._alertTime) {
                cc.vv.audioMgr.playSFX("timeup_alarm.mp3");
                this._alertTime = -1;
            }
            var pre = "";
            if (this._time < 0) {
                this._time = 0;
            }

            var t = Math.ceil(this._time);

            var ten = t / 10;
            var one = t % 10;
            //console.log(ten,one);

            ten = Math.floor(ten);
            one = Math.floor(one);
            if (t < 10) {
                pre = "0";
            }
            if (this._timeLabelSpriteOne) {
                var str = one.toString();
                this.TimeAtlasJs = this._timeLabelSpriteOne.getComponent('TimeAtlas');
                str = 'labasl_1_00' + str;
                this._timeLabelSpriteOne.spriteFrame = this.TimeAtlasJs.Atlass.getSpriteFrame(str);
            }
            if (this._timeLabelSpriteTen) {
                this.TimeAtlasJs = this._timeLabelSpriteOne.getComponent('TimeAtlas');
                var str = ten.toString();
                str = 'labasl_1_00' + str;
                this._timeLabelSpriteTen.spriteFrame = this.TimeAtlasJs.Atlass.getSpriteFrame(str);
            }
            //  this._timeLabelSpriteOne
            //  this._timeLabelSprite.string = pre + t;
        }
        else
        {
            if (this._timeLabelSpriteOne) {
                this.TimeAtlasJs = this._timeLabelSpriteOne.getComponent('TimeAtlas');
                var str = 'labasl_1_000' ;
                this._timeLabelSpriteOne.spriteFrame = this.TimeAtlasJs.Atlass.getSpriteFrame(str);
            }
            if (this._timeLabelSpriteTen) {
                this.TimeAtlasJs = this._timeLabelSpriteOne.getComponent('TimeAtlas');
                var  str = 'labasl_1_000';
                this._timeLabelSpriteTen.spriteFrame = this.TimeAtlasJs.Atlass.getSpriteFrame(str);
            }
        }
    },
});
