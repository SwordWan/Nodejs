cc.Class({
    extends: cc.BaseClass,

    properties: {},

    setView: function (data) {
        for (var i in this._content.children) {
            this._content.children[i].active = false;
        }
        for (var i = 0; i < data.rows.length; i++) {
            var item = this._content.children[i] || cc.instantiate(this._content.children[0]);
            item.parent = this._content;
            var js = this.bindThor(item);

            js._user.$Label.string = data.rows[i].fromname;
            js._club.$Label.string = data.rows[i].toname;
            js._desc.$Label.string = data.rows[i].type == "1" ? "联盟" : "俱乐部";

            item.customData = {
                'uid': data.rows[i].uid,
                'msg': data.rows[i].desc,
                'type': data.rows[i].type
            }

            item.active = true;
        }
    },

    onBtAgree: function (event, data) {
        this.onBtSound();
        event.target.parent.active = false;
        var uid = event.target.parent.customData.uid;
        if (event.target.parent.customData.type == '1') {
            if (data == '1') {
                cc.vv.socket.send("approvealliance", {
                    uid: uid
                });
            } else {
                cc.vv.socket.send("refusedalliance", {
                    uid: uid
                });
            }
        } else {
            if (data == '1') {
                cc.vv.socket.send("approveclub", {
                    uid: uid
                });
            } else {
                cc.vv.socket.send("refuseclub", {
                    uid: uid
                });
            }
        }
    },

    // updateClub: function () {
    //     var cnt = 0;
    //     for (var i in this._content.children) {
    //         if (this._content.children[i].active) {
    //             cnt++;
    //         }
    //     }
    // }

});