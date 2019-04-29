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
        target:cc.Node,
        spriteRAW:cc.SpriteFrame,
        checkedSpriteRAW:cc.SpriteFrame,
        checked:false,
        groupId:-1,
      //  GameRule:
      // {
        //    default:null,
        //    type:cc.Node,
      //  }
    },

    // use this for initialization
    onLoad: function () {
        if(cc.vv == null){
            return;
        }

        if (this.spriteRAW == null&&this.groupId!=31) {
            this.spriteRAW = new cc.SpriteFrame();
          
                this.spriteRAW.setTexture(cc.url.raw('resources/textures/setting/checkbox_void.png'));
            
        }
            if (this.checkedSpriteRAW == null) {
                this.checkedSpriteRAW = new cc.SpriteFrame();
                this.checkedSpriteRAW.setTexture(cc.url.raw('resources/textures/setting/checkbox_full.png'));
            }
        
        if(cc.vv.radiogroupmgr == null){
            var RadioGroupMgr = require("RadioGroupMgr");
            cc.vv.radiogroupmgr = new RadioGroupMgr();
            cc.vv.radiogroupmgr.init();
        }
        console.log(typeof(cc.vv.radiogroupmgr.add));
        cc.vv.radiogroupmgr.add(this);

        this.refresh();
    },
    
    refresh:function()
    {
        var targetSprite = this.target.getComponent(cc.Sprite);
        if(this.checked)
        {
            targetSprite.spriteFrame = this.checkedSpriteRAW;
        }
        else
        {
            targetSprite.spriteFrame = this.spriteRAW;
        }
        
    },
    
    check:function(value)
    {
        this.checked = value;
        this.refresh();

        //选择规则面板
//if (value) {
         //       this.GameRule.action = true;
         //   }
        //    else {
        //        this.GameRule.action = false;
       //     }
        
    },
    
    select:function(){
        cc.vv.radiogroupmgr.check(this);
    },
    
    onClicked:function(){
        cc.vv.radiogroupmgr.check(this);
    },

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
    
    onDestroy:function(){
        if(cc.vv && cc.vv.radiogroupmgr){
            cc.vv.radiogroupmgr.del(this);            
        }
    }
});
