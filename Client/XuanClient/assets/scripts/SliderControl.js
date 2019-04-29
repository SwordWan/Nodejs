cc.Class({
    extends: cc.Component,
    properties: {
        NumberDot:5,
        _slider: null,
        _interval:0,
        _lastDot: 0,
        _dotArr: [],
        _intervalFunc: null,
        _fg:null,
    },

    // use this for initialization
    onLoad: function () {
        this._slider = this.node.getComponent(cc.Slider);
        this._interval = 10 / this.NumberDot;
        this._dotArr.push(0);
        for (var i = 1; i <= this.NumberDot; i++) {
            this._dotArr.push(this._interval * i);
        }
        this._lastDot = this._slider.progress;
        this._fg = this.node.getChildByName("fg").getComponent(cc.Sprite);
        this.StartSet();
    },

    SetDot: function (number) {
        if (this._slider == null) {
            this._slider = this.node.getComponent(cc.Slider);
        }
        this.NumberDot = number;
        this._interval = 10 / this.NumberDot;
        this._dotArr.push(0);
        for (var i = 1; i <= this.NumberDot; i++) {
            this._dotArr.push(this._interval * i);
        }
        this._lastDot = this._slider.progress;
        this.StartSet();
    },

    SetProgress: function (number) {
        if (this._slider == null) {
            this._slider = this.node.getComponent(cc.Slider);
        }
        this._slider.progress = number;
        this.StartSet();
    },

    StartSet: function () {
        var dot = 0;
        var index = 0;
        for (var i = 0; i < this._dotArr.length; i++) {
            var cha = this._slider.progress * 10 - this._dotArr[i];
            if (cha <= this._interval / 2) {
                dot = this._dotArr[i];
                index = i;
                break;
            } else if (cha > this._interval / 2 && cha < this._interval) {
                dot = this._dotArr[i + 1];
                index = i + 1;
                break;
            }
        }

        var progress = dot / 10.0;
        if (progress != this._lastDot) {
            this._lastDot = progress;
            if (this._intervalFunc != null) {
                this._intervalFunc(index);
            }
            this._fg.fillRange = progress;
        }
        this._slider.progress = progress;

    },

    



    SliderChangeEvent: function () {
        for (var i = 0; i < this._dotArr.length; i++) {
            var cha = this._slider.progress * 10 - this._dotArr[i];
            if (cha <= this._interval / 2) {
                this.setProgress2(this._dotArr[i],i);
                break;
            } else if (cha > this._interval / 2 && cha < this._interval) {
                this.setProgress2(this._dotArr[i + 1],i+1);
                break;
            }
        }
        //this._slider.progress = Math.round(this._slider.progress);
    },

    setProgress2: function (dot,index) {
        var progress = dot / 10.0;
        if (progress != this._lastDot) {
            this._lastDot = progress;
            if (progress != 1) {
                cc.vv.audioMgr.playAudioFx("resources/sounds/slider.mp3");
            } else {
                cc.vv.audioMgr.playAudioFx("resources/sounds/slider_top.mp3");
            }
            if (this._intervalFunc != null) {
                this._intervalFunc(index);
            }
            this._fg.fillRange = progress;
        }
        this._slider.progress = progress;
    }



    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
