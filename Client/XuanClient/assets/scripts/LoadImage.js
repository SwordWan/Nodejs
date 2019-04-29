import { isUndefined } from "util";

cc.Class({
    extends: cc.Component,

    properties:
        {
            _defaultUserICon: null,
            _defaultClubICon: null,
        },
    // LIFE-CYCLE CALLBACKS:
    // onLoad () {},
    start() {
       // this.LoadImageByURL(1, 121363);
    },

    LoadUserIcon: function (userid) {
        this.LoadImageByURL(1, userid);
    },

    LoadClubIcon: function (clubid) {
        this.LoadImageByURL(2,clubid);
    },

    LoadImageByURL: function (imode, id) {
        if (cc.vv.baseInfoMap == null) {
            cc.vv.baseInfoMap = {};
        }
        
        if (id == 0) {
            var _sprite = this.node.getComponent(cc.Sprite);
            if (imode == 1) {
                _sprite.spriteFrame = cc.vv.userMgr._DUserIcon;
            } else {
                _sprite.spriteFrame = cc.vv.userMgr._DClubIcon;
            }
            return;
        }


        var self = this;
        var _node = self.node;
        var _sprite = this.node.getComponent(cc.Sprite);
        var str = id + "_" + imode;
        if (cc.vv.baseInfoMap[str] != null) {
            _sprite.spriteFrame = cc.vv.baseInfoMap[str];
            return;
        }

        var url = "";
        if (imode == 1) {
            // url = "http://47.98.188.228:9501/GetImageUrl?iUserId=" + id + "&iMode=1";
            url = cc.vv.http.master_url + "/GetImageUrl?iUserId=" + id + "&iMode=1";
        } else if(imode == 2) {
            // url = "http://47.98.188.228:9501/GetImageUrl?iClubId=" + id + "&iMode=2";
            url = cc.vv.http.master_url + "/GetImageUrl?iUserId=" + id + "&iMode=2";
        }
        if (imode == 1) {
            _sprite.spriteFrame = cc.vv.userMgr._DUserIcon;
        } else {
            _sprite.spriteFrame = cc.vv.userMgr._DClubIcon;
        }
   
        cc.loader.load({
            url: url, type: 'jpg'
        }, function (err, tex) {
            //console.log("wxheadicon" + tex);
            if (tex == null || self.node == null) {
                return;
            }
            var frame = new cc.SpriteFrame(tex, cc.Rect(0, 0, _node, _node));
            cc.vv.baseInfoMap[str] = frame;
            _sprite.spriteFrame = frame;
        });
    },
    // update (dt) {},
});
