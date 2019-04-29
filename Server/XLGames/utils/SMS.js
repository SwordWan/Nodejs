var http = require('http')
var urlencode = require("urlencode");
var config  = require('../../webapp/configs')

function sendSMS_Zhongzh(phone, code, cb) {
	var params = [];
	params.push('id=' + config.sms.appID);
	params.push('pwd=' + config.sms.appKey);
	params.push('to=' + phone);
	message = config.sms.register.message.replace('[code]', code);
	params.push('content=' + urlencode(message, 'gb2312'));
	var url = 'http://service.winic.org:8009/sys_port/gateway/index.asp?';
	url += params.join('&');
	let req = http.get(url, function (res) {
		let body = '';
		res.setEncoding('utf8');
		res.on('data', function (chunk) {
			body += chunk;
		});
		res.on('end', function () {
			try {
				if (body.startsWith('000/')) {
					cb({
						errcode: 0,
						errmsg: ''
					});
				} else {
					cb({
						errcode: -2,
						errmsg: '短信发送失败。'
					});
				}
			} catch (e) {
				cb({
					errcode: -2,
					errmsg: e.message
				});
			}
		});
	});
	req.on('error', function (e) {
		cb({
			errcode: -1,
			errmsg: e.message
		});
	});
	req.end();
}
module.exports = sendSMS_Zhongzh;