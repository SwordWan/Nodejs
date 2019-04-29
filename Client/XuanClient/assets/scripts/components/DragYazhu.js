
cc.Class({
    extends: cc.Component,

    properties: {
        daBtn: { default: null, type: cc.Node },
        YazhuSlider: { default: null, type: cc.Node },
        daLbl: { default: null, type: cc.Label },
        yazhuNode: { default: null, type: cc.Node },
        ToggleNode: { default: null, type: cc.Node },
        _slider: null,
        _sliderControl:null,
    },

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {},

    start() {
        this._slider = this.YazhuSlider.getComponent(cc.Slider);
        this._sliderControl = this.YazhuSlider.getComponent("DragSliderControl");
        this.initDragStuffs(this.daBtn);
    },

    initDragStuffs: function (node) {
        var self = this;
        //break if it's not my turn.
        node.on(cc.Node.EventType.TOUCH_START, function (event) {
            console.log(" cc.Node.EventType.TOUCH_Start");
            //self._offsetX = node.x - event.getLocationX();
            //self._offsetY = node.y - event.getLocationY();
            self.yazhuNode.active = true;
        }.bind(this));

        node.on(cc.Node.EventType.TOUCH_MOVE, function (event) {
            //console.log(" cc.Node.EventType.TOUCH_Move");
            //if (self._stopDrag)
            //    return;
            //console.log(" cc.Node.EventType.TOUCH_MOVE----x:::::" + event.getLocationX());
            //console.log(" cc.Node.EventType.TOUCH_MOVE----Y:::::" + event.getLocationY());
            var YY = event.getLocationY();
            if (YY >= 425 && YY < 675) {
                //console.log(self._slider.progress);
                //self.ToggleNode.x = -177 + (YY - 750);
                self._slider.progress = (YY - 425) / 250;
                self._sliderControl.SliderChangeEvent();
                //console.log(self.ToggleNode.getPosition());
            }
            if (YY < 425) {
                self._slider.progress = 0;
                self._sliderControl.SliderChangeEvent();
            }
            if (YY >= 675) {
                self._slider.progress = 1;
                self._sliderControl.SliderChangeEvent();
            }
            //console.log(" cc.Node.EventType.TOUCH_MOVE----x:::::" + event.getLocationX() + "---" + cc.director.getVisibleSize().width / 2 + "......" + node.x);
            //console.log(" cc.Node.EventType.TOUCH_MOVE----Y:::::" + event.getLocationY() + "---" + cc.director.getVisibleSize().height / 2 + "......" + node.y);
            //node.x = event.getLocationX() + self._offsetX;// - cc.director.getVisibleSize().width / 2;
            //node.y = event.getLocationY() + self._offsetY;// - cc.director.getVisibleSize().height / 2;
            //if (Math.abs(node.x - self._startpos.x) >= 250 || Math.abs(node.y - self._startpos.y) >= 250) {
            //    self._stopDrag = true;
            //    node.parent = node.parent
            //   // self.maskFly(node.getPosition());
            //}
        }.bind(this));

        node.on(cc.Node.EventType.TOUCH_END, function (event) {
            console.log(" cc.Node.EventType.TOUCH_END");
            //cc.vv.xuangame.ChangeDargPokePos(self.node, self.Index);
            //self.node.setPosition(this._startPos);
            // self.displayGoNextBtn();
            self.yazhuNode.active = false;
            cc.vv.xuangame.DargYazhuEnd();
        }.bind(this));

        node.on(cc.Node.EventType.TOUCH_CANCEL, function (event) {
            console.log(" cc.Node.EventType.TOUCH_CANCEL");
            self.yazhuNode.active = false;
            cc.vv.xuangame.DargYazhuEnd();
        }.bind(this));
    },



    // update (dt) {},
});
