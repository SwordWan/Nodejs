cc.Class({
    extends: cc.Component,

    properties: {

    },



    onLoad() {
        window.sdkpickphoto.register(this);
    },


    OnClickXiangCe: function (event, arg) {
        this.node.active = false;
        if (cc.sys.isNative && cc.sys.isMobile) {
            cc.vv.anysdkMgr.albumsClick();
        }
    },


    OnClickCamera: function (event, arg) {
        this.node.active = false;
        if (cc.sys.isNative && cc.sys.isMobile) {
            cc.vv.anysdkMgr.cameraClick();
        }
    },

    CloseChangeFrame: function () {
        this.node.active = false;
    },


    pickPhoto(errcode, file, path) {
        this.PlayBtnSound();
        var self = this;
        console.log("++++++++++++++++++++++++++++++++-------------------1");
        console.log(path);
        console.log("++++++++++++++++++++++++++++++++-------------------4");
        var size = jsb.fileUtils.getFileSize(path);
        console.log("++++++++++++++++++++++++++++++++-------------------6:" + size);
        var str64 = jsb.fileUtils.getStringFromFile(path);
        console.log(str64);
        console.log("++++++++++++++++++++++++++++++++-------------------5:" + str64.length);
        console.log("++++++++++++++++++++++++++++++++-------------------7");
        this.scheduleOnce(function () {
            console.log("upload11111111111111111111111112222222222222222222226");
            var max = parseInt(str64.length / 1024) + 1;
            var str = "";
            for (var i = 0; i < max; i++) {
                if (i == max - 1) {
                    str = str64.substring(i * 1024);
                } else {
                    str = str64.substring(i * 1024, (i + 1) * 1024);
                }
                console.log(str);
                console.log(self._CurChangeMode);
                cc.vv.net.send("upimage", {
                    iMode: self._CurChangeMode,
                    size: str64.length,
                    szExtName: ".jpg",
                    count: max,
                    index: (i + 1),
                    buffersize: str.length,
                    pBytes: str
                });
            }
        }, 1.5);

        if (self._headSprite == null) {
            console.log("请设置头像框");
            return;
        }
        console.log("相册callback");
        console.log(file);
        if (0 == errcode) {
            cc.loader.load(file, cc.SpriteFrame, function (err, texture) {
                // Use texture to create sprite frame
                if (err) {
                    return console.log('load err');
                }
                self._headImage = texture;
                self._headSprite.spriteFrame = new cc.SpriteFrame(texture);
                console.log("upload1111111111111111111111111");
                console.log(file);
                //self.UpLoadHeadImage(texture,1,file);
            });
        }
    },

    GetBase64Code: function (str) {
        console.log("upload222222222222222222222222222");
        console.log(str);
        this.scheduleOnce(function () {
            console.log("upload1111111111111111111111111222222222222222222222");
            cc.vv.net.send("upimage", {
                iMode: 1,
                szExtName: ".jpg",
                pBytes: str
            });
        }, 3);
    },

});