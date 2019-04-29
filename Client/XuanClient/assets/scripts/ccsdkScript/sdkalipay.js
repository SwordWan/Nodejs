(function () {
	if (undefined == window.sdkalipay) {
		window.sdkalipay = {};
        window.sdkalipay.pay = function (orderInfo) {
            if (cc.sys.os == cc.sys.OS_ANDROID) {
                jsb.reflection.callStaticMethod("com/alpaysdk/alpaysdk", "pay", "(Ljava/lang/String;)V", orderInfo);
            } else {
                jsb.reflection.callStaticMethod("AppController", "alipay:", orderInfo);
            }
		};
	}
})();