module.exports = {
    obsArray: {},
    // 注册事件
    // func 为函数
    // ob 为作用域
    // todo 后续优先级的设计
    addEventListener: function (msg, func, ob) {
        var obs = this.obsArray[msg];
        if (typeof obs == "undefined") {
            this.obsArray[msg] = [];
        }
        //  当重复的事件重复回调注册时,不予注册 fixme 匿名函数还是会重复注册
        for (var k = 0; k < this.obsArray[msg].length; k++) {
            var item = this.obsArray[msg][k];
            if (item['func'] == func &&
                item['ob'] == ob) {
                //console.log("重复注册" + msg + ":" + func);
                return;
            }
        }
        this.obsArray[msg].push({func: func, ob: ob});
    },
    // 取消注册事件
    removeEventListener: function (msg, func, ob) {
        var b = false;
        var msgCBArray = this.obsArray[msg];
        if (msgCBArray) {
            for (var i = 0; i < msgCBArray.length;) {
                var msgCBItem = msgCBArray[i];
                var itemFunc = msgCBItem['func'];
                var itemOb = msgCBItem['ob'];
                if (func == itemFunc && ob == itemOb) {// 从消息队列里面移除msg回调
                    msgCBArray.splice(i, 1);
                    b = true;
                } else {
                    i++;
                }
            }
        }
        return b;
    },
    // 移除该作用域的所有事件
    removeEventListenerWithObject: function (ob) {
        for (var k in this.obsArray) {// [msg:[{func:func, ob:ob}]]
            var msgCBArray = this.obsArray[k]; // [{func: func, ob: ob}]
            for (var i = 0; i < msgCBArray.length;) {
                // {func: func, ob: ob}
                var msgCBItem = msgCBArray[i];
                if (msgCBItem['ob'] == ob) {
                    msgCBArray.splice(i, 1);
                } else {
                    i++;
                }
            }
        }
    },
    // todo 清除所有的消息注册
    cleanAllEventListener(){
        this.obsArray = {};
    },
    dispatchMsg: function (msg, data) {
        var obs = this.obsArray[msg];
        if (typeof obs != "undefined") {
            for (var k = 0; k < obs.length; k++) {
                var item = obs[k];
                var func = item['func'];
                var ob = item['ob'];
                if (func && ob) {
                    //call必须是object
                    //apply必须是array
                    func.apply(ob, [msg, data]);
                }
            }
        } else {
            console.log("消息列表中不存在: " + msg);
        }
    },
}