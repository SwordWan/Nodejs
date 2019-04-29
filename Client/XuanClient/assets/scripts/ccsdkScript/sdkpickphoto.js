(function () {
	if (undefined == window.sdkpickphoto) {
		var mSDKPickPhotoDir = null;
        var mUserCallbackObj = null;
        var base64Str = "";
		if(cc.sys.isNative){
			mSDKPickPhotoDir = jsb.fileUtils.getWritablePath() + "pickphotosdk/";
			if(!jsb.fileUtils.isDirectoryExist(mSDKPickPhotoDir)){
				jsb.fileUtils.createDirectory(mSDKPickPhotoDir);
			}
			if(cc.sys.os == cc.sys.OS_ANDROID){ 
				jsb.reflection.callStaticMethod("com/pickphotosdk/PickPhoto", "setStorageDir", "(Ljava/lang/String;)V",mSDKPickPhotoDir);    
			} else if(cc.sys.os == cc.sys.OS_IOS){
				jsb.reflection.callStaticMethod("pickphotosdk", "setStorageDir:",mSDKPickPhotoDir);
			}
		}
		

		window.sdkpickphoto = {};
		
		window.sdkpickphoto.register = function(userObj){
            mUserCallbackObj = userObj;

		};
		
		window.sdkpickphoto.unregister = function(){
			mUserCallbackObj = null;
		};
		
		window.sdkpickphoto.CallBack_PickPhoto = function(errCode ,file,str){
			console.log('CallBack_PickPhoto');
			console.log(errCode);
			console.log(file);
			if(null != mUserCallbackObj && mUserCallbackObj.pickPhoto){
				mUserCallbackObj.pickPhoto(errCode ,file,str);
			}
        };

        window.sdkpickphoto.CallBack_GetBase64 = function (code, str) {
            console.log('GetBase64Code++++++++++++++++' + code);
            console.log(str);
            if (code == 0) {
                base64Str = "";
                base64Str += str;
            } else if (code == -1) {
                if (null != mUserCallbackObj && mUserCallbackObj.pickPhoto) {
                    mUserCallbackObj.GetBase64Code(str);
                }
            } else {
                base64Str += str;
            }
        };

        window.sdkpickphoto.openAlbums = function () {
            if (cc.sys.os == cc.sys.OS_ANDROID) {
                jsb.reflection.callStaticMethod("com/pickphotosdk/PickPhoto", "openAlbums", "()V");
            } else {
                jsb.reflection.callStaticMethod("AppController", "openAlbums");
            }
        };
        window.sdkpickphoto.openCamera = function () {
            if (cc.sys.os == cc.sys.OS_ANDROID) {
                jsb.reflection.callStaticMethod("com/pickphotosdk/PickPhoto", "openCamera", "()V");
            } else {
                jsb.reflection.callStaticMethod("AppController", "openCamera");
            }
        };

        window.sdkpickphoto.getFileBase64Block = function (url) {
            jsb.reflection.callStaticMethod("com/pickphotosdk/PickPhoto", "getFileBase64Block", "(Ljava/lang/String;)V", url);
        };
		/*
		window.launchGame.openAlbums = function (){
			jsb.reflection.callStaticMethod("com/honest/Utils", "openAlbums", "()V");
		};
		window.launchGame.openCamera = function (){
			jsb.reflection.callStaticMethod("com/honest/Utils", "openCamera", "()V");
		};
		window.launchGame.pickImage_Callback = function (errCode ,file){
			console.log('pickImage_Callback');
			console.log(errCode);
			console.log(file);
		};
		*/
	}
})();