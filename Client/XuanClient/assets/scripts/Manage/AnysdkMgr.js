cc.Class({
    extends: cc.Component,

    properties: {

        _battery: 0,
        _gps: null,
        _headImage:null,
        _headSprite:null,
    },


    init: function () {
        this._gps = {
            x: 0,
            y: 0,
        }
        // window.sdkpickphoto.register(this);
        if (cc.sys.isNative && cc.sys.isMobile) {
            this.startBatteryClick();
        }
    },

    startRecording() {
        console.log('startRecording');
        window.sdkvoice.prepare("record.amr");
    },

    stopRecording() {
        window.sdkvoice.release();
        //let data = window.sdkvoice.getVoiceData("record.amr");
        //window.sdkvoice.writeVoiceData('voicemsg.amr', data);
        //window.sdkvoice.play('voicemsg.amr');
    },

    CancelRecording: function(){
        window.sdkvoice.cancel();
    },

    GetRecordingData: function () {
        return window.sdkvoice.getVoiceData("record.amr");
    },

    getBatteryClick() {
        var a = window.sdkbattery.getBattery();
        if (a != "" && a != null) {
            var arr = a.split(",");
            this._battery = Number(arr[0]) / Number(arr[1]);
            return this._battery;
        } else {
            console.log("电量获取失败");
        }

    },

    startBatteryClick() {
        console.log("batteryStart++++++++++++++++");
        window.sdkbattery.start();
    },
    stopBatteryClick() {
        console.log("batteryStop++++++++++++++++");
        window.sdkbattery.stop();
    },

    getGPSPositionClick() {
        console.log("gpssssss++++++++++++++++");
        let a = window.sdkgps.getLatitudeLongitude();
        if (a != "" && a != null) {
            var arr = a.split(",");
            this._gps.x = Number(arr[0]);
            this._gps.y = Number(arr[1]);
            return this._gps;
        } else {
            console.log("GPS获取失败");
        }
    },
    startGPSClick() {
        console.log("gpsstart++++++++++++++++");
        window.sdkgps.start();
    },
    stopGPSClick() {
        console.log("gpsstop++++++++++++++++");
        window.sdkgps.stop();
    },
    
    albumsClick() {
        console.log(this._headSprite);
        console.log("xiangce++++++++++++++++");
        window.sdkpickphoto.openAlbums()
    },
    cameraClick() {
        console.log("cameragpsstop++++++++++++++++");
        window.sdkpickphoto.openCamera()
    },

    pickPhoto(errcode, file) {
        var self = this;
        console.log("++++++++++++++++++++++++++++++++-------------------");
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
            });
        }
    },

    EncodeImage: function (Texture) {


    },

    DecodeImage: function () {


    },

    onDestroy() {
        //window.sdkpickphoto.unregister(this);
    },
});
