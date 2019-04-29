module.exports = {
    // 格式化num为
    formatNum(num){
        num = parseInt(num.toString());
        var str = "";
        if (num > 100000000) {
            str = this.getNumBySplit(num / 100000000, 2) + '亿'
        } else if (num > 10000) {
            str = this.getNumBySplit(num / 10000, 2) + '万';
        } else {
            str = num.toString();
        }
        return str;
    },
    // 对象深拷贝
    deepCopy (obj) {
        var out = [], i = 0, len = obj.length;
        for (; i < len; i++) {
            if (obj[i] instanceof Array) {
                out[i] = this.deepCopy(obj[i]);
            }
            else out[i] = obj[i];
        }
        return out;
    },
    // 自动补0
    prefix(num, length) {
        return (Array(length).join('0') + num).slice(-length);
    },
    makeRdmStr: function (len) {
        len = len || 32;
        var $chars = 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678';
        /****默认去掉了容易混淆的字符oOLl,9gq,Vv,Uu,I1****/
        var maxPos = $chars.length;
        var pwd = '';
        for (var i = 0; i < len; i++) {
            pwd += $chars.charAt(Math.floor(Math.random() * maxPos));
        }
        return pwd;
    },
    getUnixTime: function () {
        var timestamp = Math.round(new Date().getTime() / 1000);
        return timestamp;
    },
    /**获得区间内的随机数
     * max - 期望的最大值
     * min - 期望的最小值*/
    random: function (min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    },
    // 返回[0,maxNum)的数值
    randomByMaxValue(maxNum){
        return Math.floor(Math.random() * maxNum);
    },
    /**获取中英混排字符串长度 */
    getStringLength: function (str) {
        var l = str.length;
        var blen = 0;
        for (var i = 0; i < l; i++) {
            if ((str.charCodeAt(i) & 0xff00) != 0) {
                blen++;
            }
            blen++;
        }
        return blen;
    },
    /**获取保留n位小数点的数字，不要四舍五入
     * target: 对象
     * keep: 保留几位小数 */
    getNumBySplit: function (target, keep) {
        let list = target.toString().split('.');
        let result;
        if (list[1]) {
            result = list[0] + '.' + list[1].substring(0, keep);
        } else {
            result = list[0];
        }
        return result;
    },
    destroyChildren(node){
        if (node) {
            if (node.destroyAllChildren) {
                // 1.5
                node.destroyAllChildren();
            } else {
                // 1.4
                var children = node.children;
                for (var k = 0; k < children.length; k++) {
                    children[k].destroy();
                }
            }
        }
    },

}