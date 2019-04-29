//红桃2 方块2 红桃3 
//红桃4 方块4 黑桃4 梅花4
//黑桃5 梅花5 
//红桃6 方块6 黑桃6 梅花6 
//红桃7 方块7 黑桃7 梅花7 
//红桃8 方块8 黑桃8 梅花8 
//黑桃9 梅花9 
//红桃10 方块10 梅花10 黑桃10
//黑桃J 梅花J
//红桃Q 方块Q
//大王
let fs = require('fs');



let pai = [
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13,
    14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
    25, 26, 27, 28, 29, 30, 31, 32
];
//32 大王 3 红3
let dingerhuang = [
    [3, 32]
]

let dui = [
    [1, 2], [4, 5], [6, 7], [8, 9], [10, 11],
    [12, 13], [14, 15], [16, 17], [18, 19], [20, 21],
    [22, 23], [24, 25], [26, 27], [28, 29], [30, 31]
]
//天九王
//30 31 Q
//22 23 9
//天杠
//30 31 Q
//18 19 20 21 8点
//地杠
//1 2 2点
//18 19 20 21 8点

let tianjiuwang = [
    [22, 30], [22, 31], [23, 30], [23, 31],
    [18, 30], [19, 30], [20, 30], [21, 30], [18, 31], [19, 31], [20, 31], [21, 31],
    [1, 18], [1, 19], [1, 20], [1, 21], [2, 18], [2, 19], [2, 20], [2, 21],
]

//对Q最大，对2第二，红8第三，红4第4，黑4，黑6，黑10 第5 红6，红7，红10，黑J第6
//黑5，黑7，黑8，黑9第7
let duiLevel = {
    '3031': 7, '12': 6, '1819': 5, '45': 4, '67': 3, '1213': 3, '2627': 3,
    '1011': 2, '1415': 2, '2425': 2, '2829': 2, '89': 1, '1617': 1, '2021': 1, '2223': 1
}
let tianjiuwangLevel = {
    '2230': 3, '2231': 3, '2330': 3, '2331': 3,
    '1830': 2, '1930': 2, '2030': 2, '2130': 2,
    '1831': 2, '1931': 2, '2031': 2, '2131': 2,
    '118': 1, '119': 1, '120': 1, '121': 1,
    '218': 1, '219': 1, '220': 1, '221': 1
}
//
let dianLevel = {
    '1': 2, '2': 2, '3': 3, '4': 4, '5': 4, '6': 4, '7': 4, '8': 5,
    '9': 5, '10': 6, '11': 6, '12': 6, '13': 6, '14': 7,
    '15': 7, '16': 7, '17': 7, '18': 8, '19': 8, '20': 8, '21': 8, '22': 9, '23': 9,
    '24': 0, '25': 0, '26': 0, '27': 0, '28': 1, '29': 1, '30': 2, '31': 2, '32': 6
}
//
let paiLevel = {
    '32': 1, '3': 1, '8': 1, '16': 1, '17': 1, '20': 1, '21': 1, '22':1, '23': 1, '9': 1,
    '10': 2, '11': 2, '14': 2, '15': 2, '24': 2, '25': 2, '28': 2, '29': 2,
    '6': 3, '7': 3, '12': 3, '13': 3, '26': 3, '27': 3,
    '4': 4, '5': 4,
    '18': 5, '19': 5,
    '1': 6, '2': 6,
    '30': 7, '31': 7
}
let displayPai = {
    '1': '红桃2', '2': '方块2', '3': '红桃3',
    '4': '红桃4', '5': '方块4', '6': '黑桃4', '7': '梅花4',
    '8': '黑桃5', '9': '梅花5',
    '10': '红桃6', '11': '方块6', '12': '黑桃6', '13': '梅花6',
    '14': '红桃7', '15': '方块7', '16': '黑桃7', '17': '梅花7',
    '18': '红桃8', '19': '方块8', '20': '黑桃8', '21': '梅花8',
    '22': '黑桃9', '23': '梅花9',
    '24': '红桃10', '25': '方块10', '26': '梅花10', '27': '黑桃10',
    '28': '黑桃J', '29': '梅花J',
    '30': '红桃Q', '31': '方块Q',
    '32': '大王'
}

let paiXing = {
    TYPE_DingErHuang: 4,
    TYPE_Dui: 3,
    TYPE_TianJiuWang: 2,
    TYPE_Dian: 1
}

//生成AA类型
let aa = []
let aaMap = {};
for (let i = 0; i < pai.length; i++) {
    //console.log()
    let lv1 = pai[i];
    for (let j = 0; j < pai.length; j++) {
        let lv2 = pai[j];
        let tmp = [lv1, lv2];
        tmp.sort(function (a, b) {
            return a - b
        });
        let key = tmp.join('');
        if (undefined == aaMap[key]) {
            aaMap[key] = true;
            aa.push(tmp);
        }
    }
}

let mapOP = {};
//console.log('====================丁二皇======================');
for (let i = 0; i < dingerhuang.length; i++) {
    let o = dingerhuang[i];
    let k = o.join('');
    //console.log(displayPai[o[0]], displayPai[o[1]], k);
    mapOP[k] = {
        px: paiXing.TYPE_DingErHuang
    }
}
//console.log('====================对子======================');
for (let i = 0; i < dui.length; i++) {
    let o = dui[i];
    let k = o.join('');
    //console.log(displayPai[o[0]], displayPai[o[1]], k);
    mapOP[k] = {
        px: paiXing.TYPE_Dui
    }
}
//console.log('====================天九王======================');
for (let i = 0; i < tianjiuwang.length; i++) {
    let o = tianjiuwang[i];
    let k = o.join('');
    //console.log(displayPai[o[0]], displayPai[o[1]], k);
    mapOP[k] = {
        px: paiXing.TYPE_TianJiuWang
    }
}
//console.log('====================点子======================');
for (let i = 0; i < aa.length; i++) {
    let o = aa[i];
    let k = o.join('');
    if (undefined == mapOP[k]) {
        //console.log(displayPai[o[0]], displayPai[o[1]], k);
        mapOP[k] = {
            px: paiXing.TYPE_Dian
        }
    }

}


/*
112---方块Q 312---红桃Q 102---方块2 302---红桃2 108---方块8 308---红桃8 104---方块4 204---梅子4
304---红桃4 404---黑桃4 210---梅子10 410---黑桃10 206---梅子6 406---黑桃6 211---梅子J 411---黑桃J
110---方块10 310---红桃10 106---方块6 306---红桃6 107---方块7 307---红桃7 205---梅子5 405---黑桃5
207---梅子7 407---黑桃7 208---梅子8 408---黑桃8 209---梅子9 409---黑桃9 303---红桃3 2000---大王


let displayPai = {
    '1': '红桃2', '2': '方块2', '3': '红桃3',
    '4': '红桃4', '5': '方块4', '6': '黑桃4', '7': '梅花4',
    '8': '黑桃5', '9': '梅花5',
    '10': '红桃6', '11': '方块6', '12': '黑桃6', '13': '梅花6',
    '14': '红桃7', '15': '方块7', '16': '黑桃7', '17': '梅花7',
    '18': '红桃8', '19': '方块8', '20': '黑桃8', '21': '梅花8',
    '22': '黑桃9', '23': '梅花9',
    '24': '红桃10', '25': '方块10', '26': '梅花10', '27': '黑桃10',
    '28': '黑桃J', '29': '梅花J',
    '30': '红桃Q', '31': '方块Q',
    '32': '大王'
}

*/

var mapJiaozhu = {
    '112': 31, '312': 30, '102': 2, '302': 1, '108': 19, '308': 18,
    '104': 5, '204': 7, '304': 4, '404': 6, '210': 26, '410': 27,
    '206': 13, '406': 12, '211': 29, '411': 28, '110': 25, '310': 24,
    '106': 11, '306': 10, '107': 15, '307': 14, '205': 9, '405': 8,
    '207': 17, '407': 16, '208': 21, '408': 20, '209': 23, '409': 22,
    '303': 3, '2000': 32
}


function translate(pai) {
    let p0 = mapJiaozhu[pai[0]];
    let p1 = mapJiaozhu[pai[1]];
    if (p0 > p1) {
        return [p1, p0];
    }
    return [p0, p1];
}

function translateDian(pai) {
    let v1 = dianLevel[pai[0]];
    let v2 = dianLevel[pai[1]];
    return (v1 + v2) % 10;
}

function getMaxPaiValue(pai) {
    let t1 = paiLevel[pai[0]];
    let t2 = paiLevel[pai[1]];
    if (t1 > t2) {
        return t1;
    }
    return t2;
}

function debug(p1, p2, result, pai1, pai2) {
    let str = '相等';
    if (result == -1) {
        str = '左边大于右边';
    } else if (result == 1) {
        str = '右边大于左边';
    }

    // fs.appendFileSync('d:/1.txt', displayPai[p1[0]] + displayPai[p1[1]] + '与' + displayPai[p2[0]] + displayPai[p2[1]] + ' ' + str + ' ' + JSON.stringify({ p1: pai1, p2: pai2 }) + '\r\n')

    console.log(displayPai[p1[0]], displayPai[p1[1]], '与', displayPai[p2[0]], displayPai[p2[1]], str, JSON.stringify({ p1: pai1, p2: pai2 }));
}

//pai1大返回-1 pai2大返回1 相等返回0
function calc(pai1, pai2) {
    let p1 = translate(pai1);
    let p2 = translate(pai2);
    let k1 = p1.join('');
    let k2 = p2.join('');
    let o1 = mapOP[k1];
    let o2 = mapOP[k2];
    let result = 0;
    do {
        //先比较牌型
        if (o1.px > o2.px) {
            result = -1;
            break
        }
        if (o2.px > o1.px) {
            result = 1;
            break;
        }
        //到了这里肯定是相等的
        if (o1.px == paiXing.TYPE_TianJiuWang) {
            if (tianjiuwangLevel[k1] > tianjiuwangLevel[k2]) {
                result = -1;
            } else if (tianjiuwangLevel[k1] < tianjiuwangLevel[k2]) {
                result = 1;
            }
            break
        }
        if (o1.px == paiXing.TYPE_Dui) {
            if (duiLevel[k1] > duiLevel[k2]) {
                result = -1;
            } else if (duiLevel[k1] < duiLevel[k2]) {
                result = 1;
            }
            break
        }
        //点
        let v1 = translateDian(p1);
        let v2 = translateDian(p2);
        if (v1 > v2) {
            result = -1;
            break
        }
        if (v1 < v2) {
            result = 1;
            break
        }
        if (v1 == 0) {
            break;
        }
        v1 = getMaxPaiValue(p1);
        v2 = getMaxPaiValue(p2);
        if (v1 > v2) {
            result = -1;
            break;
        }
        if (v1 < v2) {
            result = 1;
            break;
        }
        break;
    } while (false);

    //debug(p1, p2, result, pai1, pai2);
    return result;
    //
}
exports.calc = calc;

// calc([204,205],[303,2000]);

// module.exports = {
//     calc: calc
// }
/*
112---方块Q 312---红桃Q 102---方块2 302---红桃2 108---方块8 308---红桃8 104---方块4 204---梅子4
304---红桃4 404---黑桃4 210---梅子10 410---黑桃10 206---梅子6 406---黑桃6 211---梅子J 411---黑桃J
110---方块10 310---红桃10 106---方块6 306---红桃6 107---方块7 307---红桃7 205---梅子5 405---黑桃5
207---梅子7 407---黑桃7 208---梅子8 408---黑桃8 209---梅子9 409---黑桃9 303---红桃3 2000---大王
*/
// let jiaozhuData = [
//     112, 312, 102, 302, 108, 308, 104, 204,
//     304, 404, 210, 410, 206, 406, 211, 411,
//     110, 310, 106, 306, 107, 307, 205, 405,
//     207, 407, 208, 408, 209, 409, 303, 2000
// ]

// let ceshiArray = [];
// for (let i = 0; i < jiaozhuData.length; i++) {
//     let index = i + 1;
//     for (let j = index; j < jiaozhuData.length; j++) {
//         let v1 = jiaozhuData[i];
//         let v2 = jiaozhuData[j];
//         ceshiArray.push([v1, v2]);
//     }
// }

// console.log(ceshiArray);
// let index = 0;
// if (fs.existsSync('d:/1.txt')) {
//     fs.unlinkSync('d:/1.txt');
// }

// for (let i = 0; i < ceshiArray.length; i++) {
//     let index = i + 1;
//     for (let j = index; j < ceshiArray.length; j++) {
//         calc(ceshiArray[index], ceshiArray[j]);
//     }
// }


