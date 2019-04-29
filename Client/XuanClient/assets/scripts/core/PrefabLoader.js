
module.exports = {
    addLoadingPrefab(addNode){
        cc.loader.loadRes("cowGame/prefab/LoadingLayer", function (err, prefab) {
            if (!err) {
                if (addNode) {
                    var layer = cc.instantiate(prefab);
                    layer.x = layer.y = 0;
                    addNode.addChild(layer);
                }

            }
        });
    },
    addTipsDialog(content, okCb){
        cc.loader.loadRes("cowGame/prefab/TipDialog", function (err, prefab) {
            if (!err) {
                var scene = cc.director.getScene();
                var w = cc.view.getVisibleSize().width;
                var h = cc.view.getVisibleSize().height;

                var layer = cc.instantiate(prefab);
                layer.x = w / 2;
                layer.y = h / 2;
                scene.addChild(layer);

                var script = layer.getComponent("TipsDialog");
                if (script) {
                    script.setTips(content, okCb);
                }
            }
        });
    },
    showTipMsg(msg){
        cc.loader.loadRes("cowGame/prefab/TipsMsg", function (err, prefab) {
            if (!err) {
                var scene = cc.director.getScene();
                var w = cc.view.getVisibleSize().width;
                var h = cc.view.getVisibleSize().height;

                var layer = cc.instantiate(prefab);
                layer.x = w / 2;
                layer.y = h / 2 - 100;
                scene.addChild(layer);

                var moveTo = cc.moveTo(1, w / 2, h / 2);
                var callBack = cc.callFunc(function () {
                    layer.destroy();
                });
                var seq = cc.sequence([moveTo, callBack]);
                layer.runAction(seq);
                var script = layer.getComponent("TipsMsg");
                if (script) {
                    script.setContent(msg);
                }
            }
        });
    },

    loadResByName(name,parent,callback) { // 资源需要放在resources/prefab文件夹下
        cc.loader.loadRes("prefabs/"+name, function (err, prefab) {
            if (!err) {
                callback(prefab, parent);
            } else
            {
                console.log("加载资源出错:"+err);
            }
        });
    },
}