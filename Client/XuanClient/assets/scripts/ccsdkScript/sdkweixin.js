(function () {
	if (undefined == window.sdkweixin) {
		//sceneType 0朋友 1朋友圈
		window.sdkweixin = {};
		window.sdkweixin.pay = function (orderInfo){
			jsb.reflection.callStaticMethod("com/weixinsdk/WXAPI", "pay", "(Ljava/lang/String;)V", orderInfo);
		};
		window.sdkweixin.CallBack_Login = function(errCode ,code){
			console.log(errCode ,code);
		};
		window.sdkweixin.CallBack_Share = function(errCode){
			console.log(errCode);
		};
		
		window.sdkweixin.login = function (){
			jsb.reflection.callStaticMethod("com/weixinsdk/WXAPI", "Login", "()V");
		};		
		window.sdkweixin.setThumbSize = function (width ,height){
			jsb.reflection.callStaticMethod("com/weixinsdk/WXAPI", "SetThumbSize", "(Ljava/lang/String;)V", orderInfo);
		};
		window.sdkweixin.shareText = function (text, sceneType){
			jsb.reflection.callStaticMethod("com/weixinsdk/WXAPI", "ShareText", "(Ljava/lang/String;Ljava/lang/String;)V", text, sceneType);
		};
		window.sdkweixin.shareLink = function (url, title, desc, thumbFile, sceneType){
			jsb.reflection.callStaticMethod("com/weixinsdk/WXAPI", "ShareLink", "(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;)V", url, title, desc, thumbFile, sceneType);
		};
		window.sdkweixin.shareImage = function (imageFile, sceneType){
			jsb.reflection.callStaticMethod("com/weixinsdk/WXAPI", "ShareImage", "(Ljava/lang/String;Ljava/lang/String;)V", imageFile, sceneType);
		};
		window.sdkweixin.shareVideo = function (url , title , desc , thumbFile, sceneType){
			jsb.reflection.callStaticMethod("com/weixinsdk/WXAPI", "ShareVideo", "(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;)V", url , title , desc , thumbFile, sceneType);
		};
		window.sdkweixin.shareMusic = function (url , title , desc , thumbFile, sceneType){
			jsb.reflection.callStaticMethod("com/weixinsdk/WXAPI", "ShareMusic", "(Ljava/lang/String;)V", url , title , desc , thumbFile, sceneType);
		};
	}
})();