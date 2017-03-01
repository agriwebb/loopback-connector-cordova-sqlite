function noop() {}

/**
 * @constructor
 * SQLite Deferred Operation abstraction for pseudo transactions.
 * Wraps the SQLitePluginTransaction `executeSql` statement
 * @param {string} sql SQL string of the batched operation
 * @param {Array} values SQL parameters
 * @param {Function} success Cordova success callback
 * @param {Function} error Cordova error callback
 */
var SQLiteMemoryTransactionDeferredOperation = function(sql, values, success, error) {
  this.sql = sql;
  this.values = values;
  this.success = success;
  this.error = error;
}

/**
 * Execute the deferred operation against the provided SQLitePluginTransaction instance
 * @param {SQLitePluginTransaction} tx Transaction object
 */
SQLiteMemoryTransactionDeferredOperation.prototype.execute = function (tx) {
  tx.executeSql(this.sql, this.values, this.success, this.error);
}

/**
 * @constructor
 * Pseudo memory-backed implementation of transactions to queue all operations
 * and execute inside a single transaction run operation, to get around limitations
 * of the cordova sqlite storage transaction implementation. Using this Transaction
 * class *does not* actually provide any safety or locking during the scope of the 
 * transaction. It is useful only for queuing operations over a period of time.
 * @param {SQLiteDB} sqliteDb SQLiteDB instance to execute operations against
 */
var SQLiteMemoryTransaction = function(sqliteDb) {
  this.sqliteDb = sqliteDb;
  this.operations = [];
  this.finalized = false;
};

/**
 * Defers execution of SQL against a SQLitePluginTransaction object to be executed later
 * @param {string} sql SQL string of the operation
 * @param {Array} values SQL parameters
 * @param {Function} success Cordova success callback
 * @param {Function} error Cordova error callback
 */
SQLiteMemoryTransaction.prototype.executeSql = function (sql, values, success, error) {
  this.operations.push(new SQLiteMemoryTransactionDeferredOperation(sql, values, success, error));
}

/**
 * Execute the deferred transaction in the scope of a real transaction
 * @param {Function} cb Commit callback
 */
SQLiteMemoryTransaction.prototype.commit = function (cb) {
  if (this.finalized) {
    setTimeout((cb || noop).bind(null, new Error('Transaction is finalized')));
    return;
  }

  var successHandler = (cb || noop).bind(null, null);
  var errorHandler = (cb || noop).bind(null);
  var self = this;

  this.finalized = true;

  this.sqliteDb.client.transaction(function (tx) {
    self.operations.forEach(function (operation) {
      operation.execute(tx);
    });
  }, successHandler, errorHandler);
}

/**
 * Rollback the deferred transaction in the scope of a real transaction
 * This effectively just executes the batched statements against the database
 * so doesn't need to do anything explicitly. Rollback in the case of a SQL
 * error will occur as part of the internal error handling on commit.
 * @param {Function} cb Rollback callback
 */
SQLiteMemoryTransaction.prototype.rollback = function (cb) {
  if (this.finalized) {
    setTimeout((cb || noop).bind(null, new Error('Transaction is finalized')));
    return;
  }

  this.finalized = true;
  this.operations = [];

  setTimeout((cb || noop).bind(null, null), 0);
}

module.exports = SQLiteMemoryTransaction;
