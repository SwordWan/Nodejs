
cc.Class({
    extends: cc.BaseClass,

    properties: {
        PokeAtlas: { default: null, type: cc.SpriteAtlas },

        _curRoomUUID:null,
        _curMax: 0,
        _curShoushu:0,
    },

    ctor () {
        this.events = ['getpjlogs_result'];
    },

    onLoad () {
        cc.vv.socket.addHandlers(this.events, this)
    },

    OpenPaiju: function (roomuuid) {
        this._curRoomUUID = roomuuid;
        this._curShoushu = 1;
        this.node.active = true;
        this.LeftMax();
    },

    LeftMax: function () {
        cc.vv.socket.send("getpjlogs", { szRoomUUID: this._curRoomUUID, iPlayTimes: 1});
    },

    RightMax: function () {
      
        cc.vv.socket.send("getpjlogs", { szRoomUUID: this._curRoomUUID, iPlayTimes: this._curMax });
    },

    LeftBtn: function () {
        --this._curShoushu;
        if (this._curShoushu < 1)
            this._curShoushu = 1;
        cc.vv.socket.send("getpjlogs", { szRoomUUID: this._curRoomUUID, iPlayTimes: this._curShoushu });
    },

    rightBtn: function () {
        ++this._curShoushu;
        if (this._curShoushu > this._curMax)
            this._curShoushu = this._curMax;
        cc.vv.socket.send("getpjlogs", { szRoomUUID: this._curRoomUUID, iPlayTimes: this._curShoushu });
    },
    
    getpjlogs_result: function (data) {
        for (var i in this._content.children) {
            this._content.children[i].active = false;
        }

        if (data.pData == null) {
            this._shoushu.$Label.string = "第" + 1 + "手";
            return;
        }

        this._curMax = parseInt(data.iCount);
        this._shoushu.$Label.string = "第" + data.pData.iPlayTimes + "手";
        this._curShoushu = data.pData.iPlayTimes;
        this._zongShoushu = parseInt(data.iCount);
       
        for (var i in data.pData.pLogs) {
            var item = this._content.children[i] || cc.instantiate(this._content.children[0]);
            item.parent = this._content;
            var itemdata = data.pData.pLogs[i];

            var js = this.bindThor(item);
            this.resetItem(js);

            js._headicon.$LoadImage.LoadUserIcon(data.pData.pLogs[i].iUserId);
            js._name.$Label.string = data.pData.pLogs[i].szAlias;
            var poke = item.getChildByName("PokeNode");
            js._id.$Label.string = "ID:" + itemdata.iUserId;

            if (itemdata.pPais1 != null) {
                js._kaipai.active = true;
                js._qipai.active = false;
            } else if (itemdata.pPais1 == null && itemdata.iState != 5) {
                js._kaipai.active = false;
                js._qipai.active = false;
            } else {
                js._kaipai.active = false;
                js._qipai.active = true;
            }
            var display = false;
            if (itemdata.pPais1 != null) {
                this.SetPai(poke.children[0], itemdata.pPais1[0]);
                if (itemdata.pPais1[0] == itemdata.pPais[0] || itemdata.pPais1[0] == itemdata.pPais[1]) {
                    js._line1.active = true;
                }
                this.SetPai(poke.children[1], itemdata.pPais1[1]);
                if (itemdata.pPais1[1] == itemdata.pPais[0] || itemdata.pPais1[1] == itemdata.pPais[1]) {
                    js._line2.active = true;
                }
                this.SetPai(poke.children[2], itemdata.pPais2[0]);
                if (itemdata.pPais2[0] == itemdata.pPais[0] || itemdata.pPais2[0] == itemdata.pPais[1]) {
                    js._line3.active = true;
                }
                this.SetPai(poke.children[3], itemdata.pPais2[1]);
                if (itemdata.pPais2[1] == itemdata.pPais[0] || itemdata.pPais2[1] == itemdata.pPais[1]) {
                    js._line4.active = true;
                }
                js._lbl1.active = true;
                js._lbl1.$Label.string = itemdata.szPaisName1;
                js._lbl2.active = true;
                js._lbl2.$Label.string = itemdata.szPaisName2;
                display = true;
            } else if (itemdata.bZhongJiang != undefined && itemdata.bZhongJiang) {
                display = true;
                this.SetPai(poke.children[0], itemdata.pPais[0]);
                js._line1.active = true;
                js._line2.active = true;
                this.SetPai(poke.children[1], itemdata.pPais[1]);
                if (itemdata.pPais.length == 2) {
                    poke.children[2].active = false;
                    poke.children[3].active = false;
                } else if (itemdata.pPais.length == 3) {
                    this.SetPai(poke.children[2], itemdata.pPais[2]);
                    poke.children[3].active = false;
                } else if (itemdata.pPais.length == 4) {
                    this.SetPai(poke.children[2], itemdata.pPais[2]);
                    this.SetPai(poke.children[3], itemdata.pPais[3]);
                }
                js._lbl1.active = true;
                js._lbl1.$Label.string = itemdata.szPaisName1;
                js._lbl2.active = true;
                js._lbl2.$Label.string = itemdata.szPaisName2;
            }else if (itemdata.bShowPai || itemdata.iSHPMode > 0) {
                this.SetPai(poke.children[0], itemdata.pPais[0]);
                js._line1.active = true;
                js._line2.active = true;
                this.SetPai(poke.children[1], itemdata.pPais[1]);
                if (itemdata.pPais.length == 2) {
                    poke.children[2].active = false;
                    poke.children[3].active = false;
                } else if (itemdata.pPais.length == 3) {
                    this.SetPai(poke.children[2], itemdata.pPais[2]);
                    poke.children[3].active = false;
                } else if (itemdata.pPais.length == 4) {
                    this.SetPai(poke.children[2], itemdata.pPais[2]);
                    this.SetPai(poke.children[3], itemdata.pPais[3]);
                }
                display = true;

                if (itemdata.iSHPMode == 1) {
                    js._lbl1.active = true;
                    js._lbl1.$Label.string = "    三花六";
                } else if (itemdata.iSHPMode == 2) {
                    js._lbl1.active = true;
                    js._lbl1.$Label.string = "    三花十";
                }
            } else if (itemdata.pShowIdx.length > 0) {
                js._line1.active = true;
                js._line2.active = true;
                if (itemdata.pPais.length == 2) {
                    poke.children[2].active = false;
                    poke.children[3].active = false;
                } else if (itemdata.pPais.length == 3) {
                    this.SetPai(poke.children[2], itemdata.pPais[2]);
                    poke.children[3].active = false;
                } else if (itemdata.pPais.length == 4) {
                    this.SetPai(poke.children[2], itemdata.pPais[2]);
                    this.SetPai(poke.children[3], itemdata.pPais[3]);
                }
                for (var j = 0; j < itemdata.pShowIdx.length; j++) {
                    this.SetPai(poke.children[itemdata.pShowIdx[j]], itemdata.pPais[itemdata.pShowIdx[j]]);
                }
                display = true;
            } else {
                js._line1.active = true;
                js._line2.active = true;
                if (itemdata.pPais.length == 2) {
                    poke.children[2].active = false;
                    poke.children[3].active = false;
                } else if (itemdata.pPais.length == 3) {
                    this.SetPai(poke.children[2], itemdata.pPais[2]);
                    poke.children[3].active = false;
                } else if (itemdata.pPais.length == 4) {
                    this.SetPai(poke.children[2], itemdata.pPais[2]);
                    this.SetPai(poke.children[3], itemdata.pPais[3]);
                }
            }
            if (itemdata.iUserId == cc.vv.userMgr.userId && !display) {
                this.SetPai(poke.children[0], itemdata.pPais[0]);
                js._line1.active = true;
                js._line2.active = true;
                this.SetPai(poke.children[1], itemdata.pPais[1]);
                if (itemdata.pPais.length == 2) {
                    poke.children[2].active = false;
                    poke.children[3].active = false;
                } else if (itemdata.pPais.length == 3) {
                    this.SetPai(poke.children[2], itemdata.pPais[2]);
                    poke.children[3].active = false;
                } else if (itemdata.pPais.length == 4) {
                    this.SetPai(poke.children[2], itemdata.pPais[2]);
                    this.SetPai(poke.children[3], itemdata.pPais[3]);
                }
            }

            if (itemdata.iAddFenMG > 0) {
                js._mangguo.$Label.string = /*"芒果:" +*/ itemdata.iAddFenMG;
            } else {
                js._mangguo.$Label.string = '0';
            }
            //var fen = itemdata.iJiFenYZ + itemdata.iAddFenMG;
            if (itemdata.iJiFenSY > 0) {
                js._win.active = true;
                js._lose.active = false;
                js._win.$Label.string = "+" + itemdata.iJiFenSY;
            } else {
                js._win.active = false;
                js._lose.active = true;
                js._lose.$Label.string = itemdata.iJiFenSY;
            }
            js._labAdd.$Label.string = /*"下注" +*/ itemdata.iJiFenYZ || 0;
            item.active = true;
        }
    },


    SetPai: function (PaiNodeParent, paiid) {
        PaiNodeParent.children[0].active = false;
        PaiNodeParent.children[1].active = true;
        this.GetPokerCard(paiid, PaiNodeParent.children[1].getComponent(cc.Sprite));
    },

    GetPokerCard: function (cardId, _sprite) {
        var spName = "";
        var cardPoint = 0;
        var color = 0;
        if (cardId == 2000) {
            spName = "pokerbig";
        } else {
            cardPoint = cardId % 100;
            color = parseInt(cardId / 100); // 0-3     方，梅，黑,红，
            color -= 1;
            spName = "poker" + color + "_" + cardPoint;
        }
        _sprite.spriteFrame = this.PokeAtlas.getSpriteFrame(spName);
    },

    resetItem: function (js) {
        var poke = js.node.getChildByName('PokeNode');
        for (var item of poke.children) {
            item.active = true;
        }
        js._line1.active = false;
        js._line2.active = false;
        js._line3.active = false;
        js._line4.active = false;
        js._lbl1.active = false;
        js._lbl2.active = false;
    }



    // update (dt) {},
});
