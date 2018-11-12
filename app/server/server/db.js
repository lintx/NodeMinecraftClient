if (!global.db) {
    let pool = require('mysql').createPool(require('../../config/db'));
    // global.db.connect();
    global.db = {
        query:function (sql, arr, callback) {
            pool.getConnection(function (err, connection) {
                if (err) {
                    console.log(err);
                    return;
                }
                connection.query(sql,arr,function (error, results, fields) {
                    connection.release();
                    callback(error,results,fields);
                });
            });
        }
    };
}

