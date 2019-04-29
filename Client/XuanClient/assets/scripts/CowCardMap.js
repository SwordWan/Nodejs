var GamePokerType = require('GamePokerType');
var GameUtil = require("GameUtil");

module.exports = {
    getServerID(point, suit){
        for (var k = 0; k < this.map.length; k++) {
            var item = this.map[k];
            if (item.point == point && item.suit == suit) {
                return item['serverID'];
            }
        }
        return -1;
    },
    getLocalID(point, suit){
        for (var k = 0; k < this.map.length; k++) {
            var item = this.map[k];
            if (item.point == point && item.suit == suit) {
                return item['localID'];
            }
        }
        return -1;
    },
    getLocalIDBySeverID(id){
        for (var k = 0; k < this.map.length; k++) {
            var item = this.map[k];
            if (item.serverID == id) {
                return item['localID'];
            }
        }
        return -1;
    },
    getDataByServerID(id){
        for (var k = 0; k < this.map.length; k++) {
            var item = this.map[k];
            if (item.serverID == id) {
                return item;
            }
        }
        return -1;
    },
    getCardRandom(){
        var cardArr = GameUtil.deepCopy(this.map);
        cardArr.sort(function (a, b) {
            return Math.random() > .5 ? -1 : 1;
        });

        var ret = [];
        for (var i = 0; i < 5; i++) {
            var item = [];
            for (var j = 0; j < 5; j++) {
                var index = i * 5 + j;
                item.push(cardArr[index].serverID);
            }
            ret.push(item);
        }
        return ret;
    },

    //Diamond: 1, // 方块(红)
    //Club: 2,    // 梅花(黑)
    //Heart: 3,   // 红桃
    //Spade: 4,   // 黑桃
    //SmallJoker: 5,  // 小王
    //BigJoker: 6,  // 大王

    map: [
        {serverID: 114, cowNum: 1, localID: 10, point: 1, suit: GamePokerType.PokerSuit.Diamond},
        {serverID: 214, cowNum: 1, localID: 11, point: 1, suit: GamePokerType.PokerSuit.Spade},
        {serverID: 314, cowNum: 1, localID: 12, point: 1, suit: GamePokerType.PokerSuit.Club},
        {serverID: 414, cowNum: 1, localID: 13, point: 1, suit: GamePokerType.PokerSuit.Heart},

        {serverID: 116, cowNum: 2, localID: 14, point: 2, suit: GamePokerType.PokerSuit.Diamond},
        {serverID: 216, cowNum: 2, localID: 15, point: 2, suit: GamePokerType.PokerSuit.Club},
        {serverID: 316, cowNum: 2, localID: 16, point: 2, suit: GamePokerType.PokerSuit.Heart},
        {serverID: 416, cowNum: 2, localID: 17, point: 2, suit: GamePokerType.PokerSuit.Spade},

        {serverID: 103, cowNum: 3, localID: 18, point: 3, suit: GamePokerType.PokerSuit.Diamond},
        {serverID: 203, cowNum: 3, localID: 19, point: 3, suit: GamePokerType.PokerSuit.Club},
        {serverID: 303, cowNum: 3, localID: 20, point: 3, suit: GamePokerType.PokerSuit.Heart},
        {serverID: 403, cowNum: 3, localID: 21, point: 3, suit: GamePokerType.PokerSuit.Spade},

        {serverID: 104, cowNum: 4, localID: 22, point: 4, suit: GamePokerType.PokerSuit.Diamond},
        {serverID: 204, cowNum: 4, localID: 23, point: 4, suit: GamePokerType.PokerSuit.Club},
        {serverID: 304, cowNum: 4, localID: 24, point: 4, suit: GamePokerType.PokerSuit.Heart},
        {serverID: 404, cowNum: 4, localID: 25, point: 4, suit: GamePokerType.PokerSuit.Spade},

        {serverID: 105, cowNum: 5, localID: 26, point: 5, suit: GamePokerType.PokerSuit.Diamond},
        {serverID: 205, cowNum: 5, localID: 27, point: 5, suit: GamePokerType.PokerSuit.Club},
        {serverID: 305, cowNum: 5, localID: 28, point: 5, suit: GamePokerType.PokerSuit.Heart},
        {serverID: 405, cowNum: 5, localID: 29, point: 5, suit: GamePokerType.PokerSuit.Spade},

        {serverID: 106, cowNum: 6, localID: 30, point: 6, suit: GamePokerType.PokerSuit.Diamond},
        {serverID: 206, cowNum: 6, localID: 31, point: 6, suit: GamePokerType.PokerSuit.Club},
        {serverID: 306, cowNum: 6, localID: 33, point: 6, suit: GamePokerType.PokerSuit.Heart},
        {serverID: 406, cowNum: 6, localID: 34, point: 6, suit: GamePokerType.PokerSuit.Spade},

        {serverID: 107, cowNum: 7, localID: 35, point: 7, suit: GamePokerType.PokerSuit.Diamond},
        {serverID: 207, cowNum: 7, localID: 36, point: 7, suit: GamePokerType.PokerSuit.Club},
        {serverID: 307, cowNum: 7, localID: 37, point: 7, suit: GamePokerType.PokerSuit.Heart},
        {serverID: 407, cowNum: 7, localID: 38, point: 7, suit: GamePokerType.PokerSuit.Spade},

        {serverID: 108, cowNum: 8, localID: 39, point: 8, suit: GamePokerType.PokerSuit.Diamond},
        {serverID: 208, cowNum: 8, localID: 40, point: 8, suit: GamePokerType.PokerSuit.Club},
        {serverID: 308, cowNum: 8, localID: 41, point: 8, suit: GamePokerType.PokerSuit.Heart},
        {serverID: 408, cowNum: 8, localID: 42, point: 8, suit: GamePokerType.PokerSuit.Spade},

        {serverID: 109, cowNum: 9, localID: 43, point: 9, suit: GamePokerType.PokerSuit.Diamond},
        {serverID: 209, cowNum: 9, localID: 44, point: 9, suit: GamePokerType.PokerSuit.Club},
        {serverID: 309, cowNum: 9, localID: 45, point: 9, suit: GamePokerType.PokerSuit.Heart},
        {serverID: 409, cowNum: 9, localID: 46, point: 9, suit: GamePokerType.PokerSuit.Spade},

        {serverID: 110, cowNum: 10, localID: 47, point: 10, suit: GamePokerType.PokerSuit.Diamond},
        {serverID: 210, cowNum: 10, localID: 48, point: 10, suit: GamePokerType.PokerSuit.Club},
        {serverID: 310, cowNum: 10, localID: 49, point: 10, suit: GamePokerType.PokerSuit.Heart},
        {serverID: 410, cowNum: 10, localID: 50, point: 10, suit: GamePokerType.PokerSuit.Spade},

        {serverID: 111, cowNum: 10, localID: 51, point: 11, suit: GamePokerType.PokerSuit.Diamond},
        {serverID: 211, cowNum: 10, localID: 52, point: 11, suit: GamePokerType.PokerSuit.Club},
        {serverID: 311, cowNum: 10, localID: 53, point: 11, suit: GamePokerType.PokerSuit.Heart},
        {serverID: 411, cowNum: 10, localID: 54, point: 11, suit: GamePokerType.PokerSuit.Spade},

        {serverID: 112, cowNum: 10, localID: 55, point: 12, suit: GamePokerType.PokerSuit.Diamond},
        {serverID: 212, cowNum: 10, localID: 56, point: 12, suit: GamePokerType.PokerSuit.Club},
        {serverID: 312, cowNum: 10, localID: 57, point: 12, suit: GamePokerType.PokerSuit.Heart},
        {serverID: 412, cowNum: 10, localID: 58, point: 12, suit: GamePokerType.PokerSuit.Spade},

        {serverID: 113, cowNum: 10, localID: 59, point: 13, suit: GamePokerType.PokerSuit.Diamond},
        {serverID: 213, cowNum: 10, localID: 60, point: 13, suit: GamePokerType.PokerSuit.Club},
        {serverID: 313, cowNum: 10, localID: 61, point: 13, suit: GamePokerType.PokerSuit.Heart},
        { serverID: 413, cowNum: 10, localID: 62, point: 13, suit: GamePokerType.PokerSuit.Spade },
        { serverID: 1000, cowNum: 100, localID: 100, point: -1 }, // 小王
        { serverID: 2000, cowNum: 200, localID: 200, point: -2 }, // 大王
    ]
}