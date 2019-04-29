// 丁皇 (红3 + 大王)
// 天牌 (一对红Q)
// 地牌 (一对红2)
// 人牌 (一对红8)
// 和牌 (一对红4)
// 梅十 (一对黑10) = 板凳 (一对黑4) = 长三 (一对黑6)
// 虎头 (一对黑J) = 苕十 (一对红10) = 猫猫 (一对红6) = 膏药 (一对红7)
// 对子 (一对黑5, 一对黑7, 一对黑8, 一对黑9)
// 奶狗 (红Q + 9)
// 天杠 (红Q + 8)
// 地杠 (红2 + 8)
// 天关九 (红Q + 7)
// 地关九 (红2 + 7)
// 灯笼九 (红8 + J)
// 和五九 (红4 + 5)
// 板五九 (黑4 + 5) = 丁长九 (红3 + 黑6) = 梅十九 (黑10 + 9)
// 丁猫九 (红3 + 红6) = 乌龙九 (黑8 + J) = 苕十九 (红10 + 9)
// 其他牌型（三花十:黑10 + 红10 + 黑J + 任一张牌; 三花六:黑6 + 红6 + 大王 + 任一张牌）拿到三花十或者三花六的牌，这局就不会输也不会赢，免费娱乐一盘

// 不符合以上牌型，按牌面点数相加的个位的点数比较，Q是2点，J是1点，大王是6点。 如遇到点数相同时，即以单张牌来判断大小：
// 红Q > 红2 > 红8 > 红4
// 黑10 = 黑4 = 黑6
// 黑J = 红10 = 红6 = 红7
// 黑5 = 黑7 = 黑8 = 黑9 = 红桃3 = 大王

var Poker = require("./Poker");


function IsSameVals(pVals1, pVals2) {
    return ((pVals1[0] == pVals2[0]) && (pVals1[1] == pVals2[1]));
}

// 返回 -1:iPai1 > iPai2,  0:iPai1 == iPai2,  1:iPai1 < iPai2
function CompareSinglePai(iPai1, iPai2) {
    var PAI_VALUES = [
        [112, 312], // 红 Q
        [102, 302], // 红 2
        [108, 308], // 红 8
        [104, 304], // 红 4
        [210, 410, 204, 404, 206, 406],              // 黑 10, 黑 4, 黑 6
        [211, 411, 110, 310, 106, 306, 107, 307],    // 黑 J, 红 10, 红 6, 红 7
        [205, 405, 207, 407, 208, 408, 209, 409, 303, 2000] // 黑 5, 黑 7, 黑 8, 黑 9, 红 3
    ];

    var pfnGetIndex = function (iPai) {
        var Result = -1;

        for (var iIndex = 0; iIndex < PAI_VALUES.length; ++iIndex) {
            var pPais = PAI_VALUES[iIndex];
            if (pPais.indexOf(iPai) >= 0) {
                Result = iIndex;
                break;
            }
        }

        return Result;
    }

    var iLeft = pfnGetIndex(iPai1);
    var iRight = pfnGetIndex(iPai2);

    if (iLeft < iRight) return -1;
    if (iLeft > iRight) return 1;
    return 0;
}

// 获取牌点子
function GetPaiPoint(iPai) {
    if (iPai == 2000) return 6;

    return iPai % 10;
}
exports.GetPaiPoint = GetPaiPoint;

// 获取单张牌信息
function GetPaiObj(iPai) {
    return {
        iPai: iPai,
        iPoint: iPai % 100,
        iColor: parseInt(iPai / 100)
    }
}

// 三花十或者三花六，不会输也不会赢
// 三花十 (黑10 + 红10 + 黑J + 任一张牌)
function IsKeySHS(pPais) {
    var bVal1 = false;
    var bVal2 = false;
    var bVal3 = false;

    for (var iIndex = 0; iIndex < pPais.length; ++iIndex) {
        var iPai = pPais[iIndex];
        if ((iPai == 210) || (iPai == 410)) bVal1 = true;   // 黑10
        if ((iPai == 110) || (iPai == 310)) bVal2 = true;   // 红10
        if ((iPai == 211) || (iPai == 411)) bVal3 = true;   // 黑J
    }
    
    return (bVal1 && bVal2 && bVal3);
}
exports.IsKeySHS = IsKeySHS;

// 三花六 (黑6 + 红6 + 大王 + 任一张牌)
function IsKeySHL(pPais) {
    var bVal1 = false;
    var bVal2 = false;
    var bVal3 = false;
    var bExistsR3 = false;  // 是否存在红3

    for (var iIndex = 0; iIndex < pPais.length; ++iIndex) {
        var iPai = pPais[iIndex];
        if ((iPai == 206) || (iPai == 406)) bVal1 = true;   // 黑6
        if ((iPai == 106) || (iPai == 306)) bVal2 = true;   // 红6
        if (iPai == 2000) bVal3 = true;                     // 大王
        if (iPai == 303) bExistsR3 = true;
    }
    if (!bExistsR3 && bVal1 && bVal2 && bVal3) return true;

    return false;
}
exports.IsKeySHL = IsKeySHL;

// 丁皇 (红桃3 + 大王)
function IsKey0(pPais) {
    if ((pPais[0] == 2000) && (pPais[1] == 303)) return true;
    if ((pPais[0] == 303) && (pPais[1] == 2000)) return true;
    
    return false;
}

// 天牌 (一对红Q)
function IsKey1(pPais) {
    if ((pPais[0] == 312) && (pPais[1] == 112)) return true;
    if ((pPais[0] == 112) && (pPais[1] == 312)) return true;

    return false;
}

// 地牌 (一对红2)
function IsKey2(pPais) {
    if ((pPais[0] == 302) && (pPais[1] == 102)) return true;
    if ((pPais[0] == 102) && (pPais[1] == 302)) return true;

    return false;
}

// 人牌 (一对红8)
function IsKey3(pPais) {
    if ((pPais[0] == 308) && (pPais[1] == 108)) return true;
    if ((pPais[0] == 108) && (pPais[1] == 308)) return true;

    return false;
}

// 和牌 (一对红4)
function IsKey4(pPais) {
    if ((pPais[0] == 304) && (pPais[1] == 104)) return true;
    if ((pPais[0] == 104) && (pPais[1] == 304)) return true;

    return false;
}

// 梅十 (一对黑10)
function IsKey5_1(pPais) {
    if ((pPais[0] == 410) && (pPais[1] == 210)) return true;
    if ((pPais[0] == 210) && (pPais[1] == 410)) return true;

    return false;
}

// 板凳 (一对黑4)
function IsKey5_2(pPais) {
    if ((pPais[0] == 404) && (pPais[1] == 204)) return true;
    if ((pPais[0] == 204) && (pPais[1] == 404)) return true;

    return false;
}

// 长三 (一对黑6)
function IsKey5_3(pPais) {
    if ((pPais[0] == 406) && (pPais[1] == 206)) return true;
    if ((pPais[0] == 206) && (pPais[1] == 406)) return true;

    return false;
}

// 虎头 (一对黑J)
function IsKey6_1(pPais) {
    if ((pPais[0] == 411) && (pPais[1] == 211)) return true;
    if ((pPais[0] == 211) && (pPais[1] == 411)) return true;

    return false;
}

// 苕十 (一对红10)
function IsKey6_2(pPais) {
    if ((pPais[0] == 310) && (pPais[1] == 110)) return true;
    if ((pPais[0] == 110) && (pPais[1] == 310)) return true;

    return false;
}

// 猫猫 (一对红6)
function IsKey6_3(pPais) {
    if ((pPais[0] == 306) && (pPais[1] == 106)) return true;
    if ((pPais[0] == 106) && (pPais[1] == 306)) return true;

    return false;
}

// 膏药 (一对红7)
function IsKey6_4(pPais) {
    if ((pPais[0] == 307) && (pPais[1] == 107)) return true;
    if ((pPais[0] == 107) && (pPais[1] == 307)) return true;

    return false;
}

// 一对黑5
function IsKey7_1(pPais) {
    if ((pPais[0] == 405) && (pPais[1] == 205)) return true;
    if ((pPais[0] == 205) && (pPais[1] == 405)) return true;

    return false;
}

// 一对黑7
function IsKey7_2(pPais) {
    if ((pPais[0] == 407) && (pPais[1] == 207)) return true;
    if ((pPais[0] == 207) && (pPais[1] == 407)) return true;

    return false;
}

// 一对黑8
function IsKey7_3(pPais) {
    if ((pPais[0] == 408) && (pPais[1] == 208)) return true;
    if ((pPais[0] == 208) && (pPais[1] == 408)) return true;

    return false;
}

// 一对黑9
function IsKey7_4(pPais) {
    if ((pPais[0] == 409) && (pPais[1] == 209)) return true;
    if ((pPais[0] == 209) && (pPais[1] == 409)) return true;

    return false; 
}

// 奶狗 (红Q + 9)
function IsKey8(pPais) {
    var pPaiObj1 = GetPaiObj(pPais[0]);
    var pPaiObj2 = GetPaiObj(pPais[1]);

    if ((pPaiObj1.iPoint == 12) && (pPaiObj2.iPoint == 9)) {
        return (pPaiObj1.iColor == 1) || (pPaiObj1.iColor == 3);
    }
    else if ((pPaiObj1.iPoint == 9) && (pPaiObj2.iPoint == 12)) {
        return (pPaiObj2.iColor == 1) || (pPaiObj2.iColor == 3);
    }

    return false;
}

// 天杠 (红Q + 8)
function IsKey9(pPais) {
    var pPaiObj1 = GetPaiObj(pPais[0]);
    var pPaiObj2 = GetPaiObj(pPais[1]);

    if ((pPaiObj1.iPoint == 12) && (pPaiObj2.iPoint == 8)) {
        return (pPaiObj1.iColor == 1) || (pPaiObj1.iColor == 3);
    }
    else if ((pPaiObj1.iPoint == 8) && (pPaiObj2.iPoint == 12)) {
        return (pPaiObj2.iColor == 1) || (pPaiObj2.iColor == 3);
    }

    return false;
}

// 地杠 (红2 + 8)
function IsKey10(pPais) {
    var pPaiObj1 = GetPaiObj(pPais[0]);
    var pPaiObj2 = GetPaiObj(pPais[1]);

    if ((pPaiObj1.iPoint == 2) && (pPaiObj2.iPoint == 8)) {
        return (pPaiObj1.iColor == 1) || (pPaiObj1.iColor == 3);
    }
    else if ((pPaiObj1.iPoint == 8) && (pPaiObj2.iPoint == 2)) {
        return (pPaiObj2.iColor == 1) || (pPaiObj2.iColor == 3);
    }

    return false;
}

// 天关九 (红Q + 7)
function IsKey11(pPais) {
    var pPaiObj1 = GetPaiObj(pPais[0]);
    var pPaiObj2 = GetPaiObj(pPais[1]);

    if ((pPaiObj1.iPoint == 12) && (pPaiObj2.iPoint == 7)) {
        return (pPaiObj1.iColor == 1) || (pPaiObj1.iColor == 3);
    }
    else if ((pPaiObj1.iPoint == 7) && (pPaiObj2.iPoint == 12)) {
        return (pPaiObj2.iColor == 1) || (pPaiObj2.iColor == 3);
    }

    return false;
}

// 地关九 (红2 + 7)
function IsKey12(pPais) {
    var pPaiObj1 = GetPaiObj(pPais[0]);
    var pPaiObj2 = GetPaiObj(pPais[1]);

    if ((pPaiObj1.iPoint == 2) && (pPaiObj2.iPoint == 7)) {
        return (pPaiObj1.iColor == 1) || (pPaiObj1.iColor == 3);
    }
    else if ((pPaiObj1.iPoint == 7) && (pPaiObj2.iPoint == 2)) {
        return (pPaiObj2.iColor == 1) || (pPaiObj2.iColor == 3);
    }

    return false;
}

// 灯笼九 (红8 + J)
function IsKey13(pPais) {
    var pPaiObj1 = GetPaiObj(pPais[0]);
    var pPaiObj2 = GetPaiObj(pPais[1]);

    if ((pPaiObj1.iPoint == 8) && (pPaiObj2.iPoint == 11)) {
        return (pPaiObj1.iColor == 1) || (pPaiObj1.iColor == 3);
    }
    else if ((pPaiObj1.iPoint == 11) && (pPaiObj2.iPoint == 8)) {
        return (pPaiObj2.iColor == 1) || (pPaiObj2.iColor == 3);
    }

    return false;
}

// 和五九 (红4 + 5)
function IsKey14(pPais) {
    var pPaiObj1 = GetPaiObj(pPais[0]);
    var pPaiObj2 = GetPaiObj(pPais[1]);

    if ((pPaiObj1.iPoint == 4) && (pPaiObj2.iPoint == 5)) {
        return (pPaiObj1.iColor == 1) || (pPaiObj1.iColor == 3);
    }
    else if ((pPaiObj1.iPoint == 5) && (pPaiObj2.iPoint == 4)) {
        return (pPaiObj2.iColor == 1) || (pPaiObj2.iColor == 3);
    }

    return false;
}

// 板五九 (黑4 + 5)
function IsKey15_1(pPais) { // 板五九
    var pPaiObj1 = GetPaiObj(pPais[0]);
    var pPaiObj2 = GetPaiObj(pPais[1]);

    if ((pPaiObj1.iPoint == 4) && (pPaiObj2.iPoint == 5)) {
        return (pPaiObj1.iColor == 2) || (pPaiObj1.iColor == 4);
    }
    else if ((pPaiObj1.iPoint == 5) && (pPaiObj2.iPoint == 4)) {
        return (pPaiObj2.iColor == 2) || (pPaiObj2.iColor == 4);
    }

    return false;
}

// 丁长九 (红3 + 黑6)
function IsKey15_2(pPais) {
    var pPaiObj1 = GetPaiObj(pPais[0]);
    var pPaiObj2 = GetPaiObj(pPais[1]);

    if ((pPaiObj1.iPoint == 3) && (pPaiObj2.iPoint == 6)) {
        return (pPaiObj1.iColor == 3) && ((pPaiObj2.iColor == 2) || (pPaiObj2.iColor == 4));
    }
    else if ((pPaiObj1.iPoint == 6) && (pPaiObj2.iPoint == 3)) {
        return (pPaiObj2.iColor == 3) && ((pPaiObj1.iColor == 2) || (pPaiObj1.iColor == 4));
    }

    return false;
}

// 梅十九 (黑10 + 9)
function IsKey15_3(pPais) {
    var pPaiObj1 = GetPaiObj(pPais[0]);
    var pPaiObj2 = GetPaiObj(pPais[1]);

    if ((pPaiObj1.iPai == 10) && (pPaiObj2.iPoint == 9)) {
        return (pPaiObj1.iColor == 2) || (pPaiObj1.iColor == 4);
    }
    else if ((pPaiObj1.iPoint == 9) && (pPaiObj2.iPai == 10)) {
        return (pPaiObj2.iColor == 2) || (pPaiObj2.iColor == 4);
    }

    return false;
}

// 丁猫九 (红3 + 红6)
function IsKey16_1(pPais) {
    var pPaiObj1 = GetPaiObj(pPais[0]);
    var pPaiObj2 = GetPaiObj(pPais[1]);

    if ((pPaiObj1.iPoint == 3) && (pPaiObj2.iPoint == 6)) {
        return (pPaiObj1.iColor == 3) && ((pPaiObj2.iColor == 1) || (pPaiObj2.iColor == 3));
    }
    else if ((pPaiObj1.iPoint == 6) && (pPaiObj2.iPoint == 3)) {
        return (pPaiObj2.iColor == 3) && ((pPaiObj1.iColor == 1) || (pPaiObj1.iColor == 3));
    }

    return false;
}

// 乌龙九 (黑8 + J)
function IsKey16_2(pPais) {
    var pPaiObj1 = GetPaiObj(pPais[0]);
    var pPaiObj2 = GetPaiObj(pPais[1]);

    if ((pPaiObj1.iPoint == 8) && (pPaiObj2.iPoint == 11)) {
        return (pPaiObj1.iColor == 2) || (pPaiObj1.iColor == 4);
    }
    else if ((pPaiObj1.iPoint == 11) && (pPaiObj2.iPoint == 8)) {
        return (pPaiObj2.iColor == 2) || (pPaiObj2.iColor == 4);
    }

    return false;
}

// 苕十九 (红10 + 9)
function IsKey16_3(pPais) {
    var pPaiObj1 = GetPaiObj(pPais[0]);
    var pPaiObj2 = GetPaiObj(pPais[1]);

    if ((pPaiObj1.iPai == 10) && (pPaiObj2.iPoint == 9)) {
        return (pPaiObj1.iColor == 1) || (pPaiObj1.iColor == 3);
    }
    else if ((pPaiObj1.iPoint == 9) && (pPaiObj2.iPai == 10)) {
        return (pPaiObj2.iColor == 1) || (pPaiObj2.iColor == 3);
    }

    return false;
}

// 点子大小比较 -1:pPais1 > pPais2, 0:pPais1 == pPais2, 1:pPais1 < pPais2
function ComparePoint(pPais1, pPais2) {
    var iVal1 = (GetPaiPoint(pPais1[0]) + GetPaiPoint(pPais1[1])) % 10;
    var iVal2 = (GetPaiPoint(pPais2[0]) + GetPaiPoint(pPais2[1])) % 10;

    if (iVal1 > iVal2) return -1;
    if (iVal1 < iVal2) return 1;
    return 0;
}

// 获取特殊牌型编码, 普通牌返回 null
function GetPaiCodeObj(pPais) {
    var Result = null;

    var pFuncPtrs = [
        { iKeyCode: 0, iPoint: 1000, szName: "丁二皇", pFuncPtr: IsKey0 },    // 丁皇(红3 + 大王)
        { iKeyCode: 1, iPoint: 999, szName: "天牌一对", pFuncPtr: IsKey1 },     // 天牌 (一对红Q)
        { iKeyCode: 2, iPoint: 998, szName: "地牌一对", pFuncPtr: IsKey2 },     // 地牌 (一对红2)
        { iKeyCode: 3, iPoint: 997, szName: "人牌一对", pFuncPtr: IsKey3 },     // 人牌 (一对红8)
        { iKeyCode: 4, iPoint: 996, szName: "和牌一对", pFuncPtr: IsKey4 },     // 和牌 (一对红4)

        { iKeyCode: 5, iPoint: 995, szName: "梅十一对", pFuncPtr: IsKey5_1 },   // 梅十 (一对黑10)
        { iKeyCode: 6, iPoint: 995, szName: "板凳一对", pFuncPtr: IsKey5_2 },   // 板凳 (一对黑4)
        { iKeyCode: 7, iPoint: 995, szName: "长三一对", pFuncPtr: IsKey5_3 },   // 长三 (一对黑6)

        { iKeyCode: 8, iPoint: 994, szName: "虎头一对", pFuncPtr: IsKey6_1 },   // 虎头 (一对黑J)
        { iKeyCode: 9, iPoint: 994, szName: "苕十一对", pFuncPtr: IsKey6_2 },   // 苕十 (一对红10)
        { iKeyCode: 10, iPoint: 994, szName: "猫猫一对", pFuncPtr: IsKey6_3 },  // 猫猫 (一对红6)
        { iKeyCode: 11, iPoint: 994, szName: "膏药一对", pFuncPtr: IsKey6_4 },  // 膏药 (一对红7)

        { iKeyCode: 12, iPoint: 993, szName: "黑5一对", pFuncPtr: IsKey7_1 },  // 一对黑5
        { iKeyCode: 13, iPoint: 993, szName: "黑7一对", pFuncPtr: IsKey7_2 },  // 一对黑7
        { iKeyCode: 14, iPoint: 993, szName: "黑8一对", pFuncPtr: IsKey7_3 },  // 一对黑8
        { iKeyCode: 15, iPoint: 993, szName: "黑9一对", pFuncPtr: IsKey7_4 },  // 一对黑9

        { iKeyCode: 16, iPoint: 992, szName: "天九王", pFuncPtr: IsKey8 },    // 奶狗 (红Q + 9)
        { iKeyCode: 17, iPoint: 991, szName: "天杠", pFuncPtr: IsKey9 },    // 天杠 (红Q + 8)
        { iKeyCode: 18, iPoint: 990, szName: "地杠", pFuncPtr: IsKey10 },   // 地杠 (红2 + 8)
        { iKeyCode: 19, iPoint: 989, szName: "天关九", pFuncPtr: IsKey11 },   // 天关九 (红Q + 7)
        { iKeyCode: 20, iPoint: 988, szName: "地关九", pFuncPtr: IsKey12 },   // 地关九 (红2 + 7)
        { iKeyCode: 21, iPoint: 987, szName: "灯笼九", pFuncPtr: IsKey13 },   // 灯笼九 (红8 + J)
        { iKeyCode: 22, iPoint: 986, szName: "和五九", pFuncPtr: IsKey14 },   // 和五九 (红4 + 5)

        { iKeyCode: 21, iPoint: 985, szName: "板五九", pFuncPtr: IsKey15_1 }, // 板五九 (黑4 + 5)
        { iKeyCode: 22, iPoint: 985, szName: "丁长九", pFuncPtr: IsKey15_2 }, // 丁长九 (红3 + 黑6)
        { iKeyCode: 23, iPoint: 985, szName: "梅十九", pFuncPtr: IsKey15_3 }, // 梅十九 (黑10 + 9)

        { iKeyCode: 24, iPoint: 984, szName: "丁猫九", pFuncPtr: IsKey16_1 }, // 丁猫九 (红3 + 红6)
        { iKeyCode: 25, iPoint: 984, szName: "乌龙九", pFuncPtr: IsKey16_2 }, // 乌龙九 (黑8 + J)
        { iKeyCode: 26, iPoint: 984, szName: "苕十九", pFuncPtr: IsKey16_3 }  // 苕十九 (红10 + 9)
    ];

    for (var iIndex = 0; iIndex < pFuncPtrs.length; ++iIndex) {
        var pItem = pFuncPtrs[iIndex];
        if (pItem.pFuncPtr(pPais)) {
            Result = {
                iCode: pItem.iKeyCode,
                iPoint: pItem.iPoint,
                szName: pItem.szName
            }
            break;
        }
    }

    return Result;
}
exports.GetPaiCodeObj = GetPaiCodeObj;

// 比较一组牌大小 -1:pPais1 > pPais2, 0:pPais1 == pPais2, 1:pPais1 < pPais2
function ComparePaiGroup(pPais1, pPais2) {
    function pfnCompare(left, right) {
        var iRet = CompareSinglePai(left, right);
        if (iRet == 0) {
            if (left > right) {
                iRet = -1;
            }
            else {
                iRet = 1;
            }
        }

        return iRet;
    }

    var pVals1 = pPais1.concat();
    var pVals2 = pPais2.concat();

    pVals1.sort(pfnCompare);
    pVals2.sort(pfnCompare);

    var pPaiObj1 = GetPaiCodeObj(pVals1);
    if (pPaiObj1 != null) {
        //console.log("ComparePaiGroup PAI A:" + JSON.stringify(pPaiObj1));
    }

    var pPaiObj2 = GetPaiCodeObj(pVals2);
    if (pPaiObj2 != null) {
        //console.log("ComparePaiGroup PAI B:" + JSON.stringify(pPaiObj2));
    }

    if ((pPaiObj1 != null) && (pPaiObj2 == null)) return -1;
    if ((pPaiObj1 == null) && (pPaiObj2 != null)) return 1;

    if ((pPaiObj1 != null) && (pPaiObj2 != null)) {
        if (pPaiObj1.iPoint > pPaiObj2.iPoint) return -1;
        if (pPaiObj1.iPoint < pPaiObj2.iPoint) return 1;
        
        // 单牌比较
        return CompareSinglePai(pPais1[0], pPais2[0]);
    }
    else {
        var iRet = ComparePoint(pPais1, pPais2);
        if (iRet != 0) return iRet;

        var iPoint = (GetPaiPoint(pPais1[0]) + GetPaiPoint(pPais1[1])) % 10;
        if (iPoint == 0) return 0;

        return CompareSinglePai(pVals1[0], pVals2[0]);
    }
}

// 返回 -1:iPai1 > iPai2,  0:iPai1 == iPai2,  1:iPai1 < iPai2
exports.ComparePai = CompareSinglePai;  // 单牌比较

// 返回 -1:pPais1 > pPais2, 0:pPais1 == pPais2, 1:pPais1 < pPais2
//exports.ComparePais = ComparePaiGroup;  // 比较一组牌大小
exports.ComparePais = Poker.calc;

// ComparePaiGroup([411, 108], [303, 2000]);

// 获取自动分牌后的数据
exports.GetSplitObj = function (pPais) {
    if (IsKeySHS(pPais)) return null;   // 三花十
    if (IsKeySHL(pPais)) return null;   // 三花六

    return {
        pPais1: [ pPais[0], pPais[1] ],
        pPais2: [ pPais[2], pPais[3] ]
    }
}

// 获取首尾牌
exports.GetPaiSW = function (pSplitObj) {
    var iRet = ComparePaiGroup(pSplitObj.pPais1, pSplitObj.pPais2);
    if (iRet == -1) {
        return {
            pPaisT: pSplitObj.pPais1.concat(),  // 头牌
            pPaisW: pSplitObj.pPais2.concat()   // 尾牌
        }
    }
    else {
        return {
            pPaisT: pSplitObj.pPais2.concat(),  // 头牌
            pPaisW: pSplitObj.pPais1.concat()   // 尾牌
        }
    }
}

// 判断3张牌是否有对子
exports.GetDZ = function (pPais) {
    for (var iPos1 = 0; iPos1 < pPais.length - 1; ++iPos1) {
        var iPai1 = pPais[iPos1];
        var pPaiObj1 = GetPaiObj(iPai1);

        for (var iPos2 = iPos1 + 1; iPos2 < pPais.length; ++iPos2) {
            var iPai2 = pPais[iPos2];
            var pPaiObj2 = GetPaiObj(iPai2);
            
            if (pPaiObj1.iPoint == pPaiObj2.iPoint) {
                if ((pPaiObj1.iColor == 1) && (pPaiObj2.iColor == 3)) return true;
                if ((pPaiObj1.iColor == 3) && (pPaiObj2.iColor == 1)) return true;

                if ((pPaiObj1.iColor == 2) && (pPaiObj2.iColor == 4)) return true;
                if ((pPaiObj1.iColor == 4) && (pPaiObj2.iColor == 2)) return true;
            }
        }
    }

    return false;
} 

// 判断是否是对子
exports.IsDZ = function (pPais) {
    var pPaiObj1 = GetPaiObj(pPais[0]);
    var pPaiObj2 = GetPaiObj(pPais[1]);

    if (pPaiObj1.iPoint == pPaiObj2.iPoint) {
        if ((pPaiObj1.iColor == 1) && (pPaiObj2.iColor == 3)) return true;
        if ((pPaiObj1.iColor == 3) && (pPaiObj2.iColor == 1)) return true;

        if ((pPaiObj1.iColor == 2) && (pPaiObj2.iColor == 4)) return true;
        if ((pPaiObj1.iColor == 4) && (pPaiObj2.iColor == 2)) return true;
    }

    return false;
}