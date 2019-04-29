var AppConfigs = require("../configs_win");
var SysUtils = require("../utils/SysUtils");

var ErrorUtils = require("../utils/ErrorCodes");
var ErrorCodes = ErrorUtils.ErrorCodes;

var GSSockets = {};   // 游戏服务器socket

function AddClient(szKey, pSocket) {
    GSSockets[szKey] = pSocket;
}
exports.AddClient = AddClient;

function RemoveClient(szKey) {
    var pSocket = GSSockets[szKey];
    if (pSocket != null) {
        delete GSSockets[szKey];
        console.log("remove client(" + szKey + ")");
    }
}
exports.RemoveClient = RemoveClient;