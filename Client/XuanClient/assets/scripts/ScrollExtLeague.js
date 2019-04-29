
cc.Class({
    extends: cc.Component,

    properties: {
        contentParent: { default: null, type: cc.Node },
        scrollItem: { default: null, type: cc.Node },

        _curScrollData: null,
        _curIndex: 0,
        _curScrollView: null,
        _itemList: [],
        _lastY: 0,
        _middleNode: null,
        _upY: 0,
        _downY: 0,
        _offsetY: 0,
        _upIndex: 0,
        _downIndex: 0,
        _itemHeight: 0,
        _jiange: 0,
        
        _itemHeight:0,
        _curmax: 0,
        _GoDown: false,
        _isOPen:false,
        _startY: 0,
        _lastContentY: 0,
        _scrollUpIndex: 0,
        _scrollDownIndex: 0,
    },

    onLoad() {
        this._startY = this.contentParent.y;
    },

    start() {

    },

    InitScrollData: function (data) {
        this._curScrollData = data;
        this._lastY = this._startY;
        this._itemHeight = this.scrollItem.height;
        for (var i = 1; i < this.scrollItem.parent.children.length; i++) {
            this.scrollItem.parent.children[i].destroy();
        }

        if (data.rows.length > 30) {  //启用
            console.log("启用");
            this._curmax = 20;
            this._isOPen = true;
            this._scrollUpIndex = 1;
            this._scrollDownIndex = 20;
            for (var i = 0; i < 20; i++) {
                var _info = this._curScrollData.rows[i];
                var item = cc.instantiate(this.scrollItem);
                item.parent = this.scrollItem.parent;
               // item.zIndex = i;
                item.x = 0;
                item.y = -((i + 1) * this._itemHeight - this._itemHeight / 2);

                item.getChildByName("name").getComponent(cc.Label).string = _info.alias;
                item.getChildByName("id").getComponent(cc.Label).string = _info.userid;
                item.getChildByName("iconMask").children[0].getComponent("LoadImage").LoadUserIcon(_info.userid);
                //判断是否是联盟管理员  创建者
                if (_info.alliancelevel == 2) {
                    item.getChildByName("set").active = true;
                } else if (_info.alliancelevel == 1) {
                    item.getChildByName("mgr").active = true;
                    item.getChildByName("cancel").active = true;
                } else {
                    item.getChildByName("creator").active = true;
                }

                item.active = true;
            }
            this.scrollItem.parent.height = (this.scrollItem.height + 2) * data.rows.length;
            this.node.getComponent(cc.ScrollView).stopAutoScroll();
            this.node.getComponent(cc.ScrollView).scrollToTop();

        } else {    //不启用
            console.log("不启用");
            this._curmax = 0;
            this._isOPen = false;
            for (var i = 0; i < data.rows.length; i++) {
                var _info = this._curScrollData.rows[i];
                var item = cc.instantiate(this.scrollItem);
                item.x = 0;
                item.y = -((i + 1) * this._itemHeight - this._itemHeight / 2);
                item.parent = this.scrollItem.parent;
                item.getChildByName("name").getComponent(cc.Label).string = _info.alias;
                item.getChildByName("id").getComponent(cc.Label).string = _info.userid;
                item.getChildByName("iconMask").children[0].getComponent("LoadImage").LoadUserIcon(_info.userid);
                //判断是否是联盟管理员  创建者
                if (_info.alliancelevel == 2) {
                    item.getChildByName("set").active = true;
                } else if (_info.alliancelevel == 1) {
                    item.getChildByName("mgr").active = true;
                    item.getChildByName("cancel").active = true;
                } else {
                    item.getChildByName("creator").active = true;
                }
                item.active = true;
            }
            this.scrollItem.parent.height = (this.scrollItem.height + 2) * data.rows.length;
            this.node.getComponent(cc.ScrollView).stopAutoScroll();
            this.node.getComponent(cc.ScrollView).scrollToTop();
        }
    },

    UPToDown: function () {
        if (this._curmax >= this._curScrollData.rows.length)
            return;
        console.log(this._curmax);
        var _info = this._curScrollData.rows[this._curmax];
        var item = this.scrollItem.parent.children[this._scrollUpIndex];
       // item.zIndex = this._curmax;
        item.x = 0;
        item.y = -((this._curmax + 1) * this._itemHeight - this._itemHeight / 2);
        item.getChildByName("name").getComponent(cc.Label).string = _info.alias;
        item.getChildByName("id").getComponent(cc.Label).string = _info.userid;
        item.getChildByName("iconMask").children[0].getComponent("LoadImage").LoadUserIcon(_info.userid);
        //判断是否是联盟管理员  创建者
        if (_info.alliancelevel == 2) {
            item.getChildByName("set").active = true;
        } else if (_info.alliancelevel == 1) {
            item.getChildByName("mgr").active = true;
            item.getChildByName("cancel").active = true;
        } else {
            item.getChildByName("creator").active = true;
        }
        item.active = true;
        this._curmax++;
        this._scrollDownIndex = this._scrollUpIndex;
        this._scrollUpIndex++;
        if (this._scrollUpIndex >= 21) {
            this._scrollUpIndex = 1;
        }
    },


    DownToUP: function () {
        if (this._curmax -20 < 0)
            return;
        console.log(this._curmax);
        var _info = this._curScrollData.rows[this._curmax - 20];
        var item = this.scrollItem.parent.children[this._scrollDownIndex];
       // item.zIndex = this._curmax - 20;
        item.x = 0;
        item.y = -((this._curmax -20 + 1) * this._itemHeight - this._itemHeight / 2);
        item.getChildByName("name").getComponent(cc.Label).string = _info.alias;
        item.getChildByName("id").getComponent(cc.Label).string = _info.userid;
        item.getChildByName("iconMask").children[0].getComponent("LoadImage").LoadUserIcon(_info.userid);
        //判断是否是联盟管理员  创建者
        if (_info.alliancelevel == 2) {
            item.getChildByName("set").active = true;
        } else if (_info.alliancelevel == 1) {
            item.getChildByName("mgr").active = true;
            item.getChildByName("cancel").active = true;
        } else {
            item.getChildByName("creator").active = true;
        }
        item.active = true;
        this._curmax--;
        this._scrollUpIndex = this._scrollDownIndex;
        this._scrollDownIndex--;
        if (this._scrollDownIndex <= 0) {
            this._scrollDownIndex = 20;
        }
    },
    
    ScrollEvent: function (data) {
        if (!this._isOPen) {
            return;
        }
        if (this._curmax == 0) {
            return;
        }
        var offset = this.contentParent.y - this._lastY;
        if (this.contentParent.y - this._lastContentY < 0 && offset - this._itemHeight - 20 <= -(this._itemHeight)) {
            console.log("xiaaaa");
            var count = 0;
            console.log(offset - this._itemHeight - 20);
            for (var i = 0; i < 10; i++) {
                count -= this._itemHeight;
                if (offset - this._itemHeight - 20 <= count) {
                    this.DownToUP();
                    this._lastY -= this._itemHeight;
                } else {
                    break;
                }
            }


        }
        if (this.contentParent.y - this._lastContentY > 0 && offset >= this._itemHeight) {
            console.log("shanggggg");
            console.log(offset);
            var count = 0;
            for (var i = 0; i < 10; i++) {
                count += this._itemHeight;
                if (offset >= count) {
                    this.UPToDown();
                    this._lastY += this._itemHeight;
                } else {
                    break;
                }
            }
        }
        this._lastContentY = this.contentParent.y;
    },

    SearchItem: function (event, arg) {
        cc.vv.audioMgr.playSFX("dian.mp3");
        var input = event.target.parent.getChildByName("searchInput").getComponent(cc.EditBox).string;
        if (input == "") {
            this.InitScrollData(this._curScrollData);
        } else {
            for (var i = 1; i < this.scrollItem.parent.children.length; i++) {
                this.scrollItem.parent.children[i].destroy();
            }
            var count = 0;
            this._curmax = 0;
            var data = this._curScrollData;
            for (var i = 1; i < data.rows.length; i++) {
                var _uid = this._curScrollData.rows[i].userid + "";
                if (_uid.indexOf(input) >= 0 || this._curScrollData.rows[i].alias.indexOf(input) >= 0) {
                    var _info = this._curScrollData.rows[i];
                    var item = cc.instantiate(this.scrollItem);
                    item.parent = this.scrollItem.parent;
                  //  item.zIndex = i;
                    item.x = 0;
                    item.y = -((count + 1) * this._itemHeight - this._itemHeight / 2);
                    item.getChildByName("name").getComponent(cc.Label).string = _info.alias;
                    item.getChildByName("id").getComponent(cc.Label).string = _info.userid;
                    item.getChildByName("iconMask").children[0].getComponent("LoadImage").LoadUserIcon(_info.userid);
                    //判断是否是联盟管理员  创建者
                    if (_info.alliancelevel == 2) {
                        item.getChildByName("set").active = true;
                    } else if (_info.alliancelevel == 1) {
                        item.getChildByName("mgr").active = true;
                        item.getChildByName("cancel").active = true;
                    } else {
                        item.getChildByName("creator").active = true;
                    }
                    item.active = true;
                    count++;
                }
            }
            this.scrollItem.parent.height = (this.scrollItem.height + 2) * this.scrollItem.parent.children.length;
            this.node.getComponent(cc.ScrollView).stopAutoScroll();
            this.node.getComponent(cc.ScrollView).scrollToTop();
        }
    },
    // update (dt) {},
});
