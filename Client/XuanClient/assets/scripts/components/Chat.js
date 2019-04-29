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
        this._quickChatInfo["item0"] = { index: 0, content: "各位观众，我胡啦！", sound: "v1.mp3" };
        this._quickChatInfo["item1"] = { index: 1, content: "大胡一把!", sound: "v2.mp3" };
        this._quickChatInfo["item2"] = { index: 2, content: "哈哈，胡的就是你这张", sound: "v3.mp3" };
        this._quickChatInfo["item3"] = { index: 3, content: "你太牛啦！！", sound: "v4.mp3" };
        this._quickChatInfo["item4"] = { index: 4, content: "哈哈，手气真好！", sound: "v5.mp3" };
        this._quickChatInfo["item5"] = { index: 5, content: "快点出牌噢！", sound: "v6.mp3" };
        this._quickChatInfo["item6"] = { index: 6, content: "你放炮我不胡", sound: "v7.mp3" };
        this._quickChatInfo["item7"] = { index: 7, content: "你家里是开银行的吧！", sound: "v8.mp3" };
        this._quickChatInfo["item8"] = { index: 8, content: "不好意思，我要先走一步啦！", sound: "v9.mp3" };
        this._quickChatInfo["item9"] = { index: 9, content: "你的牌打的太好啦！", sound: "v10.mp3" };
        this._quickChatInfo["item10"] = { index: 10, content: "怎么又断线啦！网络怎么这么差呀！", sound: "v11.mp3" };
        this._quickChatInfo["item11"] = { index: 11, content: "杠上开花，胡", sound: "v12.mp3" };
       
 
        this._quickLocalChatInfo = {};
        this._quickLocalChatInfo["item0"] = { index: 0, content: " 这把肯定我胡的呢", sound: "fix_msg_1.mp3" };
        this._quickLocalChatInfo["item1"] = { index: 1, content: "搞毛生产，又点炮了", sound: "fix_msg_2.mp3" };
        this._quickLocalChatInfo["item2"] = { index: 2, content: "还给不给我打牌呢", sound: "fix_msg_3.mp3" };
        this._quickLocalChatInfo["item3"] = { index: 3, content: "莫瞎掰，打快点嘛", sound: "fix_msg_4.mp3" };
        this._quickLocalChatInfo["item4"] = { index: 4, content: "牌品好就是人品好", sound: "fix_msg_5.mp3" };
        this._quickLocalChatInfo["item5"] = { index: 5, content: "网络太差了", sound: "fix_msg_6.mp3" };
        this._quickLocalChatInfo["item6"] = { index: 6, content: "新手请多多关照", sound: "fix_msg_7.mp3" };
        this._quickLocalChatInfo["item7"] = { index: 7, content: "你太厉害了，放点水咯", sound: "fix_msg_8.mp3" };
        this._quickLocalChatInfo["item8"] = { index: 8, content: "你这样以后哪个和你耍", sound: "fix_msg_9.mp3" };
        this._quickLocalChatInfo["item9"] = { index: 9, content: "宁愿千刀万剐，不胡头一把", sound: "fix_msg_10.mp3" };
        this._quickLocalChatInfo["item10"] = { index: 10, content: "牌从门前过，不如摸一个", sound: "fix_msg_11.mp3" };
        this._quickLocalChatInfo["item11"] = { index: 11, content: "这个牌怎么打呢", sound: "fix_msg_12.mp3" };
        this._quickLocalChatInfo["item12"] = { index: 12, content: "上碰下自摸", sound: "fix_msg_13.mp3" };
        this._quickLocalChatInfo["item13"] = { index: 13, content: "输家不开口，赢家不给走啊", sound: "fix_msg_14.mp3" };
        this._quickLocalChatInfo["item14"] = { index: 14, content: "想要哪张，我打给你呗", sound: "fix_msg_15.mp3" };
        this._quickLocalChatInfo["item15"] = { index: 15, content: "只要手气好，卡隆都摸得到", sound: "fix_msg_16.mp3" };
        this._quickLocalChatInfo["item16"] = { index: 16, content: "罢梦啊，个个等到你", sound: "fix_msg_17.mp3" };
        this._quickLocalChatInfo["item17"] = { index: 17, content: "吃三比了，小心点咯", sound: "fix_msg_18.mp3" };
        this._quickLocalChatInfo["item18"] = { index: 18, content: "搞张牌来吃", sound: "fix_msg_19.mp3" };

        var self = this;
        if (cc.vv.gameNetMgr.conf.type == cc.vv.gameNetMgr.WANGBA_GAME || cc.vv.gameNetMgr.conf.type == cc.vv.gameNetMgr.QUAN_MJ) {
            this._chatRoot.getChildByName("quickchatlist").active = false;
            this._tabQuick = this._chatRoot.getChildByName("quickchatwangba");
            var chat2 = this._chatRoot.getChildByName("quickchatwangba");
            chat2.active = true;
            var parent = chat2.getChildByName("view").getChildByName("content");
            for (var i = 0; i < parent.children.length;i++)
            {
                parent.children[i].on('click', function (event) {
                    self.onQuickChatItemClicked2(event);
                });
            }

        } else {
            this._tabQuick = this._chatRoot.getChildByName("quickchatlist");
            this._chatRoot.getChildByName("quickchatwangba").active = false;
            var chat2 = this._chatRoot.getChildByName("quickchatlist");
            chat2.active = true;
            var parent = chat2.getChildByName("view").getChildByName("content");
            for (var i = 0; i < parent.children.length; i++) {
                parent.children[i].on('click', function (event) {
                    self.onQuickChatItemClicked(event);
                });
            }
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
