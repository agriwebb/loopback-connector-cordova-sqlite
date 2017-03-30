/**
 * Created by tushar-chauhan on 13-Mar-2015
 */

var SqlConnector = require('loopback-connector').SqlConnector,
    util  = require('util'),
    async = require('async');
var debug = require('debug')('loopback:connector:cordova-sqlite');

var NAME = 'cordova-sqlite';

/**
 * Initialize the SQLite connector for the given data source
 * @param {DataSource} dataSource The data source instance
 * @param {Function} [callback] The callback function
 */
exports.initialize = function initializeDataSource(dataSource, callback) {
  if (!window.sqlitePlugin) {
    console.error('You need to have the "cordova-sqlite-storage" plugin installed');
    return;
  }
  else {
    dataSource.driver = window.sqlitePlugin;
    var dbSettings = dataSource.settings || {};
    var connector = new SQLiteDB(window.sqlitePlugin, dbSettings);
    dataSource.connector = connector;
    dataSource.connector.dataSource = dataSource;

    dataSource.connector.dataSource.log = function (msg) {
      debug(msg);
    };

    if (callback) {
      dataSource.connecting = true;
      dataSource.connector.connect(callback);
    }
  }
};

/**
 * Constructor for SQLite connector
 * @param {Object} settings The settings object
 * @param {DataSource} dataSource The data source
 * instance
 * @constructor
 */
var SQLiteDB = function(sqlite3, dbSettings) {
  if (!(this instanceof SQLiteDB)) {
    return new SQLiteDB(sqlite3, dbSettings);
  }

  this.constructor.super_.call(this, NAME, dbSettings);

  this.name = NAME;
  this.settings = dbSettings;
  this.sqlite3 = sqlite3;
  this.debugMode = dbSettings.debug;
  this.current_order = [];
  this.file_name = dbSettings.file_name;
  this.location  = dbSettings.location;
  debug('Settings '+ JSON.stringify(dbSettings));
};

util.inherits(SQLiteDB, SqlConnector);
require('./migration')(SQLiteDB);
require('./transaction')(SQLiteDB);

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
  callback = bindDomain(process.domain, callback);
  var self = this;
  var file_name = ((self.file_name !== null) ? self.file_name : 'DB');
  var location  = ((self.location !== null)  ? self.location : 'default');
  var err = null;
  if(self.client === undefined) {
    // iosDatabaseLocation option may be set to one of the following choices:
    //
    // 'default': Library/LocalDatabase subdirectory - NOT visible to iTunes and NOT backed up by iCloud
    // 'Library': Library subdirectory - backed up by iCloud, NOT visible to iTunes
    // 'Documents': Documents subdirectory - visible to iTunes and backed up by iCloud
    self.client = self.sqlite3.openDatabase(
        {
          name: file_name,
          iosDatabaseLocation: location
        },
        function success(result) {
          self.dataSource.connected = true;
          self.dataSource.connecting = false;
          self.dataSource.emit('connected');
          debug("Connected to Database!");
        },
        function error(error) {
          err = error;
          debug("Not Connected", err);
        });
    callback(err, self.client);
  } else {
    callback(err, self.client);
  }
};

SQLiteDB.prototype.getTypes = function onGetTypes() {
  return ['db', 'sqlite', 'sqlite3'];
};

SQLiteDB.prototype.disconnect = function disconnect(cb) {
  this.client.close(cb);
};

SQLiteDB.prototype.ping = function(cb) {
  this.query('SELECT 100 AS result', [], cb);
};

SQLiteDB.prototype.getTransaction = function (options, cb) {
  if (options.transaction) {
    cb(options.transaction);
  } else if (options.readOnlyTx) {
    this.client.readTransaction(cb);
  } else {
    this.client.transaction(cb);
  }
}

SQLiteDB.prototype.executeSQL = function (sql, params, options, callback) {

  if(callback === undefined && typeof options === 'function') {
    callback = options;
  }

  window.sqlStmtIndx = window.sqlStmtIndx || 0;
  var sqlStmtIndx_ = window.sqlStmtIndx; // cache this value for use in closure, since window.sqlStmtIndx is updated by multiple closures, and hence reports incorrect value when logged.
  var self = this;

  if (params.status && sql.startsWith('PRAGMA')) {
    self.getTransaction(options, function(tx) {
      tx.executeSql(sql, params, function success(rtx, result) {
        debug('['+sqlStmtIndx_+'] Success: '+sql+' called with params: ['+ params + ']');
        var new_rows = [];
        for (var i = 0; i < result.rows.length; i++) {
          var temp = {};
          temp['column'] = result.rows.item(i).name;
          temp['type'] = result.rows.item(i).type;
          temp['nullable'] = (result.rows.item(i).notnull == 0) ? 'YES' : 'NO';
          new_rows.push(temp);
        }

        debug('['+sqlStmtIndx_+'] Result: '+JSON.stringify(new_rows));
        callback && callback(null, new_rows);
      }, function error(rtx, error) {
        console.error('['+sqlStmtIndx_+'] Fail: '+sql+' called with params: ['+ params + ']');
        console.error(error.message+': '+error.code);
        callback && callback(error, [])
      });
      window.sqlStmtIndx++;

    });
  } else if (sql.startsWith('INSERT') || sql.startsWith('UPDATE') ||
      sql.startsWith('DELETE') || sql.startsWith('CREATE') || sql.startsWith('DROP')) {

    self.getTransaction(options, function (tx) {
      tx.executeSql(sql, params, function success(rtx, result) {
        debug('['+sqlStmtIndx_+'] Success: '+sql+' called with params: ['+ params + ']');

        var result_;
        if (sql.startsWith('UPDATE') || sql.startsWith('DELETE')) {
          result_ = {count: result.rowsAffected};
        } else {
          result_ = result.insertId;
        }
        debug('['+sqlStmtIndx_+'] Result: '+JSON.stringify(result_));
        callback(null, result_);
      }, function error(rtx, error) {
        console.error('['+sqlStmtIndx_+'] Fail: '+sql+' called with params: ['+ params + ']');
        console.error(error.message+': '+error.code);
        callback && callback(error, null);
      });
    });

    window.sqlStmtIndx++;

  } else {
    // Only force read transaction for SELECT, some non-read-only commands fall through to here
    var newOptions = options;
    if (sql.startsWith('SELECT')) {
      newOptions = Object.assign({}, options, { readOnlyTx: true });
    }

    self.getTransaction(newOptions, function (tx) {
      tx.executeSql(sql, params, function success(rtx, result) {
        debug('['+sqlStmtIndx_+'] Success: '+sql+' called with params: ['+ params + ']');

        var data_ = [];
        for (var i_ = 0; i_ < result.rows.length; i_++) {
          data_.push(result.rows.item(i_));
        }
        debug('['+sqlStmtIndx_+'] Result: '+JSON.stringify(data_));
        callback && callback(null, data_);
      }, function error(rtx, error) {
        console.error('['+sqlStmtIndx_+'] Fail: '+sql+' called with params: ['+ params + ']');
        console.error(error.message+': '+error.code);
        callback && callback(error, data);
      });
    });
    window.sqlStmtIndx++;
  }
};

SQLiteDB.prototype.query = function (sql, params, callback) {

  if (!callback && typeof params === 'function') {
    callback = params;
    params = [];
  }

  //for(var i=0; i < params.length; i++){
  //  if(typeof params[i] == 'object') {
  //    // Exclude Date objects from getting converted
  //    if(isNaN(new Date(params[i]).getTime())) {
  //      params[i] = JSON.stringify(params[i]);
  //    }
  //  }
  //}

  this.executeSQL(sql, params, callback);
};


SQLiteDB.prototype.tableEscaped = function (model) {
  return this.escapeName(this.table(model));
};

SQLiteDB.prototype.escapeName = function (name) {
  if (!name) {
    return name;
  }
  if ((name.indexOf('.') === -1) && (name.indexOf('-') === -1)) {
    return name;
  }
  return '"' + name.replace(/\./g, '"."') + '"';
};


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
    if(nonIdsInData.length === 0 && dataIdNames.length === 0) {
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
      return self.columnEscaped(model, key) + "=$" + (i + 1);
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

  if (val.constructor.name === 'Object' && prop.type.name !== 'Object') {

    var operator = Object.keys(val)[0];
    val = val[operator];
    if (operator === 'between') {
      return this.toDatabase(prop, val[0]) + ' AND ' + this.toDatabase(prop, val[1]);
    }
    if (operator === 'inq' || operator === 'nin') {
      var ret = [];
      for (var i = 0; i < val.length; i++) {
        ret[i] = escape(val[i]);
      }
      return ret.join(',');
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

  if (prop.type.name === 'Object') {
    var retval;
    if (typeof val !== 'string') {
      retval = JSON.stringify(val);
    } else {
      retval = val;
    }
    return retval;
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
  try {
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
        if (val !== 'NULL' && val !== null) {
          json[p] = new Date(val);
        }
        else {
          json[p] = null;
        }
      } else if (prop && type === 'Object') {
        if (val !== 'NULL' && val !== null) {
          try {
            json[p] = JSON.parse(val);
          }
          catch(err) {
            json[p] = null;
          }
        }
        else {
          json[p] = null;
        }
      } else {
        json[p] = val;
      }
    }
    return json;
  }
  catch (err) {
    console.error(err);
    return null;
  }
};


/*!
 * Categorize the properties for the given model and data
 * @param {String} model The model name
 * @param {Object} data The data object
 * @returns {{ids: String[], idsInData: String[], nonIdsInData: String[]}}
 * @private
 */
SQLiteDB.prototype._categorizeProperties = function(model, data) {
  var ids = this.idNames(model);
  var idsInData = ids.filter(function(key) {
    return data[key] !== null && data[key] !== undefined;
  });
  var props = Object.keys(this._models[model].properties);
  var nonIdsInData = Object.keys(data).filter(function(key) {
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
      if(err.message.startsWith('SQLITE_CONSTRAINT: UNIQUE constraint failed')) {
        err.message = "Cannot create Duplicate id";
      }
      return callback(err);
    }

    callback(err, data[idColName] || lastUpdatedID);
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
    SQLiteDB.prototype.updateAll = function (model, where, data, options, callback) {
      var whereClause = this.buildWhere(model, where);

      var sql = ['UPDATE ', this.tableEscaped(model), ' SET ',
        this.toFields(model, data), ' ', whereClause].join('');

      data = this.mapToDB(model, data);
      var props = this._categorizeProperties(model, data);

      this.query(sql, generateQueryParams(data, props), function (err, result) {
        if (callback) {
          var count;
          if (Array.isArray(result)) {
            count = result.length;
          }
          else {
            count = 1;
          }
          callback(err, {count: count});
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
    var convertedData = this.fromDatabase(model, data[0]);

    callback(err, convertedData);
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
SQLiteDB.prototype.all = function all(model, filter, options, callback) {
  var self = this;

  if (callback === undefined && options === undefined && typeof filter === 'function') {
    callback = filter;
    filter = [];
    options = {};
  }

  if (callback === undefined && typeof options === 'function') {
    callback = options;
    options = {};
  }

  // SQLite has a characterstic of sorting the resultset by 'id'
  // So, we reset the resutset to mimic the normal resultset
  // 'ORDER BY' is only performed when explicitely asked.
  filter = filter || [];
  if (!filter.order) {
    var idNames = this.idNames(model);
    if (idNames && idNames.length) {
      filter.order = idNames;
    }

    if(filter.where !== undefined) {
      if(filter.order === 'id' && filter.where.id !== undefined) {
        if(filter.where.id.inq !== undefined){
          for(var i=0; i < filter.where.id.inq.length; i++) {
            if(self.current_order.indexOf(filter.where.id.inq[i]) < 0 )
              self.current_order.push(filter.where.id.inq[i]);
          }
        }
      }
    }
  }

  function reset_order(data) {
    var temp_data = [];
    for(var i=0; i< self.current_order.length; i++) {
      for(var j=0; j< data.length; j++) {
        if(self.current_order[i] == data[j].id){
          temp_data.push(data[j]);
          break;
        }
      }
    }
    return temp_data;
  }

  this.query('SELECT ' + this.getColumns(model, filter.fields) + '  FROM ' +
      this.toFilter(model, filter), function (err, data) {
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
      if(self.current_order != []) {
        data_temp = reset_order(data);
        self.current_order = [];
      }

      callback(null, (data_temp.length !== 0) ? data_temp : data);
    }
  }.bind(this));
};


/**
 * Delete all model instances
 */
SQLiteDB.prototype.destroyAll = function destroyAll(model, where, options, callback) {
  if (!callback && !options && 'function' === typeof where) {
    callback = where;
    options = undefined;
    where = undefined;
  }

  if (!callback && 'function' === typeof options) {
    callback = options;
    options = undefined;
  }

  this.query('DELETE FROM ' + ' ' + this.toFilter(model, where && {where: where}), function (err, data) {
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
  this.query('SELECT count(*) as "cnt"  FROM ' + ' ' + this.toFilter(model, filter && {where: filter}), function (err, data) {
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
        } else if (props[key].type.name === 'Object') {
          // not using fields with type = 'object' in where clauses. They're unreliable in matching
        } else if (typeof(filterValue) === 'string' && filterValue.match(/\\n/)) {
          console.warn('NOT using '+key+' in WHERE clause because it contains newlines')
          // not using fields that contain newlines in where clauses. They will never match
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
          sqlCond += (condType === 'inq' || condType === 'nin') ? '(' + filterValue + ')' : filterValue;
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
      out = out + ' ' + pagination.join(' ');
    }
  }
  return out;
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
    val = (typeof val.toISOString === 'function') ? val.toISOString()
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

function generateQueryParams(data, props) {
  var queryParams = [];

  function pushToQueryParams(key) {
    queryParams.push(data[key] !== undefined && data[key] !== null && data[key] !== 'NULL' ? data[key] : null);
  }

  props.nonIdsInData.forEach(pushToQueryParams);
  props.idsInData.forEach(pushToQueryParams);

  return queryParams;
}

function bindDomain(domain, cb) {
  if (domain && cb) {
    cb = domain.bind(cb);
  }
  return cb;
}

// Polyfill for String startsWith
if (!String.prototype.startsWith) {
  String.prototype.startsWith = function(searchString, position) {
    position = position || 0;
    return this.lastIndexOf(searchString, position) === position;
  };
}

