'use strict';
var debug = require('debug')('loopback:connector:cordova-sqlite:transaction');
var SQLiteMemoryTransaction = require('./memoryTransactionPrimitive');
module.exports = mixinTransaction;

/**
 * @param {SQLiteDB} SQLiteDB connector class
 */
function mixinTransaction(SQLiteDB) {
  /**
   * Begin a new transaction
   * @param isolationLevel
   * @param cb
   */
  SQLiteDB.prototype.beginTransaction = function(isolationLevel, cb) {
    debug('Begin a transaction (SQLite - ignoring isolation level: %s)', isolationLevel);

    var memoryTransactionPrimitive = new SQLiteMemoryTransaction(this);
    // @todo: this should probably be deferred via setTimeout or nextTick
    cb(null, memoryTransactionPrimitive);
  };

  /**
   *
   * @param connection
   * @param cb
   */
  SQLiteDB.prototype.commit = function(connection, cb) {
    debug('Commit a transaction');
    connection.commit(cb);
  };

  /**
   *
   * @param connection
   * @param cb
   */
  SQLiteDB.prototype.rollback = function(connection, cb) {
    debug('Rollback a transaction');
    connection.rollback(cb);
  };
}
