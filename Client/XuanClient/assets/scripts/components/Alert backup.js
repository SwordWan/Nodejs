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
        parent: { default: null, type: cc.Node },
        _alert: null,
        _btnOK: null,
        _btnCancel: null,
        _title: null,
        _content: null,
        _onok: null,
        _callBack:null,
    },

    // use this for initialization
    onLoad: function () {
        if (cc.vv == null) {
            return;
        }
        this._alert = this.node;
        //this._title = cc.find("Canvas/alert/title").getComponent(cc.Label);
        this.parent = this.node.children[0];
        this._content = this.parent.getChildByName("content").getComponent(cc.Label);

        this._btnOK = this.parent.getChildByName("btn_ok");//cc.find("Canvas/alert/btn_ok");
        //this._btnCancel = cc.find("Canvas/alert/btn_cancel");

        //cc.vv.utils.addClickEvent(this._btnOK, this.node, "Alert", "onBtnClicked");
        //cc.vv.utils.addClickEvent(this._btnCancel, this.node, "Alert", "onBtnClicked");

        //this._alert.active = false;
        cc.vv.alert = this;
    },

    //onBtnClicked: function (event) {
    //    if (event.target.name == "btn_ok") {
    //        if (this._onok) {
    //            this._onok();
    //        }
    //    }
    //    this._alert.active = false;
    //    this._onok = null;
    //},

    show: function (content) {
        // if(this._alert.active == true){
        //     r
        // }
        this._content.string = content;
        this.parent.active = true;
       
        //this._onok = onok;
        //this._title.string = title;
        //if (needcancel) {
        //    this._btnCancel.active = true;
        //    //this._btnOK.x = -150;
        //    //this._btnCancel.x = 150;
        //}
        //else {
        //    this._btnCancel.active = false;
        //    this._btnOK.x = 0;
        //}

       // console.log("xianshisssssssssssssssss");
    },

    confirm: function () {
        if (this._callBack != null) {
            this._callBack();
            this._callBack = null;
        }
        this.hide();
    },

    cancel: function () {
        this._callBack = null;
        this.hide();
    },



    hide: function ()
    {
        this.parent.active = false;
    },

    onDestory: function () {
        if (cc.vv) {
            cc.vv.alert = null;
        }
    }

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
