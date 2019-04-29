cc.Class({
    extends: cc.BaseClass,

    properties: {

    },

    ctor() {
        this.m_dicDiPi = [1, 2, 5, 10, 20, 50, 100];
        this.m_dicBring = [50, 100, 150, 200];
        this.m_dicTime = [30, 60, 120, 180, 240];
        this.m_dicContent = [this.m_dicDiPi, this.m_dicBring, this.m_dicTime]
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad() {
        this.m_toggleArr = [this._Rules, this._MinBring, this._Time];

        var callback = function (event) {
            var toggleCon = event.target.parent.getComponent(cc.ToggleContainer);
            for (var i in toggleCon.toggleItems) {
                toggleCon.toggleItems[i].node.getChildByName('label').color = new cc.Color(171, 171, 170);
            }
            event.target.getChildByName('label').color = new cc.Color(183, 160, 117);
        };

        for (var i in this.m_toggleArr) {
            var toggleCon = this.m_toggleArr[i].getComponent(cc.ToggleContainer);
            for (var i in toggleCon.toggleItems) {
                var toggle = toggleCon.toggleItems[i];
                toggle.node.on(cc.Node.EventType.TOUCH_END, callback, this);
                toggle.node.getChildByName('label').color = toggle.isChecked ? new cc.Color(183, 160, 117) : new cc.Color(171, 171, 170);
            }
        }
    },

    setLeagueID: function (ID) {
        this._leagueId = ID;
    },

    getSelect: function (Index) {
        var toggleCon = this.m_toggleArr[Index].getComponent(cc.ToggleContainer);
        for (var i in toggleCon.toggleItems) {
            if (toggleCon.toggleItems[i].isChecked) {
                return this.m_dicContent[Index][i];
            }
        }
    },

    onBtCreate: function () {
        var roomname = this._editName.$EditBox.string;
        if (roomname == "") {
            this.showAlert("请输入房间名称");
            return;
        }
        var clubid = this.m_Hook.m_nodeClubGameList.$ClubGameList.m_ClubID;
        var data = {
            iClubId: clubid,
            iGameId: 0,
            pRoomArgs: {
                szName: roomname,
                iBaseFen: this.getSelect(0),
                iMinFenE: this.getSelect(1),
                iMaxFenE: this.getSelect(1),
                bCtrlFenE: false,
                bOpenMG: true,
                iMaxMG: 6,
                iTimes: this.getSelect(2),
                bXiuZM: this._XiuMang.$CheckBox.checked,
                bOpenGPS: this._Cheat.$CheckBox.checked,
                bLinkM: this._QuanMang.$CheckBox.checked,
                bCanSP: false,
                iAutoStart: 4,
                iNoXDR: 0,
                iAllid: this._leagueId,
            }
        };
        cc.vv.socket.send("createroom", data);
    },

    // update (dt) {},
});