// require('./init');
var expect = require('chai').expect;
var DataSource = require('loopback-datasource-juggler').DataSource;
var ds;

var sqliteConnector = require('..');
document.addEventListener("DOMContentLoaded", onDOMContentLoaded, false);

function onDOMContentLoaded() {
  console.debug('RRRRRRRRRRRRRRRRRRRRRRRRRRREEEEEEEAAAAAAAAAADDDDDDDYYYYYYYYYY');

  if(window.parent.parent.cordova) {
    console.debug('CORDOVA AVAILABLE');

    ds = new DataSource({
      connector: sqliteConnector,
      name     : 'cordova-sqlite',
      file_name: 'test.sqlite',
      debug    : false
    });

    ds.on('connected', onConnected);

    function onConnected() {
      describe("SQLite3 connection test", function () {
        this.timeout(15000);
        it('should connect to sqlite3 DB', function (done) {
          ds.ping(function (err) {
            expect(err).to.not.be.undefined;
            expect(err).to.be.null;
            ds.connector.disconnect();
            done();
          });

        });
      });
    }
  }
}

