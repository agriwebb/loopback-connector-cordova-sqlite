/**
 * Created by tushar-chauhan on 13-Mar-2015
 */

//var sqlite3 = require('sqlite3');

var SQLiteDB = require('./sqlite3db');
//var SQLitePlugin = require('./SQLitePlugin');

//var debug = require('debug')('loopback:connector:sqlite');

/**
 * Initialize the SQLite connector for the given data source
 * @param {DataSource} dataSource The data source instance
 * @param {Function} [callback] The callback function
 */
exports.initialize = function initializeDataSource(dataSource, callback) {
    //if (!sqlite3) {
    //  return;
    //}


//	var db = openDatabase('mydb', '1.0', 'Test DB', 2 * 1024 * 1024);
//	var msg;
//
//	db.transaction(function (tx) {
//		tx.executeSql('CREATE TABLE IF NOT EXISTS LOGS (id unique, log)');
//		tx.executeSql('INSERT INTO LOGS (id, log) VALUES (1, "foobar")');
//		tx.executeSql('INSERT INTO LOGS (id, log) VALUES (2, "logmsg")');
//		msg = '<p>Log message created and row inserted.</p>';
//		document.querySelector('#status').innerHTML =  msg;
//	});
//
//	db.transaction(function (tx) {
//		tx.executeSql('SELECT * FROM LOGS', [], function (tx, results) {
//			var len = results.rows.length, i;
//			msg = "<p>Found rows: " + len + "</p>";
//			document.querySelector('#status').innerHTML +=  msg;
//			for (i = 0; i < len; i++){
//				msg = "<p><b>" + results.rows.item(i).log + "</b></p>";
//				document.querySelector('#status').innerHTML +=  msg;
//			}
//		}, null);
//	});

    if (sqlitePlugin) {
        var dbSettings = dataSource.settings || {};
        var connector = new SQLiteDB(sqlitePlugin, dbSettings);
        dataSource.connector = connector;
        dataSource.connector.dataSource = dataSource;
        dataSource.connector.dataSource.log = function (msg) {
            console.log(msg);
        };

        if (callback) {
            dataSource.connector.connect(callback);
//            process.nextTick(callback);
        }
    }
};
