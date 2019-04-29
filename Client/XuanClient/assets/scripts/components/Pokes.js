

cc.Class({
    extends: cc.Component,

    properties: {
        Pokenodes: { default: [], type: cc.Node },
    },

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {},

    start () {

    },

    OnPokeClick: function (event, arg) {
        var eye = event.target.parent.getChildByName("showcard");
        if (cc.vv.xuangame._isFenPaiing) {
            return;
        }
      
        if (cc.vv.xuangame._JiesuanIng && !eye.active) {
            //var user = cc.vv.xuangame.getUserInfoByUserId(cc.vv.userMgr.userId);
            //console.log(user);
            //console.log(user.pPais);
            //var poke = user.pPais[parseInt(arg)];
            //console.log(poke);
            var data = {
                iRoomId: cc.vv.xuangame._curRoomId,
                iIndex: arg,
                iUserId: cc.vv.userMgr.userId,
                iPai: 0,
            }
            cc.vv.socket.send("kanpai", data);
            return;
        }
        
        eye.active = !eye.active;
        var mode = eye.active ? 1 : 0;
        var data = {
            iRoomId: cc.vv.xuangame._curRoomId,
            iIndex:arg,
            iShowMode: mode,
        }
        cc.vv.socket.send("showpai", data);
    },
    
    // update (dt) {},
});
