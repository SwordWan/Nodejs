cc.Class({
    extends: cc.Component,

    properties: {
        target: cc.Node,
        sprite: cc.SpriteFrame,
        checkedSprite: cc.SpriteFrame,
        checked: {
            default: false,
            notify() {
                this.target.getComponent(cc.Sprite).spriteFrame = (this.checked ? this.checkedSprite : this.sprite);
            }
        },
        _func: null,
    },

    // use this for initialization
    onLoad: function () {
    },

    onClicked: function () {
        this.checked = !this.checked;
        if (this._func != null) {
            this._func(this.checked)
        }
    },

    SetChecked: function (flag) {
        this.checked = flag;
        if (this._func != null) {
            this._func(this.checked)
        }
    },

});