var kanzi = [];
var jingMap = {};
var numOfJings = 0;
var record = false;

function getMJType(id) {
	if (id >= 0 && id < 9) {
		//筒
		return 0;
	}
	else if (id >= 9 && id < 18) {
		//条
		return 1;
	}
	else if (id >= 18 && id < 27) {
		//万
		return 2;
	}
	else if (id >= 27 && id < 34) {
		//字
		return 3;
	}
}


function debugRecord(pai) {
	if (record) {
		kanzi.push(pai);
	}
}

function addCount(seatData, pai, value) {
	var cnt = seatData.countMap[pai];
	if (cnt != null) {
		cnt += value;
		seatData.countMap[pai] = cnt;
	}
}

function isZhongFaBai(selected) {
	return selected >= 31 && selected <= 33;
}

function isWind(selected) {
	return selected >= 27 && selected <= 30;
}

function MatchABO(seatData, selected, jingMode) {
	//分开匹配 A-2,A-1,A
	var matched = true;
	var requireJings = 0;
	var v = selected % 9;
	if (v < 2) {
		matched = false;
	}

	if (matched) {
		for (var i = 0; i < 3; ++i) {
			var t = selected - 2 + i;
			var cc = seatData.countMap[t];
			if (cc == null || cc <= 0) {

				if (jingMode && numOfJings > requireJings) {
					requireJings++;
				}
				else {
					matched = false;
					break;
				}
			}
		}
	}


	//匹配成功，扣除相应数值
	if (matched) {
		addCount(seatData, selected - 2, -1);
		addCount(seatData, selected - 1, -1);
		addCount(seatData, selected - 0, -1);
		numOfJings -= requireJings;

		var ret = checkSingle(seatData, jingMode);
		addCount(seatData, selected - 2, 1);
		addCount(seatData, selected - 1, 1);
		addCount(seatData, selected - 0, 1);
		numOfJings += requireJings;

		if (ret == true) {
			debugRecord(selected - 2);
			debugRecord(selected - 1);
			debugRecord(selected);
			return true;
		}
	}
	return false;
}

function MatchAOB(seatData, selected, jingMode) {
	//分开匹配 A-1,A,A + 1
	var matched = true;
	var requireJings = 0;
	var v = selected % 9;
	if (v < 1 || v > 7) {
		matched = false;
	}

	if (matched) {
		for (var i = 0; i < 3; ++i) {
			var t = selected - 1 + i;
			var cc = seatData.countMap[t];
			if (cc == null || cc <= 0) {
				if (jingMode && numOfJings > requireJings) {
					requireJings++;
				}
				else {
					matched = false;
					break;
				}
			}
		}
	}
	//匹配成功，扣除相应数值
	if (matched) {
		addCount(seatData, selected - 1, -1);
		addCount(seatData, selected - 0, -1);
		addCount(seatData, selected + 1, -1);
		numOfJings -= requireJings;

		var ret = checkSingle(seatData, jingMode);
		addCount(seatData, selected - 1, 1);
		addCount(seatData, selected - 0, 1);
		addCount(seatData, selected + 1, 1);
		numOfJings += requireJings;

		if (ret == true) {
			debugRecord(selected - 1);
			debugRecord(selected - 0);
			debugRecord(selected + 1);
			return true;
		}
	}
	return false;
}

function MatchOAB(seatData, selected, jingMode) {
	//分开匹配 A,A+1,A + 2
	var matched = true;
	var requireJings = 0;
	var v = selected % 9;
	if (v > 6) {
		matched = false;
	}

	if (matched) {
		for (var i = 0; i < 3; ++i) {
			var t = selected + i;
			var cc = seatData.countMap[t];

			if (cc == null || cc <= 0) {

				if (jingMode && numOfJings > requireJings) {
					requireJings++;
				}
				else {
					matched = false;
					break;
				}
			}
		}
	}


	//匹配成功，扣除相应数值
	if (matched) {
		addCount(seatData, selected - 0, -1);
		addCount(seatData, selected + 1, -1);
		addCount(seatData, selected + 2, -1);
		numOfJings -= requireJings;

		var ret = checkSingle(seatData, jingMode);
		addCount(seatData, selected - 0, 1);
		addCount(seatData, selected + 1, 1);
		addCount(seatData, selected + 2, 1);
		numOfJings += requireJings;

		if (ret == true) {
			debugRecord(selected - 0);
			debugRecord(selected + 1);
			debugRecord(selected + 2);
			return true;
		}
	}
	return false;
}

function matchSingle(seatData, selected, jingMode) {
	//分开匹配 A-2,A-1,A
	//console.log(seatData.countMap);
	var matched = MatchABO(seatData, selected, jingMode);
	if (matched) {
		return true;
	}

	//分开匹配 A-1, A, A+1
	//console.log(seatData.countMap);
	matched = MatchAOB(seatData, selected, jingMode);
	if (matched) {
		return true;
	}


	//分开匹配 A, A+1, A+2
	matched = MatchOAB(seatData, selected, jingMode);
	if (matched) {
		return true;
	}
	return false;
}

function checkSingle(seatData, jingMode) {
	var holds = seatData.holds;
	var selected = -1;
	var c = 0;
	for (var i = 0; i < holds.length; ++i) {
		var pai = holds[i];
		c = seatData.countMap[pai];
		if (c > 0) {
			selected = pai;
			break;
		}
	}

	if (selected == -1) {
		return true;
	}

	//否则，进行匹配
	if (c == 3) {
		//直接作为一坎
		seatData.countMap[selected] = 0;
		debugRecord(selected);
		debugRecord(selected);
		debugRecord(selected);
		var ret = checkSingle(seatData, jingMode);
		//立即恢复对数据的修改
		seatData.countMap[selected] = c;
		if (ret == true) {
			return true;
		}
	}
	else if (c == 4) {
		//直接作为一坎
		seatData.countMap[selected] = 1;
		debugRecord(selected);
		debugRecord(selected);
		debugRecord(selected);
		var ret = checkSingle(seatData, jingMode);
		//立即恢复对数据的修改
		seatData.countMap[selected] = c;
		//如果作为一坎能够把牌匹配完，直接返回TRUE。
		if (ret == true) {
			return true;
		}
	}
	else if (c == 2) {
		//替用作为一坎
		if (jingMode && numOfJings >= 1) {
			seatData.countMap[selected] = 0;
			numOfJings -= 1;
			var ret = checkSingle(seatData, jingMode);
			seatData.countMap[selected] = c;
			numOfJings += 1;
			if (ret == true) {
				return true;
			}
		}
	}
	else if (c == 1) {
		//替用作为一坎
		if (jingMode && numOfJings >= 2) {
			seatData.countMap[selected] = 0;
			numOfJings -= 2;
			var ret = checkSingle(seatData, jingMode);
			seatData.countMap[selected] = c;
			numOfJings += 2;
			if (ret == true) {
				return true;
			}
		}
	}

	//东南西北风中发白不能是单牌
	if (isWind(pai) || isZhongFaBai(pai)) {
		return false;
	}

	//按单牌处理
	return matchSingle(seatData, selected, jingMode);
}

function storeJingMap(seatData, chupai) {
	var oldJingMap = {}
	for (var k in jingMap) {
		oldJingMap[k] = seatData.countMap[k];
		if (chupai == k) {
			seatData.countMap[k] = 1;
		}
		else {
			seatData.countMap[k] = 0;
		}
	}
	return oldJingMap;
}

function restoreJingMap(seatData, oldJingMap) {
	//将备份的精还原
	if (oldJingMap) {
		for (var k in jingMap) {
			var c = oldJingMap[k];
			if (c) {
				seatData.countMap[k] = c;
			}
		}
	}
}

function setJings(jings) {
	jingMap = {};
	for (var i = 0; i < jings.length; ++i) {
		jingMap[jings[i]] = true;
	}
}

function isPingHu(seatData, checkJings) {
	numOfJings = 0;
	for (var k in seatData.countMap) {
		if (jingMap[k] == true) {
			var c = seatData.countMap[k];
			numOfJings += c;
		}
	}
	var hasJing = numOfJings > 0;
	var oldJings = numOfJings;
	var fn = function (jingMode) {

		if (jingMode) {
			if (hasJing == false) {
				return false;
			}

			//如果全把精，则返回可以胡(不可能是七对和十三烂，只能是精吊平胡)
			if (seatData.holds.length == numOfJings) {
				return true;
			}
		}

		//将精的数目备份 然后清除精的数目
		var oldJingMap = null;
		if (jingMode) {
			oldJingMap = storeJingMap(seatData);
		}

		var ret = false;
		for (var k in seatData.countMap) {
			numOfJings = oldJings;
			k = parseInt(k);
			var c = seatData.countMap[k];

			if (!(c > 0)) {
				continue;
			}

			if (c < 2) {
				if (jingMode == false || numOfJings < 1) {
					continue;
				}
				else {
					numOfJings -= 1;
				}
			}


			//如果当前牌大于等于２，则将它选为将牌
			seatData.countMap[k] -= 2;
			//逐个判定剩下的牌是否满足　３Ｎ规则,一个牌会有以下几种情况
			//1、0张，则不做任何处理
			//2、2张，则只可能是与其它牌形成匹配关系
			//3、3张，则可能是单张形成 A-2,A-1,A  A-1,A,A+1  A,A+1,A+2，也可能是直接成为一坎
			//4、4张，则只可能是一坎+单张
			ret = checkSingle(seatData, jingMode);
			seatData.countMap[k] += 2;
			if (ret) {
				break;
			}
		}

		restoreJingMap(seatData, oldJingMap);
		return ret;
	}

	var ret = fn(false);
	if (ret) {
		return 1;
	}

	if (checkJings) {
		if (fn(true)) {
			return 2;
		}
	}
	return 0;
};

function isJingDiao(seatData) {
	var jing = null;
	numOfJings = 0;
	for (var k in seatData.countMap) {
		if (jingMap[k] == true) {
			jing = k;
			numOfJings += seatData.countMap[k];
		}
	}
	if (jing == null) {
		return false;
	}

	//拿掉一个精，然后判定是否胡牌
	numOfJings -= 1;
	seatData.countMap[jing] -= 1;
	var oldJingMap = storeJingMap(seatData);
	var ret = is6Pairs(seatData);
	if (ret) {
		restoreJingMap(seatData, oldJingMap);
		seatData.countMap[jing] += 1;
		return true;
	}

	var ret = checkSingle(seatData, true);

	restoreJingMap(seatData, oldJingMap);
	seatData.countMap[jing] += 1;
	return ret;
}

function is7Pairs(seatData, checkJings, chupai) {
	if (seatData.holds.length != 14) {
		return 0;
	}
	numOfJings = 0;
	for (var k in seatData.countMap) {
		if (jingMap[k] == true) {
			var c = seatData.countMap[k];
			numOfJings += c;
		}
	}
	if (jingMap[chupai] == true) {
		numOfJings -= 1;
	}
	var hasJing = numOfJings > 0;

	//检查是否是七对 前提是没有碰，也没有杠 ，即手上拥有13张牌
	var fn = function (seatData, jingMode) {

		var oldJingMap = null;
		if (jingMode) {
			oldJingMap = storeJingMap(seatData, chupai);
		}

		var pairCount = 0;
		for (var k in seatData.countMap) {
			var c = seatData.countMap[k];
			if (c == 2) {
				pairCount++;
			}
			else if (c == 4) {
				pairCount += 2;
			}
		}

		restoreJingMap(seatData, oldJingMap);
		//检查是否有7对
		var j = jingMode ? numOfJings : 0;
		if (pairCount + j >= 7) {
			return true;
		}
		return false;
	}
	if (seatData.holds.length != 14) {
		return 0;
	}

	var ret = fn(seatData, false);
	if (ret) {
		return 1;
	}
	if (checkJings) {
		ret = fn(seatData, true);
		if (ret) {
			return 2;
		}
	}
	return 0;
}

function is6Pairs(seatData) {
	var pairCount = 0;
	if (seatData.holds.length != 13) {
		return false;
	}

	for (var k in seatData.countMap) {
		var c = seatData.countMap[k];
		if (c == 2) {
			pairCount++;
		}
		else if (c == 3) {
			pairCount++;
		}
		else if (c == 4) {
			pairCount += 2;
		}
	}

	//检查是否有6对
	if (pairCount + numOfJings >= 6) {
		return true;
	}

	return false;
}

function is4Melds(seatData, checkJings, chupai) {
	if (seatData.chis && seatData.chis.length > 0) {
		return false;
	}

	numOfJings = 0;
	for (var k in seatData.countMap) {
		if (jingMap[k] == true) {
			var c = seatData.countMap[k];
			numOfJings += c;
		}
	}
	if (jingMap[chupai] == true) {
		numOfJings -= 1;
	}
	var hasJing = numOfJings > 0;

	var fn = function (seatData, jingMode) {
		var oldJingMap = null;
		if (jingMode) {
			if (hasJing == false) {
				return false;
			}
			oldJingMap = storeJingMap(seatData, chupai);
		}

		var meldCount = 0;
		var pairCount = 0;
		var singleCount = 0;
		for (var k in seatData.countMap) {
			var c = seatData.countMap[k];
			if (c == 1) {
				singleCount++;
			}
			else if (c == 2) {
				pairCount++;
			}
			else if (c == 3) {
				meldCount++;
			}
			else if (c == 4) {
				meldCount++;
				singleCount++;
			}
		}

		restoreJingMap(seatData, oldJingMap);

		if (jingMode) {
			//扣除一对将后，其余的要组成一坎
			var needJing = 0;
			if (pairCount > 0) {
				needJing = (pairCount - 1) + singleCount * 2;
			}
			else {
				needJing = (singleCount - 1) * 2 + 1;
			}
			if (needJing > numOfJings) {
				return false;
			}
			return true;
		}
		else {
			//无精的话，必须要满足 只有一对将，且无单牌
			if (pairCount != 1 || singleCount > 0) {
				return false;
			}
			return true;
		}
	}

	var ret = fn(seatData, false);
	if (ret) {
		return 1;
	}
	if (checkJings) {
		ret = fn(seatData, true);
		if (ret) {
			return 2;
		}
	}
	return 0;
};

function checkCanHu(seatData, pai) {
	//判断是不是7对
	var ret = is7Pairs(seatData, true, pai);
	if (ret) {
		//7对
		return "7pairs";
	}

	//判断是不是碰碰胡
	var ret = is4Melds(seatData, true, pai);
	if (ret) {
		//碰碰胡
		return "4melds";
	}

	//判断是不是平胡
	var ret = isPingHu(seatData, true, pai);
	if (ret) {
		//平胡
		return "normal";
	}
	return null;
};

var DING_JING = 9;

function checkCanHu2(seatData, targetPai, usejing) {
	if (targetPai != null) {
		seatData.holds.push(targetPai);
		if (seatData.countMap[targetPai]) {
			seatData.countMap[targetPai]++;
		}
		else {
			seatData.countMap[targetPai] = 1;
		}
	}

	var pattern = null;
	if (usejing && seatData.countMap[DING_JING] >= 4) {
		pattern = "tianhu";
	}
	else {
		pattern = checkCanHu(seatData);
	}

	if (targetPai != null) {
		seatData.holds.pop();
		seatData.countMap[targetPai]--;
	}
	return pattern;
}

function updateTingMap(seatData, jings) {
	setJings(jings);
	seatData.tingMap = {};
	for (var i = 0; i < 27; ++i) {
		var pattern = checkCanHu2(seatData, i, jings.length > 0);
		if (pattern) {
			seatData.tingMap[i] = pattern;
		}
	}
}

function updateHzmjTingMap(seatData) {
	seatData.tingMap = {};
	//var oldHolds = seatData.holds.concat();
	for (var i = 0; i < 34; ++i) {
		seatData.holds.push(i);
		if (seatData.countMap[i]) {
			seatData.countMap[i]++;
		}
		else {
			seatData.countMap[i] = 1;
		}

		var ret = checkCanHu(seatData, i);
		if (ret) {
			seatData.tingMap[i] = {
				pattern: ret,
				fan: 0,
			}
		}

		seatData.holds.pop();
		seatData.countMap[i]--;
	}
	//seatData.holds = oldHolds;
}

cc.Class({
	extends: cc.Component,

	properties: {
		// foo: {
		//    default: null,      // The default value will be used only when the component attaching
		//                           to a node for the first time
		//    url: cc.Texture2D,  // optional, default is typeof default
		//    serializable: true, // optional, default is true
		//    visible: true,      // optional, default is true
		//    displayName: 'Foo', // optional
		//    readonly: false,    // optional, default is false
		// },
		// ...
	},

	// use this for initialization
	onLoad: function () {

	},

	getFanJiString: function (jipai, ignoreYaoJi) {
		var jipaistring = [];
		//翻到9筒
		if (jipai == 8) {
			jipaistring.push("上鸡");
		}
		//翻到9条
		else if (jipai == 17) {
			jipaistring.push("上鸡");
		}
		//翻到9万
		else if (jipai == 26) {
			jipaistring.push("上鸡");
		}
		else {
			jipaistring.push("上鸡");
		}



		//如果是摇摆鸡
		if (cc.vv.gameNetMgr.conf && cc.vv.gameNetMgr.conf.fanJi == 1) {
			//翻到1筒 则9筒的下鸡
			if (jipai == 0) {
				jipaistring.push("下鸡");
			}
			//翻到幺鸡 则9条的下鸡
			else if (jipai == 9) {
				jipaistring.push("下鸡");
			}
			//翻到2条
			else if (jipai == 10) {
				jipaistring.push("下鸡");
			}
			//翻到1万 则9万的下鸡
			else if (jipai == 18) {
				jipaistring.push("下鸡");
			}
			else {
				jipaistring.push("下鸡");
			}
		}
		return jipaistring;
	},

	getFanJi: function (jipai, ignoreYaoJi) {
		var jipaiarr = [];
		var jipaistring = [];
		//翻到9筒
		if (jipai == 8) {
			jipaiarr.push(0);
			jipaistring.push("上鸡");
		}
		//翻到9条
		else if (jipai == 17) {
			//幺鸡不需要再放进去了。
			if (!ignoreYaoJi) {
				jipaiarr.push(9);
			}
		}
		//翻到9万
		else if (jipai == 26) {
			jipaiarr.push(18);
		}
		else {
			jipaiarr.push(jipai + 1);
		}

		//如果是摇摆鸡
		if (cc.vv.gameNetMgr.conf && cc.vv.gameNetMgr.conf.fanJi == 1) {
			//翻到1筒 则9筒的下鸡
			if (jipai == 0) {
				jipaiarr.push(8);
			}
			//翻到幺鸡 则9条的下鸡
			else if (jipai == 9) {
				jipaiarr.push(17);
			}
			//翻到2条
			else if (jipai == 10) {
				//幺鸡不需要再放进去了。  
				if (!ignoreYaoJi) {
					jipaiarr.push(9);
				}
			}
			//翻到1万 则9万的下鸡
			else if (jipai == 18) {
				jipaiarr.push(26);
			}
			else {
				//如果不是幺鸡，则放进去
				if (jipai - 1 != 9) {
					jipaiarr.push(jipai - 1);
				}
			}
		}
		return jipaiarr;
	},

	getNumOfJi: function (sd, ji, isjinji) {
		var numofji = 0;

		if (sd.quansao && sd.istinged) {
			return numofji;
		}

		if (sd.quansao && ji != 9 && ji != 7) {
			return numofji;
		}

		//未听牌的玩家，翻鸡数目一律为0
		if (ji != 9 && !sd.istinged && ji != 7) {
			return numofji;
		}

		//听牌的玩家，才统计未打出的鸡
		if (sd.istinged) {
			for (var j = 0; j < sd.holds.length; ++j) {
				if (sd.holds[j] == ji) {
					numofji += 1;
				}
			}
			if (ji == 9) {
				numofji *= 2;
			}

			if (sd.pengs.indexOf(ji) != -1) {
				numofji += 3;
			}
			else if (sd.diangangs.indexOf(ji) != -1 || sd.wangangs.indexOf(ji) != -1 || sd.angangs.indexOf(ji) != -1) {
				numofji += 4;
			}
		} else if (ji == 9 || (ji == 7 && cc.vv.gameNetMgr.conf.wuguji)) {
			//如果没听牌查询碰杠里面是否有幺鸡
			if (sd.pengs.indexOf(ji) != -1) {
				numofji += 3;
			}
			else if (sd.diangangs.indexOf(ji) != -1 || sd.wangangs.indexOf(ji) != -1 || sd.angangs.indexOf(ji) != -1) {
				numofji += 4;
			}
		}
		if (isjinji && ji == 9) {
			numofji *= 3;
		}
		if (sd.folds) {
			if (ji == 9 || cc.vv.gameNetMgr.conf.manTangJi || (ji == 7 && cc.vv.gameNetMgr.conf.wuguji)) {
				for (var j = 0; j < sd.folds.length; ++j) {
					if (sd.folds[j] == ji) {
						numofji += 1;
					}
				}
			}
		}

		return numofji;
	},

	setJings: function (jings) {
		setJings(jings);
	},

	isJing: function (pai) {
		return jingMap[pai] != null;
	},

	updateTingMap: function (seatData, jings) {
		updateTingMap(seatData, jings);
	},

	//#write zzl CGloud

	getOpenId: function(account){
		var openid = -1;
		openid = account.substring(3);
		return openid;
	},


	getMJType: getMJType,
	// called every frame, uncomment this function to activate update callback
	// update: function (dt) {

	// },
});
