How to build and run the server
===============================
npm install
bower install
grunt quick-build
grunt quick-serve

How to run the client
=====================
cd client/ionicApp
ionic serve



IMPORTANT tweak to loopback, needed when building browser.bundle.js for device
==============================================================================
1) node_modules/loopback/node_modules/strong-remoting/node_modules/request/request.js 499 -> self.protocol = self.uri.protocol







How to debug gruntfile
======================
1) DOUBLY ENSURE THAT YOU DO THIS, npm install -g node-inspector
2) In one terminal window, node-inspector --web-port='YOUR FAVORITE PORT NUMBER :)'
3a) e.g. 1, In another terminal window, node --debug-brk /usr/local/bin/grunt serve
3b) e.g. 2, In another terminal window, node --debug-brk server/bin/autoUpdate.js
4) Use Chrome to navigate to URL mentioned in output of Step 2.


How to debug this project
=========================
1) node-debug -p 'YOUR FAVORITE PORT NUMBER :)' server/server.js


Install a package that is sitting in a folder on the filesystem.
================================================================
1) npm install <folder>:


Uinstall a package
==================
1) npm uninstall <package-name> --save / --save-dev


Add a new connector
==================
1) Add the following to node_modules/loopback/index.js
// { TG1e
//loopback.LocalForage = require('loopback-connector-localForage');
//loopback.iDBH = require('loopback-connector-iDBH');
loopback.sqlite = require('loopback-connector-sqlite');
// } --

2) Add the following to node_modules/loopback/lib/loopback.js -> createApplication()
// { TG1e
//app.connector('localForage', loopback.LocalForage);
//app.connector('iDBH', loopback.iDBH);
app.connector('sqlite', loopback.sqlite);
// } --


loopback breakpoint - to track a server REST HTTP request
=========================================================
1) node_modules/loopback/node_modules/strong-remoting/lib/rest-adapter.js 124 -> RestAdapter.prototype.invoke
2) node_modules/loopback/node_modules/strong-remoting/lib/http-invocation.js 226 -> HttpInvocation.prototype.invoke


loopback breakpoint - to track a SQL query execution
====================================================
node_modules/loopback-connector-mysql/lib/mysql.js -> MySQL>prototype.executeSQL
node_modules/loopback-connector-mysql/node_modules/loopback-connector/lib/sql.js


loopback breakpoint - to track PersistedModel
=============================================
node_modules/loopback/lib/persisted-model.js -> PersistedModel.checkpoint


Running server with debug logs enabled
======================================
http://docs.strongloop.com/display/public/LB/Setting+debug+strings
DEBUG=loopback:connector*,loopback:change* node server/server.js

