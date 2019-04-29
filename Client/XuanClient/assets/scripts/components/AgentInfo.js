cc.Class({
    extends: cc.Component,

    properties: {
        Items: {
            default: [],
            type: cc.Node
        },
        _agentIds:[],
    },

    // use this for initialization
    onLoad: function () {

    },

    onEnable: function () {
        var self = this;
        for (var i = 0; i < this.Items.length; i++)
        {
            this.Items[i].active = false;
        }
        var onGetAgentCallBack = function (ret) {
            console.log(ret);
            console.log(ret);
            self.getAgentInfo(ret);
        };
        cc.vv.http.sendRequest("/getAgentInfo", { userId: cc.vv.userMgr.userId }, onGetAgentCallBack);
    },

    getAgentInfo(_data)
    {
        var self = this;
        var data = _data.agentIds;
        self._agentIds = _data.agentIds;
        for (var i = 0; i < data.length; i++)
        {
            var index = i;
            var id = data[i];
            self.initAgentInfo(index,id);
        }
    },

    initAgentInfo(index,data)
    {
        var self = this;
        var onInitCallBack = function (ret) {
            self.Items[index].active = true;
            self.Items[index].getChildByName("headicon").getComponent("ImageLoader").setUserID(data);
            self.Items[index].getChildByName("name").getComponent(cc.Label).string = ret.name;
        };
        cc.vv.http.sendRequest("/getUserInfo", { userId: data }, onInitCallBack);

    },

    OnAgentIconClick(event,arg)
    {
        cc.vv.gameNetMgr.currentProxyId = this._agentIds[arg];
        cc.find("Canvas/proxyRoom").active = true;
        this.closeframe();
    },


    closeframe()
    {
        this.node.active = false;
    },
});