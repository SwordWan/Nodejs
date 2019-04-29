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
        _PengGangs: null,
        _ArraypengAndGaneHoldsofmjid: [],
    },

    // use this for initialization
    onLoad: function () {
        if (!cc.vv) {
            return;
        }
        var gameChild = this.node.getChildByName("game");

        var myself = gameChild.getChildByName("myself");
        var pengangroot = myself.getChildByName("penggangs");
        var realwidth = cc.director.getVisibleSize().width;
        var scale = realwidth / 1280;
        pengangroot.scaleX *= scale;
        pengangroot.scaleY *= scale;

        var self = this;
        //this.node.on('peng_notify', function (data) {
        //    //刷新所有的牌
        //    //console.log(data.detail);

        //    var data = data.detail;
        //    self.onPengGangChanged(data);
        //});

        //this.node.on('chi_notify', function (data) {
        //    //刷新所有的牌
        //    //console.log(data.detail);
        //    var setdata = data.detail;
        //    self.onPengGangChanged(setdata);
        //});

        //this.node.on('gang_notify', function (data) {
        //    //刷新所有的牌
        //    //console.log(data.detail);
        //    var data = data.detail;
        //    self.onPengGangChanged(data.seatData);
        //});

        this.node.on('game_begin', function (data) {
            self.onGameBein();
        });

        this.node.on('ganghuanpai_notify', function (data) {
            console.log('ganghuanpai_notify  --penggangs');
            var seatData = data.detail;
            self.onPengGangChanged(seatData);
            
        });

        this.node.on('qiangganghuanpai_notify', function (data) {
            console.log('ganghuanpai_notify  --penggangs');
           
            self.huan(data);
        });

        var seats = cc.vv.gameNetMgr.seats;
        for (var i in seats) {
            this.onPengGangChanged(seats[i]);
        }

        this.node.on('game_sync', function (data) {
            var seats = cc.vv.gameNetMgr.seats;
            for (var i in seats) {
                self.onPengGangChanged(seats[i]);
            }
        });
    },


    new_chipenggang_notify: function (data) {

        console.log('ganghuanpai_notify  --penggangs');

       // var data = data.detail;
        this.onPengGangChanged(data);
    },

    onGameBein: function () {
        this.hideSide("myself");
        this.hideSide("right");
        this.hideSide("up");
        this.hideSide("left");
    },

    hideSide: function (side) {
        var gameChild = this.node.getChildByName("game");
        var myself = gameChild.getChildByName(side);
        var pengangroot = myself.getChildByName("penggangs");
        if (pengangroot) {
            for (var i = 0; i < pengangroot.childrenCount; ++i) {
                pengangroot.children[i].active = false;
            }
        }
    },
    huan: function (data) {
        var pgroot = null;
        var pai = data.detail.hupai;
        var seatIndex = cc.vv.gameNetMgr.getSeatIndexByID(data.detail.fangPaoUser);
        var seatData = cc.vv.gameNetMgr.seats[seatIndex];
        var localIndex = cc.vv.gameNetMgr.getLocalIndex(seatIndex);
        var side = cc.vv.mahjongmgr.getSide(localIndex);
        var pre = cc.vv.mahjongmgr.getFoldPre(localIndex);
        var gameChild = this.node.getChildByName("game");
        var myself = gameChild.getChildByName(side);
        var pengangroot = myself.getChildByName("penggangs");
        
        var pengs = seatData.pengs;
        if (pengs) {
            for (var i = 0; i < pengs.length; ++i) {
                if (pengs[i] == pai)
                {
                    pgroot = pengangroot.children[i];
                    var sprites = pgroot.getComponentsInChildren(cc.Sprite);
                    sprites[0].spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(pre, cc.vv.gameNetMgr.YAOJI_VALUE);
                    break;
                }
            }
        }

    },
    onPengGangChanged:function(seatData){
        
        if (seatData.angangs == null && seatData.diangangs == null && seatData.wangangs == null && seatData.pengs == null && seatData.chi_list == null){
            return;
        }
        var localIndex = cc.vv.gameNetMgr.getLocalIndex(seatData.seatindex);
        var side = cc.vv.mahjongmgr.getSide(localIndex);
        var pre = cc.vv.mahjongmgr.getFoldPre(localIndex);
       
        console.log("onPengGangChanged" + localIndex);
        
        var gameChild = this.node.getChildByName("game");
        var myself = gameChild.getChildByName(side);
        var pengangroot = myself.getChildByName("penggangs");
        
        for(var i = 0; i < pengangroot.childrenCount; ++i){
            pengangroot.children[i].active = false;
        }
        //初始化杠牌
        var index = 0;
        var iYaoji = 0;

        var chilist = seatData.chi_list
        if (chilist) {
            for (var i = 0; i < chilist.length; ++i) {
                var mjid = chilist[i][0];
                this.initPengAndGangs(pengangroot, side, pre, index, mjid, "chi", 0, seatData);
                index++;
            }
        }

        //初始化碰牌
        var pengs = seatData.pengs
        if (pengs) {
            for (var i = 0; i < pengs.length; ++i) {
                var mjid = pengs[i];
                iYaoji = 0;
                if (seatData.yaoji_pengs != null) {
                    iYaoji = seatData.yaoji_pengs[mjid];
                }
                this.initPengAndGangs(pengangroot, side, pre, index, mjid, "peng", iYaoji, seatData);
                index++;
            }
        }

        var gangs = seatData.diangangs
        for(var i = 0; i < gangs.length; ++i){
            var mjid = gangs[i];
            iYaoji = 0;
            if(seatData.yaoji_gangs != null) {
                iYaoji = seatData.yaoji_gangs[mjid];
            }
            this.initPengAndGangs(pengangroot, side, pre, index, mjid, "diangang", iYaoji, seatData);
            index++;
        }
        
        var gangs = seatData.wangangs
        for(var i = 0; i < gangs.length; ++i){
            var mjid = gangs[i];
            iYaoji = 0;
            if(seatData.yaoji_gangs != null) {
                iYaoji = seatData.yaoji_gangs[mjid];
            }
            this.initPengAndGangs(pengangroot, side, pre, index, mjid, "wangang", iYaoji, seatData);
            index++;
        }

        var gangs = seatData.angangs
        for (var i = 0; i < gangs.length; ++i) {
            var mjid = gangs[i];
            iYaoji = 0;
            if (seatData.yaoji_gangs != null) {
                iYaoji = seatData.yaoji_gangs[mjid];
            }
            this.initPengAndGangs(pengangroot, side, pre, index, mjid, "angang", iYaoji, seatData);
            index++;
        } 
    },

    Gangcuipai: function (gangs, mjid, seatData, sprites, kaishi, end) {
        if (cc.vv.gameNetMgr.conf.type == cc.vv.gameNetMgr.WANGBA_GAME || cc.vv.gameNetMgr.conf.type == cc.vv.gameNetMgr.QUAN_MJ) {
            return;
        }
        if (gangs) {
            for (var i = 0; i < gangs.length; ++i) {
                kaishi = kaishi + i * 4;
                var gangmjid = gangs[i];
                if (gangmjid == mjid) {
                    iYaoji = 0;
                    if (seatData.yaoji_gangs != null) {
                        var iYaoji = seatData.yaoji_gangs[mjid];
                    }
                    if (sprites.childrenCount <= 0)
                        return;

                    for (var s = kaishi; s < kaishi + 4; s++) {
                        var sprite = sprites[s];
                        if (s >= 4 - iYaoji + kaishi) {
                            if (sprite) {
                                var Co = sprite.node.color;

                                Co.setR(255);
                                Co.setG(255);
                                Co.setB(255);
                                sprite.node.color = Co;
                            }
                        }
                        else {
                            if (sprite) {
                                var Co = sprite.node.color;

                                Co.setR(141);
                                Co.setG(106);
                                Co.setB(106);
                                sprite.node.color = Co;
                            }
                        }

                    }
                }
                else {
                    for (var s = kaishi; s < kaishi + 4; s++) {
                        var sprite = sprites[s];
                        if (sprite) {
                            var Co = sprite.node.color;

                            Co.setR(255);
                            Co.setG(255);
                            Co.setB(255);
                            sprite.node.color = Co;
                        }
                    }
                }
            }
        }
    },

    showSeatNotice: function (sprite, flag, mjid, seatData, index, itemindex, side) {
        console.log(seatData);
        console.log(mjid + "__" + index + "__" + itemindex + "__" + side);
        if ("chi" == flag) {            
            if (mjid == seatData.chiPais[index]) {
                console.log(flag + "__" + mjid + "__" + seatData.chiPais[index]);
                var Co = sprite.node.color;
                Co.setR(210);
                Co.setG(210);
                Co.setB(255);
                sprite.node.color = Co;
            }
            else {
                var Co = sprite.node.color;
                Co.setR(255);
                Co.setG(255);
                Co.setB(255);
                sprite.node.color = Co;
            }
        }
        else if ("peng" == flag) {
            var usid = seatData.pengPais[mjid];
            var localdata = this.hideseatpai(usid, seatData);
            console.log(flag + "__" + mjid + "__" + itemindex + "__" + localdata);
            if (itemindex == localdata) {
                if (side == "myself" || side == "up") {
                    sprite.node.scaleX = 1.45;
                    sprite.node.scaleY = 1.45;
                }
                sprite.spriteFrame = cc.vv.mahjongmgr.getEmptySpriteFrame(side);
            }
            else {
                var Co = sprite.node.color;
                Co.setR(255);
                Co.setG(255);
                Co.setB(255);
                sprite.node.color = Co;
            }
        }
        else if (("diangang" == flag) || ("wangang" == flag)) {
            var usid = seatData.gangPais[mjid];
            var localdata = this.hideseatpai(usid, seatData);
            if (1 == localdata) {
                localdata = 3;
            }
            console.log(flag + "__" + mjid + "__" + itemindex + "__" + localdata);
            if (itemindex == localdata) {
                if (side == "myself" || side == "up") {
                    sprite.node.scaleX = 1.45;
                    sprite.node.scaleY = 1.45;
                }
                sprite.spriteFrame = cc.vv.mahjongmgr.getEmptySpriteFrame(side);
            }
            else {
                var Co = sprite.node.color;
                Co.setR(255);
                Co.setG(255);
                Co.setB(255);
                sprite.node.color = Co;
            }
        }
    },

    hideseatpai: function (usid, seatData) {
        var seatindex = cc.vv.gameNetMgr.getSeatIndexByID(usid);
        var tagindex = cc.vv.gameNetMgr.getLocalIndex(seatindex); // 放杠放碰的人相对于我得index

        var selfindex = cc.vv.gameNetMgr.getLocalIndex(seatData.seatindex);//杠碰的人相对我的index 

        // 盖下家  = 2   盖上家 = 0  盖对家 = 1
        var ret = -1;
        switch (selfindex - tagindex)
        {
            case 1:
            case -3:
                ret = 0;
                break;
            case 2:
            case -2:
                ret = 1;
                break;
            case 3:
            case -1:
                ret = 2;
                break;
            default:
                ret = 4;
                break;
        }

        if ((selfindex == 1 || selfindex == 2) && Math.abs(selfindex - tagindex) == 1)
        {
            if (ret == 2) {
                ret = 0;
            }
            else if(ret == 0)
            {
                ret = 2;
            }
            //if (seatData.isGang)
            //{
            //    if (ret == 2) {
            //        ret = 0;
            //    }
            //    else if (ret == 0) {
            //        ret = 2;
            //    }
            //}
        }



        //var ret = -1;
        //if (selfindex < tagindex) {
        //    ret = 3 - (tagindex - selfindex);
        //}
        //else {
        //    ret = 3 - (selfindex - tagindex);
        //}
        return ret;
    },

    pengcuipai: function (gangs, mjid, seatData, sprites, kaishi, end) {

    },
    PengGanghideCuipai: function (mjid) {
        if (cc.vv.gameNetMgr.conf.type == cc.vv.gameNetMgr.WANGBA_GAME || cc.vv.gameNetMgr.conf.type == cc.vv.gameNetMgr.QUAN_MJ) {
            return;
        }
        var seats = cc.vv.gameNetMgr.seats;
        for (var index = 0; index < seats.length; index++) {
            var seatData = seats[index];
            var localIndex = cc.vv.gameNetMgr.getLocalIndex(seats[index].seatindex);
            var side = cc.vv.mahjongmgr.getSide(localIndex);
            var gameChild = this.node.getChildByName("game");
            var myself = gameChild.getChildByName(side);
            var pengangroot = myself.getChildByName("penggangs");
            var sprites = pengangroot.getComponentsInChildren(cc.Sprite);

            var gangs = [];
            var kaishi = 0;
            var end = seatData.angangs.length * 4;

            this.Gangcuipai(seatData.angangs, mjid, seatData, sprites, kaishi, end);
            kaishi = seatData.angangs.length * 4;
            this.Gangcuipai(seatData.diangangs, mjid, seatData, sprites, kaishi, end);

            kaishi = seatData.angangs.length * 4 + seatData.diangangs.length * 4;
            this.Gangcuipai(seatData.wangangs, mjid, seatData, sprites, kaishi, end);
            kaishi = seatData.angangs.length * 4 + seatData.diangangs.length * 4 + seatData.wangangs.length * 4
            var pengs = seatData.pengs;
            if (pengs) {
                for (var i = 0; i < pengs.length; ++i) {
                    kaishi = kaishi + i * 4;
                    var pengmjid = pengs[i];
                    if (pengmjid == mjid) {
                        var iYaoji = 0;
                        if (seatData.yaoji_pengs != null) {
                            iYaoji = seatData.yaoji_pengs[mjid];
                        }
                        if (sprites.childrenCount <= 0)
                            return;

                        for (var s = kaishi; s < kaishi + 4; s++) {
                            var sprite = sprites[s];

                            if (s >= 4 - iYaoji + kaishi - 1) {
                                if (sprite) {
                            var Co = sprite.node.color;

                            Co.setR(255);
                            Co.setG(255);
                            Co.setB(255);
                            sprite.node.color = Co;

                                }
                            }
                            else {
                                if (sprite) {
                               var Co = sprite.node.color;

                            Co.setR(141);
                            Co.setG(106);
                            Co.setB(106);
                            sprite.node.color = Co;
                                }
                            }
                        }
                    }
                    else {
                        for (var s = kaishi; s < kaishi + 4; s++) {
                            var sprite = sprites[s];
                            if (sprite) {
                            var Co = sprite.node.color;
                            Co.setR(255);
                            Co.setG(255);
                            Co.setB(255);
                            sprite.node.color = Co;
                            }
                        }
                    }
                }
            }
        }
    },

    initPengAndGangs: function (pengangroot, side, pre, index, mjid, flag, iYaoji, seatData){
        console.log("initPengAndGangs" + mjid);
        var pgroot = null;
        if(pengangroot.childrenCount <= index){
            if(side == "left" || side == "right"){
                pgroot = cc.instantiate(cc.vv.mahjongmgr.pengPrefabLeft);
            }
            else{
                pgroot = cc.instantiate(cc.vv.mahjongmgr.pengPrefabSelf);
            }
            
            pengangroot.addChild(pgroot);    
        }
        else{
            pgroot = pengangroot.children[index];
            pgroot.active = true;
        }
        
        if(side == "left"){
            pgroot.y = -(index * 25 * 3);                    
        }
        else if(side == "right"){
            pgroot.y = (index * 25 * 3);
            pgroot.setLocalZOrder(-index);
        }
        else if(side == "myself"){
            pgroot.x = index * 55 * 3 + index * 10;                    
        }
        else{
            pgroot.x = -(index * 55*3);
        }

        var sprites = pgroot.getComponentsInChildren(cc.Sprite);
        var iBeginYaoji = sprites.length - iYaoji;
        if(flag == "peng") {
            iBeginYaoji--;
        }
        for(var s = 0; s < sprites.length; s++){
            var sprite = sprites[s];
            if(sprite.node.name == "gang"){
                var isGang = false;
                if ((flag != "peng") && (flag != "chi")) {
                    isGang = true;
                }
                sprite.node.active = isGang;
                sprite.node.scaleX = 1.0;
                sprite.node.scaleY = 1.0;
                if(s >= iBeginYaoji) {
                    mjid = cc.vv.gameNetMgr.YAOJI_VALUE;
                }
                if ((flag == "angang")) {
                    if (cc.vv.gameNetMgr.YAOJI_VALUE == mjid && cc.vv.gameNetMgr.YJXZDD_GAME == cc.vv.gameNetMgr.conf.type) {
                        sprite.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(pre, mjid);
                        var spritelast = sprites[s - 1];
                        if (spritelast) {
                            if (side == "myself" || side == "up") {
                                spritelast.node.scaleX = 1.4;
                                spritelast.node.scaleY = 1.4;
                            }
                            spritelast.spriteFrame = cc.vv.mahjongmgr.getEmptySpriteFrame(side);
                        }
                    } else {
                        if (cc.vv.gameNetMgr.WANGBA_GAME == cc.vv.gameNetMgr.conf.type || cc.vv.gameNetMgr.conf.type == cc.vv.gameNetMgr.QUAN_MJ) {
                            if (side == "myself") {
                                sprite.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(pre, mjid);
                            }
                            else {
                                if (side == "up") {
                                    sprite.node.scaleX = 1.45;
                                    sprite.node.scaleY = 1.45;
                                }
                                sprite.spriteFrame = cc.vv.mahjongmgr.getEmptySpriteFrame(side);
                            }
                        }
                        else {
                            if (side == "myself" || side == "up") {
                                sprite.node.scaleX = 1.45;
                                sprite.node.scaleY = 1.45;
                            }
                            sprite.spriteFrame = cc.vv.mahjongmgr.getEmptySpriteFrame(side);
                        }
                    }
                }
                else {
                    if (side == "myself" || side == "up") {
                        sprite.node.scaleX = 1;
                        sprite.node.scaleY = 1;
                    }
                    sprite.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(pre, mjid);

                    if (cc.vv.gameNetMgr.WANGBA_GAME == cc.vv.gameNetMgr.conf.type || cc.vv.gameNetMgr.conf.type == cc.vv.gameNetMgr.QUAN_MJ) {
                        this.showSeatNotice(sprite, flag, mjid, seatData, index, s, side);
                    }
                }
            }
            else {
                if ((cc.vv.gameNetMgr.WANGBA_GAME == cc.vv.gameNetMgr.conf.type || cc.vv.gameNetMgr.conf.type == cc.vv.gameNetMgr.QUAN_MJ)&& "angang" == flag) {
                    if (side == "myself" || side == "up") {
                        sprite.node.scaleX = 1.4;
                        sprite.node.scaleY = 1.4;
                    }
                    sprite.spriteFrame = cc.vv.mahjongmgr.getEmptySpriteFrame(side);
                }
                else {
                    if (side == "myself" || side == "up") {
                        sprite.node.scaleX = 1;
                        sprite.node.scaleY = 1;
                    }
                    if (s >= iBeginYaoji) {
                        mjid = cc.vv.gameNetMgr.YAOJI_VALUE;
                    }
                    if (flag == "chi") {
                        var step = (s > 0) ? 1 : 0;
                        mjid = mjid + step; //add 1 every step except s=0
                    }
                    sprite.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(pre, mjid);
                    if (cc.vv.gameNetMgr.WANGBA_GAME == cc.vv.gameNetMgr.conf.type || cc.vv.gameNetMgr.conf.type == cc.vv.gameNetMgr.QUAN_MJ) {
                        this.showSeatNotice(sprite, flag, mjid, seatData, index, s, side);
                    }
                }
            }
        }
    },


});
