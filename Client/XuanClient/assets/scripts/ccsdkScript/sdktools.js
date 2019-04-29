(function () {
	if (undefined == window.sdktools) {
		var mBuildModel = null;
		window.sdktools = {};
		window.sdktools.Callback_Build = function(model){
			console.log('Callback_Build' ,model);
			mBuildModel = model;
		};
		window.sdktools.getBuildModel = function(){
			if(cc.sys.isNative){
				if(cc.sys.os == cc.sys.OS_ANDROID){ 
					jsb.reflection.callStaticMethod("com/toolssdk/Tools", "device", "()V");
				}
			}
			return mBuildModel;
		};
		window.sdktools.copyClip = function(textString){
			if(cc.sys.isNative){
				if(cc.sys.os == cc.sys.OS_ANDROID){ 
					jsb.reflection.callStaticMethod("com/toolssdk/Tools", "copyClip", "(Ljava/lang/String;)V" ,textString);
				}
			}
		};
	}
})();