cc.Class({
    extends: cc.BaseClass,

    properties: {

    },

    ctor() {
        this.m_Item = new Array();
    },

    setView: function (data) {

        this._clubname.$Label.string = data.szClubName;

        for (var i in this.m_Item) {
            this.m_Item[i].active = false;
        }
        this.m_ClubID = data.iClubId;

        var add = this._content.children[0];
        if (data.clublevel < 2) {
            add.active = true;
            add.customData = {
                'allianceid': data.allianceid,
                'alliancename': data.alliancename,
                'alliancelevel': data.alliancelevel,
                'iClubId': data.iClubId
            }
        } else {
            add.active = false;
        }

        for (var i = 0; i < data.pRooms.length; i++) {
            var _info = data.pRooms[i];
            var item = this.m_Item[i] || cc.instantiate(this._content.children[1]);
            if (!this.m_Item[i]) this.m_Item.push(item);
            item.parent = this._content;
            var js = this.bindThor(item);

            js._head.$LoadImage.LoadClubIcon(_info.iClubId);
            js._roomname.$Label.string = _info.pRoomArgs.szName; // name
            js._score.$Label.string = _info.pRoomArgs.iBaseFen + "/" + (_info.pRoomArgs.iBaseFen * 2); //score
            js._user.$Label.string = _info.iPlayerCount + "/" + 8; //人数
            js._time.$Label.string = _info.iTimes + "/" + _info.iTimeLen; //当前时间/总时间
            js._gps.active = _info.pRoomArgs.bOpenGPS;
            js._run.$Label.string = _info.pRoomArgs.bRunning ? '进行中' : '等待中';
            js._full.active = _info.iPlayerCount == 8;
            js._empty.active = _info.iPlayerCount == 0;

            item.customData = {
                'iRoomId': _info.iRoomId,
                'iClubId': _info.iClubId
            }
            item.active = true;
        }
    },

    onBtCreatRoom: function () {
        cc.vv.socket.send("getprivileges", { iClubId: this._content.children[0].customData.iClubId });
    },

    onBtEnterRoom: function (event) {
        this.onBtSound();
        cc.vv.gameNetMgr._curClubId = event.target.customData.iClubId;
        this.m_Hook.ReEnterRoom(event.target.customData.iRoomId)
    },

    onBtClubInfo: function () {
        this.onBtSound();
        cc.vv.socket.send("getgclubinfo", { iClubId: this.m_ClubID });
    },





});