(function(){
	if (undefined == window.sdkvoice) {
		window.sdkvoice = {};
		var encodermap = {}
		var decodermap = {}
		var radix = 12;
		var base = 128 - radix;
		var mSDKVoiceMediaPath = null;
		if(cc.sys.isNative){
			mSDKVoiceMediaPath = jsb.fileUtils.getWritablePath() + "voicemsgs/";
			if(!jsb.fileUtils.isDirectoryExist(mSDKVoiceMediaPath)){
				jsb.fileUtils.createDirectory(mSDKVoiceMediaPath);
			}
			if(cc.sys.os == cc.sys.OS_ANDROID){ 
				jsb.reflection.callStaticMethod("com/voicesdk/VoiceRecorder", "setStorageDir", "(Ljava/lang/String;)V",mSDKVoiceMediaPath);    
			} else if(cc.sys.os == cc.sys.OS_IOS){
				jsb.reflection.callStaticMethod("VoiceSDK", "setStorageDir:",mSDKVoiceMediaPath);
			}
		}
		
		function crypto(value){
			value -= base;
			var h = Math.floor(value/radix) + base;
			var l = value%radix + base;
			return String.fromCharCode(h) + String.fromCharCode(l);
		}
		
		for(var i = 0; i < 256; ++i){
			var code = null;
			var v = i + 1;    
			if(v >= base){
				code = crypto(v);
			} else{
				code = String.fromCharCode(v);    
			}
			encodermap[i] = code;
			decodermap[code] = i;
		}

		function encode(data){
			var content = "";
			var len = data.length;
			var a = (len >> 24) & 0xff;
			var b = (len >> 16) & 0xff;
			var c = (len >> 8) & 0xff;
			var d = len & 0xff;
			content += encodermap[a];
			content += encodermap[b];
			content += encodermap[c];
			content += encodermap[d];
			for(var i = 0; i < data.length; ++i){
				content += encodermap[data[i]];
			}
			return content;
		}

		function getCode(content,index){
			var c = content.charCodeAt(index);
			if(c >= base){
				c = content.charAt(index) + content.charAt(index + 1);
			}
			else{
				c = content.charAt(index);
			}
			return c;
		}
		function decode(content){
			var index = 0;
			var len = 0;
			for(var i = 0; i < 4; ++i){
				var c = getCode(content,index);
				index += c.length;
				var v = decodermap[c];
				len |= v << (3-i)*8;
			}
			
			var newData = new Uint8Array(len);
			var cnt = 0;
			while(index < content.length){
				var c = getCode(content,index);
				index += c.length;
				newData[cnt] = decodermap[c];
				cnt++;
			}
			return newData;
		}
		
		window.sdkvoice.prepare = function(filename){
			if(!cc.sys.isNative){
				return;
			}
			console.log('prepare xxxxxxxxxxxx1');
			cc.audioEngine.pauseAll();
			console.log('prepare xxxxxxxxxxxx2');
			window.sdkvoice.clearCache(filename);
			if(cc.sys.os == cc.sys.OS_ANDROID){
				jsb.reflection.callStaticMethod("com/voicesdk/VoiceRecorder", "prepare", "(Ljava/lang/String;)V",filename);
			} else if(cc.sys.os == cc.sys.OS_IOS){
				jsb.reflection.callStaticMethod("VoiceSDK", "prepareRecord:",filename);
			}
		};
		
		window.sdkvoice.release = function(){
			if(!cc.sys.isNative){
				return;
			}
			console.log('release xxxxxxxxxxxx1');
			cc.audioEngine.resumeAll();
			console.log('release xxxxxxxxxxxx2');
			if(cc.sys.os == cc.sys.OS_ANDROID){
				jsb.reflection.callStaticMethod("com/voicesdk/VoiceRecorder", "release", "()V");
			} else if(cc.sys.os == cc.sys.OS_IOS){
				jsb.reflection.callStaticMethod("VoiceSDK", "finishRecord");
			}
		};
		
		window.sdkvoice.cancel = function(){
			if(!cc.sys.isNative){
				return;
			}
			cc.audioEngine.resumeAll();
			if(cc.sys.os == cc.sys.OS_ANDROID){
				jsb.reflection.callStaticMethod("com/voicesdk/VoiceRecorder", "cancel", "()V");
			} else if(cc.sys.os == cc.sys.OS_IOS){
				jsb.reflection.callStaticMethod("VoiceSDK", "cancelRecord");
			}
		};

		window.sdkvoice.writeVoiceData = function(filename,voiceData){
			if(!cc.sys.isNative){
				return;
			}
			if(voiceData && voiceData.length > 0){
				var fileData = decode(voiceData);
				var url = mSDKVoiceMediaPath + filename;
				window.sdkvoice.clearCache(filename);
				var a = jsb.fileUtils.writeDataToFile(fileData ,url);
				console.log('writeVoiceData');
				console.log(url);
				console.log(a);
			}
		};

		window.sdkvoice.getVoiceData = function(filename){
			if(cc.sys.isNative){
				console.log('getVoiceData1');
				var url = mSDKVoiceMediaPath + filename;
				console.log('getVoiceData2');
				if(jsb.fileUtils.isFileExist(url)){
					console.log('getVoiceData3');
					var size = jsb.fileUtils.getFileSize(url);
					if( size > 0 ){
						console.log('getVoiceData4');
						var fileData = jsb.fileUtils.getDataFromFile(url);
						console.log('getVoiceData5');
						if(fileData){
							console.log('getVoiceData6');
							var content = encode(fileData);
							console.log('getVoiceData7');
							return content;
						}
					}
					console.log('getVoiceData8');
				}
			}
			console.log('getVoiceData9');
			return "";
		};

        window.sdkvoice.mineEncoede= function (url) {
            if (cc.sys.isNative) {
                var fileData = jsb.fileUtils.getDataFromFile(url);
                console.log('getVoiceData5');
                //if (fileData) {
                    console.log('getVoiceData6');
                //var content = encode(fileData);
                return fileData;
                  //  return content;
                //}
            }
            console.log('getVoiceData9');
            return [];
        };

        window.sdkvoice.mineDecoede = function (objdata) {
            if (cc.sys.isNative) {
                if (objdata != null) {
                    console.log('getData999999999999996');
                    var fileData = decode(objdata);
                    //test
                    var url = jsb.fileUtils.getWritablePath() + "headimg/" + "icon.jpg";
                    var a = jsb.fileUtils.writeDataToFile(fileData ,url);
                    console.log(a);
                    return url;
                }
            }
            console.log('getVoiceData9');
            return null;
        };


		window.sdkvoice.clearCache = function(filename){
			if(cc.sys.isNative){
				var url = mSDKVoiceMediaPath + filename;
				if(jsb.fileUtils.isFileExist(url)){
					jsb.fileUtils.removeFile(url);
				}
				if(jsb.fileUtils.isFileExist(url + ".wav")){
					jsb.fileUtils.removeFile(url + ".wav");
				}
			}
		};
		
		window.sdkvoice.play = function(filename){
			if(!cc.sys.isNative){
				return;
			}
			cc.audioEngine.pauseAll();
			var url = mSDKVoiceMediaPath + filename;
			console.log('play');
			console.log(url);
			if(cc.sys.os == cc.sys.OS_ANDROID){
				jsb.reflection.callStaticMethod("com/voicesdk/VoicePlayer", "play", "(Ljava/lang/String;)V",url); 
			} else if(cc.sys.os == cc.sys.OS_IOS){
				jsb.reflection.callStaticMethod("VoiceSDK", "play:",url);
			}
		};

		window.sdkvoice.stop = function(){
			if(!cc.sys.isNative){
				return;
			}
			cc.audioEngine.resumeAll();
			if(cc.sys.os == cc.sys.OS_ANDROID){
				jsb.reflection.callStaticMethod("com/voicesdk/VoicePlayer", "stop", "()V"); 
			} else if(cc.sys.os == cc.sys.OS_IOS){
				jsb.reflection.callStaticMethod("VoiceSDK", "stopPlay");
			}
		};
		
		window.sdkvoice.getVoiceLevel = function(maxLevel){
			return Math.floor(Math.random() * maxLevel + 1);
			if(cc.sys.os == cc.sys.OS_ANDROID){ 
				return jsb.reflection.callStaticMethod("com/voicesdk/VoiceRecorder", "getVoiceLevel", "(I)I",maxLevel);
			} else if(cc.sys.os == cc.sys.OS_IOS){

			} else {
				return Math.floor(Math.random() * maxLevel + 1);
			}
		};
	}
})()