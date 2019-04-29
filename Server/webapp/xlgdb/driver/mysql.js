let mysql = require('mysql');
let pool;

var getConnectionPromise = function () {
    return new Promise(function (resolve, reject) {
        pool.getConnection(function (err, connection) {
            resolve({ err: err, result: connection });
        });
    });
};

var queryPromise = function (connection, sql, param) {
    return new Promise(function (resolve, reject) {
        connection.query(sql, param, function (err, result) {
            resolve({ err: err, result: result });
        });
    });
};

var beginTransactionPromise = function (connection) {
    return new Promise(function (resolve, reject) {
        connection.beginTransaction(function (err) {
            resolve(err);
        });
    });
};

var commitPromise = function (connection) {
    return new Promise(function (resolve, reject) {
        connection.commit(function (err) {
            resolve(err);
        });
    });
};

var rollbackPromise = function (connection) {
    return new Promise(function (resolve, reject) {
        connection.rollback(function (err) {
            resolve(err);
        });
    });
};

var closeConnectionPromise = function (connection) {
    return connection.release();
};

var mysqlHelper = function () {
    let _conn;
    let asyncConn = async function () {
        if (null == _conn) {
            let result = await getConnectionPromise();
            _conn = result.result;
        }
    }
    this.Query = async function (sql, param) {
        await asyncConn();
        let result = await queryPromise(_conn, sql, param);
        if (result.err) throw result.err;
        return result.result;
    }
    this.Transaction = async function () {
        try {
            await asyncConn();
            let result = await beginTransactionPromise(_conn);
            if (result) return false;
            return true;
        }
        catch (err) {
            return false;
        }
    }
    this.Commit = async function () {
        try {
            await asyncConn();
            let result = await commitPromise(_conn);
            if (result) return false;
            return true;
        }
        catch (err) {
            return false;
        }
    }
    this.Rollback = async function () {
        try {
            await asyncConn();
            let result = await rollbackPromise(_conn);
            if (result) return false;
            return true;
        }
        catch (err) {
            return false;
        }
    }
    this.Release = function () {
        if (null != _conn) {
            closeConnectionPromise(_conn);
            _conn = null;
        }
    }
}

module.exports = {
    init: function (config) {
        if (pool) {
            return console.log('inited....');
        }
        pool = mysql.createPool(config);
    },
    conn: mysqlHelper
};


// var doTest = async function()
// {
//     let sqlHelper = new mysqlHelper();
//     let sql = "INSERT INTO `dc_user` (`user`,`nickname`) VALUES(?,?)";
//     let param = ['chenchun' ,'陈春2'];
//     let result = await sqlHelper.Transaction();
//     result = await sqlHelper.Query(sql ,param);
//     //result = await rollback(conn.result);
//     result = await sqlHelper.Commit();
//     await sqlHelper.Release();
// };

// doTest();