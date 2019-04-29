var BigInt = require("big-integer");
var GLibs = require("./gserver/GCXLibs");
var RoomMgr = require("./gserver/roommgr");
var SysUtils = require("./Utils/SysUtils");


BigInt.prototype.sub = function (value) {
    return this.subtract(value);
};

BigInt.prototype.mul = function (value) {
    return this.multiply(value);
};

BigInt.prototype.div = function (value) {
    return this.divide(value);
};

var llValue = BigInt("100");
//llValue = llValue.add(100);       // llValue = llValue + 100
//llValue = llValue.sub(100);       // llValue = llValue - 100
//llValue = llValue.mul(100);       // llValue = llValue * 100
llValue = llValue.div(33);       // llValue = llValue / 100

var iRet1 = GLibs.ComparePais([303, 2000], [312, 208]);
var iRet2 = GLibs.ComparePais([102, 407], [410, 405]);

console.log("iRet1:" + iRet1 + ", iRet2:" + iRet2);

var pRoomObj = {
    pRoomArgs: {
        "szName": "好",
        "iBaseFen": 1,
        "iMinFenE": 100,
        "iMaxFenE": 100,
        "bCtrlFenE": true,
        "bOpenMG": true,
        "iMaxMG": 4,
        "iTimes": 60,
        "bXiuZM": true,
        "bOpenGPS": true,
        "bLinkM": true,
        "bCanSP": true,
        "iAutoStart": 0,
        "iNoXDR": 0,
        "iAllid": 0,
        "openJC": false,
        "iMaxPlayer": 8,
        "bRunning": true,
        "iDelTimes": 1780,
        "iMaxSeePlayer": 20
    },

    pGameObj: {
        iJiFenMG: 40,
        iNextMG: 2
    },

    pGameObjEx: {
        pBanker: null,
        pPlayers: [
            {
                iUserId: 1,
                iState: RoomMgr.SeatState.SEAT_STATE_QIAO,
                iSHPMode: 0,
                "pPais": [102, 406, 303, 112],
                "pPais1": [102, 406],
                "pPais2": [303, 112],
                "szPaisName1": "8点",
                "szPaisName2": "5点",
                pNext: null
            },

            {
                iUserId: 2,
                iState: RoomMgr.SeatState.SEAT_STATE_LOSE,
                iSHPMode: 0,
                "pPais": [205, 306, 410],
                "pPais1": null,
                "pPais2": null,
                "szPaisName1": null,
                "szPaisName2": null,
                pNext: null
            },

            {
                iUserId: 3,
                iState: RoomMgr.SeatState.SEAT_STATE_PLAY,
                iSHPMode: 0,
                "pPais": [411, 204, 104, 211],
                "pPais1": [411, 211],
                "pPais2": [104, 204],
                "szPaisName1": "虎头",
                "szPaisName2": "8点",
                pNext: null
            },

            {
                iUserId: 4,
                iState: RoomMgr.SeatState.SEAT_STATE_PLAY,
                iSHPMode: 0,
                "pPais": [407, 108, 308, 310],
                "pPais1": [308, 108],
                "pPais2": [407, 310],
                "szPaisName1": "人牌",
                "szPaisName2": "7点",
                pNext: null
            },
        ],
    },

    pRoomPlayers: {
        "1": {
            pStake: {
                iJiFenYZ: 3339,
                iJiFenMG: 10,
            }
        },
        "2": {
            pStake: {
                iJiFenYZ: 40,
                iJiFenMG: 10,
            }
        },
        "3": {
            pStake: {
                iJiFenYZ: 328,
                iJiFenMG: 10,
            }
        },
        "4": {
            pStake: {
                iJiFenYZ: 2629,
                iJiFenMG: 10,
            }
        },
    }
}
pRoomObj.pGameObjEx.pBanker = pRoomObj.pGameObjEx.pPlayers[0];

pRoomObj.pGameObjEx.pPlayers[0].pNext = pRoomObj.pGameObjEx.pPlayers[1];
pRoomObj.pGameObjEx.pPlayers[1].pNext = pRoomObj.pGameObjEx.pPlayers[2];
pRoomObj.pGameObjEx.pPlayers[2].pNext = pRoomObj.pGameObjEx.pPlayers[3];
pRoomObj.pGameObjEx.pPlayers[3].pNext = pRoomObj.pGameObjEx.pPlayers[0];


function IsXiuM(pRoomObj) {
    console.log("IsXiuM enter");
    var Result = true;
    var pGameObjEx = pRoomObj.pGameObjEx;

    if (!pRoomObj.pRoomArgs.bXiuZM) return false;   // 没有启用芒果功能

    for (var iIndex = 0; iIndex < pGameObjEx.pPlayers.length; ++iIndex) {
        var pItem = pGameObjEx.pPlayers[iIndex];

        if ((pItem.iState == RoomMgr.SeatState.SEAT_STATE_LOSE) || (pItem.iState == RoomMgr.SeatState.SEAT_STATE_REST)) continue;

        Result = false;
        break;
    }
    console.log("IsXiuM Result:" + Result);

    return Result;
}

async function JieShuan(pRoomObj) {
    var pGameObj = pRoomObj.pGameObj;
    var pGameObjEx = pRoomObj.pGameObjEx;

    var iPlayCount = 0;
    var pPlayers = [];
    var pLostPlayers = [];  // 丢牌玩家
    var pGroups = [];

    for (var iIndex = 0; iIndex < pGameObjEx.pPlayers.length; ++iIndex) {
        var pPlayer = pGameObjEx.pPlayers[iIndex];
        var pStakeObj = RoomMgr.GetStakeObj(pRoomObj, pPlayer.iUserId);

        // 生成临时变量
        pPlayer.iSaveYZ = pStakeObj.iJiFenYZ;
        pPlayer.iSaveMG = pStakeObj.iJiFenMG;

        pPlayer.iAddFenMG = 0;    // 临时变量
        pPlayer.iAddFenYZ = 0;    // 临时变量
        pPlayer.iJiFenSY = 0;     // 输赢的积分
        pPlayer.iJiFenS = 0;      // 输家最多输的分数
        pPlayer.iSaveS = 0;
        pPlayer.iGetFen = 0;

        if ((pPlayer.iState == RoomMgr.SeatState.SEAT_STATE_PLAY) || (pPlayer.iState == RoomMgr.SeatState.SEAT_STATE_QIAO) ||
            (pPlayer.iState == RoomMgr.SeatState.SEAT_STATE_REST)) {

            ++iPlayCount;

            // 计算头尾牌
            var pPaiInfo = {
                pPaisT: null,
                pPaisW: null
            };

            if (pPlayer.pPais1 != null) {
                var pSplitObj = {
                    pPais1: pPlayer.pPais1,
                    pPais2: pPlayer.pPais2
                }
                //pPaiInfo = GLibs.GetPaiSW(pSplitObj);
                
                var iRet = GLibs.ComparePais(pPlayer.pPais1, pPlayer.pPais2);
                if (iRet == -1) {
                    pPaiInfo.pPaisT = pPlayer.pPais1;
                    pPaiInfo.pPaisW = pPlayer.pPais2;
                }
                else {
                    pPaiInfo.pPaisT = pPlayer.pPais2;
                    pPaiInfo.pPaisW = pPlayer.pPais1;
                }
            }

            pPlayer.pPaisT = pPaiInfo.pPaisT;   // 头牌
            pPlayer.pPaisW = pPaiInfo.pPaisW;   // 尾牌

            pPlayers.push(pPlayer);
            //console.log("JieShuan push iUserId:" + pPlayer.iUserId);
        }
        else if (pPlayer.iState == RoomMgr.SeatState.SEAT_STATE_LOSE) {
            if (pPlayer.iSHPMode != 1) {
                //console.log("JieShuan lost iUserId:" + pPlayer.iUserId);
                pLostPlayers.push(pPlayer);
            }
        }
    }

    console.log("JieShuan push iPlayCount:" + iPlayCount);
    if (iPlayCount >= 2) {
        iMode = 2;
        // 根据尾牌由大到小排序
        pPlayers.sort(function (left, right) {
            var iRet = GLibs.ComparePais(left.pPaisW, right.pPaisW);
            if (iRet == 0) {    // 尾大小相同就再比较头
                iRet = GLibs.ComparePais(left.pPaisT, right.pPaisT);
            }

            return iRet;
        });


        // 计算每个丢牌玩家最大输掉的积分
        for (var iIndex = 0; iIndex < pLostPlayers.length; ++iIndex) {
            var pLostUser = pLostPlayers[iIndex];
            var pLostUserStakeObj = RoomMgr.GetStakeObj(pRoomObj, pLostUser.iUserId);

            if (pLostUser.iSHPMode == 1) continue;  // 用户是三花牌

            for (var iPos = 0; iPos < pPlayers.length; ++iPos) {
                var pWinUser = pPlayers[iPos];
                var pWinUserStakeObj = RoomMgr.GetStakeObj(pRoomObj, pWinUser.iUserId);

                if (pLostUser.iJiFenS < pWinUserStakeObj.iJiFenYZ) {
                    pLostUser.iJiFenS = pWinUserStakeObj.iJiFenYZ;

                    if (pLostUser.iJiFenS > pLostUserStakeObj.iJiFenYZ) {
                        pLostUser.iJiFenS = pLostUserStakeObj.iJiFenYZ;
                    }
                }
            }
        }

        // 计算剩余比牌玩家最大输掉的积分
        for (var iIndex = 0; iIndex < pPlayers.length - 1; ++iIndex) {
            var pWinUser = pPlayers[iIndex];
            var pWinUserStakeObj = RoomMgr.GetStakeObj(pRoomObj, pWinUser.iUserId);

            for (var iPos = iIndex + 1; iPos < pPlayers.length; ++iPos) {
                var pLostUser = pPlayers[iPos];
                var pLostUserStakeObj = RoomMgr.GetStakeObj(pRoomObj, pLostUser.iUserId);

                var iRetT = GLibs.ComparePais(pWinUser.pPaisT, pLostUser.pPaisT);
                var iRetW = GLibs.ComparePais(pWinUser.pPaisW, pLostUser.pPaisW);
                console.log("pWinUser iUserId:" + pWinUser.iUserId + ", pLostUser iUserId:" + pLostUser.iUserId +
                    ", iRetT:" + iRetT + ", iRetW:" + iRetW);

                var bDoUpdate = false;
                if ((iRetT == -1) && (iRetW == -1)) bDoUpdate = true;   // 头尾都大
                if ((iRetT == -1) && (iRetW == 0)) bDoUpdate = true;
                if ((iRetT == 0) && (iRetW == -1)) bDoUpdate = true;
                if (!bDoUpdate) continue;

                if (pLostUser.iJiFenS < pWinUserStakeObj.iJiFenYZ) {
                    pLostUser.iJiFenS = pWinUserStakeObj.iJiFenYZ;

                    if (pLostUser.iJiFenS > pLostUserStakeObj.iJiFenYZ) {
                        pLostUser.iJiFenS = pLostUserStakeObj.iJiFenYZ;
                    }
                }
            }
        }

        for (var iIndex = 0; iIndex < pLostPlayers.length; ++iIndex) {
            var pItem = pLostPlayers[iIndex];
            pItem.iSaveS = pItem.iJiFenS;
            console.log("lost pItem.iUserId:" + pItem.iUserId + ", pItem.iJiFenS:" + pItem.iJiFenS);
        }

        for (var iIndex = 0; iIndex < pPlayers.length; ++iIndex) {
            var pItem = pPlayers[iIndex];
            pItem.iSaveS = pItem.iJiFenS;
            console.log("player pItem.iUserId:" + pItem.iUserId + ", pItem.iJiFenS:" + pItem.iJiFenS);
        }

        // 按牌大小分组
        var iIndex = 0;
        while (iIndex < pPlayers.length) {
            var pPrev = pPlayers[iIndex];

            var pItems = [pPrev];
            for (var iPos = iIndex + 1; iPos < pPlayers.length; ++iPos) {
                var pNext = pPlayers[iPos];

                var iRetT = GLibs.ComparePais(pPrev.pPaisT, pNext.pPaisT);
                var iRetW = GLibs.ComparePais(pPrev.pPaisW, pNext.pPaisW);

                if ((iRetT == 0) && (iRetW == 0)) { // 头尾都相等
                    pItems.push(pNext);
                    ++iIndex;
                }
                else {
                    break;
                }
            }
            ++iIndex;

            pGroups.push(pItems);
        }

        // 将头尾相等的玩家按押注分数由小到大排序
        var pfnSortWinUsers = function (pGameObj, pWinUsers) {
            pWinUsers.sort(function (left, right) {
                var pStakeL = RoomMgr.GetStakeObj(pRoomObj, left.iUserId);
                var pStakeR = RoomMgr.GetStakeObj(pRoomObj, right.iUserId);
                return pStakeL.iJiFenYZ - pStakeR.iJiFenYZ;
            });
        }

        var pfnCalcWinUsersJiFen = function (pRoomObj, pWinUsers, iJiFenSum, iMode) {
            var pGameObj = pRoomObj.pGameObj;
            var pGameObjEx = pRoomObj.pGameObjEx;
            var pMainMaps = {};
            var pJiFens = [];

            pfnSortWinUsers(pGameObj, pWinUsers);
            for (var iWinPos = 0; iWinPos < pWinUsers.length; ++iWinPos) {
                var pWinUser = pWinUsers[iWinPos];
                var pStakeObj = RoomMgr.GetStakeObj(pRoomObj, pWinUser.iUserId);

                pJiFens.push(pStakeObj.iJiFenYZ);
            }

            for (var iPos = 0; iPos < pJiFens.length; ++iPos) {
                var iJiFenYZ = pJiFens[iPos];

                for (var iWinPos = 0; iWinPos < pWinUsers.length; ++iWinPos) {
                    var pWinUser = pWinUsers[iWinPos];
                    var pStakeObj = RoomMgr.GetStakeObj(pRoomObj, pWinUser.iUserId);

                    if (pStakeObj.iJiFenYZ >= iJiFenYZ) {
                        var pItems = pMainMaps[iJiFenYZ];
                        if (pItems == null) {
                            pItems = [];
                            pMainMaps[iJiFenYZ] = pItems;
                        }

                        if (pItems.indexOf(pWinUser) == -1) {
                            pItems.push(pWinUser);
                            console.log("[JiFenYZ] pMainMaps iJiFenYZ:" + iJiFenYZ + ", iUserId:" + pWinUser.iUserId);
                        }
                    }
                }
            }

            var iSubVal = 0;
            for (var sKey in pMainMaps) {
                var iJiFen = parseInt(sKey);
                var pItems = pMainMaps[sKey];

                var iItemPos = 0;
                var pCursor = pGameObjEx.pBanker.pNext;

                iJiFen -= iSubVal;
                iSubVal = parseInt(sKey);
                while (true) {  // 查找最先吃分的玩家
                    iItemPos = pItems.indexOf(pCursor);
                    if (iItemPos >= 0) break;

                    pCursor = pCursor.pNext;
                }

                while ((iJiFen > 0) && (iJiFenSum > 0)) {
                    pCursor = pItems[iItemPos];

                    if (iMode == 0) {
                        pCursor.iAddFenYZ += 1;
                    }
                    else {
                        pCursor.iAddFenMG += 1;
                    }

                    --iJiFen;
                    --iJiFenSum;
                    iItemPos = (iItemPos + 1) % pItems.length;
                }
            }

            return iJiFenSum;
        }

        var pfnCalcWinGroupsJiFen = function (pRoomObj, pGroups, iJiFenSum, iMode) {
            for (var iIndex = 0; iIndex < pGroups.length; ++iIndex) {
                var pWinUsers = pGroups[iIndex];

                pfnSortWinUsers(pRoomObj.pGameObj, pWinUsers);
                iJiFenSum = pfnCalcWinUsersJiFen(pRoomObj, pWinUsers, iJiFenSum, iMode);
            }

            return iJiFenSum;
        }

        // 吃芒果
        var pfnCalcWinUsersJiFenMG = function (pRoomObj, pWinUsers, iJiFenSum, iMode) {
            var pGameObj = pRoomObj.pGameObj;
            var pGameObjEx = pRoomObj.pGameObjEx;
            var pMainMaps = {};
            var pJiFens = [];

            pfnSortWinUsers(pGameObj, pWinUsers);
            for (var iWinPos = 0; iWinPos < pWinUsers.length; ++iWinPos) {
                var pWinUser = pWinUsers[iWinPos];
                var pStakeObj = RoomMgr.GetStakeObj(pRoomObj, pWinUser.iUserId);

                pJiFens.push(pStakeObj.iJiFenYZ - pWinUser.iSaveS);
            }

            for (var iPos = 0; iPos < pJiFens.length; ++iPos) {
                var iJiFenYZ = pJiFens[iPos];

                for (var iWinPos = 0; iWinPos < pWinUsers.length; ++iWinPos) {
                    var pWinUser = pWinUsers[iWinPos];
                    var pStakeObj = RoomMgr.GetStakeObj(pRoomObj, pWinUser.iUserId);

                    if (pStakeObj.iJiFenYZ - pWinUser.iSaveS >= iJiFenYZ) {
                        var pItems = pMainMaps[iJiFenYZ];
                        if (pItems == null) {
                            pItems = [];
                            pMainMaps[iJiFenYZ] = pItems;
                        }

                        if (pItems.indexOf(pWinUser) == -1) {
                            pItems.push(pWinUser);
                            console.log("[JiFenMG] pMainMaps iJiFenYZ:" + iJiFenYZ + ", iUserId:" + pWinUser.iUserId);
                        }
                    }
                }
            }

            var iSubVal = 0;
            for (var sKey in pMainMaps) {
                var iJiFen = parseInt(sKey);
                var pItems = pMainMaps[sKey];

                var iItemPos = 0;
                var pCursor = pGameObjEx.pBanker.pNext;

                iJiFen -= iSubVal;
                iSubVal = parseInt(sKey);
                while (true) {  // 查找最先吃分的玩家
                    iItemPos = pItems.indexOf(pCursor);
                    if (iItemPos >= 0) break;

                    pCursor = pCursor.pNext;
                }

                while ((iJiFen > 0) && (iJiFenSum > 0)) {
                    pCursor = pItems[iItemPos];

                    if (iMode == 0) {
                        pCursor.iAddFenYZ += 1;
                    }
                    else {
                        pCursor.iAddFenMG += 1;
                    }

                    --iJiFen;
                    --iJiFenSum;
                    iItemPos = (iItemPos + 1) % pItems.length;
                }
            }

            return iJiFenSum;
        }

        var pfnCalcWinGroupsJiFenMG = function (pRoomObj, pGroups, iJiFenSum, iMode) {
            for (var iIndex = 0; iIndex < pGroups.length; ++iIndex) {
                var pWinUsers = pGroups[iIndex];

                pfnSortWinUsers(pRoomObj.pGameObj, pWinUsers);
                iJiFenSum = pfnCalcWinUsersJiFenMG(pRoomObj, pWinUsers, iJiFenSum, iMode);
            }

            return iJiFenSum;
        }

        // 分数结算(比牌玩家计算输赢)
        for (var iIndex = 0; iIndex < pGroups.length - 1; ++iIndex) {
            var pWinUsers = pGroups[iIndex];

            for (var iPos = iIndex + 1; iPos < pGroups.length; ++iPos) {
                var pLostUsers = pGroups[iPos];

                for (var iLostIdx = 0; iLostIdx < pLostUsers.length; ++iLostIdx) {
                    var pLostUser = pLostUsers[iLostIdx];

                    var pWinUser = pWinUsers[0];
                    var iRetT = GLibs.ComparePais(pWinUser.pPaisT, pLostUser.pPaisT);
                    var iRetW = GLibs.ComparePais(pWinUser.pPaisW, pLostUser.pPaisW);

                    var bDoUpdate = false;
                    if ((iRetT == -1) && (iRetW == -1)) bDoUpdate = true;   // 头尾都大
                    if ((iRetT == -1) && (iRetW == 0)) bDoUpdate = true;
                    if ((iRetT == 0) && (iRetW == -1)) bDoUpdate = true;


                    if (bDoUpdate) {
                        if (pWinUser.iUserId == 4 || pLostUser.iUserId == 4) {
                            console.log("111");
                        }
                        var iJiFenS = pLostUser.iJiFenS;
                        var iRet = pfnCalcWinUsersJiFen(pRoomObj, pWinUsers, pLostUser.iJiFenS, 0);
                        pLostUser.iJiFenS = iRet;
                        
                        var pStakeObj = RoomMgr.GetStakeObj(pRoomObj, pLostUser.iUserId);
                        pStakeObj.iJiFenYZ -= (iJiFenS - iRet);
                        pLostUser.iSaveS -= (iJiFenS - iRet);
                        if (pStakeObj.iJiFenYZ < 0) pStakeObj.iJiFenYZ = 0;
                    }
                }
            }
        }

        // 分数结算(吃丢牌玩家)
        for (var iIndex = 0; iIndex < pGroups.length; ++iIndex) {
            var pWinUsers = pGroups[iIndex];

            for (var iPos = 0; iPos < pLostPlayers.length; ++iPos) {
                var pLostUser = pLostPlayers[iPos];
                var iJiFenS = pLostUser.iJiFenS;
                var iRet = pfnCalcWinUsersJiFen(pRoomObj, pWinUsers, pLostUser.iJiFenS, 0);
                pLostUser.iJiFenS = iRet;
                
                var pStakeObj = RoomMgr.GetStakeObj(pRoomObj, pLostUser.iUserId);
                pStakeObj.iJiFenYZ -= (iJiFenS - iRet);
                pLostUser.iSaveS -= (iJiFenS - iRet);
                if (pStakeObj.iJiFenYZ < 0) pStakeObj.iJiFenYZ = 0;
            }

            // var iJiFenSum = 0;  // 丢牌玩家总输分数
            // for (var iPos = 0; iPos < pLostPlayers.length; ++iPos) {
            //     var pLostUser = pLostPlayers[iPos];
            //     iJiFenSum += pLostUser.iJiFenS;
            //     pLostUser.iJiFenS = 0;
            //     pLostUser.iSaveS = 0;
            // }

            // if (iJiFenSum > 0) pfnCalcWinGroupsJiFen(pRoomObj, pGroups, iJiFenSum, 0);
        }

        // 吃芒果
        console.log("JieShuan 1 pGameObj.iJiFenMG:" + pGameObj.iJiFenMG);
        if (pGameObj.iJiFenMG > 0) {
            pGameObj.iJiFenMG = pfnCalcWinGroupsJiFenMG(pRoomObj, pGroups, pGameObj.iJiFenMG, 1);
        }
    }
    else {
        // 只剩一个玩家了，其他玩家全丢牌了
        var pWinUser = null;
        for (var iIndex = 0; iIndex < pGameObjEx.pPlayers.length; ++iIndex) {
            var pPlayer = pGameObjEx.pPlayers[iIndex];
            if (pPlayer.iState != RoomMgr.SeatState.SEAT_STATE_LOSE) {
                pWinUser = pPlayer;
                break;
            }
        }
        var pWinUserStakeObj = RoomMgr.GetStakeObj(pRoomObj, pWinUser.iUserId);

        console.log("JieShuan iWinUser:" + pWinUser.iUserId);

        // 计算每个丢牌玩家最大输掉的积分
        for (var iIndex = 0; iIndex < pLostPlayers.length; ++iIndex) {
            var pLostUser = pLostPlayers[iIndex];
            var pLostUserStakeObj = RoomMgr.GetStakeObj(pRoomObj, pLostUser.iUserId);

            if (pLostUser.iSHPMode == 1) continue;  // 三花牌

            if (pLostUser.iJiFenS < pWinUserStakeObj.iJiFenYZ) {
                pLostUser.iJiFenS = pWinUserStakeObj.iJiFenYZ;

                if (pLostUser.iJiFenS > pLostUserStakeObj.iJiFenYZ) {
                    pLostUser.iJiFenS = pLostUserStakeObj.iJiFenYZ;
                }
            }
            console.log("JieShuan iLostUser:" + pLostUser.iUserId + ", iJiFenS:" + pLostUser.iJiFenS);
        }

        for (var iPos = 0; iPos < pLostPlayers.length; ++iPos) {    // 丢牌玩家
            var pLostUser = pLostPlayers[iPos];
            var pLostUserStakeObj = RoomMgr.GetStakeObj(pRoomObj, pLostUser.iUserId);

            pLostUserStakeObj.iJiFenYZ -= pLostUser.iJiFenS;
            pWinUser.iAddFenYZ += pLostUser.iJiFenS;
            pLostUser.iJiFenS = 0;

            console.log("JieShuan pLostUser.iJiFenYZ:" + pLostUserStakeObj.iJiFenYZ);
        }

        // 吃芒果
        console.log("JieShuan 2 pGameObj.iJiFenMG:" + pGameObj.iJiFenMG);
        if (pGameObj.iJiFenMG <= pWinUserStakeObj.iJiFenYZ) {
            pWinUser.iAddFenMG += pGameObj.iJiFenMG;
        }
        else {
            pWinUser.iAddFenMG = pWinUserStakeObj.iJiFenYZ;
        }
        pGameObj.iJiFenMG -= pWinUser.iAddFenMG;
    }

    // 统计各用户输赢, 更新用户积分
    for (var iIndex = 0; iIndex < pGameObjEx.pPlayers.length; ++iIndex) {
        var pUserObj = pGameObjEx.pPlayers[iIndex];
        var pStakeObj = RoomMgr.GetStakeObj(pRoomObj, pUserObj.iUserId);

        // 用户退回的押注分 + 赢的押注分 + 赢的芒果分 - 用户原始押注分
        var iAddFen = pStakeObj.iJiFenYZ + pUserObj.iAddFenYZ + pUserObj.iAddFenMG - pUserObj.iSaveS;
        if (pUserObj.iState == RoomMgr.SeatState.SEAT_STATE_LOSE) {
            if (pUserObj.iSHPMode != 1) iAddFen -= pStakeObj.iJiFenYZ;
        }

        console.log("1.iUserId:" + pUserObj.iUserId +
            ", iJiFenYZ:" + pStakeObj.iJiFenYZ +
            ", iAddFenYZ:" + pUserObj.iAddFenYZ +
            ", iAddFenMG:" + pUserObj.iAddFenMG +
            ", iJiFenS:" + pUserObj.iSaveS +
            ", iAddFen:" + iAddFen);

        pUserObj.iJiFenSY = iAddFen - pUserObj.iSaveYZ - pUserObj.iSaveMG;
        //console.log("2.iUserId:" + pUserObj.iUserId);

        var iSHPMode = 0;
        if (pUserObj.iSHPMode == 1) {
            if (GLibs.IsKeySHL(pUserObj.pPais)) {
                iSHPMode = 1;
            }
            else if (GLibs.IsKeySHS(pUserObj.pPais)) {
                iSHPMode = 2;
            }
        }

        var pSendMsg = {
            iUserId: pUserObj.iUserId,
            iAddFen: iAddFen,
            iJiFenSY: pUserObj.iJiFenSY,
            iSHPMode: iSHPMode
        };
        console.log(pSendMsg);
    }
}


//console.log(IsXiuM(pRoomObj));

JieShuan(pRoomObj);
console.log("11111111");
// var pGameObj = pRoomObj.pGameObj;
// if (pRoomObj.pRoomArgs.bLinkM) {     // 开启了手手芒
//     if (pGameObj.iNextMG == 0) pGameObj.iNextMG = pRoomObj.pRoomArgs.iBaseFen * 2;
// }
// console.log(pRoomObj.pGameObj);

// 1：自动分牌的时候没显示分牌结果
// 2：分牌后没自动开局(一局完了，站起来再坐下去)

/*
    1: 玩的过程中有时牌会消失
    2: 点延时的时候，延时进度条倒回去一点
    3: 点人物头像的时候，人物属性对话框现在没显示出来了
    4: 房间全状态同步
    5: 首次发话跟注分数不对
    6: 牌局过程中，玩家坐位置时有一个丢牌动作
    7: 申请上分界面最小分数以最带入开始
    8: 客户端和服务器有些时间没统一
    9：超时自动操作时，界面显示乱老
    10: 皮池和芒果池上面那个有时还会显示出来
    11: A:30, B:50  芒果池:50分，如果A赢了（A要赢B 30分，赢芒果池 30分，此时因为B还有20押注分，所以B也可以吃20芒果)
*/

// var pPaiObjL = GLibs.GetPaiCodeObj([107, 307]);
// var pPaiObjR = GLibs.GetPaiCodeObj([208, 408]);
// console.log(pPaiObjL);
// console.log(pPaiObjR);

// console.log(GLibs.IsDZ([107, 307]));
// console.log(GLibs.IsDZ([208, 408]));
