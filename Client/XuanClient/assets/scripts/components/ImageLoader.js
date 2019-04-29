function loadImage(url,code,callback){
    /*
    if(cc.vv.images == null){
        cc.vv.images = {};
    }
    var imageInfo = cc.vv.images[url];
    if(imageInfo == null){
        imageInfo = {
            image:null,
            queue:[],
        };
        cc.vv.images[url] = imageInfo;
    }
    
    cc.loader.load(url,function (err,tex) {
        imageInfo.image = tex;
        var spriteFrame = new cc.SpriteFrame(tex, cc.Rect(0, 0, tex.width, tex.height));
        for(var i = 0; i < imageInfo.queue.length; ++i){
            var itm = imageInfo.queue[i];
            itm.callback(itm.code,spriteFrame);
        }
        itm.queue = [];
    });
    if(imageInfo.image != null){
        var tex = imageInfo.image;
        var spriteFrame = new cc.SpriteFrame(tex, cc.Rect(0, 0, tex.width, tex.height));
        callback(code,spriteFrame);
    }
    else{
        imageInfo.queue.push({code:code,callback:callback});
    }*/
    //cc.loader.load(url, function (err, tex) {
    //    cc.log(url);
    //    var spriteFrame = new cc.SpriteFrame(tex, cc.Rect(0, 0, tex.width, tex.height));
    //    cc.log("wxDownLoadHeadIcon" + tex);
    //    cc.log("wxDownLoadHeadIcon"+spriteFrame);
    //    callback(code,spriteFrame);
    //});
    
    cc.loader.load({
        url: url, type: 'jpg'
    }, function (err, tex) {
        //console.log("wxheadicon" + tex);
        if (tex == null) {
            return;
        }
        var spriteFrame = new cc.SpriteFrame(tex, cc.Rect(0, 0, tex.width, tex.height));
        callback(code, spriteFrame);
    });
};


function decode(input) {
    var _keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    var output = "", chr1, chr2, chr3, enc1, enc2, enc3, enc4, i = 0;
    input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
    while (i < input.length) {
        enc1 = _keyStr.indexOf(input.charAt(i++));
        enc2 = _keyStr.indexOf(input.charAt(i++));
        enc3 = _keyStr.indexOf(input.charAt(i++));
        enc4 = _keyStr.indexOf(input.charAt(i++));
        chr1 = (enc1 << 2) | (enc2 >> 4);
        chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
        chr3 = ((enc3 & 3) << 6) | enc4;
        output = output + String.fromCharCode(chr1);
        if (enc3 != 64) {
            output = output + String.fromCharCode(chr2);
        }
        if (enc4 != 64) {
            output = output + String.fromCharCode(chr3);
        }
    }
    output = utf8_decode(output);
    return output;
}

 function utf8_decode (utftext) {
    var string = "", i = 0, c = 0, c1 = 0, c2 = 0, c3 = 0;
    while (i < utftext.length) {
        c = utftext.charCodeAt(i);
        if (c < 128) {
            string += String.fromCharCode(c);
            i++;
        } else if ((c > 191) && (c < 224)) {
            c2 = utftext.charCodeAt(i + 1);
            string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
            i += 2;
        } else {
            c2 = utftext.charCodeAt(i + 1);
            c3 = utftext.charCodeAt(i + 2);
            string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
            i += 3;
        }
    }
    return string;
}

function getBaseInfo(userid,callback){
    if(cc.vv.baseInfoMap == null){
        cc.vv.baseInfoMap = {};
    }
    
    if(cc.vv.baseInfoMap[userid] != null){
        callback(userid,cc.vv.baseInfoMap[userid]);
    }
    else{
        cc.vv.http.sendRequest('/base_info',{userid:userid},function(ret){
            var url = null;
            url = ret.headimgurl;
            if (url != null && url != "")
            {
                if (url.indexOf("BASE64") != -1)
                {
                    //console.log(userid+"++++++++++++++++++++++++++++++" + url);
                    url = url.replace("BASE64", "");
                    url = decode(url);
                    //console.log(userid+"++++++++++++++++++++++++++++++" + url);

                }
            }
            if(ret.headimgurl){
                url = url + "?file=a.jpg";
            }
            //url = "http://wx.qlogo.cn/mmopen/vi_32/dUxXUtL8ElRWzRMjiczSeEOtrRpwicsGVz6Hx7mXwWu11vsLl6awXjeZvCibYz4BHm5Pn6DepyxRoqrTHsMYkwHTw/0?file=a.jpg"
            var info = {
                name:ret.name,
                sex:ret.sex,
                gems: ret.gems,
                coins: ret.coins,
                url:url,
            }
            cc.vv.baseInfoMap[userid] = info;
            callback(userid,info);
            
        },cc.vv.http.master_url);   
    }  
};

cc.Class({
    extends: cc.Component,
    properties: {
        // foo: {
        //    default: null,      // The default value will be used only when the component attaching
        //                           to a node for the first time
        //    url: cc.Texture2D,  // optional, default is typeof default
        //    serializable: true, // optional, default is true
        //    visible: true,      // optional, default is true
        //    displayName: 'Foo', // optional
        //    readonly: false,    // optional, default is false
        // },
        // ...
        _spriteFrame: null,
        _userid: 0,
    },

    // use this for initialization
    onLoad: function () {
        this.setupSpriteFrame();
    },
    
    setUserID:function(userid){
        if(!userid){
            return;
        }
        if(cc.vv.images == null){
            cc.vv.images = {};
        }
        this._userid = userid;
        var self = this;
        getBaseInfo(userid,function(code,info){
           if(info && info.url){
                //if(cc.sys.isNative == false){
                //    return;
               //}
               //console.log("wxDownLoadHeadIcon" + info.url);
               loadImage(info.url, userid, function (err, spriteFrame) {


                  // console.log("wxDownLoadHeadIcon" + info.url);

                    self._spriteFrame = spriteFrame;
                    self.setupSpriteFrame();
                });   
            } 
        });
    },
    
    setupSpriteFrame:function(){
        if(this._spriteFrame){
            var spr = this.getComponent(cc.Sprite);
            if(spr){
                spr.spriteFrame = this._spriteFrame;    
            }
        }
    },
    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },

});
