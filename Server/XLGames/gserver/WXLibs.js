var http = require("../utils/http");

var appInfo = {
	Android: {
        appid: "wx7bea488eac610ba8",
        secret: "445288e3d1aa896623051d9708abe3ce",
	},
	iOS: {
        appid: "wx7bea488eac610ba8",
        secret: "445288e3d1aa896623051d9708abe3ce",
	}
};

function wxGetAccessToken(szCode, szOS, callback) {
	var pInfo = appInfo[szOS];
	if (pInfo == null) {
        callback(false, null);
        return;
    }
    
	var pData = {
		appid: pInfo.appid,
		secret: pInfo.secret,
		code: szCode,
		grant_type: "authorization_code"
	};

	http.get2("https://api.weixin.qq.com/sns/oauth2/access_token", pData, callback, true);
}
exports.wxGetAccessToken = wxGetAccessToken;

function wxGetUserInfo(szAccessToken, szOpenId, callback) {
	var pData = {
		access_token: szAccessToken,
		openid: szOpenId
	};

	http.get2("https://api.weixin.qq.com/sns/userinfo", pData, callback, true);
}
exports.wxGetUserInfo = wxGetUserInfo;