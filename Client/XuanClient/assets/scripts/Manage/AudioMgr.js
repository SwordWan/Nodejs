cc.Class({
    extends: cc.Component,

    properties: {
        // foo: {
        //    default: null,      // The default value will be used only when the component attaching
        //                           to a node for the first time
        //    url: cc.Texture2D,  // optional, default is typeof default
        //    serializable: true, // optional, default is true
        //    visible: true,      // optional, default is true
        //    displayName: 'Foo', // optional
        //    readonly: false,    // optional, default is falseShishicaiNet
        // },
        // ...
        bgmVolume: 1.0,
        sfxVolume: 1.0,
        bgmAudioID: -1,
        curBgmName: "",
    },

    // use this for initialization
    init: function () {
        var t = cc.sys.localStorage.getItem("bgmVolume");
        if (t != null) {
            this.bgmVolume = parseFloat(t);
        }

        var t = cc.sys.localStorage.getItem("sfxVolume");
        if (t != null) {
            this.sfxVolume = parseFloat(t);
        }

        cc.game.on(cc.game.EVENT_HIDE, function () {
            console.log("cc.audioEngine.pauseAll");
            cc.audioEngine.pauseAll();
        });
        cc.game.on(cc.game.EVENT_SHOW, function () {
            console.log("cc.audioEngine.resumeAll");
            cc.audioEngine.resumeAll();
        });
    },

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },

    getUrl: function (url) {
        return cc.url.raw("resources/sounds/" + url);
    },

    playBGM(url) {
        this.curBgmName = url;
        var audioUrl = this.getUrl(url);
        console.log(audioUrl);
        if (this.bgmAudioID >= 0) {
            cc.audioEngine.stop(this.bgmAudioID);
        }
        if (this.bgmVolume > 0) {
            this.bgmAudioID = cc.audioEngine.play(audioUrl, true, this.bgmVolume);
        }
    },

    stopBackAudio: function ()
    {
        if (this.bgmAudioID >= 0) {
            cc.audioEngine.stop(this.bgmAudioID);      
        }
        this.curBgmName = "";
        this.bgmAudioID = 0;
    },

    playSFX(url, sex) {
        if (sex != null) {
            var fangyan = cc.sys.localStorage.getItem('fangyan');
            if (cc.vv.gameNetMgr.conf.type != null && cc.vv.gameNetMgr.NIUNIU_GAME == cc.vv.gameNetMgr.conf.type) {
                if (sex == 1) {
                        url = 'cow/man/' + url;
                }
                else {
                        url = 'cow/women/' + url;
                }
            } else {
                if (fangyan == 'false') {
                    if (sex == 1) {
                        if (cc.vv.gameNetMgr.conf.type != null && cc.vv.gameNetMgr.WANGBA_GAME == cc.vv.gameNetMgr.conf.type || cc.vv.gameNetMgr.conf.type == cc.vv.gameNetMgr.QUAN_MJ) {
                            url = 'locallanguage/man/' + url;
                        } else {
                            url = 'fangyan/man/' + url;
                        }
                    }
                    else {
                        if (cc.vv.gameNetMgr.conf.type != null && cc.vv.gameNetMgr.WANGBA_GAME == cc.vv.gameNetMgr.conf.type || cc.vv.gameNetMgr.conf.type == cc.vv.gameNetMgr.QUAN_MJ) {
                            url = 'locallanguage/woman/' + url;
                        } else {
                            url = 'fangyan/woman/' + url;
                        }
                    }
                }
                else {
                    if (sex == 1) {
                        if (cc.vv.gameNetMgr.conf.type != null && cc.vv.gameNetMgr.WANGBA_GAME == cc.vv.gameNetMgr.conf.type || cc.vv.gameNetMgr.conf.type == cc.vv.gameNetMgr.QUAN_MJ) {
                            url = 'man/' + url;
                        } else {
                            url = 'man/' + url;
                        }
                    }
                    else {
                        if (cc.vv.gameNetMgr.conf.type != null && cc.vv.gameNetMgr.WANGBA_GAME == cc.vv.gameNetMgr.conf.type || cc.vv.gameNetMgr.conf.type == cc.vv.gameNetMgr.QUAN_MJ) {
                            url = 'woman/' + url;
                        } else {
                            url = 'woman/' + url;
                        }
                    }
                }
            }
        }
        var audioUrl = this.getUrl(url);
        if (this.sfxVolume > 0) {
            var audioId = cc.audioEngine.play(audioUrl, false, this.sfxVolume);
        }
    },

    playAudioFx: function (url)
    {
        url = cc.url.raw(url);
        cc.audioEngine.play(url, false, this.sfxVolume);
    },

    getCowUrl: function (url) {
        return cc.url.raw("resources/cowGame/audio/dn_effect/" + url);
    },

    playCowSFX(url, sex) {
        if (sex != null) {
            if (sex == 1) {
                url = url + '_m.mp3';
            }
            else {
                url = url + '_w.mp3';
            }
        }
        var audioUrl = this.getCowUrl(url);
        if (this.sfxVolume > 0) {
            var audioId = cc.audioEngine.play(audioUrl, false, this.sfxVolume);
        }
    },

    playCowSFXLoop(url) {
        var audioUrl = this.getCowUrl(url);
        if (this.sfxVolume > 0) {
            var audioId = cc.audioEngine.play(audioUrl, false, this.sfxVolume);
        }
    },


    getZJHUrl: function (url) {
        return cc.url.raw("resources/ZJHGame/sound_my/" + url);
    },

    playZJHSFX(url, sex) {
        var fangyan = cc.sys.localStorage.getItem('fangyan');
        var number = Math.floor(Math.random() * 3 + 1); 
        if (fangyan == 'false') {
            if (sex != null) {
                if (sex == 1) {
                    url = 'fangyan/' + 'M_' + url + '_0' + number + '.mp3';
                }
                else {
                    url = 'fangyan/' + 'F_' + url + '_0' + number + '.mp3';
                }
            }
        } else {
            if (sex != null) {
                if (sex == 1) {
                    url = 'fangyan/' + 'M_' + url + '_0' + number + '.mp3';
                }
                else {
                    url = 'fangyan/' + 'F_' + url + '_0' + number + '.mp3';
                }
                //if (sex == 1) {
                //    url = 'M_' + url + '_0' + number + '.mp3';
                //}
                //else {
                //    url = 'F_' + url + '_0' + number + '.mp3';
                //}
            }
        }
        var audioUrl = this.getZJHUrl(url);
        if (this.sfxVolume > 0) {
            var audioId = cc.audioEngine.play(audioUrl, false, this.sfxVolume);
        }
    },

    setSFXVolume: function (v) {
        if (this.sfxVolume != v) {
            cc.sys.localStorage.setItem("sfxVolume", v);
            this.sfxVolume = v;
        }
    },

    setBGMVolume: function (v, force) {
        if (this.bgmAudioID >= 0) {
            if (v > 0) {
                cc.audioEngine.resume(this.bgmAudioID);
            }
            else {
                cc.audioEngine.pause(this.bgmAudioID);
            }
            //cc.audioEngine.setVolume(this.bgmAudioID,this.bgmVolume);
        }
        if (this.bgmVolume != v || force) {
            cc.sys.localStorage.setItem("bgmVolume", v);
            this.bgmVolume = v;
            cc.audioEngine.setVolume(this.bgmAudioID, v);
        }
    },

    pauseAll: function () {
        cc.audioEngine.pauseAll();
    },

    resumeAll: function () {
        cc.audioEngine.resumeAll();
    }
});
