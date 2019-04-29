
module.exports = {
    // 扑克牌花色 值和excel cardView 对应
    PokerSuit: {
        Diamond: 1, // 方块(红)
        Club: 2,    // 梅花(黑)
        Heart: 3,   // 红桃
        Spade: 4,   // 黑桃
        SmallJoker: 5,  // 小王
        BigJoker: 6,  // 大王
    },
    PokerSuitColor: {
        Red: 1,// 由excel cardView决定的
        Black: 2,//
    },
    getPokerSuitColor(suit){
        var color = 0;
        if (suit == this.PokerSuit.Diamond) {
            color = this.PokerSuitColor.Red;
        } else if (suit == this.PokerSuit.Club) {
            color = this.PokerSuitColor.Black;
        } else if (suit == this.PokerSuit.Heart) {
            color = this.PokerSuitColor.Red;
        } else if (suit == this.PokerSuit.Spade) {
            color = this.PokerSuitColor.Black;
        }
        return color;
    },
};