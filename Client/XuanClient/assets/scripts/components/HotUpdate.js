function urlParse() {
    var params = {};
    if (window.location == null) {
        return params;
    }
    var name, value;
    var str = window.location.href; //取得整个地址栏
    var num = str.indexOf("?")
    str = str.substr(num + 1); //取得所有参数   stringvar.substr(start [, length ]

    var arr = str.split("&"); //各个参数放到数组里
    for (var i = 0; i < arr.length; i++) {
        num = arr[i].indexOf("=");
        if (num > 0) {
            name = arr[i].substring(0, num);
            value = arr[i].substr(num + 1);
            params[name] = value;
        }
    }
    return params;
}

function initMgr() {
    cc.vv = {};
    var UserMgr = require("UserMgr");
    cc.vv.userMgr = new UserMgr();

    cc.vv.http = require("HTTP");
    cc.vv.global = require("Global");
    cc.vv.net = require("Net");
    cc.vv.GameNet = require("gameNet");

    var GameNetMgr = require("GameNetMgr");
    cc.vv.gameNetMgr = new GameNetMgr();
    cc.vv.gameNetMgr.initConnec();

    var AnysdkMgr = require("AnysdkMgr");
    cc.vv.anysdkMgr = new AnysdkMgr();
    cc.vv.anysdkMgr.init();

    var PokeType = require("PokeType");
    cc.vv.PokeType = new PokeType();

    var VoiceMgr = require("VoiceMgr");
    cc.vv.voiceMgr = new VoiceMgr();
    cc.vv.voiceMgr.init();

    var AudioMgr = require("AudioMgr");
    cc.vv.audioMgr = new AudioMgr();
    cc.vv.audioMgr.init();

    var Utils = require("Utils");
    cc.vv.utils = new Utils();

    var errCode = require("ErrorCodes");
    cc.vv.errCode = errCode;

    var Preload = require("Preload");
    cc.vv.preload = new Preload();
    cc.vv.preload.preLoadPrefab();

    var uikiller = require("uikiller")
    cc.vv.uikiller = uikiller;

    cc.vv.socket = require("Socket");

}

cc.Class({
    extends: cc.Component,

    properties: {
        m_tilte: cc.Label,
        m_progressBar: cc.ProgressBar,
        Hotupdate: true,
        manifestUrl: cc.RawAsset,
    },

    ctor() {
        this._mainScene = 'login';
    },

    // use this for initialization
    onLoad: function () {

        initMgr();

        var yinxiao = cc.sys.localStorage.getItem("yinxiao");
        var yinyue = cc.sys.localStorage.getItem("yinyue");
        if (yinxiao == "1") {
            cc.vv.audioMgr.setSFXVolume(1);
        } else if (yinxiao == "0") {
            cc.vv.audioMgr.setSFXVolume(0);
        }

        if (yinyue == "1") {
            cc.vv.audioMgr.setBGMVolume(100, true);
        } else if (yinyue == "0") {
            cc.vv.audioMgr.setBGMVolume(0, true);
        }

        this.getServerInfo();
    },

    getServerInfo: function () {
        var self = this;
        var onGetVersion = function (ret) {
            if (ret.szVersion == null) {
                console.log("error.");
            } else {
                cc.vv.SI = ret;
                if (self.Hotupdate && cc.sys.isNative) {
                    self.updateHotRes();
                } else {
                    cc.director.loadScene(self._mainScene);
                }
            }
        };

        var xhr = null;
        var complete = false;
        var fnRequest = function () {
            self.m_tilte.string = "正在连接服务器";
            xhr = cc.vv.http.sendRequest("/getversion", {
                args: 0
            }, function (ret) {
                xhr = null;
                complete = true;
                onGetVersion(ret);
            });
            setTimeout(fn, 5000);
        }

        var fn = function () {
            if (!complete) {
                if (xhr) {
                    xhr.abort();
                    self.m_tilte.string = "连接失败，即将重试";
                    setTimeout(function () {
                        fnRequest();
                    }, 5000);
                } else {
                    fnRequest();
                }
            }
        };
        fn();
    },

    updateHotRes: function () {
        var storagePath = ((jsb.fileUtils ? jsb.fileUtils.getWritablePath() : '/') + 'take-remote-asset');
        console.log('Storage path for remote asset : ' + storagePath);
        this._am = new jsb.AssetsManager(this.manifestUrl, storagePath);
        if (!cc.sys.ENABLE_GC_FOR_NATIVE_OBJECTS) {
            this._am.retain();
        }

        this._am.setVersionCompareHandle(function (versionA, versionB) {
            console.log("JS Custom Version Compare: version A is " + versionA + ', version B is ' + versionB);
            var vA = versionA.split('.');
            var vB = versionB.split('.');
            var maina = parseInt(vA[0]);
            var mainb = parseInt(vB[0]);
            console.log("JS Custom Version Compare: maina A is " + maina + ', mainb B is ' + mainb);
            for (var i = 1; i < vA.length; ++i) {
                var a = parseInt(vA[i]);
                var b = parseInt(vB[i] || 0);
                if (a === b) {
                    continue;
                } else {
                    return a - b;
                }
            }
            if (vB.length > vA.length) {
                return -1;
            } else {
                return 0;
            }
        }.bind(this));

        this._am.setVerifyCallback(function (path, asset) {
            // When asset is compressed, we don't need to check its md5, because zip file have been deleted.
            var compressed = asset.compressed;
            // Retrieve the correct md5 value.
            var expectedMD5 = asset.md5;
            // asset.path is relative path and path is absolute.
            var relativePath = asset.path;
            // The size of asset file, but this value could be absent.
            var size = asset.size;
            if (compressed) {
                console.log("Verification passed : ", relativePath);
                return true;
            } else {
                console.log("Verification passed : ", relativePath, ' (', expectedMD5, ')');
                return true;
            }
        });

        if (cc.sys.os === cc.sys.OS_ANDROID) {
            this._am.setMaxConcurrentTask(2);
        }

        this.checkUpdate();
    },

    checkUpdate: function () {
        if (this._updating) {
            console.log("Checking or updating ...");
            return;
        }
        if (!this._am.getLocalManifest().isLoaded()) {
            console.log("Failed to load local manifest ...");
            return;
        }
        this._checkListener = new jsb.EventListenerAssetsManager(this._am, this.checkCb.bind(this));
        cc.eventManager.addListener(this._checkListener, 1);
        this.m_tilte.string = '检查远程版本号...'
        this._am.checkUpdate();
        this._updating = true;
    },

    checkCb: function (event) {
        console.log('Code: ' + event.getEventCode());
        switch (event.getEventCode()) {
            case jsb.EventAssetsManager.ERROR_NO_LOCAL_MANIFEST:
                console.log("No local manifest file found, hot update skipped.");
                cc.director.loadScene(this._mainScene);
                break;
            case jsb.EventAssetsManager.ERROR_DOWNLOAD_MANIFEST:
            case jsb.EventAssetsManager.ERROR_PARSE_MANIFEST:
                console.log("Fail to download manifest file, hot update skipped.");
                cc.director.loadScene(this._mainScene);
                break;
            case jsb.EventAssetsManager.ALREADY_UP_TO_DATE:
                console.log("已经是最新的");
                this.m_tilte.string = '当前版本已经是最新的';
                cc.director.loadScene(this._mainScene);
                break;
            case jsb.EventAssetsManager.NEW_VERSION_FOUND:
                console.log('发现新的更新');
                this.m_tilte.string = '发现新的版本. 准备更新...';
                cc.eventManager.removeListener(this._checkListener);
                this._checkListener = null;
                this._updating = false;
                this.hotUpdate();
                return;
            default:
                return;
        }

        cc.eventManager.removeListener(this._checkListener);
        this._checkListener = null;
        this._updating = false;
        this.node.active = false;
    },

    hotUpdate: function () {

        if (this._am && !this._updating) {
            this._updateListener = new jsb.EventListenerAssetsManager(this._am, this.updateCb.bind(this));
            cc.eventManager.addListener(this._updateListener, 1);

            this._failCount = 0;
            this._am.update();
            this._updating = true;
        }
    },


    updateCb: function (event) {
        var needRestart = false;
        var failed = false;
        switch (event.getEventCode()) {
            case jsb.EventAssetsManager.ERROR_NO_LOCAL_MANIFEST:
                this.m_tilte.string = "更新失败,本地没有配置文件";
                failed = true;
                break;
            case jsb.EventAssetsManager.UPDATE_PROGRESSION:
                this.m_tilte.string = "自动更新文件" + parseInt(event.getPercentByFile() * 100) + "%...";
                this.m_progressBar.progress = event.getPercentByFile();

                var msg = event.getMessage();
                if (msg) {
                    console.log("Updated file: ", msg);
                    console.log(event.getPercent().toFixed(2) + '% : ' + msg);
                }
                break;
            case jsb.EventAssetsManager.ERROR_DOWNLOAD_MANIFEST:
            case jsb.EventAssetsManager.ERROR_PARSE_MANIFEST:

                this.m_tilte.string = "解析文件错误";
                failed = true;
                break;
            case jsb.EventAssetsManager.ALREADY_UP_TO_DATE:
                this.m_tilte.string = "";
                failed = true;
                break;
            case jsb.EventAssetsManager.UPDATE_FINISHED:
                console.log("Update finished. ", event.getMessage());
                needRestart = true;
                break;
            case jsb.EventAssetsManager.UPDATE_FAILED:
                this.m_tilte.string = "更新失败:" + event.getMessage();
                console.log("Update failed. ", event.getMessage());
                this._updating = false;
                this._canRetry = true;
                break;
            case jsb.EventAssetsManager.ERROR_UPDATING:
                this.m_tilte.string = "更新失败:" + event.getAssetId() + " ," + event.getMessage();
                console.log("Asset update error: ", event.getAssetId(), ', ', event.getMessage());
                break;
            case jsb.EventAssetsManager.ERROR_DECOMPRESS:
                this.m_tilte.string = "更新失败:" + event.getMessage();
                console.log(event.getMessage());
                break;
            default:
                break;
        }

        if (failed) {
            cc.eventManager.removeListener(this._updateListener);
            this._updateListener = null;
            this._updating = false;
        }

        if (!this._updating && this._canRetry) {
            this._canRetry = false;
            
            this._am.downloadFailedAssets();
        }

        if (needRestart) {
            cc.eventManager.removeListener(this._updateListener);
            this._updateListener = null;
            // Prepend the manifest's search path
            var searchPaths = jsb.fileUtils.getSearchPaths();
            var newPaths = this._am.getLocalManifest().getSearchPaths();
            console.log('newPaths: ' + JSON.stringify(newPaths));
            Array.prototype.unshift(searchPaths, newPaths);
            // This value will be retrieved and appended to the default search path during game startup,
            // please refer to samples/js-tests/main.js for detailed usage.
            // !!! Re-add the search paths in main.js is very important, otherwise, new scripts won't take effect.
            cc.sys.localStorage.setItem('HotUpdateSearchPaths', JSON.stringify(searchPaths));

            jsb.fileUtils.setSearchPaths(searchPaths);
            cc.game.restart();
        }
    },

    onDestroy: function () {
        if (this._updateListener) {
            cc.eventManager.removeListener(this._updateListener);
            this._updateListener = null;
        }
        if (this._am && !cc.sys.ENABLE_GC_FOR_NATIVE_OBJECTS) {
            this._am.release();
        }
    },

});