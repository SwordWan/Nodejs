// 控制游戏声音播放
//var GameCfg = require('GameCfg');
var GameCfg;
module.exports = {
    _bgMusicID: null,// 背景音乐句柄, 背景音乐之存在一个

    // 播放音乐 isLoop 默认为true
    playMusic(url, isLoop){
        if (typeof (isLoop) == "undefined") {
            isLoop = true;
        }
        if (this._bgMusicID) {
            cc.audioEngine.stopMusic(this._bgMusicID);
            this._bgMusicID = null;
        }

        var soundID = cc.audioEngine.playMusic(url, isLoop);
        this._bgMusicID = soundID;
        return soundID;
    },
    // 停止当前正在播放的背景音乐
    stopCurBg(){
        if (this._bgMusicID) {
            cc.audioEngine.stopMusic(this._bgMusicID);
            this._bgMusicID = null;
        }
    },
    // 播放音效 默认为false
    playEffect(url, isLoop){
        if (typeof (isLoop) == "undefined") {
            isLoop = true;
        }
        var soundID = cc.audioEngine.playEffect(url, isLoop);
        return soundID;
    },
};