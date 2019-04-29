// var URL = "http://47.110.133.123:9501";  // 正式
// var URL = "http://47.111.75.223:9501";  //  测试
var URL = "http://192.168.0.181:9501"; //  测试

//默认window环境下输出log;
var LOG_NET = cc.sys.os == cc.sys.OS_WINDOWS;
// var LOG_NET = false
var HTTP = cc.Class({
    extends: cc.Component,
    statics: {
        sessionId: 0,
        userId: 0,
        master_url: URL,
        url: URL,
        sendRequest: function (path, data, handler, extraUrl) {
            if (LOG_NET) console.log("%c http send:",'color:#f00;', path, data);
            var timeoutDone = false;
            var xhr = cc.loader.getXMLHttpRequest();
            xhr.timeout = 10000;
            var str = "?";
            for (var k in data) {
                if (str != "?") {
                    str += "&";
                }
                str += k + "=" + data[k];
            }
            if (extraUrl == null) {
                extraUrl = HTTP.url;
            }
            var requestURL = extraUrl + path + encodeURI(str);
            //console.log("RequestURL:" + requestURL);
            xhr.open("GET", requestURL, true);
            if (cc.sys.isNative) {
                xhr.setRequestHeader("Accept-Encoding", "gzip,deflate", "text/html;charset=UTF-8");
            }
            xhr.ontimeout = function () {
                if (!timeoutDone) {
                    timeoutDone = true;
                    handler({
                        wErrCode: 1,
                        szErrMsg: '网络超时'
                    });
                }
            }
            xhr.onloadend = function () {
                if (LOG_NET) console.log('%c http recive:','color:#0f0;', xhr.responseText);
                var result = null;
                try {
                    result = JSON.parse(xhr.responseText);
                } catch (e) {
                    result = {
                        wErrCode: 1,
                        szErrMsg: '数据异常'
                    };
                }
                if (!timeoutDone) {
                    timeoutDone = true;
                    handler(result);
                }
            };
            /*
            xhr.onreadystatechange = function ()
             {
                if (xhr.readyState === 4 && (xhr.status >= 200 && xhr.status < 300))
                     {
               //     console.log("http res(" + xhr.responseText.length + "):" + xhr.responseText);
                    try {
                        var ret = JSON.parse(xhr.responseText);
                        if (handler !== null) {
                            handler(ret);
                        }
                    }
                    finally {
                        if (cc.vv && cc.vv.wc) {
                            //       cc.vv.wc.hide();    
                        }
                    }
                }
            };

            if (cc.vv && cc.vv.wc) {
                //cc.vv.wc.show();
            }
			*/
            xhr.send();
            return xhr;
        },
    },
});
