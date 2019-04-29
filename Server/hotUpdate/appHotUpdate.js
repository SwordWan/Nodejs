/**
 * orientations 0横屏 1竖屏
 * resolution_policy_sizes 设计模式 -1 忽略 0 SHOW_ALL 1 FIXED_WIDTH 2 FIXED_HEIGHT 3 NO_BORDER
 * download_first 0加载时不下载 1加载时下载
 * 
 */
var express = require('express');
var fs = require('fs');
var app = express();
app.use(express.static(__dirname + '/public'));
//设置跨域访问
app.all('*', function (req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "X-Requested-With");
	res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
	// res.header("X-Powered-By", ' 3.2.1');
	// res.header("Content-Type", "application/json;charset=utf-8");
	next();
});
app.listen(9101, function () {
	console.log('express启动并监听【9101】端口');
});

/**
 * 加入热更新
 * get_subgame_list_info接口增加数据结构
 * 原来的数据结构
 * { errcode: 0, run_game: run_game, subgame_list_info: [] };
 * 现在的数据结构
 * { 
 * errcode: 0, 
 * run_game: run_game, 
 * native_ios_ver:1,
 * native_android_ver:1
 * zip_http: 'http://192.168.0.100:9231/hot-update/project.manifest', 
 * subgame_list_info: [] 
 * };
 * 
 */