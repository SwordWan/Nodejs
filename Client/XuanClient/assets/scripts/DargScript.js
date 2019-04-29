
cc.Class({
    extends: cc.Component,

    properties: {
        Index: 0,

        _pokeId:0,
        _offsetX: 0,
        _offsetY:0,
        _stopDrag: false,
        _startPos:null,
    },


    // onLoad () {},

    start() {
        console.log("Game Start");
        this.initDragStuffs(this.node);
        this._startPos = this.node.getPosition();
    },

    initDragStuffs: function (node) {
        var self = this;
        //break if it's not my turn.
        node.on(cc.Node.EventType.TOUCH_START, function (event) {
            console.log(" cc.Node.EventType.TOUCH_Start");
            self._offsetX = node.x - event.getLocationX();
            self._offsetY = node.y - event.getLocationY();
            self.node.parent.children[self.node.parent.children.length - 1].zIndex = self.node.parent.children.length - 2;
            self.node.zIndex = self.node.parent.children.length -1;
        }.bind(this));

        node.on(cc.Node.EventType.TOUCH_MOVE, function (event) {
            if (self._stopDrag)
                return;
            //console.log(" cc.Node.EventType.TOUCH_MOVE----x:::::" + event.getLocationX() + "---" + cc.director.getVisibleSize().width / 2 + "......" + node.x);
            //console.log(" cc.Node.EventType.TOUCH_MOVE----Y:::::" + event.getLocationY() + "---" + cc.director.getVisibleSize().height / 2 + "......" + node.y);
            node.x = event.getLocationX() + self._offsetX;// - cc.director.getVisibleSize().width / 2;
            node.y = event.getLocationY() + self._offsetY;// - cc.director.getVisibleSize().height / 2;
            //if (Math.abs(node.x - self._startpos.x) >= 250 || Math.abs(node.y - self._startpos.y) >= 250) {
            //    self._stopDrag = true;
            //    node.parent = node.parent
            //   // self.maskFly(node.getPosition());
            //}
        }.bind(this));

        node.on(cc.Node.EventType.TOUCH_END, function (event) {
            console.log(" cc.Node.EventType.TOUCH_END");
            cc.vv.xuangame.ChangeDargPokePos(self.node, self.Index);
            self.node.setPosition(this._startPos);
            cc.vv.xuangame.RefreshPoketype();
            // self.displayGoNextBtn();
        }.bind(this));

        node.on(cc.Node.EventType.TOUCH_CANCEL, function (event) {
            console.log(" cc.Node.EventType.TOUCH_CANCEL");
            self.node.setPosition(this._startPos);
            cc.vv.xuangame.RefreshPoketype();
        }.bind(this));
    },

    // update (dt) {},
});
