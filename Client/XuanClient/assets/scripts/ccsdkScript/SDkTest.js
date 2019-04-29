
cc.Class({
    extends: cc.Component,

    properties: {
        head: { default: null, type: cc.Sprite },
        tip_txt: { default: null, type: cc.Label },
    },
    
    // onLoad () {},

    start () {
        //window.sdkpickphoto.register(this);
    },
    
    startRecording() {
        console.log('startRecording');
        window.sdkvoice.prepare("record.amr");
    },

    stopRecording() {
        console.log('stopRecording');
        window.sdkvoice.release();
        console.log('stopRecording1');
        let data = window.sdkvoice.getVoiceData("record.amr");
        console.log('stopRecording2');
        console.log(data);
        console.log('stopRecording3');
        window.sdkvoice.writeVoiceData('voicemsg.amr', data);
        console.log('stopRecording4');
        window.sdkvoice.play('voicemsg.amr');
        console.log('stopRecording5');
    },

    getBatteryClick() {
        console.log("batteryyyyyyyyyyyyyyyyyyyyyyyyy++++++++++++++++");
        let a = window.sdkbattery.getBattery();
        this.tip_txt.string = "当前电量为：" + a;
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
        this.tip_txt.string = "GPS:" + a;
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
        console.log("xiangce++++++++++++++++");
        window.sdkpickphoto.openAlbums()
    },
    cameraClick() {
        console.log("cameragpsstop++++++++++++++++");
        window.sdkpickphoto.openCamera()
    },

    pickPhoto(errcode, file) {
        var self = this;
        console.log("相册callback");
        console.log(file);
        if (0 == errcode) {
            cc.loader.load(file, cc.SpriteFrame, function (err, texture) {
                // Use texture to create sprite frame
                
                if (err) {
                    return console.log('load err');
                }
                self.head.spriteFrame = new cc.SpriteFrame(texture);
            });
        }
    },

    onDestroy() {

        window.sdkpickphoto.unregister(this);
    },
});
