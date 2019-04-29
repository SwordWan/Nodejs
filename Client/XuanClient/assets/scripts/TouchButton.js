
cc.Class({
    extends: cc.Component,

    properties: {
        _compo: null,
        _func: null,
        _params: null,
        _targetnode: null,
        _ScpritObj: null,
        _eventparams:null,
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad() {
        var btn = this.node.getComponent(cc.Button);
        if (btn.clickEvents.length == 0) {
            return;
        }
        btn.enabled = false;
        this._compo = btn.clickEvents[0].component;
        this._func = btn.clickEvents[0].handler;
        this._params = btn.clickEvents[0].customEventData;
        this._targetnode = btn.clickEvents[0].target;
        this._ScpritObj = this._targetnode.getComponent(this._compo);
        this._eventparams = {
            target: this.node,
        };
        var self = this;
        function onTouchDown(event) {
            if (!btn.interactable)
                return;
            self._ScpritObj[self._func](self._eventparams, self._params);
        }

        this.node.on('touchstart', onTouchDown, this.node);
    },

});
