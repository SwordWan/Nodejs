(function () {
	if (undefined == window.sdkgps) {
		var mLatitudeAndLongitude = "未知";
		var mSDKGPSStatus = 0;
		window.sdkgps = {};
		window.sdkgps.CallBack_LatitudeLongitude = function(LatitudeAndLongitude){
			mLatitudeAndLongitude = LatitudeAndLongitude;
		};
		window.sdkgps.getLatitudeLongitude = function(){
			return mLatitudeAndLongitude;
		};
		window.sdkgps.start = function(){
			jsb.reflection.callStaticMethod("com/baidusdk/BaiDuLocation", "start", "()V");
		};
		window.sdkgps.stop = function(){
			jsb.reflection.callStaticMethod("com/baidusdk/BaiDuLocation", "stop", "()V");
		};


        window.sdkgps.start = function () {
            if (cc.sys.os == cc.sys.OS_ANDROID) {
                jsb.reflection.callStaticMethod("com/baidusdk/BaiDuLocation", "start", "()V");
            } else {
                jsb.reflection.callStaticMethod("AppController", "bdlStart");
            }
        };
        window.sdkgps.stop = function () {
            if (cc.sys.os == cc.sys.OS_ANDROID) {
                jsb.reflection.callStaticMethod("com/baidusdk/BaiDuLocation", "stop", "()V");
            } else {
                jsb.reflection.callStaticMethod("AppController", "bdlStop");
            }
        };
		/*
		window.launchGame.GPS_Callback = function(longitude, latitude){
			console.log('GPS_Callback' ,longitude, latitude);
			for (var key in cb_options) {
				if (undefined != cb_options[key].gpsProcess) {
					cb_options[key].gpsProcess(longitude, latitude);
				}
			}
		};
		window.launchGame.isGPSOpen_Callback = function(status){
			console.log('isGPSOpen_Callback' ,status);
			m_gpsStatus = status;
		};
		window.launchGame.isGPSOpen = function(){
			jsb.reflection.callStaticMethod("com/honest/Utils", "isGPSOpen", "()V");
			return m_gpsStatus;
		};
		window.launchGame.startGPS = function(){
			jsb.reflection.callStaticMethod("com/honest/Utils", "startGPS", "()V");
		};
		window.launchGame.stopGPS = function(){
			jsb.reflection.callStaticMethod("com/honest/Utils", "stopGPS", "()V");
		};
		*/
	}
})();