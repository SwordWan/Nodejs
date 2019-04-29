// 配置 Json 文件必须放在resources/json 目录下
module.exports = {
    _isLoad: false,
    _loadJson: function (file, obj) {
        var url = cc.url.raw("resources/" + file + ".json");

        var self = this;
        cc.loader.load(url, function (curCount, totalCount, itemObj) {
            // 进度
            // console.log(itemObj);
        }, function (err, results) {
            // 完成
            self._index++;
            if (err) {
                console.log("解析配置文件" + file + "失败: " + err);
            } else {
                if (results) {
                    obj['data'] = results;
                    if (self._index >= self.file.length) {// 加载完成
                        self._onComplete();
                    } else {   // 进度+1
                        self._onProgress(file);
                    }
                } else {
                    self._onError(file);
                }
            }
        });
    },
    _index: 0,
    file: {
        cowCardView: { data: [], name: 'pokerDate/json/cowCardView' },// 卡牌的数字
        errString: { data: [], name: "pokerDate/json/errString" },// 错误文本配置文件
    },

    init: function () {
        if (this._isLoad == false) {
            this._index = 0;
            for (var k in this.file) {
                var item = this.file[k];
                this._loadJson(item['name'], item);
            }
        } else {
            console.log("[JsonFileCfg] 已经预加载过配置文件");
        }
    },
    _onComplete() {
        console.log("Json 加载完成");
    },
    _onError(file) {
        console.log("Json error: " + file);
    },
    _onProgress(file) {
        console.log("Json loaded: " + file);
    },
}