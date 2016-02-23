## loopback-connector-sqlite [![Build Status](https://travis-ci.org/Synerzip/loopback-connector-sqlite.svg)](https://travis-ci.org/Synerzip/loopback-connector-sqlite)
[**LoopBack**](http://loopback.io/) is a highly-extensible, open-source Node.js framework that enables you to create dynamic end-to-end REST APIs with little or no coding. It also enables you to access data from major relational databases, MongoDB, SOAP and REST APIs.

**loopback-connector-sqlite** is the SQLite3 connector module for [loopback-datasource-juggler](https://github.com/strongloop/loopback-datasource-juggler).

## Basic usage
You will require [loopback-datasource-juggler](https://github.com/strongloop/loopback-datasource-juggler) and [node-sqlite3](https://github.com/mapbox/node-sqlite3) modules for using this connector.
The SQLite3 database can be configured to operate in 2 ways: with a DB file name and anonymous in-memory DB.
This connector needs 2 configuration parameters:
* `file_name`(string): A file name for SQLite DB file. It can have any string value for file based SQLite usage and `null` for in-memory usage.
* `debug`(boolean): Used for disabling and enabling logging.

A DataSource with basic settings can be defined as shown below:
```javascript
var DataSource = require('loopback-datasource-juggler').DataSource;
var dataSource = new DataSource(require('../index'), {
  file_name: 'dev.sqlite3',
  debug: false
});
```

Checkout `examples\example.js` to get the idea of basic usage.
Run the example from the root directory as follows:
```sh
node examples/example.js
```

## SQLite3 configuration for tests
The `.loopbackrc` file holds the settings for the tests. It's in JSON format and has following content:
* For file based SQLite testing
```JSON
{
  "sqlite": {
    "test": {
      "file_name": "test.sqlite3",
      "debug": false
    }
  }
}
```
* For anonymous in-memory SQLite testing
```JSON
{
  "sqlite": {
    "test": {
      "file_name": null,
      "debug": false
    }
  }
}
```
The `file_name` is the name of the sqlite3 DB file, which will be created, or, used if already present.
The `debug` value is to set debugging mode.

## Running the tests
* execute `npm install` for installing all the dependencies.
* execute `npm test` to run all the tests.
