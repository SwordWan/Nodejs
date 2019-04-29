cc.Class({
    extends: cc.Component,

    properties: {
        // foo: {
        //    default: null,
        //    url: cc.Texture2D,  // optional, default is typeof default
        //    serializable: true, // optional, default is true
        //    visible: true,      // optional, default is true
        //    displayName: 'Foo', // optional
        //    readonly: false,    // optional, default is false
        // },
        // ...
        _chatRoot:null,
        _tabQuick:null,
        _tabEmoji:null,
        _iptChat:null,
        
        _quickChatInfo: null,
        _quickLocalChatInfo: null,
        _btnChat:null,
    },

    // use this for initialization
    onLoad: function () {
        if(cc.vv == null){
            return;
        }
        
        cc.vv.chat = this;
        
        this._btnChat = this.node.getChildByName("btn_chat");
        this._btnChat.active = cc.vv.replayMgr.isReplay() == false;
        
        this._chatRoot = this.node.getChildByName("chat");
        this._chatRoot.active = false;
        
       
        this._tabEmoji = this._chatRoot.getChildByName("emojis");
        
        this._iptChat = this._chatRoot.getChildByName("iptChat").getComponent(cc.EditBox);
        
       

        this._quickChatInfo = {};
        this._quickChatInfo["item0"] = { index: 0, content: "别跟我抢庄，小心玩死你们！", sound: "cow0.mp3" };
        this._quickChatInfo["item1"] = { index: 1, content: "喂，赶紧亮牌，别墨迹！", sound: "cow1.mp3" };
        this._quickChatInfo["item2"] = { index: 2, content: "搏一搏，单车变摩托。", sound: "cow2.mp3" };
        this._quickChatInfo["item3"] = { index: 3, content: "快点儿啊，我等到花儿都谢了！", sound: "cow3.mp3" };
        this._quickChatInfo["item4"] = { index: 4, content: "时间就是金钱，我的朋友。", sound: "cow4.mp3" };
        this._quickChatInfo["item5"] = { index: 5, content: "我是牛牛，我怕谁！", sound: "cow5.mp3" };
        this._quickChatInfo["item6"] = { index: 6, content: "大牛吃小牛，哈哈哈。", sound: "cow6.mp3" };
        this._quickChatInfo["item7"] = { index: 7, content: "有没有天理，有没有王法，这种牌也输？", sound: "cow7.mp3" };
        this._quickChatInfo["item8"] = { index: 8, content: "一点小钱，拿去喝茶吧。", sound: "cow8.mp3" };
       
        var self = this;
        this._tabQuick = this._chatRoot.getChildByName("quickchatlist");
        var chat2 = this._chatRoot.getChildByName("quickchatlist");
        chat2.active = true;
        var parent = chat2.getChildByName("view").getChildByName("content");
        for (var i = 0; i < parent.children.length; i++) {
            parent.children[i].on('click', function (event) {
                self.onQuickChatItemClicked(event);
            });
        }
    },
    
    getQuickChatInfo(index){
        var key = "item" + index;
        if (cc.vv.gameNetMgr.conf.type == cc.vv.gameNetMgr.WANGBA_GAME || cc.vv.gameNetMgr.conf.type == cc.vv.gameNetMgr.QUAN_MJ) {
            return this._quickLocalChatInfo[key];
        } else {
            return this._quickChatInfo[key];
        }
    },
    
    onBtnChatClicked:function(){
        this._chatRoot.active = true;
    },
    
    onBgClicked:function(){
        this._chatRoot.active = false;
    },
    
    onTabClicked:function(event){
        if(event.target.name == "tabQuick"){
            this._tabQuick.active = true;
            this._tabEmoji.active = false;
        }
        else if(event.target.name == "tabEmoji"){
            this._tabQuick.active = false;
            this._tabEmoji.active = true;
        }
    },
    
    onQuickChatItemClicked:function(event){
        this._chatRoot.active = false;
        var info = this._quickChatInfo[event.target.name];
        cc.vv.net.send("quick_chat",info.index); 
    },
    onQuickChatItemClicked2: function (event) {
        this._chatRoot.active = false;
        var info = this._quickLocalChatInfo[event.target.name];
        cc.vv.net.send("quick_chat", info.index);
    },
    
    onEmojiItemClicked:function(event){
        console.log(event.target.name);
        this._chatRoot.active = false;
        cc.vv.net.send("emoji",event.target.name);
    },
    
    onBtnSendChatClicked:function(){
        this._chatRoot.active = false;
        if(this._iptChat.string == ""){
            return;
        }
        cc.vv.net.send("chat",this._iptChat.string);
        this._iptChat.string = "";
    },

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
