let http = require('http');
async function httpGet(url) {
    return new Promise(function (resolve, reject) {
        let body = '';
        http.get(url, function (res) {
            res.setEncoding('utf-8');
            res.on("data", function (data) {
                body += data;
            })
            res.on("end", function () {
                if (body == 'ok') {
                    resolve(0);
                } else {
                    resolve(1);
                    console.log('not ok')
                }
            })
            res.on('error', function () {
                resolve(1);
                console.log('res err')
            })
        }).on("error", function (data) {
            resolve(1);
            console.log('http err')
        })
    });
}

async function diamond(iFrom, iTo, iDiamond) {
    return await httpGet('http://127.0.0.1:9000/diamond?iFrom=' + iFrom + '&iTo=' + iTo + '&iDiamond=' + iDiamond);
}

module.exports = {
    diamond: diamond
}