//以后拓展, 资源预加载
var PreLoader = cc.Class({
    ctor () {
        this.m_Prefab = new Object();
        this.m_Events = new Array();
    },

    preLoadPrefab: function () {
        cc.loader.loadResDir('prefab', cc.Prefab, function (err, pre) {
            if (err) {
                console.error(err.message || err);
                return;
            }
            for (var i in pre) {
                this.m_Prefab[pre[i].name] = pre[i];
            }
        }.bind(this));
    }
});

