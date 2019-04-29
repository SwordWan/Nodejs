// Audio文件必须放在resources 目录下
var JsonFileMgr;// = require('JsonFileMgr');
var JsonFileCfg;//= require('JsonFileCfg');
var AudioPlayer;//= require('AudioPlayer');

module.exports = {
    _onLoadProgress(cur, total, item){
        //console.log("progress: " + cur + "/" + total);
    },
    _onLoadOver(err, result){
        if (result) {
            console.log("over: " + result);
        }
    },
    init(){
        JsonFileMgr.preLoadAudio();
    },

    _getAudio(roleID, type, point){
        // 0女,1男
        var sex = JsonFileMgr.getRoleSex(roleID);
        return this._getAudioUrl(sex, type, point);
    },

    _getAudioUrl(sex, type, point){
        // 需要关心point 的 type有： 1（单张），2（对儿），3（三张），200（聊天）
        if (type == 1 || type == 2 || type == 3 || type == 200) {
            point = point || 0;
        } else {
            point = 0;
        }
        for (var k = 0; k < JsonFileCfg.file.audio.data.length; k++) {
            var item = JsonFileCfg.file.audio.data[k];
            // itemType 需要作特殊处理, 数据是这样子的 1|2|3|4
            var bType = false;
            var itemType = item.type.toString().split('|');
            for (var key = 0; key < itemType.length; key++) {
                if (type == itemType[key]) {
                    bType = true;
                }
            }
            if (item.sex == sex && bType && item.point == point) {
                var itemUrl = item.mp3;
                var url = cc.url.raw("resources/" + itemUrl + ".mp3");
                return url;
            }
        }
        return null;
    },

    ///////////////////////////出牌音效///////////////////////////////////////////////////
    playCardSound: function (roleId, cardType, cardPoint) {
        var url = this._getAudio(roleId, cardType, cardPoint);
        if (url) {
            AudioPlayer.playEffect(url, false);
        }
    },

    // 动作音效
    playActionSound(roleId, actionType){
        var url = this._getAudio(roleId, actionType, 0);
        if (url) {
            AudioPlayer.playEffect(url, false);
        }
    },
    // 聊天
    playChatSound(roleId, chatId){
        var sex = JsonFileMgr.getRoleSex(roleId);
        var itemUrl = JsonFileMgr.getChatAudioUrl(chatId, sex);
        if (itemUrl) {
            var resourceUrl = cc.url.raw("resources/" + itemUrl + ".mp3");
            AudioPlayer.playEffect(resourceUrl, false);
        }
    },
    playButtonSound(){
        var url = cc.url.raw("resources/audio/effect/click.mp3");
        AudioPlayer.playEffect(url, false);
    }
}