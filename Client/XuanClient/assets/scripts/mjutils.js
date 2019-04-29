
cc.Class({
    extends: cc.Component,

    properties: {
        MJ_MIN_PAI_VAL:0,    // 麻将牌最小值
        MJ_MAX_PAI_VAL : 26,    // 麻将牌最大值

        //MJ_PAI_TYPE_TONG : 0,   // 筒
        //MJ_PAI_TYPE_TIAO : 1,  // 条
        //MJ_PAI_TYPE_WAN : 2,    // 万
        //MJ_PAI_TYPE_FENG : 3,   // 字

        MJ_PAI_VAL_D : 28,  // 东
        MJ_PAI_VAL_L : 29,  // 南
        MJ_PAI_VAL_X : 30,  // 西
        MJ_PAI_VAL_B : 31,  // 北

        MJ_PAI_VAL_ZHONG : 32, // 中
        MJ_PAI_VAL_FA : 33,     // 发
        MJ_PAI_VAL_BAI : 34,    // 白

        //// 麻将牌类型
        //MahjongPaiTypes : {
        //    MJ_PAI_TYPE_TONG: 0,
        //    MJ_PAI_TYPE_TIAO: 1,
        //    MJ_PAI_TYPE_WAN: 2,
        //    MJ_PAI_TYPE_FENG: 3
        //},
    },

    // 获取牌类型
    getMJType: function (iPai) {
        var Result = -1;

        if (iPai >= 0 && iPai < 9) {        // 筒
            Result = 0;
        }
        else if (iPai >= 9 && iPai < 18) {  // 条
            Result = 1;
        }
        else if (iPai >= 18 && iPai < 27) { // 万
            Result = 2;
        }
        else if (iPai >= 28 && iPai < 35) { // 风(东，南，西，北，中，发，白)
            Result = 3;
        }

        return Result;
    },

    // 生成筒子
    mjGenB: function (iVal) {
        var Result = -1;

        if (iVal >= 1 && iVal <= 9) {
            Result = iVal - 1;
        }

        return Result;
    },

    // 生成条子
    mjGenT: function (iVal) {
        var Result = -1;

        if (iVal >= 1 && iVal <= 9) {
            Result = iVal + 8;
        }

        return Result;
    },

    // 生成万子
    mjGenW: function (iVal) {
        var Result = -1;

        if (iVal >= 1 && iVal <= 9) {
            Result = iVal + 17;
        }

        return Result;
    },

    // 升序方式排序
    mjSortPais: function (pPais) {
        pPais.sort(
            function (left, right) {
                if (left > right) return 1;
                else return -1;
            }
        );
    },

    // iPai2 > iPai1
    mjIsAB: function (iPai1, iPai2) {
        var Result = false;
        var iPaiType = this.getMJType(iPai1);

        switch (iPaiType) {
            case MJ_PAI_TYPE_TONG:
            case MJ_PAI_TYPE_TIAO:
            case MJ_PAI_TYPE_WAN:
                if (iPaiType == this.getMJType(iPai2)) {
                    if (iPai2 - iPai1 == 1) {
                        Result = true;
                    }
                }
                break;
        }

        return Result;
    },

    // iPai3 > iPai2 > iPai1
    mjIsABC: function (iPai1, iPai2, iPai3) {
        var Result = false;
        var iPaiType = this.getMJType(iPai1);

        switch (iPaiType) {
            case MJ_PAI_TYPE_TONG:
            case MJ_PAI_TYPE_TIAO:
            case MJ_PAI_TYPE_WAN:
                if ((iPaiType == this.getMJType(iPai2)) && (iPaiType == this.getMJType(iPai3))) {
                    if ((iPai2 - iPai1 == 1) && (iPai3 - iPai2 == 1)) {
                        Result = true;
                    }
                }
                break;
        }

        return Result;
    },

    mjIsAA: function (iPai1, iPai2) {
        return (iPai1 == iPai2);
    },

    mjIsAAA: function (iPai1, iPai2, iPai3) {
        return (iPai1 == iPai2) && (iPai3 == iPai2);
    },

    mjIsAAAA: function (iPai1, iPai2, iPai3, iPai4) {
        return (iPai1 == iPai2) && (iPai3 == iPai2) && (iPai4 == iPai3);
    },

    mjGet4ANum: function (pPais) {
        var Result = 0;

        var iIndex = 0;
        var iCount = pPais.length - 3;

        while (iIndex < iCount) {
            if (this.mjIsAAAA(pPais[iIndex], pPais[iIndex + 1], pPais[iIndex + 2], pPais[iIndex + 3])) {
                ++Result;
                iIndex += 4;
            }
            else {
                ++iIndex;
            }
        }

        return Result;
    },

    mjAdd2A: function (pPais, iPai) {
        pPais.push(iPai, iPai);

        this.mjSortPais(pPais);
    },

    mjAdd3A: function (pPais, iPai) {
        pPais.push(iPai, iPai, iPai);

        this.mjSortPais(pPais);
    },

    mjDelete: function (pPais, iPai) {
        var iPos = pPais.indexOf(iPai);
        if (iPos >= 0) {
            pPais.splice(iPos, 1);
            //mjSortPais(pPais);
        }
    },

    mjDelete2A: function (pPais, iPai) {
        var iPos = pPais.indexOf(iPai);
        if (iPos >= 0) {
            pPais.splice(iPos, 1);
        }

        iPos = pPais.indexOf(iPai);
        if (iPos >= 0) {
            pPais.splice(iPos, 1);
        }

        //mjSortPais(pPais);
    },

    mjDelete3A: function (pPais, iPai) {
        var iPos = pPais.indexOf(iPai);
        if (iPos >= 0) {
            pPais.splice(iPos, 1);
        }

        iPos = pPais.indexOf(iPai);
        if (iPos >= 0) {
            pPais.splice(iPos, 1);
        }

        iPos = pPais.indexOf(iPai);
        if (iPos >= 0) {
            pPais.splice(iPos, 1);
        }

        //mjSortPais(pPais);
    },

    // 全是 ABC 牌
    mjIsAllPaiABC: function (pPais) {
        var Result = false;

        var iPais = pPais.slice();
        var iCount = iPais.length;

        if (iCount > 0 && iCount % 3 == 0) {
            for (var iIndex = iPais.length - 1; iIndex >= 0; --iIndex) {
                if (iPais[iIndex] > 27) {
                    return false;
                }
            }

            while (true) {
                var bExists = false;
                for (var iPos1 = 0; iPos1 <= iCount - 1 - 2; ++iPos1) {
                    for (var iPos2 = iPos1 + 1; iPos2 <= iCount - 1 - 1; ++iPos2) {
                        if (this.mjIsAB(iPais[iPos1], iPais[iPos2])) {
                            for (var iPos3 = iPos2 + 1; iPos3 <= iCount - 1; ++iPos3) {
                                if (this.mjIsABC(iPais[iPos1], iPais[iPos2], iPais[iPos3])) {
                                    this.mjDelete(iPais, iPais[iPos3]);
                                    this.mjDelete(iPais, iPais[iPos2]);
                                    this.mjDelete(iPais, iPais[iPos1]);

                                    iCount -= 3;
                                    bExists = true;
                                    break;
                                }
                            }
                            if (bExists) break;
                        }
                    }
                    if (bExists) break;
                }

                if (!bExists) break;    // 手上的牌不能完全组成顺子

                if (iCount == 0) {
                    Result = true;
                    break;
                }
            }
        }

        return Result;
    },

    // 全是 AAA 牌
    mjIsAllPaiAAA: function (pPais) {
        var Result = false;

        if ((pPais.length > 0) && (pPais.length % 3 == 0)) {
            Result = true;
            for (var iIndex = 0; iIndex < pPais.length; iIndex += 3) {
                if (!this.mjIsAAA(pPais[iIndex], pPais[iIndex + 1], pPais[iIndex + 2])) {
                    Result = false;
                    break;
                }
            }
        }

        return Result;
    },

    // 是否全是 ABC 或 AAA 组合
    mjIsAll_AAAorABC: function (pPais) {
        var Result = false;
        var iIndex = 0;
        var iPais3A = [];

        // 递归删除 3A 牌组合，再判断剩下的牌是全是 ABC 牌
        var funDel3A_FindABC = function (pPais, pPais3A, iPos) {
            var Result = false;

            while (iPos < pPais3A.length) {
                this.mjDelete3A(pPais, pPais3A[iPos]);

                Result = this.mjIsAllPaiABC(pPais);
                if (!Result) {
                    Result = funDel3A_FindABC(pPais, pPais3A, iPos + 1);
                }

                this.mjAdd3A(pPais, pPais3A[iPos]);
                //mjSortPais(pPais);

                if (Result) break;

                ++iPos;
            }

            return Result;
        }

        if ((pPais.length > 0) && (pPais.length % 3 == 0)) {
            while (iIndex < pPais.length - 2) {
                if (this.mjIsAAA(pPais[iIndex], pPais[iIndex + 1], pPais[iIndex + 2])) {
                    iPais3A.push(pPais[iIndex]);
                    iIndex += 2;
                }
                ++iIndex;
            }

            if ((iPais3A.length * 3) == pPais.length) {
                Result = true;
            }
            else {
                var iPos = 0;
                if (iPais3A.length == 0) {
                    Result = this.mjIsAllPaiABC(pPais, iPais3A, iPos);
                }
                else {
                    Result = funDel3A_FindABC(pPais, iPais3A, iPos);
                }
            }
        }

        return Result;
    },




    // 快速麻将牌算法
    mjFastDelete2A: function (pPais, iPai) {
        var iPos = pPais.indexOf(iPai);
        pPais.splice(iPos, 2);
        return iPos;
    },

    mjFastDelete3A: function (pPais, iPai) {
        var iPos = pPais.indexOf(iPai);
        pPais.splice(iPos, 3);
        return iPos;
    },

    mjFastAdd2A: function (pPais, iPos, iPai) {
        pPais.splice(iPos, 0, iPai, iPai);
    },

    mjFastAdd3A: function (pPais, iPos, iPai) {
        pPais.splice(iPos, 0, iPai, iPai, iPai);
    },

    mjFastIsAll_ABC: function (pPais) {
        var iNumMaps = [
            0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0
        ];

        var iPai = -1;
        var iIndex = 0;

        while (iIndex < pPais.length) {
            iPai = pPais[iIndex];
            ++iNumMaps[iPai];
            ++iIndex;
        }

        iIndex = 0;
        while (iIndex < 9 - 2) {
            if (iNumMaps[iIndex] > 0) {
                if ((iNumMaps[iIndex] > iNumMaps[iIndex + 1]) || (iNumMaps[iIndex] > iNumMaps[iIndex + 2])) {
                    return false;
                }

                iNumMaps[iIndex + 1] -= iNumMaps[iIndex];
                iNumMaps[iIndex + 2] -= iNumMaps[iIndex];
                iNumMaps[iIndex] = 0;
            }

            ++iIndex;
        }
        if ((iNumMaps[iIndex] > 0) || (iNumMaps[iIndex + 1] > 0)) return false;

        iIndex = 9;
        while (iIndex < 18 - 2) {
            if (iNumMaps[iIndex] > 0) {
                if ((iNumMaps[iIndex] > iNumMaps[iIndex + 1]) || (iNumMaps[iIndex] > iNumMaps[iIndex + 2])) {
                    return false;
                }

                iNumMaps[iIndex + 1] -= iNumMaps[iIndex];
                iNumMaps[iIndex + 2] -= iNumMaps[iIndex];
                iNumMaps[iIndex] = 0;
            }

            ++iIndex;
        }
        if ((iNumMaps[iIndex] > 0) || (iNumMaps[iIndex + 1] > 0)) return false;

        iIndex = 18;
        while (iIndex < 27 - 2) {
            if (iNumMaps[iIndex] > 0) {
                if ((iNumMaps[iIndex] > iNumMaps[iIndex + 1]) || (iNumMaps[iIndex] > iNumMaps[iIndex + 2])) {
                    return false;
                }

                iNumMaps[iIndex + 1] -= iNumMaps[iIndex];
                iNumMaps[iIndex + 2] -= iNumMaps[iIndex];
                iNumMaps[iIndex] = 0;
            }

            ++iIndex;
        }
        if ((iNumMaps[iIndex] > 0) || (iNumMaps[iIndex + 1] > 0)) return false;

        return true;
    },

    mjFastIsAll_AAAorABC: function (pPais) {
        var Result = false;
        var iIndex = 0;
        var iPais3A = [];

        // 递归删除 3A 牌组合，再判断剩下的牌是全是 ABC 牌
        var funDel3A_FindABC = function (pPais, pPais3A, iPos) {
            var Result = false;

            while (iPos < pPais3A.length) {
                var iDelPos = this.mjFastDelete3A(pPais, pPais3A[iPos]);

                Result = this.mjIsAllPaiABC(pPais);
                if (!Result) {
                    Result = funDel3A_FindABC(pPais, pPais3A, iPos + 1);
                }

                this.mjFastAdd3A(pPais, iDelPos, pPais3A[iPos]);
                if (Result) break;

                ++iPos;
            }

            return Result;
        }

    if ((pPais.length > 0) && (pPais.length % 3 == 0)) {
            while (iIndex < pPais.length - 2) {
                if (this.mjIsAAA(pPais[iIndex], pPais[iIndex + 1], pPais[iIndex + 2])) {
                    iPais3A.push(pPais[iIndex]);
                    iIndex += 2;
                }
                ++iIndex;
            }

            if ((iPais3A.length * 3) == pPais.length) {
                Result = true;
            }
            else {
                var iPos = 0;
                if (iPais3A.length == 0) {
                    Result = this.mjIsAllPaiABC(pPais, iPais3A, iPos);
                }
                else {
                    Result = funDel3A_FindABC(pPais, iPais3A, iPos);
                }
            }
        }

        return Result;
    },

    // 将一组牌分解成筒条万字分开存放
    //var pPaiInfo = {
    //    "0": [], // 筒 0..8
    //    "1": [], // 条 9..17
    //    "2": [], // 万 18..26
    //    "3": [], // 字 28..35
    //};
    funcGetPaiInfo: function (pPais, pPaiInfo) {
        for (var iIndex = 0; iIndex < pPais.length; ++iIndex) {
            var iPai = pPais[iIndex];
            var sKey = this.getMJType(iPai);

            pPaiInfo[sKey].push(iPai);
        }
    },

    // 是否全是 ABC,AAA 牌型
    // 返回 0:失败, 1:全是 AAA 牌, 2:全是 ABC 牌, 3:ABC 与 AAA 都有
    funcIsCombination: function (pPais) {
        var Result = 0;
        var iIndex = 0;
        var iPais3A = [];

        // 递归删除 3A 牌组合，再判断剩下的牌是全是 ABC 牌
       var funDel3A_FindABC = function (pPais, pPais3A, iPos) {
            var Result = false;

            while (iPos < pPais3A.length) {
                var iDelPos = pPais.indexOf(pPais3A[iPos]);
                pPais.splice(iDelPos, 3);

                Result = this.mjFastIsAll_ABC(pPais);    // mjIsAllPaiABC(pPais);
                if (!Result) {
                    Result = funDel3A_FindABC(pPais, pPais3A, iPos + 1);
                }

                pPais.splice(iDelPos, 0, pPais3A[iPos], pPais3A[iPos], pPais3A[iPos]);
                if (Result) break;

                ++iPos;
            }

            return Result;
        }

        if ((pPais.length > 0) && (pPais.length % 3 == 0)) {
            while (iIndex < pPais.length - 2) {
                if (this.mjIsAAA(pPais[iIndex], pPais[iIndex + 1], pPais[iIndex + 2])) {
                    iPais3A.push(pPais[iIndex]);
                    iIndex += 2;
                }
                ++iIndex;
            }

            if ((iPais3A.length * 3) == pPais.length) {
                Result = 1;
            }
            else {
                var bRet = this.mjFastIsAll_ABC(pPais);  //mjIsAllPaiABC(pPais);
                if (bRet) {
                    Result = 2;
                }
                else {
                    var iPos = 0;
                    bRet = funDel3A_FindABC(pPais, iPais3A, iPos);
                    if (bRet) Result = 3;
                }
            }
        }

        return Result;
    },

    // 是否能胡牌(删除将牌后的牌)
    funcIsCompletePais: function (pPaiInfo) {
        var Result = {
            bIsHuPai: false,            // 是否能胡牌
            bIsQiDui: false,            // 七对
            bIsDaDuiZi: false,          // 大对子

            // =========================================
            iJiangPai: -1,              // 使用哪对牌做的麻将 
        };

        var iRet = 0;
        var bIs3APais = true;

        for (var iKey = 0; iKey <= 3; ++iKey) {
            if ((pPaiInfo[iKey].length % 3) != 0) {
                return Result;
            }
        }

        var iPais = pPaiInfo["3"];
        if (iPais.length > 0) {
            if (!this.mjIsAllPaiAAA(iPais)) {
                return Result;
            }
        }

        for (var iKey = 0; iKey <= 2; ++iKey) {
            var pPais = pPaiInfo[iKey];
            if (pPais.length > 0) {
                iRet = this.funcIsCombination(pPais);
                if (iRet == 0) return Result;

                if (iRet != 1) bIs3APais = false;
            }
        }

        Result.bIsHuPai = true;
        Result.bIsDaDuiZi = bIs3APais;

        return Result;
    },


    // 翻醒胡牌
    IsCompletePais: function (pPais) {
        var Result = {
            bIsHuPai: false,            // 是否能胡牌
            bIsQiDui: false,            // 七对
            bIsDaDuiZi: false,          // 大对子

            // =========================================
            iJiangPai: -1,              // 使用哪对牌做的麻将 
        };

        var iPai = -1;
        var iIndex = 0;
        var i2APais = [];      // 所有对子
        var iPai2ANum = 0;     // 对子总数

        var iPais = pPais.concat();
        iPais.sort(function (left, right) {
            if (left > right) return 1;
            else return -1;
        });

        // 获取所有 2A 牌
        iIndex = 0;
        while (iIndex < iPais.length - 1) {
            iPai = iPais[iIndex + 1];
            if (iPais[iIndex] == iPai) {
                if (i2APais.indexOf(iPai) == -1) {
                    i2APais.push(iPai);
                }
                ++iPai2ANum;

                ++iIndex;
            }
            ++iIndex;
        }

        if (iPai2ANum == 7) {   // 七对
            Result.bIsHuPai = true;
            Result.bIsQiDui = true;
            Result.iJiangPai = 200;

            return Result;
        }

        if ((iPai2ANum == 1) && (iPais.length == 2)) {
            Result.bIsHuPai = true;
            Result.bIsDaDuiZi = true;
            Result.iJiangPai = iPais[0];

            return Result;
        }

        var pPaiRec = {
            "0": [], // 筒 0..8
            "1": [], // 条 9..17
            "2": [], // 万 18..26
            "3": [], // 字 28..35
        };

        iPai2ANum = i2APais.length;
        while (iPai2ANum > 0) {
            --iPai2ANum;
            iPai = i2APais[iPai2ANum];

            iIndex = iPais.indexOf(iPai);
            iPais.splice(iIndex, 2);  // 取出一对麻将牌

            this.funcGetPaiInfo(iPais, pPaiRec);

            Result = this.funcIsCompletePais(pPaiRec);
            if (Result.bIsHuPai) {
                Result.iJiangPai = iPai;
                break;
            }

            iPais.splice(iIndex, 0, iPai, iPai);

            pPaiRec["0"] = [];
            pPaiRec["1"] = [];
            pPaiRec["2"] = [];
            pPaiRec["3"] = [];
        }

        return Result;
    },


    mjIsHuThisPai: function (pPais, iPai) {
        var Result = {
            bIsHuPai: false,            // 是否能胡牌
            bIsQiDui: false,            // 七对
            bIsDaDuiZi: false,          // 大对子
            bIsJingGouDiao: false,      // 金钩钓
            bIsQingYiSe: false,         // 清一色
            bIsYaoJiu: false,           // 幺九
            bIsJiaWuXin: false,         // 夹五心
            bIsYiTiaoLong: false,       // 一条龙
            bIsJieMeiDui: false,        // 姐妹对
            i4ACount: 0,                // 4A个数
            iFanSum: 0,                 // 手上的牌型番数

            // =========================================
            iJiangPai: -1,              // 使用哪对牌做的麻将
            iPais: []
        };

        var iCount = pPais.length + 1;
        if ((iCount - 2) % 3 == 0) {
            pPais.push(iPai);
            Result = this.mjIsHuPai(pPais);
            pPais.pop();
        }

        return Result;
    },

    //// 函数导出
    //exports.getMJType = getMJType;

    //exports.mjGenB = mjGenB;
    //exports.mjGenT = mjGenT;
    //exports.mjGenW = mjGenW;
    //exports.mjSortPais = mjSortPais;
    //exports.mjIsHuPai = mjIsHuPai;
    //exports.mjIsHuThisPai = mjIsHuThisPai;
    //exports.IsCompletePais = IsCompletePais;

});