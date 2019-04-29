
var http = require('http');
var querystring = require('querystring');

function http2(_host, _port) {
    let host = _host;
    let port = _port;
    this.get = function (path, data) {
        return new Promise(function (resolve, reject) {
            let content = querystring.stringify(data);
            let options = {
                hostname: host,
                port: port,
                path: path + '?' + content,
                method: 'GET',
            }
            //创建请求
            let body = '';
            let req = http.request(options, function (res) {
                res.setEncoding('utf-8');
                res.on('data', function (chunk) {
                    body += chunk;
                });
                // res.on('error', function () {
                //     resolve(null);
                // });
                res.on('end', function () {
                    let o = null;
                    try {
                        o = JSON.parse(body);
                    } catch (e) {

                    }
                    resolve(o);
                });
            });
            req.on('error', function (err) {
                resolve(null);
            });
            req.end();
        });
    }
    this.post = function (path, data) {
        return new Promise(function (resolve, reject) {
            let post_data = JSON.stringify(data);
            let options = {
                method: "POST",
                host: host,
                port: port,
                path: path,
                headers: {
                    "Content-Type": 'application/json'
                }
            };
            let body = '';
            let req = http.request(options, function (res) {
                res.setEncoding('utf8');
                res.on('data', function (chunk) {
                    body += chunk;
                });
                // res.on('error', function (err) {
                //     resolve(null);
                // });
                res.on('end', function () {
                    let o = null;
                    try {
                        o = JSON.parse(body);
                    } catch (e) {
                        err = e;
                    }
                    resolve(o);
                });
            });
            req.on('error', function (err) {
                resolve(null);
            });
            req.write(post_data);
            req.end();
        });
    }
}

module.exports = http2;