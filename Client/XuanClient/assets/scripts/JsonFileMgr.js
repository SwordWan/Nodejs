var JsonFileCfg = require('JsonFileCfg');
module.exports = {
    getCowCardImage(color, point){
        var cardViewData = JsonFileCfg.file.cowCardView.data;
        for (var k = 0; k < cardViewData.length; k++) {
            var item = cardViewData[k];
            var itemColor = item.color;
            var itemPoint = item.point;
            if (itemColor == color && itemPoint == point) {
                return item.pointPng;
            }
        }
        return null;
    },
    // 获取牌的花色图片
    getCardSuitImg(suit){
        var cardViewData = JsonFileCfg.file.cowCardView.data;
        for (var k = 0; k < cardViewData.length; k++) {
            var item = cardViewData[k];
            var itemSuit = item.suit;
            if (itemSuit == suit) {
                return item.pointPng;
            }
        }
        return null;
    },
}