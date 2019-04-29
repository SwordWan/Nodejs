var fs = require("fs");
var path = require('path');

// 生成 iMinVal <= RandVal <= iMaxVal 的随机数
function GenRandValue(iMinVal, iMaxVal) {
    var Result = iMinVal + Math.random() * (iMaxVal - iMinVal + 1);
    Result = Math.floor(Result);

    return Result;
}

function IsOneCentOf(iNumber) {
    var iRet = GenRandValue(1, iNumber);
    return (iRet == 1);
}

function GenRandCodes(iCodeLen) {
    var Result = 0;
    var szNumber = "";

    while (true) {
        var iNumVal = Math.floor(Math.random() * 10);
        szNumber = szNumber + iNumVal;

        if (szNumber[0] == '0') {
            szNumber = "";
        }

        if (szNumber.length == iCodeLen) {
            Result = parseInt(szNumber);
            break;
        }
    }

    return Result;
}

// 根据经纬度计算2个之间的距离
exports.GetDistance = function (pUserObj1, pUserObj2) {
    var fRet = -1;

    // 经纬度转换成三角函数中度分表形式
    function Rad(fValue) {
        return fValue * Math.PI / 180.0;
    }

    if (pUserObj1 != pUserObj2) {
        if ((pUserObj1 != null) && (pUserObj2 != null)) {
            if ((pUserObj1.fLat == 0) || (pUserObj1.fLon == 0)) return 0;
            if ((pUserObj2.fLat == 0) || (pUserObj2.fLon == 0)) return 0;

            var radLat1 = Rad(pUserObj1.fLat);
            var radLat2 = Rad(pUserObj2.fLat);

            var fVal1 = radLat1 - radLat2;
            var fVal2 = Rad(pUserObj1.fLon) - Rad(pUserObj2.fLon);
            fRet = 2 * Math.asin(
                Math.sqrt(
                    Math.pow(Math.sin(fVal1 / 2), 2) +
                    Math.cos(radLat1) * Math.cos(radLat2) * Math.pow(Math.sin(fVal2 / 2), 2)
                )
            );
            fRet = fRet * 6378.137;   // EARTH_RADIUS;
            fRet = Math.round(fRet * 10000) / 10000;
        }
    }

    return fRet;
}

function GetWhereStr(pArray) {
    var Result = "(";

    for (var iIndex = 0; iIndex < pArray.length; ++iIndex) {
        var sKey = pArray[iIndex];
        if (Result.length > 1) {
            Result = Result + ", " + sKey;
        }
        else {
            Result = Result + sKey;
        }
    }
    Result = Result + ")";

    return Result;
}
exports.GetWhereStr = GetWhereStr;



function GetGroup(data, index = 0, group = []) {
    let need_apply = new Array();
    need_apply.push(data[index]);
    for (var i = 0; i < group.length; i++) {
        need_apply.push(group[i] + data[index]);
    }
    group.push.apply(group, need_apply);

    if (index + 1 >= data.length) return group;
    else return GetGroup(data, index + 1, group);
}

// 读取配置文件
function GetAppConfig() {
    var Result = null;

    var pData = fs.readFileSync("./AppCfg.cfg", "utf8");
    if (pData != null) {
        Result = JSON.parse(pData);
    }

    return Result;
}

// 字符串转 JSON 对象
function GetJsonObj(szText) {
    var Result = {};

    try {
        Result = JSON.parse(szText);
    }
    catch (error) {
        Result = null;
    }

    return Result;
}

// 读文本文件，返回字符串数组
function ReadTextFile(szFileName) {
    var Result = [];
    var szLines = fs.readFileSync(szFileName, "utf8");

    var iPos = 0;
    var iOffset = 0;
    while (true) {
        iPos = szLines.indexOf("\n", iOffset);
        if (iPos == -1) break;

        var szLine = szLines.substr(iOffset, iPos - iOffset);
        var iPosR = szLine.indexOf("\r");
        if (iPosR != -1) {
            szLine = szLine.substring(0, iPosR) + szLine.substring(iPosR + 1, szLine.length);
        }
        Result.push(szLine);

        iOffset = iPos + 1;
    }
    if (iOffset < szLines.length - 1) {
        var szLine = szLines.substr(iOffset);
        Result.push(szLine);
    }

    return Result;
}

// 创建用户目录
function CreateUserDirectory(iUserId, iMode) {
    var szDir = path.resolve("./Images");
    szDir = szDir + "\\" + iMode + "\\" + iUserId;

    try {
        var pStat = fs.statSync(szDir);
        if (!pStat.isDirectory()) fs.mkdirSync(szDir);
    }
    catch (err) {
        if (err.code == "ENOENT") {
            fs.mkdirSync(szDir);
        }
    }
}

function GetUserHeadIco(iUserId) {
    return "./Images/1/" + iUserId + "/headico.jpg";
}
exports.GetUserHeadIco = GetUserHeadIco;

function GetClubIco(iClubId) {
    return "./Images/2/" + iClubId + "/clubico.jpg";
}
exports.GetClubIco = GetClubIco;

function SaveImageFile(pBytes, iUserId, iMode, szFileName, callback) {
    var szDir = "./Images/" + iMode + "/" + iUserId;
    var szFileName = szDir + "/" + szFileName;

    if (fs.existsSync(szFileName)) {
        fs.unlinkSync(szFileName);
    }
    // fs.appendFileSync(szFileName, pBytes);
    // callback(szFileName);
    fs.appendFile(szFileName, pBytes, function (err) {
        if (err) {
            console.error(err);
            callback(null);
        }
        else {
            callback(szFileName);
        }
    });
    // }
    // else {
    //     fs.writeFile(szFileName, pBytes, function(err) {
    //         if(err) {
    //             console.error(err);
    //             callback(null);
    //         }
    //         else {
    //             callback(szFileName);
    //         }
    //     });
    // }
}

function WriteLogFile(szText, szFileName) {
    fs.appendFileSync("./logs/" + szFileName, szText + "\n", null);
}

// 函数导出
exports.GenRandValue = GenRandValue;
exports.IsOneCentOf = IsOneCentOf;
exports.GenRandCodes = GenRandCodes;
exports.GenNumber = GenRandCodes;
exports.GetGroup = GetGroup;
exports.GetAppConfig = GetAppConfig;
exports.GetJsonObj = GetJsonObj;
exports.ReadTextFile = ReadTextFile;
exports.CreateUserDirectory = CreateUserDirectory;
exports.SaveImageFile = SaveImageFile;
exports.WriteLogFile = WriteLogFile;

String.prototype.format = function (args) {
    var result = this;
    if (arguments.length > 0) {
        if (arguments.length == 1 && typeof (args) == "object") {
            for (var key in args) {
                if (args[key] != undefined) {
                    var reg = new RegExp("({" + key + "})", "g");
                    result = result.replace(reg, args[key]);
                }
            }
        }
        else {
            for (var i = 0; i < arguments.length; i++) {
                if (arguments[i] != undefined) {
                    //var reg = new RegExp("({[" + i + "]})", "g");//这个在索引大于9时会有问题，谢谢何以笙箫的指出
                    var reg = new RegExp("({)" + i + "(})", "g");
                    result = result.replace(reg, arguments[i]);
                }
            }
        }
    }
    return result;
};

Date.prototype.Format = function (fmt) {
    var o = {
        "M+": this.getMonth() + 1, //月份 
        "d+": this.getDate(), //日 
        "h+": this.getHours(), //小时 
        "m+": this.getMinutes(), //分 
        "s+": this.getSeconds(), //秒 
        "q+": Math.floor((this.getMonth() + 3) / 3), //季度 
        "S": this.getMilliseconds() //毫秒 
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
        if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
}
