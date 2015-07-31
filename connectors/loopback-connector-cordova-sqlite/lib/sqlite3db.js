/**
 * Created by tushar-chauhan on 13-Mar-2015
 */

var SqlConnector = require('loopback-connector').SqlConnector,
    util = require('util'),
    async = require('async');
var debug = require('debug')('loopback:connector:sqlite');

var NAME = 'sqlite3';

var client = null,
    file_name = null,
    current_order = [];

/**
 * Constructor for SQLite connector
 * @param {Object} settings The settings object
 * @param {DataSource} dataSource The data source
 * instance
 * @constructor
 */
var SQLiteDB = function (sqlite3, dbSettings) {
    if (!(this instanceof SQLiteDB)) {
        return new SQLiteDB(sqlite3, dbSettings);
    }

    SqlConnector.call(this, NAME, dbSettings);

    this.name = NAME;
    this.settings = dbSettings;
    this.sqlite3 = sqlite3;
    this.debug = dbSettings.debug;
    this.current_order = [];
    this.file_name = dbSettings.file_name;

    if (this.debug) {
        debug('Settings %j', dbSettings);
    }
};

module.exports = SQLiteDB;
util.inherits(SQLiteDB, SqlConnector);

/**
 * Get the default data type for ID
 * @returns {Function} The default type for ID
 */
SQLiteDB.prototype.getDefaultIdType = function () {
    return Number;
};

/**
 * Connect to the Database
 * @param callback
 */
SQLiteDB.prototype.connect = function (callback) {
    var self = this;
//  file_name = ((self.file_name != null) ? ("./" + self.file_name) : ":memory:");
//  client = new self.sqlite3.Database(file_name, self.sqlite3.OPEN_READWRITE | self.sqlite3.OPEN_CREATE, function(error){
//    if(error != null){
//      if(self.debug) {
//        self.log("Not Connected", error);
//      }
//      callback(error, null);
//    } else {
//      if(self.debug) {
//        self.log("Connected to Database!");
//      }
//      callback(null, 'Connected');
//    }
//  });

    client = self.sqlite3.openDatabase({name: "DB"});
    callback(null, 'Connected');
};

SQLiteDB.prototype.getTypes = function onGetTypes() {
    return ['db', 'sqlite', 'sqlite3'];
};

SQLiteDB.prototype.debug = function () {
    if (this.settings.debug) {
        debug.apply(debug, arguments);
    }
};

SQLiteDB.prototype.disconnect = function disconnect(cb) {
    client.close(cb);
};

SQLiteDB.prototype.ping = function (cb) {
    this.query('SELECT 100 AS result', [], cb);
};

SQLiteDB.prototype.executeSQL = function (sql, params, callback) {

    window.sqlStmtIndx = window.sqlStmtIndx || 0;
    var sqlStmtIndx_ = window.sqlStmtIndx; // cache this value for use in closure, since window.sqlStmtIndx is updated by multiple closures, and hence reports incorrect value when logged.
    var self = this;
    var time = Date.now();
    var log = self.log;

    if (self.settings.debug) {
        if (params && params.length > 0) {
            debug('SQL: ' + sql + '\nParameters: ' + params);
        } else {
            debug('SQL: ' + sql);
        }
    }

    if (params.status && sql.startsWith('PRAGMA')) {
        var stmt = client.prepare(sql);
        client.all(sql, function (err, rows) {
            // if(err) console.error(err);
            if (err && self.settings.debug) {
                debug(err);
            }
            if (self.settings.debug && rows) debug("%j", rows);
            if (self.debug) {
                log(sql, time);
                // log(rows, time);
            }

            var new_rows = [];
            for (var i = 0; i < rows.length; i++) {
                var temp = {};
                temp['column'] = rows[i].name;
                temp['type'] = rows[i].type;
                temp['nullable'] = (rows[i].notnull == 0) ? 'YES' : 'NO';
                new_rows.push(temp);
            }

            callback(err ? err : null, new_rows);
        });
    } else if (sql.startsWith('INSERT') || sql.startsWith('UPDATE') ||
        sql.startsWith('DELETE') || sql.startsWith('CREATE') || sql.startsWith('DROP')) {

//        client.run(sql, params, function (err) {
//            // if(err) console.error(err);
//            var data = this;
//            if (err && self.settings.debug) {
//                debug(err);
//            }
//            if (self.settings.debug && data) debug("%j", data);
//            if (self.debug) {
//                log(sql, time);
//                // log("Last inserted id: " + data.lastID, time);
//            }
//
//            var result = null;
//
//            if (sql.startsWith('UPDATE') || sql.startsWith('DELETE')) {
//                result = {count: data.changes};
//            } else {
//                result = data.lastID;
//            }
//            if (err) {
//                log(sql, err);
//            }
//            callback(err ? err : null, result);
//        });


        function iudcdQueryDB(tx) {
            //tx.executeSql('SELECT * FROM DEMO', [], querySuccess, errorCB);
            tx.executeSql(sql, params, iudcdQuerySuccess, iudcdErrorCB);
        }

        function iudcdQuerySuccess(tx, results) {
            var result;
            var data = results;

            if (sql.startsWith('UPDATE') || sql.startsWith('DELETE')) {
                result = {count: data.changes};
            } else {
                result = data.lastID;
            }

            console.log('aPASS ' + sqlStmtIndx_ + ': ' + sql);
            callback(null, result);
        }

        function iudcdErrorCB(err) {
//            alert("Error processing SQL: " + err.code);

            console.log('aFAIL ' + sqlStmtIndx_ + ': ' + sql);
            callback(err, null);
        }

        client.transaction(iudcdQueryDB, iudcdErrorCB);
        window.sqlStmtIndx++;

    } else {
        //client.all(sql, params, function(err, rows) {
        //  // if(err) console.error(err);
        //  if (err && self.settings.debug) {
        //    debug(err);
        //  }
        //  if (self.settings.debug && rows) debug("%j", rows);
        //  if (self.debug) {
        //    log(sql, time);
        //    // log(rows, time);
        //  }
        //
        //  callback(err ? err : null, rows);
        //});
        function queryDB(tx) {
            //tx.executeSql('SELECT * FROM DEMO', [], querySuccess, errorCB);
            tx.executeSql(sql, params, querySuccess, errorCB);
        }

        function querySuccess(tx, results) {
//            console.log("Returned rows = " + results.rows.length);
            // this will be true since it was a select statement and so rowsAffected was 0

//            if (!results.rowsAffected) {
//                console.log('No rows affected!');
//                return false;
//            }
//            // for an insert statement, this property will return the ID of the last inserted row
//            console.log("Last inserted row ID = " + results.insertId);

            console.log('bPASS ' + sqlStmtIndx_ + ': ' + sql);
            callback(null, results.row);
        }

        function errorCB(err) {
//            alert("Error processing SQL: " + err.code);

            console.log('bFAIL ' + sqlStmtIndx_ + ': ' + sql);
            callback(err, null);
        }

        client.transaction(queryDB, errorCB);
        window.sqlStmtIndx++;
    }
};

SQLiteDB.prototype.query = function (sql, params, callback) {

    if (!callback && typeof params === 'function') {
        callback = params;
        params = [];
    }

    params = params || [];

    for (var i = 0; i < params.length; i++) {
        if (typeof params[i] == 'object') {
            // Exclude Date objects from getting converted
            if (isNaN(new Date(params[i]).getTime())) {
                params[i] = JSON.stringify(params[i]);
            }
        }
    }

    var cb = callback || function (err, result) {
    };
    this.executeSQL(sql, params, cb);
};


SQLiteDB.prototype.tableEscaped = function (model) {
    return this.escapeName(this.table(model));
};

SQLiteDB.prototype.escapeName = function (name) {
    if (!name) {
        return name;
    }
    return '"' + name.replace(/\./g, '"."') + '"';
};


/*!
 * Discover the properties from a table
 * @param {String} model The model name
 * @param {Function} cb The callback function
 */
function getTableStatus(model, cb) {
    function decoratedCallback(err, data) {
        if (err) {
            console.error(err);
        }
        if (!err) {
            data.forEach(function (field) {
                field.type = mapSQLiteDatatypes(field.type);
            });
        }
        cb(err, data);
    }

    var sql = null;
    sql = 'PRAGMA table_info(' + this.table(model) + ')';
    var params = {}
    params.status = true;
    this.query(sql, params, decoratedCallback);
}

function mapSQLiteDatatypes(typeName) {
    return typeName;
}

/**
 * Perform autoupdate for the given models
 * @param {String[]} [models] A model name or an array of model names. If not present, apply to all models
 * @callback {Function} [callback] The callback function
 * @param {String|Error} err The error string or object
 */
SQLiteDB.prototype.autoupdate = function (models, cb) {
    var self = this;
    if ((!cb) && ('function' === typeof models)) {
        cb = models;
        models = undefined;
    }
    // First argument is a model name
    if ('string' === typeof models) {
        models = [models];
    }

    models = models || Object.keys(this._models);

    async.each(models, function (model, done) {
        if (!(model in self._models)) {
            return process.nextTick(function () {
                done(new Error('Model not found: ' + model));
            });
        }
        getTableStatus.call(self, model, function (err, fields) {
            if (!err && fields.length) {
                self.alterTable(model, fields, done);
            } else {
                self.createTable(model, done);
            }
        });
    }, cb);
};

/*!
 * Check if the models exist
 * @param {String[]} [models] A model name or an array of model names. If not present, apply to all models
 * @param {Function} [cb] The callback function
 */
SQLiteDB.prototype.isActual = function (models, cb) {
    var self = this;

    if ((!cb) && ('function' === typeof models)) {
        cb = models;
        models = undefined;
    }
    // First argument is a model name
    if ('string' === typeof models) {
        models = [models];
    }

    models = models || Object.keys(this._models);

    var changes = [];
    async.each(models, function (model, done) {
        getTableStatus.call(self, model, function (err, fields) {
            changes = changes.concat(getAddModifyColumns.call(self, model, fields));
            changes = changes.concat(getDropColumns.call(self, model, fields));
            done(err);
        });
    }, function done(err) {
        if (err) {
            return cb && cb(err);
        }
        var actual = (changes.length === 0);
        cb && cb(null, actual);
    });
};

/*!
 * Alter the table for the given model
 * @param {String} model The model name
 * @param {Object[]} actualFields Actual columns in the table
 * @param {Function} [cb] The callback function
 */
SQLiteDB.prototype.alterTable = function (model, actualFields, cb) {
    var self = this;
    var pendingChanges = getAddModifyColumns.call(self, model, actualFields);
    if (pendingChanges.length > 0) {
        applySqlChanges.call(self, model, pendingChanges, function (err, results) {
            var dropColumns = getDropColumns.call(self, model, actualFields);
            if (dropColumns.length > 0) {
                applySqlChanges.call(self, model, dropColumns, cb);
            } else {
                cb && cb(err, results);
            }
        });
    } else {
        var dropColumns = getDropColumns.call(self, model, actualFields);
        if (dropColumns.length > 0) {
            applySqlChanges.call(self, model, dropColumns, cb);
        } else {
            cb && process.nextTick(cb.bind(null, null, []));
        }
    }
};

function getAddModifyColumns(model, actualFields) {
    var sql = [];
    var self = this;
    sql = sql.concat(getColumnsToAdd.call(self, model, actualFields));
    var drops = getPropertiesToModify.call(self, model, actualFields);
    if (drops.length > 0) {
        if (sql.length > 0) {
            sql = sql.concat(', ');
        }
        sql = sql.concat(drops);
    }
    // sql = sql.concat(getColumnsToDrop.call(self, model, actualFields));
    return sql;
}

function getDropColumns(model, actualFields) {
    var sql = [];
    var self = this;
    sql = sql.concat(getColumnsToDrop.call(self, model, actualFields));
    return sql;
}

function getColumnsToAdd(model, actualFields) {
    var self = this;
    var m = self._models[model];
    var propNames = Object.keys(m.properties);
    var sql = [];
    propNames.forEach(function (propName) {
        if (self.id(model, propName)) return;
        var found = searchForPropertyInActual.call(self, model, self.column(model, propName), actualFields);

        if (!found && propertyHasNotBeenDeleted.call(self, model, propName)) {
            sql.push('ADD COLUMN ' + addPropertyToActual.call(self, model, propName));
        }
    });
    if (sql.length > 0) {
        sql = [sql.join(', ')];
    }

    return sql;
}

function propertyHasNotBeenDeleted(model, propName) {
    return !!this._models[model].properties[propName];
}

function addPropertyToActual(model, propName) {
    var self = this;
    var sqlCommand = self.columnEscaped(model, propName)
        + ' ' + self.columnDataType(model, propName) + (propertyCanBeNull.call(self, model, propName) ? "" : " NOT NULL");
    return sqlCommand;
}

function searchForPropertyInActual(model, propName, actualFields) {
    var self = this;
    var found = false;
    actualFields.forEach(function (f) {
        if (f.column === self.column(model, propName)) {
            found = f;
            return;
        }
    });
    return found;
}

function getPropertiesToModify(model, actualFields) {
    var self = this;
    var sql = [];
    var m = self._models[model];
    var propNames = Object.keys(m.properties);
    var found;
    propNames.forEach(function (propName) {
        if (self.id(model, propName)) {
            return;
        }
        found = searchForPropertyInActual.call(self, model, propName, actualFields);
        if (found && propertyHasNotBeenDeleted.call(self, model, propName)) {
            if (datatypeChanged(propName, found)) {
                sql.push('ALTER COLUMN ' + modifyDatatypeInActual.call(self, model, propName));
            }
            if (nullabilityChanged(propName, found)) {
                sql.push('ALTER COLUMN' + modifyNullabilityInActual.call(self, model, propName));
            }
        }
    });

    if (sql.length > 0) {
        sql = [sql.join(', ')];
    }

    return sql;

    function datatypeChanged(propName, oldSettings) {
        var newSettings = m.properties[propName];
        if (!newSettings) {
            return false;
        }
        return oldSettings.type.toUpperCase() !== self.columnDataType(model, propName);
    }

    function isNullable(p) {
        return !(p.required ||
            p.id ||
            p.allowNull === false ||
            p.null === false ||
            p.nullable === false);
    }

    function nullabilityChanged(propName, oldSettings) {
        var newSettings = m.properties[propName];
        if (!newSettings) {
            return false;
        }
        var changed = false;
        if (oldSettings.nullable === 'YES' && !isNullable(newSettings)) {
            changed = true;
        }
        if (oldSettings.nullable === 'NO' && isNullable(newSettings)) {
            changed = true;
        }
        return changed;
    }
}

function modifyDatatypeInActual(model, propName) {
    var self = this;
    var sqlCommand = self.columnEscaped(model, propName) + ' TYPE ' +
        self.columnDataType(model, propName);
    return sqlCommand;
}

function modifyNullabilityInActual(model, propName) {
    var self = this;
    var sqlCommand = self.columnEscaped(model, propName) + ' ';
    if (propertyCanBeNull.call(self, model, propName)) {
        sqlCommand = sqlCommand + "DROP ";
    } else {
        sqlCommand = sqlCommand + "SET ";
    }
    sqlCommand = sqlCommand + "NOT NULL";
    return sqlCommand;
}

function getColumnsToDrop(model, actualFields) {
    var self = this;
    var sql = [];
    actualFields.forEach(function (actualField) {
        if (self.idColumn(model) === actualField.column) {
            return;
        }
        if (actualFieldNotPresentInModel(actualField, model)) {
            sql.push('DROP COLUMN ' + self.escapeName(actualField.column));
        }
    });
    if (sql.length > 0) {
        sql = [sql.join(', ')];
    }
    return sql;

    function actualFieldNotPresentInModel(actualField, model) {
        return !(self.propertyName(model, actualField.column));
    }
}

function applySqlChanges(model, pendingChanges, cb) {
    var self = this;
    if (pendingChanges.length) {
        var thisQuery = 'ALTER TABLE ' + self.tableEscaped(model);
        var ranOnce = false;
        pendingChanges.forEach(function (change) {
            if (ranOnce) {
                thisQuery = thisQuery + ' ';
            }
            thisQuery = thisQuery + ' ' + change;
            ranOnce = true;
        });
        // thisQuery = thisQuery + ';';
        self.query(thisQuery, cb);
    }
}


/*!
 * Build a list of columns for the given model
 * @param {String} model The model name
 * @returns {String}
 */
SQLiteDB.prototype.propertiesSQL = function (model) {
    var self = this;
    var sql = [];
    var pks = this.idNames(model).map(function (i) {
        return self.columnEscaped(model, i);
    });
    Object.keys(this._models[model].properties).forEach(function (prop) {
        var colName = self.columnEscaped(model, prop);
        sql.push(colName + ' ' + self.propertySettingsSQL(model, prop));
    });
    if (pks.length > 0) {
        sql.push('PRIMARY KEY(' + pks.join(',') + ')');
    }
    return sql.join(',\n  ');

};

/*!
 * Build settings for the model property
 * @param {String} model The model name
 * @param {String} propName The property name
 * @returns {*|string}
 */
SQLiteDB.prototype.propertySettingsSQL = function (model, propName) {
    var self = this;
    if (this.id(model, propName) && this._models[model].properties[propName].generated) {
        return 'INTEGER';
    }
    var result = self.columnDataType(model, propName);
    if (!propertyCanBeNull.call(self, model, propName)) result = result + ' NOT NULL';

    result += self.columnDbDefault(model, propName);
    return result;
};

/*!
 * Get the database-default value for column from given model property
 *
 * @param {String} model The model name
 * @param {String} property The property name
 * @returns {String} The column default value
 */
SQLiteDB.prototype.columnDbDefault = function (model, property) {
    var columnMetadata = this.columnMetadata(model, property);
    var colDefault = columnMetadata && columnMetadata.dbDefault;

    return colDefault ? (' DEFAULT ' + columnMetadata.dbDefault) : '';
};

SQLiteDB.prototype.mapToDB = function (model, data) {
    var dbData = {};
    if (!data) {
        return dbData;
    }
    var props = this._models[model].properties;
    for (var p in data) {
        if (props[p]) {
            var pType = props[p].type && props[p].type.name;
            if (pType === 'GeoPoint' && data[p]) {
                dbData[p] = '(' + data[p].lat + ',' + data[p].lng + ')';
            } else {
                dbData[p] = data[p];
            }
        }
    }
    return dbData;
}

/*!
 * Build a list of column name/value pairs
 *
 * @param {String} The model name
 * @param {Object} The model instance data
 * @param {Boolean} forCreate Indicate if it's for creation
 */
SQLiteDB.prototype.toFields = function (model, data, forCreate) {
    var self = this;
    var props = self._categorizeProperties(model, data);
    var dataIdNames = props.idsInData;
    var nonIdsInData = props.nonIdsInData;
    var query = [];
    if (forCreate) {
        if (nonIdsInData.length == 0 && dataIdNames.length == 0) {
            return 'default values ';
        }
        query.push('(');
        query.push(nonIdsInData.map(function (key) {
            return self.columnEscaped(model, key);
        }).join(','));
        if (dataIdNames.length > 0) {
            if (nonIdsInData.length > 0) {
                query.push(',');
            }
            query.push(dataIdNames.map(function (key) {
                return self.columnEscaped(model, key);
            }).join(','));
        }
        query.push(') VALUES (');
        for (var i = 1, len = nonIdsInData.length + dataIdNames.length; i <= len; i++) {
            query.push('$', i);
            if (i !== len) {
                query.push(',');
            }
        }
        query.push(') ');
    } else {
        query.push(nonIdsInData.map(function (key, i) {
            return self.columnEscaped(model, key) + "=$" + (i + 1)
        }).join(','));
    }

    return query.join('');
};


/*!
 * Convert name/value to database value
 *
 * @param {String} prop The property name
 * @param {*} val The property value
 */
SQLiteDB.prototype.toDatabase = function (prop, val) {
    if (val === null || val === undefined) {

        if (prop.autoIncrement) {
            return 'DEFAULT';
        }
        else {
            return 'NULL';
        }
    }

    if (val.constructor.name === 'Object') {

        var operator = Object.keys(val)[0]
        val = val[operator];
        if (operator === 'between') {
            return this.toDatabase(prop, val[0]) + ' AND ' + this.toDatabase(prop, val[1]);
        }
        if (operator === 'inq' || operator === 'nin') {
            for (var i = 0; i < val.length; i++) {
                val[i] = escape(val[i]);
            }
            return val.join(',');
        }
        return this.toDatabase(prop, val);
    }
    if (prop.type.name === 'Number') {
        if (!val && val !== 0) {
            if (prop.autoIncrement) {
                return 'DEFAULT';
            }
            else {
                return 'NULL';
            }
        }
        return escape(val);
    }

    if (prop.type.name === 'Date' || prop.type.name === 'DATETIME') {
        if (!val) {
            if (prop.autoIncrement) {
                return 'DEFAULT';
            }
            else {
                return 'NULL';
            }
        }
        if (!val) {
            if (prop.autoIncrement) {
                return 'DEFAULT';
            }
            else {
                return 'NULL';
            }
        }

        // Convert Date to timestamp to work with SQLite
        return val.getTime();

    }

    if (prop.type.name === 'Boolean') {
        if (val) {
            return 1;
        } else {
            return 0;
        }
    }

    if (prop.type.name === 'GeoPoint') {
        if (val) {
            return '(' + escape(val.lat) + ',' + escape(val.lng) + ')';
        } else {
            return 'NULL';
        }
    }

    return escape(val.toString());

};


/*!
 * Convert the data from database to JSON
 *
 * @param {String} model The model name
 * @param {Object} data The data from DB
 */
SQLiteDB.prototype.fromDatabase = function (model, data) {
    if (!data) {
        return null;
    }
    var props = this._models[model].properties;
    var json = {};
    for (var p in props) {
        var key = this.column(model, p);
        var val = data[key];
        if (val === undefined) {
            continue;
        }
        var prop = props[p];
        var type = prop.type && prop.type.name;
        if (prop && type === 'Boolean') {
            if (typeof val === 'number') {
                json[p] = ((val == 1) ? true : false);
            } else {
                json[p] = (val === 'Y' || val === 'y' || val === 'T' || val === 't' || val === '1');
            }
        } else if (prop && type === 'GeoPoint' || type === 'Point') {
            if (typeof val === 'string') {
                // The point format is (x,y)
                var point = val.split(/[\(\)\s,]+/).filter(Boolean);
                json[p] = {
                    lat: +point[0],
                    lng: +point[1]
                };
            } else if (typeof val === 'object' && val !== null) {
                // converts point to {x: lat, y: lng}
                json[p] = {
                    lat: val.x,
                    lng: val.y
                };
            } else {
                json[p] = val;
            }
        } else if (prop && type === 'Date') {
            json[p] = new Date(val);
        } else {
            json[p] = val;
        }
    }
    if (this.debug) {
        debug('JSON data: %j', json);
    }
    return json;
};


/*!
 * Categorize the properties for the given model and data
 * @param {String} model The model name
 * @param {Object} data The data object
 * @returns {{ids: String[], idsInData: String[], nonIdsInData: String[]}}
 * @private
 */
SQLiteDB.prototype._categorizeProperties = function (model, data) {
    var ids = this.idNames(model);
    var idsInData = ids.filter(function (key) {
        return data[key] !== null && data[key] !== undefined;
    });
    var props = Object.keys(this._models[model].properties);
    var nonIdsInData = Object.keys(data).filter(function (key) {
        return props.indexOf(key) !== -1 && ids.indexOf(key) === -1 && data[key] !== undefined;
    });

    return {
        ids: ids,
        idsInData: idsInData,
        nonIdsInData: nonIdsInData
    };
};


/**
 * Create a new model instance
 */
SQLiteDB.prototype.create = function create(model, data, callback) {

    var self = this;
    data = self.mapToDB(model, data);
    var props = self._categorizeProperties(model, data);
    var sql = [];
    sql.push('INSERT INTO ', self.tableEscaped(model), ' ',
        self.toFields(model, data, true));

    var idColName = self.idColumn(model);
    this.query(sql.join(''), generateQueryParams(data, props), function (err, lastUpdatedID) {
        if (err) {
            if (err.message.startsWith('SQLITE_CONSTRAINT: UNIQUE constraint failed')) {
                err.message = "Cannot create Duplicate id";
            }
            return callback(err);
        }

        callback(err, lastUpdatedID);
    });
};


/**
 * Save the model instance to SQLite DB
 * @param {String} model The model name
 * @param {Object} data The model instance data
 * @callback {Function} [callback] The callback function
 * @param {String|Error} err The error string or object
 */
SQLiteDB.prototype.save = function (model, data, callback) {
    var self = this;
    data = self.mapToDB(model, data);
    var props = self._categorizeProperties(model, data);

    var sql = [];
    sql.push('UPDATE ', self.tableEscaped(model), ' SET ', self.toFields(model, data));
    sql.push(' WHERE ');
    props.ids.forEach(function (id, i) {
        sql.push((i > 0) ? ' AND ' : ' ', self.idColumnEscaped(model), ' = $',
            (props.nonIdsInData.length + i + 1));
    });

    self.query(sql.join(''), generateQueryParams(data, props), function (err) {
        callback(err);
    });
};

SQLiteDB.prototype.update =
    SQLiteDB.prototype.updateAll = function (model, where, data, callback) {
        var whereClause = this.buildWhere(model, where);

        var sql = ['UPDATE ', this.tableEscaped(model), ' SET ',
            this.toFields(model, data), ' ', whereClause].join('');

        data = this.mapToDB(model, data);
        var props = this._categorizeProperties(model, data);

        this.query(sql, generateQueryParams(data, props), function (err, result) {
            if (callback) {
                callback(err, result);
            }
        });
    };


/**
 * Check if a model instance exists by id
 */
SQLiteDB.prototype.exists = function (model, id, callback) {
    var sql = 'SELECT 1 FROM ' +
        this.tableEscaped(model);

    if (id) {
        sql += ' WHERE ' + this.idColumnEscaped(model) + ' = ' + id + ' LIMIT 1';
    } else {
        sql += ' WHERE ' + this.idColumnEscaped(model) + ' IS NULL LIMIT 1';
    }

    this.query(sql, function (err, data) {
        if (err) return callback(err);
        callback(null, data.length === 1);
    });
};


/**
 * Find a model instance by id
 * @param {String} model The model name
 * @param {*} id The id value
 * @callback {Function} [callback] The callback function
 * @param {String|Error} err The error string or object
 * @param {Object} The model instance
 */
SQLiteDB.prototype.find = function find(model, id, callback) {
    var sql = 'SELECT * FROM ' +
        this.tableEscaped(model);

    if (id) {
        var idVal = this.toDatabase(this._models[model].properties[this.idName(model)], id);
        sql += ' WHERE ' + this.idColumnEscaped(model) + ' = ' + idVal + ' LIMIT 1';
    }
    else {
        sql += ' WHERE ' + this.idColumnEscaped(model) + ' IS NULL LIMIT 1';
    }

    this.query(sql, function (err, data) {
        if (data && data.length === 1) {
            // data[0][this.idColumn(model)] = id;
        } else {
            data = [null];
        }
        callback(err, this.fromDatabase(model, data[0]));
    }.bind(this));
};


/*!
 * Get a list of columns based on the fields pattern
 *
 * @param {String} model The model name
 * @param {Object|String[]} props Fields pattern
 * @returns {String}
 */
SQLiteDB.prototype.getColumns = function (model, props) {
    var cols = this._models[model].properties;
    var self = this;
    var keys = Object.keys(cols);
    if (Array.isArray(props) && props.length > 0) {
        // No empty array, including all the fields
        keys = props;
    } else if ('object' === typeof props && Object.keys(props).length > 0) {
        // { field1: boolean, field2: boolean ... }
        var included = [];
        var excluded = [];
        keys.forEach(function (k) {
            if (props[k]) {
                included.push(k);
            } else if ((k in props) && !props[k]) {
                excluded.push(k);
            }
        });
        if (included.length > 0) {
            keys = included;
        } else if (excluded.length > 0) {
            excluded.forEach(function (e) {
                var index = keys.indexOf(e);
                keys.splice(index, 1);
            });
        }
    }
    var names = keys.map(function (c) {
        return self.columnEscaped(model, c);
    });
    return names.join(', ');
};


/**
 * Find matching model instances by the filter
 *
 * @param {String} model The model name
 * @param {Object} filter The filter
 * @callback {Function} [callback] The callback function
 * @param {String|Error} err The error string or object
 * @param {Object[]} The matched model instances
 */
SQLiteDB.prototype.all = function all(model, filter, callback) {
    var self = this;

    // SQLite has a characterstic of sorting the resultset by 'id'
    // So, we reset the resutset to mimic the normal resultset
    // 'ORDER BY' is only performed when explicitely asked.
    filter = filter || {};
    if (!filter.order) {
        var idNames = this.idNames(model);
        if (idNames && idNames.length) {
            filter.order = idNames;
        }

        if (filter.where != undefined) {
            if (filter.order == 'id' && filter.where.id != undefined) {
                if (filter.where.id.inq != undefined) {
                    for (var i = 0; i < filter.where.id.inq.length; i++) {
                        self.current_order.push(filter.where.id.inq[i])
                    }
                }
            }
        }
    }

    function reset_order(data) {
        var temp_data = [];
        for (var i = 0; i < self.current_order.length; i++) {
            for (var j = 0; j < data.length; j++) {
                if (self.current_order[i] == data[j].id) {
                    temp_data.push(data[j]);
                    break;
                }
            }
        }
        return temp_data;
    }

    this.query('SELECT ' + this.getColumns(model, filter.fields) + '  FROM '
        + this.toFilter(model, filter), function (err, data) {
        if (err) {
            return callback(err, []);
        }
        if (data) {
            for (var i = 0; i < data.length; i++) {
                data[i] = this.fromDatabase(model, data[i]);
            }
        }

        if (filter && filter.include) {
            this._models[model].model.include(data, filter.include, callback);
        } else {
            var data_temp = [];
            if (self.current_order != []) {
                data_temp = reset_order(data);
                self.current_order = [];
            }

            callback(null, (data_temp.length != 0) ? data_temp : data);
        }
    }.bind(this));
};


/**
 * Delete all model instances
 */
SQLiteDB.prototype.destroyAll = function destroyAll(model, where, callback) {
    if (!callback && 'function' === typeof where) {
        callback = where;
        where = undefined;
    }
    this.query('DELETE FROM '
        + ' ' + this.toFilter(model, where && {where: where}), function (err, data) {
        callback && callback(err, data);
    }.bind(this));
};


/**
 * Count the number of instances for the given model
 *
 * @param {String} model The model name
 * @param {Function} [callback] The callback function
 * @param {Object} filter The filter for where
 *
 */
SQLiteDB.prototype.count = function count(model, callback, filter) {
    this.query('SELECT count(*) as "cnt"  FROM '
        + ' ' + this.toFilter(model, filter && {where: filter}), function (err, data) {
        if (err) return callback(err);
        var c = data && data[0] && data[0].cnt;
        callback(err, Number(c));
    }.bind(this));
};


function getPagination(filter) {
    var pagination = [];
    if (filter && (filter.limit || filter.offset || filter.skip)) {
        var limit = Number(filter.limit);
        if (limit) {
            pagination.push('LIMIT ' + limit);
        }
        var offset = Number(filter.offset);
        if (!offset) {
            offset = Number(filter.skip);
        }
        if (offset) {
            pagination.push('OFFSET ' + offset);
        } else {
            offset = 0;
        }
    }
    return pagination;
}


SQLiteDB.prototype.buildWhere = function (model, conds) {
    var where = this._buildWhere(model, conds);
    if (where) {
        return ' WHERE ' + where;
    } else {
        return '';
    }
};


SQLiteDB.prototype._buildWhere = function (model, conds) {
    if (!conds) {
        return '';
    }
    var self = this;
    var props = self._models[model].properties;
    var fields = [];
    if (typeof conds === 'string') {
        fields.push(conds);
    } else if (util.isArray(conds)) {
        var query = conds.shift().replace(/\?/g, function (s) {
            return escape(conds.shift());
        });
        fields.push(query);
    } else {
        var sqlCond = null;
        Object.keys(conds).forEach(function (key) {
            if (key === 'and' || key === 'or') {
                var clauses = conds[key];
                if (Array.isArray(clauses)) {
                    clauses = clauses.map(function (c) {
                        return '(' + self._buildWhere(model, c) + ')';
                    });
                    return fields.push(clauses.join(' ' + key.toUpperCase() + ' '));
                }
                // The value is not an array, fall back to regular fields
            }
            if (conds[key] && conds[key].constructor.name === 'RegExp') {
                var regex = conds[key];
                sqlCond = self.columnEscaped(model, key);

                if (regex.ignoreCase) {
                    sqlCond += ' ~* ';
                } else {
                    sqlCond += ' ~ ';
                }

                sqlCond += "'" + regex.source + "'";

                fields.push(sqlCond);

                return;
            }
            if (props[key]) {
                var filterValue = self.toDatabase(props[key], conds[key]);
                if (filterValue === 'NULL') {
                    fields.push(self.columnEscaped(model, key) + ' IS ' + filterValue);
                } else if (conds[key].constructor.name === 'Object') {
                    var condType = Object.keys(conds[key])[0];
                    sqlCond = self.columnEscaped(model, key);
                    if ((condType === 'inq' || condType === 'nin') && filterValue.length === 0) {
                        fields.push(condType === 'inq' ? '1 = 2' : '1 = 1');
                        return true;
                    }
                    switch (condType) {
                        case 'gt':
                            sqlCond += ' > ';
                            break;
                        case 'gte':
                            sqlCond += ' >= ';
                            break;
                        case 'lt':
                            sqlCond += ' < ';
                            break;
                        case 'lte':
                            sqlCond += ' <= ';
                            break;
                        case 'between':
                            sqlCond += ' BETWEEN ';
                            break;
                        case 'inq':
                            sqlCond += ' IN ';
                            break;
                        case 'nin':
                            sqlCond += ' NOT IN ';
                            break;
                        case 'neq':
                            sqlCond += ' != ';
                            break;
                        case 'like':
                            sqlCond += ' LIKE ';
                            filterValue += "ESCAPE '\\'";
                            break;
                        case 'nlike':
                            sqlCond += ' NOT LIKE ';
                            filterValue += "ESCAPE '\\'";
                            break;
                        default:
                            sqlCond += ' ' + condType + ' ';
                            break;
                    }
                    sqlCond += (condType === 'inq' || condType === 'nin')
                        ? '(' + filterValue + ')' : filterValue;
                    fields.push(sqlCond);
                } else {
                    fields.push(self.columnEscaped(model, key) + ' = ' + filterValue);
                }
            }
        });
    }
    return fields.join(' AND ');
};


/*!
 * Build the SQL clause
 * @param {String} model The model name
 * @param {Object} filter The filter
 * @returns {*}
 */
SQLiteDB.prototype.toFilter = function (model, filter) {

    var self = this;
    if (filter && typeof filter.where === 'function') {
        return self.tableEscaped(model) + ' ' + filter.where();
    }

    if (!filter) {
        return self.tableEscaped(model);
    }
    var out = self.tableEscaped(model) + ' ';
    var where = self.buildWhere(model, filter.where);
    if (where) {
        out += where;
    }

    var pagination = getPagination(filter);

    if (filter.order) {
        var order = filter.order;
        if (typeof order === 'string') {
            order = [order];
        }
        var orderBy = '';
        filter.order = [];
        for (var i = 0, n = order.length; i < n; i++) {
            var t = order[i].split(/[\s]+/);
            var field = t[0], dir = t[1];
            filter.order.push(self.columnEscaped(model, field) + (dir ? ' ' + dir : ''));
        }
        orderBy = ' ORDER BY ' + filter.order.join(',');
        if (pagination.length) {
            out = out + ' ' + orderBy + ' ' + pagination.join(' ');
        } else {
            out = out + ' ' + orderBy;
        }
    } else {
        if (pagination.length) {
            out = out + ' '
                + pagination.join(' ');
        }
    }
    return out;
};

/*!
 * Find the column type for a given model property
 *
 * @param {String} model The model name
 * @param {String} property The property name
 * @returns {String} The column type
 */
SQLiteDB.prototype.columnDataType = function (model, property) {
    var columnMetadata = this.columnMetadata(model, property);
    var colType = columnMetadata && columnMetadata.dataType;
    if (colType) {
        colType = colType.toUpperCase();
    }
    var prop = this._models[model].properties[property];
    if (!prop) {
        return null;
    }
    var colLength = columnMetadata && columnMetadata.dataLength || prop.length;
    if (colType) {
        return colType + (colLength ? '(' + colLength + ')' : '');
    }

    switch (prop.type.name) {
        default:
        case 'String':
        case 'JSON':
            return 'TEXT';
        case 'Text':
            return 'TEXT';
        case 'Number':
            return 'INTEGER';
        case 'Date':
            return 'DATETIME';
        case 'Timestamp':
            return 'DATETIME';
        case 'GeoPoint':
        case 'Point':
            return 'POINT';
        case 'Boolean':
            return 'BOOLEAN';
    }
};


function escape(val) {
    if (val === undefined || val === null) {
        return 'NULL';
    }

    switch (typeof val) {
        case 'boolean':
            return (val) ? "true" : "false";
        case 'number':
            return val + '';
    }

    if (typeof val === 'object') {
        val = (typeof val.toISOString === 'function')
            ? val.toISOString()
            : val.toString();
    }

    val = val.replace(/[\0\n\r\b\t\\\'\"\x1a]/g, function (s) {
        switch (s) {
            case "\0":
                return "\\0";
            case "\n":
                return "\\n";
            case "\r":
                return "\\r";
            case "\b":
                return "\\b";
            case "\t":
                return "\\t";
            case "\x1a":
                return "\\Z";
            case "\'":
                return "''";
            case "\"":
                return s;
            default:
                return "\\" + s;
        }
    });
    // return "q'#"+val+"#'";
    return "'" + val + "'";
}

function propertyCanBeNull(model, propName) {
    var p = this._models[model].properties[propName];
    if (p.required || p.id) {
        return false;
    }
    return !(p.allowNull === false ||
        p['null'] === false || p.nullable === false);
}

function generateQueryParams(data, props) {
    var queryParams = [];

    function pushToQueryParams(key) {
        queryParams.push(data[key] !== undefined ? data[key] : null);
    }

    props.nonIdsInData.forEach(pushToQueryParams);
    props.idsInData.forEach(pushToQueryParams);

    return queryParams;
}

// Polyfill for String startsWith
if (!String.prototype.startsWith) {
    String.prototype.startsWith = function (searchString, position) {
        position = position || 0;
        return this.lastIndexOf(searchString, position) === position;
    };
}
