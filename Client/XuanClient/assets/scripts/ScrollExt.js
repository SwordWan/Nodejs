
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
        _isOPen: false,
        _startY: 0,
        _lastContentY: 0,
        _maxHeight: 0,
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
                var item = cc.instantiate(this.scrollItem);
                item.parent = this.scrollItem.parent;
                item.name = "item" + i;
               // item.zIndex = i;
                item.x = 0;
                item.y = -((i + 1) * this._itemHeight - this._itemHeight / 2);
              
                item.getChildByName("name").getComponent(cc.Label).string = data.rows[i].alias;
                item.getChildByName("iconMask").children[0].getComponent("LoadImage").LoadUserIcon(data.rows[i].userid);
                item.getChildByName("userid").getComponent(cc.Label).string = data.rows[i].userid;
                item.getChildByName("month").getComponent(cc.Label).string = data.rows[i].yuejushu;
                item.getChildByName("total").getComponent(cc.Label).string = data.rows[i].zongjushu;
                item.getChildByName("creator").active = false;
                item.getChildByName("mgr").active = false;
                if (data.rows[i].clublevel == 0) {
                    item.getChildByName("creator").active = true;
                } else if (data.rows[i].clublevel == 1) {
                    item.getChildByName("mgr").active = true;
                }

                if (data.rows[i].changjun >= 0) {
                    item.getChildByName("averagelose").active = false;
                    item.getChildByName("averagewin").active = true;
                    item.getChildByName("averagewin").getComponent(cc.Label).string = parseInt(data.rows[i].changjun);
                } else {
                    item.getChildByName("averagewin").active = false;
                    item.getChildByName("averagelose").active = true;
                    item.getChildByName("averagelose").getComponent(cc.Label).string = parseInt(data.rows[i].changjun);
                }
                if (data.rows[i].online) {
                    item.getChildByName("lasttime").color = new cc.Color(60, 255, 60);
                    item.getChildByName("lasttime").getComponent(cc.Label).string = "在线";
                } else {
                    item.getChildByName("lasttime").color = new cc.Color(100, 100, 100);
                    item.getChildByName("lasttime").getComponent(cc.Label).string = cc.vv.gameNetMgr.GetStrByNowFrameDate(data.rows[i].lastlogintime);
                }
                item.active = true;
            }
       
         
            this.scrollItem.parent.height = (this.scrollItem.height + 2) * data.rows.length;
            //this._maxHeight = this._itemHeight * 25;
            //this.scrollItem.parent.height = this._maxHeight;
            //console.log(this.scrollItem.parent.height);
            this.node.getComponent(cc.ScrollView).stopAutoScroll();
            this.node.getComponent(cc.ScrollView).scrollToTop();

        } else {    //不启用
            console.log("不启用");
            this._curmax = 0;
            this._isOPen = false;
            for (var i = 0; i < data.rows.length; i++) {
                var item = cc.instantiate(this.scrollItem);
                item.x = 0;
                item.y = -((i + 1) * this._itemHeight - this._itemHeight / 2);
                item.parent = this.scrollItem.parent;
                item.getChildByName("name").getComponent(cc.Label).string = data.rows[i].alias;
                item.getChildByName("iconMask").children[0].getComponent("LoadImage").LoadUserIcon(data.rows[i].userid);
                item.getChildByName("userid").getComponent(cc.Label).string = data.rows[i].userid;
                item.getChildByName("month").getComponent(cc.Label).string = data.rows[i].yuejushu;
                item.getChildByName("total").getComponent(cc.Label).string = data.rows[i].zongjushu;
                item.getChildByName("creator").active = false;
                item.getChildByName("mgr").active = false;
                if (data.rows[i].clublevel == 0) {
                    item.getChildByName("creator").active = true;
                } else if (data.rows[i].clublevel == 1) {
                    item.getChildByName("mgr").active = true;
                }

                if (data.rows[i].changjun >= 0) {
                    item.getChildByName("averagelose").active = false;
                    item.getChildByName("averagewin").active = true;
                    item.getChildByName("averagewin").getComponent(cc.Label).string = parseInt(data.rows[i].changjun);
                } else {
                    item.getChildByName("averagewin").active = false;
                    item.getChildByName("averagelose").active = true;
                    item.getChildByName("averagelose").getComponent(cc.Label).string = parseInt(data.rows[i].changjun);
                }
                if (data.rows[i].online) {
                    item.getChildByName("lasttime").color = new cc.Color(60, 255, 60);
                    item.getChildByName("lasttime").getComponent(cc.Label).string = "在线";
                } else {
                    item.getChildByName("lasttime").color = new cc.Color(100, 100, 100);
                    item.getChildByName("lasttime").getComponent(cc.Label).string = cc.vv.gameNetMgr.GetStrByNowFrameDate(data.rows[i].lastlogintime);
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
        var _info = this._curScrollData.rows[this._curmax];
        var item = this.scrollItem.parent.children[this._scrollUpIndex];
       // item.zIndex = this._curmax;
        item.x = 0;
        item.y = -((this._curmax + 1) * this._itemHeight - this._itemHeight / 2);
       // console.log(this._curmax + "-----" + item.y + "----------" + item.name + "-------------------itemY" + _info.alias);
        item.getChildByName("name").getComponent(cc.Label).string =_info.alias;
        item.getChildByName("iconMask").children[0].getComponent("LoadImage").LoadUserIcon(_info.userid);
        item.getChildByName("userid").getComponent(cc.Label).string =_info.userid;
        item.getChildByName("month").getComponent(cc.Label).string =_info.yuejushu;
        item.getChildByName("total").getComponent(cc.Label).string = _info.zongjushu;
        item.getChildByName("creator").active = false;
        item.getChildByName("mgr").active = false;
        if (_info.clublevel == 0) {
            item.getChildByName("creator").active = true;
        } else if (_info.clublevel == 1) {
            item.getChildByName("mgr").active = true;
        }
        if (_info.changjun >= 0) {
            item.getChildByName("averagelose").active = false;
            item.getChildByName("averagewin").active = true;
            item.getChildByName("averagewin").getComponent(cc.Label).string = parseInt(_info.changjun);
        } else {
            item.getChildByName("averagewin").active = false;
            item.getChildByName("averagelose").active = true;
            item.getChildByName("averagelose").getComponent(cc.Label).string = parseInt(_info.changjun);
        }
        if (_info.online) {
            item.getChildByName("lasttime").color = new cc.Color(60, 255, 60);
            item.getChildByName("lasttime").getComponent(cc.Label).string = "在线";
        } else {
            item.getChildByName("lasttime").color = new cc.Color(100, 100, 100);
            item.getChildByName("lasttime").getComponent(cc.Label).string = cc.vv.gameNetMgr.GetStrByNowFrameDate(_info.lastlogintime);
        }
        item.active = true;
        this._curmax++;
        //console.log(this._scrollUpIndex + "+++++++++++++" + this._scrollDownIndex);
        this._scrollDownIndex = this._scrollUpIndex;
        this._scrollUpIndex++;
        if (this._scrollUpIndex >= 21) {
            this._scrollUpIndex = 1;
        }
    },


    DownToUP: function () {
        if (this._curmax -20 < 0)
            return;
        var _info = this._curScrollData.rows[this._curmax - 20];
        var item = this.scrollItem.parent.children[this._scrollDownIndex];
        item.x = 0;
        item.y = -((this._curmax - 20 + 1) * this._itemHeight - this._itemHeight / 2);
        //console.log(this._curmax + "-----" + item.y + "----------" + item.name + "-------------------itemY" + _info.alias);
        item.getChildByName("name").getComponent(cc.Label).string = _info.alias;
        item.getChildByName("iconMask").children[0].getComponent("LoadImage").LoadUserIcon(_info.userid);
        item.getChildByName("userid").getComponent(cc.Label).string = _info.userid;
        item.getChildByName("month").getComponent(cc.Label).string = _info.yuejushu;
        item.getChildByName("total").getComponent(cc.Label).string = _info.zongjushu;
        item.getChildByName("creator").active = false;
        item.getChildByName("mgr").active = false;
        if (_info.clublevel == 0) {
            item.getChildByName("creator").active = true;
        } else if (_info.clublevel == 1) {
            item.getChildByName("mgr").active = true;
        }

        if (_info.changjun >= 0) {
            item.getChildByName("averagelose").active = false;
            item.getChildByName("averagewin").active = true;
            item.getChildByName("averagewin").getComponent(cc.Label).string = parseInt(_info.changjun);
        } else {
            item.getChildByName("averagewin").active = false;
            item.getChildByName("averagelose").active = true;
            item.getChildByName("averagelose").getComponent(cc.Label).string = parseInt(_info.changjun);
        }

        if (_info.online) {
            item.getChildByName("lasttime").color = new cc.Color(60, 255, 60);
            item.getChildByName("lasttime").getComponent(cc.Label).string = "在线";
        } else {
            item.getChildByName("lasttime").color = new cc.Color(100, 100, 100);
            item.getChildByName("lasttime").getComponent(cc.Label).string = cc.vv.gameNetMgr.GetStrByNowFrameDate(_info.lastlogintime);
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
            //console.log("xiaaaa");
            //console.log(offset - this._itemHeight - 20);
            var count = 0;
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
            //console.log("shanggggg");
            //console.log(offset);
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
                    var item = cc.instantiate(this.scrollItem);
                    item.parent = this.scrollItem.parent;
                    item.x = 0;
                    item.y = -((count + 1) * this._itemHeight - this._itemHeight / 2);
                    item.getChildByName("name").getComponent(cc.Label).string = data.rows[i].alias;
                    item.getChildByName("iconMask").children[0].getComponent("LoadImage").LoadUserIcon(data.rows[i].userid);
                    item.getChildByName("userid").getComponent(cc.Label).string = data.rows[i].userid;
                    item.getChildByName("month").getComponent(cc.Label).string = data.rows[i].yuejushu;
                    item.getChildByName("total").getComponent(cc.Label).string = data.rows[i].zongjushu;
                    item.getChildByName("creator").active = false;
                    item.getChildByName("mgr").active = false;
                    if (data.rows[i].clublevel == 0) {
                        item.getChildByName("creator").active = true;
                    } else if (data.rows[i].clublevel == 1) {
                        item.getChildByName("mgr").active = true;
                    }

                    if (data.rows[i].changjun >= 0) {
                        item.getChildByName("averagelose").active = false;
                        item.getChildByName("averagewin").active = true;
                        item.getChildByName("averagewin").getComponent(cc.Label).string = parseInt(data.rows[i].changjun);
                    } else {
                        item.getChildByName("averagelose").active = true;
                        item.getChildByName("averagewin").active = false;
                        item.getChildByName("averagelose").getComponent(cc.Label).string = parseInt(data.rows[i].changjun);
                    }
                    if (data.rows[i].online) {
                        item.getChildByName("lasttime").color = new cc.Color(60, 255, 60);
                        item.getChildByName("lasttime").getComponent(cc.Label).string = "在线";
                    } else {
                        item.getChildByName("lasttime").color = new cc.Color(100, 100, 100);
                        item.getChildByName("lasttime").getComponent(cc.Label).string = cc.vv.gameNetMgr.GetStrByNowFrameDate(data.rows[i].lastlogintime);
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
