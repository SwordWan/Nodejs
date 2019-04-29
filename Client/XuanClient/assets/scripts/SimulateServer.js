var GameUtil = require("GameUtil");
var ObserverMgr = require('ObserverMgr');
var CowCardMap = require("CowCardMap");

module.exports = {
    playerDataArr: [],

    // 用户准备
    OnUserReady() {
        var seats = cc.vv.gameNetMgr.seats; 
        for (var i = 1; i < seats.length; i++) {
            var index = cc.vv.gameNetMgr.getLocalIndex(seats[i].seatindex);
            var playerName = seats[i].name;
            var playerMoney = seats[i].score;
            var player = { pos: i, head: 1, name: playerName, money: playerMoney };
            ObserverMgr.dispatchMsg(GameLocalMsg.Cow.PlayerEnter, player);
        }

        //var beganPos = GameUtil.randomByMaxValue(5);// 随机一个庄家, 0代表自己
        //ObserverMgr.dispatchMsg(GameLocalMsg.Cow.PlayerEnterOver, beganPos);
        this.onSendPoker();
    },
    onSendPoker() {
        var arr = CowCardMap.getCardRandom();
        if (arr.length != 5) {
            return;
        }

        for (var i = 0; i < arr.length; i++) {
            this.playerDataArr.push({ pos: i, card: arr[i], bankMul: 0, doubleMul: 0 });
        }
        // 发前4张
        var card = [];
        for (var i = 0; i < 4; i++) {
            card.push(arr[0][i]);
        }
        ObserverMgr.dispatchMsg(GameLocalMsg.Cow.SimSendPoker, card);
    },
    _setPlayerBankMul(pos, mul) {
        for (var i = 0; i < this.playerDataArr.length; i++) {
            var item = this.playerDataArr[i];
            if (item.pos == pos) {
                item.bankMul = mul;
            }
        }
    },
    onUserRobBanker(bankerMul) {
        // 自己的倍率
        this._setPlayerBankMul(0, bankerMul);
        ObserverMgr.dispatchMsg(GameLocalMsg.Cow.SimUserRotBanker, { pos: 0, mul: bankerMul });
        // 随机其他玩家倍率
        for (var i = 1; i <= 4; i++) {
            var mul = GameUtil.randomByMaxValue(5);
            this._setPlayerBankMul(i, mul);
            ObserverMgr.dispatchMsg(GameLocalMsg.Cow.SimUserRotBanker, { pos: i, mul: mul });
        }
        // 从大到小排序
        // 确定庄家
        this.playerDataArr.sort(function (a, b) {
            return b.bankMul - a.bankMul;
        });
        var banker = this.playerDataArr[0].pos;
        ObserverMgr.dispatchMsg(GameLocalMsg.Cow.SimEnsureBanker, banker);
    },
    _setPlayerDoubleMul(pos, mul) {
        for (var i = 0; i < this.playerDataArr.length; i++) {
            var item = this.playerDataArr[i];
            if (item.pos == pos) {
                item.doubleMul = mul;
            }
        }
    },
    _getPlayerCard(pos) {
        for (var i = 0; i < this.playerDataArr.length; i++) {
            var item = this.playerDataArr[i];
            if (item.pos == pos) {
                return item.card;
            }
        }
        return null;
    },
    // 用户下注
    onUserDoubleMul(doubleMul) {
        this._setPlayerDoubleMul(0, doubleMul);
        ObserverMgr.dispatchMsg(GameLocalMsg.Cow.SimUserDoubleMul, { pos: 0, mul: doubleMul });

        var selfCardArr = this._getPlayerCard(0);
        if (selfCardArr != null) {
            var lastCard = selfCardArr[4];
            ObserverMgr.dispatchMsg(GameLocalMsg.Cow.SimSendLastCard, lastCard);
        }
        // 随机其他玩家倍率
        for (var i = 1; i <= 4; i++) {
            var mul = GameUtil.randomByMaxValue(5);
            this._setPlayerDoubleMul(i, mul);
            ObserverMgr.dispatchMsg(GameLocalMsg.Cow.SimUserDoubleMul, { pos: i, mul: mul });
        }

        // 其他玩家显示结果
        for (var i = 1; i <= 4; i++) {
            var card = this.playerDataArr[i].card;
            ObserverMgr.dispatchMsg(GameLocalMsg.Cow.SimUserShowPoker, { pos: i, card: card });
        }
    }
}
