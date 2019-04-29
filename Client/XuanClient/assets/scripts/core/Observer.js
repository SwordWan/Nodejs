var ObserverMgr = require("ObserverMgr");
cc.Class({
    extends: cc.Component,

    _initMsg(){
        var list = this._getMsgList();
        for (var k = 0; k < list.length; k++) {
            var msg = list[k];
            ObserverMgr.addEventListener(msg, this._onMsg, this);
            ObserverMgr.addEventListener(GameErrorMsg.ErrorString, this._onErrorDeal, this);
            ObserverMgr.addEventListener(GlobalVar.SOCKET.OPEN, this._onNetOpen, this);
        }
    },
    onLoad(){
    },
    _getMsgList(){
        return [];
    },
    // [子类继承接口]消息返回
    _onMsg(msg, data){
        //var len = "error-".length;
        //msg = msg.substr(len, msg.length - len);
        //return msg;
    },
    // [子类继承接口]游戏内逻辑错误
    _onError(msg, code, data){

    },
    // [子类继承接口]网络 重新/第一次 打开
    _onNetOpen(){

    },

    //处理错误数据
    _onErrorDeal(errorMsgString, data){
        var msgString = data[0];
        var errorCode = data[1];
        var errorData = data[2];
        this._onError(msgString, errorCode, errorData);
    },
    onDisable(){

    },
    onDestroy(){
        ObserverMgr.removeEventListenerWithObject(this);
    },
});