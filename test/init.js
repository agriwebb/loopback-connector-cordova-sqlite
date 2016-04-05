
module.exports = require('should');
var DataSource = require('loopback-datasource-juggler').DataSource;

var config = {
 "test": {
   "name"         : "cordova-sqlite",
   "file_name"    : "test.sqlite",
   "debug"        : false
 }
};

global.getDataSource = global.getSchema = function (customConfig) {
 console.log('GETTING DATASOURCE');
 var db = new DataSource(require('../'), customConfig || config.test);

  db.log = function (msg) {
   console.log(msg);
  };

 return db;
};
