(function () {
	if (undefined == window.sdkbattery) {
		window.sdkbattery = {};
		var mSDKBattery = '';
		window.sdkbattery.CallBack_Battery = function(Battery){
			mSDKBattery = Battery;
		};
        window.sdkbattery.getBattery = function () {
            if (cc.sys.os == cc.sys.OS_ANDROID) {

            } else {
                jsb.reflection.callStaticMethod("AppController", "batteryLevel");
            }
            console.log('getBattery');
            return mSDKBattery;
        };
		window.sdkbattery.start = function(){
			jsb.reflection.callStaticMethod("com/batterysdk/Battery", "start", "()V");
		};
		window.sdkbattery.stop = function(){
			jsb.reflection.callStaticMethod("com/batterysdk/Battery", "stop", "()V");
		};
	}
	/*
	window.launchGame.startBattery_Callback = function(batteryLevel ,batteryScale) {
		console.log('battery_Callback' ,batteryLevel ,batteryScale);
		for (var key in cb_options) {
			if (undefined != cb_options[key].batteryProcess) {
				cb_options[key].batteryProcess(batteryLevel, batteryScale);
			}
		}
	};
	window.launchGame.startBattery = function(){
		jsb.reflection.callStaticMethod("com/honest/Utils", "startBattery", "()V");
	};
	window.launchGame.stopBattery = function(){
		jsb.reflection.callStaticMethod("com/honest/Utils", "stopBattery", "()V");
	};
	*/
	
})();