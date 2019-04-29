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
        EmojiAnim:
        {
            default: null,
            type: cc.Node
        },


        StartSprite:
        {
            default: [],
            type: cc.SpriteFrame
        },
        _anim: null,
        _isaniming: false,
        _pos:null,
    },


    // use this for initialization
    onLoad: function () {

        if (cc.vv.gameNetMgr.conf.type == cc.vv.gameNetMgr.NIUNIU_GAME
            || cc.vv.gameNetMgr.conf.type == cc.vv.gameNetMgr.JINHUA_GAME
            || cc.vv.gameNetMgr.conf.type == cc.vv.gameNetMgr.FKNIU_GAME
            || cc.vv.gameNetMgr.conf.type == cc.vv.gameNetMgr.FK_JINHUA
            || cc.vv.gameNetMgr.conf.type == cc.vv.gameNetMgr.TenOX_GAME) {
            this._pos = this.node.getChildByName("pos").children;
        } 
        var self = this;
        this.node.on('NewEmojiEvent', function (data) {
            if (cc.vv.gameNetMgr.conf.type == cc.vv.gameNetMgr.NIUNIU_GAME
                || cc.vv.gameNetMgr.conf.type == cc.vv.gameNetMgr.JINHUA_GAME
                || cc.vv.gameNetMgr.conf.type == cc.vv.gameNetMgr.FKNIU_GAME
                || cc.vv.gameNetMgr.conf.type == cc.vv.gameNetMgr.FK_JINHUA
                || cc.vv.gameNetMgr.conf.type == cc.vv.gameNetMgr.TenOX_GAME) {
                self.onReceiveCowEmoji(data.detail);
            } else
            {
                self.onReceiveEmoji(data.detail);
            }
        });
    },
    
    onReceiveEmoji: function (data)
    {
        if (this._isaniming)
            return;

        this._isaniming = true;

        var idx = cc.vv.gameNetMgr.getSeatIndexByID(data.fromUser);
        var localIdx = cc.vv.gameNetMgr.getLocalIndex(idx);
        var from;
        if (cc.vv.gameNetMgr.gamestate != 'playing' || cc.vv.gameNetMgr.isZuDuistatus) {
            from = cc.vv.mahjongmgr.iconStartPos[localIdx];
        } else {
            from = cc.vv.mahjongmgr.iconPos[localIdx];
        }
        idx = cc.vv.gameNetMgr.getSeatIndexByID(data.toUser);
        localIdx = cc.vv.gameNetMgr.getLocalIndex(idx);
        var to;
        if (cc.vv.gameNetMgr.gamestate != 'playing' || cc.vv.gameNetMgr.isZuDuistatus) {
            to = cc.vv.mahjongmgr.iconStartPos[localIdx];
        } else {
            to = cc.vv.mahjongmgr.iconPos[localIdx];
        }
        
        this.EmojiAnim.getComponent(cc.Sprite).spriteFrame = this.StartSprite[data.emojiId - 1];


        //var pos = this.EmojiAnim.convertToWorldSpace(from.getPosition())
        var pos = from.getPosition();
        var pos2 = to.getPosition();

        this.EmojiAnim.setPosition(pos);
        this.EmojiAnim.active = true;
        var moveto = cc.moveTo(0.5, pos2);
        //moveto.easing(cc.easeInOut(3.0))
        this.EmojiAnim.runAction(moveto);
        var anim;
        this.scheduleOnce(function () {
            anim = this.EmojiAnim.getComponent(cc.Animation).play("item" + data.emojiId);
            anim.speed = 0.2;

            cc.vv.audioMgr.playAudioFx("resources/newemoji/item" + data.emojiId + "/item"+ data.emojiId+".mp3");
            this.scheduleOnce(function () {
                this.EmojiAnim.active = false;
                this.EmojiAnim.setPosition(0, 0);
                this._isaniming = false;
            }, anim.duration / 0.2 + 0.1);
        }, 0.5);
    },


    onReceiveCowEmoji: function (data) {
        if (this._isaniming)
            return;

        this._isaniming = true;

        var idx = cc.vv.gameNetMgr.getSeatIndexByID(data.fromUser);
        var localIdx = cc.vv.gameNetMgr.getCowLocalIndex(idx);
        var from;
        from = this._pos[localIdx];
        idx = cc.vv.gameNetMgr.getSeatIndexByID(data.toUser);
        localIdx = cc.vv.gameNetMgr.getCowLocalIndex(idx);
        var to;
        to = this._pos[localIdx];

        this.EmojiAnim.getComponent(cc.Sprite).spriteFrame = this.StartSprite[data.emojiId - 1];


        //var pos = this.EmojiAnim.convertToWorldSpace(from.getPosition())
        var pos = from.getPosition();
        var pos2 = to.getPosition();

        this.EmojiAnim.setPosition(pos);
        this.EmojiAnim.active = true;
        var moveto = cc.moveTo(0.5, pos2);
        //moveto.easing(cc.easeInOut(3.0))
        this.EmojiAnim.runAction(moveto);
        var anim;
        this.scheduleOnce(function () {
            anim = this.EmojiAnim.getComponent(cc.Animation).play("item" + data.emojiId);
            anim.speed = 0.2;

            cc.vv.audioMgr.playAudioFx("resources/newemoji/item" + data.emojiId + "/item" + data.emojiId + ".mp3");
            this.scheduleOnce(function () {
                this.EmojiAnim.active = false;
                this.EmojiAnim.setPosition(0, 0);
                this._isaniming = false;
            }, anim.duration / 0.2 + 0.1);
        }, 0.5);
    },


    onClickEmoji: function (event,arg)
    {
        var id = this.node.getChildByName("userinfo").getChildByName("id").getComponent(cc.Label).string.substring(3);
        
        id = Number(id);
        if (id == cc.vv.userMgr.userId)
            return;
        var data = {
            private: false,
            flag: "NewEmoji",
            fromUser: cc.vv.userMgr.userId,
            toUser: id,
            emojiId: arg
        }
        cc.vv.net.send("sendmsg", data);
        this.node.getComponent("UserInfoShow")._userinfo.active = false;
    },



});
