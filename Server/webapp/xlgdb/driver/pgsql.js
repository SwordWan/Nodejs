let pg = require('pg');
let pool;

var getConnectionPromise = function () {
    return new Promise(function (resolve, reject) {
        pool.connect(function (err, connection) {
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

var closeConnectionPromise = function (connection) {
    return connection.release();
};

var pgsql = function () {
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
            let result = await queryPromise(_conn, 'BEGIN', []);
            if (result.err) return false;
            return true;
        }
        catch (err) {
            return false;
        }
    }
    this.Commit = async function () {
        try {
            await asyncConn();
            let result = await queryPromise(_conn, 'COMMIT', []);
            if (result.err) return false;
            return true;
        }
        catch (err) {
            return false;
        }
    }
    this.Rollback = async function () {
        try {
            await asyncConn();
            let result = await queryPromise(_conn, 'ROLLBACK', []);
            if (result.err) return false;
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
        pool = pg.Pool(config);
    },
    conn: pgsql
};


// var doTest = async function () {
//     let conn = new pgsql();
//     let sql = 'SELECT "password" FROM "tb_users" WHERE  "account" = $1';
//     let param = ['chenchun2'];
//     // let sql = 'INSERT INTO "tb_users" ("account" ,"userid") values ($1,$2)';
//     // let param = ['chenchun','12'];
//     let result = await conn.Transaction();
//     result = await conn.Query(sql, param);
//     //result = await rollback(conn.result);
//     result = await conn.Commit();
//     // result = await conn.Rollback();
//     await conn.Release();
// };

// doTest();