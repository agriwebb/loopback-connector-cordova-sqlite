// require('./init');
var DataSource = require('loopback-datasource-juggler').DataSource;
var ds;

var sqliteConnector = require('..');

describe("SQLite3 connection test", function () {
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 15000;
  beforeEach(function(done) {
    window.cordova = window.parent.cordova;
    window.sqlitePlugin = window.parent.sqlitePlugin;

    ds = new DataSource({
      connector: sqliteConnector,
      name     : 'cordova-sqlite',
      file_name: 'test.sqlite',
      debug    : false
    });

    ds.on('connected', done);
  });

  it('should connect to sqlite3 DB', function (next) {
    console.debug('ping')
    ds.ping(function (err) {
      expect(err).toBeDefined();
      expect(err).toBeNull;
      next();
    });

  });
});
