cc.BaseClass = cc.Class({
    extends: cc.Component,

    __preload: function () {
        cc.vv.uikiller.bindComponent(this);
    },

    ctor: function () {
        this.m_loadCallTimes = 0;
    },

    showPrefab: function (name, parent, call) {
        if (parent == null) parent = this.node;

        var nodePre = 'm_node' + name;
        var fn = function () {
            if (call) call(this[nodePre]);
            if (this[nodePre].getComponent(name)) {
                this[nodePre].getComponent(name).m_Hook = this;
                if (this[nodePre].getComponent(name).onShowView) {
                    this[nodePre].getComponent(name).onShowView();
                }
            }
        }.bind(this);

        if (this[nodePre]) {
            this[nodePre].active = true;
            fn();
            return;
        }

        if (cc.vv.preload.m_Prefab[name]) {
            this[nodePre] = cc.instantiate(cc.vv.preload.m_Prefab[name]);
            parent.addChild(this[nodePre]);
            fn();
            return;
        }

        cc.loader.loadRes('prefab/' + name, cc.Prefab, function (err, pre) {
            if (err) {
                console.error(err.message || err);
                return;
            }
            cc.vv.preload.m_Prefab[name] = pre;
            this[nodePre] = cc.instantiate(pre);
            parent.addChild(this[nodePre]);
            fn();
            if (name == 'Loading' && this.m_loadCallTimes == 0) this[nodePre].active = false;
        }.bind(this));
    },

    showLoad: function () {
        this.showPrefab('Loading');
        this.m_loadCallTimes++
    },

    hideLoad: function () {
        if (this.m_nodeLoading) this.m_nodeLoading.active = false;
        this.m_loadCallTimes--;
        if (this.m_loadCallTimes < 0) this.m_loadCallTimes = 0;
    },

    showAlert: function (str, style, cb) {
        this.showPrefab('Alert', this.node, function (node) {
            node.$Alert.showAlert(str, style, cb, this);
        }.bind(this));
    },

    hideView: function () {
        var delay = null;
        if (this.onHideView) {
            delay = this.onHideView();
        }
        if (delay && typeof delay == 'number') {
            this.scheduleOnce(this._hideView(), delay)
        } else {
            this._hideView();
        }
    },

    _hideView: function () {
        this.node.active = false;
    },

    onBtSound: function () {
        cc.vv.audioMgr.playSFX("dian.mp3");
    },

    bindThor: function (node) {
        var js = new Object();
        js.node = node;
        cc.vv.uikiller.bindComponent(js);
        return js;
    },

    // update (dt) {},
});